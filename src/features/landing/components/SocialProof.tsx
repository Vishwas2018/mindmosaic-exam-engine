"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { educators, testimonials } from "../content";
import { AvatarInitial, ImageSlot, LpCard, SectionHeading } from "./primitives";

/**
 * `brand/images/asset-map.json` marks the source photos behind this
 * carousel "flagged" (real faces, no consent on file) — `educators.enabled`
 * (see content.ts) is `false`, so this never renders on the live page.
 * Built pixel-per-mockup-1 anyway so turning the flag on is the only step
 * once every person below is real, named and consenting.
 */
export function Educators() {
  const trackRef = useRef<HTMLUListElement>(null);
  if (!educators.enabled) return null;

  function scrollBy(direction: 1 | -1) {
    trackRef.current?.scrollBy({ left: direction * 280, behavior: "smooth" });
  }

  return (
    <section aria-labelledby="educators-heading" className="border-y border-brand/10 bg-white py-16 sm:py-24">
      <div className="site-width">
        <SectionHeading
          id="educators-heading"
          eyebrow="Our team"
          title={`${educators.heading[0]}${educators.heading[1]}`}
          intro={educators.subheading}
          align="center"
        />
        <div className="relative mt-10">
          <button
            type="button"
            aria-label="Previous educator"
            onClick={() => scrollBy(-1)}
            className="absolute -left-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/15 bg-white shadow-md sm:flex"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5 text-brand" />
          </button>
          <ul ref={trackRef} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2">
            {educators.people.map((person) => (
              <li key={person.name} className="w-44 shrink-0 snap-start text-center">
                <ImageSlot aspectW={1} aspectH={1} className="mx-auto w-32 rounded-full">
                  <Image src={person.image} alt="" fill sizes="128px" loading="lazy" className="rounded-full object-cover" />
                </ImageSlot>
                <p className="mt-3 font-display text-sm font-bold text-lp-ink">{person.name}</p>
                <p className="text-xs font-semibold text-lp-muted">{person.role}</p>
              </li>
            ))}
          </ul>
          <button
            type="button"
            aria-label="Next educator"
            onClick={() => scrollBy(1)}
            className="absolute -right-4 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-brand/15 bg-white shadow-md sm:flex"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5 text-brand" />
          </button>
        </div>
      </div>
    </section>
  );
}

/**
 * `testimonials.enabled` is a tri-state (see content.ts): `false` (hidden —
 * the live default), `"placeholder"` (visible with AvatarInitial instead of
 * a real photo, quotes clearly marked illustrative), or `true` (real,
 * consented reviews only). Never renders real donor photos as "reviews".
 */
export function Testimonials() {
  if (!testimonials.enabled) return null;
  const usePlaceholderAvatars = testimonials.enabled === "placeholder";

  return (
    <section aria-labelledby="testimonials-heading" className="site-width py-16 sm:py-24">
      <SectionHeading id="testimonials-heading" eyebrow="Community" title={testimonials.heading} intro={testimonials.subheading} align="center" />
      {usePlaceholderAvatars && (
        <p className="mx-auto mt-4 max-w-lg text-center text-xs font-semibold text-lp-muted">{testimonials.disclaimer}</p>
      )}
      <ul className="mt-10 grid gap-5 sm:grid-cols-3">
        {testimonials.items.map((item) => (
          <li key={item.name}>
            <LpCard className="flex h-full flex-col p-6">
              <p className="font-display text-3xl leading-none text-brand/30">&ldquo;</p>
              <blockquote className="mt-1 flex-1 text-sm leading-6 text-lp-ink">{item.quote}</blockquote>
              <footer className="mt-5 flex items-center gap-3 border-t border-brand/8 pt-4">
                <ImageSlot aspectW={1} aspectH={1} className="h-10 w-10 shrink-0 rounded-full">
                  {usePlaceholderAvatars ? (
                    <AvatarInitial name={item.name} />
                  ) : (
                    <Image src={item.avatar} alt="" fill sizes="40px" loading="lazy" className="rounded-full object-cover" />
                  )}
                </ImageSlot>
                <div>
                  <p className="text-xs font-extrabold text-lp-ink">{item.name}</p>
                  <p className="text-xs font-semibold text-lp-muted">{item.role}</p>
                </div>
              </footer>
            </LpCard>
          </li>
        ))}
      </ul>
    </section>
  );
}
