"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function ParticipantDashboard() {
    const router = useRouter();

    const [user, setUser] = useState<any | null>(null);
    const [myBookings, setMyBookings] = useState<any[]>([]);
    const [availableSessions, setAvailableSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        async function loadParticipantData() {
            try {
                // 1. Verify user session and role
                const userRes = await fetch("http://localhost:4000/api/me", { credentials: "include" });
                if (!userRes.ok) throw new Error("Authentication failed. Please log in.");

                const userData = await userRes.json();
                if (userData.kind !== "participant" && userData.kind !== "coach") {
                    throw new Error("Access denied.");
                }
                setUser(userData);

                // 2. Fetch participant bookings and available public sessions
                const [bookingsRes, sessionsRes] = await Promise.all([
                    fetch("http://localhost:4000/api/participant/bookings", { credentials: "include" }).catch(() => null),
                    fetch("http://localhost:4000/api/sessions", { credentials: "include" }).catch(() => null)
                ]);

                if (bookingsRes?.ok) {
                    const bookingsData = await bookingsRes.json();
                    setMyBookings(bookingsData);
                }

                if (sessionsRes?.ok) {
                    const sessionsData = await sessionsRes.json();
                    // Filter for upcoming sessions available to book
                    setAvailableSessions(sessionsData.filter((s: any) => s.status?.toLowerCase() === "confirmed" || s.status?.toLowerCase() === "scheduled"));
                }
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        loadParticipantData();
    }, [router]);

    const handleSignOut = async () => {
        try {
            await fetch("http://localhost:4000/api/logout", { method: "POST", credentials: "include" });
        } finally {
            router.push("/login");
        }
    };

    const handleBookSession = async (sessionId: number) => {
        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:4000/api/sessions/${sessionId}/book`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to book session");
            }

            alert("Successfully booked session!");
            window.location.reload(); // Refresh to update credits and listings
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId: number) => {
        if (!confirm("Are you sure you want to cancel your seat? You will be refunded based on the cancellation policy.")) return;

        try {
            const res = await fetch(`http://localhost:4000/api/participant/bookings/${bookingId}/cancel`, {
                method: "POST",
                credentials: "include"
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to cancel booking");
            }

            alert("Booking cancelled successfully!");
            window.location.reload();
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] flex items-center justify-center font-bold text-xl`}>Loading Participant Portal...</div>;
    }

    if (error) {
        return (
            <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] flex flex-col items-center justify-center p-8`}>
                <div className="border-4 border-[#171717] bg-[#FFE3E1] p-8 max-w-md w-full shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-2xl font-bold text-[#FF5252] mb-2 uppercase">Access Error</h2>
                    <p className={`${plexMono.className} text-sm text-[#171717] mb-6`}>{error}</p>
                    <button onClick={() => router.push("/login")} className="border-2 border-[#171717] bg-[#171717] text-white px-6 py-2 font-bold uppercase cursor-pointer">Back to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] text-[#171717] p-8`}>
            <header className="flex justify-between items-center border-b-4 border-[#171717] pb-6 mb-10">
                <div>
                    <h1 className="text-4xl font-bold uppercase tracking-tight">Participant Portal</h1>
                    <p className={`${plexMono.className} mt-2 text-sm text-[#171717]/70`}>Welcome back, {user?.full_name}</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="border-2 border-[#171717] bg-[#FFC93C] px-4 py-2 font-bold shadow-[3px_3px_0_0_#171717]">
                        Credits: <span className={`${plexMono.className}`}>{user?.credits}</span>
                    </div>
                    <button onClick={handleSignOut} className="border-2 border-[#171717] bg-[#FF5252] text-white px-5 py-2 font-bold shadow-[3px_3px_0_0_#171717] cursor-pointer">Sign Out</button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Enrolled Bookings */}
                <div className="border-4 border-[#171717] bg-white p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-2xl font-bold uppercase mb-6 border-b-2 border-dashed border-[#171717]/20 pb-4">Your Enrolled Sessions</h2>
                    <div className="space-y-4">
                        {myBookings.length === 0 ? (
                            <p className="text-center text-[#171717]/60 py-8 border-2 border-dashed border-[#171717]/30">You have not booked any sessions yet.</p>
                        ) : (
                            myBookings.map((booking) => (
                                <div key={booking.enrolment_id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex justify-between items-center shadow-[4px_4px_0_0_#171717]">
                                    <div>
                                        <span className={`${plexMono.className} text-xs font-bold bg-[#2F4BFF] text-white px-2 py-0.5 uppercase`}>{booking.session_type}</span>
                                        <h3 className="text-lg font-bold mt-1">{booking.discipline}</h3>
                                        <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>Starts: {new Date(booking.starts_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <span className={`text-xs font-bold px-2 py-1 uppercase mb-2 ${booking.enrolment_status?.toLowerCase() === 'cancelled' ? 'text-red-700 bg-red-100 border border-red-300' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'}`}>
                                            {booking.enrolment_status || booking.status}
                                        </span>
                                        {booking.enrolment_status?.toLowerCase() !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancelBooking(booking.enrolment_id)}
                                                className="border-2 border-[#171717] bg-[#FF5252] text-white px-3 py-1 text-xs font-bold uppercase hover:bg-red-700"
                                            >
                                                Drop Seat
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Available Sessions to Book */}
                <div className="border-4 border-[#171717] bg-white p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-2xl font-bold uppercase mb-6 border-b-2 border-dashed border-[#171717]/20 pb-4">Available Sessions</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {availableSessions.length === 0 ? (
                            <p className="text-center text-[#171717]/60 py-8 border-2 border-dashed border-[#171717]/30">No sessions available for booking right now.</p>
                        ) : (
                            availableSessions.map((session) => (
                                <div key={session.id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex justify-between items-center shadow-[4px_4px_0_0_#171717]">
                                    <div>
                                        <span className={`${plexMono.className} text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 uppercase`}>{session.session_type}</span>
                                        <h3 className="text-lg font-bold mt-1">{session.discipline}</h3>
                                        <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>Starts: {new Date(session.starts_at).toLocaleString()}</p>
                                    </div>
                                    <button
                                        disabled={submitting || session.places_remaining === 0}
                                        onClick={() => handleBookSession(session.id)}
                                        className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-4 py-2 text-xs font-bold uppercase shadow-[2px_2px_0_0_#171717] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#171717] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {session.places_remaining === 0 ? 'Full' : 'Book Place'}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}