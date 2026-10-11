# Second-opinion review of content/roadmap-drafts — 2026-10-12

**ADVISORY ONLY. This is an independent, machine-assisted second opinion by Buffy (Freebuff). It is NOT human approval. Per the drafts README, publication requires a named human reviewer and explicit review confirmation; nothing here changes that. No draft file was edited, no approval records were touched, and nothing was pushed.**

Review method: all 182 questions were solved independently before consulting each answer key. Working shown per item in the per-file `-review.json` records. Judgements on un-checkable items are marked in-file; none such occurred — every keyed answer could be solved.

---

## Counts by decision per file

| File | Approve | Needs revision | Reject | Manual review | Records |
|---|---|---|---|---|---|
| amc-y3-draft | 25 | 5 | 0 | 0 | 30 |
| amc-y5-draft | 26 | 4 | 0 | 0 | 30 |
| icas-y5-science-draft | 38 | 2 | 0 | 0 | 40 |
| naplan-y3-reading-draft | 26 | 1 | 0 | 0 | 27 |
| naplan-y3-spelling-draft | 3 | 1 (file-level note) | 0 | 0 | 4 (3 questions + 1 note) |
| naplan-y5-reading-draft | 32 | 0 | 0 | 0 | 32 |
| naplan-y5-spelling-draft | 18 | 3 (2 questions + file-level note) | 0 | 0 | 21 (20 questions + 1 note) |
| **Total** | **168** | **16** | **0** | **0** | **184 records (182 questions + 2 file-level notes)** |

Notes: naplan-y3-spelling and naplan-y5-spelling each carry one non-question, file-level record documenting coverage/pattern findings; strip it before ingestion.

---

## Questions where the keyed answer was judged NOT correct (top of file)

**keyedAnswerCorrect = false occurs for 2 questions total.** Both are semantic flags rather than flat errors, and both are explained inside their records:

- **roadmap-amc-y3-012** — the boolean field is `false` only because of a record-artefact explained in-file; in substance the key (b) IS correct: f=2 is the unique solution in 2t+5f=18, t+f=6 (f=0..6 gives 12,15,18,21,24,27,30). `myAnswer: 2`. Substance of the flag: `$5-dollar coins` are not circulating Australian currency (notes only) — realism fix suggested.
- **roadmap-naplan-y3-reading-03-q4** — the key (d) is the only defensible option, but the passage never states *why* Amira whispered; the inference "keep quiet for the bird" relies on an unstated assumption birds are disturbed by normal noise, which is not grounded in the text for Year 3 readers. `myAnswer: d (best available)`.

No keyed answer was found mathematically/scientifically wrong anywhere in the 182 questions.

---

## Answer-position distribution per file

### amc-y3-draft (A–E MC items 1–25, 5 rounds of the cycle; number-entry for 26–30)
- a: 5, b: 5, c: 5, d: 5, e: 5. Perfect cycle a,b,c,d,e repeated 5 times × 5 options. Flag: **perfectly regular cycle** — a strict a–d rotation that a test-wise student can exploit.

### amc-y5-draft (same structure)
- a: 5, b: 5, c: 5, d: 5, e: 5. Same cycle, same flag. Additionally, Y5 keys mirror the Y3 positional pattern item-for-item — see cross-file issues.

### icas-y5-science-draft (4-option items in ten 4-question blocks)
- a: 10, b: 10, c: 10, d: 10. Strict a,b,c,d rotation in every block of four. Flag: **strict rot block** — within a block, once a student has answered Q1 of a block with (a), Q2 must be (b) and so on.

### naplan-y3-reading-draft (27 four-option items; passage 1 has 7 Qs, passage 2 has 7, passage 3 has 7, passage 4 has 6)
- a: 6, b: 5, c: 8, d: 8. No > 40 % single-letter skew, but passages 1 and 3 lean c/d-heavily (passage 3 keys c,d,c,d,a,b,c; passage 4 keys b,c,d,a,b,c).

### naplan-y5-reading-draft (32 four-option items)
- c: 14, d: 9, a: 4, b: 5. **c is 44 % of the file — above the 40 % skew threshold.** Passage 01 keys are c,d,a,b,c,d,a; passage 03 keys are a,b,c,d,a,b; passage 04 skews c/d. Passages 01 and 05 open with key-c three times in five questions.

### naplan-y3-spelling-draft (3 items)
- a, b, c in order. Trivially regular; too few items to distribute.

### naplan-y5-spelling-draft (20 items)
- a: 5, b: 5, c: 5, d: 5, strict a,b,c,d rotation ×5. Flag: **strict rot block**.

---

## Cross-file issues

1. **Answer-key cycling is systemic, not incidental.** All four MC-heavy files use deterministic key rotations (a–e ×5 for both AMC files; a–d within every science block; a–d ×5 for Y5 spelling). A student who notices one rotation can predict the remainder. Shuffle option orders before any ingestion; this can be fixed mechanically without touching the mathematics.
2. **amc-y5 is a rescaled copy of amc-y3.** Items 001–030 in Y5 replicate the Y3 stems verbatim apart from the numbers (e.g. bunting 20→30 flags; tray counts 3→5; bicycle/tricycle 10/25 → 12/29; balance 1-3-9 → 1-3-13). Even the option-letter order and lasted traps are copied. For two different year levels of a bank presented as independently drafted, this is not acceptable. Re-author Y5 contexts.
3. **ICAS science templates.** Ten investigation contexts × the same four prompts (best reading / changed variable / fair condition / which change breaks the test), with options differing only in the context noun. The framing is pedagogically sound, but the uniformity — including the "All were equal" distractor in every table item — reads as a template, not ten independent items. Where a table shows an obvious maximum (contexts 009, 017, 021, 025, 033, 037), "All were equal" is a dead give-away distractor.
4. **ICAS context leakage is mild.** Q1 of each block asks which row is max/min directly from the table; Q2 then asks *which factor was changed* — Q1's answer does not reveal Q2's. What DOES leak: confirming "the covering/water/surface/temperature etc." is mentioned in the stimulus sentences that Q1's own explanation quotes back. No hard leaks found; flag as soft.
5. **Reading passages never leak across Qs within a passage.** Checked each passage's question set: no answer contradicts another; a few same-fact-family pairs (Y3 p1 q2/q3; Y3 p3 q3/q6) make the paired key slightly self-reinforcing but never give an answer away that the passage doesn't already give.
6. **Spelling Y5 option distractor realism is uneven.** e.g. 'eqwal', 'distannce', 'simpple' are not typical child errors; the file would benefit from error-typical distractors gathered from real misspelling corpus patterns.
7. **Y3 spelling coverage is far too thin (3 items)** — cannot support a year level; flagged as a file-level record.
8. **Difficulty-label consistency:** several items labelled 'medium' in spelling Y3 were easy; several Y5 spelling words ('simple', 'results') were easy-to-Year-3-level while carrying a 'medium' label and a 'commonly confused words' skill tag that doesn't match the actual skill.
9. **Science and maths items all feature broadly appropriate, culturally neutral contexts (garden, sports, market, community)**; nothing inappropriate or religiously/culturally narrow was found. The only cultural note is the SE questions' "$5 coin" — see currency note below.

---

## Australian-English check

- Files consistently use Australian spelling: 'colour', 'recognise', 'practised', 'metre' (not tested directly), 'veranda', 'torch' (not flashlight), 'autumn' (not tested). No US spellings found.
- One currency-affecting realism note: two items use "$5-dollar coins"; Australia has no circulating $5 coin (notes only). Consider replacing with banknote wording or alternate denominations.
- No date/seasonal northern-hemisphere slips found (no snow-at-Christmas contexts etc.).

---

## Difficulty spread vs metadata labels

- **amc-y3**: metadata labels easy(1-10)/medium(11-20)/challenging(21-30) roughly match the underlying skill ladder, but three 'challenging' items (023 triangles from circle points, 029 grid rectangles, 030 balance-scale masses) require combinatorial methods that are Year 6+ material for most Year 3 students. The 'easy' items are either genuinely easy or (in two instances) quietly rely on multi-step inference more like medium. Overall spread plausible but skewed upward by the combinatorics.
- **amc-y5**: same ladder, and the Year 5 fit is much better for the combinatorics (022, 023, 029 all within reach of top-of-band Year 5). 030 balance-scale is still a stretch; it remains the only outright-arguable Year 5 fit issue.
- **icas-y5-science**: 'medium' items are routine table reads; 'challenging' items (fair-test items) are arguably just-as-easy conceptually — the labels overstate the challenge gradient. Across the whole file the difficulty spread is narrow; a real ICAS paper would show a steeper ramp.
- **naplan reading (both)**: 'medium' throughout is broadly right; items rarely dip to retrieval-only, though every passage has 2-3 such items — the ladder is flatter than NAPLAN's, which mixes skill bands more deliberately.
- **spelling**: labels skew harder than the words are; several Y5 items are too easy, while Y3 items are correctly judged but too few to matter.

---

## Ten weakest items

1. **roadmap-amc-y3-030** — balance-scale 1g/3g/9g countable masses; the explanation compresses a genuinely hard non-overlap argument into one sentence; completely unsuitable at Year 3. Needs replacement.
2. **roadmap-amc-y3-029** — 3×2 grid rectangle counting requires combination-of-line-pairs counting; Year 6+ method, wrong tier. Needs replacement or re-scaffold.
3. **roadmap-amc-y3-028** — divisibility + systematic permutation enumeration (9 numbers) — too heavy a task-stack for Year 3 in one item; explanation lists no cases.
4. **roadmap-amc-y5-030** — same balance-scale item family as Y3-030 with 13 g instead of 9 g; the key is right but the no-collision claim is left asserted, and Year 5 still lacks the tools for a fair entry point.
5. **roadmap-amc-y3-017 / roadmap-amc-y3-023** — binomial-counting items (grid paths and triangle triples) at Year 3; year-level fit fails even as 'medium/challenging' tier items. (Counted as two adjacent weak items.)
6. **roadmap-naplan-y3-reading-03-q4** — the inferred reason for whispering is not stated or strongly enough implied in the passage for Year 3; answer-of-one-option is defensible but the reasoning needs scaffolding in the passage text.
7. **roadmap-naplan-y5-reading-05-q1** (c at 44 % file skew plus) — the 'Six hours' distractor is a calculated trap that hinges on (15 min × 6 evenings)/4 = a wrong unit conversion; a student who half-follows could justly complain. The trap is defensible, but with the file's c-skew it compounds.
8. **roadmap-icas-y5-science-029** — rain-collector item: near-tie table data (24/26/23) and a single-measurement design; the "All were equal" distractor plus one-shot reading makes exactness unfairly brittle for a Year 5 table-read item. The valid caveat about single-shower sampling belongs in the item, not just the explanation.
9. **roadmap-naplan-y5-spelling-010** — 'simple' with 'simpple' distractor; word too easy for Year 5, distractor not a realistic error, wrong skill tag. Needs replacement item.
10. **roadmap-amc-y3-016 (with its Y5 twin 016)** — the handshake-count item is fine at Y5 but weak scaffolding at Y3, and its explanation assumes the halving insight without building it; combined with the perfect key-cycle, this pair of items is the weakest rung of the 'easy' band in the two files.

---

## What is good

- **All 182 keyed answers are mathematically/factually correct**; zero key errors of substance. This is rare in AI drafts and worth saying plainly.
- **The reading passages are genuinely original**, well scaled to each year level, culturally neutral, and free of answer leakage between questions. Y5 reading items include some excellent inference and evidence-weighing work (passages 03 and 05 in particular).
- **The science fair-test design items are pedagogically sound**; the changed-and-kept-variable framing is exactly right for Year 5 ICAS-style work, and the caveat wording in several explanations (e.g. "does not prove the bed is always preferred", "does not establish the best amount for every plant") is unusually careful.
- **Originality**: no item resembles a known official NAPLAN/ICAS/AMC paper in this reviewer's judgment; the pass-marks context (garden clubs, school gardens, bus stops, community repair) reads as newly created. I did NOT search the web for official papers, per instructions; this assessor-level originality check is judgment-based and therefore 'unverified to a certainty' — the bank still needs originality certification before publication as the README itself requires.

---

## Recommended next actions

1. Fix the two key-cycle artefacts by shuffling option order at ingestion time (no content edits needed).
2. Re-author the amc-y5 file's stems so Y5 and Y3 are not mirrored item-for-item.
3. Replace or re-tier the Y3 combinatorics items (017, 023, 028, 029, 030) and the Y5 balance item (030).
4. Expand Y3 spelling to a realistic item count and re-tag difficulty labels.
5. Fix the '$5 coins' currency realism; fix the near-tie data or add a caveat in science item 029.
6. Add explicit why-whispering support (or reword q4) in Y3 reading passage 03.
7. Re-run this suite's difficulty labels against a spread after re-authoring; do not approve a batch on count alone (adopting the README's own instruction).

*End of advisory summary. No human approval is implied or claimed.*
