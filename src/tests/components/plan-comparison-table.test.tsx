import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PlanComparisonTable } from "@/features/billing/components/PlanComparisonTable";
import { FAMILY_PLAN } from "@/lib/billing/prices";

describe("PlanComparisonTable", () => {
  it("shows both plan columns with the configured Family plan prices", () => {
    render(<PlanComparisonTable />);
    expect(screen.getByRole("columnheader", { name: /free/i })).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.name, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(FAMILY_PLAN.monthly.display.replace("$", "\\$")))).toBeInTheDocument();
  });

  it("lists feature rows comparing free and Family", () => {
    render(<PlanComparisonTable />);
    expect(screen.getByText("Progress dashboard")).toBeInTheDocument();
    expect(screen.getByText("Learning observations & recommendations")).toBeInTheDocument();
    expect(screen.getByText(`Up to ${FAMILY_PLAN.maxChildren}`)).toBeInTheDocument();
  });
});
