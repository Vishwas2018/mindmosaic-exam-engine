import type { IngestionIssueCode, ManualIngestionSource, NormalisedIdentity } from "../config";
import type { CandidateProvenance } from "../provenance";

/**
 * Batch-level metadata for one `questions:ingest` invocation — applies
 * uniformly to every file the scan processes in this run (the CLI's
 * `--source`/`--batch-id`/`--prompt-version`/`--prompt-hash`/`--model`
 * flags, §6/§9 of the mission brief). Mission 3A does not support a
 * `parentCandidateId` input: the revision workflow (§10) is explicitly out
 * of scope, so every ingested candidate is a first ingestion (`revision: 0`).
 */
export interface ManualIngestionRunRequest {
  readonly source: ManualIngestionSource;
  /** Required when `source === "other"`; optional override for the other three (defaults to the source's own canonical alias). */
  readonly model?: string;
  readonly batchId: string;
  readonly promptVersion: string;
  readonly promptHash?: string;
  readonly blueprintId?: string;
  readonly pipelineRunId: string;
  readonly dryRun?: boolean;
  /** Overrides the config-default inbox root — primarily for tests. */
  readonly inboxRoot?: string;
}

export interface ManualIngestionProvenance {
  readonly source: ManualIngestionSource;
  readonly declaredIdentity: NormalisedIdentity;
  readonly sourceFileName: string;
  readonly sourcePath: string;
  readonly sourceContentHash: string;
  readonly indexInFile: number;
  readonly adapterVersion: string;
  readonly ingestedAt: string;
}

export interface ManualIngestedCandidateRecord {
  readonly candidateId: string;
  readonly state: "generated";
  /** Raw, not deeply validated — structural validation (Mission 2B) is the first gate that establishes trust in its shape. */
  readonly question: unknown;
  readonly provenance: CandidateProvenance;
  readonly ingestion: ManualIngestionProvenance;
}

export type ManualCandidateIngestionResult =
  | {
      readonly status: "accepted";
      readonly indexInFile: number;
      readonly candidate: ManualIngestedCandidateRecord;
      /** True only when this call actually wrote a new record (never true for `dryRun`). */
      readonly written: boolean;
      /** True when an identical candidate already existed and this call was a no-op replay. */
      readonly replay: boolean;
    }
  | {
      readonly status: "rejected";
      readonly indexInFile: number;
      readonly issueCode: IngestionIssueCode;
      readonly message: string;
    };

export interface InboxFileIngestionResult {
  readonly fileName: string;
  readonly outcome: "processed" | "quarantined";
  readonly candidateResults: readonly ManualCandidateIngestionResult[];
  readonly quarantineIssueCode?: IngestionIssueCode;
  readonly quarantineMessage?: string;
  /** True when this file's `.processing` marker was found already claimed at the start of this run (crash recovery). */
  readonly recovered: boolean;
}

export interface ManualIngestionRunResult {
  readonly batchId: string;
  readonly dryRun: boolean;
  readonly filesScanned: number;
  readonly filesProcessed: number;
  readonly filesQuarantined: number;
  readonly candidatesCreated: number;
  readonly candidatesReplayed: number;
  readonly candidatesRejected: number;
  readonly fileResults: readonly InboxFileIngestionResult[];
}

export type ManualIngestionRunOutcome =
  | { readonly status: "completed"; readonly result: ManualIngestionRunResult }
  | { readonly status: "request_invalid"; readonly issueCode: IngestionIssueCode; readonly message: string }
  | { readonly status: "lock_timeout"; readonly message: string };
