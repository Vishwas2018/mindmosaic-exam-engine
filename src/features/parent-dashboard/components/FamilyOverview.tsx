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
}

/**
 * Family Overview component (artboards b5–b10):
 *
 * Implements:
 * - Decision P2: Heading is "Family Overview"; nav is "This week".
 * - Decision P3: Evidence floor (>=2 papers AND >=8 marks) via ClaimWithEvidence.
 * - Decision D-P4: Zero performance bands, zero percentages. All figures are
 *   marks earned out of marks available via MarksMeter.
 * - Non-negotiable honesty rules: Partial failure callout driven by real
 *   `unreadableRowCount > 0`.
 * - Responsive reflow:
 *   Desktop (1440px): 2-column layout (main + side rail).
 *   Tablet (834px): Side rail stacks below main column.
 *   Mobile (390px): Single column, horizontal scrollable child switcher.
 */
export function FamilyOverview({
  summaries,
  forcedState,
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

  // Filter children list based on switcher selection
  const switcherChildren = summaries.map((s) => ({
    id: s.childId,
    name: s.displayName,
  }));

  const displayedChildren = selectedChildId
    ? summaries.filter((s) => s.childId === selectedChildId)
    : summaries;

  const totalFinishedPapers = summaries.reduce((acc, s) => acc + s.attemptCount, 0);
  const totalUnreadableCount = summaries.reduce(
    (acc, s) => acc + s.unreadableAttemptCount,
    0,
  );
  const isFirstVisit = totalFinishedPapers === 0;

  const childNames = summaries.map((s) => s.displayName).join(" and ");

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
          Family Overview
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isFirstVisit
            ? `${childNames} ${summaries.length === 1 ? "is" : "are"} set up. Nothing has been finished yet, so there is nothing to report.`
            : "Summary of practice and assessments across your children for this week."}
        </p>
      </div>

      {/* Offline banner if offline state */}
      {forcedState === "offline" && (
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

      {/* Honest Partial Failure Callout (§1 Honesty Rule #6 & b7): Driven by unreadableRowCount > 0 */}
      {totalUnreadableCount > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-ink shadow-sm"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <h2 className="font-extrabold text-ink">Some of this week&apos;s activity couldn&apos;t be read</h2>
            <p className="text-xs text-muted">
              {totalUnreadableCount} {totalUnreadableCount === 1 ? "attempt" : "attempts"} could
              not be verified from stored records. Results shown below only include verified completed papers.
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
                          ? "ready to start"
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

                {/* State: No finished attempts yet (b6 First Visit) */}
                {child.attemptCount === 0 ? (
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

                    {/* Per-subject Marks (via MarksMeter — never a %, never a band) */}
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
                              papersCount={child.attemptCount}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Evaluative Claims (via ClaimWithEvidence — strictly floor enforced) */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {topSubject ? (
                        <ClaimWithEvidence
                          headline={`Going well: ${topSubject.label}`}
                          papersCount={child.attemptCount}
                          marksCount={topSubject.marksAvailable}
                        />
                      ) : (
                        <ClaimWithEvidence
                          headline="Going well"
                          papersCount={child.attemptCount}
                          marksCount={0}
                        />
                      )}

                      {lowestSubject ? (
                        <ClaimWithEvidence
                          headline={`To practise: ${lowestSubject.label}`}
                          papersCount={child.attemptCount}
                          marksCount={lowestSubject.marksAvailable}
                        />
                      ) : (
                        <ClaimWithEvidence
                          headline="To practise"
                          papersCount={child.attemptCount}
                          marksCount={0}
                        />
                      )}
                    </div>

                    {/* Suggested Next (Proposal note per b5) */}
                    <div className="rounded-xl border border-royal/8 bg-royal/5 p-3 text-xs">
                      <span className="font-extrabold text-ink">Suggested next: </span>
                      <span className="text-muted">
                        a 10-question {lowestSubject ? lowestSubject.label.toLowerCase() : "mixed"} set.
                      </span>
                      <span className="block text-[11px] text-muted/75 mt-0.5">
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
                  className="inline-flex items-center gap-1 text-xs font-bold text-royal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal/20"
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
            <div className="mt-3">
              <Link
                href="/parent/help"
                className="text-xs font-bold text-royal hover:underline"
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
