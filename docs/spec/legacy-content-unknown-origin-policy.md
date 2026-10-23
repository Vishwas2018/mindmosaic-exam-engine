# Legacy Content Governance Policy: Unknown-Origin Eligibility (Phase 2 Specification)

**Status:** Proposed Policy Specification · **Phase:** 2  
**Effective Date:** Pending Owner Authorisation  
**Preceding Specifications:** `docs/REVIEW_INDEPENDENCE_POLICY.md`, `docs/spec/legacy-content-provenance-phase1.md`  
**Governing Architecture Decision:** `docs/adr/017-legacy-content-unknown-origin-eligibility.md`  

---

## 1. Executive Summary & Problem Definition

### 1.1 The Phase 1 Baseline
Phase 1 established that practice questions with traceable Git commit history but unverified original creation metadata (provider, model ID, generation prompt, generation timestamp, execution events) are represented truthfully as:
```json
{
  "kind": "legacy_import",
  "provenanceVersion": 2,
  "generatorAdapter": { "class": "legacy_import", "identity": null },
  "originalGeneration": {
    "status": "unverified",
    "provider": null,
    "model": null,
    "prompt": null,
    "promptHash": null,
    "generatedAt": null,
    "candidateGenerationEvent": null
  }
}
```
Phase 1 deliberately and strictly blocked these candidates from clearing semantic review, staging, and publication gates. This fail-closed posture ensured that no unknown-origin content could silently leak into student-facing exam pools.

### 1.2 The Trust Dilemma
The existing Review Independence Policy (`docs/REVIEW_INDEPENDENCE_POLICY.md`) mandates that for judgement-based content, a candidate must be reviewed by a different provider from the generator (`identitiesAreIndependentForJudgementReview`). When the original generator is unknown, evaluating `generator.provider !== reviewer.provider` is impossible:
- If `generator.provider` is `null`, any automated equality check either throws or evaluates to `false` (fail-closed).
- If an implementation were to inject a placeholder such as `provider: "unknown"`, an automated check comparing `"unknown"` against `"openai"` would evaluate to `true` (false positive), falsely certifying independence when the unknown generator might have been an OpenAI model sharing identical weights, training corpora, and systematic blind spots.
- Falsifying generator identity is strictly prohibited under MindMosaic's Zero Fabrication rule (AGENTS.md).

### 1.3 Objective of Phase 2
This specification resolves the trust dilemma by introducing an **Evidence-Based Decoupled Governance Model**. Rather than attempting to guess or reconstruct unknowable historical authorship, this policy establishes:
1. When and why content correctness can be established independently of authorship provenance.
2. The elevated multi-party evidence required when subjective judgement is involved.
3. Cryptographically bound human approvals and tamper-evident ledgers that prevent unauthorised release.

---

## 2. Decoupled 4-Dimensional Evidence Model

Evidence in educational content governance must not be treated as a single monolithic score. This policy formally decouples four distinct evidentiary dimensions:

```
+-----------------------------------------------------------------------------------------+
|                               FOUR-DIMENSIONAL EVIDENCE MODEL                           |
+------------------------------+------------------------------+---------------------------+
| Dimension                    | What It Establishes          | What It CANNOT Establish  |
+------------------------------+------------------------------+---------------------------+
| 1. Mathematical / Logical    | - Uniqueness of correct key  | - Who authored the item   |
|    Correctness Verification  | - Mathematical truth         | - Originality/Copyright   |
|                              | - Distractor falsehood       | - Pedagogical age-fit     |
+------------------------------+------------------------------+---------------------------+
| 2. Authorship & Generation   | - Provider & Model ID        | - Correctness of answer   |
|    Provenance                | - Creation timestamp & prompt| - Non-plagiarism          |
|                              | - Cryptographic API envelope | - Distractor quality      |
+------------------------------+------------------------------+---------------------------+
| 3. Review Independence &     | - Absence of shared lineage  | - Authorship history      |
|    Defensibility Consensus   | - Unambiguous interpretation | - Factual truth of claims |
|                              | - Semantic validity          |                           |
+------------------------------+------------------------------+---------------------------+
| 4. Originality & IP          | - Non-infringement           | - Correctness of answer   |
|    Integrity                 | - Absence of verbatim copy   | - Solver execution        |
|                              | - Cultural appropriateness   |                           |
+------------------------------+------------------------------+---------------------------+
```

### Invariant 2.1: Non-Transitivity of Evidence
- Proof of Correctness (Dimension 1) does **not** confer Proof of Originality (Dimension 4).
- Proof of Provenance (Dimension 2) does **not** confer Proof of Correctness (Dimension 1).
- Review Consensus (Dimension 3) does **not** confer Proof of Authorship (Dimension 2).

---

## 3. Content Classification & Governed Admission Pathways

Every candidate submitted for legacy admission must be classified into one of three governance categories. The required evidence pathway is determined strictly by this classification.

```
                                    +-----------------------+
                                    | Legacy Candidate with |
                                    |    Unknown Origin     |
                                    +-----------+-----------+
                                                |
                                      Classify Content Type
                                                |
             +----------------------------------+----------------------------------+
             |                                  |                                  |
             v                                  v                                  v
     [ Class A: Math/NR ]             [ Class B: Verbal/Judgement ]       [ Class C: Stimulus/RC ]
             |                                  |                                  |
  +----------+----------+            +----------+----------+            +----------+----------+
  | Deterministic Solver|            | Dual-Provider Blind |            | Multi-Engine Plagiarism|
  | Verification        |            | LLM Consensus       |            | & Corpus Ingestion Scan|
  +----------+----------+            +----------+----------+            +----------+----------+
             |                                  |                                  |
  +----------+----------+            +----------+----------+            +----------+----------+
  | Originality Check & |            | Qualified Human SME |            | Cultural & Age      |
  | Single Blind Review |            | Editorial Rubric    |            | Sensitivity Sign-off|
  +----------+----------+            +----------+----------+            +----------+----------+
             |                                  |                                  |
             |                                  +-----------------+----------------+
             |                                                    |
             |                                         Decision: Proceed vs.
             |                                         Clean-Sheet Re-Author
             |                                                    |
             +------------------------+---------------------------+
                                      |
                           +----------v----------+
                           | Authenticated Human |
                           | Gate (Owner Sign-off|
                           | with Cryptographic  |
                           | Commit Signature)   |
                           +----------+----------+
                                      |
                           +----------v----------+
                           | Governed Admission: |
                           | `legacy_exception`  |
                           | Staging & Release   |
                           +---------------------+
```

---

### 3.1 Pathway 1: Deterministic Verification (Class A Content)

**Applicability:** Numerical reasoning, arithmetic, algebra, percentages, ratios, geometry, directed numbers, and formal propositional sentence logic.

#### Justification
For Class A items, mathematical correctness can be proven beyond doubt by a deterministic algorithm running in execution isolation. Unlike human-language reading comprehension, a mathematics problem with a verified single unique solution does not depend on the authoring model's internal representations or linguistic biases.

#### Mandatory Evidence Bundle for Class A
1. **Certified First-Party Solver Execution:**
   - The question must bind to a registered solver in `src/features/question-factory/solvers/`.
   - The solver must execute in pure automated tests, asserting:
     * Exactly one valid answer is derived.
     * All distractors evaluate to false under the derivation rules.
     * Common student misconception traps are accounted for in distractor explanations.
2. **Originality & Memorisation Clearance:**
   - Word problem text must be verified against an n-gram search and literature/web query database to confirm it does not copy textbook, ICAS, or NAPLAN question banks verbatim.
3. **Single External Blind Review:**
   - A blind review packet (with answers withheld) must be submitted to an external foundation model (e.g. OpenAI GPT-4o or Google Gemini).
   - Reviewer must independently solve to the identical option key and rate clarity as acceptable.
4. **Human Editorial & Owner Sign-Off:**
   - Qualified educator confirms age-level suitability and syllabus mapping.
   - Owner executes authenticated approval.

---

### 3.2 Pathway 2: Multi-Provider Orthogonal Consensus (Class B Content)

**Applicability:** Verbal reasoning analogies, vocabulary, synonyms/antonyms, contextual language logic, and judgement-based verbal classification.

#### Justification
Judgement-based content has no deterministic solver. The correctness of an analogy or synonym depends entirely on lexical definitions, semantic conventions, and distractor plausibility. Because the original author is unknown, a single external reviewer from an unknown provider cannot guarantee that the reviewer and generator do not share the exact same training lineage or blind spot.

#### Mandatory Evidence Bundle for Class B
1. **Multi-Provider Orthogonal Blind Reviews:**
   - The candidate must be reviewed under strict answer-withheld conditions by **at least two independent external foundation models from different major AI labs** (e.g. Lab 1: OpenAI GPT-4o; Lab 2: Google Gemini 1.5/2.5 Pro; Anthropic must not review if the local coding agent was Claude).
   - **Consensus Requirements:**
     * 100% agreement between both external models on the single defensible option key.
     * Both models must declare `singleDefensibleAnswer: true`.
     * Neither model flags unacceptable ambiguity, alternative interpretations, or unfair distractors.
2. **Qualified Human Subject-Matter Expert (SME) Review:**
   - An accredited English/Verbal educator must complete an explicit, rubric-based evaluation reviewing:
     * Defensibility of the designated key against subtle edge cases.
     * Age-level vocabulary calibration (Australian Year 6 standard).
     * Cultural fairness of idioms and analogies.
3. **Originality Verification:**
   - Verification that analogies or sentence structures are not lifted verbatim from commercial scholarship preparation books (e.g. Bond, Hendersons, ACER practice sheets).
4. **Fallback to Re-Authoring:**
   - If either external model identifies ambiguity, or if dual-provider consensus cannot be obtained, admission is refused. The item must be retired and re-authored.

---

### 3.3 Pathway 3: Originality & Passage Audit (Class C Content)

**Applicability:** Reading comprehension passages, continuous narrative text, stimulus poems, and derived inference questions.

#### Justification
Literary passages present the highest legal, ethical, and quality exposure for MindMosaic. An unverified AI generation prompt might have requested the model to "write a story like X", resulting in near-verbatim regurgitation of copyrighted contemporary Australian literature, or incorporating unvetted cultural stereotypes.

#### Mandatory Evidence Bundle for Class C
1. **Automated Multi-Corpus Plagiarism Scan:**
   - The entire passage text must be submitted to a commercial/academic plagiarism detection engine and search index (e.g. Google Books, Crossref, web index).
   - Verification of 0% verbatim paragraph matches and no substantial plot/structural reproduction of existing copyrighted works.
2. **Cultural Sensitivity & Historical Accuracy Audit:**
   - Human review confirming appropriate representation, especially when referencing Australian fauna, flora, Indigenous knowledge, or historical contexts.
3. **Item-Level Dual Consensus:**
   - All questions referencing the passage must independently satisfy Pathway 2 (Class B) dual-provider consensus.
4. **Policy Preference for Re-Authoring:**
   - Because producing high-quality original passages with full verifiable generation provenance (`kind: generated`, version 1) is readily achievable, the default recommended policy for Class C is **Clean-Sheet Re-Authoring** rather than legacy admission.

---

### 3.4 Pathway 4: Clean-Sheet Re-Authoring (Clean Provenance Reset)

Where a legacy candidate:
- Fails deterministic solver verification, OR
- Cannot achieve unanimous dual-provider consensus, OR
- Incurs disproportionate audit effort compared to authoring cost, OR
- Uses a literary stimulus with unknown copyright lineage;

The item MUST be decommissioned and re-authored:
1. **Retirement:** The legacy candidate ID is archived in the legacy ledger with status `retired_ineligible`.
2. **Fresh Generation:** A new candidate is generated using verified factory generation tooling (`kind: generated`, provenance version 1).
3. **Full Provenance Chain:** The new item explicitly records `provider`, `model`, `prompt`, `promptHash`, `generatedAt`, and the verifiable execution event.
4. **Standard Governance:** The new item passes standard factory gates, including the single different-provider review rule.

---

## 4. Trust Boundary & Anti-Tampering Safeguards

To prevent tampering, attribution forgery, or accidental release of unvetted legacy material, the factory implements six defense-in-depth controls:

### 4.1 Strict Schema Invariant: No Synthetic Providers
The factory schema rejects any attempt to populate `originalGeneration.provider` with sentinel values such as `"unknown"`, `"legacy"`, `"unverified"`, or `"importer"`.
- Legacy candidates must strictly retain `generatorAdapter.identity: null` and `originalGeneration.status: "unverified"`.
- Any code or manifest attempting to supply a non-null string for an unverified legacy candidate triggers `invalid_legacy_provenance_structure` and fails the build.

### 4.2 Durable Legacy Content Identity Ledger
A tamper-evident JSON/CSV ledger (`content/legacy-provenance-ledger.json`) is maintained under Git version control. Every admitted or retired candidate must have an immutable entry containing:
- `candidateId`
- `sourceGitCommit` and `sourceBlob`
- `rawQuestionHash`
- `candidateHash`
- `publicationContentHash`
- `classification`: `"class_a_deterministic"` | `"class_b_judgement"` | `"class_c_stimulus"`
- `governanceRoute`: `"legacy_exception_approved"` | `"legacy_retired"`
- `admissionEvidenceSha256`: SHA-256 hash of the complete evidence bundle file
- `approvalSignature`: Authenticated approval identifier

Any modification of candidate content without refreshing this ledger causes `npm run questions:validate-ledger` to fail CI.

### 4.3 Preventing Manifest Re-Sealing or Attribute Forgery
An attacker or malfunctioning agent might attempt to take a legacy candidate's JSON, change `kind: legacy_import` to `kind: generated`, and supply an arbitrary valid provider name to bypass the legacy hold.
- **Countermeasure:** The publication compiler (`assemble-published-bank.ts`) checks every candidate against the canonical factory intake journal and the historical provenance ledger. If a candidate hash originated from a legacy import transaction, it is cryptographically forbidden from being published under `kind: generated`.

### 4.4 Authenticated Human Approvals
MindMosaic Standing Rule #8 dictates: "Content publication requires human sign-off (`approvedBy`). AI models may draft or audit, but human approval is mandatory."
- In Phase 2, approval cannot be satisfied by an anonymous JSON string `"approvedBy": "Alice"`.
- Approvals must be stored in `content/publication-approvals/<candidate-id>.approval.json` and must contain:
  * `approverIdentity`: Verified email / identity.
  * `role`: `"repository_owner"` | `"curriculum_sme"`.
  * `targetPublicationContentHash`: Exact hash of the compiled question.
  * `cryptographicAttestation`: Either a Git GPG/SSH commit signature binding the commit, or an HMAC token signed with the repository owner's signing key.

---

## 5. Downstream Gate Adjustments

When this policy is authorised for implementation, factory gates will be updated as follows:

| Component | Current Phase 1 Behaviour | Proposed Phase 2 Behaviour |
|---|---|---|
| `isProductionGradeIndependentReview` | Returns `false` for any candidate with null generator identity. | Accepts an explicit `legacyAdmissionEvidence` payload satisfying Pathway 1 (solver + single review) or Pathway 2 (dual provider consensus + SME review). Returns `false` if requirements are incomplete. |
| `orchestrateStaging` | Refuses all `kind: legacy_import` candidates (`legacy_import_staging_refused`). | Permits `kind: legacy_import` IF AND ONLY IF `governanceRoute === "legacy_exception_approved"` AND the ledger entry has a verified approval signature. |
| `validatePublicationSource` | Refuses all `kind: legacy_import` manifests (`invalid_generator_attribution`). | Permits `kind: legacy_import` with verified `legacyAdmissionEvidence` and cryptographic human approval. |
| `questions:import-legacy` | Imports records with empty review chains and flags them ineligible. | Unchanged — import remains purely an intake transaction establishing repository provenance, not publication eligibility. |

---

## 6. Non-Negotiable Fail-Closed Invariants

1. **Fail-Closed on Missing Evidence:** If any piece of the required evidence bundle (e.g. second LLM review for Class B, or solver execution for Class A) is missing or unverified, the gate evaluates to `REJECT`.
2. **No Automatic Upgrades:** Merely running a test or committing an advisory review does not upgrade an item to eligible. Admission requires explicit ledger recording and human signing.
3. **No Retroactive Rewrites:** Historical Git commits and Phase 1 records remain immutable. New evidence is appended forward.
4. **Answer Secrecy:** All review packets submitted to external LLMs or human reviewers must have answers withheld (candidate projection with answers stripped).
