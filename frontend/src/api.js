import axios from "axios";

export const api = axios.create({
    baseURL: "http://localhost:8000",
});

// --- Load token on page load ---
const saved = localStorage.getItem("token");
if (saved) {
    api.defaults.headers.common["Authorization"] = `Bearer ${saved}`;
}

// --- Inject token before every request ---
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
