import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentAccountView } from "@/features/parent-dashboard/components/ParentAccountView";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { LegacyParentAccountPage } from "./legacy-page";

export const metadata: Metadata = {
  title: "Account & Settings | MindMosaic Parent",
  description: "Manage your guardian account details, subscription, and family access.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentAccountPage() {
  if (!(await isParentPreviewEnabled())) return await LegacyParentAccountPage();

  // Preview uses sample details only; no auth client is created.
  return (
    <ParentShell active="/parent/account">
      <ParentAccountView />
    </ParentShell>
  );
}
