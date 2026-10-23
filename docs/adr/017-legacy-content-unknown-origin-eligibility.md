# ADR-017: Deterministic-only admission route for legacy content with unknown original authorship

- **Status:** PROPOSED — not adopted, not authorised, not implemented
- **Scope direction:** narrowed on owner instruction, 2026-10-23 (five-candidate initial engineering scope; `nr-001` conditional; `vr-032` deferred). Direction shapes this proposal; it is not adoption, and the status above is unchanged.
- **Date:** 2026-10-23
- **Supersedes within this programme:** the withdrawn first draft of this ADR (see `docs/reviews/legacy-content-provenance-phase2/README.md`, "Withdrawn material")
- **Spec:** `docs/spec/legacy-content-unknown-origin-policy.md`
- **Phase:** 2a (policy only)

## Context

Phase 1 (`docs/spec/legacy-content-provenance-phase1.md`, merged by PR #74 at `714ad64155b3ba3109695bf44c3d14ab7473da4c`) established a truthful, fail-closed representation for legacy content: `kind: legacy_import`, provenance version 2, `generatorAdapter: { class: "legacy_import", identity: null }`, and an `originalGeneration` block recording `status: "unverified"` with provider, model, prompt, prompt hash, generation timestamp and generation event all null.

Phase 1 then refused these candidates everywhere: independent-review clearance, staging, publication eligibility, publication replay, manifest validation and bank assembly. The Phase 1 specification is explicit that this blanket refusal is "a conservative implementation boundary, not approval of a new unknown-origin review policy", and that any future eligibility route "needs a separately reviewed governance decision and implementation".

This ADR is that governance decision, deliberately scoped as narrowly as the evidence supports.

Two facts constrain what can honestly be proposed today.

**Original authorship is unknown and will remain unknown.** The 12 Year 6 Scholarship sample candidates in PR #73 (`dcb60a80f3f6eabdb522b20202929d2e3f328a94`) have verified Git lineage but no original generation execution record. `docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json` classifies all 12 as UNVERIFIED. Nothing in this ADR changes that, and no field anywhere may be populated to suggest otherwise.

**No authenticated external provider review exists, for any provider.** Both API attempts recorded in PR #73 failed before producing a review: Google returned `404` (`gemini-2.5-pro` no longer available to new users) and then `402` (`RESOURCE_EXHAUSTED`, prepayment credits depleted); OpenAI returned `429` (`insufficient_quota`, `credit_balance_exhausted`) for `gpt-5.4`. The only completed external review is the manual ChatGPT pass, which `review-summary.json` itself classifies as `manual_user_attested` with "missing authenticated server API envelope, HTTP headers, request ID, and cryptographic transport bindings". Any policy whose admission route depends on obtaining a provider API review is, today, a policy that admits nothing.

## Decision

Adopt a **single, narrow, explicitly named admission route for deterministically verifiable content only**, and leave every other category at the Phase 1 hold.

### 1. Scope: policy eligibility and engineering scope are separate questions

Two questions are decided separately, and conflating them is how a narrow route becomes a wide one.

**Policy eligibility** asks whether a class of content *could ever* be admitted by this route. **Engineering scope** asks which candidates the first implementation is authorised to touch. A candidate can be policy-eligible and still be out of engineering scope, and nothing about it moves until it is in both.

The route applies to content whose correct answer is recomputable by a first-party algorithm from the stated prompt, independently of the candidate's own declared working.

#### 1.1 In the initial engineering scope — five candidates

`scholarship-y6-nr-022`, `scholarship-y6-nr-023`, `scholarship-y6-maths-004`, `scholarship-y6-maths-007`, `scholarship-y6-maths-014`.

Each is already covered by a registered first-party recompute entry that exists, runs in CI today, declares its own givens and ignores the candidate's `solverParams`. No new solver work is required for any of them. This is the entire scope the first implementation PR may address.

#### 1.2 Policy-eligible, outside the initial engineering scope — one candidate

`scholarship-y6-nr-001` is deterministically recomputable and fits the existing numeric registry shape, so it is **policy-eligible**. It is **not** in the initial engineering scope.

It enters scope only after a genuine first-party registry implementation — an entry declaring its own givens and its own `solve`, so that the recompute derives the answer rather than replaying the candidate's sidecar parameters — **and** regression tests covering it. Wiring the existing parameter-driven `solveNumberSeries` to the candidate's own sidecar rule would not satisfy this and must not be mistaken for it. Until both exist and are separately reviewed, `nr-001` is treated exactly as an out-of-scope candidate and is refused.

#### 1.3 Deferred, eligibility not established — one candidate

`scholarship-y6-vr-032` is **DEFERRED**. Its correctness is propositional (modus tollens) and deterministically decidable, but it is not numeric, and the attestation contract admits only numeric givens, numeric solving and numeric option matching.

Admitting it would require a new non-numeric deterministic attestation category. Whether that category belongs in this route at all is a question this ADR does not answer and does not presume. `vr-032` is deferred until that category is **separately justified and reviewed on its own merits**. It is not in scope, and its policy eligibility is open rather than granted.

#### 1.4 Deferred — Class B and Class C

Judgement-based verbal reasoning (`vr-001`, `vr-016`) and the reading-comprehension passage and its items (`rc-001`, `rc-002`, `rc-003`) are **DEFERRED**. They are not retired, not rewritten and not altered. See `docs/reviews/legacy-content-provenance-phase2/deferred-class-b-c-register.md`, which also carries `vr-032` under its own heading.

### 2. The route is named for what it proves, and only that

The route is `deterministic_legacy_admission`. It establishes **recomputed correctness**. It establishes that under a registered first-party interpretation of the problem the arithmetic yields the declared key. It does not establish that the stem admits only that interpretation — that is requirement 2 of section 3, a separate human check — and it does not establish authorship, review independence, originality or copyright position. It must never be recorded, named or surfaced as if it did any of these.

Concretely: `isProductionGradeIndependentReview` is **not** modified, and must not be made to return `true` for any candidate whose generator identity is null. Unknown-origin candidates admitted under this route carry `independentReviewStatus: "not_established_unknown_origin"` permanently. The different-provider rule in `docs/REVIEW_INDEPENDENCE_POLICY.md` is untouched.

This is consistent with that policy's existing reasoning, which already holds that deterministically computable content "never reaches this rule — its correctness gate proves it outright and no semantic review is required". The gap Phase 2 closes is not in the independence rule; it is that Phase 1 refused deterministic legacy content for implementation safety rather than on principle.

### 3. Required evidence

A candidate inside the engineering scope of section 1.1 MAY become eligible only when all of the following hold. A candidate outside that scope is refused regardless of the evidence attached to it. Each is independently verifiable and fails closed when absent, malformed or stale:

1. **First-party recomputed correctness.** A registered first-party solver recomputes the answer from the prompt's own stated quantities, ignoring the candidate's `solverParams` and any sidecar constraint strings, and derives exactly the declared key **under that solver's registered interpretation of the problem**. Hash-bound to the exact candidate revision. This establishes the arithmetic and nothing about the prose; see requirement 2.
2. **Editorial interpretation check.** A named, qualified human affirms, against the exact content hash, that the solver's assumptions are the stem's assumptions, that the stated conditions are exhaustive, that the stem admits no second defensible reading, and that no non-keyed option is defensible under the stated information. A recompute cannot supply this: `maths-014` passed its recompute identically before and after the fix that removed three defensible answers, and the defect was found by human review. See `docs/reviews/legacy-content-provenance-phase2/threat-model.md` T4.
3. **Exact candidate and revision binding.** The evidence names the `rawQuestionHash`, `factoryCandidateHash` and `publicationContentHash` it was computed against. Any drift invalidates it.
4. **Originality assessment.** A recorded, bounded assessment capable of returning a match, an uncertain result or a rejection (section 5 below).
5. **Age-suitability and curriculum check.** A recorded human editorial judgement against the Year 6 scholarship standard.
6. **Independently authorised human approval.** Subject to the separate security design requirement in section 6; until that requirement is met, no candidate is admissible.

Advisory evidence — including the existing manual ChatGPT review — may be attached and must be labelled advisory. It is corroboration. It is not part of the admission test and cannot substitute for any of the six items above. In particular it cannot substitute for requirement 2: the advisory review that found the `maths-014` defect was valuable precisely because a qualified human read the stem, and that function must be performed by an accountable, named reviewer inside the admission test rather than borrowed from an unauthenticated transcript.

### 4. Phase 1 refusals stay active

Nothing in this ADR relaxes any current gate. `orchestrateStaging`, `validatePublicationSource`, publication eligibility, replay and bank assembly continue to refuse `kind: legacy_import` exactly as they do today. The route described here becomes real only through a separately reviewed engineering change, authorised and validated on its own merits. Adoption of this ADR authorises design, not behaviour.

In particular, the `legacy_import` generator class is **not** added back to the publishable allow-list that PR #74 introduced. An admitted candidate must be distinguishable from an unadmitted one by more than fields a single writer controls.

### 5. Originality evidence must be able to fail

Originality records a search, not a verdict about the world. The schema must be able to represent matches found, partial or uncertain matches, an inconclusive run, and an outright rejection. A record that can only express success is not evidence.

No engine has been selected and no search has been run against any of the 12 candidates. Engine procurement is deliberately left open pending a realistic comparison of coverage, limitations and cost, so this ADR specifies the shape the evidence must take and does not name the tool that will produce it.

No originality record may assert zero risk, originality as a fact, or copyright clearance. Copyright position is a legal determination and is out of scope for any tool in this repository. The honest claim has the form: *this engine, over this corpus, on this date, with this query set, returned these matches.*

### 6. Approval authentication and the legacy ledger are separate security requirements

Two controls are named in this programme and are **not** designed by this ADR:

- **Approval authentication.** Git GPG/SSH signing is a plausible primitive, but signing alone is not authorisation. A usable design must specify signer trust (which keys, registered where, protected by what), the exact canonical payload the signature covers (candidate identity, publication content hash, decision), the binding between the approval artefact and the signing commit, and key lifecycle and revocation. Until all four are specified and reviewed, no claim of cryptographic authorisation may be made.
- **Durable legacy-origin ledger.** A tamper-evident record of which candidate hashes originated in a legacy import transaction. Phase 1 recorded why this was not built: the importer's journal lives in the untracked factory workspace and the candidate record is consumed at publication.

Each requires its own design, its own **independent** review and its own implementation PR. Neither may be designed or reviewed as part of the admission-gate change that consumes it, because a control reviewed only by the change that needs it is not independently reviewed. Neither is assumed to exist by this ADR, and no gate described here may depend on a control that has not been built.

### 7. No content changes

Answer keys, stems, options, explanations, passages, difficulty metadata, candidate hashes and publication hashes are unchanged for all 12 candidates. `vr-001` and `nr-023` retain `difficulty: medium`. Reviewer difficulty observations are recorded as observations and acted on only under explicit, separate owner instruction, because any such edit changes the content hashes and invalidates the bindings above.

## Consequences

- Five candidates gain a defined, narrow, honest path to eligibility, and no new solver work is required for any of them. Six keep their existing reviews as advisory evidence and move no further.
- `nr-001` is policy-eligible but out of scope until a genuine first-party registry entry and regression tests exist. `vr-032` is deferred with its eligibility open. Neither has a first-party recompute entry today, so neither can satisfy requirement 1 of section 3. See `docs/reviews/legacy-content-provenance-phase2/solver-coverage.md`.
- Narrowing to five is itself a control: the first implementation touches only candidates whose correctness machinery already exists, so the admission gate is reviewed against working evidence rather than against solvers written to make the gate pass.
- The programme stops depending on provider API availability, which has failed on every attempt so far.
- `isProductionGradeIndependentReview` keeps a single, true meaning, so the distinction the 2026-07-30 audit relied on stays legible in stored data.
- Admitting five items does **not** authorise releasing a reduced version of the 12-question scholarship sample. The sample is a pinned set; a five-item release is a different product decision requiring its own authorisation.

## Alternatives considered

- **Permanent ineligibility.** Defensible, but discards content whose correctness is mechanically provable, for a reason (unknown authorship) that deterministic proof does not depend on.
- **Universal re-authoring.** Rejected on current tooling. The only publishable generator class available for new AI-authored prose is `manual_external`, which the repository itself defines as "untrusted external-LLM/hand-written content ingested via the inbox workflow"; `live_provider` is marked "(future)" and is not implemented. Re-authoring today would substitute attested provenance for unknown provenance, not verified provenance for unknown provenance.
- **Multi-provider consensus for judgement content.** Deferred rather than rejected. Reviews from two distinct providers are **stronger corroboration** than one, and that is the whole of the claim. An earlier version of this ADR went further and asserted that at most one of two providers could share lineage with the unknown generator, so at least one lineage-independent review would always survive. **That assertion is withdrawn** (independent review finding P2-1): it is unsound when the original generation history is unknown. Nothing is known about which model, which provider, or how many of them produced the original content, so there is no basis for bounding the overlap at one. The original could have been produced by a model related to both reviewers, by an ensemble, or by a system whose lineage intersects both in ways no party can enumerate. Corroboration from two providers therefore **cannot guarantee a lineage-independent review**, and no count of agreeing providers converts corroboration into verified independence. Separately, no provider API call has yet succeeded. Revisit when funded API access exists.
