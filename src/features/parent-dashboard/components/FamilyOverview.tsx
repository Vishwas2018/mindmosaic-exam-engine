"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, WifiOff } from "lucide-react";

import {
  CouldNotLoadStateBlock,
  LoadingStateBlock,
  MIN_CLAIM_MARKS,
  MIN_CLAIM_PAPERS,
  insufficientEvidenceCopy,
  type ChildSummary,
} from "@/features/parent-dashboard";

import {
  Card,
  ChildInitial,
  ChildPills,
  EvidenceIcon,
  InfoNote,
  NothingYetBox,
  PageHeader,
  SectionTitle,
  TintPanel,
  pButtonPrimary,
  pButtonQuiet,
  pButtonSecondary,
} from "./parent-ui";

export interface FamilyOverviewProps {
  summaries: readonly ChildSummary[];
  parentName?: string;
  forcedState?: "loading" | "error" | "offline";
  isOffline?: boolean;
}

/**
 * Family Overview — the "This week" page (Claude Design parent artboards 06–10).
 *
 * One card per child, two across from md up: who they are, then either "Nothing finished yet" (first visit) or the
 * latest finished paper and two evidence-backed claims. A claim about a child is shown only when it rests on at
 * least 2 finished papers and 8 marks (MIN_CLAIM_*); below that the real counts are stated instead. Records that
 * failed validation are excluded and said so, never presented as a first visit.
 */
export function FamilyOverview({ summaries, forcedState, isOffline }: FamilyOverviewProps) {
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  if (forcedState === "loading") {
    return (
      <div className="grid gap-6">
        <PageHeader title="Family Overview" lead="Checking this week’s practice…" />
        <LoadingStateBlock />
      </div>
    );
  }
  if (forcedState === "error") {
    return (
      <div className="grid gap-6">
        <PageHeader title="Family Overview" />
        <CouldNotLoadStateBlock
          title="We couldn't load your family summary."
          description="Nothing has changed. Your children, their results and your plan are all unchanged."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const displayed = selectedChildId ? summaries.filter((s) => s.childId === selectedChildId) : summaries;
  const finished = displayed.reduce((n, s) => n + s.attemptCount, 0);
  const unreadable = displayed.reduce((n, s) => n + s.unreadableAttemptCount, 0);
  const firstVisit = displayed.length > 0 && finished === 0 && unreadable === 0;
  const names = displayed.map((s) => s.displayName).join(" and ");
  const lead =
    finished === 0 && unreadable > 0
      ? `Some activity for ${names} could not be read. Unreadable records are excluded until resolved.`
      : firstVisit
        ? `${names} ${displayed.length === 1 ? "is" : "are"} set up. Nothing has been finished yet, so there is nothing to report.`
        : `${displayed.length === 1 ? names : summaries.length === 2 ? "Both children" : "Your children"}, what they have done this week, and what the marks actually support.`;

  return (
    <div className="grid gap-5">
      <PageHeader title="Family Overview" lead={lead} />

      {summaries.length > 1 && (
        <ChildPills
          items={summaries.map((s) => ({ id: s.childId, name: s.displayName }))}
          selectedId={selectedChildId}
          onSelect={setSelectedChildId}
        />
      )}

      {(forcedState === "offline" || isOffline) && (
        <div role="status" className="flex gap-3 rounded-xl bg-[#fdf3e4] px-4 py-3.5 text-sm text-[#92400e]">
          <WifiOff aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <b className="font-semibold">You are offline.</b> What you can see was loaded earlier. Nothing will save until
            you are back online.
          </span>
        </div>
      )}

      {unreadable > 0 && (
        <div role="status" className="rounded-xl bg-[#fdf3e4] px-4 py-3.5 text-sm text-[#92400e]">
          <b className="font-semibold">Some of this week&rsquo;s activity couldn&rsquo;t be read.</b>{" "}
          {unreadable} {unreadable === 1 ? "record was" : "records were"} excluded from these totals.
        </div>
      )}

      {firstVisit && (
        <InfoNote title={displayed.length === 1 ? `${names} can sign in now.` : "Your children can sign in now."}>
          Their sign-in details are on each child&rsquo;s profile. Results appear here once a timed paper is finished.
        </InfoNote>
      )}

      <div className="mt-1 grid items-start gap-5 md:grid-cols-2">
        {displayed.map((child) => (
          <ChildCard key={child.childId} child={child} index={summaries.findIndex((s) => s.childId === child.childId)} />
        ))}
      </div>

      {firstVisit ? (
        <TintPanel className="mt-1">
          <SectionTitle>Three things worth knowing</SectionTitle>
          <ul className="mt-3 grid gap-2 text-[15px] leading-[1.6] text-mm-ink-soft">
            {[
              ["Children sign in with a code and a PIN,", " not an email address. Both are on their profile."],
              ["Only finished timed papers are recorded.", " Practice sets are for trying things out and are not kept."],
              [
                "You will not see a predicted exam score here.",
                " We show marks earned out of marks available, and say how much work each figure rests on.",
              ],
            ].map(([b, rest]) => (
              <li key={b} className="flex gap-2.5">
                <Check aria-hidden="true" className="mt-1 h-[18px] w-[18px] shrink-0 text-[#0f6b32]" />
                <span>
                  <b className="font-semibold text-mm-ink">{b}</b>
                  {rest}
                </span>
              </li>
            ))}
          </ul>
        </TintPanel>
      ) : (
        <Card as="section" aria-labelledby="figures-heading" className="mt-1">
          <SectionTitle id="figures-heading">What these figures are</SectionTitle>
          <p className="mt-2 max-w-[860px] text-[15px] leading-[1.6] text-mm-ink-soft">
            Everything above is worked out from finished timed papers. Practice sets are not recorded, and lessons
            opened are not counted. &ldquo;Going well&rdquo; and &ldquo;to practise&rdquo; compare marks earned against
            marks available within one child&rsquo;s own work &mdash; never against other children, and never as a
            predicted exam result.
          </p>
          <div className="mt-4">
            <Link href="/parent/help" className={pButtonSecondary}>
              How we work these out
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChildCard({ child, index }: { child: ChildSummary; index: number }) {
  const name = child.displayName;
  const days = child.weekActivity.filter((d) => d.practised).length;
  const latest = child.recentAttempts[0];
  const subjects = child.subjects.filter((s) => s.marksAvailable > 0);
  const byRatio = [...subjects].sort((a, b) => b.marksEarned / b.marksAvailable - a.marksEarned / a.marksAvailable);
  const top = byRatio[0];
  const low = byRatio.length > 1 ? byRatio[byRatio.length - 1] : undefined;
  const status =
    child.attemptCount === 0
      ? child.unreadableAttemptCount > 0
        ? "activity excluded"
        : "ready to start"
      : `${child.attemptCount} finished ${child.attemptCount === 1 ? "paper" : "papers"}`;

  return (
    <Card aria-labelledby={`child-${child.childId}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-mm-line bg-white px-[18px] py-4">
          <ChildInitial name={name} index={index} />
          <div className="min-w-0">
            <h2 id={`child-${child.childId}`} className="truncate text-[19px] font-semibold leading-[1.4] tracking-[-0.01em] text-mm-ink">
              {name}
            </h2>
            <p className="text-[13.5px] text-mm-muted">
              {child.yearLevel ? `Year ${child.yearLevel} · ` : ""}
              {status}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {child.archived && (
            <span className="rounded-full bg-[#fdf3e4] px-2.5 py-1 text-[12.5px] font-semibold text-[#92400e]">Paused</span>
          )}
          {days > 0 && (
            <span className="rounded-full bg-mm-tint-soft px-2.5 py-1 text-[12.5px] font-semibold text-mm-ink-soft">
              {days} {days === 1 ? "day" : "days"} practised this week
            </span>
          )}
        </div>
      </div>

      {child.archived && (
        <p role="status" className="mt-4 text-sm text-[#92400e]">
          {name}&rsquo;s login is paused, so they can&rsquo;t sign in. Their results are kept.{" "}
          <Link href={`/parent/children/${child.childId}`} className="font-semibold underline">
            Turn it back on
          </Link>
        </p>
      )}

      {child.attemptCount === 0 ? (
        child.unreadableAttemptCount > 0 ? (
          <div className="mt-[18px]">
            <CouldNotLoadStateBlock
              title={`We couldn't read ${name}'s activity.`}
              description={`${child.unreadableAttemptCount} ${child.unreadableAttemptCount === 1 ? "record was" : "records were"} excluded because the stored format could not be verified.`}
            />
          </div>
        ) : (
          <>
            <div className="mt-[18px]">
              <NothingYetBox title="Nothing finished yet">
                When {name} finishes a timed paper, the result and the strands behind it appear here.
              </NothingYetBox>
            </div>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Link href={`/parent/children/${child.childId}/learning`} className={pButtonPrimary}>
                Help {name} get started
              </Link>
              <Link href={`/parent/children/${child.childId}`} className={pButtonQuiet}>
                Sign-in details
              </Link>
            </div>
          </>
        )
      ) : (
        <>
          <div className="mt-5 border-t border-mm-line pt-5">
            {latest && (
              <div>
                <p className="text-sm text-mm-ink-soft">Latest finished paper</p>
                <p className="mt-1 text-[17px] font-semibold text-mm-ink">{latest.label}</p>
                <p className="text-sm text-mm-ink-soft">
                  {latest.marksEarned} of {latest.marksAvailable} marks · {latest.submittedAtLabel}
                </p>
              </div>
            )}
            <div className="mt-5 grid gap-5">
              <Claim label="Going well" subject={top} />
              <Claim label="To practise" subject={low} />
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-mm-tint-soft px-4 py-3 text-sm leading-[1.5] text-mm-ink-soft">
            <b className="font-semibold text-mm-ink">Suggested next:</b> a 10-question{" "}
            {low ? low.label.toLowerCase() : "mixed"} set. A suggestion from us, not something {name} has done.
          </div>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link href={`/parent/children/${child.childId}/progress`} className={pButtonPrimary}>
              View progress
            </Link>
            <Link href={`/parent/children/${child.childId}`} className={pButtonSecondary}>
              Manage {name}
            </Link>
            <Link href={`/parent/children/${child.childId}/learning`} className={pButtonQuiet}>
              Browse learning
            </Link>
          </div>
        </>
      )}
    </Card>
  );
}

/** "Going well / To practise" with its evidence, or the withheld-claim sentence below the 2-paper / 8-mark floor. */
function Claim({
  label,
  subject,
}: {
  label: string;
  subject?: { label: string; paperCount: number; marksAvailable: number };
}) {
  const enough = subject && subject.paperCount >= MIN_CLAIM_PAPERS && subject.marksAvailable >= MIN_CLAIM_MARKS;
  return (
    <div>
      <p className="text-sm text-mm-ink-soft">{label}</p>
      {enough ? (
        <>
          <p className="mt-1 text-[17px] font-semibold text-mm-ink">{subject.label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-mm-muted">
            <EvidenceIcon />
            {subject.paperCount} {subject.paperCount === 1 ? "paper" : "papers"} · {subject.marksAvailable} marks counted
          </p>
        </>
      ) : (
        <p className="mt-1 text-[15px] leading-[1.5] text-mm-ink-soft">{insufficientEvidenceCopy("subject")}</p>
      )}
    </div>
  );
}
