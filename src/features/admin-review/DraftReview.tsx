"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { approveDraft } from "@/app/admin/review/actions";
import { Button } from "@/components/ui";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import type {
  CandidateAnswer,
  PresentationQuestion,
} from "@/features/exam-engine/types";
import type { ReviewCatalogue, ReviewEntry } from "./contracts";

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
  const correct = answer === entry.question.answerKey.optionId;
  return {
    status:
      answer === undefined ? "unanswered" : correct ? "correct" : "incorrect",
    awardedMarks: correct ? entry.question.metadata.marks : 0,
    availableMarks: entry.question.metadata.marks,
    requiresManualMarking: false,
  };
}

const checksInitial = {
  correctness: false,
  originality: false,
  ageAppropriateness: false,
};

function ApprovalPanel({
  entry,
  available,
}: {
  entry: ReviewEntry;
  available: boolean;
}) {
  const router = useRouter();
  const [checks, setChecks] = useState(checksInitial);
  const [recordedApproval, setApproval] = useState(entry.approval);
  const approval = recordedApproval ?? entry.approval;
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <section
      aria-label="Human approval"
      className="space-y-3 border-t border-royal/15 pt-5"
    >
      <h2 className="font-semibold text-ink">Human review approval</h2>
      <p className="text-sm text-muted">
        {approval
          ? `Approved by ${approval.approvedBy} at ${approval.approvedAt}`
          : available
            ? "No recorded approval for this content revision."
            : "Approval status unavailable; check the migration and access permissions."}{" "}
        Publication status: unpublished draft.
      </p>
      <details className="text-sm text-muted">
        <summary className="cursor-pointer">Content revision</summary>
        <p className="mt-2 break-all font-mono">{entry.contentHash}</p>
        {entry.sourceRevision && (
          <p>
            Source release:{" "}
            <span className="break-all font-mono">{entry.sourceRevision}</span>
          </p>
        )}
        <p>
          Changes to the source question, shared passage or visuals require
          fresh approval.
        </p>
      </details>
      {!approval && (
        <>
          <p className="text-sm text-muted">
            Record your decision only after checking the item and the advisory
            findings. Previewing and submitting answers never records approval.
          </p>
          {(
            [
              [
                "correctness",
                "I checked correctness and the worked explanation.",
              ],
              [
                "originality",
                "I checked originality and resolved originality concerns.",
              ],
              [
                "ageAppropriateness",
                "I checked age appropriateness and resolved difficulty concerns.",
              ],
            ] as const
          ).map(([key, text]) => (
            <label
              key={key}
              className="flex min-h-11 items-center gap-3 text-sm"
            >
              <input
                type="checkbox"
                checked={checks[key]}
                onChange={(event) =>
                  setChecks({ ...checks, [key]: event.target.checked })
                }
              />
              {text}
            </label>
          ))}
          <Button
            variant="secondary"
            disabled={
              !available || pending || !Object.values(checks).every(Boolean)
            }
            onClick={() =>
              startTransition(async () => {
                setMessage("");
                try {
                  const result = await approveDraft({
                    questionId: entry.question.id,
                    contentHash: entry.contentHash,
                    checks,
                  });
                  if (result.error) setMessage(result.error);
                  else if (result.approvedAt && result.approvedBy) {
                    setApproval({
                      approvedAt: result.approvedAt,
                      approvedBy: result.approvedBy,
                    });
                    setMessage(
                      "Your approval was recorded for this revision. Content remains unpublished.",
                    );
                    router.refresh();
                  }
                } catch {
                  setMessage(
                    "Approval was not confirmed. Reload to check its status before retrying.",
                  );
                }
              })
            }
          >
            {pending ? "Recording approval…" : "Record my explicit approval"}
          </Button>
        </>
      )}
      {message && (
        <p role="status" className="text-sm text-ink">
          {message}
        </p>
      )}
    </section>
  );
}

function Findings({ entry }: { entry: ReviewEntry }) {
  const findings = entry.findings;
  return (
    <section
      aria-label="Independent review"
      className="space-y-2 border-t border-royal/15 pt-5"
    >
      <h2 className="font-semibold text-ink">Independent-review findings</h2>
      {entry.governance && (
        <div className="space-y-2">
          <p className="font-semibold">
            Current release status:{" "}
            {entry.governance.bucket.replaceAll("_", " ")}
          </p>
          <p>
            Current difficulty gate: {entry.governance.difficultyGate}.
            Estimator: {entry.governance.estimator}.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {entry.governance.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Governance status is separate from human review approval and
            publication.
          </p>
        </div>
      )}
      {findings ? (
        <>
          <p className="text-sm text-muted">
            Historical advisory review by {findings.reviewer}, 16 October 2026.
            {findings.matchesCurrentRevision === false
              ? "Superseded content: these findings do not describe the current revision."
              : "Historical advisory only: this is not current independent-review or approval evidence."}{" "}
            Recommendations do not grant approval.
          </p>
          {findings.sourceRevision && (
            <details className="text-sm text-muted">
              <summary>Historical finding identity</summary>
              <p className="break-all">Source: {findings.sourceRevision}</p>
              <p className="break-all">
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
          <p className="whitespace-pre-wrap">{findings.notes}</p>
          <details>
            <summary className="cursor-pointer">
              Reviewer answer and working
            </summary>
            <p className="mt-2">Answer: {findings.myAnswer}</p>
            <p className="whitespace-pre-wrap">{findings.working}</p>
          </details>
        </>
      ) : (
        <p className="text-sm text-muted">
          No independent-review findings loaded for this item.
        </p>
      )}
    </section>
  );
}

function Preview({
  entries,
  paper,
  approvalsAvailable,
}: {
  entries: ReviewEntry[];
  paper: boolean;
  approvalsAvailable: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, CandidateAnswer>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const entry = entries[index];
  const question = entry.question;
  const result = outcome(entry, answers[question.id]);
  const scores = entries.map((item) =>
    outcome(item, answers[item.question.id]),
  );
  const key = question.answerKey;
  return (
    <section
      aria-label="Draft preview"
      className="space-y-5 rounded-2xl border border-royal/15 bg-white p-5 sm:p-6"
    >
      <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
        <span>{question.id}</span>
        <span>
          Year {question.yearLevel} · {question.metadata.difficulty} ·{" "}
          {question.metadata.marks} marks
        </span>
      </div>
      {paper && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Paper question{" "}
            <select
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="min-h-11 rounded-xl border border-royal/20 bg-white px-3"
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
      <ExamQuestion
        key={question.id}
        question={presentation(entry)}
        answer={answers[question.id]}
        onAnswerChange={(answer) =>
          setAnswers({ ...answers, [question.id]: answer })
        }
        disabled={submitted}
      />
      <div className="flex flex-wrap gap-3">
        {paper && (
          <>
            <Button
              variant="secondary"
              disabled={index === 0}
              onClick={() => setIndex(index - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={index === entries.length - 1}
              onClick={() => setIndex(index + 1)}
            >
              Next
            </Button>
          </>
        )}
        <Button
          disabled={submitted}
          onClick={() => {
            setSubmitted(true);
            setShowAnswers(true);
          }}
        >
          {paper ? "Submit draft paper" : "Submit preview answer"}
        </Button>
        <Button
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
      </div>
      {submitted && (
        <div className="space-y-3 border-t border-royal/15 pt-5">
          <p role="status" className="font-semibold text-ink">
            Preview total:{" "}
            {scores.reduce((sum, score) => sum + score.awardedMarks, 0)} /{" "}
            {scores.reduce((sum, score) => sum + score.availableMarks, 0)} marks
            {scores.some((score) => score.requiresManualMarking)
              ? " (manual marking required for writing)"
              : ""}
            . No student progress was recorded.
          </p>
          <p>
            This question: {result.status.replaceAll("_", " ")} ·{" "}
            {result.awardedMarks} / {result.availableMarks} marks.
          </p>
          {showAnswers && (
            <>
              <h2 className="font-semibold">Declared answer</h2>
              {key.kind === "single_option" ? (
                <p>
                  {
                    question.options.find(
                      (option) => option.id === key.optionId,
                    )?.text
                  }
                </p>
              ) : (
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm">
                  {JSON.stringify(key, null, 2)}
                </pre>
              )}
              <h2 className="font-semibold">Worked explanation</h2>
              <p className="whitespace-pre-wrap leading-7">
                {question.explanation}
              </p>
              <p className="text-sm text-muted">
                Draft answer keys may contain errors. Inspect the independent
                findings before approval.
              </p>
            </>
          )}
        </div>
      )}
      <Findings entry={entry} />
      <ApprovalPanel
        key={`${question.id}:${entry.contentHash}`}
        entry={entry}
        available={approvalsAvailable}
      />
    </section>
  );
}

export function DraftReview({ catalogue }: { catalogue: ReviewCatalogue }) {
  const [section, setSection] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [reviewStatus, setReviewStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [paperSource, setPaperSource] = useState("");
  const [paper, setPaper] = useState(false);
  const entries = catalogue.entries.filter(
    (entry) =>
      (!section || entry.question.metadata.subject === section) &&
      (!difficulty || entry.question.metadata.difficulty === difficulty) &&
      (!reviewStatus ||
        (reviewStatus.startsWith("release:")
          ? entry.governance?.bucket === reviewStatus.slice(8)
          : reviewStatus === "approved"
            ? Boolean(entry.approval)
            : reviewStatus === "pending"
              ? !entry.approval
              : entry.findings?.recommendation === reviewStatus)) &&
      (!search ||
        `${entry.question.id} ${entry.question.prompt}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  const active =
    entries.find(({ question }) => question.id === selected) ?? entries[0];
  const sources = [...new Set(catalogue.entries.map((entry) => entry.source))];
  const chosenSource =
    paperSource ||
    sources.find((source) => source.includes("scholarship")) ||
    sources[0];
  const paperEntries = catalogue.entries.filter(
    (entry) => entry.source === chosenSource,
  );
  const label = (value: string) =>
    value === "numeracy" ? "Mathematics" : value.replaceAll("_", " ");
  const selectClass =
    "block min-h-12 w-full rounded-xl border border-royal/20 bg-white px-3";
  return (
    <div className="mm-root space-y-6 font-[family-name:var(--font-geist)]">
      <p className="max-w-3xl leading-7 text-muted">
        Try unpublished drafts, preview complete section papers and inspect
        review findings. Answers stay on this page and do not count towards
        student progress. Explicit approval is a separate action; publication
        still requires the governed process.
      </p>
      <p className="text-sm text-muted">
        Scholarship:{" "}
        {
          catalogue.entries.filter((entry) => entry.kind === "scholarship")
            .length
        }{" "}
        draft questions across four sections.
      </p>
      {catalogue.issues.length > 0 && (
        <details className="rounded-xl border border-royal/15 bg-white p-4">
          <summary className="cursor-pointer font-semibold">
            {catalogue.issues.length} loading or validation issues
          </summary>
          <ul className="mt-3 list-disc space-y-2 break-words pl-5 text-sm">
            {catalogue.issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        </details>
      )}
      <div className="flex gap-3">
        <Button
          variant={paper ? "secondary" : "primary"}
          aria-pressed={!paper}
          onClick={() => setPaper(false)}
        >
          Individual questions
        </Button>
        <Button
          variant={paper ? "primary" : "secondary"}
          aria-pressed={paper}
          onClick={() => setPaper(true)}
        >
          Complete draft papers
        </Button>
      </div>
      {paper ? (
        <>
          <label className="block space-y-2 text-sm font-medium">
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
            />
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2 text-sm font-medium">
              Section
              <select
                value={section}
                onChange={(event) => setSection(event.target.value)}
                className={selectClass}
              >
                <option value="">All sections</option>
                {[
                  ...new Set(
                    catalogue.entries.map(
                      ({ question }) => question.metadata.subject,
                    ),
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
            <label className="space-y-2 text-sm font-medium">
              Difficulty
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className={selectClass}
              >
                <option value="">All difficulties</option>
                {[
                  ...new Set(
                    catalogue.entries.map(
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
            <label className="space-y-2 text-sm font-medium">
              Review status
              <select
                value={reviewStatus}
                onChange={(event) => setReviewStatus(event.target.value)}
                className={selectClass}
              >
                <option value="">All statuses</option>
                <option value="pending">Awaiting human approval</option>
                <option value="approved">Human approved</option>
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
              </select>
            </label>
            <label className="space-y-2 text-sm font-medium">
              Question ID or prompt
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={selectClass}
              />
            </label>
          </div>
          <p role="status" className="text-sm text-muted">
            {entries.length} drafts match your filters
          </p>
          {active ? (
            <>
              <label className="block space-y-2 text-sm font-medium">
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
              <Preview
                key={`single:${active.question.id}`}
                entries={[active]}
                paper={false}
                approvalsAvailable={catalogue.approvalsAvailable}
              />
            </>
          ) : (
            <p className="rounded-xl border border-royal/15 bg-white p-6">
              No drafts available for these filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
