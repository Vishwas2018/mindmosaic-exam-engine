import type { CanonicalQuestionRevision } from "./contracts";

export interface QualityIssue { code: string; severity: "hard" | "risk"; message: string }

const US_TERMS: readonly [RegExp, string][] = [
  [/\bcolor(ed|ing|s)?\b/i, "Use 'colour'."],
  [/\bperiod\b/i, "Use 'full stop' for punctuation."],
  [/\bcents?imeter(s)?\b/i, "Use 'centimetre'."],
  [/\bmeters?\b/i, "Use 'metre' when referring to measurement."],
  [/\bmath class\b/i, "Use Australian school terminology such as 'mathematics'."],
  [/\b(?:to|must|should|will|can) practice\b/i, "Use 'practise' for the verb."],
  [/\b(?:a|the) practise\b/i, "Use 'practice' for the noun."],
];

export function deterministicQualityIssues(revision: CanonicalQuestionRevision): QualityIssue[] {
  const q = revision.question;
  const visibleText = [q.prompt, q.instructions, q.stimulus?.body, ...q.options.map((option) => option.text)].filter(Boolean).join(" ");
  const issues: QualityIssue[] = [];
  const visualWords = /\b(graph|chart|diagram|image|picture|table|number line|map)\b/i;
  if (visualWords.test(`${q.prompt} ${q.instructions ?? ""}`) && q.visuals.length === 0 && revision.assets.filter((asset) => ["question_image", "stimulus_image"].includes(asset.role)).length === 0) {
    issues.push({ code: "missing_required_visual", severity: "hard", message: "The prompt refers to a visual but no visible visual or image asset is attached." });
  }
  const expectedVisualTypes: readonly [RegExp, readonly string[]][] = [
    [/\b(graph|chart)\b/i, ["bar_chart", "line_graph", "pie_chart"]],
    [/\btable\b/i, ["table"]],
    [/\bnumber line\b/i, ["number_line"]],
    [/\b(coordinate grid|coordinates)\b/i, ["coordinate_grid"]],
  ];
  for (const [reference, supportedTypes] of expectedVisualTypes) {
    if (reference.test(`${q.prompt} ${q.instructions ?? ""}`) && q.visuals.length > 0 && !q.visuals.some((visual) => supportedTypes.includes(visual.type))) {
      issues.push({ code: "wrong_visible_visual_type", severity: "hard", message: `The prompt refers to a ${reference.source}, but the required registered visual type is not attached.` });
    }
  }
  const optionText = q.options.map((option) => normalise(option.text));
  if (new Set(optionText).size !== optionText.length) issues.push({ code: "duplicate_option_meaning", severity: "hard", message: "Two options have identical normalised wording and may both be defensible." });
  if (q.answerKey.kind === "text") {
    const accepted = q.answerKey.acceptableAnswers.map(normalise);
    if (new Set(accepted).size !== accepted.length) issues.push({ code: "duplicate_accepted_answer", severity: "risk", message: "Accepted free-text answers contain duplicates after normalisation." });
  }
  for (const [pattern, message] of US_TERMS) if (pattern.test(visibleText)) issues.push({ code: "australian_english_issue", severity: "risk", message });
  const answerText = declaredAnswerText(revision);
  if (answerText && normalise(revision.learnerExplanation) === normalise(answerText)) {
    issues.push({ code: "explanation_repeats_answer", severity: "risk", message: "The learner explanation only repeats the answer." });
  }
  for (const asset of revision.assets) {
    if (asset.altText && answerText && normalise(asset.altText).includes(normalise(answerText))) {
      issues.push({ code: "alt_text_answer_leakage", severity: "hard", message: `Asset ${asset.assetId} alt text reveals the declared answer.` });
    }
  }
  return issues;
}

function normalise(value: string): string { return value.normalize("NFKC").toLocaleLowerCase("en-AU").replace(/[^a-z0-9]+/g, " ").trim(); }

function declaredAnswerText(revision: CanonicalQuestionRevision): string | undefined {
  const q = revision.question;
  if (q.answerKey.kind === "single_option") {
    const optionId = q.answerKey.optionId;
    return q.options.find((option) => option.id === optionId)?.text;
  }
  if (q.answerKey.kind === "text") return q.answerKey.acceptableAnswers[0];
  if (q.answerKey.kind === "number") return String(q.answerKey.value);
  if (q.answerKey.kind === "boolean") return String(q.answerKey.value);
  return undefined;
}
