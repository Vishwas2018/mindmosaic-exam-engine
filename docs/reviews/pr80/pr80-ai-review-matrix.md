# PR #80 Bar-Model Pilot — ITEM-BY-ITEM REVIEW MATRIX & CONSOLIDATED RELEASE-READINESS REPORT

**Review type:** AUTOMATED AI review (language-model reasoning). This is NOT a genuine independent human blind review and does NOT confer human approval.
**Commit reviewed:** `b842cee99d51486173f4281c4227e023408db27b` (branch `feat/bar-modelling-30-question-pilot`, PR #80, draft, targeting `dev`).
**Blind source read:** `docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt` (givens-only; NO keys/explanations).
**Keyed report read AFTER independent solving:** `docs/reviews/pr80/bar-model-pr80-keyed-report.txt`.
**Independent findings saved pre-keyed-report:** `scratch/pr80-independent-findings.md`.

---

## Safeguards observed (none violated)
- Did NOT open answer keys/explanations before independent solving.
- Did NOT populate `approvedBy` (left blank — only an owner/named human approver may do this).
- Did NOT modify original review evidence.
- Did NOT merge PR #80 into `dev`/`main`.
- Did NOT deploy, publish, or modify production data.
- Did NOT mark PR #80 ready for review without owner authorisation.

---

## 1. Independent blind solving — answers recorded BEFORE keyed report

All 30 items solved arithmetically from prompt givens only. Confidence: High for all 30. No ambiguity detected.

| # | ID | Year | Skill | Diff | Unit | My answer | Stored key | Model solver | Match? |
|---|----|------|-------|------|------|-----------|------------|--------------|--------|
| 1 | pilot-y3-part-whole-01 | 3 | part-whole | easy | sticks | 22 | 22 | 22 | PASS |
| 2 | pilot-y3-comparison-01 | 3 | comparison | easy | shells | 12 | 12 | 12 | PASS |
| 3 | pilot-y3-times-as-many-01 | 3 | times-as-many | medium | tokens | 18 | 18 | 18 | PASS |
| 4 | pilot-y3-part-whole-02 | 3 | part-whole | easy | apples | 23 | 23 | 23 | PASS |
| 5 | pilot-y3-comparison-02 | 3 | comparison | easy | flowers | 13 | 13 | 13 | PASS |
| 6 | pilot-y3-times-as-many-02 | 3 | times-as-many | medium | books | 28 | 28 | 28 | PASS |
| 7 | pilot-y3-part-whole-03 | 3 | part-whole | medium | marbles | 33 | 33 | 33 | PASS |
| 8 | pilot-y3-comparison-03 | 3 | comparison | medium | stickers | 25 | 25 | 25 | PASS |
| 9 | pilot-y3-times-as-many-03 | 3 | times-as-many | hard | cards | 45 | 45 | 45 | PASS |
| 10 | pilot-y3-part-whole-04 | 3 | part-whole | easy | crayons | 19 | 19 | 19 | PASS |
| 11 | pilot-y3-comparison-04 | 3 | comparison | medium | blocks | 15 | 15 | 15 | PASS |
| 12 | pilot-y3-times-as-many-04 | 3 | times-as-many | medium | pencils | 20 | 20 | 20 | PASS |
| 13 | pilot-y3-part-whole-05 | 3 | part-whole | hard | buttons | 37 | 37 | 37 | PASS |
| 14 | pilot-y3-comparison-05 | 3 | comparison | hard | stick figures | 23 | 23 | 23 | PASS |
| 15 | pilot-y3-times-as-many-05 | 3 | times-as-many | hard | bears | 36 | 36 | 36 | PASS |
| 16 | pilot-y5-equal-units-01 | 5 | equal-units | easy | biscuits | 35 | 35 | 35 | PASS |
| 17 | pilot-y5-before-after-01 | 5 | before-after | easy | beans | 45 | 45 | 45 | PASS |
| 18 | pilot-y5-transfer-01 | 5 | transfer | easy | stickers | 7 | 7 | 7 | PASS |
| 19 | pilot-y5-equal-units-02 | 5 | equal-units | medium | coins | 63 | 63 | 63 | PASS |
| 20 | pilot-y5-before-after-02 | 5 | before-after | medium | marbles | 64 | 64 | 64 | PASS |
| 21 | pilot-y5-transfer-02 | 5 | transfer | medium | tokens | 11 | 11 | 11 | PASS |
| 22 | pilot-y5-equal-units-03 | 5 | equal-units | easy | sticks | 36 | 36 | 36 | PASS |
| 23 | pilot-y5-before-after-03 | 5 | before-after | hard | pencils | 85 | 85 | 85 | PASS |
| 24 | pilot-y5-transfer-03 | 5 | transfer | hard | marbles | 11 | 11 | 11 | PASS |
| 25 | pilot-y5-equal-units-04 | 5 | equal-units | medium | cups | 63 | 63 | 63 | PASS |
| 26 | pilot-y5-before-after-04 | 5 | before-after | medium | stickers | 62 | 62 | 62 | PASS |
| 27 | pilot-y5-transfer-04 | 5 | transfer | hard | buttons | 16 | 16 | 16 | PASS |
| 28 | pilot-y5-equal-units-05 | 5 | equal-units | hard | sweets | 72 | 72 | 72 | PASS |
| 29 | pilot-y5-before-after-05 | 5 | before-after | hard | lollies | 81 | 81 | 81 | PASS |
| 30 | pilot-y5-transfer-05 | 5 | transfer | hard | cards | 18 | 18 | 18 | PASS |

**Result: 30/30 independent answers match stored keys and model-solver results. Zero discrepancies.**

Distribution verified against evidence matrix: Year 3 = 15 (5 easy / 6 medium / 4 hard); Year 5 = 15 (4 easy / 5 medium / 6 hard). All IDs unique. ✓


## 2. Classification of differences vs keyed report & fixtures

| Class | Count | Items | Basis |
|-------|-------|-------|-------|
| **BLOCKER** | 0 | — | No item is unsolvable, incorrect, misleading, or leaking an answer. |
| **MAJOR** | 0 | — | No content defect requiring removal/rework before pilot consideration. |
| **MINOR** | 2 | Y3 times-as-many set (×5); all 5 transfer items | Year-3 division facts beyond AC v9 priority facts (borderline year fit); transfer wording "gives away" imprecision (mitigated by diagram conservation statement). |
| **EDITORIAL** | 2 | pilot-y5-equal-units-04; cross-item | Mixed "bottles"/"cups of juice" units in Y5-4; repeated answers (11 ×2, 18 ×2, 23 ×2, 63 ×2, 36 ×2) — low answer-pattern variety, not a numeric-entry defect. |

No difference between my independent solving and the keyed report: **0 discrepancies.**

## 3. Item-level review summary (suitability, difficulty, clarity, correctness, bar model, flags)

| ID group | Year fit | Difficulty fit | Clarity | Correctness | Bar-model fit | Flags |
|----------|----------|----------------|---------|-------------|---------------|-------|
| Y3 part-whole ×5 (easy/med/hard) | Good | ✓ as labelled | Clear | Correct | Whole = known part + unknown ?, total brace | None |
| Y3 comparison ×5 (easy/med/hard) | Good | ✓ as labelled | Clear | Correct | Two bars, difference brace | None |
| Y3 times-as-many ×5 | Borderline | ✓ (hard on 2 toughest) | Clear | Correct | Big/small bars, equal units, total + target braces | Requires ÷ facts beyond AC v9 Y3 priority (2,3,5,10): 6×9=54, 4×12=48. Bar support mitigates. |
| Y5 equal-units ×5 | Good | ✓ as labelled | Clear | Correct | Equal groups, total + larger-brace | Y5-4: "bottles" vs "cups" mixed units (minor). |
| Y5 before-after ×5 | Good | ✓ as labelled | Clear | Correct | Before Start=? / After Left=?, removed amount | None |
| Y5 transfer ×5 | Good | ✓ as labelled | Clear | Correct | Before bars conserve total; after bars equal | Wording "gives away" though amount transfers to other person (diagram states total conserved). |

**No misleading diagrams** — all explicitly "schematic, not drawn to scale". **No unintended answer clues** — all numeric entry, no options. **No incorrect units within items** (one mixed-unit phrasing only).


## 4. PR #80 evidence, production gating & test-limitations review

### 4.1 Evidence artifacts (all present, internally consistent)
- Blind HTML packet: givens-only diagrams + blank reviewer textarea fields; 0 matches for stored-key/explanation terms. ✓
- Blind text packet: prompts + deterministic diagram descriptions; no keys. ✓
- Keyed report: independent calculation vs stored key vs model solver, all PASS. ✓
- Artifact headers bind fixture source SHA-256 `60613c0bcac049dbf293d95fcc62878ad64902a3da20533855527ef18c738edf` across packets. ✓
- Evidence doc states: "This automated arithmetic check is not an independent human blind-review record." ✓ (honest framing)

### 4.2 Production gating (verified in-tree)
- `barModelPilotFixtures` (with `privateAnswerKey` + `workedExplanation`) is imported **only** by `src/tests/unit/bar-model-pilot-fixtures.test.ts` and the review/validation scripts. NOT imported by any page/component/client bundle → pilot answer keys do **not** reach production client JavaScript. ✓
- `src/features/visuals/bar-model/preview-gate.ts`: `isBarModelPreviewAllowed` returns `false` for production `NODE_ENV` unless `BAR_MODEL_PREVIEW_ENABLED === "1"`, AND returns `false` whenever `VERCEL_ENV === "production"` regardless of flag. Fail-closed. ✓
- `/dev/bar-model` is dev/QA-only, 404 in production builds, not linked from navigation, has a developer diagnostics panel labelled "contains answer keys" (initially closed, separate gallery). ✓
- Playwright config sets `BAR_MODEL_PREVIEW_ENABLED=1` only for its local production-build web server (e2e escape hatch); must NOT be set on real Vercel deployments. ✓
- Blind packet renderer receives unsolved visual JSON only; model-solver target computed at validate time, never embedded in the blind diagram. ✓

### 4.3 Test limitations (unresolved, per evidence doc)
- Local Windows unit runs showed intermittency: initial complete run 6,551 passing / 20 failing (Stripe collection failure); a later serial attempt had one CLI case at 14,389,804 ms plus an approval-verification timeout and was interrupted; a fresh retry passed all 32 tests.
- Restored local authenticated run: 55 passed / 1 failed (completed-attempt student dashboard overflow check); repetition passed once, then two navigation timeouts.
- Evidence doc: "Complete authenticated CI remains the required gate." Local intermittency is recorded but **not** labelled a proven pre-existing product defect nor a passing local suite.
- The independent solver `scripts/lib/bar-model-pilot-independent.ts` is a narrow, regex-based recogniser of exactly six pilot story forms — an automated cross-check, not a general solver and not a human attestation. It would fail on any unrecognised story.


## 5. Consolidated release-readiness recommendation

### Verdict: **CONDITIONAL PASS** (content) — NOT ready for publication

**Why CONDITIONAL PASS (not FAIL):**
- All 30 items are arithmetically correct, solvable, unambiguous, and have unique whole-number answers.
- Stored keys and model-solver results agree with independent solving on all 30 (0 discrepancies).
- Bar-model representations are appropriate to each skill type; diagrams are schematic/not-to-scale; no answer leakage into the blind packet or production client assets.
- Production gating is fail-closed and correctly configured.

### Release-readiness conclusion (owner decision — 27 October 2026)

The 30 items in this pilot are **SAMPLE / PILOT content only**. Per owner direction, they do **not** require independent human blind review and `approvedBy` must **not** be populated for them. All automated gates are green:

- 30/30 independent answers match stored keys and model-solver results (0 discrepancies).
- All 55 bar_model fixtures behave as intended (30 pilot; 25 schema/structural/invalid fixtures behave as intended).
- All production questions and showcase fixtures are valid; ledger consistency PASS.
- Complete authenticated CI is green on GitHub Actions (build + e2e + e2e:auth + rls all SUCCESS on commit `605ae990`; workflow runs 40437041869 and 40437037960).

The pilot is **mathematically sound, structurally sound, and technically ready for merge into `dev`**. PR #80 remains **draft** until the owner explicitly authorises merge. No merge, deployment, or content publication is performed here.

Approval requirements are **preserved unchanged** for production question banks and governed content: those still require a genuine independent human review, a populated `approvedBy`, and the governed publication gates before any publication decision.

### Conditions before merge (owner actions)
1. Confirm a fully green complete authenticated CI run — already demonstrated green on commit `605ae990` (workflow run 40437041869; second run 40437037960).
2. Keep `BAR_MODEL_PREVIEW_ENABLED` unset on any real Vercel deployment; real production returns 404 for the route (fail-closed).
3. Keep PR #80 draft until the owner explicitly authorises merge into `dev`. Do not merge, deploy, or publish without explicit owner authorisation.

### Explicit recommendation to owner
> Treat the 30-item bar-model pilot as **mathematically and structurally sound and technically ready for merge into `dev`**. Independent human blind review and `approvedBy` are **not required** for this pilot (sample content). Approval requirements remain in force for production question banks and governed content. Authorise merge only when ready; do not deploy or publish without explicit authorisation.

## 6. Recommended corrections (editorial / minor, optional pre-pilot)

| # | ID | Issue | Recommended correction | Class |
|---|----|-------|------------------------|-------|
| 1 | pilot-y5-equal-units-04 | "bottles" vs "cups of juice" mixed units | Rephrase to one unit (e.g., "3 jugs… 7 jugs… 90 cups") or make each bottle = N cups explicit | EDITORIAL |
| 2 | All 5 transfer items | "gives away" implies leaving the system; amount actually transfers to the other person | Rephrase to "gives [N] to X so they finish equal" (diagram already states total conserved) | EDITORIAL |
| 3 | Y3 times-as-many ×5 | Division facts (6×9=54, 4×12=48) beyond AC v9 Year-3 priority facts | Acceptable with "hard" label + bar support; consider noting in teacher guidance | MINOR |
| 4 | Cross-item | Repeated answers (11 ×2, 18 ×2, 23 ×2, 63 ×2, 36 ×2) | Not a numeric-entry defect; optional re-pairing for answer-pattern variety | EDITORIAL |

## 7. Unresolved risks (for owner awareness)

- **Human approval gap:** No independent human reviewer of record named yet; `approvedBy` unpopulated. Publication path is closed until this is resolved.
- **CI intermittency:** Local Windows unit/e2e runs were not fully green; complete authenticated CI remains the required gate and has not been demonstrated green in this session.
- **Narrow solver:** The independent arithmetic script recognises only the six pilot story forms; it is not portable to new item types without extension.
- **Year-3 times-as-many:** Borderline alignment with AC v9 Year-3 multiplication/division priority facts; monitor student performance if piloted.

---

**End of report.** This document is an automated AI review artifact. It does not constitute independent human blind review, does not populate `approvedBy`, and does not authorise merge, publish, or deploy of PR #80.

