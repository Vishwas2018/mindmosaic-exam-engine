"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

import { AppHeader } from "@/components/shell/AppHeader";
import { useAuth } from "@/features/auth";
import { roleHomeLabel, roleHomePath } from "@/features/auth/roles";
import { Badge, Button, Card, buttonClasses } from "@/components/ui";
import { promptLayoutClass } from "@/features/exam-engine/question-renderers/renderer-utils";
import { VisualRenderer } from "@/features/exam-engine/visual-renderers";
import { formatCorrectAnswer, formatResponse } from "@/features/exam-engine/components/answer-format";
import { useExamStore } from "@/features/exam-engine/state";

import { ResultsColdLoad } from "../ResultsColdLoad";

export default function ResultsReviewPage() {
  const router = useRouter();
  const { role } = useAuth();
  const homeHref = role ? roleHomePath(role) : "/practice";
  const homeLabel = role ? `Back to ${roleHomeLabel(role).toLowerCase()}` : "Back to practice";

  const status = useExamStore((state) => state.status);
  const config = useExamStore((state) => state.config);
  const questions = useExamStore((state) => state.reviewQuestions);
  const responses = useExamStore((state) => state.responses);
  const flaggedQuestionIds = useExamStore((state) => state.flaggedQuestionIds);
  const result = useExamStore((state) => state.result);
  const resetExam = useExamStore((state) => state.resetExam);

  const [reviewFilter, setReviewFilter] = useState<
    "all" | "incorrect" | "unanswered" | "flagged" | "manual_review"
  >("all");

  if (status !== "submitted" || !result || !config || !questions) {
    return <ResultsColdLoad />;
  }

  const detailById = new Map(
    result.questionDetails.map((detail) => [detail.questionId, detail]),
  );

  const incorrectIds = new Set(
    result.questionDetails
      .filter((detail) => detail.status === "incorrect")
      .map((detail) => detail.questionId),
  );
  const unansweredIds = new Set(
    result.questionDetails
      .filter((detail) => detail.status === "unanswered")
      .map((detail) => detail.questionId),
  );
  const manualReviewIds = new Set(
    result.questionDetails
      .filter((detail) => detail.status === "manual_review" || detail.pendingManualReview)
      .map((detail) => detail.questionId),
  );

  const reviewQuestions =
    reviewFilter === "flagged"
      ? questions.filter((question) => flaggedQuestionIds.includes(question.id))
      : reviewFilter === "incorrect"
        ? questions.filter((question) => incorrectIds.has(question.id))
        : reviewFilter === "unanswered"
          ? questions.filter((question) => unansweredIds.has(question.id))
          : reviewFilter === "manual_review"
            ? questions.filter((question) => manualReviewIds.has(question.id))
            : questions;

  const reviewFilters = [
    { id: "all" as const, label: "All", count: questions.length },
    { id: "incorrect" as const, label: "Wrong", count: incorrectIds.size },
    { id: "unanswered" as const, label: "Not answered", count: unansweredIds.size },
    { id: "flagged" as const, label: "Flagged", count: flaggedQuestionIds.length },
    ...(manualReviewIds.size > 0
      ? [{ id: "manual_review" as const, label: "Not yet marked", count: manualReviewIds.size }]
      : []),
  ];

  const handleRestart = () => {
    resetExam();
    router.push("/practice");
  };

  return (
    <div className="min-h-screen bg-page">
      <AppHeader />
      <main id="main-content" className="site-width py-10 sm:py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-8">
            <div>
              <Badge variant="orange">Question review</Badge>
              <h1 className="mt-3 font-jakarta text-2xl font-black tracking-[-0.03em] text-plum-dark">
                Every question, explained
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-plum-muted">
                Review your answers question by question. Correct answers are
                revealed only after submission.
              </p>
            </div>
            <div role="tablist" aria-label="Filter the question review" className="flex flex-wrap gap-2">
              {reviewFilters.map((filter) => {
                const selected = filter.id === reviewFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setReviewFilter(filter.id)}
                    className={buttonClasses({
                      variant: selected ? "primary" : "secondary",
                      size: "sm",
                    })}
                  >
                    {filter.label}
                    <span className="ml-2 text-xs font-bold text-muted">
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <Card className="mt-6 space-y-8 p-6 sm:p-8" variant="default">
            <ol className="space-y-6">
              {reviewQuestions.map((question) => {
                const detail = detailById.get(question.id);
                const submitted = responses[question.id];

                const correctAnswer =
                  detail !== undefined && !detail.requiresManualMarking
                    ? formatCorrectAnswer(question)
                    : null;

                return (
                  <li
                    key={question.id}
                    className="group border border-primary/8 rounded-2xl bg-surface-container-low p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-extrabold uppercase tracking-wide text-primary">
                            Q{reviewQuestions.indexOf(question) + 1}
                          </span>
                          <span className="text-xs font-semibold text-plum-muted">
                            {question.metadata.topic ?? "Question"}
                          </span>
                          <span className="ml-auto text-xs font-bold tabular-nums text-plum-muted">
                            {detail?.awardedMarks ?? 0}/{detail?.availableMarks ?? 0} marks
                          </span>
                        </div>
                        <p
                          data-testid={`review-prompt-${question.id}`}
                          className={`mt-4 text-base font-bold leading-7 text-plum-dark ${promptLayoutClass(question.examStyle)}`}
                        >
                          {question.prompt}
                        </p>
                        {question.stimulus && (
                          <details className="mt-3 rounded-xl bg-surface-container-low p-4 text-sm leading-6 text-plum-muted">
                            <summary className="cursor-pointer font-bold text-plum-dark">
                              {question.stimulus.title ?? "Reading passage"}
                            </summary>
                            <p className="mt-2 whitespace-pre-wrap">{question.stimulus.body}</p>
                          </details>
                        )}
                        {question.visuals.length > 0 && (
                          <div className="mt-4 rounded-2xl border border-primary/8 bg-surface-container-low p-3 sm:p-4">
                            {question.visuals.map((visual) => (
                              <VisualRenderer key={visual.id} visual={visual} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-surface-container-low p-4">
                        <dt className="text-xs font-extrabold uppercase tracking-wide text-plum-muted">
                          Your answer
                        </dt>
                        <dd className="mt-1.5 text-sm font-semibold text-plum-dark">
                          {formatResponse(question, submitted) ?? "Not answered"}
                        </dd>
                      </div>
                      {detail?.requiresManualMarking ? (
                        <div className="rounded-xl bg-amber-light/60 p-4">
                          <dt className="text-xs font-extrabold uppercase tracking-wide text-amber-accent">
                            Marked by a person
                          </dt>
                          <dd className="mt-1.5 text-sm font-semibold text-plum-dark">
                            Writing tasks have no single correct answer. A marker
                            uses the rubric to award up to {detail.availableMarks} marks.
                          </dd>
                        </div>
                      ) : (
                        <div className="rounded-xl bg-teal-light/60 p-4">
                          <dt className="text-xs font-extrabold uppercase tracking-wide text-teal-accent">
                            Correct answer
                          </dt>
                          <dd className="mt-1.5 text-sm font-semibold text-plum-dark">
                            {correctAnswer}
                          </dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-4 rounded-xl border border-primary/8 bg-surface-container-low p-4">
                      <h3 className="font-jakarta text-xs font-extrabold uppercase tracking-wide text-primary">
                        Explanation
                      </h3>
                      <p className="mt-1.5 text-sm leading-6 text-plum-muted">
                        {question.explanation}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:justify-end">
            <Link
              href={homeHref}
              data-testid="results-review-home-link"
              className={buttonClasses({ variant: "secondary", size: "lg" })}
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              {homeLabel}
            </Link>
            <Button
              variant="orange"
              size="lg"
              onClick={handleRestart}
              data-testid="review-practice-again"
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
