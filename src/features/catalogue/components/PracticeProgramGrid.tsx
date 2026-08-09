"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { Program } from "../catalogue";
import { isProgramLocked, type StudentPlan } from "../entitlement";
import {
  DEFAULT_FILTERS,
  filtersToQuery,
  isFiltered as isFilteredState,
  matchesFilters,
  parseFilters,
  type CatalogueFilterKey,
  type CatalogueFilterState,
} from "../filter-state";
import { BuildYourOwnCard } from "./BuildYourOwnCard";
import { CatalogueEmptyState } from "./CatalogueEmptyState";
import { PracticeFilters } from "./PracticeFilters";
import { LockedProgramCard, PracticeProgramCard } from "./PracticeProgramCard";

export interface PracticeProgramGridProps {
  programs: readonly Program[];
  /** The unscoped configurator entry, rendered as its own pathway card. */
  buildYourOwn?: Program;
  plan?: StudentPlan;
  /** Program id -> questions its starting bank can serve, computed server-side. */
  questionCounts?: Readonly<Record<string, number>>;
  /**
   * Filters parsed from the request's own query string by the server page.
   *
   * Deliberately a prop rather than a `useSearchParams()` call inside this
   * component. On a statically rendered route, `useSearchParams` forces Next
   * to bail its whole Suspense boundary out to client-side rendering — which
   * meant the production HTML for /practice contained a skeleton and no
   * program cards at all, invisible in dev (where everything re-renders
   * anyway) and caught only by the e2e run against a real build. Taking the
   * initial state as a prop keeps every card in the server-rendered markup.
   */
  initialFilters?: CatalogueFilterState;
}

/**
 * The filterable practice catalogue.
 *
 * Filter state lives in the URL, not component state: a filtered view is
 * then a link a parent or teacher can send ("here, Grade 3 reading"), it
 * survives a refresh and the browser Back button steps through it. Written
 * with `router.replace` and `scroll: false` so filtering does not pile up
 * history entries or jump the page to the top.
 */
export function PracticeProgramGrid({
  programs,
  buildYourOwn,
  plan = "free",
  questionCounts,
  initialFilters = DEFAULT_FILTERS,
}: PracticeProgramGridProps) {
  const router = useRouter();
  const pathname = usePathname();

  /*
   * The URL is where filter state is published, but it is not what this
   * component renders from. router.replace() is asynchronous, so deriving the
   * chips from the query on every render meant two quick clicks both read the
   * pre-update value and the second silently dropped the first (Grade 3 then
   * ICAS-style landed on ?style=icas_style with the grade lost). Local state
   * is the source of truth for rendering, seeded from the server-parsed
   * filters; the URL is written from it.
   */
  const [filters, setFilters] = useState(initialFilters);
  const lastWritten = useRef(filtersToQuery(initialFilters));

  /*
   * Back/Forward. `router.replace` does not fire popstate, so this only ever
   * sees a genuine history move — and the guard against `lastWritten` means a
   * move that lands back on our own current state is a no-op rather than a
   * redundant re-render.
   */
  useEffect(() => {
    const onPopState = () => {
      const parsed = parseFilters(new URLSearchParams(window.location.search));
      const canonical = filtersToQuery(parsed);
      if (canonical === lastWritten.current) return;
      lastWritten.current = canonical;
      setFilters(parsed);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const isFiltered = isFilteredState(filters);

  const write = useCallback(
    (next: typeof filters) => {
      setFilters(next);
      const nextQuery = filtersToQuery(next);
      lastWritten.current = nextQuery;
      router.replace(`${pathname}${nextQuery}`, { scroll: false });
    },
    [pathname, router],
  );

  const handleChange = useCallback(
    (key: CatalogueFilterKey, value: string) => write({ ...filters, [key]: value }),
    [filters, write],
  );

  const handleReset = useCallback(() => write({ ...DEFAULT_FILTERS }), [write]);

  const matched = programs.filter((program) => matchesFilters(program, filters));

  return (
    <div>
      <PracticeFilters
        value={filters}
        onChange={handleChange}
        onReset={handleReset}
        isFiltered={isFiltered}
        resultCount={matched.length}
      />

      {/*
        The count is announced politely rather than the grid itself: a screen
        reader hearing "8 programs match your filters" after pressing a chip
        learns the outcome without the whole list being re-read.
      */}
      <p aria-live="polite" className="sr-only" data-testid="filter-result-announcement">
        {matched.length} practice program{matched.length === 1 ? "" : "s"}{" "}
        {isFiltered ? "match your filters" : "available"}
      </p>

      {matched.length === 0 ? (
        <CatalogueEmptyState onClearFilters={handleReset} />
      ) : (
        <ul
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
          data-testid="program-grid"
        >
          {matched.map((program) => (
            <li key={program.id}>
              {isProgramLocked(program, plan) ? (
                <LockedProgramCard program={program} />
              ) : (
                <PracticeProgramCard
                  program={program}
                  questionCount={questionCounts?.[program.id]}
                />
              )}
            </li>
          ))}
        </ul>
      )}

      {buildYourOwn && (
        <section aria-labelledby="build-your-own-heading" className="mt-12">
          <h2
            id="build-your-own-heading"
            className="text-[clamp(22px,2.4vw,30px)] font-bold leading-[1.2] text-mm-ink"
          >
            Prefer to choose everything yourself?
          </h2>
          <div className="mt-5">
            <BuildYourOwnCard program={buildYourOwn} />
          </div>
        </section>
      )}
    </div>
  );
}
