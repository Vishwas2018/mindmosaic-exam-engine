# Proposed Governance Schemas (Phase 2)

This document specifies the TypeScript and Zod schema extensions required to implement the Phase 2 Unknown-Origin Eligibility Policy.

---

## 1. Classification & Governance Enums

```typescript
import { z } from "zod";

export const legacyContentClassificationSchema = z.enum([
  "class_a_deterministic_math_logic",
  "class_b_judgement_verbal_reasoning",
  "class_c_stimulus_literary_passage",
]);

export type LegacyContentClassification = z.infer<typeof legacyContentClassificationSchema>;

export const legacyGovernanceRouteSchema = z.enum([
  "legacy_intake_pending",       // Imported, blocked from review/staging (Phase 1 baseline)
  "legacy_exception_approved",   // Fully vetted under Phase 2 decoupled evidence standards
  "legacy_retired_ineligible",   // Retired in favour of clean-sheet re-authoring
]);

export type LegacyGovernanceRoute = z.infer<typeof legacyGovernanceRouteSchema>;
```

---

## 2. Solver Execution Evidence Schema (Class A)

```typescript
export const solverExecutionEvidenceSchema = z.object({
  solverId: z.string().min(1),
  solverVersion: z.string().min(1),
  executedAt: z.string().datetime(),
  executionEnvironment: z.literal("first_party_isolated_test"),
  derivedAnswerOptionId: z.string().min(1),
  uniqueSolutionConfirmed: z.literal(true),
  distractorsEvaluated: z.array(
    z.object({
      optionId: z.string().min(1),
      evaluatedResult: z.literal(false),
      misconceptionCode: z.string().optional(),
    })
  ).min(3),
  formalProofHash: z.string().regex(/^[0-9a-f]{64}$/),
});

export type SolverExecutionEvidence = z.infer<typeof solverExecutionEvidenceSchema>;
```

---

## 3. Multi-Provider Review Evidence Schema (Class B & C)

```typescript
export const externalProviderReviewEntrySchema = z.object({
  provider: z.enum(["openai", "google", "meta", "mistral"]),
  modelId: z.string().min(1),
  reviewExecutedAt: z.string().datetime(),
  answerWithheldPacketSha256: z.string().regex(/^[0-9a-f]{64}$/),
  derivedOptionId: z.string().min(1),
  singleDefensibleAnswer: z.literal(true),
  verdict: z.literal("PASS"),
  clarityRating: z.enum(["excellent", "satisfactory", "needs_clarification"]),
  identifiedAmbiguities: z.array(z.string()).max(0), // Must be empty for admission
  rawResponseSha256: z.string().regex(/^[0-9a-f]{64}$/),
});

export const multiProviderConsensusEvidenceSchema = z.object({
  consensusStatus: z.literal("unanimous_agreement"),
  consensusOptionId: z.string().min(1),
  reviews: z.array(externalProviderReviewEntrySchema).min(2).refine((reviews) => {
    // Invariant: At least two distinct commercial providers
    const providers = new Set(reviews.map((r) => r.provider));
    return providers.size >= 2;
  }, { message: "Reviews must originate from at least two distinct commercial foundation model providers." }),
});

export type MultiProviderConsensusEvidence = z.infer<typeof multiProviderConsensusEvidenceSchema>;
```

---

## 4. Human Subject-Matter Expert (SME) Rubric Schema

```typescript
export const humanSmeEditorialRubricSchema = z.object({
  evaluatorIdentity: z.string().email(),
  evaluatorRole: z.enum(["curriculum_specialist", "senior_examiner", "lead_editor"]),
  evaluatedAt: z.string().datetime(),
  targetCandidateHash: z.string().regex(/^[0-9a-f]{64}$/),
  rubricScores: z.object({
    keyDefensibility: z.literal("unambiguous"),
    distractorQuality: z.enum(["high", "acceptable"]),
    ageAppropriatenessYearLevel: z.number().int().min(3).max(6),
    culturalFairnessAndNeutrality: z.literal("approved"),
    syllabusAlignment: z.literal("aligned"),
  }),
  signedNotes: z.string().min(10),
});

export type HumanSmeEditorialRubric = z.infer<typeof humanSmeEditorialRubricSchema>;
```

---

## 5. Originality & Plagiarism Attestation Schema

```typescript
export const originalityAttestationSchema = z.object({
  auditType: z.enum(["automated_ngram_web_scan", "crossref_academic_scan", "human_corpus_audit"]),
  scannedAt: z.string().datetime(),
  toolOrEngine: z.string().min(1),
  targetContentHash: z.string().regex(/^[0-9a-f]{64}$/),
  searchPhrases: z.array(z.string()).min(3),
  verbatimMatchesFound: z.literal(0),
  plagiarismRiskAssessment: z.literal("zero_risk_original_work"),
  auditorIdentity: z.string().min(1),
});

export type OriginalityAttestation = z.infer<typeof originalityAttestationSchema>;
```

---

## 6. Authenticated Human Approval Schema

```typescript
export const authenticatedApprovalSchema = z.object({
  schemaVersion: z.literal(1),
  candidateId: z.string().min(1),
  publicationContentHash: z.string().regex(/^[0-9a-f]{64}$/),
  approvedBy: z.string().email(),
  role: z.literal("repository_owner"),
  approvalTimestamp: z.string().datetime(),
  decision: z.literal("APPROVED_FOR_PUBLICATION"),
  governanceRoute: z.literal("legacy_exception_approved"),
  cryptographicSignature: z.object({
    mechanism: z.enum(["git_commit_gpg", "git_commit_ssh", "hmac_sha256"]),
    keyFingerprint: z.string().min(8),
    signaturePayload: z.string().min(1),
  }),
});

export type AuthenticatedApproval = z.infer<typeof authenticatedApprovalSchema>;
```

---

## 7. Integrated Legacy Admission Evidence Bundle

```typescript
export const legacyAdmissionEvidenceBundleSchema = z.discriminatedUnion("classification", [
  // Class A: Deterministic
  z.object({
    classification: z.literal("class_a_deterministic_math_logic"),
    solverEvidence: solverExecutionEvidenceSchema,
    originalityCheck: originalityAttestationSchema,
    externalReview: externalProviderReviewEntrySchema,
    smeSignOff: humanSmeEditorialRubricSchema.optional(),
    authenticatedApproval: authenticatedApprovalSchema,
  }),
  // Class B: Judgement Verbal Reasoning
  z.object({
    classification: z.literal("class_b_judgement_verbal_reasoning"),
    multiProviderConsensus: multiProviderConsensusEvidenceSchema,
    humanSmeRubric: humanSmeEditorialRubricSchema,
    originalityCheck: originalityAttestationSchema,
    authenticatedApproval: authenticatedApprovalSchema,
  }),
  // Class C: Stimulus Passage & RC
  z.object({
    classification: z.literal("class_c_stimulus_literary_passage"),
    passagePlagiarismAudit: originalityAttestationSchema,
    culturalSensitivitySignOff: humanSmeEditorialRubricSchema,
    itemMultiProviderConsensus: multiProviderConsensusEvidenceSchema,
    authenticatedApproval: authenticatedApprovalSchema,
  }),
]);

export type LegacyAdmissionEvidenceBundle = z.infer<typeof legacyAdmissionEvidenceBundleSchema>;
```
