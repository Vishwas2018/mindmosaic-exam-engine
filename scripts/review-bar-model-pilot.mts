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
  sections.push(`<section><h2>${escape(fixture.name)}</h2><p>Year ${fixture.yearLevel} · ${escape(fixture.skill)} · ${fixture.difficulty}</p><p>${escape(fixture.prompt)}</p>${diagram}<details><summary>Givens-only text description</summary><p>${description.map(escape).join("</p><p>")}</p></details><label class="field">Your independently calculated answer <input type="number" name="answer-${fixture.name}"></label><label class="field">Confidence (1 = low, 5 = high) <select name="confidence-${fixture.name}"><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label><label class="field">Ambiguity <select name="ambiguity-${fixture.name}"><option>None</option><option>Minor</option><option>Major</option></select> <textarea name="ambiguity-notes-${fixture.name}" rows="1" placeholder="Describe any ambiguity"></textarea></label><label class="field">Difficulty appropriateness <select name="difficulty-${fixture.name}"><option>Too easy</option><option>About right</option><option>Too hard</option></select></label><label class="field">Diagram accuracy <select name="diagram-${fixture.name}"><option>Accurate</option><option>Minor issue</option><option>Major issue</option></select> <textarea name="diagram-notes-${fixture.name}" rows="1" placeholder="Describe any diagram issue"></textarea></label><label class="field">Suggested corrections <textarea name="corrections-${fixture.name}" rows="2" placeholder="Suggested rewording or diagram corrections"></textarea></label></section>`);
}
const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Bar-model pilot blind review</title><style>body{font-family:Arial,sans-serif;color:#18151f;max-width:900px;margin:auto;padding:24px}section{border-top:1px solid #e9e4ed;padding:24px 0;break-inside:avoid}svg{width:100%;height:auto}textarea{display:block;width:95%;margin-top:8px}details{margin:16px 0}.field{display:block;margin:10px 0}label.field input{margin-left:8px;width:170px}label.field select{margin-left:8px}ol li{margin:6px 0}.note{margin-top:24px;font-size:0.9rem;color:#444;border-top:1px solid #e9e4ed;padding-top:16px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}figure{margin:16px 0}h2{overflow-wrap:anywhere}@media print{details{display:block}textarea{border:1px solid #625d69}}</style></head><body><h1>Bar-model pilot blind review</h1><p>30 original draft items. Record your answer and reasoning before opening the separate keyed report.</p><p>Fixture source SHA-256: ${sourceHash}</p><h2>Reviewer instructions</h2><ol><li>Enter your name and review date below, then work through items 01&ndash;30 in order.</li><li>For each item, calculate the answer independently from the prompt and the unsolved bar diagram. Record it in "Your independently calculated answer" <b>before</b> opening anything else.</li><li>Rate confidence, ambiguity, difficulty appropriateness and diagram accuracy, and note any suggested corrections.</li><li>Do <b>not</b> open the separate keyed report (<code>bar-model-pr80-keyed-report.txt</code>) until all 30 blind assessments are complete.</li><li>After the blind pass, compare your answers with the keyed report, record discrepancies and resolutions in the human-review tracking document.</li></ol><label class="field">Reviewer name <input type="text" name="reviewer-name"></label><label class="field">Review date <input type="date" name="reviewer-date"></label>${sections.join("\n")}<p class="note">This blind packet contains no answer keys or explanations. Keyed answers and worked explanations are kept in the separate restricted artifact docs/reviews/pr80/bar-model-pr80-keyed-report.txt.</p></body></html>\n`;
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
