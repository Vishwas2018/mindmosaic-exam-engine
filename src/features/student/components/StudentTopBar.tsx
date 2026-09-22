"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Flag, Menu } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth";

import { SIDEBAR_NAV_ITEMS } from "./StudentSidebar";

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
}: {
  breadcrumbLabel: string;
  hasActiveSession: boolean;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 relative flex h-16 items-center justify-between border-b border-mm-line bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileNavOpen}
            aria-controls="student-mobile-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-mm-ink-soft hover:bg-mm-page"
          >
            <Menu aria-hidden="true" className="h-5 w-5" />
          </button>
          {mobileNavOpen && (
            <div
              id="student-mobile-nav"
              className="absolute inset-x-0 top-16 z-40 border-b border-mm-line bg-white p-3 shadow-warm-card"
            >
              <nav aria-label="Student navigation" className="space-y-1">
                {SIDEBAR_NAV_ITEMS.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-mm-ink-soft hover:bg-mm-page hover:text-primary"
                  >
                    <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
        <Link href="/" aria-label="MindMosaic home" className="flex min-h-11 items-center lg:hidden">
          <MindMosaicLogo size="sm" />
        </Link>
        <div className="hidden min-w-0 items-center gap-1.5 text-xs font-medium text-mm-muted lg:flex">
          <span className="shrink-0 font-semibold text-mm-ink">Student Portal</span>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 -rotate-90" />
          <span className="shrink-0 font-semibold text-primary">{breadcrumbLabel}</span>
          {/*
            Placeholder term/goal pills to match the Stitch mock — no
            term-calendar model yet. Pushed to `xl`: at exactly 1024px
            (the sidebar's own breakpoint), the sidebar plus this bar's
            full content plus AuthNav measurably overflowed on Linux CI
            (2026-09-21) — the two pills are the least essential content
            here (decorative placeholders, not real data), so they're what
            gives way first rather than hiding real nav or account info.
          */}
          <span aria-hidden="true" className="hidden shrink-0 xl:inline">
            •
          </span>
          <span className="hidden shrink-0 rounded-full border border-mm-line bg-mm-page px-2 py-0.5 text-mm-muted xl:inline-block">
            Term 3 · Week 4
          </span>
          <span className="hidden shrink-0 items-center gap-1 rounded-full border border-mm-line bg-mm-page px-2 py-0.5 text-mm-muted xl:inline-flex">
            <Flag aria-hidden="true" className="h-3 w-3" />
            Goal: NAPLAN preparation
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          title={hasActiveSession ? "You have an active session to resume" : "No notifications"}
          aria-disabled="true"
          className="relative flex h-11 w-11 shrink-0 cursor-default items-center justify-center rounded-lg text-mm-ink-soft hover:bg-mm-page"
        >
          <Bell aria-hidden="true" className="h-[18px] w-[18px]" />
          {hasActiveSession && (
            <span className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-mm-coral-text" />
          )}
        </button>
        {/* Placeholder — editing interests/goals needs new profile columns; see audit D-04/D-08. Pushed to `xl` for the same header-width reason as the pills above. */}
        <button
          type="button"
          title="Edit interests & goals (coming soon)"
          aria-disabled="true"
          className="hidden min-h-11 shrink-0 cursor-default items-center gap-1.5 rounded-btn border border-mm-line bg-white px-3 text-xs font-semibold text-mm-ink-soft xl:inline-flex"
        >
          Edit interests &amp; goals
        </button>
        <AuthNav showRoleHome={false} />
      </div>
    </header>
  );
}
