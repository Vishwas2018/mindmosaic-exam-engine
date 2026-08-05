import type { Metadata } from "next";

import { BillingFaq } from "@/features/landing/components/BillingFaq";
import { MarketingPage } from "@/features/landing/components/MarketingPage";
import { PlanComparison } from "@/features/landing/components/PlanComparison";
import { Plans } from "@/features/landing/components/Plans";
import { routes } from "@/features/landing/content";

export const metadata: Metadata = {
  title: "Plans",
  description:
    "Guest practice is free and never gated behind a subscription. See the Family plan's monthly and yearly prices, what each plan includes, and the billing terms.",
};

/**
 * Plans — design handoff screen 3. This is the page that carries pricing:
 * `showPricing` is only ever true here, because the handoff records that
 * the numbers were removed from the landing page's plans section at the
 * client's request.
 */
export default function PricingPage() {
  return (
    <MarketingPage
      eyebrow="Plans"
      title="Free to practise. Paid only for what a family adds on top."
      intro="Guest practice needs no account and is never gated behind a subscription. The Family plan is what saves progress, reports it to a parent and covers more than one child."
      primaryCta={{ label: "Start free", href: routes.startFree }}
      secondaryCta={{ label: "Practise as a guest", href: routes.guestPractice }}
    >
      <Plans showPricing />
      <PlanComparison />
      <BillingFaq />
    </MarketingPage>
  );
}
