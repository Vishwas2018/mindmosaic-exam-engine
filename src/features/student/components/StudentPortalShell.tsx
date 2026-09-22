import type { ReactNode } from "react";

import type { StudentContext } from "@/features/student/require-student";

import { StudentSidebar, type StudentSidebarKey } from "./StudentSidebar";
import { StudentTopBar } from "./StudentTopBar";
import type { StudentPortalShellData } from "./student-portal-shell-data";

/**
 * Shared chrome for every Stitch-ported student portal screen (Dashboard,
 * Learning Hub, Exam Centre, My Progress): the sidebar + sticky top bar,
 * both real-data-wired per the dashboard audit fixes. Deliberately separate
 * from StudentShell/student-nav.ts (the older top-nav shell used by
 * assignments and other pages) — same reasoning as the dashboard's own
 * comment: changing the shared shell would change every StudentShell page's
 * header in one move, which is out of scope here.
 */
export function StudentPortalShell({
  active,
  breadcrumbLabel,
  student,
  shellData,
  children,
}: {
  active: StudentSidebarKey;
  breadcrumbLabel: string;
  student: StudentContext;
  shellData: StudentPortalShellData;
  children: ReactNode;
}) {
  return (
    <div className="mm-root min-h-screen bg-canvas">
      <div className="lg:flex">
        <StudentSidebar
          active={active}
          displayName={student.displayName}
          yearLevel={student.yearLevel}
          mathematicsPathways={shellData.mathematicsPathways}
          weekDots={shellData.weekDots}
          currentStreak={shellData.currentStreak}
          sessionsThisWeek={shellData.sessionsThisWeek}
          weeklyTarget={shellData.weeklyTarget}
        />

        <div className="min-w-0 flex-1">
          <StudentTopBar breadcrumbLabel={breadcrumbLabel} hasActiveSession={shellData.hasActiveSession} />

          <main id="main-content" className="mx-auto w-full max-w-[1240px] space-y-8 px-4 py-7 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
