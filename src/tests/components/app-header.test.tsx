import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/shell/AppHeader";
import { AuthProvider } from "@/features/auth";

const refresh = vi.fn();
let pathname = "/practice";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/supabase/config", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon-key",
  isSupabaseConfigured: true,
  SUPABASE_NOT_CONFIGURED_MESSAGE: "not configured",
}));

const mockSignOut = vi.fn(async () => ({ error: null }));
let sessionUser: unknown = { id: "s-1", user_metadata: { display_name: "Vihaan" } };
let profileRole = "student";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: sessionUser ? { user: sessionUser } : null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signOut: mockSignOut,
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: { role: profileRole } }) }) }),
    }),
  }),
}));

function renderHeader() {
  return render(
    <AuthProvider>
      <AppHeader />
    </AuthProvider>,
  );
}

describe("AppHeader", () => {
  beforeEach(() => {
    refresh.mockClear();
    mockSignOut.mockClear();
    pathname = "/practice";
    sessionUser = { id: "s-1", user_metadata: { display_name: "Vihaan" } };
    profileRole = "student";
  });

  it("marks the current route as the active page", async () => {
    renderHeader();
    const practice = await screen.findAllByRole("link", { name: "Practice" });
    expect(practice[0]).toHaveAttribute("aria-current", "page");

    const results = screen.getAllByRole("link", { name: "Results" });
    expect(results[0]).not.toHaveAttribute("aria-current");
  });

  /*
   * The dashboard is the hub every signed-in screen hangs off. Behind the
   * profile dropdown it took two clicks and prior knowledge, and on
   * /results, /practice and /practice/<program> the header showed no visible
   * route to it at all.
   */
  it("puts the signed-in user's dashboard first in the nav, not only in the profile menu", async () => {
    renderHeader();
    const links = await screen.findAllByRole("link", { name: "Dashboard" });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href", "/student");
  });

  it("routes the nav dashboard entry per role", async () => {
    profileRole = "parent";
    renderHeader();
    const links = await screen.findAllByRole("link", { name: "Parent dashboard" });
    expect(links[0]).toHaveAttribute("href", "/parent");
  });

  it("shows a guest no dashboard entry at all", async () => {
    sessionUser = null;
    renderHeader();
    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toBeInTheDocument(),
    );
    expect(screen.queryByRole("link", { name: /dashboard/i })).not.toBeInTheDocument();
  });

  it("offers Help from every product screen", async () => {
    renderHeader();
    const help = await screen.findAllByRole("link", { name: "Help" });
    expect(help[0]).toHaveAttribute("href", "/help");
  });

  /* /student/learn is behind requireStudent, so linking it for a parent
     would be a link straight to a permission-denied screen. */
  it("hides the student-only Learn link from a parent", async () => {
    profileRole = "parent";
    renderHeader();
    await screen.findAllByRole("link", { name: "Practice" });
    expect(screen.queryByRole("link", { name: "Learn" })).not.toBeInTheDocument();
  });

  it("shows Learn to a student", async () => {
    renderHeader();
    const learn = await screen.findAllByRole("link", { name: "Learn" });
    expect(learn[0]).toHaveAttribute("href", "/student/learn");
  });

  it("puts the dashboard and sign out inside the profile menu", async () => {
    const user = userEvent.setup();
    renderHeader();

    const trigger = await screen.findByTestId("profile-menu-trigger");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menuitem", { name: /Dashboard/ })).toHaveAttribute(
      "href",
      "/student",
    );

    await user.click(screen.getByTestId("profile-menu-sign-out"));
    await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  it("closes the profile menu on Escape", async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(await screen.findByTestId("profile-menu-trigger"));
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("gives a guest a sign-in link and no profile menu", async () => {
    sessionUser = null;
    renderHeader();

    await waitFor(() =>
      expect(screen.getAllByRole("link", { name: "Sign in" })[0]).toHaveAttribute(
        "href",
        "/sign-in",
      ),
    );
    expect(screen.queryByTestId("profile-menu-trigger")).not.toBeInTheDocument();
  });

  it("opens a mobile navigation drawer", async () => {
    const user = userEvent.setup();
    renderHeader();

    const toggle = await screen.findByTestId("app-nav-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("navigation", { name: "Primary navigation, mobile" }),
    ).toBeInTheDocument();
  });
});
