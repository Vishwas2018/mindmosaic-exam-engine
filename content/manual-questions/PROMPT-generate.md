# OPERATOR PROMPT — serial GENERATOR

Paste this to whichever model is generating (Codex or Qwen). It picks the next needed batch,
generates one full set, runs machine gates, logs it, and hands off. It does NOT audit its own
work. Run it again for the next batch.

Authoritative references in the repo (read them, don't guess):
`content/manual-questions/GENERATION-SPEC.md` (the schema/contract),
`content/manual-questions/REVIEW-PIPELINE.md` (the process),
`content/manual-questions/BATCH-LOG.md` (the audit ledger).

---

## STEP 0 — read the ledger first
Open `content/manual-questions/BATCH-LOG.md`. You will append to it in Step 4. Note which
batches already exist and who generated each, so you never regenerate an existing batch and
never collide with the other model's work.

## STEP 1 — pick the next job (no questions to the human)
Scan `content/manual-questions/**`. For each programme count NON-placeholder batch files
(`*-bNN.json`, excluding `*-b00-PLACEHOLDER.json` and `*.audit.json`). Walk this PRIORITY
ORDER top to bottom; select the FIRST programme with fewer than 3 such batches that is not
already logged as in-progress by the other model:

```
1 icas-y5-spelling      2 icas-y5-numeracy      3 naplan-y5-reading
4 naplan-y5-language    5 icas-y5-reading       6 icas-y5-language
7 icas-y5-science       8 icas-y5-digital_technologies   9 naplan-y5-numeracy
10 naplan-y3-language   11 naplan-y3-numeracy   12 naplan-y3-reading
13 icas-y3-numeracy     14 icas-y3-science      15 icas-y3-digital_technologies
16 icas-y3-reading      17 icas-y3-language     18 icas-y3-spelling
```

Next batch code = highest existing `bNN` + 1 (`b01` if only the placeholder exists). State the
programme and batch you selected, and why, before generating.

## STEP 2 — generate one full set
Follow GENERATION-SPEC.md exactly for that programme: the section-2 size and difficulty split,
allowed types, visual quota, exact strand tokens, blueprint calibration, hard bans,
answer-position balance, and single-defensible-answer rule. Write ONE file at the canonical
path (nested under the exam folder):
```
content/manual-questions/grade-<3|5>/<naplan|icas>/<slug>/<slug>-<batch>.json
```
Set `batchSelfReport.reviewStatus = "generated"` and record `generatorModel: "<you>"`.

## STEP 3 — machine gates (before handoff)
Run and record in `batchSelfReport.machineGates`: schema validation; duplicate check (ids,
normalised prompts, stimulus bodies, visual data, answer structures, normalised maths
templates — within the batch AND against existing files in the folder); answer-position
balance; `npm run check:answers` over this file. Fix and re-run until all green, then set
`reviewStatus = "gates_passed"`. `check:answers` cannot judge conceptual items — passing it is
necessary, never sufficient.

## STEP 4 — log it, then hand off
Append ONE row to `content/manual-questions/BATCH-LOG.md` (append only — never edit an existing
row):
`| <date> | <slug>-<batch> | generated | <you> | <count>q; gates_passed |`
Do NOT audit your own batch. Do NOT promote. Report the file path, the batchSelfReport, and
that it is ready for a DIFFERENT model to audit.

## Prohibitions
Run no git commands. Never write to `src/**`, `_promoted/`, another model's in-flight folder,
or a flat `grade-<n>/<slug>/` path. Never set `pass` or `ready_for_final_review` yourself —
that is the auditor's and Claude's job.

---

## REQUIRED header (added 2026-08-10)
Your batch file MUST begin with a `batchMeta` object as its first key (see GENERATION-SPEC.md
"batchMeta provenance header"). Set `generatedBy` to YOUR real model name (codex/qwen/mistral),
never `claude`, and `reviewStatus: "generated"`. This is how the ledger and the auditor know
who made the batch — an honest, correct `generatedBy` is what enforces the cross-model rule.
