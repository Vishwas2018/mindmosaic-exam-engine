import { readFile } from "node:fs/promises";
import path from "node:path";
import { FsFactoryRepository } from "../src/features/question-factory/storage/fs-factory-repository";
import { getWorkspaceRoot } from "../src/features/question-factory/config/paths";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { candidateProvenanceSchema } from "../src/features/question-factory/provenance/candidate-provenance";

async function main() {
  const repo = new FsFactoryRepository(getWorkspaceRoot());

  const vrPath = path.resolve(process.cwd(), "content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json");
  const nrPath = path.resolve(process.cwd(), "content/scholarship-drafts/scholarship-y6-numerical-reasoning-draft.json");

  const vrRaw = JSON.parse(await readFile(vrPath, "utf8"));
  const nrRaw = JSON.parse(await readFile(nrPath, "utf8"));

  const vrQuestions: Record<string, unknown>[] = vrRaw.questions;
  const nrQuestions: Record<string, unknown>[] = nrRaw.questions;

  console.log(`Found ${vrQuestions.length} VR items and ${nrQuestions.length} NR items.`);

  const batches = [
    { prefix: "vr", blueprintId: "blueprint-scholarship-y6-vr", questions: vrQuestions, params: vrRaw.parameters ?? {} },
    { prefix: "nr", blueprintId: "blueprint-scholarship-y6-nr", questions: nrQuestions, params: nrRaw.parameters ?? {} },
  ];

  let stagedCount = 0;
  for (const { prefix, blueprintId, questions, params } of batches) {
    for (let i = 0; i < questions.length; i++) {
      const draft = questions[i];
      const indexStr = String(i + 1).padStart(3, "0");
      const candidateId = `scholarship-candidate-y6-${prefix}-${indexStr}`;

      const draftId = String(draft.id);
      const sidecar = params[draftId];
      const hasSolver = sidecar && typeof sidecar.solver === "string";
      const questionObj: Record<string, unknown> = {
        ...draft,
        id: candidateId,
        ...(hasSolver ? {
          solverParams: {
            solver: sidecar.solver,
            solverParams: sidecar.solverParams ?? {},
            ...(sidecar.ruleOrientation ? { ruleOrientation: sidecar.ruleOrientation } : {}),
            ...(sidecar.targetOption ? { targetOption: sidecar.targetOption } : {}),
            ...(sidecar.correctValue !== undefined ? { correctValue: sidecar.correctValue } : {}),
          },
        } : {}),
      };

      const parsedQuestion = candidateQuestionSchema.safeParse(questionObj);
      if (!parsedQuestion.success) {
        throw new Error(`Failed to parse candidate question for ${candidateId}: ${parsedQuestion.error.message}`);
      }
      const question = parsedQuestion.data;
      const contentHash = hashJson(question);

      const provenanceObj = {
        candidateId,
        blueprintId,
        batchId: "batch-scholarship-drafts-1",
        pipelineRunId: "run-scholarship-drafts-1",
        revision: 1,
        generatedAt: "2026-10-14T00:00:00.000Z",
        generatorAdapter: {
          class: "manual_external",
          identity: {
            provider: "human",
            modelId: "human",
            modelFamily: "human",
            interactionMode: "external_manual",
          },
        },
        generatorVersion: "1.0.0",
        promptVersion: "1.0.0",
        schemaVersion: "1.0.0",
        taxonomyVersion: "1.0.0",
        contentHash,
        reviewRecords: [],
      };

      const parsedProv = candidateProvenanceSchema.safeParse(provenanceObj);
      if (!parsedProv.success) {
        throw new Error(`Failed to parse provenance for ${candidateId}: ${parsedProv.error.message}`);
      }
      const provenance = parsedProv.data;

      const record = {
        candidateId,
        state: "staged",
        question,
        provenance,
      };

      const exists = await repo.exists("staged", candidateId);
      if (exists) {
        await repo.remove("staged", candidateId);
      }
      const createResult = await repo.create("staged", candidateId, record);
      if (!createResult.ok) {
        throw new Error(`Failed to stage ${candidateId}: ${createResult.message}`);
      }
      stagedCount++;
    }
  }

  console.log(`Successfully staged ${stagedCount} scholarship reasoning candidates.`);
}

main().catch((err) => {
  console.error("Fatal error staging scholarship candidates:", err);
  process.exit(1);
});
