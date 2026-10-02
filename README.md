# PitchEdge AI

Prototype and blueprint for a calibrated MLS prediction & betting-decision system:
lineup-aware expected goals → Dixon-Coles score grid → 1X2 / Asian handicap / totals → no-vig EV with uncertainty.

## Pages

| Route | What it shows |
| --- | --- |
| `/` | Overview, worked example, nine-layer pipeline |
| `/architecture` | Inputs, outputs, methods and guardrails per layer; goal-model choice; how market odds are used |
| `/lab` | Interactive score grid, AH / totals ladders, decision table with uncertainty-adjusted EV |
| `/lineups` | Player value vs replacement, GK regression, travel / rest / altitude effects |
| `/backtest` | As-of information timeline, walk-forward folds, calibration & accuracy-trap simulation |
| `/audit` | Blend checker, 3-way de-vig calculator, xG ↔ market consistency, leakage checklist |
| `/approach` | Answers to the 13 questions in the brief |
| `/roadmap` | 4-week plan and deliverables |

All math lives in `src/lib/model.ts` and runs client-side; there is no backend. Numbers in demos are illustrative.

## Develop

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # sanity checks for the probability engine
npm run build
```

## Deploy

Import the repo in Vercel - framework preset **Next.js**, no environment variables needed.
