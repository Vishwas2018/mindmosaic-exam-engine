import { z } from "zod";
import type { CanonicalQuestionRevision } from "./contracts";

export const ALLOWED_ASSET_MIME_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/avif", "audio/mpeg", "audio/ogg", "audio/wav", "text/plain", "application/pdf",
] as const;

export const storedAssetVersionSchema = z.object({
  assetId: z.string().uuid(), revision: z.number().int().positive(), storageReference: z.string().min(1).max(500),
  mimeType: z.enum(ALLOWED_ASSET_MIME_TYPES), fileSize: z.number().int().positive().max(10 * 1024 * 1024),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(),
  altText: z.string().trim().min(10).max(500).optional(), transcriptAssetId: z.string().uuid().optional(),
}).strict();
export type StoredAssetVersion = z.infer<typeof storedAssetVersionSchema>;

export interface AssetResolutionIssue { code: "missing_asset" | "missing_revision" | "asset_hash_mismatch" | "missing_alt_text" | "missing_transcript"; assetId: string }

export function validateAssetResolution(question: CanonicalQuestionRevision, available: readonly StoredAssetVersion[]): AssetResolutionIssue[] {
  const byVersion = new Map(available.map((asset) => [`${asset.assetId}:${asset.revision}`, asset]));
  const issues: AssetResolutionIssue[] = [];
  for (const reference of question.assets) {
    const anyAsset = available.some((asset) => asset.assetId === reference.assetId);
    const asset = byVersion.get(`${reference.assetId}:${reference.revision}`);
    if (!asset) { issues.push({ code: anyAsset ? "missing_revision" : "missing_asset", assetId: reference.assetId }); continue; }
    if (asset.contentHash !== reference.contentHash) issues.push({ code: "asset_hash_mismatch", assetId: reference.assetId });
    if (asset.mimeType.startsWith("image/") && !(reference.altText ?? asset.altText)) issues.push({ code: "missing_alt_text", assetId: reference.assetId });
    if (asset.mimeType.startsWith("audio/") && !asset.transcriptAssetId) issues.push({ code: "missing_transcript", assetId: reference.assetId });
  }
  return issues;
}
