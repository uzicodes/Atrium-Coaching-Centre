"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

const navLinks = [
  { href: "/#fees", label: "Fee schedule" },
  { href: "/#coach-policy", label: "Coach policy" },
  { href: "/#participant-policy", label: "Participant policy" },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: number; email: string; full_name: string; kind: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        const res = await fetch("http://localhost:4000/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setUser(data);
        } else {
          if (isMounted) setUser(null);
        }
      } catch {
        if (isMounted) setUser(null);
      }
    }
    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch("http://localhost:4000/api/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Sign out failed", err);
    }
  };

  const getDashboardHref = () => {
    if (!user) return "/login";
    if (user.kind === "admin") return "/admin/dashboard";
    if (user.kind === "coach") return "/coach/dashboard";
    if (user.kind === "participant") return "/participant/dashboard";
    return "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b-2 border-[#171717] bg-[#FAF6EE]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link
          href="/#top"
          className="flex items-center gap-2.5 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F4BFF]"
        >
          <img
            src="/logo.webp"
            alt="Atrium Logo"
            className="h-9 w-auto object-contain"
          />
          <span className="text-xl font-bold tracking-tight text-[#171717]">ATRIUM</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#171717]/70 transition-colors hover:text-[#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F4BFF]"
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href={getDashboardHref()}
              className="text-sm font-bold text-[#2F4BFF] hover:underline"
            >
              Portal ({user.kind.toUpperCase()})
            </Link>
          )}
        </nav>

        {/* Action Button (Sign in / Sign out) */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={handleSignOut}
              className="hidden items-center border-2 border-[#171717] bg-[#FF5252] px-5 py-2.5 text-sm font-semibold text-white shadow-[3px_3px_0_0_#171717] transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171717] sm:inline-flex motion-reduce:transition-none cursor-pointer"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="hidden items-center border-2 border-[#171717] bg-[#2F4BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-[3px_3px_0_0_#171717] transition-transform hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_#171717] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#171717] sm:inline-flex motion-reduce:transition-none"
            >
              Sign in
            </Link>
          )}

          {/* Mobile Hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="inline-flex h-10 w-10 items-center justify-center border-2 border-[#171717] text-[#171717] md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4BFF] cursor-pointer"
          >
            <span className="sr-only">Toggle menu</span>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path
                d="M2 5H16M2 9H16M2 13H16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {menuOpen && (
        <div id="mobile-nav" className="border-t-2 border-[#171717] bg-[#FAF6EE] px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-[#171717]/70 hover:text-[#171717]"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <>
                <Link
                  href={getDashboardHref()}
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-bold text-[#2F4BFF]"
                >
                  Go to {user.kind.toUpperCase()} Portal
                </Link>
                <button
                  onClick={handleSignOut}
                  className="mt-2 w-full border-2 border-[#171717] bg-[#FF5252] px-4 py-2 text-center text-sm font-bold text-white shadow-[3px_3px_0_0_#171717]"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="mt-2 w-full border-2 border-[#171717] bg-[#2F4BFF] px-4 py-2 text-center text-sm font-bold text-white shadow-[3px_3px_0_0_#171717]"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
