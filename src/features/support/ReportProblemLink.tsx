import { LifeBuoy } from "lucide-react";

/**
 * The one real support address (also src/features/landing/content.ts
 * SUPPORT_EMAIL and the legal pages). There is deliberately no contact form
 * or ticketing system — a beta tester's report is an email.
 */
const SUPPORT_EMAIL = "hello@mindmosaic.app";

export const REPORT_PROBLEM_HREF = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
  "MindMosaic beta: problem report",
)}&body=${encodeURIComponent(
  "What were you doing, and what happened instead?\n\n(Please don't include your child's full name or any passwords.)\n",
)}`;

/**
 * "Report a problem" for the signed-in shells (parent and student). A quiet
 * line at the foot of the page, not a header item: both headers are already
 * at their overflow limit (see ParentShell's note on the `xl` breakpoint).
 */
export function ReportProblemLink({ className = "" }: { className?: string }) {
  return (
    <p className={`mt-12 text-center text-sm text-muted ${className}`}>
      <a
        href={REPORT_PROBLEM_HREF}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-bold underline-offset-4 hover:text-royal hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
      >
        <LifeBuoy aria-hidden="true" className="h-4 w-4" />
        Report a problem
      </a>
    </p>
  );
}
