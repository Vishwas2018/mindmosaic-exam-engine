# Mission 3C — Revision Workflow and Pipeline Runner

Status: **IMPLEMENTED — pending independent Codex audit.** This document remains the authoritative design record; see `docs/reports/mission3-production/07-mission3c-revision-pipeline-delivery.md` for what was actually built, including the one necessary file-placement deviation from §6/§16 (the pipeline-runner module lives in a new sibling `pipeline/` directory, not inside `workflow/`, to avoid a real circular import) and full validation results.

Branch: `integration/governed-question-factory`. Written against the approved Mission 3B baseline SHA `8769ba6ba245dc9c1a3fde6b8807956a4da95766`. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched.

Written against `docs/reports/mission3-production/01-mission3-implementation-contract.md` §10, §11, §19–§25 and `02-prerequisite-decisions.md`'s explicit delta over that contract (PD-1, PD-4, PD-9).

**Revision note (this version).** The first draft of this plan left seven architecture questions open for approval (pipeline stopping point, revision CLI surface, batch-lock design, stale-lock handling, the `revision_blueprint_mismatch` code's exact semantics, candidate-selection mode, and divergent-revision handling). All seven are now **resolved authoritatively** in this revision, per explicit direction. §15 records what changed from the first draft and why. No further open decisions remain that block implementation approval; §19 lists genuinely lower-stakes items that may still be refined during implementation without requiring a re-plan.

---

## 1. Verified repository baseline

| Check | Result |
|---|---|
| Branch | `integration/governed-question-factory` |
| Local HEAD | `8769ba6ba245dc9c1a3fde6b8807956a4da95766` |
| Remote HEAD (`origin/integration/governed-question-factory`) | `8769ba6ba245dc9c1a3fde6b8807956a4da95766` (matches) |
| Local `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` |
| Remote `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` (matches) |
| `git diff` / `git diff --cached` | clean |
| Untracked files | `.vscode/`, `design.md` only (before this revision added the planning document itself) |

No tracked source file was modified to produce this document.

---

## 2. Authoritative Mission 3C definition

The implementation contract (`01-mission3-implementation-contract.md` §2, line 51) explicitly warns that it uses **two different, non-interchangeable letterings**: six "technical increments" (§2's 3A–3F) and five "audited sub-missions" (§26's Mission 3A–3E). This plan is for **audited Mission 3C**.

### 2a. Two competing definitions found in the repository

**§26's original mapping** (`01-mission3-implementation-contract.md:824-830, 851-857`) placed originality/difficulty gate *modules* inside Mission 3C, with an exit criterion of "a batch reaches `staged` end-to-end."

**`02-prerequisite-decisions.md`'s explicit, dated-later delta** (`02-prerequisite-decisions.md:7`):

> **Delta from `01-mission3-implementation-contract.md` §26:** that document's sub-mission mapping table placed the originality/difficulty gate *modules* inside Mission 3C. This decision record moves them into Mission 3D... **Mission 3C is now revision workflow + pipeline runner only, staging-eligibility-complete except for the two gates 3D adds.**

And PD-4 itself (`02-prerequisite-decisions.md:214`): *"Option B — minimal-but-real deterministic policy gates, built entirely within **Mission 3D** (not 3C, correcting the prior mapping)."*

### 2b. Resolution: the delta is authoritative

Corroborated independently by `03-mission3a-generation-ingestion.md:341` ("deferred to Mission 3D") and `04-mission3b-semantic-review.md:26` (originality/difficulty/staging/publication listed together as not-yet-built, unattributed to 3C).

**Authoritative Mission 3C scope = §10 (Revision workflow) + §11 (Pipeline runner), restricted to the gates that exist today (structural → correctness → semantic).**

### 2c. Pipeline boundary — resolved authoritatively (was: an open inconsistency; now: a firm decision)

**The Mission 3C pipeline runner stops at `semantic_review_passed`.** It executes exactly three gates — structural validation, correctness verification, semantic review — and none of originality checking, difficulty calibration, staging, or publication. These four are **Mission 3D responsibilities**, unconditionally, regardless of what §11's literal stage-order text ("structural → correctness → semantic → originality → difficulty → stage-eligibility check") might suggest in isolation. That text predates the PD-4 delta and is superseded by it for gate-module ownership; this plan does not attempt to build partial or stub originality/difficulty behaviour to satisfy that text's letter — it builds only what PD-4 assigns to Mission 3C and nothing else. §7b's stage registry is the concrete mechanism: a data-driven, three-entry array that Mission 3D extends (two more entries) without touching the runner's control-flow logic.

---

## 3. Goals

1. Let a `needs_revision` candidate produce a revised, evidence-bound successor through a **dedicated revision CLI** (`questions:revise`, §7a), never through `questions:ingest`, and run the complete, unabridged gate sequence again from `generated` — no gate skipped, no evidence carried over from the parent.
2. Enforce the existing, already-implemented, currently-unreachable revision-limit policy (`FACTORY_THRESHOLDS.MAX_REVISIONS = 2`) at the point it becomes reachable for the first time in production.
3. Guarantee **at most one canonical successor per parent revision** — divergent revision attempts against the same parent are resolved by evidence-verified optimistic concurrency, never by an uncontrolled branching graph or a bare filesystem race (§7a, §10a).
4. Build `workflow/pipeline-runner.ts`: a batch orchestrator that drives an explicit, caller-supplied, deterministically ordered candidate list through structural → correctness → semantic in one call, with atomic batch locking, replay-safe reruns, and per-candidate failure isolation.
5. Close the accepted Mission 3B P2 debt with a full-pipeline crash-window test that starts from real ingestion and is driven end-to-end by `runPipeline` (§11).
6. Introduce the minimum schema surface necessary — one new additive `CandidateProvenance` field (`supersededBy`, §7a) — and zero new lifecycle states, transition-table edges, or compartments.

## 4. Non-goals

- Originality gate, difficulty gate, `OriginalityEvidence`/`DifficultyEvidence` schemas, `rejected/originality`, `rejected/difficulty`, staging, publication, rollback — **all Mission 3D**, unconditionally (§2c).
- CLI-catalogue completion (`questions:reconcile`, `questions:dedupe`, `questions:report`), abandoned-lock manual-release commands — **Mission 3E**.
- Automatic pipeline-candidate discovery by compartment/batch scan — **explicitly deferred**, not scheduled to a specific future mission (§7b, §15).
- Supabase, runtime publication projection, live AI provider adapters, PB1 ingestion, harvested-question imports.
- Any change to the 100-question production bank or `src/content/`.
- Unrelated UI work.
- Modifying `questions:ingest`/`manual-ingestion/` for revision purposes — the dedicated `questions:revise` CLI means Mission 3A's ingestion path is **untouched** by this plan (a stronger isolation guarantee than the first draft, which proposed extending `questions:ingest`).
- Merge to `main`.

---

## 5. Current architecture (verified against the approved Mission 3B baseline)

### 5a. Lifecycle (`workflow/states.ts`, `workflow/transitions.ts`)

`CANDIDATE_STATES` (13, unchanged by this plan). `TRANSITION_TABLE` edges reachable by a real production call site **today**: `generated ↔ structural_validation_passed`, `structural_validation_passed ↔ correctness_check_passed`, `correctness_check_passed ↔ semantic_review_passed`. Every edge from `semantic_review_passed` onward is defined but has zero production call sites — confirmed by grep.

### 5b. The `revision` field is currently dead weight

`candidateProvenanceSchema.revision` (`provenance/candidate-provenance.ts:13`) and `.parentCandidateId` (`:32`) exist today but `revision` is stamped `0` at every ingestion path and never incremented; `parentCandidateId` is never set by any production code path. `applyTransition`'s `revision_limit_exhausted` guard and `decideGateFailureOutcome`'s `soft_fail` branch are fully implemented and unit-tested but structurally unreachable in production. **This is the gap Mission 3C closes.**

### 5c. Gate orchestration pattern (the template every new piece of Mission 3C must follow)

All three existing gates share: a pure decision function separated from an impure orchestrator; a `writeReportIfAbsent(repository, reportId, report)` idempotent-replay idiom (fingerprint excludes the wall-clock field, physically); a discriminated-union outcome type, every `ok`-shaped result carrying `replayed: boolean`; quarantine/rejection routed exclusively through `decideGateFailureOutcome`.

### 5d. Storage/compartments (unchanged by this plan)

`compartmentForState` already maps every state Mission 3C touches. No new compartment or rejection-gate name required. `FsFactoryRepository`'s per-candidate lock (`.locks/<candidateId>.lock`, `fs.open(path, "wx")`, `LockPayload = {candidateId, token, acquiredAt}`, bounded poll then fail-closed `lock_timeout`, release requires presenting the matching token, never auto-stolen — `fs-factory-repository.ts:97-103, 613-679`) is the **direct template** §7c's new batch lock mirrors.

### 5e. Config groundwork already present

`FACTORY_LIMITS.MAX_CANDIDATES_PER_PIPELINE_RUN = 500` (`config/limits.ts:53`), `FACTORY_LIMITS.MAX_BATCH_SIZE = 200` (`:52`), `FACTORY_THRESHOLDS.MAX_REVISIONS = 2` all already exist. `config/mission3a-issue-codes.ts`/`mission3b-issue-codes.ts` establish the `missionXY-issue-codes.ts` naming convention a new `mission3c-issue-codes.ts` follows. `shared/identifiers.ts`'s doc comment already anticipates a `revisionId`-shaped identifier.

### 5f. Test conventions already established (reused, not reinvented)

- **Fault-injection wrapper** (`review-ingest-crash-safety.test.ts:140-218`): hand-written `FactoryRepository` object, every method but one delegated to a real `FsFactoryRepository`, the overridden method failing on a chosen call number. No mocking library, no sleeps.
- **Production-path integration pattern** (`mission3b-integration.test.ts`): every test starts from `runManualIngestion`, never a direct `repository.create` seed at an intermediate lifecycle state.
- **Idempotent-append precedent** (Mission 3B P1-2, `review-ingest.ts`'s `resolveIdempotency`): durable idempotency keyed by a client-supplied id (`reviewId`) plus a content fingerprint (`reviewResultFingerprint`), embedded directly on the record the caller already reads/writes atomically — **never a separate sidecar index**, because a sidecar creates exactly the crash window Mission 3B's P1-2 fix closed. §7a's `supersededBy` claim mechanism is a direct application of this same lesson to the revision-conflict problem.

---

## 6. Proposed architecture

```
src/features/question-factory/
  revision/                              NEW
    types.ts                             ReviseIngestionInput, ReviseOutcome, SupersessionClaim, failure-reason types
    revise.ts                            ingestRevision (impure orchestrator — the CLI's real logic)
    identity.ts                          mintRevisionCandidateId (pure, deterministic)
    index.ts                             barrel
  provenance/
    candidate-provenance.ts              MODIFIED (additive) — new optional `supersededBy?: SupersessionClaim` field
  workflow/
    pipeline-runner.ts                   NEW — runPipeline (impure orchestrator)
    pipeline-stages.ts                   NEW — PIPELINE_STAGES registry (data-driven, extensible to 3D)
    pipeline-types.ts                    NEW — PipelineRunRequest/Report/GateResult/PerCandidateResult
    pipeline-batch-lock.ts               NEW — acquireBatchLock/release (standalone, not on FactoryRepository)
    index.ts                             MODIFIED — export the above
  config/
    mission3c-issue-codes.ts             NEW
    limits.ts                            MODIFIED (additive) — PIPELINE_LOCK_STALE_AGE_MS
    index.ts                             MODIFIED — re-export
  index.ts                               MODIFIED — export revision/ barrel
scripts/
  questions-revise.mts                   NEW
  questions-pipeline.mts                 NEW
```

**`manual-ingestion/` and `questions:ingest` are untouched** — the first draft's proposal to extend `questions:ingest` with a `--parent-candidate-id` flag is withdrawn (§15, item 2). Revision now has its own module, its own CLI, and its own identity/replay/conflict semantics, because — per the explicit direction for this revision — initial candidate creation and revision of governed evidence have materially different identity semantics, parent binding, stale-input checks, provenance requirements, replay rules, and lifecycle prerequisites, and conflating them into one CLI's flag surface would have made each harder to reason about and audit independently.

---

## 7. Contracts and schemas

### 7a. Revision workflow — dedicated CLI, dedicated module

**Why a dedicated CLI (`questions:revise`), not an extension of `questions:ingest`.** Six concrete differences justify the separation:

| Dimension | `questions:ingest` | `questions:revise` |
|---|---|---|
| Identity semantics | Mints a fresh, provenance-independent id (`ing-`/`man-`) from source-file/batch context | Mints an id derived from an explicit **parent link** (`rev-`), meaningless without a parent |
| Parent binding | None | Mandatory: `parentCandidateId`, `parentContentHash`, `parentRevision`, `parentBlueprintHash` all required and checked |
| Stale-input checks | None (a fresh candidate has no "staleness" to check against) | Must reject a revision computed against a parent that has since changed identity/state (`stale_revision_parent`) |
| Provenance requirements | `revision: 0`, `parentCandidateId` absent | `revision = parent.revision + 1`, `parentCandidateId` present, `supersededBy`-claim protocol on the **parent** record |
| Replay rules | Content-hash-keyed replay only | Client-supplied `revisionRequestId` + content fingerprint (mirrors `reviewId`/`reviewResultFingerprint`, §5f) — a materially richer idempotency contract than ingestion needs |
| Lifecycle prerequisites | None (any well-formed file may be ingested) | Source candidate **must** be at `needs_revision`; the parent's own terminal `ReviewRecord` must exist and be readable |

A single CLI trying to serve both shapes would need every revision-only field to be conditionally required depending on a flag — exactly the kind of implicit, flag-gated branching this repository's conventions avoid (compare: `questions:review-ingest` is its own CLI, distinct from `questions:ingest`, for the same reason).

**Domain types** (`revision/types.ts`):

```ts
export interface ReviseIngestionInput {
  readonly revisionRequestId: string;      // factoryIdentifierSchema — client-supplied idempotency key, mirrors reviewId
  readonly parentCandidateId: string;
  readonly parentContentHash: string;      // must equal the parent's current CandidateProvenance.contentHash
  readonly parentRevision: number;         // must equal the parent's current CandidateProvenance.revision
  readonly parentBlueprintHash: string;    // must equal hashJson(the parent's current blueprint)
  readonly revisedContent: unknown;        // the full corrected candidate question JSON (parsed/validated downstream by structural validation, not here)
  readonly authorModel: string;            // raw declared identity string, resolved via the existing normaliseIdentity table
  readonly revisionNotes?: readonly string[]; // optional, bounded (mirrors REVIEW_MAX_FINDINGS's bound), free-text author notes
  readonly requestedAt: string;            // ISO 8601 — excluded from the fingerprint below
}

export interface SupersessionClaim {
  readonly candidateId: string;            // the accepted successor's minted id
  readonly revisionRequestId: string;      // the winning request's id
  readonly revisionFingerprint: string;    // the winning request's content fingerprint
  readonly claimedAt: string;              // ISO 8601, excluded from any comparison of this claim
}

export type ReviseOutcome =
  | { readonly status: "accepted"; readonly parentCandidateId: string; readonly candidateId: string; readonly revisionRequestId: string; readonly revision: number; readonly replayed: boolean }
  | { readonly status: "rejected"; readonly issueCode: RevisionIssueCode; readonly message: string };
```

**Revision fingerprint** (mirrors `computeReviewResultFingerprint`'s pattern exactly): `hashJson` over every content-bearing field of `ReviseIngestionInput` **except** `requestedAt` — `{parentCandidateId, parentContentHash, parentRevision, parentBlueprintHash, revisedContent, authorModel, revisionNotes}`.

**The parent-version-binding mechanism — resolved authoritatively (was open; now a firm design).** Directly applies the Mission 3B P1-2 lesson (§5f): the claim to "be the parent's canonical successor" is durable evidence embedded on the **parent's own record**, read and written atomically via the repository's existing `expectedContentHash`-guarded `update()`, never a separate index.

`ingestRevision(input, repository)` (`revision/revise.ts`, the CLI's actual logic):

1. **Schema-parse** `input` against `reviseIngestionInputSchema` (Zod). Failure → `malformed_revision_request`, no repository access.
2. **Read the parent** from `review-queue`. Not found → `unknown_parent_candidate`. Not `state === "needs_revision"` → `invalid_revision_source_state`.
3. **Binding checks** against the parent's *current* stored values (mirrors `review-ingest.ts`'s exact binding-check catalogue and ordering):
   - `input.parentContentHash !== parent.provenance.contentHash` → `stale_revision_parent`.
   - `input.parentRevision !== parent.provenance.revision` → `stale_revision_parent` (same code — both are "the caller's belief about the parent is out of date").
   - `input.parentBlueprintHash !== hashJson(parent's current blueprint)` → `revision_blueprint_mismatch` (see §7d for the exact scope of this code).
4. **Revision-limit check**: `input.parentRevision + 1 > FACTORY_THRESHOLDS.MAX_REVISIONS` → `revision_limit_exhausted`, no mutation. (Second, independent enforcement point beyond `applyTransition`'s own check, matching the contract's "fail closed as early as possible" requirement, §10 of the contract.)
5. **Material-change check**: `hashJson(input.revisedContent) === parent.provenance.contentHash` → `revision_no_material_change`, no mutation.
6. **Author identity check**: `normaliseIdentity(input.authorModel)` returns `undefined` → `unsupported_author_identity`, no mutation. (No independence check here — unlike a *reviewer*, a revision's author is not required to differ from the original generator; nothing in the contract asks for that, and requiring it would block a human author from correcting their own candidate.)
7. **Compute `revisionFingerprint`** (above).
8. **Consult the parent's `supersededBy`** (`parent.provenance.supersededBy`):
   - **Absent** → no successor claimed yet; proceed to step 9.
   - **Present, `revisionRequestId` and `revisionFingerprint` both match** → this exact request already won (an identical resubmission, or this caller's own earlier attempt landed) → skip re-claiming, proceed directly to step 10 (child creation, itself idempotent).
   - **Present, `revisionRequestId` matches but `revisionFingerprint` differs** → **`revision_request_conflict`** (the same declared request id reused with different content — mirrors `review_id_conflict` exactly). No mutation.
   - **Present, `revisionRequestId` differs** (regardless of content) → **`revision_parent_conflict`** — a different, already-accepted successor exists for this parent version. No mutation, **even if the content happens to be identical** — canonicality is decided by which *request* was accepted, not by content equality, which is what makes this "no first-wins lookup without full evidence verification, no implicit branching."
9. **Claim the parent's successor slot**: `repository.update("review-queue", parentCandidateId, {...parentRecord, provenance: {...parentRecord.provenance, supersededBy: {candidateId: newCandidateId, revisionRequestId, revisionFingerprint, claimedAt: now}}}, {expectedContentHash: hashJson(parentRecord)})`, where `newCandidateId = mintRevisionCandidateId({parentCandidateId, revisionRequestId, revisedContentHash: hashJson(input.revisedContent)})`.
   - On `state_mismatch` (a concurrent claim raced and landed first): re-read the parent fresh, return to step 8's comparison — **one bounded retry**, mirroring `MAX_APPEND_CONTENTION_RETRIES = 1` from Mission 3B P1-2. A `state_mismatch` caused by an unrelated concurrent write is retried once before giving up with `repository_error`.
10. **Create the child**: build the new `CandidateProvenance` (`parentCandidateId`, `revision = parentRevision + 1`, fresh `reviewRecords: []`, new `contentHash`), `repository.create("generated", newCandidateId, record)` — inherits ordinary ingestion's existing atomic-create/replay-on-matching-content behaviour verbatim (a byte-identical resubmission of the *same winning request* replays cleanly here too, reported `replayed: true`).

**Crash window between step 9 and step 10 (claim succeeds, child creation does not complete):** self-healing, not corruption. A retry under the *same* `revisionRequestId`/content lands on step 8's first branch (fingerprint match) and proceeds straight to step 10, completing the child. A *different* request arriving in the meantime is correctly refused at step 8 with `revision_parent_conflict` — **the claim alone is authoritative, never the child's mere existence** — explicitly tested (§11).

**CLI** (`scripts/questions-revise.mts`): single-file input, mirroring `questions:review-ingest`'s exact shape — `--request <file>` (a JSON file containing the full `ReviseIngestionInput`), `--json`, `--help`. Exit codes, mirroring `questions:review-ingest`'s precedent: `0` accepted (fresh or replay), `2` invalid arguments / malformed request / `revision_limit_exhausted` / `revision_no_material_change` / `unsupported_author_identity` / `revision_blueprint_mismatch`, `4` unknown parent, `5` conflict (`revision_request_conflict` or `revision_parent_conflict`), `1` internal error.

**Lifecycle entry state:** `needs_revision` only (parent). **The new candidate is created directly at `generated`** — no new lifecycle state or transition edge (§8).

### 7b. Pipeline runner — explicit candidate lists only

**Candidate selection — resolved authoritatively (was: "accepts an explicit list too"; now: explicit list is the *only* supported mode).** `PipelineRunRequest.candidateIds` is **required**, non-empty, and is processed in **exactly the order given** — the runner performs no sort, no discovery, no compartment scan. Determinism is the caller's obligation; the runner's obligation is to introduce none of its own. **Automatic compartment/batch discovery is explicitly deferred**, not built in Mission 3C (§4, §15).

**Domain types** (`workflow/pipeline-types.ts`):

```ts
export interface PipelineRunRequest {
  readonly pipelineRunId: string;
  readonly batchId: string;
  readonly candidateIds: readonly string[];   // REQUIRED, non-empty, caller-ordered — no auto-discovery
  readonly dryRun?: boolean;
}

export interface GateResult {
  readonly gate: "structural" | "correctness" | "semantic";
  readonly outcome: "passed" | "failed" | "quarantined";
  readonly evidenceFingerprint?: string;
}

export type PerCandidateResultKind = "advanced" | "replayed" | "not_found" | "ineligible_state" | "error";

export interface PerCandidateResult {
  readonly candidateId: string;
  readonly resultKind: PerCandidateResultKind;
  readonly startState: CandidateState | "not_found";
  readonly endState: CandidateState | "not_found";
  readonly gateResults: readonly GateResult[];
  readonly durationMs: number;
}

export interface PipelineRunReport {
  readonly pipelineRunId: string;
  readonly batchId: string;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly simulated: boolean;
  readonly candidateResults: readonly PerCandidateResult[];
  readonly summary: Readonly<Record<string, number>>;   // keyed by endState — open-ended, no schema change when 3D adds two more reachable end-states
  readonly runFingerprint: string;                        // hashJson({pipelineRunId, batchId, candidateIds}) — order-sensitive by design (§15), excludes startedAt/completedAt
}
```

**Pre-flight, whole-batch refusals** (before lock acquisition, before any candidate is touched — the *only* way one problem aborts the entire batch, per the explicit preference for candidate-isolated processing):

- `candidateIds` empty → `invalid_arguments`.
- Duplicate entries in `candidateIds` → **`pipeline_duplicate_candidate_id`** (fail closed, never silently deduplicated — consistent with "do not silently normalise malformed input").
- `candidateIds.length > FACTORY_LIMITS.MAX_CANDIDATES_PER_PIPELINE_RUN` → `pipeline_candidate_limit_exceeded`.
- Batch lock not acquired → `pipeline_batch_lock_held` or `pipeline_batch_lock_ambiguous` (§7c).

**Stage registry** (`workflow/pipeline-stages.ts`) — unchanged from the first draft, still the mechanism that resolves §2c:

```ts
interface PipelineStage {
  readonly name: "structural" | "correctness" | "semantic";
  readonly acceptsState: CandidateState;
  readonly run: (candidateId: string, repository: FactoryRepository) => Promise<GateResult & { readonly endState: CandidateState }>;
}

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { name: "structural",  acceptsState: "generated",                     run: runStructuralStage },
  { name: "correctness", acceptsState: "structural_validation_passed",  run: runCorrectnessStage },
  { name: "semantic",    acceptsState: "correctness_check_passed",      run: runSemanticStage },
];
```

Mission 3D adds two more entries to this exact array; the runner's control-flow loop needs zero changes.

**Per-candidate loop** (described, full implementation in §12):

```
(pre-flight checks above; on failure, return immediately, no lock touched)
existingReport = read "reports"/`pipeline-run-${pipelineRunId}` if present
if existingReport.runFingerprint === hashJson({pipelineRunId, batchId, candidateIds}): return existingReport   // whole-run replay short-circuit — never touches the lock for an already-completed run
lockHandle = acquireBatchLock(batchId, pipelineRunId, candidateIds, repository)   // §7c; on failure, return the refusal, no candidate touched
try:
  for each candidateId in candidateIds (exactly as given — no re-sort):
    try:
      raw = read candidate across {generated, review-queue}
      if raw undefined: append PerCandidateResult{resultKind:"not_found", startState:"not_found", endState:"not_found", gateResults:[]}; continue
      currentState = raw.state; startState = currentState
      gateResults = []
      if currentState in TERMINAL_STATES or no stage in PIPELINE_STAGES accepts currentState:
        append PerCandidateResult{resultKind:"ineligible_state", startState, endState: currentState, gateResults:[]}; continue
      while currentState is not in TERMINAL_STATES and a stage accepts currentState:
        if dryRun: compute the stage's pure decision only (no repository.update/move); append GateResult; break   // simulated — never advances real state, §11 contract requirement
        else:
          result = stage.run(candidateId, repository)   // the wrapped orchestrator's own fresh read + replay-safety applies unchanged — this is how "candidate reread before each gate" is satisfied: the runner never trusts a value it computed itself, only what the just-completed gate call itself returned
          append GateResult; currentState = result.endState
      append PerCandidateResult{resultKind: (gateResults.some(g => not replayed-on-entry) ? "advanced" : "replayed"), startState, endState: currentState, gateResults}
    catch (unexpected throw):
      append PerCandidateResult{resultKind:"error", startState, endState: startState, gateResults:[{gate: whichever was in flight, outcome:"failed"}]}   // isolated to THIS candidate only — §11 partial-failure-isolation requirement; the loop continues
finally:
  release(lockHandle)   // §7c — always runs, whether the loop completed, a candidate errored, or an unexpected exception escaped the loop itself
build summary from candidateResults' endState values
report = {...+ runFingerprint}
writeReportIfAbsent(repository, "reports", `pipeline-run-${pipelineRunId}`, report)
return report
```

**Lifecycle entry state:** any candidate at `generated`, `structural_validation_passed`, or `correctness_check_passed`. **Success state (for 3C): `semantic_review_passed`** or an allowed terminal state (`needs_revision | rejected | quarantined`). Compartment movement entirely delegated to the wrapped gates.

### 7c. Batch lock — standalone, narrow, atomic

**Not added to `FactoryRepository`.** A sibling utility, `workflow/pipeline-batch-lock.ts`, reusing the exact `fs.open(path, "wx")` (`O_CREAT|O_EXCL`) primitive `FsFactoryRepository`'s own `.locks/` already uses (§5d), so the atomicity guarantee is identical and independently already proven.

**Lock location:** `.pipeline-locks/<batchId>.lock` (sibling directory to `.locks/`, same workspace root).

**Lock schema** (the file's JSON content — richer than `.locks/`'s bare `LockPayload`, specifically so a stale-lock diagnostic has something to report):

```ts
export interface PipelineBatchLockRecord {
  readonly batchId: string;
  readonly pipelineRunId: string;             // the invocation that acquired it
  readonly batchFingerprint: string;          // hashJson({batchId, candidateIds}) — pins exactly which candidate set this lock covers
  readonly ownerToken: string;                // randomUUID(), mirrors FsFactoryRepository's LockPayload.token — only the presenting owner may release
  readonly ownerPid: number;                  // process.pid — diagnostic only, never used to infer liveness
  readonly acquiredAt: string;                // ISO 8601
  readonly candidateIds: readonly string[];   // the exact scope this run claims
}
```

**Acquisition rules:**

1. `fs.open(lockPath, "wx")`; on success, write the `PipelineBatchLockRecord` immediately, close, return `{ ok: true, handle: { ownerToken } }`.
2. On `EEXIST`, bounded poll-retry (mirrors `.locks/`'s `lockMaxWaitMs`/`lockRetryDelayMs`) — a fast-releasing concurrent run does not spuriously fail a fresh one.
3. If still held when the poll window expires, **read the existing lock's content** and classify:
   - `now - acquiredAt < FACTORY_LIMITS.PIPELINE_LOCK_STALE_AGE_MS` (new limit, proposed 30 minutes — generous headroom for a large real batch) → **`pipeline_batch_lock_held`**: ordinary contention, retry-worthy, message includes `batchId`/`pipelineRunId` of the current holder.
   - `now - acquiredAt >= PIPELINE_LOCK_STALE_AGE_MS` → **`pipeline_batch_lock_held_ambiguous`** (typed, richer diagnostic — §7d/§8 below).
4. **Never deletes, overwrites, or "steals" the existing lock file in either case.** Acquisition either succeeds cleanly (step 1) or fails closed (steps 3a/3b) — there is no third path.

**Release rules:** `release(handle)` reads the lock file back, compares `ownerToken`; only an exact match deletes the file (mirrors `.locks/`'s `releaseLock` token check exactly). Called in a `finally` block wrapping the *entire* per-batch execution — the normal-completion path, every per-candidate error (already isolated inside its own try/catch, §7b), and the report-write step — so the lock is released whenever the process itself survives to run the `finally` block. The only way it is *not* released is the process being killed outright (SIGKILL, power loss) before `finally` runs — precisely the scenario §8 (stale-lock handling) exists for.

**Identical-run replay behaviour:** a matching `runFingerprint` on an already-completed `PipelineRunReport` short-circuits **before** lock acquisition is even attempted (§7b's loop pseudocode) — the common "safe replay of an already-completed run" case never contends for the lock at all.

**Conflicting-batch behaviour:** two different `pipelineRunId`s (or the same `pipelineRunId` with a differing candidate list — a `batchFingerprint` mismatch, itself worth a distinct diagnostic, `pipeline_run_id_conflict`) targeting the same `batchId` concurrently → the second acquisition attempt fails closed per the rules above, never silently interleaved.

### 7d. `revision_blueprint_mismatch` — exact emission scope

**Emitted exactly once, at step 3 of `ingestRevision` (§7a):** when the revise request's declared `parentBlueprintHash` does not equal `hashJson` of the parent's **current** bound blueprint. This is an **identity-binding** check only — "is the revision still targeting the exact blueprint its parent's review findings were written against" — not a deep content-vs-constraint check.

**What this code deliberately does *not* cover:** whether the *revised content itself* (its declared cohort/subject/exam style/skill, marks, question type, etc.) actually still conforms to that blueprint's constraints. That is exactly what **structural validation already checks** (`validation/taxonomy-checks.ts`, `registry-checks.ts`, `checkAgainstProductionSchema`) — and the revised candidate necessarily passes through that same, already-audited gate fresh, because it re-enters at `generated` and runs the complete pipeline again (§10 of the contract's explicit "full pipeline rerun" requirement). Duplicating that check at ingestion time would re-implement logic that already exists, runs moments later regardless, and is independently audited — a needless, unprecedented expansion of this plan's surface. If a revision silently drifts to a different skill/subject/exam-style than its blueprint declares, structural validation's existing checks catch it as an ordinary `structural_validation` failure, exactly as they would for any other candidate.

**Outcome class:** **rejection (request failure)**, never quarantine. Quarantine is reserved for "the gate cannot decide about an *existing* candidate record" — this is a **pre-creation input-validation refusal**: no candidate record exists yet to quarantine. **Fail-closed, before any mutation** — `revision_blueprint_mismatch` is checked (step 3) before the revision-limit check, before the material-change check, before the parent's `supersededBy` is even consulted, and strictly before either the parent-claim `update()` or the child `create()` — exactly the "prefer fail-closed rejection before creating a new revision record" requirement.

---

## 8. Stale or orphaned locks — explicit, typed, never auto-resolved

Mission 3C ships **no** `--release-abandoned-batch-lock` CLI (deferred to Mission 3E's reconciliation tooling, §4). This section defines what happens instead — a design requirement, not merely an accepted gap.

**No arbitrary timeout ever steals a lock.** §7c's acquisition rules never delete or overwrite an existing lock file under any circumstance. `PIPELINE_LOCK_STALE_AGE_MS` is used **only** to choose which of two typed refusals to return — it never triggers deletion, reassignment, or a retry-with-force.

**Typed diagnostic failure — `pipeline_batch_lock_held_ambiguous`:**

```ts
export interface PipelineBatchLockAmbiguousDiagnostic {
  readonly issueCode: "pipeline_batch_lock_held_ambiguous";
  readonly batchId: string;
  readonly holder: {
    readonly pipelineRunId: string;
    readonly ownerPid: number;
    readonly acquiredAt: string;
    readonly ageMs: number;
    readonly candidateIds: readonly string[];
  };
  readonly message: string;   // includes the manual recovery procedure below, verbatim, so an operator never has to look it up separately
}
```

**No pipeline execution while lock ownership is unresolved.** Both `pipeline_batch_lock_held` and `pipeline_batch_lock_held_ambiguous` refuse to run — there is no "proceed anyway" flag, no force-acquire mode, no partial-batch fallback. This is a hard refusal, `runPipeline` returns without touching any candidate.

**Documented manual filesystem recovery procedure (for the delivery report and, eventually, an operator runbook):**

1. Confirm no `questions:pipeline` process for this `batchId` is actually still running (check the process list for `ownerPid` — informational only, since a PID can be reused by an unrelated process after the original exits; never treat "PID not found" as proof of death, and never treat "PID found" as proof of life for a *different* machine/container).
2. If genuinely abandoned, manually delete `.pipeline-locks/<batchId>.lock` from the workspace root.
3. Re-invoke `questions:pipeline` with the same or a new `pipelineRunId` — a fresh acquisition succeeds normally.
4. If uncertain, do **not** delete the lock file — file it as an operational incident and wait, or contact whoever owns the invocation recorded in the diagnostic.

**Future CLI recovery support — explicitly deferred, not built here:** a `questions:pipeline --release-abandoned-lock <batchId>` command, requiring an explicit `--confirm` flag and printing the exact same diagnostic before acting, is the natural Mission 3E deliverable (alongside `.locks/`'s own equivalent, already a known gap per `01-mission3-implementation-contract.md`'s reconciliation contract, §18). Recorded here so it is not forgotten, not built now.

---

## 9. Lifecycle and compartment transitions

**No new `CandidateState`, no new `TRANSITION_TABLE` edge, no new `FactoryCompartment`, no new `RejectionGate` entry.** The only schema change anywhere in this plan is the additive `supersededBy?: SupersessionClaim` field on `CandidateProvenance` (§7a) — evidence, not a lifecycle concept.

| Transition | Driven by (existing, unmodified) | New in Mission 3C? |
|---|---|---|
| `generated → structural_validation_passed \| needs_revision \| rejected \| quarantined` | `orchestrateStructuralValidation` | No — only a new caller (pipeline runner) |
| `structural_validation_passed → correctness_check_passed \| ...` | `orchestrateCorrectnessVerification` | No — only a new caller |
| `correctness_check_passed → semantic_review_passed \| ...` | `attemptSemanticReviewTransition` | No — only a new caller |
| *(implicit)* `needs_revision → generated` (a new, linked candidate, not a `TRANSITION_TABLE` edge — per contract §10's explicit note) | `revision/revise.ts`'s `ingestRevision` (new) | **Yes — the one genuinely new production capability** |

---

## 10. Revision identity and lifecycle model

**Model chosen: a new candidate ID, linked to the parent — never in-place mutation, never a shared logical identity.** Justified directly from the existing repository contracts, not invented for this plan:

- `CandidateProvenance.parentCandidateId`/`.revision` are already schema-present (`provenance/candidate-provenance.ts:13,32`) as a **linkage pair**, not a version-tag-on-a-shared-identity pair — the schema itself already encodes "the new record points at an old one," not "the old record's identity is reused."
- Every existing gate report (`sv-<hash(candidateId)>`, `cv-<hash(candidateId)>`) and the review chain itself are keyed by `candidateId` and are **immutable once created** — an in-place identity change on revision would either silently orphan the parent's own historical reports/reviews or force a fingerprint collision between two logically distinct evidence sets under one id. A new, distinct id keeps every existing report/chain-keying convention untouched.
- The contract's own explicit design note (§10, `01-mission3-implementation-contract.md:437`): *"New candidate ID policy: freshly minted... never a mutation of the parent's ID — the parent record is untouched and remains queryable at its terminal `needs_revision` state forever."*
- This is also what "no alteration of approved evidence" (a stated governance invariant across all of Mission 3) structurally requires: the parent's own `ReviewRecord` chain, structural/correctness reports, and terminal state are never rewritten by a revision — they remain a permanent, queryable historical record of "what was wrong and why," and the *only* mutation the parent record ever undergoes is the additive `supersededBy` stamp (§7a), itself append-only in spirit (set once, per parent, never overwritten by a different claim).

**Eligible entry states — exact:**

- Revision request (`questions:revise`) source: `needs_revision` **only**. Any other state → `invalid_revision_source_state`.
- New candidate's entry point: `generated` **only**, via `repository.create("generated", ...)` — identical compartment/state pairing as ordinary ingestion.

**What this design structurally prevents (each cross-referenced to the mechanism that prevents it, not merely asserted):**

- **Revision of stale content** — §7a step 3's `stale_revision_parent` check: the request must declare the parent's *current* `contentHash`/`revision`, checked against live stored values, exactly mirroring `review-ingest.ts`'s `stale_review_revision` precedent.
- **Revision based on superseded review evidence** — the revision-prompt content (findings/recommendedCorrections a human or generator uses to *write* the revised candidate) is sourced from the parent's own terminal `ReviewRecord`, itself part of the tamper-evident chain `verifyReviewChain` already protects; nothing in this plan introduces a second, competing source of "what needs fixing."
- **Bypass of structural validation after revision** — structurally impossible by construction: the new candidate always enters at `generated`, and `PIPELINE_STAGES`'/any manual CLI's own precondition checks (`acceptsState`) are the sole gate-ordering authority; there is no code path in this plan that ever calls `orchestrateCorrectnessVerification` or `attemptSemanticReviewTransition` against a candidate still at `generated`.
- **Retention of obsolete correctness/semantic-pass evidence on changed content** — the new candidate is a **brand-new `candidateId`** with `reviewRecords: []` and no structural/correctness report existing under its own id yet — it inherits zero evidence from the parent, by construction, not by a filtering step that could have a bug.

---

## 11. Divergent concurrent revisions — resolved authoritatively

**Two divergent revisions against the same parent version may never both become canonical.** This reverses the first draft's position (which allowed both to succeed as independent siblings) per explicit direction.

**Mechanism:** §7a's `SupersessionClaim` protocol — optimistic concurrency (`expectedContentHash`-guarded `repository.update()` on the *parent*) plus parent-version binding (`parentContentHash`/`parentRevision` re-checked against live state before any claim is attempted).

**Exact outcomes:**

| Scenario | Outcome |
|---|---|
| Identical `revisionRequestId` + identical `revisionFingerprint`, resubmitted (including a genuine race where both calls are, in fact, the same logical request retried) | **Replay** — `status: "accepted", replayed: true`, no new mutation |
| Identical `revisionRequestId`, **different** `revisionFingerprint` | **`revision_request_conflict`** — the same declared request id was reused with different content; refused, no mutation |
| **Different** `revisionRequestId` against a parent whose `supersededBy` is already claimed by a different request (any content) | **`revision_parent_conflict`** — refused, no mutation, regardless of whether the content happens to coincide |
| **Different** `revisionRequestId` against a parent with **no** existing claim | The first to durably land via `expectedContentHash`-guarded `update()` wins the claim; the loser (its `update()` fails `state_mismatch`) re-reads and is re-evaluated against the row above — **never a blind "first write to the filesystem wins"** |

**"No first-wins lookup without full evidence verification"** is satisfied because every conflict decision re-reads the parent's *actual current stored* `supersededBy` value and compares it field-by-field — never a bare existence check, never trusting an in-memory belief from before the `update()` attempt.

**"No implicit branching revision graph"** is satisfied structurally: `supersededBy` is a single optional field, not a list — a parent can have at most one recorded successor, ever, enforced by the schema shape itself, not by application-level counting.

**If revision branching is ever genuinely required** (e.g. two independent editorial teams intentionally wanting to explore divergent fixes for the same defect before picking one), that is explicitly **out of scope for Mission 3C** and would need its own separately designed capability (a `supersededBy` list, an explicit "revision proposal" review/selection step, etc.) — not silently enabled by this plan's absence of a check.

---

## 12. Evidence and fingerprint design

| Artefact | Schema | Persisted where | Fingerprint excludes | Replay rule |
|---|---|---|---|---|
| `SupersessionClaim` | `provenance/candidate-provenance.ts` (additive field on `CandidateProvenance`) | the **parent's own** provenance, in `review-queue` | `claimedAt` | see §11's table — the authoritative replay/conflict mechanism for revision itself |
| Revision linkage | `CandidateProvenance.parentCandidateId`/`.revision` (existing fields, populated for the first time) | the new candidate's own provenance, in `generated` | n/a | identity is the new candidate's deterministic `rev-` id, itself derived from `(parentCandidateId, revisionRequestId, revisedContentHash)` |
| `PipelineRunReport` | `workflow/pipeline-types.ts` (new) | `reports` compartment, id `pipeline-run-<pipelineRunId>` | `startedAt`, `completedAt` | matching `runFingerprint` (over `pipelineRunId`+`batchId`+`candidateIds`, **order-sensitive**, §7b) → safe replay; differing → `pipeline_run_id_conflict` |
| `PipelineBatchLockRecord` | `workflow/pipeline-batch-lock.ts` (new) | `.pipeline-locks/<batchId>.lock`, filesystem only, never in `reports` | n/a — not a fingerprinted evidence artefact, a transient lock | never replayed — released on completion or diagnosed as ambiguous if orphaned (§8) |
| Per-candidate gate evidence | unchanged — `StructuralValidationEvidence`/`CorrectnessVerificationEvidence`/`ReviewRecord` chain, all pre-existing | unchanged | unchanged | unchanged — the runner calls the existing orchestrators verbatim |

No new evidence schema is introduced for the revision *content* itself, matching the contract's explicit statement (§10): *"no new evidence schema; the new candidate's own `CandidateProvenance.revision`/`parentCandidateId` fields are the revision record."* `SupersessionClaim` is the one necessary, minimal addition beyond that statement — required specifically to make "at most one canonical successor" enforceable (§11), which the original contract text did not anticipate needing to guard against.

---

## 13. Replay, concurrency and crash-recovery design

### 13a. Revision ingestion

- **Identical resubmission**: §11's replay row.
- **Divergent concurrent revisions**: §11's conflict rows — no longer both-succeed (reversed from the first draft).
- **Crash mid-claim** (parent `update()` fails or the process dies before it completes): no mutation landed at all (the repository's atomic-write discipline, unmodified) — a retry re-attempts cleanly from step 2.
- **Crash between claim and child creation**: §7a's explicit self-healing description — a same-request retry completes the child; a different request is correctly refused.

### 13b. Pipeline runner

- **Whole-run replay**: matching `runFingerprint` short-circuits before lock acquisition (§7b/§7c).
- **Per-candidate replay-within-a-run**: no new mechanism — inherited from each wrapped gate's own state-based short-circuit; the runner's loop naturally no-ops past an already-advanced candidate because no stage accepts its current (already-later) state.
- **Crash mid-batch**: each gate transition is its own atomic `update`/`move` call; a crash between candidate *N* and *N+1* leaves 1..*N* durably advanced. Re-invoking with the same `pipelineRunId`/candidate list resumes correctly — no separate "resume pointer" bookkeeping needed.
- **Crash mid-gate** (e.g. a candidate's semantic-transition write fails after its review-append write already landed): entirely inherited from Mission 3B P1-2's chain-resident idempotency — the runner adds no new crash window here. This is exactly what §14's Mission 3B P2 debt remediation test is designed to prove end-to-end.
- **Batch-lock crash**: §8 — never auto-stolen, typed diagnostic, documented manual recovery.

---

## 14. Test matrix

All new tests live under `src/tests/unit/question-factory/`, Vitest, following the established patterns from §5f. No sleeps, no timing-based coordination, no mocking library.

| Category | Test file (new) | Representative cases |
|---|---|---|
| Pure contract behaviour | `revision-identity.test.ts` | `mintRevisionCandidateId` determinism (same inputs → same id); distinct ids for distinct `revisionRequestId`s against the same parent |
| Pure contract behaviour | `pipeline-stages.test.ts` | Stage registry is exactly `[structural, correctness, semantic]`; each `acceptsState` matches the wrapped gate's real entry precondition |
| Orchestration | `revision-ingest.test.ts` | Happy path (needs_revision parent → `questions:revise` → new candidate at `generated` with correct `parentCandidateId`/`revision`/content hash and the parent's `supersededBy` correctly stamped); `invalid_revision_source_state`; `stale_revision_parent`; `revision_blueprint_mismatch`; `revision_no_material_change`; `revision_limit_exhausted`; `unsupported_author_identity` |
| Lifecycle | `mission3c-integration.test.ts` | A fixture candidate failing structural, correctness, and semantic review in turn each reaches `needs_revision`, is revised via `questions:revise`, and the **revised** candidate passes the same gate that rejected its parent, proving "same gates catch the same defect" |
| Replay | `revision-ingest.test.ts` | Identical `revisionRequestId`+content resubmission replays without a duplicate candidate or a duplicate claim |
| Replay | `pipeline-runner.test.ts` | Identical `runPipeline` resubmission (same `pipelineRunId`, same ordered candidate list) replays the whole `PipelineRunReport` without touching the lock or re-running any gate |
| Concurrent identical calls | `revision-ingest-crash-safety.test.ts` | Two concurrent identical revision resubmissions → exactly one candidate created, the other reports `replayed: true` |
| Concurrent conflicting calls | `revision-ingest-crash-safety.test.ts` | Two concurrent **divergent** revisions (different `revisionRequestId`, different content) of the same parent → exactly one succeeds, the other returns `revision_parent_conflict`, parent's `supersededBy` unambiguously points at the winner — **the reversed behaviour from the first draft, explicitly tested** |
| Concurrent conflicting calls | `revision-ingest-crash-safety.test.ts` | Same `revisionRequestId`, different content, submitted twice → second call returns `revision_request_conflict` |
| Concurrent conflicting calls | `pipeline-runner.test.ts` | Two concurrent `runPipeline` calls with the same `batchId` but different `pipelineRunId`s → one acquires the batch lock, the other observes `pipeline_batch_lock_held`, neither double-processes a candidate |
| Stale evidence | `revision-ingest.test.ts` | Declared `parentContentHash`/`parentRevision` no longer matching the parent's current stored values → `stale_revision_parent` |
| Crash windows | `revision-ingest-crash-safety.test.ts` | Fault injected into the parent-claim `update()` call → zero mutation, clean retry succeeds; fault injected *after* a successful claim but *before* child creation → same-request retry self-heals (§7a), a differing concurrent request during the gap is correctly refused |
| Crash windows | `pipeline-runner-crash-safety.test.ts` | Fault injected into a specific later `update()` call within one candidate's semantic-transition stage (adapting `buildUpdateFailingOnCall`) → that candidate reported incomplete, every sibling candidate unaffected; same-`pipelineRunId` retry completes the missing transition without duplicating the review record |
| **Crash windows — Mission 3B P2 debt remediation** | `pipeline-runner-crash-safety.test.ts` | **The specific test the task calls out — full description in §14a below** |
| Invalid compartment state | `revision-ingest.test.ts` | `questions:revise` against a candidate at any state but `needs_revision` → refused, no mutation |
| Invalid compartment state | `pipeline-runner.test.ts` | A `candidateIds` entry that does not exist (`not_found`) or is already terminal (`ineligible_state`) → distinct, correctly classified per-candidate results, batch continues |
| Malformed persisted evidence | `pipeline-runner.test.ts` | One candidate's stored `provenance`/`question` hand-corrupted mid-batch → isolated to that candidate's `error`-kind result, siblings unaffected |
| Batch integrity (whole-batch refusal) | `pipeline-runner.test.ts` | Duplicate candidate ids in the request list → `pipeline_duplicate_candidate_id`, no lock acquired, no candidate touched; candidate count over `MAX_CANDIDATES_PER_PIPELINE_RUN` → `pipeline_candidate_limit_exceeded` |
| Stale/orphaned lock | `pipeline-batch-lock.test.ts` | A lock file younger than `PIPELINE_LOCK_STALE_AGE_MS` → `pipeline_batch_lock_held`; older → `pipeline_batch_lock_held_ambiguous` with full diagnostic (`holder.pipelineRunId`/`ownerPid`/`acquiredAt`/`ageMs`); **neither ever deletes or overwrites the lock file** — asserted directly by checking the file still exists, byte-identical, after the refused call |
| Full production-path integration | `mission3c-integration.test.ts` | Every scenario begins with a real `runManualIngestion` call — never a direct `repository.create` seed at an intermediate state; includes one full batch run across five fixture candidates via a single `runPipeline` call with an explicit ordered candidate list |
| CLI subprocess behaviour | `cli-questions-revise.test.ts` | Help, missing arg, malformed request file, unknown parent, wrong-state parent, happy path (+`--json`), `revision_request_conflict`, `revision_parent_conflict` |
| CLI subprocess behaviour | `cli-questions-pipeline.test.ts` | Help, missing required args (including a missing/empty `--candidate-ids`, which is now mandatory), duplicate candidate ids, dry-run (`simulated: true`, zero real mutation), `--json`, exit-3-on-partial-batch, exit-9-on-lock-held, ambiguous-lock diagnostic surfaced verbatim in `--json` output |
| Legacy compatibility | `provenance.test.ts` (extended) | A pre-Mission-3C-shaped `CandidateProvenance` (`revision: 0`, no `parentCandidateId`, no `supersededBy`) continues to parse/validate identically — the new field is additive-only |
| Legacy compatibility | `pipeline-runner.test.ts` | A batch of only Mission-3B-shaped candidates (no revisions at all) processed by `runPipeline` produces results identical to manually invoking the three gates in sequence |

### 14a. Mission 3B P2 debt remediation test — full description

Retained and made precise, per the explicit ten-point specification:

1. **Starts from real ingestion** — `runManualIngestion` (the actual `questions:ingest` behaviour), seeding a fixture candidate whose content is `semantic_objective`- or `manual_review_writing`-classified (so an independent review is genuinely required, not auto-cleared).
2. **Runs structural validation** — via `runPipeline`'s first registered stage, not a direct `orchestrateStructuralValidation` call.
3. **Runs correctness verification** — via `runPipeline`'s second stage, reaching `correctness_check_passed`/`passed_pending_semantic_review` through the real gate, never seeded.
4. **Reaches the legitimate semantic-review prerequisite** — the candidate is now genuinely at `correctness_check_passed`, eligible for review ingestion, exactly as it would be in production.
5. **Appends semantic-review evidence** — a real `ingestExternalReview` call (independent reviewer identity, sufficient confidence/evidence) durably appends a `ReviewRecord` to the chain.
6. **Injects failure during the semantic lifecycle transition** — a fault-injecting repository wrapper (adapting `buildUpdateFailingOnCall`, §5f) fails specifically the `update()` call `attemptSemanticReviewTransition` issues to stamp `state: "semantic_review_passed"`, *after* the review-append write has already durably landed. `runPipeline`'s third stage is what triggers this call — the fault is reached through the pipeline runner's own production entry point, not a direct unit call to `attemptSemanticReviewTransition`.
7. **Retries through `runPipeline`** — a second `runPipeline` invocation, same `pipelineRunId`, same candidate list, against the real (no-longer-failing) repository.
8. **Proves no duplicate review append** — asserts `provenance.reviewRecords.length === 1` both immediately after the injected failure (proving the append landed *before* the injected failure, independently of it) and after the successful retry (proving the retry did not append a second record).
9. **Completes the missing transition** — the retry's `GateResult` for the semantic stage reports `outcome: "passed"`, not a repeat of the failure.
10. **Confirms final state and compartment** — `state === "semantic_review_passed"` and the candidate is readable from `review-queue` (never misrouted to `quarantined`/`rejected/semantic`), matching the exact assertions Mission 3B's own crash-safety test made for the unit-level case, now proven at the full-pipeline level.

**Does not directly seed `correctness_check_passed`** — every state the candidate passes through is produced by a real gate call, driven by `runPipeline`, starting from `runManualIngestion`. This is the literal, concrete closure of the Mission 3B P2 accepted debt: *"crash-recovery fault injection does not itself traverse the complete ingestion, structural-validation and correctness pipeline."*

---

## 15. What changed from the first draft, and why

| # | First draft | This revision | Reason |
|---|---|---|---|
| 1 | Pipeline runner's stopping point was "resolved... flagged for sign-off" | **Firmly resolved**: stops at `semantic_review_passed`, originality/difficulty/staging/publication are unconditionally Mission 3D's | Explicit direction; removes the last ambiguity from §2c |
| 2 | Revision re-entry extended `questions:ingest`/`manual-ingestion/` | **Withdrawn.** Dedicated `revision/` module + `questions:revise` CLI, `manual-ingestion/` untouched | Explicit direction citing six concrete semantic differences (§7a's table) between initial ingestion and revision |
| 3 | Batch lock: standalone vs. `FactoryRepository` interface — flagged as a choice | **Firmly resolved: standalone**, `workflow/pipeline-batch-lock.ts`, full schema now specified (§7c) | Explicit direction confirmed the standalone approach; this revision adds the schema/acquisition/release detail the first draft only sketched |
| 4 | Abandoned-lock handling was an "accepted interim limitation," briefly noted | **Fully specified**: typed `pipeline_batch_lock_held_ambiguous` diagnostic, no auto-steal ever, documented manual recovery, future CLI listed as deferred (§8) | Explicit direction — a limitation needed a real design, not just an acknowledgement |
| 5 | `revision_blueprint_mismatch` semantics were implied, not stated precisely | **Exact scope defined** (§7d): identity-binding only, never a duplicate content-vs-constraint checker; rejection, fail-closed, before any mutation | Explicit direction to define exactly when it fires and its outcome class |
| 6 | Pipeline candidate selection supported both explicit list and auto-discovery ("implement both") | **Explicit list only.** Auto-discovery removed from this increment entirely, listed as deferred (§7b, §4) | Explicit direction — auto-discovery's non-determinism risk (flagged as an open question in the first draft) is avoided by not building it yet |
| 7 | Divergent concurrent revisions against the same parent were designed to **both succeed** as independent siblings | **Reversed.** At most one canonical successor per parent version, enforced by `SupersessionClaim` optimistic concurrency (§11) | Explicit direction — the first draft's "no mutual exclusion is required" reading is overridden |

---

## 16. File-level implementation plan

| File | Action | Purpose |
|---|---|---|
| `src/features/question-factory/revision/types.ts` | Create | `ReviseIngestionInput`, `SupersessionClaim`, `ReviseOutcome`, failure-reason types |
| `src/features/question-factory/revision/revise.ts` | Create | `ingestRevision` (impure orchestrator, §7a's ten-step sequence) |
| `src/features/question-factory/revision/identity.ts` | Create | `mintRevisionCandidateId` (pure, deterministic, `rev-` prefix) |
| `src/features/question-factory/revision/index.ts` | Create | Barrel |
| `src/features/question-factory/provenance/candidate-provenance.ts` | Modify (additive) | New optional `supersededBy?: SupersessionClaim` field + Zod shape |
| `src/features/question-factory/workflow/pipeline-types.ts` | Create | `PipelineRunRequest`, `PipelineRunReport`, `PerCandidateResult`, `GateResult` |
| `src/features/question-factory/workflow/pipeline-stages.ts` | Create | `PIPELINE_STAGES` registry + three `run*Stage` adapters |
| `src/features/question-factory/workflow/pipeline-batch-lock.ts` | Create | `acquireBatchLock`/`release`, `.pipeline-locks/` primitive, stale-lock diagnostic |
| `src/features/question-factory/workflow/pipeline-runner.ts` | Create | `runPipeline` |
| `src/features/question-factory/workflow/index.ts` | Modify (additive) | Export `runPipeline` + pipeline types |
| `src/features/question-factory/config/mission3c-issue-codes.ts` | Create | `REVISION_ISSUE_CODES`, `PIPELINE_ISSUE_CODES`, unioned `MISSION_3C_ISSUE_CODES` |
| `src/features/question-factory/config/limits.ts` | Modify (additive) | `PIPELINE_LOCK_STALE_AGE_MS` |
| `src/features/question-factory/config/index.ts` | Modify (additive) | Re-export Mission 3C issue codes |
| `src/features/question-factory/index.ts` | Modify (additive) | Export `revision/` barrel |
| `scripts/questions-revise.mts` | Create | CLI, mirrors `questions-review-ingest.mts`'s single-file-input shape |
| `scripts/questions-pipeline.mts` | Create | CLI, batch runner front end, mandatory `--candidate-ids` |
| `package.json` | Modify (additive) | `questions:revise`, `questions:pipeline` npm scripts |
| `src/tests/unit/question-factory/revision-identity.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/pipeline-stages.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/revision-ingest.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/revision-ingest-crash-safety.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/pipeline-runner.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/pipeline-runner-crash-safety.test.ts` | Create | Per §14, includes §14a's Mission 3B P2 debt remediation test |
| `src/tests/unit/question-factory/pipeline-batch-lock.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/mission3c-integration.test.ts` | Create | Full production-path integration, per §14 |
| `src/tests/unit/question-factory/cli-questions-revise.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/cli-questions-pipeline.test.ts` | Create | Per §14 |
| `src/tests/unit/question-factory/provenance.test.ts` | Modify (additive) | Legacy-compatibility case for `supersededBy` |
| `docs/reports/mission3-production/05-mission3c-revision-pipeline.md` | Modify (this document) | Update `Status:` from PLANNING to IMPLEMENTED once delivered |

**Explicitly not touched:** `src/content/`, the 100-question production bank, `manual-ingestion/` (any file), `scripts/questions-ingest.mts`, `workflow/states.ts`, `workflow/transitions.ts`, `storage/compartments.ts`, `storage/state-compartment-mapping.ts`, `storage/factory-repository.ts` (the interface itself), any Mission 1/2/3A/3B test file beyond the one narrow additive extension listed above, any `originality/`/`difficulty/`/`publication/` module.

---

## 17. Commit plan (for the eventual implementation — not executed now)

1. `feat: add candidate revision workflow` — `revision/` module, `provenance/candidate-provenance.ts`'s additive `supersededBy` field, `mission3c-issue-codes.ts` (revision codes), `questions:revise`.
2. `feat: add pipeline-runner batch orchestration` — `workflow/pipeline-*.ts`, `mission3c-issue-codes.ts` (pipeline + lock codes), `questions:pipeline`.
3. `test: cover revision workflow and pipeline-runner behaviour` — every test file in §16, including §14a's full-pipeline crash-window test.
4. `docs: record Mission 3C revision and pipeline-runner delivery` — update this document's `Status:` line, add delivery-detail sections mirroring `04-mission3b-semantic-review.md`'s structure.

None of the above four commits is made by this task. This planning-document revision itself is committed separately (§20).

---

## 18. Mandatory validation plan (for the eventual implementation, not run now)

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

Expected unchanged residual state: exactly two moderate Next/PostCSS advisories; exactly 100 production questions, 15 showcase fixtures; `src/content/` untouched.

**Freeze and independent-audit boundary:** identical governance shape to Mission 3A→3B — the implementation increment is frozen at a single SHA after the four commits in §17 land, and Mission 3D must not start until an independent Codex audit returns an approval verdict.

---

## 19. Remaining lower-stakes items (not blocking implementation approval)

Unlike the first draft's seven open architecture questions (all now resolved, §15), these are narrower implementation details that may be settled during implementation without requiring a further planning round:

1. Exact `PIPELINE_LOCK_STALE_AGE_MS` value (proposed 30 minutes, §7c) — tunable based on real batch-processing time observed once the runner exists.
2. Whether `revisionNotes`' bound should mirror `REVIEW_MAX_FINDINGS` (15) exactly or have its own limit — low-stakes, either is defensible.
3. Whether `PerCandidateResult.resultKind: "advanced"` needs finer-grained sub-classification (e.g. distinguishing "advanced one stage" from "advanced through all three") for reporting UX — not required by any test or acceptance criterion, a pure reporting-quality nicety.

---

## 20. Explicit acceptance criteria

1. **Dedicated revision CLI and contract**: `questions:revise` exists as its own command, independent of `questions:ingest`; `manual-ingestion/` is unmodified by this delivery.
2. **Immutable parent evidence**: a parent's `ReviewRecord` chain, structural/correctness reports, and terminal `needs_revision` state are never rewritten by a revision; the only mutation the parent record ever undergoes is the additive `supersededBy` stamp, set at most once.
3. **Deterministic revision replay**: an identical `revisionRequestId` + identical content resubmission always replays cleanly, no duplicate candidate, no duplicate claim.
4. **Stale and divergent revision rejection**: a revision declaring an out-of-date parent binding is refused (`stale_revision_parent`); a revision whose declared blueprint binding no longer matches the parent's is refused (`revision_blueprint_mismatch`); a differently-requested revision against an already-claimed parent version is refused (`revision_parent_conflict`); a reused request id with different content is refused (`revision_request_conflict`).
5. **No competing canonical child revisions**: for any given parent, at most one candidate is ever recorded as its accepted successor — directly tested via concurrent divergent submissions (§14).
6. **Explicit-list pipeline execution**: `runPipeline` refuses to run without a non-empty, explicit `candidateIds` list; no code path performs compartment/batch auto-discovery.
7. **Atomic batch locking**: `.pipeline-locks/<batchId>.lock` acquisition is atomic (`O_CREAT|O_EXCL`); release always occurs in a `finally` block covering both normal completion and every handled failure path.
8. **Orphan-lock fail-closed behaviour**: an aged lock produces a typed `pipeline_batch_lock_held_ambiguous` diagnostic carrying holder/timestamp/age information; no execution proceeds while ownership is unresolved; no code path ever deletes or overwrites another invocation's lock file.
9. **Execution stopping at `semantic_review_passed`**: `PIPELINE_STAGES` contains exactly three entries (structural, correctness, semantic); no code path in this delivery reaches `originality_review_passed`, `difficulty_review_passed`, `staged`, or `published`.
10. **No originality, difficulty, staging or publication work**: zero files under `originality/`, `difficulty/`, `publication/`, `staged`-writing, or `questions:stage`/`questions:publish` are created or modified.
11. **Full production-path integration tests**: every integration scenario begins with a real `runManualIngestion`/`questions:ingest`-equivalent call; the Mission 3B P2 debt remediation test (§14a) is present and passing.
12. **No direct state seeding**: no test seeds an intermediate lifecycle state (`correctness_check_passed`, `needs_revision`, etc.) via a direct `repository.create`/`repository.update` call in place of running the real gate that produces it.
13. **State and compartment integrity**: every candidate this delivery touches ends in a state whose stored `state` field and physical compartment agree with `compartmentForState`, verified by the test matrix (§14).
14. **No production content changes**: the 100-question production bank and `src/content/` are byte-identical before and after the branch's diff.

---

## 21. Codex audit checklist

- [ ] `PIPELINE_STAGES` contains exactly `[structural, correctness, semantic]` — no originality/difficulty stage exists, stubbed or otherwise.
- [ ] Negative-space grep: zero production call sites reach `originality_review_passed`, `difficulty_review_passed`, `staged`, or `published`.
- [ ] `manual-ingestion/` and `scripts/questions-ingest.mts` are byte-identical to the approved Mission 3B baseline.
- [ ] `SupersessionClaim` is set on a parent record at most once; every conflict/replay decision re-reads the parent's live stored value, never a cached or assumed one.
- [ ] Two concurrent, divergent revision requests against the same parent never both result in a created, non-conflicting child candidate.
- [ ] `revision_blueprint_mismatch` is emitted only for the identity-binding case (§7d); no duplicate content-vs-blueprint-constraint checker exists outside structural validation.
- [ ] Revision-limit enforcement holds independently at both `ingestRevision`'s own check (step 4, §7a) and `applyTransition`'s pre-existing check.
- [ ] `PipelineRunRequest.candidateIds` is required and non-empty at the type level; no discovery-by-compartment code path exists anywhere in this delivery.
- [ ] Batch-lock acquisition is verifiably atomic (`O_CREAT|O_EXCL`); `release()` is reachable via `finally` from every exit path of `runPipeline`, including an unexpected exception escaping the per-candidate try/catch.
- [ ] A stale lock is never deleted, overwritten, or silently reassigned by any code path — verified by a test asserting the lock file is byte-identical before and after a refused acquisition attempt.
- [ ] `pipeline_batch_lock_held_ambiguous`'s diagnostic carries real holder/timestamp/age data, not placeholder values.
- [ ] Reviewer independence, evidence binding, and review-chain integrity (Mission 3B's audited properties) are provably untouched by this delivery.
- [ ] Fail-closed behaviour on malformed persisted state: one corrupted candidate record isolates to its own `PerCandidateResult`, never aborts or corrupts sibling processing.
- [ ] Deterministic replay: identical reruns (same `pipelineRunId`, same ordered candidate list) produce byte-identical `PipelineRunReport` summaries.
- [ ] The Mission 3B P2 debt remediation test (§14a) exists, starts from real ingestion, never directly seeds `correctness_check_passed`, and explicitly proves the append-before-failure property through `runPipeline`'s own production entry point.
- [ ] Production bank (100 questions, 15 showcase fixtures) and `src/content/` are byte-identical before and after the branch's diff.
- [ ] `npm audit --audit-level=moderate` residual state unchanged (two moderate Next/PostCSS advisories only).
- [ ] Every new issue code in `mission3c-issue-codes.ts` is a fixed enum member with no candidate-derived value embedded in the code string itself.
- [ ] §19's remaining lower-stakes items, if resolved differently than proposed during implementation, are documented in the delivery report with rationale.
