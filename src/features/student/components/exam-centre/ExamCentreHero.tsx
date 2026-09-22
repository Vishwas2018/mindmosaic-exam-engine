import Link from "next/link";
import { ClipboardCheck, ShieldCheck } from "lucide-react";

/**
 * Top banner for the Stitch-ported Exam Centre. The eyebrow/term chip are
 * literal Stitch placeholder text (no term-calendar model, same class as
 * the dashboard's). The description keeps the real, previously-written
 * copy from this page's prior build ("nothing is scheduled...") rather
 * than the mock's fictional "Term 2 Mock Simulation Cycle" narrative,
 * because it is a true, more useful statement about how this product
 * actually works. The readiness tile is real: the same average of
 * `overview.mastery` shown in the "Readiness by subject" section below,
 * not the mock's fabricated "Cohort Preparedness" figure — there is no
 * cohort/class-comparison data in this codebase.
 */
export function ExamCentreHero({ averageReadiness }: { averageReadiness: number | null }) {
  return (
    <section className="flex flex-col justify-between gap-6 rounded-3xl border border-mm-line bg-white p-6 shadow-warm-sm md:flex-row md:items-center md:p-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
          Assessment environment
        </span>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-mm-ink">
          Exam Centre
        </h1>
        <p className="text-sm leading-relaxed text-mm-muted">
          Nothing is scheduled — a simulation starts when you do. Choose a format, year level and
          length, and the paper starts immediately under exam conditions.
        </p>
        <Link
          href="/practice?timing=timed"
          className="mt-1 inline-flex h-11 w-fit items-center rounded-btn bg-primary px-6 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(89,37,168,0.28)] transition-colors hover:bg-primary-hover"
        >
          Set up a simulation
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-mm-line bg-mm-page/70 p-5">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck aria-hidden="true" className="h-7 w-7 text-primary" />
        </div>
        <div>
          <div className="font-[family-name:var(--font-display)] text-2xl font-bold text-mm-ink">
            {averageReadiness === null ? "—" : `${averageReadiness}%`}
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-mm-muted">
            Your readiness (avg. mastery)
          </div>
        </div>
      </div>
    </section>
  );
}
