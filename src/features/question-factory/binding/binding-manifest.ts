import { z } from "zod";

import { FACTORY_LIMITS } from "../config";
import { factoryIdentifierSchema } from "../shared/identifiers";

/**
 * Versioned schema for the per-candidate blueprint-binding manifest — the
 * reviewed governance artefact that tells `questions:ingest` which real
 * blueprint each approved candidate binds to. Bump `BINDING_MANIFEST_VERSION`
 * whenever the manifest's meaning changes shape; a manifest declaring any
 * other version is rejected outright in preflight (never best-effort
 * interpreted).
 */
export const BINDING_MANIFEST_VERSION = "1" as const;

/** Bump when generation's derivation rules change, so evidence records which rule set authored a given artefact pair. */
export const BINDING_GENERATOR_VERSION = "pb2-binding-generator-1" as const;

const sha256HexSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-f]{64}$/, "Expected a lower-case 64-hex-digit SHA-256.");

/**
 * `candidateKey` is the candidate's *in-file* id (e.g. `pb2-g3-icas-math-001`)
 * — the stable, human-auditable identity the approved packs carry. The
 * ingestion adapter reads it for binding lookup *before* discarding it in
 * favour of the minted `man-…` candidate id, so the manifest never has to
 * predict minted ids.
 */
export const bindingEntrySchema = z.object({
  candidateKey: z.string().trim().min(1).max(FACTORY_LIMITS.IDENTIFIER_MAX_LENGTH),
  canonicalTuple: z.string().trim().min(1).max(400),
  blueprintId: factoryIdentifierSchema,
  blueprintHash: sha256HexSchema,
});

export const bindingPackSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine((name) => name.endsWith(".json") && !name.includes("/") && !name.includes("\\"), {
      message: "Pack file name must be a direct-child .json name.",
    }),
  sha256: sha256HexSchema,
  candidateCount: z.number().int().positive(),
});

export const bindingManifestSchema = z.object({
  manifestVersion: z.literal(BINDING_MANIFEST_VERSION),
  generatorVersion: z.string().trim().min(1).max(120),
  batchId: factoryIdentifierSchema,
  /** The approved frozen artefact-set fingerprint this manifest was generated against — recorded for the audit chain and echoed into run evidence. */
  frozenFingerprint: sha256HexSchema,
  /** Exactly the compatible packs this manifest covers; preflight verifies staged bytes against these hashes (membership + integrity). */
  packs: z.array(bindingPackSchema).min(1).max(FACTORY_LIMITS.MAX_INBOX_FILES_PER_SCAN),
  bindings: z.array(bindingEntrySchema).min(1),
  generatedAt: z.iso.datetime(),
});

export type BindingManifest = z.infer<typeof bindingManifestSchema>;
export type BindingEntry = z.infer<typeof bindingEntrySchema>;

export type BindingManifestParseOutcome =
  | { readonly ok: true; readonly manifest: BindingManifest }
  | { readonly ok: false; readonly message: string };

/** Parses raw JSON text into a validated manifest — the only entry point CLIs use, so schema enforcement can never be skipped. */
export function parseBindingManifest(raw: string): BindingManifestParseOutcome {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, message: `Binding manifest is not valid JSON: ${message}` };
  }
  const result = bindingManifestSchema.safeParse(parsed);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    return { ok: false, message: `Binding manifest failed schema validation: ${detail}` };
  }
  return { ok: true, manifest: result.data };
}
