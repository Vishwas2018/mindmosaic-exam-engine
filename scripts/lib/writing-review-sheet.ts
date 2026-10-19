import type { WritingPromptSubject } from "@/features/content-governance/approval-verification";
import { canonicalWritingPromptHash } from "@/features/content-governance/publication-integrity";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";
import { resolveWritingRubric } from "@/features/writing/task";

/** Same header as the question sheet, so `content:record-approvals` reads either. */
export const REVIEW_SHEET_HEADER =
  "questionId,contentHash,revision,sourceManifestHash,correctness,originality,ageAppropriateness,decision,notes";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeCsvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The CSV and HTML review sheet for writing prompts. The four leading columns
 * are filled; the reviewer's five start blank, exactly as for questions. The
 * hash is the canonical hash of the task a child would see, so a prompt that
 * changes after review is rejected as stale at record time.
 */
export function renderWritingReviewSheet(
  subjects: readonly WritingPromptSubject[],
  csvFileName: string,
): { readonly csv: string; readonly html: string } {
  const csvRows = [REVIEW_SHEET_HEADER];
  const cards = subjects.map(({ task, revision }, index) => {
    const contentHash = canonicalWritingPromptHash(task);
    csvRows.push(
      [escapeCsvCell(task.id), escapeCsvCell(contentHash), escapeCsvCell(revision), "", "", "", "", "", ""].join(","),
    );
    const rubric = resolveWritingRubric(task.rubricId) ?? scholarshipWrittenExpressionRubric;
    return `
    <article class="card" id="${escapeHtml(task.id)}">
      <h2>#${index + 1}: ${escapeHtml(task.id)}</h2>
      <p class="meta">${escapeHtml(task.form)} · Year ${task.yearLevel} · ${task.timeLimitMinutes} minutes ·
        r${revision} · hash <code>${escapeHtml(contentHash.slice(0, 12))}...</code></p>
      <h3>${escapeHtml(task.title)}</h3>
      <div class="prompt">${escapeHtml(task.prompt)}</div>
      ${task.suggestedWords ? `<p class="meta">Word guide shown to the child: ${task.suggestedWords.min} to ${task.suggestedWords.max}. Never a limit.</p>` : ""}
      <p class="meta">Marked by a parent against <strong>${escapeHtml(rubric.title)}</strong> (${rubric.criteria.length} criteria, scored by a person; no AI marking).</p>
    </article>`;
  });

  const html = `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Human Review Sheet — Writing prompts</title>
  <style>
    body { font-family: system-ui, "Segoe UI", sans-serif; margin: 0; padding: 2rem 1rem; line-height: 1.6; color: #1b1f2a; background: #f6f7fb; }
    .container { max-width: 800px; margin: 0 auto; }
    header, .card { background: #fff; border: 1px solid #d9dce6; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h1 { font-size: 1.5rem; margin: 0 0 .5rem; }
    h2 { font-size: 1.1rem; margin: 0 0 .25rem; overflow-wrap: anywhere; }
    h3 { font-size: 1rem; margin: .75rem 0 .25rem; }
    .meta { color: #555c70; font-size: .85rem; margin: .25rem 0; }
    .prompt { border: 2px dashed #c4c9d8; border-radius: 8px; padding: 1rem; background: #fafbff; white-space: pre-wrap; }
    table { border-collapse: collapse; width: 100%; font-size: .85rem; margin-top: .75rem; }
    th, td { border: 1px solid #d9dce6; padding: .4rem .6rem; text-align: left; }
    code { background: #eef0f6; padding: 0 .25rem; border-radius: 4px; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Human Review Sheet — Writing prompts</h1>
      <p class="meta">Mandatory human review gate. ${subjects.length} prompt(s). A writing prompt uses the same approval record, reviewer rules and verifier as a question; there is no answer to hide.</p>
      <ol>
        <li>Review each prompt against the three criteria below.</li>
        <li>In <code>${escapeHtml(csvFileName)}</code> record <code>approve</code>, <code>reject</code> or <code>revise</code>. An approval needs all three checks marked <code>yes</code>. A blank decision means not reviewed.</li>
        <li>Record with <code>npm run content:record-approvals -- --sheet &lt;path&gt; --reviewer "&lt;Your Full Name&gt;"</code>.</li>
      </ol>
      <table>
        <thead><tr><th>Criterion</th><th>Standard for a writing prompt</th></tr></thead>
        <tbody>
          <tr><td><strong>Correctness</strong></td><td>Clear and unambiguous, fits its form, and can be done in the time allowed.</td></tr>
          <tr><td><strong>Originality</strong></td><td>Strictly original. Not copied or paraphrased from any published, prep-book or past-test prompt.</td></tr>
          <tr><td><strong>Age-appropriateness</strong></td><td>Reading level and subject matter suit Australian Year 6 students.</td></tr>
        </tbody>
      </table>
    </header>
    ${cards.join("\n")}
  </div>
</body>
</html>`;

  return { csv: csvRows.join("\r\n") + "\r\n", html };
}
