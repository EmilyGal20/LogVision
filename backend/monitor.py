import subprocess
import platform
import time
import threading
from datetime import datetime, timedelta
from queue import Queue

from database import SessionLocal
from models import MonitorHistory, UptimeHistory

RETENTION_DAYS = 30
CLEANUP_EVERY_N_WRITES = 200

# ✅ intervals
PING_INTERVAL_SECONDS = 5                 # realtime ping interval (keep fast)
# write "still online/offline" every X minutes
HEARTBEAT_WRITE_EVERY = timedelta(minutes=2)
# for graphs: write a latency point every X seconds
LATENCY_SAMPLE_EVERY = timedelta(seconds=60)

# ============================================================
#   GLOBAL LIVE STORAGE
# ============================================================

monitoring_results = {}
stop_flags = {}
active_threads = {}
active_uptime_threads = {}
ip_org_map = {}

db_queue = Queue(maxsize=5000)

# ✅ per-ip throttling memory
_last_db_write_at = {}       # key -> datetime
_last_latency_sample_at = {}  # key -> datetime
_last_status = {}            # key -> bool

# ============================================================
#   KEY HELPERS
# ============================================================

def _key(ip: str, org_id: int) -> str:
    return f"{org_id}:{ip}"


# ============================================================
#   DATABASE WRITER THREAD — database locked
# ============================================================

def db_writer():
    print("[DB WRITER] Started")
    writes = 0

    while True:
        try:
            model_instance = db_queue.get()

            db = SessionLocal()
            db.add(model_instance)
            db.commit()

            writes += 1

            if writes % CLEANUP_EVERY_N_WRITES == 0:
                cutoff = datetime.utcnow() - timedelta(days=RETENTION_DAYS)
                db.query(MonitorHistory).filter(
                    MonitorHistory.timestamp < cutoff).delete()
                db.query(UptimeHistory).filter(
                    UptimeHistory.timestamp < cutoff).delete()
                db.commit()

            db.close()
            db_queue.task_done()

        except Exception as e:
            print("[DB ERROR]", e)
            time.sleep(0.1)


writer_thread = threading.Thread(target=db_writer, daemon=True)
writer_thread.start()


# ============================================================
#  ping func (Windows / Linux)
# ============================================================

def ping_ip(ip):
    param = "-n" if platform.system().lower() == "windows" else "-c"
    command = ["ping", param, "1", ip]

    try:
        out = subprocess.check_output(
            command, stderr=subprocess.STDOUT, universal_newlines=True
        )

        if "Average =" in out:  # Windows
            ms = out.split("Average =")[-1].replace("ms", "").strip()
            return float(ms)

        if "time=" in out:  # Linux/Mac
            ms = out.split("time=")[1].split(" ")[0].replace("ms", "")
            return float(ms)

        return None

    except Exception:
        return None


# ============================================================
#   LATENCY + ONLINE
# ============================================================

def _should_write_to_db(key: str, alive: bool, now: datetime) -> bool:
    """
    Write to DB only if:
    1) status changed
    OR
    2) heartbeat interval passed
    OR
    3) latency sample interval passed (for graphs)
    """
    prev_status = _last_status.get(key)

    status_changed = (prev_status is not None) and (prev_status != alive)

    last_write = _last_db_write_at.get(key)
    heartbeat_due = (last_write is None) or (
        (now - last_write) >= HEARTBEAT_WRITE_EVERY)

    last_latency = _last_latency_sample_at.get(key)
    latency_due = (last_latency is None) or (
        (now - last_latency) >= LATENCY_SAMPLE_EVERY)

    # ✅ אם הסטטוס השתנה — תמיד נכתוב
    if status_changed:
        return True

    # ✅ אחרת: לכתוב רק אם הגיע זמן heartbeat או דגימת latency
    return heartbeat_due or latency_due


def monitor_ip(ip, org_id):
    key = _key(ip, org_id)
    print(f"[START] Monitoring thread launched for {ip} (org {org_id})")

    while True:
        if stop_flags.get(key):
            print(f"[STOP] Monitoring stopped for {ip} (org {org_id})")
            break

        latency = ping_ip(ip)
        alive = latency is not None

        # ✅ realtime in-memory update (fast, every 5s)
        monitoring_results[key] = {
            "ip": ip,
            "org_id": org_id,
            "online": alive,
            "latency": latency,
            "timestamp": time.time()
        }

        now = datetime.utcnow()

        # ✅ throttled DB write
        try:
            if _should_write_to_db(key, alive, now):
                db_queue.put_nowait(
                    MonitorHistory(
                        ip=ip,
                        org_id=org_id,
                        online=alive,
                        latency=latency if latency is not None else 0,
                        packet_loss=0.0,
                        jitter=0.0,
                        timestamp=now
                    )
                )
                _last_db_write_at[key] = now
                _last_latency_sample_at[key] = now  # נחשב גם כ-sample
        except:
            pass

        # ✅ update last seen status every loop
        _last_status[key] = alive

        time.sleep(PING_INTERVAL_SECONDS)


# ============================================================
#   UPTIME every 5 min
# ============================================================

def calculate_daily_uptime(ip, org_id):
    key = _key(ip, org_id)
    print(f"[UPTIME] Tracking started for {ip} (org {org_id})")

    while True:
        if stop_flags.get(key):
            print(f"[UPTIME STOP] Uptime stopped for {ip} (org {org_id})")
            break

        logs = monitoring_results.get(key, {"online": False})
        uptime_percent = 100 if logs["online"] else 0

        try:
            db_queue.put_nowait(
                UptimeHistory(
                    ip=ip,
                    org_id=org_id,
                    uptime_percent=uptime_percent,
                    timestamp=datetime.utcnow()
                )
            )
        except:
            pass

        time.sleep(300)


# ============================================================
#   start monitoring
# ============================================================

def start_monitoring(ip, org_id=1):
    key = _key(ip, org_id)
    ip_org_map[key] = org_id
    stop_flags[key] = False

    if key in active_threads and not active_threads[key].is_alive():
        del active_threads[key]

    if key in active_uptime_threads and not active_uptime_threads[key].is_alive():
        del active_uptime_threads[key]

    # reset throttling markers for a clean start
    _last_db_write_at.pop(key, None)
    _last_latency_sample_at.pop(key, None)
    _last_status.pop(key, None)

    if key not in active_threads:
        t = threading.Thread(target=monitor_ip, args=(ip, org_id), daemon=True)
        t.start()
        active_threads[key] = t

    if key not in active_uptime_threads:
        t2 = threading.Thread(
            target=calculate_daily_uptime, args=(ip, org_id), daemon=True)
        t2.start()
        active_uptime_threads[key] = t2


# ============================================================
#    stop monitoring
# ============================================================

def stop_monitoring(ip, org_id=1):
    key = _key(ip, org_id)
    stop_flags[key] = True
    print(f"[STOP REQUEST] Flag set for {ip} (org {org_id})")


# ============================================================
#   info for the app (WebSocket)
# ============================================================

def get_realtime_data(ip, org_id=1):
    key = _key(ip, org_id)
    data = monitoring_results.get(key)
    if not data:
        return {
            "ip": ip,
            "org_id": org_id,
            "online": False,
            "latency": None,
            "timestamp": time.time()
        }
    return data
