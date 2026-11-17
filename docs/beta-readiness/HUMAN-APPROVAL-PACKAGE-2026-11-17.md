# Human approval package — 2026-11-17

Prepared during the DEV remediation that followed the 2026-11-17 audit. **Nothing in this file approves, publishes
or alters an approval.** It lists what a human reviewer must decide, with the evidence needed to decide it.

## 1. NAPLAN-style numeracy — 77 batch approvals (defect A-04)

| Fact | Value |
|---|---|
| Approval records sharing one timestamp | 77 (36 Year 3, 41 Year 5), all `2026-11-13T10:57:49.837Z`, reviewer "Vishwas Joshi" |
| Per-item review evidence in the repository | None |
| Checklist | [`OWNER-ATTESTATION-77.md`](OWNER-ATTESTATION-77.md) — one row per item with prompt, accepted answer and hash. **Unsigned.** |
| Withdrawn from serving since | `man-544d2533ffb571a742b0c691` (Y5): the stem and alt text state the answer ("has 6 equal parts … ___ parts altogether"). Withdrawn by `WITHDRAWN_QUESTION_IDS` in `src/server/exam-bank.ts`; its approval record is untouched. |
| Served on a deployed build after withdrawal | Y3 36 of 36, Y5 40 of 41 |

**Decision needed (owner):** either sign the attestation after checking every row, or re-review per item. A row that
fails review: delete its approval file (the deployed gate then stops serving it). To bring back `man-544d…`: rewrite
the stem so it does not state the count (for example "How many equal parts are in the whole bar?" with alt text
"bar model with 2 of its equal parts shaded"), regenerate its manifest, record a new human approval for the new
hash, then remove its id from `WITHDRAWN_QUESTION_IDS`.

## 2. Vihaan scholarship expansion — 480 batch approvals (defect A-10)

| Fact | Value |
|---|---|
| Approval | One manifest, 480 items, approver "Vishwas Joshi", approved and published `2026-11-16T05:10:32.907Z` |
| Advisory review on file | `content/vihaan-scholarship/pilot-01/advisory-review.md`: **"FAIL expansion readiness"** (written for the 20-item pilot; it asked for a second, more discriminating pilot before scaling) |
| Automated checks | Schema, taxonomy, originality screen (internal corpus only) and arithmetic consistency. The README states the arithmetic check "does not independently prove that every expression correctly models its stem". |
| Known defect | `vihaan-e500-m069` has no correct option (the squares between 60 and 90 are 64 and 81; digit sums 10 and 9, not 13). Withdrawn by `VIHAAN_WITHDRAWN_QUESTION_IDS`; the manifest is untouched, so the other 499 still verify. |
| Independent spot check (this remediation) | 20 numeric items drawn at random (seed 20261117) were solved by hand: n034, n103, n013, n110, n049, m094, n057, n102, m025, m085, n113, n011, n100, m088, m017, m003, m055, m061, m057, m074. **20 of 20 keyed correctly**, no second defensible option. This is a sample, not a review. |
| Not covered by any check | 116 verbal reasoning, 97 reading, 38 writing items (no arithmetic evidence; judgement items) |

**Decision needed (owner):** confirm whether the 480 were reviewed item by item. If not, either (a) restrict the
allowlisted pilot to the 20-item pilot plus items reviewed so far, or (b) review the remaining items, prioritising the
229 numeric items (m069 shows the arithmetic check can pass a wrong stem) and then the reading sets. Proposed fix for
m069: change "Its digits add to 13" to "Its digits add to 10" (answer 64, option b, explanation "64 → 6 + 4 = 10;
81 → 8 + 1 = 9"), rebuild with `scripts/build-vihaan-expansion.py`, re-validate, and record a fresh approval for the
regenerated manifest; then remove the id from `VIHAAN_WITHDRAWN_QUESTION_IDS`.

## 3. Rules this package does not bend

- No approval was created, edited or back-dated. No publication gate was relaxed.
- Withdrawal lists can only remove items from serving; they cannot serve an unapproved item.
- AI review, including this remediation's spot check, is advisory and never populates `approvedBy`.
