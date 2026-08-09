"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { cn } from "@/lib/cn";

import type { CatalogueFilterKey, CatalogueFilterState } from "../filter-state";
import {
  ALL,
  GRADE_OPTIONS,
  GRADE_LABELS,
  STYLE_OPTIONS,
  STYLE_LABELS,
  SUBJECT_OPTIONS,
  SUBJECT_LABELS,
} from "../filter-state";

export interface PracticeFiltersProps {
  value: CatalogueFilterState;
  onChange: (key: CatalogueFilterKey, next: string) => void;
  onReset: () => void;
  isFiltered: boolean;
  resultCount: number;
}

interface FilterAxis {
  key: CatalogueFilterKey;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
}

const AXES: readonly FilterAxis[] = [
  { key: "grade", label: "Grade", options: GRADE_OPTIONS, labels: GRADE_LABELS },
  { key: "subject", label: "Subject", options: SUBJECT_OPTIONS, labels: SUBJECT_LABELS },
  { key: "style", label: "Style", options: STYLE_OPTIONS, labels: STYLE_LABELS },
];

/**
 * One filter axis, as a labelled trigger and the panel it discloses.
 *
 * Deliberately a disclosure over a group of toggle buttons rather than a
 * listbox or a menu: the options are three independent filters that stay
 * pressed, `aria-pressed` says so on each one, and the surrounding
 * role="group" names the axis. A listbox would promise arrow-key roving and
 * typeahead this does not implement, and `aria-haspopup` would promise a
 * menu the panel is not.
 *
 * The panel stays mounted and is hidden with `display: none` when closed —
 * so it is correctly invisible to assistive technology and out of the tab
 * order, without options being torn down and rebuilt on every open.
 */
function FilterMenu({
  axis,
  active,
  open,
  onOpenChange,
  onSelect,
}: {
  axis: FilterAxis;
  active: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (next: string) => void;
}) {
  const panelId = `practice-filter-${axis.key}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isSet = active !== ALL;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        data-testid={`${axis.key}-filter-trigger`}
        onClick={() => onOpenChange(!open)}
        className={cn(
          "inline-flex min-h-11 w-full items-center gap-2 rounded-xl border px-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 focus-visible:ring-offset-2 focus-visible:ring-offset-mm-page sm:w-auto",
          open || isSet
            ? "border-mm-brand bg-white text-mm-ink"
            : "border-mm-line bg-white text-mm-ink hover:border-mm-brand",
        )}
      >
        <span className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-mm-muted">
          {axis.label}
        </span>
        <span className="flex-1 truncate text-[14.5px] font-bold sm:flex-none">
          {axis.labels[active]}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 shrink-0 text-mm-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        role="group"
        aria-label={axis.label}
        className={cn(
          "absolute left-0 top-[calc(100%+6px)] z-50 min-w-full rounded-xl border border-mm-line bg-white p-1.5 shadow-[0_16px_40px_rgba(24,21,31,0.14)]",
          open ? "block" : "hidden",
        )}
      >
        {axis.options.map((option) => {
          const selected = option === active;
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              data-testid={`${axis.key}-filter-${option}`}
              onClick={() => {
                onSelect(option);
                onOpenChange(false);
                triggerRef.current?.focus();
              }}
              className={cn(
                "flex min-h-10 w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 text-left text-[14.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30",
                selected ? "bg-mm-tint text-mm-brand" : "text-mm-ink-soft hover:bg-mm-tint-soft",
              )}
            >
              <Check
                aria-hidden="true"
                className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")}
              />
              {axis.labels[option]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Grade / subject / assessment-style filters for the practice catalogue.
 *
 * Three menus in one strip, with whatever is currently set repeated
 * underneath as removable chips. It replaces three rows of always-visible
 * pills: Subject alone is seven options and gains one with every subject
 * the taxonomy adds, so the pill rail grew a row at a time and, below `lg`,
 * had to be hidden behind a "Filters" button and a drawer. A menu is a
 * fixed size no matter how long the vocabulary gets, which is what let the
 * drawer go — the same controls now fit every viewport.
 *
 * Sticky under the 72px header so a student scrolling the grid can
 * re-filter without scrolling back up.
 */
export function PracticeFilters({
  value,
  onChange,
  onReset,
  isFiltered,
  resultCount,
}: PracticeFiltersProps) {
  /* One key at a time: opening a second menu closes the first, so two
     panels can never overlap each other. */
  const [openKey, setOpenKey] = useState<CatalogueFilterKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (openKey === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenKey(null);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenKey(null);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [openKey]);

  const handleOpenChange = useCallback(
    (key: CatalogueFilterKey, next: boolean) => setOpenKey(next ? key : null),
    [],
  );

  /* Only the axes actually narrowing the grid get a chip — an unset axis
     has nothing to remove. */
  const activeChips = AXES.filter((axis) => value[axis.key] !== ALL);

  return (
    <div
      ref={rootRef}
      className="sticky top-18 z-30 -mx-4 mb-7 bg-mm-page/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0"
    >
      <div className="rounded-2xl border border-mm-line bg-white/95 p-3 shadow-[0_1px_3px_rgba(24,21,31,0.05)] sm:p-3.5">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          {AXES.map((axis) => (
            <FilterMenu
              key={axis.key}
              axis={axis}
              active={value[axis.key]}
              open={openKey === axis.key}
              onOpenChange={(next) => handleOpenChange(axis.key, next)}
              onSelect={(next) => onChange(axis.key, next)}
            />
          ))}

          <p className="text-[13px] font-semibold text-mm-muted sm:ml-auto">
            Showing {resultCount} program{resultCount === 1 ? "" : "s"}
          </p>
        </div>

        {isFiltered && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-mm-line-soft pt-3">
            {activeChips.map((axis) => (
              <button
                key={axis.key}
                type="button"
                onClick={() => onChange(axis.key, ALL)}
                data-testid={`clear-${axis.key}-filter`}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-mm-tint-line bg-mm-tint-soft pl-3 pr-2.5 text-[13px] font-bold text-mm-brand transition-colors hover:border-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
              >
                {/* The axis is named in the accessible label but not on the
                    chip face: "Grade 3" and "Reading" already say which
                    filter they are, and repeating "Grade: Grade 3" is the
                    kind of restatement that makes a chip row unreadable. */}
                <span className="sr-only">Remove {axis.label} filter:</span>
                {axis.labels[value[axis.key]]}
                <X aria-hidden="true" className="h-3.5 w-3.5" />
              </button>
            ))}

            <button
              type="button"
              onClick={onReset}
              data-testid="reset-filters"
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[13px] font-bold text-mm-muted transition-colors hover:bg-mm-tint hover:text-mm-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
