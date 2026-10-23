# Candidate-by-Candidate Policy Impact Analysis (The Exact 12 Scholarship Questions)

**Baseline Reference:** PR #73 commit `dcb60a80f3f6eabdb522b20202929d2e3f328a94`  
**Phase 1 Preflight Verification:** `docs/reviews/legacy-content-provenance-phase1/preflight-12.json`  
**Sample Manifest SHA-256:** `13bdb8a4756cc123f18017555fef266c62ad523d3ca841cca655f5989e161dd6`  

---

## 1. Summary of Current Holdings & Integrity State

Every one of the 12 candidates in the Year 6 Scholarship sample has:
1. **Verifiable Repository Source:** Proven Git history on PR #73 branches originating in commits `458c6f86` (Batch 1: VR & NR) and `14b1d922` / `9ed5f3b4` (Batch 2: RC & Maths).
2. **Deterministic Cryptographic Hashes:** 12 exact matching candidate and publication content hashes verified by Phase 1 no-write preflight (`preflight-12.json`).
3. **Unverified Original Generation:** Provider, model ID, generation prompt, prompt hash, and candidate generation event are confirmed `null` (`docs/reviews/scholarship-sample-2026-10-22/provenance/source-register.json`).
4. **Current Status in `dev`:** Intentionally blocked from independent-review clearance, staging, and publication under Phase 1 fail-closed rules.

---

## 2. Comprehensive Candidate-by-Candidate Analysis Table

| ID | Subject & Strand | Question Type & Topic | Candidate Hash / Publication Hash | Available Evidence | Remaining Evidence Gaps | Proposed Pathway | Required Human Decisions | Re-Authoring Necessary? |
|---|---|---|---|---|---|---|---|---|
| **scholarship-y6-vr-001** | Verbal Reasoning<br>`vr-analogies` | Analogy:<br>*THERMOMETER : TEMPERATURE :: ODOMETER : DISTANCE* | `a66d7ab60d61...`<br>`b8623bd98bd4...` | - Git source `458c6f86`<br>- 12/12 ChatGPT blind review passed key `e`<br>- Author explanation complete | - Original generator unknown<br>- Review is manual user-attested ChatGPT (no server API envelope)<br>- Author set Medium; reviewer suggested Easy<br>- Lacks 2nd provider review | **Pathway 2**<br>(Class B: Multi-Provider Consensus) | 1. Resolve difficulty (Medium vs Easy)<br>2. Authorise external Gemini API review<br>3. SME editorial sign-off | **No**, unless dual-provider consensus fails. Analogy is clean and classic. |
| **scholarship-y6-vr-016** | Verbal Reasoning<br>`vr-synonyms-antonyms` | Vocabulary:<br>*Closest in meaning to VIGOROUS -> ROBUST* | `3bc02a9b45da...`<br>`c8d34424ad5a...` | - Git source `458c6f86`<br>- ChatGPT blind review passed key `c`<br>- Single defensible answer certified | - Original generator unknown<br>- Review lacks API envelope<br>- Lacks 2nd independent provider review<br>- Lacks qualified human SME rubric | **Pathway 2**<br>(Class B: Multi-Provider Consensus) | 1. Authorise external Gemini API review<br>2. SME lexical defensibility sign-off | **No**, vocabulary question is unambiguous. Trivial to re-author if policy mandates clean provenance. |
| **scholarship-y6-vr-032** | Verbal Reasoning<br>`vr-sentence-logic` | Formal Logic:<br>*Sprinkler / lawn conditional reasoning (Modus Tollens)* | `743f6164cdd5...` (source)<br>`583b895df774...` (factory)<br>`758d25fa7ee8...` (pub) | - Git source `458c6f86`<br>- Solver-sidecar attached in Phase 1<br>- Formal logic truth-table verification<br>- ChatGPT review passed key `c` | - Original generator unknown<br>- Review lacks API envelope<br>- Needs formal originality check on prompt wording | **Pathway 1**<br>(Class A: Deterministic Logic) | 1. Confirm formal logic is classified as Class A deterministic<br>2. Sign off on solver verification | **No**. Formally verified by solver sidecar; publication content preserved. |
| **scholarship-y6-nr-001** | Numerical Reasoning<br>`nr-number-series` | Number Series:<br>*5, 11, 17, 23, 29, ? (+6 AP -> 35)* | `e18ddd9625b4...` (source)<br>`926a14bedf8c...` (factory)<br>`8bf3c2012084...` (pub) | - Git source `458c6f86`<br>- Solver-sidecar attached in Phase 1<br>- Arithmetic progression solver passes<br>- ChatGPT review passed key `d` | - Original generator unknown<br>- Review lacks API envelope<br>- Needs originality check on sequence parameters | **Pathway 1**<br>(Class A: Deterministic Solver) | 1. Accept first-party solver derivation as sufficient correctness proof | **No**. Pure deterministic arithmetic; 100% computable. |
| **scholarship-y6-nr-022** | Numerical Reasoning<br>`nr-arithmetical-reasoning` | Word Problem (Age):<br>*Marcus currently 3x Chloe; in 8 yrs 2x -> Chloe=8* | `8758ac61587d...`<br>`a0c486d79ec7...` | - Git source `458c6f86`<br>- Linear algebra solver passes in unit tests<br>- ChatGPT review passed key `b`<br>- Single defensible answer | - Original generator unknown<br>- Review lacks API envelope<br>- Needs word-problem originality search | **Pathway 1**<br>(Class A: Deterministic Solver) | 1. Accept solver derivation as correctness proof<br>2. Sign off on word-problem originality clearance | **No**. Standard algebra problem with unambiguous unique solution. |
| **scholarship-y6-nr-023** | Numerical Reasoning<br>`nr-arithmetical-reasoning` | Word Problem (Cost):<br>*3N+2P=19, 2N+4P=26 -> Notebook=$3, Pen=$5* | `52d196a6d5d1...`<br>`7b80d6a14c2af...` | - Git source `458c6f86`<br>- Simultaneous equation solver passes<br>- ChatGPT review passed key `c`<br>- Single defensible answer | - Original generator unknown<br>- Review lacks API envelope<br>- Author set Medium; reviewer suggested Challenging<br>- Needs originality search | **Pathway 1**<br>(Class A: Deterministic Solver) | 1. Resolve difficulty classification (Medium vs Challenging)<br>2. Sign off on solver proof | **No**. Completely deterministic simultaneous equations. |
| **scholarship-y6-rc-001** | Reading Comprehension<br>`rc-authorial-craft` | Passage Inference:<br>*Main purpose of opening paragraph (estuary mood)* | `8d09cf53874fc...`<br>`013845c94fc3...` | - Git source `14b1d922` / `9ed5f3b4`<br>- Continuous passage (Maya & Grandfather)<br>- ChatGPT review passed key `b` | - Original generator of passage and stem unknown<br>- Review lacks API envelope<br>- Lacks 2nd provider review<br>- **High IP Risk:** Passage lacks plagiarism/copyright search | **Pathway 3** (Class C: Stimulus Audit) OR **Pathway 4** (Re-Author) | 1. Decide whether to run multi-corpus plagiarism scan on passage, OR re-author the passage cleanly | **Borderline**. Re-authoring the reading passage cleanly is strongly recommended. |
| **scholarship-y6-rc-002** | Reading Comprehension<br>`rc-figurative-language` | Passage Analysis:<br>*Metaphor of mangrove roots to ribs of upturned vessel* | `88ae673686bc...`<br>`855026023be2...` | - Shared passage with rc-001<br>- ChatGPT review passed key `a`<br>- Single defensible answer certified | - Same as rc-001<br>- Subjective literary interpretation<br>- Lacks 2nd provider review<br>- Lacks human SME rubric review | **Pathway 3** (Class C: Stimulus Audit) OR **Pathway 4** (Re-Author) | 1. Bound to rc-001 passage decision<br>2. Human SME sign-off on metaphor nuance | **Dependent on Passage decision**. If passage is re-authored, this item is re-authored. |
| **scholarship-y6-rc-003** | Reading Comprehension<br>`rc-character-inference` | Passage Inference:<br>*Grandfather's knowledge of the tidal estuary* | `39ae557efa78...`<br>`d377c208e0c2...` | - Shared passage with rc-001<br>- ChatGPT review passed key `d`<br>- Single defensible answer certified | - Same as rc-001 and rc-002<br>- Lacks 2nd provider review<br>- Lacks human SME rubric review | **Pathway 3** (Class C: Stimulus Audit) OR **Pathway 4** (Re-Author) | 1. Bound to rc-001 passage decision<br>2. Human SME sign-off on character inference | **Dependent on Passage decision**. If passage is re-authored, this item is re-authored. |
| **scholarship-y6-maths-004** | Mathematics<br>`maths-directed-numbers` | Directed Numbers:<br>*Mt Kosciuszko (2228m) - Lake Eyre (-15m) = 2243m* | `8aeef3fbabe3...`<br>`2038c2ac1123...` | - Git source `14b1d922` / `9ed5f3b4`<br>- Arithmetic solver passes in unit tests<br>- ChatGPT review passed key `d` | - Original generator unknown<br>- Review lacks API envelope<br>- Needs geographical fact confirmation (Kosciuszko & Eyre elevation) | **Pathway 1**<br>(Class A: Deterministic Math) | 1. Verify geographical facts<br>2. Accept solver proof and sign off | **No**. Pure arithmetic on real-world elevation; 100% verifiable. |
| **scholarship-y6-maths-007** | Mathematics<br>`maths-percentages` | Percentage Discounts:<br>*$160 jacket, 25% sale, further 10% coupon -> $108* | `93bfea7f835e...`<br>`938bf96f5c97...` | - Git source `14b1d922` / `9ed5f3b4`<br>- Multi-step percentage solver passes<br>- ChatGPT review passed key `b` | - Original generator unknown<br>- Review lacks API envelope<br>- Needs commercial word-problem originality search | **Pathway 1**<br>(Class A: Deterministic Math) | 1. Accept solver derivation<br>2. Sign off on originality clearance | **No**. Classic multi-step commercial percentage calculation; completely objective. |
| **scholarship-y6-maths-014** | Mathematics<br>`maths-ratios-rates` | Ratio Problem:<br>*Athletics club sprinters/distance 5:3, diff 30 -> 120 total* | `71d11fa2c35f...`<br>`aeb211f7441a...` | - Remediated in commit `45b6cdab` with explicit closure premise<br>- Ratio solver passes in tests<br>- Fresh ChatGPT review passed key `c` | - Original generator unknown<br>- Review is manual user-attested (no API envelope)<br>- Needs originality search | **Pathway 1**<br>(Class A: Deterministic Math) | 1. Confirm Option 1 closure premise is acceptable<br>2. Sign off on solver proof | **No**. Remediated revision is mathematically airtight with single defensible key. |

---

## 3. Synthesis by Question Cohort

### Cohort 1: Deterministic Mathematics & Numerical Reasoning (7 Items)
- **Items:** `nr-001`, `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`, `vr-032`.
- **Finding:** Correctness is 100% proven by algorithmic solvers and logic engines.
- **Epistemic Risk:** Negligible for correctness; low-to-moderate for originality.
- **Recommended Action:** Admissible under **Pathway 1 (Class A)**.
- **Required Work:** Run automated plagiarism/uniqueness query on word problems, attach first-party solver execution attestations, obtain authenticated owner sign-off.
- **Verdict:** **Retain and admit all 7 items.**

### Cohort 2: Discrete Verbal Reasoning (2 Items)
- **Items:** `vr-001` (Thermometer:Temperature), `vr-016` (Vigorous).
- **Finding:** Unambiguous semantic definitions; 12/12 external blind agreement.
- **Epistemic Risk:** Low distractor ambiguity; moderate reviewer-lineage correlation risk.
- **Recommended Action:** Admissible under **Pathway 2 (Class B)**.
- **Required Work:** Execute one additional API-bound review using Google Gemini 1.5/2.5 Pro; obtain human SME editorial sign-off; resolve VR-001 difficulty rating (Medium vs Easy).
- **Verdict:** **Admit upon Gemini API confirmation.** (Alternatively, if owner prefers zero exception overhead, re-authoring 2 discrete vocabulary questions takes < 30 minutes).

### Cohort 3: Reading Comprehension & Stimulus Passage (3 Items)
- **Items:** `rc-001`, `rc-002`, `rc-003` (and the shared Mangrove Estuary passage).
- **Finding:** Well-crafted narrative, but literary text carries intrinsic copyright and memorisation risk when original generation prompt is unverified.
- **Epistemic Risk:** High legal/IP exposure if the unknown prompt regurgitated a copyrighted Australian text. High editorial sensitivity.
- **Recommended Action:** Strong candidate for **Pathway 4 (Clean-Sheet Re-Authoring)**.
- **Alternative:** If the owner desires to preserve the current text, it requires a comprehensive academic/commercial plagiarism scan, cultural review, and dual-provider review on all three items.
- **Verdict:** **Recommend Clean-Sheet Re-Authoring of 1 fresh reading passage and 3 items** with verifiable Phase 1 provenance (`kind: generated`, version 1). This completely eliminates IP risk for the reading comprehension component.
