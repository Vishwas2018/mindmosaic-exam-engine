import type { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/* ---------- Buttons ---------- */

export type LpButtonVariant = "primary" | "outline" | "inverse" | "ghost";
export type LpButtonSize = "md" | "lg";

const lpButtonVariants: Record<LpButtonVariant, string> = {
  primary:
    "bg-brand text-white shadow-[0_12px_28px_rgba(89,37,168,0.28)] hover:bg-brand-deep",
  outline:
    "border border-brand/20 bg-white text-brand shadow-[0_8px_20px_rgba(89,37,168,0.08)] hover:border-brand/40 hover:bg-brand/5",
  inverse:
    "bg-white text-brand-ink shadow-[0_12px_28px_rgba(0,0,0,0.25)] hover:bg-paper",
  ghost: "bg-transparent text-brand hover:bg-brand/8",
};

const lpButtonSizes: Record<LpButtonSize, string> = {
  md: "min-h-11 px-5 py-2.5 text-sm",
  lg: "min-h-13 px-7 py-3.5 text-base",
};

export function lpButton({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: LpButtonVariant;
  size?: LpButtonSize;
  className?: string;
} = {}) {
  return twMerge(
    clsx(
      "inline-flex select-none items-center justify-center gap-2 rounded-full font-bold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
      lpButtonVariants[variant],
      lpButtonSizes[size],
      className,
    ),
  );
}

/* ---------- Mosaic eyebrow ---------- */

/**
 * The 2×2 mosaic chip is the section signature: three iris tiles and one
 * red tile — the "one piece that needs attention", which is what the
 * product finds for families.
 */
export function MosaicMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={twMerge("grid shrink-0 grid-cols-2 gap-[3px]", className)}
    >
      <span className="h-2 w-2 rounded-[2px] bg-brand" />
      <span className="h-2 w-2 rounded-[2px] bg-accent" />
      <span className="h-2 w-2 rounded-[2px] bg-brand/40" />
      <span className="h-2 w-2 rounded-[2px] bg-brand" />
    </span>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={twMerge(
        "inline-flex items-center gap-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-brand",
        className,
      )}
    >
      <MosaicMark />
      {children}
    </p>
  );
}

/* ---------- Section heading ---------- */

export function SectionHeading({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  dark = false,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div
      className={clsx(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
      )}
    >
      <Eyebrow
        className={clsx(
          dark && "text-white/80",
          align === "center" && "justify-center",
        )}
      >
        {eyebrow}
      </Eyebrow>
      <h2
        id={id}
        className={clsx(
          "mt-4 font-display text-3xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-4xl lg:text-[2.75rem]",
          dark ? "text-white" : "text-lp-ink",
        )}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={clsx(
            "mt-5 text-lg leading-8",
            dark ? "text-white/75" : "text-lp-muted",
          )}
        >
          {intro}
        </p>
      )}
    </div>
  );
}

/* ---------- Tile meter (signature progress element) ---------- */

/**
 * Skill progress shown as ten mosaic tiles instead of a continuous bar —
 * skills are assembled piece by piece, and one glance shows how many
 * pieces are in place.
 */
export function TileMeter({
  label,
  value,
  tone = "brand",
  className,
}: {
  label: string;
  value: number; // 0–1
  tone?: "brand" | "accent" | "success";
  className?: string;
}) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * 10);
  const toneClass =
    tone === "accent"
      ? "bg-accent"
      : tone === "success"
        ? "bg-success"
        : "bg-brand";
  return (
    <div
      role="img"
      aria-label={`${label}: ${filled} of 10`}
      className={twMerge("flex gap-1", className)}
    >
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={clsx(
            "h-2.5 flex-1 rounded-[3px]",
            i < filled ? toneClass : "bg-brand/12",
          )}
        />
      ))}
    </div>
  );
}

/* ---------- Card ---------- */

export function LpCard({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(
        "rounded-3xl border border-brand/10 bg-white shadow-[0_16px_44px_rgba(42,16,81,0.07)]",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Image slots (imagery-guidelines.md) ---------- */

/**
 * Reserves exact space (via `aspect-ratio`, not intrinsic image size) so
 * dropping a real photo in later — see ../../../../brand/imagery-guidelines.md
 * — never shifts layout. Today's children are original SVG/gradient art or
 * an initials placeholder; swap to a lazy-loaded `next/image` `fill` inside
 * the same wrapper when a licensed photo arrives, no layout change needed.
 */
export function ImageSlot({
  aspectW,
  aspectH,
  className,
  children,
}: {
  aspectW: number;
  aspectH: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={twMerge("relative w-full overflow-hidden", className)}
      style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
    >
      {children}
    </div>
  );
}

/**
 * Original decorative gradient/mosaic-tile art in the brand palette — not a
 * stock asset, not a screenshot. `gradientId` must be unique per instance on
 * the page (SVG `<linearGradient>` ids are global to the document).
 */
export function MosaicAccentArt({
  gradientId,
  className,
}: {
  gradientId: string;
  className?: string;
}) {
  const tiles = [
    { x: 18, y: 24, size: 46, fill: "var(--brand-bright)", opacity: 0.85 },
    { x: 70, y: 12, size: 30, fill: "var(--royal-orange)", opacity: 0.9 },
    { x: 58, y: 62, size: 38, fill: "var(--accent)", opacity: 0.8 },
    { x: 14, y: 70, size: 22, fill: "var(--brand-ink)", opacity: 0.6 },
    { x: 82, y: 58, size: 18, fill: "var(--brand-bright)", opacity: 0.5 },
  ];
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      className={twMerge("h-full w-full", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--brand)" }} />
          <stop offset="100%" style={{ stopColor: "var(--brand-ink)" }} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#${gradientId})`} />
      {tiles.map((tile) => (
        <rect
          key={`${tile.x}-${tile.y}`}
          x={tile.x}
          y={tile.y}
          width={tile.size}
          height={tile.size}
          rx="6"
          fill={tile.fill}
          opacity={tile.opacity}
        />
      ))}
    </svg>
  );
}

/** Initials placeholder for a testimonial avatar slot — swap for a licensed headshot inside the same `ImageSlot` once testimonials are real. */
export function AvatarInitial({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initial = name.replace(/^placeholder\s*—?\s*/i, "").trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      aria-hidden="true"
      className={twMerge(
        "flex h-full w-full items-center justify-center rounded-full bg-brand/10 font-display text-sm font-bold text-brand",
        className,
      )}
    >
      {initial}
    </div>
  );
}

/* ---------- Coloured icon tile (mockup 2's subject/feature icon squares) ---------- */

const toneClasses: Record<string, string> = {
  brand: "bg-brand/12 text-brand",
  "brand-bright": "bg-brand-bright/12 text-brand-bright",
  "brand-ink": "bg-brand-ink/10 text-brand-ink",
  accent: "bg-accent/12 text-accent-strong",
  success: "bg-success/12 text-success",
  "royal-orange": "bg-royal-orange-tint/15 text-royal-orange-tint",
};

/** A rounded, tinted square used for a lucide icon where no owner photo/icon-art exists for that tile — keeps text-first tiles visually consistent with the image-backed ones beside them. */
export function ColorTile({
  tone,
  className,
  children,
}: {
  tone: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      aria-hidden="true"
      className={twMerge(
        "inline-flex h-14 w-14 items-center justify-center rounded-2xl",
        toneClasses[tone] ?? toneClasses.brand,
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A visibly disabled control — used for social icons and other "coming soon" affordances that must never be a dead `<a>` link. */
export function DisabledIconButton({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title={`${label} — coming soon`}
      className={twMerge(
        "inline-flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full bg-white/10 text-white/40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------- Stars ---------- */

export function Stars({ count }: { count: number }) {
  return (
    <span
      role="img"
      aria-label={`${count} out of 5 stars`}
      className="inline-flex gap-0.5"
    >
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={clsx(
            "h-4 w-4",
            i < count ? "fill-royal-orange" : "fill-brand/15",
          )}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
