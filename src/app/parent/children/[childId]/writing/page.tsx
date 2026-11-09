import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ParentShell } from "@/features/parent-dashboard";
import { isParentPreviewEnabled } from "@/features/parent-dashboard/preview-mode";
import { PREVIEW_CHILDREN } from "@/features/parent-dashboard/fixtures";
import { LegacyChildWritingPage } from "./legacy-page";

export const metadata: Metadata = {
  title: "Child Writing Practice | MindMosaic",
  description: "Mark your child's written responses against the official rubric.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ChildWritingPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  // Real writing history and marking require an authenticated parent linked to
  // this child, enforced by the existing page. Fixture children never reach it.
  if (!(await isParentPreviewEnabled())) return await LegacyChildWritingPage({ params });

  const { childId } = await params;
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) ?? PREVIEW_CHILDREN[0];

  return (
    <ParentShell active="/parent/children">
      <div className="space-y-6">
        <div>
          <Link
            href="/parent/children"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-royal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Children
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            {child.firstName}&apos;s Writing Practice
          </h1>
          <p className="mt-1 text-sm text-muted">
            Score your child&apos;s writing against the standardized rubric. MindMosaic does not
            generate automated grades for open writing.
          </p>
        </div>

        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950"
        >
          <span className="mr-2 rounded bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-extrabold uppercase text-amber-900">
            Preview Demonstration
          </span>
          Local design preview with no database. Marking and handed-in writing are real features
          on the signed-in page; they are not available here and nothing can be recorded.
        </div>

        <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-ink">Completed on paper?</h2>
          <p className="mt-1 text-sm text-muted">
            Score the sheet directly using the rubric. There is no need to type the
            student&apos;s writing into the computer.
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-3 inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 px-4 text-xs font-extrabold text-zinc-600"
          >
            Mark a paper response (unavailable in preview)
          </button>
        </div>

        <section aria-labelledby="writing-history-heading">
          <h2 id="writing-history-heading" className="text-lg font-extrabold text-ink">
            Handed-in Responses
          </h2>
          <p className="mt-3 rounded-2xl border border-royal/10 bg-white p-5 text-sm text-muted shadow-sm">
            {child.firstName} hasn&apos;t handed in any writing yet. (Sample empty state.)
          </p>
        </section>
      </div>
    </ParentShell>
  );
}
