import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 5 ICAS-style Mathematics — 8 original questions with a
 * reasoning and problem-solving flavour. Every question has one visual.
 */
export const grade5IcasMathematics = defineQuestions([
  {
    id: "g5-icas-math-data-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Which travel group is exactly twice the size of the walk group?",
    instructions: "The pie chart shows how 30 students travel to school.",
    options: [
      { id: "bus", text: "Bus" },
      { id: "car", text: "Car" },
      { id: "bike", text: "Bike" },
    ],
    visuals: [
      {
        id: "g5-travel-pie",
        type: "pie_chart",
        title: "How 30 students travel to school",
        altText:
          "Pie chart of 30 students showing car chosen by 15, bus by 10 and walk by 5. There is no bike section.",
        data: {
          segments: [
            { label: "Car", value: 15 },
            { label: "Bus", value: 10 },
            { label: "Walk", value: 5 },
          ],
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "bus" },
    explanation:
      "The walk group has 5 students. Twice 5 is 10, which matches the bus group. The car group, with 15 students, is three times the walk group.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Proportional reasoning with data",
      skill: "Comparing data multiplicatively",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["pie-chart", "multiplication"],
    },
  },
  {
    id: "g5-icas-math-data-002",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "What is the difference between the team's highest score and lowest score?",
    instructions: "Use the bar chart. Enter a number of points.",
    visuals: [
      {
        id: "g5-scores-bar",
        type: "bar_chart",
        title: "Points scored in four games",
        altText:
          "Bar chart showing 24 points scored in game 1, 31 in game 2, 18 in game 3 and 27 in game 4.",
        data: {
          labels: ["Game 1", "Game 2", "Game 3", "Game 4"],
          values: [24, 31, 18, 27],
          xAxisLabel: "Game",
          yAxisLabel: "Points scored",
          maxValue: 35,
        },
      },
    ],
    answerKey: { kind: "number", value: 13, tolerance: 0, unit: "points" },
    explanation:
      "The highest score is 31 points in game 2 and the lowest is 18 points in game 3. The difference is 31 − 18 = 13 points.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Range of a data set",
      skill: "Finding the difference between extremes",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["bar-chart", "subtraction"],
    },
  },
  {
    id: "g5-icas-math-pattern-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "The graph shows the beads needed for 1, 2, 3 and 4 bracelets. If the pattern continues, how many beads are needed for 6 bracelets?",
    instructions: "Work out the pattern rule first. Enter a number of beads.",
    visuals: [
      {
        id: "g5-beads-line",
        type: "line_graph",
        title: "Beads needed for bracelets",
        altText:
          "Line graph showing 6 beads for 1 bracelet, 12 beads for 2 bracelets, 18 beads for 3 bracelets and 24 beads for 4 bracelets.",
        data: {
          points: [
            { x: 1, y: 6, label: "1 bracelet" },
            { x: 2, y: 12, label: "2 bracelets" },
            { x: 3, y: 18, label: "3 bracelets" },
            { x: 4, y: 24, label: "4 bracelets" },
          ],
          xAxisLabel: "Number of bracelets",
          yAxisLabel: "Beads needed",
        },
      },
    ],
    answerKey: { kind: "number", value: 36, tolerance: 0, unit: "beads" },
    explanation:
      "Each bracelet needs 6 beads: the graph rises by 6 for every extra bracelet. For 6 bracelets the total is 6 × 6 = 36 beads.",
    metadata: {
      subject: "numeracy",
      strand: "Patterns",
      topic: "Number patterns",
      skill: "Extending a linear pattern",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["patterns", "line-graph", "multiplication"],
    },
  },
  {
    id: "g5-icas-math-measure-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "What is the area of this triangle in square centimetres?",
    instructions:
      "The area of a triangle is half of its base multiplied by its height. Enter a number.",
    visuals: [
      {
        id: "g5-triangle-area",
        type: "geometry_shape",
        title: "A triangle",
        altText:
          "A triangle with a base of 10 centimetres and a height of 4 centimetres.",
        data: {
          shape: "triangle",
          measurements: [
            { label: "Base", value: 10, unit: "cm" },
            { label: "Height", value: 4, unit: "cm" },
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 20,
      tolerance: 0,
      unit: "square centimetres",
    },
    explanation:
      "The area of a triangle is half of base times height: (10 × 4) ÷ 2 = 40 ÷ 2 = 20 square centimetres.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement",
      topic: "Area of a triangle",
      skill: "Calculating the area of a triangle",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["area", "triangles"],
    },
  },
  {
    id: "g5-icas-math-space-001",
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Select all the points whose first coordinate is greater than 3.",
    instructions:
      "The first coordinate counts across from 0. Choose every correct answer.",
    options: [
      { id: "point-k", text: "K" },
      { id: "point-l", text: "L" },
      { id: "point-m", text: "M" },
      { id: "point-n", text: "N" },
    ],
    visuals: [
      {
        id: "g5-xcoord-grid",
        type: "coordinate_grid",
        title: "Four points on a grid",
        altText:
          "Coordinate grid from 0 to 6 on both axes with point K at (1, 4), point L at (4, 1), point M at (5, 5) and point N at (2, 2).",
        data: {
          xRange: [0, 6],
          yRange: [0, 6],
          points: [
            { x: 1, y: 4, label: "K" },
            { x: 4, y: 1, label: "L" },
            { x: 5, y: 5, label: "M" },
            { x: 2, y: 2, label: "N" },
          ],
          gridStep: 1,
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["point-l", "point-m"],
    },
    explanation:
      "Point L is at (4, 1) and point M is at (5, 5); their first coordinates, 4 and 5, are greater than 3. Points K and N have first coordinates of 1 and 2.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Coordinates",
      skill: "Filtering points by coordinate",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["coordinates", "grid"],
    },
  },
  {
    id: "g5-icas-math-geo-001",
    type: "hotspot",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the acute angle.",
    instructions:
      "An acute angle is smaller than 90 degrees. Click or tap one angle in the picture.",
    visuals: [
      {
        id: "g5-acute-angle-hotspot",
        type: "hotspot_svg",
        title: "Three angles to compare",
        altText:
          "A picture of three angles: on the left, two lines meet at a square 90-degree corner; in the middle, two lines meet at a wide angle larger than 90 degrees; on the right, two lines meet at a narrow angle smaller than 90 degrees.",
        data: {
          width: 420,
          height: 150,
          elements: [
            { id: "left-base", kind: "line", x1: 30, y1: 110, x2: 105, y2: 110, stroke: "#4B2E83" },
            { id: "left-arm", kind: "line", x1: 30, y1: 110, x2: 30, y2: 35, stroke: "#4B2E83" },
            { id: "middle-base", kind: "line", x1: 175, y1: 110, x2: 250, y2: 110, stroke: "#B25E00" },
            { id: "middle-arm", kind: "line", x1: 175, y1: 110, x2: 125, y2: 55, stroke: "#B25E00" },
            { id: "right-base", kind: "line", x1: 320, y1: 110, x2: 395, y2: 110, stroke: "#1E7A46" },
            { id: "right-arm", kind: "line", x1: 320, y1: 110, x2: 380, y2: 65, stroke: "#1E7A46" },
          ],
          labels: [
            { text: "Left", x: 65, y: 135 },
            { text: "Middle", x: 200, y: 135 },
            { text: "Right", x: 355, y: 135 },
          ],
          regions: [
            {
              id: "region-right-angle",
              shape: "rectangle",
              accessibleLabel: "Left angle, a square corner",
              x: 20,
              y: 30,
              width: 95,
              height: 90,
            },
            {
              id: "region-obtuse-angle",
              shape: "rectangle",
              accessibleLabel: "Middle angle, opening wider than a square corner",
              x: 120,
              y: 45,
              width: 135,
              height: 75,
            },
            {
              id: "region-acute-angle",
              shape: "rectangle",
              accessibleLabel: "Right angle position, a narrow opening",
              x: 310,
              y: 55,
              width: 95,
              height: 65,
            },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["region-acute-angle"] },
    explanation:
      "The angle on the right opens less than 90 degrees, so it is acute. The left angle is exactly 90 degrees and the middle angle opens wider than 90 degrees.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Types of angles",
      skill: "Identifying acute angles",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["angles", "hotspot"],
    },
  },
  {
    id: "g5-icas-math-frac-001",
    type: "hotspot",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the rectangle that shows exactly one half shaded.",
    instructions: "Click or tap one rectangle in the picture.",
    visuals: [
      {
        id: "g5-half-shaded-hotspot",
        type: "hotspot_svg",
        title: "Three shaded rectangles",
        altText:
          "Three rectangles: the left rectangle is divided into 4 equal parts with 1 part shaded, the middle rectangle is divided into 2 equal parts with 1 part shaded, and the right rectangle is divided into 3 equal parts with 2 parts shaded.",
        data: {
          width: 420,
          height: 120,
          elements: [
            { id: "left-outline", kind: "rectangle", x: 20, y: 30, width: 100, height: 60, stroke: "#4B2E83" },
            { id: "left-shaded", kind: "rectangle", x: 20, y: 30, width: 25, height: 60, fill: "#D8CCEE", stroke: "#4B2E83" },
            { id: "left-div-1", kind: "line", x1: 45, y1: 30, x2: 45, y2: 90, stroke: "#4B2E83" },
            { id: "left-div-2", kind: "line", x1: 70, y1: 30, x2: 70, y2: 90, stroke: "#4B2E83" },
            { id: "left-div-3", kind: "line", x1: 95, y1: 30, x2: 95, y2: 90, stroke: "#4B2E83" },
            { id: "mid-outline", kind: "rectangle", x: 160, y: 30, width: 100, height: 60, stroke: "#1E7A46" },
            { id: "mid-shaded", kind: "rectangle", x: 160, y: 30, width: 50, height: 60, fill: "#CBE7D6", stroke: "#1E7A46" },
            { id: "mid-div-1", kind: "line", x1: 210, y1: 30, x2: 210, y2: 90, stroke: "#1E7A46" },
            { id: "right-outline", kind: "rectangle", x: 300, y: 30, width: 99, height: 60, stroke: "#B25E00" },
            { id: "right-shaded", kind: "rectangle", x: 300, y: 30, width: 66, height: 60, fill: "#FFE1BF", stroke: "#B25E00" },
            { id: "right-div-1", kind: "line", x1: 333, y1: 30, x2: 333, y2: 90, stroke: "#B25E00" },
            { id: "right-div-2", kind: "line", x1: 366, y1: 30, x2: 366, y2: 90, stroke: "#B25E00" },
          ],
          labels: [],
          regions: [
            {
              id: "region-quarter",
              shape: "rectangle",
              accessibleLabel: "Left rectangle with 1 of 4 parts shaded",
              x: 20,
              y: 30,
              width: 100,
              height: 60,
            },
            {
              id: "region-half",
              shape: "rectangle",
              accessibleLabel: "Middle rectangle with 1 of 2 parts shaded",
              x: 160,
              y: 30,
              width: 100,
              height: 60,
            },
            {
              id: "region-two-thirds",
              shape: "rectangle",
              accessibleLabel: "Right rectangle with 2 of 3 parts shaded",
              x: 300,
              y: 30,
              width: 99,
              height: 60,
            },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["region-half"] },
    explanation:
      "The middle rectangle is divided into 2 equal parts with 1 shaded, which is one half. The left rectangle shows one quarter and the right rectangle shows two thirds.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Fractions",
      skill: "Recognising one half in different models",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["fractions", "hotspot"],
    },
  },
  {
    id: "g5-icas-math-geo-002",
    type: "label_diagram",
    yearLevel: 5,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label the marked parts of the cube drawing.",
    instructions:
      "A face is a flat surface, an edge is where two faces meet, and a vertex is a corner point.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-face", text: "Face" },
        { id: "label-edge", text: "Edge" },
        { id: "label-vertex", text: "Vertex" },
      ],
      targets: [
        { id: "target-a", label: "Marker A, on the flat front surface" },
        { id: "target-b", label: "Marker B, on the line where two surfaces meet" },
        { id: "target-c", label: "Marker C, on a corner point" },
      ],
    },
    visuals: [
      {
        id: "g5-cube-parts-svg",
        type: "labelled_svg",
        title: "A drawing of a cube",
        altText:
          "A drawing of a cube. Marker A sits in the middle of the flat front surface. Marker B sits on the top front edge where two surfaces meet. Marker C sits on the top front left corner point.",
        data: {
          width: 300,
          height: 240,
          elements: [
            { id: "front-face", kind: "rectangle", x: 50, y: 80, width: 130, height: 130, fill: "#F3EEFB", stroke: "#4B2E83" },
            { id: "top-edge-back", kind: "line", x1: 100, y1: 30, x2: 230, y2: 30, stroke: "#4B2E83" },
            { id: "right-edge-back", kind: "line", x1: 230, y1: 30, x2: 230, y2: 160, stroke: "#4B2E83" },
            { id: "connect-top-left", kind: "line", x1: 50, y1: 80, x2: 100, y2: 30, stroke: "#4B2E83" },
            { id: "connect-top-right", kind: "line", x1: 180, y1: 80, x2: 230, y2: 30, stroke: "#4B2E83" },
            { id: "connect-bottom-right", kind: "line", x1: 180, y1: 210, x2: 230, y2: 160, stroke: "#4B2E83" },
            { id: "marker-a", kind: "circle", cx: 115, cy: 145, r: 9, fill: "#B25E00" },
            { id: "marker-b", kind: "circle", cx: 140, cy: 80, r: 9, fill: "#1E7A46" },
            { id: "marker-c", kind: "circle", cx: 50, cy: 80, r: 9, fill: "#4B2E83" },
          ],
          labels: [
            { text: "A", x: 115, y: 170 },
            { text: "B", x: 140, y: 65 },
            { text: "C", x: 32, y: 70 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-face", targetId: "target-a" },
        { sourceId: "label-edge", targetId: "target-b" },
        { sourceId: "label-vertex", targetId: "target-c" },
      ],
    },
    explanation:
      "Marker A sits on a flat surface, which is a face. Marker B sits on the line where two faces meet, which is an edge. Marker C sits on a corner point, which is a vertex.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "3D objects",
      skill: "Naming parts of 3D objects",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["3d-objects", "labelling"],
    },
  },
]);
