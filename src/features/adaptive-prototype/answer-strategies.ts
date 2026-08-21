import type { AnswerStrategy } from "./types";

/** Every item answered correctly — the "strong run" demo. */
export const allCorrectStrategy: AnswerStrategy = () => true;

/** Every item answered incorrectly — the "weak run" demo. */
export const allWrongStrategy: AnswerStrategy = () => false;

/**
 * Alternating correct/incorrect within each stage, starting correct. Neither
 * strong nor weak — demonstrates the router settling on "medium" rather
 * than climbing or dropping.
 */
export const mixedStrategy: AnswerStrategy = (_stageNumber, itemIndex) => itemIndex % 2 === 0;
