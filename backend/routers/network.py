from fastapi import APIRouter, Depends
import subprocess
from auth_dependencies import require_admin


router = APIRouter(prefix="/network", tags=["Network"])


def ping(ip):
    """ Returns True if IP responds to ping """
    result = subprocess.run(
        ["ping", "-n", "1", "-w", "100", ip],
        capture_output=True, text=True
    )
    return "TTL=" in result.stdout


@router.get("/", dependencies=[Depends(require_admin)])
def get_users():
    return ["only admin can see this"]


@router.get("/scan")
def scan_network(subnet: str = "192.168.1.0"):
    base = subnet.rsplit(".", 1)[0]  # 192.168.1
    alive = []

    for i in range(1, 255):
        ip = f"{base}.{i}"
        if ping(ip):
            alive.append(ip)

    return {"devices": alive}
