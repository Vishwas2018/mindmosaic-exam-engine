"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Clock3,
  Flag,
  Minus,
  Printer,
  RotateCcw,
  X,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  buttonClasses,
} from "@/components/ui";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import {
  formatCorrectAnswer,
  formatDuration,
  formatResponse,
} from "@/features/exam-engine/components/answer-format";
import { describeConfig } from "@/features/exam-engine/components/describe-config";
import type { BreakdownRow } from "@/features/exam-engine/scoring";
import { useExamStore } from "@/features/exam-engine/state";

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  correct: { label: "Correct", tone: "bg-success/10 text-success" },
  incorrect: { label: "Incorrect", tone: "bg-error/10 text-error" },
  unanswered: { label: "Not answered", tone: "bg-royal/8 text-muted" },
  manual_review: { label: "Marked by a person", tone: "bg-warning/10 text-warning" },
};

const DIMENSION_LABELS: Record<string, string> = {
  multiple_choice: "Multiple choice",
  multiple_select: "Multiple select",
  number_entry: "Number entry",
  fill_blank: "Fill in the blank",
  dropdown: "Dropdown",
  true_false: "True or false",
  matching: "Matching",
  ordering: "Ordering",
  short_answer: "Short answer",
  reading_comprehension: "Reading comprehension",
  essay: "Essay",
  label_diagram: "Label the diagram",
  hotspot: "Hotspot",
  drag_drop: "Drag and drop",
  numeracy: "Numeracy",
  reading: "Reading",
  writing: "Writing",
  language_conventions: "Language conventions",
  easy: "Easy",
  medium: "Medium",
  challenging: "Challenging",
  "year-3": "Grade 3",
  "year-5": "Grade 5",
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
};

function dimensionLabel(key: string): string {
  return DIMENSION_LABELS[key] ?? key;
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: Readonly<Record<string, BreakdownRow>>;
}) {
  const entries = Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return null;
  return (
    <div>
      <h3 className="text-lg font-extrabold text-ink">{title}</h3>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-royal/8">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-page text-xs font-extrabold uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3">Group</th>
              <th scope="col" className="px-3 py-3 text-right">Total</th>
              <th scope="col" className="px-3 py-3 text-right">Attempted</th>
              <th scope="col" className="px-3 py-3 text-right">Correct</th>
              <th scope="col" className="px-3 py-3 text-right">Incorrect</th>
              <th scope="col" className="px-3 py-3 text-right">Unanswered</th>
              <th scope="col" className="px-3 py-3 text-right">Manual review</th>
              <th scope="col" className="px-4 py-3 text-right">Objective marks</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, row]) => (
              <tr key={key} className="border-t border-royal/8">
                <th scope="row" className="px-4 py-3 font-bold text-ink">
                  {dimensionLabel(key)}
                </th>
                <td className="px-3 py-3 text-right tabular-nums">{row.total}</td>
                <td className="px-3 py-3 text-right tabular-nums">{row.attempted}</td>
                <td className="px-3 py-3 text-right tabular-nums text-success">
                  {row.correct}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-error">
                  {row.incorrect}
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{row.unanswered}</td>
                <td className="px-3 py-3 text-right tabular-nums">{row.manualReview}</td>
                <td className="px-4 py-3 text-right tabular-nums font-bold">
                  {row.objectiveMarksEarned}/{row.objectiveMarksAvailable}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const status = useExamStore((state) => state.status);
  const config = useExamStore((state) => state.config);
  /* The full authoring questions — answer keys and explanations included
     — are only ever populated once the exam is submitted, which is
     exactly when this page is allowed to reveal them. */
  const questions = useExamStore((state) => state.reviewQuestions);
  const responses = useExamStore((state) => state.responses);
  const flaggedQuestionIds = useExamStore((state) => state.flaggedQuestionIds);
  const result = useExamStore((state) => state.result);
  const resetExam = useExamStore((state) => state.resetExam);

  const [flaggedOnly, setFlaggedOnly] = useState(false);

  if (status !== "submitted" || !result || !config || !questions) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="No results to show yet"
          description="Finish an exam to see your results here."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Set up an exam
            </Link>
          }
        />
      </main>
    );
  }

  const summaryCards = [
    { label: "Correct", value: result.correctCount, icon: Check, tone: "bg-success/10 text-success" },
    { label: "Incorrect", value: result.incorrectCount, icon: X, tone: "bg-error/10 text-error" },
    { label: "Not answered", value: result.unansweredCount, icon: Minus, tone: "bg-royal/8 text-muted" },
    { label: "Manual review", value: result.manualReviewQuestions, icon: ClipboardCheck, tone: "bg-warning/10 text-warning" },
  ] as const;

  const detailById = new Map(
    result.questionDetails.map((detail) => [detail.questionId, detail]),
  );
  const reviewQuestions = flaggedOnly
    ? questions.filter((question) => flaggedQuestionIds.includes(question.id))
    : questions;

  const handleRestart = () => {
    resetExam();
    router.push("/");
  };

  const mixedYear = config.yearLevel === "mixed";
  const mixedStyle = config.examStyle === "mixed";

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white print:hidden">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <Badge variant="success">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Exam complete
          </Badge>
        </div>
      </header>

      <main id="main-content" className="site-width py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h1 className="text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
              Your results
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted">
              {describeConfig(config)}
            </p>
          </div>

          <Card className="mt-9 overflow-hidden" variant="default">
            <div className="grid lg:grid-cols-[0.78fr_1.22fr]">
              <section className="flex flex-col items-center justify-center bg-royal px-6 py-10 text-white sm:py-12">
                <div
                  className="score-ring relative"
                  role="img"
                  aria-label={`Objective score: ${result.objectivePercentage} percent, ${result.objectiveMarksEarned} of ${result.objectiveMarksAvailable} objective marks`}
                >
                  <div className="score-ring-content">
                    <span
                      className="block text-4xl font-black tracking-[-0.04em] text-royal"
                      data-testid="objective-percentage"
                    >
                      {result.objectivePercentage}%
                    </span>
                    <span className="mt-1 block text-sm font-bold text-muted">
                      {result.objectiveMarksEarned} of {result.objectiveMarksAvailable} marks
                    </span>
                  </div>
                </div>
                <h2 className="mt-7 text-2xl font-black">Objective score</h2>
                <p className="mt-2 max-w-sm text-center text-sm leading-6 text-white/80">
                  {result.manualReviewQuestions > 0
                    ? `Writing tasks (${result.manualReviewQuestions}) are marked by a person and are not counted in this percentage.`
                    : "Every question in this exam was marked automatically."}
                </p>
              </section>

              <section className="p-6 sm:p-9" aria-labelledby="summary-heading">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <h2 id="summary-heading" className="text-2xl font-black text-ink">
                    Performance summary
                  </h2>
                  <div className="inline-flex items-center gap-2 self-start rounded-xl bg-page px-4 py-3 text-sm font-bold text-muted">
                    <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
                    <span data-testid="time-taken">
                      Time taken: {formatDuration(result.timeTakenSeconds)}
                    </span>
                  </div>
                </div>

                <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summaryCards.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-2xl border border-royal/8 p-4">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${item.tone}`}>
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </div>
                        {/* Source order is dt then dd (correct semantics: the
                            label describes the value that follows it);
                            flex-col-reverse keeps the value shown above the
                            label visually, matching the original design. */}
                        <div className="mt-4 flex flex-col-reverse">
                          <dt className="mt-0.5 text-sm font-semibold text-muted">
                            {item.label}
                          </dt>
                          <dd className="text-2xl font-black text-ink">{item.value}</dd>
                        </div>
                      </div>
                    );
                  })}
                </dl>

                <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-muted">Total questions</dt>
                    <dd className="font-black tabular-nums" data-testid="result-total">
                      {result.totalQuestions}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-muted">Attempted</dt>
                    <dd className="font-black tabular-nums" data-testid="result-attempted">
                      {result.attemptedQuestions}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-muted">Marked automatically</dt>
                    <dd className="font-black tabular-nums">{result.autoMarkedQuestions}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-muted">Pending manual marks</dt>
                    <dd className="font-black tabular-nums">{result.pendingManualMarks}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-semibold text-muted">How it ended</dt>
                    <dd className="font-black" data-testid="submission-reason">
                      {result.submissionReason === "timer_expired"
                        ? "Time ran out (auto-submitted)"
                        : "Submitted by you"}
                    </dd>
                  </div>
                </dl>
              </section>
            </div>
          </Card>

          <Card className="mt-6 space-y-8 p-6 sm:p-8" variant="default">
            <div>
              <Badge variant="purple">Breakdowns</Badge>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">
                Where your marks came from
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Objective marks exclude writing tasks that a person marks. A group
                with no objective marks shows 0/0.
              </p>
            </div>
            <BreakdownTable title="By question type" rows={result.breakdowns.byQuestionType} />
            <BreakdownTable title="By subject" rows={result.breakdowns.bySubject} />
            <BreakdownTable title="By skill" rows={result.breakdowns.bySkill} />
            <BreakdownTable title="By difficulty" rows={result.breakdowns.byDifficulty} />
            {mixedYear && (
              <BreakdownTable title="By year level" rows={result.breakdowns.byYearLevel} />
            )}
            {mixedStyle && (
              <BreakdownTable title="By exam style" rows={result.breakdowns.byExamStyle} />
            )}
          </Card>

          <Card className="mt-6 p-6 sm:p-8" variant="default">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <Badge variant="orange">Question review</Badge>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-ink">
                  Every question, explained
                </h2>
              </div>
              <Button
                variant={flaggedOnly ? "orange" : "secondary"}
                size="sm"
                onClick={() => setFlaggedOnly((current) => !current)}
                aria-pressed={flaggedOnly}
                data-testid="toggle-flagged-only"
              >
                <Flag aria-hidden="true" className="h-4 w-4" fill={flaggedOnly ? "currentColor" : "none"} />
                {flaggedOnly
                  ? `Showing flagged (${flaggedQuestionIds.length})`
                  : "Review flagged questions"}
              </Button>
            </div>

            {reviewQuestions.length === 0 ? (
              <p className="mt-6 rounded-xl bg-page px-4 py-6 text-center text-sm font-semibold text-muted">
                You did not flag any questions in this exam.
              </p>
            ) : (
              <ol className="mt-7 space-y-6">
                {reviewQuestions.map((question) => {
                  const index = questions.indexOf(question);
                  const detail = detailById.get(question.id);
                  if (!detail) return null;
                  const statusInfo = STATUS_LABELS[detail.status];
                  const submitted = formatResponse(question, responses[question.id]);
                  const correctAnswer = formatCorrectAnswer(question);
                  const wasFlagged = flaggedQuestionIds.includes(question.id);

                  return (
                    <li
                      key={question.id}
                      className="rounded-2xl border border-royal/10 p-5 sm:p-6"
                      data-testid={`review-question-${index + 1}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold uppercase tracking-[0.08em] text-royal">
                            Question {index + 1}
                          </span>
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-extrabold ${statusInfo.tone}`}
                            data-testid={`review-status-${index + 1}`}
                          >
                            {statusInfo.label}
                          </span>
                          {wasFlagged && (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-extrabold text-warning">
                              <Flag aria-hidden="true" className="h-3 w-3" fill="currentColor" />
                              Flagged
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-muted">
                          Grade {question.yearLevel} ·{" "}
                          <span className="capitalize">
                            {question.metadata.subject.replace("_", " ")}
                          </span>{" "}
                          · {question.metadata.skill ?? question.metadata.topic} ·{" "}
                          <span className="capitalize">{question.metadata.difficulty}</span>
                          {" · "}
                          {detail.pendingManualReview
                            ? `${detail.availableMarks} marks pending review`
                            : `${detail.awardedMarks}/${detail.availableMarks} marks`}
                        </span>
                      </div>

                      <p className="mt-4 text-base font-bold leading-7 text-ink">
                        {question.prompt}
                      </p>

                      {question.stimulus && (
                        <details className="mt-3 rounded-xl bg-page p-4 text-sm leading-6 text-muted">
                          <summary className="cursor-pointer font-bold text-ink">
                            {question.stimulus.title ?? "Reading passage"}
                          </summary>
                          <p className="mt-2 whitespace-pre-wrap">{question.stimulus.body}</p>
                        </details>
                      )}

                      {question.visuals.length > 0 && (
                        <div className="mt-4 rounded-2xl border border-royal/8 bg-page p-3 sm:p-4">
                          {question.visuals.map((visual) => (
                            <VisualRenderer key={visual.id} visual={visual} />
                          ))}
                        </div>
                      )}

                      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-page p-4">
                          <dt className="text-xs font-extrabold uppercase tracking-wide text-muted">
                            Your answer
                          </dt>
                          <dd className="mt-1.5 text-sm font-semibold text-ink">
                            {submitted ?? "Not answered"}
                          </dd>
                        </div>
                        {detail.requiresManualMarking ? (
                          <div className="rounded-xl bg-warning/8 p-4">
                            <dt className="text-xs font-extrabold uppercase tracking-wide text-warning">
                              Marked by a person
                            </dt>
                            <dd className="mt-1.5 text-sm font-semibold text-ink">
                              Writing tasks have no single correct answer. A marker
                              uses the rubric to award up to {detail.availableMarks} marks.
                            </dd>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-success/8 p-4">
                            <dt className="text-xs font-extrabold uppercase tracking-wide text-success">
                              Correct answer
                            </dt>
                            <dd className="mt-1.5 text-sm font-semibold text-ink">
                              {correctAnswer}
                            </dd>
                          </div>
                        )}
                      </dl>

                      <div className="mt-4 rounded-xl border border-royal/8 p-4">
                        <h3 className="text-xs font-extrabold uppercase tracking-wide text-royal">
                          Explanation
                        </h3>
                        <p className="mt-1.5 text-sm leading-6 text-muted">
                          {question.explanation}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Card>

          <div className="mt-8 flex flex-col justify-center gap-3 print:hidden sm:flex-row">
            <Button variant="secondary" size="lg" onClick={() => window.print()}>
              <Printer aria-hidden="true" className="h-5 w-5" />
              Print results
            </Button>
            <Link href="/" className={buttonClasses({ variant: "secondary", size: "lg" })}>
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              Return home
            </Link>
            <Button
              variant="primary"
              size="lg"
              onClick={handleRestart}
              data-testid="try-another-exam"
            >
              <RotateCcw aria-hidden="true" className="h-5 w-5" />
              Try another exam
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
