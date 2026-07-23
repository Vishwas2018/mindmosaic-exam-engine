import { ShieldCheck } from "lucide-react";

import { problems, productIntro } from "../content";
import { ImageSlot, LpCard, MosaicAccentArt, SectionHeading } from "./primitives";

const whoTone: Record<string, string> = {
  Child: "bg-brand/8 text-brand",
  Parent: "bg-accent/10 text-accent-strong",
  Both: "bg-brand-ink/8 text-brand-ink",
};

export function Problems() {
  return (
    <section
      aria-labelledby="problems-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <SectionHeading
        id="problems-heading"
        eyebrow="The practice problem"
        title={problems.heading}
        intro={problems.intro}
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {problems.items.map((item) => (
          <LpCard key={item.title} className="p-6">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[0.7rem] font-extrabold uppercase tracking-wide ${whoTone[item.who]}`}
            >
              {item.who === "Both" ? "Child + parent" : item.who}
            </span>
            <h3 className="mt-4 font-display text-lg font-bold tracking-[-0.02em] text-lp-ink">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-lp-muted">{item.body}</p>
          </LpCard>
        ))}
      </div>
    </section>
  );
}

export function ProductIntro() {
  return (
    <section
      id="product"
      aria-labelledby="product-heading"
      className="scroll-mt-24 border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div>
          <SectionHeading
            id="product-heading"
            eyebrow="What MindMosaic is"
            title={productIntro.heading}
          />
          <div className="mt-6 space-y-5 text-base leading-8 text-lp-muted">
            {productIntro.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="lg:pt-16">
          {/*
           * Reserved imagery slot (see brand/imagery-guidelines.md): original
           * gradient/mosaic-tile art today, sized to swap for a licensed
           * photo of the real product later with zero layout shift.
           */}
          <ImageSlot aspectW={16} aspectH={7} className="rounded-3xl">
            <MosaicAccentArt gradientId="product-intro-accent" />
          </ImageSlot>
          <div className="mt-6 rounded-3xl bg-brand-ink p-8 text-white shadow-[0_30px_70px_rgba(42,16,81,0.35)]">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <ShieldCheck aria-hidden="true" className="h-6 w-6 text-white" />
            </span>
            <h3 className="mt-5 font-display text-2xl font-bold tracking-[-0.02em]">
              {productIntro.originality.title}
            </h3>
            <p className="mt-3 leading-7 text-white/75">
              {productIntro.originality.body}
            </p>
            <ul className="mt-6 space-y-2 text-sm font-semibold text-white/85">
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                No official past-paper questions
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                No textbook or website reproductions
              </li>
              <li className="flex gap-2.5">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                No commercial question-bank imports
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
