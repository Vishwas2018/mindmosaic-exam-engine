// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { publishedExamBank } from "@/content/questions/practice-bank";
import { buildDeclaredResponse } from "@/features/question-factory/correctness/canonical-response";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import type { CandidateAnswer } from "@/features/exam-engine/types";
import {
  createFamilyBetaFixedSession,
  deliverFamilyBetaCandidateQuestions,
  FAMILY_BETA_NOTICE,
  FAMILY_BETA_YEAR_3_CONFIG,
  FAMILY_BETA_YEAR_3_PINNED,
  FAMILY_BETA_YEAR_5_CONFIG,
  FAMILY_BETA_YEAR_5_PINNED,
  isFamilyBetaFixedPapersEnabled,
  loadFamilyBetaFixedPaperQuestions,
  resumeFamilyBetaFixedSession,
  scoreFamilyBetaFixedPaper,
} from "@/server/family-beta-fixed-papers";

const ENABLED_ENV = {
  FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled",
} as const;

describe("Family Beta Fixed Papers: Gate and Fail-Closed Security", () => {
  it("is disabled by default when the flag is absent or falsy", () => {
    expect(isFamilyBetaFixedPapersEnabled({})).toBe(false);
    expect(isFamilyBetaFixedPapersEnabled({ FAMILY_BETA_FIXED_PAPERS_PREVIEW: "" })).toBe(false);
    expect(isFamilyBetaFixedPapersEnabled({ FAMILY_BETA_FIXED_PAPERS_PREVIEW: "true" })).toBe(false);
    expect(isFamilyBetaFixedPapersEnabled({ FAMILY_BETA_FIXED_PAPERS_PREVIEW: "1" })).toBe(false);
  });

  it("never activates on production, even if the flag is enabled", () => {
    expect(
      isFamilyBetaFixedPapersEnabled({
        FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled",
        VERCEL_TARGET_ENV: "production",
      }),
    ).toBe(false);
  });

  /*
   * VERCEL_TARGET_ENV is the newer variable and is absent on older Vercel
   * builds, where VERCEL_ENV is the only production signal. A deployment that
   * reports production through either name must not serve unapproved content.
   */
  it("never activates on a production deployment that reports only VERCEL_ENV", () => {
    expect(
      isFamilyBetaFixedPapersEnabled({
        FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled",
        VERCEL_ENV: "production",
      }),
    ).toBe(false);
  });

  it("still activates on a non-production Vercel deployment", () => {
    expect(
      isFamilyBetaFixedPapersEnabled({
        FAMILY_BETA_FIXED_PAPERS_PREVIEW: "enabled",
        VERCEL_ENV: "preview",
        VERCEL_TARGET_ENV: "preview",
      }),
    ).toBe(true);
  });

  it("activates in preview/local when the flag is exactly 'enabled'", () => {
    expect(isFamilyBetaFixedPapersEnabled(ENABLED_ENV)).toBe(true);
  });

  it("refuses to load authoring questions when disabled (returns empty array)", () => {
    expect(loadFamilyBetaFixedPaperQuestions("year3", {})).toEqual([]);
    expect(loadFamilyBetaFixedPaperQuestions("year5", {})).toEqual([]);
    expect(deliverFamilyBetaCandidateQuestions("year3", {})).toEqual([]);
    expect(deliverFamilyBetaCandidateQuestions("year5", {})).toEqual([]);
  });

  it("refuses session creation and scoring when disabled (throws error)", () => {
    expect(() => createFamilyBetaFixedSession("year3", undefined, {})).toThrow(
      /disabled pending approval/,
    );
    expect(() => scoreFamilyBetaFixedPaper("year3", {}, {})).toThrow(
      /disabled pending approval/,
    );
  });
});

describe("Family Beta Fixed Papers: Pinned Question Verification & Hash Integrity", () => {
  it("has exactly 36 pinned questions for Year 3 in slots 1..36", () => {
    expect(FAMILY_BETA_YEAR_3_PINNED).toHaveLength(36);
    expect(FAMILY_BETA_YEAR_3_CONFIG.questionCount).toBe(36);
    expect(FAMILY_BETA_YEAR_3_CONFIG.durationSeconds).toBe(2700);

    FAMILY_BETA_YEAR_3_PINNED.forEach((pinned, idx) => {
      expect(pinned.slot).toBe(idx + 1);
    });
  });

  it("has exactly 42 pinned questions for Year 5 in slots 1..42", () => {
    expect(FAMILY_BETA_YEAR_5_PINNED).toHaveLength(42);
    expect(FAMILY_BETA_YEAR_5_CONFIG.questionCount).toBe(42);
    expect(FAMILY_BETA_YEAR_5_CONFIG.durationSeconds).toBe(3000);

    FAMILY_BETA_YEAR_5_PINNED.forEach((pinned, idx) => {
      expect(pinned.slot).toBe(idx + 1);
    });
  });

  it("all 36 Year 3 questions match publishedExamBank with zero hash drift", () => {
    const questions = loadFamilyBetaFixedPaperQuestions("year3", ENABLED_ENV);
    expect(questions).toHaveLength(36);

    for (let i = 0; i < 36; i++) {
      const q = questions[i];
      const pinned = FAMILY_BETA_YEAR_3_PINNED[i];
      expect(q.id).toBe(pinned.id);
      expect(hashJson(q)).toBe(pinned.canonicalSha256);
      expect(q.yearLevel).toBe(3);
    }
  });

  it("all 42 Year 5 questions match publishedExamBank with zero hash drift", () => {
    const questions = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    expect(questions).toHaveLength(42);

    for (let i = 0; i < 42; i++) {
      const q = questions[i];
      const pinned = FAMILY_BETA_YEAR_5_PINNED[i];
      expect(q.id).toBe(pinned.id);
      expect(hashJson(q)).toBe(pinned.canonicalSha256);
      expect(q.yearLevel).toBe(5);
    }
  });

  it("Year 5 Q24 (slot 24) incorporates the wording correction ('and pays $30') and matches the corrected hash", () => {
    const questions = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    const q24 = questions[23]; // slot 24 is index 23

    expect(q24.id).toBe("man-2e619aada91e92bdcdc527b8");
    expect(q24.prompt).toContain("and pays $30");
    expect(q24.prompt).not.toContain("$30 note");
    expect(hashJson(q24)).toBe("fcab80c23826d1a40af77e5f1105ca80f3c665b091f1ed5a4795ab52eb860938");
    expect(FAMILY_BETA_YEAR_5_PINNED[23].canonicalSha256).toBe(
      "fcab80c23826d1a40af77e5f1105ca80f3c665b091f1ed5a4795ab52eb860938",
    );
  });
});

describe("Family Beta Fixed Papers: Candidate Delivery (Answer Secrecy)", () => {
  it("strips answerKey and explanation from every single delivered candidate question", () => {
    const y3Candidates = deliverFamilyBetaCandidateQuestions("year3", ENABLED_ENV);
    const y5Candidates = deliverFamilyBetaCandidateQuestions("year5", ENABLED_ENV);

    expect(y3Candidates).toHaveLength(36);
    expect(y5Candidates).toHaveLength(42);

    const allCandidates = [...y3Candidates, ...y5Candidates];
    expect(allCandidates).toHaveLength(78);

    for (const candidate of allCandidates) {
      // answerKey and explanation must be strictly undefined on candidate questions
      expect((candidate as Record<string, unknown>).answerKey).toBeUndefined();
      expect((candidate as Record<string, unknown>).explanation).toBeUndefined();
      // Prompt, id, answerKind, and interaction must remain intact
      expect(candidate.id).toBeTruthy();
      expect(candidate.prompt).toBeTruthy();
      expect(candidate.answerKind).toBeTruthy();
    }
  });
});

describe("Family Beta Fixed Papers: Session Creation & Resume", () => {
  it("creates a well-formed session with exact slot ordering and configuration", () => {
    const session = createFamilyBetaFixedSession("year3", { sessionId: "session-y3-test" }, ENABLED_ENV);

    expect(session.sessionId).toBe("session-y3-test");
    expect(session.questions).toHaveLength(36);
    expect(session.durationSeconds).toBe(2700);
    expect(session.config.yearLevel).toBe(3);
    expect(session.config.examStyle).toBe("naplan_style");
    expect(session.currentQuestionIndex).toBe(0);
    expect(session.responses).toEqual({});
  });

  it("resumes an in-progress session, preserving candidate responses and timer", () => {
    const startedAt = 1_000_000;
    const session = createFamilyBetaFixedSession(
      "year5",
      { sessionId: "session-y5-test", startedAt },
      ENABLED_ENV,
    );

    // Simulate student answering the first 3 questions
    const inProgressSession = {
      ...session,
      responses: {
        [session.questions[0].id]: "12",
        [session.questions[1].id]: { count: "opt-a" },
        [session.questions[2].id]: "opt-b",
      },
      currentQuestionIndex: 3,
      flaggedQuestionIds: [session.questions[1].id],
    };

    // Resume 5 minutes (300 seconds) after startedAt
    const resumed = resumeFamilyBetaFixedSession(inProgressSession, startedAt + 300_000);

    expect(resumed.sessionId).toBe("session-y5-test");
    expect(resumed.currentQuestionIndex).toBe(3);
    expect(resumed.flaggedQuestionIds).toEqual([session.questions[1].id]);
    expect(resumed.responses).toEqual({
      [session.questions[0].id]: "12",
      [session.questions[1].id]: { count: "opt-a" },
      [session.questions[2].id]: "opt-b",
    });
    expect(resumed.remainingSeconds).toBe(session.durationSeconds! - 300);
    expect(resumed.expired).toBe(false);
  });

  it("marks session as expired when resumed after deadline", () => {
    const startedAt = 1_000_000;
    const session = createFamilyBetaFixedSession(
      "year3",
      { sessionId: "session-y3-expired", startedAt },
      ENABLED_ENV,
    );

    // Resume after full 45 minutes + 1 second
    const resumedLate = resumeFamilyBetaFixedSession(
      session,
      startedAt + (session.durationSeconds! + 1) * 1000,
    );

    expect(resumedLate.expired).toBe(true);
    expect(resumedLate.remainingSeconds).toBe(0);
  });
});

describe("Family Beta Fixed Papers: Server-Authoritative Scoring", () => {
  it("scores 100% correct responses for Year 3 (36/36 marks)", () => {
    const questions = loadFamilyBetaFixedPaperQuestions("year3", ENABLED_ENV);
    const responses: Record<string, CandidateAnswer | undefined> = {};

    for (const q of questions) {
      const canonical = buildDeclaredResponse(q);
      expect(canonical).toBeDefined();
      responses[q.id] = canonical;
    }

    const score = scoreFamilyBetaFixedPaper("year3", responses, ENABLED_ENV);

    expect(score.awardedMarks).toBe(36);
    expect(score.availableMarks).toBe(36);
    expect(score.percentage).toBe(100);
    expect(score.correctCount).toBe(36);
    expect(score.incorrectCount).toBe(0);
    expect(score.unansweredCount).toBe(0);
  });

  it("scores 100% correct responses for Year 5 (49/49 marks across 42 questions)", () => {
    const questions = loadFamilyBetaFixedPaperQuestions("year5", ENABLED_ENV);
    const responses: Record<string, CandidateAnswer | undefined> = {};

    for (const q of questions) {
      const canonical = buildDeclaredResponse(q);
      expect(canonical).toBeDefined();
      responses[q.id] = canonical;
    }

    const score = scoreFamilyBetaFixedPaper("year5", responses, ENABLED_ENV);

    expect(score.awardedMarks).toBe(49);
    expect(score.availableMarks).toBe(49);
    expect(score.percentage).toBe(100);
    expect(score.correctCount).toBe(42);
    expect(score.incorrectCount).toBe(0);
    expect(score.unansweredCount).toBe(0);
  });

  it("scores blank responses as 0 awarded marks and 100% unanswered", () => {
    const scoreY3 = scoreFamilyBetaFixedPaper("year3", {}, ENABLED_ENV);
    expect(scoreY3.awardedMarks).toBe(0);
    expect(scoreY3.unansweredCount).toBe(36);

    const scoreY5 = scoreFamilyBetaFixedPaper("year5", {}, ENABLED_ENV);
    expect(scoreY5.awardedMarks).toBe(0);
    expect(scoreY5.unansweredCount).toBe(42);
  });
});
