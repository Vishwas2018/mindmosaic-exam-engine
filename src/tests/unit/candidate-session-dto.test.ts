import { afterEach, describe, expect, it } from "vitest";

import {
  candidateSessionItemSchema,
  parseCandidateSession,
} from "@/server/assessment/candidate-session";
import { sessionStorageModel, targetSessionModelEnabled } from "@/server/assessment/storage-model";

/**
 * The candidate DTO contract (spec §18, §17.1; §22 "Learners cannot fetch
 * answers").
 *
 * §18 requires candidate-question DTOs to *structurally* omit private answer and
 * explanation fields. "Structurally" is the word that makes this testable: it is
 * not enough that the current server happens not to send an answer key — the
 * shape must be unable to carry one. `.strict()` is what implements that, and
 * these cases are what stop someone relaxing it later without noticing.
 */

const VALID_ITEM = {
  sessionItemId: "11111111-2222-4333-8444-555555555555",
  ordinal: 1,
  itemCode: "icas-y5-num-001",
  questionType: "multiple_choice",
  prompt: "What is 2 + 2?",
  candidateContent: { options: [{ id: "a", text: "3" }, { id: "b", text: "4" }] },
  visuals: [],
  accessibility: { altTextProvided: true },
  marksAvailable: 1,
  estimatedTimeSeconds: 60,
  stimulus: null,
};

const VALID_SESSION = {
  sessionId: "99999999-2222-4333-8444-555555555555",
  status: "active",
  version: 1,
  config: { yearLevel: 5 },
  createdAt: "2026-08-12T09:00:00.000Z",
  expiresAt: "2026-08-12T10:00:00.000Z",
  scoringAlgorithmVersion: "question-scorers.v1",
  items: [VALID_ITEM],
};

describe("the candidate session DTO parses a real allocation", () => {
  it("accepts the shape get_assessment_session returns", () => {
    const parsed = parseCandidateSession(VALID_SESSION);
    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0]!.sessionItemId).toBe(VALID_ITEM.sessionItemId);
  });

  it("has no property for an answer, an explanation or a rubric", () => {
    /* Read off the parsed value rather than the schema, because that is what a
       route would serialise. */
    const parsed = parseCandidateSession(VALID_SESSION);
    const serialised = JSON.stringify(parsed);
    expect(serialised).not.toMatch(/answerKey|answer_key/i);
    expect(serialised).not.toMatch(/explanation/i);
    expect(serialised).not.toMatch(/rubric|gradingRules/i);
    expect(serialised).not.toMatch(/correctOptionId|acceptedAnswers|acceptableAnswers/i);
  });
});

describe("an answer field cannot pass through the DTO", () => {
  it.each([
    ["answerKey", { kind: "single_option", optionId: "b" }],
    ["answer_key", { kind: "single_option", optionId: "b" }],
    ["explanation", "Because two and two make four."],
    ["privateExplanation", "Because two and two make four."],
    ["rubric", "Award one mark for the correct option."],
    ["gradingRules", { tolerance: 0 }],
  ])("rejects an item carrying %s", (field, value) => {
    /* This is the load-bearing case. Without `.strict()` every one of these
       would parse cleanly and be forwarded to the learner, because an unknown
       key is stripped-or-kept depending on the mode and never an error. */
    const result = candidateSessionItemSchema.safeParse({ ...VALID_ITEM, [field]: value });
    expect(result.success, `${field} must not be accepted on a candidate item`).toBe(false);
  });

  it("rejects an unknown field on the session envelope too", () => {
    const result = parseCandidateSession.bind(null, {
      ...VALID_SESSION,
      answerKeys: { [VALID_ITEM.sessionItemId]: "b" },
    });
    expect(result).toThrow();
  });

  it("rejects a session whose items are not candidate items", () => {
    expect(() =>
      parseCandidateSession({
        ...VALID_SESSION,
        items: [{ ...VALID_ITEM, answerKey: { kind: "single_option", optionId: "b" } }],
      }),
    ).toThrow();
  });
});

describe("the storage-model flag is off unless set exactly (§12.7 step 6)", () => {
  const original = process.env.ASSESSMENT_SESSION_STORAGE_MODEL;

  afterEach(() => {
    /* Restored rather than deleted, so this file cannot change the behaviour of
       another suite sharing the process. */
    if (original === undefined) delete process.env.ASSESSMENT_SESSION_STORAGE_MODEL;
    else process.env.ASSESSMENT_SESSION_STORAGE_MODEL = original;
  });

  /* Every near miss resolves to legacy. A flag whose default depends on parsing
     is a flag that will one day be on by accident — and this one turns on a
     different storage model for real learners' sittings. */
  it.each([undefined, "", "true", "1", "on", "enabled", "legacy", "VERSION_PINNED"])(
    "resolves to legacy for %s",
    (value) => {
      if (value === undefined) delete process.env.ASSESSMENT_SESSION_STORAGE_MODEL;
      else process.env.ASSESSMENT_SESSION_STORAGE_MODEL = value;

      expect(sessionStorageModel()).toBe("legacy");
      expect(targetSessionModelEnabled()).toBe(false);
    },
  );

  it("resolves to version_pinned only for the exact opt-in value", () => {
    process.env.ASSESSMENT_SESSION_STORAGE_MODEL = "version_pinned";
    expect(sessionStorageModel()).toBe("version_pinned");
    expect(targetSessionModelEnabled()).toBe(true);
  });
});
