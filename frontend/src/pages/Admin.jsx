import { useEffect } from "react";
import {
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Box,
} from "@mui/material";

import { api } from "../api";
import { motion } from "framer-motion";
import { useThemeMode } from "../context/ThemeContext";
import usePersistentState from "../hooks/usePersistentState";

export default function Admin() {
    // ⭐ LocalStorage state
    const [users, setUsers] = usePersistentState("admin-users", []);

    const { mode } = useThemeMode();

    // ======================================================
    // LOAD USERS (backend)
    // ======================================================
    const loadUsers = async () => {
        try {
            const res = await api.get("/users");
            setUsers(res.data); // updates localStorage too
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    // ======================================================
    // RUN ONCE ON PAGE LOAD
    // ======================================================
    useEffect(() => {
        // if there is no list in local so it loads from server
        if (users.length === 0) {
            loadUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // ↑ loads once with no warnings

    // ======================================================
    // DELETE USER
    // ======================================================
    const deleteUser = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            setUsers(users.filter((u) => u.id !== id)); // updates localStorage
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    // ======================================================
    // CHANGE ROLE
    // ======================================================
    const toggleRole = async (user) => {
        const newRole = user.role === "admin" ? "user" : "admin";

        try {
            await api.put(`/users/${user.id}`, { role: newRole });

            setUsers(
                users.map((u) =>
                    u.id === user.id ? { ...u, role: newRole } : u
                )
            );
        } catch (err) {
            console.error("Role update failed", err);
        }
    };

    // ======================================================
    // UI COLORS
    // ======================================================
    const tableBg = mode === "dark" ? "rgba(255,255,255,0.06)" : "#fafafa";
    const textColor = mode === "dark" ? "#e5e7eb" : "#111";

    return (
        <Box>
            <Typography variant="h4" mb={3} fontWeight="bold" sx={{ color: textColor }}>
                Admin Panel
            </Typography>

            <Paper
                sx={{
                    maxWidth: 800,
                    padding: 2,
                    borderRadius: 4,
                    background: tableBg,
                    backdropFilter: "blur(6px)",
                }}
            >
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ color: textColor }}>ID</TableCell>
                            <TableCell sx={{ color: textColor }}>Username</TableCell>
                            <TableCell sx={{ color: textColor }}>Email</TableCell>
                            <TableCell sx={{ color: textColor }}>Role</TableCell>
                            <TableCell sx={{ color: textColor }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {users.map((u, idx) => (
                            <motion.tr
                                key={u.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, delay: idx * 0.04 }}
                            >
                                <TableCell sx={{ color: textColor }}>{u.id}</TableCell>
                                <TableCell sx={{ color: textColor }}>{u.username}</TableCell>
                                <TableCell sx={{ color: textColor }}>{u.email || "-"}</TableCell>
                                <TableCell sx={{ color: textColor, fontWeight: "bold" }}>
                                    {u.role}
                                </TableCell>

                                <TableCell>
                                    <Box display="flex" gap={1}>
                                        <Button
                                            size="small"
                                            variant="contained"
                                            color="secondary"
                                            onClick={() => toggleRole(u)}
                                        >
                                            {u.role === "admin" ? "Demote" : "Make Admin"}
                                        </Button>

                                        <Button
                                            size="small"
                                            variant="outlined"
                                            color="error"
                                            onClick={() => deleteUser(u.id)}
                                        >
                                            Delete
                                        </Button>
                                    </Box>
                                </TableCell>
                            </motion.tr>
                        ))}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
