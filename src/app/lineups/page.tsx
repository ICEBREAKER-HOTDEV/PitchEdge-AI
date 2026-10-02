import type { Metadata } from "next";
import { Callout, PageHeader, Section } from "@/components/ui";
import { LineupLab } from "./lineup-lab";

export const metadata: Metadata = { title: "Lineups & Schedule" };

export default function LineupsPage() {
  return (
    <>
      <PageHeader kicker="Lineups & schedule" title="Who is missing matters more than how many">
        A count of injured players treats a backup full-back and a 20-goal striker the same. Here each player carries a
        value above the replacement who would actually start, the goalkeeper&apos;s shot-stopping is regressed to the
        mean, and travel, rest and altitude enter as small, shrunk adjustments to expected goals.
      </PageHeader>
      <LineupLab />
      <Section kicker="Method" title="How the numbers are produced in the real system">
        <div className="grid gap-4 md:grid-cols-3">
          <Callout title="Player value" tone="sky">
            Per-90 offensive value (npxG + xA + progression, from event data) and defensive value (opponent xG suppressed while
            on pitch, adjusted with regularised plus-minus). Estimates are shrunk toward position averages by minutes played.
          </Callout>
          <Callout title="Replacement level" tone="violet">
            The effect of an absence is <em>star value minus the value of the player who actually replaces them</em>, weighted by
            expected minutes. Deep squads lose less. Projected XIs use probabilities, not certainties.
          </Callout>
          <Callout title="Context effects" tone="amber">
            Travel, rest, time zones, altitude and turf are fitted as multipliers on λ with strong regularisation, and kept only
            if they improve walk-forward log loss. In MLS they are real but small - the model must not over-trust them.
          </Callout>
        </div>
      </Section>
    </>
  );
}
