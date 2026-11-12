import type { Metadata } from "next";

import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import { getPreviewAdminData } from "@/features/admin/adapters/preview-adapter";
import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";
import { AdminWorkspace } from "@/features/admin/components/AdminWorkspace";
import type { AdminView } from "@/features/admin/types";

export const metadata: Metadata = { title: "Admin Workspace" };

interface AdminHomePageProps {
  searchParams?: Promise<{ view?: string }>;
}

/**
 * Admin Home Page.
 *
 * Implements the redesigned Admin Workspace shell (superseding legacy AdminShell),
 * providing persistent navigation out to specialized tools:
 * - Draft Review: href="/admin/review"
 * - Platform Analytics: href="/admin/analytics"
 * - Content Intelligence: href="/admin/intelligence"
 * - Operational Jobs: href="/admin/operations"
 *
 * In preview mode (ADMIN_WORKSPACE_PREVIEW=1 and loopback), renders the
 * full interactive Admin Workspace artboards with synthetic fixtures.
 *
 * In authenticated DEV mode, renders the redesigned Admin Workspace
 * connected to authentic DEV Supabase data and published manifests,
 * with honest unavailable states for unbuilt services.
 */
export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const params = await searchParams;
  const initialView = (params?.view as AdminView) ?? "overview";

  if (await isAdminPreviewEnabled()) {
    const previewData = getPreviewAdminData();
    return <AdminWorkspace data={previewData} initialView={initialView} />;
  }

  const devData = await getAuthenticatedDevAdminData();
  return <AdminWorkspace data={devData} initialView={initialView} />;
}
