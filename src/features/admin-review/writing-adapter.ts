import { canonicalWritingPromptHash } from "@/features/content-governance/publication-integrity";
import { scholarshipWrittenExpressionRubric } from "@/features/writing/rubrics/scholarship-written-expression";
import {
  WRITING_FORMS,
  writingTaskSchema,
  type WritingForm,
  type WritingTask,
} from "@/features/writing/task";

export { buildGovernedExportCsv, type ExportSheetResult } from "./export-csv";

/**
 * Infers one of MindMosaic's five canonical `WRITING_FORMS` from a Scholarship
 * writing draft's tags and topic without introducing a new writing taxonomy.
 * "Creative" prompts map cleanly to `narrative`.
 */
export function inferWritingForm(
  topic: string,
  tags: readonly string[],
): WritingForm {
  const lowerTags = tags.map((tag) => tag.toLowerCase());
  for (const form of WRITING_FORMS) {
    if (lowerTags.includes(form)) return form;
  }
  const lowerTopic = topic.toLowerCase();
  for (const form of WRITING_FORMS) {
    if (lowerTopic.includes(form)) return form;
  }
  if (lowerTags.includes("creative") || lowerTopic.includes("creative")) {
    return "narrative";
  }
  return "narrative";
}

function buildWritingTitle(id: string, topic: string, prompt: string): string {
  const colonPrefix = prompt.split(":")[0]?.trim();
  if (
    colonPrefix &&
    colonPrefix.length >= 4 &&
    colonPrefix.length <= 60 &&
    !colonPrefix.includes(".")
  ) {
    return colonPrefix;
  }
  const cleanTopic = topic.trim();
  if (cleanTopic.length >= 4 && cleanTopic.length <= 80) {
    return `${cleanTopic} (${id})`;
  }
  return `Written Expression (${id})`;
}

/**
 * Converts a Scholarship Written Expression draft item into the exact
 * child-facing `WritingTask` validated by `writingTaskSchema` and governed by
 * `human_writing_prompt_approval` (`content/publication-approvals/writing-prompts/`).
 *
 * No new writing taxonomy is created: every prompt uses the existing
 * `scholarship-written-expression` rubric (v1, 6 criteria, human-marked).
 */
export function scholarshipWritingItemToTask(question: {
  readonly id: string;
  readonly yearLevel: number;
  readonly prompt: string;
  readonly metadata: {
    readonly topic: string;
    readonly estimatedTimeSeconds: number;
    readonly tags: readonly string[];
  };
}): { readonly task: WritingTask; readonly contentHash: string } {
  const form = inferWritingForm(question.metadata.topic, question.metadata.tags);
  const minutes = Math.min(
    60,
    Math.max(5, Math.round(question.metadata.estimatedTimeSeconds / 60)),
  );
  const task = writingTaskSchema.parse({
    id: question.id,
    title: buildWritingTitle(
      question.id,
      question.metadata.topic,
      question.prompt,
    ),
    form,
    yearLevel: question.yearLevel,
    prompt: question.prompt,
    timeLimitMinutes: minutes,
    suggestedWords: { min: 150, max: 350 },
    rubricId: scholarshipWrittenExpressionRubric.id,
  });
  return { task, contentHash: canonicalWritingPromptHash(task) };
}
