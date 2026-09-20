import { CheckCircle2 } from "lucide-react";

/**
 * Top-of-page welcome strip from the Stitch mock: academic-session tag,
 * greeting, an interests/goal subtitle, and a curriculum-sync badge. The
 * greeting is real; session/interests/goal/sync text are placeholders with
 * no backing data model yet (see PR/plan notes) and should be wired up
 * before this is considered done.
 */
export function DashboardWelcomeBanner({
  firstName,
  yearLevel,
}: {
  firstName: string | null;
  yearLevel: number | null;
}) {
  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Academic session 2025–2026
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
          <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
          Curriculum Synchronised: NSW NESA Stage 3
        </span>
      </div>
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-mm-ink lg:text-3xl">
        {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      </h1>
      <p className="text-sm text-mm-muted">
        {yearLevel !== null ? `Year ${yearLevel}` : "Year level not set"} · Interests: Mathematics and English · Goal:
        NAPLAN preparation
      </p>
    </section>
  );
}
