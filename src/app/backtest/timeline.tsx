"use client";

import { useState } from "react";
import { Card, CardTitle, Pill } from "@/components/ui";

// Minutes before kickoff when each fact typically becomes knowable (illustrative MLS schedule).
const FACTS = [
  { k: "Previous matches, xG, ratings", t: 4320 },
  { k: "Opening odds", t: 4320 },
  { k: "Official injury report", t: 2880 },
  { k: "Suspensions / int'l call-ups", t: 2880 },
  { k: "Projected XI (beat reporters)", t: 1440 },
  { k: "Weather forecast", t: 720 },
  { k: "Intraday odds (taken price)", t: 240 },
  { k: "Late fitness news", t: 180 },
  { k: "Confirmed starting XI", t: 75 },
  { k: "Closing odds", t: 0 },
  { k: "Final score & match xG", t: -120 },
];

const STAMPS = [
  { label: "T-48h", t: 2880, note: "Early-week model: ratings + injury report, projected XI from priors." },
  { label: "T-4h", t: 240, note: "Pre-lineup model: everything except the confirmed XI." },
  { label: "T-60m", t: 60, note: "Post-lineup model: confirmed XI known, prices move fast." },
  { label: "Close", t: 0, note: "Closing odds are a benchmark for CLV - never a feature for a bet placed earlier." },
];

const fmt = (m: number) => (m <= 0 ? (m === 0 ? "KO" : `KO+${-m / 60}h`) : m >= 1440 ? `T-${m / 1440}d` : m >= 60 ? `T-${m / 60}h` : `T-${m}m`);

export function InfoTimeline() {
  const [i, setI] = useState(1);
  const s = STAMPS[i];
  return (
    <Card>
      <CardTitle sub="Pick when the historical prediction is supposed to be made. The feature store only returns facts stamped before it.">
        As-of feature query
      </CardTitle>
      <div className="flex flex-wrap gap-2">
        {STAMPS.map((x, j) => (
          <button key={x.label} onClick={() => setI(j)}
            className={`num rounded-md border px-3 py-1.5 text-sm ${j === i ? "border-pitch bg-pitch/15 text-pitch" : "border-line text-muted hover:text-ink"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="mt-3 text-sm text-muted">{s.note}</div>
      <div className="mt-5 space-y-1.5">
        {FACTS.map((f) => {
          const ok = s.t === 0 ? f.t > 0 : f.t >= s.t; // closing odds are never a feature
          const left = 100 - (Math.max(-120, Math.min(4320, f.t)) + 120) / 4440 * 100;
          return (
            <div key={f.k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[220px_1fr_auto]">
              <div className={`truncate text-[13px] ${ok ? "text-ink" : "text-faint line-through"}`}>{f.k}</div>
              <div className="relative hidden h-2 rounded-full bg-line sm:block">
                <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 bg-amber" style={{ left: `${100 - (s.t + 120) / 4440 * 100}%` }} />
                <div className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${ok ? "bg-pitch" : "bg-rose"}`} style={{ left: `${left}%` }} />
              </div>
              <div className="flex w-[124px] items-center justify-end gap-2">
                <span className="num w-14 text-right text-[11px] text-faint">{fmt(f.t)}</span>
                <Pill tone={ok ? "green" : "rose"}>{ok ? "allowed" : "leak"}</Pill>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 hidden justify-between pl-[232px] pr-[136px] text-[10px] text-faint sm:flex">
        <span>3 days before</span><span className="text-amber">▲ prediction time</span><span>after KO</span>
      </div>
    </Card>
  );
}
