import "./lib/allow-server-only.mts";

import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { Client } from "pg";
import { canonicalQuestionRevisionSchema, type CanonicalQuestionRevision } from "../src/features/content-platform/contracts";
import { ContentOperatorService } from "../src/features/content-platform/operator-service";

const databaseUrl = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:56322/postgres";
const ownerId = "91000000-0000-4000-8000-000000000001";
const service = new ContentOperatorService({ databaseUrl, ownerId });

function uuidFor(value: string): string {
  const hex = createHash("sha256").update(value).digest("hex").slice(0, 32).split("");
  hex[12] = "4"; hex[16] = "8";
  return `${hex.slice(0,8).join("")}-${hex.slice(8,12).join("")}-${hex.slice(12,16).join("")}-${hex.slice(16,20).join("")}-${hex.slice(20).join("")}`;
}

function envelope(rawQuestion: Record<string, unknown>, origin: "manual_owner" | "ai_codex", source: string): CanonicalQuestionRevision {
  const question: Record<string, unknown> = { ...rawQuestion, status: "draft", origin };
  const examStyle = question.examStyle;
  return canonicalQuestionRevisionSchema.parse({
    schemaVersion: 2, logicalQuestionId: uuidFor(`${origin}:${String(question.id)}`), revision: 1, origin, question,
    learnerExplanation: question.explanation, privateEvidence: { validatorHints: { pilotSource: source } }, assets: [],
    frameworkReferences: [{
      frameworkId: examStyle === "icas_style" ? "icas-current-subject-framework" : "australian-curriculum",
      version: examStyle === "icas_style" ? "current-2026-08-26" : "9.0",
      sourceType: examStyle === "icas_style" ? "official_subject_framework" : "official_curriculum",
      sourceUrl: examStyle === "icas_style" ? "https://www.icasassessments.com/" : "https://v9.australiancurriculum.edu.au/",
      retrievedAt: "2026-08-26T00:00:00.000Z",
    }],
  });
}

async function ensureOwner(): Promise<void> {
  const client = new Client({ connectionString: databaseUrl }); await client.connect();
  try {
    await client.query("insert into auth.users(id,email) values($1,'content-owner-pilot@test.local') on conflict(id) do nothing", [ownerId]);
    await client.query("update public.profiles set role='admin' where id=$1", [ownerId]);
  } finally { await client.end(); }
}

function manualQuestions(): CanonicalQuestionRevision[] {
  const directory = resolve("content/question-factory/published-manifests");
  const result: CanonicalQuestionRevision[] = [];
  for (const name of readdirSync(directory).sort()) {
    if (!name.endsWith(".json")) continue;
    const manifest = JSON.parse(readFileSync(join(directory, name), "utf8"));
    if (manifest.generatorAdapter?.identity?.provider !== "human") continue;
    result.push(envelope(manifest.question, "manual_owner", `published-manifests/${name}`));
    if (result.length === 60) break;
  }
  if (result.length !== 60) throw new Error(`Expected 60 truthfully human-authored manifests; found ${result.length}.`);
  return result;
}

function scienceQuestions(): CanonicalQuestionRevision[] {
  const path = resolve("content/manual-questions/grade-5/icas/icas-y5-science/icas-y5-science-b05.json");
  const source = JSON.parse(readFileSync(path, "utf8"));
  return source.questions.slice(0, 30).map((question: Record<string, unknown>) => envelope(question, "ai_codex", "icas-y5-science-b05.json"));
}

async function runPilot(label: string, origin: "manual_owner" | "ai_codex", questions: CanonicalQuestionRevision[]) {
  const batch = await service.createBatch({ origin, idempotencyKey: `quality-pilot:${label}:v1`, blueprintAssignment: { dryRun: true, label } });
  const sourceHash = createHash("sha256").update(JSON.stringify(questions)).digest("hex");
  const firstImport = await service.importRevisions(batch.id, questions, sourceHash);
  const retryImport = await service.importRevisions(batch.id, questions, sourceHash);
  const validations = await service.validateBatch(batch.id);
  const status = await service.batchStatus(batch.id);
  const firstRevision = status.items[0]?.id;
  return {
    label, batchId: batch.id, itemCount: questions.length, firstImport: { imported: firstImport.imported, reused: firstImport.reused },
    retryImport: { imported: retryImport.imported, reused: retryImport.reused, idempotent: retryImport.idempotent },
    validation: { passed: validations.filter((item) => item.passed).length, blocked: validations.filter((item) => !item.passed).length,
      hardFailureCodes: [...new Set(validations.flatMap((item) => item.hardFailures.map((issue) => issue.code)))],
      riskCodes: [...new Set(validations.flatMap((item) => item.riskSignals.map((issue) => issue.code)))],
    },
    qaSample: Math.max(5, Math.ceil(questions.length * 0.1)),
    publicationDryRun: firstRevision ? await service.publish(firstRevision, false) : null,
    independentReview: origin === "ai_codex" ? "blocked_without_claude_credentials" : "prompt_export_ready_but_not_executed_without_independent_agent",
  };
}

await ensureOwner();
console.log(JSON.stringify({ manual: await runPilot("manual-human-manifests-60", "manual_owner", manualQuestions()), science: await runPilot("icas-y5-science-codex-30", "ai_codex", scienceQuestions()) }, null, 2));
