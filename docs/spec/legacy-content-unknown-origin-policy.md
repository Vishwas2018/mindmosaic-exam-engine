# Legacy content: deterministic-only admission policy (Phase 2 specification)

**Status:** PROPOSED — pending owner authorisation. Not adopted, not implemented.
**Phase:** 2a (policy only; documentation-only change)
**Governing decision:** `docs/adr/017-legacy-content-unknown-origin-eligibility.md`
**Preceding specifications:** `docs/REVIEW_INDEPENDENCE_POLICY.md`, `docs/spec/legacy-content-provenance-phase1.md`

---

## 1. What this specification does and does not do

It defines one admission route, `deterministic_legacy_admission`, for legacy candidates whose correct answer can be recomputed by a first-party algorithm. It defines the evidence that route requires, the gates that must refuse without it, and the two security controls that must be designed separately before the route can operate.

It does not relax any gate. It does not admit any candidate. It does not authorise ingestion, staging, publication, deployment or approval. Every Phase 1 refusal remains active until a separate engineering change is reviewed, authorised and validated on its own merits.

It makes no claim about authorship, review independence, originality as a fact, or copyright position for any legacy candidate.

---

## 2. Four evidence dimensions, and what each one cannot do

Educational content governance fails when one kind of evidence is read as another. The four dimensions below are independent; proof in one confers nothing in any other.

| Dimension | Establishes | Explicitly does not establish |
|---|---|---|
| 1. Recomputed correctness | The declared key follows from the stated prompt **under the registered solver's interpretation of it** | That the prose admits only that interpretation; who authored the item; originality; age-fit |
| 1a. Editorial interpretation check | That the stem's language permits only the solver's reading, and that no non-keyed option is defensible | Arithmetic correctness, which dimension 1 establishes |
| 2. Authorship provenance | Provider, model, prompt, generation event | Whether the answer is correct; whether the text is original |
| 3. Review independence | Reviewer shares no lineage with the generator | Authorship history; factual truth |
| 4. Originality search | What a named engine found, over a named corpus, on a date | Originality as a fact; copyright clearance |

**Non-transitivity is the operative rule.** For unknown-origin content, dimension 2 is permanently unavailable and dimension 3 therefore cannot be evaluated. This policy admits content on dimensions 1 **and** 1a, with dimension 4 recorded as a bounded search and human judgement recorded separately. It does not infer 2 or 3 from 1.

Dimensions 1 and 1a are listed separately because collapsing them is a known, evidenced failure. `maths-014` passed its numeric recompute cleanly while its stem still admitted three defensible answers; the solver's output was identical before and after the fix, and the defect was surfaced instead by the **manually submitted ChatGPT advisory review** (`manual_user_attested`, `chatgpt-unversioned`, no authenticated API envelope) — not by the solver, and not by a qualified subject-matter expert, since none has examined any of these candidates. A policy that treats a green recompute as a correctness verdict inherits that blind spot.

Dimension 1a has consequently **never been satisfied for any of the 12 candidates**. It is a new requirement, it is mandatory, and no existing record discharges it. See `docs/reviews/legacy-content-provenance-phase2/threat-model.md` T4.

---

## 3. Scope

Scope is stated at two levels, because they are decided separately. **Policy eligibility** is whether a candidate could ever be admitted by this route. **Engineering scope** is which candidates the first implementation may address. Admission requires both.

Content is Class A when its correct answer is recomputable by a registered first-party solver from the quantities stated in the prompt, without executing or trusting the candidate's own declared working.

### 3.1 In the initial engineering scope — five candidates

| Candidate | Skill | Declared key | First-party recompute |
|---|---|---|---|
| `scholarship-y6-nr-022` | `nr-arithmetical-reasoning` | e | registered, in CI |
| `scholarship-y6-nr-023` | `nr-arithmetical-reasoning` | b | registered, in CI |
| `scholarship-y6-maths-004` | `maths-directed-numbers` | b | registered, in CI |
| `scholarship-y6-maths-007` | `maths-percentages` | a | registered, in CI |
| `scholarship-y6-maths-014` | `maths-ratios-rates` | c | registered, in CI |

No new solver work is required for any of these five. Keys are reproduced from `docs/reviews/legacy-content-provenance-phase2/source-evidence-reconciliation.json`, generated mechanically from PR #73 at `dcb60a80`.

### 3.1.1 Policy-eligible, outside the initial engineering scope — one candidate

| Candidate | Skill | Declared key | Condition for entering scope |
|---|---|---|---|
| `scholarship-y6-nr-001` | `nr-number-series` | e | a genuine first-party registry entry **and** regression tests, both separately reviewed |

`nr-001` is deterministically recomputable and fits the existing numeric registry shape, so its policy eligibility is settled. Its engineering eligibility is not. The registry entry must declare its own givens and its own `solve`; attaching the existing parameter-driven `solveNumberSeries` to the candidate's sidecar rule replays the original author's model of the problem and does not satisfy this requirement. Until the entry and its regression tests exist, `nr-001` is refused as out of scope.

### 3.1.2 Deferred, eligibility not established — one candidate

| Candidate | Skill | Declared key | Status |
|---|---|---|---|
| `scholarship-y6-vr-032` | `vr-sentence-logic` | c | DEFERRED — non-numeric attestation not justified |

`vr-032` is propositional logic: deterministically decidable, but outside the attestation contract, which admits only numeric givens, numeric solving and numeric option matching. Admitting it requires a new non-numeric deterministic attestation category. Whether that category belongs in this route is an open question, not a deferred implementation task. `vr-032` is deferred until that category is separately justified and reviewed on its own merits.

### 3.2 Deferred — Class B and Class C, five candidates

`vr-001`, `vr-016` (judgement-based verbal reasoning) and `rc-001`, `rc-002`, `rc-003` with their shared passage (literary stimulus) are **DEFERRED**, with existing reviews preserved as advisory evidence. Counting `vr-032` from section 3.1.2, six of the twelve candidates are deferred. They remain at the Phase 1 hold. No retirement, rewrite, re-authoring or alteration is proposed. See `docs/reviews/legacy-content-provenance-phase2/deferred-class-b-c-register.md`.

### 3.3 Unchanged in all cases

Answer keys, stems, options, explanations, the reading passage, difficulty metadata, candidate hashes and publication hashes. `vr-001` and `nr-023` retain `difficulty: medium`.

---

## 4. The admission route

### 4.1 Name and meaning

```
governanceRoute: "deterministic_legacy_admission"
```

The route asserts exactly one thing: **a first-party algorithm recomputed the declared answer from the prompt, bound to an exact content hash.**

It is recorded alongside, never in place of:

```
originalGeneration.status:  "unverified"        // unchanged, permanently
independentReviewStatus:    "not_established_unknown_origin"
```

No code path may read this route as independence, and no surface may describe an item admitted under it as independently reviewed.

### 4.2 Required evidence bundle

All six components are mandatory. Any missing, malformed, unparseable or stale component evaluates to REJECT.

**0. Hash domains.** Three different hashes exist over three different objects, and no component may use one in place of another. **D1** `rawQuestionHash` = `hashJson(raw)`. **D2** `factoryCandidateHash` = `hashJson(candidateQuestionSchema.parse(candidate))` — **the domain `verifyFirstPartyScholarshipAttestation` binds to**, and the domain every evidence component below binds to. **D3** `publicationContentHash` = `canonicalQuestionHash(buildPublishedQuestion(candidate).question)` — the published projection, a different schema shape. D2 and D3 differ for all five in-scope candidates; D1 and D2 coincide for them only because none carries a solver sidecar. Full table and verified values in `docs/reviews/legacy-content-provenance-phase2/schemas.md` section 0.

**1. First-party solver execution.** A registered solver recomputes the answer. The recompute must read its inputs from the prompt and must not execute or trust `solverParams`, sidecar constraint strings or the candidate explanation. Records: solver identifier and version, the exact derived option id, the givens read from the prompt, unit handling, distractor evaluation, and the **D2 factory-candidate hash** the recompute was bound to. The solver identifier and its declared givens are resolved by the verifier from the live first-party registry, never taken from the bundle or from the candidate's sidecar.

**2. Exact candidate and revision binding.** Records `rawQuestionHash` (D1), `factoryCandidateHash` (D2), `publicationContentHash` (D3) and the factory revision. Each must equal the value the verifier **independently recomputes**; none may be accepted as asserted. In particular D3 must be derived by projecting the factory candidate through `buildPublishedQuestion`, not read from the source register, which is where `legacy-import/bindings.ts` currently copies it from. A recompute bound to a hash that no longer matches the candidate is stale and is discarded rather than reused.

**3. Originality assessment.** A bounded search record, per section 5.

**4. Editorial interpretation check.** A named, qualified human reviewer records, against the exact **D2 factory-candidate hash** and a hash of the content as actually displayed to them, a judgement on what the solver cannot reach:

- **Prompt-to-solver assumptions** — the solver's registered givens and its model of the problem are the ones the stem actually states. The reviewer is shown the solver's interpretation explicitly and must affirm or reject it.
- **Exhaustiveness** — the stem's stated conditions close the problem, with no unstated population, category or constraint left open.
- **Ambiguity** — the stem admits no second defensible reading.
- **Alternative defensible answers** — no non-keyed option is defensible under the stated information.

A `REVISE` or `not_suitable` outcome on any of the four rejects the candidate. This component is mandatory and is **not** satisfied by a passing recompute, by the advisory review of section 4.3, or by the age-suitability check below.

**5. Age-suitability and curriculum check.** A named human records a judgement on year-level suitability, syllabus mapping and distractor quality against the exact **D2 factory-candidate hash**.

**6. Authorised human approval.** Per section 6. Not available today.

### 4.3 Advisory evidence

The manual ChatGPT review in PR #73 agrees with the declared key on all 12 candidates. It is retained and attached as advisory corroboration, labelled with the classification its own summary records: `manual_user_attested`, `chatgpt-unversioned`, no authenticated API envelope. It is not an input to the admission test, carries no weight in any gate, and may not be described as an independent review.

---

## 5. Originality evidence

### 5.1 What is claimed

Only this: *engine E, over corpus C, on date D, with query set Q, returned result R.*

### 5.1.1 No engine is selected

Engine procurement is deliberately undecided. No search has been run against any of the 12 candidates. A selection requires a realistic comparison of coverage, documented limitations and cost, per `docs/reviews/legacy-content-provenance-phase2/decisions-for-owner.md` A5. This specification fixes the shape of the record and the statuses it must be able to express; it does not name the tool, and no engine may be assumed.

### 5.2 What may never be claimed

Zero plagiarism risk. Originality as an established fact. Copyright clearance or non-infringement. Absence of non-verbatim or structural reproduction. These are either legal determinations or claims no similarity search can support.

### 5.3 The record must be able to fail

A conforming originality record can express:

- `no_match_found` — the search ran and returned nothing above threshold
- `matches_found` — with the matched spans, sources and similarity measures
- `uncertain` — partial or ambiguous matches needing human adjudication
- `inconclusive` — the engine was unavailable, rate-limited, or the corpus did not cover the material
- `rejected` — a human reviewed matches and judged the item unusable

A schema that can only encode success is not evidence and must not be accepted. Every run is recorded, including superseded ones, so that repeated attempts are visible rather than hidden.

### 5.4 Coverage limits are recorded, not implied

The record states which corpora were and were not searched. A web n-gram search does not cover paywalled commercial practice papers, print-only textbooks, or structural reproduction. Those gaps are part of the record.

---

## 6. Human approval: a separate security design requirement

Standing Rule 8 requires human sign-off. Phase 1 approvals are plain JSON with a display-name `approvedBy`, which authenticates nobody.

Git GPG/SSH signing is a plausible primitive, but **signing is not authorisation**, and this specification does not claim otherwise. Before any admission route may rely on it, a separate design must specify and a separate review must accept all four of:

1. **Signer trust.** Which keys are authorised, where the registry lives, and how that registry is protected from modification by the same writer who uses it. A signer list a writer can extend in the commit that uses it is circular. This requires branch protection that is currently absent on `dev`.
2. **Signed payload binding.** The exact canonical serialisation the signature covers, which must include candidate identity, publication content hash and the approval decision. An unconstrained signature field is satisfied by a signature over anything.
3. **Artefact-to-commit binding.** The approval record must name the commit that signs it. Without it, "the introducing commit" is ambiguous after squash, rebase or cherry-pick, and is unavailable in a shallow CI checkout.
4. **Key lifecycle.** Registration, rotation, revocation, and what happens to approvals signed by a key later revoked.

Symmetric mechanisms (HMAC over a shared secret) are not acceptable for this purpose: any party able to verify is able to forge, and they provide no non-repudiation.

Until all four are specified, reviewed and implemented, no candidate is admissible under this policy, and no document in this repository may describe approvals as cryptographically authorised.

---

## 7. Durable legacy-origin ledger: a separate security design requirement

The route needs a tamper-evident record of which candidate hashes originated in a legacy import transaction, so that an admitted candidate cannot be relabelled as ordinary generated content.

This does not exist. Phase 1 recorded why: the importer's journal lives in the untracked factory workspace, and the candidate record is consumed at publication. Building it requires deciding what becomes tracked state, how it is written atomically with the import transaction, and how it is verified at assembly.

It is a separate design, a separate review and a separate implementation. No gate in this specification may assume it exists.

---

## 8. Gate behaviour

### 8.1 Current behaviour is preserved until separately authorised

| Component | Behaviour today | Unchanged by this specification |
|---|---|---|
| `isProductionGradeIndependentReview` | `false` for null generator identity | Yes — explicitly not modified |
| `orchestrateStaging` | Refuses all `kind: legacy_import` | Yes |
| `validatePublicationSource` | Allow-list of `deterministic_fixture`, `manual_external`, `live_provider`; refuses `legacy_import` | Yes |
| Publication eligibility, replay, bank assembly | Refuse `kind: legacy_import` | Yes |
| `questions:import-legacy` | Intake only; records remain ineligible | Yes |

### 8.2 Proposed future behaviour, for a separate engineering PR

When, and only when, the controls in sections 6 and 7 exist and the engineering change is separately reviewed:

- The gate carries an explicit scope check. A candidate outside the engineering scope of section 3.1 is refused before any evidence is evaluated, so that attaching a bundle to `nr-001`, `vr-032` or a Class B or C candidate cannot admit it. Widening that scope is a documentation change plus a separately reviewed engineering change, never a side effect of adding a solver.
- A **new** predicate, distinct from `isProductionGradeIndependentReview`, evaluates the deterministic admission bundle. Working name: `hasDeterministicLegacyCorrectnessEvidence`. It returns correctness evidence status only, and never sets or implies an independence verdict.
- `orchestrateStaging` admits a legacy candidate only when the bundle validates, the ledger row exists and verifies, and the approval verifies against the authorised signer registry. Absent any one, it refuses as today.
- `validatePublicationSource` keeps refusing the `legacy_import` adapter class. Admitted candidates carry a distinct adapter class, bound to a verified ledger row, so that an admitted manifest and an unadmitted one differ by more than fields a single writer controls.

### 8.3 Fail-closed invariants

1. **Missing evidence rejects.** Any absent, malformed or stale component rejects the candidate.
2. **No automatic upgrade.** Running a test, committing a review or attaching an advisory document never changes a candidate's route.
3. **No retroactive rewrites.** Historical records and Phase 1 records are immutable. New evidence is appended.
4. **Answer secrecy.** Any review packet withholds the key, per Standing Rules.
5. **Content change invalidates evidence.** Any edit to stem, options, key, explanation or metadata produces new hashes and voids every binding above.
6. **No implied independence.** No admitted candidate is described, stored or surfaced as independently reviewed.

---

## 9. The five-item scope is not a release decision

This policy, if adopted and later implemented, could make five candidates eligible — six if `nr-001` later enters scope. It does not authorise shipping a five-item or six-item scholarship sample.

The 12-question sample in PR #73 is a pinned set with pinned release identities. Releasing a reduced subset changes what a student sees, changes the sample's subject balance, and is a separate product decision requiring its own authorisation. Nothing in this programme should be read as approving it.
