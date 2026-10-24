# AMC final seven: refreshed owner decision pack

**Baseline:** `origin/dev` `608e1fe4324408ccb4c78c2673f7a50069e2ad65`, plus the remediation in this branch.
**Status:** nothing here is approved, ingested, staged, published or deployed. **Every owner decision field is blank.** The positions below are recommendations only and are not owner approvals.

Evidence classes: **Verified** (run in this session with the repository's own code), **AI review** (Claude Sonnet 5.5, not a qualified human approval, and the same model family as the earlier Claude Opus 5.5 reviews), **Historical** (used only where its revision and hash binding were confirmed).

An approval binds `revision`, `contentHash` and `sourceManifestHash`. All seven are revision 1.

---

## 1. What changed since the previous pack

| Question | Change in this branch | Needs |
|---|---|---|
| `y3-014` | **New revision proposed** (equal-sharing wording) | Fresh independent review, then your decision |
| `y5-028` | **New revision proposed** (bags of counters) | Fresh independent review, then your decision |
| `y5-019` | **Content unchanged.** A renderer fix removes the presentation defect | Your decision on the unchanged content |
| `y3-005`, `y3-016`, `y3-026`, `y5-006` | Untouched | Your decision |

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
sourceQuestionHash 50b95ed14969f9d89fb0ef8b1f6ba08efce1340e71c20e78cd0f78f39fa14bd8  b7d9141ab2d511668bb33334dce987f9f253c360dba23f6334a0b59aac0684e7
contentHash        2e12b48b26d02f2e73b704fad1dbec56301aa52b183846b60f564c7a3250e123  ec632c610ea9d6bd07348cc7d9aa6da117b875d8efcfc1548bafd3636ac419cc
sourceManifestHash 9cfbadcd4b13d9cb223cda6038aa68e76c4600deba07a2db3b7f8168699a3218  853f53d3ffbb127d657dab5d0bf2f13298ed2483241f72af9090b678ee811540
```
Preserved: ID, multiple choice, 4 marks, medium, 150 s, strand, skill, all five options, key d. Only the stem and explanation changed.

- **Independent solution (separate code, bound to the numbers in the text):** 4 × 8 = 32; 5 + 7 + 10 = 22; 32 - 22 = 10. Of the five options only 10 satisfies it.
- **Ambiguity:** none found. "Shared equally" fixes the total at 32 without a defined term. A reader could in principle ask whether shells move between boxes; the stem says the three boxes "actually contain" 5, 7 and 10, so the total is conserved.
- **Open item (not changed):** the distractors are unchanged. 7 was a "mean of the three" slip under the old wording and is now a weaker near-number; 9, 11 and 13 were already near-fillers. If you want diagnostic distractors, one candidate set is 22 (the three added), 8 (the shared amount), 32 (the total), 10 (key) and 12, but that is a further revision and would need its own review.
- **Approval:** **new**; the old signature position is "never signed".

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

**Browser finding (real AMC interface, desktop 1280 and mobile 390):** before the fix the clues collapsed into one run-on paragraph (`white-space: normal`). With the AMC-scoped renderer fix they display one clue per line (`pre-line`) with no horizontal overflow. **The question's identity and hash are unchanged.** This is the first independent review of this rewritten text; earlier signatures and reviews concern the old three-person puzzle.

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

- **Independent solution (exhaustive, bound to the stated numbers):** all (threes, fives) with 3x + 5y = 30 are (0, 6), (5, 3), (10, 0): exactly 3.
- **Why the stem states each rule:** without "including none of one size" the answer would be 1; without "identical" and "order does not matter" a reader could count arrangements and get a much larger number. Each rule is stated and each excluded count is explained.
- **Open items:** the answer is still the small integer 3 with no tolerance, so a guess has a real chance. Also, the label "challenging" and 8 marks are unchanged although the context is easier to enter than the algebra was; whether that remains right is your call.
- **Approval:** **new.**

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
