import { Download, Brain } from "lucide-react";

interface ResourceStrip {
  icon: typeof Brain;
  title: string;
  description: string;
  actionLabel: string;
}

/**
 * "Editorial Learning Resource Strips" from the Stitch mock — a fictional
 * teacher's video series and a downloadable PDF pack. Neither exists in
 * this codebase; both marked coming-soon rather than dead links.
 */
const STRIPS: readonly ResourceStrip[] = [
  {
    icon: Brain,
    title: "Mathematical Reasoning Masterclasses",
    description:
      "Weekly 15-minute conceptual breakdowns targeting selective school and scholarship questions.",
    actionLabel: "Browse recordings",
  },
  {
    icon: Download,
    title: "Downloadable Concept Summary Sheets",
    description:
      "Printable revision cards covering arithmetic formulas, geometry definitions, and fractional conversions.",
    actionLabel: "Download PDF pack",
  },
];

export function LearningHubResourceStrips() {
  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {STRIPS.map((strip) => {
        const Icon = strip.icon;
        return (
          <div
            key={strip.title}
            className="flex items-start gap-4 rounded-2xl border border-mm-line bg-white p-5 shadow-warm-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-mm-tint text-primary">
              <Icon aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">{strip.title}</h4>
              <p className="text-xs text-mm-muted">{strip.description}</p>
              <button
                type="button"
                title={`${strip.actionLabel} (coming soon)`}
                aria-disabled="true"
                className="mt-1 inline-flex min-h-11 cursor-default items-center gap-1 text-xs font-semibold text-primary"
              >
                {strip.actionLabel}
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
