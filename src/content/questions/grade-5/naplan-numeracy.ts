import { defineQuestions } from "../helpers/create-question";

/**
 * Grade 5 NAPLAN-style Numeracy — 16 original questions.
 * Every question carries exactly one deterministic visual.
 */
export const grade5NaplanNumeracy = defineQuestions([
  {
    id: "g5-nap-num-data-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Which lunchtime activity was chosen by exactly one quarter of the students?",
    instructions: "There are 24 students in total. Use the pie chart.",
    options: [
      { id: "art", text: "Art" },
      { id: "sport", text: "Sport" },
      { id: "music", text: "Music" },
      { id: "chess", text: "Chess" },
    ],
    visuals: [
      {
        id: "g5-lunch-activities-pie",
        type: "pie_chart",
        title: "Lunchtime activities of 24 students",
        altText:
          "Pie chart of 24 students showing sport chosen by 12, art by 6, music by 3 and chess by 3.",
        data: {
          segments: [
            { label: "Sport", value: 12 },
            { label: "Art", value: 6 },
            { label: "Music", value: 3 },
            { label: "Chess", value: 3 },
          ],
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "art" },
    explanation:
      "One quarter of 24 is 24 ÷ 4 = 6. Art was chosen by 6 students, so art is one quarter. Sport, with 12 students, is one half.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Fractions in a pie chart",
      skill: "Relating fractions to data",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["pie-chart", "fractions"],
    },
  },
  {
    id: "g5-nap-num-space-001",
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Which point is at position (3, 4)?",
    instructions:
      "The first number counts across from 0. The second number counts up from 0.",
    options: [
      { id: "point-p", text: "P" },
      { id: "point-q", text: "Q" },
      { id: "point-r", text: "R" },
      { id: "point-s", text: "S" },
    ],
    visuals: [
      {
        id: "g5-coordinates-grid",
        type: "coordinate_grid",
        title: "Four points on a grid",
        altText:
          "Coordinate grid from 0 to 8 on both axes with point P at (3, 4), point Q at (4, 3), point R at (6, 2) and point S at (2, 6).",
        data: {
          xRange: [0, 8],
          yRange: [0, 8],
          points: [
            { x: 3, y: 4, label: "P" },
            { x: 4, y: 3, label: "Q" },
            { x: 6, y: 2, label: "R" },
            { x: 2, y: 6, label: "S" },
          ],
          gridStep: 1,
        },
      },
    ],
    answerKey: { kind: "single_option", optionId: "point-p" },
    explanation:
      "Position (3, 4) means 3 across and 4 up, which is point P. Point Q at (4, 3) swaps the two numbers, so it is a different position.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Coordinates",
      skill: "Reading coordinate pairs",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["coordinates", "grid"],
    },
  },
  {
    id: "g5-nap-num-data-002",
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select all the days when more than 20 millimetres of rain fell.",
    instructions: "Use the bar chart. Choose every correct answer.",
    options: [
      { id: "day-mon", text: "Monday" },
      { id: "day-tue", text: "Tuesday" },
      { id: "day-wed", text: "Wednesday" },
      { id: "day-thu", text: "Thursday" },
      { id: "day-fri", text: "Friday" },
    ],
    visuals: [
      {
        id: "g5-rainfall-bar",
        type: "bar_chart",
        title: "Rainfall this week",
        altText:
          "Bar chart showing rainfall of 18 millimetres on Monday, 24 on Tuesday, 12 on Wednesday, 30 on Thursday and 20 on Friday.",
        data: {
          labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          values: [18, 24, 12, 30, 20],
          xAxisLabel: "Day",
          yAxisLabel: "Rainfall in millimetres",
          maxValue: 35,
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["day-tue", "day-thu"],
    },
    explanation:
      "Tuesday had 24 mm and Thursday had 30 mm, both more than 20 mm. Friday had exactly 20 mm, which is not more than 20, and Monday and Wednesday were below 20.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Comparing data with a benchmark",
      skill: "Reading values against a threshold",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["bar-chart", "comparison"],
    },
  },
  {
    id: "g5-nap-num-number-001",
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select all the marked decimals that are less than 3.5.",
    instructions: "Use the number line. Choose every correct answer.",
    options: [
      { id: "dec-2-3", text: "2.3" },
      { id: "dec-2-8", text: "2.8" },
      { id: "dec-3-1", text: "3.1" },
      { id: "dec-3-6", text: "3.6" },
      { id: "dec-4-2", text: "4.2" },
    ],
    visuals: [
      {
        id: "g5-decimals-line",
        type: "number_line",
        title: "Marked decimals",
        altText:
          "Number line from 2 to 5 with marks every 0.5 units. The decimals 2.3, 2.8, 3.1, 3.6 and 4.2 are highlighted.",
        data: {
          min: 2,
          max: 5,
          step: 0.5,
          highlightedValues: [2.3, 2.8, 3.1, 3.6, 4.2],
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["dec-2-3", "dec-2-8", "dec-3-1"],
    },
    explanation:
      "The decimals 2.3, 2.8 and 3.1 all sit to the left of 3.5 on the number line, so they are less than 3.5. The decimals 3.6 and 4.2 are greater than 3.5.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Comparing decimals",
      skill: "Ordering decimals on a number line",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["decimals", "number-line"],
    },
  },
  {
    id: "g5-nap-num-data-003",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "How many cans did the class collect in total over the four weeks?",
    instructions: "Use the bar chart. Enter a number.",
    visuals: [
      {
        id: "g5-cans-bar",
        type: "bar_chart",
        title: "Cans collected for recycling",
        altText:
          "Bar chart showing 35 cans collected in week 1, 42 in week 2, 28 in week 3 and 45 in week 4.",
        data: {
          labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
          values: [35, 42, 28, 45],
          xAxisLabel: "Week",
          yAxisLabel: "Number of cans",
          maxValue: 50,
        },
      },
    ],
    answerKey: { kind: "number", value: 150, tolerance: 0 },
    explanation:
      "Adding the four weeks gives 35 + 42 + 28 + 45 = 150 cans in total.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Totalling data",
      skill: "Adding values from a bar chart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["bar-chart", "addition"],
    },
  },
  {
    id: "g5-nap-num-money-001",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "An adult and two children go to the cinema and buy one snack combo. What is the total cost in dollars?",
    instructions: "Use the price table. Enter a number of dollars.",
    visuals: [
      {
        id: "g5-cinema-price-table",
        type: "table",
        title: "Cinema prices",
        altText:
          "Table listing cinema prices: adult ticket 16 dollars, child ticket 9 dollars, snack combo 7 dollars.",
        data: {
          headers: ["Item", "Price in dollars"],
          rows: [
            ["Adult ticket", 16],
            ["Child ticket", 9],
            ["Snack combo", 7],
          ],
          rowHeaders: true,
        },
      },
    ],
    answerKey: { kind: "number", value: 41, tolerance: 0, unit: "dollars" },
    explanation:
      "One adult ticket costs $16, two child tickets cost 2 × $9 = $18, and the snack combo costs $7. The total is 16 + 18 + 7 = $41.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Money problems",
      skill: "Solving multi-step money problems",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["money", "multi-step"],
    },
  },
  {
    id: "g5-nap-num-number-002",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "What decimal is highlighted on the number line?",
    instructions: "The number line counts by tenths. Enter a decimal.",
    visuals: [
      {
        id: "g5-tenths-line",
        type: "number_line",
        title: "A decimal between 2 and 3",
        altText:
          "Number line from 2 to 3 with marks every 0.1 units. The value 2.6 is highlighted.",
        data: {
          min: 2,
          max: 3,
          step: 0.1,
          highlightedValues: [2.6],
        },
      },
    ],
    answerKey: { kind: "number", value: 2.6, tolerance: 0 },
    explanation:
      "Counting by tenths from 2 gives 2.1, 2.2, 2.3, 2.4, 2.5, 2.6. The highlighted mark is six tenths past 2, which is 2.6.",
    metadata: {
      subject: "numeracy",
      strand: "Number",
      topic: "Decimals",
      skill: "Reading decimals on a number line",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["decimals", "number-line"],
    },
  },
  {
    id: "g5-nap-num-space-002",
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "How many units apart are point A and point B?",
    instructions:
      "Both points sit on the same horizontal line. Count the units between them.",
    visuals: [
      {
        id: "g5-distance-grid",
        type: "coordinate_grid",
        title: "Two points on a grid",
        altText:
          "Coordinate grid from 0 to 6 on both axes with point A at (1, 2) and point B at (5, 2).",
        data: {
          xRange: [0, 6],
          yRange: [0, 6],
          points: [
            { x: 1, y: 2, label: "A" },
            { x: 5, y: 2, label: "B" },
          ],
          gridStep: 1,
        },
      },
    ],
    answerKey: { kind: "number", value: 4, tolerance: 0, unit: "units" },
    explanation:
      "Point A is at (1, 2) and point B is at (5, 2). They share the same height, so the distance is 5 − 1 = 4 units.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Distance on a grid",
      skill: "Finding horizontal distance between points",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["coordinates", "distance"],
    },
  },
  {
    id: "g5-nap-num-measure-001",
    type: "fill_blank",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Complete the sentence about this rectangle.",
    instructions: "Use the measurements on the shape. Write a number in each box.",
    interaction: {
      type: "fill_blank",
      segments: [
        "The perimeter of the rectangle is ",
        " centimetres and its area is ",
        " square centimetres.",
      ],
      blanks: [
        { id: "perimeter", label: "Perimeter in centimetres" },
        { id: "area", label: "Area in square centimetres" },
      ],
    },
    visuals: [
      {
        id: "g5-rectangle-measure",
        type: "geometry_shape",
        title: "A rectangle",
        altText:
          "A rectangle with a length of 8 centimetres and a width of 5 centimetres.",
        data: {
          shape: "rectangle",
          measurements: [
            { label: "Length", value: 8, unit: "cm" },
            { label: "Width", value: 5, unit: "cm" },
          ],
        },
      },
    ],
    answerKey: {
      kind: "fill_blank",
      blanks: [
        { id: "perimeter", acceptedAnswers: ["26"] },
        { id: "area", acceptedAnswers: ["40"] },
      ],
      caseSensitive: false,
      trimWhitespace: true,
    },
    explanation:
      "The perimeter is 8 + 5 + 8 + 5 = 26 centimetres. The area is 8 × 5 = 40 square centimetres.",
    metadata: {
      subject: "numeracy",
      strand: "Measurement",
      topic: "Perimeter and area",
      skill: "Calculating perimeter and area of a rectangle",
      difficulty: "challenging",
      marks: 2,
      estimatedTimeSeconds: 150,
      tags: ["perimeter", "area"],
    },
  },
  {
    id: "g5-nap-num-data-004",
    type: "dropdown",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Use the table of pool visitors to answer both parts.",
    instructions: "Pick one answer in each box.",
    interaction: {
      type: "dropdown",
      fields: [
        {
          id: "busiest-day",
          label: "Which day had the most visitors?",
          options: [
            { id: "busiest-mon", text: "Monday" },
            { id: "busiest-tue", text: "Tuesday" },
            { id: "busiest-wed", text: "Wednesday" },
            { id: "busiest-thu", text: "Thursday" },
          ],
        },
        {
          id: "difference",
          label: "How many more visitors came on Wednesday than on Tuesday?",
          options: [
            { id: "diff-35", text: "35" },
            { id: "diff-45", text: "45" },
            { id: "diff-55", text: "55" },
          ],
        },
      ],
    },
    visuals: [
      {
        id: "g5-pool-visitors-table",
        type: "table",
        title: "Visitors to the pool",
        altText:
          "Table showing pool visitors: 120 on Monday, 95 on Tuesday, 140 on Wednesday and 85 on Thursday.",
        data: {
          headers: ["Day", "Number of visitors"],
          rows: [
            ["Monday", 120],
            ["Tuesday", 95],
            ["Wednesday", 140],
            ["Thursday", 85],
          ],
          rowHeaders: true,
        },
      },
    ],
    answerKey: {
      kind: "dropdown",
      fields: [
        { id: "busiest-day", correctOptionId: "busiest-wed" },
        { id: "difference", correctOptionId: "diff-45" },
      ],
    },
    explanation:
      "Wednesday's 140 visitors is the largest number in the table. The difference between Wednesday and Tuesday is 140 − 95 = 45 visitors.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Interpreting tables",
      skill: "Comparing values in a table",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["table", "subtraction"],
    },
  },
  {
    id: "g5-nap-num-geo-001",
    type: "true_false",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "True or false? This triangle is a right-angled triangle.",
    instructions: "Look carefully at the corner where the two short sides meet.",
    visuals: [
      {
        id: "g5-right-triangle",
        type: "geometry_shape",
        title: "A triangle",
        altText:
          "A triangle with corners at (0, 0), (4, 0) and (0, 3). The horizontal base and vertical side meet at a square corner.",
        data: {
          shape: "triangle",
          measurements: [
            { label: "Base", value: 4, unit: "cm" },
            { label: "Height", value: 3, unit: "cm" },
          ],
          vertices: [
            { x: 0, y: 0 },
            { x: 4, y: 0 },
            { x: 0, y: 3 },
          ],
        },
      },
    ],
    answerKey: { kind: "boolean", value: true },
    explanation:
      "The base runs straight across and the height runs straight up, meeting at a square corner of 90 degrees. A triangle with a 90-degree angle is right-angled, so the statement is true.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Types of triangles",
      skill: "Identifying right angles in shapes",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["angles", "triangles"],
    },
  },
  {
    id: "g5-nap-num-data-005",
    type: "matching",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each time of day to the temperature shown on the graph.",
    instructions: "Read the height of the line at each time.",
    interaction: {
      type: "matching",
      sources: [
        { id: "time-9am", text: "9 am" },
        { id: "time-12pm", text: "12 pm" },
        { id: "time-3pm", text: "3 pm" },
      ],
      targets: [
        { id: "temp-15", text: "15 °C" },
        { id: "temp-24", text: "24 °C" },
        { id: "temp-21", text: "21 °C" },
      ],
    },
    visuals: [
      {
        id: "g5-temps-line",
        type: "line_graph",
        title: "Temperature through the day",
        altText:
          "Line graph showing 15 degrees at 9 am, 24 degrees at 12 pm and 21 degrees at 3 pm.",
        data: {
          points: [
            { x: 9, y: 15, label: "9 am" },
            { x: 12, y: 24, label: "12 pm" },
            { x: 15, y: 21, label: "3 pm" },
          ],
          xAxisLabel: "Time of day",
          yAxisLabel: "Temperature in degrees Celsius",
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "time-9am", targetId: "temp-15" },
        { sourceId: "time-12pm", targetId: "temp-24" },
        { sourceId: "time-3pm", targetId: "temp-21" },
      ],
    },
    explanation:
      "The graph shows 15 °C at 9 am, rises to 24 °C at 12 pm, then falls to 21 °C at 3 pm.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Reading a line graph",
      skill: "Matching values on a line graph",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["line-graph", "temperature"],
    },
  },
  {
    id: "g5-nap-num-data-006",
    type: "ordering",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt:
      "Order the colours from the largest share of votes to the smallest share.",
    instructions: "Use the pie chart. Put the largest share first.",
    interaction: {
      type: "ordering",
      items: [
        { id: "colour-blue", text: "Blue" },
        { id: "colour-green", text: "Green" },
        { id: "colour-red", text: "Red" },
        { id: "colour-yellow", text: "Yellow" },
      ],
    },
    visuals: [
      {
        id: "g5-colours-pie",
        type: "pie_chart",
        title: "Favourite colours of 40 students",
        altText:
          "Pie chart of 40 students showing blue with 16 votes, green with 10, red with 8 and yellow with 6.",
        data: {
          segments: [
            { label: "Blue", value: 16 },
            { label: "Green", value: 10 },
            { label: "Red", value: 8 },
            { label: "Yellow", value: 6 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "ordering",
      optionIds: ["colour-blue", "colour-green", "colour-red", "colour-yellow"],
    },
    explanation:
      "Blue has 16 votes, green has 10, red has 8 and yellow has 6. From largest to smallest the order is blue, green, red, yellow.",
    metadata: {
      subject: "numeracy",
      strand: "Statistics",
      topic: "Comparing shares in a pie chart",
      skill: "Ordering data by size",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["pie-chart", "ordering"],
    },
  },
  {
    id: "g5-nap-num-geo-002",
    type: "label_diagram",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label each angle in the picture with its correct type.",
    instructions:
      "A right angle is exactly 90 degrees. An acute angle is smaller than 90 degrees. An obtuse angle is larger than 90 degrees.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-right", text: "Right angle" },
        { id: "label-acute", text: "Acute angle" },
        { id: "label-obtuse", text: "Obtuse angle" },
      ],
      targets: [
        { id: "target-left", label: "Left angle" },
        { id: "target-middle", label: "Middle angle" },
        { id: "target-right", label: "Right angle position" },
      ],
    },
    visuals: [
      {
        id: "g5-angles-svg",
        type: "labelled_svg",
        title: "Three angles",
        altText:
          "A picture of three angles: on the left, two lines meet at a square 90-degree corner; in the middle, two lines meet at a narrow angle smaller than 90 degrees; on the right, two lines meet at a wide angle larger than 90 degrees.",
        data: {
          width: 400,
          height: 150,
          elements: [
            {
              id: "left-angle-base",
              kind: "line",
              x1: 30,
              y1: 110,
              x2: 100,
              y2: 110,
              stroke: "#4B2E83",
            },
            {
              id: "left-angle-arm",
              kind: "line",
              x1: 30,
              y1: 110,
              x2: 30,
              y2: 40,
              stroke: "#4B2E83",
            },
            {
              id: "middle-angle-base",
              kind: "line",
              x1: 165,
              y1: 110,
              x2: 235,
              y2: 110,
              stroke: "#1E7A46",
            },
            {
              id: "middle-angle-arm",
              kind: "line",
              x1: 165,
              y1: 110,
              x2: 220,
              y2: 60,
              stroke: "#1E7A46",
            },
            {
              id: "right-angle-base",
              kind: "line",
              x1: 300,
              y1: 110,
              x2: 370,
              y2: 110,
              stroke: "#B25E00",
            },
            {
              id: "right-angle-arm",
              kind: "line",
              x1: 300,
              y1: 110,
              x2: 255,
              y2: 55,
              stroke: "#B25E00",
            },
          ],
          labels: [
            { text: "Left", x: 65, y: 135 },
            { text: "Middle", x: 200, y: 135 },
            { text: "Right", x: 335, y: 135 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-right", targetId: "target-left" },
        { sourceId: "label-acute", targetId: "target-middle" },
        { sourceId: "label-obtuse", targetId: "target-right" },
      ],
    },
    explanation:
      "The left angle is a square corner of exactly 90 degrees, so it is a right angle. The middle angle is narrower than 90 degrees, so it is acute. The angle on the right opens wider than 90 degrees, so it is obtuse.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Types of angles",
      skill: "Classifying angles",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["angles", "labelling"],
    },
  },
  {
    id: "g5-nap-num-geo-003",
    type: "label_diagram",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Label the parts of the circle.",
    instructions:
      "The distance from the centre to the edge is the radius. A line across the circle through the centre is the diameter. The distance around the outside is the circumference.",
    interaction: {
      type: "label_diagram",
      labels: [
        { id: "label-radius", text: "Radius" },
        { id: "label-diameter", text: "Diameter" },
        { id: "label-circumference", text: "Circumference" },
      ],
      targets: [
        { id: "target-line-a", label: "Line A, from the centre to the edge" },
        { id: "target-line-b", label: "Line B, across the circle through the centre" },
        { id: "target-edge", label: "The edge of the circle" },
      ],
    },
    visuals: [
      {
        id: "g5-circle-parts-svg",
        type: "labelled_svg",
        title: "Parts of a circle",
        altText:
          "A circle with its centre marked. Line A runs from the centre up to the edge. Line B runs from one side of the circle to the other, passing through the centre. The curved edge of the circle is the circumference.",
        data: {
          width: 300,
          height: 240,
          elements: [
            {
              id: "circle-outline",
              kind: "circle",
              cx: 150,
              cy: 120,
              r: 90,
              fill: "#F3EEFB",
              stroke: "#4B2E83",
            },
            {
              id: "centre-dot",
              kind: "circle",
              cx: 150,
              cy: 120,
              r: 4,
              fill: "#4B2E83",
            },
            {
              id: "line-a-radius",
              kind: "line",
              x1: 150,
              y1: 120,
              x2: 150,
              y2: 30,
              stroke: "#1E7A46",
            },
            {
              id: "line-b-diameter",
              kind: "line",
              x1: 60,
              y1: 120,
              x2: 240,
              y2: 120,
              stroke: "#B25E00",
            },
          ],
          labels: [
            { text: "A", x: 160, y: 65 },
            { text: "B", x: 210, y: 110 },
          ],
        },
      },
    ],
    answerKey: {
      kind: "matching",
      pairs: [
        { sourceId: "label-radius", targetId: "target-line-a" },
        { sourceId: "label-diameter", targetId: "target-line-b" },
        { sourceId: "label-circumference", targetId: "target-edge" },
      ],
    },
    explanation:
      "Line A runs from the centre to the edge, so it is a radius. Line B crosses the whole circle through the centre, so it is the diameter. The distance around the outside edge is the circumference.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Parts of a circle",
      skill: "Naming parts of a circle",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 120,
      tags: ["circles", "labelling"],
    },
  },
  {
    id: "g5-nap-num-geo-004",
    type: "hotspot",
    yearLevel: 5,
    examStyle: "naplan_style",
    status: "published",
    origin: "original_seed",
    prompt: "Select the parallelogram.",
    instructions:
      "A parallelogram has two pairs of parallel sides. Click or tap one shape.",
    visuals: [
      {
        id: "g5-parallelogram-hotspot",
        type: "hotspot_svg",
        title: "Three shapes to compare",
        altText:
          "A picture of three shapes: a slanted four-sided parallelogram on the left, a triangle in the middle and a five-sided pentagon on the right.",
        data: {
          width: 420,
          height: 150,
          elements: [
            {
              id: "draw-parallelogram",
              kind: "polygon",
              points: [
                { x: 20, y: 110 },
                { x: 50, y: 40 },
                { x: 150, y: 40 },
                { x: 120, y: 110 },
              ],
              fill: "#D8CCEE",
              stroke: "#4B2E83",
            },
            {
              id: "draw-triangle",
              kind: "polygon",
              points: [
                { x: 225, y: 35 },
                { x: 180, y: 115 },
                { x: 270, y: 115 },
              ],
              fill: "#FFE1BF",
              stroke: "#B25E00",
            },
            {
              id: "draw-pentagon",
              kind: "polygon",
              points: [
                { x: 345, y: 30 },
                { x: 383, y: 58 },
                { x: 369, y: 103 },
                { x: 321, y: 103 },
                { x: 307, y: 58 },
              ],
              fill: "#CBE7D6",
              stroke: "#1E7A46",
            },
          ],
          labels: [],
          regions: [
            {
              id: "region-parallelogram",
              shape: "polygon",
              accessibleLabel: "Slanted four-sided shape on the left",
              points: [
                { x: 20, y: 110 },
                { x: 50, y: 40 },
                { x: 150, y: 40 },
                { x: 120, y: 110 },
              ],
            },
            {
              id: "region-triangle",
              shape: "polygon",
              accessibleLabel: "Triangle in the middle",
              points: [
                { x: 225, y: 35 },
                { x: 180, y: 115 },
                { x: 270, y: 115 },
              ],
            },
            {
              id: "region-pentagon",
              shape: "polygon",
              accessibleLabel: "Five-sided shape on the right",
              points: [
                { x: 345, y: 30 },
                { x: 383, y: 58 },
                { x: 369, y: 103 },
                { x: 321, y: 103 },
                { x: 307, y: 58 },
              ],
            },
          ],
        },
      },
    ],
    answerKey: { kind: "hotspot", regionIds: ["region-parallelogram"] },
    explanation:
      "The slanted four-sided shape has two pairs of parallel sides, which makes it a parallelogram. The triangle has three sides and the pentagon has five.",
    metadata: {
      subject: "numeracy",
      strand: "Geometry",
      topic: "Quadrilaterals",
      skill: "Identifying a parallelogram",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["shapes", "hotspot"],
    },
  },
]);
