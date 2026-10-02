import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { Lab } from "./lab";

export const metadata: Metadata = { title: "Model Lab" };

export default function LabPage() {
  return (
    <>
      <PageHeader kicker="Model Lab" title="xG → score grid → markets → bet decision, live">
        Set the two goal rates and the Dixon-Coles correlation, paste in book prices, and watch every market and every
        EV update from the same distribution. Uncertainty on xG is propagated through the grid, so a bet must clear the
        edge threshold on its pessimistic estimate, not only its point estimate.
      </PageHeader>
      <Lab />
    </>
  );
}
