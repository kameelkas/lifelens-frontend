/**
 * LoginPage.jsx
 *
 * Simple login form. Calls AuthContext.login() and redirects to home on success.
 * Displays an error message on failed login.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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
        <div className="min-h-screen bg-app-bg text-ink flex flex-col">
            <Navbar brandTo="/login" />
            <main className="flex-1 flex items-center justify-center px-4 pb-24">
                <div className="w-full max-w-sm bg-white/80 border border-muted/20 rounded-lg p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="bg-white text-ink placeholder-muted/80 border border-muted/25
                           rounded px-4 py-2 focus:outline-none focus:border-brand-gold"
                        />

                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-white text-ink placeholder-muted/80 border border-muted/25
                           rounded px-4 py-2 focus:outline-none focus:border-brand-gold"
                        />

                        {error && (
                            <p className="text-red-400 text-sm text-center">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-brand-gold text-ink font-semibold rounded px-4 py-2
                           hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}