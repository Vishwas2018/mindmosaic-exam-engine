import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ParentShell } from "@/features/parent-dashboard";
import { VihaanParentDashboard } from "@/features/scholarship-prep/components/VihaanParentDashboard";
import { isVihaanScholarshipPrepEnabledFor } from "@/features/scholarship-prep/lib/vihaan-scholarship-prep";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep — Parent Dashboard",
  description: "View Vihaan's scholarship preparation progress, subject performance, and weekly recommendations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Same gate as the student pilot pages: the flag must be on for this deployment AND this account allowed. */
export default async function ParentVihaanDashboardPage() {
  if (!isSupabaseConfigured) redirect("/parent");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/parent/vihaan");
  if (!isVihaanScholarshipPrepEnabledFor(user.id)) redirect("/parent");

  return (
    <ParentShell active="/parent">
      <VihaanParentDashboard />
    </ParentShell>
  );
}
