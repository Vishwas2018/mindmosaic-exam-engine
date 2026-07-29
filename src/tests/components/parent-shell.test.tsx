import { render, screen } from "@testing-library/react";
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

function renderShell(active: "/parent" | "/parent/children") {
  return render(
    <AuthProvider>
      <ParentShell active={active}>
        <p>page body</p>
      </ParentShell>
    </AuthProvider>,
  );
}

describe("ParentShell", () => {
  it("renders the page content and both nav links", () => {
    renderShell("/parent");
    expect(screen.getByText("page body")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Children" })).toBeInTheDocument();
  });

  it("marks the active nav link with aria-current", () => {
    renderShell("/parent/children");
    expect(screen.getByRole("link", { name: "Children" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });
});
