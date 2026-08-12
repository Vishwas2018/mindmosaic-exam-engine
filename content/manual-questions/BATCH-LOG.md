# Batch ledger — generation & review audit trail

Append-only record of every batch: who generated it, who audited it, the verdict, and whether
it has been promoted. This is the source of truth for the cross-model rule — **before auditing
a batch, read this log and confirm you are NOT its generator.**

## How to use (all models)

- **Append only. Never edit or delete an existing line.** Add your event as a new row at the
  bottom. (Editing existing rows is what corrupts a shared file when two models run.)
- **On generate:** append a `generated` row with your model name.
- **Before audit:** find the batch's `generated` row. If it names YOU, stop — you cannot audit
  your own batch. Hand it to a different model. If it names a different model, proceed.
- **On audit:** append an `audited` row with your model name and verdict (`pass` | `reject`).
- **On promote (Claude only):** append a `promoted` row.
- Current status of a batch = its most recent row. A batch is promotable when it has an
  `audited … pass` row whose auditor ≠ its generator.
- Run no git commands to update this — just append the line and save.

## Model names

Use one of: `codex`, `qwen`, `mistral`, `claude`. The generator and the auditor of the same
batch must never be the same name.

## Events

| Date       | Batch                            | Event      | Model    | Verdict / Detail                                                                                                                                                                |
| ---------- | -------------------------------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | icas-y5-science-b01              | generated  | mistral  | 40q; self-report matched file                                                                                                                                                   |
| 2026-08-09 | icas-y5-science-b01              | audited    | claude   | reject — 4 wrong keys (q012/q019/q022/q024), q011 has 3 correct for "choose two", q004 ambiguous, ~6 decorative/leaky visuals; returned to generator                            |
| 2026-08-10 | icas-y5-digital_technologies-b01 | generated  | codex    | 35q; perfect structure                                                                                                                                                          |
| 2026-08-10 | icas-y5-digital_technologies-b01 | audited    | claude   | pass — 34/35 keys correct; q009 wrong key fixed via a/d text-swap (balance preserved); 35/35 schema-valid                                                                       |
| 2026-08-10 | icas-y5-science-b02              | generated  | qwen     | 40q; all 6 machine gates passed; reviewStatus gates_passed                                                                                                                      |
| 2026-08-10 | icas-y5-spelling-b01             | generated  | claude   | 45q; gates_passed (check:answers cannot read staging files — see machineGates)                                                                                                  |
| 2026-08-10 | icas-y5-science-b02              | generated  | unknown  | gates_passed; generator identity not recorded in file — needs a cross-model audit before promotion                                                                              |
| 2026-08-10 | icas-y5-spelling-b01             | generated  | DISPUTED | file claims generatorModel "claude" (incorrect — Claude did not generate it); re-label to true generator before audit                                                           |
| 2026-08-10 | icas-y5-science-b02              | note       | claude   | a DIFFERENT flat-path science-b02 was found and quarantined to \_conflicts/icas-y5-science-b02-FLAT-STRAY.json (content differs from the canonical b02) — human decision needed |
| 2026-08-10 | icas-y5-spelling-b01             | correction | claude   | generator relabelled DISPUTED -> "claude-code" (the VS Code agent, a generator) per Vish. "claude" is reserved for the Cowork final reviewer only.                              |
| 2026-08-10 | icas-y5-science-b02              | audited    | codex    | reject — q023 wrong classification, q024 ambiguous/mismatched rationale, and 23 leaky, redundant, or misleading visuals                                                         |
| 2026-08-10 | icas-y5-spelling-b01             | audited    | qwen     | pass — 45/45 keys correct; no ambiguity, no equal-value options, no key/explanation mismatch, no leaky visuals                                                                  |

## Model names (clarified 2026-08-10)

Generators: `codex`, `qwen`, `mistral`, `claude-code`. Final reviewer only: `claude`.
Never use bare `claude` for a generated or routine-audited batch.
Same-family caveat: `claude-code` batches should get their independent cross-model audit from a
NON-Claude model (codex/qwen/mistral); `claude` (final reviewer) is a last gate, not the
independent audit, since it shares a model family with claude-code.
| 2026-08-10 | icas-y5-spelling-b01 | final_review | claude | pass — independent blind re-solve 45/45 correct; promotable |
| 2026-08-10 | icas-y5-numeracy-b01 | generated | codex | 40q; three staging gates passed; reviewStatus gates_passed |
| 2026-08-10 | icas-y5-digital_technologies-b01 | promoted | claude | 35q -> src/content/questions/grade-5/icas-digital-technologies.ts; bank 885 -> 965 with the spelling batch; all gates green; staging file moved to _promoted/ |
| 2026-08-10 | icas-y5-spelling-b01 | promoted | claude | 45q -> src/content/questions/grade-5/icas-spelling.ts; bank 885 -> 965 with the digital technologies batch; all gates green; staging file moved to _promoted/ |
| 2026-08-10 | icas-y5-numeracy-b01 | audited | claude | pass — blind re-solve 40/40 keys correct; 5/5/5/5 balance; 3 load-bearing visuals only |
| 2026-08-10 | icas-y5-numeracy-b01 | final_review | claude | pass — promotable (minor wording note on q038 'uniquely describes') |
| 2026-08-12 | icas-y5-numeracy-b01 | promoted | claude | 40q -> src/content/questions/grade-5/icas-mathematics.ts; curated bank 965 -> 1005; typecheck, lint, 4733 unit tests and the production build all green; validate:questions passes. check:answers reports one failure on q008, a known false positive in the checker's bare-"twice" handler (keyed answer Red is correct) — see the note in that batch's promotion commit. Staging retirement (batchMeta.reviewStatus -> promoted, batch file -> \_promoted/) NOT done here; it is a separate bookkeeping commit, as for the two 2026-08-10 promotions. |
