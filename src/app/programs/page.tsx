import type { Metadata } from "next";

import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { Programmes } from "@/features/landing/components/Programmes";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Programs",
  description:
    "Choose a year level to see what's open for it today — NAPLAN-style, ICAS-style, curriculum lessons and what's still being written.",
};

/**
 * Public/Programs.dc.html. Reuses Programmes.tsx (the same year-picker
 * and catalogue /learn and /exam-preparation already render) rather than
 * a second, hand-authored copy of the same programme facts — the design
 * mockup's own "Open for Year N" cards would otherwise drift from the
 * real coverage data in content.ts's `programmes` export.
 */
export default function ProgramsPage() {
  return (
    <MarketingPage
      eyebrow="Programs"
      title="Programs"
      intro="Choose a year level to see what's open for it today. A program is only listed as available once it has enough checked questions to fill a full set."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Explore practice", href: routes.practice }}
    >
      <Programmes />
    </MarketingPage>
  );
}
