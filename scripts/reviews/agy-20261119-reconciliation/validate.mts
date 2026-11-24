import "../../lib/allow-server-only.mts";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { z } from "zod";
import { questionBank } from "../../../src/content/questions/question-bank";
import {
  agyBatchSchema,
  agyManifestSchema,
  agyMockItemSchema,
  difficultyTargets,
  duplicatePairs,
  mockReservationTargets,
  targets,
  validateAgyItem,
  type Stem,
} from "./bank-validation";
import { privatePath } from "./private-path";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const types = { m: "numeracy", n: "numerical_reasoning", v: "verbal_reasoning", r: "reading", w: "writing" };
const approvedDraft = { status: z.literal("draft"), approvedBy: z.null() };
const replacementSchema = z.object({
  ...approvedDraft,
  forms: z.array(z.object({
    form: z.enum(["A", "B"]),
    items: z.array(agyMockItemSchema).length(50),
  }).strict()).length(2),
}).strict();

const counts = (values: string[]): Record<string, number> =>
  Object.fromEntries([...new Set(values)].sort().map((key) => [key, values.filter((v) => v === key).length]));

async function read(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readPrivate(path: string, scope: string) {
  const actual = await privatePath(path);
  const fromScope = relative(scope, actual);
  if (fromScope === ".." || fromScope.startsWith(".." + sep) || isAbsolute(fromScope)) throw new Error("Private input escapes its directory");
  return read(actual);
}

async function loadCorpus(): Promise<Stem[]> {
  const corpus: Stem[] = questionBank.map(({ id, prompt, stimulus }) => ({ id, prompt, stimulus }));
  function visit(value: unknown): void {
    if (!value || typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    if (typeof record.id === "string" && typeof record.prompt === "string") {
      const stimulus = record.stimulus as { body?: unknown } | undefined;
      corpus.push({ id: record.id, prompt: record.prompt, stimulus: typeof stimulus?.body === "string" ? { body: stimulus.body } : undefined });
    }
    Object.values(record).forEach(visit);
  }
  visit(await read(join(root, "content/vihaan-scholarship/pilot-01/draft.json")));
  for (const directory of ["content/scholarship-drafts", "src/content/questions/generated", "content/vihaan-scholarship/expansion-500"]) {
    for (const name of (await readdir(join(root, directory))).sort()) {
      if (!name.endsWith(".json")) continue;
      if (directory.endsWith("expansion-500") && !/^batch-[0-9]{2}\.draft\.json$/.test(name)) continue;
      visit(await read(join(root, directory, name)));
    }
  }
  return corpus;
}

async function main() {
  const { values } = parseArgs({ options: { bank: { type: "string" }, mocks: { type: "string" }, report: { type: "string" } } });
  if (!values.bank) throw new Error("Supply --bank with a private archive path");
  const bank = await privatePath(values.bank);
  if (!(await stat(bank)).isDirectory()) throw new Error("Bank input must be a directory");
  const manifest = agyManifestSchema.parse(await readPrivate(join(bank, "bank.draft.json"), bank));
  const batches = await Promise.all(manifest.batches.map(async ({ file, batchId }, index) => {
    const data = agyBatchSchema.parse(await readPrivate(join(bank, file), bank));
    if (data.batchId !== batchId || Number(batchId.slice(-2)) !== index + 1) {
      throw new Error("Archive manifest batch order mismatch");
    }
    return data;
  }));

  const archive = batches.flatMap(({ items }) => items);
  const corpus = await loadCorpus();
  const corpusIds = new Set(corpus.map(({ id }) => id));
  const archiveIds = new Set(archive.map(({ question }) => question.id));
  const overlappingArchiveIds = [...archiveIds].filter((id) => corpusIds.has(id)).length;
  const subjectCounts = counts(archive.map(({ question }) => question.metadata.subject));
  const difficultyCounts = counts(archive.map(({ question }) => question.metadata.difficulty));
  const reservations = counts(archive.filter((n) => n.reservedForMock).map(({ question }) => question.metadata.subject));
  const matches = (actual: Record<string, number>, expected: Record<string, number>) =>
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, count]) => actual[key] === count);
  const archiveDuplicates = duplicatePairs(archive.map(({ question }) => question), corpus);
  const archiveChecks = batches.map(({ items }) => items.map(validateAgyItem));
  const archiveItemFailures = archiveChecks.flat().filter(({ automated }) => automated === "FAIL").length;
  const archivePassed =
    archiveIds.size === 500 && overlappingArchiveIds === 0 && matches(subjectCounts, targets) &&
    matches(difficultyCounts, difficultyTargets) && matches(reservations, mockReservationTargets) &&
    archiveDuplicates.length === 0 && archiveItemFailures === 0;

  let mockDuplicates: ReturnType<typeof duplicatePairs> = [];
  let mocksReport: object | null = null;
  let mocksPassed = true;
  if (values.mocks) {
    const path = await privatePath(values.mocks);
    const mocks = replacementSchema.parse(await readPrivate(path, dirname(path)));
    const items = mocks.forms.flatMap((form) => form.items);
    const allMockIds = new Set(items.map(({ question }) => question.id));
    const bankPassages = new Set([...archive.map(({ question }) => question.stimulus?.body), ...corpus.map((record) => record.stimulus?.body)]);
    const seenPassages = new Set<string>();
    const formChecks = mocks.forms.map(({ form, items: formItems }, formIndex) => {
      const subjects = counts(formItems.map(({ question }) => question.metadata.subject));
      const passages = counts(formItems.flatMap(({ question }) => question.stimulus ? [question.stimulus.body] : []));
      const distinct = Object.keys(passages);
      const passageValid = distinct.length === 2 && distinct.every((body) =>
        passages[body] === 5 && !seenPassages.has(body) && !bankPassages.has(body));
      distinct.forEach((body) => seenPassages.add(body));
      const namespaceValid = formItems.every(({ question }) => {
        const suffix = question.id.slice(-5);
        const subject = types[suffix[2] as keyof typeof types];
        return suffix[0] === form.toLowerCase() && question.metadata.subject === subject;
      });
      return { form, subjects, passed: form === (formIndex === 0 ? "A" : "B") &&
        Object.entries(mockReservationTargets).every(([subject, count]) => subjects[subject] === count / 2) &&
        passageValid && namespaceValid };
    });
    mockDuplicates = duplicatePairs(items.map(({ question }) => question), [...corpus, ...archive.map(({ question }) => question)]);
    const failures = items.map(validateAgyItem).filter(({ automated }) => automated === "FAIL").length;
    const keys = counts(items.flatMap(({ question }) => question.answerKey.kind === "single_option" ? [question.answerKey.optionId] : []));
    const collisionCount = [...allMockIds].filter((id) => corpusIds.has(id) || archiveIds.has(id)).length;
    mocksPassed = allMockIds.size === 100 && collisionCount === 0 && formChecks.every(({ passed }) => passed) &&
      matches(keys, { a: 23, b: 23, c: 23, d: 23 }) && failures === 0 && mockDuplicates.length === 0;
    mocksReport = { passed: mocksPassed, checks: formChecks, keys, failures, collisionCount, duplicateFlags: counts(mockDuplicates.map(({ kind }) => kind)) };
  }
  if (values.report) {
    const outputDirectory = await privatePath(dirname(values.report));
    const detail = {
      archiveDuplicates,
      mockDuplicates,
      archiveChecks: archiveChecks.map((batch) => batch.map(({ id, automated, failures }) => ({ id, automated, failures }))),
    };
    await writeFile(join(outputDirectory, basename(values.report)), JSON.stringify(detail, null, 2) + "\n", { flag: "wx" });
  }
  console.log(JSON.stringify({
    archive: {
      passed: archivePassed, count: archive.length, subjects: subjectCounts, difficulties: difficultyCounts,
      exposedReservations: reservations, overlappingArchiveIds, archiveItemFailures,
      batchPasses: archiveChecks.map((items) => items.filter(({ automated }) => automated === "PASS").length),
      duplicateFlags: counts(archiveDuplicates.map(({ kind }) => kind)),
    },
    comparedCorpusRecords: corpus.length, mocks: mocksReport, approvedBy: null, publicationEligible: false,
  }, null, 2));
  process.exitCode = archivePassed && mocksPassed ? 0 : 1;
}

try {
  await main();
} catch (error) {
  // Do not print exception details because parse failures can quote private inputs.
  if (error instanceof z.ZodError) {
    console.error("Validation failed schema checks", error.issues.map(({ path, code }) => ({ path, code })));
  } else {
    console.error("Validation could not read or check the archive. Verify arguments and private input paths.");
  }
  process.exitCode = 1;
}
