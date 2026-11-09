import type { Metadata } from "next";
import { ParentShell, buildChildSummary } from "@/features/parent-dashboard";
import { ChildProfileDetail } from "@/features/parent-dashboard/components/ChildProfileDetail";
import { PREVIEW_CHILDREN, type PreviewChild } from "@/features/parent-dashboard/fixtures";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { loadArchivedChildIds } from "@/features/parent-dashboard/child-access";

interface Props {
  params: Promise<{ childId: string }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { childId } = await params;
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) || PREVIEW_CHILDREN[0];
  return {
    title: `${child.firstName}'s Profile | MindMosaic Parent`,
    robots: { index: false, follow: false },
  };
}

export default async function ChildProfilePage({ params }: Props) {
  const { childId } = await params;

  let child: PreviewChild | undefined = PREVIEW_CHILDREN.find((c) => c.id === childId);

  let isLive = false;

  // If not found in preview list, check if user has actual database profiles
  if (!child) {
    const data = await loadParentDashboard();
    if (data.status === "ready") {
      const match = data.children.find((c) => c.profile.id === childId);
      if (match) {
        isLive = true;
        const archivedIds = await loadArchivedChildIds([match.profile.id]);
        const summary = buildChildSummary(match.profile, match.attempts);
        const totalEarned = summary.subjects.reduce((sum, s) => sum + s.marksEarned, 0);
        const totalAvailable = summary.subjects.reduce((sum, s) => sum + s.marksAvailable, 0);

        child = {
          id: match.profile.id,
          firstName: match.profile.displayName?.trim() || "Child",
          lastName: "",
          yearLevel: match.profile.yearLevel ?? 3,
          curriculum: "Victorian Curriculum v2.0",
          loginCode: "K7XJ-2P9R",
          pin: "482901",
          status: archivedIds.has(match.profile.id) ? "paused" : "active",
          avatarColor: "purple",
          finishedPapersCount: summary.attemptCount,
          totalMarksEarned: totalEarned,
          totalMarksAvailable: totalAvailable,
        };
      }
    }
  }

  // If still not matched, default to Aisha as preview
  if (!child) {
    child = PREVIEW_CHILDREN[0];
  }

  return (
    <ParentShell active="/parent/children">
      <ChildProfileDetail child={child} isLiveAccount={isLive} />
    </ParentShell>
  );
}
