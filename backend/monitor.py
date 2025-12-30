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
# ============================================================
#   GLOBAL LIVE STORAGE
# ============================================================

monitoring_results = {}
stop_flags = {}
active_threads = {}
active_uptime_threads = {}

db_queue = Queue(maxsize=5000)


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

def monitor_ip(ip):
    print(f"[START] Monitoring thread launched for {ip}")

    while True:
        if stop_flags.get(ip):
            print(f"[STOP] Monitoring stopped for {ip}")
            break

        latency = ping_ip(ip)
        alive = latency is not None

        monitoring_results[ip] = {
            "ip": ip,
            "online": alive,
            "latency": latency,
            "timestamp": time.time()
        }

        try:
            db_queue.put_nowait(
                MonitorHistory(
                    ip=ip,
                    online=alive,
                    latency=latency if latency is not None else 0,
                    packet_loss=0.0,
                    jitter=0.0,
                    timestamp=datetime.utcnow()
                )
            )
        except:
            pass

        time.sleep(5)


# ============================================================
#   UPTIME every 5 min
# ============================================================

def calculate_daily_uptime(ip):
    print(f"[UPTIME] Tracking started for {ip}")

    while True:
        if stop_flags.get(ip):
            print(f"[UPTIME STOP] Uptime stopped for {ip}")
            break

        logs = monitoring_results.get(ip, {"online": False})
        uptime_percent = 100 if logs["online"] else 0

        try:
            db_queue.put_nowait(
                UptimeHistory(
                    ip=ip,
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

def start_monitoring(ip):
    stop_flags[ip] = False

    if ip in active_threads and not active_threads[ip].is_alive():
        del active_threads[ip]

    if ip in active_uptime_threads and not active_uptime_threads[ip].is_alive():
        del active_uptime_threads[ip]

    if ip not in active_threads:
        t = threading.Thread(target=monitor_ip, args=(ip,), daemon=True)
        t.start()
        active_threads[ip] = t

    if ip not in active_uptime_threads:
        t2 = threading.Thread(
            target=calculate_daily_uptime, args=(ip,), daemon=True)
        t2.start()
        active_uptime_threads[ip] = t2


# ============================================================
#    stop monitoring
# ============================================================

def stop_monitoring(ip):
    stop_flags[ip] = True
    print(f"[STOP REQUEST] Flag set for {ip}")


# ============================================================
#   info for the app (WebSocket)
# ============================================================

def get_realtime_data(ip):
    data = monitoring_results.get(ip)
    if not data:
        return {
            "ip": ip,
            "online": False,
            "latency": None,
            "timestamp": time.time()
        }
    return data
