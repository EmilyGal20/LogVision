/* ——————————————————————————————
   REALTIME IP MONITOR — LOGVISION CLEAN DARK EDITION
—————————————————————————————— */

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { api } from "../api";
import { Box, Typography, TextField, Button, Paper } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";
import { Line, Doughnut } from "react-chartjs-2";
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
    ArcElement, // ✅ מפה
} from "chart.js";

// import { GaugeController } from "chartjs-gauge"; // ✅ רק GaugeController מפה

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    // GaugeController
);



/* 🎨 DARK MODE PALETTE — NEW CLEAN EDITION */
const SCORE_COLOR = "#a78bfa"; // Lilac
const DL_COLOR = "#60a5fa"; // Soft Blue
const UL_COLOR = "#f87171"; // Soft Red
const JITTER_COLOR = "#fbbf24"; // Gold

// ✅ טווחים כמו שביקשת (משמשים כטיקים/סגמנטים, לא כ־MAX קשיח של הגרף)
// const SPEED_MIN = 200;
// const SPEED_MAX = 3000;



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
    const mutedText = isDark ? "rgba(229,231,235,0.72)" : "rgba(31,41,55,0.7)";

    /* ——————————————————————————
       STATE
    ——————————————————————————— */
    const [ip, setIp] = useState("");
    const [activeIP, setActiveIP] = useState(null);

    // Availability + status
    const [latencyHistory, setLatencyHistory] = useState([]); // ✅ צריך גם לקרוא לזה (Ping)
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
    const [speedEnabled, setSpeedEnabled] = useState(false);

    const [ipStatus, setIpStatus] = useState({});
    const [alertMessage, setAlertMessage] = useState("");
    const [showAlert, setShowAlert] = useState(false);

    const scoreRef = useRef(0);
    const [scoreHistory, setScoreHistory] = useState([]);
    const wsRef = useRef(null);
    const activeIPRef = useRef(null);
    const phaseRef = useRef(0);

    const clamp = useCallback((v, min, max) => Math.max(min, Math.min(max, v)), []);

    // base url יציב
    const baseURL = useMemo(() => api?.defaults?.baseURL || "http://localhost:8000", []);

    const mbps = useCallback((bytes, seconds) => {
        if (!seconds) return 0;
        return (bytes * 8) / (seconds * 1_000_000);
    }, []);

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
                    try { ctrl.abort(); } catch { }
                    try { reader.cancel(); } catch { }
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
                try { speedAbortRef.current.abort(); } catch { }
                speedAbortRef.current = null;
            }
        };
    }, []);

    const resetCharts = useCallback(() => {
        setLatencyHistory([]);
        setPacketLossHistory([]);
        setJitterHistory([]);
        setScoreHistory([]);
        setDownloadHistory([]);
        setUploadHistory([]);
        scoreRef.current = 0;
    }, []);

    // ✅ Speedtest loop
    useEffect(() => {
        if (speedTimerRef.current) {
            clearInterval(speedTimerRef.current);
            speedTimerRef.current = null;
        }
        if (speedAbortRef.current) {
            try { speedAbortRef.current.abort(); } catch { }
            speedAbortRef.current = null;
        }
        speedBusyRef.current = false;

        if (!activeIP || !speedEnabled) return;

        const tick = async () => {
            if (speedBusyRef.current) return;
            speedBusyRef.current = true;

            try {
                phaseRef.current = (phaseRef.current + 1) % 2;

                if (phaseRef.current === 0) {
                    const down = await runDownloadSample(2.2);
                    setDownloadHistory((prev) => [
                        ...prev.slice(-30),
                        { time: Date.now(), value: down },
                    ]);
                } else {
                    const up = await runUploadSample(2.2);
                    setUploadHistory((prev) => [
                        ...prev.slice(-30),
                        { time: Date.now(), value: up },
                    ]);
                }
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
                try { speedAbortRef.current.abort(); } catch { }
                speedAbortRef.current = null;
            }
            speedBusyRef.current = false;
        };
    }, [activeIP, speedEnabled, runDownloadSample, runUploadSample]);

    /* ——————————————————————————
       START MONITORING
    ——————————————————————————— */
    const startIP = async (ipToStart, shouldStartBackend = true) => {
        try {
            if (shouldStartBackend) {
                await api.get(`/realtime/start/${ipToStart}`);
            }
        } catch (err) {
            const status = err?.response?.status;
            const detail = err?.response?.data?.detail;

            setAlertMessage(
                status === 401
                    ? `401 — ${detail || "Unauthorized"}`
                    : `Start failed — ${detail || err.message}`
            );
            setShowAlert(true);
            return;
        }

        setMultiIPs((prev) => (prev.includes(ipToStart) ? prev : [...prev, ipToStart]));
        setActiveIP(ipToStart);
        activeIPRef.current = ipToStart;
        resetCharts();

        if (wsRef.current) wsRef.current.close();

        const wsBase = baseURL.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsBase}/realtime/ws/${ipToStart}`);
        wsRef.current = ws;

        ws.onopen = () => {
            setAlertMessage(`WS connected: ${ipToStart}`);
            setShowAlert(true);
        };

        ws.onerror = () => {
            setAlertMessage("WS error (בדקי כתובת/פורט/חומת אש)");
            setShowAlert(true);
        };

        ws.onclose = () => {
            setAlertMessage("WS closed");
            setShowAlert(true);
        };

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
            setPacketLossHistory((prev) => [...prev.slice(-60), { time: Date.now(), value: p.online ? 0 : 1 }]);

            scoreRef.current = Math.max(0, Math.min(1, scoreRef.current + (p.online ? 0.02 : -0.05)));
            setScoreHistory((prev) => [...prev.slice(-60), { time: Date.now(), value: scoreRef.current }]);
        };
    };

    const startMonitoring = () => {
        const raw = localStorage.getItem("auth");
        const token = raw ? JSON.parse(raw)?.token : null;

        // ❗ אם אין token — לא לנסות בכלל
        if (!token) {
            setAlertMessage("⚠️ Please login first");
            setShowAlert(true);
            return;
        }

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

    // ✅ Ping כמו Speedtest (ניקח את האחרון מה-latencyHistory)
    const pingMs = useMemo(() => {
        const last = latencyHistory?.[latencyHistory.length - 1]?.value;
        return last != null ? Math.round(Number(last)) : null;
    }, [latencyHistory]);

    // =========================================================
    // ✅ ADDED: Dynamic ranges for gauge (no fixed 200–3000 clamp)
    // =========================================================
    const [dlRange, setDlRange] = useState({ min: 0, max: 300 });
    const [ulRange, setUlRange] = useState({ min: 0, max: 300 });

    const niceMax = (v) => {
        if (!isFinite(v) || v <= 0) return 300;
        const pow = Math.pow(10, Math.floor(Math.log10(v)));
        const n = v / pow;
        const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
        return step * pow;
    };

    useEffect(() => {
        const last = Number(dlStats.last) || 0;
        setDlRange((prev) => {
            const targetMax = niceMax(Math.max(last * 1.15, 50)); // headroom
            const newMax = Math.max(prev.max * 0.92, targetMax);  // shrink slowly
            return { min: 0, max: newMax };
        });
    }, [dlStats.last]);

    useEffect(() => {
        const last = Number(ulStats.last) || 0;
        setUlRange((prev) => {
            const targetMax = niceMax(Math.max(last * 1.15, 50));
            const newMax = Math.max(prev.max * 0.92, targetMax);
            return { min: 0, max: newMax };
        });
    }, [ulStats.last]);

    // =========================================================
    // ✅ ADDED: Gauge Segments + Needle (Needle uses injected min/max)
    // =========================================================
    const needlePlugin = useMemo(
        () => ({
            id: "needle",
            afterDatasetDraw(chart, args, pluginOptions) {
                const { ctx, chartArea } = chart;

                const value = pluginOptions?.value ?? 0;
                const min = pluginOptions?.min ?? 0;
                const max = pluginOptions?.max ?? 300;

                const clamped = Math.max(min, Math.min(max, value));
                const t = (clamped - min) / (max - min || 1);

                // ✅ עוגן כמו Speedtest: מרכז למטה
                const cx = (chartArea.left + chartArea.right) / 2;
                const cy = chartArea.bottom;

                // ✅ זווית: שמאל(-90) -> ימין(+90)
                const angle = (-90 + t * 180) * (Math.PI / 180);

                const r = Math.min(chartArea.width, chartArea.height) * 0.42;

                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(angle);

                // ✅ מחוג (למעלה מתוך העוגן)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(0, -r);
                ctx.lineWidth = 3;
                ctx.strokeStyle = pluginOptions?.needleColor || "rgba(255,255,255,0.85)";
                ctx.stroke();
                ctx.closePath();

                // ✅ נקודת מרכז
                ctx.beginPath();
                ctx.arc(0, 0, 6, 0, Math.PI * 2);
                ctx.fillStyle = pluginOptions?.needleColor || "rgba(255,255,255,0.85)";
                ctx.fill();
                ctx.closePath();

                ctx.restore();
            },
        }),
        []
    );

    // ✅ Real ticks on arc (dynamic scale mapping)
    const gaugeTicksPlugin = useMemo(
        () => ({
            id: "gaugeTicks",
            afterDraw(chart, args, pluginOptions) {
                const { ctx, chartArea } = chart;

                const min = Number(pluginOptions?.min ?? 0);
                const max = Number(pluginOptions?.max ?? 300);

                // הטיקים שביקשת (נציג רק מה שנמצא בתוך הטווח הדינאמי)
                const baseTicks = pluginOptions?.ticks ?? [200, 800, 1500, 3000];
                const ticks = baseTicks
                    .map((x) => Number(x))
                    .filter((tv) => isFinite(tv) && tv >= min && tv <= max);

                const isDarkLocal = !!pluginOptions?.isDark;
                const tickColor =
                    pluginOptions?.tickColor ||
                    (isDarkLocal ? "rgba(255,255,255,0.55)" : "rgba(17,24,39,0.55)");
                const labelColor =
                    pluginOptions?.labelColor ||
                    (isDarkLocal ? "rgba(255,255,255,0.65)" : "rgba(17,24,39,0.65)");

                // ✅ עוגן כמו Speedtest: מרכז למטה
                const cx = (chartArea.left + chartArea.right) / 2;
                const cy = chartArea.bottom;

                const R = Math.min(chartArea.width, chartArea.height) * 0.46;
                const tickLen = Math.max(8, R * 0.06);

                ctx.save();
                ctx.translate(cx, cy);

                for (const tv of ticks) {
                    const t = (tv - min) / (max - min || 1);
                    const angle = (-90 + t * 180) * (Math.PI / 180);

                    // tick line
                    ctx.save();
                    ctx.rotate(angle);
                    ctx.beginPath();
                    ctx.moveTo(0, -R);
                    ctx.lineTo(0, -R + tickLen);
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = tickColor;
                    ctx.stroke();
                    ctx.closePath();
                    ctx.restore();

                    // label
                    ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
                    ctx.fillStyle = labelColor;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    const labelR = R + 16;
                    const lx = Math.sin(angle) * labelR;
                    const ly = -Math.cos(angle) * labelR;

                    ctx.fillText(String(tv), lx, ly);
                }

                ctx.restore();
            },
        }),
        []
    );

    const gaugeOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,

            // ✅ חצי עיגול כמו Speedtest (שמאל→ימין) עם אמצע למעלה
            rotation: -90,         // מתחיל בשמאל
            circumference: 180,    // חצי עיגול

            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                needle: {}, // value/min/max injected per chart
            },
            animation: {
                duration: 450,
                easing: "easeOutCubic",
            },
        }),
        []
    );

    // ✅ Center overlay consistent position (same for DL/UL)
    const centerOverlaySx = useMemo(
        () => ({
            position: "absolute",
            left: "50%",
            bottom: "18%", // ✅ אותו מקום תמיד (לא קופץ בין DL ל-UL)
            transform: "translateX(-50%)",
            textAlign: "center",
            minWidth: 140,
            pointerEvents: "none",
        }),
        []
    );


    const makeGaugeData = useCallback(
        (value, min, max) => {
            const v = clamp(Number(value) || 0, min, max);

            // fixed thresholds (colors) – your original
            const t1 = 800;
            const t2 = 1500;
            const t3 = 3000;

            // segment sizes within current range
            const sRed = Math.max(0, Math.min(t1, max) - min);
            const sYel = Math.max(0, Math.min(t2, max) - Math.max(t1, min));
            const sGrn = Math.max(0, Math.min(t3, max) - Math.max(t2, min));
            const sRest = Math.max(0, max - Math.max(t3, min));

            // filled part in each segment
            const inRed = clamp(Math.min(v, t1) - min, 0, sRed);
            const inYel = clamp(Math.min(v, t2) - Math.max(t1, min), 0, sYel);
            const inGrn = clamp(Math.min(v, t3) - Math.max(t2, min), 0, sGrn);
            const inRest = clamp(v - Math.max(t3, min), 0, sRest);

            const filled = inRed + inYel + inGrn + inRest;
            const total = (max - min);
            const track = Math.max(0, total - filled);

            const TRACK = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

            return {
                labels: ["red", "yellow", "green", "rest", "track"],
                datasets: [
                    {
                        data: [inRed, inYel, inGrn, inRest, track],
                        backgroundColor: ["#ef4444", "#fbbf24", "#22c55e", "#9ca3af33", TRACK],
                        borderWidth: 0,
                    },
                ],
            };
        },
        [clamp, isDark]
    );

    // ---------------------
    // Smooth animation (NO maximum depth)
    // ---------------------
    const [dlSmooth, setDlSmooth] = useState(0);
    const [ulSmooth, setUlSmooth] = useState(0);

    const dlSmoothRef = useRef(0);
    const ulSmoothRef = useRef(0);

    useEffect(() => { dlSmoothRef.current = dlSmooth; }, [dlSmooth]);
    useEffect(() => { ulSmoothRef.current = ulSmooth; }, [ulSmooth]);

    const animateRef = useRef({ dlRaf: 0, ulRaf: 0 });

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const animateValue = useCallback((type, setter, from, to, duration = 650) => {
        // cancel previous
        if (type === "dl" && animateRef.current.dlRaf) cancelAnimationFrame(animateRef.current.dlRaf);
        if (type === "ul" && animateRef.current.ulRaf) cancelAnimationFrame(animateRef.current.ulRaf);

        const startTime = performance.now();

        const tick = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            const e = easeOutCubic(t);
            const v = from + (to - from) * e;
            setter(v);

            if (t < 1) {
                const id = requestAnimationFrame(tick);
                if (type === "dl") animateRef.current.dlRaf = id;
                else animateRef.current.ulRaf = id;
            }
        };

        const id = requestAnimationFrame(tick);
        if (type === "dl") animateRef.current.dlRaf = id;
        else animateRef.current.ulRaf = id;
    }, []);

    useEffect(() => {
        const target = clamp(dlStats.last ?? 0, dlRange.min, dlRange.max);
        const from = dlSmoothRef.current;
        if (Math.abs(target - from) < 0.5) return; // tiny changes - skip
        animateValue("dl", setDlSmooth, from, target, 700);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dlStats.last, dlRange.min, dlRange.max]);

    useEffect(() => {
        const target = clamp(ulStats.last ?? 0, ulRange.min, ulRange.max);
        const from = ulSmoothRef.current;
        if (Math.abs(target - from) < 0.5) return;
        animateValue("ul", setUlSmooth, from, target, 700);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ulStats.last, ulRange.min, ulRange.max]);

    useEffect(() => {
        const ref = animateRef; // ✅ capture ref once
        return () => {
            const { dlRaf, ulRaf } = ref.current;
            if (dlRaf) cancelAnimationFrame(dlRaf);
            if (ulRaf) cancelAnimationFrame(ulRaf);
        };
    }, []);


    /* ——————————————————————————
       LINE OPTIONS (שאר הגרפים)
    ——————————————————————————— */
    const tmOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { display: false },
                y: {
                    ticks: { color: textColor },
                    grid: { color: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)" },
                },
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? "rgba(30,30,40,0.95)" : "#ffffff",
                    titleColor: TITLE_COLOR,
                    bodyColor: textColor,
                    borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)",
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

    const switchTab = (newIP) => {
        setActiveIP(newIP);
        activeIPRef.current = newIP;
        resetCharts();
        startIP(newIP, false);
    };

    const Tabs = () => (
        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
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
                                ? isActive ? "rgba(120,120,255,0.16)" : "rgba(40,40,55,0.6)"
                                : isActive ? "#eef2ff" : "#ffffff",
                            border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.1)",
                        }}
                        onClick={() => switchTab(ipAddress)}
                    >
                        <span>{symbol}</span>
                        <span>{ipAddress}</span>

                        <span
                            style={{ marginLeft: 8, cursor: "pointer", color: "#f87171", fontWeight: "bold" }}
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
            <Typography
                variant="h4"
                sx={{ mb: 3, color: textColor, fontWeight: "bold", letterSpacing: "0.5px" }}
            >
                LogVision — Realtime IP Monitoring
            </Typography>

            <Paper sx={{ p: 3, mb: 3, background: CARD_BG, border: CARD_BORDER, backdropFilter: "blur(6px)" }}>
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

                    <Button
                        variant={speedEnabled ? "contained" : "outlined"}
                        onClick={() => setSpeedEnabled((v) => !v)}
                        sx={{ ml: "auto" }}
                    >
                        {speedEnabled ? "Speedtest: ON" : "Speedtest: OFF"}
                    </Button>
                </Box>

                {/* Ping + Icons (Speedtest vibe) */}
                <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                    <Typography sx={{ color: mutedText }}>
                        Ping: <b style={{ color: textColor }}>{pingMs ?? "—"}</b> ms
                    </Typography>

                    {/* <Box sx={{ display: "flex", gap: 1.2, opacity: 0.9 }}>
                        <span title="Streaming">📺</span>
                        <span title="Gaming">🎮</span>
                        <span title="Video Call">📹</span>
                        <span title="Browsing">🌐</span>
                    </Box>

                    <Typography sx={{ color: mutedText, marginLeft: "auto" }}>
                        Range: <b style={{ color: textColor }}>0–{Math.round(dlRange.max)}</b> Mbps
                    </Typography> */}
                </Box>
            </Paper>

            <Tabs />

            {activeIP && (
                <>
                    {/* SCORE */}
                    <Paper sx={{ p: 2, height: 250, mb: 3, background: CARD_BG, border: CARD_BORDER, borderRadius: "12px" }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Availability Score
                        </Typography>
                        <Line data={buildChart(SCORE_COLOR, scoreHistory)} options={tmOptions} />
                    </Paper>

                    {/* ✅ SPEEDTEST GAUGES (Download + Upload) */}
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
                        {/* Download Gauge */}
                        <Paper sx={{ p: 2, background: CARD_BG, border: CARD_BORDER, borderRadius: "12px", minHeight: 320 }}>
                            <Typography sx={{ color: DL_COLOR, fontWeight: 900, mb: 1, letterSpacing: "0.3px" }}>
                                ⬇ DOWNLOAD Mbps
                            </Typography>

                            <Box sx={{ height: 220, position: "relative" }}>
                                <Doughnut
                                    data={makeGaugeData(dlSmooth, dlRange.min, dlRange.max)}
                                    options={{
                                        ...gaugeOptions,
                                        plugins: {
                                            ...gaugeOptions.plugins,
                                            needle: {
                                                value: dlSmooth,
                                                min: dlRange.min,
                                                max: dlRange.max,
                                                needleColor: isDark ? "rgba(255,255,255,0.85)" : "rgba(17,24,39,0.75)",
                                            },
                                            gaugeTicks: {
                                                min: dlRange.min,
                                                max: dlRange.max,
                                                ticks: [200, 800, 1500, 3000],
                                                isDark,
                                            },
                                        },
                                    }}
                                    plugins={[needlePlugin, gaugeTicksPlugin]}
                                />

                                {/* Number overlay באמצע כמו Speedtest */}
                                <Box sx={centerOverlaySx}>
                                    <Typography sx={{ color: DL_COLOR, fontSize: 46, fontWeight: 900, lineHeight: 1 }}>
                                        {Math.round(dlSmooth)}
                                    </Typography>
                                    <Typography sx={{ color: mutedText, fontSize: 12, letterSpacing: "0.5px" }}>
                                        Mbps
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography sx={{ color: mutedText, fontSize: 13, mt: 1 }}>
                                Avg: <b style={{ color: textColor }}>{dlStats.avg}</b> • Peak:{" "}
                                <b style={{ color: textColor }}>{dlStats.peak}</b>
                            </Typography>
                        </Paper>

                        {/* Upload Gauge */}
                        <Paper sx={{ p: 2, background: CARD_BG, border: CARD_BORDER, borderRadius: "12px", minHeight: 320 }}>
                            <Typography sx={{ color: UL_COLOR, fontWeight: 900, mb: 1, letterSpacing: "0.3px" }}>
                                ⬆ UPLOAD Mbps
                            </Typography>

                            <Box sx={{ height: 220, position: "relative" }}>
                                <Doughnut
                                    data={makeGaugeData(ulSmooth, ulRange.min, ulRange.max)}
                                    options={{
                                        ...gaugeOptions,
                                        plugins: {
                                            ...gaugeOptions.plugins,
                                            needle: {
                                                value: ulSmooth,
                                                min: ulRange.min,
                                                max: ulRange.max,
                                                needleColor: isDark ? "rgba(255,255,255,0.85)" : "rgba(17,24,39,0.75)",
                                            },
                                            gaugeTicks: {
                                                min: ulRange.min,
                                                max: ulRange.max,
                                                ticks: [200, 800, 1500, 3000],
                                                isDark,
                                            },
                                        },
                                    }}
                                    plugins={[needlePlugin, gaugeTicksPlugin]}
                                />

                                {/* Number overlay באמצע כמו Speedtest */}
                                <Box sx={centerOverlaySx}>
                                    <Typography sx={{ color: UL_COLOR, fontSize: 46, fontWeight: 900, lineHeight: 1 }}>
                                        {Math.round(ulSmooth)}
                                    </Typography>
                                    <Typography sx={{ color: mutedText, fontSize: 12, letterSpacing: "0.5px" }}>
                                        Mbps
                                    </Typography>
                                </Box>
                            </Box>

                            <Typography sx={{ color: mutedText, fontSize: 13, mt: 1 }}>
                                Avg: <b style={{ color: textColor }}>{ulStats.avg}</b> • Peak:{" "}
                                <b style={{ color: textColor }}>{ulStats.peak}</b>
                            </Typography>
                        </Paper>
                    </Box>


                    {/* JITTER */}
                    <Paper sx={{ p: 2, height: 250, mb: 3, background: CARD_BG, border: CARD_BORDER, borderRadius: "12px" }}>
                        <Typography sx={{ color: TITLE_COLOR, mb: 1, fontWeight: 600 }}>
                            Jitter
                        </Typography>
                        <Line data={buildChart(JITTER_COLOR, jitterHistory)} options={tmOptions} />
                    </Paper>
                </>
            )}

            <Snackbar open={showAlert} autoHideDuration={3000} onClose={() => setShowAlert(false)}>
                <Alert severity="info">{alertMessage}</Alert>
            </Snackbar>
        </Box>
    );
}
