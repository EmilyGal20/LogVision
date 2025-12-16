import { useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Paper, Typography, Box, Chip, Button, Snackbar, Alert } from "@mui/material";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

import MemoryIcon from "@mui/icons-material/Memory";
import BugReportIcon from "@mui/icons-material/BugReport";
import WifiIcon from "@mui/icons-material/Wifi";
import ErrorIcon from "@mui/icons-material/Error";
import RefreshIcon from "@mui/icons-material/Refresh";

import usePersistentState from "../hooks/usePersistentState";

export default function Logs() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode } = useThemeMode();

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
                    id: `json-${item.id ?? index + 1}`,
                    source: "json",
                }))
                : [];

            let merged = [...hardwareErrors, ...real];

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
    const bgCard = mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
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

    const openIssue = log => navigate(`/issue/${log.id}`);

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" mb={3}>
                <Typography variant="h4" sx={{ color: textColor }}>
                    Logs
                </Typography>

                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<RefreshIcon />}
                    onClick={loadLogs}
                >
                    Refresh Logs
                </Button>
            </Box>

            <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                {logs.map((log, i) => (
                    <Paper
                        key={log.id ?? `missing-${i}`}
                        sx={{
                            p: 3,
                            mb: 2,
                            borderRadius: "14px",
                            display: "flex",
                            gap: 2,
                            cursor: "pointer",
                            background: bgCard,
                            borderLeft: `8px solid ${severityColor[log.severity]}`,
                        }}
                        onClick={() => openIssue(log)}
                    >
                        <Box sx={{ pt: 1 }}>{iconForType(log.error_type)}</Box>

                        <Box sx={{ flexGrow: 1 }}>
                            <Typography sx={{ fontWeight: "bold", color: textColor }}>
                                {log.error_type} — {log.computer_name}
                            </Typography>

                            <Typography sx={{ opacity: 0.8, color: textColor }}>
                                {log.description}
                            </Typography>

                            <Typography sx={{ mt: 1, color: textColor }}>
                                IP: <b>{log.ip}</b>
                            </Typography>

                            <Typography
                                sx={{
                                    mt: 1,
                                    fontSize: "0.75rem",
                                    opacity: 0.6,
                                    color: textColor,
                                }}
                            >
                                {new Date(log.created_at || Date.now()).toLocaleString()}
                            </Typography>
                        </Box>

                        <Chip
                            label={log.source === "json" ? "JSON" : "REAL"}
                            color={log.source === "json" ? "warning" : "info"}
                            sx={{ fontWeight: "bold", height: "28px" }}
                        />
                    </Paper>
                ))}

                {logs.length === 0 && (
                    <Typography sx={{ color: textColor, opacity: 0.6, mt: 5, textAlign: "center" }}>
                        No logs available.
                    </Typography>
                )}
            </Box>

            <Snackbar open={showAlert} autoHideDuration={4000} onClose={() => setShowAlert(false)}>
                <Alert severity="error">
                    🚨 New LIVE Issue: {newIssue?.error_type} ({newIssue?.ip})
                </Alert>
            </Snackbar>
        </Box>
    );
}
