import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Credibility } from "@/features/landing/components/Credibility";
import { Hero } from "@/features/landing/components/Hero";
import { credibility, hero } from "@/features/landing/content";

describe("Hero", () => {
  it("renders the three headline lines as one heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    for (const line of hero.headlineLines) {
      expect(heading).toHaveTextContent(line.text);
    }
  });

  it("wires both CTAs to real routes", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: hero.primaryCta.label })).toHaveAttribute(
      "href",
      hero.primaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.secondaryCta.label })).toHaveAttribute(
      "href",
      hero.secondaryCta.href,
    );
  });

  it("lists every trust point", () => {
    render(<Hero />);
    for (const point of hero.points) {
      expect(screen.getByText(point.label)).toBeInTheDocument();
    }
  });

  it("gives the learner photo a real alt text, not an empty one", () => {
    render(<Hero />);
    expect(screen.getByAltText(hero.image.alt)).toBeInTheDocument();
  });
});

describe("Credibility band", () => {
  it("renders all five claims", () => {
    render(<Credibility />);
    for (const card of credibility.cards) {
      expect(screen.getByText(card.title)).toBeInTheDocument();
    }
  });

  /*
   * The non-affiliation statement is a legal requirement, not decoration:
   * "NAPLAN-style" etc. describe a format, and the page has to say so
   * near the top where it makes the claim.
   */
  it("states the independence disclaimer and links the full one", () => {
    render(<Credibility />);
    expect(screen.getByText(/independent learning platform/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: credibility.disclaimerLink.label })).toHaveAttribute(
      "href",
      "/assessment-disclaimer",
    );
  });
});
