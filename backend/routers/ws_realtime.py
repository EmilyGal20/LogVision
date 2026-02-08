from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from monitor import get_realtime_data

router = APIRouter(prefix="/ws")
print("WS REALTIME ROUTER LOADED")
# ============================================================
#  LIVE MONITOR STREAM — /ws/monitor/{ip}
# ============================================================


@router.websocket("/monitor/{ip}")
async def websocket_monitor(ws: WebSocket, ip: str):
    await ws.accept()
    print(f"[WS] Monitor connected: {ip}")

    try:
        while True:
            data = get_realtime_data(ip)

            await ws.send_json({
                "type": "monitor",
                "ip": ip,
                "payload": data
            })

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print(f"[WS] Monitor disconnected: {ip}")

    except Exception as e:
        print(f"[WS ERROR] Monitor ({ip}):", e)

    finally:
        try:
            await ws.close()
        except:
            pass
        print(f"[WS] Monitor closed: {ip}")


# ============================================================
#  GLOBAL ERRORS STREAM — /ws/errors
#  (Used for live issue popups + dashboard alerts)
# ============================================================

error_clients = set()
current_alerts = []


async def broadcast_error(alert: dict):
    """Send an alert to all connected WS clients."""
    dead = []

    for client in error_clients:
        try:
            await client.send_json({
                "type": "alert",
                "payload": alert
            })
        except:
            dead.append(client)

    # Cleanup disconnected clients
    for d in dead:
        error_clients.discard(d)


@router.websocket("/errors")
async def websocket_errors(ws: WebSocket):
    await ws.accept()
    print("[WS] Errors connection established")

    error_clients.add(ws)

    # Send existing alerts on connect
    if current_alerts:
        try:
            await ws.send_json({
                "type": "initial_alerts",
                "payload": current_alerts
            })
        except:
            pass

    try:
        while True:
            # WS stays open — only expect optional ping from client
            try:
                # If no message arrives for 30s → send keep-alive
                await asyncio.wait_for(ws.receive_text(), timeout=30)

            except asyncio.TimeoutError:
                # Keep connection alive WITHOUT SPAM
                await ws.send_json({"type": "ping"})
                continue

    except WebSocketDisconnect:
        print("[WS] Errors client disconnected")

    except Exception as e:
        print("[WS ERROR]", e)

    finally:
        # Clean removal
        error_clients.discard(ws)

        try:
            await ws.close()
        except:
            pass

        print("[WS] Errors WebSocket closed")
