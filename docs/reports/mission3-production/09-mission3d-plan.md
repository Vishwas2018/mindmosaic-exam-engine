# Mission 3D — Originality and Difficulty Gates

Status: **AUTHORISED FOR IMPLEMENTATION.** Amended per pre-implementation review (§0) to pin the exact starting commit and to close six specification gaps (deterministic corpus fingerprint/replay invalidation, originality comparison algorithm/thresholds/classifications, measurable difficulty signals/unsupported-review outcome, exact failure destinations/issue codes, and five-stage replay/resume behaviour) before any code is written. No commit beyond this amendment and the plan's original text has been made as part of producing this document.

Branch: `integration/governed-question-factory`. **Implementation starts at `59376b336fa86459617f5ea29afd11c84af25350c`** (`docs: add Mission 3D plan` — this document's own original-text commit; HEAD at amendment time). This supersedes the original text's `0329dd125cc9d27b09c9c84998e8b8f16e36d1a4` (Mission 3C's approved tip): `59376b3` is `0329dd1` plus exactly one docs-only commit (this plan itself), so no implementation-relevant file differs between the two — the pin is corrected for precision, not because anything material changed. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched, not to be merged into as part of this plan.

---

## 0. Pre-implementation amendment (this section only — added before implementation, original plan text below is otherwise unchanged)

This plan was written and committed (`59376b3`) before implementation was authorised. Before any code was written, six clarifications were required and are recorded here; every cross-reference below (§4a, §4b, §5b, §6) has been updated in place to match. Nothing in §1–§13's original scope, exclusions, or acceptance criteria changes — this section only removes ambiguity that would otherwise have been resolved ad hoc during implementation.

1. **Starting SHA** — corrected above.
2. **Deterministic originality-corpus fingerprint and replay invalidation** — fully specified in §5b.
3. **Originality comparison fields, algorithm, thresholds, classifications** — fully specified in §4a.
4. **Measurable difficulty-assessment signals and unsupported-review outcome** — fully specified in §4b.
5. **Exact failure destinations and issue codes** — the outcome tables in §4a/§4b now enumerate every destination and issue code; §6 is extended with three codes the original text omitted (`originality_exact_duplicate`, `originality_corpus_drift_detected`, `difficulty_replay_drift_detected`).
6. **Five-stage pipeline replay/resume behaviour** — fully specified in new §5d.

Written against `docs/reports/mission3-production/01-mission3-implementation-contract.md` §26 and `02-prerequisite-decisions.md`'s PD-4 (Originality/difficulty gate scope), with one explicit, user-directed scope narrowing from PD-4's original framing — see §1b.

---

## 1. Scope resolution

### 1a. What PD-4 already decided (reaffirmed, not re-litigated)

PD-4 (`02-prerequisite-decisions.md`) is the authoritative design record for these two gates and is adopted here without modification:

- **Option B** — minimal-but-real, deterministic, versioned policy gates. Never a placeholder or automatically-passing outcome; "cannot compute" always routes to `quarantined`, never `passed`.
- **Originality gate** (`originality_review_passed`): deterministic text-similarity (token n-gram Jaccard over stem+options text) against the factory's own existing corpus. Explicitly **not** a copyright-infringement check against NAPLAN/ICAS/commercial material — no such comparison corpus exists in this repository and none will be imported. This scope limitation must be stated in the evidence schema's own field documentation, not only here.
- **Difficulty gate** (`difficulty_review_passed`): a structural proxy (reading-load / vocabulary-complexity / reasoning-step-count signals already present on the blueprint and candidate) compared against the blueprint's declared difficulty. Explicitly **not** a calibrated psychometric model.
- Both gates reuse the exact pure-function + orchestrator + evidence-builder + fingerprint-replay pattern every existing gate (`validation/`, `correctness/`) already follows. No changes to `validation/`, `correctness/`, `review/`, `revision/`, `workflow/states.ts`, or `TRANSITION_TABLE` are required — `semantic_review_passed → originality_review_passed → difficulty_review_passed` are already legal edges in `workflow/transitions.ts`, unused since the day that table was written.
- Thresholds already exist and are unconsumed by any module today: `FACTORY_THRESHOLDS.STRUCTURALLY_SIMILAR_SIMILARITY = 0.6`, `NEAR_DUPLICATE_SIMILARITY = 0.85`, `DIFFICULTY_MATCH_TOLERANCE = 0.15`, `MIN_DIFFICULTY_ESTIMATE_CONFIDENCE = 0.5` (`config/thresholds.ts`).

### 1b. Explicit, user-directed narrowing from PD-4's original framing

PD-4's own text frames these gates as "gating **real publication**" and lists Option C (stop at staging, defer publication) only as a *contingent fallback* if the gates can't be built with adequate confidence. **This plan does not adopt that framing.** Per the explicit instruction accompanying this planning request — "avoid Supabase, staging and publication unless explicitly authorised" — Mission 3D's scope is narrowed, unconditionally and regardless of gate confidence, to:

**Build and wire the two gates. Stop at `difficulty_review_passed`. Do not build, wire, or reach `staged` or `published`, and do not touch Supabase, in this mission.**

This is a deliberate scope decision for this specific bounded increment, not an invocation of PD-4's Option-C confidence-fallback (which was about the gates themselves being inadequate — they are not; this is a change-management choice to keep the increment small and independently reviewable). Staging and atomic publication remain real, tracked scope — for **Mission 3E**, not this one. This delta is recorded here exactly as `02-prerequisite-decisions.md` recorded its own delta from `01-mission3-implementation-contract.md` §26, so a future reader never has to reconcile two conflicting authoritative statements.

### 1c. Goals

1. Implement `originality/` and `difficulty/` modules per PD-4's exact evidence shapes and outcome thresholds.
2. Extend `pipeline/pipeline-stages.ts`'s `PIPELINE_STAGES` registry from 3 entries to 5 (`structural, correctness, semantic, originality, difficulty`) with **zero changes to `pipeline-runner.ts`'s control-flow loop** — this is the exact extension point Mission 3C's plan and delivery both built for.
3. Close the accepted Mission 3C hardening follow-ups as **separate, isolated, non-blocking debt** (§10) — never folded silently into the new gate implementation's commits.
4. Land a corrected, honest scope statement: no false completeness claim for either gate, ever, in code comments, evidence records, or this document.

### 1d. Non-goals (explicit exclusions)

- Supabase, or any external persistence beyond the existing `FactoryRepository`/filesystem model.
- `staged`, `published` lifecycle reach; `questions:stage`, `questions:publish` CLIs; the atomic publication transaction; any staging/publication-manifest work.
- Any change to `workflow/states.ts`'s `CANDIDATE_STATES` or `workflow/transitions.ts`'s `TRANSITION_TABLE` — both already contain everything this mission needs.
- Any change to `revision/`, `correctness/` (beyond the isolated §10 follow-ups), `review/`, `validation/`, taxonomy, or batch-locking behaviour.
- Any change to the 100-question production bank or `src/content/` (read-only access for the originality corpus only — see §5c).
- PB1, PB2, PB3, or any offline batch artefact under `C:\tmp\...` — those are content-authoring exercises entirely outside this repository's committed history and outside this mission's scope. Mission 3D is an **engine capability**; it does not ingest, correct, or audit any PB batch.
- Real NLP/embedding infrastructure or a calibrated psychometric difficulty model (PD-4 Option A, rejected).
- A dedicated new CLI command. See §7 — the existing `questions:pipeline` CLI already generically drives whatever is registered in `PIPELINE_STAGES`; both new gates are fully deterministic/automatic (no external human/AI input, unlike semantic review), so no `questions:originality-ingest`-shaped command is needed.
- Mission 3E (staging, publication) in any form, including preparatory scaffolding.

---

## 2. Current architecture this mission builds on (verified, unmodified)

- **Lifecycle** — `CANDIDATE_STATES` already includes `originality_review_passed`, `difficulty_review_passed`, `staged`, `published` (`workflow/states.ts`). `TRANSITION_TABLE` already defines `semantic_review_passed → [originality_review_passed, needs_revision, rejected, quarantined]`, `originality_review_passed → [difficulty_review_passed, needs_revision, rejected, quarantined]`, and `difficulty_review_passed → [staged, needs_revision, rejected, quarantined]` (`workflow/transitions.ts`). Confirmed unreachable in production today — zero call sites reach any of these four states, matching the negative-space grep already run as part of the Mission 3C audit.
- **Gate-failure policy** — `workflow/policies.ts`'s `decideGateFailureOutcome({severity, revisionCount, maxRevisions})` is the single shared severity→destination policy every gate already uses (`hard_fail → rejected`, `uncertain → quarantined`, `soft_fail → needs_revision` while budget remains else `rejected`). Both new gates reuse it verbatim — no new policy function.
- **Pipeline extension point** — `pipeline/pipeline-stages.ts`'s `PIPELINE_STAGES: readonly PipelineStage[]` and `pipeline/pipeline-runner.ts`'s loop are already documented and built to accept exactly this extension with no control-flow change. `pipeline/pipeline-types.ts`'s `PipelineRunReport.summary` is already open-ended (`Record<string, number>`, keyed by literal `endState`) specifically so the two new reachable end-states "appear automatically... with no schema version bump required" (existing doc comment, `pipeline-types.ts:51`).
- **Shared blueprint resolver** — `shared/bound-blueprint.ts`'s `resolveBoundBlueprint` (Mission 3B/3C remediation) is the fail-closed authority for bound-blueprint identity. Neither new gate needs its own blueprint lookup: `declaredDifficulty` is read from the *already-resolved* blueprint the upstream gates (structural/correctness) bound to, never a second, independent lookup.
- **Issue-code convention** — `config/mission3a-issue-codes.ts` / `mission3b-issue-codes.ts` / `mission3c-issue-codes.ts`: one file per mission, closed `as const` arrays, a unioned `MISSION_XX_ISSUE_CODES` type, no candidate-derived value ever embedded in a code string.
- **Production corpus access** — `src/content/questions/question-bank` (imported by `scripts/validate-question-bank.mts` today) is the existing, read-only production-bank accessor. No new content-reading infrastructure is required for the originality gate's corpus scope (see §5c for the exact, current-state limitation this implies).

---

## 3. Proposed architecture

```
src/features/question-factory/
  originality/                          NEW
    types.ts                            OriginalityEvidence, OriginalityCapability, issue types
    evidence.ts                         buildOriginalityEvidence, computeOriginalityFingerprint (timestamp-excluded)
    similarity.ts                       Pure token n-gram Jaccard similarity (deterministic, versioned)
    verify-candidate-originality.ts     Pure decision function: candidate + corpus scope -> OriginalityResult
    orchestrate-originality-review.ts   Impure orchestrator: resolve corpus, run pure check, persist evidence, transition
    index.ts                            Barrel (mirrors correctness/index.ts's narrow-export convention)
  difficulty/                           NEW
    types.ts                            DifficultyEvidence, DifficultyCapability, issue types
    evidence.ts                         buildDifficultyEvidence, computeDifficultyFingerprint
    estimate-difficulty.ts              Pure structural-proxy estimator (reading-load/vocabulary/reasoning-step signals)
    verify-candidate-difficulty.ts      Pure decision function: candidate + blueprint.declaredDifficulty -> DifficultyResult
    orchestrate-difficulty-review.ts    Impure orchestrator: persist evidence, transition
    index.ts                            Barrel
  pipeline/
    pipeline-stages.ts                  MODIFIED (additive) — two new PipelineStage entries + run/preview functions
    pipeline-types.ts                   MODIFIED (additive) — GateResult.gate union gains "originality" | "difficulty"
    index.ts                            MODIFIED — export the two new module barrels' orchestration functions if needed by callers outside pipeline/
  config/
    mission3d-issue-codes.ts            NEW
    index.ts                            MODIFIED — re-export
scripts/
  questions-pipeline.mts                MODIFIED (doc-comment only) — stop-point description updated; no logic change
```

**No new CLI script.** `questions:pipeline` already drives whatever `PIPELINE_STAGES` contains; both new gates are fully automatic (no external reviewer input to ingest), so the `questions:review-ingest`-shaped "dedicated CLI for external human/AI input" pattern does not apply here.

---

## 4. Contracts and schemas

### 4a. Originality

```ts
export interface OriginalityEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash?: string;                // resolved via resolveBoundBlueprint, verbatim — see the binding note below
  readonly checkerVersion: string;                 // bump on comparison-algorithm/evidence-shape change (shingle size, Jaccard formula, comparable-text field selection)
  readonly normalisationVersion: string;           // bump independently when text normalisation changes, even if the algorithm itself does not
  readonly corpusScope: {
    readonly source: "production_bank";           // "staged" not added until Mission 3E
    readonly comparedIds: readonly string[];       // bounded, the exact id set compared against, sorted ascending before hashing
    readonly corpusFingerprint: string;            // hashJson([...comparedIds].sort()) — proves which corpus snapshot this evidence rests on
  };
  readonly nearestMatches: readonly {              // bounded, top-5, sorted by similarityScore descending
    readonly matchedId: string;
    readonly similarityScore: number;
  }[];
  readonly classification: "distinct" | "structurally_similar" | "substantive_duplicate" | "exact_duplicate";
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly OriginalityIssue[];
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly OriginalityIssueCode[] };
  readonly validatedAt: string;                    // ISO 8601, excluded from the fingerprint
  readonly originalityFingerprint: string;
}
```

**Blueprint binding, added in this amendment.** Every originality report is bound to `blueprintHash` even though the similarity decision itself never reads blueprint content — this closes the gap the original plan text left open (the evidence shape carried no blueprint binding at all) and keeps originality symmetric with every other gate in this mission for corpus-drift-style detection: if the candidate's bound blueprint identity changes between two calls, the cached report is exactly as stale as if the corpus had changed, and must be caught the same way (§5b). `blueprintHash` is resolved via `resolveBoundBlueprint` **verbatim**, the exact same call the difficulty gate and every upstream gate already make — never a second, gate-specific blueprint lookup. A blueprint that fails to resolve (`kind: "missing" | "invalid"`) refuses the gate outright, before any evidence is written — see the `blueprint_unresolved` outcome in the orchestration-outcome union (§5b).

**Comparable-text extraction (exact, deterministic).** For any question (candidate or corpus member): `comparableText = [prompt, stimulus?.body, ...options.map(o => o.text)].filter(text => text !== undefined && text.length > 0).join(" ")`. Never includes `explanation` (that field carries authoring reasoning, not the assessable content a duplicate-detector should compare) or any metadata.

**Normalisation (`normalisationVersion = "1"`).** `normalise(text)`: Unicode NFKC-normalise → lower-case → strip every character that is not `[a-z0-9\s]` (regex, post-lower-case) → collapse runs of whitespace to a single space → trim. Deterministic, locale-independent, no external dependency.

**Tokenisation and similarity algorithm (`checkerVersion = "1"`, token 3-gram Jaccard).** `tokens = normalise(comparableText).split(/\s+/).filter(Boolean)`. Shingle set: 3-token sliding-window shingles (`tokens[i..i+3).join(" ")` for each valid `i`); if `tokens.length` is 1 or 2, the single shingle is `tokens.join(" ")` (the whole available text, since no 3-gram exists); if `tokens.length === 0`, the shingle set is empty (this is the "cannot compute" case — see below, never silently treated as "0% similar to everything"). `similarity(a, b) = |shingles(a) ∩ shingles(b)| / |shingles(a) ∪ shingles(b)|`, `0` if the union is empty. Pure, deterministic, versioned independently of `normalisationVersion` so either axis can be bumped without forcing the other.

**Classification and outcome mapping (PD-4's two thresholds, amended to name three similarity-derived classifications plus the zero-content case, per PD-4's own "exact / substantive / high-similarity-non-blocking" framing — no new threshold values, both cut points are exactly `FACTORY_THRESHOLDS`' existing `STRUCTURALLY_SIMILAR_SIMILARITY`/`NEAR_DUPLICATE_SIMILARITY`):**

| Nearest-match similarity | Classification | Severity | Destination | Issue code |
|---|---|---|---|---|
| `< 0.6` | `distinct` | — | `originality_review_passed` | — |
| `0.6 ≤ s < 0.85` | `structurally_similar` | `soft_fail` | `needs_revision` (budget remains) else `rejected` | `originality_structurally_similar` |
| `0.85 ≤ s < 1.0` | `substantive_duplicate` | `hard_fail` | `rejected` directly — never consumes a revision slot | `originality_near_duplicate` |
| `s = 1.0` (identical normalised comparable text) | `exact_duplicate` | `hard_fail` | `rejected` directly | `originality_exact_duplicate` |
| Candidate's own comparable text normalises to zero tokens (nothing to compare) | — | `uncertain` | `quarantined` | `originality_comparison_failed` |
| Corpus cannot be loaded (defensive, orchestrator-level — the production bank is a static in-repo import, so this is a belt-and-braces path, not an expected runtime case) | — | `uncertain`-shaped, but zero evidence written | `repository_error` outcome (no report, no move) | `originality_corpus_unreadable` |

`classification` and `similarityScore` are computed by the pure `verify-candidate-originality.ts` decision function; the corpus-unreadable path never reaches it (the orchestrator fails closed before calling the pure function, mirroring how a blueprint-resolution failure never reaches `verifyCandidateCorrectness` today).

**Explicit scope-limitation statement, verbatim, required in both the evidence type's own doc comment and the module's top-of-file comment:** *this is duplicate/near-duplicate detection within the factory's own corpus only; it is not a copyright-infringement check against NAPLAN/ICAS/commercial material, and the existing human editorial checklist (`docs/CONTENT_RULES.md`) remains required and is not superseded by this gate.*

### 4b. Difficulty

```ts
export interface DifficultyEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly blueprintHash: string;                 // always present — this gate cannot run at all without a resolved blueprint (declaredDifficulty depends on it)
  readonly checkerVersion: string;                 // = DIFFICULTY_ESTIMATOR_VERSION, bump on signal/formula/evidence-shape change
  readonly declaredDifficulty: "easy" | "medium" | "challenging"; // from the resolved bound blueprint's own `difficulty` field — never from candidate.metadata.difficulty (see note below)
  readonly estimatedDifficulty: "easy" | "medium" | "challenging";
  readonly estimateConfidence: number;             // 0..1
  readonly deviation: number;                      // 0..1, |estimatedBandIndex - declaredBandIndex| / 2
  readonly signals: {                               // the three measurable inputs, always recorded even on a pass, for auditability
    readonly wordCount: number;
    readonly readingLoadScore: number;             // 0..1
    readonly vocabularyComplexityScore: number;     // 0..1
    readonly reasoningStepScore: number;            // 0..1
  };
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly DifficultyIssue[];
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly DifficultyIssueCode[] };
  readonly validatedAt: string;
  readonly difficultyFingerprint: string;
}
```

**Author-declared difficulty is never trusted (governance requirement, stated exactly once here, binding on the implementation).** `CandidateQuestion.metadata.difficulty` is the *author's own claim*, carried on the candidate since ingestion — this gate never reads it and never compares against it. `declaredDifficulty` is always read from the **blueprint's** `difficulty` field (the governed target the blueprint planner assigned before generation), resolved via `resolveBoundBlueprint`. This is what makes the gate a genuine check rather than the candidate grading its own homework: an author/generator could set `metadata.difficulty` to anything, but the comparison target is a value the candidate's own content has no way to influence.

**Three deterministic, measurable signals — the exact formulas (`DIFFICULTY_ESTIMATOR_VERSION = "1"`).** Comparable text is extracted the same way as originality's (`prompt` + `stimulus?.body` + joined `options[].text`), plus `explanation` (optional on `CandidateQuestion`) counted separately for the third signal. Let `words` = the comparable text lower-cased and whitespace-split (no punctuation-stripping needed for a count), `wordCount = words.length`.

1. **Reading load.** `readingLoadScore = clamp((wordCount - 20) / (60 - 20), 0, 1)` — 20 and 60 words are the low/high anchors; at or below 20 words scores 0, at or above 60 words scores 1.
2. **Vocabulary complexity.** For each word, strip non-alphanumeric characters and take its length. `avgWordLength` = mean stripped length (0 if `wordCount = 0`). `avgLengthScore = clamp((avgWordLength - 4.0) / (7.0 - 4.0), 0, 1)`. `complexWordFraction` = fraction of words with stripped length `≥ 8`. `vocabularyComplexityScore = (avgLengthScore + complexWordFraction) / 2`.
3. **Reasoning-step proxy.** `sentenceCount` = the candidate's `explanation` text (empty string if absent) split on `/[.!?]+/`, trimmed, non-empty segments counted. `reasoningStepScore = clamp((sentenceCount - 1) / (4 - 1), 0, 1)` — an absent or single-sentence explanation scores 0 (documented, deterministic default: "no measurable elaboration" is treated as the lowest reasoning-complexity signal, not as missing data that blocks the estimate).

**Combination.** `difficultyScore = (readingLoadScore + vocabularyComplexityScore + reasoningStepScore) / 3`. Bands are indexed `easy = 0, medium = 1, challenging = 2`; `estimatedBandIndex = difficultyScore < 1/3 ? 0 : difficultyScore < 2/3 ? 1 : 2`. `declaredBandIndex` is the same index for `declaredDifficulty`. `deviation = |estimatedBandIndex - declaredBandIndex| / 2` (0 = same band, 1 = maximally distant — `easy` vs `challenging`).

**Confidence.** `estimateConfidence = clamp(wordCount / 8, 0, 1)` — a candidate with fewer than 4 extractable words never reaches the `MIN_DIFFICULTY_ESTIMATE_CONFIDENCE (0.5)` floor and is quarantined rather than estimated; this is the gate's deterministic, testable "insufficient evidence" trigger (a degenerate/near-empty comparable text, not a subjective judgement call).

**Outcome mapping — five typed outcomes (PD-4's original three-row table, split into the exact typed destinations `DifficultyOrchestrationOutcome` must express; no new threshold values, both cut points are `FACTORY_THRESHOLDS.DIFFICULTY_MATCH_TOLERANCE`/`MIN_DIFFICULTY_ESTIMATE_CONFIDENCE` exactly):**

| Outcome | Condition | Severity | Destination | Issue code |
|---|---|---|---|---|
| `confirmed` | `deviation ≤ 0.15` and `estimateConfidence ≥ 0.5` | — | `difficulty_review_passed` | — |
| `mismatch` | `deviation > 0.15`, `estimateConfidence ≥ 0.5` (a real, confident mismatch) | `soft_fail` | `needs_revision` (budget remains) else `rejected` | `difficulty_deviation_exceeded` |
| `insufficient_evidence` | `estimateConfidence < 0.5` (regardless of deviation) | `uncertain` | `quarantined` — never defaulted to pass | `difficulty_estimate_low_confidence` |
| `stale_replay` | Candidate already `difficulty_review_passed`, but `checkerVersion`/blueprint-hash/fingerprint recomputation disagrees with the cached report (§5b) | — (refusal, not a severity-driven transition) | `replay_integrity_failure` — no move, no write | `difficulty_replay_drift_detected` |
| `invalid_blueprint` | `resolveBoundBlueprint` returns `{ok: false}` | — (fail-closed refusal) | `blueprint_unresolved` — no move, no write | `blueprint_binding_unresolved` |

`invalid_blueprint`/`blueprint_unresolved` is a first-class outcome variant in `DifficultyOrchestrationOutcome` (and, per §4a's amendment, in `OriginalityOrchestrationOutcome` too), not text embedded in a generic `repository_error` message — this is a deliberate strengthening over `correctness/orchestrate-correctness-verification.ts`'s current shape (`repository_error` + free text), adopting instead the more structured `{status: "rejected", issueCode, message}` pattern `revision/revise.ts` already established for the exact same `resolveBoundBlueprint` failure. `correctness/`'s weaker shape is unchanged (it is Mission 3C hardening debt item §10.2, out of scope here); Mission 3D's two new gates simply use the stronger, already-precedented pattern from day one.

### 4c. Both evidence schemas

- Fingerprint formula: `hashJson({...every field except validatedAt...})`, mirroring `computeStructuralValidationFingerprint`/`computeCorrectnessVerificationFingerprint` exactly — a retry that only differs by wall-clock time always fingerprints identically.
- Neither schema introduces a new compartment. Reports persist in the existing `reports` compartment, keyed by a deterministic id: `og-<hash(candidateId)>` (originality) and `df-<hash(candidateId)>` (difficulty), mirroring `sv-`/`cv-`'s existing convention exactly (distinct prefix namespace, collision-free with every existing report key).

---

## 5. Lifecycle, persistence and replay

### 5a. Lifecycle boundary (hard constraint of this mission)

`PIPELINE_STAGES` becomes exactly:

```ts
export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { name: "structural",  acceptsState: "generated",                    run: runStructuralStage,  preview: previewStructuralStage },
  { name: "correctness", acceptsState: "structural_validation_passed", run: runCorrectnessStage, preview: previewCorrectnessStage },
  { name: "semantic",    acceptsState: "correctness_check_passed",     run: runSemanticStage,    preview: previewSemanticStage },
  { name: "originality", acceptsState: "semantic_review_passed",       run: runOriginalityStage, preview: previewOriginalityStage },
  { name: "difficulty",  acceptsState: "originality_review_passed",    run: runDifficultyStage,  preview: previewDifficultyStage },
];
```

**No sixth entry.** `difficulty_review_passed → staged` remains a defined-but-unreached edge, exactly as `semantic_review_passed → originality_review_passed` was before this mission. A negative-space grep for `"staged"`/`"published"` production call sites must return zero hits at the end of this mission, mirroring the Mission 3C audit's own checklist item.

### 5b. Replay

Both gates follow the exact `writeReportIfAbsent`-style idempotent-replay idiom every existing gate uses: a matching fingerprint on an existing report is a safe no-op replay; a differing one is a genuine conflict, never a silent overwrite. `pipeline-runner.ts` requires zero changes because replay-within-a-run is already inherited generically from each wrapped gate's own state-based short-circuit (documented, proven behaviour from Mission 3C).

**Originality-specific replay nuance (new, must be designed deliberately, not inherited for free):** unlike every prior gate, the originality gate's *pure* decision is not solely a function of the candidate — it also depends on `corpusScope`, which can legitimately change between two calls if the production bank changes in between (e.g. a new question was published). The persisted evidence's `corpusFingerprint` field exists precisely so a replay attempt can detect this: if the *current* corpus fingerprint no longer matches the *stored* one, the cached report must not be blindly replayed — it must be treated the same way `validateCachedCorrectnessReplay` already treats a stale upstream binding (a genuine, typed refusal to trust a report resting on a corpus that no longer exists in that shape), not a silent pass-through. This is the single most novel design point in this mission and must not be shortcut.

**Exact replay-validity rule for both gates (this amendment's precise specification, closing gap #2/#6).** A cached `*_review_passed` report is replayed **only if every one of the following holds**; any single mismatch is a `replay_integrity_failure` (originality) / `stale_replay` (difficulty) refusal — zero writes, zero moves, the candidate is left exactly as found, and a human/operator must re-run the gate deliberately (there is no automatic "fall through to fresh re-verification" path, exactly matching `validateCachedCorrectnessReplay`'s own contract: a lifecycle state alone never authorises a replay).

*Originality* (`validateCachedOriginalityReplay`, mirroring `validateCachedCorrectnessReplay` field-for-field):
1. `candidate.state === "originality_review_passed"`.
2. Current `blueprintHash` (freshly resolved via `resolveBoundBlueprint`) is verified non-empty **and** strictly equals the stored evidence's `blueprintHash` (the same "absent hashes never vacuously match" guard `validate-cached-replay.ts:90-100` already enforces).
3. Recomputed `corpusFingerprint` (hashing the **current** `questionBank`'s sorted id list) strictly equals the stored evidence's `corpusFingerprint` — this is the corpus-drift check; a single question added to or removed from the production bank since the report was written changes this hash deterministically.
4. Stored `evidence.checkerVersion === ORIGINALITY_CHECKER_VERSION` and `evidence.normalisationVersion === ORIGINALITY_NORMALISATION_VERSION` (both current constants) — either axis of a comparison-logic change independently invalidates the cache.
5. `candidateRevision`/`candidateContentHash` match the candidate's current provenance.
6. The stored `originalityFingerprint` recomputes identically from the report's own visible fields (tamper/edit detection, same as every existing gate).

*Difficulty* (`validateCachedDifficultyReplay`):
1. `candidate.state === "difficulty_review_passed"`.
2. Current `blueprintHash` verified non-empty and strictly equals the stored evidence's `blueprintHash`.
3. Stored `evidence.checkerVersion === DIFFICULTY_ESTIMATOR_VERSION` (current constant) — an estimator formula/signal change invalidates every prior cached pass, since the same candidate could now score differently.
4. `candidateRevision`/`candidateContentHash` match.
5. The stored `difficultyFingerprint` recomputes identically.

Both fingerprints (`originalityFingerprint`, `difficultyFingerprint`) exclude `validatedAt` exactly as every existing gate's fingerprint does (§4c) — a wall-clock-only retry always replays cleanly, and only a genuine content/corpus/version change ever produces a refusal.

### 5c. Corpus-scope limitation (current-state reality, stated honestly)

At the time this mission runs, `staged` is unreachable (§1b) and no candidate has ever been staged. **`corpusScope.source` is therefore always `"production_bank"` in practice for the whole lifetime of this mission** — there is no staged corpus to compare against yet. This is not a design gap; it is accurately reflected in the `corpusScope` schema's own `source` field (a closed union with exactly one legal value today), so the evidence record never overclaims a comparison that did not happen. When Mission 3E introduces `staged`, the schema's `source` union gains `"staged"` as a second legal value — an additive schema change, not a breaking one.

### 5d. Five-stage pipeline replay/resume behaviour (this amendment's precise specification, closing gap #6)

`pipeline-runner.ts`'s `processCandidate` loop (unmodified — §5a) is a plain `while (!TERMINAL_STATES.has(currentState))` walk that, on each iteration, looks up `PIPELINE_STAGES.find(stage => stage.acceptsState === currentState)` and calls `stage.run`. Extending the registry from 3 to 5 entries changes nothing about this loop's semantics — it only changes how many iterations a fully-passing candidate makes (3 → 5) before `TERMINAL_STATES` or "no stage accepts this state" ends the walk. The following resume/replay behaviours are **consequences of the existing loop plus the two new gates' own replay contracts (§5b), not new runner logic**:

1. **Mid-pipeline resume.** A pipeline run invoked against a candidate already at `semantic_review_passed` starts its loop at the `originality` stage (the only registered stage whose `acceptsState` matches); a candidate at `originality_review_passed` starts at `difficulty`. No stage is ever skipped and none is ever re-entered out of order — `PIPELINE_STAGES`' array order (§5a) is a total order over `acceptsState` values with no two entries sharing one, so at most one stage ever matches a given `currentState`.
2. **Full re-run replay (same `pipelineRunId`).** `runPipeline` itself replays at the whole-run level first (`runFingerprint` match on `reports/pipeline-run-<id>` short-circuits before any candidate or stage is touched — unchanged, §pipeline-runner.ts:201-210). Below that, a fresh `pipelineRunId` walking an already-`difficulty_review_passed` candidate re-enters the loop, finds no stage whose `acceptsState` matches (`difficulty_review_passed` accepts nothing further — there is no sixth entry, §5a), and the loop halts immediately with zero gate calls, zero writes — this is what "stop at `difficulty_review_passed`" means operationally, not just structurally.
3. **Per-gate replay within a fresh run.** If a fresh `pipelineRunId` walks a candidate that already independently passed `originality_review_passed` (e.g. an operator re-ran the batch after a crash), the `originality` stage's `run` function calls `orchestrateOriginalityReview`, which — per §5b's replay-validity rule — either replays the cached report (all six checks pass: same corpus, same versions, same content) and returns `endState: "originality_review_passed"` with `outcome: "passed"` so the loop advances into `difficulty` in the same call, or refuses (`replay_integrity_failure`) if corpus/version drift is detected, which the stage's `run` function surfaces as a thrown `Error` (mirroring `runCorrectnessStage`'s `throw new Error(...)` on every outcome the pass/fail/quarantine mapping doesn't recognise) — caught by `processCandidate`'s own `try/catch` (`pipeline-runner.ts:124-137`) and reported as `resultKind: "error"` for that candidate only, never aborting the batch.
4. **Crash recovery (report written, transition not yet persisted).** Because `writeReportIfAbsent` and the state transition (`attemptUpdate`, both new-gate states map to `review-queue` — see §5a's `compartmentForState` table, unchanged) are two sequential, independently-idempotent steps exactly as in every existing gate, a crash between them leaves the candidate still in its pre-gate state with a report already on disk. The next `run` call re-derives the identical evidence (same fingerprint, since `validatedAt` is excluded — §4c), `writeReportIfAbsent` recognises the existing report as a match rather than a conflict, and only the transition is retried. No new recovery mechanism is introduced; this is `orchestrateCorrectnessVerification`'s own documented partial-failure-recovery contract (`orchestrate-correctness-verification.ts:494-505`), inherited verbatim by both new orchestrators.
5. **Multi-candidate isolation, unchanged.** `runPipeline`'s per-candidate loop (`pipeline-runner.ts:222-224`) and `processCandidate`'s own `try/catch` already guarantee one candidate's stage failure/exception never affects another's `PerCandidateResult` — extending the registry to 5 stages does not touch this loop, so isolation holds identically across all five stages, not just the original three.

**Dry-run preview at the 5-stage boundary.** A `dryRun` request against a candidate at `semantic_review_passed` (or `originality_review_passed`) previews exactly one stage — the first the candidate is currently eligible for — via `previewOriginalityStage`/`previewDifficultyStage`, which must call the exact same pure decision function (`verifyCandidateOriginality`/`verifyCandidateDifficulty`) the real `run` path calls, per the existing "a dry-run preview and a real run can never structurally disagree" discipline (`pipeline-stages.ts:35-46`). A preview never writes a report and never resolves replay — it always computes fresh, exactly like every existing stage's `preview` function does today (`previewCorrectnessStage` never calls `validateCachedCorrectnessReplay`).

---

## 6. Issue codes

`config/mission3d-issue-codes.ts`, matching the existing per-mission catalogue convention exactly:

```ts
export const ORIGINALITY_ISSUE_CODES = [
  "originality_corpus_unreadable",       // defensive, orchestrator-level; production bank is a static import, so this is belt-and-braces
  "originality_comparison_failed",       // candidate's own comparable text normalises to zero tokens — nothing to compare
  "originality_exact_duplicate",         // similarity = 1.0 exactly (added in this amendment — was folded into near_duplicate in the original text)
  "originality_near_duplicate",          // 0.85 <= similarity < 1.0
  "originality_structurally_similar",    // 0.6 <= similarity < 0.85
  "originality_corpus_drift_detected",   // cached-replay refusal: corpusFingerprint or checker/normalisation version no longer matches (added in this amendment)
  "blueprint_binding_unresolved",        // reused verbatim — same meaning as correctness/review's code
] as const;
export type OriginalityIssueCode = (typeof ORIGINALITY_ISSUE_CODES)[number];

export const DIFFICULTY_ISSUE_CODES = [
  "difficulty_estimation_failed",        // defensive: candidate provenance/question fails its trust-boundary re-parse at this late stage
  "difficulty_deviation_exceeded",
  "difficulty_estimate_low_confidence",
  "difficulty_replay_drift_detected",    // cached-replay refusal: checkerVersion or blueprintHash no longer matches (added in this amendment)
  "blueprint_binding_unresolved",
] as const;
export type DifficultyIssueCode = (typeof DIFFICULTY_ISSUE_CODES)[number];

export const MISSION_3D_ISSUE_CODES = [...ORIGINALITY_ISSUE_CODES, ...DIFFICULTY_ISSUE_CODES] as const;
export type Mission3DIssueCode = (typeof MISSION_3D_ISSUE_CODES)[number];
```

`blueprint_binding_unresolved` is **reused, not redefined** — same string, same meaning, appearing in a fourth mission's catalogue exactly as it already appears in Mission 3B's `REVIEW_INGESTION_ISSUE_CODES` and Mission 3C's revision codes (as `revision_blueprint_missing`/`revision_blueprint_invalid` — the one inconsistency between the two naming schemes already exists pre-Mission-3D and is not this plan's problem to reconcile; it is noted, not fixed, here).

---

## 7. CLI changes

**No new CLI script or flag; one literal-string correction, not "comment-only" as the original text claimed.** `scripts/questions-pipeline.mts`'s doc comment currently states it "never registers or invokes an originality, difficulty... stage (Mission 3D's responsibility)" and stops "at `semantic_review_passed`" — both statements become false the moment `PIPELINE_STAGES` gains the two new entries, and the doc comment must be updated accordingly. **Correction to the original plan text:** `exitCodeFor()` (`questions-pipeline.mts:131`) hardcodes the success end-state as the literal string `"semantic_review_passed"` (`if (outcome.report.candidateResults.some((result) => result.endState !== "semantic_review_passed")) return 3;`) — this is a one-line runtime logic change, to `"difficulty_review_passed"`, not merely a comment update. `parseArgs`, argument shape, and every other runtime code path are untouched; this is the only executable line in the CLI that encodes the pipeline's stop point.

---

## 8. Tests

New test files, following the established Vitest conventions (no sleeps, no mocking library, real `FsFactoryRepository` over a temp directory for orchestration tests):

| File | Focus |
|---|---|
| `originality-similarity.test.ts` | Pure similarity metric: identical text, disjoint text, boundary values at exactly 0.6 and 0.85, determinism (same inputs -> same score every call), Unicode/whitespace canonicalisation parity with existing precedent (`correctness/`'s own canonicalisation tests). |
| `originality-verify-candidate.test.ts` | Pure decision function boundary testing: at-limit accepted (similarity exactly at 0.6, at 0.85), over-limit routed correctly on both sides, corpus-unreadable -> `quarantined` never `passed`. |
| `originality-orchestration.test.ts` | Real-repository orchestration: fresh pass, fresh near-duplicate -> `needs_revision`/`rejected` by budget, fresh hard-duplicate -> `rejected` direct, replay-safety (matching fingerprint no-op), **corpus-changed-since-report replay refusal** (§5b's novel case), partial-failure recovery (report written, transition fails, retry completes), zero-write assertions on every refusal path. |
| `difficulty-estimate.test.ts` | Pure estimator: boundary values at exactly 0.15 deviation and 0.5 confidence, determinism. |
| `difficulty-verify-candidate.test.ts` | Pure decision function boundary testing, mirroring the originality equivalent. |
| `difficulty-orchestration.test.ts` | Real-repository orchestration mirroring `correctness-orchestration.test.ts`'s shape: fresh pass/fail/quarantine, replay-safety, blueprint-resolution fail-closed (reusing `resolveBoundBlueprint`, asserted with the real fail-closed test pattern from `blueprint-binding-fail-closed.test.ts`), partial-failure recovery, zero-write assertions. |
| `pipeline-stages.test.ts` (extended) | `PIPELINE_STAGES` is exactly the 5-entry array in §5a's exact order; each new `acceptsState` matches the wrapped gate's real entry precondition; dry-run previews never mutate. |
| `mission3d-integration.test.ts` | Full production-path run: `runManualIngestion` -> `runPipeline` through all five stages in one call for a fixture candidate, ending at `difficulty_review_passed`; a second fixture candidate deliberately near-duplicate of the first, ending at `needs_revision`/`rejected`; negative-space assertion that no candidate anywhere in the test run ever reaches `staged` or `published`. |

**Mandatory boundary coverage for both gates (PD-4's own testing obligation, reaffirmed):** at-limit accepted, over-limit correctly routed, and the "cannot compute -> `quarantined`, never `passed`" case — for both gates, without exception.

---

## 9. Mandatory validation (for the eventual implementation, not run now)

```bash
npm run typecheck
npm run lint
npm test
npm run validate:questions
npm run check:answers
npm run build
npm run test:e2e
npm audit --audit-level=moderate
git diff --check
git status --short
```

Expected unchanged residual state: exactly two moderate Next/PostCSS advisories; exactly 100 production questions, 15 showcase fixtures; `src/content/` untouched (read-only access only, for the originality corpus); zero `staged`/`published` call sites; `main` untouched.

---

## 10. Mission 3C hardening follow-ups — accepted, non-blocking debt (tracked separately)

These are residual findings from the Mission 3C final Codex re-audit (`0329dd1`). **None of them block Mission 3D or represent a live, exploitable bypass** — the confirmed defect they relate to is already fully closed at the sole reachable call site in every case. They are recorded here so they are tracked, not lost, and so Mission 3D's implementer does not fold them silently into new-gate commits. If addressed during Mission 3D, each must land as its **own isolated commit**, clearly labelled as follow-up debt, never mixed into an `originality/`/`difficulty/` commit.

1. **Asymmetric defense-in-depth in `correctness/verify-candidate-correctness.ts`.** The fresh-verification pure function compares `evidence.blueprintHash !== context.blueprintHash` without the "verified, non-empty" guard its sibling `validate-cached-replay.ts` independently enforces. Currently safe only because the sole production caller (`orchestrate-correctness-verification.ts`) already fails closed before ever invoking it. Recommended fix: add the identical guard, matching the cached-replay function's own pattern, purely as future-proofing against a hypothetical future direct caller.
2. **Inconsistent failure signal shape for the same root cause.** A fresh-correctness blueprint-resolution failure surfaces as a generic `outcome: "repository_error"` with the blueprint id/kind embedded only in free text; a cached-replay blueprint-resolution failure surfaces as a structured `blueprint_binding_unresolved` issue code. Both fail closed with zero writes; only the observability signal differs. Recommended fix: none required functionally; consider whether `CorrectnessOrchestrationOutcome`'s shape could carry a structured code for this case in a future, separately-scoped refinement.
3. **Doc-comment path typo.** `correctness/types.ts`'s comment for `blueprint_binding_unresolved` references `blueprints/bound-blueprint.ts`; the actual module is `shared/bound-blueprint.ts`. Trivial, no functional impact. One-line fix, own commit if picked up.
4. **Undocumented, untested (but correct) consequence for unblueprinted manual ingestion.** Candidates ingested via `questions:ingest` without `--blueprint-id` (the real, documented `manual-ingestion-unblueprinted` placeholder) can now never pass correctness verification, since no gate special-cases the placeholder and it never resolves. This is the *correct* governance outcome ("no verified blueprint, no progression") but is currently neither tested nor documented anywhere. Recommended: one explicit test proving this is deliberate behaviour, plus a note in `manual-ingestion/mappings.ts`'s existing doc comment cross-referencing the consequence.

---

## 11. Explicit acceptance criteria

1. `PIPELINE_STAGES` contains exactly 5 entries, in the exact order structural -> correctness -> semantic -> originality -> difficulty; `pipeline-runner.ts`'s control-flow loop is unmodified.
2. Zero production call sites reach `staged` or `published` (negative-space grep, matching the exact check already performed for Mission 3C).
3. Neither gate ever produces a placeholder or automatically-passing outcome; "cannot compute" always routes to `quarantined`.
4. Both evidence schemas' fingerprints exclude `validatedAt`; a wall-clock-only retry always replays cleanly.
5. The originality gate's corpus-drift replay case (§5b) is explicitly designed and tested, not silently inherited.
6. The originality gate's scope-limitation statement (§4a) appears verbatim in the evidence type's own doc comment.
7. `resolveBoundBlueprint` is reused verbatim for the difficulty gate's `declaredDifficulty` source — no second, independent blueprint-lookup implementation.
8. No new CLI script; `questions-pipeline.mts`'s doc comment is corrected to describe the new stop point, and its `exitCodeFor` success-state literal is updated from `"semantic_review_passed"` to `"difficulty_review_passed"` (§7).
9. No change to `workflow/states.ts`, `workflow/transitions.ts`, `revision/`, `review/`, taxonomy, the production bank, or `src/content/` (beyond read-only corpus access).
10. No Supabase reference anywhere in the diff.
11. The four Mission 3C hardening follow-ups (§10), if touched at all, land as their own isolated commits — never inside an `originality/`/`difficulty/` commit.
12. `main` remains at `ba9575c572df050ab97244758ead22e5336dcd2c` throughout; no merge is performed as part of this mission.

---

## 12. Commit plan

Starting SHA: **`59376b336fa86459617f5ea29afd11c84af25350c`** (corrected in this amendment — see the header and §0).

0. `docs: clarify Mission 3D plan before implementation` — this amendment (§0, and the updated §4a/§4b/§5b/§5d/§6/§7/§12 it cross-references). Docs-only, precedes the bounded five-commit implementation sequence below; not folded into commit 1.

1. `feat: add originality-review gate` — `originality/` module, `config/mission3d-issue-codes.ts` (originality codes only), no pipeline wiring yet.
2. `feat: add difficulty-review gate` — `difficulty/` module, `config/mission3d-issue-codes.ts` (difficulty codes added).
3. `feat: wire originality and difficulty into the pipeline runner` — `pipeline/pipeline-stages.ts` (+2 entries), `pipeline/pipeline-types.ts` (`GateResult.gate` union extended), `scripts/questions-pipeline.mts` (doc comment plus the one-line `exitCodeFor` success-state literal update — §7).
4. `test: cover originality and difficulty gates` — every file in §8, including the full production-path integration test and the corpus-drift replay case.
5. `docs: record Mission 3D originality and difficulty delivery` — a new `10-mission3d-delivery.md`, updating this document's `Status:` line and recording actual validation results, mirroring `07-mission3c-revision-pipeline-delivery.md`'s structure.

*(Optional, only if picked up, each its own commit, never merged into 1–5):* `fix: harden fresh-correctness blueprint-hash comparison`, `fix: correct bound-blueprint doc-comment path`, `test: cover unblueprinted manual ingestion at correctness verification` — the three actionable items from §10.

The original plan text and this section both predate commit 0; commit 0 lands this amendment itself, ahead of the six implementation commits (0–5) above.

---

## 13. Freeze and audit boundary

Identical governance shape to every prior sub-mission: implementation is frozen at a single SHA after the commits in §12 land, and Mission 3E (staging, publication) must not start until an independent Codex audit returns an approval verdict for Mission 3D.

---

## Explicit statement

This document, as amended by §0, is the authoritative Mission 3D plan implementation proceeds against, starting at `59376b3`. As of this amendment landing, no gate code, test code, or configuration change has yet been made — only this plan document (§0's amendment, committed as commit 0 in §12) — so the statement's substance is unchanged even though implementation is now authorised to begin immediately afterward. `main` is unchanged. Nothing has been merged.
