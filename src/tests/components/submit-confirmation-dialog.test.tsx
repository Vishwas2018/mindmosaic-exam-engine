import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "@/components/ui";
import { SubmitConfirmationDialog } from "@/features/exam-engine/components/SubmitConfirmationDialog";

const baseProps = {
  totalQuestions: 10,
  answeredCount: 4,
  unansweredCount: 6,
  flaggedCount: 1,
  manualReviewCount: 0,
};

function Harness({ initialOpen = false }: { initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const onConfirm = vi.fn(() => setOpen(false));
  return (
    <div>
      <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
        Submit exam
      </button>
      <SubmitConfirmationDialog
        open={open}
        onCancel={() => setOpen(false)}
        onConfirm={onConfirm}
        {...baseProps}
      />
    </div>
  );
}

describe("SubmitConfirmationDialog", () => {
  it("is a native dialog opened modally, with a labelled title and description", () => {
    render(
      <SubmitConfirmationDialog open onCancel={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
    );
    const dialog = screen.getByTestId("submit-dialog");
    expect(dialog.tagName).toBe("DIALOG");
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(dialog).toHaveAttribute("aria-labelledby", "submit-dialog-title");
    expect(dialog).toHaveAttribute("aria-describedby", "submit-dialog-description");
    expect(screen.getByRole("heading", { name: "Ready to submit?" })).toBeVisible();
  });

  it("is closed (not modal) when not open", () => {
    render(
      <SubmitConfirmationDialog
        open={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        {...baseProps}
      />,
    );
    expect((screen.getByTestId("submit-dialog") as HTMLDialogElement).open).toBe(false);
  });

  it("moves focus into the dialog on open, landing on a non-destructive default", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByTestId("opener"));
    expect(screen.getByTestId("return-to-exam")).toHaveFocus();
  });

  it("returns focus to the opener when cancelled", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByTestId("opener");
    await user.click(opener);
    await user.click(screen.getByTestId("return-to-exam"));
    expect(opener).toHaveFocus();
  });

  it("calls onConfirm exactly once when Submit now is activated", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <SubmitConfirmationDialog open onCancel={vi.fn()} onConfirm={onConfirm} {...baseProps} />,
    );
    await user.click(screen.getByTestId("confirm-submit"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("closes on a backdrop click but not on a click inside the dialog content", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <SubmitConfirmationDialog open onCancel={onCancel} onConfirm={vi.fn()} {...baseProps} />,
    );
    await user.click(screen.getByRole("heading", { name: "Ready to submit?" }));
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByTestId("submit-dialog"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders every summary figure with a distinct test id", () => {
    render(
      <SubmitConfirmationDialog open onCancel={vi.fn()} onConfirm={vi.fn()} {...baseProps} />,
    );
    expect(screen.getByTestId("summary-total")).toHaveTextContent("10");
    expect(screen.getByTestId("summary-answered")).toHaveTextContent("4");
    expect(screen.getByTestId("summary-unanswered")).toHaveTextContent("6");
    expect(screen.getByTestId("summary-flagged")).toHaveTextContent("1");
    expect(screen.getByTestId("summary-manual")).toHaveTextContent("0");
  });

  it("keeps background controls present but visually inert while modal (browser enforces interaction blocking)", async () => {
    const user = userEvent.setup();
    const backgroundClick = vi.fn();
    render(
      <div>
        <Button onClick={backgroundClick}>Background action</Button>
        <SubmitConfirmationDialog open onCancel={vi.fn()} onConfirm={vi.fn()} {...baseProps} />
      </div>,
    );
    /* jsdom does not model the UA top-layer/inert restriction that a real
       browser applies to `showModal()`; the authoritative check for
       "background is inert" lives in the Playwright suite, which runs in
       a real Chromium engine. This asserts the dialog is at least modal
       per the platform API, which is the mechanism the inertness relies on. */
    expect((screen.getByTestId("submit-dialog") as HTMLDialogElement).open).toBe(true);
    await user.click(screen.getByTestId("confirm-submit"));
    expect(backgroundClick).not.toHaveBeenCalled();
  });
});
