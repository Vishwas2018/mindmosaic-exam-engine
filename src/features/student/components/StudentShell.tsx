import type { ReactNode } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth";

export type StudentNavKey = "home" | "learn" | "assignments" | "engagement";

/*
 * Practice points at the existing exam setup on the home page and Results
 * at the existing results route — both screens are owned elsewhere
 * (mockups 07–09); the student area only links to them. The remaining four
 * items are every screen this feature owns (home, learn, assignments,
 * engagement) — this nav used to only cover two of them, with assignments
 * and engagement carrying their own separate StudentPortalShell nav; the
 * two shells are unified here so every student screen shows the same nav.
 */
const NAV_ITEMS: ReadonlyArray<{
  key: StudentNavKey | "practice" | "results";
  label: string;
  href: string;
}> = [
  { key: "home", label: "Dashboard", href: "/student" },
  { key: "learn", label: "Learn", href: "/student/learn" },
  { key: "assignments", label: "Assignments", href: "/student/assignments" },
  { key: "engagement", label: "Progress", href: "/student/engagement" },
  { key: "practice", label: "Practice", href: "/#exam-setup" },
  { key: "results", label: "Results", href: "/results" },
];

/**
 * Shared app shell for every signed-in student screen: sticky header with
 * the student nav and the existing AuthNav sign-out control. The logo links
 * to the marketing home ("/"), matching the parent, teacher and admin
 * shells rather than the student-only convention the discarded
 * StudentPortalShell broke from.
 */
export function StudentShell({
  active,
  children,
}: {
  active: StudentNavKey;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-royal/8 bg-white/85 backdrop-blur-xl">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="MindMosaic home"
              className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <MindMosaicLogo />
            </Link>
            <nav aria-label="Student navigation" className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                      isActive
                        ? "bg-royal/8 text-royal"
                        : "text-muted hover:bg-royal/5 hover:text-royal"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <AuthNav />
        </div>
      </header>
      <main id="main-content" className="site-width pb-20 pt-8 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
