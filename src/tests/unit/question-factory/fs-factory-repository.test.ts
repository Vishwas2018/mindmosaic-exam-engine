import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FsFactoryRepository } from "@/features/question-factory/storage";
import { hashJson } from "@/features/question-factory/provenance";

let rootDir: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "factory-repo-test-"));
  repo = new FsFactoryRepository(rootDir);
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

/**
 * `acquireLock`/`releaseLock` are private implementation details of
 * `FsFactoryRepository` — TypeScript's `private` is compile-time only, so
 * this narrow structural cast lets the lock-ownership tests below exercise
 * the exact primitives `move()`/`update()` use internally (mint a token,
 * present it back), without which "wrong token can't release another
 * holder's lock" cannot be tested at all: the public API never exposes a
 * token for a caller to get wrong.
 */
interface LockingInternals {
  acquireLock(
    candidateId: string,
  ): Promise<{ readonly ok: true; readonly handle: { readonly token: string } } | { readonly ok: false; readonly message: string }>;
  releaseLock(candidateId: string, token: string): Promise<void>;
}

function locking(r: FsFactoryRepository): LockingInternals {
  return r as unknown as LockingInternals;
}

async function writeMarker(
  candidateId: string,
  from: string,
  to: string,
): Promise<void> {
  const transactionsDir = path.join(rootDir, ".transactions");
  await mkdir(transactionsDir, { recursive: true });
  await writeFile(
    path.join(transactionsDir, `${candidateId}.json`),
    JSON.stringify({ candidateId, from, to, startedAt: new Date().toISOString() }),
    "utf8",
  );
}

describe("FsFactoryRepository.create", () => {
  it("creates a new candidate record", async () => {
    const result = await repo.create("generated", "cand-001", { foo: "bar" });
    expect(result).toEqual({ ok: true, candidateId: "cand-001", compartment: "generated" });
    expect(await repo.read("generated", "cand-001")).toEqual({ foo: "bar" });
  });

  it("fails on a duplicate candidate id already tracked in metadata", async () => {
    await repo.create("generated", "cand-001", { v: 1 });
    const result = await repo.create("staged", "cand-001", { v: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("duplicate_candidate");
    expect(await repo.read("generated", "cand-001")).toEqual({ v: 1 });
    expect(await repo.exists("staged", "cand-001")).toBe(false);
  });

  it("fails on an orphaned duplicate candidate file with no metadata record", async () => {
    const dir = path.join(rootDir, "generated");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "cand-002.json"), JSON.stringify({ orphan: true }), "utf8");

    const result = await repo.create("generated", "cand-002", { v: 1 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("duplicate_candidate");

    const raw = await readFile(path.join(dir, "cand-002.json"), "utf8");
    expect(JSON.parse(raw)).toEqual({ orphan: true });
  });

  it("rejects an invalid candidate id (path-traversal defence)", async () => {
    await expect(repo.create("generated", "../escape", {})).rejects.toThrow();
    await expect(repo.create("generated", "Not Valid!", {})).rejects.toThrow();
  });
});

describe("FsFactoryRepository read/exists/list/remove", () => {
  it("read returns undefined for a missing candidate", async () => {
    expect(await repo.read("generated", "nope")).toBeUndefined();
  });

  it("list returns sorted candidate ids in a compartment", async () => {
    await repo.create("generated", "cand-b", {});
    await repo.create("generated", "cand-a", {});
    expect(await repo.list("generated")).toEqual(["cand-a", "cand-b"]);
  });

  it("list returns an empty array for a compartment never written to", async () => {
    expect(await repo.list("archived")).toEqual([]);
  });

  it("remove deletes a candidate file", async () => {
    await repo.create("generated", "cand-x", {});
    await repo.remove("generated", "cand-x");
    expect(await repo.exists("generated", "cand-x")).toBe(false);
  });
});

describe("FsFactoryRepository.remove (full canonical removal)", () => {
  it("removes the candidate's metadata record along with its file, not just the file", async () => {
    await repo.create("generated", "cand-full", { v: 1 });
    await repo.remove("generated", "cand-full");

    expect(await readdir(path.join(rootDir, ".metadata")).catch(() => [])).toEqual([]);
  });

  it("lets the same id be recreated cleanly after removal (no stale-metadata false duplicate)", async () => {
    await repo.create("generated", "cand-recreate", { v: 1 });
    await repo.remove("generated", "cand-recreate");

    const result = await repo.create("staged", "cand-recreate", { v: 2 });
    expect(result).toEqual({ ok: true, candidateId: "cand-recreate", compartment: "staged" });
    expect(await repo.read("staged", "cand-recreate")).toEqual({ v: 2 });
  });

  it("cleans up metadata-only residue (compartment file already gone)", async () => {
    await repo.create("generated", "cand-meta-only", { v: 1 });
    await rm(path.join(rootDir, "generated", "cand-meta-only.json"), { force: true });

    await repo.remove("generated", "cand-meta-only");

    expect(await readdir(path.join(rootDir, ".metadata")).catch(() => [])).toEqual([]);
    const recreated = await repo.create("generated", "cand-meta-only", { v: 2 });
    expect(recreated.ok).toBe(true);
  });

  it("cleans up candidate-file-only residue (no metadata record)", async () => {
    const dir = path.join(rootDir, "generated");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "cand-file-only.json"), JSON.stringify({ orphan: true }), "utf8");

    await repo.remove("generated", "cand-file-only");
    expect(await repo.exists("generated", "cand-file-only")).toBe(false);
  });

  it("removes the file from the metadata-recorded compartment even if the caller names a different (stale) one", async () => {
    await repo.create("generated", "cand-mismatch", { v: 1 });
    await repo.move("cand-mismatch", "generated", "staged");

    // Caller believes it's still in "generated" (stale reference).
    await repo.remove("generated", "cand-mismatch");

    expect(await repo.exists("staged", "cand-mismatch")).toBe(false);
    expect(await readdir(path.join(rootDir, ".metadata")).catch(() => [])).toEqual([]);
  });

  it("is idempotent: removing twice in a row does not throw", async () => {
    await repo.create("generated", "cand-repeat", { v: 1 });
    await repo.remove("generated", "cand-repeat");
    await expect(repo.remove("generated", "cand-repeat")).resolves.toBeUndefined();
  });

  it("removing a candidate that was never created does not throw", async () => {
    await expect(repo.remove("generated", "cand-never-existed")).resolves.toBeUndefined();
  });

  it("leaves unrelated candidates, metadata and reports untouched", async () => {
    await repo.create("generated", "cand-victim", { v: 1 });
    await repo.create("generated", "cand-bystander", { v: 2 });
    await mkdir(path.join(rootDir, "reports"), { recursive: true });
    await writeFile(path.join(rootDir, "reports", "batch-report.json"), "{}", "utf8");

    await repo.remove("generated", "cand-victim");

    expect(await repo.read("generated", "cand-bystander")).toEqual({ v: 2 });
    const metadataFiles = await readdir(path.join(rootDir, ".metadata"));
    expect(metadataFiles).toEqual(["cand-bystander.json"]);
    const reportRaw = await readFile(path.join(rootDir, "reports", "batch-report.json"), "utf8");
    expect(reportRaw).toBe("{}");
  });
});

describe("FsFactoryRepository.read corrupted-JSON quarantine", () => {
  async function writeRawCandidateFile(
    compartment: string,
    candidateId: string,
    raw: string,
  ): Promise<void> {
    const dir = path.join(rootDir, compartment);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `${candidateId}.json`), raw, "utf8");
  }

  it("returns undefined instead of throwing on malformed JSON", async () => {
    await writeRawCandidateFile("generated", "cand-broken", "{not valid json");
    await expect(repo.read("generated", "cand-broken")).resolves.toBeUndefined();
  });

  it("quarantines the malformed file instead of leaving it in its original compartment", async () => {
    await writeRawCandidateFile("generated", "cand-broken-2", "{not valid json");
    await repo.read("generated", "cand-broken-2");

    expect(await repo.exists("generated", "cand-broken-2")).toBe(false);
    const quarantined = await readFile(
      path.join(rootDir, "quarantined", "cand-broken-2.json"),
      "utf8",
    );
    expect(quarantined).toBe("{not valid json");
  });

  it("returns undefined instead of throwing on truncated JSON", async () => {
    await writeRawCandidateFile(
      "generated",
      "cand-truncated",
      '{"id": "cand-truncated", "prompt": "What is',
    );
    await expect(repo.read("generated", "cand-truncated")).resolves.toBeUndefined();
    expect(await repo.exists("generated", "cand-truncated")).toBe(false);
    expect(await repo.exists("quarantined", "cand-truncated")).toBe(true);
  });

  it("writes a concise machine-readable corruption report, without dumping excessive raw content", async () => {
    const longRaw = `{"broken": true, "padding": "${"x".repeat(500)}"`; // no closing brace
    await writeRawCandidateFile("generated", "cand-report", longRaw);
    await repo.read("generated", "cand-report");

    const reportRaw = await readFile(
      path.join(rootDir, ".quarantine-reports", "cand-report.json"),
      "utf8",
    );
    const report = JSON.parse(reportRaw) as Record<string, unknown>;
    expect(report.candidateId).toBe("cand-report");
    expect(report.sourceCompartment).toBe("generated");
    expect(report.errorCategory).toBe("json_parse_error");
    expect(typeof report.contentPreview).toBe("string");
    expect((report.contentPreview as string).length).toBeLessThan(longRaw.length);
  });

  it("never overwrites an existing quarantined artefact with different content", async () => {
    await writeRawCandidateFile("quarantined", "cand-collide", '{"already": "quarantined"');
    await writeRawCandidateFile("generated", "cand-collide", '{"different": "corruption"');

    await repo.read("generated", "cand-collide");

    const original = await readFile(path.join(rootDir, "quarantined", "cand-collide.json"), "utf8");
    expect(original).toBe('{"already": "quarantined"');

    const files = await readdir(path.join(rootDir, "quarantined"));
    const disambiguated = files.find((name) => name !== "cand-collide.json");
    expect(disambiguated).toBeDefined();
    const disambiguatedRaw = await readFile(path.join(rootDir, "quarantined", disambiguated!), "utf8");
    expect(disambiguatedRaw).toBe('{"different": "corruption"');
  });

  it("is safe to re-read after quarantining (idempotent, no duplicate quarantine artefacts)", async () => {
    await writeRawCandidateFile("generated", "cand-reread", "{not valid json");
    await repo.read("generated", "cand-reread");
    await expect(repo.read("generated", "cand-reread")).resolves.toBeUndefined();

    const files = await readdir(path.join(rootDir, "quarantined"));
    expect(files.filter((name) => name.startsWith("cand-reread")).length).toBe(1);
  });

  it("finishes a quarantine interrupted between the durable write and source removal", async () => {
    // Simulate the crash point: destination already durably written,
    // source not yet removed (transactional ordering in
    // quarantineCorruptedFile writes the destination first).
    await writeRawCandidateFile("generated", "cand-interrupted", "{not valid json");
    await writeRawCandidateFile("quarantined", "cand-interrupted", "{not valid json");

    await repo.read("generated", "cand-interrupted");

    expect(await repo.exists("generated", "cand-interrupted")).toBe(false);
    const quarantined = await readFile(
      path.join(rootDir, "quarantined", "cand-interrupted.json"),
      "utf8",
    );
    expect(quarantined).toBe("{not valid json");
  });

  it("does not quarantine, publish, stage or approve anything on read — a corrupted file only ever ends up in the quarantine compartment", async () => {
    await writeRawCandidateFile("generated", "cand-no-side-effects", "{not valid json");
    await repo.read("generated", "cand-no-side-effects");

    expect(await repo.list("staged")).toEqual([]);
    expect(await repo.list("published-manifests")).toEqual([]);
    expect(await repo.list("review-queue")).toEqual([]);
  });

  it("treats a metadata sidecar with valid JSON but an invalid shape as absent rather than throwing", async () => {
    await repo.create("generated", "cand-bad-meta", { v: 1 });
    await writeFile(
      path.join(rootDir, ".metadata", "cand-bad-meta.json"),
      JSON.stringify({ candidateId: "cand-bad-meta", compartment: "not-a-real-compartment" }),
      "utf8",
    );

    await expect(repo.remove("generated", "cand-bad-meta")).resolves.toBeUndefined();
    expect(await repo.exists("generated", "cand-bad-meta")).toBe(false);
  });
});

describe("FsFactoryRepository.move", () => {
  it("moves a candidate from one compartment to another", async () => {
    await repo.create("generated", "cand-move", { v: 1 });
    const result = await repo.move("cand-move", "generated", "review-queue");
    expect(result).toEqual({
      ok: true,
      candidateId: "cand-move",
      from: "generated",
      to: "review-queue",
      replayed: false,
    });
    expect(await repo.exists("generated", "cand-move")).toBe(false);
    expect(await repo.read("review-queue", "cand-move")).toEqual({ v: 1 });
  });

  it("fails with source_missing for an unknown candidate", async () => {
    const result = await repo.move("never-created", "generated", "staged");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("source_missing");
  });

  it("fails with state_metadata_mismatch when 'from' does not match the tracked compartment", async () => {
    await repo.create("generated", "cand-y", { v: 1 });
    const result = await repo.move("cand-y", "staged", "review-queue");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state_metadata_mismatch");
    expect(await repo.read("generated", "cand-y")).toEqual({ v: 1 });
  });

  it("fails with destination_exists when a different candidate record already occupies the target", async () => {
    await repo.create("generated", "cand-z", { v: 1 });
    const destDir = path.join(rootDir, "staged");
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, "cand-z.json"), JSON.stringify({ v: 999 }, null, 2), "utf8");

    const result = await repo.move("cand-z", "generated", "staged");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("destination_exists");

    expect(await repo.read("generated", "cand-z")).toEqual({ v: 1 });
    const raw = await readFile(path.join(destDir, "cand-z.json"), "utf8");
    expect(JSON.parse(raw)).toEqual({ v: 999 });
  });

  it("is idempotent when replayed after already succeeding (transition replay)", async () => {
    await repo.create("generated", "cand-replay", { v: 1 });
    const first = await repo.move("cand-replay", "generated", "staged");
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.replayed).toBe(false);

    const second = await repo.move("cand-replay", "generated", "staged");
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.replayed).toBe(true);
    expect(await repo.read("staged", "cand-replay")).toEqual({ v: 1 });
  });

  it("never leaves a candidate visible in two compartments after a successful move", async () => {
    await repo.create("generated", "cand-single", { v: 1 });
    await repo.move("cand-single", "generated", "review-queue");
    expect(await repo.exists("generated", "cand-single")).toBe(false);
    expect(await repo.exists("review-queue", "cand-single")).toBe(true);
  });
});

describe("FsFactoryRepository.update", () => {
  it("rewrites a candidate record in place within the same compartment", async () => {
    await repo.create("review-queue", "cand-upd", { candidateId: "cand-upd", state: "structural_validation_passed" });
    const result = await repo.update("review-queue", "cand-upd", {
      candidateId: "cand-upd",
      state: "correctness_check_passed",
    });
    expect(result).toEqual({ ok: true, candidateId: "cand-upd", compartment: "review-queue", replayed: false });
    expect(await repo.read("review-queue", "cand-upd")).toEqual({
      candidateId: "cand-upd",
      state: "correctness_check_passed",
    });
  });

  it("re-reading the repository after update returns the updated state", async () => {
    await repo.create("review-queue", "cand-reread", { candidateId: "cand-reread", state: "structural_validation_passed" });
    await repo.update("review-queue", "cand-reread", { candidateId: "cand-reread", state: "correctness_check_passed" });
    const reread = await repo.read("review-queue", "cand-reread");
    expect(reread).toEqual({ candidateId: "cand-reread", state: "correctness_check_passed" });
  });

  it("fails with source_missing when no record exists at the given compartment", async () => {
    const result = await repo.update("review-queue", "does-not-exist", { state: "x" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("source_missing");
  });

  it("is idempotent when replayed with the exact same target data (recovery from a partial failure after the write already completed)", async () => {
    await repo.create("review-queue", "cand-replay-upd", { candidateId: "cand-replay-upd", state: "structural_validation_passed" });
    const target = { candidateId: "cand-replay-upd", state: "correctness_check_passed" };

    const first = await repo.update("review-queue", "cand-replay-upd", target);
    expect(first.ok).toBe(true);
    if (first.ok) expect(first.replayed).toBe(false);

    const second = await repo.update("review-queue", "cand-replay-upd", target);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.replayed).toBe(true);
    expect(await repo.read("review-queue", "cand-replay-upd")).toEqual(target);
  });

  it("treats key-order differences as the same logical content for replay purposes", async () => {
    await repo.create("review-queue", "cand-keyorder", { candidateId: "cand-keyorder", state: "structural_validation_passed" });
    await repo.update("review-queue", "cand-keyorder", { candidateId: "cand-keyorder", state: "correctness_check_passed", extra: 1 });
    const replay = await repo.update("review-queue", "cand-keyorder", { extra: 1, state: "correctness_check_passed", candidateId: "cand-keyorder" });
    expect(replay).toEqual({ ok: true, candidateId: "cand-keyorder", compartment: "review-queue", replayed: true });
  });

  it("refuses to write when expectedContentHash no longer matches the stored record (concurrent modification)", async () => {
    const original = { candidateId: "cand-conflict", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-conflict", original);
    const staleExpectedHash = hashJson(original);

    // Simulate an out-of-band edit between the caller's read and its update() call.
    await repo.update("review-queue", "cand-conflict", { ...original, state: "quarantined" });

    const result = await repo.update(
      "review-queue",
      "cand-conflict",
      { ...original, state: "correctness_check_passed" },
      { expectedContentHash: staleExpectedHash },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state_mismatch");
    // The out-of-band edit must survive untouched.
    expect(await repo.read("review-queue", "cand-conflict")).toEqual({ ...original, state: "quarantined" });
  });

  it("succeeds when expectedContentHash matches the currently stored record", async () => {
    const original = { candidateId: "cand-match", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-match", original);
    const result = await repo.update(
      "review-queue",
      "cand-match",
      { ...original, state: "correctness_check_passed" },
      { expectedContentHash: hashJson(original) },
    );
    expect(result.ok).toBe(true);
  });

  it("never relocates the candidate — it stays in the same compartment after update", async () => {
    await repo.create("review-queue", "cand-stay", { candidateId: "cand-stay", state: "structural_validation_passed" });
    await repo.update("review-queue", "cand-stay", { candidateId: "cand-stay", state: "correctness_check_passed" });
    expect(await repo.exists("review-queue", "cand-stay")).toBe(true);
    expect(await repo.exists("quarantined", "cand-stay")).toBe(false);
    expect(await repo.exists("rejected/correctness", "cand-stay")).toBe(false);
  });

  it("fails with a deterministic conflict when the caller's expected hash is stale (a prior update already changed the record)", async () => {
    const original = { candidateId: "cand-stale-hash", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-stale-hash", original);
    const staleExpectedHash = hashJson(original);

    await repo.update("review-queue", "cand-stale-hash", { ...original, state: "quarantined" });

    const result = await repo.update(
      "review-queue",
      "cand-stale-hash",
      { ...original, state: "correctness_check_passed" },
      { expectedContentHash: staleExpectedHash },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state_mismatch");
    expect(await repo.read("review-queue", "cand-stale-hash")).toEqual({ ...original, state: "quarantined" });
  });
});

describe("FsFactoryRepository.update — concurrency safety", () => {
  it("serialises two concurrent updates against the same expected hash: exactly one succeeds, the other returns a deterministic conflict", async () => {
    const original = { candidateId: "cand-race", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-race", original);
    const expectedContentHash = hashJson(original);

    const payloadA = { ...original, state: "correctness_check_passed", winner: "A" };
    const payloadB = { ...original, state: "quarantined", winner: "B" };

    const [resultA, resultB] = await Promise.all([
      repo.update("review-queue", "cand-race", payloadA, { expectedContentHash }),
      repo.update("review-queue", "cand-race", payloadB, { expectedContentHash }),
    ]);

    const results = [resultA, resultB];
    const succeeded = results.filter((r) => r.ok);
    const failed = results.filter((r) => !r.ok);
    expect(succeeded.length).toBe(1);
    expect(failed.length).toBe(1);
    if (!failed[0].ok) expect(failed[0].reason).toBe("state_mismatch");
    if (succeeded[0].ok) expect(succeeded[0].replayed).toBe(false);

    // The winner is complete and unambiguous - exactly one of the two intended payloads, never a merge or corruption.
    const final = await repo.read("review-queue", "cand-race");
    expect([payloadA, payloadB]).toContainEqual(final);

    // No duplicate or stale temp file: exactly one real file for this candidate.
    const dirEntries = await readdir(path.join(rootDir, "review-queue"));
    expect(dirEntries).toEqual(["cand-race.json"]);
  });

  it("releases the lock after a concurrent race, so a subsequent update proceeds immediately rather than waiting out the lock timeout", async () => {
    const original = { candidateId: "cand-race-unlock", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-race-unlock", original);
    const expectedContentHash = hashJson(original);

    await Promise.all([
      repo.update("review-queue", "cand-race-unlock", { ...original, state: "correctness_check_passed" }, { expectedContentHash }),
      repo.update("review-queue", "cand-race-unlock", { ...original, state: "quarantined" }, { expectedContentHash }),
    ]);

    const lockDir = path.join(rootDir, ".locks");
    const lockEntries = await readdir(lockDir).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-race-unlock"))).toEqual([]);

    // A follow-up call completes promptly (would hang up to LOCK_MAX_WAIT_MS if the lock leaked).
    const current = await repo.read("review-queue", "cand-race-unlock");
    const start = Date.now();
    const followUp = await repo.update("review-queue", "cand-race-unlock", { ...(current as object), tag: "follow-up" });
    expect(followUp.ok).toBe(true);
    expect(Date.now() - start).toBeLessThan(2000);
  });

  it("replays the winning update from a race when called again with its exact resulting content", async () => {
    const original = { candidateId: "cand-race-replay", state: "structural_validation_passed" };
    await repo.create("review-queue", "cand-race-replay", original);
    const expectedContentHash = hashJson(original);

    const payloadA = { ...original, state: "correctness_check_passed" };
    const payloadB = { ...original, state: "quarantined" };
    await Promise.all([
      repo.update("review-queue", "cand-race-replay", payloadA, { expectedContentHash }),
      repo.update("review-queue", "cand-race-replay", payloadB, { expectedContentHash }),
    ]);

    const final = await repo.read("review-queue", "cand-race-replay");
    const replay = await repo.update("review-queue", "cand-race-replay", final as Record<string, unknown>);
    expect(replay).toEqual({ ok: true, candidateId: "cand-race-replay", compartment: "review-queue", replayed: true });
  });

  it("releases the lock when update() fails during validation (existing record is corrupted, not valid JSON)", async () => {
    const dir = path.join(rootDir, "review-queue");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "cand-corrupt-update.json"), "{not valid json", "utf8");

    const result = await repo.update("review-queue", "cand-corrupt-update", { foo: "bar" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("state_mismatch");

    const lockEntries = await readdir(path.join(rootDir, ".locks")).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-corrupt-update"))).toEqual([]);

    // The lock being released means a follow-up call is not blocked by a stale lock.
    const retry = await repo.update("review-queue", "cand-corrupt-update", { foo: "bar" });
    expect(retry.ok).toBe(false);
  });

  it("releases the lock after a source_missing failure (no record to update at all)", async () => {
    const result = await repo.update("review-queue", "cand-never-created", { foo: "bar" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("source_missing");

    const lockEntries = await readdir(path.join(rootDir, ".locks")).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-never-created"))).toEqual([]);
  });
});

describe("FsFactoryRepository.reconcile", () => {
  it("has nothing to do when there are no transaction markers", async () => {
    const report = await repo.reconcile();
    expect(report.entries).toEqual([]);
  });

  it("completes an interrupted move whose destination write already succeeded (roll forward)", async () => {
    await repo.create("generated", "cand-crash-1", { v: 1 });

    const destDir = path.join(rootDir, "review-queue");
    await mkdir(destDir, { recursive: true });
    const sourceRaw = await readFile(path.join(rootDir, "generated", "cand-crash-1.json"), "utf8");
    await writeFile(path.join(destDir, "cand-crash-1.json"), sourceRaw, "utf8");
    await writeMarker("cand-crash-1", "generated", "review-queue");

    const report = await repo.reconcile();
    expect(report.entries).toEqual([
      {
        candidateId: "cand-crash-1",
        action: "completed_interrupted_move",
        from: "generated",
        to: "review-queue",
      },
    ]);

    expect(await repo.exists("generated", "cand-crash-1")).toBe(false);
    expect(await repo.read("review-queue", "cand-crash-1")).toEqual({ v: 1 });

    const moveAgain = await repo.move("cand-crash-1", "review-queue", "staged");
    expect(moveAgain.ok).toBe(true);
  });

  it("rolls back an interrupted move whose destination write never completed", async () => {
    await repo.create("generated", "cand-crash-2", { v: 1 });
    await writeMarker("cand-crash-2", "generated", "review-queue");

    const report = await repo.reconcile();
    expect(report.entries).toEqual([
      {
        candidateId: "cand-crash-2",
        action: "rolled_back_interrupted_move",
        from: "generated",
        to: "review-queue",
      },
    ]);

    expect(await repo.read("generated", "cand-crash-2")).toEqual({ v: 1 });
    expect(await repo.exists("review-queue", "cand-crash-2")).toBe(false);

    const moveAgain = await repo.move("cand-crash-2", "generated", "review-queue");
    expect(moveAgain.ok).toBe(true);
  });

  it("discards a stray partial temp file left behind by an interrupted write during rollback", async () => {
    await repo.create("generated", "cand-crash-3", { v: 1 });

    const destDir = path.join(rootDir, "review-queue");
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, "cand-crash-3.json.tmp-abc123"), "partial content", "utf8");
    await writeMarker("cand-crash-3", "generated", "review-queue");

    await repo.reconcile();

    const remaining = await readdir(destDir);
    expect(remaining.some((name) => name.startsWith("cand-crash-3.json.tmp-"))).toBe(false);
  });

  it("discards a marker with unparsable JSON without throwing", async () => {
    const transactionsDir = path.join(rootDir, ".transactions");
    await mkdir(transactionsDir, { recursive: true });
    await writeFile(path.join(transactionsDir, "broken.json"), "{not valid json", "utf8");

    const report = await repo.reconcile();
    expect(report.entries).toEqual([]);
    expect(await readdir(transactionsDir)).toEqual([]);
  });

  it("is idempotent: reconciling twice in a row is a no-op the second time", async () => {
    await repo.create("generated", "cand-crash-4", { v: 1 });
    await writeMarker("cand-crash-4", "generated", "review-queue");

    const first = await repo.reconcile();
    expect(first.entries.length).toBe(1);
    const second = await repo.reconcile();
    expect(second.entries).toEqual([]);
  });
});

/**
 * Mission 2C stabilisation: locking previously stole any lock older than a
 * fixed 30-second threshold, regardless of whether the original holder was
 * still legitimately active — a contender could delete a still-live
 * holder's lock and a later holder's lock could in turn be deleted by an
 * even-later contender. Locking is now ownership-token-safe: a lock can only
 * ever be released by presenting the exact token minted for its own
 * acquisition, and age-based stealing has been removed entirely (no lease
 * protocol exists to make it safe). Tests use a short, configurable
 * `lockMaxWaitMs`/`lockRetryDelayMs` (via `FsFactoryRepositoryOptions`)
 * rather than waiting out the 5-second production default.
 */
describe("FsFactoryRepository — lock ownership tokens", () => {
  it("does not let a contender steal a lock merely because it is older than the previous 30-second stale threshold", async () => {
    await repo.create("review-queue", "cand-lock-a", { v: 1 });
    const holder = await locking(repo).acquireLock("cand-lock-a");
    expect(holder.ok).toBe(true);
    if (!holder.ok) return;

    // Backdate the lock file well past the old 30s "stale" window to prove age alone no longer matters.
    const lockFile = path.join(rootDir, ".locks", "cand-lock-a.lock");
    const raw = JSON.parse(await readFile(lockFile, "utf8")) as Record<string, unknown>;
    await writeFile(
      lockFile,
      JSON.stringify({ ...raw, acquiredAt: new Date(Date.now() - 10 * 60_000).toISOString() }),
      "utf8",
    );

    const fastRepo = new FsFactoryRepository(rootDir, { lockMaxWaitMs: 150, lockRetryDelayMs: 10 });
    const result = await fastRepo.update("review-queue", "cand-lock-a", { v: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("lock_timeout");

    // A's lock is untouched: same token, never removed or replaced by the timed-out contender.
    const stillThere = JSON.parse(await readFile(lockFile, "utf8")) as { token: string };
    expect(stillThere.token).toBe(holder.handle.token);

    await locking(repo).releaseLock("cand-lock-a", holder.handle.token);
  });

  it("never removes or replaces another caller's active lock (writer B blocked by writer A, resource never mutated)", async () => {
    await repo.create("review-queue", "cand-lock-b", { v: 1 });
    const a = await locking(repo).acquireLock("cand-lock-b");
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    const fastRepo = new FsFactoryRepository(rootDir, { lockMaxWaitMs: 150, lockRetryDelayMs: 10 });
    const bResult = await fastRepo.move("cand-lock-b", "review-queue", "staged");
    expect(bResult.ok).toBe(false);
    if (!bResult.ok) expect(bResult.reason).toBe("lock_timeout");

    // Candidate never moved: A's lock fully protected the resource for the whole contended window.
    expect(await repo.exists("review-queue", "cand-lock-b")).toBe(true);
    expect(await repo.exists("staged", "cand-lock-b")).toBe(false);

    await locking(repo).releaseLock("cand-lock-b", a.handle.token);
  });

  it("A releases only its own lock when presented with its own token", async () => {
    await repo.create("review-queue", "cand-lock-c", { v: 1 });
    const a = await locking(repo).acquireLock("cand-lock-c");
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    await locking(repo).releaseLock("cand-lock-c", a.handle.token);

    const lockEntries = await readdir(path.join(rootDir, ".locks")).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-lock-c"))).toEqual([]);
  });

  it("a caller with a wrong token cannot release another holder's lock", async () => {
    await repo.create("review-queue", "cand-lock-d", { v: 1 });
    const a = await locking(repo).acquireLock("cand-lock-d");
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    await locking(repo).releaseLock("cand-lock-d", "a-completely-different-token");

    const lockFile = path.join(rootDir, ".locks", "cand-lock-d.lock");
    const stillThere = JSON.parse(await readFile(lockFile, "utf8")) as { token: string };
    expect(stillThere.token).toBe(a.handle.token);

    await locking(repo).releaseLock("cand-lock-d", a.handle.token);
  });

  it("fails a contending update with a deterministic lock_timeout while the original holder is still legitimately active, never hanging indefinitely", async () => {
    await repo.create("review-queue", "cand-lock-e", { v: 1 });
    const a = await locking(repo).acquireLock("cand-lock-e");
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    const fastRepo = new FsFactoryRepository(rootDir, { lockMaxWaitMs: 120, lockRetryDelayMs: 10 });
    const start = Date.now();
    const result = await fastRepo.update("review-queue", "cand-lock-e", { v: 2 });
    const elapsed = Date.now() - start;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("lock_timeout");
    expect(elapsed).toBeLessThan(2000);

    await locking(repo).releaseLock("cand-lock-e", a.handle.token);
  });

  it("cleans up the lock after a successful move", async () => {
    await repo.create("generated", "cand-lock-f", { v: 1 });
    const result = await repo.move("cand-lock-f", "generated", "review-queue");
    expect(result.ok).toBe(true);

    const lockEntries = await readdir(path.join(rootDir, ".locks")).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-lock-f"))).toEqual([]);
  });

  it("cleans up the lock after a move failure (destination already occupied by different content)", async () => {
    await repo.create("generated", "cand-lock-g", { v: 1 });
    const destDir = path.join(rootDir, "staged");
    await mkdir(destDir, { recursive: true });
    await writeFile(path.join(destDir, "cand-lock-g.json"), JSON.stringify({ v: 999 }), "utf8");

    const result = await repo.move("cand-lock-g", "generated", "staged");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("destination_exists");

    const lockEntries = await readdir(path.join(rootDir, ".locks")).catch(() => [] as string[]);
    expect(lockEntries.filter((name) => name.startsWith("cand-lock-g"))).toEqual([]);
  });

  it("never leaves a duplicate or temporary candidate file behind when a lock timeout blocks a contender", async () => {
    await repo.create("review-queue", "cand-lock-h", { v: 1 });
    const a = await locking(repo).acquireLock("cand-lock-h");
    expect(a.ok).toBe(true);
    if (!a.ok) return;

    const fastRepo = new FsFactoryRepository(rootDir, { lockMaxWaitMs: 120, lockRetryDelayMs: 10 });
    const blocked = await fastRepo.update("review-queue", "cand-lock-h", { v: 2 });
    expect(blocked.ok).toBe(false);

    const dirEntries = await readdir(path.join(rootDir, "review-queue"));
    expect(dirEntries).toEqual(["cand-lock-h.json"]);

    await locking(repo).releaseLock("cand-lock-h", a.handle.token);
  });
});
