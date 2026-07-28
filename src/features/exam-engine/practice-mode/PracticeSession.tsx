"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Flame,
  RotateCcw,
  SkipForward,
  Trophy,
  X,
} from "lucide-react";

import {
  Button,
  Card,
  EmptyState,
  ProgressBar,
  buttonClasses,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { Question } from "@/schemas/question.schema";

import { formatCorrectAnswer, formatResponse } from "../components/answer-format";
import { ExamQuestion } from "../components/ExamQuestion";
import { isUnanswered } from "../scoring";
import { toCandidateQuestion } from "../types";
import type { CandidateAnswer } from "../types";

import type { PracticeQuestionStatus, PracticeState } from "./practice-reducer";
import { usePracticeSession } from "./use-practice-session";

export interface PracticeSessionProps {
  questions: readonly Question[];
  /** Skill or subject name shown in the header, e.g. "Fractions". */
  title: string;
  /** Where "Exit practice" and "Back to Learning Hub" return to. */
  exitHref: string;
}

const STATUS_COPY: Record<
  PracticeQuestionStatus,
  { label: string; tone: string; icon: typeof Check }
> = {
  correct: { label: "Correct", tone: "bg-success/10 text-success border-success/20", icon: Check },
  incorrect: { label: "Not quite", tone: "bg-error/10 text-error border-error/20", icon: X },
  unanswered: { label: "You didn't answer this one", tone: "bg-royal/8 text-muted border-royal/15", icon: X },
  manual_review: {
    label: "We'll mark this one for you",
    tone: "bg-warning/10 text-warning border-warning/20",
    icon: Check,
  },
  skipped: { label: "Skipped", tone: "bg-royal/8 text-muted border-royal/15", icon: SkipForward },
};

function FeedbackPanel({
  question,
  status,
  answer,
}: {
  question: Question;
  status: PracticeQuestionStatus;
  answer: CandidateAnswer | undefined;
}) {
  const copy = STATUS_COPY[status];
  const Icon = copy.icon;
  const correctAnswer = formatCorrectAnswer(question);
  const yourAnswer = formatResponse(question, answer);
  const showCorrectAnswer =
    (status === "incorrect" || status === "unanswered") && correctAnswer !== null;

  return (
    <div
      role="status"
      data-testid="feedback-panel"
      data-status={status}
      className={cn("mt-6 rounded-2xl border p-5", copy.tone)}
    >
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-extrabold">{copy.label}</p>
          {status === "incorrect" && yourAnswer && (
            <p className="text-sm font-semibold text-ink">
              Your answer: <span className="font-black">{yourAnswer}</span>
            </p>
          )}
          {showCorrectAnswer && (
            <p className="text-sm font-semibold text-ink">
              Correct answer: <span className="font-black">{correctAnswer}</span>
            </p>
          )}
          {question.explanation && (
            <p className="text-sm leading-6 text-muted">{question.explanation}</p>
          )}
        </div>
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
    <div className="mx-auto max-w-2xl py-10 sm:py-14">
      <div className="text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-muted">
          Session complete
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-ink">
          Nice work
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">Here&apos;s how you did on {title}.</p>
      </div>

      <Card className="mt-7 p-7" variant="default">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl font-black tabular-nums text-royal" data-testid="summary-accuracy">
              {accuracy}%
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">Accuracy</p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums text-success">{correct}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">Correct</p>
          </div>
          <div>
            <p className="text-3xl font-black tabular-nums text-ink">{state.results.length}</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted">Questions</p>
          </div>
        </div>
      </Card>

      <Card className="mt-5 flex items-start gap-4 p-5" variant="accent">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-royal-orange/10 text-warning">
          <Trophy aria-hidden="true" className="h-5 w-5" />
        </span>
        <p className="text-sm leading-6 text-ink">{insight}</p>
      </Card>

      <Card className="mt-5 overflow-hidden" variant="default">
        <div className="border-b border-royal/8 px-5 py-4">
          <h2 className="text-sm font-extrabold text-ink">Question review</h2>
          <p className="mt-0.5 text-xs font-semibold text-muted">
            {correct} correct · {incorrect} incorrect
            {skipped > 0 ? ` · ${skipped} skipped` : ""}
          </p>
        </div>
        <ol>
          {state.questions.map((question, index) => {
            const result = state.results[index];
            if (!result) return null;
            const copy = STATUS_COPY[result.status];
            const Icon = copy.icon;
            return (
              <li
                key={question.id}
                data-testid={`practice-review-${index + 1}`}
                className="flex items-start gap-3 border-t border-royal/8 px-5 py-4 first:border-t-0"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                    copy.tone,
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{question.prompt}</p>
                  <p className="mt-0.5 text-xs font-semibold text-muted">{copy.label}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-muted">Q{index + 1}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="orange" size="lg" onClick={onRestart} data-testid="practice-again">
          <RotateCcw aria-hidden="true" className="h-5 w-5" />
          Practice again
        </Button>
        <Link href={exitHref} className={buttonClasses({ variant: "secondary", size: "lg" })}>
          Back to Learning Hub
        </Link>
      </div>
    </div>
  );
}

/**
 * Screen 10 — untimed, immediate-feedback practice engine (design-
 * explorations/ui-mockups/08-practice.html). Distinct from the exam engine
 * at /exam: every question here reveals correct/incorrect plus its
 * explanation the instant a student checks their answer, rather than
 * withholding everything until the whole session is submitted.
 */
export function PracticeSession({ questions, title, exitHref }: PracticeSessionProps) {
  const { state, setAnswer, checkAnswer, skip, next, endSession, restart } =
    usePracticeSession(questions);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [state.currentIndex]);

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions match this practice set"
        description="Try a different subject or skill from the Learning Hub."
        action={
          <Link href={exitHref} className={buttonClasses({ variant: "orange" })}>
            Back to Learning Hub
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
  const currentResult = isChecked ? state.results.at(-1) : undefined;
  const isLast = state.currentIndex === state.questions.length - 1;

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-20 border-b border-royal/8 bg-white/85 backdrop-blur-xl">
        <div className="site-width flex min-h-16 items-center justify-between gap-4 py-3">
          <Link
            href={exitHref}
            data-testid="exit-practice"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-bold text-muted transition hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            Exit practice
          </Link>

          <div className="mx-4 flex-1 text-center">
            <p className="truncate text-xs font-extrabold text-ink">{title}</p>
            <div className="mx-auto mt-1.5 flex max-w-xs items-center justify-center gap-2">
              <ProgressBar
                className="flex-1"
                label="Practice progress"
                value={state.currentIndex}
                max={state.questions.length}
              />
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-muted">
                {state.currentIndex} / {state.questions.length}
              </span>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted"
            data-testid="practice-streak"
          >
            <Flame aria-hidden="true" className="h-4 w-4 text-royal-orange" />
            <span className="tabular-nums">{state.streak}</span>
          </div>
        </div>
      </header>

      <main id="main-content" className="site-width max-w-2xl py-8 sm:py-10">
        <p
          ref={headingRef}
          tabIndex={-1}
          className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-royal outline-none"
        >
          Question {state.currentIndex + 1} of {state.questions.length}
        </p>
        <p aria-live="polite" role="status" className="sr-only">
          Question {state.currentIndex + 1} of {state.questions.length}
        </p>

        <div className="mt-4">
          <ExamQuestion
            question={candidateQuestion}
            answer={answer}
            onAnswerChange={setAnswer}
            disabled={isChecked}
          />
        </div>

        {isChecked && currentResult && (
          <FeedbackPanel question={question} status={currentResult.status} answer={answer} />
        )}

        <div className="mt-8 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-royal/8 pt-6 sm:flex-row sm:items-center">
          <Button variant="ghost" size="sm" onClick={endSession} data-testid="end-session">
            End session
          </Button>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {!isChecked && (
              <>
                <Button variant="secondary" onClick={skip} data-testid="skip-question">
                  <SkipForward aria-hidden="true" className="h-4 w-4" />
                  Skip
                </Button>
                <Button
                  variant="primary"
                  onClick={checkAnswer}
                  disabled={isUnanswered(answer)}
                  data-testid="check-answer"
                >
                  Check answer
                </Button>
              </>
            )}
            {isChecked && (
              <Button variant="primary" onClick={next} data-testid="next-question">
                {isLast ? "View results" : "Next question"}
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export { STATUS_COPY as PRACTICE_STATUS_COPY };
