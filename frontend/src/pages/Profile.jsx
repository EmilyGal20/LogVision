// import { useState, useEffect } from "react";
// import {
//     Paper,
//     Typography,
//     Box,
//     Button,
//     TextField,
//     Modal,
//     ToggleButton,
//     ToggleButtonGroup,
//     Alert,
// } from "@mui/material";

// import usePersistentState from "../hooks/usePersistentState";
// import { api } from "../api";
// import { Link } from "react-router-dom";

// export default function Profile() {
//     const [user, setUser] = usePersistentState("logged-user", null);

//     const [open, setOpen] = useState(false);

//     // mode: "login" | "register"
//     const [authMode, setAuthMode] = useState("login");

//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");

//     // Register-only fields
//     const [fullName, setFullName] = useState("");
//     const [email, setEmail] = useState("");

//     const [loading, setLoading] = useState(false);
//     const [msg, setMsg] = useState({ type: "", text: "" }); // {type:"error"|"success", text:""}

//     const resetForm = () => {
//         setUsername("");
//         setPassword("");
//         setFullName("");
//         setEmail("");
//         setMsg({ type: "", text: "" });
//     };

//     const handleOpen = () => setOpen(true);

//     // ✅ תיקון קטן: כשהמודאל נסגר — לנקות שדות ולהחזיר למצב login
//     const handleClose = () => {
//         setOpen(false);
//         setAuthMode("login");
//         resetForm();
//     };

//     // =====================================================
//     // 🟣 Load user from localStorage auth
//     // =====================================================
//     useEffect(() => {
//         const saved = localStorage.getItem("auth");
//         if (saved) {
//             const parsed = JSON.parse(saved);
//             setUser(parsed.user);
//             api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
//         }
//     }, [setUser]);


//     const applyAuth = ({ user, token }) => {
//         localStorage.setItem("auth", JSON.stringify({ user, token }));
//         setUser(user);

//         // הכי חשוב: לשים גם defaults וגם header קבוע ל-instance
//         api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//     };

//     // =====================================================
//     // 🔐 LOGIN  (FIXED: no params, always uses state)
//     // =====================================================
//     const handleLogin = async () => {
//         setLoading(true);
//         setMsg({ type: "", text: "" });

//         try {
//             const res = await api.post(
//                 "/auth/login",
//                 { username: username.trim(), password },
//                 { headers: { "Content-Type": "application/json" } }
//             );

//             const { user, token } = res.data;
//             // localStorage.setItem("auth", JSON.stringify({ user, token }));


//             // setUser(user);
//             // api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//             applyAuth({ user, token });

//             setMsg({ type: "success", text: "✅ Logged in successfully!" });

//             setTimeout(() => {
//                 handleClose();
//             }, 500);
//         } catch (err) {
//             console.error("LOGIN ERROR:", err.response?.data);
//             setMsg({
//                 type: "error",
//                 text:
//                     "Login failed: " +
//                     (err.response?.data?.detail || err.response?.data || err.message),
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // =====================================================
//     // 🆕 REGISTER (Create account) + Auto Login
//     // =====================================================
//     const handleRegister = async () => {
//         setLoading(true);
//         setMsg({ type: "", text: "" });

//         try {
//             const payload = {
//                 username: username.trim(),
//                 password,
//                 ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
//                 ...(email.trim() ? { email: email.trim() } : {}),
//             };

//             await api.post("/auth/register", payload, {
//                 headers: { "Content-Type": "application/json" },
//             });

//             // auto login
//             // await handleLogin(payload.username, password);
//             await handleLogin();

//             setMsg({ type: "success", text: "✅ Account created + logged in!" });
//         } catch (err) {
//             const data = err.response?.data;
//             const detail =
//                 typeof data?.detail === "string"
//                     ? data.detail
//                     : Array.isArray(data?.detail)
//                         ? data.detail.map(d => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
//                         : JSON.stringify(data || err.message);

//             setMsg({ type: "error", text: "Register failed: " + detail });
//         } finally {
//             setLoading(false);
//         }
//     };


//     // =====================================================
//     // 🔓 LOGOUT
//     // =====================================================
//     const handleLogout = () => {
//         localStorage.removeItem("auth");
//         setUser(null);
//         delete api.defaults.headers.common["Authorization"];
//     };

//     // ✅ Switch account: פותח מודאל נקי
//     const openAuthModal = () => {
//         setAuthMode("login");
//         resetForm();
//         handleOpen();
//     };

//     // =====================================================
//     //  UI
//     // =====================================================
//     return (
//         <Box>
//             <Typography variant="h4" mb={3} fontWeight="bold">
//                 My Profile
//             </Typography>

//             {/* 🟣 LOGIN ALWAYS AVAILABLE */}
//             <Button variant="contained" sx={{ mb: 2 }} onClick={openAuthModal}>
//                 {user ? "Switch Account" : "Login / Create Account"}
//             </Button>

//             {/* 🟢 Admin Connected Notification */}
//             {user?.role === "admin" && (
//                 <Typography sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
//                     ✅ Admin is connected
//                 </Typography>
//             )}

//             {/* 🧑‍💻 PROFILE INFO */}
//             {user && (
//                 <Paper sx={{ padding: 3, maxWidth: 340 }}>
//                     <p>
//                         <b>Username:</b> {user.username}
//                     </p>
//                     <p>
//                         <b>Full Name:</b> {user.full_name}
//                     </p>
//                     <p>
//                         <b>Role:</b> {user.role}
//                     </p>

//                     <Button
//                         variant="outlined"
//                         color="error"
//                         sx={{ mt: 2 }}
//                         onClick={handleLogout}
//                     >
//                         Logout
//                     </Button>

//                     {/* 🛠 Admin Tools */}
//                     {user.role === "admin" && (
//                         <Box sx={{ mt: 3 }}>
//                             <Typography variant="h6" fontWeight="bold">
//                                 Admin Tools
//                             </Typography>

//                             <Button variant="contained" sx={{ mt: 1 }} component={Link} to="/admin">
//                                 Go to Admin Panel
//                             </Button>
//                         </Box>
//                     )}
//                 </Paper>
//             )}

//             {/* =====================================================
//           🔐 LOGIN/REGISTER MODAL
//       ===================================================== */}
//             <Modal open={open} onClose={handleClose}>
//                 <Box
//                     sx={{
//                         position: "absolute",
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         width: { xs: "92vw", sm: 380 },
//                         bgcolor: "background.paper",
//                         borderRadius: 2,
//                         boxShadow: 24,
//                         p: 3,
//                     }}
//                 >
//                     <Typography variant="h6" mb={2}>
//                         {authMode === "login" ? "Login" : "Create Account"}
//                     </Typography>

//                     <ToggleButtonGroup
//                         value={authMode}
//                         exclusive
//                         onChange={(_, v) => {
//                             if (!v) return;
//                             setAuthMode(v);
//                             setMsg({ type: "", text: "" });
//                         }}
//                         sx={{ mb: 2 }}
//                         fullWidth
//                     >
//                         <ToggleButton value="login">Login</ToggleButton>
//                         <ToggleButton value="register">Create</ToggleButton>
//                     </ToggleButtonGroup>

//                     {msg.text && (
//                         <Alert severity={msg.type === "error" ? "error" : "success"} sx={{ mb: 2 }}>
//                             {msg.text}
//                         </Alert>
//                     )}

//                     {/* shared fields */}
//                     <TextField
//                         label="Username"
//                         fullWidth
//                         sx={{ mb: 2 }}
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                     />

//                     <TextField
//                         label="Password"
//                         type="password"
//                         fullWidth
//                         sx={{ mb: 2 }}
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />

//                     {/* register-only fields */}
//                     {authMode === "register" && (
//                         <>
//                             <TextField
//                                 label="Full name"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={fullName}
//                                 onChange={(e) => setFullName(e.target.value)}
//                             />
//                             <TextField
//                                 label="Email (optional)"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                         </>
//                     )}

//                     <Button
//                         variant="contained"
//                         fullWidth
//                         sx={{ mb: 1 }}
//                         disabled={loading || !username.trim() || !password}
//                         onClick={authMode === "login" ? handleLogin : handleRegister}
//                     >
//                         {loading ? "Please wait…" : authMode === "login" ? "Login" : "Create Account"}
//                     </Button>

//                     <Button fullWidth onClick={handleClose}>
//                         Cancel
//                     </Button>
//                 </Box>
//             </Modal>
//         </Box>
//     );
// }


// ---------------------------------------------------------------------------------------------------------------------------------------


// import { useState, useEffect, useCallback } from "react";
// import {
//     Paper,
//     Typography,
//     Box,
//     Button,
//     TextField,
//     Modal,
//     ToggleButton,
//     ToggleButtonGroup,
//     Alert,
// } from "@mui/material";

// import usePersistentState from "../hooks/usePersistentState";
// // import { api } from "../api";
// import { api, setAuth, clearAuth, getAuth } from "../api";

// import { Link, useNavigate, useLocation } from "react-router-dom";

// export default function Profile() {
//     const [user, setUser] = usePersistentState("logged-user", null);

//     const [open, setOpen] = useState(false);
//     const navigate = useNavigate();
//     const location = useLocation();

//     // mode: "login" | "register"
//     const [authMode, setAuthMode] = useState("login");

//     const [username, setUsername] = useState("");
//     const [password, setPassword] = useState("");

//     // Register-only fields
//     const [fullName, setFullName] = useState("");
//     const [email, setEmail] = useState("");

//     const [loading, setLoading] = useState(false);
//     const [msg, setMsg] = useState({ type: "", text: "" }); // {type:"error"|"success", text:""}

//     const resetForm = useCallback(() => {
//         setUsername("");
//         setPassword("");
//         setFullName("");
//         setEmail("");
//         setMsg({ type: "", text: "" });
//     }, []);

//     const handleOpen = () => setOpen(true);

//     const handleClose = () => {
//         setOpen(false);
//         setAuthMode("login");
//         resetForm();
//     };

//     // =====================================================
//     // ✅ Apply/Clear Auth (single source of truth)
//     // =====================================================

//     const goNextAfterAuth = useCallback(() => {
//         const params = new URLSearchParams(location.search);
//         const next = params.get("next");

//         // הגנה בסיסית: לא לתת redirect לכתובת חיצונית
//         if (next && next.startsWith("/")) {
//             navigate(next, { replace: true });
//         } else {
//             navigate("/dashboard", { replace: true });
//         }
//     }, [location.search, navigate]);

//     const applyAuth = useCallback(
//         ({ user, token }) => {
//             localStorage.setItem("auth", JSON.stringify({ user, token }));
//             setUser(user);
//             api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
//         },
//         [setUser]
//     );

//     const clearAuth = useCallback(() => {
//         localStorage.removeItem("auth");
//         setUser(null);
//         delete api.defaults.headers.common["Authorization"];
//     }, [setUser]);

//     // =====================================================
//     // 🟣 Load user from localStorage auth on mount
//     // =====================================================
//     useEffect(() => {
//         const saved = localStorage.getItem("auth");
//         if (!saved) return;

//         try {
//             const parsed = JSON.parse(saved);
//             if (parsed?.user) setUser(parsed.user);
//             if (parsed?.token) {
//                 api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
//             }
//         } catch {
//             // אם משהו נשבר ב-localStorage — ננקה
//             clearAuth();
//         }
//     }, [setUser, clearAuth]);

//     // =====================================================
//     // 🔐 LOGIN
//     // =====================================================
//     const handleLogin = async () => {
//         setLoading(true);
//         setMsg({ type: "", text: "" });

//         try {
//             const res = await api.post(
//                 "/auth/login",
//                 { username: username.trim(), password },
//                 { headers: { "Content-Type": "application/json" } }
//             );

//             const { user, token } = res.data;
//             applyAuth({ user, token });

//             setMsg({ type: "success", text: "✅ Logged in successfully!" });

//             setTimeout(() => {
//                 handleClose();
//                 goNextAfterAuth(); // ✅ חוזר לדף המקורי
//             }, 400);
//         } catch (err) {
//             console.error("LOGIN ERROR:", err?.response?.data || err);
//             setMsg({
//                 type: "error",
//                 text:
//                     "Login failed: " +
//                     (err?.response?.data?.detail ||
//                         err?.response?.data ||
//                         err?.message ||
//                         "Unknown error"),
//             });
//         } finally {
//             setLoading(false);
//         }
//     };

//     // =====================================================
//     // 🆕 REGISTER + Auto Login
//     // =====================================================
//     const handleRegister = async () => {
//         setLoading(true);
//         setMsg({ type: "", text: "" });

//         try {
//             const payload = {
//                 username: username.trim(),
//                 password,
//                 ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
//                 ...(email.trim() ? { email: email.trim() } : {}),
//             };

//             await api.post("/auth/register", payload, {
//                 headers: { "Content-Type": "application/json" },
//             });

//             // Auto login (using the same inputs)
//             await handleLogin();
//             // אל תשימי פה msg success נוסף כדי לא לדרוס את הודעת ה-login
//         } catch (err) {
//             const data = err?.response?.data;
//             const detail =
//                 typeof data?.detail === "string"
//                     ? data.detail
//                     : Array.isArray(data?.detail)
//                         ? data.detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
//                         : JSON.stringify(data || err?.message);

//             setMsg({ type: "error", text: "Register failed: " + detail });
//             setLoading(false);
//         }
//     };

//     // =====================================================
//     // 🔓 LOGOUT
//     // =====================================================
//     const handleLogout = () => {
//         clearAuth();
//     };

//     // ✅ Switch account: open clean modal
//     const openAuthModal = () => {
//         setAuthMode("login");
//         resetForm();
//         handleOpen();
//     };

//     // =====================================================
//     //  UI
//     // =====================================================
//     return (
//         <Box>
//             <Typography variant="h4" mb={3} fontWeight="bold">
//                 My Profile
//             </Typography>

//             <Button variant="contained" sx={{ mb: 2 }} onClick={openAuthModal}>
//                 {user ? "Switch Account" : "Login / Create Account"}
//             </Button>

//             {user?.role === "admin" && (
//                 <Typography sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
//                     ✅ Admin is connected
//                 </Typography>
//             )}

//             {user && (
//                 <Paper sx={{ padding: 3, maxWidth: 340 }}>
//                     <p>
//                         <b>Username:</b> {user.username}
//                     </p>
//                     <p>
//                         <b>Full Name:</b> {user.full_name || "-"}
//                     </p>
//                     <p>
//                         <b>Role:</b> {user.role}
//                     </p>

//                     <Button
//                         variant="outlined"
//                         color="error"
//                         sx={{ mt: 2 }}
//                         onClick={handleLogout}
//                     >
//                         Logout
//                     </Button>

//                     {user.role === "admin" && (
//                         <Box sx={{ mt: 3 }}>
//                             <Typography variant="h6" fontWeight="bold">
//                                 Admin Tools
//                             </Typography>

//                             <Button
//                                 variant="contained"
//                                 sx={{ mt: 1 }}
//                                 component={Link}
//                                 to="/admin"
//                             >
//                                 Go to Admin Panel
//                             </Button>
//                         </Box>
//                     )}
//                 </Paper>
//             )}

//             {/* 🔐 LOGIN/REGISTER MODAL */}
//             <Modal open={open} onClose={handleClose}>
//                 <Box
//                     sx={{
//                         position: "absolute",
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         width: { xs: "92vw", sm: 380 },
//                         bgcolor: "background.paper",
//                         borderRadius: 2,
//                         boxShadow: 24,
//                         p: 3,
//                     }}
//                 >
//                     <Typography variant="h6" mb={2}>
//                         {authMode === "login" ? "Login" : "Create Account"}
//                     </Typography>

//                     <ToggleButtonGroup
//                         value={authMode}
//                         exclusive
//                         onChange={(_, v) => {
//                             if (!v) return;
//                             setAuthMode(v);
//                             setMsg({ type: "", text: "" });
//                         }}
//                         sx={{ mb: 2 }}
//                         fullWidth
//                     >
//                         <ToggleButton value="login">Login</ToggleButton>
//                         <ToggleButton value="register">Create</ToggleButton>
//                     </ToggleButtonGroup>

//                     {msg.text && (
//                         <Alert
//                             severity={msg.type === "error" ? "error" : "success"}
//                             sx={{ mb: 2 }}
//                         >
//                             {msg.text}
//                         </Alert>
//                     )}

//                     <TextField
//                         label="Username"
//                         fullWidth
//                         sx={{ mb: 2 }}
//                         value={username}
//                         onChange={(e) => setUsername(e.target.value)}
//                     />

//                     <TextField
//                         label="Password"
//                         type="password"
//                         fullWidth
//                         sx={{ mb: 2 }}
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />

//                     {authMode === "register" && (
//                         <>
//                             <TextField
//                                 label="Full name"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={fullName}
//                                 onChange={(e) => setFullName(e.target.value)}
//                             />
//                             <TextField
//                                 label="Email (optional)"
//                                 fullWidth
//                                 sx={{ mb: 2 }}
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                             />
//                         </>
//                     )}

//                     <Button
//                         variant="contained"
//                         fullWidth
//                         sx={{ mb: 1 }}
//                         disabled={loading || !username.trim() || !password}
//                         onClick={authMode === "login" ? handleLogin : handleRegister}
//                     >
//                         {loading
//                             ? "Please wait…"
//                             : authMode === "login"
//                                 ? "Login"
//                                 : "Create Account"}
//                     </Button>

//                     <Button fullWidth onClick={handleClose}>
//                         Cancel
//                     </Button>
//                 </Box>
//             </Modal>
//         </Box>
//     );
// }


// -----------------------------------------------------------------------------------------------------------------------------------------

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    Modal,
    ToggleButton,
    ToggleButtonGroup,
    Alert,
    Chip,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Divider,
} from "@mui/material";

import usePersistentState from "../hooks/usePersistentState";
import { api, setAuth, clearAuth, getAuth } from "../api";

import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Profile() {
    const [user, setUser] = usePersistentState("logged-user", null);

    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // mode: "login" | "register"
    const [authMode, setAuthMode] = useState("login");

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // Register-only fields
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [orgName, setOrgName] = useState("");

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });
    const [tasks, setTasks] = useState([]);
    const [taskLogs, setTaskLogs] = useState([]);
    const [adminUsers, setAdminUsers] = useState([]);
    const [adminOrgs, setAdminOrgs] = useState([]);
    const [assignLogId, setAssignLogId] = useState("");
    const [assignType, setAssignType] = useState("user");
    const [assignValue, setAssignValue] = useState("");
    const [assignBusy, setAssignBusy] = useState(false);

    const resetForm = useCallback(() => {
        setUsername("");
        setPassword("");
        setFullName("");
        setEmail("");
        setOrgName("");
        setMsg({ type: "", text: "" });
    }, []);

    const handleOpen = () => setOpen(true);

    const handleClose = useCallback(() => {
        setOpen(false);
        setAuthMode("login");
        resetForm();
    }, [resetForm]);

    // ✅ after login: go back to ?next=... or default
    const goNextAfterAuth = useCallback(() => {
        const params = new URLSearchParams(location.search);
        const next = params.get("next");

        // security: allow only internal paths
        if (next && next.startsWith("/")) {
            navigate(next, { replace: true });
        } else {
            navigate("/dashboard", { replace: true });
        }
    }, [location.search, navigate]);

    // =====================================================
    // 🟣 Load user from auth on mount (auth source = api.js helpers)
    // =====================================================
    useEffect(() => {
        const auth = getAuth(); // { user, token } or null
        if (auth?.user) setUser(auth.user);
        // לא צריך לשים Authorization פה — api.js כבר מטפל בזה
    }, [setUser]);

    const loadTaskData = useCallback(async () => {
        if (!user) {
            setTasks([]);
            setTaskLogs([]);
            return;
        }
        try {
            const [taskRes, logRes] = await Promise.all([
                api.get("/tasks"),
                api.get("/logs"),
            ]);
            setTasks(Array.isArray(taskRes.data) ? taskRes.data : []);
            setTaskLogs(Array.isArray(logRes.data) ? logRes.data : []);
        } catch {
            setTasks([]);
            setTaskLogs([]);
        }
    }, [user]);

    useEffect(() => {
        loadTaskData();
    }, [loadTaskData]);

    // =====================================================
    // 🔐 LOGIN
    // =====================================================
    const handleLogin = async () => {
        setLoading(true);
        setMsg({ type: "", text: "" });

        try {
            const res = await api.post(
                "/auth/login",
                { username: username.trim(), password },
                { headers: { "Content-Type": "application/json" } }
            );

            const { user: u, token } = res.data;

            // ✅ single source of truth
            setAuth({ user: u, token });
            setUser(u);

            setMsg({ type: "success", text: "✅ Logged in successfully!" });

            setTimeout(() => {
                handleClose();
                goNextAfterAuth();
            }, 400);
        } catch (err) {
            console.error("LOGIN ERROR:", err?.response?.data || err);
            setMsg({
                type: "error",
                text:
                    "Login failed: " +
                    (err?.response?.data?.detail ||
                        err?.response?.data ||
                        err?.message ||
                        "Unknown error"),
            });
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // 🆕 REGISTER + Auto Login
    // =====================================================
    const handleRegister = async () => {
        setLoading(true);
        setMsg({ type: "", text: "" });

        try {
            const payload = {
                username: username.trim(),
                password,
                ...(fullName.trim() ? { full_name: fullName.trim() } : {}),
                ...(email.trim() ? { email: email.trim() } : {}),
                ...(orgName.trim() ? { org_name: orgName.trim() } : {}),
            };

            await api.post("/auth/register", payload, {
                headers: { "Content-Type": "application/json" },
            });

            // ✅ auto-login with same creds
            await handleLogin();
        } catch (err) {
            const data = err?.response?.data;
            const detail =
                typeof data?.detail === "string"
                    ? data.detail
                    : Array.isArray(data?.detail)
                        ? data.detail.map((d) => `${d.loc?.join(".")}: ${d.msg}`).join(" | ")
                        : JSON.stringify(data || err?.message);

            setMsg({ type: "error", text: "Register failed: " + detail });
            setLoading(false);
        }
    };

    // =====================================================
    // 🔓 LOGOUT
    // =====================================================
    const handleLogout = () => {
        clearAuth(); // from api.js
        setUser(null); // UI state
        navigate("/profile", { replace: true });
    };

    const isAdmin = ["admin", "org_admin", "super_admin"].includes(user?.role);

    useEffect(() => {
        let mounted = true;
        const loadAdminLists = async () => {
            if (!isAdmin) {
                setAdminUsers([]);
                setAdminOrgs([]);
                return;
            }
            try {
                const [usersRes, orgsRes] = await Promise.all([
                    api.get("/users/"),
                    user?.role === "super_admin" ? api.get("/orgs/") : api.get("/orgs/me"),
                ]);
                if (!mounted) return;
                setAdminUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
                if (Array.isArray(orgsRes.data)) {
                    setAdminOrgs(orgsRes.data);
                } else if (orgsRes.data) {
                    setAdminOrgs([orgsRes.data]);
                } else {
                    setAdminOrgs([]);
                }
            } catch {
                if (mounted) {
                    setAdminUsers([]);
                    setAdminOrgs([]);
                }
            }
        };
        loadAdminLists();
        return () => {
            mounted = false;
        };
    }, [isAdmin, user?.role]);

    const logsById = useMemo(() => {
        const map = {};
        taskLogs.forEach((log) => {
            map[log.id] = log;
        });
        return map;
    }, [taskLogs]);

    const myTasks = useMemo(() => {
        if (!user) return [];
        const orgId = user.org_id;
        const username = user.username;
        return tasks.filter((t) => {
            if (t.assigned_type === "user" && String(t.assigned_user) === String(username)) return true;
            if (t.assigned_type === "org" && String(t.assigned_org) === String(orgId)) return true;
            return false;
        });
    }, [tasks, user]);

    const taskStats = useMemo(() => {
        const critical = myTasks.filter((t) => String(t.severity || "").toLowerCase() === "critical").length;
        const open = myTasks.filter((t) => String(t.status || "").toLowerCase() !== "resolved").length;
        return { total: myTasks.length, critical, open };
    }, [myTasks]);

    useEffect(() => {
        if (!assignLogId && taskLogs.length) {
            setAssignLogId(String(taskLogs[0].id));
        }
    }, [assignLogId, taskLogs]);

    useEffect(() => {
        if (assignType === "user") {
            setAssignValue(adminUsers[0]?.username || "");
        } else if (assignType === "org") {
            setAssignValue(adminOrgs[0]?.id ? String(adminOrgs[0].id) : "");
        } else {
            setAssignValue("");
        }
    }, [assignType, adminUsers, adminOrgs]);

    const handleAssignTask = async () => {
        if (!assignLogId) return;
        setAssignBusy(true);
        try {
            await api.post("/tasks/assign", {
                log_id: Number(assignLogId),
                assignee_type: assignType,
                assignee_value: assignType === "none" ? null : (assignValue || null),
            });
            await loadTaskData();
        } catch {
            // ignore
        } finally {
            setAssignBusy(false);
        }
    };

    // ✅ Switch account: open clean modal
    const openAuthModal = () => {
        setAuthMode("login");
        resetForm();
        handleOpen();
    };

    // =====================================================
    // UI
    // =====================================================
    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Box>
                    <Typography variant="h4" className="lv-hero__title">
                        ACCESS WORKSPACE
                    </Typography>
                    <Typography className="lv-hero__subtitle">
                        Account security, session status, and admin tools.
                    </Typography>
                </Box>
                <Button variant="contained" onClick={openAuthModal}>
                    {user ? "Switch Account" : "Login / Create Account"}
                </Button>
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                        Access Status
                    </Typography>
                    <Typography sx={{ opacity: 0.7, mb: 2 }}>
                        Login state and account role.
                    </Typography>
                    {isAdmin && (
                        <Typography sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                            ✅ Admin is connected
                        </Typography>
                    )}
                    {!user && (
                        <Typography sx={{ opacity: 0.8 }}>
                            No active session. Use the button above to authenticate.
                        </Typography>
                    )}
                </Paper>

                {user && (
                    <Paper className="lv-panel">
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>
                            Profile Details
                        </Typography>
                        <p>
                            <b>Username:</b> {user.username}
                        </p>
                        <p>
                            <b>Full Name:</b> {user.full_name || "-"}
                        </p>
                        <p>
                            <b>Role:</b> {user.role}
                        </p>
                        <p>
                            <b>Organization:</b> {user.org_id || "-"}
                        </p>

                        <Button
                            variant="outlined"
                            color="error"
                            sx={{ mt: 2 }}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>

                        {isAdmin && (
                            <Box sx={{ mt: 3 }}>
                                <Typography variant="h6" fontWeight="bold">
                                    Admin Tools
                                </Typography>

                                <Button
                                    variant="contained"
                                    sx={{ mt: 1 }}
                                    component={Link}
                                    to="/admin"
                                >
                                    Go to Admin Panel
                                </Button>
                            </Box>
                        )}
                    </Paper>
                )}
            </Box>

            {user && (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" }, gap: 2, mt: 2 }}>
                    <Paper className="lv-panel">
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                            My Tasks / Incidents
                        </Typography>
                        <Typography sx={{ opacity: 0.7, mb: 2 }}>
                            Assigned incidents for your organization or user account.
                        </Typography>
                        {myTasks.length === 0 && (
                            <Typography sx={{ opacity: 0.7 }}>
                                No assigned incidents yet.
                            </Typography>
                        )}
                        {myTasks.slice(0, 8).map((t) => {
                            const log = logsById[t.log_id] || {};
                            const slaTone =
                                t.sla_status === "overdue"
                                    ? "error"
                                    : t.sla_status === "due_soon"
                                        ? "warning"
                                        : t.sla_status
                                            ? "success"
                                            : "default";
                            return (
                            <Paper
                                key={t.id}
                                sx={{
                                    p: 1.6,
                                    mb: 1.2,
                                    borderRadius: 3,
                                    border: "1px solid rgba(201,165,95,0.18)",
                                    background: "rgba(255,255,255,0.04)",
                                }}
                            >
                                <Typography sx={{ fontWeight: 800 }}>
                                    {log.ip ? `${log.ip} - ${log.error_type || "Incident"}` : `Incident ${t.log_id}`}
                                </Typography>
                                <Typography sx={{ opacity: 0.7 }}>
                                    {String(log.description || "").slice(0, 90) || "No description available."}
                                </Typography>
                                {t.due_at && (
                                    <Typography sx={{ opacity: 0.7, fontSize: 12, mt: 0.5 }}>
                                        Due: {new Date(t.due_at).toLocaleString()}
                                    </Typography>
                                )}
                                {t.last_reminder_at && (
                                    <Typography sx={{ opacity: 0.6, fontSize: 12 }}>
                                        Last reminder: {new Date(t.last_reminder_at).toLocaleString()}
                                    </Typography>
                                )}
                                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                                    <Chip label={t.severity} size="small" />
                                    <Chip label={t.status} size="small" />
                                    <Chip
                                        label={`SLA: ${t.sla_status || "not set"}`}
                                        size="small"
                                        color={slaTone}
                                    />
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={String(t.log_id).startsWith("json-") ? "/logs" : `/issue/${t.log_id}`}
                                    >
                                        Open
                                    </Button>
                                </Box>
                            </Paper>
                            );
                        })}
                    </Paper>

                    <Paper className="lv-panel">
                        <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                            My Workspace
                        </Typography>
                        <Typography sx={{ opacity: 0.7, mb: 2 }}>
                            Key tools to investigate and resolve assigned work.
                        </Typography>
                        <Box sx={{ display: "grid", gap: 1.2 }}>
                            <Paper sx={{ p: 1.6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                                <Typography sx={{ fontWeight: 800 }}>Responsibility</Typography>
                                <Typography sx={{ opacity: 0.7 }}>
                                    Open: {taskStats.open} | Critical: {taskStats.critical}
                                </Typography>
                            </Paper>
                            <Button variant="outlined" component={Link} to="/logs">Go to Logs</Button>
                            <Button variant="outlined" component={Link} to="/realtime">Open Realtime</Button>
                            <Button variant="outlined" component={Link} to="/search">Diagnostics</Button>
                        </Box>
                    </Paper>
                </Box>
            )}

            {user && isAdmin && (
                <Paper className="lv-panel" sx={{ mt: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 800 }}>
                        Admin Task Assignment
                    </Typography>
                    <Typography sx={{ opacity: 0.7, mb: 2 }}>
                        Assign incidents to a specific user or organization.
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1.2fr 0.6fr 0.8fr auto" } }}>
                        <FormControl size="small">
                            <InputLabel id="assign-log-label">Incident</InputLabel>
                            <Select
                                labelId="assign-log-label"
                                label="Incident"
                                value={assignLogId}
                                onChange={(e) => setAssignLogId(e.target.value)}
                            >
                                {taskLogs.map((log) => (
                                    <MenuItem key={log.id} value={String(log.id)}>
                                        {log.ip ? `${log.ip} - ${log.error_type || "Incident"}` : `Incident ${log.id}`}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small">
                            <InputLabel id="assign-type-label">Assignee</InputLabel>
                            <Select
                                labelId="assign-type-label"
                                label="Assignee"
                                value={assignType}
                                onChange={(e) => setAssignType(e.target.value)}
                            >
                                <MenuItem value="user">User</MenuItem>
                                <MenuItem value="org">Organization</MenuItem>
                                <MenuItem value="none">None</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl size="small" disabled={assignType === "none"}>
                            <InputLabel id="assign-value-label">
                                {assignType === "org" ? "Organization" : "User"}
                            </InputLabel>
                            <Select
                                labelId="assign-value-label"
                                label={assignType === "org" ? "Organization" : "User"}
                                value={assignValue}
                                onChange={(e) => setAssignValue(e.target.value)}
                            >
                                {assignType === "org" && adminOrgs.map((org) => (
                                    <MenuItem key={org.id} value={String(org.id)}>
                                        {org.name} (ID {org.id})
                                    </MenuItem>
                                ))}
                                {assignType === "user" && adminUsers.map((u) => (
                                    <MenuItem key={u.id} value={u.username}>
                                        {u.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="contained"
                            disabled={!assignLogId || assignBusy}
                            onClick={handleAssignTask}
                        >
                            {assignBusy ? "Assigning..." : "Assign"}
                        </Button>
                    </Box>
                    <Divider sx={{ opacity: 0.2, my: 2 }} />
                    <Typography sx={{ opacity: 0.7 }}>
                        Assignments trigger task notifications and SLA tracking automatically.
                    </Typography>
                </Paper>
            )}

            {/* 🔐 LOGIN/REGISTER MODAL */}
            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: { xs: "92vw", sm: 380 },
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 3,
                        border: "1px solid rgba(201,165,95,0.18)",
                    }}
                >
                    <Typography variant="h6" mb={2}>
                        {authMode === "login" ? "Login" : "Create Account"}
                    </Typography>

                    <ToggleButtonGroup
                        value={authMode}
                        exclusive
                        onChange={(_, v) => {
                            if (!v) return;
                            setAuthMode(v);
                            setMsg({ type: "", text: "" });
                        }}
                        sx={{ mb: 2 }}
                        fullWidth
                    >
                        <ToggleButton value="login">Login</ToggleButton>
                        <ToggleButton value="register">Create</ToggleButton>
                    </ToggleButtonGroup>

                    {msg.text && (
                        <Alert
                            severity={msg.type === "error" ? "error" : "success"}
                            sx={{ mb: 2 }}
                        >
                            {msg.text}
                        </Alert>
                    )}

                    <TextField
                        label="Username"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <TextField
                        label="Password"
                        type="password"
                        fullWidth
                        sx={{ mb: 2 }}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {authMode === "register" && (
                        <>
                            <TextField
                                label="Full name"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                            <TextField
                                label="Email (optional)"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <TextField
                                label="Organization name (optional)"
                                fullWidth
                                sx={{ mb: 2 }}
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                            />
                        </>
                    )}

                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ mb: 1 }}
                        disabled={loading || !username.trim() || !password}
                        onClick={authMode === "login" ? handleLogin : handleRegister}
                    >
                        {loading ? "Please wait…" : authMode === "login" ? "Login" : "Create Account"}
                    </Button>

                    <Button fullWidth onClick={handleClose}>
                        Cancel
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
}
