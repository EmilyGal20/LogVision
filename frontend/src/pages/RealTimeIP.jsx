/* ——————————————————————————————
   REALTIME IP MONITOR — LOGVISION CLEAN DARK EDITION
—————————————————————————————— */

import { useState, useRef } from "react";
import { api } from "../api";
import {
    Box,
    Typography,
    TextField,
    Button,
    Paper
} from "@mui/material";

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
const SCORE_COLOR = "#a78bfa";     // Lilac
const LATENCY_COLOR = "#60a5fa";   // Soft Blue
const LOSS_COLOR = "#f87171";      // Soft Red
const JITTER_COLOR = "#fbbf24";    // Gold

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
       STATE MANAGEMENT
    ——————————————————————————— */
    const [ip, setIp] = useState("");
    const [activeIP, setActiveIP] = useState(null);

    const [latencyHistory, setLatencyHistory] = useState([]);
    const [packetLossHistory, setPacketLossHistory] = useState([]);
    const [jitterHistory, setJitterHistory] = useState([]);
    const [multiIPs, setMultiIPs] = useState([]);

    const [ipStatus, setIpStatus] = useState({});
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

    const scoreRef = useRef(0);
    const [scoreHistory, setScoreHistory] = useState([]);
    const wsRef = useRef(null);

    /* ——————————————————————————
       RESET GRAPHS
    ——————————————————————————— */
    const resetCharts = () => {
        setLatencyHistory([]);
        setPacketLossHistory([]);
        setJitterHistory([]);
        setScoreHistory([]);
        scoreRef.current = 0;
    };

    /* ——————————————————————————
       START MONITORING
    ——————————————————————————— */
    const startIP = async (ipToStart) => {
        await api.get(`/realtime/start/${ipToStart}`);

        if (!multiIPs.includes(ipToStart)) {
            setMultiIPs(prev => [...prev, ipToStart]);
        }

        setActiveIP(ipToStart);
        resetCharts();

        if (wsRef.current) wsRef.current.close();

        const ws = new WebSocket(`ws://localhost:8000/realtime/ws/${ipToStart}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
            const p = JSON.parse(event.data);

            setIpStatus(prev => ({
                ...prev,
                [ipToStart]: {
                    online: p.online,
                    latency: p.latency,
                    timestamp: p.timestamp,
                }
            }));

            if (activeIP !== ipToStart) return;

            if (p.latency !== null) {
                setLatencyHistory(prev => [...prev, { time: Date.now(), value: p.latency }]);
            }

            setJitterHistory(prev => [...prev, { time: Date.now(), value: Math.random() * 10 }]);

            setPacketLossHistory(prev => [
                ...prev,
                { time: Date.now(), value: p.online ? 0 : 1 }
            ]);

            scoreRef.current = Math.max(
                0,
                Math.min(1, scoreRef.current + (p.online ? 0.02 : -0.05))
            );

            setScoreHistory(prev => [
                ...prev,
                { time: Date.now(), value: scoreRef.current }
            ]);
        };
    };

    const startMonitoring = () => {
        if (!ip) return;
        startIP(ip);
    };

    /* ——————————————————————————
       STOP MONITORING
    ——————————————————————————— */
    const closeIP = async (ipToClose) => {
        await api.get(`/realtime/stop/${ipToClose}`);

        setMultiIPs(prev => prev.filter(x => x !== ipToClose));

        if (activeIP === ipToClose) {
            setActiveIP(null);
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
        resetCharts();
        startIP(newIP);
    };

    /* ——————————————————————————
       NEW CLEAN CHART OPTIONS
    ——————————————————————————— */
    const tmOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { display: false },
            y: {
                ticks: { color: textColor },
                grid: { color: "rgba(255,255,255,0.05)" }
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: isDark ? "rgba(30,30,40,0.95)" : "#ffffff",
                titleColor: TITLE_COLOR,
                bodyColor: textColor,
                borderColor: "rgba(255,255,255,0.14)",
                borderWidth: 1
            }
        }
    };

    /* ——————————————————————————
       CHART BUILDER
    ——————————————————————————— */
    const buildChart = (label, color, dataArr) => ({
        labels: dataArr.map(p => new Date(p.time).toLocaleTimeString()),
        datasets: [
            {
                label: "",
                data: dataArr.map(p => p.value),
                borderColor: color,
                backgroundColor: color + "22",
                tension: 0.35,
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
            }
        ]
    });

    /* ——————————————————————————
       TABS — CLEAN DARK STYLE
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
                                ? (isActive ? "rgba(120,120,255,0.16)" : "rgba(40,40,55,0.6)")
                                : (isActive ? "#eef2ff" : "#ffffff"),
                            border: isDark
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(0,0,0,0.1)",
                            boxShadow: isActive
                                ? (isDark
                                    ? "0 0 8px rgba(165,180,252,0.4)"
                                    : "0 0 6px rgba(0,0,0,0.08)")
                                : "none"
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
                        onChange={e => setIp(e.target.value)}
                        sx={{
                            width: 250,
                            input: { color: textColor },
                            label: {
                                color: isDark ? "#9ca3af" : "#374151"
                            }
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
                    <Paper sx={{
                        p: 2, height: 250, mb: 3,
                        background: CARD_BG, border: CARD_BORDER, borderRadius: "12px"
                    }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Availability Score
                        </Typography>
                        <Line data={buildChart("Score", SCORE_COLOR, scoreHistory)} options={tmOptions} />
                    </Paper>

                    {/* LATENCY */}
                    <Paper sx={{
                        p: 2, height: 250, mb: 3,
                        background: CARD_BG, border: CARD_BORDER, borderRadius: "12px"
                    }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Latency (ms)
                        </Typography>
                        <Line data={buildChart("Latency", LATENCY_COLOR, latencyHistory)} options={tmOptions} />
                    </Paper>

                    {/* PACKET LOSS */}
                    <Paper sx={{
                        p: 2, height: 250, mb: 3,
                        background: CARD_BG, border: CARD_BORDER, borderRadius: "12px"
                    }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Packet Loss
                        </Typography>
                        <Line data={buildChart("PacketLoss", LOSS_COLOR, packetLossHistory)} options={tmOptions} />
                    </Paper>

                    {/* JITTER */}
                    <Paper sx={{
                        p: 2, height: 250, mb: 3,
                        background: CARD_BG, border: CARD_BORDER, borderRadius: "12px"
                    }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Jitter
                        </Typography>
                        <Line data={buildChart("Jitter", JITTER_COLOR, jitterHistory)} options={tmOptions} />
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
