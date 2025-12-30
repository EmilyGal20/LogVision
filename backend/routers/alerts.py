from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database import SessionLocal
from models import Alert
from schemas import AlertCreate, AlertOut
from auth_dependencies import require_admin


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
    db: Session = Depends(get_db),
):
    query = db.query(Alert)

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
def create_alert(data: AlertCreate, db: Session = Depends(get_db)):
    alert = Alert(
        type=data.type,
        message=data.message,
        severity=data.severity,
        device_ip=data.device_ip,
        # created_at מגיע אוטומטית מהמודל (default=datetime.utcnow)
        acknowledged=False,
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


# ============================================================
# GET SINGLE ALERT
# ============================================================
@router.get("/{alert_id}", response_model=AlertOut, dependencies=[Depends(require_admin)])
def get_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")
    return alert


# ============================================================
# ACKNOWLEDGE ALERT (Admin marked as seen)
# (שומר על אותו path של resolve כדי לא לשבור את ה-frontend)
# ============================================================
@router.put("/{alert_id}/resolve", response_model=AlertOut, dependencies=[Depends(require_admin)])
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
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
def delete_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted"}


# ============================================================
# AUTO-ALERT (Monitoring Agents) — No admin required
# ============================================================
@router.post("/auto", response_model=AlertOut)
async def auto_alert(data: dict, db: Session = Depends(get_db)):

    def db_work():
        alert = Alert(
            type=data.get("type", "system"),
            message=data.get("message", "Threshold exceeded"),
            severity=data.get("severity", "info"),
            device_ip=data.get("device_ip"),
            acknowledged=False
        )
        db.add(alert)
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
    }

    await broadcast_error(payload)

    return alert
