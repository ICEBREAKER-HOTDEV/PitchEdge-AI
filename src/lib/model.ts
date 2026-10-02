// Core probability math for the PitchEdge prototype.
// Everything downstream (1X2, totals, Asian handicap, BTTS) is derived from one
// score-distribution grid so the markets can never contradict each other.

export const MAX_GOALS = 10;

export type Grid = number[][]; // grid[h][a] = P(home scores h, away scores a)

export function poissonPmf(k: number, lambda: number): number {
  let p = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) p *= lambda / i;
  return p;
}

// Dixon-Coles low-score correction. rho < 0 inflates 0-0 and 1-1 (draws).
export function dcTau(h: number, a: number, lh: number, la: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - lh * la * rho;
  if (h === 0 && a === 1) return 1 + lh * rho;
  if (h === 1 && a === 0) return 1 + la * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

export function scoreGrid(lh: number, la: number, rho = 0, max = MAX_GOALS): Grid {
  const ph = Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, lh));
  const pa = Array.from({ length: max + 1 }, (_, k) => poissonPmf(k, la));
  const grid: Grid = [];
  let total = 0;
  for (let h = 0; h <= max; h++) {
    grid.push([]);
    for (let a = 0; a <= max; a++) {
      const p = Math.max(0, ph[h] * pa[a] * dcTau(h, a, lh, la, rho));
      grid[h].push(p);
      total += p;
    }
  }
  // Renormalise: truncation at `max` goals and the DC tau both shift mass slightly.
  for (let h = 0; h <= max; h++) for (let a = 0; a <= max; a++) grid[h][a] /= total;
  return grid;
}

export interface OneXTwo {
  home: number;
  draw: number;
  away: number;
}

export function oneXTwo(grid: Grid): OneXTwo {
  let home = 0, draw = 0, away = 0;
  grid.forEach((row, h) =>
    row.forEach((p, a) => {
      if (h > a) home += p;
      else if (h === a) draw += p;
      else away += p;
    }),
  );
  return { home, draw, away };
}

export function btts(grid: Grid): number {
  let p = 0;
  grid.forEach((row, h) => row.forEach((v, a) => (h > 0 && a > 0 ? (p += v) : 0)));
  return p;
}

export function expectedGoals(grid: Grid): { home: number; away: number } {
  let home = 0, away = 0;
  grid.forEach((row, h) => row.forEach((p, a) => { home += h * p; away += a * p; }));
  return { home, away };
}

// Distribution of a single integer quantity derived from the score (goal diff or total).
export function distribution(grid: Grid, f: (h: number, a: number) => number): Map<number, number> {
  const m = new Map<number, number>();
  grid.forEach((row, h) => row.forEach((p, a) => {
    const k = f(h, a);
    m.set(k, (m.get(k) ?? 0) + p);
  }));
  return m;
}

// ---------- Asian lines (handicaps and totals share the same settlement engine) ----------

export interface LineOutcome {
  win: number;      // full win
  halfWin: number;
  push: number;
  halfLoss: number;
  loss: number;     // full loss
  // half-weighted probabilities used for pricing: each half-stake counts 0.5
  effWin: number;
  effLoss: number;
}

// Quarter lines (x.25 / x.75) are split into two half-stakes on neighbouring half/whole lines.
export function splitLine(line: number): number[] {
  const frac = Math.round((Math.abs(line) % 1) * 100);
  if (frac === 25 || frac === 75) return [line - 0.25, line + 0.25];
  return [line];
}

// `margin(k)` is the bet's margin before the line: e.g. goal diff for home AH, total for Over.
// The bet wins on margin + line > 0 (handicap) — callers pass the sign convention.
export function settleLine(dist: Map<number, number>, line: number, wins: (k: number, l: number) => number): LineOutcome {
  const parts = splitLine(line);
  const out: LineOutcome = { win: 0, halfWin: 0, push: 0, halfLoss: 0, loss: 0, effWin: 0, effLoss: 0 };
  for (const [k, p] of dist) {
    // per half-stake result: +1 win, 0 push, -1 loss
    const results = parts.map((l) => Math.sign(wins(k, l)));
    const score = results.reduce((s, r) => s + r, 0) / parts.length; // -1 .. 1 in 0.5 steps
    if (score === 1) out.win += p;
    else if (score === 0.5) out.halfWin += p;
    else if (score === 0) out.push += p; // split halves sit 0.5 apart, so win+loss can't co-occur
    else if (score === -0.5) out.halfLoss += p;
    else out.loss += p;
    const w = results.filter((r) => r > 0).length / parts.length;
    const l = results.filter((r) => r < 0).length / parts.length;
    out.effWin += p * w;
    out.effLoss += p * l;
  }
  return out;
}

export function asianHandicapHome(grid: Grid, line: number): LineOutcome {
  return settleLine(distribution(grid, (h, a) => h - a), line, (diff, l) => diff + l);
}

export function asianHandicapAway(grid: Grid, homeLine: number): LineOutcome {
  return settleLine(distribution(grid, (h, a) => a - h), -homeLine, (diff, l) => diff + l);
}

export function totalOver(grid: Grid, line: number): LineOutcome {
  return settleLine(distribution(grid, (h, a) => h + a), line, (t, l) => t - l);
}

export function totalUnder(grid: Grid, line: number): LineOutcome {
  return settleLine(distribution(grid, (h, a) => h + a), line, (t, l) => l - t);
}

// Fair decimal odds for an Asian line: EV = effWin*(O-1) - effLoss = 0
export function fairAsianOdds(o: LineOutcome): number {
  return o.effWin > 0 ? 1 + o.effLoss / o.effWin : Infinity;
}

// Expected profit per unit stake at decimal odds O, including push / half-win / half-loss.
export function asianEV(o: LineOutcome, odds: number): number {
  return o.effWin * (odds - 1) - o.effLoss;
}

// ---------- Odds, vig removal, EV ----------

export const implied = (odds: number[]) => odds.map((o) => 1 / o);
export const overround = (odds: number[]) => implied(odds).reduce((s, p) => s + p, 0) - 1;

export type DevigMethod = "multiplicative" | "power" | "shin";

export function devig(odds: number[], method: DevigMethod): number[] {
  const q = implied(odds);
  const Q = q.reduce((s, p) => s + p, 0);
  if (method === "multiplicative") return q.map((p) => p / Q);

  if (method === "power") {
    // find k so that sum(q_i^k) = 1 — shades longshots more than favourites
    let lo = 0.5, hi = 3;
    for (let i = 0; i < 80; i++) {
      const k = (lo + hi) / 2;
      const s = q.reduce((acc, p) => acc + Math.pow(p, k), 0);
      if (s > 1) lo = k; else hi = k;
    }
    const k = (lo + hi) / 2;
    return q.map((p) => Math.pow(p, k));
  }

  // Shin (1993): models a share z of insider money; solve sum(p_i(z)) = 1
  const shinP = (z: number) =>
    q.map((qi) => (Math.sqrt(z * z + (4 * (1 - z) * qi * qi) / Q) - z) / (2 * (1 - z)));
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 80; i++) {
    const z = (lo + hi) / 2;
    const s = shinP(z).reduce((a, b) => a + b, 0);
    if (s > 1) lo = z; else hi = z;
  }
  const p = shinP((lo + hi) / 2);
  const s = p.reduce((a, b) => a + b, 0);
  return p.map((x) => x / s);
}

export const ev = (p: number, odds: number) => p * odds - 1;
export const kelly = (p: number, odds: number) => Math.max(0, (p * odds - 1) / (odds - 1));

// ---------- Uncertainty: propagate xG uncertainty through the grid ----------

// Deterministic PRNG so server and client renders agree.
export function mulberry32(seed: number) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function gaussian(rand: () => number): number {
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export interface Band { lo: number; mid: number; hi: number }

// xG is lognormal around the point estimate with coefficient of variation `cv`.
export function oneXTwoBands(lh: number, la: number, rho: number, cv: number, draws = 300): { home: Band; draw: Band; away: Band } {
  const rand = mulberry32(42);
  const hs: number[] = [], ds: number[] = [], as: number[] = [];
  const s = Math.sqrt(Math.log(1 + cv * cv));
  for (let i = 0; i < draws; i++) {
    const zh = gaussian(rand), za = gaussian(rand);
    const g = scoreGrid(lh * Math.exp(s * zh - s * s / 2), la * Math.exp(s * za - s * s / 2), rho, 8);
    const r = oneXTwo(g);
    hs.push(r.home); ds.push(r.draw); as.push(r.away);
  }
  const band = (xs: number[]): Band => {
    const sorted = [...xs].sort((x, y) => x - y);
    const q = (f: number) => sorted[Math.min(sorted.length - 1, Math.floor(f * sorted.length))];
    return { lo: q(0.1), mid: q(0.5), hi: q(0.9) };
  };
  return { home: band(hs), draw: band(ds), away: band(as) };
}

// ---------- Scoring rules ----------

export const logLoss = (pOutcome: number) => -Math.log(Math.max(pOutcome, 1e-12));

// Ranked Probability Score for ordered outcomes (home, draw, away)
export function rps(p: number[], outcomeIdx: number): number {
  let cumP = 0, cumO = 0, s = 0;
  for (let i = 0; i < p.length - 1; i++) {
    cumP += p[i];
    cumO += i === outcomeIdx ? 1 : 0;
    s += (cumP - cumO) ** 2;
  }
  return s / (p.length - 1);
}

export const pct = (x: number, d = 1) => `${(x * 100).toFixed(d)}%`;
export const fmtOdds = (x: number) => (Number.isFinite(x) ? x.toFixed(2) : "—");
