import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { ActiveSessionBanner } from "@/features/exam-engine/components/ActiveSessionBanner";
import type { ActiveSessionResponse } from "@/features/exam-engine/scoring/server-scoring-contract";
import { toActiveSession } from "@/features/exam-engine/state/active-session-view";
import { useExamStore } from "@/features/exam-engine/state";
import { toCandidateQuestions } from "@/features/exam-engine/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
}));

let authStatus: "loading" | "authenticated" | "anonymous" | "unconfigured" = "authenticated";
vi.mock("@/features/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/auth")>();
  return {
    ...actual,
    useAuth: () => ({ status: authStatus }),
  };
});

const twoQuestions = questionBank.filter((q) => q.metadata.subject === "numeracy").slice(0, 2);

const ACTIVE: ActiveSessionResponse = {
  sessionId: "session-1",
  bankId: "curated",
  config: {
    yearLevel: 3,
    examStyle: "naplan_style",
    subject: "numeracy",
    questionCount: 10,
    timing: "timed",
  },
  questions: toCandidateQuestions(twoQuestions),
  responses: { [twoQuestions[0].id]: "some-answer" },
  currentQuestionIndex: 1,
  flaggedQuestionIds: [],
  startedAt: "2026-07-28T09:00:00.000Z",
  durationSeconds: 900,
};

beforeEach(() => {
  authStatus = "authenticated";
  useExamStore.getState().resetExam();
  push.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("toActiveSession", () => {
  it("maps the resume payload to the shared ActiveSession shape", () => {
    const mapped = toActiveSession(ACTIVE);
    expect(mapped.id).toBe("session-1");
    expect(mapped.resumeHref).toBe("/exam");
    expect(mapped.totalQuestions).toBe(2);
    expect(mapped.questionsAnswered).toBe(1);
    expect(mapped.expiresAt).toBe(
      new Date(Date.parse(ACTIVE.startedAt) + 900 * 1000).toISOString(),
    );
  });

  it("leaves expiresAt undefined for an untimed session", () => {
    const mapped = toActiveSession({ ...ACTIVE, durationSeconds: null });
    expect(mapped.expiresAt).toBeUndefined();
  });
});

describe("ActiveSessionBanner", () => {
  it("renders nothing for a guest", () => {
    authStatus = "anonymous";
    render(<ActiveSessionBanner />);
    expect(screen.queryByRole("region", { name: "Resume previous session" })).not.toBeInTheDocument();
  });

  it("renders nothing when the signed-in student has no active session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    render(<ActiveSessionBanner />);
    await waitFor(() =>
      expect(screen.queryByRole("region", { name: "Resume previous session" })).not.toBeInTheDocument(),
    );
  });

  it("shows the resume banner and navigates to /exam on resume", async () => {
    const user = userEvent.setup();
    /* A fresh Response per call: the banner's own lookup and the store's
       resumeServerExam() each read the body once, and a Response body can
       only be consumed a single time. */
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(ACTIVE)))),
    );
    render(<ActiveSessionBanner />);

    await screen.findByRole("region", { name: "Resume previous session" });
    expect(screen.getByText("1 of 2 questions answered")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Resume" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/exam"));
  });

  it("dismisses the banner once abandon is confirmed", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(ACTIVE))));
    render(<ActiveSessionBanner />);

    await screen.findByRole("region", { name: "Resume previous session" });
    await user.click(screen.getByRole("button", { name: "Abandon" }));
    await user.click(screen.getByRole("button", { name: "Abandon session" }));

    expect(screen.queryByRole("region", { name: "Resume previous session" })).not.toBeInTheDocument();
  });
});
