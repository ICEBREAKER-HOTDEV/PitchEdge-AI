import Link from "next/link";

export const STAGES = [
  { id: "data", n: "01", title: "Point-in-time data", sub: "Odds, lineups, injuries, xG, travel - every row stamped with when it was knowable", tone: "sky" },
  { id: "strength", n: "02", title: "Team strength", sub: "Dynamic attack / defence ratings from npxG, shrunk toward priors", tone: "sky" },
  { id: "lineup", n: "03", title: "Lineup & context", sub: "Starting-XI value vs replacement, GK, rest, travel, congestion", tone: "sky" },
  { id: "xg", n: "04", title: "Expected goals", sub: "LightGBM / GLM predicts λ-home and λ-away", tone: "green" },
  { id: "grid", n: "05", title: "Score distribution", sub: "Dixon-Coles / bivariate grid of every scoreline", tone: "green" },
  { id: "markets", n: "06", title: "Markets", sub: "1X2, AH, totals, BTTS - all summed from the same grid", tone: "green" },
  { id: "calib", n: "07", title: "Calibration", sub: "Walk-forward isotonic / beta / temperature on held-out folds", tone: "violet" },
  { id: "bet", n: "08", title: "Decision layer", sub: "No-vig market, EV, uncertainty-shrunk Kelly, stay-out rules", tone: "amber" },
  { id: "monitor", n: "09", title: "Monitoring", sub: "CLV, calibration drift, component dominance alerts", tone: "amber" },
] as const;

const ring: Record<string, string> = {
  sky: "border-sky/40 text-sky",
  green: "border-pitch/40 text-pitch",
  violet: "border-violet/40 text-violet",
  amber: "border-amber/40 text-amber",
};

export function Pipeline({ linkTo }: { linkTo?: string }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-3 lg:grid-cols-9 lg:gap-2">
      {STAGES.map((s, i) => {
        const body = (
          <div className="group relative h-full rounded-lg border border-line bg-panel/80 p-3 transition-colors hover:border-line-2">
            <div className={`num inline-flex h-6 w-8 items-center justify-center rounded border text-[11px] ${ring[s.tone]}`}>{s.n}</div>
            <div className="mt-2 text-[13px] font-semibold leading-snug">{s.title}</div>
            <div className="mt-1 text-[11.5px] leading-snug text-muted">{s.sub}</div>
            {i < STAGES.length - 1 && (
              <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-faint lg:block" aria-hidden>›</span>
            )}
          </div>
        );
        return (
          <li key={s.id}>
            {linkTo ? <Link href={`${linkTo}#${s.id}`}>{body}</Link> : body}
          </li>
        );
      })}
    </ol>
  );
}
