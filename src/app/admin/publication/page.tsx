import type { Metadata } from "next";

import { AdminPublicationView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminPublication } from "@/server/admin-governance-data";

export const metadata: Metadata = { title: "Publication" };
export const dynamic = "force-dynamic";

export default async function AdminPublicationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).check;
  const check = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100);
  return <AdminShellPage active="publication" content={<AdminPublicationView data={getAdminPublication(check)} />} />;
}
