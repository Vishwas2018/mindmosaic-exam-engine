import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContextValue } from "@/features/auth/AuthProvider";
import { ROLE_HOME_LABELS, ROLE_HOME_PATHS, type ProfileRole } from "@/features/auth/roles";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { nav } from "@/features/landing/content";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  usePathname: () => "/",
}));

const signOut = vi.fn(async () => {});
let auth: Pick<AuthContextValue, "status" | "role" | "signOut">;
vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => auth,
}));

function asGuest() {
  auth = { status: "anonymous", role: null, signOut };
}

function asSignedIn(role: ProfileRole | null) {
  auth = { status: "authenticated", role, signOut };
}

describe("SiteNav (landing)", () => {
  beforeEach(() => {
    refresh.mockClear();
    signOut.mockClear();
    asGuest();
  });

  it("renders every primary nav link from content.ts with its real href", () => {
    render(<SiteNav />);
    const primary = screen.getByRole("navigation", { name: "Primary" });
    for (const link of nav.links) {
      expect(within(primary).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });

  /*
   * The design file's CTA points at sign-up, and with public sign-up open
   * (src/features/auth/signup-policy.ts) that is now the honest
   * destination. It was /practice while sign-up was closed — a CTA to a
   * form that cannot succeed is worse than no CTA — so this pair is
   * asserted together with the policy flag it depends on. See
   * signup-policy.test.tsx for the other half.
   */
  it("points 'Start free' at the sign-up form while public sign-up is open", async () => {
    const { PUBLIC_SIGNUP_ENABLED } = await import("@/features/auth/signup-policy");
    expect(PUBLIC_SIGNUP_ENABLED).toBe(true);

    render(<SiteNav />);
    const cta = screen.getByRole("link", { name: nav.cta.label });
    expect(cta).toHaveAttribute("href", "/sign-up");
  });

  /* The design's active treatment: brand purple plus aria-current. */
  it("marks the current page in the nav", () => {
    render(<SiteNav />);
    const primary = screen.getByRole("navigation", { name: "Primary" });
    const current = within(primary).getAllByRole("link").filter(
      (link) => link.getAttribute("aria-current") === "page",
    );
    expect(current.length).toBeLessThanOrEqual(1);
  });

  it("shows the guest actions only while signed out", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: nav.signIn.label })).toHaveAttribute("href", "/sign-in");
  });

  it("swaps the guest actions for the role home and sign-out once signed in", () => {
    asSignedIn("parent");
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: nav.signIn.label })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: new RegExp(ROLE_HOME_LABELS.parent) })[0]).toHaveAttribute(
      "href",
      ROLE_HOME_PATHS.parent,
    );
    expect(screen.getAllByRole("button", { name: nav.signedIn.signOutLabel }).length).toBeGreaterThan(0);
  });

  it("shows only sign-out while the role is still resolving", () => {
    asSignedIn(null);
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: nav.signIn.label })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: nav.signedIn.signOutLabel }).length).toBeGreaterThan(0);
  });

  it("re-renders the server tree after signing out", async () => {
    asSignedIn("parent");
    render(<SiteNav />);
    await userEvent.click(screen.getAllByRole("button", { name: nav.signedIn.signOutLabel })[0]!);
    expect(signOut).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();
  });

  it("opens the mobile panel from the menu button and exposes the same links", async () => {
    render(<SiteNav />);
    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");

    const mobile = screen.getByRole("navigation", { name: "Primary, mobile" });
    for (const link of nav.links) {
      expect(within(mobile).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
  });

  it("closes the mobile panel on Escape", async () => {
    render(<SiteNav />);
    await userEvent.click(screen.getByRole("button", { name: "Menu" }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("navigation", { name: "Primary, mobile" })).not.toBeInTheDocument();
  });
});
