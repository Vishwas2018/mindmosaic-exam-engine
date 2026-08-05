import { tutorials } from "../content";
import { EmptySlot, SectionHeading } from "./primitives";

/**
 * Walkthrough videos that do not exist yet. Every frame is a labelled
 * empty slot rather than a stock photo with a play button over it — the
 * section says "Videos to be supplied" and then shows exactly that, so
 * nothing here implies content the product does not have.
 */
export function Tutorials() {
  return (
    <section
      id="tutorials"
      aria-labelledby="tutorials-heading"
      className="border-t border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width">
        <SectionHeading
          id="tutorials-heading"
          eyebrow={tutorials.eyebrow}
          title={tutorials.heading}
          intro={tutorials.intro}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <div className="grid gap-[clamp(16px,1.8vw,24px)] lg:grid-cols-3">
          <div className="relative aspect-video max-h-[600px] w-full overflow-hidden rounded-[18px] border border-mm-line lg:col-span-3">
            <EmptySlot label={tutorials.feature.slot} />
            <span className="pointer-events-none absolute bottom-4 left-4 rounded-lg bg-white px-[11px] py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-mm-brand">
              {tutorials.feature.badge}
            </span>
          </div>

          {tutorials.items.map((item) => (
            <article key={item.title} className="overflow-hidden rounded-2xl border border-mm-line">
              <div className="relative aspect-video">
                <EmptySlot label={item.slot} />
              </div>
              <div className="grid gap-1.5 px-[18px] pb-[18px] pt-4">
                <h3 className="text-[16.5px] font-bold tracking-[-0.01em] text-mm-ink">{item.title}</h3>
                <p className="text-sm leading-[1.55] text-mm-muted">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
