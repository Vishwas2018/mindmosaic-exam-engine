import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { mintManualCandidateId, resolveDeclaredIdentity, runManualIngestion } from "@/features/question-factory/manual-ingestion";
import type { ManualIngestedCandidateRecord, ManualIngestionRunRequest } from "@/features/question-factory/manual-ingestion";
import { FACTORY_LIMITS } from "@/features/question-factory/config";
import { hashContent } from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { validateCandidateStructure } from "@/features/question-factory/validation";

let repoRoot: string;
let inboxRoot: string;
let repo: FsFactoryRepository;

beforeEach(async () => {
  repoRoot = await mkdtemp(path.join(tmpdir(), "manual-ingest-repo-"));
  inboxRoot = await mkdtemp(path.join(tmpdir(), "manual-ingest-inbox-"));
  repo = new FsFactoryRepository(repoRoot);
});

afterEach(async () => {
  await rm(repoRoot, { recursive: true, force: true });
  await rm(inboxRoot, { recursive: true, force: true });
});

function baseRequest(overrides: Partial<ManualIngestionRunRequest> = {}): ManualIngestionRunRequest {
  return {
    source: "claude",
    batchId: "batch-x",
    promptVersion: "v1",
    pipelineRunId: "batch-x-ingest-manual",
    inboxRoot,
    ...overrides,
  };
}

async function dropInboxFile(fileName: string, content: unknown): Promise<void> {
  await writeFile(path.join(inboxRoot, fileName), typeof content === "string" ? content : JSON.stringify(content), "utf8");
}

const validCandidateContent = {
  type: "number_entry",
  yearLevel: 5,
  examStyle: "naplan_style",
  prompt: "What is 6 + 8?",
  options: [],
  visuals: [],
  answerKey: { kind: "number", value: 14, tolerance: 0 },
  explanation: "6 + 8 = 14.",
  metadata: {
    subject: "numeracy",
    strand: "Number and Algebra",
    skill: "numeracy.addition.two-digit",
    difficulty: "easy",
    marks: 1,
    estimatedTimeSeconds: 45,
  },
};

describe("resolveDeclaredIdentity", () => {
  it("resolves each of the three named sources without an explicit --model", () => {
    expect(resolveDeclaredIdentity({ source: "claude" })).toBeDefined();
    expect(resolveDeclaredIdentity({ source: "chatgpt" })).toBeDefined();
    expect(resolveDeclaredIdentity({ source: "qwen" })).toBeDefined();
  });

  it("requires an explicit --model for source 'other'", () => {
    expect(resolveDeclaredIdentity({ source: "other" })).toBeUndefined();
  });

  it("resolves source 'other' when a recognised --model is supplied", () => {
    expect(resolveDeclaredIdentity({ source: "other", model: "human" })).toBeDefined();
  });

  it("returns undefined for an unresolvable declared model", () => {
    expect(resolveDeclaredIdentity({ source: "other", model: "totally-unknown-model-xyz" })).toBeUndefined();
  });

  it("lets --model override the source's own canonical alias", () => {
    const identity = resolveDeclaredIdentity({ source: "claude", model: "opus" });
    expect(identity?.modelId).toBe("claude-opus-4-8");
  });
});

describe("runManualIngestion — happy path", () => {
  it("ingests a single-object candidate file to 'generated'", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesProcessed).toBe(1);
    expect(outcome.result.candidatesCreated).toBe(1);

    const accepted = outcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    expect(accepted.candidate.state).toBe("generated");
    const stored = await repo.read("generated", accepted.candidate.candidateId);
    expect(stored).toBeDefined();
  });

  it("ingests an array-of-candidates file as an ordered batch", async () => {
    await dropInboxFile("batch.json", [validCandidateContent, { ...validCandidateContent, prompt: "What is 3 + 4?" }]);
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.candidatesCreated).toBe(2);
  });

  it("processes a multi-candidate file with one bad element without blocking the rest (partial independence)", async () => {
    const request = baseRequest();
    const collidingId = mintManualCandidateId({
      sourceFileName: "mixed.json",
      batchId: request.batchId,
      pipelineRunId: request.pipelineRunId,
      indexInFile: 1,
      sourceContentHash: hashContent(JSON.stringify([validCandidateContent, { ...validCandidateContent, prompt: "What is 9 + 9?" }])),
    });
    await repo.create("generated", collidingId, {
      candidateId: collidingId,
      state: "generated",
      question: { conflicting: true },
      provenance: { contentHash: "not-the-real-hash" },
    });

    await dropInboxFile("mixed.json", [validCandidateContent, { ...validCandidateContent, prompt: "What is 9 + 9?" }]);
    const outcome = await runManualIngestion(request, repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const [first, second] = outcome.result.fileResults[0].candidateResults;
    expect(first.status).toBe("accepted");
    expect(second.status).toBe("rejected");
    expect(outcome.result.fileResults[0].outcome).toBe("processed");
    expect(outcome.result.candidatesCreated).toBe(1);
    expect(outcome.result.candidatesRejected).toBe(1);
  });

  it("stamps complete provenance with no silently defaulted fields", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ promptHash: "f".repeat(64), blueprintId: "bp-001" }), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const accepted = outcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    const provenance = accepted.candidate.provenance;
    expect(provenance.candidateId).toBe(accepted.candidate.candidateId);
    expect(provenance.blueprintId).toBe("bp-001");
    expect(provenance.batchId).toBe("batch-x");
    expect(provenance.pipelineRunId).toBe("batch-x-ingest-manual");
    expect(provenance.revision).toBe(0);
    expect(provenance.generatorAdapter.class).toBe("manual_external");
    expect(provenance.promptVersion).toBe("v1");
    expect(provenance.promptHash).toBe("f".repeat(64));
    expect(provenance.contentHash.length).toBeGreaterThan(0);
    expect(provenance.reviewRecords).toEqual([]);
  });

  it("moves the inbox file into processed/ only after the candidate is durably persisted", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    await runManualIngestion(baseRequest(), repo);
    const processedFiles = await readdir(path.join(inboxRoot, "processed"));
    expect(processedFiles).toContain("candidate-1.json");
    const rootFiles = (await readdir(inboxRoot)).filter((name) => name.endsWith(".json"));
    expect(rootFiles).toEqual([]);
  });
});

describe("runManualIngestion — source identity", () => {
  it("rejects the whole run for an unresolvable declared model under source 'other'", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ source: "other", model: "unknown-model-zzz" }), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status !== "request_invalid") return;
    expect(outcome.issueCode).toBe("source_identity_invalid");
  });

  it("rejects source 'other' with no --model at all", async () => {
    const outcome = await runManualIngestion(baseRequest({ source: "other" }), repo);
    expect(outcome.status).toBe("request_invalid");
  });

  it("never confers trust from a donor-style status field present in the input", async () => {
    await dropInboxFile("candidate-1.json", { ...validCandidateContent, status: "approved", origin: "original_seed" });
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const accepted = outcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    // generatorAdapter.class is fixed by the adapter, never derived from
    // any field in the source content — the donor-style fields above have
    // no effect on trust or lifecycle placement.
    expect(accepted.candidate.provenance.generatorAdapter.class).toBe("manual_external");
    expect(accepted.candidate.state).toBe("generated");
  });
});

describe("runManualIngestion — malformed / unsupported input", () => {
  it("quarantines malformed JSON without crashing the run", async () => {
    await dropInboxFile("broken.json", "{ this is not valid json");
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesQuarantined).toBe(1);
    const quarantined = await readdir(path.join(inboxRoot, "quarantine"));
    expect(quarantined.some((name) => name === "broken.json")).toBe(true);
    expect(quarantined.some((name) => name.endsWith(".quarantine-report.json"))).toBe(true);
  });

  it("quarantines a JSON value that is not an object or array of objects", async () => {
    await dropInboxFile("weird.json", "42");
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesQuarantined).toBe(1);
  });

  it("does not quarantine a structurally-incomplete-but-parseable candidate — it reaches 'generated' for the next gate to reject", async () => {
    await dropInboxFile("incomplete.json", { type: "number_entry" }); // missing prompt/answerKey/metadata
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesQuarantined).toBe(0);
    const accepted = outcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    expect(accepted.candidate.state).toBe("generated");

    // Prove it is left for structural validation, not silently swallowed.
    const structural = validateCandidateStructure(
      {
        candidateId: accepted.candidate.candidateId,
        state: accepted.candidate.state,
        question: accepted.candidate.question,
        provenance: accepted.candidate.provenance,
      },
      { validatedAt: new Date().toISOString() },
    );
    expect(structural.status).toBe("failed");
  });
});

describe("runManualIngestion — replay and conflict", () => {
  it("is idempotent on identical replay (same file, same bytes, ingested twice)", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const first = await runManualIngestion(baseRequest(), repo);
    expect(first.status).toBe("completed");
    // Re-drop the identical bytes for a second run.
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const second = await runManualIngestion(baseRequest(), repo);
    expect(second.status).toBe("completed");
    if (second.status !== "completed") return;
    const replayed = second.result.fileResults[0].candidateResults[0];
    expect(replayed.status).toBe("accepted");
    if (replayed.status !== "accepted") return;
    expect(replayed.replay).toBe(true);
    expect(replayed.written).toBe(false);
    expect(second.result.candidatesCreated).toBe(0);
    expect(second.result.candidatesReplayed).toBe(1);
  });

  it("refuses a candidate whose deterministically-minted id already holds different content (never silently overwrites)", async () => {
    // Candidate identity is derived from (sourceFileName, batchId,
    // pipelineRunId, indexInFile, sourceContentHash) — a genuine "same id,
    // different content" collision cannot arise through ordinary re-drops
    // (different bytes always mint a different id, by design). This test
    // exercises the refusal path directly: pre-seed a conflicting record
    // at the exact id this file's content would mint, the same way a
    // hash collision or an out-of-band repository edit would produce it.
    const request = baseRequest();
    const content = JSON.stringify(validCandidateContent);
    const sourceContentHash = hashContent(content);
    const collidingId = mintManualCandidateId({
      sourceFileName: "candidate-1.json",
      batchId: request.batchId,
      pipelineRunId: request.pipelineRunId,
      indexInFile: 0,
      sourceContentHash,
    });
    await repo.create("generated", collidingId, {
      candidateId: collidingId,
      state: "generated",
      question: { ...validCandidateContent, prompt: "A completely different question." },
      provenance: { contentHash: "not-the-real-hash" },
    });

    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(request, repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const rejected = outcome.result.fileResults[0].candidateResults[0];
    expect(rejected.status).toBe("rejected");
    if (rejected.status !== "rejected") return;
    expect(rejected.issueCode).toBe("candidate_conflict");
    expect(outcome.result.candidatesCreated).toBe(0);
  });

  it("a reused file name with genuinely different bytes mints a distinct candidate id — two independent creates, not a conflict", async () => {
    await dropInboxFile("a.json", validCandidateContent);
    const first = await runManualIngestion(baseRequest(), repo);
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;
    const firstId = (first.result.fileResults[0].candidateResults[0] as { candidate: ManualIngestedCandidateRecord }).candidate.candidateId;

    await dropInboxFile("a.json", { ...validCandidateContent, prompt: "What is 55 + 1?" });
    const second = await runManualIngestion(baseRequest(), repo);
    expect(second.status).toBe("completed");
    if (second.status !== "completed") return;
    const accepted = second.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    expect(accepted.written).toBe(true);
    expect(accepted.candidate.candidateId).not.toBe(firstId);
  });

  it("a byte-identical file copied under a different name mints a distinct candidate id — never treated as the same identity", async () => {
    await dropInboxFile("copy-a.json", validCandidateContent);
    const first = await runManualIngestion(baseRequest(), repo);
    expect(first.status).toBe("completed");
    if (first.status !== "completed") return;
    const firstAccepted = first.result.fileResults[0].candidateResults[0];
    expect(firstAccepted.status).toBe("accepted");
    if (firstAccepted.status !== "accepted") return;

    await dropInboxFile("copy-b.json", validCandidateContent);
    const second = await runManualIngestion(baseRequest(), repo);
    expect(second.status).toBe("completed");
    if (second.status !== "completed") return;
    const secondAccepted = second.result.fileResults[0].candidateResults[0];
    expect(secondAccepted.status).toBe("accepted");
    if (secondAccepted.status !== "accepted") return;

    // No deterministic file name is treated as identity proof: two
    // distinct files, even with byte-identical content, are two distinct
    // governed candidate lineages — deduplication is the (not yet built)
    // originality gate's job, never ingestion's.
    expect(secondAccepted.candidate.candidateId).not.toBe(firstAccepted.candidate.candidateId);
    expect(second.result.candidatesCreated).toBe(1);
  });
});

describe("runManualIngestion — interruption recovery", () => {
  it("recovers a file left in .processing/ from a prior interrupted run", async () => {
    const processingDir = path.join(inboxRoot, ".processing");
    await mkdir(processingDir, { recursive: true });
    await writeFile(path.join(processingDir, "stranded.json"), JSON.stringify(validCandidateContent), "utf8");

    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const recoveredFile = outcome.result.fileResults.find((file) => file.fileName === "stranded.json");
    expect(recoveredFile?.recovered).toBe(true);
    expect(recoveredFile?.outcome).toBe("processed");

    const processed = await readdir(path.join(inboxRoot, "processed"));
    expect(processed).toContain("stranded.json");
    const stillProcessing = await readdir(processingDir).catch(() => []);
    expect(stillProcessing).not.toContain("stranded.json");
  });

  it("recovers a malformed file left in .processing/ by quarantining it", async () => {
    const processingDir = path.join(inboxRoot, ".processing");
    await mkdir(processingDir, { recursive: true });
    await writeFile(path.join(processingDir, "stranded-bad.json"), "not json at all {{{", "utf8");

    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    const recoveredFile = outcome.result.fileResults.find((file) => file.fileName === "stranded-bad.json");
    expect(recoveredFile?.recovered).toBe(true);
    expect(recoveredFile?.outcome).toBe("quarantined");

    const quarantined = await readdir(path.join(inboxRoot, "quarantine"));
    expect(quarantined).toContain("stranded-bad.json");
  });
});

describe("runManualIngestion — limits", () => {
  it("quarantines a file larger than the configured byte bound without loading its full content into memory-bound logic incorrectly", async () => {
    const big = "x".repeat(FACTORY_LIMITS.MAX_INBOX_FILE_BYTES + 10);
    await writeFile(path.join(inboxRoot, "huge.json"), big, "utf8");
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesQuarantined).toBe(1);
    expect(outcome.result.fileResults[0].quarantineIssueCode).toBe("inbox_file_too_large");
  });

  it("rejects a single file declaring more candidates than the per-file batch bound", async () => {
    const many = Array.from({ length: FACTORY_LIMITS.MAX_CANDIDATES_PER_INBOX_FILE + 1 }, () => validCandidateContent);
    await dropInboxFile("too-many.json", many);
    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesQuarantined).toBe(1);
    expect(outcome.result.fileResults[0].quarantineIssueCode).toBe("ingestion_batch_limit_exceeded");
  });
});

describe("runManualIngestion — dry run", () => {
  it("leaves the repository and inbox completely unchanged", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ dryRun: true }), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.dryRun).toBe(true);
    const accepted = outcome.result.fileResults[0].candidateResults[0];
    expect(accepted.status).toBe("accepted");
    if (accepted.status !== "accepted") return;
    expect(accepted.written).toBe(false);

    const stored = await repo.read("generated", accepted.candidate.candidateId);
    expect(stored).toBeUndefined();

    const rootFiles = (await readdir(inboxRoot)).filter((name) => name.endsWith(".json"));
    expect(rootFiles).toEqual(["candidate-1.json"]);
    const processedExists = await readdir(path.join(inboxRoot, "processed")).catch(() => []);
    expect(processedExists).toEqual([]);
  });
});

describe("runManualIngestion — path safety", () => {
  it("only ever processes direct-child *.json files, never descending into subdirectories", async () => {
    const nested = path.join(inboxRoot, "nested-dir");
    await mkdir(nested, { recursive: true });
    await writeFile(path.join(nested, "should-not-be-touched.json"), JSON.stringify(validCandidateContent), "utf8");

    const outcome = await runManualIngestion(baseRequest(), repo);
    expect(outcome.status).toBe("completed");
    if (outcome.status !== "completed") return;
    expect(outcome.result.filesScanned).toBe(0);
    // The nested file is left exactly where it was.
    const stillThere = await readFile(path.join(nested, "should-not-be-touched.json"), "utf8");
    expect(stillThere.length).toBeGreaterThan(0);
  });
});

describe("runManualIngestion — request validation", () => {
  it("rejects a missing promptVersion", async () => {
    const outcome = await runManualIngestion(baseRequest({ promptVersion: "" }), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status !== "request_invalid") return;
    expect(outcome.issueCode).toBe("prompt_metadata_missing");
  });

  it("rejects a malformed batchId before ever touching the inbox", async () => {
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ batchId: "Not A Valid Id!" }), repo);
    expect(outcome.status).toBe("request_invalid");
    const rootFiles = (await readdir(inboxRoot)).filter((name) => name.endsWith(".json"));
    expect(rootFiles).toEqual(["candidate-1.json"]);
  });

  it("rejects the run when a declared promptHash does not match the real issued prompt pack", async () => {
    await repo.create("reports", "prompt-pack-batch-x", {
      pack: { promptVersion: "v1" },
      promptHash: "real-hash-actually-issued",
    });
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ promptHash: "a-fabricated-hash" }), repo);
    expect(outcome.status).toBe("request_invalid");
    if (outcome.status !== "request_invalid") return;
    expect(outcome.issueCode).toBe("prompt_pack_reference_mismatch");
    const rootFiles = (await readdir(inboxRoot)).filter((name) => name.endsWith(".json"));
    expect(rootFiles).toEqual(["candidate-1.json"]);
  });

  it("accepts a declared promptHash that matches the real issued prompt pack", async () => {
    await repo.create("reports", "prompt-pack-batch-x", {
      pack: { promptVersion: "v1" },
      promptHash: "the-real-hash",
    });
    await dropInboxFile("candidate-1.json", validCandidateContent);
    const outcome = await runManualIngestion(baseRequest({ promptHash: "the-real-hash" }), repo);
    expect(outcome.status).toBe("completed");
  });
});
