import Link from "next/link";
import { clsx } from "clsx";

import { MindMosaicLogo } from "@/components/branding";

/**
 * The 264px sticky sidebar from design handoff screen 8 — logo, student
 * chip, Modes nav, a weekly panel, then the Site nav group.
 *
 * The Modes list is reconciled against the real routes (DESIGN_AUDIT.md
 * §8). The design's four modes map as:
 *
 *   Learn             -> /student/learn
 *   Practice          -> /practice        (the catalogue, then a session)
 *   Exam preparation  -> /student/exam-preparation
 *   Learning Hub      -> /resources
 *
 * Exam preparation is its own screen rather than a link straight to /exam:
 * /exam is only reachable once a session exists, so linking it cold would
 * land a student on "No exam in progress".
 *
 * "Parent view" in the design's Site group is deliberately absent: /parent
 * is role-gated, and a student following it gets a permission wall. The
 * student's own Progress and Results screens take that slot instead.
 */

interface ModeLink {
  readonly label: string;
  readonly href: string;
  readonly key: string;
}

const MODES: readonly ModeLink[] = [
  { key: "learn", label: "Learn", href: "/student/learn" },
  { key: "practice", label: "Practice", href: "/practice" },
  { key: "exam", label: "Exam preparation", href: "/student/exam-preparation" },
  { key: "hub", label: "Learning Hub", href: "/resources" },
];

const SITE_LINKS = [
  { label: "Dashboard", href: "/student" },
  { label: "Progress", href: "/student/engagement" },
  { label: "Results", href: "/results" },
  { label: "How It Works", href: "/methodology" },
  { label: "Home", href: "/" },
] as const;

/** Initials for the student chip's tile — first letters of up to two words. */
function initialsFor(displayName: string | null): string {
  if (!displayName) return "MM";
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "MM";
}

export function LearnSidebar({
  active = "learn",
  displayName,
  yearLevel,
  weekly,
}: {
  active?: string;
  displayName: string | null;
  yearLevel: number | null;
  /** Real weekly-goal figures; omitted when there is no session history. */
  weekly?: { completed: number; goal: number };
}) {
  return (
    <aside className="sticky top-0 hidden h-screen content-start gap-6 overflow-y-auto border-r border-mm-line bg-white px-[18px] py-[22px] lg:grid">
      <Link
        href="/"
        aria-label="MindMosaic home"
        className="w-fit rounded-lg focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
      >
        <MindMosaicLogo size="md" />
      </Link>

      <div className="grid gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-mm-muted-2">Student</p>
        <div className="flex items-center gap-[11px] rounded-xl border border-mm-line p-2.5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-mm-tint font-[family-name:var(--font-display)] text-sm font-extrabold text-mm-brand"
          >
            {initialsFor(displayName)}
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-[14.5px] font-bold text-mm-ink">
              {displayName ?? "Your profile"}
            </span>
            <span className="text-[12.5px] text-mm-muted">
              {yearLevel === null ? "Year level not set" : `Year ${yearLevel}`}
            </span>
          </span>
        </div>
      </div>

      <nav aria-label="Modes" className="grid gap-[3px]">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-mm-muted-2">
          Modes
        </p>
        {MODES.map((mode) => {
          const isActive = mode.key === active;
          return (
            <Link
              key={mode.key}
              href={mode.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center rounded-[10px] px-3 text-[14.5px] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand",
                isActive
                  ? "bg-mm-tint font-bold text-mm-brand"
                  : "font-semibold text-mm-ink-soft hover:bg-mm-page hover:text-mm-brand",
              )}
            >
              {mode.label}
            </Link>
          );
        })}
      </nav>

      {weekly && (
        <div className="grid gap-2 rounded-[14px] bg-mm-tint p-4">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-mm-brand">This week</p>
          <p className="font-[family-name:var(--font-display)] text-[26px] font-extrabold tracking-[-0.03em] text-mm-ink">
            {weekly.completed} of {weekly.goal}
          </p>
          <p className="text-[13px] leading-[1.5] text-mm-muted">
            {weekly.completed >= weekly.goal
              ? "sessions completed. The weekly goal is met."
              : `sessions completed. ${weekly.goal - weekly.completed} more reaches the weekly goal.`}
          </p>
        </div>
      )}

      <nav aria-label="Site" className="grid gap-[3px]">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-mm-muted-2">
          Site
        </p>
        {SITE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex min-h-10 items-center rounded-[10px] px-3 text-sm font-semibold text-mm-ink-soft hover:bg-mm-page hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
