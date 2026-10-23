# ADR-017: Governed Admission of Legacy Content with Unknown Original Authorship

- **Status:** proposed
- **Date:** 2026-10-23
- **Spec:** `docs/spec/legacy-content-unknown-origin-policy.md` (superseding Phase 1 staging/publication holds for qualifying records)
- **Phase:** 2 (Legacy Content Governance Programme)

## Context

Phase 1 (`docs/spec/legacy-content-provenance-phase1.md`, merged via PR #74 at `714ad64155b3ba3109695bf44c3d14ab7473da4c`) established a strict, fail-closed schema and repository-import mechanism for legacy content (`kind: legacy_import`, provenance version 2). Under Phase 1:
- `generatorAdapter` is `{ class: "legacy_import", identity: null }`.
- `originalGeneration` is explicitly `{ status: "unverified", provider: null, model: null, prompt: null, promptHash: null, generatedAt: null, candidateGenerationEvent: null }`.
- Repository source provenance (Git commit, path, blob SHA, raw question hash, candidate hash, publication content hash, blueprint binding, review packet binding) is immutably recorded and cryptographic preflight passes (e.g. for the 12 sample scholarship candidates in PR #73).
- **Current Hold:** Because original authorship cannot be determined, `isProductionGradeIndependentReview` (`src/features/question-factory/provenance/evidence.ts`) cannot evaluate `identitiesAreIndependentForJudgementReview` (`docs/REVIEW_INDEPENDENCE_POLICY.md`). Consequently, `orchestrateStaging` (`src/features/question-factory/staging/orchestrate-staging.ts`) and `validatePublicationSource` (`src/features/question-factory/publication/manifest-schema.ts`) fail-closed and strictly refuse any legacy record (`legacy_import_staging_refused`, `legacy_import_publication_refused`).

The 12 sample Year 6 Scholarship items in PR #73 (`dcb60a80f3f6eabdb522b20202929d2e3f328a94`) have verified Git history dating back to commits `458c6f86` and `14b1d922`, but lack original LLM API execution logs, request IDs, or authenticated generation prompts (`docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json`).

The question before the repository owner is: **May legacy content with unknown original authorship ever become eligible for staging and publication, and under what conditions?**

## Decision

The repository adopts a **Differentiated Governed Admission Model** based on content classification and decoupled evidence dimensions. Unknown-origin content is **not** treated as a single homogeneous pool, and is never granted a blanket waiver.

### 1. Separation of Content Classifications

Legacy candidates MUST be assigned to exactly one of three governance classifications:

1. **Class A — Deterministically Verifiable Reasoning & Mathematics:** Content whose logical correctness, single defensible answer key, distractor falsehood, and computational steps are conclusively provable by pure first-party algorithmic solvers without subjective interpretation.
   - *Scope:* Numerical reasoning series, arithmetic/algebraic word problems, directed number operations, percentages/rates, and formal propositional sentence logic.
   - *Sample items:* `scholarship-y6-nr-001`, `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`, `vr-032`.

2. **Class B — Judgement-Based Verbal & Conceptual Reasoning:** Content whose correctness, distractor defensibility, linguistic nuance, and curriculum calibration cannot be proven by pure computation, but instead rely on human or semantic evaluation.
   - *Scope:* Verbal analogies, vocabulary/synonyms/antonyms, contextual sentence completion, and discrete verbal reasoning.
   - *Sample items:* `scholarship-y6-vr-001`, `vr-016`.

3. **Class C — Literary Passages & Cultural/Originality Sensitive Content:** Extended reading passages, stimulus texts, creative scenarios, or culturally sensitive narrative depictions.
   - *Scope:* Reading comprehension passage stimuli and questions derived directly from passage nuance.
   - *Sample items:* `scholarship-y6-rc-001`, `rc-002`, `rc-003` (and their shared estuary passage).

---

### 2. Policy by Classification

#### Clause 2.1: Class A Admission via Deterministic Mathematical Proof
For Class A content, correctness is decoupled from authorship provenance. A Class A candidate MUST NOT be required to satisfy the different-provider review rule, as mathematical proof provides superior epistemic certainty over LLM consensus.
A Class A candidate MAY be admitted to the factory and cleared for staging and publication IF AND ONLY IF all of the following conditions are met:
1. **Deterministic Execution:** A certified first-party TypeScript solver runs in test isolation and confirms the exact correct answer and disproves all distractors.
2. **Originality & Plagiarism Scan:** Automated n-gram and web-search audit confirms the item is original and not copied from official NAPLAN, ICAS, ACER, textbook, or competitor commercial papers.
3. **External Blind Validation:** At least one external blind model evaluation confirms question clarity, single defensible answer, and age appropriateness.
4. **Human Attestation & Sign-off:** A qualified human editor confirms curriculum alignment and difficulty, and the repository owner provides an authenticated cryptographic approval.

#### Clause 2.2: Class B Admission via Multi-Provider Orthogonal Consensus
For Class B content, correctness relies on semantic judgement. Because the original generator provider is unknown, an automated check of `provider !== reviewer.provider` cannot guarantee independence (as the unknown generator might have been the same model family as the reviewer).
Therefore, Class B content MUST NOT be admitted on a single external review.
A Class B candidate MAY be admitted IF AND ONLY IF:
1. **Multi-Provider Orthogonal Consensus:** The item receives independent blind reviews from **at least two distinct, non-affiliated commercial foundation model providers** (e.g. OpenAI GPT-4o AND Google Gemini 1.5/2.5 Pro). Both providers MUST reach 100% agreement on:
   - The identical correct option.
   - `singleDefensibleAnswer: true`.
   - Verdict `PASS` with no unaddressed ambiguity warnings.
2. **Qualified Human Subject-Matter Expert (SME) Editorial Review:** An authenticated human educator or editorial specialist conducts an explicit rubric review verifying distractor strength, age appropriateness, vocabulary level, and unambiguous key defensibility.
3. **Originality Scan:** Verified zero-overlap against public and proprietary question corpuses.
4. **Fallback:** If dual-provider consensus or human SME sign-off cannot be achieved, the item MUST NOT be admitted and MUST be retired or genuinely re-authored under Clause 2.4.

#### Clause 2.3: Class C Admission via Rigorous Copyright/Originality Clearance
Because MindMosaic maintains an uncompromised **Originality Guarantee** (AGENTS.md), literary passages and narrative stimuli carrying unknown generation provenance present significant copyright, training data memorisation, and cultural sensitivity risks.
A Class C stimulus and its derived questions MAY be admitted IF AND ONLY IF:
1. **Comprehensive Plagiarism & Text Ingestion Audit:** The complete text undergoes automated multi-engine web search, academic corpus search, and published book database searching with zero verbatim or substantive matches.
2. **Cultural Sensitivity & Age-Suitability Sign-off:** Human editorial review confirms the passage depicts individuals, cultural practices, and historical/geographical contexts accurately and respectfully.
3. **Dual External Model Consensus:** All derived comprehension items pass dual external provider blind reviews per Clause 2.2.
4. **Alternative / Recommended Default:** Due to the elevated risk profile of literary stimuli, genuine **Clean-Sheet Re-Authoring** (Clause 2.4) is strongly recommended over legacy admission for reading comprehension passages.

#### Clause 2.4: Clean-Sheet Re-Authoring Pathway
Where legacy admission criteria cannot be met, or where the cost of multi-provider external audits exceeds authoring effort:
1. The legacy candidate is permanently retired from the active factory pipeline.
2. A new candidate is generated from a governed blueprint using verified-generation tooling (`kind: generated`, provenance version 1), with recorded prompt, prompt hash, provider, model ID, and execution event.
3. The new item follows the standard production review pipeline and different-provider rule.
4. The legacy item's hash and retirement rationale are archived in the provenance ledger.

---

### 3. Trust Boundary & Governance Invariants

1. **No Synthetic Provider Injection:** The system MUST NOT fabricate a fake provider (such as `"unknown"` or `"legacy"`) to force an automated independence test to evaluate true. Generator identity remains strictly `null`.
2. **Explicit Governance Route:** Admitted legacy candidates carry `governanceRoute: "legacy_exception_approved"`. They do not masquerade as standard generated items.
3. **Authenticated Human Sign-off:** Sign-offs MUST NOT be unauthenticated strings in JSON (`"approvedBy": "Alice"`). Approvals MUST be cryptographically bound to the candidate's exact `publicationContentHash` via repository-committed GPG/SSH git signatures, an HMAC-signed approval ledger, or authenticated admin credentials.
4. **Immutable Ledger:** Every legacy admission decision, whether admitted or retired, MUST be recorded in a tamper-evident audit ledger committed to Git.

## Consequences

### What this makes easy
- Enables 7 of the 12 scholarship questions (all 6 mathematics/numerical items and 1 formal logic item) to progress safely through deterministic verification without fabricating non-existent authoring logs.
- Establishes a rigorous, defensible, auditable standard for admitting high-value legacy content while upholding the product's premium quality guarantee.
- Provides a clear decision framework for educators, engineers, and repository auditors.

### What this makes hard
- Admitting judgement-based verbal and reading items requires executing external API calls across multiple competing AI providers (e.g. OpenAI and Google) and securing qualified human editorial review.
- Requires building and maintaining an authenticated approval ledger and updating the factory staging and publication gates.

### What this forbids
- Forbids blanket waivers or arbitrary owner overrides lacking documented verification evidence.
- Forbids admitting reading comprehension passages without verifiable originality/copyright clearance.
- Forbids any agent or script from modifying a legacy record's provenance to simulate known-provider authoring.

## Alternatives Considered

1. **Option 1: Permanent Ineligibility for All Unknown-Origin Content:**
   - *Rationale for Rejection:* Discards mathematically sound, deterministically provable, and pedagogically valuable questions purely due to missing local historical logs. Treats deterministic arithmetic identically to subjective literary text, which is epistemically unsound.

2. **Option 2: Blanket Owner Waiver (Admitting All Content on Owner Discretion):**
   - *Rationale for Rejection:* Completely breaches the repository's fail-closed governance model. Re-introduces the risk of unvetted distractor ambiguities, AI training-data hallucinations, or undetected copyright infringements entering the live published bank.

3. **Option 3: Universal Re-Authoring of All 12 Items:**
   - *Rationale for Rejection:* Unnecessarily wastes verified mathematical work and existing blind-review investments on items where deterministic correctness is already established beyond doubt. Re-authoring remains available as a surgical fallback where needed (e.g. for Reading passages).

4. **Option 4: Fabricating an "Unknown" Provider Alias to Trick the Different-Provider Rule:**
   - *Rationale for Rejection:* Strictly forbidden by MindMosaic Standing Rule #9 (Zero Fabrication). Manufacturing a dummy provider produces false-positive independence evaluations and corrupts data lineage.

## Verification

Conformity with this ADR is verified by:
1. `npm run test:legacy-admission`: New automated test suite validating that legacy candidates lacking required classification-specific evidence fail staging and publication gates.
2. `npm run questions:validate-ledger`: Ensures all legacy candidates in the factory are accounted for in the tamper-evident ledger.
3. Cryptographic signature verification over `content/publication-approvals/` before release compilation.
