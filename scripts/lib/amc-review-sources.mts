import "./allow-server-only.mts";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { parseCandidateQuestion } from "@/features/question-factory/validation/candidate-checks";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import type { Question } from "@/schemas/question.schema";

export const AMC_REVIEW_SOURCE_DIRECTORY = "content/review-sources/amc";
export const AMC_EXCLUDED_FROM_REVIEW: Readonly<Record<string, string>> = Object.freeze({
  "roadmap-amc-y3-014": "Excluded for revision: arithmetic mean is an age-fit concern for Year 3. Human age-fit review required before a new sheet.",
  "roadmap-amc-y5-006": "Excluded for revision: explanation contains corrupted multiplication-symbol text. Repair and rebind before review.",
  "roadmap-amc-y5-028": "Excluded for revision: two-variable whole-number algebra needs Year 5 age-fit review or replacement before a new sheet.",
});

const digest = z.string().regex(/^[a-f0-9]{64}$/);
export const amcReviewSourceSchema = z.object({
  kind: z.literal("amc_draft_review_source"), schemaVersion: z.literal(1),
  questionId: z.string().regex(/^roadmap-amc-y[35]-\d{3}$/),
  revision: z.literal(1),
  sourceFile: z.enum(["content/roadmap-drafts/amc-y3-draft.json", "content/roadmap-drafts/amc-y5-draft.json"]),
  sourceQuestionHash: digest,
  contentHash: digest,
}).strict();
export type AmcReviewSource = z.infer<typeof amcReviewSourceSchema>;
export interface AmcReviewTarget {
  readonly source: AmcReviewSource;
  readonly sourceManifestHash: string;
  /** A canonical publication PREVIEW only; never assembled or served here. */
  readonly question: Question;
}

export function buildAmcReviewTarget(raw: unknown, sourceFile: AmcReviewSource["sourceFile"]): AmcReviewTarget {
  const parsed = parseCandidateQuestion(raw);
  if (!parsed.ok) throw new Error("AMC draft does not parse as a candidate.");
  const candidate = parsed.data;
  const year = sourceFile.includes("y3") ? 3 : 5;
  if (candidate.examStyle !== "amc_style" || candidate.metadata.subject !== "amc_mathematics" ||
      candidate.yearLevel !== year || !new RegExp(`^roadmap-amc-y${year}-[0-9]{3}$`).test(candidate.id)) {
    throw new Error("AMC source identity, subject, style or year mismatch.");
  }
  const preview = buildPublishedQuestion(candidate);
  if (!preview.ok) throw new Error(`Cannot build canonical AMC review preview: ${preview.issues.join("; ")}`);
  const source = amcReviewSourceSchema.parse({ kind: "amc_draft_review_source", schemaVersion: 1,
    questionId: candidate.id, revision: 1, sourceFile,
    sourceQuestionHash: hashJson(raw), contentHash: canonicalQuestionHash(preview.question) });
  return { source, sourceManifestHash: hashJson(source), question: preview.question };
}

/** No staging, approval or publication is claimed by these private review sources. */
export async function loadAmcReviewTargets(root = process.cwd()): Promise<readonly AmcReviewTarget[]> {
  const targets: AmcReviewTarget[] = [];
  for (const year of [3, 5] as const) {
    const sourceFile = `content/roadmap-drafts/amc-y${year}-draft.json` as const;
    const packet = JSON.parse(await readFile(path.join(root, sourceFile), "utf8")) as { draftOnly: boolean; questions: unknown[] };
    const registered = z.array(amcReviewSourceSchema).length(30).parse(JSON.parse(
      await readFile(path.join(root, AMC_REVIEW_SOURCE_DIRECTORY, `y${year}.json`), "utf8")));
    if (packet.draftOnly !== true || !Array.isArray(packet.questions) || packet.questions.length !== 30) throw new Error("Expected exactly 30 AMC drafts per year.");
    const current = packet.questions.map((raw) => buildAmcReviewTarget(raw, sourceFile));
    const ids = new Set(current.map((target) => target.question.id));
    if (ids.size !== 30 || new Set(registered.map((source) => source.questionId)).size !== 30) throw new Error("Duplicate AMC review source identity.");
    for (const target of current) {
      const source = registered.find((record) => record.questionId === target.question.id);
      if (!source || hashJson(source) !== target.sourceManifestHash) throw new Error(`Stale AMC review source for ${target.question.id}; regenerate and obtain a fresh signature.`);
      targets.push(target);
    }
  }
  return targets;
}
