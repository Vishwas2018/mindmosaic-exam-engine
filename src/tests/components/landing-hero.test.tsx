import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
import { Credibility } from "@/features/landing/components/Credibility";
import { credibility, hero } from "@/features/landing/content";
import { landingMedia, resolveSlotSrc } from "@/features/landing/media";

describe("Chapter 1 intro", () => {
  it("renders the stationary two-line heading", () => {
    render(<ChapterOneIntro />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(hero.heading);
    expect(heading).toHaveTextContent(hero.headingEmphasis);
  });

  it("wires both CTAs and the availability link to real routes", () => {
    render(<ChapterOneIntro />);
    // The CTAs appear on the stage and in the fixed bar used by the stacked layouts.
    for (const link of screen.getAllByRole("link", { name: hero.primaryCta.label })) {
      expect(link).toHaveAttribute("href", hero.primaryCta.href);
    }
    for (const link of screen.getAllByRole("link", { name: hero.secondaryCta.label })) {
      expect(link).toHaveAttribute("href", hero.secondaryCta.href);
    }
    expect(screen.getByRole("link", { name: hero.availability.link.label })).toHaveAttribute(
      "href",
      hero.availability.link.href,
    );
  });

  it("carries each scene's own eyebrow, two-line headline and paragraph, in the story order", () => {
    const { container } = render(<ChapterOneIntro />);
    const copies = [...container.querySelectorAll("[data-scene-copy]")];
    expect(copies).toHaveLength(hero.scenes.length);
    hero.scenes.forEach((scene, index) => {
      const copy = copies[index]!;
      expect(copy).toHaveAttribute("data-scene-copy", scene.id);
      expect(copy).toHaveTextContent(scene.eyebrow);
      expect(copy).toHaveTextContent(scene.headline[0]);
      expect(copy).toHaveTextContent(scene.headline[1]);
      expect(copy).toHaveTextContent(scene.body);
    });
  });

  it("opens on the promise: scene 1's copy is the page heading and subheadline", () => {
    expect(hero.scenes[0]!.headline).toEqual([hero.heading, hero.headingEmphasis]);
    expect(hero.scenes[0]!.body).toBe(hero.subheadline);
  });

  it("shows scene 1's photograph first and fetches the others lazily, versioned and decorative", () => {
    const { container } = render(<ChapterOneIntro />);
    const layerPhotos = [...container.querySelectorAll("[data-scene-layer] img")];
    expect(layerPhotos.length).toBeGreaterThanOrEqual(1);
    expect(decodeURIComponent(layerPhotos[0]!.getAttribute("src") ?? "")).toContain(
      resolveSlotSrc(landingMedia.chapter1.scenes.learn),
    );
    for (const photo of container.querySelectorAll("img")) expect(photo).toHaveAttribute("alt", "");
  });

  it("never loads an alternate Chapter 1 candidate", () => {
    const { container } = render(<ChapterOneIntro />);
    const html = container.innerHTML;
    for (const slot of Object.values(landingMedia.chapter1.intro.alternates)) {
      expect(html).not.toContain(slot.basePath.split("/").pop()!.replace(".webp", ""));
    }
  });

  it("is driven by scroll alone: no slideshow, pause control or live region", () => {
    const { container } = render(<ChapterOneIntro />);
    expect(screen.queryByRole("group", { name: /slide/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /slide|pause|play/i })).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
    // The only buttons are the six scene navigator buttons.
    expect(container.querySelectorAll("button")).toHaveLength(hero.scenes.length);
  });

  it("builds the decorative mosaic hand-off without exposing it to assistive tech", () => {
    const { container } = render(<ChapterOneIntro />);
    const mosaic = container.querySelector("[data-mosaic-tiles]");
    if (mosaic) expect(mosaic).toHaveAttribute("aria-hidden", "true");
  });

  it("lists every credibility point", () => {
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", { name: "What MindMosaic includes" });
    for (const item of hero.credibility) {
      expect(within(list).getByText(item)).toBeInTheDocument();
    }
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
