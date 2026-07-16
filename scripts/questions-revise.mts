/**
 * `questions:revise` — Mission 3C candidate-revision CLI.
 *
 * Parses a single revision-request JSON file (matching
 * `reviseIngestionInputSchema`), validates it against the parent
 * candidate's current stored state (must be `needs_revision`), resolves
 * the parent's `supersededBy` claim (at most one canonical successor per
 * parent, ever), and creates the revised candidate as a brand-new record
 * entering at `generated` with zero inherited evidence. Deliberately its
 * own command, never an extension of `questions:ingest` — see
 * `revision/revise.ts`'s class doc for why.
 *
 * Exit codes: 0 accepted (fresh or replay), 2 invalid arguments/malformed
 * request/stale parent/blueprint mismatch/revision-limit
 * exhausted/no-material-change/unsupported author identity,
 * 4 unknown parent, 5 conflict (revision_request_conflict or
 * revision_parent_conflict), 1 internal error.
 */
import * as fs from "node:fs/promises";
import * as path from "node:path";

import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { ingestRevision, type ReviseOutcome } from "../src/features/question-factory/revision";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly requestFile: string;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    [
      "Usage: questions:revise --request <file> [options]",
      "",
      "  --request <file>   Required. Path to a JSON file containing one revision request.",
      "  --json              Emit a single machine-readable JSON result line to stdout.",
      "",
    ].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let requestFile: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--request":
        requestFile = argv[++index];
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

  if (!requestFile) {
    process.stderr.write("--request is required.\n");
    return undefined;
  }

  return { requestFile, json };
}

function emit(json: boolean, payload: Record<string, unknown>): void {
  if (json) {
    process.stdout.write(`${JSON.stringify(payload)}\n`);
    return;
  }
  if (payload.status === "accepted") {
    process.stdout.write(
      `Revision ${payload.replayed ? "(replay) " : ""}accepted: parent '${payload.parentCandidateId as string}' -> child '${payload.candidateId as string}' (revision ${payload.revision as number}, request '${payload.revisionRequestId as string}').\n`,
    );
  } else {
    process.stderr.write(`${payload.issueCode as string}: ${payload.message as string}\n`);
  }
}

function exitCodeFor(outcome: ReviseOutcome): number {
  if (outcome.status === "accepted") return 0;
  switch (outcome.issueCode) {
    case "unknown_parent_candidate":
      return 4;
    case "revision_request_conflict":
    case "revision_parent_conflict":
      return 5;
    case "repository_error":
      return 1;
    default:
      return 2;
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  let raw: string;
  try {
    raw = await fs.readFile(path.resolve(args.requestFile), "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", issueCode: "not_found", message: `Could not read request file: ${message}` });
    return 4;
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", issueCode: "malformed_revision_request", message: `Request file is not valid JSON: ${message}` });
    return 2;
  }

  const repository = new FsFactoryRepository(getWorkspaceRoot());

  let outcome: ReviseOutcome;
  try {
    outcome = await ingestRevision(parsedJson, repository);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    emit(args.json, { status: "rejected", issueCode: "repository_error", message });
    return 1;
  }

  emit(args.json, outcome as unknown as Record<string, unknown>);
  return exitCodeFor(outcome);
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`internal_error: ${message}\n`);
    process.exitCode = 1;
  });
