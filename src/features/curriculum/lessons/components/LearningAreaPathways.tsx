"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { LessonPathway } from "../types";
import { LessonPathwayList } from "./LessonPathwayList";

interface LearningAreaPathwaysProps {
  /**
   * Every strand pathway for this one learning area, already scoped to the
   * student's real yearLevel by the caller (see
   * `getCurriculumPathwaysForYearLevel` / `groupPathwaysByLearningArea`).
   * Never empty — the caller renders the "not published yet" honest empty
   * state itself rather than passing `[]` here.
   */
  pathways: readonly LessonPathway[];
}

function strandLabel(strand: string): string {
  return strand.charAt(0).toUpperCase() + strand.slice(1);
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Renders every strand pathway inside a single learning area (Mathematics,
 * or English): a deterministic "Start here" anchor, a sticky strand jump
 * rail (or a `<select>` fallback on narrow viewports), and a single-open
 * accordion of `LessonPathwayList`s. One learning area's worth of content,
 * scoped by whichever `/student/learn/[area]` route rendered it — no tab
 * switcher here, since the route itself is the area boundary.
 *
 * "Start here" always points at the first pathway's first node by
 * `sortOrder` — never a fabricated "resume" position, since there is no
 * per-lesson completion field in the data model.
 *
 * All strand panels stay mounted in the DOM at all times; a collapsed
 * strand is hidden via the `hidden` attribute, not unmounted, so every
 * lesson card stays reachable by keyboard, screen reader and Ctrl-F.
 */
export function LearningAreaPathways({ pathways }: LearningAreaPathwaysProps) {
  const [openStrand, setOpenStrand] = useState<string | null>(pathways[0]?.strand ?? null);

  const startHere = useMemo(() => {
    const pathway = pathways[0];
    const node = pathway?.nodes[0];
    if (!pathway || !node) return null;
    return { strand: pathway.strand, nodeTitle: node.title };
  }, [pathways]);

  function jumpToStrand(strand: string) {
    setOpenStrand(strand);
    requestAnimationFrame(() => {
      const heading = document.getElementById(`pathway-heading-${strand}`);
      heading?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      heading?.querySelector("button")?.focus();
    });
  }

  return (
    <div className="grid gap-5">
      {startHere && (
        <button
          type="button"
          onClick={() => jumpToStrand(startHere.strand)}
          className="group inline-flex w-fit min-h-12 items-center gap-3 rounded-full border border-mm-brand/25 bg-gradient-to-r from-mm-tint/90 via-white to-amber-500/10 px-4.5 py-2 text-sm font-bold text-mm-brand shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-mm-brand/40 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand sm:px-5"
        >
          <span className="grid h-6 w-6 place-items-center rounded-full bg-mm-brand text-white shadow-xs transition-transform duration-200 group-hover:scale-110">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="text-mm-ink group-hover:text-mm-brand transition-colors">
            Start here: <span className="text-mm-brand font-extrabold">{strandLabel(startHere.strand)}</span> — {startHere.nodeTitle}
          </span>
          <ArrowRight className="h-4 w-4 text-mm-brand transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </button>
      )}

      {pathways.length > 1 && (
        <>
          {/* Strand jump rail — desktop/tablet */}
          <div className="sticky top-[72px] z-10 -mx-1 hidden gap-2 overflow-x-auto rounded-xl border border-mm-line/70 bg-mm-page/90 px-3 py-2.5 shadow-xs backdrop-blur-md sm:flex">
            <span className="flex items-center text-xs font-bold uppercase tracking-wider text-mm-muted-2 px-1">
              Strands:
            </span>
            {pathways.map((pathway) => {
              const isCurrent = openStrand === pathway.strand;
              return (
                <button
                  key={pathway.strand}
                  type="button"
                  onClick={() => jumpToStrand(pathway.strand)}
                  aria-current={isCurrent ? "true" : undefined}
                  className={clsx(
                    "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[13.5px] font-bold transition-all duration-180 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand cursor-pointer",
                    isCurrent
                      ? "border-mm-brand bg-mm-brand text-white shadow-xs ring-2 ring-mm-brand/20"
                      : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand/50 hover:bg-mm-tint/40 hover:text-mm-brand",
                  )}
                >
                  <span>{strandLabel(pathway.strand)}</span>
                  <span
                    className={clsx(
                      "rounded-full px-1.5 py-0.2 text-[11px] font-semibold",
                      isCurrent ? "bg-white/20 text-white" : "bg-slate-100 text-mm-muted",
                    )}
                  >
                    {pathway.nodes.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Strand jump menu — mobile */}
          <label className="grid gap-1.5 sm:hidden">
            <span className="text-xs font-bold uppercase tracking-wide text-mm-muted-2">
              Jump to strand
            </span>
            <select
              value={openStrand ?? ""}
              onChange={(event) => jumpToStrand(event.target.value)}
              className="min-h-12 rounded-xl border border-mm-line bg-white px-3.5 text-[15px] font-semibold text-mm-ink shadow-xs focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
            >
              {pathways.map((pathway) => (
                <option key={pathway.strand} value={pathway.strand}>
                  {strandLabel(pathway.strand)} ({pathway.nodes.length} lessons)
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      <div className="grid gap-5">
        {pathways.map((pathway) => (
          <LessonPathwayList
            key={pathway.strand}
            pathway={pathway}
            previewMode={false}
            isOpen={openStrand === pathway.strand}
            onToggle={() =>
              setOpenStrand((prev) => (prev === pathway.strand ? null : pathway.strand))
            }
          />
        ))}
      </div>
    </div>
  );
}
