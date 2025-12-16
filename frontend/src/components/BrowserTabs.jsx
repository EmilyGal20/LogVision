import { Box, IconButton, Menu, MenuItem } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import { useState } from "react";

/* ✔️ paths תואמים ל־Routes ב־BrowserWindow */
const AVAILABLE_PAGES = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Logs", path: "/logs" },
    { label: "Search IP", path: "/search-ip" },
    { label: "Realtime IP", path: "/realtime-ip" },
    { label: "HardwareLogs", path: "/hardwareLogs" },
    { label: "Profile", path: "/profile" },
    { label: "Admin", path: "/admin-panel" },
];

export default function BrowserTabs({
    tabs,
    activeTab,
    onChange,
    onClose,
    onAdd,
}) {
    const [anchorEl, setAnchorEl] = useState(null);

    const openMenu = (e) => setAnchorEl(e.currentTarget);
    const closeMenu = () => setAnchorEl(null);

    const handleAddTab = (page) => {
        // 🧠 לא לפתוח אותו דף פעמיים
        if (!tabs.some((t) => t.path === page.path)) {
            onAdd(page);
        } else {
            onChange(window.activeTab
            );
        }
        closeMenu();
    };

    return (

        <Box
            sx={{
                display: "flex",
                alignItems: "center",
                ml: 2,

                /* ⭐ SCROLL לטאבים */
                overflowX: "auto",
                whiteSpace: "nowrap",
                maxWidth: "100%",

                /* scrollbar יפה */
                "&::-webkit-scrollbar": {
                    height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                    background: "rgba(124,58,237,.6)",
                    borderRadius: 10,
                },
            }}
        >
            {/* Existing tabs */}
            {tabs.map((tab) => {
                const active = tab.path === activeTab;

                return (
                    <Box
                        key={tab.path}
                        onClick={() => onChange(tab.path)}
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            px: 2,
                            py: "6px",
                            mr: 1,
                            borderRadius: "8px 8px 0 0",
                            cursor: "pointer",
                            fontSize: 13,
                            flexShrink: 0,

                            color: "#fff",
                            background: active
                                ? "rgba(255,255,255,0.18)"
                                : "rgba(255,255,255,0.06)",
                            transition: "0.2s",
                            "&:hover": {
                                background: "rgba(255,255,255,0.22)",
                            },
                        }}
                    >
                        {tab.label}

                        {/* ❌ Close tab */}
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClose?.(tab.path);
                            }}
                            sx={{ ml: 0.5 }}
                        >
                            <CloseIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                    </Box>
                );
            })}

            {/* ➕ Add tab */}
            <IconButton size="small" onClick={openMenu}>
                <AddIcon sx={{ fontSize: 14, color: "#c9d1d9" }} />
            </IconButton>

            {/* Add tab menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={closeMenu}
                PaperProps={{
                    sx: {
                        background: "#0d1117",
                        color: "#fff",
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.08)",
                    },
                }}
            >
                {AVAILABLE_PAGES.map((page) => (
                    <MenuItem
                        key={page.path}
                        onClick={() => handleAddTab(page)}
                        sx={{
                            fontSize: 13,
                            "&:hover": {
                                background: "rgba(124,58,237,0.15)",
                            },
                        }}
                    >
                        {page.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    );
}
