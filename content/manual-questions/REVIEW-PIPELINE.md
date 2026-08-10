# MindMosaic — generation & cross-model review pipeline

Generic pipeline for producing review-ready question batches with **Codex** and **Qwen**.
Model-agnostic: the two roles are GENERATOR and AUDITOR. The only hard rule is that a batch's
AUDITOR must be a **different model** than its GENERATOR. Nothing here publishes to the live
bank — the pipeline ends at "ready for final review", and a human/Claude pass promotes.

## Why cross-model
Every defect found so far (wrong answer keys, swapped keys after rebalancing, ambiguous
options) passed the generator's OWN structural self-check. Structure cannot tell a right key
from a wrong one — only an independent re-solve can, and independence means a different model.
A model auditing its own batch is not an audit.

## Roles per batch
- GENERATOR: writes the batch (follow `GENERATION-SPEC.md` exactly).
- AUDITOR: the OTHER model. Blind re-solves, reports, never edits.
- RECONCILER: the GENERATOR again, applying fixes for what the AUDITOR flagged.
- FINAL REVIEW: Claude, at the end, across the ready queue. Then promotion.

Rotate so each model audits the other's work. Suggested split (adjust freely, keep it crossed):
Codex generates numeracy / digital_technologies / science; Qwen generates reading / language /
spelling. Each audits the other's subjects.

## Lifecycle and locations
```
content/manual-questions/<grade>/<exam>/<programme>/<programme>-bNN.json       generated / in-review
content/manual-questions/<grade>/<exam>/<programme>/<programme>-bNN.audit.json auditor report (sidecar)
content/manual-questions/_ready/QUEUE.md                                       append one line per ready batch
content/manual-questions/_promoted/                                            after Claude review + promotion
```
Path convention is fixed: `grade-<3|5>/<naplan|icas>/<programme-slug>/`. The exam folder is
the prefix of the slug. Never create a flat `grade-<n>/<programme>/` folder.
The batch JSON carries a `reviewStatus` inside `batchSelfReport`:
`generated` → `gates_passed` → `audited_reject` → `audited_pass` → `ready_for_final_review`.

## Step A — GENERATE (generator)
Produce the batch per GENERATION-SPEC.md. Set `reviewStatus: "generated"`. Write to the
programme folder. No git. Do not touch src/**, another model's in-flight folder, or _promoted/.

## Step B — MACHINE GATES (generator, before handoff)
Run and record results in the batch's `batchSelfReport.machineGates`:
- schema validation against src/schemas/question.schema.ts (every question)
- duplicate check: ids, normalised prompts, stimulus bodies, visual data, answer structures,
  normalised mathematical templates — within the batch AND against existing files in the folder
- answer-position balance (single-option types: max−min ≤ 1, every position used)
- `npm run check:answers` over this file (independent machine re-derivation)
If any gate fails, fix and re-run. Only at all-green set `reviewStatus: "gates_passed"`.
`check:answers` cannot judge conceptual items — passing it is necessary, never sufficient.

## Step C — CROSS-MODEL BLIND AUDIT (auditor — a DIFFERENT model)
The auditor reads the batch and, IGNORING every answerKey, solves each question itself. It
writes `<programme>-bNN.audit.json` (see the audit-output shape below) and does NOT edit the
batch. It must flag, per question:
- disagreement (auditor's answer ≠ key) — say which is actually correct and why
- ambiguity (a second option is also defensibly correct)
- equal-value options within a question (e.g. 3/12 and 1/4)
- key/explanation mismatch (the explanation describes a different option than the key points to
  — the #1 recurring defect)
- leaky or irrelevant visuals (restates the answer, or unrelated to the question)
Verdict is `reject` if ANY of the above exists, else `pass`.

## Step D — RECONCILE, then RE-AUDIT (bounded)
If verdict is `reject`, the GENERATOR fixes every flagged item.
- Fix a wrong/swapped key by moving option TEXT and repointing the key to the option holding
  the correct text — never by editing only answerKey.optionId.
- ANY rebalancing or option-text move REQUIRES a fresh Step C audit — rebalancing is the
  operation most likely to introduce new wrong keys.
- Re-run Step B gates after fixes.
Loop A/B/C at most **2 reconcile rounds**. If still `reject` after 2 rounds, set
`reviewStatus: "audited_reject"`, leave it in place, and escalate to Claude — do not keep
looping and do not promote.

## Ready for final review
When the auditor's verdict is `pass` AND all machine gates are green:
- set `reviewStatus: "ready_for_final_review"` and record in `batchSelfReport`:
  `generatorModel`, `auditorModel`, `machineGates` results, `auditVerdict`, `reconcileRounds`.
- append one line to `content/manual-questions/_ready/QUEUE.md`:
  `<date> | <programme> | bNN | gen:<model> aud:<model> | <count> q | rounds:<n> | <relative path>`
Then stop. Do not promote. Claude does the final review across the queue and handles promotion
into src/content/questions/** with the count-gate re-baseline.

## Audit output shape (`<programme>-bNN.audit.json`)
```json
{
  "batch": "icas-y5-science-b01",
  "auditorModel": "qwen",
  "audited": 40,
  "disagreements": [{"id": "", "yourAnswer": "", "keyedAnswer": "", "correct": "", "reason": ""}],
  "ambiguous": [{"id": "", "reason": ""}],
  "equalOptions": [{"id": "", "reason": ""}],
  "keyExplanationMismatch": [{"id": "", "reason": ""}],
  "leakyVisuals": [{"id": "", "reason": ""}],
  "verdict": "pass"
}
```

## Hard prohibitions (both models, every step)
- Never write to `src/**`, `scripts/**`, `content/question-factory/**`, `docs/**`, configs,
  `.env*`, `_promoted/`, or another model's in-flight programme folder.
- Never run any git command.
- Never self-audit (auditor ≠ generator).
- Never promote to the live bank — that is Claude's step after final review.
- Never set a `pass` verdict or `ready_for_final_review` while any flag is open.
