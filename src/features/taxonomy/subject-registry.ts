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
import type { ExamStyle } from "@/schemas/question.schema";

export interface SubjectStrand {
  readonly id: string;
  readonly label: string;
  readonly skills: readonly string[];
}

export interface SubjectRegistryEntry {
  readonly id: string;
  readonly label: string;
  readonly supportedExamStyles: readonly ExamStyle[];
  readonly strands: readonly SubjectStrand[];
  readonly coverageTargets?: Readonly<Record<string, number>>;
}

const BOTH_EXAM_STYLES: readonly ExamStyle[] = ["naplan_style", "icas_style"];

export const SUBJECT_REGISTRY = [
  {
    id: "numeracy",
    label: "Numeracy",
    supportedExamStyles: BOTH_EXAM_STYLES,
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
    ],
  },
  {
    id: "reading",
    label: "Reading",
    supportedExamStyles: BOTH_EXAM_STYLES,
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
    ],
  },
  {
    id: "writing",
    label: "Writing",
    supportedExamStyles: BOTH_EXAM_STYLES,
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
 * Content stores `metadata.strand` as free-text display copy (e.g.
 * `"Number"`), not the registry's stable `id` slug, so lookups compare
 * against `label`.
 */
export function isKnownStrandLabel(subjectId: string, strandLabel: string): boolean {
  return getStrandsForSubject(subjectId).some((strand) => strand.label === strandLabel);
}
