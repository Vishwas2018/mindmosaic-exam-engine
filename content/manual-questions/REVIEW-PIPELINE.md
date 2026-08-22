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

## The ledger (read before auditing, append after every step)
`content/manual-questions/BATCH-LOG.md` is the shared audit trail. It is APPEND-ONLY — add a
new row, never edit an existing one. It is how the cross-model rule is enforced: an auditor
confirms from the log that it is not the batch's generator. If the log and your own memory
disagree about who generated a batch, the log wins — do not audit a batch you cannot confirm
you did not generate.

## Step A — GENERATE (generator)
Produce the batch per GENERATION-SPEC.md. Set `reviewStatus: "generated"`. Write to the
programme folder. **Append a `generated` row to BATCH-LOG.md with your model name.** No git.
Do not touch src/**, another model's in-flight folder, or _promoted/.

## Step B — MACHINE GATES (generator, before handoff)
Run and record results in the batch's `batchSelfReport.machineGates`:
- schema validation against src/schemas/question.schema.ts (every question)
- duplicate check: ids, normalised prompts, stimulus bodies, visual data, answer structures,
  normalised mathematical templates — within the batch AND against existing files in the folder
- answer-position balance (single-option types: max−min ≤ 1, every position used)
- `npm run check:answers` over this file (independent machine re-derivation)
If any gate fails, fix and re-run. Only at all-green set `reviewStatus: "gates_passed"`.
`check:answers` cannot judge conceptual items — passing it is necessary, never sufficient.

**Then run the ENFORCED validator — this is not optional and not the same as the self-report
above.** `npx tsx scripts/validate-batch.mts <path-to-batch.json>` must exit 0 before
`reviewStatus` is allowed to be `gates_passed`. See "MACHINE GATES ARE ENFORCED" below.

## Step C — CROSS-MODEL BLIND AUDIT (auditor — a DIFFERENT model)
FIRST: read `BATCH-LOG.md` and find this batch's `generated` row. If it names YOU, STOP — you
cannot audit your own batch; report that it must go to a different model. If the batch already
has an `audited … pass` row from a model other than its generator, it is already audited — do
not re-audit; report that it is ready for promotion.
Otherwise proceed. The auditor reads the batch and, IGNORING every answerKey, solves each
question itself. When done, **append an `audited` row to BATCH-LOG.md** with your model name
and verdict. It
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
(`npm run questions:promote-batch` — see "PROMOTION REQUIRES questions:gate" below) into
src/content/questions/** with the count-gate re-baseline.

## Audit output shape (`<programme>-bNN.audit.json`)
```json
{
  "batch": "icas-y5-science-b01",
  "auditorModel": "qwen",
  "audited": 40,
  "perQuestionResolve": [{"id": "icas-y5-science-b01-001", "auditorAnswer": "a"}],
  "disagreements": [{"id": "", "yourAnswer": "", "keyedAnswer": "", "correct": "", "reason": ""}],
  "ambiguous": [{"id": "", "reason": ""}],
  "equalOptions": [{"id": "", "reason": ""}],
  "keyExplanationMismatch": [{"id": "", "reason": ""}],
  "leakyVisuals": [{"id": "", "reason": ""}],
  "verdict": "pass"
}
```

`perQuestionResolve` is **required, one entry per question in the batch, same ID set** — it is
the auditor's own independently-derived answer for every question (the option id / boolean /
number / text you arrived at solving blind, not a copy of `answerKey`). This is what separates a
real blind re-solve from a `verdict: "pass"` with five empty arrays and nothing else — the
latter is now rejected outright as an unsubstantiated stub, whatever its verdict says. See
"MACHINE GATES ARE ENFORCED" below — `validate-audit-integrity.mts` checks this field exists,
covers every question, and that `auditorModel` differs from the batch's generator.

## Hard prohibitions (both models, every step)
- Never write to `src/**`, `scripts/**`, `content/question-factory/**`, `docs/**`, configs,
  `.env*`, `_promoted/`, or another model's in-flight programme folder.
- Never run any git command.
- Never self-audit (auditor ≠ generator).
- Never promote to the live bank — that is Claude's step after final review.
- Never set a `pass` verdict or `ready_for_final_review` while any flag is open.

---

## MACHINE GATES ARE ENFORCED (added 2026-08-21)

Every "gate" before this addendum was a generator's own self-report inside `batchSelfReport`
and `batchMeta`, or an auditor's own free-text sidecar. Nothing independently re-derived any of
it from the file. That gap is exactly how `icas-y3-science-b01`–`b03` reached
`ready_for_final_review` while self-reporting 4/5/6 visuals against a 12–18 requirement, how
their `.audit.json` sidecars passed with `verdict: "pass"` and five empty arrays and no per-
question working, and how `BATCH-LOG.md` carries `generated`/`audited` rows for
`icas-y3-science-b04` and `-b05` when neither file has ever existed on disk. Self-attestation is
not a gate. These three scripts are:

1. **`scripts/validate-batch.mts`** — the enforced composition + schema gate. Re-derives, from
   the batch file alone (never from `batchSelfReport`): exact question count and sequential IDs,
   the exact difficulty split, the visual-question count against the section-2 [min, max] range
   (a floor again, see GENERATION-SPEC.md's retraction note), permitted-type membership, type
   diversity and the 60%/85% single-type cap, A/B/C/D single-option balance, `keyLengthExtremeCount`
   against its cap, and schema validity of every question against
   `src/schemas/question.schema.ts`. Exits non-zero and prints every specific violation.
   ```
   npx tsx scripts/validate-batch.mts content/manual-questions/grade-3/icas/icas-y3-science
   ```
2. **`scripts/validate-audit-integrity.mts`** — rejects an `.audit.json` sidecar unless it
   carries a `perQuestionResolve` entry for every question in the batch (evidence of an actual
   blind re-solve), unless its `auditorModel` differs from the batch's generator (BATCH-LOG's
   `generated` row wins over `batchMeta.generatedBy` if they disagree), and unless a batch the
   ledger marks `audited` actually has a sidecar file on disk. An all-empty-arrays "pass" with no
   `perQuestionResolve` is rejected outright as a stub, regardless of its verdict.
3. **`scripts/validate-ledger-consistency.mts`** — cross-checks every `generated`/`audited`
   row in `BATCH-LOG.md` against the filesystem (accounting for `_promoted/` once a `promoted`
   row exists) and flags phantom entries — a logged batch with no corresponding file — in either
   direction.

**A batch is not `gates_passed`, not `audited …`, and not `ready_for_final_review` unless all
three of these exit zero.** They live under `scripts/**` (content/factory tooling, not `src/**`)
and are run by whichever role executes Steps B/C/D — the "never write to `scripts/**`" rule
above is about generator/auditor models not modifying the validators, not about not running
them.

---

## PROMOTION REQUIRES `questions:gate` — IT IS NOT OPTIONAL (added 2026-08-22)

The three validators above closed the "self-attestation is not a gate" hole for Steps B/C/D.
They did nothing, by themselves, to stop a batch reaching `_promoted/` (and from there the
served bank) without ever having been run — a human or Claude could still skip straight to
moving the file. That gap is now closed the same way: mechanically, not by a promise to
remember.

- **`npm run questions:gate [path ...]`** runs all three validators together and exits non-zero
  if ANY of them fails. With no argument it scopes to the whole **pre-promotion set**: every
  batch file under `content/manual-questions`, excluding `_promoted/`, `_ready/`, `_conflicts/`,
  and any batch `BATCH-LOG.md` already records a `promoted` row for (a batch shipped before this
  gate existed is not retroactively re-litigated against a rule introduced afterwards — only
  batches still awaiting promotion are in scope). A path argument (file or folder) validates
  just that target.
- **`npm run questions:promote-batch <programme>-bNN [...] [--model <name>]`** is now the only
  way a staging batch reaches `_promoted/`. It runs `questions:gate` on that batch FIRST and
  refuses — no file move, no `BATCH-LOG.md` row — if it does not exit zero. It does not touch
  `src/content/questions/**`: wiring a promoted batch into the served bank's `.ts` files stays
  the separate, manual step it already was (see the 2026-08-12 `icas-y5-numeracy-b01` row's
  note that staging retirement is a separate bookkeeping commit). A batch cannot reach
  `_promoted/`, and therefore cannot reach the served bank, without passing composition + audit-
  integrity + ledger consistency first.
- **CI runs `questions:gate` on every push** (see `.github/workflows/ci.yml`'s `core` job, right
  after `check:answers`) over the same pre-promotion set. A batch that would be refused at
  promotion time reds the branch first, before anyone reaches for `promote-batch.mts` by hand.

This closes the enforcement gap end to end: Steps B/C/D can no longer self-report their way to
`ready_for_final_review` (see above), and promotion can no longer skip straight to `_promoted/`
without the same three checks passing.
