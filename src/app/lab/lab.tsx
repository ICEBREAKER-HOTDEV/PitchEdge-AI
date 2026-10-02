"use client";

import { useMemo, useState } from "react";
import {
  asianEV, asianHandicapAway, asianHandicapHome, devig, fairAsianOdds, fmtOdds, gaussian, mulberry32,
  oneXTwo, oneXTwoBands, overround, pct, scoreGrid, totalOver, totalUnder, btts, expectedGoals,
  type DevigMethod, type Grid, type LineOutcome,
} from "@/lib/model";
import { Card, CardTitle, NumField, Pill, Slider, Stat } from "@/components/ui";
import { ScoreGrid } from "@/components/score-grid";

const PRESETS = [
  { name: "Inter Miami vs Orlando City", h: "MIA", a: "ORL", lh: 1.78, la: 1.12, o: [1.95, 3.8, 3.7], ahLine: -0.5, ah: [1.97, 1.91], tLine: 3, t: [1.9, 1.98] },
  { name: "Real Salt Lake vs Seattle (altitude)", h: "RSL", a: "SEA", lh: 1.52, la: 1.14, o: [2.3, 3.4, 3.05], ahLine: -0.25, ah: [2.02, 1.86], tLine: 2.75, t: [1.95, 1.93] },
  { name: "LAFC vs LA Galaxy", h: "LAFC", a: "LAG", lh: 1.72, la: 1.33, o: [2.0, 3.75, 3.45], ahLine: -0.5, ah: [2.0, 1.88], tLine: 3, t: [1.84, 2.04] },
  { name: "Toronto FC vs Philadelphia (short rest)", h: "TOR", a: "PHI", lh: 1.12, la: 1.58, o: [3.3, 3.5, 2.15], ahLine: 0.5, ah: [1.9, 1.98], tLine: 2.5, t: [1.83, 2.05] },
];

const AH_LINES = [-1.5, -1.25, -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1, 1.25, 1.5];
const TOTAL_LINES = [1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
const signed = (x: number) => (x > 0 ? `+${x}` : `${x}`);

type Cand = {
  key: string; market: string; sel: string; odds: number;
  pModel: number; pMarket: number; evPoint: number; evLo: number;
};

export function Lab() {
  const [preset, setPreset] = useState(0);
  const P = PRESETS[preset];
  const [lh, setLh] = useState(P.lh);
  const [la, setLa] = useState(P.la);
  const [rho, setRho] = useState(-0.07);
  const [cv, setCv] = useState(0.06);
  const [odds, setOdds] = useState(P.o);
  const [ahLine, setAhLine] = useState(P.ahLine);
  const [ahOdds, setAhOdds] = useState(P.ah);
  const [tLine, setTLine] = useState(P.tLine);
  const [tOdds, setTOdds] = useState(P.t);
  const [method, setMethod] = useState<DevigMethod>("shin");
  const [minEdge, setMinEdge] = useState(0.02);
  const [maxGap, setMaxGap] = useState(0.1);
  const [kellyFrac, setKellyFrac] = useState(0.25);
  const [oddsAge, setOddsAge] = useState(5);
  const [lineupConfirmed, setLineupConfirmed] = useState(false);

  function loadPreset(i: number) {
    const x = PRESETS[i];
    setPreset(i); setLh(x.lh); setLa(x.la); setOdds(x.o); setAhLine(x.ahLine); setAhOdds(x.ah); setTLine(x.tLine); setTOdds(x.t);
  }

  const grid = useMemo(() => scoreGrid(lh, la, rho), [lh, la, rho]);
  const r = oneXTwo(grid);
  const bands = useMemo(() => oneXTwoBands(lh, la, rho, cv), [lh, la, rho, cv]);
  const xg = expectedGoals(grid);

  const nv1x2 = devig(odds, method);
  const nvAh = devig(ahOdds, method);
  const nvT = devig(tOdds, method);

  // Evaluate every candidate bet at the point estimate and across xG uncertainty draws.
  const cands = useMemo(() => {
    const evals = (g: Grid) => {
      const x = oneXTwo(g);
      const ahH = asianHandicapHome(g, ahLine), ahA = asianHandicapAway(g, ahLine);
      const ov = totalOver(g, tLine), un = totalUnder(g, tLine);
      return [
        x.home * odds[0] - 1, x.draw * odds[1] - 1, x.away * odds[2] - 1,
        asianEV(ahH, ahOdds[0]), asianEV(ahA, ahOdds[1]), asianEV(ov, tOdds[0]), asianEV(un, tOdds[1]),
      ];
    };
    const rand = mulberry32(7);
    const s = Math.sqrt(Math.log(1 + cv * cv));
    const draws: number[][] = [];
    for (let i = 0; i < 200; i++) {
      const g = scoreGrid(lh * Math.exp(s * gaussian(rand) - s * s / 2), la * Math.exp(s * gaussian(rand) - s * s / 2), rho, 8);
      draws.push(evals(g));
    }
    const lo = (j: number) => draws.map((d) => d[j]).sort((a, b) => a - b)[Math.floor(0.1 * draws.length)];
    const point = evals(grid);
    const pEq = (o: LineOutcome) => 1 / fairAsianOdds(o); // probability-equivalent of the fair Asian price
    const x = oneXTwo(grid);
    const meta: Omit<Cand, "evPoint" | "evLo">[] = [
      { key: "h", market: "1X2", sel: `${P.h} win`, odds: odds[0], pModel: x.home, pMarket: nv1x2[0] },
      { key: "d", market: "1X2", sel: "Draw", odds: odds[1], pModel: x.draw, pMarket: nv1x2[1] },
      { key: "a", market: "1X2", sel: `${P.a} win`, odds: odds[2], pModel: x.away, pMarket: nv1x2[2] },
      { key: "ahh", market: "AH", sel: `${P.h} ${signed(ahLine)}`, odds: ahOdds[0], pModel: pEq(asianHandicapHome(grid, ahLine)), pMarket: nvAh[0] },
      { key: "aha", market: "AH", sel: `${P.a} ${signed(-ahLine)}`, odds: ahOdds[1], pModel: pEq(asianHandicapAway(grid, ahLine)), pMarket: nvAh[1] },
      { key: "o", market: "Total", sel: `Over ${tLine}`, odds: tOdds[0], pModel: pEq(totalOver(grid, tLine)), pMarket: nvT[0] },
      { key: "u", market: "Total", sel: `Under ${tLine}`, odds: tOdds[1], pModel: pEq(totalUnder(grid, tLine)), pMarket: nvT[1] },
    ];
    return meta.map((m, j) => ({ ...m, evPoint: point[j], evLo: lo(j) }));
  }, [grid, lh, la, rho, cv, odds, ahLine, ahOdds, tLine, tOdds, nv1x2, nvAh, nvT, P.h, P.a]);

  const decide = (c: Cand) => {
    if (oddsAge > 15) return { bet: false, why: "Odds stale (>15 min)" };
    if (c.evPoint <= 0) return { bet: false, why: "No edge" };
    if (Math.abs(c.pModel - c.pMarket) > maxGap) return { bet: false, why: "Disagrees with market - review model" };
    if (c.evLo < minEdge) return { bet: false, why: "Edge gone under uncertainty" };
    return { bet: true, why: lineupConfirmed ? "Edge survives uncertainty" : "Edge survives - re-check at XI" };
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      {/* ---------------- controls ---------------- */}
      <div className="space-y-5">
        <Card>
          <CardTitle sub="Illustrative fixtures - xG and prices are made-up inputs, not live data.">Fixture</CardTitle>
          <select value={preset} onChange={(e) => loadPreset(Number(e.target.value))}>
            {PRESETS.map((p, i) => <option key={p.name} value={i}>{p.name}</option>)}
          </select>
        </Card>

        <Card>
          <CardTitle sub="Output of the team-strength + lineup + context layers.">Goal model</CardTitle>
          <div className="space-y-4">
            <Slider label={`λ ${P.h} (home xG)`} value={lh} min={0.3} max={3.5} step={0.01} onChange={setLh} fmt={(v) => v.toFixed(2)} />
            <Slider label={`λ ${P.a} (away xG)`} value={la} min={0.3} max={3.5} step={0.01} onChange={setLa} fmt={(v) => v.toFixed(2)} />
            <Slider label="Dixon-Coles ρ" value={rho} min={-0.2} max={0.1} step={0.005} onChange={setRho} fmt={(v) => v.toFixed(3)} />
            <Slider label="xG uncertainty (CV)" value={cv} min={0} max={0.35} step={0.01} onChange={setCv} fmt={(v) => `${Math.round(v * 100)}%`} />
          </div>
        </Card>

        <Card>
          <CardTitle sub={`Overround 1X2 ${pct(overround(odds))} · AH ${pct(overround(ahOdds))} · Total ${pct(overround(tOdds))}`}>Book prices</CardTitle>
          <div className="grid grid-cols-3 gap-2">
            {["1", "X", "2"].map((l, i) => (
              <NumField key={l} label={l} value={odds[i]} onChange={(v) => setOdds(odds.map((o, j) => (j === i ? v : o)))} />
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="block"><div className="mb-1 text-xs text-muted">AH line ({P.h})</div>
              <select value={ahLine} onChange={(e) => setAhLine(Number(e.target.value))}>
                {AH_LINES.map((l) => <option key={l} value={l}>{signed(l)}</option>)}
              </select>
            </label>
            <NumField label={P.h} value={ahOdds[0]} onChange={(v) => setAhOdds([v, ahOdds[1]])} />
            <NumField label={P.a} value={ahOdds[1]} onChange={(v) => setAhOdds([ahOdds[0], v])} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <label className="block"><div className="mb-1 text-xs text-muted">Total line</div>
              <select value={tLine} onChange={(e) => setTLine(Number(e.target.value))}>
                {TOTAL_LINES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <NumField label="Over" value={tOdds[0]} onChange={(v) => setTOdds([v, tOdds[1]])} />
            <NumField label="Under" value={tOdds[1]} onChange={(v) => setTOdds([tOdds[0], v])} />
          </div>
          <label className="mt-3 block"><div className="mb-1 text-xs text-muted">Vig removal</div>
            <select value={method} onChange={(e) => setMethod(e.target.value as DevigMethod)}>
              <option value="shin">Shin (recommended for 1X2)</option>
              <option value="power">Power</option>
              <option value="multiplicative">Multiplicative (naive)</option>
            </select>
          </label>
        </Card>

        <Card>
          <CardTitle sub="Rules the decision layer enforces before any stake.">Betting policy</CardTitle>
          <div className="space-y-4">
            <Slider label="Min EV on pessimistic (P10) estimate" value={minEdge} min={0} max={0.08} step={0.005} onChange={setMinEdge} fmt={(v) => pct(v)} />
            <Slider label="Max gap vs no-vig market" value={maxGap} min={0.03} max={0.2} step={0.01} onChange={setMaxGap} fmt={(v) => `${Math.round(v * 100)} pp`} />
            <Slider label="Kelly fraction" value={kellyFrac} min={0.05} max={1} step={0.05} onChange={setKellyFrac} fmt={(v) => `${Math.round(v * 100)}%`} />
            <Slider label="Odds age (minutes)" value={oddsAge} min={0} max={60} step={1} onChange={setOddsAge} />
            <label className="flex items-center gap-2 text-xs text-muted">
              <input type="checkbox" checked={lineupConfirmed} onChange={(e) => setLineupConfirmed(e.target.checked)} className="accent-[var(--pitch)]" />
              Starting XIs confirmed
            </label>
          </div>
        </Card>
      </div>

      {/* ---------------- outputs ---------------- */}
      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={`${P.h} win`} value={pct(r.home)} sub={`80% band ${pct(bands.home.lo, 0)}-${pct(bands.home.hi, 0)}`} tone="green" />
          <Stat label="Draw" value={pct(r.draw)} sub={`80% band ${pct(bands.draw.lo, 0)}-${pct(bands.draw.hi, 0)}`} tone="amber" />
          <Stat label={`${P.a} win`} value={pct(r.away)} sub={`80% band ${pct(bands.away.lo, 0)}-${pct(bands.away.hi, 0)}`} tone="sky" />
          <Stat label="Grid check" value={`${(r.home + r.draw + r.away).toFixed(4)}`} sub={`E[goals] ${xg.home.toFixed(2)} - ${xg.away.toFixed(2)}`} />
        </div>

        <Card>
          <CardTitle sub="Every market below is a sum over these cells. Hover a cell for the exact probability.">Score distribution</CardTitle>
          <ScoreGrid grid={grid} home={P.h} away={P.a} />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Total xG" value={(lh + la).toFixed(2)} />
            <Stat label="xG diff" value={signed(Number((lh - la).toFixed(2)))} />
            <Stat label="BTTS yes" value={pct(btts(grid))} />
            <Stat label="0-0" value={pct(grid[0][0])} />
          </div>
        </Card>

        <Card>
          <CardTitle sub={`Model vs ${method} no-vig market. EV at P10 uses the pessimistic 10th percentile across ${200} xG draws.`}>
            Decision table
          </CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-faint">
                <tr>
                  <th className="py-2 pr-3">Selection</th><th className="py-2 pr-3">Odds</th><th className="py-2 pr-3">Model fair</th>
                  <th className="py-2 pr-3">Model p</th><th className="py-2 pr-3">No-vig p</th><th className="py-2 pr-3">EV</th>
                  <th className="py-2 pr-3">EV @P10</th><th className="py-2 pr-3">Stake</th><th className="py-2">Decision</th>
                </tr>
              </thead>
              <tbody className="num">
                {cands.map((c) => {
                  const d = decide(c);
                  const stake = d.bet ? Math.min(0.03, (kellyFrac * c.evLo) / (c.odds - 1)) : 0;
                  return (
                    <tr key={c.key} className="border-t border-line">
                      <td className="py-2 pr-3 font-sans"><span className="mr-2 text-[10px] text-faint">{c.market}</span>{c.sel}</td>
                      <td className="py-2 pr-3">{fmtOdds(c.odds)}</td>
                      <td className="py-2 pr-3 text-muted">{fmtOdds(1 / c.pModel)}</td>
                      <td className="py-2 pr-3">{pct(c.pModel)}</td>
                      <td className="py-2 pr-3 text-muted">{pct(c.pMarket)}</td>
                      <td className={`py-2 pr-3 ${c.evPoint > 0 ? "text-pitch" : "text-rose"}`}>{pct(c.evPoint)}</td>
                      <td className={`py-2 pr-3 ${c.evLo > minEdge ? "text-pitch" : "text-muted"}`}>{pct(c.evLo)}</td>
                      <td className="py-2 pr-3">{stake > 0 ? pct(stake, 2) : "-"}</td>
                      <td className="py-2 font-sans"><Pill tone={d.bet ? "green" : c.evPoint > 0 ? "amber" : "muted"}>{d.bet ? "BET" : "PASS"}</Pill> <span className="ml-1 text-[11px] text-muted">{d.why}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] leading-relaxed text-faint">
            Stake = Kelly fraction × pessimistic EV ÷ (odds − 1), capped at 3% of bankroll. Asian EV includes pushes, half-wins and
            half-losses exactly. &quot;Model p&quot; for Asian lines is the probability-equivalent of the fair price.
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle sub="Quarter lines are split into two half-stakes.">Asian handicap ladder ({P.h})</CardTitle>
            <Ladder rows={AH_LINES.map((l) => ({ line: signed(l), o: asianHandicapHome(grid, l), opp: asianHandicapAway(grid, l), hl: l === ahLine }))} labels={[P.h, P.a]} />
          </Card>
          <Card>
            <CardTitle sub="Same grid, summed by total goals.">Totals ladder</CardTitle>
            <Ladder rows={TOTAL_LINES.map((l) => ({ line: `${l}`, o: totalOver(grid, l), opp: totalUnder(grid, l), hl: l === tLine }))} labels={["Over", "Under"]} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function Ladder({ rows, labels }: { rows: { line: string; o: LineOutcome; opp: LineOutcome; hl: boolean }[]; labels: [string, string] }) {
  return (
    <div className="overflow-x-auto">
      <table className="num w-full min-w-[380px] text-[12px]">
        <thead className="text-[10px] uppercase tracking-wider text-faint">
          <tr>
            <th className="py-1.5 text-left">Line</th><th className="text-right">Win</th><th className="text-right">½ win</th>
            <th className="text-right">Push</th><th className="text-right">½ loss</th><th className="text-right">Fair {labels[0]}</th><th className="text-right">Fair {labels[1]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.line} className={`border-t border-line ${r.hl ? "bg-pitch/10" : ""}`}>
              <td className="py-1.5 text-left">{r.line}</td>
              <td className="text-right">{pct(r.o.win)}</td>
              <td className="text-right text-muted">{r.o.halfWin > 1e-9 ? pct(r.o.halfWin) : "-"}</td>
              <td className="text-right text-muted">{r.o.push > 1e-9 ? pct(r.o.push) : "-"}</td>
              <td className="text-right text-muted">{r.o.halfLoss > 1e-9 ? pct(r.o.halfLoss) : "-"}</td>
              <td className="text-right text-pitch">{fmtOdds(fairAsianOdds(r.o))}</td>
              <td className="text-right text-sky">{fmtOdds(fairAsianOdds(r.opp))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
