import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { useAuth } from "../context/useAuth";

function getErrorMessage(error) {
    if (error.response?.status === 409) {
        return "An account with this email already exists.";
    }

    if (error.response?.status === 422) {
        const detail = error.response.data?.detail;

        if (Array.isArray(detail)) {
            return detail.map((item) => item.msg).join(" ");
        }

        return typeof detail === "string"
            ? detail
            : "Please check the information you entered.";
    }

    if (error.code === "ERR_NETWORK") {
        return "Unable to connect to the server. Check whether the backend is running.";
    }

    return error.response?.data?.detail || "Unable to create your account.";
}

export default function RegisterPage() {
    const { user, loading, register } = useAuth();
    const navigate = useNavigate();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    if (!loading && user) {
        return <Navigate to="/dashboard" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setSubmitting(true);

        try {
            await register({
                full_name: fullName.trim(),
                email: email.trim(),
                password,
            });

            navigate("/login", {
                replace: true,
                state: { message: "Account created successfully. You can now sign in." },
            });
        } catch (registrationError) {
            setError(getErrorMessage(registrationError));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-layout">
            <section className="auth-card">
                <div className="brand-mark">R</div>

                <p className="eyebrow">GET STARTED</p>
                <h1>Create your account</h1>
                <p className="auth-description">
                    Bring your projects, tasks, and team together.
                </p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-field">
                        <label htmlFor="fullName">Full name</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            placeholder="Your full name"
                            minLength={2}
                            maxLength={100}
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                            required
                        />
                    </div>

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
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            minLength={8}
                            maxLength={128}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="confirmPassword">Confirm password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Re-enter your password"
                            minLength={8}
                            maxLength={128}
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
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
                        {submitting ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </section>
        </main>
    );
}