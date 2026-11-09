import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentSetupWizard } from "@/features/parent-dashboard/components/ParentSetupWizard";
import { requireParentPreview } from "@/features/parent-dashboard/preview-mode";

export const metadata: Metadata = {
  title: "Welcome & Family Setup | MindMosaic",
  description: "Set up your children and access details on the MindMosaic Parent Portal.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentSetupPage() {
  // Fixture-only screen: 404 outside explicit local preview. Never creates a child.
  await requireParentPreview();

  return (
    <ParentShell active="/parent/children">
      <ParentSetupWizard />
    </ParentShell>
  );
}
