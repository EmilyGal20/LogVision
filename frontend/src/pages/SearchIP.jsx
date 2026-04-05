// // ------------------------------------------------------
// //  SEARCHIP.JSX — Full Smart Version (Demo Mode + Real Logs + Hardware Panel)
// // ------------------------------------------------------

// import { useCallback, useMemo, useState, useEffect } from "react";
// import { api } from "../api";
// import usePersistentState from "../hooks/usePersistentState";

// import {
//     Box,
//     TextField,
//     Button,
//     Paper,
//     Typography,
//     MenuItem,
//     // Tooltip,
//     Chip,
//     Divider,
//     Modal,
//     CircularProgress,
// } from "@mui/material";

// import { useThemeMode } from "../context/ThemeContext";
// import { useNavigate } from "react-router-dom";

// // ICONS
// // import MemoryIcon from "@mui/icons-material/Memory";
// // import BugReportIcon from "@mui/icons-material/BugReport";
// // import WifiIcon from "@mui/icons-material/Wifi";
// // import ErrorIcon from "@mui/icons-material/Error";
// // import WhatshotIcon from "@mui/icons-material/Whatshot";
// // import StorageIcon from "@mui/icons-material/Storage";

// // ------------------------------------------------------
// // DEMO ERROR TEMPLATES (kept as comments)
// // ------------------------------------------------------
// // const DEMO_TEMPLATES = [
// //     { error_type: "Hardware", description: "CPU overheating (Demo)", severity: "Critical" },
// //     { error_type: "Hardware", description: "Disk read failure (Demo)", severity: "Medium" },
// //     { error_type: "Network", description: "Network timeout (Demo)", severity: "Low" }
// // ];

// // ------------------------------------------------------
// // ICON MAP (kept - used by old demo icons / can be reused later)
// // ------------------------------------------------------
// // const ICON_MAP = {
// //     "CPU overheating (Demo)": <WhatshotIcon sx={{ color: "#ef4444", fontSize: 32 }} />,
// //     "Disk read failure (Demo)": <StorageIcon sx={{ color: "#3b82f6", fontSize: 32 }} />,
// //     "Network timeout (Demo)": <WifiIcon sx={{ color: "#06b6d4", fontSize: 32 }} />,
// // };

// // ------------------------------------------------------
// // LOCALSTORAGE DEMO HANDLING (kept as comments)
// // ------------------------------------------------------
// // function loadDemoLogsForIP(ip) {
// //     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
// //     return all[ip] || null;
// // }

// // function saveDemoLogsForIP(ip, logs) {
// //     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
// //     all[ip] = logs;
// //     localStorage.setItem("demo-errors-by-ip", JSON.stringify(all));
// // }

// // function deleteDemoForIP(ip, id) {
// //     const logs = loadDemoLogsForIP(ip);
// //     if (!logs) return;
// //     saveDemoLogsForIP(ip, logs.filter(l => l.id !== id));
// // }

// // ------------------------------------------------------
// // DEMO DEVICE GENERATOR (kept as comments)
// // ------------------------------------------------------
// // function demoDeviceForIP(ip) {
// //     // מספרים "הגיוניים" לפי IP (כדי שיהיה עקבי)
// //     const seed = (ip || "0.0.0.0").split(".").reduce((a, b) => a + Number(b || 0), 0);
// //     const cpu = 45 + (seed % 55); // 45..99
// //     const gpu = 40 + (seed % 50); // 40..89
// //     const ram = 20 + (seed % 80); // 20..99
// //     const ssd = 30 + (seed % 70); // 30..99
// //     const online = (seed % 5) !== 0;

// //     return {
// //         ip: ip || "0.0.0.0",
// //         hostname: "demo-device",
// //         online,
// //         cpu_temp: cpu,
// //         gpu_temp: gpu,
// //         ram_used: ram,
// //         disk_health: { ssd },
// //         last_ping: new Date().toISOString(),
// //         last_update: new Date().toISOString(),
// //         is_demo: true,
// //     };
// // }

// // ------------------------------------------------------
// // MODAL STYLE
// // ------------------------------------------------------
// const modalStyle = {
//     position: "absolute",
//     top: "50%",
//     left: "50%",
//     transform: "translate(-50%, -50%)",
//     background: "rgba(20,20,35,0.92)",
//     padding: "22px",
//     borderRadius: "16px",
//     width: "560px",
//     border: "1px solid rgba(255,255,255,0.10)",
//     backdropFilter: "blur(12px)",
// };

// // ------------------------------------------------------
// // COMPONENT
// // ------------------------------------------------------
// export default function SearchIP() {
//     const { mode } = useThemeMode();
//     const navigate = useNavigate();

//     const [ip, setIp] = usePersistentState("search-ip-value", "");
//     const [errorType, setErrorType] = usePersistentState("search-error-type", "");
//     const [severityFilter, setSeverityFilter] = usePersistentState("severity-filter", "");
//     // const [showDemoOnly, setShowDemoOnly] = usePersistentState("show-demo-only", false); // demo kept as comments

//     // ✅ FIX: define showDemoOnly so references won't crash (demo feature currently disabled)
//     const showDemoOnly = false;

//     const [results, setResults] = usePersistentState("search-results", []);
//     const [createHostname, setCreateHostname] = useState("");
//     const [creatingDevice, setCreatingDevice] = useState(false);
//     const auth = JSON.parse(localStorage.getItem("auth") || "null");
//     const isAdmin = auth?.user?.role === "admin";

//     // device hardware status
//     const [deviceInfo, setDeviceInfo] = useState(null);
//     const [deviceLoading, setDeviceLoading] = useState(false);
//     const [deviceError, setDeviceError] = useState("");

//     // diagnostics modal
//     const [openDiag, setOpenDiag] = useState(false);
//     const [diagLoading, setDiagLoading] = useState(false);
//     const [diagData, setDiagData] = useState(null);
//     const [diagErr, setDiagErr] = useState("");

//     // add log form
//     const [newLogType, setNewLogType] = useState("Hardware");
//     const [newLogSeverity, setNewLogSeverity] = useState("Low");
//     const [newLogDesc, setNewLogDesc] = useState("");
//     const [addingLog, setAddingLog] = useState(false);
//     const [addLogErr, setAddLogErr] = useState("");
//     const [newLogComputer, setNewLogComputer] = useState("");
//     const [openAddLog, setOpenAddLog] = useState(false);

//     useEffect(() => {
//         const auto = deviceInfo?.hostname || (ip ? `pc-${ip}` : "");
//         setNewLogComputer((prev) => prev || auto);
//     }, [deviceInfo?.hostname, ip]);

//     // ------------------------------------------------------
//     // ICON HANDLER (kept as comments - old logs UI)
//     // ------------------------------------------------------
//     // const iconForError = (description, type) => {
//     //     if (ICON_MAP[description]) return ICON_MAP[description];
//     //     switch (type) {
//     //         case "Hardware": return <MemoryIcon sx={{ color: "#7c3aed", fontSize: 32 }} />;
//     //         case "Software": return <BugReportIcon sx={{ color: "#06b6d4", fontSize: 32 }} />;
//     //         case "Network": return <WifiIcon sx={{ color: "#3b82f6", fontSize: 32 }} />;
//     //         default: return <ErrorIcon sx={{ fontSize: 32 }} />;
//     //     }
//     // };

//     // ------------------------------------------------------
//     // COLORS
//     // ------------------------------------------------------
//     const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

//     const severityColor = {
//         Critical: "#ef4444",
//         Medium: "#facc15",
//         Low: "#4ade80",
//         unknown: "#6b7280",
//     };

//     const severityBadge = (sev) => ({
//         background: severityColor[sev] || severityColor.unknown,
//         color: "#fff",
//         padding: "2px 8px",
//         borderRadius: "6px",
//         fontSize: "12px",
//         marginLeft: "8px",
//     });

//     const demoBadge = {
//         background: "#6366f1",
//         color: "white",
//         padding: "2px 8px",
//         borderRadius: "6px",
//         fontSize: "12px",
//         marginLeft: "8px",
//     };

//     // const realBadge = { ... } // kept as comments earlier if you want

//     const bgCard = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

//     // ------------------------------------------------------
//     // Hardware thresholds + styling
//     // ------------------------------------------------------
//     const metricTone = (type, value) => {
//         if (value === null || value === undefined || Number.isNaN(value)) return "neutral";

//         if (type === "cpuTemp") {
//             if (value < 70) return "good";
//             if (value < 90) return "warn";
//             return "bad";
//         }
//         if (type === "gpuTemp") {
//             if (value < 65) return "good";
//             if (value < 85) return "warn";
//             return "bad";
//         }
//         if (type === "ramPct") {
//             if (value < 70) return "good";
//             if (value < 90) return "warn";
//             return "bad";
//         }
//         if (type === "ssdPct") {
//             if (value > 70) return "good";
//             if (value > 50) return "warn";
//             return "bad";
//         }
//         return "neutral";
//     };

//     const toneStyle = (tone) => {
//         if (tone === "good") {
//             return {
//                 border: "1px solid rgba(34,197,94,0.35)",
//                 background: "rgba(34,197,94,0.16)",
//                 color: mode === "dark" ? "#dcfce7" : "#052e16",
//             };
//         }
//         if (tone === "warn") {
//             return {
//                 border: "1px solid rgba(250,204,21,0.35)",
//                 background: "rgba(250,204,21,0.16)",
//                 color: mode === "dark" ? "#fef9c3" : "#422006",
//             };
//         }
//         if (tone === "bad") {
//             return {
//                 border: "1px solid rgba(239,68,68,0.35)",
//                 background: "rgba(239,68,68,0.16)",
//                 color: mode === "dark" ? "#fee2e2" : "#450a0a",
//             };
//         }
//         return {
//             border: "1px solid rgba(148,163,184,0.25)",
//             background: "rgba(148,163,184,0.10)",
//             color: mode === "dark" ? "#e5e7eb" : "#111",
//         };
//     };

//     const MetricCard = ({ label, value, unit, tone }) => (
//         <Paper sx={{ p: 1.6, borderRadius: 3, ...toneStyle(tone) }}>
//             <Typography sx={{ fontSize: 12, opacity: 0.95, fontWeight: 800 }}>
//                 {label}
//             </Typography>
//             <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
//                 {value === null || value === undefined ? "—" : value}
//                 {unit ? (
//                     <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}> {unit}</span>
//                 ) : null}
//             </Typography>
//         </Paper>
//     );

//     const StatusChip = ({ ok, label }) => (
//         <Chip
//             label={label}
//             sx={{
//                 mr: 1,
//                 mb: 1,
//                 fontWeight: 800,
//                 borderRadius: "999px",
//                 color: ok ? "#052e16" : "#450a0a",
//                 background: ok ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
//                 border: ok ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
//             }}
//         />
//     );

//     const fmtTime = (s) => {
//         if (!s) return "—";
//         try {
//             return new Date(s).toLocaleString();
//         } catch {
//             return String(s);
//         }
//     };

//     // ------------------------------------------------------
//     // RISKS (Hardware + Real/JSON Logs) — NO DEMO
//     // ------------------------------------------------------
//     const riskRank = useMemo(() => ({ Critical: 3, Medium: 2, Low: 1 }), []);

//     const buildHardwareRisks = useCallback((d) => {
//         if (!d) return [];
//         const risks = [];

//         const cpu = d.cpu_temp ?? null;
//         const gpu = d.gpu_temp ?? null;
//         const ram = d.ram_used ?? null;
//         const ssd = d.disk_health?.ssd ?? null;

//         const push = (severity, title, detail, kind) => {
//             risks.push({
//                 id: `hw-${kind}`,
//                 source: "hardware",
//                 severity,
//                 title,
//                 detail,
//                 kind,
//             });
//         };

//         if (d.online === false) {
//             push("Critical", "Device appears offline", "Ping reports device is offline", "offline");
//         }

//         if (cpu !== null && cpu !== undefined && !Number.isNaN(cpu)) {
//             if (cpu >= 90) push("Critical", "CPU overheating risk", `CPU temp is ${cpu}°C`, "cpu");
//             else if (cpu >= 70) push("Medium", "CPU running hot", `CPU temp is ${cpu}°C`, "cpu");
//         }

//         if (gpu !== null && gpu !== undefined && !Number.isNaN(gpu)) {
//             if (gpu >= 85) push("Critical", "GPU overheating risk", `GPU temp is ${gpu}°C`, "gpu");
//             else if (gpu >= 65) push("Medium", "GPU running hot", `GPU temp is ${gpu}°C`, "gpu");
//         }

//         if (ram !== null && ram !== undefined && !Number.isNaN(ram)) {
//             if (ram >= 90) push("Critical", "High memory pressure", `RAM usage is ${ram}%`, "ram");
//             else if (ram >= 70) push("Medium", "Elevated RAM usage", `RAM usage is ${ram}%`, "ram");
//         }

//         if (ssd !== null && ssd !== undefined && !Number.isNaN(ssd)) {
//             if (ssd <= 50) push("Critical", "SSD health critical", `SSD health is ${ssd}%`, "ssd");
//             else if (ssd <= 70) push("Medium", "SSD health declining", `SSD health is ${ssd}%`, "ssd");
//         }

//         return risks;
//     }, []);

//     const buildLogRisks = useCallback((logs) => {
//         if (!Array.isArray(logs)) return [];
//         const safe = logs.filter((l) => !l?.is_demo);

//         return safe.map((log) => ({
//             id: `log-${log.id}`,
//             source: "log",
//             severity: log.severity || "Low",
//             title: `${log.error_type} issue`,
//             detail: log.description,
//             logId: log.id,
//             ip: log.ip,
//             is_real: !!log.is_real,
//             is_json: !!log.is_json,
//         }));
//     }, []);

//     const risks = useMemo(() => {
//         const hw = buildHardwareRisks(deviceInfo);
//         const lg = buildLogRisks(results);
//         const combined = [...hw, ...lg];

//         return combined.sort(
//             (a, b) => (riskRank[b.severity] || 0) - (riskRank[a.severity] || 0)
//         );
//     }, [deviceInfo, results, buildHardwareRisks, buildLogRisks, riskRank]);

//     const riskSummary = useMemo(() => {
//         const counts = { Critical: 0, Medium: 0, Low: 0 };

//         for (const r of risks) {
//             if (r.severity === "Critical") counts.Critical += 1;
//             else if (r.severity === "Medium") counts.Medium += 1;
//             else if (r.severity === "Low") counts.Low += 1;
//         }

//         // Overall score (weighted): Critical=10, Medium=5, Low=1
//         const score =
//             (counts.Critical * 10) +
//             (counts.Medium * 5) +
//             (counts.Low * 1);

//         // Optional: normalize into 0..100-ish (caps at 100)
//         const score100 = Math.min(100, score);

//         return { counts, score, score100 };
//     }, [risks]);

//     // ------------------------------------------------------
//     // Fetch device info (real)
//     // ------------------------------------------------------
//     const fetchDeviceInfo = useCallback(async (targetIp) => {
//         setDeviceLoading(true);
//         setDeviceError("");
//         try {
//             const res = await api.get(`/devices/${targetIp}`)

//             setDeviceInfo(res.data);
//         } catch (e) {
//             setDeviceInfo(null);

//             const status = e?.response?.status;
//             const data = e?.response?.data;

//             if (status === 404) {
//                 setDeviceError("Device not found for this IP.");
//             } else if (status === 403) {
//                 setDeviceError("No permission to view device info.");
//             } else {
//                 setDeviceError(
//                     `Failed to load device info. ${status ? `Status: ${status}` : ""} ${data ? `Response: ${JSON.stringify(data)}` : ""
//                     }`
//                 );
//             }
//         }
//         finally {
//             setDeviceLoading(false);
//         }
//     }, []);

//     const createDevice = useCallback(async () => {
//         if (!ip) {
//             alert("Please enter an IP address.");
//             return;
//         }

//         setCreatingDevice(true);
//         try {
//             await api.post("/devices/", {
//                 ip,
//                 hostname: createHostname || `device-${ip.replaceAll(".", "-")}`,
//                 disk_health: { ssd: 100 },
//             });

//             setDeviceError("");
//             setCreateHostname("");
//             await fetchDeviceInfo(ip);

//             await api.post(`/devices/${ip}/ping`);
//             await fetchDeviceInfo(ip);
//         } catch (e) {
//             setDeviceError("Create Device has failed (IP might already exist or need permissions).");
//         } finally {
//             setCreatingDevice(false);
//         }
//     }, [ip, createHostname, fetchDeviceInfo]);

//     const pingNow = useCallback(async (targetIp) => {
//         if (!targetIp) return;

//         setDeviceLoading(true);
//         setDeviceError("");
//         try {
//             await api.post(`/devices/${targetIp}/ping`);
//             await fetchDeviceInfo(targetIp);
//         } catch (e) {
//             setDeviceError("Ping has failed (permissions / endpoint).");
//         } finally {
//             setDeviceLoading(false);
//         }
//     }, [fetchDeviceInfo]);

//     // ------------------------------------------------------
//     // Diagnostics (real)
//     // ------------------------------------------------------
//     const runDiagnostics = useCallback(async (targetIp) => {
//         setOpenDiag(true);
//         setDiagLoading(true);
//         setDiagData(null);
//         setDiagErr("");

//         try {
//             const res = await api.post(`/devices/${targetIp}/diagnostics`);
//             setDiagData(res.data);
//         } catch (e) {
//             setDiagErr("Diagnostics has faild (endpoint/permissions).");
//         } finally {
//             setDiagLoading(false);
//         }
//     }, []);

//     // ------------------------------------------------------
//     // SEARCH FUNCTION
//     // ------------------------------------------------------
//     const search = useCallback(async () => {
//         // ⭐ DEMO ONLY MODE (kept as comments)
//         // if (showDemoOnly) { ... }

//         if (!ip) {
//             alert("Please enter an IP address.");
//             return;
//         }

//         fetchDeviceInfo(ip);

//         const res = await api.get("/logs/search", { params: { ip } });

//         let realLogs = res.data.map((log) => ({
//             ...log,
//             is_real: !log.source,
//             is_json: log.source === "json",
//         }));

//         if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
//         if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

//         setResults(realLogs);
//     }, [ip, errorType, severityFilter, setResults, fetchDeviceInfo]);

//     // ------------------------------------------------------
//     // RESET
//     // ------------------------------------------------------
//     const reset = () => {
//         setIp("");
//         setErrorType("");
//         setSeverityFilter("");
//         setResults([]);
//         setDeviceInfo(null);
//         setDeviceError("");
//         setCreateHostname("");
//         setNewLogType("Hardware");
//         setNewLogSeverity("Low");
//         setNewLogDesc("");
//         setAddLogErr("");
//     };

//     // ------------------------------------------------------
//     // DELETE HANDLER (kept as comments - old logs list UI)
//     // ------------------------------------------------------
//     // const handleDelete = async (log) => { ... };

//     const refreshLogsForIP = useCallback(async (targetIp) => {
//         if (!targetIp) return;

//         const res = await api.get("/logs/search", { params: { ip: targetIp } });

//         let realLogs = res.data.map((log) => ({
//             ...log,
//             is_real: !log.source,
//             is_json: log.source === "json",
//         }));

//         if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
//         if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

//         setResults(realLogs);
//     }, [errorType, severityFilter, setResults]);

//     const addNewLog = useCallback(async () => {
//         setAddLogErr("");
//         setAddingLog(true);

//         if (!ip) {
//             setAddLogErr("Enter IP first then add Log.");
//             setAddingLog(false);
//             return false;
//         }
//         if (!newLogDesc.trim()) {
//             setAddLogErr("Must add Description.");
//             setAddingLog(false);
//             return false;
//         }

//         try {
//             await api.post("/logs/", {
//                 computer_name: newLogComputer?.trim() || deviceInfo?.hostname || `pc-${ip}`,
//                 ip,
//                 error_type: newLogType,
//                 severity: newLogSeverity,
//                 description: newLogDesc.trim(),
//             });

//             setNewLogDesc("");
//             await refreshLogsForIP(ip);
//             return true;
//         } catch (e) {
//             const detail = e?.response?.data?.detail;
//             setAddLogErr(detail ? JSON.stringify(detail, null, 2) : "Failed to add Log (Check Token/Server.");
//             return false;
//         } finally {
//             setAddingLog(false);
//         }
//     }, [
//         ip,
//         newLogType,
//         newLogSeverity,
//         newLogDesc,
//         newLogComputer,
//         deviceInfo?.hostname,
//         refreshLogsForIP,
//     ]);

//     const metrics = useMemo(() => {
//         const cpu = deviceInfo?.cpu_temp ?? null;
//         const gpu = deviceInfo?.gpu_temp ?? null;
//         const ram = deviceInfo?.ram_used ?? null;
//         const ssd = deviceInfo?.disk_health?.ssd ?? null;

//         return {
//             cpu,
//             gpu,
//             ram,
//             ssd,
//             cpuTone: metricTone("cpuTemp", cpu),
//             gpuTone: metricTone("gpuTemp", gpu),
//             ramTone: metricTone("ramPct", ram),
//             ssdTone: metricTone("ssdPct", ssd),
//         };
//     }, [deviceInfo]);

//     // ------------------------------------------------------
//     // RENDER UI
//     // ------------------------------------------------------
//     return (
//         <Box
//             sx={{
//                 padding: 4,
//                 width: "100%",
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 gap: 3,
//             }}
//         >
//             <Typography variant="h4" fontWeight="bold" sx={{ color: textColor }}>
//                 Search Logs
//             </Typography>

//             {/* SEARCH BOX */}
//             <Paper sx={{ width: "100%", maxWidth: 500, padding: 4, background: bgCard, borderRadius: "18px" }}>
//                 <TextField
//                     label="IP Address"
//                     value={ip}
//                     onChange={(e) => setIp(e.target.value)}
//                     fullWidth
//                     sx={{ mb: 3 }}
//                 />

//                 <TextField
//                     label="Error Type"
//                     value={errorType}
//                     onChange={(e) => setErrorType(e.target.value)}
//                     select
//                     fullWidth
//                     sx={{ mb: 3 }}
//                 >
//                     <MenuItem value="">All</MenuItem>
//                     <MenuItem value="Hardware">Hardware</MenuItem>
//                     <MenuItem value="Software">Software</MenuItem>
//                     <MenuItem value="Network">Network</MenuItem>
//                 </TextField>

//                 <TextField
//                     label="Severity"
//                     value={severityFilter}
//                     onChange={(e) => setSeverityFilter(e.target.value)}
//                     select
//                     fullWidth
//                     sx={{ mb: 3 }}
//                 >
//                     <MenuItem value="">All</MenuItem>
//                     <MenuItem value="Critical">Critical</MenuItem>
//                     <MenuItem value="Medium">Medium</MenuItem>
//                     <MenuItem value="Low">Low</MenuItem>
//                 </TextField>

//                 {/* DEMO ONLY TOGGLE (kept as comments) */}
//                 {/* <Button ...> ... </Button> */}

//                 <Button
//                     variant="contained"
//                     onClick={() => setOpenAddLog(true)}
//                     sx={{
//                         width: "100%",
//                         maxWidth: 700,
//                         py: 1.6,
//                         mb: 2.5,
//                         fontWeight: 900,
//                         background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
//                     }}
//                 >
//                     + Add New Log
//                 </Button>

//                 <Button
//                     variant="contained"
//                     fullWidth
//                     onClick={search}
//                     sx={{
//                         py: 1.6,
//                         mb: 2.5,
//                         background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
//                         fontWeight: "bold",
//                     }}
//                 >
//                     SEARCH
//                 </Button>

//                 <Button
//                     variant="outlined"
//                     fullWidth
//                     sx={{ py: 1.4, fontWeight: "bold", borderColor: "#7c3aed", color: "#7c3aed" }}
//                     onClick={reset}
//                 >
//                     RESET
//                 </Button>
//             </Paper>

//             {/* HARDWARE PANEL */}
//             {(deviceLoading || deviceInfo || deviceError) && (
//                 <Paper sx={{ width: "100%", maxWidth: 700, padding: 3, background: bgCard, borderRadius: "18px" }}>
//                     <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
//                         <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
//                             Hardware Status
//                         </Typography>

//                         <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
//                             {deviceInfo?.ip && (
//                                 <Chip
//                                     label={deviceInfo.online ? "ONLINE" : "OFFLINE"}
//                                     sx={{
//                                         fontWeight: 900,
//                                         borderRadius: "999px",
//                                         color: deviceInfo.online ? "#052e16" : "#450a0a",
//                                         background: deviceInfo.online ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
//                                         border: deviceInfo.online ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
//                                     }}
//                                 />
//                             )}

//                             {!showDemoOnly && deviceInfo?.ip && (
//                                 <Button variant="outlined" size="small" onClick={() => fetchDeviceInfo(deviceInfo.ip)}>
//                                     Refresh Hardware
//                                 </Button>
//                             )}

//                             <Button
//                                 variant="outlined"
//                                 size="small"
//                                 onClick={() => pingNow(deviceInfo?.ip)}
//                                 disabled={deviceLoading || !deviceInfo?.ip || !isAdmin || showDemoOnly}
//                             >
//                                 Ping now
//                             </Button>

//                             {!showDemoOnly && deviceInfo?.ip && (
//                                 <Button
//                                     variant="contained"
//                                     size="small"
//                                     onClick={() => runDiagnostics(deviceInfo.ip)}
//                                     sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
//                                 >
//                                     Run Diagnostics
//                                 </Button>
//                             )}
//                         </Box>
//                     </Box>

//                     <Divider sx={{ opacity: 0.2, my: 2 }} />

//                     {deviceLoading && (
//                         <Box display="flex" alignItems="center" gap={2}>
//                             <CircularProgress size={18} />
//                             <Typography sx={{ color: textColor, opacity: 0.8 }}>Loading device info...</Typography>
//                         </Box>
//                     )}

//                     {!!deviceError && (
//                         <Box>
//                             <Typography sx={{ color: textColor, opacity: 0.85, mb: 2 }}>
//                                 {deviceError}
//                             </Typography>

//                             {isAdmin ? (
//                                 <Paper
//                                     sx={{
//                                         p: 2,
//                                         borderRadius: "14px",
//                                         background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
//                                         border: "1px solid rgba(255,255,255,0.08)",
//                                     }}
//                                 >
//                                     <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
//                                         Create Device
//                                     </Typography>

//                                     <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
//                                         no device was found in IP Diagnostics, Create a new log to view it
//                                     </Typography>

//                                     <TextField
//                                         label="Hostname (optional)"
//                                         value={createHostname}
//                                         onChange={(e) => setCreateHostname(e.target.value)}
//                                         fullWidth
//                                         sx={{ mb: 2 }}
//                                     />

//                                     <Button
//                                         variant="contained"
//                                         fullWidth
//                                         onClick={createDevice}
//                                         disabled={creatingDevice}
//                                         sx={{ py: 1.3, fontWeight: 900, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)" }}
//                                     >
//                                         {creatingDevice ? "Creating..." : "Create Device"}
//                                     </Button>
//                                 </Paper>
//                             ) : (
//                                 <Typography sx={{ color: textColor, opacity: 0.8 }}>
//                                     No Admin permissions to create device, As user you can still look for logs or add new logs
//                                 </Typography>
//                             )}
//                         </Box>
//                     )}

//                     {deviceInfo && !deviceLoading && (
//                         <>
//                             <Typography sx={{ color: textColor, opacity: 0.85, mb: 1 }}>
//                                 IP: <b>{deviceInfo.ip}</b>
//                                 {deviceInfo.hostname ? <> • Hostname: <b>{deviceInfo.hostname}</b></> : null}
//                             </Typography>

//                             <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
//                                 Last Ping: <b>{fmtTime(deviceInfo.last_ping)}</b>
//                                 {"  "} • {"  "}
//                                 Last Update: <b>{fmtTime(deviceInfo.last_update)}</b>
//                             </Typography>

//                             <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
//                                 <MetricCard label="CPU Temp" value={metrics.cpu} unit="°C" tone={metrics.cpuTone} />
//                                 <MetricCard label="GPU Temp" value={metrics.gpu} unit="°C" tone={metrics.gpuTone} />
//                                 <MetricCard label="RAM Used" value={metrics.ram} unit="%" tone={metrics.ramTone} />
//                                 <MetricCard label="SSD Health" value={metrics.ssd} unit="%" tone={metrics.ssdTone} />
//                             </Box>

//                             {deviceInfo.disk_health && typeof deviceInfo.disk_health === "object" && (
//                                 <Box>
//                                     <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
//                                         Disk Health Details
//                                     </Typography>
//                                     <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
//                                         {Object.entries(deviceInfo.disk_health).map(([k, v]) => (
//                                             <Chip
//                                                 key={k}
//                                                 label={`${k}: ${v}`}
//                                                 sx={{
//                                                     borderRadius: "999px",
//                                                     fontWeight: 800,
//                                                     background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
//                                                     color: textColor,
//                                                 }}
//                                             />
//                                         ))}
//                                     </Box>
//                                 </Box>
//                             )}
//                         </>
//                     )}
//                 </Paper>
//             )}

//             {/* RESULTS TITLE */}
//             <Typography variant="h5" sx={{ color: textColor, mt: 2 }}>
//                 Results
//             </Typography>

//             {/* RISK SUMMARY BAR */}
//             <Paper
//                 sx={{
//                     width: "100%",
//                     maxWidth: 700,
//                     p: 2,
//                     background: bgCard,
//                     borderRadius: "18px",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     gap: 2,
//                     flexWrap: "wrap",
//                 }}
//             >
//                 <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
//                     <Typography sx={{ color: textColor, fontWeight: 900 }}>
//                         Risk Summary:
//                     </Typography>

//                     <Chip
//                         label={`Critical: ${riskSummary.counts.Critical}`}
//                         sx={{
//                             fontWeight: 900,
//                             borderRadius: "999px",
//                             background: "rgba(239,68,68,0.18)",
//                             border: "1px solid rgba(239,68,68,0.30)",
//                             color: textColor,
//                         }}
//                     />
//                     <Chip
//                         label={`Medium: ${riskSummary.counts.Medium}`}
//                         sx={{
//                             fontWeight: 900,
//                             borderRadius: "999px",
//                             background: "rgba(250,204,21,0.18)",
//                             border: "1px solid rgba(250,204,21,0.30)",
//                             color: textColor,
//                         }}
//                     />
//                     <Chip
//                         label={`Low: ${riskSummary.counts.Low}`}
//                         sx={{
//                             fontWeight: 900,
//                             borderRadius: "999px",
//                             background: "rgba(74,222,128,0.18)",
//                             border: "1px solid rgba(74,222,128,0.30)",
//                             color: textColor,
//                         }}
//                     />
//                 </Box>

//                 <Box sx={{ textAlign: "right" }}>
//                     <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 12, opacity: 0.85 }}>
//                         Overall risk score
//                     </Typography>
//                     <Typography sx={{ color: textColor, fontWeight: 1000, fontSize: 22, lineHeight: 1 }}>
//                         {riskSummary.score100}
//                         <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}> / 100</span>
//                     </Typography>
//                 </Box>
//             </Paper>


//             {/* RESULTS LIST — RISKS (No Demo) */}
//             <Paper sx={{ width: "100%", maxWidth: 700, padding: 3, background: bgCard, borderRadius: "18px" }}>
//                 {risks.length === 0 ? (
//                     <Typography sx={{ color: textColor }}>No risks detected for this IP.</Typography>
//                 ) : (
//                     risks.map((r) => (
//                         <Box
//                             key={r.id}
//                             sx={{
//                                 p: 2.5,
//                                 mb: 2,
//                                 borderRadius: "12px",
//                                 background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
//                                 borderLeft: `6px solid ${severityColor[r.severity] || severityColor.unknown}`,
//                                 display: "flex",
//                                 justifyContent: "space-between",
//                                 gap: 2,
//                                 alignItems: "center",
//                             }}
//                         >
//                             <Box sx={{ flexGrow: 1 }}>
//                                 <Typography
//                                     sx={{
//                                         fontWeight: 900,
//                                         fontSize: 16,
//                                         color: textColor,
//                                         mb: 0.4,
//                                         display: "flex",
//                                         alignItems: "center",
//                                         gap: 1,
//                                         flexWrap: "wrap",
//                                     }}
//                                 >
//                                     {r.title}
//                                     <span style={severityBadge(r.severity)}>{r.severity}</span>
//                                     <span style={demoBadge}>{r.source === "hardware" ? "HARDWARE" : "LOG"}</span>
//                                     {r.is_json ? <span style={demoBadge}>JSON</span> : null}
//                                 </Typography>

//                                 <Typography sx={{ opacity: 0.85, color: textColor }}>{r.detail}</Typography>
//                             </Box>

//                             <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
//                                 {r.source === "hardware" && deviceInfo?.ip && (
//                                     <>
//                                         <Button
//                                             variant="outlined"
//                                             size="small"
//                                             onClick={() => pingNow(deviceInfo.ip)}
//                                             disabled={!isAdmin || showDemoOnly}
//                                         >
//                                             Ping
//                                         </Button>

//                                         <Button
//                                             variant="contained"
//                                             size="small"
//                                             sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
//                                             onClick={() => runDiagnostics(deviceInfo.ip)}
//                                             disabled={!isAdmin || showDemoOnly}
//                                         >
//                                             Diagnostics
//                                         </Button>
//                                     </>
//                                 )}

//                                 {/* {r.source === "log" && r.is_real && (
//   <Button
//     variant="contained"
//     size="small"
//     onClick={(e) => {
//       e.stopPropagation?.(); // אם בעתיד כל הכרטיס יהיה קליקבילי
//       navigate(`/issue/${r.logId}`);
//     }}
//   >
//     VIEW
//   </Button>
// )} */}

//                                 {r.source === "log" && r.is_real && !r.is_json && (
//                                     <Button
//                                         variant="contained"
//                                         size="small"
//                                         onClick={(e) => {
//                                             e.stopPropagation?.();
//                                             navigate(`/issue/${r.logId}`);
//                                         }}
//                                     >
//                                         VIEW
//                                     </Button>
//                                 )}

//                             </Box>
//                         </Box>
//                     ))
//                 )}
//             </Paper>

//             {/* ---------------- Add Log Modal ---------------- */}
//             <Modal open={openAddLog} onClose={() => setOpenAddLog(false)}>
//                 <Box sx={{ ...modalStyle, width: "720px", maxWidth: "92vw" }}>
//                     <Paper
//                         sx={{
//                             width: "100%",
//                             padding: 3,
//                             background: bgCard,
//                             borderRadius: "18px",
//                             border: "1px solid rgba(255,255,255,0.10)",
//                         }}
//                     >
//                         <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
//                             <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
//                                 Add New Log
//                             </Typography>

//                             <Button variant="outlined" onClick={() => setOpenAddLog(false)}>
//                                 Close
//                             </Button>
//                         </Box>

//                         <Typography sx={{ color: textColor, opacity: 0.75, fontSize: 13, mb: 2 }}>
//                             שימו לב: לוג חדש יתווסף ל־DB עבור ה־IP שבחרת.
//                         </Typography>

//                         <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
//                             <TextField
//                                 label="Computer Name"
//                                 value={newLogComputer}
//                                 onChange={(e) => setNewLogComputer(e.target.value)}
//                                 fullWidth
//                             />

//                             <TextField
//                                 label="Error Type"
//                                 value={newLogType}
//                                 onChange={(e) => setNewLogType(e.target.value)}
//                                 select
//                                 fullWidth
//                             >
//                                 <MenuItem value="Hardware">Hardware</MenuItem>
//                                 <MenuItem value="Software">Software</MenuItem>
//                                 <MenuItem value="Network">Network</MenuItem>
//                             </TextField>

//                             <TextField
//                                 label="Severity"
//                                 value={newLogSeverity}
//                                 onChange={(e) => setNewLogSeverity(e.target.value)}
//                                 select
//                                 fullWidth
//                                 sx={{ gridColumn: "1 / span 1" }}
//                             >
//                                 <MenuItem value="Critical">Critical</MenuItem>
//                                 <MenuItem value="Medium">Medium</MenuItem>
//                                 <MenuItem value="Low">Low</MenuItem>
//                             </TextField>
//                         </Box>

//                         <TextField
//                             label="Description"
//                             value={newLogDesc}
//                             onChange={(e) => setNewLogDesc(e.target.value)}
//                             fullWidth
//                             multiline
//                             minRows={3}
//                             sx={{ mb: 1.5 }}
//                         />

//                         {!!addLogErr && (
//                             <Typography sx={{ color: "#fecaca", fontWeight: 800, mb: 1 }}>
//                                 {addLogErr}
//                             </Typography>
//                         )}

//                         <Button
//                             variant="contained"
//                             fullWidth
//                             onClick={async () => {
//                                 const ok = await addNewLog();
//                                 if (ok) setOpenAddLog(false);
//                             }}
//                             disabled={addingLog}
//                         >
//                             {addingLog ? "Adding..." : "Add Log"}
//                         </Button>

//                         <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
//                             <Button variant="outlined" size="small" onClick={() => refreshLogsForIP(ip)} disabled={!ip}>
//                                 Refresh Results
//                             </Button>
//                             <Button
//                                 variant="outlined"
//                                 size="small"
//                                 onClick={() => {
//                                     setNewLogType("Hardware");
//                                     setNewLogSeverity("Low");
//                                     setNewLogDesc("");
//                                     setAddLogErr("");
//                                 }}
//                             >
//                                 Clear Form
//                             </Button>
//                         </Box>
//                     </Paper>
//                 </Box>
//             </Modal>

//             {/* ---------------- Diagnostics Modal ---------------- */}
//             <Modal open={openDiag} onClose={() => setOpenDiag(false)}>
//                 <Box sx={modalStyle}>
//                     <Typography sx={{ color: "#e5e7eb", fontWeight: 900, fontSize: 18, mb: 1 }}>
//                         Diagnostics
//                     </Typography>

//                     <Typography sx={{ color: "#e5e7eb", opacity: 0.8, mb: 2 }}>
//                         IP: <b>{ip || diagData?.ip || deviceInfo?.ip || "—"}</b>
//                     </Typography>

//                     {diagLoading && (
//                         <Box display="flex" alignItems="center" gap={2}>
//                             <CircularProgress size={18} />
//                             <Typography sx={{ color: "#e5e7eb", opacity: 0.85 }}>
//                                 Running diagnostics...
//                             </Typography>
//                         </Box>
//                     )}

//                     {!diagLoading && diagErr && (
//                         <Typography sx={{ color: "#fecaca", fontWeight: 700 }}>
//                             {diagErr}
//                         </Typography>
//                     )}

//                     {!diagLoading && diagData && (
//                         <>
//                             <Paper
//                                 sx={{
//                                     p: 2,
//                                     borderRadius: 3,
//                                     background: "rgba(255,255,255,0.06)",
//                                     border: "1px solid rgba(255,255,255,0.08)",
//                                     mb: 2,
//                                 }}
//                             >
//                                 <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
//                                     Health Score
//                                 </Typography>
//                                 <Typography sx={{ color: "#a78bfa", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
//                                     {Math.round(diagData.health_score ?? 0)}%
//                                 </Typography>
//                             </Paper>

//                             <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
//                                 Checks
//                             </Typography>
//                             <Box sx={{ display: "flex", flexWrap: "wrap" }}>
//                                 <StatusChip ok={!!diagData?.diagnostic_report?.cpu_ok} label="CPU OK" />
//                                 <StatusChip ok={!!diagData?.diagnostic_report?.gpu_ok} label="GPU OK" />
//                                 <StatusChip ok={!!diagData?.diagnostic_report?.ram_ok} label="RAM OK" />
//                                 <StatusChip ok={!!diagData?.diagnostic_report?.storage_ok} label="Storage OK" />
//                             </Box>

//                             <Divider sx={{ opacity: 0.2, my: 2 }} />

//                             <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
//                                 Live Metrics
//                             </Typography>
//                             <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
//                                 <MetricCard label="CPU Temp" value={metrics.cpu} unit="°C" tone={metrics.cpuTone} />
//                                 <MetricCard label="GPU Temp" value={metrics.gpu} unit="°C" tone={metrics.gpuTone} />
//                                 <MetricCard label="RAM Used" value={metrics.ram} unit="%" tone={metrics.ramTone} />
//                                 <MetricCard label="SSD Health" value={metrics.ssd} unit="%" tone={metrics.ssdTone} />
//                             </Box>

//                             <Button
//                                 variant="contained"
//                                 fullWidth
//                                 onClick={() => setOpenDiag(false)}
//                                 sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 900 }}
//                             >
//                                 Close
//                             </Button>
//                         </>
//                     )}

//                     {!diagLoading && !diagData && !diagErr && (
//                         <Button variant="outlined" fullWidth onClick={() => setOpenDiag(false)}>
//                             Close
//                         </Button>
//                     )}
//                 </Box>
//             </Modal>
//         </Box>
//     );
// }


// ------------------------------------------------------
//  SEARCHIP.JSX — Full Smart Version (Demo Mode + Real Logs + Hardware Panel)
// ------------------------------------------------------

import { useCallback, useMemo, useState, useEffect } from "react";
import { api } from "../api";
import usePersistentState from "../hooks/usePersistentState";

import {
    Box,
    TextField,
    Button,
    Paper,
    Typography,
    MenuItem,
    // Tooltip,
    Chip,
    Divider,
    Modal,
    CircularProgress,
} from "@mui/material";

import { useThemeMode } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// ICONS
// import MemoryIcon from "@mui/icons-material/Memory";
// import BugReportIcon from "@mui/icons-material/BugReport";
// import WifiIcon from "@mui/icons-material/Wifi";
// import ErrorIcon from "@mui/icons-material/Error";
// import WhatshotIcon from "@mui/icons-material/Whatshot";
// import StorageIcon from "@mui/icons-material/Storage";

// ------------------------------------------------------
// DEMO ERROR TEMPLATES (kept as comments)
// ------------------------------------------------------
// const DEMO_TEMPLATES = [
//     { error_type: "Hardware", description: "CPU overheating (Demo)", severity: "Critical" },
//     { error_type: "Hardware", description: "Disk read failure (Demo)", severity: "Medium" },
//     { error_type: "Network", description: "Network timeout (Demo)", severity: "Low" }
// ];

// ------------------------------------------------------
// ICON MAP (kept - used by old demo icons / can be reused later)
// ------------------------------------------------------
// const ICON_MAP = {
//     "CPU overheating (Demo)": <WhatshotIcon sx={{ color: "#ef4444", fontSize: 32 }} />,
//     "Disk read failure (Demo)": <StorageIcon sx={{ color: "#3b82f6", fontSize: 32 }} />,
//     "Network timeout (Demo)": <WifiIcon sx={{ color: "#06b6d4", fontSize: 32 }} />,
// };

// ------------------------------------------------------
// LOCALSTORAGE DEMO HANDLING (kept as comments)
// ------------------------------------------------------
// function loadDemoLogsForIP(ip) {
//     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
//     return all[ip] || null;
// }

// function saveDemoLogsForIP(ip, logs) {
//     const all = JSON.parse(localStorage.getItem("demo-errors-by-ip") || "{}");
//     all[ip] = logs;
//     localStorage.setItem("demo-errors-by-ip", JSON.stringify(all));
// }

// function deleteDemoForIP(ip, id) {
//     const logs = loadDemoLogsForIP(ip);
//     if (!logs) return;
//     saveDemoLogsForIP(ip, logs.filter(l => l.id !== id));
// }

// ------------------------------------------------------
// DEMO DEVICE GENERATOR (kept as comments)
// ------------------------------------------------------
// function demoDeviceForIP(ip) {
//     // מספרים "הגיוניים" לפי IP (כדי שיהיה עקבי)
//     const seed = (ip || "0.0.0.0").split(".").reduce((a, b) => a + Number(b || 0), 0);
//     const cpu = 45 + (seed % 55); // 45..99
//     const gpu = 40 + (seed % 50); // 40..89
//     const ram = 20 + (seed % 80); // 20..99
//     const ssd = 30 + (seed % 70); // 30..99
//     const online = (seed % 5) !== 0;

//     return {
//         ip: ip || "0.0.0.0",
//         hostname: "demo-device",
//         online,
//         cpu_temp: cpu,
//         gpu_temp: gpu,
//         ram_used: ram,
//         disk_health: { ssd },
//         last_ping: new Date().toISOString(),
//         last_update: new Date().toISOString(),
//         is_demo: true,
//     };
// }

// ------------------------------------------------------
// MODAL STYLE
// ------------------------------------------------------
const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(20,20,35,0.92)",
    padding: "22px",
    borderRadius: "16px",
    width: "560px",
    border: "1px solid rgba(255,255,255,0.10)",
    backdropFilter: "blur(12px)",
};

// ------------------------------------------------------
// COMPONENT
// ------------------------------------------------------
export default function SearchIP() {
    const { mode } = useThemeMode();
    const navigate = useNavigate();

    const [ip, setIp] = usePersistentState("search-ip-value", "");
    const [errorType, setErrorType] = usePersistentState("search-error-type", "");
    const [severityFilter, setSeverityFilter] = usePersistentState("severity-filter", "");
    // const [showDemoOnly, setShowDemoOnly] = usePersistentState("show-demo-only", false); // demo kept as comments

    // ✅ FIX: define showDemoOnly so references won't crash (demo feature currently disabled)
    const showDemoOnly = false;

    const [results, setResults] = usePersistentState("search-results", []);
    const [createHostname, setCreateHostname] = useState("");
    const [creatingDevice, setCreatingDevice] = useState(false);
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    const isAdmin = auth?.user?.role === "admin";

    // device hardware status
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [deviceLoading, setDeviceLoading] = useState(false);
    const [deviceError, setDeviceError] = useState("");

    // ------------------------------------------------------
    // NEW: Connectivity + Port Checks + HTTP Probe (Real)
    // ------------------------------------------------------
    const DEFAULT_PORTS = useMemo(() => [80, 443, 22, 8000], []);
    const [portsStr, setPortsStr] = usePersistentState("search-ports", DEFAULT_PORTS.join(","));
    const parsedPorts = useMemo(() => {
        const nums = String(portsStr || "")
            .split(",")
            .map((x) => Number(String(x).trim()))
            .filter((n) => Number.isFinite(n) && n > 0 && n <= 65535);
        // keep unique + stable order
        const uniq = [];
        for (const n of nums) if (!uniq.includes(n)) uniq.push(n);
        return uniq.length ? uniq : DEFAULT_PORTS;
    }, [portsStr, DEFAULT_PORTS]);

    const [netInfo, setNetInfo] = useState(null);
    const [netLoading, setNetLoading] = useState(false);
    const [netError, setNetError] = useState("");

    const [httpProbe, setHttpProbe] = useState(null);
    const [httpLoading, setHttpLoading] = useState(false);
    const [httpErr, setHttpErr] = useState("");

    // diagnostics modal
    const [openDiag, setOpenDiag] = useState(false);
    const [diagLoading, setDiagLoading] = useState(false);
    const [diagData, setDiagData] = useState(null);
    const [diagErr, setDiagErr] = useState("");

    // add log form
    const [newLogType, setNewLogType] = useState("Hardware");
    const [newLogSeverity, setNewLogSeverity] = useState("Low");
    const [newLogDesc, setNewLogDesc] = useState("");
    const [addingLog, setAddingLog] = useState(false);
    const [addLogErr, setAddLogErr] = useState("");
    const [newLogComputer, setNewLogComputer] = useState("");
    const [openAddLog, setOpenAddLog] = useState(false);

    useEffect(() => {
        const auto =
            deviceInfo?.hostname ||
            netInfo?.hostname ||
            (ip ? `pc-${ip}` : "");
        setNewLogComputer((prev) => prev || auto);
    }, [deviceInfo?.hostname, netInfo?.hostname, ip]);

    // ------------------------------------------------------
    // ICON HANDLER (kept as comments - old logs UI)
    // ------------------------------------------------------
    // const iconForError = (description, type) => {
    //     if (ICON_MAP[description]) return ICON_MAP[description];
    //     switch (type) {
    //         case "Hardware": return <MemoryIcon sx={{ color: "#7c3aed", fontSize: 32 }} />;
    //         case "Software": return <BugReportIcon sx={{ color: "#06b6d4", fontSize: 32 }} />;
    //         case "Network": return <WifiIcon sx={{ color: "#3b82f6", fontSize: 32 }} />;
    //         default: return <ErrorIcon sx={{ fontSize: 32 }} />;
    //     }
    // };

    // ------------------------------------------------------
    // COLORS
    // ------------------------------------------------------
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const severityColor = {
        Critical: "#ef4444",
        Medium: "#facc15",
        Low: "#4ade80",
        unknown: "#6b7280",
    };

    const severityBadge = (sev) => ({
        background: severityColor[sev] || severityColor.unknown,
        color: "#fff",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    });

    const demoBadge = {
        background: "#6366f1",
        color: "white",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        marginLeft: "8px",
    };

    // const realBadge = { ... } // kept as comments earlier if you want

    const bgCard = mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

    // ------------------------------------------------------
    // Hardware thresholds + styling
    // ------------------------------------------------------
    const metricTone = (type, value) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "neutral";

        // NOTE: kept as-is (used by old hardware metrics)
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
            if (value > 70) return "good";
            if (value > 50) return "warn";
            return "bad";
        }

        // NEW: network metric tones
        if (type === "latencyMs") {
            if (value < 60) return "good";
            if (value < 150) return "warn";
            return "bad";
        }
        if (type === "lossPct") {
            if (value <= 1) return "good";
            if (value <= 5) return "warn";
            return "bad";
        }
        if (type === "jitterMs") {
            if (value < 20) return "good";
            if (value < 60) return "warn";
            return "bad";
        }
        if (type === "portsOpen") {
            if (value >= 3) return "good";
            if (value >= 1) return "warn";
            return "bad";
        }

        return "neutral";
    };

    const toneStyle = (tone) => {
        if (tone === "good") {
            return {
                border: "1px solid rgba(34,197,94,0.35)",
                background: "rgba(34,197,94,0.16)",
                color: mode === "dark" ? "#dcfce7" : "#052e16",
            };
        }
        if (tone === "warn") {
            return {
                border: "1px solid rgba(250,204,21,0.35)",
                background: "rgba(250,204,21,0.16)",
                color: mode === "dark" ? "#fef9c3" : "#422006",
            };
        }
        if (tone === "bad") {
            return {
                border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.16)",
                color: mode === "dark" ? "#fee2e2" : "#450a0a",
            };
        }
        return {
            border: "1px solid rgba(148,163,184,0.25)",
            background: "rgba(148,163,184,0.10)",
            color: mode === "dark" ? "#e5e7eb" : "#111",
        };
    };

    const MetricCard = ({ label, value, unit, tone }) => (
        <Paper sx={{ p: 1.6, borderRadius: 3, ...toneStyle(tone) }}>
            <Typography sx={{ fontSize: 12, opacity: 0.95, fontWeight: 800 }}>
                {label}
            </Typography>
            <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>
                {value === null || value === undefined ? "—" : value}
                {unit ? (
                    <span style={{ fontSize: 14, fontWeight: 800, opacity: 0.9 }}> {unit}</span>
                ) : null}
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

    const fmtTime = (s) => {
        if (!s) return "—";
        try {
            return new Date(s).toLocaleString();
        } catch {
            return String(s);
        }
    };

    const fmtNum = (n, digits = 0) => {
        if (n === null || n === undefined || Number.isNaN(n)) return null;
        const x = Number(n);
        if (!Number.isFinite(x)) return null;
        return digits > 0 ? x.toFixed(digits) : Math.round(x);
    };

    // ------------------------------------------------------
    // RISKS (Hardware + Real/JSON Logs) — NO DEMO
    // ------------------------------------------------------
    const riskRank = useMemo(() => ({ Critical: 3, Medium: 2, Low: 1 }), []);

    const buildHardwareRisks = useCallback((d) => {
        if (!d) return [];
        const risks = [];

        const cpu = d.cpu_temp ?? null;
        const gpu = d.gpu_temp ?? null;
        const ram = d.ram_used ?? null;
        const ssd = d.disk_health?.ssd ?? null;

        const push = (severity, title, detail, kind) => {
            risks.push({
                id: `hw-${kind}`,
                source: "hardware",
                severity,
                title,
                detail,
                kind,
            });
        };

        if (d.online === false) {
            push("Critical", "Device appears offline", "Ping reports device is offline", "offline");
        }

        if (cpu !== null && cpu !== undefined && !Number.isNaN(cpu)) {
            if (cpu >= 90) push("Critical", "CPU overheating risk", `CPU temp is ${cpu}°C`, "cpu");
            else if (cpu >= 70) push("Medium", "CPU running hot", `CPU temp is ${cpu}°C`, "cpu");
        }

        if (gpu !== null && gpu !== undefined && !Number.isNaN(gpu)) {
            if (gpu >= 85) push("Critical", "GPU overheating risk", `GPU temp is ${gpu}°C`, "gpu");
            else if (gpu >= 65) push("Medium", "GPU running hot", `GPU temp is ${gpu}°C`, "gpu");
        }

        if (ram !== null && ram !== undefined && !Number.isNaN(ram)) {
            if (ram >= 90) push("Critical", "High memory pressure", `RAM usage is ${ram}%`, "ram");
            else if (ram >= 70) push("Medium", "Elevated RAM usage", `RAM usage is ${ram}%`, "ram");
        }

        if (ssd !== null && ssd !== undefined && !Number.isNaN(ssd)) {
            if (ssd <= 50) push("Critical", "SSD health critical", `SSD health is ${ssd}%`, "ssd");
            else if (ssd <= 70) push("Medium", "SSD health declining", `SSD health is ${ssd}%`, "ssd");
        }

        return risks;
    }, []);

    const buildConnectivityRisks = useCallback((n, http) => {
        if (!n) return [];
        const risks = [];

        const push = (severity, title, detail, kind, extra = {}) => {
            risks.push({
                id: `net-${kind}`,
                source: "connectivity",
                severity,
                title,
                detail,
                kind,
                ...extra,
            });
        };

        // Expecting n like:
        // {
        //   ip, reachable, reason, latency_ms, jitter_ms, packet_loss_pct,
        //   ports: { "80": true, "443": false, ... },
        //   checked_at, hostname
        // }
        if (n.reachable === false) {
            push("Critical", "Device appears offline", n.reason || "Ping/Probe reports device is unreachable", "offline");
            return risks;
        }

        const loss = Number(n.packet_loss_pct);
        const latency = Number(n.latency_ms);
        const jitter = Number(n.jitter_ms);

        if (Number.isFinite(loss) && loss >= 5) push("Critical", "High packet loss detected", `Packet loss is ${fmtNum(loss, 1)}%`, "loss");
        else if (Number.isFinite(loss) && loss > 1) push("Medium", "Packet loss detected", `Packet loss is ${fmtNum(loss, 1)}%`, "loss");

        if (Number.isFinite(latency) && latency >= 150) push("Medium", "High latency detected", `Latency is ${fmtNum(latency)}ms`, "latency");
        if (Number.isFinite(jitter) && jitter >= 60) push("Medium", "High jitter detected", `Jitter is ${fmtNum(jitter)}ms`, "jitter");

        // Port checks
        if (n.ports && typeof n.ports === "object") {
            const closed = Object.entries(n.ports).filter(([, ok]) => ok === false).map(([p]) => p);
            const open = Object.entries(n.ports).filter(([, ok]) => ok === true).map(([p]) => p);

            if (closed.length && open.length) {
                // Special hint: 8000 closed but device reachable => likely service down
                const closedSet = new Set(closed.map(String));
                if (closedSet.has("8000")) {
                    push(
                        "Medium",
                        "Service port seems closed",
                        "Device reachable but port 8000 appears closed",
                        "port-8000"
                    );
                }
            }

            // If ALL ports closed but reachable => firewall / filtered
            if (Object.keys(n.ports).length > 0 && open.length === 0) {
                push("Medium", "All checked ports appear closed", "Device reachable but ports seem closed/filtered", "ports");
            }
        }

        // HTTP probe
        if (http && typeof http === "object") {
            if (http.ok === false) {
                const msg = http.error || http.reason || "HTTP probe failed";
                // If reachable but HTTP fails => service issue, not connectivity
                push("Medium", "HTTP probe failed", msg, "http", { httpHint: true });
            } else if (typeof http.status_code === "number" && http.status_code >= 400) {
                push("Low", "HTTP returned error status", `HTTP status ${http.status_code}`, "http-status", { httpHint: true });
            }
        }

        return risks;
    }, []);

    const buildLogRisks = useCallback((logs) => {
        if (!Array.isArray(logs)) return [];
        const safe = logs.filter((l) => !l?.is_demo);

        return safe.map((log) => ({
            id: `log-${log.id}`,
            source: "log",
            severity: log.severity || "Low",
            title: `${log.error_type} issue`,
            detail: log.description,
            logId: log.id,
            ip: log.ip,
            is_real: !!log.is_real,
            is_json: !!log.is_json,
        }));
    }, []);

    const risks = useMemo(() => {
        const hw = buildHardwareRisks(deviceInfo);
        const net = buildConnectivityRisks(netInfo, httpProbe);
        const lg = buildLogRisks(results);
        const combined = [...net, ...hw, ...lg];

        return combined.sort(
            (a, b) => (riskRank[b.severity] || 0) - (riskRank[a.severity] || 0)
        );
    }, [deviceInfo, netInfo, httpProbe, results, buildHardwareRisks, buildConnectivityRisks, buildLogRisks, riskRank]);

    const riskSummary = useMemo(() => {
        const counts = { Critical: 0, Medium: 0, Low: 0 };

        for (const r of risks) {
            if (r.severity === "Critical") counts.Critical += 1;
            else if (r.severity === "Medium") counts.Medium += 1;
            else if (r.severity === "Low") counts.Low += 1;
        }

        // Overall score (weighted): Critical=10, Medium=5, Low=1
        const score =
            (counts.Critical * 10) +
            (counts.Medium * 5) +
            (counts.Low * 1);

        // Optional: normalize into 0..100-ish (caps at 100)
        const score100 = Math.min(100, score);

        return { counts, score, score100 };
    }, [risks]);

    // ------------------------------------------------------
    // OPTION 3: Last Logs Snapshot (Real)
    // ------------------------------------------------------
    const logsSnapshot = useMemo(() => {
        const logs = Array.isArray(results) ? results.filter((l) => !l?.is_demo) : [];
        if (!logs.length) {
            return {
                total: 0,
                lastTime: null,
                lastCritical: null,
                topType: null,
            };
        }

        const toTime = (x) => {
            const s = x?.created_at || x?.timestamp || x?.time || x?.createdAt || x?.date;
            const t = s ? new Date(s).getTime() : NaN;
            return Number.isFinite(t) ? t : NaN;
        };

        const sorted = [...logs].sort((a, b) => (toTime(b) || 0) - (toTime(a) || 0));
        const last = sorted[0];

        const lastCritical = sorted.find((l) => (l?.severity || "") === "Critical") || null;

        const countsByType = {};
        for (const l of logs) {
            const k = l?.error_type || "Unknown";
            countsByType[k] = (countsByType[k] || 0) + 1;
        }
        const topType = Object.entries(countsByType).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

        return {
            total: logs.length,
            lastTime: last ? (last.created_at || last.timestamp || last.time || last.createdAt || last.date || null) : null,
            lastCritical,
            topType,
        };
    }, [results]);

    // ------------------------------------------------------
    // OPTION 4: HTTP Probe (Real) - lightweight check
    // ------------------------------------------------------
    const runHttpProbe = useCallback(
        async (targetIp, opts = {}) => {
            if (!targetIp) return;
            setHttpLoading(true);
            setHttpErr("");
            setHttpProbe(null);

            // Defaults: prefer /health on port 8000 if checked
            const prefer8000 = parsedPorts.includes(8000);
            const port = opts.port ?? (prefer8000 ? 8000 : (parsedPorts[0] || 80));
            const path = opts.path ?? "/health";

            try {
                // Expected backend endpoint:
                // GET /net/http_probe?ip=...&port=8000&path=/health&timeout=2
                const res = await api.get("/net/http_probe", {
                    params: {
                        ip: targetIp,
                        port,
                        path,
                        timeout: 2,
                    },
                });

                setHttpProbe(res.data);
            } catch (e) {
                const status = e?.response?.status;
                const data = e?.response?.data;
                setHttpErr(
                    `HTTP probe failed. ${status ? `Status: ${status}` : ""} ${data ? `Response: ${JSON.stringify(data)}` : ""}`
                );
            } finally {
                setHttpLoading(false);
            }
        },
        [parsedPorts]
    );

    // ------------------------------------------------------
    // OPTION 1: Connectivity + TCP Port Check (Real)
    // ------------------------------------------------------
    const fetchConnectivity = useCallback(
        async (targetIp) => {
            if (!targetIp) return;

            setNetLoading(true);
            setNetError("");
            try {
                // Expected backend endpoint:
                // GET /net/diag?ip=...&ports=80,443,22,8000
                const res = await api.get("/net/diag", {
                    params: {
                        ip: targetIp,
                        ports: parsedPorts.join(","),
                        timeout: 2,
                    },
                });
                setNetInfo(res.data);

                // auto-run probe if reachable AND at least one http-ish port open
                const portsObj = res.data?.ports;
                const open8000 = portsObj?.["8000"] === true || portsObj?.[8000] === true;
                const open80 = portsObj?.["80"] === true || portsObj?.[80] === true;
                const open443 = portsObj?.["443"] === true || portsObj?.[443] === true;

                if (res.data?.reachable !== false && (open8000 || open80 || open443)) {
                    const chosenPort = open8000 ? 8000 : (open80 ? 80 : 443);
                    runHttpProbe(targetIp, { port: chosenPort, path: chosenPort === 8000 ? "/health" : "/" });
                } else {
                    setHttpProbe(null);
                    setHttpErr("");
                }
            } catch (e) {
                setNetInfo(null);
                const status = e?.response?.status;
                const data = e?.response?.data;
                setNetError(
                    `Connectivity check failed. ${status ? `Status: ${status}` : ""} ${data ? `Response: ${JSON.stringify(data)}` : ""}`
                );
            } finally {
                setNetLoading(false);
            }
        },
        [parsedPorts, runHttpProbe]
    );

    // ------------------------------------------------------
    // OPTION 5: Smart Suggestions -> Prefill "Add Log"
    // ------------------------------------------------------
    const suggestLog = useCallback((suggestion) => {
        // suggestion: { type, severity, desc, computer_name? }
        if (!suggestion) return;
        setNewLogType(suggestion.type || "Network");
        setNewLogSeverity(suggestion.severity || "Medium");
        setNewLogDesc(suggestion.desc || "");
        if (suggestion.computer_name) setNewLogComputer(suggestion.computer_name);
        setOpenAddLog(true);
    }, []);

    const smartSuggestions = useMemo(() => {
        if (!ip) return [];

        const list = [];
        const host = deviceInfo?.hostname || netInfo?.hostname || `pc-${ip}`;

        // Reachability / ping
        if (netInfo?.reachable === false) {
            list.push({
                key: "offline",
                type: "Network",
                severity: "Critical",
                title: "Add: Device offline",
                desc: `Device appears offline. ${netInfo?.reason ? `Reason: ${netInfo.reason}` : "Ping/diagnostics unreachable."}`,
                computer_name: host,
            });
            return list;
        }

        // Port-based suggestions
        const portsObj = netInfo?.ports && typeof netInfo.ports === "object" ? netInfo.ports : null;
        const isClosed = (p) => portsObj ? (portsObj[String(p)] === false || portsObj[p] === false) : false;
        const isOpen = (p) => portsObj ? (portsObj[String(p)] === true || portsObj[p] === true) : false;

        if (portsObj && isClosed(8000) && (isOpen(80) || isOpen(443) || netInfo?.reachable === true)) {
            list.push({
                key: "svc8000",
                type: "Software",
                severity: "Medium",
                title: "Add: Service down (8000)",
                desc: "Device reachable but port 8000 appears closed. Service may be down or blocked by firewall.",
                computer_name: host,
            });
        }

        // High loss/latency
        const loss = Number(netInfo?.packet_loss_pct);
        const latency = Number(netInfo?.latency_ms);

        if (Number.isFinite(loss) && loss > 1) {
            list.push({
                key: "loss",
                type: "Network",
                severity: loss >= 5 ? "Critical" : "Medium",
                title: "Add: Packet loss",
                desc: `Packet loss detected (${fmtNum(loss, 1)}%). Check cable/Wi-Fi/router.`,
                computer_name: host,
            });
        }

        if (Number.isFinite(latency) && latency >= 150) {
            list.push({
                key: "latency",
                type: "Network",
                severity: "Medium",
                title: "Add: High latency",
                desc: `High latency detected (${fmtNum(latency)}ms). Possible congestion/weak signal.`,
                computer_name: host,
            });
        }

        // HTTP probe
        if (httpProbe && httpProbe.ok === false) {
            list.push({
                key: "httpfail",
                type: "Software",
                severity: "Medium",
                title: "Add: HTTP probe failed",
                desc: `HTTP probe failed. ${httpProbe.error || httpProbe.reason || "Service not responding correctly."}`,
                computer_name: host,
            });
        } else if (httpProbe && typeof httpProbe.status_code === "number" && httpProbe.status_code >= 400) {
            list.push({
                key: "httpstatus",
                type: "Software",
                severity: "Low",
                title: "Add: HTTP error status",
                desc: `HTTP returned status ${httpProbe.status_code}.`,
                computer_name: host,
            });
        }

        return list;
    }, [ip, deviceInfo?.hostname, netInfo, httpProbe]);

    // ------------------------------------------------------
    // Fetch device info (real)
    // ------------------------------------------------------
    const fetchDeviceInfo = useCallback(async (targetIp) => {
        setDeviceLoading(true);
        setDeviceError("");
        try {
            const res = await api.get(`/devices/${targetIp}`);

            setDeviceInfo(res.data);
        } catch (e) {
            setDeviceInfo(null);

            const status = e?.response?.status;
            const data = e?.response?.data;

            if (status === 404) {
                setDeviceError("Device not found for this IP.");
            } else if (status === 403) {
                setDeviceError("No permission to view device info.");
            } else {
                setDeviceError(
                    `Failed to load device info. ${status ? `Status: ${status}` : ""} ${data ? `Response: ${JSON.stringify(data)}` : ""}`
                );
            }
        } finally {
            setDeviceLoading(false);
        }
    }, []);

    const createDevice = useCallback(async () => {
        if (!ip) {
            alert("Please enter an IP address.");
            return;
        }

        setCreatingDevice(true);
        try {
            await api.post("/devices/", {
                ip,
                hostname: createHostname || `device-${ip.replaceAll(".", "-")}`,
                disk_health: { ssd: 100 },
            });

            setDeviceError("");
            setCreateHostname("");
            await fetchDeviceInfo(ip);

            await api.post(`/devices/${ip}/ping`);
            await fetchDeviceInfo(ip);
        } catch (e) {
            setDeviceError("Create Device has failed (IP might already exist or need permissions).");
        } finally {
            setCreatingDevice(false);
        }
    }, [ip, createHostname, fetchDeviceInfo]);

    const pingNow = useCallback(
        async (targetIp) => {
            if (!targetIp) return;

            setDeviceLoading(true);
            setDeviceError("");
            try {
                await api.post(`/devices/${targetIp}/ping`);
                await fetchDeviceInfo(targetIp);

                // Also refresh connectivity (keeps page “real” even without agent)
                fetchConnectivity(targetIp);
            } catch (e) {
                setDeviceError("Ping has failed (permissions / endpoint).");
            } finally {
                setDeviceLoading(false);
            }
        },
        [fetchDeviceInfo, fetchConnectivity]
    );

    // ------------------------------------------------------
    // Diagnostics (real)
    // ------------------------------------------------------
    const runDiagnostics = useCallback(async (targetIp) => {
        setOpenDiag(true);
        setDiagLoading(true);
        setDiagData(null);
        setDiagErr("");

        try {
            const res = await api.post(`/devices/${targetIp}/diagnostics`);
            setDiagData(res.data);
        } catch (e) {
            setDiagErr("Diagnostics has faild (endpoint/permissions).");
        } finally {
            setDiagLoading(false);
        }
    }, []);

    // ------------------------------------------------------
    // SEARCH FUNCTION
    // ------------------------------------------------------
    const search = useCallback(async () => {
        // ⭐ DEMO ONLY MODE (kept as comments)
        // if (showDemoOnly) { ... }

        if (!ip) {
            alert("Please enter an IP address.");
            return;
        }

        fetchDeviceInfo(ip);
        fetchConnectivity(ip);

        const res = await api.get("/logs/search", { params: { ip } });

        let realLogs = res.data.map((log) => ({
            ...log,
            is_real: !log.source,
            is_json: log.source === "json",
        }));

        if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
        if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

        setResults(realLogs);
    }, [ip, errorType, severityFilter, setResults, fetchDeviceInfo, fetchConnectivity]);

    // ------------------------------------------------------
    // RESET
    // ------------------------------------------------------
    const reset = () => {
        setIp("");
        setErrorType("");
        setSeverityFilter("");
        setResults([]);
        setDeviceInfo(null);
        setDeviceError("");
        setCreateHostname("");
        setNewLogType("Hardware");
        setNewLogSeverity("Low");
        setNewLogDesc("");
        setAddLogErr("");

        // connectivity resets
        setNetInfo(null);
        setNetError("");
        setHttpProbe(null);
        setHttpErr("");
        setDiagData(null);
        setDiagErr("");
    };

    // ------------------------------------------------------
    // DELETE HANDLER (kept as comments - old logs list UI)
    // ------------------------------------------------------
    // const handleDelete = async (log) => { ... };

    const refreshLogsForIP = useCallback(
        async (targetIp) => {
            if (!targetIp) return;

            const res = await api.get("/logs/search", { params: { ip: targetIp } });

            let realLogs = res.data.map((log) => ({
                ...log,
                is_real: !log.source,
                is_json: log.source === "json",
            }));

            if (errorType) realLogs = realLogs.filter((l) => l.error_type === errorType);
            if (severityFilter) realLogs = realLogs.filter((l) => l.severity === severityFilter);

            setResults(realLogs);
        },
        [errorType, severityFilter, setResults]
    );

    const addNewLog = useCallback(async () => {
        setAddLogErr("");
        setAddingLog(true);

        if (!ip) {
            setAddLogErr("Enter IP first then add Log.");
            setAddingLog(false);
            return false;
        }
        if (!newLogDesc.trim()) {
            setAddLogErr("Must add Description.");
            setAddingLog(false);
            return false;
        }

        try {
            await api.post("/logs/", {
                computer_name: newLogComputer?.trim() || deviceInfo?.hostname || netInfo?.hostname || `pc-${ip}`,
                ip,
                error_type: newLogType,
                severity: newLogSeverity,
                description: newLogDesc.trim(),
            });

            setNewLogDesc("");
            await refreshLogsForIP(ip);
            return true;
        } catch (e) {
            const detail = e?.response?.data?.detail;
            setAddLogErr(detail ? JSON.stringify(detail, null, 2) : "Failed to add Log (Check Token/Server.");
            return false;
        } finally {
            setAddingLog(false);
        }
    }, [
        ip,
        newLogType,
        newLogSeverity,
        newLogDesc,
        newLogComputer,
        deviceInfo?.hostname,
        netInfo?.hostname,
        refreshLogsForIP,
    ]);

    const metrics = useMemo(() => {
        const cpu = deviceInfo?.cpu_temp ?? null;
        const gpu = deviceInfo?.gpu_temp ?? null;
        const ram = deviceInfo?.ram_used ?? null;
        const ssd = deviceInfo?.disk_health?.ssd ?? null;

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
    }, [deviceInfo]);

    // NEW: connectivity metrics shown במקום הקיים (בלי להרוס את המבנה)
    const netMetrics = useMemo(() => {
        const latency = netInfo?.latency_ms ?? null;
        const loss = netInfo?.packet_loss_pct ?? null;
        const jitter = netInfo?.jitter_ms ?? null;

        const portsObj = netInfo?.ports && typeof netInfo.ports === "object" ? netInfo.ports : null;
        const openCount = portsObj ? Object.values(portsObj).filter((v) => v === true).length : null;

        return {
            latency: fmtNum(latency),
            loss: loss === null || loss === undefined ? null : fmtNum(loss, 1),
            jitter: fmtNum(jitter),
            openCount,
            latencyTone: metricTone("latencyMs", Number(latency)),
            lossTone: metricTone("lossPct", Number(loss)),
            jitterTone: metricTone("jitterMs", Number(jitter)),
            portsTone: metricTone("portsOpen", Number(openCount)),
        };
    }, [netInfo]);

    const portsForRender = useMemo(() => {
        const portsObj = netInfo?.ports && typeof netInfo.ports === "object" ? netInfo.ports : null;
        if (!portsObj) return [];
        // stable order: by parsedPorts, then any extras
        const base = parsedPorts.map((p) => [String(p), portsObj[String(p)] ?? portsObj[p]]);
        const extras = Object.keys(portsObj)
            .filter((k) => !parsedPorts.map(String).includes(String(k)))
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => [String(k), portsObj[k]]);
        return [...base, ...extras].filter(([k]) => k !== "undefined");
    }, [netInfo, parsedPorts]);

    // ------------------------------------------------------
    // RENDER UI
    // ------------------------------------------------------
    return (
        <Box className="lv-page">
            <Box className="lv-hero">
                <Box>
                    <Typography variant="h4" className="lv-hero__title" sx={{ color: textColor }}>
                        DIAGNOSTICS WORKSTATION
                    </Typography>
                    <Typography className="lv-hero__subtitle" sx={{ color: textColor }}>
                        Search by IP and run live diagnostics, connectivity checks, and risk triage.
                    </Typography>
                </Box>
            </Box>

            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", lg: "1.05fr 1fr" },
                    gap: 2,
                }}
            >
                <Paper className="lv-panel">
                    <Typography variant="h6" sx={{ color: textColor, mb: 2, fontWeight: 800 }}>
                        Search & Filters
                    </Typography>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                        <TextField
                            label="IP Address"
                            value={ip}
                            onChange={(e) => setIp(e.target.value)}
                            fullWidth
                        />

                        <TextField
                            label="Ports to check (TCP)"
                            value={portsStr}
                            onChange={(e) => setPortsStr(e.target.value)}
                            fullWidth
                            placeholder="80,443,22,8000"
                        />

                        <TextField
                            label="Error Type"
                            value={errorType}
                            onChange={(e) => setErrorType(e.target.value)}
                            select
                            fullWidth
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Hardware">Hardware</MenuItem>
                            <MenuItem value="Software">Software</MenuItem>
                            <MenuItem value="Network">Network</MenuItem>
                        </TextField>

                        <TextField
                            label="Severity"
                            value={severityFilter}
                            onChange={(e) => setSeverityFilter(e.target.value)}
                            select
                            fullWidth
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="Critical">Critical</MenuItem>
                            <MenuItem value="Medium">Medium</MenuItem>
                            <MenuItem value="Low">Low</MenuItem>
                        </TextField>
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mt: 2 }}>
                        <Button
                            variant="contained"
                            onClick={() => setOpenAddLog(true)}
                            sx={{
                                py: 1.2,
                                fontWeight: 900,
                                background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                            }}
                        >
                            + Add New Log
                        </Button>
                        <Button
                            variant="contained"
                            onClick={search}
                            sx={{
                                py: 1.2,
                                background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                                fontWeight: "bold",
                            }}
                        >
                            Run Search
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ py: 1.1, fontWeight: "bold", borderColor: "#7c3aed", color: "#7c3aed" }}
                            onClick={reset}
                        >
                            Reset Console
                        </Button>
                    </Box>
                </Paper>

                {/* HARDWARE PANEL */}
                {(deviceLoading || deviceInfo || deviceError || netLoading || netInfo || netError || httpLoading || httpProbe || httpErr) && (
                    <Paper className="lv-panel">
                    <Box display="flex" justifyContent="space-between" alignItems="center" gap={2} flexWrap="wrap">
                        <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
                            Log Status
                        </Typography>

                        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                            {(netInfo?.ip || deviceInfo?.ip) && (
                                <Chip
                                    label={
                                        netInfo
                                            ? (netInfo.reachable === false ? "OFFLINE" : "ONLINE")
                                            : (deviceInfo?.online ? "ONLINE" : "OFFLINE")
                                    }
                                    sx={{
                                        fontWeight: 900,
                                        borderRadius: "999px",
                                        color:
                                            (netInfo ? (netInfo.reachable !== false) : deviceInfo?.online)
                                                ? "#052e16"
                                                : "#450a0a",
                                        background:
                                            (netInfo ? (netInfo.reachable !== false) : deviceInfo?.online)
                                                ? "rgba(34,197,94,0.22)"
                                                : "rgba(239,68,68,0.22)",
                                        border:
                                            (netInfo ? (netInfo.reachable !== false) : deviceInfo?.online)
                                                ? "1px solid rgba(34,197,94,0.35)"
                                                : "1px solid rgba(239,68,68,0.35)",
                                    }}
                                />
                            )}

                            {!showDemoOnly && (deviceInfo?.ip || ip) && (
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                        const target = deviceInfo?.ip || ip;
                                        if (!target) return;
                                        fetchDeviceInfo(target);
                                        fetchConnectivity(target);
                                    }}
                                >
                                    Refresh Hardware
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => pingNow(deviceInfo?.ip || ip)}
                                disabled={deviceLoading || (!deviceInfo?.ip && !ip) || !isAdmin || showDemoOnly}
                            >
                                Ping now
                            </Button>

                            {!showDemoOnly && (deviceInfo?.ip || ip) && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => runDiagnostics(deviceInfo?.ip || ip)}
                                    sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
                                >
                                    Run Diagnostics
                                </Button>
                            )}
                        </Box>
                    </Box>

                    <Divider sx={{ opacity: 0.2, my: 2 }} />

                    {(deviceLoading || netLoading) && (
                        <Box display="flex" alignItems="center" gap={2} sx={{ mb: 1 }}>
                            <CircularProgress size={18} />
                            <Typography sx={{ color: textColor, opacity: 0.8 }}>
                                Loading device/connectivity info...
                            </Typography>
                        </Box>
                    )}

                    {/* Errors */}
                    {!!deviceError && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ color: textColor, opacity: 0.85 }}>
                                {deviceError}
                            </Typography>
                        </Box>
                    )}

                    {!!netError && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ color: textColor, opacity: 0.85 }}>
                                {netError}
                            </Typography>
                        </Box>
                    )}

                    {!!httpErr && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={{ color: textColor, opacity: 0.85 }}>
                                {httpErr}
                            </Typography>
                        </Box>
                    )}

                    {/* Create device block kept (only shown when deviceError and admin) */}
                    {!!deviceError && isAdmin && (
                        <Paper
                            sx={{
                                p: 2,
                                borderRadius: "14px",
                                background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                border: "1px solid rgba(255,255,255,0.08)",
                                mb: 2,
                            }}
                        >
                            <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                Create Device
                            </Typography>

                            <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
                                no device was found in IP Diagnostics, Create a new log to view it
                            </Typography>

                            <TextField
                                label="Hostname (optional)"
                                value={createHostname}
                                onChange={(e) => setCreateHostname(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                            />

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={createDevice}
                                disabled={creatingDevice}
                                sx={{ py: 1.3, fontWeight: 900, background: "linear-gradient(90deg, #7c3aed, #8b5cf6)" }}
                            >
                                {creatingDevice ? "Creating..." : "Create Device"}
                            </Button>
                        </Paper>
                    )}

                    {/* MAIN INFO LINE */}
                    {(deviceInfo || netInfo) && !deviceLoading && (
                        <>
                            <Typography sx={{ color: textColor, opacity: 0.85, mb: 1 }}>
                                IP: <b>{deviceInfo?.ip || netInfo?.ip || ip || "—"}</b>
                                {(deviceInfo?.hostname || netInfo?.hostname) ? (
                                    <> • Hostname: <b>{deviceInfo?.hostname || netInfo?.hostname}</b></>
                                ) : null}
                            </Typography>

                            <Typography sx={{ color: textColor, opacity: 0.75, mb: 2, fontSize: 13 }}>
                                Last Ping: <b>{fmtTime(deviceInfo?.last_ping)}</b>
                                {"  "} • {"  "}
                                Last Update: <b>{fmtTime(deviceInfo?.last_update)}</b>
                                {"  "} • {"  "}
                                Last Connectivity Check: <b>{fmtTime(netInfo?.checked_at)}</b>
                            </Typography>

                            {/* במקום הישן: נציג נתונים אמיתיים בלי Agent (Connectivity + TCP ports) */}
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
                                <MetricCard label="Latency" value={netMetrics.latency} unit="ms" tone={netMetrics.latencyTone} />
                                <MetricCard label="Packet Loss" value={netMetrics.loss} unit="%" tone={netMetrics.lossTone} />
                                <MetricCard label="Jitter" value={netMetrics.jitter} unit="ms" tone={netMetrics.jitterTone} />
                                <MetricCard label="Open Ports" value={netMetrics.openCount} unit="" tone={netMetrics.portsTone} />
                            </Box>

                            {/* TCP Port check chips */}
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                    TCP Port Check
                                </Typography>

                                {portsForRender.length === 0 ? (
                                    <Typography sx={{ color: textColor, opacity: 0.8, fontSize: 13 }}>
                                        No port results yet. Run Search or Refresh.
                                    </Typography>
                                ) : (
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {portsForRender.map(([p, ok]) => (
                                            <Chip
                                                key={p}
                                                label={`${p}: ${ok === true ? "OPEN" : ok === false ? "CLOSED" : "—"}`}
                                                sx={{
                                                    borderRadius: "999px",
                                                    fontWeight: 900,
                                                    background:
                                                        ok === true
                                                            ? "rgba(34,197,94,0.20)"
                                                            : ok === false
                                                                ? "rgba(239,68,68,0.20)"
                                                                : (mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                                                    border:
                                                        ok === true
                                                            ? "1px solid rgba(34,197,94,0.35)"
                                                            : ok === false
                                                                ? "1px solid rgba(239,68,68,0.35)"
                                                                : "1px solid rgba(148,163,184,0.25)",
                                                    color: textColor,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            {/* OPTION 4: HTTP Probe display */}
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                    HTTP Probe
                                </Typography>

                                {httpLoading ? (
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <CircularProgress size={18} />
                                        <Typography sx={{ color: textColor, opacity: 0.8 }}>Probing HTTP...</Typography>
                                    </Box>
                                ) : httpProbe ? (
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                                        <Chip
                                            label={httpProbe.ok ? "OK" : "FAILED"}
                                            sx={{
                                                fontWeight: 900,
                                                borderRadius: "999px",
                                                color: httpProbe.ok ? "#052e16" : "#450a0a",
                                                background: httpProbe.ok ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
                                                border: httpProbe.ok ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(239,68,68,0.35)",
                                            }}
                                        />
                                        {typeof httpProbe.status_code === "number" && (
                                            <Chip
                                                label={`Status: ${httpProbe.status_code}`}
                                                sx={{
                                                    borderRadius: "999px",
                                                    fontWeight: 900,
                                                    background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: textColor,
                                                }}
                                            />
                                        )}
                                        {typeof httpProbe.response_ms === "number" && (
                                            <Chip
                                                label={`Response: ${fmtNum(httpProbe.response_ms)}ms`}
                                                sx={{
                                                    borderRadius: "999px",
                                                    fontWeight: 900,
                                                    background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: textColor,
                                                }}
                                            />
                                        )}
                                        {httpProbe.url ? (
                                            <Typography sx={{ color: textColor, opacity: 0.8, fontSize: 13 }}>
                                                URL: <b>{httpProbe.url}</b>
                                            </Typography>
                                        ) : null}
                                    </Box>
                                ) : (
                                    <Typography sx={{ color: textColor, opacity: 0.8, fontSize: 13 }}>
                                        No HTTP probe data yet (will auto-run if an HTTP port is open).
                                    </Typography>
                                )}

                                <Box sx={{ display: "flex", gap: 1, mt: 1.2, flexWrap: "wrap" }}>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => runHttpProbe(deviceInfo?.ip || netInfo?.ip || ip, {})}
                                        disabled={!ip}
                                    >
                                        Probe now
                                    </Button>
                                </Box>
                            </Box>

                            {/* OPTION 3: Last Logs Snapshot */}
                            <Box sx={{ mb: 2 }}>
                                <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                    Last Logs Snapshot
                                </Typography>

                                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                                    <MetricCard
                                        label="Logs found"
                                        value={logsSnapshot.total}
                                        unit=""
                                        tone={logsSnapshot.total > 0 ? "good" : "neutral"}
                                    />
                                    <MetricCard
                                        label="Top Error Type"
                                        value={logsSnapshot.topType || "—"}
                                        unit=""
                                        tone={logsSnapshot.topType ? "warn" : "neutral"}
                                    />
                                    <MetricCard
                                        label="Last Log Time"
                                        value={logsSnapshot.lastTime ? fmtTime(logsSnapshot.lastTime) : "—"}
                                        unit=""
                                        tone={logsSnapshot.lastTime ? "good" : "neutral"}
                                    />
                                    <MetricCard
                                        label="Last Critical"
                                        value={logsSnapshot.lastCritical ? "Yes" : "No"}
                                        unit=""
                                        tone={logsSnapshot.lastCritical ? "bad" : "good"}
                                    />
                                </Box>
                            </Box>

                            {/* OPTION 5: Smart Suggestions */}
                            {smartSuggestions.length > 0 && (
                                <Box sx={{ mb: 1 }}>
                                    <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                        Smart Suggestions
                                    </Typography>

                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {smartSuggestions.map((s) => (
                                            <Button
                                                key={s.key}
                                                size="small"
                                                variant="contained"
                                                onClick={() => suggestLog(s)}
                                                sx={{
                                                    fontWeight: 900,
                                                    background: "linear-gradient(90deg, #7c3aed, #8b5cf6)",
                                                }}
                                            >
                                                {s.title}
                                            </Button>
                                        ))}
                                    </Box>
                                </Box>
                            )}

                            {/* Disk health kept as-is (if exists) */}
                            {deviceInfo?.disk_health && typeof deviceInfo.disk_health === "object" && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography sx={{ color: textColor, fontWeight: 900, mb: 1 }}>
                                        Disk Health Details
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                        {Object.entries(deviceInfo.disk_health).map(([k, v]) => (
                                            <Chip
                                                key={k}
                                                label={`${k}: ${v}`}
                                                sx={{
                                                    borderRadius: "999px",
                                                    fontWeight: 800,
                                                    background: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                                                    color: textColor,
                                                }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            )}
                        </>
                    )}
                    </Paper>
                )}
            </Box>

            {/* RESULTS TITLE */}
            <Box sx={{ display: "grid", gap: 2 }}>
                <Typography variant="h5" sx={{ color: textColor }}>
                    Results
                </Typography>

                {/* RISK SUMMARY BAR */}
                <Paper
                    className="lv-panel"
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        flexWrap: "wrap",
                    }}
                >
                    <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
                        <Typography sx={{ color: textColor, fontWeight: 900 }}>
                            Risk Summary:
                        </Typography>

                    <Chip
                        label={`Critical: ${riskSummary.counts.Critical}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(239,68,68,0.18)",
                            border: "1px solid rgba(239,68,68,0.30)",
                            color: textColor,
                        }}
                    />
                    <Chip
                        label={`Medium: ${riskSummary.counts.Medium}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(250,204,21,0.18)",
                            border: "1px solid rgba(250,204,21,0.30)",
                            color: textColor,
                        }}
                    />
                    <Chip
                        label={`Low: ${riskSummary.counts.Low}`}
                        sx={{
                            fontWeight: 900,
                            borderRadius: "999px",
                            background: "rgba(74,222,128,0.18)",
                            border: "1px solid rgba(74,222,128,0.30)",
                            color: textColor,
                        }}
                    />
                </Box>

                <Box sx={{ textAlign: "right" }}>
                    <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 12, opacity: 0.85 }}>
                        Overall risk score
                    </Typography>
                    <Typography sx={{ color: textColor, fontWeight: 1000, fontSize: 22, lineHeight: 1 }}>
                        {riskSummary.score100}
                        <span style={{ fontSize: 12, fontWeight: 900, opacity: 0.8 }}> / 100</span>
                    </Typography>
                </Box>
                </Paper>

                {/* RESULTS LIST — RISKS (No Demo) */}
                <Paper className="lv-panel">
                {risks.length === 0 ? (
                    <Typography sx={{ color: textColor }}>No risks detected for this IP.</Typography>
                ) : (
                    risks.map((r) => (
                        <Box
                            key={r.id}
                            sx={{
                                p: 2.5,
                                mb: 2,
                                borderRadius: "12px",
                                background: mode === "dark" ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                                borderLeft: `6px solid ${severityColor[r.severity] || severityColor.unknown}`,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography
                                    sx={{
                                        fontWeight: 900,
                                        fontSize: 16,
                                        color: textColor,
                                        mb: 0.4,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        flexWrap: "wrap",
                                    }}
                                >
                                    {r.title}
                                    <span style={severityBadge(r.severity)}>{r.severity}</span>
                                    <span style={demoBadge}>
                                        {r.source === "hardware" ? "HARDWARE" : r.source === "connectivity" ? "CONNECTIVITY" : "LOG"}
                                    </span>
                                    {r.is_json ? <span style={demoBadge}>JSON</span> : null}
                                </Typography>

                                <Typography sx={{ opacity: 0.85, color: textColor }}>{r.detail}</Typography>
                            </Box>

                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
                                {(r.source === "hardware" || r.source === "connectivity") && (deviceInfo?.ip || ip) && (
                                    <>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => pingNow(deviceInfo?.ip || ip)}
                                            disabled={!isAdmin || showDemoOnly}
                                        >
                                            Ping
                                        </Button>

                                        <Button
                                            variant="contained"
                                            size="small"
                                            sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 800 }}
                                            onClick={() => runDiagnostics(deviceInfo?.ip || ip)}
                                            disabled={!isAdmin || showDemoOnly}
                                        >
                                            Diagnostics
                                        </Button>

                                        {/* Quick add suggestion from a risk card (OPTION 5) */}
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                // minimal mapping into log prefill
                                                const guessType =
                                                    r.kind?.includes("http") ? "Software" :
                                                        r.kind?.includes("port") ? "Software" :
                                                            "Network";

                                                suggestLog({
                                                    type: guessType,
                                                    severity: r.severity,
                                                    title: "Prefill",
                                                    desc: `${r.title}: ${r.detail}`,
                                                    computer_name: deviceInfo?.hostname || netInfo?.hostname || `pc-${ip}`,
                                                });
                                            }}
                                        >
                                            + Log
                                        </Button>
                                    </>
                                )}

                                {/* {r.source === "log" && r.is_real && (
  <Button
    variant="contained"
    size="small"
    onClick={(e) => {
      e.stopPropagation?.(); // אם בעתיד כל הכרטיס יהיה קליקבילי
      navigate(`/issue/${r.logId}`);
    }}
  >
    VIEW
  </Button>
)} */}

                                {r.source === "log" && r.is_real && !r.is_json && (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation?.();
                                            navigate(`/issue/${r.logId}`);
                                        }}
                                    >
                                        VIEW
                                    </Button>
                                )}
                            </Box>
                        </Box>
                    ))
                )}
                </Paper>
            </Box>

            {/* ---------------- Add Log Modal ---------------- */}
            <Modal open={openAddLog} onClose={() => setOpenAddLog(false)}>
                <Box sx={{ ...modalStyle, width: "720px", maxWidth: "92vw" }}>
                    <Paper
                        sx={{
                            width: "100%",
                            padding: 3,
                            background: bgCard,
                            borderRadius: "18px",
                            border: "1px solid rgba(255,255,255,0.10)",
                        }}
                    >
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography sx={{ color: textColor, fontWeight: 900, fontSize: 18 }}>
                                Add New Log
                            </Typography>

                            <Button variant="outlined" onClick={() => setOpenAddLog(false)}>
                                Close
                            </Button>
                        </Box>

                        <Typography sx={{ color: textColor, opacity: 0.75, fontSize: 13, mb: 2 }}>
                            Pay attention: new log of the chosen IP will be added to the DB
                        </Typography>

                        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mb: 1.5 }}>
                            <TextField
                                label="Computer Name"
                                value={newLogComputer}
                                onChange={(e) => setNewLogComputer(e.target.value)}
                                fullWidth
                            />

                            <TextField
                                label="Error Type"
                                value={newLogType}
                                onChange={(e) => setNewLogType(e.target.value)}
                                select
                                fullWidth
                            >
                                <MenuItem value="Hardware">Hardware</MenuItem>
                                <MenuItem value="Software">Software</MenuItem>
                                <MenuItem value="Network">Network</MenuItem>
                            </TextField>

                            <TextField
                                label="Severity"
                                value={newLogSeverity}
                                onChange={(e) => setNewLogSeverity(e.target.value)}
                                select
                                fullWidth
                                sx={{ gridColumn: "1 / span 1" }}
                            >
                                <MenuItem value="Critical">Critical</MenuItem>
                                <MenuItem value="Medium">Medium</MenuItem>
                                <MenuItem value="Low">Low</MenuItem>
                            </TextField>
                        </Box>

                        <TextField
                            label="Description"
                            value={newLogDesc}
                            onChange={(e) => setNewLogDesc(e.target.value)}
                            fullWidth
                            multiline
                            minRows={3}
                            sx={{ mb: 1.5 }}
                        />

                        {!!addLogErr && (
                            <Typography sx={{ color: "#fecaca", fontWeight: 800, mb: 1 }}>
                                {addLogErr}
                            </Typography>
                        )}

                        <Button
                            variant="contained"
                            fullWidth
                            onClick={async () => {
                                const ok = await addNewLog();
                                if (ok) setOpenAddLog(false);
                            }}
                            disabled={addingLog}
                        >
                            {addingLog ? "Adding..." : "Add Log"}
                        </Button>

                        <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                            <Button variant="outlined" size="small" onClick={() => refreshLogsForIP(ip)} disabled={!ip}>
                                Refresh Results
                            </Button>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setNewLogType("Hardware");
                                    setNewLogSeverity("Low");
                                    setNewLogDesc("");
                                    setAddLogErr("");
                                }}
                            >
                                Clear Form
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Modal>

            {/* ---------------- Diagnostics Modal ---------------- */}
            <Modal open={openDiag} onClose={() => setOpenDiag(false)}>
                <Box sx={modalStyle}>
                    <Typography sx={{ color: "#e5e7eb", fontWeight: 900, fontSize: 18, mb: 1 }}>
                        Diagnostics
                    </Typography>

                    <Typography sx={{ color: "#e5e7eb", opacity: 0.8, mb: 2 }}>
                        IP: <b>{ip || diagData?.ip || deviceInfo?.ip || "—"}</b>
                    </Typography>

                    {diagLoading && (
                        <Box display="flex" alignItems="center" gap={2}>
                            <CircularProgress size={18} />
                            <Typography sx={{ color: "#e5e7eb", opacity: 0.85 }}>
                                Running diagnostics...
                            </Typography>
                        </Box>
                    )}

                    {!diagLoading && diagErr && (
                        <Typography sx={{ color: "#fecaca", fontWeight: 700 }}>
                            {diagErr}
                        </Typography>
                    )}

                    {!diagLoading && diagData && (
                        <>
                            <Paper
                                sx={{
                                    p: 2,
                                    borderRadius: 3,
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    mb: 2,
                                }}
                            >
                                <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                    Health Score
                                </Typography>
                                <Typography sx={{ color: "#a78bfa", fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
                                    {Math.round(diagData.health_score ?? 0)}%
                                </Typography>
                            </Paper>

                            <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                Checks
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                                <StatusChip ok={!!diagData?.diagnostic_report?.cpu_ok} label="CPU OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.gpu_ok} label="GPU OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.ram_ok} label="RAM OK" />
                                <StatusChip ok={!!diagData?.diagnostic_report?.storage_ok} label="Storage OK" />
                            </Box>

                            <Divider sx={{ opacity: 0.2, my: 2 }} />

                            <Typography sx={{ color: "#e5e7eb", fontWeight: 900, mb: 1 }}>
                                Live Metrics
                            </Typography>
                            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5, mb: 2 }}>
                                <MetricCard label="CPU Temp" value={metrics.cpu} unit="°C" tone={metrics.cpuTone} />
                                <MetricCard label="GPU Temp" value={metrics.gpu} unit="°C" tone={metrics.gpuTone} />
                                <MetricCard label="RAM Used" value={metrics.ram} unit="%" tone={metrics.ramTone} />
                                <MetricCard label="SSD Health" value={metrics.ssd} unit="%" tone={metrics.ssdTone} />
                            </Box>

                            <Button
                                variant="contained"
                                fullWidth
                                onClick={() => setOpenDiag(false)}
                                sx={{ background: "linear-gradient(90deg, #7c3aed, #8b5cf6)", fontWeight: 900 }}
                            >
                                Close
                            </Button>
                        </>
                    )}

                    {!diagLoading && !diagData && !diagErr && (
                        <Button variant="outlined" fullWidth onClick={() => setOpenDiag(false)}>
                            Close
                        </Button>
                    )}
                </Box>
            </Modal>
        </Box>
    );
}
