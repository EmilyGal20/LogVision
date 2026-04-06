import { useEffect, useCallback, useRef, useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Paper,
    Typography,
    Box,
    Chip,
    Button,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Checkbox,
} from "@mui/material";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

import MemoryIcon from "@mui/icons-material/Memory";
import BugReportIcon from "@mui/icons-material/BugReport";
import WifiIcon from "@mui/icons-material/Wifi";
import ErrorIcon from "@mui/icons-material/Error";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RefreshIcon from "@mui/icons-material/Refresh";
import DownloadIcon from "@mui/icons-material/Download";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SaveIcon from "@mui/icons-material/Save";

import usePersistentState from "../hooks/usePersistentState";
import { pushActivity } from "../utils/activity";
import { analyzeLogs, logSummaryText, recommendFromLogs } from "../utils/aiInsights";
import { buildAlerts, buildReports, buildWorklist, defaultRules, saveAlerts } from "../utils/alertsEngine";

export default function Logs() {
    const navigate = useNavigate();
    const location = useLocation();
    const { mode } = useThemeMode();

    const [addOpen, setAddOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        ip: "",
        computer_name: "",
        error_type: "Software",
        severity: "Medium",
        description: "",
        status: "open",
    });

    const setField = (key, value) =>
        setAddForm((prev) => ({ ...prev, [key]: value }));

    const [logs, setLogs] = usePersistentState("logs-page-data", []);
    const [newIssue, setNewIssue] = useState(null);
    const [showAlert, setShowAlert] = useState(false);

    const [query, setQuery] = usePersistentState("logs-query", "");
    const [statusFilter, setStatusFilter] = usePersistentState("logs-status", "");
    const [typeFilter, setTypeFilter] = usePersistentState("logs-type", "");
    const [severityFilter, setSeverityFilter] = usePersistentState("logs-severity", "");
    const [sortBy, setSortBy] = usePersistentState("logs-sort", "newest");
    const [timeRange, setTimeRange] = usePersistentState("logs-time-range", "");
    const [groupBy, setGroupBy] = usePersistentState("logs-group-by", "none");
    const [density, setDensity] = usePersistentState("logs-density", "comfortable");
    const [columns, setColumns] = usePersistentState("logs-columns", {
        ip: true,
        time: true,
        status: true,
    });
    const [alertRules] = usePersistentState("alert-rules", defaultRules());
    const [autoResolveHours, setAutoResolveHours] = usePersistentState("logs-auto-resolve-hours", 72);
    const [savedViews, setSavedViews] = usePersistentState("logs-saved-views", []);
    const [viewName, setViewName] = useState("");
    const [selectMode, setSelectMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    const wsRef = useRef(null);
    const retryRef = useRef(null);

    // Allows use inside websocket safely
    const setLogsRef = useRef(setLogs);
    setLogsRef.current = setLogs;

    const params = new URLSearchParams(location.search);
    const filterCategory = params.get("category");
    const filterSeverity = params.get("severity");
    const filterAll = params.get("filter");

    // ============================================================
    // LOAD LOGS
    // ============================================================
    const loadLogs = useCallback(async () => {
        try {
            const realRes = await api.get("/logs/");
            const real = Array.isArray(realRes.data) ? realRes.data : [];

            const hwRes = await api.get("/logs/hardware");
            const hardwareErrors = Array.isArray(hwRes.data)
                ? hwRes.data.map((item, index) => ({
                    ...item,
                    id: `json-${item.id ?? "noid"}-${index}`,
                    source: "json",
                }))
                : [];

            let merged = real.filter((l) => l.source !== "json");

            if (filterCategory) merged = merged.filter((l) => l.error_type === filterCategory);
            if (filterSeverity) merged = merged.filter((l) => l.severity === filterSeverity);
            if (filterAll === "all") merged = [...hardwareErrors, ...real];

            setLogsRef.current(merged);
        } catch (e) {
            console.error("Failed loading logs:", e);
            setLogsRef.current([]);
        }
    }, [filterCategory, filterSeverity, filterAll]);

    // ============================================================
    // DELETE / REFRESH
    // ============================================================
    useEffect(() => {
        if (location.state?.deletedId) {
            const deleted = String(location.state.deletedId);
            setLogsRef.current((prev) => prev.filter((l) => String(l.id) !== deleted));
            navigate(location.pathname, { replace: true, state: {} });
        }

        if (location.state?.refresh) {
            loadLogs();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, location.pathname, loadLogs, navigate]);

    // ============================================================
    // WEBSOCKET (ONLY ONCE)
    // ============================================================
    const initWebSocket = useCallback(() => {
        const ws = new WebSocket(
            `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.hostname
            }:8000/ws/errors`
        );

        wsRef.current = ws;

        ws.onmessage = (msg) => {
            try {
                const data = JSON.parse(msg.data);

                if (!data.payload) return;

                const issue = data.payload;
                setNewIssue(issue);
                setShowAlert(true);

                setLogsRef.current((prev) => {
                    if (prev.some((l) => String(l.id) === String(issue.id))) return prev;
                    return [issue, ...prev];
                });
            } catch { }
        };

        ws.onclose = () => {
            retryRef.current = setTimeout(initWebSocket, 5000);
        };
    }, []);

    // INIT ONLY ONCE
    useEffect(() => {
        loadLogs();
        initWebSocket();

        return () => {
            wsRef.current?.close();
            clearTimeout(retryRef.current);
        };
    }, [loadLogs, initWebSocket]);


    // ============================================================
    // UI helpers
    // ============================================================
    const bgCard = "transparent";
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const severityColor = {
        Critical: "#ef4444",
        Medium: "#facc15",
        Low: "#4ade80",
    };

    const iconForType = (type) => {
        switch (type) {
            case "Hardware":
                return <MemoryIcon sx={{ color: "#7c3aed" }} />;
            case "Software":
                return <BugReportIcon sx={{ color: "#06b6d4" }} />;
            case "Network":
                return <WifiIcon sx={{ color: "#3b82f6" }} />;
            default:
                return <ErrorIcon />;
        }
    };

    const openIssue = (log) => {
        if (log.source === "json") return;
        pushActivity({
            type: "issue_open",
            label: `${log.error_type} on ${log.ip}`,
            ip: log.ip,
            route: `/issue/${log.id}`,
        });
        navigate(`/issue/${log.id}`);
    };

    const STATUS_MAP = {
        open: { label: "OPEN", color: "error", icon: <ErrorIcon /> },
        resolved: { label: "RESOLVED", color: "success", icon: <CheckCircleIcon /> },
        investigating: { label: "INVESTIGATING", color: "warning", icon: <ErrorIcon /> },
    };

    const normalizedQuery = query.trim().toLowerCase();

    const filteredLogs = useMemo(() => {
        const now = Date.now();
        const inRange = (createdAt) => {
            if (!timeRange) return true;
            const ts = new Date(createdAt || now).getTime();
            if (Number.isNaN(ts)) return true;
            if (timeRange === "24h") return now - ts <= 24 * 60 * 60 * 1000;
            if (timeRange === "7d") return now - ts <= 7 * 24 * 60 * 60 * 1000;
            return true;
        };

        return logs.filter((log) => {
            if (statusFilter && String(log.status || "open").toLowerCase() !== statusFilter) return false;
            if (typeFilter && String(log.error_type || "").toLowerCase() !== typeFilter) return false;
            if (severityFilter && String(log.severity || "").toLowerCase() !== severityFilter) return false;
            if (!inRange(log.created_at)) return false;

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
    }, [logs, normalizedQuery, severityFilter, statusFilter, typeFilter, timeRange]);

    const sortedLogs = useMemo(() => {
        const items = [...filteredLogs];
        if (sortBy === "oldest") {
            return items.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
        }
        if (sortBy === "severity") {
            const rank = { critical: 3, medium: 2, low: 1 };
            return items.sort(
                (a, b) => (rank[String(b.severity || "").toLowerCase()] || 0) - (rank[String(a.severity || "").toLowerCase()] || 0)
            );
        }
        if (sortBy === "ip") {
            return items.sort((a, b) => String(a.ip || "").localeCompare(String(b.ip || "")));
        }
        return items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }, [filteredLogs, sortBy]);

    const summary = useMemo(() => {
        return {
            total: sortedLogs.length,
            critical: sortedLogs.filter((l) => l.severity === "Critical").length,
            medium: sortedLogs.filter((l) => l.severity === "Medium").length,
            low: sortedLogs.filter((l) => l.severity === "Low").length,
            open: sortedLogs.filter((l) => String(l.status || "open").toLowerCase() === "open").length,
            investigating: sortedLogs.filter((l) => String(l.status || "").toLowerCase() === "investigating").length,
            resolved: sortedLogs.filter((l) => String(l.status || "").toLowerCase() === "resolved").length,
        };
    }, [sortedLogs]);

    const aiSummary = useMemo(() => logSummaryText(sortedLogs), [sortedLogs]);
    const aiRecs = useMemo(() => recommendFromLogs(sortedLogs), [sortedLogs]);
    const aiStats = useMemo(() => analyzeLogs(sortedLogs), [sortedLogs]);
    const alerts = useMemo(() => buildAlerts({ logs: sortedLogs, rules: alertRules }), [sortedLogs, alertRules]);
    const reports = useMemo(() => buildReports(sortedLogs, []), [sortedLogs]);
    const worklist = useMemo(() => buildWorklist({ logs: sortedLogs, alerts }), [sortedLogs, alerts]);

    useEffect(() => {
        saveAlerts(alerts);
    }, [alerts]);

    const similarityIndex = useMemo(() => {
        const byIp = {};
        const byType = {};
        sortedLogs.forEach((log) => {
            if (log.ip) byIp[log.ip] = (byIp[log.ip] || 0) + 1;
            if (log.error_type) byType[log.error_type] = (byType[log.error_type] || 0) + 1;
        });
        return { byIp, byType };
    }, [sortedLogs]);

    const groupedLogs = useMemo(() => {
        if (groupBy === "none") return { All: sortedLogs };
        const map = {};
        const getKey = (log) => {
            if (groupBy === "ip") return log.ip || "Unknown IP";
            if (groupBy === "severity") return log.severity || "Unknown";
            if (groupBy === "category") return log.error_type || "Unknown";
            return "All";
        };
        sortedLogs.forEach((log) => {
            const key = getKey(log);
            if (!map[key]) map[key] = [];
            map[key].push(log);
        });
        return map;
    }, [sortedLogs, groupBy]);

    const selectedLogs = useMemo(
        () => sortedLogs.filter((l) => selectedIds.includes(String(l.id))),
        [sortedLogs, selectedIds]
    );

    const clearFilters = () => {
        setQuery("");
        setStatusFilter("");
        setTypeFilter("");
        setSeverityFilter("");
        setSortBy("newest");
        setTimeRange("");
        setGroupBy("none");
    };

    const saveView = () => {
        const name = viewName.trim();
        if (!name) return;
        const next = {
            id: Date.now(),
            name,
            filters: { query, statusFilter, typeFilter, severityFilter, sortBy, timeRange, groupBy },
        };
        setSavedViews((prev) => [next, ...prev.filter((v) => v.name !== name)].slice(0, 8));
        setViewName("");
    };

    const applyView = (view) => {
        const f = view.filters || {};
        setQuery(f.query || "");
        setStatusFilter(f.statusFilter || "");
        setTypeFilter(f.typeFilter || "");
        setSeverityFilter(f.severityFilter || "");
        setSortBy(f.sortBy || "newest");
        setTimeRange(f.timeRange || "");
        setGroupBy(f.groupBy || "none");
    };

    const deleteView = (id) => setSavedViews((prev) => prev.filter((v) => v.id !== id));

    const exportCsv = useCallback((items, filename) => {
        const header = ["id", "computer", "ip", "type", "severity", "status", "description", "created_at"].join(",");
        const rows = items
            .map((l) => [
                l.id,
                l.computer_name,
                l.ip,
                l.error_type,
                l.severity,
                l.status,
                String(l.description || "").replaceAll("\n", " ").replaceAll(",", " "),
                l.created_at,
            ].join(","))
            .join("\n");

        const csv = `${header}\n${rows}`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    }, []);

    const resolveLog = async (log) => {
        if (!log || log.source === "json") return;
        try {
            await api.put(`/logs/resolve/${log.id}`);
            setLogsRef.current((prev) =>
                prev.map((l) => (String(l.id) === String(log.id) ? { ...l, status: "resolved" } : l))
            );
        } catch (e) {
            console.error("Resolve failed", e);
        }
    };

    const bulkResolve = useCallback(async () => {
        const targets = selectedLogs.filter((l) => l.source !== "json");
        try {
            await Promise.all(targets.map((l) => api.put(`/logs/resolve/${l.id}`)));
            await loadLogs();
        } catch (e) {
            console.error("Bulk resolve failed", e);
        } finally {
            setSelectedIds([]);
        }
    }, [selectedLogs, loadLogs]);

    const autoResolveLow = useCallback(async () => {
        const now = Date.now();
        const thresholdMs = Number(autoResolveHours) * 60 * 60 * 1000;
        const targets = sortedLogs.filter((l) => {
            const sev = String(l.severity || "").toLowerCase();
            const status = String(l.status || "open").toLowerCase();
            const created = new Date(l.created_at || now).getTime();
            return sev === "low" && status !== "resolved" && (now - created) >= thresholdMs && l.source !== "json";
        });
        try {
            await Promise.all(targets.map((l) => api.put(`/logs/resolve/${l.id}`)));
            await loadLogs();
        } catch (e) {
            console.error("Auto-resolve failed", e);
        }
    }, [sortedLogs, autoResolveHours, loadLogs]);

    const bulkJumpToSearch = () => {
        if (!selectedLogs.length) return;
        const ip = selectedLogs[0]?.ip;
        if (!ip) return;
        localStorage.setItem("search-ip-value", JSON.stringify(ip));
        navigate("/search");
    };

    const toggleSelected = (id) => {
        const key = String(id);
        setSelectedIds((prev) =>
            prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
        );
    };

    const copySelectedIps = useCallback(async () => {
        const ips = [...new Set(selectedLogs.map((l) => l.ip).filter(Boolean))];
        if (!ips.length) return;
        try {
            await navigator.clipboard.writeText(ips.join("\n"));
        } catch {
            const area = document.createElement("textarea");
            area.value = ips.join("\n");
            document.body.appendChild(area);
            area.select();
            document.execCommand("copy");
            area.remove();
        }
    }, [selectedLogs]);

    useEffect(() => {
        if (!selectMode) return;
        const handler = (e) => {
            const tag = e.target?.tagName?.toLowerCase();
            if (tag === "input" || tag === "textarea") return;

            if (e.key === "a") {
                e.preventDefault();
                setSelectedIds(sortedLogs.map((l) => String(l.id)));
            }
            if (e.key === "c") {
                e.preventDefault();
                copySelectedIps();
            }
            if (e.key === "e") {
                e.preventDefault();
                exportCsv(selectedLogs, "logs_selected.csv");
            }
            if (e.key === "r") {
                e.preventDefault();
                bulkResolve();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [selectMode, selectedLogs, sortedLogs, exportCsv, copySelectedIps, bulkResolve]);

    const desktopCols = useMemo(() => {
        const cols = [];
        if (selectMode) cols.push("40px");
        cols.push("48px");
        cols.push("1fr");
        if (columns.ip) cols.push("140px");
        if (columns.time) cols.push("160px");
        if (columns.status) cols.push("120px");
        return cols.join(" ");
    }, [selectMode, columns]);

    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Box>
                    <Typography variant="h4" className="lv-hero__title" sx={{ color: textColor }}>
                        LOG INTELLIGENCE
                    </Typography>
                    <Typography className="lv-hero__subtitle" sx={{ color: textColor }}>
                        Incident stream with live severity and status signals.
                    </Typography>
                </Box>

                <Box className="lv-strip">
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<RefreshIcon />}
                        onClick={loadLogs}
                    >
                        Refresh Logs
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setAddOpen(true)}
                    >
                        + Add Log
                    </Button>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" },
                    gap: 2,
                }}
            >
                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Filters and Views
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                        <TextField
                            label="Search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="IP, type, description..."
                            fullWidth
                        />

                        <TextField
                            select
                            label="Status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="open">Open</MenuItem>
                            <MenuItem value="investigating">Investigating</MenuItem>
                            <MenuItem value="resolved">Resolved</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Category"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="">All</MenuItem>
                            {[
                                "Hardware",
                                "Software",
                                "Network",
                                "Security",
                                "Other",
                            ].map((opt) => (
                                <MenuItem key={opt} value={opt.toLowerCase()}>
                                    {opt}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="critical">Critical</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Sort"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="newest">Newest</MenuItem>
                            <MenuItem value="oldest">Oldest</MenuItem>
                            <MenuItem value="severity">Severity</MenuItem>
                            <MenuItem value="ip">IP</MenuItem>
                        </TextField>
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                        <Chip
                            label="Critical"
                            onClick={() => setSeverityFilter("critical")}
                            sx={{ background: "rgba(239,68,68,0.18)" }}
                        />
                        <Chip
                            label="Open"
                            onClick={() => setStatusFilter("open")}
                            sx={{ background: "rgba(59,130,246,0.18)" }}
                        />
                        <Chip
                            label="Hardware"
                            onClick={() => setTypeFilter("hardware")}
                            sx={{ background: "rgba(124,58,237,0.18)" }}
                        />
                        <Chip
                            label="Last 24h"
                            onClick={() => setTimeRange("24h")}
                            sx={{ background: "rgba(250,204,21,0.18)" }}
                        />
                        <Chip
                            label="Last 7d"
                            onClick={() => setTimeRange("7d")}
                            sx={{ background: "rgba(74,222,128,0.18)" }}
                        />
                        <Chip
                            label="All Time"
                            onClick={() => setTimeRange("")}
                        />
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" }, gap: 2, mt: 2 }}>
                        <TextField
                            select
                            label="Group by"
                            value={groupBy}
                            onChange={(e) => setGroupBy(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="none">No Grouping</MenuItem>
                            <MenuItem value="ip">IP</MenuItem>
                            <MenuItem value="severity">Severity</MenuItem>
                            <MenuItem value="category">Category</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Density"
                            value={density}
                            onChange={(e) => setDensity(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="compact">Compact</MenuItem>
                            <MenuItem value="comfortable">Comfortable</MenuItem>
                        </TextField>

                        <TextField
                            select
                            label="Columns"
                            value="custom"
                            fullWidth
                            SelectProps={{ renderValue: () => "Customize" }}
                        >
                            <MenuItem onClick={() => setColumns((c) => ({ ...c, ip: !c.ip }))}>
                                {columns.ip ? "Hide IP" : "Show IP"}
                            </MenuItem>
                            <MenuItem onClick={() => setColumns((c) => ({ ...c, time: !c.time }))}>
                                {columns.time ? "Hide Time" : "Show Time"}
                            </MenuItem>
                            <MenuItem onClick={() => setColumns((c) => ({ ...c, status: !c.status }))}>
                                {columns.status ? "Hide Status" : "Show Status"}
                            </MenuItem>
                        </TextField>
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2 }}>
                        <Button variant="outlined" onClick={clearFilters}>Clear Filters</Button>
                        <Button
                            variant={selectMode ? "contained" : "outlined"}
                            onClick={() => {
                                setSelectMode((v) => !v);
                                setSelectedIds([]);
                            }}
                        >
                            {selectMode ? "Exit Select" : "Select Items"}
                        </Button>
                        {selectMode && (
                            <Typography sx={{ opacity: 0.7, alignSelf: "center" }}>
                                Shortcuts: A=select all, R=resolve, C=copy, E=export
                            </Typography>
                        )}
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => exportCsv(sortedLogs, "logs_export.csv")}
                        >
                            Export Visible
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => exportCsv(selectedLogs, "logs_selected.csv")}
                            disabled={!selectedLogs.length}
                        >
                            Export Selected
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<ContentCopyIcon />}
                            onClick={copySelectedIps}
                            disabled={!selectedLogs.length}
                        >
                            Copy IPs
                        </Button>
                        <Button
                            variant="contained"
                            onClick={bulkResolve}
                            disabled={!selectedLogs.length}
                        >
                            Resolve Selected
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={bulkJumpToSearch}
                            disabled={!selectedLogs.length}
                        >
                            Jump to Search
                        </Button>
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Saved Views
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5 }}>
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <TextField
                                label="View name"
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                                fullWidth
                            />
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={saveView}
                                disabled={!viewName.trim()}
                            >
                                Save
                            </Button>
                        </Box>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                            {savedViews.length === 0 && (
                                <Typography sx={{ opacity: 0.7, color: textColor }}>
                                    No saved views yet.
                                </Typography>
                            )}
                            {savedViews.map((view) => (
                                <Chip
                                    key={view.id}
                                    label={view.name}
                                    onClick={() => applyView(view)}
                                    onDelete={() => deleteView(view.id)}
                                />
                            ))}
                        </Box>
                    </Box>

                    <Box sx={{ mt: 3, display: "grid", gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: textColor }}>
                            Current View Summary
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            <Chip label={`Total: ${summary.total}`} />
                            <Chip label={`Critical: ${summary.critical}`} sx={{ background: "rgba(239,68,68,0.18)" }} />
                            <Chip label={`Medium: ${summary.medium}`} sx={{ background: "rgba(250,204,21,0.18)" }} />
                            <Chip label={`Low: ${summary.low}`} sx={{ background: "rgba(74,222,128,0.18)" }} />
                            <Chip label={`Open: ${summary.open}`} />
                            <Chip label={`Investigating: ${summary.investigating}`} />
                        </Box>
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        AI Log Summary
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
                        <Typography sx={{ mt: 1, opacity: 0.8 }}>
                            Most severe: {aiStats.mostSevere.error_type} · {aiStats.mostSevere.ip}
                        </Typography>
                    )}
                </Paper>

                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Recommended Actions
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {aiRecs.length === 0 && (
                            <Typography sx={{ opacity: 0.7, color: textColor }}>
                                No recommendations yet.
                            </Typography>
                        )}
                        {aiRecs.map((rec, idx) => (
                            <Box key={idx} sx={{ display: "grid", gap: 0.3 }}>
                                <Typography sx={{ fontWeight: 800 }}>{rec.title}</Typography>
                                <Typography sx={{ opacity: 0.7 }}>{rec.reason}</Typography>
                                <Typography sx={{ opacity: 0.6, fontSize: 12 }}>{rec.action}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Alerts Center
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {alerts.length === 0 && (
                            <Typography sx={{ opacity: 0.7, color: textColor }}>No active alerts.</Typography>
                        )}
                        {alerts.slice(0, 6).map((a) => (
                            <Box key={a.id}>
                                <Typography sx={{ fontWeight: 800 }}>{a.title}</Typography>
                                <Typography sx={{ opacity: 0.7 }}>{a.reason}</Typography>
                                <Button variant="outlined" size="small" sx={{ mt: 0.5 }} onClick={() => navigate(a.route || "/logs")}>
                                    {a.action || "Open"}
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Priority Worklist
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1 }}>
                        {worklist.length === 0 && (
                            <Typography sx={{ opacity: 0.7, color: textColor }}>No urgent tasks.</Typography>
                        )}
                        {worklist.map((w) => (
                            <Box key={w.id}>
                                <Typography sx={{ fontWeight: 800 }}>{w.title}</Typography>
                                <Typography sx={{ opacity: 0.7 }}>{w.reason}</Typography>
                                <Button variant="outlined" size="small" sx={{ mt: 0.5 }} onClick={() => navigate(w.route || "/logs")}>
                                    Open
                                </Button>
                            </Box>
                        ))}
                    </Box>
                </Paper>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Automation
                    </Typography>
                    <Typography sx={{ opacity: 0.75, mb: 1 }}>
                        Auto-resolve low severity incidents older than:
                    </Typography>
                    <TextField
                        select
                        label="Age (hours)"
                        value={autoResolveHours}
                        onChange={(e) => setAutoResolveHours(Number(e.target.value))}
                        sx={{ width: 200 }}
                    >
                        {[24, 48, 72, 168].map((h) => (
                            <MenuItem key={h} value={h}>{h}</MenuItem>
                        ))}
                    </TextField>
                    <Box sx={{ mt: 1 }}>
                        <Button variant="contained" onClick={autoResolveLow}>
                            Run Auto-Resolve
                        </Button>
                    </Box>
                </Paper>

                <Paper className="lv-panel">
                    <Typography sx={{ fontWeight: 800, color: textColor, mb: 1 }}>
                        Reports Snapshot
                    </Typography>
                    <Typography sx={{ fontWeight: 800, mb: 1 }}>
                        Last 24h incidents: {reports.last24Count}
                    </Typography>
                    {reports.topIps.map(([ip, count]) => (
                        <Typography key={ip} sx={{ opacity: 0.8 }}>
                            {ip} · {count}
                        </Typography>
                    ))}
                    <Box sx={{ mt: 1 }}>
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

            <Paper className="lv-panel">
                <Box sx={{ display: "grid", gap: 1.5 }}>
                    {Object.entries(groupedLogs).map(([group, items]) => (
                        <Box key={group} sx={{ display: "grid", gap: 1.2 }}>
                            {groupBy !== "none" && (
                                <Typography sx={{ color: textColor, fontWeight: 900 }}>
                                    {group} · {items.length} incidents
                                </Typography>
                            )}

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: { xs: "1fr", md: desktopCols },
                                    gap: 2,
                                    px: 1,
                                    py: 1,
                                    borderRadius: 10,
                                    background: "rgba(255,255,255,0.03)",
                                    border: "1px solid rgba(201,165,95,0.16)",
                                    fontWeight: 800,
                                    letterSpacing: "0.04em",
                                    textTransform: "uppercase",
                                    fontSize: 12,
                                }}
                            >
                                {selectMode && <Box />}
                                <Box />
                                <Typography sx={{ color: textColor }}>Incident</Typography>
                                {columns.ip && <Typography sx={{ color: textColor }}>IP</Typography>}
                                {columns.time && <Typography sx={{ color: textColor }}>Time</Typography>}
                                {columns.status && <Typography sx={{ color: textColor }}>Status</Typography>}
                            </Box>

                            {items.map((log, i) => {
                                const statusKey = (log.status || "open").toLowerCase();
                                const status = STATUS_MAP[statusKey] || STATUS_MAP.open;
                                const idKey = String(log.id ?? `missing-${i}`);
                                const ipSimilar = Math.max(0, (similarityIndex.byIp[log.ip] || 1) - 1);
                                const typeSimilar = Math.max(0, (similarityIndex.byType[log.error_type] || 1) - 1);
                                const rowPadding = density === "compact" ? 1.6 : 2.5;

                                return (
                                    <Paper
                                        key={`${log.source || "db"}-${idKey}-${log.ip || "noip"}`}
                                        sx={{
                                            p: rowPadding,
                                            borderRadius: "14px",
                                            display: "grid",
                                            gridTemplateColumns: { xs: "1fr", md: desktopCols },
                                            alignItems: "center",
                                            gap: 2,
                                            cursor: "pointer",
                                            background: bgCard,
                                            borderLeft: `8px solid ${severityColor[log.severity]}`,
                                            border: "1px solid rgba(201,165,95,0.16)",
                                            transition: "transform .2s ease, box-shadow .2s ease, border-color .2s ease",
                                            "&:hover": {
                                                transform: "translateY(-2px)",
                                                boxShadow: "0 16px 36px rgba(0,0,0,0.18)",
                                                borderColor: "rgba(182,72,82,0.22)",
                                            },
                                        }}
                                        onClick={() => openIssue(log)}
                                    >
                                        {selectMode && (
                                            <Checkbox
                                                checked={selectedIds.includes(idKey)}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={() => toggleSelected(idKey)}
                                            />
                                        )}

                                        <Box sx={{ pt: { xs: 0, md: 0.5 } }}>{iconForType(log.error_type)}</Box>

                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography sx={{ fontWeight: 800, color: textColor }}>
                                                {log.error_type} - {log.computer_name}
                                            </Typography>

                                            <Typography sx={{ opacity: 0.82, color: textColor, mt: 0.5 }}>
                                                {log.description}
                                            </Typography>

                                            <Typography sx={{ fontSize: 12, opacity: 0.65, color: textColor, mt: 0.5 }}>
                                                Similar incidents: {ipSimilar} on same IP · {typeSimilar} in same category
                                            </Typography>

                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (log.ip) {
                                                            localStorage.setItem("search-ip-value", JSON.stringify(log.ip));
                                                            navigate("/search");
                                                        }
                                                    }}
                                                >
                                                    Open Search
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (log.ip) {
                                                            localStorage.setItem("search-ip-value", JSON.stringify(log.ip));
                                                            navigate("/hardware");
                                                        }
                                                    }}
                                                >
                                                    Hardware
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (log.ip) {
                                                            navigate("/realtime");
                                                        }
                                                    }}
                                                >
                                                    Realtime
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard?.writeText?.(log.ip || "");
                                                    }}
                                                >
                                                    Copy IP
                                                </Button>
                                                {log.source !== "json" && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            resolveLog(log);
                                                        }}
                                                    >
                                                        Resolve
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>

                                        {columns.ip && (
                                            <Typography sx={{ color: textColor, fontWeight: 700 }}>
                                                {log.ip}
                                            </Typography>
                                        )}
                                        {columns.time && (
                                            <Typography sx={{ fontSize: "0.75rem", opacity: 0.6, color: textColor }}>
                                                {new Date(log.created_at || Date.now()).toLocaleString()}
                                            </Typography>
                                        )}
                                        {columns.status && (
                                            <Chip
                                                icon={status.icon}
                                                label={status.label}
                                                color={status.color}
                                                size="small"
                                            />
                                        )}
                                    </Paper>
                                );
                            })}
                        </Box>
                    ))}

                    {sortedLogs.length === 0 && (
                        <Typography sx={{ color: textColor, opacity: 0.6, mt: 3, textAlign: "center" }}>
                            No logs available. Try adjusting filters or refreshing.
                        </Typography>
                    )}
                </Box>
            </Paper>

            <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Log</DialogTitle>

                <DialogContent sx={{ pt: 1 }}>
                    <Typography sx={{ opacity: 0.7, mb: 2 }}>
                        Create a new incident record for the selected system.
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <TextField
                            label="IP"
                            value={addForm.ip}
                            onChange={(e) => setField("ip", e.target.value)}
                            placeholder="192.168.1.50"
                            fullWidth
                            required
                        />

                        <TextField
                            label="Computer Name"
                            value={addForm.computer_name}
                            onChange={(e) => setField("computer_name", e.target.value)}
                            placeholder="PC-003"
                            fullWidth
                        />

                        <TextField
                            label="Category"
                            select
                            value={addForm.error_type}
                            onChange={(e) => setField("error_type", e.target.value)}
                            fullWidth
                        >
                            {["Software", "Hardware", "Network", "Security", "Other"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Severity"
                            select
                            value={addForm.severity}
                            onChange={(e) => setField("severity", e.target.value)}
                            fullWidth
                        >
                            {["Low", "Medium", "Critical"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            label="Status"
                            select
                            value={addForm.status}
                            onChange={(e) => setField("status", e.target.value)}
                            fullWidth
                        >
                            {["open", "investigating", "resolved"].map((opt) => (
                                <MenuItem key={opt} value={opt}>{opt.toUpperCase()}</MenuItem>
                            ))}
                        </TextField>
                    </Box>

                    <TextField
                        label="Description"
                        value={addForm.description}
                        onChange={(e) => setField("description", e.target.value)}
                        fullWidth
                        multiline
                        minRows={3}
                        required
                        sx={{ mt: 2 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={() => setAddOpen(false)}>Cancel</Button>

                    <Button
                        variant="contained"
                        onClick={async () => {
                            try {
                                const res = await api.post("/logs/", addForm);

                                const created = res?.data;
                                if (created && created.id) {
                                    setLogsRef.current((prev) => [created, ...prev]);
                                } else {
                                    await loadLogs();
                                }

                                setAddOpen(false);
                            } catch (e) {
                                console.error("Failed creating log:", e);
                                alert("Failed to create log. Check backend endpoint/fields.");
                            }
                        }}
                        disabled={!addForm.ip || !addForm.description}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={showAlert} autoHideDuration={4000} onClose={() => setShowAlert(false)}>
                <Alert severity="error">
                    New LIVE Issue: {newIssue?.error_type} ({newIssue?.ip})
                </Alert>
            </Snackbar>
        </Box>
    );
}
