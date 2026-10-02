import type { Metadata } from "next";
import { Card, PageHeader, Pill, Section } from "@/components/ui";
import { BlendChecker, ConsistencyCheck, DevigCalc } from "./tools";

export const metadata: Metadata = { title: "Audit" };

const CHECKS: { area: string; check: string; how: string; sev: "critical" | "high" | "medium" }[] = [
  { area: "Leakage", check: "Confirmed XI used before it was published", how: "Join lineup publish_ts vs prediction_ts; fail CI if any row violates", sev: "critical" },
  { area: "Leakage", check: "Injury / suspension news from after the bet", how: "As-of joins on news knowable_at, spot-check 50 matches manually", sev: "critical" },
  { area: "Leakage", check: "Closing odds as a feature or as the 'taken' price", how: "Grep feature lineage; backtest must use timestamped intraday prices", sev: "critical" },
  { area: "Leakage", check: "Rolling features including the current match", how: "Shift-by-one test: feature for match k must equal value computed without k", sev: "critical" },
  { area: "Leakage", check: "Season-level aggregates (final table, full-season xG)", how: "Feature audit: anything computed over a window ending after kickoff", sev: "high" },
  { area: "Validation", check: "Random K-fold on time-series data", how: "Replace with walk-forward; compare - a large drop means the old score was leaking", sev: "critical" },
  { area: "Validation", check: "Survivorship: only teams / odds still in the database", how: "Rebuild from raw snapshots incl. expansion teams, relocated clubs, removed books", sev: "medium" },
  { area: "Validation", check: "Hyper-parameters tuned on the test period", how: "Nested walk-forward; freeze config before test window", sev: "high" },
  { area: "Math", check: "H + D + A ≠ 1, or markets inconsistent with λ", how: "Unit tests per prediction; xG ↔ market consistency check below", sev: "high" },
  { area: "Math", check: "Asian quarter lines priced as full lines", how: "Settlement tests: -0.25 draw = half loss, -0.75 win by 1 = half win", sev: "high" },
  { area: "Math", check: "EV on no-vig price or on stale odds", how: "EV uses taken price at bet_ts; odds age guard", sev: "high" },
  { area: "Features", check: "Form double-counting rating strength", how: "Residualise form on rating; check SHAP interaction and VIF", sev: "medium" },
  { area: "Features", check: "Finishing % / save % treated as skill", how: "Year-on-year correlation test; regress to mean by sample size", sev: "medium" },
  { area: "Betting", check: "ROI driven by a few longshots", how: "ROI by odds bucket; bootstrap CI; remove top 1% winners and re-check", sev: "medium" },
];

const PLAYBOOK = [
  ["Reproduce", "Re-run the backtest from raw data with a fixed seed; confirm the number."],
  ["Re-time", "Rebuild every feature as-of the claimed bet timestamp. Most 'edges' die here."],
  ["Re-price", "Swap taken prices for prices actually available at that timestamp, with liquidity limits."],
  ["Benchmark", "Compare model log loss to no-vig closing log loss. Beating the close is rare - treat it as a red flag until explained."],
  ["CLV", "If ROI is positive but CLV is negative, the profit is most likely variance."],
  ["Stress", "Bootstrap seasons, drop the best 1% of bets, split by market and odds range."],
];

const sevTone = { critical: "rose", high: "amber", medium: "sky" } as const;

export default function AuditPage() {
  return (
    <>
      <PageHeader kicker="Audit" title="Find what's broken before it finds the bankroll">
        The first week is an audit of the existing pipeline: trace one prediction end to end, verify the math, and run
        the checks below. These tools are the same checks, made interactive.
      </PageHeader>

      <div className="space-y-5">
        <BlendChecker />
        <DevigCalc />
        <ConsistencyCheck />
      </div>

      <Section kicker="Checklist" title="Leakage & methodology audit">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-panel-2 text-[11px] uppercase tracking-wider text-faint">
              <tr><th className="px-4 py-3">Area</th><th className="px-4 py-3">What can go wrong</th><th className="px-4 py-3">How it is detected</th><th className="px-4 py-3">Severity</th></tr>
            </thead>
            <tbody>
              {CHECKS.map((c) => (
                <tr key={c.check} className="border-t border-line">
                  <td className="px-4 py-3 text-muted">{c.area}</td>
                  <td className="px-4 py-3">{c.check}</td>
                  <td className="px-4 py-3 text-muted">{c.how}</td>
                  <td className="px-4 py-3"><Pill tone={sevTone[c.sev]}>{c.sev}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section kicker="Playbook" title="When the backtest ROI looks too good">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PLAYBOOK.map(([t, d], i) => (
            <Card key={t}>
              <div className="num text-xs text-amber">STEP {i + 1}</div>
              <div className="mt-1 font-semibold">{t}</div>
              <div className="mt-1.5 text-sm leading-relaxed text-muted">{d}</div>
            </Card>
          ))}
        </div>
      </Section>
    </>
  );
}
