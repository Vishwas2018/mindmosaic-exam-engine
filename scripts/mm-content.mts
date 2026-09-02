import "./lib/allow-server-only.mts";

import { readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { importCanonicalQuestions } from "../src/features/content-platform/import";
import { ContentOperatorService, operatorConfigFromEnvironment } from "../src/features/content-platform/operator-service";
import { blindSolveResultSchema } from "../src/features/content-platform/quality-contracts";
import { buildBlindSolvePrompt, buildComparisonPrompt } from "../src/features/content-platform/review-workflow";
import { ownerQaSampleSize } from "../src/features/content-platform/risk";

const [area, action, ...args] = process.argv.slice(2);
const commands = [
  "inventory", "blueprint gaps", "batch create", "generate-next-batch", "import", "assets add",
  "batch validate", "batch review", "batch status", "approve", "reject", "revise", "publish", "retire",
  "forms build", "forms readiness", "export", "backup verify", "history", "audit",
];

function option(name: string): string | undefined {
  const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined;
}

function service(): ContentOperatorService {
  return new ContentOperatorService(operatorConfigFromEnvironment(option("--owner-id")));
}

if (!area || area === "help" || area === "--help") {
  console.log(`MindMosaic Content Platform v2\n\n${commands.map((command) => `  mm-content ${command}`).join("\n")}\n\nMutating database commands require the server-only operator environment. Publication is dry-run unless explicitly executed by the owner.`);
  process.exit(0);
}

if (area === "import") {
  const path = action;
  if (!path) throw new Error("Usage: mm-content import <file> --batch <id> [--dry-run]");
  const extension = extname(path).toLowerCase();
  const format = extension === ".ndjson" ? "ndjson" : extension === ".csv" ? "csv" : "json";
  const report = importCanonicalQuestions(readFileSync(resolve(path), "utf8"), format);
  const batchId = option("--batch");
  if (!batchId) throw new Error("--batch is required");
  if (!args.includes("--dry-run") && report.issues.length === 0) {
    console.log(JSON.stringify(await service().importRevisions(batchId, report.accepted, report.sourceHash), null, 2));
  } else console.log(JSON.stringify({ mode: "dry-run", batchId, accepted: report.accepted.length, issues: report.issues, sourceHash: report.sourceHash }, null, 2));
  process.exit(report.issues.length ? 1 : 0);
}

if (area === "batch" && action === "create") {
  const origin = option("--origin");
  if (!origin) throw new Error("--origin is required");
  const idempotencyKey = option("--idempotency-key");
  if (!idempotencyKey) throw new Error("--idempotency-key is required");
  console.log(JSON.stringify(await service().createBatch({ origin, idempotencyKey }), null, 2));
  process.exit(0);
}

if (area === "batch" && action === "validate") {
  const batchId = args[0]; if (!batchId) throw new Error("Usage: mm-content batch validate <batch-id>");
  const report = await service().validateBatch(batchId); console.log(JSON.stringify(report, null, 2));
  process.exit(report.some((item) => !item.passed) ? 1 : 0);
}

if (area === "batch" && action === "review") {
  const revisionId = option("--revision"); const resultPath = option("--result"); const exportStage = option("--export-stage");
  if (!revisionId) throw new Error("--revision is required");
  if (exportStage === "blind") {
    console.log(JSON.stringify(buildBlindSolvePrompt(await service().getRevision(revisionId)), null, 2)); process.exit(0);
  }
  if (exportStage === "comparison") {
    const blindPath = option("--blind"); if (!blindPath) throw new Error("--blind <result.json> is required for comparison export");
    const blind = blindSolveResultSchema.parse(JSON.parse(readFileSync(resolve(blindPath), "utf8")));
    console.log(JSON.stringify(buildComparisonPrompt(await service().getRevision(revisionId), blind), null, 2)); process.exit(0);
  }
  if (!resultPath) throw new Error("Use --export-stage blind|comparison, or --result <two-pass-review.json>");
  console.log(JSON.stringify(await service().ingestReview(revisionId, JSON.parse(readFileSync(resolve(resultPath), "utf8"))), null, 2)); process.exit(0);
}

if (area === "batch" && action === "status") {
  const batchId = args[0]; if (!batchId) throw new Error("Usage: mm-content batch status <batch-id>");
  const status = await service().batchStatus(batchId); const count = status.items.length;
  console.log(JSON.stringify({ ...status, minimumOwnerQaSample: count > 0 ? ownerQaSampleSize(count) : 0 }, null, 2));
  process.exit(0);
}

if (area === "assets" && action === "add") {
  const path = args[0]; const batchId = option("--batch"); const mimeType = option("--mime");
  if (!path || !batchId || !mimeType) throw new Error("Usage: mm-content assets add <file> --batch <id> --mime <type> [--alt <text>]");
  console.log(JSON.stringify(await service().addAsset({ batchId, path, bytes: readFileSync(resolve(path)), mimeType, altText: option("--alt") }), null, 2)); process.exit(0);
}

if (area === "approve") {
  const revisionId = action; const token = process.env.MM_CONTENT_OWNER_ACCESS_TOKEN;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!revisionId || !token || !url || !anonKey) throw new Error("Approval requires a revision ID, MM_CONTENT_OWNER_ACCESS_TOKEN, NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  const supabase = createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("owner_approve_content", { p_revision_id: revisionId, p_qa_evidence: JSON.parse(option("--qa-json") ?? "{}") });
  if (error) throw error; console.log(JSON.stringify({ approvalId: data }, null, 2)); process.exit(0);
}

if (area === "publish") {
  const revisionId = action; if (!revisionId) throw new Error("Usage: mm-content publish <revision-id> [--execute]");
  console.log(JSON.stringify(await service().publish(revisionId, args.includes("--execute")), null, 2));
  process.exit(0);
}

if (area === "history") {
  if (!action) throw new Error("Usage: mm-content history <revision-or-question-id>");
  console.log(JSON.stringify(await service().history(action), null, 2)); process.exit(0);
}

console.error(`Command '${[area, action].filter(Boolean).join(" ")}' is specified but its database execution adapter is not configured in this environment. Run 'mm-content help'.`);
process.exit(2);
