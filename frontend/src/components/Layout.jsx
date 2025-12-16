import { Drawer, List, Box, Typography, IconButton } from "@mui/material";
import ThemeToggle from "./ThemeToggle";
import { Link, Outlet } from "react-router-dom";

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
import { useState } from "react";
import { useThemeMode } from "../context/ThemeContext";

export default function Layout() {
    const { mode } = useThemeMode();

    const [open, setOpen] = useState(true);
    const toggleSidebar = () => setOpen(!open);

    const sidebarWidth = open ? 240 : 70;

    const pageBg = "var(--bg-main)";
    const sidebarBg = mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.75)";

    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

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
                        borderRight: mode === "dark"
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "1px solid rgba(150,170,200,0.35)",
                        overflowX: "hidden",
                        transition: "width 0.3s ease",
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
                >
                    {open ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <VisibilityIcon sx={{ color: textColor, fontSize: 26 }} />
                            <Typography sx={{ fontWeight: "bold", color: textColor }}>
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
                <List sx={{ color: textColor, mt: 1 }}>

                    <ListItemButton component={Link} to="/">
                        <ListItemIcon><DashboardIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Dashboard" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/logs">
                        <ListItemIcon><BugReportIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Logs" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/search">
                        <ListItemIcon><SearchIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Search by IP" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/admin">
                        <ListItemIcon><AdminPanelSettingsIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Admin Panel" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/profile">
                        <ListItemIcon><PersonIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Profile" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/realtime">
                        <ListItemIcon><WifiIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Realtime Monitor" />}
                    </ListItemButton>

                    <ListItemButton component={Link} to="/hardwareLogs">
                        <ListItemIcon><MemoryIcon sx={{ color: textColor }} /></ListItemIcon>
                        {open && <ListItemText primary="Hardware Errors" />}
                    </ListItemButton>
                </List>

                <Box mt="auto" p={2}>
                    <ThemeToggle />
                </Box>
            </Drawer>

            {/* ===== MAIN CONTENT ===== */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    padding: "24px",
                    paddingRight: "50px",
                    transition: "0.3s",
                    maxWidth: "100vw",
                    overflowX: "hidden",
                    marginLeft: `40px`,
                    width: `calc(100% - ${sidebarWidth}px)`,
                    boxSizing: "border-box",
                }}
            >
                <Outlet />
            </Box>

        </Box>
    );
}
