import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthProvider } from "@/features/auth";
import {
  ParentShell,
  type ParentNavKey,
} from "@/features/parent-dashboard/components/ParentShell";

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

function renderShell(active: ParentNavKey) {
  return render(
    <AuthProvider>
      <ParentShell active={active}>
        <p>page body</p>
      </ParentShell>
    </AuthProvider>,
  );
}

function nav(name: "Parent" | "Parent navigation, mobile") {
  return within(screen.getByRole("navigation", { name }));
}

describe("ParentShell", () => {
  it("renders the page content", () => {
    renderShell("/parent");
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it.each(["Parent", "Parent navigation, mobile"] as const)(
    "exposes This week, Children, and Account in the %s nav",
    (navName) => {
      renderShell("/parent");
      expect(nav(navName).getByRole("link", { name: /this week/i })).toHaveAttribute(
        "href",
        "/parent",
      );
      expect(nav(navName).getByRole("link", { name: /children/i })).toHaveAttribute(
        "href",
        "/parent/children",
      );
      expect(nav(navName).getByRole("link", { name: /account/i })).toHaveAttribute(
        "href",
        "/parent/account",
      );
    },
  );

  it("marks the active nav link with aria-current", () => {
    renderShell("/parent/children");
    expect(nav("Parent").getByRole("link", { name: /children/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav("Parent").getByRole("link", { name: /this week/i })).not.toHaveAttribute(
      "aria-current",
    );
    expect(nav("Parent navigation, mobile").getByRole("link", { name: /children/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks Account as active when viewing the billing route", () => {
    renderShell("/billing");
    expect(nav("Parent").getByRole("link", { name: /account/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(nav("Parent navigation, mobile").getByRole("link", { name: /account/i })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("offers a labelled way back to the public site in the desktop nav", () => {
    renderShell("/parent");
    expect(nav("Parent").getByRole("link", { name: /back to site/i })).toHaveAttribute("href", "/");
  });

  it("makes Help reachable from the header on every screen", () => {
    renderShell("/parent");
    const helpLink = screen.getByRole("link", { name: /help/i });
    expect(helpLink).toHaveAttribute("href", "/parent/help");
  });

  it("includes the Parent role badge", () => {
    renderShell("/parent");
    expect(screen.getByText("Parent")).toBeInTheDocument();
  });
});
