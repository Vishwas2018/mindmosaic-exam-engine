import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 ICAS-style English â€” 6 original questions with a reasoning
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
      { id: "guide-others", text: "So other ants can follow the trail to the food" },
      { id: "mark-territory", text: "To warn other insects to stay away" },
      { id: "find-way-back", text: "So they do not get lost themselves" },
      { id: "keep-clean", text: "To keep the footpath clean" },
    ],
    answerKey: { kind: "single_option", optionId: "guide-others" },
    explanation:
      "The text says other ants touch the trail with their feelers and follow it straight to the food. The trail's purpose is to guide the other ants.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
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
      { id: "bone", text: "bone" },
      { id: "dog", text: "dog" },
      { id: "kennel", text: "kennel" },
      { id: "bark", text: "bark" },
    ],
    answerKey: { kind: "single_option", optionId: "dog" },
    explanation:
      "A kitten is a baby cat, so the pattern is 'baby animal to grown animal'. A puppy is a baby dog, which makes 'dog' the word that completes the pattern.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
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
  {
    id: "icas-y3-read-information-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "When do the Bogong moths do their flying on the journey south?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "Night Travellers",
      body: "Where they begin\n\nBogong moths hatch on the flat farming plains of inland Australia. A moth is small and brown, about as wide as your thumbnail.\n\nThe long flight\n\nWhen the weather warms in spring, the moths head south to the cool mountains. Some fly more than a thousand kilometres. They travel at night and rest in dark corners during the day.\n\nA cool summer bed\n\nHigh in the mountains the moths squeeze into rocky caves. Thousands press together on the cave walls, overlapping like tiles on a roof. There they doze through the hottest months, using hardly any energy. When autumn arrives they wake, fly back to the plains, lay their eggs and die.\n\nScientists have studied these moths for many years, but nobody is certain how such a tiny insect finds the same caves every single year.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "at-night", text: "At night" },
      { id: "during-the-day", text: "During the day" },
      { id: "only-in-autumn", text: "Only in autumn" },
      { id: "only-when-it-rains", text: "Only when it rains" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "at-night",
    },
    explanation: "Hunt for the word 'travel' in the section called 'The long flight'. It says the moths 'travel at night and rest in dark corners during the day'. Daytime is when they rest, not fly. Autumn is when they go back to the plains, and rain is never mentioned at all. When a question asks WHEN, look for a time word in the text rather than choosing what sounds likely.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Insect migration",
      skill: "Finding information stated directly in a text",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["information text", "bogong moth", "locating detail"],
    },
  },
  {
    id: "icas-y3-read-information-002",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sam wants to find out where the moths spend the hottest months. Which heading should he read under?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "Night Travellers",
      body: "Where they begin\n\nBogong moths hatch on the flat farming plains of inland Australia. A moth is small and brown, about as wide as your thumbnail.\n\nThe long flight\n\nWhen the weather warms in spring, the moths head south to the cool mountains. Some fly more than a thousand kilometres. They travel at night and rest in dark corners during the day.\n\nA cool summer bed\n\nHigh in the mountains the moths squeeze into rocky caves. Thousands press together on the cave walls, overlapping like tiles on a roof. There they doze through the hottest months, using hardly any energy. When autumn arrives they wake, fly back to the plains, lay their eggs and die.\n\nScientists have studied these moths for many years, but nobody is certain how such a tiny insect finds the same caves every single year.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "where-they-begin", text: "Where they begin" },
      { id: "a-cool-summer-bed", text: "A cool summer bed" },
      { id: "the-long-flight", text: "The long flight" },
      { id: "night-travellers", text: "Night Travellers" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "a-cool-summer-bed",
    },
    explanation: "Headings are signposts: read each one and ask what its section is about. 'Where they begin' is about hatching on the plains, and 'The long flight' is about the journey. 'A cool summer bed' uses the words 'summer' and 'bed', which point straight to where the moths stay through the hot months. 'Night Travellers' is the title of the whole text, not a heading for one part.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Insect migration",
      skill: "Using headings to find the right part of a text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["information text", "headings", "text navigation"],
    },
  },
  {
    id: "icas-y3-read-information-003",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence best gives the main idea of the whole text?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "Night Travellers",
      body: "Where they begin\n\nBogong moths hatch on the flat farming plains of inland Australia. A moth is small and brown, about as wide as your thumbnail.\n\nThe long flight\n\nWhen the weather warms in spring, the moths head south to the cool mountains. Some fly more than a thousand kilometres. They travel at night and rest in dark corners during the day.\n\nA cool summer bed\n\nHigh in the mountains the moths squeeze into rocky caves. Thousands press together on the cave walls, overlapping like tiles on a roof. There they doze through the hottest months, using hardly any energy. When autumn arrives they wake, fly back to the plains, lay their eggs and die.\n\nScientists have studied these moths for many years, but nobody is certain how such a tiny insect finds the same caves every single year.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "size", text: "Bogong moths are small brown insects about as wide as a thumbnail." },
      { id: "scientists", text: "Scientists have been studying Bogong moths for many years." },
      { id: "journey", text: "Bogong moths make a long journey each year between the inland plains and cool mountain caves." },
      { id: "mountains-cool", text: "The mountains of Australia are cooler than the inland plains." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "journey",
    },
    explanation: "The main idea has to cover the whole text, not one corner of it. Check each choice against every section: the size of a moth appears only in the first section, the scientists appear only in the last line, and the cool mountains are one detail inside the journey. Only the yearly trip out to the caves and back runs through all three sections, so it is the main idea.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Insect migration",
      skill: "Identifying the main idea of a whole text",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["information text", "main idea", "whole-text reading"],
    },
  },
  {
    id: "icas-y3-read-information-004",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The text says a ball of ice is 'flung upwards to freeze once more'. What does 'flung' tell you about how the ice moves?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "When Ice Falls From the Sky",
      body: "Hail is rain that has been frozen inside a storm cloud.\n\nInside a tall storm cloud the air rushes upwards very fast. A raindrop caught in that rushing air is carried high into the freezing top of the cloud, where it turns into a small ball of ice. The ball falls, is coated in more water, and is then flung upwards to freeze once more. Each trip adds another layer of ice, rather like the layers of an onion. When the ball finally grows too heavy for the rising air to hold, it drops to the ground as a hailstone.\n\nMost hailstones are no bigger than a pea. A few grow to the size of a golf ball or larger, and those can dent car roofs and strip the leaves from trees. Farmers watch summer storms closely, because a few minutes of large hail can flatten a whole crop.\n\nIf you ever pick up a hailstone and slice it open, you can count its milky rings and work out how many trips it made inside the cloud.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "floats-gently", text: "It floats gently upwards." },
      { id: "melts-slowly", text: "It melts slowly as it rises." },
      { id: "blown-sideways", text: "It is blown sideways across the sky." },
      { id: "thrown-hard", text: "It is thrown quickly and with force." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "thrown-hard",
    },
    explanation: "Work out a new word from the words around it. The sentence before says the air 'rushes upwards very fast', so the ice is not drifting gently. 'Flung' matches that rushing air: it means thrown hard. Melting is the opposite of what happens up there, where the ice freezes, and the text says the movement is upwards, not sideways.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Weather: hail",
      skill: "Working out the meaning of a word from its context",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["information text", "vocabulary in context", "weather"],
    },
  },
  {
    id: "icas-y3-read-information-005",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows hailstones collected after one storm. Which town's hailstone had made the fewest trips inside the cloud?",
    instructions: "Read the text and study the table, then choose one answer.",
    stimulus: {
      title: "When Ice Falls From the Sky",
      body: "Hail is rain that has been frozen inside a storm cloud.\n\nInside a tall storm cloud the air rushes upwards very fast. A raindrop caught in that rushing air is carried high into the freezing top of the cloud, where it turns into a small ball of ice. The ball falls, is coated in more water, and is then flung upwards to freeze once more. Each trip adds another layer of ice, rather like the layers of an onion. When the ball finally grows too heavy for the rising air to hold, it drops to the ground as a hailstone.\n\nMost hailstones are no bigger than a pea. A few grow to the size of a golf ball or larger, and those can dent car roofs and strip the leaves from trees. Farmers watch summer storms closely, because a few minutes of large hail can flatten a whole crop.\n\nIf you ever pick up a hailstone and slice it open, you can count its milky rings and work out how many trips it made inside the cloud.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "boonya", text: "Boonya" },
      { id: "kerrigan-flat", text: "Kerrigan Flat" },
      { id: "mill-creek", text: "Mill Creek" },
      { id: "tarra-downs", text: "Tarra Downs" },
    ],
    visuals: [
      {
        type: "table",
        title: "Hailstones collected after one summer storm",
        altText: "Table of four towns: Kerrigan Flat 8 mm with 5 layers, Mill Creek 14 mm with 9 layers, Boonya 25 mm with 3 layers, Tarra Downs 40 mm with 6 layers.",
        data: {
          headers: ["Town", "Largest hailstone (mm)", "Layers counted"],
          rows: [
            ["Kerrigan Flat", "8", "5"],
            ["Mill Creek", "14", "9"],
            ["Boonya", "25", "3"],
            ["Tarra Downs", "40", "6"],
          ],
        },
        id: "visual-icas-y3-read-information-005-1",
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "boonya",
    },
    explanation: "This answer needs the text and the table together. The last paragraph explains that each layer, or ring, stands for one trip inside the cloud, so 'fewest trips' means fewest layers. Read down the 'Layers counted' column, not the millimetres column: 5, 9, 3 and 6. The smallest is 3, next to Boonya. Notice that Boonya's hailstone is not the smallest one - at 25 mm it is the second largest - so a child who reads the millimetres column instead picks the wrong town.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Weather: hail",
      skill: "Reading a table alongside a passage",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["information text", "table", "data and text"],
    },
  },
  {
    id: "icas-y3-read-information-006",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did the writer say a hailstone grows 'rather like the layers of an onion'?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "When Ice Falls From the Sky",
      body: "Hail is rain that has been frozen inside a storm cloud.\n\nInside a tall storm cloud the air rushes upwards very fast. A raindrop caught in that rushing air is carried high into the freezing top of the cloud, where it turns into a small ball of ice. The ball falls, is coated in more water, and is then flung upwards to freeze once more. Each trip adds another layer of ice, rather like the layers of an onion. When the ball finally grows too heavy for the rising air to hold, it drops to the ground as a hailstone.\n\nMost hailstones are no bigger than a pea. A few grow to the size of a golf ball or larger, and those can dent car roofs and strip the leaves from trees. Farmers watch summer storms closely, because a few minutes of large hail can flatten a whole crop.\n\nIf you ever pick up a hailstone and slice it open, you can count its milky rings and work out how many trips it made inside the cloud.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "same-size", text: "To show that a hailstone is about the same size as an onion" },
      { id: "picture-layers", text: "To help the reader picture ice building up layer by layer" },
      { id: "more-dangerous", text: "To prove that hail is more dangerous than rain" },
      { id: "farmers-watch", text: "To explain why farmers watch summer storms" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "picture-layers",
    },
    explanation: "When a writer compares something to an everyday object, ask which part of the object is being borrowed. An onion is being used for its layers, not its size, and the very next sentences describe those layers as milky rings you can count. Size is dealt with separately, using a pea and a golf ball, and the damage to crops is a different point further down the text.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Weather: hail",
      skill: "Working out why an author included a comparison",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 95,
      tags: ["information text", "author purpose", "comparison"],
    },
  },
  {
    id: "icas-y3-read-information-007",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is pencil 'lead' really made from?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "How a Pencil Is Made",
      body: "A pencil looks simple, but several steps are needed to make one.\n\nThe wood\n\nMost pencils are made from soft, straight timber. At the factory the timber is cut into flat slats, about as long as a ruler and as thick as your little finger. A machine then cuts eight narrow grooves along each slat.\n\nThe 'lead'\n\nPencil lead is not lead at all. It is graphite, a soft grey mineral, mixed with clay and water. The mixture is squeezed through a small hole to form long thin rods, which are baked in an oven until they are hard. More clay makes a harder, paler pencil; more graphite makes a softer, darker one.\n\nPutting it together\n\nA rod is laid in each groove and a second grooved slat is glued on top, making a wooden sandwich. Once the glue has dried, machines slice the sandwich into separate pencils, shape them round or six-sided, and paint them. Last of all, a metal ring holds a rubber on the end.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "real-lead", text: "The metal called lead" },
      { id: "soft-timber", text: "Soft timber cut into thin rods" },
      { id: "graphite-clay", text: "Graphite mixed with clay and water" },
      { id: "paint-glue", text: "Paint mixed with glue" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "graphite-clay",
    },
    explanation: "The section is headed 'The lead', so start there. Its second sentence says plainly, 'It is graphite, a soft grey mineral, mixed with clay and water.' The first sentence warns you that pencil lead 'is not lead at all', which rules out the metal. Timber, glue and paint all belong to other steps of making the pencil, not to the rod inside it.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "How a pencil is made",
      skill: "Finding information stated directly in a text",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 55,
      tags: ["information text", "locating detail", "how things are made"],
    },
  },
  {
    id: "icas-y3-read-information-008",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "In this text, what is a slat?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "How a Pencil Is Made",
      body: "A pencil looks simple, but several steps are needed to make one.\n\nThe wood\n\nMost pencils are made from soft, straight timber. At the factory the timber is cut into flat slats, about as long as a ruler and as thick as your little finger. A machine then cuts eight narrow grooves along each slat.\n\nThe 'lead'\n\nPencil lead is not lead at all. It is graphite, a soft grey mineral, mixed with clay and water. The mixture is squeezed through a small hole to form long thin rods, which are baked in an oven until they are hard. More clay makes a harder, paler pencil; more graphite makes a softer, darker one.\n\nPutting it together\n\nA rod is laid in each groove and a second grooved slat is glued on top, making a wooden sandwich. Once the glue has dried, machines slice the sandwich into separate pencils, shape them round or six-sided, and paint them. Last of all, a metal ring holds a rubber on the end.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "narrow-groove", text: "A narrow groove cut by a machine" },
      { id: "graphite-rod", text: "A thin grey rod of graphite" },
      { id: "metal-ring", text: "The metal ring at the end of a pencil" },
      { id: "flat-timber", text: "A flat piece of timber" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "flat-timber",
    },
    explanation: "Read the sentence the word sits in: 'the timber is cut into flat slats'. The words right beside it tell you a slat is a piece of the timber, and the next sentence adds that grooves are cut along each slat. So the grooves are made in the slat, they are not the slat. The grey rods and the metal ring are named separately in later steps.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "How a pencil is made",
      skill: "Working out the meaning of a word from its context",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["information text", "vocabulary in context", "factory"],
    },
  },
  {
    id: "icas-y3-read-information-010",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is the main idea of this text?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Forest That Grows in Salt Water",
      body: "Along the muddy edges of many northern Australian rivers grows a strange forest. Its trees stand in salt water twice a day, when the tide creeps in.\n\nBreathing through the mud\n\nMud holds almost no air, so roots buried in it would smother. Instead, many mangroves push thin woody spikes up out of the mud. These spikes work like snorkels, taking in air while the tide is out.\n\nDealing with salt\n\nSalt water would kill most trees. Some mangroves block the salt at their roots. Others let it in and then push it out through their leaves, where it dries into tiny white crystals you can taste with your tongue.\n\nA nursery for fish\n\nThe tangled roots slow the water down and make dark hiding places. Baby fish, crabs and prawns shelter there, safe from bigger fish. Many of the fish caught far out at sea began life among these roots.\n\nMangroves also hold the shoreline together. In a storm their roots grip the mud and stop it washing away, which is why towns behind mangroves often suffer less damage.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "special-ways", text: "Mangroves have special ways of surviving in mud and salt water, and they help other living things." },
      { id: "northern-rivers", text: "Mangrove trees grow along the muddy edges of northern Australian rivers." },
      { id: "baby-fish", text: "Baby fish, crabs and prawns hide among mangrove roots." },
      { id: "salt-kills", text: "Salt water would kill most kinds of trees." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "special-ways",
    },
    explanation: "Count how much of the text each choice covers. Where mangroves grow is only the opening line; baby fish fill one section; salt killing other trees is one sentence. The choice about surviving mud and salt and helping other living things is the only one that gathers up the breathing spikes, the salt, the fish nursery and the shoreline, so it is the main idea.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Mangrove forests",
      skill: "Identifying the main idea of a whole text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 85,
      tags: ["information text", "main idea", "environment"],
    },
  },
  {
    id: "icas-y3-read-information-011",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did the author write this text?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Forest That Grows in Salt Water",
      body: "Along the muddy edges of many northern Australian rivers grows a strange forest. Its trees stand in salt water twice a day, when the tide creeps in.\n\nBreathing through the mud\n\nMud holds almost no air, so roots buried in it would smother. Instead, many mangroves push thin woody spikes up out of the mud. These spikes work like snorkels, taking in air while the tide is out.\n\nDealing with salt\n\nSalt water would kill most trees. Some mangroves block the salt at their roots. Others let it in and then push it out through their leaves, where it dries into tiny white crystals you can taste with your tongue.\n\nA nursery for fish\n\nThe tangled roots slow the water down and make dark hiding places. Baby fish, crabs and prawns shelter there, safe from bigger fish. Many of the fish caught far out at sea began life among these roots.\n\nMangroves also hold the shoreline together. In a storm their roots grip the mud and stop it washing away, which is why towns behind mangroves often suffer less damage.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "tell-story", text: "To tell an exciting story about a fishing trip" },
      { id: "give-facts", text: "To give the reader facts about mangroves and why they are useful" },
      { id: "how-to-grow", text: "To teach the reader how to grow a tree at home" },
      { id: "own-holiday", text: "To describe the writer's own holiday beside a river" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "give-facts",
    },
    explanation: "Look at the shape of the writing before you decide. There are headings, no characters and no 'I', which rules out a story and a holiday recount. There are no steps to follow either, so it is not a how-to. Every paragraph gives facts and then says what the mangrove does for the fish or the shoreline, so the author is informing the reader.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Mangrove forests",
      skill: "Working out the author's purpose for writing",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["information text", "author purpose", "text type"],
    },
  },
  {
    id: "icas-y3-read-information-012",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "According to the text, why does a mangrove need woody spikes above the mud?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Forest That Grows in Salt Water",
      body: "Along the muddy edges of many northern Australian rivers grows a strange forest. Its trees stand in salt water twice a day, when the tide creeps in.\n\nBreathing through the mud\n\nMud holds almost no air, so roots buried in it would smother. Instead, many mangroves push thin woody spikes up out of the mud. These spikes work like snorkels, taking in air while the tide is out.\n\nDealing with salt\n\nSalt water would kill most trees. Some mangroves block the salt at their roots. Others let it in and then push it out through their leaves, where it dries into tiny white crystals you can taste with your tongue.\n\nA nursery for fish\n\nThe tangled roots slow the water down and make dark hiding places. Baby fish, crabs and prawns shelter there, safe from bigger fish. Many of the fish caught far out at sea began life among these roots.\n\nMangroves also hold the shoreline together. In a storm their roots grip the mud and stop it washing away, which is why towns behind mangroves often suffer less damage.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "tide-twice", text: "The tide comes in twice every day." },
      { id: "salt-crystals", text: "Salt dries into white crystals on the leaves." },
      { id: "no-air", text: "There is almost no air down in the mud." },
      { id: "hiding-places", text: "The roots make dark hiding places for baby fish." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "no-air",
    },
    explanation: "A 'why' question needs the cause, so look for the sentence just before the spikes are mentioned: 'Mud holds almost no air, so roots buried in it would smother.' That is the reason the spikes reach up like snorkels. The tide explains when the spikes can breathe rather than why they exist, and the salt crystals and the hiding places belong to the other two sections.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Mangrove forests",
      skill: "Finding a stated reason in an information text",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["information text", "cause and effect", "locating detail"],
    },
  },
  {
    id: "icas-y3-read-information-013",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The text says thousands of tiny channels run between the lizard's scales. What is a channel here?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Lizard That Drinks With Its Skin",
      body: "The thorny devil is a small desert lizard, no longer than your hand. Its whole body is covered in sharp spines, and it walks in a slow, rocking way, as if it cannot decide whether to go on.\n\nThe desert where it lives may see no rain for months. Yet the thorny devil hardly ever drinks from a puddle. Instead, water travels to its mouth along its skin. Between its scales run thousands of tiny channels, each thinner than a hair. When damp sand touches the lizard's feet, or dew settles on its back overnight, water is drawn into these channels and creeps uphill to the corners of its mouth. The lizard then works its jaws to swallow.\n\nIts meals are simple. A thorny devil sits beside a line of ants and flicks them up one at a time. It may eat a thousand ants in a single meal, which sounds enormous until you remember how small an ant is.\n\nThe spines are not for attack. They make the lizard an awkward, prickly mouthful, and a bird that has tried one usually looks for something softer.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "sharp-spine", text: "A sharp spine on the lizard's back" },
      { id: "small-ant", text: "A small ant that the lizard eats" },
      { id: "drop-of-dew", text: "A drop of dew that settles overnight" },
      { id: "narrow-groove", text: "A narrow groove that water can run along" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "narrow-groove",
    },
    explanation: "Use the job the word is doing in the sentence. Water 'is drawn into these channels and creeps uphill', so a channel must be something water can move along, like a tiny groove. Spines, ants and dew are all named separately in the text, and none of them is a path for water; dew is the water itself, not the thing carrying it.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Desert lizard",
      skill: "Working out the meaning of a word from its context",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["information text", "vocabulary in context", "desert animals"],
    },
  },
  {
    id: "icas-y3-read-information-014",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "How does the thorny devil get most of its water?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Lizard That Drinks With Its Skin",
      body: "The thorny devil is a small desert lizard, no longer than your hand. Its whole body is covered in sharp spines, and it walks in a slow, rocking way, as if it cannot decide whether to go on.\n\nThe desert where it lives may see no rain for months. Yet the thorny devil hardly ever drinks from a puddle. Instead, water travels to its mouth along its skin. Between its scales run thousands of tiny channels, each thinner than a hair. When damp sand touches the lizard's feet, or dew settles on its back overnight, water is drawn into these channels and creeps uphill to the corners of its mouth. The lizard then works its jaws to swallow.\n\nIts meals are simple. A thorny devil sits beside a line of ants and flicks them up one at a time. It may eat a thousand ants in a single meal, which sounds enormous until you remember how small an ant is.\n\nThe spines are not for attack. They make the lizard an awkward, prickly mouthful, and a bird that has tried one usually looks for something softer.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "skin-channels", text: "Water moves along tiny channels in its skin to its mouth." },
      { id: "puddles", text: "It drinks from puddles after the desert rain." },
      { id: "from-ants", text: "It gets all its water from the ants it eats." },
      { id: "digs-sand", text: "It digs down into the sand and licks the wet grains." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "skin-channels",
    },
    explanation: "The question asks how, so find the sentence that describes the way it happens: 'water travels to its mouth along its skin'. The text also says the lizard 'hardly ever drinks from a puddle', which rules the puddles out. Ants are described as food, never as a drink, and digging is never mentioned at all - the damp sand simply touches the lizard's feet.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Desert lizard",
      skill: "Finding information stated directly in a text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["information text", "locating detail", "desert animals"],
    },
  },
  {
    id: "icas-y3-read-information-015",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did the writer finish with the paragraph about the spines?",
    instructions: "Read the text, then choose one answer.",
    stimulus: {
      title: "The Lizard That Drinks With Its Skin",
      body: "The thorny devil is a small desert lizard, no longer than your hand. Its whole body is covered in sharp spines, and it walks in a slow, rocking way, as if it cannot decide whether to go on.\n\nThe desert where it lives may see no rain for months. Yet the thorny devil hardly ever drinks from a puddle. Instead, water travels to its mouth along its skin. Between its scales run thousands of tiny channels, each thinner than a hair. When damp sand touches the lizard's feet, or dew settles on its back overnight, water is drawn into these channels and creeps uphill to the corners of its mouth. The lizard then works its jaws to swallow.\n\nIts meals are simple. A thorny devil sits beside a line of ants and flicks them up one at a time. It may eat a thousand ants in a single meal, which sounds enormous until you remember how small an ant is.\n\nThe spines are not for attack. They make the lizard an awkward, prickly mouthful, and a bird that has tried one usually looks for something softer.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "catch-ants", text: "To show how the lizard uses its spines to catch ants" },
      { id: "keep-safe", text: "To explain how the spines keep the lizard safe from birds" },
      { id: "rocking-walk", text: "To describe the lizard's slow, rocking walk" },
      { id: "reach-mouth", text: "To explain how water reaches the lizard's mouth" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "keep-safe",
    },
    explanation: "Ask what new information the last paragraph adds. It opens by saying the spines 'are not for attack' and closes with a bird looking for something softer, so the point is defence. The spines are not what the lizard uses to catch ants; the rocking walk is described in the first paragraph; and the water travels along skin channels, which the second paragraph already covered.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Desert lizard",
      skill: "Working out why an author included a paragraph",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 95,
      tags: ["information text", "author purpose", "paragraph function"],
    },
  },
  {
    id: "icas-y3-read-narrative-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "How does Nikau feel when his kite lands on the roof of the shed?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Kite Above the Shed",
      body: "Nikau had waited all week for a windy day. On Saturday the gum trees tossed their branches, so he raced to the park with his red kite.\n\nThe kite climbed higher than the treetops. Nikau let out more string, then more again, until his hands ached. Then the wind changed. The kite swooped sideways and settled on the roof of the old shed by the fence.\n\nNikau stood beneath the shed for a long time. He looked at the roof, then at the ground, then at the roof again. His feet did not move.\n\nMrs Okafor from the corner house came past with her dog. 'That roof is rustier than it looks,' she said. 'Wait here.' She went home and came back carrying a long pool net.\n\nNikau held the dog's lead while Mrs Okafor stretched the net up towards the red tail of the kite. It was still a hand's width short.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "proud", text: "Proud, because his kite flew higher than the treetops" },
      { id: "cross-with-mrs-okafor", text: "Cross with Mrs Okafor for taking so long" },
      { id: "stuck-and-unsure", text: "Stuck, because he cannot think of a way to get the kite down" },
      { id: "bored", text: "Bored, because there is nothing left to do at the park" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "stuck-and-unsure",
    },
    explanation: "The story never uses a feeling word here, so look at what Nikau's body does. He stands 'for a long time', his eyes go roof, ground, roof, and 'his feet did not move'. A person who knows what to do moves. Looking back and forth and staying still shows he is stuck. Nothing in this part of the story shows pride, crossness or boredom - those would need him to be pleased, complaining, or looking for something else to do.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Inferring feelings from behaviour",
      skill: "Inferring how a character feels",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["narrative", "inference", "character feelings", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-002",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does Mrs Okafor say, 'That roof is rustier than it looks'?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Kite Above the Shed",
      body: "Nikau had waited all week for a windy day. On Saturday the gum trees tossed their branches, so he raced to the park with his red kite.\n\nThe kite climbed higher than the treetops. Nikau let out more string, then more again, until his hands ached. Then the wind changed. The kite swooped sideways and settled on the roof of the old shed by the fence.\n\nNikau stood beneath the shed for a long time. He looked at the roof, then at the ground, then at the roof again. His feet did not move.\n\nMrs Okafor from the corner house came past with her dog. 'That roof is rustier than it looks,' she said. 'Wait here.' She went home and came back carrying a long pool net.\n\nNikau held the dog's lead while Mrs Okafor stretched the net up towards the red tail of the kite. It was still a hand's width short.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "explaining-stuck", text: "She is explaining why the kite became stuck up there" },
      { id: "asking-for-help-fixing", text: "She wants Nikau to help her repair the shed roof" },
      { id: "complaining-about-shed", text: "She thinks the old shed should be pulled down" },
      { id: "warning-not-to-climb", text: "She is warning Nikau that climbing on the roof would not be safe" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "warning-not-to-climb",
    },
    explanation: "Work out what someone means by asking what they say it about and what they do next. Mrs Okafor speaks the moment she sees a boy staring up at a roof, and she follows the comment straight away with 'Wait here' before fetching a net. A net gets the kite without anyone going up. Put those together and the rust remark is a warning about climbing. The rust did not catch the kite, the changing wind did, so 'explaining why it got stuck' does not fit; and nothing in the story says she wants the shed repaired or removed.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Inferring a speaker's purpose",
      skill: "Inferring why a character says something",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["narrative", "inference", "dialogue", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is most likely to happen next in this story?",
    instructions: "Read the story, then choose the answer the story most points towards.",
    stimulus: {
      title: "The Kite Above the Shed",
      body: "Nikau had waited all week for a windy day. On Saturday the gum trees tossed their branches, so he raced to the park with his red kite.\n\nThe kite climbed higher than the treetops. Nikau let out more string, then more again, until his hands ached. Then the wind changed. The kite swooped sideways and settled on the roof of the old shed by the fence.\n\nNikau stood beneath the shed for a long time. He looked at the roof, then at the ground, then at the roof again. His feet did not move.\n\nMrs Okafor from the corner house came past with her dog. 'That roof is rustier than it looks,' she said. 'Wait here.' She went home and came back carrying a long pool net.\n\nNikau held the dog's lead while Mrs Okafor stretched the net up towards the red tail of the kite. It was still a hand's width short.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "find-something-to-stand-on", text: "They will look for something to stand on so the net can reach a little higher" },
      { id: "nikau-climbs-roof", text: "Nikau will climb onto the shed roof and pick the kite up himself" },
      { id: "mrs-okafor-goes-home", text: "Mrs Okafor will take her dog home and leave Nikau on his own" },
      { id: "nikau-stops-caring", text: "Nikau will decide he does not want the kite any more" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "find-something-to-stand-on",
    },
    explanation: "To predict, find the problem the story has just set up and ask how small it is. The last line leaves the net 'a hand's width short' - that is a tiny gap, so the sensible next step is extra height, such as a bucket, a crate or a step. Mrs Okafor has already shown she solves problems by going and fetching the right gear. She has just warned about the rust, so having Nikau climb up would undo her own warning. She said 'Wait here' and walked home for a net, so she is not about to abandon him, and a boy who waited all week for wind will not shrug the kite off now.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Predicting from story evidence",
      skill: "Predicting what happens next",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["narrative", "prediction", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-004",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "In this story, the crowd had 'dwindled'. What does dwindled mean?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "Jam at the Saturday Market",
      body: "Priya's grandmother made forty jars of plum jam for the Saturday market. Priya wrote the labels herself, one letter at a time, and lined the jars up in five neat rows.\n\nBy nine o'clock the sky had gone the colour of wet cement. By half past nine the rain was drumming on the roof of their stall and the crowd had dwindled to three people and a wet dog.\n\n'Nobody buys jam in the rain,' said the man selling candles at the next stall. He began packing his boxes into his van.\n\nPriya did not pack anything. She tipped a spoonful of jam onto a plate, cut a loaf of bread into small squares, and carried the plate out under the edge of the roof where people were sheltering.\n\nBy eleven o'clock the rain had stopped and only six jars were left. The candle man had gone home at ten.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "grown-larger", text: "grown much bigger" },
      { id: "become-fewer", text: "become smaller and smaller in number" },
      { id: "got-noisier", text: "started making a lot of noise" },
      { id: "moved-inside", text: "moved indoors out of the weather" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "become-fewer",
    },
    explanation: "When a word is new, read past it to the words that follow. The sentence finishes 'to three people and a wet dog' - and a crowd is normally many people. Going from a crowd down to three tells you the number kept dropping, so dwindled means becoming fewer and fewer. 'Grown much bigger' is the opposite of what the numbers show. Nothing is said about noise, and although the rain would make people shelter, the sentence measures how many people are there, not where they went.",
    metadata: {
      subject: "reading",
      strand: "Vocabulary",
      topic: "Using surrounding words to define a verb",
      skill: "Working out word meaning from context",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["narrative", "vocabulary", "context clues", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-005",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does Priya carry the plate of bread and jam out to the edge of the roof?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "Jam at the Saturday Market",
      body: "Priya's grandmother made forty jars of plum jam for the Saturday market. Priya wrote the labels herself, one letter at a time, and lined the jars up in five neat rows.\n\nBy nine o'clock the sky had gone the colour of wet cement. By half past nine the rain was drumming on the roof of their stall and the crowd had dwindled to three people and a wet dog.\n\n'Nobody buys jam in the rain,' said the man selling candles at the next stall. He began packing his boxes into his van.\n\nPriya did not pack anything. She tipped a spoonful of jam onto a plate, cut a loaf of bread into small squares, and carried the plate out under the edge of the roof where people were sheltering.\n\nBy eleven o'clock the rain had stopped and only six jars were left. The candle man had gone home at ten.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "keep-plate-dry", text: "She wanted to keep the plate of bread out of the rain" },
      { id: "grandmother-told-her", text: "Her grandmother asked her to hand out the leftover bread" },
      { id: "take-jam-to-shoppers", text: "Shoppers had stopped coming to the stall, so she took the jam to where the shoppers were" },
      { id: "she-was-hungry", text: "She was hungry and wanted to eat some jam herself" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "take-jam-to-shoppers",
    },
    explanation: "For a 'why did she do it' question, look at the problem in the sentences just before. The rain has emptied the market, so nobody is walking past the stall to taste the jam. Priya's answer to that is to move the jam to the one place people are standing - under the edge of the roof. The result proves it worked: thirty-four jars sell. The plate stays dry, but that is a side effect, not her reason. Her grandmother is never shown asking her anything, and Priya makes small tasting squares for other people rather than eating them.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Inferring a character's motive",
      skill: "Inferring why a character acts",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["narrative", "inference", "motive", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-006",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The story ends with the sentence: 'The candle man had gone home at ten.' Why does the writer put this sentence last?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "Jam at the Saturday Market",
      body: "Priya's grandmother made forty jars of plum jam for the Saturday market. Priya wrote the labels herself, one letter at a time, and lined the jars up in five neat rows.\n\nBy nine o'clock the sky had gone the colour of wet cement. By half past nine the rain was drumming on the roof of their stall and the crowd had dwindled to three people and a wet dog.\n\n'Nobody buys jam in the rain,' said the man selling candles at the next stall. He began packing his boxes into his van.\n\nPriya did not pack anything. She tipped a spoonful of jam onto a plate, cut a loaf of bread into small squares, and carried the plate out under the edge of the roof where people were sheltering.\n\nBy eleven o'clock the rain had stopped and only six jars were left. The candle man had gone home at ten.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "candles-hard-to-sell", text: "To show that candles are always harder to sell than jam" },
      { id: "explains-rain-stopping", text: "To explain why the rain stopped at eleven o'clock" },
      { id: "he-lived-nearby", text: "To show that he lived very close to the market" },
      { id: "missed-the-customers", text: "To show that by giving up early he missed the buyers Priya kept selling to" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "missed-the-customers",
    },
    explanation: "Compare the times the writer gives you. The candle man, who said nobody buys jam in the rain, drove off at ten. Priya keeps working, and by eleven o'clock thirty-four jars have gone. Placing his departure time in the very last sentence makes the reader notice that he left while the selling was still going on. Nothing in the story says candles are harder to sell, explains the weather, or tells us where he lives.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Purpose of a closing detail",
      skill: "Close reading of a narrative ending",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 100,
      tags: ["narrative", "author purpose", "close reading", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-007",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these five events from the story in the order they happen.",
    instructions: "Read the story, then drag the events into order from first to last.",
    stimulus: {
      title: "The Night the Lights Went Out",
      body: "The storm knocked the power out just as Dad was draining the pasta.\n\nThe kitchen went black. Dad said a word he tells us not to say, then laughed. Tessa found the torch in the drawer under the sink, but the batteries were flat, so she shook it, which did not help at all.\n\nThen Dad remembered the candles in the camping box in the garage. He came back with the candles, a box of matches and a spider web in his hair.\n\nWe ate our pasta at the table with six candles burning in the middle, which is five more candles than we usually have. Outside, the rain had stopped and the street was darker than we had ever seen it. Tessa put her face against the window and said she could see stars over the roofs - real ones, not the fuzzy ones.\n\nThe power came back at half past eight. Dad blew out the candles slowly, one at a time, and nobody said anything for a moment.",
      attribution: "MindMosaic original",
    },
    interaction: {
      type: "ordering",
      items: [
        {
          id: "torch-flat",
          text: "Tessa finds the torch, but its batteries are flat",
        },
        {
          id: "power-back",
          text: "The power comes back on at half past eight",
        },
        {
          id: "lights-go-out",
          text: "The storm knocks the power out while Dad is draining the pasta",
        },
        {
          id: "stars-window",
          text: "Tessa sees stars above the roofs from the window",
        },
        {
          id: "candles-garage",
          text: "Dad fetches the candles from the camping box in the garage",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["lights-go-out", "torch-flat", "candles-garage", "stars-window", "power-back"],
    },
    explanation: "Track the time words the writer leaves for you. The power goes out in the very first sentence, so that is first. 'The kitchen went black' comes next, which is when Tessa tries the torch. The word 'Then' starts the candle paragraph, so the garage trip follows the failed torch. The stars are seen while the family is already eating by candlelight, and the power returns at half past eight, after the meal. If you are unsure of two events, find which paragraph each one sits in and use the paragraph order.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Ordering events in a narrative",
      skill: "Sequencing events",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 100,
      tags: ["narrative", "sequencing", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-008",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does nobody say anything for a moment after Dad blows out the candles?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Night the Lights Went Out",
      body: "The storm knocked the power out just as Dad was draining the pasta.\n\nThe kitchen went black. Dad said a word he tells us not to say, then laughed. Tessa found the torch in the drawer under the sink, but the batteries were flat, so she shook it, which did not help at all.\n\nThen Dad remembered the candles in the camping box in the garage. He came back with the candles, a box of matches and a spider web in his hair.\n\nWe ate our pasta at the table with six candles burning in the middle, which is five more candles than we usually have. Outside, the rain had stopped and the street was darker than we had ever seen it. Tessa put her face against the window and said she could see stars over the roofs - real ones, not the fuzzy ones.\n\nThe power came back at half past eight. Dad blew out the candles slowly, one at a time, and nobody said anything for a moment.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "sorry-it-ended", text: "They had enjoyed the candlelit evening and were a little sorry it was over" },
      { id: "scared-of-storm", text: "They were frightened that another storm was about to start" },
      { id: "cross-with-dad", text: "They were cross with Dad for burning six candles instead of one" },
      { id: "too-tired-to-talk", text: "They were all far too tired to speak" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "sorry-it-ended",
    },
    explanation: "Silence in a story means whatever the sentences around it make it mean, so gather the mood first. The evening has been a good one: Dad laughs, six candles instead of the usual one, real stars over the roofs. Then Dad puts the candles out 'slowly, one at a time' rather than quickly - a way of making something last. A happy evening ending slowly explains a quiet moment. The rain had already stopped, so there is no new storm to fear; the six candles are described with delight, not complaint; and nobody in the story yawns or mentions being tired.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Inferring mood from a closing action",
      skill: "Inferring how characters feel",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["narrative", "inference", "mood", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-009",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The story says the torch batteries 'were flat'. What does flat mean here?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Night the Lights Went Out",
      body: "The storm knocked the power out just as Dad was draining the pasta.\n\nThe kitchen went black. Dad said a word he tells us not to say, then laughed. Tessa found the torch in the drawer under the sink, but the batteries were flat, so she shook it, which did not help at all.\n\nThen Dad remembered the candles in the camping box in the garage. He came back with the candles, a box of matches and a spider web in his hair.\n\nWe ate our pasta at the table with six candles burning in the middle, which is five more candles than we usually have. Outside, the rain had stopped and the street was darker than we had ever seen it. Tessa put her face against the window and said she could see stars over the roofs - real ones, not the fuzzy ones.\n\nThe power came back at half past eight. Dad blew out the candles slowly, one at a time, and nobody said anything for a moment.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "smooth-and-level", text: "They were smooth and level, with no bumps" },
      { id: "no-power-left", text: "They had no power left in them" },
      { id: "squashed", text: "They had been squashed in the drawer" },
      { id: "very-cold", text: "They had gone very cold" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "no-power-left",
    },
    explanation: "A word you know can mean something different in a new sentence, so test each meaning against what happens. The word 'but' warns you that finding the torch did not help, and the family then hunts for candles instead - so the torch did not light. Shaking a battery is what people try when it is running out of charge. Only 'no power left' explains a torch that will not shine. Batteries really are smooth and level in shape, but that would not stop the torch working, and nothing suggests they were squashed or cold.",
    metadata: {
      subject: "reading",
      strand: "Vocabulary",
      topic: "Multiple meanings of a familiar word",
      skill: "Working out word meaning from context",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 65,
      tags: ["narrative", "vocabulary", "context clues", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-010",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each detail from the story with what it tells the reader. One meaning will not be used.",
    instructions: "Read the story, then match each detail on the left to the best meaning on the right.",
    stimulus: {
      title: "The Wombat in the Woodshed",
      body: "Grandad's woodshed had a new visitor. Something had pushed the stacked logs into a heap and dug a hollow behind them.\n\n'Wombat,' said Grandad. 'Look at the droppings. Square as dice.'\n\nAda wanted to see it. She sat on an upturned bucket after dinner and waited while the sky went orange, then grey, then nearly black. Mosquitoes found her ankles. She stayed still.\n\nAt last a shape came out from behind the logs, low and wide, like a footstool walking. It did not turn its head towards Ada. It went straight through the gap in the fence and out into the paddock, and its short legs moved much faster than she expected.\n\nGrandad said wombats sleep through most of the day and come out when it is cool. He said the woodshed was warm and dry and dark, which is exactly what a wombat likes, and that they would have to stack the logs somewhere else until winter was over.\n\nAda did not mind. She had already decided to bring a chair and some insect spray tomorrow.",
      attribution: "MindMosaic original",
    },
    interaction: {
      type: "matching",
      sources: [
        {
          id: "sat-still-mosquitoes",
          text: "Ada sits still on the bucket while mosquitoes bite her ankles",
        },
        {
          id: "square-droppings",
          text: "Grandad points at droppings that are square as dice",
        },
        {
          id: "no-head-turn",
          text: "The wombat walks past without turning its head towards Ada",
        },
        {
          id: "chair-and-spray",
          text: "Ada plans to bring a chair and insect spray tomorrow",
        },
      ],
      targets: [
        {
          id: "patient",
          text: "Ada is very patient",
        },
        {
          id: "knows-from-evidence",
          text: "Grandad can name the animal from clues he can see",
        },
        {
          id: "wombat-untroubled",
          text: "The wombat is not bothered by Ada being there",
        },
        {
          id: "will-return",
          text: "Ada means to come back and watch again",
        },
        {
          id: "ada-afraid",
          text: "Ada is frightened of the wombat",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "sat-still-mosquitoes",
          targetId: "patient",
        },
        {
          sourceId: "square-droppings",
          targetId: "knows-from-evidence",
        },
        {
          sourceId: "no-head-turn",
          targetId: "wombat-untroubled",
        },
        {
          sourceId: "chair-and-spray",
          targetId: "will-return",
        },
      ],
    },
    explanation: "Each detail is a small piece of evidence, so ask 'what would only this detail prove?' Sitting through being bitten by mosquitoes shows patience, because an impatient watcher would get up. Grandad names the animal by reading its droppings, so he identifies it from clues rather than from seeing it. The wombat never even turns its head, which means Ada does not worry it. Bringing a chair and spray is planning for a longer, comfier wait tomorrow, so she intends to return. 'Frightened' matches nothing: she chooses to wait in the dark, and the story says she did not mind.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Matching evidence to inference",
      skill: "Inferring character and animal behaviour from detail",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["narrative", "inference", "evidence", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-011",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does Grandad say the logs will have to be stacked somewhere else until winter is over?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Wombat in the Woodshed",
      body: "Grandad's woodshed had a new visitor. Something had pushed the stacked logs into a heap and dug a hollow behind them.\n\n'Wombat,' said Grandad. 'Look at the droppings. Square as dice.'\n\nAda wanted to see it. She sat on an upturned bucket after dinner and waited while the sky went orange, then grey, then nearly black. Mosquitoes found her ankles. She stayed still.\n\nAt last a shape came out from behind the logs, low and wide, like a footstool walking. It did not turn its head towards Ada. It went straight through the gap in the fence and out into the paddock, and its short legs moved much faster than she expected.\n\nGrandad said wombats sleep through most of the day and come out when it is cool. He said the woodshed was warm and dry and dark, which is exactly what a wombat likes, and that they would have to stack the logs somewhere else until winter was over.\n\nAda did not mind. She had already decided to bring a chair and some insect spray tomorrow.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "logs-too-wet", text: "The logs have become too wet to burn in the fire" },
      { id: "shed-roof-leaks", text: "The roof of the woodshed has started to leak" },
      { id: "leave-wombat-alone", text: "The wombat has made its home behind the logs and he does not want to disturb it" },
      { id: "ada-wants-to-sit", text: "Ada wants to use the woodshed as a place to sit and watch" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "leave-wombat-alone",
    },
    explanation: "Read the sentence before the decision, because that is usually where the reason hides. Grandad has just explained that the shed is warm, dry and dark - 'exactly what a wombat likes' - and the wombat has already dug a hollow behind the logs. Moving the logs means the family can still reach their firewood without pulling apart the animal's burrow, and 'until winter was over' tells you it is a temporary arrangement for the animal's sake. The story never says the logs are wet or the roof leaks, and Ada sits outside on a bucket, not inside the shed.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Inferring the reason behind a decision",
      skill: "Inferring why a character acts",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 85,
      tags: ["narrative", "inference", "animals", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The wombat is described as 'like a footstool walking'. What does this comparison tell the reader about the wombat?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The Wombat in the Woodshed",
      body: "Grandad's woodshed had a new visitor. Something had pushed the stacked logs into a heap and dug a hollow behind them.\n\n'Wombat,' said Grandad. 'Look at the droppings. Square as dice.'\n\nAda wanted to see it. She sat on an upturned bucket after dinner and waited while the sky went orange, then grey, then nearly black. Mosquitoes found her ankles. She stayed still.\n\nAt last a shape came out from behind the logs, low and wide, like a footstool walking. It did not turn its head towards Ada. It went straight through the gap in the fence and out into the paddock, and its short legs moved much faster than she expected.\n\nGrandad said wombats sleep through most of the day and come out when it is cool. He said the woodshed was warm and dry and dark, which is exactly what a wombat likes, and that they would have to stack the logs somewhere else until winter was over.\n\nAda did not mind. She had already decided to bring a chair and some insect spray tomorrow.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "slow-and-stiff", text: "It moves slowly and stiffly, as if it can hardly walk" },
      { id: "soft-and-furry", text: "It is as soft and squashy as a cushion" },
      { id: "small-enough-to-carry", text: "It is small enough for Ada to pick up and carry" },
      { id: "low-solid-body", text: "It has a low, wide, solid body carried on short legs" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "low-solid-body",
    },
    explanation: "With a comparison, picture the object and keep only the parts that also fit the animal. A footstool is low to the ground, wide and firm, and it stands on short legs - which matches the words 'low and wide' in the same sentence. Speed is the trap: a footstool cannot move at all, but the story says the wombat's 'short legs moved much faster than she expected', so 'slow and stiff' is exactly wrong. A footstool is chosen for its shape, not for being soft, and the story gives no hint that this heavy digging animal could be lifted.",
    metadata: {
      subject: "reading",
      strand: "Writer's Craft",
      topic: "Interpreting a simile",
      skill: "Understanding what a comparison shows",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 95,
      tags: ["narrative", "simile", "figurative language", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-013",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "How does Ky feel when the bus turns left instead of right?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The 42 to Riverbend",
      body: "Ky had caught the 42 home from swimming every Thursday since the start of the year. He knew the stop by the bakery, the stop by the vet with the fibreglass horse out the front, and the stop where the road curved past the football oval.\n\nToday the bus went past the bakery and turned left instead of right.\n\nKy looked out the window. He looked at the other passengers. Nobody else seemed surprised. His stomach felt the way it does before a race. He counted the money in his pocket - a two dollar coin and some silver - and then he read the paper sign taped above the driver: 42 - DIVERSION - ROADWORKS ON MILL STREET.\n\nKy sat back. He still did not know exactly which streets the bus would take, but now he knew why it was taking them. Two streets later the top of the fibreglass horse appeared above a hedge, and Ky let out a breath he had not noticed he was holding.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "worried", text: "Worried, because the bus is not going the usual way" },
      { id: "excited", text: "Excited about seeing a brand new part of town" },
      { id: "annoyed-at-driver", text: "Annoyed with the driver for taking a wrong turn on purpose" },
      { id: "sleepy", text: "Sleepy after his swimming lesson" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "worried",
    },
    explanation: "When a writer will not name the feeling, read the body and the actions. Ky's 'stomach felt the way it does before a race' - that is the nervous, fluttery feeling before something you are not sure about. He then counts his money, which is what a person does when they are working out how they will get home. Both clues point to worry. An excited passenger would enjoy the new streets instead of checking coins; he never blames the driver, and once he reads the sign he accepts the reason; and although he has been swimming, nothing in the story says he is sleepy.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Reading physical clues to feelings",
      skill: "Inferring how a character feels",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["narrative", "inference", "transport", "icas style"],
    },
  },
  {
    id: "icas-y3-read-narrative-014",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does Ky look at the other passengers?",
    instructions: "Read the story, then choose the best answer.",
    stimulus: {
      title: "The 42 to Riverbend",
      body: "Ky had caught the 42 home from swimming every Thursday since the start of the year. He knew the stop by the bakery, the stop by the vet with the fibreglass horse out the front, and the stop where the road curved past the football oval.\n\nToday the bus went past the bakery and turned left instead of right.\n\nKy looked out the window. He looked at the other passengers. Nobody else seemed surprised. His stomach felt the way it does before a race. He counted the money in his pocket - a two dollar coin and some silver - and then he read the paper sign taped above the driver: 42 - DIVERSION - ROADWORKS ON MILL STREET.\n\nKy sat back. He still did not know exactly which streets the bus would take, but now he knew why it was taking them. Two streets later the top of the fibreglass horse appeared above a hedge, and Ky let out a breath he had not noticed he was holding.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "find-a-friend", text: "To look for a friend from his swimming class" },
      { id: "check-if-others-worried", text: "To see whether anyone else thinks something has gone wrong" },
      { id: "find-a-seat", text: "To find out whether there is a spare seat" },
      { id: "borrow-money", text: "To find someone who could lend him money for the fare" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "check-if-others-worried",
    },
    explanation: "Use the sentence that comes straight after an action - writers often put the point of the action there. Ky looks at the passengers and the next line reports what he found out: 'Nobody else seemed surprised.' That tells you he was checking their faces for surprise, because if the regulars are calm, perhaps nothing is wrong. He is looking at everyone rather than searching for one person, so it is not about a friend; he is already seated and looking out the window; and he counts his own money without speaking to anyone.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Explaining a character's action",
      skill: "Inferring why a character acts",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["narrative", "inference", "motive", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "How were Marlo and Suki different in the way they got ready for the contest?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Kite Contest",
      body: "Marlo and Suki both wanted to win the school kite contest, and they had a whole week to get ready.\n\nMarlo built his kite slowly. Each afternoon he added one part and checked that every knot was tight. He tested it in the park twice before the contest and fixed a wobbly tail.\n\nSuki could not wait. She finished her kite in a single evening, sticky tape and all. \"Mine looks the best,\" she said, holding it up high. She never took it outside to try.\n\nOn the day of the contest, the wind was strong. Marlo let out his string bit by bit, and his kite climbed high and stayed steady. Suki threw her kite up quickly, but the tail came loose at once and it spun down into the grass.\n\nSuki sighed. \"I should have tested mine,\" she said.\n\nMarlo smiled and handed her some spare tape. \"There is another contest next month,\" he said. \"We can practise together.\"",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "marlo-rushed", text: "Marlo rushed his kite while Suki took her time." },
      { id: "both-tested", text: "Both of them tested their kites many times." },
      { id: "careful-hurried", text: "Marlo prepared carefully while Suki hurried." },
      { id: "neither-finished", text: "Neither of them finished a kite in time." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "careful-hurried",
    },
    explanation: "Line up what each child did. Marlo 'added one part' each afternoon, checked the knots, and tested the kite twice. Suki 'finished her kite in a single evening' and 'never took it outside to try.' So Marlo prepared carefully and Suki hurried. The first choice swaps them around, and the last two say things the text never shows.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Comparing two characters",
      skill: "Comparing how two characters behave",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["narrative", "comparing characters", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did Suki's kite spin down into the grass?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Kite Contest",
      body: "Marlo and Suki both wanted to win the school kite contest, and they had a whole week to get ready.\n\nMarlo built his kite slowly. Each afternoon he added one part and checked that every knot was tight. He tested it in the park twice before the contest and fixed a wobbly tail.\n\nSuki could not wait. She finished her kite in a single evening, sticky tape and all. \"Mine looks the best,\" she said, holding it up high. She never took it outside to try.\n\nOn the day of the contest, the wind was strong. Marlo let out his string bit by bit, and his kite climbed high and stayed steady. Suki threw her kite up quickly, but the tail came loose at once and it spun down into the grass.\n\nSuki sighed. \"I should have tested mine,\" she said.\n\nMarlo smiled and handed her some spare tape. \"There is another contest next month,\" he said. \"We can practise together.\"",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "weak-wind", text: "The wind was too weak to keep it up." },
      { id: "too-heavy", text: "She had made her kite too heavy to fly." },
      { id: "string-slowly", text: "She let the string out slowly, bit by bit." },
      { id: "tail-loose", text: "Its tail came loose when she threw it." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "tail-loose",
    },
    explanation: "The text gives the reason straight after it happens: 'the tail came loose at once and it spun down into the grass.' The wind was 'strong', not weak, so the first choice is wrong. Nothing is said about the kite being heavy. Letting the string out slowly, bit by bit, was Marlo's careful move that kept his kite steady, so it did not cause Suki's fall.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Cause and effect",
      skill: "Identifying the cause of an event",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["narrative", "cause and effect", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The author writes that Marlo's kite 'climbed high and stayed steady'. What does the word 'steady' help the reader picture?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Kite Contest",
      body: "Marlo and Suki both wanted to win the school kite contest, and they had a whole week to get ready.\n\nMarlo built his kite slowly. Each afternoon he added one part and checked that every knot was tight. He tested it in the park twice before the contest and fixed a wobbly tail.\n\nSuki could not wait. She finished her kite in a single evening, sticky tape and all. \"Mine looks the best,\" she said, holding it up high. She never took it outside to try.\n\nOn the day of the contest, the wind was strong. Marlo let out his string bit by bit, and his kite climbed high and stayed steady. Suki threw her kite up quickly, but the tail came loose at once and it spun down into the grass.\n\nSuki sighed. \"I should have tested mine,\" she said.\n\nMarlo smiled and handed her some spare tape. \"There is another contest next month,\" he said. \"We can practise together.\"",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "no-wobble", text: "It stayed still and did not wobble." },
      { id: "up-down-fast", text: "It moved up and down very fast." },
      { id: "bright-colours", text: "It was painted in bright colours." },
      { id: "biggest-kite", text: "It was the biggest kite in the contest." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "no-wobble",
    },
    explanation: "'Steady' means holding still and not moving about. The writer picked it to show Marlo's kite kept its place in the air, which is the opposite of Suki's kite that 'spun down'. 'Steady' says nothing about a kite going fast, its colour or its size, so the other three choices do not fit the word.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Word choice",
      skill: "Understanding the effect of a particular word choice",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["narrative", "word choice", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-004",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which of these is stated directly in the text, rather than something you have to work out for yourself?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "Lighthouses",
      body: "For hundreds of years, ships have used lighthouses to stay safe. A lighthouse is a tall tower built close to the sea. At the top is a very bright light that can be seen from far away.\n\nLong ago, the coast near a town was a dangerous place for boats. Sharp rocks hid under the water, and on dark or foggy nights a captain could not see them. Many boats were wrecked. So people built lighthouses to warn sailors that rocks were near.\n\nEach lighthouse flashes its light in its own pattern. One might flash twice, then wait, then flash twice again. Another might shine without stopping. A captain who knows the patterns can tell exactly which lighthouse he is looking at, and so he knows which part of the coast his ship has reached.\n\nIn the past, a keeper lived beside each lighthouse. Every night the keeper climbed the stairs to light the lamp and clean the glass. Today most lighthouses work by machine, and the lamps switch on by themselves. The keepers have gone, but the lights still turn, night after night, guiding ships home.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "brave", text: "Lighthouse keepers were the bravest people around." },
      { id: "keeper-lived", text: "A keeper once lived beside each lighthouse." },
      { id: "cheaper", text: "New machines cost far less than paying a keeper." },
      { id: "afraid-dark", text: "Sailors were always frightened of the dark." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "keeper-lived",
    },
    explanation: "Hunt for the exact words in the text. The last paragraph says plainly, 'a keeper lived beside each lighthouse', so that one is stated. The other three might sound true, but the text never calls keepers brave, never compares what machines cost, and never says sailors were frightened. Those are ideas you would have to add yourself.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Stated versus implied",
      skill: "Distinguishing a stated fact from an implied idea",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 65,
      tags: ["information text", "stated and implied", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-005",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A captain at sea sees a light that flashes twice, waits, then flashes twice again. Using the text, what can the captain work out?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "Lighthouses",
      body: "For hundreds of years, ships have used lighthouses to stay safe. A lighthouse is a tall tower built close to the sea. At the top is a very bright light that can be seen from far away.\n\nLong ago, the coast near a town was a dangerous place for boats. Sharp rocks hid under the water, and on dark or foggy nights a captain could not see them. Many boats were wrecked. So people built lighthouses to warn sailors that rocks were near.\n\nEach lighthouse flashes its light in its own pattern. One might flash twice, then wait, then flash twice again. Another might shine without stopping. A captain who knows the patterns can tell exactly which lighthouse he is looking at, and so he knows which part of the coast his ship has reached.\n\nIn the past, a keeper lived beside each lighthouse. Every night the keeper climbed the stairs to light the lamp and clean the glass. Today most lighthouses work by machine, and the lamps switch on by themselves. The keepers have gone, but the lights still turn, night after night, guiding ships home.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "keeper-awake", text: "That the keeper is awake and climbing the stairs." },
      { id: "storm-coming", text: "That a storm is coming and the sea will be rough." },
      { id: "which-lighthouse", text: "Which lighthouse it is, and which coast the ship has reached." },
      { id: "light-broken", text: "That the light is broken and flashing by mistake." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "which-lighthouse",
    },
    explanation: "Join two facts from the third paragraph. First, 'each lighthouse flashes its light in its own pattern.' Second, a captain who knows the patterns 'can tell exactly which lighthouse he is looking at, and so he knows which part of the coast his ship has reached.' Put together, the flashing pattern tells the captain which lighthouse it is and where he is. The pattern is not linked to keepers, storms or a fault, so the other choices do not follow.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Drawing a conclusion",
      skill: "Drawing a conclusion by combining two facts",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 95,
      tags: ["information text", "drawing conclusions", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-006",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Using the text, match each part of the lighthouse story to what the text says about it.",
    instructions: "Read the text, then match each detail to the correct description. One description will be left over.",
    stimulus: {
      title: "Lighthouses",
      body: "For hundreds of years, ships have used lighthouses to stay safe. A lighthouse is a tall tower built close to the sea. At the top is a very bright light that can be seen from far away.\n\nLong ago, the coast near a town was a dangerous place for boats. Sharp rocks hid under the water, and on dark or foggy nights a captain could not see them. Many boats were wrecked. So people built lighthouses to warn sailors that rocks were near.\n\nEach lighthouse flashes its light in its own pattern. One might flash twice, then wait, then flash twice again. Another might shine without stopping. A captain who knows the patterns can tell exactly which lighthouse he is looking at, and so he knows which part of the coast his ship has reached.\n\nIn the past, a keeper lived beside each lighthouse. Every night the keeper climbed the stairs to light the lamp and clean the glass. Today most lighthouses work by machine, and the lamps switch on by themselves. The keepers have gone, but the lights still turn, night after night, guiding ships home.",
      attribution: "MindMosaic original",
    },
    interaction: {
      type: "matching",
      sources: [
        {
          id: "bright-light",
          text: "The bright light at the top",
        },
        {
          id: "sharp-rocks",
          text: "The sharp rocks under the water",
        },
        {
          id: "the-keeper",
          text: "The keeper in the past",
        },
      ],
      targets: [
        {
          id: "seen-far",
          text: "Can be seen from far away",
        },
        {
          id: "wrecked-boats",
          text: "Wrecked many boats long ago",
        },
        {
          id: "lit-lamp",
          text: "Lit the lamp and cleaned the glass",
        },
        {
          id: "built-tower",
          text: "Made the tower taller each year",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "bright-light",
          targetId: "seen-far",
        },
        {
          sourceId: "sharp-rocks",
          targetId: "wrecked-boats",
        },
        {
          sourceId: "the-keeper",
          targetId: "lit-lamp",
        },
      ],
    },
    explanation: "Find each detail in the text and read what it does. The bright light 'can be seen from far away.' The sharp rocks hid under the water and 'many boats were wrecked.' The keeper 'climbed the stairs to light the lamp and clean the glass.' Nothing in the text says the tower was 'made taller each year', so that description is the one left over.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Linking details to facts",
      skill: "Matching each detail to what the text says about it",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 110,
      tags: ["information text", "matching", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-007",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the TWO statements that correctly show how Ivy and Ben were different at the stall.",
    instructions: "Read the text, then choose the two correct statements.",
    stimulus: {
      title: "The Jam Stall",
      body: "Ivy and her cousin Ben set up a stall at the town market to sell their grandmother's plum jam. They had twenty jars to sell.\n\nBy ten o'clock, not one jar had sold. Ben slumped on his chair. \"Nobody wants it,\" he groaned. \"Let's pack up and go home.\"\n\nIvy would not give up. She fetched a spoon and some crackers and offered a taste to everyone who walked past. Soon a small crowd was smiling and reaching for their purses.\n\nThe more people tasted the jam, the more jars they bought. By lunchtime every jar was gone, and the tin was heavy with coins. Ben stared at the empty table.\n\n\"You were right to keep trying,\" he said. Ivy grinned and shared out the last cracker between them.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "ben-sold", text: "Ben found a way to sell the jam, but Ivy gave up." },
      { id: "neither-spoke", text: "Neither Ivy nor Ben spoke to anyone at the market." },
      { id: "ivy-tried", text: "Ivy kept trying, but Ben wanted to give up." },
      { id: "ivy-tastes", text: "Ivy offered tastes, while Ben sat slumped in his chair." },
      { id: "both-packup", text: "Both Ivy and Ben wanted to pack up and go home." },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["ivy-tried", "ivy-tastes"],
    },
    explanation: "Compare what each cousin did. Ivy 'would not give up', fetched a spoon and 'offered a taste to everyone who walked past', so the first two statements are true. Only Ben wanted to 'pack up and go home', so 'both' is wrong. It was Ivy, not Ben, who found the way to sell the jam, so that choice is back to front. And Ivy clearly spoke to the people walking past, so 'neither spoke to anyone' is false.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Comparing two characters",
      skill: "Selecting statements that correctly compare two characters",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["narrative", "comparing characters", "multiple select", "icas style"],
    },
  },
  {
    id: "icas-y3-reading-c-008",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "What happened as a result of Ivy offering people a taste of the jam?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Jam Stall",
      body: "Ivy and her cousin Ben set up a stall at the town market to sell their grandmother's plum jam. They had twenty jars to sell.\n\nBy ten o'clock, not one jar had sold. Ben slumped on his chair. \"Nobody wants it,\" he groaned. \"Let's pack up and go home.\"\n\nIvy would not give up. She fetched a spoon and some crackers and offered a taste to everyone who walked past. Soon a small crowd was smiling and reaching for their purses.\n\nThe more people tasted the jam, the more jars they bought. By lunchtime every jar was gone, and the tin was heavy with coins. Ben stared at the empty table.\n\n\"You were right to keep trying,\" he said. Ivy grinned and shared out the last cracker between them.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "people-bought", text: "People began buying until the jam sold out." },
      { id: "ben-home", text: "Ben went home for his lunch." },
      { id: "grandmother-help", text: "Their grandmother came over to help at the stall." },
      { id: "jars-heavy", text: "The jars became too heavy to carry." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "people-bought",
    },
    explanation: "Follow what the tasting led to. After Ivy 'offered a taste to everyone who walked past', a crowd began 'reaching for their purses', and 'the more people tasted the jam, the more jars they bought', until 'every jar was gone.' So the tasting made people buy the jam until it sold out. Ben never went home, the grandmother only made the jam and never appears at the stall, and it was the coin tin that grew heavy, not the jars.",
    metadata: {
      subject: "reading",
      strand: "Text Comprehension",
      topic: "Cause and effect",
      skill: "Identifying the effect of an action",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 85,
      tags: ["narrative", "cause and effect", "icas style"],
    },
  },
  {
    id: "icas-y3-language-c-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write the plural (more than one) of the word 'butterfly' to complete this sentence: In spring the garden is full of ___.",
    instructions: "Type one word in the gap.",
    interaction: {
      type: "fill_blank",
      segments: ["In spring the garden is full of ", "."],
      blanks: [
        {
          id: "b1",
          label: "plural of butterfly",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["butterflies"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "When a word ends in a consonant plus 'y', change the 'y' to 'i' and add 'es'. So 'butterfly' becomes 'butterflies'. Words like 'day' or 'boy' keep the 'y' and just add 's' because a vowel comes before the 'y'.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Regular plurals",
      skill: "Spelling regular plurals (-s, -es and -ies)",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["plurals", "spelling", "-ies"],
    },
  },
  {
    id: "icas-y3-language-c-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence correctly shows that the kennel belongs to one dog?",
    instructions: "Choose one sentence.",
    options: [
      { id: "one-dog", text: "The dog's kennel was warm and dry." },
      { id: "no-apos", text: "The dogs kennel was warm and dry." },
      { id: "plural-poss", text: "The dogs' kennel was warm and dry." },
      { id: "double-s", text: "The dogs's kennel was warm and dry." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "one-dog",
    },
    explanation: "To show that something belongs to one dog, add an apostrophe and then 's' to the owner: dog's kennel. 'dogs' with no apostrophe is just more than one dog, and 'dogs'' would mean the kennel belongs to several dogs.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Possessive apostrophes",
      skill: "Apostrophes to show possession",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["apostrophe", "possession", "punctuation"],
    },
  },
  {
    id: "icas-y3-language-c-003",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the question word that best completes this sentence: ___ many books can I borrow at once?",
    instructions: "Choose one answer from the list.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "gap-1",
          label: "___ many books",
          options: [
            { id: "what", text: "What" },
            { id: "how", text: "How" },
            { id: "who", text: "Who" },
            { id: "where", text: "Where" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "gap-1",
          correctOptionId: "how",
        },
      ],
    },
    explanation: "We ask about an amount with 'How many...?', so 'How many books can I borrow?' is correct. 'What', 'Who' and 'Where' do not fit before 'many' and would not ask about a number of books.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Question words",
      skill: "Choosing the correct question word",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["question words", "grammar"],
    },
  },
  {
    id: "icas-y3-language-c-004",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each word to the kind of word it is.",
    instructions: "Draw a line from each word to the correct group.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "river",
          text: "river",
        },
        {
          id: "jump",
          text: "jump",
        },
        {
          id: "happy",
          text: "happy",
        },
      ],
      targets: [
        {
          id: "noun",
          text: "a naming word (noun)",
        },
        {
          id: "verb",
          text: "a doing word (verb)",
        },
        {
          id: "adjective",
          text: "a describing word (adjective)",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "river",
          targetId: "noun",
        },
        {
          sourceId: "jump",
          targetId: "verb",
        },
        {
          sourceId: "happy",
          targetId: "adjective",
        },
      ],
    },
    explanation: "A noun names a person, place or thing, so 'river' is a noun. A verb is an action you can do, so 'jump' is a verb. An adjective describes something, so 'happy' is an adjective (a happy child).",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Word classes",
      skill: "Sorting nouns, verbs and adjectives",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["nouns", "verbs", "adjectives", "word classes"],
    },
  },
  {
    id: "icas-y3-language-c-005",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence uses 'a', 'an' and 'the' correctly?",
    instructions: "Choose one sentence.",
    options: [
      { id: "wrong-a-an", text: "I saw a owl in an tree by a pond." },
      { id: "correct", text: "I saw an owl in a tree near the pond." },
      { id: "wrong-an-an", text: "I saw an owl in an tree by a pond." },
      { id: "wrong-a-a", text: "I saw a owl in a tree by a pond." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "correct",
    },
    explanation: "Use 'an' before a vowel sound, so 'an owl'. Use 'a' before a consonant sound, so 'a tree'. The other sentences mix these up, for example 'a owl' or 'an tree', which sound wrong when you read them aloud.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Articles",
      skill: "Using the articles a, an and the",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["articles", "a", "an", "grammar"],
    },
  },
  {
    id: "icas-y3-language-c-006",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Ben is tall. His sister is taller. Their father is the ___ in the family. Which word completes the sentence?",
    instructions: "Choose one word.",
    options: [
      { id: "taller", text: "taller" },
      { id: "more-tall", text: "more tall" },
      { id: "tallest", text: "tallest" },
      { id: "most-tallest", text: "most tallest" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "tallest",
    },
    explanation: "When we compare three or more people, we use the superlative, which for short words ends in '-est': tallest. 'Taller' only compares two people, 'more tall' is not used for a short word, and 'most tallest' doubles the ending, which is incorrect.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Adjective forms",
      skill: "Comparative and superlative adjectives",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["comparative", "superlative", "adjectives"],
    },
  },
  {
    id: "icas-y3-language-c-007",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence uses the correct word: 'hear' or 'here'?",
    instructions: "Choose one sentence.",
    options: [
      { id: "wrong1", text: "Did you here the alarm this morning?" },
      { id: "wrong2", text: "Put the chairs over hear please." },
      { id: "wrong3", text: "The library is right hear beside the office." },
      { id: "correct", text: "I could not hear you in the noisy playground." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "correct",
    },
    explanation: "'Hear' is what you do with your ears, so 'I could not hear you' is correct. 'Here' means this place, as in 'over here'. The other sentences swap the two words around.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Homophones",
      skill: "Common homophones (hear and here)",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["homophones", "hear", "here", "spelling"],
    },
  },
  {
    id: "icas-y3-language-c-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the best word to join these two sentences into one: It started to rain. We went inside.",
    instructions: "Choose the joining word (conjunction) that makes sense.",
    options: [
      { id: "so", text: "so" },
      { id: "but", text: "but" },
      { id: "or", text: "or" },
      { id: "because", text: "because" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "so",
    },
    explanation: "'So' shows a result: it rained, so we went inside. 'But' shows a contrast, 'or' shows a choice, and 'because' would make the meaning back to front ('It started to rain because we went inside'), which is not what happened.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Conjunctions",
      skill: "Joining two short sentences with a conjunction",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["conjunctions", "joining", "so"],
    },
  },
  {
    id: "icas-y3-language-c-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which word best shows HOW a frightened rabbit moved? The frightened rabbit ___ into its burrow.",
    instructions: "Choose the most precise word.",
    options: [
      { id: "went", text: "went" },
      { id: "darted", text: "darted" },
      { id: "walked", text: "walked" },
      { id: "moved", text: "moved" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "darted",
    },
    explanation: "'Darted' tells us exactly how the rabbit moved: very quickly, as a frightened animal would. 'Went' and 'moved' are vague and do not show speed, and 'walked' sounds far too calm for a frightened rabbit.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Precise verbs",
      skill: "Choosing a precise verb over a vague one",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["verbs", "word choice", "vocabulary"],
    },
  },
  {
    id: "icas-y3-language-c-010",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the TWO words in which the prefix means 'again'.",
    instructions: "Choose exactly two words.",
    options: [
      { id: "disappear", text: "disappear" },
      { id: "reheat", text: "reheat" },
      { id: "redo", text: "redo" },
      { id: "dislike", text: "dislike" },
      { id: "disagree", text: "disagree" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["reheat", "redo"],
    },
    explanation: "The prefix 're-' means 'again', so 'reheat' means heat again and 'redo' means do again. The prefix 'dis-' means 'not' or 'the opposite of', so 'dislike', 'disagree' and 'disappear' do not mean 'again'.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Prefixes",
      skill: "The prefixes re- and dis-",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["prefix", "re-", "dis-", "meaning"],
    },
  },
  {
    id: "icas-y3-language-c-011",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the correct word for each gap by adding the right ending.",
    instructions: "Choose one answer for each gap.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "gap-paint",
          label: "A person who paints is a ___.",
          options: [
            { id: "painter", text: "painter" },
            { id: "paintful", text: "paintful" },
            { id: "painting", text: "painting" },
            { id: "paintless", text: "paintless" },
          ],
        },
        {
          id: "gap-joy",
          label: "A day that is full of joy is a ___ day.",
          options: [
            { id: "joyer", text: "joyer" },
            { id: "joyful", text: "joyful" },
            { id: "joying", text: "joying" },
            { id: "joyless", text: "joyless" },
          ],
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "gap-paint",
          correctOptionId: "painter",
        },
        {
          id: "gap-joy",
          correctOptionId: "joyful",
        },
      ],
    },
    explanation: "The ending '-er' can mean 'a person who does something', so someone who paints is a painter. The ending '-ful' means 'full of', so a day full of joy is a joyful day. 'Joyless' means without joy, which is the opposite.",
    metadata: {
      subject: "language_conventions",
      strand: "Spelling",
      topic: "Suffixes",
      skill: "The suffixes -ful and -er",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["suffix", "-ful", "-er", "word building"],
    },
  },
  {
    id: "icas-y3-language-c-012",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Write 'they will' as one word (a contraction) to complete this sentence: I hope ___ visit us soon.",
    instructions: "Type one word, and remember the apostrophe.",
    interaction: {
      type: "fill_blank",
      segments: ["I hope ", " visit us soon."],
      blanks: [
        {
          id: "b1",
          label: "contraction of they will",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "b1",
          acceptedAnswers: ["they'll"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "A contraction joins two words and uses an apostrophe to show the missing letters. 'They will' becomes 'they'll', where the apostrophe stands in for 'wi'. In the same way, 'he is' becomes 'he's'.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Contractions",
      skill: "Contractions with is and will",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["contraction", "will", "apostrophe"],
    },
  },
  {
    id: "icas-y3-language-c-013",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these words in alphabetical order, starting with the word that comes first in a dictionary.",
    instructions: "All four words begin with 'c', so look carefully at the second letter.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "cloud",
          text: "cloud",
        },
        {
          id: "cat",
          text: "cat",
        },
        {
          id: "crown",
          text: "crown",
        },
        {
          id: "city",
          text: "city",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["cat", "city", "cloud", "crown"],
    },
    explanation: "When words start with the same letter, compare the next letter. After 'c' the second letters are a, i, l and r: 'cat' (a), 'city' (i), 'cloud' (l), 'crown' (r). Reading them in that order gives the alphabetical list.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Dictionary skills",
      skill: "Putting words in alphabetical order",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["alphabetical order", "dictionary", "second letter"],
    },
  },
  {
    id: "icas-y3-language-c-014",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Clap the beats as you say the word 'kangaroo'. How many syllables does it have?",
    instructions: "Write your answer as a number.",
    visuals: [],
    answerKey: {
      kind: "number",
      value: 3,
      tolerance: 0,
    },
    explanation: "Each syllable is one beat you can clap. 'Kangaroo' breaks into kan-ga-roo, which is three beats, so it has three syllables.",
    metadata: {
      subject: "language_conventions",
      strand: "Phonics",
      topic: "Syllables",
      skill: "Counting syllables in a word",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["syllables", "beats", "phonics"],
    },
  },
  {
    id: "g3-icas-lang-apos-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Nina wrote this sentence: \"The kitten couldnt reach its bowl.\" Which word needs an apostrophe?",
    instructions: "Choose one word.",
    options: [
      { id: "couldnt", text: "couldnt" },
      { id: "reach", text: "reach" },
      { id: "its", text: "its" },
      { id: "bowl", text: "bowl" },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "couldnt",
    },
    explanation: "\"Couldnt\" is a short way of writing \"could not\". The apostrophe stands in place of the missing letter o, so it must be written couldn't. The word \"its\" here shows that the bowl belongs to the kitten, and possessive \"its\" never takes an apostrophe.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Apostrophes in contractions",
      skill: "lang.prod.punctuation.contractions",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["apostrophe", "contraction", "punctuation"],
    },
  },
  {
    id: "g3-icas-lang-comma-001",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the punctuation mark that makes this list correct: \"Mia had a pencil ___ a ruler and a rubber in her bag.\"",
    instructions: "Choose one answer from the list.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "gap-1",
          label: "a pencil ___ a ruler",
          options: [
            { id: "comma", text: "a comma ( , )" },
            { id: "full-stop", text: "a full stop ( . )" },
            { id: "question-mark", text: "a question mark ( ? )" },
            { id: "exclamation", text: "an exclamation mark ( ! )" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "gap-1",
          correctOptionId: "comma",
        },
      ],
    },
    explanation: "When we list three or more things in a sentence, a comma separates them and the word \"and\" joins the last two: a pencil, a ruler and a rubber. A full stop would end the sentence too early.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Commas in lists",
      skill: "lang.prod.punctuation.commas-in-lists",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["comma", "lists", "punctuation"],
    },
  },
  {
    id: "g3-icas-lang-speech-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence puts the speech marks in the right place?",
    instructions: "Only the words a person actually says belong inside speech marks.",
    options: [
      { id: "verb-inside", text: "\"Where is my hat? asked Tom.\"" },
      { id: "correct-form", text: "\"Where is my hat?\" asked Tom." },
      { id: "verb-only", text: "Where is my hat? \"asked Tom.\"" },
      { id: "mark-outside", text: "\"Where is my hat\"? asked Tom." },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "correct-form",
    },
    explanation: "Tom says only the words \"Where is my hat?\", so only those words sit inside the speech marks. Because the words he says are a question, the question mark goes inside the closing speech mark too. The words \"asked Tom\" tell us who spoke, so they stay outside.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Speech marks in direct speech",
      skill: "lang.prod.punctuation.speech-marks",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["speech-marks", "dialogue", "punctuation"],
    },
  },
  {
    id: "g3-icas-lang-endmark-001",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each group of words to the punctuation mark it needs at the end.",
    instructions: "Each sentence matches one mark.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "asking",
          text: "Where did you put the keys",
        },
        {
          id: "telling",
          text: "The bus arrives at nine o'clock",
        },
        {
          id: "exclaiming",
          text: "What a huge wave that was",
        },
      ],
      targets: [
        {
          id: "question-mark",
          text: "question mark ( ? )",
        },
        {
          id: "full-stop",
          text: "full stop ( . )",
        },
        {
          id: "exclamation-mark",
          text: "exclamation mark ( ! )",
        },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "asking",
          targetId: "question-mark",
        },
        {
          sourceId: "telling",
          targetId: "full-stop",
        },
        {
          sourceId: "exclaiming",
          targetId: "exclamation-mark",
        },
      ],
    },
    explanation: "\"Where did you put the keys\" asks something, so it needs a question mark. \"The bus arrives at nine o'clock\" simply tells us something, so it needs a full stop. Sentences that begin with \"What a...\" are exclamations showing strong feeling, so they need an exclamation mark.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Sentence end punctuation",
      skill: "lit.grammar.full-stops-question-marks",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["end-punctuation", "sentence-types"],
    },
  },
  {
    id: "g3-icas-lang-tense-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Use the verb \"go\" in both gaps, changing it so the sentence makes sense.",
    instructions: "Look carefully at the time words \"Yesterday\" and \"tomorrow\". Use only the verb \"go\".",
    interaction: {
      type: "fill_blank",
      segments: ["Yesterday the class ", " to the museum, and tomorrow they ", " to the zoo."],
      blanks: [
        {
          id: "past-verb",
          label: "verb after \"Yesterday the class\"",
        },
        {
          id: "future-verb",
          label: "verb after \"tomorrow they\"",
        },
      ],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [
        {
          id: "past-verb",
          acceptedAnswers: ["went"],
        },
        {
          id: "future-verb",
          acceptedAnswers: ["will go", "are going", "will be going", "go"],
        },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "\"Yesterday\" tells us the trip already happened, so \"go\" changes to its past form: went. \"Tomorrow\" tells us the trip has not happened yet, so \"go\" needs a helping word to show the future: will go. Time words like these are the clue to which tense you need.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Verb tense",
      skill: "lang.prod.grammar.verb-tense",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["verbs", "tense", "grammar"],
    },
  },
  {
    id: "g3-icas-lang-agree-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sentence is written correctly?",
    instructions: "Think about what the sentence is really about.",
    options: [
      { id: "are-form", text: "The box of crayons are on the shelf." },
      { id: "were-form", text: "The box of crayons were on the shelf." },
      { id: "is-form", text: "The box of crayons is on the shelf." },
      { id: "been-form", text: "The box of crayons been on the shelf." },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "is-form",
    },
    explanation: "The sentence is about one box, not about the crayons. \"Crayons\" only tells us what is inside the box. Because \"box\" is one thing, the correct verb is \"is\". A useful trick is to cover the words \"of crayons\" and read the sentence again.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Subject-verb agreement",
      skill: "lang.prod.grammar.subject-verb-agreement",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["agreement", "verbs", "grammar"],
    },
  },
  {
    id: "g3-icas-lang-plural-001",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select every word below that already means more than one.",
    instructions: "There is more than one correct answer.",
    options: [
      { id: "tooth", text: "tooth" },
      { id: "feet", text: "feet" },
      { id: "mice", text: "mice" },
      { id: "child", text: "child" },
      { id: "geese", text: "geese" },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["mice", "geese", "feet"],
    },
    explanation: "Mice, geese and feet are already plural: one mouse becomes mice, one goose becomes geese, and one foot becomes feet. These words change their spelling instead of adding an s. \"Child\" and \"tooth\" each name only one thing; their plurals are children and teeth.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Irregular plurals",
      skill: "lang.prod.grammar.irregular-plurals",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["plurals", "nouns", "grammar"],
    },
  },
  {
    id: "g3-icas-lang-pronoun-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Anna said to Priya, \"You have won the spelling contest.\" Who won the contest?",
    instructions: "Think about who the word \"you\" is speaking to.",
    options: [
      { id: "priya", text: "Priya" },
      { id: "anna", text: "Anna" },
      { id: "both-girls", text: "Both girls together" },
      { id: "nobody", text: "Nobody won" },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "priya",
    },
    explanation: "Anna is the one speaking, and she is speaking to Priya. Inside speech marks, the word \"you\" always means the person being spoken to, so \"you\" is Priya. That makes Priya the winner.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Pronoun reference",
      skill: "lang.prod.grammar.pronoun-reference",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["pronouns", "direct-speech", "reasoning"],
    },
  },
  {
    id: "g3-icas-lang-conj-001",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the joining words that make this short story make sense: \"Sam wanted to play outside, ___ the rain had not stopped. He waited indoors ___ the sky cleared.\"",
    instructions: "Choose one word for each gap.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "gap-1",
          label: "play outside, ___ the rain",
          options: [
            { id: "but", text: "but" },
            { id: "because", text: "because" },
            { id: "so", text: "so" },
            { id: "or", text: "or" },
          ],
        },
        {
          id: "gap-2",
          label: "waited indoors ___ the sky cleared",
          options: [
            { id: "until", text: "until" },
            { id: "because", text: "because" },
            { id: "but", text: "but" },
            { id: "so", text: "so" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "gap-1",
          correctOptionId: "but",
        },
        {
          id: "gap-2",
          correctOptionId: "until",
        },
      ],
    },
    explanation: "The first gap joins two ideas that disagree: Sam wanted to play, yet the rain stopped him, so \"but\" fits. The second gap tells us how long he waited, and \"until\" shows the waiting ended when the sky cleared.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Conjunctions",
      skill: "lang.prod.grammar.conjunctions",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["conjunctions", "grammar", "reasoning"],
    },
  },
  {
    id: "g3-icas-lang-prefix-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Mia is standing outside her front door. She says, \"I need to ___ the door.\" She means the opposite of lock it. Which word should Mia use?",
    instructions: "Choose one word.",
    options: [
      { id: "relock", text: "relock" },
      { id: "unlock", text: "unlock" },
      { id: "locking", text: "locking" },
      { id: "locked", text: "locked" },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "unlock",
    },
    explanation: "A prefix is a word part added to the front of a word to change its meaning. The prefix un- means the opposite, so unlock is the opposite of lock. The prefix re- means again, so relock would mean lock it a second time.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Prefixes",
      skill: "lang.prod.vocabulary.prefixes",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["prefix", "word-parts", "vocabulary"],
    },
  },
  {
    id: "g3-icas-lang-suffix-001",
    type: "short_answer",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Complete this sentence with one word made from \"care\": \"Ben knocked the paint over because he was being ___.\" Write the word.",
    instructions: "Write one word that begins with care.",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["careless"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "The ending -less means \"without\", so careless means acting without care. That is why Ben knocked the paint over. The same ending works in hopeless and useless.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Suffixes",
      skill: "lang.prod.vocabulary.suffixes",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["suffix", "word-parts", "vocabulary"],
    },
  },
  {
    id: "g3-icas-lang-compound-001",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Join each word on the left to a word on the right to make a compound word.",
    instructions: "Each word on the left matches one word on the right.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "rain",
          text: "rain",
        },
        {
          id: "foot",
          text: "foot",
        },
        {
          id: "tooth",
          text: "tooth",
        },
      ],
      targets: [
        {
          id: "bow",
          text: "bow",
        },
        {
          id: "path",
          text: "path",
        },
        {
          id: "brush",
          text: "brush",
        },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "rain",
          targetId: "bow",
        },
        {
          sourceId: "foot",
          targetId: "path",
        },
        {
          sourceId: "tooth",
          targetId: "brush",
        },
      ],
    },
    explanation: "A compound word is made by joining two smaller words. Rain and bow make rainbow, foot and path make footpath, and tooth and brush make toothbrush. The other joins, such as rainbrush, are not real words.",
    metadata: {
      subject: "language_conventions",
      strand: "Vocabulary",
      topic: "Compound words",
      skill: "lang.prod.vocabulary.compound-words",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["compound-words", "vocabulary"],
    },
  },
  {
    id: "g3-icas-lang-fragment-001",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Read this group of words: \"Ran quickly to the bus stop.\" Is this a complete sentence?",
    instructions: "Choose true or false.",
    answerKey: {
      kind: "boolean",
      value: false,
    },
    explanation: "A complete sentence must tell us who or what did the action. This group of words tells us the action, ran quickly to the bus stop, but never says who ran. Adding a subject, such as \"Jordan ran quickly to the bus stop\", makes it a complete sentence.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Complete sentences and fragments",
      skill: "lang.prod.grammar.complete-sentences",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["sentences", "fragments", "grammar"],
    },
  },
  {
    id: "g3-icas-lang-capital-001",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "This sentence has been written without capital letters: \"on friday, mia visited sydney with her aunt.\" Select every word that should begin with a capital letter.",
    instructions: "There is more than one correct answer.",
    options: [
      { id: "friday", text: "friday" },
      { id: "mia", text: "mia" },
      { id: "sydney", text: "sydney" },
      { id: "aunt", text: "aunt" },
      { id: "on", text: "on" },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["on", "friday", "mia", "sydney"],
    },
    explanation: "\"On\" needs a capital because it is the first word of the sentence. Friday is the name of a day, Mia is a person's name, and Sydney is the name of a city, so all three are proper nouns and need capitals. The word \"aunt\" is not being used as a name here, so it stays lower case.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Capital letters",
      skill: "lang.prod.punctuation.capital-letters",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["capital-letters", "proper-nouns", "punctuation"],
    },
  },
  {
    id: "g3-icas-lang-order-001",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these word groups in order to make a question.",
    instructions: "Drag the parts into the correct order.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "you",
          text: "you",
        },
        {
          id: "have",
          text: "Have",
        },
        {
          id: "seen",
          text: "seen",
        },
        {
          id: "my-umbrella",
          text: "my umbrella?",
        },
      ],
    },
    answerKey: {
      kind: "ordering",
      optionIds: ["have", "you", "seen", "my-umbrella"],
    },
    explanation: "A question that can be answered with yes or no usually begins with a helping verb, so \"Have\" comes first. The capital letter is your clue that it starts the sentence. Next comes the person being asked, \"you\", then the action \"seen\", and finally what is being looked for: \"Have you seen my umbrella?\"",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Word order in questions",
      skill: "lang.prod.grammar.question-word-order",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["word-order", "questions", "grammar"],
    },
  },
  {
    id: "g3-icas-lang-adverb-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "In the sentence \"The old gate creaked loudly in the wind\", which word is an adverb?",
    instructions: "An adverb tells us more about the action.",
    options: [
      { id: "old", text: "old" },
      { id: "gate", text: "gate" },
      { id: "creaked", text: "creaked" },
      { id: "loudly", text: "loudly" },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "loudly",
    },
    explanation: "An adverb tells us more about a verb. The verb here is \"creaked\", and \"loudly\" tells us how the gate creaked, so \"loudly\" is the adverb. \"Old\" is an adjective because it describes the gate, and \"gate\" is a noun.",
    metadata: {
      subject: "language_conventions",
      strand: "Syntax",
      topic: "Adverbs",
      skill: "lang.prod.parts-of-speech.adverbs",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["adverbs", "adjectives", "grammar"],
    },
  },

  ...([
  {
    "id": "icas-y3-language-da-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: The two sisters share one bedroom. Which of these correctly names the bedroom that belongs to both sisters?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "opt-1",
        "text": "the sister's bedroom"
      },
      {
        "id": "opt-3",
        "text": "the sisters bedroom"
      },
      {
        "id": "opt-4",
        "text": "the sisters's bedroom"
      },
      {
        "id": "opt-2",
        "text": "the sisters' bedroom"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-2"
    },
    "explanation": "There are two sisters, so the owning word is already plural: 'sisters'. To show something belongs to a plural word that ends in s, we add just an apostrophe after the s, giving 'sisters''. Option one, 'sister's', means only one sister; option three has no apostrophe at all, so it shows no ownership; and 'sisters's' is not a form we use in English.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Possessive apostrophes",
      "skill": "Using an apostrophe to show ownership by a plural noun",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "apostrophe",
        "possession",
        "plural"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-002",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the punctuation that belongs in the gap so the sentence speaks correctly to a person by name: \"Could you please pass the ladder ___ Grandpa?\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "ladder ___ Grandpa",
          "options": [
            {
              "id": "full-stop",
              "text": "a full stop ( . )"
            },
            {
              "id": "comma",
              "text": "a comma ( , )"
            },
            {
              "id": "no-mark",
              "text": "no punctuation mark"
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
          "correctOptionId": "comma"
        }
      ]
    },
    "explanation": "When we speak straight to someone and use their name, we put a comma just before the name: 'pass the ladder, Grandpa'. A full stop would end the sentence too early, an exclamation mark would break up the question, and leaving no mark runs the words together.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Comma for direct address",
      "skill": "Using a comma before a person's name when speaking to them",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "comma",
        "direct address",
        "punctuation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence puts the speech marks in exactly the right places around the words that Tom shouted?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-3",
        "text": "\"Watch the puddle!\" shouted Tom."
      },
      {
        "id": "opt-1",
        "text": "\"Watch the puddle! shouted Tom.\""
      },
      {
        "id": "opt-2",
        "text": "\"Watch the puddle\"! shouted Tom."
      },
      {
        "id": "opt-4",
        "text": "Watch the puddle! \"shouted Tom.\""
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-3"
    },
    "explanation": "Speech marks wrap around only the exact words that are said, and the exclamation mark is part of the shout, so it stays inside: \"Watch the puddle!\". Option one keeps the marks open until after 'Tom', option two leaves the exclamation mark outside the marks, and option four wrongly puts the marks around 'shouted Tom' instead of the spoken words.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Punctuating direct speech",
      "skill": "Placing speech marks around the exact spoken words",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "speech marks",
        "direct speech",
        "punctuation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-004",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that makes the sentence match the time word 'Last weekend': \"Last weekend our whole team ___ to the beach for a picnic.\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "team ___ to the beach",
          "options": [
            {
              "id": "go",
              "text": "go"
            },
            {
              "id": "goes",
              "text": "goes"
            },
            {
              "id": "went",
              "text": "went"
            },
            {
              "id": "going",
              "text": "going"
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
          "correctOptionId": "went"
        }
      ]
    },
    "explanation": "'Last weekend' tells us the trip has already happened, so the verb must be in the past: 'went'. 'Go' and 'goes' are present tense, and 'going' cannot stand on its own here because it needs a helper word like 'were' in front of it.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Past tense verbs",
      "skill": "Matching a verb to a past-time signal word",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "tense",
        "verbs",
        "past tense"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word correctly completes this sentence? \"One of the puppies ___ chewing on my shoelace.\"",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-2",
        "text": "are"
      },
      {
        "id": "opt-1",
        "text": "is"
      },
      {
        "id": "opt-3",
        "text": "were"
      },
      {
        "id": "opt-4",
        "text": "have"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-1"
    },
    "explanation": "The word doing the action is 'One', not 'puppies'. 'One' is a single thing, so it takes 'is'. The word 'puppies' sits nearby and tempts you toward 'are' or 'were', but those go with more than one; 'have' would need a different kind of sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject-verb agreement",
      "skill": "Matching a verb to a singular subject across a nearby plural",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "agreement",
        "singular",
        "verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses the plural (more-than-one) word correctly?",
    "instructions": "Choose one sentence.",
    "options": [
      {
        "id": "opt-1",
        "text": "The farmer counted five sheeps."
      },
      {
        "id": "opt-2",
        "text": "Three mouses ran under the shed."
      },
      {
        "id": "opt-4",
        "text": "The geese flew over the lake."
      },
      {
        "id": "opt-3",
        "text": "She lost both of her front tooths."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-4"
    },
    "explanation": "Some words do not simply add -s to become plural. 'Goose' becomes 'geese', which is used correctly here. 'Sheep' stays as 'sheep' (never 'sheeps'), 'mouse' becomes 'mice' (not 'mouses'), and 'tooth' becomes 'teeth' (not 'tooths').",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Irregular plurals",
      "skill": "Recognising plurals that do not add -s",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "plurals",
        "irregular",
        "nouns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: \"Ravi gave his old bike to his little brother because it was too small for him.\" What does the word 'it' point to?",
    "instructions": "Choose one answer.",
    "options": [
      {
        "id": "opt-1",
        "text": "the road"
      },
      {
        "id": "opt-3",
        "text": "his brother"
      },
      {
        "id": "opt-4",
        "text": "Ravi"
      },
      {
        "id": "opt-2",
        "text": "the bike"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-2"
    },
    "explanation": "The word 'it' stands for a thing, not a person, so it cannot mean Ravi or his brother. The only thing that can be 'too small' and is the reason for giving it away is the bike. The road is never mentioned in the sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Pronoun reference",
      "skill": "Working out which noun a pronoun replaces",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "pronoun",
        "reference",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-008",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the joining word that shows the reason: \"We packed our raincoats ___ the sky looked stormy.\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "raincoats ___ the sky",
          "options": [
            {
              "id": "but",
              "text": "but"
            },
            {
              "id": "because",
              "text": "because"
            },
            {
              "id": "or",
              "text": "or"
            },
            {
              "id": "although",
              "text": "although"
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
          "correctOptionId": "because"
        }
      ]
    },
    "explanation": "The stormy sky is the reason we packed raincoats, and 'because' is the joining word that gives a reason. 'But' and 'although' would signal a surprise or contrast, and 'or' offers a choice, none of which fits here.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Conjunctions",
      "skill": "Choosing a conjunction that shows cause and reason",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "conjunction",
        "because",
        "reason"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word uses a prefix to mean 'the opposite of appear'?",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-1",
        "text": "disappear"
      },
      {
        "id": "opt-2",
        "text": "reappear"
      },
      {
        "id": "opt-3",
        "text": "appeared"
      },
      {
        "id": "opt-4",
        "text": "unappear"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-1"
    },
    "explanation": "The prefix 'dis-' means 'not' or 'the opposite of', so 'disappear' means to stop appearing. 'Re-' means 'again', so 'reappear' means to appear once more; 'appeared' is just the past tense; and 'unappear' is not a real English word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Prefixes",
      "skill": "Choosing the prefix that reverses a word's meaning",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "prefix",
        "dis-",
        "word meaning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-010",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add the suffix -ful to the base word 'care' and write the new word in the gap: \"Please be ___ when you cross the busy road.\"",
    "instructions": "Type one word in the gap.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "Please be ",
        " when you cross the busy road."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "be ___ when you cross"
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
            "careful"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "The suffix -ful means 'full of', and adding it to 'care' makes 'careful', which means full of care. The base word 'care' does not change its spelling when -ful is added, so no letters are dropped.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Suffixes",
      "skill": "Building a word by adding the suffix -ful",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "suffix",
        "-ful",
        "word building"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-012",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that correctly fills the gap: \"The children hung ___ wet towels on the fence.\"",
    "instructions": "Choose one answer from the list.",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap-1",
          "label": "hung ___ wet towels",
          "options": [
            {
              "id": "there",
              "text": "there"
            },
            {
              "id": "theyre",
              "text": "they're"
            },
            {
              "id": "their",
              "text": "their"
            },
            {
              "id": "theirs",
              "text": "theirs"
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
    "explanation": "'Their' shows that the towels belong to the children, which is what the sentence needs before the noun 'towels'. 'There' means a place, 'they're' is short for 'they are', and 'theirs' stands alone and cannot sit in front of a noun.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Homophones",
      "skill": "Choosing between their, there and they're",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "homophones",
        "their",
        "spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Finish the pattern. A duckling is a young duck. In the same way, a lamb is a young ___.",
    "instructions": "Choose one word.",
    "options": [
      {
        "id": "opt-1",
        "text": "cow"
      },
      {
        "id": "opt-3",
        "text": "sheep"
      },
      {
        "id": "opt-2",
        "text": "wool"
      },
      {
        "id": "opt-4",
        "text": "lamb"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-3"
    },
    "explanation": "The pattern links a baby animal to its grown-up name: a duckling grows into a duck, so a lamb grows into a sheep. 'Wool' is what a sheep grows, not the grown animal; 'cow' is a different animal; and 'lamb' just repeats the baby word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Word analogies",
      "skill": "Completing a young-animal to grown-animal analogy",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "analogy",
        "reasoning",
        "vocabulary"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-014",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: \"The tiny kitten chased a red ball.\" Which TWO words are adjectives (describing words)?",
    "instructions": "Choose exactly two words.",
    "options": [
      {
        "id": "opt-chased",
        "text": "chased"
      },
      {
        "id": "opt-red",
        "text": "red"
      },
      {
        "id": "opt-tiny",
        "text": "tiny"
      },
      {
        "id": "opt-kitten",
        "text": "kitten"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "opt-tiny",
        "opt-red"
      ]
    },
    "explanation": "An adjective describes a noun. 'Tiny' tells us more about the kitten, and 'red' tells us more about the ball, so both are adjectives. 'Kitten' and 'ball' are the nouns being described, and 'chased' is the action word (a verb).",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Adjectives",
      "skill": "Identifying adjectives within a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "adjectives",
        "word class",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-015",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these words in order to make one correct sentence that begins with a capital letter and ends with a full stop.",
    "instructions": "Drag the words into the correct order.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "w-quietly",
          "text": "quietly."
        },
        {
          "id": "w-the",
          "text": "The"
        },
        {
          "id": "w-flew",
          "text": "flew"
        },
        {
          "id": "w-owl",
          "text": "owl"
        },
        {
          "id": "w-away",
          "text": "away"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "w-the",
        "w-owl",
        "w-flew",
        "w-away",
        "w-quietly"
      ]
    },
    "explanation": "A sentence starts with the capital word 'The', then names who or what ('owl'), then tells what it did ('flew away'), and finishes with the word that tells how ('quietly.') which carries the full stop. Reading it back, 'The owl flew away quietly.' is the only order that makes sense.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Sentence structure",
      "skill": "Arranging words into a well-formed sentence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "word order",
        "sentence",
        "structure"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-da-016",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: \"Me and Jack builded a sandcastle.\" Is this sentence written in correct English?",
    "instructions": "Choose True or False.",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "The sentence has two mistakes, so it is not correct. It should begin 'Jack and I' (we name the other person first and use 'I' as the doer), and the past tense of 'build' is 'built', not 'builded'. A correct version is: 'Jack and I built a sandcastle.'",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Correcting sentences",
      "skill": "Judging whether a sentence uses correct grammar",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "irregular verbs",
        "pronouns",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: A basket belongs to one cat. Which group of words shows this correctly?",
    "options": [
      {
        "id": "cats-basket-none",
        "text": "the cats basket"
      },
      {
        "id": "cats-basket-plural",
        "text": "the cats' basket"
      },
      {
        "id": "cat-baskets",
        "text": "the cat baskets"
      },
      {
        "id": "cats-basket-apos",
        "text": "the cat's basket"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cats-basket-apos"
    },
    "explanation": "When one owner has something, add an apostrophe and then s to the owner's name: cat + 's = cat's basket. 'the cats basket' forgets the apostrophe, so it does not show ownership. 'the cats' basket' puts the apostrophe after the s, which would mean more than one cat, but there is only one. 'the cat baskets' makes basket plural and shows no owner at all.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Apostrophes for possession",
      "skill": "Showing that one owner has something with an apostrophe",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "apostrophe",
        "possession",
        "punctuation",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-002",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the mark that correctly ends this sentence: 'Have you seen my blue umbrella___'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "end mark",
          "options": [
            {
              "id": "qmark",
              "text": "?"
            },
            {
              "id": "fullstop",
              "text": "."
            },
            {
              "id": "excl",
              "text": "!"
            },
            {
              "id": "comma",
              "text": ","
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
          "id": "f1",
          "correctOptionId": "qmark"
        }
      ]
    },
    "explanation": "This sentence asks the reader something, so it needs a question mark. A full stop belongs at the end of a telling sentence, not a question. An exclamation mark shows a shout or strong feeling, which does not fit here. A comma is used inside a sentence to make a short pause, not to end one.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Sentence end marks",
      "skill": "Choosing a question mark to end a question",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 30,
      "tags": [
        "question mark",
        "end punctuation",
        "punctuation",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses capital letters correctly?",
    "options": [
      {
        "id": "cap-correct",
        "text": "Our family flew to Darwin last April."
      },
      {
        "id": "cap-none",
        "text": "our family flew to darwin last april."
      },
      {
        "id": "cap-start-only",
        "text": "Our family flew to darwin last april."
      },
      {
        "id": "cap-nouns-only",
        "text": "our family flew to Darwin last April."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cap-correct"
    },
    "explanation": "Three things need a capital letter here: the first word of the sentence (Our), the name of a place (Darwin) and the name of a month (April). The version with no capitals misses all of them. One version capitalises the first word but leaves the place and month in lower case, and another gives the place and month capitals but forgets the capital that starts the sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Capital letters",
      "skill": "Using capitals for the sentence start, places and months",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "capital letters",
        "proper nouns",
        "punctuation",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses commas correctly to separate the things in the list?",
    "options": [
      {
        "id": "list-none",
        "text": "For lunch I had a sandwich yoghurt and grapes."
      },
      {
        "id": "list-correct",
        "text": "For lunch I had a sandwich, yoghurt and grapes."
      },
      {
        "id": "list-extra",
        "text": "For lunch I had a sandwich, and yoghurt, and grapes."
      },
      {
        "id": "list-wrong",
        "text": "For lunch, I had a sandwich yoghurt, and grapes."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "list-correct"
    },
    "explanation": "When you list three things, put a comma between the items and join the last two with 'and': a sandwich, yoghurt and grapes. The version with no commas runs the items together. One version adds extra commas and an extra 'and', and another puts a comma after 'lunch' and in the wrong place, which breaks the list up incorrectly.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Commas in lists",
      "skill": "Separating items in a list with commas",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "commas",
        "lists",
        "punctuation",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-005",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word for each gap: 'It was ___ hot ___ play outside at lunchtime.'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "g1",
          "label": "first gap",
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
              "id": "two",
              "text": "two"
            }
          ]
        },
        {
          "id": "g2",
          "label": "second gap",
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
              "id": "two",
              "text": "two"
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
          "id": "g1",
          "correctOptionId": "too"
        },
        {
          "id": "g2",
          "correctOptionId": "to"
        }
      ]
    },
    "explanation": "The first gap means 'more than you want' or 'very much', which is spelled 'too'. The second gap comes just before an action word, 'play', so it needs 'to', the little word that goes in front of a verb. 'Two' is only the number 2, so it does not fit either gap. Reading it back, 'It was too hot to play' makes sense.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Homophones",
      "skill": "Choosing between too, to and two by meaning",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "homophones",
        "too to two",
        "word choice",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-006",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Write the plural (more-than-one) form of the word 'brush' to complete the sentence.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "Dad put the two paint ",
        " back in the shed."
      ],
      "blanks": [
        {
          "id": "b1",
          "label": "plural of brush"
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
            "brushes"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "A word that ends in 'sh' cannot just add a plain s, because 'brushs' is hard to say and is not correct. The rule is to add 'es', so brush becomes brushes. The same rule works for words like wish/wishes and dish/dishes.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Plural nouns",
      "skill": "Making plurals of words ending in sh by adding -es",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plurals",
        "spelling rule",
        "grammar",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-007",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each word on the left with a word on the right so that the two words join to make one real compound word. Each right-hand word is used once.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "rain",
          "text": "rain"
        },
        {
          "id": "foot",
          "text": "foot"
        },
        {
          "id": "tooth",
          "text": "tooth"
        }
      ],
      "targets": [
        {
          "id": "coat",
          "text": "coat"
        },
        {
          "id": "ball",
          "text": "ball"
        },
        {
          "id": "brush",
          "text": "brush"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "rain",
          "targetId": "coat"
        },
        {
          "sourceId": "foot",
          "targetId": "ball"
        },
        {
          "sourceId": "tooth",
          "targetId": "brush"
        }
      ]
    },
    "explanation": "A compound word is two smaller words joined to make a new word. 'rain' only makes a real word with 'coat' (raincoat) here, not raincoat's neighbours ball or brush. 'foot' only joins with 'ball' to make football. 'tooth' only joins with 'brush' to make toothbrush. Try each pair out loud and only one set makes real words.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Compound words",
      "skill": "Joining two words to make a compound word",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "compound words",
        "word building",
        "vocabulary",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-008",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these words in the correct order to make one complete sentence. The word with a capital letter begins the sentence.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "w-the",
          "text": "the"
        },
        {
          "id": "w-door",
          "text": "door"
        },
        {
          "id": "w-please",
          "text": "Please"
        },
        {
          "id": "w-classroom",
          "text": "classroom"
        },
        {
          "id": "w-close",
          "text": "close"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "w-please",
        "w-close",
        "w-the",
        "w-classroom",
        "w-door"
      ]
    },
    "explanation": "The word 'Please' has a capital letter, so it starts the sentence. A command like this puts the action word 'close' next, then names what to close: 'the classroom door'. The word 'classroom' has to sit just before 'door' because it tells us which door. Reading it back gives 'Please close the classroom door.'",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Sentence structure",
      "skill": "Ordering words to build a correct sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "sentence order",
        "word order",
        "grammar",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-009",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'There is six eggs left in the carton.' Is this sentence grammatically correct?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "'Six eggs' is more than one, so it is plural and needs the plural verb 'are': 'There are six eggs left in the carton.' We use 'is' only when talking about one thing, such as 'There is one egg left.' Because the sentence pairs a plural with 'is', it is not correct.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject-verb agreement",
      "skill": "Judging whether the verb matches a plural subject",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "subject verb agreement",
        "grammar",
        "there is there are",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word means nearly the same as 'begin'?",
    "options": [
      {
        "id": "syn-finish",
        "text": "finish"
      },
      {
        "id": "syn-continue",
        "text": "continue"
      },
      {
        "id": "syn-start",
        "text": "start"
      },
      {
        "id": "syn-complete",
        "text": "complete"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "syn-start"
    },
    "explanation": "To 'begin' something is to make it get going, and 'start' means exactly that, so they are synonyms. 'Finish' means to bring something to an end, which is the opposite. 'Continue' means to keep going with something you have already begun, not to begin it. 'Complete' also means to reach the end, so it does not match 'begin'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Synonyms",
      "skill": "Choosing a word with a similar meaning",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "synonyms",
        "word meaning",
        "vocabulary",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word means the opposite of 'ancient'?",
    "options": [
      {
        "id": "ant-elderly",
        "text": "elderly"
      },
      {
        "id": "ant-aged",
        "text": "aged"
      },
      {
        "id": "ant-historic",
        "text": "historic"
      },
      {
        "id": "ant-new",
        "text": "new"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "ant-new"
    },
    "explanation": "'Ancient' means very, very old, so its opposite is 'new'. 'Elderly' and 'aged' both describe things that are old, so they mean almost the same as ancient, not the opposite. 'Historic' means important in history, which is also linked to being old. Only 'new' points the other way.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Antonyms",
      "skill": "Choosing a word with the opposite meaning",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "antonyms",
        "opposites",
        "vocabulary",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-012",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word for each gap: 'Our dog buried ___ bone because ___ saving it for later.'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "h1",
          "label": "first gap",
          "options": [
            {
              "id": "its",
              "text": "its"
            },
            {
              "id": "its-apos",
              "text": "it's"
            }
          ]
        },
        {
          "id": "h2",
          "label": "second gap",
          "options": [
            {
              "id": "its",
              "text": "its"
            },
            {
              "id": "its-apos",
              "text": "it's"
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
          "id": "h1",
          "correctOptionId": "its"
        },
        {
          "id": "h2",
          "correctOptionId": "its-apos"
        }
      ]
    },
    "explanation": "The first gap shows that the bone belongs to the dog. The owning word is 'its', with no apostrophe, just like 'his' or 'her'. The second gap is a short way of saying 'it is saving', and the shortened form with the apostrophe is \"it's\". A good test: if you can swap in 'it is', use \"it's\"; otherwise use 'its'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Apostrophes",
      "skill": "Choosing between its and it's",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "its its'",
        "apostrophe",
        "homophones",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'The runner carefully crossed the finish line.' Which word is the adverb (it tells how the action was done)?",
    "options": [
      {
        "id": "adv-carefully",
        "text": "carefully"
      },
      {
        "id": "adv-runner",
        "text": "runner"
      },
      {
        "id": "adv-crossed",
        "text": "crossed"
      },
      {
        "id": "adv-finish",
        "text": "finish"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "adv-carefully"
    },
    "explanation": "An adverb tells us how, when or where something happens. Here 'carefully' tells us how the runner crossed, so it is the adverb. 'Runner' is a naming word (a noun), 'crossed' is the action word (a verb) and 'finish' is describing which line, so none of those is the adverb.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Word classes",
      "skill": "Identifying an adverb that tells how an action is done",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "adverbs",
        "word classes",
        "grammar",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-014",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'The baker sold fresh bread.' Which TWO words are nouns (naming words)?",
    "options": [
      {
        "id": "n-sold",
        "text": "sold"
      },
      {
        "id": "n-fresh",
        "text": "fresh"
      },
      {
        "id": "n-bread",
        "text": "bread"
      },
      {
        "id": "n-baker",
        "text": "baker"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "n-baker",
        "n-bread"
      ]
    },
    "explanation": "A noun names a person, animal, place or thing. 'Baker' names a person and 'bread' names a thing, so those two are the nouns. 'Sold' is an action word (a verb) that tells what the baker did, and 'fresh' is a describing word (an adjective) that tells us about the bread.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Word classes",
      "skill": "Identifying the nouns in a sentence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "nouns",
        "word classes",
        "grammar",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'The little grass snake was completely harmless.' What does the word harmless mean here?",
    "options": [
      {
        "id": "hl-frighten",
        "text": "very frightening"
      },
      {
        "id": "hl-full",
        "text": "full of harm"
      },
      {
        "id": "hl-without",
        "text": "not able to cause harm"
      },
      {
        "id": "hl-catch",
        "text": "hard to catch"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "hl-without"
    },
    "explanation": "The ending '-less' means 'without', so 'harmless' means 'without harm', in other words not able to hurt anyone. 'Full of harm' would be the opposite and is closer to the word 'harmful'. 'Very frightening' and 'hard to catch' describe other things about a snake, but they are not what harmless means.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Suffixes",
      "skill": "Working out meaning from the suffix -less",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "suffixes",
        "-less",
        "word meaning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dc-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Finish the pattern. A petal is part of a flower in the same way that a ___ is part of a tree.",
    "options": [
      {
        "id": "an-forest",
        "text": "forest"
      },
      {
        "id": "an-seed",
        "text": "seed"
      },
      {
        "id": "an-garden",
        "text": "garden"
      },
      {
        "id": "an-branch",
        "text": "branch"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "an-branch"
    },
    "explanation": "A petal is one piece that makes up a flower, so we need a word for one piece that makes up a tree: a branch. A forest is a group of many trees, so the tree is part of the forest, not the other way round. A seed is what a tree grows from, not a part of it, and a garden is a place where a tree might grow.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Word relationships",
      "skill": "Completing a part-to-whole analogy",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "analogy",
        "word relationships",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'We are going to the beach after lunch.' Which word is the correct short form (contraction) of the two words 'We are'?",
    "options": [
      {
        "id": "were",
        "text": "were"
      },
      {
        "id": "wer-e",
        "text": "wer'e"
      },
      {
        "id": "we-re",
        "text": "we're"
      },
      {
        "id": "weare",
        "text": "weare"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "we-re"
    },
    "explanation": "A contraction joins two words and uses an apostrophe to stand in for the letters that are dropped. 'We are' loses the 'a' from 'are', so the apostrophe goes exactly where that 'a' was: we're. 'were' is a different word with no apostrophe, 'wer'e' puts the apostrophe in the wrong spot, and 'weare' just squashes the words together with no apostrophe at all.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Apostrophes in contractions",
      "skill": "Forming a contraction from 'we are'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "apostrophe",
        "contraction",
        "punctuation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-002",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the mark that best ends this sentence: 'What a huge wave that was___'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap1",
          "label": "end mark",
          "options": [
            {
              "id": "full-stop",
              "text": "full stop ( . )"
            },
            {
              "id": "question-mark",
              "text": "question mark ( ? )"
            },
            {
              "id": "exclamation-mark",
              "text": "exclamation mark ( ! )"
            },
            {
              "id": "comma",
              "text": "comma ( , )"
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
          "id": "gap1",
          "correctOptionId": "exclamation-mark"
        }
      ]
    },
    "explanation": "A sentence that begins 'What a...' and shows strong feeling or surprise is an exclamation, so it ends with an exclamation mark. A full stop would suit a plain statement, a question mark is only for a question (this sentence does not ask anything), and a comma cannot end a sentence at all.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "End punctuation and sentence type",
      "skill": "Choosing an exclamation mark for an exclamation",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "exclamation",
        "end punctuation",
        "sentence type"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-003",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the word that makes this sentence correct: 'The box of coloured pencils ___ on the shelf.'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap1",
          "label": "verb",
          "options": [
            {
              "id": "are",
              "text": "are"
            },
            {
              "id": "is",
              "text": "is"
            },
            {
              "id": "were",
              "text": "were"
            },
            {
              "id": "sit",
              "text": "sit"
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
          "id": "gap1",
          "correctOptionId": "is"
        }
      ]
    },
    "explanation": "The subject of the sentence is 'the box', which is one thing, so it needs the singular verb 'is': 'The box ... is on the shelf.' The words 'of coloured pencils' just describe the box and do not change what the verb must match. 'are' and 'were' match more than one thing, and 'sit' would need to be 'sits' for one box.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject-verb agreement",
      "skill": "Matching a verb to a singular subject across a plural phrase",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "subject-verb agreement",
        "singular",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses the words 'I' and 'me' correctly?",
    "options": [
      {
        "id": "and-i",
        "text": "Mum drove Priya and I to the market."
      },
      {
        "id": "i-first",
        "text": "Mum drove I and Priya to the market."
      },
      {
        "id": "me-subject",
        "text": "Me and Priya was driven to the market."
      },
      {
        "id": "and-me",
        "text": "Mum drove Priya and me to the market."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "and-me"
    },
    "explanation": "Here the person is receiving the action ('Mum drove ___'), so the object word 'me' is needed: 'Mum drove Priya and me.' A quick test is to drop the other person and read it alone: 'Mum drove me' sounds right, but 'Mum drove I' does not. 'I and Priya' also puts the words in the wrong order, and 'Me and Priya was' uses the wrong word as the subject and the wrong verb.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject and object pronouns",
      "skill": "Choosing 'me' as the object in a pair",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "pronoun",
        "object pronoun",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word means nearly the same as 'chilly'?",
    "options": [
      {
        "id": "cool",
        "text": "cool"
      },
      {
        "id": "damp",
        "text": "damp"
      },
      {
        "id": "windy",
        "text": "windy"
      },
      {
        "id": "sunny",
        "text": "sunny"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cool"
    },
    "explanation": "'Chilly' means a little bit cold, so the closest word in meaning is 'cool'. The other words describe weather too, but they mean different things: 'damp' means slightly wet, 'windy' means there is a lot of wind, and 'sunny' means full of sunshine. Only 'cool' is about being cold.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Synonyms",
      "skill": "Finding a synonym for 'chilly'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "synonym",
        "vocabulary",
        "word meaning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word means the opposite of 'shrink'?",
    "options": [
      {
        "id": "fold",
        "text": "fold"
      },
      {
        "id": "grow",
        "text": "grow"
      },
      {
        "id": "shine",
        "text": "shine"
      },
      {
        "id": "drop",
        "text": "drop"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "grow"
    },
    "explanation": "To 'shrink' is to get smaller, so its opposite is to 'grow', which is to get bigger. 'fold' means to bend something over, 'shine' means to give out light, and 'drop' means to fall or let go. None of those is about size, so 'grow' is the only opposite.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Antonyms",
      "skill": "Finding the opposite of 'shrink'",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "antonym",
        "opposite",
        "vocabulary"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'The teacher asked us to rewrite the messy sentence.' What does the prefix 're-' add to the meaning of the word 'write' here?",
    "options": [
      {
        "id": "neatly",
        "text": "write it neatly"
      },
      {
        "id": "not",
        "text": "not write it"
      },
      {
        "id": "again",
        "text": "write it again"
      },
      {
        "id": "fast",
        "text": "write it fast"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "again"
    },
    "explanation": "The prefix 're-' means 'again', so 'rewrite' means to write it again. The prefix itself says nothing about being neat, fast, or stopping; those ideas come from other words, not from 're-'. Even though the sentence mentions a messy sentence, the word 'rewrite' only tells us the writing is done a second time.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Prefixes",
      "skill": "Understanding the prefix 're-' meaning 'again'",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "prefix",
        "re-",
        "word meaning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-008",
    "type": "fill_blank",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Add the ending -er to the word 'garden' to make a word that names a person who works in a garden. Write the new word in the gap.",
    "interaction": {
      "type": "fill_blank",
      "segments": [
        "My aunt grows roses and vegetables; she is a keen ",
        "."
      ],
      "blanks": [
        {
          "id": "blank1",
          "label": "person who works in a garden"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "fill_blank",
      "blanks": [
        {
          "id": "blank1",
          "acceptedAnswers": [
            "gardener"
          ]
        }
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "Adding the suffix -er to some words makes a word for a person who does that thing. 'Garden' plus '-er' becomes 'gardener', a person who works in a garden. You keep the whole base word 'garden' and simply add the three letters 'e-r' on the end.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Suffixes that name people",
      "skill": "Adding the suffix -er to make 'gardener'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "suffix",
        "-er",
        "word building"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-009",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each word on the left with a word on the right so that the two words join to make one compound word. Each word is used once.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "rain",
          "text": "rain"
        },
        {
          "id": "foot",
          "text": "foot"
        },
        {
          "id": "tooth",
          "text": "tooth"
        },
        {
          "id": "sun",
          "text": "sun"
        }
      ],
      "targets": [
        {
          "id": "coat",
          "text": "coat"
        },
        {
          "id": "ball",
          "text": "ball"
        },
        {
          "id": "brush",
          "text": "brush"
        },
        {
          "id": "flower",
          "text": "flower"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "rain",
          "targetId": "coat"
        },
        {
          "sourceId": "foot",
          "targetId": "ball"
        },
        {
          "sourceId": "tooth",
          "targetId": "brush"
        },
        {
          "sourceId": "sun",
          "targetId": "flower"
        }
      ]
    },
    "explanation": "A compound word is one word made by joining two smaller words. Only one pairing works for each: rain + coat = raincoat, foot + ball = football, tooth + brush = toothbrush, and sun + flower = sunflower. If you try any other pairing, such as 'rainbrush' or 'sunball', you do not get a real word, so this is the only complete set that works.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Compound words",
      "skill": "Joining two words to form a compound word",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "compound word",
        "word building",
        "matching"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-010",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "instructions": "Put the words in order to make one correct sentence. The word with a capital letter begins the sentence, and it ends with a full stop.",
    "prompt": "Arrange these words to make one complete, correct sentence.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "peeled",
          "text": "peeled"
        },
        {
          "id": "monkey",
          "text": "monkey"
        },
        {
          "id": "the",
          "text": "The"
        },
        {
          "id": "banana",
          "text": "banana"
        },
        {
          "id": "clever",
          "text": "clever"
        },
        {
          "id": "a",
          "text": "a"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "the",
        "clever",
        "monkey",
        "peeled",
        "a",
        "banana"
      ]
    },
    "explanation": "Start with the capitalised word 'The' because that word begins a sentence. Then place the words so they make sense: 'The clever monkey' names who did something, 'peeled' is the action, and 'a banana' is what was peeled. Read it back to check: 'The clever monkey peeled a banana.' This is the only order that makes a correct sentence.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Sentence construction",
      "skill": "Ordering words into a well-formed sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "sentence order",
        "word order",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-011",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'She quickly runned to catch the bus.' Is this sentence written in correct English?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "The sentence is not correct because 'runned' is not a real word. 'Run' is an irregular verb, so its past-tense form is 'ran', not 'run' + 'ed'. The correct sentence is 'She quickly ran to catch the bus.'",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Irregular past-tense verbs",
      "skill": "Judging the past tense of an irregular verb",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "past tense",
        "irregular verb",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence: 'The little puppy barked and jumped at the wooden gate.' Which TWO words are verbs (doing words)?",
    "options": [
      {
        "id": "wooden",
        "text": "wooden"
      },
      {
        "id": "little",
        "text": "little"
      },
      {
        "id": "barked",
        "text": "barked"
      },
      {
        "id": "jumped",
        "text": "jumped"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "barked",
        "jumped"
      ]
    },
    "explanation": "A verb tells what someone or something does. In this sentence the puppy 'barked' and 'jumped', so those two words are the verbs. 'little' and 'wooden' are describing words (adjectives): 'little' describes the puppy and 'wooden' describes the gate, but neither shows an action.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Word classes",
      "skill": "Identifying the verbs in a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "verb",
        "word class",
        "grammar"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-013",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the correct word for each gap: '___ going to love this book, and ___ best friend will too.'",
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "gap1",
          "label": "first gap",
          "options": [
            {
              "id": "your",
              "text": "Your"
            },
            {
              "id": "youre",
              "text": "You're"
            }
          ]
        },
        {
          "id": "gap2",
          "label": "second gap",
          "options": [
            {
              "id": "your",
              "text": "your"
            },
            {
              "id": "youre",
              "text": "you're"
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
          "id": "gap1",
          "correctOptionId": "youre"
        },
        {
          "id": "gap2",
          "correctOptionId": "your"
        }
      ]
    },
    "explanation": "'You're' is short for 'you are', so the first gap needs 'You're' because 'You are going to love this book' makes sense. 'Your' shows that something belongs to you, so the second gap needs 'your' before 'best friend'. A good test is to try 'you are' in each gap: it fits the first gap but not the second.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Homophones your and you're",
      "skill": "Choosing between 'your' and 'you're'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 65,
      "tags": [
        "homophone",
        "apostrophe",
        "your"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Finish the pattern. 'Up' is the opposite of 'down' in the same way that 'empty' is the opposite of ___.",
    "options": [
      {
        "id": "full",
        "text": "full"
      },
      {
        "id": "cup",
        "text": "cup"
      },
      {
        "id": "spill",
        "text": "spill"
      },
      {
        "id": "box",
        "text": "box"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "full"
    },
    "explanation": "The pattern uses opposites: 'up' and 'down' are opposites, so 'empty' needs its opposite too. The opposite of 'empty' is 'full'. 'cup' and 'box' are things that can be empty or full, and 'spill' is something that can happen, but none of them is the opposite of 'empty'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Analogies with opposites",
      "skill": "Completing an opposite-word analogy",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "analogy",
        "opposite",
        "word reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-015",
    "type": "short_answer",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "instructions": "Write only one word.",
    "prompt": "Write the correct plural (more-than-one) form of the word 'foot' to complete this sentence: 'When it rains, I keep both my ___ dry.'",
    "visuals": [],
    "answerKey": {
      "kind": "text",
      "acceptableAnswers": [
        "feet"
      ],
      "caseSensitive": false,
      "trimWhitespace": true
    },
    "explanation": "'Foot' is an irregular noun, which means it does not add '-s' to become more than one. The plural of 'foot' is 'feet', so the sentence reads 'both my feet dry'. Writing 'foots' would be wrong because 'foot' changes its spelling instead of adding a letter.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Irregular plurals",
      "skill": "Writing the irregular plural of 'foot'",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "plural",
        "irregular noun",
        "spelling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-dd-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which line shows two complete sentences written correctly?",
    "options": [
      {
        "id": "no-caps",
        "text": "we washed the car. it looked shiny."
      },
      {
        "id": "correct",
        "text": "We washed the car. It looked shiny."
      },
      {
        "id": "run-on",
        "text": "We washed the car it looked shiny."
      },
      {
        "id": "comma-splice",
        "text": "We washed the car, it looked shiny."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "Two separate sentences each need a capital letter at the start and a full stop at the end. Only 'We washed the car. It looked shiny.' does both. The first choice forgets the capital letters, the second joins the ideas with no full stop between them (a run-on), and the last one uses only a comma where a full stop is needed.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Sentence boundaries",
      "skill": "Using capitals and full stops to separate sentences",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "full stop",
        "capital letter",
        "sentence boundary"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses the correct verb form?",
    "options": [
      {
        "id": "dogs-was",
        "text": "The two dogs was barking at the postman."
      },
      {
        "id": "dog-were",
        "text": "The two dog were barking at the postman."
      },
      {
        "id": "dogs-is",
        "text": "The two dogs is barking at the postman."
      },
      {
        "id": "dogs-were",
        "text": "The two dogs were barking at the postman."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "dogs-were"
    },
    "explanation": "The subject 'two dogs' is plural, so it needs the plural verb 'were'. 'Was' and 'is' are singular verbs, and 'dog' should be 'dogs' to match 'two'. Match the verb to how many the subject names.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject-verb agreement",
      "skill": "Choose the grammatically correct sentence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "agreement",
        "verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence shows the spoken words and punctuation correctly?",
    "options": [
      {
        "id": "correct",
        "text": "\"Watch out!\" yelled Mia."
      },
      {
        "id": "inside-tag",
        "text": "\"Watch out! yelled Mia.\""
      },
      {
        "id": "mark-outside",
        "text": "\"Watch out\"! yelled Mia."
      },
      {
        "id": "tag-quoted",
        "text": "Watch out! \"yelled Mia.\""
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "Only the exact spoken words go inside the speech marks, and the exclamation mark belongs to what Mia said, so it sits just before the closing speech mark: \"Watch out!\" The words 'yelled Mia' tell who spoke and stay outside the marks.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Direct speech punctuation",
      "skill": "Punctuate direct speech correctly",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "punctuation",
        "direct speech",
        "speech marks"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses commas correctly to separate the items in the list?",
    "options": [
      {
        "id": "comma-after-we",
        "text": "For the trip we, packed sandwiches, fruit and a warm jacket."
      },
      {
        "id": "correct",
        "text": "For the trip we packed sandwiches, fruit and a warm jacket."
      },
      {
        "id": "split-item",
        "text": "For the trip we packed sandwiches fruit, and a warm jacket."
      },
      {
        "id": "extra-commas",
        "text": "For the trip, we packed, sandwiches fruit and a warm jacket."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "Commas separate the different things in a list. The three items are 'sandwiches', 'fruit' and 'a warm jacket', so a comma goes after 'sandwiches' and the word 'and' joins the last item. Commas should not split a single item like 'sandwiches fruit' or break up 'we packed'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Commas in lists",
      "skill": "Punctuate items in a list",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "punctuation",
        "commas",
        "lists"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the connective that best joins the ideas: 'I wanted to ride my bike ___ it started to pour with rain.'",
    "options": [
      {
        "id": "because",
        "text": "because"
      },
      {
        "id": "and",
        "text": "and"
      },
      {
        "id": "but",
        "text": "but"
      },
      {
        "id": "so",
        "text": "so"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "but"
    },
    "explanation": "The two ideas disagree: wanting to ride, then rain stopping the plan. 'But' signals that contrast. 'Because' would give a reason, 'so' would give a result, and 'and' would simply add ideas without showing the problem.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Connectives",
      "skill": "Choose the correct connective to join ideas",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "grammar",
        "connectives",
        "conjunctions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word should replace the underlined word to fix the sentence? 'Yesterday we goed to the markets and bought fresh mangoes.'",
    "options": [
      {
        "id": "gone",
        "text": "gone"
      },
      {
        "id": "going",
        "text": "going"
      },
      {
        "id": "goes",
        "text": "goes"
      },
      {
        "id": "went",
        "text": "went"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "went"
    },
    "explanation": "'Go' is an irregular verb, so its past tense is not 'goed' but 'went'. The word 'Yesterday' tells us the action already happened. 'Gone' needs a helper like 'have', and 'going'/'goes' are not past tense.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Past tense verbs",
      "skill": "Fix a tense error in a sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "grammar",
        "tense",
        "irregular verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word shows the smallest amount of happiness?",
    "options": [
      {
        "id": "pleased",
        "text": "pleased"
      },
      {
        "id": "overjoyed",
        "text": "overjoyed"
      },
      {
        "id": "delighted",
        "text": "delighted"
      },
      {
        "id": "thrilled",
        "text": "thrilled"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "pleased"
    },
    "explanation": "All four words mean happy, but they show different strengths. 'Pleased' is a mild, quiet happiness. 'Delighted', 'thrilled' and 'overjoyed' each describe a much stronger, more excited feeling. Ranking shades of meaning helps you pick the gentlest word.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Shades of meaning",
      "skill": "Precise word choice and shades of meaning",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "vocabulary",
        "word choice",
        "shades of meaning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the best word to complete the sentence: 'The path was muddy, ___ we wore our gumboots.'",
    "options": [
      {
        "id": "but",
        "text": "but"
      },
      {
        "id": "so",
        "text": "so"
      },
      {
        "id": "or",
        "text": "or"
      },
      {
        "id": "although",
        "text": "although"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "so"
    },
    "explanation": "The muddy path is the reason and wearing gumboots is the result, so the linking word 'so' fits. 'But' and 'although' show a contrast, and 'or' offers a choice, none of which matches a cause leading to a sensible action.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Conjunctions",
      "skill": "Choose the correct conjunction to join ideas",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "grammar",
        "conjunctions",
        "cause and effect"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence is written correctly?",
    "options": [
      {
        "id": "bring",
        "text": "Each of the players bring a water bottle."
      },
      {
        "id": "player-brings",
        "text": "Each of the player brings a water bottle."
      },
      {
        "id": "correct",
        "text": "Each of the players brings a water bottle."
      },
      {
        "id": "are-bringing",
        "text": "Each of the players are bringing a bottle."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "'Each' points to one person at a time, so it takes the singular verb 'brings', even though 'players' sits nearby. That is why 'bring' and 'are' are wrong. 'Player' should stay as 'players' after the word 'of the'.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Subject-verb agreement",
      "skill": "Fix an agreement error in a sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "grammar",
        "agreement",
        "each"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence uses correct punctuation for the spoken words?",
    "options": [
      {
        "id": "no-commas",
        "text": "\"When the bell rings\" said Mr Lee \"line up quietly.\""
      },
      {
        "id": "not-quoted",
        "text": "\"When the bell rings,\" said Mr Lee, line up quietly."
      },
      {
        "id": "wrong-capital",
        "text": "\"When the bell rings,\" said Mr Lee, \"Line up quietly.\""
      },
      {
        "id": "correct",
        "text": "\"When the bell rings,\" said Mr Lee, \"line up quietly.\""
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "When a spoken sentence is split by 'said Mr Lee', a comma goes before each set of speech marks, and the second part carries on the same sentence so it starts with a lower-case 'line'. The words 'line up quietly' are spoken, so they must stay inside speech marks.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Interrupted direct speech",
      "skill": "Punctuate direct speech correctly",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "punctuation",
        "direct speech",
        "commas"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which word means to walk in a slow, relaxed way?",
    "options": [
      {
        "id": "stroll",
        "text": "stroll"
      },
      {
        "id": "dash",
        "text": "dash"
      },
      {
        "id": "sprint",
        "text": "sprint"
      },
      {
        "id": "march",
        "text": "march"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "stroll"
    },
    "explanation": "All four words describe ways of moving on foot, but only 'stroll' means to walk slowly and calmly. 'Dash' and 'sprint' mean to move very fast, and 'march' means to walk in a firm, steady, marching way. Matching the exact meaning is the key.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Vocabulary",
      "topic": "Shades of meaning",
      "skill": "Precise word choice and shades of meaning",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "vocabulary",
        "verbs",
        "word choice"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which sentence is grammatically correct?",
    "options": [
      {
        "id": "no",
        "text": "We didn't see no kangaroos at the park."
      },
      {
        "id": "correct",
        "text": "We didn't see any kangaroos at the park."
      },
      {
        "id": "saw",
        "text": "We didn't saw any kangaroos at the park."
      },
      {
        "id": "none",
        "text": "We didn't see none kangaroos at the park."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "'Didn't' already makes the sentence negative, so we use 'any', not a second negative word like 'no' or 'none'. Also, after 'didn't' we use the base verb 'see', not 'saw'. Using two negatives together is the common error to avoid.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Negatives",
      "skill": "Choose the grammatically correct sentence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "grammar",
        "double negative",
        "verbs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose the verb form that fits: 'By the time we arrived, the show had already ___.'",
    "options": [
      {
        "id": "began",
        "text": "began"
      },
      {
        "id": "begin",
        "text": "begin"
      },
      {
        "id": "begun",
        "text": "begun"
      },
      {
        "id": "beginning",
        "text": "beginning"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "begun"
    },
    "explanation": "The helper word 'had' needs the past-participle form 'begun', not the plain past tense 'began'. 'Begin' is present tense and 'beginning' needs a helper like 'was'. So 'had begun' correctly shows the show started before we arrived.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Verb forms",
      "skill": "Fix a tense error in a sentence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "grammar",
        "tense",
        "past participle"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-language-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Three girls left their bags on the bus. Which sentence shows the apostrophe correctly?",
    "options": [
      {
        "id": "none",
        "text": "The three girls bags were left on the bus."
      },
      {
        "id": "singular",
        "text": "The three girl's bags were left on the bus."
      },
      {
        "id": "double",
        "text": "The three girls's bags were left on the bus."
      },
      {
        "id": "correct",
        "text": "The three girls' bags were left on the bus."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "correct"
    },
    "explanation": "The bags belong to more than one girl. For a plural word that already ends in 's', we add just an apostrophe after the 's' to show belonging: girls'. 'Girl's' would mean only one girl, and 'girls's' adds an extra 's' that is not needed.",
    "metadata": {
      "subject": "language_conventions",
      "strand": "Syntax",
      "topic": "Apostrophes for possession",
      "skill": "Punctuate possession correctly",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 65,
      "tags": [
        "punctuation",
        "apostrophe",
        "plural possessive"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
  ...([
  {
    "id": "icas-y3-reading-db-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How did Maya feel when the kite spun away over the trees?",
    "stimulus": {
      "title": "The Kite That Got Away",
      "body": "Maya had saved her pocket money for weeks to buy the red kite in the shop window. On Saturday, she raced to the park with her little brother, Sam. The wind was strong and the kite leapt into the sky at once. Maya laughed as it climbed higher and higher.\n\nThen a gust tugged the string right out of her hands. The kite spun away over the tall gum trees and vanished. Maya's smile faded. She stared at the empty sky, her shoulders drooping.\n\nSam patted her arm. \"Don't worry,\" he said. He pointed to a boy near the pond who was untangling something red from a bush. It was the kite! The boy carried it back and handed it to Maya. \"The wind sent it to me,\" he grinned. \"You should tie the string to your wrist next time.\"\n\nMaya thanked him and wound the string carefully around her wrist.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "Excited and proud"
      },
      {
        "id": "c",
        "text": "Cross and jealous"
      },
      {
        "id": "b",
        "text": "Sad and let down"
      },
      {
        "id": "d",
        "text": "Calm and relaxed"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "The story does not use the word 'sad', so look for clues about her body and face. Her 'smile faded' and her 'shoulders drooping' show she felt sad and let down. She was happy before, so 'excited' does not fit, and nothing shows her being angry or jealous of anyone.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Narrative inference",
      "skill": "Infer a character's feeling",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "narrative",
        "inference",
        "feeling",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-002",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did the kite fly out of Maya's hands?",
    "stimulus": {
      "title": "The Kite That Got Away",
      "body": "Maya had saved her pocket money for weeks to buy the red kite in the shop window. On Saturday, she raced to the park with her little brother, Sam. The wind was strong and the kite leapt into the sky at once. Maya laughed as it climbed higher and higher.\n\nThen a gust tugged the string right out of her hands. The kite spun away over the tall gum trees and vanished. Maya's smile faded. She stared at the empty sky, her shoulders drooping.\n\nSam patted her arm. \"Don't worry,\" he said. He pointed to a boy near the pond who was untangling something red from a bush. It was the kite! The boy carried it back and handed it to Maya. \"The wind sent it to me,\" he grinned. \"You should tie the string to your wrist next time.\"\n\nMaya thanked him and wound the string carefully around her wrist.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "b",
        "text": "Sam grabbed it out of her hands."
      },
      {
        "id": "c",
        "text": "She dropped it to help Sam."
      },
      {
        "id": "d",
        "text": "The string snapped in half."
      },
      {
        "id": "a",
        "text": "A sudden gust tugged the string free."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "Find the sentence that tells what happened: 'a gust tugged the string right out of her hands.' A gust is a strong burst of wind. The story never says Sam took it, that she dropped it, or that the string broke, so those choices are not supported.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Narrative cause and effect",
      "skill": "Identify cause and effect",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "narrative",
        "cause and effect",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-003",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The next time Maya flies her kite, what will she most likely do?",
    "stimulus": {
      "title": "The Kite That Got Away",
      "body": "Maya had saved her pocket money for weeks to buy the red kite in the shop window. On Saturday, she raced to the park with her little brother, Sam. The wind was strong and the kite leapt into the sky at once. Maya laughed as it climbed higher and higher.\n\nThen a gust tugged the string right out of her hands. The kite spun away over the tall gum trees and vanished. Maya's smile faded. She stared at the empty sky, her shoulders drooping.\n\nSam patted her arm. \"Don't worry,\" he said. He pointed to a boy near the pond who was untangling something red from a bush. It was the kite! The boy carried it back and handed it to Maya. \"The wind sent it to me,\" he grinned. \"You should tie the string to your wrist next time.\"\n\nMaya thanked him and wound the string carefully around her wrist.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "d",
        "text": "Tie the string around her wrist."
      },
      {
        "id": "a",
        "text": "Fly the kite with no string at all."
      },
      {
        "id": "b",
        "text": "Give the kite away to the boy."
      },
      {
        "id": "c",
        "text": "Only fly it when there is no wind."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "Use the ending as a clue to the future. The boy suggests tying the string to her wrist, and Maya already 'wound the string carefully around her wrist', so she will most likely keep doing that. A kite needs wind to fly, so waiting for no wind makes no sense, and she was glad to get the kite back rather than give it away.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Narrative prediction",
      "skill": "Predict what will happen next",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "prediction",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'the kite leapt into the sky at once', the word 'leapt' means the kite â€”",
    "stimulus": {
      "title": "The Kite That Got Away",
      "body": "Maya had saved her pocket money for weeks to buy the red kite in the shop window. On Saturday, she raced to the park with her little brother, Sam. The wind was strong and the kite leapt into the sky at once. Maya laughed as it climbed higher and higher.\n\nThen a gust tugged the string right out of her hands. The kite spun away over the tall gum trees and vanished. Maya's smile faded. She stared at the empty sky, her shoulders drooping.\n\nSam patted her arm. \"Don't worry,\" he said. He pointed to a boy near the pond who was untangling something red from a bush. It was the kite! The boy carried it back and handed it to Maya. \"The wind sent it to me,\" he grinned. \"You should tie the string to your wrist next time.\"\n\nMaya thanked him and wound the string carefully around her wrist.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "sank down slowly"
      },
      {
        "id": "c",
        "text": "shot up quickly"
      },
      {
        "id": "b",
        "text": "drifted along gently"
      },
      {
        "id": "d",
        "text": "stayed quite still"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "c"
    },
    "explanation": "Read the whole sentence again: the wind was strong and the kite went up 'at once', then 'climbed higher and higher'. To leap is to jump suddenly, so here it means the kite shot up quickly. It did not sink, drift gently or stay still.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "Word meaning",
      "skill": "Work out word meaning in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "vocabulary",
        "word meaning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-005",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is this text mostly about?",
    "stimulus": {
      "title": "Busy Little Ants",
      "body": "Ants are tiny insects, but they are among the hardest workers in the garden. An ant colony is like a small city under the ground. Each ant has a job to do.\n\nThe queen ant is the largest. Her only task is to lay eggs, sometimes thousands in a single day. Worker ants are all female. They dig tunnels, gather food, and care for the young. Soldier ants have big jaws and guard the nest from enemies.\n\nWhen a worker ant finds food, it hurries back to the nest. As it walks, it leaves a trail of scent on the ground. Other ants smell the trail and follow it straight to the food. Soon a long line of ants is marching to and fro.\n\nAnts may be small, but by working together they can move objects far heavier than themselves. A whole colony can survive because every ant does its part.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "b",
        "text": "Why ants can be dangerous to people"
      },
      {
        "id": "c",
        "text": "How to keep ants out of your garden"
      },
      {
        "id": "a",
        "text": "How ants live and work together in a colony"
      },
      {
        "id": "d",
        "text": "Where ants like to hide in winter"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "The main idea is what the whole text keeps coming back to. Every paragraph is about the different ants and their jobs and how they help the colony survive. Danger to people, keeping ants away and winter hiding are never mentioned, so those cannot be the main idea.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Information main idea",
      "skill": "Identify the main idea",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "main idea",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-006",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did the author most likely write this text?",
    "stimulus": {
      "title": "Busy Little Ants",
      "body": "Ants are tiny insects, but they are among the hardest workers in the garden. An ant colony is like a small city under the ground. Each ant has a job to do.\n\nThe queen ant is the largest. Her only task is to lay eggs, sometimes thousands in a single day. Worker ants are all female. They dig tunnels, gather food, and care for the young. Soldier ants have big jaws and guard the nest from enemies.\n\nWhen a worker ant finds food, it hurries back to the nest. As it walks, it leaves a trail of scent on the ground. Other ants smell the trail and follow it straight to the food. Soon a long line of ants is marching to and fro.\n\nAnts may be small, but by working together they can move objects far heavier than themselves. A whole colony can survive because every ant does its part.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "To tell a funny story about an ant"
      },
      {
        "id": "c",
        "text": "To make you want a pet ant"
      },
      {
        "id": "d",
        "text": "To teach you how to draw an ant"
      },
      {
        "id": "b",
        "text": "To give facts about how ants live"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "Ask what the writer is trying to do. The text gives real facts about queens, workers, soldiers and scent trails, so its purpose is to inform. There is no story or joke, no drawing steps, and it never tries to talk you into keeping an ant.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author purpose",
      "skill": "Identify the author's purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "author purpose",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-007",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each kind of ant to the job it does in the text.",
    "instructions": "Draw a line from each ant to its correct job. One job is not used.",
    "stimulus": {
      "title": "Busy Little Ants",
      "body": "Ants are tiny insects, but they are among the hardest workers in the garden. An ant colony is like a small city under the ground. Each ant has a job to do.\n\nThe queen ant is the largest. Her only task is to lay eggs, sometimes thousands in a single day. Worker ants are all female. They dig tunnels, gather food, and care for the young. Soldier ants have big jaws and guard the nest from enemies.\n\nWhen a worker ant finds food, it hurries back to the nest. As it walks, it leaves a trail of scent on the ground. Other ants smell the trail and follow it straight to the food. Soon a long line of ants is marching to and fro.\n\nAnts may be small, but by working together they can move objects far heavier than themselves. A whole colony can survive because every ant does its part.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "queen",
          "text": "Queen ant"
        },
        {
          "id": "worker",
          "text": "Worker ant"
        },
        {
          "id": "soldier",
          "text": "Soldier ant"
        }
      ],
      "targets": [
        {
          "id": "lay-eggs",
          "text": "Lays the eggs"
        },
        {
          "id": "gather-food",
          "text": "Digs tunnels and gathers food"
        },
        {
          "id": "guard-nest",
          "text": "Guards the nest from enemies"
        },
        {
          "id": "fly-away",
          "text": "Flies off to start a new colony"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "queen",
          "targetId": "lay-eggs"
        },
        {
          "sourceId": "worker",
          "targetId": "gather-food"
        },
        {
          "sourceId": "soldier",
          "targetId": "guard-nest"
        }
      ]
    },
    "explanation": "Find each ant in the text and read its job. The queen's 'only task is to lay eggs'. Workers 'dig tunnels, gather food'. Soldiers 'guard the nest from enemies'. Flying off to start a new colony is not mentioned for any of them, so that job is left over.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Locate and match details",
      "skill": "Match information to details in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information text",
        "matching",
        "detail",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-008",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How do other ants know which way to go to reach the food?",
    "stimulus": {
      "title": "Busy Little Ants",
      "body": "Ants are tiny insects, but they are among the hardest workers in the garden. An ant colony is like a small city under the ground. Each ant has a job to do.\n\nThe queen ant is the largest. Her only task is to lay eggs, sometimes thousands in a single day. Worker ants are all female. They dig tunnels, gather food, and care for the young. Soldier ants have big jaws and guard the nest from enemies.\n\nWhen a worker ant finds food, it hurries back to the nest. As it walks, it leaves a trail of scent on the ground. Other ants smell the trail and follow it straight to the food. Soon a long line of ants is marching to and fro.\n\nAnts may be small, but by working together they can move objects far heavier than themselves. A whole colony can survive because every ant does its part.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "d",
        "text": "They follow a scent trail on the ground."
      },
      {
        "id": "a",
        "text": "They listen for the first ant to call to them."
      },
      {
        "id": "b",
        "text": "They watch the first ant waving."
      },
      {
        "id": "c",
        "text": "They dig in every direction at once."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "The third paragraph explains the cause: the first ant 'leaves a trail of scent on the ground' and 'Other ants smell the trail and follow it straight to the food.' Ants do not call out, wave or dig at random, so the scent trail is the only supported answer.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Information cause and effect",
      "skill": "Understand cause and effect in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "cause and effect",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How is Ruby different from Leo when she rides up the hill?",
    "stimulus": {
      "title": "Two Ways Up the Hill",
      "body": "Every afternoon, twins Leo and Ruby rode their bikes up Miller's Hill. The hill was steep, and the two rode it very differently.\n\nLeo always charged at the hill as fast as he could. He pedalled hard from the bottom, hoping his speed would carry him to the top. Halfway up, though, his legs would burn and he often had to stop and push his bike the rest of the way.\n\nRuby took her time. She started slowly and kept a steady, even pace. She never raced, but she never stopped either. Little by little, she rolled all the way to the top without getting off her bike.\n\nOne day Leo watched Ruby reach the top ahead of him again. \"How do you do it?\" he puffed. Ruby smiled. \"I don't try to win at the start,\" she said. \"I just keep going.\" The next afternoon, Leo tried Ruby's way. To his surprise, he reached the top without stopping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "b",
        "text": "Ruby races as fast as she can."
      },
      {
        "id": "a",
        "text": "Ruby keeps a slow, steady pace."
      },
      {
        "id": "c",
        "text": "Ruby stops to rest halfway up."
      },
      {
        "id": "d",
        "text": "Ruby pushes her bike to the top."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "Compare the two riders side by side. Ruby 'started slowly and kept a steady, even pace' and never stopped. The other three choices all describe Leo, who charged fast, had to stop halfway and pushed his bike. So only the steady pace fits Ruby.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Compare characters",
      "skill": "Compare two characters",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "compare characters",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-010",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Leo try Ruby's way the next afternoon?",
    "stimulus": {
      "title": "Two Ways Up the Hill",
      "body": "Every afternoon, twins Leo and Ruby rode their bikes up Miller's Hill. The hill was steep, and the two rode it very differently.\n\nLeo always charged at the hill as fast as he could. He pedalled hard from the bottom, hoping his speed would carry him to the top. Halfway up, though, his legs would burn and he often had to stop and push his bike the rest of the way.\n\nRuby took her time. She started slowly and kept a steady, even pace. She never raced, but she never stopped either. Little by little, she rolled all the way to the top without getting off her bike.\n\nOne day Leo watched Ruby reach the top ahead of him again. \"How do you do it?\" he puffed. Ruby smiled. \"I don't try to win at the start,\" she said. \"I just keep going.\" The next afternoon, Leo tried Ruby's way. To his surprise, he reached the top without stopping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "He wanted to make Ruby feel proud."
      },
      {
        "id": "b",
        "text": "He was told to by their mother."
      },
      {
        "id": "c",
        "text": "He hoped to reach the top without stopping."
      },
      {
        "id": "d",
        "text": "He wanted to ride even slower than Ruby did."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "c"
    },
    "explanation": "Think about what Leo wanted. He kept having to stop halfway, while Ruby's steady way got her to the top every time. So he copied her hoping to reach the top without stopping, which is exactly what happened. The story never mentions their mother, making Ruby proud, or wanting to go slower than her.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Infer motive",
      "skill": "Infer a character's motive",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "motive",
        "inference",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is the main message of this story?",
    "stimulus": {
      "title": "Two Ways Up the Hill",
      "body": "Every afternoon, twins Leo and Ruby rode their bikes up Miller's Hill. The hill was steep, and the two rode it very differently.\n\nLeo always charged at the hill as fast as he could. He pedalled hard from the bottom, hoping his speed would carry him to the top. Halfway up, though, his legs would burn and he often had to stop and push his bike the rest of the way.\n\nRuby took her time. She started slowly and kept a steady, even pace. She never raced, but she never stopped either. Little by little, she rolled all the way to the top without getting off her bike.\n\nOne day Leo watched Ruby reach the top ahead of him again. \"How do you do it?\" he puffed. Ruby smiled. \"I don't try to win at the start,\" she said. \"I just keep going.\" The next afternoon, Leo tried Ruby's way. To his surprise, he reached the top without stopping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "Racing your friends is always fun."
      },
      {
        "id": "c",
        "text": "Steep hills are too hard to climb."
      },
      {
        "id": "d",
        "text": "Twins should not ride bikes together."
      },
      {
        "id": "b",
        "text": "A steady effort can beat rushing."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "Put the two parts of the story together to find the lesson. Rushing made Leo stop halfway, but Ruby's slow, steady riding got her to the top, and it worked for Leo too once he copied it. So the message is that steady effort can beat rushing. The other choices go against what happened in the story.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Draw a conclusion",
      "skill": "Draw a conclusion about the message",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "narrative",
        "conclusion",
        "theme",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'Leo always charged at the hill as fast as he could', the word 'charged' means he â€”",
    "stimulus": {
      "title": "Two Ways Up the Hill",
      "body": "Every afternoon, twins Leo and Ruby rode their bikes up Miller's Hill. The hill was steep, and the two rode it very differently.\n\nLeo always charged at the hill as fast as he could. He pedalled hard from the bottom, hoping his speed would carry him to the top. Halfway up, though, his legs would burn and he often had to stop and push his bike the rest of the way.\n\nRuby took her time. She started slowly and kept a steady, even pace. She never raced, but she never stopped either. Little by little, she rolled all the way to the top without getting off her bike.\n\nOne day Leo watched Ruby reach the top ahead of him again. \"How do you do it?\" he puffed. Ruby smiled. \"I don't try to win at the start,\" she said. \"I just keep going.\" The next afternoon, Leo tried Ruby's way. To his surprise, he reached the top without stopping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "d",
        "text": "rushed forward fast"
      },
      {
        "id": "a",
        "text": "moved along slowly"
      },
      {
        "id": "b",
        "text": "shouted out loudly"
      },
      {
        "id": "c",
        "text": "climbed off to walk"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "d"
    },
    "explanation": "Read the words around it: 'as fast as he could' and 'pedalled hard'. To charge at something is to rush at it, so here it means Leo rushed forward fast. It cannot mean slowly, and there is no shouting or getting off the bike in that sentence.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "Word meaning",
      "skill": "Work out word meaning in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "vocabulary",
        "word meaning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-013",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the steps of how a rainbow forms in the correct order, from first to last.",
    "instructions": "Order the steps from what happens first to what happens last.",
    "stimulus": {
      "title": "How a Rainbow Appears",
      "body": "Have you ever seen a rainbow after the rain? A rainbow is made when sunlight passes through tiny drops of water in the air.\n\nFirst, the sun must be shining while rain is still falling. Next, sunlight enters each raindrop. Sunlight looks white, but it is really made of many colours mixed together. As the light passes into the drop, it bends and splits apart into its separate colours. The light then bounces off the back of the raindrop and bends again as it comes out. When this happens in thousands of raindrops at once, we see a curved band of colour in the sky.\n\nA rainbow always appears in the part of the sky opposite the sun. That is why you must stand with the sun behind you to see one. The colours always appear in the same order, with red on the outside and violet on the inside.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "s-band",
          "text": "A curved band of colour appears in the sky."
        },
        {
          "id": "s-enter",
          "text": "Sunlight enters each raindrop."
        },
        {
          "id": "s-shine",
          "text": "The sun shines while rain is still falling."
        },
        {
          "id": "s-split",
          "text": "The light splits apart into separate colours."
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "s-shine",
        "s-enter",
        "s-split",
        "s-band"
      ]
    },
    "explanation": "Use the order words in the text to sort the steps. It says 'First, the sun must be shining while rain is still falling', then 'Next, sunlight enters each raindrop', then the light 'splits apart into its separate colours', and finally 'we see a curved band of colour in the sky'.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Sequence a process",
      "skill": "Sequence steps in a process",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information text",
        "sequencing",
        "ordering",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why must you stand with the sun behind you to see a rainbow?",
    "stimulus": {
      "title": "How a Rainbow Appears",
      "body": "Have you ever seen a rainbow after the rain? A rainbow is made when sunlight passes through tiny drops of water in the air.\n\nFirst, the sun must be shining while rain is still falling. Next, sunlight enters each raindrop. Sunlight looks white, but it is really made of many colours mixed together. As the light passes into the drop, it bends and splits apart into its separate colours. The light then bounces off the back of the raindrop and bends again as it comes out. When this happens in thousands of raindrops at once, we see a curved band of colour in the sky.\n\nA rainbow always appears in the part of the sky opposite the sun. That is why you must stand with the sun behind you to see one. The colours always appear in the same order, with red on the outside and violet on the inside.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "b",
        "text": "The sun is too bright to look at."
      },
      {
        "id": "a",
        "text": "A rainbow forms in the sky opposite the sun."
      },
      {
        "id": "c",
        "text": "Rainbows only form in the morning."
      },
      {
        "id": "d",
        "text": "The rain falls behind you as well."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a"
    },
    "explanation": "The text gives the reason right after the fact: 'A rainbow always appears in the part of the sky opposite the sun. That is why you must stand with the sun behind you.' If the sun is behind you, the opposite part of the sky is in front of you, where the rainbow is. The other choices are not given as reasons in the text.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Information cause and effect",
      "skill": "Reason about cause and effect",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information text",
        "cause and effect",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the text, the words 'splits apart' tell us the light â€”",
    "stimulus": {
      "title": "How a Rainbow Appears",
      "body": "Have you ever seen a rainbow after the rain? A rainbow is made when sunlight passes through tiny drops of water in the air.\n\nFirst, the sun must be shining while rain is still falling. Next, sunlight enters each raindrop. Sunlight looks white, but it is really made of many colours mixed together. As the light passes into the drop, it bends and splits apart into its separate colours. The light then bounces off the back of the raindrop and bends again as it comes out. When this happens in thousands of raindrops at once, we see a curved band of colour in the sky.\n\nA rainbow always appears in the part of the sky opposite the sun. That is why you must stand with the sun behind you to see one. The colours always appear in the same order, with red on the outside and violet on the inside.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "joins back together"
      },
      {
        "id": "b",
        "text": "grows much brighter"
      },
      {
        "id": "c",
        "text": "breaks into parts"
      },
      {
        "id": "d",
        "text": "fades to nothing"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "c"
    },
    "explanation": "Read on in the sentence: the light splits apart 'into its separate colours'. To split apart is to break into parts, so white light breaks into its separate colours. It does not join together, get brighter or fade away.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "Word meaning",
      "skill": "Work out word meaning in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "vocabulary",
        "word meaning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-db-016",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What was the author's main reason for writing about rainbows?",
    "stimulus": {
      "title": "How a Rainbow Appears",
      "body": "Have you ever seen a rainbow after the rain? A rainbow is made when sunlight passes through tiny drops of water in the air.\n\nFirst, the sun must be shining while rain is still falling. Next, sunlight enters each raindrop. Sunlight looks white, but it is really made of many colours mixed together. As the light passes into the drop, it bends and splits apart into its separate colours. The light then bounces off the back of the raindrop and bends again as it comes out. When this happens in thousands of raindrops at once, we see a curved band of colour in the sky.\n\nA rainbow always appears in the part of the sky opposite the sun. That is why you must stand with the sun behind you to see one. The colours always appear in the same order, with red on the outside and violet on the inside.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "a",
        "text": "To tell a story about a rainy day"
      },
      {
        "id": "c",
        "text": "To teach you to paint a rainbow"
      },
      {
        "id": "d",
        "text": "To describe a walk in the rain"
      },
      {
        "id": "b",
        "text": "To explain how a rainbow is made"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "b"
    },
    "explanation": "Look at what the text spends its time doing. Step by step, it explains how sunlight and raindrops make a rainbow, so the author's purpose is to explain how a rainbow is made. There is no story, no painting lesson and no description of a walk.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author purpose",
      "skill": "Identify the author's purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "author purpose",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How does Mia most likely feel while she waits for the judge's decision?",
    "stimulus": {
      "title": "The Sandcastle Contest",
      "body": "The beach was crowded on Saturday morning. Mia knelt in the warm sand next to her bucket and spade. Today was the sandcastle contest, and she wanted her castle to be the best one on the whole beach.\n\nMia worked carefully. She packed wet sand into her bucket, tipped it over, and lifted it slowly. A tall, round tower stood up. She built four towers, then dug a moat around them with her spade.\n\nJust as she finished, a big wave rushed up the sand. It stopped just short of the moat. Mia held her breath. The water slid back into the sea, and her castle was safe.\n\nThe judge walked along the beach, looking at every castle. When she reached Mia's, she smiled and wrote something on her card. Mia crossed her fingers and waited. Her heart was thumping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "bored-sleepy",
        "text": "Bored and rather sleepy"
      },
      {
        "id": "angry-judge",
        "text": "Angry with the judge"
      },
      {
        "id": "sure-lost",
        "text": "Certain that she has lost"
      },
      {
        "id": "nervous-hopeful",
        "text": "Nervous but hopeful"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "nervous-hopeful"
    },
    "explanation": "The story says Mia 'crossed her fingers' and 'her heart was thumping'. Crossing your fingers is something people do when they are hoping for good news, and a thumping heart shows she feels nervous. Together these clues tell us she is nervous but still hopeful.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Inferring feelings",
      "skill": "Infer a character's feeling",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "inference",
        "narrative",
        "feelings"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-002",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Mia hold her breath when the big wave rushed up the sand?",
    "stimulus": {
      "title": "The Sandcastle Contest",
      "body": "The beach was crowded on Saturday morning. Mia knelt in the warm sand next to her bucket and spade. Today was the sandcastle contest, and she wanted her castle to be the best one on the whole beach.\n\nMia worked carefully. She packed wet sand into her bucket, tipped it over, and lifted it slowly. A tall, round tower stood up. She built four towers, then dug a moat around them with her spade.\n\nJust as she finished, a big wave rushed up the sand. It stopped just short of the moat. Mia held her breath. The water slid back into the sea, and her castle was safe.\n\nThe judge walked along the beach, looking at every castle. When she reached Mia's, she smiled and wrote something on her card. Mia crossed her fingers and waited. Her heart was thumping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "worried-wreck",
        "text": "She was worried the wave would wreck her castle"
      },
      {
        "id": "wanted-swim",
        "text": "She wanted to jump in and swim"
      },
      {
        "id": "tired-building",
        "text": "She was tired from building"
      },
      {
        "id": "counting-towers",
        "text": "She was counting her four towers"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "worried-wreck"
    },
    "explanation": "Find the moment the wave appears and read what happens. The wave 'stopped just short of the moat', and afterwards 'her castle was safe'. The story links holding her breath to whether the castle survives, so she held her breath because she feared the wave would ruin her work.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Cause and effect",
      "skill": "Identify cause and effect",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "cause and effect",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What will most likely happen next in the story?",
    "stimulus": {
      "title": "The Sandcastle Contest",
      "body": "The beach was crowded on Saturday morning. Mia knelt in the warm sand next to her bucket and spade. Today was the sandcastle contest, and she wanted her castle to be the best one on the whole beach.\n\nMia worked carefully. She packed wet sand into her bucket, tipped it over, and lifted it slowly. A tall, round tower stood up. She built four towers, then dug a moat around them with her spade.\n\nJust as she finished, a big wave rushed up the sand. It stopped just short of the moat. Mia held her breath. The water slid back into the sea, and her castle was safe.\n\nThe judge walked along the beach, looking at every castle. When she reached Mia's, she smiled and wrote something on her card. Mia crossed her fingers and waited. Her heart was thumping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "home-bucket",
        "text": "Mia will go home and leave her bucket behind"
      },
      {
        "id": "judge-result",
        "text": "The judge will tell Mia the result of the contest"
      },
      {
        "id": "storm-beach",
        "text": "A sudden storm will roll in and wash the whole sandy beach away"
      },
      {
        "id": "new-castle",
        "text": "Mia will knock down her castle and start again"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "judge-result"
    },
    "explanation": "Good predictions grow out of what has just happened. The judge has reached Mia's castle, smiled and written on her card, and Mia is waiting with crossed fingers. The natural next step is for the judge to share the result, so that is the best-supported prediction.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Prediction",
      "skill": "Predict what will happen next",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "prediction",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-004",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the story, the word 'moat' means a â€”",
    "stimulus": {
      "title": "The Sandcastle Contest",
      "body": "The beach was crowded on Saturday morning. Mia knelt in the warm sand next to her bucket and spade. Today was the sandcastle contest, and she wanted her castle to be the best one on the whole beach.\n\nMia worked carefully. She packed wet sand into her bucket, tipped it over, and lifted it slowly. A tall, round tower stood up. She built four towers, then dug a moat around them with her spade.\n\nJust as she finished, a big wave rushed up the sand. It stopped just short of the moat. Mia held her breath. The water slid back into the sea, and her castle was safe.\n\nThe judge walked along the beach, looking at every castle. When she reached Mia's, she smiled and wrote something on her card. Mia crossed her fingers and waited. Her heart was thumping.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "tall-tower",
        "text": "tall tower built from wet sand"
      },
      {
        "id": "water-bucket",
        "text": "bucket used to carry sea water up the beach"
      },
      {
        "id": "ditch-around",
        "text": "ditch dug in a ring around the castle"
      },
      {
        "id": "flag-top",
        "text": "small flag placed on the top"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "ditch-around"
    },
    "explanation": "Reread the sentence: 'she built four towers, then dug a moat around them with her spade.' A moat is something you dig, and it goes around the castle, so it must be a ditch dug in a ring around it, not a tower, bucket or flag.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "Word meaning",
      "skill": "Work out word meaning in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "word meaning",
        "vocabulary",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-005",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is this text mostly about?",
    "stimulus": {
      "title": "Life in a Beehive",
      "body": "A beehive is a busy home shared by thousands of bees. Every bee has a job to do, and the hive could not survive if they did not all work together.\n\nThe queen bee is the largest bee in the hive. Her only job is to lay eggs, and she can lay hundreds every day. The worker bees are all female. They clean the hive, feed the young bees, and fly out to collect nectar from flowers. The drones are male bees. Their job is to help the queen.\n\nMaking honey takes many steps. First, a worker bee flies to a flower and sucks up sweet nectar. Next, she carries the nectar back to the hive. Then the bees fan the nectar with their wings to dry it out. Finally, the thick, sweet honey is stored in the honeycomb to eat later.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "flower-nectar",
        "text": "Why flowers make sweet nectar"
      },
      {
        "id": "keep-pets",
        "text": "How to keep your own bees as pets in the backyard"
      },
      {
        "id": "colours-bees",
        "text": "The different colours you can see on bees"
      },
      {
        "id": "bees-work-honey",
        "text": "How bees in a hive work together and make honey"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "bees-work-honey"
    },
    "explanation": "The main idea is what every part of the text keeps returning to. This text describes the jobs of the queen, workers and drones, and then the steps of making honey. All of it is about how the bees work together in the hive, which is the main idea.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Main idea",
      "skill": "Identify the main idea",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "main idea",
        "information text",
        "bees"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-006",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did the author most likely write this text?",
    "stimulus": {
      "title": "Life in a Beehive",
      "body": "A beehive is a busy home shared by thousands of bees. Every bee has a job to do, and the hive could not survive if they did not all work together.\n\nThe queen bee is the largest bee in the hive. Her only job is to lay eggs, and she can lay hundreds every day. The worker bees are all female. They clean the hive, feed the young bees, and fly out to collect nectar from flowers. The drones are male bees. Their job is to help the queen.\n\nMaking honey takes many steps. First, a worker bee flies to a flower and sucks up sweet nectar. Next, she carries the nectar back to the hive. Then the bees fan the nectar with their wings to dry it out. Finally, the thick, sweet honey is stored in the honeycomb to eat later.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "explain-hive",
        "text": "To explain how a beehive works"
      },
      {
        "id": "funny-story",
        "text": "To tell a funny story about one bee"
      },
      {
        "id": "teach-catch",
        "text": "To teach readers how to catch bees"
      },
      {
        "id": "sell-honey",
        "text": "To sell jars of honey to shoppers"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "explain-hive"
    },
    "explanation": "Think about what the writing is trying to do. There are no characters, jokes or advertisements. Instead it gives facts about the bees' jobs and the steps of making honey. Writing that gives facts to help you understand something is written to explain, so the purpose is to explain how a beehive works.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author's purpose",
      "skill": "Identify the author's purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "author's purpose",
        "information text",
        "bees"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-007",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the steps of making honey in the order they happen in the text, from first to last.",
    "stimulus": {
      "title": "Life in a Beehive",
      "body": "A beehive is a busy home shared by thousands of bees. Every bee has a job to do, and the hive could not survive if they did not all work together.\n\nThe queen bee is the largest bee in the hive. Her only job is to lay eggs, and she can lay hundreds every day. The worker bees are all female. They clean the hive, feed the young bees, and fly out to collect nectar from flowers. The drones are male bees. Their job is to help the queen.\n\nMaking honey takes many steps. First, a worker bee flies to a flower and sucks up sweet nectar. Next, she carries the nectar back to the hive. Then the bees fan the nectar with their wings to dry it out. Finally, the thick, sweet honey is stored in the honeycomb to eat later.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "suck",
          "text": "A worker bee sucks up sweet nectar from a flower"
        },
        {
          "id": "carry",
          "text": "The bee carries the nectar back to the hive"
        },
        {
          "id": "fan",
          "text": "The bees fan the nectar with their wings to dry it"
        },
        {
          "id": "store",
          "text": "The honey is stored in the honeycomb"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "suck",
        "carry",
        "fan",
        "store"
      ]
    },
    "explanation": "The text uses order words to guide you. 'First' the bee sucks up nectar, 'Next' she carries it back to the hive, 'Then' the bees fan it dry, and 'Finally' the honey is stored in the honeycomb. Following those signal words gives the correct order.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Sequencing",
      "skill": "Sequence steps in a process",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 110,
      "tags": [
        "sequencing",
        "information text",
        "bees"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-008",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each kind of bee to the job it does in the hive, according to the text.",
    "stimulus": {
      "title": "Life in a Beehive",
      "body": "A beehive is a busy home shared by thousands of bees. Every bee has a job to do, and the hive could not survive if they did not all work together.\n\nThe queen bee is the largest bee in the hive. Her only job is to lay eggs, and she can lay hundreds every day. The worker bees are all female. They clean the hive, feed the young bees, and fly out to collect nectar from flowers. The drones are male bees. Their job is to help the queen.\n\nMaking honey takes many steps. First, a worker bee flies to a flower and sucks up sweet nectar. Next, she carries the nectar back to the hive. Then the bees fan the nectar with their wings to dry it out. Finally, the thick, sweet honey is stored in the honeycomb to eat later.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "queen",
          "text": "The queen bee"
        },
        {
          "id": "worker",
          "text": "A worker bee"
        },
        {
          "id": "drone",
          "text": "A drone"
        }
      ],
      "targets": [
        {
          "id": "lay-eggs",
          "text": "Lays the eggs"
        },
        {
          "id": "collect-nectar",
          "text": "Collects nectar from flowers"
        },
        {
          "id": "help-queen",
          "text": "Helps the queen"
        },
        {
          "id": "guard-door",
          "text": "Fights off bears at the door"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "queen",
          "targetId": "lay-eggs"
        },
        {
          "sourceId": "worker",
          "targetId": "collect-nectar"
        },
        {
          "sourceId": "drone",
          "targetId": "help-queen"
        }
      ]
    },
    "explanation": "Match each bee to what the text says it does. The queen's 'only job is to lay eggs'. Worker bees 'fly out to collect nectar from flowers'. The drones' job 'is to help the queen'. Fighting off bears is never mentioned, so that target is left unused.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Comparing details",
      "skill": "Compare the roles of different characters",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "compare",
        "matching",
        "bees"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Noah's face grow hot when Mr Patel spoke to him?",
    "stimulus": {
      "title": "The Lost Library Book",
      "body": "Noah loved borrowing books from the school library. Every Friday he chose a new one to take home. But this Friday, Mr Patel the librarian looked at his computer and frowned.\n\n'Noah,' he said gently, 'you still have a book at home. It was due back two weeks ago. You cannot borrow another until you return it.'\n\nNoah's face grew hot. He had forgotten all about the shark book under his bed. He walked back to class with empty hands, feeling terrible.\n\nThat afternoon at home, Noah searched everywhere. At last he found the book, covered in dust, right at the back of his cupboard. He wiped it clean and put it straight into his school bag so he would not forget it again.\n\nThe next Friday, Noah handed the book to Mr Patel first thing in the morning. The librarian smiled. 'Well done,' he said. 'Now, would you like to choose a new book?'",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "too-warm",
        "text": "The library felt far too warm for him that day"
      },
      {
        "id": "felt-embarrassed",
        "text": "He felt embarrassed about forgetting the book"
      },
      {
        "id": "been-running",
        "text": "He had just been running around outside in the sun"
      },
      {
        "id": "angry-patel",
        "text": "He was feeling quite angry with Mr Patel that day"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "felt-embarrassed"
    },
    "explanation": "A hot face is a clue to a feeling. Right after it, the text says Noah 'had forgotten all about the shark book' and walked away 'feeling terrible'. His face grew hot because he was embarrassed that he had forgotten to return the book.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Inferring feelings",
      "skill": "Infer a character's feeling",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "inference",
        "narrative",
        "feelings"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What will Noah most likely do the next time he borrows a book?",
    "stimulus": {
      "title": "The Lost Library Book",
      "body": "Noah loved borrowing books from the school library. Every Friday he chose a new one to take home. But this Friday, Mr Patel the librarian looked at his computer and frowned.\n\n'Noah,' he said gently, 'you still have a book at home. It was due back two weeks ago. You cannot borrow another until you return it.'\n\nNoah's face grew hot. He had forgotten all about the shark book under his bed. He walked back to class with empty hands, feeling terrible.\n\nThat afternoon at home, Noah searched everywhere. At last he found the book, covered in dust, right at the back of his cupboard. He wiped it clean and put it straight into his school bag so he would not forget it again.\n\nThe next Friday, Noah handed the book to Mr Patel first thing in the morning. The librarian smiled. 'Well done,' he said. 'Now, would you like to choose a new book?'",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "forget-bed",
        "text": "Forget it under his bed again"
      },
      {
        "id": "keep-forever",
        "text": "Keep it at home forever"
      },
      {
        "id": "return-time",
        "text": "Return it on time so he can borrow again"
      },
      {
        "id": "give-friend",
        "text": "Give it away to one of his friends at school"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "return-time"
    },
    "explanation": "Predict from what Noah has learned. He felt terrible about the overdue book and packed the returned one 'so he would not forget it again'. A child who has learned that lesson will most likely bring the next book back on time.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Prediction",
      "skill": "Predict a character's behaviour",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "prediction",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why was Noah not allowed to borrow a new book that Friday?",
    "stimulus": {
      "title": "The Lost Library Book",
      "body": "Noah loved borrowing books from the school library. Every Friday he chose a new one to take home. But this Friday, Mr Patel the librarian looked at his computer and frowned.\n\n'Noah,' he said gently, 'you still have a book at home. It was due back two weeks ago. You cannot borrow another until you return it.'\n\nNoah's face grew hot. He had forgotten all about the shark book under his bed. He walked back to class with empty hands, feeling terrible.\n\nThat afternoon at home, Noah searched everywhere. At last he found the book, covered in dust, right at the back of his cupboard. He wiped it clean and put it straight into his school bag so he would not forget it again.\n\nThe next Friday, Noah handed the book to Mr Patel first thing in the morning. The librarian smiled. 'Well done,' he said. 'Now, would you like to choose a new book?'",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "card-missing",
        "text": "He did not have his library card"
      },
      {
        "id": "library-closed",
        "text": "The school library was closed for the whole of that day"
      },
      {
        "id": "lost-bag",
        "text": "He had lost his school bag"
      },
      {
        "id": "still-overdue",
        "text": "He had not returned a book that was already overdue"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "still-overdue"
    },
    "explanation": "Mr Patel gives the reason directly: 'you still have a book at home. It was due back two weeks ago. You cannot borrow another until you return it.' So the cause is the book he had not yet returned, which was already overdue.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Cause and effect",
      "skill": "Identify cause and effect",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "cause and effect",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-012",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'It was due back two weeks ago', the word 'due' means the â€”",
    "stimulus": {
      "title": "The Lost Library Book",
      "body": "Noah loved borrowing books from the school library. Every Friday he chose a new one to take home. But this Friday, Mr Patel the librarian looked at his computer and frowned.\n\n'Noah,' he said gently, 'you still have a book at home. It was due back two weeks ago. You cannot borrow another until you return it.'\n\nNoah's face grew hot. He had forgotten all about the shark book under his bed. He walked back to class with empty hands, feeling terrible.\n\nThat afternoon at home, Noah searched everywhere. At last he found the book, covered in dust, right at the back of his cupboard. He wiped it clean and put it straight into his school bag so he would not forget it again.\n\nThe next Friday, Noah handed the book to Mr Patel first thing in the morning. The librarian smiled. 'Well done,' he said. 'Now, would you like to choose a new book?'",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "time-return",
        "text": "time by which it had to be returned"
      },
      {
        "id": "kind-shark",
        "text": "kind of hungry shark in the story book"
      },
      {
        "id": "name-library",
        "text": "name written on the school library door"
      },
      {
        "id": "dust-cupboard",
        "text": "dust found at the back of the cupboard"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "time-return"
    },
    "explanation": "Read around the word. Mr Patel says the book was 'due back two weeks ago' and that Noah must 'return it'. Something that is 'due back' has a time by which it must be given back, so 'due' points to the time the book had to be returned.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "Word meaning",
      "skill": "Work out word meaning in context",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "word meaning",
        "vocabulary",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-013",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is this text mostly about?",
    "stimulus": {
      "title": "From Seed to Sunflower",
      "body": "A sunflower begins its life as a small, striped seed. With water, warmth and sunlight, that tiny seed can grow into a plant taller than an adult.\n\nFirst, the seed is planted in the soil. When it is watered, the seed swells and splits open. A thin root pushes down into the ground to drink up water. Next, a green shoot pushes up towards the light. Soon the shoot grows leaves that catch the sunlight and make food for the plant.\n\nAs the weeks pass, the stem grows taller and thicker. At last, a large bud forms at the very top. The bud opens into a bright yellow flower with a dark middle full of new seeds. Bees visit the flower to collect nectar.\n\nWhen autumn comes, the flower dries out and its seeds fall to the ground or are eaten by birds. Some of those seeds will grow into new sunflowers the following spring.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "bees-yellow",
        "text": "Why bees like the colour yellow"
      },
      {
        "id": "sunflower-grows",
        "text": "How a sunflower grows from a seed into a flower"
      },
      {
        "id": "cook-seeds",
        "text": "How to cook sunflower seeds"
      },
      {
        "id": "best-soil",
        "text": "The best kind of soil for a garden"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sunflower-grows"
    },
    "explanation": "The main idea runs through the whole text. Every paragraph describes another stage, from the striped seed, to the root and shoot, to the tall flower full of new seeds. The text is mostly about how a sunflower grows from a seed into a flower.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Main idea",
      "skill": "Identify the main idea",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "main idea",
        "information text",
        "plants"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did the author most likely write this text?",
    "stimulus": {
      "title": "From Seed to Sunflower",
      "body": "A sunflower begins its life as a small, striped seed. With water, warmth and sunlight, that tiny seed can grow into a plant taller than an adult.\n\nFirst, the seed is planted in the soil. When it is watered, the seed swells and splits open. A thin root pushes down into the ground to drink up water. Next, a green shoot pushes up towards the light. Soon the shoot grows leaves that catch the sunlight and make food for the plant.\n\nAs the weeks pass, the stem grows taller and thicker. At last, a large bud forms at the very top. The bud opens into a bright yellow flower with a dark middle full of new seeds. Bees visit the flower to collect nectar.\n\nWhen autumn comes, the flower dries out and its seeds fall to the ground or are eaten by birds. Some of those seeds will grow into new sunflowers the following spring.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "story-talking",
        "text": "To tell a story about a talking flower"
      },
      {
        "id": "warn-weeds",
        "text": "To warn readers about garden weeds"
      },
      {
        "id": "explain-grows",
        "text": "To explain how a sunflower grows and changes"
      },
      {
        "id": "sell-seeds",
        "text": "To sell colourful packets of seeds to gardeners"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "explain-grows"
    },
    "explanation": "Look at what the text does rather than what it is about. It has no characters or story, and it does not warn or advertise. It gives ordered facts about each stage of growth, so its purpose is to explain how a sunflower grows and changes.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author's purpose",
      "skill": "Identify the author's purpose",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "author's purpose",
        "information text",
        "plants"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-015",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these stages of a sunflower's growth in the order they happen in the text, from first to last.",
    "stimulus": {
      "title": "From Seed to Sunflower",
      "body": "A sunflower begins its life as a small, striped seed. With water, warmth and sunlight, that tiny seed can grow into a plant taller than an adult.\n\nFirst, the seed is planted in the soil. When it is watered, the seed swells and splits open. A thin root pushes down into the ground to drink up water. Next, a green shoot pushes up towards the light. Soon the shoot grows leaves that catch the sunlight and make food for the plant.\n\nAs the weeks pass, the stem grows taller and thicker. At last, a large bud forms at the very top. The bud opens into a bright yellow flower with a dark middle full of new seeds. Bees visit the flower to collect nectar.\n\nWhen autumn comes, the flower dries out and its seeds fall to the ground or are eaten by birds. Some of those seeds will grow into new sunflowers the following spring.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "plant",
          "text": "The seed is planted in the soil"
        },
        {
          "id": "root",
          "text": "A root pushes down into the ground"
        },
        {
          "id": "shoot",
          "text": "A green shoot pushes up towards the light"
        },
        {
          "id": "flower",
          "text": "A yellow flower opens at the top"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "plant",
        "root",
        "shoot",
        "flower"
      ]
    },
    "explanation": "Follow the order the text describes. 'First, the seed is planted', then 'a thin root pushes down', 'Next, a green shoot pushes up', and 'At last' the bud opens into a yellow flower. Reading the stages in that order gives the correct sequence.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Sequencing",
      "skill": "Sequence stages in a process",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 110,
      "tags": [
        "sequencing",
        "information text",
        "plants"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dc-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "According to the text, how is the root different from the shoot?",
    "stimulus": {
      "title": "From Seed to Sunflower",
      "body": "A sunflower begins its life as a small, striped seed. With water, warmth and sunlight, that tiny seed can grow into a plant taller than an adult.\n\nFirst, the seed is planted in the soil. When it is watered, the seed swells and splits open. A thin root pushes down into the ground to drink up water. Next, a green shoot pushes up towards the light. Soon the shoot grows leaves that catch the sunlight and make food for the plant.\n\nAs the weeks pass, the stem grows taller and thicker. At last, a large bud forms at the very top. The bud opens into a bright yellow flower with a dark middle full of new seeds. Bees visit the flower to collect nectar.\n\nWhen autumn comes, the flower dries out and its seeds fall to the ground or are eaten by birds. Some of those seeds will grow into new sunflowers the following spring.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "root-food",
        "text": "The root makes food, while the shoot drinks water"
      },
      {
        "id": "root-yellow",
        "text": "The root is yellow, while the shoot is a flower"
      },
      {
        "id": "root-autumn",
        "text": "The root grows in autumn, while the shoot grows in winter"
      },
      {
        "id": "root-down",
        "text": "The root grows down into the soil, while the shoot grows up to the light"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "root-down"
    },
    "explanation": "Compare what the text says about each part. 'A thin root pushes down into the ground to drink up water', while 'a green shoot pushes up towards the light'. The clear difference is direction: the root goes down and the shoot goes up. The leaves, not the root, make food, so the other choices swap the facts around.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Comparing details",
      "skill": "Compare two things in a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 95,
      "tags": [
        "compare",
        "information text",
        "plants"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How does Sam feel by the end of the evening?",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Sam was halfway through his jigsaw puzzle when the whole house went black. Outside, the wind howled and rain hammered on the roof. A storm had knocked out the power to the whole street.\n\nFor a moment nobody moved. Then Mum's voice came calmly through the dark. 'Everyone stay where you are. I'll find the torch.' Sam heard a drawer slide open, and then a small yellow light bounced across the walls.\n\nSoon the family had gathered in the lounge room. Dad lit two fat candles and set them on the table. Mum carried in a tin of biscuits and a stack of board games. 'No television tonight,' she said, smiling. 'We'll have to make our own fun.'\n\nSam had thought a night without power would be boring. Instead, the flickering candles made the room feel warm and secret, like a cave. He could not remember the last time the whole family had laughed so much.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "Bored and wishing the power would return"
      },
      {
        "id": "opt-b",
        "text": "Scared of the dark and the loud storm"
      },
      {
        "id": "opt-c",
        "text": "Happy and surprised the night was fun"
      },
      {
        "id": "opt-d",
        "text": "Angry that the television would not work"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Look at the last paragraph. Sam expected a boring night, but the room felt 'warm and secret' and the family 'laughed so much' â€” that is a happy, pleasantly surprised feeling. He was not bored, because he enjoyed himself; not scared, because the room felt cosy; and not angry, because no one complains about the television.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The night the lights went out",
      "skill": "Infer a character's feelings from the text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "inference",
        "feelings",
        "storm"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-002",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What caused the lights in the house to go out?",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Sam was halfway through his jigsaw puzzle when the whole house went black. Outside, the wind howled and rain hammered on the roof. A storm had knocked out the power to the whole street.\n\nFor a moment nobody moved. Then Mum's voice came calmly through the dark. 'Everyone stay where you are. I'll find the torch.' Sam heard a drawer slide open, and then a small yellow light bounced across the walls.\n\nSoon the family had gathered in the lounge room. Dad lit two fat candles and set them on the table. Mum carried in a tin of biscuits and a stack of board games. 'No television tonight,' she said, smiling. 'We'll have to make our own fun.'\n\nSam had thought a night without power would be boring. Instead, the flickering candles made the room feel warm and secret, like a cave. He could not remember the last time the whole family had laughed so much.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "Mum switched them off to save electricity"
      },
      {
        "id": "opt-c",
        "text": "Sam knocked over a lamp near the door"
      },
      {
        "id": "opt-d",
        "text": "Dad wanted to light some candles instead"
      },
      {
        "id": "opt-b",
        "text": "A storm cut the power to the whole street"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "The first paragraph states directly that 'a storm had knocked out the power to the whole street', so the storm is the cause. Mum only looks for the torch afterwards, Sam is doing a puzzle rather than knocking over a lamp, and Dad lights candles because the power is already off, not to cause the blackout.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The night the lights went out",
      "skill": "Identify cause and effect in a narrative",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "narrative",
        "cause and effect",
        "storm"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-003",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What will the family most likely do next in the evening?",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Sam was halfway through his jigsaw puzzle when the whole house went black. Outside, the wind howled and rain hammered on the roof. A storm had knocked out the power to the whole street.\n\nFor a moment nobody moved. Then Mum's voice came calmly through the dark. 'Everyone stay where you are. I'll find the torch.' Sam heard a drawer slide open, and then a small yellow light bounced across the walls.\n\nSoon the family had gathered in the lounge room. Dad lit two fat candles and set them on the table. Mum carried in a tin of biscuits and a stack of board games. 'No television tonight,' she said, smiling. 'We'll have to make our own fun.'\n\nSam had thought a night without power would be boring. Instead, the flickering candles made the room feel warm and secret, like a cave. He could not remember the last time the whole family had laughed so much.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-d",
        "text": "Play the board games by candlelight"
      },
      {
        "id": "opt-a",
        "text": "Watch a film together on the television"
      },
      {
        "id": "opt-b",
        "text": "Go straight to bed in the darkness"
      },
      {
        "id": "opt-c",
        "text": "Drive to the shops to buy a new torch"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "Mum brings in biscuits and 'a stack of board games' and says they will make their own fun, so playing the games by candlelight is what fits next. The television cannot work with the power off, no one is tired enough for bed, and the family already has a torch, so there is no reason to drive to the shops.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The night the lights went out",
      "skill": "Predict what will happen next using clues",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "prediction",
        "inference"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'the wind howled outside', the word 'howled' tells us the wind was â€”",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Sam was halfway through his jigsaw puzzle when the whole house went black. Outside, the wind howled and rain hammered on the roof. A storm had knocked out the power to the whole street.\n\nFor a moment nobody moved. Then Mum's voice came calmly through the dark. 'Everyone stay where you are. I'll find the torch.' Sam heard a drawer slide open, and then a small yellow light bounced across the walls.\n\nSoon the family had gathered in the lounge room. Dad lit two fat candles and set them on the table. Mum carried in a tin of biscuits and a stack of board games. 'No television tonight,' she said, smiling. 'We'll have to make our own fun.'\n\nSam had thought a night without power would be boring. Instead, the flickering candles made the room feel warm and secret, like a cave. He could not remember the last time the whole family had laughed so much.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "soft and gentle"
      },
      {
        "id": "opt-a",
        "text": "loud and wild"
      },
      {
        "id": "opt-c",
        "text": "warm and calm"
      },
      {
        "id": "opt-d",
        "text": "cool and light"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "A wind that 'howled' during a storm makes a loud, wild, crying sound, so 'loud and wild' fits. 'Soft and gentle' is the opposite of howling, and a howling wind in a storm is not warm, still, cool or light â€” those choices ignore the noisy, stormy picture the word paints.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "The night the lights went out",
      "skill": "Work out the meaning of a word in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "vocabulary",
        "word meaning",
        "context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-005",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The text is mainly about â€”",
    "stimulus": {
      "title": "The Platypus",
      "body": "The platypus is one of the strangest animals in the world. It lives in the rivers and creeks of eastern Australia. When scientists in Europe first saw a drawing of a platypus, they thought someone was playing a trick on them.\n\nIt is easy to see why. A platypus has a soft bill like a duck, a flat tail like a beaver, and webbed feet like an otter. Its body is covered in thick brown fur that keeps it warm in cold water.\n\nMost unusual of all is the way it has its young. Nearly all mammals give birth to live babies, but the platypus lays eggs. When the eggs hatch, the mother feeds her babies with milk, just as other mammals do.\n\nThe platypus hunts underwater with its eyes shut. It cannot see or smell its food. Instead, its bill can feel tiny movements made by worms and insects in the mud. In this clever way, the platypus finds a meal in the murky water.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "how scientists in Europe draw animals"
      },
      {
        "id": "opt-c",
        "text": "the many rivers of eastern Australia"
      },
      {
        "id": "opt-b",
        "text": "why the platypus is an unusual animal"
      },
      {
        "id": "opt-d",
        "text": "how mammals feed their babies milk"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "Every paragraph gives another reason the platypus is strange â€” its mixed-up body, laying eggs, and hunting with its eyes shut â€” so the whole text is about why it is unusual. The scientists, the rivers and how mammals feed milk are each mentioned only briefly and are details, not the main idea.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The platypus",
      "skill": "Identify the main idea of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "information report",
        "main idea",
        "animals"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-006",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The author wrote this text mainly to â€”",
    "stimulus": {
      "title": "The Platypus",
      "body": "The platypus is one of the strangest animals in the world. It lives in the rivers and creeks of eastern Australia. When scientists in Europe first saw a drawing of a platypus, they thought someone was playing a trick on them.\n\nIt is easy to see why. A platypus has a soft bill like a duck, a flat tail like a beaver, and webbed feet like an otter. Its body is covered in thick brown fur that keeps it warm in cold water.\n\nMost unusual of all is the way it has its young. Nearly all mammals give birth to live babies, but the platypus lays eggs. When the eggs hatch, the mother feeds her babies with milk, just as other mammals do.\n\nThe platypus hunts underwater with its eyes shut. It cannot see or smell its food. Instead, its bill can feel tiny movements made by worms and insects in the mud. In this clever way, the platypus finds a meal in the murky water.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "tell a funny story about a scientist"
      },
      {
        "id": "opt-b",
        "text": "teach readers how to catch a platypus"
      },
      {
        "id": "opt-d",
        "text": "warn people to keep away from rivers"
      },
      {
        "id": "opt-c",
        "text": "give facts about an unusual creature"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "The text is packed with facts about what the platypus looks like, how it has its young and how it hunts, so the author's purpose is to inform. It is not a made-up story, it never explains how to catch one, and it does not warn readers away from rivers.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The platypus",
      "skill": "Identify the author's purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "information report",
        "author purpose",
        "animals"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-007",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each part of the platypus to the animal the text says it is like.",
    "stimulus": {
      "title": "The Platypus",
      "body": "The platypus is one of the strangest animals in the world. It lives in the rivers and creeks of eastern Australia. When scientists in Europe first saw a drawing of a platypus, they thought someone was playing a trick on them.\n\nIt is easy to see why. A platypus has a soft bill like a duck, a flat tail like a beaver, and webbed feet like an otter. Its body is covered in thick brown fur that keeps it warm in cold water.\n\nMost unusual of all is the way it has its young. Nearly all mammals give birth to live babies, but the platypus lays eggs. When the eggs hatch, the mother feeds her babies with milk, just as other mammals do.\n\nThe platypus hunts underwater with its eyes shut. It cannot see or smell its food. Instead, its bill can feel tiny movements made by worms and insects in the mud. In this clever way, the platypus finds a meal in the murky water.",
      "attribution": "MindMosaic original"
    },
    "options": [],
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "src-bill",
          "text": "Its bill"
        },
        {
          "id": "src-tail",
          "text": "Its tail"
        },
        {
          "id": "src-feet",
          "text": "Its feet"
        }
      ],
      "targets": [
        {
          "id": "tgt-duck",
          "text": "like a duck"
        },
        {
          "id": "tgt-beaver",
          "text": "like a beaver"
        },
        {
          "id": "tgt-otter",
          "text": "like an otter"
        },
        {
          "id": "tgt-fish",
          "text": "like a fish"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "src-bill",
          "targetId": "tgt-duck"
        },
        {
          "sourceId": "src-tail",
          "targetId": "tgt-beaver"
        },
        {
          "sourceId": "src-feet",
          "targetId": "tgt-otter"
        }
      ]
    },
    "explanation": "The second paragraph lists the matches directly: a 'soft bill like a duck', a 'flat tail like a beaver' and 'webbed feet like an otter'. 'Like a fish' is not used for any body part in the text, so it is left over.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The platypus",
      "skill": "Locate and match details in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "information report",
        "matching",
        "compare",
        "animals"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-008",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How is the platypus different from nearly all other mammals?",
    "stimulus": {
      "title": "The Platypus",
      "body": "The platypus is one of the strangest animals in the world. It lives in the rivers and creeks of eastern Australia. When scientists in Europe first saw a drawing of a platypus, they thought someone was playing a trick on them.\n\nIt is easy to see why. A platypus has a soft bill like a duck, a flat tail like a beaver, and webbed feet like an otter. Its body is covered in thick brown fur that keeps it warm in cold water.\n\nMost unusual of all is the way it has its young. Nearly all mammals give birth to live babies, but the platypus lays eggs. When the eggs hatch, the mother feeds her babies with milk, just as other mammals do.\n\nThe platypus hunts underwater with its eyes shut. It cannot see or smell its food. Instead, its bill can feel tiny movements made by worms and insects in the mud. In this clever way, the platypus finds a meal in the murky water.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "It lays eggs instead of birthing live young"
      },
      {
        "id": "opt-b",
        "text": "It keeps its babies warm with thick fur"
      },
      {
        "id": "opt-c",
        "text": "It feeds its young milk, like mammals do"
      },
      {
        "id": "opt-d",
        "text": "It hunts for its food deep beneath the water"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The third paragraph says nearly all mammals give birth to live babies 'but the platypus lays eggs', so laying eggs is the difference. Feeding babies milk is something it shares with other mammals, and having fur or hunting underwater are not compared to other mammals as differences.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The platypus",
      "skill": "Compare and contrast details in a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information report",
        "compare",
        "inference",
        "animals"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How does Ravi feel as he stands at the top of the ladder?",
    "stimulus": {
      "title": "The Deep End",
      "body": "Ravi stood at the edge of the deep end, curling his toes over the cold tiles. All week he had practised in the shallow water, but the deep end was different. Down there the bottom of the pool seemed very far away.\n\n'You can do it,' called his sister, Priya, from the side. 'Just remember to kick.'\n\nRavi climbed onto the diving ladder. His hands gripped the rail so tightly that his knuckles turned white. He hesitated at the top, watching the water ripple below. What if he sank straight to the bottom?\n\nHe took a deep breath and jumped. For one frightening second the water closed over his head. Then his arms pulled and his legs kicked, just as he had practised, and his face broke back into the air.\n\nRavi was swimming. He was really swimming in the deep end. A huge grin spread across his face as he paddled towards Priya, who was cheering louder than anyone.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "Bored with all his swimming practice"
      },
      {
        "id": "opt-d",
        "text": "Nervous about jumping into deep water"
      },
      {
        "id": "opt-b",
        "text": "Proud that he already knows how to dive"
      },
      {
        "id": "opt-c",
        "text": "Cross with his sister for calling out"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "Ravi grips the rail until his knuckles turn white and worries 'What if he sank straight to the bottom?' â€” these are signs of nervousness. He is not bored, he has not dived yet so cannot feel proud, and Priya's words encourage him rather than annoy him.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The deep end",
      "skill": "Infer a character's feelings from clues",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "narrative",
        "inference",
        "feelings",
        "swimming"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-010",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Ravi's knuckles turn white?",
    "stimulus": {
      "title": "The Deep End",
      "body": "Ravi stood at the edge of the deep end, curling his toes over the cold tiles. All week he had practised in the shallow water, but the deep end was different. Down there the bottom of the pool seemed very far away.\n\n'You can do it,' called his sister, Priya, from the side. 'Just remember to kick.'\n\nRavi climbed onto the diving ladder. His hands gripped the rail so tightly that his knuckles turned white. He hesitated at the top, watching the water ripple below. What if he sank straight to the bottom?\n\nHe took a deep breath and jumped. For one frightening second the water closed over his head. Then his arms pulled and his legs kicked, just as he had practised, and his face broke back into the air.\n\nRavi was swimming. He was really swimming in the deep end. A huge grin spread across his face as he paddled towards Priya, who was cheering louder than anyone.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "He was feeling cold from the pool water"
      },
      {
        "id": "opt-c",
        "text": "He had scraped his hand on the ladder"
      },
      {
        "id": "opt-b",
        "text": "He was gripping the rail very tightly"
      },
      {
        "id": "opt-d",
        "text": "He was waving across to his sister"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "The text says his hands 'gripped the rail so tightly that his knuckles turned white', so the tight grip is the cause. The cold water made the tiles cold, not his knuckles white; there is no scrape mentioned; and he is holding the rail, not waving.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The deep end",
      "skill": "Identify cause and effect in a narrative",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "narrative",
        "cause and effect",
        "swimming"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is the main message of this story?",
    "stimulus": {
      "title": "The Deep End",
      "body": "Ravi stood at the edge of the deep end, curling his toes over the cold tiles. All week he had practised in the shallow water, but the deep end was different. Down there the bottom of the pool seemed very far away.\n\n'You can do it,' called his sister, Priya, from the side. 'Just remember to kick.'\n\nRavi climbed onto the diving ladder. His hands gripped the rail so tightly that his knuckles turned white. He hesitated at the top, watching the water ripple below. What if he sank straight to the bottom?\n\nHe took a deep breath and jumped. For one frightening second the water closed over his head. Then his arms pulled and his legs kicked, just as he had practised, and his face broke back into the air.\n\nRavi was swimming. He was really swimming in the deep end. A huge grin spread across his face as he paddled towards Priya, who was cheering louder than anyone.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "Always keep your sister close in the pool"
      },
      {
        "id": "opt-c",
        "text": "Deep water is too risky for young children"
      },
      {
        "id": "opt-d",
        "text": "Swimming lessons are not really worth doing"
      },
      {
        "id": "opt-a",
        "text": "Facing your fears can bring a proud reward"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "Ravi is frightened but jumps anyway, and he ends up grinning and proud that he can swim in the deep end. That shows the message: facing a fear can be worth it. The story is not warning that deep water is too risky, nor that swimming is pointless, and Priya's presence is a small detail, not the main lesson.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "The deep end",
      "skill": "Identify the theme or message of a story",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "narrative",
        "theme",
        "message",
        "swimming"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'He hesitated at the top of the ladder', the word 'hesitated' tells us Ravi â€”",
    "stimulus": {
      "title": "The Deep End",
      "body": "Ravi stood at the edge of the deep end, curling his toes over the cold tiles. All week he had practised in the shallow water, but the deep end was different. Down there the bottom of the pool seemed very far away.\n\n'You can do it,' called his sister, Priya, from the side. 'Just remember to kick.'\n\nRavi climbed onto the diving ladder. His hands gripped the rail so tightly that his knuckles turned white. He hesitated at the top, watching the water ripple below. What if he sank straight to the bottom?\n\nHe took a deep breath and jumped. For one frightening second the water closed over his head. Then his arms pulled and his legs kicked, just as he had practised, and his face broke back into the air.\n\nRavi was swimming. He was really swimming in the deep end. A huge grin spread across his face as he paddled towards Priya, who was cheering louder than anyone.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-c",
        "text": "paused before going on"
      },
      {
        "id": "opt-a",
        "text": "jumped straight in"
      },
      {
        "id": "opt-b",
        "text": "climbed down slowly"
      },
      {
        "id": "opt-d",
        "text": "shouted out with delight"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "To hesitate is to pause because you are unsure. Ravi 'hesitated at the top, watching the water ripple below', then took a breath before jumping â€” so he paused before going on. He did not jump straight in, climb back down, or shout with joy at that moment.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "The deep end",
      "skill": "Work out the meaning of a word in context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "vocabulary",
        "word meaning",
        "context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-013",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these stages of a frog's life in the order they happen in the text, from first to last.",
    "stimulus": {
      "title": "From Egg to Frog",
      "body": "A frog does not look like a frog when its life begins. It changes shape many times before it becomes an adult. This slow change is called a life cycle.\n\nIt starts when a mother frog lays a cluster of tiny eggs in a pond. The soft eggs float together in a jelly-like clump. After about a week, each egg hatches into a tadpole.\n\nA tadpole looks more like a little fish than a frog. It has a long tail for swimming and gills that let it breathe underwater. At this stage it cannot live out of the water at all.\n\nAs the weeks pass, the tadpole slowly grows back legs and then front legs. Its tail becomes shorter and shorter. Its gills disappear, and lungs grow inside its body so that it can breathe air.\n\nAt last the young frog is ready to climb out of the pond and hop onto the land. One day it will lay eggs of its own, and the life cycle will begin again.",
      "attribution": "MindMosaic original"
    },
    "options": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "item-legs",
          "text": "The tadpole grows legs and lungs"
        },
        {
          "id": "item-egg",
          "text": "A mother frog lays eggs in a pond"
        },
        {
          "id": "item-land",
          "text": "The young frog hops onto the land"
        },
        {
          "id": "item-hatch",
          "text": "The eggs hatch into tadpoles"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "item-egg",
        "item-hatch",
        "item-legs",
        "item-land"
      ]
    },
    "explanation": "Follow the text in order: the mother frog lays eggs, the eggs hatch into tadpoles, the tadpole grows legs and lungs while its tail shrinks, and finally the young frog hops onto the land. Reading each paragraph in turn gives the correct sequence.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "From egg to frog",
      "skill": "Sequence events in the order they happen",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "explanation",
        "sequencing",
        "life cycle",
        "frog"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How is a tadpole different from an adult frog?",
    "stimulus": {
      "title": "From Egg to Frog",
      "body": "A frog does not look like a frog when its life begins. It changes shape many times before it becomes an adult. This slow change is called a life cycle.\n\nIt starts when a mother frog lays a cluster of tiny eggs in a pond. The soft eggs float together in a jelly-like clump. After about a week, each egg hatches into a tadpole.\n\nA tadpole looks more like a little fish than a frog. It has a long tail for swimming and gills that let it breathe underwater. At this stage it cannot live out of the water at all.\n\nAs the weeks pass, the tadpole slowly grows back legs and then front legs. Its tail becomes shorter and shorter. Its gills disappear, and lungs grow inside its body so that it can breathe air.\n\nAt last the young frog is ready to climb out of the pond and hop onto the land. One day it will lay eggs of its own, and the life cycle will begin again.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "A tadpole hops around on the dry land"
      },
      {
        "id": "opt-d",
        "text": "A tadpole breathes water using its gills"
      },
      {
        "id": "opt-b",
        "text": "A tadpole lays tiny eggs in the pond"
      },
      {
        "id": "opt-c",
        "text": "A tadpole breathes the air using its lungs"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "The text says a tadpole has 'gills that let it breathe underwater', while an adult frog grows lungs to breathe air. So breathing with gills underwater is the difference. A tadpole cannot live out of water, does not lay eggs, and does not yet have lungs, so the other choices describe the frog, not the tadpole.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "From egg to frog",
      "skill": "Compare and contrast details in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "explanation",
        "compare",
        "life cycle",
        "frog"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-015",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why do lungs grow inside the young frog's body?",
    "stimulus": {
      "title": "From Egg to Frog",
      "body": "A frog does not look like a frog when its life begins. It changes shape many times before it becomes an adult. This slow change is called a life cycle.\n\nIt starts when a mother frog lays a cluster of tiny eggs in a pond. The soft eggs float together in a jelly-like clump. After about a week, each egg hatches into a tadpole.\n\nA tadpole looks more like a little fish than a frog. It has a long tail for swimming and gills that let it breathe underwater. At this stage it cannot live out of the water at all.\n\nAs the weeks pass, the tadpole slowly grows back legs and then front legs. Its tail becomes shorter and shorter. Its gills disappear, and lungs grow inside its body so that it can breathe air.\n\nAt last the young frog is ready to climb out of the pond and hop onto the land. One day it will lay eggs of its own, and the life cycle will begin again.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "So that the frog can swim more quickly"
      },
      {
        "id": "opt-c",
        "text": "So that the frog can lay more eggs"
      },
      {
        "id": "opt-a",
        "text": "So that the frog is able to breathe air"
      },
      {
        "id": "opt-d",
        "text": "So that the frog can grow a longer tail"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The fourth paragraph says 'lungs grow inside its body so that it can breathe air', which states the reason directly. Gills, not lungs, are for underwater life; lungs are not for laying eggs; and the tail actually becomes shorter, so it is not about growing a longer tail.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "From egg to frog",
      "skill": "Identify cause and effect in a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "explanation",
        "cause and effect",
        "life cycle",
        "frog"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-dd-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the sentence 'At this stage it cannot live out of the water', the word 'stage' means a â€”",
    "stimulus": {
      "title": "From Egg to Frog",
      "body": "A frog does not look like a frog when its life begins. It changes shape many times before it becomes an adult. This slow change is called a life cycle.\n\nIt starts when a mother frog lays a cluster of tiny eggs in a pond. The soft eggs float together in a jelly-like clump. After about a week, each egg hatches into a tadpole.\n\nA tadpole looks more like a little fish than a frog. It has a long tail for swimming and gills that let it breathe underwater. At this stage it cannot live out of the water at all.\n\nAs the weeks pass, the tadpole slowly grows back legs and then front legs. Its tail becomes shorter and shorter. Its gills disappear, and lungs grow inside its body so that it can breathe air.\n\nAt last the young frog is ready to climb out of the pond and hop onto the land. One day it will lay eggs of its own, and the life cycle will begin again.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "place where actors perform"
      },
      {
        "id": "opt-c",
        "text": "kind of small water animal"
      },
      {
        "id": "opt-d",
        "text": "fast way of swimming along"
      },
      {
        "id": "opt-b",
        "text": "a step in a set of changes"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "Here 'stage' means one step in the frog's life cycle â€” the tadpole point in a set of changes. The word can mean a place where actors perform, but that meaning does not fit a frog changing shape. A kind of animal and a way of swimming are not what 'stage' means at all.",
    "metadata": {
      "subject": "reading",
      "strand": "Vocabulary",
      "topic": "From egg to frog",
      "skill": "Work out the meaning of a word with more than one meaning",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "vocabulary",
        "word meaning",
        "multiple meanings"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On a rocky point at the edge of the sea, Mr Halloran looked after the old lighthouse. Every evening he climbed the winding stairs to light the great lamp so that ships could find their way home in the dark. But the wind off the water was so salty that almost nothing would grow near the lighthouse. Mr Halloran wanted a garden more than anything. He carried buckets of soil up from the valley, one at a time, for a whole month. He built a low stone wall to keep the worst of the wind out. At last, small green shoots appeared between the stones. When a fishing boat passed by, the sailors were amazed to see a splash of colour on the grey rock.\n\nWhich sentence best tells what this whole passage is mainly about?",
    "options": [
      {
        "id": "sailors-amazed",
        "text": "Sailors are amazed by a splash of colour on the grey rock."
      },
      {
        "id": "keeper-grows-garden",
        "text": "A lighthouse keeper works hard to grow a garden on salty rock."
      },
      {
        "id": "wind-stops-plants",
        "text": "The salty sea wind stops most plants from growing on rock."
      },
      {
        "id": "lamp-for-ships",
        "text": "A keeper lights a great lamp so passing ships can find their way."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "keeper-grows-garden"
    },
    "explanation": "The main idea is what every part of the text works towards. The wind, the buckets of soil, the wall and the shoots are all steps in one big effort: growing a garden in a place where things do not usually grow. The other options are true details but each covers only one small piece, so they are supporting details, not the main idea.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Narrative comprehension",
      "skill": "Identify the main idea of a passage",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "main idea",
        "reading comprehension",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On a rocky point at the edge of the sea, Mr Halloran looked after the old lighthouse. Every evening he climbed the winding stairs to light the great lamp so that ships could find their way home in the dark. But the wind off the water was so salty that almost nothing would grow near the lighthouse. Mr Halloran wanted a garden more than anything. He carried buckets of soil up from the valley, one at a time, for a whole month. He built a low stone wall to keep the worst of the wind out. At last, small green shoots appeared between the stones. When a fishing boat passed by, the sailors were amazed to see a splash of colour on the grey rock.\n\nWhy did Mr Halloran most likely carry buckets of soil up from the valley for a whole month?",
    "options": [
      {
        "id": "told-by-sailors",
        "text": "He was told to move the soil by the sailors."
      },
      {
        "id": "build-wall",
        "text": "He needed to build the stone wall out of soil."
      },
      {
        "id": "wanted-garden",
        "text": "He badly wanted a garden and the rock had no soil."
      },
      {
        "id": "bored-at-night",
        "text": "He was bored at night and had nothing else at all to do."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "wanted-garden"
    },
    "explanation": "To infer a motive, join two clues: the text says he 'wanted a garden more than anything', and that almost nothing would grow because of the salty wind. Bringing good soil from the valley is how he solves that problem. The wall was made of stone, not soil, and nothing shows the sailors or boredom caused his hard work.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Inference",
      "skill": "Infer a character's motive from evidence in the text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "inference",
        "motive",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On a rocky point at the edge of the sea, Mr Halloran looked after the old lighthouse. Every evening he climbed the winding stairs to light the great lamp so that ships could find their way home in the dark. But the wind off the water was so salty that almost nothing would grow near the lighthouse. Mr Halloran wanted a garden more than anything. He carried buckets of soil up from the valley, one at a time, for a whole month. He built a low stone wall to keep the worst of the wind out. At last, small green shoots appeared between the stones. When a fishing boat passed by, the sailors were amazed to see a splash of colour on the grey rock.\n\nIn this passage, the word shoots means â€”",
    "options": [
      {
        "id": "gun-sounds",
        "text": "sharp sounds like a gun makes"
      },
      {
        "id": "kicks",
        "text": "fast kicks towards a goal"
      },
      {
        "id": "darting",
        "text": "quick darting movements across the sports field"
      },
      {
        "id": "plant-stems",
        "text": "new green parts of a plant beginning to grow"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "plant-stems"
    },
    "explanation": "Work out a word's meaning from the words around it. 'Shoots' is described as 'small' and 'green', appearing between the stones just before a 'splash of colour' grows â€” so it must mean the first parts of new plants. The word 'shoots' can mean other things in sport or with guns, but those meanings do not fit a garden growing on a rock.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Vocabulary in context",
      "skill": "Work out the meaning of a word from context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "vocabulary",
        "context clues",
        "multiple meaning words"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya wanted to bake bread for the school fair. She mixed flour, water and yeast in a big bowl. Then she covered the bowl with a cloth and left it in a warm spot near the window, just as her grandmother had told her. While she waited, Priya tidied the kitchen and set out the baking trays. When she lifted the cloth an hour later, the dough had puffed up to twice its size. 'The yeast has been busy,' her grandmother laughed. Priya pushed the dough down, shaped it into rolls, and slid the tray into the hot oven.\n\nWhat did Priya do straight after she mixed the ingredients?",
    "options": [
      {
        "id": "covered-bowl",
        "text": "She covered the bowl with a cloth."
      },
      {
        "id": "shaped-rolls",
        "text": "She shaped the dough into rolls."
      },
      {
        "id": "into-oven",
        "text": "She slid the tray into the oven."
      },
      {
        "id": "lifted-cloth",
        "text": "She lifted the cloth to check the dough."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "covered-bowl"
    },
    "explanation": "To sequence events, follow the order words. The text says she mixed the ingredients, and then 'covered the bowl with a cloth'. Shaping rolls and using the oven happen later, and lifting the cloth comes an hour after covering. So the very next step is covering the bowl.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Sequence of events",
      "skill": "Sequence events in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "sequencing",
        "order of events",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya wanted to bake bread for the school fair. She mixed flour, water and yeast in a big bowl. Then she covered the bowl with a cloth and left it in a warm spot near the window, just as her grandmother had told her. While she waited, Priya tidied the kitchen and set out the baking trays. When she lifted the cloth an hour later, the dough had puffed up to twice its size. 'The yeast has been busy,' her grandmother laughed. Priya pushed the dough down, shaped it into rolls, and slid the tray into the hot oven.\n\nWhy did the dough puff up to twice its size?",
    "options": [
      {
        "id": "pushed-down",
        "text": "Priya pushed it down hard with both her hands."
      },
      {
        "id": "yeast-rose",
        "text": "The yeast slowly made the dough rise in the warmth."
      },
      {
        "id": "oven-hot",
        "text": "The kitchen oven had been turned up very hot."
      },
      {
        "id": "trays-out",
        "text": "Priya tidied the kitchen and set out all the baking trays."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "yeast-rose"
    },
    "explanation": "To find a cause, ask what made the change happen. The grandmother's clue, 'The yeast has been busy', links the rising directly to the yeast working in the warm spot. Pushing the dough down happens after it rose, the oven is used later, and setting out trays has nothing to do with the dough growing.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Cause and effect",
      "skill": "Identify cause and effect in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "cause and effect",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Our town library should open on Saturdays. Right now the doors stay shut all weekend, which is the only time many families are free. A library is more than a room full of books â€” it is a warm, quiet place where children can read, borrow stories and use the computers. Some people say opening on Saturday would cost too much. But the library already has staff who would happily swap a weekday shift for a Saturday one. Please write to the council and ask them to open our library on weekends.\n\nWhy did the author write this passage?",
    "options": [
      {
        "id": "how-to-borrow",
        "text": "To explain the steps for borrowing books from the library."
      },
      {
        "id": "tell-story",
        "text": "To tell an exciting story about a rainy Saturday morning."
      },
      {
        "id": "persuade-council",
        "text": "To convince readers to ask for Saturday opening."
      },
      {
        "id": "describe-building",
        "text": "To describe how the town library building was first built."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "persuade-council"
    },
    "explanation": "To find the author's purpose, notice what the writer wants you to do or think. This text uses opinion words ('should open') and ends by asking readers to 'write to the council'. That is persuading, not explaining steps, telling a story or describing a building. The clear call to act shows the purpose is to convince.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author's purpose",
      "skill": "Determine the author's purpose",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "author's purpose",
        "persuasive text",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-007",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Our town library should open on Saturdays. Right now the doors stay shut all weekend, which is the only time many families are free. A library is more than a room full of books â€” it is a warm, quiet place where children can read, borrow stories and use the computers. Some people say opening on Saturday would cost too much. But the library already has staff who would happily swap a weekday shift for a Saturday one. Please write to the council and ask them to open our library on weekends.\n\nDecide whether this statement is true or false: The author believes the library should stay closed on weekends.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "To find an author's point of view, look at what they argue for. The whole passage argues the library 'should open on Saturdays' and even asks readers to help make that happen. So the author wants it open, not closed â€” the statement says the opposite, which makes it false.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author's point of view",
      "skill": "Identify the author's point of view",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "point of view",
        "persuasive text",
        "true false"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Our town library should open on Saturdays. Right now the doors stay shut all weekend, which is the only time many families are free. A library is more than a room full of books â€” it is a warm, quiet place where children can read, borrow stories and use the computers. Some people say opening on Saturday would cost too much. But the library already has staff who would happily swap a weekday shift for a Saturday one. Please write to the council and ask them to open our library on weekends.\n\nIn this passage, to swap a weekday shift for a Saturday one means to â€”",
    "options": [
      {
        "id": "longer-shift",
        "text": "work a much longer shift every day"
      },
      {
        "id": "clean-library",
        "text": "clean the whole library after closing"
      },
      {
        "id": "leave-job",
        "text": "leave the library job for good"
      },
      {
        "id": "trade-days",
        "text": "trade one work day for a different one"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "trade-days"
    },
    "explanation": "Context tells you the meaning: the sentence is answering the worry about cost by saying staff would still work, just on a different day. 'Swap a weekday shift for a Saturday one' means giving up one day and taking another in its place â€” a trade. It does not mean working longer, cleaning, or quitting.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Vocabulary in context",
      "skill": "Work out the meaning of a word from context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "vocabulary",
        "context clues",
        "persuasive text"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam stood at the school gate holding his little sister's hand. It was her very first day, and her lip was trembling. Sam remembered his own first day, when the classroom had felt as big as a stadium. He knelt down so his eyes met hers. 'See that painting of the sun in the window? That's Miss Roy's room, and she lets you feed the class fish.' His sister sniffed, then looked up, and a tiny smile crept onto her face. When the bell rang, she let go of Sam's hand and walked in on her own.\n\nWhy did Sam point out the painting of the sun and the class fish?",
    "options": [
      {
        "id": "calm-sister",
        "text": "He wanted his nervous sister to feel calm and curious."
      },
      {
        "id": "show-off",
        "text": "He wanted to prove he knew the school better than she did."
      },
      {
        "id": "feed-fish-himself",
        "text": "He hoped a teacher would let him feed the class fish."
      },
      {
        "id": "find-own-room",
        "text": "He was looking for the way back to his own classroom."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "calm-sister"
    },
    "explanation": "Infer the motive from how the moment unfolds. His sister's lip was trembling, and Sam remembers his own scary first day, so he kneels to her level and points out something friendly and fun. Right after, she smiles and walks in alone â€” showing his aim was to help her feel less afraid, not to show off or find his own room.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Inference",
      "skill": "Infer a character's motive from evidence in the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 95,
      "tags": [
        "inference",
        "motive",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam stood at the school gate holding his little sister's hand. It was her very first day, and her lip was trembling. Sam remembered his own first day, when the classroom had felt as big as a stadium. He knelt down so his eyes met hers. 'See that painting of the sun in the window? That's Miss Roy's room, and she lets you feed the class fish.' His sister sniffed, then looked up, and a tiny smile crept onto her face. When the bell rang, she let go of Sam's hand and walked in on her own.\n\nHow did the sister's feelings change during the passage?",
    "options": [
      {
        "id": "excited-bored",
        "text": "She went from excited to bored."
      },
      {
        "id": "scared-braver",
        "text": "She went from scared to a bit braver."
      },
      {
        "id": "happy-angry",
        "text": "She went from happy to angry."
      },
      {
        "id": "sleepy-awake",
        "text": "She went from sleepy to being wide awake."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "scared-braver"
    },
    "explanation": "Track the feeling clues from start to end. At first her 'lip was trembling', which shows fear. By the end she smiles and 'walked in on her own', which shows courage. So her feeling moves from scared to braver. The other choices do not match either the trembling at the start or the brave walk at the end.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Character feelings",
      "skill": "Infer a character's feeling from evidence in the text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "inference",
        "feelings",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Twins Mia and Noah both entered the school garden competition, but they grew very different plants. Mia chose sunflowers because she loved the way they turn their faces to the sun. Noah planted carrots, since he could not wait to pull them up and crunch them. All summer Mia's flowers stretched taller than the fence, while Noah's carrots grew quietly under the soil. On judging day, the teacher gave Mia a ribbon for the tallest plant and Noah a ribbon for the tastiest vegetable.\n\nHow were Mia's and Noah's plants different?",
    "options": [
      {
        "id": "both-tall",
        "text": "Both of their plants grew tall above the garden fence."
      },
      {
        "id": "both-hidden",
        "text": "Both of their plants stayed hidden beneath the dark soil."
      },
      {
        "id": "tall-vs-underground",
        "text": "Mia's grew tall and showy while Noah's grew underground."
      },
      {
        "id": "neither-ribbon",
        "text": "Neither of their plants earned a ribbon on judging day."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "tall-vs-underground"
    },
    "explanation": "To compare, line up what the text says about each plant. Mia's sunflowers 'stretched taller than the fence' (tall and easy to see), while Noah's carrots 'grew quietly under the soil' (hidden underground). Only one option captures both differences correctly; the others get one or both plants wrong, or forget that both won ribbons.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Comparing information",
      "skill": "Compare information across parts of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "compare",
        "reading comprehension",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Twins Mia and Noah both entered the school garden competition, but they grew very different plants. Mia chose sunflowers because she loved the way they turn their faces to the sun. Noah planted carrots, since he could not wait to pull them up and crunch them. All summer Mia's flowers stretched taller than the fence, while Noah's carrots grew quietly under the soil. On judging day, the teacher gave Mia a ribbon for the tallest plant and Noah a ribbon for the tastiest vegetable.\n\nWhy did Mia choose to grow sunflowers?",
    "options": [
      {
        "id": "pull-crunch",
        "text": "She wanted something she could pull up and crunch."
      },
      {
        "id": "stay-hidden",
        "text": "She hoped they would stay hidden under the soil."
      },
      {
        "id": "vegetable-prize",
        "text": "She wanted a vegetable for the judging table."
      },
      {
        "id": "follow-sun",
        "text": "She loved how they turn their faces to the sun."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "follow-sun"
    },
    "explanation": "The reason is stated with the word 'because': Mia chose sunflowers 'because she loved the way they turn their faces to the sun'. The crunching reason belongs to Noah and his carrots, and sunflowers grow tall above ground rather than hidden, so those options mix up the two twins.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Cause and effect",
      "skill": "Identify cause and effect in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "cause and effect",
        "reading comprehension",
        "narrative"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-013",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Twins Mia and Noah both entered the school garden competition, but they grew very different plants. Mia chose sunflowers because she loved the way they turn their faces to the sun. Noah planted carrots, since he could not wait to pull them up and crunch them. All summer Mia's flowers stretched taller than the fence, while Noah's carrots grew quietly under the soil. On judging day, the teacher gave Mia a ribbon for the tallest plant and Noah a ribbon for the tastiest vegetable.\n\nHow many ribbons did the teacher give out in total?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 2,
      "tolerance": 0
    },
    "explanation": "Read closely and count the ribbons named. The teacher gave Mia one ribbon for the tallest plant and Noah one ribbon for the tastiest vegetable. One plus one makes two ribbons in total, even though only two children entered.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Locating details",
      "skill": "Identify a supporting detail in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "supporting detail",
        "reading comprehension",
        "counting"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Long ago, people told a story to explain why the magpie sings so sweetly at dawn. They said that when the world was new, all the birds were given a song, but the magpie was given none. Sad and silent, it listened carefully to every other bird â€” the warble of the currawong, the laugh of the kookaburra, the whistle of the wren. Slowly, the magpie wove these sounds into a song of its own, richer than any single bird's song. That, the old story says, is why the magpie's morning song holds a little piece of every voice in the bush.\n\nWhat was the author's main purpose in this passage?",
    "options": [
      {
        "id": "explain-song",
        "text": "To share a legend explaining why magpies sing sweetly."
      },
      {
        "id": "care-for-pet",
        "text": "To teach readers how to care for a pet magpie at home."
      },
      {
        "id": "list-birds",
        "text": "To list the names of all the different birds in the bush."
      },
      {
        "id": "nest-facts",
        "text": "To give facts about the way birds build their nests."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "explain-song"
    },
    "explanation": "Notice how the text signals its purpose: it opens with 'people told a story to explain why' and closes with 'the old story says'. This is a legend that explains something about nature. It is not a care guide, a plain list of birds, or nest facts, so its purpose is to share an explaining story.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Author's purpose",
      "skill": "Determine the author's purpose",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 95,
      "tags": [
        "author's purpose",
        "legend",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Long ago, people told a story to explain why the magpie sings so sweetly at dawn. They said that when the world was new, all the birds were given a song, but the magpie was given none. Sad and silent, it listened carefully to every other bird â€” the warble of the currawong, the laugh of the kookaburra, the whistle of the wren. Slowly, the magpie wove these sounds into a song of its own, richer than any single bird's song. That, the old story says, is why the magpie's morning song holds a little piece of every voice in the bush.\n\nWhat is the main idea of this passage?",
    "options": [
      {
        "id": "kookaburra-loud",
        "text": "The kookaburra has the loudest laugh of all in the bush."
      },
      {
        "id": "magpie-made-song",
        "text": "The magpie made its song from other birds' sounds."
      },
      {
        "id": "same-song",
        "text": "All birds were given the same song long ago."
      },
      {
        "id": "noisy-mornings",
        "text": "Mornings in the bush are always noisy and busy."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "magpie-made-song"
    },
    "explanation": "The main idea is the one point the whole story builds towards: the magpie had no song, listened to others, and 'wove these sounds into a song of its own'. That is why its song holds 'a piece of every voice'. The kookaburra line is just one detail, and the other options say things the text does not claim.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Main idea",
      "skill": "Identify the main idea of a passage",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "main idea",
        "legend",
        "reading comprehension"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-reading-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Long ago, people told a story to explain why the magpie sings so sweetly at dawn. They said that when the world was new, all the birds were given a song, but the magpie was given none. Sad and silent, it listened carefully to every other bird â€” the warble of the currawong, the laugh of the kookaburra, the whistle of the wren. Slowly, the magpie wove these sounds into a song of its own, richer than any single bird's song. That, the old story says, is why the magpie's morning song holds a little piece of every voice in the bush.\n\nWhat does the story mainly show about the magpie?",
    "options": [
      {
        "id": "too-proud",
        "text": "It was far too proud to listen to any other bird."
      },
      {
        "id": "gave-up",
        "text": "It gave up quickly the moment it was given no song."
      },
      {
        "id": "kept-trying",
        "text": "It listened closely and kept trying until it succeeded."
      },
      {
        "id": "copied-one",
        "text": "It copied just one bird and sang exactly like that bird."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "kept-trying"
    },
    "explanation": "Infer a character trait from actions. The magpie 'listened carefully to every other bird' and 'slowly' wove the sounds together, which shows patience and effort rather than giving up or pride. It also used many birds, not one, so the answer is that it listened and kept trying until it made its own song.",
    "metadata": {
      "subject": "reading",
      "strand": "Text Comprehension",
      "topic": "Inference",
      "skill": "Infer a character trait from evidence in the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 95,
      "tags": [
        "inference",
        "character trait",
        "legend"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
