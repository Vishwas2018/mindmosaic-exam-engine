import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});

/*
 * jsdom does not implement HTMLDialogElement.showModal()/close() (only the
 * plain `open` attribute reflection). Component tests that render a native
 * <dialog> — see SubmitConfirmationDialog — need at least the open/close
 * state transitions and the "close" event a real browser provides; the
 * modality, focus trapping and background inertness those methods bring in
 * a real engine are covered by the Playwright suite instead.
 */
if (
  typeof HTMLDialogElement !== "undefined" &&
  typeof HTMLDialogElement.prototype.showModal !== "function"
) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

/*
 * jsdom has no IntersectionObserver at all. framer-motion's `whileInView`
 * (Reveal.tsx, and the hero's scroll-parallax mount check) constructs one
 * unconditionally on mount, with no feature-detection of its own, so
 * component tests that render either would otherwise throw on mount. This
 * stub never fires — content stays in its pre-reveal state, which is fine
 * for tests asserting presence/text, not animation. Real reveal behaviour
 * is covered by the Playwright suite.
 */
if (typeof window !== "undefined" && typeof window.IntersectionObserver === "undefined") {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  window.IntersectionObserver = NoopIntersectionObserver as unknown as typeof IntersectionObserver;
}
