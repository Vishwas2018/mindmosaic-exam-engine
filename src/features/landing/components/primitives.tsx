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
            i < count ? "fill-accent" : "fill-brand/15",
          )}
        >
          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}
