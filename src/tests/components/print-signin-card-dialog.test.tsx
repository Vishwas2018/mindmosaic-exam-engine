import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PrintSignInCardDialog } from "@/features/parent-dashboard/components/PrintSignInCardDialog";

describe("PrintSignInCardDialog", () => {
  afterEach(() => {
    document.documentElement.classList.remove("printing-signin-card");
    vi.restoreAllMocks();
  });

  function mount() {
    return render(
      <PrintSignInCardDialog open onClose={() => {}} childName="Ava" loginCode="7H4D-X74G" yearLevel={3} />,
    );
  }

  it("shows the real login code and this site's sign-in address, never a placeholder or fixed domain", () => {
    mount();
    expect(screen.getByText("7H4D-X74G")).toBeInTheDocument();
    expect(screen.getByTestId("signin-card-address")).toHaveTextContent(`${window.location.host}/sign-in`);
    expect(screen.queryByText(/mindmosaic\.com\.au/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CODE-SET/)).not.toBeInTheDocument();
  });

  it("scopes printing to the card and clears the scope when printing ends", () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => {});
    mount();
    fireEvent.click(screen.getByRole("button", { name: /print card/i }));
    expect(print).toHaveBeenCalledTimes(1);
    expect(document.documentElement).toHaveClass("printing-signin-card");
    window.dispatchEvent(new Event("afterprint"));
    expect(document.documentElement).not.toHaveClass("printing-signin-card");
  });

  it("does not leave the print scope behind when closed", () => {
    vi.spyOn(window, "print").mockImplementation(() => {});
    const { unmount } = mount();
    fireEvent.click(screen.getByRole("button", { name: /print card/i }));
    unmount();
    expect(document.documentElement).not.toHaveClass("printing-signin-card");
  });
});
