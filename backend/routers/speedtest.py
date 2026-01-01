from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.responses import StreamingResponse
import asyncio
import os
import time

router = APIRouter(prefix="/speedtest", tags=["speedtest"])

# --------------- DOWNLOAD STREAM ---------------


@router.get("/download")
async def download_stream(size_mb: int = 50, chunk_kb: int = 256):
    """
    Streams random bytes so the client can measure download throughput.
    """
    total_bytes = max(1, size_mb) * 1024 * 1024
    chunk_size = max(8, chunk_kb) * 1024

    async def gen():
        sent = 0
        while sent < total_bytes:
            to_send = min(chunk_size, total_bytes - sent)
            sent += to_send
            yield os.urandom(to_send)
            await asyncio.sleep(0)  # give event loop a breath

    return StreamingResponse(gen(), media_type="application/octet-stream")


# --------------- UPLOAD SINK ---------------
@router.post("/upload")
async def upload_sink(file: UploadFile = File(...)):
    """
    Reads uploaded bytes (discard) so the client can measure upload throughput.
    """
    total = 0
    while True:
        chunk = await file.read(1024 * 256)
        if not chunk:
            break
        total += len(chunk)
    return {"ok": True, "bytes": total}


# --------------- PING via WS ---------------
@router.websocket("/ws")
async def ws_ping(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            msg = await ws.receive_json()
            # expects {"type":"ping","t":<ms>}
            if msg.get("type") == "ping":
                await ws.send_json({"type": "pong", "t": msg.get("t", 0), "serverTime": int(time.time() * 1000)})
    except WebSocketDisconnect:
        pass
