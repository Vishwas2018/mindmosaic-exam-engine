/**
 * Generates human review sheets for the scholarship Year 6 draft packets, in the
 * same shape as the AMC sheets: a blank decision CSV per packet, an HTML view,
 * and one advisory reviewer-notes document that joins the declared key, the
 * independent blind answer and the machine verifier result per item.
 *
 * Advisory only. Nothing here approves, publishes or enables anything: the
 * decision columns are written blank for the human reviewer.
 *
 *   npx tsx scripts/scholarship-review-sheets.mts --blind-dir <dir with review-<packet>.json> --out-dir <dir>
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  isScholarshipAttestedItem,
  verifyFirstPartyScholarshipAttestation,
  type ScholarshipQuestionLike,
} from "../src/features/question-factory/correctness/scholarship-attestation";
import { computeSolver, solverAnswerError } from "../src/features/question-factory/correctness/solver-verification";
import { hashJson } from "../src/features/question-factory/provenance";

const DRAFTS = "content/scholarship-drafts";
const PACKETS = [
  { key: "nr", file: "scholarship-y6-numerical-reasoning-draft.json", title: "Numerical Reasoning" },
  { key: "vr", file: "scholarship-y6-verbal-reasoning-draft.json", title: "Verbal Reasoning" },
  { key: "rc", file: "scholarship-y6-reading-draft.json", title: "Reading Comprehension" },
  { key: "maths", file: "scholarship-y6-mathematics-draft.json", title: "Mathematics" },
] as const;

interface Option { id: string; text: string }
interface DraftItem {
  id: string;
  type: string;
  prompt: string;
  options: Option[];
  stimulus?: { title?: string; body?: string };
  answerKey: { kind: string; optionId: string };
  metadata: { skill: string; difficulty?: string; marks?: number };
}
interface Sidecar {
  solver?: string;
  solverParams?: Record<string, unknown>;
  correctValue?: string | number;
  requiresHumanSemanticCheck?: boolean;
}
interface BlindItem {
  id: string;
  myAnswer: string;
  confidence?: string;
  uniqueAnswer?: boolean;
  defensibleOptions?: string[];
  semanticFlags?: string[];
  originality?: string;
  originalityNote?: string;
  difficultyEstimate?: string;
  difficultyVerdict?: string;
  recommendation?: string;
  notes?: string;
}

function arg(name: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing ${name}`);
  return process.argv[index + 1];
}

const esc = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cell = (text: string): string => text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function verifierResult(item: DraftItem, sidecar: Sidecar | undefined): string {
  if (isScholarshipAttestedItem(item as unknown as ScholarshipQuestionLike)) {
    const attestation = verifyFirstPartyScholarshipAttestation(item as unknown as ScholarshipQuestionLike);
    return attestation.ok
      ? `first-party recompute = ${attestation.computedValue}, matches key`
      : `ATTESTATION FAILED (${attestation.error})`;
  }
  if (sidecar?.solver === "arithmetical_reasoning") return "NOT VERIFIED: no first-party solver registered";
  if (sidecar?.solver) {
    const orientation = (sidecar.solverParams as { ruleOrientation?: "row" | "column" | "diagonal" } | undefined)?.ruleOrientation;
    const computed = computeSolver({
      solver: sidecar.solver,
      solverParams: sidecar.solverParams ?? {},
      ruleOrientation: orientation,
      correctValue: sidecar.correctValue,
    });
    if (!computed.ok) return `SOLVER ERROR: ${computed.error}`;
    const error = solverAnswerError(item as never, computed.value);
    return error ? `MISMATCH: ${error}` : `solver (${sidecar.solver}) = ${computed.value}, matches key`;
  }
  return sidecar?.requiresHumanSemanticCheck ? "human semantic check required" : "none";
}

function flagsFor(item: DraftItem, blind: BlindItem | undefined): string[] {
  if (!blind) return ["NO BLIND REVIEW RECORDED"];
  const flags: string[] = [];
  if (blind.myAnswer !== item.answerKey.optionId) flags.push(`BLIND DISAGREES (blind ${blind.myAnswer} vs key ${item.answerKey.optionId})`);
  if (blind.uniqueAnswer === false) flags.push(`not uniquely answerable (defensible: ${(blind.defensibleOptions ?? []).join("/") || "?"})`);
  for (const flag of blind.semanticFlags ?? []) flags.push(flag);
  if (blind.originality && blind.originality !== "original" && blind.originality !== "common-genre") {
    flags.push(`originality: ${blind.originality}${blind.originalityNote ? ` (${blind.originalityNote})` : ""}`);
  }
  if (blind.difficultyVerdict && blind.difficultyVerdict !== "appropriate") {
    flags.push(`difficulty ${blind.difficultyVerdict} (blind: ${blind.difficultyEstimate}, label: ${item.metadata.difficulty})`);
  }
  if (blind.recommendation && blind.recommendation !== "approve") {
    flags.push(`blind recommends ${blind.recommendation}${blind.notes ? `: ${blind.notes}` : ""}`);
  }
  return flags;
}

async function main(): Promise<void> {
  const blindDir = arg("--blind-dir");
  const outDir = arg("--out-dir");
  await mkdir(outDir, { recursive: true });

  const notes: string[] = [
    "# Scholarship Year 6 draft items: advisory reviewer notes",
    "",
    "Advisory for the human reviewer only; not a decision. No approval is recorded and nothing is published, enabled or merged.",
    "Blind pass: an independent reviewer saw only prompt, stimulus, options, skill and claimed difficulty (keys, explanations and sidecars withheld).",
    "Machine pass: first-party hash-bound recompute for nr-021..040, the closed-language solvers for the rest of NR/VR, none for Reading (human semantic check) and none for Mathematics (no first-party solvers registered yet).",
    "The contentHash column in each CSV is the hash an attestation binds to, so a sheet decision goes stale if the item is edited.",
    "",
  ];
  const tally: string[] = [];

  for (const packet of PACKETS) {
    const draft = JSON.parse(await readFile(path.join(DRAFTS, packet.file), "utf8")) as {
      questions: DraftItem[];
      parameters: Record<string, Sidecar>;
    };
    let blindItems = new Map<string, BlindItem>();
    let reviewer = "none";
    try {
      const blind = JSON.parse(await readFile(path.join(blindDir, `review-${packet.key}.json`), "utf8")) as {
        reviewer?: string;
        blindnessConfirmed?: boolean;
        items: BlindItem[];
      };
      blindItems = new Map(blind.items.map((entry) => [entry.id, entry]));
      reviewer = `${blind.reviewer ?? "unknown"}${blind.blindnessConfirmed === false ? " (BLINDNESS NOT CONFIRMED)" : ""}`;
    } catch {
      /* missing blind file is reported per item below */
    }

    // blank decision CSV
    const csv = ["questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes"];
    for (const item of draft.questions) csv.push([item.id, hashJson(item), 1, "", "", "", "", "", ""].map(csvCell).join(","));
    await writeFile(path.join(outDir, `review-sheet-scholarship-y6-${packet.key}-draft-blank.csv`), `${csv.join("\n")}\n`, "utf8");

    // notes table + HTML cards
    let agree = 0;
    let flagged = 0;
    let revise = 0;
    let reject = 0;
    const rows: string[] = [];
    const cards: string[] = [];
    let lastStimulus = "";
    for (const item of draft.questions) {
      const blind = blindItems.get(item.id);
      const keyedText = item.options.find((option) => option.id === item.answerKey.optionId)?.text ?? "?";
      const agrees = blind?.myAnswer === item.answerKey.optionId;
      if (agrees) agree += 1;
      const verifier = verifierResult(item, draft.parameters[item.id]);
      const flags = flagsFor(item, blind);
      const hardFlags = flags.some((flag) => /DISAGREES|not uniquely|NO BLIND|FAILED|MISMATCH|ERROR|NOT VERIFIED/.test(flag));
      if (hardFlags || /NOT VERIFIED|FAILED|MISMATCH|ERROR/.test(verifier)) flagged += 1;
      if (blind?.recommendation === "revise") revise += 1;
      if (blind?.recommendation === "reject") reject += 1;
      const optionLine = item.options.map((option) => `${option.id}) ${option.text}`).join(" · ");
      const promptCell = item.stimulus?.title ? `[passage: ${item.stimulus.title}] ${item.prompt}` : item.prompt;
      rows.push(
        `| ${item.id.replace("scholarship-y6-", "")} (${item.metadata.difficulty ?? "?"}, ${item.metadata.skill}) | ${cell(promptCell)}<br>${cell(optionLine)} | ${item.answerKey.optionId}: ${cell(keyedText)} | ${blind?.myAnswer ?? "-"} | ${blind ? (agrees ? "yes" : "NO") : "-"} | ${cell(verifier)} | ${flags.length ? cell(flags.join("; ")) : "-"} |`,
      );

      const stimulusKey = item.stimulus ? `${item.stimulus.title}\n${item.stimulus.body}` : "";
      const passage = item.stimulus && stimulusKey !== lastStimulus
        ? `<section class="passage"><h3>${esc(item.stimulus.title ?? "Passage")}</h3>${(item.stimulus.body ?? "").split(/\n\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</section>`
        : item.stimulus
          ? `<p class="same-passage">Same passage: ${esc(item.stimulus.title ?? "")}</p>`
          : "";
      lastStimulus = stimulusKey;
      cards.push(
        `${passage}<article><h4>${esc(item.id)} <small>${esc(item.metadata.skill)} · ${esc(item.metadata.difficulty ?? "")}</small></h4><p>${esc(item.prompt)}</p><ol type="a">${item.options
          .map((option) => `<li${option.id === item.answerKey.optionId ? ' class="key"' : ""}>${esc(option.text)}</li>`)
          .join("")}</ol><p class="meta">Declared key: <strong>${esc(item.answerKey.optionId)}</strong> · blind answer: <strong>${esc(blind?.myAnswer ?? "-")}</strong> · verifier: ${esc(verifier)}</p>${flags.length ? `<p class="flags">${flags.map(esc).join("<br>")}</p>` : ""}<p class="decide">Correctness ☐ &nbsp; Originality ☐ &nbsp; Age-appropriate ☐ &nbsp; Decision: ☐ approve ☐ revise ☐ reject &nbsp; Notes: ______________________</p></article>`,
      );
    }

    notes.push(
      `## ${packet.title} (${draft.questions.length} items)`,
      "",
      `Blind reviewer: ${reviewer}. Agreement with declared key: ${agree}/${draft.questions.length}. Blind recommends revise ${revise}, reject ${reject}. Unverified or hard-flagged: ${flagged}.`,
      "",
      "| Item | Prompt | Declared key | Blind answer | Agree | Verifier | Defects / flags |",
      "|---|---|---|---|---|---|---|",
      ...rows,
      "",
    );
    tally.push(`${packet.title}: ${agree}/${draft.questions.length} blind answers match the key; blind recommends revise ${revise}, reject ${reject}; ${flagged} item(s) unverified or hard-flagged`);

    const html = `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><title>Scholarship Y6 ${esc(packet.title)} review sheet</title><style>body{font:15px/1.5 system-ui,sans-serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#1a1a1a}article{border:1px solid #ccc;border-radius:6px;padding:.75rem 1rem;margin:1rem 0;break-inside:avoid}.passage{background:#f6f3ec;border-left:4px solid #8a7a55;padding:.5rem 1rem;margin:1.5rem 0}.key{font-weight:600}.flags{color:#8a1c1c}.meta,.same-passage,small{color:#555}.decide{border-top:1px dashed #bbb;padding-top:.5rem}</style></head><body><h1>Scholarship Year 6: ${esc(packet.title)} (draft review sheet)</h1><p>Advisory only. Draft content: nothing here is approved, published or enabled. Decisions are recorded by the human reviewer.</p>${cards.join("\n")}</body></html>`;
    await writeFile(path.join(outDir, `review-sheet-scholarship-y6-${packet.key}-draft.html`), html, "utf8");
  }

  notes.splice(7, 0, "## Summary", "", ...tally.map((line) => `- ${line}`), "");
  await writeFile(path.join(outDir, "scholarship-draft-reviewer-notes.md"), `${notes.join("\n")}\n`, "utf8");
  console.log(tally.join("\n"));
}

await main();
