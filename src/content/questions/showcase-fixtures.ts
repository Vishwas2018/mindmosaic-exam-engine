import { z } from "zod";

import { validateQuestionBank } from "@/features/exam-engine/validation";
import type { Question } from "@/schemas/question.schema";
import { visualSchema, type VisualAsset } from "@/schemas/visual.schema";

const meta = (
  overrides: Partial<{
    subject: "numeracy" | "reading" | "writing" | "language_conventions";
    strand: string;
    topic: string;
    difficulty: "easy" | "medium" | "challenging";
    estimatedTimeSeconds: number;
    marks: number;
  }>,
) => ({
  subject: overrides.subject ?? "numeracy",
  strand: overrides.strand ?? "Number",
  topic: overrides.topic ?? "General",
  difficulty: overrides.difficulty ?? "medium",
  marks: overrides.marks ?? 1,
  estimatedTimeSeconds: overrides.estimatedTimeSeconds ?? 75,
  tags: [],
  locale: "en-AU" as const,
  source: "original" as const,
  schemaVersion: 1,
});

/** One valid, original question per supported question type. */
export const showcaseQuestions: readonly Question[] = validateQuestionBank([
  {
    id: "showcase-multiple-choice",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "Which number is closest to 50?",
    instructions: "Choose one answer.",
    options: [
      { id: "n42", text: "42" },
      { id: "n48", text: "48" },
      { id: "n53", text: "53" },
      { id: "n61", text: "61" },
    ],
    answerKey: { kind: "single_option", optionId: "n48" },
    explanation:
      "48 is only 2 away from 50, while 42 is 8 away, 53 is 3 away and 61 is 11 away.",
    metadata: meta({ topic: "Rounding and estimating", difficulty: "easy" }),
  },
  {
    id: "showcase-multiple-select",
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "Select all of the even numbers.",
    options: [
      { id: "n12", text: "12" },
      { id: "n15", text: "15" },
      { id: "n20", text: "20" },
      { id: "n27", text: "27" },
      { id: "n34", text: "34" },
    ],
    answerKey: { kind: "multiple_options", optionIds: ["n12", "n20", "n34"] },
    explanation:
      "Even numbers end in 0, 2, 4, 6 or 8, so 12, 20 and 34 are even while 15 and 27 are odd.",
    metadata: meta({ topic: "Odd and even numbers", difficulty: "easy" }),
  },
  {
    id: "showcase-number-entry",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "What is 7 multiplied by 6?",
    instructions: "Enter a number.",
    answerKey: { kind: "number", value: 42, tolerance: 0 },
    explanation: "Seven groups of six make 42, because 7 x 6 = 42.",
    metadata: meta({ topic: "Multiplication facts", difficulty: "easy" }),
  },
  {
    id: "showcase-fill-blank",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    prompt: "Complete the sentence about 2D shapes.",
    interaction: {
      type: "fill_blank",
      segments: ["A triangle has ", " sides and a hexagon has ", " sides."],
      blanks: [
        { id: "triangle", label: "Number of triangle sides" },
        { id: "hexagon", label: "Number of hexagon sides" },
      ],
    },
    answerKey: {
      kind: "fill_blank",
      blanks: [
        { id: "triangle", acceptedAnswers: ["3", "three"] },
        { id: "hexagon", acceptedAnswers: ["6", "six"] },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "A triangle always has 3 straight sides and a hexagon always has 6 straight sides.",
    metadata: meta({ strand: "Geometry", topic: "Properties of shapes", difficulty: "easy" }),
  },
  {
    id: "showcase-dropdown",
    type: "dropdown",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "Choose the operation that makes each number sentence true.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "sentence-a",
          label: "3 ? 4 = 12",
          options: [
            { id: "add", text: "+" },
            { id: "sub", text: "-" },
            { id: "mult", text: "x" },
          ],
        },
        {
          id: "sentence-b",
          label: "10 ? 5 = 2",
          options: [
            { id: "add", text: "+" },
            { id: "div", text: "/" },
            { id: "mult", text: "x" },
          ],
        },
      ],
    },
    answerKey: {
      kind: "dropdown",
      fields: [
        { id: "sentence-a", correctOptionId: "mult" },
        { id: "sentence-b", correctOptionId: "div" },
      ],
    },
    explanation:
      "3 x 4 = 12 uses multiplication, and 10 / 5 = 2 uses division.",
    metadata: meta({ topic: "Number operations", difficulty: "medium" }),
  },
  {
    id: "showcase-true-false",
    type: "true_false",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "A square has four sides of equal length.",
    answerKey: { kind: "boolean", value: true },
    explanation:
      "A square is a special rectangle with four equal sides, so the statement is true.",
    metadata: meta({ strand: "Geometry", topic: "Properties of shapes", difficulty: "easy" }),
  },
  {
    id: "showcase-matching",
    type: "matching",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "Match each animal to its group.",
    interaction: {
      type: "matching",
      sources: [
        { id: "frog", text: "Frog" },
        { id: "snake", text: "Snake" },
        { id: "eagle", text: "Eagle" },
      ],
      targets: [
        { id: "amphibian", text: "Amphibian" },
        { id: "reptile", text: "Reptile" },
        { id: "bird", text: "Bird" },
        { id: "mammal", text: "Mammal" },
      ],
    },
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "frog", targetId: "amphibian" },
        { sourceId: "snake", targetId: "reptile" },
        { sourceId: "eagle", targetId: "bird" },
      ],
    },
    explanation:
      "Frogs are amphibians, snakes are reptiles and eagles are birds. Mammal is the extra group.",
    metadata: meta({ subject: "reading", strand: "Science link", topic: "Animal groups", difficulty: "medium" }),
  },
  {
    id: "showcase-ordering",
    type: "ordering",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "Put the numbers in order from smallest to largest.",
    interaction: {
      type: "ordering",
      items: [
        { id: "n42", text: "42" },
        { id: "n7", text: "7" },
        { id: "n88", text: "88" },
        { id: "n19", text: "19" },
      ],
    },
    answerKey: { kind: "ordering", optionIds: ["n7", "n19", "n42", "n88"] },
    explanation: "Ordered from smallest to largest the numbers are 7, 19, 42, 88.",
    metadata: meta({ topic: "Ordering numbers", difficulty: "easy" }),
  },
  {
    id: "showcase-short-answer",
    type: "short_answer",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "What is the name for the distance all the way around a 2D shape?",
    answerKey: {
      kind: "text",
      acceptableAnswers: ["perimeter", "the perimeter"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The perimeter is the total distance around the outside edges of a shape.",
    metadata: meta({ strand: "Measurement", topic: "Perimeter", difficulty: "medium" }),
  },
  {
    id: "showcase-reading-mcq",
    type: "reading_comprehension",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "Why did Mia water the seeds every morning?",
    stimulus: {
      title: "Mia's Garden",
      body: "Mia planted bean seeds in a sunny corner of the garden. Every morning before school she gave them a small drink of water. She knew the little seeds needed water and sunshine to grow into strong plants.",
      attribution: "MindMosaic original",
    },
    options: [
      { id: "grow", text: "So the seeds would grow into strong plants" },
      { id: "colour", text: "So the garden would change colour" },
      { id: "birds", text: "So birds would visit the garden" },
    ],
    answerKey: { kind: "single_option", optionId: "grow" },
    explanation:
      "The passage says the seeds needed water and sunshine to grow into strong plants.",
    metadata: meta({ subject: "reading", strand: "Comprehension", topic: "Finding details", difficulty: "easy" }),
  },
  {
    id: "showcase-reading-short",
    type: "reading_comprehension",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "In one word, what kind of plant did Mia grow?",
    stimulus: {
      title: "Mia's Garden",
      body: "Mia planted bean seeds in a sunny corner of the garden. Every morning before school she gave them a small drink of water. She knew the little seeds needed water and sunshine to grow into strong bean plants.",
      attribution: "MindMosaic original",
    },
    answerKey: {
      kind: "text",
      acceptableAnswers: ["bean", "beans", "bean plant"],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation: "The passage tells us Mia planted bean seeds and grew bean plants.",
    metadata: meta({ subject: "reading", strand: "Comprehension", topic: "Key detail", difficulty: "medium" }),
  },
  {
    id: "showcase-essay",
    type: "essay",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    prompt:
      "Write a short story about a day when everything went right. Use a clear beginning, middle and end.",
    instructions: "Plan your ideas, then write your story.",
    answerKey: {
      kind: "manual",
      rubric:
        "Award marks for a clear structure, interesting word choices, correct punctuation and a story that stays on topic.",
      minWords: 80,
      maxWords: 250,
    },
    explanation:
      "This extended response is marked by a teacher against the writing rubric.",
    metadata: meta({ subject: "writing", strand: "Narrative", topic: "Story writing", difficulty: "challenging", marks: 6, estimatedTimeSeconds: 900 }),
  },
  {
    id: "showcase-label-diagram",
    type: "label_diagram",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "Choose the correct position on the diagram for each plant part.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "leaf", text: "Leaf" },
        { id: "stem", text: "Stem" },
        { id: "roots", text: "Roots" },
      ],
      targets: [
        { id: "top", label: "Position 1 (top)" },
        { id: "middle", label: "Position 2 (middle)" },
        { id: "bottom", label: "Position 3 (bottom)" },
      ],
    },
    visuals: [
      {
        id: "plant-diagram",
        type: "labelled_svg",
        title: "Parts of a plant",
        altText:
          "A plant diagram with a leaf marked 1 at the top, a stem marked 2 in the middle and roots marked 3 at the bottom.",
        data: {
          width: 240,
          height: 260,
          elements: [
            { id: "stem", kind: "line", x1: 120, y1: 80, x2: 120, y2: 190, stroke: "#2E8B7F" },
            { id: "leaf", kind: "polygon", points: [{ x: 120, y: 110 }, { x: 170, y: 95 }, { x: 130, y: 130 }], fill: "#8FD3A5" },
            { id: "roots1", kind: "line", x1: 120, y1: 190, x2: 95, y2: 225, stroke: "#8B5E34" },
            { id: "roots2", kind: "line", x1: 120, y1: 190, x2: 145, y2: 225, stroke: "#8B5E34" },
          ],
          labels: [
            { text: "1", x: 176, y: 92, targetId: "top" },
            { text: "2", x: 106, y: 150, targetId: "middle" },
            { text: "3", x: 120, y: 240, targetId: "bottom" },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "leaf", targetId: "top" },
        { sourceId: "stem", targetId: "middle" },
        { sourceId: "roots", targetId: "bottom" },
      ],
    },
    explanation:
      "The leaf is at position 1, the stem is at position 2 and the roots are at position 3.",
    metadata: meta({ subject: "reading", strand: "Science link", topic: "Plant parts", difficulty: "medium" }),
  },
  {
    id: "showcase-hotspot",
    type: "hotspot",
    yearLevel: 3,
    examStyle: "naplan_style",
    status: "published",
    prompt: "Select the largest circle.",
    visuals: [
      {
        id: "circle-sizes",
        type: "hotspot_svg",
        title: "Three circles",
        altText:
          "Three circles in a row: a small circle, a large circle and a medium circle.",
        data: {
          width: 320,
          height: 160,
          elements: [
            { id: "bg", kind: "rectangle", x: 0, y: 0, width: 320, height: 160, fill: "#FFFFFF" },
          ],
          regions: [
            { id: "small", shape: "circle", accessibleLabel: "Small circle", cx: 60, cy: 80, r: 26 },
            { id: "large", shape: "circle", accessibleLabel: "Large circle", cx: 165, cy: 80, r: 52 },
            { id: "medium", shape: "circle", accessibleLabel: "Medium circle", cx: 275, cy: 80, r: 36 },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["large"] },
    explanation: "The middle circle has the biggest radius, so it is the largest.",
    metadata: meta({ strand: "Measurement", topic: "Comparing size", difficulty: "easy" }),
  },
  {
    id: "showcase-drag-drop",
    type: "drag_drop",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    prompt: "Sort each number into the correct group.",
    interaction: {
      type: "drag_drop",
      items: [
        { id: "n4", text: "4" },
        { id: "n7", text: "7" },
        { id: "n10", text: "10" },
      ],
      zones: [
        { id: "odd", label: "Odd numbers" },
        { id: "even", label: "Even numbers" },
      ],
    },
    answerKey: {
      kind: "drag_drop",
      placements: { n4: "even", n7: "odd", n10: "even" },
    },
    explanation: "4 and 10 are even, while 7 is odd.",
    metadata: meta({ topic: "Odd and even numbers", difficulty: "easy" }),
  },
]);

/** One valid, original visual per supported visual type. */
export const showcaseVisuals: readonly VisualAsset[] = z.array(visualSchema).parse([
  {
    id: "vis-bar-chart",
    type: "bar_chart",
    title: "Favourite fruits in Year 3",
    altText:
      "Bar chart showing apples 8, bananas 6, grapes 4 and oranges 5 as favourite fruits.",
    data: {
      labels: ["Apples", "Bananas", "Grapes", "Oranges"],
      values: [8, 6, 4, 5],
      xAxisLabel: "Fruit",
      yAxisLabel: "Number of students",
      maxValue: 10,
    },
  },
  {
    id: "vis-line-graph",
    type: "line_graph",
    title: "Midday temperature over a week",
    altText:
      "Line graph of midday temperature rising from 18 to a peak of 27 degrees then easing back to 22.",
    data: {
      points: [
        { x: 1, y: 18, label: "Mon" },
        { x: 2, y: 21, label: "Tue" },
        { x: 3, y: 25, label: "Wed" },
        { x: 4, y: 27, label: "Thu" },
        { x: 5, y: 22, label: "Fri" },
      ],
      xAxisLabel: "Day",
      yAxisLabel: "Degrees C",
    },
  },
  {
    id: "vis-pie-chart",
    type: "pie_chart",
    title: "How students travel to school",
    altText:
      "Pie chart showing walk 10, car 6, bus 5 and bike 4 as ways students travel to school.",
    data: {
      segments: [
        { label: "Walk", value: 10 },
        { label: "Car", value: 6 },
        { label: "Bus", value: 5 },
        { label: "Bike", value: 4 },
      ],
    },
  },
  {
    id: "vis-table",
    type: "table",
    title: "Rainfall by month",
    altText: "Table of rainfall in millimetres for March, April and May.",
    data: {
      headers: ["Month", "Rainfall (mm)"],
      rows: [
        ["March", 42],
        ["April", 58],
        ["May", 71],
      ],
      rowHeaders: true,
    },
  },
  {
    id: "vis-number-line",
    type: "number_line",
    title: "Number line from 0 to 10",
    altText: "A number line from 0 to 10 with 3 and 7 marked.",
    data: { min: 0, max: 10, step: 1, highlightedValues: [3, 7] },
  },
  {
    id: "vis-geometry",
    type: "geometry_shape",
    title: "Rectangle with dimensions",
    altText: "A rectangle labelled 8 centimetres long and 5 centimetres wide.",
    data: {
      shape: "rectangle",
      measurements: [
        { label: "Length", value: 8, unit: "cm" },
        { label: "Width", value: 5, unit: "cm" },
      ],
    },
  },
  {
    id: "vis-coordinate-grid",
    type: "coordinate_grid",
    title: "Points on a grid",
    altText: "A coordinate grid showing point A at 2, 3 and point B at 4, 1.",
    data: {
      xRange: [0, 6],
      yRange: [0, 6],
      gridStep: 1,
      points: [
        { x: 2, y: 3, label: "A" },
        { x: 4, y: 1, label: "B" },
      ],
    },
  },
  {
    id: "vis-fraction",
    type: "fraction_model",
    title: "Three quarters shaded",
    altText: "A bar split into four equal parts with three parts shaded.",
    data: { numerator: 3, denominator: 4, model: "bar" },
  },
  {
    id: "vis-labelled-svg",
    type: "labelled_svg",
    title: "Parts of a plant",
    altText: "A simple plant diagram with a leaf, a stem and roots labelled.",
    data: {
      width: 240,
      height: 240,
      elements: [
        { id: "stem", kind: "line", x1: 120, y1: 70, x2: 120, y2: 180, stroke: "#2E8B7F" },
        { id: "leaf", kind: "polygon", points: [{ x: 120, y: 100 }, { x: 168, y: 88 }, { x: 130, y: 120 }], fill: "#8FD3A5" },
      ],
      labels: [
        { text: "Leaf", x: 178, y: 84 },
        { text: "Stem", x: 150, y: 150 },
      ],
    },
  },
  {
    id: "vis-hotspot-svg",
    type: "hotspot_svg",
    title: "Shapes to select",
    altText: "A diagram with a square and a triangle that can be selected.",
    data: {
      width: 300,
      height: 160,
      elements: [
        { id: "bg", kind: "rectangle", x: 0, y: 0, width: 300, height: 160, fill: "#FFFFFF" },
      ],
      regions: [
        { id: "square", shape: "rectangle", accessibleLabel: "Square", x: 40, y: 40, width: 70, height: 70 },
        { id: "triangle", shape: "polygon", accessibleLabel: "Triangle", points: [{ x: 210, y: 120 }, { x: 250, y: 45 }, { x: 285, y: 120 }] },
      ],
    },
  },
]);
