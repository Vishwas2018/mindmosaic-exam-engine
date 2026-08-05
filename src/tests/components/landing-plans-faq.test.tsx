import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Evidence } from "@/features/landing/components/Evidence";
import { Faq } from "@/features/landing/components/Faq";
import { Plans } from "@/features/landing/components/Plans";
import { Quality } from "@/features/landing/components/Quality";
import { evidence, faq, plans, quality } from "@/features/landing/content";
import { FAMILY_PLAN } from "@/lib/billing/prices";

describe("Plans", () => {
  it("renders all three tiers with a working CTA each", () => {
    render(<Plans />);
    for (const plan of plans.items) {
      expect(screen.getByText(plan.name)).toBeInTheDocument();
      expect(screen.getAllByRole("link", { name: plan.cta.label }).length).toBeGreaterThan(0);
    }
  });

  /*
   * The handoff records that pricing copy was removed from the landing
   * page's plans section at the client's request — the Plans page carries
   * it. `showPricing` is the switch, and it is off by default.
   */
  it("hides prices on the landing page and points at the Plans page instead", () => {
    render(<Plans />);
    expect(screen.queryByText(FAMILY_PLAN.monthly.display)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plans page" })).toHaveAttribute("href", "/pricing");
  });

  /*
   * Both prices have a single source of truth (src/lib/billing/prices.ts) —
   * the Plans page must show those numbers, not a placeholder, and must not
   * drift from what the Stripe checkout charges.
   */
  it("shows the real monthly and yearly prices from the billing source of truth", () => {
    render(<Plans showPricing />);
    expect(screen.getByText(FAMILY_PLAN.monthly.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.annual.display)).toBeInTheDocument();
  });

  /*
   * The design's first card is a 7-day free trial. There is no trial
   * mechanism in this product, so the free tier is the thing that is
   * genuinely free forever — guest practice — and it must never route
   * through the account form.
   */
  it("does not advertise a trial, and keeps the free tier account-free", () => {
    render(<Plans showPricing />);
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

describe("FAQ", () => {
  it("renders every question as a native disclosure", () => {
    render(<Faq />);
    for (const item of faq.items) {
      expect(screen.getByText(item.question)).toBeInTheDocument();
    }
    expect(document.querySelectorAll("details")).toHaveLength(faq.items.length);
  });

  it("keeps the assessment-style answer tied to the full disclaimer", () => {
    render(<Faq />);
    expect(
      screen.getAllByRole("link", { name: "Assessment Disclaimer" })[0],
    ).toHaveAttribute("href", "/assessment-disclaimer");
  });

  it("is honest that guest practice needs no account", () => {
    render(<Faq />);
    expect(screen.getByText(/no sign-in at all/i)).toBeInTheDocument();
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

describe("Evidence placeholders", () => {
  it("marks where verified material will sit instead of inventing social proof", () => {
    render(<Evidence />);
    for (const panel of evidence.panels) {
      expect(screen.getByText(panel.label)).toBeInTheDocument();
      expect(screen.getByText(panel.requirement)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/^Placeholder — /)).toHaveLength(evidence.panels.length);
  });
});
