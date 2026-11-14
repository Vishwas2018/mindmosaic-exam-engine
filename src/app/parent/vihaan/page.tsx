import type { Metadata } from "next";

import { ParentShell } from "@/features/parent-dashboard";
import { VihaanParentDashboard } from "@/features/scholarship-prep/components/VihaanParentDashboard";

export const metadata: Metadata = {
  title: "Vihaan Scholarship Prep — Parent Dashboard",
  description: "View Vihaan's scholarship preparation progress, subject performance, and weekly recommendations.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ParentVihaanDashboardPage() {
  return (
    <ParentShell active="/parent">
      <VihaanParentDashboard />
    </ParentShell>
  );
}
