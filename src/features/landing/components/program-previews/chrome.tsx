import type { ReactNode } from "react";
import { Hourglass, Home } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { BACK_TO_SITE, STUDENT_NAV_ITEMS, type StudentNavKey } from "@/features/student/components/student-nav";

/** The signed-in student header, drawn read-only from the same nav definition the real StudentShell uses. */
export function StudentHeader({ active }: { active: StudentNavKey | "practice" | "results" }) {
  return (
    <header className="flex min-h-[60px] shrink-0 items-center justify-between gap-4 border-b border-royal/8 bg-white px-6">
      <div className="flex items-center gap-6">
        <MindMosaicLogo size="md" trademark="none" />
        <nav className="flex items-center gap-0.5">
          {STUDENT_NAV_ITEMS.map((item) => (
            <span
              key={item.key}
              className={`inline-flex min-h-9 items-center rounded-xl px-2.5 text-[13px] font-bold ${
                item.key === active ? "bg-royal/8 text-royal" : "text-muted"
              }`}
            >
              {item.label}
            </span>
          ))}
          <span className="ml-1 inline-flex min-h-9 items-center gap-1.5 border-l border-royal/10 px-2.5 text-[13px] font-bold text-muted">
            <Home aria-hidden="true" className="h-3.5 w-3.5" />
            {BACK_TO_SITE.label}
          </span>
        </nav>
      </div>
    </header>
  );
}

/** Marks a screen as a planned experience. It is always visible, and says "not available" in words. */
export function PlannedBadge({ programme }: { programme: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-primary/40 bg-white px-2.5 py-1 text-[12px] font-bold text-primary">
      <Hourglass aria-hidden="true" className="h-3.5 w-3.5" />
      Planned · {programme} · in development
    </span>
  );
}

/** Foot-of-screen caption for the concept screens, so a still frame can never be read as a live feature. */
export function ConceptCaption({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-t border-dashed border-primary/25 bg-primary-tint/50 px-6 py-2.5 text-[12.5px] font-semibold text-plum-muted">
      <span>Illustrative concept screen. Not available yet.</span>
      <span className="text-primary">{children}</span>
    </div>
  );
}
