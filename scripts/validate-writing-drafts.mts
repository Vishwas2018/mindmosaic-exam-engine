/**
 * Validates content/writing-drafts against src/features/writing/draft.ts.
 *
 * Checks the packet shape, that every draft is unsigned (review and approvedBy
 * are null), that there are ten prompts with two of each form, that ids are
 * unique, and that every prompt fits a 15-minute response. It does not judge
 * originality or editorial quality, and passing it approves nothing.
 */
import fs from "node:fs";
import path from "node:path";

import { writingDraftPacketSchema } from "../src/features/writing/draft";
import { WRITING_FORMS } from "../src/features/writing/task";

const dir = path.join(process.cwd(), "content", "writing-drafts");
const failures: string[] = [];
const formCounts = new Map<string, number>();
let total = 0;

for (const file of fs.readdirSync(dir).filter((name) => name.endsWith("-draft.json"))) {
  const raw = fs.readFileSync(path.join(dir, file), "utf8");
  if (raw.charCodeAt(0) === 0xfeff) failures.push(`${file}: file must be UTF-8 without a BOM.`);
  if (/[ÃÂ�]/.test(raw)) failures.push(`${file}: possible encoding corruption (U+00C3, U+00C2 or U+FFFD).`);

  const parsed = writingDraftPacketSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    for (const issue of parsed.error.issues) failures.push(`${file}: ${issue.path.join(".")}: ${issue.message}`);
    continue;
  }
  for (const prompt of parsed.data.prompts) {
    total += 1;
    formCounts.set(prompt.form, (formCounts.get(prompt.form) ?? 0) + 1);
    const words = prompt.prompt.split(/\s+/).length;
    if (words > 90) failures.push(`${prompt.id}: prompt is ${words} words; keep the reading load small for a 15-minute task.`);
  }
}

if (total !== 10) failures.push(`expected 10 prompts, found ${total}.`);
for (const form of WRITING_FORMS) {
  if ((formCounts.get(form) ?? 0) !== 2) failures.push(`expected 2 ${form} prompts, found ${formCounts.get(form) ?? 0}.`);
}

if (failures.length > 0) {
  console.error(`Writing draft validation FAILED:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Writing drafts OK: ${total} unsigned prompts, 2 per form (${WRITING_FORMS.join(", ")}).`);
