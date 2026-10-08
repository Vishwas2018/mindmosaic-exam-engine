import { act, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { useMinWidth } from "@/features/landing/cinematic/useMinWidth";
import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
import { hero } from "@/features/landing/content";
import { landingMedia } from "@/features/landing/media";

/** A controllable matchMedia: `width` drives min-width queries, `reduce` the reduced-motion query. */
function mockViewport(initial: { width: number; reduce?: boolean }) {
  const state = { ...initial };
  const listeners = new Set<() => void>();
  const removed = vi.fn();
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query);
    return {
      get matches() {
        if (min) return state.width >= Number(min[1]);
        if (query.includes("prefers-reduced-motion")) return Boolean(state.reduce);
        return false;
      },
      media: query,
      addEventListener: (_: string, cb: () => void) => listeners.add(cb),
      removeEventListener: (_: string, cb: () => void) => {
        listeners.delete(cb);
        removed();
      },
    };
  }) as unknown as typeof window.matchMedia;
  return {
    resize: (width: number) => {
      state.width = width;
      listeners.forEach((cb) => cb());
    },
    listeners,
    removed,
  };
}

const original = window.matchMedia;
afterEach(() => {
  window.matchMedia = original;
});

describe("useMinWidth", () => {
  it("reports the current width and reacts when the breakpoint is crossed", () => {
    const viewport = mockViewport({ width: 800 });
    const { result } = renderHook(() => useMinWidth(cinematicMotion.pinnedMinWidth));
    expect(result.current).toBe(false);
    act(() => viewport.resize(1280));
    expect(result.current).toBe(true);
    act(() => viewport.resize(900));
    expect(result.current).toBe(false);
  });

  it("unsubscribes on unmount", () => {
    const viewport = mockViewport({ width: 1280 });
    const { unmount } = renderHook(() => useMinWidth(1024));
    expect(viewport.listeners.size).toBe(1);
    unmount();
    expect(viewport.listeners.size).toBe(0);
    expect(viewport.removed).toHaveBeenCalled();
  });
});

describe("Chapter 1 motion and accessibility", () => {
  const stage = (container: HTMLElement) => container.querySelector("section > div")!;

  it("under reduced motion applies no scroll-driven transforms, no pinning, a static mosaic and no navigator", () => {
    mockViewport({ width: 1440, reduce: true });
    const { container } = render(<ChapterOneIntro />);
    const photo = container.querySelector("img")!;
    expect(photo.parentElement!.getAttribute("style") ?? "").not.toMatch(/scale|transform/);
    expect(photo.closest("[data-hero-scene]")!.getAttribute("style") ?? "").not.toMatch(/opacity/);
    expect(container.querySelector("[data-mosaic-transition]")).toHaveAttribute("data-mosaic-transition", "static");
    expect(container.querySelector("section")!.className).toContain("motion-reduce:lg:h-auto");
    expect(stage(container).className).toContain("motion-reduce:lg:static");
    // The scene list replaces the pinned stage's navigator.
    expect(container.querySelector("nav[aria-label='Hero scenes']")!.closest("[class*='motion-reduce:lg:hidden']")).not.toBeNull();
    expect(screen.getByRole("list", { name: "Six ways MindMosaic helps" }).className).toContain("motion-reduce:lg:grid");
    // Only scene 1's photograph is ever on the canvas without scroll-driven motion.
    expect(container.querySelectorAll("[data-hero-scene]")).toHaveLength(1);
  });

  it("drives the first photograph and the mosaic from scroll when motion is allowed and the stage is pinned", () => {
    mockViewport({ width: 1440, reduce: false });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[data-mosaic-transition]")).toHaveAttribute("data-mosaic-transition", "animated");
    const layer = container.querySelector("[data-hero-scene='0']")!;
    expect(layer.getAttribute("style") ?? "").toMatch(/opacity/);
    expect(layer.querySelector("img")!.parentElement!.getAttribute("style") ?? "").toMatch(/scale|transform/);
  });

  it("is 500svh tall from lg up and pins its stage, with no wheel handling in the markup", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("section")!.getAttribute("style")).toContain(`${cinematicMotion.chapter1.desktopScrollHeightSvh}svh`);
    expect(stage(container).className).toContain("lg:sticky");
  });

  it("renders the decorative photograph with an empty alt, hidden from assistive tech", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    const photo = container.querySelector("img")!;
    expect(landingMedia.chapter1.scenes.learn.decorative).toBe(true);
    expect(photo).toHaveAttribute("alt", "");
    expect(photo.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("offers one navigator button per scene with the scene named, and marks the active one", () => {
    mockViewport({ width: 1440 });
    render(<ChapterOneIntro />);
    const nav = screen.getByRole("navigation", { name: "Hero scenes" });
    const buttons = within(nav).getAllByRole("button");
    expect(buttons).toHaveLength(6);
    hero.scenes.forEach((scene, index) => {
      expect(buttons[index]).toHaveAccessibleName(`Scene ${index + 1} of 6: ${scene.label}. ${scene.phrase}`);
    });
    expect(buttons[0]).toHaveAttribute("aria-current", "step");
    expect(buttons.slice(1).every((button) => !button.hasAttribute("aria-current"))).toBe(true);
  });

  it("scrolls to a scene with ordinary native scrolling, never by locking or forcing the page", () => {
    mockViewport({ width: 1440, reduce: false });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<ChapterOneIntro />);
    const nav = screen.getByRole("navigation", { name: "Hero scenes" });
    fireEvent.click(within(nav).getByRole("button", { name: /Scene 4 of 6/ }));
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
    scrollTo.mockRestore();
  });

  it("scrolls without animation under reduced motion", () => {
    mockViewport({ width: 1440, reduce: true });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    render(<ChapterOneIntro />);
    fireEvent.click(screen.getAllByRole("button", { name: /Scene 2 of 6/ })[0]!);
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto" }));
    scrollTo.mockRestore();
  });

  it("announces nothing as the page scrolls: no live region anywhere in the chapter", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[aria-live], [role='status'], [role='alert']")).toBeNull();
  });

  it("keeps the headline, subheading, CTAs and availability line out of every scroll-driven style", () => {
    mockViewport({ width: 1440, reduce: false });
    const { container } = render(<ChapterOneIntro />);
    for (const element of [
      screen.getByRole("heading", { level: 1 }),
      screen.getByRole("link", { name: hero.primaryCta.label }),
      screen.getByRole("link", { name: hero.secondaryCta.label }),
      screen.getByRole("link", { name: hero.availability.link.label }),
    ]) {
      for (let node: HTMLElement | null = element; node && node !== container; node = node.parentElement) {
        expect(node.getAttribute("style") ?? "", node.tagName).not.toMatch(/opacity|translate|transform/);
      }
    }
  });
});
