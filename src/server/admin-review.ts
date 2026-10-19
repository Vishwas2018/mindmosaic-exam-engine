import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { createHash } from "node:crypto";

import { requireRole } from "@/features/auth/require-role";
import {
  scholarshipReviewSchema,
  type ReviewCatalogue,
} from "@/features/admin-review/contracts";
import { createClient } from "@/lib/supabase/server";
import releaseIdentities from "@/features/admin-review/release-identities.json";

// Fixed private paths only. No URL/query input ever becomes a filesystem path.
const PACKETS = [
  "scholarship-y6-verbal-reasoning-draft.json",
  "scholarship-y6-numerical-reasoning-draft.json",
  "scholarship-y6-reading-draft.json",
  "scholarship-y6-mathematics-draft.json",
] as const;

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

/** A separate authenticated read path. Never call this from student allocation. */
export async function loadAdminReviewCatalogue(): Promise<ReviewCatalogue> {
  // Layouts may render concurrently with pages; guard here before reading files.
  const access = await requireRole("admin", "/admin/review");
  if (!access.configured)
    return {
      entries: [],
      approvalsAvailable: false,
      issues: [
        "Sign-in is unavailable until Supabase is configured. No draft content has been loaded.",
      ],
    };

  const catalogue: ReviewCatalogue = {
    entries: [],
    issues: [],
    approvalsAvailable: false,
  };
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
    return catalogue;
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
  for (const file of PACKETS) {
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
        const common = {
          source,
          contentHash,
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
        };
        catalogue.entries.push({
          kind: "scholarship",
          ...common,
          question: result.data,
        });
      }
    } catch {
      catalogue.issues.push(
        `${source}: draft packet is unavailable or invalid.`,
      );
    }
  }
  const supabase = await createClient();
  const { data: approvals, error } = await supabase
    .from("admin_draft_review_approvals")
    .select("question_id, content_hash, approved_by, approved_at")
    .order("approved_at", { ascending: false });
  if (error)
    catalogue.issues.push(
      "Review approval history is unavailable. Apply the admin draft review migration and check access permissions.",
    );
  else catalogue.approvalsAvailable = true;
  for (const entry of catalogue.entries) {
    const approval = approvals?.find(
      (row) =>
        row.question_id === entry.question.id &&
        row.content_hash === entry.contentHash,
    );
    if (approval)
      entry.approval = {
        approvedBy: approval.approved_by,
        approvedAt: approval.approved_at,
      };
  }
  return catalogue;
}
