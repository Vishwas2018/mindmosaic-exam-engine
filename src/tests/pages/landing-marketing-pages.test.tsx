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

import AssessmentsPage, { metadata as assessmentsMetadata } from "@/app/assessments/page";
import ExamPreparationPage, { metadata as examPrepMetadata } from "@/app/exam-preparation/page";
import LearnPage, { metadata as learnMetadata } from "@/app/learn/page";
import MethodologyPage, { metadata as methodologyMetadata } from "@/app/methodology/page";
import PricingPage, { metadata as pricingMetadata } from "@/app/pricing/page";
import { nav } from "@/features/landing/content";

/**
 * The five destinations the header links to. Each must be a real page with
 * real metadata — the header can never point at a route that 404s, which
 * is the whole reason these exist rather than the design file's own hrefs
 * being copied verbatim.
 */
const PAGES = [
  ["/learn", LearnPage, learnMetadata, "Concepts explained, then practised."],
  ["/assessments", AssessmentsPage, assessmentsMetadata, "Practise by year, subject or single skill."],
  [
    "/exam-preparation",
    ExamPreparationPage,
    examPrepMetadata,
    "Sit it under exam conditions before the day.",
  ],
  ["/methodology", MethodologyPage, methodologyMetadata, "Three stages, and the standards behind them."],
  [
    "/pricing",
    PricingPage,
    pricingMetadata,
    "Free to practise. Paid only for what a family adds on top.",
  ],
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
    /* /resources and /about are marketing screens too, but neither uses
       the MarketingPage shell (their headers carry a search field and a
       hero image respectively), so they are asserted in
       ../pages/landing-supporting-pages.test.tsx instead of rendered here. */
    const existingElsewhere = new Set<string>(["/help", "/about", "/resources"]);
    for (const link of nav.links) {
      expect(
        covered.has(link.href) || existingElsewhere.has(link.href),
        `${link.href} has no page`,
      ).toBe(true);
    }
  });
});
