import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let params = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
}));

import { SessionExpiredScreen, workStatusSentence } from "@/features/auth/components/SessionExpiredScreen";
import { recordConfirmedSave, recordNoOpenWork, recordOpenWorkUnconfirmed } from "@/features/auth/session-work-status";

describe("SessionExpiredScreen — three honest versions", () => {
  beforeEach(() => {
    window.localStorage.clear();
    params = new URLSearchParams();
  });

  it("says 'saved' with a time only after the server confirmed a save", async () => {
    recordConfirmedSave(new Date().toISOString());
    render(<SessionExpiredScreen />);
    expect(await screen.findByText(/was saved on our server at \d{1,2}:\d{2} [ap]m/i)).toBeInTheDocument();
  });

  it("says 'can't confirm' — neither saved nor lost — when nothing was confirmed", async () => {
    render(<SessionExpiredScreen />);
    const text = await screen.findByText(/can.t confirm the last few answers/i);
    expect(text).not.toHaveTextContent(/saved|lost|nothing was in progress/i);
  });

  it("does not treat an open-but-unconfirmed sitting as saved or empty", async () => {
    recordOpenWorkUnconfirmed();
    render(<SessionExpiredScreen />);
    const text = await screen.findByText(/can.t confirm/i);
    expect(text).not.toHaveTextContent(/saved|nothing was in progress/i);
  });

  it("says 'nothing was in progress' only when the server confirmed none", async () => {
    recordNoOpenWork();
    render(<SessionExpiredScreen />);
    expect(await screen.findByText(/nothing was in progress/i)).toBeInTheDocument();
  });

  it("never uses the word 'lost'", () => {
    for (const status of [
      { kind: "confirmed", savedAt: "2026-11-12T06:02:00.000Z" } as const,
      { kind: "empty" } as const,
      { kind: "unknown" } as const,
    ]) {
      expect(workStatusSentence(status)).not.toMatch(/\blost\b/i);
    }
  });

  it("returns the person to where they were, and only to a same-origin path", async () => {
    params = new URLSearchParams({ next: "/parent/children" });
    const { unmount } = render(<SessionExpiredScreen />);
    expect(screen.getByRole("link", { name: /sign in and continue/i })).toHaveAttribute(
      "href",
      "/sign-in?next=%2Fparent%2Fchildren",
    );
    unmount();

    params = new URLSearchParams({ next: "https://evil.test/x" });
    render(<SessionExpiredScreen />);
    expect(screen.getByRole("link", { name: /sign in and continue/i })).toHaveAttribute("href", "/sign-in");
  });
});
