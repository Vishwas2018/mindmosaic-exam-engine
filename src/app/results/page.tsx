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
  Repeat,
  RotateCcw,
  X,
} from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { useAuth } from "@/features/auth";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";
import {
  Badge,
  Button,
  Card,
  buttonClasses,
} from "@/components/ui";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import {
  formatCorrectAnswer,
  formatDuration,
  formatResponse,
} from "@/features/exam-engine/components/answer-format";
import { describeConfig, SUBJECT_LABELS } from "@/features/exam-engine/components/describe-config";
import { SessionBadgeRow } from "@/features/exam-engine/components/SessionBadgeRow";
import type { BreakdownRow } from "@/features/exam-engine/scoring";
import { computeSessionBadges } from "@/features/exam-engine/scoring/session-badges";
import { useExamStore } from "@/features/exam-engine/state";

import { ResultsColdLoad } from "./ResultsColdLoad";
import { ResultsHistoryPanel } from "./ResultsHistoryPanel";

const STATUS_LABELS: Record<
  string,
  { label: string; tone: string; icon: typeof Check }
> = {
  correct: { label: "Correct", tone: "bg-success/10 text-success", icon: Check },
  incorrect: { label: "Incorrect", tone: "bg-error/10 text-error", icon: X },
  unanswered: { label: "Not answered", tone: "bg-royal/8 text-muted", icon: Minus },
  manual_review: {
    label: "Marked by a person",
    tone: "bg-warning/10 text-warning",
    icon: ClipboardCheck,
  },
};

/**
 * Score-band verdict headline (09-results.html's verdictText) — computed
 * purely from this attempt's real objectivePercentage, never a placeholder.
 * Sits alongside (not instead of) the exam description, giving an
 * immediate at-a-glance read before the score ring/breakdown lower down.
 */
function verdictHeadline(objectivePercentage: number): { headline: string; sub: string } {
  if (objectivePercentage >= 85) {
    return { headline: "Excellent result", sub: "Strong understanding shown across this exam." };
  }
  if (objectivePercentage >= 70) {
    return { headline: "Solid performance", sub: "Good foundations, with a few areas to strengthen." };
  }
  if (objectivePercentage >= 55) {
    return { headline: "Room to grow", sub: "Building understanding — focused practice will close the gaps." };
  }
  return { headline: "Let's build from here", sub: "This result shows clear areas to target below." };
}

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
      <div
        className="mt-3 overflow-x-auto rounded-2xl border border-royal/8"
        tabIndex={0}
        role="region"
        aria-label={`${title} table, scroll right to see every column`}
      >
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
  const { role } = useAuth();
  /* A signed-in user goes back to their own dashboard; a guest has no
     dashboard to go back to, so the catalogue is their home. */
  const homeHref = role ? roleHomePath(role) : "/practice";
  const homeLabel = role ? `Back to ${roleHomeLabel(role).toLowerCase()}` : "Back to practice";
  const status = useExamStore((state) => state.status);
  const config = useExamStore((state) => state.config);
  /* The full authoring questions — answer keys and explanations included
     — are only ever populated once the exam is submitted, which is
     exactly when this page is allowed to reveal them. */
  const questions = useExamStore((state) => state.reviewQuestions);
  const responses = useExamStore((state) => state.responses);
  const flaggedQuestionIds = useExamStore((state) => state.flaggedQuestionIds);
  const result = useExamStore((state) => state.result);
  const sessionId = useExamStore((state) => state.sessionId);
  const resetExam = useExamStore((state) => state.resetExam);

  /*
   * The design's three-way review filter (screen 10, view 4). It replaces
   * the previous boolean "flagged only" toggle: "Incorrect only" is the
   * filter a student actually reaches for after a paper, and a toggle
   * cannot express three states.
   */
  const [reviewFilter, setReviewFilter] = useState<"all" | "incorrect" | "flagged">("all");

  /*
   * Cold load: the in-memory store holds only the attempt just submitted,
   * so a refresh — or the Results nav item at any other moment — landed
   * here with nothing. For a signed-in student that was a dead end past
   * five finished sessions the dashboard was happily listing.
   *
   * <ResultsColdLoad> fetches the same server-side history and keeps the
   * original empty state for guests and for anyone with nothing finished.
   * The post-submit path below is unchanged.
   */
  if (status !== "submitted" || !result || !config || !questions) {
    return <ResultsColdLoad />;
  }

  const detailById = new Map(
    result.questionDetails.map((detail) => [detail.questionId, detail]),
  );

  /*
   * The design's four summary tiles: Score solid purple, Unanswered solid
   * coral, the middle two outlined. Every value is real — the notes say
   * what the number is rather than restating it.
   */
  const summaryTiles = [
    {
      label: "Score",
      value: `${result.objectiveMarksEarned} / ${result.objectiveMarksAvailable}`,
      note: "Objective marks. Not a scaled band.",
      tone: "brand" as const,
    },
    {
      label: "Time used",
      value: formatDuration(result.timeTakenSeconds),
      note:
        result.submissionReason === "timer_expired"
          ? "Time ran out — submitted automatically"
          : "Submitted before time was up",
      tone: "outline" as const,
    },
    {
      label: "Flagged",
      value: String(flaggedQuestionIds.length),
      note:
        flaggedQuestionIds.length === 0
          ? "Nothing was marked to come back to"
          : "Marked to come back to before submitting",
      tone: "outline" as const,
    },
    {
      label: "Unanswered",
      value: String(result.unansweredCount),
      note:
        result.unansweredCount === 0
          ? "Every question was attempted"
          : "Left blank when the paper was submitted",
      tone: "coral" as const,
    },
  ];

  const incorrectIds = new Set(
    result.questionDetails
      .filter((detail) => detail.status === "incorrect")
      .map((detail) => detail.questionId),
  );

  const reviewQuestions =
    reviewFilter === "flagged"
      ? questions.filter((question) => flaggedQuestionIds.includes(question.id))
      : reviewFilter === "incorrect"
        ? questions.filter((question) => incorrectIds.has(question.id))
        : questions;

  const reviewFilters = [
    { id: "all" as const, label: "All", count: questions.length },
    { id: "incorrect" as const, label: "Incorrect only", count: incorrectIds.size },
    { id: "flagged" as const, label: "Flagged", count: flaggedQuestionIds.length },
  ];

  /* By-skill bars, from the same breakdown the table below reads. */
  const skillRows = Object.entries(result.breakdowns.bySkill)
    .map(([key, row]) => ({
      key,
      label: dimensionLabel(key),
      earned: row.objectiveMarksEarned,
      available: row.objectiveMarksAvailable,
      percent:
        row.objectiveMarksAvailable > 0
          ? Math.round((row.objectiveMarksEarned / row.objectiveMarksAvailable) * 100)
          : null,
    }))
    .filter((row) => row.percent !== null)
    .sort((a, b) => (a.percent ?? 0) - (b.percent ?? 0));

  const handleRestart = () => {
    resetExam();
    router.push("/practice");
  };

  /* Same action as "Try another exam" today — resetExam() clears the
     session and the configurator always opens with its own defaults, since
     it doesn't read config back from the URL. The distinct label sets the
     right expectation ("something like this") without promising the exact
     same filters carry over. */
  const handlePracticeSimilar = () => {
    resetExam();
    router.push("/practice");
  };

  const mixedYear = config.yearLevel === "mixed";
  const mixedStyle = config.examStyle === "mixed";
  const verdict = verdictHeadline(result.objectivePercentage);

  return (
    <div className="min-h-screen bg-page">
      {/*
        The shared product header, not a bare logo strip.

        This page used to end the whole exam journey in a cul-de-sac: the only
        control in its header was a logo labelled "MindMosaic home" that
        actually went to /practice, so a student who had just finished a paper
        had no route to their own dashboard, their assignments or their
        progress — the way "back" was the marketing site. AppHeader gives the
        same Practice / Learn / Results / Help nav and the same role-aware
        profile menu as every other product screen.
      */}
      <div className="print:hidden">
        <AppHeader />
      </div>
      <div className="site-width flex justify-end pt-4 print:hidden">
        <Badge variant="success">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
          Exam complete
        </Badge>
      </div>

      <main id="main-content" className="site-width py-10 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-royal">
              {verdict.headline}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] text-ink sm:text-5xl">
              Your results
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-muted">
              {describeConfig(config)}
            </p>
            <p className="mx-auto mt-1 max-w-2xl text-sm leading-6 text-muted">{verdict.sub}</p>
            <SessionBadgeRow badges={computeSessionBadges(result)} />
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

                {/*
                  Each card is a plain <div> — not a <dl> child — because a
                  <dl>'s content model only permits dt/dd groups (optionally
                  each wrapped in its own <div>) plus script-supporting
                  elements as DIRECT children. The icon square sitting
                  alongside the dt/dd pair would violate that if the icon
                  and the dt/dd wrapper were siblings inside one shared
                  <dl>; each card instead owns its own single-pair <dl>
                  scoped to just its label/value, with the icon outside it.
                */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {summaryTiles.map((tile) => (
                    <div
                      key={tile.label}
                      className={`rounded-2xl p-[18px] ${
                        tile.tone === "brand"
                          ? "bg-mm-brand text-white"
                          : tile.tone === "coral"
                            ? /* Ink on coral, not white: white on #FF555A is
                                 3.03:1 and fails AA. See the same note in
                                 features/landing/components/Quality.tsx. */
                              "bg-mm-coral text-mm-ink"
                            : "border border-mm-line bg-mm-page text-mm-ink"
                      }`}
                    >
                      {/* Source order is dt then dd (the label describes the
                          value that follows it); flex-col-reverse keeps the
                          value above the label visually. */}
                      {/* On coral, ink stays at full opacity: /80 measured
                          4.39:1 and /75 measured 4.02:1, both below AA and
                          both reported by axe as serious at 390 and 1440
                          (audit finding H-04). Full ink is 5.75:1. The
                          brand tile's white/80 and white/75 are 8.03:1 and
                          7.35:1 on #5925A8 and are left alone. */}
                      <dl className="flex flex-col-reverse">
                        <dt
                          className={`mt-1 text-sm font-semibold ${
                            tile.tone === "brand"
                              ? "text-white/80"
                              : tile.tone === "coral"
                                ? "text-mm-ink"
                                : "text-muted"
                          }`}
                        >
                          {tile.label}
                        </dt>
                        <dd className="font-display text-[26px] font-extrabold tracking-[-0.03em] tabular-nums">
                          {tile.value}
                        </dd>
                      </dl>
                      <p
                        className={`mt-2 text-xs leading-5 ${
                          tile.tone === "brand"
                            ? "text-white/75"
                            : tile.tone === "coral"
                              ? "text-mm-ink"
                              : "text-muted"
                        }`}
                      >
                        {tile.note}
                      </p>
                    </div>
                  ))}
                </div>

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

          <ResultsHistoryPanel
            subject={config.subject}
            sessionId={sessionId}
            currentScorePercent={
              result.objectiveMarksAvailable > 0 ? result.objectivePercentage : null
            }
          />

          {/* Design handoff screen 10, view 4: readiness by skill, read at a
              glance, above the full breakdown tables rather than instead of
              them. Weakest first — the order a student acts on. */}
          {skillRows.length > 0 && (
            <Card className="mt-6 p-6 sm:p-8" variant="default">
              <h2 className="text-2xl font-black tracking-[-0.03em] text-ink">By skill</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                Objective marks earned against marks available, weakest first. Writing tasks a
                person marks are excluded.
              </p>
              <ul className="mt-6 space-y-3.5">
                {skillRows.map((row) => (
                  <li key={row.key} className="grid gap-[7px]">
                    <div className="flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-ink">{row.label}</span>
                      <span className="tabular-nums text-muted">
                        {row.earned} of {row.available} · {row.percent}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-mm-line-soft">
                      <div
                        className={`h-full rounded-sm ${
                          (row.percent ?? 0) >= 70
                            ? "bg-mm-brand"
                            : (row.percent ?? 0) >= 55
                              ? "bg-mm-lilac"
                              : "bg-mm-coral"
                        }`}
                        style={{ width: `${row.percent ?? 0}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          )}

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
              {/* The design's three-way filter, as a tablist so the
                  selected state is exposed rather than implied by colour. */}
              <div
                role="tablist"
                aria-label="Filter the question review"
                className="flex flex-wrap gap-2"
              >
                {reviewFilters.map((filter) => {
                  const selected = filter.id === reviewFilter;
                  return (
                    <button
                      key={filter.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setReviewFilter(filter.id)}
                      data-testid={`review-filter-${filter.id}`}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-[10px] border px-4 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                        selected
                          ? "border-mm-brand bg-mm-brand text-white"
                          : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand"
                      }`}
                    >
                      {filter.id === "flagged" && (
                        <Flag
                          aria-hidden="true"
                          className="h-4 w-4"
                          fill={selected ? "currentColor" : "none"}
                        />
                      )}
                      {filter.label}
                      <span className="tabular-nums opacity-70">{filter.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {reviewQuestions.length === 0 ? (
              <p className="mt-6 rounded-xl bg-page px-4 py-6 text-center text-sm font-semibold text-muted">
                {reviewFilter === "flagged"
                  ? "You did not flag any questions in this exam."
                  : "Nothing was marked incorrect in this exam."}
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
                      /* Incorrect rows tint, as the design specifies — but
                         the status chip below still says "Incorrect" in
                         words, so the tint is reinforcement, not the
                         signal. */
                      className={`rounded-2xl border border-royal/10 p-5 sm:p-6 ${
                        detail.status === "incorrect" ? "bg-[#FFFBFB]" : ""
                      }`}
                      data-testid={`review-question-${index + 1}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-extrabold uppercase tracking-[0.08em] text-royal">
                            Question {index + 1}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold ${statusInfo.tone}`}
                            data-testid={`review-status-${index + 1}`}
                          >
                            <statusInfo.icon aria-hidden="true" className="h-3.5 w-3.5" />
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
            {/*
              Was "Return home" pointing unconditionally at /practice — a
              label that named one destination and a link that went to
              another, and for a signed-in student the one place they most
              want after finishing a paper (their own dashboard) was not
              reachable from this screen at all. Now it says where it goes,
              and for a signed-in user that is their role's home.
            */}
            <Link
              href={homeHref}
              data-testid="results-home-link"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              {homeLabel}
            </Link>
            <Button
              variant="orange"
              size="lg"
              onClick={handlePracticeSimilar}
              data-testid="practice-similar-again"
            >
              <Repeat aria-hidden="true" className="h-5 w-5" />
              Practice {SUBJECT_LABELS[config.subject]} again
            </Button>
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
