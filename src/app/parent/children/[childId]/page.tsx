import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui";
import {
  ChildProfileView,
  ParentShell,
  PREVIEW_CHILDREN,
  type ChildProfileDetails,
  type SiblingLink,
} from "@/features/parent-dashboard";
import { loadArchivedChildIds, loadChildLoginCode } from "@/features/parent-dashboard/child-access";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { isSupabaseConfigured, SUPABASE_NOT_CONFIGURED_MESSAGE } from "@/lib/supabase/config";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

export const metadata: Metadata = {
  title: "Child Profile | MindMosaic Parents",
  description: "View and edit student credentials, year level, avatar colour, and login status.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface ChildProfilePageProps {
  params: Promise<{ childId: string }>;
}

export default async function ChildProfilePage({ params }: ChildProfilePageProps) {
  const { childId } = await params;
  const years = yearLevelsWithGatedCoverage();

  // Local loopback preview demonstration mode
  if (!isSupabaseConfigured) {
    if (await isParentPreviewEnabled()) {
      const previewChild = PREVIEW_CHILDREN.find(
        (c) => c.id === childId || c.firstName.toLowerCase() === childId.toLowerCase(),
      ) ?? PREVIEW_CHILDREN[0];

      if (!previewChild) {
        notFound();
      }

      const childDetails: ChildProfileDetails = {
        id: previewChild.id,
        displayName: `${previewChild.firstName} ${previewChild.lastName ?? ""}`.trim(),
        yearLevel: previewChild.yearLevel,
        loginCode: previewChild.loginCode,
        avatarColor: previewChild.avatarColor,
        archived: previewChild.status === "paused",
        finishedPapersCount: previewChild.finishedPapersCount,
        lastSignedIn: "Tuesday, 4:14 pm",
      };

      const siblings: SiblingLink[] = PREVIEW_CHILDREN.map((c) => ({
        id: c.id,
        displayName: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        yearLevel: c.yearLevel,
      }));

      return (
        <ParentShell active="/parent/children">
          <div className="space-y-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 text-xs font-medium text-amber-900">
              <strong className="font-bold">Preview Demonstration:</strong> Showing sample child profile data for {previewChild.firstName}. No live database connection is active.
            </div>
            <ChildProfileView
              child={childDetails}
              siblings={siblings}
              availableYearLevels={years}
              isLocalPreview={true}
            />
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
  const data = await loadParentDashboard();
  if (data.status === "error") {
    return (
      <ParentShell active="/parent/children">
        <ErrorState
          title="We couldn't load this child's profile"
          description="Something went wrong while retrieving family records. Please refresh to try again."
        />
      </ParentShell>
    );
  }

  const childRecord = data.children.find((c) => c.profile.id === childId);
  if (!childRecord) {
    notFound();
  }

  const [archivedIds, realLoginCode] = await Promise.all([
    loadArchivedChildIds([childId]),
    loadChildLoginCode(childId),
  ]);
  const isArchived = archivedIds.has(childId);

  const childDetails: ChildProfileDetails = {
    id: childRecord.profile.id,
    displayName: childRecord.profile.displayName?.trim() || "Your child",
    yearLevel: childRecord.profile.yearLevel,
    loginCode: realLoginCode ?? "—",
    avatarColor: "purple",
    archived: isArchived,
    finishedPapersCount: childRecord.attempts.length,
    lastSignedIn: null,
  };

  const siblings: SiblingLink[] = data.children.map((c) => ({
    id: c.profile.id,
    displayName: c.profile.displayName?.trim() || "Child",
    yearLevel: c.profile.yearLevel,
  }));

  return (
    <ParentShell active="/parent/children">
      <ChildProfileView
        child={childDetails}
        siblings={siblings}
        availableYearLevels={years}
        isLocalPreview={false}
      />
    </ParentShell>
  );
}
