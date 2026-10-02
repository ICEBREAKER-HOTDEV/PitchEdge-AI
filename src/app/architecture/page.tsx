import type { Metadata } from "next";
import { Card, Callout, PageHeader, Pill, Section } from "@/components/ui";
import { Pipeline, STAGES } from "@/components/pipeline";

export const metadata: Metadata = { title: "Architecture" };

const DETAIL: Record<string, { in: string[]; out: string[]; how: string[]; guard: string[] }> = {
  data: {
    in: ["Match events & xG (Opta / StatsBomb / Wyscout)", "Odds snapshots: open, intraday, close (Pinnacle + recreational books)", "Injury / suspension / call-up feeds with publish time", "Projected & confirmed XIs with publish time", "Fixtures, venues, kickoff, travel, altitude, surface, weather"],
    out: ["Feature store queried as-of a timestamp: features(match, t)"],
    how: ["Every fact stored with knowable_at, never overwritten (bitemporal)", "As-of joins so a T-4h model cannot see a T-1h lineup", "Data contracts + freshness checks per provider"],
    guard: ["Closing odds physically separated from feature tables", "Unit test: no feature timestamp > prediction timestamp"],
  },
  strength: {
    in: ["npxG for/against per match", "Shot quality, field tilt, set-piece xG", "Opponent strength"],
    out: ["attack_i, defence_i, home_adv_i with uncertainty"],
    how: ["Dynamic Bayesian / Kalman-style rating on npxG (not goals)", "Time-decay tuned by walk-forward log loss", "Partial pooling: team home advantage shrunk to league HFA", "Pre-season prior from last season + roster turnover"],
    guard: ["Recent-form features only as residual vs rating - no double counting", "Finishing over/under-performance regressed hard toward zero"],
  },
  lineup: {
    in: ["Projected / confirmed XI", "Player on-ball value per 90 (xG+xA, progression, defensive actions)", "GK PSxG - GA (regressed)", "Rest days, km travelled, time zones, altitude, turf, congestion"],
    out: ["ΔλHome, ΔλAway relative to full-strength baseline"],
    how: ["XI value = Σ player value × expected minutes vs replacement", "Replacement = best available same-role squad player", "GK effect via shrunk shot-stopping on opponent's expected shots on target", "Schedule effects as small, regularised multipliers - kept only if they help out-of-sample"],
    guard: ["No binary injury counts", "Lineup source flagged: projected vs confirmed, with timestamp"],
  },
  xg: {
    in: ["Ratings, lineup deltas, context features at time t"],
    out: ["λ_home, λ_away (expected goals)"],
    how: ["Baseline: Poisson GLM log(λ) = μ + att + def + hfa + context", "LightGBM with Poisson / Tweedie objective on residual structure", "Monotone constraints where football logic is clear", "Grouped time-series CV by match week; Optuna on log loss"],
    guard: ["Target = goals (or xG-adjusted goals), never closing-line implied goals", "Feature importance + SHAP reviewed for leakage smells"],
  },
  grid: {
    in: ["λ_home, λ_away"],
    out: ["P(h, a) for 0..10 × 0..10"],
    how: ["Default: independent Poisson + Dixon-Coles ρ for low scores", "Challengers: bivariate Poisson, negative-binomial, Bayesian (PyMC)", "Pick the simplest model that wins on RPS + draw calibration"],
    guard: ["Grid sums to 1; E[h], E[a] match λ within tolerance", "Draw rate by λ-diff bucket compared to observed"],
  },
  markets: {
    in: ["Score grid"],
    out: ["1X2, AH (all quarter lines), totals, team totals, BTTS, DNB, DC"],
    how: ["Every market is a sum over the same grid", "AH quarter lines split into two half-stakes; push / half-win / half-loss priced exactly"],
    guard: ["Internal consistency tests: DNB = home/(home+away), AH-0.5 = home win, O+U = 1"],
  },
  calib: {
    in: ["Raw grid-derived probabilities on out-of-fold matches"],
    out: ["Calibrated probabilities + reliability diagnostics"],
    how: ["Calibrate λ (scale/temperature) first, so markets stay coherent", "Then multiclass calibration (Dirichlet / temperature) on 1X2 if needed", "Isotonic / beta for binary totals & AH when sample allows"],
    guard: ["Calibrator fitted only on past folds", "ECE and reliability curve per market and per draw bucket"],
  },
  bet: {
    in: ["Calibrated p, uncertainty band, live odds + timestamp, liquidity"],
    out: ["Bet / no bet, stake, reason code"],
    how: ["No-vig benchmark via Shin or power method (3-way and 2-way)", "EV computed on the lower bound of p, not the point estimate", "Fractional Kelly with max exposure per match / day", "Stay-out rules: stale odds, low liquidity, lineup unknown, model disagreement with sharp market > threshold"],
    guard: ["Sharp-market prior: large disagreements are presumed model error until proven", "Every bet logged with odds and timestamp for CLV"],
  },
  monitor: {
    in: ["Bets, closing odds, results, predictions"],
    out: ["Dashboards + alerts"],
    how: ["CLV (no-vig close vs taken price) as the primary skill metric", "Rolling log loss / RPS vs market baseline", "Component dominance: share of prediction from each layer via SHAP"],
    guard: ["Alert when one component moves p more than X pp on its own", "Alert when calibration drifts beyond tolerance for N weeks"],
  },
};

const GOAL_MODELS = [
  { m: "Independent Poisson", pro: "Simple, fast, transparent", con: "Under-predicts draws / low scores", use: "Baseline" },
  { m: "Dixon-Coles", pro: "Fixes 0-0, 1-0, 0-1, 1-1 with one parameter", con: "Only corrects low scores", use: "Default", rec: true },
  { m: "Bivariate Poisson", pro: "Explicit goal correlation", con: "Correlation often weak in data, harder to fit", use: "Challenger" },
  { m: "Negative-binomial", pro: "Handles over-dispersion", con: "MLS goals are close to Poisson; extra parameter rarely pays", use: "Diagnostic" },
  { m: "Bayesian hierarchical", pro: "Native uncertainty, partial pooling, early-season stability", con: "Slower to iterate", use: "Ratings layer" , rec: true},
  { m: "LightGBM → λ", pro: "Captures non-linear context (travel × depth, congestion)", con: "Needs distribution layer for markets", use: "λ predictor", rec: true },
  { m: "Monte Carlo", pro: "Flexible for in-game / props", con: "Unnecessary for pre-game 1X2 / AH / totals", use: "Later markets" },
];

const MARKET_ROLES = [
  { r: "Benchmark", d: "Always. Model log loss vs no-vig closing log loss is the honest skill test.", ok: true },
  { r: "Sanity check", d: "Always. Big disagreements with sharp prices trigger review, not bigger stakes.", ok: true },
  { r: "CLV validation", d: "Always. Beating the close is the fastest signal that an edge is real.", ok: true },
  { r: "Prior", d: "Yes, carefully: opening sharp price as prior, using only odds available at prediction time.", ok: true },
  { r: "Ensemble member", d: "Possible, but then evaluation must be against the close, not the price you blended in.", ok: true },
  { r: "Feature (closing odds)", d: "Never in training/backtest. It is the target leaking in through the side door.", ok: false },
];

export default function Architecture() {
  return (
    <>
      <PageHeader kicker="Architecture" title="A layered system where every market comes from the same goals">
        Information flows one way: from timestamped facts, to team and lineup strength, to two goal rates, to a score
        grid, to market prices, and finally to a bet decision. Each layer has an explicit contract and its own tests.
      </PageHeader>

      <Pipeline />

      <Section kicker="Layer by layer" title="What each layer owns">
        <div className="space-y-4">
          {STAGES.map((s) => {
            const d = DETAIL[s.id];
            return (
              <Card key={s.id} className="scroll-mt-20">
                <div id={s.id} className="scroll-mt-20" />
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="num text-sm text-faint">{s.n}</span>
                  <h3 className="text-lg font-semibold">{s.title}</h3>
                  <span className="text-sm text-muted">{s.sub}</span>
                </div>
                <div className="mt-4 grid gap-5 text-sm md:grid-cols-4">
                  <Col title="Inputs" items={d.in} color="text-sky" />
                  <Col title="Outputs" items={d.out} color="text-pitch" />
                  <Col title="Method" items={d.how} color="text-violet" />
                  <Col title="Guardrails" items={d.guard} color="text-amber" />
                </div>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section kicker="Goal models" title="Choosing the score-distribution framework">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-panel-2 text-xs uppercase tracking-wider text-faint">
              <tr><th className="px-4 py-3">Model</th><th className="px-4 py-3">Strength</th><th className="px-4 py-3">Weakness</th><th className="px-4 py-3">Role</th></tr>
            </thead>
            <tbody>
              {GOAL_MODELS.map((g) => (
                <tr key={g.m} className="border-t border-line">
                  <td className="px-4 py-3 font-medium">{g.m}</td>
                  <td className="px-4 py-3 text-muted">{g.pro}</td>
                  <td className="px-4 py-3 text-muted">{g.con}</td>
                  <td className="px-4 py-3"><Pill tone={g.rec ? "green" : "muted"}>{g.use}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Callout title="Recommendation">
            Hybrid: a Bayesian rating layer for stable team strength, LightGBM to predict λ from context the ratings
            can&apos;t see, and Dixon-Coles to turn λ into scorelines. Challengers are kept only if they beat it on RPS
            and draw calibration in walk-forward tests - complexity has to earn its place.
          </Callout>
        </div>
      </Section>

      <Section kicker="Market odds" title="How sportsbook prices are used without leaking">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKET_ROLES.map((m) => (
            <Card key={m.r}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{m.r}</div>
                <Pill tone={m.ok ? "green" : "rose"}>{m.ok ? "use" : "never"}</Pill>
              </div>
              <div className="mt-2 text-sm leading-relaxed text-muted">{m.d}</div>
            </Card>
          ))}
        </div>
      </Section>

      <Section kicker="Stack" title="Implementation stack">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Modelling", "Python, LightGBM, statsmodels, PyMC, scikit-learn, SHAP, Optuna"],
            ["Data", "PostgreSQL / DuckDB feature store, Parquet snapshots, dbt-style as-of views"],
            ["Pipelines", "Prefect / cron jobs, odds pollers, lineup listeners, pytest data contracts"],
            ["Serving", "FastAPI prediction API, MLflow model registry, dashboard (this UI, Next.js)"],
          ].map(([t, d]) => (
            <Card key={t}><div className="text-xs uppercase tracking-wider text-faint">{t}</div><div className="mt-2 text-sm leading-relaxed">{d}</div></Card>
          ))}
        </div>
        <div className="mt-4 text-sm text-muted">
          League-agnostic by design: ratings, priors and HFA are keyed by competition, so adding the EPL or Liga MX means new data
          adapters and a re-fit, not a new system.
        </div>
      </Section>
    </>
  );
}

function Col({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <div className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${color}`}>{title}</div>
      <ul className="space-y-1.5 text-[13px] leading-snug text-muted">
        {items.map((x) => <li key={x} className="flex gap-2"><span className="text-faint">·</span><span>{x}</span></li>)}
      </ul>
    </div>
  );
}
