import { describe, expect, it } from "vitest";

import { focusScrollBehavior } from "@/features/landing/cinematic/useChapterScroll";
import { underlineLinkClasses } from "@/features/landing/components/primitives";

describe("focus-driven scene scrolling", () => {
  it("jumps instantly when keyboard focus lands in a scene that is not on screen", () => {
    // "instant", not "auto": the root's CSS `scroll-behavior: smooth` would make "auto" animate.
    expect(focusScrollBehavior({ instant: true }, false)).toBe("instant");
    expect(focusScrollBehavior({ instant: true }, true)).toBe("instant");
  });

  it("keeps the smooth scroll for progress-rail clicks, and jumps under reduced motion", () => {
    expect(focusScrollBehavior(undefined, false)).toBe("smooth");
    expect(focusScrollBehavior({}, false)).toBe("smooth");
    expect(focusScrollBehavior(undefined, true)).toBe("auto");
  });
});

describe("underlineLinkClasses", () => {
  it("gives a standalone link an invisible 44px hit area without touching its box", () => {
    const standalone = underlineLinkClasses({ tone: "brand", standalone: true });
    expect(standalone).toContain("after:absolute");
    expect(standalone).toContain("after:-inset-y-[13px]");
    expect(standalone).toContain("relative");
    // No margin or padding compensation: nothing about the layout changes.
    expect(standalone).not.toMatch(/(^|\s)-?m[trblxy]?-|(^|\s)p[trblxy]?-/);
  });

  it("does not enlarge an inline link inside a sentence", () => {
    expect(underlineLinkClasses({ tone: "brand" })).not.toContain("after:");
    expect(underlineLinkClasses({ tone: "brand", className: "font-semibold" })).not.toContain("after:");
  });

  it("carries the soft focus halo on every link", () => {
    expect(underlineLinkClasses()).toContain("focus-visible:ring-mm-brand/30");
  });
});
