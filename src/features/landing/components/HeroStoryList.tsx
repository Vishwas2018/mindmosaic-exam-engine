import type { CSSProperties } from "react";
import Image from "next/image";

import { hero } from "../content";
import { landingMedia, resolveSlotSrc } from "../media";

/**
 * The six story beats as ordinary content, for phones, tablets and reduced motion
 * (the pinned scroll-driven stage hides this list). Compact on purpose: a small
 * photograph, the scene name and its phrase per row, no pinning, no animation, and
 * no photograph beyond a thumbnail loaded until it nears the screen.
 *
 * Photographs come from the same registry slots as the pinned stage, in the same
 * order, so a swapped picture changes in both places at once.
 */
export function HeroStoryList({ className = "" }: { className?: string }) {
  return (
    <ol
      aria-label="Six ways MindMosaic helps"
      className={`mm-width m-0 list-none gap-x-4 gap-y-3 p-0 pb-[clamp(28px,6vw,56px)] pt-2 ${className}`}
    >
      {hero.scenes.map((scene, index) => {
        const slot = landingMedia.chapter1.scenes[landingMedia.chapter1.sceneOrder[index]!];
        return (
          <li key={scene.id} className="flex items-center gap-3.5 sm:flex-col sm:items-start sm:gap-2.5">
            <span
              aria-hidden={slot.decorative ? "true" : undefined}
              className="relative block aspect-[16/10] w-[104px] shrink-0 overflow-hidden rounded-xl bg-mm-tint sm:w-full"
            >
              <Image
                src={resolveSlotSrc(slot)}
                alt={slot.alt}
                fill
                sizes="(min-width: 1280px) 15vw, (min-width: 640px) 45vw, 104px"
                quality={75}
                style={
                  { "--pos-m": slot.focalMobile, "--pos-t": slot.focalTablet } as CSSProperties
                }
                className="object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-t)]"
              />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-mm-brand">
                {String(index + 1).padStart(2, "0")} · {scene.label}
              </span>
              <span className="text-[14.5px] font-medium leading-snug text-mm-ink-soft">{scene.phrase}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
