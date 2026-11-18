import type { Metadata } from "next";

import { getPreviewAdminData } from "@/features/admin/adapters/preview-adapter";
import { AdminLibraryView } from "@/features/admin/components/AdminLibraryView";
import { AdminWorkspace } from "@/features/admin/components/AdminWorkspace";
import { parseLibraryQuery, queryLibrary } from "@/features/admin/library-query";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import { getAdminLibraryRows } from "@/server/admin-library-data";
import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";

export const metadata: Metadata = { title: "Question library" };
export const dynamic = "force-dynamic";

/**
 * Question library. The role gate runs in the admin layout; the data adapter checks the role again. The list is
 * read from the authored bank and the verified approval records, and filtered by the URL.
 */
export default async function AdminQuestionLibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseLibraryQuery(await searchParams);
  const result = queryLibrary(getAdminLibraryRows(), query);
  const data = (await isAdminPreviewEnabled()) ? getPreviewAdminData() : await getAuthenticatedDevAdminData();
  return <AdminWorkspace data={data} libraryContent={<AdminLibraryView query={query} result={result} />} />;
}
