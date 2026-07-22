import type { Metadata } from "next";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";
import { FamilyPlanCard } from "@/features/billing/components/FamilyPlanCard";

export const metadata: Metadata = {
  title: "Billing",
  description: "Subscribe to the MindMosaic Family plan.",
};

/**
 * Family-plan subscribe/upgrade page. Reachable by anyone, signed in or
 * not — guests must always be able to keep practising for free
 * (docs/PRIVACY_AND_BILLING_GUARDRAILS.md), so this page never gates
 * practice, it only offers an upgrade. Auth/paywall gating on this route
 * itself is a later batch's job, not this one.
 */
export default function BillingPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="hidden sm:inline-flex">
              Billing
            </Badge>
            <AuthNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Choose the Family plan
          </h1>
          <p className="mt-3 text-base leading-7 text-muted">
            One plan for the whole family — up to 3 children, full question bank, full
            skill-level breakdowns. Guests can keep practising for free, any time.
          </p>
        </div>
        <div className="mt-10">
          <FamilyPlanCard />
        </div>
      </main>
    </div>
  );
}
