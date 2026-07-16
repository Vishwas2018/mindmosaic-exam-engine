import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { acquireBatchLock, releaseBatchLock, type PipelineBatchLockRecord } from "@/features/question-factory/pipeline";

vi.setConfig({ testTimeout: 30_000 });

let rootDir: string;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "pipeline-batch-lock-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

function lockPath(batchId: string): string {
  return path.join(rootDir, ".pipeline-locks", `${batchId}.lock`);
}

describe("acquireBatchLock / releaseBatchLock", () => {
  it("acquires atomically and writes the full lock record", async () => {
    const result = await acquireBatchLock(rootDir, "batch-a", "run-1", "fingerprint-1", ["c1", "c2"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const raw = await readFile(lockPath("batch-a"), "utf8");
    const record = JSON.parse(raw) as PipelineBatchLockRecord;
    expect(record.batchId).toBe("batch-a");
    expect(record.pipelineRunId).toBe("run-1");
    expect(record.batchFingerprint).toBe("fingerprint-1");
    expect(record.candidateIds).toEqual(["c1", "c2"]);
    expect(record.ownerToken).toBe(result.handle.ownerToken);
    expect(typeof record.ownerPid).toBe("number");
    expect(typeof record.acquiredAt).toBe("string");
  });

  it("a young held lock returns pipeline_batch_lock_held and never deletes or modifies the file", async () => {
    await mkdir(path.dirname(lockPath("batch-b")), { recursive: true });
    const holderRecord: PipelineBatchLockRecord = {
      batchId: "batch-b",
      pipelineRunId: "run-holder",
      batchFingerprint: "fp",
      ownerToken: "holder-token",
      ownerPid: 12345,
      acquiredAt: new Date().toISOString(),
      candidateIds: ["c1"],
    };
    await writeFile(lockPath("batch-b"), JSON.stringify(holderRecord, null, 2), "utf8");
    const before = await readFile(lockPath("batch-b"), "utf8");

    const result = await acquireBatchLock(rootDir, "batch-b", "run-contender", "fp", ["c1"], { lockMaxWaitMs: 50, lockRetryDelayMs: 10 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issueCode).toBe("pipeline_batch_lock_held");

    const after = await readFile(lockPath("batch-b"), "utf8");
    expect(after).toBe(before);
  });

  it("an aged held lock returns pipeline_batch_lock_held_ambiguous with real holder/timestamp/age data, never deletes or modifies the file", async () => {
    const oldAcquiredAt = new Date(Date.now() - 1_000_000).toISOString();
    await mkdir(path.dirname(lockPath("batch-c")), { recursive: true });
    const holderRecord: PipelineBatchLockRecord = {
      batchId: "batch-c",
      pipelineRunId: "run-abandoned",
      batchFingerprint: "fp",
      ownerToken: "abandoned-token",
      ownerPid: 99999,
      acquiredAt: oldAcquiredAt,
      candidateIds: ["c1", "c2", "c3"],
    };
    await writeFile(lockPath("batch-c"), JSON.stringify(holderRecord, null, 2), "utf8");
    const before = await readFile(lockPath("batch-c"), "utf8");

    const result = await acquireBatchLock(rootDir, "batch-c", "run-contender", "fp", ["c1"], {
      lockMaxWaitMs: 50,
      lockRetryDelayMs: 10,
      staleAgeMs: 1_000,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    if (result.issueCode !== "pipeline_batch_lock_held_ambiguous") throw new Error(`Expected pipeline_batch_lock_held_ambiguous, got '${result.issueCode}'`);
    expect(result.batchId).toBe("batch-c");
    expect(result.holder.pipelineRunId).toBe("run-abandoned");
    expect(result.holder.ownerPid).toBe(99999);
    expect(result.holder.acquiredAt).toBe(oldAcquiredAt);
    expect(result.holder.ageMs).toBeGreaterThanOrEqual(1_000);
    expect(result.holder.candidateIds).toEqual(["c1", "c2", "c3"]);
    expect(result.message).toMatch(/Manual recovery procedure/);

    const after = await readFile(lockPath("batch-c"), "utf8");
    expect(after).toBe(before);
  });

  it("a malformed lock file is classified as ambiguous, never deleted, never treated as absent", async () => {
    await mkdir(path.dirname(lockPath("batch-d")), { recursive: true });
    await writeFile(lockPath("batch-d"), "{ not valid json", "utf8");
    const before = await readFile(lockPath("batch-d"), "utf8");

    const result = await acquireBatchLock(rootDir, "batch-d", "run-contender", "fp", ["c1"], { lockMaxWaitMs: 50, lockRetryDelayMs: 10 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issueCode).toBe("pipeline_batch_lock_held_ambiguous");

    const after = await readFile(lockPath("batch-d"), "utf8");
    expect(after).toBe(before);
  });

  it("release only removes the lock when the presented token matches the owner", async () => {
    const acquireResult = await acquireBatchLock(rootDir, "batch-e", "run-1", "fp", ["c1"]);
    expect(acquireResult.ok).toBe(true);
    if (!acquireResult.ok) return;

    await releaseBatchLock(rootDir, "batch-e", "wrong-token");
    const stillThere = await readFile(lockPath("batch-e"), "utf8").catch(() => undefined);
    expect(stillThere).toBeDefined();

    await releaseBatchLock(rootDir, "batch-e", acquireResult.handle.ownerToken);
    const goneNow = await readFile(lockPath("batch-e"), "utf8").catch(() => undefined);
    expect(goneNow).toBeUndefined();
  });

  it("after release, a fresh acquisition for the same batch succeeds cleanly", async () => {
    const first = await acquireBatchLock(rootDir, "batch-f", "run-1", "fp", ["c1"]);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await releaseBatchLock(rootDir, "batch-f", first.handle.ownerToken);

    const second = await acquireBatchLock(rootDir, "batch-f", "run-2", "fp2", ["c2"]);
    expect(second.ok).toBe(true);
  });
});
