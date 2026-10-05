import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { useMinWidth } from "@/features/landing/cinematic/useMinWidth";
import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
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
  it("under reduced motion applies no scroll-driven transforms, no pinning, and a static mosaic", () => {
    mockViewport({ width: 1440, reduce: true });
    const { container } = render(<ChapterOneIntro />);
    const photo = container.querySelector("img")!;
    expect(photo.parentElement!.getAttribute("style") ?? "").not.toMatch(/scale|transform/);
    expect(container.querySelector("[data-mosaic-transition]")).toHaveAttribute("data-mosaic-transition", "static");
    expect(container.querySelector("section")!.className).toContain("motion-reduce:lg:h-auto");
    expect(container.querySelector("section > div")!.className).toContain("motion-reduce:lg:static");
  });

  it("animates the image and mosaic when motion is allowed", () => {
    mockViewport({ width: 1440, reduce: false });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[data-mosaic-transition]")).toHaveAttribute("data-mosaic-transition", "animated");
    expect(container.querySelector("img")!.parentElement!.getAttribute("style") ?? "").toMatch(/scale|transform/);
  });

  it("renders the decorative photograph with an empty alt, hidden from assistive tech", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    const photo = container.querySelector("img")!;
    expect(landingMedia.chapter1.intro.primary.decorative).toBe(true);
    expect(photo).toHaveAttribute("alt", "");
    expect(photo.closest("[aria-hidden='true']")).not.toBeNull();
  });
});
