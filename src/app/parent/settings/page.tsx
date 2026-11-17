import type { Metadata } from "next";

import { ParentShell } from "@/features/parent-dashboard";
import { loadArchivedChildIds } from "@/features/parent-dashboard/child-access";
import { DangerZone } from "@/features/parent-dashboard/components/DangerZone";
import { ParentProfileForm } from "@/features/parent-dashboard/components/ParentProfileForm";
import { loadParentDashboard } from "@/features/parent-dashboard/queries";

export const metadata: Metadata = {
  title: "Account settings",
  robots: { index: false, follow: false },
};

// Behind the /parent layout's role gate; per-user, never prerendered.
export const dynamic = "force-dynamic";

export default async function ParentSettingsPage() {
  const data = await loadParentDashboard();
  const childIds = data.status === "error" ? [] : data.children.map((child) => child.profile.id);
  const paused = await loadArchivedChildIds(childIds);

  return (
    <ParentShell active="/parent/settings">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
            Account settings
          </h1>
          <p className="mt-2 text-sm font-semibold text-muted">
            Update your details, and pause access or close your account.
          </p>
        </div>
        <ParentProfileForm />
        <DangerZone childCount={childIds.length} pausedCount={paused.size} />
      </div>
    </ParentShell>
  );
}
