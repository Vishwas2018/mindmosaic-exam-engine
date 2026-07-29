import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SiteNav } from "@/features/landing/components/SiteNav";
import { nav } from "@/features/landing/content";

describe("SiteNav (landing)", () => {
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
      expect(within(primaryNav).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }
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
});
