/////////////////////////////////////////////
//  HardwareLogs.jsx — Multi-IP + Persistent + Demo Logs
/////////////////////////////////////////////
// import { useMemo } from "react";

import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import usePersistentState from "../hooks/usePersistentState";

import {
    Box,
    Typography,
    TextField,
    Button,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    MenuItem,
    IconButton,
    Skeleton,
    Tabs,
    Tab,
    Pagination,
    Fade,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import DeveloperBoardIcon from "@mui/icons-material/DeveloperBoard";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import DnsIcon from "@mui/icons-material/Dns";
import ClearIcon from "@mui/icons-material/Clear";

import { Bar, Doughnut } from "react-chartjs-2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useThemeMode } from "../context/ThemeContext";

////////////////////////////////////////////////////
//  MAIN COMPONENT
////////////////////////////////////////////////////
export default function HardwareLogs() {
    const { mode } = useThemeMode();

    // ⭐ Persistent local storage states
    const [ipList, setIpList] = usePersistentState("hw-ip-list", []);
    const [newIp, setNewIp] = usePersistentState("hw-new-ip", "");
    const [filters, setFilters] = usePersistentState("hw-filters", {
        computer: "",
        status: "",
        search: "",
        from: "",
        to: "",
    });
    const [tab, setTab] = usePersistentState("hw-tab", "all");
    const [page, setPage] = usePersistentState("hw-page", 1);

    // Not persistent
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const rowsPerPage = 10;

    //////////////////////////////////////////////////
    // Demo Hardware Logs
    //////////////////////////////////////////////////
    // const demoHardware = useMemo(
    //     () => [
    //         {
    //             id: "demo-hw-1",
    //             computer_name: "PC-002",
    //             ip: "192.168.1.45",
    //             error_type: "Hardware",
    //             description: "CPU Overheating detected",
    //             severity: "Critical",
    //             status: "open",
    //             created_at: "2025-12-07T09:42:11",
    //         },
    //         {
    //             id: "demo-hw-2",
    //             computer_name: "PC-004",
    //             ip: "192.168.1.77",
    //             error_type: "Hardware",
    //             description: "RAM failure detected in slot B2",
    //             severity: "Medium",
    //             status: "open",
    //             created_at: "2025-12-07T08:10:33",
    //         },
    //         {
    //             id: "demo-hw-3",
    //             computer_name: "Server-01",
    //             ip: "192.168.1.10",
    //             error_type: "Hardware",
    //             description: "Disk read errors on /dev/sda1",
    //             severity: "Low",
    //             status: "open",
    //             created_at: "2025-12-06T23:58:12",
    //         },
    //     ],
    //     []
    // );

    //////////////////////////////////////////////////
    // Add new IP
    //////////////////////////////////////////////////
    const addIp = () => {
        const ip = newIp.trim();
        if (!ip || ipList.includes(ip)) return;
        setIpList([...ipList, ip]);
        setNewIp("");
    };

    //////////////////////////////////////////////////
    // Remove IP
    //////////////////////////////////////////////////
    const removeIp = (ipToRemove) => {
        setIpList(ipList.filter((ip) => ip !== ipToRemove));
    };

    //////////////////////////////////////////////////
    // Load Logs (Supports Multi-IP + Demo Fallback)
    //////////////////////////////////////////////////
    const loadLogs = useCallback(async () => {
        try {
            setLoading(true);
            let data = [];

            if (ipList.length > 0) {
                const all = [];
                for (const ip of ipList) {
                    try {
                        const res = await api.get(`/hardware/by-ip/${ip}`);
                        all.push(...res.data.errors);
                    } catch {
                        console.warn(`⚠️ IP ${ip} unreachable`);
                    }
                }
                data = all;
            } else {
                const res = await api.get("/logs/hardware", { params: filters });
                data = Array.isArray(res.data) ? res.data : [];
            }

            // Filters + Tabs
            if (tab !== "all")
                data = data.filter((item) =>
                    item.description.toLowerCase().includes(tab.toLowerCase())
                );

            if (filters.search.trim() !== "") {
                const s = filters.search.toLowerCase();
                data = data.filter(
                    (log) =>
                        log.description.toLowerCase().includes(s) ||
                        log.ip.toLowerCase().includes(s) ||
                        log.computer_name.toLowerCase().includes(s)
                );
            }

            if (filters.from)
                data = data.filter(
                    (l) => new Date(l.created_at) >= new Date(filters.from)
                );

            if (filters.to)
                data = data.filter(
                    (l) => new Date(l.created_at) <= new Date(filters.to)
                );

            // Fallback to demo if empty
            // if (data.length === 0) data = demoHardware;

            setLogs(data);
        } catch (err) {
            console.error("❌ Load error:", err);
            setLogs();
            // demoHardware
        } finally {
            setLoading(false);
        }
    }, [ipList, filters, tab]);

    useEffect(() => {
        const delay = setTimeout(loadLogs, 300);
        return () => clearTimeout(delay);
    }, [loadLogs]);

    //////////////////////////////////////////////////
    // Icons
    //////////////////////////////////////////////////
    const iconFor = (desc) => {
        const d = desc.toLowerCase();
        if (d.includes("cpu")) return <DeveloperBoardIcon color="error" />;
        if (d.includes("ram")) return <MemoryIcon color="primary" />;
        if (d.includes("gpu")) return <DnsIcon color="secondary" />;
        if (d.includes("fan")) return <WhatshotIcon color="warning" />;
        if (d.includes("disk") || d.includes("ssd"))
            return <StorageIcon color="info" />;
        return <MemoryIcon />;
    };

    //////////////////////////////////////////////////
    // Resolve Log
    //////////////////////////////////////////////////
    const resolveLog = async (id) => {
        // if (id.startsWith("demo")) {
        //     alert("This is a demo log — cannot resolve.");
        //     return;
        // }
        await api.put(`/logs/resolve/${id}`);
        loadLogs();
    };

    //////////////////////////////////////////////////
    // Clear filters
    //////////////////////////////////////////////////
    const clearFilters = () => {
        setFilters({
            computer: "",
            status: "",
            search: "",
            from: "",
            to: "",
        });
        setTab("all");
    };

    //////////////////////////////////////////////////
    // CSV Export
    //////////////////////////////////////////////////
    const exportExcel = () => {
        const csv = logs
            .map(
                (l) =>
                    `${l.id},${l.computer_name},${l.ip},${l.description},${l.status},${l.created_at}`
            )
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "hardware_logs.csv";
        a.click();
    };

    //////////////////////////////////////////////////
    // Pagination
    //////////////////////////////////////////////////
    const paginated = logs.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    //////////////////////////////////////////////////
    // Skeleton loader
    //////////////////////////////////////////////////
    const SkeletonRows = () =>
        [...Array(8)].map((_, i) => (
            <TableRow key={i}>
                {[...Array(7)].map((__, j) => (
                    <TableCell key={j}>
                        <Skeleton variant="text" width="80%" />
                    </TableCell>
                ))}
            </TableRow>
        ));

    //////////////////////////////////////////////////
    // Stats
    //////////////////////////////////////////////////
    const stats = {
        cpu: logs.filter((l) => l.description.toLowerCase().includes("cpu")).length,
        ram: logs.filter((l) => l.description.toLowerCase().includes("ram")).length,
        gpu: logs.filter((l) => l.description.toLowerCase().includes("gpu")).length,
        disk: logs.filter(
            (l) =>
                l.description.toLowerCase().includes("ssd") ||
                l.description.toLowerCase().includes("disk")
        ).length,
        fan: logs.filter((l) => l.description.toLowerCase().includes("fan")).length,
        total: logs.length,
    };

    //////////////////////////////////////////////////
    // PDF Export
    //////////////////////////////////////////////////
    const exportPDF = () => {
        const pdf = new jsPDF();
        pdf.setFontSize(22);
        pdf.text("Hardware Error Report", 14, 20);
        pdf.setFontSize(12);
        pdf.text(`CPU: ${stats.cpu}`, 14, 35);
        pdf.text(`RAM: ${stats.ram}`, 14, 42);
        pdf.text(`GPU: ${stats.gpu}`, 14, 49);
        pdf.text(`Disk/SSD: ${stats.disk}`, 14, 56);
        pdf.text(`Fan: ${stats.fan}`, 14, 63);
        pdf.text(`Total Errors: ${stats.total}`, 14, 72);
        pdf.autoTable({
            startY: 80,
            head: [["ID", "Computer", "IP", "Description", "Status", "Created"]],
            body: logs.map((l) => [
                l.id,
                l.computer_name,
                l.ip,
                l.description,
                l.status,
                new Date(l.created_at).toLocaleString(),
            ]),
        });
        pdf.save("hardware_report.pdf");
    };

    //////////////////////////////////////////////////
    // Charts Options
    //////////////////////////////////////////////////
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutBounce" },
        plugins: { legend: { position: "bottom" } },
    };

    //////////////////////////////////////////////////
    // UI Rendering
    //////////////////////////////////////////////////
    return (
        <Box className="lv-page">
            <Box className="lv-header">
                <Box>
                    <Typography
                        variant="h4"
                        className="lv-header__title"
                        sx={{ color: mode === "dark" ? "#f0f0f0" : "#222" }}
                    >
                        Hardware Errors Monitor
                    </Typography>
                    <Typography className="lv-header__subtitle" sx={{ color: mode === "dark" ? "#f0f0f0" : "#222" }}>
                        Multi‑IP hardware health, filtering, and export controls.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1fr 1.5fr" },
                    gap: 2,
                }}
            >
                {/* FILTERS */}
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                        Filters & Target IPs
                    </Typography>
                <Box display="flex" gap={2} mb={2}>
                    <TextField
                        label="Add IP"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                        sx={{ width: 180 }}
                    />
                    <Button variant="contained" onClick={addIp}>
                        Add
                    </Button>
                </Box>

                <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
                    {ipList.map((ip) => (
                        <Chip
                            key={ip}
                            label={ip}
                            onDelete={() => removeIp(ip)}
                            color="primary"
                        />
                    ))}
                </Box>

                <Box display="flex" flexWrap="wrap" gap={2}>
                    <TextField
                        label="Filter by Computer"
                        value={filters.computer}
                        onChange={(e) =>
                            setFilters({ ...filters, computer: e.target.value })
                        }
                    />

                    <TextField
                        select
                        label="Status"
                        value={filters.status}
                        onChange={(e) =>
                            setFilters({ ...filters, status: e.target.value })
                        }
                        sx={{ width: 160 }}
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                    </TextField>

                    <TextField
                        label="Search text…"
                        value={filters.search}
                        onChange={(e) =>
                            setFilters({ ...filters, search: e.target.value })
                        }
                        sx={{ width: 260 }}
                    />

                    <TextField
                        type="date"
                        label="From"
                        InputLabelProps={{ shrink: true }}
                        value={filters.from}
                        onChange={(e) =>
                            setFilters({ ...filters, from: e.target.value })
                        }
                    />

                    <TextField
                        type="date"
                        label="To"
                        InputLabelProps={{ shrink: true }}
                        value={filters.to}
                        onChange={(e) =>
                            setFilters({ ...filters, to: e.target.value })
                        }
                    />

                    <Button
                        variant="outlined"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={exportExcel}
                    >
                        Export CSV
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<ClearIcon />}
                        onClick={clearFilters}
                    >
                        Clear
                    </Button>
                </Box>
                </Paper>

                <Box sx={{ display: "grid", gap: 2 }}>
                    {/* TABS */}
                    <Paper className="lv-panel" sx={{ padding: 0 }}>
                        <Tabs
                            value={tab}
                            onChange={(e, val) => setTab(val)}
                            variant="scrollable"
                        >
                            <Tab label="All" value="all" />
                            <Tab label="CPU" value="cpu" />
                            <Tab label="RAM" value="ram" />
                            <Tab label="GPU" value="gpu" />
                            <Tab label="SSD/Disk" value="ssd" />
                            <Tab label="Fan" value="fan" />
                        </Tabs>
                    </Paper>

                    {/* TABLE */}
                    <Fade in timeout={400}>
                        <TableContainer component={Paper} className="lv-panel">
                            <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Computer</TableCell>
                                <TableCell>IP</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <SkeletonRows />
                            ) : (
                                paginated.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{log.id}</TableCell>
                                        <TableCell>{log.computer_name}</TableCell>
                                        <TableCell>{log.ip}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                {iconFor(log.description)}
                                                {log.description}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={log.status}
                                                color={
                                                    log.status === "open"
                                                        ? "error"
                                                        : "success"
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                log.created_at
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            {log.status === "open" && (
                                                <IconButton
                                                    onClick={() =>
                                                        resolveLog(log.id)
                                                    }
                                                >
                                                    <CheckCircleIcon color="success" />
                                                </IconButton>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                            </Table>
                        </TableContainer>
                    </Fade>

                    {/* PAGINATION */}
                    <Box mt={1} display="flex" justifyContent="center">
                        <Pagination
                            count={Math.ceil(logs.length / rowsPerPage)}
                            page={page}
                            onChange={(e, val) => setPage(val)}
                        />
                    </Box>
                </Box>
            </Box>

            {/* STATS + CHARTS */}
            <Box mt={2} p={3} component={Paper} className="lv-panel">
                <Typography variant="h5" mb={2}>
                    📊 Hardware Stats Dashboard
                </Typography>

                <Box
                    display="flex"
                    flexWrap="wrap"
                    gap={2}
                    mb={3}
                    justifyContent="center"
                >
                    <Chip label={`CPU: ${stats.cpu}`} color="error" />
                    <Chip label={`RAM: ${stats.ram}`} color="primary" />
                    <Chip label={`GPU: ${stats.gpu}`} color="secondary" />
                    <Chip label={`Disk: ${stats.disk}`} color="info" />
                    <Chip label={`Fan: ${stats.fan}`} color="warning" />
                    <Chip label={`Total: ${stats.total}`} color="success" />
                </Box>

                <Box
                    display="grid"
                    gridTemplateColumns="repeat(auto-fit, minmax(280px, 1fr))"
                    gap={4}
                    mt={3}
                >
                    <Box height={280}>
                        <Bar
                            data={{
                                labels: ["CPU", "RAM", "GPU", "Disk", "Fan"],
                                datasets: [
                                    {
                                        label: "Errors",
                                        backgroundColor: [
                                            "#ef4444",
                                            "#3b82f6",
                                            "#8b5cf6",
                                            "#0ea5e9",
                                            "#f59e0b",
                                        ],
                                        data: [
                                            stats.cpu,
                                            stats.ram,
                                            stats.gpu,
                                            stats.disk,
                                            stats.fan,
                                        ],
                                        borderRadius: 6,
                                    },
                                ],
                            }}
                            options={chartOptions}
                        />
                    </Box>

                    <Box height={280}>
                        <Doughnut
                            data={{
                                labels: ["CPU", "RAM", "GPU", "Disk", "Fan"],
                                datasets: [
                                    {
                                        data: [
                                            stats.cpu,
                                            stats.ram,
                                            stats.gpu,
                                            stats.disk,
                                            stats.fan,
                                        ],
                                        backgroundColor: [
                                            "#ef4444",
                                            "#3b82f6",
                                            "#8b5cf6",
                                            "#0ea5e9",
                                            "#f59e0b",
                                        ],
                                        hoverOffset: 10,
                                    },
                                ],
                            }}
                            options={chartOptions}
                        />
                    </Box>
                </Box>

                <Box mt={4} textAlign="center">
                    <Button
                        variant="contained"

                        color="secondary"
                        onClick={exportPDF}
                        sx={{ px: 4, py: 1.5 }}
                    >
                        Export PDF Report
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
