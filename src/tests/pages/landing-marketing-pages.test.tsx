import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/*
 * Every page here renders through MarketingPage, which renders SiteNav —
 * an auth-aware client component. That behaviour is covered in
 * src/tests/components/landing-nav.test.tsx, so its dependencies are
 * stubbed at their signed-out defaults here.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/learn",
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ status: "anonymous", role: null, signOut: vi.fn() }),
}));

import HowItWorksPage, { metadata as howItWorksMetadata } from "@/app/how-it-works/page";
import PricingPage, { metadata as pricingMetadata } from "@/app/pricing/page";
import { nav } from "@/features/landing/content";

/**
 * The five destinations the header links to (public-pages Step 4: Programs
 * and How It Works are real routes now, no longer interim-routed to /learn
 * and /methodology). Only the two that use the shared `MarketingPage`
 * shell are rendered here — /programs, /resources and /about each have
 * their own page shape and are asserted in
 * ../pages/landing-supporting-pages.test.tsx instead.
 */
const PAGES = [
  ["/how-it-works", HowItWorksPage, howItWorksMetadata, "Three stages, and the standards behind them."],
  ["/pricing", PricingPage, pricingMetadata, "Free to practise."],
] as const;

describe("marketing pages behind the header nav", () => {
  for (const [route, Page, metadata, heading] of PAGES) {
    it(`${route} renders with real metadata and an h1`, () => {
      expect(metadata.title).toBeTruthy();
      expect(metadata.description).toBeTruthy();
      render(<Page />);
      expect(screen.getByRole("heading", { level: 1, name: heading })).toBeInTheDocument();
    });
  }

  it("covers every header nav destination that is not an existing page", () => {
    const covered = new Set<string>(PAGES.map(([route]) => route));
    /* /programs, /resources and /about are marketing screens too, but none
       of them uses the MarketingPage shell, so they are asserted in
       ../pages/landing-supporting-pages.test.tsx instead of rendered here. */
    const existingElsewhere = new Set<string>(["/help", "/about", "/resources", "/programs"]);
    for (const link of nav.links) {
      expect(
        covered.has(link.href) || existingElsewhere.has(link.href),
        `${link.href} has no page`,
      ).toBe(true);
    }
  });
});
