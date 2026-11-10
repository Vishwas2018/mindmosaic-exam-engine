"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, XCircle, AlertCircle, Bookmark, ArrowLeft } from "lucide-react";
import { PREVIEW_REVIEW_QUESTIONS, type PreviewReviewQuestion } from "../../fixtures/student-preview-fixtures";

export interface StudentAnswerReviewProps {
  initialQuestions?: PreviewReviewQuestion[];
  paperTitle?: string;
  scoreText?: string;
}

type FilterKey = "all" | "wrong" | "unanswered" | "flagged";

export function StudentAnswerReview({
  initialQuestions = PREVIEW_REVIEW_QUESTIONS,
  paperTitle = "NAPLAN-style Numeracy",
  scoreText = "24 of 32 marks",
}: StudentAnswerReviewProps) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const counts = useMemo(() => {
    return {
      all: initialQuestions.length,
      wrong: initialQuestions.filter((q) => !q.isCorrect && q.studentAnswer !== null).length,
      unanswered: initialQuestions.filter((q) => q.studentAnswer === null).length,
      flagged: initialQuestions.filter((q) => q.isFlagged).length,
    };
  }, [initialQuestions]);

  const filteredQuestions = useMemo(() => {
    switch (activeFilter) {
      case "wrong":
        return initialQuestions.filter((q) => !q.isCorrect && q.studentAnswer !== null);
      case "unanswered":
        return initialQuestions.filter((q) => q.studentAnswer === null);
      case "flagged":
        return initialQuestions.filter((q) => q.isFlagged);
      case "all":
      default:
        return initialQuestions;
    }
  }, [initialQuestions, activeFilter]);

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-mm-muted">
        <Link href="/student" className="hover:text-royal">
          My Space
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-mm-muted/60" aria-hidden="true" />
        <Link href="/student/engagement" className="hover:text-royal">
          My Results
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-mm-muted/60" aria-hidden="true" />
        <span className="text-mm-muted">{paperTitle}</span>
        <ChevronRight className="h-3.5 w-3.5 text-mm-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-mm-ink font-bold">
          Every question
        </span>
      </nav>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-mm-ink sm:text-3xl">
          Every question, with the working
        </h1>
        <p className="mt-1 text-sm text-mm-muted max-w-2xl leading-relaxed">
          {paperTitle} &middot; 5 November &middot; <strong className="font-bold text-mm-ink">{scoreText}</strong>. Each question shows what you chose, what was right, and how it works out.
        </p>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-royal/8 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-mm-muted mr-1">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
            activeFilter === "all"
              ? "bg-royal text-white shadow-sm"
              : "bg-royal/5 text-royal hover:bg-royal/10"
          }`}
        >
          All {counts.all}
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("wrong")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
            activeFilter === "wrong"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-rose-50 text-rose-800 hover:bg-rose-100"
          }`}
        >
          <span>Wrong</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">{counts.wrong}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("unanswered")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
            activeFilter === "unanswered"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-amber-50 text-amber-900 hover:bg-amber-100"
          }`}
        >
          <span>Not answered</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">{counts.unanswered}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveFilter("flagged")}
          className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold transition ${
            activeFilter === "flagged"
              ? "bg-plum text-white shadow-sm"
              : "bg-plum/10 text-plum hover:bg-plum/20"
          }`}
        >
          <span>Flagged</span>
          <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px] font-bold">{counts.flagged}</span>
        </button>
      </div>

      {/* Question Cards List */}
      <div className="space-y-6 max-w-3xl">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-royal/10 bg-white p-8 text-center text-sm text-mm-muted">
            No questions match this filter.
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isUnanswered = q.studentAnswer === null;
            return (
              <article
                key={q.number}
                className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-royal/8 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal/10 text-xs font-bold text-royal">
                      Q{q.number}
                    </span>
                    <span className="text-xs font-semibold text-mm-muted">
                      {q.strand}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {q.isFlagged && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-plum/10 px-2.5 py-0.5 text-[11px] font-bold text-plum">
                        <Bookmark className="h-3 w-3 fill-current" aria-hidden="true" />
                        Flagged
                      </span>
                    )}

                    {q.isCorrect ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        Correct &middot; 1 mark
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        Not answered &middot; 0 marks
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                        <XCircle className="h-3 w-3" aria-hidden="true" />
                        Needs look &middot; 0 marks
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <p className="text-base font-semibold leading-relaxed text-mm-ink">
                  {q.prompt}
                </p>

                {/* Option Choices */}
                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const isStudentChoice = q.studentAnswer === opt.key;
                    const isRightChoice = q.correctAnswer === opt.key;

                    let optionBorder = "border-royal/10 bg-royal/[0.01]";
                    if (isStudentChoice && q.isCorrect) {
                      optionBorder = "border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold";
                    } else if (isStudentChoice && !q.isCorrect) {
                      optionBorder = "border-rose-400 bg-rose-50/50 text-rose-950 line-through";
                    } else if (isRightChoice && !q.isCorrect) {
                      optionBorder = "border-emerald-500 bg-emerald-50/30 text-emerald-950 font-bold";
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition ${optionBorder}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-current text-xs font-bold">
                            {opt.key}
                          </span>
                          <span>{opt.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          {isStudentChoice && (
                            <span className="rounded bg-royal/10 px-2 py-0.5 font-bold text-royal">
                              Your answer
                            </span>
                          )}
                          {isRightChoice && !isStudentChoice && (
                            <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-900">
                              Right answer
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* How it works out (Explanation) */}
                <div className="rounded-xl border border-royal/15 bg-royal/[0.03] p-4 text-xs leading-relaxed text-mm-ink space-y-1">
                  <p className="font-bold text-royal uppercase tracking-wider text-[10px]">
                    How it works out
                  </p>
                  <p className="text-mm-muted">{q.explanation}</p>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Return to My Results */}
      <div className="pt-4">
        <Link
          href="/student/engagement"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-royal/8 px-4 text-xs font-bold text-royal transition hover:bg-royal/15"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Return to My Results</span>
        </Link>
      </div>
    </div>
  );
}
