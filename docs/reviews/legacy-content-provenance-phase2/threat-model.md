# Threat model for the deterministic legacy admission route

**Status:** analysis for the PROPOSED Phase 2a policy. Describes current code state and proposed future controls, and labels which is which throughout.

A correction governs this document. The withdrawn first draft credited countermeasures to controls that do not exist in this repository. Every countermeasure below is marked **[built]**, **[proposed]** or **[not designed]**, and no threat is treated as mitigated by a control that has not been built.

---

## 1. Assets

1. **Student exam experience** — accurate scoring, unambiguous stems, fair distractors, calibrated difficulty.
2. **Originality position** — absence of material reproduced from official papers (NAPLAN, ICAS, ACER), textbooks or commercial publishers. Note this is a position maintained by process, not a guarantee established by a tool.
3. **Audit trail integrity** — the chain from Git source through candidate, evidence, approval and published manifest.
4. **Truthfulness of governance records** — that no record claims more than was established. The withdrawn draft is itself an instance of this asset being damaged.

## 2. Trust boundaries

```
[ UNTRUSTED / HISTORICAL ]
  Local Git history, squashes, rebases; interactive LLM transcripts;
  lost prompts and databases; unverifiable authorship claims
            |
            |  (1) Ingestion boundary - questions:import-legacy        [built]
            v
[ CONTROLLED INTAKE - Phase 1 ]
  kind: legacy_import, provenanceVersion 2
  generatorAdapter.identity: null, originalGeneration.status: unverified
  Content and packet SHA-256 bindings; pinned manifest; transaction journal
  Refused at review, staging, publication, replay and assembly
            |
            |  (2) Admission gate - deterministic recompute + evidence  [proposed]
            v
[ ADMITTED FOR DETERMINISTIC CORRECTNESS ]
  Recomputed correctness only. Authorship still unverified.
  Independence still not established.
            |
            |  (3) Release boundary - approval + ledger          [not designed]
            v
[ PUBLISHED BANK ]
```

Boundary (3) does not exist. Nothing can cross it today, which is the intended state.

---

## 3. Threats

### T1 — Provenance transmutation: relabelling legacy content as generated

**Threat.** A writer edits a candidate to read `kind: "generated"` with a plausible provider, so it clears ordinary single-reviewer checks instead of the legacy hold.

**Impact.** Critical. Defeats the entire governance hold.

**Correction (independent review P1-1).** An earlier version of this section credited `knownCandidateProvenanceSchema` with three protections it does not have. It claimed the schema requires a valid `candidateGenerationEvent`, a positive integer `promptVersion` and a 64-character hexadecimal `promptHash`. **All three claims were false**, and they made the schema look like an authenticity control. It is not one. The corrected description below was read from `src/features/question-factory/provenance/candidate-provenance.ts` on this branch.

**What the schema actually requires.**

| Field | Actual rule | What the withdrawn claim said |
|---|---|---|
| `candidateGenerationEvent` | **Does not exist.** The identifier appears nowhere in `src/`. There is no generation-event field, mandatory or optional. | "requires a valid `candidateGenerationEvent`" |
| `promptVersion` | `z.string().trim().min(1).max(40)` — any nonempty string up to 40 characters. `"x"` validates. | "a positive integer" |
| `promptHash` | **Optional.** `z.string().trim().min(1).max(128)` when present — no hex character class, no length-64 constraint. `"not-a-hash"` validates. | "a 64-character hex `promptHash`" |
| `contentHash` | `z.string().trim().min(1).max(128)` — also not validated as a hex digest. | not previously described |
| `generatedAt` | `z.iso.datetime()` — required, and must parse as an ISO datetime. Any plausible timestamp satisfies it. | not previously described |

Two further properties matter and were not previously stated. `knownCandidateProvenanceSchema` is **not** `.strict()` — only the legacy variant is — so unknown keys are stripped rather than rejected. And in the legacy record the generation-event field is named `event` (`originalGenerationUnverifiedSchema`, pinned to `z.null()`); `candidateGenerationEvent` is a key used by the PR #73 `source-register.json` evidence artefact, not by the factory schema.

**Schema validation cannot authenticate historical generation.** This is the honest general statement, and it follows directly from the table. The schema constrains the *shape* of a provenance record. It has no access to the generation event, no transport evidence, no provider attestation and no way to distinguish a truthful record from a well-formed invented one. A writer who supplies `promptVersion: "v1"`, a plausible `generatedAt` and a plausible `contentHash` produces a record that validates completely. No amount of tightening the field types changes this: a regex on `promptHash` would force a 64-hex string, not a *true* one.

**Countermeasures.**
- **[built]** `validatePublicationSource` enforces a generator-class allow-list (`deterministic_fixture`, `manual_external`, `live_provider`) and refuses absent or malformed attribution, per PR #74. This is a real control, and it is the only built one on this path.
- **[not a countermeasure]** Provenance schema validation. Recorded here explicitly so it is not credited again. It rejects malformed records; it does not reject false ones.
- **[not designed]** A journal cross-check that refuses any candidate hash originating in a legacy import transaction from appearing as `generated`. **This does not exist.** Phase 1 recorded why: the importer's journal lives in the untracked factory workspace and the candidate record is consumed at publication. The withdrawn draft asserted this countermeasure as if implemented; it is not.

**Residual risk — an open technical weakness at the trust boundary, not merely a policy violation.**

The earlier text characterised fabrication as "a Zero Fabrication violation rather than a technical bypass". That framing is withdrawn. Describing the gap as a rule someone would have to break understates it: there is no technical control that the fabricating writer has to defeat, because the fields that would carry the evidence are unconstrained strings, optional, or absent from the schema entirely.

Stated plainly, and treated as **OPEN**:

1. A privileged writer can author a `kind: "generated"` provenance record for unknown-origin content that passes every schema check in the repository today.
2. The same writer can re-seal the publication manifest so that the fabricated record's fingerprint is internally consistent. Manifest sealing confirms that the manifest matches the content it was sealed over; it does not confirm that the provenance *inside* that content is true.
3. Nothing in the current pipeline compares a candidate hash against a record of how that candidate actually entered the repository, because no such durable record exists.

Standing Rule 9 (Zero Fabrication) governs this conduct and is the reason it has not occurred. It is a policy, enforced by review and by the honesty of the writer. It is **not** a technical control, and this document must not present it as one.

This weakness is why the two prerequisites in sections 6 and 7 of ADR-017 are prerequisites rather than enhancements, and both are retained unchanged:

- **Authenticated approval** — so that an approval is bound to a key the writer cannot unilaterally register, closing (1) at the human-sign-off step.
- **Durable legacy-origin ledger** — tracked, tamper-evident state binding candidate hashes to their import transaction, closing (3) and making (2) detectable at assembly.

Neither exists. Until both do, this threat remains open, and the Phase 1 refusal of all `legacy_import` content is the only thing standing in its path.

### T2 — Lineage overlap in review

**Threat.** The unknown original generator and a chosen reviewer share training lineage, so the reviewer ratifies a shared blind spot.

**Impact.** High for judgement content.

**Countermeasures.**
- **[built]** `identitiesAreIndependentForJudgementReview` returns false when either identity is null. Placeholder identities (`unknown`, `unverified`, `legacy-unknown`) also fail. No alias workaround exists.
- **[by design]** The Class A route does not rely on review at all. Deterministic recompute is not a judgement, so lineage overlap is not in its threat path. This is the main reason the route is restricted to deterministic content.
- **[deferred]** Multi-provider corroboration for Class B. Its honest property is narrow: two reviewers from distinct providers are **stronger corroboration** than one. That is corroboration, not established independence, and the strengthening is not quantified.

**Corrections.** Two claims previously made about multi-provider review are withdrawn.

1. The withdrawn first draft claimed it is "statistically improbable" for models from two labs to make the identical error. Unevidenced, and withdrawn. Models correlate strongly on common curriculum material through overlapping training data, and agreement on an easy item carries little information.

2. This document previously claimed that with two distinct providers "at most one can share lineage with an unknown generator, so at least one lineage-independent review survives". **Withdrawn on independent review finding P2-1.** The argument presupposes exactly the fact that is missing: that the original generator is a single identifiable model whose lineage can be compared against two others. For unknown-origin content nothing is known about the generator — not the provider, not the model, not whether one model or several were involved — so the overlap cannot be bounded at one, and no review can be shown to be lineage-independent. The phrasing also smuggled a guarantee ("always survives") into what is at best a probabilistic improvement of unknown size.

**The surviving statement.** Reviews from two distinct providers are stronger corroboration than a single review. They do not establish independence, do not guarantee that any individual review is lineage-independent, and do not become an admission route by accumulation. Class B and Class C remain deferred, and this correction introduces no eligibility bypass for either.

### T3 — Memorised or reproduced source text

**Threat.** An unverified generation prompt caused a model to reproduce copyrighted text, which then publishes.

**Impact.** Severe legal and reputational exposure.

**Countermeasures.**
- **[by design]** Correctness evidence is explicitly decoupled from originality. A solver proof clears nothing about reproduction.
- **[proposed]** A bounded originality search that records what it found, including matches, uncertainty and coverage gaps.
- **[by design]** The three reading-comprehension items and their passage are deferred rather than admitted, so the highest-exposure material does not move.

**Correction to the withdrawn draft.** It recommended re-authoring as eliminating this risk. Re-authoring does not eliminate it: a freshly generated passage can reproduce memorised text exactly as a legacy one can, and would have had no search run against it. The control that reduces this exposure is the search, which is needed either way.

**Residual risk.** Non-verbatim structural reproduction is not detectable by n-gram search. Paywalled and print-only corpora are not searchable. Both are recorded in the search record rather than assumed away.

### T4 — Ambiguous stems and defensible alternative answers

**Threat.** A stem admits a second valid reading, so a correct student is marked wrong.

**Impact.** High.

**Correction (independent review P1-2).** An earlier version of this section credited the first-party recompute with catching the `maths-014` ambiguity. It did not, and could not. The ambiguity was found by the **external advisory review**. Conflating a numeric proof with a semantic one is the specific error corrected here, and it matters because the whole admission route rests on the numeric proof.

**What `verifyFirstPartyScholarshipAttestation` can establish.** Read from `correctness/scholarship-attestation.ts` on this branch:

- The value computed by the registered solver, **under that solver's registered interpretation of the problem**, bound to an exact content hash.
- That the set of numbers appearing in the prompt equals the set the solver declares as its givens — `prompt_givens_mismatch` otherwise.
- That the computed value matches exactly one declared option — `option_match_ambiguous` when it matches more than one, `key_mismatch` when it matches none or the wrong one.

**What it cannot establish.** That the prose stem permits only the solver's interpretation. This is not an implementation gap; it is outside what the mechanism does.

Three properties of the implementation make the boundary concrete:

1. **The solver runs on its own declared givens, not on the prompt.** The call is `entry.solve(entry.givens)`. The prompt is consulted only for the set-equality guard above.
2. **The guard is set equality over numbers, so it is blind to relational language.** `nr-022` declares `givens: [8]`; the prompt's "three times as old" and "twice as old" are words, not digits. The entire relational structure of that problem is hard-coded in the solver and is never checked against the stem.
3. **`option_match_ambiguous` detects option collision, not interpretive ambiguity.** It fires when one computed number matches two option *texts*. It cannot fire because two different readings of the stem are each defensible.

**The `maths-014` evidence, correctly attributed.** The finding itself is preserved in full and is not re-litigated:

- The **external advisory review** returned `REVISE`, recording that the 5:3 ratio fixed only the combined sprinter and distance-runner count, so a club with other athletes could total 130 or 140 — leaving options c, d and e all defensible. That record is `review-summary.json` → `flaggedItems`, retained unchanged.
- The registered solver computes `(5 + 3) × 15 = 120`, which matched option `c` alone. Options were 100/110/120/130/140 — all distinct — so `option_match_ambiguous` could not fire. **The solver returned the same clean result before and after the fix.** It was not capable of surfacing the defect, and did not.
- The stem was closed in `45b6cdab` by adding the exhaustiveness premise, which now reads: *"An athletics club contains only two groups, sprinters and distance runners, and every athlete belongs to exactly one group."* That corrected closure premise is preserved and must not be removed — it is what makes the solver's interpretation the only defensible one.
- A fresh external review of the amended packet returned `PASS`. That record is preserved, with its own binding (see `source-evidence-reconciliation.md` section 2.1).

**Countermeasures.**
- **[built]** First-party recompute fails closed on `prompt_givens_mismatch`, `option_match_ambiguous`, `key_mismatch`, `content_hash_mismatch`, solver throw and non-finite result. These are real and they are load-bearing — for the arithmetic.
- **[required, not built]** A separate qualified human editorial check, per candidate, covering what the solver cannot: whether the solver's assumptions are the stem's assumptions; whether the stated conditions are exhaustive; whether the stem admits a second defensible reading; and whether any non-keyed option is defensible under the stated information. This is a distinct requirement from the age-suitability and curriculum check, and is now recorded as such in the specification.
- **[evidenced]** `maths-014` is the standing proof that this check is necessary and that the solver does not substitute for it.

### T5 — Unauthenticated approval injection

**Threat.** A script or compromised commit writes an approval file naming the owner, without the owner having reviewed anything.

**Impact.** Critical. Defeats Standing Rule 8 entirely.

**Countermeasures.**
- **[not designed]** Signature verification against an authorised signer registry. `.github/allowed_signers` does not exist in this repository.
- **[absent]** Branch protection that would make a signer registry meaningful. `dev` currently has no rulesets, `required_approving_review_count` is 0, and `enforce_admins` is disabled, so a writer could add their own key in the same change that uses it. A signer list the user of the key can edit is circular.

**Current state.** Approvals are unauthenticated JSON with a display-name `approvedBy`. This threat is **open**, and it is the reason the admission bundle in `schemas.md` cannot validate into an admissible state.

### T6 — Evidence drift between review and published content

**Threat.** Evidence was produced against hash A; an edit produces hash B; the old evidence is reused.

**Impact.** Moderate to high.

**Countermeasures.**
- **[built]** `verifyFirstPartyScholarshipAttestation` is hash-bound and returns `content_hash_mismatch` when content does not hash to the expected value.
- **[proposed]** Every evidence component in the bundle carries `boundContentHash`, and a mismatch discards the component rather than reusing it.
- **[policy]** Difficulty, stem, option, key and explanation edits are treated as new revisions requiring new evidence. This is why the two reviewer difficulty observations are recorded rather than applied.

### T7 — Governance records that overstate what was established

**Threat.** A governance document asserts evidence that the underlying records do not contain, and an owner decides on it. This is the failure that occurred in the withdrawn draft, where nine of twelve answer keys were misstated and two items misdescribed.

**Impact.** High, and distinctive: it bypasses every technical control, because it corrupts the decision rather than the data.

**Countermeasures.**
- **[built here]** The reconciliation is generated mechanically from committed bytes by `reconcile.py`, which cross-checks source keys, review records, sidecar targets, preflight status and the owner-supplied mapping, and reports inconsistencies rather than repairing them.
- **[proposed]** Any future per-candidate evidence table is generated from records, never transcribed.
- **[proposed]** Evidence documents state their generator and inputs so a reviewer can re-run them.

**Residual risk.** Prose claims around a generated table are still hand-written and still need adversarial review. This document included.

---

## 4. Threats explicitly out of scope

- Compromise of the owner's signing key or developer machine.
- Malicious modification of the Git history by a repository administrator.
- Correctness of the first-party solvers themselves, which are covered by their own unit tests.
- Legal determination of copyright position, which no control here provides.
