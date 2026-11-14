# Numerical Reasoning: complete-paper release constraints, authorisation stages and expansion prerequisites

> **Notice:** AI-generated advisory planning material. It is not qualified human review, not approval, and grants no authority to design, implement, admit, approve, publish or deploy anything. Nothing in this document is an executable instruction. Counts below are recomputed in `scholarship-160-inventory.json`.

---

## 1. The delivery constraint

A Year 6 Numerical Reasoning paper is delivered only as a complete paper of 40 approved questions. The selector (`src/features/exam-engine/selection/select-questions.ts`) refuses partial papers, so one missing or unapproved item keeps the whole paper unavailable. A shortened paper is **not authorised** and is a separate product decision if it is ever raised (owner adoption record, section 2).

That constraint is a reason to plan, not a reason to expand scope. A paper needing 40 items does not make 40 items eligible. Each item needs its own evidence and controls, and no expansion is assumed here.

---

## 2. Current recomputed status of the 40 Numerical Reasoning items

| Dimension | Status | Source |
|---|---|---|
| Machine-verified result (arithmetic / closed-language) | 40 `verified`, 0 `failed`: 20 closed-language solver (nr-001 to nr-020), 20 first-party recompute (nr-021 to nr-040) | inventory `summary.machineKeyCheck` |
| Stem-to-solver semantic verification | 0 of 40 `verified`; `not_established` | ADR-017 requirement 2, never performed |
| Independent answer uniqueness, distractor quality, age and curriculum fit | 0 of 40 `verified`; `not_established` | no review record exists |
| Qualified human review | 0 of 40; `not_established` | no qualified reviewer engaged |
| Difficulty gate | 26 pass, 14 blocked by estimator deviation | recomputed |
| Original generation | `not_established` for all 40 | ADR-017; owner adoption record |
| Human approval | `not_established` for all 40; the approval control does not exist | owner adoption record, requirement 6 |
| Publication eligibility | 0 of 40; Phase 1 fail-closed gates refuse legacy-import content | owner adoption record, section 2 |

A matching key and solver result is arithmetic consistency only. It is never treated as evidence of correct interpretation, uniqueness, distractor quality or age-fit.

---

## 3. Five separate authorisations

Each stage needs its own explicit owner decision. None implies another.

| Stage | What it covers | Status today |
|---|---|---|
| **Design** | Policy and design work for the `deterministic_legacy_admission` route and the two Phase 2b prerequisites | Authorised by the ADR-017 adoption, as design only |
| **Implementation** | Writing and merging code for the admission route, authenticated approval and the legacy-origin ledger | **Not authorised.** Each Phase 2b workstream needs its own design, independent review and separately authorised implementation PR |
| **Admission** | Admitting a specific candidate under the implemented route | **Not authorised.** No candidate is admissible; the five in-scope candidates all refuse at requirement 2 alone |
| **Approval** | A qualified human recording approval bound to a candidate's published hash | **Not possible.** The authenticated approval control does not exist |
| **Release** | Assembling, merging to `dev`, promoting to `main`, deploying | **Not authorised.** The repository owner merges `dev` to `main` |

---

## 4. Authorised initial engineering scope (ADR-017, adopted 2026-10-24)

Read from the owner adoption record. Only these are in scope, and only for design and later separately authorised engineering:

| Candidate | Section | Standing |
|---|---|---|
| `scholarship-y6-nr-022` | Numerical Reasoning | Initial engineering scope |
| `scholarship-y6-nr-023` | Numerical Reasoning | Initial engineering scope |
| `scholarship-y6-maths-004`, `maths-007`, `maths-014` | Mathematics | Initial engineering scope |
| `scholarship-y6-nr-001` | Numerical Reasoning | Policy-eligible on condition only: enters only on a genuine first-party registry entry and regression tests, separately reviewed |

Only two Numerical Reasoning items (nr-022, nr-023) are in initial scope, one more is conditional, and 37 are outside it. **No Numerical Reasoning item has an admission route today that would let a complete 40-item paper exist.** The adopted scope does not claim otherwise.

The `nr-022` stem carries its relational factors in prose while the registered givens contain a single number. That is a question for the editorial interpretation check (requirement 2) and nothing in this audit resolves it.

---

## 5. Proposed future scope expansions (NOT authorised, NOT adopted)

Everything in this section is a recommendation about evidence, not a decision. Expansion would need a separately reviewed policy decision by the owner (an ADR amendment or successor), after which the stages in section 3 apply as normal. No candidate below is eligible today.

### 5.1 Eligibility prerequisites for any expansion candidate

A candidate becomes a candidate for expansion only when all of the following can be shown for that item:

| # | Prerequisite | Evidence that would establish it | Exists today |
|---|---|---|---|
| E1 | First-party recomputed correctness | A registry entry declaring its own givens and an independent solver, with regression tests, separately reviewed | Only for nr-021 to nr-040 (items 022 and 023 are in scope); nr-001 to nr-020 use parameter-driven closed-language solvers, which are not first-party |
| E2 | Editorial interpretation check | A named, qualified human affirms the solver's assumptions are the stem's, bound to the item's D2 hash | No. Never performed for any item |
| E3 | Exact binding | D1, D2 and D3 independently recomputed and bound in the admission bundle | Hashes are recomputed in the inventory; the admission bundle does not exist |
| E4 | Originality assessment | An external originality engine or equivalent | No. Engine procurement is open |
| E5 | Age and curriculum check | A named reviewer's record | No reviewer engaged |
| E6 | Authenticated human approval | The Phase 2b approval architecture | No. Does not exist |
| E7 | Owner scope decision | A separately adopted policy decision extending scope to the named candidates | No |
| E8 | Difficulty gate | Each blocked label decided by the owner, or the item revised | 14 NR items blocked; undecided |

### 5.2 Candidate groups and what each lacks

| Group | Items | Machine proof today | Missing beyond E2 to E8 |
|---|---|---|---|
| Conditional | nr-001 | Closed-language solver | A first-party registry entry and regression tests (E1) |
| Number series | nr-002 to nr-010 | Closed-language solver | First-party entries and `SCHOLARSHIP_ATTESTED_SKILLS` extension for `nr-number-series` (E1) |
| Number matrices | nr-011 to nr-020 | Closed-language solver | First-party entries and `SCHOLARSHIP_ATTESTED_SKILLS` extension for `nr-number-matrices` (E1) |
| First-party recomputed, outside scope | nr-021, nr-024 to nr-040 (18 items) | First-party recompute | Owner scope decision (E7) in addition to the common prerequisites |

Whether a closed-language solver can ever stand in for a first-party entry is a policy question this document does not decide.

### 5.3 Class B and Class C are unresolved

Verbal Reasoning (45) and Reading Comprehension (35) have **no adopted admission route**. ADR-017 defers Class B (`vr-001`, `vr-016`), Class C (`rc-001`, `rc-002`, `rc-003` and the shared passage) and leaves `vr-032` open pending a separate justification of a non-numeric deterministic attestation category. Their eligibility stays unresolved unless a separately adopted policy explicitly enables it.

Because the original generator is unknown, independent review of unknown-origin judgement content is `not_established_unknown_origin`, and ADR-017 makes that permanent. A different-provider review of these items may be collected as advisory evidence only; it does not make them eligible and is not production-grade independence.

---

## 6. Design-stage sequence (planning only)

The ordering is the one in the owner adoption record. Each step needs its own authorisation; none is authorised for implementation today.

1. **A-0, branch protection on `dev`.** Partly blocked: with one principal on the repository there is nobody to name as an independent code owner.
2. **Workstream A, authenticated approval architecture.** Design, independent review, then a separately authorised implementation PR.
3. **Workstream B, durable legacy-origin ledger.** Same sequence; can run in parallel once A-0 lands.
4. **Phase 2c, nr-001 registry entry and regression tests.** Only if the owner wants it in scope.
5. **Phase 2d, admission-gate implementation.** Only after A and B are merged and validated.
6. **Phase 2e, evidence collection** for the five in-scope candidates. Needs an originality engine and a named qualified reviewer for requirements 2 and 5; neither exists.

### Artefacts referred to that do not exist yet

| Artefact | Status |
|---|---|
| Admission-gate module for `deterministic_legacy_admission` | Future; unbuilt |
| Authenticated approval records and signer registry | Future; unbuilt |
| Legacy-origin ledger | Future; unbuilt |
| `qualified-review-records.json` and its schema | Future; schema not adopted |
| Signed approval sheet bound to canonical hashes | Future; no approval control exists |

No publication, approval or assembly command is offered here as a next step. The legacy admission architecture is unimplemented, and the existing publication tooling refuses `legacy_import` content by design.

---

## 7. Work that does not need any authorisation to start

- Engage a qualified editorial reviewer (requirements 2 and 5). It has lead time and no engineering dependency.
- Compare originality-engine coverage, limitations and cost.
- The owner may read the internal owner pack. Reviewers, if any are engaged, receive only the answer-blind packets in `answer-blind/`; their returned decisions are advisory input.
