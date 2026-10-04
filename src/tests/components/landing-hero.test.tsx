import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Credibility } from "@/features/landing/components/Credibility";
import { Hero } from "@/features/landing/components/Hero";
import { credibility, hero } from "@/features/landing/content";

describe("Hero", () => {
  it("renders the stationary two-line heading", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(hero.heading);
    expect(heading).toHaveTextContent(hero.headingEmphasis);
  });

  it("wires both CTAs and the availability link to real routes", () => {
    render(<Hero />);
    expect(screen.getByRole("link", { name: hero.primaryCta.label })).toHaveAttribute(
      "href",
      hero.primaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.secondaryCta.label })).toHaveAttribute(
      "href",
      hero.secondaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.availability.link.label })).toHaveAttribute(
      "href",
      hero.availability.link.href,
    );
  });

  it("shows the campaign photograph with descriptive alt text", () => {
    render(<Hero />);
    const image = screen.getByRole("img", { name: hero.image.alt });
    expect(image.getAttribute("src")).toContain(encodeURIComponent(hero.image.src));
  });

  it("renders the sample question, answer and worked explanation as live text", () => {
    render(<Hero />);
    const question = screen.getByRole("article", { name: hero.demo.label });
    expect(question).toHaveTextContent(hero.demo.question);
    for (const option of hero.demo.options) {
      expect(within(question).getByText(option.label)).toBeInTheDocument();
    }
    const explanation = screen.getByRole("article", { name: hero.demo.explanation.label });
    for (const step of hero.demo.explanation.steps) {
      expect(within(explanation).getByText(step)).toBeInTheDocument();
    }
  });

  /* The selected answer must be the correct one: 12 m x 8 m = 96 m2. */
  it("selects the correct answer and shows consistent working", () => {
    const selected = hero.demo.options.filter((option) => option.selected);
    expect(selected).toHaveLength(1);
    expect(selected[0]!.label).toBe(`${12 * 8} m²`);
    expect(hero.demo.explanation.steps.join(" ")).toContain("12 × 8 = 96");
  });

  it("uses the official logo asset in the sample card, never a drawn mark", () => {
    const { container } = render(<Hero />);
    const sources = [...container.querySelectorAll("img")].map((image) => image.getAttribute("src") ?? "");
    expect(sources.some((src) => decodeURIComponent(src).includes("/brand/mark-"))).toBe(true);
  });

  it("lists every credibility point, and nothing in the hero auto-rotates", () => {
    render(<Hero />);
    const list = screen.getByRole("list", { name: "What MindMosaic includes" });
    for (const item of hero.credibility) {
      expect(within(list).getByText(item)).toBeInTheDocument();
    }
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
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
