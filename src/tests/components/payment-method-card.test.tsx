import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PaymentMethodCard } from "@/features/billing/components/PaymentMethodCard";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("PaymentMethodCard", () => {
  it("shows the card brand, last 4 digits and expiry once loaded", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ paymentMethod: { brand: "visa", last4: "4242", expMonth: 4, expYear: 2030 } }),
      ),
    );
    render(<PaymentMethodCard />);
    expect(await screen.findByText(/visa ending in 4242/i)).toBeInTheDocument();
    expect(screen.getByText(/04\/2030/)).toBeInTheDocument();
  });

  it("shows a no-card message when there is none on file", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ paymentMethod: null })));
    render(<PaymentMethodCard />);
    expect(await screen.findByText(/no card on file yet/i)).toBeInTheDocument();
  });

  it("shows a graceful fallback instead of crashing when the request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("error", { status: 500 })));
    render(<PaymentMethodCard />);
    expect(await screen.findByText(/payment method info unavailable/i)).toBeInTheDocument();
  });

  it("opens the billing portal from Update payment method", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url === "/api/stripe/payment-method") {
        return Promise.resolve(jsonResponse({ paymentMethod: null }));
      }
      if (url === "/api/stripe/portal") {
        return Promise.resolve(jsonResponse({ url: "https://billing.stripe.com/portal-9" }));
      }
      throw new Error(`unexpected fetch: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<PaymentMethodCard />);
    await screen.findByText(/no card on file yet/i);
    await user.click(screen.getByRole("button", { name: /update payment method/i }));

    expect(mockRedirectTo).toHaveBeenCalledWith("https://billing.stripe.com/portal-9");
  });
});
