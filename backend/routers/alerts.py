from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from database import SessionLocal
from models import Alert
from schemas import AlertCreate, AlertOut
from auth_dependencies import require_admin

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
    resolved: Optional[bool] = None,
    db: Session = Depends(get_db)
):

    query = db.query(Alert)

    if severity:
        query = query.filter(Alert.severity.ilike(severity))

    if device_ip:
        query = query.filter(Alert.device_ip == device_ip)

    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)

    return query.order_by(Alert.timestamp.desc()).all()


# ============================================================
# CREATE ALERT (Manual)
# ============================================================
@router.post("/", response_model=AlertOut, dependencies=[Depends(require_admin)])
def create_alert(data: AlertCreate, db: Session = Depends(get_db)):

    alert = Alert(
        title=data.title,
        description=data.description,
        severity=data.severity,
        device_ip=data.device_ip,
        timestamp=datetime.utcnow(),
        resolved=False
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
# RESOLVE ALERT
# ============================================================
@router.put("/{alert_id}/resolve", response_model=AlertOut, dependencies=[Depends(require_admin)])
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):

    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(404, "Alert not found")

    alert.resolved = True
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
# AUTO-ALERT (Monitoring Agents)
# No admin required.
# ============================================================
@router.post("/auto", response_model=AlertOut)
def auto_alert(data: dict, db: Session = Depends(get_db)):
    """
    Agents call this automatically when CPU/RAM/GPU exceed thresholds
    or IP goes offline.
    """

    alert = Alert(
        title=data.get("title", "System Alert"),
        description=data.get("description", "Threshold exceeded"),
        severity=data.get("severity", "Medium"),
        device_ip=data.get("device_ip", "unknown"),
        timestamp=datetime.utcnow(),
        resolved=False
    )

    db.add(alert)
    db.commit()
    db.refresh(alert)

    return alert
