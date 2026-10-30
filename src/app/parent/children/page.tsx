import type { Metadata } from "next";

import { ErrorState } from "@/components/ui";
import {
  AddChildCard,
  ChildrenManager,
  ParentShell,
  type ChildListItem,
} from "@/features/parent-dashboard";
import { loadArchivedChildIds } from "@/features/parent-dashboard/child-access";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";
import { yearLevelsWithGatedCoverage } from "@/features/taxonomy/coverage";

export const metadata: Metadata = {
  title: "Manage children",
  robots: { index: false, follow: false },
};

// Same reasoning as src/app/parent/page.tsx: per-user data behind auth
// cookies must never be prerendered.
export const dynamic = "force-dynamic";

/**
 * Screen 16: list every linked child with a session count, and let a
 * parent rename / change year level / reset PIN / archive one. Reuses
 * loadParentDashboard() (src/features/parent-dashboard/queries.ts) rather
 * than a second query — it already returns each child's profile plus every
 * readable attempt row, and attempts.length is exactly the session count
 * this screen needs.
 */
export default async function ParentChildrenPage() {
  const years = yearLevelsWithGatedCoverage();
  const data = await loadParentDashboard();

  if (data.status === "error") {
    return (
      <ParentShell active="/parent/children">
        <ErrorState
          title="We couldn't load your children"
          description="Something went wrong. Please refresh to try again."
        />
      </ParentShell>
    );
  }

  const archivedIds = await loadArchivedChildIds(data.children.map((child) => child.profile.id));
  const children: ChildListItem[] = data.children.map((child) => ({
    id: child.profile.id,
    displayName: child.profile.displayName?.trim() || "Your child",
    yearLevel: child.profile.yearLevel,
    sessionCount: child.attempts.length,
    archived: archivedIds.has(child.profile.id),
  }));

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Manage children
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Rename, update year level, reset a PIN, or archive (pause sign-in for) a linked child. Archived children keep their results and can be restored.
          </p>
        </div>
        <ChildrenManager initialChildren={children} availableYearLevels={years} />
        <AddChildCard availableYearLevels={years} />
      </div>
    </ParentShell>
  );
}
