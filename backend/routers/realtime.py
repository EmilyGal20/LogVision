from fastapi import APIRouter, WebSocket, Depends
from database import SessionLocal
from models import MonitorHistory
from auth_dependencies import require_admin, require_user
# from security import verify_token
# from fastapi import WebSocketException

from sqlalchemy import asc, desc
from monitor import (
    monitoring_results,
    start_monitoring,
    stop_monitoring,
    get_realtime_data
)
import time
import asyncio


router = APIRouter(prefix="/realtime")

# ============================================================
#  WS AUTH HELPER
# ============================================================

# def _get_ws_token(websocket: WebSocket) -> str | None:
#     auth = websocket.headers.get("authorization")
#     if not auth:
#         return None

#     parts = auth.split(" ")
#     if len(parts) == 2 and parts[0].lower() == "bearer":
#         return parts[1]

#     return None

# @router.get("/", dependencies=[Depends(require_admin)])
# def get_users():
#     return ["only admin can see this"]

# ============================================================
#   START MONITORING
# ============================================================


@router.get("/start/{ip}", dependencies=[Depends(require_admin)])
def start(ip: str):
    """ מתחיל ניטור ל-IP (אם לא פעיל כבר) """
    start_monitoring(ip)
    return {"message": f"Monitoring started for {ip}"}


# ============================================================
#   STATUS (POLLED STATUS)
# ============================================================

@router.get("/status/{ip}", dependencies=[Depends(require_user)])
def status(ip: str):
    """ סטטוס חי (ל־React שמבצע Polling) """
    return monitoring_results.get(ip, {
        "ip": ip,
        "online": False,
        "latency": None,
        "timestamp": time.time()
    })


# ============================================================
#   HISTORY — FULL HISTORY FOR GRAPHS
# ============================================================

@router.get("/history/{ip}", dependencies=[Depends(require_user)])
def history(ip: str):
    """ היסטוריית ניטור מלאה (לגרפים גדולים) """
    db = SessionLocal()
    try:
        rows = (
            db.query(MonitorHistory)
            .filter(MonitorHistory.ip == ip)
            .order_by(asc(MonitorHistory.timestamp))
            .all()
        )
        return rows
    finally:
        db.close()


# ============================================================
#   NEW: LAST 20 PING RESULTS (IssueDetails Page)
# ============================================================

@router.get("/ping-history/{ip}", dependencies=[Depends(require_user)])
def ping_history(ip: str):
    """
    מחזיר את 20 בדיקות הפינג האחרונות — 
    לשימוש בדף תקלה (IssueDetails)
    """
    db = SessionLocal()
    try:
        rows = (
            db.query(MonitorHistory)
            .filter(MonitorHistory.ip == ip)
            .order_by(desc(MonitorHistory.timestamp))
            .limit(20)
            .all()
        )
        return rows
    finally:
        db.close()


# ============================================================
#   STOP MONITORING
# ============================================================

@router.get("/stop/{ip}", dependencies=[Depends(require_admin)])
def stop(ip: str):
    """ מפסיק ניטור ונותן תגובה מסודרת ל־React """

    stop_monitoring(ip)

    monitoring_results[ip] = {
        "ip": ip,
        "online": False,
        "latency": None,
        "timestamp": time.time()
    }

    return {"message": f"Monitoring stopped for {ip}"}


# ============================================================
#   WEBSOCKET — LIVE MONITORING STREAM
# ============================================================

@router.websocket("/ws/{ip}")
async def ws_monitor(websocket: WebSocket, ip: str):
    """ שולח נתוני ניטור כל שנייה ל־React """

    await websocket.accept()
    print(f"[WS] Client connected for {ip}")

    try:
        while True:
            data = get_realtime_data(ip)
            await websocket.send_json(data)
            await asyncio.sleep(1)

    except Exception as e:
        print(f"[WS CLOSED] Client disconnected for {ip}: {e}")

    finally:
        try:
            await websocket.close()
        except:
            pass

        print(f"[WS] WebSocket closed for {ip}")


# @router.websocket("/ws/{ip}")
# async def ws_monitor(websocket: WebSocket, ip: str):

#     token = _get_ws_token(websocket)
#     payload = verify_token(token) if token else None

#     if payload is None:
#         # 1008 = Policy Violation (מקובל ל-auth failure)
#         await websocket.close(code=1008)
#         print("[WS] Unauthorized websocket connection blocked")
#         return

#     await websocket.accept()
#     print(f"[WS] Authorized client connected for {ip}")

#     try:
#         while True:
#             data = get_realtime_data(ip)
#             await websocket.send_json(data)
#             await asyncio.sleep(1)

#     except Exception as e:
#         print(f"[WS CLOSED] Client disconnected for {ip}: {e}")

#     finally:
#         try:
#             await websocket.close()
#         except:
#             pass
#         print(f"[WS] WebSocket closed for {ip}")
