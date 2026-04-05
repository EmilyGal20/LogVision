import { useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Paper, Typography, Box, Chip, Button, Snackbar, Alert,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem
} from "@mui/material";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

import MemoryIcon from "@mui/icons-material/Memory";
import BugReportIcon from "@mui/icons-material/BugReport";
import WifiIcon from "@mui/icons-material/Wifi";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import RefreshIcon from "@mui/icons-material/Refresh";

import usePersistentState from "../hooks/usePersistentState";

export default function Logs() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode } = useThemeMode();

    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        ip: "",
        computer_name: "",
        error_type: "Software",
        severity: "Medium",
        description: "",
        status: "open",
    });

    const setField = (key, value) =>
        setAddForm(prev => ({ ...prev, [key]: value }));

    const [logs, setLogs] = usePersistentState("logs-page-data", []);
    const [newIssue, setNewIssue] = useState(null);
    const [showAlert, setShowAlert] = useState(false);

    const wsRef = useRef(null);
    const retryRef = useRef(null);

    // Allows use inside websocket safely
    const setLogsRef = useRef(setLogs);
    setLogsRef.current = setLogs;

    const params = new URLSearchParams(location.search);
    const filterCategory = params.get("category");
    const filterSeverity = params.get("severity");
    const filterAll = params.get("filter");

    // ============================================================
    // LOAD LOGS
    // ============================================================
    const loadLogs = useCallback(async () => {
        try {
            const realRes = await api.get("/logs/");
            const real = Array.isArray(realRes.data) ? realRes.data : [];

            const hwRes = await api.get("/logs/hardware");
            const hardwareErrors = Array.isArray(hwRes.data)
                ? hwRes.data.map((item, index) => ({
                    ...item,
                    id: `json-${item.id ?? "noid"}-${index}`, // ✅ תמיד ייחודי
                    source: "json",
                }))
                : [];


            // let merged = [...real];
            let merged = real.filter(l => l.source !== "json");

            if (filterCategory) merged = merged.filter(l => l.error_type === filterCategory);
            if (filterSeverity) merged = merged.filter(l => l.severity === filterSeverity);
            if (filterAll === "all") merged = [...hardwareErrors, ...real];

            setLogsRef.current(merged);
        } catch (e) {
            console.error("Failed loading logs:", e);
            setLogsRef.current([]);
        }
    }, [filterCategory, filterSeverity, filterAll]);

    // ============================================================
    // DELETE / REFRESH
    // ============================================================
    useEffect(() => {
        if (location.state?.deletedId) {
            const deleted = String(location.state.deletedId);
            setLogsRef.current(prev => prev.filter(l => String(l.id) !== deleted));
            navigate(location.pathname, { replace: true, state: {} });
        }

        if (location.state?.refresh) {
            loadLogs();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, loadLogs, navigate]);

    // ============================================================
    // WEBSOCKET (ONLY ONCE)
    // ============================================================
    const initWebSocket = useCallback(() => {
        const ws = new WebSocket(
            `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname
            }:8000/ws/errors`
        );

        wsRef.current = ws;

        ws.onmessage = msg => {
            try {
                const data = JSON.parse(msg.data);

                if (!data.payload) return;

                const issue = data.payload;
                setNewIssue(issue);
                setShowAlert(true);

                setLogsRef.current(prev => {
                    if (prev.some(l => String(l.id) === String(issue.id))) return prev;
                    return [issue, ...prev];
                });
            } catch { }
        };

        ws.onclose = () => {
            retryRef.current = setTimeout(initWebSocket, 5000);
        };
    }, []);

    // INIT ONLY ONCE
    useEffect(() => {
        loadLogs();
        initWebSocket();

        return () => {
            wsRef.current?.close();
            clearTimeout(retryRef.current);
        };
    }, [loadLogs, initWebSocket]);

    // ============================================================
    // UI
    // ============================================================
    // const bgCard = mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    const bgCard = "transparent";

    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const severityColor = {
        Critical: "#ef4444",
        Medium: "#facc15",
        Low: "#4ade80",
    };

    const iconForType = type => {
        switch (type) {
            case "Hardware":
                return <MemoryIcon sx={{ color: "#7c3aed" }} />;
            case "Software":
                return <BugReportIcon sx={{ color: "#06b6d4" }} />;
            case "Network":
                return <WifiIcon sx={{ color: "#3b82f6" }} />;
            default:
                return <ErrorIcon />;
        }
    };

    // const openIssue = log => navigate(`/issue/${log.id}`);

    const openIssue = log => {
        if (log.source === "json") return; // ⛔ אין דף ל־JSON
        navigate(`/issue/${log.id}`);
    };

    const STATUS_MAP = {
        open: { label: "OPEN", color: "error", icon: <ErrorIcon /> },
        resolved: { label: "RESOLVED", color: "success", icon: <CheckCircleIcon /> },
        investigating: { label: "INVESTIGATING", color: "warning", icon: <ErrorIcon /> },
    };

    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Box>
                    <Typography variant="h4" className="lv-hero__title" sx={{ color: textColor }}>
                        LOG INTELLIGENCE
                    </Typography>
                    <Typography className="lv-hero__subtitle" sx={{ color: textColor }}>
                        Incident stream with live severity and status signals.
                    </Typography>
                </Box>

                <Box className="lv-strip">
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<RefreshIcon />}
                        onClick={loadLogs}
                    >
                        Refresh Logs
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setAddOpen(true)}
                    >
                        + Add Log
                    </Button>
                </Box>
            </Box>

            <Paper className="lv-panel">
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", md: "48px 1fr 140px 120px" },
                            gap: 2,
                            px: 1,
                            py: 1,
                            borderRadius: 10,
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(201,165,95,0.16)",
                            fontWeight: 800,
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            fontSize: 12,
                        }}
                    >
                        <Box />
                        <Typography sx={{ color: textColor }}>Incident</Typography>
                        <Typography sx={{ color: textColor }}>IP / Time</Typography>
                        <Typography sx={{ color: textColor }}>Status</Typography>
                    </Box>
                    {logs.map((log, i) => {
                        const statusKey = (log.status || "open").toLowerCase();
                        const status = STATUS_MAP[statusKey] || STATUS_MAP.open;

                        return (
                            <Paper
                                key={`${log.source || "db"}-${String(log.id ?? `missing-${i}`)}-${log.ip || "noip"}`}
                                sx={{
                                    p: 2.5,
                                    borderRadius: "14px",
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: "48px 1fr 140px 120px" },
                                    alignItems: "center",
                                    gap: 2,
                                    cursor: "pointer",
                                    background: bgCard,
                                    borderLeft: `8px solid ${severityColor[log.severity]}`,
                                    border: "1px solid rgba(201,165,95,0.16)",
                                    transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                                    "&:hover": {
                                        transform: "translateY(-2px)",
                                        boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
                                        borderColor: "rgba(182,72,82,0.22)",
                                    },
                                }}
                                onClick={() => openIssue(log)}
                            >
                                <Box sx={{ pt: { xs: 0, md: 0.5 } }}>{iconForType(log.error_type)}</Box>

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography sx={{ fontWeight: 800, color: textColor }}>
                                        {log.error_type} — {log.computer_name}
                                    </Typography>

                                    <Typography sx={{ opacity: 0.82, color: textColor, mt: 0.5 }}>
                                        {log.description}
                                    </Typography>
                                </Box>

                                <Box sx={{ display: "grid", gap: 0.5 }}>
                                    <Typography sx={{ color: textColor, fontWeight: 700 }}>
                                        {log.ip}
                                    </Typography>
                                    <Typography sx={{ fontSize: "0.75rem", opacity: 0.6, color: textColor }}>
                                        {new Date(log.created_at || Date.now()).toLocaleString()}
                                    </Typography>
                                </Box>

                                <Chip
                                    icon={status.icon}
                                    label={status.label}
                                    color={status.color}
                                    size="small"
                                />
                            </Paper>
                        );
                    })}

                    {logs.length === 0 && (
                        <Typography sx={{ color: textColor, opacity: 0.6, mt: 3, textAlign: "center" }}>
                            No logs available.
                        </Typography>
                    )}
                </Box>
            </Paper>
            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Log</DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    <Typography sx={{ opacity: 0.7, mb: 2 }}>
                        Create a new incident record for the selected system.
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <TextField
                            label="IP"
                            value={addForm.ip}
                            onChange={(e) => setField("ip", e.target.value)}
                            placeholder="192.168.1.50"
                            fullWidth
                            required
                        />

                        <TextField
                            label="Computer Name"
                            value={addForm.computer_name}
                            onChange={(e) => setField("computer_name", e.target.value)}
                            placeholder="PC-003"
                            fullWidth
                        />

                        <TextField
                            label="Category"
                            select
                            value={addForm.error_type}
                            onChange={(e) => setField("error_type", e.target.value)}
                            fullWidth
                        >
                            {["Software", "Hardware", "Network", "Security", "Other"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Severity"
                            select
                            value={addForm.severity}
                            onChange={(e) => setField("severity", e.target.value)}
                            fullWidth
                        >
                            {["Low", "Medium", "Critical"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Status"
                            select
                            value={addForm.status}
                            onChange={(e) => setField("status", e.target.value)}
                            fullWidth
                        >
                            {["open", "investigating", "resolved"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <TextField
                        label="Description"
                        value={addForm.description}
                        onChange={(e) => setField("description", e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        required
                        sx={{ mt: 2 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Cancel</Button>

                    <Button
                        variant="contained"
                        onClick={async () => {
                            try {
                                // ✅ כאן החיבור לבאק
                                // אם אצלך זה נתיב אחר, תשני כאן בלבד
                                const res = await api.post("/logs/", addForm);

                                // אופציה: אם הבאק מחזיר את הלוג החדש, אפשר להכניס אותו ישר בלי reload
                                const created = res?.data;
                                if (created && created.id) {
                                    setLogsRef.current((prev) => [created, ...prev]);
                                } else {
                                    await loadLogs();
                                }

                                setAddOpen(false);
                            } catch (e) {
                                console.error("Failed creating log:", e);
                                alert("Failed to create log. Check backend endpoint/fields.");
                            }
                        }}
                        disabled={!addForm.ip || !addForm.description}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={showAlert} autoHideDuration={4000} onClose={() => setShowAlert(false)}>
                <Alert severity="error">
                    🚨 New LIVE Issue: {newIssue?.error_type} ({newIssue?.ip})
                </Alert>
            </Snackbar>
        </Box>
    );
}
