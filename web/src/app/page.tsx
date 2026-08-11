"use client";

import Link from "next/link";
import { useState } from "react";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";


const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

/* Data */

type FeeTier = {
  tag: string;
  name: string;
  duration: string;
  durationNote?: string;
  coachFee: number;
  participantFee: number;
  accent: "mint" | "cobalt" | "coral";
};

const feeSchedule: FeeTier[] = [
  {
    tag: "SHORT",
    name: "Short",
    duration: "45",
    durationNote: "min",
    coachFee: 200,
    participantFee: 50,
    accent: "mint",
  },
  {
    tag: "STANDARD",
    name: "Standard",
    duration: "60",
    durationNote: "min",
    coachFee: 300,
    participantFee: 75,
    accent: "cobalt",
  },
  {
    tag: "INTENSIVE",
    name: "Intensive",
    duration: "180",
    durationNote: "min + 30 min break",
    coachFee: 800,
    participantFee: 200,
    accent: "coral",
  },
];

type RefundTier = { window: string; percent: number };

const coachRefundTiers: RefundTier[] = [
  { window: "96+ hrs before", percent: 100 },
  { window: "48–96 hrs before", percent: 50 },
  { window: "24–48 hrs before", percent: 25 },
  { window: "Under 24 hrs", percent: 0 },
];

const participantRefundTiers: RefundTier[] = [
  { window: "72+ hrs before", percent: 100 },
  { window: "24–72 hrs before", percent: 50 },
  { window: "Under 24 hrs", percent: 0 },
];

const navLinks = [
  { href: "#fees", label: "Fee schedule" },
  { href: "#coach-policy", label: "Coach policy" },
  { href: "#participant-policy", label: "Participant policy" },
];

const tickerItems = [
  "SHORT · COACH 200creds / SEAT 50creds",
  "STANDARD · COACH 300creds / SEAT 75creds",
  "INTENSIVE · COACH 800creds / SEAT 200creds",
  "BOOK 48HRS AHEAD",
  "PARTICIPANTS START AT 4,000creds",
  "COACHES START AT 2,000creds",
];

/* Style helpers */

const ACCENTS = {
  mint: { bg: "bg-[#17A672]", text: "text-[#17A672]", soft: "bg-[#DFF3EA]" },
  cobalt: { bg: "bg-[#2F4BFF]", text: "text-[#2F4BFF]", soft: "bg-[#E1E6FF]" },
  coral: { bg: "bg-[#FF5252]", text: "text-[#FF5252]", soft: "bg-[#FFE3E1]" },
} as const;

function pillColor(percent: number): { bg: string; text: string } {
  if (percent >= 100) return { bg: "bg-[#17A672]", text: "text-white" };
  if (percent >= 50) return { bg: "bg-[#FFC93C]", text: "text-[#171717]" };
  if (percent >= 25) return { bg: "bg-[#FFE3A6]", text: "text-[#171717]" };
  return { bg: "bg-[#FFE3E1]", text: "text-[#FF5252]" };
}


/* Reusable bits */

function RefundSchedule({ tiers }: { tiers: RefundTier[] }) {
  return (
    <dl className="border-2 border-[#171717] bg-[#FAF6EE]">
      {tiers.map((tier, i) => {
        const c = pillColor(tier.percent);
        return (
          <div
            key={tier.window}
            className={`flex items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-5 ${i > 0 ? "border-t-2 border-dashed border-[#171717]/25" : ""
              }`}
          >
            <dt className="text-base font-medium sm:text-lg">
              {tier.window}
            </dt>
            <dd
              className={`${plexMono.className} shrink-0 border-2 border-[#171717] ${c.bg} ${c.text} px-4 py-1.5 text-sm font-semibold tabular-nums sm:text-base`}
            >
              {tier.percent}%
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`${plexMono.className} inline-block border-2 border-[#171717] bg-[#FFC93C] px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-[#171717]`}
    >
      {children}
    </span>
  );
}



/* Page */

export default function Home() {
  return (
    <div
      className={`${spaceGrotesk.variable} ${plexMono.variable} min-h-screen bg-[#FAF6EE] text-[#171717] antialiased`}
      style={{ fontFamily: "var(--font-display), sans-serif" }}
    >



      {/* Ticker */}

      <div className="overflow-hidden border-b-2 border-[#171717] bg-[#171717] py-2.5">
        <div
          className="flex w-max animate-[ticker_28s_linear_infinite] gap-10 motion-reduce:animate-none"
          aria-hidden="true"
        >
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span
              key={i}
              className={`${plexMono.className} flex items-center gap-10 whitespace-nowrap text-xs font-medium tracking-[0.08em] text-[#FFC93C]`}
            >
              {item}
              <span className="text-[#FF5252]">✦</span>
            </span>
          ))}
        </div>
        <span className="sr-only">
          Short session: coach 200 credits, seat 50 credits. Standard
          session: coach 300 credits, seat 75 credits. Intensive session:
          coach 800 credits, seat 200 credits. Rooms must be booked 48 hours
          ahead. Participants start with 4,000 credits. Coaches start with
          2,000 credits.
        </span>
      </div>

      <main id="top">


        {/* Hero */}

        <section className="relative overflow-hidden px-6 pb-20 pt-16 sm:pb-28 sm:pt-24">
          <div className="mx-auto max-w-6xl">
            <SectionTag>CREDIT-BASED SESSION EXCHANGE</SectionTag>

            <h1 className="mt-6 text-5xl font-bold leading-[0.98] tracking-tight sm:text-7xl md:text-8xl">
              Book coaching.
              <br />
              <span className="text-[#2F4BFF]">Spend</span>{" "}
              <span className="text-[#FF5252]">credits.</span>
              <br />
              See <span className="underline decoration-[#FFC93C] decoration-[10px] underline-offset-4">everything.</span>
            </h1>

            <p className="mt-8 max-w-xl text-base leading-relaxed text-[#171717]/70 sm:text-lg">
              Atrium runs on an open credit economy. Every room fee, seat
              fee, and cancellation rule is on this page — not buried in a
              contract you sign after you&apos;ve already booked.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center border-2 border-[#171717] bg-[#171717] px-7 py-3.5 text-sm font-semibold text-[#FAF6EE] shadow-[4px_4px_0_0_#2F4BFF] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#2F4BFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F4BFF] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                Sign in to book
              </Link>
              <a
                href="#fees"
                className="inline-flex items-center justify-center border-2 border-[#171717] bg-transparent px-7 py-3.5 text-sm font-semibold text-[#171717] transition-colors hover:bg-[#171717] hover:text-[#FAF6EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F4BFF]"
              >
                See fee schedule
              </a>
            </div>

            {/* Opening balance scoreboard */}
            <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="border-2 border-[#171717] bg-[#FAF6EE] p-6 shadow-[6px_6px_0_0_#171717]">
                <p className={`${plexMono.className} text-xs font-medium tracking-[0.14em] text-[#171717]/60 uppercase`}>
                  Participant opening balance
                </p>
                <p className={`${plexMono.className} mt-3 text-5xl font-semibold tabular-nums sm:text-6xl`}>
                  4,000
                  <span className="ml-2 text-lg font-normal text-[#171717]/50">creds</span>
                </p>
              </div>
              <div className="border-2 border-[#171717] bg-[#2F4BFF] p-6 text-white shadow-[6px_6px_0_0_#171717]">
                <p className={`${plexMono.className} text-xs font-medium tracking-[0.14em] text-white/70 uppercase`}>
                  Coach opening balance
                </p>
                <p className={`${plexMono.className} mt-3 text-5xl font-semibold tabular-nums sm:text-6xl`}>
                  2,000
                  <span className="ml-2 text-lg font-normal text-white/60">creds</span>
                </p>
              </div>
            </div>
          </div>
        </section>




        {/* Fee schedule */}

        <section id="fees" className="border-t-2 border-[#171717] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionTag>FEE SCHEDULE</SectionTag>
            <h2 className="mt-5 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Three lengths. Two fees each.
            </h2>
            <p className="mt-4 max-w-xl text-[#171717]/70">
              Coaches pay a room fee to host; participants pay a seat fee to
              attend. Sorted shortest to longest.
            </p>

            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
              {feeSchedule.map((tier) => {
                const c = ACCENTS[tier.accent];
                return (
                  <div
                    key={tier.tag}
                    className="flex flex-col border-2 border-[#171717] bg-[#FAF6EE] p-6 shadow-[6px_6px_0_0_#171717] transition-transform hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <span
                      className={`${plexMono.className} inline-block w-fit border-2 border-[#171717] ${c.bg} px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-white`}
                    >
                      {tier.tag}
                    </span>

                    <p className={`${plexMono.className} mt-6 flex items-baseline gap-1.5`}>
                      <span className="text-5xl font-semibold tabular-nums">
                        {tier.duration}
                      </span>
                      <span className="text-sm text-[#171717]/60">
                        {tier.durationNote}
                      </span>
                    </p>

                    <div className="mt-6 flex flex-col gap-3 border-t-2 border-dashed border-[#171717]/25 pt-5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#171717]/70">
                          Coach room fee
                        </span>
                        <span className={`${plexMono.className} text-lg font-semibold tabular-nums`}>
                          {tier.coachFee.toLocaleString()} creds
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#171717]/70">
                          Participant seat fee
                        </span>
                        <span className={`${plexMono.className} text-lg font-semibold tabular-nums`}>
                          {tier.participantFee.toLocaleString()} creds
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>



        {/* Coach booking policy*/}
        <section id="coach-policy" className="border-t-2 border-[#171717] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionTag>COACH BOOKING POLICY</SectionTag>
            <h2 className="mt-5 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              Book early. Cancel with notice.
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
              <div className="flex flex-col justify-between border-2 border-[#171717] bg-[#2F4BFF] p-6 text-white shadow-[6px_6px_0_0_#171717] sm:p-8">
                <p className={`${plexMono.className} text-xs font-medium tracking-[0.14em] text-white/70 uppercase`}>
                  Booking deadline
                </p>
                <p className={`${plexMono.className} mt-6 text-6xl font-bold tabular-nums sm:text-7xl`}>
                  48
                  <span className="ml-1 text-2xl font-semibold">HRS</span>
                </p>
                <p className="mt-6 text-sm leading-relaxed text-white/85">
                  Minimum notice a coach must give when booking a room ahead
                  of a session.
                </p>
              </div>

              <div>
                <p className="mb-4 text-sm font-medium text-[#171717]/70">
                  Refund schedule — coach-initiated cancellations
                </p>
                <div className="shadow-[6px_6px_0_0_#171717]">
                  <RefundSchedule tiers={coachRefundTiers} />
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Participant policy*/}
        <section id="participant-policy" className="border-t-2 border-[#171717] px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionTag>PARTICIPANT POLICY</SectionTag>
            <h2 className="mt-5 max-w-xl text-4xl font-bold tracking-tight sm:text-5xl">
              If we cancel, you&apos;re covered.
            </h2>

            <div className="mt-10 flex flex-col items-start gap-2 border-2 border-[#171717] bg-[#17A672] p-6 text-white sm:flex-row sm:items-center sm:gap-6">
              <span className={`${plexMono.className} text-6xl font-bold tabular-nums sm:text-7xl`}>
                100%
              </span>
              <p className="text-lg text-white/90">
                Automatic refund whenever a coach cancels a session.
              </p>
            </div>

            <div className="mt-10">
              <p className="mb-4 text-sm font-medium text-[#171717]/70">
                Refund schedule — voluntary participant cancellations
              </p>
              <div className="shadow-[6px_6px_0_0_#171717]">
                <RefundSchedule tiers={participantRefundTiers} />
              </div>
            </div>

            <p className={`${plexMono.className} mt-6 inline-block border-2 border-dashed border-[#171717]/40 px-4 py-2 text-xs leading-relaxed text-[#171717]/70`}>
              NOTE — fractional refunds are rounded up to the nearest whole
              credit.
            </p>
          </div>
        </section>


        {/* Closing CTA */}
        <section className="border-t-2 border-[#171717] bg-[#2F4BFF] px-6 py-16 text-white sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Every credit accounted for. Every session on the record.
              </h2>
              <p className="mt-2 max-w-md text-sm text-white/80">
                Sign in to check your balance, book a room, or reserve a
                seat.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center justify-center border-2 border-[#171717] bg-[#FAF6EE] px-7 py-3.5 text-sm font-semibold text-[#171717] shadow-[4px_4px_0_0_#171717] transition-transform hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171717] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>


      {/* Footer                                                          */}
      <footer className="border-t-2 border-[#171717] bg-[#FAF6EE]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-[#171717]/60 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Atrium Coaching Centre.</p>
          <p className={plexMono.className}>
            1 credit ≈ 1 unit of session value. Balances and fees shown are
            illustrative of platform policy.
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}