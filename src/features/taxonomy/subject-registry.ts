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
  /**
   * Which exam style sets this strand. Omitted means both.
   *
   * NAPLAN and ICAS organise the same subject on different taxonomies, and
   * one subject id carries questions from both: `numeracy` holds NAPLAN
   * numeracy (three Australian Curriculum strands) alongside ICAS
   * Mathematics (five), and `reading` holds NAPLAN reading alongside ICAS
   * English. A single flat strand list per subject could only ever be the
   * union of the two, which would let an ICAS strand be attached to a
   * NAPLAN question and call it valid.
   *
   * Scoping strands by style rather than splitting the subject ids is
   * deliberate: splitting is backlog item 4 (ICAS English as its own
   * subject), a larger change with its own programme and catalogue
   * consequences. This narrows what is valid today without pre-empting it.
   */
  readonly examStyles?: readonly ExamStyle[];
  /**
   * Retained only to keep existing questions valid, and not part of the
   * official taxonomy. Every legacy strand holds questions the strand
   * migration refused to place automatically — see
   * scripts/migrate-strands.mts. Nothing new should be authored into one,
   * and the strand disappears when its questions are re-filed by hand.
   */
  readonly legacy?: boolean;
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
        id: "number-and-algebra",
        label: "Number and algebra",
        examStyles: ["naplan_style"],
        skills: [
          "Add 100 to a 3-digit number using place value",
          "Add 3-digit numbers with regrouping",
          "Add 3-digit numbers with two regroupings",
          "Add two amounts of money in cents",
          "Add two three-digit numbers involving regrouping",
          "Adding money amounts",
          "Build a three-digit number from hundreds, tens and ones",
          "Calculate change from a purchase under $20",
          "Compare 3-digit numbers using place value",
          "Compare the size of halves and quarters of one whole",
          "Comparing fractions with one half",
          "Continue a doubling pattern",
          "Continue a skip-counting pattern on a number line",
          "Continue a skip-counting pattern shown on a number line",
          "Continue an increasing number pattern",
          "Describing a fraction model",
          "Divide within 10x10 in a word problem",
          "Find a fraction of a group then the remaining part",
          "Find a total from equal rows using multiplication",
          "Find a unit fraction (one third) of a whole group",
          "Find the difference between points on a number line",
          "Identify the value of a digit in a three-digit number",
          "Identifying even numbers",
          "Make and compare a money total under $20",
          "Multiply within 10x10 in a word problem",
          "Name the fraction of a group shown in a pie chart",
          "Name the fraction shown by one equal part of a pie chart",
          "Naming fractions from a model",
          "Order 3-digit numbers from smallest to largest",
          "Order three-digit numbers from smallest to largest",
          "Ordering decimals on a number line",
          "Read values on a number line and find a difference",
          "Reading a number line",
          "Reading decimals on a number line",
          "Reason backwards about rounding to the nearest 10",
          "Round a 2-digit number to the nearest 10",
          "Share a quantity equally using a known times fact",
          "Solve a two-step money problem with multiplication then subtraction",
          "Solve a two-step problem using a multiplication fact then subtraction",
          "Solving multi-step money problems",
          "Subtract 3-digit numbers with regrouping",
          "Subtract a three-digit number needing regrouping",
          "Subtract a two-digit number from a three-digit number with regrouping",
          "Understand the value of a digit in a 3-digit number",
          "Use a known multiplication fact to solve a division",
        ],
      },
      {
        id: "measurement-and-geometry",
        label: "Measurement and geometry",
        examStyles: ["naplan_style"],
        skills: [
          "Calculating perimeter and area of a rectangle",
          "Calculating the perimeter of a square",
          "Classifying angles",
          "Compare capacity using standard units and division",
          "Compare masses in a table and find the difference",
          "Compare masses in a table by finding the difference",
          "Compare the number of corners of 2D shapes",
          "Convert metres to centimetres",
          "Count lines of symmetry in a letter shape",
          "Estimate mass using sensible standard units",
          "Find the perimeter of a rectangle from its length and width",
          "Finding horizontal distance between points",
          "Identifying a parallelogram",
          "Identifying a square by its properties",
          "Identifying right angles in shapes",
          "Locating points on a grid",
          "Match half past a time to its digital form",
          "Name a 2D shape from its number of sides and corners",
          "Name a 2D shape from its sides and corners",
          "Name a 3D object from its faces",
          "Naming 2D shapes",
          "Naming parts of a circle",
          "Read a bar graph to find the greatest capacity",
          "Read an analog clock to the nearest 5 minutes",
          "Reading coordinate pairs",
          "Work out an elapsed time from a timetable",
          "Work out change from a whole dollar amount",
        ],
      },
      {
        id: "statistics-and-probability",
        label: "Statistics and probability",
        examStyles: ["naplan_style"],
        skills: [
          "Add two values read from a bar graph",
          "Adding values from a bar chart",
          "Compare and order values in a data table",
          "Compare two columns of a bar graph by subtracting",
          "Compare two values on a bar chart",
          "Comparing values in a bar chart",
          "Comparing values in a table",
          "Find the change between two points on a line graph",
          "Find the largest value on a bar graph",
          "Interpreting bar charts",
          "Matching values on a line graph",
          "Ordering data by size",
          "Ordering values from a graph",
          "Read a simple table to compare values",
          "Read a table to find the largest value",
          "Read a value from a bar chart",
          "Read two values from a table and add them",
          "Reading values against a threshold",
          "Relating fractions to a pie chart",
          "Relating fractions to data",
        ],
      },
      {
        id: "number-and-arithmetic",
        label: "Number & Arithmetic",
        examStyles: ["icas_style"],
        skills: [
          "Adding three-digit numbers with two regroupings",
          "Arranging digits to build the largest number",
          "Building a three-digit number from place value clues",
          "Choosing items that total an exact amount of money",
          "Combine multiplying and comparing quantities",
          "Comparing table data using subtraction across a zero",
          "Comparing two multiplication totals to judge a claim",
          "Counting on in equal steps from a marked point",
          "Dividing a length into equal parts",
          "Doubling and halving to solve problems",
          "Finding a fraction of a collection",
          "Finding a quarter of a group and the remaining part",
          "Finding change by subtracting in cents",
          "Finding the distance between two points on a number line",
          "Finding the number halfway between two points",
          "Identifying multiples of 4",
          "Matching expanded form to a standard number",
          "Multi-step word problem with two operations",
          "Ordering numbers written in words, digits and place-value form",
          "Ordering three-digit numbers",
          "Ordering values from a table",
          "Read values on a number line and find a difference",
          "Reading a value from a table then dividing equally",
          "Reading positions and steps on a number line",
          "Reason about how many more are needed",
          "Reasoning with money and change across several purchases",
          "Recognising one half in different models",
          "Rounding a two-digit number to the nearest ten",
          "Sharing with a remainder and interpreting what is left",
          "Two-step word problems with money",
          "Using a division fact then subtracting in a two-step problem",
        ],
      },
      {
        id: "algebra-and-patterns",
        label: "Algebra & Patterns",
        examStyles: ["icas_style"],
        skills: [
          "Applying a discovered multiplication rule",
          "Check whether a sequence rule was applied correctly",
          "Continue a growing number sequence",
          "Deduce a missing value in a balanced equation",
          "Extending a linear pattern",
          "Find a rule for a growing pattern and extend it",
          "Finding a later term in a subtract-constant pattern",
          "Finding a later term in an add-constant pattern",
          "Finding a term in a repeating pattern using groups",
          "Reason about a doubling sequence",
          "Solving for an unknown using two picture equations",
          "Use clues to order items in a sequence",
          "Work backwards from a result to find a start number",
          "Work backwards through two changes",
          "Working backwards to find an unknown that appears twice",
        ],
      },
      {
        id: "measures-and-units",
        label: "Measures & Units",
        examStyles: ["icas_style"],
        skills: [
          "Adding one week to a day and date",
          "Calculating the area of a triangle",
          "Calculating the perimeter of a rectangle",
          "Choosing a sensible metric unit for a length",
          "Comparing capacities in millilitres and litres",
          "Dividing a capacity after converting litres to millilitres",
          "Finding a finish time after a duration",
          "Finding elapsed time by counting on to the next hour",
          "Locating a named weekday and date on a calendar",
          "Matching a length to an appropriate unit",
          "Matching spoken time to digital time",
          "Measurement comparisons requiring unit conversion (kg/g)",
          "Measurement comparisons requiring unit conversion (m/cm)",
          "Reading a scale and finding the difference between two points",
          "Reading masses from a bar chart and combining them",
          "Time intervals and elapsed time problems",
          "Using a constant time interval to find a later time",
          "Working out a new direction after turns",
        ],
      },
      {
        id: "space-and-geometry",
        label: "Space & Geometry",
        examStyles: ["icas_style"],
        skills: [
          "Counting lines of symmetry in a figure",
          "Counting lines of symmetry of a shape",
          "Filtering points by coordinate",
          "Finding the distance around a rectangle",
          "Identifying a 2D shape from its properties",
          "Identifying a 3D solid from the number and shape of its faces",
          "Identifying a solid from its faces",
          "Identifying acute angles",
          "Identifying curved and straight sides",
          "Naming a shape from its sides and corners",
          "Naming parts of 3D objects",
          "Naming polygons by side count",
          "Predict the solid formed by folding a net",
          "Reason about lines of symmetry described in words",
        ],
      },
      {
        id: "chance-and-data",
        label: "Chance & Data",
        examStyles: ["icas_style"],
        skills: [
          "Checking statements about graph data by calculating",
          "Choosing an item that meets a condition then comparing price",
          "Combining values read from a bar chart",
          "Combining values read from a bar chart to match a total",
          "Compare quantities from a bar chart",
          "Comparing data multiplicatively",
          "Comparing values on a column graph",
          "Deciding which share is more than half",
          "Draw a conclusion from a data table",
          "Finding the difference between extremes",
          "Finding the difference between the largest and smallest bar",
          "Finding the largest change on a line graph",
          "Finding the maximum on a line graph",
          "Interpret a two-way or grouped table",
          "Reading a bar chart and multiplying to compare totals",
          "Reasoning with two-way data in a table",
          "Recognising a half share on a pie chart",
          "Spotting where a line graph stays level",
          "Using doubling to compare heights on a chart",
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
        id: "locating-and-identifying",
        label: "Locating and identifying",
        examStyles: ["naplan_style"],
        skills: [
          "Checking multiple details in a text",
          "Connect two parts of a text",
          "Finding a detail in a poem",
          "Finding a fact in an information text",
          "Finding information in a table",
          "Finding the reason given for a rule",
          "Follow the sequence of steps",
          "Following a specific step in instructions",
          "Identifying the order of steps",
          "Infer a cause from the text",
          "Infer a feeling from clues",
          "Locate directly stated information",
          "Locate directly stated information in a text",
          "Locating a directly stated detail",
          "Locating directly stated details",
          "Match facts to details in a text",
          "Recalling names and details",
          "Sequence events in a recount",
          "Sequencing events in a narrative",
          "Verifying details in an information text",
        ],
      },
      {
        id: "integrating-and-interpreting",
        label: "Integrating and interpreting",
        examStyles: ["naplan_style"],
        skills: [
          "Choosing the best word meaning",
          "Connect two parts of a text",
          "Connect two parts of a text to explain why",
          "Drawing a conclusion from a stated fact",
          "Follow cause and effect in a short text",
          "Identify the main idea",
          "Identify the main idea of a paragraph or whole text",
          "Identify the main idea of a text",
          "Identify the main idea or overall feeling",
          "Identifying the main idea of a text",
          "Infer a feeling from clues in the text",
          "Inferring motives from actions",
          "Inferring reasons for actions",
          "Inferring the reason behind an instruction",
          "Integrating text with a table",
          "Interpreting idioms in context",
          "Make a straightforward inference from the text",
          "Understand figurative language in a poem",
          "Understand vocabulary in context",
          "Using context clues for word meaning",
          "Work out the meaning of a phrase in a poem",
          "Work out the meaning of a phrase in context",
          "Work out the meaning of a word in context",
          "Working out a word's meaning from context",
          "Working out how a person feels",
          "Working out why an event happens",
        ],
      },
      {
        id: "analysing-and-evaluating",
        label: "Analysing and evaluating",
        examStyles: ["naplan_style"],
        skills: [
          "Classifying statements as fact or opinion",
          "Distinguishing fact from opinion",
          "Explain how a writer creates a mood",
          "Identify text purpose and audience",
          "Identify the author's purpose",
          "Identify the purpose of a text",
          "Identify the purpose of a text feature",
          "Identify the purpose of an instruction",
          "Identifying author purpose",
          "Identifying the purpose of a text",
          "Identifying who a text is written for",
          "Understand a simile in a poem",
          "Understanding a condition in a text",
        ],
      },
      {
        id: "text-comprehension",
        label: "Text Comprehension",
        examStyles: ["icas_style"],
        skills: [
          "Close reading of a narrative ending",
          "Compare and contrast details in a text",
          "Compare information across parts of a text",
          "Compare the roles of different characters",
          "Compare two characters",
          "Compare two things in a text",
          "Comparing how two characters behave",
          "Determine the author's purpose",
          "Distinguishing a stated fact from an implied idea",
          "Draw a conclusion about the message",
          "Drawing a conclusion by combining two facts",
          "Drawing conclusions from an information text",
          "Finding a stated reason in an information text",
          "Finding information stated directly in a text",
          "Identify a supporting detail in a text",
          "Identify cause and effect",
          "Identify cause and effect in a narrative",
          "Identify cause and effect in a text",
          "Identify the author's point of view",
          "Identify the author's purpose",
          "Identify the main idea",
          "Identify the main idea of a passage",
          "Identify the main idea of a text",
          "Identify the theme or message of a story",
          "Identifying the cause of an event",
          "Identifying the effect of an action",
          "Identifying the main idea of a whole text",
          "Infer a character trait from evidence in the text",
          "Infer a character's feeling",
          "Infer a character's feeling from evidence in the text",
          "Infer a character's feelings from clues",
          "Infer a character's feelings from the text",
          "Infer a character's motive",
          "Infer a character's motive from evidence in the text",
          "Inferring character and animal behaviour from detail",
          "Inferring how a character feels",
          "Inferring how characters feel",
          "Inferring purpose from an information text",
          "Inferring why a character acts",
          "Inferring why a character says something",
          "Locate and match details in a text",
          "Match information to details in a text",
          "Matching each detail to what the text says about it",
          "Predict a character's behaviour",
          "Predict what will happen next",
          "Predict what will happen next using clues",
          "Predicting what happens next",
          "Reading a table alongside a passage",
          "Reason about cause and effect",
          "Selecting statements that correctly compare two characters",
          "Sequence events in a text",
          "Sequence events in the order they happen",
          "Sequence stages in a process",
          "Sequence steps in a process",
          "Sequencing events",
          "Understand cause and effect in a text",
          "Understanding the effect of a particular word choice",
          "Using headings to find the right part of a text",
          "Work out the meaning of a word from context",
          "Working out the author's purpose for writing",
          "Working out the meaning of a word from its context",
          "Working out why an author included a comparison",
          "Working out why an author included a paragraph",
        ],
      },
      {
        id: "writers-craft",
        label: "Writer's Craft",
        examStyles: ["icas_style"],
        skills: [
          "Understanding what a comparison shows",
        ],
      },
      {
        id: "syntax",
        label: "Syntax",
        examStyles: ["icas_style"],
        skills: [
          "Syntax skills to be authored",
        ],
      },
      {
        id: "vocabulary",
        label: "Vocabulary",
        examStyles: ["icas_style"],
        skills: [
          "Work out the meaning of a word in context",
          "Work out the meaning of a word with more than one meaning",
          "Work out word meaning in context",
          "Working out word meaning from context",
        ],
      },
      {
        id: "narrative-comprehension",
        label: "Narrative comprehension",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Infer a feeling from clues in the text",
          "Sequence events in a recount",
          "Sequencing events in a story",
        ],
      },
      {
        id: "information-text-comprehension",
        label: "Information text comprehension",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Connect two parts of a text",
          "Match details to parts of a text",
          "Match facts to details in a text",
          "Matching parts of an animal to their use",
          "Work out the meaning of words in context",
        ],
      },
      {
        id: "procedural-text-comprehension",
        label: "Procedural text comprehension",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Follow sequence in a short text",
          "Follow the sequence of steps",
          "Sequence the steps in a procedure",
        ],
      },
      {
        id: "everyday-text-comprehension",
        label: "Everyday text comprehension",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Connect two parts of a text",
        ],
      },
      {
        id: "poetry-comprehension",
        label: "Poetry comprehension",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Infer meaning from a poem",
          "Understand figurative language in a poem",
          "Work out the meaning of a word in a poem",
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
        id: "spelling-naplan",
        label: "Spelling",
        examStyles: ["naplan_style"],
        skills: [
          "Building a word with the prefix un-",
          "Building a word with the suffix -ful",
          "Choose the correct spelling of a common word",
          "Choosing the correct homophone (here / hear)",
          "Choosing the correct homophone (know / no)",
          "Choosing the correct homophone (there / their / they're)",
          "Choosing the correct homophone (to / too / two)",
          "Choosing the correctly spelled word (because)",
          "Doubling the final consonant before adding -ing",
          "Forming adverbs with the suffix -ly",
          "Spelling common adjectives",
          "Spelling commonly confused words",
          "Spelling irregular plurals (foot / feet)",
          "Spelling irregular plurals ending in -f",
          "Spelling plurals by adding -es after x",
          "Spelling plurals: changing y to ies",
          "Spelling words with a silent k",
          "Spot a misspelled common Year 3 word",
          "Spotting misspelled words in a sentence",
        ],
      },
      {
        id: "grammar",
        label: "Grammar",
        examStyles: ["naplan_style"],
        skills: [
          "Choosing correct verb forms",
          "Choosing has or have to match the subject",
          "Choosing the correct past tense",
          "Choosing the correct preposition of place",
          "Choosing the correct subject pronoun (we)",
          "Classifying sentence types",
          "Comparative adjectives (-er)",
          "Distinguishing adverbs from adjectives",
          "Forming irregular plural nouns",
          "Identify a pronoun in a sentence",
          "Identify a verb in a sentence",
          "Identifying adverbs in sentences",
          "Identifying an adverb of manner in a sentence",
          "Identifying letter structure",
          "Identifying nouns, verbs and adjectives",
          "Identifying verbs in a sentence",
          "Irregular past tense verbs (run - ran)",
          "Keep verb tense consistent within a sentence",
          "Match a plural subject to its verb",
          "Match a singular subject to its verb",
          "Matching a plural subject to don't",
          "Matching a plural subject to its verb",
          "Matching conjunctions to their function",
          "Matching verb tense to a past-time signal",
          "Matching verbs to singular and plural subjects",
          "Ordering sentences for cohesion",
          "Ordering words to build a complete question",
          "Ordering words to build a statement",
          "Recognising adverbs",
          "Sorting common and proper nouns",
          "Sorting nouns and verbs",
          "Subject-verb agreement (was / were)",
          "Using 'a' and 'an' before nouns",
          "Using 'will' for the future tense",
          "Using superlative adjectives (-est)",
        ],
      },
      {
        id: "punctuation",
        label: "Punctuation",
        examStyles: ["naplan_style"],
        skills: [
          "Capital letters for months of the year",
          "Capital letters: sentence start and days of the week",
          "Capitalising proper nouns (names and places)",
          "Capitalising the pronoun I",
          "Choose the correct end mark for a question",
          "Choose the correct end punctuation for a sentence",
          "Ending a question with a question mark",
          "Form a contraction with a correctly placed apostrophe",
          "Forming contractions with an apostrophe",
          "Forming contractions with apostrophes",
          "Forming contractions with n't (didn't)",
          "Matching contractions to their full words",
          "Ordering words to build an exclamation",
          "Place commas correctly in a list",
          "Punctuating spoken words with speech marks",
          "Use a comma before a joining word in a compound sentence",
          "Use an apostrophe to show singular possession",
          "Use capital letters for sentence starts and proper nouns",
          "Using a comma after an introductory phrase",
          "Using an apostrophe to show singular possession",
          "Using apostrophes for singular possession",
          "Using capital letters and full stops correctly",
          "Using capital letters for sentences and proper nouns",
          "Using commas to separate items in a list",
        ],
      },
      {
        id: "text-comprehension",
        label: "Text Comprehension",
        examStyles: ["icas_style"],
        skills: [
          "Text Comprehension skills to be authored",
        ],
      },
      {
        id: "writers-craft",
        label: "Writer's Craft",
        examStyles: ["icas_style"],
        skills: [
          "Using cause-and-effect connectives",
        ],
      },
      {
        id: "syntax",
        label: "Syntax",
        examStyles: ["icas_style"],
        skills: [
          "Apostrophes to show possession",
          "Arranging words into a well-formed sentence",
          "Choose the correct conjunction to join ideas",
          "Choose the correct connective to join ideas",
          "Choose the grammatically correct sentence",
          "Choosing 'me' as the object in a pair",
          "Choosing a conjunction that shows cause and reason",
          "Choosing a question mark to end a question",
          "Choosing an exclamation mark for an exclamation",
          "Choosing between 'your' and 'you're'",
          "Choosing between its and it's",
          "Choosing the correct question word",
          "Comparative and superlative adjectives",
          "Contractions with is and will",
          "Fix a tense error in a sentence",
          "Fix an agreement error in a sentence",
          "Forming a contraction from 'we are'",
          "Identifying adjectives within a sentence",
          "Identifying an adverb that tells how an action is done",
          "Identifying the nouns in a sentence",
          "Identifying the verbs in a sentence",
          "Joining two short sentences with a conjunction",
          "Judging the past tense of an irregular verb",
          "Judging whether a sentence uses correct grammar",
          "Judging whether the verb matches a plural subject",
          "Making plurals of words ending in sh by adding -es",
          "Matching a verb to a past-time signal word",
          "Matching a verb to a singular subject across a nearby plural",
          "Matching a verb to a singular subject across a plural phrase",
          "Ordering words into a well-formed sentence",
          "Ordering words to build a correct sentence",
          "Placing speech marks around the exact spoken words",
          "Punctuate direct speech correctly",
          "Punctuate items in a list",
          "Punctuate possession correctly",
          "Recognising plurals that do not add -s",
          "Separating items in a list with commas",
          "Showing that one owner has something with an apostrophe",
          "Sorting nouns, verbs and adjectives",
          "Using a comma before a person's name when speaking to them",
          "Using an apostrophe to show ownership by a plural noun",
          "Using capitals and full stops to separate sentences",
          "Using capitals for the sentence start, places and months",
          "Using the articles a, an and the",
          "Working out which noun a pronoun replaces",
          "Writing the irregular plural of 'foot'",
          "lang.prod.grammar.complete-sentences",
          "lang.prod.grammar.conjunctions",
          "lang.prod.grammar.irregular-plurals",
          "lang.prod.grammar.pronoun-reference",
          "lang.prod.grammar.question-word-order",
          "lang.prod.grammar.subject-verb-agreement",
          "lang.prod.grammar.verb-tense",
          "lang.prod.parts-of-speech.adverbs",
          "lang.prod.punctuation.capital-letters",
          "lang.prod.punctuation.commas-in-lists",
          "lang.prod.punctuation.contractions",
          "lang.prod.punctuation.speech-marks",
          "lit.grammar.full-stops-question-marks",
        ],
      },
      {
        id: "vocabulary-icas",
        label: "Vocabulary",
        examStyles: ["icas_style"],
        skills: [
          "Adding the suffix -er to make 'gardener'",
          "Building a word by adding the suffix -ful",
          "Choosing a precise verb over a vague one",
          "Choosing a word with a similar meaning",
          "Choosing a word with the opposite meaning",
          "Choosing between their, there and they're",
          "Choosing between too, to and two by meaning",
          "Choosing the prefix that reverses a word's meaning",
          "Classifying figurative language",
          "Completing a part-to-whole analogy",
          "Completing a young-animal to grown-animal analogy",
          "Completing an opposite-word analogy",
          "Completing word analogies",
          "Finding a synonym for 'chilly'",
          "Finding the opposite of 'shrink'",
          "Grouping words by meaning",
          "Joining two words to form a compound word",
          "Joining two words to make a compound word",
          "Matching words to definitions",
          "Precise word choice and shades of meaning",
          "Producing antonyms",
          "Producing synonyms for formal words",
          "Putting words in alphabetical order",
          "Reasoning about word relationships",
          "Understanding the prefix 're-' meaning 'again'",
          "Working out meaning from the suffix -less",
          "lang.prod.vocabulary.compound-words",
          "lang.prod.vocabulary.prefixes",
          "lang.prod.vocabulary.suffixes",
        ],
      },
      {
        id: "vocabulary-naplan",
        label: "Vocabulary",
        examStyles: ["naplan_style"],
        /* LEGACY — not an official NAPLAN strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Matching words to their antonyms",
          "Producing synonyms",
        ],
      },
      {
        id: "spelling-icas",
        label: "Spelling",
        examStyles: ["icas_style"],
        /* LEGACY — not an official ICAS strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Choosing the correct homophone",
          "Common homophones (hear and here)",
          "Spelling regular plurals (-s, -es and -ies)",
          "The prefixes re- and dis-",
          "The suffixes -ful and -er",
        ],
      },
      {
        id: "phonics",
        label: "Phonics",
        examStyles: ["icas_style"],
        /* LEGACY — not an official ICAS strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
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
        id: "earth-and-beyond",
        label: "Earth & Beyond",
        examStyles: ["icas_style"],
        skills: [
          "Choosing the best action to reduce rubbish sent to landfill",
          "Day and night, sun and shadows",
          "Drawing a conclusion about litter harming animals from an observation",
          "Explaining day and night from Earth's rotation",
          "Explaining why the Sun is not seen at midnight",
          "Identifying a season from weather clues",
          "Interpreting shadow data to infer the Sun's position",
          "Ordering space objects by size",
          "Reading a value from a rainfall bar chart",
          "Reading a weather data table",
          "Reading and comparing values in a table",
          "Recognising true facts about the Sun",
          "Weather and seasons",
        ],
      },
      {
        id: "natural-and-processed-materials",
        label: "Natural & Processed Materials",
        examStyles: ["icas_style"],
        skills: [
          "Choosing a suitable material for a job",
          "Classify materials as solid, liquid or gas",
          "Dissolving a solid in water",
          "Identify evaporation and boiling",
          "Identify melting as a change of state",
          "Identifying a gas among solids and liquids",
          "Interpret results from a simple experiment table",
          "Linking a material's property to why it is chosen",
          "Matching a material's property to its use",
          "Matching materials to their useful properties",
          "Materials and their properties (float/sink, bend, absorb)",
          "Melting: solids turning to liquid when heated",
          "Recognising a reversible change",
          "Recognising that solids keep their shape",
          "Selecting a material using two properties from a table",
          "Selecting a material using two properties in a table",
          "Using a properties table to pick the best material",
        ],
      },
      {
        id: "life-and-living",
        label: "Life & Living",
        examStyles: ["icas_style"],
        skills: [
          "Distinguishing living things from moving non-living things",
          "Explain the function of leaves",
          "Explaining animal behaviour as a response to environment",
          "Explaining how a feature or behaviour helps an animal survive in its habitat",
          "Identify observable features",
          "Identify plant parts and their functions",
          "Identify the needs of plants",
          "Identifying camouflage as a feature that keeps an animal safe",
          "Identifying living things from their characteristics",
          "Identifying the daily needs of a living animal",
          "Identifying the first stage after a butterfly egg hatches",
          "Identifying the function of a plant's roots",
          "Interpreting a data table to find what a plant needs to grow",
          "Living things: needs, life cycles, habitats",
          "Matching animals to their animal group by features",
          "Matching animals to their habitats",
          "Matching foods to the plant or animal they come from",
          "Matching plant parts to their jobs",
          "Ordering a simple food chain",
          "Ordering the stages of a frog's life cycle",
          "Reasoning about why animals store fat before winter",
          "Sequencing stages of an animal life cycle",
          "Sequencing the stages of a frog's life cycle",
          "Sort animals by observable features",
          "Sorting things into living and non-living",
        ],
      },
      {
        id: "energy-and-change",
        label: "Energy & Change",
        examStyles: ["icas_style"],
        skills: [
          "Drawing a conclusion about force size from a chart",
          "Explain how shadows form",
          "Explaining how shadows are formed",
          "Explaining motion using friction",
          "Forces and movement: push, pull, friction, gravity",
          "Identifying magnetic materials",
          "Identifying pushes and pulls",
          "Interpret results from a simple experiment table",
          "Knowing which materials a magnet attracts",
          "Link sound to vibration",
          "Linking friction to distance travelled using a chart",
          "Reading a value from a bar chart",
          "Reading a value from a ramp results table",
          "Reading float and sink results from a table",
          "Recognising true facts about how magnets behave",
          "Understanding that pushes and pulls are forces",
          "Understanding that vibrations make sound",
        ],
      },
      {
        id: "observing-and-measuring",
        label: "Observing & Measuring",
        examStyles: ["icas_style"],
        skills: [
          "Reading a measurement from a number line",
          "Reading a number line and finding a difference",
        ],
      },
      {
        id: "interpreting",
        label: "Interpreting",
        examStyles: ["icas_style"],
        skills: [
          "Calculate change from a line graph",
          "Checking a claim against a results table",
          "Compare values on a bar chart",
          "Finding the largest change on a line graph",
          "Read change from a line graph",
        ],
      },
      {
        id: "predicting-and-concluding",
        label: "Predicting & Concluding",
        examStyles: ["icas_style"],
        skills: [
          "Drawing a conclusion from a line graph",
        ],
      },
      {
        id: "investigating",
        label: "Investigating",
        examStyles: ["icas_style"],
        skills: [
          "Choosing variables to keep constant in a fair test",
          "Explaining why some things are kept the same",
          "Identify the changed variable",
          "Identify the measured variable",
          "Identifying the variable that was changed",
          "Judging whether an investigation is fair",
          "Keep variables controlled",
          "Ordering the steps of an investigation",
        ],
      },
      {
        id: "reasoning-and-problem-solving",
        label: "Reasoning & Problem Solving",
        examStyles: ["icas_style"],
        skills: [
          "Reasoning from evidence to solve a problem",
        ],
      },
      {
        id: "science-inquiry",
        label: "Science inquiry",
        examStyles: ["icas_style"],
        /* LEGACY — not an official ICAS strand. Retained only so the
           questions the migration could not place automatically stay valid;
           see scripts/migrate-strands.mts and the unmapped queue. */
        legacy: true,
        skills: [
          "Comparing two bars to find the difference",
          "Comparing values on a bar chart",
          "Finding the largest category on a pie chart",
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
        examStyles: ["icas_style"],
        skills: [
          "Apply digital technologies concepts",
          "Continuing an on and off pattern",
          "Digital systems: input, process, output, storage devices",
          "Following a menu to find the right button",
          "Following a yes or no decision in a flowchart",
          "Identifying a device used to store and move files",
          "Identifying an input device",
          "Identifying an output device",
          "Matching a device to the job it does",
          "Matching digital words to their meaning",
          "Matching hardware to its job",
          "Matching hardware to its purpose",
          "Matching hardware to the job it does",
          "Ordering the steps in a flowchart",
          "Reading a two-symbol code",
          "Sorting devices into inputs and outputs",
          "Sorting items as hardware or software",
          "Telling hardware apart from software",
          "Telling hardware from software",
          "Understanding what software is",
        ],
      },
      {
        id: "word-processing",
        label: "Word Processing",
        examStyles: ["icas_style"],
        skills: [
          "Formatting text in a document",
        ],
      },
      {
        id: "graphics-and-multimedia",
        label: "Graphics & Multimedia",
        examStyles: ["icas_style"],
        skills: [
          "Choosing a suitable image format",
        ],
      },
      {
        id: "internet-and-email",
        label: "Internet & Email",
        examStyles: ["icas_style"],
        skills: [
          "Apply digital technologies concepts",
          "Being kind and asking before sharing",
          "Being kind and polite online",
          "Choosing a sensible digital tool for a task",
          "Choosing a strong password",
          "Choosing safe actions when a site asks for personal details",
          "Choosing safe and kind online actions",
          "Keeping a password private",
          "Keeping a password safe",
          "Knowing when to tell a trusted adult",
          "Matching a task to the right digital tool",
          "Matching online situations to good actions",
          "Matching online situations to safe actions",
          "Recognising a strong password",
          "Recognising personal information",
          "Recognising unsafe requests for personal details",
          "Responding safely to an online stranger",
          "Responding safely to online strangers",
          "Safe and responsible use of devices and passwords",
          "Spotting a suspicious pop-up message",
        ],
      },
      {
        id: "spreadsheets-and-databases",
        label: "Spreadsheets & Databases",
        examStyles: ["icas_style"],
        skills: [
          "Apply digital technologies concepts",
          "Choose all data items that fit a rule",
          "Choosing sensible ways to sort data",
          "Comparing values on a bar chart",
          "Count and total using tally marks",
          "Decide if a statement about a pictograph is true or false",
          "Decide if items are grouped correctly by attribute",
          "Finding a total from a data table",
          "Finding the distance between two points on a number line",
          "Interpreting a data table with two number columns",
          "Linking a fraction of a group to a pie chart slice",
          "Linking a fraction of a group to chart data",
          "Match symbols to their meanings using a key",
          "Read a value from a pictograph",
          "Read and interpret data in a table or pictograph a computer produced",
          "Read information from a table",
          "Reading an exact value from a bar chart",
          "Reading the correct column of a data table",
          "Reading the right column of a data table",
          "Reading totals from a pictograph key",
          "Sort items into a group by an attribute",
          "Working out a total from a pictograph key",
        ],
      },
      {
        id: "programming",
        label: "Programming",
        examStyles: ["icas_style"],
        skills: [
          "Apply digital technologies concepts",
          "Choose the set of steps that completes a task",
          "Count how many times a step still repeats in a loop",
          "Debugging a sequence of instructions",
          "Find the missing step in an algorithm",
          "Find the wrong step in a set of instructions",
          "Finding a step that is out of order",
          "Finding the misplaced step in a sequence",
          "Finding the step with a mistake in a sequence",
          "Follow a simple 'if... then' instruction",
          "Follow a step-by-step sequence to find the result",
          "Follow and order the steps of a simple algorithm",
          "Following an if-then rule to choose an action",
          "Ordering an algorithm that uses repetition",
          "Ordering the steps of a simple algorithm",
          "Ordering the steps to use a system",
          "Patterns and simple branching (if/then) in everyday instructions",
          "Put the steps of an everyday task in order",
          "Putting everyday steps into a correct algorithm",
          "Putting the steps of a task in a sensible order",
          "Sequencing instructions so a task works correctly",
          "Work out the result of a repeated instruction (loop)",
          "Working out the output of a simple rule",
          "Working out the output of a two-step rule",
          "Working out the result of a repeated instruction",
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
        id: "visual",
        label: "Visual",
        examStyles: ["icas_style"],
        skills: [
          "Apply the Australian verb and noun spelling split",
          "Choose between an a and e homophone pair",
          "Choose the homophone matching the meaning",
          "Choosing between the homophones 'here' and 'hear'",
          "Choosing between the homophones 'too', 'to' and 'tow'",
          "Choosing between the homophones 'won' and 'one'",
          "Choosing between the homophones 'wood' and 'would'",
          "Choosing the correct homophone (hear / here)",
          "Choosing the correct homophone (their / there / they're)",
          "Choosing the correct homophone (to / too / two)",
          "Choosing the possessive homophone 'their'",
          "Complete a word beginning with wh",
          "Correct a word ending in ence",
          "Decide which consonant doubles",
          "Distinguish the possessive its from the contraction it's",
          "Double consonant (bb) in 'rabbit'",
          "Double consonant (nn) in 'dinner'",
          "Find a word with an omitted letter",
          "Finding the misspelled word (library) in a sentence",
          "Homophones: bare vs bear",
          "Homophones: hear vs here",
          "Homophones: no vs know",
          "Homophones: their vs there",
          "Homophones: to vs too",
          "Identifying missing silent letters",
          "Knowing that 'bus' is spelled with one 's'",
          "Match the le spelling to the meaning rule",
          "Proofreading: find the one misspelt word",
          "Proofreading: select the two misspelt words",
          "Recognising correctly spelled common words",
          "Select the ance ending for an abstract noun",
          "Select the confusable word that fits the meaning",
          "Select the possessive form of a three-way homophone",
          "Separate the c noun from the s verb",
          "Silent letter b in 'climb'",
          "Spell the homophone matching a given meaning",
          "Spell words with an initial silent k",
          "Spelling a long vowel with the silent 'e' (magic e) pattern",
          "Spelling frequently misspelled words",
          "Spelling the tricky word 'because'",
          "Spelling the tricky word 'friend'",
          "Spelling the tricky word 'friend' with 'ie' in the middle",
          "Spelling the tricky word 'said'",
          "Spelling the tricky word 'they'",
          "Spelling the tricky word 'was'",
          "Spelling words that begin with a silent 'k' before 'n'",
          "Spelling words that begin with a silent 'w' before 'r'",
          "Spelling words with a silent 'b' after 'm'",
          "Spelling words with a silent 't' (castle)",
          "Spelling words with a silent k",
          "Spotting correctly spelled common words",
          "Supply a silent letter inside a word",
          "Use the verb form passed in a past-tense sentence",
          "Using a double consonant after a short vowel (rabbit)",
        ],
      },
      {
        id: "phonological",
        label: "Phonological",
        examStyles: ["icas_style"],
        skills: [
          "Apply the ei-after-c pattern",
          "Choosing the correct short vowel in a one-syllable word",
          "Complete a cluster inside a multisyllabic word",
          "Recall the ie order in friend",
          "Recognise French-derived ch spellings",
          "Recognising correctly spelt two-syllable words",
          "Soft c (c sounding like s) in 'circle'",
          "Soft g (g sounding like j) in 'gentle'",
          "Spell a reduced middle syllable",
          "Spell a word using rh and y as a vowel",
          "Spell an unclear middle vowel correctly",
          "Spelling the 'ch' digraph at the end of a word",
          "Spelling the /air/ sound with the 'air' letter team",
          "Spelling the /ar/ sound with the 'ar' letter team",
          "Spelling the /aw/ sound with the 'aw' letter team",
          "Spelling the /ch/ sound with 'tch' after a short vowel",
          "Spelling the /er/ sound with the 'ir' letter team",
          "Spelling the /f/ sound with 'ph'",
          "Spelling the /or/ sound with the 'or' letter team",
          "Spelling the /ow/ sound with the 'ou' letter team",
          "Spelling the /oy/ sound with 'oy' at the end of a word",
          "Spelling the long 'a' sound with the 'ai' vowel team",
          "Spelling the long /a/ sound with the 'ai' letter team",
          "Spelling the long /a/ sound with the split digraph a-e",
          "Spelling the long /ee/ sound with the 'ee' letter team",
          "Spelling the long /i/ sound with the 'igh' letter team",
          "Spelling the long /oo/ sound with the 'oo' letter team",
          "Spelling the soft /j/ sound made by 'g' before 'i'",
          "Spelling the soft /s/ sound made by 'c' before 'i'",
          "Spelling the three-letter blend 'str' at the start of a word",
          "Spelling words that begin with the 'bl' blend",
          "Spelling words that begin with the 'sh' digraph",
          "Spelling words that begin with the 'th' digraph",
          "Use a related word to fix an unstressed vowel",
        ],
      },
      {
        id: "morphological",
        label: "Morphological",
        examStyles: ["icas_style"],
        skills: [
          "Add the prefix un- to form an opposite",
          "Adding '-ed' to 'smile' by dropping the silent 'e'",
          "Adding '-ing' to 'come' by dropping the silent 'e'",
          "Adding -ed to a base word with no spelling change",
          "Adding -ing to a base word with no spelling change",
          "Adding the -ful suffix",
          "Adding the -ly suffix",
          "Adding the prefix 'un-' to a base word (happy to unhappy)",
          "Adding the suffix '-less' to a base word",
          "Adding the suffix '-ly' to a base word (quick to quickly)",
          "Adding the suffix '-ness' to a base word",
          "Apply the Australian double-l rule before -ed",
          "Applying the -y to -ies plural rule",
          "Build meaning from the root vis and a suffix",
          "Change f to ves when forming a plural",
          "Change y to i and add -ful",
          "Change y to ies after a consonant",
          "Changing -y to -ies for plurals",
          "Choose -or for an agent noun that takes it",
          "Double the final consonant of a stressed syllable",
          "Doubling the final consonant before -ed",
          "Doubling the final consonant before -ing",
          "Doubling the final consonant before -ing (hopping)",
          "Doubling the final consonant before adding '-ed' (stop to stopped)",
          "Doubling the final consonant before adding '-er' (big to bigger)",
          "Doubling the final consonant before adding '-ing'",
          "Doubling the final consonant before adding -ed",
          "Doubling the final consonant before adding -ing",
          "Drop the final e of a le ending before -ly",
          "Drop the silent e before a vowel suffix",
          "Dropping the silent 'e' before adding -ed",
          "Dropping the silent 'e' before adding -ing",
          "Form a plural by changing the internal vowel",
          "Form an agent noun with the suffix -ist",
          "Join a prefix without altering the base word",
          "Keep both l letters when -ly follows a final l",
          "Keep the ible vowel when adding -ity",
          "Making a plural by adding -es after x, s, sh or ch",
          "Making a plural by adding -s",
          "Making a plural by changing y to -ies",
          "Making plurals by adding '-es' to words ending in 'o'",
          "Making plurals by adding '-es' to words ending in 'ss'",
          "Making plurals by adding '-es' to words ending in 'x'",
          "Making plurals by changing 'f' to 'ves' (leaf to leaves)",
          "Making plurals by changing 'y' to 'ies' (baby to babies)",
          "Recall an irregular plural form",
          "Recognising the suffix '-ful' is spelled with one 'l'",
          "Recover the is singular from an es plural",
          "Retain the e before -ous after a soft g",
          "Spell sci words ending in -ous",
          "Spelling the -tion suffix",
        ],
      },
      {
        id: "etymological",
        label: "Etymological",
        examStyles: ["icas_style"],
        skills: [
          "Combine two roots into a single word",
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

/**
 * The strands for a subject, narrowed to one exam style when given.
 *
 * Callers that pass no style get every strand the subject knows, which is
 * the union across styles — correct for "what could this subject ever be
 * about", wrong for "what may this NAPLAN question claim". Pass the style
 * whenever the answer is about a specific question or paper.
 */
export function getStrandsForSubject(
  subjectId: string,
  examStyle?: ExamStyle,
): readonly SubjectStrand[] {
  const strands = getSubject(subjectId)?.strands ?? [];
  if (!examStyle) return strands;
  return strands.filter(
    (strand) => strand.examStyles === undefined || strand.examStyles.includes(examStyle),
  );
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
export function isKnownStrandLabel(
  subjectId: string,
  strandLabel: string,
  examStyle?: ExamStyle,
): boolean {
  const wanted = strandLabel.trim().toLocaleLowerCase("en-AU");
  return getStrandsForSubject(subjectId, examStyle).some(
    (strand) => strand.label.trim().toLocaleLowerCase("en-AU") === wanted,
  );
}
