// components/BootScreen.jsx
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function BootScreen() {
    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                background: "#000",
                color: "#7ee787",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "monospace",
            }}
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
            >
                <Typography>LOGVISION OS</Typography>
                <Typography fontSize={12} mt={1}>
                    booting system...
                </Typography>
            </motion.div>
        </Box>
    );
}
