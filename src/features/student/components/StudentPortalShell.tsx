import type { ReactNode } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth/components/AuthNav";
import { cn } from "@/lib/cn";

/**
 * Shared chrome for the student portal pages (assignments, engagement).
 * Deliberately lighter than the mockups' full app shell: the student home /
 * learning hub navigation is a separate phase, so this links only to the
 * surfaces that exist today.
 */
const NAV_LINKS = [
  { href: "/", label: "Practice" },
  { href: "/student/assignments", label: "Assignments" },
  { href: "/student/engagement", label: "Progress" },
] as const;

export function StudentPortalShell({
  activePath,
  children,
}: {
  activePath: (typeof NAV_LINKS)[number]["href"];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-royal/10 bg-white/85 backdrop-blur-xl">
        <div className="site-width flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="MindMosaic home">
              <MindMosaicLogo className="[&>span:first-child]:h-9 [&>span:first-child]:w-9" />
            </Link>
            <nav aria-label="Student portal" className="hidden items-center gap-1 sm:flex">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={link.href === activePath ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-bold transition-colors",
                    link.href === activePath
                      ? "bg-royal/8 text-royal"
                      : "text-muted hover:bg-royal/5 hover:text-ink",
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <AuthNav />
        </div>
      </header>
      <main id="main-content" className="site-width pb-24 pt-10">
        {children}
      </main>
    </div>
  );
}
