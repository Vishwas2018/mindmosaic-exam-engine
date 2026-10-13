import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { questionBank } from "@/content/questions/question-bank";
import {
  parseApprovalCsv,
  recordApprovalsToDisk,
  validateApprovalBatch,
  type ApprovalInputRow,
  type WritingPromptSubject,
} from "@/features/content-governance/approval-verification";
import {
  approvalFingerprint,
  approvalRecordSchema,
  canonicalQuestionHash,
  canonicalWritingPromptHash,
  humanPublicationApprovalSchema,
  selectApprovedQuestions,
  selectApprovedWritingPrompts,
  validateHumanApproval,
  verifyApprovalRecord,
} from "@/features/content-governance/publication-integrity";
import { DEV_FIXTURE_WRITING_TASK, writingTaskSchema, type WritingTask } from "@/features/writing/task";
import { listWritingTasks, loadApprovedWritingPrompts, resolveWritingTask } from "@/server/writing/tasks";
import { createTestHumanApproval, createTestWritingApproval } from "@/tests/helpers/publication-approvals";

import { loadWritingDraftSubjects } from "../../../scripts/lib/writing-draft-tasks";
import { renderWritingReviewSheet } from "../../../scripts/lib/writing-review-sheet";

const prompt = (id: string, text = "Write about a door that was never opened before today. Say what was behind it and what happened next."): WritingTask =>
  writingTaskSchema.parse({
    id, title: "A door", form: "narrative", yearLevel: 6, prompt: text, timeLimitMinutes: 15,
    suggestedWords: { min: 150, max: 350 },
  });
const subject = (task: WritingTask, revision = 1): WritingPromptSubject => ({ task, revision });
const NAME = "Dr Eleanor Vance";
const AT = "2026-10-13T00:00:00.000Z";
const row = (task: WritingTask, changes: Partial<ApprovalInputRow> = {}): ApprovalInputRow => ({
  questionId: task.id, contentHash: canonicalWritingPromptHash(task), revision: 1, sourceManifestHash: null,
  correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve", ...changes,
});

describe("existing question approval records verify identically (the writing kind adds, never changes)", () => {
  const questions = questionBank.slice(0, 12);

  it("the shared verifier returns exactly what validateHumanApproval returns, for valid and for tampered records", () => {
    for (const question of questions) {
      const good = createTestHumanApproval({ question, approvedAt: AT });
      const subjectFor = (revision: number, sourceManifestHash: string | null) =>
        ({ kind: "question", question, revision, sourceManifestHash }) as const;
      const cases: [unknown, number, string | null][] = [
        [good, 1, null],
        [{ ...good, fingerprint: "0".repeat(64) }, 1, null],
        [{ ...good, approvedBy: "Someone Else" }, 1, null],
        [{ ...good, contentHash: "1".repeat(64) }, 1, null],
        [good, 2, null],
        [good, 1, "2".repeat(64)],
        [{ ...good, checks: { ...good.checks, originality: false } }, 1, null],
        [{ ...good, kind: "something_else" }, 1, null],
        [null, 1, null],
        ["not a record", 1, null],
      ];
      for (const [raw, revision, manifest] of cases) {
        expect(verifyApprovalRecord(raw, subjectFor(revision, manifest))).toEqual(
          validateHumanApproval(raw, question, revision, manifest),
        );
      }
    }
  });

  it("the question schema is unchanged and still parses to the same data inside the discriminated record", () => {
    for (const question of questions) {
      const good = createTestHumanApproval({ question, approvedAt: AT });
      const direct = humanPublicationApprovalSchema.parse(good);
      expect(approvalRecordSchema.parse(good)).toEqual(direct);
      expect(direct).toEqual(good);
    }
  });

  it("a recorded question approval has a pinned fingerprint (the record format did not move)", () => {
    const good = createTestHumanApproval({ question: questions[0]!, approvedAt: AT });
    const { fingerprint, ...facts } = good;
    expect(approvalFingerprint(facts)).toBe(fingerprint);
    expect(fingerprint).toBe(QUESTION_FINGERPRINT_GOLDEN);
  });

  it("question selection is unaffected: an approved question is served, a tampered one is not", () => {
    const [a, b] = questions as [typeof questions[number], typeof questions[number]];
    const report = selectApprovedQuestions([a, b], new Set(), [], [
      createTestHumanApproval({ question: a, approvedAt: AT }),
      { ...createTestHumanApproval({ question: b, approvedAt: AT }), fingerprint: "0".repeat(64) },
    ]);
    expect(report.questions.map((q) => q.id)).toEqual([a.id]);
    expect(report.excluded.find((e) => e.questionId === b.id)?.reason).toBe("approval_fingerprint_mismatch");
  });

  it("a question-only batch is validated and shaped as before, with empty writing results", async () => {
    const question = questions[0]!;
    const result = await validateApprovalBatch({
      rows: [{ questionId: question.id, contentHash: canonicalQuestionHash(question), revision: 1, sourceManifestHash: null,
        correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" }],
      reviewerFullName: NAME, questionBank: questions, existingApprovals: new Map(), approvedAt: AT,
    });
    expect(result.ok).toBe(true);
    expect(result.newApprovals).toHaveLength(1);
    expect(result.newApprovals[0]).toEqual(createTestHumanApproval({ question, approvedBy: NAME, approvedAt: AT }));
    expect(result.newWritingApprovals).toEqual([]);
    expect(result.alreadyRecordedWriting).toEqual([]);
  });
});

describe("the writing_prompt kind", () => {
  const task = prompt("w1-narrative-draft-901");

  it("verifies a record bound to the exact prompt, revision and reviewer facts", () => {
    const approval = createTestWritingApproval({ prompt: task, approvedAt: AT });
    const result = verifyApprovalRecord(approval, { kind: "writing_prompt", prompt: task, revision: 1 });
    expect(result).toEqual({ ok: true, approval });
  });

  it.each([
    ["a tampered fingerprint", (a: Record<string, unknown>) => ({ ...a, fingerprint: "0".repeat(64) }), "approval_fingerprint_mismatch"],
    ["a different reviewer, same fingerprint", (a: Record<string, unknown>) => ({ ...a, approvedBy: "Someone Else" }), "approval_fingerprint_mismatch"],
    ["a different prompt id", (a: Record<string, unknown>) => ({ ...a, promptId: "w1-narrative-draft-902" }), "approval_fingerprint_mismatch"],
    ["an unchecked criterion", (a: Record<string, unknown>) => ({ ...a, checks: { correctness: true, originality: false, ageAppropriateness: true } }), "missing_or_invalid_human_approval"],
    ["a source manifest hash (a prompt has none)", (a: Record<string, unknown>) => ({ ...a, sourceManifestHash: "3".repeat(64) }), "missing_or_invalid_human_approval"],
    ["an extra field", (a: Record<string, unknown>) => ({ ...a, extra: true }), "missing_or_invalid_human_approval"],
    ["a question kind", (a: Record<string, unknown>) => ({ ...a, kind: "human_publication_approval" }), "missing_or_invalid_human_approval"],
  ])("rejects %s", (_name, tamper, reason) => {
    const approval = createTestWritingApproval({ prompt: task, approvedAt: AT });
    expect(verifyApprovalRecord(tamper(approval as unknown as Record<string, unknown>), { kind: "writing_prompt", prompt: task, revision: 1 }))
      .toEqual({ ok: false, reason });
  });

  it("rejects a stale revision and a prompt that changed after review", () => {
    const approval = createTestWritingApproval({ prompt: task, approvedAt: AT });
    expect(verifyApprovalRecord(approval, { kind: "writing_prompt", prompt: task, revision: 2 }))
      .toEqual({ ok: false, reason: "approval_revision_mismatch" });
    const edited = prompt(task.id, "Write about a window that opened by itself overnight. Say what you saw and what you did.");
    expect(verifyApprovalRecord(approval, { kind: "writing_prompt", prompt: edited, revision: 1 }))
      .toEqual({ ok: false, reason: "approved_content_mismatch" });
  });

  it("the two kinds do not accept each other's records", () => {
    const question = questionBank[0]!;
    const questionRecord = createTestHumanApproval({ question, approvedAt: AT });
    const writingRecord = createTestWritingApproval({ prompt: task, approvedAt: AT });
    expect(verifyApprovalRecord(questionRecord, { kind: "writing_prompt", prompt: task, revision: 1 }).ok).toBe(false);
    expect(verifyApprovalRecord(writingRecord, { kind: "question", question, revision: 1, sourceManifestHash: null }).ok).toBe(false);
  });

  it("a record is bound by its snapshot: an approval whose embedded prompt was edited is rejected", () => {
    const approval = createTestWritingApproval({ prompt: task, approvedAt: AT });
    const edited = { ...approval, prompt: { ...approval.prompt, prompt: `${approval.prompt.prompt} Add a twist.` } };
    expect(verifyApprovalRecord(edited, { kind: "writing_prompt", prompt: task, revision: 1 }).ok).toBe(false);
  });
});

describe("serving writing prompts from approval records only", () => {
  const a = prompt("w1-narrative-draft-901");
  const b = prompt("w1-persuasive-draft-902", "Should every school have a garden? Write to convince your readers, with reasons and an example.");

  it("serves the verified snapshot and nothing else", () => {
    const report = selectApprovedWritingPrompts([
      createTestWritingApproval({ prompt: a, approvedAt: AT }),
      createTestWritingApproval({ prompt: b, approvedAt: AT }),
    ]);
    expect(report.problems).toEqual([]);
    expect(report.prompts).toEqual([a, b]);
  });

  it("fails closed per prompt: a bad, duplicated or unidentified record serves nothing for that prompt", () => {
    const good = createTestWritingApproval({ prompt: a, approvedAt: AT });
    const tampered = { ...createTestWritingApproval({ prompt: b, approvedAt: AT }), fingerprint: "0".repeat(64) };
    const report = selectApprovedWritingPrompts([good, tampered, { nothing: true }]);
    expect(report.prompts).toEqual([a]);
    expect(report.problems).toEqual(expect.arrayContaining([
      `${b.id}: approval_fingerprint_mismatch`,
      "writing approval evidence has no promptId",
    ]));
    const duplicated = selectApprovedWritingPrompts([good, createTestWritingApproval({ prompt: a, approvedAt: "2026-10-14T00:00:00.000Z" })]);
    expect(duplicated.prompts).toEqual([]);
    expect(duplicated.problems).toEqual([`${a.id}: duplicate_approval`]);
  });

  it("with no approvals nothing is served, and a draft id does not resolve", () => {
    expect(selectApprovedWritingPrompts([]).prompts).toEqual([]);
    const production = { NODE_ENV: "production" };
    expect(listWritingTasks(production, [])).toEqual([]);
    expect(resolveWritingTask("w6-narrative-draft-001", production, [])).toBeNull();
    expect(resolveWritingTask("w6-narrative-draft-001", { NODE_ENV: "development" }, [])).toBeNull();
  });

  it("serves an approved task by id, and the dev fixture only while the preview gate is open", () => {
    expect(resolveWritingTask(a.id, { NODE_ENV: "production" }, [a])).toEqual(a);
    expect(resolveWritingTask(DEV_FIXTURE_WRITING_TASK.id, { NODE_ENV: "production" }, [a])).toBeNull();
    expect(resolveWritingTask(DEV_FIXTURE_WRITING_TASK.id, { NODE_ENV: "development" }, [a])).toEqual(DEV_FIXTURE_WRITING_TASK);
    expect(resolveWritingTask(a.id, { NODE_ENV: "production", VERCEL_ENV: "production", WRITING_PREVIEW_ENABLED: "1" }, [a])).toEqual(a);
  });

  it("the loader reads the directory: missing is empty, valid is served, an unreadable or tampered file serves nothing", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mm-writing-load-"));
    try {
      const dir = path.join(root, "writing-prompts");
      expect(loadApprovedWritingPrompts(dir)).toMatchObject({ prompts: [], problems: [] });

      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${a.id}.json`), JSON.stringify(createTestWritingApproval({ prompt: a, approvedAt: AT })), "utf8");
      expect(loadApprovedWritingPrompts(dir).prompts).toEqual([a]);

      await writeFile(path.join(dir, `${b.id}.json`), "{ not json", "utf8");
      const broken = loadApprovedWritingPrompts(dir);
      expect(broken.prompts).toEqual([]);
      expect(broken.problems[0]).toContain("Unreadable");

      await writeFile(path.join(dir, `${b.id}.json`),
        JSON.stringify({ ...createTestWritingApproval({ prompt: b, approvedAt: AT }), approvedBy: "Someone Else" }), "utf8");
      expect(loadApprovedWritingPrompts(dir).prompts).toEqual([]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("the shared batch path records writing prompts", () => {
  const a = prompt("w1-narrative-draft-901");
  const b = prompt("w1-persuasive-draft-902", "Should every school have a garden? Write to convince your readers, with reasons and an example.");
  const base = { reviewerFullName: NAME, questionBank: questionBank.slice(0, 3), existingApprovals: new Map(), existingWritingApprovals: new Map(), approvedAt: AT };

  it("approves a prompt with the reviewer facts bound to its hash and revision", async () => {
    const result = await validateApprovalBatch({ ...base, rows: [row(a)], writingPrompts: [subject(a)] });
    expect(result.ok).toBe(true);
    expect(result.newApprovals).toEqual([]);
    expect(result.newWritingApprovals).toEqual([createTestWritingApproval({ prompt: a, approvedBy: NAME, approvedAt: AT })]);
  });

  it.each([
    ["blank checks", { correctness: "", originality: "", ageAppropriateness: "" }, "all three checks"],
    ["a stale hash", { contentHash: "0".repeat(64) }, "content hash"],
    ["a stale revision", { revision: 2 }, "revision"],
    ["a source manifest hash", { sourceManifestHash: "4".repeat(64) }, "source manifest hash"],
    ["a bad decision", { decision: "maybe" }, "Invalid decision"],
  ])("rejects %s and writes nothing", async (_name, changes, message) => {
    const result = await validateApprovalBatch({ ...base, rows: [row(a, changes as Partial<ApprovalInputRow>)], writingPrompts: [subject(a)] });
    expect(result.ok).toBe(false);
    expect(result.fatalErrors.join(" ")).toContain(message);
    expect(result.newWritingApprovals).toEqual([]);
  });

  it("needs the reviewer's full name, and rejects duplicates within one sheet", async () => {
    expect((await validateApprovalBatch({ ...base, reviewerFullName: "Vance", rows: [row(a)], writingPrompts: [subject(a)] })).ok).toBe(false);
    const dup = await validateApprovalBatch({ ...base, rows: [row(a), row(a, { decision: "reject" })], writingPrompts: [subject(a)] });
    expect(dup.ok).toBe(false);
    expect(dup.fatalErrors.join(" ")).toContain("Duplicate approval target");
  });

  it("reject, revise and blank rows record nothing", async () => {
    const result = await validateApprovalBatch({
      ...base, rows: [row(a, { decision: "reject" }), row(b, { decision: "revise" })], writingPrompts: [subject(a), subject(b)],
    });
    expect(result).toMatchObject({ ok: true, rejectedCount: 1, revisedCount: 1, newWritingApprovals: [] });
    const blank = await validateApprovalBatch({ ...base, rows: [row(a, { decision: "" })], writingPrompts: [subject(a)] });
    expect(blank).toMatchObject({ ok: true, unreviewedCount: 1, newWritingApprovals: [] });
  });

  it("is a no-op when the same approval is already recorded, and a conflict when its evidence differs", async () => {
    const existing = createTestWritingApproval({ prompt: a, approvedBy: "Earlier Reviewer", approvedAt: "2026-10-01T00:00:00.000Z" });
    const again = await validateApprovalBatch({ ...base, rows: [row(a)], writingPrompts: [subject(a)], existingWritingApprovals: new Map([[a.id, existing]]) });
    expect(again).toMatchObject({ ok: true, newWritingApprovals: [], alreadyRecordedWriting: [existing] });

    const stale = createTestWritingApproval({ prompt: prompt(a.id, "Write about a lighthouse that went dark one stormy night. Say why, and what the keeper did."), approvedAt: AT });
    const conflict = await validateApprovalBatch({ ...base, rows: [row(a)], writingPrompts: [subject(a)], existingWritingApprovals: new Map([[a.id, stale]]) });
    expect(conflict.ok).toBe(false);
    expect(conflict.fatalErrors.join(" ")).toContain("Conflicting existing approval");
  });

  it("rejects an id that is neither a question nor a prompt, and a prompt id that collides with a question id", async () => {
    const unknown = await validateApprovalBatch({ ...base, rows: [row(prompt("w1-narrative-draft-999"))], writingPrompts: [subject(a)] });
    expect(unknown.fatalErrors.join(" ")).toContain("unknown or unauthored");
    const collides = await validateApprovalBatch({
      ...base, questionBank: [{ ...base.questionBank[0]!, id: a.id }], rows: [row(a)], writingPrompts: [subject(a)],
    });
    expect(collides.ok).toBe(false);
    expect(collides.fatalErrors.join(" ")).toContain("collides with a question id");
  });

  it("handles a mixed sheet: questions and prompts in one batch, each recorded by its own kind", async () => {
    const question = base.questionBank[0]!;
    const result = await validateApprovalBatch({
      ...base,
      rows: [{ questionId: question.id, contentHash: canonicalQuestionHash(question), revision: 1, sourceManifestHash: null,
        correctness: "yes", originality: "yes", ageAppropriateness: "yes", decision: "approve" }, row(a)],
      writingPrompts: [subject(a)],
    });
    expect(result.ok).toBe(true);
    expect(result.newApprovals.map((x) => x.questionId)).toEqual([question.id]);
    expect(result.newWritingApprovals.map((x) => x.promptId)).toEqual([a.id]);
  });

  it("writes a prompt approval to its own folder, atomically, and refuses to overwrite", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mm-writing-record-"));
    try {
      const approval = createTestWritingApproval({ prompt: a, approvedAt: AT });
      expect(await recordApprovalsToDisk([approval], root)).toBe(1);
      expect(await readdir(root)).toEqual([`${a.id}.json`]);
      expect(JSON.parse(await readFile(path.join(root, `${a.id}.json`), "utf8"))).toEqual(approval);
      await expect(recordApprovalsToDisk([approval], root)).rejects.toThrow("already exists");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

describe("the ten draft prompts go through the shared review-sheet and record-approvals path", () => {
  const repository = process.cwd();
  const runner = path.join(repository, "node_modules/tsx/dist/cli.mjs");

  it("the review sheet carries all ten prompts with blank reviewer cells and parses as an approval sheet", async () => {
    const subjects = await loadWritingDraftSubjects();
    expect(subjects).toHaveLength(10);
    const { csv, html } = renderWritingReviewSheet(subjects, "sheet.csv");
    const lines = csv.trimEnd().split(/\r?\n/);
    expect(lines).toHaveLength(11);
    for (const line of lines.slice(1)) expect(line.split(",").slice(4)).toEqual(["", "", "", "", ""]);
    const rows = parseApprovalCsv(csv);
    expect(rows.map((r) => r.questionId)).toEqual(subjects.map((s) => s.task.id));
    expect(rows.map((r) => r.contentHash)).toEqual(subjects.map((s) => canonicalWritingPromptHash(s.task)));
    for (const { task } of subjects) expect(html).toContain(task.id);
    expect(html).not.toMatch(/approvedBy|provenance|authoredBy/);

    // Unreviewed rows validate and record nothing.
    const result = await validateApprovalBatch({
      rows, reviewerFullName: NAME, questionBank: [], existingApprovals: new Map(), existingWritingApprovals: new Map(), writingPrompts: subjects,
    });
    expect(result).toMatchObject({ ok: true, unreviewedCount: 10, newWritingApprovals: [] });
  });

  it("record-approvals records a reviewed sheet of the ten, verify accepts them, and an edited draft is caught (isolated copy, nothing recorded in the repository)", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "mm-writing-cli-"));
    try {
      await cp(path.join(repository, "content/writing-drafts"), path.join(root, "content/writing-drafts"), { recursive: true });
      await mkdir(path.join(root, "content/question-factory/published-manifests"), { recursive: true });
      await mkdir(path.join(root, "content/publication-approvals"), { recursive: true });
      const subjects = await loadWritingDraftSubjects(path.join(root, "content/writing-drafts"));
      const { csv } = renderWritingReviewSheet(subjects, "sheet.csv");
      const [header, ...lines] = csv.trimEnd().split(/\r?\n/);
      const reviewed = [header, ...lines.map((line) => `${line.split(",").slice(0, 4).join(",")},yes,yes,yes,approve,`)].join("\n");
      const sheet = path.join(root, "reviewed.csv");
      await writeFile(sheet, reviewed, "utf8");

      const run = (...args: string[]) => spawnSync(process.execPath, [runner, "--tsconfig", path.join(repository, "tsconfig.json"),
        path.join(repository, "scripts/content-approvals.mts"), ...args], { cwd: root, encoding: "utf8", timeout: 90_000 });

      const recorded = run("record-batch", "--sheet", sheet, "--reviewer", "Test-only Reviewer");
      expect(recorded.status, recorded.stdout + recorded.stderr).toBe(0);
      expect(recorded.stdout).toContain("New approvals recorded:       10");
      const written = await readdir(path.join(root, "content/publication-approvals/writing-prompts"));
      expect(written).toHaveLength(10);
      expect(await readdir(path.join(root, "content/publication-approvals"))).toEqual(["writing-prompts"]);

      const served = loadApprovedWritingPrompts(path.join(root, "content/publication-approvals/writing-prompts"));
      expect(served.problems).toEqual([]);
      expect(served.prompts.map((p) => p.id).sort()).toEqual(subjects.map((s) => s.task.id).sort());

      const again = run("record-batch", "--sheet", sheet, "--reviewer", "Test-only Reviewer");
      expect(again.status, again.stdout + again.stderr).toBe(0);
      expect(again.stdout).toContain("New approvals recorded:       0");
      expect(again.stdout).toContain("Already recorded (skipped):   10");

      const verified = run("verify");
      // This isolated root has no factory manifests, so the question half of verify reports its own
      // problems and exits 1; only the writing half is asserted here.
      expect(JSON.parse(verified.stdout).writingPrompts).toEqual({ drafts: 10, eligible: 10, awaitingApproval: 0, problems: [] });

      const draftFile = path.join(root, "content/writing-drafts/year6-written-expression-draft.json");
      const edited = (await readFile(draftFile, "utf8")).replace(subjects[0]!.task.title, `${subjects[0]!.task.title} (edited)`);
      await writeFile(draftFile, edited, "utf8");
      const stale = run("verify");
      expect(JSON.parse(stale.stdout).writingPrompts.problems).toEqual([`${subjects[0]!.task.id}: draft_changed_since_approval`]);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }, 240_000);
});

/** Computed on origin/dev before the writing_prompt kind existed (question 0, approvedAt fixed above). */
const QUESTION_FINGERPRINT_GOLDEN = "a3da7dad056c3f68c681dfaf555029dd39f29e91a7140162c1c47b2672f68019";
