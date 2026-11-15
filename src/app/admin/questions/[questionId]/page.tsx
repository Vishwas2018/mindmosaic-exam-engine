import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPreviewAdminData } from "@/features/admin/adapters/preview-adapter";
import { AdminQuestionDetailView } from "@/features/admin/components/AdminQuestionDetailView";
import { AdminWorkspace } from "@/features/admin/components/AdminWorkspace";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";
import { getAdminQuestionDetail } from "@/server/admin-library-data";
import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";

export const metadata: Metadata = { title: "Question review" };
export const dynamic = "force-dynamic";

export default async function AdminQuestionDetailPage({ params }: { params: Promise<{ questionId: string }> }) {
  const { questionId } = await params;
  const detail = getAdminQuestionDetail(decodeURIComponent(questionId));
  if (!detail) notFound();
  const data = (await isAdminPreviewEnabled()) ? getPreviewAdminData() : await getAuthenticatedDevAdminData();
  return <AdminWorkspace data={data} libraryContent={<AdminQuestionDetailView detail={detail} />} />;
}
