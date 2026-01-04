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
// api.interceptors.request.use((config) => {
//     const t = getToken();

//     config.headers = config.headers || {}; // חשוב

//     if (t) {
//         config.headers.Authorization = `Bearer ${t}`;
//         console.log("TOKEN SENT?", token ? token.slice(0, 12) : "NO TOKEN");
//         console.log("REQ", config.method, config.url);

//         // } else {
//         //     delete config.headers.Authorization;
//     }

//     return config;
// });

// api.interceptors.request.use((config) => {
//     const raw = localStorage.getItem("auth");
//     const token = raw ? JSON.parse(raw)?.token : null;

//     if (token) {
//         // Axios v1 headers can be AxiosHeaders with .set()
//         if (config.headers && typeof config.headers.set === "function") {
//             config.headers.set("Authorization", `Bearer ${token}`);
//         } else {
//             config.headers = {
//                 ...(config.headers || {}),
//                 Authorization: `Bearer ${token}`,
//             };
//         }
//     }

//     return config;
// });

api.interceptors.request.use((config) => {
    const raw = localStorage.getItem("auth");
    const token = raw ? JSON.parse(raw)?.token : null;

    if (token) {
        if (config.headers && typeof config.headers.set === "function") {
            config.headers.set("Authorization", `Bearer ${token}`);
        } else {
            config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
        }

        // ✅ debug useful
        if (!String(config.url).includes("/auth/login")) {
            console.log("[API]", config.method?.toUpperCase(), config.url, "HAS TOKEN?", !!token);

            // console.log("[API]", token ? "AUTH OK" : "NO TOKEN", config.method?.toUpperCase(), config.url);
        }
    }

    return config;
});


