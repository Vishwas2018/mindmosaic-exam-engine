import {
  ALLOWED_QUESTION_TYPES,
  ALLOWED_VISUAL_TYPES,
  FACTORY_LIMITS,
  FACTORY_VERSIONS,
} from "../config";
import { blueprintSchema, type Blueprint } from "../blueprints";
import { hashJson, stableStringify } from "../provenance";

/** One small, fixed, entirely original illustrative example — never a real blueprint's content, never copied from any external source. */
const RESPONSE_EXAMPLE = Object.freeze({
  type: "multiple_choice",
  yearLevel: 5,
  examStyle: "naplan_style",
  prompt: "What is 12 + 7?",
  options: [
    { id: "opt-a", text: "17" },
    { id: "opt-b", text: "19" },
    { id: "opt-c", text: "21" },
    { id: "opt-d", text: "18" },
  ],
  visuals: [],
  answerKey: { kind: "single_option", optionId: "opt-b" },
  explanation: "12 + 7 = 19.",
  metadata: {
    subject: "numeracy",
    strand: "Number and Algebra",
    skill: "numeracy.addition.two-digit",
    difficulty: "easy",
    marks: 1,
    estimatedTimeSeconds: 45,
    tags: [],
  },
});

/**
 * The canonical, ordered instruction lines every generation prompt pack
 * carries — restated verbatim from `docs/CONTENT_RULES.md`'s governing
 * rules rather than paraphrased, so the instruction can never silently
 * drift from the document that actually governs content policy. Fixed
 * order and content: two packs built from the same blueprint set always
 * produce byte-identical instructions.
 */
const INSTRUCTIONS: readonly string[] = [
  "Write every field in Australian English (en-AU spelling: colour, organise, centre, ...).",
  "Every candidate must include a complete, type-appropriate answer key. Never omit it, never leave it ambiguous.",
  "Every candidate must include an original, age-appropriate explanation that addresses the reasoning, not just the final answer.",
  "Every visual asset must include alt text. Alt text must never state or imply the correct answer.",
  "The stem, options, alt text and every non-answer field must never leak the correct answer.",
  "Visuals are structured JSON data only (the documented visual-type catalogue below) — never inline SVG, HTML, or executable markup of any kind.",
  "Content must be entirely original. Never reproduce, closely paraphrase, or lightly reword NAPLAN, ICAS, textbook, or any other commercial or copyrighted question.",
  "Do not copy, paraphrase, or otherwise draw on official NAPLAN/ICAS papers, commercial test-prep books, or any other copyrighted source. Write original content only.",
  "Respond with exactly one JSON object or array and nothing else — no prose, no markdown code fences, no commentary before or after the JSON.",
  "Do not include chain-of-thought, hidden reasoning, or a step-by-step working section — only the fields the response schema below defines.",
];

export interface PromptPackBlueprintEntry {
  readonly blueprint: Blueprint;
  readonly blueprintHash: string;
}

export interface GenerationPromptPack {
  readonly batchId: string;
  readonly promptVersion: string;
  readonly schemaVersion: string;
  readonly taxonomyVersion: string;
  readonly blueprints: readonly PromptPackBlueprintEntry[];
  readonly supportedQuestionTypes: readonly string[];
  readonly supportedVisualTypes: readonly string[];
  readonly responseSchemaDescription: string;
  readonly example: unknown;
  readonly instructions: readonly string[];
  readonly maxCandidateResponseBytes: number;
}

export interface GenerationPromptPackWithHash {
  readonly status: "built";
  readonly pack: GenerationPromptPack;
  /** `hashJson(pack)` — timestamp-independent: the pack itself carries no wall-clock field. */
  readonly promptHash: string;
}

export type PromptPackBuildFailure =
  | { readonly status: "prompt_blueprint_invalid"; readonly message: string }
  | { readonly status: "prompt_pack_limit_exceeded"; readonly message: string };

export type PromptPackBuildResult = GenerationPromptPackWithHash | PromptPackBuildFailure;

const RESPONSE_SCHEMA_DESCRIPTION =
  "Each candidate is a single JSON object with fields: type (one of supportedQuestionTypes), " +
  "yearLevel (3 or 5), examStyle (naplan_style|icas_style), prompt (string), " +
  "options (array of {id, text}, only for option-based types), " +
  "visuals (array of structured visual objects, only for supportedVisualTypes; omit or use [] otherwise), " +
  "answerKey (type-appropriate discriminated object; see the production schema's answerKey.kind union), " +
  "explanation (string), metadata ({subject, strand, skill?, difficulty, marks, estimatedTimeSeconds, tags}).";

function isValidBlueprint(value: unknown): value is Blueprint {
  return blueprintSchema.safeParse(value).success;
}

/**
 * Builds a versioned, canonically-ordered generation prompt pack for one
 * or more blueprints (contract §5). Rejects invalid or unsupported
 * blueprints *before* producing anything — every accepted blueprint has
 * already round-tripped through `blueprintSchema` and declares a
 * `questionType` (and, if present, `visualType`) actually present in the
 * live renderer registries, never hand-duplicated here.
 *
 * Deterministic: identical `blueprintInputs` (any order) always produce
 * byte-identical pack text and an identical `promptHash` — blueprints are
 * canonically sorted by id before anything else happens, and the pack
 * itself carries no wall-clock timestamp field.
 */
export function buildGenerationPromptPack(
  batchId: string,
  blueprintInputs: readonly unknown[],
): PromptPackBuildResult {
  if (blueprintInputs.length === 0) {
    return { status: "prompt_blueprint_invalid", message: "At least one blueprint is required to build a prompt pack." };
  }

  const invalid: string[] = [];
  const validated: Blueprint[] = [];
  for (const input of blueprintInputs) {
    if (!isValidBlueprint(input)) {
      const id =
        typeof input === "object" && input !== null && "id" in input
          ? String((input as { id: unknown }).id)
          : "<unknown>";
      invalid.push(id);
      continue;
    }
    validated.push(input);
  }
  if (invalid.length > 0) {
    return {
      status: "prompt_blueprint_invalid",
      message: `Blueprint(s) failed schema validation and cannot be prompted: ${invalid.join(", ")}.`,
    };
  }

  const allowedQuestionTypes: readonly string[] = ALLOWED_QUESTION_TYPES;
  const allowedVisualTypes: readonly string[] = ALLOWED_VISUAL_TYPES;

  const unsupportedTypes = validated.filter(
    (blueprint) => !allowedQuestionTypes.includes(blueprint.questionType),
  );
  if (unsupportedTypes.length > 0) {
    return {
      status: "prompt_blueprint_invalid",
      message: `Blueprint(s) declare a questionType not in the live renderer registry: ${unsupportedTypes
        .map((blueprint) => `${blueprint.id} (${blueprint.questionType})`)
        .join(", ")}.`,
    };
  }
  const unsupportedVisuals = validated.filter(
    (blueprint) => blueprint.visualType !== undefined && !allowedVisualTypes.includes(blueprint.visualType),
  );
  if (unsupportedVisuals.length > 0) {
    return {
      status: "prompt_blueprint_invalid",
      message: `Blueprint(s) declare a visualType not in the live visual registry: ${unsupportedVisuals
        .map((blueprint) => `${blueprint.id} (${blueprint.visualType})`)
        .join(", ")}.`,
    };
  }

  const canonicalBlueprints = [...validated].sort((a, b) => a.id.localeCompare(b.id));
  const blueprintEntries: PromptPackBlueprintEntry[] = canonicalBlueprints.map((blueprint) => ({
    blueprint,
    blueprintHash: hashJson(blueprint),
  }));

  const pack: GenerationPromptPack = {
    batchId,
    promptVersion: FACTORY_VERSIONS.PROMPT_VERSION,
    schemaVersion: FACTORY_VERSIONS.SCHEMA_VERSION,
    taxonomyVersion: FACTORY_VERSIONS.TAXONOMY_VERSION,
    blueprints: blueprintEntries,
    supportedQuestionTypes: [...ALLOWED_QUESTION_TYPES].sort(),
    supportedVisualTypes: [...ALLOWED_VISUAL_TYPES].sort(),
    responseSchemaDescription: RESPONSE_SCHEMA_DESCRIPTION,
    example: RESPONSE_EXAMPLE,
    instructions: INSTRUCTIONS,
    maxCandidateResponseBytes: FACTORY_LIMITS.MAX_PROMPT_PACK_BYTES,
  };

  const packBytes = Buffer.byteLength(stableStringify(pack), "utf8");
  if (packBytes > FACTORY_LIMITS.MAX_PROMPT_PACK_BYTES) {
    return {
      status: "prompt_pack_limit_exceeded",
      message: `Prompt pack for batch '${batchId}' is ${packBytes} bytes, exceeding the ${FACTORY_LIMITS.MAX_PROMPT_PACK_BYTES}-byte bound.`,
    };
  }

  return { status: "built", pack, promptHash: hashJson(pack) };
}
