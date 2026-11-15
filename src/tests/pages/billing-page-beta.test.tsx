import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isSupabaseConfigured: true }));
vi.mock("@/lib/stripe/config", () => ({ isStripeConfigured: false }));
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
