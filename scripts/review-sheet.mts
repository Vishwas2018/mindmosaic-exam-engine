import "./lib/allow-server-only.mts";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { publishedExamBank } from "@/content/questions/practice-bank";
import { getSourceManifestForQuestion } from "@/features/content-governance/approval-verification";
import { programmeIdForQuestion } from "@/features/content-governance/gate-config";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { getWorkspaceRoot } from "@/features/question-factory/config";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";
import { FsFactoryRepository } from "@/features/question-factory/storage";
import { parseCandidateQuestion } from "@/features/question-factory/validation";
import { ExamQuestion } from "@/features/exam-engine/components/ExamQuestion";
import { toCandidateQuestion } from "@/features/exam-engine/types/candidate-question";
import type { Question } from "@/schemas/question.schema";
import { evaluateQuestionCorrectness } from "./check-question-correctness.mjs";

function formatProgrammeTitle(programmeId: string): string {
  const parts = programmeId.split("-");
  if (parts.length < 3) return programmeId;
  const family = parts[0].toUpperCase();
  const year = parts[1].replace(/^y/, "Year ");
  const subject = parts.slice(2).join(" ").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return `${family} ${year} ${subject}`;
}

function parseCliArgs(args: readonly string[]): {
  programme?: string;
  skill?: string;
  limit: number;
  candidateIds?: string[];
  outDir: string;
  csvPath?: string;
  htmlPath?: string;
} {
  let programme: string | undefined;
  let candidateIds: string[] | undefined;
  let outDir = "content/question-factory/reports/human-approval";
  let skill: string | undefined;
  let limit = 25;
  let csvPath: string | undefined;
  let htmlPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--programme" && args[i + 1]) {
      programme = args[++i];
    } else if (arg === "--skill" && args[i + 1]) {
      skill = args[++i];
    } else if (arg === "--limit" && args[i + 1]) {
      limit = Number(args[++i]);
    } else if (arg === "--candidate-ids" && args[i + 1]) {
      candidateIds = args[++i].split(",").map((s) => s.trim()).filter(Boolean);
    } else if (arg === "--out-dir" && args[i + 1]) {
      outDir = args[++i];
    } else if (arg === "--csv" && args[i + 1]) {
      csvPath = args[++i];
    } else if (arg === "--html" && args[i + 1]) {
      htmlPath = args[++i];
    } else {
      throw new Error(`Unknown or incomplete review-sheet argument: ${arg}`);
    }
  }

  if (!programme) throw new Error("Usage: content:review-sheet -- --programme <id> [--skill <skillId>] [--limit 25]");
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 25) throw new Error("--limit must be an integer from 1 to 25.");
  return { programme, skill, limit, candidateIds, outDir, csvPath, htmlPath };
}

function escapeCsvCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderAnswerKeySummary(question: Question): string {
  const key = question.answerKey;
  if (key.kind === "single_option") {
    const opt = question.options?.find((o) => o.id === key.optionId);
    return `<strong>Single Option:</strong> [${escapeHtml(key.optionId)}] ${escapeHtml(opt?.text ?? "")}`;
  }
  if (key.kind === "multiple_options") {
    const summary = key.optionIds
      .map((id) => {
        const opt = question.options?.find((o) => o.id === id);
        return `[${escapeHtml(id)}] ${escapeHtml(opt?.text ?? "")}`;
      })
      .join(", ");
    return `<strong>Multiple Options:</strong> ${summary}`;
  }
  if (key.kind === "number") {
    return `<strong>Number Value:</strong> ${escapeHtml(String(key.value))}${
      key.tolerance ? ` (±${key.tolerance})` : ""
    }`;
  }
  if (key.kind === "text") {
    return `<strong>Accepted Text:</strong> ${escapeHtml(key.acceptableAnswers.join(" | "))}`;
  }
  if (key.kind === "boolean") {
    return `<strong>Boolean:</strong> ${key.value ? "True" : "False"}`;
  }
  if (key.kind === "manual") {
    return `<strong>Manual Rubric:</strong> ${escapeHtml(key.rubric)}`;
  }
  return `<strong>${escapeHtml(key.kind)}:</strong> ${escapeHtml(JSON.stringify(key))}`;
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));

  let questions: readonly Question[] = publishedExamBank;
  const stagedSources = new Map<string, { revision: number; sourceManifestHash: null }>();
  if (options.candidateIds?.length) {
    const repository = new FsFactoryRepository(getWorkspaceRoot());
    const stagedQuestions: Question[] = [];
    for (const candidateId of options.candidateIds) {
      const record = await repository.read("staged", candidateId) as
        { question?: unknown; provenance?: { revision?: number } } | undefined;
      if (!record) throw new Error(`Candidate ${candidateId} is not staged.`);
      const parsed = parseCandidateQuestion(record.question);
      if (!parsed.ok) throw new Error(`Candidate ${candidateId} has invalid question content.`);
      const built = buildPublishedQuestion(parsed.data);
      if (!built.ok || !Number.isSafeInteger(record.provenance?.revision)) {
        throw new Error(`Candidate ${candidateId} has invalid publication preview or revision.`);
      }
      stagedQuestions.push(built.question);
      stagedSources.set(built.question.id, { revision: record.provenance!.revision!, sourceManifestHash: null });
    }
    questions = stagedQuestions;
  }
  if (options.programme) {
    questions = questions.filter((q) => programmeIdForQuestion(q) === options.programme);
  }
  if (options.skill) questions = questions.filter((q) => q.metadata.skill === options.skill);
  questions = questions.slice(0, options.limit);

  if (questions.length === 0) {
    console.log("No questions matched the review criteria.");
    return;
  }

  await mkdir(options.outDir, { recursive: true });

  const csvRows: string[] = [
    "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes",
  ];

  interface ReviewItemData {
    question: Question;
    programmeId: string;
    contentHash: string;
    revision: number;
    sourceManifestHash: string | null;
    isMachineVerifiable: boolean;
    verificationNotes: string[];
    questionHtml: string;
  }

  const reviewItems: ReviewItemData[] = [];
  let machineVerifiableCount = 0;
  let editorialReviewCount = 0;

  for (const q of questions) {
    const programmeId = programmeIdForQuestion(q);
    const contentHash = canonicalQuestionHash(q);
    const source = stagedSources.get(q.id) ?? await getSourceManifestForQuestion(q);
    const correctnessResult = evaluateQuestionCorrectness(q);
    const isMachineVerifiable = correctnessResult.computed && correctnessResult.failures.length === 0;

    if (isMachineVerifiable) {
      machineVerifiableCount++;
    } else {
      editorialReviewCount++;
    }

    const candidate = toCandidateQuestion(q);
    let questionHtml = "";
    try {
      questionHtml = renderToStaticMarkup(React.createElement(ExamQuestion, { question: candidate }));
    } catch (err) {
      questionHtml = `<div class="p-4 bg-red-50 text-red-700">Failed to render question: ${escapeHtml(
        String(err),
      )}</div>`;
    }

    reviewItems.push({
      question: q,
      programmeId,
      contentHash,
      revision: source.revision,
      sourceManifestHash: source.sourceManifestHash,
      isMachineVerifiable,
      verificationNotes: [...correctnessResult.warnings, ...correctnessResult.failures],
      questionHtml,
    });

    // CSV format specified in Section 10:
    // questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes
    // Last 5 columns start BLANK.
    csvRows.push(
      [
        escapeCsvCell(q.id),
        escapeCsvCell(contentHash),
        escapeCsvCell(source.revision),
        escapeCsvCell(source.sourceManifestHash),
        "", // correctness
        "", // originality
        "", // ageAppropriateness
        "", // decision
        "", // notes
      ].join(","),
    );
  }

  // Write CSV
  const sheetId = `review-sheet-${options.programme}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  const csvFileName = `${sheetId}.csv`;
  const finalCsvPath = options.csvPath ?? path.join(options.outDir, csvFileName);
  await writeFile(finalCsvPath, csvRows.join("\r\n") + "\r\n", { encoding: "utf8", flag: "wx" });

  // Generate HTML
  const htmlTitle = options.programme
    ? `Human Review Sheet — ${formatProgrammeTitle(options.programme)}`
    : "MindMosaic Human Publication Review Sheet";

  const htmlContent = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(htmlTitle)}</title>
  <style>
    :root {
      --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      --color-primary: #1e1b4b;
      --color-border: #e2e8f0;
      --color-bg: #f8fafc;
      --color-card: #ffffff;
      --color-text: #0f172a;
      --color-muted: #64748b;
      --color-tag-bg: #f1f5f9;
      --color-success-bg: #ecfdf5;
      --color-success-text: #065f46;
      --color-info-bg: #eff6ff;
      --color-info-text: #1e40af;
      --color-warn-bg: #fffbeb;
      --color-warn-text: #92400e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      background-color: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      padding: 2rem 1rem;
    }
    .container { max-width: 960px; margin: 0 auto; }
    header {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    h1 { font-size: 1.75rem; color: var(--color-primary); margin-bottom: 0.5rem; }
    .lead { color: var(--color-muted); font-size: 1rem; margin-bottom: 1.5rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .stat-card {
      background: var(--color-tag-bg);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
    }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; color: var(--color-muted); font-weight: 600; }
    .stat-value { font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
    .instructions {
      margin-top: 1.5rem;
      padding: 1rem;
      background: var(--color-info-bg);
      color: var(--color-info-text);
      border-radius: 0.5rem;
      font-size: 0.875rem;
    }
    .question-card {
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 1rem;
      margin-bottom: 2.5rem;
      padding: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .question-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-border);
    }
    .question-id { font-size: 1.25rem; font-weight: 700; color: var(--color-primary); }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }
    .badge-info { background: var(--color-info-bg); color: var(--color-info-text); }
    .badge-success { background: var(--color-success-bg); color: var(--color-success-text); }
    .badge-warn { background: var(--color-warn-bg); color: var(--color-warn-text); }
    .meta-details {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8125rem;
      color: var(--color-muted);
      margin-bottom: 1.5rem;
    }
    .meta-item { display: flex; gap: 0.25rem; }
    .meta-item strong { color: var(--color-text); }
    .student-view-box {
      border: 2px dashed #cbd5e1;
      border-radius: 0.75rem;
      padding: 1.5rem;
      background: #fafafa;
      margin-bottom: 1.5rem;
    }
    .student-view-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }
    .audit-box {
      background: #f8fafc;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1rem;
      font-size: 0.875rem;
    }
    .audit-title { font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem; }
    .explanation-box {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 0.375rem;
    }
    .checklist-table {
      width: 100%;
      margin-top: 1rem;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    .checklist-table th, .checklist-table td {
      border: 1px solid var(--color-border);
      padding: 0.5rem 0.75rem;
      text-align: left;
    }
    .checklist-table th { background: var(--color-tag-bg); }
    code { font-family: monospace; background: #e2e8f0; padding: 0.1rem 0.3rem; border-radius: 0.25rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(htmlTitle)}</h1>
      <p class="lead">
        Mandatory Human Review Gate. Material production presentation re-rendered via deterministic visual pipeline.
        Review all criteria before approving in the accompanying CSV sheet.
      </p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Questions</div>
          <div class="stat-value">${reviewItems.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Machine-Verifiable (Current)</div>
          <div class="stat-value">${machineVerifiableCount}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Editorial Review Required</div>
          <div class="stat-value">${editorialReviewCount}</div>
        </div>
      </div>

      <div class="instructions">
        <strong>Review Instructions:</strong>
        <ol style="margin-left: 1.5rem; margin-top: 0.5rem;">
          <li>Review each question against the three criteria: <strong>Correctness</strong>, <strong>Originality</strong>, and <strong>Age-appropriateness</strong>.</li>
          <li>In the companion CSV (<code>${escapeHtml(path.basename(finalCsvPath))}</code>), record your decision (<code>approve</code>, <code>reject</code>, or <code>revise</code>).</li>
          <li>For an approval, all three checks must be marked <code>yes</code>. Blank decision means not reviewed.</li>
          <li>${options.candidateIds?.length
            ? `Publish these staged candidates using <code>npm run questions:publish -- --candidate-ids ${escapeHtml(options.candidateIds.join(","))} --sheet &lt;path&gt; --reviewer "&lt;Your Full Name&gt;"</code>.`
            : `Record historical approvals using <code>npm run content:record-approvals -- --sheet &lt;path&gt; --reviewer "&lt;Your Full Name&gt;"</code>.`}</li>
        </ol>
      </div>
    </header>

    <main>
      ${reviewItems
        .map(
          (item, idx) => `
      <article class="question-card" id="q-${escapeHtml(item.question.id)}">
        <div class="question-header">
          <div class="question-id">#${idx + 1}: ${escapeHtml(item.question.id)}</div>
          <div>
            <span class="badge ${item.isMachineVerifiable ? "badge-success" : "badge-warn"}">
              ${item.isMachineVerifiable ? "Machine-Verifiable Answer" : "Editorial Review Required"}
            </span>
            <span class="badge badge-info">${escapeHtml(item.question.examStyle.replace("_style", ""))}</span>
          </div>
        </div>

        <div class="meta-details">
          <div class="meta-item"><span>Programme:</span> <strong>${escapeHtml(formatProgrammeTitle(item.programmeId))}</strong></div>
          <div class="meta-item"><span>Year:</span> <strong>Year ${item.question.yearLevel}</strong></div>
          <div class="meta-item"><span>Subject:</span> <strong>${escapeHtml(item.question.metadata.subject)}</strong></div>
          <div class="meta-item"><span>Skill:</span> <strong>${escapeHtml(item.question.metadata.skill ?? "Unspecified")}</strong></div>
          <div class="meta-item"><span>Revision:</span> <strong>r${item.revision}</strong></div>
          <div class="meta-item"><span>Content Hash:</span> <code>${escapeHtml(item.contentHash.slice(0, 12))}...</code></div>
          ${
            item.sourceManifestHash
              ? `<div class="meta-item"><span>Manifest:</span> <code>${escapeHtml(item.sourceManifestHash.slice(0, 12))}...</code></div>`
              : ""
          }
        </div>

        <div class="student-view-box">
          <div class="student-view-label">Student Presentation (Production Renderer)</div>
          ${item.questionHtml}
        </div>

        <div class="audit-box">
          <div class="audit-title">Authoring & Verification Evidence</div>
          <div>${renderAnswerKeySummary(item.question)}</div>

          ${
            item.question.explanation
              ? `
          <div class="explanation-box">
            <strong>Authoring Explanation / Worked Solution:</strong>
            <p style="margin-top: 0.25rem;">${escapeHtml(item.question.explanation)}</p>
          </div>`
              : ""
          }

          ${
            item.verificationNotes.length > 0
              ? `
          <div style="margin-top: 0.5rem; font-size: 0.8125rem; color: #92400e;">
            <strong>Verification notes:</strong>
            <ul style="margin-left: 1.25rem;">
              ${item.verificationNotes.map((n) => `<li>${escapeHtml(n)}</li>`).join("")}
            </ul>
          </div>`
              : ""
          }

          <table class="checklist-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Standard</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Correctness</strong></td>
                <td>Answer key is unequivocally right; worked solution mathematically/linguistically sound.</td>
                <td>${item.isMachineVerifiable ? "Verified by independent calculation" : "Requires human semantic verification"}</td>
              </tr>
              <tr>
                <td><strong>Originality</strong></td>
                <td>Strictly original. No reproduction of past NAPLAN/ICAS or commercial items.</td>
                <td>Requires human reviewer sign-off</td>
              </tr>
              <tr>
                <td><strong>Age-Appropriateness</strong></td>
                <td>Vocabulary, syntax, and cognitive load suited for Australian Year ${item.question.yearLevel} students.</td>
                <td>Requires human reviewer sign-off</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
      `,
        )
        .join("\n")}
    </main>
  </div>
</body>
</html>`;

  const htmlFileName = `${sheetId}.html`;
  const finalHtmlPath = options.htmlPath ?? path.join(options.outDir, htmlFileName);
  try {
    await writeFile(finalHtmlPath, htmlContent, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    await unlink(finalCsvPath);
    throw error;
  }

  console.log(`Generated review sheet for ${reviewItems.length} question(s):`);
  console.log(`  HTML: ${finalHtmlPath}`);
  console.log(`  CSV:  ${finalCsvPath}`);
  console.log(`  Machine-verifiable (dynamic): ${machineVerifiableCount}`);
  console.log(`  Editorial review required:    ${editorialReviewCount}`);
}

main().catch((err) => {
  console.error("Failed to generate review sheet:", err);
  process.exitCode = 1;
});
