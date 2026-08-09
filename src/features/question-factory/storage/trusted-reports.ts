import { isValidGovernedWriteCapability, type GovernedWriteCapability } from "./governed-write-capability";

/**
 * Mission 3D governed-authority remediation. The two report id families
 * that must never be persisted through generic repository writes —
 * `cva-*` (correctness-pass attestations) and `sr-*` (semantic-completion
 * evidence). `FsFactoryRepository.create()` refuses any write under
 * either family in **every** compartment (not only `reports`) unless
 * presented with a valid `GovernedWriteCapability` for that exact family
 * (see `governed-write-capability.ts`); the only code that ever holds one
 * is the dedicated governed evidence writer constructed inside
 * `correctness/orchestrate-correctness-verification.ts` and
 * `review/orchestrate-semantic-review.ts` themselves.
 *
 * Mission 3D governed-authority hardening (starting SHA `adce3f7`): the
 * capability gate on `create()` alone left three residual bypasses —
 * (D1) mint the id in a non-`reports` compartment (uncontested, since the
 * old check was scoped to `compartment === "reports"`) then `move()` it
 * into `reports`, where `move()` itself never checked reserved ids at
 * all; (D2) `update()` a *legitimate, already-minted* trusted record in
 * place with a hand-recomputed, internally-consistent fingerprint,
 * tampering it with no capability check whatsoever; (D3) `remove()` a
 * legitimate trusted record outright, with no check at all. This module's
 * `assertGenericOperationAllowed` is the single policy every one of
 * `FsFactoryRepository`'s four mutating operations now consults, closing
 * all three: trusted ids are reserved in every compartment for `create`,
 * immovable in every direction for `move`, unconditionally un-updatable
 * for `update` (no capability is ever accepted — the governed writers
 * only ever call `create()`), and unconditionally un-removable for
 * `remove` (which throws `TrustedFamilyReservedError` rather than
 * returning a result, since `remove()` has no failure-result shape).
 */
export const TRUSTED_REPORT_FAMILIES = ["cva-", "sr-"] as const;
export type TrustedReportFamily = (typeof TRUSTED_REPORT_FAMILIES)[number];

export function isTrustedReportId(id: string): boolean {
  return TRUSTED_REPORT_FAMILIES.some((prefix) => id.startsWith(prefix));
}

export function trustedReportFamilyOf(id: string): TrustedReportFamily | undefined {
  return TRUSTED_REPORT_FAMILIES.find((prefix) => id.startsWith(prefix));
}

export type GuardedRepositoryOperation = "create" | "move" | "update" | "remove";

/**
 * Thrown by `FsFactoryRepository.remove()` when asked to remove a
 * trusted-family id — `remove()` returns `Promise<void>`, so unlike
 * `create`/`move`/`update` (which encode refusal in their result unions)
 * it has no result shape to carry a `reason`, and a silent no-op would be
 * indistinguishable from "nothing to remove". A typed, named error makes
 * the refusal unambiguous and lets callers/tests assert on it precisely.
 */
export class TrustedFamilyReservedError extends Error {
  constructor(
    readonly candidateId: string,
    readonly family: TrustedReportFamily,
    readonly operation: GuardedRepositoryOperation,
  ) {
    super(
      `'${candidateId}' belongs to the reserved trusted-evidence family '${family}' and cannot be ${operation}d through any generic repository call — trusted evidence is append-only and immutable once minted by its governed writer.`,
    );
    this.name = "TrustedFamilyReservedError";
  }
}

export type GenericOperationCheck =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly family: TrustedReportFamily; readonly message: string };

function refusalMessage(
  operation: GuardedRepositoryOperation,
  candidateId: string,
  family: TrustedReportFamily,
): string {
  if (operation === "create") {
    return `Report id '${candidateId}' belongs to a reserved trusted-evidence family ('${family}') and can only be created through the governed evidence writer for that family, never generic repository.create() — this applies in every compartment, not only 'reports'.`;
  }
  if (operation === "move") {
    return `Candidate '${candidateId}' belongs to the reserved trusted-evidence family '${family}' and is immovable — trusted evidence can never be relocated between compartments through generic repository.move(), regardless of direction.`;
  }
  return `Candidate '${candidateId}' belongs to the reserved trusted-evidence family '${family}' and cannot be updated through generic repository.update() — trusted evidence is append-only; no caller, including the governed writers themselves, may rewrite an already-minted record.`;
}

/**
 * Central trusted-family policy consulted by every `FactoryRepository`
 * mutating operation. `cva-*`/`sr-*` ids are reserved outright, in every
 * compartment: `create` accepts them only alongside a valid, matching
 * `GovernedWriteCapability` — the sole exception, held only by the two
 * governed writers — while `move` and `update` never accept any
 * capability at all and refuse unconditionally, because the two governed
 * writers only ever call `create()`: a trusted record, once created, is
 * append-only and immovable through every other generic operation. Not
 * itself called for `remove` (which has no capability parameter and no
 * result shape to return a refusal in) — `remove()` calls this with
 * `operation: "remove"` purely to reuse the same family lookup, then
 * always throws `TrustedFamilyReservedError` on `allowed: false`.
 */
export function assertGenericOperationAllowed(
  operation: GuardedRepositoryOperation,
  candidateId: string,
  capability?: GovernedWriteCapability,
): GenericOperationCheck {
  const family = trustedReportFamilyOf(candidateId);
  if (family === undefined) return { allowed: true };

  if (operation === "create" && isValidGovernedWriteCapability(capability, family)) {
    return { allowed: true };
  }

  return { allowed: false, family, message: refusalMessage(operation, candidateId, family) };
}
