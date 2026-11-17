import type { Metadata } from "next";

import { BillingFaq } from "@/features/landing/components/BillingFaq";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { PlanComparison } from "@/features/landing/components/PlanComparison";
import { Plans } from "@/features/landing/components/Plans";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Try 5 sample questions in every programme for free, then choose Individual (A$14.99/month) or Family (A$19.99/month) for the full question bank.",
};

/** Plans — design handoff screen 3. */
export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Plans"
      title="Free to practise."
      intro="Try 5 sample questions in every programme for free, no account needed. Subscribe for the full question bank, full-length exam papers and progress tracking."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Practise as a guest", href: routes.guestPractice }}
    >
      <Plans />
      <PlanComparison />
      <BillingFaq />
    </MarketingPage>
  );
}
