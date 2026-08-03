"use client";

import { SlidersHorizontal, X } from "lucide-react";

import { cn } from "@/lib/cn";

import type { CatalogueFilterKey, CatalogueFilterState } from "../filter-state";
import {
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
  /** Mobile drawer open state, owned by the grid so the count stays in sync. */
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
}

function ChipGroup({
  label,
  name,
  options,
  labels,
  active,
  onSelect,
}: {
  label: string;
  name: CatalogueFilterKey;
  options: readonly string[];
  labels: Record<string, string>;
  active: string;
  onSelect: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/*
        A real <fieldset>/<legend> would be the semantic choice, but these
        are not form controls being submitted — they are toggle buttons that
        filter a list in place. role="group" + aria-label gives assistive
        technology the same grouping without claiming a form.
      */}
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap items-center gap-2"
      >
        <span className="mr-1 text-sm font-bold text-muted">{label}</span>
        {options.map((option) => {
          const isActive = option === active;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              aria-pressed={isActive}
              data-testid={`${name}-filter-${option}`}
              className={cn(
                "inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/25 focus-visible:ring-offset-2 focus-visible:ring-offset-page",
                isActive
                  /* Selected state is a filled royal chip with a ring, not a
                     tint: the previous tinted chip sat at roughly 1.6:1
                     against its neighbours, which is not a state anyone can
                     see at a glance. */
                  ? "bg-royal text-white shadow-[0_6px_16px_color-mix(in_srgb,var(--purple)_28%,transparent)]"
                  : "bg-white text-ink ring-1 ring-royal/15 hover:bg-royal/5 hover:text-royal",
              )}
            >
              {labels[option]}
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
 * Sticky under the 72px header on desktop so a student scrolling the grid
 * can re-filter without scrolling back up. Below `lg` it collapses into a
 * "Filters" button that opens a drawer — three chip rows would otherwise eat
 * most of a phone screen before the first program.
 */
export function PracticeFilters({
  value,
  onChange,
  onReset,
  isFiltered,
  resultCount,
  drawerOpen,
  onDrawerOpenChange,
}: PracticeFiltersProps) {
  const groups = (
    <>
      <ChipGroup
        label="Grade"
        name="grade"
        options={GRADE_OPTIONS}
        labels={GRADE_LABELS}
        active={value.grade}
        onSelect={(next) => onChange("grade", next)}
      />
      <ChipGroup
        label="Subject"
        name="subject"
        options={SUBJECT_OPTIONS}
        labels={SUBJECT_LABELS}
        active={value.subject}
        onSelect={(next) => onChange("subject", next)}
      />
      <ChipGroup
        label="Style"
        name="style"
        options={STYLE_OPTIONS}
        labels={STYLE_LABELS}
        active={value.style}
        onSelect={(next) => onChange("style", next)}
      />
    </>
  );

  return (
    <div className="sticky top-18 z-30 -mx-4 mb-8 bg-page/85 px-4 py-3 backdrop-blur-xl sm:mx-0 sm:px-0">
      <div className="rounded-2xl border border-royal/10 bg-white/95 p-4 shadow-[0_6px_20px_rgba(30,20,60,0.05)]">
        {/* Below lg the panel collapses to this one row. */}
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button
            type="button"
            onClick={() => onDrawerOpenChange(!drawerOpen)}
            aria-expanded={drawerOpen}
            aria-controls="practice-filter-drawer"
            data-testid="filters-toggle"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-royal px-4 text-sm font-bold text-white transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/25"
          >
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            Filters
            {isFiltered && (
              <span className="rounded-full bg-white/25 px-1.5 text-xs">On</span>
            )}
          </button>
          <p className="text-sm font-bold text-muted">
            {resultCount} program{resultCount === 1 ? "" : "s"}
          </p>
        </div>

        {/*
          One copy of the chips, shown at lg and up or when the drawer is
          open below it. Rendering a mobile set and a desktop set — each
          hidden at the other breakpoint — duplicated every chip's
          data-testid and its role="group" label in the DOM, which a
          cross-engine Playwright pass caught as a strict-mode violation the
          moment the drawer was opened on a phone viewport.
        */}
        <div
          id="practice-filter-drawer"
          className={cn(
            "flex-col gap-3",
            drawerOpen
              ? "mt-4 flex border-t border-royal/8 pt-4"
              : "hidden",
            "lg:mt-0 lg:flex lg:border-t-0 lg:pt-0",
          )}
        >
          {groups}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-royal/8 pt-3">
            <p className="hidden text-sm font-bold text-muted lg:block">
              Showing {resultCount} program{resultCount === 1 ? "" : "s"}
            </p>
            {isFiltered ? (
              <button
                type="button"
                onClick={onReset}
                data-testid="reset-filters"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-royal transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/25"
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Reset filters
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => onDrawerOpenChange(false)}
              className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-ink transition hover:bg-royal/6 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/25 lg:hidden"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
