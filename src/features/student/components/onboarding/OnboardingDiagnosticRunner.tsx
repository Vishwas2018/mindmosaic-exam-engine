"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import type { CandidateQuestion } from "@/features/exam-engine/types";
import { useOnboardingStore } from "@/features/student/onboarding/onboarding-store";

export function OnboardingDiagnosticRunner() {
  const {
    yearLevel,
    interests,
    weeklyGoalMinutes,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    responses,
    setAnswer,
    setDiagnosticOutcome,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
  } = useOnboardingStore();

  const [questions, setQuestions] = useState<readonly CandidateQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const startedAtRef = useRef<number | null>(null);

  // Fetch candidate questions for this year level
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/student/onboarding/questions?year=${yearLevel}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load diagnostic questions.");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          if (data.ok && Array.isArray(data.questions)) {
            setQuestions(data.questions);
            startedAtRef.current = Date.now();
          } else {
            setError(data.message ?? "Could not load questions.");
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Network error loading questions.");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [yearLevel, setError]);

  if (isLoading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center space-y-3 py-12 text-center">
        <LoaderCircle aria-hidden="true" className="h-8 w-8 animate-spin text-primary" />
        <p className="font-[family-name:var(--font-display)] text-lg font-bold text-mm-ink">
          Preparing your warmup questions…
        </p>
        <p className="text-xs text-mm-muted">
          Selecting 5 questions across key curriculum strands.
        </p>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="space-y-4 py-8 text-center" role="alert">
        <p className="text-sm font-semibold text-rose-600">
          {error ?? "Failed to load diagnostic warmup questions."}
        </p>
        <Button
          type="button"
          onClick={() => {
            setIsLoading(true);
            setError(null);
            fetch(`/api/student/onboarding/questions?year=${yearLevel}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.ok) setQuestions(data.questions);
                setIsLoading(false);
              })
              .catch(() => setIsLoading(false));
          }}
          className="min-h-12 px-6"
        >
          Try Again
        </Button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return null;

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentAnswer = responses[currentQuestion.id];

  const handleSubmitDiagnostic = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/student/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearLevel,
          interests,
          weeklyGoalMinutes,
          responses,
          startedAt: startedAtRef.current ?? Date.now(),
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? data.error ?? "Failed to save diagnostic warmup.");
      }

      setDiagnosticOutcome(data.result, data.baseline);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Submission failed.";
      setError(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-mm-muted">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span className="text-primary font-bold">Diagnostic Warmup · Untimed</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-royal/10">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Question container */}
      <div className="rounded-2xl border border-royal/15 bg-white p-4 sm:p-6 shadow-sm">
        <ExamQuestion
          question={currentQuestion}
          answer={currentAnswer}
          onAnswerChange={(ans) => setAnswer(currentQuestion.id, ans)}
        />
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-600" role="alert">
          {error}
        </p>
      )}

      {/* Navigation and Submission */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          disabled={currentQuestionIndex === 0 || isSubmitting}
          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
          className="min-h-12 px-5"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Previous
        </Button>

        {isLastQuestion ? (
          <Button
            type="button"
            isLoading={isSubmitting}
            loadingLabel="Scoring warmup…"
            onClick={handleSubmitDiagnostic}
            className="min-h-12 px-8"
          >
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
            Finish Warmup
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            className="min-h-12 px-6"
          >
            Next Question
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
