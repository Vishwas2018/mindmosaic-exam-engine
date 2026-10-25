# AMC final seven: refreshed owner decision pack

**Baseline:** `origin/dev` `608e1fe4324408ccb4c78c2673f7a50069e2ad65`, plus the remediation in this branch. The exact commit this pack describes is the head of PR #76 at the time you read it (`git rev-parse HEAD`); the hashes below are what an approval would bind to.
**Status:** nothing here is approved, ingested, staged, published or deployed. **Every owner decision field is blank.** The positions below are recommendations only and are not owner approvals.

Evidence classes: **Verified** (run in this session with the repository's own code), **AI review** (Claude Sonnet 5.5, not a qualified human approval, and the same model family as the earlier Claude Opus 5.5 reviews), **Historical** (used only where its revision and hash binding were confirmed).

An approval binds `revision`, `contentHash` and `sourceManifestHash`. All seven are revision 1.

---

## 1. What changed since the previous pack

| Question | Change in this branch | Needs |
|---|---|---|
| `y3-014` | **New revision proposed** (equal-sharing wording) **and its learner-visible skill label corrected** (Patterns & Algebra, Algebraic thinking and unknown values; was Statistics & Chance, Averages and data summaries). The earlier hashes `ec632c61…` and `853f53d3…` are **superseded** and must not be approved | Fresh qualified human review of the exact revision below, then your decision |
| `y5-028` | **New revision proposed** (bags of counters) | Fresh independent review, then your decision |
| `y5-019` | **Content unchanged.** A renderer fix removes the presentation defect on the exam page, and the same AMC-only fix now applies to the post-exam results page | Your decision on the unchanged content |
| `y3-005`, `y3-016`, `y3-026`, `y5-006` | Untouched | Your decision |
| Results page | The post-exam review now keeps authored line breaks for `amc_style` prompts (NAPLAN and ICAS unchanged). No question data, scoring or answer key changed | Nothing from you |
| Showcase test fixtures | **Corrected after review.** An earlier version of this branch put the full unpublished `y5-019` question, options and answer key into a public showcase fixture. They are now clearly synthetic demonstration content, and tests guard against any real or unpublished question text returning | Nothing from you |

---

## 1a. What review has and has not happened

| Evidence | What it is | What it is not |
|---|---|---|
| Earlier Claude Opus 5.5 reviews (12 Oct) | AI review. They describe different questions under six of the seven IDs | Not a review of these revisions |
| An independent AI review of PR #76 (REQUEST CHANGES) | AI review; its text is not on the PR | Not a qualified human sign-off |
| Claude Sonnet 5.5 adjudication of the seven | AI advisory evidence, curriculum-referenced | **Not independent for `y3-014` and `y5-028`:** the same model family wrote those two revisions. Not a qualified human sign-off for any question |
| Repository checks (hash binding, first-party solvers, tests) | Verified mechanically | They prove the keyed arithmetic and the bindings, not that the wording is clear or age-appropriate |

**No qualified human has reviewed any of the seven current revisions, and `y3-014` and `y5-028` have had no independent review of any kind.** Neither is represented as independently approved. The AI findings below are inputs to your decision; they do not replace a qualified reviewer, and no approval or signature is recorded anywhere in this branch.

---

## 2. Positions recorded for owner review

| Question | Slot | Recommended position |
|---|---|---|
| `y3-005` | Y3 T1 (MC, 3 marks) | Approve the current wording |
| `y3-014` | Y3 T2 (MC, 4 marks) | Review the revised wording below; do not approve the old wording |
| `y3-016` | Y3 T2 (MC, 4 marks) | **Easy**, 4 marks, with a **fresh** owner approval rather than automatic reinstatement of the archived signature |
| `y3-026` | Y3 T4 (number, 6 marks) | Approve **only after the difficulty flag is explicitly resolved** |
| `y5-006` | Y5 T1 (MC, 3 marks) | First approval of the current question; the old encoding allegation is stale |
| `y5-019` | Y5 T2 (MC, 4 marks) | Content unchanged; decide on it once the renderer fix is accepted |
| `y5-028` | Y5 T4 (number, 8 marks) | Review the revised wording below; do not approve the old wording |

### Proposed difficulty positions (recommendations only, not decisions)

| Question | Proposed label and marks | Basis | Strength | Change needed to apply |
|---|---|---|---|---|
| `y3-016` | **Easy, 4 marks** (as drafted) | Level 3 core content (×4 facts, two steps); marks are the tier position, separate from the label | Moderate. A label judgement without student data | None. A relabel to medium would change the hash |
| `y3-026` | **Challenging, 6 marks** (as drafted) | Structural challenge (two relations on one unknown plus a transfer step); all five Year 3 tier-4 items are challenging | Weak to moderate. The advisory estimator said medium; the flag was never resolved | None to keep. You must explicitly resolve the flag |
| `y5-028` | **Challenging, 8 marks** (as drafted) | Level 5 factors, multiples and systematic listing; longest Year 5 stem (64 words); no peer clearly easier at this tier | Weak. Medium fits about as well; marks in this tier are positional and do not follow difficulty | None to keep |

---

## 3. The seven questions

### 3.1 `roadmap-amc-y3-005`: Year 3, tier 1: untouched

```
revision 1
sourceQuestionHash 5d896d25c226acd9ca4b1840f647be896f9d95a6eda1d6676cdc2f0a3dfc9e92
contentHash        6cbd0a115e0eec16a093f17ae92ebda6b06dcd1ae5531d46b4a8331ff1fcd96a
sourceManifestHash 88c02225f4ac7bda0697b38c64a23fd87ee33b05f1e572b6b2fff115c3ac1409
```
medium · 3 marks · 90 s · Number & Arithmetic · Divisibility and remainders

> Ravi has 31 beads. He makes bracelets using 6 beads each. What is the smallest number of extra beads he needs so that all his beads make complete bracelets?
>
> a) 5  b) 1  c) 4  d) 2  e) 6  **Key: a (5)**

Independent solution: 31 = 5 × 6 + 1, next multiple of 6 is 36, so 5. Only option a works (checked by brute force). "Smallest" removes the earlier ambiguity (11, 17, 23, 29 also complete bracelets). Distractors: 1 remainder slip, 4 miscounted 35, 2 a 33 slip, 6 a whole bracelet; all distinct. No earlier signature binds this revision, so approval is **new**.

**Full explanation:** The bead count leaves a remainder of one on division by six, so five more complete the last bracelet.
**Reviewer findings (AI, advisory):** no defect. "Smallest" is necessary and present. Advisory: it uses the ×6 facts (Level 4) and a remainder idea (Level 5), an extension element a capable Year 3 student can reach by skip-counting.
**Remaining reservations:** none beyond the extension note. **Recommendation:** present for approval.

**OWNER DECISION (blank):** [ ] APPROVE  [ ] REVISE  [ ] REPLACE   Notes: ____________  Date/initials: ________

### 3.2 `roadmap-amc-y3-014`: Year 3, tier 2: **revision proposed**

**Old (revision 1, an unapproved draft):**
> Four boxes have an average of 8 shells each. Three boxes contain 5, 7 and 10 shells. How many shells are in the fourth box?

**New (proposed revision):**
> Four boxes contain some shells. If all the shells were shared equally among the four boxes, each box would have 8 shells. Three boxes actually contain 5, 7 and 10 shells. How many shells are in the fourth box?
>
> a) 7  b) 11  c) 9  d) 10  e) 13  **Key: d (10)**

New explanation: If the shells are shared equally, each of the 4 boxes has 8, so there are 4 × 8 = 32 shells altogether. The three known boxes hold 5 + 7 + 10 = 22 shells. The fourth box holds 32 - 22 = 10 shells.

```
                   old                                                               new
sourceQuestionHash 50b95ed14969f9d89fb0ef8b1f6ba08efce1340e71c20e78cd0f78f39fa14bd8  ee5695a9361d8e1b0c61c355315bcb61103830b35a20ea312b1b1a43d123d7c0
contentHash        2e12b48b26d02f2e73b704fad1dbec56301aa52b183846b60f564c7a3250e123  c7aeef967cf07d5081d165880a821721fafb6468640b0183d7796794823c5b9b
sourceManifestHash 9cfbadcd4b13d9cb223cda6038aa68e76c4600deba07a2db3b7f8168699a3218  3e62c1793339612c19b9d34f66d986ede1c539998d02364bf7c0384493d25442
```
medium · 4 marks · 150 s · **Patterns & Algebra · Algebraic thinking and unknown values** (was Statistics & Chance · Averages and data summaries)

Preserved: ID, multiple choice, 4 marks, medium, 150 s, tier-2 placement, stem, all five options, key d, explanation. Changed since the first revision in this branch: **only the strand and skill label**, which alters the source, content and manifest hashes.

**Why the label changed.** The exam and results pages show the strand and skill to the child. The revised question no longer asks for an average: the stem dropped that word because the Victorian Curriculum does not introduce the mean until Level 7. Leaving "Averages and data summaries" on a sharing problem would tell a Year 3 child the question is about a topic they have not met, and would mislabel the skill for any later reporting. The problem is: use an equal-share total (4 × 8 = 32), take away the known amounts (5 + 7 + 10 = 22), and find the unknown amount. That is finding an unknown value in an additive situation. The closest registered AMC skill is **Algebraic thinking and unknown values**, which the published `y3-008` (an unknown given a total) already uses, and it sits in the Patterns & Algebra strand. The other candidate, "Working backwards and inverse operations", was rejected: the published items under it reverse a chain of operations, whereas this problem has no chain to undo. No skill was invented and the mathematics was not changed to fit a category. The link to Victorian Curriculum V2.0 Level 3 (finding unknown values; multiplication with related division) is the reviewer's reading, to be confirmed by a qualified human against the VCAA text.

- **Independent arithmetic check (hard-coded from the revision brief, not parsed from the wording):** 4 × 8 = 32; 5 + 7 + 10 = 22; 32 - 22 = 10. Of the five options only 10 satisfies it. The test also checks that the prompt contains the expected phrases (string presence). It does not show that a reader would derive these figures from the prose; that rests on human review.
- **Ambiguity:** none found. "Shared equally" fixes the total at 32 without a defined term. A reader could in principle ask whether shells move between boxes; the stem says the three boxes "actually contain" 5, 7 and 10, so the total is conserved.
- **Open item (not changed):** the distractors are unchanged. 7 was a "mean of the three" slip under the old wording and is now a weaker near-number; 9, 11 and 13 were already near-fillers. If you want diagnostic distractors, one candidate set is 22 (the three added), 8 (the shared amount), 32 (the total), 10 (key) and 12, but that is a further revision and would need its own review.
- **Approval:** **new**; the old signature position is "never signed". Any review of the superseded `ec632c61…` revision cannot be reused, because the content changed.

**Reviewer findings (AI, advisory, author-involved, not a qualified human):** no demonstrable wording or mathematical defect. Every step is Level 3 core; the only extension element is building the total from a hypothetical equal share. The likeliest misreading, answering 8, is not an option. The learner-visible label problem (P2) is fixed in this revision. Advisory: the stem is 39 words and the only conditional stem of 30 in Year 3; distractors 7 and 13 are weak.
**Remaining educational reservations:** whether an "if … would" stem suits Year 3 is a qualified teacher's judgement. The repository's own exclusion record still requires a **human age-fit review** before a new sheet, and an AI view does not satisfy it.
**Recommendation:** present for owner decision once a qualified human age-fit reviewer is named; do not approve on the AI review alone.

**OWNER DECISION (blank):** [ ] APPROVE revised  [ ] REVISE further  [ ] REPLACE   Notes: ____________  Date/initials: ________

### 3.3 `roadmap-amc-y3-016`: Year 3, tier 2: untouched

```
revision 1
sourceQuestionHash 23f16ef863aaa054068723213ec378c34a9b442296b151c67059dbec8746e2a0
contentHash        3e81ab90d3eddce680e2f1291e28fdb8da478ab570cffc7eb81fb2d33dce48f9
sourceManifestHash b784f46de8ede076f71d8be5b45042d955d258527cb0053f2811fde288533fca
```
**easy** (current) · 4 marks · 120 s · Number & Arithmetic · Apply equal groups in two steps

> Four plates each hold 6 apple pieces. Two more apple pieces are added to every plate. How many apple pieces are on the plates now?
>
> a) 30  b) 32  c) 24  d) 28  e) 26  **Key: b (32)**

Independent solution: 4 × (6 + 2) = 32. Traps 24 (ignores the addition) and 26 (adds 2 once). Marks are the positional tier, so the label does not move this item between tiers.

**Approval record:** an archived signature of 2026-10-17 03:53 binds exactly this revision and the repository's validator accepts it, but it predates all three independent reviews, so the position here is a **fresh owner approval**, not automatic reinstatement. Reverting to medium instead would need the draft, registry and attested hash changed together; that path was not tested.

**Full explanation:** At first there are 4 × 6 = 24 pieces. Adding 2 pieces to each of 4 plates adds 8 more. Altogether there are 24 + 8 = 32 pieces.
**Reviewer findings (AI, advisory):** no defect. Easy is better supported than medium by the curriculum level, but it is a label judgement without student data. The label is separate from the 4 marks, which are the tier position.
**Remaining reservations:** the label only. **Recommendation (proposed position):** easy, 4 marks.

**OWNER DECISION (blank):** [ ] APPROVE  [ ] REVISE  [ ] REPLACE   Label: [ ] easy  [ ] medium   Notes: ____________  Date/initials: ________

### 3.4 `roadmap-amc-y3-026`: Year 3, tier 4: untouched

```
revision 1
sourceQuestionHash 63d31b2069b22b9d5831f18c3130420ca8a2d399767b65f523039c6bf762ba84
contentHash        d478defef7e69c2fd02661241cb410ea80eea0f3a9aafa6b69f96530229c9b7b
sourceManifestHash 48c83393de789e6eee36e12b524373892604ceb26dc520aba2c8aeab90259471
```
challenging · 6 marks · 180 s · number entry, tolerance 0 · Patterns & Algebra

> Three baskets hold 41 apples altogether. The first basket has 5 more apples than the second basket. The third basket has twice as many apples as the second basket. Then 3 apples are moved from the first basket to the third basket. How many apples are now in the third basket?
>
> **Key: 21**

Independent solution: second = 9, first = 14, third = 18; after the move the third has 21. Unique. "Then" places the move after the relationships; a learner answering 18 has stopped one step early.

**Full explanation:** Remove the 5 extra apples from the total: 41 - 5 = 36. The second basket holds one equal share, the first one share plus 5, and the third two shares. Each share is 36 ÷ 4 = 9. The third basket starts with 18 apples and receives 3, giving 21.
**Reviewer findings (AI, advisory):** answer 21 confirmed and unique. Solvable without algebra by a bar model or by guess-and-check (second basket 8 gives 37, 9 gives 41). All operations are Level 3 core; the challenge is structural. Reasonable as a final-tier Year 3 item.
**Remaining reservations:** medium versus challenging is an owner decision, not a defect. **Recommendation (proposed position):** challenging, 6 marks, after you record the resolution.

**Unresolved difficulty flag:** the advisory estimator rated it medium against the challenging label (deviation 0.5, "retained pending mathematical difficulty review"). That review was never recorded. **Recommended position: approve only after you explicitly resolve this flag** (keep challenging, relabel, or ask for the review).

**OWNER DECISION (blank):** [ ] APPROVE  [ ] REVISE  [ ] REPLACE   Difficulty flag resolved as: ____________  Notes: ____________  Date/initials: ________

### 3.5 `roadmap-amc-y5-006`: Year 5, tier 1: untouched

```
revision 1
sourceQuestionHash 93b739d8908781b715ed3f7b884deff7c96a079309e2940bb51555bfecc357f0
contentHash        5e813e503db1533f1058b8f0db776fccc7979eba852dc167619acffe1238b02e
sourceManifestHash fca56d70fea3730fd4dfb72ed73de60faabeb99479ab90fd9dd02f2a8953709d
```
easy · 3 marks · 90 s · Measurement & Geometry · Use a simple scale

> On a map, 1 centimetre represents 5 kilometres. Two towns are 7 centimetres apart on the map. How far apart are they?
>
> a) 35  b) 40  c) 12  d) 45  e) 30  **Key: a (35)**

Independent solution: 7 × 5 = 35. 12 is the additive slip (7 + 5). **The recorded exclusion ("corrupted multiplication-symbol text") is stale:** the current file holds a valid `×` (U+00D7) and no U+FFFD, and the hash recorded when it was excluded equals today's. **Position: first approval of the current question.** The code exclusion needs a separate governed change before it can be recorded.

**Full explanation:** Each centimetre represents 5 kilometres, so 7 × 5 = 35 kilometres.
**Reviewer findings (AI, advisory):** no defect. The scale is given in the stem, so no prior knowledge is needed; the options carry no unit but only 35 fits. I did not find a Victorian Curriculum V2.0 map-scale descriptor (an unverified negative from a search), so the curriculum link is unconfirmed.
**Remaining reservations:** none of substance. **Recommendation:** present for approval; lifting the code exclusion is a separate governed change.

**OWNER DECISION (blank):** [ ] APPROVE  [ ] REVISE  [ ] REPLACE   Notes: ____________  Date/initials: ________

### 3.6 `roadmap-amc-y5-019`: Year 5, tier 2: **content unchanged**

```
revision 1
sourceQuestionHash 72b207b2bd180dd19cb0ce025417ce75c4867b3c51e9ab5f904df45b3a12c362
contentHash        05c7a7cb465286ec4684accb6c2b1427ada5e6ed6ac04be5488db189ef87f494
sourceManifestHash 3ca42122e1284c795b4c2b1b604dfd470e2e77e3be67738b0640e7d1474770b5
```
medium · 4 marks · 120 s · Logic & Problem-Solving

> Five friends—Asha, Ben, Chen, Dev and Ella—each choose a different fruit from: apple, banana, cherry, date and grape.
>
> • Asha chooses cherry.
> • Dev chooses date.
> • Ben does not choose banana or grape.
> • Chen does not choose grape.
>
> Which fruit does Chen choose?
>
> a) apple  b) banana  c) cherry  d) date  e) grape  **Key: b (banana)**

Independent solution: exactly one of the 120 assignments satisfies every clue (Asha cherry, Ben apple, Chen banana, Dev date, Ella grape), so the key is right.

**Browser finding (exam page; real AMC interface, desktop 1280 and mobile 390, observed in a throwaway environment outside the repo; the committed regression tests use synthetic text, not this question):** before the fix the clues collapsed into one run-on paragraph (`white-space: normal`). With the AMC-scoped renderer fix they display one clue per line (`pre-line`) with no horizontal overflow. **The question's identity and hash are unchanged.** This is the first independent review of this rewritten text; earlier signatures and reviews concern the old three-person puzzle.

**Full explanation:** Asha chooses cherry and Dev chooses date, leaving apple, banana and grape. Ben does not choose banana or grape, so Ben must choose apple. From the remaining fruits (banana and grape), Chen does not choose grape. Therefore, Chen chooses banana (and Ella chooses grape).
**Reviewer findings (AI, advisory):** no content defect. Exactly one of 120 assignments satisfies the clues. Advisory: the first two clues eliminate cherry and date, and easy versus medium is arguable.
**Remaining reservations:** the results-page line-break gap is fixed in this branch. **Recommendation:** present for approval.

**OWNER DECISION (blank):** [ ] APPROVE  [ ] REVISE  [ ] REPLACE   Notes: ____________  Date/initials: ________

### 3.7 `roadmap-amc-y5-028`: Year 5, tier 4: **revision proposed**

**Old (revision 1):**
> How many whole-number solutions are there to 3a + 5b = 30 when a and b may be zero?

**New (proposed revision):**
> Counters are sold in bags of 3 and in bags of 5. Mia buys some bags to get exactly 30 counters. She may buy any number of each size of bag, including none of one size. Bags of the same size are identical, and the order in which she buys the bags does not matter. How many different combinations of bags could she buy?
>
> **Key: 3** (number entry, tolerance 0)

New explanation: Try 0, 1, 2, 3, 4, 5 or 6 bags of 5. The counters left over must be made from bags of 3. With 0 bags of 5, she needs 10 bags of 3. With 3 bags of 5 (15 counters), she needs 5 bags of 3. With 6 bags of 5 (30 counters), she needs no bags of 3. With 1, 2, 4 or 5 bags of 5, the counters left over (25, 20, 10 or 5) cannot be made from bags of 3. So there are 3 combinations.

```
                   old                                                               new
sourceQuestionHash a2bd5e3e6f3ca2ff907ebbd1e1807981b4a4a0c53e0e6a65c1e2bb4cb41a76e3  5743cf39b78815a617fda04d161c6e38f5724ba490dcef28689faa4b3f1a298a
contentHash        2187d6acca5a265949bbd8be74ab68f0c70474f2d3f6996b1333f65a9c4dd5f8  28a4e4cc067cbfc7f47ede048c804ff6bf234906c64924e8f8b89604d99af3ab
sourceManifestHash 3dbf6ae2e561dacb09a1428c8f7265943aaff7b4950b8865a3b158a633e90990  1f5d27204b5909c21e4e39293bd8e805f8cc1f7e35c50f5c8dc24dfab5ed5ce2
```
Preserved: ID, number entry, key 3, tolerance 0, 8 marks, challenging, 180 s, strand, skill.

- **Independent arithmetic check (exhaustive enumeration of the hard-coded equation 3x + 5y = 30, not parsed from the wording):** the pairs are (0, 6), (5, 3), (10, 0): exactly 3. The test separately checks that the prompt contains the expected rule phrases (string presence). It does not prove the prose is unambiguous; that rests on human review.
- **Why the stem states each rule:** without "including none of one size" the answer would be 1; without "identical" and "order does not matter" a reader could count arrangements and get a much larger number. Each rule is stated and each excluded count is explained.
- **Open items:** the answer is still the small integer 3 with no tolerance, so a guess has a real chance. Also, the label "challenging" and 8 marks are unchanged although the context is easier to enter than the algebra was; whether that remains right is your call.
- **Approval:** **new.**

**Reviewer findings (AI, advisory, author-involved, not a qualified human):** accessible at Level 5 (factors, multiples, systematic listing). A student lists 0 to 6 bags of 5 and checks each leftover for divisibility by 3. Likely wrong answers are 1 (mixed combinations only), 7 or 11, or a large arrangement count, which the stem's rules address. Advisory: at 64 words it is the longest Year 5 stem, which raises difficulty for reading rather than mathematical reasons. The skill label "Enumerate whole-number solutions" is child-visible and reads slightly algebraic.
**Remaining educational reservations:** challenging versus medium is defensible either way. The repository's exclusion record still requires a **human age-fit review**, which an AI view does not satisfy.
**Recommendation:** present for owner decision once a qualified human age-fit reviewer is named. Proposed position: challenging, 8 marks.

**OWNER DECISION (blank):** [ ] APPROVE revised  [ ] REVISE further  [ ] REPLACE   Notes: ____________  Date/initials: ________

---

## 4. Decisions only you can make

1. The seven decisions above, and the `y3-016` label.
2. How `y3-026`'s difficulty flag is resolved.
3. Whether the renderer fix for `y5-019` (AMC-scoped; see the proposal) is accepted, or the stem is reflowed instead.
4. Who is the human reviewer of record for age-fit on the two revised questions.
5. The pacing decision (66.0 and 62.5 minutes of estimates against a 60-minute paper) and whether one fixed paper per year is acceptable at launch.
6. Authorising the governed code change that lifts the three code exclusions (`y3-014`, `y5-006`, `y5-028`), which is not part of this branch.
7. The launch wording for AMC (proposed copy is in the proposal).
