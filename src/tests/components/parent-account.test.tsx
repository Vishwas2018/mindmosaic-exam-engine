import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ParentAccount } from "@/features/parent-dashboard";
import { PREVIEW_PARENT_ACCOUNT } from "@/features/parent-dashboard/fixtures";

// Mock Auth Provider
vi.mock("@/features/auth", () => ({
  useAuth: () => ({
    user: { id: "user-123", email: "priya.raman@example.com" },
    displayName: "Priya Raman",
    signOut: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: () => ({
      update: () => ({
        eq: vi.fn(async () => ({ error: null })),
      }),
    }),
  }),
}));

describe("ParentAccount Component", () => {
  it("renders guardian profile and contact details", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
        isLocalPreview={true}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Account" })).toBeInTheDocument();
    expect(screen.getByText("Illustrative sample family")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Your details" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Priya Raman")).toBeInTheDocument();
    expect(screen.getByDisplayValue("priya.raman@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(/Changing this sends a link to the new address/i),
    ).toBeInTheDocument();
  });

  it("renders password details and active devices information", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: /Password and devices/i })).toBeInTheDocument();
    expect(screen.getByText(/Last changed 3 September 2026/i)).toBeInTheDocument();
    expect(screen.getByText("3 devices")).toBeInTheDocument();
    expect(
      screen.getByText(/Changing your password does not touch your children’s PINs\./i),
    ).toBeInTheDocument();

    const changePwBtn = screen.getByRole("button", { name: "Change password" });
    expect(changePwBtn).toBeInTheDocument();
  });

  it("renders notification preferences with honest 'Not built' badges and mandatory billing email", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "What we email you" })).toBeInTheDocument();
    expect(screen.getByText("Weekly summary")).toBeInTheDocument();
    expect(screen.getByText("Written answers marked")).toBeInTheDocument();
    expect(screen.getByText("Nothing for a fortnight")).toBeInTheDocument();

    const notBuiltBadges = screen.getAllByText("Not built");
    expect(notBuiltBadges.length).toBe(3);

    const billingToggle = screen.getByLabelText("Billing notifications (mandatory)");
    expect(billingToggle).toBeDisabled();
    expect(billingToggle).toBeChecked();
    expect(
      screen.getByText(/Billing email cannot be switched off — a failed payment has to reach you\./i),
    ).toBeInTheDocument();
  });

  it("renders plan and billing card with child places usage", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Plan & billing" })).toBeInTheDocument();
    expect(screen.getByText("Family · A$19.90 a month")).toBeInTheDocument();
    expect(screen.getByText("3 December 2026")).toBeInTheDocument();
    expect(screen.getByText("2 of 3 used")).toBeInTheDocument();

    const handoffLink = screen.getByRole("link", { name: /Open Plan & billing →/i });
    expect(handoffLink).toHaveAttribute("href", "/parent/account/billing");
  });

  it("opens ADR-012 compliant account deletion request modal without fake instant deletion", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
      />,
    );

    const askDeleteBtn = screen.getByRole("button", { name: "Ask us to delete the account" });
    fireEvent.click(askDeleteBtn);

    expect(screen.getByRole("heading", { level: 2, name: "Ask us to delete the account" })).toBeInTheDocument();
    expect(screen.getByText("ADR-012 §4")).toBeInTheDocument();
    expect(screen.getByText(/out-of-band confirmation with the account owner/i)).toBeInTheDocument();

    const mailtoLink = screen.getByRole("link", { name: /Open email draft →/i });
    expect(mailtoLink).toHaveAttribute("href", expect.stringContaining("mailto:hello@mindmosaic.app"));
  });

  it("renders signing out actions with children independence disclaimer", () => {
    render(
      <ParentAccount
        initialAccount={PREVIEW_PARENT_ACCOUNT}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Signing out" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /Your children sign out separately — signing yourself out does not sign them out\./i,
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out everywhere" })).toBeInTheDocument();
  });

  /* A real family's page is given only what the server could read. Nothing else may be filled in: these values
     used to fall back to a sample family's (A$19.90 a month, 3 December 2026, 2 of 3 used, 1 device). */
  it("shows no price, renewal date, seat count, device count or password date it was not given", () => {
    render(
      <ParentAccount
        initialAccount={{ name: "Sam Lee", email: "sam@example.com", planName: "Free family beta", placesUsed: 2 }}
      />,
    );

    expect(screen.getByText("Free family beta")).toBeInTheDocument();
    expect(screen.getByText("2 linked")).toBeInTheDocument();
    expect(screen.queryByText(/A\$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/next payment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/of \d+ used/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/signed in on/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last changed/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
  });
});
