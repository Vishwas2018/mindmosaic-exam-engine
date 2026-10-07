"use client";

import { motion, type MotionValue } from "framer-motion";
import { BookOpen, Calendar, Check, Clock3, Eye, TrendingUp } from "lucide-react";

import { chapter4Sample, type DerivedSessionRow, type DerivedSubjectRow } from "../chapter4-progress";
import { clamp01 } from "../cinematic/math";

/**
 * Visual styling and deterministic DOM/SVG modules for Chapter 4's
 * Progress Mosaic.
 *
 * Rules:
 * - Real DOM and deterministic SVG only (no image tags, no canvas, no video).
 * - No hardcoded hex or rgb strings: strict adherence to design tokens.
 * - Non-interactive sample visuals: no buttons, inputs, links, or click handlers.
 * - Accessible roles and labels on all score rings, progress bars, and activity days.
 */

interface ScoreRingProps {
  percentage: number;
  draw?: MotionValue<number> | number;
  size?: "default" | "compact";
  label?: string;
}

export function ScoreRing({
  percentage,
  draw = 1,
  size = "default",
  label = "Latest objective score",
}: ScoreRingProps) {
  const isCompact = size === "compact";
  const dim = isCompact ? 72 : 112;
  const strokeWidth = isCompact ? 6 : 8;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Draw factor (0..1)
  const drawVal = typeof draw === "number" ? draw : 1;
  const filledLength = circumference * (percentage / 100) * clamp01(drawVal);

  return (
    <div
      role="img"
      aria-label={`${label}: ${percentage}%`}
      className={`relative grid shrink-0 place-items-center ${isCompact ? "h-[72px] w-[72px]" : "h-28 w-28"}`}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        {/* Track circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-mm-line-soft"
        />
        {/* Filled score arc */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
          className={
            percentage >= 80
              ? "text-success"
              : percentage >= 65
                ? "text-primary"
                : "text-warning"
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-[family-name:var(--font-display)] font-extrabold tracking-tight text-mm-ink ${
            isCompact ? "text-base" : "text-2xl"
          }`}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/**
 * Score ring with Framer Motion integration.
 */
export function AnimatedScoreRing({
  percentage,
  draw,
  size = "default",
}: {
  percentage: number;
  draw: MotionValue<number>;
  size?: "default" | "compact";
}) {
  const isCompact = size === "compact";
  const dim = isCompact ? 72 : 112;
  const strokeWidth = isCompact ? 6 : 8;
  const radius = (dim - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="img"
      aria-label={`Latest score: ${percentage}%`}
      className={`relative grid shrink-0 place-items-center ${isCompact ? "h-[72px] w-[72px]" : "h-28 w-28"}`}
    >
      <svg
        width={dim}
        height={dim}
        viewBox={`0 0 ${dim} ${dim}`}
        className="-rotate-90 transform"
        aria-hidden="true"
      >
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-mm-line-soft"
        />
        <motion.circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: draw.get() !== undefined
              ? (1 - clamp01(draw.get())) * circumference + circumference * (1 - percentage / 100)
              : 0,
          }}
          className={
            percentage >= 80
              ? "text-success"
              : percentage >= 65
                ? "text-primary"
                : "text-warning"
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className={`font-[family-name:var(--font-display)] font-extrabold tracking-tight text-mm-ink ${
            isCompact ? "text-base" : "text-2xl"
          }`}
        >
          {percentage}%
        </span>
      </div>
    </div>
  );
}

/** Badge for performance bands ("Strong", "Good", "Building", "Needs practice") */
export function BandBadge({
  band,
  label,
}: {
  band: "strong" | "good" | "building" | "focus";
  label: string;
}) {
  const style =
    band === "strong"
      ? "bg-success/10 text-success border-success/20"
      : band === "good"
        ? "bg-primary/10 text-primary border-primary/20"
        : band === "building"
          ? "bg-warning/10 text-warning border-warning/20"
          : "bg-error/10 text-error border-error/20";

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-bold ${style}`}
    >
      {label}
    </span>
  );
}

/**
 * Module A: Latest result module.
 * Represents the most recent finished session (ICAS-style Reading, 8 of 10, Thu, 80%).
 */
export function LatestResultModule({
  session = chapter4Sample.latestSession,
  draw = 1,
  compact = false,
}: {
  session?: DerivedSessionRow;
  draw?: MotionValue<number> | number;
  compact?: boolean;
}) {
  return (
    <div
      data-module="latest-result"
      className={`rounded-2xl border border-mm-line bg-white shadow-warm-sm transition-shadow ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mm-tint text-primary">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-mm-muted">
            Latest session
          </span>
        </div>
        <span className="rounded-md border border-mm-line bg-mm-page/80 px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
          {chapter4Sample.badge}
        </span>
      </div>

      <div
        className={`mt-5 flex items-center gap-4 ${
          compact ? "flex-row text-left" : "flex-col sm:flex-row text-center sm:text-left"
        }`}
      >
        <ScoreRing
          percentage={session.percentage}
          draw={draw}
          size={compact ? "compact" : "default"}
          label={`Latest session score for ${session.label}`}
        />

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className={`font-[family-name:var(--font-display)] font-bold text-mm-ink ${
              compact ? "text-sm leading-snug" : "text-base"
            }`}>
              {session.label}
            </p>
            <BandBadge band={session.band} label={session.percentage >= 80 ? "Strong" : "Good"} />
          </div>

          <p className="text-xs font-semibold text-mm-muted">
            <span className="font-bold text-mm-ink">{session.count} of {session.total} answered</span>
            <span className="mx-1" aria-hidden="true">·</span>
            <span>Completed {session.when}</span>
          </p>

          <p className="text-[11px] leading-relaxed text-mm-muted">
            Objective questions scored immediately upon submission.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Module B: Subject progress bars.
 * Reading 80% (Strong), Numeracy 70% (Good), Language conventions 60% (Building).
 */
export function SubjectProgressModule({
  subjects = chapter4Sample.subjects,
  buildProgress = 1,
  compact = false,
}: {
  subjects?: readonly DerivedSubjectRow[];
  buildProgress?: MotionValue<number> | number;
  compact?: boolean;
}) {
  const pVal = typeof buildProgress === "number" ? buildProgress : 1;

  return (
    <div
      data-module="subject-progress"
      className={`rounded-2xl border border-mm-line bg-white shadow-warm-sm ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mm-tint text-primary">
            <TrendingUp aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-mm-muted">
            Subject pattern
          </span>
        </div>
        <span className="text-[11px] font-semibold text-mm-muted">Across scored work</span>
      </div>

      <div className="mt-5 space-y-4">
        {subjects.map((sub) => {
          const clamped = Math.min(Math.max(sub.percentage, 0), 100);
          const barWidth = clamped * clamp01(pVal);

          return (
            <div key={sub.subject} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-mm-ink">{sub.label}</span>
                <div className="flex items-center gap-2">
                  <BandBadge band={sub.band} label={sub.bandLabel} />
                  <span className="font-mono font-bold text-mm-ink tabular-nums">
                    {sub.percentage}%
                  </span>
                </div>
              </div>

              {/* Accessible progress bar */}
              <div
                role="progressbar"
                aria-valuenow={sub.percentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${sub.label}: ${sub.count} of ${sub.total} marks, ${sub.percentage} percent (${sub.bandLabel})`}
                className="h-2.5 w-full overflow-hidden rounded-full bg-mm-line-soft"
              >
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    sub.band === "strong"
                      ? "bg-success"
                      : sub.band === "good"
                        ? "bg-primary"
                        : "bg-warning"
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[11px] text-mm-muted">
                {sub.count} of {sub.total} objective marks
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Module C: Weekly activity strip.
 * Mon ✓, Tue ✓, Wed —, Thu ✓, Fri —, Sat —, Sun —
 */
export function WeeklyActivityModule({
  week = chapter4Sample.week,
  daysCount = chapter4Sample.daysPractisedCount,
  compact = false,
}: {
  week?: readonly { day: string; done: boolean }[];
  daysCount?: number;
  compact?: boolean;
}) {
  return (
    <div
      data-module="weekly-activity"
      className={`rounded-2xl border border-mm-line bg-white shadow-warm-sm ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mm-tint text-primary">
            <Calendar aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-mm-muted">
            Weekly activity
          </span>
        </div>
        <span className="text-[11px] font-semibold text-mm-muted">
          {daysCount} active {daysCount === 1 ? "day" : "days"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 sm:gap-2">
        {week.map((item) => (
          <div key={item.day} className="flex min-w-0 flex-col items-center gap-1.5 text-center">
            <div
              className={`grid aspect-square w-full max-w-10 place-items-center rounded-xl text-xs font-extrabold ${
                item.done
                  ? "bg-primary text-white shadow-xs"
                  : "bg-mm-line-soft/80 text-mm-muted"
              }`}
            >
              {item.done ? (
                <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
              ) : (
                <span aria-hidden="true" className="text-mm-muted select-none">—</span>
              )}
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-mm-ink truncate" aria-hidden="true">
              {item.day}
            </span>
            <span className="sr-only">
              {item.day}: {item.done ? "practice session completed" : "no session"}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-mm-muted">
        Practice frequency recorded across local calendar days.
      </p>
    </div>
  );
}

/**
 * Module D: Recent completed sessions list.
 */
export function RecentSessionsModule({
  sessions = chapter4Sample.recentSessions,
  compact = false,
}: {
  sessions?: readonly DerivedSessionRow[];
  compact?: boolean;
}) {
  return (
    <div
      data-module="recent-sessions"
      className={`rounded-2xl border border-mm-line bg-white shadow-warm-sm ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-mm-line-soft pb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-mm-tint text-primary">
            <Clock3 aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-mm-muted">
            Recent work
          </span>
        </div>
        <span className="text-[11px] font-semibold text-mm-muted">
          {sessions.length} recorded
        </span>
      </div>

      <ul className="mt-4 divide-y divide-mm-line-soft" role="list">
        {sessions.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-3 py-3 text-xs first:pt-1 last:pb-1">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold text-mm-ink">{row.label}</p>
              <p className="text-[11px] text-mm-muted">
                {row.count} of {row.total} · {row.when}
              </p>
            </div>
            <div className="flex items-center gap-2 text-right">
              <BandBadge band={row.band} label={row.band === "strong" ? "Strong" : row.band === "good" ? "Good" : "Building"} />
              <span className="font-mono font-extrabold text-mm-ink tabular-nums">
                {row.percentage}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Parent View Context Header / Read-only banner.
 */
export function ParentViewHeader({
  studentName = chapter4Sample.studentName,
  readOnlyBadge = "Parent view · Read only",
  badge = chapter4Sample.badge,
}: {
  studentName?: string;
  readOnlyBadge?: string;
  badge?: string;
}) {
  return (
    <div
      data-module="parent-header"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mm-line bg-white px-5 py-3 shadow-warm-sm"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-8 w-8 place-items-center rounded-full bg-mm-tint text-xs font-extrabold text-primary"
        >
          {studentName.charAt(0)}
        </span>
        <div>
          <span className="block text-sm font-extrabold text-mm-ink">{studentName}</span>
          <span className="block text-[11px] font-semibold text-mm-muted">Linked student</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-mm-line bg-mm-tint/50 px-3 py-1 text-xs font-bold text-primary">
          <Eye aria-hidden="true" className="h-3.5 w-3.5" />
          {readOnlyBadge}
        </span>
        <span className="rounded-md border border-mm-line bg-mm-page px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
          {badge}
        </span>
      </div>
    </div>
  );
}

/**
 * The Assembled Progress Mosaic (Scene 3).
 * Bento-style assembly of the modules representing the coherent parent view.
 */
export function AssembledParentMosaic({
  draw = 1,
  build = 1,
}: {
  draw?: MotionValue<number> | number;
  build?: MotionValue<number> | number;
}) {
  return (
    <div className="space-y-4">
      <ParentViewHeader />
      <div className="grid gap-4 sm:grid-cols-2">
        <LatestResultModule draw={draw} compact />
        <WeeklyActivityModule compact />
        <SubjectProgressModule buildProgress={build} compact />
        <RecentSessionsModule compact />
      </div>
    </div>
  );
}
