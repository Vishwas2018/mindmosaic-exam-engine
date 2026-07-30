import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContextValue } from "@/features/auth/AuthProvider";
import { ROLE_HOME_LABELS, ROLE_HOME_PATHS, type ProfileRole } from "@/features/auth/roles";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { nav } from "@/features/landing/content";

const refresh = vi.fn();
let pathname = "/";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
  usePathname: () => pathname,
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
    pathname = "/";
    refresh.mockClear();
    signOut.mockClear();
    asGuest();
  });

  it("renders the primary CTA as 'Start free' pointing at a real route", () => {
    render(<SiteNav />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primaryNav).queryByRole("link", { name: nav.cta.label })).not.toBeInTheDocument();
    const ctaLinks = screen.getAllByRole("link", { name: new RegExp(`^${nav.cta.label}`) });
    expect(ctaLinks.length).toBeGreaterThan(0);
    for (const link of ctaLinks) {
      expect(link).toHaveAttribute("href", nav.cta.href);
    }
  });

  it("renders every primary nav link with a real, non-empty href", () => {
    render(<SiteNav />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    for (const link of nav.links) {
      // "/#plans" collapses to "#plans" on the home page — see resolveHref.
      const expected = link.href.startsWith("/#") ? link.href.slice(1) : link.href;
      expect(within(primaryNav).getByRole("link", { name: link.label })).toHaveAttribute(
        "href",
        expected,
      );
    }
  });

  /*
   * The header used to reach exactly one real route (/practice); About and
   * Help existed but were footer-only, so a visitor who never scrolled to
   * the bottom never found them.
   */
  it("reaches real pages from the header, not only same-page anchors", () => {
    render(<SiteNav />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primaryNav).getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    expect(within(primaryNav).getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
  });

  /*
   * SiteNav also renders on /about, /help and the legal pages
   * (LegalPageShell). A bare "#plans" there scrolls nowhere, so the anchors
   * keep their leading "/" off the home page.
   */
  it("keeps anchor links absolute when rendered away from the home page", () => {
    pathname = "/about";
    render(<SiteNav />);
    const primaryNav = screen.getByRole("navigation", { name: "Primary" });
    expect(within(primaryNav).getByRole("link", { name: "Plans" })).toHaveAttribute(
      "href",
      "/#plans",
    );
  });

  it("toggles the mobile menu open/closed via the menu button", async () => {
    const user = userEvent.setup();
    render(<SiteNav />);
    expect(screen.queryByRole("navigation", { name: "Primary, mobile" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("navigation", { name: "Primary, mobile" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("navigation", { name: "Primary, mobile" })).not.toBeInTheDocument();
  });

  it("shows Log in / Start free only while signed out", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: nav.signIn.label })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });

  /*
   * The gap this closes: signed in, the marketing header still offered
   * "Log in" and a "Start free" CTA and no route at all to the user's own
   * area — the only way in was to type the URL.
   */
  it.each(Object.keys(ROLE_HOME_PATHS) as ProfileRole[])(
    "links a signed-in %s to their own role home instead of Log in / Start free",
    (role) => {
      asSignedIn(role);
      render(<SiteNav />);

      const homeLinks = screen.getAllByRole("link", { name: new RegExp(ROLE_HOME_LABELS[role]) });
      expect(homeLinks.length).toBeGreaterThan(0);
      for (const link of homeLinks) {
        expect(link).toHaveAttribute("href", ROLE_HOME_PATHS[role]);
      }

      expect(screen.queryByRole("link", { name: nav.signIn.label })).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: new RegExp(`^${nav.cta.label}`) }),
      ).not.toBeInTheDocument();
    },
  );

  it("offers a sign-out control once signed in", async () => {
    const user = userEvent.setup();
    asSignedIn("parent");
    render(<SiteNav />);

    await user.click(screen.getAllByRole("button", { name: /sign out/i })[0]);
    expect(signOut).toHaveBeenCalledOnce();
    // Protected server-rendered trees only re-run their auth gate on refresh.
    expect(refresh).toHaveBeenCalledOnce();
  });

  /*
   * `role` is a second query that lands after `status`, so there is a beat
   * where the session is known but the destination is not. Linking to
   * roleHomePath(null) === "/" there would be a link back to the page the
   * user is already on.
   */
  it("omits the dashboard link while the role is still resolving, but still offers sign out", () => {
    asSignedIn(null);
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: nav.signIn.label })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /sign out/i }).length).toBeGreaterThan(0);
  });

  /*
   * Guests and signed-in users get different headers, so the first render
   * (before AuthProvider has answered) must not commit to either — showing
   * "Log in" to someone already signed in is the flash this avoids.
   */
  it("renders neither guest nor signed-in actions while the session is loading", () => {
    auth = { status: "loading", role: null, signOut };
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: nav.signIn.label })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
  });
});
