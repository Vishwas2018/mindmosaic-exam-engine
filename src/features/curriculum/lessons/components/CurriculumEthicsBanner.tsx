import { ShieldCheck } from "lucide-react";

/**
 * A statement of design principle, not a data claim — every sentence here
 * describes a real, verifiable property of this hub (no lesson is gated, no
 * streak is required to unlock content, no mastery figure is invented).
 */
export function CurriculumEthicsBanner() {
  return (
    <section className="pb-8 pt-4">
      <div className="flex flex-col items-start justify-between gap-5 rounded-2xl bg-surface-container-low p-6 md:flex-row md:items-center md:p-8">
        <div className="flex max-w-2xl items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-jakarta text-sm font-bold text-plum-dark">
              MindMosaic Learning Ethics Guarantee
            </h3>
            <p className="mt-1 font-vietnam text-sm leading-relaxed text-plum-muted">
              No locked lessons. No daily streak pressure. No opaque mastery scores. All content
              reflects the official Victorian Curriculum F&ndash;10 v2.0 and ACARA v9.0 guidelines,
              supporting patient student agency and open family visibility.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
