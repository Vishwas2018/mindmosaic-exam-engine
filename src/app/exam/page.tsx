"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Flag,
  Grid2X2,
  Send,
  X,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import {
  Button,
  Card,
  ConfirmDialog,
  ErrorState,
  WidgetError,
  WidgetErrorBoundary,
  buttonClasses,
} from "@/components/ui";
import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { ExamIntegrityMonitor } from "@/features/exam-engine/components/ExamIntegrityMonitor";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import { ExamTimer } from "@/features/exam-engine/components/ExamTimer";
import { SubmitConfirmationDialog } from "@/features/exam-engine/components/SubmitConfirmationDialog";
import { useBoundedNavigation } from "@/features/exam-engine/components/use-bounded-navigation";
import { useAuth } from "@/features/auth";
import { isUnanswered } from "@/features/exam-engine/scoring";
import { useExamStore } from "@/features/exam-engine/state";

/** A keycap, for the shortcut hint beside the question map. */
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-royal/15 bg-white px-1 font-sans text-[11px] font-bold text-ink">
      {children}
    </kbd>
  );
}

export default function ExamPage() {
  const router = useRouter();
  const auth = useAuth();
  const status = useExamStore((state) => state.status);
  const config = useExamStore((state) => state.config);
  const questions = useExamStore((state) => state.questions);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const responses = useExamStore((state) => state.responses);
  const flaggedQuestionIds = useExamStore((state) => state.flaggedQuestionIds);
  const setResponse = useExamStore((state) => state.setResponse);
  const goToQuestion = useExamStore((state) => state.goToQuestion);
  const goToNextQuestion = useExamStore((state) => state.goToNextQuestion);
  const goToPreviousQuestion = useExamStore((state) => state.goToPreviousQuestion);
  const toggleFlag = useExamStore((state) => state.toggleFlag);
  const submitExam = useExamStore((state) => state.submitExam);
  const resumeServerExam = useExamStore((state) => state.resumeServerExam);
  const resetExam = useExamStore((state) => state.resetExam);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  /*
   * A browser refresh mid-exam wipes the Zustand store back to
   * "not_started" along with everything else in memory. Before falling
   * through to the "no exam in progress" view, a signed-in student gets
   * one chance to resume: ask the server whether an autosaved session is
   * still live. Guests keep today's behaviour unchanged — an in-memory-only
   * session that a refresh always loses, matching the guest/signed-in
   * distinction in docs/ASSESSMENT_SECURITY_MODEL.md — so `isCheckingResume`
   * below is never true for them.
   *
   * `resumeAttempted` only ever flips inside the async `.finally()` below,
   * never synchronously in the effect body — a successful resume instead
   * changes `status` away from "not_started", which this effect's own
   * condition already reacts to on the next render.
   */
  const [resumeAttempted, setResumeAttempted] = useState(false);
  const isCheckingResume =
    status === "not_started" &&
    (auth.status === "loading" || (auth.status === "authenticated" && !resumeAttempted));

  useEffect(() => {
    if (status !== "not_started" || auth.status !== "authenticated" || resumeAttempted) {
      return;
    }
    let cancelled = false;
    resumeServerExam().finally(() => {
      if (!cancelled) setResumeAttempted(true);
    });
    return () => {
      cancelled = true;
    };
  }, [status, auth.status, resumeAttempted, resumeServerExam]);

  /*
   * Warm the router cache for the results route during the exam. /results is
   * fully static, so a completed prefetch lets the post-submit push commit
   * from the client cache without a network round trip at submit time.
   */
  useEffect(() => {
    router.prefetch("/results");
  }, [router]);

  /*
   * Arrow keys move between questions, F flags the current one. Declared up
   * here with the other hooks — the render below early-returns for the
   * "no session" and "broken question" states, and a hook after those would
   * change hook order between renders.
   *
   * Deliberately not digits: a number-entry question would swallow them, and
   * "jump to question 7" is not something a child asks for mid-paper. Every
   * shortcut is a no-op while focus is inside a field or a dialog is open —
   * otherwise typing in an answer box, or pressing an arrow inside a select,
   * would navigate away from a half-written answer. Modifier combinations
   * are left to the browser, so Alt+Left is still Back.
   */
  useEffect(() => {
    const blocked = status !== "in_progress" || confirmOpen || exitConfirmOpen;
    if (blocked) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName ?? "")
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNextQuestion();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPreviousQuestion();
      } else if (event.key === "f" || event.key === "F") {
        const current = questions[currentQuestionIndex];
        if (!current) return;
        event.preventDefault();
        toggleFlag(current.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    status,
    confirmOpen,
    exitConfirmOpen,
    goToNextQuestion,
    goToPreviousQuestion,
    toggleFlag,
    questions,
    currentQuestionIndex,
  ]);

  /*
   * Any submission (user or timer expiry) replaces this route with the
   * results page — replace, not push, so /exam leaves the browser history
   * entirely. That is what stops browser Back from ever landing on a
   * submitted exam page: from /results, Back goes to whatever preceded
   * /exam (the setup/home route), not into a redirect loop. Navigation is
   * retried a bounded number of times in case the app router drops it
   * while racing a concurrent route fetch; committing unmounts this page,
   * which stops the retries.
   */
  const { exhausted: resultsNavigationFailed, retry: retryResultsNavigation } =
    useBoundedNavigation(router, "/results", status === "submitted", "replace");

  /*
   * Moving focus to the question heading on navigation (Next/Previous/nav
   * map) is what lets a screen-reader or keyboard user land on the new
   * question's content immediately, rather than staying wherever the
   * previous question's controls happened to be. The ref guard skips this
   * on first mount — stealing focus the instant the exam page loads would
   * fight the browser's own route-change focus handling — and the effect
   * depends only on the index, so answering a question (which does not
   * change the index) never steals focus away from the control the
   * learner is using.
   */
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const hasMountedRef = useRef(false);
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    questionHeadingRef.current?.focus();
  }, [currentQuestionIndex]);

  if (isCheckingResume) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="Checking for an exam in progress…"
          description="One moment while we check whether you have an exam to resume."
        />
      </main>
    );
  }

  if (status === "not_started" || !config) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="No exam in progress"
          description="Set up an exam from the practice page to begin practising."
          action={
            <Link href="/practice" className={buttonClasses({ variant: "secondary" })}>
              Set up an exam
            </Link>
          }
        />
      </main>
    );
  }

  /*
   * A submitted exam is explicitly handled rather than falling through to
   * the interactive question view: normally this is on screen for only an
   * instant before the bounded navigation above replaces the route, but it
   * is also the recoverable state if that navigation is ever exhausted
   * (for example a direct visit to /exam after submitting elsewhere).
   */
  if (status === "submitted") {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="This exam has already been submitted"
          description={
            resultsNavigationFailed
              ? "We could not open your results automatically."
              : "Taking you to your results…"
          }
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/results"
                data-testid="manual-results-link"
                className={buttonClasses({ variant: "primary" })}
              >
                View results
              </Link>
              {resultsNavigationFailed && (
                <Button variant="secondary" onClick={retryResultsNavigation}>
                  Try again
                </Button>
              )}
            </div>
          }
        />
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="The exam could not be opened"
          description="The selected questions are unavailable. Return to practice and try again."
          action={
            <Link href="/practice" className={buttonClasses({ variant: "secondary" })}>
              Return to practice
            </Link>
          }
        />
      </main>
    );
  }

  const answeredCount = questions.filter(
    (question) => !isUnanswered(responses[question.id]),
  ).length;
  const unansweredCount = questions.length - answeredCount;
  const manualReviewCount = questions.filter(
    (question) => question.answerKind === "manual",
  ).length;
  const isFlagged = flaggedQuestionIds.includes(currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleConfirmSubmit = () => {
    setConfirmOpen(false);
    submitExam("user_submitted");
  };


  const handleConfirmExit = () => {
    setExitConfirmOpen(false);
    resetExam();
    router.push("/practice");
  };

  return (
    <div className="min-h-screen bg-page">
      {/*
        Everything a student needs to check mid-sitting — where they are, how
        much is answered, how long is left, the way out — in one bar that
        stays put.

        What this replaced: a 20-tall logo header, then a Badge, then the
        config string as a 3xl headline, then a three-line paragraph
        explaining how to answer and flag, then a full-width progress bar.
        Around 290px of chrome above the first question, repeated on every
        one of them. The paragraph is also redundant now — ExamInstructions
        says the same things, before the clock starts, where a student can
        actually read them.
      */}
      <header className="sticky top-0 z-40 border-b border-royal/10 bg-white/90 backdrop-blur-xl">
        <div className="site-width flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              href="/practice"
              aria-label="MindMosaic home"
              className="hidden shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 sm:block"
            >
              <MindMosaicLogo />
            </Link>
            <div className="min-w-0">
              {/* The page's real h1, at the size a wayfinding label deserves
                  rather than the size a marketing headline does. */}
              <h1
                id="assessment-title"
                className="truncate text-sm font-black tracking-[-0.01em] text-ink"
              >
                {describeConfig(config)}
              </h1>
              <p className="text-xs font-semibold text-muted" data-testid="answered-count">
                {answeredCount} of {questions.length} answered
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Timed sittings only — see ExamIntegrityMonitor for why untimed
                practice is deliberately left unrestricted. */}
            <ExamIntegrityMonitor active={config?.timing === "timed"} />
            <ExamTimer />
            <button
              type="button"
              onClick={() => setExitConfirmOpen(true)}
              data-testid="exit-exam"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/15"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Exit exam</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>

        {/*
          Progress as the header's own bottom edge: always in view, costs no
          vertical space, and replaces a labelled bar that said "0%" directly
          under a line already reading "0 of 10 answered" and a sidebar
          already reading "0/10" — the same number three times.
        */}
        <div
          role="progressbar"
          aria-valuenow={answeredCount}
          aria-valuemin={0}
          aria-valuemax={questions.length}
          aria-label="Questions answered"
          className="h-1 w-full bg-royal/10"
        >
          <div
            className="h-full bg-royal transition-[width] duration-200 ease-out motion-reduce:transition-none"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main id="main-content" className="site-width py-6 sm:py-8">
        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-5" aria-labelledby="question-navigation-title">
            <Card className="p-5" variant="default">
              <div className="flex items-center justify-between gap-3">
                <h2
                  id="question-navigation-title"
                  className="flex items-center gap-2 text-sm font-extrabold text-ink"
                >
                  <Grid2X2 aria-hidden="true" className="h-4 w-4 text-royal" />
                  Questions
                </h2>
                <span className="text-xs font-bold text-muted">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <ol className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-4">
                {questions.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = !isUnanswered(responses[question.id]);
                  const questionIsFlagged = flaggedQuestionIds.includes(question.id);

                  return (
                    <li key={question.id}>
                      <button
                        type="button"
                        onClick={() => goToQuestion(index)}
                        data-testid={`nav-question-${index + 1}`}
                        data-nav-state={
                          isCurrent
                            ? "current"
                            : isAnswered
                              ? "answered"
                              : "unanswered"
                        }
                        data-flagged={questionIsFlagged || undefined}
                        aria-label={`Go to question ${index + 1}${
                          isAnswered ? ", answered" : ", not answered"
                        }${questionIsFlagged ? ", flagged for review" : ""}`}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`relative flex min-h-11 w-full items-center justify-center rounded-xl border text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                          isCurrent
                            ? "border-royal bg-royal text-white shadow-[0_8px_18px_color-mix(in_srgb,var(--purple)_18%,transparent)]"
                            : isAnswered
                              ? "border-success/20 bg-success/8 text-success hover:border-success/40"
                              : "border-royal/12 bg-page text-muted hover:border-royal/30 hover:text-royal"
                        }`}
                      >
                        {index + 1}
                        {questionIsFlagged && (
                          <Flag
                            aria-hidden="true"
                            className={`absolute right-1 top-1 h-3 w-3 ${
                              isCurrent ? "text-royal-orange" : "text-warning"
                            }`}
                            fill="currentColor"
                          />
                        )}
                        {isAnswered && !questionIsFlagged && (
                          <Check
                            aria-hidden="true"
                            className={`absolute right-1 top-1 h-3 w-3 ${
                              isCurrent ? "text-white" : "text-success"
                            }`}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 space-y-1.5 border-t border-royal/8 pt-4 text-xs leading-5 text-muted">
                <p className="flex items-center gap-2">
                  <Check aria-hidden="true" className="h-3 w-3 text-success" />
                  Tick means answered
                </p>
                <p className="flex items-center gap-2">
                  <Flag aria-hidden="true" className="h-3 w-3 text-warning" fill="currentColor" />
                  Flag means marked for review
                </p>
                {/* Shortcuts are worthless undiscovered. Hidden on touch,
                    where there is no keyboard to hint at. */}
                <p className="hidden items-center gap-1.5 pt-1 lg:flex">
                  <Kbd>←</Kbd>
                  <Kbd>→</Kbd>
                  move · <Kbd>F</Kbd> flag
                </p>
              </div>
            </Card>
          </aside>

          <Card className="overflow-hidden" variant="default">
            <div className="flex flex-col gap-4 border-b border-royal/8 bg-[linear-gradient(110deg,#FFFFFF_0%,#F7F4FF_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <h2
                  ref={questionHeadingRef}
                  tabIndex={-1}
                  className="text-sm font-extrabold uppercase tracking-[0.1em] text-royal outline-none"
                >
                  Question {currentQuestionIndex + 1} of {questions.length}
                </h2>
                {/*
                  A timed sitting shows grade and subject only. It used to
                  also print the item's skill ("Locating points on a grid")
                  and its authored difficulty ("Medium") above every
                  question — a real paper tells a candidate neither, the
                  skill line is close to a hint, and knowing an item is
                  "Easy" changes how long a child is willing to spend on it.
                  Both stay in untimed practice, where looking things up is
                  the point, and both are in the results review either way.
                */}
                <p data-testid="question-meta" className="mt-1 text-sm font-semibold text-muted">
                  Grade {currentQuestion.yearLevel} ·{" "}
                  <span className="capitalize">
                    {currentQuestion.metadata.subject.replace("_", " ")}
                  </span>
                  {config?.timing !== "timed" && (
                    <>
                      {" "}
                      · {currentQuestion.metadata.skill ?? currentQuestion.metadata.topic} ·{" "}
                      <span className="capitalize">{currentQuestion.metadata.difficulty}</span>
                    </>
                  )}
                </p>
                {/* A concise, independent announcement of the question
                    change for assistive tech that does not reliably speak
                    a newly focused heading's accessible name; role="status"
                    keeps it out of the tab order and out of visual layout. */}
                <p aria-live="polite" role="status" className="sr-only">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </p>
              </div>
              <Button
                variant={isFlagged ? "orange" : "secondary"}
                size="sm"
                onClick={() => toggleFlag(currentQuestion.id)}
                aria-pressed={isFlagged}
                data-testid="flag-toggle"
              >
                <Flag
                  aria-hidden="true"
                  className="h-4 w-4"
                  fill={isFlagged ? "currentColor" : "none"}
                />
                {isFlagged ? "Flagged for review" : "Flag for review"}
              </Button>
            </div>

            <div className="p-5 sm:p-8 lg:p-10">
              {/*
                One malformed question must not end the exam. Without this,
                a render throw in a single renderer — an unexpected visual
                shape, a missing option — unmounts the whole page and the
                child loses a session they were part-way through, for a
                fault in one item they could simply have skipped.

                Keyed by question id so moving to the next question clears a
                previous failure rather than carrying it forward; React
                remounts the boundary when the key changes. The navigation
                buttons sit OUTSIDE this boundary, so they keep working even
                while the question itself is broken — which is what makes
                "skip it and carry on" possible.
              */}
              <WidgetErrorBoundary
                key={currentQuestion.id}
                fallback={(retry) => (
                  <WidgetError
                    title="This question didn't display properly"
                    description="Skip ahead and keep going — your other answers are saved, and this one won't be marked against you."
                    onRetry={retry}
                    retryLabel="Try loading it again"
                  />
                )}
                onError={(error) =>
                  console.error("[exam] question renderer threw", {
                    questionId: currentQuestion.id,
                    error,
                  })
                }
              >
                <ExamQuestion
                  question={currentQuestion}
                  answer={responses[currentQuestion.id]}
                  onAnswerChange={(answer) => setResponse(currentQuestion.id, answer)}
                />
              </WidgetErrorBoundary>
            </div>

            {/*
              Sticky to the bottom of the viewport while the card scrolls.
              A single grid question renders ~1400px tall, so Previous/Next
              sat below the fold for most of a sitting — a student had to
              scroll past the whole question to move on, then scroll back up
              to read the next one.
            */}
            {/*
              One set of controls, laid out by CSS rather than rendered twice
              per breakpoint — two copies would duplicate every data-testid.

              Phones get Previous and Next sharing a row with Submit beneath;
              `flex-col-reverse` previously stacked them Submit, Next,
              Previous, which put the irreversible action at the top of the
              thumb's reach and the one a student presses most at the bottom.
              From sm up it is the familiar Previous ......... Next Submit.
            */}
            <div className="sticky bottom-0 z-20 grid grid-cols-2 gap-3 border-t border-royal/8 bg-white/92 px-5 py-4 backdrop-blur-xl sm:flex sm:items-center sm:px-8">
              <Button
                variant="secondary"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                data-testid="previous-question"
                className="w-full sm:w-auto"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>

              {!isLastQuestion && (
                <Button
                  variant="primary"
                  onClick={goToNextQuestion}
                  data-testid="next-question"
                  className="w-full sm:ml-auto sm:w-auto"
                >
                  Next question
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant={isLastQuestion ? "orange" : "ghost"}
                onClick={() => setConfirmOpen(true)}
                data-testid="open-submit-dialog"
                className={
                  isLastQuestion
                    ? "w-full sm:ml-auto sm:w-auto"
                    : "col-span-2 w-full sm:col-span-1 sm:w-auto"
                }
              >
                <Send aria-hidden="true" className="h-4 w-4" />
                Submit exam
              </Button>
            </div>
          </Card>
        </div>
      </main>

      <SubmitConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedQuestionIds.length}
        manualReviewCount={manualReviewCount}
      />

      <ConfirmDialog
        open={exitConfirmOpen}
        title="Exit this exam?"
        description="Your progress on this attempt will be lost and can't be recovered."
        confirmLabel="Exit exam"
        cancelLabel="Keep working"
        variant="danger"
        onConfirm={handleConfirmExit}
        onCancel={() => setExitConfirmOpen(false)}
      />
    </div>
  );
}
