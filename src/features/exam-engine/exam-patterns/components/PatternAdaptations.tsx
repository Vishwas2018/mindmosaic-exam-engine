import Link from "next/link";

import type { ExamPattern } from "../exam-pattern";
import { ADAPTATION_COPY } from "../pattern-session";

/**
 * "How this differs from the real assessment" — every adaptation the pattern
 * declares, in words an eight-year-old's parent can read, plus the standing
 * disclaimer link.
 *
 * A `<details>` rather than a modal or a tooltip: it is keyboard-operable and
 * screen-reader-navigable with no JavaScript at all, so this renders inside a
 * server component and the picker stays free of client bundles.
 *
 * Always rendered, even when a pattern declares no adaptations — the summary
 * line is the honesty claim ("this is practice, not the real thing"), and a
 * pattern that happens to have nothing to add should not look like a pattern
 * where the question was never asked.
 */
export function PatternAdaptations({
  pattern,
  className,
}: {
  pattern: ExamPattern;
  className?: string;
}) {
  return (
    <details
      data-testid={`pattern-adaptations-${pattern.id}`}
      className={`group rounded-2xl border border-mm-line bg-white ${className ?? ""}`}
    >
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-[15px] font-bold text-mm-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand">
        How this differs from the real assessment
        <span
          aria-hidden="true"
          className="text-mm-brand transition-transform group-open:rotate-180 motion-reduce:transition-none"
        >
          ▾
        </span>
      </summary>
      <div className="border-t border-mm-line px-4 py-4 text-[14.5px] leading-[1.6] text-mm-muted">
        <p>
          This is practice written by MindMosaic. It is not a real{" "}
          {pattern.examStyle === "naplan_style" ? "NAPLAN" : "ICAS"} paper and no
          question here comes from one.
        </p>
        {pattern.adaptations.length > 0 && (
          <ul className="mt-3 grid gap-3">
            {pattern.adaptations.map((adaptation) => {
              const copy = ADAPTATION_COPY[adaptation];
              return (
                <li key={adaptation} className="flex gap-2.5">
                  <span
                    aria-hidden="true"
                    className="mt-[9px] h-2 w-2 shrink-0 rounded-[2px] bg-mm-coral"
                  />
                  <span>
                    <span className="block font-bold text-mm-ink">{copy.title}</span>
                    {copy.body}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3">
          <Link
            href="/assessment-disclaimer"
            className="font-bold text-mm-brand underline underline-offset-2 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
          >
            Read the full assessment disclaimer
          </Link>
        </p>
      </div>
    </details>
  );
}
