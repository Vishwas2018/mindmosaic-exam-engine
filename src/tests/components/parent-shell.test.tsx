import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import { ParentShell } from "@/features/parent-dashboard/components/ParentShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: null }) }) }) }),
  }),
}));

type Active = "/parent" | "/parent/children" | "/billing";

function renderShell(active: Active) {
  return render(
    <AuthProvider>
      <ParentShell active={active}>
        <p>page body</p>
      </ParentShell>
    </AuthProvider>,
  );
}

/**
 * Two navs render at once — the wide one and the compact row that replaces
 * it below `sm` — so every assertion is scoped to one of them by its
 * accessible name rather than searching the whole document.
 */
function nav(name: "Parent" | "Parent, compact") {
  return within(screen.getByRole("navigation", { name }));
}

describe("ParentShell", () => {
  it("renders the page content", () => {
    renderShell("/parent");
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  /*
   * /billing is a core parent surface that the nav did not expose at all:
   * the only ways in were a "See plans" link inside the locked-insights
   * card and a redirect from the subscription gate, so a parent could not
   * navigate to their own billing page.
   */
  it.each(["Parent", "Parent, compact"] as const)(
    "exposes every parent route in the %s nav",
    (navName) => {
      renderShell("/parent");
      expect(nav(navName).getByRole("link", { name: "Dashboard" })).toHaveAttribute(
        "href",
        "/parent",
      );
      expect(nav(navName).getByRole("link", { name: "Children" })).toHaveAttribute(
        "href",
        "/parent/children",
      );
      expect(nav(navName).getByRole("link", { name: "Billing" })).toHaveAttribute(
        "href",
        "/billing",
      );
    },
  );

  it("marks the active nav link with aria-current", () => {
    renderShell("/parent/children");
    expect(nav("Parent").getByRole("link", { name: "Children" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav("Parent").getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks Billing as the active link on the billing route", () => {
    renderShell("/billing");
    expect(nav("Parent").getByRole("link", { name: "Billing" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  /*
   * The logo links home, but a logo is a brand mark before it is a
   * signpost — a signed-in parent needs a labelled way back to the public
   * site.
   */
  it.each(["Parent", "Parent, compact"] as const)(
    "offers a labelled way back to the public site in the %s nav",
    (navName) => {
      renderShell("/parent");
      expect(nav(navName).getByRole("link", { name: /back to site/i })).toHaveAttribute("href", "/");
    },
  );

  /*
   * The wide nav is `hidden sm:flex`, and a display:none nav is skipped by
   * Tab as well as hidden — so without this row a parent on a phone could
   * reach none of their own routes.
   */
  it("keeps every destination reachable below the sm breakpoint", () => {
    renderShell("/parent");
    const compact = screen.getByRole("navigation", { name: "Parent, compact" });
    expect(compact).not.toHaveClass("hidden");
    expect(within(compact).getAllByRole("link")).toHaveLength(4);
  });
});
