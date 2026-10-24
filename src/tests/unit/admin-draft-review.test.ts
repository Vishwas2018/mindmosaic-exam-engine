// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import releaseIdentities from "@/features/admin-review/releases/scholarship-2026-10-22.json";
import historicalIdentities from "@/features/admin-review/release-identities.json";
import { getExamBank } from "@/server/exam-bank";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { buildPublishedQuestion } from "@/features/question-factory/publication/build-published-question";

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
    vi.mocked(readFile).mockResolvedValueOnce(
      'import { loadAdminReviewCatalogue } from "@/server/admin-review";',
    );
    await expect(
      assertNoRuntimeDraftReference("src/app/practice"),
    ).rejects.toThrow("outside its authenticated review area");
  });

  it("rejects a student route referencing unsigned draft files", async () => {
    vi.mocked(readFile).mockResolvedValueOnce(
      'const directory = "content/scholarship-drafts";',
    );
    await expect(
      assertNoRuntimeDraftReference("src/app/practice"),
    ).rejects.toThrow("Unsigned scholarship drafts");
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
      getExamBank("published").some((question) =>
        question.id.startsWith("scholarship-y6-"),
      ),
    ).toBe(false);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("preserves the immutable 6b7d3339 historical release", () => {
    expect(historicalIdentities.sourceRevision.startsWith("6b7d3339")).toBe(true);
    expect(createHash("sha256").update(readFileSync("src/features/admin-review/release-identities.json")).digest("hex")).toBe("5bf7cc0cf28484b25996f39b39b4a449c24fe5a379a98ca9778b9fd005066aa2");
    for (const [id, identity] of Object.entries(historicalIdentities.questions)) {
      expect(releaseIdentities.questions[id as keyof typeof releaseIdentities.questions].historicalContentHash, id).toBe(identity.historicalContentHash);
    }
    expect(releaseIdentities.historicalRevision).toBe(historicalIdentities.historicalRevision);
  });

  it("displays the exact amended release revisions and preserves their governed identities", async () => {
    const catalogue = await loadAdminReviewCatalogue();
    expect(releaseIdentities.sourceRevision).toBe("45b6cdab335723b2ef822f854ac7e15e556bb7d7");
    const rawById = new Map<string, unknown>();
    for (const [file, expected] of Object.entries(releaseIdentities.packets)) {
      const bytes = readFileSync(`content/scholarship-drafts/${file}`);
      expect(createHash("sha256").update(bytes).digest("hex"), file).toBe(
        expected,
      );
      for (const question of JSON.parse(bytes.toString("utf8")).questions)
        rawById.set(question.id, question);
    }
    expect(rawById.size).toBe(160);
    for (const entry of catalogue.entries) {
      const raw = rawById.get(entry.question.id);
      expect(entry.question).toEqual(scholarshipReviewSchema.parse(raw));
      expect(entry.contentHash).toBe(hashDraftRevision(raw));
      expect(entry.sourceRevision).toBe(releaseIdentities.sourceRevision);
      const candidate = candidateQuestionSchema.parse(raw);
      expect(entry.governance?.candidateHash).toBe(hashJson(candidate));
      const built = buildPublishedQuestion(candidate);
      if (!built.ok) throw new Error(built.issues.join("; "));
      expect(entry.governance?.publishedContentHash).toBe(
        canonicalQuestionHash(built.question),
      );
      expect(entry.findings?.matchesCurrentRevision).toBe(
        entry.findings?.sourceContentHash === entry.contentHash,
      );
    }
    expect(
      catalogue.entries.find(
        (entry) => entry.question.id === "scholarship-y6-rc-025",
      )?.findings?.matchesCurrentRevision,
    ).toBe(false);
  });

  it("withholds items whose governance report no longer matches the release", async () => {
    const status = JSON.parse(
      readFileSync("docs/reviews/scholarship-sample-2026-10-22/status.json", "utf8"),
    );
    status.items[0].candidateHash = "0".repeat(64);
    vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(status));
    const catalogue = await loadAdminReviewCatalogue();
    expect(catalogue.entries).toHaveLength(159);
    expect(
      catalogue.entries.some(
        (entry) => entry.question.id === status.items[0].id,
      ),
    ).toBe(false);
    expect(catalogue.issues).toContain(
      `${status.items[0].id}: release content/governance identity mismatch; item withheld.`,
    );
  });

  it("withholds a packet changed after the corrected release was pinned", async () => {
    const original = vi.mocked(readFile).getMockImplementation()!;
    // Governance report and four historical reports precede the first packet.
    for (let index = 0; index < 5; index++) vi.mocked(readFile).mockImplementationOnce(original);
    const packet = JSON.parse(readFileSync("content/scholarship-drafts/scholarship-y6-verbal-reasoning-draft.json", "utf8"));
    packet.questions[0].prompt += " Changed after release.";
    vi.mocked(readFile).mockResolvedValueOnce(Buffer.from(JSON.stringify(packet)));
    const catalogue = await loadAdminReviewCatalogue();
    expect(catalogue.entries).toHaveLength(115);
    expect(catalogue.entries.some((entry) => entry.question.metadata.subject === "verbal_reasoning")).toBe(false);
    expect(catalogue.issues.some((issue) => issue.includes("source identity differs from release") && issue.includes("packet withheld"))).toBe(true);
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
