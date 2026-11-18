import type { Metadata } from "next";
import Link from "next/link";

import { ApprovalDecision } from "@/features/admin/components/ApprovalDecision";
import { AdminShellPage } from "@/features/admin/components/AdminShellPage";
import { getAdminQuestionDetail } from "@/server/admin-library-data";
import { getDraftForApproval } from "@/app/admin/review/actions";
import { getAuthenticatedDevAdminData } from "@/server/admin-workspace-data";
import { isAdminPreviewEnabled } from "@/features/admin/preview-mode";

export const metadata: Metadata = { title: "Human approval" };
export const dynamic = "force-dynamic";

const panel = "rounded-2xl border border-royal/10 bg-white p-5 shadow-xs";

/**
 * Human approval for one question. A draft in the review catalogue can be approved here (the existing server
 * action records the reviewer and the exact content hash, and does not publish). A question already in the
 * published bank carries its approval as a repository evidence record, shown read-only.
 */
export default async function AdminQuestionApprovalPage({ params }: { params: Promise<{ questionId: string }> }) {
  const questionId = decodeURIComponent((await params).questionId);
  const preview = await isAdminPreviewEnabled();
  const draft = preview ? null : await getDraftForApproval(questionId);
  const detail = getAdminQuestionDetail(questionId);
  const reviewer = preview ? "Maya Chen" : (await getAuthenticatedDevAdminData()).reviewer.name;

  let content: React.ReactNode;
  if (draft) {
    const f = draft.findings;
    content = (
      <div className="space-y-5">
        <div className={`${panel} flex flex-wrap items-center justify-between gap-3`}>
          <p className="min-w-0 break-all text-sm">
            <span className="font-mono font-semibold">{questionId}</span>{" "}
            <span className="rounded-md bg-royal/[0.06] px-2 py-0.5 font-mono text-xs">{draft.contentHash.slice(0, 8)}</span>{" "}
            <span className="text-xs text-[#6e6779]">Draft, unpublished</span>
          </p>
          <Link href="/admin/review" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
            Full review
          </Link>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <ApprovalDecision
              questionId={questionId}
              contentHash={draft.contentHash}
              reviewerName={reviewer}
              revisionLabel={draft.sourceRevision ? `revision ${draft.sourceRevision.slice(0, 7)}` : "this revision"}
              existing={draft.approval}
            />
            <section className={`${panel} bg-royal/[0.03]`} aria-labelledby="agents-found">
              <h2 id="agents-found" className="text-base font-semibold text-[#1f1b24]">
                What the agents found
              </h2>
              <p className="mt-1 text-xs text-[#6e6779]">For your information. None of this is a sign-off: a passing check never approves on your behalf.</p>
              {f ? (
                <ul className="mt-3 grid gap-1.5 text-sm text-[#1f1b24]">
                  <li><span className="font-semibold">Independent reviewer ({f.reviewer}):</span> {f.recommendation}</li>
                  {f.originality && <li><span className="font-semibold">Originality:</span> {f.originality}</li>}
                  {f.difficultyVerdict && <li><span className="font-semibold">Difficulty:</span> {f.difficultyVerdict}</li>}
                  <li><span className="font-semibold">Semantic flags:</span> {f.semanticFlags.length ? f.semanticFlags.join("; ") : "none"}</li>
                  {f.matchesCurrentRevision === false && (
                    <li className="font-semibold text-[#8a3b12]">These findings were written for an earlier revision.</li>
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-[#4a4454]">No independent review findings are on file for this draft.</p>
              )}
            </section>
          </div>
          <aside className={panel} aria-labelledby="signing">
            <h2 id="signing" className="text-base font-semibold text-[#1f1b24]">What you are signing</h2>
            <dl className="mt-3 grid gap-2 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Reviewer</dt><dd className="font-semibold">{reviewer}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Content hash</dt><dd className="font-mono">{draft.contentHash.slice(0, 8)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[#6e6779]">Programme gate</dt><dd className="font-semibold">Scholarship · enforce</dd></div>
            </dl>
            <p className="mt-3 rounded-xl bg-royal/[0.05] p-3 text-xs leading-relaxed text-[#4a4454]">
              In enforce mode only a revision with a matching approval is served. If the draft changes, this approval no
              longer applies and a new one is needed.
            </p>
          </aside>
        </div>
      </div>
    );
  } else if (detail) {
    const a = detail.approval;
    content = (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-[#1f1b24]">Human approval</h1>
        <section className={panel} role="status">
          <p className="font-mono text-sm font-semibold">{questionId}</p>
          {a ? (
            <p className="mt-2 text-sm text-[#1f1b24]">
              Approved by {a.approvedBy} on {new Date(a.approvedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}, revision{" "}
              {a.revision}, content hash <span className="break-all font-mono">{a.contentHash.slice(0, 12)}</span>.
            </p>
          ) : (
            <p className="mt-2 text-sm text-[#1f1b24]">No verified human approval is recorded for this question.</p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-[#4a4454]">
            Approvals for questions in the published bank are recorded as evidence records in the repository, reviewed
            like any other change, so they cannot be added or changed from this screen. Drafts under review are approved
            here, or in Draft review.
          </p>
        </section>
        <Link href={`/admin/questions/${encodeURIComponent(questionId)}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          Back to the question
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-[#1f1b24]">Question not found</h1>
        <p className="text-sm text-[#6e6779]">No draft or authored question has that id.</p>
        <Link href="/admin/questions" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          Back to the question library
        </Link>
      </div>
    );
  }
  return <AdminShellPage active="library" content={content} />;
}
