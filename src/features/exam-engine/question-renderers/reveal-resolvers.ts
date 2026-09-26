import { normaliseText } from "@/features/exam-engine/scoring";
import type { CandidateAnswer, QuestionReveal } from "@/features/exam-engine/types";
import type { QuestionType } from "@/schemas/question.schema";

import type { ElementState } from "./element-state";

/**
 * Per-answerKey-kind pure resolvers: given a `reveal` (or none) and one
 * element's chosen/correct facts, return the `ElementState` a renderer
 * should style that element with. Every resolver follows the same core
 * rule (see each function): no reveal yet → idle/selected only; revealed →
 * correct/incorrect/missed/idle. None of these ever decide *whether* an
 * answer is right independently of the real scorer — they read the same
 * `answerKey` fields `scoring/question-scorers.ts` grades against, and for
 * text comparison reuse that module's own `normaliseText` so a visual
 * state can never disagree with the actual grade.
 */

function resolve(reveal: QuestionReveal | undefined, isChosen: boolean, isCorrect: boolean): ElementState {
  if (!reveal) return isChosen ? "selected" : "idle";
  if (isChosen && isCorrect) return "correct";
  if (isChosen && !isCorrect) return "incorrect";
  if (!isChosen && isCorrect) return "missed";
  return "idle";
}

/**
 * For "mapping" answer keys (dropdown/matching/drag_drop), "is this element
 * correct" means two different things depending on whether it was chosen:
 * chosen — does the chosen value equal the one correct value for this
 * element; unchosen — does this element HAVE a correct value at all (so it
 * can be shown as "missed"). Collapsing those into one `isCorrect` boolean
 * (as `resolve` does for option-style keys, where "correct" is a stable,
 * chosen-independent fact per option) silently made "missed" unreachable
 * here, since `chosenValue === correctValue` is always false when
 * `chosenValue` is undefined. Caught by reveal-resolvers.test.ts.
 */
function resolveMapped(
  reveal: QuestionReveal | undefined,
  isChosen: boolean,
  chosenMatchesCorrect: boolean,
  hasCorrectTarget: boolean,
): ElementState {
  if (!reveal) return isChosen ? "selected" : "idle";
  if (isChosen && chosenMatchesCorrect) return "correct";
  if (isChosen && !chosenMatchesCorrect) return "incorrect";
  if (!isChosen && hasCorrectTarget) return "missed";
  return "idle";
}

/** single_option (multiple_choice) or boolean (true_false) options, and multiple_options (multiple_select) checkboxes. */
export function resolveOptionState(
  reveal: QuestionReveal | undefined,
  optionId: string,
  isChosen: boolean,
): ElementState {
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const isCorrect =
    key.kind === "single_option"
      ? key.optionId === optionId
      : key.kind === "multiple_options"
        ? key.optionIds.includes(optionId)
        : false;
  return resolve(reveal, isChosen, isCorrect);
}

/** true_false's two options don't carry option ids — compare against the boolean value directly. */
export function resolveBooleanOptionState(
  reveal: QuestionReveal | undefined,
  optionValue: boolean,
  isChosen: boolean,
): ElementState {
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const isCorrect = key.kind === "boolean" && key.value === optionValue;
  return resolve(reveal, isChosen, isCorrect);
}

/** dropdown field — grading applies to the whole select control, not an unselected <option> inside it. */
export function resolveDropdownFieldState(
  reveal: QuestionReveal | undefined,
  fieldId: string,
  chosenOptionId: string | undefined,
): ElementState {
  const isChosen = chosenOptionId !== undefined;
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const correctOptionId = key.kind === "dropdown" ? key.fields.find((field) => field.id === fieldId)?.correctOptionId : undefined;
  return resolveMapped(reveal, isChosen, chosenOptionId === correctOptionId, correctOptionId !== undefined);
}

/** fill_blank — same normaliseText rule scoreFillBlank grades with. */
export function resolveBlankState(
  reveal: QuestionReveal | undefined,
  blankId: string,
  submittedText: string | undefined,
): ElementState {
  const isChosen = typeof submittedText === "string" && submittedText.trim().length > 0;
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  if (key.kind !== "fill_blank" || !isChosen) return resolve(reveal, isChosen, false);
  const blank = key.blanks.find((entry) => entry.id === blankId);
  if (!blank) return resolve(reveal, isChosen, false);
  const options = { caseSensitive: key.caseSensitive, trimWhitespace: key.trimWhitespace };
  const normalisedSubmission = normaliseText(submittedText, options);
  const isCorrect = blank.acceptedAnswers.map((accepted) => normaliseText(accepted, options)).includes(normalisedSubmission);
  return resolve(reveal, isChosen, isCorrect);
}

/** number_entry's single input box — same tolerance formula scoreNumberEntry grades with. */
export function resolveNumberEntryState(reveal: QuestionReveal | undefined, submitted: number | undefined): ElementState {
  const isChosen = submitted !== undefined && Number.isFinite(submitted);
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const isCorrect = key.kind === "number" && isChosen && Math.abs(submitted - key.value) <= key.tolerance;
  return resolve(reveal, isChosen, isCorrect);
}

/** short_answer's single input box — same normaliseText rule scoreShortAnswer grades with. Never called for answerKind "manual" (essay-style short answer); callers must branch on that first, same as ShortAnswerRenderer already does. */
export function resolveShortAnswerState(reveal: QuestionReveal | undefined, submitted: string | undefined): ElementState {
  const isChosen = typeof submitted === "string" && submitted.trim().length > 0;
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  if (key.kind !== "text" || !isChosen) return resolve(reveal, isChosen, false);
  const options = { caseSensitive: key.caseSensitive, trimWhitespace: key.trimWhitespace };
  const normalisedSubmission = normaliseText(submitted, options);
  const isCorrect = key.acceptableAnswers.map((accepted) => normaliseText(accepted, options)).includes(normalisedSubmission);
  return resolve(reveal, isChosen, isCorrect);
}

/** matching (and label_diagram, which reuses the same "matching" answer-key shape) — grading applies to the row/select, not an unselected <option>. */
export function resolvePairState(
  reveal: QuestionReveal | undefined,
  sourceId: string,
  chosenTargetId: string | undefined,
): ElementState {
  const isChosen = chosenTargetId !== undefined;
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const correctTargetId = key.kind === "matching" ? key.pairs.find((pair) => pair.sourceId === sourceId)?.targetId : undefined;
  return resolveMapped(reveal, isChosen, chosenTargetId === correctTargetId, correctTargetId !== undefined);
}

/** ordering — per-position, not per-item: is the item at this position the one the answer key expects there. No "missed" concept (there is no separate unchosen-correct item per slot, only reordering). */
export function resolveOrderState(reveal: QuestionReveal | undefined, index: number, itemIdAtIndex: string): ElementState {
  if (!reveal) return "idle";
  const key = reveal.answerKey;
  const isCorrect = key.kind === "ordering" && key.optionIds[index] === itemIdAtIndex;
  return isCorrect ? "correct" : "incorrect";
}

/** drag_drop item — placed items get correct/incorrect against their actual zone; an unplaced item with a correct zone is "missed" (rendered as a ghost inside that zone by the caller). */
export function resolveDragDropItemState(
  reveal: QuestionReveal | undefined,
  itemId: string,
  chosenZoneId: string | undefined,
): ElementState {
  const isChosen = chosenZoneId !== undefined;
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const correctZoneId = key.kind === "drag_drop" ? key.placements[itemId] : undefined;
  return resolveMapped(reveal, isChosen, chosenZoneId === correctZoneId, correctZoneId !== undefined);
}

/** hotspot region — chosen if the student selected it; correct if the answer key includes it. */
export function resolveHotspotRegionState(reveal: QuestionReveal | undefined, regionId: string, isChosen: boolean): ElementState {
  if (!reveal) return resolve(reveal, isChosen, false);
  const key = reveal.answerKey;
  const isCorrect = key.kind === "hotspot" && key.regionIds.includes(regionId);
  return resolve(reveal, isChosen, isCorrect);
}

/** Types where "some elements right, some wrong" is a meaningful idea for the practice banner's richer "Partially correct" tone — everything else is marked right-or-not-right only (see element-state.ts's NOT_GRADED_SIGNAL). */
const PARTIAL_ELIGIBLE_TYPES = new Set<QuestionType>([
  "multiple_select",
  "fill_blank",
  "matching",
  "ordering",
  "drag_drop",
  "label_diagram",
]);

export function typeSupportsPartialCredit(type: QuestionType): boolean {
  return PARTIAL_ELIGIBLE_TYPES.has(type);
}

/**
 * Presentation-only helper for the practice banner's "Partially correct"
 * tone (PracticeSession.tsx) — true when the student got at least one
 * element right on an otherwise-incorrect, partial-credit-eligible
 * question. Never used for scoring: `currentResult.status` (already
 * "incorrect" by the time this is consulted) remains the sole source of
 * truth for streaks/results; this only decides which incorrect-state
 * copy/tone to show.
 */
export function hasAnyElementCorrect(reveal: QuestionReveal, answer: CandidateAnswer | undefined): boolean {
  const key = reveal.answerKey;
  if (answer === null || answer === undefined) return false;
  switch (key.kind) {
    case "multiple_options":
      return Array.isArray(answer) && answer.some((id) => key.optionIds.includes(id));
    case "fill_blank": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const options = { caseSensitive: key.caseSensitive, trimWhitespace: key.trimWhitespace };
      return key.blanks.some((blank) => {
        const submitted = (answer as Record<string, string | number>)[blank.id];
        return (
          typeof submitted === "string" &&
          blank.acceptedAnswers.map((accepted) => normaliseText(accepted, options)).includes(normaliseText(submitted, options))
        );
      });
    }
    case "matching": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const record = answer as Record<string, string | number>;
      return key.pairs.some((pair) => record[pair.sourceId] === pair.targetId);
    }
    case "ordering":
      return Array.isArray(answer) && key.optionIds.some((id, index) => answer[index] === id);
    case "drag_drop": {
      if (typeof answer !== "object" || Array.isArray(answer)) return false;
      const record = answer as Record<string, string | number>;
      return Object.entries(key.placements).some(([itemId, zoneId]) => record[itemId] === zoneId);
    }
    default:
      return false;
  }
}
