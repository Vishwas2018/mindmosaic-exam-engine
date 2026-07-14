# Mission 3 — Prerequisite Decision Record (PD-1 through PD-10)

Status: resolved. This document is the formal decision record for every prerequisite decision (PD-1–PD-10) raised in `docs/reports/mission3-production/01-mission3-implementation-contract.md`'s "Prerequisite decisions requiring approval" section. It supersedes that section's open-question framing — each decision below is now either an accepted working design or an explicitly guardrailed deferral. No Mission 3A source code, tests, production content, harvested content, package scripts, or publication files are touched by this document.

Branch: `integration/governed-question-factory`. Written against HEAD `14a4a7a6389953cd1de28e919a6780573aaa9c5c` ("docs: define Mission 3 delivery contract"). Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched.

**Delta from `01-mission3-implementation-contract.md` §26:** that document's sub-mission mapping table placed the originality/difficulty gate *modules* inside Mission 3C. This decision record moves them into Mission 3D, per the explicit instruction accompanying PD-4 below (originality/difficulty gates must land alongside the publication transaction they gate, not earlier). Mission 3C is now revision workflow + pipeline runner only, staging-eligibility-complete except for the two gates 3D adds.

---

## 1. Decision summary

| Decision | Recommendation | Blocking sub-mission | Status |
|---|---|---|---|
| PD-1 — Wire `correctness/` into `index.ts` | Barrel-export now (zero-risk housekeeping); real call site deferred to 3C's pipeline runner | None (opportunistic in 3A; required by 3C) | ACCEPTED |
| PD-2 — Semantic-classification ownership | New pure function `classifySemanticCategory`, candidate-derived (never blueprint-derived, never self-declared), computed on demand, recorded into structural-validation evidence for audit | 3B (not 3A — see rationale) | ACCEPTED |
| PD-3 — New ingestion module vs. extend `ingestion/` | New sibling module, Mission 2A's `ingestion/` untouched | 3A | ACCEPTED |
| PD-4 — Originality/difficulty gate scope | Option B: minimal-but-real deterministic policy gates, built in 3D only, gating real publication; Option C (staging-only) is the explicit fallback if 3D cannot reach adequate confidence | 3D | ACCEPTED |
| PD-5 — Stable production-ID formula | Candidate-ID-derived hash formula (`{gradePrefix}-gen-{subjectAbbrev}-{hash16}`), defense-in-depth content-hash check at publish time | 3D | ACCEPTED |
| PD-6 — `question-bank-summary.ts` regeneration scope | Partial: data tables machine-generated, narrative framing preserved as a static template | 3D | DEFERRED WITH GUARDRAIL |
| PD-7 — `promptHash` field on `candidateProvenanceSchema` | Add as optional, additive field | 3A | ACCEPTED |
| PD-8 — Review-pack answer/rubric inclusion policy | Accept the contract's originally proposed per-classification policy | 3B | ACCEPTED |
| PD-9 — Autonomous generate→review→revise loop | Rejected; human required at the revision boundary | 3C | ACCEPTED |
| PD-10 — `question-bank-contract.generated.json` shape | Requires a short technical spike reading `scripts/validate-question-bank.mts` before finalising; must be strictly additive | 3D | DEFERRED WITH GUARDRAIL |

No decision requires a further round-trip before Mission 3A may begin. See §3.

---

## 2. Detailed decision records

### PD-1 — Wire `correctness/` into `index.ts` and a real call site

**Decision.** Barrel-export `correctness/` from `src/features/question-factory/index.ts` as a standalone, zero-behaviour-change housekeeping item; defer the actual orchestrated call site (invoking it as part of a batch flow) to Mission 3C's pipeline runner.

**Context.** Mission 2C implemented and tested `correctness/` in full but deliberately did not re-export it or call it from any production path (`design.md` §3.7, §6 — "Implemented but not yet re-exported from `index.ts`"). Something in Mission 3 must close this gap before the pipeline runner can use it.

**Options considered.**
- **A. Export now (3A), wire the real call site later (3C).** Pure barrel-file change, no behavioural risk, no new tests beyond confirming the export exists.
- **B. Defer both the export and the call site to 3C entirely.** Leaves the "implemented, not wired" state technically true until 3C, which is honest but pointlessly delays a trivial, safe change.
- **C. Wire correctness synchronously into `questions:ingest`/`questions:generate` itself** (run it immediately after generation). Rejected outright: violates the gate-sequence architecture (structural validation must run first — `TRANSITION_TABLE` has no `generated → correctness_check_passed` edge), and would smuggle pipeline-orchestration logic into Mission 3A, contradicting the explicit Mission 3A boundary (§4 below) that excludes the "full pipeline runner."

**Evaluation.**
- Governance safety: A and B are equivalent (no gate is bypassed either way); C is unsafe (skips structural validation).
- Implementation complexity: A is trivial; B is trivial but pointlessly delayed; C is a real, unwanted increase in 3A's scope.
- Auditability: A gives Codex something small and unambiguous to review in 3A rather than bundling it into 3C's larger, higher-risk pipeline-runner audit.
- Compatibility with Mission 1–2C architecture: A restores the barrel-export convention (`design.md` §4 "Narrow public barrels") without touching any Mission 2C internals.
- Risk of later rework: none for A; B risks the export being forgotten or bundled awkwardly into a larger 3C diff.
- Publication safety: not applicable — this decision is upstream of publication.

**Recommendation.** A.

**Rationale.** The export is a one-line, additive, already-fully-tested-underneath change. Doing it in 3A costs nothing and removes one more piece of "implemented but not wired" debt before Mission 3 substantially begins. It does **not** expand 3A's functional scope — 3A still produces only `generated`-state candidates and never calls `correctness/` itself.

**Architecture impact.** `index.ts` barrel export list gains `correctness/`. No new types.

**Lifecycle impact.** None — no new transition, no new call site yet.

**Evidence impact.** None.

**Testing obligation.** A single existing-or-new test asserting `correctness/`'s public surface is importable via `index.ts` (mirrors however Mission 2B's export is already tested, if such a test exists — otherwise a new one-assertion test).

**Audit obligation.** None beyond ordinary 3A review — this is not independently audit-gated.

**Deferred risk.** None.

---

### PD-2 — Semantic-classification ownership

**Decision.** Semantic classification is a **pure, deterministic, candidate-derived** property — never blueprint-declared, never self-declared by a generator or reviewer — computed by a new function `classifySemanticCategory(question)` and recorded into structural-validation evidence for audit visibility. It is **not** stamped as mutable state on `CandidateProvenance`, and consuming gates always recompute it rather than trusting a cached copy.

**Context.** `SemanticClassification` (`deterministically_computable | semantic_objective | manual_review_writing`) and its gating logic (`canAdvanceToSemanticReviewPassed`) are fully implemented in `workflow/`, but nothing in the codebase assigns a value to any real candidate. Repository research for this decision surfaced a directly relevant, **already-implemented and already-audited** precedent: `correctness/verify-candidate-correctness.ts` (lines 214–226) already contains two pure classifier functions doing almost exactly this job for a *different* purpose:

```ts
export function isSemanticCategory(question: Question): boolean {
  return (
    question.type === "essay" ||
    question.type === "reading_comprehension" ||
    question.answerKey.kind === "manual" ||
    (question.type === "short_answer" && question.answerKey.kind === "text") ||
    ((question.type === "fill_blank" || question.type === "dropdown") && question.metadata.subject !== "numeracy")
  );
}

export function isUnsupportedInteractionCategory(question: Question): boolean {
  return question.type === "drag_drop" || question.type === "hotspot" || question.type === "label_diagram";
}
```

These already partition every one of the 14 `QUESTION_TYPES` by exactly the same underlying property `SemanticClassification` needs (does this content require independent human/AI semantic judgement, or is it mechanically checkable). This is the single most important finding of this decision: **Mission 3 does not need to invent a new classification scheme** — it needs to refine the existing binary split into the three-way enum already defined in `workflow/states.ts`, in a way both call sites can share.

Also relevant: `blueprintSchema`'s `questionType` field (`blueprints/schema.ts`) is a **free-form string, not `z.enum(QUESTION_TYPES)`** — it is a generation *target/hint*, not a validated, authoritative type. A generated or ingested candidate's actual `type`/`answerKey.kind` are only guaranteed valid once structural validation passes (`production-schema-check.ts` maps the candidate into the real `questionSchema`). This rules out computing classification from the blueprint.

**Options considered.**
- **A. Blueprint-level field, assigned at authoring time** (the option `01-mission3-implementation-contract.md` originally proposed). Rejected: the blueprint's `questionType` is unenforced free text; a generator (fixture or external) is not contractually bound to honour it exactly, so a blueprint-declared classification could silently diverge from what was actually produced — exactly the kind of "trust a claim instead of re-deriving it" pattern the whole factory exists to avoid (`design.md` §5 trust model).
- **B. Candidate-derived, computed on demand from the final `(type, answerKey.kind, metadata.subject)`, reusing/extending the existing correctness-gate predicates.** No new trust surface, reuses already-audited logic, total function over a closed domain.
- **C. Externally declared by the generator or reviewer, validated only for plausibility.** Rejected outright — directly contradicts the instruction "Do not allow an external generator or reviewer to self-declare trusted classification without independent validation," and contradicts the factory's foundational trust model.

**Evaluation.**
- Governance safety: B is strictly the safest — a total, pure, server-computed function with no external input.
- Implementation complexity: B is low — it is a refinement of two functions that already exist and are already tested, not new logic from scratch.
- Auditability: B is trivially auditable (one pure function, closed input domain, exhaustively testable per question type).
- Compatibility with Mission 1–2C architecture: B is the best fit by a wide margin — it makes `SemanticClassification` a strict three-way refinement of `correctness/`'s existing two-way split rather than a competing, potentially-drifting parallel scheme.
- Risk of later rework: A carries real rework risk (a blueprint-declared value that turns out to mismatch generated content would need a reconciliation mechanism nothing currently anticipates). B carries none.
- Publication safety: B means staging/publication always re-derive classification from the actual published content, never from a stale declaration.

**Recommendation.** B, with the following concrete design:

```ts
// new file: src/features/question-factory/workflow/semantic-classification.ts
export function classifySemanticCategory(
  question: Pick<Question, "type" | "answerKey" | "metadata">,
): SemanticClassification {
  if (isUnsupportedInteractionCategory(question)) {
    // Fail-closed default for drag_drop/hotspot/label_diagram. These are
    // already refused upstream by the correctness gate's "unsupported"
    // capability and never reach semantic review today; this value exists
    // only for forward compatibility if that gap closes later.
    return "manual_review_writing";
  }
  if (
    question.type === "essay" ||
    question.type === "reading_comprehension" ||
    question.answerKey.kind === "manual"
  ) {
    return "manual_review_writing";
  }
  if (
    question.answerKey.kind === "text" ||
    ((question.type === "fill_blank" || question.type === "dropdown") &&
      question.metadata.subject !== "numeracy")
  ) {
    return "semantic_objective";
  }
  return "deterministically_computable";
}
```

`isUnsupportedInteractionCategory` is imported/reused as-is from `correctness/verify-candidate-correctness.ts` (or promoted to a shared location both modules import — an implementation detail for 3B, not decided here beyond "reuse, do not duplicate"). `correctness/`'s existing `isSemanticCategory` should, as part of 3B's implementation, be asserted consistent with `classifySemanticCategory` via a cross-check test (`isSemanticCategory(q) === (classifySemanticCategory(q) !== "deterministically_computable")` for every representative input) rather than silently allowed to drift into two competing definitions. This decision does **not** authorise editing `correctness/` — that happens in 3B's implementation, not this documentation pass.

**Where it is computed and does classification ever change:** computed fresh at (and no earlier than) structural-validation time — the first point `type`/`answerKey` are guaranteed schema-valid — and again, independently, at every later consumption point (semantic-review gate, staging). It cannot legitimately change between those points, because candidate content is immutable after `generated` in the current design (a revision creates a new candidate, §10 of the contract) — but every consumer recomputes anyway rather than trusting a cached value, consistent with the contract's "recompute fingerprints before trust" rule (§19).

**Persistence and fingerprint participation:** not a new mutable field requiring synchronised updates. Recorded as a new field on `StructuralValidationEvidence` (`validation/types.ts`) purely for audit/reporting transparency — this is an **additive** field on an existing Mission 2B evidence type, not a breaking change. Because `type` and `answerKey.kind` are already inside the candidate's `contentHash`, any change to the classification-determining fields already changes `contentHash` and therefore already invalidates every downstream fingerprint that binds to it — classification does not need its own separate fingerprint contribution, it inherits staleness detection for free. It is additionally stamped into the semantic-review evidence binding so a fingerprint mismatch is diagnosable as "classification changed" rather than only a generic content-hash mismatch (a 3B-implementation-time refinement of `reviewEvidenceBindingSchema`, not decided in detail here).

**Failure behaviour for missing/ambiguous classification:** none possible for a structurally-valid candidate — `classifySemanticCategory` is a **total function** over the closed `(type, answerKey.kind, subject)` domain structural validation already guarantees. The only real failure mode is a *future* question type or answer-key `kind` being added to the schema without updating this function; the `unsupported-interaction` branch's pattern (fail closed to the strictest bucket, `manual_review_writing`, never to `deterministically_computable`) is the general rule for any input not explicitly matched — this must be the default branch's behaviour, not merely a documented convention.

**Tests for every supported question type.** One assertion per `QUESTION_TYPES` value (14) crossed with its relevant `answerKey.kind` variants, plus the `metadata.subject` boundary for `fill_blank`/`dropdown` (numeracy vs. non-numeracy) — minimum ~18–20 concrete cases. Expected results:

| Type / kind | Classification |
|---|---|
| `essay`, `reading_comprehension` | `manual_review_writing` |
| any type with `answerKey.kind === "manual"` | `manual_review_writing` |
| `short_answer` with `answerKey.kind === "text"` | `semantic_objective` |
| `fill_blank`/`dropdown`, `metadata.subject !== "numeracy"` | `semantic_objective` |
| `fill_blank`/`dropdown`, `metadata.subject === "numeracy"` | `deterministically_computable` |
| `multiple_choice`, `multiple_select`, `number_entry`, `true_false`, `matching`, `ordering` | `deterministically_computable` |
| `drag_drop`, `hotspot`, `label_diagram` | `manual_review_writing` (fail-closed; currently unreachable in practice, §PD-2 context) |

**Architecture impact.** New pure module in `workflow/`; additive field on `StructuralValidationEvidence`; additive field on `reviewEvidenceBindingSchema` (deferred detail to 3B).

**Lifecycle impact.** None to the state machine itself — `canAdvanceToSemanticReviewPassed` already consumes `SemanticClassification` correctly; this decision only supplies where the value comes from.

**Evidence impact.** As above — additive, non-breaking.

**Testing obligation.** The full per-type table above, plus the fail-closed-default test, plus the `isSemanticCategory` cross-check consistency test.

**Audit obligation.** Folds into 3B's mandatory audit (§25 of the contract) — this function directly gates the semantic-review transition, so it inherits that gate's "no material P2" bar for reviewer-independence-adjacent correctness.

**Deferred risk.** Low. The only latent risk is future question-type additions silently landing in the "everything else" deterministic bucket if a future engineer adds a case above the fail-closed default instead of below it — mitigated by the exhaustive per-type test list acting as a change-detector (adding a 15th question type without a corresponding test is a visible gap, not a silent one).

**Does this block Mission 3A?** **No.** Mission 3A candidates only ever reach `generated` state; classification is only consumed starting at the semantic-review gate (3B). The design above deliberately avoids stamping anything at ingestion time, so 3A's implementation is entirely unaffected by this decision. This directly follows the same "don't let a later-stage decision block an earlier stage that doesn't need it" principle the task instructions apply to publication-only decisions — extended here to PD-2 once the design was refined to be non-ingestion-time.

---

### PD-3 — New `ingestion-external/` module vs. extending `ingestion/`

**Decision.** New sibling module (working name `ingestion-external/`, final name confirmed at 3A implementation time) under `src/features/question-factory/`. Mission 2A's `ingestion/` is not modified.

**Context.** Mission 2A's `ingestion/` is scoped to legacy-donor shapes (`legacy-shapes.ts`, CSV parsing, donor-status discard) with a hard-coded `manual_external` class and a distinct trust narrative aimed at harvested content. Mission 3's `questions:ingest` serves a related but distinct purpose: LLM/hand-authored candidates dropped by a human, JSON only, no CSV, no donor-status vocabulary at all.

**Options considered.**
- **A. New sibling module**, reusing shared primitives (`content-hash.ts`, `candidateProvenanceSchema`, the deterministic-ID-minting pattern) but with its own parsing/shape logic.
- **B. Extend `ingestion/` in place** with a second entry point for the new shape.

**Evaluation.**
- Governance safety: equivalent — both apply `manual_external` provenance and the standard trust boundary.
- Implementation complexity: A is marginally more code (a second small module) but each module stays single-purpose; B risks the single module accumulating two increasingly divergent shape-dispatch paths.
- Auditability: A is easier to audit in isolation without re-touching Mission 2A's already-approved code paths.
- Compatibility with Mission 1–2C architecture: A directly honours the "do not modify a prior, already-approved mission's implementation" discipline this whole delivery model depends on (explicitly required by this and the prior mission's safety constraints).
- Risk of later rework: A is lower risk — Mission 2A's adapter can still, independently, later be pointed at real harvest content (a distinct, not-yet-scheduled effort) without any interference from Mission 3's inbox path.
- Publication safety: not differentiating.

**Recommendation.** A.

**Rationale.** Zero risk to Mission 2A's closed, approved implementation; each module stays legible as "one shape family, one trust narrative."

**Architecture impact.** New directory `src/features/question-factory/ingestion-external/` (or final agreed name), consuming `provenance/`, `shared/identifiers.ts`, `storage/` — no change to `ingestion/`.

**Lifecycle impact.** None new — produces `generated`-state candidates via `FactoryRepository.create`, identical terminal action to Mission 2A's adapter.

**Evidence impact.** None beyond ordinary `CandidateProvenance` population.

**Testing obligation.** Full ingest test suite (§24 "Generation and ingestion" of the contract) scoped to this new module; zero new tests required against `ingestion/`.

**Audit obligation.** Ordinary 3A audit (mandatory per the contract's §2 3A entry).

**Deferred risk.** None identified.

---

### PD-4 — Originality and difficulty gate scope

**Decision.** **Option B** — minimal-but-real deterministic policy gates, built entirely within **Mission 3D** (not 3C, correcting the prior mapping), gating real publication. **Option C** (exclude publication, stop at staging) is retained as the explicit, pre-agreed fallback if 3D cannot deliver adequate confidence in the gates it builds — not chosen now, but not requiring a fresh decision cycle if invoked.

**Context.** Neither gate is separately implemented anywhere. `FACTORY_THRESHOLDS` already defines the relevant numbers (`NEAR_DUPLICATE_SIMILARITY: 0.85`, `STRUCTURALLY_SIMILAR_SIMILARITY: 0.6`, `DIFFICULTY_MATCH_TOLERANCE: 0.15`, `MIN_DIFFICULTY_ESTIMATE_CONFIDENCE: 0.5`), but no module consumes them. The lifecycle table, staging matrix, and CLI catalogue all assume real evidence exists.

**Options considered and evaluated:**

- **Option A — complete originality and difficulty verification in Mission 3.** *Governance safety:* superficially attractive but actually **worse** than B — a "complete" originality check would need to compare against actual NAPLAN/ICAS/commercial copyrighted material, which does not exist anywhere in this repository (the harvested content is explicitly out of scope and never imported, per the contract's production-safety requirements) and cannot be sourced safely within Mission 3's boundaries; attempting "completeness" without that corpus produces **false confidence**, which is worse than an honestly-scoped partial check. *Complexity:* very high (real NLP/embedding infrastructure, a real difficulty-calibration model neither of which this codebase has any groundwork for). *Rework risk:* high — a rushed "complete" implementation is the most likely of the three options to need a full rebuild once real requirements (e.g. an actual copyright-comparison corpus) become available. **Rejected.**
- **Option B — minimal deterministic policy gates, real but limited, blocking real publication until built.** *Governance safety:* high — every check is real (never a placeholder pass), bounded, and versioned; explicitly documented as limited scope so nobody downstream mistakes it for a copyright guarantee. *Complexity:* moderate, achievable with existing primitives (text-similarity over the existing production+staged corpus; a structural difficulty proxy compared against the blueprint's declared difficulty). *Auditability:* high — deterministic, versioned, boundary-testable exactly like the existing structural/correctness gates. *Compatibility:* excellent — follows the exact same pure-function/evidence/fingerprint pattern every other gate already uses. *Rework risk:* low — a later mission can strengthen the similarity/difficulty algorithm without changing the gate's shape, evidence schema, or lifecycle wiring. *Publication safety:* real protection now, with an explicit, honest limitation statement (below) rather than false completeness.
- **Option C — exclude real publication from Mission 3, stop at staging.** *Governance safety:* the safest option in isolation, but it silently de-scopes item 7 of Mission 3's authoritative scope ("Staging and atomic publication") and the `questions:publish` CLI command — a **mission-scope change**, not a technical prerequisite decision, and disproportionate given B is achievable. Retained as the **explicit fallback**, not the primary choice: if 3D's implementer determines, during that sub-mission, that even a minimal similarity/difficulty check cannot be built with adequate confidence, publication is disabled and Mission 3D's exit criteria become "staging-complete, publication explicitly deferred" rather than silently shipping a weak gate.

**Recommendation.** Option B, with Option C as the pre-approved fallback (no new decision cycle needed if invoked — 3D's implementer documents the fallback trigger in the sub-mission's own closing report, mirroring Mission 2C's "accepted technical debt" pattern).

**Exact gate outcomes and sufficient evidence:**

**`originality_review_passed`.** New `OriginalityEvidence` (same shape family as `StructuralValidationEvidence`/`CorrectnessVerificationEvidence`): `{candidateId, candidateRevision, candidateContentHash, checkerVersion, corpusScope (bounded list/hash of compared production+staged IDs), nearestMatches (bounded, top-5, each {matchedId, similarityScore}), outcome, issueSummary, originalityFingerprint}`. Deterministic text-similarity metric (e.g. token n-gram Jaccard over stem+options text), pinned and versioned (`checkerVersion`) so results are reproducible and auditable. **Explicit scope limitation, stated in the evidence record and in user-facing documentation:** this is **duplicate/near-duplicate detection within the factory's own corpus only** — it is *not* a copyright-infringement check against NAPLAN/ICAS/commercial material, because no such comparison corpus exists in this repository and none is imported (production-safety requirement, unchanged). The existing human editorial checklist (`docs/CONTENT_RULES.md`'s publication checklist) remains a required, non-automatable step and is not superseded by this gate. Outcomes: similarity `< STRUCTURALLY_SIMILAR_SIMILARITY (0.6)` → `originality_review_passed`; `0.6 ≤ similarity < NEAR_DUPLICATE_SIMILARITY (0.85)` → `needs_revision` (soft_fail, correctable) while revision budget remains, else `rejected`; `similarity ≥ 0.85` → `rejected` directly (hard_fail — an actual near-duplicate should never consume a revision slot); computation failure (corpus unreadable, malformed comparison input) → `quarantined` (uncertain — never a silent pass).

**`difficulty_review_passed`.** New `DifficultyEvidence`: `{candidateId, candidateRevision, candidateContentHash, checkerVersion, declaredDifficulty (from blueprint), estimatedDifficulty, estimateConfidence, deviation, outcome, issueSummary, difficultyFingerprint}`. The estimate is computed from **structural proxies only** (reading-load/vocabulary-complexity/reasoning-step-count signals already present on the blueprint and candidate) — explicitly documented as **not** a calibrated psychometric difficulty model, per the requirement "must not overclaim calibrated difficulty." Outcomes: `deviation ≤ DIFFICULTY_MATCH_TOLERANCE (0.15)` and `estimateConfidence ≥ MIN_DIFFICULTY_ESTIMATE_CONFIDENCE (0.5)` → `difficulty_review_passed`; deviation exceeds tolerance with sufficient confidence (a real, confident mismatch) → `needs_revision` while budget remains, else `rejected`; `estimateConfidence < 0.5` (the estimator itself is unsure) → `quarantined` (an honest "cannot decide," never defaulted to pass or fail).

**A placeholder or automatically passing review record is explicitly prohibited** in both gates — every outcome above is the result of a real computation; "cannot compute" always routes to `quarantined`, never `passed`.

**Architecture impact.** Two new modules (`originality/`, `difficulty/`), each following the established pure-function + orchestrator + evidence-builder pattern from `validation/`/`correctness/`. No changes to existing modules required.

**Lifecycle impact.** Populates the two already-defined transitions `semantic_review_passed → originality_review_passed` and `originality_review_passed → difficulty_review_passed` (already present in `TRANSITION_TABLE` — no table change needed).

**Evidence impact.** Two new evidence schemas, following the existing fingerprint-replay pattern exactly (timestamp excluded from the fingerprint input).

**Testing obligation.** Full boundary testing at each threshold (at-limit accepted, over-limit routed correctly), plus the "computation failure → quarantined, never passed" case for both gates.

**Audit obligation.** **Mandatory**, folded into 3D's overall mandatory publication audit (per the contract's §2 3E entry, now renumbered to 3D per this document's delta) — these gates are the last checkpoint before real publication.

**Deferred risk.** Recorded explicitly in the risk register update (informal — the existing risk register in `01-mission3-implementation-contract.md` §27 already carries "external LLM output variability" and related entries; this decision adds the specific residual risk that the originality gate's *scope limitation* (own-corpus-only, not copyright-comprehensive) could be misunderstood by a future maintainer as a completeness guarantee it is not. Mitigation: the scope limitation must be stated in the evidence schema's own field-level documentation, not only in this decision record.

---

### PD-5 — Stable production-ID policy

**Decision.** Candidate-identity-derived hash formula:

```text
productionId = "{gradePrefix}-gen-{subjectAbbrev}-{hashContent(candidateId).slice(0, 16)}"
```

using the already-implemented `hashContent` (SHA-256 hex, `provenance/content-hash.ts`), truncated to 16 hex characters (64 bits). `gradePrefix` derives from the candidate's blueprint `yearLevel` (`g3`/`g5`, matching the existing hand-authored convention); `subjectAbbrev` derives from `metadata.subject` (`num`/`rdg`/`wrt`/`lang`, an explicit, versioned mapping table — not a truncation heuristic).

**Context.** No authoritative production-ID/collision formula exists. The 100 hand-authored production questions use a manually-assigned pattern (`src/content/questions/grade-3/naplan-numeracy.ts` line 9: `id: "g3-nap-num-data-001"` — `{grade}-{exam-style-abbrev}-{subject-abbrev}-{topic-abbrev}-{seq}`, hand-incremented). This confirms production IDs already conform to `factoryIdentifierSchema`'s pattern (lower-case, digits, hyphens, no dots) even though the production `Question` schema does not itself currently enforce that pattern — worth confirming/tightening as a minor 3D follow-up, not blocking.

**Three candidate formulas evaluated:**

**Formula 1 — pure content hash.** `{gradePrefix}-gen-{subjectAbbrev}-{hashJson(candidateContent).slice(0,16)}`. *Strength:* identical content always yields an identical ID — a genuine, desirable property (two independently-generated candidates with byte-identical final content really are the same question and should collide, since publishing exact duplicates has no value). *Weakness:* a later structural fix that changes even one non-substantive byte of content produces an entirely new, unrelated-looking production ID, breaking traceability across a minor republish/repair pass; also decouples the production ID from the governed lineage (candidate/revision) that produced it, weakening audit traceability (the manifest must be consulted for lineage in every case, rather than the ID itself hinting at it).

**Formula 2 — blueprint/skill "slot"-derived, allowing in-place supersession.** `{gradePrefix}-gen-{skillSlug}-{hash(blueprintId + skillId + targetIndex).slice(0,16)}`. *Strength:* stable identity for "the canonical published question for this slot," conceptually appealing for update-in-place workflows. *Weakness:* requires inventing new supersession/overwrite semantics that directly contradict the publication contract's existing collision rule ("refused, never overwritten" — `01-mission3-implementation-contract.md` §13/§14); a legitimate distinct candidate landing on the same blueprint+skill+index slot as an unrelated earlier one collides even though content is unrelated — weaker collision-resistance than Formula 1 or 3 for the common case, and higher rework risk since it needs new machinery this delivery hasn't designed.

**Formula 3 — candidate-identity-derived (recommended).** As above. *Strength:* stable and deterministic across publication replay (same candidate always yields the same ID); collision-resistant by construction (`candidateId` is already globally unique, itself hash-derived from `sourcePath, batchId, pipelineRunId, adapterVersion, indexInSource, sourceContentHash` per Mission 2A's existing scheme, §Mission-2A-facts); independent of display text (candidate*Id*, not candidate *content*, so a later non-substantive text fix doesn't change the production ID); ties production identity directly to a specific governed lineage, which is exactly what the manifest needs to record and what a human auditor wants to trace ("this production ID came from this exact candidate"); revisions naturally receive fresh, distinct production IDs because each revision is minted a fresh `candidateId` (contract §10 — "never a mutation of the parent's ID"), which is the correct behaviour since a revision is a new governed lineage, not an in-place edit. *Weakness (mitigated):* the ID alone does not encode content, so "changed content under reused candidate ID" cannot be detected from the ID itself — this is why publication independently verifies `contentHash` against the manifest at every publish/replay (already a universal requirement per the contract's §19 "recompute fingerprints before trust," not a new mechanism this decision invents) — defense in depth, not a gap.

**Evaluation against required properties.**

| Property | Formula 1 | Formula 2 | Formula 3 |
|---|---|---|---|
| Deterministic | Yes | Yes | Yes |
| Stable across publication replay | Yes | Yes | Yes |
| Collision-resistant | Good (content-derived) | Weaker (slot-derived, cross-lineage collisions possible) | Good (candidate-ID-derived, already-unique) |
| Independent of display text | Yes | Yes | Yes |
| Safe under replay | Yes | Needs new overwrite semantics — **not** safe under the existing collision-refusal rule without new machinery | Yes |
| No sequential counter | Yes | Yes | Yes |
| No runtime randomness | Yes | Yes | Yes |
| Traceable to governed lineage from the ID's derivation input | No (opaque content hash) | Yes (but requires new semantics) | **Yes**, without new semantics |
| Stable across minor non-substantive republish | No (any byte change = new ID) | Yes | **Yes** |

**Recommendation.** Formula 3.

**Rationale.** Best balance of collision-resistance, replay-safety, and audit traceability, with zero new supersession machinery required — it slots directly into the publication contract's existing "collision = refuse" rule (`01-mission3-implementation-contract.md` §13) without modification, and directly matches the already-decided revision semantics (fresh candidate ID per revision, §10).

**Answers to the specific sub-questions:**
- *Revision behaviour:* each revision (fresh `candidateId`, §10) naturally mints a distinct production ID if separately published — correct, since a revision supersedes its parent as a new governed output, not an edit.
- *Batch/publication replay:* identical `candidateId` under a retried `publicationId` and unchanged content resolves to the same production ID and is a safe no-op (contract §14's existing replay rule).
- *Collision with the existing 100-question bank:* the `-gen-` namespace segment is structurally distinct from the hand-authored `-nap-`/`-icas-` exam-style segment, but namespace convention is **never** relied upon alone — publication always performs an explicit collision check against the live loaded bank (`getQuestionById`) before writing, regardless of naming convention.
- *Collision between generated batches:* naturally avoided since the ID derives from the already-globally-unique `candidateId`, independent of `batchId` — a genuine collision would require a `candidateId` hash collision, astronomically unlikely at factory scale, and is checked defensively regardless.
- *Changed content under reused candidate ID / reused batch ID:* structurally shouldn't happen (candidate content is immutable post-`generated`), but publication defends against it anyway via the mandatory `contentHash` cross-check in the manifest — never trusted from the ID alone (§19's "no deterministic file name/ID may be treated as identity proof," extended here to production IDs).
- *Length/character constraints:* output is lower-case hex plus fixed hyphenated prefixes — satisfies `factoryIdentifierSchema`'s pattern and remains well under its 120-character bound (typical length ~28–32 characters, e.g. `g5-gen-num-a1b2c3d4e5f6a7b8`).
- *Migration implications:* none — no generated questions exist in production yet; the `-gen-` namespace is purely additive alongside the 100 hand-authored questions.
- *Manifest binding:* the publication manifest records `{candidateId, revision, productionId, contentHash}` per published question, so the ID's derivation is always independently traceable and re-verifiable, never trusted from the ID string alone.
- *Question-bank-contract binding:* the contract file (PD-10, still a deferred spike) is expected to record the full `productionId` list plus a bank-wide hash — exact shape deferred to PD-10, dependency noted here.
- *Semantically identical duplicate content, different candidates:* **may** receive different production IDs under Formula 3 (since IDs are candidate-identity-, not content-, derived) — this is intentional and correct: distinguishing "identical content" from "distinct governed lineages" is the originality gate's job (PD-4), not the ID formula's; conflating the two inside the ID formula would weaken both properties.

**Architecture impact.** New pure ID-minting function in the (new, 3D-scoped) `publication/` module; a versioned `subjectAbbrev`/`gradePrefix` mapping table (config-only, no logic, following the existing `config/` convention).

**Lifecycle impact.** None — purely a publication-time identifier, not a lifecycle state.

**Evidence impact.** `productionId` recorded in the publication manifest, bound to `candidateId`/`revision`/`contentHash`.

**Testing obligation.** Determinism (same candidate → same ID across repeated calls); collision-check refusal test (two distinct candidates, forced-identical `productionId` via a test double, must be refused, never overwritten); cross-bank collision test against a fixture seed bank.

**Audit obligation.** Mandatory, folded into 3D's publication audit — production-ID minting is exactly the kind of "publication integrity" concern the contract's §25 names explicitly.

**Deferred risk.** None material — the design has no known weaknesses at Mission 3's scale (hundreds, not millions, of candidates).

---

### PD-6 — `question-bank-summary.ts` regeneration scope

**Decision.** Partial regeneration: data tables (question counts, type/visual/subject/difficulty distributions) machine-generated from live bank data at publish time; narrative framing (introduction, "known limitations," "Phase 4 direction" sections) preserved as a static, human-authored template that publication injects the generated tables into, never regenerates itself.

**Context.** The file exists today (81 lines) as hand-maintained prose matching `docs/QUESTION_BANK_SUMMARY.md`'s narrative voice, but is listed as a Mission-3-controlled file in `PUBLICATION_CONTROLLED_FILES` — meaning publication is expected to rewrite it, not merely read it.

**Options considered.** Full machine regeneration (loses narrative quality, risks a soulless output on every publish) vs. partial (data accurate, narrative stable) vs. leave entirely hand-maintained (violates the controlled-file registry's own stated intent).

**Recommendation.** Partial, as stated.

**Rationale.** Directly balances the two real risks: (a) stale/inaccurate numbers if left fully hand-maintained, (b) lost editorial quality if fully auto-generated. This mirrors `docs/QUESTION_BANK_SUMMARY.md`'s own existing structure (narrative sections + data tables), so the split is a natural fit, not an invented one.

**Architecture impact.** A new template-plus-data-injection pattern in the (3D-scoped) `publication/` module; no impact on any other module.

**Lifecycle impact.** None.

**Evidence impact.** None beyond the file itself being a controlled, hash-tracked publication output like any other.

**Testing obligation.** A regeneration test confirming (a) data tables match live bank state exactly, (b) the static narrative sections survive byte-for-byte across a regeneration.

**Audit obligation.** Ordinary 3D review (not independently escalated — low risk).

**Deferred risk.** Low. If the split proves awkward once actually implemented, the 3D implementer must escalate rather than unilaterally choosing full regeneration (which would change the file's authorship model without a recorded decision).

**Blocking status:** does not block 3A/3B/3C — purely 3D-scoped.

---

### PD-7 — `promptHash` field on `candidateProvenanceSchema`

**Decision.** Add `promptHash: z.string().trim().min(1).max(FACTORY_LIMITS.PROVENANCE_MAX_HASH_LENGTH).optional()` to `candidateProvenanceSchema` (`provenance/candidate-provenance.ts`).

**Context.** Only `promptVersion` currently exists on this schema. The review side of the same pattern already has both a version and a hash field (`reviewPromptVersion`/`reviewPromptHash` on `reviewRecordSchema`) — the generation side lacks the equivalent. The Mission 3 contract's §6 (manual ingestion) already specifies that every ingested file must declare a prompt hash, pending this decision.

**Options considered.** Add the field now (3A) vs. defer until a later mission actually needs to cross-check it. Deferring is not viable: `questions:ingest` (3A, in scope) is specified to record which prompt pack a candidate was ingested against, and cannot do so without the field existing.

**Evaluation.** Low complexity (a single optional, additive field — cannot break any existing code, test fixture, or stored record, since `.optional()` requires no migration of anything already persisted). High compatibility (mirrors an already-proven pattern on the sibling review schema exactly). No governance-safety concern (it is evidence, not a trust grant).

**Recommendation.** Accept, add now, as part of Mission 3A's first implementation commit (not part of this documentation task).

**Architecture impact.** One additive field on an existing Mission 1 schema. Starts `.optional()` to avoid breaking any code that constructs `CandidateProvenance` without it; may be tightened to required once both `questions:prompt` and `questions:generate`/`questions:ingest` always populate it (a later, non-blocking follow-up, not decided here).

**Lifecycle impact.** None.

**Evidence impact.** Enables cross-checking a declared prompt hash against a real issued pack at ingestion time (contract §6).

**Testing obligation.** Schema-level test (field accepted when present, absent gracefully handled); an ingestion-level test asserting a mismatched `promptHash` against a real issued pack is refused (`prompt_pack_reference_mismatch`, per the contract's §23 issue-code catalogue).

**Audit obligation.** Ordinary 3A review.

**Deferred risk.** None.

**Blocking status:** blocks Mission 3A directly — `questions:ingest` needs the field to exist before it can populate/validate it.

---

### PD-8 — Review-pack answer/rubric inclusion policy per semantic classification

**Decision.** Accept the policy already proposed in `01-mission3-implementation-contract.md` §8: for `manual_review_writing` content, include the full rubric and any model answer (the reviewer needs it to judge open-ended correctness); for `semantic_objective` content, omit the raw declared answer key and instead ask the reviewer to state what they believe the answer is, for later cross-check against the declared value — avoiding biasing the reviewer's ambiguity judgement with a pre-shown "correct" answer.

**Context.** Getting this wrong in either direction either biases reviewers (showing the answer up front primes them to rationalise it as unambiguous) or starves them of what they need (a `manual_review_writing` reviewer without the rubric cannot meaningfully grade).

**Recommendation.** Accept as proposed — no change from the original contract.

**Architecture impact / lifecycle impact / evidence impact.** None beyond `questions:review-prompt`'s (3B-scoped) implementation detail.

**Testing obligation.** A review-pack-construction test per classification, asserting the correct fields are present/absent.

**Audit obligation.** Folds into 3B's mandatory audit.

**Deferred risk.** Low — if reviewers report the policy is unworkable in practice (e.g. cross-checking "what the reviewer believes the answer is" proves noisy), this is refinable within 3B without any lifecycle/evidence-schema change.

**Blocking status:** does not block 3A/3C — purely 3B-scoped.

---

### PD-9 — Autonomous generate→review→revise loop

**Decision.** Rejected. A human is always required between a candidate reaching `needs_revision` and the next `questions:revision-prompt`/re-ingestion cycle. No autonomous retry loop is in scope for Mission 3.

**Context.** The pipeline runner's contract (§11) needs to know whether it may auto-generate revisions or must stop at `needs_revision` and wait.

**Options considered.** Autonomous loop (generate → review → revise → repeat without a human checkpoint) vs. human-required (current default assumption in the original contract).

**Evaluation.** Governance safety strongly favours human-required: an autonomous loop risks silently spending the bounded revision budget (`MAX_REVISIONS = 2`) without any human awareness that it happened, and materially increases the audit surface (an autonomous loop's decision to revise is itself a governance-relevant action that should be visible, not implicit). Complexity is also lower for human-required (no new auto-trigger logic needed in the pipeline runner). No plausible advantage to autonomy was identified that offsets the governance cost at this stage of the factory's maturity.

**Recommendation.** Human-required, confirmed as originally assumed.

**Architecture impact.** Constrains the pipeline runner's design (§11) — it stops at `needs_revision`, never auto-invokes revision tooling.

**Lifecycle impact.** None new — `needs_revision` remaining a true terminal state for the runner's purposes (already the case).

**Evidence impact.** None.

**Testing obligation.** A pipeline-runner test asserting a batch containing a `needs_revision` outcome completes the run without any auto-generated revision candidate appearing.

**Audit obligation.** Folds into 3C's pipeline-runner audit.

**Deferred risk.** None — this is a scope-narrowing decision, not a risk-accepting one. Revisiting it (enabling autonomy later) would be a new, separate decision requiring its own risk analysis, not an automatic evolution of this one.

**Blocking status:** does not block 3A — purely a 3C pipeline-runner design constraint, recorded now to prevent scope creep later.

---

### PD-10 — `question-bank-contract.generated.json` shape

**Decision.** Deferred, with a mandatory guardrail: before any 3D publication code is written, the 3D implementer must complete a short technical spike — fully reading `scripts/validate-question-bank.mts` — and record the contract's exact shape as a short follow-up note, before proceeding past 3D's "generated contract" work item. The contract file must be **strictly additive** to whatever `validate-question-bank.mts` already checks; it may never be a breaking replacement of that script's existing validation.

**Context.** Only the file's path is currently reserved (`config/publication-file-registry.ts`'s `bankContract` key); no consumer or shape exists yet. `scripts/validate-question-bank.mts` was not reviewed field-by-field during this decision pass (it's the actual intended consumer, per the file's own doc comment: "Consumed by scripts/validate-question-bank.mts; never edited by that script").

**Why deferred rather than resolved now.** Committing to a contract shape without having read its intended consumer risks designing something `validate-question-bank.mts` cannot actually use, or worse, something that silently duplicates/contradicts checks that script already performs. This is exactly the kind of premature-decision risk the task's own decision-quality requirements warn against ("no hidden state," "reuse of existing audited primitives") — reading the real consumer first is the reuse-respecting path.

**Recommendation.** Defer with the guardrail above; this is a bounded, scoped deferral (one script's worth of reading, at the very start of 3D), not an open-ended one.

**Architecture impact.** TBD pending the spike; expected to be a small, versioned JSON schema (counts, distributions, a bank-wide content hash) mirroring `question-bank-summary.ts`'s data-table content (PD-6) in machine-readable form.

**Lifecycle impact.** None.

**Evidence impact.** Bound into the publication manifest (§13) once shaped.

**Testing obligation.** Deferred to 3D; must include a test proving `scripts/validate-question-bank.mts`'s existing checks still pass unchanged after the contract file is introduced.

**Audit obligation.** Folds into 3D's mandatory publication audit.

**Deferred risk.** Low, tightly bounded — the guardrail converts this from an open design risk into a scheduled, scoped implementation task.

**Blocking status:** does not block 3A/3B/3C — purely 3D-scoped, spike required before 3D's contract-generation work item, not before 3D begins entirely.

---

## 3. Mission 3A readiness assessment

Of the ten decisions, exactly **two** touch Mission 3A's implementation directly:

- **PD-3** (new ingestion module location) — ACCEPTED, a clear-cut, low-risk naming/placement decision with no open question remaining.
- **PD-7** (`promptHash` additive schema field) — ACCEPTED, a small, additive, non-breaking schema change with no open question remaining.

**PD-1** is opportunistic in 3A (a safe, optional one-line barrel export) but not required for 3A's completion gate. **PD-2**, having been redesigned to be candidate-derived and computed no earlier than structural validation, does **not** touch 3A at all — 3A only ever produces `generated`-state candidates and never invokes classification. **PD-4, PD-5, PD-6, PD-8, PD-9, PD-10** are all scoped to 3B/3C/3D and are, per the task's own governing principle, explicitly not permitted to block 3A.

No decision remains in a state requiring a further round-trip before Mission 3A implementation may begin. All ten are either **ACCEPTED** (eight) or **DEFERRED WITH GUARDRAIL** (two, both 3D-scoped, both with a concrete unblocking condition already specified). None are marked **REQUIRES USER DECISION**.

---

## 4. Updated delivery boundary — Mission 3A

Confirmed exact scope, unchanged from this task's brief and fully consistent with the decisions above:

```text
Generation and manual ingestion only
```

**Mission 3A includes:**
- Provider-neutral `QuestionGenerator` interface.
- `DeterministicFixtureGenerator`.
- Versioned generation prompt builder.
- `questions:prompt`.
- `questions:ingest`.
- `manual_external` provenance stamping.
- Inbox transaction semantics and interruption recovery.
- `generated`-state persistence only (no gate beyond entry).
- Malformed-input quarantine.
- The `promptHash` schema addition (PD-7) and the new ingestion module (PD-3).
- Tests and documentation for all of the above.

**Mission 3A explicitly excludes** (confirmed, matching the brief and consistent with every decision above):
- Semantic external review (3B).
- Revision workflow (3C).
- Full pipeline runner (3C).
- Staging (3D).
- Production publication (3D).
- Originality approval (3D).
- Difficulty approval (3D).
- Live-provider adapters (documented only, no mission implements them yet).
- `correctness/`'s real call site (barrel export only, per PD-1; orchestrated use lands in 3C).
- Semantic classification computation (per PD-2's redesign, this is genuinely unnecessary in 3A and must not be added opportunistically — adding it early would be scope creep, not efficiency).

---

## Go/no-go recommendation

```text
READY FOR MISSION 3A IMPLEMENTATION
```

Both decisions that touch Mission 3A (PD-3, PD-7) are resolved with clear, low-risk, additive designs. Every other decision is confirmed out of 3A's critical path, with concrete guardrails recorded for the two (PD-6, PD-10) still carrying open implementation detail. Mission 3A may proceed to implementation using the scope confirmed in §4 above.
