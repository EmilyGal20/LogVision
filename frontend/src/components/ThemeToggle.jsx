import { IconButton } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { useThemeMode } from "../context/ThemeContext";
import { useEffect } from "react";

export default function ThemeToggle() {
    const { mode, toggleTheme } = useThemeMode();

    // making sure Dark Mode is over all of the CSS Body
    useEffect(() => {
        document.body.classList.toggle("dark-mode", mode === "dark");
    }, [mode]);

    // icon colour by CSS variables
    const iconColor = mode === "dark" ? "var(--text-primary)" : "#1f2937";

    return (
        <IconButton
            onClick={toggleTheme}
            sx={{
                background:
                    mode === "light"
                        ? "rgba(0,0,0,0.06)"
                        : "rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "6px",
                backdropFilter: "blur(6px)",
                transition: "0.2s",
                "&:hover": {
                    background:
                        mode === "light"
                            ? "rgba(0,0,0,0.12)"
                            : "rgba(255,255,255,0.15)",
                },
            }}
        >
            {mode === "light" ? (
                <DarkModeIcon sx={{ color: iconColor, fontSize: 22 }} />
            ) : (
                <LightModeIcon sx={{ color: iconColor, fontSize: 22 }} />
            )}
        </IconButton>
    );
}
