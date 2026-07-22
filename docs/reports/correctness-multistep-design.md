# Multi-Step Correctness Verification — Design (Not Implemented)

Status: **design only**. No production code or gate behaviour changes in this branch. This document proposes work for a future mission; it is not itself that mission.

## 1. Problem statement and invariant

The correctness-verification gate (`src/features/question-factory/correctness/`) exists to *independently prove* a candidate question's declared answer is right before it can reach a learner — never to trust the declared answer key, and never to trust the AI-authored explanation as a source of truth (`explanation-consistency.ts` only checks the explanation *against* an already-independently-derived answer). Its single load-bearing invariant, stated in `derive-answer.ts`'s file doc and enforced throughout `deriveIndependentAnswer`:

> **Never guess.** A method that recognises a question's shape but cannot safely resolve it returns a terminal `cannot_derive`/`ambiguous` outcome rather than falling through to a guess. The first method that *recognises* the shape wins; recognising the shape and then failing is final for that candidate — it does not fall through to a "close enough" answer.

The consequence carried through `verify-candidate-correctness.ts` and `orchestrate-correctness-verification.ts` is asymmetric-cost:

- A **false `passed`** — the gate claiming machine-proof of correctness when the declared answer is actually wrong — is catastrophic. It ships a wrong answer to a student with the gate's full authority behind it.
- A **`review_required`/quarantine** — the gate declining to decide — is merely inefficient. It costs a human reviewer's time (`decideTransitionTarget` in `orchestrate-correctness-verification.ts` routes exactly this case to lifecycle state `quarantined` via `decideGateFailureOutcome({ severity: "uncertain" })`).

**Every proposal in this document must preserve this invariant.** Concretely, for multi-step verification specifically:

- A multi-step candidate whose steps cannot be re-executed with full confidence (missing grounding, an operand that doesn't trace to stated data, a step whose operation is ambiguous, a schema the verifier doesn't recognise) **must** fail closed to today's existing `unable_to_derive_answer` → `structurally_scoreable_only` → `review_required` path. It must never fall through to a partial-credit guess, a "looks about right" heuristic, or float-based approximation standing in for a proof.
- A verified multi-step candidate only reaches `passed` when *every* step has been mechanically re-executed and the final step's result exactly equals (or is within the declared numeric `tolerance`, for `number`-kind keys — see `compareDerivedToDeclared` in `verify-candidate-correctness.ts`) the declared answer, using the exact same `Fraction`/cents arithmetic surface (`numeric.ts`) the rest of the gate already commits to — never `toFixed()`, never a JS float comparison.

## 2. Current state (grounded in the live gate)

### 2.1 The dispatcher

`derive-answer.ts` exports `deriveIndependentAnswer(question)`, which tries a fixed, ordered array `DERIVATION_METHODS` (lines 860–872) — each method returns `not_applicable` (shape not recognised, try the next method), a terminal `cannot_derive`/`ambiguous` failure, or a `DerivationSuccess`. If every method returns `not_applicable`, the dispatcher itself returns a terminal `cannotDerive("unable_to_derive_answer", ...)` (lines 885–888). There is no combination of methods, no chaining, no multi-pass retry — each method sees the raw `Question` once and either resolves it whole or does not.

The eleven registered methods, in dispatch order:

1. `attemptArithmetic` — extracts *one* machine-parseable expression from the prompt via `extractArithmeticExpression` (`arithmetic-expression.ts`) and evaluates it with the hand-rolled recursive-descent `Parser` (`+ - * / ()`, one flat expression, no intermediate named quantities).
2. `attemptMoney` — one table visual read as an (item, unit-price) list (`extractPriceList`, `money.ts`) combined with quantities parsed from the prompt via `QUANTITY_ITEM_PATTERN`, summed via `totalCents`. This is the closest existing method to "multi-step" (parse-quantities → look-up-prices → sum), but it is a single fixed pipeline, not a general step sequence, and it only ever produces one total.
3. `attemptPerimeterArea` — one rectangle/square `geometry_shape` visual, one of perimeter *or* area, via `deriveRectangleMeasures` (`measurement.ts`).
4. `attemptChartExtreme` / `attemptChartExactLookup` — single lookups into one bar/line/pie chart visual.
5. `attemptTableLookup` — single-cell lookup, or (its only two-operand case) an absolute difference between exactly two referenced rows in one table.
6. `attemptNumberLine` — linear extrapolation from evenly spaced highlighted values.
7. `attemptFractionOrdering` / `attemptFractionMatching` — sorting/pairing over an `ordering`/`matching` interaction's own items, no external quantities.
8. `attemptFractionModelSingleValue` — reads one field off a single `fraction_model` visual (numerator/denominator/unshaded count).
9. `attemptNumericPredicateOverOptions` — a closed predicate (`multiples of N`, `even`, `odd`, `less than X`, `greater than X`) applied to each option's own literal text.

Every method is single-shape and (with the partial exception of money) single-operation: it recognises one prompt/visual pattern and computes one thing from it. None chains an intermediate result from one operation into a second operation — there is no notion of "step 1's output becomes step 2's input" anywhere in this dispatcher.

### 2.2 The verifier and its result taxonomy

`verify-candidate-correctness.ts`'s `verifyCandidateCorrectness` classifies every candidate into a `CorrectnessCapability` (`types.ts` lines 7–13): `deterministically_verifiable`, `structurally_scoreable_only`, `requires_independent_semantic_review`, or `unsupported`. For non-semantic, non-manual questions it calls `deriveIndependentAnswer` once (line 423); on success it becomes `deterministically_verifiable` and proceeds to `compareDerivedToDeclared` plus a real re-score of the derived response through `scoreQuestion` (the actual exam scoring engine, never a second scoring implementation — line 526). On failure it becomes `structurally_scoreable_only`, carries the derivation's `issueCode`/`message` as a single `review_required`-severity issue, and — critically — **never** attempts a partial or approximate proof.

The three-way result shape in `types.ts` (lines 175–192) is exhaustive: `passed` (only ever `capability: "deterministically_verifiable"`), `failed`, or `review_required` (only ever `structurally_scoreable_only` or `requires_independent_semantic_review`). There is no fourth "partially verified" status — this is the type-level enforcement of the never-guess invariant, and any multi-step design must fit inside this same three-way shape rather than adding a new lifecycle status.

### 2.3 Orchestration and lifecycle mapping

`orchestrate-correctness-verification.ts`'s `decideTransitionTarget` (lines 369–382) maps `review_required`/`structurally_scoreable_only` and `failed`/`unsupported` to `severity: "uncertain"` → always `quarantined` (never silently passed, never hard-rejected as though disproven). A `failed` result for any other capability is `severity: "hard_fail"` → `rejected`. Any multi-step proposal that changes what reaches `deterministically_verifiable`/`passed` does not need to touch this file's routing logic at all — it only needs to produce a correctly-shaped `DerivationOutcome` for `deriveIndependentAnswer` (or its equivalent) to consume, and the existing severity mapping does the right thing automatically.

### 2.4 The numeric surface

`numeric.ts`'s `Fraction` (bigint-backed, always reduced, always positive denominator) is the *sole* arithmetic surface for exact comparison: `addFractions`/`subtractFractions`/`multiplyFractions`/`divideFractions`, `compareFractions`/`fractionsEqual`/`fractionWithinTolerance`. `fractionFromDecimalString` bounds digit length (`CORRECTNESS_LIMITS.FRACTION_MAX_DIGIT_LENGTH`, 15) *before* any `BigInt(...)` construction, and every fraction is bounded to `MAX_MAGNITUDE` (10^15) after construction. Money has its own parallel exact surface in cents (`money.ts`'s `totalCents`, `numeric.ts`'s `fractionFromCents`/`centsToDisplayString`) — never a float dollar multiplication, never `toFixed()`. Any multi-step re-execution must be built exclusively on these two primitives (`Fraction` for general quantities, integer cents for money) — introducing a third numeric representation, or touching `number`/float arithmetic anywhere a correctness decision is made, would be a regression against the whole gate's design contract.

### 2.5 Config

`config/correctness-limits.ts`'s `CORRECTNESS_LIMITS` centralises every bounded size the gate enforces (arithmetic expression length/token/paren-depth/operator-count, fraction digit length, ordering/matching item count, money line-item/quantity/total bounds, issue-message length). A multi-step feature needs its own analogous bounds here (§4).

### 2.6 What currently falls through to `unable_to_derive_answer`

Any prompt that requires composing more than one operation over quantities that are *not* all present as literal tokens in a single flat arithmetic expression falls through every method in §2.1 and returns the dispatcher's terminal `unable_to_derive_answer`. Four realistic examples:

1. **Grade 3, money, two-step (buy + change):** *"Apples cost $2 each. Mia buys 3 apples and pays with a $10 note. How much change does she get?"* — `attemptMoney` can derive the $6 subtotal from a price-list table if one exists, but has no notion of a second step ("subtract from the amount tendered"); without a table visual it does not even reach that far. `attemptArithmetic` finds no single flat expression in the prose. → `unable_to_derive_answer`.
2. **Grade 3, multi-step word problem (no visual at all):** *"Liam has 15 marbles. He gives 4 to his sister and then buys 6 more. How many marbles does he have now?"* — no table, no chart, no single parenthesised expression written out; the two operations (`15 - 4`, then `+ 6`) exist only as prose. → `unable_to_derive_answer`.
3. **Grade 5, area then comparison:** *"A rectangular garden is 8 m by 5 m. A square garden has side length 6 m. Which garden has the greater area, and by how many square metres?"* — `attemptPerimeterArea` only ever measures a single shape once (perimeter *or* area) and answers a single numeric/boolean query; it has no step for computing two areas from two separate shapes and then subtracting. → `unable_to_derive_answer`.
4. **Grade 5, unit conversion then arithmetic:** *"A recipe needs 750 g of flour. Priya has 1.2 kg. After baking, how many grams of flour does she have left?"* — this needs a unit-conversion step (1.2 kg → 1200 g) before a subtraction; there is no conversion primitive anywhere in `derive-answer.ts`, and the two quantities never appear in compatible units in one flat expression. → `unable_to_derive_answer`.

In all four cases the gate today behaves exactly as designed: it fails closed to `structurally_scoreable_only` → `review_required` → `quarantined`. That is correct, safe behaviour — just inefficient at scale, which is the problem this design addresses.

## 3. Approach A — verify a declared structured solution

The generator declares its own step-by-step working as structured data (not prose), and the verification gate mechanically re-executes it and checks the final step against the declared answer. This makes multi-step verification an extension of the exact-arithmetic re-execution the gate already does for one-step arithmetic (`attemptArithmetic`) — it never asks the verifier to *understand* a word problem; it asks the *generator* to expose the arithmetic it already had to do to write a correct question in the first place, and asks the verifier to check that structured claim mechanically.

### 3.1 New schema field: `workingSteps`

Add an optional field to the candidate schema (never to the production `question.schema.ts` — this is generation/verification metadata, not something ever shown to or scored against the learner, mirroring how `explanation` is present but not itself scored):

```ts
type OperandRef =
  | { readonly source: "literal"; readonly value: string }           // must itself grounding-check (§3.3)
  | { readonly source: "prompt_quantity"; readonly quantityId: string } // indexes into a declared prompt-quantity table (§3.3)
  | { readonly source: "visual"; readonly visualId: string; readonly field: string } // e.g. a table cell, a shape measure
  | { readonly source: "step_output"; readonly stepIndex: number };   // must be < the current step's index

interface WorkingStep {
  readonly index: number;               // 0-based, strictly sequential, no gaps
  readonly operation: "add" | "subtract" | "multiply" | "divide" | "convert_unit";
  readonly operands: readonly OperandRef[]; // exactly 2 for add/subtract/multiply/divide; exactly 1 + a target unit for convert_unit
  readonly targetUnit?: string;         // convert_unit only
}

interface DeclaredWorkingSolution {
  readonly promptQuantities: readonly { readonly id: string; readonly value: string; readonly unit?: string }[];
  readonly steps: readonly WorkingStep[]; // ordered; step N may reference step_output for any M < N
}
```

`promptQuantities` is the grounding table: every literal number the generator claims appears in the prompt/visual, declared once with a stable id, so step operands can reference "the $2 apple price" rather than repeating raw literals with no traceable origin. This directly enables the grounding check in §3.3.

### 3.2 Re-executing each step

A new module, `correctness/derive-multistep-answer.ts` (paralleling `derive-answer.ts`'s single-method style), would:

1. Resolve every `promptQuantities` entry through `fractionFromDecimalString` (general quantities) or `dollarsToCents`/`numberToCents` (money-typed quantities, mirroring `money.ts`) — never a fresh parser.
2. Walk `steps` in order, resolving each `OperandRef`:
   - `literal` → parsed the same way, then grounding-checked (§3.3).
   - `prompt_quantity` → looked up by id in the resolved `promptQuantities` map; unresolved id is a terminal failure, never a fallback guess.
   - `visual` → dispatched to the *existing* per-visual-type readers already in `visual-lookup.ts`/`measurement.ts`/`money.ts` (e.g. `tableCellByRowLabel`, `deriveRectangleMeasures`) — reused, not reimplemented, so a multi-step table lookup has exactly the same ambiguity/duplicate-header handling as `attemptTableLookup` already does.
   - `step_output` → the already-computed `Fraction` (or cents value) of an earlier step; a forward or self reference (`stepIndex >= index`) is a terminal schema-shape failure.
3. Executes the step's `operation` via the *existing* `numeric.ts` primitives (`addFractions`, `subtractFractions`, `multiplyFractions`, `divideFractions`) for general quantities, or the money-cents equivalents when the step is flagged money-typed. `convert_unit` is new arithmetic (§3.4) but still produces an exact `Fraction`, never a float.
4. The final step's result is the multi-step method's `DerivedValue`, fed into the *same* `compareDerivedToDeclared`/`scoreQuestion` re-scoring path every other method already uses in `verify-candidate-correctness.ts` — no new comparison logic needed there.

Every step re-executes on the same `Fraction`/cents surface described in §2.4: no floats, no `toFixed()`, at any point.

### 3.3 The grounding check

This is the check that keeps the never-guess invariant intact for a *declared* solution: a generator could otherwise "prove" any answer by declaring a fabricated working that isn't actually grounded in the question. Before any step executes:

- Every `literal` operand must exactly equal (as a parsed `Fraction`/cents value) some value that also appears in `promptQuantities`, OR the generator must not be allowed to declare bare `literal` operands at all for anything except small closed constants used only by `convert_unit` (e.g. `1000` for kg→g) — **the safer default is to disallow bare `literal` operands entirely** and require every non-step-output operand to route through `prompt_quantity` or `visual`, so grounding is structural rather than a post-hoc numeric coincidence check. (A prompt could legitimately contain the literal "10" twice with different meanings — e.g. "$10 note" vs. "10 apples" — so numeric-value matching alone is not sound provenance; recommend the disallow-bare-literal rule.)
- Every `prompt_quantity` must itself be grounding-checked against the actual prompt text / visual data the same way today's methods already do it: reusing `promptTokens`/whole-word matching (`derive-answer.ts` lines 110–112, 272–282) for prose-declared quantities, and the existing per-visual-type readers for visual-declared quantities. A `promptQuantities` entry whose declared value cannot be independently located in the prompt/visual is a terminal grounding failure — not a warning, not a soft signal.
- `step_output` references are grounded by construction (they are the verifier's own prior computation), so no additional check is needed there beyond the index-ordering check in §3.2.

This check is what makes Approach A a *verification* of the generator's claim rather than a re-statement of it: the generator's `steps` are trusted only as a *proposed* execution order over quantities the verifier has independently confirmed are real, and the arithmetic itself is independently re-run — the generator's own claimed per-step *results* are never trusted, only its claimed *quantities and operation sequence*.

### 3.4 New primitives needed

- `convert_unit` requires a small, closed unit-conversion table (length: mm/cm/m/km; mass: g/kg; volume: mL/L; time: s/min/h — the Grade 3/5 numeracy curriculum's own unit set, not a general units library) living in `numeric.ts` or a new `unit-conversion.ts`, expressed as exact `Fraction` multipliers (e.g. kg→g is `×1000`, an exact integer multiplier, never a floating conversion factor). An unrecognised unit pair is a terminal `cannot_derive`, never an approximate guess.

### 3.5 New issue codes

Add to `CORRECTNESS_VERIFICATION_ISSUE_CODES` (`types.ts`) and `DerivationIssueCode` (`derive-answer.ts`):

- `multistep_operand_ungrounded` — a `literal`/`prompt_quantity` operand does not trace to a confirmed prompt/visual quantity (error-equivalent for this method; always fails closed, never partial credit).
- `multistep_step_reference_invalid` — a `step_output` reference is forward/self/out-of-range, or the declared `steps` array has a gap/duplicate index.
- `multistep_unit_conversion_unsupported` — `convert_unit` requested a unit pair outside the closed conversion table.
- `multistep_final_step_mismatch` — the final step's re-executed value disagrees with the declared answer (this is really just `declared_answer_mismatch` reused via the existing `compareDerivedToDeclared` path, so it may not need a distinct code — call this out explicitly as an open question for implementation, not a decision this design makes).
- `multistep_resource_limit_exceeded` — step count or promptQuantities count exceeds a new `CORRECTNESS_LIMITS` bound (§3.6).

### 3.6 New `CORRECTNESS_LIMITS` entries

```ts
MULTISTEP_MAX_STEPS: 8,              // generous for Grade 3/5, far below anything pathological
MULTISTEP_MAX_PROMPT_QUANTITIES: 16,
```
(Mirrors the existing "generous for any real prompt, far below exhaustion" rationale already documented for `ARITHMETIC_MAX_*`.)

### 3.7 Mapping to `passed` vs. `review_required`

- All steps resolve, all operands ground, all operations execute, final step matches declared answer (within tolerance for `number` keys) → `deterministically_verifiable` / eligible for `passed`, through the *existing* `verify-candidate-correctness.ts` flow unchanged (it already re-scores the derived response and checks explanation consistency — nothing about that downstream flow needs to know a multi-step method produced the `DerivedValue`).
- Any grounding failure, invalid step reference, unsupported unit conversion, or resource-limit breach → terminal `cannot_derive`/`ambiguous`-shaped `DerivationFailure`, which `verify-candidate-correctness.ts` already turns into `structurally_scoreable_only` → `review_required` → `quarantined`, with **zero changes needed to that file**.
- A candidate with no `workingSteps` declared at all is simply `not_applicable` for this method (falls through to whatever the next method in the dispatch order decides, exactly like every other method today).
- Final-step value computed but disagreeing with the declared answer → this is not a derivation failure at all; it flows into the *existing* `compareDerivedToDeclared` → `declared_answer_mismatch` → `failed` → `rejected` path, exactly like a one-step arithmetic mismatch does today. This is the one case where multi-step verification actively *rejects* a candidate (correctly) rather than merely failing to bless it.

### 3.8 Generator-prompt changes and files touched

- `src/features/question-factory/generation/prompt-builder.ts` — extend `RESPONSE_SCHEMA_DESCRIPTION` to document the new optional `workingSteps` field, extend `RESPONSE_EXAMPLE` with one illustrative multi-step example (a two-step money example mirroring the existing single-step arithmetic example), and add an `INSTRUCTIONS` line requiring `workingSteps` to be supplied for any prompt whose answer isn't derivable from a single flat expression, with an explicit "every operand must be one of the declared prompt quantities or visual fields — never an unexplained literal" rule stated as a governing instruction (mirroring `INSTRUCTIONS[0]`'s precedence-statement pattern already used for the blueprint-injection boundary).
- `src/features/question-factory/ingestion/candidate-question.ts` — extend `candidateQuestionSchema` with the optional `workingSteps`/`DeclaredWorkingSolution` shape (candidate-only; never added to `src/schemas/question.schema.ts`, the production schema — a learner never sees this field).
- `src/features/question-factory/correctness/derive-multistep-answer.ts` — new module (§3.2).
- `src/features/question-factory/correctness/numeric.ts` or a new `unit-conversion.ts` — the closed unit-conversion table (§3.4).
- `src/features/question-factory/correctness/derive-answer.ts` — register the new method in `DERIVATION_METHODS`; placement in the dispatch order matters only for which `not_applicable` fallthrough happens first, since a `workingSteps`-bearing candidate should be essentially disjoint from the shapes the other ten methods recognise (recommend appending it last, after `attemptNumericPredicateOverOptions`, so a candidate that happens to *also* match a simpler single-shape method is resolved by the cheaper, already-proven method first).
- `src/features/question-factory/correctness/types.ts` — new issue codes (§3.5).
- `src/features/question-factory/config/correctness-limits.ts` — new limits (§3.6).
- `src/tests/unit/question-factory/correctness-derive-answer.test.ts` (or a new sibling `correctness-derive-multistep-answer.test.ts`) — unit fixtures (§6).
- `docs/reports/mission2-production/03-correctness-verification.md` — the living gate-architecture report would need a new section describing the multi-step method, mirroring how every other method is already documented there.

This is the larger-surface-area option: one new schema field (candidate-only, not production-facing), one new derivation module, one new small arithmetic primitive (unit conversion), and generator-prompt changes to actually get the field populated.

## 4. Approach B — bounded multi-step shapes (no schema change)

Instead of a generic declared-solution schema, hard-code a small, closed set of *specific* two/three-step prompt templates directly as new `attempt*` methods in `derive-answer.ts`, exactly like today's methods each recognise one shape. No new candidate schema field, no generator-prompt change requesting structured working — the verifier still works purely from the existing `prompt`/`visuals`/`answerKey`, just with a richer (but still closed and pattern-matched) recognition grammar per method.

### 4.1 Starting template set (Grade 3/5-appropriate, mirrors §2.6's examples)

1. **Two-step money: buy-then-change.** Recognise a table-priced item + a stated quantity + a stated tendered amount + "change"/"left over" language; compute `tendered − (unitPrice × quantity)`. A direct two-step extension of the existing `attemptMoney`, reusing `extractPriceList`/`totalCents`/`fractionFromCents` verbatim, adding one subtraction step and a new regex for the tendered-amount clause.
2. **Two-step prose arithmetic with an explicit start quantity and two named deltas.** Recognise a fixed prose template shape: `"<Name> has <N> <items>. <clause: gives/loses/spends <M>>. <clause: gets/buys/finds <K> more>. How many <items> does <Name> have now?"` (and its permutations — start, minus, plus; start, plus, minus). This is the narrowest and most template-fragile of the four, and should be scoped conservatively: exact regex-anchored clause order, not a general parser.
3. **Two-shape area/perimeter comparison.** Recognise exactly two `geometry_shape` visuals (square/rectangle) and a "which is greater"/"by how many more" comparison prompt; reuses `deriveRectangleMeasures` twice, then one subtraction.
4. **Single unit-conversion-then-arithmetic for money or mass/length/volume with a small closed unit set.** Recognise a stated quantity in one unit, a second quantity in a different (but supported) unit, and a subtraction/addition; requires the same small conversion table as Approach A §3.4, but wired directly into one or two new `attempt*` methods rather than a generic step interpreter.

### 4.2 Coverage limits

By construction, Approach B only ever covers the exact prompt phrasings each template's regex/structural check anchors on. Any rewording the generator produces that isn't covered — a different clause order, a synonym the template didn't anticipate, a third step — falls straight through to `not_applicable` and the existing `unable_to_derive_answer` path, same as today. This is safe (never a false pass) but means coverage grows only linearly with engineering effort spent writing new templates, and is fragile to prompt-writing style: because there is no generator-side contract requiring particular quantities to be identifiable, template match rates are only as good as the regex/keyword coverage, likely materially lower than Approach A's coverage for the same engineering effort, since Approach A gets the generator to *cooperate* rather than asking the verifier to *guess* at prose structure after the fact.

### 4.3 Files touched

- `src/features/question-factory/correctness/derive-answer.ts` — 3–4 new `attempt*` methods, registered in `DERIVATION_METHODS`.
- `src/features/question-factory/correctness/numeric.ts` (or `unit-conversion.ts`) — same closed unit-conversion table as Approach A, only needed for template 4.
- `src/features/question-factory/correctness/types.ts` — a small number of new issue codes, likely fewer than Approach A (e.g. `multistep_template_ambiguous` for a prompt that partially matches two templates).
- `src/features/question-factory/config/correctness-limits.ts` — likely no new limits needed (each template's regex is already implicitly bounded by prompt length).
- `src/tests/unit/question-factory/correctness-derive-answer.test.ts` — new fixtures per template.

No changes to `prompt-builder.ts`, `candidate-question.ts`, or the production/candidate schemas — this is the entire appeal of Approach B.

## 5. Recommendation

**Approach A**, with Approach B's template set 1 (buy-then-change) considered as a cheap, low-risk first increment if a smaller initial mission is wanted before committing to the schema change.

Rationale:

- **Coverage vs. engineering cost.** Approach B's coverage is capped by how many prompt phrasings get individually template-matched; it will always lag behind however creatively the generator (an LLM) phrases a multi-step word problem, because the verifier is reverse-engineering structure from prose after the fact. Approach A instead gets the generator to *declare* its own structure at generation time — the same LLM call that writes the prompt also writes the `workingSteps`, so coverage tracks "can the generator express its own working as data" rather than "did an engineer anticipate this exact phrasing." Given the generator is already required to write a `RESPONSE_EXAMPLE`-shaped candidate correctly, extending that contract with one more structured field is a smaller ask than the combinatorial explosion of prose templates Approach B would eventually need.
- **Failure mode symmetry.** Both approaches fail closed identically (§3.7/§4.2) — this is not a safety trade-off, only a coverage/cost one.
- **Fits the existing architecture.** Approach A's `derive-multistep-answer.ts` is a peer of `derive-answer.ts`'s other methods, reuses every existing primitive (`numeric.ts`, `visual-lookup.ts`, `money.ts`, `measurement.ts`), and requires zero changes to `verify-candidate-correctness.ts` or `orchestrate-correctness-verification.ts` — the capability/outcome/lifecycle machinery already generalizes to "one more derivation method that either succeeds whole or fails closed."
- **Risk is concentrated and reviewable.** The one place Approach A introduces genuine new risk is the grounding check (§3.3) — get that wrong and a generator could talk its way to a false pass by declaring a fabricated-but-plausible-looking working. This is why §3.3 recommends disallowing bare `literal` operands outright rather than trusting numeric-value coincidence, and why the grounding check deserves the most adversarial test coverage of anything in this design (§6).

If engineering capacity is constrained, Approach B's template 1 alone is a reasonable, low-risk first slice — it is a strict two-line extension of `attemptMoney` (already fully trusted, already fully tested) and would immediately resolve realistic-example #1 from §2.6 without touching any schema.

## 6. Test plan

New fixtures in `correctness-derive-answer.test.ts` (or a new sibling file if Approach A is chosen and the module count grows), covering — per the invariant in §1 — every branch must be provably one of exactly `passed` / `failed` / `review_required`, with a `passed` result requiring a full, ungrounded-operand-free, in-range re-execution:

1. **Correct multi-step → `passed`.** A `workingSteps`-bearing (or, for Approach B, template-matching) candidate whose declared answer exactly matches the mechanically re-executed final step. Assert `deriveIndependentAnswer` (or the new method directly) returns `DerivationSuccess`, and — at the `verifyCandidateCorrectness` level — assert `status: "passed"`, `capability: "deterministically_verifiable"`.
2. **Wrong final answer → `failed`.** Same structure as (1) but the declared answer key is deliberately off by one step's worth. Assert the derivation still *succeeds* (the working is well-formed and grounded) but `compareDerivedToDeclared` produces a mismatch, and the overall result is `status: "failed"` with a `declared_answer_mismatch` issue — proving the gate distinguishes "couldn't verify" from "verified and it's wrong."
3. **Ungrounded operand → fails closed, never a false pass.** A candidate whose declared `workingSteps` (or matched template) references a `literal`/`prompt_quantity` value that does **not** appear in the prompt/visual data. Assert a terminal `cannot_derive` with `multistep_operand_ungrounded` (Approach A) — never `not_applicable` (which would silently skip to a different, possibly-guessing method) and never a success. This is the single most important fixture in the whole suite: it is the direct test of the "never guess" invariant for this feature.
4. **Forward/self/out-of-range step reference → fails closed.** `step_output` pointing at `stepIndex >= index` (Approach A only). Assert `multistep_step_reference_invalid`, never a crash (no unguarded array access) and never a partial result.
5. **Unsupported unit conversion → fails closed.** A `convert_unit` step naming a unit pair outside the closed table. Assert `multistep_unit_conversion_unsupported`.
6. **Resource-limit breach → fails closed.** `steps.length` or `promptQuantities.length` exceeding the new `CORRECTNESS_LIMITS` bounds (§3.6). Assert `multistep_resource_limit_exceeded`, mirroring the existing `MAX_ORDERING_ITEMS`-style tests already in the suite for other methods.
7. **Ambiguous/unparseable → `review_required`, never a false pass.** For Approach B specifically: a prompt that partially matches two templates (e.g. both the buy-then-change template and the plain two-delta template fire). Assert an `ambiguous`-reason failure, never a silent pick of one template's answer.
8. **No multi-step data present → `not_applicable`, falls through cleanly.** A perfectly ordinary single-step candidate with no `workingSteps` field (or no template match). Assert the new method returns `not_applicable` and the dispatcher proceeds to the next method exactly as it does today — proving the new method is additive and does not regress any of the eleven existing methods' dispatch order.
9. **Exact-arithmetic fixtures for every new primitive.** Unit-only tests (in `numeric.test.ts`'s sibling or a new `unit-conversion.test.ts`) proving every conversion factor is an exact `Fraction` (e.g. `1.2 kg → 1200 g` must be exact, never `1199.9999999998`), mirroring the existing "never a float" fixtures already in `correctness-numeric.test.ts`.
10. **Full-pipeline fixtures for all four §2.6 examples**, each asserted to now resolve to `passed` under whichever approach is implemented, and — as a regression guard — re-asserted to still resolve to `review_required`/`quarantined` if the corresponding `workingSteps`/template data is *omitted*, proving the new method never becomes a mandatory gate for content that doesn't opt in to it.

## 7. Confirmation: this branch changes no behaviour

This design document is the only file added in this branch. No file under `src/`, `scripts/`, `docs/CONTENT_RULES.md`, or any other governing document was modified. In particular:

- The curated 100-question bank (`src/content/questions/question-bank.ts` and its siblings under `src/content/questions/`) is untouched.
- Every file cited above — `derive-answer.ts`, `verify-candidate-correctness.ts`, `orchestrate-correctness-verification.ts`, `types.ts`, `numeric.ts`, `money.ts`, `arithmetic-expression.ts`, `evidence.ts`, `config/correctness-limits.ts`, `prompt-builder.ts`, `ingestion/candidate-question.ts` — was read only, never edited.
- The existing correctness-gate test suite (`src/tests/unit/question-factory/correctness-*.test.ts`) and `src/tests/unit/question-bank.test.ts` are unaffected: `git diff --stat` against the branch point shows this document as the sole change, so their outcomes are identical to the base SHA's by construction, not merely by inspection.

No lint/format tooling in this repository applies to Markdown (`eslint.config.mjs` covers TypeScript/JavaScript only; there is no Prettier or markdownlint configuration in the repo), so no formatter was run against this file beyond manual review for consistent heading levels and prose formatting.
