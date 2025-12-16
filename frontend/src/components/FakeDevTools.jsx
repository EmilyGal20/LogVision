// components/FakeDevTools.jsx
import { Box, Tabs, Tab, IconButton, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

export default function FakeDevTools() {
    const [open, setOpen] = useState(true);
    const [tab, setTab] = useState(0);

    const [consoleLogs, setConsoleLogs] = useState([]);
    const [networkLogs, setNetworkLogs] = useState([]);
    const [stateInfo, setStateInfo] = useState({
        ws: "disconnected",
        logsCount: 0,
    });

    const wsRef = useRef(null);

    // ===============================
    // WebSocket connection (REAL)
    // ===============================
    useEffect(() => {
        const ws = new WebSocket("ws://localhost:8000/ws/errors");
        wsRef.current = ws;

        ws.onopen = () => {
            setConsoleLogs((prev) => [
                ...prev,
                { type: "ok", text: "WebSocket connected" },
            ]);
            setStateInfo((s) => ({ ...s, ws: "connected" }));
        };

        ws.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);

                setConsoleLogs((prev) =>
                    [
                        ...prev,
                        {
                            type: data.type === "alert" ? "warn" : "info",
                            text: JSON.stringify(data),
                        },
                    ].slice(-30)
                );

                setNetworkLogs((prev) =>
                    [
                        ...prev,
                        {
                            endpoint: "/ws/errors",
                            status: "LIVE",
                            time: new Date().toLocaleTimeString(),
                        },
                    ].slice(-20)
                );

                if (data.payload) {
                    setStateInfo((s) => ({
                        ...s,
                        logsCount: s.logsCount + 1,
                    }));
                }
            } catch {
                // ignore malformed messages
            }
        };

        ws.onerror = () => {
            setConsoleLogs((prev) => [
                ...prev,
                { type: "error", text: "WebSocket error" },
            ]);
            setStateInfo((s) => ({ ...s, ws: "error" }));
        };

        ws.onclose = () => {
            setConsoleLogs((prev) => [
                ...prev,
                { type: "warn", text: "WebSocket closed" },
            ]);
            setStateInfo((s) => ({ ...s, ws: "closed" }));
        };

        return () => {
            ws.close();
        };
    }, []);

    // ===============================
    // UI
    // ===============================
    return (
        <Box
            sx={{
                height: open ? 170 : 34,
                transition: "height .25s ease",
                background: "#0a0d12",
                borderTop: "1px solid rgba(255,255,255,.08)",
                fontFamily: "monospace",
                fontSize: 12,
            }}
        >
            {/* HEADER */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    borderBottom: "1px solid rgba(255,255,255,.05)",
                }}
            >
                <IconButton size="small" onClick={() => setOpen(!open)}>
                    {open ? (
                        <ExpandMoreIcon sx={{ color: "#c9d1d9" }} />
                    ) : (
                        <ExpandLessIcon sx={{ color: "#c9d1d9" }} />
                    )}
                </IconButton>

                <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    textColor="inherit"
                    indicatorColor="secondary"
                    sx={{ minHeight: 32 }}
                >
                    <Tab label="Console" />
                    <Tab label="Network" />
                    <Tab label="State" />
                </Tabs>
            </Box>

            {/* CONTENT */}
            {open && (
                <Box sx={{ p: 1, overflow: "auto", height: "100%" }}>
                    {/* Console */}
                    {tab === 0 &&
                        consoleLogs.map((log, i) => (
                            <Typography
                                key={i}
                                sx={{
                                    color:
                                        log.type === "ok"
                                            ? "#7ee787"
                                            : log.type === "warn"
                                                ? "#facc15"
                                                : log.type === "error"
                                                    ? "#f85149"
                                                    : "#9cdcfe",
                                }}
                            >
                                [{log.type.toUpperCase()}] {log.text}
                            </Typography>
                        ))}

                    {/* Network */}
                    {tab === 1 &&
                        networkLogs.map((n, i) => (
                            <Typography key={i} sx={{ color: "#9cdcfe" }}>
                                {n.time} → {n.endpoint} ({n.status})
                            </Typography>
                        ))}

                    {/* State */}
                    {tab === 2 && (
                        <>
                            <Typography color="#7ee787">
                                WS status: {stateInfo.ws}
                            </Typography>
                            <Typography color="#9cdcfe">
                                Received alerts: {stateInfo.logsCount}
                            </Typography>
                        </>
                    )}
                </Box>
            )}
        </Box>
    );
}
