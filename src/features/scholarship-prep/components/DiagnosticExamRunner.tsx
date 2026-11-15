"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";

import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import type { SubjectFilter, YearLevelFilter } from "@/features/exam-engine/selection";
import { useExamStore } from "@/features/exam-engine/state";
import type { VihaanSolutionDetail } from "@/features/scholarship-prep/lib/practice";
import type { Question } from "@/schemas/question.schema";

export interface DiagnosticCompletionResult {
  score: number;
  total: number;
  accuracy: number;
  timeTakenSeconds: number;
  responses: Record<string, unknown>;
}

const VALID_SUBJECT_FILTERS = new Set<string>([
  "numeracy",
  "reading",
  "language",
  "science",
  "digital_technologies",
  "spelling",
  "amc_mathematics",
  "verbal_reasoning",
  "numerical_reasoning",
  "mixed",
]);

function normalizeSubjectFilter(
  questions: readonly Question[],
  requestedSubject: string,
): SubjectFilter {
  const distinctSubjects = new Set(questions.map((q) => q.metadata.subject));
  if (distinctSubjects.size > 1 || distinctSubjects.has("writing")) {
    return "mixed";
  }
  const single =
    distinctSubjects.size === 1 ? questions[0]?.metadata.subject : requestedSubject;
  const mapped =
    single === "mathematics"
      ? "numeracy"
      : single === "reading_comprehension"
        ? "reading"
        : single === "language_conventions"
          ? "language"
          : single === "written_expression" || single === "writing"
            ? "mixed"
            : single;
  return VALID_SUBJECT_FILTERS.has(mapped) ? (mapped as SubjectFilter) : "mixed";
}

function normalizeYearLevel(questions: readonly Question[]): YearLevelFilter {
  const distinctYears = new Set(questions.map((q) => q.yearLevel));
  if (distinctYears.size === 1) {
    return questions[0]!.yearLevel;
  }
  return questions.length > 0 ? "mixed" : 6;
}

function formatSubjectLabel(subject: string): string {
  const cleaned = subject === "numeracy" ? "Mathematics" : subject.replace(/_/g, " ");
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function VihaanDiagnosticExamRunner({
  questions,
  subject,
  mode = "local",
  solutionsById,
  persistToServer = false,
  onComplete,
  onExit,
}: {
  questions: readonly Question[];
  subject: string;
  mode?: "local" | "server";
  solutionsById?: Readonly<Record<string, VihaanSolutionDetail>>;
  persistToServer?: boolean;
  onComplete?: (result: DiagnosticCompletionResult) => void;
  onExit?: () => void;
}) {
  const status = useExamStore((state) => state.status);
  const sessionId = useExamStore((state) => state.sessionId);
  const questionsState = useExamStore((state) => state.questions);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const responses = useExamStore((state) => state.responses);
  const examResult = useExamStore((state) => state.result);
  const reviewQuestions = useExamStore((state) => state.reviewQuestions);
  const setResponse = useExamStore((state) => state.setResponse);
  const goToNextQuestion = useExamStore((state) => state.goToNextQuestion);
  const goToPreviousQuestion = useExamStore((state) => state.goToPreviousQuestion);
  const startExam = useExamStore((state) => state.startExam);
  const startServerExam = useExamStore((state) => state.startServerExam);
  const submitExam = useExamStore((state) => state.submitExam);

  const [error, setError] = useState<string | null>(null);
  const [persistedStatus, setPersistedStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const completedRef = useRef(false);

  // Clean up store state when navigating away so stale attempts do not linger.
  useEffect(() => {
    return () => {
      useExamStore.getState().resetExam();
    };
  }, []);

  useEffect(() => {
    if (questions.length === 0 || status !== "not_started") {
      return;
    }

    const yearLevel = normalizeYearLevel(questions);
    const examSubject = normalizeSubjectFilter(questions, subject);
    const config = {
      yearLevel,
      examStyle: "scholarship_style" as const,
      subject: examSubject,
      questionCount: questions.length,
      timing: "timed" as const,
    };

    let cancelled = false;
    const startSession = async () => {
      if (mode === "server") {
        try {
          const ok = await startServerExam(config, { bankId: "published" });
          if (!cancelled && !ok) {
            setError(
              useExamStore.getState().lastServerError ?? "Failed to start diagnostic session",
            );
          }
        } catch (err) {
          if (!cancelled) {
            setError(err instanceof Error ? err.message : "Failed to start diagnostic session");
          }
        }
        return;
      }

      const ok = startExam(questions, config, {
        bankId: "published",
        seed: "vihaan-diagnostic",
      });
      if (!ok) {
        await Promise.resolve();
        if (!cancelled) {
          setError("Failed to start diagnostic session");
        }
      }
    };

    void startSession();
    return () => {
      cancelled = true;
    };
  }, [questions, subject, mode, status, startExam, startServerExam]);

  useEffect(() => {
    if (status === "submitted" && examResult && !completedRef.current) {
      completedRef.current = true;
      const storeState = useExamStore.getState();
      onComplete?.({
        score: examResult.correctCount,
        total: examResult.totalQuestions,
        accuracy: examResult.objectivePercentage,
        timeTakenSeconds: examResult.timeTakenSeconds,
        responses: storeState.responses,
      });

      if (persistToServer) {
        const questionIds = questions.map((q) => q.id);
        void (async () => {
          try {
            const response = await fetch("/api/student/vihaan/attempt", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                questionIds,
                subject,
                mode: questions.length >= 20 ? "diagnostic" : "practice",
                startedAt: storeState.startedAt ?? undefined,
                submittedAt: storeState.submittedAt ?? undefined,
                responses: storeState.responses,
              }),
            });
            const data = (await response.json().catch(() => null)) as {
              persisted?: boolean;
            } | null;
            setPersistedStatus(response.ok && data?.persisted ? "saved" : "error");
          } catch {
            setPersistedStatus("error");
          }
        })();
      }
    } else if (status === "not_started") {
      completedRef.current = false;
    }
  }, [status, examResult, onComplete, persistToServer, questions, subject]);

  const handleSubmit = () => {
    if (persistToServer) {
      setPersistedStatus("saving");
    }
    submitExam("user_submitted");
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-mm-coral/40 bg-mm-tint/40 p-6 text-mm-coral">
        <h2 className="text-xl font-bold text-mm-coral">Unable to start diagnostic</h2>
        <p className="mt-2 text-sm text-ink">{error}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setError(null);
              useExamStore.getState().resetExam();
            }}
            className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
          >
            Restart
          </button>
          <Link
            href="/student/vihaan"
            className="inline-flex items-center gap-1.5 rounded-btn border border-mm-line bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-mm-page"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Vihaan Scholarship Prep
          </Link>
        </div>
      </div>
    );
  }

  if (questions.length === 0 && !sessionId && status === "not_started") {
    return (
      <section
        data-testid="diagnostic-empty-state"
        className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-ink">Diagnostic Assessment</h1>
            <p className="mt-1 text-sm font-semibold text-mm-muted">
              No approved diagnostic questions available yet
            </p>
          </div>
          <span className="rounded border border-mm-line bg-mm-tint/40 px-2.5 py-1 text-[11px] font-semibold text-mm-muted">
            Draft — awaiting human approval
          </span>
        </div>
        <p className="text-sm text-mm-muted">
          The diagnostic bank is currently in draft review pending human sign-off (
          <code>approvedBy</code>). Unapproved draft questions are never served to students.
        </p>
        <div>
          <Link
            href="/student/vihaan"
            className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to Vihaan Scholarship Prep
          </Link>
        </div>
      </section>
    );
  }

  if (status === "submitted" && examResult) {
    const reviewList = reviewQuestions ?? [];
    const detailById = new Map(examResult.questionDetails.map((d) => [d.questionId, d]));

    return (
      <div
        data-testid="diagnostic-results"
        className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-ink">Diagnostic Results</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {persistedStatus === "saved" && (
              <span
                data-testid="vihaan-attempt-persisted"
                className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700"
              >
                Saved to progress
              </span>
            )}
            {persistedStatus === "saving" && (
              <span
                data-testid="vihaan-attempt-saving"
                className="rounded border border-mm-line bg-mm-page/60 px-2.5 py-0.5 text-xs font-semibold text-mm-muted"
              >
                Saving progress...
              </span>
            )}
            {persistedStatus === "error" && (
              <span
                data-testid="vihaan-attempt-save-error"
                className="rounded border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
              >
                Could not sync to server
              </span>
            )}
            <span className="rounded border border-mm-line bg-mm-tint/40 px-2.5 py-0.5 text-xs font-semibold text-mm-muted">
              {examResult.objectivePercentage}% accuracy
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-mm-muted uppercase tracking-wider">Score</p>
            <p className="text-2xl font-bold text-ink">{examResult.objectivePercentage}%</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-mm-muted uppercase tracking-wider">Correct</p>
            <p className="text-2xl font-bold text-ink">{examResult.correctCount}</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-mm-muted uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-ink">{examResult.totalQuestions}</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-mm-muted uppercase tracking-wider">Time</p>
            <p className="text-2xl font-bold text-ink">{examResult.timeTakenSeconds}s</p>
          </div>
        </div>

        {examResult.manualReviewQuestions > 0 && (
          <p className="text-xs text-mm-muted">
            {examResult.manualReviewQuestions} response
            {examResult.manualReviewQuestions === 1 ? " is" : "s are"} pending manual review and
            excluded from objective accuracy.
          </p>
        )}

        <div className="space-y-3">
          {reviewList.map((q) => {
            const detail = detailById.get(q.id);
            const solution = solutionsById?.[q.id];
            const badgeLabel = detail?.pendingManualReview
              ? "Pending review"
              : detail?.status === "correct"
                ? "Correct"
                : detail?.status === "incorrect"
                  ? "Incorrect"
                  : "Unanswered";
            return (
              <div key={q.id} className="rounded-xl border border-mm-line bg-mm-page/50 p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-ink">{q.prompt || q.id}</h3>
                  <span className="rounded border border-mm-line bg-white px-2 py-0.5 text-[10px] font-semibold text-mm-muted">
                    {badgeLabel}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-mm-muted">
                  {q.explanation || "No explanation available."}
                </p>
                {solution && solution.workedSolution.length > 0 && (
                  <div
                    data-testid={`vihaan-worked-solution-${q.id}`}
                    className="rounded-lg border border-mm-line/80 bg-white p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
                      Worked solution
                    </p>
                    <ol className="mt-1 list-decimal space-y-1 pl-4 text-xs text-ink">
                      {solution.workedSolution.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {solution?.rubric && (
                  <div
                    data-testid={`vihaan-writing-rubric-${q.id}`}
                    className="rounded-lg border border-mm-line/80 bg-white p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
                      Writing rubric (1–5 scale)
                    </p>
                    <p className="mt-1 text-xs text-ink">{solution.rubric}</p>
                  </div>
                )}
                {solution?.sampleResponse && (
                  <div
                    data-testid={`vihaan-sample-response-${q.id}`}
                    className="rounded-lg border border-mm-line/80 bg-white p-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
                      Sample planning response
                    </p>
                    <p className="mt-1 text-xs text-ink">{solution.sampleResponse}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end">
          {onExit ? (
            <button
              type="button"
              onClick={() => {
                useExamStore.getState().resetExam();
                onExit();
              }}
              className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
            >
              Back to dashboard
            </button>
          ) : (
            <Link
              href="/student/vihaan"
              className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
            >
              Back to dashboard
            </Link>
          )}
        </div>
      </div>
    );
  }

  if (!sessionId || questionsState.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl border border-mm-line bg-white p-6 text-mm-muted">
        <Clock className="h-8 w-8" aria-hidden="true" />
        <p className="mt-2 text-sm">Starting diagnostic session...</p>
      </div>
    );
  }

  const currentQuestion = questionsState[currentQuestionIndex];
  if (!currentQuestion) {
    return null;
  }

  const isSubmitting = status === "submitting";
  const isLastQuestion = currentQuestionIndex === questionsState.length - 1;

  return (
    <div className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-ink">{formatSubjectLabel(subject)}</h2>
          <p className="text-xs text-mm-muted">
            Question {currentQuestionIndex + 1} of {questionsState.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
            Question {currentQuestionIndex + 1} of {questionsState.length}
          </span>
          {onExit ? (
            <button
              type="button"
              onClick={() => {
                useExamStore.getState().resetExam();
                onExit();
              }}
              className="inline-flex items-center gap-1 rounded-btn border border-mm-line bg-white px-2.5 py-1 text-[11px] font-semibold text-mm-muted hover:text-ink"
            >
              Exit
            </button>
          ) : (
            <Link
              href="/student/vihaan"
              className="inline-flex items-center gap-1 rounded-btn border border-mm-line bg-white px-2.5 py-1 text-[11px] font-semibold text-mm-muted hover:text-ink"
            >
              Exit
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4">
        <ExamQuestion
          question={currentQuestion}
          answer={responses[currentQuestion.id]}
          onAnswerChange={(answer) => setResponse(currentQuestion.id, answer)}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:bg-mm-page/50 disabled:text-mm-muted disabled:border-mm-line"
        >
          Previous
        </button>
        <div className="flex items-center gap-2">
          {!isLastQuestion && (
            <button
              type="button"
              onClick={goToNextQuestion}
              disabled={isSubmitting}
              className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:bg-mm-page/50 disabled:text-mm-muted disabled:border-mm-line"
            >
              Next
            </button>
          )}
          {isLastQuestion && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-btn border border-primary bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
