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
  Badge,
  Button,
  Card,
  ErrorState,
  ProgressBar,
  buttonClasses,
} from "@/components/ui";
import { describeConfig } from "@/features/exam-engine/components/describe-config";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import { ExamTimer } from "@/features/exam-engine/components/ExamTimer";
import { SubmitConfirmationDialog } from "@/features/exam-engine/components/SubmitConfirmationDialog";
import { useBoundedNavigation } from "@/features/exam-engine/components/use-bounded-navigation";
import { useAuth } from "@/features/auth";
import { isUnanswered } from "@/features/exam-engine/scoring";
import { useExamStore } from "@/features/exam-engine/state";

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

  const [confirmOpen, setConfirmOpen] = useState(false);

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

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/10 bg-white">
        <div className="site-width flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/practice"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ExamTimer />
            <Link
              href="/practice"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/15"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Exit exam</span>
              <span className="sm:hidden">Exit</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="site-width py-6 sm:py-8">
        <section aria-labelledby="assessment-title" className="mb-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="purple">MindMosaic practice exam</Badge>
              </div>
              <h1
                id="assessment-title"
                className="mt-3 text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl"
              >
                {describeConfig(config)}
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted">
                Answer each question, flag anything you want to check again, and
                submit when you are ready. Your answers are kept while you move
                between questions.
              </p>
            </div>
            <p className="text-sm font-semibold text-muted" data-testid="answered-count">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
          <ProgressBar
            className="mt-5"
            value={answeredCount}
            max={questions.length}
            label="Questions answered"
            showValue
          />
        </section>

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
                            ? "border-royal bg-royal text-white shadow-[0_8px_18px_rgba(75,46,131,0.18)]"
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
                <p className="mt-1 text-sm font-semibold text-muted">
                  Grade {currentQuestion.yearLevel} ·{" "}
                  <span className="capitalize">
                    {currentQuestion.metadata.subject.replace("_", " ")}
                  </span>{" "}
                  · {currentQuestion.metadata.skill ?? currentQuestion.metadata.topic} ·{" "}
                  <span className="capitalize">{currentQuestion.metadata.difficulty}</span>
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
              <ExamQuestion
                question={currentQuestion}
                answer={responses[currentQuestion.id]}
                onAnswerChange={(answer) => setResponse(currentQuestion.id, answer)}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-royal/8 bg-page/65 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <Button
                variant="secondary"
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                data-testid="previous-question"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {!isLastQuestion && (
                  <Button
                    variant="primary"
                    onClick={goToNextQuestion}
                    data-testid="next-question"
                  >
                    Next question
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant={isLastQuestion ? "orange" : "ghost"}
                  onClick={() => setConfirmOpen(true)}
                  data-testid="open-submit-dialog"
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  Submit exam
                </Button>
              </div>
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
    </div>
  );
}
