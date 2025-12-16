import time
import json
import requests
import psutil
import wmi
import socket

BACKEND_URL = "http://192.168.1.20:5000/agent/update"   # <<< שימי את השרת שלך כאן

# ---------------------------------------------------------
# Helper: Get system IP
# ---------------------------------------------------------


def get_ip():
    try:
        return socket.gethostbyname(socket.gethostname())
    except:
        return "unknown"

# ---------------------------------------------------------
# Get CPU temp using WMI (OpenHardwareMonitor must run)
# ---------------------------------------------------------


def get_cpu_temp():
    try:
        w = wmi.WMI(namespace="root\OpenHardwareMonitor")
        sensors = w.Sensor()
        temps = [s.Value for s in sensors if s.SensorType ==
                 "Temperature" and "CPU" in s.Name]
        if temps:
            return max(temps)
    except:
        pass
    return None

# ---------------------------------------------------------
# Get GPU temp (NVIDIA / AMD)
# ---------------------------------------------------------


def get_gpu_temp():
    try:
        w = wmi.WMI(namespace="root\OpenHardwareMonitor")
        sensors = w.Sensor()
        temps = [s.Value for s in sensors if s.SensorType ==
                 "Temperature" and "GPU" in s.Name]
        if temps:
            return max(temps)
    except:
        pass
    return None

# ---------------------------------------------------------
# Disk SMART health (%)
# ---------------------------------------------------------


def get_disk_health():
    try:
        health = {}
        for disk in psutil.disk_partitions():
            usage = psutil.disk_usage(disk.mountpoint)
            health[disk.device] = 100 - usage.percent
        return health
    except:
        return {}

# ---------------------------------------------------------
# Main Agent Loop
# ---------------------------------------------------------


def main():
    print("Starting Windows Hardware Agent...")

    ip = get_ip()

    while True:
        data = {
            "ip": ip,
            "cpu_temp": get_cpu_temp(),
            "gpu_temp": get_gpu_temp(),
            "ram_used": psutil.virtual_memory().percent,
            "disk_health": get_disk_health(),
            "uptime": time.time() - psutil.boot_time(),
        }

        print("Sending:", data)

        try:
            requests.post(BACKEND_URL, json=data, timeout=3)
        except:
            print("Backend unreachable")

        time.sleep(5)


if __name__ == "__main__":
    main()
