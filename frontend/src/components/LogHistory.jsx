import { Paper, Typography } from "@mui/material";

export default function LogHistory({ history }) {
    return (
        <Paper sx={{ padding: 2 }}>
            <Typography variant="h6" mb={2}>History</Typography>

            {history.length === 0 ? (
                <p>No history.</p>
            ) : (
                history.map((h) => (
                    <p key={h.id}>
                        [{h.timestamp}] Status changed to: <b>{h.status}</b>
                    </p>
                ))
            )}
        </Paper>
    );
}
