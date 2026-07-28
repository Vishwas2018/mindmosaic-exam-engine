import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SubscriptionOverviewCard } from "@/features/billing/components/SubscriptionOverviewCard";
import type { MySubscriptionDetails } from "@/lib/billing/subscription";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

function activeSubscription(overrides: Partial<MySubscriptionDetails> = {}): MySubscriptionDetails {
  return {
    status: "active",
    plan: "family_monthly",
    trialEnd: null,
    currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
    seats: 3,
    hasAccess: true,
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("SubscriptionOverviewCard", () => {
  it("shows the plan label and status badge", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ cancelAtPeriodEnd: false, currentPeriodEnd: null })),
    );
    render(<SubscriptionOverviewCard subscription={activeSubscription()} />);
    expect(screen.getByText("Family (monthly)")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows a past-due warning when the subscription is past_due", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ cancelAtPeriodEnd: false, currentPeriodEnd: null })),
    );
    render(<SubscriptionOverviewCard subscription={activeSubscription({ status: "past_due" })} />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/last payment didn't go through/i);
  });

  it("cancels the subscription and shows the end-of-period message", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/stripe/status") {
        return Promise.resolve(jsonResponse({ cancelAtPeriodEnd: false, currentPeriodEnd: null }));
      }
      if (url === "/api/stripe/cancel") {
        return Promise.resolve(
          jsonResponse({ cancelAtPeriodEnd: true, currentPeriodEnd: "2026-08-01T00:00:00.000Z" }),
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<SubscriptionOverviewCard subscription={activeSubscription()} />);

    const cancelButton = await screen.findByRole("button", { name: /cancel subscription/i });
    await user.click(cancelButton);
    await user.click(screen.getByRole("button", { name: "Yes, cancel" }));

    expect(await screen.findByRole("button", { name: /undo cancellation/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/cancel", { method: "POST" });
  });

  it("shows undo cancellation when already set to cancel at period end, and reverses it", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/stripe/status") {
        return Promise.resolve(
          jsonResponse({ cancelAtPeriodEnd: true, currentPeriodEnd: "2026-08-01T00:00:00.000Z" }),
        );
      }
      if (url === "/api/stripe/resume") {
        return Promise.resolve(jsonResponse({ cancelAtPeriodEnd: false }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<SubscriptionOverviewCard subscription={activeSubscription()} />);

    await user.click(await screen.findByRole("button", { name: /undo cancellation/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/stripe/resume", { method: "POST" });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /undo cancellation/i })).not.toBeInTheDocument();
    });
  });

  it("opens the billing portal from Manage payment details", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/stripe/status") {
        return Promise.resolve(jsonResponse({ cancelAtPeriodEnd: false, currentPeriodEnd: null }));
      }
      if (url === "/api/stripe/portal") {
        return Promise.resolve(jsonResponse({ url: "https://billing.stripe.com/portal-1" }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<SubscriptionOverviewCard subscription={activeSubscription()} />);
    await user.click(screen.getByRole("button", { name: /manage payment details/i }));

    expect(mockRedirectTo).toHaveBeenCalledWith("https://billing.stripe.com/portal-1");
  });
});
