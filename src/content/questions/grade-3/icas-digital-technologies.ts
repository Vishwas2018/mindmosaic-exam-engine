import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 ICAS-style Digital Technologies — 34 hand-authored questions.
 * ICAS sets this paper only to Year 7, and NAPLAN not at all, so the
 * programme is ICAS-only and its year span stops short of the others.
 */
export const grade3IcasDigitalTechnologies = defineQuestions([
  {
    id: "icas-y3-digitech-a-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Follow these steps in order. Start with the number 4. Add 3. Then double the answer. What number do you finish with?",
    options: [
      { id: "a", text: "11" },
      { id: "c", text: "10" },
      { id: "b", text: "14" },
      { id: "d", text: "8" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "b",
    },
    explanation: "Do the steps in order. 4 add 3 is 7. To double 7 means 7 and 7 together, which is 14. If you double first you get the wrong answer.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Following a sequence of steps",
      skill: "Follow a step-by-step sequence to find the result",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["algorithms", "sequence", "following steps"],
    },
  },
  {
    id: "icas-y3-digitech-a-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Mia wrote these steps to make a jam sandwich. 1) Take two slices of bread. 2) Spread jam on one slice. 3) Put the two slices together. 4) Pour the jam into a cup. Which step is wrong?",
    options: [
      { id: "b", text: "Step 2" },
      { id: "c", text: "Step 3" },
      { id: "d", text: "Step 1" },
      { id: "a", text: "Step 4" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "a",
    },
    explanation: "Read each step and picture doing it. Pouring jam into a cup does not help make a sandwich, so step 4 is the step that does not belong.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Errors in instructions",
      skill: "Find the wrong step in a set of instructions",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["algorithms", "debugging", "wrong step"],
    },
  },
  {
    id: "icas-y3-digitech-a-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "These steps tell how to plant a seed, but one step is missing. 1) Dig a small hole in the soil. 2) Put the seed in the hole. 3) ??? 4) Water the soil. Which step is missing at number 3?",
    options: [
      { id: "d", text: "Cover the seed with soil" },
      { id: "a", text: "Dig another hole nearby" },
      { id: "b", text: "Take the seed back out" },
      { id: "c", text: "Water it again now" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "d",
    },
    explanation: "After putting the seed in the hole, you cover it with soil, then water it. Digging another hole, taking the seed out, or watering before covering will not help the seed grow where you planted it.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Missing steps",
      skill: "Find the missing step in an algorithm",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["algorithms", "missing step", "reasoning"],
    },
  },
  {
    id: "icas-y3-digitech-a-004",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these steps for washing your hands in the correct order, from first to last.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "soap",
          text: "Rub soap on your hands",
        },
        {
          id: "tap",
          text: "Turn on the tap",
        },
        {
          id: "dry",
          text: "Dry your hands with a towel",
        },
        {
          id: "wet",
          text: "Wet your hands",
        },
        {
          id: "rinse",
          text: "Rinse the soap off",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["tap", "wet", "soap", "rinse", "dry"],
    },
    explanation: "Think about what must happen first. You turn on the tap, then wet your hands, then rub soap on, then rinse the soap off, and dry your hands last.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Ordering task steps",
      skill: "Put the steps of an everyday task in order",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["algorithms", "ordering", "sequence"],
    },
  },
  {
    id: "icas-y3-digitech-a-005",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A robot starts on square 1. It follows this rule: 'Move forward 2 squares. Do this 3 times.' Which square does the robot land on?",
    options: [
      { id: "a", text: "Square 5" },
      { id: "c", text: "Square 7" },
      { id: "b", text: "Square 6" },
      { id: "d", text: "Square 8" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "c",
    },
    explanation: "Doing 'move 2' three times adds 6 in total. Start on 1, then 3, then 5, then 7. So the robot lands on square 7.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Loops and repeats",
      skill: "Work out the result of a repeated instruction (loop)",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["algorithms", "loops", "repeats"],
    },
  },
  {
    id: "icas-y3-digitech-a-006",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The pictograph shows how many books each child read. Each star stands for 2 books. How many books did Sam read?",
    visuals: [
      {
        id: "visual-icas-y3-digitech-a-006-1",
        type: "table",
        altText: "A pictograph. Ava has three stars, Sam has four stars, and Leo has two stars. Each star stands for 2 books.",
        data: {
          headers: ["Child", "Books read"],
          rows: [
            ["Ava", "★ ★ ★"],
            ["Sam", "★ ★ ★ ★"],
            ["Leo", "★ ★"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 8,
      tolerance: 0,
    },
    explanation: "Sam's row has four stars. Each star means 2 books, so count in twos: 2, 4, 6, 8. Sam read 8 books.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Reading a pictograph",
      skill: "Read a value from a pictograph",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "pictograph", "reading data"],
    },
  },
  {
    id: "icas-y3-digitech-a-007",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows how many children chose each lunch. How many children chose the salad?",
    options: [
      { id: "b", text: "9" },
      { id: "c", text: "7" },
      { id: "a", text: "5" },
      { id: "d", text: "6" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-digitech-a-007-1",
        type: "table",
        altText: "A table of lunch choices: Pie 9 children, Salad 5 children, Wrap 7 children.",
        data: {
          headers: ["Lunch", "Children"],
          rows: [
            ["Pie", "9"],
            ["Salad", "5"],
            ["Wrap", "7"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "a",
    },
    explanation: "Find the Salad row, then read across to the Children column. It shows 5, so 5 children chose the salad.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Reading a table",
      skill: "Read information from a table",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["data", "table", "reading data"],
    },
  },
  {
    id: "icas-y3-digitech-a-008",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A class sorts these animals into the group 'can fly'. Choose all the animals that belong in this group.",
    options: [
      { id: "goldfish", text: "Goldfish" },
      { id: "sparrow", text: "Sparrow" },
      { id: "eagle", text: "Eagle" },
      { id: "dog", text: "Dog" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["sparrow", "eagle"],
    },
    explanation: "The group is 'can fly'. Sparrows and eagles are birds that fly, so they belong. A dog and a goldfish cannot fly, so they do not belong in this group.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Sorting by an attribute",
      skill: "Sort items into a group by an attribute",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "sorting", "grouping"],
    },
  },
  {
    id: "icas-y3-digitech-a-009",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The tally chart shows goals scored each week. How many goals were scored in total across the three weeks?",
    visuals: [
      {
        id: "visual-icas-y3-digitech-a-009-1",
        type: "table",
        altText: "A tally chart. Week 1 has three marks, Week 2 has two marks, Week 3 has four marks.",
        data: {
          headers: ["Week", "Tally"],
          rows: [
            ["Week 1", "| | |"],
            ["Week 2", "| |"],
            ["Week 3", "| | | |"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 9,
      tolerance: 0,
    },
    explanation: "Count the marks in each row: 3, then 2, then 4. Add them together: 3 + 2 + 4 = 9 goals in total.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Tally marks",
      skill: "Count and total using tally marks",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "tally", "counting"],
    },
  },
  {
    id: "icas-y3-digitech-a-010",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A weather chart uses symbols. Match each symbol to what it means.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "sun",
          text: "☀ (sun)",
        },
        {
          id: "cloud",
          text: "☁ (cloud)",
        },
        {
          id: "umbrella",
          text: "☂ (umbrella)",
        },
        {
          id: "snow",
          text: "❄ (snowflake)",
        },
      ],
      targets: [
        {
          id: "sunny",
          text: "Sunny",
        },
        {
          id: "cloudy",
          text: "Cloudy",
        },
        {
          id: "rainy",
          text: "Rainy",
        },
        {
          id: "snowy",
          text: "Snowy",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "sun",
          targetId: "sunny",
        },
        {
          sourceId: "cloud",
          targetId: "cloudy",
        },
        {
          sourceId: "umbrella",
          targetId: "rainy",
        },
        {
          sourceId: "snow",
          targetId: "snowy",
        },
      ],
    },
    explanation: "Match each symbol to what it shows: the sun means sunny, the cloud means cloudy, the umbrella is used for rain so it means rainy, and the snowflake means snowy.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Symbols and keys",
      skill: "Match symbols to their meanings using a key",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "symbols", "key"],
    },
  },
  {
    id: "icas-y3-digitech-a-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A drummer follows this instruction: 'Hit the drum, then wait. Repeat until you have hit the drum 4 times.' The drummer has already hit the drum 1 time. How many more times must the drummer hit the drum?",
    options: [
      { id: "d", text: "3" },
      { id: "a", text: "2" },
      { id: "b", text: "4" },
      { id: "c", text: "5" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "d",
    },
    explanation: "The drummer needs 4 hits in total and has already done 1. So the number left is 4 − 1 = 3 more hits.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Counting repeats in a loop",
      skill: "Count how many times a step still repeats in a loop",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["algorithms", "loops", "counting"],
    },
  },
  {
    id: "icas-y3-digitech-a-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A game has this rule: 'If the number is even, clap. If the number is odd, jump.' The number called out is 7. What should you do?",
    options: [
      { id: "a", text: "Clap" },
      { id: "c", text: "Jump" },
      { id: "b", text: "Clap and jump" },
      { id: "d", text: "Do nothing" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "c",
    },
    explanation: "7 is an odd number. The rule says to jump for odd numbers, so you jump. You would only clap if the number were even.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Simple if-then rules",
      skill: "Follow a simple 'if... then' instruction",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["algorithms", "if then", "rules"],
    },
  },
  {
    id: "icas-y3-digitech-a-013",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Look at the pictograph. Each dot stands for 2 pets. Statement: More dogs than cats were counted. Is this statement true or false?",
    visuals: [
      {
        id: "visual-icas-y3-digitech-a-013-1",
        type: "table",
        altText: "A pictograph. Cats have three dots, dogs have five dots, birds have one dot. Each dot stands for 2 pets.",
        data: {
          headers: ["Pet", "Dots"],
          rows: [
            ["Cats", "● ● ●"],
            ["Dogs", "● ● ● ● ●"],
            ["Birds", "●"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "boolean",
      value: true,
    },
    explanation: "Dogs have 5 dots, which is 10 pets, and cats have 3 dots, which is 6 pets. 10 is more than 6, so it is true that more dogs than cats were counted.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Comparing data on a pictograph",
      skill: "Decide if a statement about a pictograph is true or false",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "pictograph", "comparing"],
    },
  },
  {
    id: "icas-y3-digitech-a-014",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Ben wants a floor robot to draw a square. A square has four equal sides and four corners. Which set of steps will draw a square?",
    options: [
      { id: "a", text: "Go forward once, then stop." },
      { id: "c", text: "Go forward 4 times without turning." },
      { id: "b", text: "Repeat 4 times: go forward, then turn." },
      { id: "d", text: "Turn 4 times without going forward." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "b",
    },
    explanation: "Going forward makes a side and turning makes a corner. A square needs 4 sides and 4 corners, so you repeat 'go forward, then turn' four times. Going forward without turning only makes one long line.",
    metadata: {
      subject: "digital_technologies",
      strand: "Algorithms",
      topic: "Choosing correct steps",
      skill: "Choose the set of steps that completes a task",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["algorithms", "loops", "reasoning"],
    },
  },
  {
    id: "icas-y3-digitech-a-015",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows how many minutes each child read. Choose all the children who read for more than 20 minutes.",
    options: [
      { id: "max", text: "Max" },
      { id: "noah", text: "Noah" },
      { id: "zoe", text: "Zoe" },
      { id: "ivy", text: "Ivy" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-digitech-a-015-1",
        type: "table",
        altText: "A table of reading time: Noah 15 minutes, Zoe 30 minutes, Ivy 20 minutes, Max 25 minutes.",
        data: {
          headers: ["Child", "Minutes"],
          rows: [
            ["Noah", "15"],
            ["Zoe", "30"],
            ["Ivy", "20"],
            ["Max", "25"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["zoe", "max"],
    },
    explanation: "'More than 20' means a number bigger than 20. Zoe read 30 and Max read 25, which are both more than 20. Ivy read exactly 20, which is not more than 20, and Noah read only 15.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Selecting data that fits a rule",
      skill: "Choose all data items that fit a rule",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["data", "table", "rule"],
    },
  },
  {
    id: "icas-y3-digitech-a-018",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A class sorts things into a group called 'living things'. They put a cat, a rock and a tree into the group. Is this group sorted correctly?",
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: false,
    },
    explanation: "A group called 'living things' should only hold things that are alive. A cat and a tree are living, but a rock is not alive, so the group is not sorted correctly.",
    metadata: {
      subject: "digital_technologies",
      strand: "Data",
      topic: "Checking a sorted group",
      skill: "Decide if items are grouped correctly by attribute",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["data", "sorting", "attribute"],
    },
  },
  {
    id: "icas-y3-digitech-b-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Anita wants to type her name so it appears on the computer. Which one of these lets her put words INTO the computer?",
    options: [
      { id: "keyboard", text: "A keyboard" },
      { id: "speakers", text: "A pair of speakers" },
      { id: "printer", text: "A colour printer" },
      { id: "screen", text: "A picture screen" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "keyboard",
    },
    explanation: "An input device lets you put information into a computer. You type on a keyboard, so it is an input device. Speakers, a printer and a screen all send information out to you, so they are output devices.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Input and output devices",
      skill: "Identifying an input device",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["input device", "keyboard", "hardware"],
    },
  },
  {
    id: "icas-y3-digitech-b-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A computer has worked out an answer. Which part SHOWS the answer so a person can read it?",
    options: [
      { id: "microphone", text: "A small microphone" },
      { id: "monitor", text: "The monitor screen" },
      { id: "mouse", text: "The computer mouse" },
      { id: "scanner", text: "A flat scanner" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "monitor",
    },
    explanation: "An output device sends information out from the computer to you. The monitor screen shows the answer so you can read it. A microphone, mouse and scanner all put information in, so they are input devices.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Input and output devices",
      skill: "Identifying an output device",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["output device", "monitor", "hardware"],
    },
  },
  {
    id: "icas-y3-digitech-b-003",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A game you can play on a tablet is a kind of software: a set of instructions that tells the tablet what to do. Is this statement true or false?",
    options: [],
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: true,
    },
    explanation: "Software means the programs and instructions that tell a device what to do, like games and apps. Hardware is the parts you can touch. A game is a program, so it is software, which makes the statement true.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Hardware and software",
      skill: "Understanding what software is",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["software", "programs", "apps"],
    },
  },
  {
    id: "icas-y3-digitech-b-004",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sort each thing into 'Hardware' (a part you can touch) or 'Software' (a program that runs).",
    options: [],
    interaction: {
      type: "matching",
      sources: [
        {
          id: "mouse",
          text: "A computer mouse",
        },
        {
          id: "drawing-app",
          text: "A drawing app",
        },
        {
          id: "printer",
          text: "A printer",
        },
        {
          id: "browser",
          text: "A web browser program",
        },
      ],
      targets: [
        {
          id: "hardware",
          text: "Hardware",
        },
        {
          id: "software",
          text: "Software",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "mouse",
          targetId: "hardware",
        },
        {
          sourceId: "drawing-app",
          targetId: "software",
        },
        {
          sourceId: "printer",
          targetId: "hardware",
        },
        {
          sourceId: "browser",
          targetId: "software",
        },
      ],
    },
    explanation: "Hardware is any part you can touch, like a mouse or a printer. Software is a program that runs, like a drawing app or a web browser. Ask yourself: can I hold it (hardware) or does it run on the screen (software)?",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Hardware and software",
      skill: "Sorting items as hardware or software",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["hardware", "software", "sorting"],
    },
  },
  {
    id: "icas-y3-digitech-b-005",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each device to the job it is made to do.",
    options: [],
    interaction: {
      type: "matching",
      sources: [
        {
          id: "printer",
          text: "A printer",
        },
        {
          id: "headphones",
          text: "Headphones",
        },
        {
          id: "webcam",
          text: "A webcam",
        },
        {
          id: "microphone",
          text: "A microphone",
        },
      ],
      targets: [
        {
          id: "on-paper",
          text: "Print words onto paper",
        },
        {
          id: "hear-private",
          text: "Let only you hear the sound",
        },
        {
          id: "show-face",
          text: "Show your face on a video call",
        },
        {
          id: "record-voice",
          text: "Record your voice",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "printer",
          targetId: "on-paper",
        },
        {
          sourceId: "headphones",
          targetId: "hear-private",
        },
        {
          sourceId: "webcam",
          targetId: "show-face",
        },
        {
          sourceId: "microphone",
          targetId: "record-voice",
        },
      ],
    },
    explanation: "Match each device to what it is built to do. A printer puts words on paper, headphones let only you hear sound, a webcam shows your face on a video call, and a microphone records your voice.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Devices and their uses",
      skill: "Matching a device to the job it does",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["devices", "uses", "matching"],
    },
  },
  {
    id: "icas-y3-digitech-b-006",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows the buttons in a computer menu and what each one does. Use the table to choose the right button for each task.",
    options: [],
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "To add a picture to her page, Sam clicks the button called",
          options: [
            { id: "file", text: "File" },
            { id: "edit", text: "Edit" },
            { id: "insert", text: "Insert" },
            { id: "help", text: "Help" },
          ],
        },
        {
          id: "f2",
          label: "To save her work, Sam clicks the button called",
          options: [
            { id: "file", text: "File" },
            { id: "edit", text: "Edit" },
            { id: "insert", text: "Insert" },
            { id: "help", text: "Help" },
          ],
        },
      ],
    },
    visuals: [
      {
        id: "visual-icas-y3-digitech-b-006-1",
        type: "table",
        altText: "A menu table with buttons File, Edit, Insert and Help and what each button does.",
        data: {
          headers: ["Menu button", "What it does"],
          rows: [
            ["File", "Open or save your work"],
            ["Edit", "Undo or copy"],
            ["Insert", "Add a picture"],
            ["Help", "Get answers to questions"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "insert",
        },
        {
          id: "f2",
          correctOptionId: "file",
        },
      ],
    },
    explanation: "Read the menu table row by row. The Insert button says 'Add a picture', so Sam clicks Insert to add a picture. The File button says 'Open or save your work', so she clicks File to save her work.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Menus and navigation",
      skill: "Following a menu to find the right button",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["menu", "navigation", "table"],
    },
  },
  {
    id: "icas-y3-digitech-b-007",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A kitchen robot follows a flowchart to make toast. Put the robot's steps in the correct order, from first to last.",
    options: [],
    interaction: {
      type: "ordering",
      items: [
        {
          id: "put-bread",
          text: "Put a slice of bread in the toaster",
        },
        {
          id: "press",
          text: "Press the start button",
        },
        {
          id: "wait",
          text: "Wait until the toast pops up",
        },
        {
          id: "take-out",
          text: "Take the toast out",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["put-bread", "press", "wait", "take-out"],
    },
    explanation: "A flowchart is followed one step at a time. First put the bread in, then press start, then wait for the toast to pop up, and last take the toast out. Each step must finish before the next one can begin.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Flowcharts and steps",
      skill: "Ordering the steps in a flowchart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["flowchart", "steps", "sequence"],
    },
  },
  {
    id: "icas-y3-digitech-b-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A flowchart says: 'Is it raining? If YES, take an umbrella. If NO, take a hat.' This morning it is sunny with no rain. Following the flowchart, what should you take?",
    options: [
      { id: "both", text: "Both an umbrella and a hat" },
      { id: "nothing", text: "Nothing at all today" },
      { id: "hat", text: "A hat" },
      { id: "umbrella", text: "An umbrella" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "hat",
    },
    explanation: "Follow the flowchart by answering its question. It asks 'Is it raining?' It is sunny with no rain, so the answer is NO. The NO path says take a hat, so you take a hat, not an umbrella.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Flowcharts and steps",
      skill: "Following a yes or no decision in a flowchart",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["flowchart", "decision", "reasoning"],
    },
  },
  {
    id: "icas-y3-digitech-b-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A row of lights shows a repeating pattern: ON, OFF, ON, OFF, ON, then a blank. What should the next light be?",
    options: [
      { id: "on", text: "ON" },
      { id: "flashing", text: "Flashing" },
      { id: "half", text: "Half ON" },
      { id: "off", text: "OFF" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "off",
    },
    explanation: "The pattern repeats ON, OFF over and over. The last light shown is ON, so the next one must be OFF to keep the repeat going. Saying the pattern out loud helps you hear what comes next.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Patterns and codes",
      skill: "Continuing an on and off pattern",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["pattern", "on off", "sequence"],
    },
  },
  {
    id: "icas-y3-digitech-b-010",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Ben writes each letter using a code made of just two symbols: dot and dash. Use the table to read the code, then choose the right letter for each one.",
    options: [],
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "f1",
          label: "The code 'dash dot' stands for the letter",
          options: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
            { id: "c", text: "C" },
            { id: "d", text: "D" },
          ],
        },
        {
          id: "f2",
          label: "The code 'dot dash' stands for the letter",
          options: [
            { id: "a", text: "A" },
            { id: "b", text: "B" },
            { id: "c", text: "C" },
            { id: "d", text: "D" },
          ],
        },
      ],
    },
    visuals: [
      {
        id: "visual-icas-y3-digitech-b-010-1",
        type: "table",
        altText: "A code table: A is dot dot, B is dot dash, C is dash dot, D is dash dash.",
        data: {
          headers: ["Letter", "Its code"],
          rows: [
            ["A", "dot dot"],
            ["B", "dot dash"],
            ["C", "dash dot"],
            ["D", "dash dash"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "dropdown",
      fields: [
        {
          id: "f1",
          correctOptionId: "c",
        },
        {
          id: "f2",
          correctOptionId: "b",
        },
      ],
    },
    explanation: "Read the code table one row at a time. 'dash dot' is in the row for the letter C, so that code stands for C. 'dot dash' is in the row for the letter B, so that code stands for B.",
    metadata: {
      subject: "digital_technologies",
      strand: "Digital Systems",
      topic: "Patterns and codes",
      skill: "Reading a two-symbol code",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["code", "two symbols", "table"],
    },
  },
  {
    id: "icas-y3-digitech-b-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "While playing an online game, a stranger sends Kai a message asking where he lives. What is the safest thing for Kai to do?",
    options: [
      { id: "tell-adult", text: "Do not reply and tell a trusted adult" },
      { id: "give-address", text: "Send the stranger his home address" },
      { id: "give-school", text: "Tell the stranger his school name" },
      { id: "meet", text: "Agree to meet the stranger soon" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "tell-adult",
    },
    explanation: "A stranger online should never be told where you live. The safe choice is to not reply and tell a trusted adult. Giving your address or school name, or agreeing to meet, could put you in danger.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Staying safe online",
      skill: "Responding safely to an online stranger",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["online safety", "strangers", "trusted adult"],
    },
  },
  {
    id: "icas-y3-digitech-b-012",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Writing a mean comment about a classmate's photo online is being kind. Is this statement true or false?",
    options: [],
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: false,
    },
    explanation: "Being kind online means writing polite and friendly words. A mean comment about someone's photo hurts their feelings, so it is unkind, not kind, which makes the statement false.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Being kind online",
      skill: "Being kind and polite online",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["kindness", "online", "behaviour"],
    },
  },
  {
    id: "icas-y3-digitech-b-013",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Priya's friend asks her to tell them her password so they can play on her account. What should Priya do?",
    options: [
      { id: "write-board", text: "Write the password on the board" },
      { id: "keep-secret", text: "Keep it secret and say no" },
      { id: "send-message", text: "Send the password in a message" },
      { id: "say-loud", text: "Say the password out loud in class" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "keep-secret",
    },
    explanation: "A password is a secret that keeps your account safe. Even a friend should not be told your password, so Priya should keep it secret and say no. Writing it, sending it, or saying it out loud lets other people use her account.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Passwords",
      skill: "Keeping a password private",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["password", "private", "account"],
    },
  },
  {
    id: "icas-y3-digitech-b-014",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which TWO of these make a password stronger and safer? Choose all that are correct.",
    options: [
      { id: "your-name", text: "It is just your first name" },
      { id: "birthday", text: "It is your birthday, like 0704" },
      { id: "long-mix", text: "It is long and mixes letters and numbers" },
      { id: "hard-guess", text: "It is hard for other people to guess" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["long-mix", "hard-guess"],
    },
    explanation: "A strong password is long, mixes letters and numbers, and is hard for others to guess. Your first name or your birthday is far too easy for someone to work out, so those two choices make a weak password.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Passwords",
      skill: "Recognising a strong password",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["password", "strong", "security"],
    },
  },
  {
    id: "icas-y3-digitech-b-015",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which TWO of these are personal information that you should keep private online? Choose all that are correct.",
    options: [
      { id: "fav-game", text: "The name of a game you like" },
      { id: "home-address", text: "Your home address" },
      { id: "phone", text: "Your phone number" },
      { id: "fav-colour", text: "Your favourite colour" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["home-address", "phone"],
    },
    explanation: "Personal information tells someone who or where you are, like your home address and phone number. These should be kept private online. A favourite colour or a game you like cannot be used to find you.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Personal information",
      skill: "Recognising personal information",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 65,
      tags: ["personal information", "privacy", "online"],
    },
  },
  {
    id: "icas-y3-digitech-b-016",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Leo wants to write a story and then print it out for his teacher. Which digital tool is the most sensible one to use?",
    options: [
      { id: "writing", text: "A writing app" },
      { id: "calculator", text: "A calculator app" },
      { id: "music", text: "A music player" },
      { id: "stopwatch", text: "A stopwatch app" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "writing",
    },
    explanation: "Choose the tool built for the job. Leo wants to write and print a story, so a writing app is the sensible choice. A calculator, a music player and a stopwatch are made for other jobs, not for writing.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Choosing digital tools",
      skill: "Choosing a sensible digital tool for a task",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["digital tools", "writing", "choice"],
    },
  },
  {
    id: "icas-y3-digitech-b-017",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each task to the digital tool that is best for doing it.",
    options: [],
    interaction: {
      type: "matching",
      sources: [
        {
          id: "draw",
          text: "Draw a colourful picture",
        },
        {
          id: "add-numbers",
          text: "Add up a list of numbers",
        },
        {
          id: "video-call",
          text: "See and talk to Grandma far away",
        },
        {
          id: "find-facts",
          text: "Find facts about tigers",
        },
      ],
      targets: [
        {
          id: "paint-app",
          text: "A paint app",
        },
        {
          id: "calc-app",
          text: "A calculator app",
        },
        {
          id: "video-app",
          text: "A video call app",
        },
        {
          id: "search-web",
          text: "A search website",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "draw",
          targetId: "paint-app",
        },
        {
          sourceId: "add-numbers",
          targetId: "calc-app",
        },
        {
          sourceId: "video-call",
          targetId: "video-app",
        },
        {
          sourceId: "find-facts",
          targetId: "search-web",
        },
      ],
    },
    explanation: "Match each task to the tool made for it: a paint app to draw a picture, a calculator app to add numbers, a video call app to see and talk to Grandma, and a search website to find facts about tigers.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Choosing digital tools",
      skill: "Matching a task to the right digital tool",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["digital tools", "tasks", "matching"],
    },
  },
  {
    id: "icas-y3-digitech-b-018",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A pop-up appears on the screen and says: 'You have won a prize! Type your name and address to claim it.' What is the safest thing to do?",
    options: [
      { id: "type-details", text: "Type your name and address in it" },
      { id: "close", text: "Close the pop-up and do not type anything" },
      { id: "click-quick", text: "Click on it to get the prize" },
      { id: "share", text: "Send the pop-up to your friends" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "close",
    },
    explanation: "A pop-up promising a prize for your details is a trick to collect your private information. The safe choice is to close it and not type anything. Typing your details, clicking it, or sharing it could give private information away.",
    metadata: {
      subject: "digital_technologies",
      strand: "Safe and Responsible Use",
      topic: "Staying safe online",
      skill: "Spotting a suspicious pop-up message",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["pop-up", "scam", "online safety"],
    },
  },

  ...([
  {
    "id": "icas-y3-digitech-da-001",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A Year 3 class is learning that an algorithm is a list of steps written in the right order. These steps for making a jam sandwich have been muddled up. Put them in the order that makes sense.",
    "instructions": "Drag the steps into the correct order, from first to last.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "cut",
          "text": "Cut the sandwich in half"
        },
        {
          "id": "bread",
          "text": "Get two slices of bread"
        },
        {
          "id": "together",
          "text": "Put the two slices together"
        },
        {
          "id": "spread",
          "text": "Spread jam onto one slice"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "bread",
        "spread",
        "together",
        "cut"
      ]
    },
    "explanation": "Work out what has to happen before each step can work. You cannot spread jam until you have the bread, so getting the bread comes first. You cannot join the slices before the jam is on, and you cannot cut a sandwich that is not put together yet. That gives the order: get the bread, spread the jam, put the slices together, then cut it in half.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Ordering steps in a sequence",
      "skill": "Putting everyday steps into a correct algorithm",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "algorithm",
        "sequence",
        "steps",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Some parts of a computer let you put information IN, and some parts show information coming OUT. Which one of these is used to put information INTO a computer?",
    "options": [
      {
        "id": "keyboard",
        "text": "A keyboard"
      },
      {
        "id": "screen",
        "text": "A screen"
      },
      {
        "id": "printer",
        "text": "A printer"
      },
      {
        "id": "speaker",
        "text": "A loudspeaker"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "keyboard"
    },
    "explanation": "Ask for each part: does it send information into the computer, or out to a person? You press keys on a keyboard to type letters and numbers into the computer, so it is an input. A screen shows pictures, a printer makes a printed page, and a loudspeaker plays sound, so all three send information out. Only the keyboard puts information in.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Input and output",
      "skill": "Identifying an input device",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "input",
        "output",
        "hardware",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-003",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A new game app shows a box that says: 'Type your home address here to play faster.' Deciding to type your home address into the game is a safe thing to do.",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Your home address is private information that shows where you live. A game does not need it to work, and giving it to an app you do not know is not safe. The safe choice is to leave the box empty and tell a trusted adult, so the statement is false.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Protecting personal information",
      "skill": "Recognising unsafe requests for personal details",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "online safety",
        "privacy",
        "personal information",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Maya writes instructions to make a floor robot draw a square. She writes: draw a line, turn, draw a line, turn, draw a line, turn. When the robot follows them, it only draws three sides. What one step should she add at the end so the robot finishes the square?",
    "options": [
      {
        "id": "turn-again",
        "text": "Turn one more time"
      },
      {
        "id": "draw-line",
        "text": "Draw one more line"
      },
      {
        "id": "rub-out",
        "text": "Rub out the last line she drew"
      },
      {
        "id": "start-over",
        "text": "Start the whole square from the beginning again"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "draw-line"
    },
    "explanation": "A square has four sides, but Maya's steps only draw three lines. She has already turned three times, so the robot is facing the right way for the last side. Adding one more 'draw a line' step draws the fourth side and closes the square. Turning again would only spin the robot, and rubbing out or starting over would not finish the shape.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Finding and fixing a missing step",
      "skill": "Debugging a sequence of instructions",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "algorithm",
        "debugging",
        "robot",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-005",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Each part of a computer has a job. Match each part to the job it does.",
    "instructions": "Drag each computer part to the job it does.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "s-keyboard",
          "text": "Keyboard"
        },
        {
          "id": "s-mouse",
          "text": "Mouse"
        },
        {
          "id": "s-printer",
          "text": "Printer"
        },
        {
          "id": "s-headphones",
          "text": "Headphones"
        }
      ],
      "targets": [
        {
          "id": "t-type",
          "text": "Type letters and numbers"
        },
        {
          "id": "t-pointer",
          "text": "Move the pointer around the screen"
        },
        {
          "id": "t-paper",
          "text": "Put words onto paper"
        },
        {
          "id": "t-hear",
          "text": "Let you hear sounds without others hearing"
        },
        {
          "id": "t-take-photo",
          "text": "Take a photo of the room"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "s-keyboard",
          "targetId": "t-type"
        },
        {
          "sourceId": "s-mouse",
          "targetId": "t-pointer"
        },
        {
          "sourceId": "s-printer",
          "targetId": "t-paper"
        },
        {
          "sourceId": "s-headphones",
          "targetId": "t-hear"
        }
      ]
    },
    "explanation": "Picture using each part. You press keys on a keyboard to type letters and numbers. You slide a mouse to move the pointer on the screen. A printer pushes ink onto paper to make words. Headphones let you hear sound close to your ears without others hearing. None of these parts takes a photo, so the camera job is left over.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Hardware and its uses",
      "skill": "Matching hardware to its job",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "hardware",
        "devices",
        "matching",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-006",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Being safe and kind online means making good choices. Which of these are safe or kind things to do when you are online? Select all that are correct.",
    "options": [
      {
        "id": "keep-secret",
        "text": "Keep your password secret from strangers"
      },
      {
        "id": "share-password",
        "text": "Send your password to someone you meet in a game"
      },
      {
        "id": "ask-adult",
        "text": "Ask a trusted adult before downloading a new app"
      },
      {
        "id": "kind-words",
        "text": "Use kind words when you chat in a game"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "ask-adult",
        "kind-words",
        "keep-secret"
      ]
    },
    "explanation": "Check each choice by asking if it keeps you safe or is kind to others. Asking a trusted adult before downloading an app is safe. Using kind words is kind. Keeping your password secret protects your account. But sending your password to someone in a game lets a stranger into your account, which is not safe, so that is the only choice you should not pick.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Safe and kind online behaviour",
      "skill": "Choosing safe and kind online actions",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "online safety",
        "kindness",
        "passwords",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-007",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows which app each child in a Year 3 class liked best. How many more children chose Drawing than chose Music?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-da-007-1",
        "type": "bar_chart",
        "altText": "Bar chart of favourite apps: Drawing 12, Music 7, Maths games 9, Reading 5.",
        "data": {
          "labels": [
            "Drawing",
            "Music",
            "Maths games",
            "Reading"
          ],
          "values": [
            12,
            7,
            9,
            5
          ],
          "xAxisLabel": "App",
          "yAxisLabel": "Number of children"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 5,
      "tolerance": 0
    },
    "explanation": "Read the height of two bars. The Drawing bar reaches 12 and the Music bar reaches 7. 'How many more' means take away the smaller from the larger: 12 - 7 = 5. So 5 more children chose Drawing than Music.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Reading a bar chart",
      "skill": "Comparing values on a bar chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "data",
        "bar chart",
        "comparing",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how long four apps were used on a tablet and how much battery each one used. Which app used the most battery?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-da-008-1",
        "type": "table",
        "altText": "Table of apps with minutes used and battery used: Painting 30 min 10%, Video call 15 min 35%, Reading 40 min 5%, Music 20 min 20%.",
        "data": {
          "headers": [
            "App",
            "Minutes used",
            "Battery used"
          ],
          "rows": [
            [
              "Painting",
              "30",
              "10%"
            ],
            [
              "Video call",
              "15",
              "35%"
            ],
            [
              "Reading",
              "40",
              "5%"
            ],
            [
              "Music",
              "20",
              "20%"
            ]
          ]
        }
      }
    ],
    "options": [
      {
        "id": "reading",
        "text": "Reading"
      },
      {
        "id": "painting",
        "text": "Painting"
      },
      {
        "id": "music",
        "text": "Music"
      },
      {
        "id": "video-call",
        "text": "Video call"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "video-call"
    },
    "explanation": "The question asks about battery, so look only down the 'Battery used' column, not the minutes. The values are 10%, 35%, 5% and 20%. The biggest is 35%, which belongs to the Video call. Reading was open the longest at 40 minutes but used the least battery, so being used the longest does not mean using the most battery.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Reading the right column in a table",
      "skill": "Interpreting a data table with two number columns",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "data",
        "table",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-009",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Software means the programs and instructions that tell a computer what to do, like a drawing app or a game. Someone says: 'A mouse that you hold in your hand is an example of software.' Is that statement correct?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Sort the word into hardware or software. Hardware is the parts you can touch, and software is the programs you cannot hold. A mouse is a solid part you hold and move with your hand, so it is hardware, not software. That makes the statement false.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Hardware and software",
      "skill": "Telling hardware apart from software",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "hardware",
        "software",
        "digital systems",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-010",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A climbing robot must get to the top of a staircase. One instruction tells it to keep repeating an action until a job is done. Put the instructions in the order that would get the robot safely to the top.",
    "instructions": "Drag the instructions into the correct order, from first to last.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "repeat",
          "text": "Keep repeating 'step up' until there are no stairs left"
        },
        {
          "id": "face",
          "text": "Face the bottom of the stairs"
        },
        {
          "id": "stop",
          "text": "Stop when you reach the top"
        },
        {
          "id": "step-up",
          "text": "Step up onto the next stair"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "face",
        "step-up",
        "repeat",
        "stop"
      ]
    },
    "explanation": "First the robot must face the right way, so 'face the bottom of the stairs' goes first. Then it takes its first step up. The 'keep repeating' instruction is a loop that makes it step again and again until the stairs run out, so it comes after the first step. Finally it stops at the top. The order is face, step up, repeat, stop.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Repeating steps (loops)",
      "skill": "Ordering an algorithm that uses repetition",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "algorithm",
        "loop",
        "repetition",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A cooking app lists the steps to make a cup of tea, but one step is in the wrong place. 1. Put a teabag in the cup. 2. Drink the tea. 3. Pour in hot water. 4. Let it sit for two minutes. Which step is in the wrong place?",
    "options": [
      {
        "id": "step2",
        "text": "Step 2: Drink the tea"
      },
      {
        "id": "step1",
        "text": "Step 1: Put a teabag in the cup"
      },
      {
        "id": "step3",
        "text": "Step 3: Pour in hot water"
      },
      {
        "id": "step4",
        "text": "Step 4: Let it sit for two minutes"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "step2"
    },
    "explanation": "Think about what must happen before you can do each step. You cannot drink the tea before the hot water is poured in and it has had time to sit and brew. 'Drink the tea' should be the very last step, but here it is listed as step 2, so step 2 is in the wrong place. The other steps are already in a sensible order.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Spotting a step out of order",
      "skill": "Finding the misplaced step in a sequence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "algorithm",
        "debugging",
        "sequence",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "An output is a way a computer sends information out to a person. Which of these are outputs? Select all that are correct.",
    "options": [
      {
        "id": "speaker",
        "text": "A speaker playing a song"
      },
      {
        "id": "printer",
        "text": "A printer printing a page"
      },
      {
        "id": "microphone",
        "text": "A microphone recording your voice"
      },
      {
        "id": "screen",
        "text": "A screen showing a photo"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "screen",
        "speaker",
        "printer"
      ]
    },
    "explanation": "An output sends information out so a person can see, hear or hold it. You see the photo on the screen, you hear the song from the speaker, and you hold the page from the printer, so all three are outputs. A microphone does the opposite job: it takes sound in, so it is an input and should not be chosen.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Identifying outputs",
      "skill": "Sorting devices into inputs and outputs",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "output",
        "input",
        "devices",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-013",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each online situation to the best safe or kind action to take.",
    "instructions": "Drag each situation to the best action.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "s-mean",
          "text": "A player sends you a mean message in a game"
        },
        {
          "id": "s-forgot",
          "text": "You cannot remember your password"
        },
        {
          "id": "s-popup",
          "text": "A pop-up asks you to type your full name to win a prize"
        },
        {
          "id": "s-leftout",
          "text": "Your friend feels left out of an online game"
        }
      ],
      "targets": [
        {
          "id": "t-block",
          "text": "Tell a trusted adult and block the player"
        },
        {
          "id": "t-reset",
          "text": "Ask a trusted adult to help you reset it"
        },
        {
          "id": "t-close",
          "text": "Close the pop-up and do not type your name"
        },
        {
          "id": "t-invite",
          "text": "Invite your friend to join in"
        },
        {
          "id": "t-shout",
          "text": "Type in capital letters so people listen"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "s-mean",
          "targetId": "t-block"
        },
        {
          "sourceId": "s-forgot",
          "targetId": "t-reset"
        },
        {
          "sourceId": "s-popup",
          "targetId": "t-close"
        },
        {
          "sourceId": "s-leftout",
          "targetId": "t-invite"
        }
      ]
    },
    "explanation": "Choose the action that keeps you safe or is kind. A mean message should be told to a trusted adult and the player blocked. A forgotten password is fixed by asking a trusted adult to help reset it. A pop-up asking for your name is closed without typing anything private. A friend feeling left out is helped by inviting them in. Typing in capital letters is like shouting, so it fits none of these.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Responding safely and kindly online",
      "skill": "Matching online situations to good actions",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "online safety",
        "kindness",
        "matching",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-014",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In a pictograph, a key tells you what each picture stands for. On one reading pictograph, each star stands for 2 books read. A child has 3 stars next to their name. This means the child read 6 books.",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "Use the key to work out the total. Each star is worth 2 books, and there are 3 stars, so multiply: 3 groups of 2 make 6. The child read 6 books, so the statement is true. This is why a pictograph key matters, because each picture can stand for more than one thing.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Using a pictograph key",
      "skill": "Working out a total from a pictograph key",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "data",
        "pictograph",
        "key",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how many badges each team earned at coding club. How many badges did the four teams earn altogether?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-da-015-1",
        "type": "table",
        "altText": "Table of coding club teams and badges earned: Red 4, Blue 6, Green 3, Gold 5.",
        "data": {
          "headers": [
            "Team",
            "Badges"
          ],
          "rows": [
            [
              "Red",
              "4"
            ],
            [
              "Blue",
              "6"
            ],
            [
              "Green",
              "3"
            ],
            [
              "Gold",
              "5"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 18,
      "tolerance": 0
    },
    "explanation": "'Altogether' means add every team's badges from the Badges column: 4 + 6 + 3 + 5. Add them in steps: 4 + 6 = 10, then 10 + 3 = 13, then 13 + 5 = 18. So the four teams earned 18 badges in total.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Adding data from a table",
      "skill": "Finding a total from a data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "data",
        "table",
        "adding",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-da-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A computer follows this rule for any number you give it: 'If the number is even, add 10. If the number is odd, add 1.' What number comes out when you put in the number 6?",
    "options": [
      {
        "id": "seven",
        "text": "7"
      },
      {
        "id": "sixty",
        "text": "60"
      },
      {
        "id": "sixteen",
        "text": "16"
      },
      {
        "id": "six",
        "text": "6"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sixteen"
    },
    "explanation": "First decide which rule fits. The number 6 is even, so the computer follows 'add 10'. That gives 6 + 10 = 16. The answer 7 comes from wrongly treating 6 as odd and adding 1, 60 comes from multiplying by 10 instead of adding, and 6 comes from doing nothing, so only 16 follows the rule correctly.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Following a rule with a choice",
      "skill": "Working out the output of a simple rule",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "algorithm",
        "rule",
        "logic",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dc-001",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardening robot is given an algorithm to plant a seed. An algorithm is a set of steps done in order. Put the steps in the correct order, from first to last.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Sequencing everyday steps",
      "skill": "Ordering the steps of a simple algorithm",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "algorithm",
        "sequencing",
        "ordering",
        "robot"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "dig",
          "text": "Dig a small hole in the soil"
        },
        {
          "id": "drop",
          "text": "Drop a seed into the hole"
        },
        {
          "id": "cover",
          "text": "Cover the seed with soil"
        },
        {
          "id": "water",
          "text": "Water the soil"
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "dig",
        "drop",
        "cover",
        "water"
      ]
    },
    "explanation": "Think about what must already be done before each step can work. You cannot drop a seed until there is a hole, so digging comes first. You cannot cover a seed that is not in the hole yet, and you water last so the covered seed gets a drink. The order is dig, drop the seed, cover, then water."
  },
  {
    "id": "icas-y3-digitech-dc-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "These app instructions tell a tablet how to send a drawing to a friend, but the steps are shown in this order: Step 1 Open the drawing app, Step 2 Tap 'Send', Step 3 Draw a picture, Step 4 Choose your friend's name. Which step is in the wrong place?",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Debugging a sequence",
      "skill": "Finding a step that is out of order",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "algorithm",
        "debugging",
        "sequence",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "send",
        "text": "Step 2: Tap 'Send'"
      },
      {
        "id": "open",
        "text": "Step 1: Open the drawing app"
      },
      {
        "id": "draw",
        "text": "Step 3: Draw a picture"
      },
      {
        "id": "choose",
        "text": "Step 4: Choose your friend's name"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "send"
    },
    "explanation": "Read the steps and ask which one happens too early. You cannot send a drawing before you have made one, so 'Tap Send' should come near the end, not at Step 2. Opening the app first, drawing, then choosing a friend are all in a sensible order, so the step in the wrong place is 'Tap Send'."
  },
  {
    "id": "icas-y3-digitech-dc-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which part of a computer lets you hear sounds come out of it?",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Input and output devices",
      "skill": "Identifying an output device",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "hardware",
        "output",
        "devices",
        "computer"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "keyboard",
        "text": "Keyboard"
      },
      {
        "id": "speaker",
        "text": "Speaker"
      },
      {
        "id": "mouse",
        "text": "Mouse"
      },
      {
        "id": "microphone",
        "text": "Microphone"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "speaker"
    },
    "explanation": "An output part sends information out to you. Sound comes out of a speaker, so that is the output for hearing. A keyboard and a mouse let you put information in, and a microphone takes sound in rather than sending it out, so the speaker is the answer."
  },
  {
    "id": "icas-y3-digitech-dc-004",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Each part of a computer has a job. Match each part to the job it does.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Hardware and its uses",
      "skill": "Matching hardware to its purpose",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "hardware",
        "devices",
        "matching",
        "computer"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "printer",
          "text": "Printer"
        },
        {
          "id": "webcam",
          "text": "Webcam"
        },
        {
          "id": "headphones",
          "text": "Headphones"
        },
        {
          "id": "keyboard",
          "text": "Keyboard"
        }
      ],
      "targets": [
        {
          "id": "t-print",
          "text": "Prints words and pictures onto paper"
        },
        {
          "id": "t-video",
          "text": "Takes a moving picture of you for a video call"
        },
        {
          "id": "t-hear",
          "text": "Let you hear sound without others hearing it"
        },
        {
          "id": "t-type",
          "text": "Lets you type letters and numbers"
        },
        {
          "id": "t-store",
          "text": "Keeps files safe on the internet"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "printer",
          "targetId": "t-print"
        },
        {
          "sourceId": "webcam",
          "targetId": "t-video"
        },
        {
          "sourceId": "headphones",
          "targetId": "t-hear"
        },
        {
          "sourceId": "keyboard",
          "targetId": "t-type"
        }
      ]
    },
    "explanation": "Match each part to what it actually does. A printer makes paper copies, a webcam captures a moving picture for video calls, headphones send sound only to your ears, and a keyboard is for typing. 'Keeps files on the internet' is not the job of any of these parts, so it is left over."
  },
  {
    "id": "icas-y3-digitech-dc-005",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this and decide if it is true or false: If someone you have only ever met online asks to meet you in real life, the safe thing to do is to tell a trusted adult first.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Staying safe with strangers online",
      "skill": "Responding safely to online strangers",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "online safety",
        "strangers",
        "trusted adult"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "People online are not always who they say they are, so meeting them can be unsafe. The safest choice is to talk to a trusted adult, such as a parent or teacher, before doing anything. Telling a trusted adult first is the right action, so the statement is true."
  },
  {
    "id": "icas-y3-digitech-dc-006",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which TWO of these are good ways to keep your password safe? Choose all the good ways.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Protecting passwords",
      "skill": "Keeping a password safe",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "online safety",
        "passwords",
        "privacy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "secret",
        "text": "Keep your password secret from other children"
      },
      {
        "id": "easy",
        "text": "Choose an easy password like 1234 so it is quick to type"
      },
      {
        "id": "mix",
        "text": "Use a mix of letters and numbers that only you know"
      },
      {
        "id": "tell-friend",
        "text": "Tell your best friend your password to help you remember it"
      }
    ],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "mix",
        "secret"
      ]
    },
    "explanation": "A safe password is hard for others to guess and known only to you and your family. Using a mix of letters and numbers you know, and keeping it secret, are both good. Telling a friend or picking an easy password like 1234 makes it simple for others to get in, so those are not safe."
  },
  {
    "id": "icas-y3-digitech-dc-007",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table is a pictograph. Each star stands for 2 books read. How many books did the three children read altogether?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dc-007-1",
        "type": "table",
        "altText": "Pictograph where each star means 2 books. Ava has four stars, Ben has two stars, Chloe has three stars.",
        "data": {
          "headers": [
            "Child",
            "Books read"
          ],
          "rows": [
            [
              "Ava",
              "★★★★"
            ],
            [
              "Ben",
              "★★"
            ],
            [
              "Chloe",
              "★★★"
            ]
          ]
        }
      }
    ],
    "metadata": {
      "subject": "digital_technologies",
    "strand": "Data and Information",
      "topic": "Pictographs with a key",
      "skill": "Reading totals from a pictograph key",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "pictograph",
        "data",
        "key",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "answerKey": {
      "kind": "number",
      "value": 18,
      "tolerance": 0
    },
    "explanation": "Each star is worth 2 books, so count the stars for each child and double. Ava has 4 stars (8 books), Ben has 2 stars (4 books) and Chloe has 3 stars (6 books). Add them: 8 + 4 + 6 = 18 books altogether. A common slip is to count 4 + 2 + 3 = 9 and forget that each star is worth 2."
  },
  {
    "id": "icas-y3-digitech-dc-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows four floor robots. It lists how many steps each one was told to make and how far it actually travelled. Which robot travelled the SHORTEST distance?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dc-008-1",
        "type": "table",
        "altText": "Table of robots with steps and distance: Zip 20 steps 40 cm, Bolt 15 steps 60 cm, Dash 25 steps 30 cm, Nova 10 steps 50 cm.",
        "data": {
          "headers": [
            "Robot",
            "Steps",
            "Distance"
          ],
          "rows": [
            [
              "Zip",
              "20",
              "40 cm"
            ],
            [
              "Bolt",
              "15",
              "60 cm"
            ],
            [
              "Dash",
              "25",
              "30 cm"
            ],
            [
              "Nova",
              "10",
              "50 cm"
            ]
          ]
        }
      }
    ],
    "metadata": {
      "subject": "digital_technologies",
    "strand": "Data and Information",
      "topic": "Interpreting a two-column table",
      "skill": "Reading the right column of a data table",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "table",
        "data",
        "reasoning",
        "robots"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "zip",
        "text": "Zip"
      },
      {
        "id": "bolt",
        "text": "Bolt"
      },
      {
        "id": "nova",
        "text": "Nova"
      },
      {
        "id": "dash",
        "text": "Dash"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "dash"
    },
    "explanation": "The question asks about distance, so read the Distance column, not the Steps column. The distances are 40, 60, 30 and 50 cm, and 30 cm is the smallest, which belongs to Dash. Watch out: Nova has the fewest steps, so a child who reads the wrong column might pick Nova by mistake."
  },
  {
    "id": "icas-y3-digitech-dc-009",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this and decide if it is true or false: A drawing app you open on a tablet is an example of hardware.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Hardware and software",
      "skill": "Telling hardware from software",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "hardware",
        "software",
        "digital systems"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Hardware means the parts you can touch, like the screen or the buttons. A drawing app is a set of instructions that runs on the tablet, and instructions and programs are called software. Because an app is software, not a part you can hold, the statement is false."
  },
  {
    "id": "icas-y3-digitech-dc-010",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "These are the steps to log in to a class computer, but they are mixed up. Put them in the correct order, from first to last.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Sequencing a login routine",
      "skill": "Ordering the steps to use a system",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "algorithm",
        "sequence",
        "ordering",
        "login"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "power",
          "text": "Press the power button to turn the computer on"
        },
        {
          "id": "wait",
          "text": "Wait for the screen to light up"
        },
        {
          "id": "user",
          "text": "Type in your username"
        },
        {
          "id": "pass",
          "text": "Type in your password"
        }
      ]
    },
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "power",
        "wait",
        "user",
        "pass"
      ]
    },
    "explanation": "Nothing can happen until the computer is on, so pressing power comes first, then you wait for the screen. You can only type once the screen is ready, and the login box asks for your username before your password. So the order is power, wait, username, password."
  },
  {
    "id": "icas-y3-digitech-dc-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A robot follows this rule for any number you give it: first add 3, then double the result. If you give the robot the number 2, what number comes out?",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Following a rule step by step",
      "skill": "Working out the output of a two-step rule",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "rule",
        "logic",
        "two-step",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "o10",
        "text": "10"
      },
      {
        "id": "o5",
        "text": "5"
      },
      {
        "id": "o7",
        "text": "7"
      },
      {
        "id": "o4",
        "text": "4"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "o10"
    },
    "explanation": "Do the rule in order. First add 3 to 2, which gives 5. Then double 5, which gives 10. So 10 comes out. If you stop after adding you get 5, if you double the 3 instead you get 7, and if you only double the 2 you get 4 - so read both steps and do them in order."
  },
  {
    "id": "icas-y3-digitech-dc-012",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class typed a list of animals into a computer. Which of these are sensible ways to sort the list into groups? Choose all that are sensible.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
    "strand": "Data and Information",
      "topic": "Sorting and grouping data",
      "skill": "Choosing sensible ways to sort data",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "data",
        "sorting",
        "grouping",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "fly",
        "text": "Group them by whether the animal can fly"
      },
      {
        "id": "abc",
        "text": "Put them in ABC order by the animal's name"
      },
      {
        "id": "mixup",
        "text": "Shuffle them so no group is ever the same"
      },
      {
        "id": "legs",
        "text": "Group them by how many legs each animal has"
      }
    ],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "legs",
        "fly",
        "abc"
      ]
    },
    "explanation": "Sorting means putting things into a sensible order or into groups that share something. Grouping by number of legs, by whether they can fly, or into ABC order all use a clear rule you can follow. Shuffling so no group is ever the same follows no rule at all, so it is not sorting."
  },
  {
    "id": "icas-y3-digitech-dc-013",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each computer word to the meaning that fits it best.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Key vocabulary of computers",
      "skill": "Matching digital words to their meaning",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "vocabulary",
        "input",
        "output",
        "data",
        "matching"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "input",
          "text": "Input"
        },
        {
          "id": "output",
          "text": "Output"
        },
        {
          "id": "password",
          "text": "Password"
        },
        {
          "id": "data",
          "text": "Data"
        }
      ],
      "targets": [
        {
          "id": "m-in",
          "text": "Information you put into a computer"
        },
        {
          "id": "m-out",
          "text": "Information a computer sends back out to you"
        },
        {
          "id": "m-pass",
          "text": "A secret word that keeps your account safe"
        },
        {
          "id": "m-data",
          "text": "Facts and numbers a computer stores"
        },
        {
          "id": "m-robot",
          "text": "A machine that cleans the floor by itself"
        }
      ]
    },
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "input",
          "targetId": "m-in"
        },
        {
          "sourceId": "output",
          "targetId": "m-out"
        },
        {
          "sourceId": "password",
          "targetId": "m-pass"
        },
        {
          "sourceId": "data",
          "targetId": "m-data"
        }
      ]
    },
    "explanation": "Input goes in and output comes out - those two are opposites, so match them to 'put in' and 'sends out'. A password is the secret word that protects your account, and data is the facts and numbers a computer keeps. The floor-cleaning machine matches none of these words, so it is the extra one."
  },
  {
    "id": "icas-y3-digitech-dc-014",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this and decide if it is true or false: Before you share a photo of your friend online, it is kind to ask your friend if that is okay.",
    "visuals": [],
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Kind and respectful online use",
      "skill": "Being kind and asking before sharing",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "online safety",
        "kindness",
        "consent",
        "privacy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "A photo of your friend belongs to them too, and they may not want it shared. Asking first is respectful and lets them say yes or no. Because checking with your friend before sharing is a kind and fair thing to do, the statement is true."
  },
  {
    "id": "icas-y3-digitech-dc-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many children came to coding club on each day this week. How many MORE children came on Wednesday than on Monday?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dc-015-1",
        "type": "bar_chart",
        "altText": "Bar chart of coding club numbers: Monday 6, Tuesday 9, Wednesday 11, Thursday 7.",
        "data": {
          "labels": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday"
          ],
          "values": [
            6,
            9,
            11,
            7
          ],
          "xAxisLabel": "Day",
          "yAxisLabel": "Number of children"
        }
      }
    ],
    "metadata": {
      "subject": "digital_technologies",
    "strand": "Data and Information",
      "topic": "Reading and comparing a bar chart",
      "skill": "Comparing values on a bar chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "bar chart",
        "data",
        "comparison",
        "subtraction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "answerKey": {
      "kind": "number",
      "value": 5,
      "tolerance": 0
    },
    "explanation": "Find the two bars first. Wednesday's bar reaches 11 and Monday's bar reaches 6. 'How many more' means take away the smaller from the larger: 11 - 6 = 5. So 5 more children came on Wednesday than on Monday."
  },
  {
    "id": "icas-y3-digitech-dc-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The pie chart shows the favourite lunch of a class of 24 children. Which lunch was chosen by exactly a quarter of the class?",
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dc-016-1",
        "type": "pie_chart",
        "altText": "Pie chart of favourite lunches for 24 children: Sandwich 10, Pasta 6, Salad 5, Sushi 3.",
        "data": {
          "segments": [
            {
              "label": "Sandwich",
              "value": 10
            },
            {
              "label": "Pasta",
              "value": 6
            },
            {
              "label": "Salad",
              "value": 5
            },
            {
              "label": "Sushi",
              "value": 3
            }
          ]
        }
      }
    ],
    "metadata": {
      "subject": "digital_technologies",
    "strand": "Data and Information",
      "topic": "Interpreting a pie chart",
      "skill": "Linking a fraction of a group to chart data",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "pie chart",
        "fractions",
        "quarter",
        "data"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "options": [
      {
        "id": "sandwich",
        "text": "Sandwich"
      },
      {
        "id": "salad",
        "text": "Salad"
      },
      {
        "id": "pasta",
        "text": "Pasta"
      },
      {
        "id": "sushi",
        "text": "Sushi"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "pasta"
    },
    "explanation": "A quarter of the class means one out of every four children. A quarter of 24 is 24 divided by 4, which is 6. Now look for the lunch chosen by 6 children: that is Pasta. Sandwich has the most (10) but that is not a quarter, and salad (5) and sushi (3) are not 6 either."
  },
  {
    "id": "icas-y3-digitech-dd-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class typed their favourite playground games into a spreadsheet, and the computer drew this bar chart. Which game did exactly 5 children choose?",
    "options": [
      {
        "id": "soccer",
        "text": "Soccer"
      },
      {
        "id": "tag",
        "text": "Tag"
      },
      {
        "id": "hopscotch",
        "text": "Hopscotch"
      },
      {
        "id": "skipping",
        "text": "Skipping"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dd-001-1",
        "type": "bar_chart",
        "altText": "A bar chart of favourite playground games: Tag 8, Soccer 5, Hopscotch 3, Skipping 6 children.",
        "data": {
          "labels": [
            "Tag",
            "Soccer",
            "Hopscotch",
            "Skipping"
          ],
          "values": [
            8,
            5,
            3,
            6
          ],
          "xAxisLabel": "Game",
          "yAxisLabel": "Number of children"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "soccer"
    },
    "explanation": "Find the bar that reaches the line marked 5. Tag reaches 8, Hopscotch reaches 3 and Skipping reaches 6, so only the Soccer bar stops exactly on 5.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data and Information",
      "topic": "Reading a bar chart",
      "skill": "Reading an exact value from a bar chart",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "data",
        "bar chart",
        "spreadsheet"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-002",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "These steps tell a class computer how to play a song from a music app, but they are mixed up. Put them in the order that makes sense.",
    "options": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "search-song",
          "text": "Type the name of the song into the search box"
        },
        {
          "id": "press-play",
          "text": "Press the play button"
        },
        {
          "id": "turn-on",
          "text": "Turn on the computer"
        },
        {
          "id": "open-app",
          "text": "Open the music app"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "turn-on",
        "open-app",
        "search-song",
        "press-play"
      ]
    },
    "explanation": "Think about what has to happen first. You cannot open an app until the computer is on, and you cannot search for a song until the app is open. So it goes: turn on, open the app, search for the song, then press play.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Ordering steps",
      "skill": "Putting the steps of a task in a sensible order",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "algorithm",
        "sequence",
        "steps"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya wants to take her photos from the school computer to her home computer. Which part is used to store files and move them between computers?",
    "options": [
      {
        "id": "keyboard",
        "text": "A keyboard for typing words"
      },
      {
        "id": "memory-stick",
        "text": "A memory stick to store files"
      },
      {
        "id": "speaker",
        "text": "A speaker for playing sounds"
      },
      {
        "id": "screen",
        "text": "A screen for showing pictures"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "memory-stick"
    },
    "explanation": "A memory stick keeps files saved on it, so you can plug it into one computer, copy files on, then plug it into another computer. A keyboard, speaker and screen do not save and carry files.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Storage devices",
      "skill": "Identifying a device used to store and move files",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "hardware",
        "storage",
        "memory stick"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-004",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A website you do not know asks you to type your full name and home address. Which TWO of these are the safe things to do? Choose both.",
    "options": [
      {
        "id": "keep-private",
        "text": "Keep your home address to yourself"
      },
      {
        "id": "post-chat",
        "text": "Post your address in the game chat"
      },
      {
        "id": "ask-adult",
        "text": "Ask a trusted adult before you type"
      },
      {
        "id": "type-fast",
        "text": "Type your address so the page opens"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "ask-adult",
        "keep-private"
      ]
    },
    "explanation": "Your home address is private information. The safe choices are to keep it to yourself and to check with a trusted adult first. Typing it in or posting it in a chat gives your address to people you do not know.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Protecting personal information",
      "skill": "Choosing safe actions when a site asks for personal details",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "online safety",
        "privacy",
        "personal information"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A rectangle should have sides of 6, 3, 6 and 3. Sam writes these instructions for a floor robot: (Step 1) move forward 6, (Step 2) turn right, (Step 3) move forward 3, (Step 4) turn right, (Step 5) move forward 6, (Step 6) turn right, (Step 7) move forward 4. One move is the wrong length. Which step is wrong?",
    "options": [
      {
        "id": "s1",
        "text": "Step 1"
      },
      {
        "id": "s3",
        "text": "Step 3"
      },
      {
        "id": "s5",
        "text": "Step 5"
      },
      {
        "id": "s7",
        "text": "Step 7"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "s7"
    },
    "explanation": "List the four move lengths in order: 6, 3, 6, then 4. To match a 6, 3, 6, 3 rectangle the last move should be 3, but Step 7 says 4. So Step 7 is the wrong length.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Debugging",
      "skill": "Finding the step with a mistake in a sequence",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "debugging",
        "robot",
        "sequence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows four tanks at a school aquarium. Which tank holds the most water?",
    "options": [
      {
        "id": "kelp",
        "text": "Kelp"
      },
      {
        "id": "coral",
        "text": "Coral"
      },
      {
        "id": "reef",
        "text": "Reef"
      },
      {
        "id": "bay",
        "text": "Bay"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dd-006-1",
        "type": "table",
        "altText": "A table with columns Tank, Fish and Water in litres: Coral 12 and 40, Kelp 9 and 60, Reef 15 and 30, Bay 7 and 50.",
        "data": {
          "headers": [
            "Tank",
            "Fish",
            "Water (litres)"
          ],
          "rows": [
            [
              "Coral",
              "12",
              "40"
            ],
            [
              "Kelp",
              "9",
              "60"
            ],
            [
              "Reef",
              "15",
              "30"
            ],
            [
              "Bay",
              "7",
              "50"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "kelp"
    },
    "explanation": "The question asks about water, so read only the 'Water (litres)' column: 40, 60, 30 and 50. The biggest is 60, which belongs to the Kelp tank. The Reef tank has the most fish, but that is a different column.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data and Information",
      "topic": "Reading a table",
      "skill": "Reading the correct column of a data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "data",
        "table",
        "columns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A drawing robot repeats these two steps 5 times: move forward, then turn right by the same amount each time. When it finishes it has drawn one closed shape. How many sides does the shape have?",
    "options": [
      {
        "id": "four",
        "text": "4 sides"
      },
      {
        "id": "five",
        "text": "5 sides"
      },
      {
        "id": "six",
        "text": "6 sides"
      },
      {
        "id": "eight",
        "text": "8 sides"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "five"
    },
    "explanation": "Each time the robot moves forward it draws one side, and it repeats that 5 times. So the shape has 5 sides. Repeating something a number of times in code is called a loop.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Repetition and loops",
      "skill": "Working out the result of a repeated instruction",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "loop",
        "repetition",
        "shape"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-008",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each computer part to the job it does. One job is left over and matches nothing.",
    "options": [],
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "webcam",
          "text": "Webcam"
        },
        {
          "id": "headphones",
          "text": "Headphones"
        },
        {
          "id": "memory-stick",
          "text": "Memory stick"
        }
      ],
      "targets": [
        {
          "id": "t-in",
          "text": "Puts a picture of you into the computer"
        },
        {
          "id": "t-out",
          "text": "Lets you hear sound come out"
        },
        {
          "id": "t-store",
          "text": "Keeps your files so you can save them"
        },
        {
          "id": "t-type",
          "text": "Types letters onto the screen"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "webcam",
          "targetId": "t-in"
        },
        {
          "sourceId": "headphones",
          "targetId": "t-out"
        },
        {
          "sourceId": "memory-stick",
          "targetId": "t-store"
        }
      ]
    },
    "explanation": "A webcam takes a picture of you and puts it into the computer. Headphones let sound come out so only you hear it. A memory stick keeps your files saved. Typing letters is the keyboard's job, so that one is left over.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Parts of a computer",
      "skill": "Matching hardware to the job it does",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "hardware",
        "input",
        "output"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-009",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Read this and decide if it is true or false: If a message you get online makes you feel worried or scared, it is a good idea to tell a trusted adult.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "This is true. If something online makes you feel worried or scared, a trusted adult can help you work out what to do. Keeping it to yourself does not fix the problem.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Getting help",
      "skill": "Knowing when to tell a trusted adult",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "online safety",
        "trusted adult",
        "help"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The pie chart shows the favourite drink of a class of 20 children. Half of the class chose the same drink. Which drink was it?",
    "options": [
      {
        "id": "juice",
        "text": "Juice"
      },
      {
        "id": "milk",
        "text": "Milk"
      },
      {
        "id": "water",
        "text": "Water"
      },
      {
        "id": "smoothie",
        "text": "Smoothie"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dd-010-1",
        "type": "pie_chart",
        "altText": "A pie chart of favourite drinks for 20 children: Water 10, Juice 5, Milk 3, Smoothie 2.",
        "data": {
          "segments": [
            {
              "label": "Water",
              "value": 10
            },
            {
              "label": "Juice",
              "value": 5
            },
            {
              "label": "Milk",
              "value": 3
            },
            {
              "label": "Smoothie",
              "value": 2
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "water"
    },
    "explanation": "Half of 20 is 10, so look for the drink that fills half the circle. The Water slice is the biggest and takes up half the pie, so Water is the drink 10 children chose.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data and Information",
      "topic": "Reading a pie chart",
      "skill": "Linking a fraction of a group to a pie chart slice",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "data",
        "pie chart",
        "fractions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-011",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A robot follows this rule for any number you give it: first double the number, then take away 4. You give it the number 7. What number does the robot give back?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 10,
      "tolerance": 0
    },
    "explanation": "Follow the rule in order. First double 7 to get 14, then take away 4 to get 10. Doing the steps in the wrong order would give the wrong answer, so double first, then subtract.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Following a rule",
      "skill": "Working out the output of a two-step rule",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "rule",
        "input output",
        "two step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-012",
    "type": "dropdown",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Software means the apps and programs on a computer. Hardware means the parts you can touch. Choose the correct word for each sentence.",
    "options": [],
    "interaction": {
      "type": "dropdown",
      "fields": [
        {
          "id": "f1",
          "label": "A drawing app you tap to open is an example of ___.",
          "options": [
            {
              "id": "software",
              "text": "software"
            },
            {
              "id": "hardware",
              "text": "hardware"
            }
          ]
        },
        {
          "id": "f2",
          "label": "The keyboard you press to type is an example of ___.",
          "options": [
            {
              "id": "hardware",
              "text": "hardware"
            },
            {
              "id": "software",
              "text": "software"
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
          "correctOptionId": "software"
        },
        {
          "id": "f2",
          "correctOptionId": "hardware"
        }
      ]
    },
    "explanation": "An app is a program you cannot touch, so a drawing app is software. A keyboard is a part you can hold and press, so it is hardware.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Hardware and software",
      "skill": "Telling hardware apart from software",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "hardware",
        "software",
        "computer"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-013",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Match each online situation to the best thing to do. One action is left over and matches nothing.",
    "options": [],
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "popup-prize",
          "text": "A pop-up says you won a prize and wants your home address."
        },
        {
          "id": "make-password",
          "text": "A game asks you to make a password."
        },
        {
          "id": "post-photo",
          "text": "A classmate wants to post a photo of you online."
        }
      ],
      "targets": [
        {
          "id": "t-tell-adult",
          "text": "Do not type it in, and tell a trusted adult."
        },
        {
          "id": "t-secret-mix",
          "text": "Choose a secret mix of letters and numbers."
        },
        {
          "id": "t-say-no",
          "text": "Say so if you do not want it shared."
        },
        {
          "id": "t-turn-off",
          "text": "Turn the computer off and never use it again."
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "popup-prize",
          "targetId": "t-tell-adult"
        },
        {
          "sourceId": "make-password",
          "targetId": "t-secret-mix"
        },
        {
          "sourceId": "post-photo",
          "targetId": "t-say-no"
        }
      ]
    },
    "explanation": "A pop-up asking for your address is not safe, so do not type it in and tell a trusted adult. A good password is a secret mix only you know. If someone wants to post a photo of you, it is fine to say you do not want it shared. Turning the computer off forever is not a sensible action, so it is left over.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Safe choices online",
      "skill": "Matching online situations to safe actions",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "online safety",
        "passwords",
        "privacy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A robot moved along the number line and stopped at the two points shown by dots. How far apart are the two stops?",
    "options": [
      {
        "id": "six",
        "text": "6"
      },
      {
        "id": "ten",
        "text": "10"
      },
      {
        "id": "fourteen",
        "text": "14"
      },
      {
        "id": "eight",
        "text": "8"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-dd-014-1",
        "type": "number_line",
        "altText": "A number line from 0 to 20 counting by 2, with dots on 6 and 14.",
        "data": {
          "min": 0,
          "max": 20,
          "step": 2,
          "highlightedValues": [
            6,
            14
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "eight"
    },
    "explanation": "The dots sit on 6 and 14. To find how far apart they are, take the smaller from the larger: 14 minus 6 equals 8. The numbers 6 and 14 are the positions, not the gap between them.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data and Information",
      "topic": "Reading a number line",
      "skill": "Finding the distance between two points on a number line",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "number line",
        "data",
        "distance"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which of these would make the safest password?",
    "options": [
      {
        "id": "mix",
        "text": "Letters and numbers only you know"
      },
      {
        "id": "firstname",
        "text": "Your first name written by itself"
      },
      {
        "id": "count",
        "text": "The four numbers 1 2 3 4 in a row"
      },
      {
        "id": "wordpass",
        "text": "The plain word password on its own"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "mix"
    },
    "explanation": "A safe password is hard for others to guess. Your first name, the row 1 2 3 4, and the word 'password' are all easy to guess. A secret mix of letters and numbers that only you know is much harder to guess.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Passwords",
      "skill": "Choosing a strong password",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "passwords",
        "online safety",
        "security"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-dd-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A weather robot follows this rule each morning: if it is raining, open the umbrella; if it is not raining, put on the sun hat. This morning it is sunny with no rain. What does the robot do?",
    "options": [
      {
        "id": "umbrella",
        "text": "Open the umbrella"
      },
      {
        "id": "sunhat",
        "text": "Put on the sun hat"
      },
      {
        "id": "nothing",
        "text": "Do nothing"
      },
      {
        "id": "both",
        "text": "Open the umbrella and the sun hat"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sunhat"
    },
    "explanation": "Check the weather against the rule. It is not raining, so the first part ('if it is raining') is skipped. The second part ('if it is not raining') is true, so the robot puts on the sun hat.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Decisions and conditions",
      "skill": "Following an if-then rule to choose an action",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "branching",
        "if then",
        "condition"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya is making a video call to her grandmother. Which part of the device captures Priya's voice so it can be sent to her grandmother?",
    "options": [
      {
        "id": "microphone",
        "text": "microphone"
      },
      {
        "id": "monitor",
        "text": "monitor"
      },
      {
        "id": "printer",
        "text": "printer"
      },
      {
        "id": "loudspeaker",
        "text": "loudspeaker"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "microphone"
    },
    "explanation": "A microphone is an input device: it takes sound from the world and turns it into information the computer can send. The monitor and loudspeaker are outputs that show or play things back, and a printer makes paper copies, so none of those capture Priya's voice.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Input, process, output",
      "skill": "Digital systems: input, process, output, storage devices",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "input device",
        "digital systems",
        "microphone"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam finished a photo project and wants to keep the file so he can open it again next week, even after the computer is switched off. Which part is mainly doing that job?",
    "options": [
      {
        "id": "touch-screen",
        "text": "touch screen"
      },
      {
        "id": "hard-drive",
        "text": "hard drive"
      },
      {
        "id": "loudspeaker",
        "text": "loudspeaker"
      },
      {
        "id": "web-camera",
        "text": "web camera"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "hard-drive"
    },
    "explanation": "A hard drive is a storage device, so it holds files even when the power is off. A touch screen and web camera are for putting information in, and a loudspeaker plays sound out, so none of those keep the file for next week.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Storage devices",
      "skill": "Digital systems: input, process, output, storage devices",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "storage",
        "hard drive",
        "digital systems"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-003",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "It is a safe idea to tell your best friend your account password so they can help you log in.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Passwords should stay private, even from close friends. Once someone else knows your password they could open your account without you knowing, so the safe rule is to keep it secret and ask a trusted adult if you need help.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Passwords",
      "skill": "Safe and responsible use of devices and passwords",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "passwords",
        "online safety",
        "privacy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-004",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these steps in the correct order so the algorithm for making toast works.",
    "options": [
      {
        "id": "get-bread",
        "text": "Get a slice of bread"
      },
      {
        "id": "put-bread",
        "text": "Put the bread in the toaster"
      },
      {
        "id": "push-lever",
        "text": "Push down the toaster lever"
      },
      {
        "id": "spread-butter",
        "text": "Spread butter on the finished toast"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "get-bread",
        "put-bread",
        "push-lever",
        "spread-butter"
      ]
    },
    "explanation": "An algorithm only works if the steps happen in a sensible order. You need the bread before you can put it in the toaster, the bread must be inside before you push the lever to start toasting, and you can only butter the toast once it has finished, so the order is: get bread, put it in, push the lever, then butter.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Ordering steps",
      "skill": "Follow and order the steps of a simple algorithm",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "algorithm",
        "sequencing",
        "ordering"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "get-bread",
          "text": "Get a slice of bread"
        },
        {
          "id": "put-bread",
          "text": "Put the bread in the toaster"
        },
        {
          "id": "push-lever",
          "text": "Push down the toaster lever"
        },
        {
          "id": "spread-butter",
          "text": "Spread butter on the finished toast"
        }
      ]
    }
  },
  {
    "id": "icas-y3-digitech-f1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A library computer printed this table of books returned each day. On which day were the most books returned?",
    "options": [
      {
        "id": "monday",
        "text": "Monday"
      },
      {
        "id": "wednesday",
        "text": "Wednesday"
      },
      {
        "id": "friday",
        "text": "Friday"
      },
      {
        "id": "thursday",
        "text": "Thursday"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-f1-005-1",
        "type": "table",
        "altText": "A table of books returned each day: Monday 12, Tuesday 9, Wednesday 10, Thursday 7, Friday 15.",
        "data": {
          "headers": [
            "Day",
            "Books returned"
          ],
          "rows": [
            [
              "Monday",
              "12"
            ],
            [
              "Tuesday",
              "9"
            ],
            [
              "Wednesday",
              "10"
            ],
            [
              "Thursday",
              "7"
            ],
            [
              "Friday",
              "15"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "friday"
    },
    "explanation": "To find the most, compare the numbers in the 'Books returned' column and pick the largest. Friday shows 15, which is higher than Monday's 12, Wednesday's 10 and Thursday's 7, so Friday had the most books returned.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Interpreting a table",
      "skill": "Read and interpret data in a table or pictograph a computer produced",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "table",
        "data interpretation",
        "reading data"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many children chose each playground game. Which game was chosen by exactly 5 children?",
    "options": [
      {
        "id": "tag",
        "text": "Tag"
      },
      {
        "id": "handball",
        "text": "Handball"
      },
      {
        "id": "soccer",
        "text": "Soccer"
      },
      {
        "id": "skipping",
        "text": "Skipping"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-f1-006-1",
        "type": "bar_chart",
        "altText": "A bar chart of playground game choices: Tag 8, Skipping 5, Handball 11, Soccer 7.",
        "data": {
          "labels": [
            "Tag",
            "Skipping",
            "Handball",
            "Soccer"
          ],
          "values": [
            8,
            5,
            11,
            7
          ],
          "xAxisLabel": "Game",
          "yAxisLabel": "Number of children"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "skipping"
    },
    "explanation": "Read each bar up to its height. The Skipping bar reaches 5, while Tag is 8, Handball is 11 and Soccer is 7, so Skipping is the only game chosen by exactly 5 children.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Interpreting a bar chart",
      "skill": "Read and interpret data in a table or pictograph a computer produced",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "bar chart",
        "data interpretation",
        "reading data"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A maths game has this rule: 'If your score is 10 or more, then you move up to Level 2. Otherwise you play Level 1 again.' Jess scored 8. What happens next?",
    "options": [
      {
        "id": "replay-level-1",
        "text": "She plays Level 1 again"
      },
      {
        "id": "level-2",
        "text": "She moves up to Level 2"
      },
      {
        "id": "game-closes",
        "text": "The game closes down"
      },
      {
        "id": "new-game",
        "text": "She starts a brand new game"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "replay-level-1"
    },
    "explanation": "Check the 'if' part first: is Jess's score 10 or more? Her score is 8, which is less than 10, so the 'if' is false and the 'otherwise' path runs. That path says play Level 1 again, so that is what happens.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Branching (if/then)",
      "skill": "Patterns and simple branching (if/then) in everyday instructions",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "branching",
        "if then",
        "conditions"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-008",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A keyboard is an input device because it sends information into the computer.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "An input device is one you use to put information into a computer. When you press keys, letters and numbers are sent into the computer, so a keyboard is indeed an input device.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Input devices",
      "skill": "Digital systems: input, process, output, storage devices",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "input device",
        "keyboard",
        "digital systems"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-009",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these steps in the right order so that logging in to the class computer works.",
    "options": [
      {
        "id": "turn-on",
        "text": "Turn on the computer"
      },
      {
        "id": "type-username",
        "text": "Type your username"
      },
      {
        "id": "type-password",
        "text": "Type your password"
      },
      {
        "id": "click-login",
        "text": "Click the login button"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "turn-on",
        "type-username",
        "type-password",
        "click-login"
      ]
    },
    "explanation": "The computer must be on before anything appears on the screen, so that comes first. You then type who you are (username), then your secret password, and only once both are entered can you click login to finish. Doing them in this order lets the task work correctly.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Sequencing instructions",
      "skill": "Sequencing instructions so a task works correctly",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "sequencing",
        "login",
        "ordering"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    },
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "turn-on",
          "text": "Turn on the computer"
        },
        {
          "id": "type-username",
          "text": "Type your username"
        },
        {
          "id": "type-password",
          "text": "Type your password"
        },
        {
          "id": "click-login",
          "text": "Click the login button"
        }
      ]
    }
  },
  {
    "id": "icas-y3-digitech-f1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "While Leo is playing an online game, a player he has never met asks him for his home address and the name of his school. What is the safest thing for Leo to do?",
    "options": [
      {
        "id": "school-only",
        "text": "Send only the school name"
      },
      {
        "id": "refuse-tell-adult",
        "text": "Refuse and tell an adult"
      },
      {
        "id": "give-address",
        "text": "Give the home address"
      },
      {
        "id": "ask-age",
        "text": "Ask the stranger's age"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "refuse-tell-adult"
    },
    "explanation": "Personal details like your address and school can help a stranger find you, so none of it should be shared online. The safe choice is to refuse and tell a trusted adult, who can help decide what to do. Sharing even the school name still gives away private information.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Responsible use",
      "skill": "Safe and responsible use of devices and passwords",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "online safety",
        "personal information",
        "responsible use"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-011",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class app made this table of emails the teacher sent each day. How many emails were sent on Tuesday and Thursday altogether?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-f1-011-1",
        "type": "table",
        "altText": "A table of emails sent each day: Monday 6, Tuesday 8, Wednesday 5, Thursday 9.",
        "data": {
          "headers": [
            "Day",
            "Emails sent"
          ],
          "rows": [
            [
              "Monday",
              "6"
            ],
            [
              "Tuesday",
              "8"
            ],
            [
              "Wednesday",
              "5"
            ],
            [
              "Thursday",
              "9"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 17,
      "tolerance": 0
    },
    "explanation": "Find the two days named in the question, then add their numbers. Tuesday shows 8 and Thursday shows 9, and 8 + 9 = 17, so 17 emails were sent on those two days altogether.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Interpreting a table",
      "skill": "Read and interpret data in a table or pictograph a computer produced",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "table",
        "data interpretation",
        "addition"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A drawing program repeats a colour pattern for its border: red, blue, red, blue, red, ... Which colour comes next?",
    "options": [
      {
        "id": "red",
        "text": "red"
      },
      {
        "id": "green",
        "text": "green"
      },
      {
        "id": "blue",
        "text": "blue"
      },
      {
        "id": "yellow",
        "text": "yellow"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "blue"
    },
    "explanation": "Look for the repeating unit: red then blue keeps repeating. The pattern shown ends on red, so the next colour must be blue to continue the red-blue rule. Green and yellow are not part of the pattern at all.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Repeating patterns",
      "skill": "Patterns and simple branching (if/then) in everyday instructions",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "pattern",
        "repeating",
        "prediction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-013",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Information saved on a USB flash drive stays there even after the computer is turned off.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "A USB flash drive is a storage device, and storage keeps files safely even without power. So when you turn the computer off and on again, the files you saved on the USB drive are still there.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Systems",
      "topic": "Storage devices",
      "skill": "Digital systems: input, process, output, storage devices",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "storage",
        "USB",
        "digital systems"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ben wrote these steps to make a jam sandwich: Step 1 Spread the jam. Step 2 Get two slices of bread. Step 3 Put the slices together. Something is out of order. What is the problem?",
    "options": [
      {
        "id": "step1-last",
        "text": "Step 1 should be last"
      },
      {
        "id": "step3-first",
        "text": "Step 3 should be first"
      },
      {
        "id": "already-fine",
        "text": "The order is already fine"
      },
      {
        "id": "step2-first",
        "text": "Step 2 should be first"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "step2-first"
    },
    "explanation": "Think about what has to happen before each step can work. You cannot spread jam until you have the bread, so getting the two slices (Step 2) must come first. Moving Step 2 to the start fixes the order.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Algorithms",
      "topic": "Sequencing instructions",
      "skill": "Sequencing instructions so a task works correctly",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "sequencing",
        "debugging",
        "order"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many of each animal are at the shelter. How many more dogs than cats are there?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-digitech-f1-015-1",
        "type": "bar_chart",
        "altText": "A bar chart of animals at a shelter: Dogs 14, Cats 9, Rabbits 6, Birds 4.",
        "data": {
          "labels": [
            "Dogs",
            "Cats",
            "Rabbits",
            "Birds"
          ],
          "values": [
            14,
            9,
            6,
            4
          ],
          "xAxisLabel": "Animal",
          "yAxisLabel": "Number at shelter"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 5,
      "tolerance": 0
    },
    "explanation": "To find how many more, read both bars and subtract the smaller from the larger. Dogs reach 14 and Cats reach 9, and 14 - 9 = 5, so there are 5 more dogs than cats.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Data",
      "topic": "Interpreting a bar chart",
      "skill": "Read and interpret data in a table or pictograph a computer produced",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "bar chart",
        "data interpretation",
        "subtraction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-digitech-f1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Maya wants to choose a password that is hard for someone else to guess. Which of these would be the strongest choice?",
    "options": [
      {
        "id": "tiger-mix",
        "text": "Tiger$92kite"
      },
      {
        "id": "tigertiger",
        "text": "tigertiger"
      },
      {
        "id": "numbers",
        "text": "11111111"
      },
      {
        "id": "mydog",
        "text": "mydog"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "tiger-mix"
    },
    "explanation": "A strong password is long and mixes different kinds of characters. 'Tiger$92kite' uses capitals, lowercase letters, a number and a symbol, so it is far harder to guess than a short word, a repeated word, or a run of the same digit.",
    "metadata": {
      "subject": "digital_technologies",
      "strand": "Digital Citizenship and Safety",
      "topic": "Passwords",
      "skill": "Safe and responsible use of devices and passwords",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "passwords",
        "online safety",
        "security"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
