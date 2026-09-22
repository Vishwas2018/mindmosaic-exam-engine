import Link from "next/link";
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ClipboardCheck,
  Dumbbell,
  Flag,
  Flame,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  SpellCheck2,
  Target,
  TrendingUp,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import type { LessonPathway } from "@/features/curriculum/lessons";
import type { WeekDot } from "@/features/student/engagement/streaks";

export type StudentSidebarKey = "home" | "learn" | "practice" | "examCentre" | "progress";

interface SidebarNavItem {
  key: StudentSidebarKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Placeholder badge text to match the Stitch mock — not wired to real state yet. */
  badge?: string;
}

/**
 * Dashboard-only nav list (not the shared StudentShell/student-nav.ts
 * config) — see the plan's scope decision: rewriting the site-wide student
 * nav to match the Stitch mockup's 5 destinations would change every
 * StudentShell-rendered page's header in one change. This list exists only
 * for this sidebar.
 */
export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  { key: "home", label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { key: "learn", label: "Learning Hub", href: "/student/learn", icon: BookOpen, badge: "Stage 3" },
  { key: "practice", label: "Practice Studio", href: "/student/practice", icon: Target },
  { key: "examCentre", label: "Exam Centre", href: "/student/exam-preparation", icon: ClipboardCheck, badge: "NAPLAN" },
  { key: "progress", label: "My Progress", href: "/student/engagement", icon: TrendingUp },
];

/**
 * Blanket default, not a queried entitlement — there is no billing/
 * entitlement table in this codebase distinguishing which pathways a
 * given family has access to, so every signed-in student currently has
 * these three by default.
 */
const INCLUDED_PATHWAYS = [
  "Curriculum Learning",
  "NAPLAN Diagnostic Practice",
  "ICAS Competition Suite",
] as const;

function initialsFor(displayName: string | null): string {
  if (!displayName) return "MM";
  const parts = displayName.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "MM";
}

const WEEK_DOT_LABEL: Record<WeekDot["state"], string> = {
  done: "Practised",
  today_done: "Practised today",
  today_pending: "Today — not yet practised",
  missed: "Not practised",
  future: "Upcoming",
};

export function StudentSidebar({
  active,
  displayName,
  yearLevel,
  mathematicsPathways,
  weekDots,
  currentStreak,
  sessionsThisWeek,
  weeklyTarget,
}: {
  active: StudentSidebarKey;
  displayName: string | null;
  yearLevel: number | null;
  mathematicsPathways: readonly LessonPathway[];
  weekDots: readonly WeekDot[];
  currentStreak: number;
  sessionsThisWeek: number;
  weeklyTarget: number;
}) {
  const goalProgress = weeklyTarget > 0 ? Math.min(100, Math.round((sessionsThisWeek / weeklyTarget) * 100)) : 0;
  // Same Year-3/5 collapse convention as deriveStartHereItem() — only those two levels are authored.
  const naplanYear = yearLevel === 5 ? 5 : 3;

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-mm-line bg-white lg:flex lg:h-screen lg:flex-col lg:sticky lg:top-0">
      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        <div className="flex items-center justify-between border-b border-mm-line/60 px-5 pb-4 pt-5">
          <Link
            href="/student"
            aria-label="MindMosaic — Dashboard"
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <MindMosaicLogo size="md" />
          </Link>
          {yearLevel !== null && (
            <span className="inline-flex items-center rounded-full border border-mm-tint-line bg-mm-tint px-2 py-0.5 text-[11px] font-semibold tracking-wide text-primary">
              Year {yearLevel}
            </span>
          )}
        </div>

        <div className="mx-3 flex items-center gap-2.5 rounded-xl border border-mm-line bg-mm-page/90 px-4 py-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary font-[family-name:var(--font-display)] text-sm font-semibold text-white shadow-inner">
            {initialsFor(displayName)}
            <span
              aria-hidden="true"
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-semibold leading-tight text-mm-ink">
              {displayName ?? "Your profile"}
            </span>
            {/* Placeholder gamification line to match the Stitch mock — no XP/level model exists yet. */}
            <span className="truncate text-[11px] leading-tight text-mm-muted">
              Scholar · Lvl 12 · <span className="font-semibold text-amber-accent">★ 840xp</span>
            </span>
          </div>
          <ChevronsUpDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-stitch-outline" />
        </div>

        <div className="mx-3">
          {/* Placeholder — no search index exists yet, so ⌘K has no listener behind it (audit D-10). */}
          <div
            title="Search (coming soon)"
            aria-disabled="true"
            className="flex items-center gap-2 rounded-lg border border-mm-line bg-white px-2.5 py-2 text-mm-muted"
          >
            <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 truncate text-[11.5px]">Search topics, units...</span>
            <kbd className="rounded border border-mm-line bg-mm-page px-1 py-0.5 font-mono text-[9px] font-semibold text-stitch-outline">
              ⌘K
            </kbd>
          </div>
        </div>

        <div className="px-3">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stitch-outline">
            Portal main
          </p>
          <nav aria-label="Student navigation" className="space-y-1">
            {SIDEBAR_NAV_ITEMS.map((item) => {
              const isActive = item.key === active;
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                    isActive
                      ? "bg-mm-tint text-primary"
                      : "text-mm-ink-soft hover:bg-mm-page hover:text-primary"
                  }`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                        item.badge === "NAPLAN"
                          ? "border border-amber-border bg-amber-light text-amber-accent"
                          : "border border-mm-line bg-mm-page text-mm-muted"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="px-3">
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-stitch-outline">Learning tracks</p>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700">
              Active
            </span>
          </div>
          <details open className="mb-2 overflow-hidden rounded-xl border border-mm-line/80 bg-mm-page/70">
            <summary className="flex cursor-pointer list-none items-center justify-between bg-white px-2.5 py-2 text-left [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <BookOpen aria-hidden="true" className="h-4 w-4 text-primary" />
                <span className="text-[12.5px] font-semibold text-mm-ink">Learn Mathematics</span>
              </span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-stitch-outline" />
            </summary>
            <div className="space-y-1 border-t border-mm-line/50 bg-mm-page/30 px-2 py-1.5">
              {mathematicsPathways.length > 0 ? (
                mathematicsPathways.slice(0, 6).map((pathway) => {
                  const firstNode = pathway.nodes[0];
                  const href = firstNode ? `/student/learn/lessons/${firstNode.curriculumCode}` : "/student/learn/mathematics";
                  return (
                    <Link
                      key={pathway.strand}
                      href={href}
                      className="flex items-center justify-between rounded-lg py-1.5 pl-3 pr-2 text-[11.5px] font-medium text-mm-muted transition-colors hover:bg-white hover:text-mm-ink"
                    >
                      <span className="truncate pr-1">{pathway.title}</span>
                      <span className="shrink-0 text-[9px] font-mono text-stitch-outline">
                        {pathway.nodes.length} lesson{pathway.nodes.length === 1 ? "" : "s"}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="px-3 py-1.5 text-[11px] text-mm-muted">
                  No Mathematics lessons published for this year level yet.
                </p>
              )}
            </div>
          </details>

          <details className="mb-2 overflow-hidden rounded-xl border border-mm-line/60 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2.5 py-1.5 text-left transition-colors hover:bg-mm-page [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Dumbbell aria-hidden="true" className="h-4 w-4 text-mm-coral-text" />
                <span className="text-[12.5px] font-medium text-mm-ink">Practise a skill</span>
              </span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-stitch-outline" />
            </summary>
            <div className="space-y-0.5 border-t border-mm-line/40 bg-mm-page/30 px-2 py-1">
              {/*
                Placeholder — no mental-math or vocabulary/cloze catalogue
                entries exist (grep of src/features/catalogue confirmed).
                Marked coming-soon rather than linking to the generic
                catalogue under a specific-sounding label (audit D-05).
              */}
              <div
                title="Mental Math Speed Drills (coming soon)"
                aria-disabled="true"
                className="flex cursor-default items-center gap-2 rounded py-1 pl-4 pr-2 text-[11px] text-mm-muted"
              >
                <Calculator aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Mental Math Speed Drills
              </div>
              <div
                title="Vocabulary & Cloze Drills (coming soon)"
                aria-disabled="true"
                className="flex cursor-default items-center gap-2 rounded py-1 pl-4 pr-2 text-[11px] text-mm-muted"
              >
                <SpellCheck2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Vocabulary &amp; Cloze Drills
              </div>
            </div>
          </details>

          <details className="mb-2 overflow-hidden rounded-xl border border-mm-line/60 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between px-2.5 py-1.5 text-left transition-colors hover:bg-mm-page [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <ClipboardCheck aria-hidden="true" className="h-4 w-4 text-amber-accent" />
                <span className="text-[12.5px] font-medium text-mm-ink">Prepare for NAPLAN</span>
              </span>
              <ChevronDown aria-hidden="true" className="h-4 w-4 text-stitch-outline" />
            </summary>
            <div className="space-y-0.5 border-t border-mm-line/40 bg-mm-page/30 px-2 py-1">
              {/* Real, year-scoped catalogue program — matches the label exactly (audit D-05 fix). */}
              <Link
                href={`/practice/naplan-g${naplanYear}-numeracy`}
                className="flex items-center gap-2 rounded py-1 pl-4 pr-2 text-[11px] text-mm-muted hover:text-mm-ink"
              >
                <Target aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Year {naplanYear} Numeracy Mock Test
              </Link>
              {/*
                No single catalogue program covers both reading and
                language conventions — the category page genuinely has
                both, so this points there rather than to one program that
                only matches half the label (audit D-05 fix).
              */}
              <Link
                href="/practice/naplan"
                className="flex items-center gap-2 rounded py-1 pl-4 pr-2 text-[11px] text-mm-muted hover:text-mm-ink"
              >
                <BookOpen aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                Reading &amp; Language Conventions
              </Link>
            </div>
          </details>
        </div>

        <div className="relative mx-3 overflow-hidden rounded-2xl border border-mm-line bg-white p-3 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-amber-border bg-amber-light text-amber-accent">
                <Flame aria-hidden="true" className="h-[17px] w-[17px]" />
              </div>
              <div className="flex flex-col">
                <span className="font-[family-name:var(--font-display)] text-xs font-bold leading-tight text-mm-ink">
                  {currentStreak}-day streak
                </span>
                <span className="text-[10px] leading-tight text-mm-muted">
                  Weekly goal: {weeklyTarget} sessions
                </span>
              </div>
            </div>
          </div>
          <div className="mb-2 rounded-xl border border-mm-line/50 bg-mm-page/60 p-1.5">
            <div className="grid grid-cols-7 items-center gap-1 text-center">
              {weekDots.map((dot) => (
                <div key={dot.dayKey} className="flex flex-col items-center gap-0.5" title={WEEK_DOT_LABEL[dot.state]}>
                  <span className="text-[9px] font-medium text-mm-muted">{dot.label}</span>
                  {dot.state === "done" || dot.state === "today_done" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-xs">
                      <CheckCircle2 aria-hidden="true" className="h-[11px] w-[11px]" />
                    </div>
                  ) : dot.state === "today_pending" ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-mm-tint">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border border-mm-line bg-white">
                      <span className="h-1 w-1 rounded-full bg-mm-line-quiet" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-medium text-mm-muted">This week</span>
              <span className="font-mono font-semibold text-primary">
                {sessionsThisWeek} of {weeklyTarget} ({goalProgress}%)
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-mm-line-soft">
              <div className="h-full rounded-full bg-primary" style={{ width: `${goalProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="px-3">
          <p className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-stitch-outline">
            Included pathways
          </p>
          <div className="space-y-1">
            {INCLUDED_PATHWAYS.map((pathway) => (
              <div
                key={pathway}
                className="flex items-center justify-between rounded-lg border border-mm-line/40 bg-mm-page/60 px-2.5 py-1.5 text-[12px] text-mm-ink"
              >
                <span className="truncate">{pathway}</span>
                <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Included
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-mm-line bg-white p-3">
        {/* Placeholder session/curriculum-version chip to match the Stitch mock. */}
        <div className="flex items-center justify-between rounded-lg border border-mm-line/60 bg-mm-page/60 px-2.5 py-1.5 text-[10px] font-medium text-mm-muted">
          <span>Session 2025-26</span>
          <span className="font-mono text-[9px] text-stitch-outline">NSW NESA v9.0</span>
        </div>
        <div className="flex items-center justify-between">
          <Link
            href="/help"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-mm-muted transition-colors hover:text-primary"
          >
            <HelpCircle aria-hidden="true" className="h-4 w-4" />
            Help &amp; Support
          </Link>
          {/* No /student/settings route yet — placeholder, not a dead Link. */}
          <button
            type="button"
            title="Settings (coming soon)"
            aria-disabled="true"
            className="inline-flex min-h-11 cursor-default items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-mm-muted"
          >
            <Settings aria-hidden="true" className="h-4 w-4" />
            Settings
          </button>
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-mm-muted transition-colors hover:text-primary"
        >
          <Flag aria-hidden="true" className="h-4 w-4" />
          Back to site
        </Link>
      </div>
    </aside>
  );
}
