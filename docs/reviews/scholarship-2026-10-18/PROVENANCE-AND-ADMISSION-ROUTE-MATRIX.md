# Provenance & Admission-Route Matrix: All 160 Scholarship Year 6 Questions

> **Notice:** This document contains independent AI-generated advisory analysis by Antigravity (Google DeepMind). It is **not qualified human approval** and conveys no authorization to publish or deploy.

---

## 1. Governance Context & Policy Rules

Under MindMosaic governance:
- **Phase 1 Baseline (`feat/legacy-content-provenance`, PR #74):** Established a truthful fail-closed representation (`kind: legacy_import`, `originalGeneration: { status: "unverified" }`). All 160 questions currently sit under this blanket hold.
- **ADR-017 (`docs/adr/017-legacy-content-unknown-origin-eligibility.md`):** Adopted as **policy only** on 2026-10-24. Authorizes design work for a narrow, deterministic admission route (`deterministic_legacy_admission`). It authorises **no code execution, gate relaxation, or automatic admission**.
- **Different-Provider Review Policy (`docs/REVIEW_INDEPENDENCE_POLICY.md`):** Judgement content requires an independent review from a different provider family than the generator.

No question may be admitted without meeting all mandatory evidence requirements established for its classification.

---

## 2. Admission-Route Categories

| Category | Governance Route | Criteria / Description | Number of Questions | Current Status |
|---|---|---|---:|---|
| **Class A1** | `deterministic_legacy_admission` (Initial Engineering Scope) | Deterministically recomputable by first-party registered solvers (`SCHOLARSHIP_FIRST_PARTY_SOLVERS` or `SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS`). Approved by Owner on 2026-10-23 as the initial 5-question implementation scope. | **5** | Blocked on Phase 2b prerequisites (A-0 branch protection, authenticated human approvals, legacy-origin ledger) and editorial stem-to-solver check. |
| **Class A2** | `deterministic_legacy_admission` (Conditional Policy-Eligible) | Deterministically recomputable numeric reasoning (`nr-number-series`). Policy-eligible under ADR-017 §1.2, but outside initial scope pending a genuine first-party solver registry entry declaring its own givens. | **1** (`nr-001`) | Blocked on missing first-party registry entry, regression tests, Phase 2b security prerequisites, and editorial check. |
| **Class A3** | `deterministic_legacy_admission` (Policy Candidates Requiring Scope Decision) | Deterministically recomputable numeric reasoning (NR 37 items, Maths 37 items) covered by registered first-party solvers or closed-language solvers. | **74** | Blocked. Outside ADR-017 scope. Requires explicit owner policy scope expansion decision, Phase 2b prerequisites, and editorial check. |
| **Class B** | `external_provider_review_admission` (Judgement Verbal Reasoning) | Non-numeric, propositional logic, and semantic verbal reasoning. Cannot use deterministic numeric attestation. | **45** | Blocked on Phase 1 legacy-import hold, different-provider review (`freshSession: true`), external originality search, and human approval. |
| **Class C** | `external_provider_review_admission` (Reading Comprehension) | Passage-dependent literary and informational comprehension. Subjective / semantic objective. | **35** | Blocked on Phase 1 legacy-import hold, different-provider review (`freshSession: true`), external originality search, and human approval. |
| **Total** | | | **160** | **0 Admitted / 160 Blocked** |

---

## 3. Comprehensive Breakdown Matrix

### 3.1 Initial Engineering Scope (ADR-017 §1.1) — 5 Candidates

These five questions are the only items authorised by ADR-017 to be touched by the initial Phase 2b implementation:

| Candidate ID | Section | Subject / Skill | First-Party Solver Registered? | D1 Raw Hash | D2 Candidate Hash | D3 Publication Hash | Mandatory Admission Requirements Remaining |
|---|---|---|---|---|---|---|---|
| `scholarship-y6-nr-022` | NR | `nr-arithmetical-reasoning` | Yes | `8758ac61...` | `8758ac61...` | `a0c486d7...` | 1. Editorial stem-to-solver check (flagged: relational language carries factors 3×, 2× in prose while givens are `[8]`).<br>2. Phase 2b authenticated approval.<br>3. Originality assessment engine.<br>4. Age/curriculum check. |
| `scholarship-y6-nr-023` | NR | `nr-arithmetical-reasoning` | Yes | `52d196a6...` | `52d196a6...` | `7b80d6a1...` | 1. Editorial stem-to-solver check.<br>2. Difficulty confirmation (`medium`).<br>3. Phase 2b authenticated approval.<br>4. Originality assessment engine.<br>5. Age/curriculum check. |
| `scholarship-y6-maths-004` | Maths | `maths-directed-numbers` | Yes | `8aeef3fb...` | `8aeef3fb...` | `2038c2ac...` | 1. Editorial check (summit height minus signed elevation).<br>2. Phase 2b authenticated approval.<br>3. Originality assessment.<br>4. Age/curriculum check. |
| `scholarship-y6-maths-007` | Maths | `maths-percentages` | Yes | `93bfea7f...` | `93bfea7f...` | `938bf96f...` | 1. Editorial check (sequential discounts).<br>2. Phase 2b authenticated approval.<br>3. Originality assessment.<br>4. Age/curriculum check. |
| `scholarship-y6-maths-014` | Maths | `maths-ratios-rates` | Yes | `71d11fa2...` | `71d11fa2...` | `aeb211f7...` | 1. Editorial check (amended in `45b6cdab` to specify only two groups; needs human verification).<br>2. Phase 2b authenticated approval.<br>3. Originality assessment.<br>4. Age/curriculum check. |

---

### 3.2 Conditional Candidate (ADR-017 §1.2) — 1 Candidate

| Candidate ID | Section | Skill | Current Solver | Condition for Scope Entry |
|---|---|---|---|---|
| `scholarship-y6-nr-001` | NR | `nr-number-series` | Parameter-driven closed language (`solveNumberSeries`) | Requires writing a first-party registry entry declaring its own givens (`[5, 11, 17, 23, 29]`) and independent arithmetic solver, with full regression coverage, separately reviewed. |

---

### 3.3 Deferred Class B & C Candidates in ADR-017 Sample — 6 Candidates

These six items from the 12-question sample in PR #73 are explicitly deferred:

| Candidate ID | Class | Section | Reason for Deferral |
|---|---|---|---|
| `scholarship-y6-vr-032` | B | VR | Propositional logic (modus tollens); deterministically decidable but non-numeric. Held pending separate justification of a non-numeric deterministic attestation category. |
| `scholarship-y6-vr-001` | B | VR | Judgement-based semantic classification. Requires external different-provider review. |
| `scholarship-y6-vr-016` | B | VR | Judgement-based synonyms/antonyms. Requires external different-provider review. |
| `scholarship-y6-rc-001` | C | RC | Reading comprehension on *The Mangrove Fringe*. Dependent on shared passage. Requires external review. |
| `scholarship-y6-rc-002` | C | RC | Reading comprehension on *The Mangrove Fringe*. Dependent on shared passage. Requires external review. |
| `scholarship-y6-rc-003` | C | RC | Reading comprehension on *The Mangrove Fringe*. Dependent on shared passage. Requires external review. |

---

### 3.4 Remaining 148 Scholarship Questions

| Section | Number | Current Solver / Verification | Admission Route Needed | Required Next Action |
|---|---:|---|---|---|
| **Numerical Reasoning** (`nr-002` to `nr-021`, `nr-024` to `nr-040`) | 37 | Items 002–010 (number series), 011–020 (matrices): closed-language solvers.<br>Items 021, 024–040: first-party hash-bound recomputes. | Extension of `deterministic_legacy_admission` scope | Owner decision to expand ADR-017 scope beyond initial 5 items. Complete Phase 2b prerequisites. |
| **Mathematics** (`maths-001` to `maths-003`, `maths-005` to `maths-006`, `maths-008` to `maths-013`, `maths-015` to `maths-040`) | 37 | All 37 covered by `SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS`. | Extension of `deterministic_legacy_admission` scope | Owner decision to expand ADR-017 scope. Settle difficulty gate conflicts (21 items). Complete Phase 2b prerequisites. |
| **Verbal Reasoning** (`vr-002` to `vr-015`, `vr-017` to `vr-031`, `vr-033` to `vr-045`) | 42 | Vocabulary, analogies, compound words, ciphers. | Different-provider review + Phase 2b admission | Execute fresh external provider review (`freshSession: true`). Ingest responses. Settle 27 difficulty gate conflicts. |
| **Reading Comprehension** (`rc-004` to `rc-035`) | 32 | Comprehension questions across 4 passages. | Different-provider review + Phase 2b admission | Execute fresh external provider review. Ingest responses. Settle 16 difficulty gate conflicts. |

---

## 4. Key Takeaways for Release Readiness

1. **Zero questions can be published today under existing controls.**
2. **Numerical Reasoning (Priority 1) requires all 40 questions for a valid paper.** Today, only 2 questions (`nr-022`, `nr-023`) are inside the initial engineering scope of ADR-017, and even those cannot publish until Phase 2b is implemented and verified.
3. Launching Numerical Reasoning therefore strictly depends on:
   - Completing the Phase 2b implementation (Workstream A & B).
   - Expanding the owner scope decision from 5 items to all 40 Numerical Reasoning items.
   - Conducting the qualified human editorial checks (stem-to-solver unambiguity).
   - Obtaining qualified human approvals on the review sheets.
