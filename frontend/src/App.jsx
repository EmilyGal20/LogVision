import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMemo, useEffect } from "react";

// pages
import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import SearchIP from "./pages/SearchIP";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import HardwareLogs from "./pages/HardwareLogs";
import IssueDetails from "./pages/IssueDetails";
import RealTimeIP from "./pages/RealTimeIP";

// layout (בשלב הבא נשדרג אותו ל-Twitch style)
import Layout from "./components/Layout";

// theme
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useThemeMode } from "./context/ThemeContext";
import { ControlCenterProvider } from "./context/ControlCenterContext";


export default function App() {
    const { mode } = useThemeMode();

    // Sync body class (dark / light)
    useEffect(() => {
        // document.body.className = mode;
        document.body.className = mode === "light" ? "light-mode" : "dark";

    }, [mode]);

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
                        {/* Shell חדש במקום OS/Browser */}
                        <Route path="/" element={<Layout />}>
                            <Route index element={<Navigate to="/dashboard" replace />} />

                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="logs" element={<Logs />} />
                            <Route path="search" element={<SearchIP />} />
                            <Route path="admin" element={<AdminPanel />} />

                            <Route path="profile" element={<Profile />} />
                            <Route path="hardware" element={<HardwareLogs />} />
                            <Route path="issue/:id" element={<IssueDetails />} />
                            <Route path="realtime" element={<RealTimeIP />} />

                            {/* fallback */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Route>
                    </Routes>
                </ControlCenterProvider>

            </ThemeProvider>
        </BrowserRouter>
    );
}
