# Owner adoption decision — ADR-017, Phase 2a governance policy

**Decision:** ADR-017 is **ADOPTED** as the Phase 2a governance policy for deterministic legacy content.
**Decided by:** repository owner, by explicit written decision.
**Policy decision date:** 2026-10-24.
**Reviewed commit the decision was taken against:** `206d0dd48a07da5bc3e32fea12bd663d140bfddf`.
**Nature of the decision:** policy design only.

---

## 1. Exact scope of authorisation

Adoption is a decision about what the policy *is*. It is not permission to do anything to content.

| Adoption **does** authorise | Adoption **does not** authorise |
|---|---|
| ADR-017 as the governing policy position for deterministic legacy content | Any change to gate behaviour |
| Design work on the `deterministic_legacy_admission` route | Implementation of that route without separate authorisation |
| Design work on the two Phase 2b security prerequisites | Admission of any candidate |
| Treating the six evidence requirements as the settled contract | Ingestion, staging, publication, deployment or release |
| Planning the Phase 2b execution sequence | Merging PR #75, or any pull request, into `dev` or `main` |
| | Any change to PR #73, scholarship content, answer keys, difficulty or source evidence |
| | Any claim that a qualified editorial review has occurred |
| | Any change to originality-engine procurement, which remains open |

**Three separate approvals remain outstanding and are each the owner's:** implementation approval, admission approval, and release approval. Adoption grants none of them.

## 2. What is adopted

| Item | Position at adoption |
|---|---|
| Initial engineering scope | `scholarship-y6-nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` — five candidates |
| `nr-001` | Policy-eligible, **conditional**, outside initial scope. Enters only on a genuine first-party registry entry **and** regression tests, separately reviewed |
| `vr-032` | **Deferred.** Eligibility open, pending separate justification of a non-numeric deterministic attestation category |
| Class B (`vr-001`, `vr-016`) and Class C (`rc-001`, `rc-002`, `rc-003` + shared passage) | **Deferred**, unchanged, existing reviews retained as advisory only |
| Original generation | Remains **`unverified`** for all 12 candidates. No field may be populated to suggest otherwise |
| Independent review | Remains **not established** for unknown-origin content. `isProductionGradeIndependentReview` is not modified; `independentReviewStatus: "not_established_unknown_origin"` is permanent |
| Six admission evidence requirements | All remain **mandatory**. None is satisfied for any candidate today |
| Phase 1 fail-closed gates | **Unchanged.** `orchestrateStaging`, `validatePublicationSource`, publication eligibility, replay and bank assembly continue to refuse `kind: legacy_import` exactly as today |
| `vr-001` and `nr-023` difficulty | Remain `medium` |
| Shortened scholarship paper | **Not authorised.** Not proposed, and a separate product decision if ever raised |

### The six mandatory evidence requirements

Unchanged by adoption, and none currently met:

1. First-party recomputed correctness (D2-bound)
2. Editorial interpretation check — **never performed for any candidate**
3. Exact candidate and revision binding (D1, D2, D3, each independently recomputed)
4. Originality assessment — no engine selected
5. Age-suitability and curriculum check — no reviewer engaged
6. Authorised human approval — **control does not exist**

## 3. Independent review evidence

Two independent review rounds bear on this decision, and the adoption record previously conflated them by naming the earlier REQUEST CHANGES round as the final review. They are distinguished here because this programme's own policy forbids overstating what evidence establishes.

| | Round 4 — historical | Round 5 — **final** |
|---|---|---|
| Reviewed SHA | `3b56e1578b9770312ec5827eadd5a952098d412b` | `206d0dd48a07da5bc3e32fea12bd663d140bfddf` |
| Verdict | **REQUEST CHANGES** — 1 × P1, 4 × P2 | **READY FOR OWNER POLICY ADOPTION DECISION** |
| Outstanding P0/P1 | 1 × P1 (R4-P1), since fixed | **None** |
| Outstanding P2 | 4, all addressed in `206d0dd4` | 2, both **non-blocking follow-ups** (F-1, F-2 in section 4) |
| Standing | Superseded. It reviewed a commit that no longer is HEAD | The review the adoption decision rests on |
| Reviewer | A separate review agent, run in isolation from the authoring context | A separate review agent, run in isolation from the authoring context |

Round 4's findings were the input to `206d0dd4`; round 5 reviewed the result and cleared it. Neither round is a GitHub review submission.

### 3.1 Evidence class — both rounds

| Property | Value |
|---|---|
| Evidence class | **Model-generated review, owner-supplied,** for both rounds |
| Provenance strength | No authenticated API envelope, no request ID, no transport binding, for either round |
| **Not** | A GitHub pull-request review, a human subject-matter-expert review, or an API-authenticated independent review. No review of any of those kinds exists for this PR, and none is claimed |

This is the same honesty standard applied to the `manual_user_attested` ChatGPT evidence elsewhere in this programme. Both reviews are corroboration for a policy decision; neither is admission evidence and neither carries weight in any gate. In particular, the round-5 verdict is a **model's** readiness opinion, not an independent attestation that the policy is correct — the owner's decision in section 1 is the decision, and the review is one input to it.

### 3.2 Round-4 findings and disposition

All five round-4 findings were addressed in `206d0dd4`, which is the commit round 5 then reviewed.

| Finding | Substance | Disposition |
|---|---|---|
| **R4-P1** | Case 18ae, the stated H-1 regression guard, could not detect an H-1 recurrence: `editorialInterpretation` is a required member and Zod runs `superRefine` only after base parse, so the hash-domain refinements would never execute | Fixed — rewritten as case **H9** |
| **R4-P2-A** | `schemas.md` §0 called `eligibility.ts` the only production call site supplying an expected hash; `derive-answer.ts:867` also does | Fixed |
| **R4-P2-B** | `recomputedByVerifier: z.literal(true)` was commented "a bundle author cannot assert it", backwards for a submitted-bundle schema | Fixed — field removed |
| **R4-P2-C** | "the bundle cannot currently validate" misdescribes `z.never().optional()`, which accepts omission | Fixed |
| **R4-P2-D** | The reconciliation markdown claimed to be machine-generated; `reconcile.py` emits only the JSON | Fixed — and recorded in T7 as an open instance of that threat |

### 3.3 Satisfiability: the round-5 executed synthetic schema test

The central question across rounds 4 and 5 was whether the corrected contract is **satisfiable**, since the preceding defect (H-1) was an unsatisfiable contract that no test could have caught.

Round 4 answered this by reasoning: refinements (a)–(f) all force one value (D2) with no field required to equal two different values; the only D3 constraint touches no D2 field; and D2 and D3 cannot collide structurally because the published projection carries fields the factory candidate does not.

Round 5 answered it by **execution**. The reviewer reported running the proposed Zod schema snippets from `schemas.md` against synthetic, schema-complete fixtures for all five in-scope candidates:

| What the reviewer reported | Result |
|---|---|
| `safeParse` on a complete bundle, all five candidates | **5 / 5 `success === true`** |
| D1, D2 and D3 for all five candidates | Independently recomputed and verified |
| Negative control: the erroneous D2/D3 equality reintroduced | **5 / 5 failures** |

The negative control is the part that matters. A positive-only result cannot distinguish a satisfiable contract from refinements that never execute — which is exactly how H-1 survived, and exactly what round 4's R4-P1 finding was about. Reintroducing the defect and observing 5/5 failures shows the refinements do run and do discriminate.

**Evidence class.** This is an executed test, but it is executed **model-generated, owner-supplied** evidence, on the same footing as the reviews themselves: there is no committed transcript, no CI record and no transport binding, and it was **not re-executed in the authoring context**. It is recorded here as the reviewer's report of their own run, not as a repository test result.

#### What this test is not

The executed synthetic schema test and the specified H9 regression test are different artefacts and must not be read as each other.

| | Round-5 synthetic schema test | **H9** admission-gate regression test |
|---|---|---|
| Exists? | Executed once, by the reviewer, ad hoc | **Specified only.** Not implemented |
| Subject | The *proposed* Zod snippets in `schemas.md`, run standalone | The *implemented* admission gate |
| Fixtures | Synthetic, hand-built for the run | Repository fixtures |
| In CI? | **No.** No committed test file, no CI job, nothing re-runs it | **No.** Becomes a running control only in the Phase 2d implementation PR |
| Durability | None. A later edit to the snippets is caught by nothing | The standing satisfiability control, once it exists |
| Status | Reported pass, 5/5, with a passing negative control | **Never executed.** No result is claimed for H9 anywhere |

So the satisfiability question has a reasoned answer (round 4), and a one-off executed corroboration of that answer against the proposed snippets (round 5). What it does **not** have is a durable guard. Until H9 is implemented in Phase 2d, nothing in CI would catch a reintroduced unsatisfiable refinement, and `gate-and-test-changes.md` case H9 remains a specification.

Independently re-verified in the authoring context before the round-4 fixes were applied: the Zod base-parse/`superRefine` ordering behind R4-P1; the `derive-answer.ts:867` call site; `reconcile.py` emitting only JSON; and the numbering collisions. The hash-domain values were reproduced twice, independently, and agree.

## 4. P2 follow-ups — non-blocking maintenance

Tracked here so they are not lost. Neither blocks adoption, and neither is an engineering implementation of the admission route.

| # | Item | Status |
|---|---|---|
| **F-1** | Generate the reconciliation markdown's per-candidate tables automatically from committed evidence, rather than hand-transcribing them. `reconcile.py` currently emits only the JSON. The tables were independently verified correct at `3b56e157`, but the control is a reviewer re-checking them, not a script — and hand-transcription is what caused the first draft's withdrawal | **Open** |
| **F-2** | Correct the documentation distinction between legacy manifest preparation and import preflight | **Closed in this commit** |

### F-2, as resolved

The documents previously said the legacy import path does not derive D3 and that the source register's assertion was "the only thing standing behind that value". That understated an existing control, and is corrected:

- **Manifest preparation** — `prepareScholarshipLegacyManifest` (`legacy-import/bindings.ts`) recomputes D1 and D2 but **copies** D3 from the source register.
- **Import preflight** — `preflightLegacyImport` (`legacy-import/preflight.ts`) **recomputes D3 and fails closed**. It projects both the candidate and the pre-sidecar original through `buildPublishedQuestion`, requires `canonicalQuestionHash` of both to equal the manifest's `publicationContentHash`, and throws `publication_hash_mismatch` otherwise. It separately throws `source_register_binding_mismatch` if the register row disagrees with the manifest.

The admission gate must still derive D3 itself, because it runs after preflight and must not inherit a value on trust — but that is an extension of an existing guarantee, not the closing of an open hole.

F-2 was corrected immediately rather than deferred, because leaving a known-false statement inside a document being marked ADOPTED would conflict with Standing Rule 9. F-1 is left open because generating the tables is a change to `reconcile.py` with its own failure surface, and this change is documentation-only.

## 5. Phase 2b workstreams

Both are mandatory prerequisites. **No admission-gate implementation may bypass either.** Each requires its own design, its own independent review, and its own separately authorised implementation PR.

### Workstream A — authenticated approval architecture

| Element | Requirement |
|---|---|
| Protected signer authorisation | Which keys are authorised, where the registry lives, and how it is protected from modification by the same writer who uses it. **A-0 found this BLOCKED:** with one principal on the repository, no `CODEOWNERS` rule can name an independent owner, so the registry cannot be protected from its own user. A second trusted human is a prerequisite, not a detail |
| Branch protection | A precondition, not a detail. Protection is enabled on `dev` and `main` and does block force-pushes and deletion, but both have no rulesets, require zero approving reviews and do not enforce protections for admins, so a signer registry is circular without it. Verified 2026-10-24 with administrator access; see `phase2b-a0-branch-protection.md` |
| Canonical signed payload | The exact serialisation the signature covers, including candidate identity, publication content hash and the decision. An unconstrained signature field is satisfied by a signature over anything |
| Commit binding | The approval record must name the signing commit, and the verifier must fetch deeply enough to see it |
| Key lifecycle | Registration, rotation, revocation, and the status of approvals signed by a key later revoked |

Symmetric mechanisms (HMAC over a shared secret) are not acceptable: any party able to verify is able to forge.

### Workstream B — durable legacy-origin ledger

| Element | Requirement |
|---|---|
| Tracked import identity | Tamper-evident, tracked state binding candidate hashes to their import transaction, resolving the untracked-workspace problem Phase 1 recorded |
| Tamper detection | Verified at assembly, not merely written at import |
| Replay protection | An import transaction cannot be replayed to re-establish a stale binding |
| Relabelling prevention | An admitted candidate cannot be re-presented as ordinary generated content |

### Recommended execution order

1. **A-0 — branch protection on `dev`.** Everything in workstream A is circular without it, so it goes first. Assessed in `phase2b-a0-branch-protection.md`, with a verified gap analysis, a staged configuration and rollback plan, and the two approval trust models distinguished. **It is only partly cheap:** the settings portion is, but the part that makes a signer registry trustworthy — independent ownership of the self-authorisation paths — is **BLOCKED**, because the repository has exactly one principal with access (verified 2026-10-24) and so has nobody to name as an independent code owner. Administrator bypass is not an equivalent control. **No setting has been changed.**
2. **A — authenticated approval architecture.** Design, independent review, then a separately authorised implementation PR.
3. **B — durable legacy-origin ledger.** Independent of A and can run in parallel once A-0 lands, but sequence it after A if attention is limited: A gates requirement 6, which blocks every candidate, whereas B gates the integrity of an admission that cannot yet occur.
4. **Phase 2c — `nr-001` registry entry and regression tests**, only if the owner wants it in scope. Unblocked by A and B, and may run in parallel.
5. **Phase 2d — admission-gate implementation**, only after A and B are merged and validated. Includes the adversarial suite, with H9 as the standing satisfiability control.
6. **Phase 2e — evidence collection** for the five in-scope candidates. Needs an originality engine (procurement still open) and a named qualified reviewer for requirements 2 and 5; neither exists.

Two blockers sit outside the engineering sequence and should be started now because they have lead time: **engaging a qualified editorial reviewer**, and **the originality-engine coverage, limitation and cost comparison**.

## 6. Status after this decision

- ADR-017: **ADOPTED**, documentation-only, no behaviour changed.
- PR #75: **draft, unmerged.** Adoption does not authorise merging it.
- PR #73: unchanged at `dcb60a80`.
- Every Phase 1 refusal: active.
- Candidates admitted: **zero**, and none admissible — all five in-scope candidates refuse at requirement 2 alone, before requirements 4, 5 and 6 are reached.
