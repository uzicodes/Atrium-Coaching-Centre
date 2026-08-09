"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:4000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            if (data.kind === "coach") {
                router.push("/coach/dashboard");
            } else if (data.kind === "administrator") {
                router.push("/admin/dashboard");
            } else {
                router.push("/participant/dashboard");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid email or password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] flex flex-col justify-center items-center p-6 selection:bg-[#2F4BFF] selection:text-white`}>

            {/* Back to Home Navigation */}
            <div className="absolute top-6 left-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:text-[#2F4BFF] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F4BFF]"
                >
                    &larr; Back to HomePage
                </Link>
            </div>

            <div className="w-full max-w-md">
                {/* Header Title */}
                <div className="mb-8 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center border-2 border-[#171717] bg-[#2F4BFF] text-white shadow-[4px_4px_0_0_#171717] mb-6">
                        <span className={`${plexMono.className} text-2xl font-bold`}>A</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">Access Portal</h1>
                    <p className="mt-2 text-[#171717]/70">Sign in to your Atrium account.</p>
                </div>

                {/* Login Form Box */}
                <div className="border-2 border-[#171717] bg-white p-8 shadow-[8px_8px_0_0_#171717]">
                    <form onSubmit={handleLogin} className="space-y-6">

                        {/* Error Message */}
                        {error && (
                            <div className="border-2 border-[#171717] bg-[#FFE3E1] px-4 py-3 text-sm font-semibold text-[#FF5252]">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className={`${plexMono.className} block text-xs font-semibold tracking-widest uppercase`}>
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border-2 border-[#171717] bg-[#FAF6EE] px-4 py-3 text-base outline-none transition-shadow focus:shadow-[4px_4px_0_0_#2F4BFF] focus:border-[#2F4BFF]"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className={`${plexMono.className} block text-xs font-semibold tracking-widest uppercase`}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border-2 border-[#171717] bg-[#FAF6EE] px-4 py-3 text-base outline-none transition-shadow focus:shadow-[4px_4px_0_0_#2F4BFF] focus:border-[#2F4BFF]"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center border-2 border-[#171717] bg-[#2F4BFF] px-6 py-4 text-base font-semibold text-white shadow-[4px_4px_0_0_#171717] transition-all hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#171717] active:translate-y-[4px] active:shadow-none disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Authenticating..." : "Sign In"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}