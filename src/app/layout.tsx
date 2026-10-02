import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav } from "@/components/nav";
import { NAV } from "@/lib/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "PitchEdge AI - MLS Betting Model Blueprint", template: "%s · PitchEdge AI" },
  description:
    "Prototype and blueprint for a calibrated MLS prediction system: xG, Dixon-Coles score grids, 1X2 / Asian handicap / totals, no-vig EV and leakage-free backtesting.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              PitchEdge AI · prototype blueprint for an MLS probability &amp; betting-decision system. Numbers in demos are
              illustrative, not live data or betting advice.
            </div>
            <div className="flex flex-wrap gap-3">
              {NAV.slice(1).map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>
              ))}
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
