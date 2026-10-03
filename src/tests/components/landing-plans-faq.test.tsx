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

  /*
   * No public page may show a real Family-plan figure: src/lib/billing/
   * prices.ts's amounts are placeholders (FAMILY_PLAN_AVAILABILITY ===
   * "roadmap"), and /pricing is a public page like any other. Both the
   * monthly and annual cards show the literal string "Price to be
   * confirmed" and route to "Register interest", never a real number or a
   * "Subscribe" link to a checkout that cannot yet charge anything.
   */
  it("never shows a real Family-plan price, and routes both paid cards to Register interest", () => {
    render(<Plans />);
    expect(screen.queryByText("$14.99")).not.toBeInTheDocument();
    expect(screen.queryByText("$149")).not.toBeInTheDocument();
    expect(screen.getAllByText("Price to be confirmed")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Register interest" })).toHaveLength(2);
  });

  /*
   * The design's first card is a 7-day free trial. There is no trial
   * mechanism in this product, so the free tier is the thing that is
   * genuinely free forever — guest practice — and it must never route
   * through the account form.
   */
  it("does not advertise a trial, and keeps the free tier account-free", () => {
    render(<Plans />);
    expect(screen.queryByText(/7[- ]day/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();

    const free = plans.items.find((plan) => plan.id === "free");
    expect(free?.cta.href).toBe("/practice");
    expect(screen.getByRole("link", { name: free!.cta.label })).toHaveAttribute(
      "href",
      "/practice",
    );
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
