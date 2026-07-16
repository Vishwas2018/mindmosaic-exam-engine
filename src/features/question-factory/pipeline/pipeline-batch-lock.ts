import { randomUUID } from "node:crypto";
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { FACTORY_LIMITS } from "../config";

const PIPELINE_LOCKS_DIR = ".pipeline-locks";
const DEFAULT_LOCK_RETRY_DELAY_MS = 20;
const DEFAULT_LOCK_MAX_WAIT_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isEexist(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: unknown }).code === "EEXIST";
}

/** The `.pipeline-locks/<batchId>.lock` file's JSON content — richer than `FsFactoryRepository`'s bare candidate-lock `LockPayload`, specifically so a stale-lock diagnostic has real holder/timestamp data to report. */
export interface PipelineBatchLockRecord {
  readonly batchId: string;
  readonly pipelineRunId: string;
  /** `hashJson({batchId, candidateIds})` — pins exactly which candidate set this lock covers. */
  readonly batchFingerprint: string;
  /** `randomUUID()`, mirrors `FsFactoryRepository`'s `LockPayload.token` — only the presenting owner may release. */
  readonly ownerToken: string;
  /** `process.pid` — diagnostic only, never used to infer liveness (a PID can be reused by an unrelated process). */
  readonly ownerPid: number;
  readonly acquiredAt: string;
  readonly candidateIds: readonly string[];
}

export interface PipelineBatchLockHandle {
  readonly ownerToken: string;
}

export interface PipelineBatchLockAmbiguousDiagnostic {
  readonly issueCode: "pipeline_batch_lock_held_ambiguous";
  readonly batchId: string;
  readonly holder: {
    readonly pipelineRunId: string;
    readonly ownerPid: number;
    readonly acquiredAt: string;
    readonly ageMs: number;
    readonly candidateIds: readonly string[];
  };
  readonly message: string;
}

export type AcquireBatchLockResult =
  | { readonly ok: true; readonly handle: PipelineBatchLockHandle }
  | { readonly ok: false; readonly issueCode: "pipeline_batch_lock_held"; readonly message: string }
  | ({ readonly ok: false } & PipelineBatchLockAmbiguousDiagnostic);

export interface AcquireBatchLockOptions {
  readonly lockMaxWaitMs?: number;
  readonly lockRetryDelayMs?: number;
  readonly staleAgeMs?: number;
}

function lockPath(lockRoot: string, batchId: string): string {
  return path.join(lockRoot, PIPELINE_LOCKS_DIR, `${batchId}.lock`);
}

/**
 * Documented manual filesystem recovery procedure (Mission 3C plan §8) —
 * embedded verbatim in every ambiguous-lock diagnostic message so an
 * operator never has to look it up separately.
 */
function manualRecoveryMessage(batchId: string): string {
  return (
    `Manual recovery procedure: (1) confirm no questions:pipeline process for batch '${batchId}' is actually still running ` +
    "(the recorded ownerPid is informational only — never treat 'not found' as proof of death, or 'found' as proof of life for a different machine/container); " +
    `(2) if genuinely abandoned, manually delete the lock file at '.pipeline-locks/${batchId}.lock' under the workspace root; ` +
    "(3) re-invoke questions:pipeline — a fresh acquisition then succeeds normally; " +
    "(4) if uncertain, do not delete the lock file — treat it as an operational incident and wait, or contact whoever owns the invocation recorded above. " +
    "A future questions:pipeline --release-abandoned-lock command (requiring an explicit --confirm flag) is deferred to Mission 3E's reconciliation tooling, not built here."
  );
}

async function classifyHeldLock(filePath: string, batchId: string, staleAgeMs: number): Promise<AcquireBatchLockResult> {
  let raw: string | undefined;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    raw = undefined;
  }

  if (raw === undefined) {
    // Released between the failed open attempt and this read — ordinary
    // contention, the caller can simply retry the whole acquisition.
    return {
      ok: false,
      issueCode: "pipeline_batch_lock_held",
      message: `Batch '${batchId}' lock could not be acquired within the configured wait — it was released mid-read; retry the acquisition.`,
    };
  }

  let record: Partial<PipelineBatchLockRecord> | undefined;
  try {
    record = JSON.parse(raw) as Partial<PipelineBatchLockRecord>;
  } catch {
    record = undefined;
  }

  if (record === undefined || typeof record.acquiredAt !== "string") {
    // Malformed lock content — fail closed rather than guessing its age
    // or owner; never treated as absent, never overwritten.
    return {
      ok: false,
      issueCode: "pipeline_batch_lock_held_ambiguous",
      batchId,
      holder: {
        pipelineRunId: record?.pipelineRunId ?? "unknown",
        ownerPid: record?.ownerPid ?? -1,
        acquiredAt: record?.acquiredAt ?? "unknown",
        ageMs: -1,
        candidateIds: record?.candidateIds ?? [],
      },
      message: `Lock file for batch '${batchId}' is malformed and cannot be classified — treated as ambiguous, never auto-resolved. ${manualRecoveryMessage(batchId)}`,
    };
  }

  const ageMs = Date.now() - Date.parse(record.acquiredAt);
  const ambiguous = Number.isNaN(ageMs) || ageMs >= staleAgeMs;
  if (ambiguous) {
    return {
      ok: false,
      issueCode: "pipeline_batch_lock_held_ambiguous",
      batchId,
      holder: {
        pipelineRunId: record.pipelineRunId ?? "unknown",
        ownerPid: record.ownerPid ?? -1,
        acquiredAt: record.acquiredAt,
        ageMs: Number.isNaN(ageMs) ? -1 : ageMs,
        candidateIds: record.candidateIds ?? [],
      },
      message: `Batch '${batchId}' lock is held and its age (${Number.isNaN(ageMs) ? "unknown" : `${ageMs}ms`}) exceeds the staleness threshold — possibly abandoned, but never auto-released. ${manualRecoveryMessage(batchId)}`,
    };
  }

  return {
    ok: false,
    issueCode: "pipeline_batch_lock_held",
    message: `Batch '${batchId}' lock is actively held by pipeline run '${record.pipelineRunId ?? "unknown"}' (age ${ageMs}ms) — retry shortly.`,
  };
}

/**
 * Standalone, narrow batch lock for the pipeline runner — deliberately
 * NOT part of `FactoryRepository` (extending that interface would ripple
 * through every implementer/test-mock of it for a capability only the
 * pipeline runner needs). Reuses the exact `fs.open(path, "wx")`
 * (`O_CREAT | O_EXCL`) atomic primitive `FsFactoryRepository`'s own
 * `.locks/` already uses, so the atomicity guarantee is identical and
 * independently already proven.
 *
 * Never auto-steals a lock: acquisition either succeeds cleanly or fails
 * closed with one of two typed refusals — there is no third path, and
 * neither refusal ever deletes, overwrites, or reassigns the existing
 * lock file. `staleAgeMs` (default `FACTORY_LIMITS.PIPELINE_LOCK_STALE_AGE_MS`)
 * selects which refusal to return, never a trigger for deletion.
 */
export async function acquireBatchLock(
  lockRoot: string,
  batchId: string,
  pipelineRunId: string,
  batchFingerprint: string,
  candidateIds: readonly string[],
  options: AcquireBatchLockOptions = {},
): Promise<AcquireBatchLockResult> {
  const maxWaitMs = options.lockMaxWaitMs ?? DEFAULT_LOCK_MAX_WAIT_MS;
  const retryDelayMs = options.lockRetryDelayMs ?? DEFAULT_LOCK_RETRY_DELAY_MS;
  const staleAgeMs = options.staleAgeMs ?? FACTORY_LIMITS.PIPELINE_LOCK_STALE_AGE_MS;
  const filePath = lockPath(lockRoot, batchId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const deadline = Date.now() + maxWaitMs;
  const ownerToken = randomUUID();

  for (;;) {
    try {
      const handle = await fs.open(filePath, "wx");
      try {
        const record: PipelineBatchLockRecord = {
          batchId,
          pipelineRunId,
          batchFingerprint,
          ownerToken,
          ownerPid: process.pid,
          acquiredAt: new Date().toISOString(),
          candidateIds,
        };
        await handle.writeFile(JSON.stringify(record, null, 2), "utf8");
      } finally {
        await handle.close();
      }
      return { ok: true, handle: { ownerToken } };
    } catch (error) {
      if (!isEexist(error)) throw error;

      if (Date.now() >= deadline) {
        return classifyHeldLock(filePath, batchId, staleAgeMs);
      }
      await sleep(retryDelayMs);
    }
  }
}

/** Releases the lock only if it is still held under `ownerToken` — the exact token minted for this acquisition. Never removes a lock it does not own (mirrors `FsFactoryRepository`'s `releaseLock`). */
export async function releaseBatchLock(lockRoot: string, batchId: string, ownerToken: string): Promise<void> {
  const filePath = lockPath(lockRoot, batchId);
  let raw: string | undefined;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch {
    return;
  }

  let record: Partial<PipelineBatchLockRecord>;
  try {
    record = JSON.parse(raw) as Partial<PipelineBatchLockRecord>;
  } catch {
    return;
  }
  if (record.ownerToken !== ownerToken) return;

  await fs.rm(filePath, { force: true });
}
