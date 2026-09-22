"use client";

import { useState } from "react";
import { BookOpen, Calculator, CheckCircle2 } from "lucide-react";
import type { LearningAreaPathwayGroup } from "../types";
import { CurriculumPathwaysPanel } from "./CurriculumPathwaysPanel";

interface SubjectExplorerProps {
  yearLevel: number | null;
  learningAreas: readonly LearningAreaPathwayGroup[];
}

function lessonCount(area: LearningAreaPathwayGroup): number {
  return area.pathways.reduce((sum, pathway) => sum + pathway.nodes.length, 0);
}

const STRAND_LABELS: Record<string, string> = {
  number: "Number",
  algebra: "Algebra",
  measurement: "Measurement",
  space: "Space",
  statistics: "Statistics",
  probability: "Probability",
  language: "Language & Grammar",
  literature: "Literature",
  literacy: "Reading & Literacy",
};

/**
 * Subject tabs (Mathematics / English) and responsive strand filter pills
 * over the authored curriculum pathways.
 */
export function SubjectExplorer({ yearLevel, learningAreas }: SubjectExplorerProps) {
  const [activeArea, setActiveArea] = useState<string | null>(learningAreas[0]?.learningArea ?? null);
  const [selectedStrand, setSelectedStrand] = useState<string>("all");

  if (learningAreas.length === 0) {
    return <CurriculumPathwaysPanel yearLevel={yearLevel} learningAreas={learningAreas} />;
  }

  const active = learningAreas.find((area) => area.learningArea === activeArea) ?? learningAreas[0];
  const other = learningAreas.find((area) => area.learningArea !== active.learningArea);
  const isMaths = active.learningArea === "Mathematics";

  const handleAreaChange = (areaName: string) => {
    setActiveArea(areaName);
    setSelectedStrand("all");
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        {/* Main Subject Segmented Control */}
        <div
          role="tablist"
          aria-label="Curriculum subject"
          className="inline-flex gap-1.5 rounded-2xl bg-surface-container-high p-1.5 shadow-inner"
        >
          {learningAreas.map((area) => {
            const isActive = area.learningArea === active.learningArea;
            return (
              <button
                key={area.learningArea}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleAreaChange(area.learningArea)}
                className={`flex items-center gap-2.5 rounded-xl px-5 py-3 font-jakarta text-sm font-bold transition-all ${
                  isActive
                    ? area.learningArea === "Mathematics"
                      ? "bg-white text-primary shadow-sm"
                      : "bg-white text-teal-accent shadow-sm"
                    : "text-plum-muted hover:text-plum-dark"
                }`}
              >
                {area.learningArea === "Mathematics" ? (
                  <Calculator className={`h-5 w-5 ${isActive ? "text-primary" : "text-plum-muted"}`} aria-hidden="true" />
                ) : (
                  <BookOpen className={`h-5 w-5 ${isActive ? "text-teal-accent" : "text-plum-muted"}`} aria-hidden="true" />
                )}
                <span>{area.learningArea}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-vietnam text-xs font-bold ${
                    isActive
                      ? area.learningArea === "Mathematics"
                        ? "bg-primary-tint text-primary"
                        : "bg-teal-light text-teal-accent"
                      : "bg-surface-container-highest text-plum-muted"
                  }`}
                >
                  {area.pathways.length} Strand{area.pathways.length === 1 ? "" : "s"} &middot; {lessonCount(area)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Scope note */}
        <div className="flex items-center gap-2 font-vietnam text-xs text-plum-muted md:text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-plum-muted" aria-hidden="true" />
          <span>Open pathway: all strands and prerequisites remain freely accessible.</span>
        </div>
      </div>

      {/* Quick-jump Strand Filter Pills */}
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        <span className="shrink-0 font-vietnam text-xs font-bold uppercase tracking-wider text-plum-muted pr-1">
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setSelectedStrand("all")}
          className={`shrink-0 rounded-full px-4 py-2 font-vietnam text-xs font-bold transition-all ${
            selectedStrand === "all"
              ? isMaths
                ? "bg-primary text-white shadow-sm"
                : "bg-teal-accent text-white shadow-sm"
              : "bg-surface-container text-plum-muted hover:bg-surface-container-high hover:text-plum-dark"
          }`}
        >
          All Strands ({active.pathways.length})
        </button>
        {active.pathways.map((pathway) => {
          const isPillActive = selectedStrand === pathway.strand;
          const label = STRAND_LABELS[pathway.strand] ?? pathway.strand;
          return (
            <button
              key={pathway.strand}
              type="button"
              onClick={() => setSelectedStrand(pathway.strand)}
              className={`shrink-0 rounded-full px-4 py-2 font-vietnam text-xs font-bold transition-all ${
                isPillActive
                  ? isMaths
                    ? "bg-primary text-white shadow-sm"
                    : "bg-teal-accent text-white shadow-sm"
                  : "bg-surface-container text-plum-muted hover:bg-surface-container-high hover:text-plum-dark"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <CurriculumPathwaysPanel
        yearLevel={yearLevel}
        learningAreas={[active]}
        selectedStrand={selectedStrand}
      />

      {other && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-surface-container-low p-6 md:flex-row">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                other.learningArea === "Mathematics" ? "bg-primary-tint text-primary" : "bg-teal-light text-teal-accent"
              }`}
            >
              {other.learningArea === "Mathematics" ? (
                <Calculator className="h-6 w-6" aria-hidden="true" />
              ) : (
                <BookOpen className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div>
              <h4 className="font-jakarta text-base font-bold text-plum-dark">
                Switching to {other.learningArea}?
              </h4>
              <p className="font-vietnam text-sm text-plum-muted">
                {lessonCount(other)} lessons ready across {other.pathways.length} strand
                {other.pathways.length === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAreaChange(other.learningArea)}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-parchment-border bg-white px-5 font-jakarta text-sm font-bold text-plum-dark shadow-warm-sm transition-colors hover:border-primary/40 hover:text-primary"
          >
            View {other.learningArea} directory
          </button>
        </div>
      )}
    </div>
  );
}
