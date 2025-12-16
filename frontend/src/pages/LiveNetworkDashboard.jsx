// ========================================================
// File: src/pages/LiveNetworkDashboard.jsx
// Real-Time Network Dashboard (Ping Sweep Version)
// Soft Light Mode UI Enabled
// ========================================================

import { useEffect, useState } from "react";
import { api } from "../api";

import {
    Box,
    Button,
    TextField,
    Paper,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Chip,
    IconButton,
    Skeleton
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import { Line } from "react-chartjs-2";

import {
    Chart as ChartJS,
    LineElement,
    CategoryScale,
    LinearScale,
    PointElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);


// ========================================================
// COMPONENT START
// ========================================================
export default function LiveNetworkDashboard() {

    // -------- STATE --------
    const [agents, setAgents] = useState([]);
    const [manualIPs, setManualIPs] = useState([]);
    const [newIP, setNewIP] = useState("");
    const [loadingScan, setLoadingScan] = useState(false);
    const [history, setHistory] = useState([]);


    // =====================================================
    // ⭐ SOFT LIGHT MODE UI (NEW)
    // =====================================================
    const softPaper = {
        p: 3,
        mb: 3,
        borderRadius: "16px",
        background: "rgba(255,255,255,0.7)",
        boxShadow: "0 4px 18px rgba(0,0,0,0.05)",
        backdropFilter: "blur(6px)"
    };

    const softTableCell = {
        fontSize: "0.95rem",
        borderBottom: "1px solid rgba(0,0,0,0.06)"
    };

    const softHeader = {
        fontWeight: "bold",
        color: "#444",
        fontSize: "1.1rem",
        mb: 2
    };

    const softButton = {
        borderRadius: "10px",
        textTransform: "none",
        padding: "6px 20px",
        fontWeight: 600,
        boxShadow: "0px 2px 6px rgba(0,0,0,0.08)"
    };

    const softChipHigh = {
        fontSize: "0.75rem",
        fontWeight: "bold",
        borderRadius: "8px",
        backgroundColor: "#ffb3b3",
        color: "#8a0000"
    };

    const softChipMedium = {
        fontSize: "0.75rem",
        fontWeight: "bold",
        borderRadius: "8px",
        backgroundColor: "#ffe4b3",
        color: "#8a5500"
    };

    const softDeviceType = {
        borderRadius: "8px",
        fontWeight: "bold",
        backgroundColor: "#e6f0ff",
        color: "#0844a4"
    };

    const softDeviceManual = {
        borderRadius: "8px",
        fontWeight: "bold",
        backgroundColor: "#f0f0f0",
        color: "#444"
    };


    // =====================================================
    // Fetch agents
    // =====================================================
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await api.get("/agent/all");
                setAgents(res.data);
            } catch (err) {
                console.error("Agent fetch error:", err);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, []);


    // =====================================================
    // Add manual IP
    // =====================================================
    const addManualIP = async () => {
        const ip = newIP.trim();
        if (!ip) return;
        if (manualIPs.find((i) => i.ip === ip)) {
            setNewIP("");
            return;
        }

        try {
            const res = await api.get(`/agent/ping/${ip}`);
            const reachable = res.data.reachable;

            setManualIPs([
                ...manualIPs,
                {
                    ip,
                    reachable,
                    online: reachable,
                    cpu_temp: null,
                    gpu_temp: null,
                    ram_used: null,
                    disk_health: null
                }
            ]);
        } catch {
            setManualIPs([
                ...manualIPs,
                { ip, reachable: false, online: false }
            ]);
        }

        setNewIP("");
    };


    // =====================================================
    // Remove IP
    // =====================================================
    const removeIP = (ip) => {
        setManualIPs(manualIPs.filter((item) => item.ip !== ip));
    };


    // =====================================================
    // Auto Discovery - Ping Sweep
    // =====================================================
    const runScan = async () => {
        setLoadingScan(true);

        try {
            const res = await api.get("/network/scan?subnet=192.168.1.0");
            const newIPs = res.data.devices;

            const formatted = newIPs
                .filter(ip => !manualIPs.find(m => m.ip === ip))
                .map(ip => ({
                    ip,
                    reachable: true,
                    online: false
                }));

            setManualIPs([...manualIPs, ...formatted]);
        } catch (err) {
            console.error("Scan error:", err);
        }

        setLoadingScan(false);
    };


    // =====================================================
    // Merge devices
    // =====================================================
    const allDevices = [
        ...agents.map(a => ({ ...a, isAgent: true })),
        ...manualIPs.map(m => ({ ...m, isAgent: false }))
    ];


    // =====================================================
    // Alerts
    // =====================================================
    const alerts = [];

    allDevices.forEach((d) => {
        if (!d.online) return;

        if (d.cpu_temp > 85)
            alerts.push({ ip: d.ip, msg: `CPU Overheating (${d.cpu_temp}°C)`, sev: "high" });

        if (d.gpu_temp > 80)
            alerts.push({ ip: d.ip, msg: `GPU Hot (${d.gpu_temp}°C)`, sev: "high" });

        if (d.ram_used > 90)
            alerts.push({ ip: d.ip, msg: `RAM Usage High (${d.ram_used}%)`, sev: "medium" });

        if (d.disk_health) {
            const vals = Object.values(d.disk_health);
            if (vals[0] < 70)
                alerts.push({ ip: d.ip, msg: `Disk SMART Warning (${vals[0]}%)`, sev: "medium" });
        }
    });


    // =====================================================
    // Combined graph
    // =====================================================
    useEffect(() => {
        if (allDevices.length === 0) return;

        const avgCPU =
            allDevices.reduce((sum, d) => sum + (d.cpu_temp || 0), 0) /
            allDevices.length;

        const avgRAM =
            allDevices.reduce((sum, d) => sum + (d.ram_used || 0), 0) /
            allDevices.length;

        const avgGPU =
            allDevices.reduce((sum, d) => sum + (d.gpu_temp || 0), 0) /
            allDevices.length;

        const avgDisk =
            allDevices.reduce((sum, d) => {
                if (!d.disk_health) return sum;
                const vals = Object.values(d.disk_health);
                return sum + (vals[0] || 100);
            }, 0) / allDevices.length;

        setHistory((prev) => [
            ...prev.slice(-20),
            {
                time: new Date().toLocaleTimeString(),
                cpu: avgCPU,
                ram: avgRAM,
                gpu: avgGPU,
                disk: avgDisk
            }
        ]);
    }, [allDevices]);


    const graphData = {
        labels: history.map((h) => h.time),
        datasets: [
            { label: "CPU °C", data: history.map((h) => h.cpu), borderColor: "rgba(255,120,120,0.55)", tension: 0.45 },
            { label: "RAM %", data: history.map((h) => h.ram), borderColor: "rgba(120,160,255,0.55)", tension: 0.45 },
            { label: "GPU °C", data: history.map((h) => h.gpu), borderColor: "rgba(255,190,120,0.55)", tension: 0.45 },
            { label: "Disk %", data: history.map((h) => h.disk), borderColor: "rgba(150,255,180,0.55)", tension: 0.45 }
        ]
    };


    // =====================================================
    // UI START
    // =====================================================
    return (
        <Box sx={{ p: 3 }}>

            <Typography variant="h4" mb={3} fontWeight="bold" color="#333">
                Live Network Monitor
            </Typography>


            {/* CONTROLS */}
            <Paper sx={softPaper}>
                <Box display="flex" gap={2}>

                    <TextField
                        label="Add IP manually"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        sx={{ maxWidth: 220 }}
                    />

                    <Button variant="contained" sx={softButton} onClick={addManualIP}>
                        Add IP
                    </Button>

                    <Button
                        variant="contained"
                        sx={{ ...softButton, backgroundColor: "#6aa6ff" }}
                        onClick={runScan}
                        disabled={loadingScan}
                    >
                        {loadingScan ? "Scanning..." : "Scan Network"}
                    </Button>

                </Box>
            </Paper>



            {/* ALERTS */}
            <Paper sx={softPaper}>
                <Typography sx={softHeader}>Alerts</Typography>

                {alerts.length === 0 && (
                    <Typography sx={{ color: "#444" }}>No alerts 🎉</Typography>
                )}

                {alerts.map((a, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                        <Chip
                            label={a.sev === "high" ? "HIGH" : "MEDIUM"}
                            sx={a.sev === "high" ? softChipHigh : softChipMedium}
                        />
                        <Typography>{a.ip} — {a.msg}</Typography>
                    </Box>
                ))}
            </Paper>



            {/* GRAPH */}
            <Paper sx={softPaper}>
                <Typography sx={softHeader}>Combined System Graph</Typography>
                <Line data={graphData} height={120} />
            </Paper>



            {/* DEVICES TABLE */}
            <Paper sx={softPaper}>
                <Typography sx={softHeader}>Devices</Typography>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={softTableCell}>Remove</TableCell>
                            <TableCell sx={softTableCell}>IP</TableCell>
                            <TableCell sx={softTableCell}>Status</TableCell>
                            <TableCell sx={softTableCell}>CPU</TableCell>
                            <TableCell sx={softTableCell}>GPU</TableCell>
                            <TableCell sx={softTableCell}>RAM</TableCell>
                            <TableCell sx={softTableCell}>Disk</TableCell>
                            <TableCell sx={softTableCell}>Type</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>

                        {allDevices.length === 0 && (
                            <>
                                <TableRow><TableCell><Skeleton /></TableCell></TableRow>
                                <TableRow><TableCell><Skeleton /></TableCell></TableRow>
                                <TableRow><TableCell><Skeleton /></TableCell></TableRow>
                            </>
                        )}

                        {allDevices.map((dev) => (
                            <TableRow key={dev.ip}>

                                <TableCell sx={softTableCell}>
                                    <IconButton onClick={() => removeIP(dev.ip)}>
                                        <CloseIcon />
                                    </IconButton>
                                </TableCell>

                                <TableCell sx={softTableCell}>{dev.ip}</TableCell>

                                <TableCell sx={softTableCell}>
                                    <Chip
                                        label={dev.online ? "Online" : "Offline"}
                                        color={dev.online ? "success" : "error"}
                                        sx={{ fontWeight: "bold", borderRadius: "8px" }}
                                    />
                                </TableCell>

                                <TableCell sx={softTableCell}>{dev.cpu_temp ?? "-"}</TableCell>
                                <TableCell sx={softTableCell}>{dev.gpu_temp ?? "-"}</TableCell>
                                <TableCell sx={softTableCell}>{dev.ram_used ?? "-"}</TableCell>

                                <TableCell sx={softTableCell}>
                                    {dev.disk_health
                                        ? Object.values(dev.disk_health).join(", ") + "%"
                                        : "-"}
                                </TableCell>

                                <TableCell sx={softTableCell}>
                                    {dev.isAgent ? (
                                        <Chip label="Agent" sx={softDeviceType} />
                                    ) : (
                                        <Chip label="Manual" sx={softDeviceManual} />
                                    )}
                                </TableCell>

                            </TableRow>
                        ))}

                    </TableBody>
                </Table>
            </Paper>

        </Box>
    );
}
