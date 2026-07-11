import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  toCandidateQuestion,
  toCandidateQuestions,
} from "@/features/exam-engine/types/candidate-question";
import type { Question } from "@/schemas/question.schema";

function essayQuestion(): Question {
  const essay = questionBank.find((question) => question.type === "essay");
  if (!essay) throw new Error("Fixture requires an essay question in the bank.");
  return essay;
}

describe("toCandidateQuestion", () => {
  it("excludes the answer key entirely", () => {
    for (const question of questionBank) {
      const candidate = toCandidateQuestion(question);
      expect(candidate).not.toHaveProperty("answerKey");
      expect(JSON.stringify(candidate)).not.toContain('"optionId"');
    }
  });

  it("excludes the explanation", () => {
    const candidate = toCandidateQuestion(questionBank[0]);
    expect(candidate).not.toHaveProperty("explanation");
  });

  it("excludes manual-marking rubric guidance and sample responses", () => {
    const essay = essayQuestion();
    expect(essay.answerKey.kind).toBe("manual");
    const candidate = toCandidateQuestion(essay);
    const serialised = JSON.stringify(candidate);
    if (essay.answerKey.kind === "manual") {
      expect(serialised).not.toContain(essay.answerKey.rubric);
      if (essay.answerKey.sampleResponse) {
        expect(serialised).not.toContain(essay.answerKey.sampleResponse);
      }
    }
  });

  it("keeps non-answer-revealing instructional guidance for essays", () => {
    const essay = essayQuestion();
    const candidate = toCandidateQuestion(essay);
    if (essay.answerKey.kind === "manual") {
      expect(candidate.minWords).toBe(essay.answerKey.minWords);
      expect(candidate.maxWords).toBe(essay.answerKey.maxWords);
    }
  });

  it("retains the answer-kind discriminator without the answer payload", () => {
    const mc = questionBank.find((question) => question.type === "multiple_choice")!;
    const candidate = toCandidateQuestion(mc);
    expect(candidate.answerKind).toBe("single_option");
    expect(candidate).not.toHaveProperty("answerKey");
  });

  it("preserves every field a renderer needs to present the question", () => {
    const question = questionBank[0];
    const candidate = toCandidateQuestion(question);
    expect(candidate.id).toBe(question.id);
    expect(candidate.type).toBe(question.type);
    expect(candidate.prompt).toBe(question.prompt);
    expect(candidate.options).toBe(question.options);
    expect(candidate.interaction).toBe(question.interaction);
    expect(candidate.visuals).toBe(question.visuals);
    expect(candidate.metadata).toBe(question.metadata);
  });

  it("toCandidateQuestions maps a whole bank without leaking answer keys", () => {
    const candidates = toCandidateQuestions(questionBank);
    expect(candidates).toHaveLength(questionBank.length);
    for (const candidate of candidates) {
      expect(candidate).not.toHaveProperty("answerKey");
    }
  });
});
