// ============================================================================
// ISSUEDETAILS.JSX — Full Support for REAL + JSON logs
// ============================================================================

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Paper, Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

const severityColor = {
    Critical: "#ef4444",
    Medium: "#facc15",
    Low: "#4ade80",
};

export default function IssueDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { mode } = useThemeMode();

    const [issue, setIssue] = useState(null);
    const [pingHistory, setPingHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    // ============================================================
    // LOAD ISSUE — supports REAL + JSON format
    // ============================================================
    const loadIssue = useCallback(async () => {
        setLoading(true);

        try {
            const res = await api.get(`/logs/${id}`);

            if (res.data) {
                setIssue(res.data);

                // JSON logs → skip ping history
                if (res.data.source === "json") {
                    setPingHistory([]);
                    setLoading(false);
                    return;
                }

                // REAL logs → fetch ping history
                if (res.data.ip) {
                    const p = await api.get(`/realtime/history/${res.data.ip}`);
                    setPingHistory(p.data.slice(-20));
                }
            } else {
                setIssue(null);
            }
        } catch (err) {
            console.warn("❌ Failed loading issue:", err);
            setIssue(null);
        }

        setLoading(false);
    }, [id]);

    useEffect(() => {
        loadIssue();
    }, [loadIssue]);

    // ============================================================
    // FIX ISSUE (REAL ONLY)
    // ============================================================
    const fixIssue = async () => {
        if (issue.source === "json") {
            alert("Cannot resolve JSON-based issue.");
            return;
        }

        try {
            await api.put(`/logs/resolve/${id}`);
            navigate("/logs", { state: { refresh: true } });
        } catch {
            alert("Error: Failed to resolve issue.");
        }
    };

    // ============================================================
    // DELETE ISSUE (REAL ONLY)
    // ============================================================
    const deleteIssue = async () => {
        if (issue.source === "json") {
            alert("JSON issues cannot be deleted from server.");
            return navigate("/logs");
        }

        try {
            await api.delete(`/logs/${id}`);
            navigate("/logs", { state: { deletedId: id } });
        } catch {
            alert("Error deleting issue.");
        }
    };

    // ============================================================
    // UI HELPERS
    // ============================================================
    const textColor = mode === "dark" ? "#e5e7eb" : "#222";
    const cardBackground = mode === "dark" ? "rgba(255,255,255,0.06)" : "#ffffff";
    const subtleBorder =
        mode === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)";

    // ============================================================
    // LOADING / NOT FOUND
    // ============================================================
    if (loading)
        return (
            <Typography sx={{ color: textColor, mt: 5, textAlign: "center" }}>
                Loading...
            </Typography>
        );

    if (!issue)
        return (
            <Box sx={{ textAlign: "center", mt: 10 }}>
                <Typography sx={{ color: textColor, mb: 2 }}>
                    Issue not found.
                </Typography>
                <Button variant="outlined" onClick={() => navigate("/logs")}>
                    ← Back to Logs
                </Button>
            </Box>
        );

    // ============================================================
    // MAIN VIEW
    // ============================================================
    return (
        <Box className="lv-page" sx={{ maxWidth: "1000px", margin: "0 auto" }}>
            <Box className="lv-header">
                <Box>
                    <Typography variant="h4" className="lv-header__title" sx={{ color: textColor }}>
                        Issue Details
                    </Typography>
                    <Typography className="lv-header__subtitle" sx={{ color: textColor }}>
                        Focused incident view, timeline, and resolution actions.
                    </Typography>
                </Box>
                <Button variant="outlined" onClick={() => navigate("/logs")}>
                    ← Back to Logs
                </Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
                {/* MAIN CARD */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Paper
                        className="lv-panel"
                        sx={{
                            background: cardBackground,
                            border: subtleBorder,
                            backdropFilter: "blur(10px)",
                        }}
                    >
                    {/* JSON BADGE */}
                    {/* {issue.source === "json" && (
                        <Chip
                            label="JSON Source"
                            color="warning"
                            sx={{ fontWeight: "bold", mb: 2 }}
                        />
                    )} */}

                    <Typography variant="h5" fontWeight="bold" sx={{ color: textColor }}>
                        🛠 {issue.error_type}
                    </Typography>

                    <Box mt={2}>
                        <Typography sx={{ color: textColor }}>
                            <strong>Computer:</strong> {issue.computer_name}
                        </Typography>

                        <Typography sx={{ mt: 1, color: textColor }}>
                            <strong>IP Address:</strong> {issue.ip}
                        </Typography>

                        <Typography sx={{ mt: 1, color: textColor }}>
                            <strong>Description:</strong> {issue.description}
                        </Typography>

                        <Typography sx={{ mt: 1 }}>
                            <strong>Severity:</strong>{" "}
                            <span
                                style={{
                                    background: severityColor[issue.severity],
                                    padding: "5px 12px",
                                    borderRadius: "6px",
                                    color: "#000",
                                    fontWeight: "bold",
                                }}
                            >
                                {issue.severity}
                            </span>
                        </Typography>

                        <Typography sx={{ mt: 1, color: textColor }}>
                            <strong>Status:</strong>{" "}
                            {issue.status === "resolved" ? "✅ Resolved" : "❌ Open"}
                        </Typography>

                        <Typography sx={{ mt: 1, opacity: 0.7, color: textColor }}>
                            <strong>Created at:</strong>{" "}
                            {new Date(issue.created_at).toLocaleString()}
                        </Typography>
                    </Box>

                    {/* ACTION BUTTONS */}
                    {issue.source !== "json" && (
                        <Box mt={4} display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
                            <Button variant="contained" color="success" fullWidth onClick={fixIssue}>
                                Mark as Resolved
                            </Button>

                            <Button variant="outlined" color="error" fullWidth onClick={deleteIssue}>
                                Delete Issue
                            </Button>
                        </Box>
                    )}
                </Paper>
                </motion.div>

                {/* TIMELINE + PING */}
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Paper className="lv-panel" sx={{ background: cardBackground, border: subtleBorder, position: "relative" }}>
                        <Typography variant="h6" sx={{ mb: 2, color: textColor }}>
                            Issue Timeline
                        </Typography>

                        <Box
                            sx={{
                                position: "absolute",
                                left: "18px",
                                top: "56px",
                                bottom: "20px",
                                width: "3px",
                                background:
                                    mode === "dark"
                                        ? "rgba(255,255,255,0.15)"
                                        : "rgba(0,0,0,0.15)",
                            }}
                        />
                <Box
                    sx={{
                        position: "absolute",
                        left: "18px",
                        top: "20px",
                        bottom: "20px",
                        width: "3px",
                        background:
                            mode === "dark"
                                ? "rgba(255,255,255,0.15)"
                                : "rgba(0,0,0,0.15)",
                    }}
                />

                <Box sx={{ ml: 5, display: "flex", flexDirection: "column", gap: 3 }}>
                    {/* Issue Created */}
                    <Box sx={{ display: "flex", gap: 2 }}>
                        <Box
                            sx={{
                                width: "14px",
                                height: "14px",
                                borderRadius: "50%",
                                background: severityColor[issue.severity],
                                mt: "4px",
                            }}
                        />
                        <Box>
                            <Typography sx={{ color: textColor, fontWeight: "bold" }}>
                                Issue Created
                            </Typography>
                            <Typography sx={{ color: textColor, opacity: 0.8 }}>
                                {new Date(issue.created_at).toLocaleString()}
                            </Typography>
                        </Box>
                    </Box>

                    {/* Ping events — only for REAL logs */}
                    {issue.source !== "json" &&
                        pingHistory.map((p, i) => (
                            <Box key={i} sx={{ display: "flex", gap: 2 }}>
                                <Box
                                    sx={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        background: p.online ? "#4ade80" : "#ef4444",
                                        mt: "4px",
                                    }}
                                />
                                <Box>
                                    <Typography
                                        sx={{
                                            color: p.online ? "#4ade80" : "#ef4444",
                                            fontWeight: "bold",
                                        }}
                                    >
                                        {p.online ? "Online" : "Offline"}
                                    </Typography>
                                    <Typography sx={{ color: textColor, opacity: 0.8 }}>
                                        {new Date(p.timestamp).toLocaleString()}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}

                    {/* Resolved */}
                    {issue.status === "resolved" && (
                        <Box sx={{ display: "flex", gap: 2 }}>
                            <Box
                                sx={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "50%",
                                    background: "#4ade80",
                                    mt: "4px",
                                }}
                            />
                            <Box>
                                <Typography sx={{ color: "#4ade80", fontWeight: "bold" }}>
                                    Issue resolved ✔
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>
                    </Paper>

                    {/* PING HISTORY — REAL ONLY */}
                    {issue.source !== "json" && (
                        <Paper className="lv-panel" sx={{ background: cardBackground, border: subtleBorder }}>
                        <Typography variant="h6" sx={{ mb: 2, color: textColor }}>
                            Last 20 Ping Checks
                        </Typography>
                        {pingHistory.length === 0 ? (
                            <Typography sx={{ opacity: 0.7, color: textColor }}>
                                No ping data available.
                            </Typography>
                        ) : (
                            pingHistory.map((p, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        padding: "10px",
                                        borderBottom:
                                            mode === "dark"
                                                ? "1px solid rgba(255,255,255,0.08)"
                                                : "1px solid rgba(0,0,0,0.08)",
                                        color: textColor,
                                    }}
                                >
                                    <Typography>
                                        <strong>Status:</strong>{" "}
                                        {p.online ? "🟢 Online" : "🔴 Offline"}
                                    </Typography>
                                    <Typography>
                                        <strong>Time:</strong>{" "}
                                        {new Date(p.timestamp).toLocaleString()}
                                    </Typography>
                                </Box>
                            ))
                        )}
                        </Paper>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
