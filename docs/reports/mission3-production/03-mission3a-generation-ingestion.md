# Mission 3A — Generation and Manual Ingestion

Status: implemented, tested, frozen for independent Codex audit. Not self-approved — see "Audit status" at the end of this document.

Branch: `integration/governed-question-factory`. Starting SHA `056c9f9c34e0f2890a101fa70d52db5c660477a9`. Stable `main` remains `ba9575c572df050ab97244758ead22e5336dcd2c`, untouched by this work.

Written against `docs/reports/mission3-production/01-mission3-implementation-contract.md` and `02-prerequisite-decisions.md`. This document records what was actually built, not a restatement of the contract.

---

## 1. Scope delivered

- `QuestionGenerator` contract (`generation/types.ts`) — provider-neutral, symmetrical with the (not-yet-built) `Reviewer` contract.
- `DeterministicFixtureGenerator` (`generation/deterministic-fixture-generator.ts`) — reproducible, narrow-capability, never publishable.
- Versioned generation prompt-pack builder (`generation/prompt-builder.ts`).
- `questions:prompt` CLI (`scripts/questions-prompt.mts`).
- Manual/external inbox ingestion (`manual-ingestion/`), a sibling of Mission 2A's `ingestion/`, not a modification of it.
- `questions:ingest` CLI (`scripts/questions-ingest.mts`).
- `manual_external` provenance stamping with independently-resolved generator identity.
- Inbox transaction, crash recovery, replay, and quarantine behaviour.
- PD-7: additive, optional `promptHash` field on `candidateProvenanceSchema`.
- A closed Mission 3A issue-code catalogue (`config/mission3a-issue-codes.ts`).
- 85 new tests (unit + integration), plus two defects found and fixed in already-approved Mission 2B code during integration testing (§9).

**Explicitly not built** (out of scope per the mission brief and `02-prerequisite-decisions.md`): semantic classification/review, external review prompts/ingestion, revision workflow, pipeline runner, originality/difficulty gates, staging, publication, reconciliation, live-provider adapters, automatic harvest import, `questions:generate`/`questions:plan` CLIs (no producer of `blueprints`-compartment records exists yet in this codebase — `questions:prompt` can read one if present, but nothing in Mission 3A writes one).

---

## 2. `QuestionGenerator` public contract

```ts
interface GenerationContext {
  readonly blueprint: Blueprint;
  readonly blueprintHash: string;
  readonly batchId: string;
  readonly pipelineRunId: string;
  readonly promptVersion: string;
  readonly promptHash?: string;
  readonly generatorVersion: string;
  readonly seed?: string;
}

type GenerationOutcome =
  | { status: "generated"; candidateContent; generatorAdapter; generatorVersion; seedUsed? }
  | { status: "unsupported_blueprint"; message: string }
  | { status: "generation_failed"; message: string }
  | { status: "resource_limit_exceeded"; message: string };

interface QuestionGenerator {
  readonly generatorClass: GeneratorClass;
  supportsBlueprint(blueprint: Blueprint): boolean;
  generate(context: GenerationContext): Promise<GenerationOutcome>;
}
```

No repository or filesystem access anywhere in this contract — `generate()` is a pure function of `context` plus its own internal seeded state. Expected failures (unsupported blueprint, resource limit) are returned, never thrown; an unexpected programming error inside an implementation may still throw, and it is the orchestration boundary's job (CLI, or a future pipeline caller) to convert that into a bounded failure — no Mission 3A orchestrator currently needs to, since `DeterministicFixtureGenerator` has no such boundary today (it is not wired into either CLI).

---

## 3. `DeterministicFixtureGenerator` support matrix

| Question type | Subject | Visual type | Reasoning steps | Marks | Supported |
|---|---|---|---|---|---|
| `number_entry` | `numeracy` | none | 1 | ≤ `FACTORY_LIMITS.DETERMINISTIC_FIXTURE_MAX_MARKS` (5) | Yes |
| `multiple_choice` | `numeracy` | none | 1 | ≤ 5 | Yes |
| anything else | — | — | — | — | `unsupported_blueprint` |
| supported type | `numeracy` | none | 1 | > 5 | `resource_limit_exceeded` |

Content is single-step addition/subtraction arithmetic (`"What is {a} + {b}?"` / `"What is {a} - {b}?"`), operand ranges keyed off `blueprint.difficulty` (easy 1–20, medium 10–100, challenging 50–500). Both templates match Mission 2C's `attemptArithmetic` derivation strategy exactly, so fixture output is correctness-gate-passable by construction.

**Determinism.** `seed = context.seed ?? hashJson({blueprintId, batchId, pipelineRunId})`. A seeded mulberry32 stream (`generation/deterministic-random.ts`, FNV-1a-seeded, never `Math.random`) drives every random choice, including option shuffling via an explicit Fisher-Yates shuffle (never `Array.sort((a,b) => rand()-0.5)`, which is not a valid comparator and is not guaranteed replay-stable across engines). The candidate id is itself minted deterministically (`gen-<hash>`, distinct prefix from ingestion's `ing-`/`man-`). Three consecutive calls with identical inputs produce byte-identical `candidateContent` JSON and identical `hashJson` content hashes (tested).

**Publication eligibility.** `generatorAdapter.class` is always `"deterministic_fixture"` — per `provenance/generator.ts` and the Mission 3 contract, this class is refused unconditionally at the (not-yet-built) publication gate under `RepositoryMode.production`. Mission 3A has no publication gate to enforce this against yet; the class value itself is asserted in tests as the only check currently possible.

---

## 4. Prompt-pack contract and prompt-hash design

`buildGenerationPromptPack(batchId, blueprintInputs)` (`generation/prompt-builder.ts`):

- Validates every input blueprint against `blueprintSchema`, and its declared `questionType`/`visualType` against the live renderer/visual registries (`config/allowed-types.ts`) — rejects (`prompt_blueprint_invalid`) before producing anything.
- Canonically sorts accepted blueprints by `id` — pack content and hash are independent of input array order.
- Assembles: `batchId`, `promptVersion`/`schemaVersion`/`taxonomyVersion` (from `FACTORY_VERSIONS`), each blueprint plus its `hashJson(blueprint)`, `supportedQuestionTypes`/`supportedVisualTypes` (sourced from the registries, never hand-duplicated), a response-schema description, one small original JSON example, and ten canonical, fixed-order instruction lines covering Australian English, answer-key/explanation/alt-text requirements, answer-leakage prohibition, structured-visual-JSON-only, originality, a forbidden-source statement, strict-JSON-only, and a no-chain-of-thought instruction.
- Enforces `FACTORY_LIMITS.MAX_PROMPT_PACK_BYTES` (50,000) against the pack's `stableStringify` byte length — `prompt_pack_limit_exceeded` if exceeded.
- `promptHash = hashJson(pack)` — timestamp-independent (the pack carries no wall-clock field), so re-running against an unchanged blueprint set is byte-identical and hash-identical.

`questions:prompt` writes `{pack, promptHash}` to the factory repository's `reports` compartment under a deterministic key `prompt-pack-<batchId>` (via `FactoryRepository.create`, giving atomic-write and duplicate-refusal for free — `--force` is required to overwrite, satisfying the "overwrite refusal unless explicit safe flag" requirement), or to an explicit `--out <path>` file. It never touches candidate/lifecycle state and never contacts an external provider.

`questions:ingest` cross-checks a declared `--prompt-hash`/`--prompt-version` against this stored report (when present) before scanning the inbox, refusing the whole run (`prompt_pack_reference_mismatch`) on a mismatch. This is a soft check: if no matching report exists (e.g. `questions:prompt` was never run for this batch, or the pack was issued outside this repository), ingestion proceeds without fabricating a comparison.

---

## 5. Manual ingestion transaction design

`manual-ingestion/` is a new sibling module, not a modification of `ingestion/` (Mission 2A's legacy-donor adapter — untouched, per PD-3). It shares primitives (`content-hash.ts`, `candidateProvenanceSchema`, the identity table) but has its own parsing/identity scheme.

**Inbox layout** (`content/question-factory/inbox/`, default; `--inbox <path>` overrides):

```
inbox/                 unprocessed drops (direct-child *.json only)
inbox/.processing/     claim markers for an in-flight or crash-interrupted file
inbox/processed/       permanent audit trail (moved, never deleted)
inbox/quarantine/      malformed/unsupported-shape files + bounded reports
inbox/.locks/          global scan lock (O_CREAT|O_EXCL, mirrors FsFactoryRepository)
```

**Transaction, per `questions:ingest` invocation:**

1. Acquire the global scan lock (`ingestion_lock_timeout` on contention).
2. Validate run-level metadata: resolve `--source`/`--model` through the shared `normaliseIdentity` table (`source_identity_invalid` on failure — never falls back to a guessed identity), require non-empty `--prompt-version`, validate `--batch-id`/`--pipeline-run-id`/`--blueprint-id` as factory identifiers, cross-check a declared `--prompt-hash` against a real issued pack when one exists.
3. **Recovery pass** (skipped under `--dry-run`): every file already sitting in `.processing/` from a prior crashed run is reprocessed to completion. Because every downstream step is independently idempotent-replay-safe, "reprocess" always resolves the marker — into `processed/` or `quarantine/` — there is no separate "roll back to inbox" path to design, since a genuinely interrupted run never touched the source file before claiming it.
4. **Scan pass:** list direct children of the inbox root (never recurses into subdirectories — `path_outside_allowed_root` guards against an unsafe file name defensively, though `fs.readdir` cannot produce one). Per file: size check (`inbox_file_too_large`, moved via `fs.rename` without loading the oversized content into memory) → claim (atomic rename to `.processing/<name>`) → parse (`candidate-envelope.ts`) → per-candidate ingest (`ingest.ts`) → move to `processed/` or `quarantine/` (+ bounded report).
5. Release the lock.

`--dry-run` never claims/renames anything — files are read in place and `ingestOneCandidate` skips every repository write, so the inbox and repository are provably unchanged (tested).

**Parsing (`candidate-envelope.ts`).** Top-level JSON must be a single object or an array of objects — anything else (`unsupported_candidate_shape`) or unparseable JSON (`malformed_candidate_json`) quarantines the *file*, never crashes the run. A parseable-but-internally-incomplete candidate object (missing `prompt`, `answerKey`, etc.) is **not** quarantined — it proceeds to `generated` and is left for the structural-validation gate to reject with a precise, type-specific issue code (tested end-to-end).

**Identity injection.** Mirroring Mission 2A's `ingest.ts`: the candidate's internal `id` field is minted by this adapter, never trusted from the source content, and injected before the content hash is computed. When the (id-injected) content already satisfies `candidateQuestionSchema` (Mission 2A's shared preflight shape), the *parsed* value — with its schema defaults filled in — is what gets stored, so a later structural-validation re-parse recomputes an identical hash. When it does not satisfy that schema, the raw object is stored as-is (still hash-consistent with itself) and structurally rejected downstream, exactly as designed.

---

## 6. Provenance and identity-normalisation behaviour

Every successfully ingested candidate's `CandidateProvenance` carries: `candidateId`, `blueprintId` (declared, or the fixed placeholder `manual-ingestion-unblueprinted`), `batchId`, `pipelineRunId`, `revision: 0` (revision workflow is out of scope — Mission 3A never supports a declared `parentCandidateId`), `generatedAt`, `generatorAdapter: {class: "manual_external", identity}`, `generatorVersion`, `promptVersion`, optional `promptHash` (PD-7), `schemaVersion`/`taxonomyVersion`, `contentHash`, empty `reviewRecords`.

**Identity.** `--source chatgpt|qwen|claude|other` resolves through the shared `IDENTITY_ALIAS_TABLE` (`config/identity-normalisation.ts`, unmodified — populated from a real external source for the first time). `--model` overrides the source's own canonical alias (optional for the three named sources, **required** for `other`). An unresolvable identity fails the entire run closed (`source_identity_invalid`) before any file is touched — never a silent `"other"` fallback.

**No trust from source labels.** There is no "verified"/"reviewed" flag anywhere on the manual-ingestion input schema. A donor-style `status`/`origin` field present in dropped content has zero effect on trust, lifecycle placement, or provenance (tested) — `generatorAdapter.class` is always `"manual_external"`, fixed by the adapter, never derived from the input.

---

## 7. Replay and partial-failure handling

Candidate identity is `man-<hash(sourceFileName, batchId, pipelineRunId, indexInFile, sourceContentHash)>` — content/batch/file/index-derived, never filename-alone-derived and never a claim the source content gets to make.

| Scenario | Behaviour |
|---|---|
| Same file ingested twice (identical bytes) | First run processes and moves it to `processed/`; a second literal re-drop of the same bytes under the same name mints the same id and is a safe no-op replay (`replay: true`, `written: false`). |
| Reused file name, different bytes | Different `sourceContentHash` → different candidate id → an independent, successful create. Never a false replay, never a spurious conflict. |
| Byte-identical content copied under a different file name | Different `sourceFileName` → different candidate id → two independent, successful creates. No deterministic file name is ever treated as identity proof; deduplicating true content duplicates is the (not yet built) originality gate's job. |
| Same minted candidate id, genuinely different content (a hash collision, or an out-of-band repository edit) | Refused (`candidate_conflict`), never silently overwritten. Exercised directly in tests by pre-seeding a colliding record, since natural re-ingestion cannot reach this path by construction. |
| Process interrupted after claim, before completion | `.processing/<file>` marker recovered on the next run — reprocessed to completion (`processed/` or `quarantine/`), reported `recovered: true`. |
| Partial multi-candidate file (array with one bad element) | Each element ingested independently; one rejection never blocks the rest, and the file itself is still moved to `processed/` (it parsed correctly — only one *candidate* failed). |
| Dry run | Zero repository writes, zero inbox mutation, fully simulated. |
| Repository/scan lock held | `ingestion_lock_timeout`, deterministic, no partial state. |

---

## 8. Quarantine behaviour

Malformed JSON, an unsupported top-level shape, or a file exceeding `FACTORY_LIMITS.MAX_INBOX_FILE_BYTES` (2,000,000) is moved (`fs.rename`, atomic) from wherever it was claimed into `inbox/quarantine/`, alongside a bounded `<file>.quarantine-report.json` (`{fileName, issueCode, message, contentPreview (≤200 chars), quarantinedAt}`). The active inbox never re-picks up a quarantined file. A quarantined file never crashes the run — every parse failure is a structured result, not a thrown exception.

---

## 9. Two pre-existing defects found and fixed during integration testing

Building the full "prompt pack → ingestion → structural validation → correctness verification" integration test (§11) surfaced two real, latent defects in already-approved Mission 2B code, neither previously caught because no existing test exercised the real end-to-end orchestrator chain (Mission 2B/2C's own tests hand-construct `review-queue` records with the correct `state` already set, bypassing `orchestrateStructuralValidation` entirely):

1. **`orchestrateStructuralValidation` never stamped the relocated record's own `state` field.** `FactoryRepository.move()` relocates bytes verbatim; nothing rewrote `state: "generated"` to `"structural_validation_passed"` before/after the move. Mission 2C's `orchestrateCorrectnessVerification` explicitly requires `candidate.state === "structural_validation_passed"` (to distinguish it from `"correctness_check_passed"`, since both live in the same `review-queue` compartment) — every real candidate that passed structural validation would have been permanently rejected as `invalid_lifecycle_state` at the correctness gate. **Fix:** stamp the relocated record's `state` field via `repository.update()` in the destination compartment, immediately after a successful `move()` (not before, in `generated` — that ordering would have broken the existing partial-failure-retry path, which depends on `state === "generated"` still holding while the candidate remains physically in `generated`). Idempotent, replay-safe, and verified not to regress any existing Mission 2B/2C test (all 776 pre-existing question-factory tests still pass).
2. **Content-hash binding required parsed-with-defaults content, not raw content.** `checkContentHashBinding` recomputes `hashJson` over the *schema-parsed* `CandidateQuestion` (with Zod defaults like `metadata.tags: []` filled in) and compares it to the stored `provenance.contentHash`. Storing the raw, unparsed candidate content (as manual ingestion initially did) produced a hash mismatch on every structurally-valid candidate. **Fix:** described in §5 — store the schema-parsed value (when parseable) and hash that, mirroring Mission 2A's own `ingest.ts` pattern exactly.

Both fixes are narrow, additive, and covered by the full existing Mission 1–2C regression suite plus the new Mission 3A tests.

---

## 10. Issue-code catalogue (`config/mission3a-issue-codes.ts`)

**Generation:** `unsupported_blueprint`, `generation_failed`, `generation_resource_limit_exceeded`, `generated_candidate_invalid`.
**Prompt:** `prompt_blueprint_invalid`, `prompt_pack_limit_exceeded`, `prompt_output_exists`, `prompt_write_failed`.
**Ingestion:** `inbox_file_invalid`, `inbox_file_too_large`, `malformed_candidate_json`, `unsupported_candidate_shape`, `source_identity_invalid`, `prompt_metadata_missing`, `prompt_pack_reference_mismatch`, `candidate_conflict`, `ingestion_replay_mismatch` (reserved), `inbox_cleanup_failed` (reserved), `quarantine_write_failed` (reserved), `ingestion_lock_timeout`, `path_outside_allowed_root`, `ingestion_batch_limit_exceeded`, `inbox_file_limit_exceeded`.

Every code is a fixed enum member; candidate-specific detail lives in the associated message, never interpolated into the code itself.

---

## 11. CLI usage

```bash
# Build a prompt pack from a blueprint file, write it as a report, print a JSON summary.
tsx scripts/questions-prompt.mts --blueprint path/to/blueprint.json --json

# Build one from a blueprint already in the repository, or a whole batch.
tsx scripts/questions-prompt.mts --blueprint-id bp-001
tsx scripts/questions-prompt.mts --batch-id batch-001

# Print the full pack to stdout instead of writing a report; write to an explicit path.
tsx scripts/questions-prompt.mts --blueprint-id bp-001 --stdout
tsx scripts/questions-prompt.mts --blueprint-id bp-001 --out ./pack.json --force

# Ingest everything currently in the inbox.
tsx scripts/questions-ingest.mts --source claude --batch-id batch-001 --prompt-version v1

# With prompt-hash cross-check, an explicit model, and a dry run.
tsx scripts/questions-ingest.mts --source other --model gpt-4o --batch-id batch-001 \
  --prompt-version v1 --prompt-hash <hash> --dry-run --json
```

Package scripts: `npm run questions:prompt -- <args>`, `npm run questions:ingest -- <args>`.

**Exit codes.** `questions:prompt`: 0 ok, 1 internal, 2 invalid args/blueprint, 4 not found, 5 output already exists. `questions:ingest`: 0 clean, 1 internal, 2 invalid request, 3 partial (some file quarantined or candidate rejected — the run itself completed), 9 lock timeout. Both accept `--json` for a single machine-readable stdout line; human mode is the default. Neither ever reads stdin.

---

## 12. Tests

85 new tests across 5 files, all passing; full repository suite 1237/1237 passing after this work (776 pre-existing question-factory tests unaffected).

| File | Count | Covers |
|---|---|---|
| `provenance-prompt-hash.test.ts` | 6 | PD-7 schema acceptance/rejection, boundary length, repository round trip. |
| `generation-deterministic-fixture.test.ts` | 21 | Contract shape, capability detection, unsupported/resource-limit outcomes never throwing, three-run determinism, content-hash determinism, seed-default vs. explicit-seed behaviour, schema validity, Australian English, no production-bank access, provenance, publication-class assertion. |
| `generation-prompt-builder.test.ts` | 22 | Determinism, canonical ordering, hash binding, version binding, every required instruction present, rejection paths (invalid blueprint, unsupported type/visual, empty batch, size bound). |
| `manual-ingestion.test.ts` | 30 | Identity resolution, happy path (single + array), provenance completeness, inbox-move-after-persistence, donor-field trust immunity, malformed/unsupported-shape quarantine, missing-field-reaches-structural-rejection, partial multi-candidate independence, replay idempotency, pre-seeded conflict refusal, reused-filename and copied-file identity behaviour, `.processing/` recovery (both clean and malformed), size/batch limits, dry-run isolation, path-safety (no subdirectory descent), request-level validation (including prompt-pack reference mismatch/match). |
| `mission3a-integration.test.ts` | 2 | Full chain: prompt pack → external-style fixture → `questions:ingest` → `manual_external` provenance → `generated` → structural validation → correctness verification, stopping before any Mission 3B+ gate; and a same-blueprint fixture-vs-manual-external gate-parity proof. |

---

## 13. Limitations

- No `questions:plan`/`questions:generate` CLI exists in this codebase; `questions:prompt --batch-id`/`--blueprint-id` read from the `blueprints` repository compartment, which nothing currently writes to in production use (only test fixtures populate it directly). This is a real, working read path, just currently unreachable from a CLI-only workflow until a future mission (or ad hoc tooling) writes blueprints there.
- `DeterministicFixtureGenerator` supports exactly two question types (`number_entry`, `multiple_choice`), numeracy only, single-step arithmetic. This is deliberate (contract §4: "a closed, explicitly enumerated set... the same subset Mission 2C's correctness verifier already classifies as deterministically_verifiable"), not a shortcut.
- The inbox scan lock (`inbox/.locks/scan.lock`) is a new, Mission-3A-only primitive (mirroring `FsFactoryRepository`'s existing lock pattern) — it serialises whole `questions:ingest` invocations against each other but is independent of the per-candidate locks `FactoryRepository.create`/`move`/`update` already use.
- Manual ingestion does not support a declared `parentCandidateId` — the revision workflow (§10 of the contract) is Mission 3C's, not 3A's.
- `questions:ingest`'s prompt-pack cross-check only fires when a matching report was actually written by `questions:prompt` in this repository; it cannot detect a fabricated prompt hash for a pack that was genuinely never issued through this tooling (by design — it is a real cross-check against real evidence, not a proof of non-existence).

## 14. Mission 3B–3E status

Not started. No semantic-review, external-review, revision, pipeline-runner, originality, difficulty, staging, or publication module exists anywhere in this branch. `src/content/questions/` (the production bank) and the harvested-content scratch directory are untouched and unimported by any code in this mission.

## 15. Audit status

**This branch is frozen for independent Codex audit of Mission 3A.** Nothing in this document constitutes Mission 3A approval — per the contract, only Codex may approve it.
