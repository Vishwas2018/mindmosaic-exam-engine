import type { Metadata } from "next";

import { AdminWritingView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminWriting } from "@/server/admin-governance-data";
import { getAdminOverviewData } from "@/server/admin-library-data";

export const metadata: Metadata = { title: "Writing review" };
export const dynamic = "force-dynamic";

export default async function AdminWritingPage() {
  const { prompts, problems } = getAdminWriting();
  const { writing } = getAdminOverviewData();
  return <AdminShellPage active="writing" content={<AdminWritingView prompts={prompts} problems={problems} marking={writing} />} />;
}
