import type { Metadata } from "next";
import { Card, Callout, PageHeader, Section } from "@/components/ui";
import { InfoTimeline } from "./timeline";
import { CalibrationDemo } from "./calibration";

export const metadata: Metadata = { title: "Backtest & Calibration" };

const SEASONS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025"];
const FOLDS = [
  { train: 3, cal: 3, test: 4 },
  { train: 4, cal: 4, test: 5 },
  { train: 5, cal: 5, test: 6 },
];

const METRICS = [
  ["Probability quality", "Multiclass log loss, Brier, RPS, ECE, reliability per market and per draw bucket"],
  ["Goal model", "λ error vs actual goals and post-match xG, goal-difference error, Over/Under calibration"],
  ["Versus market", "Log loss vs no-vig closing line - the only honest skill benchmark"],
  ["Betting", "CLV (primary), realised ROI with confidence interval, volume, max drawdown"],
  ["Slices", "By edge bucket, odds range, market, H/D/A selection, prediction timestamp, season phase"],
];

export default function BacktestPage() {
  return (
    <>
      <PageHeader kicker="Backtest & calibration" title="Replay exactly what was knowable, then grade it honestly">
        A backtest is only as trustworthy as its timestamps. Every historical prediction is rebuilt from an as-of query
        against the feature store, priced against the odds available at that moment, and graded against the closing line
        before anyone looks at ROI.
      </PageHeader>

      <InfoTimeline />

      <Section kicker="Validation" title="Walk-forward, never shuffled">
        <Card>
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 text-center text-[11px] text-faint">
                <div />
                {SEASONS.map((s) => <div key={s} className="num">{s}</div>)}
              </div>
              {FOLDS.map((f, i) => (
                <div key={i} className="mt-1 grid grid-cols-[80px_repeat(7,1fr)] gap-1">
                  <div className="num self-center text-[11px] text-muted">Fold {i + 1}</div>
                  {SEASONS.map((s, j) => {
                    const c = j < f.train - 1 ? "bg-sky/30" : j === f.cal - 1 ? "bg-violet/40" : j === f.test - 1 ? "bg-pitch/50" : "bg-line/40";
                    const l = j < f.train - 1 ? "train" : j === f.cal - 1 ? "calibrate" : j === f.test - 1 ? "test" : "";
                    return <div key={s} className={`rounded py-2 text-center text-[10px] text-ink/80 ${c}`}>{l}</div>;
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-sm leading-relaxed text-muted">
            Train on past seasons, fit the calibrator on the next block, test on the block after that, then roll forward.
            Within a season the same idea runs match-week by match-week. Hyper-parameters are tuned inside the training window only.
          </div>
        </Card>
      </Section>

      <Section kicker="Calibration" title="Why a 60% must mean 60%">
        <CalibrationDemo />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Callout title="Calibrate goals first" tone="violet">
            Scaling λ (or a temperature on the grid) keeps every market coherent. Calibrating 1X2, AH and totals separately can
            make them disagree with each other again.
          </Callout>
          <Callout title="Draws get their own check" tone="amber">
            Draw rate is compared per |λ-diff| bucket and per total-xG bucket. If low-total, even games under-draw, ρ is too weak.
          </Callout>
          <Callout title="Sample size honesty" tone="sky">
            One MLS season is ~500 matches. ROI on a few hundred bets has a ±10% interval, so CLV and log loss lead, ROI follows.
          </Callout>
        </div>
      </Section>

      <Section kicker="Scorecard" title="What gets reported every week">
        <div className="overflow-hidden rounded-xl border border-line">
          {METRICS.map(([k, v], i) => (
            <div key={k} className={`grid gap-1 px-4 py-3 text-sm sm:grid-cols-[200px_1fr] ${i ? "border-t border-line" : ""}`}>
              <div className="font-medium">{k}</div>
              <div className="text-muted">{v}</div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
