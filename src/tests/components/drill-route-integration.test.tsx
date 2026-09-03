import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PracticeSkillSessionPage from "@/app/practice/session/page";
import * as recommendationModule from "@/features/exam-engine/recommendation";
import {
  DRILL_STORAGE_PREFIX,
  saveDrillLaunchRequest,
} from "@/features/exam-engine/recommendation";
import type { Question } from "@/schemas/question.schema";
import { bankQuestion } from "@/tests/fixtures/exam-pattern-bank";

let mockSearchParams = new URLSearchParams();
let fetchSpy: ReturnType<typeof vi.fn>;

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/practice/session",
}));

// Controls curriculum-node -> mapped-question-id resolution for the
// skill-scoped fail-closed tests below, independent of the real (large)
// static alignment tables.
vi.mock("@/features/curriculum/lessons/alignments", () => ({
  getMappedQuestionIdsForNode: (code: string) => {
    if (code === "TEST-COVERED-NODE") {
      return ["pub-fresh-frac-1", "pub-fresh-frac-2"];
    }
    return [];
  },
}));

function makePublishedQuestion(overrides: {
  id: string;
  prompt?: string;
  subject?: string;
  skill?: string;
  topic?: string;
  yearLevel?: 3 | 5;
  examStyle?: "naplan_style" | "icas_style";
}): Question {
  const q = bankQuestion({
    id: overrides.id,
    subject: overrides.subject ?? "numeracy",
    yearLevel: overrides.yearLevel ?? 3,
    examStyle: overrides.examStyle ?? "naplan_style",
  });
  return {
    ...q,
    prompt: overrides.prompt ?? `Prompt for ${overrides.id}`,
    metadata: {
      ...q.metadata,
      skill: overrides.skill,
      topic: overrides.topic ?? "Fractions",
    },
  } as unknown as Question;
}

/**
 * BANK FIXTURES ORDER:
 * Put previous-question fixtures FIRST so a naive `slice(0, 5)` implementation
 * would select previous questions and fail the architecture regression test.
 */
const PUBLISHED_BANK: Question[] = [
  // 5 previous questions on Fractions (placed first!)
  ...Array.from({ length: 5 }, (_, i) =>
    makePublishedQuestion({
      id: `prev-frac-${i + 1}`,
      prompt: `PREVIOUS ASSESSMENT QUESTION ${i + 1}`,
      subject: "numeracy",
      skill: "Fractions",
      yearLevel: 3,
      examStyle: "naplan_style",
    }),
  ),
  // 5 fresh non-previous questions on Fractions
  ...Array.from({ length: 5 }, (_, i) =>
    makePublishedQuestion({
      id: `pub-fresh-frac-${i + 1}`,
      prompt: `FRESH DRILL QUESTION ${i + 1}`,
      subject: "numeracy",
      skill: "Fractions",
      yearLevel: 3,
      examStyle: "naplan_style",
    }),
  ),
  // 3 questions on Decimals (insufficient for a 5-question drill)
  ...Array.from({ length: 3 }, (_, i) =>
    makePublishedQuestion({
      id: `pub-dec-${i + 1}`,
      subject: "numeracy",
      skill: "Decimals",
      yearLevel: 3,
      examStyle: "naplan_style",
    }),
  ),
  // 10 questions on Reading Inference
  ...Array.from({ length: 10 }, (_, i) =>
    makePublishedQuestion({
      id: `pub-inf-${i + 1}`,
      subject: "reading",
      skill: "Inference",
      yearLevel: 3,
      examStyle: "naplan_style",
    }),
  ),
];

const EXTENDED_PRACTICE_BANK: Question[] = [
  // Unreviewed seed questions that should NEVER be used in drill mode
  ...Array.from({ length: 10 }, (_, i) =>
    makePublishedQuestion({
      id: `unreviewed-seed-${i + 1}`,
      subject: "numeracy",
      skill: "Decimals",
      yearLevel: 3,
      examStyle: "naplan_style",
    }),
  ),
];

function stubGuestBankFetch(published = PUBLISHED_BANK, practice = EXTENDED_PRACTICE_BANK) {
  fetchSpy = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        curated: published,
        published,
        practice,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchSpy);
}

describe("PracticeSkillSessionPage live route architecture & regression tests", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
    stubGuestBankFetch();
  });

  it("conclusively proves live route invokes buildDrill with banks.published, reconstructs stored target, and passes only 5 fresh question IDs into PracticeSession", async () => {
    const buildDrillSpy = vi.spyOn(recommendationModule, "buildDrill");

    const previousIds = [
      "prev-frac-1",
      "prev-frac-2",
      "prev-frac-3",
      "prev-frac-4",
      "prev-frac-5",
    ];

    const saveResult = saveDrillLaunchRequest({
      launchId: "",
      subject: "numeracy",
      skillOrTopic: "Fractions",
      source: "skill",
      yearLevel: 3,
      examStyle: "naplan_style",
      previousQuestionIds: previousIds,
      seed: "deterministic-test-seed",
    });

    expect(saveResult.ok).toBe(true);
    if (!saveResult.ok) return;

    // Truly opaque URL containing ONLY mode and launchId
    mockSearchParams = new URLSearchParams(
      `mode=drill&launchId=${saveResult.launchId}`,
    );

    render(<PracticeSkillSessionPage />);

    // Wait for bank fetch and PracticeSession render
    await waitFor(() => {
      expect(screen.getByTestId("practice-nav-1")).toBeInTheDocument();
    });

    // 1. Proves live route invoked buildDrill
    expect(buildDrillSpy).toHaveBeenCalledTimes(1);

    // 2. Proves buildDrill received ONLY banks.published (and never extended bank)
    const passedBank = buildDrillSpy.mock.calls[0][0];
    expect(passedBank.map((q) => q.id)).toEqual(
      PUBLISHED_BANK.map((q) => q.id),
    );
    expect(passedBank).not.toContainEqual(
      expect.objectContaining({ id: "unreviewed-seed-1" }),
    );

    // 3. Proves target was reconstructed from the stored handoff
    const passedTarget = buildDrillSpy.mock.calls[0][1];
    expect(passedTarget.recommendation.subject).toBe("numeracy");
    expect(passedTarget.recommendation.skillOrTopic).toBe("Fractions");
    expect(passedTarget.yearLevel).toBe(3);
    expect(passedTarget.examStyle).toBe("naplan_style");
    expect(passedTarget.previousQuestionIds).toEqual(previousIds);
    expect(passedTarget.seed).toBe("deterministic-test-seed");

    // 4. Proves buildDrill returned the 5 fresh IDs and excluded all 5 previous IDs
    const drillResult = buildDrillSpy.mock.results[0]?.value;
    expect(drillResult.ok).toBe(true);
    if (drillResult.ok) {
      expect(new Set(drillResult.questionIds)).toEqual(
        new Set([
          "pub-fresh-frac-1",
          "pub-fresh-frac-2",
          "pub-fresh-frac-3",
          "pub-fresh-frac-4",
          "pub-fresh-frac-5",
        ]),
      );
      for (const prevId of previousIds) {
        expect(drillResult.questionIds).not.toContain(prevId);
      }
    }

    // 5. Navigate through all 5 questions in the live UI and assert each fresh prompt is rendered
    for (let i = 1; i <= 5; i++) {
      fireEvent.click(screen.getByTestId(`practice-nav-${i}`));
      expect(screen.getByText(/FRESH DRILL QUESTION/)).toBeInTheDocument();
      // Verify no previous assessment question prompt is ever displayed
      expect(
        screen.queryByText(/PREVIOUS ASSESSMENT QUESTION/),
      ).not.toBeInTheDocument();
    }

    // Check header exit button has "Back to results" and points to /results
    const exitLink = screen.getByTestId("exit-practice");
    expect(exitLink).toHaveTextContent("Back to results");
    expect(exitLink).toHaveAttribute("href", "/results");

    // Bank fetch was called exactly once for valid drill
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith("/api/exam/guest-bank");
  });

  it("proves extra/tampered query parameters cannot alter stored target configuration", async () => {
    const saveResult = saveDrillLaunchRequest({
      launchId: "",
      subject: "numeracy",
      skillOrTopic: "Fractions",
      source: "skill",
      yearLevel: 3,
      examStyle: "naplan_style",
      previousQuestionIds: [],
      seed: "seed",
    });

    expect(saveResult.ok).toBe(true);
    if (!saveResult.ok) return;

    // Attacker tries to inject altered subject, count, skill, and extended=1
    mockSearchParams = new URLSearchParams(
      `mode=drill&launchId=${saveResult.launchId}&subject=science&skill=Gravity&count=100&extended=1`,
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(screen.getByTestId("practice-nav-1")).toBeInTheDocument();
    });

    // Practice session renders Fractions from stored request, NOT tampered Gravity/Science
    expect(screen.getByText("Practise: Fractions")).toBeInTheDocument();
    expect(screen.queryByText("Gravity")).not.toBeInTheDocument();

    // Count is exactly 5 from stored target, NOT tampered 100
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByTestId(`practice-nav-${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByTestId("practice-nav-6")).not.toBeInTheDocument();
  });

  it("does not fetch guest bank when launch record is missing from sessionStorage", async () => {
    mockSearchParams = new URLSearchParams(
      "mode=drill&launchId=non-existent-launch-id",
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Practice drill session not found" }),
      ).toBeInTheDocument();
    });

    // Must NOT fetch guest bank when handoff is missing/invalid
    expect(fetchSpy).not.toHaveBeenCalled();

    expect(screen.getByRole("link", { name: "Back to results" })).toHaveAttribute(
      "href",
      "/results",
    );
  });

  it("does not fetch guest bank when launch record is expired (> 2 hours)", async () => {
    const key = `${DRILL_STORAGE_PREFIX}expired-drill-id`;
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        launchId: "expired-drill-id",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
        createdAt: Date.now() - 3 * 60 * 60 * 1000, // 3 hours old
      }),
    );

    mockSearchParams = new URLSearchParams(
      "mode=drill&launchId=expired-drill-id",
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Practice drill session not found" }),
      ).toBeInTheDocument();
    });

    // Guest bank must NOT be fetched for expired handoff
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch guest bank when launch record is future-dated", async () => {
    const key = `${DRILL_STORAGE_PREFIX}future-drill-id`;
    window.sessionStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        launchId: "future-drill-id",
        subject: "numeracy",
        skillOrTopic: "Fractions",
        source: "skill",
        yearLevel: 3,
        examStyle: "naplan_style",
        previousQuestionIds: [],
        seed: "seed",
        createdAt: Date.now() + 10 * 60 * 1000, // 10 minutes in the future
      }),
    );

    mockSearchParams = new URLSearchParams(
      "mode=drill&launchId=future-drill-id",
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Practice drill session not found" }),
      ).toBeInTheDocument();
    });

    // Guest bank must NOT be fetched for future-dated handoff
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch guest bank when storage access throws SecurityError", async () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    });

    mockSearchParams = new URLSearchParams(
      "mode=drill&launchId=some-launch-id",
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Practice drill session not found" }),
      ).toBeInTheDocument();
    });

    // Guest bank must NOT be fetched when storage threw SecurityError
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not fetch guest bank when mode=drill has empty launchId", async () => {
    mockSearchParams = new URLSearchParams("mode=drill");

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Invalid drill parameters" }),
      ).toBeInTheDocument();
    });

    // Guest bank must NOT be fetched for invalid params
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("renders honest insufficiency state when published questions are fewer than 5", async () => {
    const saveResult = saveDrillLaunchRequest({
      launchId: "",
      subject: "numeracy",
      skillOrTopic: "Decimals", // only 3 published questions exist
      source: "skill",
      yearLevel: 3,
      examStyle: "naplan_style",
      previousQuestionIds: [],
      seed: "seed",
    });

    expect(saveResult.ok).toBe(true);
    if (!saveResult.ok) return;

    mockSearchParams = new URLSearchParams(
      `mode=drill&launchId=${saveResult.launchId}`,
    );

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "There aren't enough published questions for this skill yet",
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Only 3 eligible published questions found for Decimals; 5 are needed/),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Back to results" })).toHaveAttribute(
      "href",
      "/results",
    );
    expect(screen.getByRole("link", { name: "Choose another skill" })).toHaveAttribute(
      "href",
      "/student/learn",
    );
  });

  it("remains backwards-compatible for standard non-drill practice", async () => {
    mockSearchParams = new URLSearchParams("subject=reading&skill=Inference&count=8");

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(screen.getByTestId("practice-nav-1")).toBeInTheDocument();
    });

    // Standard title without "Practise:" prefix
    expect(screen.getByText("Inference")).toBeInTheDocument();

    // Standard exit button says "Back to Learn" and points to /student/learn
    const exitLink = screen.getByTestId("exit-practice");
    expect(exitLink).toHaveTextContent("Back to Learn");
    expect(exitLink).toHaveAttribute("href", "/student/learn");

    // Exactly 8 questions in standard mode
    expect(screen.getByTestId("practice-nav-8")).toBeInTheDocument();
  });

  it("fails closed with a 'no practice yet' empty state for a zero-coverage curriculumCode, and NEVER falls through to the mixed/unscoped bank", async () => {
    mockSearchParams = new URLSearchParams("curriculumCode=VC2M3A01&count=5");

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "No practice is available for this skill yet",
        }),
      ).toBeInTheDocument();
    });

    // Never silently substitutes the entire cross-subject/cross-year bank
    expect(screen.queryByTestId("practice-nav-1")).not.toBeInTheDocument();
    expect(screen.queryByText(/FRESH DRILL QUESTION/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PREVIOUS ASSESSMENT QUESTION/)).not.toBeInTheDocument();
    expect(screen.queryByText("VC2M3A01")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: "Back to Learning Hub" })).toHaveAttribute(
      "href",
      "/student/learn",
    );
  });

  it("launches a correctly-scoped session for a covered curriculumCode, using only its mapped published questions", async () => {
    mockSearchParams = new URLSearchParams("curriculumCode=TEST-COVERED-NODE&count=2");

    render(<PracticeSkillSessionPage />);

    await waitFor(() => {
      expect(screen.getByTestId("practice-nav-1")).toBeInTheDocument();
    });

    expect(screen.getByText("Practice: TEST-COVERED-NODE")).toBeInTheDocument();
    expect(screen.getByTestId("practice-nav-2")).toBeInTheDocument();
    expect(screen.queryByTestId("practice-nav-3")).not.toBeInTheDocument();

    for (let i = 1; i <= 2; i++) {
      fireEvent.click(screen.getByTestId(`practice-nav-${i}`));
      // Only the two mapped Fractions questions are ever shown — never a
      // Decimals/Reading-Inference/previous-assessment question.
      expect(screen.getByText(/FRESH DRILL QUESTION/)).toBeInTheDocument();
      expect(screen.queryByText(/PREVIOUS ASSESSMENT QUESTION/)).not.toBeInTheDocument();
    }
  });
});
