import Link from "next/link";
import { ArrowRight, BookOpen, Calculator, PieChart, Puzzle, SpellCheck2, Workflow } from "lucide-react";

interface DrillModule {
  icon: typeof Calculator;
  masteryPercent: number;
  title: string;
  description: string;
  tags: readonly string[];
  actionLabel: string;
  href: string | null;
}

/**
 * "Curriculum Drill Modules" from the Stitch mock. Real: each card's CTA
 * routes to the closest matching real catalogue program (grade + subject
 * query params), reusing the same real destinations Exam Centre's format
 * cards use — except "Thinking Skills & Logic", which has no bank
 * (mirrors AMC-style/selective entry-style on Exam Centre). Placeholder:
 * the per-module mastery percentage and the little diagnostic visuals —
 * this codebase tracks mastery per subject, not per fine-grained drill
 * category, so these numbers have no real source (same class of gap as
 * My Progress's mastery board, which uses real subject-level bars instead
 * of inventing this granularity).
 */
function buildDrillModules(effectiveYear: number): readonly DrillModule[] {
  return [
    {
      icon: Calculator,
      masteryPercent: 88,
      title: "Arithmetic & Mental Maths",
      description: "Fast-paced integer computations, long division shortcuts, and order of operations.",
      tags: ["Rapid multiplication", "Remainders", "Percentage basics"],
      actionLabel: "Practise arithmetic",
      href: `/practice?subject=numeracy&grade=${effectiveYear}&style=naplan_style`,
    },
    {
      icon: PieChart,
      masteryPercent: 74,
      title: "Fractions, Decimals & Percentages",
      description: "Equivalence models, improper conversions, decimal ordering, and discount calculations.",
      tags: ["Equivalence", "Decimal conversions", "Recurring fractions"],
      actionLabel: "Practise fractions & decimals",
      href: `/practice?subject=numeracy&grade=${effectiveYear}&style=icas_style`,
    },
    {
      icon: Workflow,
      masteryPercent: 79,
      title: "Problem Solving & Word Problems",
      description: "Multi-step word problems applying bar models, rate calculations, and proportional reasoning.",
      tags: ["Unitary method", "Ratio scenarios", "Speed-distance"],
      actionLabel: "Solve problems",
      href: `/practice?subject=numeracy&grade=${effectiveYear}&style=icas_style`,
    },
    {
      icon: SpellCheck2,
      masteryPercent: 92,
      title: "Grammar, Punctuation & Cloze",
      description: "Complex sentence structures, relative clauses, active vs passive voice, and cloze passages.",
      tags: ["Relative clauses", "Apostrophes", "Selective cloze"],
      actionLabel: "Start language drill",
      href: `/practice?subject=language&grade=${effectiveYear}&style=naplan_style`,
    },
    {
      icon: BookOpen,
      masteryPercent: 81,
      title: "Reading Comprehension Quick Drills",
      description: "Bite-sized literary excerpts focusing on character inference, nuance, and text evidence.",
      tags: ["Inference", "Author intent", "Tone identification"],
      actionLabel: "Practise comprehension",
      href: `/practice?subject=reading&grade=${effectiveYear}&style=naplan_style`,
    },
    {
      icon: Puzzle,
      masteryPercent: 79,
      title: "Thinking Skills & Logic",
      description: "Venn syllogisms, sequence reasoning, critical path analysis, and identifying logical fallacies.",
      tags: ["Syllogisms", "Deduction", "Grid logic"],
      actionLabel: "Solve logic puzzles",
      href: null,
    },
  ];
}

export function PracticeStudioDrillModules({ effectiveYear }: { effectiveYear: number }) {
  const modules = buildDrillModules(effectiveYear);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-mm-ink tracking-tight">
          Curriculum drill modules
        </h2>
        <span className="text-xs font-semibold text-mm-muted">{modules.length} modules</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          const content = (
            <>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mm-tint text-primary">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                {/* Placeholder — no per-drill-category mastery tracking exists. */}
                <span className="rounded-full bg-mm-page px-2 py-0.5 text-[11px] font-semibold text-mm-muted">
                  Example mastery: {module.masteryPercent}%
                </span>
              </div>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                {module.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-mm-muted">{module.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {module.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-mm-line bg-white px-2 py-0.5 text-[10px] font-medium text-mm-muted">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 border-t border-mm-line/60 pt-3 text-xs font-semibold text-primary">
                {module.actionLabel}
                <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
              </div>
            </>
          );

          if (module.href) {
            return (
              <Link
                key={module.title}
                href={module.href}
                className="flex flex-col rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm transition-colors hover:border-primary/40"
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={module.title}
              type="button"
              title={`${module.actionLabel} (no question bank yet)`}
              aria-disabled="true"
              className="flex cursor-default flex-col rounded-2xl border border-mm-line bg-white p-5 text-left shadow-warm-sm"
            >
              {content}
            </button>
          );
        })}
      </div>
    </section>
  );
}
