import { DataGrid } from "@mui/x-data-grid";
import { Button } from "@mui/material";
import { api } from "../api";

export default function UserTable({ users, reload }) {
    const deleteUser = async (id) => {
        await api.delete(`/users/${id}`);
        reload();
    };

    const columns = [
        { field: "id", headerName: "ID", width: 60 },
        { field: "username", headerName: "Username", width: 150 },
        { field: "role", headerName: "Role", width: 120 },
        {
            field: "actions",
            headerName: "Actions",
            width: 250,
            renderCell: (params) => (
                <>
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => alert("Edit user coming soon")}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => deleteUser(params.row.id)}
                    >
                        Delete
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div style={{ height: 400, width: "100%" }}>
            <DataGrid rows={users} columns={columns} pageSize={5} />
        </div>
    );
}
