import { z } from "zod";
import { blueprintSchema } from "../blueprints";
import { candidateQuestionSchema } from "../ingestion/candidate-question";
import { buildPublishedQuestion } from "../publication/build-published-question";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { legacyCandidateProvenanceSchema } from "../provenance/candidate-provenance";
import { hashJson } from "../provenance/content-hash";
import { FACTORY_COMPARTMENTS, isTrustedReportId, type ReadOnlyFactoryRepository } from "../storage";
import { buildLegacyRecord } from "./record";
import { checkRevisionBlueprintCompatibility } from "../revision/blueprint-compatibility";
import { legacyImportManifestSchema, type LegacyImportItem } from "./manifest";
import { sha256, type LegacySourceReader } from "./source";

const registerSchema = z.object({ items: z.array(z.object({ id: z.string(), sourcePath: z.string(), currentCandidateHash: z.string(), currentPublicationContentHash: z.string() })) });
export type LegacyPlanItem = { item: LegacyImportItem; question: z.infer<typeof candidateQuestionSchema>; replay: boolean; existingImportedAt?: string; existingCompartment?: string };
export type LegacyImportPlan = { manifest: z.infer<typeof legacyImportManifestSchema>; manifestHash: string; items: LegacyPlanItem[] };

/** A failed preflight never claims files, locks, repairs corrupt records, or creates reports. */
export async function preflightLegacyImport(raw: unknown, source: LegacySourceReader, repository: ReadOnlyFactoryRepository): Promise<LegacyImportPlan> {
  const manifest = legacyImportManifestSchema.parse(raw);
  const manifestHash = hashJson(manifest);
  const readJson = async (binding: LegacyImportItem["source"]) => {
    const { repository: sourceRepository, commit, path, blob, sha256: expectedSha } = binding;
    const bytes = await source.read({ repository: sourceRepository, commit, path, blob, sha256: expectedSha });
    if (sha256(bytes) !== binding.sha256) throw new Error("source_sha256_mismatch");
    return JSON.parse(bytes.toString("utf8"));
  };
  const register = registerSchema.parse(await readJson(manifest.sourceRegister));
  if (new Set(register.items.map(row => row.id)).size !== register.items.length) throw new Error("duplicate_register_ids");
  const items: LegacyPlanItem[] = [];
  for (const item of manifest.items) {
    if (isTrustedReportId(item.id)) throw new Error(`reserved_candidate_identity:${item.id}`);
    const row = register.items.find(entry => entry.id === item.id);
    if (!row || row.sourcePath !== item.source.path || row.currentCandidateHash !== item.sourceCandidateHash || row.currentPublicationContentHash !== item.publicationContentHash) throw new Error(`source_register_binding_mismatch:${item.id}`);
    const packet = await readJson(item.source);
    const matches = z.object({ questions: z.array(z.record(z.string(), z.unknown())), parameters: z.record(z.string(), z.unknown()).optional() }).parse(packet).questions.filter(q => q.id === item.id);
    if (matches.length !== 1) throw new Error(`source_candidate_coverage:${item.id}`);
    const rawQuestion = matches[0];
    if (hashJson(rawQuestion) !== item.rawQuestionHash) throw new Error(`raw_question_hash_mismatch:${item.id}`);
    const original = candidateQuestionSchema.parse(rawQuestion);
    if (hashJson(original) !== item.sourceCandidateHash) throw new Error(`source_candidate_hash_mismatch:${item.id}`);
    let candidate = original;
    if (item.transformation) {
      const side = packet.parameters?.[item.id];
      if (!side || hashJson(side) !== item.transformation.sidecarHash || original.solverParams !== undefined) throw new Error(`solver_sidecar_mismatch:${item.id}`);
      const parsed = z.object({ solver: z.string(), solverParams: z.record(z.string(), z.unknown()).default({}), ruleOrientation: z.string().optional(), targetOption: z.string().optional(), correctValue: z.union([z.string(), z.number()]).optional() }).parse(side);
      candidate = candidateQuestionSchema.parse({ ...original, solverParams: { solver: parsed.solver, solverParams: parsed.solverParams,
        ...((parsed.ruleOrientation ?? parsed.solverParams.ruleOrientation) ? { ruleOrientation: parsed.ruleOrientation ?? parsed.solverParams.ruleOrientation } : {}),
        ...(parsed.targetOption ? { targetOption: parsed.targetOption } : {}), ...(parsed.correctValue !== undefined ? { correctValue: parsed.correctValue } : {}) } });
    }
    if (hashJson(candidate) !== item.candidateHash) throw new Error(`candidate_hash_mismatch:${item.id}`);
    const built = buildPublishedQuestion(candidate);
    const originalBuilt = buildPublishedQuestion(original);
    if (!built.ok || !originalBuilt.ok || canonicalQuestionHash(built.question) !== item.publicationContentHash || canonicalQuestionHash(originalBuilt.question) !== item.publicationContentHash) throw new Error(`publication_hash_mismatch:${item.id}`);
    const blueprintRaw = await readJson(item.blueprint);
    const blueprint = blueprintSchema.parse(blueprintRaw);
    if (blueprint.id !== item.blueprint.id || hashJson(blueprintRaw) !== item.blueprint.contentHash || checkRevisionBlueprintCompatibility(candidate, blueprint).length) throw new Error(`blueprint_binding_mismatch:${item.id}`);
    const storedBlueprint = await repository.inspectRecord("blueprints", blueprint.id);
    if (storedBlueprint.status !== "present" || hashJson(storedBlueprint.record) !== item.blueprint.contentHash) throw new Error(`workspace_blueprint_mismatch:${item.id}`);
    const projection = { id: original.id, prompt: original.prompt, ...(original.stimulus ? { stimulus: original.stimulus } : {}), options: original.options, ...(original.visuals.length ? { visuals: original.visuals } : {}) };
    const review = z.array(z.record(z.string(), z.unknown())).parse(await readJson(item.reviewPacket)).filter(q => q.id === item.id);
    if (review.length !== 1 || hashJson(review[0]) !== item.reviewPacket.projectionHash || hashJson(projection) !== item.reviewPacket.projectionHash) throw new Error(`review_packet_binding_mismatch:${item.id}`);
    let replay = false;
    let existingImportedAt: string | undefined;
    let existingCompartment: string | undefined;
    for (const compartment of FACTORY_COMPARTMENTS) {
      const existing = await repository.inspectRecord(compartment, item.id);
      if (existing.status === "absent") continue;
      if (existing.status === "malformed" || replay) throw new Error(`duplicate_or_malformed_record:${item.id}`);
      const stored = z.object({ candidateId: z.literal(item.id), question: candidateQuestionSchema, provenance: legacyCandidateProvenanceSchema }).safeParse(existing.record);
      if (!stored.success || stored.data.provenance.repositoryImport.manifestHash !== manifestHash || hashJson(stored.data.question) !== item.candidateHash) throw new Error(`candidate_conflict:${item.id}`);
      const expected = buildLegacyRecord({ manifest, manifestHash, items: [] }, { item, question: candidate, replay: true }, stored.data.provenance.repositoryImport.importedAt);
      if (hashJson({ ...stored.data.provenance, reviewRecords: [] }) !== hashJson(expected.provenance)) throw new Error(`import_provenance_conflict:${item.id}`);
      existingImportedAt = stored.data.provenance.repositoryImport.importedAt;
      existingCompartment = compartment;
      replay = true;
    }
    items.push({ item, question: candidate, replay, ...(existingImportedAt ? { existingImportedAt, existingCompartment } : {}) });
  }
  return { manifest, manifestHash, items };
}
