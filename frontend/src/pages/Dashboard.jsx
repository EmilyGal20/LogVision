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
    Pagination,
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

    // Timeline UI
    const [timelineQuery, setTimelineQuery] = useState("");
    const [timelinePage, setTimelinePage] = useState(1);
    const TIMELINE_PAGE_SIZE = 5;

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

    const normalizedQuery = timelineQuery.trim().toLowerCase();

    const filteredTimeline = timeline.filter((log) => {
        if (!normalizedQuery) return true;

        const haystack = [
            log.error_type,
            log.description,
            log.ip,
            log.computer_name,
            log.severity,
            log.status,
        ]
            .map((x) => String(x || "").toLowerCase())
            .join(" ");

        return haystack.includes(normalizedQuery);
    });

    const timelinePageCount = Math.max(
        1,
        Math.ceil(filteredTimeline.length / TIMELINE_PAGE_SIZE)
    );

    // אם חיפוש/שינוי נתונים גורם לדף לצאת מהטווח
    useEffect(() => {
        if (timelinePage > timelinePageCount) setTimelinePage(1);
    }, [timelinePage, timelinePageCount]);

    const pagedTimeline = filteredTimeline.slice(
        (timelinePage - 1) * TIMELINE_PAGE_SIZE,
        timelinePage * TIMELINE_PAGE_SIZE
    );

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
    // LIVE WEBSOCKET ALERTS (NO SPAM + ignores ping)
    // ================================================================
    const initWebSocket = useCallback(() => {
        const httpBase = api?.defaults?.baseURL || "http://localhost:8000";
        const wsBase = httpBase.replace(/^http/, "ws");

        const raw = localStorage.getItem("auth");
        const token = raw ? JSON.parse(raw)?.token : null;

        // const wsUrl = token
        //     ? `${wsBase}/ws/errors?token=${encodeURIComponent(token)}`
        //     : `${wsBase}/ws/errors`;

        const wsUrl = `${wsBase}/ws/errors`;


        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            // console.log("WebSocket connected to /ws/errors");
            if (token) {
                ws.send(JSON.stringify({ type: "auth", token }));
            }
        };

        ws.onmessage = (msg) => {
            // console.log("WS raw:", msg.data);

            let incoming;
            try {
                incoming = JSON.parse(msg.data);
            } catch {
                return;
            }

            if (incoming?.type === "ping") return;

            const alertPayload = incoming?.payload ?? incoming;

            if (alertPayload?.type && alertPayload?.message) {
                setNewIssue(alertPayload);
                setShowNewAlert(true);
                loadData();
            }
        };

        ws.onerror = () => {
            // console.error("WebSocket error:", err);
        };

        ws.onclose = (e) => {
            if (!e.wasClean) {
                console.warn("WebSocket closed, retrying in 5s...");
            }
            retryTimeoutRef.current = setTimeout(initWebSocket, 5000);
        };
    }, [loadData]);


    useEffect(() => {
        initWebSocket();
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
                retryTimeoutRef.current = null;
            }
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close();
                wsRef.current = null;
            }
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

    // const bgCard = mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
    const bgCard = "transparent";
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
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: "1fr",          // 📱 מובייל — כרטיס אחד בשורה
                    sm: "repeat(2, 1fr)", // 📱 טאבלט — 2 כרטיסים
                    md: "repeat(3, 1fr)", // 💻 דסקטופ — 3 כרטיסים
                }}
                gap={{ xs: 3, md: 5 }}
                mb={6}
            >
                <StatCard title="Total Errors" value={logs.length} color="#ef4444" onClick={() => navigate("/logs?filter=all")} />
                <StatCard title="Unique IPs" value={uniqueIPs} color="#3b82f6" onClick={() => navigate("/logs")} />
                <Paper
                    sx={{
                        p: 3,
                        borderRadius: 4,
                        background: bgCard,
                        cursor: "pointer",
                        // maxWidth: 250,
                        // maxHeight: 300,
                        minHeight: 260,
                        width: "100%",
                        overflow: "hidden",
                    }}
                    onClick={() => navigate("/logs")}
                >
                    <Typography mb={1} sx={{ color: textPrimary }}>
                        Severity Breakdown
                    </Typography>

                    <Box
                        sx={{
                            position: "relative",
                            width: "100%",
                            height: { xs: 220, sm: 200 }, // 👈 במובייל גבוה יותר
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Doughnut
                            data={severityData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false, // 👈 חובה עם height
                                plugins: {
                                    legend: {
                                        position: "bottom",     // 👈 הרבה יותר טוב במובייל
                                        labels: {
                                            boxWidth: 12,
                                            padding: 10,
                                        },
                                    },
                                },
                                layout: { padding: 6 },
                            }}
                        />
                    </Box>
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
            {/* ISSUE TIMELINE */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                    mt: 4,
                    mb: 2,
                    width: "80%",
                }}
            >
                <Typography variant="h5" sx={{ color: textPrimary }}>
                    Issue Timeline
                </Typography>

                <TextField
                    size="small"
                    placeholder="Search IP / type / message…"
                    value={timelineQuery}
                    onChange={(e) => {
                        setTimelineQuery(e.target.value);
                        setTimelinePage(1);
                    }}
                    sx={{ width: 280 }}
                />
            </Box>

            <Paper sx={{ p: 2, borderRadius: 3, background: bgCard, width: "80%" }}>
                {pagedTimeline.map((log, index) => (
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

                {pagedTimeline.length === 0 && (
                    <Typography sx={{ opacity: 0.7, color: textPrimary, py: 2 }}>
                        No timeline items found.
                    </Typography>
                )}

                <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                    <Pagination
                        count={timelinePageCount}
                        page={timelinePage}
                        onChange={(_, page) => setTimelinePage(page)}
                        color="primary"
                        shape="rounded"
                        size="small"
                    />
                </Box>
            </Paper>


            {/* LIVE ALERT SNACKBAR */}
            <Snackbar
                open={showNewAlert}
                autoHideDuration={4000}
                onClose={() => setShowNewAlert(false)}
            >
                <Alert severity="error" sx={{ fontSize: 16 }}>
                    🚨 New LIVE Alert: {newIssue?.type} ({newIssue?.device_ip || "unknown"})
                </Alert>
            </Snackbar>

        </Box>
    );
}
