import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  PROGRAMME_PUBLICATION_MODES,
  programmeIdForQuestion,
  publicationGateMode,
  selectServedQuestions,
  type PublicationGateMode,
} from "@/features/content-governance/gate-config";
import { getExamBank } from "@/server/exam-bank";

describe("Publication Gate Modes (Sections 2, 15, 16)", () => {
  it("defaults to report mode for unconfigured programmes (Section 2)", () => {
    expect(publicationGateMode("unknown-programme")).toBe("report");
    expect(Object.keys(PROGRAMME_PUBLICATION_MODES).length).toBe(0);
  });

  it("serves exactly the full bank in default report mode (Section 15)", () => {
    // In default report mode with zero approvals, the entire bank remains served
    const served = selectServedQuestions(questionBank, new Set<string>());
    expect(served.length).toBe(questionBank.length);

    // Runtime getExamBank("published") serves full published bank
    const runtimeServed = getExamBank("published");
    expect(runtimeServed.length).toBe(1548);
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
