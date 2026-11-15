"use client";

import { useId } from "react";
import Link from "next/link";
import { Check, Clock, Info } from "lucide-react";

export interface WritingSubmissionItem {
  id: string;
  taskId: string;
  taskTitle: string;
  genre: "narrative" | "persuasive";
  submittedAt: string;
  status: "marked" | "pending_parent_review";
  marksEarned?: number;
  marksAvailable?: number;
}

export interface WritingPromptItem {
  id: string;
  title: string;
  genre: "narrative" | "persuasive";
  prompt: string;
}

export interface ChildWritingHistoryProps {
  child: {
    id: string;
    displayName: string;
    yearLevel?: number | null;
  };
  submissions: WritingSubmissionItem[];
  availablePrompts: WritingPromptItem[];
  isLocalPreview?: boolean;
}

/**
 * ChildWritingHistory (Parent Journey 5 - Writing Integration):
 *
 * Provides guardian oversight over written practice:
 * 1. Shows responses submitted by the child awaiting parent rubric marking.
 * 2. Displays past marked responses with rubric criteria scores.
 * 3. Shows approved prompts suitable for the child's academic year.
 */
export function ChildWritingHistory({
  child,
  submissions,
  availablePrompts,
  isLocalPreview = false,
}: ChildWritingHistoryProps) {
  const pendingHeadingId = useId();
  const promptsHeadingId = useId();
  const year = child.yearLevel ?? 3;

  const pendingSubmissions = submissions.filter(
    (s) => s.status === "pending_parent_review",
  );
  const markedSubmissions = submissions.filter((s) => s.status === "marked");

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
              href={`/parent/children/${child.id}/learning`}
              className="inline-flex min-h-11 items-center hover:text-royal transition"
            >
              Learning for {child.displayName}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">Writing</span>
          </nav>
          <p className="text-xs font-extrabold uppercase tracking-wider text-royal">
            Writing Practice
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {child.displayName}’s Writing
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            Mark your child&apos;s written responses against the official rubric.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Pending Parent Review Section */}
      <section
        aria-labelledby={pendingHeadingId}
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-royal/10 pb-4">
          <h2 id={pendingHeadingId} className="text-lg font-black text-ink">
            Awaiting your marking
          </h2>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
            {pendingSubmissions.length} {pendingSubmissions.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {pendingSubmissions.length === 0 ? (
          <p className="mt-4 text-xs font-medium text-muted">
            No written answers are waiting for review right now.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-royal/10">
            {pendingSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-muted">{sub.submittedAt}</span>
                  <h3 className="text-sm font-extrabold text-ink sm:text-base">
                    {sub.taskTitle}
                  </h3>
                  <span className="mt-1 inline-block rounded bg-royal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-royal">
                    {sub.genre}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-800">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    Needs your review
                  </span>
                  <Link
                    href={`/writing/mark/${sub.id}`}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-royal px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-royal/90 transition"
                  >
                    Mark with rubric &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Writing History */}
      {markedSubmissions.length > 0 && (
        <section className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs">
          <h2 className="text-lg font-black text-ink border-b border-royal/10 pb-4">
            Previously marked writing
          </h2>
          <div className="mt-4 divide-y divide-royal/10">
            {markedSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-muted">{sub.submittedAt}</span>
                  <h3 className="text-sm font-extrabold text-ink">{sub.taskTitle}</h3>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-display text-sm font-black text-ink">
                    {sub.marksEarned} of {sub.marksAvailable} marks
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-extrabold text-teal-800">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Marked
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Available Approved Writing Prompts */}
      <section
        aria-labelledby={promptsHeadingId}
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
      >
        <h2 id={promptsHeadingId} className="text-lg font-black text-ink">
          Approved writing prompts at Year {year}
        </h2>
        <p className="mt-1 text-xs font-medium text-muted">
          Prompts meeting educational governance criteria. Your child can write these in their student space.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {availablePrompts.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-royal/10 bg-surface-container-low/30 p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black text-ink">{task.title}</h3>
                <span className="rounded bg-royal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-royal">
                  {task.genre}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                {task.prompt}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
