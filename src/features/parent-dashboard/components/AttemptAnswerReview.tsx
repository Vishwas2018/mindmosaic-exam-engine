"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight, Info } from "lucide-react";
import {
  PREVIEW_CHILDREN,
  PREVIEW_RESULTS_AISHA,
  PREVIEW_ANSWER_REVIEW_READING,
} from "../fixtures";

export interface AttemptAnswerReviewProps {
  childId: string;
  resultId: string;
}

export function AttemptAnswerReview({ childId, resultId }: AttemptAnswerReviewProps) {
  const child = PREVIEW_CHILDREN.find((c) => c.id === childId) || PREVIEW_CHILDREN[0];
  const result =
    PREVIEW_RESULTS_AISHA.find((r) => r.id === resultId) || PREVIEW_RESULTS_AISHA[0];

  const [filter, setFilter] = useState<"all" | "correct" | "review">("all");

  const allItems = PREVIEW_ANSWER_REVIEW_READING;
  const filteredItems = allItems.filter((item) => {
    if (filter === "correct") return item.isCorrect;
    if (filter === "review") return !item.isCorrect;
    return true;
  });

  const correctCount = allItems.filter((i) => i.isCorrect).length;
  const reviewCount = allItems.filter((i) => !i.isCorrect).length;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-muted">
        <Link href="/parent" className="hover:text-royal">
          Family Overview
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <Link href={`/parent/children/${child.id}/progress`} className="hover:text-royal">
          {child.firstName}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <Link
          href={`/parent/children/${child.id}/results/${result.id}`}
          className="hover:text-royal"
        >
          {result.title}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-muted/60" aria-hidden="true" />
        <span aria-current="page" className="text-ink">
          Going through the answers
        </span>
      </nav>

      {/* Header (b17) */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-royal">{result.title}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Going through the answers
          </h1>
          <p className="mt-1 text-base text-muted">
            Every question, what {child.firstName} put, and what was expected.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal">
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
          Illustrative sample family
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-royal/10 pb-4">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "all"
              ? "bg-royal text-white"
              : "bg-white text-muted hover:bg-royal/5 hover:text-royal"
          }`}
        >
          All questions ({allItems.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("correct")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "correct"
              ? "bg-emerald-700 text-white"
              : "bg-white text-muted hover:bg-emerald-50 hover:text-emerald-800"
          }`}
        >
          Correct ({correctCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("review")}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            filter === "review"
              ? "bg-rose-700 text-white"
              : "bg-white text-muted hover:bg-rose-50 hover:text-rose-800"
          }`}
        >
          To look at ({reviewCount})
        </button>
      </div>

      {/* Questions Review List */}
      <div className="space-y-4">
        {filteredItems.map((item) => (
          <article
            key={item.questionNumber}
            className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-royal">
                  Question {item.questionNumber} &middot; {item.strand}
                </span>
                <h2 className="mt-1 text-base font-bold text-ink sm:text-lg">
                  {item.questionText}
                </h2>
              </div>
              {item.isCorrect ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                  Correct
                </span>
              ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5 text-rose-600" aria-hidden="true" />
                  To look at
                </span>
              )}
            </div>

            {/* Answer details */}
            <div className="mt-4 space-y-2 rounded-xl bg-royal/[0.02] p-4 text-xs sm:text-sm">
              <div>
                <span className="font-semibold text-muted">What {child.firstName} put:</span>{" "}
                <span className={`font-semibold ${item.isCorrect ? "text-emerald-900" : "text-rose-900 line-through"}`}>
                  {item.studentAnswer}
                </span>
              </div>
              {!item.isCorrect && (
                <div>
                  <span className="font-semibold text-muted">Expected answer:</span>{" "}
                  <span className="font-semibold text-ink">{item.expectedAnswer}</span>
                </div>
              )}
            </div>

            {/* Explanation */}
            <div className="mt-3 text-xs leading-relaxed text-muted">
              <span className="font-semibold text-ink">Explanation:</span> {item.explanation}
            </div>
          </article>
        ))}
      </div>

      {/* Return link */}
      <div className="pt-4">
        <Link
          href={`/parent/children/${child.id}/results/${result.id}`}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-royal/15 bg-white px-4 text-xs font-bold text-ink transition hover:border-royal hover:text-royal"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to result summary</span>
        </Link>
      </div>
    </div>
  );
}
