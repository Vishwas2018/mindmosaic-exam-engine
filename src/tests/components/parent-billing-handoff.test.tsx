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
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Plan & billing" })).toBeInTheDocument();
    expect(screen.getByText("Secure Billing Management:")).toBeInTheDocument();
    expect(
      screen.getByText(
        /MindMosaic family memberships are securely handled with Stripe\./i
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
  });

  it("renders current membership details accurately", () => {
    render(<ParentBillingHandoff membership={mockMembership} />);

    expect(screen.getByRole("heading", { level: 2, name: "Current membership" })).toBeInTheDocument();
    expect(screen.getByText("Family · A$19.90 per month")).toBeInTheDocument();
    expect(screen.getByText("Up to 3 · 2 in use")).toBeInTheDocument();
    expect(screen.getByText("A$19.90 on 3 December 2026")).toBeInTheDocument();
    expect(screen.getByText("Visa ending 4242")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Change plan" })).toHaveAttribute("href", "/pricing");
    expect(screen.getByRole("button", { name: "Payment methods" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Invoices" })).toBeInTheDocument();
  });

  it("renders 'Coming back' card with link back to Account", () => {
    render(<ParentBillingHandoff membership={mockMembership} />);

    expect(screen.getByRole("heading", { level: 2, name: "Coming back" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Every billing action returns here to your Account rather than the home page\./i
      )
    ).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /← Back to Account/i });
    expect(backLink).toHaveAttribute("href", "/parent/account");
  });

  it("disallows billing execution in preview mode with safe notification", () => {
    render(
      <ParentBillingHandoff
        membership={mockMembership}
        isLocalPreview={true}
      />
    );

    const payMethodsBtn = screen.getByRole("button", { name: "Payment methods" });
    fireEvent.click(payMethodsBtn);

    expect(
      screen.getByText(/Stripe billing actions are illustrative and disabled in isolated preview mode\./i)
    ).toBeInTheDocument();
  });
});
