import type { Metadata } from "next";

import { ErrorState } from "@/components/ui";
import {
  AddChildCard,
  ChildrenManager,
  ParentShell,
  PREVIEW_CHILDREN,
  PREVIEW_FAMILY_PLAN,
  type ChildListItem,
} from "@/features/parent-dashboard";
import { loadArchivedChildIds, loadChildLoginCode } from "@/features/parent-dashboard/child-access";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { getMySubscription } from "@/lib/billing/subscription";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

export const metadata: Metadata = {
  title: "Children | MindMosaic Parents",
  description: "Profiles, sign-in details and paid places for your family.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Children Management Page (/parent/children):
 *
 * Implements Artboards b11–b14:
 * - Paid places vs profiles (Decision P5).
 * - Child credentials and login codes.
 * - Reversible pausing / archive lifecycle (Decision P6).
 */
export default async function ParentChildrenPage() {
  const years = yearLevelsWithGatedCoverage();

  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      const previewChildren: ChildListItem[] = PREVIEW_CHILDREN.map((c) => ({
        id: c.id,
        displayName: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        yearLevel: c.yearLevel,
        sessionCount: c.finishedPapersCount,
        loginCode: c.loginCode,
        avatarColor: c.avatarColor,
        archived: c.status === "paused",
      }));

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-8">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample family children and credentials. No live database connection is active.
            </div>

            <div>
              <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
                Children
              </h1>
              <p className="mt-1 text-sm font-semibold text-muted">
                Profiles, sign-in details and paid places.
              </p>
            </div>

            <ChildrenManager
              initialChildren={previewChildren}
              availableYearLevels={years}
              paidPlacesUsed={PREVIEW_FAMILY_PLAN.activePlaces}
              totalPaidPlaces={PREVIEW_FAMILY_PLAN.maxPlaces}
              planName={PREVIEW_FAMILY_PLAN.planName}
            />

            <div id="add-child">
              <AddChildCard availableYearLevels={years} />
            </div>
          </div>
        </ParentShell>
      );
    }

    return (
      <ParentShell active="/parent/children">
        <ErrorState
          title="Supabase Not Configured"
          description={SUPABASE_NOT_CONFIGURED_MESSAGE}
        />
      </ParentShell>
    );
  }

  // Authenticated real Supabase data loading
  const [data, subResult] = await Promise.all([
    loadParentDashboard(),
    getMySubscription(),
  ]);

  if (data.status === "error") {
    return (
      <ParentShell active="/parent/children">
        <ErrorState
          title="We couldn't load your children"
          description="Something went wrong while retrieving family records. Please refresh to try again."
        />
      </ParentShell>
    );
  }

  const childIds = data.children.map((child) => child.profile.id);
  const [archivedIds, loginCodes] = await Promise.all([
    loadArchivedChildIds(childIds),
    Promise.all(childIds.map((id) => loadChildLoginCode(id))),
  ]);
  const loginCodeMap = new Map(childIds.map((id, index) => [id, loginCodes[index]]));

  const children: ChildListItem[] = data.children.map((child) => ({
    id: child.profile.id,
    displayName: child.profile.displayName?.trim() || "Your child",
    yearLevel: child.profile.yearLevel,
    sessionCount: child.attempts.length,
    loginCode: loginCodeMap.get(child.profile.id) ?? "—",
    archived: archivedIds.has(child.profile.id),
  }));

  const activeChildrenCount = children.filter((c) => !c.archived).length;
  const subscription = subResult.status === "ready" ? subResult.subscription : null;
  const totalPaidPlaces = subscription?.seats ?? Math.max(3, activeChildrenCount);
  const planName = subscription?.plan === "family_annual" ? "Family Annual plan" : "Family plan";

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Children
          </h1>
          <p className="mt-1 text-sm font-semibold text-muted">
            Profiles, sign-in details and paid places.
          </p>
        </div>

        <ChildrenManager
          initialChildren={children}
          availableYearLevels={years}
          paidPlacesUsed={activeChildrenCount}
          totalPaidPlaces={totalPaidPlaces}
          planName={planName}
        />

        <div id="add-child">
          <AddChildCard availableYearLevels={years} />
        </div>
      </div>
    </ParentShell>
  );
}
