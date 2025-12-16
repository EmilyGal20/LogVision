// ===============================================
// File: src/components/CombinedGraph.jsx
// ===============================================

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
} from "chart.js";
import { useEffect, useState } from "react";

ChartJS.register(
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

export default function CombinedGraph({ devices }) {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (devices.length === 0) return;

            const avgCPU =
                devices.reduce((sum, d) => sum + (d.cpu_temp || 0), 0) /
                devices.length;

            const avgRAM =
                devices.reduce((sum, d) => sum + (d.ram_used || 0), 0) /
                devices.length;

            const avgGPU =
                devices.reduce((sum, d) => sum + (d.gpu_temp || 0), 0) /
                devices.length;

            const avgDisk =
                devices.reduce((sum, d) => {
                    if (!d.disk_health) return sum;
                    const vals = Object.values(d.disk_health);
                    return sum + (vals[0] || 100);
                }, 0) / devices.length;

            setHistory((prev) => [
                ...prev.slice(-20),
                {
                    time: new Date().toLocaleTimeString(),
                    cpu: avgCPU,
                    ram: avgRAM,
                    gpu: avgGPU,
                    disk: avgDisk
                }
            ]);
        }, 2000);

        return () => clearInterval(interval);
    }, [devices]);

    const data = {
        labels: history.map((h) => h.time),
        datasets: [
            {
                label: "CPU °C",
                data: history.map((h) => h.cpu),
                borderColor: "#ff4d4d",
                tension: 0.4
            },
            {
                label: "RAM %",
                data: history.map((h) => h.ram),
                borderColor: "#4da6ff",
                tension: 0.4
            },
            {
                label: "GPU °C",
                data: history.map((h) => h.gpu),
                borderColor: "#ffa64d",
                tension: 0.4
            },
            {
                label: "Disk Health %",
                data: history.map((h) => h.disk),
                borderColor: "#4dff88",
                tension: 0.4
            }
        ]
    };

    return (
        <div style={{ padding: 20 }}>
            <h3>Combined System Health</h3>
            <Line data={data} height={100} />
        </div>
    );
}
