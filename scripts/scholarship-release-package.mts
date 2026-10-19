/**
 * Builds the reviewable scholarship release package from the CURRENT draft content:
 *
 *   docs/reviews/scholarship-2026-10-18/
 *     status.json                       per-item bucket, evidence and gate facts for all 160 items
 *     review-sheets/                    per-section HTML (exact content, keys, explanations, difficulty) and a blank
 *                                       publish-compatible decision CSV per section
 *     difficulty/estimator-all-160.csv  advisory estimator versus declared label for every item
 *     difficulty/blocked-35-recommendations.csv
 *     external-review/packet.txt        answer-withheld Verbal Reasoning + Reading packet for a different-provider reviewer
 *     external-review/packet-manifest.json
 *
 * Nothing here approves, signs, publishes or enables anything. Decision columns are written blank. Re-run after any
 * content change: every hash below is derived from the content as it stands.
 *
 *   npx tsx scripts/scholarship-release-package.mts [--out docs/reviews/scholarship-2026-10-18]
 */
import "./lib/allow-server-only.mts";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { FACTORY_THRESHOLDS } from "../src/features/question-factory/config";
import {
  isScholarshipAttestedItem,
  verifyFirstPartyScholarshipAttestation,
  type ScholarshipQuestionLike,
} from "../src/features/question-factory/correctness/scholarship-attestation";
import { computeSolver, solverAnswerError } from "../src/features/question-factory/correctness/solver-verification";
import { computeDifficultyDeviation, estimateDifficulty } from "../src/features/question-factory/difficulty/estimate-difficulty";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { hashJson } from "../src/features/question-factory/provenance";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";

const DRAFTS = "content/scholarship-drafts";
const SECTIONS = [
  { key: "nr", file: "scholarship-y6-numerical-reasoning-draft.json", title: "Numerical Reasoning", judgement: false },
  { key: "maths", file: "scholarship-y6-mathematics-draft.json", title: "Mathematics", judgement: false },
  { key: "vr", file: "scholarship-y6-verbal-reasoning-draft.json", title: "Verbal Reasoning", judgement: true },
  { key: "rc", file: "scholarship-y6-reading-draft.json", title: "Reading Comprehension", judgement: true },
] as const;

type Bucket =
  | "ready_for_review"
  | "requires_revision_or_decision"
  | "awaiting_external_evidence"
  | "previously_approved_valid_evidence"
  | "excluded";

interface Draft {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  stimulus?: { title?: string; body: string };
  answerKey: { optionId: string };
  explanation: string;
  metadata: { skill: string; strand: string; difficulty: string; marks: number; estimatedTimeSeconds: number };
}
interface Sidecar { solver?: string; solverParams?: Record<string, unknown>; correctValue?: string | number; requiresHumanSemanticCheck?: boolean }

const outDir = (() => {
  const i = process.argv.indexOf("--out");
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : "docs/reviews/scholarship-2026-10-18";
})();

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const csv = (v: string | number) => {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const sha256 = (t: string) => createHash("sha256").update(t).digest("hex");

function verifier(item: Draft, side: Sidecar | undefined): { text: string; independent: boolean } {
  if (isScholarshipAttestedItem(item as unknown as ScholarshipQuestionLike)) {
    const a = verifyFirstPartyScholarshipAttestation(item as unknown as ScholarshipQuestionLike);
    return a.ok
      ? { text: `first-party hash-bound recompute = ${a.computedValue}; matches key`, independent: true }
      : { text: `ATTESTATION FAILED (${a.error})`, independent: false };
  }
  if (side?.solver && side.solver !== "arithmetical_reasoning") {
    const orientation = (side.solverParams as { ruleOrientation?: "row" | "column" | "diagonal" } | undefined)?.ruleOrientation;
    const c = computeSolver({ solver: side.solver, solverParams: side.solverParams ?? {}, ruleOrientation: orientation, correctValue: side.correctValue });
    if (!c.ok) return { text: `SOLVER ERROR: ${c.error}`, independent: false };
    const err = solverAnswerError(item as never, c.value);
    return err ? { text: `MISMATCH: ${err}`, independent: false } : { text: `closed-language solver (${side.solver}) = ${c.value}; matches key`, independent: true };
  }
  return { text: "no machine proof; human semantic judgement required", independent: false };
}

async function existingScholarshipApprovals(): Promise<Set<string>> {
  const ids = new Set<string>();
  try {
    for (const file of await readdir("content/publication-approvals")) {
      if (file.startsWith("scholarship-")) ids.add(file.replace(/\.json$/, ""));
    }
  } catch {
    /* no directory means no approvals */
  }
  return ids;
}

async function main(): Promise<void> {
  const recs = JSON.parse(await readFile(path.join(outDir, "difficulty/difficulty-recommendations.json"), "utf8")) as {
    recommendations: Record<string, { label: string; confidence: string; steps: number; recommendation: string; rationale: string }>;
  };
  const prior = JSON.parse(await readFile(path.join(outDir, "difficulty/prior-opus-5-5-assessment-2026-10-17.json"), "utf8")) as {
    items: { id: string; myLabel: string; confidence: string }[];
  };
  const priorLabel = new Map(prior.items.map((x) => [x.id, x]));
  const changedPins = new Set<string>(JSON.parse(await readFile(path.join(outDir, "revised-in-this-release.json"), "utf8").catch(() => "[]")) as string[]);
  const approvals = await existingScholarshipApprovals();

  const items: Record<string, unknown>[] = [];
  const estimatorRows = ["id,section,declared,estimator,deviation,confidence,gateVerdict,wordCount,readingLoad,reasoningStepSignal"];
  const blockedRows = ["id,declared,estimator,myLabel,myConfidence,recommendation,priorOpusLabel,priorOpusConfidence,rationale"];
  const manifest: Record<string, unknown>[] = [];
  const externalVr: string[] = [];
  const externalRc: string[] = [];
  let lastPassage = "";

  await mkdir(path.join(outDir, "review-sheets"), { recursive: true });
  await mkdir(path.join(outDir, "difficulty"), { recursive: true });
  await mkdir(path.join(outDir, "external-review"), { recursive: true });

  for (const section of SECTIONS) {
    const packet = JSON.parse(await readFile(path.join(DRAFTS, section.file), "utf8")) as { questions: Draft[]; parameters: Record<string, Sidecar> };
    const sheet = ["questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes"];
    const cards: string[] = [];
    const counts: Record<string, number> = {};
    let lastStimulus = "";

    for (const item of packet.questions) {
      const candidate = candidateQuestionSchema.parse(item);
      const built = buildPublishedQuestion(candidate);
      if (!built.ok) throw new Error(`${item.id}: ${built.issues.join("; ")}`);
      const publishedHash = canonicalQuestionHash(built.question);
      const candidateHash = hashJson(candidate);

      const est = estimateDifficulty({ prompt: item.prompt, stimulusBody: item.stimulus?.body, optionTexts: item.options.map((o) => o.text), explanation: item.explanation });
      const deviation = computeDifficultyDeviation(est.estimatedDifficulty, item.metadata.difficulty as never);
      const gate = est.estimateConfidence < FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE
        ? "blocked_low_confidence"
        : deviation > FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE ? "blocked_deviation" : "passes";
      estimatorRows.push([item.id, section.key, item.metadata.difficulty, est.estimatedDifficulty, deviation, est.estimateConfidence.toFixed(3), gate,
        est.signals.wordCount, est.signals.readingLoadScore.toFixed(2), est.signals.reasoningStepScore.toFixed(2)].map(csv).join(","));

      const v = verifier(item, packet.parameters?.[item.id]);
      const rec = recs.recommendations[item.id];
      const revisedThisRound = changedPins.has(item.id);

      let bucket: Bucket;
      const reasons: string[] = [];
      if (approvals.has(item.id)) {
        bucket = "previously_approved_valid_evidence";
        reasons.push("an approval record file exists; it is only valid if it verifies against this exact content (run content:verify-publication)");
      } else if (section.judgement) {
        bucket = "awaiting_external_evidence";
        reasons.push("AI-generated judgement content: policy needs a different-provider reviewer (not Anthropic); none is on file");
        if (gate !== "passes") reasons.push(`difficulty gate would also block it (declared ${item.metadata.difficulty}, estimator ${est.estimatedDifficulty}); the external reviewer's difficulty rating is the independent evidence`);
      } else if (gate !== "passes") {
        bucket = "requires_revision_or_decision";
        reasons.push(`difficulty gate blocks it (declared ${item.metadata.difficulty}, estimator ${est.estimatedDifficulty}); needs a label decision or an approved advisory policy`);
      } else if (!v.independent) {
        bucket = "requires_revision_or_decision";
        reasons.push("no machine proof of the answer");
      } else {
        bucket = "ready_for_review";
        reasons.push("first-party or closed-language answer proof matches the key; difficulty gate passes");
      }
      if (revisedThisRound) reasons.push("content revised in this release; any earlier Claude review of it is stale");
      counts[bucket] = (counts[bucket] ?? 0) + 1;

      items.push({
        id: item.id, section: section.key, bucket, reasons, key: item.answerKey.optionId, declaredDifficulty: item.metadata.difficulty,
        estimator: est.estimatedDifficulty, difficultyGate: gate, machineProof: v.text, candidateHash, publishedContentHash: publishedHash,
        revisedThisRound, difficultyRecommendation: rec ? { label: rec.label, recommendation: rec.recommendation, confidence: rec.confidence } : undefined,
      });

      if (rec) {
        const p = priorLabel.get(`${item.id}`);
        blockedRows.push([item.id, item.metadata.difficulty, est.estimatedDifficulty, rec.label, rec.confidence, rec.recommendation,
          p?.myLabel ?? "", p?.confidence ?? "", rec.rationale].map(csv).join(","));
      }

      // Blank, publish-compatible decision row: contentHash is the canonical hash of the published Question and revision is
      // the ingested provenance revision (0), exactly what questions:publish validates a signed row against.
      sheet.push([item.id, publishedHash, 0, "", "", "", "", "", ""].map(csv).join(","));

      const key = item.stimulus ? `${item.stimulus.title}\n${item.stimulus.body}` : "";
      const passage = item.stimulus && key !== lastStimulus
        ? `<section class="passage"><h3>${esc(item.stimulus.title ?? "Passage")}</h3>${item.stimulus.body.split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</section>`
        : item.stimulus ? `<p class="same">Same passage: ${esc(item.stimulus.title ?? "")}</p>` : "";
      lastStimulus = key;
      cards.push(`${passage}<article class="${bucket}"><h4>${esc(item.id)} <small>${esc(item.metadata.skill)} · declared ${esc(item.metadata.difficulty)} · ${item.metadata.marks} mark · ${item.metadata.estimatedTimeSeconds}s</small></h4>
<p class="bucket">${esc(bucket.replace(/_/g, " "))}: ${reasons.map(esc).join("; ")}</p>
<p>${esc(item.prompt).replace(/\n/g, "<br>")}</p><ol type="a">${item.options.map((o) => `<li${o.id === item.answerKey.optionId ? ' class="key"' : ""}>${esc(o.text)}</li>`).join("")}</ol>
<p class="meta">Key: <strong>${esc(item.answerKey.optionId)}</strong> · machine proof: ${esc(v.text)} · estimator: ${est.estimatedDifficulty} (${gate.replace(/_/g, " ")})${rec ? ` · assessed ${rec.label} (${rec.confidence}), recommendation: ${esc(rec.recommendation.replace(/_/g, " "))}` : ""}</p>
<p class="expl"><strong>Explanation shown after submission:</strong> ${esc(item.explanation)}</p>
${rec ? `<p class="rationale"><strong>Difficulty rationale:</strong> ${esc(rec.rationale)}</p>` : ""}
<p class="hash">published content hash ${publishedHash.slice(0, 16)}… (the sheet row binds the full hash)</p>
<p class="decide">Correctness ☐ &nbsp; Originality ☐ &nbsp; Age-appropriate ☐ &nbsp; Decision: ☐ approve ☐ revise ☐ reject &nbsp; Notes: ______________________</p></article>`);

      manifest.push({ id: item.id, section: section.key, candidateHash, publishedContentHash: publishedHash, ...(section.judgement ? { inExternalPacket: true } : {}) });

      if (section.judgement) {
        const target = section.key === "vr" ? externalVr : externalRc;
        const optionLines = item.options.map((o) => `${o.id}) ${o.text}`).join("\n");
        const passageBlock = item.stimulus && key !== lastPassage
          ? `PASSAGE: ${item.stimulus.title ?? ""}\n${item.stimulus.body}\n(The passage above applies to the following questions until a new passage appears.)\n\n`
          : "";
        if (item.stimulus) lastPassage = key;
        target.push(`${passageBlock}ID: ${item.id}\n\nQuestion:\n${item.prompt}\n\nOptions:\n${optionLines}\n`);
      }
    }

    await writeFile(path.join(outDir, "review-sheets", `review-sheet-scholarship-y6-${section.key}-blank.csv`), `${sheet.join("\n")}\n`, "utf8");
    const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Scholarship Y6 ${esc(section.title)} review sheet</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:880px;margin:2rem auto;padding:0 1rem;color:#1a1a1a}article{border:1px solid #ccc;border-radius:6px;padding:.75rem 1rem;margin:1rem 0;break-inside:avoid}.passage{background:#f6f3ec;border-left:4px solid #8a7a55;padding:.5rem 1rem;margin:1.5rem 0}.key{font-weight:600}.bucket{font-size:13px;color:#444}.meta,.same,.hash,small{color:#555}.rationale{color:#1c4a8a}.expl{background:#f3f7f3;padding:.4rem .6rem}.decide{border-top:1px dashed #bbb;padding-top:.5rem}article.ready_for_review{border-left:5px solid #2f7d32}article.requires_revision_or_decision{border-left:5px solid #b26a00}article.awaiting_external_evidence{border-left:5px solid #6a3fb2}</style></head><body><h1>Scholarship Year 6: ${esc(section.title)} (review sheet)</h1><p><strong>Nothing here is approved, published or enabled.</strong> Section tally: ${Object.entries(counts).map(([k, n]) => `${k.replace(/_/g, " ")} ${n}`).join(", ")}. The green-bordered keyed option is the declared key. Decisions are recorded by the human reviewer through the governed approval workflow, using the blank CSV beside this file.</p>${cards.join("\n")}</body></html>`;
    await writeFile(path.join(outDir, "review-sheets", `review-sheet-scholarship-y6-${section.key}.html`), html, "utf8");
  }

  const bucketTotals: Record<string, number> = {};
  for (const i of items) bucketTotals[i.bucket as string] = (bucketTotals[i.bucket as string] ?? 0) + 1;
  await writeFile(path.join(outDir, "status.json"), `${JSON.stringify({ totals: bucketTotals, items }, null, 2)}\n`, "utf8");
  await writeFile(path.join(outDir, "difficulty/estimator-all-160.csv"), `${estimatorRows.join("\n")}\n`, "utf8");
  await writeFile(path.join(outDir, "difficulty/blocked-35-recommendations.csv"), `${blockedRows.join("\n")}\n`, "utf8");

  const header = "BLIND REVIEW PACKET: Year 6 scholarship-style Verbal Reasoning (45 items) and Reading Comprehension (35 items)\n\nThis packet contains item IDs, passages, prompts and options only. It deliberately contains no answer keys, explanations, difficulty labels, earlier reviews or author notes.\n\n========================================================================\n";
  const packetText = `${header}\n\nVERBAL REASONING\n========================================================================\n\n${externalVr.join("\n------------------------------------------------------------------------\n\n")}\n\nREADING COMPREHENSION\n========================================================================\n\n${externalRc.join("\n------------------------------------------------------------------------\n\n")}`;
  await writeFile(path.join(outDir, "external-review/packet.txt"), packetText, "utf8");
  await writeFile(path.join(outDir, "external-review/packet-manifest.json"), `${JSON.stringify({
    packet: "packet.txt", packetSha256: sha256(packetText), itemCount: externalVr.length + externalRc.length,
    note: "candidateHash/publishedContentHash bind a returned review to the exact content version in this release. A review returned for a different packetSha256 does not apply.",
    items: manifest.filter((m) => m.inExternalPacket),
  }, null, 2)}\n`, "utf8");

  const packetSha = sha256(packetText);
  const prompt = [
    "You are an independent blind reviewer of Year 6 scholarship-style practice questions written for Australian students aged about 11.",
    "",
    "Work in this order for EVERY item in the packet that follows: solve it yourself from the text only, then decide whether exactly one option is defensible, check any passage for factual errors or over-claims, judge whether the distractors are plausible and distinct, whether the correct option can be spotted merely by its length or by copying a passage sentence, and whether the content suits the age. Rate the reasoning difficulty a strong Year 6 candidate would meet: easy, medium or challenging.",
    "",
    "Reply with ONE JSON object and nothing else (no commentary, no markdown fences), covering all 80 items, in exactly this shape:",
    "{",
    '  "reviewer": { "provider": "<the company that made you, as the product shows it>", "model": "<your exact model name as the product shows it>", "date": "YYYY-MM-DD", "freshSession": true, "packetSha256": "' + packetSha + '" },',
    '  "items": [ { "id": "scholarship-y6-vr-001", "myAnswer": "a|b|c|d|e|none", "reasoning": "one or two sentences", "singleDefensibleAnswer": true, "issues": "ambiguity, factual error, copied-sentence key, weak distractors, or an empty string", "difficulty": "easy|medium|challenging", "verdict": "PASS|REVISE|REJECT", "fix": "a precise fix if REVISE or REJECT, otherwise an empty string" } ]',
    "}",
    "",
    "Set freshSession to true only if this conversation contains nothing but this message. Do not guess your model name; if you cannot tell, use the string unknown and the review will be set aside.",
    "",
    "PACKET FOLLOWS",
    "",
    packetText,
  ].join("\n");
  await writeFile(path.join(outDir, "external-review/prompt-with-packet.txt"), prompt, "utf8");

  console.log(JSON.stringify(bucketTotals));
}

await main();
