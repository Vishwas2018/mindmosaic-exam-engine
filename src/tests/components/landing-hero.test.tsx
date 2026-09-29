import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  /*
   * The three real photos (MM-HERO-01/02/03) can't be fetched from the
   * design canvas — see hero's own doc comment in content.ts — so
   * <ImageSlot> renders its labelled placeholder instead of an <img>.
   */
  it("labels each scene's placeholder with its design asset id", () => {
    render(<Hero />);
    for (const slide of hero.slides) {
      expect(screen.getByText(new RegExp(slide.assetId))).toBeInTheDocument();
    }
  });

  it("exposes accessible carousel controls and a live caption", () => {
    render(<Hero />);
    expect(screen.getByRole("button", { name: "Previous scene" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next scene" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause scene rotation|play scene rotation/i })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(hero.slides[0]!.caption))).toBeInTheDocument();
  });

  it("moves to the next scene, stops autoplay, and updates the live caption", async () => {
    render(<Hero />);
    await userEvent.click(screen.getByRole("button", { name: "Next scene" }));
    expect(screen.getByText(new RegExp(hero.slides[1]!.caption))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Play scene rotation" })).toBeInTheDocument();
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
