import type { FactoryCompartment } from "./compartments";

export type CreateFailureReason = "duplicate_candidate";
export type MoveFailureReason =
  | "source_missing"
  | "state_metadata_mismatch"
  | "destination_exists"
  | "lock_timeout";
export type UpdateFailureReason = "source_missing" | "state_mismatch" | "lock_timeout";

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
 * Outcome of a strictly non-mutating record inspection (`inspectRecord`).
 * Unlike `read()`, a malformed stored record is *reported*, never
 * repaired: no quarantine move, no report file, no metadata write.
 */
export type RecordInspection =
  | { readonly status: "present"; readonly record: unknown }
  | { readonly status: "absent" }
  | { readonly status: "malformed"; readonly message: string };

/**
 * Storage abstraction over the factory content workspace. One canonical
 * location per candidate at a time; `move` is a single logical
 * transaction (validate expected current state -> write destination
 * atomically -> update metadata -> remove source only after the
 * destination is durable). Designed so a database-backed implementation
 * can satisfy the same interface later without touching callers.
 */
export interface FactoryRepository {
  /** Creates a brand-new candidate record. Fails if the id is already known anywhere in the workspace. */
  create(
    compartment: FactoryCompartment,
    candidateId: string,
    data: unknown,
  ): Promise<CreateResult>;

  read(compartment: FactoryCompartment, candidateId: string): Promise<unknown | undefined>;

  /**
   * Strictly read-only variant of `read()` for inspection contexts
   * (preflight, audits) that must leave the workspace byte-identical:
   * reads and decodes the stored record with **no side effects of any
   * kind** — no quarantine, no rename, no delete, no mkdir, no report or
   * metadata write, no lifecycle mutation. Malformed content is returned
   * as a deterministic `{ status: "malformed" }` result instead of being
   * repaired. Optional so existing in-memory test doubles (which have no
   * repair behaviour to suppress) remain valid implementations; callers
   * needing the guarantee fall back to `read()` only for such doubles.
   */
  inspectRecord?(compartment: FactoryCompartment, candidateId: string): Promise<RecordInspection>;

  exists(compartment: FactoryCompartment, candidateId: string): Promise<boolean>;

  /** Low-level removal, primarily for reconciliation and test cleanup - not the normal lifecycle path. */
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
