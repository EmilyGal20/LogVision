import {
    Drawer,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    IconButton,
    Box
} from "@mui/material";

import { useLocation, Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import TableViewIcon from "@mui/icons-material/TableView";
import SearchIcon from "@mui/icons-material/Search";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonIcon from "@mui/icons-material/Person";

import usePersistentState from "../hooks/usePersistentState";  // ⭐ saving־LocalStorage

export default function Sidebar() {

    // ⭐ sidebar saved automatically in localStorag under key "sidebar-open"
    const [open, setOpen] = usePersistentState("sidebar-open", true);

    const location = useLocation();
    const sidebarWidth = open ? 240 : 70;

    const items = [
        { text: "Dashboard", icon: <DashboardIcon />, link: "/" },
        { text: "Logs", icon: <TableViewIcon />, link: "/logs" },
        { text: "Search IP", icon: <SearchIcon />, link: "/search" },
        { text: "Admin Panel", icon: <AdminPanelSettingsIcon />, link: "/admin" },
        { text: "Profile", icon: <PersonIcon />, link: "/profile" }
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: sidebarWidth,
                flexShrink: 0,
                whiteSpace: "nowrap",
                transition: "width 0.3s ease",
                "& .MuiDrawer-paper": {
                    width: sidebarWidth,
                    overflowX: "hidden",
                    transition: "width 0.3s ease",
                    boxSizing: "border-box",
                    backgroundColor: "var(--sidebar-bg)",
                    borderRight: "1px solid var(--sidebar-border)",
                },
            }}
        >

            {user?.role === "admin" && (
                <ListItemButton component={Link} to="/admin">
                    <ListItemIcon><AdminPanelSettingsIcon /></ListItemIcon>
                    <ListItemText primary="Admin Panel" />
                </ListItemButton>
            )}


            {/* Toggle Button */}
            <Box sx={{ display: "flex", justifyContent: open ? "flex-end" : "center", p: 1 }}>
                <IconButton onClick={() => setOpen(!open)}>
                    <MenuIcon />
                </IconButton>
            </Box>

            {/* Navigation Items */}
            <List>
                {items.map((item) => {
                    const isActive = location.pathname === item.link;

                    return (
                        <ListItemButton
                            key={item.text}
                            component={Link}
                            to={item.link}
                            sx={{
                                px: open ? 2 : 1.5,
                                justifyContent: open ? "initial" : "center",
                                mx: open ? 1 : 0.5,
                                mb: 1,
                                borderRadius: "10px",
                                backgroundColor: isActive
                                    ? "var(--active-bg)"
                                    : "transparent",
                                "&:hover": {
                                    backgroundColor: isActive
                                        ? "var(--active-bg)"
                                        : "var(--hover-bg)"
                                }
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    minWidth: 0,
                                    mr: open ? 2 : 0,
                                    justifyContent: "center",
                                    color: isActive ? "var(--active-text)" : "var(--text-color)",
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>

                            {open && (
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        "& .MuiListItemText-primary": {
                                            color: isActive
                                                ? "var(--active-text)"
                                                : "var(--text-color)",
                                            fontWeight: isActive ? "600" : "400",
                                        }
                                    }}
                                />
                            )}
                        </ListItemButton>
                    );
                })}
            </List>
        </Drawer>
    );
}
