import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
// import Layout from "../components/Layout";
import { Paper, Typography } from "@mui/material";

export default function ViewLog() {
    const { id } = useParams();
    const [log, setLog] = useState(null);

    useEffect(() => {
        const fetchLog = async () => {
            const res = await api.get(`/logs/${id}`);
            setLog(res.data);
        };
        fetchLog();
    }, [id]);

    if (!log) return <p>Loading...</p>;

    return (
        // <Layout>
        <Paper sx={{ padding: 3, maxWidth: 600 }}>
            <Typography variant="h4" mb={2}>Log Details</Typography>
            <p><b>Computer:</b> {log.computer_name}</p>
            <p><b>IP:</b> {log.ip}</p>
            <p><b>Error Type:</b> {log.error_type}</p>
            <p><b>Description:</b> {log.description}</p>
            <p><b>Status:</b> {log.status}</p>
        </Paper>
        // </Layout> 
    );
}
