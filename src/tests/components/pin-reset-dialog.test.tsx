import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PinResetDialog } from "@/features/parent-dashboard/components/PinResetDialog";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PinResetDialog", () => {
  it("renders confirmation step with security explanation", () => {
    render(
      <PinResetDialog
        open={true}
        onClose={vi.fn()}
        childId="child-1"
        childName="Aisha"
      />,
    );

    expect(screen.getByRole("heading", { name: /Reset Aisha’s PIN\?/i })).toBeInTheDocument();
    expect(screen.getByText(/The old PIN stops working straight away and Aisha must use the new PIN/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset the PIN" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep it" })).toBeInTheDocument();
  });

  it("transitions to done state showing the 6-digit PIN once", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const onPinReset = vi.fn();
    const user = userEvent.setup();

    render(
      <PinResetDialog
        open={true}
        onClose={vi.fn()}
        childId="child-1"
        childName="Aisha"
        onPinReset={onPinReset}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reset the PIN" }));

    expect(await screen.findByRole("heading", { name: "New PIN set" })).toBeInTheDocument();
    expect(screen.getByText(/Aisha’s new PIN/i)).toBeInTheDocument();
    expect(screen.getByText(/Write this down now/i)).toBeInTheDocument();
    expect(screen.getByText(/We cannot show it again — we only keep a scrambled copy/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I’ve written it down" })).toBeInTheDocument();
    expect(onPinReset).toHaveBeenCalled();
  });

  it("handles failure by assuring the parent the old PIN still works", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: false, message: "Database temporarily unavailable" }), { status: 500 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();

    render(
      <PinResetDialog
        open={true}
        onClose={vi.fn()}
        childId="child-1"
        childName="Aisha"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Reset the PIN" }));

    expect(await screen.findByRole("heading", { name: "We couldn’t reset the PIN" })).toBeInTheDocument();
    expect(screen.getByText(/Aisha’s old PIN still works and nothing has changed/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
