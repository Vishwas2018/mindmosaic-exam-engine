# Phase 2 Governance Package: Unknown-Origin Eligibility Policy

**Phase:** 2 (Legacy Content Governance Programme)  
**Status:** Proposal & Design Specification Only (No eligibility bypasses or factory changes authorised)  
**Baseline Repository State:**  
- `origin/dev` HEAD: `714ad64155b3ba3109695bf44c3d14ab7473da4c` (PR #74 merged, post-merge CI green).
- PR #73: Draft at `dcb60a80f3f6eabdb522b20202929d2e3f328a94` (Read-only reference baseline).

---

## 1. Package Overview

Phase 1 established truth in provenance: legacy content with unverified original creation metadata is formally tagged as `kind: legacy_import` with `status: "unverified"`, and is strictly prevented from clearing review, staging, and publication gates.

This Phase 2 governance package answers the central strategic question:  
**Whether and under what conditions legacy content with unknown original authorship may ever become eligible for staging and publication in MindMosaic.**

Rather than proposing a blunt blanket waiver or an equally blunt universal rejection, this proposal establishes a **Differentiated Governed Admission Model** that decouples mathematical correctness from authorship provenance, while demanding elevated multi-provider and human evidence for judgement-based material.

---

## 2. Directory of Phase 2 Deliverables

| Deliverable | Path | Summary |
|---|---|---|
| **Architecture Decision Record** | [`docs/adr/017-legacy-content-unknown-origin-eligibility.md`](../../adr/017-legacy-content-unknown-origin-eligibility.md) | Formal ADR adopting the decoupled 4-dimensional evidence model and differentiated admission standards. |
| **Governance Policy Specification** | [`docs/spec/legacy-content-unknown-origin-policy.md`](../../spec/legacy-content-unknown-origin-policy.md) | Binding normative specification defining Class A, B, and C requirements, trust boundaries, and fail-closed invariants. |
| **Candidate Impact Analysis** | [`candidate-impact-analysis.md`](candidate-impact-analysis.md) | Candidate-by-candidate assessment of all 12 Year 6 Scholarship sample questions, with hashes, gaps, and recommended pathways. |
| **Threat Model & Trust Boundary** | [`threat-model.md`](threat-model.md) | Security analysis of generator spoofing, self-review collusion, training-data plagiarism, and unauthenticated approvals. |
| **Proposed Governance Schemas** | [`schemas.md`](schemas.md) | TypeScript and Zod schema definitions for solver proofs, multi-provider consensus, SME rubrics, and authenticated approvals. |
| **Factory Gate & Test Changes** | [`gate-and-test-changes.md`](gate-and-test-changes.md) | Concrete code modification plan for factory review gates, staging orchestrator, publication validator, and CI test suites. |
| **PR #73 Migration Plan** | [`pr-73-migration-plan.md`](pr-73-migration-plan.md) | Safe operational sequence for transitioning the 12 scholarship questions from draft to compliant admission or clean re-authoring. |
| **Decisions for Owner Authorisation** | [`decisions-for-owner.md`](decisions-for-owner.md) | Explicit enumerated choices requiring repository owner sign-off before Phase 2 engineering begins. |

---

## 3. High-Level Policy Recommendation

1. **Admit Deterministic Mathematics & Numerical Reasoning (7 Items):**  
   Admit `nr-001`, `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`, and `vr-032` under **Pathway 1 (Class A)** upon execution of first-party deterministic solver proofs and word-problem originality clearance. Mathematical truth is independent of authoring model identity.
2. **Admit Discrete Verbal Reasoning with Dual-Provider Consensus (2 Items):**  
   Admit `vr-001` and `vr-016` under **Pathway 2 (Class B)** after executing an orthogonal external blind review via Google Gemini API to achieve unanimous cross-lab consensus with the existing ChatGPT review, accompanied by human SME sign-off.
3. **Clean-Sheet Re-Author Reading Comprehension (3 Items + 1 Passage):**  
   Retire the unverified Maya & Grandfather Mangrove Estuary passage and questions `rc-001`, `rc-002`, `rc-003`. Author 1 fresh reading passage and 3 items with full verifiable Phase 1 generation provenance (`kind: "generated"`). This completely protects MindMosaic from literary copyright and training-data memorisation liabilities.
4. **Enforce Cryptographic Human Sign-off:**  
   Require all publication approvals to be cryptographically signed by the repository owner via Git commit GPG/SSH signatures.

---

## 4. Scope and Boundary Restrictions Maintained

- **Documentation Only:** This branch contains zero functional code changes, zero gate bypasses, and zero production schema mutations.
- **PR #73 Untouched:** PR #73 remains draft and unmerged.
- **No Ingestion or Publication:** No questions were imported, staged, or published during the preparation of this package.
