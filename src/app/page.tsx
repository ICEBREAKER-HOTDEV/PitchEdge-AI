import Link from "next/link";
import { Card, Callout, Pill, Section, Stat } from "@/components/ui";
import { Pipeline } from "@/components/pipeline";
import { asianHandicapHome, btts, devig, ev, fairAsianOdds, oneXTwo, pct, scoreGrid, totalOver } from "@/lib/model";

// One worked example, computed at build time from the same engine the Lab uses.
const LH = 1.62, LA = 1.08, RHO = -0.07;
const grid = scoreGrid(LH, LA, RHO);
const p = oneXTwo(grid);
const ou = totalOver(grid, 2.5);
const ah = asianHandicapHome(grid, -0.25);
const book = [2.05, 3.6, 3.55];
const fair = devig(book, "shin");

const failures = [
  { t: "Leaky backtests", d: "Confirmed XIs, late injury news or closing odds sneak into features - ROI looks great until it meets a real bet timestamp." },
  { t: "Markets that disagree", d: "Separate 1X2, AH and totals models drift apart: 2.8 total xG but 44% on Over 2.5 is a bug, not an opinion." },
  { t: "Accurate but uncalibrated", d: "A model can pick winners and still lose money. Betting needs probabilities that are right on average, not just right-ranked." },
  { t: "Edge that isn't there", d: "Wrong 3-way vig removal, ignored AH pushes and uncertainty-free Kelly turn noise into 'value'." },
];

const pages = [
  { href: "/architecture", t: "Architecture", d: "Nine layers, what each one owns, and the contracts between them." },
  { href: "/lab", t: "Model Lab", d: "Move xG and ρ, watch the score grid, 1X2, AH, totals and EV update live." },
  { href: "/lineups", t: "Lineups & Schedule", d: "Remove a star striker or keeper and see the effect on team xG, not a count of injuries." },
  { href: "/backtest", t: "Backtest & Calibration", d: "Information timeline, reliability curves, and why accuracy alone lies." },
  { href: "/audit", t: "Audit", d: "Blend checker, 3-way de-vig, and the leakage checklist used on day one." },
  { href: "/approach", t: "Q&A", d: "Direct answers to all 13 questions in the brief." },
  { href: "/roadmap", t: "Roadmap", d: "4-week engagement plan, deliverables, and the data needed to trust a backtest." },
];

export default function Home() {
  return (
    <>
      <section className="relative pt-14 sm:pt-20">
        <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-60" />
        <div className="flex flex-wrap gap-2">
          <Pill tone="green">MLS first</Pill>
          <Pill tone="sky">1X2 · Asian handicap · Totals</Pill>
          <Pill tone="amber">CLV-validated</Pill>
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          One score grid. Every market. <span className="text-pitch">No leakage.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
          A blueprint and working prototype for an MLS prediction system that turns lineup-aware expected goals into a
          calibrated score distribution, derives every market from it, and only bets when the edge survives vig,
          uncertainty and the closing line.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/lab" className="rounded-lg bg-pitch px-4 py-2.5 text-sm font-semibold text-bg hover:brightness-110">Open the Model Lab</Link>
          <Link href="/architecture" className="rounded-lg border border-line-2 px-4 py-2.5 text-sm font-semibold hover:bg-panel-2">See the architecture</Link>
        </div>
      </section>

      <Section kicker="Worked example" title="From two numbers to a bet decision">
        <Card>
          <div className="mb-4 text-sm text-muted">
            Illustrative fixture: home λ = <span className="num text-ink">{LH}</span>, away λ = <span className="num text-ink">{LA}</span>,
            Dixon-Coles ρ = <span className="num text-ink">{RHO}</span>. Book 1X2 at <span className="num text-ink">{book.join(" / ")}</span>.
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <Stat label="Home" value={pct(p.home)} sub={`fair ${(1 / p.home).toFixed(2)}`} />
            <Stat label="Draw" value={pct(p.draw)} sub={`fair ${(1 / p.draw).toFixed(2)}`} />
            <Stat label="Away" value={pct(p.away)} sub={`fair ${(1 / p.away).toFixed(2)}`} />
            <Stat label="Over 2.5" value={pct(ou.win)} sub={`fair ${(1 / ou.win).toFixed(2)}`} />
            <Stat label="Home -0.25" value={fairAsianOdds(ah).toFixed(2)} sub="fair AH odds" />
            <Stat label="BTTS yes" value={pct(btts(grid))} />
            <Stat label="EV home @2.05" value={pct(ev(p.home, 2.05))} sub={`market ${pct(fair[0])} no-vig`} tone={ev(p.home, 2.05) > 0.03 ? "green" : "amber"} />
          </div>
          <div className="mt-4 text-xs text-faint">All seven numbers come from one grid - change the inputs in the <Link href="/lab" className="text-pitch underline-offset-2 hover:underline">Model Lab</Link>.</div>
        </Card>
      </Section>

      <Section kicker="Why systems fail" title="The four ways betting models quietly lose money">
        <div className="grid gap-4 sm:grid-cols-2">
          {failures.map((f, i) => (
            <Card key={f.t}>
              <div className="flex items-start gap-3">
                <div className="num mt-0.5 text-sm text-rose">0{i + 1}</div>
                <div>
                  <div className="font-semibold">{f.t}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted">{f.d}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section kicker="The engine" title="Nine layers, one direction of information">
        <Pipeline linkTo="/architecture" />
        <div className="mt-5">
          <Callout title="Design rule">
            Markets are never modelled independently. Team strength and lineups produce two goal rates; the grid turns
            them into scorelines; every price is a sum over that grid. Calibration and the betting layer sit on top and
            can never feed information back into training.
          </Callout>
        </div>
      </Section>

      <Section kicker="Explore" title="What is in this prototype">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((x) => (
            <Link key={x.href} href={x.href} className="group rounded-xl border border-line bg-panel/80 p-5 transition-colors hover:border-pitch/50">
              <div className="flex items-center justify-between font-semibold">
                {x.t}
                <span className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-pitch">→</span>
              </div>
              <div className="mt-1.5 text-sm leading-relaxed text-muted">{x.d}</div>
            </Link>
          ))}
        </div>
      </Section>

      <Section kicker="Definition of done" title="What success looks like after the first engagement">
        <div className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {[
            "Defensible MLS architecture, documented layer by layer",
            "Home / draw / away probabilities that sum to 1 and match the xG",
            "Draw rate calibrated by bucket, not just on average",
            "AH and totals priced from the grid with correct push logic",
            "Starting-XI strength replaces injury counts",
            "Point-in-time backtest that replays each bet timestamp",
            "Predictive skill reported separately from betting profit",
            "SHAP + component breakdown on every prediction",
            "No-vig market comparison with Shin / power methods",
            "Monitoring for CLV, drift and component dominance",
          ].map((x) => (
            <div key={x} className="flex gap-2.5 text-muted">
              <span className="text-pitch">✓</span>
              {x}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
