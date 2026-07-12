import type { VisualAsset } from "@/schemas/visual.schema";

import { skillTaxonomyRegistry } from "../taxonomy";
import type { CandidateQuestionInput } from "./candidate-question";
import type { LegacyQuestionJson, LegacyVisualAsset } from "./legacy-shapes";
import {
  DEFAULT_MARKS_WHEN_ABSENT,
  DONOR_TRUST_CLAIM_VALUES,
  FORBIDDEN_VISUAL_TYPES,
  HARVEST_DIFFICULTY_ALIASES,
  HARVEST_EXAM_TYPE_ALIASES,
  HARVEST_SUBJECT_ALIASES,
  HARVEST_SUPPORTED_QUESTION_TYPES,
  SUPPORTED_STIMULUS_KINDS,
  SUPPORTED_STRUCTURAL_VISUAL_TYPES,
  isMachineVocabularyTag,
  resolveEnglishSubject,
} from "./mappings";
import { altTextLeaksAnswer, findUnsafeMarkupFields } from "./safety";
import type { IngestionIssue, IngestionRejectionCode, IngestionWarning } from "./types";

export type NormaliseDraft = Omit<CandidateQuestionInput, "id">;

export type NormaliseOutcome =
  | { readonly ok: true; readonly draft: NormaliseDraft; readonly warnings: IngestionWarning[]; readonly donorSourceId?: string }
  | { readonly ok: false; readonly reasonCode: IngestionRejectionCode; readonly issues: IngestionIssue[] };

function rejected(reasonCode: IngestionRejectionCode, message: string, field?: string): NormaliseOutcome {
  return { ok: false, reasonCode, issues: [{ code: reasonCode, message, field }] };
}

/** Lower-cases a list of ids, reporting any post-lowering collision. Returns `undefined` on collision. */
function lowercaseIds(ids: readonly string[]): Map<string, string> | undefined {
  const mapping = new Map<string, string>();
  const seen = new Set<string>();
  for (const id of ids) {
    const lowered = id.toLowerCase();
    if (seen.has(lowered)) return undefined;
    seen.add(lowered);
    mapping.set(id, lowered);
  }
  return mapping;
}

interface AnswerMappingResult {
  readonly answerKey: CandidateQuestionInput["answerKey"];
  readonly interaction?: CandidateQuestionInput["interaction"];
  readonly answerTexts: readonly string[];
}

/**
 * Maps the donor `answerKey` (and, where the interaction requires it,
 * derives the corresponding trusted `interaction` config) for one question.
 * Returns a rejection outcome directly (rather than throwing) for every
 * unsupported/ambiguous/dangling-reference case so the caller never needs
 * its own try/catch around this step.
 */
function mapAnswerKey(
  donor: LegacyQuestionJson,
  questionType: (typeof HARVEST_SUPPORTED_QUESTION_TYPES)[number],
  optionIdMap: Map<string, string> | undefined,
): AnswerMappingResult | NormaliseOutcome {
  const answerKey = donor.answerKey as Record<string, unknown>;
  const type = answerKey.type as string;
  const knownOptionIds = new Set(optionIdMap ? [...optionIdMap.values()] : []);

  switch (type) {
    case "single_option": {
      const optionId = String(answerKey.optionId ?? "").toLowerCase();
      if (!knownOptionIds.has(optionId)) {
        return rejected(
          "unknown_answer_key_reference",
          `Answer key references unknown option '${answerKey.optionId}'.`,
          "answerKey.optionId",
        );
      }
      const optionText =
        donor.options?.find((option) => option.id.toLowerCase() === optionId)?.text ?? "";
      return {
        answerKey: { kind: "single_option", optionId },
        answerTexts: [optionText],
      };
    }
    case "multiple_option": {
      const rawIds = Array.isArray(answerKey.optionIds) ? (answerKey.optionIds as string[]) : [];
      const optionIds = rawIds.map((id) => id.toLowerCase());
      if (optionIds.some((id) => !knownOptionIds.has(id))) {
        return rejected(
          "unknown_answer_key_reference",
          "Answer key references at least one unknown option id.",
          "answerKey.optionIds",
        );
      }
      const texts = (donor.options ?? [])
        .filter((option) => optionIds.includes(option.id.toLowerCase()))
        .map((option) => option.text);
      return { answerKey: { kind: "multiple_options", optionIds }, answerTexts: texts };
    }
    case "numeric": {
      const value = Number(answerKey.value);
      if (!Number.isFinite(value)) {
        return rejected("unknown_answer_key_reference", "Numeric answer key value is not finite.", "answerKey.value");
      }
      const tolerance = typeof answerKey.tolerance === "number" ? answerKey.tolerance : undefined;
      const unit = typeof answerKey.unit === "string" ? answerKey.unit : undefined;
      return {
        answerKey: { kind: "number", value, ...(tolerance !== undefined ? { tolerance } : {}), ...(unit ? { unit } : {}) },
        answerTexts: [String(value)],
      };
    }
    case "text": {
      const acceptableAnswers = Array.isArray(answerKey.acceptableAnswers)
        ? (answerKey.acceptableAnswers as string[])
        : [];
      if (acceptableAnswers.length === 0) {
        return rejected("unknown_answer_key_reference", "Text answer key has no acceptable answers.", "answerKey.acceptableAnswers");
      }
      return { answerKey: { kind: "text", acceptableAnswers }, answerTexts: acceptableAnswers };
    }
    case "boolean": {
      const value = Boolean(answerKey.value);
      return { answerKey: { kind: "boolean", value }, answerTexts: [value ? "true" : "false"] };
    }
    case "blanks": {
      if (!donor.blanks || donor.blanks.length === 0) {
        return rejected("unknown_answer_key_reference", "Blanks answer key present with no blanks defined.", "blanks");
      }
      const blankIdMap = lowercaseIds(donor.blanks.map((blank) => blank.id));
      if (!blankIdMap) {
        return rejected("duplicate_ids_after_normalisation", "Two or more blank ids collide after lower-casing.", "blanks");
      }
      const answers = Array.isArray(answerKey.answers)
        ? (answerKey.answers as { id: string; acceptable: string[] }[])
        : [];
      const knownBlankIds = new Set(blankIdMap.values());
      const mappedBlanks = answers.map((answer) => ({
        id: answer.id.toLowerCase(),
        acceptedAnswers: answer.acceptable,
      }));
      if (mappedBlanks.some((blank) => !knownBlankIds.has(blank.id))) {
        return rejected("unknown_answer_key_reference", "Answer key references an unknown blank id.", "answerKey.answers");
      }
      const interactionBlanks = donor.blanks.map((blank) => ({
        id: blankIdMap.get(blank.id) as string,
        label: blank.label ?? blank.id,
      }));
      return {
        answerKey: { kind: "fill_blank", blanks: mappedBlanks },
        interaction: { type: "fill_blank", segments: [], blanks: interactionBlanks },
        answerTexts: mappedBlanks.flatMap((blank) => blank.acceptedAnswers),
      };
    }
    case "matching": {
      if (!donor.matchColumns) {
        return rejected("unknown_answer_key_reference", "Matching answer key present with no matchColumns defined.", "matchColumns");
      }
      const sourceIdMap = lowercaseIds(donor.matchColumns.left.map((item) => item.id));
      const targetIdMap = lowercaseIds(donor.matchColumns.right.map((item) => item.id));
      if (!sourceIdMap || !targetIdMap) {
        return rejected("duplicate_ids_after_normalisation", "Matching source/target ids collide after lower-casing.", "matchColumns");
      }
      const rawPairs = Array.isArray(answerKey.pairs)
        ? (answerKey.pairs as { left: string; right: string }[])
        : [];
      const knownSourceIds = new Set(sourceIdMap.values());
      const knownTargetIds = new Set(targetIdMap.values());
      const pairs = rawPairs.map((pair) => ({
        sourceId: pair.left.toLowerCase(),
        targetId: pair.right.toLowerCase(),
      }));
      if (pairs.some((pair) => !knownSourceIds.has(pair.sourceId) || !knownTargetIds.has(pair.targetId))) {
        return rejected("unknown_answer_key_reference", "Matching answer key references an unknown source or target id.", "answerKey.pairs");
      }
      return {
        answerKey: { kind: "matching", pairs },
        interaction: {
          type: "matching",
          sources: donor.matchColumns.left.map((item) => ({ id: sourceIdMap.get(item.id) as string, text: item.text })),
          targets: donor.matchColumns.right.map((item) => ({ id: targetIdMap.get(item.id) as string, text: item.text })),
        },
        answerTexts: [],
      };
    }
    case "ordering": {
      const rawIds = Array.isArray(answerKey.optionIds) ? (answerKey.optionIds as string[]) : [];
      const optionIds = rawIds.map((id) => id.toLowerCase());
      if (optionIds.length === 0 || optionIds.some((id) => !knownOptionIds.has(id))) {
        return rejected("unknown_answer_key_reference", "Ordering answer key references an unknown option id.", "answerKey.optionIds");
      }
      return { answerKey: { kind: "ordering", optionIds }, answerTexts: [] };
    }
    default:
      return rejected("unsupported_answer_key_type", `Answer-key type '${type}' is not supported by this adapter.`, "answerKey.type");
  }
}

function mapVisual(asset: LegacyVisualAsset): { visual: VisualAsset; warnings: IngestionWarning[] } | NormaliseOutcome {
  if (asset.svgContent) {
    return rejected(
      "forbidden_raw_visual_content",
      `Visual '${asset.id}' populates 'svgContent', which is forbidden regardless of declared type.`,
      "assets.svgContent",
    );
  }
  if ((FORBIDDEN_VISUAL_TYPES as readonly string[]).includes(asset.type)) {
    return rejected(
      "forbidden_raw_visual_content",
      `Visual type '${asset.type}' (raw SVG/opaque image) is forbidden and cannot be converted.`,
      "assets.type",
    );
  }
  if (!(SUPPORTED_STRUCTURAL_VISUAL_TYPES as readonly string[]).includes(asset.type)) {
    return rejected(
      "unsupported_visual_type",
      `Visual type '${asset.type}' is not yet supported by this ingestion adapter's reshape logic.`,
      "assets.type",
    );
  }
  const altText = asset.altText ?? "";
  if (altText.trim().length < 10) {
    return rejected("unsupported_visual_type", `Visual '${asset.id}' has no usable alt text.`, "assets.altText");
  }

  const warnings: IngestionWarning[] = [];
  const spec = (asset.spec ?? {}) as Record<string, unknown>;
  const base = { id: asset.id, altText, ...(asset.title ? { title: asset.title } : {}), ...(asset.caption ? { caption: asset.caption } : {}) };

  if (asset.type === "bar_chart") {
    const rows = Array.isArray(spec.data) ? (spec.data as { label: string; value: number }[]) : [];
    return {
      visual: {
        ...base,
        type: "bar_chart",
        data: {
          labels: rows.map((row) => row.label),
          values: rows.map((row) => row.value),
          colour: typeof spec.colour === "string" ? spec.colour : "#4B2E83",
          ...(typeof spec.xAxisLabel === "string" ? { xAxisLabel: spec.xAxisLabel } : {}),
          ...(typeof spec.yAxisLabel === "string" ? { yAxisLabel: spec.yAxisLabel } : {}),
        },
      },
      warnings,
    };
  }

  if (asset.type === "table") {
    warnings.push({
      code: "table_row_headers_defaulted",
      message: `Visual '${asset.id}': harvest tables have no 'rowHeaders' equivalent; defaulted to false.`,
      field: "assets.spec",
    });
    return {
      visual: {
        ...base,
        type: "table",
        data: {
          headers: Array.isArray(spec.columns) ? (spec.columns as string[]) : [],
          rows: Array.isArray(spec.rows) ? (spec.rows as (string | number)[][]) : [],
          rowHeaders: false,
        },
      },
      warnings,
    };
  }

  // number_line
  const min = Number(spec.min);
  const max = Number(spec.max);
  const rawStep = spec.step;
  const points = Array.isArray(spec.points) ? (spec.points as number[]) : [];
  let step: number | undefined = typeof rawStep === "number" ? rawStep : undefined;

  if (step === undefined || step === null) {
    if (points.length >= 2) {
      const sorted = [...points].sort((a, b) => a - b);
      const diffs = sorted.slice(1).map((value, index) => value - sorted[index]!);
      const uniform = diffs.every((diff) => Math.abs(diff - diffs[0]!) < 1e-9);
      if (uniform && diffs[0]! > 0) {
        step = diffs[0];
        warnings.push({
          code: "number_line_step_derived_from_points",
          message: `Visual '${asset.id}': harvest step was null; derived ${step} from point spacing.`,
          field: "assets.spec.step",
        });
      }
    }
  }

  if (step === undefined || !Number.isFinite(min) || !Number.isFinite(max)) {
    return rejected(
      "unsupported_visual_type",
      `Visual '${asset.id}': number_line step could not be derived and no valid step was supplied.`,
      "assets.spec.step",
    );
  }

  return {
    visual: {
      ...base,
      type: "number_line",
      data: { min, max, step, highlightedValues: points },
    },
    warnings,
  };
}

/**
 * Normalises one donor legacy question (already shape-validated by
 * `legacyQuestionJsonShape`) into a candidate draft. Never throws for
 * expected-bad donor data; every rejection path returns a structured
 * `IngestionIssue`.
 */
export function normaliseLegacyQuestion(donor: LegacyQuestionJson): NormaliseOutcome {
  const warnings: IngestionWarning[] = [];

  const unsafeFields = findUnsafeMarkupFields({
    prompt: donor.prompt,
    explanation: donor.explanation,
    stimulusBody: donor.stimulus?.body,
    stimulusTitle: donor.stimulus?.title,
  });
  if (unsafeFields.length > 0) {
    return rejected(
      "unsafe_raw_markup_detected",
      `Unsafe raw markup detected in field(s): ${unsafeFields.join(", ")}.`,
      unsafeFields[0],
    );
  }

  const examStyle = HARVEST_EXAM_TYPE_ALIASES[donor.examType];
  if (!examStyle) {
    return rejected("unsupported_exam_type", `Exam type '${donor.examType}' has no supported trusted equivalent.`, "examType");
  }

  let subject = HARVEST_SUBJECT_ALIASES[donor.subject];
  if (!subject && donor.subject === "English") {
    subject = resolveEnglishSubject(donor.strand);
  }
  if (!subject) {
    return rejected("unsupported_subject", `Subject '${donor.subject}' has no supported trusted mapping.`, "subject");
  }

  const difficulty = HARVEST_DIFFICULTY_ALIASES[donor.difficulty];
  if (!difficulty) {
    return rejected("ambiguous_difficulty", `Difficulty '${donor.difficulty}' is not a recognised, unambiguous value.`, "difficulty");
  }

  if (!(HARVEST_SUPPORTED_QUESTION_TYPES as readonly string[]).includes(donor.questionType)) {
    return rejected("unsupported_question_type", `Question type '${donor.questionType}' is not supported by this adapter.`, "questionType");
  }
  const questionType = donor.questionType as (typeof HARVEST_SUPPORTED_QUESTION_TYPES)[number];

  let stimulus: CandidateQuestionInput["stimulus"];
  if (donor.stimulus) {
    if (!(SUPPORTED_STIMULUS_KINDS as readonly string[]).includes(donor.stimulus.kind)) {
      return rejected("unsupported_stimulus_kind", `Stimulus kind '${donor.stimulus.kind}' is not supported.`, "stimulus.kind");
    }
    stimulus = { body: donor.stimulus.body, ...(donor.stimulus.title ? { title: donor.stimulus.title } : {}) };
  }

  let donorSourceId: string | undefined;
  if (donor.id) {
    donorSourceId = donor.id;
    warnings.push({
      code: "donor_id_not_authoritative",
      message: `Donor id '${donor.id}' recorded as non-authoritative provenance evidence only; a fresh candidate id is always minted.`,
      field: "id",
    });
  }
  if (donor.origin) {
    warnings.push({ code: "origin_field_ignored", message: `Donor 'origin' field ('${donor.origin}') ignored — never confers trust.`, field: "origin" });
  }
  if (donor.status) {
    const isTrustClaim = (DONOR_TRUST_CLAIM_VALUES as readonly string[]).includes(donor.status.toLowerCase());
    warnings.push({
      code: "donor_status_ignored",
      message: isTrustClaim
        ? `Donor 'status' field ('${donor.status}') looks like a trust claim; ignored — cannot elevate lifecycle state beyond 'generated'.`
        : `Donor 'status' field ('${donor.status}') ignored.`,
      field: "status",
    });
  }
  if (donor.createdAt) {
    warnings.push({ code: "timestamp_field_dropped", message: "Donor 'createdAt' dropped (no trusted-schema equivalent).", field: "createdAt" });
  }
  if (donor.updatedAt) {
    warnings.push({ code: "timestamp_field_dropped", message: "Donor 'updatedAt' dropped (no trusted-schema equivalent).", field: "updatedAt" });
  }

  const donorOptions = donor.options ?? [];
  let optionIdMap: Map<string, string> | undefined;
  if (donorOptions.length > 0) {
    optionIdMap = lowercaseIds(donorOptions.map((option) => option.id));
    if (!optionIdMap) {
      return rejected("duplicate_ids_after_normalisation", "Two or more option ids collide after lower-casing.", "options");
    }
  }

  const answerOutcome = mapAnswerKey(donor, questionType, optionIdMap);
  if ("ok" in answerOutcome) return answerOutcome; // rejection

  const options = donorOptions.map((option) => ({ id: optionIdMap!.get(option.id) as string, text: option.text }));

  const visuals: VisualAsset[] = [];
  for (const asset of donor.assets ?? []) {
    const outcome = mapVisual(asset);
    if ("ok" in outcome) return outcome; // rejection
    visuals.push(outcome.visual);
    warnings.push(...outcome.warnings);
  }

  for (const visual of visuals) {
    if (altTextLeaksAnswer(visual.altText, answerOutcome.answerTexts)) {
      return rejected(
        "answer_leakage_in_alt_text",
        `Visual '${visual.id}' alt text appears to reveal the correct answer.`,
        "assets.altText",
      );
    }
  }

  const rawTags = donor.tags ?? [];
  const filteredOutTags = rawTags.filter((tag) => isMachineVocabularyTag(tag));
  if (filteredOutTags.length > 0) {
    warnings.push({
      code: "machine_tag_filtered",
      message: `Filtered ${filteredOutTags.length} machine-vocabulary tag(s) not intended as free-text metadata: ${filteredOutTags.join(", ")}.`,
      field: "tags",
    });
  }
  const tags = rawTags.filter((tag) => !isMachineVocabularyTag(tag)).slice(0, 12);

  warnings.push({
    code: "marks_defaulted",
    message: `Donor content has no 'marks' equivalent; defaulted to ${DEFAULT_MARKS_WHEN_ABSENT}.`,
    field: "metadata.marks",
  });

  let skill: string | undefined;
  const skillLabel = donor.skillId ?? donor.skill;
  if (skillLabel) {
    const resolved = skillTaxonomyRegistry.resolve(skillLabel);
    if (resolved) {
      skill = resolved.id;
    } else {
      skill = skillLabel;
      warnings.push({
        code: "skill_not_in_taxonomy",
        message: `Skill label '${skillLabel}' does not resolve to a known taxonomy id or alias; carried through as free text.`,
        field: "skillId",
      });
    }
  }

  const draft: NormaliseDraft = {
    type: questionType,
    yearLevel: donor.yearLevel,
    examStyle,
    prompt: donor.prompt,
    ...(stimulus ? { stimulus } : {}),
    options,
    ...(answerOutcome.interaction ? { interaction: answerOutcome.interaction } : {}),
    visuals,
    answerKey: answerOutcome.answerKey,
    explanation: donor.explanation,
    metadata: {
      subject,
      strand: donor.strand,
      ...(skill ? { skill } : {}),
      difficulty,
      marks: DEFAULT_MARKS_WHEN_ABSENT,
      ...(donor.estimatedTimeSeconds ? { estimatedTimeSeconds: donor.estimatedTimeSeconds } : {}),
      tags,
    },
  };

  return { ok: true, draft, warnings, donorSourceId };
}
