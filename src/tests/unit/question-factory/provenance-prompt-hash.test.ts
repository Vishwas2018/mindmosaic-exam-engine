import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import * as path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { FACTORY_LIMITS } from "@/features/question-factory/config";
import {
  candidateProvenanceSchema,
  type CandidateProvenanceInput,
} from "@/features/question-factory/provenance";
import { FsFactoryRepository } from "@/features/question-factory/storage";

function baseProvenance(overrides: Partial<CandidateProvenanceInput> = {}): CandidateProvenanceInput {
  return {
    candidateId: "man-abc123",
    blueprintId: "manual-ingestion-unblueprinted",
    batchId: "batch-001",
    pipelineRunId: "batch-001-ingest-manual",
    revision: 0,
    generatedAt: new Date().toISOString(),
    generatorAdapter: {
      class: "manual_external",
      identity: { provider: "anthropic", modelId: "claude-sonnet-5", modelFamily: "claude", interactionMode: "api" },
    },
    generatorVersion: "1",
    promptVersion: "v1",
    schemaVersion: "1",
    taxonomyVersion: "1",
    contentHash: "a".repeat(64),
    reviewRecords: [],
    ...overrides,
  };
}

describe("candidateProvenanceSchema — PD-7 promptHash", () => {
  it("accepts a record with no promptHash at all (pre-existing records remain valid)", () => {
    const result = candidateProvenanceSchema.safeParse(baseProvenance());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.promptHash).toBeUndefined();
  });

  it("accepts a record with a valid promptHash", () => {
    const result = candidateProvenanceSchema.safeParse(baseProvenance({ promptHash: "b".repeat(64) }));
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.promptHash).toBe("b".repeat(64));
  });

  it("rejects an empty-string promptHash", () => {
    const result = candidateProvenanceSchema.safeParse(baseProvenance({ promptHash: "" }));
    expect(result.success).toBe(false);
  });

  it("rejects a promptHash longer than the configured maximum", () => {
    const tooLong = "c".repeat(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH + 1);
    const result = candidateProvenanceSchema.safeParse(baseProvenance({ promptHash: tooLong }));
    expect(result.success).toBe(false);
  });

  it("accepts a promptHash exactly at the configured maximum", () => {
    const atLimit = "d".repeat(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH);
    const result = candidateProvenanceSchema.safeParse(baseProvenance({ promptHash: atLimit }));
    expect(result.success).toBe(true);
  });
});

describe("candidateProvenanceSchema — promptHash repository round trip", () => {
  let rootDir: string;
  let repo: FsFactoryRepository;

  beforeEach(async () => {
    rootDir = await mkdtemp(path.join(tmpdir(), "provenance-prompt-hash-test-"));
    repo = new FsFactoryRepository(rootDir);
  });

  afterEach(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  it("survives a create/read round trip through the repository", async () => {
    const provenance = candidateProvenanceSchema.parse(baseProvenance({ promptHash: "e".repeat(64) }));
    await repo.create("generated", "man-abc123", { candidateId: "man-abc123", state: "generated", provenance });

    const stored = (await repo.read("generated", "man-abc123")) as { provenance: unknown };
    const reparsed = candidateProvenanceSchema.parse(stored.provenance);
    expect(reparsed.promptHash).toBe("e".repeat(64));
  });
});
