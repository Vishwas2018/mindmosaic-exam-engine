import type { FactoryCompartment } from "./compartments";
import type { GovernedWriteCapability } from "./governed-write-capability";

export type CreateFailureReason = "duplicate_candidate" | "trusted_family_reserved";
export type MoveFailureReason =
  | "source_missing"
  | "state_metadata_mismatch"
  | "destination_exists"
  | "lock_timeout"
  | "trusted_family_reserved";
export type UpdateFailureReason = "source_missing" | "state_mismatch" | "lock_timeout" | "trusted_family_reserved";

export type CreateResult =
  | { readonly ok: true; readonly candidateId: string; readonly compartment: FactoryCompartment }
  | {
      readonly ok: false;
      readonly candidateId: string;
      readonly compartment: FactoryCompartment;
      readonly reason: CreateFailureReason;
      readonly message: string;
    };

export type MoveResult =
  | {
      readonly ok: true;
      readonly candidateId: string;
      readonly from: FactoryCompartment;
      readonly to: FactoryCompartment;
      /** True when the move had already completed and this call was a no-op replay. */
      readonly replayed: boolean;
    }
  | {
      readonly ok: false;
      readonly candidateId: string;
      readonly from: FactoryCompartment;
      readonly to: FactoryCompartment;
      readonly reason: MoveFailureReason;
      readonly message: string;
    };

export type ReconciliationAction =
  | "completed_interrupted_move"
  | "rolled_back_interrupted_move"
  | "removed_stale_marker";

export interface ReconciliationEntry {
  readonly candidateId: string;
  readonly action: ReconciliationAction;
  readonly from: FactoryCompartment;
  readonly to: FactoryCompartment;
}

export interface ReconciliationReport {
  readonly entries: readonly ReconciliationEntry[];
  readonly generatedAt: string;
}

export type UpdateResult =
  | {
      readonly ok: true;
      readonly candidateId: string;
      readonly compartment: FactoryCompartment;
      /** True when the stored record already exactly matched the requested data and nothing was rewritten. */
      readonly replayed: boolean;
    }
  | {
      readonly ok: false;
      readonly candidateId: string;
      readonly compartment: FactoryCompartment;
      readonly reason: UpdateFailureReason;
      readonly message: string;
    };

export interface UpdateOptions {
  /**
   * A content hash (see `hashJson`) of the record as the caller last read
   * it. If supplied and the currently stored record's content hash
   * matches neither this value nor the requested `data`, the write is
   * refused as a conflict rather than silently overwriting a record that
   * changed out from under the caller.
   */
  readonly expectedContentHash?: string;
}

/**
 * Storage abstraction over the factory content workspace. One canonical
 * location per candidate at a time; `move` is a single logical
 * transaction (validate expected current state -> write destination
 * atomically -> update metadata -> remove source only after the
 * destination is durable). Designed so a database-backed implementation
 * can satisfy the same interface later without touching callers.
 */
export interface FactoryRepository {
  /**
   * Creates a brand-new candidate record. Fails if the id is already known
   * anywhere in the workspace.
   *
   * Mission 3D governed-authority remediation: unconditionally refuses a
   * write under a reserved trusted-report id (`cva-*`, `sr-*` — see
   * `trusted-reports.ts`) unless `trustedWriteCapability` is a valid,
   * matching `GovernedWriteCapability` (see `governed-write-capability.ts`).
   * Every ordinary caller — every gate other than correctness/semantic
   * review, every test fixture, every CLI script — omits this parameter
   * and is refused for those two families, regardless of what `data` it
   * supplies. This is an application-level boundary, not a cryptographic
   * one; see the governed-authority remediation report's threat-model
   * section.
   *
   * Mission 3D governed-authority hardening: the reservation applies in
   * **every** compartment, not only `reports` — a reserved id can no
   * longer be minted in, say, `generated` and then relocated into
   * `reports` via `move()` (which independently refuses it too; see
   * below), closing that two-step bypass entirely.
   */
  create(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
    trustedWriteCapability?: GovernedWriteCapability,
  ): Promise<CreateResult>;

  read(compartment: FactoryCompartment, candidateId: string): Promise<unknown | undefined>;

  exists(compartment: FactoryCompartment, candidateId: string): Promise<boolean>;

  /**
   * Low-level removal, primarily for reconciliation and test cleanup - not
   * the normal lifecycle path.
   *
   * Mission 3D governed-authority hardening: unconditionally throws
   * `TrustedFamilyReservedError` (see `trusted-reports.ts`) for a
   * reserved trusted-report id (`cva-*`, `sr-*`) — no capability can ever
   * authorise removing trusted evidence once minted; this is not a
   * `CreateResult`-shaped refusal because `remove()` has no result union
   * to encode one in.
   */
  remove(compartment: FactoryCompartment, candidateId: string): Promise<void>;

  list(compartment: FactoryCompartment): Promise<readonly string[]>;

  /**
   * Atomically moves a candidate from one compartment to another.
   * Idempotent: calling it again after a successful move with the same
   * arguments returns `{ ok: true, replayed: true }` rather than erroring
   * or duplicating data. Serialised per candidate: two concurrent calls
   * for the same `candidateId` never both observe the pre-move state and
   * race to write — one proceeds, the other waits and then re-reads,
   * resolving to a legitimate replay or a deterministic conflict. If the
   * lock cannot be acquired within the configured timeout, fails with
   * `reason: "lock_timeout"` rather than hanging indefinitely.
   *
   * Mission 3D governed-authority hardening: a reserved trusted-report id
   * (`cva-*`, `sr-*` — see `trusted-reports.ts`) is immovable — refused
   * with `reason: "trusted_family_reserved"` regardless of `from`/`to`,
   * closing the "create it somewhere other than `reports`, then move it
   * in" bypass that a `create()`-only capability gate left open.
   */
  move(
    candidateId: string,
    from: FactoryCompartment,
    to: FactoryCompartment,
  ): Promise<MoveResult>;

  /**
   * Atomically rewrites a candidate's record in place, in the compartment
   * it already lives in — for a lifecycle transition whose destination
   * compartment is unchanged (multiple `CandidateState` values can map to
   * the same physical compartment) but whose logical state genuinely
   * changed, so relying on `move()` alone (which requires `from !== to`)
   * would silently skip persisting it. Idempotent: if the stored record
   * already exactly matches `data`, returns `{ ok: true, replayed: true }`
   * without rewriting anything, so a retry after a crash between the
   * write and its caller observing success is always safe. Serialised per
   * candidate on the same terms as `move()` — see above — so two
   * concurrent updates against the same expected content hash never both
   * pass the check and overwrite each other; exactly one wins, and the
   * other observes the winner's content and fails as a genuine conflict.
   *
   * Mission 3D governed-authority hardening: a reserved trusted-report id
   * (`cva-*`, `sr-*` — see `trusted-reports.ts`) is unconditionally
   * refused with `reason: "trusted_family_reserved"`, in every
   * compartment — no capability parameter is accepted here at all,
   * because the governed writers only ever call `create()`; a trusted
   * record, once created, is append-only and can never be rewritten in
   * place by anyone, closing the "tamper an existing attestation with a
   * hand-recomputed fingerprint" bypass.
   */
  update(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
    options?: UpdateOptions,
  ): Promise<UpdateResult>;

  /**
   * Scans for incomplete-transaction markers left by a crash mid-move and
   * safely resolves each one: if the destination write had already
   * durably completed, finishes the move (removes the stale source
   * copy); otherwise rolls back (the source was never touched, so this
   * just clears the marker and any partial temp file). Never leaves a
   * candidate in two compartments.
   */
  reconcile(): Promise<ReconciliationReport>;
}
