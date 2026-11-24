import { readFileSync } from "node:fs";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const mocks = vi.hoisted(() => ({
  approveDraft: vi.fn(),
  recordReviewDecision: vi.fn(),
}));
vi.mock("@/app/admin/review/actions", () => ({
  approveDraft: mocks.approveDraft,
  recordReviewDecision: mocks.recordReviewDecision,
}));

import { DraftReview } from "@/features/admin-review/DraftReview";
import {
  reviewQuestionSchema,
  type ReviewCatalogue,
  type ReviewEntry,
} from "@/features/admin-review/contracts";
import { classifyReviewPool } from "@/features/admin-review/pool-classification";
import { scholarshipWritingItemToTask } from "@/features/admin-review/writing-adapter";

function buildVihaanTestCatalogue(): ReviewCatalogue {
  const batch1 = JSON.parse(
    readFileSync(
      "content/vihaan-scholarship/expansion-500/batch-01.draft.json",
      "utf8",
    ),
  );
  const batch10 = JSON.parse(
    readFileSync(
      "content/vihaan-scholarship/expansion-500/batch-10.draft.json",
      "utf8",
    ),
  );

  const mcqRaw = batch1.items.find(
    (it: { question: { type: string } }) => it.question.type === "multiple_choice",
  );
  const writingRaw = batch1.items.find(
    (it: { question: { type: string } }) => it.question.type === "essay",
  );
  const mockRaw = batch10.items.find(
    (it: { question: { id: string } }) => it.question.id === "vihaan-e500-m114",
  );

  const makeEntry = (
    wrapper: typeof mcqRaw,
    batchId: string,
    hashChar: string,
  ): ReviewEntry => {
    const q = reviewQuestionSchema.parse(wrapper.question);
    const isWriting = q.type === "essay" && q.metadata.subject === "writing";
    const pool = classifyReviewPool(q.id, { publicRepoExposed: true });
    const writingAdapted = isWriting
      ? scholarshipWritingItemToTask({
          id: q.id,
          yearLevel: q.yearLevel,
          prompt: q.prompt,
          metadata: q.metadata,
        })
      : undefined;
    return {
      kind: "scholarship",
      bankId: "vihaan-scholarship-500",
      batchId,
      itemKind: isWriting ? "writing_prompt" : "question",
      pool: pool.pool,
      designatedForMock: pool.designatedForMock,
      mockPaper: pool.mockPaper,
      mockPolicyNote: pool.policyNote,
      source: `content/vihaan-scholarship/expansion-500/${batchId}.draft.json`,
      contentHash: hashChar.repeat(64),
      publishedContentHash:
        writingAdapted?.contentHash ?? hashChar.repeat(64),
      revisionNumber: 1,
      sourceRevision: "vihaan-scholarship-500:test",
      workedSolution: wrapper.workedSolution,
      reviewFocus: wrapper.reviewFocus,
      arithmeticCheck: wrapper.arithmeticCheck,
      writingGuidance: wrapper.writingGuidance ?? undefined,
      writingTask: writingAdapted?.task,
      publicationStatus: "unpublished_draft",
      decisionHistory: [],
      question: q,
    };
  };

  return {
    activeBankId: "vihaan-scholarship-500",
    banks: [
      {
        id: "scholarship-y6-core",
        label: "Scholarship Year 6 Core (160)",
        shortLabel: "Y6 Core (160)",
        description: "Legacy 160",
        provisionalCanonical: false,
        totalItems: 160,
        practiceItems: 160,
        mockItems: 0,
        writingItems: 0,
        sourceRevision: "6b7d3339",
      },
      {
        id: "vihaan-scholarship-500",
        label: "Scholarship 500 — Codex Provisional Canonical (480 + 20 Pilot)",
        shortLabel: "Codex 500 (Provisional)",
        description: "Provisional canonical 500",
        provisionalCanonical: true,
        totalItems: 500,
        practiceItems: 400,
        mockItems: 100,
        writingItems: 40,
        sourceRevision: "vihaan-scholarship-500:test",
      },
    ],
    entries: [
      makeEntry(mcqRaw, "vihaan-expansion-01", "a"),
      makeEntry(writingRaw, "vihaan-expansion-01", "b"),
      makeEntry(mockRaw, "vihaan-expansion-10", "c"),
    ],
    issues: [],
    approvalsAvailable: true,
    extendedDecisionsAvailable: true,
    reviewer: {
      userId: "11111111-1111-4111-8111-111111111111",
      email: "vishwas@mindmosaic.dev",
      displayName: "Vishwas Joshi",
    },
  };
}

describe("Admin Portal Scholarship 500 DraftReview UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.recordReviewDecision.mockImplementation(
      async (input: Record<string, unknown>) => ({
        decision: {
          id: "dec-1",
          decision: input.decision,
          approvedBy: "11111111-1111-4111-8111-111111111111",
          reviewerName: input.reviewerName,
          reviewerEmail: "vishwas@mindmosaic.dev",
          decidedAt: "2026-11-24T11:30:00.000Z",
          contentHash: input.contentHash,
          publishedContentHash: input.publishedContentHash,
          notes: input.notes,
          blindSolved: input.blindSolved,
          checks: input.checks,
          evidenceFingerprint: "d".repeat(64),
          matchesCurrentRevision: true,
        },
      }),
    );
  });

  it("enforces blind-first solving, rejects AI reviewer names, and records human approval with blindSolved=true", async () => {
    const user = userEvent.setup();
    const catalogue = buildVihaanTestCatalogue();
    render(<DraftReview catalogue={catalogue} />);

    // Blind solve mode hides the declared answer and worked explanation initially.
    expect(screen.getByText("Blind solve mode")).toBeInTheDocument();
    expect(screen.queryByText("Declared answer")).not.toBeInTheDocument();

    // Solve blind by clicking the first option and submitting preview.
    await user.click(screen.getAllByRole("radio")[0]!);
    await user.click(
      screen.getByRole("button", { name: "Submit preview answer" }),
    );
    expect(screen.getByText("Declared answer")).toBeInTheDocument();
    expect(screen.getByText(/Completed before reveal/i)).toBeInTheDocument();

    // Check all 5 governance checkboxes.
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(5);
    for (const box of checkboxes) await user.click(box);

    // Reject AI reviewer name client-side.
    const nameInput = screen.getByLabelText(
      /Accountable human reviewer full name/i,
    );
    await user.clear(nameInput);
    await user.type(nameInput, "Claude Sonnet");
    expect(
      screen.getByText(/AI, automated tools and service identities/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Record my explicit approval" }),
    ).toBeDisabled();

    // Enter genuine human name and submit approval.
    await user.clear(nameInput);
    await user.type(nameInput, "Vishwas Joshi");
    const approveBtn = screen.getByRole("button", {
      name: "Record my explicit approval",
    });
    expect(approveBtn).toBeEnabled();
    await user.click(approveBtn);

    expect(mocks.recordReviewDecision).toHaveBeenCalledTimes(1);
    expect(mocks.recordReviewDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        bankId: "vihaan-scholarship-500",
        decision: "approve",
        blindSolved: true,
        reviewerName: "Vishwas Joshi",
      }),
    );
  });

  it("renders Written Expression prompts via the existing governed rubric and supports Request revision with mandatory notes", async () => {
    const user = userEvent.setup();
    render(<DraftReview catalogue={buildVihaanTestCatalogue()} />);

    // Filter to Written Expression.
    await user.selectOptions(screen.getByLabelText("Section"), "writing");
    expect(
      screen.getByText("Written Expression — Human Rubric Only"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/content\/publication-approvals\/writing-prompts\//i),
    ).toBeInTheDocument();

    // Switch decision to Request revision; button stays disabled until >= 10 chars entered.
    await user.click(screen.getByRole("button", { name: "Request revision" }));
    const submitBtn = screen.getByRole("button", {
      name: "Record revision request",
    });
    expect(submitBtn).toBeDisabled();

    await user.type(
      screen.getByLabelText(/Required rationale/i),
      "Tighten opening instruction for 15-minute pacing.",
    );
    expect(submitBtn).toBeEnabled();
    await user.click(submitBtn);

    expect(mocks.recordReviewDecision).toHaveBeenCalledWith(
      expect.objectContaining({
        decision: "revise",
        notes: "Tighten opening instruction for 15-minute pacing.",
      }),
    );
  });

  it("filters Practice vs Mock Reserve pools and displays Batch progress & export tab", async () => {
    const user = userEvent.setup();
    render(<DraftReview catalogue={buildVihaanTestCatalogue()} />);

    // Filter to Mock Paper B.
    await user.selectOptions(screen.getByLabelText("Pool"), "mock-b");
    expect(screen.getByRole("status")).toHaveTextContent(
      "1 drafts match your filters",
    );
    expect(screen.getByText("Mock Reserve (Paper B)")).toBeInTheDocument();

    // Switch to Batch progress & export mode.
    await user.click(
      screen.getByRole("button", { name: "Batch progress & export" }),
    );
    expect(
      screen.getByText(/Batch progress & publication readiness/i),
    ).toBeInTheDocument();
    expect(screen.getByText("vihaan-expansion-01")).toBeInTheDocument();
    expect(screen.getByText("vihaan-expansion-10")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Export Practice MCQ CSV/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Export Mock Reserve MCQ CSV/i }),
    ).toBeDisabled();
  });
});
