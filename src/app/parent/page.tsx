import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState, buttonClasses } from "@/components/ui";
import {
  AddChildCard,
  BillingPanel,
  CheckoutStatusToast,
  ParentDashboard,
  ParentShell,
  buildChildSummary,
} from "@/features/parent-dashboard";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

export const metadata: Metadata = { title: "Parent dashboard" };

/*
 * Per-user data behind auth cookies: never prerender. Without this, a build
 * run without Supabase env vars would bake the "not configured" shell into
 * a static page and serve it even once the runtime is configured.
 */
export const dynamic = "force-dynamic";

/**
 * Server-rendered parent dashboard (mockup 03). Progress data is fetched as
 * the signed-in parent through RLS-scoped queries; summaries are computed
 * server-side and handed to the client component as plain props. The
 * add-child surface is the one write action here, and it goes through the
 * provisionChild server action rather than any client-side privilege.
 */

export default async function ParentHomePage() {
  const years = yearLevelsWithGatedCoverage();
  if (!isSupabaseConfigured) {
    return (
      <ParentShell active="/parent">
        <ErrorState
          title="Accounts aren't set up yet"
          description={SUPABASE_NOT_CONFIGURED_MESSAGE}
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      </ParentShell>
    );
  }

  const [data, subscription] = await Promise.all([
    loadParentDashboard(),
    getMySubscription(),
  ]);

  if (data.status === "error") {
    return (
      <ParentShell active="/parent">
        <ErrorState
          title="We couldn't load your dashboard"
          description="Something went wrong fetching your children's progress. Please refresh to try again."
        />
      </ParentShell>
    );
  }

  if (data.children.length === 0) {
    return (
      <ParentShell active="/parent">
        <div className="space-y-8">
          <CheckoutStatusToast />
          <BillingPanel subscription={subscription} />
          <EmptyState
            title="No children linked to your account yet"
            description="Add your child below to create their login. Once they start practising, their progress and exam results will appear here."
          />
          <AddChildCard availableYearLevels={years} />
        </div>
      </ParentShell>
    );
  }

  const now = new Date();
  const summaries = data.children.map((child) =>
    buildChildSummary(child.profile, child.attempts, now),
  );
  const hasAccess = subscription.status === "ready" && (subscription.subscription?.hasAccess ?? false);

  return (
    <ParentShell active="/parent">
      <div className="space-y-8">
        <CheckoutStatusToast />
        <ParentDashboard summaries={summaries} subscription={subscription} hasAccess={hasAccess} />
        <AddChildCard availableYearLevels={years} />
      </div>
    </ParentShell>
  );
}
