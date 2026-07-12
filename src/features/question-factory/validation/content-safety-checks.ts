import type { CandidateQuestion } from "../ingestion/candidate-question";
import { altTextLeaksAnswer, findUnsafeMarkupFields } from "../ingestion/safety";
import type { StructuralValidationIssue } from "./types";

function issue(
  code: StructuralValidationIssue["code"],
  path: string,
  message: string,
): StructuralValidationIssue {
  return { code, path, message, severity: "error" };
}

/**
 * Checks `prompt`/`stimulus`/`explanation` for forbidden raw/executable
 * markup, reusing the exact same deterministic, literal-pattern scanner
 * ingestion enforces at write time (`<script>`, `<svg>`, `javascript:`,
 * inline event handlers, `<iframe>` — see `ingestion/safety.ts`). Because
 * the production `visualSchema` only ever accepts structured element
 * unions (never a raw SVG string field), "no raw SVG" for the *visuals*
 * collection is already a schema-level guarantee; this check closes the
 * remaining gap: raw SVG/script markup pasted into a *text* field.
 */
export function checkUnsafeMarkup(question: CandidateQuestion): readonly StructuralValidationIssue[] {
  const flaggedFields = findUnsafeMarkupFields({
    prompt: question.prompt,
    explanation: question.explanation,
    stimulusBody: question.stimulus?.body,
    stimulusTitle: question.stimulus?.title,
  });
  if (flaggedFields.length === 0) return [];
  return [
    issue(
      "unsafe_markup_detected",
      `question.${flaggedFields[0]}`,
      `Unsafe raw/executable markup detected in field(s): ${flaggedFields.join(", ")}.`,
    ),
  ];
}

/**
 * The literal text a correct response would read as, per answer-key kind —
 * used only to screen visual alt text for deterministic, substring-level
 * leakage (`altTextLeaksAnswer`, the same check ingestion performs). Kinds
 * whose correct answer is identifier-only (matching/ordering/hotspot/
 * drag_drop/manual) have no natural-language literal to leak and are
 * intentionally omitted — a known limitation, not an oversight; see the
 * mission doc's "Known limitations".
 */
function deriveAnswerTexts(question: CandidateQuestion): readonly string[] {
  const key = question.answerKey;
  const optionText = (optionId: string): string | undefined =>
    question.options.find((option) => option.id === optionId)?.text;

  switch (key.kind) {
    case "single_option": {
      const text = optionText(key.optionId);
      return text ? [text] : [];
    }
    case "multiple_options":
      return key.optionIds.map(optionText).filter((text): text is string => text !== undefined);
    case "number":
      return [String(key.value)];
    case "text":
      return key.acceptableAnswers;
    case "boolean":
      return [String(key.value)];
    case "fill_blank":
      return key.blanks.flatMap((blank) => blank.acceptedAnswers);
    case "dropdown":
      return key.fields.map((field) => field.correctOptionId);
    default:
      return [];
  }
}

export function checkAnswerLeakageInAltText(question: CandidateQuestion): readonly StructuralValidationIssue[] {
  const answerTexts = deriveAnswerTexts(question);
  if (answerTexts.length === 0) return [];

  const issues: StructuralValidationIssue[] = [];
  question.visuals.forEach((visual, index) => {
    if (altTextLeaksAnswer(visual.altText, answerTexts)) {
      issues.push(
        issue(
          "answer_leakage_in_alt_text",
          `question.visuals.${index}.altText`,
          `Visual '${visual.id}' alt text appears to reveal the correct answer.`,
        ),
      );
    }
  });
  return issues;
}
