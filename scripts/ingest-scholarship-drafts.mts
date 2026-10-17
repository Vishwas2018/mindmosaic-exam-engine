import "./lib/allow-server-only.mts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { blueprintSchema, validateBlueprint } from "@/features/question-factory/blueprints";
import { skillTaxonomyRegistry } from "@/features/question-factory/taxonomy";
import { isScholarshipAttestedItem } from "@/features/question-factory/correctness/scholarship-attestation";
import { candidateQuestionSchema, type CandidateQuestion } from "@/features/question-factory/ingestion/candidate-question";

/**
 * Source preparation plus the REAL ingestion CLI (questions:ingest) only, replacing the
 * hand-written stage-scholarship-candidates path. Draft ids are preserved verbatim, so the
 * staged id equals the draft id and the solver registries (keyed by draft id) apply.
 * No gate reports, review chains, staged records, attestations or manifests are written here.
 * Usage: npx tsx scripts/ingest-scholarship-drafts.mts [--only id,id] [--dry-run]
 */
const BATCH = "scholarship-y6-2026-10-17";
const FILES = ["numerical-reasoning", "verbal-reasoning", "reading", "mathematics"];
const onlyArg = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const only = onlyArg ? new Set(onlyArg.split(",")) : undefined;
const dry = process.argv.includes("--dry-run");

function blueprintFor(q: CandidateQuestion) {
  const skill = skillTaxonomyRegistry.resolveOrThrow(q.metadata.skill!);
  const blueprint = blueprintSchema.parse({
    id: `${q.id}-seed-001`, batchId: BATCH, yearLevel: `year-${q.yearLevel}`, examStyle: q.examStyle,
    subject: q.metadata.subject, strand: q.metadata.strand, skill: skill.id, difficulty: q.metadata.difficulty,
    questionType: q.type, targetCount: 1, marks: q.metadata.marks, estimatedTimeSeconds: q.metadata.estimatedTimeSeconds,
    learningObjective: skill.displayName, misconceptionTargets: [], reasoningSteps: q.metadata.difficulty === "challenging" ? 5 : q.metadata.difficulty === "medium" ? 3 : 1,
    accessibilityConstraints: [], originalityConstraints: ["Original first-party practice content; verify against the current published corpus."],
    generationConstraints: ["Import the reviewed draft verbatim; never synthesize correctness or review evidence."],
  });
  const result = validateBlueprint(blueprint);
  if (!result.valid) throw new Error(JSON.stringify(result.issues));
  return blueprint;
}

let count = 0;
for (const f of FILES) {
  const packet = JSON.parse(await readFile(`content/scholarship-drafts/scholarship-y6-${f}-draft.json`, "utf8"));
  for (const raw of packet.questions) {
    if (only && !only.has(raw.id)) continue;
    const side = packet.parameters?.[raw.id];
    // First-party attested items are verified by hash-bound recompute; candidate sidecar logic is never submitted for them.
    const merged = side && typeof side.solver === "string" && !isScholarshipAttestedItem(raw) ? { ...raw, solverParams: {
      solver: side.solver, solverParams: side.solverParams ?? {},
      ...((side.ruleOrientation ?? side.solverParams?.ruleOrientation) ? { ruleOrientation: side.ruleOrientation ?? side.solverParams?.ruleOrientation } : {}),
      ...(side.targetOption ? { targetOption: side.targetOption } : {}),
      ...(side.correctValue !== undefined ? { correctValue: side.correctValue } : {}),
    } } : raw;
    const q = candidateQuestionSchema.parse(merged);
    const blueprint = blueprintFor(q);
    count++;
    if (dry) continue;
    const text = JSON.stringify(blueprint, null, 2) + "\n";
    const file = `content/question-factory/blueprints/${blueprint.id}.json`;
    try { await writeFile(file, text, { flag: "wx" }); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "EEXIST" || (await readFile(file, "utf8")) !== text) throw e; }
    const inbox = `content/question-factory/inbox/scholarship-y6/${q.id}`;
    await mkdir(inbox, { recursive: true });
    await writeFile(`${inbox}/${q.id}.json`, JSON.stringify(q, null, 2) + "\n", { flag: "wx" });
    const run = spawnSync(process.execPath, ["--import", "tsx", "scripts/questions-ingest.mts", "--source", "claude", "--batch-id", BATCH, "--pipeline-run-id", "scholarship-y6-intake-2026-10-17", "--prompt-version", "existing-scholarship-draft-import-1", "--blueprint-id", blueprint.id, "--inbox", inbox, "--json"], { encoding: "utf8", cwd: process.cwd() });
    process.stdout.write(run.stdout ?? ""); process.stderr.write(run.stderr ?? "");
    if (run.error) throw run.error;
    if (run.status !== 0) throw new Error(`Governed ingestion refused ${q.id}: exit ${run.status}`);
  }
}
console.log(`${count} scholarship drafts ${dry ? "validated (dry run)" : "ingested through questions:ingest"}; no staging or publication claimed.`);
