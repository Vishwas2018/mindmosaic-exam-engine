import type { Metadata } from "next";
import { ParentShell, buildChildSummary } from "@/features/parent-dashboard";
import { ChildrenHub } from "@/features/parent-dashboard/components/ChildrenHub";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { loadArchivedChildIds } from "@/features/parent-dashboard/child-access";
import { PREVIEW_CHILDREN, type PreviewChild } from "@/features/parent-dashboard/fixtures";

export const metadata: Metadata = {
  title: "Children | MindMosaic Parent",
  description: "Manage your children's profiles, sign-in access codes, and paid plan places.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentChildrenPage() {
  const data = await loadParentDashboard();

  let initialChildren: PreviewChild[] = PREVIEW_CHILDREN;

  if (data.status === "ready" && data.children && data.children.length > 0) {
    const archivedIds = await loadArchivedChildIds(data.children.map((c) => c.profile.id));
    initialChildren = data.children.map((child, idx) => {
      const colors: PreviewChild["avatarColor"][] = ["purple", "ember", "teal", "coral"];
      const summary = buildChildSummary(child.profile, child.attempts);
      const totalEarned = summary.subjects.reduce((sum, s) => sum + s.marksEarned, 0);
      const totalAvailable = summary.subjects.reduce((sum, s) => sum + s.marksAvailable, 0);

      return {
        id: child.profile.id,
        firstName: child.profile.displayName?.trim() || "Child",
        lastName: "",
        yearLevel: child.profile.yearLevel ?? 3,
        curriculum: "Victorian Curriculum v2.0",
        loginCode: "K7XJ-2P9R",
        pin: "482901",
        status: archivedIds.has(child.profile.id) ? "paused" : "active",
        avatarColor: colors[idx % colors.length],
        finishedPapersCount: summary.attemptCount,
        totalMarksEarned: totalEarned,
        totalMarksAvailable: totalAvailable,
      };
    });
  }

  const isLive = Boolean(data.status === "ready" && data.children && data.children.length > 0);

  return (
    <ParentShell active="/parent/children">
      <ChildrenHub initialChildren={initialChildren} isLiveAccount={isLive} />
    </ParentShell>
  );
}
