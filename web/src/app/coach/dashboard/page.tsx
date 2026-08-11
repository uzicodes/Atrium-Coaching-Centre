"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function CoachDashboard() {
    const router = useRouter();

    const [user, setUser] = useState<any | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showBooking, setShowBooking] = useState(false);
    const [discipline, setDiscipline] = useState("");
    const [sessionType, setSessionType] = useState("STANDARD");
    const [roomId, setRoomId] = useState("");
    const [startsAt, setStartsAt] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        async function loadRealData() {
            try {
                const userRes = await fetch("http://localhost:4000/api/me", { credentials: "include" });
                if (!userRes.ok) throw new Error("Authentication failed. Please log in.");

                const userData = await userRes.json();
                setUser(userData);

                const [sessionsRes, roomsRes] = await Promise.all([
                    fetch("http://localhost:4000/api/sessions", { credentials: "include" }).catch(() => null),
                    fetch("http://localhost:4000/api/rooms", { credentials: "include" }).catch(() => null)
                ]);

                if (sessionsRes?.ok) {
                    const sessionsData = await sessionsRes.json();
                    setSessions(sessionsData.filter((s: any) => s.coach_id === userData.id));
                }

                if (roomsRes?.ok) {
                    const roomsData = await roomsRes.json();
                    setRooms(roomsData);
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadRealData();
    }, [router]);

    const handleSignOut = async () => {
        try {
            await fetch("http://localhost:4000/api/logout", { method: "POST", credentials: "include" });
        } finally {
            router.push("/login");
        }
    };

    const handleBookRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch("http://localhost:4000/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    discipline,
                    session_type: sessionType,
                    room_id: Number(roomId),
                    starts_at: new Date(startsAt).toISOString()
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Booking failed");
            }

            alert("Room Booked successfully!");
            window.location.reload(); // Refresh to ensure exact DB state & emails trigger fully visually
        } catch (err: any) {
            alert(err.message);
            setSubmitting(false);
        }
    };

    const handleCancelSession = async (sessionId: number) => {
        if (!confirm("Are you sure you want to cancel this session? Room fees and enrolled participant seats will be refunded.")) return;

        try {
            const res = await fetch(`http://localhost:4000/api/sessions/${sessionId}/cancel`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to cancel session");
            }

            alert("Session cancelled successfully!");
            window.location.reload(); // Refresh to update balance and session list
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                    <div className="h-64 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] flex flex-col items-center justify-center p-4 md:p-8`}>
                <div className="border-4 border-[#171717] bg-[#FF5252] p-8 max-w-md w-full shadow-[8px_8px_0_0_#171717] text-white">
                    <h2 className="text-2xl font-bold mb-2 uppercase">Connection Error</h2>
                    <p className={`${plexMono.className} text-sm font-medium mb-6`}>{error}</p>
                    <div className="flex gap-4">
                        <button onClick={handleRetry} className="border-2 border-[#171717] bg-white text-[#171717] px-6 py-2 font-bold uppercase cursor-pointer hover:bg-gray-100 shadow-[2px_2px_0_0_#171717]">Retry</button>
                        <button onClick={() => router.push("/login")} className="border-2 border-[#171717] bg-[#171717] text-white px-6 py-2 font-bold uppercase cursor-pointer shadow-[2px_2px_0_0_#171717]">Back to Login</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] p-4 md:p-8`}>
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-[#171717] pb-6 mb-10 gap-4 md:gap-0">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Coach Portal</h1>
                    <p className={`${plexMono.className} mt-2 text-sm text-[#171717]/70`}>Welcome back, {user?.full_name}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="border-2 border-[#171717] bg-[#FFC93C] px-4 py-2 font-bold shadow-[3px_3px_0_0_#171717] text-center">
                        Balance: <span className={`${plexMono.className}`}>{user?.credits}</span> Credits
                    </div>
                    <button onClick={handleSignOut} className="border-2 border-[#171717] bg-[#FF5252] text-white px-5 py-2 font-bold shadow-[3px_3px_0_0_#171717] cursor-pointer w-full sm:w-auto">Sign Out</button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-col max-md:flex">
                <div className="lg:col-span-2 border-4 border-[#171717] bg-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b-2 border-dashed border-[#171717]/20 pb-4 gap-4 sm:gap-0">
                        <h2 className="text-xl md:text-2xl font-bold uppercase">Your Coaching Sessions</h2>
                        <button onClick={() => setShowBooking(!showBooking)} className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-4 py-2 text-sm font-bold shadow-[3px_3px_0_0_#171717] cursor-pointer w-full sm:w-auto">
                            {showBooking ? "Cancel Form" : "+ Book New Room"}
                        </button>
                    </div>

                    {showBooking && (
                        <form onSubmit={handleBookRoom} className="mb-8 border-4 border-[#171717] bg-[#FAF6EE] p-4 sm:p-6 space-y-4 shadow-[4px_4px_0_0_#171717]">
                            <h3 className="text-xl font-bold uppercase">Book a Coaching Room</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Discipline</label>
                                    <input type="text" required value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="w-full border-2 border-[#171717] p-2 bg-white" />
                                </div>
                                <div>
                                    <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Session Type</label>
                                    <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="w-full border-2 border-[#171717] p-2 bg-white">
                                        <option value="SHORT">SHORT - 200 cr</option>
                                        <option value="STANDARD">STANDARD - 300 cr</option>
                                        <option value="INTENSIVE">INTENSIVE - 800 cr</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Room</label>
                                    <select required value={roomId} onChange={(e) => setRoomId(e.target.value)} className="w-full border-2 border-[#171717] p-2 bg-white">
                                        <option value="">Select Room</option>
                                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Cap: {r.capacity})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`${plexMono.className} block text-xs font-bold uppercase mb-1`}>Date & Time</label>
                                    <input type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-full border-2 border-[#171717] p-2 bg-white" />
                                </div>
                            </div>
                            <button type="submit" disabled={submitting} className="w-full border-2 border-[#171717] bg-[#171717] text-white py-3 font-bold uppercase shadow-[4px_4px_0_0_#2F4BFF] cursor-pointer disabled:opacity-50">
                                {submitting ? "Booking..." : "Confirm Booking"}
                            </button>
                        </form>
                    )}

                    <div className="space-y-4 overflow-x-auto">
                        {sessions.length === 0 ? (
                            <div className="text-center bg-[#FAF6EE] p-8 border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]">
                                <p className="font-bold text-xl mb-4">No records found.</p>
                                <button onClick={() => setShowBooking(true)} className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-6 py-2 font-bold uppercase hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_#171717] transition-all">Book your first room</button>
                            </div>
                        ) : (
                            sessions.map((session) => (
                                <div key={session.id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-[4px_4px_0_0_#171717] gap-4 min-w-[300px]">
                                    <div>
                                        <span className={`${plexMono.className} text-xs font-bold bg-[#2F4BFF] text-white px-2 py-0.5 uppercase`}>{session.session_type}</span>
                                        <h3 className="text-lg font-bold mt-1">{session.discipline}</h3>
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
                                                Cancel Room
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-4 border-[#171717] bg-[#2F4BFF] text-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717] h-fit">
                    <h3 className="text-xl md:text-2xl font-bold uppercase mb-4">Coach, Keep an Eye here</h3>
                    <ul className="space-y-4 text-sm font-medium">
                        <li>• Bookings will deduct credits directly from your account.</li>
                        <li>• Cancelling a session will refund the room fee back to your balance.</li>
                        <li>• Emails will automatically be sent out when you cancel.</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}