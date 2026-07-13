/**
 * Converts an answer key or a `DerivedValue` into the exact `CandidateAnswer`
 * shape `scoreQuestion` expects — the same conversion the real exam runtime
 * performs for a learner's response, reused rather than reimplemented.
 */
import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

import { fractionToApproximateNumber, fractionToDisplayString } from "./numeric";
import type { DerivedValue } from "./derived-value";

/** `undefined` only for `manual`-kind answer keys, which have no scoreable canonical response. */
export function buildDeclaredResponse(question: Question): CandidateAnswer | undefined {
  const key = question.answerKey;
  switch (key.kind) {
    case "single_option":
      return key.optionId;
    case "multiple_options":
      return key.optionIds;
    case "number":
      return key.value;
    case "boolean":
      return key.value;
    case "text":
      return key.acceptableAnswers[0];
    case "fill_blank":
      return Object.fromEntries(key.blanks.map((blank) => [blank.id, blank.acceptedAnswers[0]]));
    case "dropdown":
      return Object.fromEntries(key.fields.map((field) => [field.id, field.correctOptionId]));
    case "matching":
      return Object.fromEntries(key.pairs.map((pair) => [pair.sourceId, pair.targetId]));
    case "ordering":
      return key.optionIds;
    case "hotspot":
      return key.regionIds;
    case "drag_drop":
      return key.placements;
    case "manual":
      return undefined;
  }
}

export function buildResponseFromDerivedValue(value: DerivedValue): CandidateAnswer {
  switch (value.kind) {
    case "number":
      return fractionToApproximateNumber(value.value);
    case "boolean":
      return value.value;
    case "single_option":
      return value.optionId;
    case "multiple_options":
      return value.optionIds;
    case "ordering":
      return value.optionIds;
    case "matching":
      return Object.fromEntries(value.pairs.map((pair) => [pair.sourceId, pair.targetId]));
    case "fill_blank":
    case "dropdown":
      return value.values;
  }
}

/** A short, closed-form, bounded-length representation for evidence — never the prompt or explanation text. */
export function representDerivedValue(value: DerivedValue): string {
  switch (value.kind) {
    case "number":
      return fractionToDisplayString(value.value);
    case "boolean":
      return value.value ? "true" : "false";
    case "single_option":
      return value.optionId;
    case "multiple_options":
      return `[${value.optionIds.join(",")}]`;
    case "ordering":
      return `[${value.optionIds.join(",")}]`;
    case "matching":
      return `{${value.pairs.map((pair) => `${pair.sourceId}:${pair.targetId}`).join(",")}}`;
    case "fill_blank":
    case "dropdown":
      return `{${Object.entries(value.values)
        .map(([id, v]) => `${id}:${v}`)
        .join(",")}}`;
  }
}

export function representDeclaredAnswer(question: Question): string {
  const key = question.answerKey;
  switch (key.kind) {
    case "single_option":
      return key.optionId;
    case "multiple_options":
      return `[${key.optionIds.join(",")}]`;
    case "number":
      return String(key.value);
    case "boolean":
      return key.value ? "true" : "false";
    case "text":
      return `text(${key.acceptableAnswers.length} accepted)`;
    case "fill_blank":
      return `{${key.blanks.map((b) => `${b.id}:${b.acceptedAnswers[0]}`).join(",")}}`;
    case "dropdown":
      return `{${key.fields.map((f) => `${f.id}:${f.correctOptionId}`).join(",")}}`;
    case "matching":
      return `{${key.pairs.map((p) => `${p.sourceId}:${p.targetId}`).join(",")}}`;
    case "ordering":
      return `[${key.optionIds.join(",")}]`;
    case "hotspot":
      return `[${key.regionIds.join(",")}]`;
    case "drag_drop":
      return `{${Object.entries(key.placements)
        .map(([item, zone]) => `${item}:${zone}`)
        .join(",")}}`;
    case "manual":
      return "manual";
  }
}
