export const ALERTS_KEY = "lv-alerts";

export function saveAlerts(alerts = []) {
    try {
        localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch {
        // ignore
    }
}

export function readAlerts() {
    try {
        const raw = localStorage.getItem(ALERTS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function defaultRules() {
    return [
        {
            id: "critical_spike",
            label: "Critical spike",
            enabled: true,
            type: "critical_count",
            threshold: 5,
            windowHours: 24,
        },
        {
            id: "repeat_ip",
            label: "Repeated IP",
            enabled: true,
            type: "repeat_ip",
            threshold: 4,
            windowHours: 24,
        },
        {
            id: "offline_device",
            label: "Device offline",
            enabled: true,
            type: "device_offline",
        },
        {
            id: "hardware_hot",
            label: "Hardware hot",
            enabled: true,
            type: "hardware_hot",
        },
    ];
}

function withinWindow(ts, hours) {
    if (!hours) return true;
    const now = Date.now();
    const t = new Date(ts || now).getTime();
    return now - t <= hours * 60 * 60 * 1000;
}

export function buildAlerts({ logs = [], devices = [], rules = [] }) {
    const alerts = [];
    const safeLogs = Array.isArray(logs) ? logs : [];
    const safeDevices = Array.isArray(devices) ? devices : [];

    const activeRules = rules.filter((r) => r.enabled !== false);

    const criticalLogs = safeLogs.filter(
        (l) => String(l.severity || "").toLowerCase() === "critical"
    );

    activeRules.forEach((rule) => {
        if (rule.type === "critical_count") {
            const count = criticalLogs.filter((l) => withinWindow(l.created_at, rule.windowHours)).length;
            if (count >= rule.threshold) {
                alerts.push({
                    id: `critical-${rule.id}`,
                    title: "Critical spike",
                    severity: "critical",
                    reason: `${count} critical incidents in last ${rule.windowHours}h.`,
                    entity: "logs",
                    ts: Date.now(),
                    action: "Open Logs",
                    route: "/logs",
                });
            }
        }

        if (rule.type === "repeat_ip") {
            const byIp = {};
            safeLogs.forEach((l) => {
                if (!withinWindow(l.created_at, rule.windowHours)) return;
                if (!l.ip) return;
                byIp[l.ip] = (byIp[l.ip] || 0) + 1;
            });
            const top = Object.entries(byIp)
                .sort((a, b) => b[1] - a[1])
                .filter(([, count]) => count >= rule.threshold)
                .slice(0, 3);
            top.forEach(([ip, count]) => {
                alerts.push({
                    id: `repeat-${ip}`,
                    title: "Repeated incidents",
                    severity: "high",
                    reason: `${count} incidents for ${ip} in last ${rule.windowHours}h.`,
                    entity: ip,
                    ts: Date.now(),
                    action: "Open Search",
                    route: "/search",
                    ip,
                });
            });
        }

        if (rule.type === "device_offline") {
            safeDevices.filter((d) => d.online === false).slice(0, 5).forEach((d) => {
                alerts.push({
                    id: `offline-${d.ip}`,
                    title: "Device offline",
                    severity: "high",
                    reason: `${d.ip} is offline.`,
                    entity: d.ip,
                    ts: Date.now(),
                    action: "Realtime Monitor",
                    route: "/realtime",
                    ip: d.ip,
                });
            });
        }

        if (rule.type === "hardware_hot") {
            safeDevices.filter((d) => (d.cpu_temp ?? 0) >= 85 || (d.gpu_temp ?? 0) >= 80).slice(0, 5).forEach((d) => {
                alerts.push({
                    id: `hot-${d.ip}`,
                    title: "Thermal alert",
                    severity: "medium",
                    reason: `High temperature on ${d.ip}.`,
                    entity: d.ip,
                    ts: Date.now(),
                    action: "Hardware Logs",
                    route: "/hardware",
                    ip: d.ip,
                });
            });
        }
    });

    return alerts.sort((a, b) => {
        const rank = { critical: 3, high: 2, medium: 1, low: 0 };
        return (rank[b.severity] || 0) - (rank[a.severity] || 0);
    });
}

export function buildWorklist({ logs = [], alerts = [] }) {
    const tasks = [];
    const safeLogs = Array.isArray(logs) ? logs : [];

    const unresolvedCritical = safeLogs.filter(
        (l) => String(l.severity || "").toLowerCase() === "critical" && String(l.status || "open").toLowerCase() !== "resolved"
    );

    unresolvedCritical.slice(0, 5).forEach((l) => {
        tasks.push({
            id: `crit-${l.id}`,
            title: `Resolve critical: ${l.ip}`,
            reason: l.description,
            route: `/issue/${l.id}`,
        });
    });

    alerts.slice(0, 4).forEach((a) => {
        tasks.push({
            id: `alert-${a.id}`,
            title: a.title,
            reason: a.reason,
            route: a.route,
        });
    });

    return tasks.slice(0, 6);
}

export function buildReports(logs = [], devices = []) {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const safeDevices = Array.isArray(devices) ? devices : [];

    const now = Date.now();
    const last24 = safeLogs.filter((l) => now - new Date(l.created_at || now).getTime() <= 24 * 60 * 60 * 1000);

    const byIp = {};
    last24.forEach((l) => {
        if (!l.ip) return;
        byIp[l.ip] = (byIp[l.ip] || 0) + 1;
    });

    const topIps = Object.entries(byIp).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const offline = safeDevices.filter((d) => d.online === false).length;

    return {
        last24Count: last24.length,
        topIps,
        offline,
    };
}
