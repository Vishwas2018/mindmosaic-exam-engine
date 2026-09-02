import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  candidateQuestionSchema,
  type CandidateQuestion,
  type CandidateQuestionInput,
} from "../src/features/question-factory/ingestion/candidate-question";

const OUTPUT_PATH = path.resolve(
  "content/question-factory/inbox/g5-numeracy-challenging-50.json",
);

const baseMetadata = {
  subject: "numeracy" as const,
  difficulty: "challenging" as const,
  marks: 2,
  estimatedTimeSeconds: 100,
};

function numberEntry(
  id: string,
  prompt: string,
  answer: number,
  explanation: string,
  strand: string,
  skill: string,
  tags: string[],
  visuals: CandidateQuestionInput["visuals"] = [],
): CandidateQuestionInput {
  return {
    id,
    type: "number_entry",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt,
    options: [],
    visuals,
    answerKey: { kind: "number", value: answer, tolerance: 0 },
    explanation,
    metadata: { ...baseMetadata, strand, skill, tags },
  };
}

const questions: CandidateQuestionInput[] = [];

const barChartSpecs = [
  { labels: ["Banksia", "Grevillea", "Wattle", "Tea-tree"], values: [18, 27, 34, 21], prompt: "How many more books were read by Wattle group than Banksia group?", answer: 16, explanation: "Wattle read 34 books and Banksia read 18 books. The difference is 34 − 18 = 16 books." },
  { labels: ["Monday", "Tuesday", "Wednesday", "Thursday"], values: [24, 31, 19, 36], prompt: "How many seedlings were planted on Monday and Thursday altogether?", answer: 60, explanation: "The chart shows 24 seedlings on Monday and 36 on Thursday. Altogether, 24 + 36 = 60." },
  { labels: ["Kookaburras", "Lorikeets", "Magpies", "Rosellas"], values: [42, 35, 48, 29], prompt: "What is the difference between the number of laps completed by the Magpies and the Lorikeets?", answer: 13, explanation: "The Magpies completed 48 laps and the Lorikeets completed 35. The difference is 48 − 35 = 13." },
  { labels: ["Blue", "Gold", "Green", "Red"], values: [56, 43, 61, 38], prompt: "How many cans did the Blue and Green teams collect altogether?", answer: 117, explanation: "The Blue team collected 56 cans and the Green team collected 61. Their total is 56 + 61 = 117 cans." },
  { labels: ["Drama", "Music", "Science", "Sport"], values: [75, 64, 82, 59], prompt: "How many more tickets were sold for the most popular club than for the least popular club?", answer: 23, explanation: "Science sold the most tickets, 82, and Sport sold the least, 59. The difference is 82 − 59 = 23." },
  { labels: ["Monday", "Tuesday", "Thursday", "Friday"], values: [12, 28, 19, 35], prompt: "What was the combined rainfall on Tuesday and Friday?", answer: 63, explanation: "Tuesday had 28 mm and Friday had 35 mm. The combined rainfall is 28 + 35 = 63 mm." },
];

barChartSpecs.forEach((spec, index) => {
  const visualId = `bar-chart-${index + 1}`;
  questions.push(numberEntry(
    `g5-num-ch50-bar-${String(index + 1).padStart(2, "0")}`,
    spec.prompt,
    spec.answer,
    spec.explanation,
    "Statistics",
    "num.data.read-bar-chart",
    ["data", "bar-chart", "comparison"],
    [{
      id: visualId,
      type: "bar_chart",
      altText: `Bar chart values: ${spec.labels.map((label, i) => `${label}, ${spec.values[i]}`).join("; ")}.`,
      title: "Recorded results",
      data: {
        labels: spec.labels,
        values: spec.values,
        yAxisLabel: "Number",
        colour: "#4B2E83",
      },
    }],
  ));
});

const lineGraphSpecs = [
  { points: [14, 18, 25, 23, 31], prompt: "By how many centimetres did the plant grow from Week 1 to Week 5?", answer: 17, explanation: "The plant was 14 cm tall in Week 1 and 31 cm in Week 5. Its growth was 31 − 14 = 17 cm.", yLabel: "Height (cm)" },
  { points: [22, 29, 27, 35, 41], prompt: "What was the total increase in temperature from 9 am to 1 pm?", answer: 19, explanation: "The temperature was 22°C at 9 am and 41°C at 1 pm. The increase was 41 − 22 = 19°C.", yLabel: "Temperature (°C)" },
  { points: [68, 61, 55, 49, 46], prompt: "How many litres of water were used between Day 1 and Day 5?", answer: 22, explanation: "The tank level fell from 68 L to 46 L. The amount used was 68 − 46 = 22 L.", yLabel: "Water remaining (L)" },
  { points: [120, 145, 139, 168, 181], prompt: "How much greater was the distance at Checkpoint 5 than at Checkpoint 2?", answer: 36, explanation: "Checkpoint 5 shows 181 km and Checkpoint 2 shows 145 km. The difference is 181 − 145 = 36 km.", yLabel: "Distance (km)" },
  { points: [32, 44, 39, 51, 47], prompt: "What is the difference between the highest and lowest number of visitors shown?", answer: 19, explanation: "The highest value is 51 and the lowest is 32. The difference is 51 − 32 = 19 visitors.", yLabel: "Visitors" },
  { points: [85, 77, 69, 72, 58], prompt: "By how many points did the score fall from Round 1 to Round 5?", answer: 27, explanation: "The score changed from 85 in Round 1 to 58 in Round 5. It fell by 85 − 58 = 27 points.", yLabel: "Score" },
];

lineGraphSpecs.forEach((spec, index) => {
  const labels = ["1", "2", "3", "4", "5"];
  questions.push(numberEntry(
    `g5-num-ch50-line-${String(index + 1).padStart(2, "0")}`,
    spec.prompt,
    spec.answer,
    spec.explanation,
    "Statistics",
    "num.data.read-line-graph",
    ["data", "line-graph", "change"],
    [{
      id: `line-graph-${index + 1}`,
      type: "line_graph",
      altText: `Line graph points in order: ${spec.points.map((value, i) => `${labels[i]} is ${value}`).join("; ")}.`,
      title: "Change over five readings",
      data: {
        points: spec.points.map((value, i) => ({ x: i + 1, y: value, label: labels[i] })),
        xAxisLabel: "Reading",
        yAxisLabel: spec.yLabel,
        colour: "#4B2E83",
      },
    }],
  ));
});

const fractionSets = [
  { sources: ["2/3", "3/5", "5/8"], targets: ["8/12", "12/20", "15/24", "10/18"] },
  { sources: ["3/4", "4/7", "5/6"], targets: ["12/16", "16/28", "20/24", "15/24"] },
  { sources: ["2/5", "5/9", "7/10"], targets: ["8/20", "15/27", "21/30", "12/25"] },
  { sources: ["4/5", "3/8", "7/12"], targets: ["20/25", "12/32", "21/36", "14/20"] },
  { sources: ["5/7", "2/9", "3/10"], targets: ["15/21", "8/36", "12/40", "9/20"] },
  { sources: ["7/8", "4/9", "5/12"], targets: ["21/24", "16/36", "20/48", "15/30"] },
];

const fractionPrompts = [
  "Match each fraction on the left to an equivalent fraction. One target will not be used.",
  "Pair each source fraction with the fraction that has the same value. Leave one target unused.",
  "For each source, choose an equivalent fraction from the target list. One target is extra.",
  "Connect each fraction to another way of writing the same value. One target does not belong.",
  "Match the three source fractions with their equivalents. Exactly one target will remain.",
  "Find the equivalent form of each source fraction. Use three of the four targets.",
];

fractionSets.forEach((spec, index) => {
  const sources = spec.sources.map((text, i) => ({ id: `source-${i + 1}`, text }));
  const targets = spec.targets.map((text, i) => ({ id: `target-${i + 1}`, text }));
  questions.push({
    id: `g5-num-ch50-fraction-${String(index + 1).padStart(2, "0")}`,
    type: "matching",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: fractionPrompts[index],
    options: [],
    interaction: { type: "matching", sources, targets },
    visuals: [],
    answerKey: {
      kind: "matching",
      pairs: sources.map((source, i) => ({ sourceId: source.id, targetId: `target-${i + 1}` })),
    },
    explanation: spec.sources.map((source, i) => `${source} = ${spec.targets[i]}`).join(", ") + ". Each pair is made by multiplying the numerator and denominator by the same number.",
    metadata: {
      ...baseMetadata,
      strand: "Fractions",
      skill: "num.fractions.equivalent",
      tags: ["fractions", "equivalence", "matching"],
    },
  });
});

const moneySpecs = [
  { rows: [["Notebook", 4.75], ["Pen pack", 6.40], ["Folder", 3.85]], prompt: "Mia buys 2 notebooks and 1 pen pack. How much change does she receive from $20?", answer: 4.10, explanation: "Two notebooks cost $9.50. With the $6.40 pen pack, the total is $15.90. The change is $20.00 − $15.90 = $4.10." },
  { rows: [["Adult seedling", 8.60], ["Herb pot", 5.25], ["Bag of soil", 7.90]], prompt: "Noah buys 1 seedling, 2 herb pots and 1 bag of soil. What is the total cost?", answer: 27.00, explanation: "The total is $8.60 + $10.50 + $7.90 = $27.00." },
  { rows: [["Swim cap", 9.75], ["Goggles", 14.50], ["Towel", 18.20]], prompt: "Asha buys goggles and a towel. How much change does she receive from $40?", answer: 7.30, explanation: "The goggles and towel cost $14.50 + $18.20 = $32.70. The change is $40.00 − $32.70 = $7.30." },
  { rows: [["Museum entry", 7.50], ["Planetarium show", 4.80], ["Activity booklet", 3.25]], prompt: "Four students each buy museum entry and a planetarium show. What is the total cost?", answer: 49.20, explanation: "Each student pays $7.50 + $4.80 = $12.30. For four students, 4 × $12.30 = $49.20." },
  { rows: [["Roll", 3.60], ["Fruit cup", 2.85], ["Milk", 2.40]], prompt: "Eli buys 3 rolls and 2 fruit cups. How much change does he receive from $20?", answer: 3.50, explanation: "Three rolls cost $10.80 and two fruit cups cost $5.70. The total is $16.50, so the change is $3.50." },
  { rows: [["Bus ticket", 2.75], ["Ferry ticket", 5.40], ["Train ticket", 4.65]], prompt: "Zoe buys 2 bus tickets and 3 train tickets. What is the total cost?", answer: 19.45, explanation: "Two bus tickets cost $5.50 and three train tickets cost $13.95. The total is $19.45." },
  { rows: [["Paint brush", 5.80], ["Paint set", 12.45], ["Canvas", 9.70]], prompt: "Arun buys 2 paint brushes and 1 canvas. How much change does he receive from $25?", answer: 3.70, explanation: "Two brushes cost $11.60. With the $9.70 canvas, the total is $21.30. The change is $3.70." },
  { rows: [["Mini golf", 8.25], ["Drink", 3.10], ["Snack", 4.35]], prompt: "Three friends each play mini golf, and they share 2 snacks. What is the total cost?", answer: 33.45, explanation: "Three games cost $24.75 and two snacks cost $8.70. The total is $33.45." },
  { rows: [["Puzzle", 11.90], ["Card game", 8.75], ["Dice set", 6.60]], prompt: "Layla buys 1 puzzle and 2 dice sets. How much change does she receive from $30?", answer: 4.90, explanation: "The puzzle and two dice sets cost $11.90 + $13.20 = $25.10. The change is $30.00 − $25.10 = $4.90." },
  { rows: [["Trail map", 3.45], ["Water bottle", 7.80], ["Sun hat", 12.65]], prompt: "Ben buys 2 trail maps, a water bottle and a sun hat. What is the total cost?", answer: 27.35, explanation: "Two maps cost $6.90. Adding $7.80 and $12.65 gives $27.35." },
];

moneySpecs.forEach((spec, index) => {
  questions.push(numberEntry(
    `g5-num-ch50-money-${String(index + 1).padStart(2, "0")}`,
    spec.prompt,
    spec.answer,
    spec.explanation,
    "Number",
    "num.prod.number.money-problems",
    ["money", "decimal", "multi-step"],
    [{
      id: `price-table-${index + 1}`,
      type: "table",
      altText: `Price list: ${spec.rows.map(([item, price]) => `${item}, $${Number(price).toFixed(2)}`).join("; ")}.`,
      title: "Price list",
      data: { headers: ["Item", "Price ($)"], rows: spec.rows, rowHeaders: true },
    }],
  ));
});

const multipleRules = [
  { a: 6, b: 8, values: [24, 36, 48, 60, 72, 96] },
  { a: 4, b: 9, values: [18, 36, 54, 72, 84, 108] },
  { a: 5, b: 7, values: [35, 50, 70, 85, 105, 140] },
  { a: 3, b: 10, values: [20, 30, 45, 60, 75, 90] },
  { a: 6, b: 7, values: [21, 42, 63, 84, 105, 126] },
  { a: 8, b: 9, values: [36, 72, 90, 108, 144, 180] },
  { a: 4, b: 11, values: [22, 44, 66, 88, 110, 132] },
  { a: 7, b: 9, values: [63, 81, 98, 126, 147, 189] },
  { a: 5, b: 12, values: [30, 60, 90, 120, 150, 180] },
  { a: 6, b: 11, values: [33, 66, 99, 132, 165, 198] },
];

multipleRules.forEach((spec, index) => {
  const options = spec.values.map((value) => ({ id: `n-${value}`, text: String(value) }));
  const correct = spec.values.filter((value) => value % spec.a === 0 && value % spec.b === 0);
  questions.push({
    id: `g5-num-ch50-multiples-${String(index + 1).padStart(2, "0")}`,
    type: "multiple_select",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: `Select all numbers that are multiples of both ${spec.a} and ${spec.b}.`,
    options,
    visuals: [],
    answerKey: { kind: "multiple_options", optionIds: correct.map((value) => `n-${value}`) },
    explanation: `A correct choice must divide evenly by both ${spec.a} and ${spec.b}. The correct numbers are ${correct.join(", ")}.`,
    metadata: {
      ...baseMetadata,
      strand: "Number",
      skill: "num.number.multiples",
      tags: ["multiples", "divisibility", "multiple-select"],
    },
  });
});

const perimeterSpecs = [
  { shape: "rectangle" as const, measurements: [["length", 18, "m"], ["width", 7, "m"]] as const, prompt: "A rectangular garden is 18 m long and 7 m wide. A 3 m-wide gate is left unfenced. How many metres of fencing are needed?", answer: 47, explanation: "The perimeter is 2 × (18 + 7) = 50 m. Leaving a 3 m gate gives 50 − 3 = 47 m of fencing." },
  { shape: "square" as const, measurements: [["side", 14, "m"]] as const, prompt: "A square play area has sides of 14 m. Two entrances, each 2 m wide, are not fenced. How many metres of fencing are needed?", answer: 52, explanation: "The perimeter is 4 × 14 = 56 m. The two entrances total 4 m, so 56 − 4 = 52 m." },
  { shape: "triangle" as const, measurements: [["side A", 16, "cm"], ["side B", 21, "cm"], ["side C", 19, "cm"]] as const, prompt: "A triangular frame has side lengths 16 cm, 21 cm and 19 cm. Ribbon goes around it twice. How many centimetres of ribbon are needed?", answer: 112, explanation: "One perimeter is 16 + 21 + 19 = 56 cm. Going around twice needs 2 × 56 = 112 cm." },
  { shape: "rectangle" as const, measurements: [["length", 24, "m"], ["width", 11, "m"]] as const, prompt: "A rectangular court is 24 m by 11 m. A safety rail runs around the court except for a 5 m opening. How long is the rail?", answer: 65, explanation: "The perimeter is 2 × (24 + 11) = 70 m. Subtracting the 5 m opening gives 65 m." },
  { shape: "square" as const, measurements: [["side", 17, "cm"]] as const, prompt: "A square picture has sides of 17 cm. A border is placed around three identical pictures. How many centimetres of border are needed altogether?", answer: 204, explanation: "One picture has perimeter 4 × 17 = 68 cm. Three pictures need 3 × 68 = 204 cm." },
  { shape: "triangle" as const, measurements: [["side A", 23, "m"], ["side B", 18, "m"], ["side C", 27, "m"]] as const, prompt: "A triangular reserve has sides of 23 m, 18 m and 27 m. Posts are placed every 4 m around its boundary. How many equal 4 m spaces fit exactly around the boundary?", answer: 17, explanation: "The perimeter is 23 + 18 + 27 = 68 m. Dividing by 4 gives 17 equal spaces." },
];

perimeterSpecs.forEach((spec, index) => {
  questions.push(numberEntry(
    `g5-num-ch50-perimeter-${String(index + 1).padStart(2, "0")}`,
    spec.prompt,
    spec.answer,
    spec.explanation,
    "Measurement",
    "num.prod.measurement.perimeter",
    ["measurement", "perimeter", "multi-step"],
    [{
      id: `shape-${index + 1}`,
      type: "geometry_shape",
      altText: `${spec.shape[0].toUpperCase()}${spec.shape.slice(1)} with ${spec.measurements.map(([label, value, unit]) => `${label} ${value} ${unit}`).join(", ")}.`,
      data: {
        shape: spec.shape,
        measurements: spec.measurements.map(([label, value, unit]) => ({ label, value, unit })),
      },
    }],
  ));
});

const pieSpecs = [
  { segments: [["Walking", 12], ["Cycling", 8], ["Bus", 15], ["Car", 5]], prompt: "There are 40 students in the survey. What fraction travel by cycling?", options: [["a", "1/5"], ["b", "1/4"], ["c", "2/5"], ["d", "3/8"]], answer: "a", explanation: "Cycling represents 8 of 40 students. The fraction 8/40 simplifies to 1/5." },
  { segments: [["Mystery", 18], ["Adventure", 12], ["Science", 6], ["Poetry", 4]], prompt: "How many more students chose Mystery than Science and Poetry combined?", options: [["a", "6"], ["b", "8"], ["c", "10"], ["d", "12"]], answer: "b", explanation: "Science and Poetry total 6 + 4 = 10. Mystery has 18, which is 8 more." },
  { segments: [["Red", 14], ["Blue", 10], ["Green", 8], ["Yellow", 8]], prompt: "What percentage of the 40 votes were for Blue?", options: [["a", "20%"], ["b", "25%"], ["c", "30%"], ["d", "40%"]], answer: "b", explanation: "Blue received 10 of 40 votes. 10/40 = 1/4 = 25%." },
  { segments: [["Soccer", 16], ["Netball", 12], ["Tennis", 8], ["Athletics", 4]], prompt: "The tennis and athletics groups combine. What fraction of all 40 students are in the combined group?", options: [["a", "1/5"], ["b", "1/4"], ["c", "3/10"], ["d", "2/5"]], answer: "c", explanation: "Tennis and Athletics total 8 + 4 = 12 students. 12/40 simplifies to 3/10." },
  { segments: [["Apples", 15], ["Bananas", 9], ["Oranges", 12], ["Pears", 4]], prompt: "How many fewer votes did Bananas and Pears receive together than Apples and Oranges together?", options: [["a", "12"], ["b", "13"], ["c", "14"], ["d", "15"]], answer: "c", explanation: "Bananas and Pears total 13. Apples and Oranges total 27. The difference is 27 − 13 = 14." },
  { segments: [["Robotics", 18], ["Art", 12], ["Choir", 6], ["Chess", 4]], prompt: "If 5 students move from Robotics to Chess, how many students will those two clubs have altogether?", options: [["a", "17"], ["b", "20"], ["c", "22"], ["d", "27"]], answer: "c", explanation: "Moving students between the two clubs does not change their combined total. Robotics and Chess have 18 + 4 = 22 students altogether." },
] as const;

pieSpecs.forEach((spec, index) => {
  questions.push({
    id: `g5-num-ch50-pie-${String(index + 1).padStart(2, "0")}`,
    type: "multiple_choice",
    yearLevel: 5,
    examStyle: "naplan_style",
    prompt: spec.prompt,
    options: spec.options.map(([id, text]) => ({ id, text })),
    visuals: [{
      id: `pie-chart-${index + 1}`,
      type: "pie_chart",
      altText: `Pie chart values: ${spec.segments.map(([label, value]) => `${label}, ${value}`).join("; ")}.`,
      title: "Survey results",
      data: { segments: spec.segments.map(([label, value]) => ({ label, value })) },
    }],
    answerKey: { kind: "single_option", optionId: spec.answer },
    explanation: spec.explanation,
    metadata: {
      ...baseMetadata,
      strand: "Statistics",
      skill: "num.data.read-pie-chart",
      tags: ["data", "pie-chart", "reasoning"],
    },
  });
});

if (questions.length !== 50) {
  throw new Error(`Expected 50 candidates, generated ${questions.length}.`);
}

const parsed: CandidateQuestion[] = questions.map((question, index) => {
  const outcome = candidateQuestionSchema.safeParse(question);
  if (!outcome.success) {
    throw new Error(
      `Candidate ${index + 1} (${question.id}) is invalid: ${outcome.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }
  return outcome.data;
});

const ids = new Set(parsed.map((question) => question.id));
if (ids.size !== parsed.length) {
  throw new Error("Candidate IDs must be unique.");
}

await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
await writeFile(OUTPUT_PATH, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");

process.stdout.write(`Generated ${parsed.length} validated candidates at ${OUTPUT_PATH}\n`);
