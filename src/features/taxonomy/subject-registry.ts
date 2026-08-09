/**
 * The single source of truth for which subjects, strands and skills the
 * product knows about. `src/schemas/question.schema.ts` derives its
 * `subject` enum from this registry, and the question-factory taxonomy
 * module (`src/features/question-factory/taxonomy`) derives its
 * `TaxonomySubject` type from it too — nobody else should hand-roll a
 * second `"numeracy" | "reading" | ...` union.
 *
 * To add a subject: add one entry to `SUBJECT_REGISTRY` below (see
 * `docs/TAXONOMY.md`). Nothing else needs to change for the subject to
 * become a valid `metadata.subject` value across the app.
 *
 * Seeded from the current production content: the strand and skill lists
 * for each of the four existing subjects were derived directly from
 * `src/content/questions/grade-3/*` and `src/content/questions/grade-5/*`
 * (the governed 100-question bank), so nothing already in production is
 * missing here.
 */
import type { ExamStyle, YearLevel } from "@/schemas/question.schema";

import { isValidStyleYear, YEAR_LEVELS } from "./year-registry";

export interface SubjectStrand {
  readonly id: string;
  readonly label: string;
  readonly skills: readonly string[];
}

export interface SubjectRegistryEntry {
  readonly id: string;
  readonly label: string;
  readonly supportedExamStyles: readonly ExamStyle[];
  /**
   * The year span this subject is taught/assessed across (expansion-plan
   * T0a). Intersect with EXAM_STYLE_YEAR_LEVELS to get the real sittings:
   * a subject spanning Years 1-12 that only supports NAPLAN-style is still
   * only sat in Years 3, 5, 7 and 9.
   *
   * This is the SUBJECT's span, not our coverage. Whether questions exist
   * for a given (year, style, subject) cell is coverage, and lives in
   * ./coverage.ts — see the note there on why the two must not be merged.
   */
  readonly yearLevels: readonly YearLevel[];
  readonly strands: readonly SubjectStrand[];
  readonly coverageTargets?: Readonly<Record<string, number>>;
}

const BOTH_EXAM_STYLES: readonly ExamStyle[] = ["naplan_style", "icas_style"];

/*
 * Every subject currently spans the full Years 1-12 range. That is a
 * statement about the subject, not about our content — see the yearLevels
 * docblock above. A subject that genuinely does not run at every year (a
 * senior-only elective, say) narrows this list.
 */
const ALL_YEARS: readonly YearLevel[] = YEAR_LEVELS;

/**
 * ICAS sets a Digital Technologies paper only up to Year 7, while every
 * other ICAS subject runs the full Years 2-12 span. Narrowing it here
 * rather than at the catalogue keeps the fact in the registry the whole
 * app derives from: intersected with `EXAM_STYLE_YEAR_LEVELS.icas_style`
 * this yields Years 2-7, so no Year 8-12 Digital Technologies cell can be
 * generated, planned or rendered anywhere.
 */
const ICAS_DIGITAL_TECHNOLOGIES_YEARS: readonly YearLevel[] = [1, 2, 3, 4, 5, 6, 7];

export const SUBJECT_REGISTRY = [
  {
    id: "numeracy",
    label: "Numeracy",
    supportedExamStyles: BOTH_EXAM_STYLES,
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "number",
        label: "Number",
        skills: [
          "Adding money amounts",
          "Identifying even numbers",
          "Reading a number line",
          "Naming fractions from a model",
          "Describing a fraction model",
          "Comparing fractions with one half",
          "Finding a fraction of a collection",
          "Identifying multiples of 4",
          "Ordering values from a table",
          "Ordering decimals on a number line",
          "Solving multi-step money problems",
          "Reading decimals on a number line",
          "Recognising one half in different models",
        ],
      },
      {
        id: "measurement",
        label: "Measurement",
        skills: [
          "Calculating the perimeter of a square",
          "Calculating the perimeter of a rectangle",
          "Calculating perimeter and area of a rectangle",
          "Calculating the area of a triangle",
        ],
      },
      {
        id: "geometry",
        label: "Geometry",
        skills: [
          "Locating points on a grid",
          "Naming 2D shapes",
          "Identifying a square by its properties",
          "Identifying curved and straight sides",
          "Naming polygons by side count",
          "Reading coordinate pairs",
          "Finding horizontal distance between points",
          "Identifying right angles in shapes",
          "Classifying angles",
          "Naming parts of a circle",
          "Identifying a parallelogram",
          "Filtering points by coordinate",
          "Identifying acute angles",
          "Naming parts of 3D objects",
        ],
      },
      {
        id: "statistics",
        label: "Statistics",
        skills: [
          "Interpreting bar charts",
          "Comparing values in a bar chart",
          "Relating fractions to a pie chart",
          "Ordering values from a graph",
          "Finding the maximum on a line graph",
          "Relating fractions to data",
          "Reading values against a threshold",
          "Adding values from a bar chart",
          "Comparing values in a table",
          "Matching values on a line graph",
          "Ordering data by size",
          "Comparing data multiplicatively",
          "Finding the difference between extremes",
        ],
      },
      {
        id: "patterns",
        label: "Patterns",
        skills: ["Extending a linear pattern"],
      },
      {
        id: "measurement-and-geometry",
        label: "Measurement and Geometry",
        skills: [
          "Choosing a sensible metric unit for a length",
          "Comparing capacities in millilitres and litres",
          "Counting lines of symmetry in a figure",
          "Finding elapsed time by counting on to the next hour",
          "Identifying a 2D shape from its properties",
          "Identifying a 3D solid from the number and shape of its faces",
          "Locating a named weekday and date on a calendar",
          "Matching spoken time to digital time",
          "Reading a scale and finding the difference between two points",
          "Reading masses from a bar chart and combining them",
        ],
      },
      {
        id: "statistics-and-probability",
        label: "Statistics and Probability",
        skills: [
          "Combining values read from a bar chart to match a total",
          "Comparing values on a column graph",
          "Reasoning with two-way data in a table",
        ],
      },
      {
        id: "number-and-place-value",
        label: "Number and place value",
        skills: [
          "Adding three-digit numbers with two regroupings",
          "Building a three-digit number from place value clues",
          "Comparing table data using subtraction across a zero",
          "Ordering numbers written in words, digits and place-value form",
        ],
      },
      {
        id: "number-and-algebra",
        label: "Number and algebra",
        skills: [
          "Comparing two multiplication totals to judge a claim",
          "Doubling and halving to solve problems",
          "Ordering three-digit numbers",
          "Reading positions and steps on a number line",
          "Rounding a two-digit number to the nearest ten",
          "Sharing with a remainder and interpreting what is left",
          "Two-step word problems with money",
          "Using a division fact then subtracting in a two-step problem",
          "Working backwards to find an unknown that appears twice",
        ],
      },
      {
        id: "fractions",
        label: "Fractions",
        skills: [
          "Finding a quarter of a group and the remaining part",
        ],
      },
      {
        id: "money-and-financial-mathematics",
        label: "Money and financial mathematics",
        skills: [
          "Choosing items that total an exact amount of money",
        ],
      },
    ],
  },
  {
    id: "reading",
    label: "Reading",
    supportedExamStyles: BOTH_EXAM_STYLES,
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "literal-comprehension",
        label: "Literal comprehension",
        skills: [
          "Locating directly stated details",
          "Finding information in a table",
          "Verifying details in an information text",
          "Recalling names and details",
          "Integrating text with a table",
          "Checking multiple details in a text",
        ],
      },
      {
        id: "sequencing",
        label: "Sequencing",
        skills: ["Identifying the order of steps", "Sequencing events in a narrative"],
      },
      {
        id: "inference",
        label: "Inference",
        skills: [
          "Inferring reasons for actions",
          "Inferring purpose from an information text",
          "Inferring motives from actions",
          "Drawing conclusions from an information text",
        ],
      },
      {
        id: "vocabulary-in-context",
        label: "Vocabulary in context",
        skills: [
          "Using context clues for word meaning",
          "Choosing the best word meaning",
          "Interpreting idioms in context",
        ],
      },
      {
        id: "fact-and-opinion",
        label: "Fact and opinion",
        skills: ["Distinguishing fact from opinion", "Classifying statements as fact or opinion"],
      },
      {
        id: "main-idea",
        label: "Main idea",
        skills: ["Identifying author purpose"],
      },
      {
        id: "narrative-comprehension",
        label: "Narrative comprehension",
        skills: [
          "Close reading of a narrative ending",
          "Comparing how two characters behave",
          "Identifying the cause of an event",
          "Identifying the effect of an action",
          "Inferring character and animal behaviour from detail",
          "Inferring how a character feels",
          "Inferring how characters feel",
          "Inferring why a character acts",
          "Inferring why a character says something",
          "Locating a directly stated detail",
          "Predicting what happens next",
          "Selecting statements that correctly compare two characters",
          "Sequencing events",
          "Sequencing events in a story",
          "Understanding the effect of a particular word choice",
        ],
      },
      {
        id: "vocabulary",
        label: "Vocabulary",
        skills: [
          "Working out a word's meaning from context",
        ],
      },
      {
        id: "information-text-comprehension",
        label: "Information text comprehension",
        skills: [
          "Distinguishing a stated fact from an implied idea",
          "Drawing a conclusion by combining two facts",
          "Drawing a conclusion from a stated fact",
          "Finding a fact in an information text",
          "Identifying the main idea of a text",
          "Matching each detail to what the text says about it",
          "Matching parts of an animal to their use",
        ],
      },
      {
        id: "procedural-text-comprehension",
        label: "Procedural text comprehension",
        skills: [
          "Following a specific step in instructions",
          "Identifying the purpose of a text",
          "Inferring the reason behind an instruction",
        ],
      },
      {
        id: "poetry-comprehension",
        label: "Poetry comprehension",
        skills: [
          "Finding a detail in a poem",
          "Working out how a person feels",
          "Working out why an event happens",
        ],
      },
      {
        id: "everyday-text-comprehension",
        label: "Everyday text comprehension",
        skills: [
          "Finding the reason given for a rule",
          "Identifying who a text is written for",
          "Understanding a condition in a text",
        ],
      },
      {
        id: "information-texts",
        label: "Information texts",
        skills: [
          "Finding a stated reason in an information text",
          "Finding information stated directly in a text",
          "Identifying the main idea of a whole text",
          "Reading a table alongside a passage",
          "Using headings to find the right part of a text",
          "Working out the author's purpose for writing",
          "Working out the meaning of a word from its context",
          "Working out why an author included a comparison",
          "Working out why an author included a paragraph",
        ],
      },
      {
        id: "language-in-narrative",
        label: "Language in narrative",
        skills: [
          "Understanding what a comparison shows",
        ],
      },
    ],
  },
  {
    id: "writing",
    label: "Writing",
    supportedExamStyles: BOTH_EXAM_STYLES,
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "narrative-writing",
        label: "Narrative writing",
        skills: ["Composing a narrative"],
      },
      {
        id: "procedural-writing",
        label: "Procedural writing",
        skills: ["Composing a procedure"],
      },
      {
        id: "persuasive-writing",
        label: "Persuasive writing",
        skills: ["Composing a persuasive argument"],
      },
      {
        id: "informative-writing",
        label: "Informative writing",
        skills: ["Composing an information report"],
      },
    ],
  },
  {
    id: "language_conventions",
    label: "Language Conventions",
    supportedExamStyles: BOTH_EXAM_STYLES,
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "spelling",
        label: "Spelling",
        skills: [
          "Spelling common adjectives",
          "Choosing the correct homophone",
          "Spelling commonly confused words",
        ],
      },
      {
        id: "punctuation",
        label: "Punctuation",
        skills: [
          "Forming contractions with apostrophes",
          "Using capital letters for sentences and proper nouns",
          "Using apostrophes for singular possession",
        ],
      },
      {
        id: "grammar",
        label: "Grammar",
        skills: [
          "Choosing the correct past tense",
          "Matching verbs to singular and plural subjects",
          "Forming irregular plural nouns",
          "Choosing correct verb forms",
          "Classifying sentence types",
        ],
      },
      {
        id: "vocabulary",
        label: "Vocabulary",
        skills: [
          "Matching words to their antonyms",
          "Producing antonyms",
          "Matching words to definitions",
          "Producing synonyms",
          "Producing synonyms for formal words",
          "Classifying figurative language",
          "Grouping words by meaning",
        ],
      },
      {
        id: "parts-of-speech",
        label: "Parts of speech",
        skills: [
          "Recognising adverbs",
          "Sorting nouns and verbs",
          "Identifying adverbs in sentences",
          "Distinguishing adverbs from adjectives",
          "Sorting common and proper nouns",
        ],
      },
      {
        id: "logical-language-reasoning",
        label: "Logical language reasoning",
        skills: ["Completing word analogies", "Reasoning about word relationships"],
      },
      {
        id: "text-structure",
        label: "Text structure",
        skills: [
          "Ordering sentences for cohesion",
          "Identifying letter structure",
          "Using cause-and-effect connectives",
        ],
      },
      {
        id: "phonics",
        label: "Phonics",
        skills: [
          "Counting syllables in a word",
        ],
      },
    ],
  },
  {
    // Seeded from the Australian Curriculum Science content descriptions for
    // Year 3 and Year 5 (Biological, Chemical, Physical and Earth and Space
    // Sciences) rather than from the production bank — there is no Science
    // content in `src/content/questions/*` yet. NAPLAN does not assess
    // Science, so unlike the four bank-derived subjects above this one only
    // supports the ICAS exam style.
    id: "science",
    label: "Science",
    supportedExamStyles: ["icas_style"],
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "biological-sciences",
        label: "Biological Sciences",
        skills: [
          "Identifying the basic needs of living things",
          "Classifying living and non-living things",
          "Describing life cycles of animals",
          "Comparing structural features of plants and animals",
          "Describing adaptations that help living things survive in their environment",
        ],
      },
      {
        id: "chemical-sciences",
        label: "Chemical Sciences",
        skills: [
          "Identifying properties of solids, liquids and gases",
          "Describing changes of state caused by heating and cooling",
          "Classifying materials by observable properties",
          "Distinguishing reversible from irreversible changes",
        ],
      },
      {
        id: "physical-sciences",
        label: "Physical Sciences",
        skills: [
          "Describing the effects of forces on the motion of objects",
          "Identifying sources of light and sound",
          "Describing how heat moves from one object to another",
          "Explaining shadows formed by blocking a light source",
        ],
      },
      {
        id: "earth-and-space-sciences",
        label: "Earth and Space Sciences",
        skills: [
          "Describing observable changes in the sky and landscape",
          "Identifying Earth's rotation as the cause of day and night",
          "Describing the stages of the water cycle",
          "Describing Earth's place in the solar system",
        ],
      },
      {
        id: "science-inquiry",
        label: "Science inquiry",
        skills: [
          "Checking a claim against a results table",
          "Drawing a conclusion from a line graph",
          "Explaining why some things are kept the same",
          "Identifying the variable that was changed",
          "Ordering the steps of an investigation",
        ],
      },
    ],
  },
  {
    id: "digital_technologies",
    label: "Digital Technologies",
    supportedExamStyles: ["icas_style"],
    yearLevels: ICAS_DIGITAL_TECHNOLOGIES_YEARS,
    strands: [
      {
        id: "digital-systems",
        label: "Digital Systems",
        skills: [
          "Computer hardware basics",
          "Input and output devices",
          "Choosing digital tools",
          "Hardware and software",
          "How networks share information",
        ],
      },
      {
        id: "data-and-information",
        label: "Data and Information",
        skills: [
          "Representing data with symbols",
          "Reading data tables",
          "Reading data displays",
          "Representing data with numbers",
          "Interpreting collected data",
          "Comparing survey results",
        ],
      },
      {
        id: "algorithms-and-programming",
        label: "Algorithms and Programming",
        skills: [
          "Following step-by-step instructions",
          "Finding errors in instructions",
          "Tracing branching instructions",
          "Loops and repetition",
          "Debugging instructions",
        ],
      },
      {
        id: "digital-citizenship-and-safety",
        label: "Digital Citizenship and Safety",
        skills: [
          "Personal information online",
          "Respectful online behaviour",
          "Protecting personal data",
          "Evaluating online information",
        ],
      },
      {
        id: "algorithms",
        label: "Algorithms",
        skills: [
          "Choose the set of steps that completes a task",
          "Count how many times a step still repeats in a loop",
          "Find the missing step in an algorithm",
          "Find the wrong step in a set of instructions",
          "Follow a simple 'if... then' instruction",
          "Follow a step-by-step sequence to find the result",
          "Put the steps of an everyday task in order",
          "Work out the result of a repeated instruction (loop)",
        ],
      },
      {
        id: "data",
        label: "Data",
        skills: [
          "Choose all data items that fit a rule",
          "Count and total using tally marks",
          "Decide if a statement about a pictograph is true or false",
          "Decide if items are grouped correctly by attribute",
          "Match symbols to their meanings using a key",
          "Read a value from a pictograph",
          "Read information from a table",
          "Sort items into a group by an attribute",
        ],
      },
      {
        id: "safe-and-responsible-use",
        label: "Safe and Responsible Use",
        skills: [
          "Being kind and polite online",
          "Choosing a sensible digital tool for a task",
          "Keeping a password private",
          "Matching a task to the right digital tool",
          "Recognising a strong password",
          "Recognising personal information",
          "Responding safely to an online stranger",
          "Spotting a suspicious pop-up message",
        ],
      },
    ],
  },
  {
    id: "spelling",
    label: "Spelling",
    supportedExamStyles: ["icas_style"],
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "phonic-patterns",
        label: "Phonic Patterns",
        skills: [
          "Vowel sound spellings",
          "Blends and digraphs",
          "Silent letters",
        ],
      },
      {
        id: "morphology-and-word-building",
        label: "Morphology and Word Building",
        skills: [
          "Adding -ing and -ed",
          "Simple plurals",
          "Suffixes -tion, -ous and -able",
          "Prefixes un-, re-, dis- and mis-",
          "Irregular plurals",
        ],
      },
      {
        id: "homophones-and-confusable-words",
        label: "Homophones and Confusable Words",
        skills: [
          "Common homophones",
          "Confusable word pairs",
        ],
      },
      {
        id: "spelling-rules-and-conventions",
        label: "Spelling Rules and Conventions",
        skills: [
          "Double letters",
          "Tricky common words",
          "Identifying misspellings",
          "Doubling rule with suffixes",
          "Australian spellings",
          "Spotting misspellings in sentences",
        ],
      },
      {
        id: "phonics-and-word-building",
        label: "Phonics and word building",
        skills: [
          "Adding -ed to a base word with no spelling change",
          "Adding -ing to a base word with no spelling change",
          "Choosing the correct short vowel in a one-syllable word",
          "Doubling the final consonant before adding -ed",
          "Doubling the final consonant before adding -ing",
          "Dropping the silent 'e' before adding -ed",
          "Dropping the silent 'e' before adding -ing",
          "Making a plural by adding -es after x, s, sh or ch",
          "Making a plural by adding -s",
          "Making a plural by changing y to -ies",
          "Recognising correctly spelt two-syllable words",
          "Spelling a long vowel with the silent 'e' (magic e) pattern",
          "Spelling the 'ch' digraph at the end of a word",
          "Spelling the long 'a' sound with the 'ai' vowel team",
          "Spelling the three-letter blend 'str' at the start of a word",
          "Spelling words that begin with the 'bl' blend",
          "Spelling words that begin with the 'sh' digraph",
          "Spelling words that begin with the 'th' digraph",
        ],
      },
      {
        id: "spelling",
        label: "Spelling",
        skills: [
          "Double consonant (bb) in 'rabbit'",
          "Double consonant (nn) in 'dinner'",
          "Doubling the final consonant before -ing (hopping)",
          "Homophones: bare vs bear",
          "Homophones: hear vs here",
          "Homophones: no vs know",
          "Homophones: their vs there",
          "Homophones: to vs too",
          "Proofreading: find the one misspelt word",
          "Proofreading: select the two misspelt words",
          "Silent letter b in 'climb'",
          "Soft c (c sounding like s) in 'circle'",
          "Soft g (g sounding like j) in 'gentle'",
          "Spelling the tricky word 'because'",
          "Spelling the tricky word 'friend'",
          "Spelling the tricky word 'said'",
          "Spelling the tricky word 'they'",
          "Spelling the tricky word 'was'",
        ],
      },
    ],
  },
  {
    id: "critical_creative_thinking",
    label: "Critical and Creative Thinking",
    supportedExamStyles: ["icas_style"],
    yearLevels: ALL_YEARS,
    strands: [
      {
        id: "logical-reasoning",
        label: "Logical Reasoning",
        skills: [
          "Simple deductions",
          "True statements from clues",
          "Sequencing events",
          "Deductive reasoning",
          "Logic grid clues",
        ],
      },
      {
        id: "patterns-and-relationships",
        label: "Patterns and Relationships",
        skills: [
          "Shape and number patterns",
          "Odd one out",
          "Number pattern rules",
          "Letter and symbol patterns",
        ],
      },
      {
        id: "evaluating-ideas-and-evidence",
        label: "Evaluating Ideas and Evidence",
        skills: [
          "Fact versus opinion",
          "Cause and effect",
          "Identifying assumptions",
          "Strength of evidence",
          "Does the conclusion follow",
        ],
      },
      {
        id: "creative-problem-solving",
        label: "Creative Problem Solving",
        skills: [
          "Conclusions from data",
          "Everyday number puzzles",
          "Data-informed decisions",
          "Constraint puzzles",
        ],
      },
    ],
  },
] as const satisfies readonly SubjectRegistryEntry[];

export type SubjectId = (typeof SUBJECT_REGISTRY)[number]["id"];

/**
 * Turns any subject-registry-shaped array into the `[string, ...string[]]`
 * tuple `z.enum` requires. Exported (rather than kept private) so tests can
 * prove the "add one entry, that subject becomes valid" mechanism against a
 * throwaway registry without mutating `SUBJECT_REGISTRY` itself.
 */
export function subjectIdsFromRegistry<
  const R extends readonly { readonly id: string }[],
>(registry: R): [R[number]["id"], ...R[number]["id"][]] {
  if (registry.length === 0) {
    throw new Error("Subject registry must not be empty.");
  }
  return registry.map((entry) => entry.id) as [R[number]["id"], ...R[number]["id"][]];
}

export const SUBJECT_IDS = subjectIdsFromRegistry(SUBJECT_REGISTRY);

function validateSubjectRegistry(registry: readonly SubjectRegistryEntry[]): void {
  const seenSubjectIds = new Set<string>();
  for (const subject of registry) {
    if (seenSubjectIds.has(subject.id)) {
      throw new Error(`Subject registry has a duplicate subject id '${subject.id}'.`);
    }
    seenSubjectIds.add(subject.id);

    if (subject.strands.length === 0) {
      throw new Error(`Subject '${subject.id}' must declare at least one strand.`);
    }

    const seenStrandIds = new Set<string>();
    for (const strand of subject.strands) {
      if (seenStrandIds.has(strand.id)) {
        throw new Error(
          `Subject '${subject.id}' has a duplicate strand id '${strand.id}'.`,
        );
      }
      seenStrandIds.add(strand.id);
    }
  }
}

validateSubjectRegistry(SUBJECT_REGISTRY);

export function getSubject(subjectId: string): SubjectRegistryEntry | undefined {
  return SUBJECT_REGISTRY.find((subject) => subject.id === subjectId);
}

export function isKnownSubject(subjectId: string): subjectId is SubjectId {
  return SUBJECT_REGISTRY.some((subject) => subject.id === subjectId);
}

export function getStrandsForSubject(subjectId: string): readonly SubjectStrand[] {
  return getSubject(subjectId)?.strands ?? [];
}

/**
 * Whether this subject's paper is actually set in this style at this year.
 *
 * Three independent facts have to agree, and checking any two of them lets
 * a paper through that nobody sits: the style must run at the year
 * (`isValidStyleYear`), the subject must be assessed in that style at all
 * (NAPLAN sets neither Science nor Digital Technologies), and the year must
 * fall in the subject's own span (ICAS stops setting Digital Technologies
 * after Year 7).
 *
 * This is the SUBJECT dimension of "is this a real sitting", and it is
 * deliberately the one predicate the catalogue and the coverage walk both
 * call — two copies would drift the moment a subject's span changed.
 * Whether content exists for the cell is coverage, and lives in
 * ./coverage.ts.
 */
export function isSubjectSatIn(
  subjectId: string,
  examStyle: ExamStyle,
  yearLevel: YearLevel,
): boolean {
  const subject = getSubject(subjectId);
  if (!subject) return false;
  return (
    isValidStyleYear(examStyle, yearLevel) &&
    subject.supportedExamStyles.includes(examStyle) &&
    subject.yearLevels.includes(yearLevel)
  );
}

/**
 * Content stores `metadata.strand` as free-text display copy (e.g.
 * `"Number"`), not the registry's stable `id` slug, so lookups compare
 * against `label`.
 *
 * Compared case- and whitespace-insensitively, because free-text display
 * copy is exactly where casing drifts between authoring batches: the
 * 2026-08-08 Grade 3 ingest wrote "Chemical sciences" where the registry
 * had "Chemical Sciences", and used both "Number and Algebra" and "Number
 * and algebra" within one batch. Those are the same strand by any reading,
 * and registering per-casing duplicates to satisfy an exact match would
 * have split each one's coverage in two.
 */
export function isKnownStrandLabel(subjectId: string, strandLabel: string): boolean {
  const wanted = strandLabel.trim().toLocaleLowerCase("en-AU");
  return getStrandsForSubject(subjectId).some(
    (strand) => strand.label.trim().toLocaleLowerCase("en-AU") === wanted,
  );
}
