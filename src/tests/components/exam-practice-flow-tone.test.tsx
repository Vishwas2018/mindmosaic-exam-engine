import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/auth", () => ({
  useAuth: () => ({ status: "anonymous", role: null }),
}));

vi.mock("server-only", () => ({}));

import { ExamConditionBar } from "@/features/exam-engine/components/ExamConditionBar";
import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { ExamInstructions } from "@/features/exam-engine/components/ExamInstructions";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";
import { useExamStore } from "@/features/exam-engine/state";
import { getBankEligibility } from "@/server/exam-bank";

/**
 * The practice flow is for 8 to 10 year olds. These pin the tone decisions: a calm default,
 * practice that is not called an exam, and the timed-sitting rules said plainly (and still
 * stated exactly, because they describe what the app really does).
 */
const config: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "timed",
};

describe("calm defaults", () => {
  it("starts the setup screen untimed, so a first session has no countdown unless the child opts in", () => {
    render(<ExamConfigurator bankEligibility={getBankEligibility()} />);
    expect(screen.getByTestId("select-timing")).toHaveValue("untimed");
  });
});

describe("ExamInstructions", () => {
  const base = {
    config,
    questionCount: 10,
    durationMinutes: 15,
    includesManualMarking: false,
    onBack: () => {},
    onStart: () => {},
    isBusy: false,
  } as const;

  it("states the timed rules plainly without exam-hall wording", () => {
    render(<ExamInstructions {...base} timing="timed" />);
    expect(screen.getByText("You have 15 minutes")).toBeInTheDocument();
    expect(screen.getByText("Quiet rules while the clock runs")).toBeInTheDocument();
    // Still exact about what actually happens.
    expect(screen.getByText(/Copy, paste and right-click are off/)).toBeInTheDocument();
    expect(screen.getByText(/we note if you switch to another tab or app/)).toBeInTheDocument();
    expect(screen.queryByText("Exam conditions apply")).not.toBeInTheDocument();
  });

  it("shows no timed rules when untimed", () => {
    render(<ExamInstructions {...base} timing="untimed" />);
    expect(screen.getByText("No time limit")).toBeInTheDocument();
    expect(screen.queryByText("Quiet rules while the clock runs")).not.toBeInTheDocument();
  });

  it("calls a quick sitting practice and a named full-length paper an exam", () => {
    const { rerender } = render(<ExamInstructions {...base} timing="untimed" />);
    expect(screen.getByTestId("begin-exam")).toHaveTextContent("Start practice");
    rerender(<ExamInstructions {...base} timing="timed" title="NAPLAN-style Year 5 Numeracy: full-length practice" />);
    expect(screen.getByTestId("begin-exam")).toHaveTextContent("Start exam");
  });
});

describe("ExamConditionBar", () => {
  beforeEach(() => {
    useExamStore.setState({ config, remainingSeconds: 600, sessionMode: "local", lastAutosavedAt: null });
  });

  it("says timed practice for a quick sitting and exam conditions only for a full paper", () => {
    const { rerender } = render(<ExamConditionBar description="Grade 3 NAPLAN" onExit={() => {}} />);
    expect(screen.getByText("Timed practice · in progress")).toBeInTheDocument();
    rerender(<ExamConditionBar description="Grade 3 NAPLAN" fullPaper onExit={() => {}} />);
    expect(screen.getByText("Exam conditions · in progress")).toBeInTheDocument();
  });

  it("keeps the real autosave state and the way out", () => {
    render(<ExamConditionBar description="Grade 3 NAPLAN" onExit={() => {}} />);
    expect(screen.getByText("Not saved")).toBeInTheDocument();
    expect(screen.getByTestId("exit-exam")).toBeInTheDocument();
  });
});
