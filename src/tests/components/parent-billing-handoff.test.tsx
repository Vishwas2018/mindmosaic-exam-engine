import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ParentBillingHandoff } from "@/features/parent-dashboard";

const mockMembership = {
  planName: "Family",
  planPrice: "A$19.90 per month",
  seatsCovered: "Up to 3 · 2 in use",
  nextPayment: "A$19.90 on 3 December 2026",
  cardBrand: "Visa",
  cardLast4: "4242",
};

describe("ParentBillingHandoff Component", () => {
  it("renders breadcrumbs and boundary notice for plan & billing", () => {
    render(
      <ParentBillingHandoff
        membership={mockMembership}
        isLocalPreview={true}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Plan & billing" })).toBeInTheDocument();
    expect(screen.getByText("Designed on the other canvas.")).toBeInTheDocument();
    expect(
      screen.getByText(
        /The 35 Plan & billing artboards — checkout, plan changes, cards, failed payments, cancelling and invoices — are a separate piece of work\./i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
  });

  it("renders current membership details accurately", () => {
    render(
      <ParentBillingHandoff
        membership={mockMembership}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Current membership" })).toBeInTheDocument();
    expect(screen.getByText("Family · A$19.90 per month")).toBeInTheDocument();
    expect(screen.getByText("Up to 3 · 2 in use")).toBeInTheDocument();
    expect(screen.getByText("A$19.90 on 3 December 2026")).toBeInTheDocument();
    expect(screen.getByText("Visa ending 4242")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Change plan" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("button", { name: "Payment methods" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invoices" })).toBeInTheDocument();
  });

  it("renders 'Coming back' card with link back to Account and dependency badge", () => {
    render(
      <ParentBillingHandoff
        membership={mockMembership}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Coming back" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Every billing screen returns here, to Account, rather than to the parent home page\./i,
      ),
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /← Back to Account/i });
    expect(backLink).toHaveAttribute("href", "/parent/account");

    expect(screen.getByText("NEEDS A BUILD")).toBeInTheDocument();
    expect(
      screen.getByText(/Both Stripe routes currently return to/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A per-flow return path is on the billing dependency list and is what makes this true\./i),
    ).toBeInTheDocument();
  });

  it("disallows billing execution in preview mode with safe notification", () => {
    render(
      <ParentBillingHandoff
        membership={mockMembership}
        isLocalPreview={true}
      />,
    );

    const payMethodsBtn = screen.getByRole("button", { name: "Payment methods" });
    fireEvent.click(payMethodsBtn);

    expect(
      screen.getByText(/Stripe billing actions are illustrative and disabled in isolated preview mode\./i),
    ).toBeInTheDocument();
  });
});
