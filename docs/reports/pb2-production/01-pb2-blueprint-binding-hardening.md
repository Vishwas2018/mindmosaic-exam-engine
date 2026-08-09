# PB2 Blueprint-Binding — Mandatory Read-Only Inspection Hardening Report

Status: **remediation implemented, tested, and validated. Branch frozen for final focused Codex re-audit. Not self-approved.**

Branch: `feature/pb2-blueprint-binding`. Written against the verdict `PB2 BLUEPRINT-BINDING READ-ONLY PREFLIGHT REMEDIATION REQUIRES FURTHER REMEDIATION`.

---

## 1. Root cause

The prior read-only preflight remediation (commit `e737618`) added `FactoryRepository.inspectRecord()` — a strictly non-mutating counterpart to `read()` — and a module-private `readOnlyRepositoryView()` in `binding/preflight.ts` that used it. `inspectRecord` was declared **optional** on `FactoryRepository`, and `readOnlyRepositoryView()` contained an explicit fallback:

```ts
read: async (compartment, candidateId) => {
  if (repository.inspectRecord === undefined) return repository.read(compartment, candidateId);
  ...
}
```

This fallback meant: *any* repository object passed into binding preflight that did not implement `inspectRecord` — including a wrapped, decorated, or dependency-injected repository that otherwise behaves exactly like a real `FsFactoryRepository` — silently downgraded to the real, mutating `read()`. `read()` **repairs** malformed stored records (quarantine move + report write). A malformed blueprint encountered during preflight through such a repository would therefore be quarantined and moved, exactly the zero-write defect the original remediation set out to close — reintroduced through the one code path (a repository not implementing an optional interface member) the interface itself permitted.

The optionality was deliberate at the time ("existing in-memory test doubles… remain valid implementations"), but conflated two different concerns: *not every repository consumer needs inspection* (true, and worth preserving) with *binding preflight can tolerate a repository without inspection* (false — preflight has no legitimate reason to ever fall back).

---

## 2. Remediation

### Removal of the repairing-read fallback

`readOnlyRepositoryView()` is deleted outright. There is no code path anywhere in `binding/preflight.ts` (or the modules it composes) that calls the real repository's `read()` any more.

### Enforced inspection capability (preferred design: dedicated required capability)

- **`ReadOnlyFactoryRepository`** (new, `storage/factory-repository.ts`) — a minimal interface exposing only `inspectRecord`. `FactoryRepository.inspectRecord` remains optional on the full interface (unchanged) so the ~11 unrelated repository test doubles across structural-validation, correctness, ingestion, revision, review, and pipeline-runner crash-safety tests are not forced to implement a capability they never use — exactly the "without forcing unrelated repository consumers to depend on it unnecessarily" instruction.
- **`resolveReadOnlyRepository(repository: FactoryRepository)`** (new, `binding/preflight.ts`) — the sole, checked gate onto a `ReadOnlyFactoryRepository`. A `typeof repository.inspectRecord !== "function"` check, nothing else: no repository call, no lock, no filesystem access, no exception thrown. On failure, returns `{ ok: false, code: "read_only_inspection_unavailable", message }`, which `runBindingPreflight` converts directly into a `BindingPreflightFailure` (a new member of that closed union) — folded into the existing external `binding_manifest_invalid` issue code by `evaluateBindingPreflight`, exactly like every other internal preflight failure code already is, so no new externally-visible contract was introduced.
- **`toInspectionOnlyView(readOnly: ReadOnlyFactoryRepository)`** (new, `binding/preflight.ts`) — builds the `FactoryRepository`-shaped view `resolveBoundBlueprint` (shared with every other gate) expects, from an *already-confirmed* `ReadOnlyFactoryRepository` only. `read()` is a thin shim over `inspectRecord()`; every mutating method (`create`/`update`/`remove`/`move`/`reconcile`/`exists`/`list`) throws if ever called. This is not merely "unused by convention": the view is built from a value that never held a reference to the real repository's mutating methods in the first place — there is structurally nothing to delegate to, even if a future change to `resolveBoundBlueprint` ever tried.

`runBindingPreflight` now calls `resolveReadOnlyRepository` unconditionally at the point where blueprint resolution begins (the same position the old `readOnlyRepositoryView` call occupied) and returns the governed refusal immediately on failure, before the blueprint-resolution loop runs at all.

### Compile-time narrowing, where practical

`toInspectionOnlyView` accepts only `ReadOnlyFactoryRepository`, never `FactoryRepository` — a caller cannot construct the inspection-only view by wrapping an arbitrary repository directly; the only way to obtain a `ReadOnlyFactoryRepository` value at all is through `resolveReadOnlyRepository`'s runtime-checked gate. `runBindingPreflight`/`evaluateBindingPreflight`/`runManualIngestion` themselves must still accept a full `FactoryRepository` (the same object is used for the real ingestion I/O that follows a passing preflight), so the capability narrowing is enforced at the point inspection actually happens rather than at every call site — the practical limit of what the type system can express while preserving the existing single-repository-instance architecture.

### `update()` deliberately left unrestricted

Only `create()`-style *minting* concerns were ever in scope for this remediation's predecessor; `update()` on an already-existing blueprint record is unaffected. This is orthogonal to the audited defect: the defect was about a *read* silently repairing, not about an existing record being rewritten. `update()`-based tampering of an already-stored record remains a different, already-handled concern (blueprint hash/content validation in `resolveBoundBlueprint` itself).

---

## 3. Interfaces, implementations, and entry points verified

A full-repository search located every construction of an object satisfying `FactoryRepository`:

| Category | Finding |
|---|---|
| Production implementation | `FsFactoryRepository` — implements `inspectRecord` genuinely (unchanged; already non-mutating). |
| Binding-preflight test doubles (`binding-readonly-preflight.test.ts`) | The only test file that constructs custom `FactoryRepository` wrappers *and* exercises `runBindingPreflight`/`runManualIngestion` with a `bindingManifest`. Extended with the new adversarial coverage below. |
| ~11 other crash-safety/ingestion test doubles (structural-validation, correctness, revision, review, pipeline-runner, ingestion) | None implement `inspectRecord`; none are ever passed into the binding-preflight path (confirmed by grepping every test file that references `bindingManifest` for custom `FactoryRepository` construction — only `binding-readonly-preflight.test.ts` does). Left unchanged: per the preferred design, they are not required to support inspection, and if any were ever passed to binding preflight, they would now receive the deterministic `read_only_inspection_unavailable` refusal automatically — no code change needed to make that true. |
| CLI entry point (`scripts/questions-ingest.mts`) | Constructs a single real `new FsFactoryRepository(getWorkspaceRoot())` — no wrapper/decorator layer. Already inspection-capable; no change needed. |
| `binding/index.ts`, `storage/index.ts` (public barrels) | `ReadOnlyFactoryRepository` exported from `storage/index.ts` (a read/interface type, not a write capability). `resolveReadOnlyRepository`/`toInspectionOnlyView` are **not** barrel-exported from `binding/index.ts` — they remain internal to `preflight.ts`, callable only from within that module. |

---

## 4. Required behaviour verified

- Binding preflight uses only non-mutating inspection — `read()` on the real repository is never called by any code path in `preflight.ts`.
- A repository without inspection returns a deterministic governed refusal (`read_only_inspection_unavailable`) — never an uncontrolled exception, never a lock acquisition, never a directory/file creation, never `read()`, never quarantine/repair.
- No silent adaptation or unwrapping: a repository is either provably inspection-capable (via the `typeof` check) or refused outright — there is no "best effort" middle path.

---

## 5. Adversarial test results

`binding-readonly-preflight.test.ts` — 20 tests total (13 pre-existing, 7 new), all run against a real `FsFactoryRepository`/real filesystem, never mocks:

| Required scenario | Test | Result |
|---|---|---|
| 1. Repository with `inspectRecord()` succeeds normally | "1. a repository with inspectRecord() continues to succeed normally (baseline)" | passed |
| 2. Repository without inspection fails closed | "2. …fails closed with read_only_inspection_unavailable" | refused, zero-write |
| 3. Repository without inspection never has `read()` called | "3. …never has its read() called during preflight" | `readCalls === 0` |
| 4. Repository whose `read()` deliberately mutates is still untouched | "4. …deliberately mutates (creates a marker file) is never touched" | `readCalls === 0`, marker file never created (`fs.access` rejects) |
| 5. Wrapped `FsFactoryRepository` hiding inspection returns governed refusal with full snapshot identity | "5. a wrapped FsFactoryRepository that hides inspectRecord…" | refused, full lstat snapshot byte-identical |
| 6. Malformed blueprint remains byte-identical | (asserted inside test 5) | confirmed |
| 7–10. No `quarantined/`, `.quarantine-reports/`, `.locks/`, `.processing/` | (asserted inside test 5) | confirmed, all four absent |
| 11. No repository, provenance, or report writes | (asserted inside test 5, plus `repo.list()` on `generated`/`review-queue`/`reports`) | all empty |
| 12. Pre-lock and under-lock paths both require non-mutating inspection | "12. runBindingPreflight itself (the exact function both…call sites share) refuses…" | refused directly against the shared function both call sites invoke |
| 13. Valid dry-run remains 240/240 | isolated real dry-run (§7 below) | 240 accepted, 0 rejected |
| 14. Valid ingestion remains functional | pre-existing "6+15" test + isolated dry-run | passed |
| 15. Replay remains idempotent | pre-existing "6+15" test + new "…full round trip still succeeds and replays idempotently" | `candidatesReplayed: 1` |
| 16. Lock contention remains protected | `fs-factory-repository.test.ts` (unchanged, re-verified in the full suite run) | passed |

The explicitly required "trap" repository (`read()` creates/moves a marker file, no `inspectRecord`, binding preflight refuses, marker never created, `read()` call count zero) is test 4 above, verbatim.

---

## 6. Complete zero-write evidence

Every refusal test above asserts, via `snapshotWorkspace()` (the existing `lstat`-based complete workspace snapshot utility — directory-aware, symlink/junction-safe, never follows links, byte-content hashed for files): the *entire* lstat snapshot before and after the refusal is identical, string-for-string. No new file, directory, rename, or metadata write of any kind occurred, anywhere under the snapshotted roots (`workspaceRoot`, `inboxRoot`).

---

## 7. Real-scale, isolated, read-only confirmation (items 13–16)

Approved PB2 artefacts and the pre-existing rehearsal workspace (`C:\tmp\pb2-bind-ws`) were **not** modified, regenerated, or ingested. A scratch copy (outside the repository and outside both of those locations, deleted immediately after use) was assembled from: the rehearsal workspace's already-seeded 153 blueprints (read-only copy) and the rehearsal workspace's already-processed 8 pack files (read-only copy, re-staged into a fresh scratch inbox so the CLI's top-level scan would see them). Against this scratch copy, using the **updated** code and a `MINDMOSAIC_QUESTION_FACTORY_ROOT`-isolated invocation of `scripts/questions-ingest.mts` with `--dry-run`, the real approved `binding-manifest.json` (frozen fingerprint `3c1b120a…`) was evaluated end to end:

```
filesScanned: 8, filesProcessed: 8, filesQuarantined: 0
accepted candidates: 240
rejected candidates: 0
distinct blueprint ids: 153
pilot-prefixed blueprint ids: 0
```

Exactly 240 bindings, 153 blueprints, zero pilot bindings, zero rejections — confirmed through the real CLI entry point (not only unit tests) at full production scale, using the mandatory-inspection code path.

The three approved identities were independently reconfirmed by recomputing them with the application's own canonical `hashJson` (not raw file bytes, which do not match `hashJson`'s stable-key-order/newline-normalised output and would be a false negative if compared naively):

- `manifestHash` recomputed from `C:\tmp\pb2-frozen-3c1b120a\binding\binding-manifest.json`: `37386bf18867e82c36fb4dc0c7d587669e371584d6d754ad0ee98ff8738701cf` — **matches**.
- `blueprintSetHash` recomputed from `C:\tmp\pb2-frozen-3c1b120a\binding\binding-blueprints.json`: `a479f478021ac1ab641e1e7290b00f1bbea33cd35532a9dfb8d4dba9f4401bc7` — **matches**.
- PB2 fingerprint (`3c1b120a…`): unchanged — the `artefacts/` directory it is derived from was never read from a write path, opened for writing, or otherwise touched by this remediation.

No governed PB2 ingestion was executed at any point (every invocation above was `--dry-run` or a unit test against a temporary, disposable workspace).

---

## 8. Starting and final SHA

| | |
|---|---|
| Starting HEAD | `e7376180c7b979086de25480390f378d41d03d27` (`fix: resolve preflight blueprints through a non-mutating read path`) |
| **Final HEAD** | `<this commit>` (`docs: record PB2 blueprint-binding read-only inspection hardening`), on top of one remediation commit |
| Remediation commit | `701105e` — `fix: make binding preflight's non-mutating inspection mandatory, never a fallback` |
| Commit count | 1 remediation commit + 1 documentation commit (this report) — 2 total, matching "one focused remediation commit unless documentation genuinely requires a second commit" |
| `main` | `ba9575c572df050ab97244758ead22e5336dcd2c` — unchanged, untouched |
| Local vs. `origin` | Not pushed; no merge performed |

### Correction acknowledged from the prior audit round

This report's authoritative starting point is the full SHA `e7376180c7b979086de25480390f378d41d03d27`, as directed. No abbreviated form of this hash was written into any file in this remediation.

---

## 9. Full validation results

| Command | Result |
|---|---|
| `npm run typecheck` | clean |
| `npm run lint` | clean |
| `npm test` | 1693/1693 passed (80 files) — one clean full-suite run, no flakiness observed |
| `npm run validate:questions` | all production questions and showcase fixtures valid |
| `npm run check:answers` | 100/100 questions checked, 0 failures |
| `npm run build` | succeeds (Next.js 16.2.10 / Turbopack) |
| `npm run test:e2e` | **20/20 passed**, definitive (single clean run) |
| `npm audit --audit-level=moderate` | 2 moderate advisories (Next → postcss `GHSA-qx2v-qp2m-jg93`) — unchanged, pre-existing |
| `git diff --check` | clean |

### Confirmations

- Exact starting SHA: `e7376180c7b979086de25480390f378d41d03d27`. Exact final SHA: recorded above once this commit lands.
- Exact commit count: 2 (1 remediation + 1 documentation).
- Clean worktree: confirmed (`git status --short` empty after each commit).
- `main` unchanged: `ba9575c572df050ab97244758ead22e5336dcd2c`.
- Production bank (`src/content/questions/`) byte-unchanged: `git diff -- src/content/questions/` against the starting SHA is empty.
- Frozen PB2 artefacts byte-unchanged: never opened for writing; only read for hash recomputation.
- Binding artefacts (`binding-manifest.json`, `binding-blueprints.json`) byte-unchanged: recomputed hashes match exactly (§7).
- All three approved hashes recompute exactly: PB2 fingerprint (untouched source), `manifestHash`, `blueprintSetHash` (§7).
- 240 bindings, 153 blueprints, zero pilot bindings: confirmed via real isolated dry-run (§7).
- No governed PB2 ingestion executed.
- Exactly the accepted moderate `next`/`postcss` advisories, no others.
- No unrelated files changed: `git diff --stat` against the starting SHA shows exactly `binding/preflight.ts`, `storage/factory-repository.ts`, `storage/index.ts`, and the one test file, plus this report.
- `.vscode/` and `design.md`: absent from this worktree, untouched.

---

## 10. Residual risks

- **A repository that lies about its own `typeof` shape** (e.g. assigns `inspectRecord` to a function that does not actually behave non-mutatingly) is not detected by `resolveReadOnlyRepository` — the check is structural (does the method exist), not behavioural (does the method actually avoid mutation). This mirrors every other capability-shape check in this codebase (e.g. the correctness-attestation governed-write capability in the Mission 3D remediation lineage) and is a general limitation of duck-typed capability checks in TypeScript, not specific to this fix. `FsFactoryRepository.inspectRecord` itself is verified non-mutating by direct unit test ("8. inspectRecord() never repairs").
- **`update()` on the `reports`/`blueprints` compartments remains unrestricted for binding preflight's own concerns**, as noted in §2 — deliberately out of scope; this remediation only closes the *read-that-silently-repairs* fallback, not a general write-authorisation model for blueprints.
- **The scratch-workspace dry-run confirmation (§7) is a point-in-time verification**, not a permanent automated test — it was deliberately kept outside the committed test suite because it depends on the external rehearsal workspace and frozen artefact paths (`C:\tmp\...`), which are not portable CI paths and are explicitly off-limits to modify. The permanent, portable regression coverage for this exact mechanism lives in `binding-readonly-preflight.test.ts`.

PB2 BLUEPRINT-BINDING MANDATORY READ-ONLY INSPECTION READY FOR FINAL FOCUSED RE-AUDIT
