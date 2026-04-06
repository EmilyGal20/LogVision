from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database import SessionLocal
from models import Alert, Notification
from schemas import AlertCreate, AlertOut
from auth_dependencies import require_admin, require_user

from routers.ws_realtime import broadcast_error
import anyio

router = APIRouter(prefix="/alerts", tags=["Alerts"])


# ============================================================
# DB SESSION
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# GET ALL ALERTS + FILTERS
# ============================================================
@router.get("/", response_model=List[AlertOut], dependencies=[Depends(require_admin)])
def get_alerts(
    severity: Optional[str] = None,
    device_ip: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    org_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    query = db.query(Alert)

    if user.role != "super_admin":
        query = query.filter(Alert.org_id == user.org_id)
    elif org_id:
        query = query.filter(Alert.org_id == org_id)

    if severity:
        query = query.filter(Alert.severity.ilike(severity))

    if device_ip:
        query = query.filter(Alert.device_ip == device_ip)

    if acknowledged is not None:
        query = query.filter(Alert.acknowledged == acknowledged)

    return query.order_by(Alert.created_at.desc()).all()


# ============================================================
# CREATE ALERT (Manual)
# ============================================================
@router.post("/", response_model=AlertOut, dependencies=[Depends(require_admin)])
def create_alert(data: AlertCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    alert = Alert(
        type=data.type,
        message=data.message,
        severity=data.severity,
        device_ip=data.device_ip,
        org_id=user.org_id,
        acknowledged=False,
    )

    db.add(alert)
    db.add(Notification(
        org_id=user.org_id,
        user_id=None,
        type="alert",
        message=f"[{data.severity}] {data.message}",
        read=False,
    ))
    db.commit()
    db.refresh(alert)
    return alert


# ============================================================
# GET SINGLE ALERT
# ============================================================
@router.get("/{alert_id}", response_model=AlertOut, dependencies=[Depends(require_admin)])
def get_alert(alert_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Alert).filter(Alert.id == alert_id)
    if user.role != "super_admin":
        query = query.filter(Alert.org_id == user.org_id)
    alert = query.first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    return alert


# ============================================================
# ACKNOWLEDGE ALERT (Admin marked as seen)
# ============================================================
@router.put("/{alert_id}/resolve", response_model=AlertOut, dependencies=[Depends(require_admin)])
def resolve_alert(alert_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Alert).filter(Alert.id == alert_id)
    if user.role != "super_admin":
        query = query.filter(Alert.org_id == user.org_id)
    alert = query.first()
    if not alert:
        raise HTTPException(404, "Alert not found")

    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert


# ============================================================
# DELETE ALERT
# ============================================================
@router.delete("/{alert_id}", dependencies=[Depends(require_admin)])
def delete_alert(alert_id: int, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Alert).filter(Alert.id == alert_id)
    if user.role != "super_admin":
        query = query.filter(Alert.org_id == user.org_id)
    alert = query.first()
    if not alert:
        raise HTTPException(404, "Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted"}


# ============================================================
# AUTO-ALERT (Monitoring Agents)
# ============================================================
@router.post("/auto", response_model=AlertOut)
async def auto_alert(data: dict, db: Session = Depends(get_db), user=Depends(require_user)):

    def db_work():
        alert = Alert(
            type=data.get("type", "system"),
            message=data.get("message", "Threshold exceeded"),
            severity=data.get("severity", "info"),
            device_ip=data.get("device_ip"),
            org_id=user.org_id,
            acknowledged=False,
        )
        db.add(alert)
        db.add(Notification(
            org_id=user.org_id,
            user_id=None,
            type="alert",
            message=f"[{data.get('severity', 'info')}] {data.get('message', 'Threshold exceeded')}",
            read=False,
        ))
        db.commit()
        db.refresh(alert)
        return alert

    alert = await anyio.to_thread.run_sync(db_work)

    payload = {
        "id": alert.id,
        "type": alert.type,
        "message": alert.message,
        "severity": alert.severity,
        "device_ip": alert.device_ip,
        "created_at": alert.created_at.isoformat() if alert.created_at else None,
        "acknowledged": alert.acknowledged,
        "org_id": alert.org_id,
    }

    await broadcast_error(payload)

    return alert
