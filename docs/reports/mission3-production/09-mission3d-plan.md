# Mission 3D — Originality and Difficulty Gates

Status: **PLANNING — pending review and approval. Not started, not authorised for implementation.**

Branch: `integration/governed-question-factory`. Starting SHA (Mission 3C approved): `0329dd125cc9d27b09c9c84998e8b8f16e36d1a4`. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched, not to be merged into as part of this plan.

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
  readonly checkerVersion: string;               // bump on algorithm/evidence-shape change
  readonly corpusScope: {
    readonly source: "production_bank";          // "staged" not added until Mission 3E
    readonly comparedIds: readonly string[];      // bounded, the exact id set compared against
    readonly corpusFingerprint: string;           // hashJson(comparedIds) — proves which corpus snapshot this evidence rests on
  };
  readonly nearestMatches: readonly {             // bounded, top-5
    readonly matchedId: string;
    readonly similarityScore: number;
  }[];
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly OriginalityIssue[];
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly OriginalityIssueCode[] };
  readonly validatedAt: string;                   // ISO 8601, excluded from the fingerprint
  readonly originalityFingerprint: string;
}
```

**Outcome mapping (PD-4, unchanged):**

| Similarity to nearest match | Severity | Destination |
|---|---|---|
| `< STRUCTURALLY_SIMILAR_SIMILARITY (0.6)` | — | `originality_review_passed` |
| `0.6 ≤ similarity < NEAR_DUPLICATE_SIMILARITY (0.85)` | `soft_fail` | `needs_revision` (budget remains) else `rejected` |
| `≥ 0.85` | `hard_fail` | `rejected` directly — never consumes a revision slot |
| Corpus unreadable / malformed comparison input | `uncertain` | `quarantined` |

**Explicit scope-limitation statement, verbatim, required in both the evidence type's own doc comment and the module's top-of-file comment:** *this is duplicate/near-duplicate detection within the factory's own corpus only; it is not a copyright-infringement check against NAPLAN/ICAS/commercial material, and the existing human editorial checklist (`docs/CONTENT_RULES.md`) remains required and is not superseded by this gate.*

### 4b. Difficulty

```ts
export interface DifficultyEvidence {
  readonly candidateId: string;
  readonly candidateRevision: number;
  readonly candidateContentHash: string;
  readonly checkerVersion: string;
  readonly declaredDifficulty: "easy" | "medium" | "challenging"; // from the resolved bound blueprint
  readonly estimatedDifficulty: "easy" | "medium" | "challenging";
  readonly estimateConfidence: number;            // 0..1
  readonly deviation: number;                     // 0..1, derived from the estimator's own scale
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly issues: readonly DifficultyIssue[];
  readonly issueSummary: { readonly errorCount: number; readonly codes: readonly DifficultyIssueCode[] };
  readonly validatedAt: string;
  readonly difficultyFingerprint: string;
}
```

**Outcome mapping (PD-4, unchanged):**

| Condition | Severity | Destination |
|---|---|---|
| `deviation ≤ DIFFICULTY_MATCH_TOLERANCE (0.15)` and `estimateConfidence ≥ MIN_DIFFICULTY_ESTIMATE_CONFIDENCE (0.5)` | — | `difficulty_review_passed` |
| Deviation exceeds tolerance, confidence sufficient (a real, confident mismatch) | `soft_fail` | `needs_revision` (budget remains) else `rejected` |
| `estimateConfidence < 0.5` | `uncertain` | `quarantined` — never defaulted to pass |

**`declaredDifficulty` source.** Read from the parent candidate's **already-resolved** bound blueprint (via the same `resolveBoundBlueprint` call the correctness/semantic gates already make against `provenance.blueprintId` — reused, not re-implemented). A blueprint-resolution failure at this point is not a difficulty-gate-specific concern; it uses the identical fail-closed contract already established (§2), refusing before any evidence write, with the shared `kind: "missing" | "invalid"` classification mapped onto this gate's own issue-code catalogue (mirroring exactly how `revision/`, `correctness/`, and `review/` each map it onto their own vocabulary today).

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

### 5c. Corpus-scope limitation (current-state reality, stated honestly)

At the time this mission runs, `staged` is unreachable (§1b) and no candidate has ever been staged. **`corpusScope.source` is therefore always `"production_bank"` in practice for the whole lifetime of this mission** — there is no staged corpus to compare against yet. This is not a design gap; it is accurately reflected in the `corpusScope` schema's own `source` field (a closed union with exactly one legal value today), so the evidence record never overclaims a comparison that did not happen. When Mission 3E introduces `staged`, the schema's `source` union gains `"staged"` as a second legal value — an additive schema change, not a breaking one.

---

## 6. Issue codes

`config/mission3d-issue-codes.ts`, matching the existing per-mission catalogue convention exactly:

```ts
export const ORIGINALITY_ISSUE_CODES = [
  "originality_corpus_unreadable",
  "originality_comparison_failed",
  "originality_near_duplicate",
  "originality_structurally_similar",
  "blueprint_binding_unresolved",   // reused verbatim — same meaning as correctness/review's code
] as const;
export type OriginalityIssueCode = (typeof ORIGINALITY_ISSUE_CODES)[number];

export const DIFFICULTY_ISSUE_CODES = [
  "difficulty_estimation_failed",
  "difficulty_deviation_exceeded",
  "difficulty_estimate_low_confidence",
  "blueprint_binding_unresolved",
] as const;
export type DifficultyIssueCode = (typeof DIFFICULTY_ISSUE_CODES)[number];

export const MISSION_3D_ISSUE_CODES = [...ORIGINALITY_ISSUE_CODES, ...DIFFICULTY_ISSUE_CODES] as const;
export type Mission3DIssueCode = (typeof MISSION_3D_ISSUE_CODES)[number];
```

`blueprint_binding_unresolved` is **reused, not redefined** — same string, same meaning, appearing in a fourth mission's catalogue exactly as it already appears in Mission 3B's `REVIEW_INGESTION_ISSUE_CODES` and Mission 3C's revision codes (as `revision_blueprint_missing`/`revision_blueprint_invalid` — the one inconsistency between the two naming schemes already exists pre-Mission-3D and is not this plan's problem to reconcile; it is noted, not fixed, here).

---

## 7. CLI changes

**None, functionally.** `scripts/questions-pipeline.mts`'s doc comment currently states it "never registers or invokes an originality, difficulty... stage (Mission 3D's responsibility)" and stops "at `semantic_review_passed`" — both statements become false the moment `PIPELINE_STAGES` gains the two new entries. The doc comment must be updated to describe the new stop point (`difficulty_review_passed`) and the still-true exclusions (staging, publication). This is a comment-only change; `parseArgs`, exit-code mapping, and every runtime code path are untouched.

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
8. No new CLI script; `questions-pipeline.mts`'s doc comment is corrected to describe the new stop point.
9. No change to `workflow/states.ts`, `workflow/transitions.ts`, `revision/`, `review/`, taxonomy, the production bank, or `src/content/` (beyond read-only corpus access).
10. No Supabase reference anywhere in the diff.
11. The four Mission 3C hardening follow-ups (§10), if touched at all, land as their own isolated commits — never inside an `originality/`/`difficulty/` commit.
12. `main` remains at `ba9575c572df050ab97244758ead22e5336dcd2c` throughout; no merge is performed as part of this mission.

---

## 12. Commit plan (for the eventual implementation — not executed now)

Starting SHA: **`0329dd125cc9d27b09c9c84998e8b8f16e36d1a4`**.

1. `feat: add originality-review gate` — `originality/` module, `config/mission3d-issue-codes.ts` (originality codes only), no pipeline wiring yet.
2. `feat: add difficulty-review gate` — `difficulty/` module, `config/mission3d-issue-codes.ts` (difficulty codes added).
3. `feat: wire originality and difficulty into the pipeline runner` — `pipeline/pipeline-stages.ts` (+2 entries), `pipeline/pipeline-types.ts` (`GateResult.gate` union extended), `scripts/questions-pipeline.mts` (doc comment only).
4. `test: cover originality and difficulty gates` — every file in §8, including the full production-path integration test and the corpus-drift replay case.
5. `docs: record Mission 3D originality and difficulty delivery` — a new `10-mission3d-delivery.md`, updating this document's `Status:` line and recording actual validation results, mirroring `07-mission3c-revision-pipeline-delivery.md`'s structure.

*(Optional, only if picked up, each its own commit, never merged into 1–5):* `fix: harden fresh-correctness blueprint-hash comparison`, `fix: correct bound-blueprint doc-comment path`, `test: cover unblueprinted manual ingestion at correctness verification` — the three actionable items from §10.

None of the above commits is made by this planning task. This planning document itself, once approved, is committed separately as `docs: add Mission 3D plan` — a docs-only commit, distinct from every implementation commit above.

---

## 13. Freeze and audit boundary

Identical governance shape to every prior sub-mission: implementation is frozen at a single SHA after the commits in §12 land, and Mission 3E (staging, publication) must not start until an independent Codex audit returns an approval verdict for Mission 3D.

---

## Explicit statement

This is a planning document only. No implementation, no test code, no configuration change, and no commit beyond this document itself has been made as part of producing this plan. `main` is unchanged. Nothing has been merged.
