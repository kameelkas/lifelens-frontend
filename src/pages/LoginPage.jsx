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
import lifelensMark from "../assets/lifelens-mark.png";

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
            <main className="relative flex-1 flex items-center justify-center px-4 pb-24 overflow-hidden">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -top-16 -left-12 h-56 w-56 rounded-full bg-brand-gold/20 blur-3xl" />
                    <div className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-muted/20 blur-3xl" />
                </div>

                <div className="relative w-full max-w-md bg-white/85 border border-muted/20 rounded-2xl p-8 sm:p-10 shadow-xl">
                    <div className="flex flex-col items-center text-center mb-8">
                        <img src={lifelensMark} alt="LifeLens mark" className="h-16 w-18 object-contain mb-4" />
                        <h1 className="text-ink text-3xl font-semibold">LifeLens Data Portal</h1>
                        <p className="text-muted text-sm mt-2">
                            Sign in to access the LifeLens Data Portal.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <label className="text-sm text-muted">
                            Username
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1 w-full bg-white text-ink placeholder-muted/80 border border-muted/25
                                rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-gold"
                            />
                        </label>

                        <label className="text-sm text-muted">
                            Password
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 w-full bg-white text-ink placeholder-muted/80 border border-muted/25
                                rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-gold"
                            />
                        </label>

                        {error && (
                            <p className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 bg-brand-gold text-ink font-semibold rounded-lg px-4 py-2.5
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