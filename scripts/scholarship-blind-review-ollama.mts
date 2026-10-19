/**
 * Blind second-family review of the scholarship Year 6 draft packets against a local Ollama model.
 *
 * The reviewer sees only what the first-pass human-style blind reviewer saw: prompt, passage, options, skill and the
 * claimed difficulty. The answer key, explanation and sidecar are never put in the request. Nothing leaves the
 * machine: the endpoint defaults to the local Ollama daemon.
 *
 * Output is one `review-<packet>.json` per packet, in the same item shape the review-sheet generator already reads,
 * written after every item so an interrupted run resumes where it stopped.
 *
 *   npx tsx scripts/scholarship-blind-review-ollama.mts --model gemma:7b --out <dir> [--packets maths,nr,vr,rc] [--limit N]
 *
 * This is advisory evidence for a human reviewer. A small local model is a weak solver: its disagreement with a key
 * is a prompt to look, never proof the key is wrong, and its agreement is not proof the key is right.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DRAFTS = "content/scholarship-drafts";
const PACKETS = {
  maths: "scholarship-y6-mathematics-draft.json",
  nr: "scholarship-y6-numerical-reasoning-draft.json",
  vr: "scholarship-y6-verbal-reasoning-draft.json",
  rc: "scholarship-y6-reading-draft.json",
} as const;
type PacketKey = keyof typeof PACKETS;

interface DraftItem {
  id: string;
  prompt: string;
  stimulus?: { title?: string; body?: string };
  options: Array<{ id: string; text: string }>;
  metadata: { skill: string; difficulty?: string };
}

interface ReviewItem {
  id: string;
  myAnswer: string;
  confidence: string;
  uniqueAnswer: boolean;
  defensibleOptions: string[];
  semanticFlags: string[];
  originality: string;
  difficultyEstimate: string;
  difficultyVerdict: string;
  recommendation: string;
  notes: string;
  working: string;
  parsed: boolean;
  seconds: number;
}

function arg(name: string, fallback?: string): string {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing ${name}`);
}

const MODEL = arg("--model");
const OUT = arg("--out");
const ENDPOINT = arg("--endpoint", "http://localhost:11434");
const LIMIT = Number(arg("--limit", "0"));
const WANTED = arg("--packets", "maths,nr,vr,rc").split(",") as PacketKey[];

const DIFFICULTIES = ["easy", "medium", "challenging"];

function renderQuestion(item: DraftItem): string {
  const passage = item.stimulus?.body ? `PASSAGE (${item.stimulus.title ?? "untitled"}):\n${item.stimulus.body}\n\n` : "";
  const options = item.options.map((option) => `${option.id}) ${option.text}`).join("\n");
  return `${passage}QUESTION:\n${item.prompt}\n\nOPTIONS:\n${options}`;
}

function buildPrompt(item: DraftItem): string {
  return [
    "You are an experienced Year 6 selective-school test marker checking a draft practice question. Solve it yourself; you are not told the answer.",
    `Skill: ${item.metadata.skill}. The author labelled its difficulty "${item.metadata.difficulty ?? "unknown"}" (easy, medium or challenging).`,
    "",
    renderQuestion(item),
    "",
    'Reply with JSON only, in exactly this shape: {"working": "one or two short sentences", "answer": "a" | "b" | "c" | "d" | "e", "confidence": "low" | "medium" | "high", "also_defensible": [letters of any OTHER options a careful student could also defend], "difficulty": "easy" | "medium" | "challenging", "problems": [short strings for any error, ambiguity, unfair wording or factual mistake you notice; empty if none]}',
  ].join("\n");
}

async function ask(prompt: string, numPredict: number): Promise<{ text: string; seconds: number }> {
  const started = Date.now();
  const response = await fetch(`${ENDPOINT}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      format: "json",
      options: { temperature: 0, num_predict: numPredict, num_ctx: 4096 },
    }),
  });
  if (!response.ok) throw new Error(`Ollama ${response.status}: ${await response.text()}`);
  const body = (await response.json()) as { response: string };
  return { text: body.response, seconds: Math.round((Date.now() - started) / 100) / 10 };
}

function toLetter(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const match = value.trim().toLowerCase().match(/^([a-e])\b/);
  return match?.[1];
}

function parseReview(item: DraftItem, text: string, seconds: number): ReviewItem {
  const claimed = item.metadata.difficulty ?? "";
  let json: Record<string, unknown> | undefined;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = undefined;
  }
  const answer = toLetter(json?.answer);
  const valid = new Set(item.options.map((option) => option.id));
  const parsed = answer !== undefined && valid.has(answer);
  const others = Array.isArray(json?.also_defensible)
    ? (json!.also_defensible as unknown[]).map(toLetter).filter((letter): letter is string => !!letter && valid.has(letter) && letter !== answer)
    : [];
  const estimate = typeof json?.difficulty === "string" && DIFFICULTIES.includes(json.difficulty.toLowerCase()) ? json.difficulty.toLowerCase() : "unknown";
  const rank = (label: string): number => DIFFICULTIES.indexOf(label);
  let verdict = "unknown";
  if (rank(estimate) >= 0 && rank(claimed) >= 0) {
    verdict = rank(estimate) === rank(claimed) ? "appropriate" : rank(estimate) < rank(claimed) ? "too_hard" : "too_easy";
  }
  const problems = Array.isArray(json?.problems) ? (json!.problems as unknown[]).filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0) : [];
  return {
    id: item.id,
    myAnswer: parsed ? answer! : "?",
    confidence: typeof json?.confidence === "string" ? json.confidence : "unknown",
    uniqueAnswer: parsed && others.length === 0,
    defensibleOptions: parsed ? [answer!, ...others] : [],
    semanticFlags: problems.map((problem) => `second-pass model noted: ${problem}`),
    originality: "not assessed",
    difficultyEstimate: estimate,
    difficultyVerdict: verdict,
    recommendation: "not assessed",
    notes: "Second-family local model; advisory only. Originality and revise/reject are not assessed by this reviewer.",
    working: typeof json?.working === "string" ? json.working : "",
    parsed,
    seconds,
  };
}

async function main(): Promise<void> {
  await mkdir(OUT, { recursive: true });
  for (const key of WANTED) {
    const packet = JSON.parse(await readFile(path.join(DRAFTS, PACKETS[key]), "utf8")) as { questions: DraftItem[] };
    const outFile = path.join(OUT, `review-${key}.json`);
    let existing: { items: ReviewItem[] } | undefined;
    try {
      existing = JSON.parse(await readFile(outFile, "utf8")) as { items: ReviewItem[] };
    } catch {
      existing = undefined;
    }
    const done = new Map((existing?.items ?? []).map((entry) => [entry.id, entry]));
    const items: ReviewItem[] = [];
    const questions = LIMIT > 0 ? packet.questions.slice(0, LIMIT) : packet.questions;
    for (const question of questions) {
      const prior = done.get(question.id);
      if (prior?.parsed) {
        items.push(prior);
        continue;
      }
      const numPredict = key === "rc" ? 260 : 320;
      let { text, seconds } = await ask(buildPrompt(question), numPredict);
      let review = parseReview(question, text, seconds);
      if (!review.parsed) {
        ({ text, seconds } = await ask(`${buildPrompt(question)}\nYour reply must be valid JSON and "answer" must be one letter.`, numPredict + 120));
        review = parseReview(question, text, seconds);
      }
      items.push(review);
      const snapshot = {
        packet: PACKETS[key],
        reviewer: MODEL,
        blindnessConfirmed: true,
        blindnessNote: "Request contained only prompt, passage, options, skill and claimed difficulty; no key, explanation or sidecar.",
        difficultyVerdictConvention: "'too_hard' means the claimed label overstates how hard the item really is; 'too_easy' means the label understates it.",
        items: [...items, ...questions.filter((candidate) => !items.some((entry) => entry.id === candidate.id)).map((candidate) => done.get(candidate.id)).filter((entry): entry is ReviewItem => !!entry)],
      };
      await writeFile(outFile, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
      console.log(`${key} ${question.id.slice(-3)} -> ${review.myAnswer} (${review.parsed ? "ok" : "UNPARSED"}) ${review.seconds}s`);
    }
  }
}

await main();
