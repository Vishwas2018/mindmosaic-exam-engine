import { describe, expect, it } from "vitest";

import { PROGRAMS } from "@/features/catalogue/catalogue";
import { resolveProgramStatuses } from "@/features/taxonomy/coverage";

/**
 * Tripwire, not a policy. Promotion in `resolveProgramStatuses` counts what
 * the bank SERVES, not what is APPROVED, and every programme gate is in
 * `report` mode. AMC-style sits a handful of questions under the catalogue
 * threshold of 30 (26 and 27 today); the day it crosses, it would go live with
 * no human approval and no failing test. This test makes that day break the
 * build instead.
 *
 * If this fails, do not edit the assertion: AMC-style and scholarship-style
 * going live is a governance decision (AGENTS.md rule 8, the report -> enforce
 * question), not a content-count side effect.
 */
describe("no AMC-style or scholarship-style programme resolves to live", () => {
  const resolved = resolveProgramStatuses(PROGRAMS);

  it("has scoped AMC-style cells to guard", () => {
    expect(resolved.some((p) => p.scope?.examStyle === "amc_style")).toBe(true);
  });

  it("keeps every amc_style cell coming_soon", () => {
    const live = resolved.filter((p) => p.scope?.examStyle === "amc_style" && p.status === "live");
    expect(live.map((p) => p.id)).toEqual([]);
  });

  it("keeps every scholarship_style cell coming_soon", () => {
    const live = resolved.filter((p) => p.scope?.examStyle === "scholarship_style" && p.status === "live");
    expect(live.map((p) => p.id)).toEqual([]);
  });

  it("keeps the unscoped australian-maths-competition card coming_soon", () => {
    const card = resolved.find((p) => p.slug === "australian-maths-competition");
    expect(card?.status).toBe("coming_soon");
  });
});
