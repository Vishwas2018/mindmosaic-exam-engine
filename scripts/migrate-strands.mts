/**
 * Migrates `metadata.strand` from the platform's internal taxonomy to the
 * official NAPLAN and ICAS strand sets (exam-fidelity backlog item 3).
 *
 * Run `npx tsx scripts/migrate-strands.mts` for a dry run (reports what
 * would change, writes nothing); add `--apply` to rewrite files.
 *
 * Why the mapping lives here as data. Every decision this migration
 * encodes is a judgement about someone else's taxonomy, and the two that
 * the backlog flags as open (which reading axis; where Vocabulary belongs)
 * are decided in STRAND_MAP and SKILL_OVERRIDES below and nowhere else.
 * Changing an answer is an edit to one table and a re-run, not a rewrite —
 * which matters because the script is re-runnable: mapping an
 * already-migrated strand to itself is a no-op, so a corrected table can be
 * applied over a previous run.
 *
 * Two levels, because one is not enough:
 *
 *   STRAND_MAP     old strand label -> new label, per subject and exam
 *                  style. Handles the cases where the old strand alone
 *                  determines the new one.
 *   SKILL_OVERRIDES consulted FIRST. Some old strands name the text type or
 *                  the content area and say nothing about the axis the new
 *                  taxonomy is organised on — "Narrative comprehension"
 *                  does not tell you whether an item is locating,
 *                  integrating or analysing, and "Science inquiry" does not
 *                  say which of ICAS's five skill strands applies. For
 *                  those the skill text is the only signal in the data.
 *
 * Anything neither table resolves is reported as UNMAPPED and left
 * untouched. That is deliberate: a wrong strand is worse than an old one,
 * because it is invisible. The unmapped list is the human review queue.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { questionBank } from "../src/content/questions/question-bank";
import { getStrandsForSubject } from "../src/features/taxonomy/subject-registry";
import type { ExamStyle } from "../src/schemas/question.schema";

const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();

/** Marks a case the migration refuses to guess. */
const UNMAPPED = null;

type Mapping = Record<string, string>;

/**
 * old strand label -> new official label, keyed `subject|examStyle`.
 * Labels are compared case-insensitively (content casing drifts between
 * authoring batches — see isKnownStrandLabel in the subject registry).
 */
const STRAND_MAP: Record<string, Mapping> = {
  /* NAPLAN numeracy collapses to the three Australian Curriculum strands. */
  "numeracy|naplan_style": {
    "number and algebra": "Number and algebra",
    number: "Number and algebra",
    "number and place value": "Number and algebra",
    patterns: "Number and algebra",
    fractions: "Number and algebra",
    "money and financial mathematics": "Number and algebra",
    "measurement and geometry": "Measurement and geometry",
    measurement: "Measurement and geometry",
    geometry: "Measurement and geometry",
    statistics: "Statistics and probability",
    "statistics and probability": "Statistics and probability",
    /* Factory-taxonomy-only labels: these never appear in the bank but the
       generator still speaks them. */
    chance: "Statistics and probability",
    "patterns and algebra": "Number and algebra",
  },
  /* ICAS Mathematics splits number from algebra, and measures from space,
     so two of the old strands need the skill text to place them. */
  "numeracy|icas_style": {
    number: "Number & Arithmetic",
    "number and place value": "Number & Arithmetic",
    fractions: "Number & Arithmetic",
    "money and financial mathematics": "Number & Arithmetic",
    patterns: "Algebra & Patterns",
    measurement: "Measures & Units",
    geometry: "Space & Geometry",
    statistics: "Chance & Data",
    "statistics and probability": "Chance & Data",
    /* "number and algebra" and "measurement and geometry" are resolved by
       SKILL_OVERRIDES; listed here only as the fallback when no skill rule
       matches. Arithmetic and measures are the larger halves in this bank. */
    "number and algebra": "Number & Arithmetic",
    "measurement and geometry": "Measures & Units",
    "patterns and algebra": "Algebra & Patterns",
    chance: "Chance & Data",
  },
  /* NAPLAN reading: the PROFICIENCY axis (see the report accompanying this
     change). The old strands are a mix of proficiency names, which map
     directly, and text-type names, which do not — those go to
     SKILL_OVERRIDES and, failing that, to the unmapped queue. */
  "reading|naplan_style": {
    "literal comprehension": "Locating and identifying",
    sequencing: "Locating and identifying",
    inference: "Integrating and interpreting",
    "main idea": "Integrating and interpreting",
    "vocabulary in context": "Integrating and interpreting",
    vocabulary: "Integrating and interpreting",
    "fact and opinion": "Analysing and evaluating",
    "author's craft": "Analysing and evaluating",
    "figurative language": "Analysing and evaluating",
    "text features": "Analysing and evaluating",
  },
  /* ICAS English. There is no ICAS reading paper; these items are English
     comprehension and vocabulary (backlog item 4 folds the subject id
     itself into `english` — out of scope here). */
  "reading|icas_style": {
    "reading comprehension": "Text Comprehension",
    "narrative comprehension": "Text Comprehension",
    "information text comprehension": "Text Comprehension",
    "information texts": "Text Comprehension",
    "literary text comprehension": "Text Comprehension",
    "procedural text comprehension": "Text Comprehension",
    "everyday text comprehension": "Text Comprehension",
    "poetry comprehension": "Text Comprehension",
    "persuasive text comprehension": "Text Comprehension",
    inference: "Text Comprehension",
    "literal comprehension": "Text Comprehension",
    "vocabulary in context": "Vocabulary",
    vocabulary: "Vocabulary",
    "language in narrative": "Writer's Craft",
    "author's craft": "Writer's Craft",
    "figurative language": "Writer's Craft",
    "text features": "Writer's Craft",
    "fact and opinion": "Text Comprehension",
    "main idea": "Text Comprehension",
    sequencing: "Text Comprehension",
    /* Factory-taxonomy-only label; never appears in the bank. */
    comprehension: "Text Comprehension",
  },
  /* NAPLAN conventions of language is exactly three strands. Parts of
     speech and text structure ARE grammar in that framework. Vocabulary is
     not assessed by this paper at all — the backlog's finding — so it is
     deliberately absent and its items go to the unmapped queue rather than
     being forced into Grammar. */
  "language_conventions|naplan_style": {
    spelling: "Spelling",
    grammar: "Grammar",
    punctuation: "Punctuation",
    "parts of speech": "Grammar",
    "text structure": "Grammar",
    phonics: "Spelling",
  },
  /* ICAS has no language-conventions paper; these are ICAS English, where
     grammar and punctuation both sit under Syntax. Spelling items have no
     home here (ICAS Spelling Bee is its own subject) and are left unmapped. */
  "language_conventions|icas_style": {
    grammar: "Syntax",
    punctuation: "Syntax",
    "parts of speech": "Syntax",
    vocabulary: "Vocabulary",
    "logical language reasoning": "Vocabulary",
    "text structure": "Writer's Craft",
  },
  /* ICAS Science: four knowledge strands plus five skills strands. The old
     bank has one undifferentiated "Science inquiry" covering all five, so
     that one is resolved by skill. */
  "science|icas_style": {
    "biological sciences": "Life & Living",
    "chemical sciences": "Natural & Processed Materials",
    "physical sciences": "Energy & Change",
    "earth and space sciences": "Earth & Beyond",
  },
  /* ICAS Digital Technologies. The official set is application-oriented
     (word processing, spreadsheets, email) where the old internal set was
     curriculum-oriented (citizenship, data, algorithms), so this is the
     least clean mapping in the migration — see the report. */
  "digital_technologies|icas_style": {
    "digital systems": "Digital Systems",
    algorithms: "Programming",
    "algorithms and programming": "Programming",
    data: "Spreadsheets & Databases",
    "data and information": "Spreadsheets & Databases",
    "digital citizenship and safety": "Internet & Email",
    "safe and responsible use": "Internet & Email",
  },
  /* ICAS Spelling Bee organises by the KIND of spelling knowledge a word
     tests, which cuts across the old rule-based grouping — most of this
     subject is resolved by skill. */
  "spelling|icas_style": {
    "phonic patterns": "Phonological",
    "morphology and word building": "Morphological",
    "homophones and confusable words": "Visual",
  },
};

/**
 * Skill-text rules, consulted before STRAND_MAP. Each entry is
 * `[subject|examStyle, oldStrandLabel or "*", /skill pattern/, newLabel]`.
 * First match wins, so order is significant.
 */
const SKILL_OVERRIDES: Array<[string, string, RegExp, string]> = [
  // --- ICAS Mathematics: split the two composite strands -----------------
  ["numeracy|icas_style", "number and algebra", /pattern|sequence|rule|unknown|backwards/i, "Algebra & Patterns"],
  ["numeracy|icas_style", "measurement and geometry", /shape|symmetr|solid|face|angle|2d|3d|polygon|parallelogram|circle|grid|coordinate/i, "Space & Geometry"],
  ["numeracy|icas_style", "measurement and geometry", /unit|length|capacit|mass|time|scale|calendar|perimeter|area|litre|millilitre/i, "Measures & Units"],
  ["numeracy|icas_style", "geometry", /coordinate|grid|distance/i, "Space & Geometry"],

  // --- NAPLAN reading: proficiency from the cognitive verb ---------------
  ["reading|naplan_style", "*", /^locating|^finding|^recalling|^reading a table|directly stated|following a specific step|find a fact|find the reason|find a detail|finding information|finding the reason|using headings/i, "Locating and identifying"],
  ["reading|naplan_style", "*", /inferr?ing|drawing a conclusion|predicting|main idea|working out how|working out why|working out a word|working out the meaning|interpreting|integrating|combining two facts|straightforward inference|cause and effect|following cause/i, "Integrating and interpreting"],
  ["reading|naplan_style", "*", /author'?s purpose|purpose (for|of)|explaining how|effect of|comparing|why an author|distinguishing|classifying|evaluat|analys|mood|word choice|comparison shows|audience|written for|condition in a text/i, "Analysing and evaluating"],

  // --- ICAS Science: which of the five skills strands ---------------------
  ["science|icas_style", "science inquiry", /variable|kept the same|steps of an investigation|fair test/i, "Investigating"],
  ["science|icas_style", "science inquiry", /conclusion|concluding|predict/i, "Predicting & Concluding"],
  ["science|icas_style", "science inquiry", /results table|graph|interpret|reading data/i, "Interpreting"],
  ["science|icas_style", "science inquiry", /measur|observ/i, "Observing & Measuring"],
  ["science|icas_style", "science inquiry", /claim|reason|problem/i, "Reasoning & Problem Solving"],

  // --- ICAS Spelling Bee: the kind of knowledge the word tests -----------
  ["spelling|icas_style", "*", /prefix|suffix|plural|adding -|doubling|base word|morpholog|-ing|-ed|-tion|-ous|-able|un-|re-|dis-|mis-|-es|-ies/i, "Morphological"],
  ["spelling|icas_style", "*", /homophone|silent letter|tricky|proofread|misspel|double (consonant|letter)|magic e/i, "Visual"],
  ["spelling|icas_style", "*", /vowel|blend|digraph|syllable|phonic|sound|soft c|soft g|short vowel|long /i, "Phonological"],
  ["spelling|icas_style", "*", /australian spelling|origin|etymolog|greek|latin/i, "Etymological"],
  ["spelling|icas_style", "phonics and word building", /./, "Phonological"],
  ["spelling|icas_style", "spelling rules and conventions", /./, "Visual"],
  ["spelling|icas_style", "spelling", /./, "Visual"],
];

const norm = (s: string): string => s.trim().toLocaleLowerCase("en-AU");

function resolve(
  subject: string,
  examStyle: string,
  strand: string,
  skill: string,
): string | typeof UNMAPPED {
  const key = `${subject}|${examStyle}`;
  const oldLabel = norm(strand);

  /* Idempotency, taken from the registry rather than from a hand-kept list
     of "new" labels that would drift from it. A strand already sitting on
     an official label for its own style is done — without this, a second
     run reports its own output as unmapped and the script is single-use.
     Legacy strands deliberately do NOT count: their questions are exactly
     the ones still awaiting a human decision, so they must keep surfacing
     in the unmapped queue on every run. */
  const registered = getStrandsForSubject(subject, examStyle as ExamStyle).find(
    (s) => norm(s.label) === oldLabel,
  );
  if (registered && !registered.legacy) return registered.label;

  for (const [k, strandMatch, pattern, next] of SKILL_OVERRIDES) {
    if (k !== key) continue;
    if (strandMatch !== "*" && norm(strandMatch) !== oldLabel) continue;
    if (pattern.test(skill)) return next;
  }

  const map = STRAND_MAP[key];
  if (!map) return UNMAPPED;
  return map[oldLabel] ?? UNMAPPED;
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

interface Move {
  readonly id: string;
  readonly subject: string;
  readonly examStyle: string;
  readonly from: string;
  readonly to: string;
}

const moves: Move[] = [];
const unmapped: Array<{ id: string; subject: string; examStyle: string; strand: string; skill: string }> = [];
const unchanged: string[] = [];

for (const q of questionBank) {
  const subject = q.metadata.subject as string;
  const examStyle = q.examStyle as string;
  const strand = (q.metadata.strand as string) ?? "";
  const skill = ((q.metadata.skill as string) ?? "") + " " + ((q.metadata.topic as string) ?? "");

  const next = resolve(subject, examStyle, strand, skill);
  if (next === UNMAPPED) {
    unmapped.push({ id: q.id, subject, examStyle, strand, skill: (q.metadata.skill as string) ?? "" });
    continue;
  }
  /* Exact comparison, not normalised: "Measurement and Geometry" and
     "Measurement and geometry" are the same strand to isKnownStrandLabel
     but only one of them is the official label, and leaving both in the
     content re-creates the casing drift this migration exists to end. A
     case-only difference is still a move. */
  if (next === strand) {
    unchanged.push(q.id);
    continue;
  }
  moves.push({ id: q.id, subject, examStyle, from: strand, to: next });
}

const newStrandById = new Map(moves.map((m) => [m.id, m.to]));
/** Every question id in the bank — see the `currentId` guard in the walk. */
const questionIds = new Set(questionBank.map((q) => q.id));

// ---------------------------------------------------------------------------
// Rewrite
//
// Content files are TypeScript literals, and one file can hold more than one
// subject (grade-3/icas-english.ts holds both reading and
// language_conventions items), so a per-file find/replace would apply the
// wrong subject's mapping. Instead each file is walked line by line tracking
// which question object is open — `id:` always precedes `metadata.strand:`
// within an object — and only that question's strand line is rewritten.
// ---------------------------------------------------------------------------

const TS_FILES = [
  ...["icas-digital-technologies", "icas-english", "icas-mathematics", "icas-numeracy", "icas-science", "icas-spelling", "naplan-language", "naplan-numeracy", "naplan-reading"].map((f) => `src/content/questions/grade-3/${f}.ts`),
  ...["icas-digital-technologies", "icas-english", "icas-mathematics", "icas-spelling", "naplan-language", "naplan-numeracy", "naplan-reading"].map((f) => `src/content/questions/grade-5/${f}.ts`),
];

let filesTouched = 0;
let linesRewritten = 0;

for (const rel of TS_FILES) {
  const path = join(ROOT, rel);
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    continue;
  }
  const lines = text.split(/\r?\n/);
  let currentId: string | null = null;
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    /* Both key styles occur, sometimes in the same file: the hand-authored
       seeds use `id:` / `strand:` while the ingested batches kept their
       JSON quoting as `"id":` / `"strand":`. Matching only one silently
       migrated a third of the bank and left the rest on old strands, which
       is the worst possible outcome — so the quotes are optional here and
       the original style is preserved on write. */
    const idMatch = /^\s*"?id"?:\s*"([^"]+)"/.exec(lines[i]);
    /* Only question-level ids may open a new block. Options, interaction
       targets and visual regions all carry their own `id:` and all appear
       BETWEEN the question id and its metadata — so tracking every id seen
       left `currentId` pointing at an option like "a" by the time the
       strand line arrived, and two thirds of the bank was silently skipped.
       Checking membership of the real id set is what makes the walk
       correct without needing a parser. */
    if (idMatch && questionIds.has(idMatch[1])) {
      currentId = idMatch[1];
      continue;
    }
    const strandMatch = /^(\s*)("?)strand\2:\s*"([^"]*)"(,?)\s*$/.exec(lines[i]);
    if (!strandMatch || currentId === null) continue;
    const next = newStrandById.get(currentId);
    if (next === undefined) continue;
    lines[i] = `${strandMatch[1]}${strandMatch[2]}strand${strandMatch[2]}: "${next}"${strandMatch[4]}`;
    changed = true;
    linesRewritten += 1;
  }

  if (changed && APPLY) {
    writeFileSync(path, lines.join("\n"), "utf8");
    filesTouched += 1;
  } else if (changed) {
    filesTouched += 1;
  }
}

// ---------------------------------------------------------------------------
// Staging batches
//
// content/manual-questions/** is the authoring staging tree, not the shipped
// bank (validate:questions never reads it). It is migrated anyway so a batch
// promoted after this change does not reintroduce the old taxonomy — the
// whole point of registering official strands is undone by the first ingest
// that still speaks the internal one.
//
// _conflicts/ is deliberately skipped: it holds a quarantined duplicate
// awaiting a human decision, and rewriting evidence before someone has
// looked at it is not this script's call.
// ---------------------------------------------------------------------------

interface StagingQuestion {
  id?: string;
  examStyle?: string;
  metadata?: { subject?: string; strand?: string; skill?: string; topic?: string };
}

let stagingFiles = 0;
let stagingMoved = 0;
let stagingUnmapped = 0;

function migrateStaging(): void {
  let paths: string[] = [];
  try {
    paths = execSync(
      'git ls-files -co --exclude-standard "content/manual-questions/**/*.json"',
      { cwd: ROOT, encoding: "utf8" },
    )
      .split(/\r?\n/)
      .filter((p) => p && !p.includes("_conflicts/") && !p.endsWith(".audit.json"));
  } catch {
    return;
  }

  for (const rel of paths) {
    const path = join(ROOT, rel);
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch {
      continue;
    }
    const container = parsed as { questions?: StagingQuestion[] };
    const list: StagingQuestion[] = Array.isArray(parsed)
      ? (parsed as StagingQuestion[])
      : (container.questions ?? []);
    if (list.length === 0) continue;

    let changed = false;
    for (const q of list) {
      const subject = q.metadata?.subject ?? "";
      const examStyle = q.examStyle ?? "";
      const strand = q.metadata?.strand ?? "";
      if (!subject || !examStyle || !strand) continue;
      const skill = `${q.metadata?.skill ?? ""} ${q.metadata?.topic ?? ""}`;
      const next = resolve(subject, examStyle, strand, skill);
      if (next === UNMAPPED) {
        stagingUnmapped += 1;
        continue;
      }
      if (next === strand) continue;
      q.metadata!.strand = next;
      stagingMoved += 1;
      changed = true;
    }

    if (changed) {
      stagingFiles += 1;
      if (APPLY) writeFileSync(path, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
    }
  }
}

migrateStaging();

// ---------------------------------------------------------------------------
// Question-factory taxonomy
//
// src/features/question-factory/taxonomy/entries.ts carries its own `strand`
// per skill — it is what the generator stamps onto new questions. Left alone,
// the very next generated batch would reintroduce the internal taxonomy, so
// it migrates with everything else.
//
// One wrinkle it cannot fix by itself: a TaxonomyEntry declares
// `examStyles` as a LIST, and 22 entries claim both styles. NAPLAN and ICAS
// disagree about the strand for those skills (a language-conventions grammar
// skill is "Grammar" under NAPLAN and "Syntax" under ICAS), and one entry
// holds one strand. They are migrated on their FIRST declared style and
// reported, rather than having their `examStyles` narrowed: narrowing would
// silently drop the generator's ability to author that skill for the other
// exam, which is a worse outcome than a strand that has to be re-derived at
// generation time. See the report.
// ---------------------------------------------------------------------------

const ENTRIES_PATH = "src/features/question-factory/taxonomy/entries.ts";

/**
 * Which subjects' factory entries this migration touches.
 *
 * The ICAS-only subjects, and deliberately not numeracy, reading or
 * language_conventions. Two reasons, both discovered by trying it:
 *
 *   - The factory pipeline checks a candidate's strand against its taxonomy
 *     entry's strand, and 44 test fixture files pin the old labels
 *     ("Number", "Statistics", "Comprehension"). Migrating those three
 *     subjects turns 138 factory tests red until every fixture is updated —
 *     a job in its own right, and not "questions in content/".
 *   - They are also the three subjects carrying dual-style entries, where
 *     one entry cannot hold both taxonomies' strand (see above).
 *
 * The ICAS-only subjects have neither problem: no fixture references them
 * and every entry is single-style. Migrating them now keeps the science
 * entries consistent with the registry (subject-registry.test.ts asserts
 * exactly that) instead of leaving the whole file stale.
 */
const FACTORY_SUBJECTS = new Set(["science", "digital_technologies", "spelling"]);
let factoryMoved = 0;
let factorySkipped = 0;
const factoryUnmapped: string[] = [];

function migrateFactoryTaxonomy(): void {
  const path = join(ROOT, ENTRIES_PATH);
  let lines: string[];
  try {
    lines = readFileSync(path, "utf8").split(/\r?\n/);
  } catch {
    return;
  }

  /* Entries are flat object literals in source order; subject/examStyles are
     declared before strand within each, so a forward walk holds the right
     context by the time the strand line arrives. */
  let subject = "";
  let displayName = "";
  let styles: string[] = [];
  let changed = false;

  for (let i = 0; i < lines.length; i += 1) {
    const styleMatch = /^\s*examStyles:\s*\[([^\]]*)\]/.exec(lines[i]);
    if (styleMatch) {
      styles = [...styleMatch[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
      continue;
    }
    /* The entry's displayName stands in for the question-side skill text, so
       the SKILL_OVERRIDES rules can resolve the composite strands here too —
       without it "Spelling Rules and Conventions" has nothing to split on and
       every such entry lands in the unmapped queue. */
    const nameMatch = /^\s*displayName:\s*"([^"]+)"/.exec(lines[i]);
    if (nameMatch) {
      displayName = nameMatch[1];
      continue;
    }
    const subjMatch = /^\s*subject:\s*"([^"]+)"/.exec(lines[i]);
    if (subjMatch) {
      subject = subjMatch[1];
      continue;
    }
    const strandMatch = /^(\s*)strand:\s*"([^"]*)"(,?)\s*$/.exec(lines[i]);
    if (!strandMatch || !subject || styles.length === 0) continue;
    if (!FACTORY_SUBJECTS.has(subject)) {
      factorySkipped += 1;
      continue;
    }

    const current = strandMatch[2];
    const next = resolve(subject, styles[0], current, displayName);
    if (next === UNMAPPED) {
      factoryUnmapped.push(`${subject}/${styles[0]}: ${current}`);
      continue;
    }
    if (next === current) continue;
    lines[i] = `${strandMatch[1]}strand: "${next}"${strandMatch[3]}`;
    factoryMoved += 1;
    changed = true;
  }

  if (changed && APPLY) writeFileSync(path, lines.join("\n"), "utf8");
}

migrateFactoryTaxonomy();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const byPair = new Map<string, number>();
for (const m of moves) {
  const k = `${m.subject}/${m.examStyle}: ${m.from} -> ${m.to}`;
  byPair.set(k, (byPair.get(k) ?? 0) + 1);
}

console.log(`\nStrand migration${APPLY ? "" : " (DRY RUN — pass --apply to write)"}`);
console.log("=".repeat(60));
console.log(`Questions in bank:     ${questionBank.length}`);
console.log(`Moved:                 ${moves.length}`);
console.log(`Already correct:       ${unchanged.length}`);
console.log(`UNMAPPED (review):     ${unmapped.length}`);
console.log(`Files rewritten:       ${filesTouched} (${linesRewritten} strand lines)`);
console.log(`Staging batches:       ${stagingMoved} moved in ${stagingFiles} files, ${stagingUnmapped} unmapped`);
console.log(`Factory taxonomy:      ${factoryMoved} moved, ${factorySkipped} deferred (see FACTORY_SUBJECTS), ${factoryUnmapped.length} unmapped`);
if (factoryUnmapped.length) { const c=new Map(); for (const u of factoryUnmapped) c.set(u,(c.get(u)??0)+1); console.log("  factory unmapped:"); for (const [k,n] of c) console.log(`      ${n}x ${k}`); }

console.log(`\nMoves by rule:`);
for (const [k, n] of [...byPair].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${k}`);
}

if (unmapped.length > 0) {
  const byReason = new Map<string, string[]>();
  for (const u of unmapped) {
    const k = `${u.subject}/${u.examStyle}: ${u.strand}`;
    if (!byReason.has(k)) byReason.set(k, []);
    byReason.get(k)!.push(`${u.id} (${u.skill})`);
  }
  console.log(`\nUNMAPPED — left on their existing strand, need a human decision:`);
  for (const [k, ids] of [...byReason].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(ids.length).padStart(4)}  ${k}`);
    for (const id of ids.slice(0, 3)) console.log(`          ${id}`);
    if (ids.length > 3) console.log(`          ...and ${ids.length - 3} more`);
  }
}

/* The strand -> skills grouping the registry needs, printed so the registry
   can be seeded from what the content actually holds rather than from a
   guess that then disagrees with it. */
if (process.argv.includes("--print-registry")) {
  const grouped = new Map<string, Map<string, Set<string>>>();
  for (const q of questionBank) {
    const subject = q.metadata.subject as string;
    const examStyle = q.examStyle as string;
    const skill = (q.metadata.skill as string) ?? "";
    const strand = newStrandById.get(q.id) ?? (q.metadata.strand as string);
    if (!grouped.has(subject)) grouped.set(subject, new Map());
    const inner = grouped.get(subject)!;
    const k = `${strand}||${examStyle}`;
    if (!inner.has(k)) inner.set(k, new Set());
    inner.get(k)!.add(skill);
  }
  console.log(`\n--- registry seed ---`);
  console.log(JSON.stringify([...grouped].map(([s, inner]) => [s, [...inner].map(([k, v]) => [k, [...v].sort()])]), null, 1));
}
