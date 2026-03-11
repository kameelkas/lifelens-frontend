/**
 * LoginPage.jsx
 *
 * Simple login form. Calls AuthContext.login() and redirects to home on success.
 * Displays an error message on failed login.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(username, password);
            navigate("/", { replace: true });
        } catch (err) {
            setError(err.message ?? "Login failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-brand-navy flex items-center justify-center">
            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg p-8">

                {/* Logo / title */}
                <h1 className="text-brand-gold text-2xl font-semibold text-center mb-8">
                    LifeLens
                </h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="bg-white/10 text-white placeholder-brand-gray border border-white/10
                       rounded px-4 py-2 focus:outline-none focus:border-brand-gold"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/10 text-white placeholder-brand-gray border border-white/10
                       rounded px-4 py-2 focus:outline-none focus:border-brand-gold"
                    />

                    {error && (
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-brand-gold text-brand-navy font-semibold rounded px-4 py-2
                       hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                        {loading ? "Signing in..." : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}