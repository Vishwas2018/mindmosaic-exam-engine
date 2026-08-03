import { describe, expect, it } from "vitest";

import type { Program } from "@/features/catalogue/catalogue";
import {
  DEFAULT_FILTERS,
  filtersToQuery,
  isFiltered,
  matchesFilters,
  parseFilters,
} from "@/features/catalogue/filter-state";
import { estimatedDurationLabel } from "@/features/catalogue/presentation";

const G3_NAPLAN_NUMERACY = {
  id: "a",
  slug: "a",
  name: "a",
  blurb: "b",
  status: "live",
  scope: { yearLevel: 3, examStyle: "naplan_style", subject: "numeracy", initialBankId: "curated" },
} as Program;

const UNSCOPED = { id: "m", slug: "m", name: "m", blurb: "b", status: "live" } as Program;

describe("catalogue filter state", () => {
  it("defaults every dimension to all with no query", () => {
    expect(parseFilters(null)).toEqual(DEFAULT_FILTERS);
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it("reads recognised values out of the query", () => {
    expect(parseFilters(new URLSearchParams("grade=5&subject=reading&style=icas_style"))).toEqual({
      grade: "5",
      subject: "reading",
      style: "icas_style",
    });
  });

  /* A hand-typed or stale value must not filter the grid to nothing with no
     way for the reader to tell why. */
  it("falls back to all for an unrecognised value", () => {
    expect(parseFilters(new URLSearchParams("grade=9&subject=chemistry"))).toEqual(
      DEFAULT_FILTERS,
    );
  });

  it("writes only non-default values to the query", () => {
    expect(filtersToQuery(DEFAULT_FILTERS)).toBe("");
    expect(filtersToQuery({ grade: "3", subject: "all", style: "icas_style" })).toBe(
      "?grade=3&style=icas_style",
    );
  });

  it("round-trips any state through the query", () => {
    const state = { grade: "5", subject: "language", style: "naplan_style" };
    expect(parseFilters(new URLSearchParams(filtersToQuery(state).slice(1)))).toEqual(state);
  });

  it("knows whether anything is filtered", () => {
    expect(isFiltered(DEFAULT_FILTERS)).toBe(false);
    expect(isFiltered({ ...DEFAULT_FILTERS, style: "icas_style" })).toBe(true);
  });

  it("matches a program on every dimension at once", () => {
    expect(matchesFilters(G3_NAPLAN_NUMERACY, DEFAULT_FILTERS)).toBe(true);
    expect(
      matchesFilters(G3_NAPLAN_NUMERACY, { grade: "3", subject: "numeracy", style: "naplan_style" }),
    ).toBe(true);
    expect(matchesFilters(G3_NAPLAN_NUMERACY, { ...DEFAULT_FILTERS, grade: "5" })).toBe(false);
    expect(matchesFilters(G3_NAPLAN_NUMERACY, { ...DEFAULT_FILTERS, style: "icas_style" })).toBe(
      false,
    );
  });

  /* The unscoped program pins nothing, so it can never be "the Grade 3 one"
     — it is rendered outside the filtered set as its own pathway. */
  it("never matches an unscoped program", () => {
    expect(matchesFilters(UNSCOPED, DEFAULT_FILTERS)).toBe(false);
  });
});

describe("estimated duration", () => {
  it("offers only the lengths the available questions can fill", () => {
    expect(estimatedDurationLabel(64)).toBe("Approx. 15–45 min");
    expect(estimatedDurationLabel(30)).toBe("Approx. 15–45 min");
    expect(estimatedDurationLabel(29)).toBe("Approx. 15–30 min");
    expect(estimatedDurationLabel(17)).toBe("Approx. 15 min");
  });

  it("promises nothing when even the shortest sitting cannot be filled", () => {
    expect(estimatedDurationLabel(9)).toBeNull();
    expect(estimatedDurationLabel(0)).toBeNull();
  });
});
