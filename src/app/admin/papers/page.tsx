import type { Metadata } from "next";

import { AdminPaperListView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminPapers } from "@/server/admin-governance-data";

export const metadata: Metadata = { title: "Paper review" };
export const dynamic = "force-dynamic";

export default async function AdminPapersPage() {
  return <AdminShellPage active="paper" content={<AdminPaperListView papers={getAdminPapers()} />} />;
}
