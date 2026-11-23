import type { Metadata } from "next";

import { BillingFaq } from "@/features/landing/components/BillingFaq";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { PlanComparison } from "@/features/landing/components/PlanComparison";
import { Plans } from "@/features/landing/components/Plans";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Try practice free as a guest, then choose Individual (A$14.99/month) or Family (A$19.99/month) for child profiles, saved progress and the parent dashboard.",
};

/** Plans — design handoff screen 3. */
export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Plans"
      title="Free to practise."
      intro="Try practice as a guest, free, with no account or card. Subscribe for child profiles, saved progress, full-length exam papers and a parent dashboard."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Practise as a guest", href: routes.guestPractice }}
    >
      <Plans />
      <PlanComparison />
      <BillingFaq />
    </MarketingPage>
  );
}
