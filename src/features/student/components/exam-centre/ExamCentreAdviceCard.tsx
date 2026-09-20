import { Coffee, Flag, VolumeX } from "lucide-react";

const TIPS = [
  { icon: VolumeX, title: "Quiet space", body: "Minimise distractions" },
  { icon: Flag, title: "Flag & review", body: "Check before submission" },
  { icon: Coffee, title: "5-min breather", body: "Rest between domains" },
];

/**
 * "Calm Assessment Readiness" tips from the Stitch mock — generic study
 * advice, not a data claim, so no placeholder marking needed.
 */
export function ExamCentreAdviceCard() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-mm-line bg-mm-page/60 p-6">
      <h3 className="font-[family-name:var(--font-display)] text-sm font-bold text-mm-ink">
        Calm assessment readiness
      </h3>
      <p className="text-sm text-mm-muted">
        Authentic simulations replicate exam conditions without unnecessary stress. Focus on deep
        comprehension and pacing rather than sheer velocity.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIPS.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className="flex items-center gap-2.5 rounded-xl bg-white p-3 shadow-xs">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mm-tint text-primary">
                <Icon aria-hidden="true" className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-mm-ink">{tip.title}</p>
                <p className="text-[11px] text-mm-muted">{tip.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
