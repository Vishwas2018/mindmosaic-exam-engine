import { readFile, writeFile } from "node:fs/promises";
import { hash, pilotSchema } from "./lib/vihaan-pilot";
import { scholarshipWrittenExpressionRubric as rubric } from "../src/features/writing/rubrics/scholarship-written-expression";

const base = "content/vihaan-scholarship/pilot-01";
const batch = pilotSchema.parse(JSON.parse(await readFile(`${base}/draft.json`,"utf8")));
const lines = ["# Pilot 01 — private human review worksheet", "", `Local draft batch hash: ${hash(batch)}`, "", "All 20 items are DRAFT / PENDING. This sheet is an editorial aid; filling it does not approve, ingest or publish content. Record any eventual approval through the existing authorised governance workflow against the final exact revision.", "", "Check each item for answer uniqueness, every distractor, worked steps, Australian English, bounded originality evidence and age suitability. Record ACCEPT / REVISE / REJECT, reasons and reviewer identity outside this generated sheet. Difficulty and timing are provisional practice estimates, not official examination specifications.", ""];
for (const item of batch.items) {
  const q = item.question;
  lines.push(`## ${q.id}`, "", `Subject: ${q.metadata.subject}. Topic: ${q.metadata.topic}. Difficulty: ${q.metadata.difficulty}. Estimated time: ${q.metadata.estimatedTimeSeconds} seconds.`, "", `Local draft item hash: ${hash(item)}`, "");
  if (q.stimulus) lines.push(`Passage: ${q.stimulus.title}`, "", q.stimulus.body, "");
  lines.push(q.prompt, "");
  if (q.instructions) lines.push(q.instructions, "");
  for (const o of q.options) lines.push(`- ${o.id}) ${o.text}`);
  lines.push("", "Reviewer-only assessment", "");
  if (q.answerKey.kind === "single_option") lines.push(`Answer key: ${q.answerKey.optionId}.`, "");
  if (q.answerKey.kind === "manual") lines.push("No single correct response. Human rubric assessment only.", "", q.answerKey.rubric, "", q.answerKey.sampleResponse ?? "", "");
  lines.push(...item.workedSolution.map((s,i)=>`${i+1}. ${s}`), "");
  if (item.writingGuidance) lines.push("Task success criteria:", "", ...item.writingGuidance.successCriteria.map(s=>`- ${s}`), "");
  lines.push("Review status: PENDING; no named human reviewer or approval recorded.", "");
}
lines.push("## Existing scholarship writing rubric", "", `${rubric.title}, version ${rubric.version}. Each criterion 1–5; use 2 and 4 for intermediate performance. This is practice feedback, not an official examination score.`, "");
for (const c of rubric.criteria) lines.push(`### ${c.label}`, "", c.lookFor, "", ...Object.entries(c.anchors).map(([level,description])=>`- ${level}: ${description}`), "");
await writeFile(`${base}/human-review-sheet.md`,lines.join("\n")+"\n");
console.log(`Prepared private review sheet for ${batch.items.length} drafts; no approval recorded.`);
