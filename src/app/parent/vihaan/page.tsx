import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ParentShell } from "@/features/parent-dashboard";
import { VihaanParentDashboard } from "@/features/scholarship-prep/components/VihaanParentDashboard";
import {
  isVihaanParentAllowedFor,
  resolveAllowlistedVihaanChildId,
} from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getVihaanApprovedBank, loadVihaanParentOutcomes } from "@/server/vihaan-practice";
import { loadWritingHistory } from "@/server/writing/queries";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep — Parent Dashboard",
  description:
    "View Vihaan's scholarship preparation progress, subject performance, writing marking, and weekly recommendations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Same gate as the student pilot pages: the flag must be on AND this linked parent account allowed. */
export default async function ParentVihaanDashboardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  if (!isSupabaseConfigured) redirect("/parent");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/parent/vihaan");

  const { data: links, error: linksError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", user.id);
  if (linksError) redirect("/parent");

  const linkedChildIds = (links ?? [])
    .map((link) => link.child_id)
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0);

  if (!isVihaanParentAllowedFor(user.id, linkedChildIds)) {
    redirect("/parent");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const includeSyntheticE2e = resolvedParams.e2e === "1";

  const vihaanChildId = resolveAllowlistedVihaanChildId(linkedChildIds) ?? linkedChildIds[0] ?? null;
  const outcomes = vihaanChildId
    ? await loadVihaanParentOutcomes(supabase, vihaanChildId, 200, { includeSyntheticE2e })
    : [];
  const rawWritingHistory = vihaanChildId
    ? await loadWritingHistory(supabase, { studentIds: [vihaanChildId], submittedOnly: true })
    : [];
  const writingHistory = rawWritingHistory.filter((item) => {
    const isSyntheticTask = item.attempt.taskId.startsWith("e2e-");
    return includeSyntheticE2e ? true : !isSyntheticTask;
  });

  const approvedBank = getVihaanApprovedBank(vihaanChildId);
  const writingPromptsById = Object.fromEntries(
    approvedBank
      .filter((q) => q.metadata.subject === "writing")
      .map((q) => [q.id, q.prompt]),
  );

  return (
    <ParentShell active="/parent">
      <VihaanParentDashboard
        outcomes={outcomes}
        writingHistory={writingHistory}
        writingPromptsById={writingPromptsById}
        approvedBankCount={approvedBank.length}
      />
    </ParentShell>
  );
}
