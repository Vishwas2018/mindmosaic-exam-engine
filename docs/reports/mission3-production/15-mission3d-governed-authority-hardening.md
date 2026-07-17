# Mission 3D — Governed-Authority Hardening Report

Status: **remediation implemented, tested, and validated. Branch frozen for independent Codex re-audit. Not self-approved.**

Branch: `claude/mission3d-third-remediation`, continuing directly from the governed-authority remediation's own docs commit `adce3f7`. That remediation closed "the attestation itself can be forged and persisted" by gating `FsFactoryRepository.create()` behind a `GovernedWriteCapability` for the two reserved trusted-report families (`cva-*` correctness-pass attestations, `sr-*` semantic-completion evidence). It left five residual defects (D1–D5) documented below: the capability gate on `create()` was scoped only to the `reports` compartment and only to `create()` itself, and nothing at all constrained who could obtain a capability or call the two governed writers directly. This report records the fix.

**Invariant.** Trusted correctness and semantic evidence must be persistable only through governed correctness and semantic orchestration. Generic report writers, fixtures, CLIs and unrelated production modules must be unable to mint or persist trusted `cva-*` or `sr-*` records through supported application APIs.

---

## 1. Starting and final SHA

| | |
|---|---|
| Starting HEAD | `adce3f7aaa26c93bad631d738cb780e5b7812dcf` (`docs: record governed-authority Mission 3D remediation`) |
| **Final HEAD after this hardening** | `<this commit>` (`docs: record governed-authority Mission 3D hardening`), on top of the four commits below |
| Governed-authority remediation's own merge base | `be6fb4fec3ec1437e8de613f98b99b487cad25f1` — unchanged |
| Third remediation's own merge base | `a1a9b3390e2fe7ae5993f5d70d459d8848f16240` — unchanged |
| `main` | unchanged, untouched throughout |
| `integration/governed-question-factory` | unchanged, untouched throughout |
| Local vs. `origin` | This branch does not exist on `origin`; local remains ahead by every commit on the branch (unpushed) |

---

## 2. Hardening commits

```
972534f feat: reserve trusted report families across create/move/update/remove
105d38e test: reusable trusted-family policy contract run against two repository shapes
f1601ee build: enforce the governed-writer import boundary via lint and a source scan
c91df6e test: restage tamper fixtures for closed update()/remove(), extend forged-chain coverage
<this commit> docs: record governed-authority Mission 3D hardening
```

Five commits, matching the required commit discipline exactly.

---

## 3. Defects (D1–D5)

### D1 — mint via a non-`reports` compartment, then relocate in with `move()`

**Defect.** `FsFactoryRepository.create()`'s trusted-family check was scoped to `compartment === "reports"`. A caller could call `repository.create("generated", "cva-<id>", forgedData)` — no capability required, since the check never triggered outside `reports` — and `move()` had **no trusted-family check of any kind**, so a second call, `repository.move("cva-<id>", "generated", "reports")`, would relocate the forged record into `reports` unopposed, completing the mint.

**Reproduction (pre-fix behaviour, verified against the commit-1 base before the fix landed):**
```ts
await repository.create("generated", "cva-<id>", forgedAttestation); // succeeded — wrong compartment, check never ran
await repository.move("cva-<id>", "generated", "reports");            // succeeded — move() had no check at all
```

**Fix.** `assertGenericOperationAllowed` (`storage/trusted-reports.ts`) is consulted by `create()` regardless of compartment — a trusted id is reserved everywhere, not only in `reports` — and by `move()` unconditionally, for every `from`/`to` pair, with no capability parameter accepted at all (`storage/fs-factory-repository.ts`). Both steps of the chain are now independently refused with `reason: "trusted_family_reserved"`.

### D2 — tamper an existing, legitimately-minted record via `update()`

**Defect.** `update()` had no trusted-family check whatsoever. A caller holding (or having read) an already-genuine `cva-*`/`sr-*` record could hand-modify any field, recompute a self-consistent fingerprint over the modified facts (the fingerprint function is pure and its inputs are all knowable to a reader of `evidence.ts`/`semantic-completion-evidence.ts`), and call `repository.update("reports", id, tamperedRecord)` to overwrite the genuine record in place — indistinguishable from the original by any fingerprint check, since the fingerprint itself was recomputed to match.

**Reproduction (pre-fix):**
```ts
const genuine = await repository.read("reports", "cva-<id>");
const tampered = { ...genuine, candidateContentHash: "attacker-supplied", attestationFingerprint: recompute(...) };
await repository.update("reports", "cva-<id>", tampered); // succeeded — no check at all
```

**Fix.** `update()` now unconditionally refuses any trusted-family id via the same shared policy — no capability is ever accepted for `update`, because the two governed writers only ever call `create()`. A trusted record is append-only: once minted, no caller, including the governed writers themselves, may rewrite it.

### D3 — delete an existing, legitimately-minted record via `remove()`

**Defect.** `remove()` had no trusted-family check. `repository.remove("reports", "cva-<id>")` silently deleted a genuine attestation/evidence record — usable to force a downstream re-verification, hide evidence of a prior state, or as a step in a more elaborate forgery (delete the genuine record, then attempt to mint a replacement).

**Reproduction (pre-fix):** `await repository.remove("reports", "cva-<id>");` succeeded unconditionally.

**Fix.** `remove()` now throws a typed `TrustedFamilyReservedError` (exported from `storage/index.ts`) for any trusted-family id, via the same shared policy — `remove()` has no result union to encode a refusal in, so a typed, named error makes the refusal unambiguous and lets callers/tests assert on it precisely, rather than silently no-op'ing.

### D4 — `GovernedWriteCapability` importable and self-issuable by any code

**Defect.** `storage/governed-write-capability.ts` was never re-exported from any public barrel, but nothing *enforced* that — the "not barrel-exported means internal" convention this codebase already uses elsewhere (`correctness/index.ts`, `review/index.ts`) is a documentation convention, not a boundary. Any file anywhere under `src/` — an unrelated production module, a test fixture, a future CLI script — could `import { GovernedWriteCapability } from ".../storage/governed-write-capability"` and call `GovernedWriteCapability.issue("cva-")` itself: `issue` performs no caller-identity check, only recording that *some* call happened. A self-issued capability is genuinely present in the module-private `WeakSet` and passes `isValidGovernedWriteCapability` — it is not distinguishable from one issued by a real governed writer.

**Reproduction (pre-fix, would have compiled and run from anywhere under `src/`):**
```ts
import { GovernedWriteCapability } from "@/features/question-factory/storage/governed-write-capability";
const capability = GovernedWriteCapability.issue("cva-"); // no restriction on who may call this
await repository.create("reports", "cva-<id>", forgedAttestation, capability); // would have succeeded
```

**Fix.** An error-level `no-restricted-imports` rule (`eslint.config.mjs`) makes `governed-write-capability` importable, within `src/features/question-factory/**`, only by storage's own internals (`factory-repository.ts`, `fs-factory-repository.ts`, `trusted-reports.ts`) and the two governed writers — nowhere else. A companion source-scan test (`governed-import-boundary.test.ts`) asserts the exact importer set independently of ESLint actually running.

### D5 — the two governed writers importable and callable by any code

**Defect.** Symmetric to D4: `correctness/governed-attestation-writer.ts` and `review/governed-semantic-evidence-writer.ts` were never barrel-exported but were not import-restricted either. Any file could import `writeCorrectnessAttestation`/`writeSemanticCompletionEvidence` directly (bypassing `orchestrate-correctness-verification.ts`/`orchestrate-semantic-review.ts` entirely) and call it with arbitrary, self-supplied facts never derived from any real verification or review run — minting a fully capability-backed, correctly-fingerprinted `cva-*`/`sr-*` record for a pass that never happened.

**Reproduction (pre-fix, would have compiled and run from anywhere under `src/`):**
```ts
import { writeCorrectnessAttestation } from "@/features/question-factory/correctness/governed-attestation-writer";
await writeCorrectnessAttestation(repository, arbitrarySelfSuppliedFacts); // no restriction on who may call this
```

**Fix.** The same `no-restricted-imports` mechanism restricts each governed writer, within `src/features/question-factory/**`, to its own sibling orchestrator only — `governed-attestation-writer` to `orchestrate-correctness-verification.ts`, `governed-semantic-evidence-writer` to `orchestrate-semantic-review.ts`. The source-scan test asserts both importer sets exactly.

Test files (`src/tests/unit/question-factory/**`) are deliberately exempted from D4/D5's import restriction — an established, pre-existing convention this codebase documents explicitly (`correctness/index.ts`, `review/index.ts`, `validation/index.ts`: "not barrel-exported" is the definition of internal, and individual modules remain reachable by file path for tests). The restriction targets *production* reuse — unrelated production modules, fixtures used by production code paths, and future CLI scripts — which is what D4/D5 actually threatened.

---

## 4. Files changed

| File | Commit | Nature |
|---|---|---|
| `storage/trusted-reports.ts` | 1 | `assertGenericOperationAllowed` (shared policy for create/move/update, consulted by remove for its family lookup), `TrustedFamilyReservedError`, `GuardedRepositoryOperation` |
| `storage/factory-repository.ts` | 1 | `MoveFailureReason`/`UpdateFailureReason` gain `"trusted_family_reserved"`; interface doc comments updated |
| `storage/fs-factory-repository.ts` | 1 | `create()` checks every compartment (not only `reports`); `move()` and `update()` consult the shared policy and refuse unconditionally; `remove()` throws `TrustedFamilyReservedError` |
| `storage/index.ts` | 1 | exports `TrustedFamilyReservedError`, `isTrustedReportId`, `trustedReportFamilyOf`, `TRUSTED_REPORT_FAMILIES`, and the `TrustedReportFamily`/`GuardedRepositoryOperation` types |
| `src/tests/unit/question-factory/trusted-policy-contract.ts` | 2 | new — `describeTrustedPolicyContract` (reusable suite), `delegatingRepository` (thin wrapper) |
| `src/tests/unit/question-factory/trusted-policy-contract.test.ts` | 2 | new — runs the contract against a bare `FsFactoryRepository` and a delegating wrapper (34 tests) |
| `eslint.config.mjs` | 3 | error-level `no-restricted-imports` restricting `governed-write-capability` and the two governed writers to their exact allowed importer sets |
| `src/tests/unit/question-factory/governed-import-boundary.test.ts` | 3 | new — ESLint-independent source scan asserting the exact importer sets |
| `mission3d-third-remediation.test.ts` | 4 | `overwriteAttestation`/`overwriteSemanticEvidence` and four inline `repo.update`/`repo.remove` calls on trusted ids restaged to direct filesystem writes (`stageRawReportWrite`/`stageRawReportRemoval`), labelled out-of-scope staging; behaviour and assertions otherwise unchanged |
| `mission3d-governed-authority.test.ts` | 4 | forged-chain test extended with create-in-`generated` and `move()` attempts (D1); new test for the no-genuine-chain D1 variant; new test tampering/removing a genuinely-minted pair via `update()`/`remove()` (D2/D3) |

No file outside `src/features/question-factory/{storage,correctness,review}`, `src/tests/unit/question-factory/`, and `eslint.config.mjs` was touched. No `.vscode/`/`design.md` exist in this worktree. The production question bank (`src/content/questions/`) has zero diff against the branch's starting SHA. Staging, publication, Supabase, provider adapters, PB2, and Mission 3E were not touched. The PB2 blueprint-binding/manual-ingestion work on `feature/pb2-blueprint-binding` is a separate branch, untouched.

---

## 5. Architecture

### Shared policy: `assertGenericOperationAllowed`

`storage/trusted-reports.ts` exports one function every mutating `FsFactoryRepository` operation consults:

```ts
function assertGenericOperationAllowed(
  operation: "create" | "move" | "update" | "remove",
  candidateId: string,
  capability?: GovernedWriteCapability,
): { allowed: true } | { allowed: false; family: TrustedReportFamily; message: string };
```

For a non-trusted id it always allows. For a trusted id: `create` allows only with a valid, matching `GovernedWriteCapability` (the sole exception in the entire policy); `move` and `update` never accept a capability and always refuse. `remove()` calls it purely to reuse the family lookup, then always throws `TrustedFamilyReservedError` on refusal, since `remove()` has no result union to encode one in. This single function is now the entire trusted-family policy surface — every one of the four operations' guards is a call to it, so there is exactly one place that can be wrong.

### Why `update`/`move` never accept a capability at all

The two governed writers (`correctness/governed-attestation-writer.ts`, `review/governed-semantic-evidence-writer.ts`) only ever call `repository.create()` — never `move()` or `update()` — because a trusted record's replay semantics are already handled entirely within `create()`'s own duplicate-detection path plus the writer's own pre-read/fingerprint-comparison (see the governed-authority remediation report §4, "The two governed writers"). There is therefore no legitimate call, anywhere in the application, that needs `move()` or `update()` to succeed for a trusted id — closing them unconditionally costs nothing and removes an entire class of "recomputed-fingerprint tamper" attacks (D2) and "relocate a record other than by minting it" attacks (part of D1) in one step.

### Import boundary as a second enforcement layer

D4/D5 are closed at the *reachability* level rather than the *runtime-check* level: `GovernedWriteCapability.issue` and the two governed writers have no runtime caller-identity check (TypeScript/JavaScript have none to offer — see the governed-authority remediation report's threat model, unchanged here), so the defence is that only a small, fixed set of files can import them at all, enforced twice, independently: an error-level ESLint rule (checked in CI/pre-commit tooling) and a source-scan test (checked by `npm test`, so it fails even if ESLint is skipped, misconfigured, or its config is edited without also editing the test's expectations).

---

## 6. Threat model

**In scope, and now closed through every supported application and repository API:**

- Generic repository misuse: `create()` in any compartment, `move()` in either direction, `update()`, and `remove()` — all four refuse a trusted-family id unconditionally except `create()` with a genuinely-issued, matching capability.
- The two-step create-elsewhere-then-relocate mint bypass (D1).
- Tampering an existing, legitimately-minted trusted record in place (D2).
- Deleting an existing, legitimately-minted trusted record (D3).
- Unrelated production modules, fixtures, and future CLI scripts obtaining a `GovernedWriteCapability` themselves (D4) or calling a governed writer directly with self-supplied facts (D5).
- Wrappers/DI: the trusted-policy contract (`trusted-policy-contract.test.ts`) runs its full battery against both a bare `FsFactoryRepository` and a delegating wrapper around one, proving the guards live in the concrete implementation and survive being called through an arbitrary `FactoryRepository`-typed indirection layer, not only via `new FsFactoryRepository(...)` called directly.
- A complete, self-consistent, hand-forged `cv-*`/`cva-*`/`sr-*` chain, attempted via every one of create-in-reports, create-in-generated, move, update, and remove: still refused at every step (`mission3d-governed-authority.test.ts`).

**Explicitly outside this application-level trust boundary** (unchanged from the governed-authority remediation report, restated here per this task's own instruction):

- **Direct filesystem tampering** — writing/editing/deleting a JSON file directly under `content/question-factory/reports/` on disk, bypassing `FsFactoryRepository` entirely. This is exactly what the restaged tamper-simulation fixtures in `mission3d-third-remediation.test.ts` now do deliberately, to test a different (read-side) invariant — never presented as evidence that the repository boundary itself permits it.
- **Runtime memory compromise** — a caller able to execute arbitrary code in the same process can reach into `governed-write-capability.ts`'s module scope directly; no pure JavaScript/TypeScript in-process mechanism defends against this.
- **Source-code modification** — a caller who edits `fs-factory-repository.ts`, `governed-write-capability.ts`, `trusted-reports.ts`, `eslint.config.mjs`, or either governed writer can remove the checks. True of every invariant in this codebase.
- **A deep import bypassing a public barrel, from within `src/tests/unit/question-factory/`** — deliberately not restricted; an established, pre-existing, documented convention (§3, D4/D5) that this hardening does not attempt to defeat.
- **Staging, publication, Supabase, provider adapters** — untouched, out of scope for this task.

**This hardening does not claim cryptographic authenticity.** No secret key, HMAC, or asymmetric signature is introduced anywhere in this change, matching the governed-authority remediation and every prior Mission 3D remediation. Every check here is an in-process, application-level access-control primitive — tamper-evidence and origin-gating within the boundaries TypeScript's module, type, and lint-tooling systems can actually enforce, not a guarantee against a privileged or malicious runtime.

---

## 7. Test results

### `trusted-policy-contract.test.ts` — 34 tests (17 cases × 2 repository shapes: bare `FsFactoryRepository`, delegating wrapper)

Per family (`cva-`, `sr-`), per shape: `create()` refuses with no capability in every compartment; refuses a forged never-issued capability; refuses a validly-issued capability for the *wrong* family; succeeds only with a valid, matching capability; D1 (create-in-`generated` cannot stage a later move; `move()` refuses regardless of direction, even for a record already on disk); D2 (`update()` unconditionally refuses to rewrite an existing trusted record); D3 (`remove()` throws `TrustedFamilyReservedError` rather than deleting). Plus one shared case per shape confirming non-trusted ids are completely unaffected.

### `governed-import-boundary.test.ts` — 3 tests

Source-scan (ESLint-independent) confirms the exact importer set for `governed-write-capability` (5 files: 3 storage internals + 2 governed writers) and for each governed writer (exactly its own sibling orchestrator, 1 file each).

### `mission3d-governed-authority.test.ts` — 21 tests (was 19; two new, one split into two)

All prior 19 scenarios re-verified green under the new hardening (generic `create()` refusal, capability unreachability through every public barrel, canonical single-record minting, crash/retry convergence, cached-replay zero-write, conflicting-record fail-closed, originality zero-write refusal, five-stage `difficulty_review_passed`). Plus: the forged-chain scenario now also attempts create-in-`generated` and both-direction `move()` (D1); a new scenario proves the same for a candidate that never has a genuine chain at all; a new scenario proves a genuinely-minted `cva-*`/`sr-*` pair survives `update()`-tamper and `remove()`-deletion attempts untouched (D2/D3), with the candidate's legitimate `passed` outcome unaffected afterward.

### `mission3d-third-remediation.test.ts` — 26 tests, all green after restaging

The 13 tests that previously relied on `repo.update("reports", ...)`/`repo.remove("reports", ...)` succeeding against trusted ids to stage a tampered/missing precondition (tests 3a, 3b, 3c, 4, 5, 6, 7, 8, 9, 11, 11b, 19, 20) now stage that precondition via direct filesystem writes (`stageRawReportWrite`/`stageRawReportRemoval`), explicitly labelled out-of-scope per §6 above. Verified to fail exactly as expected against the pre-restage code (13/26 failures, matching this exact list) before the restaging commit, and to pass again (26/26) after it — confirming the restaging preserves the original test intent rather than silently weakening it.

### Full unit + e2e suite

All existing Mission 3D suites (governed-authority remediation, third remediation, second remediation, first remediation, integration) re-verified green under the new hardening — see §8 for the full command-by-command results.

---

## 8. Full validation results

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | 1849/1849 passed (89 files) |
| `npm run validate:questions` | all production questions and showcase fixtures valid |
| `npm run check:answers` | 100/100 questions checked, 0 failures |
| `npm run build` | succeeds |
| `npm run test:e2e` | 20/20 passed |
| `npm audit --audit-level=moderate` | 2 moderate advisories (Next → postcss `GHSA-qx2v-qp2m-jg93`) — unchanged, pre-existing, accepted debt |
| `git diff --check` | clean |

Production bank (`src/content/questions/`) byte-for-byte unchanged. `main` and `integration/governed-question-factory` remain untouched. No `.vscode/`/`design.md` exist in this worktree. This branch does not exist on `origin` (local ahead, unpushed). No staging, publication, Supabase, or provider-adapter code was touched.

---

## 9. Residual risks

- **Runtime memory compromise and source-code modification remain able to defeat every boundary in this report**, as stated in §6 — an inherent limit of in-process TypeScript/lint-tooling access control, not a gap specific to this hardening.
- **The import-boundary restriction (D4/D5) is a reachability control, not a runtime one** — it stops the boundary from being crossed by *ordinary, type-checked, lint-clean production code*, and is independently re-verified by a source-scan test so it survives ESLint misconfiguration, but a caller willing to bypass both TypeScript and the lint/test tooling (e.g. dynamic `require()` with a computed path, or editing the lint config itself) is outside what either mechanism can observe — the same limit already documented for the capability's own `private`-constructor/`WeakSet` design in the governed-authority remediation report.
- **`difficulty/` still trusts `originality/validate-cached-replay.ts`'s own binding, not the full correctness/structural/attestation/semantic chain beneath it** — unchanged, out of this task's scope (unchanged from the second, third, and governed-authority remediations' own documented residual risk).
- **`attemptSemanticReviewTransition`'s own cached-replay path** still returns `passed`/`replayed: true` on lifecycle state alone without re-checking its own `sr-*` evidence — unchanged, the enforcement point remains originality, as specified in every prior Mission 3D remediation.

MISSION 3D GOVERNED-AUTHORITY REMEDIATION READY FOR FINAL CODEX RE-AUDIT
