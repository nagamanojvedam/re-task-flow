import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";

function getErrorMessage(error) {
    if (error.response?.status === 401) {
        return "Invalid email or password.";
    }

    if (error.response?.data?.detail) {
        const detail = error.response.data.detail;

        return typeof detail === "string"
            ? detail
            : "Please check your login details.";
    }

    if (error.code === "ERR_NETWORK") {
        return "Unable to connect to the server. Check whether the backend is running.";
    }

    return "Something went wrong. Please try again.";
}

export default function LoginPage() {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setSubmitting(true);

        try {
            await login(email.trim(), password);

            const destination = location.state?.from?.pathname || "/dashboard";
            navigate(destination, { replace: true });
        } catch (loginError) {
            setError(getErrorMessage(loginError));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-layout">
            <section className="auth-card">
                <div className="brand-mark">R</div>

                <p className="eyebrow">WELCOME BACK</p>
                <h1>Sign in to Taskflow</h1>
                <p className="auth-description">
                    Manage your projects and keep your work moving.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="email">Email address</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="error-message" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        className="primary-button"
                        type="submit"
                        disabled={submitting || loading}
                    >
                        {submitting ? "Signing in..." : "Sign in"}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </section>
        </main>
    );
}