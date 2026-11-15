import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, HelpCircle, UserCircle, Users } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { MindMosaicLogo } from "@/components/branding";

import { ParentAccountMenu } from "./ParentAccountMenu";
import { pFocus } from "./parent-ui";

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
  | "/parent/help"
  | "/billing";

export interface ParentShellProps {
  active: ParentNavKey;
  children: ReactNode;
}

/**
 * Shared shell for every parent page, as drawn in the Claude Design parent artboards: logo, three destinations
 * (This week, Children, Account) with a coral underline on the active one, Help, and the parent's initial (account
 * menu with sign-out). Below lg the three destinations move to a bottom bar with 44px+ targets.
 */
export function ParentShell({ active, children }: ParentShellProps) {
  // If active is /billing, it highlights Account since Billing lives inside Account
  const isNavActive = (href: (typeof PARENT_NAV_LINKS)[number]["href"]) => {
    if (active === href) return true;
    if (href === "/parent/account" && active === "/billing") return true;
    return false;
  };

  return (
    <div className="mm-root min-h-screen bg-mm-tint-soft text-mm-ink">
      <header className="sticky top-0 z-30 border-b border-mm-line bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-4 sm:px-8">
          <Link
            href="/parent"
            aria-label="MindMosaic parent home"
            className={twMerge("inline-flex min-h-11 shrink-0 items-center rounded-xl", pFocus)}
          >
            <MindMosaicLogo size="sm" className="sm:hidden" />
            <MindMosaicLogo size="md" className="hidden sm:inline-flex" />
          </Link>

          <nav aria-label="Parent" className="ml-6 hidden items-center gap-1 lg:flex">
            {PARENT_NAV_LINKS.map((item) => {
              const isActive = isNavActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={twMerge(
                    "relative inline-flex min-h-11 items-center rounded-[10px] px-3.5 text-[15px] font-medium transition-colors",
                    isActive
                      ? "text-mm-brand after:absolute after:inset-x-3.5 after:bottom-1.5 after:h-0.5 after:rounded-full after:bg-mm-coral"
                      : "text-mm-ink-soft hover:text-mm-ink",
                    pFocus,
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href="/parent/help"
              aria-current={active === "/parent/help" ? "page" : undefined}
              className={twMerge(
                "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-[10px] px-3.5 text-[15px] font-medium text-mm-ink-soft transition-colors hover:text-mm-ink",
                active === "/parent/help" && "text-mm-brand",
                pFocus,
              )}
            >
              <HelpCircle aria-hidden="true" className="h-[18px] w-[18px] sm:hidden" />
              <span className="sr-only sm:not-sr-only">Help</span>
            </Link>
            <ParentAccountMenu />
          </div>
        </div>
      </header>

      {/* pb-28 below lg keeps the last card clear of the bottom navigation. */}
      <main id="main-content" className="mx-auto max-w-[1200px] px-4 pt-6 pb-28 sm:px-8 sm:pt-8 lg:pb-16">
        {children}
      </main>

      <nav
        aria-label="Parent navigation, mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-mm-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-xl grid-cols-3 gap-1 px-3 py-1.5">
          {PARENT_NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={twMerge(
                  "flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl p-1 text-xs transition-colors",
                  isActive ? "font-semibold text-mm-brand" : "font-medium text-mm-ink-soft hover:text-mm-ink",
                  pFocus,
                )}
              >
                <Icon aria-hidden="true" className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
