"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { approveDraft } from "@/app/admin/review/actions";

const CHECKS = [
  ["correctness", "I checked the answer key and the question is correct."],
  ["originality", "I checked the question is original, not copied from any official or commercial source."],
  ["ageAppropriateness", "I checked it is age-appropriate and any difficulty concern is resolved."],
] as const;

type CheckKey = (typeof CHECKS)[number][0];

/**
 * The decision panel from the Human approval artboard. Only "Approve" is recorded today: it writes the reviewer's
 * identity and the exact content hash together through the existing server action, and does not publish.
 * "Request changes" and "Reject" have nowhere to be stored yet, so they are shown as unavailable rather than
 * pretending to work.
 */
export function ApprovalDecision({
  questionId,
  contentHash,
  reviewerName,
  revisionLabel,
  existing,
}: {
  questionId: string;
  contentHash: string;
  reviewerName: string;
  revisionLabel: string;
  existing?: { approvedBy: string; approvedAt: string };
}) {
  const router = useRouter();
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    correctness: false,
    originality: false,
    ageAppropriateness: false,
  });
  const [recorded, setRecorded] = useState(existing ?? null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const short = contentHash.slice(0, 8);
  const allChecked = Object.values(checks).every(Boolean);

  if (recorded) {
    return (
      <section className="rounded-2xl border border-teal-600/20 bg-teal-50 p-6" aria-labelledby="decision-title" role="status">
        <h2 id="decision-title" className="text-base font-semibold text-teal-900">
          Approval recorded
        </h2>
        <p className="mt-1 text-sm text-teal-900">
          {recorded.approvedBy} approved {revisionLabel} (<span className="font-mono">{short}</span>) on{" "}
          {new Date(recorded.approvedAt).toLocaleString("en-AU", { timeZone: "Australia/Sydney" })}.
        </p>
        <p className="mt-2 text-xs text-teal-900">This does not publish. Publication is a separate, later step.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs" aria-labelledby="decision-title">
      <h2 id="decision-title" className="text-base font-semibold text-[#1f1b24]">
        Your decision
      </h2>
      <p className="mt-1 text-xs text-[#6e6779]">
        You are {reviewerName}, signing off {revisionLabel}: content hash <span className="font-mono">{short}</span>. Your
        identity and this exact hash are recorded together.
      </p>

      <fieldset className="mt-4 grid gap-3">
        <legend className="sr-only">Decision</legend>
        <label className="flex gap-3 rounded-xl border-2 border-royal bg-royal/[0.04] p-4">
          <input type="radio" name="decision" value="approve" defaultChecked className="mt-1" />
          <span>
            <span className="block text-sm font-semibold text-[#1f1b24]">Approve</span>
            <span className="block text-xs text-[#4a4454]">This revision is correct and age-appropriate. It becomes eligible to publish.</span>
          </span>
        </label>
        {[
          ["Request changes", "Send back to the author with a note."],
          ["Reject", "Not suitable. Kept for the record."],
        ].map(([title, text]) => (
          <label key={title} className="flex gap-3 rounded-xl border border-royal/10 p-4 opacity-70">
            <input type="radio" name="decision" value={title} disabled className="mt-1" />
            <span>
              <span className="block text-sm font-semibold text-[#1f1b24]">{title}</span>
              <span className="block text-xs text-[#4a4454]">{text}</span>
              <span className="block text-xs font-medium text-amber-900">Not available yet: there is nowhere to record this decision.</span>
            </span>
          </label>
        ))}
      </fieldset>

      <fieldset className="mt-5 grid gap-1">
        <legend className="text-xs font-semibold text-[#6e6779]">Required checks</legend>
        {CHECKS.map(([key, text]) => (
          <label key={key} className="flex min-h-11 items-center gap-3 text-sm text-[#1f1b24]">
            <input
              type="checkbox"
              checked={checks[key]}
              onChange={(event) => setChecks({ ...checks, [key]: event.target.checked })}
            />
            {text}
          </label>
        ))}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!allChecked || pending}
          onClick={() =>
            startTransition(async () => {
              setMessage("");
              try {
                const result = await approveDraft({ questionId, contentHash, checks });
                if (result.error) setMessage(result.error);
                else if (result.approvedAt && result.approvedBy) {
                  setRecorded({ approvedBy: result.approvedBy, approvedAt: result.approvedAt });
                  router.refresh();
                }
              } catch {
                setMessage("The approval was not confirmed. Reload to check its status before trying again.");
              }
            })
          }
          className="min-h-12 rounded-xl bg-royal px-6 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-royal"
        >
          {pending ? "Recording approval…" : `Approve ${revisionLabel}`}
        </button>
        <Link href="/admin/questions" className="inline-flex min-h-11 items-center text-sm font-semibold text-royal hover:underline">
          Cancel
        </Link>
      </div>
      {message && (
        <p role="alert" className="mt-3 text-sm text-[#8a3b12]">
          {message}
        </p>
      )}
      <p className="mt-3 text-xs text-[#6e6779]">Approving records you and this hash now. It does not publish.</p>
    </section>
  );
}
