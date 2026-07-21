import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FamilyPlanCard } from "@/features/billing/components/FamilyPlanCard";
import { FAMILY_PLAN } from "@/lib/billing/prices";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

describe("FamilyPlanCard", () => {
  it("shows the monthly GST-inclusive AUD price from the config by default", () => {
    render(<FamilyPlanCard />);
    expect(screen.getByText(FAMILY_PLAN.monthly.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.monthly.period)).toBeInTheDocument();
    expect(screen.queryByText(FAMILY_PLAN.annual.display)).not.toBeInTheDocument();
  });

  it("switches the displayed price to the annual config value when toggled", async () => {
    const user = userEvent.setup();
    render(<FamilyPlanCard />);

    await user.click(screen.getByRole("radio", { name: "Annual" }));

    expect(screen.getByText(FAMILY_PLAN.annual.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.annual.period)).toBeInTheDocument();
    expect(screen.queryByText(FAMILY_PLAN.monthly.display)).not.toBeInTheDocument();
  });

  it("posts family_monthly to /api/stripe/checkout by default and redirects to the returned url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/session-1" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<FamilyPlanCard />);
    await user.click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/stripe/checkout");
    expect(JSON.parse(init.body)).toEqual({ plan: "family_monthly" });
    expect(mockRedirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/session-1");
  });

  it("posts family_annual to /api/stripe/checkout when the annual toggle is selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/session-2" }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(<FamilyPlanCard />);
    await user.click(screen.getByRole("radio", { name: "Annual" }));
    await user.click(screen.getByRole("button", { name: /subscribe to family/i }));

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ plan: "family_annual" });
    expect(mockRedirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/session-2");
  });

  it("shows an inline error instead of crashing when the checkout endpoint doesn't exist yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("Not Found", { status: 404 })),
    );

    const user = userEvent.setup();
    render(<FamilyPlanCard />);
    await user.click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /checkout isn't available yet/i,
    );
    expect(mockRedirectTo).not.toHaveBeenCalled();
  });
});
