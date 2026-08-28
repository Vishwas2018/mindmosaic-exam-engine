# Manual Authoring and Import Contract

Manual authorship skips generation only. One item, NDJSON/JSON batches, and safe CSV imports converge on the canonical v2 envelope and all remaining gates.

Use `mm-content batch create --origin manual_owner`, then `mm-content import <file> --batch <id> --dry-run`. JSON may contain one envelope or an array; NDJSON contains one envelope per line. CSV intentionally requires a `canonical_json` column in Phase 1 so nested answer, interaction and visual information cannot be silently flattened. Every import retains its raw-input hash and report; the batch idempotency key prevents duplicate retries.

Asset references use an import mapping resolved to immutable asset UUID/revision/hash triples. Missing, ambiguous or unsupported mappings fail closed. Direct database editing is not an authoring workflow.
