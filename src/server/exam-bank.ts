import "server-only";

import { practiceExamBank, publishedExamBank } from "@/content/questions/practice-bank";
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
  switch (bankId) {
    case "practice":
      return practiceExamBank;
    case "published":
      return publishedExamBank;
    case "curated":
      return questionBank;
  }
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
    published: buildBankEligibilitySummary(publishedExamBank),
    practice: buildBankEligibilitySummary(practiceExamBank),
  };
}

/**
 * Total questions a learner can actually be served that this codebase
 * calls "published": the governed, test-pinned curated bank
 * (`questionBank`, exactly 100) plus every question that has cleared the
 * full question-factory governance chain and been assembled into
 * `factoryPublishedQuestions` by `npm run questions:assemble-bank`.
 *
 * That is exactly the `"published"` bank, so this counts `publishedExamBank`
 * itself rather than re-deriving the same union — the marketing number and
 * the pool those programs actually serve can then never drift apart.
 *
 * Deliberately NOT `practiceExamBank.length`: that pool also contains the
 * auto-generated `practiceQuestions` seeds, which are real and reachable but
 * have never been through the factory's publication gates, so counting
 * them here would call unpublished content "published". Deliberately no
 * longer `questionBank.length` alone either — the factory-published pool is
 * reachable to learners, so excluding it understated the count.
 *
 * Counted over a Set of ids so the figure stays correct even though the two
 * source pools are already guaranteed disjoint (publication refuses a
 * production-id collision). A plain count — never question content or
 * answer keys — so it's safe for a server component to inline into
 * marketing copy (see StatsBand.tsx).
 */
export function getPublishedQuestionCount(): number {
  return new Set(publishedExamBank.map((question) => question.id)).size;
}
