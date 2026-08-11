/**
 * The single authoritative question-bank inventory.
 *
 *   npm run audit:bank
 *
 * Written because an external audit reported "102 published / 0 literacy"
 * while `src/content/questions/generated/batch-published.json` held 288
 * factory-published questions including 69 reading and 63
 * language_conventions. Every number below is measured, never asserted:
 *
 *  - Served-pool counts come from `@/server/exam-bank` — the same module
 *    the app serves from — so a pool count here cannot disagree with what
 *    a child is actually given. No file parsing, no heuristics, no
 *    hardcoded expectations to drift.
 *  - Pipeline and manual-batch counts read the real directories and count
 *    files AND questions separately, because those differ by two orders of
 *    magnitude (inbox: ~40 files, ~2,000 questions) and quoting the wrong
 *    one is exactly how the 102 figure happened.
 *  - Everything the script cannot prove is printed as an explicit
 *    unknown/drift line rather than omitted.
 *
 * Read-only. It never writes to content/ and never mutates the bank.
 */

/* Must precede every other import: `@/server/exam-bank` is `server-only`. */
import "./lib/allow-server-only.mts";

import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync, type Dirent } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { factoryPublishedQuestions } from "@/content/questions/generated";
import { practiceQuestions } from "@/content/questions/practice-bank";
import { normaliseIdentity } from "@/features/question-factory/config/identity-normalisation";
import {
  MANIFEST_SCHEMA_VERSION_CURRENT,
  manifestSchemaVersionOf,
} from "@/features/question-factory/publication/manifest-schema";
import type { Question } from "@/schemas/question.schema";
import { getExamBank, getPublishedQuestionCount, getPublishedTopicCount } from "@/server/exam-bank";

/* ------------------------------------------------------------------ */
/* Paths                                                               */
/* ------------------------------------------------------------------ */

/* Resolved against this file, not cwd, so the script is correct from anywhere. */
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const FACTORY_ROOT = path.join(REPO_ROOT, "content", "question-factory");
const MANUAL_ROOT = path.join(REPO_ROOT, "content", "manual-questions");
const MANIFEST_DIR = path.join(FACTORY_ROOT, "published-manifests");

/* ------------------------------------------------------------------ */
/* Plain-text table rendering                                          */
/* ------------------------------------------------------------------ */

type Cell = string | number;

function heading(text: string): void {
  console.log(`\n${"=".repeat(78)}\n${text}\n${"=".repeat(78)}`);
}

function note(text: string): void {
  for (const line of wrap(text, 76)) console.log(`  ${line}`);
}

function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let current = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      if (current === "") current = word;
      else if (current.length + 1 + word.length <= width) current += ` ${word}`;
      else {
        lines.push(current);
        current = word;
      }
    }
    lines.push(current);
  }
  return lines;
}

function table(headers: readonly string[], rows: readonly (readonly Cell[])[]): void {
  if (rows.length === 0) {
    console.log("  (none)");
    return;
  }
  const numeric = headers.map((_, column) =>
    rows.every((row) => typeof row[column] === "number"),
  );
  const rendered = rows.map((row) => row.map((cell) => String(cell)));
  const widths = headers.map((header, column) =>
    Math.max(header.length, ...rendered.map((row) => (row[column] ?? "").length)),
  );
  const line = (cells: readonly string[]): string =>
    "  " +
    cells
      .map((cell, column) =>
        numeric[column] ? cell.padStart(widths[column]!) : cell.padEnd(widths[column]!),
      )
      .join("  ")
      .trimEnd();

  console.log(line(headers));
  console.log("  " + widths.map((width) => "-".repeat(width)).join("  "));
  for (const row of rendered) console.log(line(row));
}

function percent(part: number, whole: number): string {
  return whole === 0 ? "n/a" : `${((part / whole) * 100).toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/* Filesystem helpers                                                  */
/* ------------------------------------------------------------------ */

function listJsonFiles(directory: string): string[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(directory, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return [];
  }
  const found: string[] = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...listJsonFiles(full));
    else if (entry.name.endsWith(".json")) found.push(full);
  }
  return found.sort();
}

function exists(target: string): boolean {
  try {
    statSync(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * How many questions one JSON file actually holds. The factory tree mixes
 * four shapes and conflating them is the whole reason this script exists:
 * an inbox batch file is ~50 questions, a candidate or manifest file is 1.
 */
interface FileTally {
  readonly questions: number;
  readonly shape: "batch" | "candidate-or-manifest" | "question-array" | "unrecognised";
}

function tallyFile(file: string): FileTally {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return { questions: 0, shape: "unrecognised" };
  }
  if (Array.isArray(parsed)) return { questions: parsed.length, shape: "question-array" };
  if (parsed === null || typeof parsed !== "object") {
    return { questions: 0, shape: "unrecognised" };
  }
  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.questions)) {
    return { questions: record.questions.length, shape: "batch" };
  }
  if (record.question !== null && typeof record.question === "object") {
    return { questions: 1, shape: "candidate-or-manifest" };
  }
  return { questions: 0, shape: "unrecognised" };
}

interface DirectoryTally {
  readonly files: number;
  readonly questions: number;
  readonly unrecognised: number;
}

function tallyDirectory(directory: string): DirectoryTally {
  const files = listJsonFiles(directory);
  let questions = 0;
  let unrecognised = 0;
  for (const file of files) {
    const tally = tallyFile(file);
    questions += tally.questions;
    if (tally.shape === "unrecognised") unrecognised += 1;
  }
  return { files: files.length, questions, unrecognised };
}

/**
 * Tracked-in-git JSON count for a directory. Most of the factory tree is
 * gitignored, so an auditor cloning the repo sees a different tree from
 * the one on this machine — the single most likely cause of two honest
 * people quoting different totals. Printed alongside the on-disk count.
 */
function trackedJsonCount(relativeDirectory: string): number | undefined {
  try {
    const output = execFileSync("git", ["ls-files", "--", relativeDirectory], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return output.split("\n").filter((entry) => entry.endsWith(".json")).length;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/* Published manifests                                                 */
/* ------------------------------------------------------------------ */

interface ManifestIdentity {
  readonly provider?: string;
  readonly modelId?: string;
  readonly modelFamily?: string;
  readonly interactionMode?: string;
}

interface Manifest {
  readonly file: string;
  readonly candidateId?: string;
  readonly questionId?: string;
  readonly contentHash?: string;
  readonly revision?: number;
  readonly batchId?: string;
  readonly publishedAt?: string;
  readonly manifestSchemaVersion?: number;
  readonly correctnessBasis?: string;
  readonly chainOrigin?: string;
  readonly generatorAdapter?: { readonly class?: string; readonly identity?: ManifestIdentity };
  readonly reviewChain?: readonly { readonly reviewerIdentity?: ManifestIdentity }[];
  readonly recoveredEvidence?: readonly {
    readonly reviewerModelDeclared?: string;
    readonly verifiability?: string;
    readonly result?: string;
  }[];
  readonly noChainRecovered?: boolean;
  readonly question?: Question;
}

function loadManifests(): Manifest[] {
  return listJsonFiles(MANIFEST_DIR).map((file) => {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as Omit<Manifest, "file">;
    return { ...parsed, file: path.relative(REPO_ROOT, file) };
  });
}

/** Any key anywhere in a manifest that claims to name an approver. */
const APPROVER_KEY_PATTERN = /approved?by|approver|sign(ed)?[-_]?off|humanreview|reviewedby/i;

function findApproverKeys(value: unknown, trail: string = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => findApproverKeys(entry, `${trail}[${index}]`));
  }
  if (value === null || typeof value !== "object") return [];
  const found: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const next = trail === "" ? key : `${trail}.${key}`;
    if (APPROVER_KEY_PATTERN.test(key)) found.push(next);
    found.push(...findApproverKeys(child, next));
  }
  return found;
}

/**
 * Whether a declared identity is a human being rather than a model.
 * Decided on the normalised identity, never a raw name string — the same
 * rule the factory's own reviewer-independence policy uses.
 */
function isHumanIdentity(identity: ManifestIdentity | undefined): boolean {
  if (identity === undefined) return false;
  if (identity.provider === "human" || identity.modelFamily === "human") return true;
  const normalised =
    typeof identity.modelId === "string" ? normaliseIdentity(identity.modelId) : undefined;
  return normalised?.provider === "human";
}

function isHumanDeclaredName(declared: string | undefined): boolean {
  if (declared === undefined) return false;
  if (declared.trim().toLowerCase() === "human") return true;
  return normaliseIdentity(declared)?.provider === "human";
}

/** Strongest approval evidence a published question carries. Ordered worst to best. */
const APPROVAL_CLASSES = [
  "no manifest at all (curated bank, pre-factory)",
  "manifest declares no evidence recovered (noChainRecovered)",
  "recovered evidence, model reviewer, verifiability 'none'",
  "verifiable review chain, model reviewer only",
  "verifiable review chain, HUMAN reviewer",
] as const;
type ApprovalClass = (typeof APPROVAL_CLASSES)[number];

function classifyApproval(manifest: Manifest | undefined): ApprovalClass {
  if (manifest === undefined) return APPROVAL_CLASSES[0];
  const version = manifestSchemaVersionOf(manifest);
  if (version >= MANIFEST_SCHEMA_VERSION_CURRENT) {
    const chain = manifest.reviewChain ?? [];
    return chain.some((record) => isHumanIdentity(record.reviewerIdentity))
      ? APPROVAL_CLASSES[4]
      : APPROVAL_CLASSES[3];
  }
  const recovered = manifest.recoveredEvidence ?? [];
  if (recovered.length > 0) {
    return recovered.some((record) => isHumanDeclaredName(record.reviewerModelDeclared))
      ? APPROVAL_CLASSES[4]
      : APPROVAL_CLASSES[2];
  }
  return APPROVAL_CLASSES[1];
}

/* ------------------------------------------------------------------ */
/* Canonical comparison for reconciliation                             */
/* ------------------------------------------------------------------ */

/** Key-order-independent JSON, so a re-serialised question still matches. */
function canonicalise(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, child]) => [key, canonicalise(child)]),
  );
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalise(value));
}

/* ------------------------------------------------------------------ */
/* Report                                                              */
/* ------------------------------------------------------------------ */

const drift: string[] = [];

function flagDrift(message: string): void {
  drift.push(message);
}

const curated = getExamBank("curated");
const published = getExamBank("published");
const practice = getExamBank("practice");

console.log("MindMosaic question-bank inventory");
console.log(`Generated: ${new Date().toISOString()}`);
console.log(`Repository: ${REPO_ROOT}`);

/* ---------- 1. Pools the app actually serves ---------- */

heading("1. SERVED POOLS (from @/server/exam-bank — what a child can be given)");

table(
  ["pool", "ExamBankId", "questions", "unique ids", "composition"],
  [
    ["questionBank", "curated", curated.length, new Set(curated.map((q) => q.id)).size, "curated production bank"],
    ["practiceQuestions", "(none)", practiceQuestions.length, new Set(practiceQuestions.map((q) => q.id)).size, "auto-generated seeds, no review gate"],
    ["factoryPublishedQuestions", "(none)", factoryPublishedQuestions.length, new Set(factoryPublishedQuestions.map((q) => q.id)).size, "cleared the factory publication chain"],
    ["publishedExamBank", "published", published.length, new Set(published.map((q) => q.id)).size, "curated + factoryPublished"],
    ["practiceExamBank", "practice", practice.length, new Set(practice.map((q) => q.id)).size, "curated + practiceQuestions + factoryPublished"],
  ],
);

console.log("");
note(
  "DEFAULT POOL. There is no single default — it depends on the entry point, " +
    "and all three are reachable:",
);
console.log("");
table(
  ["entry point", "bank served", "questions", "gated?"],
  [
    ["Scoped catalogue programme (ExamConfigurator, initialBankId set)", "published", published.length, "yes"],
    ["Ad-hoc configurator entry (initialBankId undefined)", "curated", curated.length, "yes"],
    ['"Include the extended practice bank" toggle ticked', "practice", practice.length, "NO"],
    ["startExam() with no explicit bankId (exam-store default)", "published", published.length, "yes"],
  ],
);
console.log("");
note(
  "So the pool a child gets BY DEFAULT is publishedExamBank (curated + " +
    "factory-published) for a catalogue programme and for any session started " +
    "without an explicit bank, and the curated bank for an ad-hoc " +
    "configurator entry. Ungated practiceQuestions are never a default — they " +
    "require the explicit extended-practice opt-in.",
);
console.log("");
table(
  ["marketing surface", "function", "value"],
  [
    ["StatsBand question count", "getPublishedQuestionCount()", getPublishedQuestionCount()],
    ["StatsBand topic count", "getPublishedTopicCount()", getPublishedTopicCount()],
  ],
);

if (getPublishedQuestionCount() !== new Set(published.map((q) => q.id)).size) {
  flagDrift("getPublishedQuestionCount() disagrees with publishedExamBank unique ids.");
}

/* ---------- 2. Factory pipeline stages ---------- */

heading("2. QUESTION-FACTORY PIPELINE (content/question-factory/)");

const STAGES = [
  "inbox",
  "review-queue",
  "staged",
  "quarantined",
  "rejected",
  "published-manifests",
  "archived",
] as const;

const stageRows: Cell[][] = [];
let stageFileTotal = 0;
let stageQuestionTotal = 0;

for (const stage of STAGES) {
  const directory = path.join(FACTORY_ROOT, stage);
  const present = exists(directory);
  const tally = tallyDirectory(directory);
  const tracked = trackedJsonCount(`content/question-factory/${stage}`);
  stageFileTotal += tally.files;
  stageQuestionTotal += tally.questions;
  /*
   * content/question-factory/.gitignore ignores everything except
   * published-manifests/, so a fully-untracked stage is the documented
   * design (transient workspace), not drift. A PARTIALLY tracked stage is
   * drift: the same directory then means two different things depending on
   * whether you are looking at a clone or at this machine.
   */
  const visibility =
    !present || tracked === undefined
      ? "?"
      : tracked === tally.files && tracked > 0
        ? "tracked"
        : tracked === 0
          ? "local-only (gitignored)"
          : "PARTIAL";

  stageRows.push([
    stage,
    present ? tally.files : "MISSING DIR",
    tally.questions,
    tracked === undefined ? "?" : tracked,
    visibility,
    tally.unrecognised,
  ]);

  if (visibility === "PARTIAL") {
    flagDrift(
      `Stage "${stage}" is partially tracked: ${tally.files} JSON file(s) on disk, ` +
        `${tracked} tracked in git. A clone and this machine disagree about this stage.`,
    );
  }
  if (tally.unrecognised > 0) {
    flagDrift(`Stage "${stage}": ${tally.unrecognised} JSON file(s) of unrecognised shape (counted as 0 questions).`);
  }
}

stageRows.push(["TOTAL", stageFileTotal, stageQuestionTotal, "", "", ""]);
table(
  ["stage", "json files", "questions", "tracked in git", "visibility", "unparseable"],
  stageRows,
);
console.log("");
note(
  "Files and questions differ by design: an inbox/archived file is a batch of " +
    "many questions, a review-queue/staged/quarantined file is one candidate, " +
    "and a published-manifest is one question. Quoting the file count as a " +
    "question count (or the reverse) is the specific error this table exists " +
    "to prevent.",
);
console.log("");
note(
  "\"local-only (gitignored)\" is expected — content/question-factory/.gitignore " +
    "keeps the transient workspace out of git and tracks published-manifests/ " +
    "only. Those rows describe THIS machine; a fresh clone sees 0. Only " +
    "published-manifests/ is reproducible from the repository alone.",
);

const rejectedGates = ["structural", "correctness", "semantic", "originality", "difficulty"];
const rejectedRows: Cell[][] = rejectedGates
  .map((gate) => {
    const tally = tallyDirectory(path.join(FACTORY_ROOT, "rejected", gate));
    return [gate, tally.files, tally.questions] as Cell[];
  })
  .filter((row) => exists(path.join(FACTORY_ROOT, "rejected", String(row[0]))));

if (rejectedRows.length > 0) {
  console.log("\n  rejected/, by the gate that rejected:");
  table(["gate", "json files", "questions"], rejectedRows);
}

/* ---------- 3. Manual batches ---------- */

heading("3. MANUAL BATCHES (content/manual-questions/)");

function manualBuckets(): { bucket: string; files: number; questions: number; empty: number }[] {
  let entries: Dirent[];
  try {
    entries = readdirSync(MANUAL_ROOT, { withFileTypes: true, encoding: "utf8" });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const directory = path.join(MANUAL_ROOT, entry.name);
      const files = listJsonFiles(directory);
      let questions = 0;
      let empty = 0;
      for (const file of files) {
        const tally = tallyFile(file);
        questions += tally.questions;
        if (tally.questions === 0) empty += 1;
      }
      return { bucket: entry.name, files: files.length, questions, empty };
    })
    .sort((a, b) => (a.bucket < b.bucket ? -1 : 1));
}

const buckets = manualBuckets();
const manualRows: Cell[][] = buckets.map((bucket) => [
  bucket.bucket,
  bucket.files,
  bucket.questions,
  bucket.empty,
  bucket.bucket === "_conflicts"
    ? "QUARANTINED — shape conflict, not promotable"
    : bucket.bucket === "_promoted"
      ? "already promoted into the factory"
      : bucket.bucket === "_ready"
        ? "awaiting promotion"
        : "authoring tree",
]);
manualRows.push([
  "TOTAL",
  buckets.reduce((sum, bucket) => sum + bucket.files, 0),
  buckets.reduce((sum, bucket) => sum + bucket.questions, 0),
  buckets.reduce((sum, bucket) => sum + bucket.empty, 0),
  "",
]);
table(["bucket", "json files", "questions", "0-question files", "meaning"], manualRows);
console.log("");
note(
  "0-question files are PLACEHOLDER/skeleton batches. They are real files and " +
    "will inflate a file count, but they contribute nothing to any served pool.",
);

const conflicts = buckets.find((bucket) => bucket.bucket === "_conflicts");
if (conflicts !== undefined && conflicts.questions > 0) {
  flagDrift(
    `content/manual-questions/_conflicts holds ${conflicts.questions} question(s) in ` +
      `${conflicts.files} file(s) — authored content stuck outside the pipeline.`,
  );
}

/* ---------- 4. Published-bank cross-cuts ---------- */

heading("4. publishedExamBank CROSS-CUTS");

interface Facet {
  count: number;
  types: Set<string>;
  skills: Set<string>;
  /* `metadata.skill` is optional, so an untagged question is counted here
   * rather than folded into the distinct-skill set as a phantom value. */
  untaggedSkill: number;
  withVisual: number;
}

const facets = new Map<string, Facet>();
const allSkills = new Set<string>();
let untaggedSkillTotal = 0;

for (const question of published) {
  const key = [question.metadata.subject, `Y${question.yearLevel}`, question.examStyle].join(" | ");
  const facet = facets.get(key) ?? {
    count: 0,
    types: new Set<string>(),
    skills: new Set<string>(),
    untaggedSkill: 0,
    withVisual: 0,
  };
  facet.count += 1;
  facet.types.add(question.type);
  const skill = question.metadata.skill;
  if (typeof skill === "string" && skill.trim() !== "") {
    facet.skills.add(skill);
    allSkills.add(skill);
  } else {
    facet.untaggedSkill += 1;
    untaggedSkillTotal += 1;
  }
  if ((question.visuals ?? []).length > 0) facet.withVisual += 1;
  facets.set(key, facet);
}

const facetRows: Cell[][] = [...facets.entries()]
  .sort((a, b) => b[1].count - a[1].count)
  .map(([key, facet]) => {
    const [subject = "?", year = "?", style = "?"] = key.split(" | ");
    return [
      subject,
      year,
      style,
      facet.count,
      facet.types.size,
      facet.skills.size,
      facet.untaggedSkill,
      facet.withVisual,
      percent(facet.withVisual, facet.count),
    ];
  });

const publishedWithVisual = published.filter((question) => (question.visuals ?? []).length > 0).length;
facetRows.push([
  "TOTAL",
  "",
  "",
  published.length,
  new Set(published.map((question) => question.type)).size,
  allSkills.size,
  untaggedSkillTotal,
  publishedWithVisual,
  percent(publishedWithVisual, published.length),
]);

table(
  [
    "subject",
    "year",
    "exam style",
    "questions",
    "types",
    "skills",
    "no skill",
    "w/ visual",
    "visual %",
  ],
  facetRows,
);

if (untaggedSkillTotal > 0) {
  flagDrift(
    `${untaggedSkillTotal} published question(s) carry no metadata.skill — they are ` +
      "invisible to any skill-based reporting or selection.",
  );
}

console.log("\n  By question type:");
const typeCounts = new Map<string, number>();
for (const question of published) {
  typeCounts.set(question.type, (typeCounts.get(question.type) ?? 0) + 1);
}
table(
  ["question type", "questions", "% of bank"],
  [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => [type, count, percent(count, published.length)] as Cell[]),
);

console.log("\n  Visual-type coverage (a question counts once per distinct visual type it carries):");
const visualCounts = new Map<string, number>();
for (const question of published) {
  for (const type of new Set((question.visuals ?? []).map((visual) => visual.type))) {
    visualCounts.set(type, (visualCounts.get(type) ?? 0) + 1);
  }
}
const visualRows: Cell[][] = [...visualCounts.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => [type, count, percent(count, published.length)]);
visualRows.push([
  "ANY VISUAL",
  publishedWithVisual,
  percent(publishedWithVisual, published.length),
]);
visualRows.push([
  "NO VISUAL",
  published.length - publishedWithVisual,
  percent(published.length - publishedWithVisual, published.length),
]);
table(["visual type", "questions", "% of bank"], visualRows);

/*
 * Subject split attributed to the contributing pool. The external audit that
 * prompted this script reported "0 literacy" for the factory-published pool
 * while batch-published.json held 69 reading and 63 language_conventions, so
 * the factory column has to be readable on its own and not merged into the
 * curated bank's much larger totals.
 */
console.log("\n  By subject, attributed to the pool it comes from:");
function subjectTally(questions: readonly Question[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const question of questions) {
    counts.set(question.metadata.subject, (counts.get(question.metadata.subject) ?? 0) + 1);
  }
  return counts;
}
const curatedBySubject = subjectTally(curated);
const factoryBySubject = subjectTally(factoryPublishedQuestions);
const subjectRows: Cell[][] = [...new Set([...curatedBySubject.keys(), ...factoryBySubject.keys()])]
  .map((subject) => {
    const fromCurated = curatedBySubject.get(subject) ?? 0;
    const fromFactory = factoryBySubject.get(subject) ?? 0;
    return [subject, fromCurated, fromFactory, fromCurated + fromFactory] as Cell[];
  })
  .sort((a, b) => Number(b[3]) - Number(a[3]));
subjectRows.push([
  "TOTAL",
  curated.length,
  factoryPublishedQuestions.length,
  published.length,
]);
table(
  ["subject", "curated (questionBank)", "factory (batch-published.json)", "publishedExamBank"],
  subjectRows,
);

/* ---------- 5. Reconciliation ---------- */

heading("5. RECONCILIATION: published-manifests <-> publishedExamBank");

const manifests = loadManifests();
const manifestById = new Map<string, Manifest[]>();
for (const manifest of manifests) {
  const id = manifest.questionId ?? manifest.candidateId ?? `(no id: ${manifest.file})`;
  manifestById.set(id, [...(manifestById.get(id) ?? []), manifest]);
}

const publishedById = new Map<string, Question>();
const duplicatePublishedIds: string[] = [];
for (const question of published) {
  if (publishedById.has(question.id)) duplicatePublishedIds.push(question.id);
  publishedById.set(question.id, question);
}

const curatedIds = new Set(curated.map((question) => question.id));
const factoryIds = new Set(factoryPublishedQuestions.map((question) => question.id));

const manifestsWithoutQuestion = [...manifestById.keys()].filter((id) => !publishedById.has(id));
const factoryWithoutManifest = [...factoryIds].filter((id) => !manifestById.has(id));
const curatedWithoutManifest = [...curatedIds].filter((id) => !manifestById.has(id));
const duplicateManifestIds = [...manifestById.entries()].filter(([, list]) => list.length > 1);

const contentMismatches: string[] = [];
for (const [id, list] of manifestById) {
  const served = publishedById.get(id);
  const manifest = list[0];
  if (served === undefined || manifest?.question === undefined) continue;
  if (canonicalJson(manifest.question) !== canonicalJson(served)) contentMismatches.push(id);
}

table(
  ["check", "count", "verdict"],
  [
    ["published-manifests on disk", manifests.length, "—"],
    ["distinct question ids in manifests", manifestById.size, "—"],
    ["factoryPublishedQuestions in served bank", factoryIds.size, "—"],
    [
      "manifest with NO matching served question",
      manifestsWithoutQuestion.length,
      manifestsWithoutQuestion.length === 0 ? "OK" : "DRIFT",
    ],
    [
      "factory-published question with NO manifest",
      factoryWithoutManifest.length,
      factoryWithoutManifest.length === 0 ? "OK" : "DRIFT",
    ],
    [
      "manifest and served question DIFFER in content",
      contentMismatches.length,
      contentMismatches.length === 0 ? "OK" : "DRIFT",
    ],
    [
      "duplicate question id across manifests",
      duplicateManifestIds.length,
      duplicateManifestIds.length === 0 ? "OK" : "DRIFT",
    ],
    [
      "duplicate id inside publishedExamBank",
      duplicatePublishedIds.length,
      duplicatePublishedIds.length === 0 ? "OK" : "DRIFT",
    ],
    [
      "curated question with no manifest",
      curatedWithoutManifest.length,
      "EXPECTED (curated bank predates the factory)",
    ],
  ],
);

for (const [label, ids] of [
  ["manifest with no served question", manifestsWithoutQuestion],
  ["factory-published question with no manifest", factoryWithoutManifest],
  ["manifest/served content mismatch", contentMismatches],
  ["duplicate id in publishedExamBank", duplicatePublishedIds],
] as const) {
  if (ids.length === 0) continue;
  flagDrift(`${ids.length} x ${label}.`);
  console.log(`\n  ${label} (first 20):`);
  for (const id of ids.slice(0, 20)) console.log(`    ${id}`);
  if (ids.length > 20) console.log(`    ... and ${ids.length - 20} more`);
}

/* ---------- 6. Human approval evidence ---------- */

heading("6. HUMAN APPROVAL EVIDENCE for every question in publishedExamBank");

const approverKeyHits = manifests.flatMap((manifest) =>
  findApproverKeys(manifest).map((key) => `${manifest.file}: ${key}`),
);

note(
  "There is no `approvedBy` field anywhere in the manifest schema, the review " +
    "record schema, or the question schema — so the question is answered from " +
    "the strongest approval evidence each manifest actually carries. A key " +
    "scan for approvedBy/approver/signedOffBy/reviewedBy across all " +
    `${manifests.length} manifests found ${approverKeyHits.length} such field(s).`,
);
for (const hit of approverKeyHits.slice(0, 10)) console.log(`    ${hit}`);
console.log("");

const approvalCounts = new Map<ApprovalClass, number>();
for (const cls of APPROVAL_CLASSES) approvalCounts.set(cls, 0);
for (const question of published) {
  const cls = classifyApproval(manifestById.get(question.id)?.[0]);
  approvalCounts.set(cls, (approvalCounts.get(cls) ?? 0) + 1);
}

const humanApproved = approvalCounts.get(APPROVAL_CLASSES[4]) ?? 0;

table(
  ["approval evidence (strongest carried)", "questions", "% of published", "counts as human approval?"],
  APPROVAL_CLASSES.map((cls) => {
    const count = approvalCounts.get(cls) ?? 0;
    return [cls, count, percent(count, published.length), cls === APPROVAL_CLASSES[4] ? "YES" : "no"] as Cell[];
  }),
);

console.log("");
table(
  ["ANSWER", "count", "% of published"],
  [
    ["published questions WITH human-approval evidence", humanApproved, percent(humanApproved, published.length)],
    [
      "published questions WITHOUT human-approval evidence",
      published.length - humanApproved,
      percent(published.length - humanApproved, published.length),
    ],
  ],
);

/* Authorship is not approval — the single easiest number here to misread. */
const generatorIdentity = new Map<string, number>();
for (const manifest of manifests) {
  const identity = manifest.generatorAdapter?.identity;
  const key = `${identity?.provider ?? "?"} / ${identity?.modelId ?? "?"} (${manifest.generatorAdapter?.class ?? "?"})`;
  generatorIdentity.set(key, (generatorIdentity.get(key) ?? 0) + 1);
}
console.log("\n  Manifest GENERATOR identity — who WROTE the question, not who approved it:");
table(
  ["generator identity", "manifests"],
  [...generatorIdentity.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => [key, count] as Cell[]),
);
const humanAuthored = [...generatorIdentity.entries()]
  .filter(([key]) => key.startsWith("human /"))
  .reduce((sum, [, count]) => sum + count, 0);
note(
  `${humanAuthored} manifest(s) declare a HUMAN generator. That is authorship, ` +
    "not approval, and must never be reported as a review signal — a person " +
    "writing a question is not a second party approving it.",
);

const manifestEras = new Map<string, number>();
for (const manifest of manifests) {
  const version = manifestSchemaVersionOf(manifest);
  const era =
    version >= MANIFEST_SCHEMA_VERSION_CURRENT
      ? `v${version} (carries a verifiable review chain)`
      : `v${version} legacy (chain consumed at publish; unverifiable)`;
  manifestEras.set(era, (manifestEras.get(era) ?? 0) + 1);
}
console.log("\n  Manifest schema era:");
table(
  ["era", "manifests"],
  [...manifestEras.entries()].sort((a, b) => b[1] - a[1]).map(([era, count]) => [era, count] as Cell[]),
);

if (humanApproved === 0) {
  flagDrift(
    `0 of ${published.length} served-as-published questions carry evidence of human approval.`,
  );
}

/* ---------- Drift summary ---------- */

heading("DRIFT SUMMARY");

if (drift.length === 0) {
  console.log("  No drift detected.");
} else {
  console.log(`  !! ${drift.length} issue(s) requiring attention:\n`);
  for (const [index, message] of drift.entries()) {
    for (const [lineIndex, line] of wrap(message, 72).entries()) {
      console.log(lineIndex === 0 ? `  ${String(index + 1).padStart(2)}. ${line}` : `      ${line}`);
    }
  }
}

console.log("");
note(
  "This script is read-only and reports measured state. It exits 0 even when " +
    "drift is found, so it can be run freely in any context; act on the DRIFT " +
    "SUMMARY above.",
);
console.log("");
