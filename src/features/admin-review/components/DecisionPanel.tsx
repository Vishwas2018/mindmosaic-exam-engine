"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { approveDraft, recordReviewDecision } from "@/app/admin/review/actions";
import { Badge, Button, Input, Textarea } from "@/components/ui";
import type {
  ReviewChecks,
  ReviewDecisionKind,
  ReviewDecisionRecord,
  ReviewEntry,
} from "../contracts";
import { validateHumanReviewerName } from "../pool-classification";

const INITIAL_CHECKS: ReviewChecks = {
  correctness: false,
  originality: false,
  ageAppropriateness: false,
  editorialInterpretation: false,
  difficultyCalibrated: false,
};

const DECISION_BADGE: Record<
  ReviewDecisionKind,
  { readonly label: string; readonly variant: "success" | "warning" | "error" }
> = {
  approve: { label: "Human approved", variant: "success" },
  revise: { label: "Revision requested", variant: "warning" },
  reject: { label: "Rejected", variant: "error" },
};

export function DecisionPanel({
  entry,
  available,
  extendedAvailable,
  blindSolved,
  reviewer,
  onDecisionRecorded,
}: {
  readonly entry: ReviewEntry;
  readonly available: boolean;
  readonly extendedAvailable: boolean;
  readonly blindSolved: boolean;
  readonly reviewer?: {
    readonly userId: string;
    readonly email: string;
    readonly displayName: string | null;
  };
  readonly onDecisionRecorded?: (
    questionId: string,
    decision: ReviewDecisionRecord,
  ) => void;
}) {
  const router = useRouter();
  const [decisionKind, setDecisionKind] =
    useState<ReviewDecisionKind>("approve");
  const [checks, setChecks] = useState<ReviewChecks>(INITIAL_CHECKS);
  const [notes, setNotes] = useState("");
  const defaultReviewerName =
    reviewer?.displayName && validateHumanReviewerName(reviewer.displayName).ok
      ? reviewer.displayName
      : "";
  const [reviewerName, setReviewerName] = useState(defaultReviewerName);
  const [recordedDecision, setRecordedDecision] = useState<
    ReviewDecisionRecord | undefined
  >(entry.latestDecision);
  const [recordedLegacyApproval, setRecordedLegacyApproval] = useState(
    entry.approval,
  );
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const currentDecision = recordedDecision ?? entry.latestDecision;
  const approval = recordedLegacyApproval ?? entry.approval;
  const isApprovedCurrent =
    Boolean(approval) ||
    (currentDecision?.matchesCurrentRevision &&
      currentDecision.decision === "approve");
  const useExtendedFlow = extendedAvailable;

  const history = entry.decisionHistory ?? [];
  const staleDecisions = history.filter((item) => !item.matchesCurrentRevision);

  const nameValidation = validateHumanReviewerName(reviewerName);
  const allApproveChecks = useExtendedFlow
    ? Object.values(checks).every(Boolean)
    : checks.correctness && checks.originality && checks.ageAppropriateness;
  const notesSatisfied =
    decisionKind === "approve" || notes.trim().length >= 10;

  const canSubmit = useExtendedFlow
    ? available &&
      !pending &&
      nameValidation.ok &&
      (decisionKind === "approve" ? allApproveChecks : notesSatisfied)
    : available && !pending && allApproveChecks && decisionKind === "approve";

  const handleSubmit = () => {
    startTransition(async () => {
      setMessage("");
      try {
        if (useExtendedFlow) {
          const result = await recordReviewDecision({
            bankId: entry.bankId ?? "scholarship-y6-core",
            questionId: entry.question.id,
            contentHash: entry.contentHash,
            publishedContentHash:
              entry.publishedContentHash ?? entry.contentHash,
            decision: decisionKind,
            checks,
            blindSolved,
            notes: notes.trim(),
            reviewerName: reviewerName.trim(),
          });
          if (result.error) {
            setMessage(result.error);
          } else if (result.decision) {
            setRecordedDecision(result.decision);
            if (result.decision.decision === "approve") {
              setRecordedLegacyApproval({
                approvedAt: result.decision.decidedAt,
                approvedBy: result.decision.approvedBy,
                reviewerName: result.decision.reviewerName,
                reviewerEmail: result.decision.reviewerEmail,
              });
            }
            onDecisionRecorded?.(entry.question.id, result.decision);
            setMessage(
              result.decision.decision === "approve"
                ? "Your human approval was recorded for this revision. Content remains unpublished until exported through the governed pipeline."
                : result.decision.decision === "revise"
                  ? "Revision request recorded for this content hash. No publication was requested."
                  : "Rejection recorded for this content hash. Item remains excluded from publication.",
            );
            router.refresh();
          }
        } else {
          const result = await approveDraft({
            questionId: entry.question.id,
            contentHash: entry.contentHash,
            checks: {
              correctness: checks.correctness,
              originality: checks.originality,
              ageAppropriateness: checks.ageAppropriateness,
            },
          });
          if (result.error) {
            setMessage(result.error);
          } else if (result.approvedAt && result.approvedBy) {
            setRecordedLegacyApproval({
              approvedAt: result.approvedAt,
              approvedBy: result.approvedBy,
            });
            setMessage(
              "Your approval was recorded for this revision. Content remains unpublished.",
            );
            router.refresh();
          }
        }
      } catch {
        setMessage(
          "Decision was not confirmed. Reload to check its status before retrying.",
        );
      }
    });
  };

  const primaryButtonLabel =
    decisionKind === "approve"
      ? pending
        ? "Recording approval…"
        : "Record my explicit approval"
      : decisionKind === "revise"
        ? pending
          ? "Recording revision request…"
          : "Record revision request"
        : pending
          ? "Recording rejection…"
          : "Record rejection";

  return (
    <section
      aria-label="Human approval"
      className="space-y-4 border-t border-royal/15 pt-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-instrument-sans)] text-base font-bold text-ink">
          Human review approval
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {currentDecision && currentDecision.matchesCurrentRevision ? (
            <Badge variant={DECISION_BADGE[currentDecision.decision].variant}>
              {DECISION_BADGE[currentDecision.decision].label}
            </Badge>
          ) : approval ? (
            <Badge variant="success">Human approved</Badge>
          ) : (
            <Badge variant="neutral">Awaiting human decision</Badge>
          )}
          <Badge variant="neutral">Unpublished draft</Badge>
        </div>
      </div>

      <p className="text-sm text-muted">
        {currentDecision && currentDecision.matchesCurrentRevision ? (
          <>
            Latest decision:{" "}
            <strong>{DECISION_BADGE[currentDecision.decision].label}</strong> by{" "}
            <strong>{currentDecision.reviewerName}</strong>
            {currentDecision.reviewerEmail
              ? ` (${currentDecision.reviewerEmail})`
              : ""}{" "}
            at {currentDecision.decidedAt}.
            {currentDecision.notes ? ` Notes: “${currentDecision.notes}”` : ""}{" "}
            Publication status: unpublished draft.
          </>
        ) : approval ? (
          `Approved by ${approval.reviewerName ?? approval.approvedBy} at ${approval.approvedAt}. Publication status: unpublished draft.`
        ) : available ? (
          "No recorded approval for this content revision. Publication status: unpublished draft."
        ) : (
          "Approval status unavailable; check the migration and access permissions. Publication status: unpublished draft."
        )}
      </p>

      {staleDecisions.length > 0 && (
        <div className="rounded-xl border border-warning/25 bg-warning/8 p-3 text-sm text-ink">
          <strong className="text-warning">
            Stale revision history ({staleDecisions.length}):
          </strong>{" "}
          Previous review decisions were recorded against an earlier content
          hash and do not apply to this revision. Fresh human review is
          required.
        </div>
      )}

      <details className="rounded-xl border border-royal/12 bg-page p-3 text-sm text-muted">
        <summary className="cursor-pointer font-semibold text-ink">
          Content revision
        </summary>
        <div className="mt-2 space-y-1.5 text-xs">
          <p>
            D1 draft hash:{" "}
            <span className="break-all font-mono text-ink">
              {entry.contentHash}
            </span>
          </p>
          {entry.candidateHash && (
            <p>
              D2 candidate hash:{" "}
              <span className="break-all font-mono text-ink">
                {entry.candidateHash}
              </span>
            </p>
          )}
          {entry.publishedContentHash && (
            <p>
              D3 published {entry.itemKind === "writing_prompt" ? "WritingTask" : "Question"} hash:{" "}
              <span className="break-all font-mono text-ink">
                {entry.publishedContentHash}
              </span>
            </p>
          )}
          {entry.sourceRevision && (
            <p>
              Source release:{" "}
              <span className="break-all font-mono text-ink">
                {entry.sourceRevision}
              </span>
            </p>
          )}
          {currentDecision?.evidenceFingerprint && (
            <p>
              Decision evidence fingerprint:{" "}
              <span className="break-all font-mono text-ink">
                {currentDecision.evidenceFingerprint}
              </span>
            </p>
          )}
          <p>
            Changes to the source question, shared passage, options or visuals
            invalidate prior approvals and require fresh human review.
          </p>
        </div>
      </details>

      {history.length > 0 && (
        <details className="rounded-xl border border-royal/12 bg-white p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-ink">
            Decision audit trail ({history.length})
          </summary>
          <ul className="mt-2 divide-y divide-royal/10 text-xs">
            {history.map((item, idx) => (
              <li key={item.id ?? `${item.decidedAt}-${idx}`} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={DECISION_BADGE[item.decision].variant}>
                    {DECISION_BADGE[item.decision].label}
                  </Badge>
                  <Badge
                    variant={item.matchesCurrentRevision ? "neutral" : "warning"}
                  >
                    {item.matchesCurrentRevision
                      ? "Current revision"
                      : "Stale revision"}
                  </Badge>
                  {item.blindSolved && (
                    <Badge variant="purple">Blind solved</Badge>
                  )}
                  <span className="font-semibold text-ink">
                    {item.reviewerName}
                  </span>
                  <span className="text-muted">{item.decidedAt}</span>
                </div>
                {item.notes && (
                  <p className="mt-1 whitespace-pre-wrap text-ink-soft">
                    {item.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}

      {!isApprovedCurrent && (
        <div className="space-y-4 rounded-xl border border-royal/12 bg-page p-4">
          <p className="text-sm text-muted">
            Record your decision only after checking the item and any advisory
            findings. Previewing and submitting answers never records approval,
            and AI validation never counts as human approval.
          </p>

          {useExtendedFlow && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor={`reviewer-name-${entry.question.id}`}
                    className="block text-xs font-bold uppercase tracking-wider text-muted"
                  >
                    Accountable human reviewer full name
                  </label>
                  <Input
                    id={`reviewer-name-${entry.question.id}`}
                    value={reviewerName}
                    onChange={(event) => setReviewerName(event.target.value)}
                    placeholder="e.g. Vishwas Joshi"
                    className="mt-1.5"
                    aria-describedby={`reviewer-hint-${entry.question.id}`}
                  />
                  <p
                    id={`reviewer-hint-${entry.question.id}`}
                    className="mt-1 text-xs text-muted"
                  >
                    Bound to signed-in account{" "}
                    <span className="font-mono">
                      {reviewer?.email || "authenticated admin"}
                    </span>
                    . AI/service names are refused.
                  </p>
                  {reviewerName.trim().length > 0 && !nameValidation.ok && (
                    <p className="mt-1 text-xs font-semibold text-error">
                      {nameValidation.error}
                    </p>
                  )}
                </div>

                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-muted">
                    Review decision
                  </span>
                  <div
                    role="group"
                    aria-label="Review decision"
                    className="mt-1.5 flex flex-wrap gap-2"
                  >
                    {(
                      [
                        ["approve", "Approve"],
                        ["revise", "Request revision"],
                        ["reject", "Reject"],
                      ] as const
                    ).map(([kind, label]) => (
                      <Button
                        key={kind}
                        type="button"
                        size="sm"
                        variant={
                          decisionKind === kind ? "primary" : "secondary"
                        }
                        aria-pressed={decisionKind === kind}
                        onClick={() => setDecisionKind(kind)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">
                    Blind solve status:{" "}
                    <strong>
                      {blindSolved
                        ? "Completed before reveal"
                        : entry.itemKind === "writing_prompt"
                          ? "Writing prompt (rubric review)"
                          : "Not blind-solved yet"}
                    </strong>
                  </p>
                </div>
              </div>
            </>
          )}

          {decisionKind === "approve" && (
            <fieldset className="space-y-2">
              <legend className="text-xs font-bold uppercase tracking-wider text-muted">
                Mandatory human verification checklist
              </legend>
              {(
                [
                  [
                    "correctness",
                    entry.itemKind === "writing_prompt"
                      ? "I checked prompt clarity, form fit and time suitability."
                      : "I checked correctness and the worked explanation.",
                  ],
                  [
                    "originality",
                    "I checked originality and resolved originality concerns.",
                  ],
                  [
                    "ageAppropriateness",
                    "I checked age appropriateness and Australian English for Year 5/6.",
                  ],
                  ...(useExtendedFlow
                    ? ([
                        [
                          "editorialInterpretation",
                          entry.itemKind === "writing_prompt"
                            ? "I confirmed alignment with the existing 6-criterion Scholarship Written Expression rubric."
                            : "I confirmed the stem has a single defensible reading and every distractor is unambiguously wrong.",
                        ],
                        [
                          "difficultyCalibrated",
                          "I reviewed the difficulty label, time estimate and practice/mock pool separation.",
                        ],
                      ] as const)
                    : []),
                ] as const
              ).map(([key, text]) => (
                <label
                  key={key}
                  className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={checks[key]}
                    onChange={(event) =>
                      setChecks({ ...checks, [key]: event.target.checked })
                    }
                    className="h-4 w-4 accent-royal"
                  />
                  {text}
                </label>
              ))}
            </fieldset>
          )}

          {useExtendedFlow && (
            <div>
              <label
                htmlFor={`review-notes-${entry.question.id}`}
                className="block text-xs font-bold uppercase tracking-wider text-muted"
              >
                {decisionKind === "approve"
                  ? "Reviewer notes (optional)"
                  : "Required rationale for revision / rejection (min 10 characters)"}
              </label>
              <Textarea
                id={`review-notes-${entry.question.id}`}
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  decisionKind === "approve"
                    ? "Optional observations on difficulty, timing or distractor quality…"
                    : "Describe the exact defect, ambiguity or required revision…"
                }
                className="mt-1.5"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={decisionKind === "reject" ? "danger" : "secondary"}
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {primaryButtonLabel}
            </Button>
            {!useExtendedFlow && available && (
              <span className="text-xs text-muted">
                Extended decisions (Request revision / Reject) activate once the
                DEV migration{" "}
                <code className="font-mono">20261124090000</code> is applied.
              </span>
            )}
          </div>
        </div>
      )}

      {message && (
        <p role="alert" className="text-sm font-medium text-ink">
          {message}
        </p>
      )}
    </section>
  );
}
