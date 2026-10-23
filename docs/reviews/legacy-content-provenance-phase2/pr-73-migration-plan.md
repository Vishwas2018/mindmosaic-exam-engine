# Sequence for PR #73 under the deterministic-only policy

**Reference:** [PR #73](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/73), `feat/scholarship-y6-sample` at `dcb60a80f3f6eabdb522b20202929d2e3f328a94`.
**Status:** PR #73 is draft, read-only reference evidence, and is not modified by this PR or by this plan.

---

## 0. The most important constraint

**A five-item deterministic policy does not authorise releasing a shortened scholarship sample.**

If every proposal in this programme were adopted and implemented, five of the twelve candidates could become eligible — six if `nr-001` later meets its condition. The remaining items stay deferred. That is a governance outcome, not a release plan.

Shipping a reduced sample is a separate product decision because it changes what a student actually sees: the subject balance across verbal reasoning, numerical reasoning, mathematics and reading comprehension is part of what makes the sample a sample. A five- or six-item set with no reading comprehension at all is a different artefact. It needs its own authorisation, its own release identities and its own review, and nothing in this programme should be read as approving it.

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

The owner recorded scope direction on 2026-10-23, narrowing the initial engineering scope to five candidates (`decisions-for-owner.md` A1–A5). That direction is **not** adoption. The ADR stays `PROPOSED`, and the remaining step in this phase is independent policy review followed by a formal owner adoption decision.

Adopting it authorises design work; it authorises no behaviour change.

**Exit:** an independent policy review, then a recorded owner adoption decision, or a request for further change.

## 3. Phase 2b — security prerequisites

These gate everything after them, and neither is designed yet.

**2b-1 Approval authentication.** Signer registry and its protection; canonical signed payload binding candidate, content hash and decision; approval-to-commit binding; key lifecycle. Requires branch protection on `dev` that does not currently exist — today `dev` has no rulesets, requires zero approving reviews, and does not enforce protections for admins.

**2b-2 Durable legacy-origin ledger.** Tracked, tamper-evident state binding candidate hashes to their import transaction, resolving the untracked-workspace problem Phase 1 recorded.

Each is its own design, review and implementation PR.

**Exit:** both merged and validated, or the programme stops here.

## 4. Phase 2c — solver coverage

**No solver work is required for the five in-scope candidates.** They already have registered first-party recompute entries running in CI, which is why they are the scope. This phase exists only to confirm that, not to build anything.

`nr-001` and `vr-032` are handled outside this sequence:

- `nr-001` — a separate change adding `nr-number-series` to `SCHOLARSHIP_ATTESTED_SKILLS` and an independent registry entry, plus the regression tests in `gate-and-test-changes.md` section 4.8. Only then does it enter scope, by an explicit scope amendment rather than automatically.
- `vr-032` — deferred. No work is scheduled until a non-numeric attestation category is separately justified and independently reviewed.

**Exit:** a confirmed, recorded correctness route for each of the five in-scope candidates.

## 5. Phase 2d — admission gate implementation

Implement the new predicate, the staging and manifest changes, and the adversarial suite in `gate-and-test-changes.md`. `isProductionGradeIndependentReview` is not modified. The PR #74 allow-list is not reopened.

**Exit:** full CI green, including the refusal cases proving the Phase 1 hold still holds for all 12 candidates in their current state.

## 6. Phase 2e — evidence collection

For in-scope candidates only, and only after 2b–2d. Each step is performed separately for each of the five: `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`.

1. Produce first-party recompute evidence bound to exact hashes.
2. **Obtain a qualified human editorial interpretation assessment — see 6.1 below.**
3. Run a bounded originality search per candidate and record the result, including matches, uncertainty or coverage gaps. A non-clean result stops that candidate.
4. Record an age-suitability and curriculum judgement from a named reviewer. This is a **separate** judgement from step 2 and does not substitute for it.
5. Attach the existing manual review as advisory, labelled.

**Exit:** a complete bundle per candidate, or a recorded reason it could not be completed.

### 6.1 Editorial interpretation evidence collection

This step is new, it is mandatory, and **it has never been performed for any candidate**. No complete admission bundle can exist without it, so none of the five is closer to admissible than this step allows — a passing recompute notwithstanding.

It is performed once per candidate **per revision**. A new revision of an in-scope candidate voids the assessment bound to the previous one; re-hashing and re-running the solver does not re-establish it.

For each of the five candidates:

1. **Resolve the registered solver assumptions from the live registry**, not from the bundle, the sidecar or the draft packet. Capture the registry key, the declared `givens`, and a written statement of the model the solver actually evaluates.
2. **Present those assumptions to the reviewer explicitly**, alongside the stem, options and declared key. A reviewer who was never shown the solver's interpretation cannot have affirmed it, and the record is required to show what they were shown.
3. **Record four separate judgements** — prompt-to-solver assumptions, exhaustiveness, ambiguity, and alternative defensible answers — each able to fail on its own. A single overall verdict is not acceptable.
4. **Bind the record** to `candidateId`, `factoryRevision` and the exact publication content hash, matching the recompute evidence for the same revision.
5. **Name the reviewer and their qualification.** The reviewer must be one of the three permitted roles. This is the blocker noted in section 9 item 6: no such reviewer is currently engaged.

The per-candidate starting points are in `solver-coverage.md` section 3a. Two warrant specific attention when the assessment is commissioned:

- **`nr-022`** — `givens: [8]`. Both ratios and the direction of the comparison live in the solver and appear in the stem only as the words "three times" and "twice". The reviewer must affirm the relational structure explicitly; the numeric path never compares it to anything.
- **`maths-014`** — admissibility depends on the exhaustiveness clause added in `45b6cdab`. The reviewer must confirm the clause is present and that it closes the population, since the solver's `(5 + 3) × unit` assumes closure without checking for it.

The existing advisory review may be shown to the reviewer as context. It is not an input to the assessment and cannot pre-empt any of the four judgements.

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
| 4 | — *(cleared from the critical path)* The five in-scope candidates already have first-party recompute. `nr-001` and `vr-032` are out of scope, so their missing entries no longer block the route | — |
| 5 | No originality engine selected; procurement deliberately open pending a coverage, limitation and cost comparison | Owner (procurement) |
| 6 | No qualified human reviewer engaged, for either the editorial interpretation check (phase 2e step 2) or age-suitability. Both are mandatory and neither has been performed for any candidate | Owner |
| 7 | Class B and C deferred; no funded provider API access | Owner (procurement) |

Nothing downstream of blocker 1 should begin until it clears.
