import { GraduationCap } from "lucide-react";

/**
 * Top banner for the Stitch-ported Learning Hub. The eyebrow curriculum tag
 * and "Term 2 Progress" chip have no backing calendar/version model (same
 * class as the dashboard's term/goal pills) — literal Stitch placeholder
 * text, flagged per this session's "pixel-match with placeholders" call.
 * Lesson/strand counts are the same real catalogue counts
 * CurriculumHubHeader used before this port.
 */
export function LearningHubHero({
  yearLevel,
  mathsLessonCount,
  englishLessonCount,
  strandCount,
}: {
  yearLevel: number | null;
  mathsLessonCount: number;
  englishLessonCount: number;
  strandCount: number;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
            <GraduationCap aria-hidden="true" className="h-4 w-4" />
            {/* Placeholder — no curriculum-version/jurisdiction model beyond the sidebar's static chip. */}
            NSW Syllabus Stage 3 · Australian Curriculum
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mm-ink">
            Learning Hub
          </h1>
          <p className="text-sm leading-relaxed text-mm-muted">
            Curriculum-aligned lessons, worked examples, and structured practice
            {yearLevel !== null ? ` for Year ${yearLevel}` : ""}.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-mm-line bg-white p-3 shadow-xs">
          <div className="px-3 py-1 text-left">
            <div className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink">
              {mathsLessonCount}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-mm-muted">Maths lessons</div>
          </div>
          <div className="h-8 w-px bg-mm-line" />
          <div className="px-3 py-1 text-left">
            <div className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink">
              {englishLessonCount}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-mm-muted">English lessons</div>
          </div>
          <div className="h-8 w-px bg-mm-line" />
          <div className="px-3 py-1 text-left">
            <div className="font-[family-name:var(--font-display)] text-xl font-bold text-primary">
              {strandCount}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-mm-muted">Active strands</div>
          </div>
        </div>
      </div>
    </section>
  );
}
