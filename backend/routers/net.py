# routers/net.py
from fastapi import APIRouter, HTTPException
from ipaddress import IPv4Address
from typing import Optional, Dict
from datetime import datetime, timezone
import asyncio
import socket
import time
import re
import subprocess

router = APIRouter(prefix="/net", tags=["Network"])

# -----------------------------
# Helpers
# -----------------------------


def _now_iso():
    return datetime.now(timezone.utc).isoformat()


def _parse_ports(ports: Optional[str]) -> list[int]:
    if not ports:
        return [80, 443, 22, 8000]
    out = []
    for part in str(ports).split(","):
        part = part.strip()
        if not part:
            continue
        try:
            p = int(part)
            if 1 <= p <= 65535 and p not in out:
                out.append(p)
        except:
            pass
    return out or [80, 443, 22, 8000]


async def _tcp_check(ip: str, port: int, timeout: float = 1.0) -> bool:
    try:
        fut = asyncio.open_connection(ip, port)
        reader, writer = await asyncio.wait_for(fut, timeout=timeout)
        writer.close()
        try:
            await writer.wait_closed()
        except:
            pass
        return True
    except:
        return False


def _ping_once(ip: str, timeout_s: int = 1) -> Optional[float]:
    """
    Returns latency in ms, or None on failure.
    Uses system ping (works on Windows/Linux).
    """
    # Windows: ping -n 1 -w 1000
    # Linux/mac: ping -c 1 -W 1 (W is seconds on Linux)
    try:
        if socket.getdefaulttimeout() is None:
            pass
    except:
        pass

    try:
        if "win" in __import__("sys").platform.lower():
            cmd = ["ping", "-n", "1", "-w", str(int(timeout_s * 1000)), ip]
        else:
            cmd = ["ping", "-c", "1", "-W", str(int(timeout_s)), ip]

        p = subprocess.run(cmd, capture_output=True, text=True)
        txt = (p.stdout or "") + "\n" + (p.stderr or "")

        # Common patterns:
        # Windows: "time=12ms" / "time<1ms"
        # Linux: "time=12.3 ms"
        m = re.search(r"time[=<]\s*([0-9.]+)\s*ms", txt, re.IGNORECASE)
        if not m:
            return None
        return float(m.group(1))
    except:
        return None


def _stats(latencies: list[float]) -> tuple[Optional[float], Optional[float]]:
    """
    returns avg_ms, jitter_ms (simple stddev-ish using mean absolute deviation)
    """
    if not latencies:
        return None, None
    avg = sum(latencies) / len(latencies)
    jitter = sum(abs(x - avg) for x in latencies) / len(latencies)
    return avg, jitter

# -----------------------------
# Endpoints
# -----------------------------


@router.get("/diag")
async def net_diag(ip: IPv4Address, ports: Optional[str] = None, timeout: float = 1.0):
    ip_str = str(ip)
    ports_list = _parse_ports(ports)

    # Ping a few times (loss/jitter)
    samples = 4
    lat = []
    fail = 0
    for _ in range(samples):
        t = _ping_once(ip_str, timeout_s=max(1, int(timeout)))
        if t is None:
            fail += 1
        else:
            lat.append(t)

    reachable = fail < samples
    loss_pct = round((fail / samples) * 100.0, 1)

    avg_ms, jitter_ms = _stats(lat)
    latency_ms = round(avg_ms, 1) if avg_ms is not None else None
    jitter_ms = round(jitter_ms, 1) if jitter_ms is not None else None

    # TCP port checks (async)
    ports_results: Dict[str, bool] = {}
    tasks = [_tcp_check(ip_str, p, timeout=timeout) for p in ports_list]
    oks = await asyncio.gather(*tasks, return_exceptions=True)

    for p, ok in zip(ports_list, oks):
        ports_results[str(p)] = bool(ok is True)

    # Optional: try reverse DNS (doesn't require anything on remote)
    hostname = None
    try:
        hostname = socket.gethostbyaddr(ip_str)[0]
    except:
        hostname = None

    reason = None
    if not reachable:
        reason = "Ping timeout / host unreachable"

    return {
        "ip": ip_str,
        "reachable": reachable,
        "reason": reason,
        "latency_ms": latency_ms,
        "packet_loss_pct": loss_pct,
        "jitter_ms": jitter_ms,
        "ports": ports_results,
        "checked_at": _now_iso(),
        "hostname": hostname,
    }


@router.get("/http_probe")
def http_probe(ip: IPv4Address, port: int = 8000, path: str = "/health", timeout: float = 2.0):
    ip_str = str(ip)
    if not (1 <= int(port) <= 65535):
        raise HTTPException(400, "Invalid port")

    if not path.startswith("/"):
        path = "/" + path

    url = f"http://{ip_str}:{int(port)}{path}"

    # Use requests (sync) for simplicity
    try:
        import requests
    except Exception:
        raise HTTPException(500, "requests is not installed")

    start = time.perf_counter()
    try:
        r = requests.get(url, timeout=timeout)
        ms = (time.perf_counter() - start) * 1000.0
        return {
            "ok": True,
            "status_code": int(r.status_code),
            "response_ms": round(ms, 1),
            "url": url,
        }
    except Exception as e:
        ms = (time.perf_counter() - start) * 1000.0
        return {
            "ok": False,
            "status_code": None,
            "response_ms": round(ms, 1),
            "url": url,
            "error": str(e),
        }
