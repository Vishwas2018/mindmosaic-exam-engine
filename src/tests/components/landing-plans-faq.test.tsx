import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Plans } from "@/features/landing/components/Plans";
import { Quality } from "@/features/landing/components/Quality";
import { plans, quality } from "@/features/landing/content";

describe("Plans", () => {
  it("renders all three tiers with a working CTA each", () => {
    render(<Plans />);
    for (const plan of plans.items) {
      expect(screen.getByText(plan.name)).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: plan.cta.label }).length).toBeGreaterThan(0);
    }
  });

  it("shows the agreed prices, taken from the billing config", () => {
    render(<Plans />);
    expect(screen.getByText("A$0")).toBeInTheDocument();
    expect(screen.getByText("A$14.99")).toBeInTheDocument();
    expect(screen.getByText("A$19.99")).toBeInTheDocument();
    expect(screen.getByText(/or A\$149 a year/)).toBeInTheDocument();
    expect(screen.getByText(/or A\$169 a year/)).toBeInTheDocument();
  });

  it("describes the free tier as a sample, not unlimited practice", () => {
    render(<Plans />);
    expect(screen.getAllByText(/5 sample questions/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/unlimited/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();

    const free = plans.items.find((plan) => plan.id === "free");
    expect(free?.cta.href).toBe("/practice");
    expect(screen.getByRole("link", { name: free!.cta.label })).toHaveAttribute("href", "/practice");
  });
});

describe("Quality standards", () => {
  it("numbers the standards from the list itself, so the count cannot drift", () => {
    render(<Quality />);
    expect(quality.standards).toHaveLength(10);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    // The design file shipped "09" twice; a duplicate must not come back.
    expect(screen.getAllByText("09")).toHaveLength(1);
  });
});
