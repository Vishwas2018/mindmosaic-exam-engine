import type { Metadata } from "next";
import { ParentShell } from "@/features/parent-dashboard";
import { ParentHelpView } from "@/features/parent-dashboard/components/ParentHelpView";

export const metadata: Metadata = {
  title: "Help Centre | MindMosaic Parent",
  description: "Curated guides, sign-in assistance, and direct support contact for parents.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ParentHelpPage() {
  return (
    <ParentShell active="/parent/account">
      <ParentHelpView />
    </ParentShell>
  );
}
