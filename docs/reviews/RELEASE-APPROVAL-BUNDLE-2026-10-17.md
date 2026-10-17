# AMC + Year 6 scholarship release: human approval bundle (17 Oct 2026)

Nothing here is approved. No approval was recorded or signed for Vish. Branch `release/integrated` (local worktree `C:\tmp\rel-int`), pushed to origin without a PR.

## A. AMC (needs 2 decisions; 55 existing approvals unchanged and valid)
Served now: 55 AMC items (Year 3: 27, Year 5: 28). All external approvals validate against exact content hash, revision and source hash.

| Item | Change | Reviews | Needs |
|---|---|---|---|
| roadmap-amc-y3-005 | Stem now asks for "the smallest number of extra beads" (was ambiguous: 11, 17... also work). Answer 5 (a) unchanged. | Review 1 (Opus 5.5): REVISE, applied. Review 2 (fresh Opus 5.5): wording sound, suggests distractor b) 8 -> 1 (optionally d) 2 -> 7). **Not applied.** | Your approve/revise decision |
| roadmap-amc-y3-016 | Label medium -> easy (4 marks kept) as instructed. | Review 1: easy. Review 2 (fresh, blind): **medium** (two steps, real trap) or keep easy and cut to 3 marks. The two reviews disagree. | Your decision on label/marks, then approve |

Their old approvals/manifests are retired to `docs/reviews/amc-2026-10-17/superseded-before-independent-review/`. Review sheet rows for these two are blank in `docs/reviews/amc-2026-10-17/review-sheet-amc-y3-blank.csv`; all other rows keep their signed decisions byte-for-byte. Both items go through ingest -> pipeline -> stage -> publish after your signature.

## B. Scholarship Year 6 (160 drafts)
Review coverage by exact content hash: 75 items covered by the 87-packet blind review, 49 by the earlier blind first pass, 36 gaps/changed items re-reviewed blind this round (34 pass, 2 revised then passed). 12 packet findings fixed (maths-038; microbat passage rc-019..027; option balance rc-019/025/026; rc-032, rc-035 reworked); rc-022/023 reworded. All reviews are Claude Opus 5.5 AI reviews. None is human approval.

| Group | Count | State | Needs |
|---|---|---|---|
| Numerical Reasoning + Mathematics, staged | **45** (NR 26, Maths 19) | governed ingest, structural, first-party-recomputed correctness, originality, difficulty all passed; staged with draft ids | Your approval, sheets in `docs/reviews/scholarship-2026-10-17/` |
| NR/Maths stopped at difficulty gate | 35 (Maths 21, NR 14) | estimator deviation > 0.15 vs honest label | Policy decision: advisory for scholarship (as done for AMC), or relabel/revise |
| Verbal Reasoning + Reading | 80 | not run: judgement content needs a different-provider reviewer (docs/REVIEW_INDEPENDENCE_POLICY.md: Claude must not self-supply) | An external ChatGPT/Gemini/Qwen review round-trip |

Shared passages (Reading) are unaffected by the staged 45. Reading passages "In Defence of the Dark" (rc-019..027) and "Charting the Roaring Forties" (rc-028..035) are in the drafts, not yet staged.

## C. Legacy quarantine
543 approval-less pre-governance manifests (not 542) moved byte-for-byte to `content/quarantine/legacy-unapproved/` with `ledger.json` (id, reason, sha256, paths). Assembly stays strict and succeeds. Runtime also filters the ids. Consequence: NAPLAN/ICAS programmes lose all factory-published content. See blocker list in the final report.

## D. Checks (rel-int)
typecheck clean, lint clean. Unit suite: 6301 pass, 40 fail. Failures: quarantine consequences (published-bank-reachability 16, content-projection 8, g5 quarantine 6, lessons 4, gated-practice-coverage 3, catalogue 2, route-capacity 1) and stripe-webhook-route (no .env.local in worktree, same on base). Not run: build, test:rls, e2e, check:answers, validate:questions.
Browser (local, isolated, no backend): AMC Y3 module (27 q: 22 MC + 5 number entry): start, answer all, submit, results (15/124), explanations present, "Practice again" returns to the same paper. Scholarship NR (26 q preview): same journey, 3/26.
