import type { ReactNode } from "react";

import { getPreviewAdminData } from "@/features/admin/adapters/preview-adapter";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import type { AdminView } from "@/features/admin/types";
import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";

import { AdminWorkspace } from "./AdminWorkspace";

/**
 * The admin shell around a server-rendered page. The role gate runs in the admin layout and again in the data
 * adapter; in local preview mode (loopback, Supabase unconfigured) it uses the synthetic shell data.
 */
export async function AdminShellPage({ active, content }: { active: AdminView; content: ReactNode }) {
  const data = (await isAdminPreviewEnabled()) ? getPreviewAdminData() : await getAuthenticatedDevAdminData();
  return <AdminWorkspace data={data} activeKey={active} libraryContent={content} />;
}
