"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, HelpCircle, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui";
import {
  ChildSwitcher,
  MarksMeter,
  ClaimWithEvidence,
  LoadingStateBlock,
  NothingYetStateBlock,
  CouldNotLoadStateBlock,
  type ChildSummary,
} from "@/features/parent-dashboard";

export interface FamilyOverviewProps {
  summaries: readonly ChildSummary[];
  parentName?: string;
  forcedState?: "loading" | "error" | "offline";
  isOffline?: boolean;
}

/**
 * Family Overview component (artboards b5–b10):
 *
 * Implements:
 * - Decision P2: Heading is "Family Overview"; nav is "This week".
 * - Decision P3 & D-P4: Evidence floor (>=2 papers AND >=8 marks) via ClaimWithEvidence.
 *   Floor is strictly scoped to the specific child and subject/strand.
 * - Non-negotiable honesty rules: Partial failure callout driven by real
 *   `unreadableAttemptCount > 0` with neutral wording ("N records were excluded from these totals").
 * - Child switching: Seamless switching between All children and individual child cards.
 *   Unavailable or loading data is never presented as a genuine first visit.
 * - Responsive reflow:
 *   Desktop (1440px): 2-column layout (main + side rail).
 *   Tablet (834px): Side rail stacks below main column.
 *   Mobile (390px): Single column, horizontal scrollable child switcher, bottom nav.
 */
export function FamilyOverview({
  summaries,
  forcedState,
  isOffline,
}: FamilyOverviewProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  if (forcedState === "loading") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Family Overview
          </h1>
          <p className="mt-1 text-sm text-muted">Checking this week&apos;s practice...</p>
        </div>
        <LoadingStateBlock />
      </div>
    );
  }

  if (forcedState === "error") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Family Overview
          </h1>
        </div>
        <CouldNotLoadStateBlock
          title="We couldn't load your family summary."
          description="Nothing has changed. Your children, their results and your plan are all unchanged."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  if (summaries.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Family Overview
          </h1>
          <p className="mt-1 text-sm text-muted">No children added to your account yet.</p>
        </div>
        <NothingYetStateBlock
          childName="your family"
          description="Add a child to create their login. Once they finish timed papers, their weekly summary and marks will appear here."
        />
      </div>
    );
  }

  // Filter children list based on switcher selection
  const switcherChildren = summaries.map((s) => ({
    id: s.childId,
    name: s.displayName,
  }));

  const displayedChildren = selectedChildId
    ? summaries.filter((s) => s.childId === selectedChildId)
    : summaries;

  const currentUnreadableCount = displayedChildren.reduce(
    (acc, s) => acc + s.unreadableAttemptCount,
    0,
  );
  const currentFinishedPapers = displayedChildren.reduce(
    (acc, s) => acc + s.attemptCount,
    0,
  );

  // A view is a genuine first visit ONLY if there are 0 finished papers AND 0 unreadable records
  const isFirstVisit =
    displayedChildren.length > 0 &&
    currentFinishedPapers === 0 &&
    currentUnreadableCount === 0;

  // Has unavailable/unreadable data where all attempts failed validation
  const isUnavailableData =
    displayedChildren.length > 0 &&
    currentFinishedPapers === 0 &&
    currentUnreadableCount > 0;

  const childNames = displayedChildren.map((s) => s.displayName).join(" and ");

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
          Family Overview
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isUnavailableData
            ? `Some activity for ${childNames} could not be read. Unreadable records are excluded until resolved.`
            : isFirstVisit
            ? `${childNames} ${displayedChildren.length === 1 ? "is" : "are"} set up. Nothing has been finished yet, so there is nothing to report.`
            : "This week's activity and practice marks across your children."}
        </p>
      </div>

      {/* Offline banner if offline state */}
      {(forcedState === "offline" || isOffline) && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-900"
        >
          <WifiOff className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-extrabold text-ink">You are offline.</span>{" "}
            <span className="text-muted">
              What you can see was loaded earlier. Nothing will save until you are back online.
            </span>
          </div>
        </div>
      )}

      {/* Honest Partial Failure Callout (§1 Honesty Rule #6 & b7): Neutral wording matching source count */}
      {currentUnreadableCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-ink shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-ink">Some of this week&apos;s activity couldn&apos;t be read</h2>
            <p className="text-xs text-muted">
              {currentUnreadableCount} {currentUnreadableCount === 1 ? "record was" : "records were"} excluded from these totals.
            </p>
          </div>
        </div>
      )}

      {/* Child Switcher (P1 primitive) */}
      {summaries.length > 1 && (
        <ChildSwitcher
          childrenList={switcherChildren}
          selectedId={selectedChildId}
          onSelect={setSelectedChildId}
        />
      )}

      {/* Responsive Layout: Desktop 2-column with side rail, Tablet/Mobile 1-column with rail below */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px] items-start">
        {/* Main Column: Child Cards */}
        <div className="space-y-6">
          {displayedChildren.map((child) => {
            const daysPractised = child.weekActivity.filter((d) => d.practised).length;
            const latestAttempt = child.recentAttempts[0];

            // Determine top and lowest subjects for evaluative claims
            const validSubjects = child.subjects.filter((s) => s.marksAvailable > 0);
            const sortedByRatio = [...validSubjects].sort((a, b) => {
              const ratioA = a.marksAvailable > 0 ? a.marksEarned / a.marksAvailable : 0;
              const ratioB = b.marksAvailable > 0 ? b.marksEarned / b.marksAvailable : 0;
              return ratioB - ratioA;
            });
            const topSubject = sortedByRatio[0];
            const lowestSubject = sortedByRatio[sortedByRatio.length - 1];

            return (
              <section
                key={child.childId}
                aria-labelledby={`child-card-${child.childId}`}
                className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm space-y-6"
              >
                {/* Child Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-royal/8 pb-4">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-royal/10 text-royal font-black text-sm"
                    >
                      {child.displayName.trim().charAt(0).toUpperCase() || "C"}
                    </span>
                    <div>
                      <h2
                        id={`child-card-${child.childId}`}
                        className="text-lg font-extrabold text-ink"
                      >
                        {child.displayName}
                      </h2>
                      <p className="text-xs font-semibold text-muted">
                        {child.yearLevel ? `Year ${child.yearLevel} · ` : ""}
                        {child.attemptCount === 0
                          ? child.unreadableAttemptCount > 0
                            ? "activity excluded"
                            : "ready to start"
                          : `${child.attemptCount} ${child.attemptCount === 1 ? "finished paper" : "finished papers"}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {child.archived && (
                      <Badge variant="warning">Paused</Badge>
                    )}
                    {daysPractised > 0 && (
                      <span className="inline-flex items-center rounded-full bg-royal/8 px-3 py-1 text-xs font-bold text-royal">
                        {daysPractised} {daysPractised === 1 ? "day" : "days"} practised this week
                      </span>
                    )}
                  </div>
                </div>

                {child.archived && (
                  /* A paused login is said in words, with the way back, not left to a badge. */
                  <p className="mt-3 text-sm font-semibold text-warning" role="status">
                    {child.displayName}&apos;s login is archived, so they can&apos;t sign in. Their results are kept.{" "}
                    <Link href="/parent/children" className="underline">
                      Restore from Children
                    </Link>
                    .
                  </p>
                )}

                {/* Seven-day activity display */}
                {child.weekActivity && child.weekActivity.length > 0 && (
                  <div className="rounded-xl border border-royal/8 bg-royal/5 p-3.5">
                    <div className="flex items-center justify-between pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        This week&apos;s activity
                      </span>
                      <span className="text-xs font-bold text-royal">
                        {daysPractised} of 7 days
                      </span>
                    </div>
                    <div
                      role="group"
                      aria-label={`${child.displayName}'s practice activity this week: ${daysPractised} of 7 days`}
                      className="grid grid-cols-7 gap-1.5 pt-1"
                    >
                      {child.weekActivity.map((day) => (
                        <div key={day.label} className="flex flex-col items-center gap-1">
                          <span
                            aria-hidden="true"
                            className={`h-2.5 w-full rounded-full transition-colors ${
                              day.practised
                                ? "bg-royal"
                                : day.isToday
                                ? "bg-royal/20 border border-royal/40"
                                : "bg-royal/10"
                            }`}
                          />
                          <span
                            className={`text-[10px] font-bold ${
                              day.isToday ? "text-royal font-black" : day.practised ? "text-ink" : "text-muted"
                            }`}
                          >
                            {day.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* State: No finished attempts yet */}
                {child.attemptCount === 0 ? (
                  child.unreadableAttemptCount > 0 ? (
                    /* Unavailable / Unreadable Data State: Cannot appear as genuine first visit */
                    <div className="space-y-4">
                      <CouldNotLoadStateBlock
                        title={`We couldn't read ${child.displayName}'s activity.`}
                        description={`${child.unreadableAttemptCount} ${child.unreadableAttemptCount === 1 ? "record was" : "records were"} excluded from these totals because the stored format could not be verified.`}
                      />
                    </div>
                  ) : (
                    /* Genuine First Visit State (b6) */
                    <div className="space-y-4">
                      <NothingYetStateBlock
                        childName={child.displayName}
                        description={`When ${child.displayName} finishes a timed paper, the result and the strands behind it appear here.`}
                      />
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link
                          href={`/parent/children`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
                        >
                          Sign-in details
                        </Link>
                        <Link
                          href={`/parent/children/${child.childId}/curriculum`}
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal/15 bg-white px-4 text-xs font-extrabold text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                        >
                          Browse learning
                        </Link>
                      </div>
                    </div>
                  )
                ) : (
                  /* State: Has finished attempts (b5) */
                  <div className="space-y-6">
                    {/* Latest Finished Paper */}
                    {latestAttempt && (
                      <div className="rounded-xl border border-royal/8 bg-royal/5 p-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted">
                          Latest finished paper
                        </span>
                        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-extrabold text-ink">
                            {latestAttempt.label}
                          </span>
                          <span className="text-sm font-black text-ink tabular-nums">
                            {latestAttempt.marksEarned} of {latestAttempt.marksAvailable} marks{" "}
                            <span className="text-xs font-normal text-muted">
                              · {latestAttempt.submittedAtLabel}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Per-subject Marks (via MarksMeter — strictly scoped to subject's paperCount, never a %, never a band) */}
                    {validSubjects.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                          Subject marks
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                          {validSubjects.map((s) => (
                            <MarksMeter
                              key={s.subject}
                              label={s.label}
                              earnedMarks={s.marksEarned}
                              availableMarks={s.marksAvailable}
                              papersCount={s.paperCount}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluative Claims (via ClaimWithEvidence — strictly scoped to subject's paperCount and marksAvailable) */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {topSubject ? (
                        <ClaimWithEvidence
                          label="Going well"
                          headline={`Going well: ${topSubject.label}`}
                          papersCount={topSubject.paperCount}
                          marksCount={topSubject.marksAvailable}
                          grouping="subject"
                        />
                      ) : (
                        <ClaimWithEvidence
                          label="Going well"
                          headline="Going well"
                          papersCount={0}
                          marksCount={0}
                          grouping="subject"
                        />
                      )}

                      {lowestSubject ? (
                        <ClaimWithEvidence
                          label="To practise"
                          headline={`To practise: ${lowestSubject.label}`}
                          papersCount={lowestSubject.paperCount}
                          marksCount={lowestSubject.marksAvailable}
                          grouping="subject"
                        />
                      ) : (
                        <ClaimWithEvidence
                          label="To practise"
                          headline="To practise"
                          papersCount={0}
                          marksCount={0}
                          grouping="subject"
                        />
                      )}
                    </div>

                    {/* Suggested Next (Proposal note per b5) */}
                    <div className="rounded-xl border border-royal/8 bg-royal/5 p-3 text-xs">
                      <span className="font-extrabold text-ink">Suggested next: </span>
                      <span className="text-muted">
                        a 10-question {lowestSubject ? lowestSubject.label.toLowerCase() : "mixed"} set.
                      </span>
                      <span className="block text-[11px] text-muted mt-0.5">
                        A suggestion from us, not something {child.displayName} has done.
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-royal/8 pt-4">
                      <Link
                        href={`/parent/children`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
                      >
                        Manage {child.displayName}
                      </Link>
                      <Link
                        href={`/parent/children/${child.childId}/curriculum`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal/15 bg-white px-4 text-xs font-extrabold text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
                      >
                        Browse learning
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Side Rail (Desktop & Tablet) */}
        <aside aria-label="About family overview" className="space-y-6">
          {isFirstVisit ? (
            /* b6 Side Rail: Three things worth knowing */
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-ink">Three things worth knowing</h2>
              <div className="space-y-4 text-xs text-muted">
                <div>
                  <h3 className="font-bold text-ink">Children sign in with a code and a PIN</h3>
                  <p className="mt-0.5">
                    Not an email address. Both are found on each child&apos;s profile card.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-ink">Only finished timed papers are recorded</h3>
                  <p className="mt-0.5">
                    Practice sets are for trying things out and are never kept or scored against the child.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-ink">You will not see a predicted exam score here</h3>
                  <p className="mt-0.5">
                    We show marks earned out of marks available, and state how much verified work each figure rests on.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* b5 Side Rail: What these figures are */
            <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-base font-extrabold text-ink">What these figures are</h2>
              <p className="text-xs text-muted leading-relaxed">
                Everything above is worked out from finished timed papers. Practice sets are not
                recorded, and lessons opened are not counted.
              </p>
              <p className="text-xs text-muted leading-relaxed">
                &ldquo;Going well&rdquo; and &ldquo;to practise&rdquo; compare marks earned against
                marks available within one child&apos;s own work &mdash; never against other children,
                and never as a predicted exam result.
              </p>
              <div className="pt-2 border-t border-royal/8">
                <Link
                  href="/parent/help"
                  className="inline-flex min-h-11 items-center gap-1 text-xs font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
                >
                  How we work these out &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Quick Support Card */}
          <div className="rounded-2xl border border-royal/10 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-royal" aria-hidden="true" />
              <h3 className="text-xs font-extrabold text-ink">Need assistance?</h3>
            </div>
            <p className="mt-2 text-xs text-muted">
              Read our comprehensive parent guide or email education support directly.
            </p>
            <div className="mt-1">
              <Link
                href="/parent/help"
                className="inline-flex min-h-11 items-center text-xs font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
              >
                Visit Help Centre &rarr;
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
