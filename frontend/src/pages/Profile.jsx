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

import { useState, useEffect, useCallback } from "react";
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

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    const resetForm = useCallback(() => {
        setUsername("");
        setPassword("");
        setFullName("");
        setEmail("");
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
        <Box>
            <Typography variant="h4" mb={3} fontWeight="bold">
                My Profile
            </Typography>

            <Button variant="contained" sx={{ mb: 2 }} onClick={openAuthModal}>
                {user ? "Switch Account" : "Login / Create Account"}
            </Button>

            {user?.role === "admin" && (
                <Typography sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    ✅ Admin is connected
                </Typography>
            )}

            {user && (
                <Paper sx={{ padding: 3, maxWidth: 340 }}>
                    <p>
                        <b>Username:</b> {user.username}
                    </p>
                    <p>
                        <b>Full Name:</b> {user.full_name || "-"}
                    </p>
                    <p>
                        <b>Role:</b> {user.role}
                    </p>

                    <Button
                        variant="outlined"
                        color="error"
                        sx={{ mt: 2 }}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>

                    {user.role === "admin" && (
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
