# Sequence for PR #73 under the deterministic-only policy

**Reference:** [PR #73](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/73), `feat/scholarship-y6-sample` at `dcb60a80f3f6eabdb522b20202929d2e3f328a94`.
**Status:** PR #73 is draft, read-only reference evidence, and is not modified by this PR or by this plan.

---

## 0. The most important constraint

**A seven-item deterministic policy does not authorise releasing a shortened scholarship sample.**

If every proposal in this programme were adopted and implemented, at most seven of the twelve candidates could become eligible — and on current solver coverage, realistically five. The remaining items stay deferred. That is a governance outcome, not a release plan.

Shipping a reduced sample is a separate product decision because it changes what a student actually sees: the subject balance across verbal reasoning, numerical reasoning, mathematics and reading comprehension is part of what makes the sample a sample. A five- or seven-item set with no reading comprehension at all is a different artefact. It needs its own authorisation, its own release identities and its own review, and nothing in this programme should be read as approving it.

Until that separate decision exists, the correct state for PR #73 is: draft, unmodified, unreleased.

---

## 1. Principles

1. PR #73 stays draft and untouched throughout. No agent modifies it.
2. No gate is skipped, and no intermediate state is assumed.
3. Phases are strictly separated, and each ends with a reviewable artefact.
4. Any step that cannot be completed truthfully stops the sequence and is reported, rather than being approximated.

---

## 2. Phase 2a — policy adoption (this PR)

Documentation only. The owner reviews ADR-017 and the specification and decides whether to adopt the narrow deterministic route.

The ADR stays `PROPOSED` until the owner records a decision. Adopting it authorises design work; it authorises no behaviour change.

**Exit:** a recorded owner decision, or a request for further change.

## 3. Phase 2b — security prerequisites

These gate everything after them, and neither is designed yet.

**2b-1 Approval authentication.** Signer registry and its protection; canonical signed payload binding candidate, content hash and decision; approval-to-commit binding; key lifecycle. Requires branch protection on `dev` that does not currently exist — today `dev` has no rulesets, requires zero approving reviews, and does not enforce protections for admins.

**2b-2 Durable legacy-origin ledger.** Tracked, tamper-evident state binding candidate hashes to their import transaction, resolving the untracked-workspace problem Phase 1 recorded.

Each is its own design, review and implementation PR.

**Exit:** both merged and validated, or the programme stops here.

## 4. Phase 2c — solver coverage

Per `solver-coverage.md`: five of the seven already have first-party recompute. Add a registry entry and attested skill for `nr-001`. Decide whether to build a non-numeric deterministic attestation category for `vr-032` or defer it.

**Exit:** a known, recorded correctness route for each in-scope candidate.

## 5. Phase 2d — admission gate implementation

Implement the new predicate, the staging and manifest changes, and the adversarial suite in `gate-and-test-changes.md`. `isProductionGradeIndependentReview` is not modified. The PR #74 allow-list is not reopened.

**Exit:** full CI green, including the refusal cases proving the Phase 1 hold still holds for all 12 candidates in their current state.

## 6. Phase 2e — evidence collection

For in-scope candidates only, and only after 2b–2d:

1. Produce first-party recompute evidence bound to exact hashes.
2. Run a bounded originality search per candidate and record the result, including matches, uncertainty or coverage gaps. A non-clean result stops that candidate.
3. Record an age-suitability and curriculum judgement from a named reviewer.
4. Attach the existing manual review as advisory, labelled.

**Exit:** a complete bundle per candidate, or a recorded reason it could not be completed.

## 7. Phase 2f — intake and admission

1. Run `npm run questions:import-legacy` against the pinned manifest to create truthful intake records with unverified original generation. This is an intake transaction, not an eligibility event.
2. Run the admission tool with each bundle and its approval.
3. Owner signs the approval commit under the Phase 2b design.

No step here fabricates a generation field, and no step changes question content.

## 8. Phase 2g — what happens next is a separate decision

At this point some candidates may be eligible. Three distinct decisions remain, each the owner's and each separate:

1. Whether to release anything at all from a partially eligible sample.
2. If so, what that release actually is — and specifically whether a subset is an acceptable product, given section 0.
3. Whether PR #73 merges, and in what form.

The honest default is that PR #73 remains draft until the deferred Class B and C items have a path, because the sample was designed as twelve items across four subjects.

---

## 9. Current blockers, in order

| # | Blocker | Owner |
|---|---|---|
| 1 | ADR-017 not adopted | Repository owner |
| 2 | Approval authentication not designed; `dev` branch protection absent | Security design + owner |
| 3 | Legacy-origin ledger not designed | Security design |
| 4 | `nr-001` and `vr-032` have no first-party recompute entry | Engineering |
| 5 | No originality search process or engine selected | Owner + engineering |
| 6 | No named SME engaged for age-suitability | Owner |
| 7 | Class B and C deferred; no funded provider API access | Owner (procurement) |

Nothing downstream of blocker 1 should begin until it clears.
