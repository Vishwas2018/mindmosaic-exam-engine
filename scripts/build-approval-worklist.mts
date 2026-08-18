/**
 * Builds the approval triage worklist from the content-correctness review.
 *
 * Read-only. Joins the per-question review verdicts (scripts/out/review/*.json)
 * against the flattened served bank (scripts/out/published-flat.json) and the
 * factory manifests (content/question-factory/published-manifests/*.json) to
 * produce a single actionable worklist:
 *
 *   - approve: pass verdicts, split by whether they carry a factory manifest
 *     (bindable to a contentHash) or are manifest-less curated questions.
 *   - hold: fail/flag verdicts, bucketed by defect class so the content-fix
 *     work can be triaged (hard key/ambiguity errors vs alt-text/self-contained
 *     accessibility gaps vs grade-appropriateness flags).
 *
 * Emits scripts/out/approval-worklist.json and .md. Writes nothing under
 * content/ or src/content/. This does NOT approve anything — it is the input
 * to that decision, not the decision.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REVIEW_DIR = join(ROOT, "scripts/out/review");
const FLAT = join(ROOT, "scripts/out/published-flat.json");
const MANIFEST_DIR = join(ROOT, "content/question-factory/published-manifests");
const OUT_JSON = join(ROOT, "scripts/out/approval-worklist.json");
const OUT_MD = join(ROOT, "scripts/out/approval-worklist.md");

type Verdict = "pass" | "fail" | "flag";
interface Review {
  id: string;
  verdict: Verdict;
  failed_checks?: string[];
  note?: string;
  suggested_fix?: string;
}

/** Defect classes, ordered by how blocking they are to serve a child. */
function bucketOf(r: Review): string {
  const checks = new Set(r.failed_checks ?? []);
  if (r.verdict === "pass") return "pass";
  if (r.verdict === "flag") {
    if (checks.has("grade_appropriate")) return "flag:grade_appropriate";
    if (checks.has("unambiguous")) return "flag:ambiguous";
    return "flag:other";
  }
  // fail
  if (checks.has("answer_key_correct") || checks.has("unambiguous")) {
    return "fail:content_error"; // wrong key or unanswerable for everyone
  }
  if (checks.has("self_contained")) {
    return "fail:accessibility"; // visual answerable, alt-text equivalent incomplete
  }
  return "fail:other";
}

const flat: Array<{ id: string; subject: string; yearLevel: number }> = JSON.parse(
  readFileSync(FLAT, "utf8"),
);
const flatById = new Map(flat.map((q) => [q.id, q]));

const manifestByQuestionId = new Map<string, { contentHash: string; revision: number }>();
for (const f of readdirSync(MANIFEST_DIR).filter((n) => n.endsWith(".json"))) {
  const m = JSON.parse(readFileSync(join(MANIFEST_DIR, f), "utf8"));
  if (m.questionId) {
    manifestByQuestionId.set(m.questionId, { contentHash: m.contentHash, revision: m.revision });
  }
}

const reviews: Review[] = readdirSync(REVIEW_DIR)
  .filter((n) => n.endsWith(".json"))
  .map((n) => JSON.parse(readFileSync(join(REVIEW_DIR, n), "utf8")));

const approve: unknown[] = [];
const hold: unknown[] = [];
const bucketCounts: Record<string, number> = {};

for (const r of reviews) {
  const q = flatById.get(r.id);
  const manifest = manifestByQuestionId.get(r.id) ?? null;
  const row = {
    id: r.id,
    subject: q?.subject ?? "unknown",
    yearLevel: q?.yearLevel ?? null,
    verdict: r.verdict,
    bucket: bucketOf(r),
    hasManifest: manifest !== null,
    contentHash: manifest?.contentHash ?? null, // null => curated, manifest-less
    revision: manifest?.revision ?? null,
    failed_checks: r.failed_checks ?? [],
    note: r.note ?? "",
    suggested_fix: r.suggested_fix ?? "",
  };
  if (r.verdict === "pass") {
    approve.push(row);
  } else {
    bucketCounts[row.bucket] = (bucketCounts[row.bucket] ?? 0) + 1;
    hold.push(row);
  }
}

const approveWithManifest = approve.filter((r) => (r as { hasManifest: boolean }).hasManifest).length;
const summary = {
  generatedAt: new Date().toISOString(),
  totals: {
    reviewed: reviews.length,
    approve: approve.length,
    approveWithManifest,
    approveCuratedNoManifest: approve.length - approveWithManifest,
    hold: hold.length,
  },
  holdBuckets: bucketCounts,
};

writeFileSync(OUT_JSON, JSON.stringify({ summary, approve, hold }, null, 2));

// Human-readable worklist — hold items only, since those are what needs doing.
const lines: string[] = [];
lines.push("# Approval worklist", "");
lines.push(`Generated ${summary.generatedAt}`, "");
lines.push(
  `Approve: **${summary.totals.approve}** ` +
    `(${summary.totals.approveWithManifest} with manifest, ` +
    `${summary.totals.approveCuratedNoManifest} curated/manifest-less) · ` +
    `Hold: **${summary.totals.hold}**`,
  "",
);
lines.push("## Hold buckets", "");
for (const [b, n] of Object.entries(bucketCounts).sort()) lines.push(`- \`${b}\`: ${n}`);
lines.push("", "## Hold items", "");
const order = ["fail:content_error", "fail:accessibility", "fail:other", "flag:ambiguous", "flag:grade_appropriate", "flag:other"];
for (const bucket of order) {
  const items = (hold as Array<Record<string, unknown>>).filter((r) => r.bucket === bucket);
  if (items.length === 0) continue;
  lines.push(`### ${bucket} (${items.length})`, "");
  for (const r of items) {
    lines.push(`- **${r.id}** (${r.subject}, Y${r.yearLevel}) — ${r.note}`);
    if (r.suggested_fix) lines.push(`  - fix: ${r.suggested_fix}`);
  }
  lines.push("");
}
writeFileSync(OUT_MD, lines.join("\n"));

console.log(JSON.stringify(summary, null, 2));
