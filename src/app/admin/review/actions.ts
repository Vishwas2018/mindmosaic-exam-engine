"use server";

import { z } from "zod";

import { requireRole } from "@/features/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { loadAdminReviewCatalogue } from "@/server/admin-review";

const approvalSchema = z
  .object({
    questionId: z.string().min(1).max(100),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    checks: z
      .object({
        correctness: z.literal(true),
        originality: z.literal(true),
        ageAppropriateness: z.literal(true),
      })
      .strict(),
  })
  .strict();

// A Server Action has its own authenticated boundary; the layout is insufficient.
// Next also checks the request Origin for Server Actions.
export async function approveDraft(
  input: unknown,
): Promise<{ error?: string; approvedAt?: string; approvedBy?: string }> {
  const access = await requireRole("admin", "/admin/review");
  if (!access.configured) return { error: "Sign-in is unavailable." };
  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success)
    return { error: "Confirm every approval check before recording approval." };
  const { questionId, contentHash, checks } = parsed.data;
  const catalogue = await loadAdminReviewCatalogue();
  const current = catalogue.entries.find(
    (entry) => entry.question.id === questionId,
  );
  if (!current || current.contentHash !== contentHash)
    return {
      error:
        "This draft revision has changed or is unavailable. Reload and review it again.",
    };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("admin_draft_review_approvals")
    .insert({
      question_id: questionId,
      content_hash: contentHash,
      approved_by: access.userId,
      checks,
    })
    .select("approved_at, approved_by")
    .single();
  if (error)
    return {
      error:
        "Approval could not be recorded. Check the review migration and access permissions; no publication was requested.",
    };
  return { approvedAt: data.approved_at, approvedBy: data.approved_by };
}
