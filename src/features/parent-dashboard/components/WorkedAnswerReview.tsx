"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, Info, Minus, X } from "lucide-react";

import { type PreviewAnswerReviewItem } from "../fixtures";

export interface WorkedAnswerReviewProps {
  paperTitle: string;
  child: {
    id: string;
    displayName: string;
  };
  resultId: string;
  questions: PreviewAnswerReviewItem[];
  isLocalPreview?: boolean;
}

type QuestionFilter = "all" | "incorrect" | "unanswered" | "pending";

/**
 * WorkedAnswerReview (Parent Journey 4 - Artboard #08):
 *
 * Visual hierarchy and pedagogical honesty rules:
 * 1. Honest distinction: Not answered, answered wrongly, and awaiting marking are never rendered the same way.
 * 2. Never drawn as zero: Questions awaiting a person are drawn as "Not yet marked", NEVER as zero marks.
 * 3. Worked explanations: Clear "Why:" callout boxes explain the reasoning behind the expected answer.
 * 4. Interactive status filters: Filter by All, Not correct, Not answered, and With a person with live counts.
 */
export function WorkedAnswerReview({
  paperTitle,
  child,
  resultId,
  questions,
  isLocalPreview = false,
}: WorkedAnswerReviewProps) {
  const [filter, setFilter] = useState<QuestionFilter>("all");

  const incorrectCount = questions.filter((q) => q.status === "incorrect").length;
  const unansweredCount = questions.filter((q) => q.status === "unanswered").length;
  const pendingCount = questions.filter((q) => q.status === "pending").length;

  const filteredQuestions = questions.filter((q) => {
    if (filter === "incorrect") return q.status === "incorrect";
    if (filter === "unanswered") return q.status === "unanswered";
    if (filter === "pending") return q.status === "pending";
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Link href="/parent" className="inline-flex min-h-11 items-center hover:text-royal transition">
              Family Overview
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href={`/parent/children/${child.id}/progress`}
              className="inline-flex min-h-11 items-center hover:text-royal transition"
            >
              {child.displayName}
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/parent/results/${resultId}`} className="inline-flex min-h-11 items-center hover:text-royal transition">
              This paper
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">Answers</span>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-wider text-royal">
            {paperTitle}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Going through the answers
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            Every question, what {child.displayName} put, and what was expected.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Filter Button Strip */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilter("all")}
          aria-pressed={filter === "all"}
          className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "all"
              ? "bg-royal text-white shadow-xs"
              : "border border-royal/10 bg-white text-ink hover:bg-royal/5"
          }`}
        >
          All {questions.length}
        </button>
        <button
          type="button"
          onClick={() => setFilter("incorrect")}
          aria-pressed={filter === "incorrect"}
          className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "incorrect"
              ? "bg-coral-600 text-white shadow-xs"
              : "border border-coral-500/20 bg-white text-ink hover:bg-coral-500/5"
          }`}
        >
          Not correct {incorrectCount}
        </button>
        <button
          type="button"
          onClick={() => setFilter("unanswered")}
          aria-pressed={filter === "unanswered"}
          className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "unanswered"
              ? "bg-ink text-white shadow-xs"
              : "border border-royal/10 bg-white text-ink hover:bg-royal/5"
          }`}
        >
          Not answered {unansweredCount}
        </button>
        <button
          type="button"
          onClick={() => setFilter("pending")}
          aria-pressed={filter === "pending"}
          className={`min-h-11 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 ${
            filter === "pending"
              ? "bg-amber-600 text-white shadow-xs"
              : "border border-amber-500/20 bg-white text-ink hover:bg-amber-500/5"
          }`}
        >
          With a person {pendingCount}
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => {
          let borderAccent = "border-l-4 border-l-teal-600";
          let badge = (
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-black text-teal-800">
              <Check className="h-3 w-3" aria-hidden="true" />
              Correct
            </span>
          );
          let scoreText = `${q.marksEarned} of ${q.marksAvailable}`;

          if (q.status === "incorrect") {
            borderAccent = "border-l-4 border-l-coral-500";
            badge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-coral-500/15 px-2.5 py-0.5 text-xs font-black text-coral-800">
                <X className="h-3 w-3" aria-hidden="true" />
                Not correct
              </span>
            );
          } else if (q.status === "unanswered") {
            borderAccent = "border-l-4 border-l-muted";
            badge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-0.5 text-xs font-black text-muted">
                <Minus className="h-3 w-3" aria-hidden="true" />
                Not answered
              </span>
            );
          } else if (q.status === "pending") {
            borderAccent = "border-l-4 border-l-amber-500";
            badge = (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-black text-amber-800">
                <Clock className="h-3 w-3" aria-hidden="true" />
                With a person
              </span>
            );
            scoreText = "Not yet marked";
          }

          return (
            <div
              key={q.questionNumber}
              className={`rounded-2xl border border-royal/10 bg-white p-5 shadow-xs ${borderAccent}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-royal/10 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-ink">Question {q.questionNumber}</h3>
                  <span className="text-xs font-medium text-muted">· {q.strand}</span>
                </div>
                <div className="flex items-center gap-3">
                  {badge}
                  <span className="text-xs font-bold tabular-nums text-muted">{scoreText}</span>
                </div>
              </div>

              <p className="mt-3 text-sm font-medium leading-relaxed text-ink/90">
                {q.questionText}
              </p>

              <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl border border-royal/10 bg-surface-container-low/40 p-3">
                  <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
                    {child.displayName} answered
                  </dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {q.studentAnswer}
                  </dd>
                </div>

                {q.status !== "pending" && (
                  <div className="rounded-xl border border-royal/10 bg-surface-container-low/40 p-3">
                    <dt className="text-xs font-extrabold uppercase tracking-wider text-muted">
                      Correct answer
                    </dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {q.expectedAnswer}
                    </dd>
                  </div>
                )}
              </dl>

              {q.explanation && (
                <div className="mt-4 rounded-xl border border-royal/10 bg-royal/5 p-3.5 text-xs leading-relaxed text-ink/80">
                  <strong className="font-bold text-ink">Why: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Honest Pedagogical Notice Footer */}
      <div className="rounded-2xl border border-royal/10 bg-white p-4 text-center text-xs font-medium text-muted shadow-xs">
        Not answered and answered wrongly are never shown the same way, and nothing awaiting a person is ever drawn as zero.
      </div>
    </div>
  );
}
