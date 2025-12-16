// components/WindowManager.jsx
import { useEffect, useState } from "react";
import BrowserWindow from "./BrowserWindow";
import TerminalWindow from "./TerminalWindow";
import Taskbar from "./Taskbar";

let idCounter = 1;

const DEFAULT_TABS = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Logs", path: "/logs" },
];

const DEFAULT_BROWSER_SIZE = { width: 1100, height: 700 };
const DEFAULT_TERMINAL_SIZE = { width: 800, height: 500 };

const getCenteredPosition = (size) => ({
    x: Math.max((window.innerWidth - size.width) / 2, 40),
    y: Math.max((window.innerHeight - size.height) / 2, 40),
});

export default function WindowManager() {
    const [windows, setWindows] = useState(() => {
        const saved = localStorage.getItem("os-windows");

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                idCounter = Math.max(...parsed.map(w => w.id), 0) + 1;

                return parsed.map(w => ({
                    ...w,
                    position: w.position ?? getCenteredPosition(w.size),
                    size: w.size ?? DEFAULT_BROWSER_SIZE,
                }));
            } catch {
                localStorage.removeItem("os-windows");
            }
        }

        return [
            {
                id: idCounter++,
                type: "browser",
                minimized: false,
                maximized: false,
                active: true,
                z: 1,
                size: DEFAULT_BROWSER_SIZE,
                position: getCenteredPosition(DEFAULT_BROWSER_SIZE),
                tabs: DEFAULT_TABS,
                activeTab: "/dashboard",
            },
        ];
    });

    // 💾 Persist session
    useEffect(() => {
        localStorage.setItem("os-windows", JSON.stringify(windows));
    }, [windows]);

    // =========================
    // Window actions
    // =========================

    const focusWindow = (id) => {
        const maxZ = Math.max(...windows.map(w => w.z), 0);

        setWindows(wins =>
            wins.map(w => {
                if (w.id !== id) return { ...w, active: false };
                if (w.minimized) return w;

                return { ...w, active: true, z: maxZ + 1 };
            })
        );
    };

    const minimizeWindow = (id) => {
        setWindows(wins =>
            wins.map(w =>
                w.id === id
                    ? { ...w, minimized: true, active: false }
                    : w
            )
        );
    };

    const toggleMaximize = (id) => {
        setWindows(wins =>
            wins.map(w =>
                w.id === id
                    ? { ...w, maximized: !w.maximized }
                    : w
            )
        );
    };

    const restoreWindow = (id) => {
        const maxZ = Math.max(...windows.map(w => w.z), 0);

        setWindows(wins =>
            wins.map(w =>
                w.id === id
                    ? { ...w, minimized: false, active: true, z: maxZ + 1 }
                    : { ...w, active: false }
            )
        );
    };

    const moveWindow = (id, position) => {
        setWindows(wins =>
            wins.map(w =>
                w.id === id ? { ...w, position } : w
            )
        );
    };

    const resizeWindow = (id, size) => {
        setWindows(wins =>
            wins.map(w =>
                w.id === id ? { ...w, size } : w
            )
        );
    };

    const updateTabs = (id, updater) => {
        setWindows(wins =>
            wins.map(w => {
                if (w.id !== id) return w;

                const update = updater(w);
                if (!update) return w;

                return { ...w, ...update };
            })
        );
    };

    // =========================
    // Open / Close windows
    // =========================

    const openNewWindow = () => {
        const size = DEFAULT_BROWSER_SIZE;
        const position = getCenteredPosition(size);
        const maxZ = Math.max(...windows.map(w => w.z), 0);

        setWindows(wins => [
            ...wins.map(w => ({ ...w, active: false })),
            {
                id: idCounter++,
                type: "browser",
                minimized: false,
                maximized: false,
                active: true,
                z: maxZ + 1,
                size,
                position,
                tabs: [{ label: "Dashboard", path: "/dashboard" }],
                activeTab: "/dashboard",
            },
        ]);
    };

    const closeWindow = (id) => {
        setWindows(wins => wins.filter(w => w.id !== id));
    };

    const openTerminal = () => {
        const size = DEFAULT_TERMINAL_SIZE;
        const position = getCenteredPosition(size);
        const maxZ = Math.max(...windows.map(w => w.z), 0);

        setWindows(wins => [
            ...wins.map(w => ({ ...w, active: false })),
            {
                id: idCounter++,
                type: "terminal",
                minimized: false,
                maximized: false,
                active: true,
                z: maxZ + 1,
                size,
                position,
            },
        ]);
    };

    // =========================
    // Render
    // =========================

    return (
        <>
            <Taskbar
                windows={windows}
                onNewWindow={openNewWindow}
                onRestoreWindow={restoreWindow}
                onOpenTerminal={openTerminal}
            />

            {windows.map(win => {
                if (win.minimized) return null;

                if (win.type === "browser") {
                    return (
                        <BrowserWindow
                            key={win.id}
                            window={win}
                            onFocus={() => focusWindow(win.id)}
                            onMinimize={() => minimizeWindow(win.id)}
                            onMaximize={() => toggleMaximize(win.id)}
                            onClose={() => closeWindow(win.id)}
                            onMove={(pos) => moveWindow(win.id, pos)}
                            onResize={(size) => resizeWindow(win.id, size)}
                            onTabsChange={(updater) =>
                                updateTabs(win.id, updater)
                            }
                        />
                    );
                }

                if (win.type === "terminal") {
                    return (
                        <TerminalWindow
                            key={win.id}
                            window={win}
                            onFocus={() => focusWindow(win.id)}
                            onMinimize={() => minimizeWindow(win.id)}
                            onMaximize={() => toggleMaximize(win.id)}
                            onClose={() => closeWindow(win.id)}
                            onMove={(pos) => moveWindow(win.id, pos)}
                            onResize={(size) => resizeWindow(win.id, size)}
                        />
                    );
                }

                return null;
            })}
        </>
    );
}
