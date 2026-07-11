import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 3 ICAS-style Mathematics — 7 original questions with a
 * reasoning and problem-solving flavour. Every question has one visual.
 */
export const grade3IcasMathematics = defineQuestions([
  {
    id: "g3-icas-math-data-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "At what time was the temperature the highest?",
    instructions: "Use the line graph, then choose one answer.",
    options: [
      { id: "time-9", text: "9 am" },
      { id: "time-11", text: "11 am" },
      { id: "time-1", text: "1 pm" },
      { id: "time-3", text: "3 pm" },
    ],
    visuals: [
      {
        id: "g3-day-temperature-line",
        type: "line_graph",
        title: "Temperature during the day",
        altText:
          "Line graph showing 12 degrees at 9 am, 18 degrees at 11 am, 22 degrees at 1 pm and 19 degrees at 3 pm.",
        data: {
          points: [
            { x: 9, y: 12, label: "9 am" },
            { x: 11, y: 18, label: "11 am" },
            { x: 13, y: 22, label: "1 pm" },
            { x: 15, y: 19, label: "3 pm" },
          ],
          xAxisLabel: "Time of day",
          yAxisLabel: "Temperature in degrees Celsius",
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "time-1" },
    explanation:
      "The line reaches its highest point, 22 degrees, at 1 pm. Every other time shows a lower temperature.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Reading a line graph",
      skill: "Finding the maximum on a line graph",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["line-graph", "temperature"],
    },
  },
  {
    id: "g3-icas-math-measure-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "What is the perimeter of this rectangle in centimetres?",
    instructions: "Add up all four sides. Enter a number of centimetres.",
    visuals: [
      {
        id: "g3-rectangle-perimeter",
        type: "geometry_shape",
        title: "A rectangle",
        altText: "A rectangle with a length of 5 centimetres and a width of 3 centimetres.",
        data: {
          shape: "rectangle",
          measurements: [
            { label: "Length", value: 5, unit: "cm" },
            { label: "Width", value: 3, unit: "cm" },
          ],
        },
      },
    ],
    answerKey: { kind: "number", value: 16, tolerance: 0, unit: "cm" },
    explanation:
      "A rectangle has two lengths and two widths. The perimeter is 5 + 3 + 5 + 3 = 16 centimetres.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement",
      topic: "Perimeter",
      skill: "Calculating the perimeter of a rectangle",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["perimeter", "rectangle"],
    },
  },
  {
    id: "g3-icas-math-frac-001",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "The model shows one quarter of a set of 12 counters shaded. How many counters are shaded?",
    instructions: "Enter a number.",
    visuals: [
      {
        id: "g3-quarter-set-model",
        type: "fraction_model",
        title: "A set of counters",
        altText: "A set of 12 counters with 3 of them shaded, showing one quarter of the set.",
        data: {
          numerator: 3,
          denominator: 12,
          model: "set",
        },
      },
    ],
    answerKey: { kind: "number", value: 3, tolerance: 0 },
    explanation:
      "One quarter of 12 is 12 ÷ 4 = 3, so 3 counters are shaded in the model.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Fractions of a set",
      skill: "Finding a fraction of a collection",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["fractions", "division"],
    },
  },
  {
    id: "g3-icas-math-number-001",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select all the marked numbers that are multiples of 4.",
    instructions:
      "A multiple of 4 is a number you say when counting by fours. Choose every correct answer.",
    options: [
      { id: "num-4", text: "4" },
      { id: "num-6", text: "6" },
      { id: "num-8", text: "8" },
      { id: "num-14", text: "14" },
      { id: "num-16", text: "16" },
    ],
    visuals: [
      {
        id: "g3-multiples-line",
        type: "number_line",
        title: "Marked numbers",
        altText:
          "Number line from 0 to 20 with the numbers 4, 6, 8, 14 and 16 highlighted.",
        data: {
          min: 0,
          max: 20,
          step: 1,
          highlightedValues: [4, 6, 8, 14, 16],
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["num-4", "num-8", "num-16"],
    },
    explanation:
      "Counting by fours gives 4, 8, 12, 16, 20. Of the marked numbers, 4, 8 and 16 are multiples of 4, while 6 and 14 are not.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Multiples",
      skill: "Identifying multiples of 4",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["multiples", "number-line"],
    },
  },
  {
    id: "g3-icas-math-logic-001",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Order the children from youngest to oldest.",
    instructions: "Use the ages in the table. Put the youngest child first.",
    interaction: {
      type: "ordering",
      items: [
        { id: "child-ava", text: "Ava" },
        { id: "child-ben", text: "Ben" },
        { id: "child-chloe", text: "Chloe" },
        { id: "child-dev", text: "Dev" },
      ],
    },
    visuals: [
      {
        id: "g3-ages-table",
        type: "table",
        title: "Ages of four children",
        altText:
          "Table showing Ava is 9 years old, Ben is 7, Chloe is 10 and Dev is 8.",
        data: {
          headers: ["Child", "Age in years"],
          rows: [
            ["Ava", 9],
            ["Ben", 7],
            ["Chloe", 10],
            ["Dev", 8],
          ],
          rowHeaders: true,
        },
      },
    ],
    answerKey: {
      kind: "ordering",
      optionIds: ["child-ben", "child-dev", "child-ava", "child-chloe"],
    },
    explanation:
      "Ben is 7, Dev is 8, Ava is 9 and Chloe is 10. From youngest to oldest the order is Ben, Dev, Ava, Chloe.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Ordering numbers",
      skill: "Ordering values from a table",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["ordering", "table"],
    },
  },
  {
    id: "g3-icas-math-geo-001",
    type: "hotspot",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the shape that has no straight sides.",
    instructions: "Click or tap one shape in the picture.",
    visuals: [
      {
        id: "g3-no-straight-sides-hotspot",
        type: "hotspot_svg",
        title: "Three shapes to compare",
        altText:
          "A picture of three shapes: a triangle on the left, a circle in the middle and a square on the right.",
        data: {
          width: 380,
          height: 140,
          elements: [
            {
              id: "draw-triangle",
              kind: "polygon",
              points: [
                { x: 65, y: 30 },
                { x: 20, y: 110 },
                { x: 110, y: 110 },
              ],
              fill: "#FFE1BF",
              stroke: "#B25E00",
            },
            {
              id: "draw-circle",
              kind: "circle",
              cx: 190,
              cy: 72,
              r: 40,
              fill: "#CBE7D6",
              stroke: "#1E7A46",
            },
            {
              id: "draw-square",
              kind: "rectangle",
              x: 265,
              y: 35,
              width: 75,
              height: 75,
              fill: "#D8CCEE",
              stroke: "#4B2E83",
            },
          ],
          labels: [],
          regions: [
            {
              id: "region-triangle",
              shape: "polygon",
              accessibleLabel: "Triangle on the left",
              points: [
                { x: 65, y: 30 },
                { x: 20, y: 110 },
                { x: 110, y: 110 },
              ],
            },
            {
              id: "region-circle",
              shape: "circle",
              accessibleLabel: "Circle in the middle",
              cx: 190,
              cy: 72,
              r: 40,
            },
            {
              id: "region-square",
              shape: "rectangle",
              accessibleLabel: "Square on the right",
              x: 265,
              y: 35,
              width: 75,
              height: 75,
            },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["region-circle"] },
    explanation:
      "A circle is one smooth curve with no straight sides. The triangle has 3 straight sides and the square has 4.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Properties of shapes",
      skill: "Identifying curved and straight sides",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["shapes", "hotspot"],
    },
  },
  {
    id: "g3-icas-math-geo-002",
    type: "label_diagram",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label each shape with its correct name by counting its sides.",
    instructions:
      "A pentagon has 5 sides, a hexagon has 6 sides and an octagon has 8 sides.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-pentagon", text: "Pentagon" },
        { id: "label-hexagon", text: "Hexagon" },
        { id: "label-octagon", text: "Octagon" },
      ],
      targets: [
        { id: "target-left", label: "Left shape" },
        { id: "target-middle", label: "Middle shape" },
        { id: "target-right", label: "Right shape" },
      ],
    },
    visuals: [
      {
        id: "g3-polygons-svg",
        type: "labelled_svg",
        title: "Three polygons",
        altText:
          "A picture of three shapes in a row: a five-sided pentagon on the left, a six-sided hexagon in the middle and an eight-sided octagon on the right.",
        data: {
          width: 400,
          height: 150,
          elements: [
            {
              id: "shape-pentagon",
              kind: "polygon",
              points: [
                { x: 60, y: 30 },
                { x: 98, y: 58 },
                { x: 84, y: 103 },
                { x: 36, y: 103 },
                { x: 22, y: 58 },
              ],
              fill: "#D8CCEE",
              stroke: "#4B2E83",
            },
            {
              id: "shape-hexagon",
              kind: "polygon",
              points: [
                { x: 225, y: 70 },
                { x: 205, y: 105 },
                { x: 165, y: 105 },
                { x: 145, y: 70 },
                { x: 165, y: 35 },
                { x: 205, y: 35 },
              ],
              fill: "#CBE7D6",
              stroke: "#1E7A46",
            },
            {
              id: "shape-octagon",
              kind: "polygon",
              points: [
                { x: 350, y: 70 },
                { x: 338, y: 98 },
                { x: 310, y: 110 },
                { x: 282, y: 98 },
                { x: 270, y: 70 },
                { x: 282, y: 42 },
                { x: 310, y: 30 },
                { x: 338, y: 42 },
              ],
              fill: "#FFE1BF",
              stroke: "#B25E00",
            },
          ],
          labels: [
            { text: "Left", x: 60, y: 140 },
            { text: "Middle", x: 185, y: 140 },
            { text: "Right", x: 310, y: 140 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-pentagon", targetId: "target-left" },
        { sourceId: "label-hexagon", targetId: "target-middle" },
        { sourceId: "label-octagon", targetId: "target-right" },
      ],
    },
    explanation:
      "The left shape has 5 sides, so it is a pentagon. The middle shape has 6 sides, so it is a hexagon. The right shape has 8 sides, so it is an octagon.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Polygons",
      skill: "Naming polygons by side count",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["polygons", "labelling"],
    },
  },
]);
