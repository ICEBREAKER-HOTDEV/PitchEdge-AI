// Sanity checks for the probability engine. Run with: npm test
import assert from "node:assert/strict";
import {
  scoreGrid, oneXTwo, expectedGoals, asianHandicapHome, asianHandicapAway, totalOver, totalUnder,
  fairAsianOdds, asianEV, devig, overround, ev, rps,
} from "./model";

const close = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`);

const g = scoreGrid(1.6, 1.1, -0.08, 12);
const r = oneXTwo(g);
close(r.home + r.draw + r.away, 1);
const xg = expectedGoals(g);
assert.ok(Math.abs(xg.home - 1.6) < 0.05 && Math.abs(xg.away - 1.1) < 0.05, "grid xG must match inputs");

// Negative rho must raise draw probability vs independent Poisson
assert.ok(oneXTwo(scoreGrid(1.4, 1.2, -0.1)).draw > oneXTwo(scoreGrid(1.4, 1.2, 0)).draw);

// AH 0 (draw no bet) home: win = P(home), push = P(draw)
const dnb = asianHandicapHome(g, 0);
close(dnb.win, r.home); close(dnb.push, r.draw); close(dnb.loss, r.away);

// AH -0.5 home == moneyline home
close(asianHandicapHome(g, -0.5).win, r.home);

// AH -0.25: half on 0, half on -0.5 → draw = half-loss
const q = asianHandicapHome(g, -0.25);
close(q.halfLoss, r.draw); close(q.win, r.home);

// AH -0.75: winning by exactly one = half-win
const q2 = asianHandicapHome(g, -0.75);
let byOne = 0; g.forEach((row, h) => row.forEach((p, a) => { if (h - a === 1) byOne += p; }));
close(q2.halfWin, byOne);

// Home -0.75 and Away +0.75 are mirror bets: home full win ⇔ away full loss
const aw = asianHandicapAway(g, -0.75);
close(q2.win, aw.loss); close(q2.halfWin, aw.halfLoss);

// Totals: Over 2.5 + Under 2.5 = 1 ; Over 2 has push on exactly 2
const o25 = totalOver(g, 2.5), u25 = totalUnder(g, 2.5);
close(o25.win + u25.win, 1);
assert.ok(totalOver(g, 2).push > 0);

// Fair odds → zero EV
close(asianEV(q2, fairAsianOdds(q2)), 0);

// De-vig always sums to one; Shin/power shade the longshot more than multiplicative
const odds = [1.7, 3.9, 5.2];
for (const m of ["multiplicative", "power", "shin"] as const) close(devig(odds, m).reduce((a, b) => a + b, 0), 1);
assert.ok(devig(odds, "shin")[2] < devig(odds, "multiplicative")[2]);
assert.ok(overround(odds) > 0);

close(ev(0.5, 2.1), 0.05);
close(rps([1, 0, 0], 0), 0);

console.log("model.test.ts: all checks passed");
