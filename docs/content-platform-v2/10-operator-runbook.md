# Operator Runbook

Use the unified `npm run mm-content -- <command>` surface. It delegates to domain services; old `questions:*` scripts remain compatibility entry points during migration.

Typical flow: `inventory`; `blueprint gaps`; `batch create --origin ...`; `generate-next-batch`; `assets add`; `import --dry-run`; `batch validate`; export/import opposite-agent review; `batch status`; inspect risk/sample; `approve`; `publish --dry-run`; `forms build`; `forms readiness`; `export`; `backup verify`; `history`; `audit`.

Never use service credentials in browser code or directly edit content tables. Keep batches around 25-50 generated or up to roughly 100 manual imports. Publication is dry-run by default unless an explicit authenticated owner-approved execution flag is supplied. Run typecheck, lint, tests, RLS tests and build before publication.
