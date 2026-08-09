import Image from "next/image";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import type { HubCategory, HubMedia as HubMediaContent } from "../content";
import { hubCategory, TONE_PLATE, TONE_RULE } from "./hub-presentation";

/**
 * The picture on a guide — a photographed still life where one exists, and
 * the guide's own category plate where one does not.
 *
 * The fallback matters more than it looks like it should. Nine of the
 * library's entries are commissioned briefs rather than written guides, and
 * the screen they replaced filled all nine with an identical lavender panel
 * carrying its art direction in monospace ("ARTICLE THUMBNAIL — A TWO-BAR
 * COMPARISON MODEL…"). That is a wireframe showing through to a reader. The
 * plate below is a finished thing instead: the category's wash, its mark,
 * and nothing that reads as a note to a designer.
 *
 * `object-cover` plus a per-slot `objectPosition` is what does the cropping,
 * so one asset serves the 16:10 card and the 5:3 featured panel without a
 * second export — and re-cropping at a narrower viewport pulls from the
 * middle of the frame rather than trimming a subject off the edge.
 */
export function HubMedia({
  media,
  category,
  sizes,
  priority = false,
  objectPosition,
  className,
  markClassName,
}: {
  media?: HubMediaContent;
  category: HubCategory;
  /** Required whenever `media` may render: this is always a `fill` image. */
  sizes: string;
  /** Above-the-fold only. Everything else stays lazy. */
  priority?: boolean;
  /** Defaults to a centred crop when the asset does not ask for another. */
  objectPosition?: string;
  className?: string;
  markClassName?: string;
}) {
  const presentation = hubCategory(category);
  const Icon = presentation.icon;

  return (
    <div className={twMerge("relative overflow-hidden", className)}>
      {/* The category's 3px edge — the same index-tab accent the hero and
          the CTA band use, and the one place the raw accent colour appears
          at full strength. Decorative, so it is hidden from AT. */}
      <span
        aria-hidden="true"
        className={clsx(
          "absolute inset-x-0 top-0 z-10 h-[3px]",
          TONE_RULE[presentation.tone],
        )}
      />

      {media ? (
        <Image
          src={media.src}
          alt={media.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
          style={{ objectPosition: objectPosition ?? "50% 50%" }}
        />
      ) : (
        <div
          aria-hidden="true"
          className={clsx(
            "grid h-full w-full place-items-center p-5",
            TONE_PLATE[presentation.tone],
          )}
        >
          {/*
            A miniature of the guide itself rather than a lone glyph on a
            wash: mark, title rule and two lines of body, on the same white
            sheet the hero's indexed guide is drawn on. At card size it
            reads as a small piece of art; a centred icon in a 16:10 box
            reads as the empty frame it is.
          */}
          <div className="flex w-full max-w-[230px] items-center gap-3 rounded-[10px] border border-white bg-white/80 p-3 shadow-[0_2px_8px_rgba(24,21,31,0.05)]">
            <span
              className={clsx(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                presentation.tone === "brand"
                  ? "bg-mm-tint text-mm-brand"
                  : "bg-mm-ember-tint text-mm-ember-ink",
              )}
            >
              <Icon className={twMerge("h-[18px] w-[18px]", markClassName)} strokeWidth={1.75} />
            </span>
            <span className="grid min-w-0 flex-1 gap-[7px]">
              <span
                className={clsx(
                  "block h-[6px] w-3/5 rounded-full",
                  presentation.tone === "brand" ? "bg-mm-brand-mid" : "bg-mm-ember/60",
                )}
              />
              <span className="block h-[5px] w-full rounded-full bg-mm-line" />
              <span className="block h-[5px] w-2/3 rounded-full bg-mm-line" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
