"use client";

import { useId, useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { GlobalNav } from "./GlobalNav";
import { ProfileMenu } from "./ProfileMenu";
import { ROLE_LABELS, type AppRole, type ShellNavItem, type ShellUser } from "./types";

export interface AppShellProps {
  role: AppRole;
  navItems: ShellNavItem[];
  activeKey?: string;
  user: ShellUser;
  onLogout: () => void;
  /** Rendered in the header, e.g. <NotificationCentre ... />. */
  notificationSlot?: ReactNode;
  /** Rendered in the header, before the nav — e.g. a parent's child switcher. */
  childSwitcherSlot?: ReactNode;
  /** Rendered in the header, before the nav — e.g. a teacher's class switcher. */
  classSwitcherSlot?: ReactNode;
  logoSlot?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Role-aware app shell: header with nav, account menu and optional slots
 * for a notification centre and child/class switchers, plus a responsive
 * mobile disclosure menu. Auth/logout stay caller-owned — this only calls
 * `onLogout`, never touches a session itself.
 */
export function AppShell({
  role,
  navItems,
  activeKey,
  user,
  onLogout,
  notificationSlot,
  childSwitcherSlot,
  classSwitcherSlot,
  logoSlot,
  children,
  className,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavId = useId();

  return (
    <div className={twMerge("min-h-screen bg-page", className)}>
      <header className="border-b border-royal/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          {logoSlot}

          <GlobalNav
            role={role}
            items={navItems}
            activeKey={activeKey}
            className="hidden md:flex"
          />

          <div className="ml-auto flex items-center gap-2">
            {childSwitcherSlot}
            {classSwitcherSlot}
            {notificationSlot}
            <ProfileMenu user={user} onLogout={onLogout} />

            <button
              type="button"
              aria-expanded={mobileNavOpen}
              aria-controls={mobileNavId}
              aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => setMobileNavOpen((current) => !current)}
              className="flex h-11 w-11 items-center justify-center rounded-full text-royal hover:bg-royal/8 md:hidden"
            >
              {mobileNavOpen ? (
                <X aria-hidden="true" className="h-5 w-5" />
              ) : (
                <Menu aria-hidden="true" className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div id={mobileNavId} className="border-t border-royal/10 px-4 py-3 md:hidden">
            <GlobalNav role={role} items={navItems} activeKey={activeKey} />
          </div>
        )}
      </header>

      <main aria-label={`${ROLE_LABELS[role]} content`} className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
