import {
    Drawer,
    List,
    Box,
    Typography,
    IconButton,
    Paper,
    TextField,
    Divider,
    Chip,
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

import LiveHardwarePanel from "./LiveHardwarePanel";

import { useMediaQuery } from "@mui/material";
import { useControlCenter } from "../context/ControlCenterContext";

import { useState, useMemo } from "react";
import { useThemeMode } from "../context/ThemeContext";

export default function Layout() {
    const { mode } = useThemeMode();
    const location = useLocation();
    const { setSelectedIP } = useControlCenter();
    const [searchIP, setSearchIP] = useState("");

    const isMobile = useMediaQuery("(max-width:900px)");

    const [open, setOpen] = useState(true);          // desktop collapse
    const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer open/close

    const toggleSidebar = () => {
        if (isMobile) setMobileOpen((p) => !p);
        else setOpen((p) => !p);
    };

    const sidebarWidth = open ? 220 : 76;

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
            { label: "Hardware Errors", to: "/hardware", icon: <MemoryIcon /> },
        ],
        []
    );

    const DrawerContent = (
        <>
            <Box
                display="flex"
                alignItems="center"
                justifyContent={isMobile ? "space-between" : open ? "space-between" : "center"}
                px={2}
                py={2}
                sx={{ gap: 1 }}
            >
                {(isMobile || open) ? (
                    <Box display="flex" alignItems="center" gap={1}>
                        <VisibilityIcon sx={{ color: textColor, fontSize: 24 }} />
                        <Typography sx={{ fontWeight: 900, color: textColor, letterSpacing: "0.06em" }}>
                            LOG VISION
                        </Typography>
                    </Box>
                ) : (
                    <VisibilityIcon sx={{ color: textColor }} />
                )}

                {!isMobile && (
                    <IconButton onClick={toggleSidebar} sx={{ color: textColor }}>
                        <MenuIcon />
                    </IconButton>
                )}
            </Box>

            <Divider sx={{ opacity: 0.4, mx: 2 }} />

            <List sx={{ color: textColor, mt: 1, px: 1 }}>
                {navItems.map((item) => {
                    const active = location.pathname === item.to;
                    return (
                        <ListItemButton
                            key={item.to}
                            component={Link}
                            to={item.to}
                            onClick={() => isMobile && setMobileOpen(false)}
                            sx={{
                                borderRadius: 3,
                                mb: 0.7,
                                background: active ? "var(--item-active)" : "transparent",
                                border: active ? "1px solid rgba(201,165,95,0.28)" : "1px solid transparent",
                                "&:hover": { background: "var(--item-hover)" },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 42, color: textColor }}>
                                {item.icon}
                            </ListItemIcon>

                            {(isMobile || open) && (
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
        </>
    );

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: `${sidebarWidth}px 1fr` },
                background: pageBg,
                height: "100vh",
                overflow: "hidden",
            }}
        >
            {!isMobile && (
                <Box
                    sx={{
                        height: "100vh",
                        backdropFilter: "blur(14px)",
                        background: sidebarBg,
                        borderRight:
                            mode === "dark"
                                ? "1px solid rgba(255,255,255,0.08)"
                                : "1px solid rgba(150,170,200,0.35)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {DrawerContent}
                </Box>
            )}

            {isMobile && (
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        "& .MuiDrawer-paper": {
                            width: "min(86vw, 320px)",
                            background: sidebarBg,
                            backdropFilter: "blur(12px)",
                            borderRight:
                                mode === "dark"
                                    ? "1px solid rgba(255,255,255,0.08)"
                                    : "1px solid rgba(150,170,200,0.35)",
                            borderTopRightRadius: 22,
                            borderBottomRightRadius: 22,
                            paddingBottom: "env(safe-area-inset-bottom)",
                        },
                    }}
                >
                    {DrawerContent}
                </Drawer>
            )}

            <Box
                className="app-scroll"
                sx={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "auto",
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        mx: { xs: 1, md: 2 },
                        mt: { xs: 1, md: 2 },
                        mb: { xs: 1, md: 1.5 },
                        px: { xs: 1.5, md: 2.5 },
                        py: { xs: 1.2, md: 1.6 },
                        borderRadius: { xs: 4, md: 5 },
                        background: topbarBg,
                        backdropFilter: "blur(16px)",
                        border:
                            mode === "dark"
                                ? "1px solid rgba(139,92,246,0.18)"
                                : "1px solid rgba(140,160,220,0.35)",
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr" },
                        gap: 1.5,
                        alignItems: "center",
                        position: "sticky",
                        top: 10,
                        zIndex: 20,
                    }}
                >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {isMobile && (
                            <IconButton
                                onClick={() => setMobileOpen(true)}
                                sx={{
                                    color: textColor,
                                    width: 40,
                                    height: 40,
                                    borderRadius: 2.5,
                                    background: mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                                    border:
                                        mode === "dark"
                                            ? "1px solid rgba(139,92,246,0.18)"
                                            : "1px solid rgba(99,102,241,0.18)",
                                }}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}

                        <Box>
                            <Typography sx={{ fontWeight: 900, color: textColor, fontSize: { xs: 18, sm: 20 }, letterSpacing: "0.08em" }}>
                                LOG VISION
                            </Typography>
                            <Typography sx={{ color: textColor, opacity: 0.7, fontSize: 12 }}>
                                Command Console
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                        <Box
                            sx={{
                                flex: 1,
                                minWidth: 200,
                                maxWidth: 520,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                px: { xs: 1.2, sm: 2 },
                                py: { xs: 0.6, sm: 0.8 },
                                borderRadius: 999,
                                background: mode === "dark" ? "rgba(0,0,0,0.30)" : "rgba(255,255,255,0.8)",
                                border:
                                    mode === "dark"
                                        ? "1px solid rgba(139,92,246,0.22)"
                                        : "1px solid rgba(140,160,220,0.25)",
                            }}
                        >
                            <SearchIcon sx={{ color: textColor, opacity: 0.85 }} />
                            <TextField
                                value={searchIP}
                                onChange={(e) => setSearchIP(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && searchIP) {
                                        setSelectedIP(searchIP);
                                    }
                                }}
                                placeholder="Search IP / Computer / Error…"
                                variant="standard"
                                InputProps={{ disableUnderline: true }}
                                sx={{ flex: 1, minWidth: 0 }}
                            />
                        </Box>
                        {!isMobile && (
                            <Chip
                                label={mode === "dark" ? "Dark Mode" : "Light Mode"}
                                sx={{ fontWeight: 800 }}
                            />
                        )}
                        {!isMobile && <ThemeToggle />}
                    </Box>
                </Paper>

                <Divider sx={{ opacity: 0.25, mx: { xs: 1, md: 2 } }} />

                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minHeight: 0,
                        overflow: "visible",
                        px: { xs: 1.25, md: 2 },
                        pb: { xs: 2.5, md: 3 },
                        background: "transparent",
                    }}
                >
                    <Box sx={{ maxWidth: 1320, mx: "auto", width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
                        <LiveHardwarePanel />
                        <Outlet />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
