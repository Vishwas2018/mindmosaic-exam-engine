import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import type { WritingPromptSubject } from "@/features/content-governance/approval-verification";
import { writingDraftPacketSchema, writingDraftToTask } from "@/features/writing/draft";

export const WRITING_DRAFTS_DIRECTORY = "content/writing-drafts";

/**
 * The reviewable subjects for the writing drafts: exactly the task a child
 * would see, never the authoring metadata. A missing folder is "no drafts"
 * (a script run elsewhere, such as the isolated CLI boundary tests, has none).
 * An invalid packet is an error: a review sheet must never be built from
 * content that does not parse.
 */
export async function loadWritingDraftSubjects(directory = WRITING_DRAFTS_DIRECTORY): Promise<WritingPromptSubject[]> {
  let files: string[];
  try {
    files = (await readdir(directory)).filter((name) => name.endsWith("-draft.json")).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const subjects: WritingPromptSubject[] = [];
  for (const file of files) {
    const parsed = writingDraftPacketSchema.safeParse(JSON.parse(await readFile(path.join(directory, file), "utf8")));
    if (!parsed.success) {
      throw new Error(`${file}: not a valid writing draft packet (${parsed.error.issues[0]?.message ?? "invalid"}).`);
    }
    for (const draft of parsed.data.prompts) subjects.push(writingDraftToTask(draft));
  }
  return subjects;
}
