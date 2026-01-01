import { useEffect, useMemo, useState } from "react";
// import { Box, Paper, Typography, Chip, LinearProgress } from "@mui/material";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import WifiIcon from "@mui/icons-material/Wifi";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Paper, Typography, Chip, LinearProgress, IconButton, Tooltip } from "@mui/material";


import { useControlCenter } from "../context/ControlCenterContext";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

function clamp(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 0;
    return Math.max(0, Math.min(100, x));
}

export default function LiveHardwarePanel() {
    const { selectedIP, setSelectedIP } = useControlCenter();
    const { mode } = useThemeMode();

    const [data, setData] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | loading | live | error
    const [errMsg, setErrMsg] = useState("");

    const wsUrl = useMemo(() => {
        if (!selectedIP) return null;
        return `ws://10.41.250.250:8000/hardware/ws/hardware/${encodeURIComponent(selectedIP)}`;
    }, [selectedIP]);

    useEffect(() => {
        if (!selectedIP) return;

        let ws;

        (async () => {
            try {
                setStatus("loading");
                setErrMsg("");

                // Snapshot ראשון (REST)
                const res = await api.get(`/hardware/${selectedIP}`);
                setData(res.data);

                // Live (WS)
                ws = new WebSocket(wsUrl);

                ws.onopen = () => setStatus("live");

                ws.onmessage = (e) => {
                    try {
                        const payload = JSON.parse(e.data);
                        setData(payload);
                    } catch {
                        // ignore
                    }
                };

                ws.onerror = () => {
                    setStatus("error");
                    setErrMsg("WebSocket error");
                };

                ws.onclose = () => {
                    // אם נסגר בזמן עבודה — נשאיר את הדאטה האחרון
                    setStatus((s) => (s === "loading" ? "error" : s));
                };
            } catch (err) {
                setStatus("error");
                setErrMsg("Failed to load hardware snapshot");
            }
        })();

        return () => {
            if (ws) ws.close();
        };
    }, [selectedIP, wsUrl]);

    if (!selectedIP) return null;

    const cardBg =
        mode === "dark" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.70)";

    return (
        <Paper
            elevation={0}
            sx={{
                mx: { xs: 1, md: 2 },
                mb: { xs: 1, md: 2 },
                px: { xs: 1.5, md: 2 },
                py: { xs: 1.25, md: 1.5 },
                borderRadius: { xs: 4, md: 3 },
                background: cardBg,
                backdropFilter: "blur(14px)",
                border:
                    mode === "dark"
                        ? "1px solid rgba(139,92,246,0.18)"
                        : "1px solid rgba(140,160,220,0.25)",
            }}
        >
            <Box display="flex" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                <Typography sx={{ fontWeight: 950 }}>
                    Live Hardware • {selectedIP}
                </Typography>

                <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                        size="small"
                        label={
                            status === "live"
                                ? "LIVE"
                                : status === "loading"
                                    ? "CONNECTING…"
                                    : status === "error"
                                        ? "OFFLINE"
                                        : "IDLE"
                        }
                        sx={{
                            fontWeight: 800,
                            letterSpacing: 0.6,
                            background:
                                status === "live"
                                    ? "rgba(34,197,94,0.18)"
                                    : status === "loading"
                                        ? "rgba(234,179,8,0.18)"
                                        : status === "error"
                                            ? "rgba(239,68,68,0.18)"
                                            : "rgba(148,163,184,0.18)",
                            border:
                                status === "live"
                                    ? "1px solid rgba(34,197,94,0.35)"
                                    : status === "loading"
                                        ? "1px solid rgba(234,179,8,0.35)"
                                        : status === "error"
                                            ? "1px solid rgba(239,68,68,0.35)"
                                            : "1px solid rgba(148,163,184,0.35)",
                        }}
                    />

                    <Tooltip title="Close">
                        <IconButton
                            size="small"
                            onClick={() => setSelectedIP(null)}
                            sx={{
                                width: 30,
                                height: 30,
                                borderRadius: 2,
                                opacity: 0.9,
                                background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                border:
                                    mode === "dark"
                                        ? "1px solid rgba(255,255,255,0.10)"
                                        : "1px solid rgba(0,0,0,0.10)",
                                "&:hover": {
                                    opacity: 1,
                                    background: mode === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
                                },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Tooltip>
                </Box>

            </Box>

            {status === "loading" && (
                <Box mt={1}>
                    <LinearProgress />
                </Box>
            )}

            {status === "error" && (
                <Typography sx={{ mt: 1, opacity: 0.85 }}>
                    {errMsg || "Offline"}
                </Typography>
            )}

            {data && (
                <Box mt={1.25} display="flex" flexDirection="column" gap={1}>
                    <MetricRow icon={<WhatshotIcon />} label="CPU" value={clamp(data.cpu)} />
                    <MetricRow icon={<MemoryIcon />} label="RAM" value={clamp(data.ram)} />
                    <MetricRow icon={<StorageIcon />} label="Disk" value={clamp(data.disk)} />
                    {"ping" in data && <MetricRow icon={<WifiIcon />} label="Ping" value={clamp(data.ping)} unit="ms" max={300} />}
                </Box>
            )}
        </Paper>
    );
}

function MetricRow({ icon, label, value, unit = "%", max = 100 }) {
    const v = Math.max(0, Math.min(max, Number(value) || 0));
    const pct = Math.round((v / max) * 100);

    return (
        <Box display="flex" alignItems="center" gap={1}>
            <Box sx={{ opacity: 0.9 }}>{icon}</Box>
            <Typography sx={{ width: 60, fontWeight: 800 }}>{label}</Typography>
            <Box sx={{ flex: 1 }}>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                        height: 10,
                        borderRadius: 999,
                        overflow: "hidden",
                        background: "rgba(148,163,184,0.18)",
                        "& .MuiLinearProgress-bar": {
                            borderRadius: 999,
                        },
                    }}
                />
            </Box>
            <Typography sx={{ width: 70, textAlign: "right", fontWeight: 850 }}>
                {v}{unit}
            </Typography>
        </Box>
    );
}
