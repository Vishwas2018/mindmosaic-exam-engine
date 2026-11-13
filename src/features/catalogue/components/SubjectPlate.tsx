import { cn } from "@/lib/cn";

import type { SubjectPresentation } from "../presentation";
import { PlateImage } from "./PlateImage";

/**
 * A subject's still-life plate — the recurring image element of the
 * catalogue, used at card scale on every program and at tile scale in the
 * hero mosaic.
 *
 * Two layers, deliberately:
 *
 * 1. A lilac-to-cream wash with the subject's line mark centred in it.
 * 2. The still life itself, an optimised lazy image *above* that wash.
 *
 * A subject whose plate has not been added to public/practice/subject/ yet
 * still falls back to layer 1 — an intentional tinted mark — instead of a
 * broken-image icon: PlateImage removes itself if its file fails to load.
 * (It is lazy and sized to `sizes`, because the masters are 1400px wide and a
 * plate is drawn at most ~380px wide.)
 *
 * Purely decorative: the program title beside it names the subject, so the
 * whole element is hidden from assistive technology.
 */
export function SubjectPlate({
  presentation,
  className,
  markClassName,
  /** Scales the artwork slightly when an ancestor marked `group` is hovered. */
  zoomOnGroupHover = false,
  /** What the browser should assume the plate is drawn at. Default: a 96px square on phones, up to ~380px from `sm`. */
  sizes = "(min-width: 640px) 380px, 96px",
}: {
  presentation: SubjectPresentation;
  className?: string;
  markClassName?: string;
  zoomOnGroupHover?: boolean;
  sizes?: string;
}) {
  const Icon = presentation.icon;

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block overflow-hidden bg-[linear-gradient(155deg,var(--mm-tint)_0%,var(--mm-page)_100%)]",
        className,
      )}
    >
      <span className="absolute inset-0 grid place-items-center text-mm-lilac">
        <Icon className={cn("h-10 w-10", markClassName)} strokeWidth={1.25} />
      </span>
      <span
        className={cn(
          "absolute inset-0",
          zoomOnGroupHover &&
            "transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none",
        )}
      >
        <PlateImage src={presentation.art} sizes={sizes} className="object-cover object-center" />
      </span>
    </span>
  );
}
