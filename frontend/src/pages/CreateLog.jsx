import { useState, useMemo } from "react";
import {
    Box,
    Paper,
    TextField,
    Button,
    MenuItem,
    Typography,
} from "@mui/material";
import { api } from "../api";
import { isValidMac, normalizeMac } from "../utils/mac";

const TYPES = [
    "network",
    "hardware",
    "software",
    "security",
    "other",
];

export default function CreateLog() {
    const [ip, setIp] = useState("");
    const [mac, setMac] = useState("");
    const [hostname, setHostname] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [type, setType] = useState("hardware");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const macOk = useMemo(() => {
        if (!mac.trim()) return true;
        return isValidMac(mac);
    }, [mac]);

    const canSubmit = useMemo(() => {
        return (
            ip.trim() &&
            type &&
            message.trim() &&
            macOk &&
            !loading
        );
    }, [ip, type, message, macOk, loading]);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await api.post("/logs", {
                ip: ip.trim(),
                mac: mac.trim() ? normalizeMac(mac) : null,
                hostname: hostname.trim() || null,
                deviceName: deviceName.trim() || null,
                type,
                message: message.trim(),
            });

            // reset
            setIp("");
            setMac("");
            setHostname("");
            setDeviceName("");
            setType("hardware");
            setMessage("");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box>
            <Typography variant="h4" mb={3}>
                Create New Log
            </Typography>

            <Paper sx={{ p: 3, maxWidth: 520 }}>
                <TextField
                    fullWidth
                    label="IP Address"
                    value={ip}
                    onChange={(e) => setIp(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="MAC Address"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    error={!macOk}
                    helperText={!macOk ? "AA:BB:CC:DD:EE:FF" : " "}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Hostname"
                    value={hostname}
                    onChange={(e) => setHostname(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Device Name"
                    value={deviceName}
                    onChange={(e) => setDeviceName(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    select
                    fullWidth
                    label="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    sx={{ mb: 2 }}
                >
                    {TYPES.map((t) => (
                        <MenuItem key={t} value={t}>
                            {t}
                        </MenuItem>
                    ))}
                </TextField>

                <TextField
                    fullWidth
                    multiline
                    minRows={3}
                    label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    sx={{ mb: 3 }}
                />

                <Button
                    variant="contained"
                    fullWidth
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                >
                    Create Log
                </Button>
            </Paper>
        </Box>
    );
}
