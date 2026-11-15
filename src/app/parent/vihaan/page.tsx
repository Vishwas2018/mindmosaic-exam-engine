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
import { loadVihaanParentOutcomes } from "@/server/vihaan-practice";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep — Parent Dashboard",
  description:
    "View Vihaan's scholarship preparation progress, subject performance, and weekly recommendations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Same gate as the student pilot pages: the flag must be on AND this linked parent account allowed. */
export default async function ParentVihaanDashboardPage() {
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

  const vihaanChildId = resolveAllowlistedVihaanChildId(linkedChildIds) ?? linkedChildIds[0] ?? null;
  const outcomes = vihaanChildId ? await loadVihaanParentOutcomes(supabase, vihaanChildId) : [];

  return (
    <ParentShell active="/parent">
      <VihaanParentDashboard outcomes={outcomes} />
    </ParentShell>
  );
}
