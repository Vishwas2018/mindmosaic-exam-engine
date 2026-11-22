import { describe, expect, it } from "vitest";

import {
  annualPerMonthDisplay,
  annualSavingsPercent,
  FAMILY_PLAN,
  INDIVIDUAL_PLAN,
  maxChildrenForPlan,
} from "@/lib/billing/prices";

describe("maxChildrenForPlan", () => {
  it("caps Individual at one child", () => {
    expect(maxChildrenForPlan("individual_monthly")).toBe(1);
    expect(maxChildrenForPlan("individual_annual")).toBe(1);
  });

  it("keeps three for Family, trials and accounts with no plan", () => {
    expect(maxChildrenForPlan("family_monthly")).toBe(FAMILY_PLAN.maxChildren);
    expect(maxChildrenForPlan("family_annual")).toBe(3);
    expect(maxChildrenForPlan(null)).toBe(3);
    expect(maxChildrenForPlan(undefined)).toBe(3);
  });
});

describe("price helpers", () => {
  it("derives annual savings and per-month price from the configured amounts", () => {
    expect(annualSavingsPercent(INDIVIDUAL_PLAN)).toBe(17);
    expect(annualSavingsPercent(FAMILY_PLAN)).toBe(30);
    expect(annualPerMonthDisplay(INDIVIDUAL_PLAN)).toBe("A$12.42");
    expect(annualPerMonthDisplay(FAMILY_PLAN)).toBe("A$14.08");
  });
});
