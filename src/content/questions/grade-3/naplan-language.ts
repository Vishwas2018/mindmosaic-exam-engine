import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 3 NAPLAN-style Conventions of Language — 10 original questions
 * (9 language conventions plus 1 writing task marked by manual review).
 */
export const grade3NaplanLanguage = defineQuestions([
  {
    id: "g3-nap-lang-spelling-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "The word 'butifull' is spelt incorrectly. Write the correct spelling.",
    instructions: "Write the corrected word in the box.",
    interaction: {
      type: "fill_blank",
      segments: ["It was a ", " day at the beach."],
      blanks: [{ id: "corrected-word", label: "Correct spelling of 'butifull'" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "corrected-word", acceptedAnswers: ["beautiful"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The correct spelling is 'beautiful': b-e-a-u-t-i-f-u-l, with one l at the end.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Correcting misspelt words",
      skill: "Spelling common adjectives",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["spelling"],
    },
  },
  {
    id: "g3-nap-lang-contraction-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write the contraction for 'did not'.",
    instructions:
      "A contraction joins two words with an apostrophe, like 'cannot' becoming 'can't'.",
    interaction: {
      type: "fill_blank",
      segments: ["We ", " miss the bus this morning."],
      blanks: [{ id: "contraction", label: "Contraction of 'did not'" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "contraction", acceptedAnswers: ["didn't", "didn’t"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "'Did not' becomes 'didn't'. The apostrophe shows where the letter o has been left out.",
    metadata: {
      subject: "language_conventions",
      strand: "Punctuation",
      topic: "Contractions",
      skill: "Forming contractions with apostrophes",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["contractions", "apostrophes"],
    },
  },
  {
    id: "g3-nap-lang-tense-001",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correct word to complete the sentence.",
    instructions: "Pick one answer from the box.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "verb-tense",
          label: "Yesterday, Liam ___ his bike to school.",
          options: [
            { id: "rides", text: "rides" },
            { id: "rode", text: "rode" },
            { id: "riding", text: "riding" },
            { id: "ride", text: "ride" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [{ id: "verb-tense", correctOptionId: "rode" }],
    },
    explanation:
      "'Yesterday' tells us the sentence is about the past, so the past tense 'rode' is correct.",
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      topic: "Verb tense",
      skill: "Choosing the correct past tense",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["tense", "verbs"],
    },
  },
  {
    id: "g3-nap-lang-agreement-001",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correct verb for each sentence.",
    instructions: "Pick one answer in each box so the sentences sound right.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "dogs-verb",
          label: "The dogs ___ at the postie every morning.",
          options: [
            { id: "bark", text: "bark" },
            { id: "barks", text: "barks" },
          ],
        },
        {
          id: "sister-verb",
          label: "My sister ___ the piano after school.",
          options: [
            { id: "play", text: "play" },
            { id: "plays", text: "plays" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [
        { id: "dogs-verb", correctOptionId: "bark" },
        { id: "sister-verb", correctOptionId: "plays" },
      ],
    },
    explanation:
      "'Dogs' names more than one animal, so it takes 'bark'. 'My sister' names one person, so it takes 'plays'.",
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      topic: "Subject-verb agreement",
      skill: "Matching verbs to singular and plural subjects",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["agreement", "verbs"],
    },
  },
  {
    id: "g3-nap-lang-capitals-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence uses capital letters correctly?",
    instructions: "Choose one answer.",
    options: [
      { id: "no-capitals", text: "we went to sydney on monday." },
      { id: "correct", text: "We went to Sydney on Monday." },
      { id: "all-words", text: "We Went To Sydney On Monday." },
      { id: "mixed", text: "we went to Sydney on monday." },
    ],
    answerKey: { kind: "single_option", optionId: "correct" },
    explanation:
      "A sentence starts with a capital letter, and names of places and days, like Sydney and Monday, also need capitals. Only 'We went to Sydney on Monday.' follows all of these rules.",
    metadata: {
      subject: "language_conventions",
      strand: "Punctuation",
      topic: "Capital letters",
      skill: "Using capital letters for sentences and proper nouns",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["capitals"],
    },
  },
  {
    id: "g3-nap-lang-plural-001",
    type: "short_answer",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write the plural of the word 'child'.",
    instructions: "The plural names more than one.",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["children"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "'Child' has an irregular plural. More than one child are called 'children', not 'childs'.",
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      topic: "Irregular plurals",
      skill: "Forming irregular plural nouns",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["plurals"],
    },
  },
  {
    id: "g3-nap-lang-antonym-001",
    type: "matching",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each word to its antonym.",
    instructions: "An antonym is a word with the opposite meaning.",
    interaction: {
      type: "matching",
      sources: [
        { id: "word-big", text: "big" },
        { id: "word-happy", text: "happy" },
        { id: "word-fast", text: "fast" },
        { id: "word-heavy", text: "heavy" },
      ],
      targets: [
        { id: "ant-small", text: "small" },
        { id: "ant-sad", text: "sad" },
        { id: "ant-slow", text: "slow" },
        { id: "ant-light", text: "light" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "word-big", targetId: "ant-small" },
        { sourceId: "word-happy", targetId: "ant-sad" },
        { sourceId: "word-fast", targetId: "ant-slow" },
        { sourceId: "word-heavy", targetId: "ant-light" },
      ],
    },
    explanation:
      "Opposites: big and small, happy and sad, fast and slow, heavy and light.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Antonyms",
      skill: "Matching words to their antonyms",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["antonyms", "vocabulary"],
    },
  },
  {
    id: "g3-nap-lang-adverb-001",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "True or false? In the sentence 'The kangaroo hopped quickly across the road', the word 'quickly' is an adverb.",
    instructions: "Think about what job the word 'quickly' does in the sentence.",
    answerKey: { kind: "boolean", value: true },
    explanation:
      "'Quickly' tells us how the kangaroo hopped. Words that describe how an action happens are adverbs, so the statement is true.",
    metadata: {
      subject: "language_conventions",
      strand: "Parts of speech",
      topic: "Adverbs",
      skill: "Recognising adverbs",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["adverbs", "parts-of-speech"],
    },
  },
  {
    id: "g3-nap-lang-wordsort-001",
    type: "drag_drop",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sort the words into nouns and verbs.",
    instructions:
      "A noun names a person, place or thing. A verb is a doing word. Drag each word into the correct group.",
    interaction: {
      type: "drag_drop",
      items: [
        { id: "word-river", text: "river" },
        { id: "word-jump", text: "jump" },
        { id: "word-teacher", text: "teacher" },
        { id: "word-swim", text: "swim" },
      ],
      zones: [
        { id: "zone-nouns", label: "Nouns" },
        { id: "zone-verbs", label: "Verbs" },
      ],
    },
    answerKey: {
      kind: "drag_drop",
      placements: {
        "word-river": "zone-nouns",
        "word-teacher": "zone-nouns",
        "word-jump": "zone-verbs",
        "word-swim": "zone-verbs",
      },
    },
    explanation:
      "'River' names a place and 'teacher' names a person, so they are nouns. 'Jump' and 'swim' are doing words, so they are verbs.",
    metadata: {
      subject: "language_conventions",
      strand: "Parts of speech",
      topic: "Nouns and verbs",
      skill: "Sorting nouns and verbs",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["nouns", "verbs", "sorting"],
    },
  },
  {
    id: "g3-nap-lang-writing-001",
    type: "essay",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write a story about finding something surprising in your garden.",
    instructions:
      "Write a short story with a beginning, a middle and an end. Aim for about 50 to 150 words. Remember capital letters and full stops.",
    answerKey: {
      kind: "manual",
      rubric:
        "Ideas (2 marks): the story includes a surprising discovery and has a clear beginning, middle and end. Language (1 mark): the writer uses some interesting words and complete sentences. Conventions (1 mark): most sentences start with a capital letter and end with correct punctuation, and common words are spelt correctly.",
      minWords: 30,
      maxWords: 200,
    },
    explanation:
      "This writing task is marked by a person using the rubric. There is no single correct answer: markers look for a clear story shape, an interesting surprise, complete sentences and readable spelling and punctuation.",
    metadata: {
      subject: "writing",
      strand: "Narrative writing",
      topic: "Writing a short narrative",
      skill: "Composing a narrative",
      difficulty: "medium",
      marks: 4,
      estimatedTimeSeconds: 600,
      tags: ["narrative", "writing"],
    },
  },
]);
