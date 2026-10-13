import { z } from "zod";

import { WRITING_FORMS, writingTaskSchema, type WritingTask } from "./task";

/**
 * Shape of a writing-prompt DRAFT in content/writing-drafts. Same posture as
 * the other unsigned content drafts: candidate material, never imported by a
 * learner route, and never signed off here.
 *
 * `approvedBy` and `review` are required to be null in a draft. A prompt only
 * becomes a WritingTask a child can reach when a human approves it and it is
 * served from an approval record (src/server/writing/tasks.ts), which only
 * `content:record-approvals` can create. Nothing in this file claims approval.
 */
export const writingDraftSchema = z.object({
  id: z.string().regex(/^w[0-9]+-[a-z]+-draft-[0-9]{3}$/),
  title: z.string().min(1).max(100),
  form: z.enum(WRITING_FORMS),
  yearLevel: z.literal(6),
  prompt: z.string().min(40).max(1200),
  timeLimitMinutes: z.literal(15),
  suggestedWords: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }),
  provenance: z.object({
    authoredBy: z.string().min(1),
    authoredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    originality: z.string().min(1),
  }),
  /** Bumped when a reviewed prompt is edited, so the new text needs a fresh review. */
  revision: z.number().int().min(1).default(1),
  review: z.null(),
  approvedBy: z.null(),
});

export const writingDraftPacketSchema = z
  .object({
    draftOnly: z.literal(true),
    authoringNote: z.string().min(1),
    prompts: z.array(writingDraftSchema).min(1),
  })
  .superRefine((packet, context) => {
    const ids = new Set<string>();
    packet.prompts.forEach((prompt, index) => {
      if (ids.has(prompt.id)) {
        context.addIssue({ code: "custom", message: `Duplicate draft id '${prompt.id}'.`, path: ["prompts", index, "id"] });
      }
      ids.add(prompt.id);
      if (prompt.suggestedWords.max <= prompt.suggestedWords.min) {
        context.addIssue({ code: "custom", message: "suggestedWords.max must exceed min.", path: ["prompts", index, "suggestedWords"] });
      }
    });
  });

export type WritingDraft = z.infer<typeof writingDraftSchema>;

/**
 * The reviewable subject for a draft: exactly what a child would see and what
 * an approval binds to. Provenance and the null review fields are authoring
 * metadata and are not part of the approved content.
 */
export function writingDraftToTask(draft: WritingDraft): { readonly task: WritingTask; readonly revision: number } {
  return {
    task: writingTaskSchema.parse({
      id: draft.id,
      title: draft.title,
      form: draft.form,
      yearLevel: draft.yearLevel,
      prompt: draft.prompt,
      timeLimitMinutes: draft.timeLimitMinutes,
      suggestedWords: draft.suggestedWords,
    }),
    revision: draft.revision,
  };
}
export type WritingDraftPacket = z.infer<typeof writingDraftPacketSchema>;
