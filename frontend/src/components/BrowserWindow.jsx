
// components/BrowserWindow.jsx
import { Box, Paper, IconButton, Typography } from "@mui/material";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import { Routes, Route, Navigate } from "react-router-dom";
// import { MemoryRouter } from "react-router-dom";

import { Rnd } from "react-rnd";
// import { useEffect } from "react";

import RemoveIcon from "@mui/icons-material/Remove";
import CropSquareIcon from "@mui/icons-material/CropSquare";
import CloseIcon from "@mui/icons-material/Close";

import BrowserTabs from "./BrowserTabs";
import PageLoader from "./PageLoader";
import FakeDevTools from "./FakeDevTools";

// pages
import Dashboard from "../pages/Dashboard";
import Logs from "../pages/Logs";
import SearchIP from "../pages/SearchIP";
import RealTimeIP from "../pages/RealTimeIP";
import HardwareLogs from "../pages/HardwareLogs";
import Profile from "../pages/Profile";
import AdminPanel from "../pages/AdminPanel";

export default function BrowserWindow({
    window,
    onFocus,
    onMinimize,
    onMaximize,
    onClose,
    onMove,
    onResize,
    onTabsChange,
}) {


    const renderTab = () => {
        switch (window.activeTab) {
            case "/dashboard":
                return <Dashboard />;
            case "/logs":
                return <Logs />;
            case "/search-ip":
                return <SearchIP />;
            case "/realtime-ip":
                return <RealTimeIP />;
            case "/hardwareLogs":
                return <HardwareLogs />;
            case "/profile":
                return <Profile />;
            case "/admin-panel":
                return <AdminPanel />;
            default:
                return <Dashboard />;
        }
    };

    // const navigate = useNavigate();

    // // 🔁 סנכרון טאב → ניווט
    // useEffect(() => {
    //     if (window.activeTab) {
    //         navigate(window.activeTab, { replace: true });
    //     }
    // }, [window.activeTab, navigate]);

    return (
        <Rnd
            size={window.maximized ? undefined : window.size}
            position={window.maximized ? undefined : window.position}
            bounds="window"
            dragHandleClassName="window-titlebar"
            enableResizing={!window.maximized}
            onDragStop={(_, d) => onMove?.({ x: d.x, y: d.y })}
            onResizeStop={(_, __, ref, ___, pos) => {
                onResize?.({
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                });
                onMove?.(pos);
            }}
            style={{ zIndex: window.z }}
        >
            <Paper
                onMouseDown={onFocus}
                sx={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: window.maximized ? 0 : "18px",
                    overflow: "hidden",
                    // background: "linear-gradient(180deg, rgba(45,45,90,0.55), rgba(20,20,45,0.45))",
                    backdropFilter: "blur(18px)",
                    // border: "1px solid rgba(124,58,237,0.35)",

                }}
            >
                {/* ================= TITLE BAR ================= */}
                <Box
                    className="window-titlebar"
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1,
                        py: 0.5,
                        cursor: "move",
                        userSelect: "none",
                    }}
                >
                    <IconButton size="small" onClick={onMinimize}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                    </IconButton>

                    <IconButton size="small" onClick={onMaximize}>
                        <CropSquareIcon sx={{ fontSize: 14 }} />
                    </IconButton>

                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose?.();
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>

                    <Typography sx={{ ml: 1, fontSize: 12, opacity: 0.7 }}>
                        logvision://{window.activeTab?.replace("/", "")}
                    </Typography>

                    <BrowserTabs
                        tabs={window.tabs}
                        activeTab={window.activeTab}
                        onChange={(path) =>
                            onTabsChange((w) => ({ activeTab: path }))
                        }
                        onAdd={(page) =>
                            onTabsChange((w) => ({
                                tabs: [...w.tabs, page],
                                activeTab: page.path,
                            }))
                        }

                        onClose={(path) =>
                            onTabsChange((w) => {
                                const newTabs = w.tabs.filter(t => t.path !== path);

                                // אם סגרנו את הטאב הפעיל – נעבור לאחר
                                let newActive = w.activeTab;
                                if (w.activeTab === path) {
                                    newActive = newTabs.length
                                        ? newTabs[newTabs.length - 1].path
                                        : "/dashboard";
                                }

                                return {
                                    tabs: newTabs,
                                    activeTab: newActive,
                                };
                            })
                        }
                    />
                </Box>

                {/* ================= CONTENT ================= */}
                <Box
                    sx={{
                        flex: 1,
                        overflow: "auto",
                        px: 3,
                        py: 2,
                        // background: "transparent",   // ✅ זה הכול
                    }}
                >

                    {/* <PageLoader>
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/logs" element={<Logs />} />
                            <Route path="/search-ip" element={<SearchIP />} />
                            <Route path="/realtime-ip" element={<RealTimeIP />} />
                            <Route path="/hardwareLogs" element={<HardwareLogs />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/admin-panel" element={<AdminPanel />} />
                        </Routes>
                    </PageLoader> */}

                    <PageLoader>
                        {renderTab()}
                    </PageLoader>


                </Box>

                <FakeDevTools />
            </Paper>
        </Rnd>
    );
}
