import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 ICAS-style Numeracy — 30 hand-authored questions, independently
 * blind re-solved before ingest. Curated-bank content: authored and
 * reviewed directly rather than generated, so it carries no
 * question-factory provenance and no gate chain.
 */
export const grade3IcasNumeracy = defineQuestions([
  {
    id: "icas-y3-num-measure-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A gardener wants to write down how long her garden hose is. The hose stretches from the tap all the way to the back fence. Which unit should she use to record the length of the hose?",
    options: [
      { id: "metres", text: "metres" },
      { id: "millimetres", text: "millimetres" },
      { id: "centimetres", text: "centimetres" },
      { id: "kilometres", text: "kilometres" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "metres",
    },
    explanation: "Match the unit to the size of the thing you are measuring. A hose that reaches across a backyard is a few big steps long, and one big step is about one metre, so metres give a sensible number like 20. Millimetres and centimetres are for small things you could hold, so the hose would come out as a huge number such as 2000 cm. Kilometres are for distances you travel, like the trip to school, so a hose would be a tiny fraction of one. Metres is the only unit that gives an easy, sensible number here.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Units of length",
      skill: "Choosing a sensible metric unit for a length",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["length", "metric units", "metres", "garden"],
    },
  },
  {
    id: "icas-y3-num-measure-002",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A market stall weighed four pumpkins and put the results in the chart. What is the total mass of the two heaviest pumpkins, in kilograms?",
    instructions: "Write just the number of kilograms, without the unit.",
    visuals: [
      {
        id: "visual-icas-y3-num-measure-002",
        type: "bar_chart",
        title: "Mass of Pumpkins at the Market Stall",
        altText: "Bar chart of pumpkin masses in kilograms: Grey 7, Butternut 4, Jap 6, Golden 5.",
        data: {
          labels: ["Grey", "Butternut", "Jap", "Golden"],
          values: [7, 4, 6, 5],
          xAxisLabel: "Pumpkin",
          yAxisLabel: "Mass (kg)",
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 13,
      tolerance: 0,
      unit: "kg",
    },
    explanation: "Two jobs here: first sort, then add. Read each bar against the scale and list the masses in order from largest to smallest: 7, 6, 5, 4. The two heaviest are the Grey pumpkin at 7 kg and the Jap pumpkin at 6 kg. Now add just those two: 7 + 6 = 13. The Golden and Butternut pumpkins are not needed at all, so leave them out. The total mass is 13 kg.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Mass",
      skill: "Reading masses from a bar chart and combining them",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["mass", "kilograms", "bar chart", "market"],
    },
  },
  {
    id: "icas-y3-num-measure-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A cafe listed how much each of its containers holds. Which container holds more than 1 litre?",
    options: [
      { id: "sports-bottle", text: "the sports bottle" },
      { id: "cordial-jug", text: "the cordial jug" },
      { id: "milk-carton", text: "the milk carton" },
      { id: "soup-thermos", text: "the soup thermos" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-num-measure-003",
        type: "table",
        title: "How Much Each Container Holds",
        altText: "Table of capacities: sports bottle 800 mL, milk carton 600 mL, cordial jug 1500 mL, soup thermos 450 mL.",
        data: {
          headers: ["Container", "Capacity"],
          rows: [
            ["Sports bottle", "800 mL"],
            ["Milk carton", "600 mL"],
            ["Cordial jug", "1500 mL"],
            ["Soup thermos", "450 mL"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "cordial-jug",
    },
    explanation: "Turn the litre into millilitres so everything is in the same unit: 1 litre = 1000 mL. Now compare each number in the table with 1000. The cordial jug holds 1500 mL, and 1500 is bigger than 1000, so it holds more than 1 litre. The sports bottle (800 mL), the milk carton (600 mL) and the soup thermos (450 mL) are all smaller than 1000 mL, so each of them holds less than 1 litre. Only the jug passes the test.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Capacity",
      skill: "Comparing capacities in millilitres and litres",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["capacity", "millilitres", "litres", "table"],
    },
  },
  {
    id: "icas-y3-num-measure-004",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A netball game begins at quarter past four in the afternoon. Which digital clock shows the starting time?",
    options: [
      { id: "t-403", text: "4:03 pm" },
      { id: "t-445", text: "4:45 pm" },
      { id: "t-415", text: "4:15 pm" },
      { id: "t-315", text: "3:15 pm" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "t-415",
    },
    explanation: "Split the phrase into two parts. 'Four' tells you the hour, so the first number is 4. 'Quarter past' means one quarter of the way round the hour, and a quarter of 60 minutes is 15 minutes past, so the second number is 15. That gives 4:15 pm. 4:03 pm comes from reading the big hand pointing at the 3 as '3 minutes' instead of counting in fives. 4:45 pm is quarter TO five, not quarter past four. 3:15 pm has the right minutes but the hour before the one named.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Time",
      skill: "Matching spoken time to digital time",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["time", "digital clock", "quarter past", "sport"],
    },
  },
  {
    id: "icas-y3-num-measure-005",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A baker wrote down when each tray went into the oven and when it came out. How many minutes were the pumpkin scones in the oven?",
    instructions: "Write just the number of minutes, without the unit.",
    visuals: [
      {
        id: "visual-icas-y3-num-measure-005",
        type: "table",
        title: "Baking Times",
        altText: "Table of baking times: pumpkin scones 3:45 pm to 4:20 pm, bread rolls 2:10 pm to 3:05 pm, banana muffins 4:30 pm to 4:55 pm.",
        data: {
          headers: ["Tray", "Into the oven", "Out of the oven"],
          rows: [
            ["Pumpkin scones", "3:45 pm", "4:20 pm"],
            ["Bread rolls", "2:10 pm", "3:05 pm"],
            ["Banana muffins", "4:30 pm", "4:55 pm"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 35,
      tolerance: 0,
      unit: "minutes",
    },
    explanation: "Find the scones row first and read across it: in at 3:45 pm, out at 4:20 pm. Now do not subtract 45 from 20, because time is not counted in hundreds. Hop to the next o'clock instead. From 3:45 pm to 4:00 pm is 15 minutes. From 4:00 pm to 4:20 pm is another 20 minutes. Add the two hops: 15 + 20 = 35. The scones were in the oven for 35 minutes. The other two rows belong to different trays, so ignore them.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Elapsed time",
      skill: "Finding elapsed time by counting on to the next hour",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["elapsed time", "minutes", "cooking"],
    },
  },
  {
    id: "icas-y3-num-measure-006",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The community garden club meets on the third Wednesday of May. Use the calendar to work out the date of that meeting.",
    options: [
      { id: "d8", text: "8 May" },
      { id: "d17", text: "17 May" },
      { id: "d22", text: "22 May" },
      { id: "d15", text: "15 May" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-num-measure-006",
        type: "table",
        title: "May Calendar",
        altText: "A May calendar with columns Monday to Sunday. May begins on Wednesday the 1st and ends on Friday the 31st.",
        data: {
          headers: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          rows: [
            ["", "", "1", "2", "3", "4", "5"],
            ["6", "7", "8", "9", "10", "11", "12"],
            ["13", "14", "15", "16", "17", "18", "19"],
            ["20", "21", "22", "23", "24", "25", "26"],
            ["27", "28", "29", "30", "31", "", ""],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "d15",
    },
    explanation: "Find the Wednesday column first, then run your finger straight down it and count the dates as you go: 1 is the first Wednesday, 8 is the second, 15 is the third. So the club meets on 15 May. 8 May is only the second Wednesday, and 22 May is the fourth. 17 May sits in the Friday column, so it is a Friday, not a Wednesday at all. Counting down the column stops you slipping sideways into the wrong day.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Calendars",
      skill: "Locating a named weekday and date on a calendar",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["calendar", "months", "days of the week", "garden"],
    },
  },
  {
    id: "icas-y3-num-measure-007",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A bean plant was measured twice. The number line shows its height in April at the lower dot and its height in May at the higher dot, both in centimetres. How many centimetres did the bean plant grow between April and May?",
    instructions: "Write just the number of centimetres, without the unit.",
    visuals: [
      {
        id: "visual-icas-y3-num-measure-007",
        type: "number_line",
        title: "Height of the Bean Plant (cm)",
        altText: "Number line from 0 to 50 with ticks every 5. Point A is at 15 and point B is at 35.",
        data: {
          min: 0,
          max: 50,
          step: 5,
          highlightedValues: [15, 35],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 20,
      tolerance: 0,
      unit: "cm",
    },
    explanation: "Read each dot before you calculate. The ticks go up in fives, so the lower dot sits three ticks past 0, at 15 cm, and the higher dot sits seven ticks past 0, at 35 cm. Growth means the difference between the two, so count on from 15 to 35: that is 20 cm.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Length",
      skill: "Reading a scale and finding the difference between two points",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["number line", "length", "centimetres", "growth"],
    },
  },
  {
    id: "icas-y3-num-measure-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A vegetable patch is marked out with rope. It has four straight sides. Two of the sides are long and the other two are short, and every corner is a square corner. What shape is the vegetable patch?",
    options: [
      { id: "rectangle", text: "a rectangle" },
      { id: "square", text: "a square" },
      { id: "triangle", text: "a triangle" },
      { id: "trapezium", text: "a trapezium" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "rectangle",
    },
    explanation: "Tick off the clues one at a time. Four straight sides rules out the triangle, which has only three. Every corner being a square corner rules out the trapezium, whose sloping side makes corners that are not square. That leaves the square and the rectangle, and the clue 'two long sides and two short sides' decides between them: a square must have all four sides the same length, so it cannot be a square. A rectangle fits every clue.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "2D shapes",
      skill: "Identifying a 2D shape from its properties",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["2D shapes", "rectangle", "properties", "garden"],
    },
  },
  {
    id: "icas-y3-num-measure-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A cricket club paints capital letters on its equipment shed. Which letter has exactly one line of symmetry?",
    options: [
      { id: "letter-h", text: "H" },
      { id: "letter-a", text: "A" },
      { id: "letter-x", text: "X" },
      { id: "letter-s", text: "S" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "letter-a",
    },
    explanation: "A line of symmetry is a fold line where the two halves land exactly on top of each other. Test each letter by imagining folds. A folds down the middle from top to bottom and the two halves match, but a sideways fold does not match, so A has exactly one line. H matches on a top-to-bottom fold AND on a side-to-side fold, so it has two lines, which is too many. X matches on both of those folds as well, so it also has more than one. S matches on no fold at all; it only looks the same when you spin it around, which is turning, not folding. So A is the only letter with exactly one.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "Symmetry",
      skill: "Counting lines of symmetry in a figure",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["symmetry", "lines of symmetry", "letters", "sport"],
    },
  },
  {
    id: "icas-y3-num-measure-010",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A cheese stall packs its cheese in boxes shaped like a solid with 5 flat faces. Two of those faces are triangles and the other three are rectangles. Which solid are the boxes shaped like?",
    options: [
      { id: "cube", text: "a cube" },
      { id: "square-pyramid", text: "a square pyramid" },
      { id: "triangular-prism", text: "a triangular prism" },
      { id: "triangular-pyramid", text: "a triangular pyramid" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "triangular-prism",
    },
    explanation: "Count the faces of each solid and check their shapes. A triangular prism is a triangle at each end joined by three rectangles, which is 2 + 3 = 5 faces, exactly matching the clues. A cube has 6 faces and every one is a square, so it has no triangles at all. A square pyramid does have 5 faces, but they are 1 square and 4 triangles, so the numbers of triangles and rectangles are wrong. A triangular pyramid has only 4 faces, all triangles. Only the triangular prism has two triangles and three rectangles.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement and Geometry",
      topic: "3D objects",
      skill: "Identifying a 3D solid from the number and shape of its faces",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["3D objects", "faces", "prism", "market"],
    },
  },
  {
    id: "icas-y3-num-measure-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The chart shows the rainfall recorded at a weather station for four months. Which two months together had exactly 100 millimetres of rain?",
    options: [
      { id: "april-may", text: "April and May" },
      { id: "march-june", text: "March and June" },
      { id: "april-june", text: "April and June" },
      { id: "march-may", text: "March and May" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-num-measure-012",
        type: "bar_chart",
        title: "Rainfall at the Weather Station",
        altText: "Bar chart of rainfall in millimetres: March 40, April 25, May 60, June 35.",
        data: {
          labels: ["March", "April", "May", "June"],
          values: [40, 25, 60, 35],
          xAxisLabel: "Month",
          yAxisLabel: "Rainfall (mm)",
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "march-may",
    },
    explanation: "Read all four bars first and write the numbers down: March 40, April 25, May 60, June 35. Then test each pair by adding. March and May give 40 + 60 = 100, which is the target. April and May give 25 + 60 = 85, too little. March and June give 40 + 35 = 75. April and June give 25 + 35 = 60, the smallest pair of all. Only March and May reach exactly 100 mm.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics and Probability",
      topic: "Data interpretation",
      skill: "Combining values read from a bar chart to match a total",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["bar chart", "data", "rainfall", "weather", "addition"],
    },
  },
  {
    id: "icas-y3-num-number-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A three-digit number has 4 hundreds. Its tens digit is 3 more than its hundreds digit. Its ones digit is 0. What is the number?",
    options: [
      { id: "opt-470", text: "470" },
      { id: "opt-430", text: "430" },
      { id: "opt-740", text: "740" },
      { id: "opt-407", text: "407" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-470",
    },
    explanation: "Build the number one place at a time and write the digits down as you go. Hundreds digit: 4. Tens digit: 3 more than 4, so 4 + 3 = 7. Ones digit: 0. Reading the places in order gives 4 hundreds, 7 tens, 0 ones, which is 470. If you chose 430 you used the 3 straight from the clue instead of adding it to 4. If you chose 740 you put the digits in the wrong places. If you chose 407 you gave the 7 to the ones column, but the clue describes the tens digit.",
    metadata: {
      subject: "numeracy",
      strand: "Number and place value",
      topic: "Place value to 1000",
      skill: "Building a three-digit number from place value clues",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["place value", "three-digit numbers", "reasoning"],
    },
  },
  {
    id: "icas-y3-num-number-002",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The school library shelf held 246 books on Monday morning. During the week 175 borrowed books were returned to the shelf and none were borrowed again. How many books are on the shelf at the end of the week?",
    visuals: [],
    answerKey: {
      kind: "number",
      value: 421,
      tolerance: 0,
    },
    explanation: "Returned books go back onto the shelf, so this is an addition: 246 + 175. Add one column at a time, starting from the ones. Ones: 6 + 5 = 11, so write 1 and carry 1 ten. Tens: 4 + 7 + 1 = 12 tens, so write 2 and carry 1 hundred. Hundreds: 2 + 1 + 1 = 4. The answer is 421. The two carries are where slips happen, so check that each carried digit was written into the next column before you add it.",
    metadata: {
      subject: "numeracy",
      strand: "Number and place value",
      topic: "Addition with regrouping",
      skill: "Adding three-digit numbers with two regroupings",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["addition", "regrouping", "library"],
    },
  },
  {
    id: "icas-y3-num-number-003",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows how many people visited the community garden on three days. How many more people visited on the busiest day than on the quietest day?",
    visuals: [
      {
        id: "asset-icas-y3-num-number-003",
        type: "table",
        title: "Visitors to the community garden",
        altText: "A table showing visitors to the community garden: Monday 402, Tuesday 268, Wednesday 315.",
        data: {
          headers: ["Day", "Visitors"],
          rows: [
            ["Monday", "402"],
            ["Tuesday", "268"],
            ["Wednesday", "315"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 134,
      tolerance: 0,
    },
    explanation: "First decide which days you actually need. The busiest day is the largest number, 402 on Monday, and the quietest is the smallest, 268 on Tuesday, so Wednesday is not used at all. Now subtract: 402 - 268. There are no ones and no tens to take from, so regroup twice: 402 becomes 3 hundreds, 9 tens and 12 ones. Then 12 - 8 = 4 ones, 9 - 6 = 3 tens, 3 - 2 = 1 hundred, giving 134. Check by adding back: 268 + 134 = 402.",
    metadata: {
      subject: "numeracy",
      strand: "Number and place value",
      topic: "Subtraction with regrouping",
      skill: "Comparing table data using subtraction across a zero",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["subtraction", "regrouping", "table", "data"],
    },
  },
  {
    id: "icas-y3-num-number-004",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A fruit stall has 56 mangoes. The stallholder packs them into boxes with exactly 8 mangoes in each box, using all the mangoes. Before lunch she sells 3 of the boxes. How many boxes are left?",
    visuals: [],
    answerKey: {
      kind: "number",
      value: 4,
      tolerance: 0,
    },
    explanation: "This question has two steps, and the second one is easy to forget. Step 1: find how many boxes were packed by dividing, 56 divided by 8. Think of the times table: 8 times 7 is 56, so there are 7 boxes. Step 2: 3 boxes are sold, so take them away: 7 - 3 = 4. The answer is 4 boxes. Answering 7 means you stopped after the division; answering 53 means you subtracted from the mangoes instead of the boxes.",
    metadata: {
      subject: "numeracy",
      strand: "Number and algebra",
      topic: "Division facts in context",
      skill: "Using a division fact then subtracting in a two-step problem",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["division", "two-step", "market"],
    },
  },
  {
    id: "icas-y3-num-number-005",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A baker cools 24 muffins on a rack. One quarter of them are blueberry muffins and the rest are banana muffins. How many banana muffins are there?",
    options: [
      { id: "opt-6", text: "6" },
      { id: "opt-18", text: "18" },
      { id: "opt-12", text: "12" },
      { id: "opt-20", text: "20" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "opt-18",
    },
    explanation: "A quarter means share the group into 4 equal parts, so 24 divided by 4 = 6 blueberry muffins. The question asks for the rest, so take that part away from the whole: 24 - 6 = 18 banana muffins. Underline the words 'the rest' before you start, because 6 is the answer to a question that was not asked. 12 is a half rather than a quarter, and 20 comes from subtracting the 4 in 'quarter' instead of sharing by it.",
    metadata: {
      subject: "numeracy",
      strand: "Fractions",
      topic: "Fractions of a group",
      skill: "Finding a quarter of a group and the remaining part",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["fractions", "quarter", "cooking"],
    },
  },
  {
    id: "icas-y3-num-number-007",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Two boxes of apples have exactly the same mass. When the two boxes are weighed together with a 15 kg bag of potatoes, the total mass is 41 kg. What is the mass of one box of apples?",
    instructions: "Write just the number of kilograms, without the unit.",
    visuals: [],
    answerKey: {
      kind: "number",
      value: 13,
      tolerance: 0,
      unit: "kg",
    },
    explanation: "Peel the problem back one step at a time. Take the potatoes off the scale first: 41 - 15 = 26 kg, and that 26 kg is the two boxes together. The boxes have the same mass, so share the 26 kg equally between them: 26 divided by 2 = 13 kg. Check it forwards: 13 + 13 + 15 = 41. Halving before subtracting would give the wrong answer, so always remove the odd item first.",
    metadata: {
      subject: "numeracy",
      strand: "Number and algebra",
      topic: "Missing-number reasoning",
      skill: "Working backwards to find an unknown that appears twice",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["missing number", "working backwards", "mass"],
    },
  },
  {
    id: "icas-y3-num-number-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows the price list at the school canteen. A student has exactly $4.00 and wants to spend all of it on two different items. Which two items should the student choose?",
    options: [
      { id: "opt-sandwich-muffin", text: "a sandwich and a muffin" },
      { id: "opt-muffin-milk", text: "a muffin and a milk" },
      { id: "opt-sandwich-milk", text: "a sandwich and a milk" },
      { id: "opt-muffin-apple", text: "a muffin and an apple" },
    ],
    visuals: [
      {
        id: "asset-icas-y3-num-number-008",
        type: "table",
        title: "Canteen price list",
        altText: "A canteen price list: sandwich $2.50, muffin $2.00, milk $1.50, apple $1.00.",
        data: {
          headers: ["Item", "Price"],
          rows: [
            ["Sandwich", "$2.50"],
            ["Muffin", "$2.00"],
            ["Milk", "$1.50"],
            ["Apple", "$1.00"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "opt-sandwich-milk",
    },
    explanation: "The word 'exactly' means you must test the totals rather than guess. Add each pair from the price list: sandwich and milk is $2.50 + $1.50 = $4.00, which is exactly right because the 50c parts join to make a whole dollar. Sandwich and muffin is $4.50, which is too much. Muffin and milk is $3.50 and muffin and apple is $3.00, so both leave money unspent. Only the sandwich and milk pair uses all $4.00.",
    metadata: {
      subject: "numeracy",
      strand: "Money and financial mathematics",
      topic: "Adding amounts of money",
      skill: "Choosing items that total an exact amount of money",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["money", "table", "addition", "canteen"],
    },
  },
  {
    id: "icas-y3-num-number-009",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Four classes collected packs of stickers for a swap day, as shown in the graph. Every pack holds 5 stickers. How many more stickers did Koala class collect than Possum class?",
    visuals: [
      {
        id: "asset-icas-y3-num-number-009",
        type: "bar_chart",
        title: "Packs of stickers collected",
        altText: "A bar chart of packs collected: Emu 4, Koala 7, Possum 3, Rosella 6.",
        data: {
          labels: ["Emu", "Koala", "Possum", "Rosella"],
          values: [4, 7, 3, 6],
          xAxisLabel: "Class",
          yAxisLabel: "Packs collected",
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 20,
      tolerance: 0,
    },
    explanation: "The bars count packs, not stickers, so read the bars first and convert afterwards. Koala has 7 packs and Possum has 3 packs, a difference of 7 - 3 = 4 packs. Each pack holds 5 stickers, so the difference in stickers is 4 groups of 5, which is 4 x 5 = 20. You can also multiply first: Koala 7 x 5 = 35 and Possum 3 x 5 = 15, and 35 - 15 = 20, which is the same answer. Stopping at 4 answers the question in packs instead of stickers.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Multiplication from graph data",
      skill: "Reading a bar chart and multiplying to compare totals",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 100,
      tags: ["bar chart", "multiplication", "data", "difference"],
    },
  },
  {
    id: "icas-y3-num-number-010",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Four number cards were made for a maths game. Each card shows a number in a different way. Put the cards in order from the smallest number to the largest number.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "card-460",
          text: "460",
        },
        {
          id: "card-forty-six",
          text: "forty-six",
        },
        {
          id: "card-six-hundreds-four-tens",
          text: "6 hundreds and 4 tens",
        },
        {
          id: "card-four-hundred-and-six",
          text: "four hundred and six",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["card-forty-six", "card-four-hundred-and-six", "card-460", "card-six-hundreds-four-tens"],
    },
    explanation: "Turn every card into digits before comparing anything. 'Forty-six' is 46, 'four hundred and six' is 406 with a zero holding the empty tens place, '460' is already digits, and '6 hundreds and 4 tens' is 640. Now compare: 46 has only two digits so it is smallest. The other three all have 4, 4 and 6 hundreds, so 406 and 460 come before 640, and between those two the tens decide, since 0 tens is less than 6 tens. The order is 46, 406, 460, 640.",
    metadata: {
      subject: "numeracy",
      strand: "Number and place value",
      topic: "Ordering numbers to 1000",
      skill: "Ordering numbers written in words, digits and place-value form",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 110,
      tags: ["ordering", "place value", "number words"],
    },
  },
  {
    id: "icas-y3-num-number-011",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The graph shows how many eggs were collected from the school chicken coop each school day. Which THREE statements about the graph are true?",
    options: [
      { id: "opt-two-days-under-nine", text: "Exactly two days had fewer than 9 eggs." },
      { id: "opt-wed-most", text: "More eggs were collected on Wednesday than on any other day." },
      { id: "opt-mon-thu-equals-wed", text: "Monday and Thursday together give the same number of eggs as Wednesday." },
      { id: "opt-fifty-total", text: "Fifty eggs were collected in the whole week." },
      { id: "opt-tue-double-thu", text: "Tuesday's number of eggs is double Thursday's number." },
    ],
    visuals: [
      {
        id: "asset-icas-y3-num-number-011",
        type: "bar_chart",
        title: "Eggs collected each school day",
        altText: "A bar chart of eggs collected: Monday 12, Tuesday 8, Wednesday 15, Thursday 6, Friday 9.",
        data: {
          labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          values: [12, 8, 15, 6, 9],
          xAxisLabel: "Day",
          yAxisLabel: "Eggs collected",
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["opt-wed-most", "opt-fifty-total", "opt-two-days-under-nine"],
    },
    explanation: "Test each statement against the bars instead of judging by eye. Wednesday's bar reaches 15, higher than 12, 8, 6 and 9, so that statement is true. Monday and Thursday give 12 + 6 = 18, which is more than 15, so that one is false. The whole week is 12 + 8 + 15 + 6 + 9; pair the friendly numbers, 12 + 8 = 20 and 15 + 6 + 9 = 30, making 50, so that is true. Double Thursday's 6 is 12, not Tuesday's 8, so that is false. Fewer than 9 means 8 and 6 only, since Friday's 9 is not fewer than 9, so exactly two days qualify and that statement is true.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Interpreting a bar chart",
      skill: "Checking statements about graph data by calculating",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 150,
      tags: ["bar chart", "addition", "doubling", "comparison"],
    },
  },
  {
    id: "icas-y3-num-number-012",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A hardware shop sells pegs in packets. A sign says: '3 packets of 9 pegs give you more pegs than 4 packets of 7 pegs.' Is the sign correct?",
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: false,
    },
    explanation: "Do not compare the packet numbers on their own; work out both totals. Three packets of 9 is 3 x 9 = 27 pegs. Four packets of 7 is 4 x 7 = 28 pegs. Since 28 is greater than 27, the second choice gives more pegs, so the sign is wrong and the answer is false. It is close, only one peg apart, which is why the totals must be calculated rather than guessed from the bigger packet size.",
    metadata: {
      subject: "numeracy",
      strand: "Number and algebra",
      topic: "Multiplication facts in context",
      skill: "Comparing two multiplication totals to judge a claim",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["multiplication", "comparison", "true or false", "shop"],
    },
  },
  {
    id: "icas-y3-numeracy-c-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Ben has 24 stickers. His sister has half as many stickers as Ben. His friend has double the number the sister has. How many stickers does the friend have?",
    instructions: "Choose one answer.",
    options: [
      { id: "n12", text: "12" },
      { id: "n48", text: "48" },
      { id: "n6", text: "6" },
      { id: "n24", text: "24" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "n24",
    },
    explanation: "Do it in two steps. Half of 24 is 12, so the sister has 12. Double 12 is 24, so the friend has 24. Halving and then doubling the same amount brings you back to where you started, which is why the friend matches Ben.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Doubling and halving",
      skill: "Doubling and halving to solve problems",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["doubling", "halving", "two-step"],
    },
  },
  {
    id: "icas-y3-numeracy-c-002",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A farmer packs eggs into cartons. Each carton holds exactly 6 eggs. She has 27 eggs and fills as many cartons as she can. How many cartons end up completely full?",
    instructions: "Choose one answer.",
    options: [
      { id: "n4", text: "4" },
      { id: "n5", text: "5" },
      { id: "n3", text: "3" },
      { id: "n6", text: "6" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "n4",
    },
    explanation: "Share 27 into groups of 6: 6, 12, 18, 24 uses four cartons and 24 eggs. That leaves 3 eggs, which is not enough to fill a fifth carton. So only 4 cartons are completely full. The 3 leftover eggs are the remainder, not a full carton.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Division with remainders",
      skill: "Sharing with a remainder and interpreting what is left",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["division", "remainder", "grouping"],
    },
  },
  {
    id: "icas-y3-numeracy-c-003",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Put these three-digit numbers in order from the smallest to the largest.",
    instructions: "Drag the numbers into order, smallest first.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "n219",
          text: "219",
        },
        {
          id: "n291",
          text: "291",
        },
        {
          id: "n129",
          text: "129",
        },
        {
          id: "n192",
          text: "192",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["n129", "n192", "n219", "n291"],
    },
    explanation: "Look at the hundreds digit first: 129 and 192 both start with 1, so they are smaller than 219 and 291 which start with 2. Between 129 and 192, compare the tens: 2 tens is less than 9 tens, so 129 comes first. Between 219 and 291, 1 ten is less than 9 tens, so 219 comes before 291. The order is 129, 192, 219, 291.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Place value",
      skill: "Ordering three-digit numbers",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["ordering", "place value", "three-digit"],
    },
  },
  {
    id: "icas-y3-numeracy-c-004",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Use the price list at the school fair stall. Priya buys 2 sausages and 1 drink. How much does she spend altogether?",
    instructions: "Write just the number of dollars, without the unit.",
    visuals: [
      {
        id: "visual-icas-y3-numeracy-c-004-1",
        type: "table",
        altText: "Price list: Drink $3, Sausage $4, Cupcake $2, Popcorn $5.",
        data: {
          headers: ["Item", "Price"],
          rows: [
            ["Drink", "$3"],
            ["Sausage", "$4"],
            ["Cupcake", "$2"],
            ["Popcorn", "$5"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 11,
      tolerance: 0,
      unit: "dollars",
    },
    explanation: "This takes two steps. First the sausages: 2 sausages at $4 each is 2 x 4 = $8. Then add the drink: $8 + $3 = $11. Read the price list carefully, because the sausage is not the dearest item, so you must use its own price of $4.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Money and two-step problems",
      skill: "Two-step word problems with money",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 100,
      tags: ["money", "two-step", "table"],
    },
  },
  {
    id: "icas-y3-numeracy-c-005",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A shelf holds 76 books. Rounded to the nearest ten, about how many books is that?",
    instructions: "Choose one answer.",
    options: [
      { id: "n70", text: "70" },
      { id: "n80", text: "80" },
      { id: "n76", text: "76" },
      { id: "n100", text: "100" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "n80",
    },
    explanation: "76 sits between 70 and 80. Count the gap each way: from 76 to 70 is 6, but from 76 to 80 is only 4. Because 76 is closer to 80, it rounds up to 80 when rounding to the nearest ten.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Rounding and estimation",
      skill: "Rounding a two-digit number to the nearest ten",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["rounding", "estimation", "nearest ten"],
    },
  },
  {
    id: "icas-y3-numeracy-c-006",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The column graph shows how many shells four friends collected at the beach. How many more shells did the friend who collected the most collect than the friend who collected the least?",
    instructions: "Choose one answer.",
    options: [
      { id: "n15", text: "15" },
      { id: "n22", text: "22" },
      { id: "n8", text: "8" },
      { id: "n7", text: "7" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-numeracy-c-006-1",
        type: "bar_chart",
        altText: "Column graph of shells collected: Tom 12, Bea 7, Sam 15, Ivy 9.",
        data: {
          labels: ["Tom", "Bea", "Sam", "Ivy"],
          values: [12, 7, 15, 9],
          xAxisLabel: "Friend",
          yAxisLabel: "Shells collected",
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "n8",
    },
    explanation: "First find the most and the least from the columns: Sam has the tallest column at 15 and Bea has the shortest at 7. 'How many more' means subtract: 15 - 7 = 8. Be careful not to add them (that gives 22) or to read off just one column.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics and Probability",
      topic: "Interpreting column graphs",
      skill: "Comparing values on a column graph",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["column graph", "difference", "data"],
    },
  },
  {
    id: "icas-y3-numeracy-c-007",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows how many laps four children ran on Monday and Tuesday. Who ran the most laps altogether across the two days?",
    instructions: "Choose one answer.",
    options: [
      { id: "zoe", text: "Zoe" },
      { id: "leo", text: "Leo" },
      { id: "ava", text: "Ava" },
      { id: "kai", text: "Kai" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-numeracy-c-007-1",
        type: "table",
        altText: "Laps run. Ava: Mon 8, Tue 5. Kai: Mon 6, Tue 9. Leo: Mon 7, Tue 7. Zoe: Mon 9, Tue 4.",
        data: {
          headers: ["Child", "Monday", "Tuesday"],
          rows: [
            ["Ava", "8", "5"],
            ["Kai", "6", "9"],
            ["Leo", "7", "7"],
            ["Zoe", "9", "4"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "kai",
    },
    explanation: "You must add each child's two days, not just look at one column. Ava: 8 + 5 = 13. Kai: 6 + 9 = 15. Leo: 7 + 7 = 14. Zoe: 9 + 4 = 13. Kai has the biggest total with 15. Zoe ran the most on Monday, but her small Tuesday means she is not the overall winner.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics and Probability",
      topic: "Interpreting tables",
      skill: "Reasoning with two-way data in a table",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["table", "totals", "reasoning"],
    },
  },
  {
    id: "icas-y3-numeracy-c-008",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The number line below is marked with a tick every 5. Two dots are shown on the line. How many steps of 5 are there from the left dot to the right dot?",
    instructions: "Write your answer as a number.",
    visuals: [
      {
        id: "visual-icas-y3-numeracy-c-008-1",
        type: "number_line",
        altText: "A number line from 0 to 40 with a tick every 5. Dots are marked at 10 and 30.",
        data: {
          min: 0,
          max: 40,
          step: 5,
          highlightedValues: [10, 30],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 4,
      tolerance: 0,
    },
    explanation: "Find where each dot sits by counting ticks of 5 from 0: the left dot is on 10 and the right dot is on 30. To get from 10 to 30 you count the gaps of 5 between them: 10 to 15, 15 to 20, 20 to 25, 25 to 30. That is 4 steps. You can also work it out as 30 - 10 = 20, and 20 divided into steps of 5 is 4.",
    metadata: {
      subject: "numeracy",
      strand: "Number and Algebra",
      topic: "Number lines",
      skill: "Reading positions and steps on a number line",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 110,
      tags: ["number line", "skip counting", "steps"],
    },
  },

  ...([
  {
    "id": "icas-y3-numeracy-db-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya has three number cards: 4, 7 and 2. She uses each card once to make the largest three-digit number she can. What number does she make?",
    "options": [
      {
        "id": "opt-742",
        "text": "742"
      },
      {
        "id": "opt-274",
        "text": "274"
      },
      {
        "id": "opt-247",
        "text": "247"
      },
      {
        "id": "opt-472",
        "text": "472"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-742"
    },
    "explanation": "To make the largest number, put the biggest digit in the place worth the most. The hundreds place is worth the most, so 7 goes first. Then 4 goes in the tens place and 2 in the ones place, giving 742. Any other order, like 472 or 274, puts a smaller digit in the hundreds place, so it must be smaller.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Ordering digits by place value",
      "skill": "Arranging digits to build the largest number",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "place value",
        "number sense",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The chart shows how many stickers four children collected. Two of the children collected exactly 20 stickers when their totals are added together. Which two children are they?",
    "options": [
      {
        "id": "opt-kim-leo",
        "text": "Kim and Leo"
      },
      {
        "id": "opt-amy-ravi",
        "text": "Amy and Ravi"
      },
      {
        "id": "opt-amy-leo",
        "text": "Amy and Leo"
      },
      {
        "id": "opt-ravi-kim",
        "text": "Ravi and Kim"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-002-1",
        "type": "bar_chart",
        "altText": "A bar chart of stickers collected: Amy 8, Ravi 12, Kim 5, Leo 14.",
        "data": {
          "labels": [
            "Amy",
            "Ravi",
            "Kim",
            "Leo"
          ],
          "values": [
            8,
            12,
            5,
            14
          ],
          "xAxisLabel": "Child",
          "yAxisLabel": "Stickers collected"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-amy-ravi"
    },
    "explanation": "Read each child's total from the height of their bar: Amy 8, Ravi 12, Kim 5, Leo 14. Now test the pairs. Amy and Ravi make 8 + 12 = 20, which is what we need. Kim and Leo make 5 + 14 = 19, Amy and Leo make 8 + 14 = 22, and Ravi and Kim make 12 + 5 = 17. Only Amy and Ravi add to exactly 20.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Interpreting a bar chart",
      "skill": "Combining values read from a bar chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "bar chart",
        "data interpretation",
        "addition",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A number pattern begins 3, 7, 11, 15, and it keeps growing by the same amount each step. What is the 7th number in the pattern?",
    "options": [
      {
        "id": "opt-23",
        "text": "23"
      },
      {
        "id": "opt-31",
        "text": "31"
      },
      {
        "id": "opt-27",
        "text": "27"
      },
      {
        "id": "opt-24",
        "text": "24"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-27"
    },
    "explanation": "Each number is 4 more than the one before, because 7 minus 3 is 4, 11 minus 7 is 4, and so on. Keep adding 4: the 5th number is 15 + 4 = 19, the 6th is 19 + 4 = 23, and the 7th is 23 + 4 = 27. Stopping at 23 gives only the 6th number, so count carefully to reach the 7th.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Patterns and algebra",
      "topic": "Continuing a growing number pattern",
      "skill": "Finding a later term in an add-constant pattern",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "number pattern",
        "skip counting",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Jack measures his lead pencil. It is about 15 units long. Which unit makes sense for the length of a pencil?",
    "options": [
      {
        "id": "opt-metres",
        "text": "metres"
      },
      {
        "id": "opt-kilometres",
        "text": "kilometres"
      },
      {
        "id": "opt-millimetres",
        "text": "millimetres"
      },
      {
        "id": "opt-centimetres",
        "text": "centimetres"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-centimetres"
    },
    "explanation": "Think about how long each unit is. A centimetre is about the width of your fingernail, so 15 centimetres is roughly the length of a pencil. 15 metres would be longer than a classroom, 15 kilometres is a long drive, and 15 millimetres is only about the width of your fingernail and far too short for a whole pencil. Centimetres is the sensible unit.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Choosing sensible units of length",
      "skill": "Matching a length to an appropriate unit",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "measurement",
        "length",
        "units",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "I am a flat shape. I have 4 straight sides. All four of my corners are square corners. Two of my sides are long and two are short, so my sides are not all the same length. What shape am I?",
    "options": [
      {
        "id": "opt-rectangle",
        "text": "rectangle"
      },
      {
        "id": "opt-square",
        "text": "square"
      },
      {
        "id": "opt-triangle",
        "text": "triangle"
      },
      {
        "id": "opt-pentagon",
        "text": "pentagon"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-rectangle"
    },
    "explanation": "Check the clues one at a time. Four straight sides rules out a triangle (3 sides) and a pentagon (5 sides). Four square corners fits both a square and a rectangle. The last clue says the sides are not all equal, so it cannot be a square, whose four sides are the same length. A rectangle has square corners with two long sides and two short sides, so it fits every clue.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Identifying 2D shapes from properties",
      "skill": "Naming a shape from its sides and corners",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "geometry",
        "2D shapes",
        "properties",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The timetable shows a shuttle bus stopping at each place. The bus takes the same number of minutes to travel between one stop and the next. What time should it reach the Beach stop?",
    "options": [
      {
        "id": "opt-925",
        "text": "9:25"
      },
      {
        "id": "opt-930",
        "text": "9:30"
      },
      {
        "id": "opt-940",
        "text": "9:40"
      },
      {
        "id": "opt-935",
        "text": "9:35"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-006-1",
        "type": "table",
        "altText": "A shuttle timetable: School 9:00, Park 9:10, Library 9:20, Beach unknown.",
        "data": {
          "headers": [
            "Stop",
            "Time"
          ],
          "rows": [
            [
              "School",
              "9:00"
            ],
            [
              "Park",
              "9:10"
            ],
            [
              "Library",
              "9:20"
            ],
            [
              "Beach",
              "?"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-930"
    },
    "explanation": "Find the gap between the times you can see. From School at 9:00 to Park at 9:10 is 10 minutes, and from Park to Library is also 10 minutes. So each leg takes 10 minutes. Add 10 minutes to the Library time of 9:20 to get 9:30 at the Beach.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Reading and reasoning about time",
      "skill": "Using a constant time interval to find a later time",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "time",
        "timetable",
        "intervals",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-007",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A muffin costs 60 cents. Sam pays for one muffin with a single $2 coin. How many cents change should Sam get back?",
    "instructions": "Write just the number of cents, without the unit.",
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 140,
      "tolerance": 0,
      "unit": "cents"
    },
    "explanation": "First write both amounts in cents. A $2 coin is 200 cents. The muffin costs 60 cents. Change is what is left after paying, so work out 200 minus 60. That equals 140, so Sam should get 140 cents change.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Money and giving change",
      "skill": "Finding change by subtracting in cents",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "money",
        "subtraction",
        "cents",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Two dots are marked on the number line. How far apart are the two dots?",
    "options": [
      {
        "id": "opt-45",
        "text": "45"
      },
      {
        "id": "opt-10",
        "text": "10"
      },
      {
        "id": "opt-15",
        "text": "15"
      },
      {
        "id": "opt-20",
        "text": "20"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-008-1",
        "type": "number_line",
        "altText": "A number line from 0 to 40 with marks every 5, showing dots at 15 and 30.",
        "data": {
          "min": 0,
          "max": 40,
          "step": 5,
          "highlightedValues": [
            15,
            30
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-15"
    },
    "explanation": "The marks go up by 5 each step. The first dot sits on 15 and the second dot sits on 30. To find how far apart they are, subtract the smaller from the larger: 30 minus 15 equals 15. Adding the two positions to get 45 tells you nothing about the distance, so subtract instead.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Reading positions on a number line",
      "skill": "Finding the distance between two points on a number line",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "number line",
        "subtraction",
        "distance",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In a puzzle, each shape stands for a hidden number. A star plus a star equals 10. A star plus a circle equals 8. What number does the circle stand for?",
    "options": [
      {
        "id": "opt-5",
        "text": "5"
      },
      {
        "id": "opt-2",
        "text": "2"
      },
      {
        "id": "opt-4",
        "text": "4"
      },
      {
        "id": "opt-3",
        "text": "3"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-3"
    },
    "explanation": "Start with the first clue: a star plus a star equals 10, so two stars share 10 equally, which means one star is 5. Now use the second clue: a star plus a circle equals 8. Since the star is 5, the circle must be 8 minus 5, which is 3. Choosing 5 is the value of the star, not the circle.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Patterns and algebra",
      "topic": "Unknown values in equations",
      "skill": "Solving for an unknown using two picture equations",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "pre-algebra",
        "unknowns",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Netball training starts at 4:15 pm and lasts for 45 minutes. What time does training finish?",
    "options": [
      {
        "id": "opt-500",
        "text": "5:00 pm"
      },
      {
        "id": "opt-445",
        "text": "4:45 pm"
      },
      {
        "id": "opt-515",
        "text": "5:15 pm"
      },
      {
        "id": "opt-545",
        "text": "5:45 pm"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-500"
    },
    "explanation": "Add the 45 minutes in two steps. From 4:15 pm, adding 15 minutes reaches 4:30 pm. That leaves 30 more minutes of the 45 to add, and 4:30 pm plus 30 minutes is 5:00 pm. Adding only 30 minutes stops at 4:45 pm, so remember to use the full 45 minutes.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Elapsed time",
      "skill": "Finding a finish time after a duration",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "time",
        "elapsed time",
        "addition",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The chart shows the height of four sunflowers in centimetres. Which sunflower is exactly twice as tall as the shortest sunflower?",
    "options": [
      {
        "id": "opt-pot1",
        "text": "Pot 1"
      },
      {
        "id": "opt-pot3",
        "text": "Pot 3"
      },
      {
        "id": "opt-pot2",
        "text": "Pot 2"
      },
      {
        "id": "opt-pot4",
        "text": "Pot 4"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-011-1",
        "type": "bar_chart",
        "altText": "A bar chart of sunflower heights in cm: Pot 1 is 20, Pot 2 is 30, Pot 3 is 40, Pot 4 is 25.",
        "data": {
          "labels": [
            "Pot 1",
            "Pot 2",
            "Pot 3",
            "Pot 4"
          ],
          "values": [
            20,
            30,
            40,
            25
          ],
          "xAxisLabel": "Sunflower",
          "yAxisLabel": "Height (cm)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-pot3"
    },
    "explanation": "First find the shortest bar. Pot 1 is 20 cm, which is shorter than Pot 4 at 25 cm, Pot 2 at 30 cm and Pot 3 at 40 cm, so Pot 1 is the shortest. Twice as tall means double the height: 20 doubled is 40. The bar that reaches 40 cm is Pot 3, so Pot 3 is exactly twice as tall as the shortest sunflower.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Comparing values on a bar chart",
      "skill": "Using doubling to compare heights on a chart",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "bar chart",
        "doubling",
        "comparison",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class voted for a class pet. The pie chart shows the votes. Which pet received half of all the votes?",
    "options": [
      {
        "id": "opt-cat",
        "text": "Cat"
      },
      {
        "id": "opt-fish",
        "text": "Fish"
      },
      {
        "id": "opt-dog",
        "text": "Dog"
      },
      {
        "id": "opt-bird",
        "text": "Bird"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-012-1",
        "type": "pie_chart",
        "altText": "A pie chart of pet votes: Dog 12, Cat 6, Fish 4, Bird 2.",
        "data": {
          "segments": [
            {
              "label": "Dog",
              "value": 12
            },
            {
              "label": "Cat",
              "value": 6
            },
            {
              "label": "Fish",
              "value": 4
            },
            {
              "label": "Bird",
              "value": 2
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-dog"
    },
    "explanation": "Half of the votes means the slice that fills half the circle. Add up all the votes: 12 + 6 + 4 + 2 = 24. Half of 24 is 12. The Dog slice is worth 12 votes and takes up half the pie, so Dog received half of all the votes. Cat, with 6, is only a quarter.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Interpreting a pie chart",
      "skill": "Recognising a half share on a pie chart",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "pie chart",
        "fractions",
        "data interpretation",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the points each team scored on sports day. The Blue team shared its points equally among its 4 members. How many points did each Blue team member get?",
    "options": [
      {
        "id": "opt-4",
        "text": "4"
      },
      {
        "id": "opt-6",
        "text": "6"
      },
      {
        "id": "opt-20",
        "text": "20"
      },
      {
        "id": "opt-5",
        "text": "5"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-013-1",
        "type": "table",
        "altText": "Sports day points: Red 15, Blue 20, Green 18, Gold 12.",
        "data": {
          "headers": [
            "Team",
            "Points"
          ],
          "rows": [
            [
              "Red",
              "15"
            ],
            [
              "Blue",
              "20"
            ],
            [
              "Green",
              "18"
            ],
            [
              "Gold",
              "12"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-5"
    },
    "explanation": "First find the Blue team in the table: Blue scored 20 points. Sharing equally among 4 members means splitting 20 into 4 equal groups, which is 20 divided by 4. Since 4 times 5 is 20, each member gets 5 points. Choosing 20 forgets to share, and 4 is the number of members, not the points each.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Division and sharing from a table",
      "skill": "Reading a value from a table then dividing equally",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "table",
        "division",
        "sharing",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-014",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A rectangular vegetable garden is 6 metres long and 3 metres wide. Ravi walks all the way around the outside edge of the garden exactly once. How many metres does he walk?",
    "instructions": "Write just the number of metres, without the unit.",
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 18,
      "tolerance": 0,
      "unit": "metres"
    },
    "explanation": "Walking around the edge means going along all four sides. A rectangle has two long sides and two short sides. The two long sides are 6 + 6 = 12 metres and the two short sides are 3 + 3 = 6 metres. Add them: 12 + 6 = 18 metres. So Ravi walks 18 metres.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Perimeter of a rectangle",
      "skill": "Finding the distance around a rectangle",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "perimeter",
        "measurement",
        "rectangle",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A toy robot is facing north. It makes a quarter turn to the right, and then makes another quarter turn to the right. Which direction is the robot facing now?",
    "options": [
      {
        "id": "opt-south",
        "text": "south"
      },
      {
        "id": "opt-north",
        "text": "north"
      },
      {
        "id": "opt-east",
        "text": "east"
      },
      {
        "id": "opt-west",
        "text": "west"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-south"
    },
    "explanation": "A quarter turn to the right moves you clockwise to the next direction. Starting at north, one quarter turn to the right faces east. A second quarter turn to the right from east faces south. Two quarter turns together make a half turn, and a half turn from north always ends facing the opposite direction, which is south.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Direction and turns",
      "skill": "Working out a new direction after turns",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "direction",
        "turns",
        "space",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-db-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The line graph shows the height of a bean plant measured at the end of each week. Between which two weeks did the plant grow the most?",
    "options": [
      {
        "id": "opt-w1-w2",
        "text": "Week 1 and Week 2"
      },
      {
        "id": "opt-w2-w3",
        "text": "Week 2 and Week 3"
      },
      {
        "id": "opt-w3-w4",
        "text": "Week 3 and Week 4"
      },
      {
        "id": "opt-w4-w5",
        "text": "Week 4 and Week 5"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-db-016-1",
        "type": "line_graph",
        "altText": "A line graph of bean plant height: Week 1 is 4 cm, Week 2 is 6 cm, Week 3 is 11 cm, Week 4 is 13 cm, Week 5 is 16 cm.",
        "data": {
          "points": [
            {
              "x": 1,
              "y": 4,
              "label": "Week 1"
            },
            {
              "x": 2,
              "y": 6,
              "label": "Week 2"
            },
            {
              "x": 3,
              "y": 11,
              "label": "Week 3"
            },
            {
              "x": 4,
              "y": 13,
              "label": "Week 4"
            },
            {
              "x": 5,
              "y": 16,
              "label": "Week 5"
            }
          ],
          "xAxisLabel": "Week",
          "yAxisLabel": "Height (cm)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-w2-w3"
    },
    "explanation": "The plant grew the most where the line rises most steeply. Work out each week's growth: Week 1 to Week 2 is 6 minus 4 = 2 cm, Week 2 to Week 3 is 11 minus 6 = 5 cm, Week 3 to Week 4 is 13 minus 11 = 2 cm, and Week 4 to Week 5 is 16 minus 13 = 3 cm. The biggest jump is 5 cm, between Week 2 and Week 3.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Interpreting a line graph",
      "skill": "Finding the largest change on a line graph",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "line graph",
        "change",
        "data interpretation",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which number is the same as 300 + 40 + 6?",
    "options": [
      {
        "id": "opt-346",
        "text": "346"
      },
      {
        "id": "opt-3406",
        "text": "3406"
      },
      {
        "id": "opt-340",
        "text": "340"
      },
      {
        "id": "opt-364",
        "text": "364"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-346"
    },
    "explanation": "Line the parts up by place value. The 300 fills the hundreds place, the 40 fills the tens place and the 6 fills the ones place, giving 346. Writing 3406 just puts the digits in a row without joining the tens and ones, and 364 swaps the tens and ones around. Read each part into its own column and the number is 346.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Expanded form of a number",
      "skill": "Matching expanded form to a standard number",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "place value",
        "expanded form",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A netball club has 73 members. Rounded to the nearest 10, about how many members is that?",
    "options": [
      {
        "id": "opt-60",
        "text": "60"
      },
      {
        "id": "opt-70",
        "text": "70"
      },
      {
        "id": "opt-80",
        "text": "80"
      },
      {
        "id": "opt-73",
        "text": "73"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-70"
    },
    "explanation": "Rounding to the nearest 10 means choosing the closer ten. The number 73 sits between 70 and 80. It is only 3 away from 70 but 7 away from 80, so 70 is closer. That makes 70 the answer. Choosing 73 forgets to round at all, and 80 rounds the wrong way.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Rounding to the nearest ten",
      "skill": "Rounding a two-digit number to the nearest ten",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "rounding",
        "estimation",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A ribbon 36 cm long is cut into 4 equal pieces. How long is each piece?",
    "options": [
      {
        "id": "opt-12",
        "text": "12 cm"
      },
      {
        "id": "opt-18",
        "text": "18 cm"
      },
      {
        "id": "opt-9",
        "text": "9 cm"
      },
      {
        "id": "opt-32",
        "text": "32 cm"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-9"
    },
    "explanation": "Cutting into 4 equal pieces means sharing the 36 cm into 4 equal lengths, which is 36 divided by 4. Since 4 times 9 is 36, each piece is 9 cm. Dividing by 3 by mistake gives 12, halving gives 18, and taking 4 away from 36 gives 32. The correct step is to divide by the number of pieces.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Division as equal sharing",
      "skill": "Dividing a length into equal parts",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "division",
        "length",
        "sharing",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The dot on the number line shows where a frog starts. The frog makes 4 equal jumps, and each jump is 5 along the line. What number does the frog land on?",
    "options": [
      {
        "id": "opt-25",
        "text": "25"
      },
      {
        "id": "opt-35",
        "text": "35"
      },
      {
        "id": "opt-20",
        "text": "20"
      },
      {
        "id": "opt-30",
        "text": "30"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-004-1",
        "type": "number_line",
        "altText": "A number line from 0 to 40 with marks every 5, with one dot on the mark at 10.",
        "data": {
          "min": 0,
          "max": 40,
          "step": 5,
          "highlightedValues": [
            10
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-30"
    },
    "explanation": "The dot sits on 10, and each mark on the line is 5 apart. Counting on 4 jumps of 5 means adding 5 four times: 10, 15, 20, 25, 30. After the fourth jump the frog is on 30. Landing on 25 is only 3 jumps, and 35 is 5 jumps, so count exactly four jumps.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Skip counting on a number line",
      "skill": "Counting on in equal steps from a marked point",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "number line",
        "skip counting",
        "addition",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A number pattern starts 45, 40, 35, 30, and it keeps going down by the same amount each time. What is the sixth number in the pattern?",
    "options": [
      {
        "id": "opt-20",
        "text": "20"
      },
      {
        "id": "opt-30",
        "text": "30"
      },
      {
        "id": "opt-25",
        "text": "25"
      },
      {
        "id": "opt-15",
        "text": "15"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-20"
    },
    "explanation": "Each number is 5 less than the one before, because 45 minus 40 is 5, and 40 minus 35 is 5. Keep taking away 5: the fifth number is 30 minus 5 = 25, and the sixth number is 25 minus 5 = 20. Stopping at 25 gives only the fifth number, so count on to the sixth.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Patterns and algebra",
      "topic": "Continuing a shrinking number pattern",
      "skill": "Finding a later term in a subtract-constant pattern",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "number pattern",
        "counting back",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A number machine changes every number using the same secret rule. The table shows some numbers going in and coming out. What number comes out when 6 goes in?",
    "options": [
      {
        "id": "opt-12",
        "text": "12"
      },
      {
        "id": "opt-18",
        "text": "18"
      },
      {
        "id": "opt-15",
        "text": "15"
      },
      {
        "id": "opt-9",
        "text": "9"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-006-1",
        "type": "table",
        "altText": "A number machine table: 2 goes in and 6 comes out, 3 in gives 9 out, 4 in gives 12 out, 6 in gives an unknown out.",
        "data": {
          "headers": [
            "In",
            "Out"
          ],
          "rows": [
            [
              "2",
              "6"
            ],
            [
              "3",
              "9"
            ],
            [
              "4",
              "12"
            ],
            [
              "6",
              "?"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-18"
    },
    "explanation": "Find the rule that works for every row. 2 becomes 6, 3 becomes 9 and 4 becomes 12. Each output is the input times 3, because 2 by 3 is 6, 3 by 3 is 9 and 4 by 3 is 12. So 6 going in gives 6 times 3, which is 18. Adding 3 instead would give 9, but that does not fit the other rows.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Patterns and algebra",
      "topic": "Finding a rule from a table",
      "skill": "Applying a discovered multiplication rule",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "function machine",
        "multiplication",
        "rule",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A long row of fruit stickers repeats in the order apple, pear, cherry, plum, apple, pear, cherry, plum, and so on. Which fruit is in the 15th place?",
    "options": [
      {
        "id": "opt-apple",
        "text": "apple"
      },
      {
        "id": "opt-pear",
        "text": "pear"
      },
      {
        "id": "opt-cherry",
        "text": "cherry"
      },
      {
        "id": "opt-plum",
        "text": "plum"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-cherry"
    },
    "explanation": "The pattern repeats in groups of 4: apple, pear, cherry, plum. Every 4th sticker is a plum, so places 4, 8 and 12 are all plums. Counting on from 12: the 13th is apple, the 14th is pear and the 15th is cherry. So the 15th sticker is cherry.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Patterns and algebra",
      "topic": "Position in a repeating pattern",
      "skill": "Finding a term in a repeating pattern using groups",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "repeating pattern",
        "position",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A drink cooler holds 6 litres of cordial. All of it is poured into small bottles that each hold 500 millilitres. How many bottles can be filled?",
    "instructions": "Write just the number of bottles, without the unit.",
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 12,
      "tolerance": 0,
      "unit": "bottles"
    },
    "explanation": "First change litres to millilitres so both amounts use the same unit. 1 litre is 1000 millilitres, so 6 litres is 6000 millilitres. Each bottle holds 500 millilitres, so work out how many 500s fit into 6000. Since 500 times 12 is 6000, exactly 12 bottles can be filled.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Capacity and unit conversion",
      "skill": "Dividing a capacity after converting litres to millilitres",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "capacity",
        "litres",
        "division",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Grandma's birthday is on Friday the 8th. The family party will be held exactly one week later. What day and date will the party be?",
    "options": [
      {
        "id": "opt-sat15",
        "text": "Saturday the 15th"
      },
      {
        "id": "opt-fri14",
        "text": "Friday the 14th"
      },
      {
        "id": "opt-fri16",
        "text": "Friday the 16th"
      },
      {
        "id": "opt-fri15",
        "text": "Friday the 15th"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-fri15"
    },
    "explanation": "One week is 7 days. Because a week later lands on the same weekday, the party is still on a Friday. To find the date, add 7 to the 8th: 8 + 7 = 15. So the party is on Friday the 15th. Friday the 14th adds only 6 days, and Saturday the 15th changes the weekday by mistake.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Calendar and days of the week",
      "skill": "Adding one week to a day and date",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "calendar",
        "time",
        "days",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Two dots are marked on the number line. Which number is exactly halfway between the two dots?",
    "options": [
      {
        "id": "opt-30",
        "text": "30"
      },
      {
        "id": "opt-20",
        "text": "20"
      },
      {
        "id": "opt-40",
        "text": "40"
      },
      {
        "id": "opt-25",
        "text": "25"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-010-1",
        "type": "number_line",
        "altText": "A number line from 0 to 60 with marks every 10, with dots on the marks at 10 and 50.",
        "data": {
          "min": 0,
          "max": 60,
          "step": 10,
          "highlightedValues": [
            10,
            50
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-30"
    },
    "explanation": "The dots sit on 10 and 50. Halfway means the same distance from each dot. From 10 to 50 is 40, and half of 40 is 20, so step 20 in from either dot: 10 + 20 = 30, and 50 - 20 = 30. Both ways give 30, which is the number exactly in the middle.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and place value",
      "topic": "Midpoint on a number line",
      "skill": "Finding the number halfway between two points",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "number line",
        "midpoint",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which of these shapes has exactly one line of symmetry?",
    "options": [
      {
        "id": "opt-rectangle",
        "text": "rectangle"
      },
      {
        "id": "opt-kite",
        "text": "kite"
      },
      {
        "id": "opt-parallelogram",
        "text": "parallelogram"
      },
      {
        "id": "opt-scalene",
        "text": "scalene triangle"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-kite"
    },
    "explanation": "A line of symmetry folds a shape so both halves match exactly. A kite folds along the line through its point, matching the two halves, and that is its only such line, so it has exactly one. A rectangle has two lines of symmetry, while a parallelogram and a scalene triangle have none. Only the kite has exactly one.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Symmetry of 2D shapes",
      "skill": "Counting lines of symmetry of a shape",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "symmetry",
        "2D shapes",
        "geometry",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A solid shape has 6 faces, and every face is a square of the same size. What is the solid?",
    "options": [
      {
        "id": "opt-rect-prism",
        "text": "rectangular prism"
      },
      {
        "id": "opt-sq-pyramid",
        "text": "square pyramid"
      },
      {
        "id": "opt-cube",
        "text": "cube"
      },
      {
        "id": "opt-cylinder",
        "text": "cylinder"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-cube"
    },
    "explanation": "Check the clues against each solid. A cube has 6 faces and every face is an equal square, so it fits both clues. A rectangular prism has 6 faces but they are not all equal squares, a square pyramid has only 5 faces, and a cylinder has curved surfaces and no square faces. Only the cube matches.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and geometry",
      "topic": "Properties of 3D objects",
      "skill": "Identifying a solid from its faces",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "3D objects",
        "faces",
        "geometry",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many books four children read last month. How many more books did the child who read the most read than the child who read the fewest?",
    "options": [
      {
        "id": "opt-12",
        "text": "12"
      },
      {
        "id": "opt-20",
        "text": "20"
      },
      {
        "id": "opt-32",
        "text": "32"
      },
      {
        "id": "opt-8",
        "text": "8"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-013-1",
        "type": "bar_chart",
        "altText": "A bar chart of books read: Ben 12, Sam 18, Tara 20, Zoe 15.",
        "data": {
          "labels": [
            "Ben",
            "Sam",
            "Tara",
            "Zoe"
          ],
          "values": [
            12,
            18,
            20,
            15
          ],
          "xAxisLabel": "Child",
          "yAxisLabel": "Books read"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-8"
    },
    "explanation": "Read each bar: Ben 12, Sam 18, Tara 20 and Zoe 15. Tara read the most with 20 and Ben read the fewest with 12. 'How many more' means find the difference, so subtract: 20 minus 12 equals 8. Adding the two bars gives 32, and 12 or 20 are the counts themselves, not the difference.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Comparing values on a bar chart",
      "skill": "Finding the difference between the largest and smallest bar",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "bar chart",
        "difference",
        "data interpretation",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the price of each snack at a school stall and how many are left. Lena wants the cheapest snack that still has more than 5 left. Which snack should she buy?",
    "options": [
      {
        "id": "opt-muffin",
        "text": "Muffin"
      },
      {
        "id": "opt-bun",
        "text": "Bun"
      },
      {
        "id": "opt-scone",
        "text": "Scone"
      },
      {
        "id": "opt-slice",
        "text": "Slice"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-014-1",
        "type": "table",
        "altText": "Snack stall table: Muffin $3 with 8 left, Bun $2 with 4 left, Scone $4 with 9 left, Slice $5 with 6 left.",
        "data": {
          "headers": [
            "Snack",
            "Price",
            "Number left"
          ],
          "rows": [
            [
              "Muffin",
              "$3",
              "8"
            ],
            [
              "Bun",
              "$2",
              "4"
            ],
            [
              "Scone",
              "$4",
              "9"
            ],
            [
              "Slice",
              "$5",
              "6"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-muffin"
    },
    "explanation": "Use the rule 'more than 5 left' first. The Bun has only 4 left, so it is out, even though it is the cheapest. That leaves the Muffin (8 left), the Scone (9 left) and the Slice (6 left). Among these, compare prices: Muffin $3, Scone $4, Slice $5. The Muffin is the cheapest, so Lena should buy the Muffin.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Reading a table with two conditions",
      "skill": "Choosing an item that meets a condition then comparing price",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 105,
      "tags": [
        "table",
        "conditions",
        "money",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The pie chart shows the favourite sport of every child in a class. Which sport was chosen by more than half of the class?",
    "options": [
      {
        "id": "opt-cricket",
        "text": "Cricket"
      },
      {
        "id": "opt-basketball",
        "text": "Basketball"
      },
      {
        "id": "opt-swimming",
        "text": "Swimming"
      },
      {
        "id": "opt-tennis",
        "text": "Tennis"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-015-1",
        "type": "pie_chart",
        "altText": "A pie chart of favourite sports: Basketball 16, Cricket 6, Swimming 5, Tennis 3.",
        "data": {
          "segments": [
            {
              "label": "Basketball",
              "value": 16
            },
            {
              "label": "Cricket",
              "value": 6
            },
            {
              "label": "Swimming",
              "value": 5
            },
            {
              "label": "Tennis",
              "value": 3
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-basketball"
    },
    "explanation": "Add up all the choices to find the whole class: 16 + 6 + 5 + 3 = 30 children. Half of 30 is 15, so 'more than half' means more than 15. Basketball has 16, which is more than 15 and fills more than half the circle. Cricket, Swimming and Tennis each have fewer than 15, so only Basketball is chosen by more than half.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Interpreting a pie chart",
      "skill": "Deciding which share is more than half",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "pie chart",
        "fractions",
        "data interpretation",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-dc-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The line graph shows the midday temperature each day from Monday to Friday. Between which two days did the temperature stay the same?",
    "options": [
      {
        "id": "opt-mon-tue",
        "text": "Monday and Tuesday"
      },
      {
        "id": "opt-thu-fri",
        "text": "Thursday and Friday"
      },
      {
        "id": "opt-tue-wed",
        "text": "Tuesday and Wednesday"
      },
      {
        "id": "opt-mon-fri",
        "text": "Monday and Friday"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-dc-016-1",
        "type": "line_graph",
        "altText": "A line graph of midday temperature: Monday 18, Tuesday 22, Wednesday 22, Thursday 19, Friday 24 degrees.",
        "data": {
          "points": [
            {
              "x": 1,
              "y": 18,
              "label": "Mon"
            },
            {
              "x": 2,
              "y": 22,
              "label": "Tue"
            },
            {
              "x": 3,
              "y": 22,
              "label": "Wed"
            },
            {
              "x": 4,
              "y": 19,
              "label": "Thu"
            },
            {
              "x": 5,
              "y": 24,
              "label": "Fri"
            }
          ],
          "xAxisLabel": "Day",
          "yAxisLabel": "Temperature (degrees C)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-tue-wed"
    },
    "explanation": "The temperature stays the same where the line is flat between two days. Tuesday is 22 and Wednesday is also 22, so the line is level and the temperature did not change. Monday to Tuesday rises from 18 to 22, Thursday to Friday rises from 19 to 24, and Monday and Friday are 18 and 24, which are different. Only Tuesday and Wednesday stayed the same.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and probability",
      "topic": "Interpreting a line graph",
      "skill": "Spotting where a line graph stays level",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "line graph",
        "no change",
        "data interpretation",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-001",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A market stall has 4 bags of oranges on the shelf. Each bag holds 6 oranges. A shopper buys 7 loose oranges from the bags. How many oranges are left on the shelf?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 17,
      "tolerance": 0
    },
    "explanation": "First find the total: 4 bags of 6 is 4 x 6 = 24 oranges. Then take away the 7 that were bought: 24 - 7 = 17. You must multiply before you subtract because the shopper takes from the whole shelf.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Multiplication and subtraction",
      "skill": "Multi-step word problem with two operations",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "multi-step",
        "market",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Maya is baking muffins. She puts 5 blueberries in each muffin and bakes 6 muffins. She started with 40 blueberries. How many blueberries does she have left?",
    "options": [
      {
        "id": "n-34",
        "text": "34"
      },
      {
        "id": "n-24",
        "text": "24"
      },
      {
        "id": "n-30",
        "text": "30"
      },
      {
        "id": "n-10",
        "text": "10"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "n-10"
    },
    "explanation": "Work out how many she used: 5 blueberries x 6 muffins = 30. Then subtract from the start: 40 - 30 = 10 left. Choosing 30 forgets to subtract, and 34 comes from taking away only the 6 muffins instead of the 30 blueberries.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Multiplication and subtraction",
      "skill": "Multi-step word problem with two operations",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "multi-step",
        "cooking",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener plants flowers in rows. The first four rows have 4, 7, 10 and 13 flowers. If the pattern keeps going, how many flowers will be in the next row?",
    "options": [
      {
        "id": "n-16",
        "text": "16"
      },
      {
        "id": "n-15",
        "text": "15"
      },
      {
        "id": "n-17",
        "text": "17"
      },
      {
        "id": "n-14",
        "text": "14"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "n-16"
    },
    "explanation": "Look at the jump between rows: 4 to 7, 7 to 10, 10 to 13 all go up by 3. Add 3 to the last row: 13 + 3 = 16. The answer 14 comes from adding only 1, and 15 from losing track of the constant step of 3.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Number patterns",
      "skill": "Continue a growing number sequence",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "patterns",
        "garden",
        "sequence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-004",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A pondweed doubles in size every hour. At 1pm it covers 3 tiles, at 2pm it covers 6 tiles, and at 3pm it covers 12 tiles. How many tiles will it cover at 5pm?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 48,
      "tolerance": 0
    },
    "explanation": "The size doubles each hour, so keep multiplying by 2: 3pm is 12, 4pm is 12 x 2 = 24, and 5pm is 24 x 2 = 48. Doubling grows much faster than adding the same amount each time.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Doubling patterns",
      "skill": "Reason about a doubling sequence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "patterns",
        "nature",
        "doubling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-005",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how much rain fell in four towns last week. How many more millimetres of rain fell in the wettest town than in the driest town?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e1-005-1",
        "type": "table",
        "altText": "A table of last week's rainfall: Yarra 40 mm, Bendigo 25 mm, Colac 55 mm, Horsham 30 mm.",
        "data": {
          "headers": [
            "Town",
            "Rain (mm)"
          ],
          "rows": [
            [
              "Yarra",
              "40"
            ],
            [
              "Bendigo",
              "25"
            ],
            [
              "Colac",
              "55"
            ],
            [
              "Horsham",
              "30"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 30,
      "tolerance": 0,
      "instructions": "Write just the number of millimetres, without the unit."
    },
    "explanation": "Find the largest and smallest values in the Rain column: the wettest is Colac with 55 mm and the driest is Bendigo with 25 mm. Subtract: 55 - 25 = 30. You compare the two extreme rows, not any two rows that catch your eye.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Interpreting tables",
      "skill": "Draw a conclusion from a data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "data",
        "table",
        "weather"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-006",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many books four children read this month. How many more books did Cara read than Ben?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e1-006-1",
        "type": "bar_chart",
        "altText": "A bar chart of books read: Ava 8, Ben 5, Cara 11, Dan 6.",
        "data": {
          "labels": [
            "Ava",
            "Ben",
            "Cara",
            "Dan"
          ],
          "values": [
            8,
            5,
            11,
            6
          ],
          "xAxisLabel": "Child",
          "yAxisLabel": "Books read"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 6,
      "tolerance": 0
    },
    "explanation": "Read Cara's bar (11) and Ben's bar (5), then subtract to compare: 11 - 5 = 6. 'How many more' means find the difference between the two bars, not add them together.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Interpreting bar charts",
      "skill": "Compare quantities from a bar chart",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "data",
        "bar chart",
        "reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-007",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A square can be folded so that one half lands exactly on the other half in 4 different ways. This means a square has 4 lines of symmetry. Is this statement true?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "A square folds evenly down its two diagonals and across its two middle lines (top-to-bottom and side-to-side), giving 4 folds where the halves match. Each matching fold is a line of symmetry, so 4 is correct.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Space",
      "topic": "Symmetry",
      "skill": "Reason about lines of symmetry described in words",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "symmetry",
        "shapes",
        "spatial"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A flat shape is made of 6 identical squares arranged in a plus (cross) shape. If you fold the squares up along their edges, which solid will they make?",
    "options": [
      {
        "id": "pyramid",
        "text": "pyramid"
      },
      {
        "id": "cube",
        "text": "cube"
      },
      {
        "id": "cylinder",
        "text": "cylinder"
      },
      {
        "id": "rectangular-prism",
        "text": "rectangular prism"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cube"
    },
    "explanation": "Six equal squares that fold together make a solid with six equal square faces, which is a cube. A pyramid has triangle faces, a cylinder has a curved surface, and a rectangular prism needs faces that are not all equal squares.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Space",
      "topic": "Nets and solids",
      "skill": "Predict the solid formed by folding a net",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "nets",
        "folding",
        "spatial"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-009",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Liam thinks of a number. He doubles it and then adds 4. His answer is 20. What number did Liam start with?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 8,
      "tolerance": 0
    },
    "explanation": "Work backwards by undoing each step in reverse. Undo the '+4' first: 20 - 4 = 16. Then undo the 'double' by halving: 16 / 2 = 8. So Liam started with 8.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Inverse operations",
      "skill": "Work backwards from a result to find a start number",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "work backwards",
        "reasoning",
        "number"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bus leaves the depot with some passengers. At the first stop 6 people get off. At the second stop 4 people get on. Now there are 22 passengers on the bus. How many passengers were on the bus when it left the depot?",
    "options": [
      {
        "id": "n-20",
        "text": "20"
      },
      {
        "id": "n-32",
        "text": "32"
      },
      {
        "id": "n-24",
        "text": "24"
      },
      {
        "id": "n-12",
        "text": "12"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "n-24"
    },
    "explanation": "Reverse the trip from the end. Undo the 4 who got on: 22 - 4 = 18. Then undo the 6 who got off by putting them back: 18 + 6 = 24. Doing the operations forwards instead of reversing gives the wrong totals like 20 or 32.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Inverse operations",
      "skill": "Work backwards through two changes",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "work backwards",
        "transport",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the school fair, the red team scored 34 points and the blue team scored 58 points. How many more points does the red team need to reach the same score as the blue team?",
    "options": [
      {
        "id": "n-26",
        "text": "26"
      },
      {
        "id": "n-22",
        "text": "22"
      },
      {
        "id": "n-92",
        "text": "92"
      },
      {
        "id": "n-24",
        "text": "24"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "n-24"
    },
    "explanation": "'How many more to catch up' is the difference between the scores: 58 - 34 = 24. Adding the scores gives 92, which is the total, not the gap; 26 and 22 come from small subtraction slips.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Comparing quantities",
      "skill": "Reason about how many more are needed",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "compare",
        "fair",
        "difference"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-012",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The number line shows two marked points. What is the difference between the two marked numbers?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e1-012-1",
        "type": "number_line",
        "altText": "A number line from 0 to 40 with ticks every 5, showing marked dots at 15 and 35.",
        "data": {
          "min": 0,
          "max": 40,
          "step": 5,
          "highlightedValues": [
            15,
            35
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 20,
      "tolerance": 0
    },
    "explanation": "Read each dot against the ticks: they sit at 15 and 35. The difference is how far apart they are: 35 - 15 = 20. You can also count on in fives from 15 to 35, which is 4 jumps of 5, giving 20.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Number lines",
      "skill": "Read values on a number line and find a difference",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "number line",
        "difference",
        "reading"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Three friends stand in a queue at the library. Tom is first. Sam is not first. Priya is standing directly behind Sam. Who is last in the queue?",
    "options": [
      {
        "id": "priya",
        "text": "Priya"
      },
      {
        "id": "tom",
        "text": "Tom"
      },
      {
        "id": "sam",
        "text": "Sam"
      },
      {
        "id": "cannot-tell",
        "text": "Cannot tell"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "priya"
    },
    "explanation": "Place them step by step: Tom is first. Sam is not first, and Priya is right behind Sam, so Sam must be second and Priya third. That makes Priya last. Every clue fits only this order, so it can be worked out.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Logical reasoning",
      "skill": "Use clues to order items in a sequence",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "logic",
        "library",
        "ordering"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-014",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A librarian fills 5 shelves with 9 books on each shelf. She then removes 8 damaged books to be repaired. How many books are on the shelves now?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 37,
      "tolerance": 0
    },
    "explanation": "First find the total placed: 5 shelves x 9 books = 45. Then remove the damaged ones: 45 - 8 = 37. The multiplication must come before the subtraction because the damaged books are taken from the full set.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Multiplication and subtraction",
      "skill": "Multi-step word problem with two operations",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 65,
      "tags": [
        "multi-step",
        "library",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A wildlife park has 3 times as many penguins as seals. There are 7 seals. How many more penguins than seals are there in the park?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 14,
      "tolerance": 0
    },
    "explanation": "First find the penguins: 3 times 7 seals = 21 penguins. Then compare the two groups: 21 - 7 = 14 more penguins than seals. Two steps are needed because you must build the penguin number before finding the difference.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Multiplication and comparison",
      "skill": "Combine multiplying and comparing quantities",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "compare",
        "animals",
        "multi-step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e1-016",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A pattern starts at 30 and takes away 5 each step: 30, 25, 20, 15. Someone says the next number is 5. Is this statement true?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Each step goes down by 5, so after 15 the next number is 15 - 5 = 10, not 5. The claim skips a step, so the statement is false. Always apply the same rule once more from the last term.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Number patterns",
      "skill": "Check whether a sequence rule was applied correctly",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "patterns",
        "reasoning",
        "sequence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A ticket to the school fair costs $3. Ravi buys one ticket for himself and one each for two friends. He pays with a $10 note. How much change should he receive?",
    "options": [
      {
        "id": "three-dollars",
        "text": "$3"
      },
      {
        "id": "one-dollar",
        "text": "$1"
      },
      {
        "id": "nine-dollars",
        "text": "$9"
      },
      {
        "id": "seven-dollars",
        "text": "$7"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "one-dollar"
    },
    "explanation": "Each fair ticket costs $3 and Ravi buys 3 (himself and two friends), so 3 x $3 = $9. Change from $10 is $10 - $9 = $1.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Money and financial mathematics",
      "skill": "Reasoning with money and change across several purchases",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "money",
        "change",
        "multiplication"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-002",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the market, apples cost $2 each and a mango costs $4. Nadia buys 3 apples and 1 mango. She pays with a $20 note. How much change should she receive?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 10,
      "tolerance": 0,
      "instructions": "Write just the number of dollars of change, without the unit."
    },
    "explanation": "Three apples cost 3 x $2 = $6, plus the $4 mango makes $10 spent. Change from $20 is $20 - $10 = $10.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Money and financial mathematics",
      "skill": "Reasoning with money and change across several purchases",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "money",
        "change",
        "multi-step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows prices at the school canteen. Leo buys one sandwich, one juice and one cookie. He pays with a $10 note. How much change should he get?",
    "options": [
      {
        "id": "five-dollars",
        "text": "$5"
      },
      {
        "id": "seven-dollars",
        "text": "$7"
      },
      {
        "id": "three-dollars",
        "text": "$3"
      },
      {
        "id": "six-dollars",
        "text": "$6"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e2-003-1",
        "type": "table",
        "altText": "A canteen price list with two columns: Item and Price. Sandwich $4, Juice $2, Cookie $1.",
        "data": {
          "headers": [
            "Item",
            "Price"
          ],
          "rows": [
            [
              "Sandwich",
              "$4"
            ],
            [
              "Juice",
              "$2"
            ],
            [
              "Cookie",
              "$1"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "three-dollars"
    },
    "explanation": "Add the canteen prices Leo pays: $4 + $2 + $1 = $7. Change from $10 is $10 - $7 = $3.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Money and financial mathematics",
      "skill": "Reasoning with money and change across several purchases",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "money",
        "table",
        "addition"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A film at the cinema starts at 2:15 pm and finishes at 3:00 pm. How long does the film last?",
    "options": [
      {
        "id": "thirty-minutes",
        "text": "30 minutes"
      },
      {
        "id": "sixty-minutes",
        "text": "60 minutes"
      },
      {
        "id": "fifty-minutes",
        "text": "50 minutes"
      },
      {
        "id": "forty-five-minutes",
        "text": "45 minutes"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "forty-five-minutes"
    },
    "explanation": "From 2:15 pm to 3:00 pm, count on: 2:15 to 2:45 is 30 minutes, then 2:45 to 3:00 is 15 more, so 45 minutes.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Time",
      "skill": "Time intervals and elapsed time problems",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "time",
        "elapsed time"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-005",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A country train leaves the station at 9:35 am and arrives at the next town at 10:20 am. How many minutes does the journey take?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 45,
      "tolerance": 0,
      "instructions": "Write just the number of minutes, without the unit."
    },
    "explanation": "From 9:35 am count to 10:00 am is 25 minutes, then 10:00 to 10:20 is 20 minutes, so 25 + 20 = 45 minutes.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Time",
      "skill": "Time intervals and elapsed time problems",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "time",
        "elapsed time",
        "across the hour"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bus leaves the depot at 8:50 am. It reaches the school 35 minutes later. What time does the bus reach the school?",
    "options": [
      {
        "id": "nine-twenty-five",
        "text": "9:25 am"
      },
      {
        "id": "nine-fifteen",
        "text": "9:15 am"
      },
      {
        "id": "nine-thirty-five",
        "text": "9:35 am"
      },
      {
        "id": "nine-oh-five",
        "text": "9:05 am"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "nine-twenty-five"
    },
    "explanation": "Start at 8:50 am. Adding 10 minutes reaches 9:00 am, and 25 minutes more (35 - 10) reaches 9:25 am.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Time",
      "skill": "Time intervals and elapsed time problems",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "time",
        "elapsed time",
        "across the hour"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-007",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A number pattern begins 3, 6, 9, 12. If the pattern continues in the same way, the next number is 16.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "The numbers go up by 3 each time (3, 6, 9, 12), so the next number is 12 + 3 = 15, not 16. The statement is false.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Find a rule for a growing pattern and extend it",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "pattern",
        "rule",
        "true false"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener plants flowers in rows. The bar chart shows the first four rows. If the same rule continues, how many flowers are in row 6?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e2-008-1",
        "type": "bar_chart",
        "altText": "A bar chart of flowers per row: Row 1 has 2, Row 2 has 5, Row 3 has 8, Row 4 has 11.",
        "data": {
          "labels": [
            "Row 1",
            "Row 2",
            "Row 3",
            "Row 4"
          ],
          "values": [
            2,
            5,
            8,
            11
          ],
          "xAxisLabel": "Row",
          "yAxisLabel": "Flowers"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 17,
      "tolerance": 0,
      "instructions": "Write just the number of flowers, without the unit."
    },
    "explanation": "Each row adds 3 flowers (2, 5, 8, 11). Continuing the rule: row 5 = 14, row 6 = 17.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Find a rule for a growing pattern and extend it",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "pattern",
        "growing",
        "bar chart"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The numbers 4, 7, 10 and 13 are marked with dots on the number line. If the pattern of dots continues in the same way, what is the next number that would be marked?",
    "options": [
      {
        "id": "fourteen",
        "text": "14"
      },
      {
        "id": "sixteen",
        "text": "16"
      },
      {
        "id": "fifteen",
        "text": "15"
      },
      {
        "id": "seventeen",
        "text": "17"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e2-009-1",
        "type": "number_line",
        "altText": "A number line from 0 to 20 with ticks every 1, and dots on 4, 7, 10 and 13.",
        "data": {
          "min": 0,
          "max": 20,
          "step": 1,
          "highlightedValues": [
            4,
            7,
            10,
            13
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sixteen"
    },
    "explanation": "The marked numbers increase by 3 each time (4, 7, 10, 13). The next dot is at 13 + 3 = 16.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Find a rule for a growing pattern and extend it",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "pattern",
        "number line",
        "skip counting"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A pattern is built with matchsticks. Shape 1 uses 4 sticks, shape 2 uses 7 sticks and shape 3 uses 10 sticks. Which rule describes how the pattern grows?",
    "options": [
      {
        "id": "add-four",
        "text": "add 4 each time"
      },
      {
        "id": "multiply-two",
        "text": "multiply by 2"
      },
      {
        "id": "add-three",
        "text": "add 3 each time"
      },
      {
        "id": "add-two",
        "text": "add 2 each time"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "add-three"
    },
    "explanation": "From 4 to 7 to 10 the count goes up by 3 each time, so the rule is 'add 3 each time'.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Find a rule for a growing pattern and extend it",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "pattern",
        "rule",
        "matchsticks"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A ribbon is 1 metre and 20 centimetres long. How many centimetres long is the ribbon altogether?",
    "options": [
      {
        "id": "cm-102",
        "text": "102"
      },
      {
        "id": "cm-112",
        "text": "112"
      },
      {
        "id": "cm-200",
        "text": "200"
      },
      {
        "id": "cm-120",
        "text": "120"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cm-120"
    },
    "explanation": "One metre is 100 cm, so 1 m 20 cm = 100 + 20 = 120 cm.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Length",
      "skill": "Measurement comparisons requiring unit conversion (m/cm)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "length",
        "unit conversion",
        "metres"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-012",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bag of flour weighs 2 kilograms. A bag of sugar weighs 1500 grams. How many grams heavier is the flour than the sugar?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 500,
      "tolerance": 0,
      "instructions": "Write just the number of grams, without the unit."
    },
    "explanation": "2 kg of flour is 2000 g. The sugar is 1500 g, so the flour is 2000 - 1500 = 500 g heavier.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Mass",
      "skill": "Measurement comparisons requiring unit conversion (kg/g)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "mass",
        "unit conversion",
        "difference"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-013",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A skipping rope that is 2 metres long is longer than a skipping rope that is 180 centimetres long.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "2 metres equals 200 cm, which is more than 180 cm, so the 2 m rope is longer. The statement is true.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Length",
      "skill": "Measurement comparisons requiring unit conversion (m/cm)",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "length",
        "comparison",
        "unit conversion"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-014",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In this number sentence the box stands for a missing number: 7 + box = 15. What number belongs in the box?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 8,
      "tolerance": 0
    },
    "explanation": "To balance 7 + box = 15, find what adds to 7 to make 15: 15 - 7 = 8.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Deduce a missing value in a balanced equation",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "equation",
        "missing number",
        "inverse"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Both sides of this scale balance, so they are equal: 6 + 9 = box + 5. What number belongs in the box?",
    "options": [
      {
        "id": "ten",
        "text": "10"
      },
      {
        "id": "eight",
        "text": "8"
      },
      {
        "id": "fifteen",
        "text": "15"
      },
      {
        "id": "twenty",
        "text": "20"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "ten"
    },
    "explanation": "The left side is 6 + 9 = 15, so the box side must also equal 15. Since box + 5 = 15, the box is 15 - 5 = 10.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and Algebra",
      "topic": "Patterns and algebra",
      "skill": "Deduce a missing value in a balanced equation",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "equation",
        "balance",
        "missing number"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-numeracy-e2-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how many library books each class borrowed in Week 1 and Week 2. Which class borrowed the most books altogether across the two weeks?",
    "options": [
      {
        "id": "class-3b",
        "text": "3B"
      },
      {
        "id": "class-3a",
        "text": "3A"
      },
      {
        "id": "class-3c",
        "text": "3C"
      },
      {
        "id": "all-same",
        "text": "They all borrowed the same"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-numeracy-e2-016-1",
        "type": "table",
        "altText": "A table with columns Class, Week 1 and Week 2. 3A borrowed 12 then 15, 3B borrowed 9 then 11, 3C borrowed 14 then 10.",
        "data": {
          "headers": [
            "Class",
            "Week 1",
            "Week 2"
          ],
          "rows": [
            [
              "3A",
              "12",
              "15"
            ],
            [
              "3B",
              "9",
              "11"
            ],
            [
              "3C",
              "14",
              "10"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "class-3a"
    },
    "explanation": "Add each class's two weeks: 3A = 12 + 15 = 27, 3B = 9 + 11 = 20, 3C = 14 + 10 = 24. 3A has the most.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Data representation and interpretation",
      "skill": "Interpret a two-way or grouped table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 120,
      "tags": [
        "table",
        "data",
        "addition"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
