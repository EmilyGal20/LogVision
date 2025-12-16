// components/Taskbar.jsx
import { Box, IconButton, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import TerminalIcon from "@mui/icons-material/Terminal";
import LanguageIcon from "@mui/icons-material/Language";
import { useThemeMode } from "../context/ThemeContext";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";


export default function Taskbar({

    windows = [],
    onNewWindow,
    onRestoreWindow,
    onOpenTerminal,
}) {

    const { mode, toggleMode } = useThemeMode(); // ✅ חיבור ל־ThemeContext

    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                px: 2,
                py: 1,
                borderRadius: 999,
                background: "rgba(20,22,30,0.85)",
                backdropFilter: "blur(18px)",
                display: "flex",
                alignItems: "center",        // ✅ אותו קו
                gap: 1.5,                    // ✅ רווח אחיד
                zIndex: 2000,                // ✅ מעל כל חלון
                boxShadow:
                    "0 10px 40px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.08)",
            }}
        >
            {/* 🪟 Open browser windows */}
            {windows.map((win) => (
                <Tooltip key={win.id} title="Browser window">
                    <IconButton
                        size="small"
                        onClick={() => onRestoreWindow(win.id)}
                        sx={{
                            width: 36,
                            height: 36,
                            opacity: win.minimized ? 0.5 : 1,
                            border:
                                win.active && !win.minimized
                                    ? "1px solid rgba(124,58,237,.6)"
                                    : "1px solid transparent",
                        }}
                    >
                        <LanguageIcon sx={{ fontSize: 18, color: "#c9d1d9" }} />
                    </IconButton>
                </Tooltip>
            ))}

            {/* ➕ New browser window */}
            <Tooltip title="New window">
                <IconButton
                    size="small"
                    onClick={onNewWindow}
                    sx={{ width: 36, height: 36 }}
                >
                    <AddIcon sx={{ fontSize: 18, color: "#c9d1d9" }} />
                </IconButton>
            </Tooltip>

            {/* 🖥️ Terminal */}
            <Tooltip title="Terminal">
                <IconButton
                    size="small"
                    onClick={onOpenTerminal}
                    sx={{
                        width: 36,
                        height: 36,
                        border: "1px solid rgba(126,231,135,.4)",
                    }}
                >
                    <TerminalIcon sx={{ fontSize: 18, color: "#7ee787" }} />
                </IconButton>
            </Tooltip>

            {/* 🌙 DARK MODE BUTTON */}
            <Tooltip title="Toggle Dark Mode">
                <IconButton
                    onClick={toggleMode}
                    sx={{

                        zIndex: 9999,
                        color: "white",
                        background: "rgba(255,255,255,0.08)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        "&:hover": {
                            background: "rgba(255,255,255,0.15)",
                        },
                    }}
                >
                    {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
            </Tooltip>
        </Box>
    );
}
