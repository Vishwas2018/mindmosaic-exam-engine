import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState, ErrorState, buttonClasses } from "@/components/ui";
import {
  AddChildCard,
  BillingPanel,
  CheckoutStatusToast,
  FamilyOverview,
  ParentShell,
  PREVIEW_FAMILY_OVERVIEW_SUMMARIES,
  buildChildSummary,
} from "@/features/parent-dashboard";
import { loadArchivedChildIds } from "@/features/parent-dashboard/child-access";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

export const metadata: Metadata = {
  title: "Family Overview | MindMosaic Parents",
  description: "Weekly practice summary, subject marks, and progress across all your children.",
  robots: { index: false, follow: false },
};

/*
 * Per-user data behind auth cookies: never prerender.
 */
export const dynamic = "force-dynamic";

/**
 * Server-rendered Family Overview page (/parent).
 *
 * Implements artboards b5–b10:
 * - Decision P2: Heading is "Family Overview"; nav item is "This week".
 * - Decision P3 & D-P4: Uses MarksMeter (no % or bands) and ClaimWithEvidence (>=2 papers / 8 marks floor).
 * - Partial failure honesty: Driven by unreadableRowCount > 0.
 * - Performance bands: strictly omitted from parent render path.
 */
export default async function ParentHomePage({
  searchParams,
}: {
  searchParams?: Promise<{ state?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const forcedState =
    resolvedParams.state === "loading" ||
    resolvedParams.state === "error" ||
    resolvedParams.state === "offline"
      ? resolvedParams.state
      : undefined;

  const years = yearLevelsWithGatedCoverage();
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      return (
        <ParentShell active="/parent">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample family overview data (Aisha &amp; Kabir) in local preview mode. No database connection is active.
            </div>
            <FamilyOverview
              summaries={PREVIEW_FAMILY_OVERVIEW_SUMMARIES}
              parentName="Priya"
              forcedState={forcedState}
            />
          </div>
        </ParentShell>
      );
    }

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
  const archivedIds = await loadArchivedChildIds(data.children.map((child) => child.profile.id));
  const summaries = data.children.map((child) => ({
    ...buildChildSummary(child.profile, child.attempts, now),
    archived: archivedIds.has(child.profile.id),
  }));

  return (
    <ParentShell active="/parent">
      <div className="space-y-8">
        <CheckoutStatusToast />
        <FamilyOverview
          summaries={summaries}
          parentName={data.parentName}
          forcedState={forcedState}
        />
        <AddChildCard availableYearLevels={years} />
      </div>
    </ParentShell>
  );
}
