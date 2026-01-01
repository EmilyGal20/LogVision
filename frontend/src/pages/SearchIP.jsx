// ------------------------------------------------------
//  SEARCHIP.JSX — Full Smart Version (Demo Mode + Real Logs)
// ------------------------------------------------------

import { useCallback } from "react";
import { api } from "../api";
import usePersistentState from "../hooks/usePersistentState";

import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    MenuItem,
    Tooltip
} from "@mui/material";

import { useThemeMode } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// ICONS
import MemoryIcon from "@mui/icons-material/Memory";
import BugReportIcon from "@mui/icons-material/BugReport";
import WifiIcon from "@mui/icons-material/Wifi";
import ErrorIcon from "@mui/icons-material/Error";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import StorageIcon from "@mui/icons-material/Storage";

// ------------------------------------------------------
// DEMO ERROR TEMPLATES
// ------------------------------------------------------
const DEMO_TEMPLATES = [
    { error_type: "Hardware", description: "CPU overheating (Demo)", severity: "Critical" },
    { error_type: "Hardware", description: "Disk read failure (Demo)", severity: "Medium" },
    { error_type: "Network", description: "Network timeout (Demo)", severity: "Low" }
];

// ------------------------------------------------------
// ICON MAP
// ------------------------------------------------------
const ICON_MAP = {
    "CPU overheating (Demo)": <WhatshotIcon sx={{ color: "#ef4444", fontSize: 32 }} />,
    "Disk read failure (Demo)": <StorageIcon sx={{ color: "#3b82f6", fontSize: 32 }} />,
    "Network timeout (Demo)": <WifiIcon sx={{ color: "#06b6d4", fontSize: 32 }} />,
};

// ------------------------------------------------------
// LOCALSTORAGE DEMO HANDLING
// ------------------------------------------------------
function loadDemoLogsForIP(ip) {
    const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
    return all[ip] || null;
}

function saveDemoLogsForIP(ip, logs) {
    const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
    all[ip] = logs;
    localStorage.setItem("demo-errors-by-ip", JSON.stringify(all));
}

function deleteDemoForIP(ip, id) {
    const logs = loadDemoLogsForIP(ip);
    if (!logs) return;
    saveDemoLogsForIP(ip, logs.filter(l => l.id !== id));
}

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
export default function SearchIP() {

    const { mode } = useThemeMode();
    const navigate = useNavigate();

    const [ip, setIp] = usePersistentState("search-ip-value", "");
    const [errorType, setErrorType] = usePersistentState("search-error-type", "");
    const [severityFilter, setSeverityFilter] = usePersistentState("severity-filter", "");
    const [showDemoOnly, setShowDemoOnly] = usePersistentState("show-demo-only", false);
    const [results, setResults] = usePersistentState("search-results", []);

    // ------------------------------------------------------
    // ICON HANDLER
    // ------------------------------------------------------
    const iconForError = (description, type) => {
        if (ICON_MAP[description]) return ICON_MAP[description];

        switch (type) {
            case "Hardware": return <MemoryIcon sx={{ color: "#7c3aed", fontSize: 32 }} />;
            case "Software": return <BugReportIcon sx={{ color: "#06b6d4", fontSize: 32 }} />;
            case "Network": return <WifiIcon sx={{ color: "#3b82f6", fontSize: 32 }} />;
            default: return <ErrorIcon sx={{ fontSize: 32 }} />;
        }
    };

    // ------------------------------------------------------
    // SEARCH FUNCTION
    // ------------------------------------------------------
    const search = useCallback(async () => {

        // ⭐ DEMO ONLY MODE 
        if (showDemoOnly) {
            const demo = DEMO_TEMPLATES.map((tpl, index) => ({
                id: `demo-${index}`,
                ip: ip || "0.0.0.0",
                is_demo: true,
                ...tpl,
            }));

            setResults(demo);
            return;
        }

        // ⭐ REAL MODE REQUIRES IP
        if (!ip) {
            alert("Please enter an IP address.");
            return;
        }

        // REAL SEARCH
        const res = await api.get("/logs/search", { params: { ip } });

        let realLogs = res.data.map(log => ({
            ...log,
            is_real: !log.source,
            is_json: log.source === "json"
        }));

        if (errorType) realLogs = realLogs.filter(l => l.error_type === errorType);
        if (severityFilter) realLogs = realLogs.filter(l => l.severity === severityFilter);

        setResults(realLogs);

    }, [ip, errorType, severityFilter, showDemoOnly, setResults]);

    // ------------------------------------------------------
    // RESET
    // ------------------------------------------------------
    const reset = () => {
        setIp("");
        setErrorType("");
        setSeverityFilter("");
        setResults([]);
    };

    // ------------------------------------------------------
    // DELETE HANDLER
    // ------------------------------------------------------
    const handleDelete = async (log) => {
        if (log.is_demo) {
            deleteDemoForIP(log.ip, log.id);
            setResults(prev => prev.filter(l => l.id !== log.id));
            return;
        }

        await api.delete(`/logs/${log.id}`);
        setResults(prev => prev.filter(l => l.id !== log.id));
    };

    // ------------------------------------------------------
    // COLORS
    // ------------------------------------------------------
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const severityColor = {
        Critical: "#ef4444",
        Medium: "#facc15",
        Low: "#4ade80",
        unknown: "#6b7280",
    };

    const severityBadge = (sev) => ({
        background: severityColor[sev] || severityColor.unknown,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    });

    const demoBadge = {
        background: "#6366f1",
        color: "white",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    };

    const realBadge = {
        background: "#ef4444",
        color: "white",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    };

    const bgCard = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    // ------------------------------------------------------
    // RENDER UI
    // ------------------------------------------------------
    return (
        <Box sx={{ padding: 4, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>

            <Typography variant="h4" fontWeight="bold" sx={{ color: textColor }}>
                Search Logs
            </Typography>

            {/* SEARCH BOX */}
            <Paper sx={{ width: "100%", maxWidth: 500, padding: 4, background: bgCard, borderRadius: "18px" }}>

                <TextField
                    label="IP Address"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    fullWidth
                    sx={{ mb: 3 }}
                />

                <TextField
                    label="Error Type"
                    value={errorType}
                    onChange={(e) => setErrorType(e.target.value)}
                    select
                    fullWidth
                    sx={{ mb: 3 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Hardware">Hardware</MenuItem>
                    <MenuItem value="Software">Software</MenuItem>
                    <MenuItem value="Network">Network</MenuItem>
                </TextField>

                <TextField
                    label="Severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    select
                    fullWidth
                    sx={{ mb: 3 }}
                >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Critical">Critical</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                </TextField>

                {/* DEMO ONLY TOGGLE */}
                <Button
                    variant={showDemoOnly ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                        py: 1.4,
                        mb: 2,
                        fontWeight: "bold",
                        background: showDemoOnly ? "#6366f1" : "transparent",
                        color: showDemoOnly ? "white" : "#6366f1",
                        borderColor: "#6366f1",
                    }}
                    onClick={() => {
                        const newState = !showDemoOnly;
                        setShowDemoOnly(newState);

                        if (newState) {
                            const demo = DEMO_TEMPLATES.map((tpl, index) => ({
                                id: `demo-${index}`,
                                ip: ip || "0.0.0.0",
                                is_demo: true,
                                ...tpl
                            }));
                            setResults(demo);
                        }
                    }}
                >
                    {showDemoOnly ? "Showing DEMO Only" : "Show Only Demo Logs"}
                </Button>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={search}
                    sx={{ py: 1.6, mb: 2.5, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: "bold" }}
                >
                    SEARCH
                </Button>

                <Button
                    variant="outlined"
                    fullWidth
                    sx={{ py: 1.4, fontWeight: "bold", borderColor: "#7c3aed", color: "#7c3aed" }}
                    onClick={reset}
                >
                    RESET
                </Button>
            </Paper>

            {/* RESULTS TITLE */}
            <Typography variant="h5" sx={{ color: textColor, mt: 2 }}>
                Results
            </Typography>

            {/* RESULTS LIST */}
            <Paper sx={{ width: "100%", maxWidth: 700, padding: 3, background: bgCard, borderRadius: "18px" }}>
                {results.length === 0 ? (
                    <Typography sx={{ color: textColor }}>No logs found.</Typography>
                ) : (
                    results.map((log) => (
                        <Tooltip
                            key={log.id}
                            title={
                                <Box p={1}>
                                    <Typography><b>{log.description}</b></Typography>
                                    <Typography>Severity: {log.severity}</Typography>
                                    <Typography>IP: {log.ip}</Typography>
                                    <Typography>{log.is_real ? "Real Log" : "Demo Log"}</Typography>
                                </Box>
                            }
                        >
                            <Box
                                sx={{
                                    p: 2.5,
                                    mb: 2,
                                    borderRadius: "12px",
                                    background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                    borderLeft: `6px solid ${severityColor[log.severity]}`,
                                    display: "flex",
                                    gap: 2,
                                    alignItems: "center"
                                }}
                            >
                                <Box sx={{ pt: 1 }}>
                                    {iconForError(log.description, log.error_type)}
                                </Box>

                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography
                                        sx={{
                                            fontWeight: "bold",
                                            fontSize: "18px",
                                            color: textColor,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            flexWrap: "wrap",
                                        }}
                                    >
                                        {log.error_type} — {log.ip}

                                        <span style={severityBadge(log.severity)}>
                                            {log.severity}
                                        </span>

                                        {log.is_real ? (
                                            <span style={realBadge}>REAL</span>
                                        ) : log.is_json ? (
                                            <span style={demoBadge}>JSON</span>
                                        ) : (
                                            <span style={demoBadge}>DEMO</span>
                                        )}

                                    </Typography>

                                    <Typography sx={{ opacity: 0.8, color: textColor }}>
                                        {log.description}
                                    </Typography>
                                </Box>

                                {log.is_real && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        sx={{ mr: 1 }}
                                        onClick={() => navigate(`/log/${log.id}`)}
                                    >
                                        View
                                    </Button>
                                )}

                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleDelete(log)}
                                >
                                    Delete
                                </Button>
                            </Box>
                        </Tooltip>
                    ))
                )}
            </Paper>
        </Box>
    );
}
