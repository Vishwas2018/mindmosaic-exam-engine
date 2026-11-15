import type { ReactNode } from "react";
import Link from "next/link";
import { twMerge } from "tailwind-merge";

/**
 * Building blocks of the parent workspace, taken from the Claude Design parent artboards
 * (docs/reviews/workspace-r1, Parent 01–30): 36px Instrument Sans page titles with an 18px lead, 24px-radius white
 * cards on the #f7f3fc page, 48px primary buttons, initial tiles that alternate brand and ember per child.
 */

export const pFocus =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mm-brand focus-visible:ring-[6px] focus-visible:ring-mm-brand/15";

export const pButtonPrimary = twMerge(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-transparent bg-mm-brand px-5 text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_2px_8px_rgba(89,37,168,0.22)] transition-colors hover:bg-mm-brand-deep disabled:cursor-not-allowed disabled:opacity-60",
  pFocus,
);
export const pButtonSecondary = twMerge(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-mm-line bg-white px-5 text-[15px] font-semibold tracking-[-0.01em] text-mm-ink transition-colors hover:border-mm-brand/40",
  pFocus,
);
export const pButtonQuiet = twMerge(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-3 text-[15px] font-semibold tracking-[-0.01em] text-mm-brand hover:underline",
  pFocus,
);

/** Brand tile for the first child, ember for the second, alternating, as in every parent artboard. */
export function childTone(index: number) {
  return index % 2 === 0
    ? { tile: "bg-mm-tint text-mm-brand", name: "brand" as const }
    : { tile: "bg-mm-ember-tint text-mm-ember-ink", name: "ember" as const };
}

export function ChildInitial({
  name,
  index,
  size = "md",
}: {
  name: string;
  index: number;
  size?: "sm" | "md" | "lg";
}) {
  const dims =
    size === "sm"
      ? "h-6 w-6 rounded-lg text-[10px]"
      : size === "lg"
        ? "h-14 w-14 rounded-2xl text-xl"
        : "h-11 w-11 rounded-[14px] text-lg";
  return (
    <span aria-hidden="true" className={twMerge("grid shrink-0 place-items-center font-semibold", dims, childTone(index).tile)}>
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function PageHeader({
  title,
  lead,
  aside,
}: {
  title: string;
  lead?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-[720px]">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-[1.15] tracking-[-0.028em] text-mm-ink sm:text-4xl">
          {title}
        </h1>
        {lead && <p className="mt-2 text-base leading-[1.6] text-mm-ink-soft sm:text-lg">{lead}</p>}
      </div>
      {aside}
    </div>
  );
}

export function Card({
  children,
  className,
  as: Tag = "article",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: "article" | "section" | "div";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      {...rest}
      className={twMerge(
        "rounded-3xl border border-mm-brand/10 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(49,32,86,0.09)] sm:px-[26px] sm:py-6",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/** The quiet tinted band used for "Three things worth knowing" and similar footnotes. */
export function TintPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={twMerge("rounded-3xl border border-mm-brand/15 bg-mm-tint px-5 py-6 sm:px-[26px]", className)}>
      {children}
    </section>
  );
}

export function SectionTitle({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="font-[family-name:var(--font-display)] text-[19px] font-semibold leading-[1.2] tracking-[-0.02em] text-mm-ink">
      {children}
    </h2>
  );
}

/** A small "i" note on a tinted ground (first-visit hints, preview notices). */
export function InfoNote({ title, children, className }: { title?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div
      role="note"
      className={twMerge("flex gap-3 rounded-xl bg-mm-tint-soft px-4 py-3.5 text-[14.5px] leading-[1.5] text-mm-ink-soft", className)}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-0.5 h-[18px] w-[18px] shrink-0 text-mm-brand" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
      </svg>
      <div className="min-w-0">
        {title && <b className="font-semibold text-mm-ink">{title}</b>}
        {children && <span className={title ? "mt-0.5 block" : undefined}>{children}</span>}
      </div>
    </div>
  );
}

/** "Nothing finished yet" — dashed box, a fact about the child (state block from the components artboard). */
export function NothingYetBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#8a8394] bg-mm-tint-soft p-[18px]">
      <p className="text-[15px] font-semibold text-mm-ink">{title}</p>
      <p className="mt-1 text-sm leading-[1.5] text-mm-ink-soft">{children}</p>
    </div>
  );
}

/** Small evidence gauge icon shown before "N papers · M marks counted". */
export function EvidenceIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2.5 11.5a5.5 5.5 0 0 1 9.4-3.9" strokeLinecap="round" />
      <path d="M13 9.5v.01M13.5 12v.01" strokeLinecap="round" />
    </svg>
  );
}

export function ChildPills({
  items,
  selectedId,
  allHref,
  onSelect,
  hrefFor,
}: {
  items: ReadonlyArray<{ id: string; name: string }>;
  selectedId: string | null;
  /** Link mode: where "All children" goes. */
  allHref?: string;
  /** Link mode: where a child's pill goes. */
  hrefFor?: (id: string) => string;
  /** Button mode: filter in place. */
  onSelect?: (id: string | null) => void;
}) {
  const pill = (active: boolean) =>
    twMerge(
      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-[14.5px] font-semibold transition-colors",
      active ? "bg-mm-brand text-white" : "text-mm-ink-soft hover:bg-mm-tint-soft",
      pFocus,
    );
  const entries: Array<{ id: string | null; name: string; index: number }> = [
    { id: null, name: "All children", index: -1 },
    ...items.map((c, i) => ({ id: c.id, name: c.name, index: i })),
  ];
  return (
    <div
      role="group"
      aria-label="Choose a child"
      className="flex max-w-full gap-2 overflow-x-auto rounded-full border border-mm-line bg-white p-1.5 [scrollbar-width:none] sm:w-fit"
    >
      {entries.map((e) => {
        const active = e.id === selectedId;
        const content = (
          <>
            {e.index >= 0 && <ChildInitial name={e.name} index={e.index} size="sm" />}
            {e.name}
          </>
        );
        if (onSelect) {
          return (
            <button key={e.id ?? "all"} type="button" aria-pressed={active} onClick={() => onSelect(e.id)} className={pill(active)}>
              {content}
            </button>
          );
        }
        const href = e.id === null ? (allHref ?? "/parent") : (hrefFor?.(e.id) ?? "/parent");
        return (
          <Link key={e.id ?? "all"} href={href} aria-current={active ? "page" : undefined} className={pill(active)}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
