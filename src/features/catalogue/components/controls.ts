import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The catalogue's own control vocabulary, in the design-canvas palette.
 *
 * These match the marketing surface's pills and buttons exactly (see
 * src/features/landing/components/primitives.tsx) but are restated here
 * rather than imported: the catalogue is a product surface and must not
 * take a dependency on the marketing feature, which is client-heavy and
 * carries the whole landing content module with it.
 */

/**
 * The one pressed-state treatment for the catalogue's filter chips.
 *
 * Selected is a filled brand chip, not a tint: a tinted chip sat at roughly
 * 1.6:1 against its unselected neighbours, which is not a state anyone can
 * see at a glance.
 */
export function cataloguePill({
  selected,
  className,
}: {
  selected: boolean;
  className?: string;
}) {
  return twMerge(
    clsx(
      "inline-flex min-h-10 items-center justify-center rounded-[10px] border px-3.5 text-[13.5px] font-bold leading-none transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page",
      selected
        ? "border-mm-brand bg-mm-brand text-white shadow-[0_1px_2px_rgba(24,21,31,0.18)]"
        : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand hover:text-mm-brand",
    ),
    className,
  );
}

export type CatalogueButtonVariant = "primary" | "outline" | "quiet";

const buttonVariants: Record<CatalogueButtonVariant, string> = {
  primary:
    "bg-mm-brand text-white shadow-[0_2px_8px_rgba(89,37,168,0.22)] hover:bg-mm-brand-deep active:translate-y-px",
  outline:
    "border border-mm-line bg-white text-mm-ink hover:border-mm-brand hover:text-mm-brand active:translate-y-px",
  quiet: "text-mm-brand hover:text-mm-ink",
};

export function catalogueButton({
  variant = "primary",
  className,
}: {
  variant?: CatalogueButtonVariant;
  className?: string;
} = {}) {
  return twMerge(
    clsx(
      "inline-flex min-h-12 select-none items-center justify-center gap-2 rounded-xl px-5 text-[15.5px] font-bold leading-none tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page",
      buttonVariants[variant],
      className,
    ),
  );
}

/** The section kicker: 12px, uppercase, wide-tracked, brand purple. */
export const EYEBROW_CLASSES =
  "inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand";
