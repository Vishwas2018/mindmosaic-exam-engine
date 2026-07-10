import { validMultipleChoiceQuestion } from "./questions";

const base = validMultipleChoiceQuestion;

/** Missing the required prompt field. */
export const missingPromptQuestion = (() => {
  const clone: Record<string, unknown> = { ...base, id: "invalid-missing-prompt" };
  delete clone.prompt;
  return clone;
})();

/** Answer-key discriminator incompatible with the question type. */
export const incompatibleAnswerKeyQuestion = {
  ...base,
  id: "invalid-incompatible-key",
  answerKey: { kind: "boolean", value: true },
};

/** Answer key references an option id that does not exist. */
export const unknownOptionReferenceQuestion = {
  ...base,
  id: "invalid-unknown-option",
  answerKey: { kind: "single_option", optionId: "does-not-exist" },
};

/** Unsupported question type discriminator. */
export const unsupportedTypeQuestion = {
  ...base,
  id: "invalid-unsupported-type",
  type: "flip_card",
};

/** fill_blank question that is missing its interaction configuration. */
export const fillBlankMissingInteractionQuestion = {
  ...base,
  id: "invalid-fill-blank-no-interaction",
  type: "fill_blank",
  options: [],
  answerKey: {
    kind: "fill_blank",
    blanks: [{ id: "one", acceptedAnswers: ["3"] }],
  },
};

/** multiple_select with only a single correct option id. */
export const multipleSelectSingleCorrectQuestion = {
  ...base,
  id: "invalid-multi-select-single",
  type: "multiple_select",
  answerKey: { kind: "multiple_options", optionIds: ["a"] },
};

/** hotspot question with no hotspot_svg visual. */
export const hotspotMissingVisualQuestion = {
  ...base,
  id: "invalid-hotspot-no-visual",
  type: "hotspot",
  options: [],
  visuals: [],
  answerKey: { kind: "hotspot", regionIds: ["r1"] },
};

export const invalidQuestionFixtures = {
  missingPromptQuestion,
  incompatibleAnswerKeyQuestion,
  unknownOptionReferenceQuestion,
  unsupportedTypeQuestion,
  fillBlankMissingInteractionQuestion,
  multipleSelectSingleCorrectQuestion,
  hotspotMissingVisualQuestion,
};
