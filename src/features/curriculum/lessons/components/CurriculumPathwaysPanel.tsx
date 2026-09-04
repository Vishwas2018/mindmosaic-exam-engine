"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import type { CurriculumLearningArea, LearningAreaPathwayGroup } from "../types";
import { LessonPathwayList } from "./LessonPathwayList";

interface CurriculumPathwaysPanelProps {
  yearLevel: number | null;
  learningAreas: readonly LearningAreaPathwayGroup[];
  /**
   * The student's weakest subject label from real attempt history (e.g.
   * "Numeracy"), already computed by the page for the hero card. Used only
   * to choose a sensible default tab/strand to open — it is a coarse
   * subject→learning-area mapping, never a claim about which lesson the
   * student has or hasn't completed.
   */
  recommendedFocusLabel?: string | null;
}

function EmptyPathwaysNotice({ message }: { message: string }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-mm-line bg-white px-6 py-12 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-mm-tint text-mm-brand">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </span>
      <p className="max-w-md text-[14.5px] leading-relaxed text-mm-muted">{message}</p>
    </div>
  );
}

/** Coarse, presentation-only guess at which learning area a NAPLAN-style
 *  subject label belongs to — used solely to pick a default tab. */
const SUBJECT_TO_LEARNING_AREA: Readonly<Record<string, CurriculumLearningArea>> = Object.freeze({
  numeracy: "Mathematics",
  reading: "English",
  writing: "English",
  "language conventions": "English",
  spelling: "English",
});

function strandLabel(strand: string): string {
  return strand.charAt(0).toUpperCase() + strand.slice(1);
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Renders every strand pathway for a student's real yearLevel, grouped by
 * learning area (Mathematics, English). Fails honestly instead of ever
 * substituting another year's content: a missing yearLevel or a yearLevel
 * with no authored pathways yet both render an explanatory empty state.
 *
 * Interaction model: learning areas are tabs, strands within a tab are a
 * single-open accordion (one open by default), and a sticky rail lets a
 * student jump straight to a strand instead of scrolling past every other
 * one. All 50+ lesson cards stay mounted in the DOM at all times — closed
 * sections are hidden via the `hidden` attribute, not unmounted — so they
 * stay reachable by keyboard, screen reader and Ctrl-F, and a deep link
 * into a lesson can always open the right tab and strand to reach it.
 */
export function CurriculumPathwaysPanel({
  yearLevel,
  learningAreas,
  recommendedFocusLabel = null,
}: CurriculumPathwaysPanelProps) {
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const defaultAreaIndex = useMemo(() => {
    if (recommendedFocusLabel) {
      const mapped = SUBJECT_TO_LEARNING_AREA[recommendedFocusLabel.trim().toLowerCase()];
      const idx = learningAreas.findIndex((area) => area.learningArea === mapped);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [learningAreas, recommendedFocusLabel]);

  const [activeIndex, setActiveIndex] = useState(defaultAreaIndex);
  const [openStrandByArea, setOpenStrandByArea] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    for (const area of learningAreas) {
      initial[area.learningArea] = area.pathways[0]?.strand ?? null;
    }
    return initial;
  });

  const startHere = useMemo(() => {
    const areaIndex = defaultAreaIndex;
    const area = learningAreas[areaIndex];
    const pathway = area?.pathways[0];
    const node = pathway?.nodes[0];
    if (!area || !pathway || !node) return null;
    return { areaIndex, strand: pathway.strand, pathwayTitle: pathway.title, nodeTitle: node.title };
  }, [learningAreas, defaultAreaIndex]);

  function openStrand(areaIndex: number, strand: string) {
    const area = learningAreas[areaIndex];
    if (!area) return;
    setActiveIndex(areaIndex);
    setOpenStrandByArea((prev) => ({ ...prev, [area.learningArea]: strand }));
    requestAnimationFrame(() => {
      const heading = document.getElementById(`pathway-heading-${strand}`);
      heading?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      heading?.querySelector("button")?.focus();
    });
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % learningAreas.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + learningAreas.length) % learningAreas.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = learningAreas.length - 1;

    if (nextIndex !== null) {
      event.preventDefault();
      setActiveIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  if (yearLevel === null) {
    return (
      <EmptyPathwaysNotice message="We don't have a year level on file for your account yet, so we can't show your curriculum pathway. Ask a parent or teacher to add it in settings." />
    );
  }

  if (learningAreas.length === 0) {
    return (
      <EmptyPathwaysNotice
        message={`Year ${yearLevel} lessons haven't been published yet. Your pathway will appear here as soon as they are.`}
      />
    );
  }

  return (
    <div className="grid gap-5">
      {startHere && (
        <button
          type="button"
          onClick={() => openStrand(startHere.areaIndex, startHere.strand)}
          className="inline-flex w-fit min-h-11 items-center gap-2 rounded-full border border-mm-brand/30 bg-mm-tint px-4 text-sm font-bold text-mm-brand hover:bg-mm-tint-soft focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>
            Start here: {strandLabel(startHere.strand)} — {startHere.nodeTitle}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      <div
        role="tablist"
        aria-label="Learning area"
        className="flex gap-1 overflow-x-auto border-b border-mm-line"
      >
        {learningAreas.map((area, index) => {
          const selected = index === activeIndex;
          return (
            <button
              key={area.learningArea}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${tabsId}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={clsx(
                "min-h-11 shrink-0 whitespace-nowrap border-b-2 px-4 text-[15px] font-bold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand",
                selected
                  ? "border-mm-brand text-mm-brand"
                  : "border-transparent text-mm-muted hover:text-mm-ink",
              )}
            >
              {area.learningArea}
            </button>
          );
        })}
      </div>

      {learningAreas.map((area, index) => {
        const openStrand_ = openStrandByArea[area.learningArea] ?? null;
        return (
          <div
            key={area.learningArea}
            id={`${tabsId}-panel-${index}`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-tab-${index}`}
            hidden={index !== activeIndex}
            className="grid gap-4"
          >
            {area.pathways.length > 1 && (
              <>
                {/* Strand jump rail — desktop/tablet */}
                <div className="sticky top-[76px] z-10 -mx-1 hidden gap-2 overflow-x-auto border-b border-mm-line-soft bg-mm-page/95 px-1 py-2.5 backdrop-blur-sm sm:flex">
                  {area.pathways.map((pathway) => {
                    const isCurrent = openStrand_ === pathway.strand;
                    return (
                      <button
                        key={pathway.strand}
                        type="button"
                        onClick={() => openStrand(index, pathway.strand)}
                        aria-current={isCurrent ? "true" : undefined}
                        className={clsx(
                          "min-h-9 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand",
                          isCurrent
                            ? "border-mm-brand bg-mm-brand text-white"
                            : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand",
                        )}
                      >
                        {strandLabel(pathway.strand)}
                      </button>
                    );
                  })}
                </div>

                {/* Strand jump menu — mobile */}
                <label className="grid gap-1 sm:hidden">
                  <span className="text-xs font-bold uppercase tracking-wide text-mm-muted-2">
                    Jump to strand
                  </span>
                  <select
                    value={openStrand_ ?? ""}
                    onChange={(event) => openStrand(index, event.target.value)}
                    className="min-h-11 rounded-xl border border-mm-line bg-white px-3 text-[15px] font-semibold text-mm-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand"
                  >
                    {area.pathways.map((pathway) => (
                      <option key={pathway.strand} value={pathway.strand}>
                        {strandLabel(pathway.strand)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}

            <div className="grid gap-4">
              {area.pathways.map((pathway) => (
                <LessonPathwayList
                  key={pathway.strand}
                  pathway={pathway}
                  previewMode={false}
                  isOpen={openStrand_ === pathway.strand}
                  onToggle={() =>
                    setOpenStrandByArea((prev) => ({
                      ...prev,
                      [area.learningArea]: prev[area.learningArea] === pathway.strand ? null : pathway.strand,
                    }))
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
