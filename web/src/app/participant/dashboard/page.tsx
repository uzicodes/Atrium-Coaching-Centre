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

    const handleRetry = () => {
        window.location.reload();
    };

    if (loading) {
        return (
            <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] p-4 md:p-8 flex flex-col gap-8`}>
                <div className="h-20 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]"></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="h-64 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                    <div className="h-64 bg-gray-200 animate-pulse border-4 border-[#171717] shadow-[8px_8px_0_0_#171717]"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`${spaceGrotesk.className} min-h-screen bg-[#FAF6EE] flex flex-col items-center justify-center p-4 md:p-8`}>
                <div className="border-4 border-[#171717] bg-[#FF5252] p-8 max-w-md w-full shadow-[8px_8px_0_0_#171717] text-white">
                    <h2 className="text-2xl font-bold mb-2 uppercase">Access Error</h2>
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
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">Participant Portal</h1>
                    <p className={`${plexMono.className} mt-2 text-sm text-[#171717]/70`}>Welcome back, {user?.full_name}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
                    <div className="border-2 border-[#171717] bg-[#FFC93C] px-4 py-2 font-bold shadow-[3px_3px_0_0_#171717] text-center">
                        Credits: <span className={`${plexMono.className}`}>{user?.credits}</span>
                    </div>
                    <button onClick={handleSignOut} className="border-2 border-[#171717] bg-[#FF5252] text-white px-5 py-2 font-bold shadow-[3px_3px_0_0_#171717] cursor-pointer w-full sm:w-auto">Sign Out</button>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-col max-md:flex">
                {/* Enrolled Bookings */}
                <div className="border-4 border-[#171717] bg-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-xl md:text-2xl font-bold uppercase mb-6 border-b-2 border-dashed border-[#171717]/20 pb-4">Your Enrolled Sessions</h2>
                    <div className="space-y-4 overflow-x-auto">
                        {myBookings.length === 0 ? (
                            <div className="text-center bg-[#FAF6EE] p-8 border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]">
                                <p className="font-bold text-xl mb-4">No records found.</p>
                                <button onClick={() => router.push("/#sessions")} className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-6 py-2 font-bold uppercase hover:translate-y-[2px] hover:shadow-none shadow-[4px_4px_0_0_#171717] transition-all">Browse Catalogue</button>
                            </div>
                        ) : (
                            myBookings.map((booking) => (
                                <div key={booking.enrolment_id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-[4px_4px_0_0_#171717] gap-4 min-w-[300px]">
                                    <div>
                                        <span className={`${plexMono.className} text-xs font-bold bg-[#2F4BFF] text-white px-2 py-0.5 uppercase`}>{booking.session_type}</span>
                                        <h3 className="text-lg font-bold mt-1">{booking.discipline}</h3>
                                        <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>Starts: {new Date(booking.starts_at).toLocaleString()}</p>
                                    </div>
                                    <div className="text-left sm:text-right flex flex-col sm:items-end w-full sm:w-auto">
                                        <span className={`inline-block w-fit text-xs font-bold px-2 py-1 uppercase mb-2 ${booking.enrolment_status?.toLowerCase() === 'cancelled' ? 'text-red-700 bg-red-100 border border-red-300' : 'text-emerald-700 bg-emerald-100 border border-emerald-300'}`}>
                                            {booking.enrolment_status || booking.status}
                                        </span>
                                        {booking.enrolment_status?.toLowerCase() !== 'cancelled' && (
                                            <button
                                                onClick={() => handleCancelBooking(booking.enrolment_id)}
                                                className="border-2 border-[#171717] bg-[#FF5252] text-white px-3 py-2 sm:py-1 text-xs font-bold uppercase hover:bg-red-700 w-full sm:w-auto"
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
                <div className="border-4 border-[#171717] bg-white p-4 md:p-8 shadow-[8px_8px_0_0_#171717]">
                    <h2 className="text-xl md:text-2xl font-bold uppercase mb-6 border-b-2 border-dashed border-[#171717]/20 pb-4">Available Sessions</h2>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 overflow-x-auto">
                        {availableSessions.length === 0 ? (
                            <div className="text-center bg-[#FAF6EE] p-8 border-4 border-[#171717] shadow-[4px_4px_0_0_#171717]">
                                <p className="font-bold text-xl mb-4">No records found.</p>
                                <p className="text-[#171717]/70 text-sm">Check back later for new sessions.</p>
                            </div>
                        ) : (
                            availableSessions.map((session) => (
                                <div key={session.id} className="border-2 border-[#171717] p-4 bg-[#FAF6EE] flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-[4px_4px_0_0_#171717] gap-4 min-w-[300px]">
                                    <div>
                                        <span className={`${plexMono.className} text-xs font-bold bg-emerald-600 text-white px-2 py-0.5 uppercase`}>{session.session_type}</span>
                                        <h3 className="text-lg font-bold mt-1">{session.discipline}</h3>
                                        <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>Starts: {new Date(session.starts_at).toLocaleString()}</p>
                                    </div>
                                    <button
                                        disabled={submitting || session.places_remaining === 0}
                                        onClick={() => handleBookSession(session.id)}
                                        className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-4 py-3 sm:py-2 text-xs font-bold uppercase shadow-[2px_2px_0_0_#171717] hover:translate-y-[1px] hover:shadow-[1px_1px_0_0_#171717] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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