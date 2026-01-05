// src/api.js
import axios from "axios";

export const api = axios.create({
    baseURL: "http://10.41.250.250:8000",
    withCredentials: false,
});

// -------------------------
// Helpers: auth storage
// -------------------------
export function getAuth() {
    try {
        const raw = localStorage.getItem("auth");
        return raw ? JSON.parse(raw) : null; // { user, token }
    } catch {
        return null;
    }
}

export function getToken() {
    return getAuth()?.token || null;
}

export function setAuth({ user, token }) {
    localStorage.setItem("auth", JSON.stringify({ user, token }));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
}

export function clearAuth() {
    localStorage.removeItem("auth");
    localStorage.removeItem("logged-user");
    delete api.defaults.headers.common.Authorization;
}

// -------------------------------------------
// Request interceptor — inject token
// -------------------------------------------
api.interceptors.request.use(
    (config) => {
        const token = getToken();

        if (config.headers && typeof config.headers.set === "function") {
            if (token) config.headers.set("Authorization", `Bearer ${token}`);
            else config.headers.delete("Authorization");
        } else {
            config.headers = config.headers || {};
            if (token) config.headers.Authorization = `Bearer ${token}`;
            else delete config.headers.Authorization;
        }

        // console.log(
        //     "[API]",
        //     (config.method || "GET").toUpperCase(),
        //     config.url,
        //     "TOKEN?",
        //     !!token
        // );

        return config;
    },
    (error) => Promise.reject(error)
);

// -------------------------------------------
// Response interceptor — handle 401
// -------------------------------------------
api.interceptors.response.use(
    (res) => res,
    (err) => {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail;

        if (status === 401) {
            console.warn("[API] 401 Unauthorized:", detail || "(no detail)");

            const d = String(detail || "").toLowerCase();
            if (d.includes("expired") || d.includes("invalid")) {
                clearAuth();
                // אופציונלי:
                // window.location.href = "/login";
            }
        }

        return Promise.reject(err);
    }
);
