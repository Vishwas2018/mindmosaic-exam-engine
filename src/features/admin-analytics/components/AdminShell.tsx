import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart3, FileSearch, Home, LayoutDashboard } from "lucide-react";
import { clsx } from "clsx";

import { MindMosaicLogo } from "@/components/branding";

export type AdminSection = "analytics" | "intelligence";

const NAV_ITEMS: ReadonlyArray<{
  section: AdminSection;
  href: string;
  label: string;
  icon: typeof BarChart3;
}> = [
  {
    section: "analytics",
    href: "/admin/analytics",
    label: "Analytics",
    icon: BarChart3,
  },
  {
    section: "intelligence",
    href: "/admin/intelligence",
    label: "Content Intelligence",
    icon: FileSearch,
  },
];

/**
 * Admin dashboard frame: dark brand sidebar (mockup 16) with the two
 * dashboard sections, and a light content column with a sticky page
 * header. Purely presentational — access control lives in the pages via
 * requireAdminAccess, and data comes in as children.
 */
export function AdminShell({
  active,
  title,
  contextPill,
  actions,
  children,
}: {
  active: AdminSection;
  title: string;
  contextPill?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-page">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-brand-ink lg:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/" aria-label="MindMosaic home">
            <MindMosaicLogo inverse compact={false} className="[&>span:first-child]:h-9 [&>span:first-child]:w-9" />
          </Link>
          <span className="mt-3 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white/80">
            Admin
          </span>
        </div>
        <nav aria-label="Admin sections" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const isActive = item.section === active;
            const Icon = item.icon;
            return (
              <Link
                key={item.section}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold transition",
                  isActive
                    ? "bg-white/12 text-white"
                    : "text-white/60 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-1 border-t border-white/10 px-3 py-4">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <LayoutDashboard aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
            Admin home
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-bold text-white/60 transition hover:bg-white/8 hover:text-white"
          >
            <Home aria-hidden="true" className="h-4.5 w-4.5 shrink-0" />
            Back to practice
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-royal/10 bg-white/85 backdrop-blur-xl">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-5 py-3 lg:px-8">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black tracking-[-0.02em] text-ink">
                {title}
              </h1>
              {contextPill && (
                <span className="inline-flex items-center rounded-full border border-royal/15 bg-royal/5 px-3 py-1 text-xs font-bold text-muted">
                  {contextPill}
                </span>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
          {/* Small screens: the sidebar is hidden, keep section links reachable. */}
          <nav
            aria-label="Admin sections"
            className="flex gap-1 px-5 pb-2 lg:hidden"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.section}
                href={item.href}
                aria-current={item.section === active ? "page" : undefined}
                className={clsx(
                  "rounded-full px-4 py-1.5 text-sm font-bold transition",
                  item.section === active
                    ? "bg-royal text-white"
                    : "text-muted hover:bg-royal/8 hover:text-royal",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main id="main-content" className="flex-1 px-5 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
