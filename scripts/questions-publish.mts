/**
 * `questions:publish` — Mission 3E publication CLI: drives one or more
 * `staged` candidates through the final `staged -> published` hop. Only a
 * candidate physically present in the `staged` compartment (reached only
 * via a genuine `questions:stage` run) can ever succeed here — see
 * `src/features/question-factory/publication/publish-candidate.ts`'s doc
 * comment for the full eligibility contract this enforces (originality
 * and difficulty evidence must still be fresh and passing, no
 * deterministic-fixture generator content, no production-id collision).
 *
 * `--candidate-ids` is mandatory. Each candidate is processed
 * independently — one candidate's refusal never blocks the rest.
 *
 * Exit codes: 0 every requested candidate ended `published` (fresh or
 * replayed), 3 partial (at least one candidate was refused), 2 invalid
 * arguments, 1 internal error.
 */
import { getWorkspaceRoot } from "../src/features/question-factory/config";
import { parseApprovalCsv, type ApprovalInputRow } from "../src/features/content-governance/approval-verification";
import { orchestratePublication, type PublicationOutcome } from "../src/features/question-factory/publication";
import { FsFactoryRepository } from "../src/features/question-factory/storage";
import { readFile } from "node:fs/promises";

interface ParsedArgs {
  readonly candidateIds: readonly string[];
  readonly sheet?: string;
  readonly packet?: string;
  readonly reviewer?: string;
  readonly json: boolean;
}

function printUsage(): void {
  process.stderr.write(
    ["Usage: questions:publish --candidate-ids <id1,id2,...> (--sheet <reviewed.csv> | --packet <reviewed.json>) --reviewer '<full name>' [--json]", ""].join("\n"),
  );
}

function parseArgs(argv: readonly string[]): ParsedArgs | undefined {
  let candidateIdsRaw: string | undefined;
  let sheet: string | undefined;
  let packet: string | undefined;
  let reviewer: string | undefined;
  let json = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--candidate-ids":
        candidateIdsRaw = argv[++index];
        break;
      case "--sheet":
        sheet = argv[++index];
        break;
      case "--packet":
        packet = argv[++index];
        break;
      case "--reviewer":
        reviewer = argv[++index];
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

  if (Boolean(sheet) === Boolean(packet) || (packet && candidateIds.length !== 1)) return undefined;
  return { candidateIds, sheet, packet, reviewer, json };
}

function emitHuman(results: readonly PublicationOutcome[]): void {
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
  const publishedAt = new Date().toISOString();
  let rows: ApprovalInputRow[];
  let reviewer = args.reviewer;
  if (args.sheet) {
    rows = parseApprovalCsv(await readFile(args.sheet, "utf8"));
  } else {
    const packet = JSON.parse(await readFile(args.packet!, "utf8")) as Record<string, unknown>;
    reviewer ??= typeof packet.approvedBy === "string" ? packet.approvedBy : undefined;
    const checks = packet.checks as Record<string, unknown> | undefined;
    rows = [{ questionId: String(packet.questionId ?? ""),
      contentHash: typeof packet.contentHash === "string" ? packet.contentHash : undefined,
      revision: typeof packet.revision === "number" ? packet.revision : undefined,
      sourceManifestHash: packet.sourceManifestHash === null ? null : undefined,
      correctness: checks?.correctness === true ? "yes" : "",
      originality: checks?.originality === true ? "yes" : "",
      ageAppropriateness: checks?.ageAppropriateness === true ? "yes" : "",
      decision: typeof packet.decision === "string" ? packet.decision : "" }];
  }
  if (!reviewer || reviewer.trim().split(/\s+/).length < 2) throw new Error("A reviewer full name is required.");
  const rowByQuestion = new Map<string, ApprovalInputRow>();
  for (const row of rows) {
    if (rowByQuestion.has(row.questionId)) throw new Error(`Duplicate review row for ${row.questionId}.`);
    rowByQuestion.set(row.questionId, row);
  }
  const additionalReservedIds = new Set<string>();

  const results: PublicationOutcome[] = [];
  for (const candidateId of args.candidateIds) {
    const staged = await repository.read("staged", candidateId) as { question?: { id?: string } } | undefined;
    const reviewedRow = staged?.question?.id ? rowByQuestion.get(staged.question.id) : undefined;
    const result = await orchestratePublication(candidateId, repository, { publishedAt,
      reviewedApproval: reviewedRow ? { row: reviewedRow, reviewerFullName: reviewer } : undefined,
      additionalReservedIds });
    if (result.outcome === "published") additionalReservedIds.add(result.manifest.questionId);
    results.push(result);
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ results })}\n`);
  } else {
    emitHuman(results);
  }

  if (results.some((result) => result.outcome === "repository_error")) return 1;
  if (results.some((result) => result.outcome !== "published")) return 3;
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
