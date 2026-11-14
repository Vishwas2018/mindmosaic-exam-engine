import { z } from "zod";

export const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);
export const gitObjectSchema = z.string().regex(/^[a-f0-9]{40}$/);
export const repositoryPathSchema = z.string().min(1).max(500).refine(
  value => !/[\\:\x00-\x1f]/.test(value) && !value.startsWith("/") && value.split("/").every(part => part !== "" && part !== "." && part !== ".."),
  "Expected a safe repository-relative path",
);
export const gitSourceSchema = z.object({
  repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  commit: gitObjectSchema, path: repositoryPathSchema, blob: gitObjectSchema,
  sha256: sha256Schema,
}).strict();

export const originalGenerationUnverifiedSchema = z.object({
  status: z.literal("unverified"), provider: z.null(), model: z.null(),
  prompt: z.null(), promptHash: z.null(), generatedAt: z.null(), event: z.null(),
  limitations: z.array(z.string().min(1).max(1000)).min(1).max(20),
  evidenceReferences: z.array(z.string().min(1).max(500)).min(1).max(30),
}).strict();

export const repositoryImportSchema = z.object({
  importedAt: z.iso.datetime(), tool: z.literal("mindmosaic-legacy-import"), toolVersion: z.literal("1"),
  // Operator claims are not accepted by the CLI. Null means not established.
  operator: z.object({ identity: z.string().min(1), evidenceReference: z.string().min(1) }).strict().nullable(),
  source: gitSourceSchema, rawQuestionHash: sha256Schema, sourceCandidateHash: sha256Schema,
  candidateHash: sha256Schema, publicationContentHash: sha256Schema,
  blueprint: gitSourceSchema.extend({ id: z.string().min(1), contentHash: sha256Schema }).strict(),
  reviewPacket: gitSourceSchema.extend({ projectionHash: sha256Schema }).strict(),
  transformations: z.array(z.object({
    kind: z.literal("solver_sidecar"), field: z.literal("solverParams"),
    beforeCandidateHash: sha256Schema, afterCandidateHash: sha256Schema,
    sidecarHash: sha256Schema,
  }).strict()).max(1),
  manifestHash: sha256Schema, transactionId: z.string().regex(/^legacy-[a-f0-9]{64}$/),
}).strict();

export type RepositoryImport = z.infer<typeof repositoryImportSchema>;
