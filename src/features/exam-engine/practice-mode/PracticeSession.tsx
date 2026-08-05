"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Flag, Home, RotateCcw, SkipForward, Trophy } from "lucide-react";
import { clsx } from "clsx";

import { MindMosaicLogo } from "@/components/branding";
import { EmptyState, buttonClasses } from "@/components/ui";
import type { Question } from "@/schemas/question.schema";

import { formatCorrectAnswer, formatResponse } from "../components/answer-format";
import { ExamQuestion } from "../components/ExamQuestion";
import { isUnanswered } from "../scoring";
import { toCandidateQuestion } from "../types";
import type { CandidateAnswer } from "../types";

import {
  resultFor,
  type PracticeQuestionStatus,
  type PracticeState,
} from "./practice-reducer";
import { usePracticeSession } from "./use-practice-session";

/**
 * Practice — design handoff screen 9. Untimed, immediate feedback,
 * deliberately distinct from the exam engine at /exam, which withholds
 * everything until submission (docs/ASSESSMENT_SECURITY_MODEL.md).
 *
 * The design's structure is followed throughout: the 72px header with a
 * truncating skill breadcrumb and a `flex:none` 230px progress block, the
 * `1fr / 320px` body, the type badge and flag control, the explanation
 * panel that animates in, the question strip under the card and the three
 * sidebar panels.
 *
 * Reconciled where the design assumed things this engine does not have
 * (DESIGN_AUDIT.md §10):
 *
 *  - **Options are not always four lettered buttons.** The design draws one
 *    multiple-choice question. This engine renders 14 question types
 *    through <ExamQuestion>, which also owns the prompt (every renderer
 *    puts it in its own <legend> or heading). So this screen owns the
 *    chrome and the renderer owns the question — rather than a second copy
 *    of the prompt as an <h1> above it, which is what following the design
 *    literally would produce.
 *  - **No numbered step tiles.** A question carries one written
 *    `explanation` field; there is no per-step breakdown in the schema.
 *    Splitting one paragraph into four tiles would be fabricating content.
 *  - **"Read the lesson" is omitted.** There are no lessons to link to
 *    (DESIGN_AUDIT.md §9); the Learning Hub takes that slot.
 */

export interface PracticeSessionProps {
  questions: readonly Question[];
  /** Skill or subject name shown in the header, e.g. "Fractions". */
  title: string;
  /** Where "Exit" returns to. */
  exitHref: string;
}

const STATUS_COPY: Record<
  PracticeQuestionStatus,
  { label: string; tone: string; badge: string }
> = {
  correct: {
    label: "Correct",
    tone: "border-mm-tint-line-strong bg-mm-wash",
    badge: "text-mm-brand",
  },
  incorrect: {
    label: "Not quite",
    tone: "border-mm-alert-line bg-mm-alert",
    badge: "text-mm-coral-text",
  },
  unanswered: {
    label: "You didn't answer this one",
    tone: "border-mm-line bg-mm-page",
    badge: "text-mm-muted",
  },
  manual_review: {
    label: "We'll mark this one for you",
    tone: "border-mm-tint-line bg-mm-tint",
    badge: "text-mm-brand",
  },
  skipped: {
    label: "Skipped",
    tone: "border-mm-line bg-mm-page",
    badge: "text-mm-muted",
  },
};

/** Human label for a question's type, for the badge and the sidebar chips. */
function typeLabel(question: Question): string {
  return question.type
    .replace(/_/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

function ExplanationPanel({
  question,
  status,
  answer,
  onNext,
  onRetry,
  isLast,
}: {
  question: Question;
  status: PracticeQuestionStatus;
  answer: CandidateAnswer | undefined;
  onNext: () => void;
  onRetry: () => void;
  isLast: boolean;
}) {
  const copy = STATUS_COPY[status];
  const correctAnswer = formatCorrectAnswer(question);
  const yourAnswer = formatResponse(question, answer);
  const showCorrectAnswer =
    (status === "incorrect" || status === "unanswered") && correctAnswer !== null;

  return (
    <div
      role="status"
      data-testid="feedback-panel"
      data-status={status}
      className={clsx("mm-rise-fast grid gap-3 rounded-[14px] border p-[22px]", copy.tone)}
    >
      <p
        className={clsx(
          "font-mono text-[11.5px] font-bold uppercase tracking-[0.06em]",
          copy.badge,
        )}
      >
        {copy.label}
      </p>

      {status === "incorrect" && yourAnswer && (
        <p className="text-[15px] font-semibold text-mm-ink">
          Your answer: <span className="font-bold">{yourAnswer}</span>
        </p>
      )}
      {showCorrectAnswer && (
        <p className="text-[15px] font-semibold text-mm-ink">
          Correct answer: <span className="font-bold">{correctAnswer}</span>
        </p>
      )}

      {question.explanation && (
        <>
          <h2 className="text-[17.5px] font-bold text-mm-ink">Why</h2>
          <p className="text-[15.5px] leading-[1.65] text-mm-ink-soft">{question.explanation}</p>
        </>
      )}

      <div className="mt-1.5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onNext}
          data-testid="next-question"
          className="inline-flex min-h-12 items-center rounded-[11px] bg-mm-brand px-[22px] text-[15px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
        >
          {isLast ? "View results" : "Next question"}
        </button>
        <button
          type="button"
          onClick={onRetry}
          data-testid="retry-question"
          className="inline-flex min-h-12 items-center gap-2 rounded-[11px] border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/resources"
          className="inline-flex min-h-12 items-center rounded-[11px] border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
        >
          Learning Hub
        </Link>
      </div>
    </div>
  );
}

function SummaryView({
  state,
  title,
  exitHref,
  onRestart,
}: {
  state: PracticeState;
  title: string;
  exitHref: string;
  onRestart: () => void;
}) {
  const correct = state.results.filter((r) => r.status === "correct").length;
  const incorrect = state.results.filter((r) => r.status === "incorrect").length;
  const skipped = state.results.filter((r) => r.status === "skipped").length;
  const scored = correct + incorrect;
  const accuracy = scored > 0 ? Math.round((correct / scored) * 100) : 0;

  const insight =
    scored === 0
      ? "Nothing to score in this session — try answering a few questions next time."
      : accuracy >= 85
        ? `Outstanding session — ${correct} of ${scored} scored correct, with a best streak of ${state.bestStreak}.`
        : accuracy >= 60
          ? `Solid progress — ${accuracy}% correct with a best streak of ${state.bestStreak}. One more session should lock this in.`
          : `Keep practising — ${accuracy}% correct this time. Review the explanations below for the patterns to focus on.`;

  return (
    <div className="mm-root min-h-screen bg-mm-page text-mm-ink">
      <div className="mx-auto max-w-[720px] px-[clamp(20px,4vw,64px)] py-10 sm:py-14">
        <div className="text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-brand">
            Session complete
          </p>
          <h1 className="mt-3 text-[clamp(28px,3vw,38px)] font-bold leading-[1.1] text-mm-ink">
            Nice work
          </h1>
          <p className="mt-2 text-[15.5px] leading-[1.6] text-mm-muted">
            Here&apos;s how you did on {title}.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-4 rounded-[18px] border border-mm-line bg-white p-7 text-center">
          <div>
            <p
              className="font-[family-name:var(--font-display)] text-[32px] font-extrabold tabular-nums text-mm-brand"
              data-testid="summary-accuracy"
            >
              {accuracy}%
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-mm-muted">
              Accuracy
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-[32px] font-extrabold tabular-nums text-mm-ink">
              {correct}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-mm-muted">
              Correct
            </p>
          </div>
          <div>
            <p className="font-[family-name:var(--font-display)] text-[32px] font-extrabold tabular-nums text-mm-ink">
              {state.results.length}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-mm-muted">
              Questions
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-4 rounded-[18px] border border-mm-tint-line-strong bg-mm-wash p-5">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mm-tint text-mm-brand"
          >
            <Trophy className="h-5 w-5" />
          </span>
          <p className="text-[15px] leading-[1.6] text-mm-ink">{insight}</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-[18px] border border-mm-line bg-white">
          <div className="border-b border-mm-line-soft px-5 py-4">
            <h2 className="text-[16.5px] font-bold text-mm-ink">Question review</h2>
            <p className="mt-0.5 text-[13px] font-semibold text-mm-muted">
              {correct} correct · {incorrect} incorrect
              {skipped > 0 ? ` · ${skipped} skipped` : ""}
            </p>
          </div>
          <ol>
            {state.questions.map((question, index) => {
              const result = resultFor(state, question.id);
              if (!result) return null;
              const copy = STATUS_COPY[result.status];
              return (
                <li
                  key={question.id}
                  data-testid={`practice-review-${index + 1}`}
                  className="flex items-start gap-3 border-t border-mm-line-soft px-5 py-4 first:border-t-0"
                >
                  <span className="w-8 shrink-0 text-[13px] font-bold text-mm-muted">
                    Q{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-mm-ink">{question.prompt}</p>
                    <p className={clsx("mt-0.5 text-xs font-bold", copy.badge)}>{copy.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRestart}
            data-testid="practice-again"
            className="inline-flex min-h-13 items-center gap-2 rounded-[11px] bg-mm-brand px-6 text-base font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            <RotateCcw aria-hidden="true" className="h-5 w-5" />
            Practice again
          </button>
          <Link href={exitHref} className={buttonClasses({ variant: "secondary", size: "lg" })}>
            Back to Learn
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PracticeSession({ questions, title, exitHref }: PracticeSessionProps) {
  const {
    state,
    setAnswer,
    checkAnswer,
    skip,
    next,
    toggleFlag,
    retry,
    goTo,
    endSession,
    restart,
  } = usePracticeSession(questions);

  const headingRef = useRef<HTMLParagraphElement>(null);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [state.currentIndex]);

  const correctCount = state.results.filter((result) => result.status === "correct").length;
  const answeredCount = state.results.length;

  /* The distinct question types in the set, for the sidebar chips. */
  const typesInSet = useMemo(() => {
    const seen = new Set<string>();
    for (const item of state.questions) seen.add(typeLabel(item));
    return [...seen];
  }, [state.questions]);

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions match this practice set"
        description="Try a different subject or skill from the Learning Hub."
        action={
          <Link href={exitHref} className={buttonClasses({ variant: "primary" })}>
            Back to Learn
          </Link>
        }
      />
    );
  }

  if (state.phase === "summary") {
    return <SummaryView state={state} title={title} exitHref={exitHref} onRestart={restart} />;
  }

  const question = state.questions[state.currentIndex];
  const candidateQuestion = toCandidateQuestion(question);
  const answer = state.answers[question.id];
  const isChecked = state.phase === "checked";
  const currentResult = resultFor(state, question.id);
  const isLast = state.currentIndex === state.questions.length - 1;
  const isFlagged = state.flagged.includes(question.id);
  const progressPercent = Math.round((answeredCount / state.questions.length) * 100);

  return (
    <div className="mm-root grid min-h-screen grid-rows-[auto_1fr] bg-mm-page text-mm-ink">
      <header className="sticky top-0 z-20 flex h-[72px] items-center gap-[clamp(16px,2vw,28px)] border-b border-mm-line bg-white px-[clamp(20px,3vw,40px)]">
        <Link
          href="/"
          aria-label="MindMosaic home"
          className="flex-none rounded-lg focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
        >
          <MindMosaicLogo size={34} />
        </Link>

        <div className="grid min-w-0 flex-auto gap-0.5 border-l border-mm-line pl-[clamp(8px,1.4vw,20px)]">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-mm-brand">
            Practice · no timer
          </p>
          <p className="truncate text-[15.5px] font-bold text-mm-ink">{title}</p>
        </div>

        <div className="ml-auto flex flex-none items-center gap-3.5">
          {/* `flex:none`, fixed width, `white-space: nowrap` — exactly as the
              design specifies, so a long skill name in the breadcrumb can
              never be what reflows the header. */}
          <div className="hidden w-[230px] flex-none gap-[5px] md:grid">
            <p className="flex justify-between gap-3 whitespace-nowrap text-[12.5px] text-mm-muted">
              <span>
                Question {state.currentIndex + 1} of {state.questions.length}
              </span>
              <span>{correctCount} correct so far</span>
            </p>
            <span className="block h-2 overflow-hidden rounded-sm bg-mm-line-soft">
              <span
                className="block h-full rounded-sm bg-mm-brand transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[42px] items-center gap-2 rounded-[10px] border border-mm-line bg-white px-3.5 text-sm font-semibold text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            <span className="hidden lg:inline">Home</span>
          </Link>
          <Link
            href={exitHref}
            data-testid="exit-practice"
            className="inline-flex min-h-[42px] items-center rounded-[10px] border border-mm-line bg-white px-4 text-sm font-semibold text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            Exit
          </Link>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto grid w-full max-w-[1440px] items-start gap-[clamp(18px,2vw,28px)] px-[clamp(20px,3vw,40px)] pb-14 pt-[clamp(20px,2.4vw,32px)] xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="grid min-w-0 gap-[clamp(16px,1.8vw,22px)]">
          <article className="grid gap-5 rounded-[18px] border border-mm-line bg-white p-[clamp(22px,2.2vw,32px)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <p
                ref={headingRef}
                tabIndex={-1}
                className="rounded-[7px] bg-mm-tint px-2.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-mm-brand outline-none"
              >
                Question {state.currentIndex + 1} · {typeLabel(question)}
              </p>
              <span className="text-[13px] text-mm-muted">
                Skill: {question.metadata.skill ?? question.metadata.topic}
              </span>
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={isFlagged}
                data-testid="flag-toggle"
                className={clsx(
                  "ml-auto inline-flex min-h-[38px] items-center gap-2 rounded-[9px] border px-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand",
                  isFlagged
                    ? "border-mm-coral bg-mm-alert text-mm-coral-deep"
                    : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand",
                )}
              >
                <Flag
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill={isFlagged ? "currentColor" : "none"}
                />
                {isFlagged ? "Flagged" : "Flag for review"}
              </button>
            </div>

            <p aria-live="polite" role="status" className="sr-only">
              Question {state.currentIndex + 1} of {state.questions.length}
            </p>

            {/* <ExamQuestion> owns the prompt, the stimulus, any visuals and
                the options for all 14 question types. */}
            <ExamQuestion
              question={candidateQuestion}
              answer={answer}
              onAnswerChange={setAnswer}
              disabled={isChecked}
            />

            {isChecked && currentResult && (
              <ExplanationPanel
                question={question}
                status={currentResult.status}
                answer={answer}
                onNext={next}
                onRetry={retry}
                isLast={isLast}
              />
            )}

            {!isChecked && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={checkAnswer}
                  disabled={isUnanswered(answer)}
                  data-testid="check-answer"
                  className={clsx(
                    "inline-flex min-h-[50px] items-center rounded-[11px] px-[22px] text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand",
                    isUnanswered(answer)
                      ? "cursor-not-allowed bg-mm-track text-mm-muted-2"
                      : "bg-mm-brand text-white shadow-[0_6px_18px_rgba(89,37,168,0.22)] hover:bg-mm-brand-deep",
                  )}
                >
                  Submit answer
                </button>
                <button
                  type="button"
                  onClick={skip}
                  data-testid="skip-question"
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-[11px] border border-mm-line bg-white px-5 text-[15px] font-bold text-mm-ink hover:border-mm-brand hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
                >
                  <SkipForward aria-hidden="true" className="h-4 w-4" />
                  Skip for now
                </button>
                <p className="text-[13.5px] text-mm-muted">
                  The worked explanation appears as soon as you submit.
                </p>
              </div>
            )}
          </article>

          <nav aria-label="Questions in this set">
            <ol
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(state.questions.length, 10)}, minmax(0, 1fr))`,
              }}
            >
              {state.questions.map((item, index) => {
                const done = Boolean(resultFor(state, item.id));
                const current = index === state.currentIndex;
                const flagged = state.flagged.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => goTo(index)}
                      aria-current={current ? "step" : undefined}
                      aria-label={`Question ${index + 1}${done ? ", answered" : ", not answered"}${
                        flagged ? ", flagged for review" : ""
                      }`}
                      data-testid={`practice-nav-${index + 1}`}
                      className={clsx(
                        "relative flex min-h-11 w-full items-center justify-center rounded-[11px] border text-[14.5px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand",
                        current
                          ? "border-mm-brand bg-mm-brand text-white"
                          : done
                            ? "border-mm-tint-line-strong bg-mm-tint text-mm-brand"
                            : "border-mm-line bg-white text-mm-muted-2 hover:border-mm-brand",
                      )}
                    >
                      {index + 1}
                      {flagged && (
                        <Flag
                          aria-hidden="true"
                          className={clsx(
                            "absolute right-1 top-1 h-2.5 w-2.5",
                            current ? "text-white" : "text-mm-coral",
                          )}
                          fill="currentColor"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <aside className="grid gap-[clamp(14px,1.5vw,18px)] xl:sticky xl:top-[96px]">
          <div className="grid gap-3.5 rounded-2xl border border-mm-line bg-white p-5">
            <h2 className="text-[16.5px] font-bold text-mm-ink">This set</h2>
            <dl className="grid gap-2.5">
              {[
                { label: "Answered", value: `${answeredCount} of ${state.questions.length}` },
                { label: "Correct so far", value: String(correctCount) },
                { label: "Current streak", value: String(state.streak) },
                {
                  label: "Flagged",
                  value:
                    state.flagged.length === 1
                      ? "1 question"
                      : `${state.flagged.length} questions`,
                },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between gap-3 text-[14.5px]">
                  <dt className="text-mm-muted">{stat.label}</dt>
                  <dd className="font-bold text-mm-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-3 rounded-2xl border border-mm-line bg-white p-5">
            <h2 className="text-[16.5px] font-bold text-mm-ink">Question types in this set</h2>
            <div className="flex flex-wrap gap-[7px]">
              {typesInSet.map((type) => (
                <span
                  key={type}
                  className="rounded-[9px] border border-mm-tint-line bg-mm-tint px-2.5 py-1 text-[12.5px] font-semibold text-mm-brand"
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="text-[13.5px] leading-[1.55] text-mm-muted">
              Practice mixes types so a student meets the same skill in more than one format.
            </p>
          </div>

          <div className="grid gap-2.5 rounded-2xl border border-mm-tint-line-strong bg-mm-tint p-5">
            <h2 className="text-[16.5px] font-bold text-mm-ink">Ready for exam conditions?</h2>
            <p className="text-sm leading-[1.55] text-mm-muted">
              Eight of ten correct on a skill is usually the point to try a timed section.
            </p>
            <Link
              href="/practice?timing=timed"
              className="inline-flex min-h-[46px] items-center justify-center rounded-[11px] bg-mm-brand text-[14.5px] font-bold text-white hover:bg-mm-brand-deep focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
            >
              Open exam preparation
            </Link>
          </div>

          <button
            type="button"
            onClick={endSession}
            data-testid="end-session"
            className="inline-flex min-h-11 items-center justify-center rounded-[11px] text-sm font-semibold text-mm-muted hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            End session
          </button>
        </aside>
      </main>
    </div>
  );
}

export { STATUS_COPY as PRACTICE_STATUS_COPY };
