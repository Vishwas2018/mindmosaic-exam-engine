import { defineQuestions } from "../helpers/create-question";

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
      { id: "apples", text: "Apples" },
      { id: "bananas", text: "Bananas" },
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
]);
