import { hashJson } from "@/features/question-factory/provenance/content-hash";
import {
  runtimeContentVersionSchema,
  type ProvenanceClass,
  type PublicationProvenance,
  type RuntimeContentVersion,
} from "@/schemas/platform";
import type { Question } from "@/schemas/question.schema";

/**
 * The pure half of the Phase 1 runtime content projection (spec §9,
 * ADR-002/003).
 *
 * Deliberately has no database dependency and no `server-only` marker: it is a
 * total function from a source `Question` to the rows that represent it, so the
 * whole 1,293-item bank can be projected and checked in an ordinary unit test
 * with no Postgres anywhere. `scripts/project-runtime-content.mts` adds the
 * inserts; `scripts/shadow-compare-runtime-content.mts` adds the comparison.
 * Both call this, so what the tests prove is what the script writes.
 *
 * **The split this performs is the security boundary.** A source `Question`
 * carries prompt, options and interaction alongside `answerKey` and
 * `explanation`. §9.3 requires those to live in a separate table with no
 * learner privileges, so this function separates them and validates the
 * candidate half against `runtimeContentVersionSchema`, which is `.strict()`.
 * An answer field that leaked into candidate content is therefore a parse
 * error here, not a discovery made later in production.
 */

/** Everything the projection needs to write for one source question. */
export interface ProjectedQuestion {
  readonly itemCode: string;
  readonly origin: string;
  readonly provenanceClass: ProvenanceClass;
  readonly revision: number;
  readonly publicationManifestId: string | null;
  readonly publishedAt: string;
  /** `hashJson` over the WHOLE source question — see `contentHashOf`. */
  readonly contentHash: string;
  readonly candidate: ProjectedCandidate;
  readonly answer: ProjectedAnswer;
  readonly stimulus: ProjectedStimulus | null;
  readonly sourceScope: ProjectedSourceScope;
  /** The same content, shaped for `runtimeContentVersionSchema`. Validated. */
  readonly contract: RuntimeContentVersion;
}

export interface ProjectedCandidate {
  readonly questionType: string;
  /**
   * The answer key's discriminant — `single_option`, `manual`, `text` and ten
   * others. Candidate-visible and not answer data (ADR-006 Amendment D): the
   * legacy path has shipped it to browsers since v1, and knowing a question is
   * multiple-choice does not reveal which option is correct. Projected here so
   * that the target model can produce the same candidate DTO without any
   * application-callable function reading `item_answer_versions`.
   */
  readonly answerKind: string;
  /** Word guidance from a `manual` answer key; null for every other kind. */
  readonly minWords: number | null;
  readonly maxWords: number | null;
  readonly prompt: string;
  /** Options, interaction and instructions — never an answer. */
  readonly candidateContent: Record<string, unknown>;
  readonly visuals: readonly unknown[];
  readonly accessibility: {
    readonly altTextProvided: boolean;
    readonly answerableFromAccessibleRepresentation: boolean;
  };
  readonly estimatedTimeSeconds: number;
  readonly authoredDifficulty: string;
  readonly marksAvailable: number;
  readonly locale: string;
  readonly contentSchemaVersion: number;
}

export interface ProjectedAnswer {
  readonly answerKey: unknown;
  readonly gradingRules: Record<string, unknown>;
  readonly rubric: unknown | null;
  readonly privateExplanation: string | null;
  readonly gradingSchemaVersion: number;
}

export interface ProjectedStimulus {
  /** Stable, derived from the content hash — see `stimulusCodeOf`. */
  readonly stimulusCode: string;
  readonly contentHash: string;
  readonly content: unknown;
}

/**
 * Unresolved source scope. **Not the scope model** (ADR-002 Amendment B): these
 * are the raw facts the content carries, kept so Phase 1b can resolve them into
 * `item_scopes`/`item_skills` without re-reading the bank.
 */
export interface ProjectedSourceScope {
  readonly yearLevel: number;
  readonly examStyle: string;
  readonly subject: string;
  readonly skill: string | null;
  /**
   * Also candidate-visible, and carried for the same reason as `answerKind`:
   * `CandidateQuestion.metadata` promises them, and a target-model paper must
   * produce that DTO without inventing taxonomy (ADR-006 Amendment D). They
   * join this family rather than sitting beside it so they are resolved into
   * `item_scopes`/`item_skills` and dropped together at Phase 3.
   */
  readonly strand: string;
  readonly topic: string;
  readonly tags: readonly string[];
}

/**
 * A question's projection identity.
 *
 * Hashed over the entire source question EXCEPT its id — prompt, options,
 * interaction, visuals, stimulus, metadata AND the answer key — with the
 * question factory's own `hashJson` (recursive key sort, then
 * newline-normalised SHA-256).
 *
 * Excluding the id is what gives `item_versions_content_hash_key` teeth. With
 * the id inside the hash, two items could never collide however identical their
 * content, and the global uniqueness constraint would be a tautology. Without
 * it, the constraint means what ADR-003 §8 says it means — same content is the
 * same content — and duplicated material published under two codes is caught
 * rather than stored twice. Verified against the real bank: 1,293 items,
 * 1,293 distinct id-stripped hashes, so nothing is currently duplicated.
 *
 * Three further consequences, all wanted:
 *
 *  1. Curated and factory items hash by the same rule, so one global uniqueness
 *     constraint covers both pools and the two are directly comparable
 *     (ADR-003 Amendment A2).
 *  2. Any learner-visible change produces a new hash, which is what ADR-003 §2
 *     requires a new revision for.
 *  3. Because the answer is inside the hash, the shadow-compare proves the
 *     answer round-tripped too — a hash is not content, so nothing is exposed
 *     by including it.
 *
 * NOTE: this is NOT the same value as a factory manifest's own `contentHash`.
 * That one is computed over a different representation at generation time
 * (verified: 0 of 288 manifests match `hashJson(manifest.question)`), so the
 * projection preserves it separately on `publication_manifests.content_hash`
 * and never claims the two are equal.
 */
export function contentHashOf(question: Question): string {
  const content: Record<string, unknown> = { ...(question as unknown as Record<string, unknown>) };
  delete content.id;
  return hashJson(content);
}

/** Stable stimulus identity: identical passages collapse to one code. */
export function stimulusCodeOf(contentHash: string): string {
  return `stim-${contentHash.slice(0, 24)}`;
}

/**
 * A programme-offering reference derived from the source facts, so the
 * candidate content satisfies `runtimeContentVersionSchema`'s `scopes`
 * requirement in Phase 1.
 *
 * Derived, not authoritative. There is no `programme_offerings` table yet and
 * this creates no row and no foreign key; Phase 1b replaces it with a resolved
 * `item_scopes` mapping. It is included because the alternative — relaxing the
 * schema's `scopes: min(1)` — would weaken a Phase 0 contract to accommodate a
 * temporary gap.
 */
function derivedScope(question: Question) {
  return {
    family: question.examStyle,
    programmeId: `${question.examStyle}-${question.metadata.subject}`.replace(/_/g, "-"),
    subjectId: question.metadata.subject,
    yearLevel: question.yearLevel,
    locale: question.metadata.locale,
    // Existing authored banks are national/global until a reviewed
    // jurisdiction-specific item-scope mapping says otherwise.
    region: "global",
  } as const;
}

function provenanceOf(
  question: Question,
  source: ProjectionSource,
): PublicationProvenance {
  if (source.provenanceClass === "curated_git_authored") {
    return {
      provenanceClass: "curated_git_authored",
      governedBy: "scripts/validate-question-bank.mts",
      publishedAt: source.publishedAt,
    };
  }
  return {
    provenanceClass: "factory_manifest",
    manifestId: source.manifestId,
    manifestSchemaVersion: source.manifestSchemaVersion,
    factoryCandidateState: "published",
    ...(source.correctnessBasis ? { correctnessBasis: source.correctnessBasis } : {}),
    reviewEvidenceKind: source.reviewEvidenceKind,
    publishedAt: source.publishedAt,
    ...(source.blueprintId ? { blueprintId: source.blueprintId } : {}),
  };
}

/** What the caller knows about where this question came from. */
export type ProjectionSource =
  | {
      readonly provenanceClass: "curated_git_authored";
      readonly publishedAt: string;
    }
  | {
      readonly provenanceClass: "factory_manifest";
      readonly manifestId: string;
      readonly manifestSchemaVersion: number;
      /** Absent on every current manifest; see the schema's note. */
      readonly correctnessBasis?: "deterministic" | "independent_semantic_review";
      readonly reviewEvidenceKind: "verified_chain" | "recovered_unverifiable" | "none";
      readonly publishedAt: string;
      readonly revision: number;
      readonly blueprintId?: string;
    };

/**
 * The `items.id` a projected row belongs to. Supplied by the caller because
 * `runtimeContentVersionSchema.itemId` is a UUID and the source bank has no
 * UUIDs — the database generates them. The projection script passes the real
 * one; tests pass a fixture. Never derived from content, so it stays stable
 * across revisions of the same item.
 */
export interface ProjectionContext {
  readonly itemId: string;
  readonly source: ProjectionSource;
}

/**
 * A question's stimulus, if it carries one.
 *
 * Hashed with the SAME `hashJson`, so two questions embedding a byte-identical
 * passage produce one `stimulus_versions` row. Measured over the real bank: 237
 * questions carry a stimulus, 85 are distinct, and the most-shared passage is
 * used by 15 questions.
 */
export function projectStimulus(question: Question): ProjectedStimulus | null {
  const stimulus = (question as unknown as { stimulus?: unknown }).stimulus;
  if (stimulus === undefined || stimulus === null) return null;
  const contentHash = hashJson(stimulus);
  return { stimulusCode: stimulusCodeOf(contentHash), contentHash, content: stimulus };
}

export function projectQuestion(
  question: Question,
  context: ProjectionContext,
): ProjectedQuestion {
  const { source } = context;
  const contentHash = contentHashOf(question);
  const stimulus = projectStimulus(question);

  /*
   * Candidate content: everything a learner may see, and nothing else. Listed
   * positively rather than by deleting answer fields from a spread — a spread
   * would silently carry any future answer-bearing field straight through, and
   * this is the one place where that mistake is unrecoverable.
   */
  const candidateContent: Record<string, unknown> = {
    options: question.options ?? [],
    ...(question.interaction ? { interaction: question.interaction } : {}),
    ...((question as unknown as { instructions?: string }).instructions
      ? { instructions: (question as unknown as { instructions: string }).instructions }
      : {}),
  };

  const visuals = (question.visuals ?? []) as readonly unknown[];

  /*
   * `altTextProvided` is checkable here: the visual schema already requires
   * non-trivial alt text on every visual, so "every visual has alt text" is a
   * fact about the row. `answerableFromAccessibleRepresentation` is NOT
   * checkable here and is deliberately conservative — spec §9.7 is explicit
   * that the mere presence of alt text is insufficient, and ADR-010 owns the
   * review standard that would let this be true. A question with no visual at
   * all is answerable from its text, which is the one case we can assert.
   */
  const everyVisualHasAltText =
    visuals.length === 0 ||
    visuals.every(
      (visual) => typeof (visual as { altText?: unknown }).altText === "string",
    );

  /* Read off the answer key, and deliberately only these three fields. The kind
     is the discriminant and the word counts are instructions to the candidate;
     neither is an answer, and `toCandidateQuestion` already puts all three on
     the legacy candidate DTO. Nothing else on the key crosses this line. */
  const manual = question.answerKey.kind === "manual" ? question.answerKey : null;

  const candidate: ProjectedCandidate = {
    questionType: question.type,
    answerKind: question.answerKey.kind,
    minWords: manual?.minWords ?? null,
    maxWords: manual?.maxWords ?? null,
    prompt: question.prompt,
    candidateContent,
    visuals,
    accessibility: {
      altTextProvided: everyVisualHasAltText,
      answerableFromAccessibleRepresentation: visuals.length === 0,
    },
    estimatedTimeSeconds: question.metadata.estimatedTimeSeconds,
    authoredDifficulty: question.metadata.difficulty,
    marksAvailable: question.metadata.marks,
    locale: question.metadata.locale,
    contentSchemaVersion: question.metadata.schemaVersion,
  };

  const answer: ProjectedAnswer = {
    answerKey: question.answerKey,
    /* Nothing in the current schema carries tolerances or grading options
       separately; the answer key's own discriminated shape holds them. Kept as
       an empty object rather than omitted so the column is never null and
       Phase 2's scorer has one place to look. */
    gradingRules: {},
    rubric: null,
    privateExplanation: question.explanation ?? null,
    gradingSchemaVersion: 1,
  };

  const contract = runtimeContentVersionSchema.parse({
    kind: "runtime_content_version",
    schemaVersion: 1,
    itemId: context.itemId,
    itemCode: question.id,
    /* THE runtime_revision (Gate A item A12): item_versions.revision is
       1-based and monotonic by contract (runtimeContentVersionSchema's
       revisionSchema is `.positive()`), which is a fact about this row, not
       about the manifest. `source.revision` — what becomes
       publication_manifests.revision — is left exactly as the manifest
       recorded it, including 0; this is the one and only place that floor is
       applied, on a value that is never written back to the manifest table. */
    revision: source.provenanceClass === "factory_manifest" ? Math.max(1, source.revision) : 1,
    questionType: candidate.questionType,
    answerKind: candidate.answerKind,
    ...(candidate.minWords === null ? {} : { minWords: candidate.minWords }),
    ...(candidate.maxWords === null ? {} : { maxWords: candidate.maxWords }),
    prompt: candidate.prompt,
    candidateContent: candidate.candidateContent,
    visuals: [...candidate.visuals] as Record<string, unknown>[],
    accessibility: candidate.accessibility,
    estimatedTimeSeconds: candidate.estimatedTimeSeconds,
    authoredDifficulty: candidate.authoredDifficulty,
    marksAvailable: candidate.marksAvailable,
    locale: candidate.locale,
    contentSchemaVersion: candidate.contentSchemaVersion,
    contentHash,
    provenance: provenanceOf(question, source),
    scopes: [derivedScope(question)],
    skills: [],
    ...(stimulus
      ? {
          stimulus: {
            stimulusId: stimulus.stimulusCode,
            stimulusRevision: 1,
            contentHash: stimulus.contentHash,
          },
        }
      : {}),
  });

  return {
    itemCode: question.id,
    origin: question.origin,
    provenanceClass: source.provenanceClass,
    revision: contract.revision,
    publicationManifestId:
      source.provenanceClass === "factory_manifest" ? source.manifestId : null,
    publishedAt: source.publishedAt,
    contentHash,
    candidate,
    answer,
    stimulus,
    sourceScope: {
      yearLevel: question.yearLevel,
      examStyle: question.examStyle,
      subject: question.metadata.subject,
      skill: question.metadata.skill ?? null,
      strand: question.metadata.strand,
      topic: question.metadata.topic,
      tags: question.metadata.tags,
    },
    contract,
  };
}

/** Field names that must never appear in projected candidate content (§9.3). */
export const ANSWER_BEARING_FIELDS = [
  "answerKey",
  "answer",
  "correctOptionId",
  "explanation",
  "rubric",
  "gradingRules",
  "markingGuidance",
] as const;

/**
 * Independent check that the candidate/answer split held, run over the
 * serialised candidate row rather than the object graph.
 *
 * `runtimeContentVersionSchema` being `.strict()` already rejects an
 * answer-bearing key at the TOP level. This catches one nested inside
 * `candidateContent` or a visual, where `.strict()` does not reach because
 * those are `z.record`/`z.unknown` by necessity — the interaction shapes vary
 * by question type and cannot be enumerated here without duplicating the
 * question schema.
 */
export function findAnswerLeaks(candidate: ProjectedCandidate): readonly string[] {
  const leaks: string[] = [];
  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((entry, index) => walk(entry, `${path}[${index}]`));
      return;
    }
    if (value === null || typeof value !== "object") return;
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if ((ANSWER_BEARING_FIELDS as readonly string[]).includes(key)) {
        leaks.push(`${path}.${key}`);
      }
      walk(nested, `${path}.${key}`);
    }
  };
  walk(candidate.candidateContent, "candidateContent");
  walk(candidate.visuals, "visuals");
  return leaks;
}
