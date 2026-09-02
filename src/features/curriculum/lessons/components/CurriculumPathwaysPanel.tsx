"use client";

import { Calculator, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { LessonPathway } from "../types";
import { LessonPathwayList } from "./LessonPathwayList";

const MATHS_STRANDS = new Set(["number", "algebra", "measurement", "space", "statistics", "probability"]);
const ENGLISH_STRANDS = new Set(["language", "literature", "literacy"]);

interface LearningAreaSectionProps {
  title: string;
  level: string;
  pathways: readonly LessonPathway[];
  icon: React.ReactNode;
  defaultOpen?: boolean;
}

function LearningAreaSection({
  title,
  level,
  pathways,
  icon,
  defaultOpen = false,
}: LearningAreaSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const totalLessons = pathways.reduce((acc, p) => acc + p.nodes.length, 0);

  if (pathways.length === 0) return null;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-mm-line bg-white p-5 text-left shadow-sm transition-colors hover:border-mm-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mm-brand sm:p-6"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-mm-brand/10 text-mm-brand">
            {icon}
          </span>
          <div>
            <h2 className="text-[18px] font-bold text-mm-ink group-hover:text-mm-brand transition-colors">
              {title}
            </h2>
            <p className="text-[13.5px] text-mm-muted">
              {level} · {pathways.length} pathways · {totalLessons} lessons
            </p>
          </div>
        </div>
        <span className="flex-none text-mm-muted group-hover:text-mm-brand transition-colors" aria-hidden="true">
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>

      {open && (
        <div className="mt-4 grid gap-6 pl-0 sm:pl-2">
          {pathways.map((pathway) => (
            <LessonPathwayList key={`${pathway.level}-${pathway.strand}`} pathway={pathway} />
          ))}
        </div>
      )}
    </section>
  );
}

interface CurriculumPathwaysPanelProps {
  pathways: readonly LessonPathway[];
  yearLevel: number | null;
}

/**
 * Renders all curriculum pathways for a student's year level, grouped by
 * learning area (Mathematics and English). Each area is collapsible.
 *
 * Receives pathways from the server component via getCurriculumPathwaysForYearLevel().
 */
export function CurriculumPathwaysPanel({ pathways, yearLevel }: CurriculumPathwaysPanelProps) {
  const mathsPathways = pathways.filter((p) => MATHS_STRANDS.has(p.strand));
  const englishPathways = pathways.filter((p) => ENGLISH_STRANDS.has(p.strand));

  if (pathways.length === 0) {
    return (
      <div className="rounded-2xl border border-mm-line bg-white p-8 text-center">
        <p className="text-[15px] font-semibold text-mm-ink">
          {yearLevel === null
            ? "No year level set for your account."
            : `Curriculum pathways for Year ${yearLevel} are not yet available.`}
        </p>
        <p className="mt-2 text-[14px] text-mm-muted">
          {yearLevel === null
            ? "Ask a parent or teacher to update your profile."
            : "Check back soon — more year levels are being added."}
        </p>
      </div>
    );
  }

  const level = pathways[0]?.level ?? "";

  return (
    <div className="grid gap-5">
      <LearningAreaSection
        title="Mathematics"
        level={level}
        pathways={mathsPathways}
        icon={<Calculator className="h-5 w-5" aria-hidden="true" />}
        defaultOpen={true}
      />
      <LearningAreaSection
        title="English"
        level={level}
        pathways={englishPathways}
        icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
        defaultOpen={true}
      />
    </div>
  );
}
