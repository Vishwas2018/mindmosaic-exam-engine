import { BookOpen, GraduationCap } from "lucide-react";
import type { CurriculumYearPathways } from "../types";
import { LessonPathwayList } from "./LessonPathwayList";

interface CurriculumPathwaysPanelProps {
  pathways: CurriculumYearPathways;
}

export function CurriculumPathwaysPanel({ pathways }: CurriculumPathwaysPanelProps) {
  if (pathways.learningAreas.length === 0 || pathways.level === null) {
    return (
      <section aria-labelledby="lesson-list-heading" className="grid gap-4">
        <div>
          <h2
            id="lesson-list-heading"
            className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink"
          >
            Curriculum lessons
          </h2>
          <p className="mt-1.5 text-[15px] leading-[1.55] text-mm-muted">
            Lessons are organised for students in Years 3 and 5.
          </p>
        </div>

        <div className="rounded-[18px] border border-mm-line bg-white p-[clamp(20px,3vw,32px)]">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mm-tint text-mm-brand">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-[17px] font-bold text-mm-ink">Year level needed</h3>
              <p className="mt-1 text-[14.5px] leading-[1.6] text-mm-muted">
                We cannot select a curriculum pathway until your profile has a supported year
                level. Ask your parent or teacher to check your profile year level.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="lesson-list-heading" className="grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2
            id="lesson-list-heading"
            className="text-[clamp(20px,2vw,26px)] font-bold text-mm-ink"
          >
            {pathways.level} curriculum lessons
          </h2>
          <p className="mt-1.5 max-w-3xl text-[15px] leading-[1.55] text-mm-muted">
            All {pathways.lessonCount} published lessons, organised by learning area and Victorian
            Curriculum strand. Open every lesson here; online practice appears only where verified
            questions are available.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-[clamp(18px,2vw,28px)] xl:grid-cols-2">
        {pathways.learningAreas.map((area) => (
          <section
            key={area.id}
            aria-labelledby={`learning-area-${area.id}`}
            className="grid gap-5 rounded-[20px] border border-mm-line bg-mm-page p-[clamp(14px,1.8vw,22px)]"
          >
            <div className="flex items-center justify-between gap-4 border-b border-mm-line pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mm-brand text-white">
                  <GraduationCap className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-mm-brand">
                    Learning area
                  </p>
                  <h3 id={`learning-area-${area.id}`} className="text-xl font-bold text-mm-ink">
                    {area.title}
                  </h3>
                </div>
              </div>
              <span className="rounded-full border border-mm-line bg-white px-3 py-1 text-xs font-bold text-mm-ink-soft">
                {area.lessonCount} lessons
              </span>
            </div>

            <div className="grid gap-6">
              {area.pathways.map((pathway) => (
                <LessonPathwayList
                  key={`${area.id}-${pathway.strand}`}
                  pathway={pathway}
                  previewMode={false}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}
