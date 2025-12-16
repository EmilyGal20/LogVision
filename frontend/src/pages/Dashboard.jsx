// ================================================================
// DASHBOARD.JSX — Unified Version (Real + Demo Logs Combined, No Warnings)
// ================================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    Typography,
    Paper,
    Box,
    TextField,
    Button,
    Snackbar,
    Alert,
} from "@mui/material";
import { Bar, Doughnut } from "react-chartjs-2";
import { api } from "../api";
import { motion } from "framer-motion";
import usePersistentState from "../hooks/usePersistentState";
import { useThemeMode } from "../context/ThemeContext";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
} from "chart.js";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
);

export default function Dashboard() {
    const { mode } = useThemeMode();
    const navigate = useNavigate();

    const [ip, setIp] = usePersistentState("dash-ip", "");
    const [logs, setLogs] = usePersistentState("dash-logs", []);
    const [timeline, setTimeline] = usePersistentState("dash-timeline", []);

    const [newIssue, setNewIssue] = useState(null);
    const [showNewAlert, setShowNewAlert] = useState(false);

    const wsRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    // ✅ useMemo מוודא ש-demoData לא ייחשב כתלות משתנה
    // const demoData = useMemo(
    //     () => [
    //         {
    //             id: "demo-2",
    //             computer_name: "PC-001",
    //             ip: "192.168.1.50",
    //             error_type: "Network",
    //             description: "Ping timeout detected",
    //             severity: "Critical",
    //             status: "open",
    //             created_at: "2025-12-07T11:20:47",
    //         },
    //         {
    //             id: "demo-1",
    //             computer_name: "PC-001",
    //             ip: "192.168.1.50",
    //             error_type: "Network",
    //             description: "Ping timeout detected",
    //             severity: "Critical",
    //             status: "open",
    //             created_at: "2025-12-07T10:16:38",
    //         },
    //     ],
    //     []
    // );

    // ================================================================
    // LOAD DATA (Combine Real + Demo)
    // ================================================================
    const loadData = useCallback(async () => {
        try {
            const res = await api.get("/logs");
            const real = Array.isArray(res.data) ? res.data : [];

            // ✔️ showes only real errors and no demos
            setLogs(real);
            setTimeline(real);
        } catch (err) {
            console.warn("❌ Failed to load logs:", err);
            setLogs([]);
            setTimeline([]);
        }
    }, [setLogs, setTimeline]);

    const loadByIP = async () => {
        if (!ip.trim()) return loadData();
        try {
            const res = await api.get(`/logs/search?ip=${ip}`);
            const real = Array.isArray(res.data) ? res.data : [];

            // ✔️ real only
            setLogs(real);
            setTimeline(real);
        } catch {
            await loadData();
        }
    };


    const resetFilter = () => {
        setIp("");
        loadData();
    };

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ================================================================
    // LIVE WEBSOCKET ALERTS
    // ================================================================
    const initWebSocket = useCallback(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/errors");
        wsRef.current = ws;

        ws.onopen = () => console.log("WebSocket connected to /ws/errors");

        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);
                if (data.new) {
                    setNewIssue(data.new);
                    setShowNewAlert(true);
                }
                loadData();
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onerror = (err) => console.error("WebSocket error:", err);

        ws.onclose = () => {
            console.log("WebSocket closed, retrying in 5s...");
            retryTimeoutRef.current = setTimeout(initWebSocket, 5000);
        };
    }, [loadData]);

    useEffect(() => {
        initWebSocket();
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        };
    }, [initWebSocket]);

    // ================================================================
    // CHARTS + STATS
    // ================================================================
    const uniqueIPs = [...new Set(logs.map((x) => x.ip))].length;
    const categories = ["Hardware", "Software", "Network"];
    const countErrors = categories.map(
        (cat) => logs.filter((l) => l.error_type === cat).length
    );

    const severityData = {
        labels: ["Critical", "Medium", "Low"],
        datasets: [
            {
                data: [
                    logs.filter((x) => x.severity === "Critical").length,
                    logs.filter((x) => x.severity === "Medium").length,
                    logs.filter((x) => x.severity === "Low").length,
                ],
                backgroundColor: ["#ef4444", "#facc15", "#4ade80"],
            },
        ],
    };

    const categoryData = {
        labels: categories,
        datasets: [
            {
                label: "Errors",
                data: countErrors,
                backgroundColor: ["#7c3aed", "#3b82f6", "#06b6d4"],
                borderRadius: 8,
            },
        ],
    };

    const bgCard = mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    const textPrimary = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const StatCard = ({ title, value, color, onClick }) => (
        <Paper
            onClick={onClick}
            sx={{
                padding: 3,
                borderRadius: 4,
                textAlign: "center",
                background: bgCard,
                backdropFilter: "blur(6px)",
                cursor: onClick ? "pointer" : "default",
                transition: "0.2s",
                "&:hover": onClick ? { transform: "scale(1.02)", opacity: 0.9 } : {},
            }}
        >
            <Typography sx={{ fontSize: 20, opacity: 0.8 }}>{title}</Typography>
            <Typography sx={{ fontSize: 40, color, fontWeight: "bold" }}>
                {value}
            </Typography>
        </Paper>
    );

    // ====================================================================
    // RENDER
    // ====================================================================
    return (
        <Box>
            <Typography variant="h4" mb={3} fontWeight="bold" sx={{ color: textPrimary }}>
                Dashboard
            </Typography>

            {/* SEARCH BAR */}
            <Box display="flex" gap={2} mb={4}>
                <TextField
                    label="Filter by IP"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    sx={{ width: 250 }}
                />
                <Button variant="contained" onClick={loadByIP}>SEARCH</Button>
                <Button variant="outlined" onClick={resetFilter}>RESET</Button>
            </Box>

            {/* TOP CARDS */}
            <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={5} mb={6} >
                <StatCard title="Total Errors" value={logs.length} color="#ef4444" onClick={() => navigate("/logs?filter=all")} />
                <StatCard title="Unique IPs" value={uniqueIPs} color="#3b82f6" onClick={() => navigate("/logs")} />
                <Paper sx={{ padding: 3, borderRadius: 4, background: bgCard, cursor: "pointer", maxWidth: 250, maxHeight: 300 }} onClick={() => navigate("/logs")}>
                    <Typography mb={1} sx={{ color: textPrimary }}>Severity Breakdown</Typography>
                    <Doughnut data={severityData} />
                </Paper>
            </Box>

            {/* CATEGORY BAR CHART */}
            <Paper sx={{ padding: 3, borderRadius: 4, background: bgCard, maxWidth: 600 }}>
                <Typography mb={2} sx={{ color: textPrimary }}>Errors by Category</Typography>
                <Bar data={categoryData} options={{
                    onClick: (_, elements) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            const category = categories[index];
                            navigate(`/logs?category=${category}`);
                        }
                    }
                }} />
            </Paper>

            {/* ISSUE TIMELINE */}
            <Typography variant="h5" mt={4} mb={2} sx={{ color: textPrimary }}>Issue Timeline</Typography>
            <Paper sx={{ p: 2, borderRadius: 3, background: bgCard, width: "80%" }}>
                {timeline.map((log, index) => (
                    <motion.div
                        key={`${log.id}-${index}`}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => navigate(`/issue/${log.id}`)}
                        style={{
                            padding: "12px",
                            marginBottom: "10px",
                            borderRadius: "8px",
                            background: mode === "dark" ? "#1f2937" : "#e5e7eb",
                            color: mode === "dark" ? "#fff" : "#111",
                            cursor: "pointer",
                            borderLeft: `6px solid ${log.severity === "Critical"
                                ? "#ef4444"
                                : log.severity === "Medium"
                                    ? "#facc15"
                                    : "#4ade80"
                                }`,
                        }}
                    >
                        <strong>{log.error_type}</strong> — {log.description}
                        <br />
                        <span style={{ opacity: 0.7 }}>{log.ip}</span>
                    </motion.div>
                ))}
            </Paper>

            {/* LIVE ALERT SNACKBAR */}
            <Snackbar open={showNewAlert} autoHideDuration={4000} onClose={() => setShowNewAlert(false)}>
                <Alert severity="error" sx={{ fontSize: 16 }}>
                    🚨 New LIVE Issue: {newIssue?.error_type} ({newIssue?.ip})
                </Alert>
            </Snackbar>
        </Box>
    );
}
