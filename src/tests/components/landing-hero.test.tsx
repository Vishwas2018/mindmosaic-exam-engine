import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
import { Credibility } from "@/features/landing/components/Credibility";
import { credibility, hero } from "@/features/landing/content";
import { landingMedia, resolveSlotSrc } from "@/features/landing/media";

/*
 * jsdom has no layout and no matchMedia, so the chapter renders in its natural-flow
 * mode: the same DOM a phone, a tablet or a reduced-motion visitor gets. The pinned
 * scroll-driven stage is covered in chapter-one-motion.test.tsx and the e2e suite.
 */
describe("Chapter 1 intro", () => {
  it("renders the stationary two-line heading", () => {
    render(<ChapterOneIntro />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(hero.heading);
    expect(heading).toHaveTextContent(hero.headingEmphasis);
  });

  it("wires both CTAs and the availability link to real routes", () => {
    render(<ChapterOneIntro />);
    expect(screen.getByRole("link", { name: hero.primaryCta.label })).toHaveAttribute("href", hero.primaryCta.href);
    expect(screen.getByRole("link", { name: hero.secondaryCta.label })).toHaveAttribute(
      "href",
      hero.secondaryCta.href,
    );
    expect(screen.getByRole("link", { name: hero.availability.link.label })).toHaveAttribute(
      "href",
      hero.availability.link.href,
    );
  });

  it("server-renders exactly one full-bleed photograph: scene 1, the first registry slot, versioned and decorative", () => {
    const { container } = render(<ChapterOneIntro />);
    const canvas = container.querySelector("section > div > div[aria-hidden='true']")!;
    const photos = [...canvas.querySelectorAll("img")];
    expect(photos).toHaveLength(1);
    const first = landingMedia.chapter1.scenes[landingMedia.chapter1.sceneOrder[0]!];
    expect(decodeURIComponent(photos[0]!.getAttribute("src") ?? "")).toContain(resolveSlotSrc(first));
    expect(photos[0]).toHaveAttribute("alt", "");
  });

  it("never mounts the other five full-bleed photographs without the pinned, motion-allowed stage", () => {
    const { container } = render(<ChapterOneIntro />);
    const canvas = container.querySelector("section > div > div[aria-hidden='true']")!;
    for (const id of landingMedia.chapter1.sceneOrder.slice(1)) {
      const file = resolveSlotSrc(landingMedia.chapter1.scenes[id]).split("/").pop()!.replace(".webp", "");
      expect(canvas.innerHTML).not.toContain(file);
    }
  });

  it("lists the six story beats, in order, as ordinary readable content", () => {
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", { name: "Six ways MindMosaic helps" });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    hero.scenes.forEach((scene, index) => {
      expect(items[index]).toHaveTextContent(scene.label);
      expect(items[index]).toHaveTextContent(scene.phrase);
    });
  });

  it("gives the story list decorative thumbnails from the same registry slots", () => {
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", { name: "Six ways MindMosaic helps" });
    const thumbs = [...list.querySelectorAll("img")];
    expect(thumbs).toHaveLength(6);
    landingMedia.chapter1.sceneOrder.forEach((id, index) => {
      expect(decodeURIComponent(thumbs[index]!.getAttribute("src") ?? "")).toContain(
        resolveSlotSrc(landingMedia.chapter1.scenes[id]),
      );
      expect(thumbs[index]).toHaveAttribute("alt", "");
      expect(thumbs[index]!.getAttribute("loading")).toBe("lazy");
    });
  });

  it("is scroll-driven: no autoplay, no pause or play control, no live region, no timers in the markup", () => {
    const { container } = render(<ChapterOneIntro />);
    expect(screen.queryByRole("group", { name: /slide/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /slideshow|pause|play/i })).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
    // The only buttons are the six scene links of the navigator.
    expect(container.querySelectorAll("button")).toHaveLength(6);
  });

  it("draws the decorative mosaic hand-off without exposing it to assistive tech", () => {
    const { container } = render(<ChapterOneIntro />);
    const mosaic = container.querySelector("[data-mosaic-transition]")!;
    expect(mosaic).toHaveAttribute("aria-hidden", "true");
    expect(mosaic.querySelectorAll("span").length).toBeGreaterThan(8);
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
