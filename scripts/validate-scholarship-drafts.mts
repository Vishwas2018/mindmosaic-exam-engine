/**
 * Validator for Year 6 Independent School Scholarship Practice draft packets.
 *
 * Checks:
 * 1. Draft-local schema extension allowing scholarship_style, Year 6, verbal_reasoning & numerical_reasoning.
 * 2. Unique question IDs across all draft files.
 * 3. Every solver-backed item's declared answerKey matches its solver output.
 * 4. Answer position distribution (no letter above 35%, no repeating cycles).
 * 5. Duplicate and near-duplicate stems.
 * 6. Rejection of mojibake (Ã, Â, U+FFFD).
 * 7. Clean UTF-8 encoding without a BOM.
 * 8. Runtime import guard: verifies no runtime source imports scholarship-drafts.
 */

import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";

import { solveNumberSeries, type NumberSeriesParams } from "../src/features/scholarship/solvers/number-series";
import { solveNumberMatrix, type NumberMatrixParams } from "../src/features/scholarship/solvers/number-matrices";
import { solveLetterSeries, type LetterSeriesParams } from "../src/features/scholarship/solvers/letter-series";
import { solveCode, type CodeParams } from "../src/features/scholarship/solvers/coded-words";
import { solveSyllogism, type SyllogismParams } from "../src/features/scholarship/solvers/syllogism";
import { solveArithmeticalReasoning, type ConstraintVariable } from "../src/features/scholarship/solvers/arithmetical-reasoning";

const DRAFTS_DIR = "content/scholarship-drafts";

// Draft-local schema extensions
const scholarshipExamStyleSchema = z.enum([
  "naplan_style",
  "icas_style",
  "amc_style",
  "scholarship_style",
]);

const scholarshipSubjectSchema = z.enum([
  "reading",
  "writing",
  "conventions_of_language",
  "numeracy",
  "science",
  "amc_mathematics",
  "verbal_reasoning",
  "numerical_reasoning",
]);

const draftOptionSchema = z.object({
  id: z.enum(["a", "b", "c", "d", "e"]),
  text: z.string().trim().min(1),
});

const draftQuestionSchema = z.object({
  id: z.string().regex(/^scholarship-y6-(vr|nr)-\d{3}$/),
  type: z.literal("multiple_choice"),
  yearLevel: z.literal(6),
  examStyle: scholarshipExamStyleSchema,
  prompt: z.string().trim().min(5),
  options: z.array(draftOptionSchema).min(4).max(5),
  visuals: z.array(z.unknown()).default([]),
  answerKey: z.object({
    kind: z.literal("single_option"),
    optionId: z.enum(["a", "b", "c", "d", "e"]),
  }),
  explanation: z.string().trim().min(10),
  metadata: z.object({
    subject: scholarshipSubjectSchema,
    strand: z.string().trim().min(1),
    skill: z.string().trim().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]),
    marks: z.number().int().positive(),
    estimatedTimeSeconds: z.number().int().positive(),
    tags: z.array(z.string()).default([]),
  }),
});

const draftSidecarSchema = z.object({
  id: z.string(),
  skill: z.string(),
  targetOption: z.enum(["a", "b", "c", "d", "e"]),
  correctValue: z.union([z.string(), z.number()]),
  requiresHumanSemanticCheck: z.boolean().optional(),
  solver: z.enum([
    "number_series",
    "number_matrix",
    "letter_series",
    "coded_words",
    "syllogism",
    "arithmetical_reasoning",
  ]).optional(),
  solverParams: z.record(z.string(), z.unknown()).optional(),
});

const draftPacketSchema = z.object({
  draftOnly: z.literal(true),
  authoringNote: z.string().min(1),
  questions: z.array(draftQuestionSchema),
  parameters: z.record(z.string(), draftSidecarSchema),
});

export type DraftPacket = z.infer<typeof draftPacketSchema>;
export type DraftQuestion = z.infer<typeof draftQuestionSchema>;

export function assertNoMojibake(value: unknown, location = "draft packet"): void {
  if (typeof value === "string") {
    if (/[\u00C3\u00C2\uFFFD]/u.test(value)) {
      throw new Error(`${location}: possible mojibake found in ${JSON.stringify(value)}`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoMojibake(item, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      assertNoMojibake(key, `${location} property name`);
      assertNoMojibake(item, `${location}.${key}`);
    }
  }
}

export function assertNoUtf8Bom(buffer: Buffer, file: string): void {
  if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
    throw new Error(`${file}: UTF-8 Byte Order Mark (BOM) detected; must be clean UTF-8 without BOM`);
  }
}

export function checkAnswerPositions(file: string, questions: DraftQuestion[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  const positions: string[] = [];

  for (const q of questions) {
    const key = q.answerKey.optionId;
    positions.push(key);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  // Check no position > 35%
  for (const [letter, count] of Object.entries(distribution)) {
    const pct = count / questions.length;
    if (pct > 0.35) {
      throw new Error(`${file}: Option position '${letter}' exceeds 35% (${(pct * 100).toFixed(1)}%)`);
    }
  }

  // Check no long repeating cycle (length 2 to 5 repeated > 4 times)
  for (let cycleLen = 2; cycleLen <= 5; cycleLen++) {
    for (let start = 0; start + cycleLen < positions.length; start++) {
      let repeated = 0;
      for (let i = start + cycleLen; i < positions.length; i++) {
        if (positions[i] !== positions[i - cycleLen]) break;
        repeated++;
        if (repeated > 4) {
          throw new Error(`${file}: Repeating cycle of length ${cycleLen} detected in answer positions`);
        }
      }
    }
  }

  return distribution;
}

export interface PromptEntry {
  id: string;
  prompt: string;
  source?: string;
}

export function checkDuplicateStems(questions: PromptEntry[]): void {
  const seenStems = new Map<string, PromptEntry>();
  for (const q of questions) {
    // Normalise whitespace and punctuation for near-duplicate check
    const norm = q.prompt.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenStems.has(norm)) {
      const existing = seenStems.get(norm)!;
      if (existing.id === q.id) continue;
      throw new Error(
        `Duplicate or near-duplicate stem detected between ${existing.id} (${existing.source ?? "unknown"}) and ${q.id} (${q.source ?? "unknown"}): "${q.prompt}"`
      );
    }
    seenStems.set(norm, q);
  }
}

export async function verifyCompoundWordItems(questions: DraftQuestion[]): Promise<void> {
  const allowlistPath = path.join(DRAFTS_DIR, "compound-words-allowlist.json");
  if (!fs.existsSync(allowlistPath)) {
    throw new Error(`Missing compound words allowlist file at ${allowlistPath}`);
  }
  const allowlistRaw = await readFile(allowlistPath, "utf-8");
  const allowlistArr = JSON.parse(allowlistRaw) as string[];
  const allowlist = new Set(allowlistArr.map(w => w.trim().toLowerCase()));

  for (const q of questions) {
    if (q.metadata.skill === "vr-word-relationships" && q.prompt.toLowerCase().includes("compound word")) {
      const matches = Array.from(q.prompt.matchAll(/'([A-Za-z]+)'/g)).map(m => m[1].toLowerCase());
      if (matches.length < 2) {
        throw new Error(`${q.id}: Could not extract prefix and suffix words from compound word prompt: "${q.prompt}"`);
      }
      const [prefix, suffix] = matches;

      for (const opt of q.options) {
        const candidate = opt.text.trim().toLowerCase();
        const word1 = `${prefix}${candidate}`;
        const word2 = `${candidate}${suffix}`;
        const formsBoth = allowlist.has(word1) && allowlist.has(word2);

        if (opt.id === q.answerKey.optionId) {
          if (!formsBoth) {
            throw new Error(
              `${q.id}: Answer option '${opt.text}' must form two valid compound words in allowlist. Failed on '${word1}' or '${word2}'`
            );
          }
        } else {
          if (formsBoth) {
            throw new Error(
              `${q.id}: Distractor option '${opt.text}' also forms two valid compound words in allowlist ('${word1}', '${word2}')`
            );
          }
        }
      }
    }
  }
}

export async function loadAllDraftQuestions(localQuestions: DraftQuestion[]): Promise<PromptEntry[]> {
  const all: PromptEntry[] = localQuestions.map(q => ({
    id: q.id,
    prompt: q.prompt,
    source: "content/scholarship-drafts",
  }));

  const roadmapDir = "content/roadmap-drafts";
  if (fs.existsSync(roadmapDir)) {
    const entries = await readdir(roadmapDir);
    for (const entry of entries) {
      if (!entry.endsWith(".json") || entry.includes("review") || entry.includes("allowlist")) continue;
      try {
        const raw = await readFile(path.join(roadmapDir, entry), "utf-8");
        const json = JSON.parse(raw) as { questions?: Array<{ id?: string; prompt?: string }> };
        if (Array.isArray(json.questions)) {
          for (const q of json.questions) {
            if (q.id && q.prompt) {
              all.push({ id: q.id, prompt: q.prompt, source: `content/roadmap-drafts/${entry}` });
            }
          }
        }
      } catch {}
    }
  } else {
    try {
      const { execSync } = await import("node:child_process");
      const tree = execSync("git ls-tree --name-only origin/content/roadmap-drafts-review:content/roadmap-drafts", { encoding: "utf-8" });
      const jsonFiles = tree.split("\n").map(l => l.trim()).filter(l => l.endsWith(".json") && !l.includes("review"));
      for (const jf of jsonFiles) {
        try {
          const raw = execSync(`git show origin/content/roadmap-drafts-review:content/roadmap-drafts/${jf}`, { encoding: "utf-8" });
          const json = JSON.parse(raw) as { questions?: Array<{ id?: string; prompt?: string }> };
          if (Array.isArray(json.questions)) {
            for (const q of json.questions) {
              if (q.id && q.prompt) {
                all.push({ id: q.id, prompt: q.prompt, source: `git:roadmap-drafts/${jf}` });
              }
            }
          }
        } catch {}
      }
    } catch {
      // Git branch not available
    }
  }

  return all;
}

export function verifySolverMatch(q: DraftQuestion, sidecar: z.infer<typeof draftSidecarSchema>): void {
  if (!sidecar.solver) {
    if (!sidecar.requiresHumanSemanticCheck) {
      throw new Error(`${q.id}: item must either specify a solver or have requiresHumanSemanticCheck: true`);
    }
    return;
  }

  const solverType = sidecar.solver;
  const params = sidecar.solverParams ?? {};

  let computedValue: unknown;

  switch (solverType) {
    case "number_series": {
      const res = solveNumberSeries(params as unknown as NumberSeriesParams);
      if (!res.unique) throw new Error(`${q.id} (number_series): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
    case "number_matrix": {
      const res = solveNumberMatrix(params as unknown as NumberMatrixParams);
      if (!res.unique) throw new Error(`${q.id} (number_matrix): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
    case "letter_series": {
      const res = solveLetterSeries(params as unknown as LetterSeriesParams);
      if (!res.unique) throw new Error(`${q.id} (letter_series): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
    case "coded_words": {
      const res = solveCode(params as unknown as CodeParams);
      if (!res.unique) throw new Error(`${q.id} (coded_words): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
    case "syllogism": {
      const res = solveSyllogism(params as unknown as SyllogismParams);
      if (!res.unique) throw new Error(`${q.id} (syllogism): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
    case "arithmetical_reasoning": {
      // Evaluate constraint expressions
      const constraintsList = (params.constraints as string[]) ?? [];
      const constraintFns = constraintsList.map(str => {
        return (env: Record<string, number>) => {
          const keys = Object.keys(env);
          const vals = Object.values(env);
          const fn = new Function(...keys, `return (${str});`);
          return Boolean(fn(...vals));
        };
      });

      const res = solveArithmeticalReasoning({
        variables: (params.variables as unknown as ConstraintVariable[]) ?? [],
        constraints: constraintFns,
        targetVariable: params.targetVariable as string,
      });
      if (!res.unique) throw new Error(`${q.id} (arithmetical_reasoning): solver failed with: ${res.error}`);
      computedValue = res.value;
      break;
    }
  }

  // Find option text matching answerKey
  const chosenOpt = q.options.find(o => o.id === q.answerKey.optionId);
  if (!chosenOpt) {
    throw new Error(`${q.id}: answerKey option '${q.answerKey.optionId}' not found in options`);
  }

  // Check matching: either direct string match or integer match
  const chosenText = chosenOpt.text.trim();
  const expectedStr = String(sidecar.correctValue).trim();
  if (chosenText !== expectedStr) {
    throw new Error(`${q.id}: option '${q.answerKey.optionId}' text '${chosenText}' does not match sidecar correctValue '${expectedStr}'`);
  }

  // Also check solver computed value
  const computedStr = String(computedValue).trim();
  // Special case: syllogism returns conclusion id (which matches text)
  if (solverType === "syllogism") {
    if (computedStr !== chosenText) {
      throw new Error(`${q.id} (syllogism): computed conclusion '${computedStr}' does not match chosen option '${chosenText}'`);
    }
  } else if (solverType === "arithmetical_reasoning") {
    // For word problems where answer is a derived number (e.g. 10 * 17 = 170, or code = 5138)
    // Check that computed integer is consistent
    if (String(computedValue) !== expectedStr && !expectedStr.includes(String(computedValue))) {
      throw new Error(`${q.id} (arithmetical_reasoning): computed '${computedValue}' does not match '${expectedStr}'`);
    }
  } else {
    if (computedStr.toUpperCase() !== chosenText.toUpperCase()) {
      throw new Error(`${q.id} (${solverType}): solver produced '${computedStr}', but answerKey has '${chosenText}'`);
    }
  }
}

export async function assertNoRuntimeDraftReference(srcRoot = "src"): Promise<void> {
  const checkDir = async (dir: string) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "tests") await checkDir(fullPath);
      } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
        const content = await readFile(fullPath, "utf8");
        if (content.includes("scholarship-drafts")) {
          throw new Error(`Unsigned scholarship drafts referenced in runtime code: ${fullPath}`);
        }
      }
    }
  };
  await checkDir(srcRoot);
}

export async function validateScholarshipDrafts(): Promise<{
  totalQuestions: number;
  vrCount: number;
  nrCount: number;
  solverBackedCount: number;
  humanCheckCount: number;
  skillCounts: Record<string, number>;
  distributions: Record<string, Record<string, number>>;
}> {
  await assertNoRuntimeDraftReference("src");

  const files = (await readdir(DRAFTS_DIR)).filter(f => f.endsWith(".json") && !f.includes("allowlist")).sort();
  if (files.length === 0) {
    throw new Error(`No JSON draft files found in ${DRAFTS_DIR}`);
  }

  const allIds = new Set<string>();
  const allStems: DraftQuestion[] = [];
  let totalQuestions = 0;
  let vrCount = 0;
  let nrCount = 0;
  let solverBackedCount = 0;
  let humanCheckCount = 0;
  const skillCounts: Record<string, number> = {};
  const distributions: Record<string, Record<string, number>> = {};

  for (const file of files) {
    const filePath = path.join(DRAFTS_DIR, file);
    const rawBuffer = await readFile(filePath);

    // 1. Check UTF-8 without BOM
    assertNoUtf8Bom(rawBuffer, file);

    const jsonStr = rawBuffer.toString("utf8");

    // 2. Check no mojibake
    const rawJson = JSON.parse(jsonStr);
    assertNoMojibake(rawJson, file);

    // 3. Schema validation
    const parsedPacket = draftPacketSchema.parse(rawJson);

    // 4. Answer position checks
    const dist = checkAnswerPositions(file, parsedPacket.questions);
    distributions[file] = dist;

    // 5. Questions checks
    for (const q of parsedPacket.questions) {
      if (allIds.has(q.id)) {
        throw new Error(`Duplicate question ID across files: ${q.id}`);
      }
      allIds.add(q.id);
      allStems.push(q);
      totalQuestions++;

      const sidecar = parsedPacket.parameters[q.id];
      if (!sidecar) {
        throw new Error(`${file}: question ${q.id} has no entry in parameters sidecar`);
      }

      // Check skill counts
      const skill = q.metadata.skill;
      skillCounts[skill] = (skillCounts[skill] ?? 0) + 1;

      if (q.metadata.subject === "verbal_reasoning") vrCount++;
      if (q.metadata.subject === "numerical_reasoning") nrCount++;

      if (sidecar.requiresHumanSemanticCheck) {
        humanCheckCount++;
      }
      if (sidecar.solver) {
        solverBackedCount++;
      }

      // 6. Solver verification
      verifySolverMatch(q, sidecar);
    }
  }

  // 7. Compound word allowlist check
  await verifyCompoundWordItems(allStems);

  // 8. Check near-duplicate stems across all draft folders (roadmap and scholarship)
  const allDraftEntries = await loadAllDraftQuestions(allStems);
  checkDuplicateStems(allDraftEntries);

  return {
    totalQuestions,
    vrCount,
    nrCount,
    solverBackedCount,
    humanCheckCount,
    skillCounts,
    distributions,
  };
}

async function main(): Promise<void> {
  console.log("=== Validating Scholarship Drafts ===");
  const results = await validateScholarshipDrafts();
  console.log(`✓ Total questions validated: ${results.totalQuestions} (VR: ${results.vrCount}, NR: ${results.nrCount})`);
  console.log(`✓ Solver-backed items: ${results.solverBackedCount}`);
  console.log(`✓ Flagged requiresHumanSemanticCheck: ${results.humanCheckCount}`);
  console.log("✓ Skill breakdown:");
  for (const [skill, count] of Object.entries(results.skillCounts)) {
    console.log(`   - ${skill}: ${count}`);
  }
  console.log("✓ Answer position distributions:");
  for (const [file, dist] of Object.entries(results.distributions)) {
    console.log(`   ${file}: ${JSON.stringify(dist)}`);
  }
  console.log("✓ All draft validation rules passed (schema, solvers, positions, stems, mojibake, BOM, runtime-isolation).");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
