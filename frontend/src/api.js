import axios from "axios";

export const api = axios.create({
    baseURL: "http://10.41.250.250:8000"
});

// --- Helper: read token from auth ---
function getToken() {
    try {
        const raw = localStorage.getItem("auth");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.token || null;
    } catch {
        return null;
    }
}

// --- Load token on page load ---
const token = getToken();
if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
}

// --- Inject token before every request ---
api.interceptors.request.use((config) => {
    const t = getToken();
    if (t) {
        config.headers.Authorization = `Bearer ${t}`;
    } else {
        // חשוב: לנקות אם אין טוקן, כדי לא לשלוח "ghost header"
        delete config.headers.Authorization;
    }
    return config;
});
