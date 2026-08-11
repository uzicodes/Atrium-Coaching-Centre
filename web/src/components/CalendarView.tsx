"use client";

import { useEffect, useState, useMemo } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export type CalendarEvent = {
  id: number;
  status: string;
  starts_at: string;
  ends_at?: string;
  discipline?: string;
  session_type?: string;
  room_id?: number;
  room_name?: string;
  room_capacity?: number;
  coach_id?: number;
  coach_name?: string;
  seat_fee_credits?: number;
  room_fee_credits?: number;
  enrolment_id?: number;
  enrolment_status?: string;
  credits_charged?: number;
  attendees?: Array<{
    enrolment_id: number;
    person_id: number;
    name: string;
    email: string;
    status: string;
    enrolled_at: string;
  }>;
};

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"week" | "agenda">("week");

  const fetchCalendar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:4000/api/calendar", {
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Please log in to view your calendar.");
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load calendar events.");
      }

      const data = await res.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, []);

  // Format Helpers
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const getWeekDays = (baseDate: Date) => {
    const startOfWeek = new Date(baseDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const currentWeekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Group events by day (YYYY-MM-DD)
  const eventsByDay = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    for (const ev of events) {
      if (!ev.starts_at) continue;
      const key = ev.starts_at.split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    // Sort each day's events by start time
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    });
    return map;
  }, [events]);

  const handlePrevWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 7);
    setSelectedDate(d);
  };

  const handleNextWeek = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 7);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  // -------------------------------------------------------------
  // LOADING SKELETON
  // -------------------------------------------------------------
  if (loading) {
    return (
      <div className={`${spaceGrotesk.className} w-full space-y-6`}>
        <div className="flex justify-between items-center border-b-4 border-[#171717] pb-4">
          <div className="h-10 w-48 bg-gray-200 animate-pulse border-2 border-[#171717]"></div>
          <div className="h-10 w-32 bg-gray-200 animate-pulse border-2 border-[#171717]"></div>
        </div>

        {/* Desktop Grid Skeleton */}
        <div className="hidden md:grid grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="border-2 border-[#171717] bg-white p-3 min-h-[350px] shadow-[4px_4px_0_0_#171717] space-y-3"
            >
              <div className="h-6 w-3/4 bg-gray-200 animate-pulse border border-[#171717]"></div>
              <div className="h-24 bg-gray-200 animate-pulse border-2 border-[#171717]"></div>
              <div className="h-20 bg-gray-200 animate-pulse border-2 border-[#171717]"></div>
            </div>
          ))}
        </div>

        {/* Mobile Agenda Skeleton */}
        <div className="md:hidden space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="border-4 border-[#171717] bg-white p-4 shadow-[4px_4px_0_0_#171717] space-y-3"
            >
              <div className="h-6 w-1/2 bg-gray-200 animate-pulse border border-[#171717]"></div>
              <div className="h-20 bg-gray-200 animate-pulse border-2 border-[#171717]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------------
  if (error) {
    return (
      <div className={`${spaceGrotesk.className} border-4 border-[#171717] bg-[#FF5252] text-white p-6 shadow-[8px_8px_0_0_#171717] max-w-lg mx-auto text-center my-8`}>
        <h2 className="text-2xl font-bold uppercase mb-2 tracking-tight">Calendar Error</h2>
        <p className={`${plexMono.className} text-sm font-medium mb-6`}>{error}</p>
        <button
          onClick={fetchCalendar}
          className="border-2 border-[#171717] bg-white text-[#171717] px-6 py-2 font-bold uppercase shadow-[3px_3px_0_0_#171717] hover:translate-y-[2px] hover:shadow-[1px_1px_0_0_#171717] transition-all cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EMPTY STATE
  // -------------------------------------------------------------
  if (!events || events.length === 0) {
    return (
      <div className={`${spaceGrotesk.className} border-4 border-[#171717] bg-white p-8 md:p-12 shadow-[8px_8px_0_0_#171717] text-center max-w-xl mx-auto my-8`}>
        <div className="inline-block border-2 border-[#171717] bg-[#FFC93C] px-3 py-1 font-bold uppercase text-xs tracking-wider mb-4">
          Status: Ready
        </div>
        <h2 className="text-3xl font-bold uppercase tracking-tight mb-2">No Calendar Events</h2>
        <p className="text-sm text-[#171717]/70 mb-6 font-medium">
          You currently have no scheduled sessions, bookings, or active room slots on record.
        </p>
        <button
          onClick={fetchCalendar}
          className="border-2 border-[#171717] bg-[#2F4BFF] text-white px-6 py-2.5 font-bold uppercase tracking-wider shadow-[4px_4px_0_0_#171717] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#171717] transition-all cursor-pointer"
        >
          Refresh Feed
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EVENT CARD RENDERER (Role-Agnostic)
  // -------------------------------------------------------------
  const renderEventCard = (event: CalendarEvent) => {
    // 1. BUSY PERIOD (Masked session for other coaches)
    if (event.status === "busy_period") {
      return (
        <div
          key={event.id}
          className="border-2 border-[#171717] p-3 shadow-[3px_3px_0_0_#171717] relative overflow-hidden bg-[repeating-linear-gradient(45deg,#E5E5E5,#E5E5E5_10px,#D4D4D4_10px,#D4D4D4_20px)]"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="h-2 w-2 rounded-full bg-[#171717]"></span>
            <span className={`${plexMono.className} text-[11px] font-bold uppercase tracking-wider bg-[#171717] text-white px-1.5 py-0.5 border border-[#171717]`}>
              Busy / Room Booked
            </span>
          </div>
          <p className={`${plexMono.className} text-xs font-semibold text-[#171717]`}>
            {formatTime(event.starts_at)}
            {event.ends_at && ` – ${formatTime(event.ends_at)}`}
          </p>
        </div>
      );
    }

    // 2. STANDARD / FULL SESSION
    const sessionTypeColor =
      event.session_type?.toUpperCase() === "INTENSIVE"
        ? "bg-[#FF5252] text-white"
        : event.session_type?.toUpperCase() === "SHORT"
        ? "bg-[#17A672] text-white"
        : "bg-[#2F4BFF] text-white";

    return (
      <div
        key={event.id || `${event.starts_at}-${event.discipline}`}
        className="border-2 border-[#171717] bg-[#FAF6EE] p-3.5 shadow-[4px_4px_0_0_#171717] space-y-2 hover:-translate-y-0.5 transition-transform"
      >
        {/* Header Tags */}
        <div className="flex flex-wrap items-center gap-1.5">
          {event.session_type && (
            <span className={`${plexMono.className} text-[10px] font-bold uppercase px-1.5 py-0.5 border border-[#171717] ${sessionTypeColor}`}>
              {event.session_type}
            </span>
          )}
          {event.room_name && (
            <span className={`${plexMono.className} text-[10px] font-bold uppercase px-1.5 py-0.5 border border-[#171717] bg-[#FFC93C] text-[#171717]`}>
              {event.room_name}
            </span>
          )}
          {event.enrolment_status && (
            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 border ${event.enrolment_status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
              {event.enrolment_status}
            </span>
          )}
        </div>

        {/* Discipline & Coach */}
        <div>
          <h4 className="font-bold text-base leading-tight text-[#171717]">
            {event.discipline || "Coaching Session"}
          </h4>
          {event.coach_name && (
            <p className="text-xs text-[#171717]/80 mt-0.5 font-medium">
              Coach: <span className="font-bold">{event.coach_name}</span>
            </p>
          )}
        </div>

        {/* Time */}
        <div className={`${plexMono.className} text-xs font-semibold text-[#171717]/90 pt-1 border-t border-dashed border-[#171717]/30 flex justify-between items-center`}>
          <span>
            {formatTime(event.starts_at)}
            {event.ends_at && ` – ${formatTime(event.ends_at)}`}
          </span>
          {event.seat_fee_credits && (
            <span className="text-[11px] bg-white px-1.5 py-0.5 border border-[#171717]">
              {event.seat_fee_credits} cr
            </span>
          )}
        </div>

        {/* Attendees List (If Authorized for Coach / Admin) */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="pt-2 border-t-2 border-[#171717]/20">
            <p className={`${plexMono.className} text-[11px] font-bold uppercase tracking-wider mb-1 text-[#171717]/70`}>
              Enrolled ({event.attendees.length}):
            </p>
            <div className="flex flex-wrap gap-1">
              {event.attendees.map((att) => (
                <span
                  key={att.enrolment_id || att.person_id}
                  className="text-[10px] bg-white border border-[#171717] px-1.5 py-0.5 font-medium"
                >
                  {att.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // -------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------
  return (
    <div className={`${spaceGrotesk.className} w-full space-y-6 text-[#171717]`}>
      {/* Calendar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-4 border-[#171717] pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">Centre Calendar</h2>
          <p className={`${plexMono.className} text-xs text-[#171717]/70 mt-1`}>
            {selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Week Navigation */}
          <div className="flex items-center border-2 border-[#171717] bg-white shadow-[3px_3px_0_0_#171717]">
            <button
              onClick={handlePrevWeek}
              className="px-3 py-1.5 font-bold hover:bg-[#FAF6EE] border-r-2 border-[#171717] cursor-pointer"
              title="Previous Week"
            >
              ←
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-[#FAF6EE] cursor-pointer"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="px-3 py-1.5 font-bold hover:bg-[#FAF6EE] border-l-2 border-[#171717] cursor-pointer"
              title="Next Week"
            >
              →
            </button>
          </div>

          {/* View Mode Toggle for Desktop */}
          <div className="hidden md:flex border-2 border-[#171717] bg-white shadow-[3px_3px_0_0_#171717]">
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                viewMode === "week" ? "bg-[#2F4BFF] text-white" : "hover:bg-[#FAF6EE]"
              }`}
            >
              Week View
            </button>
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-l-2 border-[#171717] ${
                viewMode === "agenda" ? "bg-[#2F4BFF] text-white" : "hover:bg-[#FAF6EE]"
              }`}
            >
              Agenda View
            </button>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* 1. DESKTOP WEEK GRID VIEW (>= 768px and viewMode === 'week')*/}
      {/* ----------------------------------------------------------- */}
      {viewMode === "week" && (
        <div className="hidden md:grid grid-cols-7 gap-3">
          {currentWeekDays.map((day) => {
            const key = formatDateKey(day);
            const dayEvents = eventsByDay[key] || [];
            const isToday = formatDateKey(new Date()) === key;

            return (
              <div
                key={key}
                className={`border-2 border-[#171717] bg-white p-3 min-h-[420px] shadow-[4px_4px_0_0_#171717] flex flex-col ${
                  isToday ? "ring-2 ring-[#2F4BFF]" : ""
                }`}
              >
                {/* Day Header */}
                <div className={`border-b-2 border-[#171717] pb-2 mb-3 ${isToday ? "bg-[#2F4BFF] text-white -mx-3 -mt-3 p-3 mb-3 border-b-2 border-[#171717]" : ""}`}>
                  <p className={`${plexMono.className} text-[11px] font-bold uppercase tracking-wider opacity-80`}>
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-lg font-extrabold leading-none mt-0.5">
                    {day.getDate()}
                  </p>
                </div>

                {/* Day's Event Stack */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-1">
                  {dayEvents.length === 0 ? (
                    <p className="text-[11px] text-[#171717]/40 text-center py-6 font-medium italic">
                      No events
                    </p>
                  ) : (
                    dayEvents.map(renderEventCard)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* 2. AGENDA VIEW (Mobile < 768px or desktop viewMode === 'agenda') */}
      {/* ----------------------------------------------------------- */}
      <div className={`${viewMode === "agenda" ? "block" : "md:hidden"} space-y-6`}>
        {Object.keys(eventsByDay).length === 0 ? (
          <div className="border-2 border-dashed border-[#171717]/40 p-8 text-center bg-white">
            <p className="font-bold">No sessions found in agenda.</p>
          </div>
        ) : (
          Object.keys(eventsByDay)
            .sort()
            .map((dateKey) => {
              const dayDate = new Date(`${dateKey}T00:00:00`);
              const dayEvents = eventsByDay[dateKey];

              return (
                <div
                  key={dateKey}
                  className="border-4 border-[#171717] bg-white p-4 md:p-6 shadow-[6px_6px_0_0_#171717] space-y-4"
                >
                  {/* Date Banner */}
                  <div className="flex items-center justify-between border-b-2 border-dashed border-[#171717]/30 pb-2">
                    <div>
                      <span className={`${plexMono.className} text-xs font-bold uppercase tracking-wider bg-[#FFC93C] text-[#171717] px-2 py-0.5 border border-[#171717]`}>
                        {dayDate.toLocaleDateString("en-US", { weekday: "long" })}
                      </span>
                      <h3 className="text-xl font-extrabold mt-1">
                        {dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </h3>
                    </div>
                    <span className={`${plexMono.className} text-xs font-bold text-[#171717]/60`}>
                      {dayEvents.length} {dayEvents.length === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {/* Stacked Cards for 375px+ */}
                  <div className="space-y-3">
                    {dayEvents.map(renderEventCard)}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
}
