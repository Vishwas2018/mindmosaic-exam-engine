import { readFileSync } from "node:fs";
import { isReservedMockExamQuestion } from "../../../src/features/scholarship-prep/lib/practice";
import { scholarshipWrittenExpressionRubric } from "../../../src/features/writing/rubrics/scholarship-written-expression";
import { visualSchema } from "../../../src/schemas/visual.schema";

const input: { ids: string[]; diagrams: unknown[] } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const diagrams = input.diagrams.map((diagram) => visualSchema.parse(diagram));
console.log(JSON.stringify({
  mockIds: input.ids.filter(isReservedMockExamQuestion),
  rubric: scholarshipWrittenExpressionRubric,
  visualCount: diagrams.length,
}));
