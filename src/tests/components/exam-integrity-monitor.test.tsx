import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExamIntegrityMonitor } from "@/features/exam-engine/components/ExamIntegrityMonitor";

/*
 * jsdom implements neither showModal() nor close() on HTMLDialogElement, so
 * the Modal these warnings render through would throw on open. Stubbing them
 * to flip the `open` property is what every other dialog test in this suite
 * does (see modal-confirm-dialog.test.tsx).
 */
function stubDialog() {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  };
}

describe("ExamIntegrityMonitor", () => {
  beforeEach(() => {
    stubDialog();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing for an untimed sitting", () => {
    const { container } = render(<ExamIntegrityMonitor active={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows that exam conditions are on before anything is broken", () => {
    render(<ExamIntegrityMonitor active />);
    expect(screen.getByTestId("integrity-status")).toHaveTextContent("Exam conditions");
  });

  it("records leaving the window and warns once", () => {
    render(<ExamIntegrityMonitor active />);

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(screen.getByTestId("integrity-status")).toHaveTextContent("1 warning");
    expect(screen.getByText("You left the exam window")).toBeInTheDocument();
  });

  /* A single switch away can fire visibilitychange and blur back to back;
     counting both would show "2 warnings" for one thing the student did. */
  it("counts one switch away once, not twice", () => {
    render(<ExamIntegrityMonitor active />);

    act(() => {
      window.dispatchEvent(new Event("blur"));
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(screen.getByTestId("integrity-status")).toHaveTextContent("1 warning");
  });

  it("blocks copy and paste and counts the attempt", () => {
    render(<ExamIntegrityMonitor active />);

    const copyEvent = new Event("copy", { cancelable: true, bubbles: true });
    act(() => {
      document.dispatchEvent(copyEvent);
    });

    expect(copyEvent.defaultPrevented).toBe(true);
    expect(screen.getByTestId("integrity-status")).toHaveTextContent("1 warning");
    expect(screen.getByText("Copy and paste are off")).toBeInTheDocument();
  });

  it("blocks the right-click menu", () => {
    render(<ExamIntegrityMonitor active />);

    const menuEvent = new Event("contextmenu", { cancelable: true, bubbles: true });
    act(() => {
      document.dispatchEvent(menuEvent);
    });

    expect(menuEvent.defaultPrevented).toBe(true);
    expect(screen.getByText("Right-click is off")).toBeInTheDocument();
  });

  /* Text selection stays available on purpose — reading-comprehension
     passages are long and following the text is how some children read. */
  it("does not block text selection", () => {
    render(<ExamIntegrityMonitor active />);

    const selectEvent = new Event("selectstart", { cancelable: true, bubbles: true });
    act(() => {
      document.dispatchEvent(selectEvent);
    });

    expect(selectEvent.defaultPrevented).toBe(false);
  });

  it("arms the browser's own leave-page prompt while a timed exam is open", () => {
    const { unmount } = render(<ExamIntegrityMonitor active />);

    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    /* And disarms it once the exam page goes away, so /results does not
       inherit a "leave site?" prompt. */
    unmount();
    const afterUnmount = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(afterUnmount);
    expect(afterUnmount.defaultPrevented).toBe(false);
  });

  it("leaves an untimed sitting's clipboard alone", () => {
    render(<ExamIntegrityMonitor active={false} />);

    const copyEvent = new Event("copy", { cancelable: true, bubbles: true });
    document.dispatchEvent(copyEvent);
    expect(copyEvent.defaultPrevented).toBe(false);
  });
});
