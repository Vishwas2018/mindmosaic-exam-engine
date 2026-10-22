# Legacy content provenance — Phase 1

## Scope and trust boundary

This implementation is isolated on `feat/legacy-content-provenance` from `origin/dev` at `82987b74e427cb367ebfcf7b880e1116fe3e178b`. PR #73 and its question revisions, source register and review artifacts are read-only reference evidence at `dcb60a80f3f6eabdb522b20202929d2e3f328a94`. No real ingestion, staging, publication, approval, deployment or historical provenance rewrite is part of Phase 1.

The importer establishes source **integrity and repository import**, not original authorship or authenticated provider provenance. Git object IDs and SHA-256 pins prove which bytes were read from an operator-selected local Git repository. Matching `origin` configuration is checked but is not remote-server authentication: an arbitrary local Git config is not an authoring certificate. The caller must intentionally pin the manifest's raw SHA-256. Neither a schema-valid record nor a matching manifest hash is a publication approval.

## Schema

`candidateProvenanceSchema` is discriminated by `kind`. Existing records without a discriminator remain valid known-generation records with their existing field behaviour and diagnostic paths. Explicit `kind: generated`, provenance version 1 is also supported. Existing records are not rewritten. Known-generation constructors retain non-null identity types.

The new strict variant is `kind: legacy_import`, `provenanceVersion: 2`:

- `generatorAdapter: { class: legacy_import, identity: null }`; generation compatibility fields `generatedAt`, `generatorVersion`, `promptVersion` and `promptHash` are null.
- `originalGeneration` explicitly records status `unverified`; provider, model, prompt, prompt hash, generation timestamp and execution event are null. Scoped evidence references and limitations are required. An event/model/provider injected into this variant is rejected.
- `repositoryImport` separately stores the transaction's actual `importedAt`, fixed importer name/version, nullable operator identity, source repository/commit/path/blob and packet SHA-256, raw-question hash, original candidate hash, actual factory candidate hash, publication hash, blueprint binding, review-packet binding, transformations, manifest hash and transaction ID.
- The importer leaves operator identity null: this CLI does not authenticate a person or accept an unverifiable operator flag. No import timestamp becomes a generation timestamp.
- Initial factory revision is 0, independent of repository edit counts or the sample's authoring amendment number. The existing revision adapter refuses a legacy parent, so assigning a later editor cannot erase unknown origin.
- Each optional solver-sidecar transformation binds its exact before/after candidate hashes and sidecar hash. It may change `solverParams` only and must preserve canonical publication content. The two sample transformations are explicit; the original advisory candidate hashes remain separately recorded.

Strict reserved fields prevent a malformed legacy variant from falling back to the older schema while dropping its original-generation/import fields. Import metadata/content/blueprint identity mismatches are rejected. Legacy source paths reject absolute, traversal, backslash and control-character forms.

## Governance paths

Identity comparisons accept a null/missing generator only to return **false**. Placeholder `unknown`, `unverified` and `legacy-unknown` identities also fail independence; no unknown provider alias is added. Known identity comparisons retain their existing behaviour.

Structural validation requires the exact imported blueprint hash and the existing content, taxonomy, production-schema, scoring, visual and leakage checks. Correctness remains generator-agnostic; the regression suite demonstrates first-party deterministic correctness on a legacy candidate. The remaining existing gates are not replaced by import preflight.

Semantic evidence helpers propagate a null generator and cannot qualify a production-grade independent review. External review ingestion refuses legacy candidates before any append; the production review-prompt CLI refuses to issue a misleading independent-review pack. Independent-review completion evidence cannot borrow a valid known-generator chain. Deterministic semantic skipping retains its existing meaning and is not a publication exception.

The common upstream staging/publication gate explicitly refuses all legacy imports in Phase 1. Staging replay, publication eligibility, publication replay, publication-manifest validation and bank assembly also refuse the legacy variant. Malformed staged provenance is refused rather than acknowledged as a successful replay. A stored advanced state, manufactured review chain, human approval or deterministic proof does not bypass this hold.

The old human/Claude import and staging scripts are not used by the new path. No existing approval, provenance, release identity or question content is rewritten.

## Dedicated command

```sh
npm run questions:import-legacy -- --manifest <manifest.json> --expected-manifest-sha256 <exact-raw-file-sha256> --dry-run
```

No-write preflight is the default. `--apply` is mutually exclusive with `--dry-run` and is required to write anything. It is implemented and tested in isolated synthetic workspaces but **must not be executed on real content during this phase**. `MINDMOSAIC_QUESTION_FACTORY_ROOT` selects the existing factory workspace override; `--repository` selects the source Git root. No source code is executed. Missing Git objects, including in a shallow checkout, are an explicit failure; there is no working-tree fallback. Recover the exact referenced Git objects through a read-only fetch before a future preflight.

The complete manifest is strictly parsed and hash-pinned before processing. Preflight:

1. Validates register identity/coverage and every source commit, safe path, Git blob and raw SHA-256.
2. Re-parses the exact source candidate and verifies raw-question and original candidate hashes against the source register.
3. Applies only an explicitly declared solver-sidecar transformation and verifies the resulting candidate/publication hashes; publication must agree before and after enrichment.
4. Verifies the immutable blueprint, taxonomy-compatible binding and the workspace's actual blueprint record.
5. Checks the exact answer-withheld review-packet projection. This establishes which question was supplied, not that an old review qualifies as a new factory review.
6. Uses only `inspectRecord` across every compartment, never repair-capable `read`, to detect malformed records, collisions, duplicate physical records, reserved report IDs and mismatched existing imports. No directory, lock, report, metadata or quarantine entry is created.

## Transactions and audit trail

Apply first re-runs the full preflight without writes. It then acquires an exclusive workspace legacy-import lock and rechecks all bindings under that lock. Lock ownership includes a token, process ID and acquisition timestamp; no stale lock is stolen automatically. Ordinary repository creates now use the existing per-candidate lock, preventing racing creates from overwriting the same candidate. Trusted-report reservations are checked before taking any lock.

A durable prepared journal precedes every candidate create. It carries the full canonical manifest, immutable manifest hash, actual transaction timestamp and expected record fingerprints. Each generated candidate carries the corresponding transaction ID and complete source/import facts, with empty review records. The committed journal is written only after every candidate is present. The journal and candidate creation use atomic temporary-file renames; journal writes are synced before rename.

This is a **resumable generated-only batch transaction**, not an all-or-nothing rollback. A failure after some successful creates leaves those generated records and the prepared journal intact. Retrying the identical manifest validates them and creates only the missing records. Changed manifests, provenance, timestamps or records are conflicts. A committed transaction with missing records is refused. Existing downstream records may be acknowledged only when their immutable import provenance still agrees; they are never reset or copied backwards. A successful replay does not rewrite the committed journal or import timestamp.

If a crash occurs between a candidate data write and its storage metadata write, retry fails closed with `legacy_metadata_recovery_required`; it does not claim the transaction complete. An authorised maintainer must inspect and reconcile that specific journal/data/metadata discrepancy before retrying. Similarly, a process crash leaving a lock requires inspection of the recorded owner and transaction; automated deletion, lock stealing and destructive rollback are deliberately absent. No crash path stages or publishes anything. This boundary follows the existing filesystem repository's durability model; it is not a distributed database transaction or a guarantee against arbitrary privileged filesystem tampering.

## Tests, fixtures and artifacts

The 12-candidate source register and question payloads are frozen read-only test input. Tests materialise a **synthetic Git repository and disposable factory workspace**; their synthetic Git/import events are not original generation evidence. Packet fixtures are reduced to the twelve selected questions, so test Git identities intentionally differ from the reference's full packet blobs. The real no-write report uses the full original Git objects instead.

Deliverables are in `docs/reviews/legacy-content-provenance-phase1/`: a pinned sample manifest, real 12-item preflight results, a clearly labelled schema-valid synthetic record, changed-file inventory and verification report. The synthetic example's fake Git objects must fail real preflight; it is not a source-verified import record or a created factory candidate.

## Remaining policy decision and sequence for PR #73

Phase 1 does **not** resolve independent-review eligibility for unknown-origin material. The unresolved policy is whether and under what independently reviewed evidence such material may ever clear the provenance/independence hold, including deterministic content. No waiver or human approval override is implemented.

Recommended sequence: review this isolated implementation and its draft PR; keep PR #73 draft and untouched; merge only through the owner's normal process after green CI and explicit authority; then separately authorise any real legacy import. Revalidate all 12 source/register/packet/blueprint bindings against the exact chosen PR #73 revisions and retain both original and solver-enriched candidate hashes. Create only truthful import records through the dedicated command. Run genuine structural/correctness and subsequent gates. Resolve and implement any unknown-origin review policy before claiming eligibility, issue genuinely bound review prompts when permitted, and generate human approval sheets only from genuinely staged revisions. Publication, merge and production rollout remain distinct owner-controlled decisions. Any content change requires new hashes and review evidence.
