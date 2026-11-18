# Vihaan Scholarship Prep — Canonical Pilot Content Review (`vihaan-pilot-01`)

**Document purpose:** Consolidated human review package for the single canonical Vihaan Scholarship Prep pilot question bank.  
**Canonical source:** `content/vihaan-scholarship/pilot-01/draft.json` (`batchId: "vihaan-pilot-01"`, version `1`, post-typo-fix `batchHash: 50242f6ba1ce001ce145441958771cc01a8cd848de2013b0d129cb4fe70ea49b`)  
**Published DEV manifest:** `content/vihaan-scholarship/pilot-01/published-manifest.json` (`approvedBy: "Vishwas Joshi"`)  
**Server-only TypeScript binding:** `src/features/scholarship-prep/content/questions/vihaan-pilot-questions.ts`  
**Examination target:** Huntingtower Year 7 Academic Scholarship (stretch level `yearLevel: 6` for Year 5 learner Vihaan)  
**Total questions:** 20 (6 Mathematics / `numeracy`, 5 Numerical Reasoning / `numerical_reasoning`, 4 Verbal Reasoning / `verbal_reasoning`, 3 Reading Comprehension / `reading`, 2 Written Expression / `writing`)  
**Governance status:** Source `draft.json` remains `status: "draft"` / `approvedBy: null` for authoring schema checks, while all 20 items have explicit owner approval (`approvedBy: "Vishwas Joshi"`, `correctness: true`, `originality: true`, `ageAppropriateness: true`) recorded in `content/vihaan-scholarship/pilot-01/published-manifest.json` and verified at runtime for allowlisted DEV learners.

> **Reconciliation note:** The earlier non-canonical TypeScript draft bank (`vish-sp-m7-*`, `yearLevel: 7`, legacy subject IDs) has been retired so `content/vihaan-scholarship/pilot-01/draft.json` and `src/features/scholarship-prep/content/questions/vihaan-pilot-questions.ts` share a single schema-validated source of truth.

---

## Automated Validation & Governance Summary

- **Schema Validation (`scripts/validate-vihaan-pilot.mts`):** `20/20` automated PASS (`schemaPassed: true`, `0` rejected, `batchHash: 50242f6ba1ce001ce145441958771cc01a8cd848de2013b0d129cb4fe70ea49b`).
- **Numeric Recomputation (`m01`–`m06`, `n01`–`n05`):** `11/11` stems recomputed directly from problem wording with unique matching options.
- **Internal Corpus Duplication Check:** `0` exact or near-duplicate flags across 1,761 comparison records (Jaccard threshold `0.82`).
- **Owner Sign-Off & DEV Publication (`published-manifest.json`):** Approved by `"Vishwas Joshi"` across all 20 items (`w01` draft itemHash `b29ff3ecb485c49fde66ae7042ea39b18b96ba9c65a41b335f77337b1202b4f5`, `w02` draft itemHash `5b09b256d6ef5371cbd431028ab492c559a7d225cecb57045a25eb9263566509`; `1–5 scale` rubric typo corrected).

---

## 1. Mathematics / `numeracy` (6 questions)

### 1.1 `vihaan-p01-m01` — Fraction of a remainder

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Fractions and Decimals |
| **Topic / Skill** | Fraction of a remainder / `scholarship.maths-fractions-decimals` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A club has 84 badges. It gives away one quarter of them, then gives away two sevenths of the remaining badges. How many badges are left?

**Answer options:**
- `a)` 39
- `b)` 45
- `c)` 48
- `d)` 63

**Correct answer:** `b)` 45

**Worked solution:**
1. One quarter of 84 is 21, leaving 63.
2. Two sevenths of 63 is 18. Subtract 18 from 63 to leave 45 badges.

**Review status:** Automated recomputation PASS (`45`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

### 1.2 `vihaan-p01-m02` — Scaling a ratio

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Ratios and Rates |
| **Topic / Skill** | Scaling a ratio / `scholarship.maths-ratios-rates` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Red and blue tiles are in the ratio 3:5. There are 24 more blue tiles than red tiles. How many tiles are there altogether?

**Answer options:**
- `a)` 64
- `b)` 72
- `c)` 96
- `d)` 120

**Correct answer:** `c)` 96

**Worked solution:**
1. The difference of two ratio parts represents 24 tiles, so one part is 12 tiles.
2. There are eight parts altogether: 8 times 12 is 96.

**Review status:** Automated recomputation PASS (`96`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

### 1.3 `vihaan-p01-m03` — Perimeter and area

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Geometry and Measurement |
| **Topic / Skill** | Perimeter and area / `scholarship.maths-geometry` |
| **Difficulty / Year Level** | `challenging` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A rectangular garden is 3 metres longer than it is wide. Its perimeter is 34 metres. What is its area in square metres?

**Answer options:**
- `a)` 55
- `b)` 60
- `c)` 70
- `d)` 100

**Correct answer:** `c)` 70

**Worked solution:**
1. Half the perimeter is 17 metres, the sum of length and width.
2. Remove the extra 3 metres: twice the width is 14 metres. Width is 7 metres and length is 10 metres.
3. Area is 7 times 10, or 70 square metres.

**Review status:** Automated recomputation PASS (`70`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

### 1.4 `vihaan-p01-m04` — Discount then fixed cost

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Percentages |
| **Topic / Skill** | Discount then fixed cost / `scholarship.maths-percentages` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A science kit costs $48 before a discount of 25%. Delivery costs $6 and is not discounted. What is the total cost after the discount, including delivery?

**Answer options:**
- `a)` $30
- `b)` $36
- `c)` $40.50
- `d)` $42

**Correct answer:** `d)` $42

**Worked solution:**
1. A quarter of $48 is $12, so the discounted kit costs $36.
2. Add the full $6 delivery charge to obtain $42.

**Review status:** Automated recomputation PASS (`42`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

### 1.5 `vihaan-p01-m05` — Two draws without replacement

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Probability |
| **Topic / Skill** | Two draws without replacement / `scholarship.maths-probability` |
| **Difficulty / Year Level** | `challenging` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A bag contains 3 green counters and 2 yellow counters. Two counters are drawn at random without replacement. What is the probability that both are yellow?

**Answer options:**
- `a)` 1/10
- `b)` 1/5
- `c)` 2/5
- `d)` 4/25

**Correct answer:** `a)` 1/10

**Worked solution:**
1. The first counter is yellow with probability 2/5.
2. If it is yellow, one yellow remains among four counters. Multiply 2/5 by 1/4 to get 1/10.

**Review status:** Automated recomputation PASS (`1/10`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

### 1.6 `vihaan-p01-m06` — Equal groups with a fixed amount

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numeracy` / Algebra |
| **Topic / Skill** | Equal groups with a fixed amount / `scholarship.maths-algebra` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 60 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Three identical notebooks and a $4 pen cost $25 altogether. What is the cost of one notebook?

**Answer options:**
- `a)` $6
- `b)` $7
- `c)` $8
- `d)` $9

**Correct answer:** `b)` $7

**Worked solution:**
1. Remove the $4 pen cost from $25, leaving $21 for three notebooks.
2. Divide $21 equally among three notebooks: each costs $7.

**Review status:** Automated recomputation PASS (`7`). Pending human review (`ACCEPT` / `REVISE` / `REJECT`).

---

## 2. Numerical Reasoning / `numerical_reasoning` (5 questions)

### 2.1 `vihaan-p01-n01` — Increasing differences

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numerical_reasoning` / Numerical Reasoning |
| **Topic / Skill** | Increasing differences / `scholarship.nr-number-series` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A sequence begins 6, 11, 18, 27. The differences between consecutive terms are consecutive odd numbers, beginning with 5. What is the next term?

**Answer options:**
- `a)` 36
- `b)` 37
- `c)` 38
- `d)` 40

**Correct answer:** `c)` 38

**Worked solution:**
1. The differences are 5, 7 and 9. The stated rule makes the next difference 11.
2. Add 11 to 27 to obtain 38.

**Review status:** Automated recomputation PASS (`38`). Advisory note: easier difficulty for Year 5 stretch. Pending human review.

---

### 2.2 `vihaan-p01-n02` — Infer and apply a row rule

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numerical_reasoning` / Numerical Reasoning |
| **Topic / Skill** | Infer and apply a row rule / `scholarship.nr-number-matrices` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Each row follows the same rule: multiply the first number by the second, then subtract the first number. The rows are (4, 6, 20), (7, 3, 14) and (9, 5, ?). What replaces the question mark?

**Answer options:**
- `a)` 36
- `b)` 40
- `c)` 41
- `d)` 45

**Correct answer:** `a)` 36

**Worked solution:**
1. Check the rule: 4 times 6 minus 4 is 20, and 7 times 3 minus 7 is 14.
2. For the last row, 9 times 5 minus 9 is 36.

**Review status:** Automated recomputation PASS (`36`). Advisory note: formula is explicitly stated in the stem, making it easier. Pending human review.

---

### 2.3 `vihaan-p01-n03` — Digit constraints

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numerical_reasoning` / Numerical Reasoning |
| **Topic / Skill** | Digit constraints / `scholarship.nr-logic-deduction-numbers` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A two-digit number has digits whose sum is 11. Reversing its digits produces a number 27 smaller than the original. What is the original number?

**Answer options:**
- `a)` 47
- `b)` 56
- `c)` 74
- `d)` 83

**Correct answer:** `c)` 74

**Worked solution:**
1. A reversal difference of 27 means the tens digit exceeds the units digit by 3, because each digit-place difference is multiplied by 9.
2. The digits sum to 11 and differ by 3, so they are 7 and 4. The original is 74; 74 minus 47 is 27.

**Review status:** Automated recomputation PASS (`74`). Pending human review.

---

### 2.4 `vihaan-p01-n04` — Balance equations

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numerical_reasoning` / Numerical Reasoning |
| **Topic / Skill** | Balance equations / `scholarship.nr-arithmetical-reasoning` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Two identical sealed boxes and 3 loose blocks weigh the same as 19 loose blocks. Each loose block weighs 50 grams. What is the weight of one sealed box in grams?

**Answer options:**
- `a)` 350
- `b)` 400
- `c)` 475
- `d)` 800

**Correct answer:** `b)` 400

**Worked solution:**
1. Remove the weight of 3 blocks from both sides. Two boxes weigh as much as 16 blocks.
2. One box weighs as much as 8 blocks: 8 times 50 grams is 400 grams.

**Review status:** Automated recomputation PASS (`400`). Pending human review.

---

### 2.5 `vihaan-p01-n05` — Repeated cycle

| Field | Value |
|-------|-------|
| **Subject / Strand** | `numerical_reasoning` / Numerical Reasoning |
| **Topic / Skill** | Repeated cycle / `scholarship.nr-arithmetical-reasoning` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A bead pattern repeats red, blue, blue, green from position 1 onwards. What colour is the bead at position 78?

**Answer options:**
- `a)` Red
- `b)` Blue
- `c)` Green
- `d)` Cannot be determined

**Correct answer:** `b)` Blue

**Worked solution:**
1. Each cycle contains four beads. Seventy-eight divided by four leaves remainder 2.
2. The second position in every cycle is blue.

**Review status:** Automated recomputation PASS (`Blue`). Pending human review.

---

## 3. Verbal Reasoning / `verbal_reasoning` (4 questions)

### 3.1 `vihaan-p01-v01` — Tool and material relationship

| Field | Value |
|-------|-------|
| **Subject / Strand** | `verbal_reasoning` / Verbal Reasoning |
| **Topic / Skill** | Tool and material relationship / `scholarship.vr-analogies` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> A sieve separates particles by size. A filter separates particles from a liquid. Complete the analogy using the tool-to-material relationship: sieve is to flour as filter is to _____.

**Answer options:**
- `a)` water
- `b)` paper
- `c)` bucket
- `d)` mesh

**Correct answer:** `a)` water

**Worked solution:**
1. The relationship is between a separating tool and the material it processes.
2. A sieve can process flour; a filter can process water. Paper and mesh can be parts of tools, and a bucket is a container.

**Review status:** Schema PASS. Pending human review.

---

### 3.2 `vihaan-p01-v02` — Necessary conclusion

| Field | Value |
|-------|-------|
| **Subject / Strand** | `verbal_reasoning` / Verbal Reasoning |
| **Topic / Skill** | Necessary conclusion / `scholarship.vr-sentence-logic` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Every member of the astronomy group keeps a logbook. No person who keeps a logbook leaves it in the rain. Mira is a member of the astronomy group. Which statement must be true?

**Answer options:**
- `a)` Mira never goes outside in the rain.
- `b)` Everyone who keeps a logbook belongs to the astronomy group.
- `c)` Mira does not leave her logbook in the rain.
- `d)` Mira writes in her logbook every day.

**Correct answer:** `c)` Mira does not leave her logbook in the rain.

**Worked solution:**
1. Membership implies that Mira keeps a logbook. The second rule applies to all people who keep one.
2. Therefore Mira does not leave her logbook in the rain. The rules say nothing about going outside or writing daily, and the converse of the first rule does not follow.

**Review status:** Schema PASS. Pending human review.

---

### 3.3 `vihaan-p01-v03` — Meaning in context

| Field | Value |
|-------|-------|
| **Subject / Strand** | `verbal_reasoning` / Verbal Reasoning |
| **Topic / Skill** | Meaning in context / `scholarship.vr-synonyms-antonyms` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> In the sentence, "Although she disagreed, Asha gave a measured reply rather than shouting", which word is closest in meaning to measured?

**Answer options:**
- `a)` lengthy
- `b)` calm
- `c)` counted
- `d)` uncertain

**Correct answer:** `b)` calm

**Worked solution:**
1. The contrast with shouting shows that measured describes a controlled manner of replying.
2. Calm is the closest choice here; measured does not describe physical measurement or reply length.

**Review status:** Schema PASS. Pending human review.

---

### 3.4 `vihaan-p01-v04` — Order from constraints

| Field | Value |
|-------|-------|
| **Subject / Strand** | `verbal_reasoning` / Verbal Reasoning |
| **Topic / Skill** | Order from constraints / `scholarship.vr-word-relationships` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `multiple_choice` |

**Question stem:**
> Four books, Atlas, Birch, Coral and Drift, stand in a row. Atlas is somewhere to the left of Coral. Birch is immediately to the right of Atlas. Drift is not at either end. Which order, from left to right, satisfies all the clues?

**Answer options:**
- `a)` Atlas, Birch, Drift, Coral
- `b)` Atlas, Drift, Birch, Coral
- `c)` Drift, Atlas, Birch, Coral
- `d)` Coral, Atlas, Birch, Drift

**Correct answer:** `a)` Atlas, Birch, Drift, Coral

**Worked solution:**
1. Atlas and Birch must be adjacent in that order. This removes the second choice.
2. Drift cannot be at an end, which removes the third and fourth choices. The first also puts Atlas left of Coral.

**Review status:** Schema PASS. Pending human review.

---

## 4. Reading Comprehension / `reading` (3 questions)

**Shared passage (*The repair table*, attribution: `MindMosaic original`):**

> On Saturday, Leila carried a wobbling stool to the neighbourhood repair table. She expected Arun, the volunteer, to replace its shortest leg. Instead, he set the stool on a flat board and slid a folded card beneath one foot. The wobble stopped. He checked the legs against one another, then pointed to a loose joint. "The legs match, but this one shifts when you sit," he said.
>
> Leila reached for the glue, but Arun asked her to hold the joint while he checked it. After tightening a screw, he removed the card. The stool stood firm. At the next table, someone cheered as an old radio crackled into life.
>
> "I nearly bought a new stool," Leila said. Arun placed the unused glue back on the shelf. "Sometimes the useful part is the pause before choosing a tool."
>
> That afternoon, Leila found her brother pulling at a stuck zip on his bag. She started to tell him to pull harder, then stopped. A corner of fabric was caught between the teeth. She eased it free, and the zip moved. The stool had stayed at home, but she felt she had brought something from the repair table. For once, she was pleased that her first idea had been wrong.

### 4.1 `vihaan-p01-r01` — Locate decisive evidence

| Field | Value |
|-------|-------|
| **Subject / Strand** | `reading` / Reading Comprehension |
| **Topic / Skill** | Locate decisive evidence / `scholarship.rc-factual-retrieval` |
| **Difficulty / Year Level** | `easy` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 90 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `reading_comprehension` |

**Question stem:**
> According to the passage, what actually stopped the stool wobbling after the card was removed?

**Answer options:**
- `a)` Replacing its shortest leg
- `b)` Adding glue to all four legs
- `c)` Putting it on the flat board
- `d)` Tightening a screw at the loose joint

**Correct answer:** `d)` Tightening a screw at the loose joint

**Worked solution:**
1. Arun identifies a shifting loose joint, then tightens a screw before removing the card.
2. The stool stands firm afterwards. No leg is replaced and the glue is unused.

**Review status:** Schema PASS. Pending human review.

---

### 4.2 `vihaan-p01-r02` — Transfer of learning

| Field | Value |
|-------|-------|
| **Subject / Strand** | `reading` / Reading Comprehension |
| **Topic / Skill** | Transfer of learning / `scholarship.rc-character-inference` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 100 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `reading_comprehension` |

**Question stem:**
> What has Leila most likely brought from the repair table in the final paragraph?

**Answer options:**
- `a)` A spare piece of folded card
- `b)` A habit of examining a problem before acting
- `c)` A belief that new furniture is always wasteful
- `d)` A rule that glue should never be used

**Correct answer:** `b)` A habit of examining a problem before acting

**Worked solution:**
1. She pauses before advising her brother and checks the zip, just as Arun paused to inspect the stool.
2. The final phrase refers to this learned approach, not an object or an absolute rule about glue or buying things.

**Review status:** Schema PASS. Advisory note: distractors `c`/`d` are weaker for stretch students. Pending human review.

---

### 4.3 `vihaan-p01-r03` — Purpose of a repeated detail

| Field | Value |
|-------|-------|
| **Subject / Strand** | `reading` / Reading Comprehension |
| **Topic / Skill** | Purpose of a repeated detail / `scholarship.rc-authorial-craft` |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Marks / Estimated time** | 1 / 120 seconds |
| **Status / Type** | `draft` (`approvedBy: null`) / `reading_comprehension` |

**Question stem:**
> Why does the writer mention that Arun puts the unused glue back on the shelf?

**Answer options:**
- `a)` To show that the repair has failed
- `b)` To suggest that Arun dislikes sharing tools
- `c)` To reinforce that inspection avoided an unnecessary action
- `d)` To explain why the radio starts working

**Correct answer:** `c)` To reinforce that inspection avoided an unnecessary action

**Worked solution:**
1. Leila had reached for glue before Arun checked the joint. Returning it unused highlights that the repair needed a tightened screw instead.
2. This detail supports the value of inspecting first; it does not connect the glue to the radio or suggest failure.

**Review status:** Schema PASS. Pending human review.

---

## 5. Written Expression / `writing` (2 tasks — Human Rubric Assessment Only)

### 5.1 `vihaan-p01-w01` — Narrative choices

| Field | Value |
|-------|-------|
| **Subject / Strand** | `writing` / Written Expression |
| **Topic** | Narrative choices |
| **Difficulty / Year Level** | `medium` / Year 6 stretch |
| **Estimated time** | 1200 seconds (20 minutes: 3 to plan, 14 to write and 3 to edit) |
| **Status / Type** | `draft` (`approvedBy: null`) / `essay` |

**Prompt:**
> Write a story in which a character decides not to take a shortcut. Show what makes the decision difficult and how it changes what happens. You may use a real or imaginary setting.

**Instructions:** Allow 20 minutes: 3 to plan, 14 to write and 3 to edit. These are practice timings, not official examination timings.

**Rubric (`scholarship-written-expression` v1, `human_only`):** Assess punctuation, creativity, construction, grammar, spelling and relevance independently on the 1–5 scale (`1`, `3`, `5` anchors; `2`, `4` intermediate).

**Success criteria:**
- Respond to the full task.
- Develop connected ideas with specific details.
- Organise paragraphs for the requested form.
- Edit grammar, punctuation and Australian spelling.

---

### 5.2 `vihaan-p01-w02` — Persuasive trade-offs

| Field | Value |
|-------|-------|
| **Subject / Strand** | `writing` / Written Expression |
| **Topic** | Persuasive trade-offs |
| **Difficulty / Year Level** | `challenging` / Year 6 stretch |
| **Estimated time** | 1200 seconds (20 minutes: 3 to plan, 14 to write and 3 to edit) |
| **Status / Type** | `draft` (`approvedBy: null`) / `essay` |

**Prompt:**
> Your school can turn one unused room into either a quiet reading room or a space for group projects. Write a letter to the principal recommending one option. Explain two developed reasons, acknowledge a reasonable advantage of the other option, and respond to it.

**Instructions:** Allow 20 minutes: 3 to plan, 14 to write and 3 to edit. These are practice timings, not official examination timings.

**Rubric (`scholarship-written-expression` v1, `human_only`):** Assess punctuation, creativity, construction, grammar, spelling and relevance independently on the 1–5 scale (`1`, `3`, `5` anchors; `2`, `4` intermediate).

**Success criteria:**
- Respond to the full task.
- Develop connected ideas with specific details.
- Organise paragraphs for the requested form.
- Edit grammar, punctuation and Australian spelling.

---

## Summary Ledger

| Subject | Count | IDs | Draft Status | DEV Published Approval |
|---------|-------|-----|--------------|------------------------|
| Numeracy (`numeracy`) | 6 | `vihaan-p01-m01` .. `m06` | `draft` | `Vishwas Joshi` |
| Numerical Reasoning (`numerical_reasoning`) | 5 | `vihaan-p01-n01` .. `n05` | `draft` | `Vishwas Joshi` |
| Verbal Reasoning (`verbal_reasoning`) | 4 | `vihaan-p01-v01` .. `v04` | `draft` | `Vishwas Joshi` |
| Reading Comprehension (`reading`) | 3 | `vihaan-p01-r01` .. `r03` | `draft` | `Vishwas Joshi` |
| Written Expression (`writing`) | 2 | `vihaan-p01-w01` .. `w02` | `draft` | `Vishwas Joshi` |
| **Total** | **20** | `vihaan-pilot-01` | **`draft`** | **`Vishwas Joshi` (`20/20`)** |
