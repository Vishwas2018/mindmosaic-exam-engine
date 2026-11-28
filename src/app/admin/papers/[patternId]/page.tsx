import type { Metadata } from "next";
import Link from "next/link";

import { AdminPaperDetailView } from "@/features/admin/components/AdminGovernanceViews";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminPaper } from "@/server/admin-governance-data";

export const metadata: Metadata = { title: "Paper review" };
export const dynamic = "force-dynamic";

export default async function AdminPaperDetailPage({ params }: { params: Promise<{ patternId: string }> }) {
  const paper = getAdminPaper(decodeURIComponent((await params).patternId));
  /* An in-page state rather than notFound(): see src/tests/unit/route-loading-boundaries.test.ts. */
  const content = paper ? (
    <AdminPaperDetailView paper={paper} />
  ) : (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-[#1f1b24]">Paper not found</h1>
      <p className="text-sm text-[#6e6779]">No practice paper has that id.</p>
      <Link href="/admin/papers" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
        Back to paper review
      </Link>
    </div>
  );
  return <AdminShellPage active="paper" content={content} />;
}
