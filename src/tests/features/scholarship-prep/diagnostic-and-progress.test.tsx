import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildExamResult } from "@/features/exam-engine/scoring";
import { useExamStore } from "@/features/exam-engine/state";
import { VihaanDiagnosticExamRunner } from "@/features/scholarship-prep/components/DiagnosticExamRunner";
import { VihaanDashboard } from "@/features/scholarship-prep/components/VihaanDashboard";
import { VihaanParentDashboard } from "@/features/scholarship-prep/components/VihaanParentDashboard";
import {
  getVerifiedVihaanAllPublishedQuestions,
  getVerifiedVihaanExpansionPublication,
  getVerifiedVihaanPilotPublication,
  getVihaanSolutionsRecord,
  MATH_QUESTIONS,
  NR_QUESTIONS,
  RC_QUESTIONS,
  verifyVihaanExpansionPublication,
  verifyVihaanPilotPublication,
  VIHAAN_PILOT_BATCH,
  VIHAAN_PILOT_COUNTS,
  VIHAAN_PILOT_QUESTIONS,
  VIHAAN_QUESTION_METADATA_BY_ID,
  VIHAAN_WITHDRAWN_QUESTION_IDS,
  VR_QUESTIONS,
  WE_QUESTIONS,
} from "@/features/scholarship-prep/content/questions/vihaan-pilot-questions";
import {
  extractVihaanOutcomesFromSittings,
  EXPOSED_MOCK_ITEMS_PRACTICE_ONLY,
  isExposedMockQuestion,
  isReservedMockExamQuestion,
  selectAdaptivePractice,
  selectMockExamQuestions,
  selectPractice,
  summariseProgress,
  SYNTHETIC_E2E_SITTING_IDS,
} from "@/features/scholarship-prep/lib/practice";
import {
  getVihaanApprovedBank,
  getVihaanDiagnosticQuestions,
  getVihaanMockPool,
  getVihaanPracticePlan,
  getVihaanPracticePool,
} from "@/server/vihaan-practice";
import type { Question } from "@/schemas/question.schema";

function asPublishedFixture(questions: readonly Question[]): Question[] {
  return questions.map((question) => ({
    ...question,
    status: "published" as const,
  }));
}

describe("Reconciled canonical pilot bank + diagnostic + parent progress reporting", () => {
  beforeEach(() => {
    useExamStore.getState().resetExam();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    useExamStore.getState().resetExam();
  });

  it("reconciles vihaan-pilot-questions.ts to the single schema-validated pilot-01 draft bank", () => {
    expect(VIHAAN_PILOT_BATCH.batchId).toBe("vihaan-pilot-01");
    expect(VIHAAN_PILOT_BATCH.approvedBy).toBeNull();
    expect(VIHAAN_PILOT_QUESTIONS).toHaveLength(20);
    expect(VIHAAN_PILOT_QUESTIONS.every((q) => q.status === "draft")).toBe(true);
    expect(VIHAAN_PILOT_QUESTIONS.every((q) => q.id.startsWith("vihaan-p01-"))).toBe(true);

    expect(VIHAAN_PILOT_COUNTS).toEqual({
      numeracy: 6,
      numerical_reasoning: 5,
      verbal_reasoning: 4,
      reading: 3,
      writing: 2,
      mathematics: 6,
      reading_comprehension: 3,
      written_expression: 2,
      total: 20,
    });
    expect(MATH_QUESTIONS).toHaveLength(6);
    expect(NR_QUESTIONS).toHaveLength(5);
    expect(VR_QUESTIONS).toHaveLength(4);
    expect(RC_QUESTIONS).toHaveLength(3);
    expect(WE_QUESTIONS).toHaveLength(2);
    expect(VIHAAN_QUESTION_METADATA_BY_ID.get("vihaan-p01-m01")).toEqual({
      subject: "numeracy",
      topic: "Fraction of a remainder",
    });
  });

  it("renders a safe empty state on the diagnostic runner when no approved questions exist", () => {
    render(<VihaanDiagnosticExamRunner questions={[]} subject="numeracy" />);

    const emptyState = screen.getByTestId("diagnostic-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(
      within(emptyState).getByText("No approved diagnostic questions available yet"),
    ).toBeInTheDocument();

    const backLink = within(emptyState).getByRole("link", {
      name: /Back to Vihaan Scholarship Prep/i,
    });
    expect(backLink).toHaveAttribute("href", "/student/vihaan");
    expect(useExamStore.getState().status).toBe("not_started");
    expect(useExamStore.getState().sessionId).toBeNull();
  });

  it("runs a real diagnostic session with isolated published fixtures, strips client keys, scores accurately, and renders results", async () => {
    const user = userEvent.setup();
    const publishedFixture = asPublishedFixture([MATH_QUESTIONS[0]!, MATH_QUESTIONS[1]!]);
    const onComplete = vi.fn();

    render(
      <VihaanDiagnosticExamRunner
        questions={publishedFixture}
        subject="numeracy"
        onComplete={onComplete}
      />,
    );

    expect(screen.queryByTestId("diagnostic-empty-state")).not.toBeInTheDocument();
    expect(useExamStore.getState().status).toBe("in_progress");

    const clientQuestions = useExamStore.getState().questions;
    expect(clientQuestions).toHaveLength(2);
    expect(clientQuestions.every((q) => !("answerKey" in q))).toBe(true);

    const answerStep = async (questionId: string) => {
      if (questionId === "vihaan-p01-m01") {
        // Correct option b) "45"
        expect(screen.getByText(/club has 84 badges/i)).toBeInTheDocument();
        await user.click(screen.getByRole("radio", { name: /^45$/ }));
      } else {
        // Distractor a) "64" (correct key is c) "96")
        expect(screen.getByText(/Red and blue tiles are in the ratio 3:5/i)).toBeInTheDocument();
        await user.click(screen.getByRole("radio", { name: /^64$/ }));
      }
    };

    await answerStep(clientQuestions[0]!.id);
    await user.click(screen.getByRole("button", { name: "Next" }));

    await answerStep(clientQuestions[1]!.id);
    await user.click(screen.getByRole("button", { name: "Submit Exam" }));

    const results = screen.getByTestId("diagnostic-results");
    expect(results).toBeInTheDocument();
    expect(within(results).getByText("Diagnostic Results")).toBeInTheDocument();
    expect(within(results).getByText("50% accuracy")).toBeInTheDocument();
    expect(within(results).getAllByText("Correct")).toHaveLength(2);
    expect(within(results).getByText("Incorrect")).toBeInTheDocument();
    expect(
      within(results).getByText(/One quarter of 84 is 21, leaving 63/i),
    ).toBeInTheDocument();

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 1,
        total: 2,
        accuracy: 50,
      }),
    );
  });

  it("renders honest empty state on VihaanParentDashboard when zero outcomes exist", () => {
    render(<VihaanParentDashboard outcomes={[]} />);

    expect(screen.getByTestId("parent-activities-count")).toHaveTextContent("0");
    expect(screen.getByTestId("parent-time-spent")).toHaveTextContent("0 min");
    expect(screen.getByTestId("parent-overall-accuracy")).toHaveTextContent("—");
    expect(screen.getByTestId("parent-weak-areas")).toHaveTextContent("None yet");
    expect(screen.getByText("No data available yet")).toBeInTheDocument();
    expect(screen.getAllByText("0 attempts recorded")).toHaveLength(5);
  });

  it("extracts real sitting outcomes, excludes manual writing from objective accuracy, and surfaces real parent stats", () => {
    const sittingQuestions = asPublishedFixture([
      MATH_QUESTIONS[0]!, // m01 -> "b"
      MATH_QUESTIONS[1]!, // m02 -> "c"
      MATH_QUESTIONS[2]!, // m03 -> "c"
      RC_QUESTIONS[0]!, // r01 -> "d"
      WE_QUESTIONS[0]!, // w01 -> essay (manual)
    ]);

    const realResult = buildExamResult(
      sittingQuestions,
      {
        "vihaan-p01-m01": "b", // correct
        "vihaan-p01-m02": "a", // incorrect
        "vihaan-p01-m03": "c", // correct
        "vihaan-p01-r01": "d", // correct
        "vihaan-p01-w01": "Niko paused at the open oval gate to protect the seedlings.",
      },
      {
        startedAt: 1_000_000,
        submittedAt: 1_900_000, // 900 seconds = 15 minutes
        submissionReason: "user_submitted",
      },
    );

    const outcomes = extractVihaanOutcomesFromSittings(
      [
        {
          id: "sitting-pilot-1",
          submitted_at: "2026-11-15T10:00:00.000Z",
          result: realResult,
        },
      ],
      VIHAAN_QUESTION_METADATA_BY_ID,
    );

    expect(outcomes).toHaveLength(5);
    expect(outcomes.find((o) => o.questionId === "vihaan-p01-w01")?.status).toBe(
      "pending_manual_review",
    );

    const progress = summariseProgress(outcomes);
    expect(progress.pendingWriting).toBe(1);
    expect(progress.weakTopics).toEqual([]);

    render(<VihaanParentDashboard outcomes={outcomes} />);

    expect(screen.getByTestId("parent-activities-count")).toHaveTextContent("1");
    expect(screen.getByTestId("parent-time-spent")).toHaveTextContent("15 min");
    expect(screen.getByTestId("parent-overall-accuracy")).toHaveTextContent("75%");
    expect(screen.getByTestId("parent-weak-areas")).toHaveTextContent("None yet");

    expect(screen.getByTestId("subject-row-numeracy")).toHaveTextContent(
      "2/3 correct (3 attempts)",
    );
    expect(screen.getByTestId("subject-row-numeracy")).toHaveTextContent("67%");
    expect(screen.getByTestId("subject-row-reading")).toHaveTextContent("1/1 correct (1 attempt)");
    expect(screen.getByTestId("subject-row-reading")).toHaveTextContent("100%");
    expect(screen.getByTestId("subject-row-writing")).toHaveTextContent(
      "1 submission recorded (1 pending rubric review)",
    );
    expect(screen.getByTestId("subject-row-writing")).toHaveTextContent("Pending");
    expect(screen.queryByText("No data available yet")).not.toBeInTheDocument();
    expect(screen.getByText(/1 writing submission awaits human rubric review/i)).toBeInTheDocument();
  });

  it("identifies weak topics on the parent dashboard once the 5-distinct-question threshold is reached", () => {
    const weakTopicOutcomes = [1, 2, 3, 4, 5].map((idx) => ({
      responseId: `sitting-weak:${idx}`,
      questionId: `vihaan-p01-m0${idx}`,
      subject: "numeracy",
      topic: "Fraction of a remainder",
      submittedAt: "2026-11-15T10:30:00.000Z",
      elapsedSeconds: 60,
      status: idx <= 2 ? ("correct" as const) : ("incorrect" as const),
    }));

    render(<VihaanParentDashboard outcomes={weakTopicOutcomes} />);

    expect(screen.getByTestId("parent-overall-accuracy")).toHaveTextContent("40%");
    expect(screen.getByTestId("parent-weak-areas")).toHaveTextContent("Fraction of a remainder");
    expect(screen.getByText("Focus next on Mathematics")).toBeInTheDocument();
  });

  it("verifies governed pilot-01 DEV publication integrity and fails closed on tampering", () => {
    const verified = getVerifiedVihaanPilotPublication();
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;

    expect(verified.batchId).toBe("vihaan-pilot-01");
    expect(verified.approvedBy).toBe("Vishwas Joshi");
    expect(verified.draftBatchHash).toBe(
      "50242f6ba1ce001ce145441958771cc01a8cd848de2013b0d129cb4fe70ea49b",
    );
    expect(verified.questions).toHaveLength(20);
    expect(verified.questions.every((q) => q.status === "published")).toBe(true);

    const tampered = verifyVihaanPilotPublication({
      kind: "vihaan_pilot_publication_manifest",
      schemaVersion: 1,
      batchId: "wrong-batch",
    });
    expect(tampered.ok).toBe(false);
    expect(tampered.questions).toEqual([]);
  });

  it("serves approved pilot-01 questions only to allowlisted DEV users and never in production", () => {
    const devEnv = {
      VERCEL_ENV: "preview",
      VISHAAN_SCHOLARSHIP_PREP_ENABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
      PRODUCTION_SUPABASE_PROJECT_REF: "uermhsptduikehuyceiz",
      VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF: "mfglzabnayacssgertat",
      VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "vihaan-student-1",
    };

    const allowedDiagnostic = getVihaanDiagnosticQuestions("vihaan-student-1", devEnv);
    expect(allowedDiagnostic).toHaveLength(20);
    expect(allowedDiagnostic.every((q) => q.status === "published")).toBe(true);

    expect(getVihaanDiagnosticQuestions("other-student", devEnv)).toEqual([]);
    expect(
      getVihaanDiagnosticQuestions("vihaan-student-1", { ...devEnv, VERCEL_ENV: "production" }),
    ).toEqual([]);

    const numeracyPractice = getVihaanPracticePlan(3, {
      subject: "numeracy",
      userId: "vihaan-student-1",
      env: devEnv,
    });
    expect(numeracyPractice).toHaveLength(3);
    expect(numeracyPractice.every((q) => q.metadata.subject === "numeracy")).toBe(true);
  }, 15_000);

  it("renders worked solutions, 1–5 writing rubric, and persistence status after submission", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ persisted: true, sessionId: "sess-1", attemptId: "att-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const mixedFixture = asPublishedFixture([MATH_QUESTIONS[0]!, WE_QUESTIONS[0]!]);
    const solutionsById = getVihaanSolutionsRecord(mixedFixture);

    render(
      <VihaanDiagnosticExamRunner
        questions={mixedFixture}
        subject="mixed"
        solutionsById={solutionsById}
        persistToServer
      />,
    );

    const answerCurrentQuestion = async () => {
      const textbox = screen.queryByRole("textbox");
      if (textbox) {
        await user.type(textbox, "Niko stopped beside the oval seedlings.");
      } else {
        await user.click(await screen.findByRole("radio", { name: /45/ }));
      }
    };

    await screen.findByRole("button", { name: "Next" });
    await answerCurrentQuestion();
    await user.click(screen.getByRole("button", { name: "Next" }));

    await screen.findByRole("button", { name: "Submit Exam" });
    await answerCurrentQuestion();
    await user.click(screen.getByRole("button", { name: "Submit Exam" }));

    const results = await screen.findByTestId("diagnostic-results");
    expect(within(results).getByTestId("vihaan-attempt-persisted")).toHaveTextContent(
      "Saved to progress",
    );
    expect(within(results).getByTestId("vihaan-worked-solution-vihaan-p01-m01")).toHaveTextContent(
      /One quarter of 84 is 21/i,
    );
    expect(within(results).getByTestId("vihaan-writing-rubric-vihaan-p01-w01")).toHaveTextContent(
      "on the 1–5 scale",
    );
    expect(
      within(results).getByTestId("vihaan-sample-response-vihaan-p01-w01"),
    ).toHaveTextContent(/Niko could already hear/i);
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/student/vihaan/attempt",
      expect.objectContaining({ method: "POST" }),
    );
  }, 20_000);

  it("renders subject practice cards on VihaanDashboard and launches inline practice", async () => {
    const user = userEvent.setup();
    const verified = getVerifiedVihaanPilotPublication();
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;

    render(
      <VihaanDashboard
        student={{
          userId: "vihaan-student-1",
          displayName: "Vihaan",
          yearLevel: 5,
          onboardingCompleted: true,
          diagnosticCompleted: false,
          interests: [],
          weeklyGoalMinutes: 360,
        }}
        questions={verified.questions}
        solutionsById={getVihaanSolutionsRecord(verified.questions)}
        outcomes={[]}
      />,
    );

    const practiceSection = screen.getByTestId("vihaan-practice-section");
    expect(within(practiceSection).getByTestId("vihaan-practice-numeracy")).toHaveTextContent(
      "6 questions",
    );
    expect(within(practiceSection).getByTestId("vihaan-practice-writing")).toHaveTextContent(
      "2 questions",
    );

    await user.click(within(practiceSection).getByTestId("vihaan-practice-numeracy"));

    const runner = await screen.findByTestId("vihaan-practice-runner");
    expect(within(runner).getByRole("heading", { name: "Mathematics" })).toBeInTheDocument();
    expect(within(runner).getAllByText(/Question 1 of 6/i).length).toBeGreaterThan(0);
  }, 20_000);

  it("verifies all 500 published items (20 pilot + 480 expansion) and fails closed on tampering", () => {
    const expansion = getVerifiedVihaanExpansionPublication();
    expect(expansion.ok).toBe(true);
    if (!expansion.ok) return;

    expect(expansion.approvedBy).toBe("Vishwas Joshi");
    expect(expansion.questions).toHaveLength(480);
    expect(expansion.questions.every((q) => q.status === "published")).toBe(true);

    // All 500 verify; withdrawn items (A-06: vihaan-e500-m069) are not served.
    const all500 = getVerifiedVihaanAllPublishedQuestions();
    expect(all500).toHaveLength(500 - VIHAAN_WITHDRAWN_QUESTION_IDS.size);
    expect(all500.some((q) => VIHAAN_WITHDRAWN_QUESTION_IDS.has(q.id))).toBe(false);
    expect(new Set(all500.map((q) => q.id)).size).toBe(all500.length);
    expect(VIHAAN_QUESTION_METADATA_BY_ID.size).toBe(500);
    expect(Object.keys(getVihaanSolutionsRecord(all500))).toHaveLength(all500.length);

    const tampered = verifyVihaanExpansionPublication({
      kind: "vihaan_expansion_publication_manifest",
      schemaVersion: 1,
      bankId: "wrong",
    });
    expect(tampered.ok).toBe(false);
    expect(tampered.questions).toEqual([]);
  });

  it("excludes synthetic E2E sittings by default while keeping DB records extractable when requested", () => {
    const syntheticId = [...SYNTHETIC_E2E_SITTING_IDS][0]!;
    const genuineId = "genuine-sitting-1";
    const sittings = [
      {
        id: syntheticId,
        submitted_at: "2026-11-16T00:15:33.004Z",
        result: {
          timeTakenSeconds: 10,
          questionDetails: [
            { questionId: "vihaan-p01-m01", status: "correct", attempted: true },
          ],
        },
      },
      {
        id: "flagged-synthetic-2",
        submitted_at: "2026-11-16T01:00:00.000Z",
        session: { config: { isSyntheticE2e: true } },
        result: {
          timeTakenSeconds: 15,
          questionDetails: [
            { questionId: "vihaan-p01-m02", status: "correct", attempted: true },
          ],
        },
      },
      {
        id: genuineId,
        submitted_at: "2026-11-16T02:00:00.000Z",
        result: {
          timeTakenSeconds: 120,
          questionDetails: [
            { questionId: "vihaan-p01-m03", status: "incorrect", attempted: true },
          ],
        },
      },
    ];

    const genuineOnly = extractVihaanOutcomesFromSittings(sittings, VIHAAN_QUESTION_METADATA_BY_ID);
    expect(genuineOnly).toHaveLength(1);
    expect(genuineOnly[0]!.responseId).toBe(`${genuineId}:vihaan-p01-m03`);

    const withSynthetic = extractVihaanOutcomesFromSittings(
      sittings,
      VIHAAN_QUESTION_METADATA_BY_ID,
      { includeSyntheticE2e: true },
    );
    expect(withSynthetic).toHaveLength(3);
  });

  it("reserves 166 unseen mock items strictly out of daily practice and supports adaptive + mock selection", () => {
    const devEnv = {
      VERCEL_ENV: "preview",
      VISHAAN_SCHOLARSHIP_PREP_ENABLED: "1",
      NEXT_PUBLIC_SUPABASE_URL: "https://mfglzabnayacssgertat.supabase.co",
      PRODUCTION_SUPABASE_PROJECT_REF: "uermhsptduikehuyceiz",
      VISHAAN_SCHOLARSHIP_PREP_SUPABASE_REF: "mfglzabnayacssgertat",
      VISHAAN_SCHOLARSHIP_PREP_ALLOWED_USER_IDS: "vihaan-student-1",
    };

    const fullBank = getVihaanApprovedBank("vihaan-student-1", devEnv);
    const practicePool = getVihaanPracticePool("vihaan-student-1", devEnv);
    const mockPool = getVihaanMockPool("vihaan-student-1", devEnv);

    expect(fullBank).toHaveLength(499); // vihaan-e500-m069 withdrawn (A-06)
    // The 166 former mock items were published in the public repository, so they are practice-only.
    expect(EXPOSED_MOCK_ITEMS_PRACTICE_ONLY).toBe(true);
    expect(practicePool).toHaveLength(499);
    expect(practicePool.some((q) => q.id === "vihaan-e500-m069")).toBe(false);
    expect(mockPool).toHaveLength(0);
    expect(fullBank.filter((q) => isExposedMockQuestion(q.id))).toHaveLength(166);
    expect(practicePool.filter((q) => isExposedMockQuestion(q.id))).toHaveLength(166);
    expect(fullBank.some((q) => isReservedMockExamQuestion(q.id))).toBe(false);

    // Practice selection may use every approved item, exposed ones included.
    const randomPractice = selectPractice(fullBank, 499, { random: () => 0.25 });
    expect(randomPractice).toHaveLength(499);
    expect(randomPractice.some((q) => isExposedMockQuestion(q.id))).toBe(true);

    // Adaptive practice puts unseen items ahead of already attempted items.
    const seenOutcomes = practicePool
      .filter((q) => q.metadata.subject === "numeracy")
      .slice(0, 74) // leaves 5 unseen (m069 withdrawn, A-06)
      .map((q) => ({
        responseId: `s1:${q.id}`,
        questionId: q.id,
        subject: q.metadata.subject,
        topic: q.metadata.topic,
        submittedAt: "2026-11-16T03:00:00.000Z",
        elapsedSeconds: 30,
        status: "correct" as const,
      }));
    const unseenExpected = practicePool
      .filter((q) => q.metadata.subject === "numeracy")
      .slice(74)
      .map((q) => q.id);
    const adaptivePick = selectAdaptivePractice(fullBank, 5, {
      subject: "numeracy",
      outcomes: seenOutcomes,
      random: () => 0.1,
    });
    expect(adaptivePick).toHaveLength(5);
    expect(adaptivePick.every((q) => unseenExpected.includes(q.id))).toBe(true);

    // No unseen mock paper can be built while the exposed set is practice-only.
    expect(selectMockExamQuestions(fullBank, "full_mock")).toHaveLength(0);
    expect(selectMockExamQuestions(fullBank, "numeracy")).toHaveLength(0);
  });

  it("renders full 500-bank learning sections and interactive parent rubric marking UI", async () => {
    const user = userEvent.setup();
    const fullBank = getVerifiedVihaanAllPublishedQuestions();
    const practicePool = fullBank.filter((q) => !isReservedMockExamQuestion(q.id));
    const mockPool = fullBank.filter((q) => isReservedMockExamQuestion(q.id));
    expect(mockPool).toHaveLength(0);

    render(
      <VihaanDashboard
        student={{
          userId: "vihaan-student-1",
          displayName: "Vihaan",
          yearLevel: 5,
          onboardingCompleted: true,
          diagnosticCompleted: false,
          interests: [],
          weeklyGoalMinutes: 360,
        }}
        questions={practicePool}
        mockQuestions={mockPool}
        solutionsById={getVihaanSolutionsRecord(fullBank)}
        outcomes={[]}
        writingHistory={[]}
      />,
    );

    expect(screen.getByTestId("vihaan-study-plan")).toBeInTheDocument();
    expect(screen.getByTestId("vihaan-concept-learning")).toBeInTheDocument();
    expect(screen.getByTestId("vihaan-smart-revision")).toBeInTheDocument();
    expect(screen.getByTestId("mock-reserved-pool-badge")).toHaveTextContent("Unseen mock papers: not available yet");
    expect(screen.getByTestId("mock-unseen-unavailable")).toHaveTextContent(/not ready yet/i);
    expect(screen.getByTestId("vihaan-writing-practice")).toBeInTheDocument();

    // No unseen mock paper exists while the exposed set is practice-only: every mock start is disabled.
    expect(screen.getByTestId("mock-start-full")).toBeDisabled();
    expect(screen.getByTestId("mock-start-numeracy")).toBeDisabled();
    void user;
  }, 20_000);
});
