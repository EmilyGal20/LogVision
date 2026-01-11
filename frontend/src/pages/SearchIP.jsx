// ------------------------------------------------------
//  SEARCHIP.JSX — Full Smart Version (Demo Mode + Real Logs + Hardware Panel)
// ------------------------------------------------------

import { useCallback, useMemo, useState, useEffect } from "react";
import { api } from "../api";
import usePersistentState from "../hooks/usePersistentState";

import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    MenuItem,
    // Tooltip,
    Chip,
    Divider,
    Modal,
    CircularProgress,
} from "@mui/material";

import { useThemeMode } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// ICONS
// import MemoryIcon from "@mui/icons-material/Memory";
// import BugReportIcon from "@mui/icons-material/BugReport";
// import WifiIcon from "@mui/icons-material/Wifi";
// import ErrorIcon from "@mui/icons-material/Error";
// import WhatshotIcon from "@mui/icons-material/Whatshot";
// import StorageIcon from "@mui/icons-material/Storage";

// ------------------------------------------------------
// DEMO ERROR TEMPLATES (kept as comments)
// ------------------------------------------------------
// const DEMO_TEMPLATES = [
//     { error_type: "Hardware", description: "CPU overheating (Demo)", severity: "Critical" },
//     { error_type: "Hardware", description: "Disk read failure (Demo)", severity: "Medium" },
//     { error_type: "Network", description: "Network timeout (Demo)", severity: "Low" }
// ];

// ------------------------------------------------------
// ICON MAP (kept - used by old demo icons / can be reused later)
// ------------------------------------------------------
// const ICON_MAP = {
//     "CPU overheating (Demo)": <WhatshotIcon sx={{ color: "#ef4444", fontSize: 32 }} />,
//     "Disk read failure (Demo)": <StorageIcon sx={{ color: "#3b82f6", fontSize: 32 }} />,
//     "Network timeout (Demo)": <WifiIcon sx={{ color: "#06b6d4", fontSize: 32 }} />,
// };

// ------------------------------------------------------
// LOCALSTORAGE DEMO HANDLING (kept as comments)
// ------------------------------------------------------
// function loadDemoLogsForIP(ip) {
//     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
//     return all[ip] || null;
// }

// function saveDemoLogsForIP(ip, logs) {
//     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
//     all[ip] = logs;
//     localStorage.setItem("demo-errors-by-ip", JSON.stringify(all));
// }

// function deleteDemoForIP(ip, id) {
//     const logs = loadDemoLogsForIP(ip);
//     if (!logs) return;
//     saveDemoLogsForIP(ip, logs.filter(l => l.id !== id));
// }

// ------------------------------------------------------
// DEMO DEVICE GENERATOR (kept as comments)
// ------------------------------------------------------
// function demoDeviceForIP(ip) {
//     // מספרים "הגיוניים" לפי IP (כדי שיהיה עקבי)
//     const seed = (ip || "0.0.0.0").split(".").reduce((a, b) => a + Number(b || 0), 0);
//     const cpu = 45 + (seed % 55); // 45..99
//     const gpu = 40 + (seed % 50); // 40..89
//     const ram = 20 + (seed % 80); // 20..99
//     const ssd = 30 + (seed % 70); // 30..99
//     const online = (seed % 5) !== 0;

//     return {
//         ip: ip || "0.0.0.0",
//         hostname: "demo-device",
//         online,
//         cpu_temp: cpu,
//         gpu_temp: gpu,
//         ram_used: ram,
//         disk_health: { ssd },
//         last_ping: new Date().toISOString(),
//         last_update: new Date().toISOString(),
//         is_demo: true,
//     };
// }

// ------------------------------------------------------
// MODAL STYLE
// ------------------------------------------------------
const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(20,20,35,0.92)",
    padding: "22px",
    borderRadius: "16px",
    width: "560px",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(12px)",
};

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
export default function SearchIP() {
    const { mode } = useThemeMode();
    const navigate = useNavigate();

    const [ip, setIp] = usePersistentState("search-ip-value", "");
    const [errorType, setErrorType] = usePersistentState("search-error-type", "");
    const [severityFilter, setSeverityFilter] = usePersistentState("severity-filter", "");
    // const [showDemoOnly, setShowDemoOnly] = usePersistentState("show-demo-only", false); // demo kept as comments

    // ✅ FIX: define showDemoOnly so references won't crash (demo feature currently disabled)
    const showDemoOnly = false;

    const [results, setResults] = usePersistentState("search-results", []);
    const [createHostname, setCreateHostname] = useState("");
    const [creatingDevice, setCreatingDevice] = useState(false);
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    const isAdmin = auth?.user?.role === "admin";

    // device hardware status
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [deviceLoading, setDeviceLoading] = useState(false);
    const [deviceError, setDeviceError] = useState("");

    // diagnostics modal
    const [openDiag, setOpenDiag] = useState(false);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagData, setDiagData] = useState(null);
    const [diagErr, setDiagErr] = useState("");

    // add log form
    const [newLogType, setNewLogType] = useState("Hardware");
    const [newLogSeverity, setNewLogSeverity] = useState("Low");
    const [newLogDesc, setNewLogDesc] = useState("");
    const [addingLog, setAddingLog] = useState(false);
    const [addLogErr, setAddLogErr] = useState("");
    const [newLogComputer, setNewLogComputer] = useState("");
    const [openAddLog, setOpenAddLog] = useState(false);

    useEffect(() => {
        const auto = deviceInfo?.hostname || (ip ? `pc-${ip}` : "");
        setNewLogComputer((prev) => prev || auto);
    }, [deviceInfo?.hostname, ip]);

    // ------------------------------------------------------
    // ICON HANDLER (kept as comments - old logs UI)
    // ------------------------------------------------------
    // const iconForError = (description, type) => {
    //     if (ICON_MAP[description]) return ICON_MAP[description];
    //     switch (type) {
    //         case "Hardware": return <MemoryIcon sx={{ color: "#7c3aed", fontSize: 32 }} />;
    //         case "Software": return <BugReportIcon sx={{ color: "#06b6d4", fontSize: 32 }} />;
    //         case "Network": return <WifiIcon sx={{ color: "#3b82f6", fontSize: 32 }} />;
    //         default: return <ErrorIcon sx={{ fontSize: 32 }} />;
    //     }
    // };

    // ------------------------------------------------------
    // COLORS
    // ------------------------------------------------------
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const severityColor = {
        Critical: "#ef4444",
        Medium: "#facc15",
        Low: "#4ade80",
        unknown: "#6b7280",
    };

    const severityBadge = (sev) => ({
        background: severityColor[sev] || severityColor.unknown,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    });

    const demoBadge = {
        background: "#6366f1",
        color: "white",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    };

    // const realBadge = { ... } // kept as comments earlier if you want

    const bgCard = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    // ------------------------------------------------------
    // Hardware thresholds + styling
    // ------------------------------------------------------
    const metricTone = (type, value) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "neutral";

        if (type === "cpuTemp") {
            if (value < 70) return "good";
            if (value < 90) return "warn";
            return "bad";
        }
        if (type === "gpuTemp") {
            if (value < 65) return "good";
            if (value < 85) return "warn";
            return "bad";
        }
        if (type === "ramPct") {
            if (value < 70) return "good";
            if (value < 90) return "warn";
            return "bad";
        }
        if (type === "ssdPct") {
            if (value > 70) return "good";
            if (value > 50) return "warn";
            return "bad";
        }
        return "neutral";
    };

    const toneStyle = (tone) => {
        if (tone === "good") {
            return {
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.16)",
                color: mode === "dark" ? "#dcfce7" : "#052e16",
            };
        }
        if (tone === "warn") {
            return {
                border: "1px solid rgba(250,204,21,0.35)",
                background: "rgba(250,204,21,0.16)",
                color: mode === "dark" ? "#fef9c3" : "#422006",
            };
        }
        if (tone === "bad") {
            return {
                border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.16)",
                color: mode === "dark" ? "#fee2e2" : "#450a0a",
            };
        }
        return {
            border: "1px solid rgba(148,163,184,0.25)",
            background: "rgba(148,163,184,0.10)",
            color: mode === "dark" ? "#e5e7eb" : "#111",
        };
    };

    const MetricCard = ({ label, value, unit, tone }) => (
        <Paper sx={{ p: 1.6, borderRadius: 3, ...toneStyle(tone) }}>
            <Typography sx={{ fontSize: 12, opacity: 0.95, fontWeight: 800 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                {value === null || value === undefined ? "—" : value}
                {unit ? (
                    <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}> {unit}</span>
                ) : null}
            </Typography>
        </Paper>
    );

    const StatusChip = ({ ok, label }) => (
        <Chip
            label={label}
            sx={{
                mr: 1,
                mb: 1,
                fontWeight: 800,
                borderRadius: "999px",
                color: ok ? "#052e16" : "#450a0a",
                background: ok ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
                border: ok ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
            }}
        />
    );

    const fmtTime = (s) => {
        if (!s) return "—";
        try {
            return new Date(s).toLocaleString();
        } catch {
            return String(s);
        }
    };

    // ------------------------------------------------------
    // RISKS (Hardware + Real/JSON Logs) — NO DEMO
    // ------------------------------------------------------
    const riskRank = useMemo(() => ({ Critical: 3, Medium: 2, Low: 1 }), []);

    const buildHardwareRisks = useCallback((d) => {
        if (!d) return [];
        const risks = [];

        const cpu = d.cpu_temp ?? null;
        const gpu = d.gpu_temp ?? null;
        const ram = d.ram_used ?? null;
        const ssd = d.disk_health?.ssd ?? null;

        const push = (severity, title, detail, kind) => {
            risks.push({
                id: `hw-${kind}`,
                source: "hardware",
                severity,
                title,
                detail,
                kind,
            });
        };

        if (d.online === false) {
            push("Critical", "Device appears offline", "Ping reports device is offline", "offline");
        }

        if (cpu !== null && cpu !== undefined && !Number.isNaN(cpu)) {
            if (cpu >= 90) push("Critical", "CPU overheating risk", `CPU temp is ${cpu}°C`, "cpu");
            else if (cpu >= 70) push("Medium", "CPU running hot", `CPU temp is ${cpu}°C`, "cpu");
        }

        if (gpu !== null && gpu !== undefined && !Number.isNaN(gpu)) {
            if (gpu >= 85) push("Critical", "GPU overheating risk", `GPU temp is ${gpu}°C`, "gpu");
            else if (gpu >= 65) push("Medium", "GPU running hot", `GPU temp is ${gpu}°C`, "gpu");
        }

        if (ram !== null && ram !== undefined && !Number.isNaN(ram)) {
            if (ram >= 90) push("Critical", "High memory pressure", `RAM usage is ${ram}%`, "ram");
            else if (ram >= 70) push("Medium", "Elevated RAM usage", `RAM usage is ${ram}%`, "ram");
        }

        if (ssd !== null && ssd !== undefined && !Number.isNaN(ssd)) {
            if (ssd <= 50) push("Critical", "SSD health critical", `SSD health is ${ssd}%`, "ssd");
            else if (ssd <= 70) push("Medium", "SSD health declining", `SSD health is ${ssd}%`, "ssd");
        }

        return risks;
    }, []);

    const buildLogRisks = useCallback((logs) => {
        if (!Array.isArray(logs)) return [];
        const safe = logs.filter((l) => !l?.is_demo);

        return safe.map((log) => ({
            id: `log-${log.id}`,
            source: "log",
            severity: log.severity || "Low",
            title: `${log.error_type} issue`,
            detail: log.description,
            logId: log.id,
            ip: log.ip,
            is_real: !!log.is_real,
            is_json: !!log.is_json,
        }));
    }, []);

    const risks = useMemo(() => {
        const hw = buildHardwareRisks(deviceInfo);
        const lg = buildLogRisks(results);
        const combined = [...hw, ...lg];

        return combined.sort(
            (a, b) => (riskRank[b.severity] || 0) - (riskRank[a.severity] || 0)
        );
    }, [deviceInfo, results, buildHardwareRisks, buildLogRisks, riskRank]);

    const riskSummary = useMemo(() => {
        const counts = { Critical: 0, Medium: 0, Low: 0 };

        for (const r of risks) {
            if (r.severity === "Critical") counts.Critical += 1;
            else if (r.severity === "Medium") counts.Medium += 1;
            else if (r.severity === "Low") counts.Low += 1;
        }

        // Overall score (weighted): Critical=10, Medium=5, Low=1
        const score =
            (counts.Critical * 10) +
            (counts.Medium * 5) +
            (counts.Low * 1);

        // Optional: normalize into 0..100-ish (caps at 100)
        const score100 = Math.min(100, score);

        return { counts, score, score100 };
    }, [risks]);

    // ------------------------------------------------------
    // Fetch device info (real)
    // ------------------------------------------------------
    const fetchDeviceInfo = useCallback(async (targetIp) => {
        setDeviceLoading(true);
        setDeviceError("");
        try {
            const res = await api.get(`/devices/${targetIp}`);
            setDeviceInfo(res.data);
        } catch (e) {
            setDeviceInfo(null);
            setDeviceError("Device was not found for this IP (Or no admin permissions).");
        } finally {
            setDeviceLoading(false);
        }
    }, []);

    const createDevice = useCallback(async () => {
        if (!ip) {
            alert("Please enter an IP address.");
            return;
        }

        setCreatingDevice(true);
        try {
            await api.post("/devices/", {
                ip,
                hostname: createHostname || `device-${ip.replaceAll(".", "-")}`,
                disk_health: { ssd: 100 },
            });

            setDeviceError("");
            setCreateHostname("");
            await fetchDeviceInfo(ip);

            await api.post(`/devices/${ip}/ping`);
            await fetchDeviceInfo(ip);
        } catch (e) {
            setDeviceError("Create Device has failed (IP might already exist or need permissions).");
        } finally {
            setCreatingDevice(false);
        }
    }, [ip, createHostname, fetchDeviceInfo]);

    const pingNow = useCallback(async (targetIp) => {
        if (!targetIp) return;

        setDeviceLoading(true);
        setDeviceError("");
        try {
            await api.post(`/devices/${targetIp}/ping`);
            await fetchDeviceInfo(targetIp);
        } catch (e) {
            setDeviceError("Ping has failed (permissions / endpoint).");
        } finally {
            setDeviceLoading(false);
        }
    }, [fetchDeviceInfo]);

    // ------------------------------------------------------
    // Diagnostics (real)
    // ------------------------------------------------------
    const runDiagnostics = useCallback(async (targetIp) => {
        setOpenDiag(true);
        setDiagLoading(true);
        setDiagData(null);
        setDiagErr("");

        try {
            const res = await api.post(`/devices/${targetIp}/diagnostics`);
            setDiagData(res.data);
        } catch (e) {
            setDiagErr("Diagnostics has faild (endpoint/permissions).");
        } finally {
            setDiagLoading(false);
        }
    }, []);

    // ------------------------------------------------------
    // SEARCH FUNCTION
    // ------------------------------------------------------
    const search = useCallback(async () => {
        // ⭐ DEMO ONLY MODE (kept as comments)
        // if (showDemoOnly) { ... }

        if (!ip) {
            alert("Please enter an IP address.");
            return;
        }

        fetchDeviceInfo(ip);

        const res = await api.get("/logs/search", { params: { ip } });

        let realLogs = res.data.map((log) => ({
            ...log,
            is_real: !log.source,
            is_json: log.source === "json",
        }));

        if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
        if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

        setResults(realLogs);
    }, [ip, errorType, severityFilter, setResults, fetchDeviceInfo]);

    // ------------------------------------------------------
    // RESET
    // ------------------------------------------------------
    const reset = () => {
        setIp("");
        setErrorType("");
        setSeverityFilter("");
        setResults([]);
        setDeviceInfo(null);
        setDeviceError("");
        setCreateHostname("");
        setNewLogType("Hardware");
        setNewLogSeverity("Low");
        setNewLogDesc("");
        setAddLogErr("");
    };

    // ------------------------------------------------------
    // DELETE HANDLER (kept as comments - old logs list UI)
    // ------------------------------------------------------
    // const handleDelete = async (log) => { ... };

    const refreshLogsForIP = useCallback(async (targetIp) => {
        if (!targetIp) return;

        const res = await api.get("/logs/search", { params: { ip: targetIp } });

        let realLogs = res.data.map((log) => ({
            ...log,
            is_real: !log.source,
            is_json: log.source === "json",
        }));

        if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
        if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

        setResults(realLogs);
    }, [errorType, severityFilter, setResults]);

    const addNewLog = useCallback(async () => {
        setAddLogErr("");
        setAddingLog(true);

        if (!ip) {
            setAddLogErr("Enter IP first then add Log.");
            setAddingLog(false);
            return false;
        }
        if (!newLogDesc.trim()) {
            setAddLogErr("Must add Description.");
            setAddingLog(false);
            return false;
        }

        try {
            await api.post("/logs/", {
                computer_name: newLogComputer?.trim() || deviceInfo?.hostname || `pc-${ip}`,
                ip,
                error_type: newLogType,
                severity: newLogSeverity,
                description: newLogDesc.trim(),
            });

            setNewLogDesc("");
            await refreshLogsForIP(ip);
            return true;
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setAddLogErr(detail ? JSON.stringify(detail, null, 2) : "Failed to add Log (Check Token/Server.");
            return false;
        } finally {
            setAddingLog(false);
        }
    }, [
        ip,
        newLogType,
        newLogSeverity,
        newLogDesc,
        newLogComputer,
        deviceInfo?.hostname,
        refreshLogsForIP,
    ]);

    const metrics = useMemo(() => {
        const cpu = deviceInfo?.cpu_temp ?? null;
        const gpu = deviceInfo?.gpu_temp ?? null;
        const ram = deviceInfo?.ram_used ?? null;
        const ssd = deviceInfo?.disk_health?.ssd ?? null;

        return {
            cpu,
            gpu,
            ram,
            ssd,
            cpuTone: metricTone("cpuTemp", cpu),
            gpuTone: metricTone("gpuTemp", gpu),
            ramTone: metricTone("ramPct", ram),
            ssdTone: metricTone("ssdPct", ssd),
        };
    }, [deviceInfo]);

    // ------------------------------------------------------
    // RENDER UI
    // ------------------------------------------------------
    return (
        <Box
            sx={{
                padding: 4,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
            }}
        >
            <Typography variant="h4" fontWeight="bold" sx={{ color: textColor }}>
                Search Logs
            </Typography>

            {/* SEARCH BOX */}
            <Paper sx={{ width: "100%", maxWidth: 500, padding: 4, background: bgCard, borderRadius: "18px" }}>
                <TextField
                    label="IP Address"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    fullWidth
                    sx={{ mb: 3 }}
                />

                <TextField
                    label="Error Type"
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    select
                    fullWidth
                    sx={{ mb: 3 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Hardware">Hardware</MenuItem>
                    <MenuItem value="Software">Software</MenuItem>
                    <MenuItem value="Network">Network</MenuItem>
                </TextField>

                <TextField
                    label="Severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    select
                    fullWidth
                    sx={{ mb: 3 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                </TextField>

                {/* DEMO ONLY TOGGLE (kept as comments) */}
                {/* <Button ...> ... </Button> */}

                <Button
                    variant="contained"
                    onClick={() => setOpenAddLog(true)}
                    sx={{
                        width: "100%",
                        maxWidth: 700,
                        py: 1.6,
                        mb: 2.5,
                        fontWeight: 900,
                        background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                    }}
                >
                    + Add New Log
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={search}
                    sx={{
                        py: 1.6,
                        mb: 2.5,
                        background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                        fontWeight: "bold",
                    }}
                >
                    SEARCH
                </Button>

                <Button
                    variant="outlined"
                    fullWidth
                    sx={{ py: 1.4, fontWeight: "bold", borderColor: "#7c3aed", color: "#7c3aed" }}
                    onClick={reset}
                >
                    RESET
                </Button>
            </Paper>

            {/* HARDWARE PANEL */}
            {(deviceLoading || deviceInfo || deviceError) && (
                <Paper sx={{ width: "100%", maxWidth: 700, padding: 3, background: bgCard, borderRadius: "18px" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                        <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
                            Hardware Status
                        </Typography>

                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            {deviceInfo?.ip && (
                                <Chip
                                    label={deviceInfo.online ? "ONLINE" : "OFFLINE"}
                                    sx={{
                                        fontWeight: 900,
                                        borderRadius: "999px",
                                        color: deviceInfo.online ? "#052e16" : "#450a0a",
                                        background: deviceInfo.online ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
                                        border: deviceInfo.online ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
                                    }}
                                />
                            )}

                            {!showDemoOnly && deviceInfo?.ip && (
                                <Button variant="outlined" size="small" onClick={() => fetchDeviceInfo(deviceInfo.ip)}>
                                    Refresh Hardware
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => pingNow(deviceInfo?.ip)}
                                disabled={deviceLoading || !deviceInfo?.ip || !isAdmin || showDemoOnly}
                            >
                                Ping now
                            </Button>

                            {!showDemoOnly && deviceInfo?.ip && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => runDiagnostics(deviceInfo.ip)}
                                    sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
                                >
                                    Run Diagnostics
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ opacity: 0.2, my: 2 }} />

                    {deviceLoading && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <CircularProgress size={18} />
                            <Typography sx={{ color: textColor, opacity: 0.8 }}>Loading device info...</Typography>
                        </Box>
                    )}

                    {!!deviceError && (
                        <Box>
                            <Typography sx={{ color: textColor, opacity: 0.85, mb: 2 }}>
                                {deviceError}
                            </Typography>

                            {isAdmin ? (
                                <Paper
                                    sx={{
                                        p: 2,
                                        borderRadius: "14px",
                                        background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                    }}
                                >
                                    <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                        Create Device
                                    </Typography>

                                    <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
                                        no device was found in IP Diagnostics, Create a new log to view it
                                    </Typography>

                                    <TextField
                                        label="Hostname (optional)"
                                        value={createHostname}
                                        onChange={(e) => setCreateHostname(e.target.value)}
                                        fullWidth
                                        sx={{ mb: 2 }}
                                    />

                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={createDevice}
                                        disabled={creatingDevice}
                                        sx={{ py: 1.3, fontWeight: 900, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)" }}
                                    >
                                        {creatingDevice ? "Creating..." : "Create Device"}
                                    </Button>
                                </Paper>
                            ) : (
                                <Typography sx={{ color: textColor, opacity: 0.8 }}>
                                    No Admin permissions to create device, As user you can still look for logs or add new logs
                                </Typography>
                            )}
                        </Box>
                    )}

                    {deviceInfo && !deviceLoading && (
                        <>
                            <Typography sx={{ color: textColor, opacity: 0.85, mb: 1 }}>
                                IP: <b>{deviceInfo.ip}</b>
                                {deviceInfo.hostname ? <> • Hostname: <b>{deviceInfo.hostname}</b></> : null}
                            </Typography>

                            <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
                                Last Ping: <b>{fmtTime(deviceInfo.last_ping)}</b>
                                {"  "} • {"  "}
                                Last Update: <b>{fmtTime(deviceInfo.last_update)}</b>
                            </Typography>

                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
                                <MetricCard label="CPU Temp" value={metrics.cpu} unit="°C" tone={metrics.cpuTone} />
                                <MetricCard label="GPU Temp" value={metrics.gpu} unit="°C" tone={metrics.gpuTone} />
                                <MetricCard label="RAM Used" value={metrics.ram} unit="%" tone={metrics.ramTone} />
                                <MetricCard label="SSD Health" value={metrics.ssd} unit="%" tone={metrics.ssdTone} />
                            </Box>

                            {deviceInfo.disk_health && typeof deviceInfo.disk_health === "object" && (
                                <Box>
                                    <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                        Disk Health Details
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {Object.entries(deviceInfo.disk_health).map(([k, v]) => (
                                            <Chip
                                                key={k}
                                                label={`${k}: ${v}`}
                                                sx={{
                                                    borderRadius: "999px",
                                                    fontWeight: 800,
                                                    background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: textColor,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                </Paper>
            )}

            {/* RESULTS TITLE */}
            <Typography variant="h5" sx={{ color: textColor, mt: 2 }}>
                Results
            </Typography>

            {/* RISK SUMMARY BAR */}
            <Paper
                sx={{
                    width: "100%",
                    maxWidth: 700,
                    p: 2,
                    background: bgCard,
                    borderRadius: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                }}
            >
                <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
                    <Typography sx={{ color: textColor, fontWeight: 900 }}>
                        Risk Summary:
                    </Typography>

                    <Chip
                        label={`Critical: ${riskSummary.counts.Critical}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(239,68,68,0.18)",
                            border: "1px solid rgba(239,68,68,0.30)",
                            color: textColor,
                        }}
                    />
                    <Chip
                        label={`Medium: ${riskSummary.counts.Medium}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(250,204,21,0.18)",
                            border: "1px solid rgba(250,204,21,0.30)",
                            color: textColor,
                        }}
                    />
                    <Chip
                        label={`Low: ${riskSummary.counts.Low}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(74,222,128,0.18)",
                            border: "1px solid rgba(74,222,128,0.30)",
                            color: textColor,
                        }}
                    />
                </Box>

                <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 12, opacity: 0.85 }}>
                        Overall risk score
                    </Typography>
                    <Typography sx={{ color: textColor, fontWeight: 1000, fontSize: 22, lineHeight: 1 }}>
                        {riskSummary.score100}
                        <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}> / 100</span>
                    </Typography>
                </Box>
            </Paper>


            {/* RESULTS LIST — RISKS (No Demo) */}
            <Paper sx={{ width: "100%", maxWidth: 700, padding: 3, background: bgCard, borderRadius: "18px" }}>
                {risks.length === 0 ? (
                    <Typography sx={{ color: textColor }}>No risks detected for this IP.</Typography>
                ) : (
                    risks.map((r) => (
                        <Box
                            key={r.id}
                            sx={{
                                p: 2.5,
                                mb: 2,
                                borderRadius: "12px",
                                background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                borderLeft: `6px solid ${severityColor[r.severity] || severityColor.unknown}`,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: 16,
                                        color: textColor,
                                        mb: 0.4,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {r.title}
                                    <span style={severityBadge(r.severity)}>{r.severity}</span>
                                    <span style={demoBadge}>{r.source === "hardware" ? "HARDWARE" : "LOG"}</span>
                                    {r.is_json ? <span style={demoBadge}>JSON</span> : null}
                                </Typography>

                                <Typography sx={{ opacity: 0.85, color: textColor }}>{r.detail}</Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {r.source === "hardware" && deviceInfo?.ip && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => pingNow(deviceInfo.ip)}
                                            disabled={!isAdmin || showDemoOnly}
                                        >
                                            Ping
                                        </Button>

                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
                                            onClick={() => runDiagnostics(deviceInfo.ip)}
                                            disabled={!isAdmin || showDemoOnly}
                                        >
                                            Diagnostics
                                        </Button>
                                    </>
                                )}

                                {/* {r.source === "log" && r.is_real && (
  <Button
    variant="contained"
    size="small"
    onClick={(e) => {
      e.stopPropagation?.(); // אם בעתיד כל הכרטיס יהיה קליקבילי
      navigate(`/issue/${r.logId}`);
    }}
  >
    VIEW
  </Button>
)} */}

                                {r.source === "log" && r.is_real && !r.is_json && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation?.();
                                            navigate(`/issue/${r.logId}`);
                                        }}
                                    >
                                        VIEW
                                    </Button>
                                )}

                            </Box>
                        </Box>
                    ))
                )}
            </Paper>

            {/* ---------------- Add Log Modal ---------------- */}
            <Modal open={openAddLog} onClose={() => setOpenAddLog(false)}>
                <Box sx={{ ...modalStyle, width: "720px", maxWidth: "92vw" }}>
                    <Paper
                        sx={{
                            width: "100%",
                            padding: 3,
                            background: bgCard,
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.10)",
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
                                Add New Log
                            </Typography>

                            <Button variant="outlined" onClick={() => setOpenAddLog(false)}>
                                Close
                            </Button>
                        </Box>

                        <Typography sx={{ color: textColor, opacity: 0.75, fontSize: 13, mb: 2 }}>
                            שימו לב: לוג חדש יתווסף ל־DB עבור ה־IP שבחרת.
                        </Typography>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
                            <TextField
                                label="Computer Name"
                                value={newLogComputer}
                                onChange={(e) => setNewLogComputer(e.target.value)}
                                fullWidth
                            />

                            <TextField
                                label="Error Type"
                                value={newLogType}
                                onChange={(e) => setNewLogType(e.target.value)}
                                select
                                fullWidth
                            >
                                <MenuItem value="Hardware">Hardware</MenuItem>
                                <MenuItem value="Software">Software</MenuItem>
                                <MenuItem value="Network">Network</MenuItem>
                            </TextField>

                            <TextField
                                label="Severity"
                                value={newLogSeverity}
                                onChange={(e) => setNewLogSeverity(e.target.value)}
                                select
                                fullWidth
                                sx={{ gridColumn: "1 / span 1" }}
                            >
                                <MenuItem value="Critical">Critical</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </TextField>
                        </Box>

                        <TextField
                            label="Description"
                            value={newLogDesc}
                            onChange={(e) => setNewLogDesc(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                            sx={{ mb: 1.5 }}
                        />

                        {!!addLogErr && (
                            <Typography sx={{ color: "#fecaca", fontWeight: 800, mb: 1 }}>
                                {addLogErr}
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={async () => {
                                const ok = await addNewLog();
                                if (ok) setOpenAddLog(false);
                            }}
                            disabled={addingLog}
                        >
                            {addingLog ? "Adding..." : "Add Log"}
                        </Button>

                        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                            <Button variant="outlined" size="small" onClick={() => refreshLogsForIP(ip)} disabled={!ip}>
                                Refresh Results
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setNewLogType("Hardware");
                                    setNewLogSeverity("Low");
                                    setNewLogDesc("");
                                    setAddLogErr("");
                                }}
                            >
                                Clear Form
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Modal>

            {/* ---------------- Diagnostics Modal ---------------- */}
            <Modal open={openDiag} onClose={() => setOpenDiag(false)}>
                <Box sx={modalStyle}>
                    <Typography sx={{ color: "#e5e7eb", fontWeight: 900, fontSize: 18, mb: 1 }}>
                        Diagnostics
                    </Typography>

                    <Typography sx={{ color: "#e5e7eb", opacity: 0.8, mb: 2 }}>
                        IP: <b>{ip || diagData?.ip || deviceInfo?.ip || "—"}</b>
                    </Typography>

                    {diagLoading && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <CircularProgress size={18} />
                            <Typography sx={{ color: "#e5e7eb", opacity: 0.85 }}>
                                Running diagnostics...
                            </Typography>
                        </Box>
                    )}

                    {!diagLoading && diagErr && (
                        <Typography sx={{ color: "#fecaca", fontWeight: 700 }}>
                            {diagErr}
                        </Typography>
                    )}

                    {!diagLoading && diagData && (
                        <>
                            <Paper
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    mb: 2,
                                }}
                            >
                                <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                    Health Score
                                </Typography>
                                <Typography sx={{ color: "#a78bfa", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
                                    {Math.round(diagData.health_score ?? 0)}%
                                </Typography>
                            </Paper>

                            <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                Checks
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                                <StatusChip ok={!!diagData?.diagnostic_report?.cpu_ok} label="CPU OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.gpu_ok} label="GPU OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.ram_ok} label="RAM OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.storage_ok} label="Storage OK" />
                            </Box>

                            <Divider sx={{ opacity: 0.2, my: 2 }} />

                            <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                Live Metrics
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
                                <MetricCard label="CPU Temp" value={metrics.cpu} unit="°C" tone={metrics.cpuTone} />
                                <MetricCard label="GPU Temp" value={metrics.gpu} unit="°C" tone={metrics.gpuTone} />
                                <MetricCard label="RAM Used" value={metrics.ram} unit="%" tone={metrics.ramTone} />
                                <MetricCard label="SSD Health" value={metrics.ssd} unit="%" tone={metrics.ssdTone} />
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setOpenDiag(false)}
                                sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 900 }}
                            >
                                Close
                            </Button>
                        </>
                    )}

                    {!diagLoading && !diagData && !diagErr && (
                        <Button variant="outlined" fullWidth onClick={() => setOpenDiag(false)}>
                            Close
                        </Button>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}
