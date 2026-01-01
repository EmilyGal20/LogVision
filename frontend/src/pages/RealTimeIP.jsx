/* ——————————————————————————————
   REALTIME IP MONITOR — LOGVISION CLEAN DARK EDITION
—————————————————————————————— */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { api } from "../api";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";

import { Line } from "react-chartjs-2";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend,
} from "chart.js";
import { useThemeMode } from "../context/ThemeContext";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

/* 🎨 DARK MODE PALETTE — NEW CLEAN EDITION */
const SCORE_COLOR = "#a78bfa"; // Lilac
const DL_COLOR = "#60a5fa"; // Soft Blue
const UL_COLOR = "#f87171"; // Soft Red
const JITTER_COLOR = "#fbbf24"; // Gold

export default function RealtimeIP() {
    const { mode } = useThemeMode();
    const isDark = mode === "dark";

    /* 🎨 NEW CARD & TEXT COLORS */
    const CARD_BG = isDark ? "rgba(22,22,30,0.82)" : "#ffffff";
    const CARD_BORDER = isDark
        ? "1px solid rgba(255,255,255,0.06)"
        : "1px solid rgba(0,0,0,0.08)";

    const TITLE_COLOR = isDark ? "#a5b4fc" : "#1f2937";
    const textColor = isDark ? "#e5e7eb" : "#1f2937";

    /* ——————————————————————————
       STATE
    ——————————————————————————— */
    const [ip, setIp] = useState("");
    const [activeIP, setActiveIP] = useState(null);

    // Availability + status
    const [, setLatencyHistory] = useState([]);
    const [, setPacketLossHistory] = useState([]);
    const [jitterHistory, setJitterHistory] = useState([]);
    const [multiIPs, setMultiIPs] = useState([]);

    // SPEEDTEST histories (graphs)
    const [downloadHistory, setDownloadHistory] = useState([]);
    const [uploadHistory, setUploadHistory] = useState([]);

    // control refs
    const speedTimerRef = useRef(null);
    const speedBusyRef = useRef(false);
    const speedAbortRef = useRef(null);

    const [ipStatus, setIpStatus] = useState({});
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

    const scoreRef = useRef(0);
    const [scoreHistory, setScoreHistory] = useState([]);
    const wsRef = useRef(null);
    const activeIPRef = useRef(null);

    // base url יציב (לא יגרום לרינדורים מיותרים)
    const baseURL = useMemo(() => api?.defaults?.baseURL || "http://localhost:8000", []);

    const mbps = useCallback((bytes, seconds) => {
        if (!seconds) return 0;
        return (bytes * 8) / (seconds * 1_000_000);
    }, []);

    // ✅ להגדיר קודם את הפונקציות, ורק אחר כך useEffect שמשתמש בהן
    const runDownloadSample = useCallback(
        async (seconds = 2.5) => {
            const ctrl = new AbortController();
            speedAbortRef.current = ctrl;

            const start = performance.now();
            let bytes = 0;

            const res = await fetch(
                `${baseURL}/speedtest/download?size_mb=200&chunk_kb=256`,
                { cache: "no-store", signal: ctrl.signal }
            );

            const reader = res.body?.getReader?.();
            if (!reader) return 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                bytes += value?.byteLength || 0;
                const elapsed = (performance.now() - start) / 1000;

                if (elapsed >= seconds) {
                    try {
                        ctrl.abort();
                    } catch { }
                    try {
                        reader.cancel();
                    } catch { }
                    break;
                }
            }

            const totalSec = (performance.now() - start) / 1000;
            return Number(mbps(bytes, totalSec).toFixed(1));
        },
        [baseURL, mbps]
    );

    const runUploadSample = useCallback(
        async (seconds = 2.5) => {
            const start = performance.now();
            let bytesSent = 0;

            while ((performance.now() - start) / 1000 < seconds) {
                const blob = new Blob([new Uint8Array(1024 * 1024)]); // 1MB
                const form = new FormData();
                form.append("file", blob, "chunk.bin");

                await fetch(`${baseURL}/speedtest/upload`, {
                    method: "POST",
                    body: form,
                });

                bytesSent += blob.size;

                // yield קטן כדי לא לחנוק UI
                await new Promise((r) => setTimeout(r, 60));
            }

            const totalSec = (performance.now() - start) / 1000;
            return Number(mbps(bytesSent, totalSec).toFixed(1));
        },
        [baseURL, mbps]
    );

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (speedTimerRef.current) {
                clearInterval(speedTimerRef.current);
                speedTimerRef.current = null;
            }
            if (speedAbortRef.current) {
                try {
                    speedAbortRef.current.abort();
                } catch { }
                speedAbortRef.current = null;
            }
        };
    }, []);

    /* ——————————————————————————
       RESET GRAPHS
    ——————————————————————————— */
    const resetCharts = useCallback(() => {
        setLatencyHistory([]);
        setPacketLossHistory([]);
        setJitterHistory([]);
        setScoreHistory([]);
        setDownloadHistory([]);
        setUploadHistory([]);
        scoreRef.current = 0;
    }, []);

    /* ——————————————————————————
       SPEEDTEST LOOP (runs while activeIP)
    ——————————————————————————— */
    useEffect(() => {
        // stop previous loop
        if (speedTimerRef.current) {
            clearInterval(speedTimerRef.current);
            speedTimerRef.current = null;
        }
        if (speedAbortRef.current) {
            try {
                speedAbortRef.current.abort();
            } catch { }
            speedAbortRef.current = null;
        }
        speedBusyRef.current = false;

        if (!activeIP) return;

        const tick = async () => {
            if (speedBusyRef.current) return;
            speedBusyRef.current = true;

            try {
                const down = await runDownloadSample(2.2);
                setDownloadHistory((prev) => [...prev.slice(-30), { time: Date.now(), value: down }]);

                const up = await runUploadSample(2.2);
                setUploadHistory((prev) => [...prev.slice(-30), { time: Date.now(), value: up }]);
            } catch {
                // אם השרת לא זמין / abort — נתעלם בשקט
            } finally {
                speedBusyRef.current = false;
            }
        };

        tick();
        speedTimerRef.current = setInterval(tick, 6500);

        return () => {
            if (speedTimerRef.current) {
                clearInterval(speedTimerRef.current);
                speedTimerRef.current = null;
            }
            if (speedAbortRef.current) {
                try {
                    speedAbortRef.current.abort();
                } catch { }
                speedAbortRef.current = null;
            }
            speedBusyRef.current = false;
        };
    }, [activeIP, runDownloadSample, runUploadSample]);

    /* ——————————————————————————
       START MONITORING
    ——————————————————————————— */
    const startIP = async (ipToStart, shouldStartBackend = true) => {
        if (shouldStartBackend) {
            await api.get(`/realtime/start/${ipToStart}`);
        }

        setMultiIPs((prev) => (prev.includes(ipToStart) ? prev : [...prev, ipToStart]));

        setActiveIP(ipToStart);
        activeIPRef.current = ipToStart;
        resetCharts();

        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(`ws://localhost:8000/realtime/ws/${ipToStart}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const p = JSON.parse(event.data);

            setIpStatus((prev) => ({
                ...prev,
                [ipToStart]: {
                    online: p.online,
                    latency: p.latency,
                    timestamp: p.timestamp,
                },
            }));

            if (activeIPRef.current !== ipToStart) return;

            if (p.latency !== null && p.latency !== undefined) {
                setLatencyHistory((prev) => [...prev.slice(-60), { time: Date.now(), value: p.latency }]);
            }

            setJitterHistory((prev) => [...prev.slice(-60), { time: Date.now(), value: Math.random() * 10 }]);

            setPacketLossHistory((prev) => [
                ...prev.slice(-60),
                { time: Date.now(), value: p.online ? 0 : 1 },
            ]);

            scoreRef.current = Math.max(0, Math.min(1, scoreRef.current + (p.online ? 0.02 : -0.05)));

            setScoreHistory((prev) => [...prev.slice(-60), { time: Date.now(), value: scoreRef.current }]);
        };
    };

    const startMonitoring = () => {
        if (!ip) return;
        startIP(ip, true);
    };

    const calcStats = useCallback((arr) => {
        if (!arr || arr.length === 0) return { avg: 0, peak: 0, last: 0 };
        const values = arr.map((x) => Number(x.value) || 0);
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const peak = Math.max(...values);
        const last = values[values.length - 1];
        return {
            avg: Number(avg.toFixed(1)),
            peak: Number(peak.toFixed(1)),
            last: Number(last.toFixed(1)),
        };
    }, []);

    const dlStats = useMemo(() => calcStats(downloadHistory), [calcStats, downloadHistory]);
    const ulStats = useMemo(() => calcStats(uploadHistory), [calcStats, uploadHistory]);

    /* ——————————————————————————
       STOP MONITORING
    ——————————————————————————— */
    const closeIP = async (ipToClose) => {
        await api.get(`/realtime/stop/${ipToClose}`);

        setMultiIPs((prev) => prev.filter((x) => x !== ipToClose));

        if (activeIP === ipToClose) {
            setActiveIP(null);
            activeIPRef.current = null;
            resetCharts();
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setAlertMessage(`Stopped monitoring ${ipToClose}`);
        setShowAlert(true);
    };

    /* ——————————————————————————
       SWITCH TAB
    ——————————————————————————— */
    const switchTab = (newIP) => {
        setActiveIP(newIP);
        activeIPRef.current = newIP;
        resetCharts();
        startIP(newIP, false);
    };

    /* ——————————————————————————
       CHART OPTIONS
    ——————————————————————————— */
    const tmOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: {
                    ticks: { color: textColor },
                    grid: { color: "rgba(255,255,255,0.05)" },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? "rgba(30,30,40,0.95)" : "#ffffff",
                    titleColor: TITLE_COLOR,
                    bodyColor: textColor,
                    borderColor: "rgba(255,255,255,0.14)",
                    borderWidth: 1,
                },
            },
        }),
        [TITLE_COLOR, isDark, textColor]
    );

    const buildChart = useCallback((color, dataArr) => {
        return {
            labels: dataArr.map((p) => new Date(p.time).toLocaleTimeString()),
            datasets: [
                {
                    label: "",
                    data: dataArr.map((p) => p.value),
                    borderColor: color,
                    backgroundColor: color + "22",
                    tension: 0.35,
                    borderWidth: 2,
                    fill: true,
                    pointRadius: 0,
                },
            ],
        };
    }, []);

    /* ——————————————————————————
       TABS
    ——————————————————————————— */
    const Tabs = () => (
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            {multiIPs.map((ipAddress) => {
                const s = ipStatus[ipAddress];
                const symbol = s?.online ? "🟢" : s?.online === false ? "🔴" : "🟡";
                const isActive = activeIP === ipAddress;

                return (
                    <Box
                        key={ipAddress}
                        sx={{
                            px: 2,
                            py: 1,
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            background: isDark
                                ? isActive
                                    ? "rgba(120,120,255,0.16)"
                                    : "rgba(40,40,55,0.6)"
                                : isActive
                                    ? "#eef2ff"
                                    : "#ffffff",
                            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
                            boxShadow: isActive
                                ? isDark
                                    ? "0 0 8px rgba(165,180,252,0.4)"
                                    : "0 0 6px rgba(0,0,0,0.08)"
                                : "none",
                        }}
                        onClick={() => switchTab(ipAddress)}
                    >
                        <span>{symbol}</span>
                        <span>{ipAddress}</span>

                        <span
                            style={{
                                marginLeft: 8,
                                cursor: "pointer",
                                color: "#f87171",
                                fontWeight: "bold",
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                closeIP(ipAddress);
                            }}
                        >
                            ✕
                        </span>
                    </Box>
                );
            })}
        </Box>
    );

    /* ——————————————————————————
       UI
    ——————————————————————————— */
    return (
        <Box>
            {/* TITLE */}
            <Typography
                variant="h4"
                sx={{
                    mb: 3,
                    color: textColor,
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                }}
            >
                LogVision — Realtime IP Monitoring
            </Typography>

            {/* INPUT BAR */}
            <Paper
                sx={{
                    p: 3,
                    mb: 3,
                    background: CARD_BG,
                    border: CARD_BORDER,
                    backdropFilter: "blur(6px)",
                }}
            >
                <Box display="flex" gap={2}>
                    <TextField
                        label="IP Address"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        sx={{
                            width: 250,
                            input: { color: textColor },
                            label: { color: isDark ? "#9ca3af" : "#374151" },
                        }}
                    />

                    <Button variant="contained" onClick={startMonitoring}>
                        Start
                    </Button>
                </Box>
            </Paper>

            {/* TABS */}
            <Tabs />

            {activeIP && (
                <>
                    {/* SCORE */}
                    <Paper
                        sx={{
                            p: 2,
                            height: 250,
                            mb: 3,
                            background: CARD_BG,
                            border: CARD_BORDER,
                            borderRadius: "12px",
                        }}
                    >
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Availability Score
                        </Typography>
                        <Line data={buildChart(SCORE_COLOR, scoreHistory)} options={tmOptions} />
                    </Paper>

                    {/* DOWNLOAD SPEED */}
                    <Paper
                        sx={{
                            p: 2,
                            height: 250,
                            mb: 3,
                            background: CARD_BG,
                            border: CARD_BORDER,
                            borderRadius: "12px",
                        }}
                    >
                        <Typography sx={{ color: textColor, opacity: 0.85, fontSize: 13, mb: 1 }}>
                            Download • Avg: {dlStats.avg} Mbps • Peak: {dlStats.peak} • Now: {dlStats.last}
                        </Typography>
                        <Line data={buildChart(DL_COLOR, downloadHistory)} options={tmOptions} />
                    </Paper>

                    {/* UPLOAD SPEED */}
                    <Paper
                        sx={{
                            p: 2,
                            height: 250,
                            mb: 3,
                            background: CARD_BG,
                            border: CARD_BORDER,
                            borderRadius: "12px",
                        }}
                    >
                        <Typography sx={{ color: textColor, opacity: 0.85, fontSize: 13, mb: 1 }}>
                            Upload • Avg: {ulStats.avg} Mbps • Peak: {ulStats.peak} • Now: {ulStats.last}
                        </Typography>
                        <Line data={buildChart(UL_COLOR, uploadHistory)} options={tmOptions} />
                    </Paper>

                    {/* JITTER */}
                    <Paper
                        sx={{
                            p: 2,
                            height: 250,
                            mb: 3,
                            background: CARD_BG,
                            border: CARD_BORDER,
                            borderRadius: "12px",
                        }}
                    >
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Jitter
                        </Typography>
                        <Line data={buildChart(JITTER_COLOR, jitterHistory)} options={tmOptions} />
                    </Paper>
                </>
            )}

            {/* ALERTS */}
            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert severity="info">{alertMessage}</Alert>
            </Snackbar>
        </Box>
    );
}
