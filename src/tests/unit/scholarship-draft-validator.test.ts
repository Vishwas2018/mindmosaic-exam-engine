import { describe, expect, it } from "vitest";
import { draftQuestionSchema, type DraftQuestion, type DraftSidecar } from "../../../scripts/lib/scholarship-draft-schema";
import { verifySolverMatch } from "../../../scripts/validate-scholarship-drafts.mjs";

describe("scholarship draft validator schema", () => {
  const baseDraftQuestion: DraftQuestion = {
    id: "scholarship-y6-maths-001",
    type: "multiple_choice",
    yearLevel: 6,
    examStyle: "scholarship_style",
    prompt: "Sample valid prompt text with sufficient length",
    options: [
      { id: "a", text: "Option A" },
      { id: "b", text: "Option B" },
      { id: "c", text: "Option C" },
      { id: "d", text: "Option D" },
      { id: "e", text: "Option E" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "a",
    },
    explanation: "Detailed explanation text that explains the step-by-step reasoning clearly.",
    metadata: {
      subject: "numeracy",
      strand: "Mathematics",
      skill: "maths-directed-numbers",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["scholarship"],
    },
  };

  it("accepts valid difficulty values 'easy', 'medium', 'challenging'", () => {
    for (const diff of ["easy", "medium", "challenging"] as const) {
      const parsed = draftQuestionSchema.safeParse({
        ...baseDraftQuestion,
        metadata: {
          ...baseDraftQuestion.metadata,
          difficulty: diff,
        },
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("strictly rejects invalid difficulty 'hard' with validation error", () => {
    const parsed = draftQuestionSchema.safeParse({
      ...baseDraftQuestion,
      metadata: {
        ...baseDraftQuestion.metadata,
        difficulty: "hard",
      },
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find((i) => i.path.includes("difficulty"));
      expect(issue).toBeDefined();
    }
  });

  it("rejects other arbitrary difficulty strings like 'expert' or 'difficult'", () => {
    for (const diff of ["expert", "difficult", "extreme"]) {
      const parsed = draftQuestionSchema.safeParse({
        ...baseDraftQuestion,
        metadata: {
          ...baseDraftQuestion.metadata,
          difficulty: diff,
        },
      });
      expect(parsed.success).toBe(false);
    }
  });

  describe("verifySolverMatch correctValue check on no-solver items", () => {
    const noSolverQuestion: DraftQuestion = {
      id: "scholarship-y6-rc-023",
      type: "reading_comprehension",
      yearLevel: 6,
      examStyle: "scholarship_style",
      prompt: "Which practical intervention does the author recommend for local councils?",
      options: [
        { id: "a", text: "Banning automobile headlights along coastal highways" },
        { id: "b", text: "Replacing unshielded lamps with downward-facing hooded warm-amber fixtures" },
        { id: "c", text: "Subsidising blackout curtains for all private residences" },
        { id: "d", text: "Turning off city power grids for one week every month" },
        { id: "e", text: "Planting tall pine trees directly beneath power lines" },
      ],
      visuals: [],
      answerKey: {
        kind: "single_option",
        optionId: "b",
      },
      explanation: "Paragraph 4 recommends replacing unshielded lamps with downward-facing hooded fixtures.",
      metadata: {
        subject: "reading",
        strand: "Reading Comprehension",
        skill: "rc-factual-inference",
        difficulty: "medium",
        marks: 1,
        estimatedTimeSeconds: 45,
        tags: ["scholarship"],
      },
    };

    it("passes when no-solver item sidecar correctValue matches the chosen option text verbatim", () => {
      const validSidecar: DraftSidecar = {
        id: "scholarship-y6-rc-023",
        skill: "rc-factual-inference",
        targetOption: "b",
        correctValue: "Replacing unshielded lamps with downward-facing hooded warm-amber fixtures",
        requiresHumanSemanticCheck: true,
      };

      expect(() => verifySolverMatch(noSolverQuestion, validSidecar)).not.toThrow();
    });

    it("fails when no-solver item sidecar correctValue does not match chosen option text", () => {
      const staleMismatchedSidecar: DraftSidecar = {
        id: "scholarship-y6-rc-023",
        skill: "rc-factual-inference",
        targetOption: "b",
        correctValue: "Replacing omnidirectional lights with downward-shielded warm-amber fixtures",
        requiresHumanSemanticCheck: true,
      };

      expect(() => verifySolverMatch(noSolverQuestion, staleMismatchedSidecar)).toThrowError(
        /option 'b' text 'Replacing unshielded lamps with downward-facing hooded warm-amber fixtures' does not match sidecar correctValue 'Replacing omnidirectional lights with downward-shielded warm-amber fixtures'/
      );
    });

    it("fails when no-solver item targetOption does not match question answerKey optionId", () => {
      const targetOptionMismatchSidecar: DraftSidecar = {
        id: "scholarship-y6-rc-023",
        skill: "rc-factual-inference",
        targetOption: "c",
        correctValue: "Replacing unshielded lamps with downward-facing hooded warm-amber fixtures",
        requiresHumanSemanticCheck: true,
      };

      expect(() => verifySolverMatch(noSolverQuestion, targetOptionMismatchSidecar)).toThrowError(
        /sidecar targetOption 'c' does not match answerKey optionId 'b'/
      );
    });
  });
});
