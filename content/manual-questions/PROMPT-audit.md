# OPERATOR PROMPT — cross-model AUDITOR

Paste this to a model that is NOT the one that generated the batch (Codex audits Qwen's work;
Qwen audits Codex's). It starts from the ledger, blind re-solves, records a verdict, and either
hands the batch back for fixes or marks it ready for Claude's final review. It never edits the
batch content and never promotes.

References: `content/manual-questions/BATCH-LOG.md` (ledger),
`REVIEW-PIPELINE.md` (process), `GENERATION-SPEC.md` (contract).

Target batch: <path to the batch JSON, or a programme slug to audit its latest un-audited batch>

---

## STEP 0 — the ledger gate (start here; this is non-negotiable)
Open `content/manual-questions/BATCH-LOG.md` and find this batch's `generated` row.
- If it names YOU as generator → STOP. You cannot audit your own batch. Report that it needs a
  different model. Do nothing else.
- If it already has an `audited … pass` row from a model other than its generator → STOP. It is
  already audited; report that it is ready for promotion. Do not re-audit.
- Otherwise you are a valid, different auditor → proceed.

## STEP 1 — adversarial blind re-solve
Read the batch. IGNORE every `answerKey`. Solve each question yourself from the prompt and
visual data alone. Your job is to BREAK it, not bless it. For every question, check:
1. Disagreement — your answer ≠ the key. Say which is actually correct and why.
2. Ambiguity — a second option is also defensibly correct.
3. Equal-value options within one question (e.g. `3/12` and `1/4`).
4. Key/explanation mismatch — the explanation describes a different option than the key points
   to. THIS IS THE #1 RECURRING DEFECT (it comes from rebalancing that moved option text but
   didn't repoint the key). Check every single-option question for it.
5. Leaky or irrelevant visuals — the visual restates/reveals the answer, or is unrelated.

## STEP 2 — write the audit sidecar
Write `<slug>-<batch>.audit.json` in the same folder as the batch, using this shape:
```json
{
  "batch": "<slug>-<batch>",
  "auditorModel": "<you>",
  "audited": <n>,
  "disagreements": [{"id":"","yourAnswer":"","keyedAnswer":"","correct":"","reason":""}],
  "ambiguous": [{"id":"","reason":""}],
  "equalOptions": [{"id":"","reason":""}],
  "keyExplanationMismatch": [{"id":"","reason":""}],
  "leakyVisuals": [{"id":"","reason":""}],
  "verdict": "pass"
}
```
`verdict` is `reject` if ANY flag exists, else `pass`. Do NOT edit the batch file.

## STEP 3 — log the audit
Append ONE row to `BATCH-LOG.md` (append only):
`| <date> | <slug>-<batch> | audited | <you> | <pass|reject> — <one-line summary> |`

## STEP 4 — route the outcome
- **reject:** hand the sidecar back to the GENERATOR (the model in the `generated` row) for
  Step D reconcile. Fixes must move option TEXT and repoint the key — never edit `answerKey`
  alone. ANY rebalance or text move requires a FRESH audit afterwards (rebalancing is what
  introduces new wrong keys). Max 2 reconcile rounds, then escalate to Claude.
- **pass** AND all machine gates green: the generator sets `reviewStatus =
  "ready_for_final_review"` and appends one line to `content/manual-questions/_ready/QUEUE.md`:
  `<date> | <slug> | <batch> | gen:<model> aud:<model> | <count>q | <relative path>`
  Then stop. Claude does the final review across the queue and handles promotion. Do NOT
  promote and do NOT write to `src/**`.

## Prohibitions
Run no git commands. Never audit your own batch. Never set `pass` while any flag is open.
Never promote to the served bank — that is Claude's final step.
