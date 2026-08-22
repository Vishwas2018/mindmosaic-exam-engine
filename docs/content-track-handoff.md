# Content Track — Handoff & Context (banded question generation)

> For a standalone ChatGPT session running the content-generation track. Self-contained:
> everything needed to generate is here. This track is INDEPENDENT of the database cutover —
> it is pure question-content work in the question factory and never touches src/, supabase/,
> scripts/, or the assessment cutover.

## 1. Mission

Grow the MindMosaic question bank so **adaptive testlet routing** (the "questions rise in
difficulty as the student answers" feature) has enough content per cohort × difficulty band.

**Target (ADR-007-derived, accepted 2026-08-21 — supersedes this doc's earlier placeholder
"50 sittings / ≥24 per cell" target):** [ADR-007](adr/007-fixed-path-vs-adaptive-mst-delivery.md)
derives the actual required depth from the accepted MST parameters (6 items/stage, thresholds
0.4/0.6) as two floors stacked on each other, band-specific rather than a flat number:

- **NEAR-TERM (pilot-ready — this effort's target):** the worst-case single-sitting,
  non-degrading floor at `itemsPerStage = 6` — **12 easy / 18 medium / 12 challenging** per
  `(year, style, subject)` cell. A cell at this depth can run one adaptive sitting, for any
  student path, without the router ever degrading. This is the number to act on now.
- **LONG-TERM (aspirational — not a near-term commitment):** the full spec §13.2 50-sitting
  no-repeat guarantee, conservatively assuming every sitting independently hits the worst
  case — **600 easy / 900 medium / 600 challenging** per cell (50× the near-term floor). No
  cohort measured today is within an order of magnitude of this.
- Difficulty bands are exactly three: **easy | medium | challenging**.

## 2. Status (measurement + planning done; nothing generated yet)

A census was taken over the gated served bank plus independently-accepted, not-yet-served
manual batches. Rejected/quarantined batches are excluded; promoted batches are not
double-counted. No repo or DB changes were made.

**Authoritative source:** `scripts/out/capacity-report.json` (regenerate read-only with
`npm run capacity:report`) is now the ranked, reproducible source of per-cell counts and
supersedes the frozen manual census this doc originally shipped with. §3 below is derived
from it, filtered to the ADR-007 12/18/12 floor rather than the report's own default
(a uniform, unrelated 50-per-band placeholder target) — re-derive by hand if the report is
regenerated and counts have moved.

## 3. Near-term worklist — Year-5 cells that do NOT yet clear 12/18/12

All **9 Year-3 cohorts** (both styles, every subject) and **ICAS Y5 numeracy** already clear
the 12/18/12 floor in every band and need no near-term work. The remaining **8 Year-5
cohorts**, ranked by total shortfall (sum of gaps across bands):

| Style | Subject | easy (have/floor) | medium (have/floor) | challenging (have/floor) | total gap |
| --- | --- | --- | --- | --- | ---: |
| ICAS | science | 0/12 (gap 12) | 0/18 (gap 18) | 0/12 (gap 12) | 42 |
| ICAS | language | 0/12 (gap 12) | 4/18 (gap 14) | 9/12 (gap 3) | 29 |
| ICAS | reading | 0/12 (gap 12) | 6/18 (gap 12) | 12/12 (clear) | 24 |
| NAPLAN | language | 21/12 (clear) | 16/18 (gap 2) | 3/12 (gap 9) | 11 |
| NAPLAN | numeracy | 36/12 (clear) | 52/18 (clear) | 3/12 (gap 9) | 9 |
| NAPLAN | reading | 9/12 (gap 3) | 41/18 (clear) | 6/12 (gap 6) | 9 |
| ICAS | digital_technologies | 11/12 (gap 1) | 16/18 (gap 2) | 8/12 (gap 4) | 7 |
| ICAS | spelling | 14/12 (clear) | 20/18 (clear) | 11/12 (gap 1) | 1 |

**Highest-priority gaps:** ICAS Y5 science (whole cohort empty of countable content, gap 42 —
same finding as the prior census), ICAS Y5 language (gap 29, empty at *easy*), ICAS Y5 reading
(gap 24, empty at *easy*). Everything below ICAS Y5 digital_technologies is a small top-up (≤ 9
items) rather than a real generation effort.

**Do NOT generate:** NAPLAN science and NAPLAN digital technologies — they are not defined
programmes in GENERATION-SPEC.md. NAPLAN does not have a `language`/`reading`/`spelling`
row in the fill plan below because those are covered by the near-clear/clear rows above with
only single-digit top-ups needed, not a dedicated batch.

**Authored-content caveat:** Y5 science has ~120 authored questions written before this effort
(canonical b01/b02 plus a flat-path conflict), but they are **all excluded** — b01/b02 carry
reject outcomes in the ledger, were never reconciled, and must not be treated as routing depth.
As of 2026-08-22 all three are quarantined at `content/manual-questions/_conflicts/` (b01, b02
and the pre-existing b02-FLAT-STRAY conflict) with `quarantined` rows in `BATCH-LOG.md`
explaining why — both b01 and b02 are real, on-disk, schema-valid files (neither was ever
phantom; an earlier informal claim that b02's file didn't exist was wrong and is corrected in
the ledger), just dead content that `questions:gate` now excludes from scope rather than
re-litigates. Y5 science is generated **fresh from b03 onward**.

## 4. Prioritized fill plan (to bring every Year-5 cell to the 12/18/12 floor)

1. ICAS Y5 science — three new batches from **b03** (every band 0 → above 12/18/12; needs 12
   easy / 18 medium / 12 challenging minimum)
2. ICAS Y5 language — batches to close easy (0→12), medium (4→18), challenging (9→12)
3. ICAS Y5 reading — batches to close easy (0→12) and medium (6→18); challenging already clears
4. ICAS Y5 digital_technologies — a top-up batch (easy +1, medium +2, challenging +4)
5. NAPLAN Y5 language, NAPLAN Y5 numeracy, NAPLAN Y5 reading, ICAS Y5 spelling — small
   challenging-band (and, for reading, easy-band) top-ups, 3–9 items each; can likely be
   folded into the batches above rather than run as standalone batches

## 5. Proposed bounded FIRST WAVE (5 batches, 206 questions)

| Batch | Questions | easy / medium / challenging |
| --- | ---: | --- |
| naplan-y5-numeracy-b01 | 42 | 13 / 19 / 10 |
| naplan-y5-numeracy-b02 | 42 | 13 / 19 / 10 |
| naplan-y5-numeracy-b03 | 42 | 13 / 19 / 10 |
| icas-y5-science-b03 | 40 | 13 / 18 / 9 |
| icas-y5-science-b04 | 40 | 13 / 18 / 9 |

Projected after: NAPLAN Y5 numeracy 75/109/**33** (flagship gap closed); ICAS Y5 science
26/36/**18** (two bounded batches; still ~6 challenging short of the floor, finished next wave).
Each batch is a **complete practice set with a FIXED difficulty distribution** — you cannot fill
a single band with a difficulty-only mini-batch.

## 6. Question format (produce JSON in exactly this shape)

Each question object:

```json
{
  "id": "naplan-y5-numeracy-b01-001",
  "type": "multiple_choice",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "published",
  "origin": "original_seed",
  "prompt": "A tank is 3/5 full. Adding 24 litres fills it. What is its capacity?",
  "instructions": "Choose one answer.",
  "options": [
    { "id": "a", "text": "40 L" }, { "id": "b", "text": "60 L" },
    { "id": "c", "text": "72 L" }, { "id": "d", "text": "96 L" }
  ],
  "visuals": [],
  "answerKey": { "kind": "single_option", "optionId": "b" },
  "explanation": "24 L is the remaining 2/5, so 1/5 = 12 L and the capacity is 60 L.",
  "metadata": {
    "subject": "numeracy", "strand": "Number & Algebra", "topic": "Fractions",
    "skill": "Fraction of a quantity", "difficulty": "challenging",
    "marks": 1, "estimatedTimeSeconds": 90, "tags": ["fractions","reasoning"],
    "locale": "en-AU"
  }
}
```

`examStyle` is `naplan_style` or `icas_style`. `subject` values: `numeracy`, `science`,
`digital_technologies` (NOT "language"/"maths"). `difficulty`: `easy|medium|challenging`.

**Answer-key kinds by type** (interactive types carry an `interaction` block):
- `multiple_choice` → `{ "kind": "single_option", "optionId": "b" }`
- `number_entry` → `{ "kind": "number", "value": 8, "tolerance": 0 }`
- `multiple_select` → `{ "kind": "multiple_options", "optionIds": ["b","d"] }`
- `ordering` → `interaction.items:[{id,text}]`, key `{ "kind":"ordering", "optionIds":[ids in order] }`
- `matching` → `interaction.sources/targets`, key `{ "kind":"matching", "pairs":[{sourceId,targetId}] }`
- `drag_drop` → `interaction.items/zones`, key `{ "kind":"drag_drop", "placements":{itemId:zoneId} }`
- `fill_blank` → `interaction.blanks`, key `{ "kind":"fill_blank", "blanks":[{id,acceptedAnswers:[...]}] }`

**Visuals** (only when load-bearing) carry structured `data` AND complete `altText` that conveys
every value needed to answer, e.g. a table: `{ "type":"table", "altText":"...all values...",
"data":{ "headers":[...], "rows":[[...]] } }`. A sighted student and a screen-reader student must
both be able to answer from what's provided.

Batch file: `{ "questions": [ ... ], "batchSelfReport": { "reviewStatus": "...", "generator":
"<model>", "machineGates": { ... } } }`. Path convention:
`content/manual-questions/grade-<3|5>/<naplan|icas>/<programme-slug>/<programme>-bNN.json`.
reviewStatus lifecycle: `generated → gates_passed → audited_pass|audited_reject →
ready_for_final_review → promoted`.

## 7. Quality bar — children's exam content, non-negotiable

Every item must survive a **blind cross-model re-solve** (an independent model solves it ignoring
your key and must agree). The exact defects that got prior science batches **rejected**:
- a wrong answer key;
- a second defensibly-correct option;
- equal-value options within a question (e.g. 3/12 and 1/4);
- decorative or **answer-leaking** visuals.

Visuals must be load-bearing only. One clear, unambiguous correct answer per item. Original
content only.

## 8. Workflow and CROSS-MODEL INTEGRITY (the rule that makes the review real)

The pipeline's core rule: **the auditor must be a genuinely different model than the generator** —
an independent re-solve, not self-confirmation.

- ChatGPT is the **GENERATOR** here. It MUST NOT audit its own batches and MUST NOT publish/promote.
- **ChatGPT and Codex are the same model family** — so do NOT let Codex audit ChatGPT's batches;
  that isn't independent. Use a non-OpenAI auditor (e.g. Qwen) for the blind audit, with Claude as
  the final reviewer. Never label a generated/audited batch with bare `claude` (that name is
  reserved for the final reviewer).
- Flow: **generate (ChatGPT) → machine gates (in repo) → blind cross-model audit (different model)
  → reconcile fixes (generator) → final review (Claude) → promote.** Stop at `gates_passed` and
  hand off; do not carry a batch past that yourself.
- Machine gates (run in the repo, not by ChatGPT): schema validation of every item; duplicate
  check (ids, normalised prompts, stimulus bodies, visual data, answer structures, normalised math
  templates — within the batch AND against existing files); answer-position balance (single-option:
  max−min ≤ 1, every position used); `npm run check:answers`.
- Append one `generated` row per batch to `content/manual-questions/BATCH-LOG.md` (append-only),
  naming the generator model.

## 9. Guardrails

- Write ONLY under `content/manual-questions/`. Never touch `src/`, `supabase/`, `scripts/`, the
  Phase 2 cutover, or anything `assessment_*`/`exam_*`. No migrations, no DB.
- One batch = one programme cell, a complete set with its fixed difficulty distribution.
- Bounded first wave (the 5 batches above), then **pause for review** before scaling — quality per
  batch matters more than volume, and these go to children.

## 10. What the ChatGPT session does next

Generate the 5 first-wave batches (§5) in the format (§6), to the correct paths, at
`reviewStatus: "generated"` with `machineGates` to be filled once run in the repo. Report per-cell
before/after counts. Then hand back for machine gates + independent cross-model audit — do not
self-audit, publish, or promote.
