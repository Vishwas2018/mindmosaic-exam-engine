import "./lib/allow-server-only.mts";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AMC_EXCLUDED_FROM_REVIEW, AMC_REVIEW_SOURCE_DIRECTORY, buildAmcReviewTarget } from "../src/features/content-governance/amc-review-sources";

const out = "docs/reviews/amc-2026-10-17";
const header = "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";
const csv = (value: unknown): string => `"${String(value ?? "").replaceAll('"', '""')}"`;
const html = (value: unknown): string => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
async function writeNewOrIdentical(file: string, text: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  try { await writeFile(file, text, { encoding: "utf8", flag: "wx" }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST" || await readFile(file, "utf8") !== text) throw error;
  }
}

const exclusions: string[] = [header];
for (const year of [3, 5] as const) {
  const sourceFile = `content/roadmap-drafts/amc-y${year}-draft.json` as const;
  const packet = JSON.parse(await readFile(sourceFile, "utf8")) as { draftOnly: boolean; questions: unknown[] };
  if (packet.draftOnly !== true || packet.questions.length !== 30) throw new Error("Expected 30 explicit drafts; no publication source may be substituted.");
  const targets = packet.questions.map((raw) => buildAmcReviewTarget(raw, sourceFile));
  if (new Set(targets.map((target) => target.question.id)).size !== 30) throw new Error("Duplicate AMC draft identity.");
  await writeNewOrIdentical(path.join(AMC_REVIEW_SOURCE_DIRECTORY, `y${year}.json`), JSON.stringify(targets.map((target) => target.source), null, 2) + "\n");
  const rows = [header];
  const articles: string[] = [];
  for (const target of targets) {
    const q = target.question;
    const binding = [q.id, target.source.contentHash, target.source.revision, target.sourceManifestHash];
    const exclusion = AMC_EXCLUDED_FROM_REVIEW[q.id];
    if (exclusion) {
      exclusions.push([...binding, "", "", "", "revise", exclusion].map(csv).join(","));
      continue;
    }
    rows.push([...binding, "", "", "", "", ""].map(csv).join(","));
    articles.push(`<article><h2>${html(q.id)}</h2><p>${html(q.prompt)}</p><ol>${q.options.map((option) => `<li><b>${html(option.id)}</b>: ${html(option.text)}</li>`).join("")}</ol><p>Declared key: ${html(JSON.stringify(q.answerKey))}</p><p>Explanation: ${html(q.explanation)}</p><p>Source: ${html(sourceFile)}; revision ${target.source.revision}</p><p>Content hash: <code>${target.source.contentHash}</code></p><p>Source manifest hash: <code>${target.sourceManifestHash}</code></p></article>`);
  }
  await writeNewOrIdentical(`${out}/review-sheet-amc-y${year}-blank.csv`, rows.join("\n") + "\n");
  await writeNewOrIdentical(`${out}/review-sheet-amc-y${year}.html`, `<!doctype html><html lang="en-AU"><meta charset="utf-8"><title>AMC Year ${year} human review</title><style>body{font:17px/1.5 system-ui;max-width:900px;margin:40px auto;padding:20px}article{border-top:1px solid #999;padding-block:20px;break-inside:avoid}code{overflow-wrap:anywhere}</style><h1>AMC Year ${year}: ${rows.length - 1} items awaiting human review</h1><p>Private review preview only. Nothing is approved, staged or published. CSV reviewer cells are blank. Sign each item individually after checking correctness, originality and age fit. Excluded items are listed in revision-loop-amc.csv.</p>${articles.join("\n")}</html>\n`);
  console.log(`Year ${year}: ${rows.length - 1} blank review rows; ${targets.length - rows.length + 1} excluded; 30 bound draft sources.`);
}
await writeNewOrIdentical(`${out}/revision-loop-amc.csv`, exclusions.join("\n") + "\n");
console.log(`Review files: ${out}. No approval, staging, manifest or bank writes occurred.`);
