import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { draftQuestionSchema, draftSidecarSchema } from "../../../scripts/lib/scholarship-draft-schema";
import { solveArithmeticalReasoning, type ConstraintVariable } from "@/features/scholarship/solvers/arithmetical-reasoning";

function parsePrimaryNumericToken(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/[-+]?(?:\$\s*)?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!match) return null;
  const cleaned = match[0].replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

describe("scholarship mathematics draft solver-backed publish re-execution", () => {
  it("proves all 40 mathematics items have valid solverParams that re-solve to their declared answer key", async () => {
    const filePath = path.resolve(process.cwd(), "content/scholarship-drafts/scholarship-y6-mathematics-draft.json");
    const raw = JSON.parse(await readFile(filePath, "utf8"));
    const questions = raw.questions as Array<Record<string, unknown>>;
    const params = raw.parameters as Record<string, unknown>;

    expect(questions.length).toBe(40);
    expect(Object.keys(params).length).toBe(40);

    for (const q of questions) {
      const qId = q.id as string;
      const sidecarRaw = params[qId];
      expect(sidecarRaw, `Missing sidecar parameters for ${qId}`).toBeDefined();

      const parsedQuestion = draftQuestionSchema.parse(q);
      const sidecar = draftSidecarSchema.parse(sidecarRaw);

      expect(sidecar.solver).toBe("arithmetical_reasoning");
      expect(sidecar.solverParams).toBeDefined();

      const sp = sidecar.solverParams!;
      const constraintsList = (sp.constraints as string[]) ?? [];
      const constraintFns = constraintsList.map((str) => {
        return (env: Record<string, number>) => {
          const keys = Object.keys(env);
          const vals = Object.values(env);
          const fn = new Function(...keys, `return (${str});`);
          return Boolean(fn(...vals));
        };
      });

      const res = solveArithmeticalReasoning({
        variables: (sp.variables as unknown as ConstraintVariable[]) ?? [],
        constraints: constraintFns,
        targetVariable: sp.targetVariable as string,
      });

      const solverErr = !res.unique ? res.error : "";
      expect(res.unique, `${qId}: solver failed to find unique solution: ${solverErr}`).toBe(true);
      if (!res.unique) continue;

      const computedValue = res.value;
      const key = parsedQuestion.answerKey;
      expect(key.kind).toBe("single_option");

      const chosenOpt = parsedQuestion.options.find((o) => o.id === key.optionId);
      expect(chosenOpt, `${qId}: answerKey option ${key.optionId} not found in options`).toBeDefined();
      if (!chosenOpt) continue;

      const chosenText = chosenOpt.text.trim();
      const computedStr = String(computedValue).trim();
      const exactMatch = chosenText === computedStr;
      const optNum = parsePrimaryNumericToken(chosenText);
      const compNum = parsePrimaryNumericToken(computedStr);
      const numericMatch =
        optNum !== null &&
        compNum !== null &&
        Math.abs(optNum - compNum) < 1e-6;

      expect(
        exactMatch || numericMatch,
        `${qId}: chosen option text '${chosenText}' does not match solver computed value '${computedStr}'`,
      ).toBe(true);
    }
  });
});
