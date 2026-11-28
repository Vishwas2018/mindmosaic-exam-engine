import { act, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { useMinWidth, usePinnedViewport } from "@/features/landing/cinematic/useMinWidth";
import { ChapterOneIntro } from "@/features/landing/components/ChapterOneIntro";
import { landingMedia } from "@/features/landing/media";

/**
 * A controllable matchMedia: `width` drives min-width queries, `height` (default 900) min-height queries, and
 * `reduce` the reduced-motion query. A query naming both (the pinned-stage one) needs both to hold.
 */
function mockViewport(initial: { width: number; height?: number; reduce?: boolean }) {
  const state = { height: 900, ...initial };
  const listeners = new Set<() => void>();
  const removed = vi.fn();
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query);
    const minHeight = /min-height:\s*(\d+)px/.exec(query);
    return {
      get matches() {
        if (min || minHeight) {
          return (!min || state.width >= Number(min[1])) && (!minHeight || state.height >= Number(minHeight[1]));
        }
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
    resize: (width: number, height = state.height) => {
      state.width = width;
      state.height = height;
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

describe("usePinnedViewport", () => {
  const { pinnedMinWidth: w, pinnedMinHeight: h } = cinematicMotion;

  it("is true only when the viewport is both wide and tall enough, and follows a resize across either edge", () => {
    const viewport = mockViewport({ width: 1280, height: h });
    const { result } = renderHook(() => usePinnedViewport(w, h));
    expect(result.current).toBe(true);
    act(() => viewport.resize(1280, h - 1));
    expect(result.current).toBe(false);
    act(() => viewport.resize(1280, 900));
    expect(result.current).toBe(true);
    act(() => viewport.resize(w - 1, 900));
    expect(result.current).toBe(false);
  });

  it("honours a chapter's own, taller minimum", () => {
    mockViewport({ width: 1440, height: 800 });
    expect(renderHook(() => usePinnedViewport(w, 800)).result.current).toBe(true);
    expect(renderHook(() => usePinnedViewport(w, cinematicMotion.chapter4.pinnedMinHeight)).result.current).toBe(false);
  });
});

describe("Chapter 1 motion and accessibility", () => {
  it("on a wide but short viewport falls back to natural flow, like reduced motion", () => {
    mockViewport({ width: 1280, height: cinematicMotion.pinnedMinHeight - 1 });
    const { container } = render(<ChapterOneIntro />);
    // No scroll choreography: no tile field, only scene 1's photograph, scenes 2 to 6 in the readable list.
    expect(container.querySelector("[data-mosaic-tiles]")).toBeNull();
    expect(container.querySelectorAll("[data-scene-layer] img")).toHaveLength(1);
    expect(container.querySelectorAll("article")).toHaveLength(5);
    // The CSS side of the same decision: the stage is released from its pin at this height.
    expect(container.querySelector("section")!.className).toContain("short:lg:h-auto");
    expect(container.querySelector("section > div")!.className).toContain("short:lg:static");
    expect(container.querySelector("section > div")!.className).toContain("short:lg:min-h-svh");
  });

  it("stays choreographed at the shortest pinned height", () => {
    mockViewport({ width: 1280, height: cinematicMotion.pinnedMinHeight });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[data-mosaic-tiles]")).not.toBeNull();
  });

  it("under reduced motion is not pinned, mounts no tile field and shows only scene 1 on the stage", () => {
    mockViewport({ width: 1440, reduce: true });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[data-mosaic-tiles]")).toBeNull();
    expect(container.querySelector("section")!.className).toContain("motion-reduce:lg:h-auto");
    expect(container.querySelector("section > div")!.className).toContain("motion-reduce:lg:static");
    // Only the first scene's photograph is ever mounted without the scroll choreography.
    expect(container.querySelectorAll("[data-scene-layer] img")).toHaveLength(1);
    // Scenes 2 to 6 are in the readable list instead.
    expect(container.querySelectorAll("article")).toHaveLength(5);
  });

  it("mounts the tile field and the release layer when motion is allowed", () => {
    mockViewport({ width: 1440, reduce: false });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelector("[data-mosaic-tiles]")).not.toBeNull();
  });

  it("renders every photograph decorative: empty alt, hidden from assistive tech", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    for (const slot of Object.values(landingMedia.chapter1.scenes)) expect(slot.decorative).toBe(true);
    for (const photo of container.querySelectorAll("[data-scene-layer] img")) {
      expect(photo).toHaveAttribute("alt", "");
      expect(photo.closest("[aria-hidden='true']")).not.toBeNull();
    }
  });

  it("has one H1, six scene messages, and only the first announced to assistive tech", () => {
    mockViewport({ width: 1440 });
    const { container } = render(<ChapterOneIntro />);
    expect(container.querySelectorAll("h1")).toHaveLength(1);
    const copies = container.querySelectorAll("[data-scene-copy]");
    expect(copies).toHaveLength(6);
    expect(copies[0]).not.toHaveAttribute("aria-hidden", "true");
    for (const copy of Array.from(copies).slice(1)) expect(copy).toHaveAttribute("aria-hidden", "true");
  });
});
