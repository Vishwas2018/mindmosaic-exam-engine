import type { Metadata } from "next";

import { parseActivityQuery, queryActivity } from "@/features/admin/activity-query";
import { AdminActivityView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminActivityEvents } from "@/server/admin-governance-data";

export const metadata: Metadata = { title: "Activity history" };
export const dynamic = "force-dynamic";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseActivityQuery(await searchParams);
  const result = queryActivity(getAdminActivityEvents(), query);
  return <AdminShellPage active="activity" content={<AdminActivityView query={query} result={result} />} />;
}
