import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 5 NAPLAN-style Conventions of Language — 11 original questions
 * (10 language conventions plus 1 writing task marked by manual review).
 */
export const grade5NaplanLanguage = defineQuestions([
  {
    id: "g5-nap-lang-apostrophe-001",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "One dog owns the bone. Write the missing word with its apostrophe in the correct place.",
    instructions: "Write the owner word, for example: the cat's basket.",
    interaction: {
      type: "fill_blank",
      segments: ["The ", " bone lies buried near the fence."],
      blanks: [{ id: "possessive", label: "Owner word for one dog" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "possessive", acceptedAnswers: ["dog's", "dog’s"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "When one dog owns something, the apostrophe goes before the s: dog's. Writing dogs' would mean the bone belongs to more than one dog.",
    metadata: {
      subject: "language_conventions",
      strand: "Punctuation",
      topic: "Possessive apostrophes",
      skill: "Using apostrophes for singular possession",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["apostrophes"],
    },
  },
  {
    id: "g5-nap-lang-spelling-001",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "The word 'seperate' is spelt incorrectly. Write the correct spelling.",
    instructions: "Write the corrected word in the box.",
    interaction: {
      type: "fill_blank",
      segments: ["Please put the glass bottles in a ", " recycling bin."],
      blanks: [{ id: "corrected-word", label: "Correct spelling of 'seperate'" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "corrected-word", acceptedAnswers: ["separate"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The correct spelling is 'separate'. A helpful memory trick: there is 'a rat' in the middle of sep-a-rat-e.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Correcting misspelt words",
      skill: "Spelling commonly confused words",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["spelling"],
    },
  },
  {
    id: "g5-nap-lang-tense-001",
    type: "dropdown",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correct verb for each sentence.",
    instructions: "Pick one answer in each box.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "past-tense",
          label: "She ___ her homework before dinner yesterday.",
          options: [
            { id: "did", text: "did" },
            { id: "done", text: "done" },
            { id: "do", text: "do" },
          ],
        },
        {
          id: "agreement",
          label: "Neither of the boys ___ remembered a raincoat.",
          options: [
            { id: "has", text: "has" },
            { id: "have", text: "have" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [
        { id: "past-tense", correctOptionId: "did" },
        { id: "agreement", correctOptionId: "has" },
      ],
    },
    explanation:
      "'Did' is the correct past tense on its own; 'done' needs a helper such as 'has'. 'Neither' refers to each boy one at a time, so it takes the singular verb 'has'.",
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      topic: "Verb forms and agreement",
      skill: "Choosing correct verb forms",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["tense", "agreement"],
    },
  },
  {
    id: "g5-nap-lang-adverb-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Which word in this sentence is an adverb? 'The choir sang sweetly at the assembly.'",
    instructions: "Choose one answer.",
    options: [
      { id: "choir", text: "choir" },
      { id: "sang", text: "sang" },
      { id: "sweetly", text: "sweetly" },
      { id: "assembly", text: "assembly" },
    ],
    answerKey: { kind: "single_option", optionId: "sweetly" },
    explanation:
      "'Sweetly' describes how the choir sang, and words that describe how an action happens are adverbs. 'Choir' and 'assembly' are nouns, and 'sang' is a verb.",
    metadata: {
      subject: "language_conventions",
      strand: "Parts of speech",
      topic: "Adverbs",
      skill: "Identifying adverbs in sentences",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["adverbs", "parts-of-speech"],
    },
  },
  {
    id: "g5-nap-lang-synonym-001",
    type: "short_answer",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write one word that means the same as 'rapid'.",
    instructions: "Think about what 'rapid' means, then write a synonym.",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["fast", "quick", "speedy", "swift"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "'Rapid' means moving or happening with great speed, so synonyms include 'fast', 'quick', 'speedy' and 'swift'.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Synonyms",
      skill: "Producing synonyms",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["synonyms", "vocabulary"],
    },
  },
  {
    id: "g5-nap-lang-sentence-001",
    type: "matching",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each sentence to its type.",
    instructions:
      "A statement tells, a question asks, a command instructs and an exclamation shows strong feeling.",
    interaction: {
      type: "matching",
      sources: [
        { id: "sent-library", text: "Where is the library?" },
        { id: "sent-gate", text: "Shut the gate." },
        { id: "sent-tide", text: "The tide is coming in." },
        { id: "sent-goal", text: "What a fantastic goal!" },
      ],
      targets: [
        { id: "type-question", text: "Question" },
        { id: "type-command", text: "Command" },
        { id: "type-statement", text: "Statement" },
        { id: "type-exclamation", text: "Exclamation" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "sent-library", targetId: "type-question" },
        { sourceId: "sent-gate", targetId: "type-command" },
        { sourceId: "sent-tide", targetId: "type-statement" },
        { sourceId: "sent-goal", targetId: "type-exclamation" },
      ],
    },
    explanation:
      "'Where is the library?' asks, so it is a question. 'Shut the gate.' instructs, so it is a command. 'The tide is coming in.' tells, so it is a statement. 'What a fantastic goal!' shows strong feeling, so it is an exclamation.",
    metadata: {
      subject: "language_conventions",
      strand: "Grammar",
      topic: "Sentence types",
      skill: "Classifying sentence types",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["sentences"],
    },
  },
  {
    id: "g5-nap-lang-adjective-001",
    type: "true_false",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "True or false? In the sentence 'The stars shone brightly above the campsite', the word 'brightly' is an adjective.",
    instructions: "Think about what job the word 'brightly' does in the sentence.",
    answerKey: { kind: "boolean", value: false },
    explanation:
      "'Brightly' describes how the stars shone, which makes it an adverb, not an adjective. Adjectives describe nouns, like 'bright stars'.",
    metadata: {
      subject: "language_conventions",
      strand: "Parts of speech",
      topic: "Adverbs and adjectives",
      skill: "Distinguishing adverbs from adjectives",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["adverbs", "adjectives"],
    },
  },
  {
    id: "g5-nap-lang-nouns-001",
    type: "drag_drop",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sort the words into common nouns and proper nouns.",
    instructions:
      "A proper noun names a particular person or place and starts with a capital letter. Drag each word into the correct group.",
    interaction: {
      type: "drag_drop",
      items: [
        { id: "word-city", text: "city" },
        { id: "word-brisbane", text: "Brisbane" },
        { id: "word-teacher", text: "teacher" },
        { id: "word-ms-chen", text: "Ms Chen" },
      ],
      zones: [
        { id: "zone-common", label: "Common nouns" },
        { id: "zone-proper", label: "Proper nouns" },
      ],
    },
    answerKey: {
      kind: "drag_drop",
      placements: {
        "word-city": "zone-common",
        "word-teacher": "zone-common",
        "word-brisbane": "zone-proper",
        "word-ms-chen": "zone-proper",
      },
    },
    explanation:
      "'City' and 'teacher' name general things, so they are common nouns. 'Brisbane' and 'Ms Chen' name a particular place and person, so they are proper nouns.",
    metadata: {
      subject: "language_conventions",
      strand: "Parts of speech",
      topic: "Common and proper nouns",
      skill: "Sorting common and proper nouns",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["nouns", "sorting"],
    },
  },
  {
    id: "g5-nap-lang-cohesion-001",
    type: "ordering",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Arrange the sentences so the paragraph makes sense.",
    instructions:
      "Use the linking words to help you decide the order. Put the opening sentence first.",
    interaction: {
      type: "ordering",
      items: [
        { id: "sent-beach", text: "On Saturday we went to the beach to build a sandcastle." },
        { id: "sent-damp", text: "First we dampened the sand with buckets of sea water." },
        { id: "sent-towers", text: "Then we shaped the towers with our moulds." },
        { id: "sent-castle", text: "By lunchtime our castle had six proud towers and a moat." },
      ],
    },
    answerKey: {
      kind: "ordering",
      optionIds: ["sent-beach", "sent-damp", "sent-towers", "sent-castle"],
    },
    explanation:
      "The opening sentence sets the scene at the beach. 'First' begins the steps, 'then' continues them, and 'by lunchtime' wraps up the result, so the order is beach, dampen, towers, castle.",
    metadata: {
      subject: "language_conventions",
      strand: "Text structure",
      topic: "Paragraph cohesion",
      skill: "Ordering sentences for cohesion",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["cohesion", "ordering"],
    },
  },
  {
    id: "g5-nap-lang-letter-001",
    type: "label_diagram",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label the parts of the letter layout.",
    instructions:
      "Match each part name to the correct position in the letter, from top to bottom.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-greeting", text: "Greeting" },
        { id: "label-body", text: "Body" },
        { id: "label-closing", text: "Closing" },
        { id: "label-signature", text: "Signature" },
      ],
      targets: [
        { id: "target-part-1", label: "Part 1, at the top" },
        { id: "target-part-2", label: "Part 2, the large middle section" },
        { id: "target-part-3", label: "Part 3, below the middle section" },
        { id: "target-part-4", label: "Part 4, at the bottom" },
      ],
    },
    visuals: [
      {
        id: "g5-letter-layout-svg",
        type: "labelled_svg",
        title: "Layout of a letter",
        altText:
          "A diagram of a letter with four numbered parts from top to bottom: part 1 is a single short line at the top starting with the word Dear, part 2 is a large block of text lines, part 3 is a short line reading Yours sincerely, and part 4 is a name line at the bottom.",
        data: {
          width: 320,
          height: 300,
          elements: [
            {
              id: "letter-outline",
              kind: "rectangle",
              x: 20,
              y: 15,
              width: 280,
              height: 270,
              fill: "#FDFBF7",
              stroke: "#4B2E83",
            },
            { id: "part1-line", kind: "line", x1: 40, y1: 55, x2: 180, y2: 55, stroke: "#4B2E83" },
            { id: "part2-line-1", kind: "line", x1: 40, y1: 100, x2: 280, y2: 100, stroke: "#8A7BAE" },
            { id: "part2-line-2", kind: "line", x1: 40, y1: 125, x2: 280, y2: 125, stroke: "#8A7BAE" },
            { id: "part2-line-3", kind: "line", x1: 40, y1: 150, x2: 280, y2: 150, stroke: "#8A7BAE" },
            { id: "part2-line-4", kind: "line", x1: 40, y1: 175, x2: 220, y2: 175, stroke: "#8A7BAE" },
            { id: "part3-line", kind: "line", x1: 40, y1: 220, x2: 170, y2: 220, stroke: "#1E7A46" },
            { id: "part4-line", kind: "line", x1: 40, y1: 260, x2: 140, y2: 260, stroke: "#B25E00" },
            { id: "part1-text", kind: "text", x: 42, y: 45, text: "1. Dear ...", colour: "#4B2E83" },
            { id: "part2-text", kind: "text", x: 42, y: 90, text: "2.", colour: "#4B2E83" },
            { id: "part3-text", kind: "text", x: 42, y: 210, text: "3. Yours sincerely,", colour: "#1E7A46" },
            { id: "part4-text", kind: "text", x: 42, y: 250, text: "4. (name)", colour: "#B25E00" },
          ],
          labels: [],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-greeting", targetId: "target-part-1" },
        { sourceId: "label-body", targetId: "target-part-2" },
        { sourceId: "label-closing", targetId: "target-part-3" },
        { sourceId: "label-signature", targetId: "target-part-4" },
      ],
    },
    explanation:
      "A letter starts with a greeting such as 'Dear ...', followed by the body with the main message, then a closing such as 'Yours sincerely,' and finally the writer's signature.",
    metadata: {
      subject: "language_conventions",
      strand: "Text structure",
      topic: "Parts of a letter",
      skill: "Identifying letter structure",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["letters", "labelling"],
    },
  },
  {
    id: "g5-nap-lang-writing-001",
    type: "essay",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Should students have homework every night? Write to persuade your reader.",
    instructions:
      "State your opinion clearly, give at least two reasons with examples, and finish with a strong conclusion. Aim for about 100 to 250 words.",
    answerKey: {
      kind: "manual",
      rubric:
        "Position (1 mark): the writer states a clear opinion and stays with it. Arguments (2 marks): at least two reasons are given and supported with examples or explanations. Structure (1 mark): the writing has an introduction, organised paragraphs and a conclusion. Conventions (1 mark): sentences are mostly correct with accurate punctuation and readable spelling.",
      minWords: 50,
      maxWords: 350,
    },
    explanation:
      "This writing task is marked by a person using the rubric. There is no single correct answer: markers look for a clear position, supported arguments, persuasive structure and accurate conventions.",
    metadata: {
      subject: "writing",
      strand: "Persuasive writing",
      topic: "Writing a persuasive text",
      skill: "Composing a persuasive argument",
      difficulty: "challenging",
      marks: 5,
      estimatedTimeSeconds: 900,
      tags: ["persuasive", "writing"],
    },
  },
]);
