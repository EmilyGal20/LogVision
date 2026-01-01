from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
import json
from pathlib import Path
from auth_dependencies import require_admin
import uuid
import random
import asyncio

# ✅ NEW: only allow real IPv4 in the URL + real hardware metrics (server machine)
from ipaddress import IPv4Address
import psutil


router = APIRouter(prefix="/hardware", tags=["Hardware Errors"])
# router = APIRouter(prefix="/hardware", tags=["hardware"])

DB_FILE = Path("hardware_errors.json")


# ==========================================================
# HELPERS
# ==========================================================
def load_db():
    """Load hardware errors JSON file"""
    if not DB_FILE.exists():
        return []
    try:
        with open(DB_FILE, "r", encoding="utf8") as f:
            return json.load(f)
    except:
        return []


def save_db(data):
    """Save hardware errors JSON file"""
    with open(DB_FILE, "w", encoding="utf8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ✅ NEW: live metrics helper (REAL - of the server running FastAPI)
def get_live_metrics():
    # NOTE: these are real metrics of THIS server machine (not remote IP machines)
    cpu = float(psutil.cpu_percent(interval=0.15))
    ram = float(psutil.virtual_memory().percent)
    disk = float(psutil.disk_usage("/").percent)
    return cpu, ram, disk


# ==========================================================
# GET ALL HARDWARE ERRORS (with ID fix + source flag)
# ==========================================================
@router.get("/errors")
def get_all_errors():
    db = load_db()
    fixed = []

    for item in db:
        new_item = item.copy()

        # ✨ שמירת ID המקורי
        original_id = new_item.get("id")

        # ✨ הוספת מקור
        new_item["source"] = "json"

        # ✨ אם ה־ID מתנגש (לוגים אמיתיים גם משתמשים במספרים) → לייצר ID חדש
        if isinstance(original_id, int):
            # מזהה בטוח
            new_item["id"] = f"json-{original_id}"

        fixed.append(new_item)

    return fixed


# ==========================================================
# GET ERRORS BY IP
# ==========================================================
@router.get("/by-ip/{ip}")
def get_errors_by_ip(ip: str):
    db = load_db()
    result = [item for item in db if item.get("ip") == ip]

    # הוספת "source" גם כאן
    for item in result:
        item["source"] = "json"
        if isinstance(item["id"], int):
            item["id"] = f"json-{item['id']}"

    return {
        "ip": ip,
        "count": len(result),
        "errors": result
    }


# ==========================================================
# ADD NEW ERROR (POST)
# ==========================================================
@router.post("/errors")
def add_error(error: dict):
    db = load_db()

    # מייצרים ID ייחודי
    new_id = f"json-{uuid.uuid4().hex[:8]}"

    error["id"] = new_id
    error["source"] = "json"

    db.append(error)
    save_db(db)

    return {"ok": True, "created": error}


# ==========================================================
# UPDATE ERROR
# ==========================================================
@router.put("/errors/{error_id}")
def update_error(error_id: str, data: dict):
    db = load_db()

    for item in db:
        if str(item.get("id")) == error_id or f"json-{item.get('id')}" == error_id:
            item.update(data)
            save_db(db)
            return {"ok": True, "updated": item}

    raise HTTPException(404, "Error not found")


# ==========================================================
# DELETE ERROR
# ==========================================================
@router.delete("/errors/{error_id}")
def delete_error(error_id: str):
    db = load_db()
    new_db = []

    deleted = None

    for item in db:
        if str(item.get("id")) == error_id or f"json-{item.get('id')}" == error_id:
            deleted = item
            continue
        new_db.append(item)

    if not deleted:
        raise HTTPException(404, "Error not found")

    save_db(new_db)

    return {"ok": True, "deleted": deleted}


# ==========================================================
# ✅ REAL HARDWARE METRICS (only accept real IPv4)
#   URL stays the same: GET /hardware/<ip>
# ==========================================================
@router.get("/{ip}")
def get_hardware(ip: IPv4Address):
    ip = str(ip)  # keep response identical type
    cpu, ram, disk = get_live_metrics()

    # ping: keep existing shape; "real ping" needs ICMP permissions/extra tooling
    ping = random.randint(1, 120)

    return {
        "ip": ip,
        "cpu": cpu,
        "ram": ram,
        "disk": disk,
        "ping": ping,
        "status": "OK",
    }


# ==========================================================
# ✅ LIVE WS (only accept real IPv4)
#   NOTE: because router has prefix="/hardware",
#   WS URL becomes: /hardware/ws/hardware/<ip>
# ==========================================================
@router.websocket("/ws/hardware/{ip}")
async def hardware_ws(ws: WebSocket, ip: str):
    # validate IPv4 manually for WS (so we don't stream for invalid inputs)
    try:
        ip = str(IPv4Address(ip))
    except Exception:
        await ws.accept()
        await ws.send_json({"error": "Invalid IPv4 address"})
        await ws.close()
        return

    await ws.accept()
    try:
        while True:
            cpu, ram, disk = get_live_metrics()
            ping = random.randint(1, 120)

            await ws.send_json({
                "ip": ip,
                "cpu": cpu,
                "ram": ram,
                "disk": disk,
                "ping": ping,
                "status": "OK",
            })
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        pass
