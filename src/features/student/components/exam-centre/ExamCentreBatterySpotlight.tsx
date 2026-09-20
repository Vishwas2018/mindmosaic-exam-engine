import { CheckCircle2, Hourglass, PlayCircle, RotateCw } from "lucide-react";

interface DomainCard {
  index: string;
  subject: string;
  focus: string;
  description: string;
  questionCount: number;
  status: "ready" | "completed" | "in_progress";
  statusLabel: string;
  actionLabel: string;
  icon: typeof PlayCircle;
}

const DOMAINS: readonly DomainCard[] = [
  {
    index: "Domain 01",
    subject: "Numeracy",
    focus: "Non-Calculator Section",
    description: "Arithmetic operations, mental fractions, spatial geometric relations, and numerical patterns without computational aids.",
    questionCount: 32,
    status: "ready",
    statusLabel: "40 mins · Ready to start",
    actionLabel: "Start paper",
    icon: PlayCircle,
  },
  {
    index: "Domain 02",
    subject: "Numeracy",
    focus: "Calculator Allowed",
    description: "Multi-step word problems, data interpretations from charts, scale measurement, and rate comparisons.",
    questionCount: 32,
    status: "completed",
    statusLabel: "Score: 30/32 correct (93.8%)",
    actionLabel: "Review paper",
    icon: CheckCircle2,
  },
  {
    index: "Domain 03",
    subject: "Reading Comprehension",
    focus: "Narrative, Informative & Poetry",
    description: "Literary analysis, text structure recognition, vocabulary inference, and authorial purpose deduction.",
    questionCount: 36,
    status: "in_progress",
    statusLabel: "Question 14 of 36 · 32m left",
    actionLabel: "Resume paper",
    icon: RotateCw,
  },
  {
    index: "Domain 04",
    subject: "Conventions of Language",
    focus: "Spelling, Grammar & Punctuation",
    description: "Identifying spelling anomalies, clause structures, punctuation rules, and tense consistency in complex passages.",
    questionCount: 45,
    status: "ready",
    statusLabel: "45 mins · Recommended prior to Reading test",
    actionLabel: "Start paper",
    icon: Hourglass,
  },
];

const STATUS_STYLES: Record<DomainCard["status"], string> = {
  ready: "border-mm-line bg-white text-mm-muted",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  in_progress: "border-mm-coral-text/30 bg-mm-coral-text/10 text-mm-coral-text",
};

/**
 * "NAPLAN Year 5 Simulation Battery" from the Stitch mock — a fixed,
 * illustrative example of what a multi-domain sitting looks like
 * (per-domain scores, in-progress state, autosave time). This codebase has
 * no concept of a multi-domain "battery": a real sitting is one paper with
 * one score (see AttemptSummary), not four linked domains sharing session
 * state. Entirely a preview, not a real or resumable session — every
 * action is coming-soon; the real equivalent action ("Set up a
 * simulation") is the hero button above.
 */
export function ExamCentreBatterySpotlight() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-mm-line bg-white p-6 shadow-warm-sm md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-mm-tint px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            Official ACARA format · Preview
          </span>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-mm-ink">
            NAPLAN Year 5 Simulation Battery
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-mm-muted">
            Four authenticated test domains calibrated to National Assessment Program guidelines.
            An illustrative example — not a real or resumable session.
          </p>
        </div>
        <span className="rounded-lg border border-mm-line bg-mm-page px-3 py-1.5 text-xs font-semibold text-mm-muted">
          Example: 1 / 4 complete · ~2h 15m
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DOMAINS.map((domain) => {
          const Icon = domain.icon;
          return (
            <div key={domain.index} className="flex flex-col gap-2 rounded-2xl border border-mm-line bg-mm-page/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mm-muted">{domain.index}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[domain.status]}`}>
                  {domain.statusLabel}
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
                {domain.subject} <span className="font-normal text-mm-muted">({domain.focus})</span>
              </h3>
              <p className="text-xs leading-relaxed text-mm-muted">{domain.description}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[11px] font-medium text-mm-muted">{domain.questionCount} questions</span>
                <button
                  type="button"
                  title={`${domain.actionLabel} (illustrative example)`}
                  aria-disabled="true"
                  className="inline-flex min-h-11 cursor-default items-center gap-1.5 rounded-btn border border-mm-line bg-white px-3 text-xs font-semibold text-mm-ink-soft"
                >
                  <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                  {domain.actionLabel}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
