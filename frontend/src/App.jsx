import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Logs from "./pages/Logs";
import SearchIP from "./pages/SearchIP";
// import Admin from "./pages/Admin";
import AdminPanel from "./pages/AdminPanel";
import Profile from "./pages/Profile";
import HardwareLogs from "./pages/HardwareLogs";
import IssueDetails from "./pages/IssueDetails";
import RealTimeIP from "./pages/RealTimeIP";
// import CreateLog from "./pages/CreateLog";

import OSFrame from "./components/OSFrame";
import BrowserWindow from "./components/BrowserWindow";

export default function App() {

    useEffect(() => {
        document.body.className = "dark";
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* 🖥️ OS + Browser wrapper */}
                <Route
                    path="/"
                    element={
                        <OSFrame>
                            <BrowserWindow />
                        </OSFrame>
                    }
                >
                    {/* Default page */}
                    <Route index element={<Dashboard />} />

                    {/* Explicit routes */}
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="logs" element={<Logs />} />
                    <Route path="search" element={<SearchIP />} />
                    {/* <Route path="admin" element={<Admin />} /> */}
                    <Route path="admin" element={<AdminPanel />} />

                    <Route path="profile" element={<Profile />} />
                    <Route path="hardware" element={<HardwareLogs />} />
                    <Route path="issue/:id" element={<IssueDetails />} />
                    <Route path="realtime" element={<RealTimeIP />} />
                    {/* <Route path="/logs/new" element={<CreateLog />} /> */}

                </Route>
            </Routes>
        </BrowserRouter>
    );
}
