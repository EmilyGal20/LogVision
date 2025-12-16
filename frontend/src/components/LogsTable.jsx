import { useEffect, useState } from "react";
import { api } from "../api";
import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { exportLogsExcel } from "../utils/exportExcel";
import { exportLogsPDF } from "../utils/exportPDF";

export default function LogsTable() {
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    const loadLogs = async () => {
        const res = await api.get("/logs");
        setLogs(res.data);
    };

    const deleteLog = async (id) => {
        await api.delete(`/logs/${id}`);
        loadLogs();
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const columns = [
        { field: "id", headerName: "ID", width: 70 },
        { field: "computer_name", headerName: "Computer", width: 150 },
        { field: "ip", headerName: "IP", width: 120 },
        { field: "error_type", headerName: "Error Type", width: 130 },
        { field: "status", headerName: "Status", width: 120 },
        {
            field: "actions",
            headerName: "Actions",
            width: 300,
            renderCell: (params) => (
                <>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/log/${params.row.id}`)}
                        sx={{ mr: 1 }}
                    >
                        View
                    </Button>

                    <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/edit-log/${params.row.id}`)}
                        sx={{ mr: 1 }}
                    >
                        Edit
                    </Button>

                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => deleteLog(params.row.id)}
                    >
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div style={{ height: 500, width: "100%" }}>
            <DataGrid rows={logs} columns={columns} pageSize={7} />
            <Button onClick={() => exportLogsPDF(logs)}>Export PDF</Button>
            <Button onClick={() => exportLogsExcel(logs)}>Export Excel</Button>

        </div>
    );
}
