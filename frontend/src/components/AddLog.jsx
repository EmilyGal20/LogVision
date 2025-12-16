import { useState } from "react";
import { api } from "../api";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

export default function AddLog() {
    const [form, setForm] = useState({
        computer_name: "",
        ip: "",
        error_type: "",
        description: "",
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const sendForm = async () => {
        await api.post("/logs", form);
        alert("Log Added!");
    };

    return (
        <Paper elevation={3} sx={{ padding: 3, maxWidth: 600, margin: "20px auto" }}>
            <Typography variant="h5" fontWeight="bold" mb={2}>
                Add Log
            </Typography>

            <Box display="flex" flexDirection="column" gap={2}>
                <TextField label="Computer Name" name="computer_name" onChange={handleChange} />
                <TextField label="IP Address" name="ip" onChange={handleChange} />
                <TextField label="Error Type (Hardware / Software)" name="error_type" onChange={handleChange} />
                <TextField label="Description" name="description" multiline rows={3} onChange={handleChange} />

                <Button variant="contained" color="primary" onClick={sendForm}>
                    Submit
                </Button>
            </Box>
        </Paper>
    );
}
