# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from database import SessionLocal
# from auth_dependencies import require_admin, get_current_user

# from models import Device
# from schemas import DeviceCreate, DeviceUpdate, DeviceOut

# import random
# from datetime import datetime


# router = APIRouter(prefix="/devices", tags=["Devices"])


# # ============================================================
# # DB SESSION
# # ============================================================
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ============================================================
# # GET ALL DEVICES
# # ============================================================
# @router.get("/", response_model=list[DeviceOut], dependencies=[Depends(require_admin)])
# def get_devices(db: Session = Depends(get_db)):
#     return db.query(Device).all()


# # ============================================================
# # GET SINGLE DEVICE
# # ============================================================
# # @router.get("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# # def get_device(ip: str, db: Session = Depends(get_db)):
# #     device = db.query(Device).filter(Device.ip == ip).first()
# #     if not device:
# #         raise HTTPException(404, "Device not found")
# #     return device

# @router.get("/{ip}", response_model=DeviceOut)
# def get_device(
#     ip: str,
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user)  # ✅ just to be online
# ):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")
#     return device

# # ============================================================
# # CREATE NEW DEVICE
# # ============================================================


# @router.post("/", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def create_device(data: DeviceCreate, db: Session = Depends(get_db)):

#     exists = db.query(Device).filter(Device.ip == data.ip).first()
#     if exists:
#         raise HTTPException(400, "Device already exists")

#     d = Device(
#         ip=data.ip,
#         hostname=data.hostname,
#         disk_health=data.disk_health,
#         online=False,
#         cpu_temp=0,
#         gpu_temp=0,
#         ram_used=0,
#         last_ping=None
#     )

#     db.add(d)
#     db.commit()
#     db.refresh(d)
#     return d


# # ============================================================
# # UPDATE DEVICE (Admin or Agent)
# # ============================================================
# @router.put("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def update_device(ip: str, data: DeviceUpdate, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()

#     if not device:
#         raise HTTPException(404, "Device not found")

#     for field, value in data.dict(exclude_unset=True).items():
#         setattr(device, field, value)

#     db.commit()
#     db.refresh(device)
#     return device


# # ============================================================
# # PING DEVICE (Simulated)
# # ============================================================
# @router.post("/{ip}/ping", dependencies=[Depends(require_admin)])
# def ping_device(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     device.online = random.choice([True, True, True, False])
#     device.last_ping = datetime.utcnow()

#     db.commit()
#     return {"ip": ip, "reachable": device.online}


# # ============================================================
# # RESTART DEVICE (Simulated)
# # ============================================================
# @router.post("/{ip}/restart", dependencies=[Depends(require_admin)])
# def restart_device(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     device.online = False  # זמנית
#     db.commit()

#     return {
#         "message": f"Device {ip} restarting…",
#         "status": "restarting"
#     }


# # ============================================================
# # DIAGNOSTICS (Real DB-based)
# # ============================================================
# @router.post("/{ip}/diagnostics", dependencies=[Depends(require_admin)])
# def diagnostics(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     report = {
#         "cpu_ok": device.cpu_temp < 90,
#         "gpu_ok": device.gpu_temp < 85,
#         "ram_ok": device.ram_used < 90,
#         "storage_ok": device.disk_health.get("ssd", 0) > 50,
#     }

#     score = (sum(v is True for v in report.values()) / 4) * 100

#     return {
#         "ip": ip,
#         "diagnostic_report": report,
#         "health_score": score
#     }


# # ============================================================
# # UPDATE HEALTH (Agent → Backend)
# # ============================================================
# @router.put("/{ip}/health", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def update_health(ip: str, health: dict, db: Session = Depends(get_db)):
#     """Used by monitoring agent or WS."""
#     device = db.query(Device).filter(Device.ip == ip).first()

#     if not device:
#         # Auto-create device
#         device = Device(ip=ip)
#         db.add(device)

#     device.cpu_temp = health.get("cpu_temp", device.cpu_temp)
#     device.gpu_temp = health.get("gpu_temp", device.gpu_temp)
#     device.ram_used = health.get("ram_used", device.ram_used)
#     device.disk_health = health.get("disk_health", device.disk_health)
#     device.online = health.get("online", device.online)
#     device.last_update = datetime.utcnow()

#     db.commit()
#     db.refresh(device)
#     return device


# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from database import SessionLocal
# from auth_dependencies import require_admin, get_current_user

# from models import Device
# from schemas import DeviceCreate, DeviceUpdate, DeviceOut

# import random
# from datetime import datetime, timedelta

# router = APIRouter(prefix="/devices", tags=["Devices"])

# # כמה זמן בין "heartbeat" לוגי (כדי לא לקבל online כל כמה שניות)
# HEARTBEAT_INTERVAL = timedelta(minutes=2)


# # ============================================================
# # DB SESSION
# # ============================================================
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # ============================================================
# # GET ALL DEVICES (Admin only)
# # ============================================================
# @router.get("/", response_model=list[DeviceOut], dependencies=[Depends(require_admin)])
# def get_devices(db: Session = Depends(get_db)):
#     return db.query(Device).all()


# # ============================================================
# # GET SINGLE DEVICE (Any logged-in user)
# # ============================================================
# @router.get("/{ip}", response_model=DeviceOut)
# def get_device(
#     ip: str,
#     db: Session = Depends(get_db),
#     user=Depends(get_current_user),  # ✅ רק להיות מחובר/ת
# ):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")
#     return device


# # ============================================================
# # CREATE NEW DEVICE (Admin only)
# # ============================================================
# @router.post("/", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def create_device(data: DeviceCreate, db: Session = Depends(get_db)):
#     exists = db.query(Device).filter(Device.ip == data.ip).first()
#     if exists:
#         raise HTTPException(400, "Device already exists")

#     d = Device(
#         ip=data.ip,
#         hostname=data.hostname,
#         disk_health=data.disk_health,
#         online=False,
#         cpu_temp=0,
#         gpu_temp=0,
#         ram_used=0,
#         last_ping=None,
#     )

#     db.add(d)
#     db.commit()
#     db.refresh(d)
#     return d


# # ============================================================
# # UPDATE DEVICE (Admin only)
# # ============================================================
# @router.put("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def update_device(ip: str, data: DeviceUpdate, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     for field, value in data.dict(exclude_unset=True).items():
#         setattr(device, field, value)

#     db.commit()
#     db.refresh(device)
#     return device


# # ============================================================
# # PING DEVICE (Simulated) — Admin only
# # Throttle "heartbeat" timestamps so you don't spam timeline
# # ============================================================
# @router.post("/{ip}/ping", dependencies=[Depends(require_admin)])
# def ping_device(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     now = datetime.utcnow()
#     prev_online = bool(device.online)

#     new_online = random.choice([True, True, True, False])
#     device.online = new_online

#     # ✅ עדכן last_ping רק אם יש שינוי סטטוס או שעבר מספיק זמן
#     should_heartbeat = (
#         device.last_ping is None or (
#             now - device.last_ping) >= HEARTBEAT_INTERVAL
#     )
#     if prev_online != new_online or should_heartbeat:
#         device.last_ping = now

#     db.commit()
#     return {"ip": ip, "reachable": device.online}


# # ============================================================
# # RESTART DEVICE (Simulated) — Admin only
# # ============================================================
# @router.post("/{ip}/restart", dependencies=[Depends(require_admin)])
# def restart_device(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     device.online = False
#     db.commit()

#     return {"message": f"Device {ip} restarting…", "status": "restarting"}


# # ============================================================
# # DIAGNOSTICS (Real DB-based) — Admin only
# # ============================================================
# @router.post("/{ip}/diagnostics", dependencies=[Depends(require_admin)])
# def diagnostics(ip: str, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()
#     if not device:
#         raise HTTPException(404, "Device not found")

#     report = {
#         "cpu_ok": device.cpu_temp < 90,
#         "gpu_ok": device.gpu_temp < 85,
#         "ram_ok": device.ram_used < 90,
#         "storage_ok": device.disk_health.get("ssd", 0) > 50 if device.disk_health else False,
#     }

#     score = (sum(v is True for v in report.values()) / 4) * 100

#     return {"ip": ip, "diagnostic_report": report, "health_score": score}


# # ============================================================
# # UPDATE HEALTH (Agent → Backend) — Admin only (as you currently set)
# # Throttle heartbeat so it won't create "online" events every few seconds
# # ============================================================
# @router.put("/{ip}/health", response_model=DeviceOut, dependencies=[Depends(require_admin)])
# def update_health(ip: str, health: dict, db: Session = Depends(get_db)):
#     device = db.query(Device).filter(Device.ip == ip).first()

#     if not device:
#         device = Device(ip=ip)
#         db.add(device)
#         db.commit()
#         db.refresh(device)

#     now = datetime.utcnow()
#     prev_online = bool(device.online)

#     # update metrics frequently
#     device.cpu_temp = health.get("cpu_temp", device.cpu_temp)
#     device.gpu_temp = health.get("gpu_temp", device.gpu_temp)
#     device.ram_used = health.get("ram_used", device.ram_used)
#     device.disk_health = health.get("disk_health", device.disk_health)

#     # update online flag
#     device.online = health.get("online", device.online)

#     # ✅ last_update = תמיד (למדדים)
#     device.last_update = now

#     # ✅ last_ping = רק שינוי סטטוס או פעם בכמה דקות (heartbeat)
#     should_heartbeat = (
#         device.last_ping is None or (
#             now - device.last_ping) >= HEARTBEAT_INTERVAL
#     )
#     if bool(device.online) != prev_online or should_heartbeat:
#         device.last_ping = now

#     db.commit()
#     db.refresh(device)
#     return device


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import SessionLocal
from auth_dependencies import require_admin, get_current_user

from models import Device
from schemas import DeviceCreate, DeviceUpdate, DeviceOut

import random
from datetime import datetime, timedelta

router = APIRouter(prefix="/devices", tags=["Devices"])

HEARTBEAT_INTERVAL = timedelta(minutes=2)


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
# GET ALL DEVICES (Admin only)
# ============================================================
@router.get("/", response_model=list[DeviceOut], dependencies=[Depends(require_admin)])
def get_devices(
    org_id: int | None = None,
    db: Session = Depends(get_db),
    user=Depends(require_admin),
):
    query = db.query(Device)
    if user.role != "super_admin":
        query = query.filter(Device.org_id == user.org_id)
    elif org_id:
        query = query.filter(Device.org_id == org_id)
    return query.all()


# ============================================================
# GET SINGLE DEVICE (Any logged-in user)  ✅ Option A
# Auto-create if not exists
# ============================================================
@router.get("/{ip}", response_model=DeviceOut)
def get_device(
    ip: str,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    ip = ip.strip()
    if not ip:
        raise HTTPException(400, "Invalid ip")

    device = db.query(Device).filter(Device.ip == ip).first()

    if not device:
        now = datetime.utcnow()
        device = Device(
            ip=ip,
            hostname=f"pc-{ip}",
            disk_health={"ssd": 100},
            online=False,
            cpu_temp=0,
            gpu_temp=0,
            ram_used=0,
            last_ping=None,
            last_update=now,
            org_id=user.org_id,
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    elif device.org_id != user.org_id and user.role != "super_admin":
        raise HTTPException(404, "Device not found")

    return device


# ============================================================
# CREATE NEW DEVICE (Admin only)
# ============================================================
@router.post("/", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def create_device(data: DeviceCreate, db: Session = Depends(get_db), user=Depends(require_admin)):
    exists = db.query(Device).filter(Device.ip == data.ip).first()
    if exists:
        raise HTTPException(400, "Device already exists")

    now = datetime.utcnow()
    d = Device(
        ip=data.ip,
        hostname=data.hostname,
        disk_health=data.disk_health,
        online=False,
        cpu_temp=0,
        gpu_temp=0,
        ram_used=0,
        last_ping=None,
        last_update=now,
        org_id=user.org_id,
    )

    db.add(d)
    db.commit()
    db.refresh(d)
    return d


# ============================================================
# UPDATE DEVICE (Admin only)
# ============================================================
@router.put("/{ip}", response_model=DeviceOut, dependencies=[Depends(require_admin)])
def update_device(ip: str, data: DeviceUpdate, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Device).filter(Device.ip == ip)
    if user.role != "super_admin":
        query = query.filter(Device.org_id == user.org_id)
    device = query.first()
    if not device:
        raise HTTPException(404, "Device not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(device, field, value)

    if hasattr(device, "last_update"):
        device.last_update = datetime.utcnow()

    db.commit()
    db.refresh(device)
    return device


# ============================================================
# PING DEVICE (Simulated) — Admin only
# Throttle last_ping updates
# ============================================================
@router.post("/{ip}/ping", dependencies=[Depends(require_admin)])
def ping_device(ip: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Device).filter(Device.ip == ip)
    if user.role != "super_admin":
        query = query.filter(Device.org_id == user.org_id)
    device = query.first()
    if not device:
        raise HTTPException(404, "Device not found")

    now = datetime.utcnow()
    prev_online = bool(device.online)

    new_online = random.choice([True, True, True, False])
    device.online = new_online

    should_heartbeat = (
        device.last_ping is None or (
            now - device.last_ping) >= HEARTBEAT_INTERVAL
    )

    if prev_online != new_online or should_heartbeat:
        device.last_ping = now

    if hasattr(device, "last_update"):
        device.last_update = now

    db.commit()
    return {"ip": ip, "reachable": device.online}


# ============================================================
# RESTART DEVICE (Simulated) — Admin only
# ============================================================
@router.post("/{ip}/restart", dependencies=[Depends(require_admin)])
def restart_device(ip: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Device).filter(Device.ip == ip)
    if user.role != "super_admin":
        query = query.filter(Device.org_id == user.org_id)
    device = query.first()
    if not device:
        raise HTTPException(404, "Device not found")

    device.online = False
    if hasattr(device, "last_update"):
        device.last_update = datetime.utcnow()

    db.commit()
    return {"message": f"Device {ip} restarting…", "status": "restarting"}


# ============================================================
# DIAGNOSTICS — Admin only
# ============================================================
@router.post("/{ip}/diagnostics", dependencies=[Depends(require_admin)])
def diagnostics(ip: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(Device).filter(Device.ip == ip)
    if user.role != "super_admin":
        query = query.filter(Device.org_id == user.org_id)
    device = query.first()
    if not device:
        raise HTTPException(404, "Device not found")

    disk = device.disk_health or {}

    report = {
        "cpu_ok": (device.cpu_temp or 0) < 90,
        "gpu_ok": (device.gpu_temp or 0) < 85,
        "ram_ok": (device.ram_used or 0) < 90,
        "storage_ok": (disk.get("ssd", 0) > 50),
    }

    score = (sum(v is True for v in report.values()) / 4) * 100
    return {"ip": ip, "diagnostic_report": report, "health_score": score}


# ============================================================
# UPDATE HEALTH (Agent → Backend) ✅ allow logged-in user/agent
# Throttle last_ping heartbeat
# ============================================================
@router.put("/{ip}/health", response_model=DeviceOut)
def update_health(
    ip: str,
    health: dict,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    device = db.query(Device).filter(Device.ip == ip).first()

    if not device:
        now = datetime.utcnow()
        device = Device(
            ip=ip,
            hostname=f"pc-{ip}",
            disk_health={"ssd": 100},
            online=False,
            cpu_temp=0,
            gpu_temp=0,
            ram_used=0,
            last_ping=None,
            last_update=now,
            org_id=user.org_id,
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    elif device.org_id != user.org_id and user.role != "super_admin":
        raise HTTPException(404, "Device not found")

    now = datetime.utcnow()
    prev_online = bool(device.online)

    # update metrics
    device.cpu_temp = health.get("cpu_temp", device.cpu_temp)
    device.gpu_temp = health.get("gpu_temp", device.gpu_temp)
    device.ram_used = health.get("ram_used", device.ram_used)
    device.disk_health = health.get("disk_health", device.disk_health)

    # online flag
    device.online = health.get("online", device.online)

    # last_update always
    if hasattr(device, "last_update"):
        device.last_update = now

    # last_ping throttled
    should_heartbeat = (
        device.last_ping is None or (
            now - device.last_ping) >= HEARTBEAT_INTERVAL
    )
    if bool(device.online) != prev_online or should_heartbeat:
        device.last_ping = now

    db.commit()
    db.refresh(device)
    return device
