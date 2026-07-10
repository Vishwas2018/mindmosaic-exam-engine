"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
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
import { questionBank } from "@/content/questions/question-bank";
import { ExamQuestion } from "@/features/exam-engine/components";
import { useExamStore } from "@/features/exam-engine/state";

function hasAnswer(answer: unknown): boolean {
  if (answer === null || answer === undefined || answer === "") return false;
  if (Array.isArray(answer)) return answer.length > 0;
  return true;
}

export default function ExamPage() {
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const responses = useExamStore((state) => state.responses);
  const flaggedQuestionIds = useExamStore((state) => state.flaggedQuestionIds);
  const initialiseExam = useExamStore((state) => state.initialiseExam);
  const setResponse = useExamStore((state) => state.setResponse);
  const goToQuestion = useExamStore((state) => state.goToQuestion);
  const goToNextQuestion = useExamStore((state) => state.goToNextQuestion);
  const goToPreviousQuestion = useExamStore((state) => state.goToPreviousQuestion);
  const toggleFlag = useExamStore((state) => state.toggleFlag);
  const submitExam = useExamStore((state) => state.submitExam);

  useEffect(() => {
    initialiseExam(questionBank);
  }, [initialiseExam]);

  const currentQuestion = questionBank[currentQuestionIndex];
  const answeredCount = questionBank.filter((question) =>
    hasAnswer(responses[question.id]),
  ).length;

  if (!currentQuestion) {
    return (
      <main id="main-content" className="site-width py-16">
        <ErrorState
          title="The sample could not be opened"
          description="The question bank is unavailable right now. Return home and try again."
          action={
            <Link href="/" className={buttonClasses({ variant: "secondary" })}>
              Return home
            </Link>
          }
        />
      </main>
    );
  }

  const isFlagged = flaggedQuestionIds.includes(currentQuestion.id);
  const isLastQuestion = currentQuestionIndex === questionBank.length - 1;

  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/10 bg-white">
        <div className="site-width flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-page px-3.5 text-sm font-extrabold tabular-nums text-ink"
              aria-label="Time remaining placeholder: 12 minutes"
            >
              <Clock3 aria-hidden="true" className="h-4 w-4 text-royal" />
              12:00
            </div>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-muted transition hover:bg-error/5 hover:text-error focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-error/15"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Exit sample</span>
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
                <Badge variant="purple">Sample assessment</Badge>
                <Badge variant="orange">Grade 3 &amp; 5</Badge>
              </div>
              <h1
                id="assessment-title"
                className="mt-3 text-2xl font-black tracking-[-0.035em] text-ink sm:text-3xl"
              >
                Numeracy confidence check
              </h1>
            </div>
            <p className="text-sm font-semibold text-muted">
              {answeredCount} of {questionBank.length} answered
            </p>
          </div>
          <ProgressBar
            className="mt-5"
            value={currentQuestionIndex + 1}
            max={questionBank.length}
            label="Assessment progress"
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
                  {answeredCount}/{questionBank.length}
                </span>
              </div>
              <ol className="mt-5 grid grid-cols-3 gap-2 lg:grid-cols-2">
                {questionBank.map((question, index) => {
                  const isCurrent = index === currentQuestionIndex;
                  const isAnswered = hasAnswer(responses[question.id]);
                  const questionIsFlagged = flaggedQuestionIds.includes(question.id);

                  return (
                    <li key={question.id}>
                      <button
                        type="button"
                        onClick={() => goToQuestion(index)}
                        aria-label={`Go to question ${index + 1}${
                          isAnswered ? ", answered" : ", not answered"
                        }${questionIsFlagged ? ", flagged for review" : ""}`}
                        aria-current={isCurrent ? "step" : undefined}
                        className={`relative flex min-h-12 w-full items-center justify-center rounded-xl border text-sm font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
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
                            className={`absolute right-1.5 top-1.5 h-3 w-3 ${
                              isCurrent ? "text-royal-orange" : "text-warning"
                            }`}
                            fill="currentColor"
                          />
                        )}
                        {isAnswered && !questionIsFlagged && (
                          <Check
                            aria-hidden="true"
                            className={`absolute right-1.5 top-1.5 h-3 w-3 ${
                              isCurrent ? "text-white" : "text-success"
                            }`}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-5 border-t border-royal/8 pt-4 text-xs leading-5 text-muted">
                You can move between questions at any time. Your answers are kept while
                this sample is open.
              </div>
            </Card>
          </aside>

          <Card className="overflow-hidden" variant="default">
            <div className="flex flex-col gap-4 border-b border-royal/8 bg-[linear-gradient(110deg,#FFFFFF_0%,#F7F4FF_100%)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-royal">
                  Question {currentQuestionIndex + 1} of {questionBank.length}
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-muted">
                  {currentQuestion.metadata.topic} · {currentQuestion.metadata.difficulty}
                </p>
              </div>
              <Button
                variant={isFlagged ? "orange" : "secondary"}
                size="sm"
                onClick={() => toggleFlag(currentQuestion.id)}
                aria-pressed={isFlagged}
                aria-label="Flag for review"
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
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                Previous
              </Button>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                {!isLastQuestion && (
                  <Button variant="primary" onClick={goToNextQuestion}>
                    Next question
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Button>
                )}
                <Link
                  href="/results"
                  onClick={submitExam}
                  className={buttonClasses({
                    variant: isLastQuestion ? "orange" : "ghost",
                    size: "md",
                  })}
                >
                  <Send aria-hidden="true" className="h-4 w-4" />
                  Submit exam
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
