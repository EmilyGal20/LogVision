from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database import SessionLocal
from models import Notification
from schemas import NotificationOut, NotificationCreate
from auth_dependencies import require_user, require_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[NotificationOut], dependencies=[Depends(require_user)])
def list_notifications(
    unread_only: Optional[bool] = None,
    org_id: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user=Depends(require_user),
):
    query = db.query(Notification)

    if user.role != "super_admin":
        query = query.filter(Notification.org_id == user.org_id)
        query = query.filter(
            (Notification.user_id == None) | (Notification.user_id == user.id)  # noqa: E711
        )
    elif org_id:
        query = query.filter(Notification.org_id == org_id)

    if unread_only is True:
        query = query.filter(Notification.read == False)  # noqa: E712

    return query.order_by(Notification.created_at.desc()).limit(limit).all()


@router.post("/", response_model=NotificationOut, dependencies=[Depends(require_admin)])
def create_notification(
    payload: NotificationCreate,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    target_org = user.org_id if user.role != "super_admin" else (payload.org_id or user.org_id)
    if not target_org:
        raise HTTPException(400, "org_id required")

    note = Notification(
        org_id=target_org,
        user_id=payload.user_id,
        type=payload.type or "info",
        message=payload.message,
        read=False,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/{note_id}/read", response_model=NotificationOut, dependencies=[Depends(require_user)])
def mark_read(note_id: int, db: Session = Depends(get_db), user=Depends(require_user)):
    query = db.query(Notification).filter(Notification.id == note_id)
    if user.role != "super_admin":
        query = query.filter(Notification.org_id == user.org_id)
    note = query.first()
    if not note:
        raise HTTPException(404, "Notification not found")

    note.read = True
    db.commit()
    db.refresh(note)
    return note


@router.put("/read-all", dependencies=[Depends(require_user)])
def mark_all_read(org_id: Optional[int] = None, db: Session = Depends(get_db), user=Depends(require_user)):
    query = db.query(Notification)
    if user.role != "super_admin":
        query = query.filter(Notification.org_id == user.org_id)
        query = query.filter(
            (Notification.user_id == None) | (Notification.user_id == user.id)  # noqa: E711
        )
    elif org_id:
        query = query.filter(Notification.org_id == org_id)

    query.update({Notification.read: True})
    db.commit()
    return {"message": "Notifications marked as read"}
