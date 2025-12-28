import { createContext, useContext, useMemo, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import usePersistentState from "../hooks/usePersistentState";
import { StyledEngineProvider } from "@mui/material/styles";

export const ThemeContext = createContext();

export default function CustomThemeProvider({ children }) {
    const [mode, setMode] = usePersistentState("themeMode", "dark");

    useEffect(() => {
        document.body.classList.remove("dark", "light-mode");

        if (mode === "dark") {
            document.body.classList.add("dark");       // ✅ תואם body.dark
        } else {
            document.body.classList.add("light-mode"); // ✅ תואם index.css
        }
    }, [mode]);

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,

                    // ...(mode === "light"
                    //     ? {
                    //         background: {
                    //             default: "#e9edf4",
                    //             paper: "rgba(255,255,255,0.86)",
                    //         },
                    //         text: {
                    //             primary: "#1f2937",
                    //             secondary: "#475569",
                    //         },
                    //         divider: "rgba(120,140,180,0.25)",

                    //         primary: { main: "#8b5cf6" },   // violet / indigo
                    //         secondary: { main: "#818cf8" }, // softer indigo
                    //     }
                    //     : {
                    //         background: {
                    //             default: "transparent",
                    //             paper: "transparent",
                    //         },
                    //         text: {
                    //             primary: "#ffffff",
                    //             secondary: "#cccccc",
                    //         },
                    //         divider: "rgba(255,255,255,0.1)",
                    //     })

                    ...(mode === "light"
                        ? {
                            background: {
                                default: "transparent",
                                paper: "rgba(255, 255, 255, 0.65)",
                            },
                            text: {
                                primary: "inherit",
                                secondary: "inherit",
                            },
                            divider: "rgba(0,0,0,0.08)",
                            primary: { main: "#8b5cf6" },
                            secondary: { main: "#6366f1" },
                        }
                        : {
                            background: {
                                default: "transparent",
                                paper: "transparent",
                            },
                            text: {
                                primary: "#ffffff",
                                secondary: "#cccccc",
                            },
                            divider: "rgba(255,255,255,0.1)",
                        })


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
                        defaultProps: { elevation: 0 },

                        styleOverrides: {
                            root: {
                                backgroundImage: "none",
                                backgroundColor:
                                    mode === "light"
                                        ? "rgba(255, 255, 255, 0.65)"   // ✅ אותו ערך כמו palette.paper
                                        : "rgba(255, 255, 255, 0.06)",
                                backdropFilter: "blur(18px) saturate(1.2)",
                                borderRadius: "16px",
                                transition: "0.25s ease",
                                boxShadow:
                                    mode === "light"
                                        ? "0 4px 20px rgba(0,0,0,0.06)"
                                        : "none",

                            },
                        },
                    },
                    MuiPopover: {
                        styleOverrides: {
                            paper: {
                                backgroundImage: "none",
                                backgroundColor:
                                    mode === "light"
                                        ? "rgba(255,255,255,0.88)"
                                        : "rgba(20,20,20,0.75)",
                                backdropFilter: "blur(14px) saturate(1.1)",
                            },
                        },
                    },
                    MuiMenu: {
                        styleOverrides: {
                            paper: {
                                backgroundImage: "none",
                                backgroundColor:
                                    mode === "light"
                                        ? "rgba(255,255,255,0.88)"
                                        : "rgba(20,20,20,0.75)",
                                backdropFilter: "blur(14px) saturate(1.1)",
                            },
                        },
                    },
                    MuiDialog: {
                        styleOverrides: {
                            paper: {
                                backgroundImage: "none",
                                backgroundColor:
                                    mode === "light"
                                        ? "rgba(255,255,255,0.92)"
                                        : "rgba(20,20,20,0.78)",
                                backdropFilter: "blur(18px) saturate(1.1)",
                            },
                        },
                    },
                    MuiTooltip: {
                        styleOverrides: {
                            tooltip: {
                                backgroundColor: mode === "light" ? "rgba(15,23,42,0.9)" : "rgba(0,0,0,0.75)",
                                backdropFilter: "blur(10px)",
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
                    MuiTab: {
                        styleOverrides: {
                            root: {
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                            },
                        },
                    },

                },
            }),
        [mode]
    );

    const toggleMode = () => {
        setMode((prev) => (prev === "dark" ? "light" : "dark"));
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleMode }}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </StyledEngineProvider>
        </ThemeContext.Provider>
    );

}

export function useThemeMode() {
    return useContext(ThemeContext);
}
