import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 3 ICAS-style English — 6 original questions with a reasoning
 * flavour (5 objective plus 1 writing task marked by manual review).
 */
export const grade3IcasEnglish = defineQuestions([
  {
    id: "g3-icas-eng-infer-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why do ants leave a scent trail when they find food?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "Ants at Work",
      body: "An ant nest is a busy place. Worker ants march out every day to search for food. When a worker finds a tasty crumb, it does something clever on the way home: it presses its body to the ground every few steps, leaving behind an invisible smell called a scent trail. Other ants from the nest touch the trail with their feelers and follow it, straight to the food. That is why you often see ants walking in a long, tidy line across a footpath.",
    },
    options: [
      { id: "mark-territory", text: "To warn other insects to stay away" },
      { id: "find-way-back", text: "So they do not get lost themselves" },
      { id: "guide-others", text: "So other ants can follow the trail to the food" },
      { id: "keep-clean", text: "To keep the footpath clean" },
    ],
    answerKey: { kind: "single_option", optionId: "guide-others" },
    explanation:
      "The text says other ants touch the trail with their feelers and follow it straight to the food. The trail's purpose is to guide the other ants.",
    metadata: {
      subject: "reading",
      strand: "Inference",
      topic: "Understanding purpose in an information text",
      skill: "Inferring purpose from an information text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["information-text", "inference"],
    },
  },
  {
    id: "g3-icas-eng-logic-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Kitten is to cat as puppy is to ___.",
    instructions:
      "Work out how the first two words go together, then choose the word that completes the pattern.",
    options: [
      { id: "dog", text: "dog" },
      { id: "bone", text: "bone" },
      { id: "kennel", text: "kennel" },
      { id: "bark", text: "bark" },
    ],
    answerKey: { kind: "single_option", optionId: "dog" },
    explanation:
      "A kitten is a baby cat, so the pattern is 'baby animal to grown animal'. A puppy is a baby dog, which makes 'dog' the word that completes the pattern.",
    metadata: {
      subject: "language_conventions",
      strand: "Logical language reasoning",
      topic: "Word analogies",
      skill: "Completing word analogies",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["analogy", "reasoning"],
    },
  },
  {
    id: "g3-icas-eng-vocab-001",
    type: "short_answer",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write one word that means the opposite of 'ancient'.",
    instructions: "Think about what 'ancient' means, then write an antonym.",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["modern", "new", "recent", "young"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "'Ancient' means very old, so opposites include 'modern', 'new', 'recent' and 'young'.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Antonyms",
      skill: "Producing antonyms",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["antonyms", "vocabulary"],
    },
  },
  {
    id: "g3-icas-eng-vocab-002",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each word to its meaning.",
    instructions: "Choose the meaning that best fits each word.",
    interaction: {
      type: "matching",
      sources: [
        { id: "word-gigantic", text: "gigantic" },
        { id: "word-fragile", text: "fragile" },
        { id: "word-drowsy", text: "drowsy" },
        { id: "word-ravenous", text: "ravenous" },
      ],
      targets: [
        { id: "meaning-large", text: "very large" },
        { id: "meaning-breakable", text: "easily broken" },
        { id: "meaning-sleepy", text: "sleepy" },
        { id: "meaning-hungry", text: "very hungry" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "word-gigantic", targetId: "meaning-large" },
        { sourceId: "word-fragile", targetId: "meaning-breakable" },
        { sourceId: "word-drowsy", targetId: "meaning-sleepy" },
        { sourceId: "word-ravenous", targetId: "meaning-hungry" },
      ],
    },
    explanation:
      "Gigantic means very large, fragile means easily broken, drowsy means sleepy, and ravenous means very hungry.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Word meanings",
      skill: "Matching words to definitions",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["vocabulary", "definitions"],
    },
  },
  {
    id: "g3-icas-eng-homophone-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write 'their' or 'there' to complete the sentence correctly.",
    instructions: "Choose the word that shows something belongs to the twins.",
    interaction: {
      type: "fill_blank",
      segments: ["The twins left ", " schoolbags near the door."],
      blanks: [{ id: "homophone", label: "The missing word" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [{ id: "homophone", acceptedAnswers: ["their"] }],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The schoolbags belong to the twins, so the possessive word 'their' is correct. 'There' tells where something is.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Homophones",
      skill: "Choosing the correct homophone",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["homophones", "spelling"],
    },
  },
  {
    id: "g3-icas-eng-writing-001",
    type: "essay",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write instructions that teach someone how to care for a pet.",
    instructions:
      "Write your instructions as clear steps in order. Aim for about 50 to 150 words. You can choose any pet you like.",
    answerKey: {
      kind: "manual",
      rubric:
        "Purpose (2 marks): the writing gives clear, sensible steps for caring for a pet, in a logical order. Language (1 mark): the writer uses command verbs (for example 'feed', 'brush') and words that show order (for example 'first', 'next'). Conventions (1 mark): most sentences use correct capital letters, punctuation and readable spelling.",
      minWords: 30,
      maxWords: 200,
    },
    explanation:
      "This writing task is marked by a person using the rubric. There is no single correct answer: markers look for ordered steps, command verbs, sequencing words and readable spelling and punctuation.",
    metadata: {
      subject: "writing",
      strand: "Procedural writing",
      topic: "Writing instructions",
      skill: "Composing a procedure",
      difficulty: "medium",
      marks: 4,
      estimatedTimeSeconds: 600,
      tags: ["procedure", "writing"],
    },
  },
]);
