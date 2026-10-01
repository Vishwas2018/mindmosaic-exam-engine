import { type CSSProperties, type HTMLAttributes, type ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { ImageSlotImage } from "./ImageSlotImage";

/**
 * Shared building blocks for the marketing surface, matching the approved
 * design file's own vocabulary (see ../content.ts for the source). Every
 * colour here is an `mm-*` utility from globals.css — the design palette —
 * so nothing on this page can drift from the file it was built from, and
 * nothing on this page can change the product surfaces.
 */

/* ---------- Buttons ---------- */

export type MmButtonVariant = "primary" | "outline" | "quiet";
export type MmButtonSize = "md" | "lg";

const variants: Record<MmButtonVariant, string> = {
  primary:
    "bg-mm-brand text-white shadow-[0_2px_8px_rgba(89,37,168,0.22)] hover:bg-mm-brand-deep active:translate-y-px",
  outline:
    "border border-mm-line bg-white text-mm-ink hover:border-mm-brand hover:text-mm-brand active:translate-y-px",
  quiet: "text-mm-brand hover:text-mm-ink",
};

/*
 * Sizes are the design file's own two: 48px for in-section CTAs, 52px for
 * the hero/closing pair. Both clear the 44px touch-target floor.
 */
const sizes: Record<MmButtonSize, string> = {
  md: "min-h-12 px-5 text-[15.5px]",
  lg: "min-h-13 px-6 text-base",
};

export function mmButton({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: MmButtonVariant;
  size?: MmButtonSize;
  className?: string;
} = {}) {
  return twMerge(
    clsx(
      "inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold leading-none tracking-[-0.01em] transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page",
      variants[variant],
      sizes[size],
      className,
    ),
  );
}

/* ---------- Eyebrow ---------- */

/**
 * The design's section kicker: 12px, uppercase, wide-tracked, brand
 * purple. `rule` adds the short coral bar the hero and the audience
 * columns use — everywhere else it is text only.
 */
export function Eyebrow({
  children,
  rule = false,
  className,
}: {
  children: ReactNode;
  rule?: boolean;
  className?: string;
}) {
  return (
    <p
      className={twMerge(
        "inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-[0.14em] text-mm-brand",
        className,
      )}
    >
      {rule && <span aria-hidden="true" className="h-[3px] w-[26px] shrink-0 rounded-sm bg-mm-coral" />}
      {children}
    </p>
  );
}

/* ---------- Section shell ---------- */

export type SectionTone = "page" | "white" | "tint";

const sectionTones: Record<SectionTone, string> = {
  page: "bg-mm-page",
  white: "bg-white border-y border-mm-line",
  tint: "bg-mm-tint",
};

/**
 * One section rhythm for the whole page: the design's
 * `clamp(40px, 4vw, 64px)` vertical padding and 1440px container.
 */
export function Section({
  id,
  tone = "page",
  labelledBy,
  className,
  children,
}: {
  id?: string;
  tone?: SectionTone;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={twMerge(
        clsx("py-[clamp(40px,4vw,64px)]", sectionTones[tone]),
        className,
      )}
    >
      <div className="mm-width">{children}</div>
    </section>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  className,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  className?: string;
}) {
  return (
    <div className={twMerge("max-w-[660px]", className)}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className="text-[clamp(28px,3.2vw,44px)] font-bold leading-[1.12] tracking-[-0.03em] text-mm-ink"
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-[18px] text-pretty text-[17px] leading-[1.6] text-mm-muted">{intro}</p>
      )}
    </div>
  );
}

/* ---------- Card ---------- */

export function MmCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge("rounded-2xl border border-mm-line bg-white", className)}
      {...props}
    />
  );
}

/* ---------- Decorative mosaic rule ---------- */

export type TileTone = "brand" | "coral" | "lilac" | "quiet";

const tileTones: Record<TileTone, string> = {
  brand: "bg-mm-brand",
  coral: "bg-mm-coral",
  lilac: "bg-mm-lilac",
  quiet: "bg-mm-tint-quiet",
};

/**
 * The mosaic rule that closes the hero, the Learning Hub image, the
 * closing CTA and the footer — the page's one recurring ornament. Purely
 * decorative, so it is hidden from assistive tech.
 */
export function MosaicRule({
  tiles,
  className,
  tileClassName,
}: {
  tiles: readonly TileTone[] | readonly string[];
  className?: string;
  tileClassName?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={twMerge("grid gap-2.5", className)}
      style={{ gridTemplateColumns: `repeat(${tiles.length}, minmax(0, 1fr))` }}
    >
      {tiles.map((tone, index) => (
        <span
          key={`${tone}-${index}`}
          className={twMerge(
            clsx("rounded", tileTones[(tone as TileTone) in tileTones ? (tone as TileTone) : "quiet"]),
            tileClassName,
          )}
        />
      ))}
    </div>
  );
}

/* ---------- Growing underline link ---------- */

/**
 * MOTION_SPEC.md effect 6: an underline that grows from the left on hover
 * (350ms, ease-out-expo), coral for header nav, brand-colour everywhere
 * else the design uses this — "See what's open", "Compare plans", quality
 * section links. `active` (the current nav item) holds it fully grown
 * with no hover needed. Colour and background-size run on different
 * durations, which Tailwind's `duration-*`/`ease-*` utilities can't split
 * per-property, so the transition itself is inline.
 */
export const underlineTransition = {
  transition: "color 150ms, background-size 350ms cubic-bezier(0.16,1,0.3,1)",
} as const;

export function underlineLinkClasses({
  active = false,
  tone = "coral",
  className,
}: {
  active?: boolean;
  tone?: "coral" | "brand";
  className?: string;
} = {}) {
  /*
   * Both branches are written out in full (not built from `${color}`) so
   * Tailwind's build-time class scanner — which reads this file as text,
   * not as executed JS — can see each complete arbitrary-value class.
   */
  return twMerge(
    clsx(
      "bg-no-repeat [background-position:0_calc(50%+0.85em)]",
      tone === "coral"
        ? "[background-image:linear-gradient(var(--mm-coral),var(--mm-coral))]"
        : "[background-image:linear-gradient(currentColor,currentColor)]",
      active
        ? "[background-size:100%_2px]"
        : "[background-size:0%_2px] hover:[background-size:100%_2px]",
    ),
    className,
  );
}

/* ---------- Pill / tab styling shared by the three interactive sections ---------- */

/**
 * The design's one pressed-state treatment, reused by the programme year
 * pickers, the category filters, the showcase tabs and the question-type
 * tabs so they cannot drift apart. `disabled` is the "unavailable for this
 * year" state — dimmed but still readable, never colour-only (the label
 * beside it says "Unavailable" in words).
 */
export function pillClasses({
  selected,
  disabled = false,
  className,
}: {
  selected: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return twMerge(
    clsx(
      "inline-flex min-h-11 items-center justify-center rounded-[10px] border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page",
      disabled
        ? "border-mm-line-quiet bg-mm-surface-quiet text-mm-quiet"
        : selected
          ? "border-mm-brand bg-mm-brand text-white shadow-[0_1px_2px_rgba(24,21,31,0.18)]"
          : "border-mm-line bg-white text-mm-ink-soft hover:border-mm-brand",
    ),
    className,
  );
}

/* ---------- Image slot ---------- */

/**
 * The design's photography frame: a real `next/image` on a neutral tinted
 * background, with separate desktop/mobile focal points (design's
 * `object-position` per breakpoint), a loading fade-in, and a "missing"
 * state — an asset-id chip on a dashed placeholder — when `src` is not
 * supplied yet. `focalMobile` falls back to `focalDesktop`, and both
 * default to centred.
 *
 * Focal points are runtime prop values, so they can't be Tailwind
 * arbitrary-value classes (Tailwind only generates CSS for class names its
 * build-time scanner finds as literal text). They're set as CSS custom
 * properties instead, read by the static `.mm-image-slot img` rule in
 * globals.css that switches at the `md` breakpoint.
 */
export function ImageSlot({
  assetId,
  src,
  alt,
  aspectRatio,
  focalDesktop = "50% 50%",
  focalMobile,
  priority,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  className,
}: {
  assetId: string;
  src?: string;
  alt: string;
  aspectRatio?: string;
  focalDesktop?: string;
  focalMobile?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={twMerge("relative flex h-full w-full items-center justify-center bg-mm-tint p-6", className)}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <span className="rounded-full border border-dashed border-mm-brand/40 bg-white/80 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-mm-brand">
          Image placeholder · {assetId}
        </span>
      </div>
    );
  }

  const focalStyle = {
    "--mm-focal-mobile": focalMobile ?? focalDesktop,
    "--mm-focal-desktop": focalDesktop,
  } as CSSProperties;

  return (
    <div
      className={twMerge("relative h-full w-full overflow-hidden bg-mm-tint", className)}
      style={aspectRatio ? { aspectRatio, ...focalStyle } : focalStyle}
    >
      <ImageSlotImage src={src} alt={alt} priority={priority} sizes={sizes} />
    </div>
  );
}

/* ---------- Slot ---------- */

/**
 * Reserves exact space for imagery that does not exist yet (the tutorial
 * poster frames), so dropping a real still in later never shifts layout.
 * It is labelled with what belongs there rather than dressed up as
 * content — see ../content.ts's note on why the tutorial slots are empty.
 */
export function EmptySlot({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <div
      className={twMerge(
        "flex h-full w-full items-center justify-center bg-mm-tint p-6 text-center",
        className,
      )}
    >
      <p className="max-w-[36ch] font-mono text-[11.5px] uppercase leading-[1.6] tracking-[0.04em] text-mm-brand">
        {label}
      </p>
    </div>
  );
}
