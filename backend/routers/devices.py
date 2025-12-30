from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from auth_dependencies import require_admin

from models import Device
from schemas import DeviceCreate, DeviceUpdate, DeviceOut

import random
from datetime import datetime


router = APIRouter(prefix="/devices", tags=["Devices"])


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
# GET ALL DEVICES
# ============================================================
@router.get("/", response_model=list[DeviceOut], dependencies=[Depends(require_admin)])
def get_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()


# ============================================================
# GET SINGLE DEVICE
# ============================================================
@router.get("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def get_device(ip: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.ip == ip).first()
    if not device:
        raise HTTPException(404, "Device not found")
    return device


# ============================================================
# CREATE NEW DEVICE
# ============================================================
@router.post("/", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def create_device(data: DeviceCreate, db: Session = Depends(get_db)):

    exists = db.query(Device).filter(Device.ip == data.ip).first()
    if exists:
        raise HTTPException(400, "Device already exists")

    d = Device(
        ip=data.ip,
        hostname=data.hostname,
        disk_health=data.disk_health,
        online=False,
        cpu_temp=0,
        gpu_temp=0,
        ram_used=0,
        last_ping=None
    )

    db.add(d)
    db.commit()
    db.refresh(d)
    return d


# ============================================================
# UPDATE DEVICE (Admin or Agent)
# ============================================================
@router.put("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def update_device(ip: str, data: DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.ip == ip).first()

    if not device:
        raise HTTPException(404, "Device not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(device, field, value)

    db.commit()
    db.refresh(device)
    return device


# ============================================================
# PING DEVICE (Simulated)
# ============================================================
@router.post("/{ip}/ping", dependencies=[Depends(require_admin)])
def ping_device(ip: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.ip == ip).first()
    if not device:
        raise HTTPException(404, "Device not found")

    device.online = random.choice([True, True, True, False])
    device.last_ping = datetime.utcnow()

    db.commit()
    return {"ip": ip, "reachable": device.online}


# ============================================================
# RESTART DEVICE (Simulated)
# ============================================================
@router.post("/{ip}/restart", dependencies=[Depends(require_admin)])
def restart_device(ip: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.ip == ip).first()
    if not device:
        raise HTTPException(404, "Device not found")

    device.online = False  # זמנית
    db.commit()

    return {
        "message": f"Device {ip} restarting…",
        "status": "restarting"
    }


# ============================================================
# DIAGNOSTICS (Real DB-based)
# ============================================================
@router.post("/{ip}/diagnostics", dependencies=[Depends(require_admin)])
def diagnostics(ip: str, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.ip == ip).first()
    if not device:
        raise HTTPException(404, "Device not found")

    report = {
        "cpu_ok": device.cpu_temp < 90,
        "gpu_ok": device.gpu_temp < 85,
        "ram_ok": device.ram_used < 90,
        "storage_ok": device.disk_health.get("ssd", 0) > 50,
    }

    score = (sum(v is True for v in report.values()) / 4) * 100

    return {
        "ip": ip,
        "diagnostic_report": report,
        "health_score": score
    }


# ============================================================
# UPDATE HEALTH (Agent → Backend)
# ============================================================
@router.put("/{ip}/health", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def update_health(ip: str, health: dict, db: Session = Depends(get_db)):
    """Used by monitoring agent or WS."""
    device = db.query(Device).filter(Device.ip == ip).first()

    if not device:
        # Auto-create device
        device = Device(ip=ip)
        db.add(device)

    device.cpu_temp = health.get("cpu_temp", device.cpu_temp)
    device.gpu_temp = health.get("gpu_temp", device.gpu_temp)
    device.ram_used = health.get("ram_used", device.ram_used)
    device.disk_health = health.get("disk_health", device.disk_health)
    device.online = health.get("online", device.online)
    device.last_update = datetime.utcnow()

    db.commit()
    db.refresh(device)
    return device
