import type { Program } from "./catalogue";

/**
 * Catalogue filter vocabulary and the pure functions over it.
 *
 * Kept out of the components so the filter logic is testable without a DOM,
 * and so the chip labels, the URL parameter values and the matcher can never
 * disagree about what "language" means.
 */
export type CatalogueFilterKey = "grade" | "subject" | "style";

export interface CatalogueFilterState {
  grade: string;
  subject: string;
  style: string;
}

export const ALL = "all";

export const GRADE_OPTIONS = [ALL, "3", "5"] as const;
export const SUBJECT_OPTIONS = [ALL, "numeracy", "reading", "language"] as const;
export const STYLE_OPTIONS = [ALL, "naplan_style", "icas_style"] as const;

export const GRADE_LABELS: Record<string, string> = {
  all: "All grades",
  "3": "Grade 3",
  "5": "Grade 5",
};

export const SUBJECT_LABELS: Record<string, string> = {
  all: "All subjects",
  numeracy: "Numeracy",
  reading: "Reading",
  language: "Language Conventions",
};

export const STYLE_LABELS: Record<string, string> = {
  all: "All styles",
  naplan_style: "NAPLAN-style",
  icas_style: "ICAS-style",
};

export const DEFAULT_FILTERS: CatalogueFilterState = {
  grade: ALL,
  subject: ALL,
  style: ALL,
};

const VALID: Record<CatalogueFilterKey, readonly string[]> = {
  grade: GRADE_OPTIONS,
  subject: SUBJECT_OPTIONS,
  style: STYLE_OPTIONS,
};

/**
 * Reads filter state out of a URL query, ignoring anything it does not
 * recognise. A hand-typed or stale `?subject=chemistry` falls back to "all"
 * rather than filtering the grid down to nothing with no way to tell why.
 */
export function parseFilters(params: URLSearchParams | null): CatalogueFilterState {
  if (!params) return { ...DEFAULT_FILTERS };
  const read = (key: CatalogueFilterKey) => {
    const raw = params.get(key);
    return raw !== null && VALID[key].includes(raw) ? raw : ALL;
  };
  return { grade: read("grade"), subject: read("subject"), style: read("style") };
}

/** Only non-default values reach the URL, so an unfiltered page stays clean. */
export function filtersToQuery(filters: CatalogueFilterState): string {
  const params = new URLSearchParams();
  for (const key of ["grade", "subject", "style"] as const) {
    if (filters[key] !== ALL) params.set(key, filters[key]);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function isFiltered(filters: CatalogueFilterState): boolean {
  return (
    filters.grade !== ALL || filters.subject !== ALL || filters.style !== ALL
  );
}

export function matchesFilters(program: Program, filters: CatalogueFilterState): boolean {
  const scope = program.scope;
  if (!scope) return false;
  return (
    (filters.grade === ALL || String(scope.yearLevel) === filters.grade) &&
    (filters.subject === ALL || scope.subject === filters.subject) &&
    (filters.style === ALL || scope.examStyle === filters.style)
  );
}
