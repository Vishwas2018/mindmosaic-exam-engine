import { useRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ConfirmDialog,
  Modal,
  PermissionDenied,
  Skeleton,
  SkeletonText,
  ToastProvider,
  UpgradeRequired,
  useToast,
  type ToastOptions,
} from "@/components/ui";

describe("Skeleton", () => {
  it("is decorative (aria-hidden) so screen readers skip it", () => {
    render(<Skeleton width={120} height={16} />);
    const el = screen.getByTestId("skeleton");
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveStyle({ width: "120px", height: "16px" });
  });

  it("SkeletonText renders one block per line", () => {
    render(<SkeletonText lines={4} />);
    expect(screen.getByTestId("skeleton-text")).toBeInTheDocument();
    expect(screen.getAllByTestId("skeleton")).toHaveLength(4);
  });

  it("SkeletonText clamps to at least one line", () => {
    render(<SkeletonText lines={0} />);
    expect(screen.getAllByTestId("skeleton")).toHaveLength(1);
  });
});

describe("Modal", () => {
  function Harness({ initialOpen = false }: { initialOpen?: boolean }) {
    const [open, setOpen] = useState(initialOpen);
    return (
      <div>
        <button type="button" data-testid="opener" onClick={() => setOpen(true)}>
          Open
        </button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="Edit child"
          description="Update the details for this child."
        >
          <p>Body content</p>
        </Modal>
      </div>
    );
  }

  it("is an open native dialog with labelled title and description", () => {
    render(
      <Modal open onClose={vi.fn()} title="Edit child" description="Update the details.">
        <p>Body</p>
      </Modal>,
    );
    const dialog = screen.getByTestId("modal");
    expect(dialog.tagName).toBe("DIALOG");
    expect((dialog as HTMLDialogElement).open).toBe(true);
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
    expect(screen.getByRole("heading", { name: "Edit child" })).toBeVisible();
  });

  it("is closed when open is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Edit child">
        <p>Body</p>
      </Modal>,
    );
    expect((screen.getByTestId("modal") as HTMLDialogElement).open).toBe(false);
  });

  it("opens and closes imperatively as the prop changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect((screen.getByTestId("modal") as HTMLDialogElement).open).toBe(false);
    await user.click(screen.getByTestId("opener"));
    expect((screen.getByTestId("modal") as HTMLDialogElement).open).toBe(true);
    await user.click(screen.getByTestId("modal-close"));
    expect((screen.getByTestId("modal") as HTMLDialogElement).open).toBe(false);
  });

  it("hides the close button when not dismissable", () => {
    render(
      <Modal open onClose={vi.fn()} title="Working" dismissable={false}>
        <p>Please wait</p>
      </Modal>,
    );
    expect(screen.queryByTestId("modal-close")).not.toBeInTheDocument();
  });
});

describe("ConfirmDialog", () => {
  const base = {
    open: true as const,
    title: "Archive this child?",
    description: "Archived children can be restored later.",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  afterEach(() => {
    base.onConfirm.mockReset();
    base.onCancel.mockReset();
  });

  it("wires confirm and cancel to their handlers", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog {...base} confirmLabel="Archive" />);
    await user.click(screen.getByTestId("confirm-dialog-confirm"));
    expect(base.onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByTestId("confirm-dialog-cancel"));
    expect(base.onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables actions and hides dismissal while loading", () => {
    render(<ConfirmDialog {...base} isLoading />);
    expect(screen.getByTestId("confirm-dialog-cancel")).toBeDisabled();
    expect(screen.getByTestId("confirm-dialog-confirm")).toBeDisabled();
    expect(screen.queryByTestId("confirm-dialog-close")).not.toBeInTheDocument();
  });
});

describe("Toast", () => {
  function ToastTrigger({ options }: { options: ToastOptions }) {
    const { toast } = useToast();
    const optsRef = useRef(options);
    optsRef.current = options;
    return (
      <button type="button" data-testid="fire" onClick={() => toast(optsRef.current)}>
        Fire
      </button>
    );
  }

  it("useToast throws outside a provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<ToastTrigger options={{ title: "x" }} />)).toThrow(
      /ToastProvider/,
    );
    spy.mockRestore();
  });

  it("shows a toast when fired and marks errors assertive", () => {
    render(
      <ToastProvider>
        <ToastTrigger options={{ title: "Saved", variant: "error" }} />
      </ToastProvider>,
    );
    expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("fire"));
    const toast = screen.getByTestId("toast");
    expect(toast).toHaveTextContent("Saved");
    expect(toast).toHaveAttribute("role", "alert");
    expect(toast).toHaveAttribute("data-variant", "error");
  });

  it("auto-dismisses after its duration", () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <ToastTrigger options={{ title: "Bye", duration: 3000 }} />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByTestId("fire"));
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stays until dismissed when duration is 0", () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <ToastTrigger options={{ title: "Sticky", duration: 0 }} />
        </ToastProvider>,
      );
      fireEvent.click(screen.getByTestId("fire"));
      act(() => {
        vi.advanceTimersByTime(60000);
      });
      expect(screen.getByTestId("toast")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
      expect(screen.queryByTestId("toast")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("PermissionDenied", () => {
  it("is an alert with a role-boundary message and no upgrade link", () => {
    render(<PermissionDenied />);
    const el = screen.getByTestId("permission-denied");
    expect(el).toHaveAttribute("role", "alert");
    expect(el).toHaveTextContent(/access/i);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

describe("UpgradeRequired", () => {
  it("links to billing carrying the required tier and feature context", () => {
    render(<UpgradeRequired requiredTier="Premium" feature="Detailed insights" />);
    const cta = screen.getByTestId("upgrade-cta");
    expect(cta.tagName).toBe("A");
    const href = cta.getAttribute("href") ?? "";
    expect(href.startsWith("/billing?")).toBe(true);
    const query = new URLSearchParams(href.split("?")[1]);
    expect(query.get("requiredTier")).toBe("Premium");
    expect(query.get("feature")).toBe("Detailed insights");
  });

  it("uses a button when an in-page upgrade handler is given", async () => {
    const user = userEvent.setup();
    const onUpgrade = vi.fn();
    render(<UpgradeRequired requiredTier="Standard" onUpgrade={onUpgrade} />);
    const cta = screen.getByTestId("upgrade-cta");
    expect(cta.tagName).toBe("BUTTON");
    await user.click(cta);
    expect(onUpgrade).toHaveBeenCalledTimes(1);
  });
});
