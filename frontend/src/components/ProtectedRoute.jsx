import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <main className="loading-screen">
                <div className="spinner" />
                <p>Checking your session...</p>
            </main>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return <Outlet />;
}