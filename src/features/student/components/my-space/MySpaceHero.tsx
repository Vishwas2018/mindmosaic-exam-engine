import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { buttonClasses } from "@/components/ui";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";

/**
 * The one thing to do next. Continue appears ONLY for a confirmed, resumable,
 * server-side timed paper (`hasActiveSession` is read from the server, and
 * ActiveSessionBanner re-checks it before drawing anything). A practice set is
 * never resumable, so Continue never offers one and is never drawn disabled.
 */
export function MySpaceHero({
  hasActiveSession,
  hasFinishedPaper,
}: {
  hasActiveSession: boolean;
  hasFinishedPaper: boolean;
}) {
  const heading = hasActiveSession
    ? "Or start a practice set"
    : hasFinishedPaper
      ? "Ready for more practice?"
      : "Start your first practice set";
  return (
    <section aria-labelledby="my-space-next" className="space-y-3">
      {hasActiveSession && <ActiveSessionBanner />}
      <div className="rounded-2xl border border-mm-line bg-white p-5 shadow-xs sm:p-6">
        <h2 id="my-space-next" className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
          {heading}
        </h2>
        <p className="mt-1.5 max-w-prose text-sm text-mm-muted">
          Pick a year, subject and strand. A practice set has no timer, and it starts again from question 1 if you close the tab.
        </p>
        <Link
          href="/student/practice"
          className={`${buttonClasses({ variant: "primary", size: "lg" })} mt-4 inline-flex min-h-11 items-center gap-2`}
        >
          Start practice
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
