import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 NAPLAN-style Reading â€” 10 original questions.
 * Every passage is newly written MindMosaic content.
 */
export const grade3NaplanReading = defineQuestions([
  {
    id: "g3-nap-read-literal-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Where did Prue finally find her kite?",
    instructions: "Read the story, then choose one answer.",
    stimulus: {
      title: "The Lost Kite",
      body: "Prue and her grandpa took the new dragon kite to the beach. The wind was wild that morning, whipping sand along the shore. As soon as Prue let out the string, the kite leapt into the sky like it wanted to escape. Then a huge gust tore the string right out of her hands! Prue and Grandpa hurried over the dunes, checking the spiky grass as they went. There was no sign of it near the rock pools either. At last, beside the walking track, Prue spotted a flash of red. The kite was tangled in a banksia bush, flapping gently like a resting bird.",
    },
    options: [
      { id: "dunes", text: "In the spiky grass on the dunes" },
      { id: "banksia-bush", text: "In a banksia bush beside the walking track" },
      { id: "rock-pools", text: "Near the rock pools" },
      { id: "shore", text: "On the sand along the shore" },
    ],
    answerKey: { kind: "single_option", optionId: "banksia-bush" },
    explanation:
      "The story says Prue spotted the kite beside the walking track, tangled in a banksia bush. The dunes and rock pools are places she searched without finding it.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Finding information in a story",
      skill: "Locating directly stated details",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["narrative"],
    },
  },
  {
    id: "g3-nap-read-sequence-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What should you do straight after adding the pebbles?",
    instructions: "Read the instructions, then choose one answer.",
    stimulus: {
      title: "How to Make a Terrarium",
      body: "A terrarium is a tiny garden inside a jar. First, wash a large glass jar and let it dry. Next, pour a layer of small pebbles into the bottom. The pebbles help extra water drain away from the roots. After the pebbles, add a thick layer of potting soil. Then use a spoon to dig little holes and lower in your seedlings. Press the soil gently around each one. Finally, spray the plants with water and put the lid on loosely. Place your terrarium somewhere bright, but keep it out of the hot afternoon sun.",
    },
    options: [
      { id: "wash-jar", text: "Wash the glass jar" },
      { id: "plant-seedlings", text: "Lower in the seedlings" },
      { id: "add-soil", text: "Add a layer of potting soil" },
      { id: "spray-water", text: "Spray the plants with water" },
    ],
    answerKey: { kind: "single_option", optionId: "add-soil" },
    explanation:
      "The instructions say to add a thick layer of potting soil after the pebbles. Washing the jar happens first, and the seedlings and water come later.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Following a procedure",
      skill: "Identifying the order of steps",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["procedure"],
    },
  },
  {
    id: "g3-nap-read-infer-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did Sam stay very still?",
    instructions: "Read the story, then choose one answer.",
    stimulus: {
      title: "The Quiet Visitor",
      body: "Sam was picking beans in the vegie patch when he heard a soft rustle. A blue-tongue lizard was sliding slowly out from under the rhubarb leaves. Its scales shone like little river stones. Sam froze with the bucket still in his hand. He hardly even breathed. The lizard flicked out its bright blue tongue, tasted the air, and wandered right past his boots. When it finally disappeared behind the water tank, Sam let out a long, happy sigh. Wait until he told his sister about this!",
    },
    options: [
      { id: "scared", text: "He was too scared to move" },
      { id: "tired", text: "He was tired from picking beans" },
      { id: "hiding", text: "He was hiding from his sister" },
      { id: "not-frighten", text: "He did not want to frighten the lizard away" },
    ],
    answerKey: { kind: "single_option", optionId: "not-frighten" },
    explanation:
      "Sam froze and hardly breathed while watching the lizard, then sighed happily and wanted to tell his sister. This shows he stayed still so the lizard would not be frightened away, not because he was scared.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Inferring character motivation",
      skill: "Inferring reasons for actions",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["narrative", "inference"],
    },
  },
  {
    id: "g3-nap-read-vocab-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "In this sentence, what does 'exhausted' mean?",
    instructions: "Read the sentence, then choose one answer.",
    stimulus: {
      body: "After the long bushwalk, Ben was exhausted and fell asleep straight after dinner.",
    },
    options: [
      { id: "very-tired", text: "Very tired" },
      { id: "very-hungry", text: "Very hungry" },
      { id: "very-excited", text: "Very excited" },
      { id: "very-cold", text: "Very cold" },
    ],
    answerKey: { kind: "single_option", optionId: "very-tired" },
    explanation:
      "Ben fell asleep straight after dinner because the long bushwalk had worn him out, so 'exhausted' means very tired.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Word meaning from context",
      skill: "Using context clues for word meaning",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["vocabulary"],
    },
  },
  {
    id: "g3-nap-read-table-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which activity starts at 11:00 on Saturday?",
    instructions: "Use the library timetable, then choose one answer.",
    options: [
      { id: "story-circle", text: "Story circle" },
      { id: "craft-corner", text: "Craft corner" },
      { id: "puppet-show", text: "Puppet show" },
      { id: "book-club", text: "Book club" },
    ],
    visuals: [
      {
        id: "g3-library-timetable",
        type: "table",
        title: "Weekend activities at Wattle Creek Library",
        altText:
          "Timetable showing story circle on Saturday at 10:00, craft corner on Saturday at 11:00, puppet show on Sunday at 11:00 and book club on Sunday at 13:00.",
        data: {
          headers: ["Activity", "Day", "Start time"],
          rows: [
            ["Story circle", "Saturday", "10:00"],
            ["Craft corner", "Saturday", "11:00"],
            ["Puppet show", "Sunday", "11:00"],
            ["Book club", "Sunday", "13:00"],
          ],
          rowHeaders: true,
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "craft-corner" },
    explanation:
      "The timetable shows craft corner on Saturday at 11:00. The puppet show also starts at 11:00, but it is on Sunday.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Reading a timetable",
      skill: "Finding information in a table",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["timetable", "table"],
    },
  },
  {
    id: "g3-nap-read-fact-001",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the two statements from the flyer that are facts.",
    instructions:
      "A fact can be checked. An opinion is what someone thinks or feels. Choose two answers.",
    stimulus: {
      title: "Come to Riverbend Zoo!",
      body: "Riverbend Zoo opens at 9 o'clock every morning. It is the best place in the whole world for a family day out. The keepers feed the penguins at midday, and watching them waddle to their fish is the most fun you can ever have.",
    },
    options: [
      { id: "opens-nine", text: "The zoo opens at 9 o'clock every morning." },
      { id: "best-place", text: "The zoo is the best place for a family day out." },
      { id: "penguins-midday", text: "The penguins are fed at midday." },
      { id: "most-fun", text: "Watching the penguins is the most fun you can ever have." },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["opens-nine", "penguins-midday"],
    },
    explanation:
      "The opening time and the penguin feeding time can be checked, so they are facts. Saying the zoo is 'the best place' or 'the most fun' is what the writer thinks, so those are opinions.",
    metadata: {
      subject: "reading",
      strand: "Analysing and evaluating",
      topic: "Telling facts from opinions",
      skill: "Distinguishing fact from opinion",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["persuasive", "fact-opinion"],
    },
  },
  {
    id: "g3-nap-read-literal-002",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "True or false? According to the text, emus are fast runners.",
    instructions: "Read the text, then choose true or false.",
    stimulus: {
      title: "Emus",
      body: "The emu is Australia's tallest bird. Emus cannot fly, but their long, powerful legs make them very fast runners. An emu can sprint quicker than a car driving down a suburban street. Emus eat seeds, fruits and insects, and they swallow small stones to help grind up their food.",
    },
    answerKey: { kind: "boolean", value: true },
    explanation:
      "The text says emus' long, powerful legs make them very fast runners, so the statement is true.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Checking statements against a text",
      skill: "Verifying details in an information text",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["information-text"],
    },
  },
  {
    id: "g3-nap-read-sequence-002",
    type: "ordering",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put the events from the story in the order they happened.",
    instructions: "Read the story, then arrange the events from first to last.",
    stimulus: {
      title: "Pancake Morning",
      body: "On Sunday morning, Ruby helped Dad make pancakes. First they stirred flour and milk together in the big striped bowl. Next, Ruby carefully cracked in two eggs and whisked everything until it was smooth. Then Dad cooked the pancakes in the hot pan, flipping each one high in the air. At last the whole family sat down and ate the warm pancakes with lemon and sugar.",
    },
    interaction: {
      type: "ordering",
      items: [
        { id: "event-stir", text: "Flour and milk are stirred in the bowl" },
        { id: "event-eggs", text: "Ruby cracks in the eggs" },
        { id: "event-cook", text: "Dad cooks the pancakes" },
        { id: "event-eat", text: "The family eats the pancakes" },
      ],
    },
    answerKey: {
      kind: "ordering",
      optionIds: ["event-stir", "event-eggs", "event-cook", "event-eat"],
    },
    explanation:
      "The story uses order words: 'first' they stirred flour and milk, 'next' Ruby cracked the eggs, 'then' Dad cooked the pancakes, and 'at last' the family ate them.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Ordering story events",
      skill: "Sequencing events in a narrative",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["narrative", "sequencing"],
    },
  },
  {
    id: "g3-nap-read-literal-003",
    type: "short_answer",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is the name of Milly's dog?",
    instructions: "Read the text, then write your answer.",
    stimulus: {
      title: "Rainy Day Walk",
      body: "Milly's dog, Biscuit, loves rainy days more than anything. The moment the first drops tap on the roof, Biscuit fetches his lead and waits by the door with his tail thumping. On their walk, Biscuit splashes through every single puddle, while Milly hops around them in her gumboots.",
    },
    answerKey: {
      kind: "text",
      acceptableAnswers: ["Biscuit"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The text introduces 'Milly's dog, Biscuit', so the dog's name is Biscuit.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Recalling a detail",
      skill: "Recalling names and details",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["narrative"],
    },
  },
  {
    id: "g3-nap-read-vocab-002",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the best meaning for the word as it is used in the sentence.",
    instructions: "Read the sentence, then pick one answer from the box.",
    stimulus: {
      body: "The wind was so strong that it nearly blew Dad's hat into the pond.",
    },
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "strong-meaning",
          label: "In this sentence, 'strong' means",
          options: [
            { id: "powerful", text: "powerful" },
            { id: "heavy", text: "heavy" },
            { id: "loud", text: "loud" },
            { id: "brave", text: "brave" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [{ id: "strong-meaning", correctOptionId: "powerful" }],
    },
    explanation:
      "A wind that nearly blows a hat away has great force, so 'strong' here means powerful.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Word meaning from context",
      skill: "Choosing the best word meaning",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["vocabulary"],
    },
  },
  {
    id: "naplan-y3-reading-b-001",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What colour was Priya's sunhat?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Runaway Hat",
      body: "On the windiest day of the year, Priya wore her new sunhat to the beach. It was yellow with a wide brim, and her aunt had sewn a green button on the front.\n\nPriya built a sandcastle near the rock pools. She was patting the last wall smooth when a gust of wind lifted her hat and rolled it down the sand like a wheel. Priya jumped up and chased it.\n\nThe hat bounced over a towel, spun past a sleeping dog, and stopped at the feet of a boy holding a bucket of shells. He picked it up and turned it over.\n\n\"Is this yours?\" he asked. \"I saw it fly past.\"\n\nPriya nodded, out of breath. \"Thank you. My aunt made it for me.\"\n\nThe boy grinned. \"I'm Theo. Want to help me find more shells? The best ones are past the rocks.\"\n\nPriya put her hat back on and held onto it tightly with one hand. Together they walked towards the rock pools.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "green", text: "Green" },
      { id: "yellow", text: "Yellow" },
      { id: "orange", text: "Orange" },
      { id: "purple", text: "Purple" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "yellow",
    },
    explanation: "Reread the second sentence: 'It was yellow with a wide brim.' The hat is yellow. Green is a trap â€” that is the colour of the button on the front, not the hat. Orange and purple are never mentioned.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Recalling a stated detail",
      skill: "Locating a directly stated detail",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["narrative", "locating information", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-002",
    type: "ordering",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these events from the story in the order they happened, from first to last.",
    instructions: "Read the story, then place the events in the correct order.",
    stimulus: {
      title: "The Runaway Hat",
      body: "On the windiest day of the year, Priya wore her new sunhat to the beach. It was yellow with a wide brim, and her aunt had sewn a green button on the front.\n\nPriya built a sandcastle near the rock pools. She was patting the last wall smooth when a gust of wind lifted her hat and rolled it down the sand like a wheel. Priya jumped up and chased it.\n\nThe hat bounced over a towel, spun past a sleeping dog, and stopped at the feet of a boy holding a bucket of shells. He picked it up and turned it over.\n\n\"Is this yours?\" he asked. \"I saw it fly past.\"\n\nPriya nodded, out of breath. \"Thank you. My aunt made it for me.\"\n\nThe boy grinned. \"I'm Theo. Want to help me find more shells? The best ones are past the rocks.\"\n\nPriya put her hat back on and held onto it tightly with one hand. Together they walked towards the rock pools.",
      attribution: "MindMosaic original",
    },
    interaction: {
      type: "ordering",
      items: [
        {
          id: "theo-picks-up",
          text: "Theo picks up the hat and asks if it is Priya's.",
        },
        {
          id: "built-sandcastle",
          text: "Priya builds a sandcastle near the rock pools.",
        },
        {
          id: "walk-to-rocks",
          text: "Priya and Theo walk towards the rock pools together.",
        },
        {
          id: "wind-lifts-hat",
          text: "The wind lifts the hat and rolls it down the sand.",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["built-sandcastle", "wind-lifts-hat", "theo-picks-up", "walk-to-rocks"],
    },
    explanation: "Follow the story from the start. First Priya is building her sandcastle. Then the wind lifts the hat away. She chases it and Theo picks it up and asks if it is hers. Last of all, the two of them walk off towards the rock pools together. Look for the order the sentences appear in the text.",
    metadata: {
      subject: "reading",
      strand: "Narrative comprehension",
      topic: "Ordering story events",
      skill: "Sequencing events in a story",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["narrative", "sequencing", "ordering", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Read this part of the story: 'a gust of wind lifted her hat'. What does the word gust mean?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Runaway Hat",
      body: "On the windiest day of the year, Priya wore her new sunhat to the beach. It was yellow with a wide brim, and her aunt had sewn a green button on the front.\n\nPriya built a sandcastle near the rock pools. She was patting the last wall smooth when a gust of wind lifted her hat and rolled it down the sand like a wheel. Priya jumped up and chased it.\n\nThe hat bounced over a towel, spun past a sleeping dog, and stopped at the feet of a boy holding a bucket of shells. He picked it up and turned it over.\n\n\"Is this yours?\" he asked. \"I saw it fly past.\"\n\nPriya nodded, out of breath. \"Thank you. My aunt made it for me.\"\n\nThe boy grinned. \"I'm Theo. Want to help me find more shells? The best ones are past the rocks.\"\n\nPriya put her hat back on and held onto it tightly with one hand. Together they walked towards the rock pools.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "gentle", text: "A light, gentle breeze" },
      { id: "thunder", text: "A loud clap of thunder" },
      { id: "strong-rush", text: "A sudden, strong rush of wind" },
      { id: "cloud", text: "A soft grey rain cloud" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "strong-rush",
    },
    explanation: "Use the clues around the word. The wind lifted the hat right off Priya's head and rolled it 'down the sand like a wheel'. Only a strong, sudden rush of wind could do that, so 'gust' means a sudden strong wind. A gentle breeze would not carry a hat away, and thunder and clouds are not moving air at all.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Meaning from context",
      skill: "Working out a word's meaning from context",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["narrative", "vocabulary", "word meaning", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-004",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is a baby echidna called?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Amazing Echidna",
      body: "Echidnas are one of only two kinds of animal in the world that lay eggs but also feed their babies milk. They live all over Australia, in forests, deserts and grassy hills.\n\nAn echidna is covered in sharp spines. When it feels afraid, it does not run away. Instead, it curls into a tight ball, or digs straight down into the soil until only its spines can be seen. This keeps it safe from animals that might try to eat it.\n\nEchidnas have no teeth. They use a long, sticky tongue to catch the ants and termites they eat. A hungry echidna can flick its tongue in and out about one hundred times in a single minute.\n\nA baby echidna is called a puggle. It stays safe inside a pouch on its mother's body until its spines begin to grow. After that it lives in a burrow, where its mother comes to feed it.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "joey", text: "A joey" },
      { id: "chick", text: "A chick" },
      { id: "duckling", text: "A duckling" },
      { id: "puggle", text: "A puggle" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "puggle",
    },
    explanation: "The last paragraph says it straight out: 'A baby echidna is called a puggle.' Find that sentence and copy the word. A joey is a baby kangaroo, a chick is a baby chicken and a duckling is a baby duck, so those are traps from other animals.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Recalling a stated fact",
      skill: "Finding a fact in an information text",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["information text", "locating information", "animals", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-005",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What is this text mostly about?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Amazing Echidna",
      body: "Echidnas are one of only two kinds of animal in the world that lay eggs but also feed their babies milk. They live all over Australia, in forests, deserts and grassy hills.\n\nAn echidna is covered in sharp spines. When it feels afraid, it does not run away. Instead, it curls into a tight ball, or digs straight down into the soil until only its spines can be seen. This keeps it safe from animals that might try to eat it.\n\nEchidnas have no teeth. They use a long, sticky tongue to catch the ants and termites they eat. A hungry echidna can flick its tongue in and out about one hundred times in a single minute.\n\nA baby echidna is called a puggle. It stays safe inside a pouch on its mother's body until its spines begin to grow. After that it lives in a burrow, where its mother comes to feed it.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "whole", text: "What echidnas are like and how they live" },
      { id: "digging", text: "How an echidna digs down deep into the soil" },
      { id: "desert", text: "Why echidnas live only in the hot desert" },
      { id: "eaten", text: "The animals that try to eat an echidna" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "whole",
    },
    explanation: "The main idea is what the whole text is about, not just one sentence. This text tells us how echidnas have babies, how they stay safe, what they eat and where their babies grow â€” that is 'what echidnas are like and how they live'. Digging, the desert and being eaten are each only small parts of the text, so they are too narrow to be the main idea.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Identifying the main idea",
      skill: "Identifying the main idea of a text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["information text", "main idea", "animals", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-006",
    type: "matching",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Using the text, match each part of the echidna to what it is used for.",
    instructions: "Read the text, then match each part to its use.",
    stimulus: {
      title: "The Amazing Echidna",
      body: "Echidnas are one of only two kinds of animal in the world that lay eggs but also feed their babies milk. They live all over Australia, in forests, deserts and grassy hills.\n\nAn echidna is covered in sharp spines. When it feels afraid, it does not run away. Instead, it curls into a tight ball, or digs straight down into the soil until only its spines can be seen. This keeps it safe from animals that might try to eat it.\n\nEchidnas have no teeth. They use a long, sticky tongue to catch the ants and termites they eat. A hungry echidna can flick its tongue in and out about one hundred times in a single minute.\n\nA baby echidna is called a puggle. It stays safe inside a pouch on its mother's body until its spines begin to grow. After that it lives in a burrow, where its mother comes to feed it.",
      attribution: "MindMosaic original",
    },
    interaction: {
      type: "matching",
      sources: [
        {
          id: "spines",
          text: "Its sharp spines",
        },
        {
          id: "tongue",
          text: "Its long, sticky tongue",
        },
        {
          id: "pouch",
          text: "The pouch on the mother's body",
        },
      ],
      targets: [
        {
          id: "keep-safe",
          text: "Keeping the echidna safe from animals",
        },
        {
          id: "catch-food",
          text: "Catching ants and termites to eat",
        },
        {
          id: "carry-baby",
          text: "Keeping the baby echidna safe",
        },
        {
          id: "find-water",
          text: "Digging tunnels to find water",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "spines",
          targetId: "keep-safe",
        },
        {
          sourceId: "tongue",
          targetId: "catch-food",
        },
        {
          sourceId: "pouch",
          targetId: "carry-baby",
        },
      ],
    },
    explanation: "Match each part to the job the text gives it. The spines keep the echidna safe from animals that might eat it. The sticky tongue is used to catch ants and termites. The mother's pouch keeps the baby safe until its spines grow. 'Digging tunnels to find water' is not in the text at all, so it is left over.",
    metadata: {
      subject: "reading",
      strand: "Information text comprehension",
      topic: "Linking features to their use",
      skill: "Matching parts of an animal to their use",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 100,
      tags: ["information text", "matching", "animals", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-007",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "The text says an echidna can flick its tongue about one hundred times in a minute. What does this tell you about how an echidna eats?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Amazing Echidna",
      body: "Echidnas are one of only two kinds of animal in the world that lay eggs but also feed their babies milk. They live all over Australia, in forests, deserts and grassy hills.\n\nAn echidna is covered in sharp spines. When it feels afraid, it does not run away. Instead, it curls into a tight ball, or digs straight down into the soil until only its spines can be seen. This keeps it safe from animals that might try to eat it.\n\nEchidnas have no teeth. They use a long, sticky tongue to catch the ants and termites they eat. A hungry echidna can flick its tongue in and out about one hundred times in a single minute.\n\nA baby echidna is called a puggle. It stays safe inside a pouch on its mother's body until its spines begin to grow. After that it lives in a burrow, where its mother comes to feed it.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "chews", text: "It chews its food slowly with its sharp teeth." },
      { id: "quick", text: "It catches many tiny insects very quickly with its tongue." },
      { id: "one-meal", text: "It only eats one large meal on each day." },
      { id: "stones", text: "It swallows small stones and grit to help grind up its food." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "quick",
    },
    explanation: "Put two clues together. The echidna eats ants and termites, which are tiny, and its tongue moves about one hundred times a minute â€” that is very fast. So it must catch lots of little insects quickly. The 'sharp teeth' answer cannot be right because the text says echidnas have no teeth. The other two ideas are never mentioned.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Drawing a conclusion",
      skill: "Drawing a conclusion from a stated fact",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["information text", "inference", "animals", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-008",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "How deep should you push the sunflower seed into the soil?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "How to Plant a Sunflower Seed",
      body: "You will need: a small pot, some potting soil, one sunflower seed, and water.\n\n1. Fill the pot almost to the top with potting soil.\n2. Push one seed into the soil with your finger, about as deep as your first knuckle.\n3. Cover the seed gently with a little more soil.\n4. Water the soil until it is damp, but not soaking wet.\n5. Put the pot on a sunny windowsill.\n\nCheck the pot each day. When the soil feels dry, add a little water. In about one week, a small green shoot will push up through the soil. Keep the pot in the sunlight, and soon your sunflower will grow taller than you!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "bottom", text: "All the way to the bottom of the pot" },
      { id: "ontop", text: "Just resting on top of the soil" },
      { id: "knuckle", text: "About as deep as your first knuckle" },
      { id: "whole-hand", text: "As deep as your whole hand" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "knuckle",
    },
    explanation: "Look at step 2: 'Push one seed into the soil with your finger, about as deep as your first knuckle.' That is the exact depth. Pushing to the bottom or using your whole hand would be far too deep, and leaving the seed on top means it is not planted at all.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Recalling a step",
      skill: "Following a specific step in instructions",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["instructions", "locating information", "gardening", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why did the writer write this text?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "How to Plant a Sunflower Seed",
      body: "You will need: a small pot, some potting soil, one sunflower seed, and water.\n\n1. Fill the pot almost to the top with potting soil.\n2. Push one seed into the soil with your finger, about as deep as your first knuckle.\n3. Cover the seed gently with a little more soil.\n4. Water the soil until it is damp, but not soaking wet.\n5. Put the pot on a sunny windowsill.\n\nCheck the pot each day. When the soil feels dry, add a little water. In about one week, a small green shoot will push up through the soil. Keep the pot in the sunlight, and soon your sunflower will grow taller than you!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "story", text: "To tell an exciting garden story" },
      { id: "describe", text: "To describe what sunflowers look like" },
      { id: "list", text: "To list some flower names" },
      { id: "teach", text: "To teach you how to plant a sunflower seed" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "teach",
    },
    explanation: "Think about the shape of the text. It starts with a 'You will need' list and then gives numbered steps to follow in order. Texts built like this are written to teach you how to do something â€” here, how to plant a sunflower seed. It does not tell a story, describe how sunflowers look, or list flower names.",
    metadata: {
      subject: "reading",
      strand: "Analysing and evaluating",
      topic: "Author's purpose",
      skill: "Identifying the purpose of a text",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["instructions", "author purpose", "gardening", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-010",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does the writer tell you to put the pot on a sunny windowsill?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "How to Plant a Sunflower Seed",
      body: "You will need: a small pot, some potting soil, one sunflower seed, and water.\n\n1. Fill the pot almost to the top with potting soil.\n2. Push one seed into the soil with your finger, about as deep as your first knuckle.\n3. Cover the seed gently with a little more soil.\n4. Water the soil until it is damp, but not soaking wet.\n5. Put the pot on a sunny windowsill.\n\nCheck the pot each day. When the soil feels dry, add a little water. In about one week, a small green shoot will push up through the soil. Keep the pot in the sunlight, and soon your sunflower will grow taller than you!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "sun", text: "Because a sunflower needs sunlight to grow well" },
      { id: "fall", text: "So the pot does not fall off the table" },
      { id: "remember", text: "So you will always remember to water the pot each day" },
      { id: "cool", text: "So the soil stays cool and damp all week" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "sun",
    },
    explanation: "The last lines say to 'keep the pot in the sunlight' and then the sunflower 'will grow taller than you'. Linking sunlight to growing tells you the plant needs sun to grow, so that is why it goes on a sunny windowsill. A sunny spot would make soil warmer, not cooler, and the text never links the windowsill to falling or to remembering.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Reason for an instruction",
      skill: "Inferring the reason behind an instruction",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["instructions", "inference", "gardening", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-011",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What does the child pull on before going outside?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Biggest Puddle",
      body: "When the grey clouds burst and the raindrops fall,\nI wait by the window, my boots in the hall.\nThe garden turns shiny, the path becomes wet,\nand the biggest brown puddle I ever have met\n\nsits fat by the gate where the driveway dips low.\nI pull on my raincoat and out I will go!\nI stamp and I splash till my socks are all soaked,\nthen Mum at the door calls my name, soft and slow.\n\nIt's time to come in for a warm cup and dry,\nbut tomorrow it might rain again â€” my, oh my!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "boots", text: "Some boots" },
      { id: "raincoat", text: "A raincoat" },
      { id: "hat", text: "A warm hat" },
      { id: "socks", text: "Dry socks" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "raincoat",
    },
    explanation: "Find the line with the words 'pull on': 'I pull on my raincoat and out I will go!' So the child pulls on a raincoat. Boots are a trap â€” they are waiting 'in the hall', but the poem never says the child puts them on. The socks get soaked later, and no hat is mentioned.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Recalling a detail",
      skill: "Finding a detail in a poem",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["poem", "locating information", "weather", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "How does the child feel about the rainy day?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Biggest Puddle",
      body: "When the grey clouds burst and the raindrops fall,\nI wait by the window, my boots in the hall.\nThe garden turns shiny, the path becomes wet,\nand the biggest brown puddle I ever have met\n\nsits fat by the gate where the driveway dips low.\nI pull on my raincoat and out I will go!\nI stamp and I splash till my socks are all soaked,\nthen Mum at the door calls my name, soft and slow.\n\nIt's time to come in for a warm cup and dry,\nbut tomorrow it might rain again â€” my, oh my!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "bored", text: "Bored and grumpy" },
      { id: "scared", text: "Scared and worried" },
      { id: "happy", text: "Excited and happy" },
      { id: "tired", text: "Tired and sleepy" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "happy",
    },
    explanation: "There is no feeling word, so watch what the child does. They wait eagerly by the window, rush out ('out I will go!'), stamp and splash in the puddle, and even hope it rains again tomorrow. All of this shows the child is excited and happy. A bored, scared or sleepy child would not run out to jump in a puddle.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Inferring feelings",
      skill: "Working out how a person feels",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["poem", "inference", "feelings", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-013",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does the child stop splashing in the puddle?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "The Biggest Puddle",
      body: "When the grey clouds burst and the raindrops fall,\nI wait by the window, my boots in the hall.\nThe garden turns shiny, the path becomes wet,\nand the biggest brown puddle I ever have met\n\nsits fat by the gate where the driveway dips low.\nI pull on my raincoat and out I will go!\nI stamp and I splash till my socks are all soaked,\nthen Mum at the door calls my name, soft and slow.\n\nIt's time to come in for a warm cup and dry,\nbut tomorrow it might rain again â€” my, oh my!",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "rain-stops", text: "Because the rain has stopped" },
      { id: "dried", text: "Because the puddle dried up" },
      { id: "boot", text: "Because a boot got lost" },
      { id: "mum", text: "Because Mum calls the child to come inside" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "mum",
    },
    explanation: "Read the end of the poem: 'then Mum at the door calls my name' and 'It's time to come in.' The child stops because Mum calls them inside. The rain has not stopped â€” the child even says it 'might rain again' tomorrow â€” the puddle has not dried, and no boot is lost.",
    metadata: {
      subject: "reading",
      strand: "Integrating and interpreting",
      topic: "Cause of an event",
      skill: "Working out why an event happens",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 85,
      tags: ["poem", "inference", "cause and effect", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-014",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Who is this note written to?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "A Note from Grandpa",
      body: "Dear Ollie,\n\nI have gone next door to help Mrs Patel move her heavy bookshelf. I should be back home by half past four.\n\nYour afternoon snack is in the blue container on the bottom shelf of the fridge. Please do not share any of it with Biscuit. The vet said Biscuit must never eat grapes, and there are grapes inside.\n\nIf you finish your reading before I get home, you may feed the chickens. The scoop is hanging by the back door, and one scoopful each is plenty.\n\nSee you soon,\nGrandpa",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "ollie", text: "Ollie" },
      { id: "patel", text: "Mrs Patel" },
      { id: "vet", text: "The vet" },
      { id: "biscuit", text: "Biscuit" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "ollie",
    },
    explanation: "A note or letter usually starts with 'Dear ___' to show who it is for. This one begins 'Dear Ollie', so the note is written to Ollie. Mrs Patel, the vet and Biscuit are all mentioned inside the note, but the note is not addressed to any of them.",
    metadata: {
      subject: "reading",
      strand: "Analysing and evaluating",
      topic: "Identifying the audience",
      skill: "Identifying who a text is written for",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["note", "audience", "locating information", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-015",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Why does Grandpa say not to share the snack with Biscuit?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "A Note from Grandpa",
      body: "Dear Ollie,\n\nI have gone next door to help Mrs Patel move her heavy bookshelf. I should be back home by half past four.\n\nYour afternoon snack is in the blue container on the bottom shelf of the fridge. Please do not share any of it with Biscuit. The vet said Biscuit must never eat grapes, and there are grapes inside.\n\nIf you finish your reading before I get home, you may feed the chickens. The scoop is hanging by the back door, and one scoopful each is plenty.\n\nSee you soon,\nGrandpa",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "dinner", text: "Because Biscuit already ate his dinner" },
      { id: "grapes", text: "Because the snack has grapes, which Biscuit must not eat" },
      { id: "one", text: "Because there is only one snack" },
      { id: "outside", text: "Because Biscuit is shut outside" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "grapes",
    },
    explanation: "Grandpa gives the reason right after the rule: 'The vet said Biscuit must never eat grapes, and there are grapes inside.' So the snack must not be shared because it has grapes in it. The note never says Biscuit has eaten, that there is only one snack, or that Biscuit is outside.",
    metadata: {
      subject: "reading",
      strand: "Locating and identifying",
      topic: "Reason for a rule",
      skill: "Finding the reason given for a rule",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["note", "inference", "locating information", "naplan style"],
    },
  },
  {
    id: "naplan-y3-reading-b-016",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What must Ollie do before he is allowed to feed the chickens?",
    instructions: "Read the text, then choose the best answer.",
    stimulus: {
      title: "A Note from Grandpa",
      body: "Dear Ollie,\n\nI have gone next door to help Mrs Patel move her heavy bookshelf. I should be back home by half past four.\n\nYour afternoon snack is in the blue container on the bottom shelf of the fridge. Please do not share any of it with Biscuit. The vet said Biscuit must never eat grapes, and there are grapes inside.\n\nIf you finish your reading before I get home, you may feed the chickens. The scoop is hanging by the back door, and one scoopful each is plenty.\n\nSee you soon,\nGrandpa",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "fridge", text: "Put the snack back in the fridge" },
      { id: "wait", text: "Wait until Grandpa gets home" },
      { id: "reading", text: "Finish his reading" },
      { id: "walk", text: "Take Biscuit for a walk" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "reading",
    },
    explanation: "The word 'If' sets a condition: 'If you finish your reading before I get home, you may feed the chickens.' So Ollie must finish his reading first. 'Wait until Grandpa gets home' is the opposite â€” he can feed them before Grandpa returns. Putting the snack away and walking Biscuit are never asked for.",
    metadata: {
      subject: "reading",
      strand: "Analysing and evaluating",
      topic: "Understanding a condition",
      skill: "Understanding a condition in a text",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 85,
      tags: ["note", "inference", "conditions", "naplan style"],
    },
  },

  ...([
  {
    "id": "naplan-y3-reading-da-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Who showed the students how to hold the binoculars steady?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "Our Trip to the Wetland",
      "body": "On Tuesday our class went to the Willow Bend Wetland with our teacher, Mr Handel. We caught the early bus so we would arrive before the birds flew off to feed.\n\nFirst we walked along the boardwalk to the hide, a little wooden hut with narrow windows. From there we watched a family of black swans glide across the still water. A ranger named Priya showed us how to hold the binoculars steady against the window frame.\n\nAfter morning tea, we used small nets to scoop water from the shallow edge. In my tray I found two wriggling tadpoles and a water beetle. Priya said the tadpoles meant the water was healthy, because tadpoles cannot live in dirty water.\n\nWe ate our lunch under a gum tree while a group of ibis watched us closely, hoping for crumbs. On the bus home everyone was quiet. My shoes were muddy and my notebook was full, and I decided the wetland was the best excursion we had ever had.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "priya",
        "text": "Priya, the wetland ranger"
      },
      {
        "id": "mr-handel",
        "text": "Mr Handel, their class teacher"
      },
      {
        "id": "bus-driver",
        "text": "The bus driver"
      },
      {
        "id": "parent-helper",
        "text": "A parent who came to help"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "priya"
    },
    "explanation": "Find the sentence about the binoculars: 'A ranger named Priya showed us how to hold the binoculars steady.' It names Priya. Mr Handel is the teacher who came along, and the bus driver and helpers are not mentioned doing this, so Priya is the only answer the text supports.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Factual recount",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "recount",
        "locate information",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-002",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the events of the wetland trip in the order they happened in the recount, from first to last.",
    "instructions": "Read the text, then drag the events into the correct order.",
    "stimulus": {
      "title": "Our Trip to the Wetland",
      "body": "On Tuesday our class went to the Willow Bend Wetland with our teacher, Mr Handel. We caught the early bus so we would arrive before the birds flew off to feed.\n\nFirst we walked along the boardwalk to the hide, a little wooden hut with narrow windows. From there we watched a family of black swans glide across the still water. A ranger named Priya showed us how to hold the binoculars steady against the window frame.\n\nAfter morning tea, we used small nets to scoop water from the shallow edge. In my tray I found two wriggling tadpoles and a water beetle. Priya said the tadpoles meant the water was healthy, because tadpoles cannot live in dirty water.\n\nWe ate our lunch under a gum tree while a group of ibis watched us closely, hoping for crumbs. On the bus home everyone was quiet. My shoes were muddy and my notebook was full, and I decided the wetland was the best excursion we had ever had.",
      "attribution": "MindMosaic original"
    },
    "options": [],
    "visuals": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "nets",
          "text": "They scooped water with nets and found tadpoles"
        },
        {
          "id": "bus",
          "text": "The class caught the early bus to the wetland"
        },
        {
          "id": "lunch",
          "text": "They ate lunch under a gum tree near the ibis"
        },
        {
          "id": "swans",
          "text": "They watched black swans from the wooden hide"
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "bus",
        "swans",
        "nets",
        "lunch"
      ]
    },
    "explanation": "Track the time words. The class 'caught the early bus' first, then 'First we walked... to the hide' to watch the swans, then 'After morning tea' they used the nets, and finally 'We ate our lunch under a gum tree'. That gives bus, swans, nets, lunch.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Factual recount",
      "skill": "Sequence events in a recount",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "reading",
        "recount",
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
    "id": "naplan-y3-reading-da-003",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On the bus home everyone was quiet. Why were the students most likely quiet?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "Our Trip to the Wetland",
      "body": "On Tuesday our class went to the Willow Bend Wetland with our teacher, Mr Handel. We caught the early bus so we would arrive before the birds flew off to feed.\n\nFirst we walked along the boardwalk to the hide, a little wooden hut with narrow windows. From there we watched a family of black swans glide across the still water. A ranger named Priya showed us how to hold the binoculars steady against the window frame.\n\nAfter morning tea, we used small nets to scoop water from the shallow edge. In my tray I found two wriggling tadpoles and a water beetle. Priya said the tadpoles meant the water was healthy, because tadpoles cannot live in dirty water.\n\nWe ate our lunch under a gum tree while a group of ibis watched us closely, hoping for crumbs. On the bus home everyone was quiet. My shoes were muddy and my notebook was full, and I decided the wetland was the best excursion we had ever had.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "bored",
        "text": "They were bored and wished the trip had been shorter"
      },
      {
        "id": "tired-happy",
        "text": "They were tired but happy after a busy day outside"
      },
      {
        "id": "upset",
        "text": "They were upset that the day had turned out badly"
      },
      {
        "id": "worried",
        "text": "They were worried about being late back to school"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "tired-happy"
    },
    "explanation": "The story gives you clues just before this: muddy shoes and a full notebook show a busy day, and the writer says it 'was the best excursion we had ever had'. People are often quiet when they are tired and content, so 'tired but happy' fits. Nothing shows boredom, a bad day, or worry about the time.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Factual recount",
      "skill": "Infer a feeling from clues",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "recount",
        "inference",
        "feelings",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-004",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The text says the swans 'glide across the still water'. What does the word glide mean here?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "Our Trip to the Wetland",
      "body": "On Tuesday our class went to the Willow Bend Wetland with our teacher, Mr Handel. We caught the early bus so we would arrive before the birds flew off to feed.\n\nFirst we walked along the boardwalk to the hide, a little wooden hut with narrow windows. From there we watched a family of black swans glide across the still water. A ranger named Priya showed us how to hold the binoculars steady against the window frame.\n\nAfter morning tea, we used small nets to scoop water from the shallow edge. In my tray I found two wriggling tadpoles and a water beetle. Priya said the tadpoles meant the water was healthy, because tadpoles cannot live in dirty water.\n\nWe ate our lunch under a gum tree while a group of ibis watched us closely, hoping for crumbs. On the bus home everyone was quiet. My shoes were muddy and my notebook was full, and I decided the wetland was the best excursion we had ever had.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "dive",
        "text": "Dive right under the water"
      },
      {
        "id": "splash",
        "text": "Splash about very loudly"
      },
      {
        "id": "move-smooth",
        "text": "Move smoothly and easily"
      },
      {
        "id": "fly-sky",
        "text": "Fly high up into the sky"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "move-smooth"
    },
    "explanation": "Read the whole picture: the water is 'still' and the swans move across the top of it. Gliding means moving in a smooth, easy way. Diving would take them under the water, splashing would make the water noisy, and flying would take them into the sky, so none of those match 'across the still water'.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Factual recount",
      "skill": "Work out the meaning of a word in context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "recount",
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
    "id": "naplan-y3-reading-da-005",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What should you use to cut the window in the carton?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "How to Make a Bird Feeder",
      "body": "You will need: one clean, empty milk carton, a pair of scissors, a length of string, and a cup of bird seed.\n\n1. Ask an adult to help you cut a large window in one side of the carton, near the bottom.\n2. Make two small holes in the top of the carton and thread the string through them.\n3. Tie the ends of the string together to make a loop for hanging.\n4. Pour the bird seed through the window until it covers the floor of the carton.\n5. Hang your feeder from a branch where you can watch it from a window.\n\nCheck the feeder every few days. When the seed runs low, fill it up again. Soon the birds in your garden will learn that your feeder is a safe place to eat.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "string",
        "text": "A long length of string"
      },
      {
        "id": "seed",
        "text": "A cup of dry bird seed"
      },
      {
        "id": "carton",
        "text": "The empty milk carton"
      },
      {
        "id": "scissors",
        "text": "A pair of scissors"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "scissors"
    },
    "explanation": "Step 1 says to 'cut a large window in one side of the carton', and the things you need list a 'pair of scissors'. Scissors are the tool for cutting. The string is for hanging, the seed is the food, and the carton is the thing you cut into, not the cutting tool.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Procedure",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "procedure",
        "locate information",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-006",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why has the writer used numbered steps in this text?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "How to Make a Bird Feeder",
      "body": "You will need: one clean, empty milk carton, a pair of scissors, a length of string, and a cup of bird seed.\n\n1. Ask an adult to help you cut a large window in one side of the carton, near the bottom.\n2. Make two small holes in the top of the carton and thread the string through them.\n3. Tie the ends of the string together to make a loop for hanging.\n4. Pour the bird seed through the window until it covers the floor of the carton.\n5. Hang your feeder from a branch where you can watch it from a window.\n\nCheck the feeder every few days. When the seed runs low, fill it up again. Soon the birds in your garden will learn that your feeder is a safe place to eat.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "order",
        "text": "To show the order the steps should be done in"
      },
      {
        "id": "colour",
        "text": "To make the page look bright and cheerful"
      },
      {
        "id": "birds",
        "text": "To list all of the birds you might come and see"
      },
      {
        "id": "hard",
        "text": "To show which of the steps is the hardest one"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "order"
    },
    "explanation": "This is a set of instructions for making something. Numbers show you which step comes first, next and last, so you build the feeder in the right order. The numbers are not there for colour, they are not a list of birds, and they do not tell you which step is hardest.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Procedure",
      "skill": "Identify the purpose of a text feature",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "procedure",
        "purpose",
        "text features",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-007",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What should you do straight after you thread the string through the holes?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "How to Make a Bird Feeder",
      "body": "You will need: one clean, empty milk carton, a pair of scissors, a length of string, and a cup of bird seed.\n\n1. Ask an adult to help you cut a large window in one side of the carton, near the bottom.\n2. Make two small holes in the top of the carton and thread the string through them.\n3. Tie the ends of the string together to make a loop for hanging.\n4. Pour the bird seed through the window until it covers the floor of the carton.\n5. Hang your feeder from a branch where you can watch it from a window.\n\nCheck the feeder every few days. When the seed runs low, fill it up again. Soon the birds in your garden will learn that your feeder is a safe place to eat.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "pour",
        "text": "Pour the bird seed into the carton"
      },
      {
        "id": "tie",
        "text": "Tie the ends of the string into a loop"
      },
      {
        "id": "cut",
        "text": "Cut a large window in the side of the carton"
      },
      {
        "id": "hang",
        "text": "Hang the feeder up on a tree branch"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "tie"
    },
    "explanation": "Threading the string through the holes is step 2. The very next step, step 3, is 'Tie the ends of the string together to make a loop'. Pouring the seed is step 4 and hanging is step 5, so they come later, and cutting the window is step 1, which comes before.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Procedure",
      "skill": "Follow the sequence of steps",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "procedure",
        "sequencing",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-008",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The text says 'the quiet melts away'. What does this mean?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Market at Dawn",
      "body": "Before the sun is fully up, the market square is already awake. Lamps swing on their hooks and throw yellow circles onto the wet cobblestones. The air smells of ripe peaches, fresh bread and the salty tang of the fish stall at the far end.\n\nMr Delgado stacks his oranges into a bright pyramid, humming as he works. Two cats slip between the table legs, hunting for scraps. A woman unrolls a striped awning with a snap that echoes across the empty square.\n\nThen the first customers arrive, and the quiet melts away. Voices rise, coins clink, and the smell of coffee curls out from the little cart by the gate. By the time the sun clears the rooftops, the sleepy square has turned into a busy, buzzing world.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "water",
        "text": "The quiet slowly turns into cold water"
      },
      {
        "id": "cold",
        "text": "The square suddenly becomes very cold"
      },
      {
        "id": "gone",
        "text": "The quiet slowly disappears"
      },
      {
        "id": "louder",
        "text": "The quiet grows louder and louder"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "gone"
    },
    "explanation": "The words 'melts away' are a picture, not really about ice or water. Just after this line the market fills with voices and clinking coins, so the quiet is going away. 'Slowly disappears' matches that. The quiet does not turn into water or become cold, and quiet cannot grow louder.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Descriptive writing",
      "skill": "Work out the meaning of a phrase in context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "description",
        "vocabulary",
        "figurative language",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is this text mostly about?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Market at Dawn",
      "body": "Before the sun is fully up, the market square is already awake. Lamps swing on their hooks and throw yellow circles onto the wet cobblestones. The air smells of ripe peaches, fresh bread and the salty tang of the fish stall at the far end.\n\nMr Delgado stacks his oranges into a bright pyramid, humming as he works. Two cats slip between the table legs, hunting for scraps. A woman unrolls a striped awning with a snap that echoes across the empty square.\n\nThen the first customers arrive, and the quiet melts away. Voices rise, coins clink, and the smell of coffee curls out from the little cart by the gate. By the time the sun clears the rooftops, the sleepy square has turned into a busy, buzzing world.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "oranges",
        "text": "How to buy the best oranges from Mr Delgado"
      },
      {
        "id": "cats",
        "text": "Why the cats like to live close to the markets"
      },
      {
        "id": "coffee",
        "text": "How to make coffee at the cart"
      },
      {
        "id": "change",
        "text": "How the market changes from quiet to busy"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "change"
    },
    "explanation": "Look at the whole passage, not one sentence. It starts with the square quiet at dawn, then 'the first customers arrive' and it becomes 'busy, buzzing'. The main idea is the change from quiet to busy. The oranges, cats and coffee are small details, not what the whole text is about.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Descriptive writing",
      "skill": "Identify the main idea",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "description",
        "main idea",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-010",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How does the writer make the market feel calm and peaceful at the start?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Market at Dawn",
      "body": "Before the sun is fully up, the market square is already awake. Lamps swing on their hooks and throw yellow circles onto the wet cobblestones. The air smells of ripe peaches, fresh bread and the salty tang of the fish stall at the far end.\n\nMr Delgado stacks his oranges into a bright pyramid, humming as he works. Two cats slip between the table legs, hunting for scraps. A woman unrolls a striped awning with a snap that echoes across the empty square.\n\nThen the first customers arrive, and the quiet melts away. Voices rise, coins clink, and the smell of coffee curls out from the little cart by the gate. By the time the sun clears the rooftops, the sleepy square has turned into a busy, buzzing world.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "soft",
        "text": "By describing soft lamplight and gentle, quiet sounds"
      },
      {
        "id": "prices",
        "text": "By listing the prices of every fruit on the stalls"
      },
      {
        "id": "crowd",
        "text": "By describing a loud and very crowded street"
      },
      {
        "id": "far",
        "text": "By explaining how far away the market square is"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "soft"
    },
    "explanation": "At the start the writer chooses gentle pictures: lamps throwing soft yellow circles, a man humming, cats slipping quietly by. Soft light and quiet sounds make a calm feeling. The writer does not list prices, does not describe a loud crowd yet, and does not talk about distance.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Descriptive writing",
      "skill": "Explain how a writer creates a mood",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "description",
        "author craft",
        "mood",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What do echidnas eat?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Echidna",
      "body": "The echidna is one of Australia's most unusual animals. It is covered in sharp spines, a little like a hedgehog, but it is not related to hedgehogs at all. The echidna is a monotreme, which means it is a mammal that lays eggs.\n\nEchidnas have no teeth. Instead, they use a long, sticky tongue to catch ants and termites, which are their favourite food. A single echidna can eat thousands of insects in one day.\n\nWhen an echidna feels afraid, it does not run away quickly. Instead, it curls into a ball or digs straight down into the soil, leaving only its sharp spines showing. This makes it very hard for a predator to grab.\n\nEchidnas live in many parts of Australia, from cool mountains to dry deserts. Because they are shy and quiet, many people who live near them have never seen one.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "grass",
        "text": "Grass and green leaves"
      },
      {
        "id": "ants",
        "text": "Ants and termites"
      },
      {
        "id": "seeds",
        "text": "Seeds and soft fruit"
      },
      {
        "id": "fish",
        "text": "Small fish and frogs"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "ants"
    },
    "explanation": "The second paragraph says echidnas 'catch ants and termites, which are their favourite food'. That is stated straight out. Grass, leaves, seeds, fruit, fish and frogs are never mentioned as echidna food, so ants and termites is the only supported answer.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Information text",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "information",
        "locate information",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-012",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each fact about the echidna to what the text says about it.",
    "instructions": "Read the text, then match each fact on the left to the correct explanation on the right.",
    "stimulus": {
      "title": "The Echidna",
      "body": "The echidna is one of Australia's most unusual animals. It is covered in sharp spines, a little like a hedgehog, but it is not related to hedgehogs at all. The echidna is a monotreme, which means it is a mammal that lays eggs.\n\nEchidnas have no teeth. Instead, they use a long, sticky tongue to catch ants and termites, which are their favourite food. A single echidna can eat thousands of insects in one day.\n\nWhen an echidna feels afraid, it does not run away quickly. Instead, it curls into a ball or digs straight down into the soil, leaving only its sharp spines showing. This makes it very hard for a predator to grab.\n\nEchidnas live in many parts of Australia, from cool mountains to dry deserts. Because they are shy and quiet, many people who live near them have never seen one.",
      "attribution": "MindMosaic original"
    },
    "options": [],
    "visuals": [],
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "lays-eggs",
          "text": "The echidna lays eggs"
        },
        {
          "id": "no-teeth",
          "text": "The echidna has no teeth"
        },
        {
          "id": "curls",
          "text": "The echidna curls into a ball when afraid"
        },
        {
          "id": "places",
          "text": "The echidna lives in mountains and deserts"
        }
      ],
      "targets": [
        {
          "id": "monotreme",
          "text": "That is why it is called a monotreme"
        },
        {
          "id": "tongue",
          "text": "So it catches insects with a long, sticky tongue"
        },
        {
          "id": "safe",
          "text": "This helps keep it safe from predators"
        },
        {
          "id": "many-parts",
          "text": "It is found in many parts of Australia"
        },
        {
          "id": "hedgehog",
          "text": "That is why it is related to hedgehogs"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "lays-eggs",
          "targetId": "monotreme"
        },
        {
          "sourceId": "no-teeth",
          "targetId": "tongue"
        },
        {
          "sourceId": "curls",
          "targetId": "safe"
        },
        {
          "sourceId": "places",
          "targetId": "many-parts"
        }
      ]
    },
    "explanation": "Match each fact to its reason in the text. Laying eggs is what makes it 'a monotreme'. Having no teeth is why it uses 'a long, sticky tongue'. Curling up 'makes it very hard for a predator to grab', so it stays safe. Living in mountains and deserts shows it lives 'in many parts of Australia'. The hedgehog choice is a trap: the text says it is NOT related to hedgehogs.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Information text",
      "skill": "Match facts to details in a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "reading",
        "information",
        "matching",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-013",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The text says an echidna does not run away when it is afraid. How does it stay safe instead?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Echidna",
      "body": "The echidna is one of Australia's most unusual animals. It is covered in sharp spines, a little like a hedgehog, but it is not related to hedgehogs at all. The echidna is a monotreme, which means it is a mammal that lays eggs.\n\nEchidnas have no teeth. Instead, they use a long, sticky tongue to catch ants and termites, which are their favourite food. A single echidna can eat thousands of insects in one day.\n\nWhen an echidna feels afraid, it does not run away quickly. Instead, it curls into a ball or digs straight down into the soil, leaving only its sharp spines showing. This makes it very hard for a predator to grab.\n\nEchidnas live in many parts of Australia, from cool mountains to dry deserts. Because they are shy and quiet, many people who live near them have never seen one.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "run",
        "text": "By trying to run away faster than the predator can"
      },
      {
        "id": "tree",
        "text": "By quickly climbing up into the top of a tall tree"
      },
      {
        "id": "curl",
        "text": "By curling up or digging down so only its spines show"
      },
      {
        "id": "group",
        "text": "By hiding in the middle of a group of echidnas"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "curl"
    },
    "explanation": "The text says that instead of running, the echidna 'curls into a ball or digs straight down into the soil, leaving only its sharp spines showing'. That is how it stays safe. The other choices sound possible but the text never says it runs fast, climbs trees, or hides in a group.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Information text",
      "skill": "Connect two parts of a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "information",
        "connect ideas",
        "inference",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did the writer most likely write this text about echidnas?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "The Echidna",
      "body": "The echidna is one of Australia's most unusual animals. It is covered in sharp spines, a little like a hedgehog, but it is not related to hedgehogs at all. The echidna is a monotreme, which means it is a mammal that lays eggs.\n\nEchidnas have no teeth. Instead, they use a long, sticky tongue to catch ants and termites, which are their favourite food. A single echidna can eat thousands of insects in one day.\n\nWhen an echidna feels afraid, it does not run away quickly. Instead, it curls into a ball or digs straight down into the soil, leaving only its sharp spines showing. This makes it very hard for a predator to grab.\n\nEchidnas live in many parts of Australia, from cool mountains to dry deserts. Because they are shy and quiet, many people who live near them have never seen one.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "story",
        "text": "To tell a funny story about a pet echidna"
      },
      {
        "id": "argue",
        "text": "To argue that echidnas make good pets"
      },
      {
        "id": "catch",
        "text": "To teach readers how to catch an echidna"
      },
      {
        "id": "facts",
        "text": "To give readers interesting facts about echidnas"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "facts"
    },
    "explanation": "The whole text gives true information: what an echidna eats, how it protects itself, and where it lives. That makes its purpose to give facts. There is no story with characters, no argument that they make pets, and no instructions for catching one.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Information text",
      "skill": "Identify the author's purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "information",
        "purpose",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-015",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The poem says the socks 'kick their heels in rows'. What is really happening to the socks?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "Washing Day",
      "body": "The socks are dancing on the line,\nthey kick their heels in rows.\nThe shirts puff out their round white chests\nand wobble as it blows.\n\nA sudden gust comes rushing through\nand tugs them left and right,\ntill Grandma's apron breaks its peg\nand sails off like a kite.\n\nWe chase it past the lemon tree,\nwe chase it round the shed,\nand catch it in the garden bed\nwith soil upon its head.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "wind",
        "text": "The socks are blowing about in the wind"
      },
      {
        "id": "kicked",
        "text": "Someone is kicking the socks hard"
      },
      {
        "id": "folded",
        "text": "The socks are being folded up"
      },
      {
        "id": "show",
        "text": "The socks are dancing in a big stage show"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "wind"
    },
    "explanation": "The poem is about washing hanging on a line, and the last line of the first part says 'as it blows'. So the socks are really just moving in the wind. The poet only pretends they are dancing and kicking. No person kicks them, they are not being folded, and there is no real stage show.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Poetry",
      "skill": "Understand figurative language in a poem",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "poetry",
        "figurative language",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-da-016",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why does Grandma's apron 'sail off like a kite'?",
    "instructions": "Read the text, then choose the best answer.",
    "stimulus": {
      "title": "Washing Day",
      "body": "The socks are dancing on the line,\nthey kick their heels in rows.\nThe shirts puff out their round white chests\nand wobble as it blows.\n\nA sudden gust comes rushing through\nand tugs them left and right,\ntill Grandma's apron breaks its peg\nand sails off like a kite.\n\nWe chase it past the lemon tree,\nwe chase it round the shed,\nand catch it in the garden bed\nwith soil upon its head.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "throw",
        "text": "Grandma throws it high into the air"
      },
      {
        "id": "gust",
        "text": "A strong gust of wind blows it off the peg"
      },
      {
        "id": "bird",
        "text": "A passing bird carries it away"
      },
      {
        "id": "tie",
        "text": "The children tie it onto a long string"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "gust"
    },
    "explanation": "Just before the apron flies, the poem says 'A sudden gust comes rushing through and tugs them left and right'. That strong gust is what pulls the apron off its peg. Grandma never throws it, no bird is in the poem, and the children only chase it, they do not tie it up.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Poetry",
      "skill": "Infer a cause from the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "poetry",
        "inference",
        "cause",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What kind of paper does the text say you should choose?",
    "stimulus": {
      "title": "How to Fold a Paper Boat",
      "body": "You will need one rectangular sheet of paper. Choose paper that is not too thick, or the folds will not stay flat.\n\nFirst, fold the paper in half so the two short edges meet. Press hard along the fold so it stays sharp.\n\nNext, fold the top two corners down to the middle. This makes a shape like a wide hat.\n\nThen, fold the bottom edges up on both sides.\n\nAfter that, gently pull the two sides apart and press the shape into a diamond.\n\nFinally, pull the top corners of the diamond out until the boat opens up. Now it is ready to float.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "The thickest paper you can find"
      },
      {
        "id": "opt-c",
        "text": "A square of stiff cardboard"
      },
      {
        "id": "opt-d",
        "text": "Paper that is already wet"
      },
      {
        "id": "opt-b",
        "text": "Paper that is not too thick"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "Look at the first sentences. The text says to choose paper 'that is not too thick, or the folds will not stay flat', so option B matches exactly. Thick paper and cardboard are the opposite of what is asked, and the text never says the paper should be wet.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Instructions for a craft activity",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "instructions",
        "locate information",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-002",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these four folding steps in the order the instructions give them, from first to last.",
    "stimulus": {
      "title": "How to Fold a Paper Boat",
      "body": "You will need one rectangular sheet of paper. Choose paper that is not too thick, or the folds will not stay flat.\n\nFirst, fold the paper in half so the two short edges meet. Press hard along the fold so it stays sharp.\n\nNext, fold the top two corners down to the middle. This makes a shape like a wide hat.\n\nThen, fold the bottom edges up on both sides.\n\nAfter that, gently pull the two sides apart and press the shape into a diamond.\n\nFinally, pull the top corners of the diamond out until the boat opens up. Now it is ready to float.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "corners-down",
          "text": "Fold the top two corners down to the middle."
        },
        {
          "id": "open-boat",
          "text": "Pull the top corners out until the boat opens up."
        },
        {
          "id": "fold-half",
          "text": "Fold the paper in half so the short edges meet."
        },
        {
          "id": "edges-up",
          "text": "Fold the bottom edges up on both sides."
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "fold-half",
        "corners-down",
        "edges-up",
        "open-boat"
      ]
    },
    "explanation": "Follow the order words. 'First' you fold the paper in half, 'Next' you fold the top corners down, 'Then' you fold the bottom edges up, and 'Finally' you pull the corners out to open the boat. Reading the signal words in turn gives the correct order.",
    "metadata": {
      "subject": "reading",
      "strand": "Procedural text comprehension",
      "topic": "Instructions for a craft activity",
      "skill": "Sequence the steps in a procedure",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "instructions",
        "sequencing",
        "ordering",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-003",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why does the writer use the words First, Next, Then and Finally?",
    "stimulus": {
      "title": "How to Fold a Paper Boat",
      "body": "You will need one rectangular sheet of paper. Choose paper that is not too thick, or the folds will not stay flat.\n\nFirst, fold the paper in half so the two short edges meet. Press hard along the fold so it stays sharp.\n\nNext, fold the top two corners down to the middle. This makes a shape like a wide hat.\n\nThen, fold the bottom edges up on both sides.\n\nAfter that, gently pull the two sides apart and press the shape into a diamond.\n\nFinally, pull the top corners of the diamond out until the boat opens up. Now it is ready to float.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-d",
        "text": "To show the order of the steps"
      },
      {
        "id": "opt-a",
        "text": "To make the boat float faster"
      },
      {
        "id": "opt-b",
        "text": "To tell you how many boats to fold"
      },
      {
        "id": "opt-c",
        "text": "To list the things that you need"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "Words like First, Next, Then and Finally are called order words. They tell the reader which step to do and when, so the boat is folded in the right order. They do not change how the boat floats, count boats, or list materials.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Instructions for a craft activity",
      "skill": "Identify the purpose of a text feature",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "instructions",
        "purpose",
        "text features",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-004",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "According to the text, what do the roots of the sunflower do?",
    "stimulus": {
      "title": "The Sunflower",
      "body": "A sunflower is a tall plant, and each of its parts has its own job.\n\nThe roots grow down into the soil. They hold the plant steady and drink up water.\n\nThe stem is the thick green stalk. It holds the flower up high and carries water from the roots to the rest of the plant.\n\nThe leaves are broad and flat. They catch sunlight, which the plant uses to make its food.\n\nAt the top is the flower head. Its bright yellow petals attract bees, and the bees help the plant make seeds.\n\nWhen the flower head dries, it is full of seeds. People and birds like to eat these seeds, and new sunflowers can grow from them.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "Catch sunlight to make the plant's food"
      },
      {
        "id": "opt-a",
        "text": "Hold the plant steady and drink up water"
      },
      {
        "id": "opt-c",
        "text": "Carry water up to the flower head"
      },
      {
        "id": "opt-d",
        "text": "Attract bees with bright petals"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "Find the sentence about the roots: 'They hold the plant steady and drink up water.' That is option A. The other choices are the jobs of the leaves, the stem and the flower head, so a reader must match the job to the correct part.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Parts of a plant",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "locate information",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-005",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each part of the sunflower to the job the text gives it.",
    "stimulus": {
      "title": "The Sunflower",
      "body": "A sunflower is a tall plant, and each of its parts has its own job.\n\nThe roots grow down into the soil. They hold the plant steady and drink up water.\n\nThe stem is the thick green stalk. It holds the flower up high and carries water from the roots to the rest of the plant.\n\nThe leaves are broad and flat. They catch sunlight, which the plant uses to make its food.\n\nAt the top is the flower head. Its bright yellow petals attract bees, and the bees help the plant make seeds.\n\nWhen the flower head dries, it is full of seeds. People and birds like to eat these seeds, and new sunflowers can grow from them.",
      "attribution": "MindMosaic original"
    },
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "s-stem",
          "text": "The stem"
        },
        {
          "id": "s-leaves",
          "text": "The leaves"
        },
        {
          "id": "s-head",
          "text": "The flower head"
        }
      ],
      "targets": [
        {
          "id": "t-holds",
          "text": "Holds the flower up high"
        },
        {
          "id": "t-sun",
          "text": "Catches sunlight to make food"
        },
        {
          "id": "t-bees",
          "text": "Attracts bees with its petals"
        },
        {
          "id": "t-soil",
          "text": "Grows down into the soil"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "s-stem",
          "targetId": "t-holds"
        },
        {
          "sourceId": "s-leaves",
          "targetId": "t-sun"
        },
        {
          "sourceId": "s-head",
          "targetId": "t-bees"
        }
      ]
    },
    "explanation": "Match each part to the job the text names for it: the stem 'holds the flower up high', the leaves 'catch sunlight, which the plant uses to make its food', and the flower head's petals 'attract bees'. 'Grows down into the soil' is the roots' job, so it is left over and matches nothing.",
    "metadata": {
      "subject": "reading",
      "strand": "Information text comprehension",
      "topic": "Parts of a plant",
      "skill": "Match details to parts of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "information text",
        "matching",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-006",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The text says the leaves are 'broad and flat'. In this text, the word broad means:",
    "stimulus": {
      "title": "The Sunflower",
      "body": "A sunflower is a tall plant, and each of its parts has its own job.\n\nThe roots grow down into the soil. They hold the plant steady and drink up water.\n\nThe stem is the thick green stalk. It holds the flower up high and carries water from the roots to the rest of the plant.\n\nThe leaves are broad and flat. They catch sunlight, which the plant uses to make its food.\n\nAt the top is the flower head. Its bright yellow petals attract bees, and the bees help the plant make seeds.\n\nWhen the flower head dries, it is full of seeds. People and birds like to eat these seeds, and new sunflowers can grow from them.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "tall"
      },
      {
        "id": "opt-c",
        "text": "hard"
      },
      {
        "id": "opt-b",
        "text": "wide"
      },
      {
        "id": "opt-d",
        "text": "dark"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "'Broad and flat' describes leaves that spread out so they can 'catch sunlight'. A broad leaf is a wide one, so B is correct. Tall, hard and dark describe other things and do not help the leaf catch the light.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Parts of a plant",
      "skill": "Work out the meaning of a word in context",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "information text",
        "vocabulary",
        "word meaning",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-007",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What is this text mostly about?",
    "stimulus": {
      "title": "The Sunflower",
      "body": "A sunflower is a tall plant, and each of its parts has its own job.\n\nThe roots grow down into the soil. They hold the plant steady and drink up water.\n\nThe stem is the thick green stalk. It holds the flower up high and carries water from the roots to the rest of the plant.\n\nThe leaves are broad and flat. They catch sunlight, which the plant uses to make its food.\n\nAt the top is the flower head. Its bright yellow petals attract bees, and the bees help the plant make seeds.\n\nWhen the flower head dries, it is full of seeds. People and birds like to eat these seeds, and new sunflowers can grow from them.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "How to grow a sunflower from a seed"
      },
      {
        "id": "opt-b",
        "text": "Why bees like bright yellow flowers"
      },
      {
        "id": "opt-d",
        "text": "How birds find seeds to eat in gardens"
      },
      {
        "id": "opt-c",
        "text": "The parts of a sunflower and what each one does"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Every paragraph names a part of the sunflower and tells you its job: roots, stem, leaves, flower head and seeds. The text as a whole is about the parts and their jobs, so C is the main idea. The other choices are small details or ideas the text does not really explain.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Parts of a plant",
      "skill": "Identify the main idea of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "information text",
        "main idea",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-008",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What did Grandpa send Ravi?",
    "stimulus": {
      "title": "A Letter to Grandpa",
      "body": "Dear Grandpa,\n\nThank you so much for the kite you sent me for my birthday. It arrived on Saturday, just in time for the school holidays.\n\nOn Sunday, Mum took me to the park to fly it. There was a strong wind, and the kite went so high that it looked like a red dot in the sky. A little girl next to us clapped when she saw it.\n\nThe best part was that Mum said we can go back every weekend. I am already saving a spot for you to come and fly it with me when you visit in spring.\n\nPlease write back and tell me how your garden is growing.\n\nLove from,\nRavi",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-c",
        "text": "A kite"
      },
      {
        "id": "opt-a",
        "text": "A ball"
      },
      {
        "id": "opt-b",
        "text": "A book"
      },
      {
        "id": "opt-d",
        "text": "A card"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "The first line thanks Grandpa 'for the kite you sent me for my birthday', so the gift is a kite. A ball, a book and a card are never mentioned as the present.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "A thank-you letter",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "letter",
        "locate information",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Ravi write this letter?",
    "stimulus": {
      "title": "A Letter to Grandpa",
      "body": "Dear Grandpa,\n\nThank you so much for the kite you sent me for my birthday. It arrived on Saturday, just in time for the school holidays.\n\nOn Sunday, Mum took me to the park to fly it. There was a strong wind, and the kite went so high that it looked like a red dot in the sky. A little girl next to us clapped when she saw it.\n\nThe best part was that Mum said we can go back every weekend. I am already saving a spot for you to come and fly it with me when you visit in spring.\n\nPlease write back and tell me how your garden is growing.\n\nLove from,\nRavi",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "To ask Grandpa to buy him a brand new kite"
      },
      {
        "id": "opt-a",
        "text": "To thank Grandpa and tell him about the kite"
      },
      {
        "id": "opt-c",
        "text": "To invite Grandpa to his birthday party soon"
      },
      {
        "id": "opt-d",
        "text": "To tell Grandpa that the kite got broken"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The letter opens by thanking Grandpa for the kite and then tells him all about flying it, so A gives the main reason for writing. Ravi already has the kite and it is not broken, and the birthday has already happened, so the other choices do not fit.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "A thank-you letter",
      "skill": "Identify the purpose of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "letter",
        "purpose",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-010",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How does Ravi feel about the kite?",
    "stimulus": {
      "title": "A Letter to Grandpa",
      "body": "Dear Grandpa,\n\nThank you so much for the kite you sent me for my birthday. It arrived on Saturday, just in time for the school holidays.\n\nOn Sunday, Mum took me to the park to fly it. There was a strong wind, and the kite went so high that it looked like a red dot in the sky. A little girl next to us clapped when she saw it.\n\nThe best part was that Mum said we can go back every weekend. I am already saving a spot for you to come and fly it with me when you visit in spring.\n\nPlease write back and tell me how your garden is growing.\n\nLove from,\nRavi",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "He is disappointed by it"
      },
      {
        "id": "opt-b",
        "text": "He is worried he will lose it"
      },
      {
        "id": "opt-d",
        "text": "He is delighted with it"
      },
      {
        "id": "opt-c",
        "text": "He is bored with flying it"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "Ravi says flying the kite was 'the best part', he wants to go back every weekend, and he is saving a spot for Grandpa to join him. These clues show he is delighted, not disappointed, worried or bored, even though the letter never uses the word 'delighted'.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "A thank-you letter",
      "skill": "Infer a feeling from clues in the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "letter",
        "inference",
        "feelings",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The poem says 'the sea has crept away'. This means the sea has:",
    "stimulus": {
      "title": "The Rock Pool",
      "body": "Down where the sea has crept away,\nA small round pool decides to stay.\nIt holds a scrap of yesterday's tide,\nWith tiny crabs that duck and hide.\n\nA green weed waves a lazy hand,\nA shell sits shining on the sand.\nThe pool is like a window, clear,\nThat shows the little world in here.\n\nWhen evening comes, the sea returns,\nAnd over every rock it churns.\nIt scoops the pool back into blue â€”\nThe crabs go home, and so do you.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "crashed onto the rocks"
      },
      {
        "id": "opt-c",
        "text": "risen up very high"
      },
      {
        "id": "opt-d",
        "text": "vanished for good"
      },
      {
        "id": "opt-b",
        "text": "moved back slowly"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "To 'creep' is to move slowly and quietly, and the sea 'creeps away', leaving the rock pool behind. So the sea has moved back slowly, which is B. It has not crashed or risen, and because it 'returns' later in the poem, it has not vanished for good.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "A poem about the seaside",
      "skill": "Work out the meaning of a phrase in a poem",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "poem",
        "vocabulary",
        "word meaning",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-012",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The poet says the pool is 'like a window'. This is because you can:",
    "stimulus": {
      "title": "The Rock Pool",
      "body": "Down where the sea has crept away,\nA small round pool decides to stay.\nIt holds a scrap of yesterday's tide,\nWith tiny crabs that duck and hide.\n\nA green weed waves a lazy hand,\nA shell sits shining on the sand.\nThe pool is like a window, clear,\nThat shows the little world in here.\n\nWhen evening comes, the sea returns,\nAnd over every rock it churns.\nIt scoops the pool back into blue â€”\nThe crabs go home, and so do you.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-c",
        "text": "see the small world clearly inside it"
      },
      {
        "id": "opt-a",
        "text": "open and shut it like real glass"
      },
      {
        "id": "opt-b",
        "text": "look up through it at the sky"
      },
      {
        "id": "opt-d",
        "text": "break it very easily by hand"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "The next line explains the comparison: the pool is 'clear, that shows the little world in here'. A window lets you see through it, and this clear pool lets you see the crabs, weed and shell inside, so C is correct. The poem does not say the pool opens, shows the sky, or breaks.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "A poem about the seaside",
      "skill": "Understand a simile in a poem",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "poem",
        "figurative language",
        "simile",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-013",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the start the pool 'decides to stay', but at the end the sea 'scoops the pool back'. What has changed by the end of the poem?",
    "stimulus": {
      "title": "The Rock Pool",
      "body": "Down where the sea has crept away,\nA small round pool decides to stay.\nIt holds a scrap of yesterday's tide,\nWith tiny crabs that duck and hide.\n\nA green weed waves a lazy hand,\nA shell sits shining on the sand.\nThe pool is like a window, clear,\nThat shows the little world in here.\n\nWhen evening comes, the sea returns,\nAnd over every rock it churns.\nIt scoops the pool back into blue â€”\nThe crabs go home, and so do you.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "The crabs have eaten all the green weed"
      },
      {
        "id": "opt-c",
        "text": "The tide has come back and covered it"
      },
      {
        "id": "opt-b",
        "text": "Someone has tipped the water pool out"
      },
      {
        "id": "opt-d",
        "text": "The pool has dried up in the hot sun"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Connect the start and the end. At first the sea has crept away and left the pool; then 'the sea returns' in the evening and 'scoops the pool back into blue'. So the change is that the tide has come back in and covered the pool, which is C. The poem does not say the crabs ate the weed, that anyone tipped it out, or that it dried up.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "A poem about the seaside",
      "skill": "Connect two parts of a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "poem",
        "connect ideas",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which event had the writer practised the most?",
    "stimulus": {
      "title": "Our Sports Day",
      "body": "Last Friday was our school sports day, and I had been looking forward to it all week.\n\nIn the morning, our whole class marched onto the oval behind a big blue banner. The sun was out, but a cool breeze kept us from getting too hot.\n\nMy first event was the sack race. I fell over twice and came last, but I laughed so hard that I did not mind at all. After that, I threw a beanbag in the target game and hit the middle ring, which felt fantastic.\n\nThe event I had practised most was the relay. When my teammate passed me the baton, I ran as fast as I could and did not drop it once. Our team came second, and everyone cheered.\n\nBy the end of the day my legs were tired and my face was sunburnt, but I could not stop smiling. I already cannot wait for next year.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "The sack race"
      },
      {
        "id": "opt-b",
        "text": "The target game"
      },
      {
        "id": "opt-d",
        "text": "The relay"
      },
      {
        "id": "opt-c",
        "text": "The marching"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "The text says directly, 'The event I had practised most was the relay.' So the answer is the relay. The sack race, the target game and the marching are all mentioned, but none of them is the one the writer practised most.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "A recount of a school sports day",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "recount",
        "locate information",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-015",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How did the writer feel about sports day overall?",
    "stimulus": {
      "title": "Our Sports Day",
      "body": "Last Friday was our school sports day, and I had been looking forward to it all week.\n\nIn the morning, our whole class marched onto the oval behind a big blue banner. The sun was out, but a cool breeze kept us from getting too hot.\n\nMy first event was the sack race. I fell over twice and came last, but I laughed so hard that I did not mind at all. After that, I threw a beanbag in the target game and hit the middle ring, which felt fantastic.\n\nThe event I had practised most was the relay. When my teammate passed me the baton, I ran as fast as I could and did not drop it once. Our team came second, and everyone cheered.\n\nBy the end of the day my legs were tired and my face was sunburnt, but I could not stop smiling. I already cannot wait for next year.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "They were upset about losing"
      },
      {
        "id": "opt-c",
        "text": "They found it rather boring"
      },
      {
        "id": "opt-d",
        "text": "They were too hot to enjoy it"
      },
      {
        "id": "opt-a",
        "text": "They enjoyed it very much"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The writer looked forward to the day, laughed off coming last, felt 'fantastic', and 'could not stop smiling' at the end. Taken together, these show they enjoyed the day very much. They were not upset about losing, a cool breeze kept them from getting too hot, and nothing suggests they were bored.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "A recount of a school sports day",
      "skill": "Identify the main idea or overall feeling",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "recount",
        "main idea",
        "feelings",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-db-016",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The writer came last in the sack race but 'did not mind at all'. Why not?",
    "stimulus": {
      "title": "Our Sports Day",
      "body": "Last Friday was our school sports day, and I had been looking forward to it all week.\n\nIn the morning, our whole class marched onto the oval behind a big blue banner. The sun was out, but a cool breeze kept us from getting too hot.\n\nMy first event was the sack race. I fell over twice and came last, but I laughed so hard that I did not mind at all. After that, I threw a beanbag in the target game and hit the middle ring, which felt fantastic.\n\nThe event I had practised most was the relay. When my teammate passed me the baton, I ran as fast as I could and did not drop it once. Our team came second, and everyone cheered.\n\nBy the end of the day my legs were tired and my face was sunburnt, but I could not stop smiling. I already cannot wait for next year.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "They were having so much fun"
      },
      {
        "id": "opt-a",
        "text": "They won the very next race"
      },
      {
        "id": "opt-c",
        "text": "Nobody had seen them fall over"
      },
      {
        "id": "opt-d",
        "text": "The race did not really count"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "The same sentence gives the reason: 'I laughed so hard that I did not mind at all.' The writer did not mind losing because they were having so much fun, which is B. They came second (not first) in the relay, the text never says nobody saw them, and it does not say the race did not count.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "A recount of a school sports day",
      "skill": "Connect two parts of a text to explain why",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "recount",
        "connect ideas",
        "inference",
        "year 3 reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-001",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "According to the report, why does an emu swallow small stones?",
    "stimulus": {
      "title": "The Emu",
      "body": "The emu is the largest bird in Australia. It stands taller than most adults, but it cannot fly. Instead, the emu uses its long, strong legs to run. An emu can run as fast as a car in a school zone, and it can keep running for a long time without getting tired.\n\nEmus eat seeds, fruit, flowers and small insects. They also swallow small stones. The stones stay inside the bird and help to grind up the food it has eaten.\n\nSomething unusual happens when emus have chicks. The father emu, not the mother, sits on the eggs to keep them warm. He guards the nest and does not eat for about eight weeks. After the chicks hatch, the father emu looks after them until they are big enough to care for themselves.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "The stones keep its body warm."
      },
      {
        "id": "opt-c",
        "text": "The stones help it run faster."
      },
      {
        "id": "opt-a",
        "text": "The stones help grind up its food."
      },
      {
        "id": "opt-d",
        "text": "The stones taste like sweet fruit."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The report says the stones 'stay inside the bird and help to grind up the food it has eaten', so they help with digestion. Keeping warm is about the father sitting on the eggs, running is done with the legs, and the stones' taste is never mentioned.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "The emu",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "information report",
        "locate",
        "animals",
        "emu"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-002",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each part of the report to the correct detail about the emu.",
    "stimulus": {
      "title": "The Emu",
      "body": "The emu is the largest bird in Australia. It stands taller than most adults, but it cannot fly. Instead, the emu uses its long, strong legs to run. An emu can run as fast as a car in a school zone, and it can keep running for a long time without getting tired.\n\nEmus eat seeds, fruit, flowers and small insects. They also swallow small stones. The stones stay inside the bird and help to grind up the food it has eaten.\n\nSomething unusual happens when emus have chicks. The father emu, not the mother, sits on the eggs to keep them warm. He guards the nest and does not eat for about eight weeks. After the chicks hatch, the father emu looks after them until they are big enough to care for themselves.",
      "attribution": "MindMosaic original"
    },
    "visuals": [],
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "src-move",
          "text": "How the emu moves"
        },
        {
          "id": "src-father",
          "text": "What the father emu does"
        },
        {
          "id": "src-eat",
          "text": "What emus eat"
        }
      ],
      "targets": [
        {
          "id": "tgt-legs",
          "text": "Runs on long, strong legs"
        },
        {
          "id": "tgt-eggs",
          "text": "Sits on the eggs to keep them warm"
        },
        {
          "id": "tgt-food",
          "text": "Seeds, fruit, flowers and insects"
        },
        {
          "id": "tgt-tree",
          "text": "Builds a nest high up in a tree"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "src-move",
          "targetId": "tgt-legs"
        },
        {
          "sourceId": "src-father",
          "targetId": "tgt-eggs"
        },
        {
          "sourceId": "src-eat",
          "targetId": "tgt-food"
        }
      ]
    },
    "explanation": "The emu cannot fly, so it moves by running on its legs. The father emu sits on the eggs to keep them warm. Emus eat seeds, fruit, flowers and insects. The 'nest high in a tree' detail is not in the report and is not correct, so it is left unmatched.",
    "metadata": {
      "subject": "reading",
      "strand": "Information text comprehension",
      "topic": "The emu",
      "skill": "Match facts to details in a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information report",
        "matching",
        "emu"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-003",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The father emu does not eat for about eight weeks. Why does this happen?",
    "stimulus": {
      "title": "The Emu",
      "body": "The emu is the largest bird in Australia. It stands taller than most adults, but it cannot fly. Instead, the emu uses its long, strong legs to run. An emu can run as fast as a car in a school zone, and it can keep running for a long time without getting tired.\n\nEmus eat seeds, fruit, flowers and small insects. They also swallow small stones. The stones stay inside the bird and help to grind up the food it has eaten.\n\nSomething unusual happens when emus have chicks. The father emu, not the mother, sits on the eggs to keep them warm. He guards the nest and does not eat for about eight weeks. After the chicks hatch, the father emu looks after them until they are big enough to care for themselves.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "He cannot find any seeds or fruit nearby."
      },
      {
        "id": "opt-b",
        "text": "He has eaten far too many small stones."
      },
      {
        "id": "opt-d",
        "text": "He is teaching the young chicks how to run."
      },
      {
        "id": "opt-c",
        "text": "He stays on the nest to keep the eggs warm."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Link the two sentences: the father 'sits on the eggs to keep them warm' and 'does not eat for about eight weeks'. He stays on the nest instead of leaving to feed. Food is not said to be scarce, the stones help digestion rather than stopping him eating, and the chicks have not hatched yet during those weeks.",
    "metadata": {
      "subject": "reading",
      "strand": "Information text comprehension",
      "topic": "The emu",
      "skill": "Connect two parts of a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "information report",
        "connect ideas",
        "emu"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-004",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In this report, the words 'grind up' mean â€”",
    "stimulus": {
      "title": "The Emu",
      "body": "The emu is the largest bird in Australia. It stands taller than most adults, but it cannot fly. Instead, the emu uses its long, strong legs to run. An emu can run as fast as a car in a school zone, and it can keep running for a long time without getting tired.\n\nEmus eat seeds, fruit, flowers and small insects. They also swallow small stones. The stones stay inside the bird and help to grind up the food it has eaten.\n\nSomething unusual happens when emus have chicks. The father emu, not the mother, sits on the eggs to keep them warm. He guards the nest and does not eat for about eight weeks. After the chicks hatch, the father emu looks after them until they are big enough to care for themselves.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "crush into tiny pieces"
      },
      {
        "id": "opt-a",
        "text": "cook it until it is soft"
      },
      {
        "id": "opt-c",
        "text": "swallow very quickly"
      },
      {
        "id": "opt-d",
        "text": "keep somewhere safe"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "The stones inside the emu press and crush the food into tiny pieces so it is easier to digest. That is what 'grind up' means. Nothing is cooked, swallowing is a different action, and keeping food safe is not the idea here.",
    "metadata": {
      "subject": "reading",
      "strand": "Information text comprehension",
      "topic": "The emu",
      "skill": "Work out the meaning of words in context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "information report",
        "word meaning",
        "emu"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-005",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What did Mum do straight after Dad found the torch?",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Last Friday a big storm rolled over our town. During dinner, the lights suddenly went out and the whole house turned dark. My little sister Priya gave a squeal, but Dad laughed and said it was a chance for an adventure.\n\nFirst, Dad found the torch in the kitchen drawer. Then Mum lit two candles and put them safely on the table. We could see each other again in the soft, flickering light.\n\nWhile we waited for the power to come back, we played a guessing game and told funny stories. Priya stopped being frightened and began to giggle. Mum said the meal tasted better by candlelight.\n\nAt last, just before bedtime, the lights flashed back on. The whole room seemed too bright after the gentle candles. I was almost sorry the blackout was over.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "She told some funny stories."
      },
      {
        "id": "opt-c",
        "text": "She lit two candles for the table."
      },
      {
        "id": "opt-b",
        "text": "She turned the bright lights on."
      },
      {
        "id": "opt-d",
        "text": "She found the torch in the kitchen drawer."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "The recount says 'First, Dad found the torch... Then Mum lit two candles'. So lighting the candles came next. The stories came later while they waited, the lights came back on by themselves at the end, and it was Dad, not Mum, who found the torch.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "The blackout",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "recount",
        "locate",
        "family"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-006",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these events from the recount in the order they happened.",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Last Friday a big storm rolled over our town. During dinner, the lights suddenly went out and the whole house turned dark. My little sister Priya gave a squeal, but Dad laughed and said it was a chance for an adventure.\n\nFirst, Dad found the torch in the kitchen drawer. Then Mum lit two candles and put them safely on the table. We could see each other again in the soft, flickering light.\n\nWhile we waited for the power to come back, we played a guessing game and told funny stories. Priya stopped being frightened and began to giggle. Mum said the meal tasted better by candlelight.\n\nAt last, just before bedtime, the lights flashed back on. The whole room seemed too bright after the gentle candles. I was almost sorry the blackout was over.",
      "attribution": "MindMosaic original"
    },
    "visuals": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "ev-candles",
          "text": "Mum lit two candles for the table."
        },
        {
          "id": "ev-out",
          "text": "The lights suddenly went out during dinner."
        },
        {
          "id": "ev-back",
          "text": "The lights flashed back on before bedtime."
        },
        {
          "id": "ev-torch",
          "text": "Dad found the torch in the kitchen drawer."
        },
        {
          "id": "ev-game",
          "text": "The family played a guessing game."
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "ev-out",
        "ev-torch",
        "ev-candles",
        "ev-game",
        "ev-back"
      ]
    },
    "explanation": "Follow the order words in the recount. The lights went out first, then Dad found the torch, then Mum lit the candles, then the family played a guessing game while they waited, and finally the lights came back on before bedtime.",
    "metadata": {
      "subject": "reading",
      "strand": "Narrative comprehension",
      "topic": "The blackout",
      "skill": "Sequence events in a recount",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "recount",
        "sequence",
        "family"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-007",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How did the writer feel when the power came back on?",
    "stimulus": {
      "title": "The Night the Lights Went Out",
      "body": "Last Friday a big storm rolled over our town. During dinner, the lights suddenly went out and the whole house turned dark. My little sister Priya gave a squeal, but Dad laughed and said it was a chance for an adventure.\n\nFirst, Dad found the torch in the kitchen drawer. Then Mum lit two candles and put them safely on the table. We could see each other again in the soft, flickering light.\n\nWhile we waited for the power to come back, we played a guessing game and told funny stories. Priya stopped being frightened and began to giggle. Mum said the meal tasted better by candlelight.\n\nAt last, just before bedtime, the lights flashed back on. The whole room seemed too bright after the gentle candles. I was almost sorry the blackout was over.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "Angry that the storm had stopped."
      },
      {
        "id": "opt-b",
        "text": "Excited to turn on the television."
      },
      {
        "id": "opt-d",
        "text": "A little sad the blackout was over."
      },
      {
        "id": "opt-c",
        "text": "Frightened of the flickering candles."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "The last line says 'I was almost sorry the blackout was over', which shows the writer was a little sad it had ended. The writer never mentions the storm making them angry or wanting the television, and it was Priya, not the writer, who felt frightened, and that feeling had already passed.",
    "metadata": {
      "subject": "reading",
      "strand": "Narrative comprehension",
      "topic": "The blackout",
      "skill": "Infer a feeling from clues in the text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "recount",
        "inference",
        "feelings"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-008",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How much salt do you need to make the playdough?",
    "stimulus": {
      "title": "How to Make Playdough",
      "body": "You can make soft playdough at home with a few simple things from the kitchen. Always ask an adult to help, because one step uses the hot stove.\n\nWhat you need:\n- 2 cups of plain flour\n- half a cup of salt\n- 1 cup of water\n- a few drops of food colouring\n\nWhat to do:\n1. Mix the flour and salt together in a large bowl.\n2. Add the water and food colouring, and stir until it is smooth.\n3. Ask an adult to cook the mixture in a pot over low heat, stirring all the time, until it forms a ball.\n4. Let the playdough cool down before you touch it.\n5. Knead the dough with your hands until it is soft and stretchy.\n\nStore your playdough in a sealed container so it does not dry out.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "One cup"
      },
      {
        "id": "opt-c",
        "text": "Two cups"
      },
      {
        "id": "opt-d",
        "text": "A few drops"
      },
      {
        "id": "opt-b",
        "text": "Half a cup"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "The 'What you need' list says 'half a cup of salt'. One cup is the amount of water, two cups is the amount of flour, and a few drops is the amount of food colouring.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Making playdough",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "instructions",
        "locate",
        "cooking"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-009",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why do the instructions tell you to ask an adult to help?",
    "stimulus": {
      "title": "How to Make Playdough",
      "body": "You can make soft playdough at home with a few simple things from the kitchen. Always ask an adult to help, because one step uses the hot stove.\n\nWhat you need:\n- 2 cups of plain flour\n- half a cup of salt\n- 1 cup of water\n- a few drops of food colouring\n\nWhat to do:\n1. Mix the flour and salt together in a large bowl.\n2. Add the water and food colouring, and stir until it is smooth.\n3. Ask an adult to cook the mixture in a pot over low heat, stirring all the time, until it forms a ball.\n4. Let the playdough cool down before you touch it.\n5. Knead the dough with your hands until it is soft and stretchy.\n\nStore your playdough in a sealed container so it does not dry out.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "Because one step uses the hot stove."
      },
      {
        "id": "opt-b",
        "text": "Because children cannot mix flour."
      },
      {
        "id": "opt-c",
        "text": "Because the salt is very expensive."
      },
      {
        "id": "opt-d",
        "text": "Because the bowl is too heavy to lift."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The text says to ask an adult 'because one step uses the hot stove', and step 3 cooks the mixture over heat. Children do the mixing in step 1 themselves, and the cost of salt and the weight of the bowl are never mentioned.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Making playdough",
      "skill": "Identify the purpose of an instruction",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "instructions",
        "purpose",
        "safety"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-010",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the steps for making playdough in the correct order.",
    "stimulus": {
      "title": "How to Make Playdough",
      "body": "You can make soft playdough at home with a few simple things from the kitchen. Always ask an adult to help, because one step uses the hot stove.\n\nWhat you need:\n- 2 cups of plain flour\n- half a cup of salt\n- 1 cup of water\n- a few drops of food colouring\n\nWhat to do:\n1. Mix the flour and salt together in a large bowl.\n2. Add the water and food colouring, and stir until it is smooth.\n3. Ask an adult to cook the mixture in a pot over low heat, stirring all the time, until it forms a ball.\n4. Let the playdough cool down before you touch it.\n5. Knead the dough with your hands until it is soft and stretchy.\n\nStore your playdough in a sealed container so it does not dry out.",
      "attribution": "MindMosaic original"
    },
    "visuals": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "st-cool",
          "text": "Let the playdough cool down."
        },
        {
          "id": "st-mix",
          "text": "Mix the flour and salt in a bowl."
        },
        {
          "id": "st-knead",
          "text": "Knead the dough until it is soft."
        },
        {
          "id": "st-cook",
          "text": "An adult cooks the mixture until it forms a ball."
        },
        {
          "id": "st-water",
          "text": "Add the water and food colouring."
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "st-mix",
        "st-water",
        "st-cook",
        "st-cool",
        "st-knead"
      ]
    },
    "explanation": "Follow the numbered steps. First mix the flour and salt, then add the water and colouring, then an adult cooks it into a ball, then let it cool, and finally knead it until soft. You knead last because the dough must cool before you touch it.",
    "metadata": {
      "subject": "reading",
      "strand": "Procedural text comprehension",
      "topic": "Making playdough",
      "skill": "Follow the sequence of steps",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "instructions",
        "sequence",
        "cooking"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-011",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why did Ella write this letter?",
    "stimulus": {
      "title": "A Letter to the Principal",
      "body": "Dear Mr Nguyen,\n\nMy name is Ella and I am in Year 3. I am writing to ask if our class could start a vegetable garden near the back fence.\n\nAt the moment, that corner of the yard is empty and full of weeds. If we planted a garden there, it would look much nicer. We could grow carrots, beans and herbs, and share them with the whole school.\n\nA garden would also help us learn. In class we are studying how plants grow, and a real garden would let us see it happen for ourselves. We would water the plants and pull out the weeds every week.\n\nI have already asked Mr Patel, our teacher, and he thinks it is a wonderful idea. Please let me know what you think.\n\nThank you for reading my letter.\n\nFrom Ella",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "To thank the principal for a new garden."
      },
      {
        "id": "opt-b",
        "text": "To ask if her class could start a garden."
      },
      {
        "id": "opt-c",
        "text": "To complain about the weeds in the yard."
      },
      {
        "id": "opt-d",
        "text": "To tell the principal all about a class trip."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-b"
    },
    "explanation": "In the first paragraph Ella writes 'I am writing to ask if our class could start a vegetable garden', which is the reason for the whole letter. There is no garden yet, so she is not thanking anyone; she suggests a garden rather than only complaining about weeds; and no class trip is mentioned.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "A letter to the principal",
      "skill": "Identify the purpose of a text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "letter",
        "purpose",
        "persuasive"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-012",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Who has Ella already asked about her idea?",
    "stimulus": {
      "title": "A Letter to the Principal",
      "body": "Dear Mr Nguyen,\n\nMy name is Ella and I am in Year 3. I am writing to ask if our class could start a vegetable garden near the back fence.\n\nAt the moment, that corner of the yard is empty and full of weeds. If we planted a garden there, it would look much nicer. We could grow carrots, beans and herbs, and share them with the whole school.\n\nA garden would also help us learn. In class we are studying how plants grow, and a real garden would let us see it happen for ourselves. We would water the plants and pull out the weeds every week.\n\nI have already asked Mr Patel, our teacher, and he thinks it is a wonderful idea. Please let me know what you think.\n\nThank you for reading my letter.\n\nFrom Ella",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "Mr Nguyen, the principal"
      },
      {
        "id": "opt-c",
        "text": "Her friends in Year 5"
      },
      {
        "id": "opt-a",
        "text": "Mr Patel, her teacher"
      },
      {
        "id": "opt-d",
        "text": "Her mum and dad at home"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "Ella writes 'I have already asked Mr Patel, our teacher, and he thinks it is a wonderful idea'. Mr Nguyen is the principal she is writing to now, and there is no mention of Year 5 friends or her parents.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "A letter to the principal",
      "skill": "Locate directly stated information",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "letter",
        "locate",
        "school"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-013",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ella says a garden would help the class learn. Which reason from the letter best supports this?",
    "stimulus": {
      "title": "A Letter to the Principal",
      "body": "Dear Mr Nguyen,\n\nMy name is Ella and I am in Year 3. I am writing to ask if our class could start a vegetable garden near the back fence.\n\nAt the moment, that corner of the yard is empty and full of weeds. If we planted a garden there, it would look much nicer. We could grow carrots, beans and herbs, and share them with the whole school.\n\nA garden would also help us learn. In class we are studying how plants grow, and a real garden would let us see it happen for ourselves. We would water the plants and pull out the weeds every week.\n\nI have already asked Mr Patel, our teacher, and he thinks it is a wonderful idea. Please let me know what you think.\n\nThank you for reading my letter.\n\nFrom Ella",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "The corner is empty and full of weeds."
      },
      {
        "id": "opt-b",
        "text": "The garden would make the yard look nicer."
      },
      {
        "id": "opt-d",
        "text": "They could share the vegetables at school."
      },
      {
        "id": "opt-c",
        "text": "The class is studying how plants grow."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "Ella links learning to the garden by saying the class is 'studying how plants grow' and a real garden 'would let us see it happen for ourselves'. The empty weedy corner and the nicer-looking yard are about appearance, and sharing the vegetables is a different benefit, not about learning.",
    "metadata": {
      "subject": "reading",
      "strand": "Everyday text comprehension",
      "topic": "A letter to the principal",
      "skill": "Connect two parts of a text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "letter",
        "connect ideas",
        "persuasive"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-014",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The poet calls the wind 'a runner who never grows tired'. This mainly tells us the wind â€”",
    "stimulus": {
      "title": "The Wind",
      "body": "The wind is a runner who never grows tired,\nracing through gardens and streets.\nIt tugs at the washing and rattles the gate,\nand dances the leaves off their feet.\n\nIt whistles a tune down the chimney at night\nand pushes the clouds like a broom.\nBy morning it slips away over the hills,\nand quiet comes back to my room.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-d",
        "text": "keeps blowing on and on"
      },
      {
        "id": "opt-a",
        "text": "is training for a race"
      },
      {
        "id": "opt-b",
        "text": "is a person out running"
      },
      {
        "id": "opt-c",
        "text": "feels sleepy at night"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-d"
    },
    "explanation": "A runner who never grows tired keeps going and going, so the poet means the wind keeps blowing without stopping. The wind is not really a person training or running, and it does not feel sleepy â€” it whistles a tune at night and only slips away by morning.",
    "metadata": {
      "subject": "reading",
      "strand": "Poetry comprehension",
      "topic": "The wind",
      "skill": "Understand figurative language in a poem",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "poem",
        "figurative language",
        "metaphor"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-015",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the line 'It tugs at the washing', the word 'tugs' means â€”",
    "stimulus": {
      "title": "The Wind",
      "body": "The wind is a runner who never grows tired,\nracing through gardens and streets.\nIt tugs at the washing and rattles the gate,\nand dances the leaves off their feet.\n\nIt whistles a tune down the chimney at night\nand pushes the clouds like a broom.\nBy morning it slips away over the hills,\nand quiet comes back to my room.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-a",
        "text": "folds"
      },
      {
        "id": "opt-c",
        "text": "pulls"
      },
      {
        "id": "opt-b",
        "text": "dries"
      },
      {
        "id": "opt-d",
        "text": "washes"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-c"
    },
    "explanation": "To tug means to give something a sharp pull, so the wind pulls at the washing on the line. It does not fold, dry or wash the clothes â€” those are things people do, not what the wind is doing here.",
    "metadata": {
      "subject": "reading",
      "strand": "Poetry comprehension",
      "topic": "The wind",
      "skill": "Work out the meaning of a word in a poem",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "poem",
        "word meaning",
        "vocabulary"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-dd-016",
    "type": "reading_comprehension",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What happens to the wind by the end of the poem?",
    "stimulus": {
      "title": "The Wind",
      "body": "The wind is a runner who never grows tired,\nracing through gardens and streets.\nIt tugs at the washing and rattles the gate,\nand dances the leaves off their feet.\n\nIt whistles a tune down the chimney at night\nand pushes the clouds like a broom.\nBy morning it slips away over the hills,\nand quiet comes back to my room.",
      "attribution": "MindMosaic original"
    },
    "options": [
      {
        "id": "opt-b",
        "text": "It grows much stronger in the night."
      },
      {
        "id": "opt-c",
        "text": "It blows the room's window open."
      },
      {
        "id": "opt-a",
        "text": "It slips away and all turns quiet."
      },
      {
        "id": "opt-d",
        "text": "It carries the washing right away."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-a"
    },
    "explanation": "The last two lines say 'By morning it slips away over the hills, and quiet comes back to my room', so the wind leaves and everything becomes quiet. It does not get stronger, no window is blown open, and the washing is only tugged, not carried off.",
    "metadata": {
      "subject": "reading",
      "strand": "Poetry comprehension",
      "topic": "The wind",
      "skill": "Infer meaning from a poem",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "poem",
        "inference",
        "nature"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Milo the kelpie loved one day of the week best of all. Every Saturday morning, Dad clipped on his lead and they walked down to Shelly Beach. Milo would race across the sand, chase the noisy seagulls and splash in the shallow water. He never went in past his knees, because the big waves made him nervous. After their swim, Dad bought a warm sausage roll and shared the crusty end with Milo. Then they walked home for a long afternoon nap.\n\nOn which day did Milo go to the beach?",
    "options": [
      {
        "id": "sunday",
        "text": "Sunday"
      },
      {
        "id": "thursday",
        "text": "Thursday"
      },
      {
        "id": "monday",
        "text": "Monday"
      },
      {
        "id": "saturday",
        "text": "Saturday"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "saturday"
    },
    "explanation": "The second sentence states the day directly: 'Every Saturday morning, Dad clipped on his lead and they walked down to Shelly Beach.' To find directly stated facts, look for the exact word the question asks about, so scan for a day name and you land on Saturday.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Narrative",
      "skill": "Locate directly stated information in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "narrative",
        "locate information"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Bees are busy insects that help gardens grow. When a bee lands on a flower to drink the sweet nectar, tiny grains of pollen stick to its furry legs. As the bee flies off to the next flower, some of that pollen rubs off. This moving of pollen helps plants make seeds and fruit. Without bees, many of the fruits and vegetables we eat would be much harder to grow. That is why farmers are always happy to see bees in their fields.\n\nWhat is the main idea of this text?",
    "options": [
      {
        "id": "bees-move-pollen",
        "text": "Bees move pollen and help plants grow"
      },
      {
        "id": "bees-nectar",
        "text": "Bees like the taste of sweet nectar"
      },
      {
        "id": "farmers-keep-bees",
        "text": "Farmers keep bees inside their fields"
      },
      {
        "id": "bees-furry-legs",
        "text": "Bees have small furry legs and wings"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "bees-move-pollen"
    },
    "explanation": "The main idea is what the whole text is mostly about, not one small detail. Nectar, furry legs and happy farmers are single facts, but every sentence works together to show that bees carry pollen and help plants grow. Ask 'what is the writer really telling me?' to find the main idea.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Information report",
      "skill": "Identify the main idea of a paragraph or whole text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "reading",
        "information report",
        "main idea"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya pushed open the front door and dropped her bag with a thud. Her socks were soaked and her hair dripped onto the mat. She remembered leaving her umbrella on the kitchen bench that morning. 'I should have checked the sky,' she muttered, peeling off her wet jumper and hanging it near the heater.\n\nWhat most likely happened to Priya on her way home?",
    "options": [
      {
        "id": "fell-pool",
        "text": "She fell into the school pool"
      },
      {
        "id": "caught-rain",
        "text": "She got caught in heavy rain"
      },
      {
        "id": "spilled-water",
        "text": "She spilled a bottle of water"
      },
      {
        "id": "swam-sea",
        "text": "She jumped into the sea"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "caught-rain"
    },
    "explanation": "The text never says it rained, so you must put the clues together: wet socks, dripping hair, a forgotten umbrella and 'I should have checked the sky.' Those clues all point to rain. An inference means using clues plus what you already know to work out something the writer did not say directly.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Narrative",
      "skill": "Make a straightforward inference from the text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "reading",
        "narrative",
        "inference"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence from a story.\n\nThe old rope bridge was rickety, and every time a walker crossed it, the planks wobbled and creaked as if they might snap.\n\nIn this sentence, the word rickety means:",
    "options": [
      {
        "id": "freshly-painted",
        "text": "bright and freshly painted"
      },
      {
        "id": "brand-new-strong",
        "text": "brand new and very strong"
      },
      {
        "id": "weak-wobble",
        "text": "weak and likely to wobble"
      },
      {
        "id": "long-wide",
        "text": "long and very wide"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "weak-wobble"
    },
    "explanation": "Work out an unknown word from the words around it. The bridge 'wobbled and creaked as if it might snap', so rickety must mean weak and shaky. The other choices ignore those clues. Using nearby words to unlock a meaning is called reading in context.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Word meaning",
      "skill": "Understand vocabulary in context",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "vocabulary",
        "context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How to Plant a Sunflower Seed\n1. Fill a small pot with soil.\n2. Poke a hole about as deep as your finger.\n3. Drop one seed in and cover it gently.\n4. Water the soil until it is damp.\n5. Place the pot on a sunny windowsill.\n\nWhat is the main purpose of this text?",
    "options": [
      {
        "id": "make-laugh",
        "text": "to make you laugh at a joke"
      },
      {
        "id": "sell-seeds",
        "text": "to sell packets of sunflower seeds"
      },
      {
        "id": "why-yellow",
        "text": "to explain why sunflowers are yellow"
      },
      {
        "id": "teach-plant",
        "text": "to teach you how to plant a seed"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "teach-plant"
    },
    "explanation": "A text's purpose is the reason it was written. This one has a title beginning with 'How to' and numbered steps in order, which are the signs of instructions. That tells you the purpose is to teach a reader to do something, not to sell, joke or explain colours.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Procedure",
      "skill": "Identify text purpose and audience",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "reading",
        "procedure",
        "purpose"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-006",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "How to Make a Banana Smoothie\nStep 1: Peel one ripe banana and break it into pieces.\nStep 2: Put the banana in the blender with a cup of milk.\nStep 3: Add a spoon of honey.\nStep 4: Put the lid on tightly.\nStep 5: Blend until smooth, then pour into a glass.\n\nAt which step do you add the honey?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 3,
      "tolerance": 0,
      "instructions": "Write just the step number."
    },
    "explanation": "Numbered instructions must be followed in order. Read down the steps until you reach the action named in the question. 'Add a spoon of honey' appears at Step 3, so following the sequence gives the answer 3.",
    "metadata": {
      "subject": "reading",
      "strand": "Procedural text comprehension",
      "topic": "Procedure",
      "skill": "Follow sequence in a short text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "reading",
        "procedure",
        "sequence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The whole class groaned when the lights flickered and went out. The storm outside had knocked out the power to the school. Mr Dunn lit a few safe candles and told the class they could not use the computers, so instead he read them a long adventure story in the dim room. Later, everyone agreed it had been the best lesson of the week.\n\nWhy could the class not use the computers?",
    "options": [
      {
        "id": "storm-power",
        "text": "The storm had cut the power"
      },
      {
        "id": "computers-broken",
        "text": "The computers were all broken"
      },
      {
        "id": "teacher-hid",
        "text": "The teacher had hidden them"
      },
      {
        "id": "too-sunny",
        "text": "The room was much too sunny"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "storm-power"
    },
    "explanation": "This is a cause-and-effect question. The effect is 'they could not use the computers', and the cause is stated just before: 'The storm outside had knocked out the power.' No power means no computers. Look for the word 'so' or the sentence right before the effect to find the cause.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Narrative",
      "skill": "Follow cause and effect in a short text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "reading",
        "narrative",
        "cause and effect"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The Sydney funnel-web spider is small but well known. An adult grows to about 3 centimetres long. It has eight legs, like all spiders, and shiny black fangs. It lives in cool, damp burrows and is most active at night. Females can live for several years, but males usually live for less than one year.\n\nHow many legs does the spider have?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 8,
      "tolerance": 0,
      "instructions": "Write just the number."
    },
    "explanation": "The number of legs is stated directly in the text: 'It has eight legs, like all spiders.' Be careful not to grab the first number you see (3 centimetres) â€” match the number to what the question actually asks about, which is legs.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Information report",
      "skill": "Locate directly stated information in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "reading",
        "information report",
        "locate information"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "ATTENTION ALL STUDENTS\nThe library will be closed this Friday while new carpet is laid. Please return any borrowed books by Thursday afternoon. Borrowing will start again on Monday. Thank you for your patience.\nâ€” Mrs Okafor, Librarian\n\nWho is this notice mainly written for?",
    "options": [
      {
        "id": "carpet-workers",
        "text": "the workers laying carpet"
      },
      {
        "id": "students",
        "text": "students at the school"
      },
      {
        "id": "principal-only",
        "text": "the school principal only"
      },
      {
        "id": "town-people",
        "text": "people around the town"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "students"
    },
    "explanation": "The audience is the group the writer is speaking to. The heading says 'ATTENTION ALL STUDENTS' and the notice asks readers to return their borrowed books, which is something students do. That tells you it is written for students, not workers or the whole town.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Notice",
      "skill": "Identify text purpose and audience",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 65,
      "tags": [
        "reading",
        "notice",
        "audience"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam counted his coins twice, but he was still ten cents short. He looked longingly at the shiny red kite in the shop window, then back at the small pile of coins in his palm. With a heavy sigh, he pushed the money into his pocket and turned towards home.\n\nHow does Sam most likely feel at the end?",
    "options": [
      {
        "id": "proud",
        "text": "very proud of himself"
      },
      {
        "id": "cross",
        "text": "cross and angry"
      },
      {
        "id": "let-down",
        "text": "let down and sad"
      },
      {
        "id": "sleepy",
        "text": "bored and sleepy"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "let-down"
    },
    "explanation": "The writer shows feelings through actions, not by naming them. Sam looks 'longingly' at the kite he cannot afford and gives 'a heavy sigh' before walking home. Those clues show disappointment. He is not proud, angry or sleepy, because nothing in the text points to those feelings.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Narrative",
      "skill": "Make a straightforward inference from the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "reading",
        "narrative",
        "inference",
        "feelings"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this sentence from a story about a bushwalk.\n\nBy late afternoon the hikers trudged up the last steep track; their legs ached and they could barely lift their muddy boots.\n\nThe word trudged suggests the hikers walked:",
    "options": [
      {
        "id": "quickly-lightly",
        "text": "quickly and lightly"
      },
      {
        "id": "backwards",
        "text": "backwards up the hill"
      },
      {
        "id": "hands-knees",
        "text": "on their hands and knees"
      },
      {
        "id": "slowly-effort",
        "text": "slowly and with effort"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "slowly-effort"
    },
    "explanation": "Use the surrounding words to decide what trudged means. Aching legs and barely being able to lift their boots show tired, heavy walking, so trudged means to walk slowly with great effort. Quick, light walking would not match those clues.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Word meaning",
      "skill": "Understand vocabulary in context",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "reading",
        "vocabulary",
        "context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Recycling gives old things a new life. When you put a glass jar into the recycling bin, it is taken to a factory, cleaned and melted down. The melted glass is then shaped into brand new bottles and jars. The same glass can be recycled again and again without wearing out. This saves energy and keeps rubbish out of the ground.\n\nWhich sentence best sums up this paragraph?",
    "options": [
      {
        "id": "recycling-new",
        "text": "Recycling turns old items into new ones"
      },
      {
        "id": "cleaned-factory",
        "text": "Glass is cleaned at a very busy factory"
      },
      {
        "id": "hold-drinks",
        "text": "Glass bottles can hold cold drinks"
      },
      {
        "id": "buried-ground",
        "text": "Rubbish is buried deep under the ground"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "recycling-new"
    },
    "explanation": "A summary must cover the whole paragraph, not one step. The paragraph traces a jar from the bin, to the factory, to becoming new bottles, so it is about recycling turning old items into new ones. Being cleaned at a factory is only part of that story.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Information report",
      "skill": "Identify the main idea of a paragraph or whole text",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "reading",
        "information report",
        "main idea"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ella planted a bean seed in a paper cup. For the first week nothing happened, and she almost gave up hope. Then a tiny green shoot poked through the soil. Each day it grew taller, leaning towards the sunny window. By the end of the month the plant was too big for its little cup, so Ella carefully moved it into the garden bed.\n\nWhy did Ella move the plant into the garden?",
    "options": [
      {
        "id": "not-grown",
        "text": "The seed had not grown at all"
      },
      {
        "id": "too-big",
        "text": "It grew too large for its cup"
      },
      {
        "id": "reuse-cup",
        "text": "She wanted to use the cup again"
      },
      {
        "id": "window-cracked",
        "text": "The bright window had cracked"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "too-big"
    },
    "explanation": "This is a cause-and-effect question. The action 'moved it into the garden bed' comes straight after 'the plant was too big for its little cup, so...'. The word 'so' links the cause to the effect, showing she moved it because it had outgrown the cup.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Narrative",
      "skill": "Follow cause and effect in a short text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "reading",
        "narrative",
        "cause and effect"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the autumn fair, Jack spent his tokens carefully. He used two tokens on the ring toss, three on the coconut shy, and saved his very last token for a ride on the little train. His sister Mia spent all six of her tokens on the jumping castle.\n\nWhat did Jack save his last token for?",
    "options": [
      {
        "id": "ring-toss",
        "text": "the ring toss game"
      },
      {
        "id": "jumping-castle",
        "text": "the jumping castle"
      },
      {
        "id": "train-ride",
        "text": "a ride on the train"
      },
      {
        "id": "coconut-shy",
        "text": "the coconut shy stall"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "train-ride"
    },
    "explanation": "Read carefully to match the exact detail. The text says Jack 'saved his very last token for a ride on the little train.' The jumping castle was where Mia spent her tokens, not Jack, so watch which person each fact belongs to.",
    "metadata": {
      "subject": "reading",
      "strand": "Locating and identifying",
      "topic": "Narrative",
      "skill": "Locate directly stated information in a text",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "reading",
        "narrative",
        "locate information"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Come to Rosa's Fruit Barn! We have the juiciest mangoes, the crunchiest apples and the sweetest strawberries in town. Everything is picked fresh each morning. Open every day from 8 am. Bring the whole family â€” you won't find better fruit anywhere!\n\nWhy was this text most likely written?",
    "options": [
      {
        "id": "how-grow",
        "text": "to explain how mangoes grow"
      },
      {
        "id": "warn-fruit",
        "text": "to warn people about old fruit"
      },
      {
        "id": "list-prices",
        "text": "to list the prices of fruit"
      },
      {
        "id": "make-visit",
        "text": "to make people visit the shop"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "make-visit"
    },
    "explanation": "Look at what the writer wants you to do. Words like 'juiciest', 'come to' and 'bring the whole family' are used to sound exciting and persuade you, which is the job of an advertisement. So its purpose is to make people want to visit the shop, not to explain, warn or list prices.",
    "metadata": {
      "subject": "reading",
      "strand": "Analysing and evaluating",
      "topic": "Advertisement",
      "skill": "Identify text purpose and audience",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "reading",
        "advertisement",
        "purpose"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-reading-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "When the final whistle blew, Tom's soccer team had lost by a single goal. His teammates trooped off the field with their heads down. But Coach Ravi gathered them into a circle and said, 'You never gave up, and that matters more than the score.' Slowly, the tired players began to smile again.\n\nWhat can you tell about Coach Ravi from this text?",
    "options": [
      {
        "id": "values-effort",
        "text": "He values effort more than the score"
      },
      {
        "id": "only-winning",
        "text": "He only cares about winning games and cups"
      },
      {
        "id": "very-angry",
        "text": "He was very angry about losing"
      },
      {
        "id": "not-watch",
        "text": "He did not really watch the game"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "values-effort"
    },
    "explanation": "You work out what a character is like from what they say and do. Coach Ravi's words, 'You never gave up, and that matters more than the score', and the way the players smile again show he cares about effort, not just winning. His actions rule out the angry or uninterested choices.",
    "metadata": {
      "subject": "reading",
      "strand": "Integrating and interpreting",
      "topic": "Narrative",
      "skill": "Make a straightforward inference from the text",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "reading",
        "narrative",
        "inference",
        "character"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
