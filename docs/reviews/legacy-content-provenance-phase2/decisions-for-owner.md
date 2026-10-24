# Decisions requiring owner authorisation

**Status:** **ADR-017 was ADOPTED by the owner on 2026-10-24**, at reviewed commit `206d0dd4`, after four rounds of independent review. A1–A4 were decided on 2026-10-23 and are carried into adoption unchanged; A5 remains **deliberately open**. Adoption is policy only — see `owner-adoption-decision.md` for the exact scope of what it does and does not authorise.

The decision set is deliberately smaller than the withdrawn first draft's. Several of its questions assumed capabilities this repository does not have, and are not real choices today. Those appear in section B as blocked rather than as options.

| Decision | Outcome | Recorded |
|---|---|---|
| **Adoption of ADR-017** | **ADOPTED — policy and design only** | **2026-10-24** |
| A1 Adopt the narrow deterministic route | Option A — support the route, correctness only | 2026-10-23 |
| A2 Candidate scope | Option A — five now, `nr-001` on condition, `vr-032` deferred | 2026-10-23 |
| A3 Security prerequisites | Option A — commission both, separately and independently reviewed | 2026-10-23 |
| A4 Difficulty for `vr-001` and `nr-023` | Option A — retain `medium` for both | 2026-10-23 |
| A5 Originality engine | **Open by direction** — undecided pending a coverage, limitation and cost comparison | 2026-10-23 |

---

## A. Live decisions

### A1 — Adopt the narrow deterministic route? — **DECIDED: Option A; ADR ADOPTED 2026-10-24**

**Owner decision (2026-10-24).** ADR-017 is adopted as the Phase 2a governance policy, against reviewed commit `206d0dd4`. The adoption is policy design only and authorises no behaviour; `owner-adoption-decision.md` records the scope.

**Owner direction (2026-10-23).** The `deterministic_legacy_admission` route is supported. It must establish correctness only, and must not imply known authorship or verified provider independence. At the time this was recorded it was support for the route as a policy position, not adoption; **adoption followed on 2026-10-24** after four rounds of independent review.

- **Option A (recommended): adopt ADR-017 as scoped.** One named route, `deterministic_legacy_admission`, for deterministically recomputable content only. Everything else stays at the Phase 1 hold. Adoption authorises design work, not behaviour.
- **Option B: permanent ineligibility.** Keep the Phase 1 hold indefinitely for all unknown-origin content.
- **Option C: defer the whole question.** Revisit when the security prerequisites exist anyway.

**Recommendation: Option A.** It is consistent with the existing review-independence policy, which already holds that deterministically computable content never reaches the different-provider rule because its correctness gate proves it outright. Phase 1 refused deterministic legacy content for implementation safety, not on principle, and said so.

Option B is coherent but discards content whose correctness is mechanically provable for a reason that deterministic proof does not depend on.

### A2 — Scope: which candidates are in? — **DECIDED: Option A**

**Owner direction (2026-10-23).** The initial engineering scope is five existing first-party recompute questions: `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`. `nr-001` is added only after a genuine first-party registry implementation **and** regression tests. `vr-032` is deferred until its non-numeric logic attestation is separately justified.

Two points the option text below did not carry, and which the ADR and specification now state explicitly:

- Regression tests are part of the condition on `nr-001`, not a follow-up to it.
- `vr-032` is deferred on an open eligibility question, not merely on missing engineering. Whether a non-numeric attestation category belongs in this route must be justified separately before it is built.

`solver-coverage.md` shows the original seven-item scope had an uneven floor.

- **Option A (recommended): five items now, two on condition.** `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` already satisfy the strongest correctness requirement with machinery that exists and runs in CI today. Add `nr-001` once a registry entry is written. Defer `vr-032` unless a non-numeric attestation category is wanted.
- **Option B: all seven, build what is missing.** Includes building a new non-numeric deterministic attestation category for one item.
- **Option C: five only.** Drop `nr-001` and `vr-032` from scope entirely.

**Recommendation: Option A.** The `nr-001` work is one registry entry; the `vr-032` work is a new attestation shape, which is larger than all the rest of the Class A work combined for a single question.

### A3 — Build the security prerequisites, or stop here? — **DECIDED: Option A**

**Owner direction (2026-10-23).** Authenticated human approvals and a durable legacy-origin ledger each require a separate design, independently reviewed. Neither may be designed or reviewed inside the admission-gate change that consumes it.

Admission cannot operate without approval authentication and a legacy-origin ledger. Neither exists; neither is designed.

- **Option A (recommended): commission both as separate designs.** Accept that Phase 2 delivers nothing operational until they land.
- **Option B: commission approval authentication only**, and accept the ledger gap as a documented residual risk.
- **Option C: stop after policy adoption.** Keep ADR-017 as a recorded position and build nothing.

**Recommendation: Option A**, with a realistic expectation: approval authentication requires branch protection changes on `dev`, which currently has no rulesets, requires zero approving reviews and does not enforce protections for admins. Without that, a signer registry is circular and signing is ceremony.

### A4 — Difficulty for `vr-001` and `nr-023` — **DECIDED: Option A**

**Owner direction (2026-10-23).** Retain `medium` for both. All 12 questions, the shared reading passage, answer keys, difficulty values and hashes are preserved unchanged.

Both are committed as `medium`. The reviewer recorded `easy` for `vr-001` and `challenging` for `nr-023`.

- **Option A (recommended): retain `medium` for both.** Record the observations; take no action.
- **Option B: apply the reviewer ratings.** Requires new hashes, new evidence bindings and re-pinned release identities.

**Recommendation: Option A.** The observation comes from the manual review that the policy elsewhere treats as advisory only; editing difficulty voids every hash binding in the reconciliation and the pinned release identities; and Phase 1 records are immutable, so a change is a new revision rather than an edit. If the owner wants either changed, it should be an explicit instruction naming the candidate and target value, handled as its own revision with fresh evidence.

### A5 — Originality: what engine, over what corpora? — **OPEN BY DIRECTION**

**Owner direction (2026-10-23).** Procurement stays undecided pending a realistic comparison of coverage, limitations and cost. This is a deliberate hold, not an oversight, and it is not a blocker on policy review — it is a blocker on evidence collection (Phase 2e).

No search has been run on any of the 12 candidates, and no engine has been selected. The policy requires a bounded search that can record matches, uncertainty and coverage gaps.

The comparison that unblocks this decision must state, per candidate engine:

1. **Coverage** — which corpora are actually searched, named rather than implied.
2. **Limitations** — what is known not to be covered: paywalled commercial practice papers, print-only textbooks, and structural or non-verbatim reproduction, which n-gram search does not detect at all.
3. **Cost** — per-query and total for the in-scope candidates, and whether repeat runs after content revision are affordable.

No recommendation is offered, because the answer depends on budget and on what corpora matter for Australian Year 6 scholarship material — and because no record may claim coverage it does not have.

---

## B. Not live decisions

These appear so that their absence is tracked, not forgotten.

### B1 — Class B admission via multi-provider corroboration — **BLOCKED**

Cannot be decided usefully. Every provider API attempt has failed: Google `404` then `402`, OpenAI `429`. The blocker is funded API access, a procurement matter. Revisit when a review can actually be executed. See the deferred register.

### B2 — Reading comprehension pathway — **DEFERRED, no action**

The withdrawn draft recommended retiring the passage and re-authoring it. That recommendation is withdrawn: re-authoring does not remove memorisation exposure, and cannot currently produce better provenance, because `live_provider` is unimplemented and `manual_external` is defined in the repository as untrusted. The passage and its three items are held unchanged.

### B3 — Releasing a shortened sample — **NOT PROPOSED**

A deterministic-only policy makes five of twelve candidates eligible, or six if `nr-001` later enters scope. That is not a release plan. Shipping a subset changes the sample's subject balance and what a student sees, and is a separate product decision with its own authorisation, release identities and review. Nothing in this programme requests it.

---

## C. What adoption does and does not authorise

| Adopting ADR-017 **does** | Adopting ADR-017 **does not** |
|---|---|
| Record a governance position on deterministic unknown-origin content | Change any gate behaviour |
| Authorise design work on the admission route | Authorise implementation without separate review |
| Define what evidence would be required | Admit, ingest, stage, publish or approve anything |
| Name the two outstanding security requirements | Create a factory record or modify PR #73 |
| Keep `vr-001` and `nr-023` at `medium` | Change any question content or hash |
| Fix the engineering scope at five candidates | Bring `nr-001` or `vr-032` into scope |
| Leave originality procurement open | Select or commit to an originality engine |
