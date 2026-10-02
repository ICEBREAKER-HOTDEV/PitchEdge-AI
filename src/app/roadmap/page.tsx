import type { Metadata } from "next";
import { Card, Callout, PageHeader, Pill, Section } from "@/components/ui";

export const metadata: Metadata = { title: "Roadmap" };

const TOTAL = 20; // working days (4 weeks × 5 days)

const PHASES = [
  {
    name: "Audit & leakage sweep", start: 0, days: 3, tone: "bg-rose",
    out: ["Trace one prediction end to end", "Math review: blending, 1X2 sums, de-vig, EV, AH settlement", "Leakage report with severity and fixes"],
  },
  {
    name: "Point-in-time data layer", start: 3, days: 3, tone: "bg-sky",
    out: ["Bitemporal feature store (knowable_at on every fact)", "Odds snapshots: open / intraday / close", "Lineup & injury timestamps, as-of query API"],
  },
  {
    name: "Team & lineup strength", start: 6, days: 4, tone: "bg-sky",
    out: ["Bayesian npxG ratings with HFA pooling", "Player value vs replacement, GK regression", "Travel / rest / altitude / congestion effects"],
  },
  {
    name: "xG & score distribution", start: 10, days: 4, tone: "bg-pitch",
    out: ["LightGBM λ model (Poisson objective) + GLM baseline", "Dixon-Coles grid, bivariate / NB challengers", "Draw diagnostics by bucket"],
  },
  {
    name: "Markets & calibration", start: 14, days: 3, tone: "bg-violet",
    out: ["1X2, AH (all quarter lines), totals, BTTS from one grid", "Walk-forward calibration + reliability reports", "SHAP and per-layer explanations"],
  },
  {
    name: "Betting layer & backtest", start: 17, days: 3, tone: "bg-amber",
    out: ["No-vig benchmark, EV on pessimistic p, Kelly policy", "Point-in-time backtest with CLV", "Monitoring: drift, dominance, CLV alerts"],
  },
];

const DELIVERABLES = [
  ["Audit report", "Every issue found, why it matters, the fix, and its measured effect on log loss / ROI."],
  ["Architecture doc", "Layer contracts, data requirements and how the system extends to new leagues."],
  ["Python package", "Ratings, λ model, score grid, markets, calibration and betting layer with tests."],
  ["Backtest harness", "As-of replay at any prediction timestamp, graded on log loss, RPS, ECE, CLV and ROI."],
  ["Explainability", "Per-match breakdown: rating, lineup, context, SHAP drivers, uncertainty band."],
  ["Dashboard", "This UI wired to real predictions, plus a weekly scorecard."],
];

export default function RoadmapPage() {
  return (
    <>
      <PageHeader kicker="Roadmap" title="Four weeks from audit to a trustworthy MLS engine">
        The plan front-loads the audit, so anything broken in the current pipeline is found in days, not after the
        model is rebuilt on top of it. Each phase ends with something runnable and measured.
      </PageHeader>

      <Card>
        <div className="overflow-x-auto">
          <div className="min-w-[680px]">
            <div className="mb-2 grid grid-cols-[220px_1fr] text-[11px] text-faint">
              <div />
              <div className="grid grid-cols-4">
                {["Week 1", "Week 2", "Week 3", "Week 4"].map((w) => <div key={w} className="border-l border-line pl-2">{w}</div>)}
              </div>
            </div>
            {PHASES.map((p) => (
              <div key={p.name} className="grid grid-cols-[220px_1fr] items-center border-t border-line py-2.5">
                <div className="pr-3 text-sm">{p.name}</div>
                <div className="relative h-6">
                  <div className={`absolute top-0 flex h-6 items-center rounded px-2 text-[11px] font-medium text-bg ${p.tone}`}
                    style={{ left: `${(p.start / TOTAL) * 100}%`, width: `${(p.days / TOTAL) * 100}%` }}>
                    <span className="num">{p.days}d</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Section kicker="Phases" title="What each phase produces">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((p, i) => (
            <Card key={p.name}>
              <div className="flex items-center justify-between">
                <span className="num text-xs text-faint">PHASE {i + 1} · DAY {p.start + 1}-{p.start + p.days}</span>
                <span className={`h-2 w-2 rounded-full ${p.tone}`} />
              </div>
              <div className="mt-2 font-semibold">{p.name}</div>
              <ul className="mt-3 space-y-1.5 text-sm text-muted">
                {p.out.map((o) => <li key={o} className="flex gap-2"><span className="text-pitch">✓</span>{o}</li>)}
              </ul>
            </Card>
          ))}
        </div>
      </Section>

      <Section kicker="Handover" title="Deliverables">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERABLES.map(([t, d]) => (
            <Card key={t}>
              <div className="font-semibold">{t}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-muted">{d}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section kicker="After week 4" title="Where it goes next">
        <div className="grid gap-4 md:grid-cols-3">
          <Callout title="Live season ops" tone="green">Weekly retrain, CLV scorecard, model review call, threshold tuning on live results.</Callout>
          <Callout title="More markets" tone="violet">BTTS, team totals, first half (half-time grid with its own λ split), alternate lines - mostly free once the grid is right.</Callout>
          <Callout title="More leagues" tone="sky">Liga MX, USL, EPL and others: data adapters + re-fit of priors and HFA; the architecture stays.</Callout>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Pill tone="green">Python</Pill><Pill tone="green">LightGBM</Pill><Pill tone="green">Dixon-Coles</Pill><Pill tone="sky">PyMC</Pill>
          <Pill tone="sky">SHAP</Pill><Pill tone="violet">FastAPI</Pill><Pill tone="violet">PostgreSQL</Pill><Pill tone="amber">Next.js</Pill>
        </div>
      </Section>
    </>
  );
}
