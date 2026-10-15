import { verifyUpstreamGateChain } from "../gate-chain";
import type { CandidateQuestion } from "../ingestion/candidate-question";
import type { CandidateProvenance } from "../provenance";
import { hashJson } from "../provenance";
import type { FactoryRepository } from "../storage";
import type { PublicationIssue } from "./types";

export interface PublicationEligibilityContext {
  readonly candidateId: string;
  readonly question: CandidateQuestion;
  readonly provenance: CandidateProvenance;
}

export type PublicationEligibilityResult =
  | {
      readonly ok: true;
      readonly originalityFingerprint: string;
      readonly difficultyFingerprint: string;
      /** How correctness was established — stamped onto the manifest by P0-B. */
      readonly correctnessEstablishedBySemanticReview: boolean;
    }
  | { readonly ok: false; readonly issues: readonly PublicationIssue[] };

function issue(code: PublicationIssue["code"], path: string, message: string): PublicationIssue {
  return { code, path, message };
}

/**
 * Extracts the primary numeric token from an option or text string.
 * Handles negative signs, currency symbols, thousands separators (commas),
 * decimals, and extracts only the first numeric token to prevent digit
 * concatenation (e.g. "2 hours 30 minutes" -> 2, not 230).
 */
export function parsePrimaryNumericToken(text: string): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/[-+]?(?:\$\s*)?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!match) return null;
  const cleaned = match[0].replace(/[$,\s]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * The publication gate's eligibility check — re-verified fresh at publish
 * time, never inferred from the candidate having once reached `staged`.
 * Every check here recomputes or re-reads governance evidence rather than
 * trusting a stored claim, per the codebase-wide "no report-only
 * transition" / "recompute fingerprints before trust" discipline every
 * other gate orchestrator already follows:
 *
 * 1. **Content-hash integrity** — the staged question content must still
 *    hash to the provenance-recorded `contentHash`; a mismatch means the
 *    record was edited after staging without going back through the
 *    gates, which is always refused.
 * 2. **No fixture-generated content in production** — `deterministic_fixture`
 *    candidates can legitimately reach `staged` (useful for pipeline/
 *    staging tests) but must never cross into `published`, per the
 *    Mission 3 contract's unconditional, non-configurable rule.
 * 3. **The whole upstream gate chain still holds** — `verifyUpstreamGateChain`
 *    re-checks structural, correctness, semantic (where correctness could
 *    not be established deterministically), originality and difficulty,
 *    each bound to this exact candidate id/content hash/revision. This is
 *    what keeps the anti-plagiarism, correctness and calibration guarantees
 *    intact end-to-end *through* publication rather than only up to the gate
 *    that first produced each one, and catches evidence that has gone stale
 *    between staging and publication (e.g. a corpus/version drift).
 *
 * P0-A: checks 3 and 4 were originally originality and difficulty *only*,
 * which is how 132 questions whose correctness report said `review_required`
 * reached learners. See `gate-chain/verify-gate-chain.ts` and
 * `docs/reports/publication-288-posthoc-audit.md`.
 */
export async function checkPublicationEligibility(
  context: PublicationEligibilityContext,
  repository: FactoryRepository,
): Promise<PublicationEligibilityResult> {
  const issues: PublicationIssue[] = [];
  const { candidateId, question, provenance } = context;

  if (hashJson(question) !== provenance.contentHash) {
    issues.push(
      issue(
        "publication_content_hash_mismatch",
        "provenance.contentHash",
        "Stored content hash no longer matches the staged candidate's question content.",
      ),
    );
  }

  if (provenance.generatorAdapter.class === "deterministic_fixture") {
    issues.push(
      issue(
        "publication_refused_fixture_generator",
        "provenance.generatorAdapter.class",
        "Deterministic-fixture-generated candidates can never be published to the production bank, regardless of lifecycle progress.",
      ),
    );
  }

  // Re-run solver when solverParams sidecar is present on the candidate
  if (question.solverParams) {
    const sp = question.solverParams;
    let computedValue: unknown;
    try {
      switch (sp.solver) {
        case "number_series": {
          const { solveNumberSeries } = await import("@/features/scholarship/solvers/number-series");
          const res = solveNumberSeries(sp.solverParams as unknown as Parameters<typeof solveNumberSeries>[0]);
          if (!res.unique) {
            issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
          } else {
            computedValue = res.value;
          }
          break;
        }
        case "number_matrix": {
          if (!sp.ruleOrientation || !["row", "column", "diagonal"].includes(sp.ruleOrientation)) {
            issues.push(
              issue(
                "publication_solver_verification_failed",
                "solverParams.ruleOrientation",
                "Number matrix solverParams must explicitly declare ruleOrientation ('row', 'column', or 'diagonal').",
              ),
            );
          } else {
            const { solveNumberMatrix } = await import("@/features/scholarship/solvers/number-matrices");
            const res = solveNumberMatrix({
              ...(sp.solverParams as unknown as Record<string, unknown>),
              ruleOrientation: sp.ruleOrientation,
            } as unknown as Parameters<typeof solveNumberMatrix>[0]);
            if (!res.unique) {
              issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
            } else {
              computedValue = res.value;
            }
          }
          break;
        }
        case "letter_series": {
          const { solveLetterSeries } = await import("@/features/scholarship/solvers/letter-series");
          const res = solveLetterSeries(sp.solverParams as unknown as Parameters<typeof solveLetterSeries>[0]);
          if (!res.unique) {
            issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
          } else {
            computedValue = res.value;
          }
          break;
        }
        case "coded_words": {
          const { solveCode } = await import("@/features/scholarship/solvers/coded-words");
          const res = solveCode(sp.solverParams as unknown as Parameters<typeof solveCode>[0]);
          if (!res.unique) {
            issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
          } else {
            computedValue = res.value;
          }
          break;
        }
        case "syllogism": {
          const { solveSyllogism } = await import("@/features/scholarship/solvers/syllogism");
          const res = solveSyllogism(sp.solverParams as unknown as Parameters<typeof solveSyllogism>[0]);
          if (!res.unique) {
            issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
          } else {
            computedValue = res.value;
          }
          break;
        }
        case "arithmetical_reasoning": {
          const { solveArithmeticalReasoning } = await import(
            "@/features/scholarship/solvers/arithmetical-reasoning"
          );
          const constraintsList = (sp.solverParams.constraints as string[]) ?? [];
          const constraintFns = constraintsList.map((str) => {
            return (env: Record<string, number>) => {
              const keys = Object.keys(env);
              const vals = Object.values(env);
              const fn = new Function(...keys, `return (${str});`);
              return Boolean(fn(...vals));
            };
          });
          const res = solveArithmeticalReasoning({
            variables: (sp.solverParams.variables as unknown as Parameters<typeof solveArithmeticalReasoning>[0]["variables"]) ?? [],
            constraints: constraintFns,
            targetVariable: sp.solverParams.targetVariable as string,
          });
          if (!res.unique) {
            issues.push(issue("publication_solver_verification_failed", "solverParams", `Solver failed: ${res.error}`));
          } else {
            computedValue = res.value;
          }
          break;
        }
        default: {
          issues.push(
            issue(
              "publication_solver_verification_failed",
              "solverParams.solver",
              `Unsupported solver type '${(sp as { solver: string }).solver}'. Unsupported solvers fail and never pass with a warning.`,
            ),
          );
        }
      }

      const key = question.answerKey;
      if (key.kind === "single_option") {
        const chosenOpt = question.options.find((o) => o.id === key.optionId);
        if (!chosenOpt) {
          issues.push(
            issue(
              "publication_solver_verification_failed",
              "answerKey.optionId",
              `Answer key option '${key.optionId}' not found in question options.`,
            ),
          );
        } else {
          const chosenText = chosenOpt.text.trim();
          const expectedStr = sp.correctValue !== undefined ? String(sp.correctValue).trim() : undefined;

          if (expectedStr !== undefined && chosenText !== expectedStr) {
            issues.push(
              issue(
                "publication_solver_verification_failed",
                "answerKey",
                `Answer option '${chosenOpt.id}' text '${chosenText}' does not match solverParams.correctValue '${expectedStr}'.`,
              ),
            );
          }

          const optNum = parsePrimaryNumericToken(chosenText);
          const compNum =
            typeof computedValue === "number"
              ? computedValue
              : parsePrimaryNumericToken(String(computedValue));

          const exactMatch = chosenText === String(computedValue).trim();
          const numericMatch = optNum !== null && compNum !== null && optNum === compNum;

          if (!exactMatch && !numericMatch) {
            issues.push(
              issue(
                "publication_solver_verification_failed",
                "answerKey",
                `Answer option '${chosenOpt.id}' text '${chosenText}' does not match solver computed value '${computedValue}'.`,
              ),
            );
          }
        }
      } else if (key.kind === "number") {
        const compNum =
          typeof computedValue === "number"
            ? computedValue
            : parsePrimaryNumericToken(String(computedValue));

        if (compNum === null || Number.isNaN(compNum)) {
          issues.push(
            issue(
              "publication_solver_verification_failed",
              "answerKey",
              `Solver computed non-numeric value '${computedValue}' for number-entry question.`,
            ),
          );
        } else {
          const tolerance = key.tolerance ?? 0;
          const diff = Math.abs(key.value - compNum);
          if (diff > tolerance) {
            issues.push(
              issue(
                "publication_solver_verification_failed",
                "answerKey.value",
                `Number answer key value ${key.value} does not match solver computed value ${compNum} (tolerance: ${tolerance}).`,
              ),
            );
          }
        }
      } else {
        issues.push(
          issue(
            "publication_solver_verification_failed",
            "answerKey.kind",
            `Solver verification is not supported for answer key kind '${key.kind}'. Only 'single_option' and 'number' are verified.`,
          ),
        );
      }
    } catch (err: unknown) {
      issues.push(
        issue(
          "publication_solver_verification_failed",
          "solverParams",
          `Solver execution threw an exception: ${err instanceof Error ? err.message : String(err)}`,
        ),
      );
    }
  }

  const gateChain = await verifyUpstreamGateChain({ candidateId, provenance }, repository);
  if (!gateChain.ok) {
    for (const entry of gateChain.failures) {
      issues.push(issue("publication_upstream_evidence_invalid", entry.path, entry.message));
    }
  }

  if (issues.length > 0 || !gateChain.ok) return { ok: false, issues };
  return {
    ok: true,
    originalityFingerprint: gateChain.originalityFingerprint,
    difficultyFingerprint: gateChain.difficultyFingerprint,
    correctnessEstablishedBySemanticReview: gateChain.correctnessEstablishedBySemanticReview,
  };
}
