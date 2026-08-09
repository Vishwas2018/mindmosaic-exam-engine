import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 NAPLAN-style Numeracy — 14 original questions.
 * Every question carries exactly one deterministic visual.
 */
export const grade3NaplanNumeracy = defineQuestions([
  {
    id: "g3-nap-num-data-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which fruit did exactly 9 students choose?",
    instructions: "Use the bar chart, then choose one answer.",
    options: [
      { id: "bananas", text: "Bananas" },
      { id: "apples", text: "Apples" },
      { id: "oranges", text: "Oranges" },
      { id: "grapes", text: "Grapes" },
    ],
    visuals: [
      {
        id: "g3-fruit-survey-bar",
        type: "bar_chart",
        title: "Favourite fruits in Year 3",
        altText:
          "Bar chart showing apples chosen by 7 students, bananas by 9, oranges by 5 and grapes by 4.",
        caption: "Each student chose one favourite fruit.",
        data: {
          labels: ["Apples", "Bananas", "Oranges", "Grapes"],
          values: [7, 9, 5, 4],
          xAxisLabel: "Fruit",
          yAxisLabel: "Number of students",
          maxValue: 10,
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "bananas" },
    explanation:
      "The bananas bar reaches 9 on the chart, so bananas were chosen by exactly 9 students.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Reading a bar chart",
      skill: "Interpreting bar charts",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["data", "bar-chart"],
    },
  },
  {
    id: "g3-nap-num-data-002",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "How many more books did the class read in March than in May?",
    instructions: "Use the bar chart. Enter a number.",
    visuals: [
      {
        id: "g3-books-read-bar",
        type: "bar_chart",
        title: "Books read by the class",
        altText:
          "Bar chart showing 12 books read in March, 9 in April, 7 in May and 10 in June.",
        data: {
          labels: ["March", "April", "May", "June"],
          values: [12, 9, 7, 10],
          xAxisLabel: "Month",
          yAxisLabel: "Number of books",
          maxValue: 15,
        },
      },
    ],
    answerKey: { kind: "number", value: 5, tolerance: 0 },
    explanation:
      "The class read 12 books in March and 7 books in May. The difference is 12 − 7 = 5 books.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Comparing data",
      skill: "Comparing values in a bar chart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["data", "subtraction"],
    },
  },
  {
    id: "g3-nap-num-data-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which sport was chosen by half of the students?",
    instructions: "Use the pie chart, then choose one answer.",
    options: [
      { id: "netball", text: "Netball" },
      { id: "soccer", text: "Soccer" },
      { id: "tennis", text: "Tennis" },
    ],
    visuals: [
      {
        id: "g3-sports-pie",
        type: "pie_chart",
        title: "Favourite sports of 24 students",
        altText:
          "Pie chart of 24 students showing netball chosen by 12, soccer by 8 and tennis by 4. The netball section covers half the circle.",
        data: {
          segments: [
            { label: "Netball", value: 12 },
            { label: "Soccer", value: 8 },
            { label: "Tennis", value: 4 },
          ],
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "netball" },
    explanation:
      "There are 24 students in total and 12 chose netball. Since 12 is half of 24, netball was chosen by half of the students.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Reading a pie chart",
      skill: "Relating fractions to a pie chart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["data", "fractions"],
    },
  },
  {
    id: "g3-nap-num-money-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Mia buys one sandwich and one juice at the canteen. How many dollars does she spend altogether?",
    instructions: "Use the price table. Enter a number of dollars.",
    visuals: [
      {
        id: "g3-canteen-price-table",
        type: "table",
        title: "Canteen price list",
        altText:
          "Table listing canteen prices: sandwich 4 dollars, apple 1 dollar, juice 2 dollars, muffin 3 dollars.",
        data: {
          headers: ["Item", "Price in dollars"],
          rows: [
            ["Sandwich", 4],
            ["Apple", 1],
            ["Juice", 2],
            ["Muffin", 3],
          ],
          rowHeaders: true,
        },
      },
    ],
    answerKey: { kind: "number", value: 6, tolerance: 0, unit: "dollars" },
    explanation:
      "A sandwich costs $4 and a juice costs $2. Adding them gives 4 + 2 = 6, so Mia spends $6 altogether.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Money",
      skill: "Adding money amounts",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["money", "addition"],
    },
  },
  {
    id: "g3-nap-num-number-001",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select all the even numbers that are marked on the number line.",
    instructions: "Choose every correct answer. There is more than one.",
    options: [
      { id: "num-3", text: "3" },
      { id: "num-8", text: "8" },
      { id: "num-14", text: "14" },
      { id: "num-17", text: "17" },
    ],
    visuals: [
      {
        id: "g3-even-number-line",
        type: "number_line",
        title: "Marked numbers",
        altText:
          "Number line from 0 to 20 with marks every 1 unit. The numbers 3, 8, 14 and 17 are highlighted.",
        data: {
          min: 0,
          max: 20,
          step: 1,
          highlightedValues: [3, 8, 14, 17],
        },
      },
    ],
    answerKey: { kind: "multiple_options", optionIds: ["num-8", "num-14"] },
    explanation:
      "Even numbers end in 0, 2, 4, 6 or 8. Of the marked numbers, 8 and 14 are even, while 3 and 17 are odd.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Odd and even numbers",
      skill: "Identifying even numbers",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["number-line", "even-numbers"],
    },
  },
  {
    id: "g3-nap-num-number-002",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "The number line counts by fives. What number is highlighted?",
    instructions: "Enter a number.",
    visuals: [
      {
        id: "g3-count-by-fives-line",
        type: "number_line",
        title: "Counting by fives",
        altText:
          "Number line from 0 to 50 with marks every 5 units. The value 35 is highlighted.",
        data: {
          min: 0,
          max: 50,
          step: 5,
          highlightedValues: [35],
        },
      },
    ],
    answerKey: { kind: "number", value: 35, tolerance: 0 },
    explanation:
      "Counting by fives from 0 gives 0, 5, 10, 15, 20, 25, 30, 35. The highlighted mark sits at 35.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Skip counting",
      skill: "Reading a number line",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["number-line", "skip-counting"],
    },
  },
  {
    id: "g3-nap-num-geo-001",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "True or false? The perimeter of this square is 24 centimetres.",
    instructions: "Use the side length shown on the shape.",
    visuals: [
      {
        id: "g3-square-perimeter",
        type: "geometry_shape",
        title: "A square garden bed",
        altText: "A square with each side labelled 6 centimetres.",
        data: {
          shape: "square",
          measurements: [{ label: "Side", value: 6, unit: "cm" }],
        },
      },
    ],
    answerKey: { kind: "boolean", value: true },
    explanation:
      "A square has four equal sides. The perimeter is 6 + 6 + 6 + 6 = 24 centimetres, so the statement is true.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement",
      topic: "Perimeter",
      skill: "Calculating the perimeter of a square",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["perimeter", "shapes"],
    },
  },
  {
    id: "g3-nap-num-frac-001",
    type: "fill_blank",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Complete the sentence about the fraction model.",
    instructions: "Write a number in each box.",
    interaction: {
      type: "fill_blank",
      segments: ["The model shows ", " out of ", " equal parts shaded."],
      blanks: [
        { id: "shaded-parts", label: "Number of shaded parts" },
        { id: "total-parts", label: "Total number of equal parts" },
      ],
    },
    visuals: [
      {
        id: "g3-three-quarters-bar",
        type: "fraction_model",
        title: "A fraction bar",
        altText: "A bar divided into 4 equal parts with 3 parts shaded.",
        data: {
          numerator: 3,
          denominator: 4,
          model: "bar",
        },
      },
    ],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        { id: "shaded-parts", acceptedAnswers: ["3", "three"] },
        { id: "total-parts", acceptedAnswers: ["4", "four"] },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The bar is divided into 4 equal parts and 3 of them are shaded, so the model shows 3 out of 4 equal parts shaded.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Fractions",
      skill: "Naming fractions from a model",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["fractions"],
    },
  },
  {
    id: "g3-nap-num-frac-002",
    type: "dropdown",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Choose the numbers that describe the circle model.",
    instructions: "Pick one answer in each box.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "shaded",
          label: "Number of shaded parts",
          options: [
            { id: "shaded-1", text: "1" },
            { id: "shaded-2", text: "2" },
            { id: "shaded-3", text: "3" },
          ],
        },
        {
          id: "total",
          label: "Total number of equal parts",
          options: [
            { id: "total-2", text: "2" },
            { id: "total-3", text: "3" },
            { id: "total-4", text: "4" },
          ],
        },
      ],
    },
    visuals: [
      {
        id: "g3-two-thirds-circle",
        type: "fraction_model",
        title: "A circle model",
        altText: "A circle divided into 3 equal parts with 2 parts shaded.",
        data: {
          numerator: 2,
          denominator: 3,
          model: "circle",
        },
      },
    ],
    answerKey: {
      kind: "dropdown",
      fields: [
        { id: "shaded", correctOptionId: "shaded-2" },
        { id: "total", correctOptionId: "total-3" },
      ],
    },
    explanation:
      "The circle is cut into 3 equal parts and 2 of them are shaded, so the model shows the fraction two thirds.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Fractions",
      skill: "Describing a fraction model",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["fractions"],
    },
  },
  {
    id: "g3-nap-num-space-001",
    type: "matching",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each point on the grid to its position.",
    instructions:
      "The first number counts across from 0. The second number counts up from 0.",
    interaction: {
      type: "matching",
      sources: [
        { id: "point-a", text: "Point A" },
        { id: "point-b", text: "Point B" },
        { id: "point-c", text: "Point C" },
      ],
      targets: [
        { id: "pos-2-3", text: "(2, 3)" },
        { id: "pos-5-1", text: "(5, 1)" },
        { id: "pos-4-4", text: "(4, 4)" },
      ],
    },
    visuals: [
      {
        id: "g3-points-grid",
        type: "coordinate_grid",
        title: "Points on a grid",
        altText:
          "Coordinate grid from 0 to 6 on both axes with point A at (2, 3), point B at (5, 1) and point C at (4, 4).",
        data: {
          xRange: [0, 6],
          yRange: [0, 6],
          points: [
            { x: 2, y: 3, label: "A" },
            { x: 5, y: 1, label: "B" },
            { x: 4, y: 4, label: "C" },
          ],
          gridStep: 1,
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "point-a", targetId: "pos-2-3" },
        { sourceId: "point-b", targetId: "pos-5-1" },
        { sourceId: "point-c", targetId: "pos-4-4" },
      ],
    },
    explanation:
      "Point A sits 2 across and 3 up at (2, 3). Point B sits 5 across and 1 up at (5, 1). Point C sits 4 across and 4 up at (4, 4).",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Coordinates",
      skill: "Locating points on a grid",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["coordinates", "grid"],
    },
  },
  {
    id: "g3-nap-num-data-004",
    type: "ordering",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Order the months from the least rainfall to the most rainfall.",
    instructions: "Use the line graph. Put the smallest amount first.",
    interaction: {
      type: "ordering",
      items: [
        { id: "month-jan", text: "January" },
        { id: "month-feb", text: "February" },
        { id: "month-mar", text: "March" },
        { id: "month-apr", text: "April" },
      ],
    },
    visuals: [
      {
        id: "g3-rainfall-line",
        type: "line_graph",
        title: "Rainfall this year",
        altText:
          "Line graph showing rainfall of 8 millimetres in January, 3 in February, 5 in March and 10 in April.",
        data: {
          points: [
            { x: 1, y: 8, label: "January" },
            { x: 2, y: 3, label: "February" },
            { x: 3, y: 5, label: "March" },
            { x: 4, y: 10, label: "April" },
          ],
          xAxisLabel: "Month",
          yAxisLabel: "Rainfall in millimetres",
        },
      },
    ],
    answerKey: {
      kind: "ordering",
      optionIds: ["month-feb", "month-mar", "month-jan", "month-apr"],
    },
    explanation:
      "February had 3 mm, March had 5 mm, January had 8 mm and April had 10 mm. From least to most the order is February, March, January, April.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Reading a line graph",
      skill: "Ordering values from a graph",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["data", "line-graph", "ordering"],
    },
  },
  {
    id: "g3-nap-num-frac-003",
    type: "drag_drop",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "The model shows one half. Drag each fraction to the group where it belongs.",
    instructions:
      "Compare each fraction with the shaded half shown in the model.",
    interaction: {
      type: "drag_drop",
      items: [
        { id: "frac-one-quarter", text: "One quarter (1/4)" },
        { id: "frac-one-half", text: "One half (1/2)" },
        { id: "frac-three-quarters", text: "Three quarters (3/4)" },
      ],
      zones: [
        { id: "zone-less", label: "Less than one half" },
        { id: "zone-equal", label: "Equal to one half" },
        { id: "zone-more", label: "More than one half" },
      ],
    },
    visuals: [
      {
        id: "g3-one-half-bar",
        type: "fraction_model",
        title: "One half",
        altText: "A bar divided into 2 equal parts with 1 part shaded, showing one half.",
        data: {
          numerator: 1,
          denominator: 2,
          model: "bar",
        },
      },
    ],
    answerKey: {
      kind: "drag_drop",
      placements: {
        "frac-one-quarter": "zone-less",
        "frac-one-half": "zone-equal",
        "frac-three-quarters": "zone-more",
      },
    },
    explanation:
      "One quarter is smaller than one half, one half is equal to one half, and three quarters is larger than one half.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Comparing fractions",
      skill: "Comparing fractions with one half",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["fractions", "comparing"],
    },
  },
  {
    id: "g3-nap-num-geo-002",
    type: "label_diagram",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label each shape in the picture with its correct name.",
    instructions: "Match every shape name to one position in the picture.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-triangle", text: "Triangle" },
        { id: "label-square", text: "Square" },
        { id: "label-circle", text: "Circle" },
      ],
      targets: [
        { id: "target-left", label: "Left shape" },
        { id: "target-middle", label: "Middle shape" },
        { id: "target-right", label: "Right shape" },
      ],
    },
    visuals: [
      {
        id: "g3-three-shapes-svg",
        type: "labelled_svg",
        title: "Three shapes",
        altText:
          "A picture of three shapes in a row: a triangle on the left, a square in the middle and a circle on the right.",
        data: {
          width: 360,
          height: 140,
          elements: [
            {
              id: "shape-triangle",
              kind: "polygon",
              points: [
                { x: 60, y: 30 },
                { x: 20, y: 110 },
                { x: 100, y: 110 },
              ],
              fill: "#D8CCEE",
              stroke: "#4B2E83",
            },
            {
              id: "shape-square",
              kind: "rectangle",
              x: 145,
              y: 35,
              width: 75,
              height: 75,
              fill: "#FFE1BF",
              stroke: "#B25E00",
            },
            {
              id: "shape-circle",
              kind: "circle",
              cx: 300,
              cy: 72,
              r: 40,
              fill: "#CBE7D6",
              stroke: "#1E7A46",
            },
          ],
          labels: [
            { text: "Left", x: 60, y: 130 },
            { text: "Middle", x: 182, y: 130 },
            { text: "Right", x: 300, y: 130 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-triangle", targetId: "target-left" },
        { sourceId: "label-square", targetId: "target-middle" },
        { sourceId: "label-circle", targetId: "target-right" },
      ],
    },
    explanation:
      "The left shape has 3 straight sides, so it is a triangle. The middle shape has 4 equal sides, so it is a square. The right shape is round, so it is a circle.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "2D shapes",
      skill: "Naming 2D shapes",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["shapes", "labelling"],
    },
  },
  {
    id: "g3-nap-num-geo-003",
    type: "hotspot",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the shape that has four sides all the same length.",
    instructions: "Click or tap one shape in the picture.",
    visuals: [
      {
        id: "g3-equal-sides-hotspot",
        type: "hotspot_svg",
        title: "Three shapes to compare",
        altText:
          "A picture of three shapes: a wide rectangle on the left, a square in the middle and a triangle on the right.",
        data: {
          width: 380,
          height: 140,
          elements: [
            {
              id: "draw-rectangle",
              kind: "rectangle",
              x: 15,
              y: 45,
              width: 100,
              height: 60,
              fill: "#CBE7D6",
              stroke: "#1E7A46",
            },
            {
              id: "draw-square",
              kind: "rectangle",
              x: 150,
              y: 35,
              width: 75,
              height: 75,
              fill: "#D8CCEE",
              stroke: "#4B2E83",
            },
            {
              id: "draw-triangle",
              kind: "polygon",
              points: [
                { x: 310, y: 30 },
                { x: 265, y: 110 },
                { x: 355, y: 110 },
              ],
              fill: "#FFE1BF",
              stroke: "#B25E00",
            },
          ],
          labels: [],
          regions: [
            {
              id: "region-rectangle",
              shape: "rectangle",
              accessibleLabel: "Wide rectangle on the left",
              x: 15,
              y: 45,
              width: 100,
              height: 60,
            },
            {
              id: "region-square",
              shape: "rectangle",
              accessibleLabel: "Square in the middle",
              x: 150,
              y: 35,
              width: 75,
              height: 75,
            },
            {
              id: "region-triangle",
              shape: "polygon",
              accessibleLabel: "Triangle on the right",
              points: [
                { x: 310, y: 30 },
                { x: 265, y: 110 },
                { x: 355, y: 110 },
              ],
            },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["region-square"] },
    explanation:
      "A square has four sides that are all the same length. The rectangle has two long and two short sides, and the triangle has only three sides.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Properties of shapes",
      skill: "Identifying a square by its properties",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["shapes", "hotspot"],
    },
  },

  ...([
  {
    "id": "naplan-y3-numeracy-db-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A fruit market sold 583 oranges on Saturday. In the number 583, what is the value of the digit 8?",
    "options": [
      {
        "id": "opt-8",
        "text": "8"
      },
      {
        "id": "opt-80",
        "text": "80"
      },
      {
        "id": "opt-800",
        "text": "800"
      },
      {
        "id": "opt-83",
        "text": "83"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-80"
    },
    "explanation": "The 8 sits in the tens column, so it stands for 8 tens, which is 80. The 5 is hundreds and the 3 is ones. To check, break 583 into 500 + 80 + 3.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Place value to 999",
      "skill": "Identify the value of a digit in a three-digit number",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "place value",
        "tens",
        "three-digit numbers",
        "markets"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-002",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A baker made 148 muffins in the morning and 276 muffins in the afternoon. How many muffins did the baker make altogether?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 424,
      "tolerance": 0
    },
    "explanation": "Add the ones: 8 + 6 = 14, so write 4 and carry 1 ten. Add the tens: 4 + 7 + 1 = 12, so write 2 and carry 1 hundred. Add the hundreds: 1 + 2 + 1 = 4. The total is 424.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Addition with regrouping",
      "skill": "Add two three-digit numbers involving regrouping",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "addition",
        "regrouping",
        "cooking"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-003",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A train left the city with 204 passengers. At the first station, 58 passengers got off. How many passengers were still on the train?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 146,
      "tolerance": 0
    },
    "explanation": "You cannot take 8 from 4 ones, and there are 0 tens to borrow from, so borrow across: 204 becomes 1 hundred, 9 tens and 14 ones. Now 14 - 8 = 6 ones, 9 - 5 = 4 tens, 1 - 0 = 1 hundred. The answer is 146.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Subtraction with regrouping across zero",
      "skill": "Subtract a two-digit number from a three-digit number with regrouping",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 110,
      "tags": [
        "subtraction",
        "regrouping",
        "transport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A netball club has 8 teams and each team has 7 players. On game day, 5 players are away sick. How many players are present?",
    "options": [
      {
        "id": "opt-56",
        "text": "56"
      },
      {
        "id": "opt-63",
        "text": "63"
      },
      {
        "id": "opt-51",
        "text": "51"
      },
      {
        "id": "opt-49",
        "text": "49"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-51"
    },
    "explanation": "First find the total number of players: 8 groups of 7 is 8 x 7 = 56. Then take away the 5 who are sick: 56 - 5 = 51. The two steps are multiply, then subtract.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Multiplication facts and two-step problems",
      "skill": "Solve a two-step problem using a multiplication fact then subtraction",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "multiplication",
        "two-step",
        "sport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-005",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A market seller packs 56 strawberries equally into 8 punnets. How many strawberries are in each punnet?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 7,
      "tolerance": 0
    },
    "explanation": "Sharing 56 equally into 8 groups is a division: 56 divided by 8. Think of the times table: 8 x 7 = 56, so 56 divided by 8 = 7. Each punnet holds 7 strawberries.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Division facts",
      "skill": "Use a known multiplication fact to solve a division",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "division",
        "sharing",
        "markets"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The pie chart shows the flowers growing in a garden bed. What fraction of the flowers are white?",
    "options": [
      {
        "id": "opt-quarter",
        "text": "one quarter"
      },
      {
        "id": "opt-third",
        "text": "one third"
      },
      {
        "id": "opt-sixth",
        "text": "one sixth"
      },
      {
        "id": "opt-half",
        "text": "one half"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-006-1",
        "type": "pie_chart",
        "altText": "A pie chart of 12 garden flowers: red 3, yellow 3 and white 6, so white fills half the circle.",
        "data": {
          "segments": [
            {
              "label": "Red",
              "value": 3
            },
            {
              "label": "Yellow",
              "value": 3
            },
            {
              "label": "White",
              "value": 6
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-half"
    },
    "explanation": "There are 3 + 3 + 6 = 12 flowers in all. The white slice fills 6 of the 12, and 6 out of 12 is the same as one half. On the chart the white slice takes up half the circle.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Fractions of a collection",
      "skill": "Name the fraction of a group shown in a pie chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "fractions",
        "pie chart",
        "gardens"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The number line shows a skip-counting pattern, with dots at 5, 10, 15 and 20. If the pattern keeps going, what number will the next dot land on?",
    "options": [
      {
        "id": "opt-25",
        "text": "25"
      },
      {
        "id": "opt-30",
        "text": "30"
      },
      {
        "id": "opt-21",
        "text": "21"
      },
      {
        "id": "opt-24",
        "text": "24"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-007-1",
        "type": "number_line",
        "altText": "A number line from 0 to 30 with ticks every 5, and dots marked on 5, 10, 15 and 20.",
        "data": {
          "min": 0,
          "max": 30,
          "step": 5,
          "highlightedValues": [
            5,
            10,
            15,
            20
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-25"
    },
    "explanation": "Each dot is 5 more than the one before: 5, 10, 15, 20. To find the next dot, add 5 to 20, which gives 25. The dots are counting by fives.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number patterns",
      "skill": "Continue a skip-counting pattern shown on a number line",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "patterns",
        "skip counting",
        "number line"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At a school market stall, a pencil costs 65c and a rubber costs 40c. How much do they cost altogether?",
    "instructions": "Write just the number of cents, without the unit.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 105,
      "tolerance": 0,
      "unit": "cents"
    },
    "explanation": "Add the two prices in cents: 65 + 40. 65 + 40 = 105. So the pencil and rubber cost 105 cents together, which is the same as one dollar and five cents.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Money",
      "skill": "Add two amounts of money in cents",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "money",
        "cents",
        "addition",
        "school fair"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener has a hose that is 3 metres long. Which length is the same as 3 metres?",
    "options": [
      {
        "id": "opt-30",
        "text": "30 centimetres"
      },
      {
        "id": "opt-300",
        "text": "300 centimetres"
      },
      {
        "id": "opt-13",
        "text": "13 centimetres"
      },
      {
        "id": "opt-3",
        "text": "3 centimetres"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-300"
    },
    "explanation": "There are 100 centimetres in 1 metre. For 3 metres, count three lots of 100: 100 + 100 + 100 = 300. So 3 metres is the same as 300 centimetres.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Length units",
      "skill": "Convert metres to centimetres",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "length",
        "metres",
        "centimetres",
        "gardens"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the mass of four parcels waiting at a post office. How much heavier is the heaviest parcel than the lightest parcel?",
    "options": [
      {
        "id": "opt-8kg",
        "text": "8 kg"
      },
      {
        "id": "opt-11kg",
        "text": "11 kg"
      },
      {
        "id": "opt-5kg",
        "text": "5 kg"
      },
      {
        "id": "opt-3kg",
        "text": "3 kg"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-010-1",
        "type": "table",
        "altText": "A table of parcel masses in kilograms: Cushions 8, Plates 5, Mugs 3, Spoons 6.",
        "data": {
          "headers": [
            "Parcel",
            "Mass (kg)"
          ],
          "rows": [
            [
              "Cushions",
              "8"
            ],
            [
              "Plates",
              "5"
            ],
            [
              "Mugs",
              "3"
            ],
            [
              "Spoons",
              "6"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-5kg"
    },
    "explanation": "The heaviest parcel is Cushions at 8 kg and the lightest is Mugs at 3 kg. Find the difference: 8 - 3 = 5. So the heaviest is 5 kg heavier than the lightest.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Mass",
      "skill": "Compare masses in a table and find the difference",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "mass",
        "kilograms",
        "table",
        "transport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar graph shows how many litres of juice are in four jugs at a party. Which jug holds the most juice?",
    "options": [
      {
        "id": "opt-juga",
        "text": "Jug A"
      },
      {
        "id": "opt-jugc",
        "text": "Jug C"
      },
      {
        "id": "opt-jugd",
        "text": "Jug D"
      },
      {
        "id": "opt-jugb",
        "text": "Jug B"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-011-1",
        "type": "bar_chart",
        "altText": "A bar graph of juice in litres: Jug A 2, Jug B 5, Jug C 3, Jug D 4.",
        "data": {
          "labels": [
            "Jug A",
            "Jug B",
            "Jug C",
            "Jug D"
          ],
          "values": [
            2,
            5,
            3,
            4
          ],
          "xAxisLabel": "Jug",
          "yAxisLabel": "Litres"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-jugb"
    },
    "explanation": "The jug with the most juice has the tallest bar. Jug B reaches 5 litres, which is higher than Jug A (2), Jug C (3) and Jug D (4). So Jug B holds the most.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Capacity",
      "skill": "Read a bar graph to find the greatest capacity",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "capacity",
        "litres",
        "bar chart",
        "cooking"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The timetable shows when a bus reaches each stop. How long does the bus take to travel from the Library stop to the Market stop?",
    "options": [
      {
        "id": "opt-25",
        "text": "25 minutes"
      },
      {
        "id": "opt-15",
        "text": "15 minutes"
      },
      {
        "id": "opt-40",
        "text": "40 minutes"
      },
      {
        "id": "opt-30",
        "text": "30 minutes"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-012-1",
        "type": "table",
        "altText": "A bus timetable: Library 9:15, Market 9:40, Park 10:05, School 10:30.",
        "data": {
          "headers": [
            "Stop",
            "Bus arrives"
          ],
          "rows": [
            [
              "Library",
              "9:15"
            ],
            [
              "Market",
              "9:40"
            ],
            [
              "Park",
              "10:05"
            ],
            [
              "School",
              "10:30"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-25"
    },
    "explanation": "The bus is at the Library at 9:15 and at the Market at 9:40. Count on from 9:15 to 9:40: that is 25 minutes. So the trip takes 25 minutes.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Time intervals",
      "skill": "Work out an elapsed time from a timetable",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "time",
        "timetable",
        "minutes",
        "transport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A cardboard box has 6 flat faces. The top and bottom are squares, but the four side faces are rectangles that are taller than they are wide. What 3D shape is the box?",
    "options": [
      {
        "id": "opt-cube",
        "text": "cube"
      },
      {
        "id": "opt-prism",
        "text": "rectangular prism"
      },
      {
        "id": "opt-cylinder",
        "text": "cylinder"
      },
      {
        "id": "opt-pyramid",
        "text": "square pyramid"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-prism"
    },
    "explanation": "A shape with 6 flat rectangular faces is a rectangular prism. It is not a cube, because a cube must have all six faces the same size squares, and here the side faces are taller rectangles. A cylinder has curved sides and a square pyramid has a point on top.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "3D objects",
      "skill": "Name a 3D object from its faces",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "3D shapes",
        "faces",
        "rectangular prism"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-014",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In art class, a child writes the capital letter H. Is this statement true or false: the capital letter H has exactly one line of symmetry.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "A line of symmetry is a fold line where both halves match exactly. The capital H matches when folded down the middle from top to bottom, and it also matches when folded across the middle from left to right. That is two lines of symmetry, not one, so the statement is false.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Symmetry",
      "skill": "Count lines of symmetry in a letter shape",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "symmetry",
        "lines of symmetry",
        "shapes"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A rectangular vegetable patch is 9 metres long and 4 metres wide. What is the perimeter of the patch?",
    "instructions": "Write just the number of metres, without the unit.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 26,
      "tolerance": 0,
      "unit": "metres"
    },
    "explanation": "Perimeter is the distance all the way around. A rectangle has two long sides and two short sides: 9 + 4 + 9 + 4. Add them in order: 9 + 4 = 13, and 13 + 13 = 26. The perimeter is 26 metres.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Perimeter",
      "skill": "Find the perimeter of a rectangle from its length and width",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "perimeter",
        "rectangle",
        "metres",
        "gardens"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-db-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar graph shows the favourite sport chosen by children in a class. How many more children chose Netball than Cricket?",
    "options": [
      {
        "id": "opt-5",
        "text": "5"
      },
      {
        "id": "opt-16",
        "text": "16"
      },
      {
        "id": "opt-6",
        "text": "6"
      },
      {
        "id": "opt-3",
        "text": "3"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-db-016-1",
        "type": "bar_chart",
        "altText": "A bar graph of favourite sports: Soccer 8, Cricket 5, Netball 11, Tennis 6.",
        "data": {
          "labels": [
            "Soccer",
            "Cricket",
            "Netball",
            "Tennis"
          ],
          "values": [
            8,
            5,
            11,
            6
          ],
          "xAxisLabel": "Sport",
          "yAxisLabel": "Number of children"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-6"
    },
    "explanation": "Read the two bars: Netball is 11 and Cricket is 5. To find how many more, subtract: 11 - 5 = 6. So 6 more children chose Netball than Cricket.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Data interpretation",
      "skill": "Compare two columns of a bar graph by subtracting",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "data",
        "bar chart",
        "subtraction",
        "sport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At a bird sanctuary, a sign shows a number made from 4 hundreds, 0 tens and 7 ones. What number is on the sign?",
    "options": [
      {
        "id": "opt-407",
        "text": "407"
      },
      {
        "id": "opt-470",
        "text": "470"
      },
      {
        "id": "opt-47",
        "text": "47"
      },
      {
        "id": "opt-4007",
        "text": "4007"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-407"
    },
    "explanation": "Put each part in its place: 4 hundreds is 400, 0 tens is 0, and 7 ones is 7. Add them to get 400 + 0 + 7 = 407. The zero holds the tens place so the 7 stays in the ones place.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Place value",
      "skill": "Build a three-digit number from hundreds, tens and ones",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "place value",
        "three-digit numbers"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-002",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Four bushwalking tracks have these lengths: Fern Track 380 m, Ridge Track 830 m, Creek Track 308 m and Gully Track 803 m. Put the tracks in order from shortest to longest.",
    "options": [],
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "fern",
          "text": "Fern Track (380 m)"
        },
        {
          "id": "ridge",
          "text": "Ridge Track (830 m)"
        },
        {
          "id": "creek",
          "text": "Creek Track (308 m)"
        },
        {
          "id": "gully",
          "text": "Gully Track (803 m)"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "creek",
        "fern",
        "gully",
        "ridge"
      ]
    },
    "explanation": "Compare the hundreds digit first. Creek 308 and Fern 380 both start with 3, so they are smallest; 308 is less than 380. Gully 803 and Ridge 830 both start with 8; 803 is less than 830. Shortest to longest is 308, 380, 803, 830.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Comparing and ordering numbers",
      "skill": "Order three-digit numbers from smallest to largest",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "ordering",
        "place value",
        "comparing numbers"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-003",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how many fish are in each tank at an aquarium. How many fish are in the Coral tank and the Rock tank altogether?",
    "options": [],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-003-1",
        "type": "table",
        "altText": "A table with tanks and fish counts: Coral 46, Rock 38, Kelp 52, Sand 27.",
        "data": {
          "headers": [
            "Tank",
            "Number of fish"
          ],
          "rows": [
            [
              "Coral",
              "46"
            ],
            [
              "Rock",
              "38"
            ],
            [
              "Kelp",
              "52"
            ],
            [
              "Sand",
              "27"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 84,
      "tolerance": 0
    },
    "explanation": "Find the two named tanks in the table: Coral has 46 fish and Rock has 38 fish. Add them: 46 + 38. Six ones plus eight ones is 14, so write 4 and carry 1 ten; 4 tens + 3 tens + 1 ten is 8 tens. The total is 84.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Interpreting data tables",
      "skill": "Read two values from a table and add them",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "table",
        "addition",
        "data"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A scout group had 315 bottle caps saved in a jar. They glued 148 caps onto a poster. How many caps are left in the jar?",
    "options": [
      {
        "id": "opt-233",
        "text": "233"
      },
      {
        "id": "opt-167",
        "text": "167"
      },
      {
        "id": "opt-177",
        "text": "177"
      },
      {
        "id": "opt-267",
        "text": "267"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-167"
    },
    "explanation": "Work out 315 - 148. In the ones, 5 is smaller than 8, so trade a ten: 15 - 8 = 7. In the tens you now have 0, so trade a hundred: 10 - 4 = 6. In the hundreds, 2 - 1 = 1. That gives 167 caps left.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Subtraction with regrouping",
      "skill": "Subtract a three-digit number needing regrouping",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "subtraction",
        "regrouping"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener plants seedlings in 6 rows. Each row has 5 seedlings. How many seedlings are planted in total?",
    "options": [
      {
        "id": "opt-11",
        "text": "11"
      },
      {
        "id": "opt-25",
        "text": "25"
      },
      {
        "id": "opt-30",
        "text": "30"
      },
      {
        "id": "opt-35",
        "text": "35"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-30"
    },
    "explanation": "Equal rows mean you multiply: 6 rows of 5 is 6 x 5. Counting by fives six times gives 5, 10, 15, 20, 25, 30. So there are 30 seedlings.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Multiplication",
      "skill": "Find a total from equal rows using multiplication",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "multiplication",
        "arrays",
        "equal groups"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-006",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A teacher shares 48 marbles equally into 6 baskets. How many marbles go into each basket?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 8,
      "tolerance": 0
    },
    "explanation": "Sharing equally means dividing: 48 divided into 6 equal baskets. Ask what times 6 makes 48. Since 6 x 8 = 48, each basket gets 8 marbles.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Division",
      "skill": "Share a quantity equally using a known times fact",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "division",
        "sharing",
        "times tables"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The pie chart shows the pets owned by children in a class. The circle is split into four equal parts, one for each kind of pet. What fraction of the children own a dog?",
    "options": [
      {
        "id": "opt-half",
        "text": "one half"
      },
      {
        "id": "opt-third",
        "text": "one third"
      },
      {
        "id": "opt-eighth",
        "text": "one eighth"
      },
      {
        "id": "opt-quarter",
        "text": "one quarter"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-007-1",
        "type": "pie_chart",
        "altText": "A pie chart split into four equal parts labelled Dogs, Cats, Birds and Fish.",
        "data": {
          "segments": [
            {
              "label": "Dogs",
              "value": 6
            },
            {
              "label": "Cats",
              "value": 6
            },
            {
              "label": "Birds",
              "value": 6
            },
            {
              "label": "Fish",
              "value": 6
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-quarter"
    },
    "explanation": "The circle is cut into four equal slices, one for each pet. The dog slice is one of those four equal parts, and one out of four equal parts is one quarter.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Fractions of a whole",
      "skill": "Name the fraction shown by one equal part of a pie chart",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "fractions",
        "pie chart",
        "quarters"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar graph shows how many books were borrowed from the school library each day. On which day were the most books borrowed?",
    "options": [
      {
        "id": "opt-wednesday",
        "text": "Wednesday"
      },
      {
        "id": "opt-monday",
        "text": "Monday"
      },
      {
        "id": "opt-thursday",
        "text": "Thursday"
      },
      {
        "id": "opt-friday",
        "text": "Friday"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-008-1",
        "type": "bar_chart",
        "altText": "A bar graph of books borrowed: Monday 12, Tuesday 18, Wednesday 24, Thursday 9, Friday 15.",
        "data": {
          "labels": [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday"
          ],
          "values": [
            12,
            18,
            24,
            9,
            15
          ],
          "xAxisLabel": "Day",
          "yAxisLabel": "Books borrowed"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-wednesday"
    },
    "explanation": "The tallest bar shows the most books. Wednesday reaches 24, which is higher than Monday 12, Tuesday 18, Thursday 9 and Friday 15. So the most books were borrowed on Wednesday.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Column graphs",
      "skill": "Find the largest value on a bar graph",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "bar graph",
        "data",
        "reading graphs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar graph shows the goals scored by four teams in a season. How many goals did the Sharks and the Lions score altogether?",
    "options": [
      {
        "id": "opt-10",
        "text": "10"
      },
      {
        "id": "opt-40",
        "text": "40"
      },
      {
        "id": "opt-55",
        "text": "55"
      },
      {
        "id": "opt-60",
        "text": "60"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-009-1",
        "type": "bar_chart",
        "altText": "A bar graph of goals scored: Sharks 25, Eagles 40, Lions 15, Tigers 30.",
        "data": {
          "labels": [
            "Sharks",
            "Eagles",
            "Lions",
            "Tigers"
          ],
          "values": [
            25,
            40,
            15,
            30
          ],
          "xAxisLabel": "Team",
          "yAxisLabel": "Goals scored"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-40"
    },
    "explanation": "First read each named bar: the Sharks scored 25 and the Lions scored 15. Then add them together: 25 + 15 = 40 goals. The Eagles bar also shows 40, but the question asks only about the Sharks and Lions.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Column graphs",
      "skill": "Add two values read from a bar graph",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "bar graph",
        "addition",
        "two-step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A frog hops along a number line, landing on the dots shown at 0, 10, 20 and 30. If it keeps hopping the same way, what number will it land on next?",
    "options": [
      {
        "id": "opt-31",
        "text": "31"
      },
      {
        "id": "opt-35",
        "text": "35"
      },
      {
        "id": "opt-40",
        "text": "40"
      },
      {
        "id": "opt-50",
        "text": "50"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-010-1",
        "type": "number_line",
        "altText": "A number line from 0 to 50 with ticks every 10, and dots on 0, 10, 20 and 30.",
        "data": {
          "min": 0,
          "max": 50,
          "step": 10,
          "highlightedValues": [
            0,
            10,
            20,
            30
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-40"
    },
    "explanation": "Each hop is 10 bigger than the last: 0, 10, 20, 30. To find the next dot, add 10 to 30, which gives 40. The frog is counting by tens.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number patterns",
      "skill": "Continue a skip-counting pattern on a number line",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "number line",
        "skip counting",
        "patterns"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Mia buys a muffin at the canteen for $1.35. She pays with a $2 coin. How much change should she get?",
    "options": [
      {
        "id": "opt-75c",
        "text": "75c"
      },
      {
        "id": "opt-55c",
        "text": "55c"
      },
      {
        "id": "opt-35c",
        "text": "35c"
      },
      {
        "id": "opt-65c",
        "text": "65c"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-65c"
    },
    "explanation": "Change is what is left after paying. $2 is the same as 200c and the muffin costs 135c. Work out 200 - 135 = 65, so the change is 65c. You can check by counting up from 135 to 200: 135 + 65 = 200.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Money",
      "skill": "Work out change from a whole dollar amount",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "money",
        "change",
        "subtraction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The line graph shows the height of a sunflower measured each week. How much taller did the sunflower grow between Week 2 and Week 4?",
    "options": [
      {
        "id": "opt-8",
        "text": "8"
      },
      {
        "id": "opt-15",
        "text": "15"
      },
      {
        "id": "opt-11",
        "text": "11"
      },
      {
        "id": "opt-22",
        "text": "22"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-012-1",
        "type": "line_graph",
        "altText": "A line graph of sunflower height in cm: Week 1 4, Week 2 7, Week 3 12, Week 4 15.",
        "data": {
          "points": [
            {
              "x": 1,
              "y": 4,
              "label": "Week 1"
            },
            {
              "x": 2,
              "y": 7,
              "label": "Week 2"
            },
            {
              "x": 3,
              "y": 12,
              "label": "Week 3"
            },
            {
              "x": 4,
              "y": 15,
              "label": "Week 4"
            }
          ],
          "xAxisLabel": "Week",
          "yAxisLabel": "Height (cm)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-8"
    },
    "explanation": "Read the height at each week: Week 2 is 7 cm and Week 4 is 15 cm. Growth is the difference: 15 - 7 = 8 cm. Week 4 shows the total height of 15 cm, not the amount it grew.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics",
      "topic": "Line graphs",
      "skill": "Find the change between two points on a line graph",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "line graph",
        "difference",
        "data"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the mass of four boxes of fruit at a market. How much heavier is the heaviest box than the lightest box?",
    "options": [
      {
        "id": "opt-22kg",
        "text": "22 kg"
      },
      {
        "id": "opt-8kg",
        "text": "8 kg"
      },
      {
        "id": "opt-15kg",
        "text": "15 kg"
      },
      {
        "id": "opt-6kg",
        "text": "6 kg"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-dc-013-1",
        "type": "table",
        "altText": "A table of box masses in kilograms: Apples 12, Pears 9, Oranges 15, Bananas 7.",
        "data": {
          "headers": [
            "Box",
            "Mass (kg)"
          ],
          "rows": [
            [
              "Apples",
              "12"
            ],
            [
              "Pears",
              "9"
            ],
            [
              "Oranges",
              "15"
            ],
            [
              "Bananas",
              "7"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-8kg"
    },
    "explanation": "First find the heaviest and lightest boxes. Oranges are heaviest at 15 kg and Bananas are lightest at 7 kg. Then subtract: 15 - 7 = 8, so the heaviest box is 8 kg heavier than the lightest.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Mass",
      "skill": "Compare masses in a table by finding the difference",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "mass",
        "table",
        "difference",
        "two-step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A swimming lesson starts at half past 3 in the afternoon. Which digital clock time is the same as half past 3?",
    "options": [
      {
        "id": "opt-300",
        "text": "3:00"
      },
      {
        "id": "opt-630",
        "text": "6:30"
      },
      {
        "id": "opt-330",
        "text": "3:30"
      },
      {
        "id": "opt-230",
        "text": "2:30"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-330"
    },
    "explanation": "Half past means 30 minutes after the hour. Half past 3 is 30 minutes after 3 o'clock, which a digital clock shows as 3:30.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Time",
      "skill": "Match half past a time to its digital form",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "time",
        "half past",
        "digital clock"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A garden bed has 4 straight sides. Two of the sides are long and two of the sides are short. All 4 corners are square corners. What is the name of this shape?",
    "options": [
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
      },
      {
        "id": "opt-rectangle",
        "text": "rectangle"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-rectangle"
    },
    "explanation": "A shape with 4 straight sides and 4 square corners, where the sides are two long and two short, is a rectangle. A square also has square corners but all four of its sides are the same length, so it does not fit here.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Two-dimensional shapes",
      "skill": "Name a 2D shape from its sides and corners",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "2D shapes",
        "rectangle",
        "properties"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-dc-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At a school fair, a family buys 4 ride tickets. Each ticket costs $3. They pay with a $20 note. How much change should they get?",
    "options": [
      {
        "id": "opt-8",
        "text": "$8"
      },
      {
        "id": "opt-12",
        "text": "$12"
      },
      {
        "id": "opt-17",
        "text": "$17"
      },
      {
        "id": "opt-5",
        "text": "$5"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "opt-8"
    },
    "explanation": "This has two steps. First find the total cost: 4 tickets at $3 each is 4 x 3 = $12. Then find the change from $20: 20 - 12 = $8.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Two-step problems",
      "skill": "Solve a two-step money problem with multiplication then subtraction",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 100,
      "tags": [
        "money",
        "two-step",
        "multiplication",
        "subtraction"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The town library had 268 books on the shelves on Monday. On Tuesday, 156 books that had been borrowed were returned to the shelves. How many books were on the shelves then?",
    "options": [
      {
        "id": "four-two-four",
        "text": "424"
      },
      {
        "id": "four-one-four",
        "text": "414"
      },
      {
        "id": "three-two-four",
        "text": "324"
      },
      {
        "id": "four-three-four",
        "text": "434"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "four-two-four"
    },
    "explanation": "Add the ones first: 8 + 6 = 14, so write 4 and carry 1 ten. Then the tens: 6 + 5 + 1 = 12, write 2 and carry 1 hundred. Then the hundreds: 2 + 1 + 1 = 4. That gives 424. Forgetting to carry a ten gives the wrong answer of 414.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Addition with regrouping",
      "skill": "Add 3-digit numbers with regrouping",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "addition",
        "regrouping",
        "library"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-002",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A baker made 342 bread rolls early in the morning. By lunchtime, 178 of the rolls had been sold. How many rolls were left?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 164,
      "tolerance": 0
    },
    "explanation": "Subtract using regrouping. In the ones, 2 is smaller than 8, so borrow a ten: 12 - 8 = 4. In the tens you now have 3, and 3 - 7 needs another borrow from the hundreds: 13 - 7 = 6. In the hundreds, 2 - 1 = 1. The rolls left are 164.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Subtraction with regrouping",
      "skill": "Subtract 3-digit numbers with regrouping",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "subtraction",
        "regrouping",
        "cooking"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows the sport each student in Class 3B chose to play at the carnival. Which sport was chosen by exactly 11 students?",
    "options": [
      {
        "id": "soccer",
        "text": "Soccer"
      },
      {
        "id": "cricket",
        "text": "Cricket"
      },
      {
        "id": "netball",
        "text": "Netball"
      },
      {
        "id": "swimming",
        "text": "Swimming"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e1-003-1",
        "type": "bar_chart",
        "altText": "A bar chart of sports chosen at a carnival: Soccer 14, Netball 9, Cricket 11, Swimming 6.",
        "data": {
          "labels": [
            "Soccer",
            "Netball",
            "Cricket",
            "Swimming"
          ],
          "values": [
            14,
            9,
            11,
            6
          ],
          "xAxisLabel": "Sport",
          "yAxisLabel": "Number of students"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cricket"
    },
    "explanation": "Find the bar whose height reaches the line for 11 on the side scale. Soccer reaches 14, Netball 9, Cricket 11 and Swimming 6, so the bar at exactly 11 is Cricket.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Interpreting bar charts",
      "skill": "Read a value from a bar chart",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "bar chart",
        "data",
        "sport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-004",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Each carton at the farm holds 6 eggs. A farmer completely fills 7 cartons. How many eggs are in the cartons altogether?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 42,
      "tolerance": 0
    },
    "explanation": "Equal groups mean you multiply. There are 7 groups of 6 eggs, so work out 7 x 6 = 42 eggs. You could also skip-count by six: 6, 12, 18, 24, 30, 36, 42.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Multiplication facts",
      "skill": "Multiply within 10x10 in a word problem",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "multiplication",
        "animals",
        "eggs"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the market stall, 48 stickers are shared equally among 8 children. How many stickers does each child get?",
    "options": [
      {
        "id": "five",
        "text": "5"
      },
      {
        "id": "seven",
        "text": "7"
      },
      {
        "id": "six",
        "text": "6"
      },
      {
        "id": "eight",
        "text": "8"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "six"
    },
    "explanation": "Sharing equally means dividing: 48 divided by 8. Think of the times table for eight until you reach 48, which is 8 x 6 = 48. So each child gets 6 stickers.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Division facts",
      "skill": "Divide within 10x10 in a word problem",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "division",
        "market",
        "sharing"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A netball game starts when the minute hand on the clock points to the 6 and the hour hand is halfway between the 3 and the 4. What time does the game start?",
    "options": [
      {
        "id": "half-past-four",
        "text": "4:30"
      },
      {
        "id": "half-past-six",
        "text": "6:30"
      },
      {
        "id": "quarter-past-three",
        "text": "3:15"
      },
      {
        "id": "half-past-three",
        "text": "3:30"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "half-past-three"
    },
    "explanation": "When the minute hand points to the 6 it is 30 minutes past the hour. The hour hand sitting halfway between 3 and 4 tells you the hour has not reached 4 yet, so it is still 3 o'clock plus 30 minutes: 3:30.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Telling time",
      "skill": "Read an analog clock to the nearest 5 minutes",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "time",
        "clock",
        "sport"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-007",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener plants seedlings in a pattern of numbers: 4, 11, 18, 25, ... Each number goes up by the same amount. What is the next number in the pattern?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 32,
      "tolerance": 0
    },
    "explanation": "Find the step by subtracting two numbers next to each other: 11 - 4 = 7, and 18 - 11 = 7, so the pattern adds 7 each time. Add 7 to the last number: 25 + 7 = 32.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number patterns",
      "skill": "Continue an increasing number pattern",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "patterns",
        "gardens",
        "counting"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "At the school fair, Mia buys a cold drink for $3.65 and pays with a $10 note. How much change should she receive? Write just the number of dollars, without the unit.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 6.35,
      "tolerance": 0,
      "instructions": "Write just the number of dollars, without the unit."
    },
    "explanation": "Change is what is left after paying, so subtract the cost from the money given: $10.00 - $3.65. Counting up from $3.65 to $4.00 is 35 cents, then $4.00 to $10.00 is $6.00, which totals $6.35.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Money and change",
      "skill": "Calculate change from a purchase under $20",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "money",
        "change",
        "fair"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Two points are marked with dots on the number line below. What is the difference between the two marked numbers?",
    "options": [
      {
        "id": "twenty",
        "text": "20"
      },
      {
        "id": "fifty",
        "text": "50"
      },
      {
        "id": "fifteen",
        "text": "15"
      },
      {
        "id": "ten",
        "text": "10"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e1-009-1",
        "type": "number_line",
        "altText": "A number line from 0 to 40 with ticks every 5. Dots are placed at 15 and 35.",
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
      "kind": "single_option",
      "optionId": "twenty"
    },
    "explanation": "Read each dot by counting the ticks, which go up in fives. The dots sit at 15 and 35. The difference is how far apart they are, so subtract: 35 - 15 = 20. Adding the two numbers instead would wrongly give 50.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number lines",
      "skill": "Find the difference between points on a number line",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "number line",
        "difference",
        "counting"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how much rain fell in four towns last week. Which town had the second-highest rainfall?",
    "options": [
      {
        "id": "yarra",
        "text": "Yarra"
      },
      {
        "id": "colac",
        "text": "Colac"
      },
      {
        "id": "bendigo",
        "text": "Bendigo"
      },
      {
        "id": "horsham",
        "text": "Horsham"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e1-010-1",
        "type": "table",
        "altText": "A table of weekly rainfall in millimetres: Yarra 40, Bendigo 25, Colac 33, Horsham 18.",
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
              "33"
            ],
            [
              "Horsham",
              "18"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "colac"
    },
    "explanation": "Put the rainfall amounts in order from largest to smallest: 40, 33, 25, 18. The largest is Yarra with 40, so the second-highest is the next one down, 33, which belongs to Colac.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Interpreting tables",
      "skill": "Compare and order values in a data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "table",
        "data",
        "weather"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-011",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Liam has three $2 coins and nothing else. He says he has enough money to buy a book that costs $7. Is Liam correct?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Work out how much three $2 coins are worth: 3 x $2 = $6. Since $6 is less than the $7 price, Liam does not have enough, so his statement is false.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Money totals",
      "skill": "Make and compare a money total under $20",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "money",
        "coins",
        "library"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-012",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On Saturday, 385 people visited the weekend markets. On Sunday, 267 people visited. How many people visited the markets across the two days altogether?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 652,
      "tolerance": 0
    },
    "explanation": "Add the two days. Ones: 5 + 7 = 12, write 2 and carry 1 ten. Tens: 8 + 6 + 1 = 15, write 5 and carry 1 hundred. Hundreds: 3 + 2 + 1 = 6. The total is 652 people.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Addition with regrouping",
      "skill": "Add 3-digit numbers with two regroupings",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "addition",
        "regrouping",
        "market"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "There are 5 rows of chairs set out in the hall for a concert. Each row has 9 chairs. How many chairs are there in total?",
    "options": [
      {
        "id": "fourteen",
        "text": "14"
      },
      {
        "id": "forty",
        "text": "40"
      },
      {
        "id": "forty-five",
        "text": "45"
      },
      {
        "id": "fifty-four",
        "text": "54"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "forty-five"
    },
    "explanation": "Rows of equal size mean multiply: 5 rows of 9 chairs is 5 x 9 = 45. Adding 5 and 9 instead gives 14, which is a common slip when the words 'in total' are read as 'add'.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Multiplication facts",
      "skill": "Multiply within 10x10 in a word problem",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "multiplication",
        "concert",
        "arrays"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-014",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many pieces of each fruit were sold at a stall on Saturday. How many more pears were sold than bananas?",
    "options": [],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e1-014-1",
        "type": "bar_chart",
        "altText": "A bar chart of fruit sold: Apples 24, Bananas 18, Pears 30, Mangoes 12.",
        "data": {
          "labels": [
            "Apples",
            "Bananas",
            "Pears",
            "Mangoes"
          ],
          "values": [
            24,
            18,
            30,
            12
          ],
          "xAxisLabel": "Fruit",
          "yAxisLabel": "Pieces sold"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 12,
      "tolerance": 0
    },
    "explanation": "Read the height of each bar: pears reach 30 and bananas reach 18. 'How many more' means find the difference, so subtract: 30 - 18 = 12 pears more than bananas.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Interpreting bar charts",
      "skill": "Compare two values on a bar chart",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "bar chart",
        "difference",
        "market"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-015",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A clock on the wall has its hour hand pointing straight at the 9 and its minute hand pointing straight at the 12. Priya says the time is quarter past 9. Is Priya correct?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "When the minute hand points to the 12 it is exactly on the hour, which reads 9 o'clock. Quarter past would need the minute hand on the 3. Because the minute hand is on the 12, not the 3, Priya is not correct.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Telling time",
      "skill": "Read an analog clock to the nearest 5 minutes",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "time",
        "clock",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A number pattern goes 2, 4, 8, 16, ... The numbers double each time. What is the next number in the pattern?",
    "options": [
      {
        "id": "eighteen",
        "text": "18"
      },
      {
        "id": "twenty-four",
        "text": "24"
      },
      {
        "id": "twenty",
        "text": "20"
      },
      {
        "id": "thirty-two",
        "text": "32"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "thirty-two"
    },
    "explanation": "This pattern is not adding the same amount each time; each number is doubled. Check: 2 doubled is 4, 4 doubled is 8, 8 doubled is 16. So double the last number: 16 + 16 = 32.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number patterns",
      "skill": "Continue a doubling pattern",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "patterns",
        "doubling",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In the number 486, the digit 8 stands for how much?",
    "options": [
      {
        "id": "eighty",
        "text": "80"
      },
      {
        "id": "eight",
        "text": "8"
      },
      {
        "id": "eight-hundred",
        "text": "800"
      },
      {
        "id": "forty-eight",
        "text": "48"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "eighty"
    },
    "explanation": "In 486 the 8 sits in the tens place, so it stands for 8 tens, which is 80. The 4 means 400 and the 6 means 6 ones.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Place value",
      "skill": "Understand the value of a digit in a 3-digit number",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "place value",
        "tens",
        "year 3 numeracy"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-002",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A netball team scored 67 goals across the season. Round 67 to the nearest 10.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 70,
      "tolerance": 0
    },
    "explanation": "67 sits between 60 and 70. Look at the ones digit, 7. Because 7 is 5 or more, round up to the next ten, which is 70.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Rounding",
      "skill": "Round a 2-digit number to the nearest 10",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "rounding",
        "nearest ten",
        "sport context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-003",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener plants 12 seedlings in a garden bed. One third of them are tomato plants. How many seedlings are tomato plants?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 4,
      "tolerance": 0
    },
    "explanation": "One third means sharing the 12 seedlings into 3 equal groups. 12 divided by 3 is 4, so one third of 12 is 4 tomato plants.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Fractions of a group",
      "skill": "Find a unit fraction (one third) of a whole group",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "fractions",
        "thirds",
        "garden context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-004",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The number line shows two marked points. What is the difference between the larger marked number and the smaller marked number?",
    "options": [],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e2-004-1",
        "type": "number_line",
        "altText": "A number line from 0 to 40 with a tick every 5. Two dots mark the values 15 and 35.",
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
    "explanation": "Each step on the line is worth 5. Counting the ticks, the two dots sit at 15 and 35. The difference is 35 minus 15, which is 20.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Number line",
      "skill": "Read values on a number line and find a difference",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "number line",
        "difference",
        "counting by fives"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how much rain fell in four towns last month. Which town had the most rain?",
    "options": [
      {
        "id": "yarra",
        "text": "Yarra"
      },
      {
        "id": "colac",
        "text": "Colac"
      },
      {
        "id": "bendigo",
        "text": "Bendigo"
      },
      {
        "id": "horsham",
        "text": "Horsham"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e2-005-1",
        "type": "table",
        "altText": "A table with columns Town and Rain in millimetres. Yarra 40, Bendigo 25, Colac 55, Horsham 30.",
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
      "kind": "single_option",
      "optionId": "colac"
    },
    "explanation": "Compare the numbers in the Rain column: 40, 25, 55 and 30. The largest amount is 55 mm, which is next to Colac, so Colac had the most rain.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Reading a table",
      "skill": "Read a simple table to compare values",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "table",
        "data",
        "weather context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Aiko draws a flat shape that has exactly 5 straight sides and 5 corners. What is the name of her shape?",
    "options": [
      {
        "id": "triangle",
        "text": "triangle"
      },
      {
        "id": "square",
        "text": "square"
      },
      {
        "id": "pentagon",
        "text": "pentagon"
      },
      {
        "id": "hexagon",
        "text": "hexagon"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "pentagon"
    },
    "explanation": "A flat shape with 5 straight sides and 5 corners is called a pentagon. A triangle has 3 sides, a square has 4, and a hexagon has 6.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "2D shapes",
      "skill": "Name a 2D shape from its number of sides and corners",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "2d shapes",
        "pentagon",
        "sides and corners"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which list shows the numbers 318, 183, 381 and 138 in order from smallest to largest?",
    "options": [
      {
        "id": "list-a",
        "text": "381, 318, 183, 138"
      },
      {
        "id": "list-c",
        "text": "138, 318, 183, 381"
      },
      {
        "id": "list-d",
        "text": "183, 138, 318, 381"
      },
      {
        "id": "list-b",
        "text": "138, 183, 318, 381"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "list-b"
    },
    "explanation": "Compare the hundreds digit first. 138 and 183 both start with 1, and 138 is the smaller of those two. Then come 318 and 381, and 318 is smaller. So the order is 138, 183, 318, 381.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Ordering numbers",
      "skill": "Order 3-digit numbers from smallest to largest",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "ordering",
        "compare numbers",
        "3-digit numbers"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which of these is the best estimate for the mass of one fresh apple?",
    "options": [
      {
        "id": "onefifty-g",
        "text": "150 g"
      },
      {
        "id": "five-kg",
        "text": "5 kg"
      },
      {
        "id": "fifteen-kg",
        "text": "15 kg"
      },
      {
        "id": "fivehundred-g",
        "text": "500 g"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "onefifty-g"
    },
    "explanation": "An apple fits in your hand and is light. 5 kg and 15 kg are far too heavy, like a bag of potatoes, and 500 g is heavier than a normal apple. About 150 g is the sensible estimate.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Mass",
      "skill": "Estimate mass using sensible standard units",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 55,
      "tags": [
        "mass",
        "estimation",
        "grams and kilograms"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-009",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bucket holds 8 litres of water. Priya fills it using a 2-litre jug. How many full jugs of water does she need to fill the bucket?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 4,
      "tolerance": 0
    },
    "explanation": "Each jug holds 2 litres, so count how many 2s make 8: 8 divided by 2 is 4. Priya needs 4 full jugs.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "Capacity",
      "skill": "Compare capacity using standard units and division",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 65,
      "tags": [
        "capacity",
        "litres",
        "division"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-010",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "For the same shape, one half is always larger than one quarter. Is this statement true or false?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "Splitting a shape into 2 equal parts gives bigger pieces than splitting the same shape into 4 equal parts. So one half of a shape is always larger than one quarter of that same shape. The statement is true.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Comparing fractions",
      "skill": "Compare the size of halves and quarters of one whole",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "fractions",
        "halves",
        "quarters"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-011",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "What number is 100 more than 356?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 456,
      "tolerance": 0
    },
    "explanation": "Adding 100 changes only the hundreds digit. 356 has 3 hundreds, and one more hundred makes 4 hundreds. The tens and ones stay the same, so the answer is 456.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Place value",
      "skill": "Add 100 to a 3-digit number using place value",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "place value",
        "hundreds",
        "mental addition"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-012",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A whole number rounds to 50 when it is rounded to the nearest 10. What is the smallest whole number it could be?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 45,
      "tolerance": 0
    },
    "explanation": "Whole numbers from 45 to 54 all round to 50. From 45 upward the ones digit is 5 or more, so it rounds up to 50, while 44 would round down to 40. The smallest that works is 45.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Rounding",
      "skill": "Reason backwards about rounding to the nearest 10",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "rounding",
        "reasoning",
        "nearest ten"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows how long each bus takes to travel its route. Which bus takes the longest time?",
    "options": [
      {
        "id": "red",
        "text": "Red"
      },
      {
        "id": "blue",
        "text": "Blue"
      },
      {
        "id": "green",
        "text": "Green"
      },
      {
        "id": "gold",
        "text": "Gold"
      }
    ],
    "visuals": [
      {
        "id": "visual-naplan-y3-numeracy-e2-013-1",
        "type": "table",
        "altText": "A table with columns Bus and Trip time in minutes. Red 25, Green 30, Blue 40, Gold 20.",
        "data": {
          "headers": [
            "Bus",
            "Trip time (min)"
          ],
          "rows": [
            [
              "Red",
              "25"
            ],
            [
              "Green",
              "30"
            ],
            [
              "Blue",
              "40"
            ],
            [
              "Gold",
              "20"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "blue"
    },
    "explanation": "Compare the trip times: 25, 30, 40 and 20 minutes. The largest is 40 minutes, which belongs to the Blue bus, so it takes the longest.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Statistics and Probability",
      "topic": "Reading a table",
      "skill": "Read a table to find the largest value",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "table",
        "data",
        "transport context"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-014",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Is this statement true or false? The number 703 is greater than 730.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "Both numbers have 7 hundreds, so compare the tens next. 703 has 0 tens and 730 has 3 tens, so 730 is the larger number. That makes the statement false.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Comparing numbers",
      "skill": "Compare 3-digit numbers using place value",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "compare numbers",
        "place value",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bag holds 20 marbles. One quarter of them are blue and the rest are red. How many marbles are red?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "number",
      "value": 15,
      "tolerance": 0
    },
    "explanation": "One quarter of 20 is 20 divided by 4, which is 5 blue marbles. The rest are red, so take them away: 20 minus 5 leaves 15 red marbles.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Number and algebra",
      "topic": "Fractions of a group",
      "skill": "Find a fraction of a group then the remaining part",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 85,
      "tags": [
        "fractions",
        "quarters",
        "two-step"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "naplan-y3-numeracy-e2-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "naplan_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A rectangle has more corners than a triangle. How many more corners does a rectangle have than a triangle?",
    "options": [
      {
        "id": "two",
        "text": "2"
      },
      {
        "id": "three",
        "text": "3"
      },
      {
        "id": "one",
        "text": "1"
      },
      {
        "id": "four",
        "text": "4"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "one"
    },
    "explanation": "A rectangle has 4 corners and a triangle has 3 corners. Subtract to compare: 4 minus 3 is 1, so a rectangle has 1 more corner than a triangle.",
    "metadata": {
      "subject": "numeracy",
      "strand": "Measurement and Geometry",
      "topic": "2D shapes",
      "skill": "Compare the number of corners of 2D shapes",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "2d shapes",
        "corners",
        "comparison"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
