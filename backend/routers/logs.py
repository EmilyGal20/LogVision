from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List

from database import SessionLocal
from models import Log
from schemas import LogCreate, LogOut, LogRead

import json
from pathlib import Path
# from utils.mac import normalize_mac, is_valid_mac


router = APIRouter(prefix="/logs", tags=["Logs"])

# =====================================================================
# OPTIONAL JSON LOG SUPPORT
# =====================================================================
HW_FILE = Path("hardware_errors.json")


def load_hw_logs():
    if HW_FILE.exists():
        try:
            with open(HW_FILE, "r", encoding="utf8") as f:
                return json.load(f)
        except:
            return []
    return []

# =====================================================================
# DB SESSION
# =====================================================================


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =====================================================================
# STOP TERMINAL SPAM — SUPPORT /logs **AND** /logs/
# =====================================================================
@router.get("")   # /logs   ← this removes the redirect spam
@router.get("/")  # /logs/  ← original
def get_logs(db: Session = Depends(get_db)) -> List[LogOut]:

    db_logs = db.query(Log).order_by(Log.created_at.desc()).all()

    # JSON logs (no validation errors!)
    hw_logs = load_hw_logs()
    json_logs = []

    for item in hw_logs:
        new_item = item.copy()
        new_item["id"] = f"json-{item['id']}"          # string ID
        new_item["source"] = "json"
        new_item["status"] = new_item.get("status", "open")
        json_logs.append(new_item)

    # Return BOTH — BUT without breaking Pydantic
    return db_logs + json_logs


# =====================================================================
# CREATE NEW LOG
# =====================================================================
@router.post("/", response_model=LogRead)
def create_log(log: LogCreate, db: Session = Depends(get_db)):
    db_log = Log(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


# =====================================================================
# SEARCH LOGS
# =====================================================================
@router.get("/search", response_model=List[LogOut])
def search_logs(
    ip: Optional[str] = None,
    error_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Log)

    if ip:
        query = query.filter(Log.ip.ilike(f"%{ip.strip()}%"))

    if error_type:
        query = query.filter(Log.error_type.ilike(f"%{error_type.strip()}%"))

    return query.order_by(Log.created_at.desc()).all()


# =====================================================================
# HARDWARE LOG FILTER
# =====================================================================
@router.get("/hardware", response_model=List[LogOut])
def get_hardware_logs(
    ip: Optional[str] = None,
    computer: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Log).filter(Log.error_type.ilike("Hardware"))

    if ip:
        query = query.filter(Log.ip == ip)

    if computer:
        query = query.filter(Log.computer_name == computer)

    if status:
        query = query.filter(Log.status == status)

    return query.order_by(Log.created_at.desc()).all()


# =====================================================================
# RESOLVE LOG
# =====================================================================
@router.put("/resolve/{log_id}", response_model=LogRead)
def resolve_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(Log).filter(Log.id == log_id).first()

    if not log:
        raise HTTPException(404, "Log not found")

    log.status = "resolved"
    db.commit()
    db.refresh(log)
    return log


# =====================================================================
# GET SINGLE LOG
# =====================================================================
@router.get("/{log_id}", response_model=LogRead | dict)
def get_log(log_id: str, db: Session = Depends(get_db)):

    # If numeric → DB log
    if log_id.isdigit():
        db_log = db.query(Log).filter(Log.id == int(log_id)).first()
        if db_log:
            return db_log

    # JSON fallback
    hw_logs = load_hw_logs()
    true_id = log_id.replace("json-", "")

    for item in hw_logs:
        if str(item["id"]) == true_id:
            new_item = item.copy()
            new_item["id"] = f"json-{item['id']}"
            new_item["source"] = "json"
            return new_item

    raise HTTPException(404, "Log not found")


# =====================================================================
# DELETE LOG
# =====================================================================
@router.delete("/{log_id}")
def delete_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(Log).filter(Log.id == log_id).first()

    if not log:
        raise HTTPException(404, "Log not found")

    db.delete(log)
    db.commit()
    return {"message": "Log deleted successfully"}
