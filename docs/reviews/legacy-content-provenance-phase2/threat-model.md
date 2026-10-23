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

**Countermeasures.**
- **[built]** The `generated` provenance schema requires a valid `candidateGenerationEvent`, a positive integer `promptVersion` and a 64-character hex `promptHash`. These cannot be supplied truthfully for unknown-origin content, and supplying them falsely is a Zero Fabrication violation rather than a technical bypass.
- **[built]** `validatePublicationSource` enforces a generator-class allow-list (`deterministic_fixture`, `manual_external`, `live_provider`) and refuses absent or malformed attribution, per PR #74.
- **[not designed]** A journal cross-check that refuses any candidate hash originating in a legacy import transaction from appearing as `generated`. **This does not exist.** Phase 1 recorded why: the importer's journal lives in the untracked factory workspace and the candidate record is consumed at publication. The withdrawn draft asserted this countermeasure as if implemented; it is not.

**Residual risk.** A privileged writer who is willing to fabricate generation fields is not stopped by schema shape alone. This is the trust boundary PR #74 documented and did not close.

### T2 — Lineage overlap in review

**Threat.** The unknown original generator and a chosen reviewer share training lineage, so the reviewer ratifies a shared blind spot.

**Impact.** High for judgement content.

**Countermeasures.**
- **[built]** `identitiesAreIndependentForJudgementReview` returns false when either identity is null. Placeholder identities (`unknown`, `unverified`, `legacy-unknown`) also fail. No alias workaround exists.
- **[by design]** The Class A route does not rely on review at all. Deterministic recompute is not a judgement, so lineage overlap is not in its threat path. This is the main reason the route is restricted to deterministic content.
- **[deferred]** Multi-provider corroboration for Class B. Its honest property is narrow: with reviewers from two distinct providers, at most one can share lineage with an unknown generator, so at least one lineage-independent review survives. That is corroboration, not established independence.

**Correction to the withdrawn draft.** It claimed it is "statistically improbable" for models from two labs to make the identical error. That claim is unevidenced and is withdrawn. Models correlate strongly on common curriculum material through overlapping training data, and agreement on an easy item carries little information.

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

**Countermeasures.**
- **[built]** First-party recompute fails closed on `option_match_ambiguous` and on `prompt_givens_mismatch`, so a stem whose stated quantities do not match the solver's declared givens cannot pass.
- **[evidenced]** This threat is not hypothetical here. `maths-014` was caught by exactly this path: the external review returned `REVISE` because the 5:3 ratio fixed only the combined sprinter and distance-runner count, leaving three options defensible. The stem was closed in `45b6cdab` and re-reviewed to `PASS`. Both records are retained.

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
