"use client";

import Link from "next/link";

export interface ChildSwitcherItem {
  id: string;
  name: string;
  avatarColor?: string;
}

export interface ChildSwitcherProps {
  childrenList: readonly ChildSwitcherItem[];
  selectedId: string | null; // null = "All children"
  showAllOption?: boolean;
  onSelect?: (id: string | null) => void;
  hrefForChild?: (id: string | null) => string;
  className?: string;
}

/**
 * ChildSwitcher component (§4.1 of Parent Journey specification):
 *
 * "All children, then one pill per child. It is the only way to change whose
 * data is on screen, so it never appears twice on a page and never hides
 * behind a menu. 44px targets, aria-current='page' on the active pill, and
 * the child's initial carried through so the parent can see at a glance whose
 * screen they are on."
 */
export function ChildSwitcher({
  childrenList,
  selectedId,
  showAllOption = true,
  onSelect,
  hrefForChild,
  className = "",
}: ChildSwitcherProps) {
  const isLink = typeof hrefForChild === "function";

  const renderPill = (
    id: string | null,
    label: string,
    initial?: string,
  ) => {
    const isActive = selectedId === id;
    const baseClasses = `group inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/20 ${
      isActive
        ? "bg-mm-brand font-semibold text-white shadow-sm"
        : "border border-mm-brand/10 bg-white font-semibold text-mm-ink hover:border-mm-brand/30 hover:bg-mm-brand/5"
    }`;

    const content = (
      <>
        {initial && (
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              isActive
                ? "bg-white/20 text-white"
                : "bg-mm-brand/10 text-mm-brand"
            }`}
          >
            {initial}
          </span>
        )}
        <span className="truncate">{label}</span>
      </>
    );

    if (isLink) {
      return (
        <Link
          key={id ?? "all"}
          href={hrefForChild(id)}
          aria-current={isActive ? "page" : undefined}
          className={baseClasses}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={id ?? "all"}
        type="button"
        onClick={() => onSelect?.(id)}
        aria-pressed={isActive}
        aria-current={isActive ? "page" : undefined}
        className={baseClasses}
      >
        {content}
      </button>
    );
  };

  const Wrapper = isLink ? "nav" : "div";

  return (
    <Wrapper
      aria-label="Filter by child"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {showAllOption && renderPill(null, "All children")}
      {childrenList.map((child) =>
        renderPill(
          child.id,
          child.name,
          child.name.trim().charAt(0).toUpperCase() || "C",
        ),
      )}
    </Wrapper>
  );
}
