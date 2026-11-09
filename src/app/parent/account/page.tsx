import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentAccountView } from "@/features/parent-dashboard/components/ParentAccountView";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account & Settings | MindMosaic Parent",
  description: "Manage your guardian account details, subscription, and family access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "priya.raman@example.com";
  const userMetadata = user?.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const displayName = userMetadata?.display_name || userMetadata?.full_name || "Priya Raman";

  return (
    <ParentShell active="/parent/account">
      <ParentAccountView initialEmail={userEmail} initialName={displayName} />
    </ParentShell>
  );
}
