"use client";

import Link from "next/link";
import { useState } from "react";
import { clsx } from "clsx";
import { Eye, EyeOff, Lock, ShieldAlert } from "lucide-react";

import { Badge, Button, Card } from "@/components/ui";
import { StatCard } from "@/features/admin-analytics/components/StatCard";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import type {
  CandidateAnswer,
  PresentationQuestion,
} from "@/features/exam-engine/types";
import type {
  ReviewBankId,
  ReviewCatalogue,
  ReviewDecisionRecord,
  ReviewEntry,
} from "./contracts";
import { BatchReadinessPanel } from "./components/BatchReadinessPanel";
import { DecisionPanel } from "./components/DecisionPanel";
import { WritingPromptPreview } from "./components/WritingPromptPreview";

function presentation(entry: ReviewEntry): PresentationQuestion {
  const {
    answerKey,
    explanation: _explanation,
    media: _media,
    ...rest
  } = entry.question;
  void _explanation;
  void _media;
  return { ...rest, answerKind: answerKey.kind };
}

function outcome(entry: ReviewEntry, answer: CandidateAnswer | undefined) {
  if (entry.question.answerKey.kind === "manual") {
    return {
      status: "manual_review" as const,
      awardedMarks: 0,
      availableMarks: entry.question.metadata.marks,
      requiresManualMarking: true,
    };
  }
  const correct = answer === entry.question.answerKey.optionId;
  return {
    status:
      answer === undefined ? "unanswered" : correct ? "correct" : "incorrect",
    awardedMarks: correct ? entry.question.metadata.marks : 0,
    availableMarks: entry.question.metadata.marks,
    requiresManualMarking: false,
  };
}

function PoolBadge({ entry }: { readonly entry: ReviewEntry }) {
  if (entry.pool === "unseen_mock") {
    return (
      <Badge variant="error">
        Unseen Mock ({entry.mockPaper === "mock-b" ? "Paper B" : "Paper A"})
      </Badge>
    );
  }
  if (entry.designatedForMock) {
    return (
      <Badge variant="warning">
        Mock Reserve ({entry.mockPaper === "mock-b" ? "Paper B" : "Paper A"})
      </Badge>
    );
  }
  return <Badge variant="neutral">Practice pool</Badge>;
}

function Findings({
  entry,
  revealed,
}: {
  readonly entry: ReviewEntry;
  readonly revealed: boolean;
}) {
  const findings = entry.findings;
  const hasAuthoringAids =
    Boolean(entry.workedSolution?.length) ||
    Boolean(entry.reviewFocus?.length) ||
    Boolean(entry.arithmeticCheck);

  if (!entry.governance && !findings && !hasAuthoringAids) return null;

  return (
    <section
      aria-label="Independent review"
      className="space-y-3 border-t border-royal/15 pt-5"
    >
      <h2 className="font-[family-name:var(--font-instrument-sans)] text-base font-bold text-ink">
        Independent-review findings &amp; authoring checks
      </h2>

      {entry.governance && (
        <div className="space-y-2 rounded-xl border border-royal/12 bg-page p-4 text-sm">
          <p className="font-semibold text-ink">
            Current release status:{" "}
            {entry.governance.bucket.replaceAll("_", " ")}
          </p>
          <p className="text-muted">
            Current difficulty gate: {entry.governance.difficultyGate}.
            Estimator: {entry.governance.estimator}.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-ink-soft">
            {entry.governance.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          <p className="text-xs text-muted">
            Governance status is separate from human review approval and
            publication.
          </p>
        </div>
      )}

      {entry.reviewFocus && entry.reviewFocus.length > 0 && (
        <div className="rounded-xl border border-royal/12 bg-page p-4 text-sm">
          <p className="font-semibold text-ink">Human review focus</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-ink-soft">
            {entry.reviewFocus.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {entry.arithmeticCheck && revealed && (
        <div className="rounded-xl border border-royal/12 bg-page p-4 text-sm">
          <p className="font-semibold text-ink">
            Automated arithmetic consistency check (advisory only — not semantic
            proof)
          </p>
          <p className="mt-1 font-mono text-xs text-ink">
            {entry.arithmeticCheck.expression} = {entry.arithmeticCheck.expected}
          </p>
          <p className="mt-1 text-xs text-muted">
            Confirm independently that this expression models the exact wording
            of the question stem.
          </p>
        </div>
      )}

      {findings ? (
        <div className="space-y-2 text-sm">
          <p className="text-muted">
            Historical advisory review by {findings.reviewer}, 16 October 2026.
            {findings.matchesCurrentRevision === false
              ? " Superseded content: these findings do not describe the current revision."
              : " Historical advisory only: this is not current independent-review or approval evidence."}{" "}
            Recommendations do not grant approval.
          </p>
          {findings.sourceRevision && (
            <details className="text-xs text-muted">
              <summary className="cursor-pointer">
                Historical finding identity
              </summary>
              <p className="mt-1 break-all font-mono">
                Source: {findings.sourceRevision}
              </p>
              <p className="break-all font-mono">
                Content hash: {findings.sourceContentHash}
              </p>
            </details>
          )}
          <p>
            Recommendation: {findings.recommendation}. Originality:{" "}
            {findings.originality ?? "not assessed"}.
          </p>
          <p>
            Authored difficulty: {entry.question.metadata.difficulty}. Reviewer
            estimate: {findings.difficultyEstimate ?? "not assessed"} (
            {findings.difficultyVerdict ?? "no verdict"}).
          </p>
          {findings.difficultyEstimate &&
            findings.difficultyEstimate !==
              entry.question.metadata.difficulty && (
              <p className="font-semibold text-ink">
                Historical difficulty conflict; use the current release gate
                above.
              </p>
            )}
          {findings.semanticFlags.length > 0 && (
            <ul className="list-disc space-y-1 pl-5">
              {findings.semanticFlags.map((flag, index) => (
                <li key={index}>{flag}</li>
              ))}
            </ul>
          )}
          {revealed ? (
            <>
              <p className="whitespace-pre-wrap">{findings.notes}</p>
              <details>
                <summary className="cursor-pointer font-medium">
                  Reviewer answer and working
                </summary>
                <p className="mt-2">Answer: {findings.myAnswer}</p>
                <p className="whitespace-pre-wrap">{findings.working}</p>
              </details>
            </>
          ) : (
            <p className="text-xs text-muted">
              Reviewer answer and working are hidden during blind solving.
              Submit a preview answer or reveal the answer key to inspect them.
            </p>
          )}
        </div>
      ) : !hasAuthoringAids ? (
        <p className="text-sm text-muted">
          No independent-review findings loaded for this item.
        </p>
      ) : null}
    </section>
  );
}

function Preview({
  entries,
  paper,
  approvalsAvailable,
  extendedDecisionsAvailable,
  reviewer,
  onDecisionRecorded,
}: {
  readonly entries: ReviewEntry[];
  readonly paper: boolean;
  readonly approvalsAvailable: boolean;
  readonly extendedDecisionsAvailable: boolean;
  readonly reviewer?: ReviewCatalogue["reviewer"];
  readonly onDecisionRecorded?: (
    questionId: string,
    decision: ReviewDecisionRecord,
  ) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CandidateAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [blindSolvedIds, setBlindSolvedIds] = useState<Record<string, boolean>>(
    {},
  );

  const entry = entries[index]!;
  const question = entry.question;
  const isWriting =
    entry.itemKind === "writing_prompt" ||
    question.answerKey.kind === "manual";
  const result = outcome(entry, answers[question.id]);
  const scores = entries.map((item) =>
    outcome(item, answers[item.question.id]),
  );
  const key = question.answerKey;
  const revealed = submitted || showAnswers;
  const blindSolved = Boolean(blindSolvedIds[question.id]);

  return (
    <section
      aria-label="Draft preview"
      className="space-y-5 rounded-2xl border border-royal/15 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono font-bold text-ink">{question.id}</span>
          {entry.batchId && (
            <Badge variant="neutral">{entry.batchId}</Badge>
          )}
          <PoolBadge entry={entry} />
          {!isWriting && !revealed && (
            <Badge variant="purple">
              <Lock aria-hidden="true" className="mr-1 h-3 w-3" />
              Blind solve mode
            </Badge>
          )}
        </div>
        <span>
          Year {question.yearLevel} · {question.metadata.difficulty} ·{" "}
          {question.metadata.marks} marks ·{" "}
          {Math.round(question.metadata.estimatedTimeSeconds)}s
        </span>
      </div>

      {entry.mockPolicyNote && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning/8 p-3 text-xs text-ink">
          <ShieldAlert
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
          />
          <span>{entry.mockPolicyNote}</span>
        </div>
      )}

      {paper && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-ink">
            Paper question{" "}
            <select
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="min-h-11 rounded-xl border border-royal/20 bg-white px-3 text-sm"
            >
              {entries.map((item, i) => (
                <option key={item.question.id} value={i}>
                  {i + 1} of {entries.length}: {item.question.id}
                </option>
              ))}
            </select>
          </label>
          <span className="text-sm text-muted">
            {Object.keys(answers).length} answered
          </span>
        </div>
      )}

      {isWriting ? (
        <WritingPromptPreview entry={entry} />
      ) : (
        <ExamQuestion
          key={question.id}
          question={presentation(entry)}
          answer={answers[question.id]}
          onAnswerChange={(answer) =>
            setAnswers({ ...answers, [question.id]: answer })
          }
          disabled={submitted}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        {paper && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={index === entries.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next
            </Button>
          </>
        )}
        {!isWriting && (
          <>
            <Button
              type="button"
              disabled={submitted}
              onClick={() => {
                const answeredNow: Record<string, boolean> = {
                  ...blindSolvedIds,
                };
                for (const item of entries) {
                  if (answers[item.question.id] !== undefined) {
                    answeredNow[item.question.id] = true;
                  }
                }
                setBlindSolvedIds(answeredNow);
                setSubmitted(true);
                setShowAnswers(true);
              }}
            >
              {paper ? "Submit draft paper" : "Submit preview answer"}
            </Button>
            {!submitted && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAnswers((prev) => !prev)}
              >
                {showAnswers ? (
                  <>
                    <EyeOff aria-hidden="true" className="mr-1.5 h-4 w-4" />
                    Hide answer key
                  </>
                ) : (
                  <>
                    <Eye aria-hidden="true" className="mr-1.5 h-4 w-4" />
                    Reveal answer key
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setShowAnswers(false);
                setIndex(0);
              }}
            >
              Reset preview
            </Button>
          </>
        )}
      </div>

      {submitted && !isWriting && (
        <div className="space-y-3 border-t border-royal/15 pt-5">
          <p className="font-semibold text-ink">
            Preview total:{" "}
            {scores.reduce((sum, score) => sum + score.awardedMarks, 0)} /{" "}
            {scores.reduce((sum, score) => sum + score.availableMarks, 0)} marks
            {scores.some((score) => score.requiresManualMarking)
              ? " (manual marking required for writing)"
              : ""}
            . No student progress was recorded.
          </p>
          <p className="text-sm text-muted">
            This question: {result.status.replaceAll("_", " ")} ·{" "}
            {result.awardedMarks} / {result.availableMarks} marks.
          </p>
        </div>
      )}

      {revealed && !isWriting && (
        <div className="space-y-3 rounded-xl border border-royal/15 bg-page p-4">
          <h2 className="font-semibold text-ink">Declared answer</h2>
          {key.kind === "single_option" ? (
            <p className="font-medium text-ink">
              <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-royal/10 font-mono text-xs font-bold uppercase text-royal">
                {key.optionId}
              </span>
              {
                question.options.find((option) => option.id === key.optionId)
                  ?.text
              }
            </p>
          ) : (
            <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
              {JSON.stringify(key, null, 2)}
            </pre>
          )}
          <h2 className="font-semibold text-ink">Worked explanation</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-ink-soft">
            {question.explanation}
          </p>
          {entry.workedSolution && entry.workedSolution.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                Step-by-step worked solution
              </h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                {entry.workedSolution.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <p className="text-xs text-muted">
            Draft answer keys may contain errors. Solve blind and inspect
            independent findings before recording approval.
          </p>
        </div>
      )}

      <Findings entry={entry} revealed={revealed || isWriting} />

      <DecisionPanel
        key={`${question.id}:${entry.contentHash}`}
        entry={entry}
        available={approvalsAvailable}
        extendedAvailable={extendedDecisionsAvailable}
        blindSolved={blindSolved}
        reviewer={reviewer}
        onDecisionRecorded={onDecisionRecorded}
      />
    </section>
  );
}

type ViewMode = "individual" | "paper" | "readiness";

export function DraftReview({ catalogue }: { readonly catalogue: ReviewCatalogue }) {
  const activeBankId: ReviewBankId =
    catalogue.activeBankId ?? "scholarship-y6-core";
  const banks = catalogue.banks ?? [];
  const extendedDecisionsAvailable = Boolean(
    catalogue.extendedDecisionsAvailable,
  );

  const [decisionOverrides, setDecisionOverrides] = useState<
    Record<string, ReviewDecisionRecord>
  >({});
  const [batchFilter, setBatchFilter] = useState("");
  const [section, setSection] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [poolFilter, setPoolFilter] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [paperSource, setPaperSource] = useState("");
  const [mode, setMode] = useState<ViewMode>("individual");

  const mergedEntries = catalogue.entries.map((entry) => {
    const override = decisionOverrides[entry.question.id];
    if (!override) return entry;
    return {
      ...entry,
      latestDecision: override,
      approval:
        override.decision === "approve"
          ? {
              approvedBy: override.approvedBy,
              approvedAt: override.decidedAt,
              reviewerName: override.reviewerName,
              reviewerEmail: override.reviewerEmail,
            }
          : entry.approval,
      decisionHistory: [
        override,
        ...(entry.decisionHistory ?? []).filter(
          (item) => item.id !== override.id,
        ),
      ],
    };
  });

  const entries = mergedEntries.filter((entry) => {
    const currentDecision = entry.latestDecision;
    const isApproved =
      Boolean(entry.approval) ||
      (currentDecision?.matchesCurrentRevision &&
        currentDecision.decision === "approve");
    const isRevise =
      currentDecision?.matchesCurrentRevision &&
      currentDecision.decision === "revise";
    const isReject =
      currentDecision?.matchesCurrentRevision &&
      currentDecision.decision === "reject";
    const isMockSlot =
      entry.pool === "unseen_mock" || Boolean(entry.designatedForMock);

    return (
      (!batchFilter || (entry.batchId ?? entry.source) === batchFilter) &&
      (!section || entry.question.metadata.subject === section) &&
      (!difficulty || entry.question.metadata.difficulty === difficulty) &&
      (!poolFilter ||
        (poolFilter === "practice"
          ? !isMockSlot
          : poolFilter === "mock"
            ? isMockSlot
            : poolFilter === "mock-a"
              ? entry.mockPaper === "mock-a"
              : poolFilter === "mock-b"
                ? entry.mockPaper === "mock-b"
                : true)) &&
      (!reviewStatus ||
        (reviewStatus.startsWith("release:")
          ? entry.governance?.bucket === reviewStatus.slice(8)
          : reviewStatus === "approved"
            ? isApproved
            : reviewStatus === "pending"
              ? !isApproved && !isRevise && !isReject
              : reviewStatus === "revise_requested"
                ? isRevise
                : reviewStatus === "rejected"
                  ? isReject
                  : entry.findings?.recommendation === reviewStatus)) &&
      (!search ||
        `${entry.question.id} ${entry.question.prompt} ${entry.batchId ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase()))
    );
  });

  const activeIndex = Math.max(
    0,
    entries.findIndex(({ question }) => question.id === selected),
  );
  const active = entries[activeIndex];

  const batchIds = [
    ...new Set(mergedEntries.map((entry) => entry.batchId ?? entry.source)),
  ];
  const sources = [...new Set(mergedEntries.map((entry) => entry.source))];
  const chosenSource =
    paperSource ||
    sources.find((source) => source.includes("scholarship")) ||
    sources[0];
  const paperEntries = mergedEntries.filter(
    (entry) => entry.source === chosenSource,
  );

  const approvedCount = mergedEntries.filter(
    (entry) =>
      Boolean(entry.approval) ||
      (entry.latestDecision?.matchesCurrentRevision &&
        entry.latestDecision.decision === "approve"),
  ).length;
  const reviseCount = mergedEntries.filter(
    (entry) =>
      entry.latestDecision?.matchesCurrentRevision &&
      entry.latestDecision.decision === "revise",
  ).length;
  const rejectCount = mergedEntries.filter(
    (entry) =>
      entry.latestDecision?.matchesCurrentRevision &&
      entry.latestDecision.decision === "reject",
  ).length;
  const pendingCount = Math.max(
    0,
    mergedEntries.length - approvedCount - reviseCount - rejectCount,
  );

  const label = (value: string) =>
    value === "numeracy"
      ? "Mathematics"
      : value === "writing"
        ? "Written Expression"
        : value.replaceAll("_", " ");
  const selectClass =
    "block min-h-11 w-full rounded-xl border border-royal/20 bg-white px-3 text-sm text-ink";

  const handleDecisionRecorded = (
    questionId: string,
    decision: ReviewDecisionRecord,
  ) => {
    setDecisionOverrides((prev) => ({ ...prev, [questionId]: decision }));
  };

  return (
    <div className="mm-root space-y-6 font-[family-name:var(--font-geist)]">
      {banks.length > 1 && (
        <nav
          aria-label="Draft review banks"
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-royal/15 bg-white p-2"
        >
          {banks.map((bank) => {
            const isCurrent = bank.id === activeBankId;
            return (
              <Link
                key={bank.id}
                href={`/admin/review?bank=${bank.id}`}
                aria-current={isCurrent ? "page" : undefined}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition",
                  isCurrent
                    ? "bg-royal text-white"
                    : "text-ink-soft hover:bg-royal/8 hover:text-royal",
                )}
              >
                <span>{bank.shortLabel}</span>
                {bank.provisionalCanonical && (
                  <span
                    className={clsx(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider",
                      isCurrent
                        ? "bg-white/20 text-white"
                        : "bg-royal/10 text-royal",
                    )}
                  >
                    Provisional Canonical
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}

      <div className="space-y-1.5">
        <p className="max-w-3xl text-sm leading-6 text-muted">
          Solve unpublished drafts blind before revealing keys, preview complete
          section papers, and record revision-bound human review decisions.
          Answers stay on this page and never count towards student progress.
          Publication always requires the governed pipeline.
        </p>
        <p className="text-sm text-muted">
          {activeBankId === "vihaan-scholarship-500"
            ? `Scholarship 500 (Codex provisional canonical): ${mergedEntries.length} draft questions across ${batchIds.length} batches (400 practice pool, 100 designated mock reserve, 40 Written Expression prompts).`
            : `Scholarship: ${mergedEntries.filter((entry) => entry.kind === "scholarship").length} draft questions across four sections.`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Bank items" value={String(mergedEntries.length)} />
        <StatCard
          label="Human approved"
          value={String(approvedCount)}
          detail="Current revision"
        />
        <StatCard label="Revision requested" value={String(reviseCount)} />
        <StatCard label="Rejected" value={String(rejectCount)} />
        <StatCard label="Awaiting review" value={String(pendingCount)} />
      </div>

      {catalogue.issues.length > 0 && (
        <details
          open={catalogue.entries.length === 0}
          className="rounded-xl border border-royal/15 bg-white p-4"
        >
          <summary className="cursor-pointer font-semibold text-ink">
            {catalogue.issues.length} loading or validation issues
          </summary>
          <ul className="mt-3 list-disc space-y-2 break-words pl-5 text-sm">
            {catalogue.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={mode === "individual" ? "primary" : "secondary"}
          aria-pressed={mode === "individual"}
          onClick={() => setMode("individual")}
        >
          Individual questions
        </Button>
        <Button
          type="button"
          variant={mode === "paper" ? "primary" : "secondary"}
          aria-pressed={mode === "paper"}
          onClick={() => setMode("paper")}
        >
          Complete draft papers
        </Button>
        <Button
          type="button"
          variant={mode === "readiness" ? "primary" : "secondary"}
          aria-pressed={mode === "readiness"}
          onClick={() => setMode("readiness")}
        >
          Batch progress &amp; export
        </Button>
      </div>

      {mode === "readiness" ? (
        <BatchReadinessPanel bankId={activeBankId} entries={mergedEntries} />
      ) : mode === "paper" ? (
        <>
          <label className="block space-y-2 text-sm font-medium text-ink">
            Draft section paper
            <select
              value={chosenSource}
              onChange={(event) => setPaperSource(event.target.value)}
              className={selectClass}
            >
              {sources.map((source) => (
                <option key={source} value={source}>
                  {source
                    .split("/")
                    .at(-1)
                    ?.replace("-draft.json", "")
                    .replace(".draft.json", "")
                    .replaceAll("-", " ")}
                </option>
              ))}
            </select>
          </label>
          <p className="text-sm text-muted">
            Complete source packet: {paperEntries.length} questions. Includes
            all shared passages and visuals; browse freely without a time limit.
            Question filters do not shorten a paper.
          </p>
          {paperEntries.length > 0 && (
            <Preview
              key={`paper:${chosenSource}`}
              entries={paperEntries}
              paper
              approvalsAvailable={catalogue.approvalsAvailable}
              extendedDecisionsAvailable={extendedDecisionsAvailable}
              reviewer={catalogue.reviewer}
              onDecisionRecorded={handleDecisionRecorded}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {batchIds.length > 1 && (
              <label className="space-y-1.5 text-sm font-medium text-ink">
                Batch
                <select
                  value={batchFilter}
                  onChange={(event) => setBatchFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="">All batches ({batchIds.length})</option>
                  {batchIds.map((batchId) => (
                    <option key={batchId} value={batchId}>
                      {batchId}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Section
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className={selectClass}
              >
                <option value="">All sections</option>
                {[
                  ...new Set(
                    mergedEntries.map(({ question }) => question.metadata.subject),
                  ),
                ]
                  .sort()
                  .map((value) => (
                    <option key={value} value={value}>
                      {label(value)}
                    </option>
                  ))}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className={selectClass}
              >
                <option value="">All difficulties</option>
                {[
                  ...new Set(
                    mergedEntries.map(
                      ({ question }) => question.metadata.difficulty,
                    ),
                  ),
                ]
                  .sort()
                  .map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
              </select>
            </label>
            {activeBankId === "vihaan-scholarship-500" && (
              <label className="space-y-1.5 text-sm font-medium text-ink">
                Pool
                <select
                  value={poolFilter}
                  onChange={(event) => setPoolFilter(event.target.value)}
                  className={selectClass}
                >
                  <option value="">All pools</option>
                  <option value="practice">Practice pool (400)</option>
                  <option value="mock">Mock exam reserve (100)</option>
                  <option value="mock-a">Mock Paper A (50)</option>
                  <option value="mock-b">Mock Paper B (50)</option>
                </select>
              </label>
            )}
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Review status
              <select
                value={reviewStatus}
                onChange={(event) => setReviewStatus(event.target.value)}
                className={selectClass}
              >
                <option value="">All statuses</option>
                <option value="pending">Awaiting human approval</option>
                <option value="approved">Human approved</option>
                <option value="revise_requested">Revision requested</option>
                <option value="rejected">Rejected</option>
                {activeBankId === "scholarship-y6-core" && (
                  <>
                    <option value="release:ready_for_review">
                      Release: ready for review
                    </option>
                    <option value="release:requires_revision_or_decision">
                      Release: requires revision or decision
                    </option>
                    <option value="release:awaiting_external_evidence">
                      Release: awaiting external evidence
                    </option>
                    <option value="revise">
                      Historical reviewer recommends revision
                    </option>
                    <option value="reject">
                      Historical reviewer recommends rejection
                    </option>
                    <option value="approve">
                      Historical reviewer recommends approval
                    </option>
                  </>
                )}
              </select>
            </label>
            <label className="space-y-1.5 text-sm font-medium text-ink">
              Question ID or prompt
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ID or stem…"
                className={selectClass}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p role="status" className="text-sm text-muted">
              {entries.length} drafts match your filters
            </p>
            {active && entries.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={activeIndex <= 0}
                  onClick={() =>
                    setSelected(entries[activeIndex - 1]!.question.id)
                  }
                >
                  Previous item
                </Button>
                <span className="text-xs font-bold tabular-nums text-muted">
                  {activeIndex + 1} / {entries.length}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={activeIndex >= entries.length - 1}
                  onClick={() =>
                    setSelected(entries[activeIndex + 1]!.question.id)
                  }
                >
                  Next item
                </Button>
              </div>
            )}
          </div>

          {active ? (
            <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
              <aside className="space-y-3">
                <label className="block space-y-1.5 text-sm font-medium text-ink">
                  Question
                  <select
                    value={active.question.id}
                    onChange={(event) => setSelected(event.target.value)}
                    className={selectClass}
                  >
                    {entries.map(({ question }) => (
                      <option key={question.id} value={question.id}>
                        {question.id} — {question.prompt.slice(0, 100)}
                      </option>
                    ))}
                  </select>
                </label>

                <Card className="hidden max-h-[70vh] overflow-y-auto p-2 lg:block">
                  <ul className="space-y-1" aria-label="Filtered review queue">
                    {entries.map((item) => {
                      const isSelected =
                        item.question.id === active.question.id;
                      const dec = item.latestDecision;
                      const statusLabel =
                        dec && dec.matchesCurrentRevision
                          ? dec.decision === "approve"
                            ? "Approved"
                            : dec.decision === "revise"
                              ? "Revise"
                              : "Rejected"
                          : item.approval
                            ? "Approved"
                            : "Pending";
                      const statusVariant =
                        statusLabel === "Approved"
                          ? "success"
                          : statusLabel === "Revise"
                            ? "warning"
                            : statusLabel === "Rejected"
                              ? "error"
                              : "neutral";
                      return (
                        <li key={item.question.id}>
                          <button
                            type="button"
                            onClick={() => setSelected(item.question.id)}
                            className={clsx(
                              "w-full rounded-xl p-2.5 text-left transition",
                              isSelected
                                ? "bg-royal/10 ring-1 ring-royal/30"
                                : "hover:bg-page",
                            )}
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="truncate font-mono text-xs font-bold text-ink">
                                {item.question.id}
                              </span>
                              <Badge variant={statusVariant}>
                                {statusLabel}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted">
                              {item.question.prompt}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </aside>

              <div className="min-w-0">
                <Preview
                  key={`single:${active.question.id}`}
                  entries={[active]}
                  paper={false}
                  approvalsAvailable={catalogue.approvalsAvailable}
                  extendedDecisionsAvailable={extendedDecisionsAvailable}
                  reviewer={catalogue.reviewer}
                  onDecisionRecorded={handleDecisionRecorded}
                />
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-royal/15 bg-white p-6 text-sm text-muted">
              No drafts available for these filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
