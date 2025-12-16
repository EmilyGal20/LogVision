import { useState, useEffect } from "react";
import {
    Paper,
    Typography,
    Box,
    Button,
    TextField,
    Modal
} from "@mui/material";

import usePersistentState from "../hooks/usePersistentState";
import { api } from "../api";
import { Link } from "react-router-dom";

export default function Profile() {

    const [user, setUser] = usePersistentState("logged-user", null);

    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // =====================================================
    // 🟣 User loading from-localStorage if Auth exists
    // =====================================================
    useEffect(() => {
        const saved = localStorage.getItem("auth");

        if (saved) {
            const parsed = JSON.parse(saved);
            setUser(parsed.user);

            // loading Token to axios after refresh
            api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
        }
    }, [setUser]);



    // =====================================================
    // 🔐 LOGIN-Token + Auth getting saved in the right place
    // =====================================================
    const handleLogin = async () => {
        try {
            const res = await api.post(
                "/auth/login",
                {
                    username: username.trim(),
                    password: password,
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            const { user, token } = res.data;

            const authData = { user, token };
            localStorage.setItem("auth", JSON.stringify(authData));

            setUser(user);
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

            handleClose();
            alert("Logged in successfully!");

        } catch (err) {
            console.error("LOGIN ERROR:", err.response?.data);

            alert(
                "Login failed: " +
                (err.response?.data?.detail ||
                    err.response?.data ||
                    err.message)
            );
        }
    };


    // =====================================================
    // 🔓 LOGOUT
    // =====================================================
    const handleLogout = () => {
        localStorage.removeItem("auth");
        setUser(null);
        delete api.defaults.headers.common["Authorization"];
    };



    // =====================================================
    //  UI
    // =====================================================
    return (
        <Box>
            <Typography variant="h4" mb={3} fontWeight="bold">
                My Profile
            </Typography>

            {/* 🟣 LOGIN ALWAYS AVAILABLE */}
            <Button variant="contained" sx={{ mb: 2 }} onClick={handleOpen}>
                {user ? "Switch Account" : "Login"}
            </Button>

            {/* 🟢 Admin Connected Notification */}
            {user?.role === "admin" && (
                <Typography sx={{ color: "green", fontWeight: "bold", mb: 2 }}>
                    ✅ Admin is connected
                </Typography>
            )}

            {/* 🧑‍💻 PROFILE INFO */}
            {user && (
                <Paper sx={{ padding: 3, maxWidth: 300 }}>
                    <p><b>Username:</b> {user.username}</p>
                    <p><b>Full Name:</b> {user.full_name}</p>
                    <p><b>Role:</b> {user.role}</p>

                    <Button
                        variant="outlined"
                        color="error"
                        sx={{ mt: 2 }}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>

                    {/* 🛠 Admin Tools */}
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

            {/* =====================================================
                🔐 LOGIN MODAL
            ===================================================== */}
            <Modal open={open} onClose={handleClose}>
                <Box
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 350,
                        bgcolor: "background.paper",
                        borderRadius: 2,
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Typography variant="h6" mb={2}>
                        Login
                    </Typography>

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

                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ mb: 1 }}
                        onClick={handleLogin}
                    >
                        Login
                    </Button>

                    <Button fullWidth onClick={handleClose}>
                        Cancel
                    </Button>
                </Box>
            </Modal>
        </Box>
    );
}
