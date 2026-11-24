import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FAMILY_PLAN, INDIVIDUAL_PLAN } from "@/lib/billing/prices";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

/** Mocks availability explicitly so checkout tests don't ride on the live flag. */
async function renderWithAvailability(availability: "purchasable" | "roadmap") {
  const { PricingPlans } = await import("@/features/billing/components/PricingPlans");
  render(<PricingPlans availability={{ individual: availability, family: availability }} />);
}

describe("PricingPlans pricing", () => {
  it("uses the agreed prices", () => {
    expect(INDIVIDUAL_PLAN.monthly.amount).toBe(14.99);
    expect(INDIVIDUAL_PLAN.annual.amount).toBe(149);
    expect(FAMILY_PLAN.monthly.amount).toBe(19.99);
    expect(FAMILY_PLAN.annual.amount).toBe(169);
  });

  it("shows all three tiers with the free tier limited to sample questions", async () => {
    await renderWithAvailability("roadmap");
    expect(screen.getByText("Practise as a guest, no account needed")).toBeInTheDocument();
    expect(screen.queryByText(/sample questions in every programme/i)).not.toBeInTheDocument();
    expect(screen.getByText("Individual")).toBeInTheDocument();
    expect(screen.getByText("Family")).toBeInTheDocument();
  });

  it("defaults to annual and switches to monthly prices when toggled", async () => {
    await renderWithAvailability("roadmap");
    expect(screen.getByText(INDIVIDUAL_PLAN.annual.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.annual.display)).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("radio", { name: /monthly/i }));

    expect(screen.getByText(INDIVIDUAL_PLAN.monthly.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.monthly.display)).toBeInTheDocument();
    expect(screen.queryByText(FAMILY_PLAN.annual.display)).not.toBeInTheDocument();
  });
});

describe("PricingPlans while paid plans are not purchasable", () => {
  it("offers Register interest and never a Subscribe button", async () => {
    await renderWithAvailability("roadmap");
    expect(screen.getAllByRole("link", { name: "Register interest" })).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /subscribe/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start free" })).toHaveAttribute("href", "/sign-up");
  });
});

describe("PricingPlans when the paid plans are purchasable", () => {
  it("posts individual_annual from the Individual card", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/i1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await renderWithAvailability("purchasable");

    await userEvent.setup().click(screen.getByRole("button", { name: /subscribe to individual/i }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ plan: "individual_annual" });
    expect(mockRedirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/i1");
  });

  it("tells a signed-out visitor to sign in instead of failing silently", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 401 })));
    await renderWithAvailability("purchasable");

    await userEvent.setup().click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/sign in with your parent account/i);
  });

  it("posts family_annual by default and redirects to the returned url", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/s1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await renderWithAvailability("purchasable");

    await userEvent.setup().click(screen.getByRole("button", { name: /subscribe to family/i }));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/stripe/checkout");
    expect(JSON.parse(init.body)).toEqual({ plan: "family_annual" });
    expect(mockRedirectTo).toHaveBeenCalledWith("https://checkout.stripe.com/s1");
  });

  it("posts family_monthly after switching the cycle", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ url: "https://checkout.stripe.com/s2" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    await renderWithAvailability("purchasable");

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: /monthly/i }));
    await user.click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ plan: "family_monthly" });
  });

  it("shows an inline error when checkout fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 404 })));
    await renderWithAvailability("purchasable");

    await userEvent.setup().click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/checkout isn't available yet/i);
    expect(mockRedirectTo).not.toHaveBeenCalled();
  });
});
