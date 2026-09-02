import type { CanonicalQuestionRevision } from "./contracts";

/** Learner DTO deliberately excludes answerKey and all private authoring evidence. */
export function toLearnerQuestionDto(revision: CanonicalQuestionRevision) {
  const { answerKey: _answerKey, explanation: _legacyExplanation, ...question } = revision.question;
  void _answerKey;
  void _legacyExplanation;
  return {
    logicalQuestionId: revision.logicalQuestionId,
    revision: revision.revision,
    question,
    assets: revision.assets,
    learnerExplanation: revision.learnerExplanation,
  };
}
