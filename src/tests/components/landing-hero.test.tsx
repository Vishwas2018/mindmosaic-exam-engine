import { act, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
  afterEach(() => vi.unstubAllGlobals());

  it("renders the stationary two-line heading", () => {
    render(<ChapterOneIntro />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(hero.heading);
    expect(heading).toHaveTextContent(hero.headingEmphasis);
  });

  it("wires both CTAs and the availability link to real routes", () => {
    render(<ChapterOneIntro />);
    expect(
      screen.getByRole("link", { name: hero.primaryCta.label }),
    ).toHaveAttribute("href", hero.primaryCta.href);
    expect(
      screen.getByRole("link", { name: hero.secondaryCta.label }),
    ).toHaveAttribute("href", hero.secondaryCta.href);
    expect(
      screen.getByRole("link", { name: hero.availability.link.label }),
    ).toHaveAttribute("href", hero.availability.link.href);
  });

  it("server-renders exactly one full-bleed photograph: scene 1, the first registry slot, versioned and decorative", () => {
    const { container } = render(<ChapterOneIntro />);
    const canvas = container.querySelector(
      "section > div > div[aria-hidden='true']",
    )!;
    const photos = [...canvas.querySelectorAll("img")];
    expect(photos).toHaveLength(1);
    const first =
      landingMedia.chapter1.scenes[landingMedia.chapter1.sceneOrder[0]!];
    expect(decodeURIComponent(photos[0]!.getAttribute("src") ?? "")).toContain(
      resolveSlotSrc(first),
    );
    expect(photos[0]).toHaveAttribute("alt", "");
  });

  it("never mounts the other five full-bleed photographs without the pinned, motion-allowed stage", () => {
    const { container } = render(<ChapterOneIntro />);
    const canvas = container.querySelector(
      "section > div > div[aria-hidden='true']",
    )!;
    for (const id of landingMedia.chapter1.sceneOrder.slice(1)) {
      const file = resolveSlotSrc(landingMedia.chapter1.scenes[id])
        .split("/")
        .pop()!
        .replace(".webp", "");
      expect(canvas.innerHTML).not.toContain(file);
    }
  });

  it("lists the six story beats, in order, as ordinary readable content", () => {
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", {
      name: "Six ways MindMosaic helps",
    });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(6);
    hero.scenes.forEach((scene, index) => {
      expect(items[index]).toHaveTextContent(scene.label);
      expect(items[index]).toHaveTextContent(scene.phrase);
    });
  });

  /** An IntersectionObserver the test can fire by hand (jsdom's own is a no-op that never reports anything). */
  function stubIntersection() {
    const observed: Element[] = [];
    let notify: IntersectionObserverCallback = () => {};
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback;
        }
        observe = (element: Element) => void observed.push(element);
        disconnect = () => {};
        unobserve = () => {};
        takeRecords = () => [];
      },
    );
    return {
      observed,
      reveal: (target: Element) =>
        act(() =>
          notify(
            [
              {
                isIntersecting: true,
                target,
              } as unknown as IntersectionObserverEntry,
            ],
            {} as IntersectionObserver,
          ),
        ),
    };
  }

  it("requests no thumbnails at page load: they wait until the list scrolls into view", () => {
    const io = stubIntersection();
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", {
      name: "Six ways MindMosaic helps",
    });
    expect(io.observed).toContain(list);
    // The words never wait: every scene is readable before any picture is requested.
    expect(within(list).getAllByRole("listitem")).toHaveLength(6);
    expect(list.querySelectorAll("img")).toHaveLength(0);
    io.reveal(list);
    expect(list.querySelectorAll("img")).toHaveLength(6);
    vi.unstubAllGlobals();
  });

  it("gives the story list decorative thumbnails from the same registry slots", () => {
    const io = stubIntersection();
    render(<ChapterOneIntro />);
    const list = screen.getByRole("list", {
      name: "Six ways MindMosaic helps",
    });
    io.reveal(list);
    const thumbs = [...list.querySelectorAll("img")];
    expect(thumbs).toHaveLength(6);
    landingMedia.chapter1.sceneOrder.forEach((id, index) => {
      expect(
        decodeURIComponent(thumbs[index]!.getAttribute("src") ?? ""),
      ).toContain(resolveSlotSrc(landingMedia.chapter1.scenes[id]));
      expect(thumbs[index]).toHaveAttribute("alt", "");
      expect(thumbs[index]!.getAttribute("loading")).toBe("lazy");
    });
    vi.unstubAllGlobals();
  });

  it("is scroll-driven: no autoplay, no pause or play control, no live region, no timers in the markup", () => {
    const { container } = render(<ChapterOneIntro />);
    expect(screen.queryByRole("group", { name: /slide/i })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /slideshow|pause|play/i }),
    ).toBeNull();
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
    expect(
      screen.getByText(/independent learning platform/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: credibility.disclaimerLink.label }),
    ).toHaveAttribute("href", "/assessment-disclaimer");
  });
});
