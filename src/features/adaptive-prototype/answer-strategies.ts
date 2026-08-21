import { createSeededRandom } from "@/features/exam-engine/selection";

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

/**
 * A simulated student of constant ability `probabilityCorrect` (0-1):
 * each item is independently correct with that probability, decided by the
 * platform's own deterministic seeded generator (`createSeededRandom`) so
 * the same seed always reproduces the same run. Deliberately NOT
 * difficulty-conditional — the model has no notion of "this student is more
 * likely to miss a challenging item than an easy one", because that
 * requires calibration (spec §8) this repository does not have. This is a
 * simplification, stated as one, not a hidden assumption: it tests whether
 * routing can recover a constant ability signal from noisy few-item stages,
 * not a realistic response-curve model.
 */
export function probabilisticStrategy(probabilityCorrect: number, seed: string): AnswerStrategy {
  if (probabilityCorrect < 0 || probabilityCorrect > 1) {
    throw new Error(`probabilityCorrect must be within [0, 1], got ${probabilityCorrect}`);
  }
  const random = createSeededRandom(seed);
  return () => random() < probabilityCorrect;
}
