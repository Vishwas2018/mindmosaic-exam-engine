import type { QuestionScore } from "./score-question";

export interface GroupScore {
  readonly awardedMarks: number;
  readonly availableMarks: number;
  readonly scoredAvailableMarks: number;
  readonly pendingManualMarks: number;
  readonly isProvisional: boolean;
  readonly childScores: readonly QuestionScore[];
}

/** Pure aggregate only: child items remain the authoritative scoring units. */
export function aggregateGroupScores(childScores: readonly QuestionScore[]): GroupScore {
  const pendingManual = childScores.filter((score) => score.manualReviewRequired);
  return {
    awardedMarks: childScores.reduce((total, score) => total + score.awardedMarks, 0),
    availableMarks: childScores.reduce((total, score) => total + score.availableMarks, 0),
    scoredAvailableMarks: childScores.reduce(
      (total, score) => score.requiresManualMarking ? total : total + score.availableMarks,
      0,
    ),
    pendingManualMarks: pendingManual.reduce((total, score) => total + score.availableMarks, 0),
    isProvisional: pendingManual.length > 0,
    childScores,
  };
}
