import type { Metadata } from "next";

import { AdminSupportView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminOverviewData } from "@/server/admin-library-data";

export const metadata: Metadata = { title: "Support" };
export const dynamic = "force-dynamic";

export default async function AdminSupportPage() {
  return <AdminShellPage active="support" content={<AdminSupportView availability={getAdminOverviewData().reports} />} />;
}
