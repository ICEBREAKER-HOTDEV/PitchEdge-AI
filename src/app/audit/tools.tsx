"use client";

import { useState } from "react";
import { devig, ev, implied, overround, pct, scoreGrid, totalOver, oneXTwo } from "@/lib/model";
import { Card, CardTitle, NumField, Pill, Slider, Stat } from "@/components/ui";

type P3 = [number, number, number];

const sum = (p: number[]) => p.reduce((s, x) => s + x, 0);

function ProbEdit({ label, p, set }: { label: string; p: P3; set: (p: P3) => void }) {
  return (
    <div>
      <div className="mb-1.5 text-xs text-muted">{label} <span className="num ml-1 text-faint">Σ {sum(p).toFixed(3)}</span></div>
      <div className="grid grid-cols-3 gap-2">
        {["H", "D", "A"].map((l, i) => <NumField key={l} label={l} value={p[i]} onChange={(v) => set(p.map((x, j) => (j === i ? v : x)) as P3)} />)}
      </div>
    </div>
  );
}

// ---------------- Blend checker ----------------
export function BlendChecker() {
  const [a, setA] = useState<P3>([0.64, 0.21, 0.15]);
  const [b, setB] = useState<P3>([0.5, 0.27, 0.23]);
  const [wa, setWa] = useState(0.6);
  const [wbRaw, setWbRaw] = useState(0.4);

  const wSum = wa + wbRaw;
  const linear = a.map((x, i) => (wa * x + wbRaw * b[i]) / wSum) as P3;
  const geo = (() => { const g = a.map((x, i) => Math.pow(x, wa / wSum) * Math.pow(b[i], wbRaw / wSum)); const s = g.reduce((p, q) => p + q, 0); return g.map((x) => x / s) as P3; })();
  // Common bugs seen in real pipelines:
  const unnormalised = a.map((x, i) => wa * x + wbRaw * b[i]) as P3; // weights don't sum to 1
  const oddsAvg = (() => { const o = a.map((x, i) => (wa * (1 / x) + wbRaw * (1 / b[i])) / wSum); return o.map((x) => 1 / x) as P3; })(); // averaging odds
  const homeOnly: P3 = [linear[0], a[1], a[2]]; // blend home, keep draw/away from one component

  const inRange = (p: P3) => p.every((x, i) => x >= Math.min(a[i], b[i]) - 1e-9 && x <= Math.max(a[i], b[i]) + 1e-9);

  const rows: { name: string; p: P3; note: string }[] = [
    { name: "Linear pool (correct default)", p: linear, note: "Weighted average of probabilities" },
    { name: "Log-linear pool", p: geo, note: "Geometric, renormalised - sharper" },
    { name: "Bug: un-normalised weights", p: unnormalised, note: "Weights sum ≠ 1" },
    { name: "Bug: averaging decimal odds", p: oddsAvg, note: "Biased toward longshots" },
    { name: "Bug: blend home only", p: homeOnly, note: "Draw/away from one model" },
  ];

  return (
    <Card>
      <CardTitle sub="The brief's example: a 64% component and a 50% component. A proper blend must land between them and still sum to 1.">Blend checker</CardTitle>
      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <ProbEdit label="Component A (e.g. xG model)" p={a} set={setA} />
          <ProbEdit label="Component B (e.g. neutral rating)" p={b} set={setB} />
          <Slider label="Weight A" value={wa} min={0} max={1} step={0.05} onChange={setWa} fmt={(v) => v.toFixed(2)} />
          <Slider label="Weight B" value={wbRaw} min={0} max={1} step={0.05} onChange={setWbRaw} fmt={(v) => v.toFixed(2)} />
        </div>
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[460px] text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-faint">
              <tr><th className="py-2 text-left">Method</th><th className="text-right">H</th><th className="text-right">D</th><th className="text-right">A</th><th className="text-right">Σ</th><th className="pl-3 text-left">Check</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const sOk = Math.abs(sum(r.p) - 1) < 1e-3, rOk = inRange(r.p);
                const ok = sOk && (rOk || r.name.startsWith("Log"));
                return (
                  <tr key={r.name} className="border-t border-line">
                    <td className="py-2 text-left font-sans"><div>{r.name}</div><div className="text-[11px] text-faint">{r.note}</div></td>
                    <td className="text-right">{pct(r.p[0])}</td><td className="text-right">{pct(r.p[1])}</td><td className="text-right">{pct(r.p[2])}</td>
                    <td className={`text-right ${sOk ? "" : "text-rose"}`}>{sum(r.p).toFixed(3)}</td>
                    <td className="pl-3 font-sans">
                      <Pill tone={ok ? "green" : "rose"}>{ok ? "ok" : !sOk ? "doesn't sum to 1" : "outside components"}</Pill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-3 text-[11px] leading-relaxed text-faint">
            Automated in the pipeline: Σ = 1 per match, blend inside the component envelope, and a dominance alert when one component&apos;s
            weight × disagreement moves the final number more than a set number of points.
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------- 3-way de-vig ----------------
export function DevigCalc() {
  const [odds, setOdds] = useState<P3>([1.62, 4.2, 5.5]);
  const [model, setModel] = useState<P3>([0.6, 0.23, 0.17]);
  const q = implied(odds);
  const methods = [
    { name: "Raw implied (with vig)", p: q, bad: true },
    { name: "Multiplicative", p: devig(odds, "multiplicative") },
    { name: "Power", p: devig(odds, "power") },
    { name: "Shin", p: devig(odds, "shin") },
    { name: "Bug: 2-way on H/A only", p: (() => { const s = q[0] + q[2]; return [q[0] / s, 0, q[2] / s]; })(), bad: true },
  ];
  return (
    <Card>
      <CardTitle sub="Favourite-longshot bias means the vig is not spread evenly. Shin / power push more of it onto the longshot.">Three-way vig removal & EV</CardTitle>
      <div className="grid gap-5 md:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 text-xs text-muted">Book odds (decimal)</div>
            <div className="grid grid-cols-3 gap-2">{["1", "X", "2"].map((l, i) => <NumField key={l} label={l} value={odds[i]} onChange={(v) => setOdds(odds.map((x, j) => (j === i ? v : x)) as P3)} />)}</div>
          </div>
          <div>
            <div className="mb-1.5 text-xs text-muted">Model probability</div>
            <div className="grid grid-cols-3 gap-2">{["H", "D", "A"].map((l, i) => <NumField key={l} label={l} value={model[i]} onChange={(v) => setModel(model.map((x, j) => (j === i ? v : x)) as P3)} />)}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Overround" value={pct(overround(odds), 2)} />
            <Stat label="Model Σ" value={model.reduce((s, x) => s + x, 0).toFixed(3)} tone={Math.abs(model.reduce((s, x) => s + x, 0) - 1) < 1e-3 ? undefined : "rose"} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[460px] text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-faint">
              <tr><th className="py-2 text-left">Market probability</th><th className="text-right">H</th><th className="text-right">D</th><th className="text-right">A</th><th className="text-right">Σ</th></tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m.name} className="border-t border-line">
                  <td className={`py-2 text-left font-sans ${m.bad ? "text-rose" : ""}`}>{m.name}</td>
                  {m.p.map((x, i) => <td key={i} className="text-right">{pct(x)}</td>)}
                  <td className="text-right">{m.p.reduce((s, x) => s + x, 0).toFixed(3)}</td>
                </tr>
              ))}
              <tr className="border-t border-line-2">
                <td className="py-2 text-left font-sans text-pitch">EV = p × odds − 1</td>
                {model.map((p, i) => <td key={i} className={`text-right ${ev(p, odds[i]) > 0 ? "text-pitch" : "text-muted"}`}>{pct(ev(p, odds[i]))}</td>)}
                <td />
              </tr>
              <tr className="border-t border-line">
                <td className="py-2 text-left font-sans text-muted">Edge vs Shin no-vig</td>
                {model.map((p, i) => <td key={i} className="text-right text-muted">{(100 * (p - devig(odds, "shin")[i])).toFixed(1)} pp</td>)}
                <td />
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-[11px] leading-relaxed text-faint">
            EV always uses the price you can actually take, never the no-vig price. No-vig is for judging whether the model disagrees with the
            market by a believable amount - and for CLV against the close.
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------- xG ↔ totals consistency ----------------
export function ConsistencyCheck() {
  const [lh, setLh] = useState(1.6);
  const [la, setLa] = useState(1.2);
  const [claimed, setClaimed] = useState(0.44);
  const [claimedHome, setClaimedHome] = useState(0.62);
  const g = scoreGrid(lh, la, -0.07);
  const over = totalOver(g, 2.5).win;
  const home = oneXTwo(g).home;
  const gapO = claimed - over, gapH = claimedHome - home;
  return (
    <Card>
      <CardTitle sub="Takes the xG a pipeline reports and the market probabilities it outputs, and checks they come from the same world.">xG ↔ market consistency</CardTitle>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-4">
          <Slider label="Reported home xG" value={lh} min={0.4} max={3} step={0.05} onChange={setLh} fmt={(v) => v.toFixed(2)} />
          <Slider label="Reported away xG" value={la} min={0.4} max={3} step={0.05} onChange={setLa} fmt={(v) => v.toFixed(2)} />
          <Slider label="Reported P(Over 2.5)" value={claimed} min={0.2} max={0.85} step={0.01} onChange={setClaimed} fmt={(v) => pct(v, 0)} />
          <Slider label="Reported P(Home win)" value={claimedHome} min={0.1} max={0.85} step={0.01} onChange={setClaimedHome} fmt={(v) => pct(v, 0)} />
        </div>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Stat label="Total xG" value={(lh + la).toFixed(2)} />
          <Stat label="Grid P(Over 2.5)" value={pct(over)} sub={`reported ${pct(claimed)}`} tone={Math.abs(gapO) > 0.05 ? "rose" : "green"} />
          <Stat label="Grid P(Home)" value={pct(home)} sub={`reported ${pct(claimedHome)}`} tone={Math.abs(gapH) > 0.05 ? "rose" : "green"} />
          <div className="flex items-center">
            {Math.abs(gapO) > 0.05 || Math.abs(gapH) > 0.05
              ? <Pill tone="rose">Inconsistent - markets not derived from these goals</Pill>
              : <Pill tone="green">Consistent within 5 pp</Pill>}
          </div>
        </div>
      </div>
    </Card>
  );
}
