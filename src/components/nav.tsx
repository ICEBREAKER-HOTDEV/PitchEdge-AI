"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV } from "@/lib/nav";

export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Logo />
          <span>PitchEdge<span className="text-pitch">.</span>AI</span>
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-md px-2.5 py-1.5 text-[13px] transition-colors ${
                path === n.href ? "bg-panel-2 text-ink" : "text-muted hover:text-ink"
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>
        <button className="rounded-md border border-line px-2.5 py-1 text-sm text-muted lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <div className="border-t border-line px-4 py-2 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)}
              className={`block rounded-md px-2 py-2 text-sm ${path === n.href ? "text-pitch" : "text-muted"}`}>
              {n.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="1.5" y="3.5" width="21" height="17" rx="2.5" stroke="var(--pitch)" strokeWidth="1.5" />
      <line x1="12" y1="3.5" x2="12" y2="20.5" stroke="var(--pitch)" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="var(--pitch)" strokeWidth="1.5" />
      <path d="M15 15.5 L19 9.5 L21 11" stroke="var(--amber)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
