import type { Metadata } from "next";
import Link from "next/link";

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
  const data = (await isAdminPreviewEnabled()) ? getPreviewAdminData() : await getAuthenticatedDevAdminData();
  /* An in-page state rather than notFound(): a loading boundary above this segment would stream a 200 for it anyway. */
  const content = detail ? (
    <AdminQuestionDetailView detail={detail} />
  ) : (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-[#1f1b24]">Question not found</h1>
      <p className="text-sm text-[#6e6779]">No authored question has that id.</p>
      <Link href="/admin/questions" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
        Back to the question library
      </Link>
    </div>
  );
  return <AdminWorkspace data={data} libraryContent={content} />;
}
