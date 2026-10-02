import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Q&A" };

const L = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="text-pitch underline-offset-2 hover:underline">{children}</Link>
);

const QA: { q: string; a: ReactNode }[] = [
  {
    q: "1. Experience with sports betting models, soccer forecasting and market-prediction systems",
    a: (
      <>
        <p>Two football probability engines that are live today:</p>
        <ul>
          <li><b>Lambdix</b> (lambdix.com) - calibrated probabilities and explicit edge over a stated line across nine leagues including MLS. 1X2, totals 0.5-5.5, BTTS, corners, cards and player props. Poisson + Dixon-Coles, temperature-scaled calibration, lineup-aware player contributions, opponent adjustment, backtested on 8,000+ matches.</li>
          <li><b>11Stat</b> (11stat.com) - multi-model match intelligence: Poisson/Dixon-Coles, Elo/form ratings and Monte Carlo blended with xG and tempo profiles, with calibration and backtest reporting.</li>
        </ul>
        <p>The common thread is probability quality first, betting second: the model has to beat the no-vig market on log loss before any edge is believed.</p>
      </>
    ),
  },
  {
    q: "2. Hands-on LightGBM, probability models, calibration and time-aware validation",
    a: (
      <ul>
        <li>LightGBM with Poisson / Tweedie objectives to predict goal rates, and multiclass for direct 1X2 challengers. Monotone constraints, grouped time-series CV, Optuna tuned on log loss - never accuracy.</li>
        <li>Calibration: temperature scaling on goal rates (keeps markets coherent), Dirichlet / multiclass temperature on 1X2, isotonic or beta for binary markets when samples allow. Calibrators fit only on past folds.</li>
        <li>Validation is walk-forward by season and match-week, with as-of feature joins. See the <L href="/backtest">Backtest page</L>.</li>
      </ul>
    ),
  },
  {
    q: "3. Direct MLS, soccer analytics, xG, odds data, Asian markets",
    a: (
      <p>
        MLS is one of the leagues covered in Lambdix. Daily work with xG and event-level data, odds snapshots (opening / intraday / close), three-way 1X2 de-vig, and Asian
        handicap and totals settlement including quarter lines. MLS specifics that matter: parity and roster rules flatten ratings, travel and time zones are real,
        altitude in Utah and Colorado, turf venues, and heavy congestion around Leagues Cup, CONCACAF and international windows.
      </p>
    ),
  },
  {
    q: "4. Approach to the home/draw/away, xG, score-distribution, AH, totals and betting layers",
    a: (
      <>
        <ul>
          <li><b>xG model:</b> λ_home, λ_away from a Bayesian team-strength rating on npxG + LightGBM for context (lineup value, rest, travel, GK).</li>
          <li><b>Score distribution:</b> Dixon-Coles grid on λ; bivariate Poisson and negative-binomial kept as challengers, adopted only if they win on RPS and draw calibration.</li>
          <li><b>1X2, AH, totals, BTTS:</b> all summed from the same grid, so they can never disagree. AH quarter lines are split into two half-stakes.</li>
          <li><b>Betting layer:</b> Shin / power no-vig benchmark, EV on the taken price using a pessimistic probability, fractional Kelly, and stay-out rules (stale odds, unknown XI, implausible gap vs sharp market).</li>
        </ul>
        <p>Try it in the <L href="/lab">Model Lab</L>; the full design is on the <L href="/architecture">Architecture page</L>.</p>
      </>
    ),
  },
  {
    q: "5. Modelling draws and verifying draw calibration",
    a: (
      <ul>
        <li>Draws come from the grid, not a separate class: Dixon-Coles ρ (and, if needed, a draw-inflation term that depends on total xG) corrects the 0-0 / 1-1 under-count of independent Poisson.</li>
        <li>Verification: reliability curve for draws alone, plus observed vs predicted draw rate by |λ_home - λ_away| bucket and by total-xG bucket. Low-total, even games are where models fail.</li>
        <li>Also checked against no-vig market draw prices - the market is very efficient on draws, so a consistent gap there usually means a model bug.</li>
      </ul>
    ),
  },
  {
    q: "6. Incorporating lineups, injuries, suspensions and international absences",
    a: (
      <ul>
        <li>Every absence and lineup fact is stored with the time it became public, so the T-4h model sees projected XIs and the T-60m model sees confirmed ones.</li>
        <li>Projected XI = probability each player starts, from depth chart, minutes trend, rotation risk around midweek and international windows.</li>
        <li>Team strength is recomputed from the expected XI rather than adding injury flags. Two models run in production: pre-lineup and post-lineup.</li>
      </ul>
    ),
  },
  {
    q: "7. Measuring the impact of a star player being unavailable",
    a: (
      <p>
        Each player has offensive and defensive value per 90 above replacement (npxG + xA + progression, and regularised plus-minus on xG against), shrunk by minutes.
        The effect of an absence is <i>player value minus the value of the actual replacement</i>, times expected minutes, times an overlap factor fitted on the team level.
        Goalkeepers use post-shot xG minus goals allowed, heavily regressed by shots faced. Try it on the <L href="/lineups">Lineups page</L>.
      </p>
    ),
  },
  {
    q: "8. Genuine team-strength changes vs short-term variance",
    a: (
      <ul>
        <li>Ratings update on npxG and shot quality, not goals or points; finishing and save percentage are regressed hard because they barely persist season to season.</li>
        <li>Update speed (decay) is tuned out of sample; structural breaks (coach change, major transfer, returning star) get a temporary higher learning rate or a prior shift.</li>
        <li>Recent form only enters as a residual against the rating, so it cannot double-count strength already captured.</li>
      </ul>
    ),
  },
  {
    q: "9. Auditing suspiciously high accuracy or ROI",
    a: (
      <p>
        Reproduce, re-time every feature as-of the bet timestamp, re-price with odds that were actually available, compare log loss with the no-vig close, check CLV,
        then bootstrap and slice by odds range. Positive ROI with negative CLV is almost always variance. Full playbook on the <L href="/audit">Audit page</L>.
      </p>
    ),
  },
  {
    q: "10. Calibration, and why accuracy alone is not enough",
    a: (
      <p>
        Two models can pick the same favourite in every match and have identical accuracy. If one says 75% when those teams win 56% of the time, it will see value
        everywhere and lose money. Betting pays on the size of the probability, so the targets are log loss, RPS and reliability by bucket, benchmarked against the
        market. The <L href="/backtest">simulation on the Backtest page</L> shows exactly this.
      </p>
    ),
  },
  {
    q: "11. Detecting broken blending, leakage, incorrect 1X2 or EV",
    a: (
      <ul>
        <li>Per-prediction unit tests: H + D + A = 1, blend within component envelope, markets consistent with λ, AH settlement identities.</li>
        <li>Component dominance: SHAP and per-layer deltas; alert when one component moves p by more than a set number of points.</li>
        <li>Leakage: as-of joins enforced in code, shift-by-one feature tests, and a shuffled-time vs walk-forward comparison.</li>
        <li>EV: computed on the taken price at bet time, never on no-vig or closing odds. Interactive checks on the <L href="/audit">Audit page</L>.</li>
      </ul>
    ),
  },
  {
    q: "12. Data and timestamps needed before trusting an MLS backtest",
    a: (
      <ul>
        <li>Event data with xG for 5+ MLS seasons (Opta / StatsBomb / Wyscout), player minutes and positions.</li>
        <li>Timestamped odds: open, intraday snapshots and close, ideally Pinnacle plus the books actually bet, with limits / liquidity.</li>
        <li>Injury reports, suspensions, international call-ups with publish times; projected and confirmed XIs with publish times.</li>
        <li>Fixtures with venue, kickoff, travel distance, time zone, altitude, surface, and other-competition schedules (Leagues Cup, CONCACAF, US Open Cup, Canadian Championship).</li>
        <li>Transfers and coaching changes with effective dates. Without timestamps on lineups and odds, any post-lineup backtest is treated as an upper bound only.</li>
      </ul>
    ),
  },
  {
    q: "13. Previous soccer betting models: leagues, markets, data, validation, CLV",
    a: (
      <ul>
        <li><b>Leagues:</b> Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, Brasileirão and two Nordic leagues.</li>
        <li><b>Markets:</b> 1X2, totals, BTTS, half-time / full-time, corners, cards, shots and player props.</li>
        <li><b>Data:</b> match and event-level xG, lineups and player contributions, odds snapshots.</li>
        <li><b>Validation:</b> walk-forward backtests on 8,000+ matches, reliability curves and temperature calibration.</li>
        <li><b>CLV:</b> tracked against the no-vig closing line as the primary signal that a stated edge is real.</li>
      </ul>
    ),
  },
];

export default function ApproachPage() {
  return (
    <>
      <PageHeader kicker="Q&A" title="Answers to the 13 questions in the brief">
        Short, direct answers. Each one links to the part of this prototype where the idea can be tried.
      </PageHeader>
      <div className="space-y-3">
        {QA.map((x, i) => (
          <details key={x.q} open={i < 2} className="group rounded-xl border border-line bg-panel/80 open:border-line-2">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold [&::-webkit-details-marker]:hidden">
              {x.q}
              <span className="text-faint transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="space-y-3 px-5 pb-5 text-sm leading-relaxed text-muted [&_b]:text-ink [&_li]:ml-4 [&_li]:list-disc [&_li]:pl-1 [&_ul]:space-y-2">
              {x.a}
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
