# Vihaan scholarship preparation — draft bank of 500

**Status: draft, `approvedBy: null`, 0 approved, 0 published.** This is a private content-review package. Human approval through the existing governed lifecycle is required before student use.

The [draft bank index](bank.draft.json) defines the full bank. It retains the original [20-item pilot](../pilot-01/draft.json) by reference and adds 480 original items. The pilot source is unchanged. The application still imports its existing pilot source; this package does not wire draft content into student routes.

| Subject | Total | Retained | New | Easy | Medium | Challenging |
|---|---:|---:|---:|---:|---:|---:|
| Mathematics | 120 | 6 | 114 | 15 | 59 | 46 |
| Numerical Reasoning | 120 | 5 | 115 | 10 | 61 | 49 |
| Verbal Reasoning | 120 | 4 | 116 | 25 | 46 | 49 |
| Reading Comprehension | 100 | 3 | 97 | 20 | 41 | 39 |
| Written Expression | 40 | 2 | 38 | 5 | 18 | 17 |
| **Total** | **500** | **20** | **480** | **75 (15%)** | **225 (45%)** | **200 (40%)** |

Each new item contains its canonical question, explanation, worked solution or writing guidance, skills, estimated time and review focus. Numeric items also contain private arithmetic verification evidence outside the question's metadata. These files contain answer material and must remain outside public assets and browser bundles.

## Review batches

| Review unit | New | Retained pilot references | Content | Validation |
|---|---:|---:|---|---|
| 01 | 30 | 20 | [Draft](batch-01.draft.json) | [Report](batch-01.validation.json) |
| 02 | 50 | 0 | [Draft](batch-02.draft.json) | [Report](batch-02.validation.json) |
| 03 | 50 | 0 | [Draft](batch-03.draft.json) | [Report](batch-03.validation.json) |
| 04 | 50 | 0 | [Draft](batch-04.draft.json) | [Report](batch-04.validation.json) |
| 05 | 50 | 0 | [Draft](batch-05.draft.json) | [Report](batch-05.validation.json) |
| 06 | 50 | 0 | [Draft](batch-06.draft.json) | [Report](batch-06.validation.json) |
| 07 | 50 | 0 | [Draft](batch-07.draft.json) | [Report](batch-07.validation.json) |
| 08 | 50 | 0 | [Draft](batch-08.draft.json) | [Report](batch-08.validation.json) |
| 09 | 50 | 0 | [Draft](batch-09.draft.json) | [Report](batch-09.validation.json) |
| 10 | 50 | 0 | [Draft](batch-10.draft.json) | [Report](batch-10.validation.json) |

Every resolved review unit contains exactly 50 distinct questions. The first file deliberately stores only its 30 new items, avoiding a second canonical copy of the pilot. Separate `--batch N` invocations validate each unit against the existing internal corpus and preceding units. The consolidated run refreshes all ten reports against the full 500-item corpus.

## Quality and coverage

The [consolidated quality and coverage report](quality-coverage-report.json) records exact counts, skill coverage, difficulty by subject, time ranges, passage lengths, answer-position distribution, corpus snapshots, hashes and every batch outcome. Each batch report also lists per-item checks and review obligations.

- Mathematics covers all seven registered scholarship strands: algebra, directed numbers, fractions/decimals, geometry/measurement, percentages, probability and ratios/rates. Statistics tasks use the existing algebra/probability registry entries; no new taxonomy has been invented.
- Numerical Reasoning includes 41 series, 26 number grids, 26 numerical deductions and 27 arithmetical reasoning items, including the retained pilot.
- Verbal Reasoning covers all seven registered skills. Vocabulary/context accounts for 61 items; the remainder cover analogies, classification, codes, letter series, conditional logic and word relationships. This is a practice-bank allocation, not an official test weighting.
- Reading contains **21 passage sets**: 20 new sets plus the retained pilot passage. New forms include narrative, poetry, dialogue/interview, letter, advertisement, notice, instructions, paired accounts and informational/argument texts. Fictional investigations are explicitly labelled; their invented observations are not presented as research findings.
- Writing has 8 narrative, 8 persuasive, 6 descriptive, 6 expository, 6 informative and 6 creative tasks. New prompts contain specific planning/development/revision guidance. All use the existing six-criterion human-assessed rubric. There is no unique correct writing response.
- MCQ practice estimates range from 60 to 210 seconds, including initial reading allowance where applicable. New writing tasks allow 900 seconds in total. The two retained 1200-second pilot tasks remain extended practice. When using a shared passage set, do not charge its initial reading time repeatedly; these are individual practice estimates rather than a timed mock-paper specification.

### What the checks establish

The expansion validator reuses the canonical schema, existing taxonomy, pilot envelope fields, hashing, similarity function and writing rubric. It validates all 500 questions, all 460 non-writing taxonomy mappings and all 40 writing rubric contracts. It checks IDs, answer-option uniqueness, explanation consistency, draft status and absence of unsupported assets or answer cues in descriptive metadata.

The retained pilot's 11 numerical questions retain their whole-stem recomputation. The 229 new numerical questions have independent TypeScript evaluation of the arithmetic expressions authored with their solutions and unique matching key checks. **This checks arithmetic consistency; it does not independently prove that every expression correctly models its stem.**

Exact stems, token Jaccard similarity at or above 0.82, and otherwise-identical stems with numeric literals substituted block validation. The screened corpus includes curated stems, generated JSON banks, scholarship draft JSON, the pilot and expansion peers. The consolidated report records its size and hashes. No external question corpus is searched: passing this screen is bounded internal evidence, not a worldwide originality or copyright certification. Related skill families intentionally recur with distinct tasks and reasoning demands.

### Human review still required

1. Solve every MCQ blind to its key; check each distractor and ground numerical solutions in the actual stem.
2. Check passage evidence, semantic ambiguity, Australian English and suitability for an above-average Year 5/6 learner.
3. Calibrate the authored difficulty labels and timing estimates; neither is psychometrically established.
4. Review originality, including resemblance to familiar assessment patterns beyond the internal corpus.
5. Assess writing using the existing rubric. Writing skill-registry onboarding remains a separate prerequisite before publication; the draft uses form and process tags rather than invented registered skill IDs.
6. Record actual human approval through the existing content lifecycle. AI provenance and automated passes cannot populate `approvedBy` or grant publication eligibility.

## Reproduce

Run from the isolated worktree root, with the repository's existing dependencies available:

```powershell
python scripts/build-vihaan-expansion.py
node --import tsx scripts/validate-vihaan-expansion.mts --batch 1 --write-report
node --import tsx scripts/validate-vihaan-expansion.mts --write-report
```

The builder emits one review unit, invokes the independent batch validator and stops on failure before emitting the next unit. It then runs consolidated validation. The builder is deterministic. Original authoring rows live in `scripts/author-vihaan-expansion.py`, `scripts/vihaan-reading-data.py` and `scripts/vihaan-writing-data.py`. Editing content requires rebuilding and regenerating the reports; human approvals must then refer to the reviewed content hashes.

The public [Edutest assessment descriptions](https://www.edutest.com.au/tests_parents.html) informed broad areas and writing modes only. No external test questions, passages or prompts were used. MindMosaic is independent and is not endorsed by Edutest or Huntingtower.
