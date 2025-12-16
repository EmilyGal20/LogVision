from fastapi import APIRouter, Depends
from pydantic import BaseModel
import time
import subprocess
from auth_dependencies import require_admin


router = APIRouter(prefix="/agent", tags=["Agent"])

# Temporary in-memory store (later: DB)
AGENT_DATA = {}


class AgentUpdate(BaseModel):
    ip: str
    cpu_temp: float | None = None
    gpu_temp: float | None = None
    ram_used: float | None = None
    disk_health: dict = {}
    uptime: float | None = None


@router.get("/", dependencies=[Depends(require_admin)])
def get_users():
    return ["only admin can see this"]


@router.post("/update")
def update_agent(data: AgentUpdate):
    data_dict = data.dict()
    data_dict["last_seen"] = time.time()

    AGENT_DATA[data.ip] = data_dict
    return {"status": "ok"}


@router.get("/all")
def get_all_agents():
    now = time.time()
    result = []

    for ip, data in AGENT_DATA.items():
        # אם עודכן ב־15 שניות האחרונות
        online = (now - data["last_seen"]) < 15

        result.append({
            "ip": ip,
            "cpu_temp": data.get("cpu_temp"),
            "gpu_temp": data.get("gpu_temp"),
            "ram_used": data.get("ram_used"),
            "disk_health": data.get("disk_health"),
            "uptime": data.get("uptime"),
            "online": online,
            "last_seen": data["last_seen"],
        })

    return result


@router.get("/ping/{ip}")
def ping_ip(ip: str):
    try:
        output = subprocess.run(["ping", "-n", "1", ip], capture_output=True)
        success = "TTL=" in str(output.stdout)
        return {"ip": ip, "reachable": success}
    except:
        return {"ip": ip, "reachable": False}
