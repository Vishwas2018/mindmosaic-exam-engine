# Approving MindMosaic content

All programmes start in **report** mode: missing approvals are reported while existing practice stays available. Approval is your decision; a machine check or a generated review sheet does not approve anything.

## 1. Generate a batch

From the repository, choose a programme ID shown by `npm run programmes:readiness`, then run:

```sh
npm run content:review-sheet -- --programme naplan-y3-numeracy --limit 25
```

The command prints paths to an HTML page and a CSV in `content/question-factory/reports/human-approval/`. Open the HTML in your browser and the CSV in your spreadsheet app. Keep these files private because the page includes answers and explanations. Each batch has a new filename and contains at most 25 questions.

For newly staged questions, add `--candidate-ids <comma-separated-ids>`. Their HTML page gives the matching `questions:publish` command; use that governed publication route after review.

## 2. Check every question

Solve it before relying on its answer key. Check that the answer is unambiguous, the explanation is sound, and the visual agrees with the question. Check originality against any sources you used: no copied official, textbook, website or commercial items. Check vocabulary, reading load and difficulty for the stated year level. A machine-verifiable label covers a calculation; you still decide all three checks.

## 3. Fill in the CSV

Keep `questionId`, `contentHash`, `revision` and `sourceManifestHash` unchanged. For each row:

- Enter `yes` in `correctness`, `originality` and `ageAppropriateness` only after checking each criterion.
- Set `decision` to `approve`, `reject` or `revise`. Leave it blank for questions you have not reviewed.
- Use `notes` to explain a rejection or requested revision. Save as CSV.

An `approve` row needs all three checks. `reject`, `revise` and unreviewed rows create no approval record. Keep your reviewed CSV as your record of those decisions. If the question changes, generate a fresh batch and review it again.

## 4. Record your approvals

For existing published questions, run:

```sh
npm run content:record-approvals -- --sheet "<reviewed.csv>" --reviewer "<Your Full Name>"
npm run content:verify-publication
npm run audit:bank
```

The recorder validates the whole sheet before writing. It refuses missing reviewers, incomplete approval checks, stale hashes and duplicate targets. Matching approvals already recorded are left unchanged. Review and commit the new files in `content/publication-approvals/` through a PR. Recording evidence does not itself migrate or change a hosted database.

## 5. Switch one programme to enforce later

First finish its approvals and check the audit/readiness reports for sufficient approved coverage. Have an engineer prepare a reviewed PR setting that programme to `"enforce"` in `PROGRAMME_PUBLICATION_MODES` in `src/features/content-governance/gate-config.ts`, together with a later database migration setting its `publication_gate_settings.enforced` value to `true`.

Test both settings together locally using `npm run programmes:check-gates` and the full CI suite. After your release approval, apply the matching database setting and source release through the normal rollout process. Enforce mode requires matching revision-bound approvals for new allocations. Existing sessions, results and marking rubrics remain readable. To return to report mode, coordinate `"report"` in source with `enforced = false` in the database.
