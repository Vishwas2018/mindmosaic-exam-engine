"use client";

import { useState } from "react";
import { BookOpen, Clock3, Flame, TrendingUp } from "lucide-react";

import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  ProgressBar,
  type BadgeVariant,
} from "@/components/ui";

import type { ChildSummary, PerformanceBand } from "../summary";
import { performanceBand } from "../summary";

/**
 * Read-only parent view over linked children's attempts (mockup 03).
 * Purely presentational: every number arrives pre-computed from
 * server-fetched, RLS-scoped rows. There is deliberately no action here
 * that writes anything — parents view, never edit.
 */

const BAND_LABELS: Record<PerformanceBand, { label: string; variant: BadgeVariant }> = {
  strong: { label: "Strong", variant: "success" },
  good: { label: "Good", variant: "purple" },
  building: { label: "Building", variant: "warning" },
  focus: { label: "Needs practice", variant: "error" },
};

function scoreToneClass(percentage: number): string {
  const band = performanceBand(percentage);
  if (band === "strong") return "text-success";
  if (band === "focus") return "text-error";
  return "text-royal";
}

function ringColor(percentage: number): string {
  const band = performanceBand(percentage);
  if (band === "strong") return "var(--success)";
  if (band === "focus") return "var(--error)";
  return "var(--royal-purple)";
}

function formatWeekTime(totalSeconds: number): string {
  const minutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${minutes} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function ScoreRing({ percentage }: { percentage: number }) {
  const clamped = Math.min(Math.max(percentage, 0), 100);
  return (
    <div
      role="img"
      aria-label={`Latest objective score: ${clamped} percent`}
      className="grid h-28 w-28 flex-shrink-0 place-items-center rounded-full"
      style={{
        background: `conic-gradient(${ringColor(clamped)} 0 ${clamped}%, rgba(75,46,131,0.1) ${clamped}% 100%)`,
      }}
    >
      <div className="grid h-[5.5rem] w-[5.5rem] place-items-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(75,46,131,0.08)]">
        <span className={`text-2xl font-black tracking-[-0.04em] ${scoreToneClass(clamped)}`}>
          {clamped}%
        </span>
      </div>
    </div>
  );
}

function ChildSelector({
  summaries,
  activeIndex,
  onSelect,
}: {
  summaries: ChildSummary[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3" role="tablist" aria-label="Choose a child">
      {summaries.map((child, index) => {
        const active = index === activeIndex;
        return (
          <button
            key={child.childId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(index)}
            className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
              active
                ? "border-royal bg-royal/8"
                : "border-royal/10 bg-white hover:border-royal/30"
            }`}
          >
            <span
              aria-hidden="true"
              className={`grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold ${
                active ? "bg-royal text-white" : "bg-royal/10 text-royal"
              }`}
            >
              {child.displayName.charAt(0).toUpperCase()}
            </span>
            <span>
              <span className="block text-sm font-extrabold text-ink">
                {child.displayName}
              </span>
              {child.yearLevel !== null && (
                <span className="block text-xs font-semibold text-muted">
                  Grade {child.yearLevel}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function OverviewCards({ child }: { child: ChildSummary }) {
  const delta =
    child.latestPercentage !== null && child.previousPercentage !== null
      ? child.latestPercentage - child.previousPercentage
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card className="flex items-center gap-5 p-6">
        {child.latestPercentage === null ? (
          <p className="text-sm font-semibold text-muted">No scored attempts yet.</p>
        ) : (
          <>
            <ScoreRing percentage={child.latestPercentage} />
            <div>
              <p className="text-sm font-extrabold text-ink">Latest score</p>
              {delta !== null ? (
                <p
                  className={`mt-1 text-xs font-bold ${
                    delta >= 0 ? "text-success" : "text-warning"
                  }`}
                >
                  {delta >= 0 ? "Up" : "Down"} {Math.abs(delta)}% on the attempt before
                </p>
              ) : (
                <p className="mt-1 text-xs font-semibold text-muted">First attempt</p>
              )}
              {child.averagePercentage !== null && (
                <p className="mt-1 text-xs font-semibold text-muted">
                  Average across {child.attemptCount}{" "}
                  {child.attemptCount === 1 ? "attempt" : "attempts"}:{" "}
                  {child.averagePercentage}%
                </p>
              )}
            </div>
          </>
        )}
      </Card>

      <Card className="p-6">
        <p className="text-sm font-extrabold text-ink">This week</p>
        <div className="mt-3 flex gap-1.5" aria-hidden="true">
          {child.weekActivity.map((day, index) => (
            <span
              key={index}
              className={`grid h-9 w-9 place-items-center rounded-xl text-[11px] font-extrabold ${
                day.isToday
                  ? day.practised
                    ? "bg-royal text-white ring-2 ring-royal ring-offset-1"
                    : "border-2 border-royal bg-royal/10 text-royal"
                  : day.practised
                    ? "bg-royal text-white"
                    : "bg-royal/8 text-muted"
              }`}
            >
              {day.label.charAt(0)}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-muted">
          {child.attemptsThisWeek}{" "}
          {child.attemptsThisWeek === 1 ? "exam" : "exams"} ·{" "}
          {formatWeekTime(child.timeThisWeekSeconds)} practised
        </p>
      </Card>

      <Card className="flex items-center gap-4 p-6">
        <div className="grid h-14 w-14 flex-shrink-0 place-items-center rounded-2xl bg-royal-orange/10 text-warning">
          <Flame aria-hidden="true" className="h-7 w-7" />
        </div>
        <div>
          <p className="text-2xl font-black tabular-nums text-ink">
            {child.streakDays} {child.streakDays === 1 ? "day" : "days"}
          </p>
          <p className="text-sm font-semibold text-muted">Current practice streak</p>
        </div>
      </Card>
    </div>
  );
}

function SubjectAreas({ child }: { child: ChildSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject areas</CardTitle>
        <CardDescription>
          How {child.displayName} is progressing, across all scored attempts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {child.subjects.map((subject) => {
          if (subject.percentage === null) {
            return (
              <div key={subject.subject} className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink">{subject.label}</span>
                <Badge variant="neutral">Marked by a person</Badge>
              </div>
            );
          }
          const band = BAND_LABELS[performanceBand(subject.percentage)];
          return (
            <div key={subject.subject}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-ink">{subject.label}</span>
                <span className="flex items-center gap-2">
                  <Badge variant={band.variant}>{band.label}</Badge>
                  <span
                    className={`text-sm font-extrabold tabular-nums ${scoreToneClass(subject.percentage)}`}
                  >
                    {subject.percentage}%
                  </span>
                </span>
              </div>
              <ProgressBar
                value={subject.percentage}
                label={`${subject.label}: ${subject.marksEarned} of ${subject.marksAvailable} objective marks`}
                tone={performanceBand(subject.percentage) === "strong" ? "success" : "purple"}
                className="[&>div:first-child]:hidden"
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecentAttempts({ child }: { child: ChildSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent exams</CardTitle>
        <CardDescription>
          Scored on our servers when {child.displayName} submitted.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-0">
        <ul className="divide-y divide-royal/8">
          {child.recentAttempts.map((attempt) => (
            <li key={attempt.id} className="flex items-center gap-4 px-6 py-4">
              <div
                className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${
                  performanceBand(attempt.percentage) === "strong"
                    ? "bg-success/10 text-success"
                    : performanceBand(attempt.percentage) === "focus"
                      ? "bg-error/10 text-error"
                      : "bg-royal/8 text-royal"
                }`}
              >
                <BookOpen aria-hidden="true" className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{attempt.label}</p>
                <p className="mt-0.5 text-xs font-semibold text-muted">
                  {attempt.submittedAtLabel} · {attempt.attemptedQuestions} of{" "}
                  {attempt.totalQuestions} answered
                  {attempt.pendingManualReview && " · writing awaiting marking"}
                </p>
              </div>
              <span
                className={`text-sm font-extrabold tabular-nums ${scoreToneClass(attempt.percentage)}`}
              >
                {attempt.percentage}%
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function AtAGlance({ child }: { child: ChildSummary }) {
  const stats = [
    {
      label: "Total exams",
      value: String(child.attemptCount),
      icon: BookOpen,
    },
    {
      label: "This week",
      value: formatWeekTime(child.timeThisWeekSeconds),
      icon: Clock3,
    },
    {
      label: "Average score",
      value: child.averagePercentage === null ? "—" : `${child.averagePercentage}%`,
      icon: TrendingUp,
    },
    {
      label: "Day streak",
      value: String(child.streakDays),
      icon: Flame,
    },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle>At a glance</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-royal/8 bg-page/60 p-4 text-center"
            >
              <Icon aria-hidden="true" className="mx-auto h-4 w-4 text-royal" />
              <p className="mt-2 text-lg font-black tabular-nums text-ink">{stat.value}</p>
              <p className="text-[11px] font-bold text-muted">{stat.label}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ParentDashboard({ summaries }: { summaries: ChildSummary[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const child = summaries[Math.min(activeIndex, summaries.length - 1)];

  return (
    <div className="space-y-8">
      {summaries.length > 1 && (
        <ChildSelector
          summaries={summaries}
          activeIndex={activeIndex}
          onSelect={setActiveIndex}
        />
      )}

      <div>
        <h1 className="text-3xl font-black tracking-[-0.03em] text-ink sm:text-4xl">
          How {child.displayName} is doing
        </h1>
        <p className="mt-2 text-sm font-semibold text-muted">
          {child.yearLevel !== null && <>Grade {child.yearLevel} · </>}
          Read-only view — results are scored and stored on our servers.
        </p>
        {child.unreadableAttemptCount > 0 && (
          <p className="mt-2 text-xs font-semibold text-warning">
            {child.unreadableAttemptCount}{" "}
            {child.unreadableAttemptCount === 1 ? "attempt" : "attempts"} could not be
            read and {child.unreadableAttemptCount === 1 ? "is" : "are"} not counted
            here.
          </p>
        )}
      </div>

      {child.attemptCount === 0 ? (
        <EmptyState
          title={`No exams from ${child.displayName} yet`}
          description="Once they finish a signed-in practice exam, their progress and results will appear here."
        />
      ) : (
        <>
          <OverviewCards child={child} />
          <div className="grid items-start gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <SubjectAreas child={child} />
              <RecentAttempts child={child} />
            </div>
            <div className="space-y-6 lg:col-span-2">
              <AtAGlance child={child} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
