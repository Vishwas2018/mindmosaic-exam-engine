import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";

import { UNMAPPED_CURATED_SKILL_LABELS } from "./unmapped-curated-skills";
import { isValidStyleYear } from "@/features/taxonomy/year-registry";
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

  it("every trusted production question's skill resolves, except the recorded ingest debt", () => {
    const skillLabels = questionBank
      .map((question) => question.metadata.skill)
      .filter((skill): skill is string => Boolean(skill));

    expect(skillLabels.length).toBeGreaterThan(0);

    const recorded = new Set(UNMAPPED_CURATED_SKILL_LABELS);
    const result = resolvesEverySkillLabel(SKILL_TAXONOMY_ENTRIES, skillLabels);

    /*
     * Exactly the recorded set — matched both ways on purpose. An
     * unrecorded label failing here means new content arrived with a skill
     * nobody mapped; a recorded label that now resolves means the mapping
     * was done and its entry must be deleted. See the fixture's comment
     * for why these are recorded rather than guessed.
     */
    expect([...result.unresolved].sort()).toEqual([...recorded].sort());

    for (const skill of skillLabels) {
      if (recorded.has(skill)) continue;
      expect(skillTaxonomyRegistry.resolve(skill)).toBeDefined();
    }
  });

  it("still resolves every skill outside the recorded ingest debt", () => {
    /*
     * 118 questions currently resolve through the taxonomy. The remaining
     * curated free-text labels are recorded in the ingest-debt fixture.
     *
     * The resolved subset came through the question factory's taxonomy-aware
     * authoring path; the remaining curated items retain free-text labels
     * until an editorial mapping is approved.
     */
    const mapped = questionBank
      .map((question) => question.metadata.skill)
      .filter((skill): skill is string => Boolean(skill))
      .filter((skill) => !UNMAPPED_CURATED_SKILL_LABELS.includes(skill));
    expect(mapped.length).toBe(118);
    for (const skill of mapped) {
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

describe("PB1 taxonomy remediation — new entries", () => {
  const NEW_ENTRIES: Record<string, Partial<TaxonomyEntry>> = {
    "num.prod.chance.most-likely-outcome": {
      subject: "numeracy",
      strand: "Chance",
      yearLevels: [5],
      examStyles: ["naplan_style"],
      recommendedQuestionTypes: ["multiple_choice"],
    },
    "num.prod.number.place-value": {
      subject: "numeracy",
      strand: "Number",
      yearLevels: [5],
      examStyles: ["naplan_style"],
      recommendedQuestionTypes: ["dropdown"],
    },
    "num.prod.measurement.units-of-time": {
      subject: "numeracy",
      strand: "Measurement",
      /* Widened to Year 4 by the Year 4/6 enablement — see that describe
         block. The PB1 facts under test here (subject, strand, style,
         question types) are unchanged. */
      yearLevels: [3, 4],
      examStyles: ["icas_style"],
      recommendedQuestionTypes: ["ordering"],
    },
    "num.prod.number.multiplication-equal-groups": {
      subject: "numeracy",
      strand: "Number",
      yearLevels: [3],
      examStyles: ["naplan_style"],
      recommendedQuestionTypes: ["number_entry"],
    },
    "read.prod.inference.inferring-from-a-narrative": {
      subject: "reading",
      strand: "Inference",
      /* Widened to Year 6 by the Year 4/6 enablement. */
      yearLevels: [5, 6],
      examStyles: ["icas_style"],
      recommendedQuestionTypes: ["reading_comprehension"],
    },
    "lang.prod.grammar.regular-plurals": {
      subject: "language_conventions",
      strand: "Grammar",
      yearLevels: [3],
      examStyles: ["naplan_style"],
      recommendedQuestionTypes: ["fill_blank"],
    },
  };

  it.each(Object.entries(NEW_ENTRIES))(
    "'%s' is registered with the expected subject, strand, year levels, exam styles and question types",
    (id, expected) => {
      const entry = skillTaxonomyRegistry.get(id);
      expect(entry).toBeDefined();
      expect(entry?.subject).toBe(expected.subject);
      expect(entry?.strand).toBe(expected.strand);
      expect(entry?.yearLevels).toEqual(expected.yearLevels);
      expect(entry?.examStyles).toEqual(expected.examStyles);
      expect(entry?.recommendedQuestionTypes).toEqual(expected.recommendedQuestionTypes);
    },
  );

  it("all 6 new ids resolve through the registry and are distinct from each other", () => {
    const ids = Object.keys(NEW_ENTRIES);
    const resolved = ids.map((id) => skillTaxonomyRegistry.resolve(id)?.id);
    expect(resolved).toEqual(ids);
    expect(new Set(resolved).size).toBe(ids.length);
  });

  it("does not introduce a duplicate id or an alias collision against the full registry", () => {
    const result = validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("keeps 'multiplication-equal-groups' distinct from the multiples-identification entries", () => {
    const multiplication = skillTaxonomyRegistry.get("num.prod.number.multiplication-equal-groups");
    const multiplesY3 = skillTaxonomyRegistry.get("num.prod.number.multiples");
    const multiplesY5 = skillTaxonomyRegistry.get("num.number.multiples");
    expect(multiplication?.id).not.toBe(multiplesY3?.id);
    expect(multiplication?.id).not.toBe(multiplesY5?.id);
  });

  it("keeps narrative inference distinct from character-motivation inference", () => {
    const narrative = skillTaxonomyRegistry.get("read.prod.inference.inferring-from-a-narrative");
    const motivation = skillTaxonomyRegistry.get("read.prod.inference.inferring-character-motivation");
    expect(narrative?.id).not.toBe(motivation?.id);
    expect(narrative?.examStyles).toEqual(["icas_style"]);
    expect(motivation?.examStyles).toEqual(["naplan_style"]);
  });

  it("keeps regular plurals distinct from irregular plurals, and files it under Grammar not Spelling", () => {
    const regular = skillTaxonomyRegistry.get("lang.prod.grammar.regular-plurals");
    const irregular = skillTaxonomyRegistry.get("lang.prod.grammar.irregular-plurals");
    expect(regular?.id).not.toBe(irregular?.id);
    expect(regular?.strand).toBe("Grammar");
  });

  it("does not broaden num.measurement.units to cover time", () => {
    const units = skillTaxonomyRegistry.get("num.measurement.units");
    expect(units?.examStyles).toEqual(["naplan_style"]);
    const time = skillTaxonomyRegistry.get("num.prod.measurement.units-of-time");
    expect(time?.id).not.toBe(units?.id);
  });
});

describe("PB1 taxonomy remediation — existing-entry expansions", () => {
  it("num.fractions.equivalent now supports naplan_style in addition to icas_style", () => {
    const entry = skillTaxonomyRegistry.get("num.fractions.equivalent");
    expect(entry?.examStyles).toEqual(["icas_style", "naplan_style"]);
    /* Year 4 and Year 6 added by the Year 4/6 enablement — Fractions had
       no Year 3 ICAS entry, so equivalent fractions is one of the six
       Year 5 skills widened DOWN so Year 4 is not blank in that strand. */
    expect(entry?.yearLevels).toEqual([4, 5, 6]);
    expect(entry?.strand).toBe("Fractions");
  });

  it("num.number.multiples now supports naplan_style and true_false, existing concept unchanged", () => {
    const entry = skillTaxonomyRegistry.get("num.number.multiples");
    expect(entry?.examStyles).toEqual(["icas_style", "naplan_style"]);
    expect(entry?.recommendedQuestionTypes).toEqual(["multiple_choice", "multiple_select", "true_false"]);
    expect(entry?.yearLevels).toEqual([5, 6]);
  });

  it("num.prod.number.fractions-of-a-set keeps its challenging band and icas-only style across the widened years", () => {
    const entry = skillTaxonomyRegistry.get("num.prod.number.fractions-of-a-set");
    expect(entry?.yearLevels).toEqual([3, 4, 5, 6]);
    expect(entry?.supportedDifficulties).toEqual(["medium", "challenging"]);
    expect(entry?.examStyles).toEqual(["icas_style"]);
  });
});

describe("ICAS Year 3 language-conventions taxonomy — new entries", () => {
  const NEW_ENTRIES: Record<string, Partial<TaxonomyEntry>> = {
    "lang.prod.punctuation.commas-in-lists": {
      strand: "Punctuation",
      examStyles: ["icas_style", "naplan_style"],
    },
    "lang.prod.punctuation.speech-marks": {
      strand: "Punctuation",
      examStyles: ["icas_style", "naplan_style"],
    },
    "lang.prod.grammar.pronoun-reference": {
      strand: "Grammar",
      examStyles: ["icas_style"],
    },
    "lang.prod.grammar.conjunctions": {
      strand: "Grammar",
      examStyles: ["icas_style", "naplan_style"],
    },
    "lang.prod.grammar.complete-sentences": {
      strand: "Grammar",
      examStyles: ["icas_style", "naplan_style"],
    },
    "lang.prod.grammar.question-word-order": {
      strand: "Grammar",
      examStyles: ["icas_style", "naplan_style"],
    },
    "lang.prod.vocabulary.prefixes": {
      strand: "Vocabulary",
      examStyles: ["icas_style"],
    },
    "lang.prod.vocabulary.suffixes": {
      strand: "Vocabulary",
      examStyles: ["icas_style"],
    },
    "lang.prod.vocabulary.compound-words": {
      strand: "Vocabulary",
      examStyles: ["icas_style"],
    },
  };

  it.each(Object.entries(NEW_ENTRIES))(
    "'%s' is a Year 3 language-conventions entry on the expected strand and exam styles",
    (id, expected) => {
      const entry = skillTaxonomyRegistry.get(id);
      expect(entry).toBeDefined();
      expect(entry?.subject).toBe("language_conventions");
      /* Authored for Year 3; widened to Year 4 by the Year 4/6 enablement,
         which added 4 to every ICAS-bearing Year 3 entry. */
      expect(entry?.yearLevels).toEqual([3, 4]);
      expect(entry?.strand).toBe(expected.strand);
      expect(entry?.examStyles).toEqual(expected.examStyles);
    },
  );

  it.each(Object.keys(NEW_ENTRIES))("'%s' carries at least one human-readable alias", (id) => {
    const entry = skillTaxonomyRegistry.get(id);
    expect(entry?.aliases.length).toBeGreaterThan(0);
    for (const alias of entry!.aliases) {
      expect(alias).not.toBe(entry!.id);
      expect(skillTaxonomyRegistry.resolve(alias)?.id).toBe(id);
    }
  });

  it("keeps the new Year 3 commas entry distinct from the Year 5 'lit.punctuation.commas-in-lists'", () => {
    const year3 = skillTaxonomyRegistry.get("lang.prod.punctuation.commas-in-lists");
    const year5 = skillTaxonomyRegistry.get("lit.punctuation.commas-in-lists");
    expect(year3?.id).not.toBe(year5?.id);
    expect(year5?.yearLevels).toEqual([5]);
    expect(year5?.examStyles).toEqual(["naplan_style"]);
  });

  it("keeps pronoun reference distinct from Year 5 pronoun form", () => {
    const reference = skillTaxonomyRegistry.get("lang.prod.grammar.pronoun-reference");
    const form = skillTaxonomyRegistry.get("lit.grammar.pronouns");
    expect(reference?.id).not.toBe(form?.id);
    expect(form?.yearLevels).toEqual([5]);
  });

  it("does not introduce a duplicate id or an alias collision against the full registry", () => {
    const result = validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES);
    expect(result.valid).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

describe("ICAS Year 3 language-conventions taxonomy — existing-entry expansions", () => {
  const WIDENED_TO_ICAS = [
    "lang.prod.punctuation.contractions",
    "lit.grammar.full-stops-question-marks",
    "lang.prod.grammar.verb-tense",
    "lang.prod.grammar.subject-verb-agreement",
    "lang.prod.grammar.irregular-plurals",
    "lang.prod.punctuation.capital-letters",
    "lang.prod.parts-of-speech.adverbs",
  ] as const;

  it.each(WIDENED_TO_ICAS)("'%s' supports icas_style alongside naplan_style", (id) => {
    const entry = skillTaxonomyRegistry.get(id);
    expect(entry?.examStyles).toEqual(["icas_style", "naplan_style"]);
  });

  it.each(WIDENED_TO_ICAS)("'%s' still covers Year 3", (id) => {
    expect(skillTaxonomyRegistry.get(id)?.yearLevels).toContain(3);
  });

  it("keeps every widened entry on the strand it already owned", () => {
    expect(skillTaxonomyRegistry.get("lang.prod.punctuation.contractions")?.strand).toBe("Punctuation");
    expect(skillTaxonomyRegistry.get("lit.grammar.full-stops-question-marks")?.strand).toBe("Punctuation");
    expect(skillTaxonomyRegistry.get("lang.prod.punctuation.capital-letters")?.strand).toBe("Punctuation");
    expect(skillTaxonomyRegistry.get("lang.prod.grammar.verb-tense")?.strand).toBe("Grammar");
    expect(skillTaxonomyRegistry.get("lang.prod.grammar.subject-verb-agreement")?.strand).toBe("Grammar");
    expect(skillTaxonomyRegistry.get("lang.prod.grammar.irregular-plurals")?.strand).toBe("Grammar");
    expect(skillTaxonomyRegistry.get("lang.prod.parts-of-speech.adverbs")?.strand).toBe("Parts of speech");
  });

  it("widens end-of-sentence punctuation to exclamation marks by alias, keeping the id and its original alias resolvable", () => {
    const entry = skillTaxonomyRegistry.get("lit.grammar.full-stops-question-marks");
    expect(entry?.id).toBe("lit.grammar.full-stops-question-marks");
    // The pre-existing label every published question and the legacy
    // _HARVEST taxonomy resolve through must keep resolving.
    expect(skillTaxonomyRegistry.resolve("Using full stops and question marks")?.id).toBe(
      "lit.grammar.full-stops-question-marks",
    );
    expect(
      skillTaxonomyRegistry.resolve("Using full stops, question marks and exclamation marks")?.id,
    ).toBe("lit.grammar.full-stops-question-marks");
  });

  it("leaves the Year 5 adverbs-and-adjectives entry untouched", () => {
    const entry = skillTaxonomyRegistry.get("lang.prod.parts-of-speech.adverbs-and-adjectives");
    expect(entry?.yearLevels).toEqual([5]);
    expect(entry?.examStyles).toEqual(["naplan_style"]);
  });
});

describe("Year 4 and Year 6 enablement", () => {
  const entriesForYear = (year: 4 | 6) =>
    SKILL_TAXONOMY_ENTRIES.filter((entry) => entry.yearLevels.includes(year));

  it.each([4, 6] as const)("Year %i has authorable entries", (year) => {
    expect(entriesForYear(year).length).toBeGreaterThan(0);
  });

  it.each([4, 6] as const)(
    "every Year %i entry carries icas_style — NAPLAN is not sat at Year 4 or Year 6",
    (year) => {
      for (const entry of entriesForYear(year)) {
        expect(entry.examStyles).toContain("icas_style");
      }
    },
  );

  it("every entry combines into at least one sitting that exists", () => {
    for (const entry of SKILL_TAXONOMY_ENTRIES) {
      const realisable = entry.yearLevels.some((yearLevel) =>
        entry.examStyles.some((examStyle) => isValidStyleYear(examStyle, yearLevel)),
      );
      expect(realisable).toBe(true);
    }
    expect(validateTaxonomyEntries(SKILL_TAXONOMY_ENTRIES).valid).toBe(true);
  });

  it("flags an entry whose every year/style cell is an impossible sitting", () => {
    // Years 4 and 6 with naplan_style only: both cells are impossible, so
    // nothing could ever legitimately resolve to this entry.
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.impossible", yearLevels: [4, 6], examStyles: ["naplan_style"] }),
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "no_realisable_sitting")).toBe(true);
  });

  it("does not flag a band-spanning entry that mixes real and impossible cells", () => {
    // Years 3-4 in both styles: naplan@4 is impossible, but naplan@3,
    // icas@3 and icas@4 are all real. Forking this into per-style entries
    // is exactly what the year-registry cross-check exists to avoid.
    const result = validateTaxonomyEntries([
      makeEntry({ id: "test.entry.spanning", yearLevels: [3, 4], examStyles: ["icas_style", "naplan_style"] }),
    ]);
    expect(result.valid).toBe(true);
  });

  it("keeps the new Year 4 and Year 6 entries icas-only and pinned to their own year", () => {
    const introduced: Record<string, 4 | 6> = {
      "lang.prod.vocabulary.dictionary-skills": 4,
      "num.prod.geometry.symmetry": 4,
      "num.prod.measurement.area-by-counting-squares": 4,
      "num.prod.number.multiplication-and-division-facts": 4,
      "lang.prod.grammar.active-and-passive-voice": 6,
      "num.prod.number.order-of-operations": 6,
      "num.prod.number.percentages": 6,
      "num.prod.number.integers": 6,
      "num.prod.statistics.mean-of-a-data-set": 6,
      "num.prod.measurement.volume-of-a-rectangular-prism": 6,
      "read.prod.inference.identifying-author-viewpoint": 6,
    };
    for (const [id, year] of Object.entries(introduced)) {
      const entry = skillTaxonomyRegistry.get(id);
      expect(entry).toBeDefined();
      expect(entry?.yearLevels).toEqual([year]);
      expect(entry?.examStyles).toEqual(["icas_style"]);
    }
  });

  it("leaves every naplan-only entry at its original years", () => {
    // Widening a naplan-only entry into Year 4 or 6 would produce an entry
    // with no realisable cell at that year — enabling nothing while
    // implying a sitting that does not exist.
    for (const entry of SKILL_TAXONOMY_ENTRIES) {
      if (entry.examStyles.includes("icas_style")) continue;
      expect(entry.yearLevels).not.toContain(4);
      expect(entry.yearLevels).not.toContain(6);
    }
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
