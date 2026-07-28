import type { Metadata } from "next";

import { ErrorState } from "@/components/ui";
import {
  AddChildCard,
  ChildrenManager,
  ParentShell,
  type ChildListItem,
} from "@/features/parent-dashboard";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";

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

  const children: ChildListItem[] = data.children.map((child) => ({
    id: child.profile.id,
    displayName: child.profile.displayName?.trim() || "Your child",
    yearLevel: child.profile.yearLevel,
    sessionCount: child.attempts.length,
  }));

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Manage children
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Rename, update year level, reset a PIN, or archive a linked child.
          </p>
        </div>
        <ChildrenManager initialChildren={children} />
        <AddChildCard />
      </div>
    </ParentShell>
  );
}
