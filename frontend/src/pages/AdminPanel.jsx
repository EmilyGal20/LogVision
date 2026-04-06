// import { useState, useEffect, useCallback } from "react";
// import {
//     Box,
//     Paper,
//     Tabs,
//     Tab,
//     Typography,
//     Button,
//     Chip,
//     Modal,
//     TextField,
//     Divider,
//     IconButton,
//     Tooltip
// } from "@mui/material";

// import {
//     RestartAlt,
//     Settings as SettingsIcon,
//     Add,
//     Edit,
//     Delete,
//     Memory,
//     Wifi,
// } from "@mui/icons-material";

// import { Bar } from "react-chartjs-2";
// import { useNavigate } from "react-router-dom";
// import { api } from "../api";
// import { useThemeMode } from "../context/ThemeContext";

// import AlertsPanel from "../components/AlertsPanel";

// const modalStyle = {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: "translate(-50%, -50%)",
//     background: "rgba(20,20,35,0.9)",
//     padding: "25px",
//     borderRadius: "16px",
//     width: "420px",
//     border: "1px solid rgba(255,255,255,0.1)",
//     backdropFilter: "blur(12px)"
// };

// export default function AdminPanel() {
//     const navigate = useNavigate();
//     const { mode } = useThemeMode();
//     const dark = mode === "dark";

//     const text = dark ? "#e5e7eb" : "#111";
//     const card = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)";

//     const [tab, setTab] = useState(0);
//     const [users, setUsers] = useState([]);
//     const [devices, setDevices] = useState([]);

//     const [openUserModal, setOpenUserModal] = useState(false);
//     const [editingUser, setEditingUser] = useState(null);

//     const loadAdmin = useCallback(async () => {
//         try {
//             const u = await api.get("/users/");
//             const d = await api.get("/devices/");

//             setUsers(u.data);
//             setDevices(d.data);

//         } catch {
//             navigate("/profile");
//         }
//     }, [navigate]);

//     useEffect(() => {
//         loadAdmin();
//     }, [loadAdmin]);



//     const cpuChart = {
//         labels: devices.map(d => d.ip),
//         datasets: [
//             {
//                 label: "CPU Temp (°C)",
//                 data: devices.map(d => d.cpu_temp),
//                 backgroundColor: "rgba(140,82,255,0.6)",
//                 borderColor: "#a855f7",
//                 borderWidth: 1,
//                 borderRadius: 6,
//             },
//         ]
//     };

//     const openAddUser = () => {
//         setEditingUser({ username: "", email: "", role: "user" });
//         setOpenUserModal(true);
//     };

//     const openEditUser = (u) => {
//         setEditingUser({ ...u });
//         setOpenUserModal(true);
//     };

//     const handleSaveUser = () => {
//         setOpenUserModal(false);
//     };

//     return (
//         <Box sx={{ width: "100%", p: 3 }}>
//             <Typography variant="h4" sx={{ color: text, fontWeight: 700, mb: 3 }}>
//                 Admin Panel
//             </Typography>

//             <Paper sx={{
//                 background: card, mb: 3, borderRadius: "14px",

//             }}>
//                 <Tabs
//                     value={tab}
//                     onChange={(e, v) => setTab(v)}
//                     centered
//                     textColor="secondary"
//                     indicatorColor="secondary"
//                 >
//                     <Tab label="Overview" />
//                     <Tab label="Users" />
//                     <Tab label="Devices" />
//                     <Tab label="Alerts" />
//                     <Tab label="Settings" />
//                 </Tabs>
//             </Paper>

//             {tab === 0 && (
//                 <Box>
//                     <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3} mb={3}>

//                         <Paper
//                             sx={{
//                                 p: 3,
//                                 borderRadius: 4,
//                                 background: card,
//                                 backdropFilter: "blur(6px)"
//                             }}
//                         >
//                             <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
//                                 System Health
//                             </Typography>

//                             <Chip
//                                 label={
//                                     devices.filter(d => d.online).length +
//                                     " / " + devices.length + " devices online"
//                                 }
//                                 color="success"
//                                 variant="filled"
//                             />
//                         </Paper>

//                         <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
//                             <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
//                                 Registered Users
//                             </Typography>
//                             <Typography sx={{ fontSize: 32, color: "#a78bfa", fontWeight: 700 }}>
//                                 {users.length}
//                             </Typography>
//                         </Paper>

//                         <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
//                             <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
//                                 Active Alerts
//                             </Typography>
//                             <Typography sx={{ fontSize: 32, color: "#fb7185", fontWeight: 700 }}>
//                                 {devices.filter(d => !d.online).length}
//                             </Typography>
//                         </Paper>
//                     </Box>

//                     <Paper sx={{ p: 3, borderRadius: 4, background: card, mb: 3 }}>
//                         <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
//                             CPU Temperature Overview
//                         </Typography>
//                         <Bar data={cpuChart} />
//                     </Paper>

//                     <AlertsPanel devices={devices} />
//                 </Box>
//             )}

//             {tab === 1 && (
//                 <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//                         <Typography variant="h6" sx={{ color: text }}>Users Management</Typography>
//                         <Button startIcon={<Add />} variant="contained" onClick={openAddUser}>
//                             Add User
//                         </Button>
//                     </Box>

//                     {users.map(u => (
//                         <Paper
//                             key={u.id}
//                             sx={{
//                                 p: 2.2,
//                                 mb: 2,
//                                 borderRadius: "12px",
//                                 background: card,
//                                 display: "flex",
//                                 justifyContent: "space-between",
//                                 alignItems: "center"
//                             }}
//                         >
//                             <Box>
//                                 <Typography sx={{ color: text, fontWeight: 600 }}>
//                                     {u.username}
//                                 </Typography>
//                                 <Typography sx={{ opacity: 0.7, color: text }}>
//                                     {u.email} — {u.role}
//                                 </Typography>
//                             </Box>

//                             <Box>
//                                 <Tooltip title="Edit User">
//                                     <IconButton onClick={() => openEditUser(u)}>
//                                         <Edit sx={{ color: "#60a5fa" }} />
//                                     </IconButton>
//                                 </Tooltip>

//                                 <Tooltip title="Delete User">
//                                     <IconButton>
//                                         <Delete sx={{ color: "#f87171" }} />
//                                     </IconButton>
//                                 </Tooltip>
//                             </Box>
//                         </Paper>
//                     ))}

//                     <Modal open={openUserModal} onClose={() => setOpenUserModal(false)}>
//                         <Box sx={modalStyle}>
//                             <Typography variant="h6" sx={{ color: text, mb: 2 }}>
//                                 {editingUser?.id ? "Edit User" : "Add New User"}
//                             </Typography>

//                             <TextField
//                                 label="Username"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={editingUser?.username}
//                                 onChange={(e) =>
//                                     setEditingUser({ ...editingUser, username: e.target.value })
//                                 }
//                             />

//                             <TextField
//                                 label="Email"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={editingUser?.email}
//                                 onChange={(e) =>
//                                     setEditingUser({ ...editingUser, email: e.target.value })
//                                 }
//                             />

//                             <TextField
//                                 label="Role"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={editingUser?.role}
//                                 onChange={(e) =>
//                                     setEditingUser({ ...editingUser, role: e.target.value })
//                                 }
//                             />

//                             <Button variant="contained" fullWidth onClick={handleSaveUser}>
//                                 Save
//                             </Button>
//                         </Box>
//                     </Modal>
//                 </Box>
//             )}

//             {tab === 2 && (
//                 <Box sx={{ maxWidth: 950, margin: "0 auto" }}>
//                     <Typography variant="h6" sx={{ color: text, mb: 2 }}>
//                         Devices Status
//                     </Typography>

//                     {devices.map(d => (
//                         <Paper
//                             key={d.ip}
//                             sx={{
//                                 p: 3,
//                                 mb: 2,
//                                 borderRadius: "14px",
//                                 background: card,
//                                 borderLeft: `6px solid ${d.online ? "#4ade80" : "#ef4444"}`,
//                             }}
//                         >
//                             <Box display="flex" justifyContent="space-between" alignItems="center">
//                                 <Box>
//                                     <Typography sx={{ color: text, fontWeight: 700 }}>
//                                         {d.ip} — {d.online ? "Online" : "Offline"}
//                                     </Typography>

//                                     {d.online && (
//                                         <Typography sx={{ mt: 1, color: text }}>
//                                             CPU: {d.cpu_temp}°C — RAM: {d.ram_used}% — GPU: {d.gpu_temp}°C
//                                         </Typography>
//                                     )}
//                                 </Box>

//                                 <Box>
//                                     <Tooltip title="Restart Device">
//                                         <IconButton>
//                                             <RestartAlt sx={{ color: "#fb7185" }} />
//                                         </IconButton>
//                                     </Tooltip>

//                                     <Tooltip title="Run Diagnostics">
//                                         <IconButton>
//                                             <Memory sx={{ color: "#38bdf8" }} />
//                                         </IconButton>
//                                     </Tooltip>

//                                     <Tooltip title="Ping Device">
//                                         <IconButton>
//                                             <Wifi sx={{ color: "#34d399" }} />
//                                         </IconButton>
//                                     </Tooltip>
//                                 </Box>
//                             </Box>
//                         </Paper>
//                     ))}
//                 </Box>
//             )}

//             {tab === 3 && (
//                 <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
//                     <AlertsPanel devices={devices} />
//                 </Box>
//             )}

//             {tab === 4 && (
//                 <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
//                     <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
//                         <Typography variant="h6" sx={{ color: text, mb: 2 }}>
//                             System Settings
//                         </Typography>

//                         <Divider sx={{ opacity: 0.2, mb: 2 }} />

//                         <Typography sx={{ color: text, mb: 1, fontWeight: 600 }}>
//                             Theme Mode
//                         </Typography>
//                         <Chip label="Dark Mode Enabled" color="secondary" />

//                         <Divider sx={{ opacity: 0.2, my: 2 }} />

//                         <Typography sx={{ color: text, mb: 1, fontWeight: 600 }}>
//                             API Keys
//                         </Typography>
//                         <Button variant="outlined" startIcon={<SettingsIcon />}>
//                             Manage Keys
//                         </Button>

//                         <Divider sx={{ opacity: 0.2, my: 2 }} />

//                         <Typography sx={{ color: text, fontWeight: 600 }}>
//                             Permissions Matrix
//                         </Typography>
//                         <Typography sx={{ opacity: 0.6, color: text }}>
//                             (Define which roles can edit, create, delete logs, devices, users…)
//                         </Typography>

//                     </Paper>
//                 </Box>
//             )}
//         </Box>
//     );
// }









import { useState, useEffect, useCallback, useMemo } from "react";
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
    Tooltip,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Stack,
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
import { api, getAuth } from "../api";
import { useThemeMode } from "../context/ThemeContext";
import usePersistentState from "../hooks/usePersistentState";

import AlertsPanel from "../components/AlertsPanel";
import { buildAlerts, defaultRules, saveAlerts } from "../utils/alertsEngine";
import { readActivity } from "../utils/activity";

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
    backdropFilter: "blur(12px)",
};

const diagModalStyle = {
    ...modalStyle,
    width: "560px",
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
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [orgs, setOrgs] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState("all");
    const [adminSearch, setAdminSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deviceStatusFilter, setDeviceStatusFilter] = useState("all");
    const [aiOrgSummary, setAiOrgSummary] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);

    const auth = getAuth();
    const role = auth?.user?.role || "user";
    const isSuperAdmin = role === "super_admin";
    const [alertRules, setAlertRules] = usePersistentState("alert-rules", defaultRules());
    const [incidentOwners, setIncidentOwners] = usePersistentState("admin-incident-owners", {});

    // ---------- Users modal ----------
    const [openUserModal, setOpenUserModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [savingUser, setSavingUser] = useState(false);

    // ---------- Delete confirm ----------
    const [confirmDelete, setConfirmDelete] = useState({ open: false, user: null });

    // ---------- Snackbar ----------
    const [snack, setSnack] = useState({ open: false, msg: "", severity: "info" });
    const openSnack = (severity, msg) => setSnack({ open: true, severity, msg });
    const closeSnack = () => setSnack((s) => ({ ...s, open: false }));

    // ---------- Device busy ----------
    const [deviceBusy, setDeviceBusy] = useState(""); // "ip:action"

    // ---------- Diagnostics modal ----------
    const [openDiagModal, setOpenDiagModal] = useState(false);
    const [diagData, setDiagData] = useState(null); // { ip, diagnostic_report, health_score }
    const [diagDevice, setDiagDevice] = useState(null); // full device (GET /devices/{ip})
    const [diagLoading, setDiagLoading] = useState(false);

    const loadAdmin = useCallback(async (orgOverride) => {
        try {
            const scopeOrgId = typeof orgOverride !== "undefined" ? orgOverride : selectedOrgId;
            const orgParam = isSuperAdmin && scopeOrgId !== "all" ? { org_id: scopeOrgId } : undefined;

            const orgReq = isSuperAdmin ? api.get("/orgs/") : api.get("/orgs/me");
            const [orgRes, u, d, l, a] = await Promise.all([
                orgReq,
                api.get("/users/", { params: orgParam || undefined }),
                api.get("/devices/", { params: orgParam || undefined }),
                api.get("/logs", { params: orgParam || undefined }),
                api.get("/alerts/", { params: orgParam || undefined }),
            ]);

            setOrgs(Array.isArray(orgRes.data) ? orgRes.data : [orgRes.data]);
            setUsers(u.data || []);
            setDevices(d.data || []);
            setLogs(l.data || []);
            setAlerts(a.data || []);
        } catch {
            navigate("/profile");
        }
    }, [navigate, selectedOrgId, isSuperAdmin]);

    useEffect(() => {
        if (!isSuperAdmin && auth?.user?.org_id) {
            setSelectedOrgId(auth.user.org_id);
        }
    }, [isSuperAdmin, auth?.user?.org_id]);

    useEffect(() => {
        loadAdmin();
    }, [loadAdmin]);

    useEffect(() => {
        setAiOrgSummary(null);
    }, [selectedOrgId]);

    const cpuChart = useMemo(() => {
        return {
            labels: devices.map((d) => d.ip),
            datasets: [
                {
                    label: "CPU Temp (°C)",
                    data: devices.map((d) => d.cpu_temp ?? 0),
                    backgroundColor: "rgba(140,82,255,0.6)",
                    borderColor: "#a855f7",
                    borderWidth: 1,
                    borderRadius: 6,
                },
            ],
        };
    }, [devices]);

    const deviceInsights = useMemo(() => {
        const offline = devices.filter((d) => d.online === false).length;
        const hotCpu = devices.filter((d) => (d.cpu_temp ?? 0) >= 85).length;
        const hotGpu = devices.filter((d) => (d.gpu_temp ?? 0) >= 80).length;
        const highRam = devices.filter((d) => (d.ram_used ?? 0) >= 85).length;
        return { offline, hotCpu, hotGpu, highRam };
    }, [devices]);

    const roleCounts = useMemo(() => {
        const counts = {};
        users.forEach((u) => {
            const key = u.role || "user";
            counts[key] = (counts[key] || 0) + 1;
        });
        return counts;
    }, [users]);

    const selectedOrg = useMemo(() => {
        const idNum = Number(selectedOrgId);
        return orgs.find((o) => o.id === idNum) || null;
    }, [orgs, selectedOrgId]);

    const searchValue = adminSearch.trim().toLowerCase();

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            if (!searchValue) return true;
            return (
                String(u.username || "").toLowerCase().includes(searchValue) ||
                String(u.full_name || "").toLowerCase().includes(searchValue) ||
                String(u.email || "").toLowerCase().includes(searchValue)
            );
        });
    }, [users, searchValue]);

    const filteredDevices = useMemo(() => {
        return devices.filter((d) => {
            if (deviceStatusFilter === "online" && d.online !== true) return false;
            if (deviceStatusFilter === "offline" && d.online !== false) return false;
            if (!searchValue) return true;
            return (
                String(d.ip || "").toLowerCase().includes(searchValue) ||
                String(d.hostname || "").toLowerCase().includes(searchValue)
            );
        });
    }, [devices, deviceStatusFilter, searchValue]);

    const filteredAlerts = useMemo(() => {
        return alerts.filter((a) => {
            if (severityFilter !== "all" && String(a.severity || "").toLowerCase() !== severityFilter) return false;
            if (!searchValue) return true;
            return (
                String(a.message || "").toLowerCase().includes(searchValue) ||
                String(a.device_ip || "").toLowerCase().includes(searchValue) ||
                String(a.type || "").toLowerCase().includes(searchValue)
            );
        });
    }, [alerts, severityFilter, searchValue]);

    const filteredLogs = useMemo(() => {
        return logs.filter((l) => {
            if (severityFilter !== "all" && String(l.severity || "").toLowerCase() !== severityFilter) return false;
            if (statusFilter !== "all" && String(l.status || "").toLowerCase() !== statusFilter) return false;
            if (!searchValue) return true;
            return (
                String(l.ip || "").toLowerCase().includes(searchValue) ||
                String(l.description || "").toLowerCase().includes(searchValue) ||
                String(l.error_type || "").toLowerCase().includes(searchValue)
            );
        });
    }, [logs, severityFilter, statusFilter, searchValue]);

    const openIncidents = useMemo(
        () => logs.filter((l) => String(l.status || "").toLowerCase() !== "resolved").length,
        [logs]
    );
    const criticalIncidents = useMemo(
        () => logs.filter((l) => String(l.severity || "").toLowerCase() === "critical").length,
        [logs]
    );
    const unackedAlerts = useMemo(
        () => alerts.filter((a) => !a.acknowledged).length,
        [alerts]
    );
    const onlineDevices = useMemo(
        () => devices.filter((d) => d.online).length,
        [devices]
    );

    const aiAdminSummary = useMemo(() => {
        const total = devices.length;
        const offline = deviceInsights.offline;
        const hot = deviceInsights.hotCpu + deviceInsights.hotGpu;
        const headline = total ? `${offline} offline · ${hot} thermal alerts` : "No device data loaded.";
        const reasons = [];
        if (offline) reasons.push("Offline devices detected.");
        if (hot) reasons.push("Thermal thresholds exceeded.");
        if (deviceInsights.highRam) reasons.push("High RAM usage detected.");
        return { headline, reasons: reasons.length ? reasons : ["No elevated risk signals detected."] };
    }, [devices.length, deviceInsights]);

    const adminAlerts = useMemo(() => buildAlerts({ logs: [], devices, rules: alertRules }), [devices, alertRules]);
    const recentActivity = useMemo(() => readActivity().slice(0, 6), [devices]);

    useEffect(() => {
        saveAlerts(adminAlerts);
    }, [adminAlerts]);

    const runAiOrgSummary = async () => {
        setAiLoading(true);
        try {
            const params = isSuperAdmin && selectedOrgId !== "all" ? { org_id: selectedOrgId } : undefined;
            const res = await api.post("/ai/summary/org", null, { params });
            setAiOrgSummary(res.data || null);
        } catch {
            setAiOrgSummary(null);
        } finally {
            setAiLoading(false);
        }
    };

    // ============================
    // USERS CRUD (based on your users.py)
    // ============================
    const openAddUser = () => {
        setEditingUser({
            username: "",
            full_name: "",
            email: "",
            role: "user",
            password: "",
        });
        setOpenUserModal(true);
    };

    const openEditUser = (u) => {
        setEditingUser({
            ...u,
            full_name: u.full_name ?? "",
            password: "", // לא שולחים update סיסמה פה
        });
        setOpenUserModal(true);
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        if (!editingUser.username?.trim()) return openSnack("error", "חסר Username");
        if (!editingUser.email?.trim()) return openSnack("error", "חסר Email");
        if (!editingUser.role?.trim()) return openSnack("error", "חסר Role");

        // CREATE דורש password אצלך
        if (!editingUser.id && !editingUser.password?.trim()) {
            return openSnack("error", "ביצירת משתמש חדש חייבים Password");
        }

        setSavingUser(true);
        try {
            if (editingUser.id) {
                // UPDATE: users.py מאפשר full_name/email/role
                const payload = {
                    full_name: editingUser.full_name ?? null,
                    email: editingUser.email ?? null,
                    role: editingUser.role ?? null,
                };

                const res = await api.put(`/users/${editingUser.id}`, payload);

                setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? res.data : u)));
                openSnack("success", "המשתמש עודכן ✅");
            } else {
                // CREATE: username/password/full_name/email/role
                const payload = {
                    username: editingUser.username,
                    password: editingUser.password,
                    full_name: editingUser.full_name || null,
                    email: editingUser.email,
                    role: editingUser.role,
                };

                const res = await api.post(`/users/`, payload);

                setUsers((prev) => [res.data, ...prev]);
                openSnack("success", "נוצר משתמש חדש ✅");
            }

            setOpenUserModal(false);
            setEditingUser(null);
        } catch (e) {
            openSnack("error", "שמירה נכשלה (בדקי הרשאות/שדות/שרת)");
        } finally {
            setSavingUser(false);
        }
    };

    const confirmDeleteUser = async () => {
        const id = confirmDelete.user?.id;
        if (!id) return;

        try {
            await api.delete(`/users/${id}`);
            setUsers((prev) => prev.filter((x) => x.id !== id));
            openSnack("success", "המשתמש נמחק ✅");
        } catch (e) {
            openSnack("error", "מחיקה נכשלה (משתמש 1 מוגן / הרשאות)");
        } finally {
            setConfirmDelete({ open: false, user: null });
        }
    };

    // ============================
    // DEVICES actions (based on your devices.py)
    // ============================
    const doRestart = async (ip) => {
        const key = `${ip}:restart`;
        setDeviceBusy(key);
        try {
            await api.post(`/devices/${ip}/restart`);
            openSnack("success", `Restart נשלח ל־${ip} ✅`);
            await loadAdmin();
        } catch {
            openSnack("error", `Restart נכשל עבור ${ip}`);
        } finally {
            setDeviceBusy("");
        }
    };

    const doPing = async (ip) => {
        const key = `${ip}:ping`;
        setDeviceBusy(key);
        try {
            const res = await api.post(`/devices/${ip}/ping`);
            const ok = !!res.data?.reachable;
            openSnack("success", `Ping ל־${ip}: ${ok ? "reachable ✅" : "offline ❌"}`);
            await loadAdmin();
        } catch {
            openSnack("error", `Ping נכשל עבור ${ip}`);
        } finally {
            setDeviceBusy("");
        }
    };

    // --- Colors by thresholds ---
    const metricTone = (type, value) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "neutral";

        // type: cpuTemp, gpuTemp, ramPct, ssdPct
        if (type === "cpuTemp") {
            if (value < 70) return "good";
            if (value < 90) return "warn";
            return "bad";
        }
        if (type === "gpuTemp") {
            if (value < 65) return "good";
            if (value < 85) return "warn";
            return "bad";
        }
        if (type === "ramPct") {
            if (value < 70) return "good";
            if (value < 90) return "warn";
            return "bad";
        }
        if (type === "ssdPct") {
            // disk_health.ssd > 50 נחשב OK אצלך
            if (value > 70) return "good";
            if (value > 50) return "warn";
            return "bad";
        }
        return "neutral";
    };

    const toneStyle = (tone) => {
        if (tone === "good") {
            return {
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.18)",
                color: dark ? "#dcfce7" : "#052e16",
            };
        }
        if (tone === "warn") {
            return {
                border: "1px solid rgba(250,204,21,0.35)",
                background: "rgba(250,204,21,0.18)",
                color: dark ? "#fef9c3" : "#422006",
            };
        }
        if (tone === "bad") {
            return {
                border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.18)",
                color: dark ? "#fee2e2" : "#450a0a",
            };
        }
        return {
            border: "1px solid rgba(148,163,184,0.25)",
            background: "rgba(148,163,184,0.12)",
            color: dark ? "#e5e7eb" : "#111",
        };
    };

    const MetricCard = ({ label, value, unit, tone }) => (
        <Paper
            sx={{
                p: 1.6,
                borderRadius: 3,
                ...toneStyle(tone),
            }}
        >
            <Typography sx={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                {value === null || value === undefined ? "—" : value}
                {unit ? <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}> {unit}</span> : null}
            </Typography>
        </Paper>
    );

    const StatusChip = ({ ok, label }) => (
        <Chip
            label={label}
            sx={{
                mr: 1,
                mb: 1,
                fontWeight: 800,
                borderRadius: "999px",
                color: ok ? "#052e16" : "#450a0a",
                background: ok ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
                border: ok ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
            }}
        />
    );

    const doDiagnostics = async (ip) => {
        const key = `${ip}:diagnostics`;
        setDeviceBusy(key);
        setDiagLoading(true);
        setOpenDiagModal(true);
        setDiagData(null);
        setDiagDevice(null);

        try {
            // diagnostics endpoint (score + report)
            const diagRes = await api.post(`/devices/${ip}/diagnostics`);

            // fetch device actual metrics for display
            const devRes = await api.get(`/devices/${ip}`);

            setDiagData(diagRes.data);
            setDiagDevice(devRes.data);
        } catch {
            openSnack("error", `Diagnostics נכשל עבור ${ip}`);
            setOpenDiagModal(false);
        } finally {
            setDeviceBusy("");
            setDiagLoading(false);
        }
    };

    // derive values for diagnostics UI
    const diagMetrics = useMemo(() => {
        const cpu = diagDevice?.cpu_temp ?? null;
        const gpu = diagDevice?.gpu_temp ?? null;
        const ram = diagDevice?.ram_used ?? null;
        const ssd = diagDevice?.disk_health?.ssd ?? null;

        return {
            cpu,
            gpu,
            ram,
            ssd,
            cpuTone: metricTone("cpuTemp", cpu),
            gpuTone: metricTone("gpuTemp", gpu),
            ramTone: metricTone("ramPct", ram),
            ssdTone: metricTone("ssdPct", ssd),
        };
    }, [diagDevice]);

    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Typography variant="h4" className="lv-hero__title" sx={{ color: text }}>
                    ADMIN CONSOLE
                </Typography>
                <Typography className="lv-hero__subtitle" sx={{ color: text }}>
                    Enterprise control plane for users, devices, and policy.
                </Typography>
            </Box>

            <Paper className="lv-panel" sx={{ background: card, p: 2.2, mb: 2 }}>
                <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1.4fr 2fr" } }}>
                    <Box sx={{ display: "grid", gap: 1.2 }}>
                        <Typography sx={{ fontWeight: 800, color: text }}>Organization Scope</Typography>
                        <FormControl size="small">
                            <InputLabel id="org-scope-label">Organization</InputLabel>
                            <Select
                                labelId="org-scope-label"
                                label="Organization"
                                value={isSuperAdmin ? selectedOrgId : auth?.user?.org_id || selectedOrgId}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setSelectedOrgId(value);
                                    loadAdmin(value);
                                }}
                                disabled={!isSuperAdmin}
                            >
                                {isSuperAdmin && <MenuItem value="all">All Organizations</MenuItem>}
                                {orgs.map((o) => (
                                    <MenuItem key={o.id} value={o.id}>
                                        {o.name} (ID {o.id})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Typography sx={{ opacity: 0.7, fontSize: 12, color: text }}>
                            {selectedOrg ? `Selected: ${selectedOrg.name}` : "Showing current organization scope."}
                        </Typography>
                    </Box>
                    <Box sx={{ display: "grid", gap: 1.2 }}>
                        <Typography sx={{ fontWeight: 800, color: text }}>Search & Filters</Typography>
                        <TextField
                            value={adminSearch}
                            onChange={(e) => setAdminSearch(e.target.value)}
                            placeholder="Search users, devices, incidents, alerts..."
                            size="small"
                            fullWidth
                        />
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel id="severity-filter-label">Severity</InputLabel>
                                <Select
                                    labelId="severity-filter-label"
                                    label="Severity"
                                    value={severityFilter}
                                    onChange={(e) => setSeverityFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="critical">Critical</MenuItem>
                                    <MenuItem value="high">High</MenuItem>
                                    <MenuItem value="medium">Medium</MenuItem>
                                    <MenuItem value="low">Low</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel id="status-filter-label">Status</InputLabel>
                                <Select
                                    labelId="status-filter-label"
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="resolved">Resolved</MenuItem>
                                    <MenuItem value="ignored">Ignored</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel id="device-filter-label">Device Status</InputLabel>
                                <Select
                                    labelId="device-filter-label"
                                    label="Device Status"
                                    value={deviceStatusFilter}
                                    onChange={(e) => setDeviceStatusFilter(e.target.value)}
                                >
                                    <MenuItem value="all">All</MenuItem>
                                    <MenuItem value="online">Online</MenuItem>
                                    <MenuItem value="offline">Offline</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </Box>
                </Box>
            </Paper>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "220px 1fr" },
                    gap: 2,
                }}
            >
                <Paper className="lv-panel" sx={{ background: card, padding: 1 }}>
                    <Tabs
                        value={tab}
                        onChange={(e, v) => setTab(v)}
                        orientation="vertical"
                        textColor="secondary"
                        indicatorColor="secondary"
                        sx={{ minHeight: 320 }}
                    >
                        <Tab label="Overview" />
                        <Tab label="Organizations" />
                        <Tab label="Incidents" />
                        <Tab label="Devices" />
                        <Tab label="Users" />
                        <Tab label="Alerts" />
                        <Tab label="Settings" />
                    </Tabs>
                </Paper>

                <Box className="lv-deck">

            {tab === 0 && (
                <Box>
                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3} mb={3}>
                        <Paper sx={{ p: 3, borderRadius: 4, background: card, backdropFilter: "blur(6px)", border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                Organization Scope
                            </Typography>
                            <Typography sx={{ fontSize: 22, color: "#a78bfa", fontWeight: 800 }}>
                                {isSuperAdmin && selectedOrgId === "all"
                                    ? "All Organizations"
                                    : (selectedOrg?.name || "Current Org")}
                            </Typography>
                            <Typography sx={{ opacity: 0.7, color: text, fontSize: 12 }}>
                                Users: {users.length} â€¢ Devices: {devices.length}
                            </Typography>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                Incident Load
                            </Typography>
                            <Typography sx={{ fontSize: 32, color: "#fb7185", fontWeight: 700 }}>
                                {openIncidents}
                            </Typography>
                            <Typography sx={{ opacity: 0.7, color: text, fontSize: 12 }}>
                                Critical: {criticalIncidents}
                            </Typography>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                                Alert Queue
                            </Typography>
                            <Typography sx={{ fontSize: 32, color: "#f97316", fontWeight: 700 }}>
                                {unackedAlerts}
                            </Typography>
                            <Typography sx={{ opacity: 0.7, color: text, fontSize: 12 }}>
                                Total alerts: {alerts.length}
                            </Typography>
                        </Paper>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 4, background: card, mb: 3, border: "1px solid rgba(201,165,95,0.16)" }}>
                        <Typography sx={{ color: text, mb: 2, fontWeight: 600 }}>
                            CPU Temperature Overview
                        </Typography>
                        <Bar data={cpuChart} />
                    </Paper>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                                AI Ops Summary
                            </Typography>
                            {aiOrgSummary ? (
                                <Box sx={{ display: "grid", gap: 0.6 }}>
                                    <Typography sx={{ fontWeight: 800 }}>{aiOrgSummary.summary}</Typography>
                                    {(aiOrgSummary.risks || []).slice(0, 3).map((r, idx) => (
                                        <Typography key={idx} sx={{ opacity: 0.75 }}>â€¢ {r}</Typography>
                                    ))}
                                    {(aiOrgSummary.recommendations || []).slice(0, 2).map((r, idx) => (
                                        <Typography key={`rec-${idx}`} sx={{ opacity: 0.75 }}>â†’ {r}</Typography>
                                    ))}
                                    {(aiOrgSummary.root_causes || []).slice(0, 2).map((r, idx) => (
                                        <Typography key={`root-${idx}`} sx={{ opacity: 0.7 }}>Possible: {r}</Typography>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ display: "grid", gap: 0.6 }}>
                                    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>{aiAdminSummary.headline}</Typography>
                                    {aiAdminSummary.reasons.map((r, idx) => (
                                        <Typography key={idx} sx={{ opacity: 0.75 }}>{r}</Typography>
                                    ))}
                                </Box>
                            )}
                            <Button
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={runAiOrgSummary}
                                disabled={aiLoading}
                            >
                                {aiLoading ? "Analyzing..." : "Generate AI Summary"}
                            </Button>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                                Device Insights
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Chip label={`Offline: ${deviceInsights.offline}`} color="error" />
                                <Chip label={`Hot CPU: ${deviceInsights.hotCpu}`} color="warning" />
                                <Chip label={`Hot GPU: ${deviceInsights.hotGpu}`} color="warning" />
                                <Chip label={`High RAM: ${deviceInsights.highRam}`} color="warning" />
                            </Box>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                                Quick Actions
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                <Button variant="outlined" onClick={() => loadAdmin()}>Refresh Data</Button>
                                <Button variant="outlined" onClick={() => navigate("/hardware")}>Hardware Logs</Button>
                                <Button variant="outlined" onClick={() => navigate("/logs")}>Incident Logs</Button>
                                <Button variant="outlined" onClick={() => navigate("/search")}>Diagnostics</Button>
                            </Box>
                        </Paper>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2, mb: 3 }}>
                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                                Alerts Overview
                            </Typography>
                            <Box sx={{ display: "grid", gap: 1 }}>
                                {alerts.length === 0 && (
                                    <Typography sx={{ opacity: 0.7, color: text }}>No active alerts.</Typography>
                                )}
                                {alerts.slice(0, 5).map((a) => (
                                    <Box key={a.id}>
                                        <Typography sx={{ fontWeight: 800, color: text }}>
                                            [{a.severity}] {a.type}
                                        </Typography>
                                        <Typography sx={{ opacity: 0.7, color: text }}>{a.message}</Typography>
                                        <Button variant="outlined" size="small" sx={{ mt: 0.5 }} onClick={() => navigate("/logs")}>
                                            Investigate
                                        </Button>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>

                        <Paper sx={{ p: 3, borderRadius: 4, background: card, border: "1px solid rgba(201,165,95,0.16)" }}>
                            <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                                Recent Activity
                            </Typography>
                            <Box sx={{ display: "grid", gap: 1 }}>
                                {recentActivity.length === 0 && (
                                    <Typography sx={{ opacity: 0.7, color: text }}>No recent activity.</Typography>
                                )}
                                {recentActivity.map((item) => (
                                    <Box key={item.id} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                                        <Typography sx={{ color: text, fontWeight: 700 }}>{item.label}</Typography>
                                        <Typography sx={{ opacity: 0.7, color: text, fontSize: 12 }}>
                                            {new Date(item.ts).toLocaleString()}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Box>

                    <Paper sx={{ p: 3, borderRadius: 4, background: card, mb: 3, border: "1px solid rgba(201,165,95,0.16)" }}>
                        <Typography sx={{ color: text, mb: 2, fontWeight: 700 }}>
                            User Roles
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                            {Object.entries(roleCounts).map(([role, count]) => (
                                <Chip key={role} label={`${role}: ${count}`} />
                            ))}
                        </Box>
                    </Paper>

                    <AlertsPanel devices={devices} />
                </Box>
            )}

            {tab === 1 && (
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 1 }}>
                            Organization Directory
                        </Typography>
                        <Typography sx={{ opacity: 0.7, color: text, mb: 2 }}>
                            Manage and inspect organization scope, ownership, and risk posture.
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Org</TableCell>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Scope</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orgs.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell>
                                            <Typography sx={{ fontWeight: 700 }}>{o.name}</Typography>
                                        </TableCell>
                                        <TableCell>{o.id}</TableCell>
                                        <TableCell>
                                            {selectedOrgId === o.id ? (
                                                <Chip label="Active Scope" color="secondary" size="small" />
                                            ) : (
                                                <Chip label="Available" size="small" />
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => {
                                                    setSelectedOrgId(o.id);
                                                    loadAdmin(o.id);
                                                }}
                                            >
                                                Focus
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 1 }}>
                            Organization Snapshot
                        </Typography>
                        <Typography sx={{ opacity: 0.7, color: text, mb: 2 }}>
                            {selectedOrg?.name || "Current organization scope"} health summary.
                        </Typography>
                        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4,1fr)" }, gap: 2 }}>
                            <Paper sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                <Typography sx={{ opacity: 0.7 }}>Incidents</Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{openIncidents}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                <Typography sx={{ opacity: 0.7 }}>Alerts</Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{unackedAlerts}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                <Typography sx={{ opacity: 0.7 }}>Devices Online</Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{onlineDevices}/{devices.length}</Typography>
                            </Paper>
                            <Paper sx={{ p: 2, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                <Typography sx={{ opacity: 0.7 }}>Users</Typography>
                                <Typography sx={{ fontSize: 22, fontWeight: 800 }}>{users.length}</Typography>
                            </Paper>
                        </Box>
                    </Paper>
                </Box>
            )}

            {tab === 2 && (
                <Box sx={{ display: "grid", gap: 2 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                            Incident & Log Intelligence
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>IP</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Owner</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredLogs.slice(0, 25).map((l) => (
                                    <TableRow key={l.id}>
                                        <TableCell>{l.ip}</TableCell>
                                        <TableCell>{l.error_type}</TableCell>
                                        <TableCell>{l.severity}</TableCell>
                                        <TableCell>{l.status}</TableCell>
                                        <TableCell>{String(l.description || "").slice(0, 60)}</TableCell>
                                        <TableCell>
                                            <FormControl size="small" fullWidth>
                                                <Select
                                                    value={incidentOwners[l.id] || ""}
                                                    displayEmpty
                                                    onChange={(e) =>
                                                        setIncidentOwners((prev) => ({
                                                            ...prev,
                                                            [l.id]: e.target.value,
                                                        }))
                                                    }
                                                >
                                                    <MenuItem value="">Unassigned</MenuItem>
                                                    {users.map((u) => (
                                                        <MenuItem key={u.id} value={u.username}>
                                                            {u.username}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => navigate(String(l.id).startsWith("json-") ? "/logs" : `/issue/${l.id}`)}
                                            >
                                                Open
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredLogs.length === 0 && (
                            <Typography sx={{ opacity: 0.7, mt: 2 }}>No incidents match the current filters.</Typography>
                        )}
                    </Paper>
                </Box>
            )}

            {tab === 4 && (
                <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" sx={{ color: text }}>
                            Users Management
                        </Typography>
                        <Button startIcon={<Add />} variant="contained" onClick={openAddUser}>
                            Add User
                        </Button>
                    </Box>

                    {filteredUsers.map((u) => (
                        <Paper
                            key={u.id}
                            sx={{
                                p: 2.2,
                                mb: 2,
                                borderRadius: "12px",
                                background: card,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Box>
                                <Typography sx={{ color: text, fontWeight: 600 }}>{u.username}</Typography>
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
                                    <IconButton onClick={() => setConfirmDelete({ open: true, user: u })}>
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
                                value={editingUser?.username ?? ""}
                                onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                            />

                            <TextField
                                label="Full Name"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={editingUser?.full_name ?? ""}
                                onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                            />

                            <TextField
                                label="Email"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={editingUser?.email ?? ""}
                                onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                            />

                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="role-select-label">Role</InputLabel>
                                <Select
                                    labelId="role-select-label"
                                    label="Role"
                                    value={editingUser?.role ?? ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <MenuItem value="viewer">viewer</MenuItem>
                                    <MenuItem value="operator">operator</MenuItem>
                                    <MenuItem value="org_admin">org_admin</MenuItem>
                                    <MenuItem value="admin">admin</MenuItem>
                                    <MenuItem value="super_admin">super_admin</MenuItem>
                                </Select>
                            </FormControl>

                            {!editingUser?.id && (
                                <TextField
                                    label="Password"
                                    type="password"
                                    fullWidth
                                    sx={{ mb: 2 }}
                                    value={editingUser?.password ?? ""}
                                    onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                                />
                            )}

                            <Button variant="contained" fullWidth onClick={handleSaveUser} disabled={savingUser}>
                                {savingUser ? "Saving..." : "Save"}
                            </Button>
                        </Box>
                    </Modal>

                    <Dialog
                        open={confirmDelete.open}
                        onClose={() => setConfirmDelete({ open: false, user: null })}
                    >
                        <DialogTitle>מחיקת משתמש</DialogTitle>
                        <DialogContent>
                            <Typography sx={{ mt: 1 }}>
                                למחוק את <b>{confirmDelete.user?.username}</b>?
                            </Typography>
                            <Typography sx={{ opacity: 0.7, mt: 1 }}>פעולה זו לא ניתנת לשחזור.</Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmDelete({ open: false, user: null })}>ביטול</Button>
                            <Button color="error" variant="contained" onClick={confirmDeleteUser}>
                                מחיקה
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Box>
            )}

            {tab === 3 && (
                <Box sx={{ maxWidth: 950, margin: "0 auto" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" sx={{ color: text }}>
                            Devices Status
                        </Typography>
                        <Button variant="outlined" onClick={() => loadAdmin()}>
                            Refresh
                        </Button>
                    </Box>

                    {filteredDevices.map((d) => (
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
                                        <span>
                                            <IconButton
                                                onClick={() => doRestart(d.ip)}
                                                disabled={!d.online || deviceBusy === `${d.ip}:restart`}
                                            >
                                                <RestartAlt sx={{ color: "#fb7185" }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Run Diagnostics">
                                        <span>
                                            <IconButton
                                                onClick={() => doDiagnostics(d.ip)}
                                                disabled={!d.online || deviceBusy === `${d.ip}:diagnostics`}
                                            >
                                                <Memory sx={{ color: "#38bdf8" }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title="Ping Device">
                                        <span>
                                            <IconButton
                                                onClick={() => doPing(d.ip)}
                                                disabled={deviceBusy === `${d.ip}:ping`}
                                            >
                                                <Wifi sx={{ color: "#34d399" }} />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        localStorage.setItem("search-ip-value", JSON.stringify(d.ip));
                                        navigate("/search");
                                    }}
                                >
                                    Diagnostics
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate("/realtime")}
                                >
                                    Realtime
                                </Button>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate("/hardware")}
                                >
                                    Hardware
                                </Button>
                            </Box>
                        </Paper>
                    ))}
                </Box>
            )}

            {tab === 5 && (
                <Box sx={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 2 }}>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                            Alerts & Escalations
                        </Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Severity</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Device/IP</TableCell>
                                    <TableCell>Message</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredAlerts.slice(0, 20).map((a) => (
                                    <TableRow key={a.id}>
                                        <TableCell>{a.severity}</TableCell>
                                        <TableCell>{a.type}</TableCell>
                                        <TableCell>{a.device_ip || "â€”"}</TableCell>
                                        <TableCell>{String(a.message || "").slice(0, 70)}</TableCell>
                                        <TableCell>{a.acknowledged ? "Acknowledged" : "Open"}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {filteredAlerts.length === 0 && (
                            <Typography sx={{ opacity: 0.7, mt: 2 }}>No alerts match the current filters.</Typography>
                        )}
                    </Paper>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                            Automated Alert Rules
                        </Typography>
                        <AlertsPanel devices={devices} />
                    </Paper>
                </Box>
            )}

            {tab === 6 && (
                <Box sx={{ maxWidth: 900, margin: "0 auto" }}>
                    <Paper sx={{ p: 3, borderRadius: 4, background: card }}>
                        <Typography variant="h6" sx={{ color: text, mb: 2 }}>
                            System Settings
                        </Typography>

                        <Divider sx={{ opacity: 0.2, mb: 2 }} />

                        <Typography sx={{ color: text, mb: 1, fontWeight: 600 }}>
                            Theme Mode
                        </Typography>
                        <Chip label={dark ? "Dark Mode Enabled" : "Light Mode Enabled"} color="secondary" />

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
            </Box>

            {/* ---------------- Diagnostics Modal ---------------- */}
            <Modal open={openDiagModal} onClose={() => setOpenDiagModal(false)}>
                <Box sx={diagModalStyle}>
                    <Typography variant="h6" sx={{ color: text, mb: 1 }}>
                        Diagnostics Report
                    </Typography>

                    <Typography sx={{ color: text, opacity: 0.85, mb: 2 }}>
                        Device: <b>{diagData?.ip ?? diagDevice?.ip ?? "..."}</b>
                    </Typography>

                    {diagLoading && (
                        <Typography sx={{ color: text, opacity: 0.8 }}>
                            Running diagnostics...
                        </Typography>
                    )}

                    {!diagLoading && (diagData || diagDevice) && (
                        <>
                            {/* Health Score */}
                            {diagData && (
                                <Paper
                                    sx={{
                                        p: 2,
                                        borderRadius: 3,
                                        background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                                        mb: 2,
                                    }}
                                >
                                    <Typography sx={{ color: text, fontWeight: 800, mb: 1 }}>
                                        Health Score
                                    </Typography>
                                    <Typography
                                        sx={{
                                            color: "#a78bfa",
                                            fontSize: 34,
                                            fontWeight: 900,
                                            lineHeight: 1,
                                        }}
                                    >
                                        {Math.round(diagData.health_score ?? 0)}%
                                    </Typography>
                                </Paper>
                            )}

                            {/* OK/FAIL chips */}
                            {diagData?.diagnostic_report && (
                                <>
                                    <Typography sx={{ color: text, fontWeight: 800, mb: 1 }}>
                                        Checks
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", mb: 1 }}>
                                        <StatusChip ok={!!diagData.diagnostic_report.cpu_ok} label="CPU OK" />
                                        <StatusChip ok={!!diagData.diagnostic_report.gpu_ok} label="GPU OK" />
                                        <StatusChip ok={!!diagData.diagnostic_report.ram_ok} label="RAM OK" />
                                        <StatusChip ok={!!diagData.diagnostic_report.storage_ok} label="Storage OK" />
                                    </Box>
                                </>
                            )}

                            <Divider sx={{ opacity: 0.2, my: 2 }} />

                            {/* Real Metrics */}
                            <Typography sx={{ color: text, fontWeight: 900, mb: 1 }}>
                                Live Metrics
                            </Typography>

                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gap: 1.5,
                                    mb: 2,
                                }}
                            >
                                <MetricCard
                                    label="CPU Temp"
                                    value={diagMetrics.cpu}
                                    unit="°C"
                                    tone={diagMetrics.cpuTone}
                                />
                                <MetricCard
                                    label="GPU Temp"
                                    value={diagMetrics.gpu}
                                    unit="°C"
                                    tone={diagMetrics.gpuTone}
                                />
                                <MetricCard
                                    label="RAM Used"
                                    value={diagMetrics.ram}
                                    unit="%"
                                    tone={diagMetrics.ramTone}
                                />
                                <MetricCard
                                    label="SSD Health"
                                    value={diagMetrics.ssd}
                                    unit="%"
                                    tone={diagMetrics.ssdTone}
                                />
                            </Box>

                            <Button variant="contained" fullWidth onClick={() => setOpenDiagModal(false)}>
                                Close
                            </Button>
                        </>
                    )}

                    {!diagLoading && !diagData && !diagDevice && (
                        <Button variant="outlined" fullWidth onClick={() => setOpenDiagModal(false)}>
                            Close
                        </Button>
                    )}
                </Box>
            </Modal>

            {/* ---------------- Snackbar ---------------- */}
            <Snackbar open={snack.open} autoHideDuration={3500} onClose={closeSnack}>
                <Alert onClose={closeSnack} severity={snack.severity} sx={{ width: "100%" }}>
                    {snack.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
