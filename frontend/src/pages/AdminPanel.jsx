import { useState, useEffect, useCallback } from "react";
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    Button,
    Chip,
    Modal,
    TextField,
    Divider,
    IconButton,
    Tooltip
} from "@mui/material";

import {
    RestartAlt,
    Settings as SettingsIcon,
    Add,
    Edit,
    Delete,
    Memory,
    Wifi,
} from "@mui/icons-material";

import { Bar } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useThemeMode } from "../context/ThemeContext";

import AlertsPanel from "../components/AlertsPanel";

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(20,20,35,0.9)",
    padding: "25px",
    borderRadius: "16px",
    width: "420px",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(12px)"
};

export default function AdminPanel() {
    const navigate = useNavigate();
    const { mode } = useThemeMode();
    const dark = mode === "dark";

    const text = dark ? "#e5e7eb" : "#111";
    const card = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

    const [tab, setTab] = useState(0);
    const [users, setUsers] = useState([]);
    const [devices, setDevices] = useState([]);

    const [openUserModal, setOpenUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const loadAdmin = useCallback(async () => {
        try {
            const u = await api.get("/users/");
            const d = await api.get("/devices/");

            setUsers(u.data);
            setDevices(d.data);

        } catch {
            navigate("/profile");
        }
    }, [navigate]);

    useEffect(() => {
        loadAdmin();
    }, [loadAdmin]);



    const cpuChart = {
        labels: devices.map(d => d.ip),
        datasets: [
            {
                label: "CPU Temp (°C)",
                data: devices.map(d => d.cpu_temp),
                backgroundColor: "rgba(140,82,255,0.6)",
                borderColor: "#a855f7",
                borderWidth: 1,
                borderRadius: 6,
            },
        ]
    };

    const openAddUser = () => {
        setEditingUser({ username: "", email: "", role: "user" });
        setOpenUserModal(true);
    };

    const openEditUser = (u) => {
        setEditingUser({ ...u });
        setOpenUserModal(true);
    };

    const handleSaveUser = () => {
        setOpenUserModal(false);
    };

    return (
        <Box sx={{ width: "100%", p: 3 }}>
            <Typography variant="h4" sx={{ color: text, fontWeight: 700, mb: 3 }}>
                Admin Panel
            </Typography>

            <Paper sx={{
                background: card, mb: 3, borderRadius: "14px",

            }}>
                <Tabs
                    value={tab}
                    onChange={(e, v) => setTab(v)}
                    centered
                    textColor="secondary"
                    indicatorColor="secondary"
                >
                    <Tab label="Overview" />
                    <Tab label="Users" />
                    <Tab label="Devices" />
                    <Tab label="Alerts" />
                    <Tab label="Settings" />
                </Tabs>
            </Paper>

            {tab === 0 && (
                <Box>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3} mb={3}>

                        <Paper
                            sx={{
                                p: 3,
                                borderRadius: 4,
                                background: card,
                                backdropFilter: "blur(6px)"
                            }}
                        >
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                System Health
                            </Typography>

                            <Chip
                                label={
                                    devices.filter(d => d.online).length +
                                    " / " + devices.length + " devices online"
                                }
                                color="success"
                                variant="filled"
                            />
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                Registered Users
                            </Typography>
                            <Typography sx={{ fontSize: 32, color: "#a78bfa", fontWeight: 700 }}>
                                {users.length}
                            </Typography>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                Active Alerts
                            </Typography>
                            <Typography sx={{ fontSize: 32, color: "#fb7185", fontWeight: 700 }}>
                                {devices.filter(d => !d.online).length}
                            </Typography>
                        </Paper>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 4, background: card, mb: 3 }}>
                        <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                            CPU Temperature Overview
                        </Typography>
                        <Bar data={cpuChart} />
                    </Paper>

                    <AlertsPanel devices={devices} />
                </Box>
            )}

            {tab === 1 && (
                <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" sx={{ color: text }}>Users Management</Typography>
                        <Button startIcon={<Add />} variant="contained" onClick={openAddUser}>
                            Add User
                        </Button>
                    </Box>

                    {users.map(u => (
                        <Paper
                            key={u.id}
                            sx={{
                                p: 2.2,
                                mb: 2,
                                borderRadius: "12px",
                                background: card,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                            }}
                        >
                            <Box>
                                <Typography sx={{ color: text, fontWeight: 600 }}>
                                    {u.username}
                                </Typography>
                                <Typography sx={{ opacity: 0.7, color: text }}>
                                    {u.email} — {u.role}
                                </Typography>
                            </Box>

                            <Box>
                                <Tooltip title="Edit User">
                                    <IconButton onClick={() => openEditUser(u)}>
                                        <Edit sx={{ color: "#60a5fa" }} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Delete User">
                                    <IconButton>
                                        <Delete sx={{ color: "#f87171" }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        </Paper>
                    ))}

                    <Modal open={openUserModal} onClose={() => setOpenUserModal(false)}>
                        <Box sx={modalStyle}>
                            <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                                {editingUser?.id ? "Edit User" : "Add New User"}
                            </Typography>

                            <TextField
                                label="Username"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={editingUser?.username}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, username: e.target.value })
                                }
                            />

                            <TextField
                                label="Email"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={editingUser?.email}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, email: e.target.value })
                                }
                            />

                            <TextField
                                label="Role"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={editingUser?.role}
                                onChange={(e) =>
                                    setEditingUser({ ...editingUser, role: e.target.value })
                                }
                            />

                            <Button variant="contained" fullWidth onClick={handleSaveUser}>
                                Save
                            </Button>
                        </Box>
                    </Modal>
                </Box>
            )}

            {tab === 2 && (
                <Box sx={{ maxWidth: 950, margin: "0 auto" }}>
                    <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                        Devices Status
                    </Typography>

                    {devices.map(d => (
                        <Paper
                            key={d.ip}
                            sx={{
                                p: 3,
                                mb: 2,
                                borderRadius: "14px",
                                background: card,
                                borderLeft: `6px solid ${d.online ? "#4ade80" : "#ef4444"}`,
                            }}
                        >
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box>
                                    <Typography sx={{ color: text, fontWeight: 700 }}>
                                        {d.ip} — {d.online ? "Online" : "Offline"}
                                    </Typography>

                                    {d.online && (
                                        <Typography sx={{ mt: 1, color: text }}>
                                            CPU: {d.cpu_temp}°C — RAM: {d.ram_used}% — GPU: {d.gpu_temp}°C
                                        </Typography>
                                    )}
                                </Box>

                                <Box>
                                    <Tooltip title="Restart Device">
                                        <IconButton>
                                            <RestartAlt sx={{ color: "#fb7185" }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Run Diagnostics">
                                        <IconButton>
                                            <Memory sx={{ color: "#38bdf8" }} />
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title="Ping Device">
                                        <IconButton>
                                            <Wifi sx={{ color: "#34d399" }} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            {tab === 3 && (
                <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                    <AlertsPanel devices={devices} />
                </Box>
            )}

            {tab === 4 && (
                <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                            System Settings
                        </Typography>

                        <Divider sx={{ opacity: 0.2, mb: 2 }} />

                        <Typography sx={{ color: text, mb: 1, fontWeight: 600 }}>
                            Theme Mode
                        </Typography>
                        <Chip label="Dark Mode Enabled" color="secondary" />

                        <Divider sx={{ opacity: 0.2, my: 2 }} />

                        <Typography sx={{ color: text, mb: 1, fontWeight: 600 }}>
                            API Keys
                        </Typography>
                        <Button variant="outlined" startIcon={<SettingsIcon />}>
                            Manage Keys
                        </Button>

                        <Divider sx={{ opacity: 0.2, my: 2 }} />

                        <Typography sx={{ color: text, fontWeight: 600 }}>
                            Permissions Matrix
                        </Typography>
                        <Typography sx={{ opacity: 0.6, color: text }}>
                            (Define which roles can edit, create, delete logs, devices, users…)
                        </Typography>

                    </Paper>
                </Box>
            )}
        </Box>
    );
}
