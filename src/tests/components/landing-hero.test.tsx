import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Hero, TrustStrip } from "@/features/landing/components/Hero";
import { hero, trustStrip } from "@/features/landing/content";

describe("Hero (landing)", () => {
  it("renders the H1 and subheadline copy from content.ts", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    for (const line of hero.headlineLines) {
      expect(heading).toHaveTextContent(line.text);
    }
    expect(screen.getByText(hero.subheadline)).toBeInTheDocument();
  });

  it("renders the primary CTA pointing at a real route", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: new RegExp(hero.primaryCta.label) })).toHaveAttribute(
      "href",
      hero.primaryCta.href,
    );
  });

  it("renders the non-affiliation disclaimer", () => {
    render(<Hero />);
    expect(screen.getByText(hero.disclaimer)).toBeInTheDocument();
  });

  it("labels every floating stat card as illustrative, not real outcome data", () => {
    render(<Hero />);
    expect(screen.getAllByText("Illustrative")).toHaveLength(hero.floatingChips.chips.length);
    for (const chip of hero.floatingChips.chips) {
      expect(screen.getByText(chip.value)).toBeInTheDocument();
    }
  });
});

describe("TrustStrip (landing)", () => {
  it("renders every configured badge", () => {
    render(<TrustStrip />);
    for (const badge of trustStrip.badges) {
      expect(screen.getByText(badge.label)).toBeInTheDocument();
    }
  });

  /* Each claim carries a distinct mark now — a shared checkmark repeated four
     times told a reader nothing about which claim they were reading. */
  it("gives every badge its own icon key", () => {
    const keys = trustStrip.badges.map((badge) => badge.icon);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
