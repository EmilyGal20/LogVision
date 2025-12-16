// components/Terminal.jsx
import { useState } from "react";
import { Box } from "@mui/material";

export default function Terminal() {
    const [lines, setLines] = useState(["LogVision OS Terminal"]);
    const [input, setInput] = useState("");

    const run = (cmd) => {
        if (cmd === "help") return "help, clear, status, logs";
        if (cmd === "status") return "WS: connected | API: OK";
        if (cmd === "logs") return "2 active issues";
        if (cmd === "clear") {
            setLines([]);
            return "";
        }
        return "command not found";
    };

    return (
        <Box
            sx={{
                fontFamily: "monospace",
                fontSize: 13,
                color: "#7ee787",
            }}
        >
            {lines.map((l, i) => (
                <div key={i}>{l}</div>
            ))}

            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        const out = run(input);
                        setLines((prev) =>
                            [...prev, `> ${input}`, out].filter(Boolean)
                        );
                        setInput("");
                    }
                }}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "#7ee787",
                    width: "100%",
                    outline: "none",
                }}
            />
        </Box>
    );
}
