import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
const stripe = vi.hoisted(() => ({ configured: false, purchasable: false }));
vi.mock("@/lib/stripe/config", () => ({
  get isStripeConfigured() { return stripe.configured; },
  purchasablePlans: () => ({ individual: stripe.purchasable, family: stripe.purchasable }),
}));
vi.mock("@/lib/billing/subscription", () => ({ getMySubscription: vi.fn(async () => ({ status: "ready", subscription: null })) }));
vi.mock("@/features/auth/components/AuthNav", () => ({ AuthNav: () => null }));
vi.mock("@/features/auth/components/RoleHomeLink", () => ({ RoleHomeLink: () => null }));

const state: { user: { id: string } | null; role: string | null } = { user: null, role: null };
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.role ? { role: state.role } : null }) }) }) }),
  })),
}));

import BillingPage from "@/app/billing/page";

describe("/billing during the free family beta", () => {
  beforeEach(() => {
    state.user = null;
    state.role = null;
    stripe.configured = false;
  });

  it("never shows a child a plan or a price", async () => {
    state.user = { id: "kid" };
    state.role = "student";
    render(await BillingPage());
    expect(screen.getByTestId("billing-student")).toBeInTheDocument();
    expect(screen.queryByText(/Choose the Family plan/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/A\$/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to My Space" })).toHaveAttribute("href", "/student");
  });

  it("sends a parent to Account > Plan & billing when payments are not switched on, whatever row is stored", async () => {
    state.user = { id: "p" };
    state.role = "parent";
    await expect(BillingPage()).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("tells a guest the same, with no checkout", async () => {
    render(await BillingPage());
    expect(screen.getByTestId("billing-free-beta")).toBeInTheDocument();
  });
});


it("offers Register interest, never checkout, when Stripe is configured but a tier has no prices", async () => {
  state.user = null;
  state.role = null;
  stripe.configured = true;
  stripe.purchasable = false;
  try {
    render(await BillingPage());
    expect(screen.getByRole("heading", { level: 1, name: "Pick the plan that fits your family" })).toBeVisible();
    expect(screen.queryByRole("button", { name: /^Subscribe to/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Register interest" })[0]).toHaveAttribute("href", "/help#contact");
  } finally {
    stripe.configured = false;
  }
});

it("offers both paid tiers with a billing-cycle switch when Stripe and every price are configured", async () => {
  state.user = null;
  state.role = null;
  stripe.configured = true;
  stripe.purchasable = true;
  try {
    render(await BillingPage());
    expect(screen.getByRole("radiogroup", { name: "Billing cycle" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Subscribe to Individual" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Subscribe to Family" })).toBeVisible();
  } finally {
    stripe.configured = false;
    stripe.purchasable = false;
  }
});
