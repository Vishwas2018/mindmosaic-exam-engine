import { CheckCircle2, Clock, GraduationCap } from "lucide-react";

import { ConceptSection } from "@/features/curriculum/lessons/components/ConceptSection";
import { WorkedExampleStepper } from "@/features/curriculum/lessons/components/WorkedExampleStepper";
import { LEVEL_3_NUMBER_LESSONS } from "@/features/curriculum/lessons/content/level-3-number";
import type { ConceptSection as ConceptSectionData, WorkedExampleSection } from "@/features/curriculum/lessons/schema";

import { StudentHeader } from "./chrome";

/**
 * The published "Unit Fractions" lesson as /student/learn/lessons/VC2M3N03 shows it: the lesson header, then the
 * real concept and worked-example components with that lesson's own text. Only the concept's opening paragraph and
 * first two key terms are shown, so the picture, the part that explains the idea, is on screen.
 */
const LESSON = LEVEL_3_NUMBER_LESSONS.find((lesson) => lesson.curriculumCode === "VC2M3N03")!;
const CONCEPT = LESSON.sections.find((section): section is ConceptSectionData => section.kind === "concept")!;
const EXAMPLE = LESSON.sections.find((section): section is WorkedExampleSection => section.kind === "worked_example")!;
const PREVIEW_CONCEPT: ConceptSectionData = {
  ...CONCEPT,
  explanation: CONCEPT.explanation.split("\n\n")[0]!,
  keyTerms: CONCEPT.keyTerms?.slice(0, 2),
};

export function CurriculumPreview() {
  return (
    <div className="flex h-full flex-col bg-page">
      <StudentHeader active="learn" />
      <div className="grid min-h-0 flex-1 grid-cols-2 items-start gap-4 overflow-hidden px-6 py-5">
        <div className="flex min-w-0 flex-col gap-4">
          <header className="overflow-hidden rounded-2xl border border-parchment-border bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase text-plum-muted">
              <span className="font-mono text-primary">{LESSON.curriculumCode}</span>
              <span>•</span>
              <span>{LESSON.level}</span>
              <span>•</span>
              <span className="capitalize">{LESSON.strand}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {LESSON.estimatedMinutes} mins
              </span>
            </div>
            <p className="m-0 mt-2 font-jakarta text-[22px] font-extrabold leading-tight tracking-tight text-plum-dark">{LESSON.title}</p>
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary-tint/60 p-4">
              <div className="flex items-center gap-2 text-[13px] font-bold text-primary">
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
                <span className="uppercase tracking-wider">Learning Intention</span>
              </div>
              <p className="m-0 mt-1.5 text-[14px] font-semibold leading-snug text-plum-dark">{LESSON.learningIntention}</p>
              <div className="mt-3 border-t border-parchment-border/60 pt-3">
                <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-plum-muted">Success Criteria:</p>
                <ul className="m-0 mt-1.5 grid list-none gap-1.5 p-0 text-[12.5px] leading-snug text-plum-muted">
                  {LESSON.successCriteria.map((criterion) => (
                    <li key={criterion} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </header>
          <WorkedExampleStepper section={EXAMPLE} />
        </div>
        <div className="min-w-0">
          <ConceptSection section={PREVIEW_CONCEPT} />
        </div>
      </div>
    </div>
  );
}
