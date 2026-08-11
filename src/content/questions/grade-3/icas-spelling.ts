import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 ICAS-style Spelling — 36 hand-authored questions. ICAS-only:
 * NAPLAN folds spelling into Language Conventions rather than setting it
 * as its own paper.
 */
export const grade3IcasSpelling = defineQuestions([
  {
    id: "icas-y3-spelling-a-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "One vowel is missing from the middle of the word. Write the single letter that fills the gap so the sentence makes sense and the word is spelt correctly.",
    instructions: "Type just the one missing letter.",
    options: [],
    interaction: {
      type: "fill_blank",
      segments: ["The sun is very h", "t today."],
      blanks: [
        {
          id: "b1",
          label: "missing vowel",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["o"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "Say the word slowly: /h/ /o/ /t/. The short vowel sound in the middle is the letter 'o', which gives 'hot'. No other vowel fits the sentence.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Short vowel sounds",
      skill: "Choosing the correct short vowel in a one-syllable word",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "short vowels", "phonics", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "smiel", text: "smiel" },
      { id: "smyle", text: "smyle" },
      { id: "smille", text: "smille" },
      { id: "smile", text: "smile" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "smile",
    },
    explanation: "The long 'i' sound comes from the silent 'e' at the end: smi-l-e. The 'e' is not spoken but makes the 'i' say its name. 'smiel' and 'smyle' use the wrong letters for that sound.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Long vowel sounds",
      skill: "Spelling a long vowel with the silent 'e' (magic e) pattern",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 35,
      tags: ["spelling", "long vowels", "magic e", "silent e", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "shovel", text: "shovel" },
      { id: "shuvel", text: "shuvel" },
      { id: "shovle", text: "shovle" },
      { id: "shovval", text: "shovval" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "shovel",
    },
    explanation: "It starts with the 'sh' digraph and reads in two beats: sho-vel, ending '-vel'. 'shuvel' swaps the first vowel and 'shovle' turns the ending letters around.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Digraph sh",
      skill: "Spelling words that begin with the 'sh' digraph",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "digraph", "sh", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-004",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Two letters are missing from the end of the word. Write the two letters that complete it correctly.",
    instructions: "Type just the two missing letters.",
    options: [],
    interaction: {
      type: "fill_blank",
      segments: ["We ate our lun", " in the park."],
      blanks: [
        {
          id: "b1",
          label: "missing letters",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["ch"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "The word ends with the 'ch' sound you hear in 'chip' and 'much'. 'lun' plus 'ch' spells 'lunch'.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Digraph ch",
      skill: "Spelling the 'ch' digraph at the end of a word",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "digraph", "ch", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-005",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correctly spelt word to complete the sentence: The sky turned dark just before the loud ___.",
    options: [],
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "the word",
          options: [
            { id: "thonder", text: "thonder" },
            { id: "thunder", text: "thunder" },
            { id: "thunda", text: "thunda" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "thunder",
        },
      ],
    },
    explanation: "It begins with the 'th' digraph and the middle says short 'u': thun-der. 'thonder' uses the wrong vowel and 'thunda' drops the '-er' ending.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Digraph th",
      skill: "Spelling words that begin with the 'th' digraph",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "digraph", "th", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-006",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "blankit", text: "blankit" },
      { id: "blanket", text: "blanket" },
      { id: "blancet", text: "blancet" },
      { id: "blankut", text: "blankut" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "blanket",
    },
    explanation: "Break it into two parts: blan-ket. The 'bl' blend starts it and the ending is spelt '-ket' with an 'e'. 'blankit' and 'blankut' use the wrong vowel in the second part.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Blend bl",
      skill: "Spelling words that begin with the 'bl' blend",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "blend", "bl", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-007",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Three letters are missing from the start of the word. Write the letters that complete it so the sentence makes sense.",
    instructions: "Type just the three missing letters.",
    options: [],
    interaction: {
      type: "fill_blank",
      segments: ["We walked down the busy ", "eet."],
      blanks: [
        {
          id: "b1",
          label: "missing letters",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["str"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "The word 'street' begins with the three-letter blend 'str', where you hear /s/ /t/ /r/ run together, and then 'eet' makes the long 'e' sound.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Blend str",
      skill: "Spelling the three-letter blend 'str' at the start of a word",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["spelling", "blend", "str", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "jumpping", text: "jumpping" },
      { id: "jumpeing", text: "jumpeing" },
      { id: "jumping", text: "jumping" },
      { id: "jumbing", text: "jumbing" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "jumping",
    },
    explanation: "'jump' already ends in two consonants (m and p), so you just add '-ing' with no changes: jump + ing = jumping. You do not double a letter or add an extra 'e'.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ing",
      skill: "Adding -ing to a base word with no spelling change",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["spelling", "suffix", "ing", "word building", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "swiming", text: "swiming" },
      { id: "swimmming", text: "swimmming" },
      { id: "swimeing", text: "swimeing" },
      { id: "swimming", text: "swimming" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "swimming",
    },
    explanation: "'swim' has one short vowel and ends in a single 'm', so you double the 'm' before '-ing': swim + m + ing = swimming. 'swiming' forgets to double the 'm'.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ing with doubling",
      skill: "Doubling the final consonant before adding -ing",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["spelling", "suffix", "ing", "doubling", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-010",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correctly spelt word to complete the sentence: We are ___ a sandcastle on the beach.",
    options: [],
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "the word",
          options: [
            { id: "making", text: "making" },
            { id: "makeing", text: "makeing" },
            { id: "makking", text: "makking" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "making",
        },
      ],
    },
    explanation: "'make' ends in a silent 'e', so you drop the 'e' before adding '-ing': mak(e) + ing = making. 'makeing' keeps the 'e' by mistake.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ing after dropping e",
      skill: "Dropping the silent 'e' before adding -ing",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["spelling", "suffix", "ing", "drop e", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "jumped", text: "jumped" },
      { id: "jumpt", text: "jumpt" },
      { id: "jumpped", text: "jumpped" },
      { id: "jumpd", text: "jumpd" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "jumped",
    },
    explanation: "Even though the ending here sounds like 't', the past tense is spelt with '-ed': jump + ed = jumped. 'jumpt' spells it the way it sounds, which is wrong.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ed",
      skill: "Adding -ed to a base word with no spelling change",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 35,
      tags: ["spelling", "suffix", "ed", "past tense", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "stoped", text: "stoped" },
      { id: "stopped", text: "stopped" },
      { id: "stopt", text: "stopt" },
      { id: "stoppped", text: "stoppped" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "stopped",
    },
    explanation: "'stop' has one short vowel and one final consonant, so you double the 'p' before '-ed': stop + p + ed = stopped. 'stoped' forgets to double and 'stoppped' doubles too much.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ed with doubling",
      skill: "Doubling the final consonant before adding -ed",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["spelling", "suffix", "ed", "doubling", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-013",
    type: "short_answer",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Add the ending '-ed' to the word 'bake' to make its past tense. Write the one new word.",
    instructions: "Write only the single new word, with no other words.",
    options: [],
    visuals: [],
    answerKey: {
      kind: "text",
      acceptableAnswers: ["baked"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "'bake' ends in a silent 'e'. You drop the 'e' before adding '-ed': bak(e) + ed = baked. You do not write 'bakeed'.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Adding -ed after dropping e",
      skill: "Dropping the silent 'e' before adding -ed",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["spelling", "suffix", "ed", "drop e", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-014",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is the correct plural of 'chair' (more than one chair)?",
    options: [
      { id: "chaires", text: "chaires" },
      { id: "chairies", text: "chairies" },
      { id: "chairs", text: "chairs" },
      { id: "chaers", text: "chaers" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "chairs",
    },
    explanation: "'chair' is a plain noun, so you make it plural by just adding 's': chair + s = chairs. You do not add 'es' or change any letters.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Plurals with -s",
      skill: "Making a plural by adding -s",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 35,
      tags: ["spelling", "plurals", "s", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-015",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is the correct plural of 'box' (more than one box)?",
    options: [
      { id: "boxs", text: "boxs" },
      { id: "boxies", text: "boxies" },
      { id: "boxses", text: "boxses" },
      { id: "boxes", text: "boxes" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "boxes",
    },
    explanation: "Words that end in 'x' add '-es' to become plural so you can hear the extra sound: box + es = boxes. 'boxs' is too hard to say and 'boxies' changes the wrong letters.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Plurals with -es",
      skill: "Making a plural by adding -es after x, s, sh or ch",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["spelling", "plurals", "es", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-016",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is the correct plural of 'baby' (more than one baby)?",
    options: [
      { id: "babies", text: "babies" },
      { id: "babys", text: "babys" },
      { id: "babyies", text: "babyies" },
      { id: "babbies", text: "babbies" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "babies",
    },
    explanation: "When a word ends in a consonant then 'y', change the 'y' to 'i' and add '-es': bab(y) becomes babi + es = babies. 'babys' forgets to change the 'y'.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Plurals with -ies",
      skill: "Making a plural by changing y to -ies",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["spelling", "plurals", "ies", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-017",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which TWO words are spelt correctly? Choose two.",
    options: [
      { id: "tabel", text: "tabel" },
      { id: "rabbit", text: "rabbit" },
      { id: "kichen", text: "kichen" },
      { id: "garden", text: "garden" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["garden", "rabbit"],
    },
    explanation: "'garden' (gar-den) and 'rabbit' (rab-bit, with a double b) are both correct. 'tabel' should be 'table', and 'kichen' is missing the 't' in 'kitchen'.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Two-syllable words",
      skill: "Recognising correctly spelt two-syllable words",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 55,
      tags: ["spelling", "syllables", "two syllable", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-a-018",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word is spelt correctly?",
    options: [
      { id: "trane", text: "trane" },
      { id: "trian", text: "trian" },
      { id: "train", text: "train" },
      { id: "traine", text: "traine" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "train",
    },
    explanation: "The long 'a' sound in the middle is spelt with the vowel team 'ai': tr-ai-n = train. 'trane' uses a silent 'e' instead, and 'trian' swaps the two vowels around.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Long vowel with ai team",
      skill: "Spelling the long 'a' sound with the 'ai' vowel team",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 35,
      tags: ["spelling", "long vowels", "ai", "vowel team", "year 3", "icas"],
    },
  },
  {
    id: "icas-y3-spelling-b-001",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the word that correctly completes the sentence: The girls waved to ___ grandmother at the gate.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "___ grandmother",
          options: [
            { id: "opt-their", text: "their" },
            { id: "opt-there", text: "there" },
            { id: "opt-theyre", text: "they're" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "opt-their",
        },
      ],
    },
    explanation: "'Their' shows that something belongs to them, and the grandmother belongs to the girls' family. 'There' points to a place, and 'they're' is short for 'they are', so neither of those fits before 'grandmother'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Homophones",
      skill: "Homophones: their vs there",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["homophones", "their", "there", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-002",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the word that correctly completes the sentence: By the end of the race we were ___ tired to walk home.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "___ tired",
          options: [
            { id: "opt-to", text: "to" },
            { id: "opt-too", text: "too" },
            { id: "opt-two", text: "two" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "opt-too",
        },
      ],
    },
    explanation: "'Too' means 'more than enough' or 'also', and here it means more than enough tired. 'To' shows direction, like 'walk home', and 'two' is the number 2. The extra 'o' in 'too' is like having too many o's.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Homophones",
      skill: "Homophones: to vs too",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["homophones", "to", "too", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word correctly completes the sentence? Please come ___ and sit next to me on the mat.",
    options: [
      { id: "opt-hear", text: "hear" },
      { id: "opt-here", text: "here" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-here",
    },
    explanation: "'Here' means in this place, which is where the person is asked to sit. 'Hear' is what you do with your ears. A handy tip: the word 'here' is hiding inside 't-here' and 'w-here', which are also places.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Homophones",
      skill: "Homophones: hear vs here",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 30,
      tags: ["homophones", "hear", "here", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-004",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word correctly completes the sentence? Do you ___ the way to the new library?",
    options: [
      { id: "opt-know", text: "know" },
      { id: "opt-no", text: "no" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-know",
    },
    explanation: "'Know' means to have something in your head, like knowing the way somewhere. 'No' is the opposite of yes. 'Know' begins with a silent k, so you cannot hear it but you must still write it.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Homophones",
      skill: "Homophones: no vs know",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 30,
      tags: ["homophones", "no", "know", "silent k", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-005",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word correctly completes the sentence? At the wildlife park we watched a big brown ___ climb a tree.",
    options: [
      { id: "opt-bare", text: "bare" },
      { id: "opt-bear", text: "bear" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-bear",
    },
    explanation: "'Bear' is the large animal. 'Bare' means empty or uncovered, like bare feet. To remember the animal, picture it: a 'bEAR' has big 'EARs'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Homophones",
      skill: "Homophones: bare vs bear",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 30,
      tags: ["homophones", "bare", "bear", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-006",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Fill in the two missing letters to spell the small animal that hops and has long ears: ra__it.",
    interaction: {
      type: "fill_blank",
      segments: ["ra", "it"],
      blanks: [
        {
          id: "b1",
          label: "two missing letters",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["bb"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "'Rabbit' has a double b in the middle: ra-bb-it. Say the word slowly and listen for the short 'a' sound near the start; a short vowel is usually followed by two consonants, so you need two b's.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Double consonants",
      skill: "Double consonant (bb) in 'rabbit'",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 35,
      tags: ["double letters", "rabbit", "short vowel", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-007",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling correctly completes the sentence? The little frog was ___ across the lily pads.",
    options: [
      { id: "opt-hoping", text: "hoping" },
      { id: "opt-hopeing", text: "hopeing" },
      { id: "opt-hopin", text: "hopin" },
      { id: "opt-hopping", text: "hopping" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-hopping",
    },
    explanation: "'Hop' has one short vowel and one final consonant, so you double the p before adding -ing: hop becomes hopping. 'Hoping' with one p comes from 'hope' and means wishing for something, which does not fit a frog jumping.",
    metadata: {
      subject: "spelling",
      strand: "Morphological",
      topic: "Suffixes",
      skill: "Doubling the final consonant before -ing (hopping)",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["suffix", "-ing", "doubling", "hopping", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-008",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Fill in the two missing letters to complete the word: We sit down together to eat di__er every evening.",
    interaction: {
      type: "fill_blank",
      segments: ["di", "er"],
      blanks: [
        {
          id: "b1",
          label: "two missing letters",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["nn"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "'Dinner', the evening meal, has a double n: din-ner. With only one n you get 'diner', which is a place where you buy food, not the meal itself.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Double consonants",
      skill: "Double consonant (nn) in 'dinner'",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["double letters", "dinner", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? I stayed inside at lunchtime ___ it was raining hard.",
    options: [
      { id: "opt-because", text: "because" },
      { id: "opt-becuase", text: "becuase" },
      { id: "opt-becos", text: "becos" },
      { id: "opt-becaus", text: "becaus" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-because",
    },
    explanation: "'Because' is spelt be-cause, ending in the whole word 'cause'. Break it into those two chunks to get the order right, and remember it finishes with -se, not just -s.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Tricky high-frequency words",
      skill: "Spelling the tricky word 'because'",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["tricky words", "because", "high frequency", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-010",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? My best ___ lives in the house next door.",
    options: [
      { id: "opt-freind", text: "freind" },
      { id: "opt-friend", text: "friend" },
      { id: "opt-frend", text: "frend" },
      { id: "opt-frind", text: "frind" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-friend",
    },
    explanation: "'Friend' is spelt fri-end, with the i before the e. Remember the saying 'a friend is there to the END', because the word finishes with 'end'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Tricky high-frequency words",
      skill: "Spelling the tricky word 'friend'",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["tricky words", "friend", "ie", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? \"Please line up quietly,\" ___ the teacher.",
    options: [
      { id: "opt-sed", text: "sed" },
      { id: "opt-saed", text: "saed" },
      { id: "opt-said", text: "said" },
      { id: "opt-siad", text: "siad" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-said",
    },
    explanation: "'Said' is the past tense of 'say' and is spelt s-a-i-d, even though it sounds like 'sed'. The 'ai' keeps the link to its base word 'say'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Tricky high-frequency words",
      skill: "Spelling the tricky word 'said'",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["tricky words", "said", "high frequency", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? After they finished lunch, ___ went outside to play.",
    options: [
      { id: "opt-thay", text: "thay" },
      { id: "opt-thei", text: "thei" },
      { id: "opt-dey", text: "dey" },
      { id: "opt-they", text: "they" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-they",
    },
    explanation: "'They' is spelt t-h-e-y. The 'ey' at the end makes the long 'a' sound, just like in 'grey', 'obey' and 'prey'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Tricky high-frequency words",
      skill: "Spelling the tricky word 'they'",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["tricky words", "they", "ey", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-013",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? The old dog ___ fast asleep on the warm mat.",
    options: [
      { id: "opt-was", text: "was" },
      { id: "opt-wos", text: "wos" },
      { id: "opt-wuz", text: "wuz" },
      { id: "opt-waz", text: "waz" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-was",
    },
    explanation: "'Was' is spelt w-a-s, even though it sounds like 'woz'. It is the past tense of 'is', and the 'a' in the middle is the letter to remember.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Tricky high-frequency words",
      skill: "Spelling the tricky word 'was'",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 30,
      tags: ["tricky words", "was", "high frequency", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-014",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? The teacher drew a big ___ on the whiteboard.",
    options: [
      { id: "opt-circel", text: "circel" },
      { id: "opt-circle", text: "circle" },
      { id: "opt-sircle", text: "sircle" },
      { id: "opt-curcle", text: "curcle" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-circle",
    },
    explanation: "In 'circle' the first c is a soft c and sounds like 's', because it comes before the letter i. It still begins with c, not s: c-i-r-c-l-e, and ends in -cle.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Soft c",
      skill: "Soft c (c sounding like s) in 'circle'",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["soft c", "circle", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-015",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? Please be very ___ when you hold the baby chick.",
    options: [
      { id: "opt-jentle", text: "jentle" },
      { id: "opt-gentel", text: "gentel" },
      { id: "opt-gentle", text: "gentle" },
      { id: "opt-gentl", text: "gentl" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-gentle",
    },
    explanation: "In 'gentle' the g is a soft g and sounds like 'j', because it comes before the letter e. It still begins with g, not j: g-e-n-t-l-e, ending in -tle.",
    metadata: {
      subject: "spelling",
      strand: "Phonological",
      topic: "Soft g",
      skill: "Soft g (g sounding like j) in 'gentle'",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["soft g", "gentle", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-016",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which spelling is correct? The children love to ___ the big gum tree in the yard.",
    options: [
      { id: "opt-clime", text: "clime" },
      { id: "opt-climbe", text: "climbe" },
      { id: "opt-clim", text: "clim" },
      { id: "opt-climb", text: "climb" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-climb",
    },
    explanation: "'Climb' ends with a silent b: c-l-i-m-b. You cannot hear the b when you say it, but it must be written, just like the silent b in 'thumb', 'lamb' and 'comb'.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Silent letters",
      skill: "Silent letter b in 'climb'",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["silent letters", "silent b", "climb", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-017",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "One word in this sentence is spelt incorrectly. Which one is it? \"The children were verry happy at the party.\"",
    options: [
      { id: "opt-verry", text: "verry" },
      { id: "opt-children", text: "children" },
      { id: "opt-happy", text: "happy" },
      { id: "opt-party", text: "party" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-verry",
    },
    explanation: "Read each word on its own. 'Verry' has an extra r; the correct spelling is 'very' with just one r. 'Children', 'happy' and 'party' are all spelt correctly.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Proofreading",
      skill: "Proofreading: find the one misspelt word",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["proofreading", "editing", "very", "year 3"],
    },
  },
  {
    id: "icas-y3-spelling-b-018",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "This sentence has TWO words that are spelt incorrectly: \"The elefant is a very big anmal.\" Select the two misspelt words.",
    options: [
      { id: "opt-big", text: "big" },
      { id: "opt-very", text: "very" },
      { id: "opt-anmal", text: "anmal" },
      { id: "opt-elefant", text: "elefant" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["opt-elefant", "opt-anmal"],
    },
    explanation: "'Elefant' should be 'elephant', because the 'f' sound in this word is spelt with ph. 'Anmal' is missing an i and should be 'animal'. 'Big' and 'very' are both spelt correctly.",
    metadata: {
      subject: "spelling",
      strand: "Visual",
      topic: "Proofreading",
      skill: "Proofreading: select the two misspelt words",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 55,
      tags: ["proofreading", "editing", "elephant", "animal", "year 3"],
    },
  },

  ...([
  {
    "id": "icas-y3-spelling-da-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "chaine",
        "text": "chaine"
      },
      {
        "id": "chain",
        "text": "chain"
      },
      {
        "id": "chayne",
        "text": "chayne"
      },
      {
        "id": "chaign",
        "text": "chaign"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "chain"
    },
    "explanation": "The long /a/ sound in the middle of this word is written with the 'ai' team of letters: ch-ai-n. 'Chaine' adds a needless 'e', while 'chayne' and 'chaign' use letters that do not make that sound here.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Long /a/ spelled 'ai'",
      "skill": "Spelling the long /a/ sound with the 'ai' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 30,
      "tags": [
        "phonics",
        "ai digraph",
        "long a"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "nock",
        "text": "nock"
      },
      {
        "id": "knok",
        "text": "knok"
      },
      {
        "id": "knock",
        "text": "knock"
      },
      {
        "id": "knoc",
        "text": "knoc"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "knock"
    },
    "explanation": "'Knock' begins with a silent 'k' before the 'n', and the /k/ sound at the end is spelled 'ck' after a short vowel. Dropping the silent 'k' (nock) or losing a letter from 'ck' (knok, knoc) breaks the spelling.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters (kn)",
      "skill": "Spelling words that begin with a silent 'k' before 'n'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "silent letters",
        "kn",
        "ck"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-004",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correctly spelled word to complete the sentence: 'We all sat in a big ___ on the floor.'",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "big ___ on the floor",
          "options": [
            {
              "id": "sircle",
              "text": "sircle"
            },
            {
              "id": "circel",
              "text": "circel"
            },
            {
              "id": "circle",
              "text": "circle"
            },
            {
              "id": "sirkle",
              "text": "sirkle"
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
          "correctOptionId": "circle"
        }
      ]
    },
    "explanation": "Here the letter 'c' comes before 'i', so it makes a soft /s/ sound: c-ir-cle. Even though it sounds like /s/, this word is spelled with 'c', not 's'. The ending is '-cle', not '-cel' or '-kle'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Soft 'c' before i/e",
      "skill": "Spelling the soft /s/ sound made by 'c' before 'i'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "soft c",
        "conventions",
        "cle ending"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "giaint",
        "text": "giaint"
      },
      {
        "id": "jiaint",
        "text": "jiaint"
      },
      {
        "id": "giante",
        "text": "giante"
      },
      {
        "id": "giant",
        "text": "giant"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "giant"
    },
    "explanation": "Before 'i', the letter 'g' can make a soft /j/ sound, so 'giant' starts with 'g', not 'j'. The 'ia' spells the two sounds you hear. 'Giaint' and 'giante' add letters that are not sounded.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Soft 'g'",
      "skill": "Spelling the soft /j/ sound made by 'g' before 'i'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "soft g",
        "conventions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "rabbit",
        "text": "rabbit"
      },
      {
        "id": "rabit",
        "text": "rabit"
      },
      {
        "id": "rabet",
        "text": "rabet"
      },
      {
        "id": "rebit",
        "text": "rebit"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "rabbit"
    },
    "explanation": "'Rabbit' has a double 'b' in the middle after the short 'a'. Writing one 'b' (rabit) or changing the vowels (rabet, rebit) does not match how the word sounds and looks.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Double letters",
      "skill": "Using a double consonant after a short vowel (rabbit)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 30,
      "tags": [
        "double letters",
        "conventions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-007",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'We packed the books into four ___.'",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "four ___",
          "options": [
            {
              "id": "boxs",
              "text": "boxs"
            },
            {
              "id": "boxies",
              "text": "boxies"
            },
            {
              "id": "boxxes",
              "text": "boxxes"
            },
            {
              "id": "boxes",
              "text": "boxes"
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
          "correctOptionId": "boxes"
        }
      ]
    },
    "explanation": "When a word ends in 'x', you add '-es' to make it mean more than one: box becomes boxes. Just adding 's' (boxs) is too hard to say, and doubling the 'x' (boxxes) or adding '-ies' (boxies) is wrong.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals with -es",
      "skill": "Making plurals by adding '-es' to words ending in 'x'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plurals",
        "morphology",
        "-es"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One word in this sentence is spelled incorrectly. Which word is it? 'On Saturday we had a wonderfull day at the beach.'",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "saturday",
        "text": "Saturday"
      },
      {
        "id": "wonderfull",
        "text": "wonderfull"
      },
      {
        "id": "beach",
        "text": "beach"
      },
      {
        "id": "day",
        "text": "day"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "wonderfull"
    },
    "explanation": "The suffix that means 'full of' is spelled with only one 'l' when it is added to a word: wonder + ful = wonderful. So 'wonderfull' with two l's is the mistake; the other words are spelled correctly.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffix -ful",
      "skill": "Recognising the suffix '-ful' is spelled with one 'l'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "suffix",
        "-ful",
        "proofreading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One word in this sentence is spelled incorrectly. Which word is it? 'We ran fast to catch the buss before it left.'",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "ran",
        "text": "ran"
      },
      {
        "id": "catch",
        "text": "catch"
      },
      {
        "id": "buss",
        "text": "buss"
      },
      {
        "id": "fast",
        "text": "fast"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "buss"
    },
    "explanation": "'Bus' is spelled with a single 's'. Doubling it to 'buss' is the error. 'Ran', 'catch' and 'fast' are all spelled correctly in this sentence.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Single vs double letters",
      "skill": "Knowing that 'bus' is spelled with one 's'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "proofreading",
        "conventions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-010",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Fill in the two missing letters to spell this word correctly. It names a person you like to play with: fr__nd",
    "instructions": "Write only the two missing letters.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "My best fr",
        " nd sits next to me in class."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "fr__nd"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "ie"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "The tricky word 'friend' hides the word 'end' at the finish and uses 'ie' in the middle: fr-ie-nd. A helpful trick is 'a friend is there to the end'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Tricky words",
      "skill": "Spelling the tricky word 'friend' with 'ie' in the middle",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "tricky words",
        "ie",
        "friend"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-011",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add -ing to the verb 'swim' to complete the sentence: 'The children are ___ in the pool.'",
    "instructions": "Write the whole word.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "The children are ",
        " in the pool."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "are ___ in the pool"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "swimming"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "'Swim' ends in one short vowel and one consonant, so you double the 'm' before adding -ing: swim becomes swimming. Without doubling you would get 'swiming', which is wrong.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding -ing (doubling)",
      "skill": "Doubling the final consonant before adding '-ing'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "morphology",
        "-ing",
        "doubling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which TWO words below are spelled correctly?",
    "instructions": "Choose TWO answers.",
    "options": [
      {
        "id": "yellow",
        "text": "yellow"
      },
      {
        "id": "happy",
        "text": "happy"
      },
      {
        "id": "littel",
        "text": "littel"
      },
      {
        "id": "becuase",
        "text": "becuase"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "happy",
        "yellow"
      ]
    },
    "explanation": "'Happy' and 'yellow' are both spelled correctly. 'Littel' should be 'little' (the ending sound is written '-tle'), and 'becuase' should be 'because' - a good way to remember it is Big Elephants Can Always Understand Small Elephants.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Common tricky words",
      "skill": "Spotting correctly spelled common words",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "proofreading",
        "tricky words",
        "multiple select"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that correctly completes the sentence: 'The children put ___ bags on the hooks.'",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "their",
        "text": "their"
      },
      {
        "id": "there",
        "text": "there"
      },
      {
        "id": "they-re",
        "text": "they're"
      },
      {
        "id": "thair",
        "text": "thair"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "their"
    },
    "explanation": "'Their' means the bags belong to the children, so it is the possessive homophone spelled t-h-e-i-r. 'There' points to a place, 'they're' is short for 'they are', and 'thair' is not a word.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "their / there / they're",
      "skill": "Choosing the possessive homophone 'their'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "homophones",
        "their",
        "possessive"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-014",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'Please come ___ and sit next to me.'",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "come ___ and sit",
          "options": [
            {
              "id": "hear",
              "text": "hear"
            },
            {
              "id": "here",
              "text": "here"
            },
            {
              "id": "heer",
              "text": "heer"
            },
            {
              "id": "hier",
              "text": "hier"
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
          "correctOptionId": "here"
        }
      ]
    },
    "explanation": "'Here' means in this place, and you can spot the little word 'here' inside 'there' and 'where' - all place words. 'Hear' is what you do with your ears, so it does not fit; 'heer' and 'hier' are not real words.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "here / hear",
      "skill": "Choosing between the homophones 'here' and 'hear'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "homophones",
        "here",
        "hear"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is the correct plural of 'leaf' (more than one leaf)?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "leafs",
        "text": "leafs"
      },
      {
        "id": "leaves",
        "text": "leaves"
      },
      {
        "id": "leavs",
        "text": "leavs"
      },
      {
        "id": "leves",
        "text": "leves"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "leaves"
    },
    "explanation": "Some words ending in 'f' change the 'f' to 'v' and add '-es' to mean more than one: leaf becomes leaves. 'Leafs' just adds 's', while 'leavs' and 'leves' drop letters that are needed.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals f -> ves",
      "skill": "Making plurals by changing 'f' to 'ves' (leaf to leaves)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plurals",
        "morphology",
        "f to ves"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-da-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "comming",
        "text": "comming"
      },
      {
        "id": "comeing",
        "text": "comeing"
      },
      {
        "id": "coming",
        "text": "coming"
      },
      {
        "id": "comingg",
        "text": "comingg"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "coming"
    },
    "explanation": "The word 'come' ends in a silent 'e', so you drop the 'e' before adding -ing: come becomes coming, with a single 'm'. Keeping the 'e' (comeing) or doubling the 'm' (comming) are common mistakes.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding -ing (drop e)",
      "skill": "Adding '-ing' to 'come' by dropping the silent 'e'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "morphology",
        "-ing",
        "drop e"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dc-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Long vowel digraph 'ee'",
      "skill": "Spelling the long /ee/ sound with the 'ee' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "vowel digraph"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "sheep"
      },
      {
        "id": "b",
        "text": "sheap"
      },
      {
        "id": "c",
        "text": "sheip"
      },
      {
        "id": "d",
        "text": "shepe"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "The long /ee/ sound in this farm-animal word is made by the letters 'ee', so it is 'sheep'. 'sheap' uses the 'ea' team, and 'sheip' and 'shepe' are not real spellings."
  },
  {
    "id": "icas-y3-spelling-dc-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Long vowel digraph 'oo'",
      "skill": "Spelling the long /oo/ sound with the 'oo' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "vowel digraph"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "spune"
      },
      {
        "id": "b",
        "text": "spoon"
      },
      {
        "id": "c",
        "text": "spoun"
      },
      {
        "id": "d",
        "text": "spuun"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "The long /oo/ sound in the word for the thing you eat soup with is spelled 'oo': 'spoon'. Sound out each letter team; 'spune', 'spoun' and 'spuun' do not spell this word."
  },
  {
    "id": "icas-y3-spelling-dc-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "'ir' vowel sound",
      "skill": "Spelling the /er/ sound with the 'ir' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "r-controlled vowel"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "berd"
      },
      {
        "id": "b",
        "text": "burd"
      },
      {
        "id": "c",
        "text": "bird"
      },
      {
        "id": "d",
        "text": "birde"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "c"
    },
    "explanation": "The /er/ sound in this word for an animal with feathers is spelled with 'ir': 'bird'. 'berd' uses 'er', 'burd' uses 'ur', and 'birde' adds a letter that does not belong."
  },
  {
    "id": "icas-y3-spelling-dc-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "'ar' vowel sound",
      "skill": "Spelling the /ar/ sound with the 'ar' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "r-controlled vowel"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "ferm"
      },
      {
        "id": "b",
        "text": "faam"
      },
      {
        "id": "c",
        "text": "farme"
      },
      {
        "id": "d",
        "text": "farm"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "The /ar/ sound in the word for a place where crops and animals are raised is spelled 'ar': 'farm'. 'ferm' and 'faam' spell the vowel wrongly, and 'farme' has an extra 'e' on the end."
  },
  {
    "id": "icas-y3-spelling-dc-005",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'The pie was ___ hot to eat.'",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Homophones too/to/tow",
      "skill": "Choosing between the homophones 'too', 'to' and 'tow'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 30,
      "tags": [
        "spelling",
        "homophone"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "b1",
          "label": "missing word",
          "options": [
            {
              "id": "to",
              "text": "to"
            },
            {
              "id": "too",
              "text": "too"
            },
            {
              "id": "tow",
              "text": "tow"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "b1",
          "correctOptionId": "too"
        }
      ]
    },
    "explanation": "Here the word means 'more than you want' (very), which is spelled 'too' with two o's. 'to' shows direction or goes before a verb, and 'tow' means to pull something along."
  },
  {
    "id": "icas-y3-spelling-dc-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "'ou' vowel sound",
      "skill": "Spelling the /ow/ sound with the 'ou' letter team",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "vowel digraph"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "b",
        "text": "shout"
      },
      {
        "id": "a",
        "text": "showt"
      },
      {
        "id": "c",
        "text": "shoute"
      },
      {
        "id": "d",
        "text": "shaut"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "The /ow/ sound in this word meaning to call out loudly is spelled with 'ou': 'shout'. 'showt' uses 'ow', 'shoute' adds a silent 'e', and 'shaut' spells the vowel wrongly."
  },
  {
    "id": "icas-y3-spelling-dc-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "'or' vowel sound",
      "skill": "Spelling the /or/ sound with the 'or' letter team",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "r-controlled vowel"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "b",
        "text": "stawm"
      },
      {
        "id": "a",
        "text": "storm"
      },
      {
        "id": "c",
        "text": "storme"
      },
      {
        "id": "d",
        "text": "stoarm"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "The /or/ sound in this word for wild, windy weather is spelled 'or': 'storm'. 'stawm' spells the vowel wrongly, 'storme' adds an extra 'e', and 'stoarm' adds an 'a' that does not belong."
  },
  {
    "id": "icas-y3-spelling-dc-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters",
      "skill": "Spelling words that begin with a silent 'w' before 'r'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "phonics",
        "silent letters"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "rist"
      },
      {
        "id": "b",
        "text": "wriste"
      },
      {
        "id": "d",
        "text": "wrist"
      },
      {
        "id": "c",
        "text": "rhist"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "This word for the joint between your hand and arm begins with a silent 'w' before the 'r': 'wrist'. 'rist' drops the silent 'w', 'wriste' adds an extra 'e', and 'rhist' adds an 'h' that does not belong."
  },
  {
    "id": "icas-y3-spelling-dc-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is the correct plural of 'baby' (more than one baby)?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals: y to ies",
      "skill": "Making plurals by changing 'y' to 'ies' (baby to babies)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "morphology",
        "plurals"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "babys"
      },
      {
        "id": "b",
        "text": "babyes"
      },
      {
        "id": "d",
        "text": "babbies"
      },
      {
        "id": "c",
        "text": "babies"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "c"
    },
    "explanation": "When a word ends in a consonant plus 'y', you change the 'y' to 'i' and add 'es': baby becomes 'babies'. 'babys' just adds 's', 'babyes' keeps the 'y', and 'babbies' doubles the 'b' by mistake."
  },
  {
    "id": "icas-y3-spelling-dc-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding -ed",
      "skill": "Adding '-ed' to 'smile' by dropping the silent 'e'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "morphology",
        "suffix -ed"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "smiled"
      },
      {
        "id": "b",
        "text": "smilled"
      },
      {
        "id": "c",
        "text": "smild"
      },
      {
        "id": "d",
        "text": "smyled"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "To add '-ed' to 'smile' you drop the silent 'e' and add 'ed': 'smiled'. 'smilled' wrongly doubles the 'l', 'smild' drops too many letters, and 'smyled' swaps the 'i' for a 'y'."
  },
  {
    "id": "icas-y3-spelling-dc-011",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add the ending '-ly' to the word 'quick' to complete the sentence. Write the whole new word.",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffix -ly",
      "skill": "Adding the suffix '-ly' to a base word (quick to quickly)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "morphology",
        "suffix -ly"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "instructions": "Type the one word that fits the blank.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "The cheetah can run very ",
        " across the plain."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "quick + ly"
        }
      ]
    },
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "quickly"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "Adding '-ly' to 'quick' simply joins the ending on: quick + ly = 'quickly'. You do not drop or double any letters because 'quick' does not end in 'y' or a silent 'e'."
  },
  {
    "id": "icas-y3-spelling-dc-012",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'He ___ the running race on sports day.'",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Homophones won/one",
      "skill": "Choosing between the homophones 'won' and 'one'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 35,
      "tags": [
        "spelling",
        "homophone"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "b1",
          "label": "missing word",
          "options": [
            {
              "id": "one",
              "text": "one"
            },
            {
              "id": "won",
              "text": "won"
            },
            {
              "id": "wun",
              "text": "wun"
            }
          ]
        }
      ]
    },
    "answerKey": {
      "kind": "dropdown",
      "fields": [
        {
          "id": "b1",
          "correctOptionId": "won"
        }
      ]
    },
    "explanation": "The sentence needs the past tense of 'win', which is 'won'. 'one' is the number 1, and 'wun' is not a real word even though it sounds the same."
  },
  {
    "id": "icas-y3-spelling-dc-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Doubling before -ed",
      "skill": "Doubling the final consonant before adding '-ed' (stop to stopped)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "morphology",
        "suffix -ed"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "stoped"
      },
      {
        "id": "d",
        "text": "stopped"
      },
      {
        "id": "b",
        "text": "stopedd"
      },
      {
        "id": "c",
        "text": "stoppd"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "'stop' has one short vowel and one final consonant, so you double the 'p' before adding 'ed': 'stopped'. 'stoped' forgets to double, 'stopedd' doubles the wrong letter, and 'stoppd' drops the 'e'."
  },
  {
    "id": "icas-y3-spelling-dc-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Comparative -er",
      "skill": "Doubling the final consonant before adding '-er' (big to bigger)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "morphology",
        "comparative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "a",
        "text": "biger"
      },
      {
        "id": "c",
        "text": "bigerr"
      },
      {
        "id": "b",
        "text": "bigger"
      },
      {
        "id": "d",
        "text": "biggerr"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "'big' has one short vowel and one final consonant, so you double the 'g' before adding 'er': 'bigger'. 'biger' forgets to double, while 'bigerr' and 'biggerr' double the wrong letter or add too many."
  },
  {
    "id": "icas-y3-spelling-dc-015",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add the prefix 'un-' to the word 'happy' to make a word that means 'not happy'. Write the whole new word.",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Prefix un-",
      "skill": "Adding the prefix 'un-' to a base word (happy to unhappy)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "spelling",
        "morphology",
        "prefix un-"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "instructions": "Type the one word that fits the blank.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "Losing his hat made the boy feel ",
        "."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "un + happy"
        }
      ]
    },
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "b1",
          "acceptedAnswers": [
            "unhappy"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "A prefix is added to the front of a word without changing its spelling: un + happy = 'unhappy'. The prefix 'un-' flips the meaning to 'not happy'."
  },
  {
    "id": "icas-y3-spelling-dc-016",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which TWO words are spelled correctly?",
    "visuals": [],
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Common tricky words",
      "skill": "Recognising correctly spelled common words",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "common words"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "d",
        "text": "wich"
      },
      {
        "id": "a",
        "text": "because"
      },
      {
        "id": "b",
        "text": "freind"
      },
      {
        "id": "c",
        "text": "school"
      }
    ],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "a",
        "c"
      ]
    },
    "explanation": "'because' and 'school' are both spelled correctly. 'freind' has the 'i' and 'e' the wrong way round (it should be 'friend'), and 'wich' is missing the 'h' (it should be 'which')."
  },
  {
    "id": "icas-y3-spelling-dd-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One of these words is spelled correctly. Which one is it?",
    "options": [
      {
        "id": "o2",
        "text": "bright"
      },
      {
        "id": "o1",
        "text": "briet"
      },
      {
        "id": "o3",
        "text": "brite"
      },
      {
        "id": "o4",
        "text": "brihgt"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o2"
    },
    "explanation": "The long /i/ sound at the end of this word is spelled with the letters 'igh', as in 'night' and 'high'. Say the word slowly: b-r-igh-t. That gives 'bright'. 'Brite' and 'briet' miss the 'gh', and 'brihgt' puts the letters in the wrong order.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Long vowel sounds",
      "skill": "Spelling the long /i/ sound with the 'igh' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "igh",
        "long i",
        "phonics"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which spelling of this fruit word is correct?",
    "options": [
      {
        "id": "o1",
        "text": "graip"
      },
      {
        "id": "o3",
        "text": "grape"
      },
      {
        "id": "o2",
        "text": "grayp"
      },
      {
        "id": "o4",
        "text": "grap"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o3"
    },
    "explanation": "This word uses a split digraph: an 'a' and a silent 'e' with a consonant in between (a_e) make the long /a/ sound, as in 'cake' and 'plane'. So it is g-r-a-p-e, 'grape'. 'Graip' and 'grayp' use the wrong letter team, and 'grap' has no silent 'e' so it would rhyme with 'cap'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Long vowel sounds",
      "skill": "Spelling the long /a/ sound with the split digraph a-e",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "split digraph",
        "magic e",
        "long a"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correctly spelled word that means to rub with your nails.",
    "options": [
      {
        "id": "o2",
        "text": "scrach"
      },
      {
        "id": "o3",
        "text": "scratsh"
      },
      {
        "id": "o1",
        "text": "scratch"
      },
      {
        "id": "o4",
        "text": "scrattch"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o1"
    },
    "explanation": "When the /ch/ sound comes straight after a short vowel in a one-syllable word, it is usually spelled 'tch', as in 'catch' and 'match'. So it is s-c-r-a-tch, 'scratch'. 'Scrach' drops the 't', 'scratsh' uses 'sh' by mistake, and 'scrattch' doubles the 't' when it should not.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Consonant digraphs",
      "skill": "Spelling the /ch/ sound with 'tch' after a short vowel",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "tch",
        "digraph",
        "short vowel"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'Grandad chopped some ___ for the campfire.'",
    "options": [
      {
        "id": "o1",
        "text": "would"
      },
      {
        "id": "o2",
        "text": "wodd"
      },
      {
        "id": "o4",
        "text": "wud"
      },
      {
        "id": "o3",
        "text": "wood"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o3"
    },
    "explanation": "'Wood' and 'would' sound the same but mean different things. 'Wood' is the hard material that comes from trees, and that is what you burn on a campfire. 'Would' is a helping word, as in 'I would like a drink'. 'Wodd' and 'wud' are not real words.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Word meaning and spelling",
      "skill": "Choosing between the homophones 'wood' and 'would'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "homophone",
        "wood",
        "would"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is the correct spelling of more than one dress?",
    "options": [
      {
        "id": "o2",
        "text": "dresses"
      },
      {
        "id": "o1",
        "text": "dreses"
      },
      {
        "id": "o3",
        "text": "dresss"
      },
      {
        "id": "o4",
        "text": "dress's"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o2"
    },
    "explanation": "When a word already ends in 'ss', you add '-es' to make it mean more than one: dress + es = 'dresses'. 'Dreses' has only one 's' in the middle, 'dresss' just piles up three s letters, and 'dress's' uses an apostrophe, which shows belonging, not more than one.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals",
      "skill": "Making plurals by adding '-es' to words ending in 'ss'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "plural",
        "-es",
        "ss ending"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is the correct spelling of more than one tomato?",
    "options": [
      {
        "id": "o1",
        "text": "tomatos"
      },
      {
        "id": "o2",
        "text": "tomatoes"
      },
      {
        "id": "o3",
        "text": "tomatoe"
      },
      {
        "id": "o4",
        "text": "tomatoies"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o2"
    },
    "explanation": "Some words that end in 'o' add '-es' to mean more than one, as in 'potatoes' and 'heroes'. So tomato + es = 'tomatoes'. 'Tomatos' only adds '-s', 'tomatoe' is just one tomato with a spare 'e', and 'tomatoies' wrongly changes the 'o' as if the word ended in 'y'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals",
      "skill": "Making plurals by adding '-es' to words ending in 'o'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "plural",
        "-oes",
        "tomato"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct spelling of the word for the short, thick finger on your hand.",
    "options": [
      {
        "id": "o1",
        "text": "thumbe"
      },
      {
        "id": "o2",
        "text": "thum"
      },
      {
        "id": "o4",
        "text": "thumb"
      },
      {
        "id": "o3",
        "text": "thumm"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o4"
    },
    "explanation": "This word has a silent 'b' at the end that you write but do not say, just like 'lamb' and 'climb'. So it is t-h-u-m-b, 'thumb'. 'Thum' and 'thumm' leave the silent 'b' out, and 'thumbe' adds an 'e' that does not belong.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters",
      "skill": "Spelling words with a silent 'b' after 'm'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "silent letter",
        "silent b",
        "thumb"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "options": [
      {
        "id": "o2",
        "text": "cassle"
      },
      {
        "id": "o3",
        "text": "casle"
      },
      {
        "id": "o4",
        "text": "castel"
      },
      {
        "id": "o1",
        "text": "castle"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o1"
    },
    "explanation": "This word has a silent 't' that you write but do not say, the same as in 'listen' and 'whistle'. So it is c-a-s-t-l-e, 'castle'. 'Cassle' swaps the silent 't' for an extra 's', 'casle' leaves the 't' out completely, and 'castel' swaps the last two letters around.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters",
      "skill": "Spelling words with a silent 't' (castle)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "silent letter",
        "silent t",
        "castle"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct spelling of the word for what you do when you are sleepy and open your mouth wide.",
    "options": [
      {
        "id": "o3",
        "text": "yawn"
      },
      {
        "id": "o1",
        "text": "yorn"
      },
      {
        "id": "o2",
        "text": "yawin"
      },
      {
        "id": "o4",
        "text": "yaun"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o3"
    },
    "explanation": "The /aw/ sound in the middle of this word is spelled with the letters 'aw', as in 'claw' and 'draw'. So it is y-aw-n, 'yawn'. 'Yorn' uses 'or', 'yaun' uses 'au', and 'yawin' adds an extra 'i' that is not needed.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Vowel digraphs",
      "skill": "Spelling the /aw/ sound with the 'aw' letter team",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "aw",
        "vowel digraph",
        "yawn"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "options": [
      {
        "id": "o1",
        "text": "enjoi"
      },
      {
        "id": "o4",
        "text": "enjoy"
      },
      {
        "id": "o2",
        "text": "enjoiy"
      },
      {
        "id": "o3",
        "text": "enjoyy"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o4"
    },
    "explanation": "The /oy/ sound at the end of a word is usually spelled 'oy', as in 'toy' and 'boy'. So it is en-j-oy, 'enjoy'. The 'oi' team ('coin', 'soil') is used in the middle of words, not the end, so 'enjoi' and 'enjoiy' are wrong, and 'enjoyy' doubles the 'y' for no reason.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Vowel digraphs",
      "skill": "Spelling the /oy/ sound with 'oy' at the end of a word",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "spelling",
        "oy",
        "vowel digraph",
        "enjoy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word to complete the sentence: 'Dad took the bike to the shop to ___ the flat tyre.'",
    "options": [
      {
        "id": "o1",
        "text": "repare"
      },
      {
        "id": "o3",
        "text": "repar"
      },
      {
        "id": "o2",
        "text": "repair"
      },
      {
        "id": "o4",
        "text": "repaire"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o2"
    },
    "explanation": "The /air/ sound in this word is spelled with the letters 'air', as in 'hair', 'chair' and 'stairs'. So it is re-p-air, 'repair'. 'Repare' and 'repaire' use the wrong letter team, and 'repar' misses the 'i' altogether.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Vowel digraphs",
      "skill": "Spelling the /air/ sound with the 'air' letter team",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "air",
        "vowel digraph",
        "repair"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "options": [
      {
        "id": "o2",
        "text": "darknes"
      },
      {
        "id": "o3",
        "text": "darknass"
      },
      {
        "id": "o4",
        "text": "darkeness"
      },
      {
        "id": "o1",
        "text": "darkness"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o1"
    },
    "explanation": "To turn 'dark' into a naming word, you add the suffix '-ness', which is spelled n-e-s-s. So dark + ness = 'darkness'. 'Darknes' has only one 's', 'darknass' spells the suffix with an 'a', and 'darkeness' adds an extra 'e' that does not belong.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Adding the suffix '-ness' to a base word",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "suffix",
        "-ness",
        "darkness"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct spelling of the word that means having no hope.",
    "options": [
      {
        "id": "o4",
        "text": "hopeless"
      },
      {
        "id": "o1",
        "text": "hopless"
      },
      {
        "id": "o2",
        "text": "hopeles"
      },
      {
        "id": "o3",
        "text": "hoppeless"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o4"
    },
    "explanation": "The suffix '-less' means 'without' and is spelled l-e-s-s. It joins to the whole base word 'hope', so hope + less = 'hopeless'. 'Hopless' drops the 'e' from 'hope', 'hopeles' has only one 's' in the suffix, and 'hoppeless' wrongly doubles the 'p'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Adding the suffix '-less' to a base word",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "suffix",
        "-less",
        "hopeless"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word is spelled correctly?",
    "options": [
      {
        "id": "o1",
        "text": "dolfin"
      },
      {
        "id": "o3",
        "text": "dolphin"
      },
      {
        "id": "o2",
        "text": "dolphen"
      },
      {
        "id": "o4",
        "text": "dollphin"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o3"
    },
    "explanation": "In this word the /f/ sound is spelled with the letters 'ph', as in 'phone' and 'elephant'. So it is d-o-l-ph-in, 'dolphin'. 'Dolfin' uses a plain 'f', 'dolphen' spells the last part with 'en', and 'dollphin' wrongly doubles the 'l'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Phonological",
      "topic": "Consonant digraphs",
      "skill": "Spelling the /f/ sound with 'ph'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "ph",
        "digraph",
        "dolphin"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One word in this sentence is spelled incorrectly. Which word is it? 'On Saturday we visited the libary to borrow some books.'",
    "options": [
      {
        "id": "o2",
        "text": "Saturday"
      },
      {
        "id": "o3",
        "text": "visited"
      },
      {
        "id": "o1",
        "text": "libary"
      },
      {
        "id": "o4",
        "text": "borrow"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o1"
    },
    "explanation": "The place where you borrow books is a 'library', spelled l-i-b-r-a-r-y, with an 'r' in the middle and an 'r' near the end. Many people say it as 'libary' and forget the first 'r'. 'Saturday', 'visited' and 'borrow' are all spelled correctly.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Identifying misspelled words",
      "skill": "Finding the misspelled word (library) in a sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "spelling",
        "proofreading",
        "library",
        "error spotting"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-dd-016",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which TWO words are spelled correctly?",
    "options": [
      {
        "id": "o4",
        "text": "freind"
      },
      {
        "id": "o1",
        "text": "because"
      },
      {
        "id": "o2",
        "text": "yesterdy"
      },
      {
        "id": "o3",
        "text": "tomorrow"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "o1",
        "o3"
      ]
    },
    "explanation": "'Because' is spelled b-e-c-a-u-s-e, and 'tomorrow' is spelled with one 'm' and two 'r' letters (t-o-m-o-r-r-o-w). 'Yesterdy' is wrong because it is missing an 'a' ('yesterday'), and 'freind' is wrong because the 'i' and 'e' are swapped ('friend').",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Common tricky words",
      "skill": "Recognising correctly spelled common words",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "spelling",
        "tricky words",
        "high frequency",
        "multiple select"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read the sentence: 'The soup was ___ salty for Mia to finish.' Which word correctly fills the gap?",
    "options": [
      {
        "id": "too",
        "text": "too"
      },
      {
        "id": "to",
        "text": "to"
      },
      {
        "id": "two",
        "text": "two"
      },
      {
        "id": "tou",
        "text": "tou"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "too"
    },
    "explanation": "When a word means 'more than enough' or 'also', use 'too' with the extra o. Here the soup had more salt than Mia wanted, so 'too' fits. 'To' shows direction, 'two' is the number 2, and 'tou' is not a real word.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (to / too / two)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "homophones",
        "to too two",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "One of these is the correct spelling of the body part between your upper and lower leg. Which one is right?",
    "options": [
      {
        "id": "kne",
        "text": "kne"
      },
      {
        "id": "knee",
        "text": "knee"
      },
      {
        "id": "knea",
        "text": "knea"
      },
      {
        "id": "nee",
        "text": "nee"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "knee"
    },
    "explanation": "This word begins with a silent 'k' and ends in a double 'e': knee. The k is written but not heard. 'Nee' drops the silent k, and 'kne' and 'knea' spell the ending sound wrongly.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters",
      "skill": "Spelling words with a silent k",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "silent letters",
        "silent k",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add -ing to the word 'run' to complete the sentence: 'The puppy kept ___ around the yard.' Which spelling is correct?",
    "options": [
      {
        "id": "runing",
        "text": "runing"
      },
      {
        "id": "runnning",
        "text": "runnning"
      },
      {
        "id": "running",
        "text": "running"
      },
      {
        "id": "runeing",
        "text": "runeing"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "running"
    },
    "explanation": "'Run' is a short word ending in one vowel then one consonant, so you double the final n before adding -ing: running. 'Runing' forgets to double, 'runnning' doubles too much, and 'runeing' adds an extra e that does not belong.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding suffixes",
      "skill": "Doubling the final consonant before -ing",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "doubling consonant",
        "-ing",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is the correct way to write 'baby' when there is more than one?",
    "options": [
      {
        "id": "babys",
        "text": "babys"
      },
      {
        "id": "babbies",
        "text": "babbies"
      },
      {
        "id": "babyes",
        "text": "babyes"
      },
      {
        "id": "babies",
        "text": "babies"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "babies"
    },
    "explanation": "When a word ends in a consonant followed by y, change the y to i and add -es: baby becomes babies. 'Babys' just adds s, 'babbies' wrongly doubles the b, and 'babyes' keeps the y and adds es.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals",
      "skill": "Changing -y to -ies for plurals",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plurals",
        "y to ies",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which spelling of the word meaning 'something you do' is correct?",
    "options": [
      {
        "id": "action",
        "text": "action"
      },
      {
        "id": "acshun",
        "text": "acshun"
      },
      {
        "id": "actshun",
        "text": "actshun"
      },
      {
        "id": "akction",
        "text": "akction"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "action"
    },
    "explanation": "The 'shun' sound at the end of many words is spelled -tion: action. The other choices try to write the sound the way it is spoken ('acshun', 'actshun') or add a stray k ('akction'), which are not how English spells this ending.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Spelling the -tion suffix",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "suffix",
        "-tion",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct spelling of the word that means 'in a fast way'.",
    "options": [
      {
        "id": "quicly",
        "text": "quicly"
      },
      {
        "id": "quickly",
        "text": "quickly"
      },
      {
        "id": "quikly",
        "text": "quikly"
      },
      {
        "id": "quickley",
        "text": "quickley"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "quickly"
    },
    "explanation": "Take the whole word 'quick' and add the suffix -ly to make quickly. Because 'quick' does not change, you keep the ck. 'Quicly' and 'quikly' lose letters from quick, and 'quickley' adds an extra e that is not needed.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Adding the -ly suffix",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "suffix",
        "-ly",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which spelling of the word meaning 'full of help' is correct?",
    "options": [
      {
        "id": "helpfull",
        "text": "helpfull"
      },
      {
        "id": "helpfil",
        "text": "helpfil"
      },
      {
        "id": "helpful",
        "text": "helpful"
      },
      {
        "id": "hepful",
        "text": "hepful"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "helpful"
    },
    "explanation": "The suffix -ful (meaning 'full of') is always written with just one l, even though the word 'full' has two: helpful. 'Helpfull' keeps both l's, 'helpfil' spells the suffix wrongly, and 'hepful' drops the l from help.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Adding the -ful suffix",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "suffix",
        "-ful",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which spelling of the joining word in 'I stayed inside ___ it was raining' is correct?",
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
        "id": "becose",
        "text": "becose"
      },
      {
        "id": "because",
        "text": "because"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "because"
    },
    "explanation": "A helpful trick for this tricky word is the middle: be-CAUSE, because it contains the smaller word 'cause'. So the correct order is b-e-c-a-u-s-e. The distractors swap the a and u ('becuase') or lose letters from 'cause'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Common misspellings",
      "skill": "Spelling frequently misspelled words",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "tricky words",
        "because",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read the sentence: 'Come and sit ___ next to me.' Which word correctly fills the gap?",
    "options": [
      {
        "id": "here",
        "text": "here"
      },
      {
        "id": "hear",
        "text": "hear"
      },
      {
        "id": "heere",
        "text": "heere"
      },
      {
        "id": "heer",
        "text": "heer"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "here"
    },
    "explanation": "'Here' means 'this place' and it hides the word 'here' inside 'there' and 'where', which are also about place. 'Hear' is what you do with your ears, and 'heere' and 'heer' are just misspellings.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (hear / here)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "homophones",
        "hear here",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Three of these words are spelled correctly. Which ONE is spelled incorrectly?",
    "options": [
      {
        "id": "wrap",
        "text": "wrap"
      },
      {
        "id": "lam",
        "text": "lam"
      },
      {
        "id": "comb",
        "text": "comb"
      },
      {
        "id": "thumb",
        "text": "thumb"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "lam"
    },
    "explanation": "The word for a baby sheep needs a silent b at the end: lamb, not 'lam'. The others already have their silent letters in place: the silent w in 'wrap' and the silent b in 'comb' and 'thumb'.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Silent letters",
      "skill": "Identifying missing silent letters",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "silent letters",
        "error correction",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add -ed to 'stop' to complete: 'The bus ___ at the corner.' Which spelling is correct?",
    "options": [
      {
        "id": "stoped",
        "text": "stoped"
      },
      {
        "id": "stopt",
        "text": "stopt"
      },
      {
        "id": "stopped",
        "text": "stopped"
      },
      {
        "id": "stoppped",
        "text": "stoppped"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "stopped"
    },
    "explanation": "'Stop' ends in one vowel then one consonant, so double the p before adding -ed: stopped. 'Stoped' forgets to double, 'stopt' spells the -ed sound the way it is heard, and 'stoppped' adds one p too many.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding suffixes",
      "skill": "Doubling the final consonant before -ed",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "doubling consonant",
        "-ed",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Select ALL of the plural words below that are spelled correctly.",
    "options": [
      {
        "id": "cities",
        "text": "cities"
      },
      {
        "id": "citys",
        "text": "citys"
      },
      {
        "id": "stories",
        "text": "stories"
      },
      {
        "id": "storys",
        "text": "storys"
      },
      {
        "id": "ponies",
        "text": "ponies"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "cities",
        "stories",
        "ponies"
      ]
    },
    "explanation": "Each of these singular words (city, story, pony) ends in a consonant plus y, so the rule is to change the y to i and add -es: cities, stories, ponies. 'Citys' and 'storys' break the rule by keeping the y and just adding s.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Plurals",
      "skill": "Applying the -y to -ies plural rule",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "plurals",
        "y to ies",
        "multiple select",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read the sentence: '___ are six eggs left in the carton.' Which word correctly fills the gap?",
    "options": [
      {
        "id": "their",
        "text": "their"
      },
      {
        "id": "they-re",
        "text": "they're"
      },
      {
        "id": "theyr",
        "text": "theyr"
      },
      {
        "id": "there",
        "text": "there"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "there"
    },
    "explanation": "'There' points to something existing or a place, and you can spot the word 'here' inside it. 'Their' shows belonging (their eggs), 'they're' is short for 'they are', and 'theyr' is not a word.",
    "metadata": {
      "subject": "spelling",
      "strand": "Visual",
      "topic": "Homophones",
      "skill": "Choosing the correct homophone (their / there / they're)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "homophones",
        "their there theyre",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which spelling of the place where trains stop is correct?",
    "options": [
      {
        "id": "station",
        "text": "station"
      },
      {
        "id": "stashun",
        "text": "stashun"
      },
      {
        "id": "staytion",
        "text": "staytion"
      },
      {
        "id": "stationn",
        "text": "stationn"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "station"
    },
    "explanation": "The ending 'shun' sound is spelled -tion, giving station. 'Stashun' writes the sound as we say it, 'staytion' adds a stray y, and 'stationn' repeats the final n.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Suffixes",
      "skill": "Spelling the -tion suffix",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "suffix",
        "-tion",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-spelling-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add -ing to 'swim' to complete: 'The ducks are ___ across the pond.' Which spelling is correct?",
    "options": [
      {
        "id": "swiming",
        "text": "swiming"
      },
      {
        "id": "swimming",
        "text": "swimming"
      },
      {
        "id": "swimmming",
        "text": "swimmming"
      },
      {
        "id": "swimeing",
        "text": "swimeing"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "swimming"
    },
    "explanation": "'Swim' ends in one vowel then one consonant, so you double the m before -ing: swimming. 'Swiming' forgets to double, 'swimmming' adds too many m's, and 'swimeing' slips in an extra e.",
    "metadata": {
      "subject": "spelling",
      "strand": "Morphological",
      "topic": "Adding suffixes",
      "skill": "Doubling the final consonant before -ing",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "doubling consonant",
        "-ing",
        "year 3 spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
