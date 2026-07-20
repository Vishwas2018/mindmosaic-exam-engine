import type { Metadata } from "next";
import Link from "next/link";

import { ErrorState, buttonClasses } from "@/components/ui";
import { getStudentAccess } from "@/features/student/access";
import { buildEngagementSummary } from "@/features/student/engagement/achievements";
import { EngagementView } from "@/features/student/engagement/components/EngagementView";
import { fetchEngagementAttempts } from "@/features/student/engagement/fetch-engagement";
import { PortalNotConfigured } from "@/features/student/components/PortalGateStates";
import { StudentShell } from "@/features/student/components/StudentShell";

export const metadata: Metadata = {
  title: "My progress",
  description: "Streaks, achievements and milestones from your practice.",
};

/* Per-student data behind auth — never statically prerendered. */
export const dynamic = "force-dynamic";

export default async function StudentEngagementPage() {
  const access = await getStudentAccess();

  if (access.kind === "not_configured") {
    return (
      <StudentShell active="engagement">
        <PortalNotConfigured />
      </StudentShell>
    );
  }

  const result = await fetchEngagementAttempts(access.userId);
  const now = new Date();

  return (
    <StudentShell active="engagement">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-[-0.03em] text-ink">
          My progress
        </h1>
        <p className="mt-2 text-base leading-7 text-muted">
          Streaks, badges and milestones — all earned through practice.
        </p>
      </div>
      {result.ok ? (
        <EngagementView
          summary={buildEngagementSummary(result.attempts, now)}
          attempts={result.attempts}
          now={now}
        />
      ) : (
        <ErrorState
          description="We couldn't load your progress just now. Refresh the page to try again."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Go to practice
            </Link>
          }
        />
      )}
    </StudentShell>
  );
}
