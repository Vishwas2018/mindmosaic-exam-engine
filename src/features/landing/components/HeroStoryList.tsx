import Image from "next/image";

import { hero } from "../content";
import { heroScenePreviews } from "../hero-previews";
import { HERO_SCENE_IDS, landingMedia, resolveSlotSrc } from "../media";

/**
 * Chapter 1 without the pinned stage: phones, tablets and reduced motion. Scene 1 is the hero band
 * above; this is scenes 2 to 6 in order, each with its own eyebrow, headline, paragraph and a 16:10
 * crop of its photograph, so every message is readable without any scroll-linked motion. Hidden (and
 * so never fetched: the photographs are lazy) while the pinned stage is in use.
 *
 * Bottom padding clears the fixed Start free / Explore programs bar.
 */
export function HeroStoryList({ className = "" }: { className?: string }) {
  return (
    <div className={`mm-width flex-col gap-[clamp(40px,6vw,72px)] pb-[88px] pt-[clamp(24px,4vw,40px)] ${className}`}>
      {hero.scenes.slice(1).map((scene, offset) => {
        const index = offset + 1;
        const id = HERO_SCENE_IDS[index]!;
        const slot = landingMedia.chapter1.scenes[id];
        return (
          <article
            key={scene.id}
            aria-labelledby={`hero-story-${scene.id}`}
            className="grid items-center gap-[clamp(16px,3vw,48px)] border-t border-mm-line pt-[clamp(24px,4vw,40px)] md:grid-cols-2"
          >
            <div className="flex flex-col gap-2">
              <p className="m-0 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.14em]">
                <span className="tabular-nums text-mm-coral-text">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-mm-brand">{scene.label}</span>
              </p>
              <h2
                id={`hero-story-${scene.id}`}
                className="m-0 text-[clamp(28px,3.6vw,40px)] leading-[1.1] tracking-[-0.03em] text-mm-ink"
              >
                <span className="block">{scene.headline[0]}</span>
                <span className="block text-mm-brand">{scene.headline[1]}</span>
              </h2>
              <p className="m-0 mt-1.5 text-pretty text-[16px] leading-[1.6] text-mm-ink-soft">{scene.body}</p>
            </div>
            <div
              aria-hidden="true"
              style={{ backgroundImage: `url(${heroScenePreviews[id]})` }}
              className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-mm-tint-line bg-cover bg-center"
            >
              <Image
                src={resolveSlotSrc(slot)}
                alt={slot.alt}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                quality={75}
                style={{ objectPosition: slot.focalMobile }}
                className="object-cover"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
