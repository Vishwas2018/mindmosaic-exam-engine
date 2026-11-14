import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, HelpCircle, Home, UserCircle, Users } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { Badge } from "@/components/ui";
import { AuthNav } from "@/features/auth/components/AuthNav";

/**
 * Top-level destinations for the parent portal.
 *
 * Decision P1 (D-P1): Nav is This week / Children / Account.
 * Billing sits inside Account (linked to /billing for now).
 * Help is reachable from the universal header on every page.
 */
export const PARENT_NAV_LINKS = [
  { href: "/parent", label: "This week", icon: Calendar },
  { href: "/parent/children", label: "Children", icon: Users },
  { href: "/parent/account", label: "Account", icon: UserCircle },
] as const;

export type ParentNavKey =
  | "/parent"
  | "/parent/children"
  | "/parent/account"
  | "/billing";

export interface ParentShellProps {
  active: ParentNavKey;
  children: ReactNode;
}

/**
 * Shared app shell for every parent-facing page:
 * - Desktop (>= lg): Top header with logo, 3-destination nav, "Back to site", Help link, role badge, AuthNav.
 * - Mobile & Tablet (< lg): Universal top header with logo, Help link, AuthNav + fixed bottom navigation bar
 *   mirroring the student portal conventions (44×44px touch targets, WCAG 2.5.3 label in name, visible focus rings).
 */
export function ParentShell({ active, children }: ParentShellProps) {
  // If active is /billing, it highlights Account since Billing lives inside Account
  const isNavActive = (href: (typeof PARENT_NAV_LINKS)[number]["href"]) => {
    if (active === href) return true;
    if (href === "/parent/account" && active === "/billing") return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-30 border-b border-royal/8 bg-white/95 backdrop-blur-md">
        <div className="site-width flex min-h-20 items-center justify-between gap-2 sm:gap-4 py-3">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <Link
              href="/"
              aria-label="MindMosaic home"
              className="shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <MindMosaicLogo size="sm" className="sm:hidden" />
              <MindMosaicLogo size="md" className="hidden sm:inline-flex" />
            </Link>

            {/* Desktop Navigation (>= lg) */}
            <nav aria-label="Parent" className="hidden items-center gap-1 lg:flex">
              {PARENT_NAV_LINKS.map((item) => {
                const isActive = isNavActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-extrabold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                      isActive
                        ? "bg-royal/10 text-royal"
                        : "text-muted hover:bg-royal/5 hover:text-royal"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <Link
                href="/"
                className="ml-1 inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border-l border-royal/10 px-4 text-sm font-bold text-muted transition-colors hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
              >
                <Home aria-hidden="true" className="h-4 w-4" />
                Back to site
              </Link>
            </nav>
          </div>

          {/* Right Header Cluster: Help, Parent Badge, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link
              href="/parent/help"
              aria-label="Help"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 sm:px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
            >
              <HelpCircle aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Help</span>
            </Link>

            <Badge variant="purple" className="hidden sm:inline-flex">
              Parent
            </Badge>

            <AuthNav showRoleHome={false} />
          </div>
        </div>
      </header>

      {/* Main Content Area: pb-28 below lg to prevent overlap with bottom navigation */}
      <main id="main-content" className="site-width py-8 sm:py-10 pb-28 lg:pb-12">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile/Tablet Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="Parent navigation, mobile"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-royal/10 bg-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(49,32,86,0.06)] lg:hidden"
      >
        <div className="site-width grid grid-cols-3 gap-1 py-1.5">
          {PARENT_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl p-1 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  isActive
                    ? "bg-royal/10 font-extrabold text-royal"
                    : "font-semibold text-muted hover:bg-royal/5 hover:text-royal"
                }`}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
