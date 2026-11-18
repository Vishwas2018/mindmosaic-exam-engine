# AGY scholarship draft isolation

PR 142's first commit changed 480 existing expansion identifiers to the namespace later used by the separate 500-record AGY draft. All 480 overlapping identifiers refer to different question content. The clean base retains the 480 original expansion identifiers and 20 pilot identifiers. Those 500 canonical identifiers are disjoint from the 500 AGY draft identifiers. The runtime serves 499 canonical records because an existing withdrawal excludes one.

The `core` job failed during `test:ci`. The expansion suite rejected the rewritten identifiers, and four assertions across the withdrawn-question and diagnostic/progress suites failed after the expansion failed closed. The draft isolation branch starts from clean `dev` and changes only the AGY validation tooling in this directory.

## Private review workflow

Keep the archived bank and its replacement mock bundle in an access-controlled directory outside all Git worktrees. Run this command from the repository root with paths to those copies.

```text
node --import tsx scripts/reviews/agy-20261119-reconciliation/validate.mts --bank <private-bank-directory> --mocks <private-mock-bundle>
```

The command reads the archive without modifying it. It checks the canonical draft schema, unique identifiers, quotas, answer positions, arithmetic consistency, and internal stem similarity. Its console report contains aggregate counts and schema error paths. The similarity screen compares normalised exact text, token overlap, and identical wording after masking numbers. A human reviewer must solve the items from their stems, review their difficulty, and sign off through the existing content governance process.

Use the original expansion records and manifests from `dev` and retain the AGY archive as a separate draft. Treat every previously committed mock as exposed. Use the replacement forms through the private review process. This tooling has no publishing or import step.

Run the tooling regression tests with:

```text
node --import tsx --test scripts/reviews/agy-20261119-reconciliation/validator.test.mts
```
