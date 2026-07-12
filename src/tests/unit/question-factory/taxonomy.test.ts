import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  SKILL_TAXONOMY_ENTRIES,
  normalizeTaxonomyLabel,
  resolvesEverySkillLabel,
  skillTaxonomyRegistry,
  validateTaxonomyEntries,
  type TaxonomyEntry,
} from "@/features/question-factory/taxonomy";

function makeEntry(overrides: Partial<TaxonomyEntry> = {}): TaxonomyEntry {
  return {
    id: "test.entry.one",
    displayName: "Test entry one",
    aliases: ["Test alias one"],
    yearLevels: [3],
    examStyles: ["naplan_style"],
    subject: "numeracy",
    strand: "Number",
    prerequisites: [],
    recommendedQuestionTypes: ["multiple_choice"],
    recommendedVisualTypes: [],
    supportedDifficulties: ["easy"],
    curriculumNotes: [],
    generationConstraints: [],
    ...overrides,
  };
}

describe("skill taxonomy registry", () => {
  it("loads without throwing (the checked-in entries.ts is internally valid)", () => {
    expect(SKILL_TAXONOMY_ENTRIES.length).toBeGreaterThan(0);
    expect(validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES).valid).toBe(true);
  });

  it("every trusted production question's skill resolves through an explicit id or alias", () => {
    const skillLabels = questionBank
      .map((question) => question.metadata.skill)
      .filter((skill): skill is string => Boolean(skill));

    expect(skillLabels.length).toBeGreaterThan(0);

    const result = resolvesEverySkillLabel(SKILL_TAXONOMY_ENTRIES, skillLabels);
    expect(result.unresolved).toEqual([]);
    expect(result.resolved).toBe(true);

    for (const skill of skillLabels) {
      expect(skillTaxonomyRegistry.resolve(skill)).toBeDefined();
    }
  });

  it("resolves every entry by its own id", () => {
    for (const entry of SKILL_TAXONOMY_ENTRIES) {
      expect(skillTaxonomyRegistry.resolve(entry.id)?.id).toBe(entry.id);
      expect(skillTaxonomyRegistry.get(entry.id)?.id).toBe(entry.id);
    }
  });

  it("alias resolution is deterministic", () => {
    const [entry] = SKILL_TAXONOMY_ENTRIES;
    const alias = entry.aliases[0];
    expect(alias).toBeDefined();

    const first = skillTaxonomyRegistry.resolve(alias!);
    const second = skillTaxonomyRegistry.resolve(alias!);
    const third = skillTaxonomyRegistry.resolve(alias!);

    expect(first?.id).toBe(entry.id);
    expect(second?.id).toBe(entry.id);
    expect(third?.id).toBe(entry.id);
  });

  it("fails unknown skill labels rather than guessing", () => {
    expect(skillTaxonomyRegistry.resolve("Not a real skill label")).toBeUndefined();
    expect(() => skillTaxonomyRegistry.resolveOrThrow("Not a real skill label")).toThrow(
      /unknown skill label/i,
    );

    const result = resolvesEverySkillLabel(SKILL_TAXONOMY_ENTRIES, [
      "Interpreting bar charts",
      "Definitely not in the taxonomy",
    ]);
    expect(result.resolved).toBe(false);
    expect(result.unresolved).toEqual(["Definitely not in the taxonomy"]);
  });

  it("never resolves a bare displayName that isn't also listed as an alias", () => {
    const entryWithDistinctDisplayName = SKILL_TAXONOMY_ENTRIES.find(
      (entry) => !entry.aliases.includes(entry.displayName),
    );
    expect(entryWithDistinctDisplayName).toBeDefined();
    expect(
      skillTaxonomyRegistry.resolve(entryWithDistinctDisplayName!.displayName),
    ).toBeUndefined();
  });

  it("changing an entry's displayName does not change its id or alias resolution", () => {
    const original = makeEntry();
    const renamed = makeEntry({ displayName: "A totally different display label" });

    const originalValidation = validateTaxonomyEntries([original]);
    const renamedValidation = validateTaxonomyEntries([renamed]);
    expect(originalValidation.valid).toBe(true);
    expect(renamedValidation.valid).toBe(true);

    expect(original.id).toBe(renamed.id);
    expect(original.aliases).toEqual(renamed.aliases);
  });
});

describe("normalizeTaxonomyLabel", () => {
  it("folds case variants together", () => {
    expect(normalizeTaxonomyLabel("Subject-Verb Agreement")).toBe(
      normalizeTaxonomyLabel("subject-verb agreement"),
    );
    expect(normalizeTaxonomyLabel("SUBJECT-VERB AGREEMENT")).toBe(
      normalizeTaxonomyLabel("subject-verb agreement"),
    );
  });

  it("folds whitespace variants together (leading/trailing/repeated internal)", () => {
    expect(normalizeTaxonomyLabel("  Skip counting   by 7s  ")).toBe(
      normalizeTaxonomyLabel("Skip counting by 7s"),
    );
    expect(normalizeTaxonomyLabel("Skip\tcounting\nby 7s")).toBe(
      normalizeTaxonomyLabel("Skip counting by 7s"),
    );
    // Non-breaking space and other Unicode space separators collapse too.
    expect(normalizeTaxonomyLabel("Skip counting by 7s")).toBe(
      normalizeTaxonomyLabel("Skip counting by 7s"),
    );
  });

  it("folds Unicode normalisation-form variants together (NFKC)", () => {
    // "ﬁ" (U+FB01 LATIN SMALL LIGATURE FI) vs plain "fi".
    expect(normalizeTaxonomyLabel("Classifying ﬁgurative language")).toBe(
      normalizeTaxonomyLabel("Classifying figurative language"),
    );
    // Full-width Latin letters vs ASCII.
    expect(normalizeTaxonomyLabel("Ａｂｃ")).toBe(normalizeTaxonomyLabel("Abc"));
  });

  it("folds apostrophe variants together", () => {
    const variants = [
      "Author's purpose",
      "Author’s purpose", // right single quotation mark
      "Author‘s purpose", // left single quotation mark (unusual but must still fold)
      "Authorʼs purpose", // modifier letter apostrophe
      "Author´s purpose", // acute accent used as apostrophe
    ];
    const normalized = variants.map(normalizeTaxonomyLabel);
    expect(new Set(normalized).size).toBe(1);
  });

  it("folds hyphen/dash variants together", () => {
    const variants = [
      "Two-digit addition",
      "Two‐digit addition", // hyphen
      "Two‑digit addition", // non-breaking hyphen
      "Two–digit addition", // en dash
      "Two—digit addition", // em dash
      "Two−digit addition", // minus sign
    ];
    const normalized = variants.map(normalizeTaxonomyLabel);
    expect(new Set(normalized).size).toBe(1);
  });

  it("folds cosmetic trailing punctuation", () => {
    expect(normalizeTaxonomyLabel("Identifying prime numbers.")).toBe(
      normalizeTaxonomyLabel("Identifying prime numbers"),
    );
    expect(normalizeTaxonomyLabel("Identifying prime numbers,")).toBe(
      normalizeTaxonomyLabel("Identifying prime numbers"),
    );
  });

  it("never collapses semantically different labels", () => {
    const distinct = [
      "Identifying prime numbers",
      "Identifying square numbers",
      "Skip counting by 7s",
      "Skip counting by 9s",
      "Author's purpose",
      "Author's audience",
    ];
    const normalized = distinct.map(normalizeTaxonomyLabel);
    expect(new Set(normalized).size).toBe(distinct.length);
  });

  it("does not perform fuzzy spelling correction (no British/American inference)", () => {
    expect(normalizeTaxonomyLabel("Classifying colour words")).not.toBe(
      normalizeTaxonomyLabel("Classifying color words"),
    );
  });
});

describe("normalised resolution and collision detection", () => {
  it("resolves a label that only differs from a declared alias by case, whitespace, apostrophe or dash form", () => {
    const entry = makeEntry({
      id: "test.entry.normalised",
      aliases: ["Author's purpose — persuasive texts"],
    });
    const registryValidation = validateTaxonomyEntries([entry]);
    expect(registryValidation.valid).toBe(true);

    const decoratedVariant = "  AUTHOR’S PURPOSE — PERSUASIVE TEXTS.  ";
    expect(normalizeTaxonomyLabel(decoratedVariant)).toBe(
      normalizeTaxonomyLabel(entry.aliases[0]!),
    );
  });

  it("fails validation when two different entries' aliases collide only after normalisation", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", aliases: ["Author's Purpose"] }),
      makeEntry({ id: "test.entry.two", aliases: ["author’s purpose"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "alias_collision")).toBe(true);
  });

  it("fails validation when an alias normalises the same as a different entry's id", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.shared-id", aliases: ["Some alias"] }),
      makeEntry({ id: "test.entry.two", aliases: ["Test.Entry.Shared-Id"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(
      result.issues.some(
        (issue) => issue.code === "alias_collision" || issue.code === "duplicate_id",
      ),
    ).toBe(true);
  });

  it("still passes when two entries have aliases that are legitimately different after normalisation", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", aliases: ["Identifying prime numbers"] }),
      makeEntry({ id: "test.entry.two", aliases: ["Identifying square numbers"] }),
    ]);
    expect(result.valid).toBe(true);
  });
});

describe("taxonomy structural validation", () => {
  it("passes a well-formed entry set", () => {
    const result = validateTaxonomyEntries([
      makeEntry(),
      makeEntry({ id: "test.entry.two", aliases: ["Test alias two"] }),
    ]);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("fails on duplicate ids", () => {
    const result = validateTaxonomyEntries([
      makeEntry(),
      makeEntry({ aliases: ["A different alias"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "duplicate_id")).toBe(true);
  });

  it("fails when two different entries claim the same alias", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", aliases: ["Shared alias"] }),
      makeEntry({ id: "test.entry.two", aliases: ["Shared alias"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "alias_collision")).toBe(true);
  });

  it("allows the same entry to list the same alias only once without flagging a collision", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", aliases: ["Repeated", "Repeated"] }),
    ]);
    expect(result.valid).toBe(true);
  });

  it("fails on an empty id", () => {
    const result = validateTaxonomyEntries([makeEntry({ id: "" })]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "empty_id")).toBe(true);
  });

  it("fails on an empty alias", () => {
    const result = validateTaxonomyEntries([makeEntry({ aliases: ["  "] })]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "empty_alias")).toBe(true);
  });

  it("fails on an unknown prerequisite reference", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ prerequisites: ["does.not.exist"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "unknown_prerequisite")).toBe(true);
  });

  it("fails when an entry lists itself as a prerequisite", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", prerequisites: ["test.entry.one"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "self_prerequisite")).toBe(true);
  });

  it("resolves a valid prerequisite reference between two entries without error", () => {
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.one", aliases: ["Alias one"] }),
      makeEntry({
        id: "test.entry.two",
        aliases: ["Alias two"],
        prerequisites: ["test.entry.one"],
      }),
    ]);
    expect(result.valid).toBe(true);
  });
});

describe("taxonomy entries shape", () => {
  it("every entry has a non-empty id, displayName, subject and strand", () => {
    for (const entry of SKILL_TAXONOMY_ENTRIES) {
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.subject.length).toBeGreaterThan(0);
      expect(entry.strand.length).toBeGreaterThan(0);
      expect(entry.yearLevels.length).toBeGreaterThan(0);
      expect(entry.examStyles.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate ids and no colliding aliases across the whole checked-in registry", () => {
    const ids = SKILL_TAXONOMY_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);

    const aliasOwner = new Map<string, string>();
    for (const entry of SKILL_TAXONOMY_ENTRIES) {
      for (const alias of entry.aliases) {
        const owner = aliasOwner.get(alias);
        expect(owner === undefined || owner === entry.id).toBe(true);
        aliasOwner.set(alias, entry.id);
      }
    }
  });
});
