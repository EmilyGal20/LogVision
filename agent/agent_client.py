import os
import time
import socket
import random
from datetime import datetime, timezone

import requests
import psutil

# Optional NVIDIA GPU (NVML)
try:
    import pynvml  # works with pynvml OR nvidia-ml-py
    _HAS_NVML = True
except Exception:
    pynvml = None
    _HAS_NVML = False


# =========================
# CONFIG
# =========================
SERVER_URL = os.getenv("LOGVISION_SERVER", "http://localhost:8000").rstrip("/")
JWT_TOKEN = os.getenv("LOGVISION_TOKEN", "").strip()

MIN_INTERVAL = int(os.getenv("LOGVISION_MIN_INTERVAL", "30"))
MAX_INTERVAL = int(os.getenv("LOGVISION_MAX_INTERVAL", "60"))

# Agent update endpoint candidates (handles / vs no / and router mismatches)
UPDATE_PATHS = [
    "/agent/update",
    "/agent/update/",
]

TIMEOUT_SECONDS = 10


def get_primary_ip() -> str:
    """Best-effort LAN IP."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"


def get_cpu_temp_c():
    """CPU temp on Windows usually not available via psutil -> None."""
    try:
        temps = psutil.sensors_temperatures(fahrenheit=False)
        if not temps:
            return None

        for key in ("coretemp", "cpu-thermal", "k10temp", "acpitz"):
            if key in temps and temps[key]:
                t = temps[key][0].current
                return float(t) if t is not None else None

        for _, arr in temps.items():
            if arr and getattr(arr[0], "current", None) is not None:
                return float(arr[0].current)

        return None
    except Exception:
        return None


def get_gpu_temp_c_nvml():
    if not _HAS_NVML or pynvml is None:
        return None

    try:
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        temp = pynvml.nvmlDeviceGetTemperature(
            handle, pynvml.NVML_TEMPERATURE_GPU)
        return float(temp)
    except Exception:
        return None
    finally:
        try:
            pynvml.nvmlShutdown()
        except Exception:
            pass


def get_disk_health_percent():
    """
    No SMART health via psutil. We'll approximate using FREE% on C: as a placeholder.
    """
    try:
        usage = psutil.disk_usage("C:\\")
        free_pct = (usage.free / usage.total) * 100.0
        return float(round(free_pct, 1))
    except Exception:
        return None


def get_uptime_seconds():
    try:
        return float(time.time() - psutil.boot_time())
    except Exception:
        return None


def build_payload():
    ip = get_primary_ip()
    hostname = socket.gethostname()

    ram_pct = psutil.virtual_memory().percent
    cpu_temp = get_cpu_temp_c()
    gpu_temp = get_gpu_temp_c_nvml()

    disk_health = {}
    ssd = get_disk_health_percent()
    if ssd is not None:
        disk_health["ssd"] = ssd

    # NOTE: אנחנו לא שולחים שדות "extra" כי ה-Backend שלך מצפה ל-AgentUpdate
    return {
        "ip": ip,
        "cpu_temp": float(cpu_temp) if cpu_temp is not None else None,
        "gpu_temp": float(gpu_temp) if gpu_temp is not None else None,
        "ram_used": float(ram_pct),
        "disk_health": disk_health,
        "uptime": get_uptime_seconds(),
        "online": True,

        # רק ללוג מקומי (לא נשלח)
        "_local_hostname": hostname,
        "_sent_at": datetime.now(timezone.utc).isoformat(),
    }


def post_update(clean_payload):
    if not JWT_TOKEN:
        raise RuntimeError(
            "Missing LOGVISION_TOKEN. Put your JWT in env var LOGVISION_TOKEN.")

    headers = {"Authorization": f"Bearer {JWT_TOKEN}"}

    last_err = None
    for path in UPDATE_PATHS:
        url = f"{SERVER_URL}{path}"
        try:
            r = requests.post(url, json=clean_payload,
                              headers=headers, timeout=TIMEOUT_SECONDS)
            if r.status_code >= 400:
                # keep the error, try next path
                last_err = RuntimeError(
                    f"HTTP {r.status_code} @ {url}: {r.text}")
                continue
            return r.json()
        except Exception as e:
            last_err = e
            continue

    raise RuntimeError(
        f"Agent update failed on all endpoints. Last error: {last_err}")


def main():
    print("=== LogVision Agent (Windows) ===")
    print("SERVER_URL:", SERVER_URL)
    print("Interval:", f"{MIN_INTERVAL}-{MAX_INTERVAL}s")
    print("NVML GPU:", "enabled" if _HAS_NVML else "not installed")
    print("Update endpoints:", ", ".join(
        [f"{SERVER_URL}{p}" for p in UPDATE_PATHS]))
    print("---------------------------------")

    while True:
        try:
            payload = build_payload()

            # זה מה שנשלח לשרת (בלי שדות פנימיים)
            clean = {
                "ip": payload["ip"],
                "cpu_temp": payload["cpu_temp"],
                "gpu_temp": payload["gpu_temp"],
                "ram_used": payload["ram_used"],
                "disk_health": payload["disk_health"],
                "uptime": payload["uptime"],
                "online": payload["online"],
            }

            res = post_update(clean)

            print(
                f"[OK] ip={payload['ip']} host={payload['_local_hostname']} "
                f"ram={payload['ram_used']}% cpuTemp={payload['cpu_temp']} gpuTemp={payload['gpu_temp']} "
                f"disk={payload['disk_health']} sent_at={payload['_sent_at']} -> {res}"
            )
        except Exception as e:
            print("[ERR]", e)

        time.sleep(random.randint(MIN_INTERVAL, MAX_INTERVAL))


if __name__ == "__main__":
    main()
