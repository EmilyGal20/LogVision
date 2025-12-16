import { Paper, Typography, Box, Chip } from "@mui/material";
import { useThemeMode } from "../context/ThemeContext";

export default function AlertsPanel({ devices }) {
    const { mode } = useThemeMode();
    const textColor = mode === "dark" ? "#e5e7eb" : "#1f2937";

    const alerts = [];

    devices.forEach((d) => {
        if (!d.online) return;

        if (d.cpu_temp > 85)
            alerts.push({ ip: d.ip, type: "CPU Overheating", value: d.cpu_temp + "°C", severity: "high" });

        if (d.ram_used > 90)
            alerts.push({ ip: d.ip, type: "RAM Usage High", value: d.ram_used + "%", severity: "medium" });

        if (d.gpu_temp > 80)
            alerts.push({ ip: d.ip, type: "GPU Overheating", value: d.gpu_temp + "°C", severity: "high" });

        if (d.disk_health) {
            const vals = Object.values(d.disk_health);
            if (vals[0] < 70)
                alerts.push({ ip: d.ip, type: "Disk SMART Warning", value: vals[0] + "%", severity: "medium" });
        }
    });

    return (
        <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" sx={{ color: textColor }}>
                Alerts
            </Typography>

            {alerts.length === 0 && <Typography>No alerts 🎉</Typography>}

            {alerts.map((a, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                    <Chip
                        label={a.severity.toUpperCase()}
                        color={a.severity === "high" ? "error" : "warning"}
                    />
                    <Typography sx={{ color: textColor }}>
                        {a.ip} — {a.type} ({a.value})
                    </Typography>
                </Box>
            ))}
        </Paper>
    );
}
