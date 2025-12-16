from fastapi import APIRouter, WebSocket
import asyncio
import json

router = APIRouter()

# רשימת דמו
demo_logs = [
    {"id": 2, "computer_name": "PC-001", "ip": "192.168.1.50", "error_type": "Network",
     "description": "Ping timeout detected", "severity": "Critical", "status": "open",
     "created_at": "2025-12-07T11:20:47"},
    {"id": 1, "computer_name": "PC-001", "ip": "192.168.1.50", "error_type": "Network",
     "description": "Ping timeout detected", "severity": "Critical", "status": "open",
     "created_at": "2025-12-07T10:16:38"},
]

# WebSocket endpoint


@router.websocket("/ws/errors")
async def ws_errors(ws: WebSocket):
    await ws.accept()
    try:
        # שולח הודעה רק פעם אחת כשמתחברים
        await ws.send_text(json.dumps({"message": "WebSocket connected"}))
        while True:
            data = await ws.receive_text()
            print("Client says:", data)
            #
            #
#             # while True:
#     await asyncio.sleep(2)
#     new_errors = check_for_new_hardware_errors()  # פונקציה שבודקת אם נוספו תקלות חדשות
#     if new_errors:
#         for e in new_errors:
#             await ws.send_text(json.dumps({"new": e}))
#  לא נשלח כלום אוטומטית
    except Exception as e:
        print("WebSocket closed:", e)


# Demo POST endpoints


@router.post("/demo/load")
async def load_demo():
    global demo_logs
    return {"status": "demo loaded", "count": len(demo_logs)}


@router.post("/demo/clear")
async def clear_demo():
    global demo_logs
    demo_logs = []
    return {"status": "demo cleared", "count": 0}


@router.get("/logs")
async def get_logs():
    return demo_logs


@router.get("/logs/search")
async def search_logs(ip: str):
    return [log for log in demo_logs if log["ip"] == ip]
