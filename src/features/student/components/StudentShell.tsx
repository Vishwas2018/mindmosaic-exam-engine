import type { ReactNode } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth";

import { StudentMobileNav } from "./StudentMobileNav";
import { BACK_TO_SITE, STUDENT_NAV_ITEMS, type StudentNavKey } from "./student-nav";

export type { StudentNavKey };

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
    <div className="min-h-screen bg-mm-page">
      <header className="sticky top-0 z-40 border-b border-mm-line bg-mm-page/96 backdrop-blur-xl">
        <div className="site-width relative flex min-h-20 items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="MindMosaic home"
              className="rounded-2xl focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
            >
              <MindMosaicLogo size="md" />
            </Link>
            <nav aria-label="Student navigation" className="hidden items-center gap-1 lg:flex">
              {STUDENT_NAV_ITEMS.map((item) => {
                const isActive = item.key === active;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand ${
                      isActive
                        ? "bg-mm-tint text-mm-brand"
                        : "text-mm-muted hover:bg-mm-tint/60 hover:text-mm-brand"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href={BACK_TO_SITE.href}
                className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-xl border-l border-mm-line px-3 text-sm font-bold text-mm-muted transition hover:bg-mm-tint/60 hover:text-mm-brand focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-mm-brand"
              >
                <Home aria-hidden="true" className="h-4 w-4" />
                {BACK_TO_SITE.label}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <StudentMobileNav active={active} />
            {/* The student nav above already links /student ("Dashboard"). */}
            <AuthNav showRoleHome={false} />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width pb-20 pt-8 sm:pt-10">
        {children}
      </main>
    </div>
  );
}
