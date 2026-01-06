// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
    const location = useLocation();
    const auth = localStorage.getItem("auth");

    if (!auth) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/profile?next=${next}`} replace />;
    }

    return children;
}
