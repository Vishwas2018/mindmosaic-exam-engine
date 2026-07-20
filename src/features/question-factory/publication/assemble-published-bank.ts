import { questionSchema, type Question } from "@/schemas/question.schema";

import type { FactoryRepository } from "../storage";
import type { PublicationManifest } from "./types";

export interface AssembledPublishedBank {
  readonly questions: readonly Question[];
  /** Non-fatal: a warning means one manifest was skipped, never that the whole assembly failed. */
  readonly warnings: readonly string[];
}

/**
 * The production-bank assembly path's read side: reconstructs the
 * factory-published question pool from every manifest in the
 * `published-manifests` compartment. Each manifest's embedded `question`
 * is the exact, already-schema-validated object `orchestratePublication`
 * built at publish time; this function re-validates it against the live
 * production schema before trusting it again — defence in depth, so a
 * hand-edited manifest file on disk can never silently enter the served
 * bank — and de-duplicates/sorts deterministically by `candidateId` so
 * the assembled output never depends on filesystem listing order.
 *
 * Never touches the curated 100-question bank (`@/content/questions/
 * question-bank`) — this only ever reads the factory workspace's own
 * `published-manifests` compartment. Callers decide how (and whether) to
 * merge the result into a served bank.
 */
export async function assemblePublishedQuestions(repository: FactoryRepository): Promise<AssembledPublishedBank> {
  const candidateIds = [...(await repository.list("published-manifests"))].sort();
  const questions: Question[] = [];
  const warnings: string[] = [];
  const seenProductionIds = new Set<string>();

  for (const candidateId of candidateIds) {
    const raw = await repository.read("published-manifests", candidateId);
    if (typeof raw !== "object" || raw === null) {
      warnings.push(`Manifest '${candidateId}' is not a readable object; skipped.`);
      continue;
    }
    const manifest = raw as PublicationManifest;
    const parsed = questionSchema.safeParse(manifest.question);
    if (!parsed.success) {
      warnings.push(
        `Manifest '${candidateId}' embeds a question that no longer validates against the production schema; skipped.`,
      );
      continue;
    }
    if (parsed.data.status !== "published") {
      warnings.push(`Manifest '${candidateId}' embeds a question whose status is not 'published'; skipped.`);
      continue;
    }
    if (seenProductionIds.has(parsed.data.id)) {
      warnings.push(`Duplicate production id '${parsed.data.id}' found across published manifests; second occurrence skipped.`);
      continue;
    }
    seenProductionIds.add(parsed.data.id);
    questions.push(parsed.data);
  }

  return { questions: Object.freeze(questions), warnings };
}
