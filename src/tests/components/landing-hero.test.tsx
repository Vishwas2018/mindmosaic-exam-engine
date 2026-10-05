import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
import { ChapterTwoPlaceholder } from "@/features/landing/components/ChapterTwoPlaceholder";
import { Credibility } from "@/features/landing/components/Credibility";
import { chapterTwoPlaceholder, credibility, hero } from "@/features/landing/content";
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

  it("shows exactly one photograph, the active media-registry slot, versioned and decorative", () => {
    const { container } = render(<ChapterOneIntro />);
    const photos = [...container.querySelectorAll("img")];
    expect(photos).toHaveLength(1);
    expect(decodeURIComponent(photos[0]!.getAttribute("src") ?? "")).toContain(
      resolveSlotSrc(landingMedia.chapter1.intro.primary),
    );
    expect(photos[0]).toHaveAttribute("alt", "");
  });

  it("never loads an alternate candidate", () => {
    const { container } = render(<ChapterOneIntro />);
    const html = container.innerHTML;
    for (const slot of Object.values(landingMedia.chapter1.intro.alternates)) {
      if (slot.status === "active") continue;
      expect(html).not.toContain(slot.basePath.split("/").pop()!.replace(".webp", ""));
    }
  });

  it("is a single still chapter: no slideshow, timers, pause control or live region", () => {
    const { container } = render(<ChapterOneIntro />);
    expect(screen.queryByRole("group", { name: /slide/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /slide|pause|play/i })).toBeNull();
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(container.querySelectorAll("button")).toHaveLength(0);
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

describe("Chapter 2 placeholder", () => {
  it("is a heading-only hand-off landing", () => {
    render(<ChapterTwoPlaceholder />);
    expect(screen.getByRole("heading", { level: 2, name: chapterTwoPlaceholder.heading })).toBeInTheDocument();
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
