import type { Metadata } from "next";

import { BillingFaq } from "@/features/landing/components/BillingFaq";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { PlanComparison } from "@/features/landing/components/PlanComparison";
import { Plans } from "@/features/landing/components/Plans";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Guest practice is free and never gated behind a subscription. The Family plan's price is still to be confirmed — see what each plan includes and register interest.",
};

/** Plans — design handoff screen 3. */
export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Plans"
      title="Free to practise."
      intro="Guest practice needs no account and is never gated behind a subscription. The Family plan is still being finalised, so it can't be bought yet."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Practise as a guest", href: routes.guestPractice }}
    >
      <Plans />
      <PlanComparison />
      <BillingFaq />
    </MarketingPage>
  );
}
