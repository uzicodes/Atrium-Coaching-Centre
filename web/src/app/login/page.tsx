"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Unified to 127.0.0.1 to securely lock in the session cookie
            const res = await fetch("http://localhost:4000/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Invalid email or password");
            }

            // Redirect based on user kind
            if (data.kind === "coach") {
                router.push("/coach/dashboard");
            } else if (data.kind === "admin") {
                router.push("/admin/dashboard");
            } else if (data.kind === "participant") {
                router.push("/participant/dashboard");
            } else {
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message || "Failed to connect to authentication server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] flex items-center justify-center p-6`}>
            <div className="border-4 border-[#171717] bg-white p-8 max-w-md w-full shadow-[8px_8px_0_0_#171717]">
                <h1 className="text-3xl font-bold uppercase mb-2">Portal Login</h1>
                <p className={`${plexMono.className} text-xs text-[#171717]/70 mb-6`}>
                    Sign in using your authorized credentials.
                </p>

                {error && (
                    <div className="mb-4 bg-[#FFE3E1] text-[#FF5252] border-2 border-[#171717] p-3 text-sm font-bold">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border-2 border-[#171717] p-2.5 bg-[#FAF6EE] font-mono text-sm"
                        />
                    </div>

                    <div>
                        <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border-2 border-[#171717] p-2.5 bg-[#FAF6EE] font-mono text-sm"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full border-2 border-[#171717] bg-[#2F4BFF] text-white py-3 font-bold uppercase tracking-widest shadow-[4px_4px_0_0_#171717] hover:translate-y-[2px] transition-all cursor-pointer disabled:opacity-50"
                    >
                        {loading ? "Authenticating..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}