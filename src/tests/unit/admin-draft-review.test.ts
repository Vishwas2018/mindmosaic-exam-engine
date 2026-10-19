// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";

const mocks = vi.hoisted(() => ({
  role: vi.fn(),
  insert: vi.fn(),
  history: vi.fn(),
}));
vi.mock("@/features/auth/require-role", () => ({ requireRole: mocks.role }));
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, readFile: vi.fn(actual.readFile) };
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ order: mocks.history }),
      insert: mocks.insert,
    }),
  }),
}));

import {
  hashDraftRevision,
  loadAdminReviewCatalogue,
} from "@/server/admin-review";
import { approveDraft } from "@/app/admin/review/actions";
import { scholarshipReviewSchema } from "@/features/admin-review/contracts";
import { questionSchema } from "@/schemas/question.schema";
import { assertNoRuntimeDraftReference } from "../../../scripts/validate-scholarship-drafts.mjs";

describe("authenticated Scholarship draft review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.role.mockResolvedValue({ configured: true, userId: "human-admin" });
    mocks.history.mockResolvedValue({ data: [], error: null });
    mocks.insert.mockReturnValue({
      select: () => ({
        single: async () => ({
          data: {
            approved_by: "human-admin",
            approved_at: "2026-10-19T00:00:00Z",
          },
          error: null,
        }),
      }),
    });
  });

  it("keeps the runtime draft-reference boundary limited to the authenticated admin reader", async () => {
    await expect(assertNoRuntimeDraftReference("src")).resolves.toBeUndefined();
  });

  it("rejects a student route importing the private review reader", async () => {
    vi.mocked(readFile).mockResolvedValueOnce('import { loadAdminReviewCatalogue } from "@/server/admin-review";');
    await expect(assertNoRuntimeDraftReference("src/app/practice")).rejects.toThrow("outside its authenticated review area");
  });

  it("rejects a student route referencing unsigned draft files", async () => {
    vi.mocked(readFile).mockResolvedValueOnce('const directory = "content/scholarship-drafts";');
    await expect(assertNoRuntimeDraftReference("src/app/practice")).rejects.toThrow("Unsigned scholarship drafts");
  });

  it("loads all 160 questions, their shared passages and independent findings without widening student schemas", async () => {
    const catalogue = await loadAdminReviewCatalogue();
    expect(catalogue.issues).toEqual([]);
    expect(catalogue.entries).toHaveLength(160);
    expect(
      catalogue.entries.filter(
        (entry) => entry.question.metadata.subject === "verbal_reasoning",
      ),
    ).toHaveLength(45);
    expect(
      catalogue.entries.filter(
        (entry) => entry.question.metadata.subject === "numerical_reasoning",
      ),
    ).toHaveLength(40);
    const reading = catalogue.entries.filter(
      (entry) => entry.question.metadata.subject === "reading",
    );
    expect(reading).toHaveLength(35);
    expect(reading.every((entry) => entry.question.stimulus?.body)).toBe(true);
    expect(
      catalogue.entries.filter(
        (entry) => entry.question.metadata.subject === "numeracy",
      ),
    ).toHaveLength(40);
    expect(
      catalogue.entries.every(
        (entry) =>
          entry.findings &&
          !entry.approval &&
          /^[a-f0-9]{64}$/.test(entry.contentHash),
      ),
    ).toBe(true);
    expect(
      questionSchema.safeParse(catalogue.entries[0].question).success,
    ).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it.each(["guest", "student", "parent", "teacher", "revoked admin"])(
    "does not read drafts or write approvals when the role gate denies %s",
    async () => {
      mocks.role.mockRejectedValue(new Error("role gate denied"));
      await expect(loadAdminReviewCatalogue()).rejects.toThrow(
        "role gate denied",
      );
      await expect(approveDraft({})).rejects.toThrow("role gate denied");
      expect(readFile).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    },
  );

  it("fails closed without configured auth", async () => {
    mocks.role.mockResolvedValue({ configured: false });
    expect((await loadAdminReviewCatalogue()).entries).toEqual([]);
    expect(await approveDraft({})).toHaveProperty("error");
    expect(readFile).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("requires explicit checks and rejects stale revisions before writing", async () => {
    const catalogue = await loadAdminReviewCatalogue();
    const entry = catalogue.entries[0];
    const checks = {
      correctness: true,
      originality: true,
      ageAppropriateness: true,
    };
    expect(
      await approveDraft({
        questionId: entry.question.id,
        contentHash: entry.contentHash,
        checks: { ...checks, originality: false },
      }),
    ).toHaveProperty("error");
    expect(
      await approveDraft({
        questionId: entry.question.id,
        contentHash: "0".repeat(64),
        checks,
      }),
    ).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(
      await approveDraft({
        questionId: entry.question.id,
        contentHash: entry.contentHash,
        checks,
      }),
    ).toEqual({
      approvedAt: "2026-10-19T00:00:00Z",
      approvedBy: "human-admin",
    });
    expect(mocks.insert).toHaveBeenCalledExactlyOnceWith({
      question_id: entry.question.id,
      content_hash: entry.contentHash,
      approved_by: "human-admin",
      checks,
    });
  });

  it("invalidates approval when a passage, visual, option, explanation or difficulty changes", async () => {
    const catalogue = await loadAdminReviewCatalogue();
    const entry = catalogue.entries.find((item) => item.question.stimulus)!;
    const raw = JSON.parse(await readFile(entry.source, "utf8")).questions.find(
      (item: { id: string }) => item.id === entry.question.id,
    );
    expect(hashDraftRevision(raw)).toBe(entry.contentHash);
    const edits = [
      {
        ...raw,
        stimulus: { ...raw.stimulus, body: raw.stimulus.body + " Revised." },
      },
      {
        ...raw,
        visuals: [
          {
            id: "review-chart",
            type: "bar_chart",
            alt: "Two category counts",
            data: { labels: ["A", "B"], values: [2, 3] },
          },
        ],
      },
      {
        ...raw,
        options: raw.options.map((option: { text: string }, i: number) =>
          i ? option : { ...option, text: "Revised option" },
        ),
      },
      { ...raw, explanation: raw.explanation + " Revised." },
      { ...raw, metadata: { ...raw.metadata, difficulty: "hard" } },
    ];
    for (const changed of edits)
      expect(hashDraftRevision(changed)).not.toBe(entry.contentHash);
    mocks.history.mockResolvedValue({
      data: [
        {
          question_id: entry.question.id,
          content_hash: "0".repeat(64),
          approved_by: "human-admin",
          approved_at: "2026-10-19T00:00:00Z",
        },
      ],
      error: null,
    });
    const stale = await loadAdminReviewCatalogue();
    expect(
      stale.entries.find((item) => item.question.id === entry.question.id)
        ?.approval,
    ).toBeUndefined();
    mocks.history.mockResolvedValue({
      data: [
        {
          question_id: entry.question.id,
          content_hash: entry.contentHash,
          approved_by: "human-admin",
          approved_at: "2026-10-19T00:00:00Z",
        },
      ],
      error: null,
    });
    expect(
      (await loadAdminReviewCatalogue()).entries.find(
        (item) => item.question.id === entry.question.id,
      )?.approval?.approvedBy,
    ).toBe("human-admin");
  });

  it("rejects invalid options and unsafe visual structures in the review-local schema", async () => {
    const entry = (await loadAdminReviewCatalogue()).entries[0];
    expect(
      scholarshipReviewSchema.safeParse({ ...entry.question, options: [] })
        .success,
    ).toBe(false);
    expect(
      scholarshipReviewSchema.safeParse({
        ...entry.question,
        visuals: [{ type: "svg", markup: "<script>alert(1)</script>" }],
      }).success,
    ).toBe(false);
  });
});
