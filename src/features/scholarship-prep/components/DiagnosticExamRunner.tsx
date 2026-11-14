"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import { useExamStore } from "@/features/exam-engine/state";
import type { Question } from "@/schemas/question.schema";

export function VihaanDiagnosticExamRunner({
  questions,
  subject,
  onComplete,
}: {
  questions: readonly Question[];
  subject: string;
  onComplete: (result: {
    score: number;
    total: number;
    accuracy: number;
    timeTakenSeconds: number;
    responses: Record<string, unknown>;
  }) => void;
}) {
  const sessionId = useExamStore((state) => state.sessionId);
  const questionsState = useExamStore((state) => state.questions);
  const currentQuestionIndex = useExamStore((state) => state.currentQuestionIndex);
  const responses = useExamStore((state) => state.responses);
  const setResponse = useExamStore((state) => state.setResponse);
  const goToNextQuestion = useExamStore((state) => state.goToNextQuestion);
  const goToPreviousQuestion = useExamStore((state) => state.goToPreviousQuestion);
  const startServerExam = useExamStore((state) => state.startServerExam);
  const submitExam = useExamStore((state) => state.submitExam);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ result: any; reviewQuestions: any[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startExam = async () => {
    try {
      await startServerExam({
        yearLevel: 7,
        examStyle: "scholarship_style",
        subject: subject as any,
        questionCount: questionsState?.length ?? 0,
        timing: "timed",
      },
      { bankId: "curated" }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start diagnostic session");
    }
  };

  useEffect(() => {
    if (!sessionId) {
      startExam();
    }
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      submitExam();
      const r = useExamStore.getState().result;
      const reviewQuestions = useExamStore.getState().reviewQuestions;
      setResult({ result: r, reviewQuestions: (reviewQuestions ?? []) as any[] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit exam");
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-mm-coral/40 bg-mm-tint/40 p-6 text-mm-coral">
        <h2 className="text-xl font-bold text-mm-coral">Error</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
        >
          Restart
        </button>
      </div>
    );
  }

  if (!sessionId || !questionsState) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-mm-muted">
        <Clock className="h-8 w-8" aria-hidden="true" />
        <p className="mt-2 text-sm">Starting diagnostic session...</p>
      </div>
    );
  }

  if (submitted && result) {
    const { result: examResult, reviewQuestions } = result;
    const correctCount = examResult.correctCount ?? 0;
    const totalQuestions = examResult.totalQuestions ?? questionsState?.length ?? 0;
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const timeTakenSeconds = examResult.timeTakenSeconds ?? 0;

    return (
      <div className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-ink">Diagnostic Results</h2>
          <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
            {Math.round(accuracy)}% accuracy
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-mm-muted uppercase tracking-wider">Score</p>
            <p className="text-2xl font-bold text-ink">{Math.round(accuracy)}%</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Correct</p>
            <p className="text-2xl font-bold text-ink">{correctCount}</p>
          </div>
          <div className="rounded-xl border border-mm-line bg-mm-page/50 p-4 text-center">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-ink">{totalQuestions}</p>
          </div>
        </div>
        <div className="space-y-3">
          {reviewQuestions.map((q: any) => (
            <div key={q.itemId || q.id} className="rounded-xl border border-mm-line bg-mm-page/50 p-4">
              <h3 className="text-sm font-bold text-ink">{q.title || q.itemId}</h3>
              <p className="mt-1 text-[11px] text-mm-muted">
                {q.explanation || "No explanation available."}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <a
            href="/student/vihaan"
            className="inline-flex items-center gap-2 rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint"
          >
            Back to dashboard
          </a>
        </div>
      </div>
    );
  }

  const currentQuestion = questionsState[currentQuestionIndex];

  return (
    <div className="rounded-2xl border border-mm-line bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-ink">{subject}</h2>
          <p className="text-xs text-mm-muted">Question {currentQuestionIndex + 1} of {questionsState.length}</p>
        </div>
        <span className="px-2 py-0.5 rounded border border-mm-line bg-mm-tint/40 text-[10px] font-semibold text-mm-muted">
          Question {currentQuestionIndex + 1} of {questionsState.length}
        </span>
      </div>
      <div className="mb-4">
        <ExamQuestion
          question={currentQuestion as any}
          answer={responses[currentQuestion.id]}
          onAnswerChange={(answer) => setResponse(currentQuestion.id, answer)}
        />
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={goToPreviousQuestion}
          disabled={currentQuestionIndex === 0}
          className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:bg-mm-page/50 disabled:text-mm-muted disabled:border-mm-line"
        >
          Previous
        </button>
        <button
          onClick={goToNextQuestion}
          disabled={currentQuestionIndex === questionsState.length - 1}
          className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:bg-mm-page/50 disabled:text-mm-muted disabled:border-mm-line"
        >
          Next
        </button>
      </div>
      {currentQuestionIndex === questionsState.length - 1 && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-btn border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-xs hover:border-primary hover:bg-mm-tint disabled:bg-mm-page/50 disabled:text-mm-muted disabled:border-mm-line"
          >
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      )}
    </div>
  );
}
