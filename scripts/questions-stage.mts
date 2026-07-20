/**
 * `questions:stage` — Mission 3E staging CLI: drives one or more
 * candidates through the `difficulty_review_passed -> staged` hop.
 *
 * `--candidate-ids` is mandatory: this CLI never discovers candidates by
 * scanning a compartment. Each candidate is processed independently — one
 * candidate's refusal never blocks the rest.
 *
 * Exit codes: 0 every requested candidate ended `staged` (fresh or
 * replayed), 3 partial (at least one candidate was refused — expected,
 * not a bug), 2 invalid arguments, 1 internal error.
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { orchestrateStaging, type StagingOutcome } from "../src/features/question-factory/staging";
import { FsFactoryRepository } from "../src/features/question-factory/storage";

interface ParsedArgs {
  readonly candidateIds: readonly string[];
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    ["Usage: questions:stage --candidate-ids <id1,id2,...> [--json]", ""].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let candidateIdsRaw: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--candidate-ids":
        candidateIdsRaw = argv[++index];
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

  if (!candidateIdsRaw || candidateIdsRaw.trim().length === 0) {
    process.stderr.write("--candidate-ids is required and must be non-empty.\n");
    return undefined;
  }

  const candidateIds = candidateIdsRaw
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0);

  return { candidateIds, json };
}

function emitHuman(results: readonly StagingOutcome[]): void {
  for (const result of results) {
    process.stdout.write(`${result.candidateId}: ${result.outcome}\n`);
  }
}

async function main(): Promise<number> {
  const args = parseArgs(process.argv.slice(2));
  if (!args) {
    printUsage();
    return 2;
  }

  const workspaceRoot = getWorkspaceRoot();
  const repository = new FsFactoryRepository(workspaceRoot);

  const results: StagingOutcome[] = [];
  for (const candidateId of args.candidateIds) {
    results.push(await orchestrateStaging(candidateId, repository));
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ results })}\n`);
  } else {
    emitHuman(results);
  }

  if (results.some((result) => result.outcome === "repository_error")) return 1;
  if (results.some((result) => result.outcome !== "staged")) return 3;
  return 0;
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
