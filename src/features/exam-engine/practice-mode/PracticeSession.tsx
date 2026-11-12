"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Flag,
  RotateCcw,
  SkipForward,
  Sparkles,
  Trophy,
  WifiOff,
} from "lucide-react";
import { clsx } from "clsx";

import { MindMosaicLogo } from "@/components/branding";
import { EmptyState, buttonClasses } from "@/components/ui";
import type { Question } from "@/schemas/question.schema";

import { formatCorrectAnswer, formatResponse } from "../components/answer-format";
import { ExamQuestion } from "../components/ExamQuestion";
import { isUnanswered, scoreQuestion, type ScoreStatus } from "../scoring";
import { toCandidateQuestion, type CandidateAnswer, type CandidateQuestion } from "../types";

import {
  resultFor,
  type PracticeQuestionStatus,
  type PracticeState,
} from "./practice-reducer";
import { usePracticeSession } from "./use-practice-session";

export interface PracticeSessionProps {
  questions: readonly (Question | CandidateQuestion)[];
  /** Skill or subject name shown in the header, e.g. "Fractions". */
  title: string;
  /** Where "Exit" returns to. */
  exitHref: string;
  /** Label for exit links across the session. Defaults to "Back to Practice Studio". */
  exitLabel?: string;
  /** Whether to show the Set Introduction screen before question 1. Default false for test compatibility. */
  showIntro?: boolean;
  /** Optional custom check answer handler. Defaults to calling /api/practice/check. */
  onCheckAnswer?: (
    questionId: string,
    answer: CandidateAnswer,
  ) => Promise<{
    correct: boolean;
    status: ScoreStatus;
    explanation?: string | null;
    correctAnswer?: string | null;
    yourAnswer?: string | null;
  }>;
}

const STATUS_COPY: Record<
  PracticeQuestionStatus,
  { label: string; tone: string; badge: string }
> = {
  correct: {
    label: "Correct",
    tone: "border-teal-border bg-teal-light",
    badge: "text-teal-accent",
  },
  incorrect: {
    label: "Not quite",
    tone: "border-coral-border bg-coral-light",
    badge: "text-coral-accent",
  },
  unanswered: {
    label: "You didn't answer this one",
    tone: "border-parchment-border bg-canvas",
    badge: "text-plum-muted",
  },
  manual_review: {
    label: "We'll mark this one for you",
    tone: "border-primary/20 bg-primary-tint",
    badge: "text-primary",
  },
  skipped: {
    label: "Skipped",
    tone: "border-parchment-border bg-canvas",
    badge: "text-plum-muted",
  },
};

/** Human label for a question's type, for the badge and the sidebar chips. */
function typeLabel(question: Question | CandidateQuestion): string {
  return question.type
    .replace(/_/g, " ")
    .replace(/^\w/, (character) => character.toUpperCase());
}

/**
 * Explanation panel rendered after a question is checked.
 * Uses server-returned explanation and correct answer (C15).
 */
function ExplanationPanel({
  question,
  status,
  answer,
  explanationText,
  serverCorrectAnswer,
  serverYourAnswer,
  onNext,
  onRetry,
  onFinishSet,
  isLast,
}: {
  question: Question | CandidateQuestion;
  status: PracticeQuestionStatus;
  answer: CandidateAnswer | undefined;
  explanationText?: string | null;
  serverCorrectAnswer?: string | null;
  serverYourAnswer?: string | null;
  onNext: () => void;
  onRetry: () => void;
  onFinishSet: () => void;
  isLast: boolean;
}) {
  const copy = STATUS_COPY[status];
  const questionWithKey = question as Question;
  const correctAnswer =
    serverCorrectAnswer ??
    (questionWithKey.answerKey ? formatCorrectAnswer(questionWithKey) : null);
  const yourAnswer =
    serverYourAnswer ??
    (questionWithKey.answerKey ? formatResponse(questionWithKey, answer) : null);
  const explanation = explanationText ?? questionWithKey.explanation ?? null;
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
        <p className="text-[15px] font-semibold text-plum-dark">
          Your answer: <span className="font-bold">{yourAnswer}</span>
        </p>
      )}
      {showCorrectAnswer && (
        <p className="text-[15px] font-semibold text-plum-dark">
          Correct answer: <span className="font-bold">{correctAnswer}</span>
        </p>
      )}

      {explanation && (
        <>
          <h2 className="font-jakarta text-[17.5px] font-bold text-plum-dark">Why</h2>
          <p className="text-[15.5px] leading-[1.65] text-plum-muted">{explanation}</p>
        </>
      )}

      <div className="mt-1.5 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onNext}
          data-testid="next-question"
          className="inline-flex min-h-12 items-center rounded-[11px] bg-primary px-[22px] text-[15px] font-bold text-white hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          {isLast ? "View results" : "Next question"}
        </button>
        <button
          type="button"
          onClick={onRetry}
          data-testid="retry-question"
          className="inline-flex min-h-12 items-center gap-2 rounded-[11px] border border-parchment-border bg-white px-5 text-[15px] font-bold text-plum-dark hover:border-primary hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
          Try again
        </button>
        <button
          type="button"
          onClick={onFinishSet}
          className="inline-flex min-h-12 items-center rounded-[11px] border border-parchment-border bg-white px-5 text-[15px] font-bold text-plum-dark hover:border-primary hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          Finish set
        </button>
      </div>
    </div>
  );
}

/**
 * Summary view rendered upon completion of the practice set.
 */
function SummaryView({
  state,
  title,
  exitHref,
  exitLabel = "Back to Practice Studio",
  onRestart,
}: {
  state: PracticeState;
  title: string;
  exitHref: string;
  exitLabel?: string;
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
    <div className="bg-canvas min-h-screen text-plum-dark">
      <div className="mx-auto max-w-[720px] px-[clamp(20px,4vw,64px)] py-10 sm:py-14">
        <div className="text-center">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.06em] text-primary">
            Session complete
          </p>
          <h1 className="mt-3 font-jakarta text-[clamp(28px,3vw,38px)] font-bold leading-[1.1] text-plum-dark">
            Nice work
          </h1>
          <p className="mt-2 text-[15.5px] leading-[1.6] text-plum-muted">
            Here&apos;s how you did on {title}.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-3 gap-4 rounded-[18px] border border-parchment-border bg-white p-7 text-center">
          <div>
            <p
              className="font-jakarta text-[32px] font-extrabold tabular-nums text-primary"
              data-testid="summary-accuracy"
            >
              {accuracy}%
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-plum-muted">
              Accuracy
            </p>
          </div>
          <div>
            <p className="font-jakarta text-[32px] font-extrabold tabular-nums text-plum-dark">
              {correct}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-plum-muted">
              Correct
            </p>
          </div>
          <div>
            <p className="font-jakarta text-[32px] font-extrabold tabular-nums text-plum-dark">
              {state.results.length}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-plum-muted">
              Questions
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-start gap-4 rounded-[18px] border border-primary/25 bg-primary-tint/40 p-5">
          <span
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-tint text-primary"
          >
            <Trophy className="h-5 w-5" />
          </span>
          <p className="text-[15px] leading-[1.6] text-plum-dark">{insight}</p>
        </div>

        <div className="mt-5 overflow-hidden rounded-[18px] border border-parchment-border bg-white">
          <div className="border-b border-parchment-border/60 px-5 py-4">
            <h2 className="font-jakarta text-[16.5px] font-bold text-plum-dark">Question review</h2>
            <p className="mt-0.5 text-[13px] font-semibold text-plum-muted">
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
                  className="flex items-start gap-3 border-t border-parchment-border/60 px-5 py-4 first:border-t-0"
                >
                  <span className="w-8 shrink-0 text-[13px] font-bold text-plum-muted">
                    Q{index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-plum-dark">{question.prompt}</p>
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
            className="inline-flex min-h-13 items-center gap-2 rounded-[11px] bg-primary px-6 text-base font-bold text-white hover:bg-primary-hover focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
          >
            <RotateCcw aria-hidden="true" className="h-5 w-5" />
            Practice again
          </button>
          <Link href={exitHref} className={buttonClasses({ variant: "secondary", size: "lg" })}>
            {exitLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Practice runner with Set Introduction, per-question server checking,
 * mid-set leave warning, and unanswered question finish warning.
 */
export function PracticeSession({
  questions,
  title,
  exitHref,
  exitLabel = "Back to Practice Studio",
  showIntro = false,
  onCheckAnswer,
}: PracticeSessionProps) {
  const [hasStarted, setHasStarted] = useState(!showIntro);
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const {
    state,
    setAnswer,
    checkAnswerResult,
    skip,
    next,
    toggleFlag,
    retry,
    goTo,
    endSession,
    restart,
  } = usePracticeSession(questions);

  // Monitor network connectivity for offline gating
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // C14: Warn on browser navigation if answers exist and session is active
  const hasAnyAnswer = Object.keys(state.answers).length > 0;
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasAnyAnswer && state.phase !== "summary") {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasAnyAnswer, state.phase]);

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

  // Estimated time in minutes (~1.5 min per question, rounded to nearest 5 mins)
  const estimatedMinutes = Math.max(5, Math.round((state.questions.length * 1.5) / 5) * 5);

  if (questions.length === 0) {
    return (
      <EmptyState
        title="No questions match this practice set"
        description="Try a different subject or skill from the Learning Hub."
        action={
          <Link href={exitHref} className={buttonClasses({ variant: "primary" })}>
            {exitLabel}
          </Link>
        }
      />
    );
  }

  // 1. Set Introduction Screen (RunnerIntro)
  if (!hasStarted) {
    return (
      <div className="bg-canvas min-h-screen text-plum-dark flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl w-full text-center space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mm-tint text-primary shadow-2xs">
            <Sparkles className="h-7 w-7" aria-hidden="true" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-mm-line bg-white px-3 py-1 text-xs font-semibold text-primary shadow-2xs">
              Practice &middot; No timer
            </span>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mm-ink">
              {title}
            </h1>
            <p className="mt-2 text-sm text-mm-muted">
              Structured practice designed to reinforce key curriculum concepts.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-mm-line bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mm-muted">
                Questions
              </span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">
                {questions.length}
              </p>
              <p className="text-xs text-mm-muted">Individual problems</p>
            </div>

            <div className="rounded-2xl border border-mm-line bg-white p-4 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-mm-muted">
                Estimated Time
              </span>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">
                ~{estimatedMinutes}m
              </p>
              <p className="text-xs text-mm-muted">No countdown clock</p>
            </div>
          </div>

          {/* C14 Plain Statement about unsaved sets */}
          <div
            role="note"
            className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-left shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
              <div className="text-xs leading-relaxed text-amber-950">
                <strong className="font-bold">Before you begin:</strong> A practice set is not saved as it goes. If this tab closes or you navigate away, the set restarts from question 1.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setHasStarted(true)}
              className="inline-flex min-h-[46px] w-full sm:w-auto items-center justify-center gap-2 rounded-btn bg-primary px-8 text-sm font-bold text-white shadow-xs hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
            >
              <span>Begin practice</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link
              href={exitHref}
              className="inline-flex min-h-[46px] w-full sm:w-auto items-center justify-center rounded-btn border border-mm-line bg-white px-6 text-sm font-semibold text-mm-ink hover:bg-slate-50 transition-colors"
            >
              {exitLabel}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Summary Screen
  if (state.phase === "summary") {
    return (
      <SummaryView
        state={state}
        title={title}
        exitHref={exitHref}
        exitLabel={exitLabel}
        onRestart={restart}
      />
    );
  }

  const question = state.questions[state.currentIndex];
  // Cast or adapt to CandidateQuestion
  const candidateQuestion =
    "answerKey" in question ? toCandidateQuestion(question as Question) : question;
  const answer = state.answers[question.id];
  const isChecked = state.phase === "checked";
  const currentResult = resultFor(state, question.id);
  const feedback = state.feedback[question.id];
  const isLast = state.currentIndex === state.questions.length - 1;
  const isFlagged = state.flagged.includes(question.id);
  const progressPercent = Math.round((answeredCount / state.questions.length) * 100);

  // Unanswered question indices for finish warning modal
  const unansweredIndices = state.questions
    .map((q, idx) => (!resultFor(state, q.id) && !state.answers[q.id] ? idx + 1 : null))
    .filter((idx): idx is number => idx !== null);

  // Server-authoritative check handler (C15)
  const handleCheckAnswer = async () => {
    if (isUnanswered(answer) || isChecking) return;
    setIsChecking(true);
    setCheckError(null);

    try {
      if (onCheckAnswer) {
        const res = await onCheckAnswer(question.id, answer);
        checkAnswerResult({
          status: res.status,
          explanation: res.explanation,
          correctAnswer: res.correctAnswer,
          yourAnswer: res.yourAnswer,
        });
      } else if ("answerKey" in question && (question as Question).answerKey) {
        // Fallback for full Question fixtures (e.g. In unit tests): score locally
        const fullQ = question as Question;
        const outcome = scoreQuestion(fullQ, answer);
        checkAnswerResult({
          status: outcome.status,
          explanation: fullQ.explanation,
          correctAnswer: formatCorrectAnswer(fullQ),
          yourAnswer: formatResponse(fullQ, answer),
        });
      } else {
        const response = await fetch("/api/practice/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId: question.id, answer }),
        });

        if (!response.ok) {
          throw new Error("Failed to check answer");
        }

        const data = await response.json();
        checkAnswerResult({
          status: data.status,
          explanation: data.explanation,
          correctAnswer: data.correctAnswer,
          yourAnswer: data.yourAnswer,
        });
      }
    } catch {
      // C15 rule: on failure the answer stays selected, nothing is marked, and the set can still be finished
      setCheckError("Couldn't check your answer right now. Check your connection.");
    } finally {
      setIsChecking(false);
    }
  };

  // Safe exit request handler
  const handleRequestExit = (event?: React.MouseEvent) => {
    if (hasAnyAnswer && state.phase !== "summary") {
      event?.preventDefault();
      setShowLeaveModal(true);
    }
  };

  // Finish set request handler
  const handleRequestFinish = () => {
    if (!isOnline) {
      return;
    }
    if (unansweredIndices.length > 0) {
      setShowFinishModal(true);
    } else {
      endSession();
    }
  };

  return (
    <div className="bg-canvas grid min-h-screen grid-rows-[auto_1fr] text-plum-dark">
      {/* Offline banner if disconnected */}
      {!isOnline && (
        <div
          role="status"
          className="bg-amber-600 px-4 py-2 text-center text-xs font-semibold text-white flex items-center justify-center gap-2"
        >
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span>You appear to be offline. Reconnect to finish your practice set.</span>
        </div>
      )}

      {/* Header Runner Bar */}
      <header className="sticky top-0 z-20 flex h-[72px] items-center gap-[clamp(16px,2vw,28px)] border-b border-parchment-border bg-white px-[clamp(20px,3vw,40px)]">
        <Link
          href="/"
          onClick={handleRequestExit}
          aria-label="MindMosaic home"
          className="flex-none rounded-lg focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
        >
          <MindMosaicLogo size="md" />
        </Link>

        <div className="grid min-w-0 flex-auto gap-0.5 border-l border-parchment-border pl-[clamp(8px,1.4vw,20px)]">
          <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-primary">
            Practice · no timer
          </p>
          <p className="truncate text-[15.5px] font-bold text-plum-dark">{title}</p>
        </div>

        <div className="ml-auto flex flex-none items-center gap-3">
          {/* Progress bar block */}
          <div className="hidden w-[230px] flex-none gap-[5px] md:grid">
            <p className="flex justify-between gap-3 whitespace-nowrap text-[12.5px] text-plum-muted">
              <span>
                Question {state.currentIndex + 1} of {state.questions.length}
              </span>
              <span>{correctCount} correct so far</span>
            </p>
            <span className="block h-2 overflow-hidden rounded-sm bg-parchment-border/60">
              <span
                className="block h-full rounded-sm bg-primary transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${progressPercent}%` }}
              />
            </span>
          </div>

          <button
            type="button"
            onClick={handleRequestFinish}
            disabled={!isOnline}
            className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-btn px-3.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              isOnline
                ? "bg-primary text-white hover:bg-primary-hover shadow-2xs"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>Finish set</span>
          </button>

          <Link
            href={exitHref}
            onClick={handleRequestExit}
            data-testid="exit-practice"
            className="inline-flex min-h-[40px] items-center rounded-btn border border-parchment-border bg-white px-3.5 text-xs font-semibold text-plum-muted hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors"
          >
            {exitLabel}
          </Link>
        </div>
      </header>

      {/* Main Runner Content */}
      <main
        id="main-content"
        className="mx-auto grid w-full max-w-[1440px] items-start gap-[clamp(18px,2vw,28px)] px-[clamp(20px,3vw,40px)] pb-14 pt-[clamp(20px,2.4vw,32px)] xl:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="grid min-w-0 gap-[clamp(16px,1.8vw,22px)]">
          <article className="grid gap-5 rounded-[18px] border border-parchment-border bg-white p-[clamp(22px,2.2vw,32px)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <p
                ref={headingRef}
                tabIndex={-1}
                className="rounded-[7px] bg-primary-tint px-2.5 py-1.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-primary outline-none"
              >
                Question {state.currentIndex + 1} · {typeLabel(question)}
              </p>
              <span className="text-[13px] text-plum-muted">
                Skill: {question.metadata.skill ?? question.metadata.topic}
              </span>
              <button
                type="button"
                onClick={toggleFlag}
                aria-pressed={isFlagged}
                data-testid="flag-toggle"
                className={clsx(
                  "ml-auto inline-flex min-h-[38px] items-center gap-2 rounded-[9px] border px-3.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary",
                  isFlagged
                    ? "border-coral-accent bg-coral-light text-coral-accent"
                    : "border-parchment-border bg-white text-plum-muted hover:border-primary hover:text-primary",
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

            {/* Question renderer */}
            <ExamQuestion
              question={candidateQuestion}
              answer={answer}
              onAnswerChange={setAnswer}
              disabled={isChecked}
            />

            {/* Check Error Notice */}
            {checkError && (
              <div
                role="alert"
                className="rounded-xl border border-coral-border bg-coral-light p-3 text-xs font-semibold text-coral-accent flex items-center gap-2"
              >
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{checkError}</span>
              </div>
            )}

            {/* Explanation panel upon check */}
            {isChecked && currentResult && (
              <ExplanationPanel
                question={question}
                status={currentResult.status}
                answer={answer}
                explanationText={feedback?.explanation}
                serverCorrectAnswer={feedback?.correctAnswer}
                serverYourAnswer={feedback?.yourAnswer}
                onNext={next}
                onRetry={retry}
                onFinishSet={handleRequestFinish}
                isLast={isLast}
              />
            )}

            {/* Action buttons while answering */}
            {!isChecked && (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={isUnanswered(answer) || isChecking}
                  data-testid="check-answer"
                  className={clsx(
                    "inline-flex min-h-[50px] items-center rounded-[11px] px-[22px] text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary",
                    isUnanswered(answer) || isChecking
                      ? "cursor-not-allowed bg-parchment-border text-plum-muted"
                      : "bg-primary text-white shadow-[0_6px_18px_rgba(89,37,168,0.22)] hover:bg-primary-hover",
                  )}
                >
                  {isChecking ? "Checking..." : "Submit answer"}
                </button>
                <button
                  type="button"
                  onClick={skip}
                  data-testid="skip-question"
                  className="inline-flex min-h-[50px] items-center gap-2 rounded-[11px] border border-parchment-border bg-white px-5 text-[15px] font-bold text-plum-dark hover:border-primary hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
                >
                  <SkipForward aria-hidden="true" className="h-4 w-4" />
                  Skip for now
                </button>
                <p className="text-[13.5px] text-plum-muted">
                  Every question comes with a worked explanation as soon as you submit.
                </p>
              </div>
            )}
          </article>

          {/* Ten-question navigation strip */}
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
                        "relative flex min-h-11 w-full items-center justify-center rounded-[11px] border text-[14.5px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary",
                        current
                          ? "border-primary bg-primary text-white"
                          : done
                            ? "border-primary/25 bg-primary-tint text-primary"
                            : "border-parchment-border bg-white text-plum-muted hover:border-primary",
                      )}
                    >
                      {index + 1}
                      {flagged && (
                        <Flag
                          aria-hidden="true"
                          className={clsx(
                            "absolute right-1 top-1 h-2.5 w-2.5",
                            current ? "text-white" : "text-coral-accent",
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

        {/* Sidebar */}
        <aside className="grid gap-[clamp(14px,1.5vw,18px)] xl:sticky xl:top-[96px]">
          <div className="grid gap-3.5 rounded-2xl border border-parchment-border bg-white p-5">
            <h2 className="font-jakarta text-[16.5px] font-bold text-plum-dark">This set</h2>
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
                  <dt className="text-plum-muted">{stat.label}</dt>
                  <dd className="font-bold text-plum-dark">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-3 rounded-2xl border border-parchment-border bg-white p-5">
            <h2 className="font-jakarta text-[16.5px] font-bold text-plum-dark">Question types in this set</h2>
            <div className="flex flex-wrap gap-[7px]">
              {typesInSet.map((type) => (
                <span
                  key={type}
                  className="rounded-[9px] border border-primary/20 bg-primary-tint px-2.5 py-1 text-[12.5px] font-semibold text-primary"
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="text-[13.5px] leading-[1.55] text-plum-muted">
              Practice mixes types so a student meets the same skill in more than one format.
            </p>
          </div>

          <button
            type="button"
            onClick={endSession}
            data-testid="end-session"
            className="inline-flex min-h-11 items-center justify-center rounded-[11px] text-sm font-semibold text-plum-muted hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary"
          >
            End session
          </button>
        </aside>
      </main>

      {/* Mid-set Leave Warning Modal (C14) */}
      {showLeaveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-mm-line bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="leave-modal-title" className="font-jakarta text-lg font-bold text-mm-ink">
                  Leave practice set?
                </h3>
                <p className="mt-1 text-xs text-mm-muted sm:text-sm leading-relaxed">
                  A practice set is not saved as it goes. If you leave now, your answers will not be saved and you will restart from question 1 next time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="inline-flex min-h-[40px] items-center rounded-btn border border-mm-line bg-white px-4 text-xs font-semibold text-mm-ink hover:bg-slate-50"
              >
                Keep practising
              </button>
              <Link
                href={exitHref}
                className="inline-flex min-h-[40px] items-center rounded-btn bg-coral-accent px-4 text-xs font-bold text-white hover:bg-coral-hover"
              >
                Leave set
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Unanswered Finish Warning Modal (RunnerFinish) */}
      {showFinishModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-mm-line bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id="finish-modal-title" className="font-jakarta text-lg font-bold text-mm-ink">
                  Finish set with unanswered questions?
                </h3>
                <p className="mt-1 text-xs text-mm-muted sm:text-sm leading-relaxed">
                  You haven&rsquo;t answered{" "}
                  <strong className="text-mm-ink font-semibold">
                    Question {unansweredIndices.join(", Question ")}
                  </strong>
                  . Do you want to finish the set anyway?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="inline-flex min-h-[40px] items-center rounded-btn border border-mm-line bg-white px-4 text-xs font-semibold text-mm-ink hover:bg-slate-50"
              >
                Review questions
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowFinishModal(false);
                  endSession();
                }}
                className="inline-flex min-h-[40px] items-center rounded-btn bg-primary px-4 text-xs font-bold text-white hover:bg-primary-hover"
              >
                Finish set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { STATUS_COPY as PRACTICE_STATUS_COPY };
