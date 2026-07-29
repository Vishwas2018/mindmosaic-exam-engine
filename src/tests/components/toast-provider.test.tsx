import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "@/components/ui";

function ToastDemo() {
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={() =>
        showToast({ title: "Saved", description: "Your answer was saved.", variant: "success", duration: 0 })
      }
    >
      trigger save
    </button>
  );
}

describe("ToastProvider / useToast", () => {
  it("throws a helpful error when useToast is called outside a provider", () => {
    function Bad() {
      useToast();
      return null;
    }
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bad />)).toThrow(/useToast must be used within a ToastProvider/);
    consoleError.mockRestore();
  });

  it("shows a toast on demand and dismisses it via its close button", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );

    expect(screen.queryByText("Your answer was saved.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "trigger save" }));

    expect(screen.getByText("Saved")).toBeInTheDocument();
    expect(screen.getByText("Your answer was saved.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Your answer was saved.")).not.toBeInTheDocument();
  });

  it("supports multiple simultaneous toasts", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastDemo />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "trigger save" }));
    await user.click(screen.getByRole("button", { name: "trigger save" }));
    expect(screen.getAllByText("Your answer was saved.")).toHaveLength(2);
  });
});
