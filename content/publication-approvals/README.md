# Human publication approvals

No historical signatures are inferred or generated. All programmes currently use report mode, which preserves the existing learner bank while showing approval coverage. Enforce mode excludes unapproved revisions for that programme only.

Run `npm run content:review-sheet -- --programme <id> [--skill <skillId>] [--limit 25]` to produce a private HTML review page and CSV under the ignored `content/question-factory/reports/human-approval/` directory. The page shows the learner question and visual, answer, explanation, year, skill and machine-check status. A reviewer must check correctness, originality and age appropriateness, choose approve/reject/revise, and provide their full name. `content:approval-queue` remains available for individual JSON packets.

Run `npm run content:record-approvals -- --sheet <reviewed.csv> --reviewer "<full name>"` or `npm run content:record-approval -- --packet <reviewed.json>` to verify current content and create immutable approvals here. Recording time is assigned when the command runs. A stale hash, missing check or duplicate approval target rejects the batch before a write. New factory publications require a reviewed sheet or packet and carry revision-bound approval within their manifests.

These records contain private authoring content. They must never be served as learner DTOs, placed in `public/`, or used as metadata. Hashes are tamper evidence within the trusted Git authoring workflow, not cryptographic proof of a person's identity. Human review and protected code review remain mandatory.

Writing prompts use the same record, reviewer rules and verifier as a second `kind` (`human_writing_prompt_approval`). Produce the sheet with `npm run content:review-sheet -- --writing`; `content:record-approvals` writes each approved prompt to `writing-prompts/<promptId>.json` here, with a snapshot of the exact prompt a child is served. See `content/writing-drafts/README.md`. The question loaders read only the `.json` files in this folder, so the subfolder does not affect them.

## Do not remove this folder's anchor files

`README.md` and `.gitkeep` are not decoration. This folder holds no approval `.json` yet, so those two files are the only thing the production build traces into the deployment bundle (`outputFileTracingIncludes` in `next.config.ts` matches files, not directories). If the folder is not in the bundle, `servedBank()` finds no evidence directory, treats it as an evidence problem and serves an **empty bank for practice, published and curated alike**: a total content outage. Never delete both, and never "tidy" `.gitkeep`. `src/tests/unit/publication-approvals-anchor.test.ts` fails CI if the tracing glob would match nothing.
