import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
// import Layout from "../components/Layout";
import { Paper, TextField, MenuItem, Button } from "@mui/material";

export default function EditLog() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("");

    useEffect(() => {
        const fetchLog = async () => {
            const res = await api.get(`/logs/${id}`);
            setStatus(res.data.status);
        };
        fetchLog();
    }, [id]);

    const updateStatus = async () => {
        await api.put(`/logs/${id}`, { status });
        navigate("/logs");
    };

    return (
        // <Layout>
        <Paper sx={{ padding: 3, maxWidth: 400 }}>
            <TextField
                select
                label="Log Status"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
            >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
            </TextField>

            <Button sx={{ mt: 2 }} variant="contained" onClick={updateStatus}>
                Save
            </Button>
        </Paper>
        // </Layout>
    );
}
