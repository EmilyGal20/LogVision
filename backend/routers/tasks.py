from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import datetime, timedelta

from database import SessionLocal
from models import TaskAssignment, Log, User, Notification
from schemas import TaskAssignCreate, TaskOut
from auth_dependencies import require_user, require_admin

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


SLA_BY_SEVERITY = {
    "critical": 4,
    "high": 8,
    "medium": 24,
    "low": 72,
}


def _sla_hours(severity: str) -> int:
    return SLA_BY_SEVERITY.get(str(severity or "").lower(), 24)


def _sla_status(due_at: Optional[datetime]) -> str:
    if not due_at:
        return "not_set"
    now = datetime.utcnow()
    if due_at <= now:
        return "overdue"
    if due_at <= now + timedelta(hours=2):
        return "due_soon"
    return "healthy"


def _to_task_out(task: TaskAssignment, user_map: dict[int, User]) -> dict:
    assigned_type = None
    assigned_user = None
    assigned_org = None
    if task.assigned_user_id:
        assigned_type = "user"
        assigned_user = user_map.get(task.assigned_user_id).username if user_map.get(task.assigned_user_id) else None
    elif task.assigned_org_id:
        assigned_type = "org"
        assigned_org = task.assigned_org_id

    return {
        "id": task.id,
        "log_id": task.log_id,
        "org_id": task.org_id,
        "assigned_type": assigned_type,
        "assigned_user": assigned_user,
        "assigned_org": assigned_org,
        "assigned_value": assigned_user or assigned_org,
        "status": task.status,
        "severity": task.severity,
        "sla_hours": task.sla_hours,
        "due_at": task.due_at,
        "sla_status": _sla_status(task.due_at),
        "last_reminder_at": task.last_reminder_at,
    }


@router.get("/", response_model=List[TaskOut], dependencies=[Depends(require_user)])
def list_tasks(
    org_id: Optional[int] = None,
    assigned: Optional[str] = None,  # me | org | all
    db: Session = Depends(get_db),
    user=Depends(require_user),
):
    query = db.query(TaskAssignment)
    if user.role != "super_admin":
        query = query.filter(TaskAssignment.org_id == user.org_id)
        if user.role not in ["admin", "org_admin"]:
            query = query.filter(
                or_(
                    TaskAssignment.assigned_user_id == user.id,
                    TaskAssignment.assigned_org_id == user.org_id,
                )
            )
    elif org_id:
        query = query.filter(TaskAssignment.org_id == org_id)

    tasks = query.order_by(TaskAssignment.updated_at.desc()).all()
    user_ids = {t.assigned_user_id for t in tasks if t.assigned_user_id}
    users = db.query(User).filter(User.id.in_(user_ids)).all() if user_ids else []
    user_map = {u.id: u for u in users}

    items = [_to_task_out(t, user_map) for t in tasks]

    if assigned == "me":
        items = [t for t in items if t.get("assigned_type") == "user" and t.get("assigned_user") == user.username]
    elif assigned == "org":
        items = [t for t in items if t.get("assigned_type") == "org" and t.get("assigned_org") == user.org_id]

    return items


@router.post("/assign", response_model=TaskOut, dependencies=[Depends(require_admin)])
def assign_task(
    payload: TaskAssignCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    log = db.query(Log).filter(Log.id == payload.log_id).first()
    if not log:
        raise HTTPException(404, "Log not found")
    if user.role != "super_admin" and log.org_id != user.org_id:
        raise HTTPException(403, "Cross-org assignment forbidden")

    task = db.query(TaskAssignment).filter(TaskAssignment.log_id == log.id).first()
    if not task:
        task = TaskAssignment(
            log_id=log.id,
            org_id=log.org_id,
            status=log.status or "open",
            severity=log.severity or "Low",
        )

    assignee_type = payload.assignee_type
    assignee_value = payload.assignee_value

    task.assigned_user_id = None
    task.assigned_org_id = None
    if assignee_type == "user" and assignee_value:
        q = db.query(User).filter(User.username == assignee_value)
        if user.role != "super_admin":
            q = q.filter(User.org_id == log.org_id)
        assignee = q.first()
        if not assignee:
            raise HTTPException(404, "Assignee user not found")
        task.assigned_user_id = assignee.id
    elif assignee_type == "org" and assignee_value:
        try:
            org_id = int(assignee_value)
        except Exception:
            raise HTTPException(400, "Invalid org assignee")
        if org_id != log.org_id:
            raise HTTPException(403, "Cross-org assignment forbidden")
        task.assigned_org_id = org_id

    task.status = log.status or task.status
    task.severity = log.severity or task.severity
    task.sla_hours = _sla_hours(task.severity)
    if not task.due_at:
        task.due_at = datetime.utcnow() + timedelta(hours=task.sla_hours)
    task.updated_at = datetime.utcnow()

    db.add(task)
    db.commit()
    db.refresh(task)

    # notification
    note = None
    if task.assigned_user_id:
        note = Notification(
            org_id=task.org_id,
            user_id=task.assigned_user_id,
            type="task",
            message=f"Incident {task.log_id} assigned to you",
            read=False,
        )
    elif task.assigned_org_id:
        note = Notification(
            org_id=task.org_id,
            user_id=None,
            type="task",
            message=f"Incident {task.log_id} assigned to your organization",
            read=False,
        )
    if note:
        db.add(note)
        db.commit()

    users = db.query(User).filter(User.id.in_([task.assigned_user_id] if task.assigned_user_id else [])).all()
    user_map = {u.id: u for u in users}
    return _to_task_out(task, user_map)


@router.post("/reminders", dependencies=[Depends(require_admin)])
def create_reminders(
    org_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    query = db.query(TaskAssignment)
    if user.role != "super_admin":
        query = query.filter(TaskAssignment.org_id == user.org_id)
    elif org_id:
        query = query.filter(TaskAssignment.org_id == org_id)

    now = datetime.utcnow()
    tasks = query.all()
    created = 0

    for task in tasks:
        if task.status == "resolved":
            continue

        due_at = task.due_at
        if not due_at:
            continue

        status = _sla_status(due_at)
        should_remind = status in ["overdue", "due_soon"]
        if not should_remind:
            continue

        if task.last_reminder_at and (now - task.last_reminder_at) < timedelta(hours=2):
            continue

        message = (
            f"Incident {task.log_id} is {status.replace('_', ' ')}. "
            f"Due at {due_at.isoformat()}."
        )
        note = Notification(
            org_id=task.org_id,
            user_id=task.assigned_user_id if task.assigned_user_id else None,
            type="reminder",
            message=message,
            read=False,
        )
        db.add(note)
        task.last_reminder_at = now
        created += 1

    db.commit()
    return {"created": created}
