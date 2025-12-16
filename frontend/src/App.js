// App.js
import "./App.css";
import { BrowserRouter } from "react-router-dom";

import OSFrame from "./components/OSFrame";
import WindowManager from "./components/WindowManager";

// 🎨 Theme
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo, useEffect } from "react";
import { useThemeMode } from "./context/ThemeContext";

function App() {
  const { mode } = useThemeMode();

  // 🌀 Sync body class
  useEffect(() => {
    document.body.className = mode;
  }, [mode]);

  // 🎨 MUI Theme
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: "#7c3aed" },
          secondary: { main: "#06b6d4" },
        },
      }),
    [mode]
  );

  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <OSFrame>
          <WindowManager />
        </OSFrame>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
