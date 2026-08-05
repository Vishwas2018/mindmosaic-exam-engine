import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClosingCta, SiteFooter } from "@/features/landing/components/Closing";
import { ForParents } from "@/features/landing/components/ForParents";
import { LearningHub } from "@/features/landing/components/LearningHub";
import { Resources } from "@/features/landing/components/Resources";
import { Tutorials } from "@/features/landing/components/Tutorials";
import { closing, footer, forParents, learningHub, resources, SUPPORT_EMAIL, tutorials } from "@/features/landing/content";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

describe("Learning Hub section", () => {
  it("lists the five steps and both CTAs", () => {
    render(<LearningHub />);
    for (const step of learningHub.steps) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: learningHub.primaryCta.label })).toHaveAttribute(
      "href",
      learningHub.primaryCta.href,
    );
  });
});

describe("For parents section", () => {
  it("names what a parent sees, without percentiles or leaderboards", () => {
    render(<ForParents />);
    for (const card of forParents.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
    expect(screen.getByText(/No percentile rankings and no leaderboards/)).toBeInTheDocument();
  });
});

describe("Tutorials section", () => {
  /*
   * No tutorial has been recorded. Every frame must stay a labelled empty
   * slot — a stock photo with a play button would imply content that does
   * not exist.
   */
  it("marks every video frame as a slot still to be supplied", () => {
    render(<Tutorials />);
    expect(screen.getByText(/Videos to be supplied/)).toBeInTheDocument();
    expect(screen.getByText(tutorials.feature.slot)).toBeInTheDocument();
    for (const item of tutorials.items) {
      expect(screen.getByText(item.slot)).toBeInTheDocument();
    }
  });
});

describe("Resources section", () => {
  it("links each card at a page that exists today", () => {
    render(<Resources />);
    for (const item of resources.items) {
      expect(screen.getByRole("link", { name: new RegExp(item.title) })).toHaveAttribute("href", item.href);
    }
  });
});

describe("Closing CTA", () => {
  it("offers all three next steps", () => {
    render(<ClosingCta />);
    for (const cta of [closing.primaryCta, closing.secondaryCta, closing.tertiaryCta]) {
      expect(screen.getByRole("link", { name: cta.label })).toHaveAttribute("href", cta.href);
    }
  });
});

describe("SiteFooter", () => {
  it("renders every column with real hrefs and no dead links", () => {
    render(<SiteFooter />);
    for (const column of footer.columns) {
      const group = screen.getByRole("navigation", { name: column.title });
      for (const link of column.links) {
        const anchor = within(group).getByRole("link", { name: link.label });
        expect(anchor).toHaveAttribute("href", link.href);
        expect(anchor.getAttribute("href")).not.toBe("#");
      }
    }
  });

  it("never links account creation while public sign-up is closed", () => {
    render(<SiteFooter />);
    for (const link of screen.getAllByRole("link")) {
      expect(link).not.toHaveAttribute("href", "/sign-up");
    }
  });

  it("carries the non-affiliation statement and the one real support address", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/property of their respective owners/)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(SUPPORT_EMAIL))).toBeInTheDocument();
  });
});
