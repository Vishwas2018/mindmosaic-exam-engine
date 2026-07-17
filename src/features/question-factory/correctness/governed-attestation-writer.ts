/**
 * Mission 3D governed-authority remediation. The sole production path able
 * to persist a `cva-*` correctness-pass attestation. Deliberately not
 * exported from `correctness/index.ts` (this codebase's public barrel for
 * this feature) — imported only by `orchestrate-correctness-verification.ts`,
 * in the same directory, the one governed composition root entitled to
 * mint correctness-pass evidence.
 *
 * Mints its own `GovernedWriteCapability` for the `cva-` family at the
 * point of use (see `storage/governed-write-capability.ts`) and presents
 * it to `repository.create()`, which refuses the write outright for any
 * caller that omits it (`storage/fs-factory-repository.ts`). Retains the
 * same append-only, fingerprint-based replay discipline every other
 * evidence write in this codebase already follows: a matching
 * `attestationFingerprint` on an already-existing record is a safe no-op
 * replay; a differing one is a genuine, refused conflict.
 */
import { GovernedWriteCapability } from "../storage/governed-write-capability";
import type { FactoryRepository } from "../storage";
import { buildCorrectnessAttestation, buildCorrectnessAttestationId, type CorrectnessAttestationInput, type CorrectnessPassAttestation } from "./attestation";

const CORRECTNESS_ATTESTATION_FAMILY = "cva-" as const;

export type WriteCorrectnessAttestationOutcome =
  | { readonly ok: true; readonly alreadyPresent: boolean }
  | { readonly ok: false; readonly message: string };

export async function writeCorrectnessAttestation(
  repository: FactoryRepository,
  input: CorrectnessAttestationInput,
): Promise<WriteCorrectnessAttestationOutcome> {
  const attestation = buildCorrectnessAttestation(input);
  const reportId = buildCorrectnessAttestationId(input.candidateId);

  const existing = (await repository.read("reports", reportId)) as CorrectnessPassAttestation | undefined;
  if (existing !== undefined) {
    if (existing.attestationFingerprint === attestation.attestationFingerprint) {
      return { ok: true, alreadyPresent: true };
    }
    return {
      ok: false,
      message: `A different correctness-pass attestation already exists for candidate '${attestation.candidateId}' — its attestation fingerprint no longer matches, indicating a genuine conflict rather than a safe retry.`,
    };
  }

  const capability = GovernedWriteCapability.issue(CORRECTNESS_ATTESTATION_FAMILY);
  const createResult = await repository.create("reports", reportId, attestation, capability);
  if (!createResult.ok) return { ok: false, message: createResult.message };
  return { ok: true, alreadyPresent: false };
}
