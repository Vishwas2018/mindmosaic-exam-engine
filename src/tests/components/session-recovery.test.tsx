import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  preventDuplicateActiveSession,
  SessionRecoveryBanner,
  type ActiveSession,
} from "@/features/session-recovery";

const SESSION: ActiveSession = {
  id: "s1",
  examTitle: "Grade 5 Math Practice",
  resumeHref: "/exam/s1",
  startedAt: "2026-07-28T09:00:00.000Z",
  questionsAnswered: 3,
  totalQuestions: 10,
};

describe("preventDuplicateActiveSession", () => {
  it("allows a new session when none is active", () => {
    expect(preventDuplicateActiveSession(null)).toBe(true);
    expect(preventDuplicateActiveSession(undefined)).toBe(true);
  });

  it("blocks a new session while one is active with no expiry", () => {
    expect(preventDuplicateActiveSession(SESSION)).toBe(false);
  });

  it("blocks while the active session has not yet expired", () => {
    const now = new Date("2026-07-28T10:00:00.000Z");
    const session = { ...SESSION, expiresAt: "2026-07-28T11:00:00.000Z" };
    expect(preventDuplicateActiveSession(session, now)).toBe(false);
  });

  it("allows a new session once the active one has expired", () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    const session = { ...SESSION, expiresAt: "2026-07-28T11:00:00.000Z" };
    expect(preventDuplicateActiveSession(session, now)).toBe(true);
  });
});

describe("SessionRecoveryBanner", () => {
  it("shows the exam title and progress, and resumes on click", async () => {
    const user = userEvent.setup();
    const onResume = vi.fn();
    render(<SessionRecoveryBanner session={SESSION} onResume={onResume} onAbandon={vi.fn()} />);

    expect(screen.getByText(/Grade 5 Math Practice/)).toBeInTheDocument();
    expect(screen.getByText("3 of 10 questions answered")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume" }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("requires confirmation before abandoning, and lets the user back out", async () => {
    const user = userEvent.setup();
    const onAbandon = vi.fn();
    render(<SessionRecoveryBanner session={SESSION} onResume={vi.fn()} onAbandon={onAbandon} />);

    await user.click(screen.getByRole("button", { name: "Abandon" }));
    expect(screen.getByRole("heading", { name: "Abandon this session?" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Keep working" }));
    expect(onAbandon).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Abandon" }));
    await user.click(screen.getByRole("button", { name: "Abandon session" }));
    expect(onAbandon).toHaveBeenCalledTimes(1);
  });
});
