import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 5 ICAS-style English — 7 original questions with a reasoning
 * flavour (6 objective plus 1 writing task marked by manual review).
 */
export const grade5IcasEnglish = defineQuestions([
  {
    id: "g5-icas-eng-infer-001",
    type: "reading_comprehension",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "According to the text, why might a bushwalker think they can hear a chainsaw deep in the forest?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Forest Mimic",
      body: "Deep in the damp gullies of eastern Australia lives one of the world's most surprising performers: the superb lyrebird. The male lyrebird builds a small mound of soil to stand on, then sings to attract a mate. What makes his song astonishing is that very little of it is his own. The lyrebird copies the calls of kookaburras, whipbirds and dozens of other species, stitching them together into one long performance. Birds that live near people add stranger sounds again. Reliable observers have described lyrebirds imitating camera shutters, car alarms and the whine of a chainsaw with uncanny accuracy. A bushwalker who hears machinery deep in the forest may in fact be listening to a single brown bird on a mound of soil.",
    },
    options: [
      { id: "real-chainsaw", text: "Timber workers often cut trees in the gullies" },
      { id: "lyrebird-mimic", text: "A lyrebird may be imitating the sound of a chainsaw" },
      { id: "echo", text: "Sounds from town echo strangely in the forest" },
      { id: "kookaburra", text: "Kookaburras make a call that sounds like machinery" },
    ],
    answerKey: { kind: "single_option", optionId: "lyrebird-mimic" },
    explanation:
      "The text says lyrebirds have been reliably observed imitating chainsaws with uncanny accuracy, and that a bushwalker hearing machinery may really be hearing a lyrebird.",
    metadata: {
      subject: "reading",
      strand: "Inference",
      topic: "Connecting ideas in an information text",
      skill: "Drawing conclusions from an information text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 150,
      tags: ["information-text", "inference"],
    },
  },
  {
    id: "g5-icas-eng-logic-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "'Scarce' is to 'plentiful' as which pair of words is to each other?",
    instructions:
      "Work out the relationship between the first pair, then choose the pair with the same relationship.",
    options: [
      { id: "difficult-easy", text: "difficult and easy" },
      { id: "large-huge", text: "large and huge" },
      { id: "damp-wet", text: "damp and wet" },
      { id: "quick-fast", text: "quick and fast" },
    ],
    answerKey: { kind: "single_option", optionId: "difficult-easy" },
    explanation:
      "'Scarce' and 'plentiful' are opposites. Of the pairs, only 'difficult' and 'easy' are opposites; the other pairs are words with similar meanings.",
    metadata: {
      subject: "language_conventions",
      strand: "Logical language reasoning",
      topic: "Word relationships",
      skill: "Reasoning about word relationships",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["analogy", "antonyms"],
    },
  },
  {
    id: "g5-icas-eng-vocab-001",
    type: "short_answer",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write one word that means the same as 'commence'.",
    instructions: "Think about what 'commence' means, then write a synonym.",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["begin", "start"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "'Commence' is a formal word meaning to begin or start something.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Synonyms",
      skill: "Producing synonyms for formal words",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["synonyms", "vocabulary"],
    },
  },
  {
    id: "g5-icas-eng-figurative-001",
    type: "matching",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each example to its type of figurative language.",
    instructions:
      "A simile compares using 'as' or 'like'. A metaphor says one thing is another. Personification gives human actions to non-human things. Alliteration repeats a starting sound.",
    interaction: {
      type: "matching",
      sources: [
        { id: "ex-bee", text: "Ari was as busy as a bee all morning." },
        { id: "ex-wind", text: "The wind whispered through the sheoaks." },
        { id: "ex-zoo", text: "By home time, the classroom was a zoo." },
        { id: "ex-snakes", text: "Six slippery snakes slid slowly south." },
      ],
      targets: [
        { id: "type-simile", text: "Simile" },
        { id: "type-personification", text: "Personification" },
        { id: "type-metaphor", text: "Metaphor" },
        { id: "type-alliteration", text: "Alliteration" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "ex-bee", targetId: "type-simile" },
        { sourceId: "ex-wind", targetId: "type-personification" },
        { sourceId: "ex-zoo", targetId: "type-metaphor" },
        { sourceId: "ex-snakes", targetId: "type-alliteration" },
      ],
    },
    explanation:
      "'As busy as a bee' compares with 'as', so it is a simile. The wind cannot really whisper, so that is personification. Calling the classroom a zoo says one thing is another, so it is a metaphor. The repeated s sound in 'six slippery snakes slid slowly south' is alliteration.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Figurative language",
      skill: "Classifying figurative language",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["figurative-language"],
    },
  },
  {
    id: "g5-icas-eng-cohesion-001",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Write a linking word that shows the second part of the sentence is a result of the first part.",
    instructions:
      "Choose a word like 'therefore', 'consequently' or 'so' and write it in the box.",
    interaction: {
      type: "fill_blank",
      segments: ["Ella practised her violin every single day; ", ", she won first prize at the eisteddfod."],
      blanks: [{ id: "connective", label: "Linking word showing a result" }],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "connective",
          acceptedAnswers: ["therefore", "consequently", "so", "as a result", "thus", "hence"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "Winning first prize is the result of daily practice, so a result connective such as 'therefore', 'consequently', 'so', 'thus' or 'hence' fits the gap.",
    metadata: {
      subject: "language_conventions",
      strand: "Text structure",
      topic: "Connectives",
      skill: "Using cause-and-effect connectives",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["connectives", "cohesion"],
    },
  },
  {
    id: "g5-icas-eng-synonym-001",
    type: "drag_drop",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sort the words into the group they belong to.",
    instructions:
      "Two words mean much the same as 'happy' and two mean much the same as 'sad'. Drag each word into the correct group.",
    interaction: {
      type: "drag_drop",
      items: [
        { id: "word-delighted", text: "delighted" },
        { id: "word-gloomy", text: "gloomy" },
        { id: "word-cheerful", text: "cheerful" },
        { id: "word-miserable", text: "miserable" },
      ],
      zones: [
        { id: "zone-happy", label: "Words like 'happy'" },
        { id: "zone-sad", label: "Words like 'sad'" },
      ],
    },
    answerKey: {
      kind: "drag_drop",
      placements: {
        "word-delighted": "zone-happy",
        "word-cheerful": "zone-happy",
        "word-gloomy": "zone-sad",
        "word-miserable": "zone-sad",
      },
    },
    explanation:
      "'Delighted' and 'cheerful' describe happy feelings, while 'gloomy' and 'miserable' describe sad ones.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Synonym groups",
      skill: "Grouping words by meaning",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["synonyms", "sorting"],
    },
  },
  {
    id: "g5-icas-eng-writing-001",
    type: "essay",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write an information report about a place in Australia you know well.",
    instructions:
      "Give your report a title, an opening sentence that introduces the place, and organised facts about what it is like and what happens there. Aim for about 100 to 250 words. Do not write a story.",
    answerKey: {
      kind: "manual",
      rubric:
        "Purpose (2 marks): the writing is a factual report that introduces a place and organises information about it, rather than telling a story. Detail (1 mark): the report includes specific, believable details about the place. Structure (1 mark): information is grouped logically, with an opening statement and a rounded ending. Conventions (1 mark): sentences are mostly correct with accurate punctuation and readable spelling.",
      minWords: 50,
      maxWords: 350,
    },
    explanation:
      "This writing task is marked by a person using the rubric. There is no single correct answer: markers look for a factual report structure, organised information, specific detail and accurate conventions.",
    metadata: {
      subject: "writing",
      strand: "Informative writing",
      topic: "Writing an information report",
      skill: "Composing an information report",
      difficulty: "challenging",
      marks: 5,
      estimatedTimeSeconds: 900,
      tags: ["report", "writing"],
    },
  },
]);
