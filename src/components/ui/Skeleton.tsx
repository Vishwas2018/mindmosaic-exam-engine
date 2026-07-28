import type { CSSProperties } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export type SkeletonVariant = "text" | "rect" | "circle";

export interface SkeletonProps {
  /** Shape of the placeholder. Defaults to `"rect"`. */
  variant?: SkeletonVariant;
  /** Any valid CSS width (e.g. `"100%"`, `"12rem"`, `240`). */
  width?: string | number;
  /** Any valid CSS height (e.g. `"1rem"`, `48`). */
  height?: string | number;
  className?: string;
}

/**
 * A single shimmering placeholder block for loading states. It is purely
 * decorative — always `aria-hidden` — so the surrounding region is expected
 * to carry the real busy/label semantics (e.g. `aria-busy`, a visually
 * hidden "Loading…" label, or a live region). Rendering a skeleton as an
 * accessible element would announce meaningless "blank" content to a screen
 * reader.
 */
export function Skeleton({
  variant = "rect",
  width,
  height,
  className,
}: SkeletonProps) {
  const style: CSSProperties = {};
  if (width !== undefined) style.width = width;
  if (height !== undefined) style.height = height;

  return (
    <span
      aria-hidden="true"
      data-testid="skeleton"
      className={twMerge(
        clsx(
          "block animate-pulse bg-ink/8",
          variant === "text" && "h-4 rounded",
          variant === "rect" && "rounded-xl",
          variant === "circle" && "aspect-square rounded-full",
          className,
        ),
      )}
      style={style}
    />
  );
}

export interface SkeletonTextProps {
  /** Number of lines to render. Defaults to `3`. */
  lines?: number;
  className?: string;
}

/**
 * A stack of text-line skeletons with a shortened final line, matching the
 * ragged look of a real paragraph. Wrap it in an element with an accessible
 * busy label so assistive tech announces that content is loading.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  const count = Math.max(1, lines);
  return (
    <span
      aria-hidden="true"
      data-testid="skeleton-text"
      className={twMerge("flex flex-col gap-2.5", className)}
    >
      {Array.from({ length: count }, (_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === count - 1 && count > 1 ? "60%" : "100%"}
        />
      ))}
    </span>
  );
}
