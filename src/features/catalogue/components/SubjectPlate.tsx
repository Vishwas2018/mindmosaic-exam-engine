import { cn } from "@/lib/cn";

import type { SubjectPresentation } from "../presentation";

/**
 * A subject's still-life plate — the recurring image element of the
 * catalogue, used at card scale on every program and at tile scale in the
 * hero mosaic.
 *
 * Two layers, deliberately:
 *
 * 1. A lilac-to-cream wash with the subject's line mark centred in it.
 * 2. The still life itself, painted as a CSS background *above* that wash.
 *
 * The artwork is a background layer rather than an <img> so that a subject
 * whose plate has not been added to public/practice/subject/ yet falls back
 * to layer 1 — an intentional tinted mark — instead of a broken-image icon.
 * That also keeps this a server component with no client-side error handling.
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
}: {
  presentation: SubjectPresentation;
  className?: string;
  markClassName?: string;
  zoomOnGroupHover?: boolean;
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
          "absolute inset-0 bg-cover bg-center",
          zoomOnGroupHover &&
            "transition-transform duration-500 ease-out group-hover:scale-[1.04] motion-reduce:transform-none",
        )}
        style={{ backgroundImage: `url("${presentation.art}")` }}
      />
    </span>
  );
}
