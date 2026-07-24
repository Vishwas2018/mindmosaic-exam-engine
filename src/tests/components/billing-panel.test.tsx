import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BillingPanel } from "@/features/parent-dashboard/components/BillingPanel";
import type { MySubscriptionResult } from "@/lib/billing/subscription";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

function trialingResult(daysFromNow: number): MySubscriptionResult {
  const trialEnd = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000).toISOString();
  return {
    status: "ready",
    subscription: {
      status: "trialing",
      plan: null,
      trialEnd,
      currentPeriodEnd: null,
      seats: 3,
      hasAccess: true,
    },
  };
}

describe("BillingPanel", () => {
  it("renders the correct days-remaining text for a trial ending N days in the future", () => {
    render(<BillingPanel subscription={trialingResult(5)} />);
    expect(screen.getByText(/5 days left in your free trial/i)).toBeInTheDocument();
  });

  it("renders singular day text when exactly one day remains", () => {
    render(<BillingPanel subscription={trialingResult(1)} />);
    expect(screen.getByText(/1 day left in your free trial/i)).toBeInTheDocument();
  });

  it("shows coherent trial copy instead of the contradictory 'No plan selected yet' line", () => {
    render(<BillingPanel subscription={trialingResult(5)} />);
    expect(screen.getByText(/free trial in progress/i)).toBeInTheDocument();
    expect(screen.queryByText(/no plan selected yet/i)).not.toBeInTheDocument();
    expect(screen.getByText(/5 days left in your free trial/i)).toBeInTheDocument();
  });

  it("renders the graceful fallback instead of throwing on an error result", () => {
    render(<BillingPanel subscription={{ status: "error" }} />);
    expect(screen.getByText(/billing info unavailable/i)).toBeInTheDocument();
  });

  it("renders the graceful fallback when there is no subscription row yet", () => {
    render(<BillingPanel subscription={{ status: "ready", subscription: null }} />);
    expect(screen.getByText(/no billing plan set up yet/i)).toBeInTheDocument();
  });

  it("posts to /api/stripe/portal and redirects to the returned url on Manage billing", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://billing.stripe.com/portal-1" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<BillingPanel subscription={trialingResult(3)} />);
    await user.click(screen.getByRole("button", { name: /manage billing/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/portal", { method: "POST" });
    expect(mockRedirectTo).toHaveBeenCalledWith("https://billing.stripe.com/portal-1");
  });

  it("shows an inline error instead of crashing when the portal endpoint doesn't exist yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })),
    );

    const user = userEvent.setup();
    render(<BillingPanel subscription={trialingResult(3)} />);
    await user.click(screen.getByRole("button", { name: /manage billing/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /billing management isn't available yet/i,
    );
  });
});
