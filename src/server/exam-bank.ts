import "server-only";

import { practiceExamBank } from "@/content/questions/practice-bank";
import { questionBank } from "@/content/questions/question-bank";
import {
  buildBankEligibilitySummary,
  type BankEligibilitySummary,
  type ExamBankId,
} from "@/features/exam-engine/selection";
import type { AuthoringQuestion } from "@/features/exam-engine/types";

/**
 * The one sanctioned gateway to the authoring question banks (answer keys
 * and explanations included) for app code. `server-only` makes any import
 * from a client-bundled module a build error, and the eslint
 * no-restricted-imports rule stops app code importing the underlying
 * content modules directly — together they keep answer keys out of client
 * JavaScript. See docs/ASSESSMENT_SECURITY_MODEL.md (Phase 0 addendum).
 *
 * Server components may pass what they read here to client components as
 * props (the guest practice flow does, an accepted and documented
 * trade-off of not requiring sign-in); Route Handlers use it to select
 * and score without the client ever receiving an answer key.
 */
export function getExamBank(bankId: ExamBankId): readonly AuthoringQuestion[] {
  return bankId === "practice" ? practiceExamBank : questionBank;
}

/**
 * Looks up one question (rubric and answer key included) by id across both
 * banks. Used by the teacher marking view, which needs a manual-review
 * question's rubric without knowing which bank the originating session
 * was configured against.
 */
export function getQuestionById(questionId: string): AuthoringQuestion | undefined {
  return (
    questionBank.find((question) => question.id === questionId) ??
    practiceExamBank.find((question) => question.id === questionId)
  );
}

/**
 * Eligibility summaries for both banks — counts and full-exam durations
 * per filter combination, no question content. This is all the exam setup
 * screen needs in the page payload; the banks themselves stay server-side
 * (guests fetch theirs from /api/exam/guest-bank, signed-in sessions get
 * server-selected CandidateQuestions from /api/exam/session).
 */
export function getBankEligibility(): Record<ExamBankId, BankEligibilitySummary> {
  return {
    curated: buildBankEligibilitySummary(questionBank),
    practice: buildBankEligibilitySummary(practiceExamBank),
  };
}
