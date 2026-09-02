import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  ClipboardList,
  Home,
  LayoutDashboard,
  PenLine,
  Users,
} from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth";

import type { TeacherClass } from "../data";
import { ClassSwitcher } from "./ClassSwitcher";

export type TeacherNavKey =
  | "overview"
  | "students"
  | "assignments"
  | "analytics"
  | "marking";

/*
 * Every top-level teacher route. The inventory in src/app/dev/routes/page.tsx
 * lists three more under "Teacher" — /teacher/assignments/new,
 * /teacher/students/[id] and /teacher/marking/[attemptId]/[questionId] — and
 * none belongs in a nav: the first is the "New assignment" action on the
 * assignments and overview pages, and the other two are drill-downs that
 * need an id, reached by clicking a row. So this list is complete at five,
 * not short of eight.
 */
const NAV_ITEMS: { key: TeacherNavKey; label: string; href: string; icon: ReactNode }[] = [
  {
    key: "overview",
    label: "Overview",
    href: "/teacher",
    icon: <LayoutDashboard aria-hidden="true" className="h-4.5 w-4.5" />,
  },
  {
    key: "students",
    label: "Students",
    href: "/teacher/students",
    icon: <Users aria-hidden="true" className="h-4.5 w-4.5" />,
  },
  {
    key: "assignments",
    label: "Assignments",
    href: "/teacher/assignments",
    icon: <ClipboardList aria-hidden="true" className="h-4.5 w-4.5" />,
  },
  {
    key: "analytics",
    label: "Analytics",
    href: "/teacher/analytics",
    icon: <BarChart3 aria-hidden="true" className="h-4.5 w-4.5" />,
  },
  {
    key: "marking",
    label: "Marking",
    href: "/teacher/marking",
    icon: <PenLine aria-hidden="true" className="h-4.5 w-4.5" />,
  },
];

/**
 * Shared frame for every teacher screen: brand + class scope in a sidebar,
 * page heading and auth controls in the top bar. Server component — the
 * only interactive part is the ClassSwitcher island.
 */
export function TeacherShell({
  title,
  activeNav,
  classes,
  activeClassId,
  teacherName,
  actions,
  children,
}: {
  title: string;
  activeNav: TeacherNavKey;
  classes: TeacherClass[];
  activeClassId: string | null;
  teacherName: string | null;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const classQuery = activeClassId ? `?class=${activeClassId}` : "";
  const activeClass = classes.find((teacherClass) => teacherClass.id === activeClassId);

  return (
    <div className="flex min-h-screen bg-page">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-royal/10 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-royal/10 px-5 py-5">
          <Link href="/" aria-label="MindMosaic home">
            <MindMosaicLogo size="md" />
          </Link>
          <Badge variant="purple" className="ml-auto">
            Teacher
          </Badge>
        </div>
        {classes.length > 0 && activeClassId && (
          <div className="border-b border-royal/10 px-4 py-4">
            <ClassSwitcher classes={classes} activeClassId={activeClassId} />
          </div>
        )}
        <nav aria-label="Teacher" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={`${item.href}${classQuery}`}
              aria-current={item.key === activeNav ? "page" : undefined}
              className={
                item.key === activeNav
                  ? "flex items-center gap-2.5 rounded-xl bg-royal/8 px-3.5 py-2.5 text-sm font-bold text-royal"
                  : "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-muted transition hover:bg-royal/5 hover:text-ink"
              }
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {/* The logo above links home, but a logo is a brand mark before
              it is a signpost — this is the labelled way back out. */}
          <Link
            href="/"
            className="mt-2 flex items-center gap-2.5 rounded-xl border-t border-royal/10 px-3.5 py-2.5 pt-4 text-sm font-semibold text-muted transition hover:bg-royal/5 hover:text-ink"
          >
            <Home aria-hidden="true" className="h-4.5 w-4.5" />
            Back to site
          </Link>
        </nav>
        {teacherName && (
          <div className="border-t border-royal/10 px-5 py-4">
            <p className="text-sm font-bold text-ink">{teacherName}</p>
            <p className="text-xs text-muted">Teacher account</p>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-royal/10 bg-white/85 backdrop-blur-xl">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-extrabold tracking-[-0.02em] text-ink">
                {title}
              </h1>
              {activeClass && (
                <Badge variant="neutral" className="hidden sm:inline-flex">
                  {activeClass.name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              {/* The teacher nav above already links the teacher dashboard. */}
              <AuthNav showRoleHome={false} />
            </div>
          </div>
          {/*
            The sidebar that holds the nav is `hidden lg:flex`, so below
            1024px a teacher had no navigation whatsoever — not one of the
            five teacher screens was reachable from any other, and a
            display:none nav is skipped by Tab, so it was a keyboard dead
            end too. Same destinations, same class scope, as a scrollable
            pill row. Mirrors the equivalent row AdminShell already has.
          */}
          <nav
            aria-label="Teacher, compact"
            className="-mx-1 flex gap-1 overflow-x-auto px-4 pb-2 sm:px-6 lg:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={`${item.href}${classQuery}`}
                aria-current={item.key === activeNav ? "page" : undefined}
                className={
                  item.key === activeNav
                    ? "shrink-0 rounded-full bg-royal px-4 py-1.5 text-sm font-bold text-white"
                    : "shrink-0 rounded-full px-4 py-1.5 text-sm font-bold text-muted transition hover:bg-royal/8 hover:text-royal"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold text-muted transition hover:bg-royal/8 hover:text-royal"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Back to site
            </Link>
          </nav>
        </header>
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
