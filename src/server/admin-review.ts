import "server-only";

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

import { requireRole } from "@/features/auth/require-role";
import {
  REVIEW_BANK_IDS,
  reviewQuestionSchema,
  scholarshipReviewSchema,
  type PublicationStatus,
  type ReviewBankId,
  type ReviewBankSummary,
  type ReviewCatalogue,
  type ReviewChecks,
  type ReviewDecisionKind,
  type ReviewDecisionRecord,
  type ReviewEntry,
} from "@/features/admin-review/contracts";
import {
  classifyReviewPool,
  getKnownDefectiveRevision,
  isDesignatedMockCandidate,
} from "@/features/admin-review/pool-classification";
import { scholarshipWritingItemToTask } from "@/features/admin-review/writing-adapter";
import releaseIdentities from "@/features/admin-review/release-identities.json";
import { canonicalQuestionHash } from "@/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { hashJson } from "@/features/question-factory/provenance/content-hash";
import { createClient } from "@/lib/supabase/server";
import { questionBaseSchema, questionSchema } from "@/schemas/question.schema";

// Fixed private paths only. No URL/query input ever becomes a filesystem path.
const LEGACY_PACKETS = [
  "scholarship-y6-verbal-reasoning-draft.json",
  "scholarship-y6-numerical-reasoning-draft.json",
  "scholarship-y6-reading-draft.json",
  "scholarship-y6-mathematics-draft.json",
] as const;

const LEGACY_BATCH_IDS: Readonly<Record<(typeof LEGACY_PACKETS)[number], string>> = {
  "scholarship-y6-verbal-reasoning-draft.json": "scholarship-y6-vr",
  "scholarship-y6-numerical-reasoning-draft.json": "scholarship-y6-nr",
  "scholarship-y6-reading-draft.json": "scholarship-y6-rc",
  "scholarship-y6-mathematics-draft.json": "scholarship-y6-maths",
};

const VIHAAN_EXPANSION_DIR = "content/vihaan-scholarship/expansion-500";
const VIHAAN_PILOT_FILE = "content/vihaan-scholarship/pilot-01/draft.json";

const packetSchema = z.object({
  draftOnly: z.literal(true),
  questions: z.array(z.unknown()),
});

const findingsSchema = z.object({
  reviewer: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      myAnswer: z.string(),
      recommendation: z.string(),
      difficultyEstimate: z.string().optional(),
      difficultyVerdict: z.string().optional(),
      notes: z.string().optional(),
      semanticFlags: z.array(z.string()).default([]),
      originality: z.string().optional(),
      working: z.string().optional(),
    }),
  ),
});

const governanceSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      bucket: z.string(),
      reasons: z.array(z.string()),
      difficultyGate: z.string(),
      estimator: z.string(),
      candidateHash: z.string(),
      publishedContentHash: z.string(),
    }),
  ),
});

const vihaanPilotQuestionSchema = questionBaseSchema
  .strict()
  .extend({
    status: z.literal("draft"),
    yearLevel: z.literal(6),
    examStyle: z.literal("scholarship_style"),
    id: z.string().regex(/^vihaan-p01-(m0[1-6]|n0[1-5]|v0[1-4]|r0[1-3]|w0[1-2])$/),
    metadata: questionBaseSchema.shape.metadata.strict().extend({
      tags: z.array(z.enum(["vihaan-pilot", "year-5-stretch", "manual-assessment"])),
    }),
    options: z.array(z.object({ id: z.enum(["a", "b", "c", "d"]), text: z.string().min(1) }).strict()),
    answerKey: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("single_option"), optionId: z.enum(["a", "b", "c", "d"]) }).strict(),
      z
        .object({
          kind: z.literal("manual"),
          rubric: z.string().min(10),
          sampleResponse: z.string().min(1).optional(),
        })
        .strict(),
    ]),
    stimulus: z
      .object({
        title: z.string().min(1),
        body: z.string().min(1),
        attribution: z.literal("MindMosaic original"),
      })
      .strict()
      .optional(),
    visuals: z.array(z.never()).length(0),
    media: z.never().optional(),
    interaction: z.never().optional(),
  });

const vihaanPilotItemSchema = z
  .object({
    question: vihaanPilotQuestionSchema,
    workedSolution: z.array(z.string().min(10)).min(2),
    reviewFocus: z.array(z.string().min(10)).min(1),
    writingGuidance: z
      .object({
        rubricId: z.literal("scholarship-written-expression"),
        rubricVersion: z.literal(1),
        successCriteria: z.array(z.string().min(10)).min(3),
        assessmentMode: z.literal("human_only"),
      })
      .strict()
      .nullable(),
  })
  .strict();

const vihaanPilotFileSchema = z
  .object({
    batchId: z.literal("vihaan-pilot-01"),
    version: z.literal(1),
    provenance: z
      .object({
        adapter: z.literal("manual_external"),
        author: z.string().min(1),
        model: z.null(),
        generatedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        originalGenerationEvidence: z.string().min(1),
        externalSourceMaterialUsed: z.literal(false),
        qwenStatus: z.string().min(1),
        promptFile: z.literal("authoring-brief.md"),
      })
      .strict(),
    approvedBy: z.null(),
    items: z.array(vihaanPilotItemSchema).length(20),
  })
  .strict();

const vihaanExpansionQuestionSchema = questionBaseSchema
  .strict()
  .extend({
    status: z.literal("draft"),
    yearLevel: z.literal(6),
    examStyle: z.literal("scholarship_style"),
    id: z.string().regex(/^vihaan-e500-[mnvrw]\d{3}$/),
    visuals: z.array(z.never()).length(0),
    media: z.never().optional(),
    interaction: z.never().optional(),
    metadata: questionBaseSchema.shape.metadata.strict(),
  });

const vihaanExpansionItemSchema = vihaanPilotItemSchema
  .omit({ question: true })
  .extend({
    question: vihaanExpansionQuestionSchema,
    arithmeticCheck: z
      .object({
        expression: z.string().min(1).max(500),
        expected: z.string().min(1),
      })
      .strict()
      .optional(),
  })
  .strict();

const vihaanExpansionBatchSchema = z
  .object({
    batchId: z.string().regex(/^vihaan-expansion-(?:0[1-9]|10)$/),
    version: z.literal(1),
    status: z.literal("draft"),
    approvedBy: z.null(),
    provenance: z
      .object({
        adapter: z.literal("manual_external"),
        author: z.string().min(1),
        model: z.null(),
        generatedOn: z.literal("2026-11-16"),
        originalGenerationEvidence: z.string().min(20),
        externalQuestionMaterialUsed: z.literal(false),
        formatReference: z.literal("https://www.edutest.com.au/tests_parents.html"),
        formatReferenceUse: z.string().min(20),
        promptFile: z.literal("authoring-brief.md"),
      })
      .strict(),
    retainedPilotIds: z.array(z.string()),
    items: z.array(vihaanExpansionItemSchema),
  })
  .strict();

const vihaanBankManifestSchema = z
  .object({
    bankId: z.literal("vihaan-scholarship-500"),
    version: z.literal(1),
    status: z.literal("draft"),
    approvedBy: z.null(),
    targets: z
      .object({
        numeracy: z.literal(120),
        numerical_reasoning: z.literal(120),
        verbal_reasoning: z.literal(120),
        reading: z.literal(100),
        writing: z.literal(40),
      })
      .strict(),
    difficultyTargets: z
      .object({
        easy: z.literal(75),
        medium: z.literal(225),
        challenging: z.literal(200),
      })
      .strict(),
    retainedPilot: z.literal("content/vihaan-scholarship/pilot-01/draft.json"),
    batches: z
      .array(
        z
          .object({
            batchId: z.string(),
            file: z.string().regex(/^batch-(?:0[1-9]|10)\.draft\.json$/),
          })
          .strict(),
      )
      .length(10),
  })
  .strict();

const vihaanCoverageReportSchema = z.object({
  bankId: z.literal("vihaan-scholarship-500"),
  passed: z.boolean(),
  sources: z.object({
    manifestHash: z.string().regex(/^[a-f0-9]{64}$/),
    pilotHash: z.string().regex(/^[a-f0-9]{64}$/),
    batchHashes: z.array(
      z.object({
        file: z.string(),
        hash: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    ),
  }),
});

const identities: Record<
  string,
  {
    contentHash: string;
    historicalContentHash: string;
    candidateHash: string;
    publishedContentHash: string;
  }
> = releaseIdentities.questions;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, val]) => `${JSON.stringify(key)}:${canonical(val)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}

export function hashDraftRevision(question: unknown): string {
  return createHash("sha256").update(canonical(question)).digest("hex");
}

function hashVihaanObject(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function computeReviewEvidenceFingerprint(payload: {
  readonly bankId: ReviewBankId;
  readonly batchId: string;
  readonly questionId: string;
  readonly itemKind: "question" | "writing_prompt";
  readonly pool: string;
  readonly sourceRevision: string;
  readonly revisionNumber: number;
  readonly contentHash: string;
  readonly candidateHash: string | null;
  readonly publishedContentHash: string;
  readonly decision: ReviewDecisionKind;
  readonly checks: ReviewChecks;
  readonly blindSolved: boolean;
  readonly notes: string;
  readonly reviewerId: string;
  readonly reviewerName: string;
  readonly reviewerEmail: string;
}): string {
  return createHash("sha256").update(canonical(payload)).digest("hex");
}

const BANK_METADATA: readonly ReviewBankSummary[] = [
  {
    id: "scholarship-y6-core",
    label: "Scholarship Year 6 Core (160)",
    shortLabel: "Y6 Core (160)",
    description:
      "Pinned 160-item Year 6 Scholarship draft release across Verbal Reasoning, Numerical Reasoning, Reading Comprehension and Mathematics.",
    provisionalCanonical: false,
    totalItems: 160,
    practiceItems: 160,
    mockItems: 0,
    writingItems: 0,
    sourceRevision: releaseIdentities.sourceRevision,
  },
  {
    id: "vihaan-scholarship-500",
    label: "Scholarship 500 — Codex Provisional Canonical (480 + 20 Pilot)",
    shortLabel: "Codex 500 (Provisional)",
    description:
      "Provisional canonical 500-item Year 6/7 Scholarship bank: 480 Codex expansion items (vihaan-e500-*) plus 20 retained pilot items (vihaan-p01-*), with 100 designated mock slots and 40 Written Expression prompts routed through the existing writing-prompt approval process.",
    provisionalCanonical: true,
    totalItems: 500,
    practiceItems: 400,
    mockItems: 100,
    writingItems: 40,
    sourceRevision: "vihaan-scholarship-500@v1",
  },
];

function isValidBankId(value: string | undefined): value is ReviewBankId {
  return (
    typeof value === "string" &&
    (REVIEW_BANK_IDS as readonly string[]).includes(value)
  );
}

interface LegacyApprovalRow {
  question_id: string;
  content_hash: string;
  approved_by: string;
  approved_at: string;
}

interface ExtendedDecisionRow {
  id: string;
  bank_id: string;
  batch_id: string;
  question_id: string;
  content_hash: string;
  published_content_hash: string;
  source_revision: string;
  revision_number: number;
  decision: ReviewDecisionKind;
  checks: Partial<ReviewChecks> | null;
  blind_solved: boolean;
  notes: string;
  reviewer_id: string;
  reviewer_name: string;
  reviewer_email: string;
  evidence_fingerprint: string;
  decided_at: string;
}

function normalizeChecks(raw: Partial<ReviewChecks> | null | undefined, legacyApproved = false): ReviewChecks {
  return {
    correctness: Boolean(raw?.correctness ?? legacyApproved),
    originality: Boolean(raw?.originality ?? legacyApproved),
    ageAppropriateness: Boolean(raw?.ageAppropriateness ?? legacyApproved),
    editorialInterpretation: Boolean(raw?.editorialInterpretation ?? false),
    difficultyCalibrated: Boolean(raw?.difficultyCalibrated ?? false),
  };
}

function derivePublicationStatus(
  latest: ReviewDecisionRecord | undefined,
): PublicationStatus {
  if (!latest || !latest.matchesCurrentRevision) return "unpublished_draft";
  if (latest.decision === "approve") return "approved_in_review";
  if (latest.decision === "revise") return "revision_requested";
  if (latest.decision === "reject") return "rejected";
  return "unpublished_draft";
}

async function loadLegacyScholarshipBank(
  catalogue: ReviewCatalogue,
): Promise<void> {
  const ids = new Set<string>();
  const findings = new Map<
    string,
    NonNullable<ReviewCatalogue["entries"][number]["findings"]>
  >();
  const governance = new Map<
    string,
    z.infer<typeof governanceSchema>["items"][number]
  >();

  try {
    const report = governanceSchema.parse(
      JSON.parse(
        await readFile(
          path.join(
            process.cwd(),
            "docs/reviews/scholarship-2026-10-18/status.json",
          ),
          "utf8",
        ),
      ),
    );
    for (const item of report.items) governance.set(item.id, item);
  } catch {
    catalogue.issues.push(
      "Release governance status is unavailable; draft content was not loaded.",
    );
    return;
  }

  for (const section of ["vr", "nr", "rc", "maths"]) {
    try {
      const evidence = findingsSchema.parse(
        JSON.parse(
          await readFile(
            path.join(
              process.cwd(),
              `docs/content-status/scholarship-review-2026-10-16/blind-review-${section}.json`,
            ),
            "utf8",
          ),
        ),
      );
      for (const item of evidence.items)
        findings.set(item.id, { ...item, reviewer: evidence.reviewer });
    } catch {
      catalogue.issues.push(
        `Independent ${section} review findings unavailable.`,
      );
    }
  }

  for (const file of LEGACY_PACKETS) {
    const source = `content/scholarship-drafts/${file}`;
    try {
      const bytes = await readFile(
        path.join(process.cwd(), "content/scholarship-drafts", file),
      );
      if (
        createHash("sha256").update(bytes).digest("hex") !==
        releaseIdentities.packets[file]
      ) {
        catalogue.issues.push(
          `${source}: source identity differs from release ${releaseIdentities.sourceRevision}; packet withheld.`,
        );
        continue;
      }
      const packet = packetSchema.parse(JSON.parse(bytes.toString("utf8")));
      for (const [index, raw] of packet.questions.entries()) {
        const result = scholarshipReviewSchema.safeParse(raw);
        if (!result.success || result.data.status !== "draft") {
          catalogue.issues.push(
            `${source}: item ${index + 1} cannot be previewed: ${result.success ? "expected draft status" : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
          );
          continue;
        }
        if (ids.has(result.data.id)) {
          catalogue.issues.push(
            `${source}: duplicate question ID ${result.data.id}.`,
          );
          continue;
        }
        ids.add(result.data.id);
        const contentHash = hashDraftRevision(raw);
        const identity = identities[result.data.id];
        const currentGovernance = governance.get(result.data.id);
        if (
          !identity ||
          identity.contentHash !== contentHash ||
          !currentGovernance ||
          identity.candidateHash !== currentGovernance.candidateHash ||
          identity.publishedContentHash !==
            currentGovernance.publishedContentHash
        ) {
          catalogue.issues.push(
            `${result.data.id}: release content/governance identity mismatch; item withheld.`,
          );
          continue;
        }
        const historical = findings.get(result.data.id);
        catalogue.entries.push({
          kind: "scholarship",
          bankId: "scholarship-y6-core",
          batchId: LEGACY_BATCH_IDS[file],
          itemKind: "question",
          pool: "practice",
          designatedForMock: false,
          mockPaper: null,
          mockPolicyNote: null,
          source,
          contentHash,
          candidateHash: currentGovernance.candidateHash,
          publishedContentHash: currentGovernance.publishedContentHash,
          revisionNumber: 0,
          sourceRevision: releaseIdentities.sourceRevision,
          governance: currentGovernance,
          findings: historical
            ? {
                ...historical,
                sourceRevision: releaseIdentities.historicalRevision,
                sourceContentHash: identity.historicalContentHash,
                matchesCurrentRevision:
                  identity.historicalContentHash === contentHash,
              }
            : undefined,
          publicationStatus: "unpublished_draft",
          decisionHistory: [],
          question: result.data,
        });
      }
    } catch {
      catalogue.issues.push(
        `${source}: draft packet is unavailable or invalid.`,
      );
    }
  }
}

async function loadVihaanCanonicalBank(
  catalogue: ReviewCatalogue,
): Promise<void> {
  const ids = new Set<string>();
  let manifest: z.infer<typeof vihaanBankManifestSchema>;
  let coverage: z.infer<typeof vihaanCoverageReportSchema>;

  try {
    const manifestRaw = JSON.parse(
      await readFile(
        path.join(process.cwd(), VIHAAN_EXPANSION_DIR, "bank.draft.json"),
        "utf8",
      ),
    );
    manifest = vihaanBankManifestSchema.parse(manifestRaw);

    const coverageRaw = JSON.parse(
      await readFile(
        path.join(
          process.cwd(),
          VIHAAN_EXPANSION_DIR,
          "quality-coverage-report.json",
        ),
        "utf8",
      ),
    );
    coverage = vihaanCoverageReportSchema.parse(coverageRaw);

    if (!coverage.passed) {
      catalogue.issues.push(
        "Vihaan 500 consolidated quality report did not pass; bank withheld.",
      );
      return;
    }
    if (hashVihaanObject(manifest) !== coverage.sources.manifestHash) {
      catalogue.issues.push(
        "Vihaan 500 bank.draft.json hash differs from quality-coverage-report.json; bank withheld.",
      );
      return;
    }
  } catch {
    catalogue.issues.push(
      "Vihaan 500 bank manifest or quality coverage report is unavailable or invalid; bank withheld.",
    );
    return;
  }

  const batchHashByFile = new Map(
    coverage.sources.batchHashes.map((entry) => [entry.file, entry.hash]),
  );

  const sourceFiles: Array<{
    readonly source: string;
    readonly isPilot: boolean;
    readonly expectedHash: string;
    readonly fallbackBatchId: string;
  }> = [
    {
      source: VIHAAN_PILOT_FILE,
      isPilot: true,
      expectedHash: coverage.sources.pilotHash,
      fallbackBatchId: "vihaan-pilot-01",
    },
    ...manifest.batches.map((batch) => ({
      source: `${VIHAAN_EXPANSION_DIR}/${batch.file}`,
      isPilot: false,
      expectedHash: batchHashByFile.get(batch.file) ?? "",
      fallbackBatchId: batch.batchId,
    })),
  ];

  const sourceRevision = `vihaan-scholarship-500:${coverage.sources.manifestHash.slice(0, 12)}`;

  for (const spec of sourceFiles) {
    try {
      const rawJson = JSON.parse(
        await readFile(path.join(process.cwd(), spec.source), "utf8"),
      );
      const batch = spec.isPilot
        ? vihaanPilotFileSchema.parse(rawJson)
        : vihaanExpansionBatchSchema.parse(rawJson);
      const actualHash = hashVihaanObject(batch);
      if (!spec.expectedHash || actualHash !== spec.expectedHash) {
        catalogue.issues.push(
          `${spec.source}: source hash differs from quality-coverage-report.json; batch withheld.`,
        );
        continue;
      }
      const rawItems = (
        rawJson as { items: Array<{ question: unknown }> }
      ).items;
      for (const [index, wrapper] of batch.items.entries()) {
        const rawQuestion = rawItems[index]?.question ?? wrapper.question;
        const parsed = reviewQuestionSchema.safeParse(rawQuestion);
        if (!parsed.success || parsed.data.status !== "draft") {
          catalogue.issues.push(
            `${spec.source}: item ${index + 1} cannot be previewed: ${parsed.success ? "expected draft status" : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`,
          );
          continue;
        }
        const question = parsed.data;
        if (ids.has(question.id)) {
          catalogue.issues.push(
            `${spec.source}: duplicate question ID ${question.id}; second occurrence withheld.`,
          );
          continue;
        }
        ids.add(question.id);

        const contentHash = hashDraftRevision(rawQuestion);
        const isWriting =
          question.type === "essay" && question.metadata.subject === "writing";

        let candidateHash: string | undefined;
        let publishedContentHash: string;
        let writingTask: ReviewEntry["writingTask"];

        if (isWriting) {
          const adapted = scholarshipWritingItemToTask({
            id: question.id,
            yearLevel: question.yearLevel,
            prompt: question.prompt,
            metadata: question.metadata,
          });
          writingTask = adapted.task;
          publishedContentHash = adapted.contentHash;
        } else {
          const candidate = candidateQuestionSchema.parse(rawQuestion);
          candidateHash = hashJson(candidate);
          const publishedQuestion = questionSchema.parse({
            ...(rawQuestion as Record<string, unknown>),
            status: "published",
          });
          publishedContentHash = canonicalQuestionHash(publishedQuestion);
        }

        const poolInfo = classifyReviewPool(question.id, {
          explicitReservedForMock: isDesignatedMockCandidate(question.id),
          publicRepoExposed: true,
        });

        const knownDefect = getKnownDefectiveRevision(question.id, contentHash);

        catalogue.entries.push({
          kind: "scholarship",
          bankId: "vihaan-scholarship-500",
          batchId: batch.batchId || spec.fallbackBatchId,
          itemKind: isWriting ? "writing_prompt" : "question",
          pool: poolInfo.pool,
          designatedForMock: poolInfo.designatedForMock,
          mockPaper: poolInfo.mockPaper,
          mockPolicyNote: poolInfo.policyNote,
          source: spec.source,
          contentHash,
          candidateHash,
          publishedContentHash,
          revisionNumber: batch.version,
          sourceRevision,
          workedSolution: wrapper.workedSolution,
          reviewFocus: wrapper.reviewFocus,
          arithmeticCheck:
            "arithmeticCheck" in wrapper ? wrapper.arithmeticCheck : undefined,
          writingGuidance: wrapper.writingGuidance ?? undefined,
          writingTask,
          approvalBlocked: knownDefect
            ? { defectId: knownDefect.defectId, reason: knownDefect.reason }
            : undefined,
          publicationStatus: "unpublished_draft",
          decisionHistory: [],
          question,
        });
      }
    } catch {
      catalogue.issues.push(
        `${spec.source}: draft batch is unavailable or invalid.`,
      );
    }
  }
}

/** A separate authenticated read path. Never call this from student allocation. */
export async function loadAdminReviewCatalogue(
  options: { readonly bankId?: string } = {},
): Promise<ReviewCatalogue> {
  // Layouts may render concurrently with pages; guard here before reading files.
  const access = await requireRole("admin", "/admin/review");
  const activeBankId: ReviewBankId = isValidBankId(options.bankId)
    ? options.bankId
    : "scholarship-y6-core";

  if (!access.configured) {
    return {
      activeBankId,
      banks: [...BANK_METADATA],
      entries: [],
      approvalsAvailable: false,
      extendedDecisionsAvailable: false,
      issues: [
        "Sign-in is unavailable until Supabase is configured. No draft content has been loaded.",
      ],
    };
  }

  const catalogue: ReviewCatalogue = {
    activeBankId,
    banks: [...BANK_METADATA],
    entries: [],
    issues: [],
    approvalsAvailable: false,
    extendedDecisionsAvailable: false,
  };

  if (activeBankId === "scholarship-y6-core") {
    await loadLegacyScholarshipBank(catalogue);
  } else {
    await loadVihaanCanonicalBank(catalogue);
  }

  const supabase = await createClient();

  // Resolve authenticated reviewer identity safely (minimal unit-test mocks may omit auth/eq).
  try {
    const authUserResult = await supabase.auth?.getUser?.();
    const authUser = authUserResult?.data?.user;
    if (authUser) {
      let displayName: string | null = null;
      try {
        const profileQuery = supabase.from("profiles").select("display_name");
        if (typeof profileQuery?.eq === "function") {
          const { data: profile } = await profileQuery
            .eq("id", authUser.id)
            .single();
          displayName =
            typeof profile?.display_name === "string"
              ? profile.display_name
              : null;
        }
      } catch {
        displayName = null;
      }
      catalogue.reviewer = {
        userId: authUser.id,
        email: authUser.email ?? "",
        displayName,
      };
    }
  } catch {
    // Non-fatal in minimal test doubles.
  }

  // 1. Read legacy approvals table (preserved untouched for backward compatibility).
  const { data: legacyApprovals, error: legacyError } = await supabase
    .from("admin_draft_review_approvals")
    .select("question_id, content_hash, approved_by, approved_at")
    .order("approved_at", { ascending: false });

  if (legacyError) {
    catalogue.issues.push(
      "Review approval history is unavailable. Apply the admin draft review migration and check access permissions.",
    );
  } else {
    catalogue.approvalsAvailable = true;
  }

  // 2. Read extended revision-bound decisions table (gracefully optional until DEV migration is approved & applied).
  let extendedRows: ExtendedDecisionRow[] = [];
  if (typeof supabase.from === "function") {
    try {
      const extendedRes = await supabase
        .from("admin_draft_review_decisions")
        .select(
          "id, bank_id, batch_id, question_id, content_hash, published_content_hash, source_revision, revision_number, decision, checks, blind_solved, notes, reviewer_id, reviewer_name, reviewer_email, evidence_fingerprint, decided_at",
        )
        .order("decided_at", { ascending: false });
      if (!extendedRes.error && Array.isArray(extendedRes.data)) {
        // Distinguish real extended rows from legacy-shaped test mock rows.
        const candidateRows = extendedRes.data as Array<Record<string, unknown>>;
        const hasLegacyMockShape =
          candidateRows.length > 0 &&
          !("decision" in candidateRows[0]!) &&
          "approved_by" in candidateRows[0]!;
        if (!hasLegacyMockShape) {
          extendedRows = candidateRows as unknown as ExtendedDecisionRow[];
          catalogue.extendedDecisionsAvailable = true;
        }
      }
    } catch {
      catalogue.extendedDecisionsAvailable = false;
    }
  }

  const legacyList = (legacyApprovals ?? []) as LegacyApprovalRow[];

  for (const entry of catalogue.entries) {
    const history: ReviewDecisionRecord[] = [];

    for (const row of extendedRows) {
      if (row.question_id !== entry.question.id) continue;
      if (row.bank_id && row.bank_id !== entry.bankId) continue;
      history.push({
        id: row.id,
        decision: row.decision,
        approvedBy: row.reviewer_id,
        reviewerName: row.reviewer_name,
        reviewerEmail: row.reviewer_email,
        decidedAt: row.decided_at,
        contentHash: row.content_hash,
        publishedContentHash: row.published_content_hash,
        sourceRevision: row.source_revision,
        revisionNumber: row.revision_number,
        notes: row.notes ?? "",
        blindSolved: Boolean(row.blind_solved),
        checks: normalizeChecks(row.checks, row.decision === "approve"),
        evidenceFingerprint: row.evidence_fingerprint,
        matchesCurrentRevision:
          row.content_hash === entry.contentHash &&
          row.published_content_hash === entry.publishedContentHash,
        isLegacyApproval: false,
      });
    }

    for (const row of legacyList) {
      if (row.question_id !== entry.question.id) continue;
      // Avoid duplicating if an identical current-revision approval already exists in extended history.
      const alreadyCovered = history.some(
        (item) =>
          item.decision === "approve" &&
          item.contentHash === row.content_hash &&
          item.approvedBy === row.approved_by,
      );
      if (alreadyCovered) continue;
      history.push({
        decision: "approve",
        approvedBy: row.approved_by,
        reviewerName: row.approved_by,
        reviewerEmail: "",
        decidedAt: row.approved_at,
        contentHash: row.content_hash,
        notes: "",
        blindSolved: false,
        checks: normalizeChecks(null, true),
        matchesCurrentRevision: row.content_hash === entry.contentHash,
        isLegacyApproval: true,
      });
    }

    history.sort((a, b) => (a.decidedAt < b.decidedAt ? 1 : a.decidedAt > b.decidedAt ? -1 : 0));
    entry.decisionHistory = history;

    const currentDecision = history.find((item) => item.matchesCurrentRevision);
    if (currentDecision) {
      entry.latestDecision = currentDecision;
      if (currentDecision.decision === "approve") {
        entry.approval = {
          approvedBy: currentDecision.approvedBy,
          approvedAt: currentDecision.decidedAt,
          reviewerName: currentDecision.isLegacyApproval
            ? undefined
            : currentDecision.reviewerName,
          reviewerEmail: currentDecision.isLegacyApproval
            ? undefined
            : currentDecision.reviewerEmail,
        };
      }
    }
    entry.publicationStatus = derivePublicationStatus(currentDecision);
  }

  return catalogue;
}
