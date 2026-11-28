import { FACTORY_VERSIONS } from "../config";
import { legacyCandidateProvenanceSchema } from "../provenance/candidate-provenance";
import type { LegacyImportPlan, LegacyPlanItem } from "./preflight";

/** Pure construction; importedAt is supplied by the transaction clock, never as authoring time. */
export function buildLegacyRecord(plan: LegacyImportPlan, entry: LegacyPlanItem, importedAt: string) {
  const { item, question } = entry;
  const provenance = legacyCandidateProvenanceSchema.parse({
    provenanceVersion: 2, kind: "legacy_import", candidateId: item.id,
    blueprintId: item.blueprint.id, batchId: plan.manifest.batchId,
    pipelineRunId: `legacy-${plan.manifestHash}`, revision: 0,
    generatedAt: null, generatorVersion: null, promptVersion: null, promptHash: null,
    generatorAdapter: { class: "legacy_import", identity: null },
    originalGeneration: { status: "unverified", provider: null, model: null, prompt: null, promptHash: null, generatedAt: null, event: null,
      limitations: plan.manifest.limitations, evidenceReferences: plan.manifest.evidenceReferences },
    repositoryImport: {
      importedAt, tool: "mindmosaic-legacy-import", toolVersion: "1", operator: null,
      source: item.source, rawQuestionHash: item.rawQuestionHash, sourceCandidateHash: item.sourceCandidateHash,
      candidateHash: item.candidateHash, publicationContentHash: item.publicationContentHash,
      blueprint: item.blueprint, reviewPacket: item.reviewPacket,
      transformations: item.transformation ? [{ kind: "solver_sidecar", field: "solverParams", beforeCandidateHash: item.sourceCandidateHash, afterCandidateHash: item.candidateHash, sidecarHash: item.transformation.sidecarHash }] : [],
      manifestHash: plan.manifestHash, transactionId: `legacy-${plan.manifestHash}`,
    },
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION, taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    contentHash: item.candidateHash, reviewRecords: [],
  });
  return { candidateId: item.id, state: "generated" as const, question, provenance };
}
