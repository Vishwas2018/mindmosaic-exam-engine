import "./lib/allow-server-only.mts";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { questionBank } from "../src/content/questions/question-bank";
import { hash } from "./lib/vihaan-pilot";
import {
  agyBatchSchema,
  agyManifestSchema,
  difficultyTargets,
  duplicatePairs,
  mockReservationTargets,
  targets,
  validateAgyItem,
  type Stem,
} from "./lib/vihaan-agy-500";

const base = "content/vihaan-scholarship/bank-agy-500";
const read = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, "utf8"));

const corpus: Stem[] = questionBank.map((q) => ({ id: q.id, prompt: q.prompt }));
const corpusFiles: { path: string; sha256: string }[] = [];

const collectPromptsFromFile = async (path: string) => {
  const data = await read(path);
  corpusFiles.push({ path, sha256: hash(data) });
  const visit = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const obj = value as Record<string, unknown>;
    if (typeof obj.id === "string" && typeof obj.prompt === "string") {
      corpus.push({ id: obj.id, prompt: obj.prompt });
    }
    Object.values(obj).forEach(visit);
  };
  visit(data);
};

for (const directory of ["content/scholarship-drafts", "src/content/questions/generated"]) {
  for (const name of (await readdir(directory)).filter((n) => n.endsWith(".json")).sort()) {
    await collectPromptsFromFile(join(directory, name));
  }
}
await collectPromptsFromFile("content/vihaan-scholarship/pilot-01/draft.json");
for (const name of (await readdir("content/vihaan-scholarship/expansion-500"))
  .filter((n) => /^batch-\d{2}\.draft\.json$/.test(n))
  .sort()) {
  await collectPromptsFromFile(join("content/vihaan-scholarship/expansion-500", name));
}

const batchArg = process.argv.indexOf("--batch");
const batchNumber = batchArg < 0 ? null : Number(process.argv[batchArg + 1]);
if (batchNumber !== null && (!Number.isInteger(batchNumber) || batchNumber < 1 || batchNumber > 10)) {
  throw new Error("Use --batch 1 through 10");
}

const manifest =
  batchNumber === null ? agyManifestSchema.parse(await read(`${base}/bank.draft.json`)) : null;
const names = manifest
  ? manifest.batches.map((b) => b.file)
  : Array.from({ length: batchNumber! }, (_, i) => `batch-${String(i + 1).padStart(2, "0")}.draft.json`);

const batches = await Promise.all(
  names.map(async (file) => ({
    file,
    data: agyBatchSchema.parse(await read(`${base}/${file}`)),
  })),
);

const errors: string[] = [];
const seen = new Set<string>();

const expanded = batches.map(({ file, data }, index) => {
  const expectedBatchId = `vihaan-agy-${String(index + 1).padStart(2, "0")}`;
  if (data.batchId !== expectedBatchId) errors.push(`${file}: batch sequence mismatch`);
  if (manifest && manifest.batches[index].batchId !== data.batchId) {
    errors.push(`${file}: manifest batch mismatch`);
  }
  for (const { question: q } of data.items) {
    if (seen.has(q.id)) errors.push(`Duplicate item ID: ${q.id}`);
    seen.add(q.id);
  }
  return {
    file,
    data,
    items: data.items,
    checks: data.items.map((item) => validateAgyItem(item)),
  };
});

const items = expanded.flatMap((b) => b.items);
const checks = expanded.flatMap((b) => b.checks);
const duplicates = duplicatePairs(
  items.map((i) => i.question),
  corpus,
);
if (duplicates.length) {
  errors.push(`${duplicates.length} exact/near/parameter-only stem matches require revision`);
}
for (const item of checks) {
  if (item.failures.length) errors.push(`${item.id}: ${item.failures.join(", ")}`);
}

const count = (values: string[]) =>
  Object.fromEntries([...new Set(values)].sort().map((s) => [s, values.filter((v) => v === s).length]));

const subjects = count(items.map((i) => i.question.metadata.subject));
const difficulties = count(items.map((i) => i.question.metadata.difficulty));
const mockItems = items.filter((i) => i.reservedForMock);
const mockSubjects = count(mockItems.map((i) => i.question.metadata.subject));

if (manifest) {
  for (const [key, value] of Object.entries(targets)) {
    if (subjects[key] !== value) errors.push(`Wrong subject total ${key}: got ${subjects[key]}, expected ${value}`);
  }
  for (const [key, value] of Object.entries(difficultyTargets)) {
    if (difficulties[key] !== value) errors.push(`Wrong difficulty total ${key}: got ${difficulties[key]}, expected ${value}`);
  }
  for (const [key, value] of Object.entries(mockReservationTargets)) {
    if (mockSubjects[key] !== value) errors.push(`Wrong mock reservation total ${key}: got ${mockSubjects[key]}, expected ${value}`);
  }
  if (items.length !== 500 || seen.size !== 500) {
    errors.push(`Bank must contain 500 unique items, got ${items.length}`);
  }
  if (mockItems.length !== 100) {
    errors.push(`Mock reservation must contain exactly 100 items, got ${mockItems.length}`);
  }
}

const corpusSnapshot = {
  comparedRecords: corpus.length,
  curatedBankHash: hash(questionBank.map((q) => ({ id: q.id, prompt: q.prompt }))),
  files: corpusFiles,
  scope:
    "Curated questionBank stems, generated JSON banks, scholarship draft JSON, retained pilot, Codex/Cline expansion-500 batches, and all vihaan-agy-500 batches (earlier batches only in --batch mode). No external question corpus or copyright clearance.",
  nearDuplicateThreshold: 0.82,
  methods: [
    "normalised exact stems",
    "token Jaccard similarity >= 0.82",
    "identical wording after replacing numeric literals",
  ],
};

const selected = batchNumber === null ? expanded : expanded.filter((_, i) => i === batchNumber - 1);
const batchReports = selected.map((b) => {
  const ids = new Set(b.items.map((i) => i.question.id));
  const matches = duplicates.filter((p) => ids.has(p.a) || ids.has(p.b));
  return {
    batchId: b.data.batchId,
    version: 1,
    status: "draft",
    approvedBy: null,
    publicationEligible: false,
    sourceFile: b.file,
    sourceHash: hash(b.data),
    itemCount: b.items.length,
    reservedForMockCount: b.items.filter((i) => i.reservedForMock).length,
    visualItemCount: b.items.filter((i) => i.question.visuals.length > 0).length,
    automatedPassed: b.checks.filter((i) => i.automated === "PASS").length,
    duplicates: matches,
    passed: b.checks.every((i) => i.automated === "PASS") && !matches.length && !errors.length,
    subjectCounts: count(b.items.map((i) => i.question.metadata.subject)),
    difficultyCounts: count(b.items.map((i) => i.question.metadata.difficulty)),
    corpusSnapshotHash: hash(corpusSnapshot),
    checks: b.checks,
  };
});

if (process.argv.includes("--write-report")) {
  for (const report of batchReports) {
    await writeFile(
      `${base}/${report.sourceFile.replace(".draft.json", ".validation.json")}`,
      JSON.stringify(report, null, 2) + "\n",
    );
  }
  if (manifest) {
    const passages = [
      ...new Map(
        items.filter((i) => i.question.stimulus).map((i) => [i.question.stimulus!.title, i.question.stimulus!]),
      ).values(),
    ];
    const visualTypes = count(items.flatMap((i) => i.question.visuals.map((v) => v.type)));
    const report = {
      reportVersion: 1,
      generatedOn: "2026-11-18",
      bankId: manifest.bankId,
      status: "draft",
      approvedBy: null,
      passed: !errors.length,
      errors,
      total: items.length,
      approved: 0,
      published: 0,
      publicationEligible: false,
      mockReservedTotal: mockItems.length,
      mockReservedSubjects: mockSubjects,
      subjectCounts: subjects,
      difficultyCounts: difficulties,
      visualItemCount: items.filter((i) => i.question.visuals.length > 0).length,
      visualTypes,
      coverage: Object.fromEntries(
        Object.keys(targets).map((subject) => [
          subject,
          {
            count: subjects[subject],
            difficulty: count(
              items.filter((i) => i.question.metadata.subject === subject).map((i) => i.question.metadata.difficulty),
            ),
            skills: count(
              items
                .filter((i) => i.question.metadata.subject === subject)
                .map((i) => i.question.metadata.skill ?? i.question.metadata.topic),
            ),
          },
        ]),
      ),
      answerPositions: count(
        items.flatMap((i) => (i.question.answerKey.kind === "single_option" ? [i.question.answerKey.optionId] : [])),
      ),
      timeRanges: Object.fromEntries(
        Object.keys(targets).map((s) => [
          s,
          {
            minimumSeconds: Math.min(
              ...items.filter((i) => i.question.metadata.subject === s).map((i) => i.question.metadata.estimatedTimeSeconds),
            ),
            maximumSeconds: Math.max(
              ...items.filter((i) => i.question.metadata.subject === s).map((i) => i.question.metadata.estimatedTimeSeconds),
            ),
          },
        ]),
      ),
      passages: passages.map((p) => ({
        title: p.title,
        wordCount: p.body.split(/\s+/).filter(Boolean).length,
        questionCount: items.filter((i) => i.question.stimulus?.title === p.title).length,
      })),
      duplicateMatches: duplicates,
      corpus: corpusSnapshot,
      validation: {
        canonicalSchema: 500,
        taxonomyCheckedNonWriting: 460,
        manualWritingRubric: 40,
        independentArithmeticConsistency: checks.filter(
          (c) => c.arithmetic?.method === "independent_arithmetic_consistency" && c.arithmetic.passed,
        ).length,
        semanticAndNumericStemGrounding:
          "Pending blind human solutions. Arithmetic evidence is authored alongside content, not an independent semantic proof.",
        difficultyAndTiming: "Authored estimates, not psychometrically calibrated or official test timings.",
        originality:
          "Session-authored; no external question material used. Bounded internal similarity screening does not establish worldwide uniqueness.",
      },
      requiredHumanReview: [
        "Solve every MCQ without its key; justify rejection of each distractor.",
        "Check each reading key against passage evidence, including alternative interpretations.",
        "Check age suitability, difficulty and time estimates.",
        "Review originality, visual diagram clarity, and numerical stem-to-solution grounding.",
        "Onboard writing skills through the governed taxonomy before any publication.",
        "Record human approval through the existing governed lifecycle; this package cannot publish.",
      ],
      batches: batchReports.map((b) => ({
        batchId: b.batchId,
        sourceFile: b.batchId,
        sourceHash: b.sourceHash,
        itemCount: b.itemCount,
        reservedForMockCount: b.reservedForMockCount,
        visualItemCount: b.visualItemCount,
        automatedPassed: b.automatedPassed,
        passed: b.passed,
        subjectCounts: b.subjectCounts,
        difficultyCounts: b.difficultyCounts,
      })),
      sources: {
        manifestHash: hash(manifest),
        batchHashes: batchReports.map((b) => ({ file: b.sourceFile, hash: b.sourceHash })),
      },
    };
    await writeFile(`${base}/quality-coverage-report.json`, JSON.stringify(report, null, 2) + "\n");
  }
}

console.log(
  JSON.stringify(
    {
      mode: batchNumber === null ? "consolidated" : `batch-${batchNumber}`,
      passed: !errors.length,
      total: items.length,
      subjects,
      difficulties,
      mockReserved: mockItems.length,
      errors,
      duplicates: duplicates.slice(0, 20),
      batches: batchReports.map((b) => ({ batchId: b.batchId, itemCount: b.itemCount, passed: b.passed })),
    },
    null,
    2,
  ),
);

if (errors.length) process.exitCode = 1;
