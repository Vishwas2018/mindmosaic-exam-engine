import { canonicalContentHash, type CanonicalQuestionRevision } from "./contracts";

function normalise(text: string): string { return text.normalize("NFKC").toLocaleLowerCase("en-AU").replace(/\b\d+(?:\.\d+)?\b/g, "#").replace(/\b(?:alice|ben|charlie|dana|emma|liam|mia|noah|olivia|sam)\b/g, "<name>").replace(/[^a-z#<>]+/g, " ").trim(); }

export function questionFingerprints(revision: CanonicalQuestionRevision) {
  const question = revision.question;
  return {
    complete: canonicalContentHash(revision),
    normalised_stem: canonicalContentHash(normalise(question.prompt)),
    scenario_template: canonicalContentHash(normalise(`${question.stimulus?.body ?? ""} ${question.prompt}`)),
    answer_structure: canonicalContentHash({ type: question.type, answerKind: question.answerKey.kind, optionCount: question.options.length }),
    reading_stimulus: question.stimulus ? canonicalContentHash(normalise(question.stimulus.body)) : undefined,
    distractor_pattern: canonicalContentHash(question.options.map((option) => normalise(option.text))),
    learner_explanation: canonicalContentHash(normalise(revision.learnerExplanation)),
    visual_structure: question.visuals.length ? canonicalContentHash(question.visuals.map((visual) => ({ type: visual.type, data: visual.data }))) : undefined,
  } as const;
}

export function templateSimilarity(a: CanonicalQuestionRevision, b: CanonicalQuestionRevision): number {
  const left = new Set(normalise(`${a.question.stimulus?.body ?? ""} ${a.question.prompt} ${a.question.options.map((option) => option.text).join(" ")}`).split(" ").filter(Boolean));
  const right = new Set(normalise(`${b.question.stimulus?.body ?? ""} ${b.question.prompt} ${b.question.options.map((option) => option.text).join(" ")}`).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  let intersection = 0; for (const token of left) if (right.has(token)) intersection += 1;
  return intersection / (left.size + right.size - intersection);
}
