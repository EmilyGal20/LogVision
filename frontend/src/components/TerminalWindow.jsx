// components/TerminalWindow.jsx
import { Box, Paper, IconButton, Typography } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import Terminal from "./Terminal";

export default function TerminalWindow({
    window,
    onFocus,
    onMinimize,
    onMaximize,
}) {
    return (
        <Paper
            onMouseDown={onFocus}
            sx={{
                position: "absolute",
                top: window.position?.y ?? 140,
                left: window.position?.x ?? 200,
                width: window.maximized ? "90vw" : 520,
                height: window.maximized ? "80vh" : 320,
                zIndex: window.z,
                borderRadius: window.maximized ? 0 : "14px",
                overflow: "hidden",
                background: "#020617",
                boxShadow: window.active
                    ? "0 0 0 1px rgba(126,231,135,.6), 0 0 40px rgba(126,231,135,.25)"
                    : "0 20px 60px rgba(0,0,0,.7)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* ===== HEADER ===== */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 1,
                    py: 0.5,
                    gap: 1,
                    background:
                        "linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,0))",
                    userSelect: "none",
                }}
            >
                <IconButton size="small" onClick={onMinimize}>
                    <RemoveIcon sx={{ fontSize: 14, color: "#7ee787" }} />
                </IconButton>

                <IconButton size="small" onClick={onMaximize}>
                    {window.maximized ? (
                        <CloseFullscreenIcon sx={{ fontSize: 14, color: "#7ee787" }} />
                    ) : (
                        <CropSquareIcon sx={{ fontSize: 14, color: "#7ee787" }} />
                    )}
                </IconButton>

                <Typography sx={{ ml: 1, fontSize: 12, opacity: 0.7 }}>
                    terminal://logvision
                </Typography>
            </Box>

            {/* ===== BODY ===== */}
            <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>
                <Terminal />
            </Box>
        </Paper>
    );
}
