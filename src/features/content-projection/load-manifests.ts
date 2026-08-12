import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  manifestSchemaVersionOf,
  validateManifestReviewEvidence,
  type CorrectnessBasis,
} from "@/features/question-factory/publication/manifest-schema";

/**
 * Reads `content/question-factory/published-manifests/` — the factory half's
 * provenance (ADR-002 §3).
 *
 * Node-only (it touches the filesystem) and offline: it never contacts a
 * database, so the same loader serves the projection script, the shadow-compare
 * and the unit suite.
 *
 * **Every manifest is validated before it is allowed to produce a runtime
 * row**, using the factory's own `validateManifestReviewEvidence` rather than a
 * second implementation of the same rules. ADR-002 §4 requires the projection
 * to verify that a manifest "passes the manifest schema and review-evidence
 * rules"; borrowing the factory's validator is what makes that true rather than
 * asserted, and means a rule change there cannot silently stop applying here.
 */

export const PUBLISHED_MANIFESTS_DIR = path.join(
  "content",
  "question-factory",
  "published-manifests",
);

export type ReviewEvidenceKind = "verified_chain" | "recovered_unverifiable" | "none";

export interface LoadedManifest {
  readonly id: string;
  readonly questionId: string;
  readonly contentHash: string;
  readonly revision: number;
  readonly blueprintId: string | null;
  readonly batchId: string | null;
  readonly generatorAdapter: unknown;
  readonly originalityFingerprint: string | null;
  readonly difficultyFingerprint: string | null;
  readonly manifestFingerprint: string | null;
  readonly manifestSchemaVersion: number;
  readonly correctnessBasis?: CorrectnessBasis;
  readonly reviewEvidence: readonly unknown[];
  readonly reviewEvidenceKind: ReviewEvidenceKind;
  readonly publishedAt: string;
}

export interface ManifestLoadResult {
  readonly manifests: readonly LoadedManifest[];
  /** Manifests rejected by the factory's own review-evidence rules. */
  readonly rejected: readonly { readonly file: string; readonly issues: readonly string[] }[];
}

/**
 * What the manifest's review evidence is worth.
 *
 * A `reviewChain` is checkable by `verifyReviewChain`; `recoveredEvidence` is
 * explicitly not (each entry carries `verifiability: "none"`). Collapsing the
 * two into "has evidence" would let 288 unverifiable manifests read as
 * verified, which is exactly the confusion P0-B was written to end.
 */
function evidenceKindOf(manifest: {
  reviewChain?: readonly unknown[];
  recoveredEvidence?: readonly unknown[];
}): ReviewEvidenceKind {
  if ((manifest.reviewChain?.length ?? 0) > 0) return "verified_chain";
  if ((manifest.recoveredEvidence?.length ?? 0) > 0) return "recovered_unverifiable";
  return "none";
}

export async function loadPublishedManifests(
  directory: string = PUBLISHED_MANIFESTS_DIR,
): Promise<ManifestLoadResult> {
  const entries = (await readdir(directory)).filter((file) => file.endsWith(".json")).sort();

  const manifests: LoadedManifest[] = [];
  const rejected: { file: string; issues: string[] }[] = [];

  for (const file of entries) {
    const raw = JSON.parse(await readFile(path.join(directory, file), "utf8")) as Record<
      string,
      unknown
    >;

    const validation = validateManifestReviewEvidence(
      raw as unknown as Parameters<typeof validateManifestReviewEvidence>[0],
    );
    if (!validation.ok) {
      rejected.push({
        file,
        issues: validation.issues.map((issue) => `${issue.path}: ${issue.message}`),
      });
      continue;
    }

    const evidence =
      ((raw.reviewChain as readonly unknown[] | undefined) ??
        (raw.recoveredEvidence as readonly unknown[] | undefined)) ??
      [];

    manifests.push({
      id: String(raw.candidateId),
      questionId: String(raw.questionId),
      contentHash: String(raw.contentHash),
      /* Manifests record revision 0 for a first publication; the runtime model
         is 1-based and monotonic (spec §9.2), so the floor is applied once,
         here, rather than in three call sites. */
      revision: Math.max(1, Number(raw.revision ?? 0)),
      blueprintId: raw.blueprintId ? String(raw.blueprintId) : null,
      batchId: raw.batchId ? String(raw.batchId) : null,
      generatorAdapter: raw.generatorAdapter ?? null,
      originalityFingerprint: raw.originalityFingerprint
        ? String(raw.originalityFingerprint)
        : null,
      difficultyFingerprint: raw.difficultyFingerprint ? String(raw.difficultyFingerprint) : null,
      manifestFingerprint: raw.manifestFingerprint ? String(raw.manifestFingerprint) : null,
      manifestSchemaVersion: manifestSchemaVersionOf(raw),
      ...(raw.correctnessBasis
        ? { correctnessBasis: raw.correctnessBasis as CorrectnessBasis }
        : {}),
      reviewEvidence: evidence,
      reviewEvidenceKind: evidenceKindOf(
        raw as { reviewChain?: readonly unknown[]; recoveredEvidence?: readonly unknown[] },
      ),
      publishedAt: String(raw.publishedAt),
    });
  }

  return { manifests, rejected };
}
