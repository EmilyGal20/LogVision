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
                    h1: { fontWeight: 800, letterSpacing: "-0.03em" },
                    h2: { fontWeight: 800, letterSpacing: "-0.03em" },
                    h3: { fontWeight: 750, letterSpacing: "-0.02em" },
                    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
                    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
                    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
                    button: {
                        textTransform: "none",
                        fontWeight: 700,
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
                    MuiCard: {
                        styleOverrides: {
                            root: {
                                borderRadius: 18,
                                backgroundImage: "none",
                            },
                        },
                    },
                    MuiTextField: {
                        defaultProps: { size: "small", variant: "outlined" },
                    },
                    MuiInputBase: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                            },
                        },
                    },
                    MuiOutlinedInput: {
                        styleOverrides: {
                            root: {
                                borderRadius: 12,
                            },
                            notchedOutline: {
                                borderWidth: 1,
                            },
                        },
                    },
                    MuiButton: {
                        styleOverrides: {
                            root: {
                                borderRadius: "12px",
                                paddingInline: 16,
                                minHeight: 40,
                                boxShadow:
                                    mode === "light"
                                        ? "0 6px 16px rgba(0,0,0,0.10)"
                                        : "none",
                            },
                            contained: {
                                fontWeight: 800,
                                letterSpacing: "0.01em",
                            },
                        },
                    },
                    MuiChip: {
                        styleOverrides: {
                            root: {
                                fontWeight: 700,
                                borderRadius: 999,
                            },
                        },
                    },
                    MuiTab: {
                        styleOverrides: {
                            root: {
                                fontWeight: 700,
                                letterSpacing: "0.02em",
                                minHeight: 44,
                            },
                        },
                    },
                    MuiTabs: {
                        styleOverrides: {
                            root: {
                                minHeight: 44,
                            },
                            indicator: {
                                height: 3,
                                borderRadius: 4,
                            },
                        },
                    },
                    MuiPaginationItem: {
                        styleOverrides: {
                            root: {
                                borderRadius: 10,
                                fontWeight: 700,
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
