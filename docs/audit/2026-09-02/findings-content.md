# Content Audit — origin/main @ ff7152f (2026-09-02)

Read-only audit. Nothing in the served product was modified. Scope: answer-key
correctness of the served bank, coverage honesty across every Grade 3 / Grade 5
curriculum node, and child-safety/age-fit of served content. `npm ci` was not
run (node_modules newer than package-lock.json — install was not stale).

Findings are ranked most-severe first. No CRITICAL findings were confirmed:
the independent re-solve of 48 numeracy items across every strand in both
grades found zero answer-key mismatches, and no age-inappropriate item was
found in served content. See "Confirmed clean" at the end for what was
checked and passed.

---

### [HIGH] Student-facing lesson list overstates practice-question counts by counting ungated, never-published questions
- dimension: coverage
- evidence: `src/features/curriculum/lessons/content/index.ts:116` — `questionCount: getMappedQuestionIdsForNode(lesson.curriculumCode).length` counts every ID in the static `alignments.ts` mapping with no filter against the published bank. Contrast with the three other places in the same codebase that resolve the same mapping and correctly filter to `getExamBank("published")`: `src/features/curriculum/lessons/resolver.ts:15-33` (`resolveQuestionsForCurriculumNode`), `src/app/practice/session/page.tsx:346-354` (the actual drill-session pool), and `src/server/curriculum/gated-practice-coverage.ts:227-234` (`servableCount`, which backs the parent-explorer badge).
  Concretely verified against the live `publishedExamBank` (1487 questions) for all 104 published curriculum nodes: 14 nodes overstate their count, worst case `VC2E5LY09` (Victorian Curriculum Level 5, English Literacy — "Evaluative comprehension"): the lesson list advertises **25 practice questions**, but only **11** exist in the published bank (14 of the mapped IDs — `gen-lang-syn-01083`, `gen-lang-ant-01084`, `gen-read-01161`…`gen-read-01172` — are `gen-`-prefixed auto-generated seeds from `practiceQuestionSeeds`, which `src/content/questions/practice-bank.ts`'s own docstring states are "reachable but have never been through the publication chain"). Full list of affected nodes (raw claimed → actually servable): `VC2M5N01` 24→20, `VC2M5N03` 21→20, `VC2M5N06` 7→6, `VC2M5N07` 10→9, `VC2M5N08` 22→20, `VC2M5N10` 10→9, `VC2M5ST01` 25→24, `VC2E5LA05` 22→21, `VC2E5LA06` 7→6, `VC2E5LA08` 25→23, `VC2E5LA09` 13→12, `VC2E5LY04` 7→5, `VC2E5LY05` 5→4, `VC2E5LY09` 25→11.
- failure scenario: A parent or student on `/student/learn` sees "25 practice questions" on VC2E5LY09 and reads that as a well-covered skill. The parent-facing coverage badge for the same underlying content (driven by `gatedPracticeCoverageResolver`, which does filter by publication status) would show the honest, much smaller number for the same skill — an internal contradiction between two surfaces of the same product describing the same node. `VC2E5LY05` also crosses the "Ready to practise" (≥5) vs. "In development" (1-4) threshold used elsewhere in the codebase (`resolveCoverageBadge`, `gated-practice-coverage.ts`): raw count (5) reads as "covered", real servable count (4) is "partial".
- confidence: confirmed

### [MEDIUM] Two independently-maintained coverage-computation systems can silently diverge — this is the architectural root cause of the finding above
- dimension: coverage
- evidence: the student-facing lesson pathway (`content/index.ts` → `alignments.ts`, a static snapshot generated once from `content/curriculum-imports/vic-f10-v2-l3-l5.json`) and the parent-facing coverage badge (`src/app/parent/curriculum-explorer/page.tsx:30` → `gatedPracticeCoverageResolver` in `src/server/curriculum/gated-practice-coverage.ts`, which reads live taxonomy alignments from Postgres via `postgres-catalogue.ts`) are two separate code paths with no shared source of truth and no test asserting they agree. The gated resolver already does the right thing (dedupes, requires `review_status === "approved"`, filters against the live published-bank ID set); the static path does none of that for its displayed count.
- failure scenario: any future content operation that unpublishes/rejects a previously-published question, or any drift between the DB-backed taxonomy alignments and the static `alignments.ts` snapshot, will move the parent badge and the student CTA in different directions with nothing to catch it — the exact class of bug this audit was asked to check for regressing (the LY01/02/12 pattern). It has already partially regressed in the narrower form documented above (raw vs. servable count on the static path).
- confidence: confirmed (the divergent-architecture fact); plausible (future drift beyond what's already measured)

### [LOW] Reading-passage text corruption (mojibake) served to Grade 3 students
- dimension: content
- evidence: 50 instances of double-encoded UTF-8 punctuation (`â€”`, `â€™`, `â€œ`) across two files: `src/content/questions/grade-3/icas-english.ts` (28 instances) and `src/content/questions/grade-3/naplan-reading.ts` (22 instances). Examples: `naplan-y3-reading-b-011` ("The Biggest Puddle") ends "...but tomorrow it might rain again â€” my, oh my!" where an em dash should render; `icas-y3-reading-f1-003` prompt reads "...the word shoots means â€”" with the same corruption. Confirmed present in the source file bytes (not a display artifact of this session's tooling — reproduced identically via `grep` and `Read`).
- failure scenario: a Grade 3 student (8-9 years old) reading a comprehension passage or question prompt sees a literal garbled character sequence mid-sentence instead of a dash or apostrophe, which is confusing at that reading level and looks unprofessional/broken.
- confidence: confirmed

### [LOW] Mild implied parental swearing in one Grade 3 narrative passage
- dimension: safety
- evidence: `icas-y3-read-narrative-007` ("The Night the Lights Went Out", Grade 3 ICAS English reading passage): "Dad said a word he tells us not to say, then laughed." No word is spelled out; it is played for light humour in an otherwise wholesome family power-outage story.
- failure scenario: this is not explicit language and is common in children's fiction, but some parents of an 8-year-old could object to any depiction — even indirect — of a parent swearing in front of children in assessment content. Flagging per the audit brief's "anything a parent would object to" instruction; this is a judgement call, not a clear-cut violation.
- confidence: plausible

---

## Coverage totals per grade (honest, published-bank-filtered counts)

Computed by resolving every published curriculum-lesson node's mapped question
IDs against the live `publishedExamBank` (the same filter the parent-explorer
badge and the actual practice-drill route apply), using the same covered
(≥5) / partial (1-4) / empty (0) thresholds as `gated-practice-coverage.ts`.

| Grade | Nodes | Covered (≥5) | Partial (1-4) | Empty ("coming soon") | Classroom-only |
|---|---|---|---|---|---|
| 3 (Level 3) | 54 | 29 | 5 | 14 | 6 |
| 5 (Level 5) | 50 | 46 | 1 | 0 | 3 |

Grade 5 has materially deeper practice coverage than Grade 3. Grade 3's 14
honestly-empty nodes are concentrated in Mathematics Algebra/Probability/
Statistics (`VC2M3A01`, `VC2M3A02`, `VC2M3M02`, `VC2M3ST03`, `VC2M3P01`,
`VC2M3P02`) and English Language/Literature/Literacy (`VC2E3LA02`, `VC2E3LA04`,
`VC2E3LA09`, `VC2E3LA10`, `VC2E3LE01`, `VC2E3LY03`, `VC2E3LY07`, `VC2E3LY08`) —
all of these correctly show "Coming soon" with no CTA, i.e. honest for this
category. No node was found showing a practice CTA with zero true (published)
questions behind it (the failure mode described in finding #1 is overstatement
of an already-nonzero count, not a fully fake zero-to-nonzero claim).

## `npm run validate:questions` / `npm run check:answers` output

Both ran clean on `ff7152f` with no `npm ci` needed:
- `validate:questions`: "All production questions and showcase fixtures are valid." (1005 production questions + 15 showcase fixtures)
- `check:answers`: Total 1005, Objective 1001, Manual-review 4, Fully computable (verified) 91, Editorial-review 910, Warnings 977 (all "requires editorial review" / "no visual data to verify against" — informational, not errors), **Failures: 0**.
- The task brief's KNOWN pre-existing red on `g5-icas-math-b01-008` was checked specifically: it no longer fails. `scripts/lib/twice-predicate.ts` (added specifically for this item, per its own doc comment) now correctly parses the "more than twice X but fewer than Y" interval. Independently re-solved by hand below — the key (`Red`, option `a`) is correct: twice Blue's 8 is 16; Red's 18 is the only score >16 and <20.

## Independent re-solve: 48 numeracy items, both grades, every strand

Sampled ~3 items per strand from the served numeracy/mathematics pool for
both grades (Grade 3: 8 strands across `icas-numeracy`, `icas-mathematics`,
`naplan-numeracy` — 24 items; Grade 5: 7 strands across `icas-mathematics`,
`naplan-numeracy` — 24 items), covering every question type present
(`multiple_choice`, `number_entry`, `true_false`, `multiple_select`,
`ordering`, `matching`, `hotspot`, `label_diagram`, `fill_blank`).

**Result: 0 mismatches.** Every item's answerKey matched an independent
hand-solve, including all multi-step word problems (e.g. `g5-nap-num-money-001`:
16 + 2×9 + 7 = 41), all "find two values that sum/differ to X" data-reading
items, and every non-multiple-choice interaction type. For every `matching`,
`multiple_select`, `ordering`, `hotspot`, and `label_diagram` item sampled
(11 of the 48), the answerKey's option/pair/region IDs were confirmed to
resolve to IDs actually defined in that item's `options`/`interaction` block
— no dangling references found.

## Confirmed clean (checked, no regression found)

- **LY01/LY02/LY12 declarative-quiz-faking-coverage pattern**: does not appear
  to have regressed. All 6 classroom-only nodes (`VC2E3LY01`, `VC2E3LY02`,
  `VC2E3LY13`, `VC2E5LY01`, `VC2E5LY02`, `VC2E5LY12` — spoken interaction,
  spoken delivery, and handwriting skills per `src/features/curriculum/lessons/classroom-only.ts`)
  currently have exactly 0 mapped questions each and correctly render
  "Practised in class" with no practice CTA. No classroom-only node was found
  with a nonzero question count.
- **No node found offering a "Practise drill" CTA backed by zero real
  (published) questions** — the 14 overstatement cases in finding #1 all
  still have at least 4 genuinely published questions behind them.
- **Child-safety sweep**: all unique reading-comprehension passages in both
  grades (Grade 3 NAPLAN Reading: 25 passages; Grade 3 ICAS English: 37;
  Grade 5 NAPLAN Reading: 9; Grade 5 ICAS English: 1) were read in full — no
  violence, sexual content, substance use, self-harm, hate speech, or
  culturally insensitive material found. Character names and contexts reflect
  diverse, respectfully-portrayed Australian settings. A codebase-wide keyword
  sweep (kill/weapon/drug/alcohol/violence/hate/etc.) across every grade-3 and
  grade-5 content file surfaced only benign hits (e.g. "salt water would kill
  most trees" in an informational mangrove passage; a vocabulary-in-context
  distractor referencing "sharp sounds like a gun makes" as one of three
  ordinary homonym senses of the word "shoots", correctly not the keyed
  answer). The digital-technologies online-safety question set (stranger
  contact, password sharing, personal-information disclosure) was spot-checked
  in full for Grade 3 — every item's answerKey points to the safe behaviour,
  never the unsafe one.
