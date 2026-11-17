import Link from "next/link";

import type { AdminQuestionDetail } from "@/server/admin-library-data";

import { StatusPill } from "./AdminLibraryView";

const card = "rounded-2xl border border-royal/10 bg-white p-5 shadow-xs";
const h2 = "text-base font-semibold text-[#1f1b24]";

/**
 * One question for a reviewer, after the Review artboards: what a child is shown, the key and explanation (admin
 * only), the metadata, and who approved which revision. It reads; it does not approve or publish. Approval is
 * recorded by the draft review tool with its tamper-evident record, not from here.
 */
export function AdminQuestionDetailView({ detail }: { detail: AdminQuestionDetail }) {
  const { question, row, approval } = detail;
  return (
    <div className="space-y-5">
      <nav aria-label="Breadcrumb" className="text-xs text-[#6e6779]">
        <Link href="/admin/questions" className="inline-flex min-h-11 items-center font-semibold text-royal hover:underline">
          Question library
        </Link>{" "}
        / <span className="font-mono">{question.id}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words font-mono text-xl font-semibold text-[#1f1b24]">{question.id}</h1>
          <p className="mt-1 text-xs text-[#6e6779]">
            {row.programmeLabel} · Year {row.yearLevel} · {row.subject} · {row.strand}
          </p>
        </div>
        <StatusPill status={row.status} served={row.served} />
      </div>
      <p>
        <Link
          href={`/admin/questions/${encodeURIComponent(question.id)}/approval`}
          className="inline-flex min-h-11 items-center rounded-xl border border-royal/15 px-4 text-sm font-semibold text-royal hover:bg-royal/5"
        >
          Human approval
        </Link>
      </p>

      <section className={card} aria-labelledby="qd-child">
        <h2 id="qd-child" className={h2}>
          What a child sees
        </h2>
        {question.stimulus && (
          <div className="mt-3 rounded-xl bg-[#fcfbf8] p-4 text-sm leading-relaxed text-[#1f1b24]">
            {question.stimulus.title && <p className="font-semibold">{question.stimulus.title}</p>}
            <p className="whitespace-pre-line">{question.stimulus.body}</p>
          </div>
        )}
        <p className="mt-3 text-sm font-medium text-[#1f1b24]">{question.prompt}</p>
        {question.options.length > 0 && (
          <ol className="mt-3 grid list-[upper-alpha] gap-1.5 pl-6 text-sm text-[#1f1b24]">
            {question.options.map((option) => (
              <li key={option.id}>{option.text}</li>
            ))}
          </ol>
        )}
        {question.visuals.length > 0 && (
          <p className="mt-3 text-xs text-[#6e6779]">
            Includes {question.visuals.length} structured visual{question.visuals.length === 1 ? "" : "s"}, drawn
            from data when a child sees it.
          </p>
        )}
      </section>

      <section className={card} aria-labelledby="qd-key">
        <h2 id="qd-key" className={h2}>
          Answer key and explanation
        </h2>
        <p className="mt-1 text-xs text-[#6e6779]">Visible to administrators only. Never sent to a child before they answer.</p>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-[#fcfbf8] p-3 text-xs text-[#1f1b24]">
          {JSON.stringify(question.answerKey, null, 2)}
        </pre>
        <p className="mt-3 text-sm leading-relaxed text-[#1f1b24]">{question.explanation}</p>
      </section>

      <div className="grid items-start gap-5 md:grid-cols-2">
        <section className={card} aria-labelledby="qd-approval">
          <h2 id="qd-approval" className={h2}>
            Human approval
          </h2>
          {approval ? (
            <dl className="mt-3 grid gap-2 text-xs">
              <div>
                <dt className="font-semibold text-[#6e6779]">Approved by</dt>
                <dd className="text-[#1f1b24]">{approval.approvedBy}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#6e6779]">Approved at</dt>
                <dd className="text-[#1f1b24]">
                  {new Date(approval.approvedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-[#6e6779]">Revision</dt>
                <dd className="text-[#1f1b24]">{approval.revision}</dd>
              </div>
              <div>
                <dt className="font-semibold text-[#6e6779]">Content hash</dt>
                <dd className="break-all font-mono text-[#1f1b24]">{approval.contentHash}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-[#4a4454]">
              No verified human approval is recorded for this question. Approval is recorded through{" "}
              <Link href="/admin/review" className="font-semibold text-royal hover:underline">
                Draft review
              </Link>
              , against the exact revision.
            </p>
          )}
        </section>

        <section className={card} aria-labelledby="qd-meta">
          <h2 id="qd-meta" className={h2}>
            Details
          </h2>
          <dl className="mt-3 grid gap-2 text-xs">
            <div>
              <dt className="font-semibold text-[#6e6779]">Type</dt>
              <dd className="text-[#1f1b24]">{question.type.replace(/_/g, " ")}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#6e6779]">Skill</dt>
              <dd className="text-[#1f1b24]">{question.metadata.skill ?? "Not recorded"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-[#6e6779]">Origin</dt>
              <dd className="text-[#1f1b24]">{question.origin.replace(/_/g, " ")}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
