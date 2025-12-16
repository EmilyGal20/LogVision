// OSFrame.jsx
import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import BootScreen from "./BootScreen";
import WindowManager from "./WindowManager";

export default function OSFrame() {
    const [booted, setBooted] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setBooted(true), 2000);
        return () => clearTimeout(t);
    }, []);

    if (!booted) return <BootScreen />;

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                overflow: "hidden",
                background:
                    "radial-gradient(circle at top, #1a1f2b 0%, #05070d 70%)",
            }}
        >


            <WindowManager />
        </Box>
    );
}
