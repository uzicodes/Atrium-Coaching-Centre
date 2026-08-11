"use client";

import { useEffect, useState, useRef } from "react";
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
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const fetchData = async () => {
            try {
                const userRes = await fetch("http://localhost:4000/api/me", { credentials: "include" });
                if (!userRes.ok) throw new Error("Not authenticated");

                const userData = await userRes.json();
                if (userData.kind !== "admin") {
                    router.push("/login");
                    return;
                }
                setUser(userData);

                // Fetch all global sessions for the admin
                const sessionsRes = await fetch("http://localhost:4000/api/sessions", { credentials: "include" });
                if (sessionsRes.ok) {
                    const sessionsData = await sessionsRes.json();
                    setSessions(sessionsData);
                }
            } catch (error) {
                router.push("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [router]);

    const handleLogout = async () => {
        await fetch("http://localhost:4000/api/logout", { method: "POST", credentials: "include" });
        router.push("/");
    };

    const handleCancelSession = async (sessionId: number) => {
        if (!confirm("ADMIN OVERRIDE: Are you sure you want to cancel this session? Room fees and seat fees will be refunded.")) return;

        try {
            const res = await fetch(`http://localhost:4000/api/sessions/${sessionId}/cancel`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to cancel session");
            }

            alert("Session cancelled by admin successfully!");
            window.location.reload();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRetry = () => {
        window.location.reload();
    };

    if (loading) {
        return (
            <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] p-4 md:p-8 flex flex-col gap-8`}>
                <div className="h-20 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-1 h-64 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                    <div className="col-span-1 md:col-span-2 h-64 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] p-4 md:p-8`}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#171717] pb-6 mb-10 gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Admin Portal</h1>
                    <p className={`${plexMono.className} mt-2 text-sm text-[#171717]/70`}>Connected to Atrium Central Database</p>
                </div>
                <button
                    onClick={handleLogout}
                    className="border-2 border-[#171717] bg-[#FF5252] text-white px-6 py-2 font-bold shadow-[4px_4px_0_0_#171717] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#171717] transition-all w-full md:w-auto cursor-pointer"
                >
                    Sign Out
                </button>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-col max-md:flex">
                {/* User Identity Card */}
                <div className="col-span-1 border-4 border-[#171717] bg-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717] h-fit">
                    <h2 className="text-xl md:text-2xl font-bold mb-6 uppercase border-b-2 border-dashed border-[#171717]/20 pb-4">Identity Verified</h2>
                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">Authorized User</p>
                            <p className="text-xl md:text-2xl font-semibold">{user?.full_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">Email Address</p>
                            <p className={`${plexMono.className} text-base md:text-lg break-words`}>{user?.email}</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-[#171717]/60 uppercase tracking-widest">System Role</p>
                            <span className="inline-block mt-1 border-2 border-[#171717] bg-[#FFC93C] px-3 py-1 text-sm font-bold uppercase tracking-widest">
                                {user?.kind}
                            </span>
                        </div>
                    </div>
                </div>

                {/* System Sessions Master List */}
                <div className="col-span-1 md:col-span-2 border-4 border-[#171717] bg-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-xl md:text-2xl font-bold mb-6 uppercase border-b-2 border-dashed border-[#171717]/20 pb-4">All System Sessions</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 overflow-x-auto">
                        {sessions.length === 0 ? (
                            <div className="text-center bg-[#FAF6EE] p-8 border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]">
                                <p className="font-bold text-xl mb-4">No records found.</p>
                                <p className="text-[#171717]/70 text-sm">The session database is currently empty.</p>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-[4px_4px_0_0_#171717] gap-4 min-w-[300px]">
                                    <div>
                                        <div className="flex gap-2 items-center mb-1 flex-wrap">
                                            <span className={`${plexMono.className} text-xs font-bold bg-[#2F4BFF] text-white px-2 py-0.5 uppercase`}>{session.session_type}</span>
                                            <span className={`${plexMono.className} text-xs font-bold bg-[#FFC93C] text-black px-2 py-0.5 uppercase border border-[#171717]`}>Coach: {session.coach_name}</span>
                                        </div>
                                        <h3 className="text-lg font-bold">{session.discipline}</h3>
                                        <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>Starts: {new Date(session.starts_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto">
                                        <span className={`inline-block w-fit text-xs font-bold px-2 py-1 uppercase mb-2 ${session.status?.toLowerCase() === 'cancelled' ? 'text-red-700 bg-red-100 border border-red-300' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'}`}>
                                            {session.status}
                                        </span>
                                        {session.status?.toLowerCase() !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancelSession(session.id)}
                                                className="border-2 border-[#171717] bg-[#FF5252] text-white px-3 py-2 sm:py-1 text-xs font-bold uppercase hover:bg-red-700 w-full sm:w-auto"
                                            >
                                                Force Cancel
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}