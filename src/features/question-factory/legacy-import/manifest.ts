import { z } from "zod";
import { factoryIdentifierSchema } from "../shared/identifiers";
import { gitSourceSchema, sha256Schema } from "../provenance/legacy-import";

export const legacyImportItemSchema = z.object({
  id: factoryIdentifierSchema,
  source: gitSourceSchema,
  rawQuestionHash: sha256Schema, sourceCandidateHash: sha256Schema,
  candidateHash: sha256Schema, publicationContentHash: sha256Schema,
  blueprint: gitSourceSchema.extend({ id: factoryIdentifierSchema, contentHash: sha256Schema }).strict(),
  reviewPacket: gitSourceSchema.extend({ projectionHash: sha256Schema }).strict(),
  transformation: z.object({ kind: z.literal("solver_sidecar"), sidecarHash: sha256Schema }).strict().nullable(),
}).strict();

export const legacyImportManifestSchema = z.object({
  version: z.literal(1), batchId: factoryIdentifierSchema,
  sourceRegister: gitSourceSchema,
  limitations: z.array(z.string().min(1).max(1000)).min(1).max(20),
  evidenceReferences: z.array(z.string().min(1).max(500)).min(1).max(30),
  items: z.array(legacyImportItemSchema).min(1).max(100),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.items.map(item => item.id)).size !== value.items.length)
    ctx.addIssue({ code: "custom", path: ["items"], message: "Duplicate candidate IDs are forbidden" });
});

export type LegacyImportManifest = z.infer<typeof legacyImportManifestSchema>;
export type LegacyImportItem = z.infer<typeof legacyImportItemSchema>;
