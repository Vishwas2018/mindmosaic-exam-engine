import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { SubjectPlate } from "@/features/catalogue/components/SubjectPlate";
import { SUBJECT_PRESENTATION } from "@/features/catalogue/presentation";

import type { ExamPattern } from "../exam-pattern";
import type { PatternReadiness } from "../pattern-readiness";
import { patternPlateSubject, patternSubjectName } from "../pattern-presentation";
import { describePaperShape, reducedModuleMinutes } from "../pattern-session";

/**
 * One paper on the picker.
 *
 * Deliberately the practice catalogue's card, restated for this shape rather
 * than reinvented: the same plate artwork, the same 20px radius, border,
 * hover lift and focus ring, so a child moving between /practice and /exams
 * is looking at one product. The whole card is the link, with a 44px-plus
 * target on a phone and a visible focus ring, because the audience is eight
 * and ten years old.
 *
 * The three things a card must never do, all enforced here rather than by
 * convention at each call site:
 *
 *  - never call a paper "official", "real" or a "simulation";
 *  - never present a not-startable paper as startable;
 *  - never show a `practice_module` without saying it is one.
 */

const STATE_COPY: Record<
  PatternReadiness["state"],
  { chip: string; tone: string }
> = {
  ready: { chip: "Ready to sit", tone: "border-mm-tint-line-strong bg-mm-tint text-mm-brand" },
  short: {
    chip: "Shorter practice module only",
    tone: "border-royal-orange/25 bg-warning/10 text-warning",
  },
  unavailable: {
    chip: "Coming soon",
    tone: "border-mm-line bg-mm-page text-mm-muted",
  },
};

export function ExamPatternCard({
  pattern,
  readiness,
}: {
  pattern: ExamPattern;
  readiness: PatternReadiness;
}) {
  const presentation = SUBJECT_PRESENTATION[patternPlateSubject(pattern)];
  const subject = patternSubjectName(pattern);
  const state = STATE_COPY[readiness.state];

  /* What the child would actually sit, in their own words. A short paper
     advertises the reduced module's real size and its recalculated time —
     never the full-length pattern's numbers. */
  const shape =
    readiness.state === "short"
      ? describePaperShape(
          readiness.availableCount,
          reducedModuleMinutes(pattern, readiness.availableCount),
        )
      : describePaperShape(pattern.questionCount, pattern.timeMinutes);

  const isDeferred = pattern.status === "deferred";
  const startable = readiness.state !== "unavailable";

  const body = (
    <div
      className={`flex h-full overflow-hidden rounded-[20px] border bg-white shadow-[0_1px_2px_rgba(24,21,31,0.05)] transition duration-200 motion-reduce:transform-none motion-reduce:transition-none sm:flex-col ${
        startable
          ? "border-mm-line group-hover:-translate-y-1 group-hover:border-mm-brand/45 group-hover:shadow-[0_18px_40px_rgba(24,21,31,0.10)]"
          : "border-dashed border-mm-line-quiet"
      }`}
    >
      <SubjectPlate
        presentation={presentation}
        className="m-4 h-24 w-24 shrink-0 rounded-xl border border-mm-line sm:m-0 sm:aspect-[3/2] sm:h-auto sm:w-full sm:rounded-none sm:border-x-0 sm:border-t-0"
        markClassName="h-8 w-8 sm:h-11 sm:w-11"
        zoomOnGroupHover={startable}
      />

      <div className="flex min-w-0 flex-1 flex-col py-4 pr-4 sm:p-5">
        <h4 className="text-[19px] font-bold leading-[1.2] text-mm-ink">{subject}</h4>

        <p
          className="mt-2 text-[15.5px] font-bold text-mm-ink-soft"
          data-testid={`pattern-shape-${pattern.id}`}
        >
          {shape}
        </p>

        <div className="mt-3 flex flex-1 flex-wrap items-start gap-2">
          {pattern.presentation === "practice_module" && (
            <span
              data-testid={`pattern-module-badge-${pattern.id}`}
              className="inline-flex items-center rounded-lg border border-mm-lilac/40 bg-mm-lilac/12 px-2.5 py-1 text-[12px] font-bold text-mm-ink"
            >
              Practice module — not a full-length paper
            </span>
          )}
          <span
            data-testid={`pattern-state-${pattern.id}`}
            className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[12px] font-bold ${state.tone}`}
          >
            {isDeferred ? "Coming soon" : state.chip}
          </span>
        </div>

        {readiness.state === "short" && (
          <p className="mt-3 text-[13.5px] leading-[1.5] text-mm-muted">
            We do not have enough reviewed questions for the full-length paper yet
            ({readiness.availableCount} of {readiness.requestedCount}). You can sit a
            shorter practice module instead.
          </p>
        )}
        {readiness.state === "unavailable" && (
          <p className="mt-3 text-[13.5px] leading-[1.5] text-mm-muted">
            {isDeferred
              ? "Writing tasks are marked by a person, so they are not ready yet."
              : "We are still writing and reviewing questions for this one."}
          </p>
        )}
        {readiness.state === "ready" && readiness.distinctPapers > 1 && (
          <p className="mt-3 text-[13.5px] leading-[1.5] text-mm-muted">
            {readiness.distinctPapers} different papers — no repeated questions between
            them.
          </p>
        )}

        <span
          className={`mt-4 flex items-center justify-between gap-3 border-t border-mm-line-soft pt-4 text-[15px] font-bold ${
            startable ? "text-mm-brand" : "text-mm-muted"
          }`}
        >
          {startable ? "See this paper" : "Not available yet"}
          {startable && (
            <ArrowRight
              aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            />
          )}
        </span>
      </div>
    </div>
  );

  if (!startable) {
    /* Not a link, and not a disabled link: there is nothing to open, so
       nothing here takes focus or looks like it would do something. The
       state is stated in words, never by colour or opacity alone. */
    return (
      <div className="h-full" data-testid={`pattern-card-${pattern.id}`}>
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/exams/${pattern.id}`}
      data-testid={`pattern-card-${pattern.id}`}
      aria-label={`${subject} — ${shape}`}
      className="group block h-full rounded-[20px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page"
    >
      {body}
    </Link>
  );
}
