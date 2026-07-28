import type { ReactNode } from "react";
import Link from "next/link";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";

const NAV_LINKS = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/children", label: "Children" },
] as const;

/**
 * Shared header/shell for every page under /parent, extracted so
 * src/app/parent/page.tsx and src/app/parent/children/page.tsx don't each
 * carry their own copy of the same header + nav markup.
 */
export function ParentShell({
  active,
  children,
}: {
  active: (typeof NAV_LINKS)[number]["href"];
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <nav aria-label="Parent" className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active === link.href ? "page" : undefined}
                className={`rounded-xl px-4 py-2 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  active === link.href ? "bg-royal/10 text-royal" : "text-muted hover:text-royal"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="hidden sm:inline-flex">
              Parent
            </Badge>
            <AuthNav />
          </div>
        </div>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
