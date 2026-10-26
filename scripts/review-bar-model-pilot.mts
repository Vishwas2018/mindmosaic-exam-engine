import {readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {createHash} from "node:crypto";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";

import {barModelPilotFixtures} from "../src/content/visual-fixtures/bar-model/index";
import {BarModelRenderer} from "../src/features/exam-engine/visual-renderers/BarModelRenderer";
import {validateBarModelVisual} from "../src/features/visuals/bar-model/pipeline";
import {describeBarModel} from "../src/features/visuals/bar-model/describe";
import {independentlySolvePilot} from "./lib/bar-model-pilot-independent";

const sourceHash = createHash("sha256").update(await readFile("src/content/visual-fixtures/bar-model/index.ts")).digest("hex");
const header = `BAR-MODEL PILOT (30 DRAFT ITEMS)\nFixture source SHA-256: ${sourceHash}\nNot published. No human approval or independent human review is asserted.\n`;
const blind: string[] = [header, "BLIND PACKET: givens-only diagrams and descriptions; no keys or explanations.\n"];
const keyed: string[] = [header, "KEYED AUTOMATED CROSS-CHECK: arithmetic from prompt givens versus stored key and model solver.\nThis is not an independent human blind review.\n"];
const sections = [];
const escape = (value: string) => value.replace(/[&<>"']/g, (c) => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]!));
for (const fixture of barModelPilotFixtures) {
  const result = validateBarModelVisual(fixture.visual);
  const independent = independentlySolvePilot(fixture.prompt);
  if (!result.ok || !result.visual || result.visual.type !== "bar_model" ||
    result.solution?.target?.numerator !== String(independent.answer) ||
    result.solution.target.denominator !== "1" || fixture.privateAnswerKey !== independent.answer) {
    throw new Error(`Cross-check failed: ${fixture.name}`);
  }
  const info = `ID: ${fixture.name}\nYear: ${fixture.yearLevel}\nSkill: ${fixture.skill}\nDifficulty: ${fixture.difficulty}\nUnit: ${fixture.unit}\nPrompt: ${fixture.prompt}`;
  const description = describeBarModel(result.visual.data);
  blind.push(`${info}\nGivens-only diagram description:\n${description.join("\n")}\n\n---\n`);
  keyed.push(`${info}\nIndependent calculation: ${independent.calculation}\nStored key: ${fixture.privateAnswerKey}\nModel solver: ${result.solution.target.numerator}\nComparison: PASS\nExplanation: ${fixture.workedExplanation}\n\n---\n`);
  // Renderer receives only the validated unsolved visual, never solution/key.
  const diagram = renderToStaticMarkup(createElement(BarModelRenderer, {visual: result.visual}), {identifierPrefix: fixture.name});
  sections.push(`<section><h2>${escape(fixture.name)}</h2><p>Year ${fixture.yearLevel} · ${escape(fixture.skill)} · ${fixture.difficulty}</p><p>${escape(fixture.prompt)}</p>${diagram}<details><summary>Givens-only text description</summary><p>${description.map(escape).join("</p><p>")}</p></details><label>Reviewer's answer and reasoning<textarea rows="3"></textarea></label></section>`);
}
const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Bar-model pilot blind review</title><style>body{font-family:Arial,sans-serif;color:#18151f;max-width:900px;margin:auto;padding:24px}section{border-top:1px solid #e9e4ed;padding:24px 0;break-inside:avoid}svg{width:100%;height:auto}textarea{display:block;width:95%;margin-top:8px}details{margin:16px 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}figure{margin:16px 0}h2{overflow-wrap:anywhere}@media print{details{display:block}textarea{border:1px solid #625d69}}</style></head><body><h1>Bar-model pilot blind review</h1><p>30 original draft items. Record your answer and reasoning before opening the separate keyed report.</p><p>Fixture source SHA-256: ${sourceHash}</p>${sections.join("\n")}</body></html>\n`;
for (const [filename, contents] of Object.entries({
  "bar-model-pr80-blind-review-packet.txt": blind.join("\n"),
  "bar-model-pr80-blind-review-packet.html": html,
  "bar-model-pr80-keyed-report.txt": keyed.join("\n"),
})) {
  const output = path.join("docs/reviews/pr80", filename);
  if (process.argv.includes("--write")) await writeFile(output, contents);
  else if (await readFile(output, "utf8") !== contents) throw new Error(`Review artifact is stale: ${output}; run with --write`);
}
console.log("30 independent prompt calculations match stored keys and model-solver results; blind diagrams and reports are current.");
