/**
 * Builds the complete item-by-item difficulty decision sheet (all 160 items) from the committed review package plus the
 * advisory Verbal Reasoning and Reading assessment. Writes CSV (for Vish to fill in) and HTML (to read). Records no decision.
 *
 *   npx tsx scripts/scholarship-difficulty-decision-sheet.mts
 *
 * Run scripts/scholarship-release-package.mts first; this reads its status.json and estimator-all-160.csv.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const pkg = "docs/reviews/scholarship-2026-10-18";
const read = (p: string): string => readFileSync(path.join(pkg, p), "utf8");

interface Rec { label: string; confidence: string; recommendation: string; rationale: string }
const status = (JSON.parse(read("status.json")) as { items: { id: string; bucket: string }[] }).items;
const mine35 = (JSON.parse(read("difficulty/difficulty-recommendations.json")) as { recommendations: Record<string, Rec> }).recommendations;
const vrrc = (JSON.parse(read("difficulty/difficulty-vr-rc-advisory.json")) as { recommendations: Record<string, Rec> }).recommendations;
const prior = Object.fromEntries(
  (JSON.parse(read("difficulty/prior-opus-5-5-assessment-2026-10-17.json")) as { items: { id: string; myLabel: string }[] }).items.map((x) => [x.id, x]),
);
const est = Object.fromEntries(
  read("difficulty/estimator-all-160.csv").trim().split("\n").slice(1).map((line) => {
    const c = line.split(",");
    return [c[0]!, { section: c[1]!, declared: c[2]!, estimator: c[3]!, gate: c[6]! }];
  }),
);

const csv = (v: unknown): string => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const esc = (v: unknown): string => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const head = [
  "id", "section", "bucket", "declaredLabel", "estimatorLabel", "gateVerdict", "labelThatClearsGate", "advisoryLabel", "advisoryConfidence",
  "advisoryRecommendation", "recommendedLabelClearsGate", "priorOpusLabel", "externalReviewerRating", "advisoryRationale",
  "VishDecision(keep|relabel:<label>|revise|drop)", "VishNotes",
];
const rows: string[][] = [];
let blocked = 0;
for (const s of status) {
  const e = est[s.id]!;
  const rec = mine35[s.id] ?? vrrc[s.id];
  const isBlocked = e.gate !== "passes";
  if (isBlocked) blocked += 1;
  rows.push([
    s.id, e.section, s.bucket, e.declared, e.estimator, e.gate, isBlocked ? e.estimator : "", rec?.label ?? "", rec?.confidence ?? "",
    rec?.recommendation ?? (isBlocked ? "" : "no conflict: estimator agrees with label"),
    rec && isBlocked ? (rec.label === e.estimator ? "yes" : "no") : "", prior[s.id]?.myLabel ?? "", "", rec?.rationale ?? "", "", "",
  ]);
}
writeFileSync(path.join(pkg, "difficulty/difficulty-decision-sheet.csv"), `${[head.join(","), ...rows.map((r) => r.map(csv).join(","))].join("\n")}\n`);

const body = rows.map((r) => {
  const [id, , bucket, decl, estl, gate, , adv, conf, recm, , prev, , why] = r;
  return `<tr class="${gate === "passes" ? "ok" : "blocked"}"><td>${esc(id!.replace("scholarship-y6-", ""))}</td><td>${esc(bucket!.replace(/_/g, " "))}</td><td>${esc(decl)}</td><td>${esc(estl)}</td><td>${esc(gate!.replace(/_/g, " "))}</td><td>${esc(adv)}${conf ? ` (${esc(conf)})` : ""}</td><td>${esc(String(recm).replace(/_/g, " "))}</td><td>${esc(prev)}</td><td>${esc(why)}</td><td>☐ keep ☐ relabel ____ ☐ revise ☐ drop</td></tr>`;
}).join("\n");
writeFileSync(
  path.join(pkg, "difficulty/difficulty-decision-sheet.html"),
  `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Scholarship Y6 difficulty decision sheet</title><style>body{font:14px/1.45 system-ui,sans-serif;margin:1.5rem}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:.3rem .45rem;vertical-align:top}th{background:#f1eee6;position:sticky;top:0}tr.blocked{background:#fff6e5}.n{color:#555}</style></head><body><h1>Scholarship Year 6: difficulty decision sheet (all 160 items)</h1><p class="n"><strong>No decision is recorded.</strong> Highlighted rows are the ${blocked} items the difficulty gate would block today (the estimator label differs from the declared label). An advisory label is Claude's judgement and is not independent evidence; for Verbal Reasoning and Reading the different-provider reviewer's difficulty rating is. The label that clears the gate is simply the estimator's; choose a label because the item is that hard, not to satisfy the estimator.</p><table><thead><tr><th>Item</th><th>Bucket</th><th>Declared</th><th>Estimator</th><th>Gate today</th><th>Advisory label</th><th>Advisory recommendation</th><th>Earlier Opus label</th><th>Rationale</th><th>Vish's decision</th></tr></thead><tbody>${body}</tbody></table></body></html>`,
);
console.log(JSON.stringify({ items: rows.length, gateBlocked: blocked }));
