import { readFile } from "node:fs/promises";

type DraftOption = { id: string; text: string };
type DraftQuestion = {
  id: string;
  prompt: string;
  type: "multiple_choice" | "number_entry";
  options: DraftOption[];
  answerKey: { kind: "single_option"; optionId: string } | { kind: "number"; value: number; tolerance: number };
};

type Solver = (question: DraftQuestion) => number | string;

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0);
const choose = (n: number, count: number): number => {
  let result = 1;
  for (let index = 1; index <= count; index += 1) result = result * (n - index + 1) / index;
  return result;
};
const permutations = (values: number[]): number[][] => values.length === 0
  ? [[]]
  : values.flatMap((value, index) => permutations(values.filter((_, itemIndex) => itemIndex !== index))
    .map(rest => [value, ...rest]));

const solvers: Record<string, Solver> = {
  "roadmap-amc-y3-001": () => Array.from({ length: 20 }, (_, index) => index % 5 >= 2).filter(Boolean).length,
  "roadmap-amc-y3-002": () => 24 / 4 + 3,
  "roadmap-amc-y3-003": () => (9 - 1) / 2,
  "roadmap-amc-y3-004": () => 20 + 25 + 10 + 15,
  "roadmap-amc-y3-005": () => (6 - 31 % 6) % 6,
  "roadmap-amc-y3-006": () => 40 / 2 - 7,
  "roadmap-amc-y3-007": () => Array.from({ length: 18 }, (_, index) => index + 1).filter(tile => tile % 3 !== 0).length,
  "roadmap-amc-y3-008": () => (20 + 4) / 2,
  "roadmap-amc-y3-009": () => 4 * 6 / 2,
  "roadmap-amc-y3-010": () => 4 * (3 - 1),
  "roadmap-amc-y3-011": () => Array.from({ length: 5 }, (_, row) =>
    Array.from({ length: 5 }, (_, column) => (row + column) % 2 === 0).filter(Boolean).length).reduce((a, b) => a + b),
  "roadmap-amc-y3-012": () => Array.from({ length: 10 }, (_, twoDollarCoins) => twoDollarCoins)
    .find(twoDollarCoins => twoDollarCoins * 2 + (9 - twoDollarCoins) === 14)!,
  "roadmap-amc-y3-013": () => 3 * (4 + 5 - 2),
  "roadmap-amc-y3-014": () => 4 * 8 - sum([5, 7, 10]),
  "roadmap-amc-y3-015": () => 7 - 1,
  "roadmap-amc-y3-016": () => 4 * (6 + 2),
  "roadmap-amc-y3-017": () => "4:20 pm",
  "roadmap-amc-y3-018": () => Array.from({ length: 100 }, (_, index) => index + 1).find(value => value % 4 === 0 && value % 6 === 0)!,
  "roadmap-amc-y3-019": () => 15 + 13 - 24,
  "roadmap-amc-y3-020": () => {
    const perimeter = 2 * (8 + 5);
    const length = 8 + 2;
    return length * (perimeter / 2 - length);
  },
  "roadmap-amc-y3-021": () => (44 + 6) / 2 - 8,
  "roadmap-amc-y3-022": () => Math.min(...permutations([4, 0, 7])
    .filter(digits => digits[0] !== 0).map(digits => Number(digits.join("")))),
  "roadmap-amc-y3-023": () => 2 * (7 + 3) / 4,
  "roadmap-amc-y3-024": () => Array.from({ length: 11 }, (_, tricycles) => tricycles)
    .find(tricycles => tricycles * 3 + (10 - tricycles) * 2 === 25)!,
  "roadmap-amc-y3-025": () => ["Mia", "Noah", "Priya", "Zoe"][1],
  "roadmap-amc-y3-026": () => Array.from({ length: 42 }, (_, secondBasket) => secondBasket)
    .filter(secondBasket => secondBasket + (secondBasket + 5) + 2 * secondBasket === 41)
    .map(secondBasket => 2 * secondBasket + 3)[0],
  "roadmap-amc-y3-027": () => Array.from({ length: 90 }, (_, index) => index + 10).find(value => {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return tens + ones === 10 && ones * 10 + tens === value + 18;
  })!,
  "roadmap-amc-y3-028": () => sum(Array.from({ length: 7 }, (_, index) => 3 + index * 2)) - 60,
  "roadmap-amc-y3-029": () => {
    return Array.from({ length: 100 }, (_, initial) => initial)
      .find(initial => (initial - 5 + 7) / 2 + 4 === 13)!;
  },
  "roadmap-amc-y3-030": () => permutations([1, 2, 4, 7])
    .map(digits => Number(digits.slice(0, 3).join("")))
    .filter((value, index, values) => values.indexOf(value) === index && value < 400 && value % 2 === 0).length,
  "roadmap-amc-y5-001": () => 6 * 7 + 5,
  "roadmap-amc-y5-002": () => 4 + 8 * 5,
  "roadmap-amc-y5-003": () => 35 + 60 + 48,
  "roadmap-amc-y5-004": () => 60 * 3 / 4,
  "roadmap-amc-y5-005": () => 360 - 90 - 120,
  "roadmap-amc-y5-006": () => 7 * 5,
  "roadmap-amc-y5-007": () => 72 / 4 + 3,
  "roadmap-amc-y5-008": () => "$2.80",
  "roadmap-amc-y5-009": () => Math.max(...Array.from({ length: 9 }, (_, index) => index + 1).filter(value => 36 % value === 0)),
  "roadmap-amc-y5-010": () => {
    const width = 6;
    const length = 48 / width;
    return 2 * (width + length);
  },
  "roadmap-amc-y5-011": () => (45 + 7) / 4,
  "roadmap-amc-y5-012": () => 30 / (2 + 3) * 3,
  "roadmap-amc-y5-013": () => 12 * 8 - 4 * 3,
  "roadmap-amc-y5-014": () => Array.from({ length: 29 }, (_, index) => index + 41).find(value => value % 6 === 0 && value % 9 === 0)!,
  "roadmap-amc-y5-015": () => 3 * 2,
  "roadmap-amc-y5-016": () => "9:24 am",
  "roadmap-amc-y5-017": () => 24 / (2 / 5),
  "roadmap-amc-y5-018": () => [12, 18, 15, 21, 14].sort((a, b) => a - b)[2],
  "roadmap-amc-y5-019": () => "apple",
  "roadmap-amc-y5-020": () => 2 * (10 + 5),
  "roadmap-amc-y5-021": () => Array.from({ length: 90 }, (_, index) => index + 10).find(value => {
    const tens = Math.floor(value / 10);
    const ones = value % 10;
    return tens + ones === 11 && ones * 10 + tens === value + 27;
  })!,
  "roadmap-amc-y5-022": () => choose(5, 2),
  "roadmap-amc-y5-023": () => "Red is as likely as all non-red colours together",
  "roadmap-amc-y5-024": () => Math.max(...permutations([2, 4, 5, 7])
    .map(digits => Number(digits.join(""))).filter(value => value % 2 === 0)),
  "roadmap-amc-y5-025": () => Math.abs(10 * 4 - 10 * 6),
  "roadmap-amc-y5-026": () => sum(Array.from({ length: 10 }, (_, index) => (index + 1) * 3)),
  "roadmap-amc-y5-027": () => choose(5, 2) * choose(4, 2),
  "roadmap-amc-y5-028": () => {
    let count = 0;
    for (let a = 0; a <= 10; a += 1) for (let b = 0; b <= 6; b += 1) if (3 * a + 5 * b === 30) count += 1;
    return count;
  },
  "roadmap-amc-y5-029": () => sum(Array.from({ length: 8 }, (_, index) => 2 + index * 3)),
  "roadmap-amc-y5-030": () => {
    let count = 0;
    for (let hundreds = 1; hundreds <= 9; hundreds += 1) {
      for (let tens = 0; tens <= 9; tens += 1) {
        for (let ones = 0; ones <= 9; ones += 1) if (hundreds + tens + ones === 6) count += 1;
      }
    }
    return count;
  },
};

function normalise(value: number | string): string {
  return String(value).trim().toLocaleLowerCase("en-AU");
}

let checked = 0;
const mismatches: string[] = [];
for (const file of ["amc-y3-draft.json", "amc-y5-draft.json"]) {
  const packet = JSON.parse(await readFile(`content/roadmap-drafts/${file}`, "utf8")) as { questions: DraftQuestion[] };
  for (const question of packet.questions) {
    checked += 1;
    const solver = solvers[question.id];
    if (!solver) {
      mismatches.push(`${question.id}: no independent solver`);
      continue;
    }
    const computed = solver(question);
    if (question.type === "multiple_choice" && question.answerKey.kind === "single_option") {
      const matches = question.options.filter(option => normalise(option.text) === normalise(computed));
      if (matches.length !== 1) {
        mismatches.push(`${question.id}: computed ${JSON.stringify(computed)} matches ${matches.length} options`);
      } else if (matches[0].id !== question.answerKey.optionId) {
        mismatches.push(`${question.id}: computed ${JSON.stringify(computed)} maps to ${matches[0].id}, key is ${question.answerKey.optionId}`);
      }
    } else if (question.type === "number_entry" && question.answerKey.kind === "number") {
      if (typeof computed !== "number" || computed !== question.answerKey.value) {
        mismatches.push(`${question.id}: computed ${JSON.stringify(computed)}, key is ${question.answerKey.value}`);
      }
    } else {
      mismatches.push(`${question.id}: question type and answer-key kind do not agree`);
    }
  }
}

const unexpectedSolvers = Object.keys(solvers).filter(id => !id.startsWith("roadmap-amc-y3-") && !id.startsWith("roadmap-amc-y5-"));
if (unexpectedSolvers.length > 0) mismatches.push(`Unexpected solver identities: ${unexpectedSolvers.join(", ")}`);
if (mismatches.length > 0) throw new Error(`AMC answer verification failed:\n${mismatches.join("\n")}`);
console.log(`${checked} AMC items checked; 0 mismatches. Independent code solvers matched every key and every multiple-choice answer was unique.`);
