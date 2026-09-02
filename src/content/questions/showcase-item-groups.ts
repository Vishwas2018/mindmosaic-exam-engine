import { itemGroupVersionSchema } from "@/schemas/platform";

const hash = (character: string) => character.repeat(64);

/** Original showcase/test-only group metadata. These rows are never published. */
export const showcaseItemGroups = [
  itemGroupVersionSchema.parse({
    kind: "item_group_version",
    schemaVersion: 1,
    itemGroupId: "10000000-0000-4000-8000-000000000001",
    revision: 1,
    title: "Two views of the neighbourhood garden",
    sharedInstructions: "Read both original passages, then answer parts (a) and (b).",
    stimulusVersionIds: [
      "20000000-0000-4000-8000-000000000001",
      "20000000-0000-4000-8000-000000000002",
    ],
    members: [
      { itemVersionId: "30000000-0000-4000-8000-000000000001", ordinal: 1, partLabel: "(a)" },
      { itemVersionId: "30000000-0000-4000-8000-000000000002", ordinal: 2, partLabel: "(b)" },
    ],
    accessibility: {
      readingOrder: ["passage-one", "passage-two", "part-a", "part-b"],
      answerableFromAccessibleRepresentation: true,
    },
    contentHash: hash("1"),
  }),
  itemGroupVersionSchema.parse({
    kind: "item_group_version",
    schemaVersion: 1,
    itemGroupId: "10000000-0000-4000-8000-000000000002",
    revision: 1,
    title: "Packing fruit into equal trays",
    sharedInstructions: "Use the original tray scenario for both mathematics parts.",
    stimulusVersionIds: ["20000000-0000-4000-8000-000000000003"],
    members: [
      { itemVersionId: "30000000-0000-4000-8000-000000000003", ordinal: 1, partLabel: "(a)" },
      { itemVersionId: "30000000-0000-4000-8000-000000000004", ordinal: 2, partLabel: "(b)" },
    ],
    accessibility: {
      readingOrder: ["scenario", "part-a", "part-b"],
      answerableFromAccessibleRepresentation: true,
    },
    contentHash: hash("2"),
  }),
  itemGroupVersionSchema.parse({
    kind: "item_group_version",
    schemaVersion: 1,
    itemGroupId: "10000000-0000-4000-8000-000000000003",
    revision: 1,
    title: "Cooling water investigation",
    sharedInstructions: "Use the accessible diagram and results table for all three parts.",
    stimulusVersionIds: [
      "20000000-0000-4000-8000-000000000004",
      "20000000-0000-4000-8000-000000000005",
    ],
    members: [
      { itemVersionId: "30000000-0000-4000-8000-000000000005", ordinal: 1, partLabel: "(a)" },
      { itemVersionId: "30000000-0000-4000-8000-000000000006", ordinal: 2, partLabel: "(b)" },
      { itemVersionId: "30000000-0000-4000-8000-000000000007", ordinal: 3, partLabel: "(c)" },
    ],
    accessibility: {
      readingOrder: ["diagram-description", "results-table", "part-a", "part-b", "part-c"],
      answerableFromAccessibleRepresentation: true,
    },
    contentHash: hash("3"),
  }),
] as const;
