import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

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
      { id: "all-words", text: "We Went To Sydney On Monday." },
      { id: "mixed", text: "we went to Sydney on monday." },
      { id: "correct", text: "We went to Sydney on Monday." },
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

  ...([
  {
    "id": "naplan-y3-language-da-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence has the correct capital letter and full stop?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-1",
        "text": "the frog jumped into the pond."
      },
      {
        "id": "opt-3",
        "text": "The frog jumped into the pond"
      },
      {
        "id": "opt-4",
        "text": "The Frog jumped into the Pond."
      },
      {
        "id": "opt-2",
        "text": "The frog jumped into the pond."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-2"
    },
    "explanation": "A sentence begins with a capital letter and ends with a full stop, and ordinary words in the middle like 'frog' and 'pond' stay lower case because they are not names. Option one has no capital at the start, option three is missing its full stop, and option four wrongly puts capitals on 'Frog' and 'Pond'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters and full stops",
      "skill": "Using capital letters and full stops correctly",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "capital letters",
        "full stops",
        "sentence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-002",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the punctuation mark that correctly ends this sentence: \"Have you seen my blue raincoat ___\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "raincoat ___",
          "options": [
            {
              "id": "full-stop",
              "text": "a full stop ( . )"
            },
            {
              "id": "question-mark",
              "text": "a question mark ( ? )"
            },
            {
              "id": "comma",
              "text": "a comma ( , )"
            },
            {
              "id": "exclamation",
              "text": "an exclamation mark ( ! )"
            }
          ]
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "correctOptionId": "question-mark"
        }
      ]
    },
    "explanation": "The sentence asks something — it begins with 'Have you' — so it needs a question mark at the end. A full stop belongs on a telling sentence, and an exclamation mark shows strong feeling, not a question.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Question marks",
      "skill": "Ending a question with a question mark",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "question mark",
        "punctuation",
        "sentence type"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses commas correctly to separate the things in the list?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-3",
        "text": "At the market we bought pears, figs and plums."
      },
      {
        "id": "opt-1",
        "text": "At the market we bought pears figs and plums."
      },
      {
        "id": "opt-2",
        "text": "At the market we bought pears, figs and plums, quickly."
      },
      {
        "id": "opt-4",
        "text": "At the market, we bought, pears, figs and plums."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-3"
    },
    "explanation": "In a list of three or more things we put a comma between the items and join the last two with 'and': pears, figs and plums. Option one has no commas at all, option two adds a stray comma before 'quickly', and option four puts commas after 'market' and 'bought' where none are needed.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Commas in lists",
      "skill": "Using commas to separate items in a list",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "comma",
        "lists",
        "punctuation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which is the correct way to write \"she is\" as one shortened word?",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-2",
        "text": "shes"
      },
      {
        "id": "opt-1",
        "text": "she's"
      },
      {
        "id": "opt-3",
        "text": "shes'"
      },
      {
        "id": "opt-4",
        "text": "she'is"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-1"
    },
    "explanation": "A contraction joins two words and uses an apostrophe to show where letters are missing. 'She is' drops the letter i and becomes she's, with the apostrophe standing in for the missing i. 'Shes' has no apostrophe, and the other two put the apostrophe in the wrong place.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes in contractions",
      "skill": "Forming contractions with an apostrophe",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "apostrophe",
        "contraction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The nest belongs to one bird. Which sentence shows this correctly using an apostrophe?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-1",
        "text": "The birds nest is high in the tree."
      },
      {
        "id": "opt-2",
        "text": "The birds' nest is high in the tree."
      },
      {
        "id": "opt-4",
        "text": "The bird's nest is high in the tree."
      },
      {
        "id": "opt-3",
        "text": "The bird nest's is high in the tree."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-4"
    },
    "explanation": "To show something belongs to one bird, we add an apostrophe and then s to the owner: the bird's nest. Option one has no apostrophe, option two ('birds'') means the nest belongs to more than one bird, and option three puts the apostrophe on 'nest' instead of the owner.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes for possession",
      "skill": "Using an apostrophe to show singular possession",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "apostrophe",
        "possession"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses speech marks correctly?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-1",
        "text": "\"Can I have a turn? asked Leo.\""
      },
      {
        "id": "opt-3",
        "text": "Can I have a turn? \"asked Leo.\""
      },
      {
        "id": "opt-4",
        "text": "Can I have a turn asked Leo."
      },
      {
        "id": "opt-2",
        "text": "\"Can I have a turn?\" asked Leo."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-2"
    },
    "explanation": "Speech marks go around only the words that are actually spoken out loud. Leo says 'Can I have a turn?', so the speech marks wrap those words and the question mark, while 'asked Leo' stays outside them. The other choices either wrap the wrong words or leave the speech marks out.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Speech marks",
      "skill": "Punctuating spoken words with speech marks",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "speech marks",
        "dialogue",
        "punctuation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-007",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that correctly completes the sentence: \"The children hung ___ coats on the hooks.\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "hung ___ coats",
          "options": [
            {
              "id": "there",
              "text": "there"
            },
            {
              "id": "their",
              "text": "their"
            },
            {
              "id": "theyre",
              "text": "they're"
            },
            {
              "id": "thair",
              "text": "thair"
            }
          ]
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "correctOptionId": "their"
        }
      ]
    },
    "explanation": "'Their' shows that the coats belong to the children. 'There' points to a place, 'they're' is short for 'they are' (which would make no sense here), and 'thair' is not a real word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling and vocabulary",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (there / their / they're)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "homophone",
        "their",
        "spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-008",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Write the correct plural to complete the sentence.",
    "instructions": "Type one word in the box.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "In autumn the ",
        " fall from the trees."
      ],
      "blanks": [
        {
          "id": "blank-1",
          "label": "plural of 'leaf'"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "blank-1",
          "acceptedAnswers": [
            "leaves"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "Some words that end in 'f' change the f to v and add 'es' to make the plural. One leaf becomes many leaves — not 'leafs' — so in autumn the leaves fall from the trees.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling and vocabulary",
      "topic": "Plurals",
      "skill": "Spelling irregular plurals ending in -f",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plural",
        "spelling",
        "leaf"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-009",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "This sentence is about something that happened yesterday: \"Yesterday we walk to the beach.\" Decide whether the sentence uses the correct past-tense verb. Is it correct?",
    "instructions": "Choose True or False.",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Because the sentence is about yesterday, the verb must be in the past tense: 'we walked'. The sentence uses 'walk', which is the present tense, so it is not correct.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Verb tense",
      "skill": "Matching verb tense to a past-time signal",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "verb tense",
        "past tense",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses the correct verb to match its subject?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-1",
        "text": "The two puppies chase the ball."
      },
      {
        "id": "opt-2",
        "text": "The two puppies chases the ball."
      },
      {
        "id": "opt-3",
        "text": "The two puppies is chasing the ball."
      },
      {
        "id": "opt-4",
        "text": "The two puppies was chasing the ball."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-1"
    },
    "explanation": "The subject 'two puppies' is plural, so it needs the plural verb 'chase' (not 'chases', which goes with one puppy). 'Is' and 'was' are also singular; with two puppies we would need 'are' or 'were'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Subject-verb agreement",
      "skill": "Matching a plural subject to its verb",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "subject-verb agreement",
        "plural",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-011",
    "type": "short_answer",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add the prefix 'un' to the word 'kind' to make a word that means 'not kind'. Write the new word.",
    "instructions": "Write one word.",
    "visuals": [],
    "answerKey": {
      "kind": "text",
      "acceptableAnswers": [
        "unkind"
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "The prefix 'un' means 'not', so joining it to the front of 'kind' makes 'unkind', which means not kind. A prefix attaches straight onto the start of the word with no space and no change to the spelling of 'kind'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling and vocabulary",
      "topic": "Prefixes",
      "skill": "Building a word with the prefix un-",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "prefix",
        "un",
        "word building"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word in this sentence is an adverb (a word that tells how something is done)? \"The tired runner slowly climbed the steep hill.\"",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-1",
        "text": "tired"
      },
      {
        "id": "opt-3",
        "text": "slowly"
      },
      {
        "id": "opt-2",
        "text": "steep"
      },
      {
        "id": "opt-4",
        "text": "hill"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-3"
    },
    "explanation": "An adverb tells how, when or where something happens. 'Slowly' tells how the runner climbed, so it is the adverb. 'Tired' and 'steep' are adjectives describing the runner and the hill, and 'hill' is a naming word (noun).",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Adjectives and adverbs",
      "skill": "Identifying an adverb of manner in a sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "adverb",
        "adjective",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-013",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each joining word (conjunction) to the job it does in a sentence.",
    "instructions": "Match each word on the left to the correct job on the right. One job on the right is not used.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "s-because",
          "text": "because"
        },
        {
          "id": "s-but",
          "text": "but"
        },
        {
          "id": "s-or",
          "text": "or"
        }
      ],
      "targets": [
        {
          "id": "t-reason",
          "text": "gives a reason"
        },
        {
          "id": "t-contrast",
          "text": "shows a difference or contrast"
        },
        {
          "id": "t-choice",
          "text": "gives a choice between things"
        },
        {
          "id": "t-sametime",
          "text": "shows two things happen at the same time"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "s-because",
          "targetId": "t-reason"
        },
        {
          "sourceId": "s-but",
          "targetId": "t-contrast"
        },
        {
          "sourceId": "s-or",
          "targetId": "t-choice"
        }
      ]
    },
    "explanation": "Each conjunction has its own job. 'Because' gives a reason (I stayed inside because it rained). 'But' shows a contrast (I was tired but happy). 'Or' offers a choice (tea or juice). The leftover job — two things happening at the same time — belongs to a word like 'while', which was not listed.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Conjunctions",
      "skill": "Matching conjunctions to their function",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "conjunction",
        "joining words",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word correctly adds the suffix 'ing' to the word 'run'?",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-1",
        "text": "runing"
      },
      {
        "id": "opt-2",
        "text": "runnying"
      },
      {
        "id": "opt-4",
        "text": "running"
      },
      {
        "id": "opt-3",
        "text": "runeing"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-4"
    },
    "explanation": "When a short word ends in a single vowel then a single consonant, like 'run', we double the last consonant before adding 'ing', so run becomes running. 'Runing' forgets to double the n, and the other spellings add letters that do not belong.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling and vocabulary",
      "topic": "Suffixes",
      "skill": "Doubling the final consonant before adding -ing",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "suffix",
        "ing",
        "spelling rule"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-015",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read the sentence. Choose the TWO words that are spelled incorrectly. \"My freind gave me a peice of cake at the party.\"",
    "instructions": "Choose two words.",
    "options": [
      {
        "id": "opt-party",
        "text": "party"
      },
      {
        "id": "opt-freind",
        "text": "freind"
      },
      {
        "id": "opt-gave",
        "text": "gave"
      },
      {
        "id": "opt-peice",
        "text": "peice"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "opt-freind",
        "opt-peice"
      ]
    },
    "explanation": "'Freind' should be spelled 'friend' and 'peice' should be spelled 'piece'. Both follow the pattern 'i before e' here, which these spellings get the wrong way round. 'Gave' and 'party' are both spelled correctly.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling and vocabulary",
      "topic": "Spelling in context",
      "skill": "Spotting misspelled words in a sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "spelling",
        "ie words",
        "proofreading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-da-016",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these word cards in order to make a correct question. The card with the capital letter starts the question and the card with the question mark ends it.",
    "instructions": "Drag the cards into the correct order.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "w-where",
          "text": "Where"
        },
        {
          "id": "w-did",
          "text": "did"
        },
        {
          "id": "w-you",
          "text": "you"
        },
        {
          "id": "w-hide",
          "text": "hide"
        },
        {
          "id": "w-key",
          "text": "the key?"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "w-where",
        "w-did",
        "w-you",
        "w-hide",
        "w-key"
      ]
    },
    "explanation": "A question like this follows the order question-word, helping verb, subject, action: 'Where did you hide the key?'. 'Where' carries the capital letter so it must start the sentence, and 'the key?' carries the question mark so it must end it.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Sentence completeness",
      "skill": "Ordering words to build a complete question",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "word order",
        "question",
        "sentence structure"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which word correctly completes the sentence?\n\nWe went inside ___ it started to rain.",
    "options": [
      {
        "id": "becuase",
        "text": "becuase"
      },
      {
        "id": "becouse",
        "text": "becouse"
      },
      {
        "id": "because",
        "text": "because"
      },
      {
        "id": "becaus",
        "text": "becaus"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "because"
    },
    "explanation": "The word is 'because'. It is built from be + cause, so keep both parts whole: be-cause. 'Becuase' swaps the a and u, 'becouse' changes the a to o, and 'becaus' drops the final e.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Common tricky words",
      "skill": "Choosing the correctly spelled word (because)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "tricky words",
        "because"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which one is written correctly?",
    "options": [
      {
        "id": "a-umbrella",
        "text": "a umbrella"
      },
      {
        "id": "an-dog",
        "text": "an dog"
      },
      {
        "id": "a-orange",
        "text": "a orange"
      },
      {
        "id": "an-umbrella",
        "text": "an umbrella"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "an-umbrella"
    },
    "explanation": "Use 'an' before a word that starts with a vowel sound and 'a' before a consonant sound. 'Umbrella' and 'orange' start with vowel sounds, so they need 'an'; 'dog' starts with a consonant sound, so it needs 'a'. Only 'an umbrella' follows the rule.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Articles",
      "skill": "Using 'a' and 'an' before nouns",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "articles",
        "a and an"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-003",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nMy sister wanted to come to the park ___.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "to",
              "text": "to"
            },
            {
              "id": "two",
              "text": "two"
            },
            {
              "id": "tow",
              "text": "tow"
            },
            {
              "id": "too",
              "text": "too"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "too"
        }
      ]
    },
    "explanation": "'Too' means 'also' or 'as well'. 'To' shows direction or goes with a verb, 'two' is the number 2, and 'tow' means to pull something along. The sister also wanted to come, so 'too' is correct.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (to / too / two)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "homophones",
        "to too two"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-004",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Write the plural (more than one) of the word 'baby' to complete the sentence.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "The zoo had three ",
        " born this year."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "plural of baby"
        }
      ]
    },
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "babies"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "When a word ends in a consonant followed by y, change the y to i and add es: baby becomes babies. Writing 'babys' is a common mistake because you must not just add s.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Plurals",
      "skill": "Spelling plurals: changing y to ies",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "plurals",
        "y to ies"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-005",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence. Is the capitalised word correct?\n\nThe children WERE playing in the sandpit.",
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "'Children' is plural (more than one), so it takes 'were', not 'was'. We say 'the children were', just as we say 'they were'. The sentence is correct, so the answer is true.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Verb agreement",
      "skill": "Subject-verb agreement (was / were)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "agreement",
        "was were"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nA giraffe is ___ than a horse.",
    "options": [
      {
        "id": "taller",
        "text": "taller"
      },
      {
        "id": "tall",
        "text": "tall"
      },
      {
        "id": "tallest",
        "text": "tallest"
      },
      {
        "id": "more-tall",
        "text": "more tall"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "taller"
    },
    "explanation": "To compare two things, add -er to a short adjective: tall becomes taller. 'Tallest' is used for three or more, and 'more tall' is wrong because a short word like 'tall' just takes -er, not 'more'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Adjectives",
      "skill": "Comparative adjectives (-er)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "adjectives",
        "comparative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-007",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Match each word to the type of word it is.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "swim",
          "text": "swim"
        },
        {
          "id": "cold",
          "text": "cold"
        },
        {
          "id": "school",
          "text": "school"
        }
      ],
      "targets": [
        {
          "id": "verb",
          "text": "a doing word (verb)"
        },
        {
          "id": "adjective",
          "text": "a describing word (adjective)"
        },
        {
          "id": "noun",
          "text": "a naming word (noun)"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "swim",
          "targetId": "verb"
        },
        {
          "sourceId": "cold",
          "targetId": "adjective"
        },
        {
          "sourceId": "school",
          "targetId": "noun"
        }
      ]
    },
    "explanation": "A noun names a person, place or thing (school). A verb is a doing or action word (swim). An adjective describes something (cold). Match each word to the job it does.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Parts of speech",
      "skill": "Identifying nouns, verbs and adjectives",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "grammar",
        "parts of speech",
        "noun verb adjective"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-008",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Put the word cards in order to make a correct sentence. The card that starts with a capital letter goes first and the full stop goes last.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "c1",
          "text": "barked"
        },
        {
          "id": "c2",
          "text": "The"
        },
        {
          "id": "c3",
          "text": "loudly."
        },
        {
          "id": "c4",
          "text": "dog"
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "c2",
        "c4",
        "c1",
        "c3"
      ]
    },
    "explanation": "A statement begins with a capital letter and ends with a full stop. 'The' has the capital, so it goes first, then the naming word 'dog', then the action 'barked', then 'loudly.' with the full stop: The dog barked loudly.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Sentence structure",
      "skill": "Ordering words to build a statement",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "grammar",
        "sentence order",
        "statement"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-009",
    "type": "short_answer",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Write the past tense of the verb 'run' to complete the sentence. Write ONE word.\n\nYesterday, Sam ___ all the way home.",
    "answerKey": {
      "kind": "text",
      "acceptableAnswers": [
        "ran"
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "'Run' is an irregular verb, so it does not add -ed. Its past tense is 'ran': Yesterday, Sam ran all the way home. Writing 'runned' is a common error.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Verb tense",
      "skill": "Irregular past tense verbs (run - ran)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "verb tense",
        "irregular verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which word in the sentence should begin with a capital letter?\n\nWe are going camping in july.",
    "options": [
      {
        "id": "are",
        "text": "are"
      },
      {
        "id": "july",
        "text": "july"
      },
      {
        "id": "going",
        "text": "going"
      },
      {
        "id": "camping",
        "text": "camping"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "july"
    },
    "explanation": "Months of the year are proper nouns and always start with a capital letter, so 'july' should be 'July'. 'Are', 'going' and 'camping' are ordinary words that do not need a capital here.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters",
      "skill": "Capital letters for months of the year",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "capitals",
        "months"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-011",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nMy two cousins ___ a new puppy.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "has",
              "text": "has"
            },
            {
              "id": "have",
              "text": "have"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "have"
        }
      ]
    },
    "explanation": "'Cousins' is plural (there are two of them), so it needs 'have', like 'they have'. We use 'has' only with a single person or thing, such as 'my cousin has'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Verb agreement",
      "skill": "Choosing has or have to match the subject",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "agreement",
        "has have"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which is the correct short form (contraction) of 'did not'?",
    "options": [
      {
        "id": "did-apos-nt",
        "text": "did'nt"
      },
      {
        "id": "didnt-apos-end",
        "text": "didnt'"
      },
      {
        "id": "didnt-apos",
        "text": "didn't"
      },
      {
        "id": "didnt-none",
        "text": "didnt"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "didnt-apos"
    },
    "explanation": "A contraction joins two words and uses an apostrophe where letters are missing. In 'did not' the o is dropped, so the apostrophe goes in its place: didn't. The other spellings put the apostrophe in the wrong spot or leave it out.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes",
      "skill": "Forming contractions with n't (didn't)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "apostrophes",
        "contractions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-013",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence. Choose the TWO words that should begin with a capital letter but do not.\n\non friday we visited the museum.",
    "options": [
      {
        "id": "visited",
        "text": "visited"
      },
      {
        "id": "museum",
        "text": "museum"
      },
      {
        "id": "on",
        "text": "on"
      },
      {
        "id": "friday",
        "text": "friday"
      },
      {
        "id": "we",
        "text": "we"
      }
    ],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "on",
        "friday"
      ]
    },
    "explanation": "The first word of a sentence always starts with a capital letter, so 'on' should be 'On'. Days of the week are proper nouns, so 'friday' should be 'Friday'. 'We', 'visited' and 'museum' are correct as ordinary words inside the sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters",
      "skill": "Capital letters: sentence start and days of the week",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "punctuation",
        "capitals",
        "sentence start",
        "days"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which word correctly completes the sentence?\n\nI hurt my ___ when I fell over.",
    "options": [
      {
        "id": "knee",
        "text": "knee"
      },
      {
        "id": "nee",
        "text": "nee"
      },
      {
        "id": "kne",
        "text": "kne"
      },
      {
        "id": "knea",
        "text": "knea"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "knee"
    },
    "explanation": "Knee begins with a silent k that you do not hear but must write: k-n-e-e. Words like knee, knife and knock all start with a silent k, and the ending is a double e.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Silent letters",
      "skill": "Spelling words with a silent k",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "silent letters",
        "knee"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-015",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence. Is the capitalisation of the word 'i' correct?\n\nOn Sunday i went to my friend's house.",
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "The word 'I' meaning yourself is always written as a capital letter, wherever it appears in a sentence. Here 'i' should be 'I', so the sentence is not correct and the answer is false.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters",
      "skill": "Capitalising the pronoun I",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "capitals",
        "pronoun I"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-db-016",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nCome and sit over ___ next to me.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "here",
              "text": "here"
            },
            {
              "id": "hear",
              "text": "hear"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "here"
        }
      ]
    },
    "explanation": "'Here' means in this place and matches words like 'where' and 'there'. 'Hear' is what you do with your ears, and it hides the word 'ear'. Sitting over here is about a place, so 'here' is correct.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (here / hear)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "homophones",
        "here hear"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nOf all the trees in the park, the oak is the ___.",
    "options": [
      {
        "id": "tallest",
        "text": "tallest"
      },
      {
        "id": "taller",
        "text": "taller"
      },
      {
        "id": "tallerest",
        "text": "tallerest"
      },
      {
        "id": "tall",
        "text": "tall"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "tallest"
    },
    "explanation": "When you compare three or more things, use the '-est' ending. The oak is compared with all the other trees, so it is the 'tallest'. 'Taller' only compares two things, 'tall' compares none, and 'tallerest' is not a real word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Adjectives",
      "skill": "Using superlative adjectives (-est)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "adjectives",
        "superlative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nMy nan and I made soup. Then ___ ate it together.",
    "options": [
      {
        "id": "us",
        "text": "us"
      },
      {
        "id": "we",
        "text": "we"
      },
      {
        "id": "they",
        "text": "they"
      },
      {
        "id": "them",
        "text": "them"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "we"
    },
    "explanation": "'We' does the action of eating, so it is the subject of the verb. 'My nan and I' can be replaced by 'we'. 'Us' and 'them' are used for people the action happens to, and 'they' would mean other people, not me and my nan.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Pronouns",
      "skill": "Choosing the correct subject pronoun (we)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "pronouns",
        "subject pronoun"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-003",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nI ___ the way to the library from here.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "no",
              "text": "no"
            },
            {
              "id": "know",
              "text": "know"
            },
            {
              "id": "now",
              "text": "now"
            },
            {
              "id": "knew",
              "text": "knew"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "know"
        }
      ]
    },
    "explanation": "'Know' means to have something in your mind, like a fact or a way to go. 'No' is the opposite of yes, 'now' means at this moment, and 'knew' is the past tense (yesterday). The sentence is about knowing the way right now, so 'know' fits.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (know / no)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "homophones",
        "know no"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-004",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Write the word that means more than one foot to complete the sentence.\n\nA duck waddles along on two webbed ___.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "A duck waddles along on two webbed ",
        "."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "plural of foot"
        }
      ]
    },
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "feet"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "Some words do not add an 's' to become plural. 'Foot' changes its middle letters to become 'feet'. Writing 'foots' or 'feets' would be wrong because 'foot' is an irregular plural.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Plurals",
      "skill": "Spelling irregular plurals (foot / feet)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "plurals",
        "irregular"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-005",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence below.\n\nWhat time does the concert start.\n\nDoes this sentence end with the correct punctuation mark?",
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "This sentence is asking something, so it is a question and must end with a question mark (?). It ends with a full stop instead, so the punctuation is not correct. Words like 'what', 'when' and 'does' often signal a question.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Sentence punctuation",
      "skill": "Ending a question with a question mark",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "question mark",
        "sentence type"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-006",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Match each shortened word (contraction) to the two words it stands for.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "cant",
          "text": "can't"
        },
        {
          "id": "well",
          "text": "we'll"
        },
        {
          "id": "isnt",
          "text": "isn't"
        }
      ],
      "targets": [
        {
          "id": "cannot",
          "text": "cannot"
        },
        {
          "id": "wewill",
          "text": "we will"
        },
        {
          "id": "isnot",
          "text": "is not"
        },
        {
          "id": "willnot",
          "text": "will not"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "cant",
          "targetId": "cannot"
        },
        {
          "sourceId": "well",
          "targetId": "wewill"
        },
        {
          "sourceId": "isnt",
          "targetId": "isnot"
        }
      ]
    },
    "explanation": "A contraction joins two words and uses an apostrophe to show the missing letters. 'Can't' = can + not, 'we'll' = we + will, and 'isn't' = is + not. 'Will not' is the contraction 'won't', so it is the extra one that is not used.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes",
      "skill": "Matching contractions to their full words",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "punctuation",
        "apostrophes",
        "contractions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-007",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Put the word cards in order to make a correct sentence that shows excitement. The card that begins with a capital letter goes first, and the card with the exclamation mark goes last.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "c1",
          "text": "the"
        },
        {
          "id": "c2",
          "text": "won"
        },
        {
          "id": "c3",
          "text": "We"
        },
        {
          "id": "c4",
          "text": "race!"
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "c3",
        "c2",
        "c1",
        "c4"
      ]
    },
    "explanation": "A sentence starts with a capital letter, so 'We' comes first. Next comes the doing word 'won', then 'the', then 'race!'. The finished sentence 'We won the race!' ends with an exclamation mark because it shows strong feeling.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Sentence structure",
      "skill": "Ordering words to build an exclamation",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "punctuation",
        "sentence order",
        "exclamation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-008",
    "type": "short_answer",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Add the ending '-ful' to the word 'help' to make a word meaning 'giving a lot of help'. Write the one new word.",
    "answerKey": {
      "kind": "text",
      "acceptableAnswers": [
        "helpful"
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "The suffix '-ful' means 'full of' or 'giving'. Adding it to 'help' makes 'helpful', which describes someone who gives help. Note that '-ful' is spelled with only one 'l' at the end, so 'helpfull' would be wrong.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Suffixes",
      "skill": "Building a word with the suffix -ful",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "suffixes",
        "word building"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Which sentence uses capital letters correctly?",
    "options": [
      {
        "id": "a",
        "text": "My cousin Ravi lives in perth."
      },
      {
        "id": "c",
        "text": "My cousin ravi lives in Perth."
      },
      {
        "id": "b",
        "text": "My cousin Ravi lives in Perth."
      },
      {
        "id": "d",
        "text": "my cousin ravi lives in perth."
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "A sentence begins with a capital letter, and the names of particular people and places (proper nouns) also start with capitals. So 'My', the person's name 'Ravi', and the city 'Perth' all need capitals. Only option B capitalises all three correctly.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters",
      "skill": "Capitalising proper nouns (names and places)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "capital letters",
        "proper nouns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-010",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nThe frightened cat hid ___ the bed.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "under",
              "text": "under"
            },
            {
              "id": "of",
              "text": "of"
            },
            {
              "id": "since",
              "text": "since"
            },
            {
              "id": "between",
              "text": "between"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "under"
        }
      ]
    },
    "explanation": "A preposition tells you where something is. A cat hiding beneath the bed is 'under' it. 'Between' needs two things, 'since' talks about time, and 'of' does not show a position, so they do not fit.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Prepositions",
      "skill": "Choosing the correct preposition of place",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "prepositions",
        "position words"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nMy two goldfish ___ like the bright light.",
    "options": [
      {
        "id": "doesnt",
        "text": "doesn't"
      },
      {
        "id": "isnt",
        "text": "isn't"
      },
      {
        "id": "arent",
        "text": "aren't"
      },
      {
        "id": "dont",
        "text": "don't"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "dont"
    },
    "explanation": "'Two goldfish' is more than one, so the verb must be the plural form. We say 'they don't', so 'don't' is correct. 'Doesn't' goes with one thing (it doesn't), and 'isn't' and 'aren't' would need to be followed by an '-ing' word, not 'like'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Subject-verb agreement",
      "skill": "Matching a plural subject to don't",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "grammar",
        "subject-verb",
        "agreement"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence. Choose the TWO words that are verbs (doing words).\n\nThe dog ran fast and jumped over the log.",
    "options": [
      {
        "id": "fast",
        "text": "fast"
      },
      {
        "id": "jumped",
        "text": "jumped"
      },
      {
        "id": "over",
        "text": "over"
      },
      {
        "id": "log",
        "text": "log"
      },
      {
        "id": "the",
        "text": "The"
      },
      {
        "id": "dog",
        "text": "dog"
      },
      {
        "id": "ran",
        "text": "ran"
      }
    ],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "ran",
        "jumped"
      ]
    },
    "explanation": "A verb is a doing word that shows an action. The dog 'ran' and 'jumped', so those are the two verbs. 'Dog' and 'log' are naming words (nouns), 'fast' tells how, and 'the' and 'over' are not actions.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Word classes",
      "skill": "Identifying verbs in a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "grammar",
        "verbs",
        "word classes"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-013",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Add the ending '-ly' to the word 'slow' to make a word that tells how the tractor moved. Write the one new word to complete the sentence.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "The old tractor moved ",
        "up the steep hill."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "slow + ly"
        }
      ]
    },
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "slowly"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "Adding '-ly' to an adjective often makes an adverb, a word that tells how something happens. 'Slow' plus '-ly' becomes 'slowly', which describes how the tractor moved. The base word 'slow' does not change its spelling before you add '-ly'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Suffixes",
      "skill": "Forming adverbs with the suffix -ly",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "suffixes",
        "adverbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-014",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Read the sentence below.\n\nAfter the storm, the children went outside to play.\n\nIs the comma used correctly in this sentence?",
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "When a sentence starts with a group of words that sets the scene, like 'After the storm', we put a comma after it before the main part of the sentence begins. The comma helps the reader pause in the right place, so it is used correctly here.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Commas",
      "skill": "Using a comma after an introductory phrase",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "punctuation",
        "commas",
        "introductory phrase"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nWe saw three ___ playing near their den.",
    "options": [
      {
        "id": "foxs",
        "text": "foxs"
      },
      {
        "id": "foxes",
        "text": "foxes"
      },
      {
        "id": "foxis",
        "text": "foxis"
      },
      {
        "id": "foxxes",
        "text": "foxxes"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "foxes"
    },
    "explanation": "When a word ends in 'x', we add '-es' to make it plural so it is easy to say. 'Fox' becomes 'foxes'. We do not just add 's' ('foxs'), we do not double the 'x' ('foxxes'), and we do not change the ending to 'is' ('foxis').",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Plurals",
      "skill": "Spelling plurals by adding -es after x",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "plurals",
        "-es ending"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-dd-016",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "visuals": [],
    "prompt": "Choose the word that correctly completes the sentence.\n\nTomorrow our whole class ___ visit the museum.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "missing word",
          "options": [
            {
              "id": "did",
              "text": "did"
            },
            {
              "id": "was",
              "text": "was"
            },
            {
              "id": "will",
              "text": "will"
            },
            {
              "id": "are",
              "text": "are"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "f1",
          "correctOptionId": "will"
        }
      ]
    },
    "explanation": "The word 'Tomorrow' tells us the visit has not happened yet, so we need the future tense. 'Will visit' shows something that is going to happen. 'Did' and 'was' point to the past, and 'are visit' is not a correct form.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Verb tense",
      "skill": "Using 'will' for the future tense",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "verb tense",
        "future"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya jumped back and yelled, \"Look out for the wet paint\" Which end mark best completes what Priya yelled?",
    "options": [
      {
        "id": "full-stop",
        "text": "a full stop"
      },
      {
        "id": "exclamation-mark",
        "text": "an exclamation mark"
      },
      {
        "id": "question-mark",
        "text": "a question mark"
      },
      {
        "id": "comma",
        "text": "a comma"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "exclamation-mark"
    },
    "explanation": "Priya is yelling a warning with strong feeling, so the sentence needs an exclamation mark. A full stop is for calm statements, a question mark is for questions, and a comma never ends a sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "End punctuation",
      "skill": "Choose the correct end punctuation for a sentence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "exclamation mark",
        "end marks"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses capital letters correctly?",
    "options": [
      {
        "id": "opt-a",
        "text": "on friday, sam and aunty Rosa drove to Ballarat."
      },
      {
        "id": "opt-b",
        "text": "On friday, Sam and aunty rosa drove to ballarat."
      },
      {
        "id": "opt-c",
        "text": "On Friday, Sam and Aunty Rosa drove to Ballarat."
      },
      {
        "id": "opt-d",
        "text": "on Friday, sam and Aunty Rosa drove to ballarat."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Start a sentence with a capital, and give days (Friday), people's names (Sam, Aunty Rosa) and place names (Ballarat) capitals too. Only one option makes every one of those a capital.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Capital letters",
      "skill": "Use capital letters for sentence starts and proper nouns",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "capital letters",
        "proper nouns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses commas correctly in the list?",
    "options": [
      {
        "id": "opt-b",
        "text": "We packed apples cheese crackers and juice for the hike."
      },
      {
        "id": "opt-c",
        "text": "We packed, apples, cheese, crackers and juice for the hike."
      },
      {
        "id": "opt-d",
        "text": "We packed apples, cheese crackers, and juice for the hike."
      },
      {
        "id": "opt-a",
        "text": "We packed apples, cheese, crackers and juice for the hike."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "In a list, put a comma between each item and use 'and' before the last one: apples, cheese, crackers and juice. You do not put a comma straight after the verb 'packed' or leave items joined without commas.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Commas in a list",
      "skill": "Place commas correctly in a list",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "commas",
        "lists"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses a comma correctly to join the two parts?",
    "options": [
      {
        "id": "opt-b",
        "text": "The rain stopped, so we raced outside to play."
      },
      {
        "id": "opt-a",
        "text": "The rain stopped so we raced outside to play."
      },
      {
        "id": "opt-c",
        "text": "The rain, stopped so we raced outside to play."
      },
      {
        "id": "opt-d",
        "text": "The rain stopped so, we raced outside to play."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "When two full ideas are joined by a word like 'so', put the comma before the joining word: 'The rain stopped, so we raced outside.' The comma does not go inside 'The rain' or after 'so'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Commas in compound sentences",
      "skill": "Use a comma before a joining word in a compound sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "commas",
        "compound sentences"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that best completes the sentence: \"My little sister ___ her own shoelaces now.\"",
    "options": [
      {
        "id": "opt-tie",
        "text": "tie"
      },
      {
        "id": "opt-ties",
        "text": "ties"
      },
      {
        "id": "opt-tying",
        "text": "tying"
      },
      {
        "id": "opt-tied",
        "text": "tied"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-ties"
    },
    "explanation": "The subject 'My little sister' is one person, so the present-tense verb needs an 's': she 'ties'. 'Tie' is for I/we/they, 'tying' needs a helper word like 'is', and 'tied' would change it to the past.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Subject-verb agreement",
      "skill": "Match a singular subject to its verb",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "subject-verb agreement",
        "verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that keeps the sentence in the same tense: \"Yesterday we walked to the market and ___ fresh mangoes.\"",
    "options": [
      {
        "id": "opt-buy",
        "text": "buy"
      },
      {
        "id": "opt-buys",
        "text": "buys"
      },
      {
        "id": "opt-bought",
        "text": "bought"
      },
      {
        "id": "opt-buying",
        "text": "buying"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-bought"
    },
    "explanation": "The word 'Yesterday' and the verb 'walked' show this happened in the past, so the second verb must also be past tense: 'bought'. 'Buy' and 'buys' are present tense, and 'buying' needs a helper word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Consistent verb tense",
      "skill": "Keep verb tense consistent within a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "verb tense",
        "past tense"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence \"The busy farmer loaded hay onto the truck\", which word is a verb?",
    "options": [
      {
        "id": "opt-farmer",
        "text": "farmer"
      },
      {
        "id": "opt-truck",
        "text": "truck"
      },
      {
        "id": "opt-busy",
        "text": "busy"
      },
      {
        "id": "opt-loaded",
        "text": "loaded"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-loaded"
    },
    "explanation": "A verb is a doing word. 'Loaded' tells us the action the farmer did, so it is the verb. 'Farmer' and 'truck' are nouns, and 'busy' is an adjective describing the farmer.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Parts of speech",
      "skill": "Identify a verb in a sentence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "parts of speech",
        "verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read: \"Zara could not find her hat, so she looked under the bed.\" Which word is a pronoun?",
    "options": [
      {
        "id": "opt-she",
        "text": "she"
      },
      {
        "id": "opt-zara",
        "text": "Zara"
      },
      {
        "id": "opt-hat",
        "text": "hat"
      },
      {
        "id": "opt-bed",
        "text": "bed"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-she"
    },
    "explanation": "A pronoun is a small word that stands in for a name. 'She' takes the place of 'Zara' so we do not repeat her name. 'Zara' is a naming word, and 'hat' and 'bed' are nouns for things.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Parts of speech",
      "skill": "Identify a pronoun in a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "parts of speech",
        "pronouns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word correctly joins \"do not\" into one word using an apostrophe?",
    "options": [
      {
        "id": "opt-dont",
        "text": "dont"
      },
      {
        "id": "opt-correct",
        "text": "don't"
      },
      {
        "id": "opt-donapnt",
        "text": "do'nt"
      },
      {
        "id": "opt-doesnapt",
        "text": "does'nt"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-correct"
    },
    "explanation": "A contraction uses an apostrophe where letters are removed. 'Do not' loses the 'o' in 'not', and the apostrophe goes exactly there: 'don't'. 'Dont' has no apostrophe, and the others place it in the wrong spot.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes for contractions",
      "skill": "Form a contraction with a correctly placed apostrophe",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "apostrophes",
        "contractions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One teacher owns the whistle. Which sentence shows this with the apostrophe in the right place?",
    "options": [
      {
        "id": "opt-b",
        "text": "The teachers' whistle was very loud."
      },
      {
        "id": "opt-c",
        "text": "The teachers whistle was very loud."
      },
      {
        "id": "opt-a",
        "text": "The teacher's whistle was very loud."
      },
      {
        "id": "opt-d",
        "text": "The teacher whistle's was very loud."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "For one owner, add apostrophe then 's' to the owner: 'teacher's whistle'. 'Teachers'' means many teachers, 'teachers' has no apostrophe, and putting the apostrophe on 'whistle' names the wrong owner.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "Apostrophes for possession",
      "skill": "Use an apostrophe to show singular possession",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "apostrophes",
        "possessives"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled incorrectly?",
    "options": [
      {
        "id": "opt-school",
        "text": "school"
      },
      {
        "id": "opt-people",
        "text": "people"
      },
      {
        "id": "opt-pretty",
        "text": "pretty"
      },
      {
        "id": "opt-freind",
        "text": "freind"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-freind"
    },
    "explanation": "The word for someone you like should be 'friend', with the 'i' before the 'e'. 'Freind' swaps those letters. A helpful reminder is that a 'friend' is there to the 'end'. The other three words are all spelled correctly.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Common word spelling",
      "skill": "Spot a misspelled common Year 3 word",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "error correction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct spelling to complete the sentence: \"Our swimming lesson is every ___.\"",
    "options": [
      {
        "id": "opt-wednesday",
        "text": "Wednesday"
      },
      {
        "id": "opt-wensday",
        "text": "Wensday"
      },
      {
        "id": "opt-wednsday",
        "text": "Wednsday"
      },
      {
        "id": "opt-wedensday",
        "text": "Wedensday"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-wednesday"
    },
    "explanation": "The day is spelled 'Wednesday'. A useful trick is to sound out the hidden 'Wed-nes-day'. The other spellings drop or move the middle letters, so they are wrong.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Spelling",
      "topic": "Common word spelling",
      "skill": "Choose the correct spelling of a common word",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "spelling",
        "days of the week"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that makes the sentence correct: \"There ___ three ducks resting on the pond.\"",
    "options": [
      {
        "id": "opt-is",
        "text": "is"
      },
      {
        "id": "opt-are",
        "text": "are"
      },
      {
        "id": "opt-was",
        "text": "was"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-are"
    },
    "explanation": "'Three ducks' is more than one, so the verb must be the plural present-tense form 'are'. 'Is' and 'was' are for a single thing, and 'was' would also change the sentence to the past.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Grammar",
      "topic": "Subject-verb agreement",
      "skill": "Match a plural subject to its verb",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "subject-verb agreement",
        "dropdown"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-language-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the end mark that correctly finishes this sentence: \"What time does the library open___\"",
    "options": [
      {
        "id": "opt-fullstop",
        "text": "full stop"
      },
      {
        "id": "opt-exclaim",
        "text": "exclamation mark"
      },
      {
        "id": "opt-question",
        "text": "question mark"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-question"
    },
    "explanation": "This sentence asks something, and it begins with the question word 'What', so it needs a question mark. A full stop is for statements and an exclamation mark is for strong feelings, not for asking.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Punctuation",
      "topic": "End punctuation",
      "skill": "Choose the correct end mark for a question",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "punctuation",
        "question mark",
        "dropdown"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
