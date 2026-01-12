# from fastapi import APIRouter, Depends
# from pydantic import BaseModel
# import time
# import subprocess
# from auth_dependencies import require_admin


# router = APIRouter(prefix="/agent", tags=["Agent"])

# # Temporary in-memory store (later: DB)
# AGENT_DATA = {}


# class AgentUpdate(BaseModel):
#     ip: str
#     cpu_temp: float | None = None
#     gpu_temp: float | None = None
#     ram_used: float | None = None
#     disk_health: dict = {}
#     uptime: float | None = None


# @router.get("/", dependencies=[Depends(require_admin)])
# def get_users():
#     return ["only admin can see this"]


# @router.post("/update")
# def update_agent(data: AgentUpdate):
#     data_dict = data.dict()
#     data_dict["last_seen"] = time.time()

#     AGENT_DATA[data.ip] = data_dict
#     return {"status": "ok"}


# @router.get("/all")
# def get_all_agents():
#     now = time.time()
#     result = []

#     for ip, data in AGENT_DATA.items():
#         # אם עודכן ב־15 שניות האחרונות
#         online = (now - data["last_seen"]) < 15

#         result.append({
#             "ip": ip,
#             "cpu_temp": data.get("cpu_temp"),
#             "gpu_temp": data.get("gpu_temp"),
#             "ram_used": data.get("ram_used"),
#             "disk_health": data.get("disk_health"),
#             "uptime": data.get("uptime"),
#             "online": online,
#             "last_seen": data["last_seen"],
#         })

#     return result


# @router.get("/ping/{ip}")
# def ping_ip(ip: str):
#     try:
#         output = subprocess.run(["ping", "-n", "1", ip], capture_output=True)
#         success = "TTL=" in str(output.stdout)
#         return {"ip": ip, "reachable": success}
#     except:
#         return {"ip": ip, "reachable": False}


from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import subprocess
import platform

from database import SessionLocal
from models import Device
from auth_dependencies import require_admin, get_current_user

router = APIRouter(prefix="/agent", tags=["Agent"])

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


class AgentUpdate(BaseModel):
    ip: str
    cpu_temp: float | None = None
    gpu_temp: float | None = None
    ram_used: float | None = None
    disk_health: dict = Field(default_factory=dict)
    uptime: float | None = None
    online: bool | None = None

    class Config:
        extra = "ignore"  # ✅ לא יפיל אם שולחים שדות נוספים


@router.get("/", dependencies=[Depends(require_admin)])
def agent_root():
    return {"message": "only admin can see this"}


@router.post("/update")
def update_agent(
    data: AgentUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),  # ✅ חייב JWT
):
    ip = data.ip.strip()
    if not ip:
        raise HTTPException(status_code=400, detail="Missing ip")

    now = datetime.utcnow()

    device = db.query(Device).filter(Device.ip == ip).first()

    # ✅ Auto-create if not exists
    if not device:
        device = Device(
            ip=ip,
            hostname=f"pc-{ip}",
            disk_health={"ssd": 100},
            online=False,
            cpu_temp=0,
            gpu_temp=0,
            ram_used=0,
            last_ping=None,
        )
        db.add(device)
        db.commit()
        db.refresh(device)

    prev_online = bool(device.online)

    # ✅ Update metrics only if provided
    if data.cpu_temp is not None:
        device.cpu_temp = float(data.cpu_temp)
    if data.gpu_temp is not None:
        device.gpu_temp = float(data.gpu_temp)
    if data.ram_used is not None:
        device.ram_used = float(data.ram_used)

    if isinstance(data.disk_health, dict) and data.disk_health:
        device.disk_health = data.disk_health

    if data.online is not None:
        device.online = bool(data.online)

    # ✅ metrics timestamp always
    device.last_update = now

    # ✅ throttle last_ping (timeline heartbeat)
    should_heartbeat = (
        device.last_ping is None or (
            now - device.last_ping) >= HEARTBEAT_INTERVAL
    )
    if bool(device.online) != prev_online or should_heartbeat:
        device.last_ping = now

    db.commit()
    db.refresh(device)

    return {"status": "ok", "ip": ip, "updated_at": now.isoformat()}


@router.get("/all", dependencies=[Depends(require_admin)])
def get_all_agents(db: Session = Depends(get_db)):
    return db.query(Device).all()


@router.get("/ping/{ip}")
def ping_ip(ip: str, user=Depends(get_current_user)):
    try:
        param = "-n" if platform.system().lower() == "windows" else "-c"
        output = subprocess.run(
            ["ping", param, "1", ip], capture_output=True, text=True)
        ok = ("TTL=" in output.stdout) or ("ttl=" in output.stdout)
        return {"ip": ip, "reachable": ok}
    except:
        return {"ip": ip, "reachable": False}
