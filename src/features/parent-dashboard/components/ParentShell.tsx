import type { ReactNode } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";

/*
 * Every route a parent owns. /billing was the gap: it is a core parent
 * surface (plan, payment method, invoices, cancel/resume) but the only ways
 * in were a "See plans" link buried in the locked-insights card and a
 * redirect from the — currently dormant — subscription gate. A parent who
 * simply wanted to check what they were paying had no way to navigate
 * there.
 *
 * There is no fourth item because there is no fourth parent route: the
 * inventory in src/app/dev/routes/page.tsx lists exactly /parent,
 * /parent/children and /billing under "Parent", and this nav now covers all
 * three.
 */
const NAV_LINKS = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/children", label: "Children" },
  { href: "/billing", label: "Billing" },
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
            {/* The logo is a link home too, but a logo is not a signposted
                way out — this is. */}
            <Link
              href="/"
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl border-l border-royal/10 px-4 py-2 text-sm font-bold text-muted transition-colors hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <Home aria-hidden="true" className="h-4 w-4" />
              Back to site
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Badge variant="purple" className="hidden sm:inline-flex">
              Parent
            </Badge>
            <AuthNav />
          </div>
        </div>
        {/*
          The nav above is `hidden sm:flex`, which left every parent below
          640px with no way to reach Children or Billing at all — a
          display:none nav is skipped by Tab too, so it was not merely a
          visual loss. Same links, always rendered, wrapping on small
          screens rather than hiding.
        */}
        <nav aria-label="Parent, compact" className="site-width flex flex-wrap gap-1 pb-3 sm:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active === link.href ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                active === link.href ? "bg-royal/10 text-royal" : "text-muted hover:text-royal"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold text-muted transition-colors hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            Back to site
          </Link>
        </nav>
      </header>
      <main id="main-content" className="site-width py-10 sm:py-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
