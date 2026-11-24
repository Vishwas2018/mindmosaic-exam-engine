import {
  EXPOSED_MOCK_ITEMS_PRACTICE_ONLY,
  isExposedMockQuestion,
} from "@/features/scholarship-prep/lib/practice";

export type ReviewPool =
  | "practice"
  | "unseen_mock"
  | "exposed_mock_practice_only";

export type MockPaperSlot = "mock-a" | "mock-b" | null;

export interface PoolClassification {
  readonly pool: ReviewPool;
  /** True when the item is part of the 100-item designated mock-exam inventory. */
  readonly designatedForMock: boolean;
  readonly mockPaper: MockPaperSlot;
  readonly policyNote: string | null;
}

/**
 * 100-item Scholarship mock-examination reservation targets (50 items per paper
 * across Mock Paper A and Mock Paper B). Strictly separated from the 400-item
 * everyday practice pool during review, export and mock assembly.
 */
export const SCHOLARSHIP_MOCK_RESERVATION_TARGETS = Object.freeze({
  numeracy: 24,
  numerical_reasoning: 24,
  verbal_reasoning: 24,
  reading: 20,
  writing: 8,
  total: 100,
});

/**
 * Matches the 100 highest-index items in the provisional canonical Codex
 * expansion-500 bank (`vihaan-e500-*`) designated for unseen mock papers:
 * - Mathematics: m091..m114 (24)
 * - Numerical Reasoning: n092..n115 (24)
 * - Verbal Reasoning: v093..v116 (24)
 * - Reading Comprehension: r078..r097 (20 — 4 complete 5-question passages)
 * - Written Expression: w031..w038 (8)
 *
 * The 20 retained pilot items (`vihaan-p01-*`) are NEVER in the mock reserve.
 */
export function designatedMockPaperSlot(questionId: string): MockPaperSlot {
  const match = /^vihaan-e500-([mnvrw])(\d{3})$/.exec(questionId);
  if (!match) return null;
  const kind = match[1];
  const index = Number(match[2]);
  switch (kind) {
    case "m":
      if (index >= 91 && index <= 102) return "mock-a";
      if (index >= 103 && index <= 114) return "mock-b";
      return null;
    case "n":
      if (index >= 92 && index <= 103) return "mock-a";
      if (index >= 104 && index <= 115) return "mock-b";
      return null;
    case "v":
      if (index >= 93 && index <= 104) return "mock-a";
      if (index >= 105 && index <= 116) return "mock-b";
      return null;
    case "r":
      // 4 complete 5-question passages: r078..r087 (2 passages) = Mock A, r088..r097 (2 passages) = Mock B.
      if (index >= 78 && index <= 87) return "mock-a";
      if (index >= 88 && index <= 97) return "mock-b";
      return null;
    case "w":
      if (index >= 31 && index <= 34) return "mock-a";
      if (index >= 35 && index <= 38) return "mock-b";
      return null;
    default:
      return null;
  }
}

export function isDesignatedMockCandidate(questionId: string): boolean {
  return designatedMockPaperSlot(questionId) !== null;
}

/**
 * Classifies a review item's pool while preserving the repository's strict
 * separation between everyday practice items and unseen mock examination items.
 */
export function classifyReviewPool(
  questionId: string,
  options: {
    readonly explicitReservedForMock?: boolean;
    readonly publicRepoExposed?: boolean;
  } = {},
): PoolClassification {
  const slot = designatedMockPaperSlot(questionId);
  const exposedMock = isExposedMockQuestion(questionId);
  const designatedForMock = Boolean(options.explicitReservedForMock || slot);

  if (options.explicitReservedForMock && !options.publicRepoExposed) {
    return {
      pool: "unseen_mock",
      designatedForMock: true,
      mockPaper: slot ?? "mock-a",
      policyNote:
        "Reserved exclusively for unseen timed mock examinations; must never enter everyday practice.",
    };
  }

  if (slot) {
    if (EXPOSED_MOCK_ITEMS_PRACTICE_ONLY && options.publicRepoExposed !== false) {
      return {
        pool: "exposed_mock_practice_only",
        designatedForMock: true,
        mockPaper: slot,
        policyNote:
          "Designated mock-exam slot (" +
          (slot === "mock-a" ? "Mock Paper A" : "Mock Paper B") +
          "). Held strictly separate from everyday practice exports; currently marked practice-only in public repo until replaced by a privately held unseen mock set.",
      };
    }
    return {
      pool: "unseen_mock",
      designatedForMock: true,
      mockPaper: slot,
      policyNote:
        "Reserved exclusively for " +
        (slot === "mock-a" ? "Mock Paper A" : "Mock Paper B") +
        "; excluded from everyday practice pools.",
    };
  }

  if (exposedMock && EXPOSED_MOCK_ITEMS_PRACTICE_ONLY) {
    return {
      pool: "exposed_mock_practice_only",
      designatedForMock: false,
      mockPaper: null,
      policyNote:
        "Former public-repo mock slot reclassified as practice-only (EXPOSED_MOCK_ITEMS_PRACTICE_ONLY).",
    };
  }

  return {
    pool: "practice",
    designatedForMock,
    mockPaper: null,
    policyNote: null,
  };
}

/**
 * Rejects AI model names, tool names, bots and generic non-person placeholders.
 * Shared across UI validation, Server Action, DB CHECK constraint and export CLI.
 */
export const NON_HUMAN_REVIEWER_PATTERN =
  /\b(?:claude|anthropic|opus|sonnet|haiku|gpt|chatgpt|openai|gemini|copilot|codex|qwen|llama|mistral|deepseek|grok|llm|bot|automated?|ai|antigravity|agent|script|cron|system|service|test\s+bot)\b|(?:claude|anthropic|openai|chatgpt|copilot|codex|antigravity|automated|bot)/i;

export function validateHumanReviewerName(
  rawName: string | null | undefined,
): { readonly ok: true; readonly normalized: string } | { readonly ok: false; readonly error: string } {
  const normalized = (rawName ?? "").trim().replace(/\s+/g, " ");
  if (normalized.length < 3 || normalized.length > 120) {
    return {
      ok: false,
      error: "Enter your real full name (first and last name) before recording a review decision.",
    };
  }
  const words = normalized.split(" ").filter(Boolean);
  if (words.length < 2 || words.some((word) => word.length < 2)) {
    return {
      ok: false,
      error:
        "A real human full name (at least two words, e.g. 'Vishwas Joshi') is required for auditable sign-off.",
    };
  }
  if (NON_HUMAN_REVIEWER_PATTERN.test(normalized)) {
    return {
      ok: false,
      error:
        "AI, automated tools and service identities cannot record human approval evidence.",
    };
  }
  if (!/^[\p{L}][\p{L}' .-]+$/u.test(normalized)) {
    return {
      ok: false,
      error: "Reviewer name may only contain letters, spaces, hyphens, apostrophes and periods.",
    };
  }
  return { ok: true, normalized };
}

export interface KnownDefectiveRevision {
  readonly defectId: string;
  readonly defectiveContentHash: string;
  readonly reason: string;
}

/**
 * Known defective draft revisions that are explicitly blocked from human
 * approval and export until corrected in a new revision (which changes the
 * canonical D1 `contentHash`, automatically re-enabling fresh blind review).
 *
 * Mirrors `VIHAAN_WITHDRAWN_QUESTION_IDS` in
 * `src/features/scholarship-prep/content/questions/vihaan-pilot-questions.ts`.
 */
export const KNOWN_DEFECTIVE_DRAFT_REVISIONS: Readonly<
  Record<string, KnownDefectiveRevision>
> = Object.freeze({
  "vihaan-e500-m069": {
    defectId: "A-06",
    defectiveContentHash:
      "d23176dea41737d3b0ed8833b67f8edb2532fe046c609b7538d9227d0c28fb05",
    reason:
      "No option satisfies the stem: squares between 60 and 90 are 64 (digit sum 10) and 81 (digit sum 9); neither sums to 13, yet the key marks 64 (Audit 2026-11-17). Correct the source question and re-review the new revision before approval.",
  },
});

/**
 * Returns the defect record when `(questionId, contentHash)` matches a known
 * defective draft revision. Once the item is corrected in Git, its D1 hash
 * changes and this returns `null`, re-allowing fresh human review & approval.
 */
export function getKnownDefectiveRevision(
  questionId: string,
  contentHash: string,
): KnownDefectiveRevision | null {
  const entry = KNOWN_DEFECTIVE_DRAFT_REVISIONS[questionId];
  if (!entry) return null;
  return entry.defectiveContentHash === contentHash ? entry : null;
}
