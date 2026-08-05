import { evidence } from "../content";
import { Section } from "./primitives";

/**
 * Three hatched placeholder panels marking exactly where verified
 * testimonials, platform figures and author credentials will sit. This
 * section exists so the page can be honest about not having them yet
 * instead of quietly inventing social proof — do not replace a panel
 * until the material named in its `requirement` line actually exists.
 */
export function Evidence() {
  if (!evidence.enabled) return null;

  return (
    <Section tone="page" labelledBy="evidence-heading">
      <div className="mb-[clamp(22px,2.2vw,30px)] flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[660px]">
          <p className="mb-3.5 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">{evidence.eyebrow}</p>
          <h2
            id="evidence-heading"
            className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {evidence.heading}
          </h2>
        </div>
        <p className="max-w-[400px] text-[14.5px] leading-[1.6] text-mm-muted">{evidence.intro}</p>
      </div>

      <div className="grid gap-[clamp(18px,2vw,28px)] lg:grid-cols-3">
        {evidence.panels.map((panel) => (
          <div
            key={panel.label}
            className="grid content-start gap-3 rounded-2xl border-2 border-dashed border-mm-lilac bg-[repeating-linear-gradient(135deg,#fff_0_12px,#fbf8fe_12px_24px)] px-6 py-[26px]"
          >
            <p className="font-mono text-[11.5px] font-semibold uppercase tracking-[0.06em] text-mm-brand">
              {panel.label}
            </p>
            <p className="text-[15.5px] font-semibold leading-[1.55] text-mm-ink">{panel.title}</p>
            <p className="text-[13.5px] leading-[1.55] text-mm-muted">{panel.requirement}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
