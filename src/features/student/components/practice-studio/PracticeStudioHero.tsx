import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

interface DisciplinePill {
  label: string;
  href: string | null;
}

/**
 * Top banner + discipline filter row for the Stitch-ported Practice Studio.
 * "All Disciplines"/"Mathematics"/"English Language" are real links into
 * the public catalogue's own filter query params (grade + subject —
 * src/features/catalogue/filter-state.ts), scoped to the student's real
 * year level. "Thinking Skills & Logic" has no subject key in that
 * vocabulary — no question bank exists for it — so it's marked coming-soon
 * rather than a filter that would silently reset to "all". The
 * tier/pacing chip is decorative, unbacked by any difficulty-tier model.
 */
export function PracticeStudioHero({ effectiveYear }: { effectiveYear: number }) {
  const disciplines: readonly DisciplinePill[] = [
    { label: "All Disciplines", href: "/practice" },
    { label: "Mathematics", href: `/practice?subject=numeracy&grade=${effectiveYear}` },
    { label: "English Language", href: `/practice?subject=language&grade=${effectiveYear}` },
    { label: "Thinking Skills & Logic", href: null },
  ];

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-mm-line bg-white p-6 shadow-warm-sm md:p-8">
      <div className="flex flex-col gap-1.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles aria-hidden="true" className="h-4 w-4" />
          Adaptive studio · Year {effectiveYear} scholar pathway
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mm-ink">
          Practice Studio
        </h1>
        <p className="text-sm leading-relaxed text-mm-muted">
          Targeted skill drills and mental speed challenges across Mathematics and English.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {disciplines.map((d) =>
          d.href ? (
            <Link
              key={d.label}
              href={d.href}
              className="flex min-h-11 items-center rounded-full border border-mm-line bg-white px-4 text-xs font-semibold text-mm-ink-soft transition-colors hover:border-primary/40 hover:text-primary"
            >
              {d.label}
            </Link>
          ) : (
            <button
              key={d.label}
              type="button"
              title={`${d.label} (no question bank yet)`}
              aria-disabled="true"
              className="flex min-h-11 cursor-default items-center rounded-full border border-mm-line bg-mm-page px-4 text-xs font-semibold text-mm-muted"
            >
              {d.label}
            </button>
          ),
        )}
        {/* Placeholder — no difficulty-tier model exists. */}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-mm-tint px-3 py-1.5 text-[11px] font-semibold text-primary">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          Adaptive pacing active
        </span>
      </div>
    </section>
  );
}
