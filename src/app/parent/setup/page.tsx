import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentSetupWizard } from "@/features/parent-dashboard/components/ParentSetupWizard";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Welcome & Family Setup | MindMosaic",
  description: "Set up your children and access details on the MindMosaic Parent Portal.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentSetupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userEmail = user?.email || "priya.raman@example.com";
  const userMetadata = user?.user_metadata as { display_name?: string; full_name?: string } | undefined;
  const parentName = userMetadata?.display_name || userMetadata?.full_name || "Priya";

  return (
    <ParentShell active="/parent/children">
      <ParentSetupWizard initialEmail={userEmail} initialParentName={parentName} />
    </ParentShell>
  );
}
