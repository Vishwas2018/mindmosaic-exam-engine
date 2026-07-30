"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Menu, X } from "lucide-react";

import { BACK_TO_SITE, STUDENT_NAV_ITEMS, type StudentNavKey } from "./student-nav";

/**
 * Mobile/tablet disclosure for the student nav. StudentShell's main nav is
 * `hidden lg:flex` — six items plus the logo and sign-out control don't fit
 * in one row until the lg breakpoint (at md/768px it measurably overflows
 * the header), which left every student below lg with no way to reach
 * Learn, Assignments or Progress at all — not just visually, but from the
 * keyboard too, since a `display:none` nav is skipped by Tab. This renders
 * the same links behind a toggle so they stay reachable on every viewport.
 */
export function StudentMobileNav({ active }: { active: StudentNavKey }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="student-mobile-nav-panel"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      >
        {open ? (
          <X aria-hidden="true" className="h-5 w-5" />
        ) : (
          <Menu aria-hidden="true" className="h-5 w-5" />
        )}
      </button>

      {open && (
        <nav
          id="student-mobile-nav-panel"
          aria-label="Student navigation"
          className="absolute inset-x-0 top-full border-b border-royal/8 bg-white px-4 py-2 shadow-[0_12px_24px_rgba(49,32,86,0.08)]"
        >
          {STUDENT_NAV_ITEMS.map((item) => {
            const isActive = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20 ${
                  isActive
                    ? "bg-royal/8 text-royal"
                    : "text-muted hover:bg-royal/5 hover:text-royal"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href={BACK_TO_SITE.href}
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-11 items-center gap-1.5 rounded-xl border-t border-royal/8 px-3 text-sm font-bold text-muted transition hover:bg-royal/5 hover:text-royal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <Home aria-hidden="true" className="h-4 w-4" />
            {BACK_TO_SITE.label}
          </Link>
        </nav>
      )}
    </div>
  );
}
