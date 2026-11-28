import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Target,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import type { LessonPathway } from "@/features/curriculum/lessons";
import type { WeekDot } from "@/features/student/engagement/streaks";

import { StudentAccountMenu } from "./StudentAccountMenu";

export type StudentSidebarKey =
  | "home"
  | "learn"
  | "practice"
  | "examCentre"
  | "results"
  | "singaporeMathsSample"
  | "vihaan";

interface SidebarNavItem {
  key: StudentSidebarKey;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  /** Bottom-nav label below 1024px. The full `label` is the accessible name. Absent = not in the bottom nav. */
  shortLabel?: string;
}

/**
 * Dashboard-only nav list (not the shared StudentShell/student-nav.ts
 * config) — see the plan's scope decision: rewriting the site-wide student
 * nav to match the Stitch mockup's 5 destinations would change every
 * StudentShell-rendered page's header in one change. This list exists only
 * for this sidebar.
 */
const baseSidebarItems: readonly SidebarNavItem[] = [
  { key: "home", label: "My Space", shortLabel: "My Space", href: "/student", icon: LayoutDashboard },
  { key: "learn", label: "Learning Hub", shortLabel: "Learning", href: "/student/learn", icon: BookOpen },
  { key: "practice", label: "Practice Studio", shortLabel: "Practice", href: "/student/practice", icon: Target },
  { key: "examCentre", label: "Exam Centre", shortLabel: "Exams", href: "/student/exam-preparation", icon: ClipboardCheck },
  /* My Progress leaves the nav (D5); My Results takes the slot. /student/engagement is reached from My Space. */
  { key: "results", label: "My Results", shortLabel: "Results", href: "/results", icon: ListChecks },
];

const vihaanNavItem: SidebarNavItem = {
  key: "vihaan" as const,
  label: "Vihaan Scholarship Prep",
  href: "/student/vihaan",
  icon: GraduationCap,
  shortLabel: "Vihaan",
};

const singaporeNavItem: SidebarNavItem = {
  key: "singaporeMathsSample" as const,
  label: "Singapore Maths Sample",
  href: "/practice/singapore-maths/sample",
  icon: BarChart3,
  shortLabel: "Singapore",
};

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = baseSidebarItems;

/**
 * The nav for one student. The Vihaan pilot and the Singapore Maths sample
 * (content not yet approved) appear only when the server decided this
 * account may see them; general beta users never get either item.
 */
export function studentNavItems(showVihaan = false, showSingapore = false): readonly SidebarNavItem[] {
  return [
    ...SIDEBAR_NAV_ITEMS,
    ...(showSingapore ? [singaporeNavItem] : []),
    ...(showVihaan ? [vihaanNavItem] : []),
  ];
}

export function StudentSidebar({
  active,
  displayName,
  yearLevel,
  showVihaan = false,
  showSingapore = false,
}: {
  active: StudentSidebarKey;
  displayName: string | null;
  yearLevel: number | null;
  /* Accepted for the existing call sites; the design sidebar shows navigation and the account only. */
  mathematicsPathways?: readonly LessonPathway[];
  weekDots?: readonly WeekDot[];
  currentStreak?: number;
  sessionsThisWeek?: number;
  weeklyTarget?: number;
  /** Server-decided: whether this student is in the Vihaan pilot. */
  showVihaan?: boolean;
  /** Server-decided: whether this account is on the Singapore Maths sample preview list. */
  showSingapore?: boolean;
}) {
  const name = displayName?.trim() || "Your account";
  const shortName = shortDisplayName(name);
  const initial = name.charAt(0).toUpperCase();
  const linkBase =
    "flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand";

  /* Claude Design student artboards: 248px white rail — logo, five destinations, and at the foot a "New here?"
     note, Help Centre and the student's own account row. */
  return (
    <aside
      aria-label="My Space"
      className="hidden w-[248px] shrink-0 flex-col gap-6 border-r border-mm-line bg-white px-4 py-[22px] lg:sticky lg:top-0 lg:flex lg:h-screen"
    >
      <Link
        href="/student"
        aria-label="MindMosaic — My Space"
        className="inline-flex min-h-11 w-fit items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
      >
        <MindMosaicLogo size="md" />
      </Link>

      <nav aria-label="Student navigation" className="grid gap-0.5">
        {studentNavItems(showVihaan, showSingapore).map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`${linkBase} ${isActive ? "bg-mm-tint font-semibold text-mm-brand" : "font-medium text-mm-ink-soft hover:bg-mm-tint-soft hover:text-mm-ink"}`}
            >
              <Icon aria-hidden="true" className={`h-[19px] w-[19px] shrink-0 ${isActive ? "" : "text-mm-muted"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-2">
        <div className="rounded-xl border border-mm-brand/15 bg-mm-tint px-3.5 py-3.5">
          <p className="text-sm font-semibold text-mm-ink">New here?</p>
          <p className="mt-1 text-[13px] leading-[1.45] text-mm-muted">Short tips for each place: what it is for and how it works.</p>
          <Link
            href="/student-tips"
            className="mt-1 inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-mm-brand hover:underline"
          >
            Take the tour
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
        <Link href="/help" className={`${linkBase} font-medium text-mm-ink-soft hover:bg-mm-tint-soft hover:text-mm-ink`}>
          <HelpCircle aria-hidden="true" className="h-[19px] w-[19px] shrink-0 text-mm-muted" />
          Help Centre
        </Link>
        <StudentAccountMenu
          label={`${name}${yearLevel ? `, Year ${yearLevel}` : ""}: account menu`}
          placement="above"
          className="flex min-h-14 w-full items-center gap-3 rounded-[10px] bg-mm-tint-soft px-3 py-2 text-left"
          trigger={
            <>
              <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-mm-tint font-semibold text-mm-brand">
                {initial}
              </span>
              <span className="grid min-w-0 flex-1">
                <b className="truncate text-[14.5px] font-semibold text-mm-ink">{shortName}</b>
                <span className="text-[12.5px] text-mm-muted">{yearLevel ? `Year ${yearLevel} · ` : ""}account</span>
              </span>
              <ChevronRight aria-hidden="true" className="h-[19px] w-[19px] shrink-0 text-mm-muted" />
            </>
          }
        />
      </div>
    </aside>
  );
}

/** "Aisha Raman" -> "Aisha R." as on the artboards. */
function shortDisplayName(name: string): string {
  const parts = name.split(/s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.` : name;
}
