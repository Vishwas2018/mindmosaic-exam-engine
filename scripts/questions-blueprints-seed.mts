/**
 * `questions:blueprints-seed` — PB2 blueprint-binding workflow.
 *
 * Two modes, both governed-artefact oriented:
 *
 * `--generate`: deterministically authors one real blueprint per distinct
 * canonical candidate tuple across the staged packs, plus the
 * per-candidate binding manifest and an immutable evidence record
 * (fingerprint, manifest hash, blueprint-set hash, counts). Pure
 * derivation from the packs + the live taxonomy registry — any gap that
 * would require guessing aborts with `manual_completion_required` and
 * nothing is written. Output files are write-once (the run refuses to
 * overwrite) and marked read-only.
 *
 * `--seed`: idempotently installs a reviewed blueprint set into the
 * workspace's `blueprints` compartment (create / byte-identical replay /
 * conflict — never overwrite).
 *
 * Exit codes: 0 clean, 2 invalid arguments, 3 conflict/refusal, 1 internal.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

import {
  generateBindingArtefacts,
  type BindingPackInput,
  seedBindingBlueprints,
} from "../src/features/question-factory/binding";
import { blueprintSchema, validateBlueprint, type Blueprint } from "../src/features/question-factory/blueprints";
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly mode: "generate" | "seed";
  readonly packsDir?: string;
  readonly batchId?: string;
  readonly frozenFingerprint?: string;
  readonly outDir?: string;
  readonly generatedAt?: string;
  readonly blueprintsFile?: string;
  readonly json: boolean;
}

/** Canonical ISO-8601 UTC instant: the string must round-trip `Date.toISOString` byte-identically, so two spellings of one instant can never mint two manifests. */
function isCanonicalIsoInstant(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage:",
      "  questions:blueprints-seed --generate --packs <dir> --batch-id <id> --frozen-fingerprint <sha256> --out <dir> [--json]",
      "  questions:blueprints-seed --seed --blueprints <file> [--json]",
      "",
      "  --generate               Author blueprints + binding manifest + evidence from staged candidate packs.",
      "  --seed                   Idempotently install a reviewed blueprint set into the workspace blueprints compartment.",
      "  --packs <dir>            Directory whose direct-child .json files are the staged candidate packs.",
      "  --batch-id <id>          Batch identifier stamped into generated blueprints and the manifest.",
      "  --frozen-fingerprint <h> The approved frozen artefact-set fingerprint the manifest binds to.",
      "  --out <dir>              Output directory for generated artefacts (files are write-once).",
      "  --generated-at <iso>     Optional canonical ISO-8601 UTC instant (e.g. 2026-07-17T00:00:00.000Z) stamped as generatedAt — pin it to make regeneration byte-identical. Defaults to now.",
      "  --blueprints <file>      JSON array of blueprint records to seed.",
      "  --json                   Emit a single machine-readable JSON result line.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let mode: "generate" | "seed" | undefined;
  let packsDir: string | undefined;
  let batchId: string | undefined;
  let frozenFingerprint: string | undefined;
  let outDir: string | undefined;
  let generatedAt: string | undefined;
  let blueprintsFile: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--generate":
        mode = mode === undefined ? "generate" : mode;
        if (mode !== "generate") return undefined;
        break;
      case "--seed":
        mode = mode === undefined ? "seed" : mode;
        if (mode !== "seed") return undefined;
        break;
      case "--packs":
        packsDir = argv[++index];
        break;
      case "--batch-id":
        batchId = argv[++index];
        break;
      case "--frozen-fingerprint":
        frozenFingerprint = argv[++index];
        break;
      case "--out":
        outDir = argv[++index];
        break;
      case "--generated-at":
        generatedAt = argv[++index];
        break;
      case "--blueprints":
        blueprintsFile = argv[++index];
        break;
      case "--json":
        json = true;
        break;
      case "--help":
      case "-h":
        return undefined;
      default:
        process.stderr.write(`Unrecognised argument: ${arg}\n`);
        return undefined;
    }
  }

  if (mode === "generate") {
    if (!packsDir || !batchId || !frozenFingerprint || !outDir) {
      process.stderr.write("--generate requires --packs, --batch-id, --frozen-fingerprint and --out.\n");
      return undefined;
    }
    if (generatedAt !== undefined && !isCanonicalIsoInstant(generatedAt)) {
      process.stderr.write(`--generated-at '${generatedAt}' is not a canonical ISO-8601 UTC instant (expected the exact Date.toISOString form, e.g. 2026-07-17T00:00:00.000Z).\n`);
      return undefined;
    }
    return { mode, packsDir, batchId, frozenFingerprint, outDir, generatedAt, json };
  }
  if (mode === "seed") {
    if (!blueprintsFile) {
      process.stderr.write("--seed requires --blueprints.\n");
      return undefined;
    }
    return { mode, blueprintsFile, json };
  }
  process.stderr.write("One of --generate or --seed is required.\n");
  return undefined;
}

async function writeOnce(filePath: string, content: string): Promise<void> {
  // "wx" refuses an existing file — generated governance artefacts are
  // write-once; regeneration goes to a fresh directory, never in place.
  const handle = await fs.open(filePath, "wx");
  try {
    await handle.writeFile(content, "utf8");
  } finally {
    await handle.close();
  }
  await fs.chmod(filePath, 0o444);
}

async function runGenerate(args: ParsedArgs): Promise<number> {
  const packsDir = args.packsDir as string;
  const entries = (await fs.readdir(packsDir)).filter((name) => name.endsWith(".json")).sort();
  if (entries.length === 0) {
    process.stderr.write(`No .json packs found in '${packsDir}'.\n`);
    return 2;
  }
  const packs: BindingPackInput[] = [];
  for (const fileName of entries) {
    packs.push({ fileName, rawContent: await fs.readFile(path.join(packsDir, fileName), "utf8") });
  }

  const outcome = generateBindingArtefacts({
    batchId: args.batchId as string,
    frozenFingerprint: args.frozenFingerprint as string,
    packs,
    generatedAt: args.generatedAt ?? new Date().toISOString(),
  });
  if (!outcome.ok) {
    const payload = { status: "generation_failed", failures: outcome.failures };
    process.stderr.write(args.json ? `${JSON.stringify(payload)}\n` : outcome.failures.map((failure) => `[${failure.code}] ${failure.message}`).join("\n") + "\n");
    return 3;
  }

  await fs.mkdir(args.outDir as string, { recursive: true });
  const blueprintsPath = path.join(args.outDir as string, "binding-blueprints.json");
  const manifestPath = path.join(args.outDir as string, "binding-manifest.json");
  const evidencePath = path.join(args.outDir as string, "binding-evidence.json");
  try {
    await writeOnce(blueprintsPath, JSON.stringify(outcome.blueprints, null, 2) + "\n");
    await writeOnce(manifestPath, JSON.stringify(outcome.manifest, null, 2) + "\n");
    await writeOnce(evidencePath, JSON.stringify(outcome.evidence, null, 2) + "\n");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`Refusing to overwrite existing generated artefacts: ${message}\n`);
    return 3;
  }

  const summary = {
    status: "generated",
    ...outcome.evidence,
    blueprintsPath,
    manifestPath,
    evidencePath,
  };
  process.stdout.write(args.json ? `${JSON.stringify(summary)}\n` : `Generated ${outcome.evidence.tupleCount} blueprints for ${outcome.evidence.candidateCount} candidates.\n  manifestHash:     ${outcome.evidence.manifestHash}\n  blueprintSetHash: ${outcome.evidence.blueprintSetHash}\n  out:              ${args.outDir}\n`);
  return 0;
}

async function runSeed(args: ParsedArgs): Promise<number> {
  const raw = await fs.readFile(args.blueprintsFile as string, "utf8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    process.stderr.write(`Blueprint set is not valid JSON: ${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    process.stderr.write("Blueprint set must be a non-empty JSON array.\n");
    return 2;
  }
  const blueprints: Blueprint[] = [];
  for (const [index, record] of parsed.entries()) {
    const schemaOutcome = blueprintSchema.safeParse(record);
    if (!schemaOutcome.success) {
      process.stderr.write(`Blueprint at index ${index} fails blueprintSchema: ${schemaOutcome.error.issues.map((issue) => issue.message).join("; ")}\n`);
      return 3;
    }
    const validation = validateBlueprint(schemaOutcome.data);
    if (!validation.valid) {
      process.stderr.write(`Blueprint '${schemaOutcome.data.id}' fails validateBlueprint: ${validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("; ")}\n`);
      return 3;
    }
    blueprints.push(schemaOutcome.data);
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());
  const result = await seedBindingBlueprints(blueprints, repository);
  const payload = { status: result.conflicts.length === 0 ? "seeded" : "conflicts", ...result };
  process.stdout.write(
    args.json
      ? `${JSON.stringify(payload)}\n`
      : `Seeded blueprints: created ${result.created}, replayed ${result.replayed}, conflicts ${result.conflicts.length}.\n${result.conflicts.map((conflict) => `  CONFLICT ${conflict.blueprintId}: ${conflict.message}`).join("\n")}\n`,
  );
  return result.conflicts.length === 0 ? 0 : 3;
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }
  return args.mode === "generate" ? runGenerate(args) : runSeed(args);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    process.stderr.write(`internal_error: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
