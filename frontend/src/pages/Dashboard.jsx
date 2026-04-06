// ================================================================
// DASHBOARD.JSX — Unified Version (Real + Demo Logs Combined, No Warnings)
// ================================================================

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
    Chip,
} from "@mui/material";
import { Bar, Doughnut } from "react-chartjs-2";
import { api } from "../api";
import { motion } from "framer-motion";
import usePersistentState from "../hooks/usePersistentState";
import { useThemeMode } from "../context/ThemeContext";
import { readActivity } from "../utils/activity";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { analyzeLogs, logSummaryText, recommendFromLogs } from "../utils/aiInsights";
import { buildAlerts, buildReports, buildWorklist, defaultRules, saveAlerts } from "../utils/alertsEngine";

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
    const [alertRules, setAlertRules] = usePersistentState("alert-rules", defaultRules());

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

    const insights = useMemo(() => {
        if (!logs.length) {
            return {
                mostRecent: null,
                mostFrequentIp: "-",
                criticalRate: 0,
                avgAgeHours: 0,
                topIps: [],
            };
        }

        const byIp = logs.reduce((acc, l) => {
            if (!l.ip) return acc;
            acc[l.ip] = (acc[l.ip] || 0) + 1;
            return acc;
        }, {});

        const topIps = Object.entries(byIp)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ipAddr, count]) => ({ ip: ipAddr, count }));

        const mostFrequentIp = topIps[0]?.ip || "-";

        const criticalCount = logs.filter((l) => l.severity === "Critical").length;
        const criticalRate = Math.round((criticalCount / logs.length) * 100);

        const now = Date.now();
        const ages = logs
            .map((l) => {
                const t = new Date(l.created_at || now).getTime();
                return Math.max(0, now - t);
            })
            .map((ms) => ms / 36e5);

        const avgAgeHours = ages.length
            ? Math.round((ages.reduce((a, b) => a + b, 0) / ages.length) * 10) / 10
            : 0;

        const sortedByTime = [...logs].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        const mostRecent = sortedByTime[0] || null;

        return { mostRecent, mostFrequentIp, criticalRate, avgAgeHours, topIps };
    }, [logs]);

    const trend = useMemo(() => {
        const now = Date.now();
        const last24 = logs.filter((l) => now - new Date(l.created_at || now).getTime() <= 24 * 60 * 60 * 1000);
        const prev24 = logs.filter((l) => {
            const ts = new Date(l.created_at || now).getTime();
            return now - ts > 24 * 60 * 60 * 1000 && now - ts <= 48 * 60 * 60 * 1000;
        });
        const delta = last24.length - prev24.length;
        const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
        const pct = prev24.length ? Math.round((delta / prev24.length) * 100) : last24.length ? 100 : 0;
        return { last24: last24.length, prev24: prev24.length, delta, direction, pct };
    }, [logs]);

    const spike = useMemo(() => {
        if (!logs.length) return null;
        const now = Date.now();
        const hourBuckets = {};
        logs.forEach((l) => {
            const ts = new Date(l.created_at || now).getTime();
            const hour = Math.floor(ts / 36e5);
            hourBuckets[hour] = (hourBuckets[hour] || 0) + 1;
        });
        const hours = Object.values(hourBuckets);
        const avg = hours.reduce((a, b) => a + b, 0) / (hours.length || 1);
        const lastHour = hourBuckets[Math.floor(now / 36e5)] || 0;
        if (lastHour > avg * 1.5 && lastHour >= 3) {
            return { lastHour, avg: Math.round(avg) };
        }
        return null;
    }, [logs]);

    const activity = useMemo(() => readActivity().slice(0, 6), []);

    const aiSummary = useMemo(() => logSummaryText(logs), [logs]);
    const aiRecs = useMemo(() => recommendFromLogs(logs), [logs]);
    const aiStats = useMemo(() => analyzeLogs(logs), [logs]);
    const alerts = useMemo(() => buildAlerts({ logs, rules: alertRules }), [logs, alertRules]);
    const reports = useMemo(() => buildReports(logs, []), [logs]);
    const worklist = useMemo(() => buildWorklist({ logs, alerts }), [logs, alerts]);

    useEffect(() => {
        saveAlerts(alerts);
    }, [alerts]);

    // ====================================================================
    // RENDER
    // ====================================================================
    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Box>
                    <Typography variant="h4" className="lv-hero__title" sx={{ color: textPrimary }}>
                        COMMAND OVERVIEW
                    </Typography>
                    <Typography className="lv-hero__subtitle" sx={{ color: textPrimary }}>
                        Executive monitoring surface for incidents and operational health.
                    </Typography>
                </Box>

                <Box className="lv-strip">
                    <TextField
                        label="Filter by IP"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        sx={{ width: { xs: "100%", sm: 220 } }}
                    />
                    <Button variant="contained" onClick={loadByIP}>Search</Button>
                    <Button variant="outlined" onClick={resetFilter}>Reset</Button>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.6fr 1fr" },
                    gap: 2,
                }}
            >
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" },
                            gap: 2,
                        }}
                    >
                        <StatCard title="Total Errors" value={logs.length} color="#ef4444" onClick={() => navigate("/logs?filter=all")} />
                        <StatCard title="Unique IPs" value={uniqueIPs} color="#3b82f6" onClick={() => navigate("/logs")} />
                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                background: bgCard,
                                cursor: "pointer",
                                minHeight: 220,
                                width: "100%",
                                overflow: "hidden",
                                border: "1px solid rgba(201,165,95,0.18)",
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
                                    height: { xs: 200, sm: 180 },
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Doughnut
                                    data={severityData}
                                    options={{
                                        responsive: true,
                                        maintainAspectRatio: false,
                                        plugins: {
                                            legend: {
                                                position: "bottom",
                                                labels: { boxWidth: 12, padding: 10 },
                                            },
                                        },
                                        layout: { padding: 6 },
                                    }}
                                />
                            </Box>
                        </Paper>
                    </Box>

                    <Paper className="lv-panel">
                        <Typography mb={2} sx={{ color: textPrimary }}>Errors by Category</Typography>
                        <Bar
                            data={categoryData}
                            options={{
                                onClick: (_, elements) => {
                                    if (elements.length > 0) {
                                        const index = elements[0].index;
                                        const category = categories[index];
                                        navigate(`/logs?category=${category}`);
                                    }
                                },
                            }}
                        />
                    </Paper>
                </Box>

                <Paper className="lv-panel">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2, flexWrap: "wrap" }}>
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
                            sx={{ width: { xs: "100%", sm: 260 } }}
                        />
                    </Box>

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
                                borderRadius: "10px",
                                background: mode === "dark" ? "#1f2937" : "#efe9e2",
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
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
                    gap: 2,
                }}
            >
                <Paper className="lv-panel">
                    <Typography variant="h5" sx={{ color: textPrimary, mb: 2 }}>
                        Operational Insights
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <Paper className="lv-module">
                            <Typography sx={{ opacity: 0.7 }}>Critical Rate</Typography>
                            <Typography sx={{ fontSize: 28, fontWeight: 900, color: "#ef4444" }}>
                                {insights.criticalRate}%
                            </Typography>
                        </Paper>
                        <Paper className="lv-module">
                            <Typography sx={{ opacity: 0.7 }}>Average Age</Typography>
                            <Typography sx={{ fontSize: 28, fontWeight: 900 }}>
                                {insights.avgAgeHours}h
                            </Typography>
                        </Paper>
                        <Paper className="lv-module">
                            <Typography sx={{ opacity: 0.7 }}>Top IP</Typography>
                            <Typography sx={{ fontSize: 22, fontWeight: 900 }}>
                                {insights.mostFrequentIp}
                            </Typography>
                        </Paper>
                        <Paper className="lv-module">
                            <Typography sx={{ opacity: 0.7 }}>Latest Incident</Typography>
                            <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
                                {insights.mostRecent?.description || "-"}
                            </Typography>
                        </Paper>
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Top Offenders
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.2 }}>
                        {insights.topIps.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No IP data yet.</Typography>
                        )}
                        {insights.topIps.map((item) => (
                            <Box key={item.ip} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                <Typography sx={{ fontWeight: 800 }}>{item.ip}</Typography>
                                <Chip label={`${item.count} incidents`} />
                            </Box>
                        ))}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                        <Button variant="outlined" onClick={() => navigate("/logs")}>Open Logs</Button>
                        <Button variant="outlined" onClick={() => navigate("/search")}>Diagnostics</Button>
                    </Box>
                </Paper>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr 1fr" },
                    gap: 2,
                }}
            >
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        AI Ops Summary
                    </Typography>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                        {aiSummary.headline}
                    </Typography>
                    <Box sx={{ display: "grid", gap: 0.6 }}>
                        {aiSummary.bullets.map((b, i) => (
                            <Typography key={i} sx={{ opacity: 0.75 }}>
                                {b}
                            </Typography>
                        ))}
                    </Box>
                    {aiStats.mostSevere && (
                        <Box sx={{ mt: 2 }}>
                            <Typography sx={{ fontWeight: 800 }}>Most severe now</Typography>
                            <Typography sx={{ opacity: 0.8 }}>
                                {aiStats.mostSevere.error_type} · {aiStats.mostSevere.ip} · {aiStats.mostSevere.severity}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Trend Intelligence
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        {trend.direction === "up" && <ArrowUpwardIcon sx={{ color: "#ef4444" }} />}
                        {trend.direction === "down" && <ArrowDownwardIcon sx={{ color: "#4ade80" }} />}
                        <Typography sx={{ fontWeight: 800 }}>
                            {trend.last24} incidents in last 24h
                        </Typography>
                    </Box>
                    <Typography sx={{ opacity: 0.75 }}>
                        Prev 24h: {trend.prev24} · Change: {trend.delta >= 0 ? "+" : ""}{trend.delta} ({trend.pct}%)
                    </Typography>
                    {spike && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}>
                            <WarningAmberIcon sx={{ color: "#facc15" }} />
                            <Typography sx={{ fontWeight: 700 }}>
                                Recent spike detected: {spike.lastHour} vs avg {spike.avg}/hr
                            </Typography>
                        </Box>
                    )}
                    {insights.criticalRate >= 35 && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                            <WarningAmberIcon sx={{ color: "#ef4444" }} />
                            <Typography sx={{ fontWeight: 700 }}>
                                Anomaly: critical rate is {insights.criticalRate}%
                            </Typography>
                        </Box>
                    )}
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Recommended Actions
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {aiRecs.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No recommendations yet.</Typography>
                        )}
                        {aiRecs.map((rec, idx) => (
                            <Box key={idx} sx={{ display: "grid", gap: 0.3 }}>
                                <Typography sx={{ fontWeight: 800 }}>{rec.title}</Typography>
                                <Typography sx={{ opacity: 0.7 }}>{rec.reason}</Typography>
                                <Typography sx={{ opacity: 0.6, fontSize: 12 }}>{rec.action}</Typography>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                        <Button variant="outlined" onClick={() => navigate("/logs")}>Open Logs</Button>
                        <Button variant="outlined" onClick={() => navigate("/search")}>Diagnostics</Button>
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Recent Activity
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {activity.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No recent activity.</Typography>
                        )}
                        {activity.map((item) => (
                            <Box
                                key={item.id}
                                sx={{ display: "flex", justifyContent: "space-between", gap: 2, cursor: item.route ? "pointer" : "default" }}
                                onClick={() => item.route && navigate(item.route)}
                            >
                                <Typography sx={{ fontWeight: 700 }}>{item.label}</Typography>
                                <Typography sx={{ opacity: 0.7, fontSize: 12 }}>
                                    {new Date(item.ts).toLocaleString()}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Alerts Center
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {alerts.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No active alerts.</Typography>
                        )}
                        {alerts.slice(0, 6).map((a) => (
                            <Box key={a.id} sx={{ display: "grid", gap: 0.2 }}>
                                <Typography sx={{ fontWeight: 800 }}>{a.title}</Typography>
                                <Typography sx={{ opacity: 0.75 }}>{a.reason}</Typography>
                                <Typography sx={{ opacity: 0.6, fontSize: 12 }}>
                                    Severity: {a.severity} · {new Date(a.ts).toLocaleString()}
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                                    <Button variant="outlined" size="small" onClick={() => navigate(a.route || "/logs")}>
                                        {a.action || "Open"}
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Priority Worklist
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {worklist.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No urgent tasks.</Typography>
                        )}
                        {worklist.map((w) => (
                            <Box key={w.id} sx={{ display: "grid", gap: 0.2 }}>
                                <Typography sx={{ fontWeight: 800 }}>{w.title}</Typography>
                                <Typography sx={{ opacity: 0.75 }}>{w.reason}</Typography>
                                <Button variant="outlined" size="small" onClick={() => navigate(w.route || "/logs")}>
                                    Open
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Rules & Conditions
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {alertRules.map((rule) => (
                            <Box key={rule.id} sx={{ display: "grid", gap: 0.4 }}>
                                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                    <Typography sx={{ fontWeight: 800 }}>{rule.label}</Typography>
                                    <Button
                                        size="small"
                                        variant={rule.enabled ? "contained" : "outlined"}
                                        onClick={() =>
                                            setAlertRules((prev) =>
                                                prev.map((r) => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)
                                            )
                                        }
                                    >
                                        {rule.enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </Box>
                                {rule.threshold != null && (
                                    <Typography sx={{ opacity: 0.7 }}>
                                        Threshold: {rule.threshold} · Window: {rule.windowHours}h
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textPrimary, mb: 2 }}>
                        Reports Snapshot (24h)
                    </Typography>
                    <Box sx={{ display: "grid", gap: 0.6 }}>
                        <Typography sx={{ fontWeight: 800 }}>Incidents: {reports.last24Count}</Typography>
                        <Typography sx={{ opacity: 0.75 }}>Top IPs:</Typography>
                        {reports.topIps.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>No IP data.</Typography>
                        )}
                        {reports.topIps.map(([ip, count]) => (
                            <Typography key={ip} sx={{ opacity: 0.8 }}>
                                {ip} · {count}
                            </Typography>
                        ))}
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const lines = [
                                    `Last 24h incidents: ${reports.last24Count}`,
                                    `Top IPs:`,
                                    ...reports.topIps.map(([ip, c]) => `${ip}: ${c}`),
                                ];
                                navigator.clipboard?.writeText?.(lines.join("\n"));
                            }}
                        >
                            Copy Report
                        </Button>
                    </Box>
                </Paper>
            </Box>

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
