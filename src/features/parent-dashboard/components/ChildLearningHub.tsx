"use client";

import { useId } from "react";
import Link from "next/link";
import { Check, Info, Lock } from "lucide-react";

import { ChildSwitcher, type ChildSwitcherItem } from "./ChildSwitcher";
import { type ProgrammeAvailability } from "../fixtures";

export interface ChildLearningHubProps {
  child: {
    id: string;
    displayName: string;
    yearLevel?: number | null;
    loginCode?: string;
  };
  siblings: ChildSwitcherItem[];
  programmes: ProgrammeAvailability[];
  isLocalPreview?: boolean;
}

/**
 * ChildLearningHub (Parent Journey 5 - Artboards #22 & #23):
 *
 * Core design specifications:
 * 1. Read-only Parent preview: Emphasises that parent exploration never mutates or creates student attempt rows.
 * 2. Three distinct programme states with non-overlapping copy:
 *    - "Ready": Available questions, sets of 10/20/full, "Have a look" and "How to start" links.
 *    - "Not written yet": Transparently states content is not available yet, not hidden.
 *    - "We couldn't check": Honest partial failure state, never pretends or guesses.
 * 3. Scope honesty: "Only Years 3 and 5 are open. Other years are not shown at all rather than shown as empty."
 * 4. "Help get started" step-by-step guidance referencing the child's real or preview login credentials.
 */
export function ChildLearningHub({
  child,
  siblings,
  programmes,
  isLocalPreview = false,
}: ChildLearningHubProps) {
  const availHeadingId = useId();
  const startHeadingId = useId();
  const year = child.yearLevel ?? 3;
  const pronoun = child.displayName.toLowerCase() === "aisha" ? "her" : "them";
  const subjectivePronoun = child.displayName.toLowerCase() === "aisha" ? "she" : "they";

  return (
    <div className="space-y-8">
      {/* Header & Greet */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
            <Link href="/parent" className="hover:text-royal transition">
              Family Overview
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink font-bold">Learning for {child.displayName}</span>
          </nav>
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
            Learning for {child.displayName}
          </h1>
          <p className="mt-1 text-sm font-medium text-muted sm:text-base">
            What is available at Year {year}, and how to get {pronoun} going.
          </p>
        </div>

        {isLocalPreview && (
          <span className="inline-flex min-h-8 items-center gap-1.5 self-start rounded-full border border-royal/10 bg-royal/5 px-3 py-1 text-xs font-semibold text-royal shadow-xs">
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            Illustrative sample family
          </span>
        )}
      </div>

      {/* Child Switcher Pill Navigation */}
      <ChildSwitcher
        childrenList={siblings}
        selectedId={child.id}
        showAllOption={true}
        hrefForChild={(id) => (id ? `/parent/children/${id}/learning` : "/parent")}
      />

      {/* Preview Isolation Banner */}
      <div
        role="status"
        className="flex items-start gap-3 rounded-2xl border border-royal/15 bg-royal/5 p-4 text-xs sm:text-sm text-ink"
      >
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-royal" aria-hidden="true" />
        <div className="leading-relaxed">
          <strong className="font-extrabold text-ink">Anything you open here is a preview for you.</strong>{" "}
          It is not recorded as {child.displayName}’s work, it does not appear in {pronoun} results, and it does not use up a paper.
        </div>
      </div>

      {/* Programme Availability Section */}
      <section
        aria-labelledby={availHeadingId}
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs"
      >
        <h2 id={availHeadingId} className="text-lg font-black text-ink">
          What Year {year} can practise
        </h2>
        <p className="mt-1 text-xs font-medium text-muted">
          Three different things a programme can be, and they never share wording: ready to use, not written yet, or we could not check.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((p) => {
            if (p.status === "ready") {
              return (
                <article
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-royal/10 bg-white p-5 shadow-2xs hover:border-royal/20 transition"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black text-ink sm:text-base">
                        {p.title}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-0.5 text-xs font-extrabold text-teal-800">
                        <Check className="h-3 w-3" aria-hidden="true" />
                        Ready
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-medium text-muted">
                      {p.questionCountEstimated ? `about ${p.questionCountEstimated} questions · ` : ""}
                      {p.setSizesDescription ?? "sets of 10 or 20"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2 pt-2 border-t border-royal/10">
                    <Link
                      href={`/parent/children/${child.id}/learning/preview?programme=${p.id}`}
                      className="inline-flex min-h-8 items-center rounded-lg border border-royal/20 bg-white px-3 py-1.5 text-xs font-extrabold text-royal hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30"
                    >
                      Have a look
                    </Link>
                    <a
                      href="#h-start"
                      className="inline-flex min-h-8 items-center rounded-lg px-2.5 py-1.5 text-xs font-bold text-muted hover:text-ink transition"
                    >
                      How to start
                    </a>
                  </div>
                </article>
              );
            }

            if (p.status === "not_written") {
              return (
                <article
                  key={p.id}
                  className="flex flex-col justify-between rounded-xl border border-royal/10 bg-surface-container-low/40 p-5 shadow-2xs"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-extrabold text-muted sm:text-base">
                        {p.title}
                      </h3>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-0.5 text-xs font-bold text-muted">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Not written yet
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {p.description ??
                        `There are no questions for this one at Year ${year} yet. It is not hidden from you, and it is not coming this term.`}
                    </p>
                  </div>
                </article>
              );
            }

            // could_not_check state
            return (
              <article
                key={p.id}
                className="flex flex-col justify-between rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-extrabold text-amber-950 sm:text-base">
                      {p.title}
                    </h3>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                      We couldn’t check
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-amber-900/80">
                    {p.description ??
                      "We could not work out what is available here just now. There may be plenty or there may be none — we are not going to guess. Try again shortly."}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-xs font-semibold text-muted">
          Only Years 3 and 5 are open. Other years are not shown at all rather than shown as empty.
        </p>
      </section>

      {/* Help Get Started Section */}
      <section
        id="h-start"
        aria-labelledby={startHeadingId}
        className="rounded-2xl border border-royal/10 bg-white p-6 shadow-xs scroll-mt-6"
      >
        <h2 id={startHeadingId} className="text-lg font-black text-ink">
          Help {child.displayName} get started
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-royal/10 bg-surface-container-low/30 p-4">
            <h3 className="text-sm font-extrabold text-ink">
              1 · Sit with {pronoun} the first time
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {child.displayName}’s login code is{" "}
              <code className="rounded bg-royal/10 px-1 py-0.5 font-mono font-bold text-royal">
                {child.loginCode}
              </code>{" "}
              and you set the PIN. The first sign-in is the only fiddly bit.
            </p>
          </div>

          <div className="rounded-xl border border-royal/10 bg-surface-container-low/30 p-4">
            <h3 className="text-sm font-extrabold text-ink">
              2 · Start with a practice set
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              No timer, no record kept. {subjectivePronoun.charAt(0).toUpperCase() + subjectivePronoun.slice(1)} can stop whenever {subjectivePronoun} likes and nothing counts against {pronoun}.
            </p>
          </div>

          <div className="rounded-xl border border-royal/10 bg-surface-container-low/30 p-4">
            <h3 className="text-sm font-extrabold text-ink">
              3 · Move to a timed paper later
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Timed papers are the ones that appear in your Family Overview. One a fortnight is plenty at Year {year}.
            </p>
          </div>
        </div>
      </section>

      {/* Writing Practice Navigation Link */}
      <div className="rounded-2xl border border-royal/10 bg-royal/5 p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-royal">
              Writing Practice
            </span>
            <p className="mt-0.5 text-sm font-extrabold text-ink">
              Looking for written tasks? Review and mark {child.displayName}’s responses against the official rubric.
            </p>
          </div>
          <Link
            href={`/parent/children/${child.id}/writing`}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-royal/20 bg-white px-4 py-2 text-xs font-extrabold text-royal shadow-2xs hover:bg-royal/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/30 shrink-0"
          >
            View Writing &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
