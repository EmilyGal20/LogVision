import { createContext, useContext, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import usePersistentState from "../hooks/usePersistentState";

export const ThemeContext = createContext();

export default function CustomThemeProvider({ children }) {
    // ⭐ נשמר ב־localStorage
    const [mode, setMode] = usePersistentState("themeMode", "dark");

    // ⭐ מחלקות גלובליות תואמות ל־CSS (App.css)
    useEffect(() => {
        document.body.classList.remove("dark", "light-mode");

        if (mode === "dark") {
            document.body.classList.add("dark");       // ✅ תואם body.dark
        } else {
            document.body.classList.add("light-mode"); // ✅ תואם index.css
        }
    }, [mode]);

    // ⭐ Theme של MUI — לא נלחם ב־CSS
    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,

                    ...(mode === "light"
                        ? {
                            background: {
                                default: "#e8f0f9",
                                paper: "rgba(248, 251, 255, 0.9)",
                            },
                            text: {
                                primary: "#0f172a",
                                secondary: "#475569",
                            },
                            divider: "rgba(0,0,0,0.06)",
                            primary: { main: "#3b82f6" },
                            secondary: { main: "#0284c7" },
                        }
                        : {
                            // ❗ Dark Mode — CSS שולט
                            background: {
                                default: "transparent",
                                paper: "transparent",
                            },
                            text: {
                                primary: "#ffffff",
                                secondary: "#cccccc",
                            },
                            divider: "rgba(255,255,255,0.1)",
                        }),
                },

                typography: {
                    fontFamily: `"Inter","Segoe UI","Roboto",sans-serif`,
                    h4: {
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                    },
                    button: {
                        textTransform: "none",
                        fontWeight: 600,
                    },
                },

                components: {
                    MuiPaper: {
                        styleOverrides: {
                            root: {
                                backdropFilter: "blur(18px)",
                                borderRadius: "16px",
                                transition: "0.25s ease",
                                boxShadow:
                                    mode === "light"
                                        ? "0 4px 20px rgba(0,0,0,0.06)"
                                        : "none", // ❗ לא לצבוע ב־Dark
                            },
                        },
                    },

                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: "10px",
                                boxShadow:
                                    mode === "light"
                                        ? "0 2px 8px rgba(0,0,0,0.08)"
                                        : "none",
                            },
                        },
                    },
                },
            }),
        [mode]
    );

    // ⭐ Toggle אחיד וברור
    const toggleMode = () => {
        setMode((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleMode }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
}

export function useThemeMode() {
    return useContext(ThemeContext);
}
