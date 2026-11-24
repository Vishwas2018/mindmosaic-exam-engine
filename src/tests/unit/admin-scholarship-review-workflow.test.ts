// @vitest-environment node
import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  getUser: vi.fn(),
  profileSingle: vi.fn(),
  legacyOrder: vi.fn(),
  extendedOrder: vi.fn(),
  legacyInsert: vi.fn(),
  extendedInsert: vi.fn(),
}));

vi.mock("@/features/auth/require-role", () => ({ requireRole: mocks.role }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile) };
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: mocks.getUser,
    },
    from: (table: string) => {
      if (table === "profiles") {
        return {
          select: () => ({
            eq: () => ({
              single: mocks.profileSingle,
            }),
          }),
        };
      }
      if (table === "admin_draft_review_decisions") {
        return {
          select: () => ({ order: mocks.extendedOrder }),
          insert: mocks.extendedInsert,
        };
      }
      return {
        select: () => ({ order: mocks.legacyOrder }),
        insert: mocks.legacyInsert,
      };
    },
  }),
}));

import { recordReviewDecision } from "@/app/admin/review/actions";
import {
  classifyReviewPool,
  isDesignatedMockCandidate,
  validateHumanReviewerName,
} from "@/features/admin-review/pool-classification";
import {
  buildGovernedExportCsv,
  scholarshipWritingItemToTask,
} from "@/features/admin-review/writing-adapter";
import { canonicalWritingPromptHash } from "@/features/content-governance/publication-integrity";
import {
  computeReviewEvidenceFingerprint,
  loadAdminReviewCatalogue,
} from "@/server/admin-review";
import {
  assertNonProductionDatabaseUrl,
  loadSourceTruthMap,
  verifyAndPartitionExportRows,
  type DbDecisionRow,
} from "../../../scripts/export-admin-review-approvals.mjs";

const ADMIN_UUID = "11111111-1111-4111-8111-111111111111";

const ALL_CHECKS = {
  correctness: true,
  originality: true,
  ageAppropriateness: true,
  editorialInterpretation: true,
  difficultyCalibrated: true,
};

describe("MindMosaic Admin Portal Scholarship 500 review workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role.mockResolvedValue({ configured: true, userId: ADMIN_UUID });
    mocks.getUser.mockResolvedValue({
      data: { user: { id: ADMIN_UUID, email: "vishwas@mindmosaic.dev" } },
      error: null,
    });
    mocks.profileSingle.mockResolvedValue({
      data: { display_name: "Vishwas Joshi" },
      error: null,
    });
    mocks.legacyOrder.mockResolvedValue({ data: [], error: null });
    mocks.extendedOrder.mockResolvedValue({ data: [], error: null });
    mocks.extendedInsert.mockImplementation((payload: Record<string, unknown>) => ({
      select: () => ({
        single: async () => ({
          data: {
            id: "22222222-2222-4222-8222-222222222222",
            decided_at: "2026-11-24T11:00:00.000Z",
            reviewer_id: payload.reviewer_id,
            reviewer_name: payload.reviewer_name,
            reviewer_email: payload.reviewer_email,
            evidence_fingerprint: payload.evidence_fingerprint,
          },
          error: null,
        }),
      }),
    }));
  });

  it("loads all 500 Codex provisional canonical items (480 expansion + 20 pilot) with zero duplicate IDs and strict practice/mock split", async () => {
    const catalogue = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });

    expect(catalogue.activeBankId).toBe("vihaan-scholarship-500");
    expect(catalogue.issues).toEqual([]);
    expect(catalogue.entries).toHaveLength(500);
    expect(catalogue.extendedDecisionsAvailable).toBe(true);
    expect(catalogue.reviewer).toEqual({
      userId: ADMIN_UUID,
      email: "vishwas@mindmosaic.dev",
      displayName: "Vishwas Joshi",
    });

    const ids = new Set(catalogue.entries.map((entry) => entry.question.id));
    expect(ids.size).toBe(500);

    const pilotItems = catalogue.entries.filter((entry) =>
      entry.question.id.startsWith("vihaan-p01-"),
    );
    const expansionItems = catalogue.entries.filter((entry) =>
      entry.question.id.startsWith("vihaan-e500-"),
    );
    expect(pilotItems).toHaveLength(20);
    expect(expansionItems).toHaveLength(480);

    const writingItems = catalogue.entries.filter(
      (entry) => entry.itemKind === "writing_prompt",
    );
    expect(writingItems).toHaveLength(40);
    for (const item of writingItems) {
      expect(item.writingTask).toBeDefined();
      expect(item.publishedContentHash).toBe(
        canonicalWritingPromptHash(item.writingTask!),
      );
      expect(item.candidateHash).toBeUndefined();
    }

    const mockItems = catalogue.entries.filter((entry) => entry.designatedForMock);
    const mockA = mockItems.filter((entry) => entry.mockPaper === "mock-a");
    const mockB = mockItems.filter((entry) => entry.mockPaper === "mock-b");
    const practiceItems = catalogue.entries.filter(
      (entry) => !entry.designatedForMock,
    );
    expect(mockItems).toHaveLength(100);
    expect(mockA).toHaveLength(50);
    expect(mockB).toHaveLength(50);
    expect(practiceItems).toHaveLength(400);
    // Pilot items are never reserved for mock papers.
    expect(pilotItems.every((entry) => !entry.designatedForMock)).toBe(true);
  });

  it("withholds a modified Codex batch fail-closed when its hash drifts from quality-coverage-report.json", async () => {
    const original = vi.mocked(readFile).getMockImplementation()!;
    vi.mocked(readFile).mockImplementation(async (filePath, encoding) => {
      const content = await original(filePath, encoding as BufferEncoding);
      if (String(filePath).endsWith("batch-02.draft.json")) {
        const parsed = JSON.parse(String(content));
        parsed.items[0].question.prompt += " Tampered after report.";
        return JSON.stringify(parsed);
      }
      return content;
    });

    const catalogue = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    expect(catalogue.entries).toHaveLength(450);
    expect(
      catalogue.issues.some(
        (issue) =>
          issue.includes("batch-02.draft.json") && issue.includes("batch withheld"),
      ),
    ).toBe(true);
  });

  it("rejects AI, bot, service and single-word reviewer names and accepts accountable human full names", () => {
    for (const invalid of [
      "",
      "Admin",
      "Claude Sonnet",
      "Anthropic Reviewer",
      "OpenAI Codex",
      "GPT 5",
      "Gemini Pro",
      "AI Reviewer",
      "Automated Bot",
      "Antigravity Agent",
      "System Service",
    ]) {
      expect(validateHumanReviewerName(invalid).ok, invalid).toBe(false);
    }

    for (const valid of [
      "Vishwas Joshi",
      "Dr. Priya Nair",
      "Mary-Jane O'Connor",
    ]) {
      expect(validateHumanReviewerName(valid).ok, valid).toBe(true);
    }
  });

  it("refuses unauthorised callers, AI reviewer names, incomplete checks, missing rationale and stale hashes in recordReviewDecision", async () => {
    const catalogue = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    const entry = catalogue.entries[0]!;

    // 1. Unauthorised / non-admin caller denied by requireRole.
    mocks.role.mockRejectedValueOnce(new Error("role gate denied"));
    await expect(
      recordReviewDecision({
        bankId: "vihaan-scholarship-500",
        questionId: entry.question.id,
        contentHash: entry.contentHash,
        publishedContentHash: entry.publishedContentHash,
        decision: "approve",
        checks: ALL_CHECKS,
        blindSolved: true,
        notes: "",
        reviewerName: "Vishwas Joshi",
      }),
    ).rejects.toThrow("role gate denied");

    // 2. AI reviewer name refused.
    const aiRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: entry.question.id,
      contentHash: entry.contentHash,
      publishedContentHash: entry.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "",
      reviewerName: "Claude Sonnet",
    });
    expect(aiRes.error).toMatch(/AI, automated tools/i);

    // 3. Incomplete checks refused for approve.
    const checkRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: entry.question.id,
      contentHash: entry.contentHash,
      publishedContentHash: entry.publishedContentHash,
      decision: "approve",
      checks: { ...ALL_CHECKS, editorialInterpretation: false },
      blindSolved: true,
      notes: "",
      reviewerName: "Vishwas Joshi",
    });
    expect(checkRes.error).toMatch(/all five governance checks/i);

    // 4. Revise/reject without >= 10 chars notes refused.
    const reviseRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: entry.question.id,
      contentHash: entry.contentHash,
      publishedContentHash: entry.publishedContentHash,
      decision: "revise",
      checks: ALL_CHECKS,
      blindSolved: false,
      notes: "too short",
      reviewerName: "Vishwas Joshi",
    });
    expect(reviseRes.error).toMatch(/at least 10 characters/i);

    // 5. Stale D1 or D3 hash refused.
    const staleRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: entry.question.id,
      contentHash: "0".repeat(64),
      publishedContentHash: entry.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "",
      reviewerName: "Vishwas Joshi",
    });
    expect(staleRes.error).toMatch(/revision has changed/i);

    // 6. Impersonating another reviewer by changing display name input is refused
    // when the authenticated admin profile already holds a valid human full name.
    const spoofRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: entry.question.id,
      contentHash: entry.contentHash,
      publishedContentHash: entry.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "",
      reviewerName: "Jane Doe",
    });
    expect(spoofRes.error).toMatch(/must match your authenticated admin profile/i);

    // 7. Known defective question vihaan-e500-m069 cannot be approved at its defective revision.
    const defective = catalogue.entries.find(
      (item) => item.question.id === "vihaan-e500-m069",
    )!;
    expect(defective.approvalBlocked?.defectId).toBe("A-06");
    const defectApproveRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: defective.question.id,
      contentHash: defective.contentHash,
      publishedContentHash: defective.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "",
      reviewerName: "Vishwas Joshi",
    });
    expect(defectApproveRes.error).toMatch(/Defect A-06/i);

    expect(mocks.extendedInsert).not.toHaveBeenCalled();

    // Recording Request revision against defective vihaan-e500-m069 IS allowed.
    const defectReviseRes = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: defective.question.id,
      contentHash: defective.contentHash,
      publishedContentHash: defective.publishedContentHash,
      decision: "revise",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "Defect A-06: squares between 60 and 90 are 64 and 81; neither digit sum is 13.",
      reviewerName: "Vishwas Joshi",
    });
    expect(defectReviseRes.error).toBeUndefined();
    expect(defectReviseRes.decision?.decision).toBe("revise");
  });

  it("records verified human approval, revision request and rejection with verifiable evidence fingerprint and detects stale revisions", async () => {
    const catalogue = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    const mcq = catalogue.entries.find(
      (entry) => entry.itemKind === "question" && !entry.designatedForMock,
    )!;
    const writing = catalogue.entries.find(
      (entry) => entry.itemKind === "writing_prompt" && !entry.designatedForMock,
    )!;

    const okMcq = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: mcq.question.id,
      contentHash: mcq.contentHash,
      publishedContentHash: mcq.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "Blind solved and verified distractor uniqueness.",
      reviewerName: "Vishwas Joshi",
    });
    expect(okMcq.error).toBeUndefined();
    expect(okMcq.decision?.approvedBy).toBe(ADMIN_UUID);
    expect(okMcq.decision?.reviewerName).toBe("Vishwas Joshi");
    expect(okMcq.decision?.reviewerEmail).toBe("vishwas@mindmosaic.dev");
    expect(okMcq.decision?.blindSolved).toBe(true);
    expect(okMcq.decision?.evidenceFingerprint).toMatch(/^[a-f0-9]{64}$/);

    const okWriting = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: writing.question.id,
      contentHash: writing.contentHash,
      publishedContentHash: writing.publishedContentHash,
      decision: "approve",
      checks: ALL_CHECKS,
      blindSolved: false,
      notes: "Fits Year 6 15-minute persuasive rubric.",
      reviewerName: "Vishwas Joshi",
    });
    expect(okWriting.error).toBeUndefined();
    expect(okWriting.decision?.publishedContentHash).toBe(
      scholarshipWritingItemToTask({
        id: writing.question.id,
        yearLevel: writing.question.yearLevel,
        prompt: writing.question.prompt,
        metadata: writing.question.metadata,
      }).contentHash,
    );

    const okRevise = await recordReviewDecision({
      bankId: "vihaan-scholarship-500",
      questionId: mcq.question.id,
      contentHash: mcq.contentHash,
      publishedContentHash: mcq.publishedContentHash,
      decision: "revise",
      checks: ALL_CHECKS,
      blindSolved: true,
      notes: "Clarify unit wording in option C before publication.",
      reviewerName: "Vishwas Joshi",
    });
    expect(okRevise.error).toBeUndefined();
    expect(okRevise.decision?.decision).toBe("revise");

    // Stale revision in DB must NOT count as current approval.
    mocks.extendedOrder.mockResolvedValueOnce({
      data: [
        {
          id: "33333333-3333-4333-8333-333333333333",
          bank_id: "vihaan-scholarship-500",
          batch_id: mcq.batchId,
          question_id: mcq.question.id,
          content_hash: "f".repeat(64),
          published_content_hash: mcq.publishedContentHash,
          source_revision: mcq.sourceRevision,
          revision_number: 1,
          decision: "approve",
          checks: ALL_CHECKS,
          blind_solved: true,
          notes: "Approved old draft",
          reviewer_id: ADMIN_UUID,
          reviewer_name: "Vishwas Joshi",
          reviewer_email: "vishwas@mindmosaic.dev",
          evidence_fingerprint: "e".repeat(64),
          decided_at: "2026-11-24T10:00:00.000Z",
        },
      ],
      error: null,
    });
    const reloaded = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    const reloadedMcq = reloaded.entries.find(
      (entry) => entry.question.id === mcq.question.id,
    )!;
    expect(reloadedMcq.latestDecision).toBeUndefined();
    expect(reloadedMcq.approval).toBeUndefined();
    expect(reloadedMcq.decisionHistory).toHaveLength(1);
    expect(reloadedMcq.decisionHistory![0]!.matchesCurrentRevision).toBe(false);
  });

  it("enforces strict practice vs mock pool separation and tamper-evident verification in the export bridge", async () => {
    expect(() =>
      assertNonProductionDatabaseUrl(
        "postgresql://postgres:x@db.uermhsptduikehuyceiz.supabase.co:5432/postgres",
      ),
    ).toThrow(/production Supabase ref/i);

    const truthMap = await loadSourceTruthMap("vihaan-scholarship-500");
    expect(truthMap.size).toBe(500);

    const practiceTruth = truthMap.get("vihaan-e500-m001")!;
    const mockTruth = truthMap.get("vihaan-e500-m091")!;
    const writingTruth = truthMap.get("vihaan-e500-w001")!;
    expect(isDesignatedMockCandidate(practiceTruth.questionId)).toBe(false);
    expect(isDesignatedMockCandidate(mockTruth.questionId)).toBe(true);
    expect(
      classifyReviewPool(mockTruth.questionId, { publicRepoExposed: false }).pool,
    ).toBe("unseen_mock");

    const buildRow = (truth: typeof practiceTruth): DbDecisionRow => {
      const base = {
        bankId: truth.bankId,
        batchId: truth.batchId,
        questionId: truth.questionId,
        itemKind: truth.itemKind,
        pool: truth.pool,
        sourceRevision: "vihaan-scholarship-500@v1",
        revisionNumber: truth.revisionNumber,
        contentHash: truth.contentHash,
        candidateHash: truth.candidateHash,
        publishedContentHash: truth.publishedContentHash,
        decision: "approve" as const,
        checks: ALL_CHECKS,
        blindSolved: true,
        notes: "Verified human review",
        reviewerId: ADMIN_UUID,
        reviewerName: "Vishwas Joshi",
        reviewerEmail: "vishwas@mindmosaic.dev",
      };
      return {
        bank_id: base.bankId,
        batch_id: base.batchId,
        question_id: base.questionId,
        item_kind: base.itemKind,
        pool: base.pool,
        source_revision: base.sourceRevision,
        revision_number: base.revisionNumber,
        content_hash: base.contentHash,
        candidate_hash: base.candidateHash,
        published_content_hash: base.publishedContentHash,
        decision: base.decision,
        checks: base.checks,
        blind_solved: base.blindSolved,
        notes: base.notes,
        reviewer_id: base.reviewerId,
        reviewer_name: base.reviewerName,
        reviewer_email: base.reviewerEmail,
        evidence_fingerprint: computeReviewEvidenceFingerprint(base),
        decided_at: "2026-11-24T11:00:00.000Z",
      };
    };

    const allRows = [
      buildRow(practiceTruth),
      buildRow(mockTruth),
      buildRow(writingTruth),
    ];

    const practiceExport = verifyAndPartitionExportRows(
      allRows,
      truthMap,
      "practice",
    );
    expect(practiceExport.rejectedReasons).toEqual([]);
    expect(practiceExport.questionCount).toBe(1);
    expect(practiceExport.writingCount).toBe(1);
    expect(practiceExport.skippedOtherPool).toBe(1);
    expect(practiceExport.questionCsv).toContain("vihaan-e500-m001");
    expect(practiceExport.questionCsv).not.toContain("vihaan-e500-m091");
    expect(practiceExport.writingCsv).toContain("vihaan-e500-w001");

    const mockExport = verifyAndPartitionExportRows(allRows, truthMap, "mock");
    expect(mockExport.rejectedReasons).toEqual([]);
    expect(mockExport.questionCount).toBe(1);
    expect(mockExport.writingCount).toBe(0);
    expect(mockExport.questionCsv).toContain("vihaan-e500-m091");
    expect(mockExport.questionCsv).not.toContain("vihaan-e500-m001");

    // Tampered fingerprint fails closed.
    const tampered = verifyAndPartitionExportRows(
      [{ ...allRows[0]!, evidence_fingerprint: "0".repeat(64) }],
      truthMap,
      "practice",
    );
    expect(tampered.rejectedReasons[0]).toMatch(/evidence_fingerprint mismatch/i);

    // Known defective vihaan-e500-m069 fails closed in export CLI even with valid fingerprint.
    const defectTruth = truthMap.get("vihaan-e500-m069")!;
    const defectExport = verifyAndPartitionExportRows(
      [buildRow(defectTruth)],
      truthMap,
      "practice",
    );
    expect(defectExport.questionCount).toBe(0);
    expect(defectExport.rejectedReasons[0]).toMatch(/Defect A-06/i);

    // UI CSV helper also enforces strict practice/mock split.
    const catalogue = await loadAdminReviewCatalogue({
      bankId: "vihaan-scholarship-500",
    });
    const mockEntry = catalogue.entries.find(
      (entry) => entry.question.id === "vihaan-e500-m091",
    )!;
    mockEntry.latestDecision = {
      decision: "approve",
      approvedBy: ADMIN_UUID,
      reviewerName: "Vishwas Joshi",
      reviewerEmail: "vishwas@mindmosaic.dev",
      decidedAt: "2026-11-24T11:00:00.000Z",
      contentHash: mockEntry.contentHash,
      publishedContentHash: mockEntry.publishedContentHash,
      notes: "",
      blindSolved: true,
      checks: ALL_CHECKS,
      matchesCurrentRevision: true,
    };
    const uiPracticeCsv = buildGovernedExportCsv([mockEntry], {
      itemKind: "question",
      poolFilter: "practice",
    });
    expect(uiPracticeCsv.rowCount).toBe(0);
    expect(uiPracticeCsv.skippedMockCount).toBe(1);
  });
});
