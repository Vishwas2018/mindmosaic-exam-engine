import { z } from "zod";

import { contentHashSchema, revisionSchema, schemaVersionSchema } from "./common";

const uuidSchema = z.string().uuid();

export const itemGroupMemberSchema = z.object({
  itemVersionId: uuidSchema,
  ordinal: z.number().int().positive(),
  partLabel: z.string().trim().min(1).max(20).optional(),
});

export const itemGroupVersionSchema = z
  .object({
    kind: z.literal("item_group_version"),
    schemaVersion: schemaVersionSchema,
    itemGroupId: uuidSchema,
    revision: revisionSchema,
    title: z.string().trim().min(1).max(160),
    sharedInstructions: z.string().trim().min(1).max(1000).optional(),
    stimulusVersionIds: z.array(uuidSchema).min(1).max(8),
    members: z.array(itemGroupMemberSchema).min(2).max(30),
    accessibility: z.object({
      readingOrder: z.array(z.string().trim().min(1).max(100)).min(1),
      answerableFromAccessibleRepresentation: z.boolean(),
      accommodationNotes: z.string().trim().min(1).max(1000).optional(),
    }),
    contentHash: contentHashSchema,
  })
  .superRefine((group, context) => {
    const ordinals = group.members.map((member) => member.ordinal);
    const expected = group.members.map((_, index) => index + 1);
    if (new Set(ordinals).size !== ordinals.length || ordinals.some((value, index) => value !== expected[index])) {
      context.addIssue({ code: "custom", path: ["members"], message: "Group member ordinals must be unique and contiguous from 1." });
    }
    if (new Set(group.members.map((member) => member.itemVersionId)).size !== group.members.length) {
      context.addIssue({ code: "custom", path: ["members"], message: "An item version may appear only once in a group version." });
    }
    if (new Set(group.stimulusVersionIds).size !== group.stimulusVersionIds.length) {
      context.addIssue({ code: "custom", path: ["stimulusVersionIds"], message: "Stimulus versions must be unique and ordered." });
    }
  });

export type ItemGroupVersion = z.infer<typeof itemGroupVersionSchema>;
