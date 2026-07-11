import type { FactoryCompartment } from "./compartments";

export type CreateFailureReason = "duplicate_candidate";
export type MoveFailureReason =
  | "source_missing"
  | "state_metadata_mismatch"
  | "destination_exists";

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

  exists(compartment: FactoryCompartment, candidateId: string): Promise<boolean>;

  /** Low-level removal, primarily for reconciliation and test cleanup - not the normal lifecycle path. */
  remove(compartment: FactoryCompartment, candidateId: string): Promise<void>;

  list(compartment: FactoryCompartment): Promise<readonly string[]>;

  /**
   * Atomically moves a candidate from one compartment to another.
   * Idempotent: calling it again after a successful move with the same
   * arguments returns `{ ok: true, replayed: true }` rather than erroring
   * or duplicating data.
   */
  move(
    candidateId: string,
    from: FactoryCompartment,
    to: FactoryCompartment,
  ): Promise<MoveResult>;

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
