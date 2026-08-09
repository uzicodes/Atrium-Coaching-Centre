"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

type User = {
    id: number;
    email: string;
    full_name: string;
    kind: string;
    credits: number;
};

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch the current user to verify the httpOnly session cookie
        const fetchUser = async () => {
            try {
                const response = await fetch("http://localhost:4000/api/me", {
                    credentials: "include", // MUST include this to send the cookie!
                });

                if (!response.ok) {
                    throw new Error("Not authenticated");
                }

                const data = await response.json();

                // Security check: Make sure a coach/participant didn't sneak in here
                if (data.kind !== "admin") {
                    router.push("/login");
                    return;
                }

                setUser(data);
            } catch (error) {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = async () => {
        await fetch("http://localhost:4000/api/logout", { method: "POST", credentials: "include" });
        router.push("/");
    };

    if (loading) {
        return <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center font-bold text-xl">Verifying Session...</div>;
    }

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] p-8`}>
            <header className="flex justify-between items-center border-b-4 border-[#171717] pb-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tight">Admin Portal</h1>
                    <p className={`${plexMono.className} mt-2 text-sm text-[#171717]/70`}>Connected to Atrium Central Database</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="border-2 border-[#171717] bg-[#FF5252] text-white px-6 py-2 font-bold shadow-[4px_4px_0_0_#171717] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#171717] transition-all"
                >
                    Sign Out
                </button>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* User Identity Card */}
                <div className="col-span-1 md:col-span-2 border-4 border-[#171717] bg-white p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-2xl font-bold mb-6 uppercase border-b-2 border-dashed border-[#171717]/20 pb-4">Identity Verified</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">Authorized User</p>
                            <p className="text-2xl font-semibold">{user?.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">Email Address</p>
                            <p className={`${plexMono.className} text-lg`}>{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">System Role</p>
                            <span className="inline-block mt-1 border-2 border-[#171717] bg-[#FFC93C] px-3 py-1 text-sm font-bold uppercase tracking-widest">
                                {user?.kind}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Panel Placeholder */}
                <div className="border-4 border-[#171717] bg-[#2F4BFF] text-white p-8 shadow-[8px_8px_0_0_#171717] flex flex-col justify-center items-center text-center">
                    <h3 className="text-2xl font-bold uppercase mb-4">System Actions</h3>
                    <p className="text-white/80 font-medium mb-8">Manage rooms, sessions, and system economy.</p>
                    <button className="w-full border-2 border-white bg-transparent hover:bg-white hover:text-[#2F4BFF] transition-colors py-3 font-bold uppercase tracking-widest">
                        View Schedule
                    </button>
                </div>
            </main>
        </div>
    );
}