import type { MediaAsset, Question } from "@/schemas/question.schema";
import type { VisualAsset } from "@/schemas/visual.schema";

import {
  toCandidateMediaAsset,
  toCandidateQuestion,
  type CandidateMediaAsset,
  type CandidateQuestion,
} from "./candidate-question";

export type AuthoringGroupStimulusBlock =
  | { readonly id: string; readonly kind: "text"; readonly title?: string; readonly body: string }
  | { readonly id: string; readonly kind: "visual"; readonly visual: VisualAsset }
  | { readonly id: string; readonly kind: "audio"; readonly media: MediaAsset };

export type CandidateGroupStimulusBlock =
  | Extract<AuthoringGroupStimulusBlock, { kind: "text" | "visual" }>
  | { readonly id: string; readonly kind: "audio"; readonly media: CandidateMediaAsset };

export interface AuthoringItemGroup {
  readonly itemGroupVersionId: string;
  readonly revision: number;
  readonly title: string;
  readonly sharedInstructions?: string;
  readonly accessibility: {
    readonly readingOrder: readonly string[];
    readonly answerableFromAccessibleRepresentation: boolean;
  };
  readonly stimuli: readonly AuthoringGroupStimulusBlock[];
  readonly members: readonly {
    readonly ordinal: number;
    readonly partLabel?: string;
    readonly question: Question;
  }[];
}

export interface CandidateItemGroup extends Omit<AuthoringItemGroup, "stimuli" | "members"> {
  readonly totalMarks: number;
  readonly stimuli: readonly CandidateGroupStimulusBlock[];
  readonly members: readonly {
    readonly ordinal: number;
    readonly partLabel?: string;
    readonly question: CandidateQuestion;
  }[];
}

/** Positive learner projection: answer keys, explanations and private scripts cannot cross. */
export function toCandidateItemGroup(group: AuthoringItemGroup): CandidateItemGroup {
  const members = [...group.members]
    .sort((left, right) => left.ordinal - right.ordinal)
    .map((member) => ({ ...member, question: toCandidateQuestion(member.question) }));
  return {
    itemGroupVersionId: group.itemGroupVersionId,
    revision: group.revision,
    title: group.title,
    sharedInstructions: group.sharedInstructions,
    accessibility: group.accessibility,
    totalMarks: group.members.reduce((total, member) => total + member.question.metadata.marks, 0),
    stimuli: group.stimuli.map((block) => block.kind === "audio"
      ? { id: block.id, kind: "audio", media: toCandidateMediaAsset(block.media) }
      : block),
    members,
  };
}
