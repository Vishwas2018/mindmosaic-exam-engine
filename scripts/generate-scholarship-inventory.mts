/**
 * Read-only audit script: Reconciles all 160 Scholarship Year 6 questions against current repository facts.
 * Generates docs/reviews/scholarship-2026-10-18/scholarship-160-inventory.json
 */
import "./lib/allow-server-only.mts";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { canonicalQuestionHash } from "../src/features/content-governance/publication-integrity";
import { candidateQuestionSchema } from "../src/features/question-factory/ingestion/candidate-question";
import { hashJson } from "../src/features/question-factory/provenance/content-hash";
import { buildPublishedQuestion } from "../src/features/question-factory/publication/build-published-question";
import { isScholarshipAttestedItem, verifyFirstPartyScholarshipAttestation } from "../src/features/question-factory/correctness/scholarship-attestation";
import { computeSolver, solverAnswerError } from "../src/features/question-factory/correctness/solver-verification";
import { estimateDifficulty, computeDifficultyDeviation } from "../src/features/question-factory/difficulty/estimate-difficulty";
import { FACTORY_THRESHOLDS } from "../src/features/question-factory/config";

const draftsDir = "content/scholarship-drafts";
const sections = [
  { key: "nr", file: "scholarship-y6-numerical-reasoning-draft.json", title: "Numerical Reasoning", judgement: false },
  { key: "maths", file: "scholarship-y6-mathematics-draft.json", title: "Mathematics", judgement: false },
  { key: "vr", file: "scholarship-y6-verbal-reasoning-draft.json", title: "Verbal Reasoning", judgement: true },
  { key: "rc", file: "scholarship-y6-reading-draft.json", title: "Reading Comprehension", judgement: true },
] as const;

const revised = new Set(JSON.parse(readFileSync("docs/reviews/scholarship-2026-10-18/revised-in-this-release.json", "utf8")) as string[]);
const recs = (JSON.parse(readFileSync("docs/reviews/scholarship-2026-10-18/difficulty/difficulty-recommendations.json", "utf8")) as { recommendations: Record<string, { recommendation: string; rationale: string }> }).recommendations;

const inventory: Record<string, unknown>[] = [];

for (const s of sections) {
  const p = JSON.parse(readFileSync(path.join(draftsDir, s.file), "utf8")) as {
    questions: Array<{
      id: string;
      prompt: string;
      stimulus?: { body?: string };
      options: Array<{ id: string; text: string }>;
      explanation: string;
      answerKey: { optionId: string };
      metadata: { difficulty: string; skill: string };
    }>;
    parameters?: Record<string, { solver?: string; ruleOrientation?: "row" | "column" | "diagonal"; solverParams?: { ruleOrientation?: "row" | "column" | "diagonal" }; correctValue?: string | number }>;
  };

  for (const q of p.questions) {
    const candidate = candidateQuestionSchema.parse(q);
    const built = buildPublishedQuestion(candidate);
    const d1 = hashJson(q);
    const d2 = hashJson(candidate);
    const d3 = built.ok ? canonicalQuestionHash(built.question) : null;

    let solverStatus = "none";
    let solverVerified = false;
    let solverDetails = "";
    if (isScholarshipAttestedItem(q as never)) {
      const a = verifyFirstPartyScholarshipAttestation(q as never);
      solverStatus = "first_party_attestation";
      solverVerified = a.ok;
      solverDetails = a.ok ? `first-party recompute = ${a.computedValue}; matches key` : `attestation failed: ${a.error}`;
    } else {
      const side = p.parameters?.[q.id];
      if (side?.solver && side.solver !== "arithmetical_reasoning") {
        solverStatus = `closed_language_${side.solver}`;
        const orientation = side.ruleOrientation || side.solverParams?.ruleOrientation;
        const c = computeSolver({ solver: side.solver, solverParams: (side.solverParams ?? {}) as Record<string, unknown>, ruleOrientation: orientation, correctValue: side.correctValue });
        if (c.ok) {
          const err = solverAnswerError(q as never, c.value);
          solverVerified = !err;
          solverDetails = err ? `mismatch: ${err}` : `closed-language solver (${side.solver}) = ${c.value}; matches key`;
        } else {
          solverDetails = `solver error: ${c.error}`;
        }
      } else {
        solverDetails = "no machine proof; human semantic judgement required";
      }
    }

    const est = estimateDifficulty({ prompt: q.prompt, stimulusBody: q.stimulus?.body, optionTexts: q.options.map((o) => o.text), explanation: q.explanation });
    const dev = computeDifficultyDeviation(est.estimatedDifficulty, q.metadata.difficulty as never);
    const gate = est.estimateConfidence < FACTORY_THRESHOLDS.MIN_DIFFICULTY_ESTIMATE_CONFIDENCE ? "blocked_low_confidence" : (dev > FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE ? "blocked_deviation" : "passes");

    const blockers: string[] = [];
    blockers.push("human_approval: No qualified human approval on file");
    blockers.push("provenance_hold: Unknown original generation; Phase 1 hold active; ADR-017 policy adopted but engineering unbuilt");
    blockers.push("originality_unassessed: No external originality engine comparison/search on file");
    blockers.push("age_curriculum_unaffirmed: No qualified human educational review on file");
    if (gate !== "passes") {
      blockers.push(`difficulty_gate: Declared ${q.metadata.difficulty} vs estimated ${est.estimatedDifficulty} (${gate})`);
    }
    if (s.judgement) {
      blockers.push("independent_review: AI-generated judgement content requires different-provider external review with freshSession: true; none on file");
    } else {
      blockers.push("editorial_interpretation_check: ADR-017 requirement 2 stem-to-solver check has never been performed by a qualified human");
    }

    let bucket = "ready_for_review";
    if (s.judgement) {
      bucket = "awaiting_external_evidence";
    } else if (gate !== "passes" || !solverVerified) {
      bucket = "requires_revision_or_decision";
    }

    inventory.push({
      id: q.id,
      section: s.key,
      sectionTitle: s.title,
      sourceFile: `content/scholarship-drafts/${s.file}`,
      revision: 0,
      hashes: {
        d1_rawQuestionHash: d1,
        d2_factoryCandidateHash: d2,
        d3_publicationContentHash: d3,
        hashDomains: "D1: raw JSON draft; D2: factory candidate schema; D3: canonical published Question",
      },
      provenanceStatus: "unverified_legacy_origin",
      originClassification: "unknown_original_generation_git_traceable",
      supportingEvidence: "Git commits traceable from 458c6f86/9ed5f3b4; original generator model/prompt unverified (ADR-017)",
      solverCapability: solverStatus,
      answerVerificationResult: {
        verified: solverVerified,
        details: solverDetails,
        key: q.answerKey.optionId,
      },
      difficulty: {
        declared: q.metadata.difficulty,
        estimator: est.estimatedDifficulty,
        deviation: dev,
        confidence: est.estimateConfidence,
        gateVerdict: gate,
        recommendation: recs[q.id]?.recommendation || "keep",
        rationale: recs[q.id]?.rationale || null,
      },
      existingReviewEvidence: {
        advisoryClaudeOpus17Oct: true,
        advisoryClaudeSonnet18Oct: true,
        advisoryOpenAi19Oct: s.judgement,
        bindsCurrentRevision: !revised.has(q.id),
        notes: revised.has(q.id) ? "Revised in 18-19 Oct remediation; earlier reviews stale" : "Unchanged since 17 Oct",
      },
      originalityStatus: "corpus_only_cleared_external_unassessed",
      ageCurriculumSuitabilityStatus: "advisory_aligned_human_unaffirmed",
      humanApprovalStatus: "none",
      pipelineAndPublicationEligibility: "ineligible_blocked",
      historicalBucket: bucket,
      blockingRequirements: blockers,
    });
  }
}

const outPath = "docs/reviews/scholarship-2026-10-18/scholarship-160-inventory.json";
writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalQuestions: inventory.length,
      summary: {
        ready_for_review_pipeline: inventory.filter((i) => i.historicalBucket === "ready_for_review").length,
        requires_revision_or_decision_pipeline: inventory.filter((i) => i.historicalBucket === "requires_revision_or_decision").length,
        awaiting_external_evidence_pipeline: inventory.filter((i) => i.historicalBucket === "awaiting_external_evidence").length,
        provenanceSufficientlyEstablished: 0,
        blockedOnProvenance: 160,
        blockedOnHumanApproval: 160,
        blockedOnOriginality: 160,
        blockedOnAgeCurriculumAffirmation: 160,
        blockedOnEditorialCheck: 80,
        blockedOnDifferentProviderReview: 80,
        blockedOnDifficultyGate: inventory.filter((i) => (i.difficulty as { gateVerdict: string }).gateVerdict !== "passes").length,
      },
      items: inventory,
    },
    null,
    2
  ) + "\n"
);
console.log(`Successfully generated ${outPath} with ${inventory.length} items.`);
