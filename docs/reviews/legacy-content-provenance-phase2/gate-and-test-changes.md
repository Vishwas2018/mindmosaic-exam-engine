# Required Changes to Factory Gates and Tests (Phase 2 Engineering Roadmap)

This document itemises the concrete code modifications, gate adjustments, CLI tools, and automated regression suites required when Phase 2 is approved for implementation.

---

## 1. Core Gate Changes

### 1. `src/features/question-factory/provenance/evidence.ts`
- **Current Behaviour:**
  `isProductionGradeIndependentReview` evaluates `identitiesAreIndependentForJudgementReview(candidate.generator, review.reviewer)`. When `candidate.generator.identity` is null (as in all `kind: legacy_import` candidates), it returns `false`.
- **Proposed Phase 2 Modification:**
  Introduce branch `evaluateLegacyAdmissionReview(candidate, evidenceBundle)`:
  * If candidate is `kind: legacy_import` with `governanceRoute: "legacy_exception_approved"`, bypass standard single-provider identity check and evaluate the `LegacyAdmissionEvidenceBundle`.
  * For Class A: Verify `solverEvidence.derivedAnswerOptionId === candidate.answerKey.optionId` and `solverEvidence.uniqueSolutionConfirmed === true`.
  * For Class B: Verify `multiProviderConsensus.consensusStatus === "unanimous_agreement"` with at least 2 distinct provider identities.
  * For Class C: Verify passage plagiarism clearance and dual item consensus.
  * If `governanceRoute` is `"legacy_intake_pending"`, maintain Phase 1 behaviour (fail-closed, return `false`).

---

### 2. `src/features/question-factory/staging/orchestrate-staging.ts`
- **Current Behaviour:**
  Explicitly rejects any candidate where `provenance.kind === "legacy_import"` with error:
  `{ code: "legacy_import_staging_refused", message: "Legacy import candidates remain under governance hold..." }`.
- **Proposed Phase 2 Modification:**
  * Allow staging for `provenance.kind === "legacy_import"` IF AND ONLY IF:
    1. `candidate.governanceRoute === "legacy_exception_approved"`.
    2. A verified `authenticatedApproval` object exists, matching the candidate's canonical `publicationContentHash`.
    3. The candidate's admission evidence bundle validates against `legacyAdmissionEvidenceBundleSchema`.
  * Maintain immediate refusal for any legacy candidate lacking these three proofs.

---

### 3. `src/features/question-factory/publication/manifest-schema.ts`
- **Current Behaviour:**
  `validatePublicationSource` checks an allow-list of generator adapter classes (`curated_bank`, `synthetic_seed`, `model_generation`). Any manifest with `generatorAdapter.class === "legacy_import"` fails with `invalid_generator_attribution`.
- **Proposed Phase 2 Modification:**
  * Add `"legacy_import"` as a permitted generator adapter class strictly when accompanied by:
    1. `governanceRoute: "legacy_exception_approved"`.
    2. Valid SHA-256 reference to `content/legacy-provenance-ledger.json`.
    3. Cryptographic signature check on the approval.

---

## 2. CLI Tooling Additions

### 1. `scripts/questions-admit-legacy.mts`
Dedicated CLI tool to execute legacy admission after all required evidence is assembled:
```sh
npm run questions:admit-legacy -- \
  --candidate scholarship-y6-nr-001 \
  --evidence docs/reviews/scholarship-sample-2026-10-21/evidence/nr-001-bundle.json \
  --approval content/publication-approvals/scholarship-y6-nr-001.approval.json
```
- Performs offline validation of all schema invariants.
- Recomputes solver derivations in a clean sandbox.
- Appends the entry to `content/legacy-provenance-ledger.json`.
- Updates candidate factory record from `legacy_intake_pending` to `legacy_exception_approved`.

### 2. `scripts/legacy-verify-ledger.mts`
Integrated into `npm run questions:validate-ledger`:
- Ensures every candidate with `governanceRoute: "legacy_exception_approved"` has an untampered ledger row.
- Re-verifies all hashes across raw question, candidate, factory, and publication states.

---

## 3. Required Regression Test Suites

### 1. `src/tests/unit/question-factory/legacy-admission-gates.test.ts`
A comprehensive 25+ test suite covering:
- **Refusal Tests:**
  * Legacy candidate with missing solver evidence fails Class A admission.
  * Legacy candidate with single-provider review fails Class B admission.
  * Legacy candidate with 2 reviews from the SAME provider (e.g. OpenAI GPT-4o and GPT-4o-mini) fails Class B admission (anti-collusion check).
  * Legacy candidate with missing originality clearance fails Class C admission.
  * Unsigned approval or hash-mismatched approval fails staging.
- **Passing Tests:**
  * Valid Class A bundle clears solver gate, staging, and publication assembly.
  * Valid Class B bundle with OpenAI + Gemini reviews and SME rubric clears staging.
- **Tampering Resistance:**
  * Attempt to mutate `kind: "legacy_import"` into `kind: "generated"` fails publication compilation.

### 2. Extended Pre-Commit Verification Gate
Update CI `ci.yml` core job to include:
```yaml
- run: npm run test:legacy-admission
- run: npm run questions:validate-ledger
```
Ensuring no drift or regressions can enter `dev` or `main`.
