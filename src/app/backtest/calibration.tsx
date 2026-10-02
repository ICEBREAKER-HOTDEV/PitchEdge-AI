"use client";

import { useMemo, useState } from "react";
import { gaussian, logLoss, mulberry32, oneXTwo, pct, rps, scoreGrid } from "@/lib/model";
import { Card, CardTitle } from "@/components/ui";

const N = 3000;
type P3 = [number, number, number];
const norm = (p: number[]): P3 => { const s = p[0] + p[1] + p[2]; return [p[0] / s, p[1] / s, p[2] / s]; };

// Synthetic season: true probabilities from a Dixon-Coles grid, outcomes sampled from the truth.
function simulate() {
  const rand = mulberry32(2026);
  const rows: { truth: P3; y: number; market: P3; odds: P3; calibrated: P3; raw: P3 }[] = [];
  for (let i = 0; i < N; i++) {
    const lh = 1.45 * Math.exp(0.32 * gaussian(rand)), la = 1.15 * Math.exp(0.32 * gaussian(rand));
    const t = oneXTwo(scoreGrid(lh, la, -0.07, 8));
    const truth: P3 = [t.home, t.draw, t.away];
    const u = rand();
    const y = u < truth[0] ? 0 : u < truth[0] + truth[1] ? 1 : 2;
    const noisy = (sd: number) => norm(truth.map((p) => p * Math.exp(sd * gaussian(rand))));
    const market = noisy(0.1); // sharp-ish market
    const odds = market.map((p) => 1 / (p * 1.05)) as P3; // 5% overround
    const calibrated = noisy(0.05); // honest model with a small genuine information edge
    // "Raw LightGBM classifier": sharpened (overconfident) and under-rates draws
    const raw = norm(calibrated.map((p, k) => Math.pow(p, 1.6) * (k === 1 ? 0.75 : 1)));
    rows.push({ truth, y, market, odds, calibrated, raw });
  }
  return rows;
}

type ModelKey = "raw" | "calibrated" | "market";
const MODELS: { k: ModelKey; label: string; color: string }[] = [
  { k: "raw", label: "Raw classifier", color: "var(--rose)" },
  { k: "calibrated", label: "Calibrated grid model", color: "var(--pitch)" },
  { k: "market", label: "No-vig market", color: "var(--sky)" },
];

export function CalibrationDemo() {
  const rows = useMemo(() => simulate(), []);
  const [outcome, setOutcome] = useState(0);

  const metrics = MODELS.map(({ k, label, color }) => {
    let acc = 0, ll = 0, brier = 0, r = 0, bets = 0, pnl = 0;
    const bins = Array.from({ length: 10 }, () => ({ n: 0, p: 0, y: 0 }));
    for (const row of rows) {
      const p = row[k];
      const pick = p.indexOf(Math.max(...p));
      acc += pick === row.y ? 1 : 0;
      ll += logLoss(p[row.y]);
      brier += p.reduce((s, pi, j) => s + (pi - (j === row.y ? 1 : 0)) ** 2, 0);
      r += rps(p, row.y);
      const b = bins[Math.min(9, Math.floor(p[outcome] * 10))];
      b.n++; b.p += p[outcome]; b.y += row.y === outcome ? 1 : 0;
      if (k !== "market") {
        for (let j = 0; j < 3; j++) {
          if (p[j] * row.odds[j] - 1 > 0.03) { bets++; pnl += row.y === j ? row.odds[j] - 1 : -1; }
        }
      }
    }
    const ece = bins.reduce((s, b) => s + (b.n ? Math.abs(b.p / b.n - b.y / b.n) * b.n : 0), 0) / N;
    return { k, label, color, acc: acc / N, ll: ll / N, brier: brier / N, rps: r / N, ece, bins, bets, roi: bets ? pnl / bets : NaN };
  });

  const W = 300, pad = 32;
  const sx = (v: number) => pad + v * (W - pad - 8);
  const sy = (v: number) => W - pad - v * (W - pad - 8);

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Card>
        <CardTitle sub="Predicted probability vs how often it actually happened. On the diagonal = calibrated.">Reliability curve</CardTitle>
        <div className="mb-3 flex gap-1.5">
          {["Home", "Draw", "Away"].map((l, j) => (
            <button key={l} onClick={() => setOutcome(j)}
              className={`rounded-md border px-2.5 py-1 text-xs ${j === outcome ? "border-pitch bg-pitch/15 text-pitch" : "border-line text-muted"}`}>{l}</button>
          ))}
        </div>
        <svg viewBox={`0 0 ${W} ${W}`} className="w-full" role="img" aria-label="Reliability diagram">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((v) => (
            <g key={v}>
              <line x1={sx(0)} x2={sx(1)} y1={sy(v)} y2={sy(v)} stroke="var(--line)" />
              <text x={pad - 6} y={sy(v) + 3} fontSize="9" textAnchor="end" fill="var(--faint)">{v * 100}</text>
              <text x={sx(v)} y={W - pad + 14} fontSize="9" textAnchor="middle" fill="var(--faint)">{v * 100}</text>
            </g>
          ))}
          <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} stroke="var(--faint)" strokeDasharray="4 4" />
          {metrics.map((m) => {
            const pts = m.bins.filter((b) => b.n >= 40).map((b) => [b.p / b.n, b.y / b.n, b.n] as const);
            return (
              <g key={m.k}>
                <polyline fill="none" stroke={m.color} strokeWidth="1.6" points={pts.map(([x, y]) => `${sx(x)},${sy(y)}`).join(" ")} />
                {pts.map(([x, y, n]) => <circle key={x} cx={sx(x)} cy={sy(y)} r={Math.min(5, 1.5 + Math.sqrt(n) / 8)} fill={m.color} />)}
              </g>
            );
          })}
          <text x={sx(0.5)} y={W - 2} fontSize="9" textAnchor="middle" fill="var(--muted)">predicted %</text>
          <text x={10} y={sy(0.5)} fontSize="9" textAnchor="middle" fill="var(--muted)" transform={`rotate(-90 10 ${sy(0.5)})`}>observed %</text>
        </svg>
        <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
          {MODELS.map((m) => <span key={m.k} className="text-muted"><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label}</span>)}
        </div>
      </Card>

      <Card>
        <CardTitle sub={`${N.toLocaleString()} simulated matches. Same underlying signal (simulated with a small genuine edge over the market); the raw model is sharpened and under-rates draws. Bets: EV > 3% vs prices with 5% overround.`}>
          The accuracy trap
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="num w-full min-w-[560px] text-[13px]">
            <thead className="text-[10px] uppercase tracking-wider text-faint">
              <tr><th className="py-2 text-left">Model</th><th className="text-right">Accuracy</th><th className="text-right">Log loss ↓</th><th className="text-right">Brier ↓</th><th className="text-right">RPS ↓</th><th className="text-right">ECE ↓</th><th className="text-right">Bets</th><th className="text-right">ROI</th></tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.k} className="border-t border-line">
                  <td className="py-2 text-left font-sans"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label}</td>
                  <td className="text-right">{pct(m.acc)}</td>
                  <td className="text-right">{m.ll.toFixed(4)}</td>
                  <td className="text-right">{m.brier.toFixed(4)}</td>
                  <td className="text-right">{m.rps.toFixed(4)}</td>
                  <td className="text-right">{pct(m.ece, 2)}</td>
                  <td className="text-right">{m.k === "market" ? "-" : m.bets}</td>
                  <td className={`text-right ${m.roi > 0 ? "text-pitch" : "text-rose"}`}>{m.k === "market" ? "-" : pct(m.roi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <p>
            Both models pick the same favourites, so <span className="text-ink">accuracy is almost identical</span>. But the raw model says 75% when those
            teams win closer to 56%, and prices draws far below how often they land. Against real prices that miscalibration looks
            like edge - it fires far more bets and gives the real edge back.
          </p>
          <p>
            Accuracy only checks the arg-max. Betting pays on the <span className="text-ink">size</span> of the probability, so selection uses log loss, RPS and
            reliability by bucket - and the bar to clear is the no-vig market, not zero.
          </p>
        </div>
      </Card>
    </div>
  );
}
