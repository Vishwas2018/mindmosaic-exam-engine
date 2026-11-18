# Human Approval Package: Vihaan Scholarship Bank (AGY-500)

- **Bank ID:** `vihaan-scholarship-agy-500`
- **Status:** `draft`
- **Human Sign-off (`approvedBy`):** `null` (Pending human review; AI generation cannot self-approve or publish)
- **Publication Eligible:** `false` (until human editorial review and governed publication lifecycle complete)
- **Governance Alignment:** `AGENTS.md` & `ADR-017`

## 1. Automated Verification Summary

All 10 batches (`batch-01.draft.json` .. `batch-10.draft.json`) and the consolidated 500-item manifest (`bank.draft.json`) passed `scripts/validate-vihaan-agy-500.mts`:

- **Canonical Schema (`questionSchema` + `visualSchema`):** `500 / 500` PASS
- **Taxonomy Registry (`skillTaxonomyRegistry`):** `460 / 460` non-writing items PASS across all 29 registered Year 6 scholarship skills
- **Writing Rubric Contract (`scholarship-written-expression` v1, `human_only`):** `40 / 40` PASS
- **Independent Arithmetic Consistency (`evaluateArithmetic`):** `240 / 240` Mathematics + Numerical Reasoning items PASS (each evaluated expression matches its unique keyed option)
- **Visual Diagrams (`visualSchema`):** `43` items include canonical structured visuals (`31` tables/matrices, `4` geometry shapes, `3` coordinate grids, `1` bar chart, `1` line graph, `1` pie chart, `1` number line, `1` fraction model) with answer-free `altText`
- **Answer Position Balance:** `a: 115`, `b: 115`, `c: 115`, `d: 115` (exact 25% uniform distribution across all 460 MCQs)
- **Internal Corpus Originality Screen:** `0` exact stems, `0` near stems (token Jaccard >= 0.82), and `0` parameter-only variants across all existing curated, generated, scholarship-draft, pilot-01, and Codex/Cline `expansion-500` banks.
- **Answer Secrecy & Locale:** `0` answer cues in metadata/visuals; `0` HTML/URL/US-spelling violations.

## 2. Unseen Mock Examination Reservation (100 Items)

100 items are strictly flagged `reservedForMock: true` and grouped into two balanced 50-item timed mock examinations in [mock-exam-inventory.md](mock-exam-inventory.md):

- **Mock Paper A (`vihaan-agy-mock-A`):** [batch-09.draft.json](batch-09.draft.json) — 12 Maths, 12 NR, 12 VR, 10 Reading (2 passages), 4 Writing prompts.
- **Mock Paper B (`vihaan-agy-mock-B`):** [batch-10.draft.json](batch-10.draft.json) — 12 Maths, 12 NR, 12 VR, 10 Reading (2 passages), 4 Writing prompts.

## 3. Mandatory Human Review Checklist (Before Setting `approvedBy`)

1. **Blind MCQ Verification:** Solve MCQs blind to `answerKey` and confirm each distractor is plausible yet unambiguously wrong.
2. **Numerical Stem-to-Solution Grounding:** Confirm each `workedSolution` models the exact stem wording (per ADR-017 §3, automated arithmetic checks verify arithmetic consistency, not prose interpretation).
3. **Reading Evidence & Age Suitability:** Confirm every Reading key is directly supported by its passage and suitable for a Year 5/6 Huntingtower Scholarship candidate.
4. **Difficulty & Pacing Calibration:** Review `difficulty` (`easy`/`medium`/`challenging`) and `estimatedTimeSeconds` against Vihaan's target timed pace.
5. **Writing Taxonomy Onboarding:** Onboard writing skill tags into the governed taxonomy before any runtime publication.
6. **Record Approval:** Record human sign-off (`approvedBy`) through the governed approval lifecycle (`scripts/content-approvals.mts`).
