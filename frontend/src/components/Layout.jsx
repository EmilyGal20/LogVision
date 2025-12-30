import {
    Drawer,
    List,
    Box,
    Typography,
    IconButton,
    Paper,
    TextField,
} from "@mui/material";
import ThemeToggle from "./ThemeToggle";
import { Link, Outlet, useLocation } from "react-router-dom";

import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import DashboardIcon from "@mui/icons-material/Dashboard";
import BugReportIcon from "@mui/icons-material/BugReport";
import SearchIcon from "@mui/icons-material/Search";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";
import WifiIcon from "@mui/icons-material/Wifi";
import MemoryIcon from "@mui/icons-material/Memory";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MenuIcon from "@mui/icons-material/Menu";

import { useState, useMemo } from "react";
import { useThemeMode } from "../context/ThemeContext";

export default function Layout() {
    const { mode } = useThemeMode();
    const location = useLocation();

    const [open, setOpen] = useState(true);
    const toggleSidebar = () => setOpen((p) => !p);

    const sidebarWidth = open ? 240 : 76;

    const pageBg = "var(--bg-main)";
    const sidebarBg =
        mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)";
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const topbarBg =
        mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.70)";

    const navItems = useMemo(
        () => [
            { label: "Dashboard", to: "/dashboard", icon: <DashboardIcon /> },
            { label: "Logs", to: "/logs", icon: <BugReportIcon /> },
            { label: "Search by IP", to: "/search", icon: <SearchIcon /> },
            { label: "Admin Panel", to: "/admin", icon: <AdminPanelSettingsIcon /> },
            { label: "Profile", to: "/profile", icon: <PersonIcon /> },
            { label: "Realtime Monitor", to: "/realtime", icon: <WifiIcon /> },
            { label: "Hardware Errors", to: "/hardware", icon: <MemoryIcon /> }, // ✅ FIX
        ],
        []
    );

    return (
        <Box sx={{ display: "flex", background: pageBg, minHeight: "100vh" }}>
            {/* ===== SIDEBAR ===== */}
            <Drawer
                variant="permanent"
                sx={{
                    width: sidebarWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: sidebarWidth,
                        background: sidebarBg,
                        backdropFilter: "blur(12px)",
                        borderRight:
                            mode === "dark"
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(150,170,200,0.35)",
                        overflowX: "hidden",
                        transition: "width 0.25s ease",
                    },
                }}
            >
                {/* LOGO + TOGGLE */}
                <Box
                    display="flex"
                    alignItems="center"
                    justifyContent={open ? "space-between" : "center"}
                    px={2}
                    py={2}
                    sx={{ gap: 1 }}
                >
                    {open ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <VisibilityIcon sx={{ color: textColor, fontSize: 26 }} />
                            <Typography sx={{ fontWeight: 900, color: textColor }}>
                                LogVision
                            </Typography>
                        </Box>
                    ) : (
                        <VisibilityIcon sx={{ color: textColor }} />
                    )}

                    <IconButton onClick={toggleSidebar} sx={{ color: textColor }}>
                        <MenuIcon />
                    </IconButton>
                </Box>

                {/* NAVIGATION */}
                <List sx={{ color: textColor, mt: 1, px: 1 }}>
                    {navItems.map((item) => {
                        const active = location.pathname === item.to;
                        return (
                            <ListItemButton
                                key={item.to}
                                component={Link}
                                to={item.to}
                                sx={{
                                    borderRadius: 2,
                                    mb: 0.7,
                                    background: active ? "var(--item-active)" : "transparent",
                                    "&:hover": { background: "var(--item-hover)" },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 42, color: textColor }}>
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.label}
                                        primaryTypographyProps={{
                                            fontWeight: active ? 900 : 650,
                                            color: textColor,
                                        }}
                                    />
                                )}
                            </ListItemButton>
                        );
                    })}
                </List>

                <Box mt="auto" p={2}>
                    <ThemeToggle />
                </Box>
            </Drawer>

            {/* ===== CONTENT AREA (TOPBAR + MAIN) ===== */}
            <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                {/* TOPBAR (Twitch-like) */}
                <Paper
                    elevation={0}
                    sx={{
                        mx: 2,
                        mt: 2,
                        mb: 2,
                        px: 2,
                        py: 1.2,
                        borderRadius: 3,
                        background: topbarBg,
                        backdropFilter: "blur(14px)",
                        border:
                            mode === "dark"
                                ? "1px solid rgba(255,255,255,0.10)"
                                : "1px solid rgba(140,160,220,0.35)",
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <Typography sx={{ fontWeight: 900, color: textColor }}>
                        Control Center
                    </Typography>

                    <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                        <Box
                            sx={{
                                width: "min(560px, 100%)",
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: 2,
                                py: 0.8,
                                borderRadius: 999,
                                background: mode === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.55)",
                                border:
                                    mode === "dark"
                                        ? "1px solid rgba(255,255,255,0.10)"
                                        : "1px solid rgba(140,160,220,0.25)",
                            }}
                        >
                            <SearchIcon sx={{ color: textColor, opacity: 0.85 }} />
                            <TextField
                                variant="standard"
                                placeholder="Search IP / Computer / Error…"
                                InputProps={{ disableUnderline: true }}
                                sx={{
                                    flex: 1,
                                    "& input": { color: textColor },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* אפשר לשים פה בעתיד התראות/פרופיל */}
                </Paper>

                {/* MAIN */}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "auto",
                        px: 2,
                        pb: 3,
                    }}
                >
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}
