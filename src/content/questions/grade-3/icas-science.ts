import { defineQuestions } from "../helpers/create-question";
import type { QuestionSeed } from "../types";

/**
 * Grade 3 ICAS-style Science — 35 hand-authored questions across the
 * Biological, Chemical, Physical and Earth and Space strands. NAPLAN does
 * not assess Science, so this programme is ICAS-only.
 */
export const grade3IcasScience = defineQuestions([
  {
    id: "icas-y3-science-b-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Meera is making an umbrella to keep the rain off her head. Which material is the best choice for the top of the umbrella?",
    options: [
      { id: "plastic", text: "thin waterproof plastic" },
      { id: "paper", text: "a piece of thin dry paper" },
      { id: "wool", text: "a woollen jumper" },
      { id: "metal", text: "a sheet of metal" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "plastic",
    },
    explanation: "An umbrella top must stop water and still be light and bendy so it can open and close. Waterproof plastic keeps the water out, while paper and wool both soak the rain up, and a metal sheet is too heavy and stiff to fold.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "Properties of everyday materials",
      skill: "Choosing a suitable material for a job",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["materials", "properties", "waterproof"],
    },
  },
  {
    id: "icas-y3-science-b-002",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A wooden building block keeps the same shape when you lift it out of a box and put it on a table. Is this statement true or false?",
    options: [],
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: true,
    },
    explanation: "Solids like a wooden block hold their own shape wherever you put them. Only liquids and gases change shape to fit their container, so the block stays the same shape on the table as it was in the box.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "States of matter",
      skill: "Recognising that solids keep their shape",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["solids", "liquids", "shape"],
    },
  },
  {
    id: "icas-y3-science-b-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Ravi leaves a hard chocolate bar on a sunny windowsill. After an hour it has turned soft and runny. What made the chocolate change?",
    options: [
      { id: "cold", text: "Cold from the window froze it" },
      { id: "heat", text: "Heat from the sun melted it" },
      { id: "dried", text: "The sun dried the water out of it" },
      { id: "soaked", text: "It soaked up rain from the air" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "heat",
    },
    explanation: "Melting is when heat turns a solid into a liquid. The sun warmed the chocolate until the solid turned runny. Cold would make it harder, not softer, and drying or soaking up rain would not turn a solid into liquid.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "Changes caused by heating",
      skill: "Melting: solids turning to liquid when heated",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["melting", "heat", "change"],
    },
  },
  {
    id: "icas-y3-science-b-004",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Tom stirs a spoon of sugar into a glass of warm water. The sugar seems to disappear, but the water tastes sweet. What has happened to the sugar?",
    options: [
      { id: "melted", text: "It has melted away" },
      { id: "floated", text: "It floated to the top" },
      { id: "dissolved", text: "It has dissolved in the water" },
      { id: "gone", text: "It has vanished" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "dissolved",
    },
    explanation: "When sugar dissolves it breaks into tiny bits that spread all through the water, so you cannot see it, but you can still taste it. The sugar is still there. Melting needs heat and is different, and the sugar has not floated or truly vanished.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "Mixing and dissolving",
      skill: "Dissolving a solid in water",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["dissolving", "mixing", "water"],
    },
  },
  {
    id: "icas-y3-science-b-005",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A push moves something away from you. Which of these actions use a PUSH force? Choose all that are correct.",
    options: [
      { id: "open-drawer", text: "Sliding a drawer towards you" },
      { id: "press-doorbell", text: "Pressing a doorbell button" },
      { id: "kick-football", text: "Kicking a football forwards" },
      { id: "pull-wagon", text: "Pulling a wagon by its handle" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["press-doorbell", "kick-football"],
    },
    explanation: "A push moves something away from you. Pressing a doorbell pushes the button in, and kicking pushes the ball forwards. Pulling a wagon and sliding a drawer towards you both bring things closer, so those are pulls, not pushes.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Forces",
      skill: "Identifying pushes and pulls",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["forces", "push", "pull"],
    },
  },
  {
    id: "icas-y3-science-b-006",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Priya rolled the same toy car down a ramp. Each time she raised the ramp higher and measured how far the car rolled. Look at her results table. How far did the car roll when the ramp was 30 cm high?",
    instructions: "Write just the number of centimetres, without the unit.",
    options: [],
    visuals: [
      {
        id: "visual-icas-y3-science-b-006-1",
        type: "table",
        altText: "Results table: ramp 10 cm rolled 40 cm, ramp 20 cm rolled 75 cm, ramp 30 cm rolled 110 cm, ramp 40 cm rolled 150 cm.",
        data: {
          headers: ["Ramp height (cm)", "Distance rolled (cm)"],
          rows: [
            ["10", "40"],
            ["20", "75"],
            ["30", "110"],
            ["40", "150"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 110,
      tolerance: 0,
      unit: "cm",
    },
    explanation: "Find the row where the ramp height is 30 cm, then read across to the distance column. The car rolled 110 cm from that ramp height.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Movement on ramps",
      skill: "Reading a value from a ramp results table",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["ramps", "movement", "table"],
    },
  },
  {
    id: "icas-y3-science-b-007",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Kai put four objects into a tub of water and wrote down what happened to each one. Look at the table. Which object sank?",
    options: [
      { id: "spoon", text: "Metal spoon" },
      { id: "cork", text: "Cork" },
      { id: "peg", text: "Wooden peg" },
      { id: "lid", text: "Plastic lid" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-science-b-007-1",
        type: "table",
        altText: "Table of what happened in water: Cork floated, Plastic lid floated, Metal spoon sank, Wooden peg floated.",
        data: {
          headers: ["Object", "What happened"],
          rows: [
            ["Cork", "Floated"],
            ["Plastic lid", "Floated"],
            ["Metal spoon", "Sank"],
            ["Wooden peg", "Floated"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "spoon",
    },
    explanation: "Read down the 'What happened' column and find the object marked 'Sank'. Only the metal spoon sank; the cork, plastic lid and wooden peg all floated.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Floating and sinking",
      skill: "Reading float and sink results from a table",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["floating", "sinking", "table"],
    },
  },
  {
    id: "icas-y3-science-b-008",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Lin holds a magnet close to four objects, one at a time. Which object will the magnet pull towards itself?",
    options: [
      { id: "button", text: "A plastic coat button" },
      { id: "clip", text: "A steel paperclip" },
      { id: "block", text: "A wooden block" },
      { id: "band", text: "A rubber band" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "clip",
    },
    explanation: "Magnets pull on things made of iron or steel. The paperclip is steel, so the magnet attracts it. Plastic, wood and rubber are not magnetic, so the magnet does not pull them at all.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Magnets",
      skill: "Knowing which materials a magnet attracts",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["magnets", "materials", "attract"],
    },
  },
  {
    id: "icas-y3-science-b-009",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sam plucks a guitar string. He hears a sound and sees the string shaking quickly. What makes the sound?",
    options: [
      { id: "colour", text: "The colour of the string" },
      { id: "still", text: "The string staying perfectly still" },
      { id: "vibrate", text: "The string vibrating quickly" },
      { id: "light", text: "The light shining on it" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "vibrate",
    },
    explanation: "Sounds are made when something vibrates, which means it shakes quickly back and forth. The shaking string pushes the air and carries the sound to Sam's ears. Colour, light and a still string do not make any sound.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Sound",
      skill: "Understanding that vibrations make sound",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["sound", "vibration", "energy"],
    },
  },
  {
    id: "icas-y3-science-b-010",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "On a sunny day Ava stands in the playground and sees a dark shadow on the ground behind her. Why does the shadow appear?",
    options: [
      { id: "moved", text: "The sun moved away" },
      { id: "makes", text: "Her body makes light" },
      { id: "paint", text: "The ground is dark paint" },
      { id: "blocks", text: "Her body blocks the sunlight" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "blocks",
    },
    explanation: "A shadow forms where an object stops light from reaching a surface. Ava's body blocks the sun's light, so the ground behind her stays dark. Her body does not make its own light, and the dark patch is a shadow, not paint.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Light and shadows",
      skill: "Explaining how shadows are formed",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["light", "shadow", "sun"],
    },
  },
  {
    id: "icas-y3-science-b-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Noah grew two bean plants to test whether light helps them grow. The table shows how he set each plant up. What did Noah change between the two plants?",
    options: [
      { id: "light", text: "The amount of light" },
      { id: "water", text: "The amount of water" },
      { id: "soil", text: "The type of soil" },
      { id: "pot", text: "The size of the pot" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-science-b-011-1",
        type: "table",
        altText: "Setup table: Light row shows Plant 1 on the windowsill and Plant 2 in a dark cupboard; water is 1 cup for both; soil is the same for both.",
        data: {
          headers: ["What we set up", "Plant 1", "Plant 2"],
          rows: [
            ["Light", "On the windowsill", "In a dark cupboard"],
            ["Water each day", "1 cup", "1 cup"],
            ["Soil", "Same soil", "Same soil"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "light",
    },
    explanation: "Look along each row for the thing that is different between Plant 1 and Plant 2. The water and the soil are the same for both plants; only the light is different (windowsill versus dark cupboard). That is the one thing Noah changed.",
    metadata: {
      subject: "science",
      strand: "Science inquiry",
      topic: "Fair testing",
      skill: "Identifying the variable that was changed",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["experiment", "variable", "fair test"],
    },
  },
  {
    id: "icas-y3-science-b-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Zara tested which paper towel soaks up the most water. She poured the same amount of water on each towel and used towels of the same size. Why did she keep those things the same?",
    options: [
      { id: "useup", text: "To use up all the water" },
      { id: "fair", text: "To make the test fair" },
      { id: "faster", text: "To make the test finish faster" },
      { id: "biggest", text: "To use the biggest towel" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "fair",
    },
    explanation: "In a fair test you change only one thing and keep everything else the same. By using the same amount of water and the same size towel, the only difference left is the kind of towel, so the result really shows which towel soaks up the most.",
    metadata: {
      subject: "science",
      strand: "Science inquiry",
      topic: "Fair testing",
      skill: "Explaining why some things are kept the same",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["experiment", "fair test", "controlled"],
    },
  },
  {
    id: "icas-y3-science-b-013",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The graph shows how tall Ben's sunflower was at the end of each week. What does the graph show about the sunflower?",
    options: [
      { id: "same", text: "It stayed the same" },
      { id: "smaller", text: "It got smaller" },
      { id: "taller", text: "It grew taller every week" },
      { id: "updown", text: "It went up then down" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-science-b-013-1",
        type: "line_graph",
        altText: "Line graph of sunflower height: Week 1 is 5 cm, Week 2 is 12 cm, Week 3 is 20 cm, Week 4 is 28 cm.",
        data: {
          points: [
            {
              x: 1,
              y: 5,
              label: "Week 1",
            },
            {
              x: 2,
              y: 12,
              label: "Week 2",
            },
            {
              x: 3,
              y: 20,
              label: "Week 3",
            },
            {
              x: 4,
              y: 28,
              label: "Week 4",
            },
          ],
          xAxisLabel: "Week",
          yAxisLabel: "Height (cm)",
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "taller",
    },
    explanation: "Read the height at the end of each week: 5, then 12, then 20, then 28 cm. Every point on the line is higher than the one before, so the sunflower grew taller every week. It never stayed level or dropped down.",
    metadata: {
      subject: "science",
      strand: "Science inquiry",
      topic: "Interpreting results",
      skill: "Drawing a conclusion from a line graph",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 70,
      tags: ["graph", "conclusion", "growth"],
    },
  },
  {
    id: "icas-y3-science-b-014",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Mia wants to test which ball bounces the highest. Put her steps in the correct order, from first to last.",
    options: [],
    interaction: {
      type: "ordering",
      items: [
        {
          id: "drop",
          text: "Drop each ball from the same height",
        },
        {
          id: "measure",
          text: "Measure how high each ball bounces",
        },
        {
          id: "record",
          text: "Write the bounce heights in a table",
        },
        {
          id: "decide",
          text: "Decide which ball bounced the highest",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["drop", "measure", "record", "decide"],
    },
    explanation: "First you do the test the same way each time by dropping each ball from the same height. Then you measure the bounce, then write the numbers down, and only after you have all the results can you decide which ball bounced highest.",
    metadata: {
      subject: "science",
      strand: "Science inquiry",
      topic: "Steps of a method",
      skill: "Ordering the steps of an investigation",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["method", "ordering", "investigation"],
    },
  },
  {
    id: "icas-y3-science-b-015",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each material to the property that makes it useful.",
    options: [],
    interaction: {
      type: "matching",
      sources: [
        {
          id: "glass",
          text: "Glass",
        },
        {
          id: "wool",
          text: "Wool",
        },
        {
          id: "rubber",
          text: "Rubber",
        },
        {
          id: "steel",
          text: "Steel",
        },
      ],
      targets: [
        {
          id: "seethrough",
          text: "You can see through it",
        },
        {
          id: "warm",
          text: "It keeps you warm",
        },
        {
          id: "stretch",
          text: "It stretches and bounces back",
        },
        {
          id: "strong",
          text: "It is strong and hard",
        },
        {
          id: "floats",
          text: "It floats easily on water",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "glass",
          targetId: "seethrough",
        },
        {
          sourceId: "wool",
          targetId: "warm",
        },
        {
          sourceId: "rubber",
          targetId: "stretch",
        },
        {
          sourceId: "steel",
          targetId: "strong",
        },
      ],
    },
    explanation: "Think about what each material is used for. Glass windows let you see through them, woollen jumpers trap warmth, rubber bands stretch and spring back, and steel is strong and hard for tools and frames. 'Floats easily on water' does not match any of these four.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "Properties of materials",
      skill: "Matching materials to their useful properties",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["materials", "properties", "matching"],
    },
  },
  {
    id: "icas-y3-science-b-016",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Tom rolled the same toy car across four different surfaces and measured how far it went each time. Look at the chart. How far did the car roll on the wood floor?",
    instructions: "Write just the number of centimetres, without the unit.",
    options: [],
    visuals: [
      {
        id: "visual-icas-y3-science-b-016-1",
        type: "bar_chart",
        altText: "Bar chart of how far a car rolled on four surfaces: Carpet 30 cm, Wood 80 cm, Tile 120 cm, Grass 20 cm.",
        data: {
          labels: ["Carpet", "Wood", "Tile", "Grass"],
          values: [30, 80, 120, 20],
          xAxisLabel: "Surface",
          yAxisLabel: "Distance rolled (cm)",
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 80,
      tolerance: 0,
      unit: "cm",
    },
    explanation: "Find the bar labelled 'Wood' and read its height against the scale on the side. The wood bar reaches 80, so the car rolled 80 cm on the wood floor.",
    metadata: {
      subject: "science",
      strand: "Physical sciences",
      topic: "Movement and surfaces",
      skill: "Reading a value from a bar chart",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["bar chart", "movement", "surfaces"],
    },
  },
  {
    id: "icas-y3-science-b-017",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The table shows how warm the water was in three cups 10 minutes after it was poured. Claim: 'The cup with no cover stayed the warmest.' Use the table to decide if the claim is true or false.",
    options: [],
    visuals: [
      {
        id: "visual-icas-y3-science-b-017-1",
        type: "table",
        altText: "Table of water temperature after 10 minutes: no cover 30 degrees, paper lid 34 degrees, plastic lid 38 degrees.",
        data: {
          headers: ["Cup", "Cover", "Temperature after 10 min (°C)"],
          rows: [
            ["Cup 1", "No cover", "30"],
            ["Cup 2", "Paper lid", "34"],
            ["Cup 3", "Plastic lid", "38"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "boolean",
      value: false,
    },
    explanation: "Read the temperature column. The cup with no cover was 30 °C, the paper lid was 34 °C and the plastic lid was 38 °C. The no-cover cup was the coolest, not the warmest, so the claim is false.",
    metadata: {
      subject: "science",
      strand: "Science inquiry",
      topic: "Interpreting results",
      skill: "Checking a claim against a results table",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 80,
      tags: ["table", "claim", "results"],
    },
  },
  {
    id: "icas-y3-science-b-018",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A class wants a lid for a fish tank that you can see through and that will not break easily. The table lists some materials. Which material is the best choice?",
    options: [
      { id: "glass", text: "Sheet glass" },
      { id: "wood", text: "Solid wood" },
      { id: "cardboard", text: "Thick cardboard" },
      { id: "plastic", text: "Clear plastic" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-science-b-018-1",
        type: "table",
        altText: "Material table: Clear plastic see-through yes breaks easily no; Sheet glass see-through yes breaks easily yes; Solid wood see-through no breaks easily no; Thick cardboard see-through no breaks easily yes.",
        data: {
          headers: ["Material", "See-through?", "Breaks easily?"],
          rows: [
            ["Clear plastic", "Yes", "No"],
            ["Sheet glass", "Yes", "Yes"],
            ["Solid wood", "No", "No"],
            ["Thick cardboard", "No", "Yes"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "single_option",
      optionId: "plastic",
    },
    explanation: "The lid must be see-through (Yes) and must not break easily (No). Check both columns together. Glass is see-through but breaks easily; wood and cardboard are not see-through. Only clear plastic is both see-through and hard to break, so it is the best choice.",
    metadata: {
      subject: "science",
      strand: "Chemical sciences",
      topic: "Choosing materials",
      skill: "Using a properties table to pick the best material",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["materials", "properties", "table"],
    },
  },
  {
    id: "icas-y3-science-a-001",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A desert lizard hides under a large rock during the hottest part of the day and comes out to hunt in the cool evening. How does hiding under the rock help the lizard survive?",
    options: [
      { id: "more-food", text: "It helps the lizard find more food to eat." },
      { id: "water", text: "It gives the lizard water to drink." },
      { id: "cool-shade", text: "It keeps the lizard cool and shaded from the hot sun." },
      { id: "moonlight", text: "It hides the lizard from the moonlight." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "cool-shade",
    },
    explanation: "Deserts get very hot in the middle of the day. The shade under a rock is much cooler than the open sand, so the lizard does not overheat. Hiding does not create food or water for it, and moonlight is not a problem during the hot day.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Animal adaptations",
      skill: "Explaining how a feature or behaviour helps an animal survive in its habitat",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["living things", "survival", "habitat", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-002",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A frog changes as it grows. Put these stages of a frog's life cycle in order, starting with the very first stage.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "tadpole",
          text: "A tadpole swimming in water",
        },
        {
          id: "frog",
          text: "An adult frog",
        },
        {
          id: "egg",
          text: "Frog eggs (frogspawn)",
        },
        {
          id: "froglet",
          text: "A young froglet with legs and a short tail",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["egg", "tadpole", "froglet", "frog"],
    },
    explanation: "A frog begins as jelly-like eggs. The eggs hatch into tadpoles that live in water. Each tadpole slowly grows legs to become a froglet, and finally becomes an adult frog that can live on land.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Life cycles",
      skill: "Ordering the stages of a frog's life cycle",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["life cycle", "frog", "ordering", "growth"],
    },
  },
  {
    id: "icas-y3-science-a-003",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A butterfly lays tiny eggs on a leaf. A few days later, something hatches from each egg. What comes out of a butterfly's egg first?",
    options: [
      { id: "butterfly", text: "A fully grown butterfly." },
      { id: "chrysalis", text: "A hard chrysalis case." },
      { id: "moth", text: "A small brown moth." },
      { id: "caterpillar", text: "A tiny caterpillar." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "caterpillar",
    },
    explanation: "Butterfly eggs hatch into caterpillars, which eat leaves and grow. Later a caterpillar makes a chrysalis, and only then does an adult butterfly come out. So the first stage after the egg is a caterpillar, not a butterfly, chrysalis or moth.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Life cycles",
      skill: "Identifying the first stage after a butterfly egg hatches",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["life cycle", "butterfly", "caterpillar"],
    },
  },
  {
    id: "icas-y3-science-a-005",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A family is going away and asks a neighbour to look after their pet rabbit. Which TWO things must the neighbour give the rabbit every day to keep it alive and well? Select two.",
    options: [
      { id: "food", text: "Food to eat" },
      { id: "water", text: "Fresh water to drink" },
      { id: "toy", text: "A brand-new toy each day" },
      { id: "tv", text: "A television to watch" },
    ],
    visuals: [],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["food", "water"],
    },
    explanation: "Every living animal needs food and water to stay alive. A new toy or a television might be fun, but the rabbit can live perfectly well without them, so they are not daily needs.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Needs of living things",
      skill: "Identifying the daily needs of a living animal",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["living things", "needs", "animals"],
    },
  },
  {
    id: "icas-y3-science-a-006",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Sort each thing into 'Living' or 'Non-living'.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "dog",
          text: "A dog barking in a yard",
        },
        {
          id: "gum-tree",
          text: "A gum tree growing taller each year",
        },
        {
          id: "robot",
          text: "A wind-up robot toy that walks",
        },
        {
          id: "rock",
          text: "A grey rock on the ground",
        },
      ],
      targets: [
        {
          id: "living",
          text: "Living",
        },
        {
          id: "non-living",
          text: "Non-living",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "dog",
          targetId: "living",
        },
        {
          sourceId: "gum-tree",
          targetId: "living",
        },
        {
          sourceId: "robot",
          targetId: "non-living",
        },
        {
          sourceId: "rock",
          targetId: "non-living",
        },
      ],
    },
    explanation: "Living things grow, need food or water, and can make more of their own kind. A dog and a gum tree do these things, so they are living. A rock has never been alive. A robot toy can move, but movement alone is not enough — it cannot grow, eat or make young, so it is non-living.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Living and non-living",
      skill: "Sorting things into living and non-living",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["living things", "non-living", "sorting", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-007",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each food to the plant or animal it comes from.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "honey",
          text: "Honey",
        },
        {
          id: "milk",
          text: "Milk",
        },
        {
          id: "egg",
          text: "An egg",
        },
        {
          id: "bread",
          text: "Bread",
        },
      ],
      targets: [
        {
          id: "bee",
          text: "Bees",
        },
        {
          id: "cow",
          text: "A cow",
        },
        {
          id: "hen",
          text: "A hen",
        },
        {
          id: "wheat",
          text: "A wheat plant",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "honey",
          targetId: "bee",
        },
        {
          sourceId: "milk",
          targetId: "cow",
        },
        {
          sourceId: "egg",
          targetId: "hen",
        },
        {
          sourceId: "bread",
          targetId: "wheat",
        },
      ],
    },
    explanation: "Honey is made by bees, milk comes from cows, eggs are laid by hens, and bread is made from flour that is ground from wheat. Tracing each food back shows where the food we eat begins.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Food sources",
      skill: "Matching foods to the plant or animal they come from",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["food sources", "living things", "matching"],
    },
  },
  {
    id: "icas-y3-science-a-008",
    type: "ordering",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "In a garden, grass is eaten by a grasshopper, the grasshopper is eaten by a frog, and a snake eats the frog. Put this food chain in order, starting with the living thing that makes its own food.",
    interaction: {
      type: "ordering",
      items: [
        {
          id: "frog",
          text: "A frog",
        },
        {
          id: "grass",
          text: "Grass",
        },
        {
          id: "snake",
          text: "A snake",
        },
        {
          id: "grasshopper",
          text: "A grasshopper",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "ordering",
      optionIds: ["grass", "grasshopper", "frog", "snake"],
    },
    explanation: "A food chain starts with a plant, because grass makes its own food using sunlight. The grasshopper eats the grass, the frog eats the grasshopper, and the snake eats the frog. Each step points to the animal doing the eating.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Food chains",
      skill: "Ordering a simple food chain",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 75,
      tags: ["food chain", "energy", "ordering", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-009",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each part of a plant to the job it does.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "roots",
          text: "Roots",
        },
        {
          id: "stem",
          text: "Stem",
        },
        {
          id: "leaves",
          text: "Leaves",
        },
        {
          id: "flower",
          text: "Flower",
        },
      ],
      targets: [
        {
          id: "take-water",
          text: "Take in water from the soil",
        },
        {
          id: "hold-up",
          text: "Hold the plant up",
        },
        {
          id: "make-food",
          text: "Make food using sunlight",
        },
        {
          id: "make-seeds",
          text: "Make seeds for new plants",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "roots",
          targetId: "take-water",
        },
        {
          sourceId: "stem",
          targetId: "hold-up",
        },
        {
          sourceId: "leaves",
          targetId: "make-food",
        },
        {
          sourceId: "flower",
          targetId: "make-seeds",
        },
      ],
    },
    explanation: "Roots reach down and take in water from the soil, the stem holds the plant up, the leaves make food using sunlight, and the flower makes seeds so new plants can grow.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Plant parts",
      skill: "Matching plant parts to their jobs",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["plants", "plant parts", "matching"],
    },
  },
  {
    id: "icas-y3-science-a-010",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "It is midnight and the sky outside is dark. Why can we NOT see the Sun in the sky at midnight?",
    options: [
      { id: "switch-off", text: "The Sun switches off during the night." },
      { id: "turned-away", text: "Our side of the Earth faces away from the Sun." },
      { id: "clouds", text: "Thick clouds always cover the Sun at night." },
      { id: "moon", text: "The Moon moves in front of the Sun each night." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "turned-away",
    },
    explanation: "The Earth spins once each day. At midnight your side of the Earth has turned away from the Sun, so its light cannot reach you. The Sun never switches off, clouds are not always there, and the Moon does not cover the Sun each night.",
    metadata: {
      subject: "science",
      strand: "Earth and space sciences",
      topic: "Day and night",
      skill: "Explaining why the Sun is not seen at midnight",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["day and night", "Earth", "Sun", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-011",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "In a town in southern Australia it is the coldest time of the year. The days are short and there is snow on the nearby mountains. Which season is it most likely to be?",
    options: [
      { id: "summer", text: "Summer" },
      { id: "spring", text: "Spring" },
      { id: "winter", text: "Winter" },
      { id: "autumn", text: "Autumn" },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "winter",
    },
    explanation: "Short, very cold days with snow on the mountains happen in winter, the coldest season. Summer is hot, spring is mild and warming up, and autumn is cooling but not the coldest, so winter fits the clues best.",
    metadata: {
      subject: "science",
      strand: "Earth and space sciences",
      topic: "Weather and seasons",
      skill: "Identifying a season from weather clues",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 40,
      tags: ["weather", "seasons", "winter"],
    },
  },
  {
    id: "icas-y3-science-a-012",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A class wants to reduce the amount of rubbish they send to landfill each week. Which action would help the most?",
    options: [
      { id: "new-bottle", text: "Buying a brand-new drink bottle every single day." },
      { id: "one-bin", text: "Putting every kind of rubbish into one large bin." },
      { id: "lights", text: "Leaving all the classroom lights on through the night." },
      { id: "reuse", text: "Packing lunches in containers they can wash and reuse." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "reuse",
    },
    explanation: "Reusable containers are washed and used again, so nothing is thrown away. Buying a new bottle every day and mixing everything into one bin both make more landfill rubbish, and leaving lights on wastes power but does not reduce rubbish at all.",
    metadata: {
      subject: "science",
      strand: "Earth and space sciences",
      topic: "Caring for the environment",
      skill: "Choosing the best action to reduce rubbish sent to landfill",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 50,
      tags: ["environment", "rubbish", "reuse", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-013",
    type: "number_entry",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "The bar chart shows how much rain fell each day. How many millimetres of rain fell on Tuesday?",
    instructions: "Write just the number of millimetres, without the unit.",
    visuals: [
      {
        id: "visual-icas-y3-science-a-013-1",
        type: "bar_chart",
        altText: "Bar chart of daily rainfall: Monday 10 mm, Tuesday 25 mm, Wednesday 15 mm, Thursday 20 mm.",
        data: {
          labels: ["Monday", "Tuesday", "Wednesday", "Thursday"],
          values: [10, 25, 15, 20],
          xAxisLabel: "Day",
          yAxisLabel: "Rain (mm)",
        },
      },
    ],
    answerKey: {
      kind: "number",
      value: 25,
      tolerance: 0,
      unit: "mm",
    },
    explanation: "Find the bar labelled Tuesday and read across to the scale on the side. The Tuesday bar reaches 25, so 25 millimetres of rain fell that day.",
    metadata: {
      subject: "science",
      strand: "Earth and space sciences",
      topic: "Weather data",
      skill: "Reading a value from a rainfall bar chart",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["weather", "bar chart", "data", "rainfall"],
    },
  },
  {
    id: "icas-y3-science-a-014",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "A green tree frog sits very still on a bright green leaf. A hungry bird flying above finds it very hard to spot the frog. Which feature of the frog is helping keep it safe?",
    options: [
      { id: "green", text: "Its green colour that blends in with the leaf." },
      { id: "tongue", text: "Its long sticky tongue for catching flies." },
      { id: "feet", text: "Its webbed feet that help it swim across ponds." },
      { id: "croak", text: "Its loud croaking call heard at night." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "green",
    },
    explanation: "The frog's green colour matches the green leaf, so the bird's eyes cannot pick it out. This is called camouflage. Its tongue, feet and croak are all real frog features, but none of them help it hide from a bird looking down.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Camouflage",
      skill: "Identifying camouflage as a feature that keeps an animal safe",
      difficulty: "medium",
      marks: 1,
      estimatedTimeSeconds: 45,
      tags: ["camouflage", "survival", "animals", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-015",
    type: "matching",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Match each animal to the place where it is best suited to live.",
    interaction: {
      type: "matching",
      sources: [
        {
          id: "fish",
          text: "A fish",
        },
        {
          id: "camel",
          text: "A camel",
        },
        {
          id: "polar-bear",
          text: "A polar bear",
        },
        {
          id: "worm",
          text: "An earthworm",
        },
      ],
      targets: [
        {
          id: "pond",
          text: "A pond of water",
        },
        {
          id: "desert",
          text: "A hot, sandy desert",
        },
        {
          id: "ice",
          text: "Cold snow and ice",
        },
        {
          id: "soil",
          text: "Damp soil underground",
        },
      ],
    },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: [
        {
          sourceId: "fish",
          targetId: "pond",
        },
        {
          sourceId: "camel",
          targetId: "desert",
        },
        {
          sourceId: "polar-bear",
          targetId: "ice",
        },
        {
          sourceId: "worm",
          targetId: "soil",
        },
      ],
    },
    explanation: "Each animal is suited to one home: a fish breathes underwater in a pond, a camel copes with heat and little water in a desert, a polar bear stays warm in snow and ice, and an earthworm lives in damp soil underground.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Habitats",
      skill: "Matching animals to their habitats",
      difficulty: "easy",
      marks: 1,
      estimatedTimeSeconds: 55,
      tags: ["habitats", "animals", "matching"],
    },
  },
  {
    id: "icas-y3-science-a-016",
    type: "multiple_select",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Four bean seeds were grown in different places. The table shows how tall each plant was after two weeks. The tallest plant was kept in a sunny window and watered. Which TWO things helped this plant grow the best? Select two.",
    options: [
      { id: "water", text: "Being watered" },
      { id: "darkness", text: "Being kept in the dark" },
      { id: "no-water", text: "Being left with no water" },
      { id: "sunlight", text: "Sunlight from the window" },
    ],
    visuals: [
      {
        id: "visual-icas-y3-science-a-016-1",
        type: "table",
        altText: "Table of four bean plants: sunny and watered 12 cm, dark and watered 5 cm, sunny and not watered 2 cm, dark and not watered 0 cm.",
        data: {
          headers: ["Bean plant", "Where it was kept", "Height after 2 weeks (cm)"],
          rows: [
            ["Plant 1", "Sunny window, watered", "12"],
            ["Plant 2", "Dark cupboard, watered", "5"],
            ["Plant 3", "Sunny window, not watered", "2"],
            ["Plant 4", "Dark cupboard, not watered", "0"],
          ],
        },
      },
    ],
    answerKey: {
      kind: "multiple_options",
      optionIds: ["sunlight", "water"],
    },
    explanation: "Compare the rows. Plant 1 had both sunlight and water and grew tallest at 12 cm. Taking away light (Plant 2) or water (Plant 3) made the plant much shorter, and with neither (Plant 4) it did not grow at all. So sunlight and water together helped the plant grow best.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Needs of living things",
      skill: "Interpreting a data table to find what a plant needs to grow",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 90,
      tags: ["plants", "needs", "table", "data", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-017",
    type: "multiple_choice",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "As autumn turns colder, some animals eat a lot and store extra fat in their bodies before winter arrives. Why is storing this fat helpful for them?",
    options: [
      { id: "fur", text: "The cold weather makes their fur change colour." },
      { id: "run-more", text: "Winter days are long, so they need to run more." },
      { id: "energy", text: "Food is hard to find in winter, so the fat gives them energy." },
      { id: "taller", text: "They want to grow much taller before the spring." },
    ],
    visuals: [],
    answerKey: {
      kind: "single_option",
      optionId: "energy",
    },
    explanation: "In winter, plants and small creatures are scarce, so food is hard to find. The fat stored in autumn acts like a food store the animal's body can use for energy through the cold months. The other choices do not explain why the stored fat helps.",
    metadata: {
      subject: "science",
      strand: "Biological sciences",
      topic: "Seasonal animal behaviour",
      skill: "Reasoning about why animals store fat before winter",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 60,
      tags: ["animals", "seasons", "survival", "reasoning"],
    },
  },
  {
    id: "icas-y3-science-a-018",
    type: "true_false",
    yearLevel: 3,
    examStyle: "icas_style",
    status: "published",
    origin: "original_seed",
    prompt: "Some children notice that a park full of litter has far fewer birds than a clean park nearby. They say that dropping litter in a park can harm the animals that live there. Is this a sensible conclusion from what they saw?",
    visuals: [],
    answerKey: {
      kind: "boolean",
      value: true,
    },
    explanation: "The children compared two parks and saw fewer birds where there was more litter. That is a sensible reason to think litter can harm the animals, because rubbish can poison or trap them or drive them away. It is a fair conclusion drawn from what they observed.",
    metadata: {
      subject: "science",
      strand: "Earth and space sciences",
      topic: "Caring for the environment",
      skill: "Drawing a conclusion about litter harming animals from an observation",
      difficulty: "challenging",
      marks: 1,
      estimatedTimeSeconds: 55,
      tags: ["environment", "litter", "conclusion", "reasoning"],
    },
  },

  ...([
  {
    "id": "icas-y3-science-da-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Maya looks at four things in the schoolyard. She notices that one of them slowly grows bigger, takes in water, and can make new ones like itself. Which thing is she describing?",
    "options": [
      {
        "id": "rock",
        "text": "A grey rock beside the path"
      },
      {
        "id": "ball",
        "text": "A plastic ball on the grass"
      },
      {
        "id": "gate",
        "text": "A metal gate at the entrance"
      },
      {
        "id": "gum-tree",
        "text": "A young gum tree"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "gum-tree"
    },
    "explanation": "Living things do three things the clues describe: they grow, they take in water or food, and they make new living things. Check each item against those clues. A rock, a ball and a gate never grow bigger on their own, do not drink water, and cannot make new ones like themselves. Only the young gum tree does all three, so it is the living thing Maya is describing.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Features of living things",
      "skill": "Identifying living things from their characteristics",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "living things",
        "life processes",
        "reasoning",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-002",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Each object below is made from a material chosen for one useful property. Match each object to the property that makes its material a good choice.",
    "instructions": "Drag each object to the property that best explains why its material was chosen.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "s-window",
          "text": "A glass window"
        },
        {
          "id": "s-spoon",
          "text": "A wooden cooking spoon"
        },
        {
          "id": "s-jumper",
          "text": "A woollen jumper"
        },
        {
          "id": "s-boot",
          "text": "A rubber gumboot"
        }
      ],
      "targets": [
        {
          "id": "t-seethrough",
          "text": "You can see through it"
        },
        {
          "id": "t-staysool",
          "text": "It does not get hot quickly while stirring hot soup"
        },
        {
          "id": "t-warm",
          "text": "It traps heat and keeps you warm"
        },
        {
          "id": "t-waterproof",
          "text": "It keeps water out and stays dry inside"
        },
        {
          "id": "t-magnetic",
          "text": "It is pulled towards a magnet"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "s-window",
          "targetId": "t-seethrough"
        },
        {
          "sourceId": "s-spoon",
          "targetId": "t-staysool"
        },
        {
          "sourceId": "s-jumper",
          "targetId": "t-warm"
        },
        {
          "sourceId": "s-boot",
          "targetId": "t-waterproof"
        }
      ]
    },
    "explanation": "Think about the job each object does and which property lets it do that job. Glass is chosen for a window because it is clear, so you can see through it. Wood does not carry heat quickly, so a wooden spoon handle stays cool while stirring hot soup. Wool traps warm air, so a jumper keeps you warm. Rubber keeps water out, so gumboots stay dry inside. The 'pulled towards a magnet' property fits none of these, because glass, wood, wool and rubber are not magnetic.",
    "metadata": {
      "subject": "science",
      "strand": "Materials",
      "topic": "Properties and uses of materials",
      "skill": "Matching a material's property to its use",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "materials",
        "properties",
        "matching",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam gives his toy truck the same gentle push on three different floors. It rolls furthest across the smooth tiles and stops soonest on the fluffy carpet. What best explains why it stops soonest on the carpet?",
    "options": [
      {
        "id": "friction",
        "text": "The rough carpet rubs the wheels and adds friction."
      },
      {
        "id": "heavier",
        "text": "The soft carpet secretly adds weight to the truck."
      },
      {
        "id": "tiles-push",
        "text": "The smooth tiles push the truck along by themselves."
      },
      {
        "id": "no-wheels",
        "text": "The truck's wheels stop turning on carpet."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "friction"
    },
    "explanation": "The same push starts the truck each time, so the difference must be how quickly each floor slows it down. A rough surface like carpet rubs against the moving wheels much more than smooth tiles do. This rubbing force is friction, and more friction stops the truck sooner. The carpet does not add weight, the tiles do not push the truck, and the wheels do not fall off, so the extra rubbing (friction) is the only sensible reason.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Friction",
      "skill": "Explaining motion using friction",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "forces",
        "friction",
        "surfaces",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "It is the middle of the day in Priya's town, but at the very same moment it is night on the opposite side of the world. What causes day and night?",
    "options": [
      {
        "id": "sun-off",
        "text": "The Sun switches itself off during the night."
      },
      {
        "id": "earth-spin",
        "text": "The Earth spins around each day."
      },
      {
        "id": "clouds",
        "text": "Thick dark clouds cover up the Sun at night."
      },
      {
        "id": "moon-blocks",
        "text": "The Moon slides in front of the Sun."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "earth-spin"
    },
    "explanation": "The Earth is a spinning ball, and the Sun can only light up the half facing it. As the Earth turns once each day, the side you live on moves into the light (day) and then away into the shadow (night). That is why it can be day in one place and night on the other side at the same time. The Sun does not switch off, clouds do not cause night everywhere, and the Moon is not blocking the Sun, so the spinning Earth is the cause.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Day and night",
      "skill": "Explaining day and night from Earth's rotation",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "earth and space",
        "day and night",
        "rotation",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-005",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ben wants a fair test to find out which of three brands of paper towel soaks up the most water. Which TWO things should he keep the SAME for every towel he tests?",
    "options": [
      {
        "id": "diff-brand",
        "text": "The brand of paper towel he is testing"
      },
      {
        "id": "bowl-colour",
        "text": "The colour of the bowl he uses"
      },
      {
        "id": "same-water",
        "text": "The amount of water he dips each towel into"
      },
      {
        "id": "same-time",
        "text": "How long he leaves each towel in the water"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "same-water",
        "same-time"
      ]
    },
    "explanation": "In a fair test you change only the one thing you are testing and keep everything else that could affect the result the same. Ben is testing the brand of towel, so the brand is the thing that must change, not stay the same. To be fair, he must give each towel the same amount of water and the same soaking time; otherwise a towel might look best just because it got more water or more time. The bowl's colour cannot change how much water is soaked up, so it is not one of the important things to keep the same.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Fair tests and variables",
      "skill": "Choosing variables to keep constant in a fair test",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "investigating",
        "fair test",
        "variables",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-006",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class put bean seeds in four trays and left each tray in a different spot. The bar chart shows how many seeds sprouted in each tray. How many more seeds sprouted in the Windowsill tray than in the Cupboard tray?",
    "instructions": "Write just the number.",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-006",
        "type": "bar_chart",
        "title": "Bean Seeds That Sprouted in Each Tray",
        "altText": "Bar chart: Windowsill 9 seeds, Shelf 6 seeds, Bench 4 seeds, Cupboard 1 seed.",
        "data": {
          "labels": [
            "Windowsill",
            "Shelf",
            "Bench",
            "Cupboard"
          ],
          "values": [
            9,
            6,
            4,
            1
          ],
          "xAxisLabel": "Tray location",
          "yAxisLabel": "Seeds sprouted"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 8,
      "tolerance": 0
    },
    "explanation": "Read the height of two bars and find the difference. The Windowsill bar reaches 9 seeds and the Cupboard bar reaches 1 seed. 'How many more' means subtract the smaller from the larger: 9 - 1 = 8. So 8 more seeds sprouted on the windowsill than in the cupboard.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Reading a bar chart",
      "skill": "Comparing values on a bar chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "investigating",
        "bar chart",
        "data",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-007",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the stages of a butterfly's life cycle in the order they happen, from first to last.",
    "instructions": "Drag the stages into the correct order.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "stage-egg",
          "text": "An egg is laid on a leaf"
        },
        {
          "id": "stage-caterpillar",
          "text": "A caterpillar hatches and eats leaves"
        },
        {
          "id": "stage-chrysalis",
          "text": "The caterpillar forms a chrysalis"
        },
        {
          "id": "stage-butterfly",
          "text": "An adult butterfly comes out"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "stage-egg",
        "stage-caterpillar",
        "stage-chrysalis",
        "stage-butterfly"
      ]
    },
    "explanation": "A butterfly's life cycle always starts with an egg laid on a leaf. The egg hatches into a caterpillar, which eats and grows. When it is big enough, the caterpillar forms a chrysalis, where its body changes. Finally an adult butterfly comes out. So the order is egg, then caterpillar, then chrysalis, then butterfly.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Life cycles",
      "skill": "Sequencing stages of an animal life cycle",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "living things",
        "life cycle",
        "butterfly",
        "ordering"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-008",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class tested four materials to find the best one for making a raincoat. They recorded whether each material lets water through and whether it can bend easily. Using the table, which material is the best choice for a raincoat?",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-008",
        "type": "table",
        "title": "Testing Materials for a Raincoat",
        "altText": "Table of four materials with two test results each: lets water through, and bends easily.",
        "data": {
          "headers": [
            "Material",
            "Lets water through?",
            "Bends easily?"
          ],
          "rows": [
            [
              "Cardboard",
              "Yes",
              "Yes"
            ],
            [
              "Cotton cloth",
              "Yes",
              "Yes"
            ],
            [
              "Glass sheet",
              "No",
              "No"
            ],
            [
              "Plastic sheet",
              "No",
              "Yes"
            ]
          ]
        }
      }
    ],
    "options": [
      {
        "id": "cardboard",
        "text": "Cardboard"
      },
      {
        "id": "cotton",
        "text": "Cotton cloth"
      },
      {
        "id": "glass",
        "text": "Glass sheet"
      },
      {
        "id": "plastic",
        "text": "Plastic sheet"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "plastic"
    },
    "explanation": "A good raincoat must do two things: keep water out AND bend so you can wear it. So look for a material with 'No' in the water column and 'Yes' in the bending column. Cardboard and cotton both let water through, so they are out. Glass keeps water out but cannot bend, so you could not wear it. Only the plastic sheet has both 'No' to water and 'Yes' to bending, so it is the best choice. You must read both columns, not just one.",
    "metadata": {
      "subject": "science",
      "strand": "Materials",
      "topic": "Choosing materials from test results",
      "skill": "Selecting a material using two properties from a table",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "materials",
        "table",
        "properties",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A toy car was rolled from the same ramp onto four different surfaces. The chart shows how far it rolled before stopping on each surface. On which surface did friction slow the car down the most?",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-009",
        "type": "bar_chart",
        "title": "How Far the Toy Car Rolled on Each Surface",
        "altText": "Bar chart of rolling distance: Wood 80 cm, Carpet 35 cm, Sandpaper 20 cm, Tiles 95 cm.",
        "data": {
          "labels": [
            "Wood",
            "Carpet",
            "Sandpaper",
            "Tiles"
          ],
          "values": [
            80,
            35,
            20,
            95
          ],
          "xAxisLabel": "Surface",
          "yAxisLabel": "Distance rolled (cm)"
        }
      }
    ],
    "options": [
      {
        "id": "sandpaper",
        "text": "Sandpaper"
      },
      {
        "id": "carpet",
        "text": "Carpet"
      },
      {
        "id": "tiles",
        "text": "Tiles"
      },
      {
        "id": "wood",
        "text": "Wood"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sandpaper"
    },
    "explanation": "More friction rubs against the car and stops it sooner, so the surface with the most friction is the one where the car rolled the shortest distance. Read the bars: Tiles 95 cm, Wood 80 cm, Carpet 35 cm, Sandpaper 20 cm. Sandpaper has the shortest bar, so the car stopped soonest there, meaning sandpaper had the most friction.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Friction and surfaces",
      "skill": "Linking friction to distance travelled using a chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "forces",
        "friction",
        "bar chart",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the hours of daylight in an Australian town on the first day of four months. In which month did the town have the most daylight?",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-010",
        "type": "table",
        "title": "Hours of Daylight in the Town",
        "altText": "Table of daylight hours: December 14, March 12, June 9, September 12.",
        "data": {
          "headers": [
            "Month",
            "Hours of daylight"
          ],
          "rows": [
            [
              "December",
              "14"
            ],
            [
              "March",
              "12"
            ],
            [
              "June",
              "9"
            ],
            [
              "September",
              "12"
            ]
          ]
        }
      }
    ],
    "options": [
      {
        "id": "june",
        "text": "June"
      },
      {
        "id": "december",
        "text": "December"
      },
      {
        "id": "march",
        "text": "March"
      },
      {
        "id": "september",
        "text": "September"
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "december"
    },
    "explanation": "The most daylight means the largest number of hours in the table. Compare the numbers: December 14, March 12, September 12, and June only 9. The biggest number is 14, which is next to December, so December had the most daylight. (In Australia December is summer, when days are longest.)",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Daylight and seasons",
      "skill": "Reading and comparing values in a table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "earth and space",
        "daylight",
        "table",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-011",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Lily wants to find out how the drop height changes how high a ball bounces. She drops the ball from three different heights, but she uses a completely different ball each time. Is this a fair test?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "In a fair test you change only the one thing you are investigating. Lily is investigating drop height, so the only thing that should change is the height. By using a different ball each time, she changes two things at once, and different balls bounce differently. If a bounce looks bigger, she will not know whether it was the height or the different ball that caused it. So this is not a fair test, and the answer is false.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Fair tests",
      "skill": "Judging whether an investigation is fair",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "investigating",
        "fair test",
        "true false",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A small desert lizard is active at night and hides under rocks during the hottest part of the day. What is the most likely reason it hides under rocks in the daytime?",
    "options": [
      {
        "id": "sunlight",
        "text": "To find a bright sunny spot to sit in"
      },
      {
        "id": "dark",
        "text": "Because it cannot move about in the daytime"
      },
      {
        "id": "cool",
        "text": "To stay cool and out of the strong heat"
      },
      {
        "id": "grow",
        "text": "To make itself grow faster"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cool"
    },
    "explanation": "Think about what a desert is like in the daytime: extremely hot. The clue is that the lizard hides in the hottest part of the day and comes out at night when it is cooler. Under a rock it is shaded and cooler than out in the sun, so hiding there helps the lizard avoid the dangerous daytime heat. It is not looking for more sunlight, it can move in the daytime, and hiding does not make it grow faster, so staying cool is the best reason.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Adaptations to habitat",
      "skill": "Explaining animal behaviour as a response to environment",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "living things",
        "adaptation",
        "habitat",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-013",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Water is left in a freezer and turns into solid ice. The ice is then taken out and left in a warm room, where it melts back into water. This shows that freezing water can be reversed by warming the ice up again. Is this true or false?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "Freezing is when cooling turns liquid water into solid ice. Melting is when warming turns the ice back into liquid water. Because warming the ice brings back exactly what you started with, the change can be undone, or reversed. So it is true that freezing can be reversed by warming the ice.",
    "metadata": {
      "subject": "science",
      "strand": "Materials",
      "topic": "Reversible changes of state",
      "skill": "Recognising a reversible change",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "materials",
        "states of matter",
        "melting",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-014",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A magnet is held close to six objects, one at a time. Which TWO objects will the magnet pull towards it?",
    "options": [
      {
        "id": "band",
        "text": "A rubber band"
      },
      {
        "id": "paperclip",
        "text": "A steel paperclip"
      },
      {
        "id": "button",
        "text": "A plastic button"
      },
      {
        "id": "coin",
        "text": "A copper coin"
      },
      {
        "id": "nail",
        "text": "An iron nail"
      },
      {
        "id": "peg",
        "text": "A wooden peg"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "paperclip",
        "nail"
      ]
    },
    "explanation": "Magnets pull on objects made of iron or steel, but not on plastic, copper, wood or rubber. Go through the list: the steel paperclip and the iron nail are both made of magnetic metal, so the magnet pulls them. The plastic button, copper coin, wooden peg and rubber band are not magnetic, so the magnet leaves them alone. That gives exactly two objects: the steel paperclip and the iron nail.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Magnetism",
      "skill": "Identifying magnetic materials",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "forces",
        "magnets",
        "materials",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-015",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Two bean plants were measured with a ruler. The number line shows their two heights in centimetres as two dots. How many centimetres taller is the taller plant than the shorter plant?",
    "instructions": "Write just the number of centimetres, without the unit.",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-015",
        "type": "number_line",
        "title": "Heights of the Two Bean Plants (cm)",
        "altText": "Number line from 0 to 30 counting by 5, with dots marked at 10 and 25.",
        "data": {
          "min": 0,
          "max": 30,
          "step": 5,
          "highlightedValues": [
            10,
            25
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 15,
      "tolerance": 0
    },
    "explanation": "Read where each dot sits on the number line. The line counts by 5s, so the first dot is on 10 and the second dot is on 25. To find how much taller one plant is, subtract the smaller height from the larger: 25 - 10 = 15. So the taller plant is 15 cm taller.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Reading measurements",
      "skill": "Reading a number line and finding a difference",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "investigating",
        "number line",
        "measuring",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-da-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On a sunny day, the shadow of a stick in the ground was measured at four times. The chart shows the shadow length each time. The shadow is shortest at 12 pm. What does this tell us about the Sun at 12 pm?",
    "visuals": [
      {
        "id": "visual-icas-y3-science-da-016",
        "type": "bar_chart",
        "title": "Length of the Stick's Shadow During the Day",
        "altText": "Bar chart of shadow length: 8 am 70 cm, 10 am 40 cm, 12 pm 15 cm, 2 pm 45 cm.",
        "data": {
          "labels": [
            "8 am",
            "10 am",
            "12 pm",
            "2 pm"
          ],
          "values": [
            70,
            40,
            15,
            45
          ],
          "xAxisLabel": "Time of day",
          "yAxisLabel": "Shadow length (cm)"
        }
      }
    ],
    "options": [
      {
        "id": "sun-highest",
        "text": "The Sun is highest in the sky in the middle of the day."
      },
      {
        "id": "shorter-stick",
        "text": "The stick itself becomes much shorter around the middle of the day."
      },
      {
        "id": "sun-stops",
        "text": "The Sun stops moving across the sky at noon."
      },
      {
        "id": "sun-closer",
        "text": "The Sun moves right up close to the stick at noon."
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sun-highest"
    },
    "explanation": "A shadow is short when the Sun is high overhead and long when the Sun is low near the horizon. The chart shows the shadow is longest in the morning (8 am) and afternoon, but shortest at 12 pm. The shortest shadow means the Sun is highest in the sky at 12 pm, in the middle of the day. The stick does not change length, the Sun keeps moving across the sky, and it does not come physically close to the stick, so 'the Sun is highest' is the correct reading.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "The Sun and shadows",
      "skill": "Interpreting shadow data to infer the Sun's position",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "earth and space",
        "shadows",
        "bar chart",
        "year 3"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A plant is growing in a garden bed. Which part of the plant takes in water from the soil?",
    "options": [
      {
        "id": "roots",
        "text": "roots"
      },
      {
        "id": "leaf",
        "text": "leaf"
      },
      {
        "id": "flower",
        "text": "flower"
      },
      {
        "id": "stem",
        "text": "stem"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "roots"
    },
    "explanation": "The roots grow down into the soil and soak up water for the plant. The leaf catches sunlight to make food, the flower makes seeds, and the stem holds the plant up and carries water higher. Think about which part is under the ground touching the wet soil.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Plant parts and their jobs",
      "skill": "Identifying the function of a plant's roots",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "plants",
        "living things",
        "structure and function"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-002",
    "type": "matching",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Scientists sort animals into groups by looking at their bodies. Match each animal to the group it belongs to.",
    "interaction": {
      "type": "matching",
      "sources": [
        {
          "id": "kangaroo",
          "text": "Kangaroo"
        },
        {
          "id": "magpie",
          "text": "Magpie"
        },
        {
          "id": "goldfish",
          "text": "Goldfish"
        },
        {
          "id": "honeybee",
          "text": "Honeybee"
        }
      ],
      "targets": [
        {
          "id": "mammal",
          "text": "Mammal (has fur, feeds its babies milk)"
        },
        {
          "id": "bird",
          "text": "Bird (has feathers and a beak)"
        },
        {
          "id": "fish",
          "text": "Fish (has gills and fins, lives in water)"
        },
        {
          "id": "insect",
          "text": "Insect (has six legs and a body in three parts)"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "matching",
      "pairs": [
        {
          "sourceId": "kangaroo",
          "targetId": "mammal"
        },
        {
          "sourceId": "magpie",
          "targetId": "bird"
        },
        {
          "sourceId": "goldfish",
          "targetId": "fish"
        },
        {
          "sourceId": "honeybee",
          "targetId": "insect"
        }
      ]
    },
    "explanation": "Match each animal by its body features. A kangaroo has fur and feeds its joey milk, so it is a mammal. A magpie has feathers, so it is a bird. A goldfish has gills and fins, so it is a fish. A honeybee has six legs, so it is an insect.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Classifying animals",
      "skill": "Matching animals to their animal group by features",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "animals",
        "classifying",
        "living things"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-003",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put the stages of a frog's life cycle in the order they happen, from first to last.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "egg",
          "text": "Jelly-covered eggs float in the pond"
        },
        {
          "id": "tadpole",
          "text": "A tadpole with a tail swims and breathes with gills"
        },
        {
          "id": "froglet",
          "text": "A young froglet grows legs and its tail gets shorter"
        },
        {
          "id": "adultfrog",
          "text": "An adult frog can hop on land and lay eggs"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "egg",
        "tadpole",
        "froglet",
        "adultfrog"
      ]
    },
    "explanation": "A frog begins life as eggs in the water. The eggs hatch into tadpoles that swim with a tail and gills. The tadpole slowly grows legs and becomes a froglet as its tail shrinks. Finally it becomes an adult frog that can live on land and lay new eggs. Follow the changes from water to land.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Life cycles",
      "skill": "Sequencing the stages of a frog's life cycle",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "life cycle",
        "frog",
        "living things"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-004",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Living things grow, need food or water, and can make more of their own kind. Which TWO of these are living things?",
    "options": [
      {
        "id": "rock",
        "text": "a smooth grey rock"
      },
      {
        "id": "robot",
        "text": "a toy robot that beeps and moves"
      },
      {
        "id": "spider",
        "text": "a spider spinning a web"
      },
      {
        "id": "fern",
        "text": "a fern growing in a pot"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "fern",
        "spider"
      ]
    },
    "explanation": "A living thing must grow, need food or water, and be able to make young. A fern is a plant that grows and needs water, and a spider eats, grows and lays eggs, so both are living. A rock never grows or eats. A toy robot moves and makes sounds, but only because of a battery, and it cannot grow or make more robots, so it is not living. Do not be tricked by things that move.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Living and non-living things",
      "skill": "Distinguishing living things from moving non-living things",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "living things",
        "non-living",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-005",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Glass is used to make windows because it is transparent, which means light can pass through it so you can see clearly. Is this true or false?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "This is true. A transparent material lets light pass straight through, so you can see what is on the other side. Glass is chosen for windows exactly because it is transparent and lets daylight into a room.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "Properties of materials",
      "skill": "Linking a material's property to why it is chosen",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "materials",
        "transparent",
        "properties"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class tested materials to choose the best one for making gumboots. The gumboots must keep feet dry and must bend when you walk. Using the table, which material should they choose?",
    "options": [
      {
        "id": "cardboard",
        "text": "Cardboard"
      },
      {
        "id": "steel",
        "text": "Steel"
      },
      {
        "id": "rubber",
        "text": "Rubber"
      },
      {
        "id": "cotton",
        "text": "Cotton"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-006-1",
        "type": "table",
        "altText": "A table with columns Material, Waterproof and Bendy. Cardboard is No and Yes. Rubber is Yes and Yes. Steel is Yes and No. Cotton is No and Yes.",
        "data": {
          "headers": [
            "Material",
            "Waterproof?",
            "Bendy?"
          ],
          "rows": [
            [
              "Cardboard",
              "No",
              "Yes"
            ],
            [
              "Rubber",
              "Yes",
              "Yes"
            ],
            [
              "Steel",
              "Yes",
              "No"
            ],
            [
              "Cotton",
              "No",
              "Yes"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "rubber"
    },
    "explanation": "The gumboots need a material that is BOTH waterproof and bendy. Read across the table for each material. Only rubber has Yes in both columns. Cardboard and cotton are not waterproof, so feet would get wet. Steel is waterproof but not bendy, so you could not walk. Rubber is the only material that passes both tests.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "Choosing materials for a purpose",
      "skill": "Selecting a material using two properties in a table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "materials",
        "properties",
        "table",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Materials can be solids, liquids or gases. Which of these is a gas?",
    "options": [
      {
        "id": "milk",
        "text": "milk in a cup"
      },
      {
        "id": "ice",
        "text": "ice in a tray"
      },
      {
        "id": "block",
        "text": "a wooden block"
      },
      {
        "id": "air",
        "text": "air in a balloon"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "air"
    },
    "explanation": "A gas has no fixed shape and spreads out to fill its container, like the air that fills a balloon. Milk is a liquid that flows and takes the shape of the cup. Ice and the wooden block are both solids that keep their own shape. The air in the balloon is the only gas.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "States of matter",
      "skill": "Identifying a gas among solids and liquids",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "materials",
        "solid liquid gas",
        "states of matter"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Some children counted the minibeasts they found in a garden and made a bar chart. How many more ants than beetles did they find?",
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-008-1",
        "type": "bar_chart",
        "altText": "A bar chart of minibeasts found. Ants 12, Snails 5, Beetles 8, Worms 6.",
        "data": {
          "labels": [
            "Ants",
            "Snails",
            "Beetles",
            "Worms"
          ],
          "values": [
            12,
            5,
            8,
            6
          ],
          "xAxisLabel": "Minibeast",
          "yAxisLabel": "Number found"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 4,
      "tolerance": 0
    },
    "explanation": "Read the height of the ants bar, which is 12, and the beetles bar, which is 8. To find how many more, take away the smaller number from the larger one: 12 minus 8 equals 4. So they found 4 more ants than beetles.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Reading results from a bar chart",
      "skill": "Comparing two bars to find the difference",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 80,
      "tags": [
        "data",
        "bar chart",
        "minibeasts",
        "investigating"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Children rolled the same ball along the floor, pushing it a different way each time, and measured how far it went. What does the chart show?",
    "options": [
      {
        "id": "harder-further",
        "text": "A harder push made the ball roll a longer way"
      },
      {
        "id": "gentle-furthest",
        "text": "A gentle push made the ball roll the furthest of all"
      },
      {
        "id": "no-difference",
        "text": "The strength of the push made no difference at all"
      },
      {
        "id": "medium-shortest",
        "text": "A medium push made the ball roll the shortest way"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-009-1",
        "type": "bar_chart",
        "altText": "A bar chart of how far a ball rolled. Gentle push 3 metres, Medium push 6 metres, Hard push 10 metres.",
        "data": {
          "labels": [
            "Gentle",
            "Medium",
            "Hard"
          ],
          "values": [
            3,
            6,
            10
          ],
          "xAxisLabel": "Type of push",
          "yAxisLabel": "Distance rolled (m)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "harder-further"
    },
    "explanation": "Compare the bars from left to right. The gentle push gave 3 metres, the medium push gave 6 metres, and the hard push gave 10 metres. As the push got stronger, the ball rolled further, so a harder push made the ball roll a longer way. The gentle push was the shortest, not the furthest, and the bars clearly change, so the push did make a difference.",
    "metadata": {
      "subject": "science",
      "strand": "Physical sciences",
      "topic": "Forces and motion",
      "skill": "Drawing a conclusion about force size from a chart",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "forces",
        "push",
        "bar chart",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-010",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which TWO of these statements about magnets are true?",
    "options": [
      {
        "id": "poles",
        "text": "The two ends of a magnet are called its poles"
      },
      {
        "id": "allmetals",
        "text": "A magnet attracts every kind of metal there is"
      },
      {
        "id": "southpoles",
        "text": "Two south poles pull towards each other strongly"
      },
      {
        "id": "iron",
        "text": "A magnet can attract objects made of iron"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "iron",
        "poles"
      ]
    },
    "explanation": "Magnets attract objects made of iron and steel, so the iron statement is true, and the two ends of a magnet really are called its poles, so that is true too. It is not true that magnets attract every metal, because metals like aluminium and copper are not attracted. It is also not true that two south poles pull together, because two of the same pole push each other apart.",
    "metadata": {
      "subject": "science",
      "strand": "Physical sciences",
      "topic": "Magnets",
      "skill": "Recognising true facts about how magnets behave",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "forces",
        "magnets",
        "poles",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-011",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gum leaf was measured against a ruler shown as a number line. The dot marks where the end of the leaf reached. How long is the leaf?",
    "options": [
      {
        "id": "twelve",
        "text": "12 cm"
      },
      {
        "id": "thirteen",
        "text": "13 cm"
      },
      {
        "id": "fourteen",
        "text": "14 cm"
      },
      {
        "id": "sixteen",
        "text": "16 cm"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-011-1",
        "type": "number_line",
        "altText": "A number line from 0 to 20 with a mark every 2 units. A single dot sits on the tick at 14.",
        "data": {
          "min": 0,
          "max": 20,
          "step": 2,
          "highlightedValues": [
            14
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "fourteen"
    },
    "explanation": "The ticks on this line go up by 2 each time: 0, 2, 4, 6, 8, 10, 12, 14. Count the ticks until you reach the dot. The dot sits one tick past 12, which is 14, so the leaf is 14 cm long.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Measuring and reading a scale",
      "skill": "Reading a measurement from a number line",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "measuring",
        "number line",
        "investigating"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-012",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A push and a pull are both forces that can change how an object moves. Is this true or false?",
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "This is true. A force is a push or a pull. Both a push and a pull can start something moving, stop it, speed it up, slow it down or change its direction, so both are forces that change how an object moves.",
    "metadata": {
      "subject": "science",
      "strand": "Physical sciences",
      "topic": "Forces",
      "skill": "Understanding that pushes and pulls are forces",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "forces",
        "push",
        "pull"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which statement about the Sun is correct?",
    "options": [
      {
        "id": "planet",
        "text": "The Sun is a planet that orbits Earth"
      },
      {
        "id": "night",
        "text": "The Sun gives out light only at night"
      },
      {
        "id": "smaller",
        "text": "The Sun is smaller than our Moon"
      },
      {
        "id": "star",
        "text": "The Sun is a star that gives us light and heat"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "star"
    },
    "explanation": "The Sun is a star, and it gives Earth both light and heat, so the first statement is correct. The Sun is not a planet, and Earth actually travels around the Sun, not the other way round. The Sun shines during the day, not at night. The Sun is far larger than the Moon; it only looks small because it is very far away.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and space sciences",
      "topic": "The Sun",
      "skill": "Recognising true facts about the Sun",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "earth and space",
        "sun",
        "star"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-014",
    "type": "ordering",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Put these three space objects in order of size, from the smallest to the largest.",
    "interaction": {
      "type": "ordering",
      "items": [
        {
          "id": "moon",
          "text": "The Moon"
        },
        {
          "id": "earth",
          "text": "The Earth"
        },
        {
          "id": "sun",
          "text": "The Sun"
        }
      ]
    },
    "visuals": [],
    "answerKey": {
      "kind": "ordering",
      "optionIds": [
        "moon",
        "earth",
        "sun"
      ]
    },
    "explanation": "The Moon is the smallest of the three. The Earth is much bigger than the Moon. The Sun is by far the largest, big enough that many Earths could fit inside it. So from smallest to largest the order is the Moon, the Earth, then the Sun.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and space sciences",
      "topic": "Sizes of Earth, Sun and Moon",
      "skill": "Ordering space objects by size",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "earth and space",
        "sun",
        "moon",
        "size"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class recorded the weather on each of 20 school days and made a pie chart. On which type of weather did the most days fall?",
    "options": [
      {
        "id": "sunny",
        "text": "Sunny"
      },
      {
        "id": "cloudy",
        "text": "Cloudy"
      },
      {
        "id": "rainy",
        "text": "Rainy"
      },
      {
        "id": "same",
        "text": "They were all exactly the same"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-015-1",
        "type": "pie_chart",
        "altText": "A pie chart of weather over 20 days: Sunny 10, Cloudy 6, Rainy 4.",
        "data": {
          "segments": [
            {
              "label": "Sunny",
              "value": 10
            },
            {
              "label": "Cloudy",
              "value": 6
            },
            {
              "label": "Rainy",
              "value": 4
            }
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sunny"
    },
    "explanation": "The biggest slice of the pie shows the type of weather with the most days. The sunny slice is the largest, taking up half of the whole circle at 10 days, which is more than cloudy at 6 or rainy at 4. So the most days were sunny.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Reading a pie chart",
      "skill": "Finding the largest category on a pie chart",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "data",
        "pie chart",
        "weather",
        "investigating"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-db-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A bean plant's height was measured at the end of each week and shown on a line graph. Between which two weeks did the plant grow the most?",
    "options": [
      {
        "id": "w1-2",
        "text": "Between Week 1 and Week 2"
      },
      {
        "id": "w2-3",
        "text": "Between Week 2 and Week 3"
      },
      {
        "id": "w3-4",
        "text": "Between Week 3 and Week 4"
      },
      {
        "id": "w1-4",
        "text": "Between Week 1 and Week 4"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-db-016-1",
        "type": "line_graph",
        "altText": "A line graph of bean plant height: Week 1 is 2 cm, Week 2 is 4 cm, Week 3 is 9 cm, Week 4 is 11 cm.",
        "data": {
          "points": [
            {
              "x": 1,
              "y": 2,
              "label": "Week 1"
            },
            {
              "x": 2,
              "y": 4,
              "label": "Week 2"
            },
            {
              "x": 3,
              "y": 9,
              "label": "Week 3"
            },
            {
              "x": 4,
              "y": 11,
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
      "optionId": "w2-3"
    },
    "explanation": "Growth in a week is how much the height went up. From Week 1 to Week 2 it rose from 2 to 4, a jump of 2. From Week 2 to Week 3 it rose from 4 to 9, a jump of 5. From Week 3 to Week 4 it rose from 9 to 11, a jump of 2. The steepest part of the line is between Week 2 and Week 3, where it grew the most.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Reading a line graph",
      "skill": "Finding the largest change on a line graph",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "data",
        "line graph",
        "plant growth",
        "investigating"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Meera lifted one end of a ramp higher each time and let the same toy car roll down. She measured how far the car rolled across the floor. Look at her results. What do the results tell us?",
    "options": [
      {
        "id": "higher-shorter",
        "text": "The higher the ramp, the shorter the car rolled."
      },
      {
        "id": "no-effect",
        "text": "The ramp height did not change the distance at all."
      },
      {
        "id": "higher-further",
        "text": "The higher the ramp, the further the car rolled."
      },
      {
        "id": "always-same",
        "text": "The car rolled exactly the same distance each time."
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e1-001-1",
        "type": "table",
        "altText": "A table with columns Ramp height in cm and Distance car rolled in cm. Rows show 10 and 40, 20 and 75, 30 and 120.",
        "data": {
          "headers": [
            "Ramp height (cm)",
            "Distance car rolled (cm)"
          ],
          "rows": [
            [
              "10",
              "40"
            ],
            [
              "20",
              "75"
            ],
            [
              "30",
              "120"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "higher-further"
    },
    "explanation": "Read the table from top to bottom. As the ramp height goes 10, 20, 30, the distance goes 40, 75, 120, which keeps getting bigger, so a higher ramp makes the car roll further.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Forces and movement",
      "skill": "Interpret results from a simple experiment table",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "experiment",
        "ramp",
        "data table"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-002",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam kept a healthy green plant in a dark cupboard for two weeks but still watered it. The plant turned pale yellow and floppy. Which thing that the plant needs was missing in the cupboard?",
    "options": [
      {
        "id": "water",
        "text": "Water"
      },
      {
        "id": "air",
        "text": "Fresh air"
      },
      {
        "id": "soil",
        "text": "Soil"
      },
      {
        "id": "sunlight",
        "text": "Sunlight"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "sunlight"
    },
    "explanation": "Plants use sunlight to make their own food. The cupboard still had water, air and soil, but no light, so the plant could not make food and went pale and floppy.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Needs of living things",
      "skill": "Living things: needs, life cycles, habitats",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "plants",
        "needs",
        "sunlight"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which list shows the life cycle of a butterfly in the correct order, from the very start?",
    "options": [
      {
        "id": "egg-first",
        "text": "Egg, caterpillar, chrysalis, butterfly"
      },
      {
        "id": "cat-first",
        "text": "Caterpillar, egg, butterfly, chrysalis"
      },
      {
        "id": "adult-first",
        "text": "Butterfly, chrysalis, caterpillar, egg"
      },
      {
        "id": "mixed",
        "text": "Egg, butterfly, caterpillar, chrysalis"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "egg-first"
    },
    "explanation": "An adult butterfly lays an egg, the egg hatches into a caterpillar that eats and grows, the caterpillar forms a chrysalis where it changes, then an adult butterfly comes out. So the order starts with the egg.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Life cycles",
      "skill": "Living things: needs, life cycles, habitats",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "life cycle",
        "butterfly",
        "sequence"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "An animal has a smooth, streamlined body and breathes using gills. Which place is this animal best suited to living in?",
    "options": [
      {
        "id": "desert",
        "text": "A dry sandy desert"
      },
      {
        "id": "pond",
        "text": "A freshwater pond"
      },
      {
        "id": "treetop",
        "text": "The top of a tall tree"
      },
      {
        "id": "cave",
        "text": "A dark dry cave"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "pond"
    },
    "explanation": "Gills take in oxygen from water, not air, and a streamlined body helps an animal slip through water easily. These features only work in water, so a pond is the best home.",
    "metadata": {
      "subject": "science",
      "strand": "Biological Sciences",
      "topic": "Habitats",
      "skill": "Living things: needs, life cycles, habitats",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "habitat",
        "adaptation",
        "gills"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-005",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A dry wooden block floats in water while a steel bolt of the same size sinks. This shows that whether an object floats can depend on what it is made from.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "The block and the bolt are the same size but behave differently, and the only thing changed is the material. So the material an object is made from can decide whether it floats or sinks.",
    "metadata": {
      "subject": "science",
      "strand": "Material world",
      "topic": "Float and sink",
      "skill": "Materials and their properties (float/sink, bend, absorb)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "materials",
        "float",
        "sink"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-006",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ravi spills some juice on the kitchen bench and wants to soak it up quickly. Which material would soak up the juice best?",
    "options": [
      {
        "id": "plastic",
        "text": "A plastic sheet"
      },
      {
        "id": "foil",
        "text": "Aluminium foil"
      },
      {
        "id": "paper-towel",
        "text": "A paper towel"
      },
      {
        "id": "glass",
        "text": "A glass tile"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "paper-towel"
    },
    "explanation": "An absorbent material has tiny fibres and spaces that draw liquid in. A paper towel is absorbent, while plastic, foil and glass are waterproof and let the juice sit on top instead of soaking in.",
    "metadata": {
      "subject": "science",
      "strand": "Material world",
      "topic": "Absorbency",
      "skill": "Materials and their properties (float/sink, bend, absorb)",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "materials",
        "absorb",
        "everyday"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In Australia, which season usually has the shortest, coolest days, with frost sometimes forming on the grass in the morning?",
    "options": [
      {
        "id": "summer",
        "text": "Summer"
      },
      {
        "id": "spring",
        "text": "Spring"
      },
      {
        "id": "autumn",
        "text": "Autumn"
      },
      {
        "id": "winter",
        "text": "Winter"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "winter"
    },
    "explanation": "Winter in Australia (about June to August) has the fewest hours of daylight and the coldest air, so mornings are chilly and frost can form. The other seasons are warmer with longer days.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Weather and seasons",
      "skill": "Weather and seasons",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "seasons",
        "weather",
        "winter"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The table shows the highest temperature recorded in four country towns on the same day. How many degrees warmer was the warmest town than the coolest town?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e1-008-1",
        "type": "table",
        "altText": "A table with columns Town and Highest temperature in degrees Celsius. Dalby 28, Echuca 31, Colac 19, Casino 33.",
        "data": {
          "headers": [
            "Town",
            "Highest temperature (°C)"
          ],
          "rows": [
            [
              "Dalby",
              "28"
            ],
            [
              "Echuca",
              "31"
            ],
            [
              "Colac",
              "19"
            ],
            [
              "Casino",
              "33"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 14,
      "tolerance": 0,
      "instructions": "Write just the number of degrees, without the unit."
    },
    "explanation": "Find the biggest number in the temperature column (33 at Casino) and the smallest (19 at Colac). Then subtract: 33 minus 19 equals 14.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Weather data",
      "skill": "Reading a weather data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "weather",
        "table",
        "temperature"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A child slides a drawer open to reach a pencil, then slides it shut again. Which pair of forces best describes opening and then closing the drawer?",
    "options": [
      {
        "id": "pull-push",
        "text": "A pull, then a push"
      },
      {
        "id": "push-pull",
        "text": "A push, then a pull"
      },
      {
        "id": "two-pushes",
        "text": "Two pushes, one after the other"
      },
      {
        "id": "two-pulls",
        "text": "Two pulls, one after the other"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "pull-push"
    },
    "explanation": "A pull brings something closer to you and a push moves it away. Opening a drawer pulls it towards you, and closing it pushes it away, so the order is pull then push.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Push and pull",
      "skill": "Forces and movement: push, pull, friction, gravity",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "forces",
        "push",
        "pull"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A ball is rolled with the same push across smooth floorboards and across a thick woolly rug. On which surface will the ball slow down and stop sooner, and why?",
    "options": [
      {
        "id": "floor-more",
        "text": "The floorboards, because they have more friction."
      },
      {
        "id": "rug-more",
        "text": "The rug, because it has more friction."
      },
      {
        "id": "rug-none",
        "text": "The rug, because a rug has no friction at all."
      },
      {
        "id": "equal",
        "text": "Both the same, because friction is always equal."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "rug-more"
    },
    "explanation": "Friction is a force that acts against movement and is stronger on rough surfaces. A woolly rug is rougher than smooth boards, so it grips the ball more and stops it sooner.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Friction",
      "skill": "Forces and movement: push, pull, friction, gravity",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "forces",
        "friction",
        "surfaces"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-011",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "When you let go of a ball in the air, it falls to the ground because a pushing force from the air pushes it downwards.",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "The ball falls because of gravity, a force that pulls objects down towards the Earth. Air does not push it down, so the statement is false.",
    "metadata": {
      "subject": "science",
      "strand": "Physical Sciences",
      "topic": "Gravity",
      "skill": "Forces and movement: push, pull, friction, gravity",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "forces",
        "gravity",
        "falling"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Why does the Earth have day and night?",
    "options": [
      {
        "id": "sun-off",
        "text": "The Sun switches itself off and stops shining at night time."
      },
      {
        "id": "moon",
        "text": "The Moon slides across the sky and fully covers the Sun."
      },
      {
        "id": "spins",
        "text": "The Earth spins around, turning each side to face the Sun."
      },
      {
        "id": "clouds",
        "text": "Thick grey clouds hide the Sun away from us during the night."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "spins"
    },
    "explanation": "The Earth spins around once about every 24 hours. The side turned towards the Sun has daytime and the side turned away has night, so spinning gives us day and night.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Day and night",
      "skill": "Day and night, sun and shadows",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "day and night",
        "Earth",
        "Sun"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class measured the length of a pole's shadow at three times during the day. Look at the graph. When was the shadow shortest?",
    "options": [
      {
        "id": "morning",
        "text": "At 9 am"
      },
      {
        "id": "afternoon",
        "text": "At 3 pm"
      },
      {
        "id": "unchanged",
        "text": "The shadow stayed the same length all day."
      },
      {
        "id": "midday",
        "text": "At 12 pm (midday)"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e1-013-1",
        "type": "line_graph",
        "altText": "A line graph of shadow length in centimetres against time of day. At 9 am it is 120, at 12 pm it drops to 40, and at 3 pm it rises to 110.",
        "data": {
          "points": [
            {
              "x": 9,
              "y": 120,
              "label": "9 am"
            },
            {
              "x": 12,
              "y": 40,
              "label": "12 pm"
            },
            {
              "x": 15,
              "y": 110,
              "label": "3 pm"
            }
          ],
          "xAxisLabel": "Time of day",
          "yAxisLabel": "Shadow length (cm)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "midday"
    },
    "explanation": "Look for the lowest point on the graph, which is the shortest shadow. That happens at 12 pm, when the Sun is highest in the sky and shadows are at their shortest.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Sun and shadows",
      "skill": "Day and night, sun and shadows",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "shadows",
        "Sun",
        "line graph"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-014",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The bar chart shows how many rainy days were recorded in a town in four months. Autumn is made up of March, April and May. How many rainy days were there altogether in autumn?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e1-014-1",
        "type": "bar_chart",
        "altText": "A bar chart of rainy days for four months: March 6, April 9, May 7, June 12.",
        "data": {
          "labels": [
            "March",
            "April",
            "May",
            "June"
          ],
          "values": [
            6,
            9,
            7,
            12
          ],
          "xAxisLabel": "Month",
          "yAxisLabel": "Rainy days"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 22,
      "tolerance": 0,
      "instructions": "Write just the number of days, without the unit."
    },
    "explanation": "Add the three autumn months from the chart: March 6, April 9 and May 7. So 6 plus 9 plus 7 equals 22. June is winter, so leave it out.",
    "metadata": {
      "subject": "science",
      "strand": "Earth and Space Sciences",
      "topic": "Weather data",
      "skill": "Reading a weather data table",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "weather",
        "bar chart",
        "rainfall"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-015",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Priya dripped the same amount of water onto four cloths and measured how much water each one soaked up. Look at her table. Which cloth is the most absorbent?",
    "options": [
      {
        "id": "cotton",
        "text": "The cotton cloth"
      },
      {
        "id": "nylon",
        "text": "The nylon cloth"
      },
      {
        "id": "wool",
        "text": "The woollen cloth"
      },
      {
        "id": "silk",
        "text": "The silk cloth"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e1-015-1",
        "type": "table",
        "altText": "A table with columns Cloth and Water soaked up in millilitres. Cotton 18, Nylon 5, Wool 12, Silk 3.",
        "data": {
          "headers": [
            "Cloth",
            "Water soaked up (mL)"
          ],
          "rows": [
            [
              "Cotton",
              "18"
            ],
            [
              "Nylon",
              "5"
            ],
            [
              "Wool",
              "12"
            ],
            [
              "Silk",
              "3"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "cotton"
    },
    "explanation": "The most absorbent cloth soaks up the most water. Find the largest number in the millilitres column, which is 18 mL for the cotton cloth.",
    "metadata": {
      "subject": "science",
      "strand": "Material world",
      "topic": "Absorbency",
      "skill": "Interpret results from a simple experiment table",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "materials",
        "absorb",
        "data table"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e1-016",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A designer is choosing a material for the top part of a bendy drinking straw, which must bend around without snapping. Which property matters most for this job?",
    "options": [
      {
        "id": "hard",
        "text": "It is very hard and stays stiff."
      },
      {
        "id": "flexible",
        "text": "It bends easily without snapping."
      },
      {
        "id": "clear",
        "text": "It lets light pass right through."
      },
      {
        "id": "magnetic",
        "text": "It sticks firmly to any magnet."
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "flexible"
    },
    "explanation": "A bendy straw needs to change shape without breaking, so the key property is being flexible. Being hard, clear or magnetic would not help it bend, and a stiff material would snap.",
    "metadata": {
      "subject": "science",
      "strand": "Material world",
      "topic": "Material properties",
      "skill": "Materials and their properties (float/sink, bend, absorb)",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "materials",
        "flexible",
        "bend"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-001",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A gardener gently lifts a small plant out of the ground and notices thin, hairy threads spreading out at the bottom. What is the main job of this part of the plant?",
    "options": [
      {
        "id": "make-food-from-sunlight",
        "text": "make food from sunlight"
      },
      {
        "id": "make-seeds-for-new-plants",
        "text": "make seeds for new plants"
      },
      {
        "id": "take-in-water-and-hold-steady",
        "text": "take in water and keep the plant steady"
      },
      {
        "id": "carry-water-up-the-plant",
        "text": "carry water up the plant"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "take-in-water-and-hold-steady"
    },
    "explanation": "The hairy threads at the bottom of a plant are its roots. Roots soak up water and minerals from the soil and grip the ground so the plant does not fall over. Making food is the leaves' job, seeds come from flowers, and the stem carries water upward.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Plant parts and their jobs",
      "skill": "Identify plant parts and their functions",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "plants",
        "roots",
        "structure and function"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-002",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A plant's leaves use sunlight to help make food for the whole plant. Is this true or false?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "Leaves are like tiny kitchens. They catch sunlight and use it, together with water and air, to make sugary food for the plant. That is why plants kept in the dark for a long time become weak and pale.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Plant parts and their jobs",
      "skill": "Explain the function of leaves",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 30,
      "tags": [
        "plants",
        "leaves",
        "food"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-003",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Meera puts a young bean plant on a sunny windowsill and remembers to water it. Which of these does the plant NOT need in order to grow well?",
    "options": [
      {
        "id": "sunlight",
        "text": "sunlight"
      },
      {
        "id": "water",
        "text": "water"
      },
      {
        "id": "soil-nutrients",
        "text": "soil nutrients"
      },
      {
        "id": "a-loud-radio",
        "text": "a loud radio"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "a-loud-radio"
    },
    "explanation": "To grow well a plant needs light, water, air and nutrients from the soil. Sound does not help a plant grow, so the loud radio is the thing it does not need. The other three are all real needs.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "What plants need to grow",
      "skill": "Identify the needs of plants",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "plants",
        "needs",
        "growth"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-004",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Sam wants to find out if plants grow taller when they get more water. He gives Plant A 100 mL of water each day and Plant B 300 mL each day. Both plants get the same light, the same soil and the same size pot. What is Sam changing on purpose?",
    "options": [
      {
        "id": "amount-of-water",
        "text": "the amount of water"
      },
      {
        "id": "amount-of-light",
        "text": "the amount of light"
      },
      {
        "id": "type-of-soil",
        "text": "the type of soil"
      },
      {
        "id": "size-of-the-pot",
        "text": "the size of the pot"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "amount-of-water"
    },
    "explanation": "In a fair test you change only one thing. Sam kept the light, soil and pot the same for both plants, and the only difference was how much water each got. So the thing he changed on purpose is the amount of water.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Fair testing",
      "skill": "Identify the changed variable",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "fair test",
        "variables",
        "investigation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-005",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "In Sam's watering test, he wants to know which plant grows taller. What should he measure to answer his question?",
    "options": [
      {
        "id": "colour-of-the-pots",
        "text": "the colour of the pots"
      },
      {
        "id": "height-of-each-plant",
        "text": "the height of each plant"
      },
      {
        "id": "time-of-day",
        "text": "the time of day"
      },
      {
        "id": "how-much-water-he-pours",
        "text": "how much water he pours"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "height-of-each-plant"
    },
    "explanation": "His question is about which plant grows taller, so he must measure how tall each plant becomes. The amount of water is what he changed, not what he measures, and pot colour and the time of day do not tell him about growth.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Fair testing",
      "skill": "Identify the measured variable",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "fair test",
        "measuring",
        "investigation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-006",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "To keep Sam's watering test fair, Plant A and Plant B should be given different amounts of light. Is this true or false?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": false
    },
    "explanation": "In a fair test everything except the one thing being tested must stay the same. Sam is testing water, so both plants must get the SAME light. Changing the light too would make it impossible to know which difference caused any change in growth.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Fair testing",
      "skill": "Keep variables controlled",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 45,
      "tags": [
        "fair test",
        "controlled variables",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-007",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The line graph shows the air temperature measured outside a classroom at different times during one day. Between which two times did the temperature rise the most?",
    "options": [
      {
        "id": "8am-to-10am",
        "text": "Between 8 am and 10 am"
      },
      {
        "id": "10am-to-12pm",
        "text": "Between 10 am and 12 pm"
      },
      {
        "id": "12pm-to-2pm",
        "text": "Between 12 pm and 2 pm"
      },
      {
        "id": "2pm-to-4pm",
        "text": "Between 2 pm and 4 pm"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e2-007-1",
        "type": "line_graph",
        "altText": "A line graph of temperature during one day: 8 am is 14 degrees, 10 am is 16, 12 pm is 19, 2 pm is 25 and 4 pm is 23 degrees Celsius.",
        "data": {
          "points": [
            {
              "x": 8,
              "y": 14,
              "label": "8 am"
            },
            {
              "x": 10,
              "y": 16,
              "label": "10 am"
            },
            {
              "x": 12,
              "y": 19,
              "label": "12 pm"
            },
            {
              "x": 14,
              "y": 25,
              "label": "2 pm"
            },
            {
              "x": 16,
              "y": 23,
              "label": "4 pm"
            }
          ],
          "xAxisLabel": "Time of day",
          "yAxisLabel": "Temperature (degrees C)"
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "12pm-to-2pm"
    },
    "explanation": "Work out the change for each gap: 8-10 am rose 2 degrees, 10 am-12 pm rose 3, 12 pm-2 pm rose 6, and 2-4 pm fell 2. The steepest upward part of the line, a rise of 6 degrees, is between 12 pm and 2 pm.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Interpreting graphs",
      "skill": "Read change from a line graph",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 90,
      "tags": [
        "line graph",
        "temperature",
        "data interpretation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-008",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "The line graph shows how tall a sunflower was at the end of each week. How many centimetres did the sunflower grow in total from the end of Week 1 to the end of Week 4?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e2-008-1",
        "type": "line_graph",
        "altText": "A line graph of a sunflower's height: Week 1 is 10 cm, Week 2 is 18 cm, Week 3 is 27 cm and Week 4 is 40 cm.",
        "data": {
          "points": [
            {
              "x": 1,
              "y": 10,
              "label": "Week 1"
            },
            {
              "x": 2,
              "y": 18,
              "label": "Week 2"
            },
            {
              "x": 3,
              "y": 27,
              "label": "Week 3"
            },
            {
              "x": 4,
              "y": 40,
              "label": "Week 4"
            }
          ],
          "xAxisLabel": "Week",
          "yAxisLabel": "Height (cm)"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 30,
      "tolerance": 0,
      "instructions": "Write just the number of centimetres, without the unit."
    },
    "explanation": "To find the total growth, take the height at the end away from the height at the start: 40 cm at Week 4 minus 10 cm at Week 1 gives 30 cm. You do not need to add each week separately.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Interpreting graphs",
      "skill": "Calculate change from a line graph",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "line graph",
        "plant growth",
        "data interpretation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-009",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Which of these is a gas at room temperature?",
    "options": [
      {
        "id": "a-small-ice-cube",
        "text": "a small ice cube"
      },
      {
        "id": "the-milk-inside-a-bottle",
        "text": "the milk inside a bottle"
      },
      {
        "id": "a-wooden-ruler",
        "text": "a wooden ruler"
      },
      {
        "id": "the-gas-inside-a-balloon",
        "text": "the puff you blow into a balloon"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "the-gas-inside-a-balloon"
    },
    "explanation": "The puff you blow into a balloon is air, which is a gas and spreads out to fill the balloon. An ice cube and a wooden ruler are solids that keep their shape, and milk is a liquid that pours and takes the shape of its container.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "States of matter",
      "skill": "Classify materials as solid, liquid or gas",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 40,
      "tags": [
        "states of matter",
        "gas",
        "classifying"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-010",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "An ice cube is left on a plate in a warm room. After a while there is a small puddle of water on the plate and the ice cube has gone. What has happened to the ice?",
    "options": [
      {
        "id": "melted-solid-to-liquid",
        "text": "it changed from a solid to a liquid"
      },
      {
        "id": "froze-liquid-to-solid",
        "text": "it changed from a liquid to a solid"
      },
      {
        "id": "turned-into-a-gas",
        "text": "it changed from a solid to a gas"
      },
      {
        "id": "did-not-change",
        "text": "it did not change at all"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "melted-solid-to-liquid"
    },
    "explanation": "Warmth added heat to the solid ice, causing it to melt into liquid water, which is why a puddle appeared. Freezing would go the other way, and turning into a gas would leave no puddle at all.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "States of matter",
      "skill": "Identify melting as a change of state",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "states of matter",
        "melting",
        "change of state"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-011",
    "type": "true_false",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "When water in a pot boils and rises as steam, it is changing from a liquid into a gas. Is this true or false?",
    "options": [],
    "visuals": [],
    "answerKey": {
      "kind": "boolean",
      "value": true
    },
    "explanation": "Boiling adds enough heat to turn liquid water into a gas called water vapour, seen as steam rising from the pot. This is a change of state from liquid to gas, the opposite of what happens when steam cools and turns back into water.",
    "metadata": {
      "subject": "science",
      "strand": "Chemical sciences",
      "topic": "States of matter",
      "skill": "Identify evaporation and boiling",
      "difficulty": "easy",
      "marks": 1,
      "estimatedTimeSeconds": 35,
      "tags": [
        "states of matter",
        "boiling",
        "gas"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-012",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Ava stretches a rubber band between her fingers and plucks it. She hears a buzzing sound and sees the band blur. What is making the sound?",
    "options": [
      {
        "id": "band-changing-colour",
        "text": "the band changing to a new colour"
      },
      {
        "id": "band-vibrating",
        "text": "the band vibrating back and forth"
      },
      {
        "id": "band-getting-warmer",
        "text": "the band getting a little warmer"
      },
      {
        "id": "band-getting-longer",
        "text": "the band growing much longer"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "band-vibrating"
    },
    "explanation": "Sounds are made by things that vibrate. The plucked band moves quickly back and forth, which is why it looks blurred, and that vibration pushes the air to make the buzzing sound your ears pick up.",
    "metadata": {
      "subject": "science",
      "strand": "Physical sciences",
      "topic": "Sound",
      "skill": "Link sound to vibration",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "sound",
        "vibration",
        "observation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-013",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "On a bright, sunny day Leo stands still on the footpath and notices a dark shadow shaped like him on the ground. Why does the shadow form?",
    "options": [
      {
        "id": "body-makes-light",
        "text": "his body makes its own light"
      },
      {
        "id": "ground-gives-off-light",
        "text": "the ground gives off light"
      },
      {
        "id": "body-blocks-sunlight",
        "text": "his body blocks the sunlight"
      },
      {
        "id": "sunlight-passes-through",
        "text": "sunlight passes right through him"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "single_option",
      "optionId": "body-blocks-sunlight"
    },
    "explanation": "A shadow is a dark patch that appears when something blocks light. Leo's body is not see-through, so it stops the sunlight reaching the ground behind him, leaving a shadow shaped like him. People do not make their own light.",
    "metadata": {
      "subject": "science",
      "strand": "Physical sciences",
      "topic": "Light",
      "skill": "Explain how shadows form",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 50,
      "tags": [
        "light",
        "shadows",
        "observation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-014",
    "type": "multiple_choice",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class recorded features of four animals in the table. Which animal has feathers and two legs?",
    "options": [
      {
        "id": "rabbit",
        "text": "Rabbit"
      },
      {
        "id": "lizard",
        "text": "Lizard"
      },
      {
        "id": "beetle",
        "text": "Beetle"
      },
      {
        "id": "magpie",
        "text": "Magpie"
      }
    ],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e2-014-1",
        "type": "table",
        "altText": "A table of animals and their features. Rabbit: fur, 4 legs. Magpie: feathers, 2 legs. Lizard: scales, 4 legs. Beetle: hard shell, 6 legs.",
        "data": {
          "headers": [
            "Animal",
            "Body covering",
            "Number of legs"
          ],
          "rows": [
            [
              "Rabbit",
              "fur",
              "4"
            ],
            [
              "Magpie",
              "feathers",
              "2"
            ],
            [
              "Lizard",
              "scales",
              "4"
            ],
            [
              "Beetle",
              "hard shell",
              "6"
            ]
          ]
        }
      }
    ],
    "answerKey": {
      "kind": "single_option",
      "optionId": "magpie"
    },
    "explanation": "Look along each row for feathers AND two legs. Only the magpie's row shows feathers with 2 legs. The rabbit has fur, the lizard has scales, and the beetle has a hard shell with 6 legs, so none of those fit both clues.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Classifying animals",
      "skill": "Sort animals by observable features",
      "difficulty": "medium",
      "marks": 1,
      "estimatedTimeSeconds": 60,
      "tags": [
        "classifying",
        "animals",
        "table"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-015",
    "type": "multiple_select",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "Choose TWO features you could use to sort animals just by looking closely at them.",
    "options": [
      {
        "id": "body-covering",
        "text": "body covering"
      },
      {
        "id": "favourite-food",
        "text": "favourite food"
      },
      {
        "id": "number-of-legs",
        "text": "number of legs"
      },
      {
        "id": "what-it-dreams-about",
        "text": "what it dreams about"
      }
    ],
    "visuals": [],
    "answerKey": {
      "kind": "multiple_options",
      "optionIds": [
        "body-covering",
        "number-of-legs"
      ]
    },
    "explanation": "Sorting by observable features means using things you can actually see. You can look at an animal and see its body covering and count its legs. You cannot see what an animal likes to eat or dreams about just by looking, so those cannot be used.",
    "metadata": {
      "subject": "science",
      "strand": "Biological sciences",
      "topic": "Classifying animals",
      "skill": "Identify observable features",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 70,
      "tags": [
        "classifying",
        "observable features",
        "reasoning"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  },
  {
    "id": "icas-y3-science-e2-016",
    "type": "number_entry",
    "yearLevel": 3,
    "examStyle": "icas_style",
    "status": "published",
    "origin": "original_seed",
    "prompt": "A class counted the minibeasts they found in the school garden and recorded them on the bar chart. How many more ants than snails did they find?",
    "options": [],
    "visuals": [
      {
        "id": "visual-icas-y3-science-e2-016-1",
        "type": "bar_chart",
        "altText": "A bar chart of minibeasts found: Ants 18, Snails 6, Worms 9, Beetles 12.",
        "data": {
          "labels": [
            "Ants",
            "Snails",
            "Worms",
            "Beetles"
          ],
          "values": [
            18,
            6,
            9,
            12
          ],
          "xAxisLabel": "Minibeast",
          "yAxisLabel": "Number found"
        }
      }
    ],
    "answerKey": {
      "kind": "number",
      "value": 12,
      "tolerance": 0
    },
    "explanation": "Find the ant bar (18) and the snail bar (6), then take the smaller from the larger: 18 minus 6 equals 12. So they found 12 more ants than snails.",
    "metadata": {
      "subject": "science",
      "strand": "Science inquiry",
      "topic": "Interpreting graphs",
      "skill": "Compare values on a bar chart",
      "difficulty": "challenging",
      "marks": 1,
      "estimatedTimeSeconds": 75,
      "tags": [
        "bar chart",
        "minibeasts",
        "data interpretation"
      ],
      "locale": "en-AU",
      "source": "original",
      "schemaVersion": 1
    }
  }
] as QuestionSeed[]),
]);
