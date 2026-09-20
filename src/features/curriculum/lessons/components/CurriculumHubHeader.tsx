import { BookMarked } from "lucide-react";

interface CurriculumHubHeaderProps {
  yearLevel: number | null;
  mathsLessonCount: number;
  englishLessonCount: number;
  strandCount: number;
}

/**
 * Breadcrumb strip + hero banner for the Curriculum Learn Hub. The three
 * stat tiles are catalogue counts (how many lessons/strands exist), never a
 * personal completion percentage — those live on Progress, not here.
 */
export function CurriculumHubHeader({
  yearLevel,
  mathsLessonCount,
  englishLessonCount,
  strandCount,
}: CurriculumHubHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-4">
      {/* Breadcrumb & syllabus context strip */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-container-low px-4 py-2">
        <div className="flex items-center gap-2 font-vietnam text-xs">
          <span className="font-semibold text-plum-muted">Curriculum Hub</span>
          <span className="text-parchment-border">/</span>
          <span className="font-semibold text-plum-dark">
            Victorian Curriculum F&ndash;10 v2.0 (ACARA v9.0 aligned)
          </span>
        </div>
        {yearLevel !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-tint px-2.5 py-1 font-vietnam text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Year {yearLevel} &middot; 2025 Syllabus Active
          </span>
        )}
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-primary/20 bg-white p-6 shadow-warm-card md:p-8">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gradient-to-br from-primary-tint/60 to-teal-light/40 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-lg bg-primary-tint px-3 py-1 font-jakarta text-xs font-bold uppercase tracking-wider text-primary">
              <BookMarked className="h-4 w-4" aria-hidden="true" />
              Scholastic Learning Directory
            </div>
            <h1 className="font-jakarta text-2xl font-extrabold tracking-tight text-plum-dark md:text-3xl">
              Curriculum Learning
            </h1>
            <p className="mt-2 font-vietnam text-plum-muted">
              {yearLevel === null
                ? "Structured, node-by-node Victorian Curriculum lessons — every strand and prerequisite stays freely accessible."
                : `Year ${yearLevel} curriculum pathway. Structured node-by-node explorations aligned to standard benchmark outcomes.`}
            </p>
          </div>

          {/* Factual catalogue tiles — counts only, no percentages */}
          <div className="flex shrink-0 items-center gap-2 rounded-xl bg-surface-container-low p-3">
            <div className="px-3 py-1 text-left">
              <div className="font-jakarta text-xl font-bold text-plum-dark">{mathsLessonCount}</div>
              <div className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-plum-muted">
                Maths lessons
              </div>
            </div>
            <div className="h-8 w-px bg-parchment-border" />
            <div className="px-3 py-1 text-left">
              <div className="font-jakarta text-xl font-bold text-plum-dark">{englishLessonCount}</div>
              <div className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-plum-muted">
                English lessons
              </div>
            </div>
            <div className="h-8 w-px bg-parchment-border" />
            <div className="px-3 py-1 text-left">
              <div className="font-jakarta text-xl font-bold text-primary">{strandCount}</div>
              <div className="font-vietnam text-[11px] font-semibold uppercase tracking-wider text-plum-muted">
                Active strands
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
