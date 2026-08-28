import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  RecommendationResult,
  SkillRecommendation,
} from "@/features/exam-engine/recommendation";
import { getDrillLaunchRequest } from "@/features/exam-engine/recommendation";
import { PractiseMissedSkills } from "@/features/exam-engine/recommendation/PractiseMissedSkills";
import type { ExamSelectionConfig } from "@/features/exam-engine/selection";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockConfig: ExamSelectionConfig = {
  yearLevel: 3,
  examStyle: "naplan_style",
  subject: "numeracy",
  questionCount: 10,
  timing: "untimed",
};

const mockRec1: SkillRecommendation = {
  subject: "numeracy",
  skillOrTopic: "Fractions",
  source: "skill",
  lostMarks: 3,
  accuracy: 25,
  attemptedCount: 4,
  totalCount: 4,
  reason: "3 of 4 Fractions questions need another look.",
};

const mockRec2: SkillRecommendation = {
  subject: "numeracy",
  skillOrTopic: "Decimals",
  source: "skill",
  lostMarks: 2,
  accuracy: 50,
  attemptedCount: 4,
  totalCount: 4,
  reason: "2 of 4 Decimals questions need another look.",
};

const mockRec3: SkillRecommendation = {
  subject: "numeracy",
  skillOrTopic: "Measurement",
  source: "skill",
  lostMarks: 1,
  accuracy: 75,
  attemptedCount: 4,
  totalCount: 4,
  reason: "1 of 4 Measurement questions need another look.",
};

describe("PractiseMissedSkills", () => {
  beforeEach(() => {
    mockPush.mockReset();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("renders positive state when perfect objective score achieved", () => {
    const result: RecommendationResult = {
      recommendations: [],
      perfectObjective: true,
    };

    render(
      <PractiseMissedSkills
        result={result}
        config={mockConfig}
        previousQuestionIds={["q1", "q2"]}
      />,
    );

    expect(screen.getByTestId("no-missed-skills")).toBeInTheDocument();
    expect(
      screen.getByText("No missed objective skills to revise from this session"),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("launch-drill")).not.toBeInTheDocument();
  });

  it("navigates with a truly opaque URL containing ONLY mode=drill and launchId", () => {
    const result: RecommendationResult = {
      recommendations: [mockRec1],
      perfectObjective: false,
    };

    render(
      <PractiseMissedSkills
        result={result}
        config={mockConfig}
        previousQuestionIds={["q1", "q2"]}
      />,
    );

    const launchBtn = screen.getByTestId("launch-drill");
    expect(launchBtn).toHaveTextContent("Practise Fractions");

    fireEvent.click(launchBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
    const calledUrl = mockPush.mock.calls[0][0] as string;

    // Verify URL contains ONLY mode and launchId, no subject/skill/year/count in query string
    const url = new URL(calledUrl, "http://localhost");
    expect(url.pathname).toBe("/practice/session");
    expect(url.searchParams.get("mode")).toBe("drill");
    expect(url.searchParams.has("launchId")).toBe(true);
    expect(url.searchParams.has("subject")).toBe(false);
    expect(url.searchParams.has("skill")).toBe(false);
    expect(url.searchParams.has("count")).toBe(false);
    expect(url.searchParams.has("year")).toBe(false);
    expect(url.searchParams.has("style")).toBe(false);

    // Verify sessionStorage has typed record with compact deterministic seed
    const launchId = url.searchParams.get("launchId");
    const stored = getDrillLaunchRequest(launchId!);
    expect(stored).not.toBeNull();
    expect(stored?.version).toBe(1);
    expect(stored?.subject).toBe("numeracy");
    expect(stored?.skillOrTopic).toBe("Fractions");
    expect(stored?.source).toBe("skill");
    expect(stored?.previousQuestionIds).toEqual(["q1", "q2"]);
    expect(stored?.yearLevel).toBe(3);
    expect(stored?.examStyle).toBe("naplan_style");
    expect(stored?.seed).toMatch(/^drill-numeracy-[0-9a-f]{8}$/);
  });

  it("handles storage write failure safely by remaining on Results page with an alert and retry button", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError: storage full");
    });

    const result: RecommendationResult = {
      recommendations: [mockRec1],
      perfectObjective: false,
    };

    render(
      <PractiseMissedSkills
        result={result}
        config={mockConfig}
        previousQuestionIds={["q1", "q2"]}
      />,
    );

    const launchBtn = screen.getByTestId("launch-drill");
    fireEvent.click(launchBtn);

    // Did NOT navigate
    expect(mockPush).not.toHaveBeenCalled();

    // Renders accessible alert
    const alert = screen.getByTestId("drill-storage-error");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("role", "alert");
    expect(alert).toHaveTextContent(
      "We couldn't start your practice drill because browser storage is unavailable. Please enable storage or try again.",
    );

    // Has working retry button
    const retryBtn = screen.getByTestId("retry-storage");
    expect(retryBtn).toBeInTheDocument();

    // Restore storage and retry
    vi.restoreAllMocks();
    fireEvent.click(retryBtn);

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it("handles window.sessionStorage SecurityError by remaining on Results page with accessible alert", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    const result: RecommendationResult = {
      recommendations: [mockRec1],
      perfectObjective: false,
    };

    render(
      <PractiseMissedSkills
        result={result}
        config={mockConfig}
        previousQuestionIds={["q1", "q2"]}
      />,
    );

    const launchBtn = screen.getByTestId("launch-drill");
    fireEvent.click(launchBtn);

    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByTestId("drill-storage-error")).toBeInTheDocument();
  });

  it("implements standard WAI-ARIA radiogroup keyboard navigation with focus, aria-checked, and wrapping", () => {
    const result: RecommendationResult = {
      recommendations: [mockRec1, mockRec2, mockRec3],
      perfectObjective: false,
    };

    render(
      <PractiseMissedSkills
        result={result}
        config={mockConfig}
        previousQuestionIds={["q1", "q2"]}
      />,
    );

    const target0 = screen.getByTestId("drill-target-0");
    const target1 = screen.getByTestId("drill-target-1");
    const target2 = screen.getByTestId("drill-target-2");
    const launchBtn = screen.getByTestId("launch-drill");

    // Initial state: target0 is selected and only target0 has tabIndex=0
    expect(target0).toHaveAttribute("aria-checked", "true");
    expect(target0).toHaveAttribute("tabIndex", "0");
    expect(target1).toHaveAttribute("aria-checked", "false");
    expect(target1).toHaveAttribute("tabIndex", "-1");
    expect(target2).toHaveAttribute("aria-checked", "false");
    expect(target2).toHaveAttribute("tabIndex", "-1");
    expect(launchBtn).toHaveTextContent("Practise Fractions");

    // Focus target0 and press ArrowRight -> moves to target1
    target0.focus();
    fireEvent.keyDown(target0, { key: "ArrowRight" });

    expect(target1).toHaveAttribute("aria-checked", "true");
    expect(target1).toHaveAttribute("tabIndex", "0");
    expect(target0).toHaveAttribute("aria-checked", "false");
    expect(target0).toHaveAttribute("tabIndex", "-1");
    expect(launchBtn).toHaveTextContent("Practise Decimals");

    // Press ArrowDown on target1 -> moves to target2
    fireEvent.keyDown(target1, { key: "ArrowDown" });

    expect(target2).toHaveAttribute("aria-checked", "true");
    expect(target2).toHaveAttribute("tabIndex", "0");
    expect(target1).toHaveAttribute("aria-checked", "false");
    expect(launchBtn).toHaveTextContent("Practise Measurement");

    // Press ArrowDown on target2 -> wraps back to target0
    fireEvent.keyDown(target2, { key: "ArrowDown" });

    expect(target0).toHaveAttribute("aria-checked", "true");
    expect(target0).toHaveAttribute("tabIndex", "0");
    expect(target2).toHaveAttribute("aria-checked", "false");
    expect(launchBtn).toHaveTextContent("Practise Fractions");

    // Press ArrowLeft on target0 -> wraps backwards to target2
    fireEvent.keyDown(target0, { key: "ArrowLeft" });

    expect(target2).toHaveAttribute("aria-checked", "true");
    expect(target2).toHaveAttribute("tabIndex", "0");
    expect(target0).toHaveAttribute("aria-checked", "false");
    expect(launchBtn).toHaveTextContent("Practise Measurement");

    // Press ArrowUp on target2 -> moves backwards to target1
    fireEvent.keyDown(target2, { key: "ArrowUp" });

    expect(target1).toHaveAttribute("aria-checked", "true");
    expect(target1).toHaveAttribute("tabIndex", "0");
    expect(launchBtn).toHaveTextContent("Practise Decimals");

    // Space / Enter on target1 keeps selection
    fireEvent.keyDown(target1, { key: " " });
    expect(target1).toHaveAttribute("aria-checked", "true");

    // Mouse click selects target0
    fireEvent.click(target0);
    expect(target0).toHaveAttribute("aria-checked", "true");
    expect(launchBtn).toHaveTextContent("Practise Fractions");
  });
});
