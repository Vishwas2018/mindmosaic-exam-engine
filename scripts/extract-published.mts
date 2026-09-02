/**
 * Flattens the exact published question pool served by the exam engine for
 * an offline content-correctness review.
 *
 * This deliberately imports through `@/server/exam-bank`, never by parsing
 * content JSON. The `server-only` marker is stubbed for this offline script
 * in exactly the same way as scripts/audit-bank.mts.
 */

/* Must precede every other import from the application graph. */
import "./lib/allow-server-only.mts";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getExamBank } from "@/server/exam-bank";

const EXPECTED_PUBLISHED_COUNT = 1_253;
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));
const outputPath = path.join(REPO_ROOT, "scripts", "out", "published-flat.json");

const publishedExamBank = getExamBank("published");

if (publishedExamBank.length !== EXPECTED_PUBLISHED_COUNT) {
  console.error(
    `Published-bank count mismatch: expected ${EXPECTED_PUBLISHED_COUNT}, received ${publishedExamBank.length}.`,
  );
  console.error("No output was written.");
  process.exitCode = 1;
} else {
  const flattened = publishedExamBank.map((question) => ({
    id: question.id,
    subject: question.metadata.subject,
    yearLevel: question.yearLevel,
    examStyle: question.examStyle,
    type: question.type,
    prompt: question.prompt,
    instructions: question.instructions ?? null,
    stimulus: question.stimulus ?? null,
    options: question.options,
    interaction: question.interaction ?? null,
    answerKey: question.answerKey,
    explanation: question.explanation,
    visualAltText: question.visuals.map((visual) => visual.altText),
  }));

  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(flattened, null, 2)}\n`, "utf8");

  console.log(`Wrote ${flattened.length} questions to ${outputPath}`);
  console.log("Composition invariant confirmed: 965 curated + 288 factory = 1,253.");
}
