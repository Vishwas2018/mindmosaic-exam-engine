import { describe, expect, it, vi } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import { publishedExamBank } from "@/content/questions/practice-bank";
import { REGISTRY_SUBJECT_BY_FILTER, selectExamQuestions, type ExamSelectionConfig, type SubjectFilter } from "@/features/exam-engine/selection";
import { getPublicationEligibility } from "@/server/publication-evidence";
import {
  PROGRAMME_PUBLICATION_MODES,
  programmeIdForQuestion,
  publicationGateMode,
  selectServedQuestions,
  type PublicationGateMode,
} from "@/features/content-governance/gate-config";
import { getExamBank } from "@/server/exam-bank";

// Model the required zero-approval scenario without requiring the real
// repository to stay unapproved after the owner begins reviewing content.
vi.mock("@/server/publication-evidence", () => ({
  getPublicationEligibility: () => ({ problems: [], approvals: new Map() }),
}));

describe("Publication Gate Modes (Sections 2, 15, 16)", () => {
  it("defaults to report mode for unconfigured programmes (Section 2)", () => {
    expect(publicationGateMode("unknown-programme")).toBe("report");
    expect(Object.keys(PROGRAMME_PUBLICATION_MODES).length).toBe(0);
  });

  it("serves exactly the full bank in default report mode (Section 15)", () => {
    // In default report mode with zero approvals, the entire bank remains served
    const served = selectServedQuestions(questionBank, new Set<string>());
    expect(served).toBe(questionBank);

    // Runtime getExamBank("published") serves full published bank
    const runtimeServed = getExamBank("published");
    expect(getPublicationEligibility().problems).toEqual([]);
    expect(getPublicationEligibility().approvals.size).toBe(0);
    expect(runtimeServed).toBe(publishedExamBank);
    expect(getExamBank("practice")).toBe(publishedExamBank);
    expect(getExamBank("curated")).toBe(questionBank);
  });

  it("preserves dev practice questions, order and answers with zero approvals", () => {
    // dev serves these same source banks directly; governance must be transparent
    // across every authored programme when the default is report mode.
    const scopes = new Map(publishedExamBank.map(question => [programmeIdForQuestion(question), question]));
    for (const question of scopes.values()) {
      const subject = Object.entries(REGISTRY_SUBJECT_BY_FILTER)
        .find(([, registrySubject]) => registrySubject === question.metadata.subject)?.[0] as SubjectFilter | undefined;
      if (!subject) continue; // Only scopes selectable in children's practice.
      const config: ExamSelectionConfig = {
        yearLevel: question.yearLevel,
        examStyle: question.examStyle,
        subject,
        questionCount: 10,
        timing: "timed",
      };
      for (const seed of ["report-parity-a", "report-parity-b"]) {
        expect(selectExamQuestions(getExamBank("practice"), config, seed))
          .toEqual(selectExamQuestions(publishedExamBank, config, seed));
      }
    }
  });

  it("correctly handles mixed report and enforce modes (Section 16)", () => {
    const numeracyProg = "naplan-y3-numeracy";
    const readingProg = "naplan-y3-reading";

    const numeracyQuestions = questionBank.filter(
      (q) => programmeIdForQuestion(q) === numeracyProg,
    );
    const readingQuestions = questionBank.filter(
      (q) => programmeIdForQuestion(q) === readingProg,
    );

    expect(numeracyQuestions.length).toBeGreaterThan(5);
    expect(readingQuestions.length).toBeGreaterThan(5);

    const testPool = [...numeracyQuestions, ...readingQuestions];
    const approvedNumeracyId = numeracyQuestions[0].id;
    const approvedIds = new Set([approvedNumeracyId]);

    const mixedModes: Record<string, PublicationGateMode> = {
      [numeracyProg]: "enforce",
      [readingProg]: "report",
    };

    const served = selectServedQuestions(testPool, approvedIds, mixedModes);

    // Reading questions (in report mode) should ALL be served
    const servedReading = served.filter((q) => programmeIdForQuestion(q) === readingProg);
    expect(servedReading.length).toBe(readingQuestions.length);

    // Numeracy questions (in enforce mode) should ONLY serve the approved question
    const servedNumeracy = served.filter((q) => programmeIdForQuestion(q) === numeracyProg);
    expect(servedNumeracy.length).toBe(1);
    expect(servedNumeracy[0].id).toBe(approvedNumeracyId);

    // Total served count is all reading + 1 approved numeracy
    expect(served.length).toBe(readingQuestions.length + 1);
  });
});
