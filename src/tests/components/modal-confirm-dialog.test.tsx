import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConfirmDialog, Modal } from "@/components/ui";

describe("Modal", () => {
  it("is an open native dialog with a labelled title and description when `open` is true", () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete item" description="This cannot be undone.">
        <p>body content</p>
      </Modal>,
    );
    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    expect(dialog.open).toBe(true);
    expect(screen.getByRole("heading", { name: "Delete item" })).toBeVisible();
    expect(screen.getByText("This cannot be undone.")).toBeVisible();
    expect(screen.getByText("body content")).toBeVisible();
  });

  it("is closed when `open` is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Delete item">
        <p>body</p>
      </Modal>,
    );
    expect((document.querySelector("dialog") as HTMLDialogElement).open).toBe(false);
  });

  it("calls onClose from the close button and from a backdrop click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Delete item">
        <p>body</p>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const dialog = document.querySelector("dialog") as HTMLDialogElement;
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("does not call onClose for a click inside the dialog content", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Delete item">
        <p>body</p>
      </Modal>,
    );
    await user.click(screen.getByText("body"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("hides the close button when hideCloseButton is set", () => {
    render(
      <Modal open onClose={vi.fn()} title="Delete item" hideCloseButton>
        <p>body</p>
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  it("renders the title, description and default labels", () => {
    render(
      <ConfirmDialog
        open
        title="Abandon session?"
        description="Progress will be lost."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("heading", { name: "Abandon session?" })).toBeVisible();
    expect(screen.getByText("Progress will be lost.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  it("calls onConfirm and onCancel from their respective buttons with custom labels", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Abandon session?"
        confirmLabel="Abandon session"
        cancelLabel="Keep working"
        variant="danger"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Keep working" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Abandon session" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables both actions while isLoading is true", () => {
    render(
      <ConfirmDialog
        open
        title="Abandon session?"
        isLoading
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
  });
});
