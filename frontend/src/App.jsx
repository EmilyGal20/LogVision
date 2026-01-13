import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMemo, useEffect, useState } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// pages
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import SearchIP from "./pages/SearchIP";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import HardwareLogs from "./pages/HardwareLogs";
import IssueDetails from "./pages/IssueDetails";
import RealTimeIP from "./pages/RealTimeIP";
import RequireAuth from "./components/RequireAuth";


// layout (בשלב הבא נשדרג אותו ל-Twitch style)
import Layout from "./components/Layout";

// theme
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useThemeMode } from "./context/ThemeContext";
import { ControlCenterProvider } from "./context/ControlCenterContext";


export default function App() {
    const { mode } = useThemeMode();
    const [sessionExpiredOpen, setSessionExpiredOpen] = useState(false);

    // Sync body class (dark / light)
    useEffect(() => {
        // document.body.className = mode;
        document.body.className = mode === "light" ? "light-mode" : "dark";

    }, [mode]);

    useEffect(() => {
        const onExpired = () => setSessionExpiredOpen(true);
        window.addEventListener("auth:expired", onExpired);
        return () => window.removeEventListener("auth:expired", onExpired);
    }, []);

    // MUI Theme (שומר צבעים)
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    primary: { main: "#7c3aed" },
                    secondary: { main: "#06b6d4" },
                },
            }),
        [mode]
    );

    return (
        <BrowserRouter>
            <ThemeProvider theme={theme}>
                <ControlCenterProvider>

                    <Routes>
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />

                            <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                            <Route path="logs" element={<RequireAuth><Logs /></RequireAuth>} />
                            <Route path="search" element={<RequireAuth><SearchIP /></RequireAuth>} />
                            <Route path="admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
                            <Route path="hardware" element={<RequireAuth><HardwareLogs /></RequireAuth>} />
                            <Route path="issue/:id" element={<RequireAuth><IssueDetails /></RequireAuth>} />
                            <Route path="realtime" element={<RequireAuth><RealTimeIP /></RequireAuth>} />
                            <Route path="profile" element={<Profile />} />

                            {/* fallback */}
                            {/* <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
                            <Route path="*" element={<Navigate to="/profile" replace />} />

                        </Route>
                    </Routes>
                </ControlCenterProvider>
                <Snackbar
                    open={sessionExpiredOpen}
                    autoHideDuration={2500}
                    onClose={() => setSessionExpiredOpen(false)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
                >
                    <Alert severity="warning" variant="filled">
                        Session expired, please login again
                    </Alert>
                </Snackbar>

            </ThemeProvider>
        </BrowserRouter>
    );
}
