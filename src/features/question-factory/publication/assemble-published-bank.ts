import { questionSchema, type Question } from "@/schemas/question.schema";
import { validateHumanApproval, validatePublicationSource } from "@/features/content-governance/publication-integrity";

import { isScholarshipAttestedItem, verifyFirstPartyScholarshipAttestation } from "../correctness/scholarship-attestation";
import type { FactoryRepository } from "../storage";
import type { PublicationManifest } from "./types";

export interface AssembledPublishedBank {
  readonly questions: readonly Question[];
  /** Non-fatal: a warning means one manifest was skipped, never that the whole assembly failed. */
  readonly warnings: readonly string[];
  /** Manifests left untouched because an explicit `onlySubject` or `onlyExamStyle` scope excluded them. Never served by this assembly. */
  readonly outOfScope: number;
}

export interface AssemblyOptions {
  /**
   * Programme-scoped assembly: only manifests whose embedded question has this subject are
   * assembled, and every one of them is held to the full strict checks (any failure is a
   * warning and the caller refuses). Manifests of other subjects are not read as published here.
   */
  readonly onlySubject?: string;
  /**
   * Programme-scoped strict assembly. Only manifests whose embedded question has this exam style are
   * assembled, and every one of them is held to the full strict checks (any failure is a warning and the
   * caller refuses). Manifests of other styles are neither read as published nor modified here.
   */
  readonly onlyExamStyle?: string;
  /**
   * Leaves manifests of this exam style to their own strict scoped assembly, so one manifest can never enter
   * two served pools.
   */
  readonly excludeExamStyle?: string;
}

/** Scholarship pool ids are the stable draft ids; anything else claiming the style is refused. */
export const SCHOLARSHIP_QUESTION_ID = /^scholarship-y\d{1,2}-(?:maths|nr|vr|rc)-\d{3}$/;

/** An approval must name a person. A model, tool or service name is never human sign-off. */
const NON_HUMAN_APPROVER = /\b(?:claude|anthropic|opus|sonnet|haiku|gpt|chatgpt|openai|gemini|copilot|codex|llm|bot|automated?|ai)\b/i;

/**
 * Extra checks every scholarship manifest must pass before the shared approval checks run. Returns the
 * warning text, or undefined when the manifest is acceptable. Approval validity itself (fingerprint, revision,
 * source hash, content hash) is decided by `validateHumanApproval`, exactly as for every other programme.
 */
export function scholarshipStrictProblem(
  candidateId: string,
  question: Question,
  manifest: PublicationManifest,
): string | undefined {
  if (!SCHOLARSHIP_QUESTION_ID.test(question.id)) {
    return `Manifest '${candidateId}' has scholarship style but id '${question.id}' is not a scholarship pool id; refused.`;
  }
  if (question.yearLevel !== 6) {
    return `Manifest '${candidateId}' is a scholarship item outside Year 6; refused.`;
  }
  const approver = (manifest.humanApproval as { approvedBy?: unknown } | undefined)?.approvedBy;
  if (typeof approver === "string" && NON_HUMAN_APPROVER.test(approver)) {
    return `Manifest '${candidateId}' embeds an approval signed by '${approver}', which is not a human; refused.`;
  }
  if (isScholarshipAttestedItem(question)) {
    const attested = verifyFirstPartyScholarshipAttestation(question);
    if (!attested.ok) {
      return `Manifest '${candidateId}' fails first-party answer attestation (${attested.error ?? "unknown"}); refused.`;
    }
  }
  return undefined;
}

/**
 * The production-bank assembly path's read side: reconstructs the
 * factory-published question pool from every manifest in the
 * `published-manifests` compartment. Each manifest's embedded `question`
 * is the exact, already-schema-validated object `orchestratePublication`
 * built at publish time; this function re-validates it against the live
 * production schema before trusting it again — defence in depth, so a
 * hand-edited manifest file on disk can never silently enter the served
 * bank — and de-duplicates/sorts deterministically by `candidateId` so
 * the assembled output never depends on filesystem listing order.
 *
 * Never touches the curated 100-question bank (`@/content/questions/
 * question-bank`) — this only ever reads the factory workspace's own
 * `published-manifests` compartment. Callers decide how (and whether) to
 * merge the result into a served bank.
 */
export async function assemblePublishedQuestions(
  repository: FactoryRepository,
  approvals: readonly unknown[] = [],
  options: AssemblyOptions = {},
): Promise<AssembledPublishedBank> {
  const candidateIds = [...(await repository.list("published-manifests"))].sort();
  const questions: Question[] = [];
  const warnings: string[] = [];
  const seenProductionIds = new Set<string>();
  const inspectedIds = new Set<string>();
  let outOfScope = 0;

  for (const candidateId of candidateIds) {
    const raw = await repository.read("published-manifests", candidateId);
    if (typeof raw !== "object" || raw === null) {
      warnings.push(`Manifest '${candidateId}' is not a readable object; skipped.`);
      continue;
    }
    const manifest = raw as PublicationManifest;
    if (
      options.excludeExamStyle !== undefined &&
      (manifest.question as { examStyle?: unknown } | undefined)?.examStyle === options.excludeExamStyle
    ) {
      outOfScope += 1;
      continue;
    }
    if (
      options.onlyExamStyle !== undefined &&
      (manifest.question as { examStyle?: unknown } | undefined)?.examStyle !== options.onlyExamStyle
    ) {
      outOfScope += 1;
      continue;
    }
    if (
      options.onlySubject !== undefined &&
      (manifest.question as { metadata?: { subject?: unknown } } | undefined)?.metadata?.subject !== options.onlySubject
    ) {
      outOfScope += 1;
      continue;
    }
    if (manifest.generatorAdapter?.class === "legacy_import") {
      warnings.push(`Manifest '${candidateId}' has unverified legacy origin; Phase 1 assembly refused.`);
      continue;
    }
    const parsed = questionSchema.safeParse(manifest.question);
    if (!parsed.success) {
      warnings.push(
        `Manifest '${candidateId}' embeds a question that no longer validates against the production schema; skipped.`,
      );
      continue;
    }
    if (parsed.data.status !== "published") {
      warnings.push(`Manifest '${candidateId}' embeds a question whose status is not 'published'; skipped.`);
      continue;
    }
    inspectedIds.add(parsed.data.id);
    if (options.onlyExamStyle === "scholarship_style") {
      const problem = scholarshipStrictProblem(candidateId, parsed.data, manifest);
      if (problem) {
        warnings.push(problem);
        continue;
      }
    }
    const source = validatePublicationSource(manifest, parsed.data);
    const matching = approvals.filter((approval) => approval && typeof approval === "object" &&
      (approval as Record<string, unknown>).questionId === parsed.data.id);
    const amc = parsed.data.metadata.subject === "amc_mathematics";
    // AMC must have exactly one external record. Its identical embedded
    // snapshot is corroboration, not a second human signature.
    if (!amc && manifest.humanApproval !== undefined) matching.push(manifest.humanApproval);
    if (amc && (matching.length !== 1 || manifest.humanApproval?.fingerprint !== (matching[0] as { fingerprint?: unknown } | undefined)?.fingerprint)) {
      warnings.push(`Manifest '${candidateId}' lacks a unique matching external AMC approval; skipped.`);
      continue;
    }
    const approved = source.ok && matching.length === 1 ? validateHumanApproval(matching[0],
      parsed.data, source.revision, source.sourceManifestHash) : undefined;
    if (!approved?.ok) {
      warnings.push(`Manifest '${candidateId}' has no valid unique revision-bound human approval; skipped.`);
      continue;
    }
    if (seenProductionIds.has(parsed.data.id)) {
      warnings.push(`Duplicate production id '${parsed.data.id}' found across published manifests; second occurrence skipped.`);
      continue;
    }
    seenProductionIds.add(parsed.data.id);
    questions.push(parsed.data);
  }

  if (options.onlyExamStyle === "scholarship_style") {
    // An approval with no manifest is evidence for something that is not published: never silently ignored.
    for (const approval of approvals) {
      const id = approval && typeof approval === "object" ? (approval as Record<string, unknown>).questionId : undefined;
      if (typeof id === "string" && id.startsWith("scholarship-") && !inspectedIds.has(id)) {
        warnings.push(`Approval for '${id}' has no scholarship manifest in scope; orphan approval refused.`);
      }
    }
  }

  return { questions: Object.freeze(questions), warnings, outOfScope };
}
