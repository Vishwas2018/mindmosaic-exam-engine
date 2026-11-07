import { Sparkles } from "lucide-react";

/**
 * Top hero for Practice Studio (/student/practice).
 * Honest, uninflated greeting: first visit vs returning student.
 * No fake "Adaptive pacing active" or difficulty tier chips.
 */
export function PracticeStudioHero({
  yearLevel,
  isFirstVisit,
}: {
  yearLevel: 3 | 5;
  isFirstVisit: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-mm-line bg-white p-6 shadow-xs md:p-8">
      <div className="flex flex-col gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-mm-tint-line bg-mm-tint px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Year {yearLevel} practice
          </span>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink md:text-3xl">
          Practice Studio
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-mm-muted">
          {isFirstVisit
            ? "Welcome to Practice Studio. Targeted skill drills across Mathematics and English. Choose a topic below to start your first set."
            : "Targeted skill drills across Mathematics and English. Practice sets are untimed drills — answers are not saved as you go."}
        </p>
      </div>
    </section>
  );
}
