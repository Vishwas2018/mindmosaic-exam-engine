import { readdirSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";

/**
 * Structural integrity tests for the Mission 2 fixture-preparation corpus
 * only. These prove the *fixture files themselves* are well-formed,
 * internally consistent, and reference real ids — they do not test any
 * duplicate-detection, correctness-verification, or difficulty-estimation
 * algorithm, because none exists yet on this branch. Also enforces the
 * private-data and inventory-accounting fixes from the Mission 2 STOP AND
 * FIX repair: no private paths/emails may reappear, and material harvest
 * counts must be independently reconstructable from records[], not merely
 * self-consistent with their own summary object.
 */

const FIXTURES_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/question-factory/mission2-calibration",
);

const REPORTS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../../docs/reports/mission2-fixture-prep",
);

function readJsonFixture<T>(fileName: string): { raw: string; data: T } {
  const raw = readFileSync(path.join(FIXTURES_DIR, fileName), "utf8");
  return { raw, data: JSON.parse(raw) as T };
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const ALLOWED_CLASSIFICATIONS = [
  "exact_duplicate",
  "near_duplicate",
  "structurally_similar_but_allowed",
  "distinct",
] as const;

const ALLOWED_SOURCE_CATEGORIES = [
  "harvest_internal",
  "harvest_vs_synthetic",
  "trusted_vs_synthetic_adversarial",
  "csv_vs_trusted",
  "synthetic_internal",
  "csv_internal",
  "trusted_vs_harvest",
] as const;

const ALLOWED_DIFFICULTY_OF_DECISION = ["easy", "medium", "hard"] as const;

interface CalibrationPair {
  readonly pairId: string;
  readonly leftId: string;
  readonly rightId: string;
  readonly expectedClassification: string;
  readonly rationale: string;
  readonly signals: readonly string[];
  readonly sourceCategory: string;
  readonly difficultyOfDecision: string;
}

interface DuplicatePairsFixture {
  readonly summary: {
    readonly totalPairs: number;
    readonly byClassification: Record<string, number>;
    readonly byDifficultyOfDecision: Record<string, number>;
    readonly bySourceCategory: Record<string, number>;
  };
  readonly pairs: readonly CalibrationPair[];
}

interface HarvestInventoryRecord {
  readonly sourceFile: string;
  readonly sourceFormat: string;
  readonly recordCount: number;
  readonly parseStatus: string;
  readonly yearLevel: unknown;
  readonly examStyle: unknown;
  readonly subject: unknown;
  readonly questionType: unknown;
  readonly duplicateFamilyMembership: unknown;
  readonly publicationSuitability: string;
  readonly malformedOrUnsupportedFields: readonly string[];
}

interface HarvestInventoryFixture {
  readonly summary: {
    readonly totalRecordsInventoried: number;
    readonly bySourceFormat: Record<string, number>;
    readonly byParseStatus: Record<string, number>;
    readonly byPublicationSuitability: Record<string, number>;
    readonly totalQuestionContentRecords: number;
    readonly totalUniqueQuestionContentRecords: number;
    readonly totalDuplicateCopyRecords: number;
    readonly csvFileCount: number;
    readonly csvDataRowCount: number;
    readonly validCsvDataRowCount: number;
    readonly malformedCsvRowCount: number;
    readonly filesystemEntryCount: number;
    readonly nonDataFilesystemEntriesExcludedFromRecords: number;
    readonly recordsWithMalformedOrUnsupportedFields: number;
  };
  readonly records: readonly HarvestInventoryRecord[];
}

interface TemplateFamiliesFixture {
  readonly summary: {
    readonly totalFamilies: number;
    readonly totalMembersAcrossFamilies: number;
  };
  readonly families: readonly { readonly familyId: string; readonly memberCount: number }[];
}

interface VerifierMatrixFixture {
  readonly summary: {
    readonly totalCategories: number;
    readonly categoriesWithConfirmedGap: number;
    readonly categoriesWithRepresentativeFixtures: number;
  };
  readonly categories: readonly {
    readonly category: string;
    readonly representativeFixtureIds: readonly string[];
    readonly gapNote?: string;
  }[];
}

function tally(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return counts;
}

describe("fixture files parse as valid, well-formed JSON", () => {
  const files = [
    "harvest-inventory.json",
    "duplicate-pairs.json",
    "calibration-corpus-content.json",
    "template-families.json",
    "correctness-verifier-matrix.json",
  ];

  it.each(files)("%s parses without throwing", (fileName) => {
    expect(() => readJsonFixture(fileName)).not.toThrow();
  });

  it.each(files)("%s contains no executable-code markers (pure data)", (fileName) => {
    const { raw } = readJsonFixture(fileName);
    expect(raw).not.toMatch(/\brequire\s*\(/);
    expect(raw).not.toMatch(/\bimport\s+[\s\S]{0,40}\bfrom\b/);
    expect(raw).not.toMatch(/<script/i);
  });
});

/**
 * STOP AND FIX repair: this branch had committed a real absolute Windows
 * user path (01-harvest-inventory.md) and a real personal Gmail address
 * (04-unsafe-content-report.md). This gate scans every Mission 2 report and
 * fixture file on disk (not a fixed file list, so newly added files are
 * covered automatically) and fails the build if either pattern reappears.
 */
const SYNTHETIC_EMAIL_DOMAINS = new Set([
  "example.com",
  "example.org",
  "example.net",
  "example.invalid",
]);

const ABSOLUTE_USER_PATH_PATTERNS: readonly RegExp[] = [
  /C:\\Users\\[^\\/"'`\s]+/i,
  /\/Users\/[^/"'`\s]+/,
  /\/home\/[^/"'`\s]+/,
];

const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

describe("Mission 2 fixture-integrity gate: no private paths or non-synthetic emails", () => {
  const scannedFiles = [...walk(REPORTS_DIR), ...walk(FIXTURES_DIR)];
  const relativeName = (file: string) => path.relative(path.dirname(REPORTS_DIR), file);

  it("scans a non-trivial number of report and fixture files", () => {
    expect(scannedFiles.length).toBeGreaterThanOrEqual(10);
  });

  it.each(scannedFiles)("%s contains no absolute local user path", (file) => {
    const text = readFileSync(file, "utf8");
    for (const pattern of ABSOLUTE_USER_PATH_PATTERNS) {
      expect(
        text.match(pattern),
        `${relativeName(file)} contains an absolute local user path matching ${pattern}`,
      ).toBeNull();
    }
  });

  it.each(scannedFiles)("%s contains no non-synthetic email address", (file) => {
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(EMAIL_PATTERN)) {
      const domain = (match[1] ?? "").toLowerCase();
      expect(
        SYNTHETIC_EMAIL_DOMAINS.has(domain),
        `${relativeName(file)} contains an email address on non-synthetic domain '${domain}'`,
      ).toBe(true);
    }
  });
});

describe("duplicate-pairs.json structural integrity", () => {
  const { data } = readJsonFixture<DuplicatePairsFixture>("duplicate-pairs.json");
  const { pairs } = data;

  it("has at least one pair", () => {
    expect(pairs.length).toBeGreaterThan(0);
  });

  it("every pairId is unique", () => {
    const ids = pairs.map((p) => p.pairId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every referenced leftId/rightId resolves to a known fixture id or a real trusted-bank id", () => {
    const { data: contentFixture } = readJsonFixture<{ entries: Record<string, unknown> }>(
      "calibration-corpus-content.json",
    );
    const contentIds = new Set(Object.keys(contentFixture.entries));
    const trustedIds = new Set(questionBank.map((q) => q.id));

    for (const pair of pairs) {
      for (const side of ["leftId", "rightId"] as const) {
        const id = pair[side];
        const resolvable = contentIds.has(id) || trustedIds.has(id);
        expect(resolvable, `pair ${pair.pairId}.${side} = '${id}' does not resolve`).toBe(true);
      }
    }
  });

  it("uses only the four allowed classification values", () => {
    for (const pair of pairs) {
      expect(ALLOWED_CLASSIFICATIONS).toContain(pair.expectedClassification);
    }
  });

  it("uses only a known, closed set of source categories", () => {
    for (const pair of pairs) {
      expect(ALLOWED_SOURCE_CATEGORIES).toContain(pair.sourceCategory);
    }
  });

  it("uses only the three allowed difficultyOfDecision values", () => {
    for (const pair of pairs) {
      expect(ALLOWED_DIFFICULTY_OF_DECISION).toContain(pair.difficultyOfDecision);
    }
  });

  it("every rationale is non-empty and substantive (not a placeholder)", () => {
    for (const pair of pairs) {
      expect(pair.rationale.trim().length, `pair ${pair.pairId} rationale`).toBeGreaterThan(20);
    }
  });

  it("every pair declares at least one signal", () => {
    for (const pair of pairs) {
      expect(pair.signals.length, `pair ${pair.pairId} signals`).toBeGreaterThan(0);
    }
  });

  it("leftId and rightId are always different within a pair", () => {
    for (const pair of pairs) {
      expect(pair.leftId, `pair ${pair.pairId}`).not.toBe(pair.rightId);
    }
  });

  it("includes at least one easy positive (exact_duplicate) and at least one hard negative (structurally_similar_but_allowed, difficultyOfDecision 'hard')", () => {
    expect(pairs.some((p) => p.expectedClassification === "exact_duplicate")).toBe(true);
    expect(
      pairs.some(
        (p) =>
          p.expectedClassification === "structurally_similar_but_allowed" &&
          p.difficultyOfDecision === "hard",
      ),
    ).toBe(true);
  });

  it("includes at least one pair for every required calibration family signal", () => {
    const allSignals = new Set(pairs.flatMap((p) => p.signals));
    const requiredSignals = [
      "content_hash_identity", // exact duplicates
      "case_folding", // case/punctuation variant
      "whitespace_normalisation", // whitespace variant
      "unicode_normalisation", // unicode variant
      "numeric_template", // number substitution
      "person_name_entity", // person-name substitution
      "place_name_entity", // place-name substitution
      "reordered_clauses", // reordered wording
      "reordered_answer_options", // reordered answer options
      "light_paraphrase", // paraphrase
      "shared_passage_template", // shared passage template
      "shared_distractor_template", // shared distractor template
      "visual_structure_fingerprint", // structurally identical visuals, changed labels
      "operation_change", // same numeric values, different operation
      "donor_tool_false_positive", // difficult negatives
    ];
    for (const signal of requiredSignals) {
      expect(allSignals.has(signal), `missing required signal '${signal}'`).toBe(true);
    }
  });

  it("includes at least one distinct pair sourced by comparing trusted-bank content against harvest content", () => {
    expect(
      pairs.some(
        (p) => p.expectedClassification === "distinct" && p.sourceCategory === "trusted_vs_harvest",
      ),
    ).toBe(true);
  });

  it("pairs are stored in deterministic pairId order", () => {
    const ids = pairs.map((p) => p.pairId);
    const sorted = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sorted);
  });

  it("summary.totalPairs matches the actual pair count", () => {
    expect(data.summary.totalPairs).toBe(pairs.length);
  });

  it("summary.byClassification matches a fresh tally of the pairs", () => {
    expect(data.summary.byClassification).toEqual(
      tally(pairs.map((p) => p.expectedClassification)),
    );
  });

  it("summary.byDifficultyOfDecision matches a fresh tally of the pairs", () => {
    expect(data.summary.byDifficultyOfDecision).toEqual(
      tally(pairs.map((p) => p.difficultyOfDecision)),
    );
  });

  it("summary.bySourceCategory matches a fresh tally of the pairs", () => {
    expect(data.summary.bySourceCategory).toEqual(tally(pairs.map((p) => p.sourceCategory)));
  });
});

describe("calibration-corpus-content.json structural integrity", () => {
  const { data } = readJsonFixture<{ entries: Record<string, { shape: string; source: string }> }>(
    "calibration-corpus-content.json",
  );

  it("every entry declares a known shape", () => {
    const allowedShapes = ["harvest_question_json", "trusted_question_schema", "csv_row"];
    for (const [id, entry] of Object.entries(data.entries)) {
      expect(allowedShapes, `entry '${id}'`).toContain(entry.shape);
    }
  });

  it("every entry declares a known source category", () => {
    const allowedSources = ["harvest", "harvest_csv", "synthetic_for_calibration"];
    for (const [id, entry] of Object.entries(data.entries)) {
      expect(allowedSources, `entry '${id}'`).toContain(entry.source);
    }
  });
});

describe("harvest-inventory.json structural integrity", () => {
  const { data } = readJsonFixture<HarvestInventoryFixture>("harvest-inventory.json");

  it("has at least one record", () => {
    expect(data.records.length).toBeGreaterThan(0);
  });

  it("records are stored in deterministic sourceFile order", () => {
    const files = data.records.map((r) => r.sourceFile);
    const sorted = [...files].sort((a, b) => a.localeCompare(b));
    expect(files).toEqual(sorted);
  });

  it("summary.totalRecordsInventoried matches the actual record count", () => {
    expect(data.summary.totalRecordsInventoried).toBe(data.records.length);
  });

  it("summary.recordsWithMalformedOrUnsupportedFields matches a fresh count", () => {
    const actual = data.records.filter((r) => r.malformedOrUnsupportedFields.length > 0).length;
    expect(data.summary.recordsWithMalformedOrUnsupportedFields).toBe(actual);
  });
});

/**
 * These tests recompute material inventory claims directly from
 * harvest-inventory.json's records[] array (or from documented, separately
 * transcribed constants) rather than reading them back off the fixture's own
 * pre-aggregated summary object. This is what previously let a report doc
 * (01-harvest-inventory.md) and the fixture drift apart — 426 vs 427
 * filesystem entries, and a `csv_row` key that actually counted CSV files (4)
 * rather than CSV data rows (29) — without any test catching it.
 *
 * The raw `_HARVEST` source tree is not committed to this repository (it is
 * an external, local scratch directory — see 01-harvest-inventory.md §1), so
 * the exact per-row malformed/valid CSV split cannot be mechanically
 * re-derived from records[] alone: each csv_file record carries one
 * aggregate `recordCount`, not a row-level breakdown. Where that limit
 * applies, the expected value is a literal pinned here from the donor's own
 * documented deliberately-invalid rows (`invalid-mixed.csv`, see
 * 02-parser-analysis.md §4), independently transcribed rather than read from
 * this fixture's summary — the strongest non-circular check available
 * without the raw CSV files.
 */
describe("harvest-inventory.json independent reconstruction (non-circular)", () => {
  const { data } = readJsonFixture<HarvestInventoryFixture>("harvest-inventory.json");
  const { records } = data;

  const harvestQuestionRecords = records.filter((r) => r.sourceFormat === "harvest_question_json");
  const csvFileRecords = records.filter((r) => r.sourceFormat === "csv_file");

  it("recomputes bySourceFormat from records[] from scratch and matches the summary", () => {
    expect(data.summary.bySourceFormat).toEqual(tally(records.map((r) => r.sourceFormat)));
  });

  it("CSV-file count reconstructed from records[] is exactly 4", () => {
    expect(csvFileRecords.length).toBe(4);
    expect(data.summary.csvFileCount).toBe(csvFileRecords.length);
  });

  it("CSV data-row count reconstructed by summing each CSV file's recordCount is exactly 29, distinct from the 4-file count", () => {
    const totalCsvRows = csvFileRecords.reduce((sum, r) => sum + r.recordCount, 0);
    expect(totalCsvRows).toBe(29);
    expect(totalCsvRows).not.toBe(csvFileRecords.length);
    expect(data.summary.csvDataRowCount).toBe(totalCsvRows);
  });

  it("valid + malformed CSV data rows reconstruct to the row total, pinned against the donor's documented invalid-mixed.csv rows", () => {
    const KNOWN_MALFORMED_CSV_ROWS = 5; // invalid-mixed.csv rows 5-9: empty slug, unknown type, broken inner JSON, bad year-level, out-of-range difficulty
    const totalCsvRows = csvFileRecords.reduce((sum, r) => sum + r.recordCount, 0);
    expect(data.summary.malformedCsvRowCount).toBe(KNOWN_MALFORMED_CSV_ROWS);
    expect(data.summary.validCsvDataRowCount).toBe(totalCsvRows - KNOWN_MALFORMED_CSV_ROWS);
    expect(data.summary.validCsvDataRowCount + data.summary.malformedCsvRowCount).toBe(totalCsvRows);
  });

  it("exactly one CSV file record is marked partially_malformed, and it is invalid-mixed.csv", () => {
    const malformed = csvFileRecords.filter((r) => r.parseStatus === "partially_malformed");
    expect(malformed.length).toBe(1);
    expect(malformed[0]?.sourceFile).toMatch(/invalid-mixed\.csv$/);
  });

  it("duplicate-copy count reconstructed from records[] publicationSuitability is exactly 102", () => {
    const duplicates = harvestQuestionRecords.filter(
      (r) => r.publicationSuitability === "duplicate_copy_of_other_record",
    );
    expect(duplicates.length).toBe(102);
    expect(data.summary.totalDuplicateCopyRecords).toBe(duplicates.length);
  });

  it("unique-content count reconstructed from records[] is exactly 302, and unique + duplicate = total question-content records", () => {
    const unique = harvestQuestionRecords.filter(
      (r) => r.publicationSuitability !== "duplicate_copy_of_other_record",
    );
    const duplicates = harvestQuestionRecords.filter(
      (r) => r.publicationSuitability === "duplicate_copy_of_other_record",
    );
    expect(unique.length).toBe(302);
    expect(unique.length + duplicates.length).toBe(harvestQuestionRecords.length);
    expect(data.summary.totalQuestionContentRecords).toBe(harvestQuestionRecords.length);
    expect(data.summary.totalUniqueQuestionContentRecords).toBe(unique.length);
  });

  it("every approved-bank duplicate deterministically pairs to exactly one starter-bank original by filename, with matching structural fields", () => {
    const starterByBasename = new Map<string, HarvestInventoryRecord>();
    for (const r of harvestQuestionRecords) {
      if (r.sourceFile.includes("starter-bank/")) {
        starterByBasename.set(r.sourceFile.split("/").pop() as string, r);
      }
    }

    const approved = harvestQuestionRecords.filter((r) => r.sourceFile.includes("approved-bank/"));
    expect(approved.length).toBe(102);

    for (const duplicateRecord of approved) {
      const basename = duplicateRecord.sourceFile.split("/").pop() as string;
      const original = starterByBasename.get(basename);
      expect(original, `no starter-bank original found for ${duplicateRecord.sourceFile}`).toBeDefined();
      expect(duplicateRecord.publicationSuitability).toBe("duplicate_copy_of_other_record");
      expect(original?.publicationSuitability).not.toBe("duplicate_copy_of_other_record");

      const structuralFields = [
        "yearLevel",
        "examStyle",
        "subject",
        "questionType",
        "duplicateFamilyMembership",
      ] as const;
      for (const field of structuralFields) {
        expect(duplicateRecord[field], `${field} mismatch for ${basename}`).toEqual(original?.[field]);
      }
    }
  });

  it("filesystem-entry-count claims in 01-harvest-inventory.md agree with records[]-derived accounting", () => {
    const NON_DATA_FILESYSTEM_ENTRIES_EXCLUDED = 2; // starter-bank/SUMMARY.md + content-qa-report.md: narrative docs, not data records
    const derivedFilesystemEntryCount = records.length + NON_DATA_FILESYSTEM_ENTRIES_EXCLUDED;

    expect(records.length).toBe(427);
    expect(derivedFilesystemEntryCount).toBe(429);
    expect(data.summary.filesystemEntryCount).toBe(derivedFilesystemEntryCount);
    expect(data.summary.nonDataFilesystemEntriesExcludedFromRecords).toBe(
      NON_DATA_FILESYSTEM_ENTRIES_EXCLUDED,
    );

    const docText = readFileSync(path.join(REPORTS_DIR, "01-harvest-inventory.md"), "utf8");
    expect(docText, "doc should state the reconciled 425-entry single-folder total").toMatch(/\b425\b/);
    expect(docText, "doc should state the reconciled 429-entry cross-location total").toMatch(/\b429\b/);
    expect(
      docText,
      "doc should no longer claim 426 filesystem entries as its headline count",
    ).not.toMatch(/426 filesystem entries/);
  });
});

describe("template-families.json structural integrity", () => {
  const { data } = readJsonFixture<TemplateFamiliesFixture>("template-families.json");

  it("summary.totalFamilies matches the actual family count", () => {
    expect(data.summary.totalFamilies).toBe(data.families.length);
  });

  it("summary.totalMembersAcrossFamilies matches a fresh sum", () => {
    const actual = data.families.reduce((sum, f) => sum + f.memberCount, 0);
    expect(data.summary.totalMembersAcrossFamilies).toBe(actual);
  });

  it("every family has a unique familyId", () => {
    const ids = data.families.map((f) => f.familyId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("correctness-verifier-matrix.json structural integrity", () => {
  const { data } = readJsonFixture<VerifierMatrixFixture>("correctness-verifier-matrix.json");

  it("covers exactly the required 20 categories", () => {
    expect(data.categories.length).toBe(20);
    expect(data.summary.totalCategories).toBe(20);
  });

  it("summary.categoriesWithConfirmedGap matches a fresh count", () => {
    const actual = data.categories.filter((c) => Boolean(c.gapNote)).length;
    expect(data.summary.categoriesWithConfirmedGap).toBe(actual);
  });

  it("summary.categoriesWithRepresentativeFixtures matches a fresh count", () => {
    const actual = data.categories.filter((c) => c.representativeFixtureIds.length > 0).length;
    expect(data.summary.categoriesWithRepresentativeFixtures).toBe(actual);
  });

  it("every category has a unique name", () => {
    const names = data.categories.map((c) => c.category);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("no production-bank mutation", () => {
  it("the trusted production bank is untouched by this fixture corpus (still exactly 100 questions)", () => {
    expect(questionBank.length).toBe(100);
  });

  it("every trusted-bank id referenced by the calibration corpus still exists in the live bank", () => {
    const { data } = readJsonFixture<DuplicatePairsFixture>("duplicate-pairs.json");
    const { data: contentFixture } = readJsonFixture<{ entries: Record<string, unknown> }>(
      "calibration-corpus-content.json",
    );
    const contentIds = new Set(Object.keys(contentFixture.entries));
    const trustedIds = new Set(questionBank.map((q) => q.id));

    const referencedTrustedIds = new Set(
      data.pairs.flatMap((p) => [p.leftId, p.rightId]).filter((id) => !contentIds.has(id)),
    );
    expect(referencedTrustedIds.size).toBeGreaterThan(0);
    for (const id of referencedTrustedIds) {
      expect(trustedIds.has(id), `expected '${id}' to still be a real trusted-bank id`).toBe(true);
    }
  });
});
