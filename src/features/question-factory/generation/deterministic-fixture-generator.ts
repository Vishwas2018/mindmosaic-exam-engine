import type { Blueprint } from "../blueprints";
import { toNumericYearLevel } from "../blueprints";
import { FACTORY_LIMITS, FACTORY_VERSIONS, normaliseIdentityOrThrow } from "../config";
import type { CandidateQuestionInput } from "../ingestion/candidate-question";
import { hashJson } from "../provenance";
import { createSeededRandom, randomInt, shuffle, type SeededRandom } from "./deterministic-random";
import type { GenerationContext, GenerationOutcome, QuestionGenerator } from "./types";

/**
 * The closed set of `(questionType, subject)` combinations this generator
 * can construct without any semantic judgement — deliberately the same
 * "mechanically checkable" subset Mission 2C's correctness verifier
 * classifies `deterministically_verifiable`, so a fixture-generated
 * candidate is guaranteed correctness-gate-passable by construction. Never
 * a best-effort guess for anything outside this set.
 */
const SUPPORTED_QUESTION_TYPES = ["number_entry", "multiple_choice"] as const;
type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

interface OperandRange {
  readonly min: number;
  readonly max: number;
}

const OPERAND_RANGE_BY_DIFFICULTY: Readonly<Record<string, OperandRange>> = {
  easy: { min: 1, max: 20 },
  medium: { min: 10, max: 100 },
  challenging: { min: 50, max: 500 },
};

function operandRangeFor(difficulty: string): OperandRange {
  return OPERAND_RANGE_BY_DIFFICULTY[difficulty] ?? OPERAND_RANGE_BY_DIFFICULTY.easy;
}

/**
 * Deterministic, content-derived candidate id for a fixture-generated
 * question. Distinct prefix (`gen-`) from manual ingestion's `ing-`
 * (`ingestion/identity.ts`) — the two identity schemes never collide, and
 * neither is derived from the other. Identical `(blueprintId, batchId,
 * pipelineRunId, seed)` always mints the same id, matching the fixture
 * generator's byte-identical-replay contract.
 */
function mintFixtureCandidateId(params: {
  readonly blueprintId: string;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly seed: string;
}): string {
  const digest = hashJson(params);
  return `gen-${digest.slice(0, 24)}`;
}

/** `seed = hashJson({blueprintId, batchId, pipelineRunId})` by default (contract §4), or the caller's explicit seed. */
function resolveSeed(context: GenerationContext): string {
  return (
    context.seed ??
    hashJson({
      blueprintId: context.blueprint.id,
      batchId: context.batchId,
      pipelineRunId: context.pipelineRunId,
    })
  );
}

function buildNumberEntryContent(
  id: string,
  blueprint: Blueprint,
  rand: SeededRandom,
): CandidateQuestionInput {
  const range = operandRangeFor(blueprint.difficulty);
  const a = randomInt(rand, range.min, range.max);
  const bRaw = randomInt(rand, range.min, range.max);
  const useSubtraction = rand() < 0.5;
  const [left, right] = useSubtraction ? [Math.max(a, bRaw), Math.min(a, bRaw)] : [a, bRaw];
  const operator = useSubtraction ? "-" : "+";
  const value = useSubtraction ? left - right : left + right;

  return {
    id,
    type: "number_entry",
    yearLevel: toNumericYearLevel(blueprint.yearLevel),
    examStyle: blueprint.examStyle,
    prompt: `What is ${left} ${operator} ${right}?`,
    options: [],
    visuals: [],
    answerKey: { kind: "number", value, tolerance: 0 },
    explanation: `${left} ${operator} ${right} = ${value}.`,
    metadata: {
      subject: "numeracy",
      strand: blueprint.strand,
      skill: blueprint.skill,
      difficulty: blueprint.difficulty,
      marks: blueprint.marks,
      estimatedTimeSeconds: blueprint.estimatedTimeSeconds,
      tags: [],
    },
  };
}

function buildMultipleChoiceContent(
  id: string,
  blueprint: Blueprint,
  rand: SeededRandom,
): CandidateQuestionInput {
  const range = operandRangeFor(blueprint.difficulty);
  const a = randomInt(rand, range.min, range.max);
  const b = randomInt(rand, range.min, range.max);
  const correct = a + b;

  const distractorOffsets = [1, -1, 2].map((multiplier) => multiplier * randomInt(rand, 1, 5));
  const values = new Set<number>([correct]);
  for (const offset of distractorOffsets) {
    let candidate = correct + offset;
    while (candidate < 0 || values.has(candidate)) {
      candidate += 1;
    }
    values.add(candidate);
  }

  const optionIds = ["opt-a", "opt-b", "opt-c", "opt-d"];
  const shuffledValues = shuffle(rand, [...values]);
  const options = optionIds.map((optionId, index) => ({
    id: optionId,
    text: String(shuffledValues[index]),
  }));
  const correctOptionId = options.find((option) => Number(option.text) === correct)!.id;

  return {
    id,
    type: "multiple_choice",
    yearLevel: toNumericYearLevel(blueprint.yearLevel),
    examStyle: blueprint.examStyle,
    prompt: `What is ${a} + ${b}?`,
    options,
    visuals: [],
    answerKey: { kind: "single_option", optionId: correctOptionId },
    explanation: `${a} + ${b} = ${correct}.`,
    metadata: {
      subject: "numeracy",
      strand: blueprint.strand,
      skill: blueprint.skill,
      difficulty: blueprint.difficulty,
      marks: blueprint.marks,
      estimatedTimeSeconds: blueprint.estimatedTimeSeconds,
      tags: [],
    },
  };
}

/**
 * Reproducible, non-publishing generator (Mission 3A §4): given the same
 * `(blueprint, blueprintHash, seed)`, produces byte-identical candidate
 * content on every run. Supports only a narrow, explicitly enumerated
 * blueprint subset (single-step numeracy arithmetic); fails closed
 * (`unsupported_blueprint`) for everything else — never a best-effort
 * guess. Never reads declared answers from external material and never
 * accesses the production question bank: every value is derived purely
 * from `context` and the seeded random stream.
 */
export class DeterministicFixtureGenerator implements QuestionGenerator {
  readonly generatorClass = "deterministic_fixture" as const;

  supportsBlueprint(blueprint: Blueprint): boolean {
    if (blueprint.subject !== "numeracy") return false;
    if (blueprint.visualType !== undefined) return false;
    if (blueprint.reasoningSteps !== 1) return false;
    if (blueprint.marks > FACTORY_LIMITS.DETERMINISTIC_FIXTURE_MAX_MARKS) return false;
    return SUPPORTED_QUESTION_TYPES.includes(blueprint.questionType as SupportedQuestionType);
  }

  async generate(context: GenerationContext): Promise<GenerationOutcome> {
    const { blueprint } = context;

    if (blueprint.marks > FACTORY_LIMITS.DETERMINISTIC_FIXTURE_MAX_MARKS) {
      return {
        status: "generation_resource_limit_exceeded",
        message: `Blueprint '${blueprint.id}' requests ${blueprint.marks} marks, exceeding the fixture generator's bound of ${FACTORY_LIMITS.DETERMINISTIC_FIXTURE_MAX_MARKS}.`,
      };
    }

    if (!this.supportsBlueprint(blueprint)) {
      return {
        status: "unsupported_blueprint",
        message: `DeterministicFixtureGenerator does not support blueprint '${blueprint.id}' (questionType='${blueprint.questionType}', subject='${blueprint.subject}', visualType='${blueprint.visualType ?? "none"}', reasoningSteps=${blueprint.reasoningSteps}).`,
      };
    }

    const seed = resolveSeed(context);
    const rand = createSeededRandom(seed);
    const id = mintFixtureCandidateId({
      blueprintId: blueprint.id,
      batchId: context.batchId,
      pipelineRunId: context.pipelineRunId,
      seed,
    });

    let candidateContent: CandidateQuestionInput;
    try {
      candidateContent =
        blueprint.questionType === "number_entry"
          ? buildNumberEntryContent(id, blueprint, rand)
          : buildMultipleChoiceContent(id, blueprint, rand);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { status: "generation_failed", message: `Fixture construction failed: ${message}` };
    }

    return {
      status: "generated",
      candidateContent,
      generatorAdapter: {
        class: "deterministic_fixture",
        identity: normaliseIdentityOrThrow("deterministic-fixture-generator"),
      },
      generatorVersion: FACTORY_VERSIONS.DETERMINISTIC_FIXTURE_GENERATOR_VERSION,
      seedUsed: seed,
    };
  }
}
