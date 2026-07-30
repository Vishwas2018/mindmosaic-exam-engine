import type { Metadata } from "next";
import Link from "next/link";

import { Home } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";
import { RoleHomeLink } from "@/features/auth/components/RoleHomeLink";
import {
  FamilyPlanCard,
  InvoiceHistoryCard,
  PaymentMethodCard,
  PlanComparisonTable,
  SubscriptionOverviewCard,
} from "@/features/billing";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Billing",
  description: "Subscribe to or manage the MindMosaic Family plan.",
};

/*
 * A signed-in parent's subscription is per-user data behind auth cookies —
 * same reasoning as src/app/parent/page.tsx's own force-dynamic.
 */
export const dynamic = "force-dynamic";

function Shell({ children }: { children: React.ReactNode }) {
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
          {/*
            This page is shared by guests, students and parents, so its
            header can't be the parent shell. That left a parent who
            navigated here with no way back to /parent except the logo,
            which goes to the marketing site instead. RoleHomeLink supplies
            the right destination per role and renders nothing for guests.
          */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Back to site</span>
            </Link>
            <RoleHomeLink />
            <Badge variant="purple" className="hidden sm:inline-flex">
              Billing
            </Badge>
            <AuthNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-16">
        {children}
      </main>
    </div>
  );
}

/**
 * Reachable by anyone, signed in or not — guests must always be able to
 * keep practising for free (docs/PRIVACY_AND_BILLING_GUARDRAILS.md), so
 * this page never gates practice, it only offers an upgrade or, for a
 * signed-in parent with a subscription row already, full account
 * management (current status, payment method, invoices, cancel/undo).
 *
 * getMySubscription() returns `{ status: "error" }` for both "not signed
 * in" and "something went wrong" — there's no way to tell those apart from
 * here, so either one falls back to the marketing/subscribe view, same as
 * this page's behaviour before this batch.
 */
export default async function BillingPage() {
  const result = isSupabaseConfigured ? await getMySubscription() : { status: "error" as const };
  const subscription = result.status === "ready" ? result.subscription : null;

  if (!subscription) {
    return (
      <Shell>
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Choose the Family plan
          </h1>
          <p className="mt-3 text-base leading-7 text-muted">
            One plan for the whole family — up to 3 children, full question bank, full
            skill-level breakdowns. Guests can keep practising for free, any time.
          </p>
        </div>
        <div className="mx-auto mt-10 max-w-3xl space-y-8">
          <PlanComparisonTable />
          <FamilyPlanCard />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Billing &amp; subscription
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Manage your Family plan, payment method, and invoice history.
          </p>
        </div>
        <SubscriptionOverviewCard subscription={subscription} />
        <PaymentMethodCard />
        <InvoiceHistoryCard />
        <PlanComparisonTable />
      </div>
    </Shell>
  );
}
