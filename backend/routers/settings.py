from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Dict
from sqlalchemy.orm import Session
from database import SessionLocal
from models import SystemSetting
from schemas import SettingUpdate, SettingOut
from auth_dependencies import require_admin
import json

router = APIRouter(prefix="/settings", tags=["Settings"])


# ============================================================================
# DB SESSION
# ============================================================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================================
# Helper: Convert DB rows -> dict structure
# ============================================================================
def load_settings_dict(db: Session) -> Dict[str, Any]:
    settings = db.query(SystemSetting).all()
    final = {}

    for s in settings:
        try:
            final[s.key] = json.loads(s.value)
        except Exception:
            final[s.key] = s.value

    return final


# ============================================================================
# GET ALL SETTINGS
# ============================================================================
@router.get("/", response_model=Dict[str, Any], dependencies=[Depends(require_admin)])
def get_settings(db: Session = Depends(get_db)):
    return load_settings_dict(db)


# ============================================================================
# UPDATE / UPSERT A SETTING
# ============================================================================
@router.put("/", response_model=SettingOut, dependencies=[Depends(require_admin)])
def update_setting(data: SettingUpdate, db: Session = Depends(get_db)):
    existing = db.query(SystemSetting).filter(
        SystemSetting.key == data.key).first()

    # Convert Python → JSON string
    value_str = json.dumps(data.value)

    if existing:
        existing.value = value_str
    else:
        existing = SystemSetting(key=data.key, value=value_str)
        db.add(existing)

    db.commit()
    db.refresh(existing)

    return SettingOut(key=existing.key, value=data.value)


# ============================================================================
# UPDATE THEME (shortcut)
# ============================================================================
@router.put("/theme", dependencies=[Depends(require_admin)])
def update_theme(mode: str, db: Session = Depends(get_db)):

    if mode not in ["dark", "light", "auto"]:
        raise HTTPException(400, "Invalid theme mode")

    setting = db.query(SystemSetting).filter(
        SystemSetting.key == "theme").first()
    if not setting:
        setting = SystemSetting(key="theme")

    setting.value = json.dumps(mode)
    db.add(setting)
    db.commit()

    return {"message": "Theme updated", "theme": mode}


# ============================================================================
# UPDATE PERMISSIONS (merge dictionary)
# ============================================================================
@router.put("/permissions", dependencies=[Depends(require_admin)])
def update_permissions(data: Dict[str, Any], db: Session = Depends(get_db)):

    setting = db.query(SystemSetting).filter(
        SystemSetting.key == "permissions").first()

    # לא קיים — ניצור חדש
    if not setting:
        setting = SystemSetting(key="permissions", value=json.dumps(data))
        db.add(setting)
        db.commit()
        return {"message": "Permissions created", "permissions": data}

    # קיים — נעשה MERGE
    current = json.loads(setting.value)

    for k, v in data.items():
        current[k] = v

    setting.value = json.dumps(current)
    db.commit()

    return {"message": "Permissions updated", "permissions": current}


# ============================================================================
# DELETE SETTING (optional)
# ============================================================================
@router.delete("/{key}", dependencies=[Depends(require_admin)])
def delete_setting(key: str, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()

    if not setting:
        raise HTTPException(404, "Setting not found")

    db.delete(setting)
    db.commit()
    return {"message": f"{key} deleted"}
