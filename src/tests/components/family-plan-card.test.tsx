import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FAMILY_PLAN, FAMILY_PLAN_AVAILABILITY } from "@/lib/billing/prices";

const mockRedirectTo = vi.fn();
vi.mock("@/lib/browser-redirect", () => ({
  redirectTo: (url: string) => mockRedirectTo(url),
}));

afterEach(() => {
  vi.unstubAllGlobals();
  mockRedirectTo.mockReset();
});

/**
 * Both branches mock FAMILY_PLAN_AVAILABILITY explicitly rather than one of
 * them riding on whatever prices.ts currently says. Before this, the
 * checkout tests used the real constant and the roadmap test mocked around
 * it, so flipping the flag to "roadmap" for audit finding C-02 broke five
 * tests that were only ever meant to cover the checkout code path. That
 * path still exists and still has to work when the flag is flipped back —
 * it just isn't what the product renders today.
 */
async function renderWithAvailability(availability: "purchasable" | "roadmap") {
  vi.resetModules();
  vi.doMock("@/lib/billing/prices", async () => {
    const actual =
      await vi.importActual<typeof import("@/lib/billing/prices")>("@/lib/billing/prices");
    return { ...actual, FAMILY_PLAN_AVAILABILITY: availability };
  });
  const { FamilyPlanCard: Card } = await import(
    "@/features/billing/components/FamilyPlanCard"
  );
  render(<Card />);
}

afterEach(() => {
  vi.doUnmock("@/lib/billing/prices");
  vi.resetModules();
});

describe("FamilyPlanCard when the Family plan is purchasable", () => {
  beforeEach(async () => {
    await renderWithAvailability("purchasable");
  });

  it("shows the monthly GST-inclusive AUD price from the config by default", () => {
    expect(screen.getByText(FAMILY_PLAN.monthly.display)).toBeInTheDocument();
    expect(screen.getByText(FAMILY_PLAN.monthly.period)).toBeInTheDocument();
    expect(screen.queryByText(FAMILY_PLAN.annual.display)).not.toBeInTheDocument();
  });

  it("switches the displayed price to the annual config value when toggled", async () => {
    const user = userEvent.setup();

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
    await user.click(screen.getByRole("button", { name: /subscribe to family/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /checkout isn't available yet/i,
    );
    expect(mockRedirectTo).not.toHaveBeenCalled();
  });
});

describe("FamilyPlanCard when the Family plan is on the roadmap", () => {
  beforeEach(async () => {
    await renderWithAvailability("roadmap");
  });

  it("renders a 'Coming soon' notice instead of a live Subscribe form", () => {
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /subscribe to family/i })).not.toBeInTheDocument();
  });

  /*
   * C-02: the roadmap card must not quote a price. The displayed amounts
   * are placeholders not linked to a live Stripe price, so showing one
   * beside any call to action is the thing this state exists to prevent.
   */
  it("shows no price and no billing-cycle toggle", () => {
    expect(screen.queryByText(FAMILY_PLAN.monthly.display)).not.toBeInTheDocument();
    expect(screen.queryByText(FAMILY_PLAN.annual.display)).not.toBeInTheDocument();
    expect(screen.queryByRole("radiogroup", { name: "Billing cycle" })).not.toBeInTheDocument();
  });

  /*
   * Deliberately "Register interest" -> /contact, matching content.ts's own
   * `paidCta` fallback. Not a waitlist: no waitlist mechanism exists, and
   * swapping one unsupported claim for another is not containment.
   */
  it("offers Register interest pointing at the real contact page", () => {
    const link = screen.getByRole("link", { name: "Register interest" });
    expect(link).toHaveAttribute("href", "/contact");
    expect(screen.queryByText(/waitlist/i)).not.toBeInTheDocument();
  });
});

describe("the shipped availability flag", () => {
  /*
   * The one assertion that reads the real constant. It pins the C-02
   * containment decision itself: if someone flips this back to
   * "purchasable", this fails and they have to come and read why.
   */
  it("is 'roadmap' while prices are placeholders and the legal pages are drafts", () => {
    expect(FAMILY_PLAN_AVAILABILITY).toBe("roadmap");
  });
});
