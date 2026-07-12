import type { CandidateQuestionInput } from "./candidate-question";
import type { CsvRow } from "./legacy-shapes";
import { CSV_QUESTION_TYPE_ALIASES, DEFAULT_MARKS_WHEN_ABSENT, isMachineVocabularyTag } from "./mappings";
import { findUnsafeMarkupFields } from "./safety";
import type { IngestionIssue, IngestionRejectionCode, IngestionWarning } from "./types";
import type { NormaliseDraft } from "./normalise";

export type CsvNormaliseOutcome =
  | { readonly ok: true; readonly draft: NormaliseDraft; readonly warnings: IngestionWarning[] }
  | { readonly ok: false; readonly reasonCode: IngestionRejectionCode; readonly issues: IngestionIssue[] };

function rejected(reasonCode: IngestionRejectionCode, message: string, field?: string): CsvNormaliseOutcome {
  return { ok: false, reasonCode, issues: [{ code: reasonCode, message, field }] };
}

const YEAR_LEVEL_PATTERN = /^Y([1-9]|1[0-2])$/;

function mapYearLevels(rawYearLevels: string): { readonly ok: true; readonly yearLevel: 3 | 5 } | CsvNormaliseOutcome {
  const segments = rawYearLevels.split("|").map((segment) => segment.trim());
  if (segments.some((segment) => !YEAR_LEVEL_PATTERN.test(segment))) {
    return rejected("malformed_year_level", `year_levels '${rawYearLevels}' does not match the expected 'Y<n>' pattern.`, "year_levels");
  }
  const numericLevels = new Set(segments.map((segment) => Number(segment.slice(1))));
  const supported = [...numericLevels].filter((level) => level === 3 || level === 5);
  if (supported.length !== 1) {
    return rejected(
      "unsupported_year_level",
      `year_levels '${rawYearLevels}' does not resolve to exactly one MindMosaic-supported year level (3 or 5).`,
      "year_levels",
    );
  }
  return { ok: true, yearLevel: supported[0] as 3 | 5 };
}

function mapDifficulty(raw: string | number): { readonly ok: true; readonly difficulty: "easy" | "medium" | "challenging" } | CsvNormaliseOutcome {
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value) || value < 1 || value > 5 || !Number.isInteger(value)) {
    return rejected("ambiguous_difficulty", `CSV difficulty '${raw}' is not an integer in the declared 1-5 range.`, "difficulty");
  }
  if (value <= 2) return { ok: true, difficulty: "easy" };
  if (value === 3) return { ok: true, difficulty: "medium" };
  return { ok: true, difficulty: "challenging" };
}

function inferSubject(topicSlug: string | undefined): { subject: "numeracy" | "reading" | "writing" | "language_conventions" } {
  const slug = (topicSlug ?? "").toLowerCase();
  if (slug.includes("read") || slug.includes("comprehension")) return { subject: "reading" };
  if (slug.includes("gram") || slug.includes("punct") || slug.includes("language")) return { subject: "language_conventions" };
  if (slug.includes("writ")) return { subject: "writing" };
  return { subject: "numeracy" };
}

interface CsvOption {
  readonly id: string;
  readonly text: string;
}

function lowercaseCsvIds(ids: readonly string[]): Map<string, string> | undefined {
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

/**
 * Normalises one already-CSV-parsed row (outer CSV parsing is not this
 * adapter's job — see `03-legacy-ingestion-requirements.md` §2) into a
 * candidate draft. The donor CSV project has no `subject`, `strand` or
 * exam-program equivalent at all; this adapter infers `subject` from
 * `topic_slug` via a documented keyword heuristic, defaults `strand` to the
 * raw `topic_slug`, and defaults `examStyle` to `naplan_style` — all three
 * are adapter policy decisions, not values the CSV format encodes, and are
 * flagged with a warning every time. See the adapter documentation's "known
 * limitations" section.
 */
export function normaliseCsvRow(row: CsvRow): CsvNormaliseOutcome {
  const warnings: IngestionWarning[] = [];

  if (row.slug.trim().length === 0) {
    return rejected("missing_source_identifier", "CSV row has an empty 'slug'.", "slug");
  }

  if ((row.group_slug && String(row.group_slug).trim().length > 0) || (row.group_position !== undefined && String(row.group_position).trim().length > 0)) {
    return rejected(
      "composite_reading_group_unsupported",
      "Composite reading-comprehension groups (group_slug/group_position) are not yet supported by this adapter.",
      "group_slug",
    );
  }

  const ignoredMetadataFields = (["tier_required", "review_status", "authored_by", "reviewed_by", "source_descriptor_id", "version"] as const).filter(
    (field) => row[field] !== undefined && String(row[field]).trim().length > 0,
  );
  if (ignoredMetadataFields.length > 0) {
    warnings.push({
      code: "csv_row_metadata_ignored",
      message: `CSV row metadata field(s) ignored (no trust weight, no trusted-schema equivalent): ${ignoredMetadataFields.join(", ")}.`,
    });
  }

  const mappedType = CSV_QUESTION_TYPE_ALIASES[row.type];
  if (!mappedType) {
    return rejected("unsupported_question_type", `CSV question type '${row.type}' is not supported by this adapter.`, "type");
  }

  const yearLevelOutcome = mapYearLevels(row.year_levels);
  if (!("yearLevel" in yearLevelOutcome)) return yearLevelOutcome;

  const difficultyOutcome = mapDifficulty(row.difficulty);
  if (!("difficulty" in difficultyOutcome)) return difficultyOutcome;

  let content: Record<string, unknown>;
  try {
    content = JSON.parse(row.content_data_json) as Record<string, unknown>;
  } catch {
    return rejected("malformed_inner_json", "CSV row 'content_data_json' is not valid JSON.", "content_data_json");
  }

  const prompt = typeof content.prompt === "string" ? content.prompt : row.prompt;
  if (!prompt) {
    return rejected("malformed_inner_json", "CSV row content has no usable prompt.", "content_data_json.prompt");
  }

  const unsafeFields = findUnsafeMarkupFields({ prompt });
  if (unsafeFields.length > 0) {
    return rejected("unsafe_raw_markup_detected", `Unsafe raw markup detected in field(s): ${unsafeFields.join(", ")}.`, unsafeFields[0]);
  }

  let options: CandidateQuestionInput["options"] = [];
  let optionIdMap: Map<string, string> | undefined;
  const donorOptions = Array.isArray(content.options) ? (content.options as CsvOption[]) : undefined;
  if (donorOptions && donorOptions.length > 0) {
    optionIdMap = lowercaseCsvIds(donorOptions.map((option) => option.id));
    if (!optionIdMap) {
      return rejected("duplicate_ids_after_normalisation", "Two or more CSV option ids collide after lower-casing.", "content_data_json.options");
    }
    options = donorOptions.map((option) => ({ id: optionIdMap!.get(option.id) as string, text: option.text }));
  }

  let answerKey: CandidateQuestionInput["answerKey"];
  let interaction: CandidateQuestionInput["interaction"];

  switch (mappedType) {
    case "multiple_choice": {
      const correctId = String(content.correct_id ?? "").toLowerCase();
      if (!optionIdMap || ![...optionIdMap.values()].includes(correctId)) {
        return rejected("unknown_answer_key_reference", `CSV 'correct_id' references unknown option '${content.correct_id}'.`, "content_data_json.correct_id");
      }
      answerKey = { kind: "single_option", optionId: correctId };
      break;
    }
    case "multiple_select": {
      const correctIds = Array.isArray(content.correct_ids) ? (content.correct_ids as string[]).map((id) => id.toLowerCase()) : [];
      const knownIds = optionIdMap ? new Set(optionIdMap.values()) : new Set<string>();
      if (correctIds.length === 0 || correctIds.some((id) => !knownIds.has(id))) {
        return rejected("unknown_answer_key_reference", "CSV 'correct_ids' references an unknown option.", "content_data_json.correct_ids");
      }
      answerKey = { kind: "multiple_options", optionIds: correctIds };
      break;
    }
    case "true_false": {
      answerKey = { kind: "boolean", value: Boolean(content.correct) };
      break;
    }
    case "number_entry": {
      const value = Number(content.answer);
      if (!Number.isFinite(value)) {
        return rejected("unknown_answer_key_reference", "CSV numeric 'answer' is not finite.", "content_data_json.answer");
      }
      answerKey = { kind: "number", value, ...(typeof content.unit === "string" ? { unit: content.unit } : {}) };
      break;
    }
    case "short_answer": {
      const acceptableAnswers = Array.isArray(content.acceptable_answers) ? (content.acceptable_answers as string[]) : [];
      if (acceptableAnswers.length === 0) {
        return rejected("unknown_answer_key_reference", "CSV short_answer has no acceptable_answers.", "content_data_json.acceptable_answers");
      }
      answerKey = { kind: "text", acceptableAnswers };
      break;
    }
    case "fill_blank": {
      const blanks = Array.isArray(content.blanks) ? (content.blanks as { id: string; label?: string }[]) : [];
      const blankIdMap = lowercaseCsvIds(blanks.map((blank) => blank.id));
      if (blanks.length === 0 || !blankIdMap) {
        return rejected("duplicate_ids_after_normalisation", "CSV fill_in_blank has no blanks, or blank ids collide after lower-casing.", "content_data_json.blanks");
      }
      const correctAnswers = Array.isArray(content.correct_answers)
        ? (content.correct_answers as { id: string; accepted: string[] }[])
        : [];
      const knownBlankIds = new Set(blankIdMap.values());
      const mappedBlanks = correctAnswers.map((answer) => ({ id: answer.id.toLowerCase(), acceptedAnswers: answer.accepted }));
      if (mappedBlanks.some((blank) => !knownBlankIds.has(blank.id))) {
        return rejected("unknown_answer_key_reference", "CSV 'correct_answers' references an unknown blank id.", "content_data_json.correct_answers");
      }
      answerKey = { kind: "fill_blank", blanks: mappedBlanks };
      interaction = {
        type: "fill_blank",
        segments: [],
        blanks: blanks.map((blank) => ({ id: blankIdMap.get(blank.id) as string, label: blank.label ?? blank.id })),
      };
      break;
    }
    case "dropdown": {
      const fields = Array.isArray(content.fields)
        ? (content.fields as { id: string; label: string; options: CsvOption[]; correct_option_id: string }[])
        : [];
      const fieldIdMap = lowercaseCsvIds(fields.map((field) => field.id));
      if (fields.length === 0 || !fieldIdMap) {
        return rejected("duplicate_ids_after_normalisation", "CSV dropdown_selection has no fields, or field ids collide after lower-casing.", "content_data_json.fields");
      }
      const dropdownFields: { id: string; label: string; options: { id: string; text: string }[] }[] = [];
      const answerFields: { id: string; correctOptionId: string }[] = [];
      for (const field of fields) {
        const optionIdMapForField = lowercaseCsvIds(field.options.map((option) => option.id));
        if (!optionIdMapForField) {
          return rejected("duplicate_ids_after_normalisation", `CSV dropdown field '${field.id}' has option ids that collide after lower-casing.`, "content_data_json.fields");
        }
        const correctOptionId = field.correct_option_id.toLowerCase();
        if (![...optionIdMapForField.values()].includes(correctOptionId)) {
          return rejected("unknown_answer_key_reference", `CSV dropdown field '${field.id}' correct_option_id references an unknown option.`, "content_data_json.fields");
        }
        dropdownFields.push({
          id: fieldIdMap.get(field.id) as string,
          label: field.label,
          options: field.options.map((option) => ({ id: optionIdMapForField.get(option.id) as string, text: option.text })),
        });
        answerFields.push({ id: fieldIdMap.get(field.id) as string, correctOptionId });
      }
      answerKey = { kind: "dropdown", fields: answerFields };
      interaction = { type: "dropdown", fields: dropdownFields };
      break;
    }
    case "matching": {
      const terms = Array.isArray(content.terms) ? (content.terms as CsvOption[]) : [];
      const targets = Array.isArray(content.targets) ? (content.targets as CsvOption[]) : [];
      const termIdMap = lowercaseCsvIds(terms.map((term) => term.id));
      const targetIdMap = lowercaseCsvIds(targets.map((target) => target.id));
      if (!termIdMap || !targetIdMap || terms.length === 0 || targets.length === 0) {
        return rejected("duplicate_ids_after_normalisation", "CSV matching terms/targets are empty or collide after lower-casing.", "content_data_json");
      }
      const rawPairs = Array.isArray(content.pairs) ? (content.pairs as { term_id: string; target_id: string }[]) : [];
      const pairs = rawPairs.map((pair) => ({ sourceId: pair.term_id.toLowerCase(), targetId: pair.target_id.toLowerCase() }));
      const knownTermIds = new Set(termIdMap.values());
      const knownTargetIds = new Set(targetIdMap.values());
      if (pairs.length === 0 || pairs.some((pair) => !knownTermIds.has(pair.sourceId) || !knownTargetIds.has(pair.targetId))) {
        return rejected("unknown_answer_key_reference", "CSV matching 'pairs' references an unknown term or target id.", "content_data_json.pairs");
      }
      answerKey = { kind: "matching", pairs };
      interaction = {
        type: "matching",
        sources: terms.map((term) => ({ id: termIdMap.get(term.id) as string, text: term.text })),
        targets: targets.map((target) => ({ id: targetIdMap.get(target.id) as string, text: target.text })),
      };
      break;
    }
    case "ordering": {
      const items = Array.isArray(content.items) ? (content.items as CsvOption[]) : [];
      const itemIdMap = lowercaseCsvIds(items.map((item) => item.id));
      if (!itemIdMap || items.length === 0) {
        return rejected("duplicate_ids_after_normalisation", "CSV ordering items are empty or collide after lower-casing.", "content_data_json.items");
      }
      const correctOrder = Array.isArray(content.correct_order) ? (content.correct_order as string[]).map((id) => id.toLowerCase()) : [];
      const knownItemIds = new Set(itemIdMap.values());
      if (correctOrder.length === 0 || correctOrder.some((id) => !knownItemIds.has(id))) {
        return rejected("unknown_answer_key_reference", "CSV 'correct_order' references an unknown item id.", "content_data_json.correct_order");
      }
      answerKey = { kind: "ordering", optionIds: correctOrder };
      interaction = { type: "ordering", items: items.map((item) => ({ id: itemIdMap.get(item.id) as string, text: item.text })) };
      break;
    }
    default:
      return rejected("unsupported_question_type", `CSV question type '${row.type}' is not supported by this adapter.`, "type");
  }

  const { subject } = inferSubject(row.topic_slug);
  warnings.push({
    code: "csv_subject_inferred",
    message: `CSV rows have no 'subject' field; inferred '${subject}' from topic_slug ('${row.topic_slug ?? ""}').`,
    field: "topic_slug",
  });
  warnings.push({
    code: "csv_strand_defaulted",
    message: "CSV rows have no 'strand' field; defaulted to the raw topic_slug value.",
    field: "topic_slug",
  });
  warnings.push({
    code: "csv_exam_style_defaulted",
    message: "CSV rows have no exam-program field; defaulted examStyle to 'naplan_style'.",
    field: "examStyle",
  });
  warnings.push({
    code: "marks_defaulted",
    message: `CSV rows have no 'marks' equivalent; defaulted to ${DEFAULT_MARKS_WHEN_ABSENT}.`,
    field: "metadata.marks",
  });

  const rawTags = Array.isArray(content.tags) ? (content.tags as string[]) : [];
  const tags = rawTags.filter((tag) => !isMachineVocabularyTag(tag)).slice(0, 12);

  const draft: NormaliseDraft = {
    type: mappedType,
    yearLevel: yearLevelOutcome.yearLevel,
    examStyle: "naplan_style",
    prompt,
    options,
    ...(interaction ? { interaction } : {}),
    visuals: [],
    answerKey,
    explanation: typeof content.explanation === "string" ? content.explanation : undefined,
    metadata: {
      subject,
      strand: row.topic_slug ?? "unspecified",
      difficulty: difficultyOutcome.difficulty,
      marks: DEFAULT_MARKS_WHEN_ABSENT,
      tags,
    },
  };

  return { ok: true, draft, warnings };
}
