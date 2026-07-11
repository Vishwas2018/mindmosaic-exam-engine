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
