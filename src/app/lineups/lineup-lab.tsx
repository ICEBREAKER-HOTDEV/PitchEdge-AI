"use client";

import { useState } from "react";
import { oneXTwo, pct, scoreGrid } from "@/lib/model";
import { Card, CardTitle, Pill, Slider, Stat } from "@/components/ui";

type Pos = "GK" | "DEF" | "MID" | "FWD";
interface Player { id: string; name: string; pos: Pos; off: number; def: number; starter: boolean; mins: number }

// Illustrative squad. off / def = goals per 90 added above a generic replacement.
const SQUAD: Player[] = [
  { id: "gk1", name: "R. Okafor", pos: "GK", off: 0, def: 0, starter: true, mins: 90 },
  { id: "d1", name: "M. Varela", pos: "DEF", off: 0.03, def: 0.09, starter: true, mins: 90 },
  { id: "d2", name: "J. Brandt", pos: "DEF", off: 0.02, def: 0.07, starter: true, mins: 90 },
  { id: "d3", name: "T. Asante", pos: "DEF", off: 0.06, def: 0.04, starter: true, mins: 85 },
  { id: "d4", name: "L. Moreau", pos: "DEF", off: 0.05, def: 0.03, starter: true, mins: 85 },
  { id: "m1", name: "D. Iturbe", pos: "MID", off: 0.17, def: 0.05, starter: true, mins: 85 },
  { id: "m2", name: "K. Hale", pos: "MID", off: 0.08, def: 0.08, starter: true, mins: 88 },
  { id: "m3", name: "S. Ndiaye", pos: "MID", off: 0.12, def: 0.03, starter: true, mins: 78 },
  { id: "f1", name: "C. Benítez (star)", pos: "FWD", off: 0.42, def: 0.0, starter: true, mins: 85 },
  { id: "f2", name: "A. Lindqvist", pos: "FWD", off: 0.21, def: 0.01, starter: true, mins: 80 },
  { id: "f3", name: "E. Rowe", pos: "FWD", off: 0.18, def: 0.01, starter: true, mins: 75 },
  { id: "gk2", name: "P. Duarte", pos: "GK", off: 0, def: 0, starter: false, mins: 0 },
  { id: "d5", name: "N. Kerr", pos: "DEF", off: 0.01, def: 0.02, starter: false, mins: 0 },
  { id: "m4", name: "B. Osei", pos: "MID", off: 0.05, def: 0.02, starter: false, mins: 0 },
  { id: "f4", name: "H. Tanaka", pos: "FWD", off: 0.1, def: 0.0, starter: false, mins: 0 },
];

// Goalkeepers: raw goals prevented per 90 and shots faced; shrunk toward 0 by sample size.
const GK_RAW: Record<string, { gp90: number; shots: number }> = {
  gk1: { gp90: 0.22, shots: 260 },
  gk2: { gp90: -0.18, shots: 40 },
};
const GK_K = 400; // shots needed for 50% trust in observed shot-stopping
const gkValue = (id: string) => GK_RAW[id].gp90 * (GK_RAW[id].shots / (GK_RAW[id].shots + GK_K));

const OVERLAP = 0.7; // team-level shrink: individual contributions overlap
const BASE_H = 1.55, BASE_A = 1.2;

export function LineupLab() {
  const [out, setOut] = useState<Set<string>>(new Set());
  const [rest, setRest] = useState(0);
  const [km, setKm] = useState(1200);
  const [tz, setTz] = useState(1);
  const [alt, setAlt] = useState(0);
  const [turf, setTurf] = useState(false);
  const [congest, setCongest] = useState(1);

  const toggle = (id: string) => {
    const s = new Set(out);
    if (s.has(id)) s.delete(id); else s.add(id);
    setOut(s);
  };

  // For each missing starter, pick the best available same-position bench player.
  const used = new Set<string>();
  const subs = SQUAD.filter((p) => p.starter && out.has(p.id)).map((p) => {
    const rep = SQUAD.filter((b) => !b.starter && b.pos === p.pos && !out.has(b.id) && !used.has(b.id))
      .sort((x, y) => y.off + y.def - (x.off + x.def))[0];
    if (rep) used.add(rep.id);
    const repOff = rep?.off ?? 0, repDef = rep?.def ?? -0.02; // out-of-position fallback
    const w = p.mins / 90;
    const isGk = p.pos === "GK";
    const dOff = (p.off - repOff) * w * OVERLAP;
    const dDef = isGk ? gkValue(p.id) - (rep ? gkValue(rep.id) : -0.2) : (p.def - repDef) * w * OVERLAP;
    return { p, rep, dOff, dDef };
  });
  const lostAttack = subs.reduce((s, x) => s + x.dOff, 0);
  const lostDefence = subs.reduce((s, x) => s + x.dDef, 0);

  // Context multipliers (illustrative, deliberately small): applied to the away side's attack.
  const ctxAway = Math.exp(-0.012 * rest - 0.000012 * km - 0.012 * tz - 0.00003 * alt - (turf ? 0.02 : 0));
  const ctxHome = Math.exp(-0.018 * Math.max(0, congest - 1));

  const lhCtx = BASE_H * ctxHome, laCtx = BASE_A * ctxAway;
  const lhAdj = Math.max(0.2, (BASE_H - lostAttack) * ctxHome);
  const laAdj = Math.max(0.2, (BASE_A + lostDefence) * ctxAway);
  const before = oneXTwo(scoreGrid(lhCtx, laCtx, -0.07));
  const after = oneXTwo(scoreGrid(lhAdj, laAdj, -0.07));

  // What a naive "injury count" feature would say: same hit per player, whoever it is.
  const naive = oneXTwo(scoreGrid(lhCtx * (1 - 0.03 * out.size), laCtx, -0.07));

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <Card>
        <CardTitle sub="Click a starter to rule them out. Value = goals per 90 above a generic replacement (illustrative).">Home squad</CardTitle>
        <div className="grid gap-2 sm:grid-cols-2">
          {SQUAD.map((p) => {
            const isOut = out.has(p.id);
            const isRep = used.has(p.id);
            return (
              <button key={p.id} onClick={() => toggle(p.id)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors ${
                  isOut ? "border-rose/50 bg-rose/10" : isRep ? "border-pitch/50 bg-pitch/10" : "border-line bg-panel-2/50 hover:border-line-2"
                }`}>
                <div className="flex items-center gap-2.5">
                  <span className="num w-9 rounded bg-bg px-1 py-0.5 text-center text-[10px] text-muted">{p.pos}</span>
                  <div>
                    <div className={`text-sm ${isOut ? "text-rose line-through" : ""}`}>{p.name}</div>
                    <div className="num text-[11px] text-faint">
                      {p.pos === "GK" ? `GP/90 ${GK_RAW[p.id].gp90.toFixed(2)} raw → ${gkValue(p.id).toFixed(2)} shrunk` : `off ${p.off.toFixed(2)} · def ${p.def.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                <div>
                  {isOut ? <Pill tone="rose">OUT</Pill> : isRep ? <Pill tone="green">IN</Pill> : p.starter ? <Pill>XI</Pill> : <Pill>bench</Pill>}
                </div>
              </button>
            );
          })}
        </div>
        {subs.length > 0 && (
          <div className="mt-4 space-y-1.5 text-[13px]">
            {subs.map((s) => (
              <div key={s.p.id} className="num flex flex-wrap justify-between gap-2 border-t border-line pt-1.5 text-muted">
                <span className="font-sans">{s.p.name} → {s.rep?.name ?? "out-of-position cover"}</span>
                <span>attack −{s.dOff.toFixed(3)} · conceded +{s.dDef.toFixed(3)} xG</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-5">
        <Card>
          <CardTitle sub="Applied as multipliers on λ; coefficients are placeholders until fitted.">Schedule & travel</CardTitle>
          <div className="space-y-4">
            <Slider label="Rest advantage, home (days)" value={rest} min={-4} max={4} step={1} onChange={setRest} />
            <Slider label="Away travel (km)" value={km} min={0} max={4500} step={50} onChange={setKm} />
            <Slider label="Time zones crossed (away)" value={tz} min={0} max={3} step={1} onChange={setTz} />
            <Slider label="Venue altitude (m)" value={alt} min={0} max={1600} step={50} onChange={setAlt} />
            <Slider label="Home matches in last 10 days" value={congest} min={1} max={4} step={1} onChange={setCongest} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={turf} onChange={(e) => setTurf(e.target.checked)} className="accent-[var(--pitch)]" /> Artificial turf venue
            </label>
          </div>
        </Card>

        <Card>
          <CardTitle>Effect on the match</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="λ home" value={lhAdj.toFixed(2)} sub={`full XI ${lhCtx.toFixed(2)} · neutral ${BASE_H.toFixed(2)}`} />
            <Stat label="λ away" value={laAdj.toFixed(2)} sub={`full XI ${laCtx.toFixed(2)} · neutral ${BASE_A.toFixed(2)}`} />
          </div>
          <table className="num mt-4 w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-faint">
              <tr><th className="text-left">Model</th><th className="text-right">H</th><th className="text-right">D</th><th className="text-right">A</th></tr>
            </thead>
            <tbody>
              {[["Full XI + context", before], ["Value-based absences", after], ["Injury count", naive]].map(([l, r]) => {
                const x = r as typeof before;
                return (
                  <tr key={l as string} className="border-t border-line">
                    <td className="py-1.5 font-sans text-muted">{l as string}</td>
                    <td className="text-right">{pct(x.home)}</td><td className="text-right">{pct(x.draw)}</td><td className="text-right">{pct(x.away)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 text-[11px] leading-relaxed text-faint">
            Try ruling out the star striker, then instead a backup-level defender: the injury-count model moves the same amount both
            times, the value-based model does not.
          </div>
        </Card>
      </div>
    </div>
  );
}
