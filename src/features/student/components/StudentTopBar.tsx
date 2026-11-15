"use client";

import { useState } from "react";
import Link from "next/link";
import { HelpCircle, Menu } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { useAuth } from "@/features/auth/AuthProvider";

import { StudentAccountMenu } from "./StudentAccountMenu";
import { studentNavItems } from "./StudentSidebar";

/**
 * Sticky top bar shared by every Stitch-ported student portal screen
 * (Dashboard, Learning Hub, Exam Centre, My Progress, Practice Studio).
 * Extracted from the dashboard's original inline header so all five
 * screens stay identical without copy-pasting it — see StudentPortalShell.
 *
 * Mobile menu (2026-09 e2e repair): was a native `<details>/<summary>`
 * disclosure. Chromium doesn't reliably expose `<summary>` with an
 * accessible "button" role even with `aria-label` set — the authenticated
 * Playwright suite's `getByRole("button", { name: "Open menu" })` couldn't
 * find it, and a real screen-reader user hits the same gap. Replaced with
 * an explicit controlled `<button aria-expanded>` + conditionally rendered
 * panel, the standard accessible disclosure pattern — this is a component
 * fix, not a test relaxation.
 *
 * Placeholder fields (unchanged from the dashboard build): term/goal pills
 * and "Edit interests & goals" have no backing profile columns yet
 * (audit D-04/D-08). The notification dot is real — it reflects
 * `hasActiveSession`, not a hardcoded on-state (audit D-03).
 */
export function StudentTopBar({
  breadcrumbLabel,
  hasActiveSession,
  showVihaan = false,
}: {
  breadcrumbLabel: string;
  hasActiveSession: boolean;
  showVihaan?: boolean;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { displayName } = useAuth();
  const name = displayName?.trim() || "Your account";

  /* Claude Design student artboards: a quiet 64px bar on the page tint — where you are on the left; Help and your
     initial on the right. Below lg the sidebar folds into the menu button. */
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 bg-mm-tint-soft/90 px-4 backdrop-blur-md sm:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            aria-controls="student-mobile-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] text-mm-ink-soft hover:bg-white"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          {mobileNavOpen && (
            <div
              id="student-mobile-nav"
              className="absolute inset-x-0 top-16 z-40 border-b border-mm-line bg-white p-3 shadow-[0_24px_60px_rgba(24,21,31,0.12)]"
            >
              <nav aria-label="Student navigation" className="grid gap-0.5">
                {studentNavItems(showVihaan).map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium text-mm-ink-soft hover:bg-mm-tint-soft hover:text-mm-ink"
                  >
                    <item.icon aria-hidden="true" className="h-[19px] w-[19px] shrink-0 text-mm-muted" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
        <Link href="/student" aria-label="MindMosaic — My Space" className="flex min-h-11 items-center lg:hidden">
          <MindMosaicLogo size="sm" />
        </Link>
        <p className="hidden truncate text-sm text-mm-muted lg:block">
          {breadcrumbLabel}
          {hasActiveSession ? <span className="sr-only"> (you have a paper in progress)</span> : null}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/help"
          aria-label="Help Centre"
          className="grid h-11 w-11 place-items-center rounded-[10px] text-mm-ink-soft hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
        >
          <HelpCircle aria-hidden="true" className="h-[18px] w-[18px]" />
        </Link>
        <StudentAccountMenu
          label={`${name}: account menu`}
          className="grid h-11 w-11 place-items-center rounded-xl"
          trigger={
            <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-[10px] bg-mm-tint text-[15px] font-semibold text-mm-brand">
              {name.charAt(0).toUpperCase()}
            </span>
          }
        />
      </div>
    </header>
  );
}
