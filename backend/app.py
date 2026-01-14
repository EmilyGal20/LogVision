from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

# DB
from database import Base, engine

# Routers (NEW CLEAN STRUCTURE)
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.logs import router as logs_router
from routers.devices import router as devices_router
from routers.alerts import router as alerts_router
from routers.settings import router as settings_router
from routers.ws_realtime import router as ws_router
from routers.realtime import router as realtime_router
from routers.hardware import router as hardware_router
from routers.speedtest import router as speedtest_router
from routers.agent import router as agent_router


# Demo file loader helpers
import json
from pathlib import Path


# =========================================================
# JSON DEMO FILE
# =========================================================
HARDWARE_ERRORS_FILE = Path("hardware_errors.json")


def load_hw_errors():
    if HARDWARE_ERRORS_FILE.exists():
        try:
            with open(HARDWARE_ERRORS_FILE, "r", encoding="utf8") as f:
                return json.load(f)
        except:
            return []
    return []


def save_hw_errors(data):
    with open(HARDWARE_ERRORS_FILE, "w", encoding="utf8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# =========================================================
# FASTAPI APP
# =========================================================
app = FastAPI(title="LogVision API", version="1.0.0")

# CREATE TABLES
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# LOAD DEMO DATA
# =========================================================
# @app.on_event("startup")
# def load_demo_data():
#     current = load_hw_errors()

#     if len(current) > 0:
#         print("Hardware errors exist — skipping demo.")
#         return

#     demo = [
#         {
#             "id": 2,
#             "computer_name": "PC-001",
#             "ip": "192.168.1.50",
#             "error_type": "Network",
#             "description": "Ping timeout detected",
#             "severity": "Critical",
#             "status": "open",
#             "created_at": "2025-12-07T11:20:47"
#         },
#         {
#             "id": 1,
#             "computer_name": "PC-001",
#             "ip": "192.168.1.50",
#             "error_type": "Network",
#             "description": "Ping timeout detected",
#             "severity": "Critical",
#             "status": "open",
#             "created_at": "2025-12-07T10:16:38"
#         }
#     ]

#     save_hw_errors(demo)
#     print("✔ Demo hardware errors loaded!")


# =========================================================
# ROUTERS — CLEAN + UNIFIED
# =========================================================
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(logs_router)
app.include_router(devices_router)
app.include_router(alerts_router)
app.include_router(settings_router)
app.include_router(ws_router)
app.include_router(realtime_router)
app.include_router(hardware_router)
app.include_router(speedtest_router)
app.include_router(agent_router)


# =========================================================
# TEST WEBSOCKET
# =========================================================
@app.websocket("/ws/test")
async def websocket_test(ws: WebSocket):
    await ws.accept()
    await ws.send_text("WebSocket OK!")
    while True:
        msg = await ws.receive_text()
        await ws.send_text(f"Echo: {msg}")


# =========================================================
# ROOT ROUTE
# =========================================================
@app.get("/")
def root():
    return {
        "status": "LogVision backend running",
        "db": "SQLite",
        "routers": [
            "/auth",
            "/users",
            "/logs",
            "/devices",
            "/alerts",
            "/settings",
        ]
    }


# =========================================================
# DEMO ENDPOINTS
# =========================================================
@app.api_route("/demo/load", methods=["GET", "POST"])
def demo_load():
    demo = [
        {
            "id": 2,
            "computer_name": "PC-001",
            "ip": "192.168.1.50",
            "error_type": "Network",
            "description": "Ping timeout detected",
            "severity": "Critical",
            "status": "open",
            "created_at": "2025-12-07T11:20:47"
        },
        {
            "id": 1,
            "computer_name": "PC-001",
            "ip": "192.168.1.50",
            "error_type": "Network",
            "description": "Ping timeout detected",
            "severity": "Critical",
            "status": "open",
            "created_at": "2025-12-07T10:16:38"
        }
    ]
    save_hw_errors(demo)
    return {"ok": True, "loaded": len(demo)}


@app.post("/demo/clear")
def demo_clear():
    save_hw_errors([])
    return {"ok": True, "cleared": True}
