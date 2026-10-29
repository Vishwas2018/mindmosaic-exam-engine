import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { scholarshipPublishedQuestions } from "@/content/questions/generated/scholarship-index";
import {
  getExamPattern,
  selectPatternQuestions,
} from "@/features/exam-engine/exam-patterns";
import { buildPatternReadiness } from "@/features/exam-engine/exam-patterns/pattern-readiness";
import { scoreExam } from "@/features/exam-engine/scoring";
import type { AuthoringQuestion } from "@/features/exam-engine/types";
import { questionSchema } from "@/schemas/question.schema";

const SAMPLE_PATTERN_ID = "scholarship-y6-comprehensive-sample-module";

const mathsPacket = JSON.parse(
  readFileSync("content/scholarship-drafts/scholarship-y6-mathematics-draft.json", "utf8"),
);
const nrPacket = JSON.parse(
  readFileSync("content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json", "utf8"),
);
const vrPacket = JSON.parse(
  readFileSync("content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json", "utf8"),
);
const rcPacket = JSON.parse(
  readFileSync("content/scholarship-drafts/scholarship-y6-reading-draft.json", "utf8"),
);

const allDrafts: readonly AuthoringQuestion[] = [
  ...vrPacket.questions,
  ...nrPacket.questions,
  ...rcPacket.questions,
  ...mathsPacket.questions,
].map((raw: Record<string, unknown>) =>
  questionSchema.parse({
    ...raw,
    status: "published",
    origin: "original_seed",
    metadata: {
      ...(raw.metadata as Record<string, unknown>),
      topic: (raw.metadata as Record<string, unknown>).strand,
    },
  }) as unknown as AuthoringQuestion,
);

const CANDIDATE_12_IDS = [
  // 3 VR
  "scholarship-y6-vr-001",
  "scholarship-y6-vr-016",
  "scholarship-y6-vr-032",
  // 3 NR
  "scholarship-y6-nr-001",
  "scholarship-y6-nr-022",
  "scholarship-y6-nr-023",
  // 3 RC
  "scholarship-y6-rc-001",
  "scholarship-y6-rc-002",
  "scholarship-y6-rc-003",
  // 3 Maths
  "scholarship-y6-maths-004",
  "scholarship-y6-maths-007",
  "scholarship-y6-maths-014",
] as const;

const candidate12Questions = allDrafts.filter((q) =>
  CANDIDATE_12_IDS.includes(q.id as (typeof CANDIDATE_12_IDS)[number]),
);

describe("Year 6 Scholarship Comprehensive Sample Module", () => {
  it("exists in registry with expected metadata, sections and timing", () => {
    const pattern = getExamPattern(SAMPLE_PATTERN_ID);
    expect(pattern).toBeDefined();
    expect(pattern?.presentation).toBe("practice_module");
    expect(pattern?.basis).toBe("internal");
    expect(pattern?.yearLevel).toBe(6);
    expect(pattern?.examStyle).toBe("scholarship_style");
    expect(pattern?.questionCount).toBe(12);
    expect(pattern?.timeMinutes).toBe(18);
    expect(pattern?.guestAccess).toBe("signed_in_only");
    expect(pattern?.practiceModule).toBe("not_offered");
    expect(pattern?.adaptations).toContain("tight_time_pressure");
    expect(pattern?.adaptations).toContain("unofficial_paper_shape");
    expect(pattern?.adaptations).toContain("no_section_lock");
    expect(pattern?.sources).toHaveLength(4);
    expect(pattern?.sectionOrder).toHaveLength(4);
  });

  it("selects exact 3+3+3+3 questions across the 4 sections from the candidate pool", () => {
    const pattern = getExamPattern(SAMPLE_PATTERN_ID)!;
    const draw = selectPatternQuestions(candidate12Questions, pattern, "sample-seed-test");

    expect(draw.ok).toBe(true);
    if (!draw.ok) return;

    expect(draw.questions).toHaveLength(12);
    expect(draw.reduced).toBe(false);

    // Verify 3 of each subject
    const vrDrawn = draw.questions.filter((q) => q.metadata.subject === "verbal_reasoning");
    const nrDrawn = draw.questions.filter((q) => q.metadata.subject === "numerical_reasoning");
    const rcDrawn = draw.questions.filter((q) => q.metadata.subject === "reading");
    const mathsDrawn = draw.questions.filter((q) => q.metadata.subject === "numeracy");

    expect(vrDrawn).toHaveLength(3);
    expect(nrDrawn).toHaveLength(3);
    expect(rcDrawn).toHaveLength(3);
    expect(mathsDrawn).toHaveLength(3);

    // Verify all 12 candidate IDs are present
    const drawnIds = draw.questions.map((q) => q.id).sort();
    expect(drawnIds).toEqual([...CANDIDATE_12_IDS].sort());
  });

  it("keeps the exact sample when all 160 items become eligible", () => {
    const pattern = getExamPattern(SAMPLE_PATTERN_ID)!;
    for (const seed of ["later-publication", "another-session", "third-session"]) {
      const draw = selectPatternQuestions(allDrafts, pattern, seed);
      expect(draw.ok).toBe(true);
      if (draw.ok) expect(draw.questions.map(q => q.id).sort()).toEqual([...CANDIDATE_12_IDS].sort());
    }
    const missingOne = allDrafts.filter(q => q.id !== CANDIDATE_12_IDS[0]);
    expect(selectPatternQuestions(missingOne, pattern, "missing").ok).toBe(false);
    expect(selectPatternQuestions(missingOne, pattern, "missing", { asPracticeModule: true }).ok).toBe(false);
    expect(buildPatternReadiness(missingOne, pattern).state).toBe("unavailable");
  });

  it("preserves shared-passage handling for reading questions", () => {
    const pattern = getExamPattern(SAMPLE_PATTERN_ID)!;
    const draw = selectPatternQuestions(candidate12Questions, pattern, "sample-seed-stimulus");

    expect(draw.ok).toBe(true);
    if (!draw.ok) return;

    const rcDrawn = draw.questions.filter((q) => q.metadata.subject === "reading");
    expect(rcDrawn).toHaveLength(3);

    const firstStimulus = rcDrawn[0].stimulus;
    expect(firstStimulus?.title).toBe("The Estuary Watchers");
    for (const q of rcDrawn) {
      expect(q.stimulus?.title).toBe("The Estuary Watchers");
      expect(q.stimulus?.body).toBe(firstStimulus?.body);
    }
  });

  it("correctly scores a perfect, partial, and unanswered sitting", () => {
    const answerKeyMap: Record<string, string> = {
      "scholarship-y6-vr-001": "e",
      "scholarship-y6-vr-016": "d",
      "scholarship-y6-vr-032": "c",
      "scholarship-y6-nr-001": "e",
      "scholarship-y6-nr-022": "e",
      "scholarship-y6-nr-023": "b",
      "scholarship-y6-rc-001": "a",
      "scholarship-y6-rc-002": "c",
      "scholarship-y6-rc-003": "e",
      "scholarship-y6-maths-004": "b",
      "scholarship-y6-maths-007": "a",
      "scholarship-y6-maths-014": "c",
    };

    // 1. Perfect attempt
    const perfectScore = scoreExam(candidate12Questions, answerKeyMap);
    expect(perfectScore.availableMarks).toBe(12);
    expect(perfectScore.correctCount).toBe(12);
    expect(perfectScore.incorrectCount).toBe(0);
    expect(perfectScore.unansweredCount).toBe(0);
    expect(perfectScore.percentage).toBe(100);
    expect(perfectScore.awardedMarks).toBe(12);

    // 2. Partial attempt (first 8 correct, last 4 wrong)
    const partialAnswers: Record<string, string> = { ...answerKeyMap };
    partialAnswers["scholarship-y6-rc-003"] = "a"; // wrong (key e)
    partialAnswers["scholarship-y6-maths-004"] = "a"; // wrong (key b)
    partialAnswers["scholarship-y6-maths-007"] = "b"; // wrong (key a)
    partialAnswers["scholarship-y6-maths-014"] = "a"; // wrong (key c)

    const partialScore = scoreExam(candidate12Questions, partialAnswers);
    expect(partialScore.correctCount).toBe(8);
    expect(partialScore.incorrectCount).toBe(4);
    expect(partialScore.unansweredCount).toBe(0);
    expect(partialScore.awardedMarks).toBe(8);
    expect(partialScore.percentage).toBe(67); // 8/12 = 66.67% -> 67

    // 3. Unanswered attempt
    const emptyScore = scoreExam(candidate12Questions, {});
    expect(emptyScore.correctCount).toBe(0);
    expect(emptyScore.incorrectCount).toBe(0);
    expect(emptyScore.unansweredCount).toBe(12);
    expect(emptyScore.awardedMarks).toBe(0);
    expect(emptyScore.percentage).toBe(0);
  });

  it("confirms full scholarship papers remain unavailable with the 12-question bank", () => {
    const fullPaperIds = [
      "scholarship-y6-verbal-reasoning-full",
      "scholarship-y6-numerical-reasoning-full",
      "scholarship-y6-reading-full",
      "scholarship-y6-mathematics-full",
    ];

    for (const id of fullPaperIds) {
      const pattern = getExamPattern(id)!;
      expect(pattern).toBeDefined();
      expect(pattern.practiceModule).toBe("not_offered");

      const readiness = buildPatternReadiness(candidate12Questions, pattern);
      expect(readiness.state).toBe("unavailable");
      expect(readiness.availableCount).toBeLessThan(pattern.questionCount);
    }
  });

  it("remains gated before human publication approval (published pool is empty)", () => {
    // Current live published pool
    expect(scholarshipPublishedQuestions).toHaveLength(0);

    const pattern = getExamPattern(SAMPLE_PATTERN_ID)!;
    const readiness = buildPatternReadiness(scholarshipPublishedQuestions, pattern);

    // Must be unavailable until human approval and assembly
    expect(readiness.state).toBe("unavailable");
    expect(readiness.availableCount).toBe(0);
  });
});
