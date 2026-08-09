import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Atrium Coaching Centre",
  description: "Master your craft with professional coaching.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}