# Governed Correctness Verification Gate — Mission 2C

Status: **implemented**. This mission builds the second production gate, running only against
candidates already at `structural_validation_passed`: a pure, deterministic correctness verifier and
a repository orchestration function that moves a candidate to `correctness_check_passed` (pass),
`rejected` (`rejected/correctness`, a deterministically-proven wrong answer), or `quarantined` (a
result the gate cannot independently decide — review-required or unsupported). It does not import the
302 harvested questions, does not modify the 100 production questions, and does not implement semantic
AI review, originality/duplicate detection, difficulty estimation, staging, or publication — all of
that remains explicitly out of scope for later missions.

Code: `src/features/question-factory/correctness/`. Tests:
`src/tests/unit/question-factory/correctness-numeric.test.ts` (exact fraction/money arithmetic),
`correctness-arithmetic-expression.test.ts` (hand-rolled expression parser),
`correctness-derive-answer.test.ts` (independent-derivation dispatcher, per category),
`correctness-verify-candidate.test.ts` (the pure verifier end-to-end: pass/fail/review-required,
structural-evidence binding), `correctness-orchestration.test.ts` (repository orchestration: lifecycle
destinations, replay safety, partial-failure recovery, conflict detection), fixtures in
`correctness-fixtures.ts`.

## Architecture

```text
pure correctness verifier (verifyCandidateCorrectness)
  → CorrectnessVerificationResult { status: "passed" | "failed" | "review_required", capability, issues?, evidence }
  → lifecycle orchestration (orchestrateCorrectnessVerification)
  → transactional repository move (FactoryRepository.move) — only when the destination compartment differs from the source
```

`verifyCandidateCorrectness` is deterministic and side-effect free: no I/O, no wall-clock reads
(`context.verifiedAt` is caller-supplied), no randomness, no repository access. It takes the same
generator-agnostic `QuestionFactoryCandidate` shape Mission 2B defined and a
`CorrectnessVerificationContext` (`verifiedAt`, the caller-supplied structural-evidence report, and a
recomputed blueprint hash), and returns structured evidence for every outcome.

`orchestrateCorrectnessVerification` is the only impure piece: it reads a candidate from
`FactoryRepository`'s `review-queue` compartment, locates the stored structural-validation evidence
report, calls the pure verifier, stores the evidence as a separate report record, and moves the
candidate through `FactoryRepository.move()` — except on a pass, where the destination
(`correctness_check_passed`) maps to the *same* compartment (`review-queue`) the candidate is already
in, so no physical move happens at all; see "A same-compartment pass", below.

### Files

| File | Responsibility |
|---|---|
| `types.ts` | `CorrectnessCapability`, `CorrectnessVerificationContext`/`Result`/`Issue`/`Evidence` contracts, closed issue-code and check-group enums |
| `numeric.ts` | Exact bigint-backed `Fraction` arithmetic and integer-cent money helpers — the numeric foundation every other module builds on |
| `arithmetic-expression.ts` | A hand-rolled recursive-descent parser/evaluator for `+ - * / ( )` over prompt text — never `eval()` |
| `fraction-decimal.ts` | Fraction/decimal token parsing, equivalence, and independent sort-by-value |
| `money.ts` | Price-list extraction from a table visual and integer-cent totals |
| `measurement.ts` | Perimeter/area derivation from a `geometry_shape` visual's own measurements (square/rectangle only) |
| `visual-lookup.ts` | Independent readers over chart/table/number-line structured visual data (label lookup, extreme-with-tie-detection, table cell lookup, arithmetic-step derivation) |
| `derived-value.ts` | The closed `DerivedValue` union every derivation method produces |
| `derive-answer.ts` | The independent-derivation dispatcher — an ordered set of narrow, category-specific methods |
| `canonical-response.ts` | Converts an answer key or a `DerivedValue` into the `CandidateAnswer` shape `scoreQuestion` consumes |
| `explanation-consistency.ts` | A narrow, supporting-evidence-only check for an explicit contradicting numeric claim in the explanation |
| `evidence.ts` | Builds `CorrectnessVerificationEvidence` plus its deterministic hash |
| `verify-candidate-correctness.ts` | The pure public entry point — composes every check above |
| `orchestrate-correctness-verification.ts` | Repository orchestration: read, bind structural evidence, run the pure verifier, store evidence, transactionally move (when needed) |
| `index.ts` | Narrow public export surface only |

## Public API

```typescript
verifyCandidateCorrectness(
  candidate: QuestionFactoryCandidate,
  context: CorrectnessVerificationContext,
): CorrectnessVerificationResult

orchestrateCorrectnessVerification(
  candidateId: string,
  repository: FactoryRepository,
  options: OrchestrateCorrectnessVerificationOptions,
): Promise<CorrectnessOrchestrationOutcome>
```

`correctness/index.ts` exports only these two functions, `CORRECTNESS_VERIFIER_VERSION`, the closed
`CORRECTNESS_CAPABILITIES`/`CORRECTNESS_VERIFICATION_ISSUE_CODES`/`CORRECTNESS_CHECK_CATALOGUE` enums,
`buildCorrectnessReportId`/`buildCorrectnessEvidence`, and their supporting types. Every individual
derivation/comparison module is internal — not re-exported, importable by tests directly by file path,
mirroring the convention Mission 2B's `validation/index.ts` already established. Two small
classification predicates (`isSemanticCategory`, `isUnsupportedInteractionCategory`) are exported
directly from `verify-candidate-correctness.ts` (not re-exported from `index.ts`) purely so they can be
unit-tested against question shapes that cannot currently reach the full pipeline — see "Confirmed
gaps", below.

## Authoritative contracts reused

- **`scoreQuestion`** (`@/features/exam-engine/scoring/score-question`) — the real scoring contract,
  used twice per deterministically-verifiable candidate: once on the declared answer key's own
  canonical response, once on the independently derived response. No alternate scoring implementation
  exists anywhere in this module.
- **`parseCandidateProvenance`, `parseCandidateQuestion`, `checkAgainstProductionSchema`,
  `STRUCTURAL_VALIDATOR_VERSION`** (Mission 2B, `../validation`) — the exact same trust-boundary
  re-parse and production-schema realisation structural validation already performs, reused rather
  than re-declared. Re-exported from `validation/index.ts` specifically for this gate's benefit (see
  that file's updated doc comment).
- **`questionSchema`** (`@/schemas/question.schema`) — reused transitively through
  `checkAgainstProductionSchema`; every answer-key/interaction referential-integrity rule (unique
  option ids, matching/ordering/dropdown/hotspot/drag-drop reference resolution) is already guaranteed
  by the time this gate runs, since a candidate cannot reach `structural_validation_passed` without it.
  This gate therefore does not re-implement referential-integrity checks — see "Why there is no
  separate referential-integrity check", below.
- **`visualSchema`** (`@/schemas/visual.schema`) — every derivation method reads only the
  already-validated structured fields this schema guarantees (`bar_chart.data.labels/values`,
  `table.data.headers/rows`, `number_line.data.highlightedValues`, `geometry_shape.data.measurements`,
  `fraction_model.data.numerator/denominator`), never alt text or raw SVG.
- **`candidateProvenanceSchema`, `hashJson`, `FACTORY_VERSIONS`, `FACTORY_THRESHOLDS`**
  (`../provenance`, `../config`) — reused unmodified for provenance re-validation, content-hash
  comparison, schema/taxonomy version staleness checks, and the revision-limit constant.
- **`FactoryRepository`, `compartmentForState`** (`../storage`) — reused unmodified for every
  repository read/move; no direct filesystem access anywhere in this module.
- **`applyTransition`, `decideGateFailureOutcome`** (`../workflow`) — reused unmodified for the
  lifecycle transition legality check and the shared "cannot decide → quarantined,
  demonstrably-wrong → rejected" policy — see "Lifecycle outcomes", below.

No second scoring engine, no second production question schema, and no second candidate-provenance
schema were created.

### Why there is no separate referential-integrity check

The matrix requirement "every `answerKey` id must resolve to a real declared option" (the
`answer_option_references` category) is already fully enforced by `questionSchema`'s own
`superRefine`, which `checkAgainstProductionSchema` exercises before this gate ever runs — and a
candidate cannot be at `structural_validation_passed` without having passed it. Re-implementing it
here would be a second, disconnected copy of a rule Mission 2B already owns. This gate's genuinely
novel value is the numeric/visual **derivation** — proving the declared value is actually correct, not
just that its ids exist.

## Capability classification

```typescript
type CorrectnessCapability =
  | "deterministically_verifiable"
  | "structurally_scoreable_only"
  | "requires_independent_semantic_review"
  | "unsupported";
```

Classification happens in `verify-candidate-correctness.ts`, in this order:

1. **`unsupported`** — `question.type` is `drag_drop`, `hotspot`, or `label_diagram`. Fails closed
   immediately with `unsupported_correctness_category`, before any scoring or derivation attempt.
2. **`requires_independent_semantic_review`** — `question.type` is `essay` or
   `reading_comprehension`; the answer key's `kind` is `manual`; `question.type` is `short_answer`
   with a `text` answer key; or `question.type` is `fill_blank`/`dropdown` with
   `metadata.subject !== "numeracy"` (grammar/vocabulary blanks and dropdowns).
3. **`deterministically_verifiable`** — everything else, *if* `deriveIndependentAnswer` (see below)
   successfully recognises the question's prompt/visual shape.
4. **`structurally_scoreable_only`** — everything else, when derivation could not recognise the
   shape, or recognised it but could not safely resolve it (a tie, missing data).

`declared_answer_mismatch`, `canonical_response_not_full_marks`, and `derived_response_not_full_marks`
issues can appear for `deterministically_verifiable` candidates only — a
`structurally_scoreable_only`/`requires_independent_semantic_review` candidate can still fail the
canonical-response scoring check (rare, since the same check already ran during structural
validation — see "Known limitations" in the Mission 2B doc), which forces `status: "failed"`
regardless of capability.

## Deterministic verifier catalogue

Each category below is a narrow function in `derive-answer.ts`, tried in a fixed order; the first to
recognise the question's shape wins (see that file's dispatcher doc comment).

| Category | Method | Question types | Source of truth |
|---|---|---|---|
| Arithmetic expressions | `attemptArithmetic` | `number_entry`, `true_false` (an explicit `EXPR = N` claim), `multiple_choice` (matches the recomputed value against option text) | A single machine-parseable expression extracted from the prompt |
| Money | `attemptMoney` | `number_entry` | A table visual's own item/price columns, integer cents throughout |
| Perimeter/area | `attemptPerimeterArea` | `number_entry`, `true_false` | A `geometry_shape` visual's `measurements` (square/rectangle only) |
| Chart extreme (max/min) | `attemptChartExtreme` | `number_entry`, `multiple_choice`, `multiple_select` | `bar_chart`/`line_graph`/`pie_chart` label/value pairs, with tie detection |
| Chart exact lookup | `attemptChartExactLookup` | `number_entry` | A chart label referenced verbatim (whole-word match) in the prompt |
| Table lookup / difference | `attemptTableLookup` | `number_entry` | A table row label referenced in the prompt; two referenced rows plus a "more/fewer/difference" prompt phrase yields a row-to-row difference |
| Number-line extrapolation | `attemptNumberLine` | `number_entry` | `number_line.data.highlightedValues`' own consistent step |
| Decimal/fraction ordering | `attemptFractionOrdering` | `ordering` | Each item's own numeric text, independently sorted; direction taken from the earlier of an ascending/descending keyword in the prompt |
| Fraction equivalence matching | `attemptFractionMatching` | `matching` | Each source/target's own numeric text, paired by exact value equality |
| Fraction-model single value | `attemptFractionModelSingleValue` | `number_entry`, `fill_blank` (1 blank), `dropdown` (1 field) | `fraction_model.data.numerator/denominator`, selected by a shaded/unshaded/total keyword |
| Numeric predicate over options | `attemptNumericPredicateOverOptions` | `multiple_select` | A closed, explicit predicate ("multiples of N" / even / odd / less-than / greater-than) mechanically parsed from the prompt, applied to each option's own exact numeric text. Thresholds are parsed as exact `Fraction`s (never truncated), so `less than 2.5` correctly includes an option of `2` and excludes `2.5` itself. `less-than`/`greater-than` accept decimal and negative operands; `even`/`odd`/`multiples-of` are only mathematically defined over integers and reject (never silently skip) a non-integral option instead |

Every method returns one of: a successful derivation (a `DerivedValue` plus a category tag and a
short display representation), `not_applicable` (the next method gets a turn), or a terminal
`cannot_derive`/`ambiguous` outcome (an issue code, never a guess).

## Review-required and unsupported categories

- **`requires_independent_semantic_review`**: reading comprehension, essays, manually-rubric-marked
  short answers, and grammar/vocabulary fill-blank/dropdown questions. These can never reach
  `correctness_check_passed` by construction — `verify-candidate-correctness.ts` never calls
  `deriveIndependentAnswer` for them at all.
- **`structurally_scoreable_only`**: any numeric/objective question type whose prompt/visual shape no
  derivation method recognises (an implied-but-not-literal word problem, a chart with an ambiguous or
  missing reference), or whose shape a method recognised but couldn't safely resolve (a genuine tie at
  a chart/pie extreme, unevenly-spaced number-line points, a division-by-zero prompt). Angle
  classification, coordinate/distance lookups, and time/calendar arithmetic all fall here today — no
  derivation method exists for them; see "Confirmed gaps".
- **`unsupported`**: `drag_drop`, `hotspot`, `label_diagram` — no derivation *or* comparison method
  exists for these interaction shapes at all. Fails closed immediately, before any scoring attempt.

## Exact arithmetic and precision model

Centralised in `numeric.ts`. Every value that flows into a correctness *comparison* is an exact
bigint-backed `Fraction` (`{ num: bigint; den: bigint }`, always reduced to lowest terms with a
strictly positive denominator) or an integer cent count — never a `number` compared by `===` or `<=
epsilon`. `number` only ever appears as a decoded schema input or a display-only output.

- **Fractions**: `makeFraction` reduces via `gcd` and rejects a zero denominator
  (`division_by_zero`) or a magnitude past `10^15` (`numeric_overflow`) before it ever reaches a
  comparison.
- **Decimals**: `fractionFromDecimalString` parses the literal digit positions of a decimal string
  directly into a numerator/scale pair — never `Number(text) * 10 ** n`, which reintroduces binary
  float error in the scale factor itself. `0.1 + 0.2 === 0.3` exactly under this arithmetic (proven by
  a dedicated test), where native floating point does not.
- **Money**: `dollarsToCents` parses a dollar string's whole/fractional digit groups directly into an
  integer cent count — never `Math.round(dollars * 100)`. Rejects more than two decimal places
  (`invalid_money_representation`) rather than guessing a rounding rule. `totalCents` sums line items
  using validated, bounded integer cent arithmetic throughout (rejecting a negative or non-integral
  quantity, or a line-item count/quantity/running total past the configured limit, as
  `money_value_invalid`/`money_limit_exceeded`); the final display value is converted back via
  `fractionFromCents` (an exact `cents/100` fraction), never `(total / 100).toFixed(2)`.
- **Resource bounds**: every unbounded-by-construction parsing surface has an explicit limit, centralised
  in `CORRECTNESS_LIMITS` (`config/correctness-limits.ts`) rather than scattered magic numbers.
  `arithmetic-expression.ts` bounds source length, token count, operator count, numeric-literal length,
  and parenthesis/unary-chain recursion depth *before or during* tokenising/parsing — never after an
  unbounded pass — surfacing `arithmetic_resource_limit_exceeded` rather than an uncontrolled exception
  or stack overflow. `numeric.ts`/`fraction-decimal.ts` bound a numerator/denominator/decimal literal's
  digit length *before* it is ever passed to `BigInt(...)`, in addition to the pre-existing
  post-construction magnitude check, surfacing `fraction_resource_limit_exceeded`. Ordering/matching
  derivation bounds the number of items processed (`MAX_ORDERING_ITEMS`) given the pairwise tie-detection
  cost.
- **Comparison**: `compareFractions` cross-multiplies (`a.num * b.den` vs `b.num * a.den`) — exact
  because both denominators are strictly positive by construction.
- **Tolerance**: `fractionWithinTolerance` is the *only* place a numeric comparison accepts anything
  other than exact equality, and only because the answer key's own `tolerance` field is an explicit
  part of the question contract (`numberAnswerKeySchema`), never an ad hoc epsilon this gate invents.
- **`NaN`/`Infinity`/under-specified inputs**: `isSafeFiniteNumber` and the decimal-string regex reject
  both categories before they ever reach a `Fraction`; a prompt with no literal expression at all
  yields `not_found` (routed to `structurally_scoreable_only`), never a `NaN` propagating downstream.

## Visual correctness rules

- **Bar/line/pie charts**: `labelledValuesOf` reads only `data.labels`/`data.values`,
  `data.segments`, or labelled `data.points` — never alt text. `extremeEntries` returns *every* entry
  tied at the extreme; a caller finding more than one always treats it as ambiguous, never picks the
  first. Category lookups require a whole-word (token-boundary) match against the prompt, so a label
  that is a substring of another word can never falsely match.
- **Tables**: `tableCellByRowLabel` requires the row label to resolve to *exactly one* row and the
  column header to resolve to *exactly one* column before returning a cell — a duplicate row label *or*
  a duplicate header is reported to the caller as `undefined` (never "the first match").
  `validateTableShape` additionally rejects a table outright — before any lookup is attempted — for a
  duplicate header, a duplicate row label, or a row whose cell count doesn't match the header count
  (`ambiguous_table_header` / `ambiguous_table_row` / `table_reference_missing`), all after the same
  case/whitespace canonicalisation used for lookup.
- **Charts**: before any extreme or exact-label lookup, `attemptChartExtreme`/`attemptChartExactLookup`
  reject a chart outright if two or more of its own labels canonicalise to the same key
  (`ambiguous_visual_label`) — a genuine tied *value* at the extreme (`ambiguous_visual_data`) is a
  separate, still-enforced condition.
- **Chart-to-option resolution**: once `attemptChartExtreme` has a single winning label,
  `findOptionsMatchingLabelExactly` maps it to a declared `single_option`/`multiple_options` answer key
  entry by exact canonical equality only — never substring, prefix, suffix, token-containment, or
  regex-inferred matching. A chart label `"A"` can never resolve to a declared option `"AA"` (or vice
  versa) just because one text contains the other. Zero matches and more than one match (including two
  declared options sharing the same canonical text) both fail closed, never picking a first/best guess.
- **Canonicalisation**: `canonicaliseLabel` (`visual-lookup.ts`) is the single function every label/
  header/option-text equality comparison in this gate goes through — chart labels, table headers, table
  row labels, duplicate detection, and chart-to-option exact matching all call it, so no comparison can
  silently diverge from another. Fixed order: Unicode NFC normalisation (a composed accented character
  and its decomposed combining-mark form canonicalise identically) → trim → collapse internal whitespace
  runs to one space → `en-AU` lowercase.
- **Number lines**: `deriveArithmeticStep` requires every consecutive pair of highlighted values to
  share the *same* signed difference (not just be sorted) before returning a step; anything less
  returns `undefined`, surfaced as `number_line_inconsistent`.
- **Pie charts**: extreme-segment derivation shares the same `extremeEntries` tie-detection as bar/line
  charts; proportion-of-whole derivation (segment value ÷ sum of all segments) is a documented,
  not-yet-implemented category — see "Confirmed gaps".
- **Geometry**: `deriveRectangleMeasures` reads only `geometry_shape.data.measurements` (never vertex
  coordinates, never an estimate from rendered scale) and only for `square`/`rectangle` — the two
  shapes whose perimeter/area follow unambiguously from labelled side lengths alone.

## Scoring-engine integration

Every `deterministically_verifiable` candidate is checked twice against the real `scoreQuestion`:

1. **Declared response** — built directly from the answer key (`buildDeclaredResponse`), in the exact
   shape each real scorer consumes. Its scoring is, by construction, close to tautological (the same
   check Mission 2B's `checkScoringCompatibility` already performed to reach
   `structural_validation_passed` — see that mission's "Known limitations"); it remains here as
   defence-in-depth against the specific scenario mission 2C must guard against — a structural evidence
   report that no longer matches the *current* candidate content (see "Structural-evidence
   dependency").
2. **Derived response** — built from the independently-derived `DerivedValue`
   (`buildResponseFromDerivedValue`), submitted through the identical scoring path. Requiring this to
   also score full marks catches a shape/tolerance mismatch between the derivation's representation
   and the answer key's own contract that a bare fraction-equality comparison alone would miss.

Both invocations go through `safeScoreQuestion`, a narrow wrapper that catches any exception the real
scorer throws — `scoreQuestion` is out of this gate's control, and an unhandled throw must never abort
verification or certify a candidate. A caught exception becomes a `scoring_engine_error` issue whose
`path` (`scoring.declared_response` / `scoring.derived_response`) identifies which of the two
invocations failed; the raw exception message is bounded and never includes a stack trace. Scoring never
throws out of `verifyCandidateCorrectness` itself, and a scoring-engine exception on either invocation
always routes to `failed`, never `passed`.

"Full marks" means `status === "correct" && awardedMarks === availableMarks && availableMarks > 0` —
defined once (`summariseScoring`) and applied identically to both checks. A full score on either
response alone is never treated as proof of correctness; both the comparison
(`declared_answer_mismatch`) *and* both scoring checks (`canonical_response_not_full_marks`,
`derived_response_not_full_marks`) must independently pass before a candidate reaches
`correctness_check_passed` — see "Independent answer derivation" in this document's originating
mission brief, points 5–6.

## Structural-evidence dependency

Before any correctness check runs, `verifyCandidateCorrectness` re-confirms every one of the entry
conditions the mission specified, all as pure comparisons against caller-supplied data (no I/O inside
the pure verifier itself):

- **Structural evidence exists** (`missing_structural_evidence` if `context.structuralEvidence` is
  `undefined`).
- **Structural evidence outcome is `passed`** (`structural_evidence_mismatch` otherwise).
- **Structural evidence's fingerprint matches the current candidate**: `candidateId`,
  `candidateRevision`, `candidateContentHash` (compared against the candidate's own freshly re-parsed
  provenance, never trusted from the report alone), and `blueprintHash` (compared against a blueprint
  hash the orchestration layer recomputes the same way Mission 2B's own orchestration does) must all
  agree (`structural_evidence_mismatch` on any disagreement).
- **Structural evidence is not stale**: its `schemaVersion`/`taxonomyVersion`/`validatorVersion` must
  match the process's current `FACTORY_VERSIONS`/`STRUCTURAL_VALIDATOR_VERSION`
  (`stale_structural_evidence` otherwise) — a *version* staleness notion, deliberately independent of
  wall-clock time, since the pure verifier never reads a clock.
- **Candidate re-parses**: `parseCandidateProvenance`/`parseCandidateQuestion`/
  `checkAgainstProductionSchema` are re-run on the raw candidate exactly as structural validation did
  — a candidate that no longer parses despite passed structural evidence is `structural_evidence_mismatch`,
  never trusted.

Any one of these failing short-circuits to `status: "failed"`, `capability: "unsupported"`, before
capability classification or derivation ever runs — "do not trust candidate state alone" is enforced
by re-deriving every one of these facts from the current stored record and the caller-supplied
structural-evidence report, never from `candidate.state` (which — see the orchestration section below
— is not a reliable signal for this gate's purposes regardless).

**Physical compartment and "no later-gate evidence" are orchestration-level, not pure-verifier-level,
checks** — see "A same-compartment pass" below for why: `structural_validation_passed`,
`correctness_check_passed`, and every later gate's passed state all map to the identical `review-queue`
compartment, so physical location alone can never distinguish "just passed structural validation" from
"already passed correctness too." `orchestrateCorrectnessVerification` resolves this by always
re-running the pure verifier against the candidate's *current* content when it is still physically
present, and letting the stored report's fingerprint (never location, never raw existence) decide
replay vs. conflict — see "Lifecycle and repository behaviour".

## Evidence and fingerprint model

```typescript
interface CorrectnessVerificationEvidence {
  candidateId: string;
  candidateRevision: number;
  candidateContentHash: string;
  blueprintHash?: string;
  structuralEvidenceFingerprint?: string;
  verifierVersion: string;
  schemaVersion: string;
  taxonomyVersion: string;
  capability: CorrectnessCapability;
  deterministicCategory?: string;      // e.g. "arithmetic_expression", "chart_extreme", "money_total"
  declaredAnswer?: { method: string; representation: string };
  derivedAnswer?: { method: string; representation: string };
  declaredScoring?: ScoringOutcomeSummary;
  derivedScoring?: ScoringOutcomeSummary;
  checksPerformed: readonly CorrectnessCheckGroup[]; // fixed, configured catalogue — not a runtime trace
  issueSummary: { errorCount: number; reviewRequiredCount: number; codes: readonly CorrectnessVerificationIssueCode[] };
  outcome: "passed" | "failed" | "review_required";
  verifiedAt: string;                  // observational metadata only — excluded from the fingerprint
  verificationFingerprint: string;     // hashJson over deterministic identity fields only
}
```

Every representation string (`declaredAnswer`/`derivedAnswer`) is short and closed-form — an option
id, a fraction display string (`"71"`, `"3/4"`), a dollar string (`"$5.50"`), a bracketed id list —
never the prompt, explanation, or any unbounded donor text. `verificationFingerprint` (`evidence.ts`)
is `hashJson` over exactly the same class of fields `StructuralValidationEvidence.validationFingerprint`
hashes over — candidate identity, structural-evidence binding, versions, capability, the derived/
declared answer representations and scoring summaries, the fixed check catalogue, the issue summary,
and the outcome — and, critically, **excludes `verifiedAt`**, for the identical replay-safety reason
Mission 2B's fingerprint excludes `validatedAt`: two runs against unchanged candidate content and
unchanged structural evidence must fingerprint identically no matter when each ran, so a retry after a
transient repository failure (a new `verifiedAt`, everything else unchanged) is recognised as
equivalent rather than a false conflict. Proven by the "is deterministic" and "the verification
fingerprint excludes verifiedAt" tests in `correctness-verify-candidate.test.ts`.

## Lifecycle outcomes

`orchestrateCorrectnessVerification` maps every non-passing result onto the *existing* shared
governance policy (`decideGateFailureOutcome`) rather than inventing a new lifecycle state:

- **Pass** (`deterministically_verifiable`, every check clean) → `correctness_check_passed`.
- **Deterministic failure** (`deterministically_verifiable`, but the comparison, either scoring check,
  or the explanation-consistency check found a problem) → `severity: "hard_fail"` →
  **`rejected`** (compartment `rejected/correctness`) — unambiguous, since the gate independently
  proved the declared answer wrong or scoring-incompatible.
- **Review-required** (`structurally_scoreable_only` / `requires_independent_semantic_review`) *or*
  **unsupported** → `severity: "uncertain"` → **`quarantined`** — the shared policy's own "the gate
  cannot decide" destination (`policies.ts`: *"an uncertain result ... is quarantined rather than
  guessed at"*), reused exactly as `semantic_review_passed`'s own reviewer-availability gate already
  relies on the identical policy contract for the identical reason. This is **not** a new lifecycle
  state: `quarantined` is already a legal `structural_validation_passed` successor in
  `TRANSITION_TABLE`, and Shared Governance already documents it as the review-required destination
  when "no safe intermediate state exists" — which is exactly this gate's situation, since
  `needs_revision` would incorrectly imply the *author* should rewrite something, when a
  `structurally_scoreable_only`/semantic-review-required classification is not a defect at all, just an
  unproven claim.

A semantic-review-required or unsupported candidate can therefore never be marked
`correctness_check_passed` — proven by every `review_required`/`unsupported` test in
`correctness-verify-candidate.test.ts` and `correctness-orchestration.test.ts` asserting `status`/
`outcome` is never `"passed"`.

### A same-compartment pass

`correctness_check_passed` maps to the identical `review-queue` compartment
`structural_validation_passed` (and every later gate's passed state) already maps to
(`state-compartment-mapping.ts`). `FactoryRepository.move()` requires `from !== to`, so a pass can never
use `move()` to record itself.

**Stabilisation note:** an earlier version of this orchestration function stopped there — on a pass, only
the evidence report was written, and the candidate's own stored `state` field was never updated, because
nothing ever called `move()`. A second call therefore had no way to tell "just passed structural
validation" from "already passed correctness too" other than re-deriving from a report that itself
carried no authoritative lifecycle signal. The fix adds `FactoryRepository.update()` — a narrow,
same-compartment counterpart to `move()` with the identical atomic-write and content-hash-based replay
discipline, scoped to a single location instead of two — and calls it whenever the destination
compartment equals `review-queue`, rewriting the candidate record with `state: "correctness_check_passed"`
bound to `expectedContentHash` (the exact record this function read earlier in the same call, so a
genuine out-of-band edit between read and write is refused as a conflict rather than silently
overwritten). A successful pass now authoritatively leaves the stored candidate at
`correctness_check_passed`, provable by re-reading `review-queue` after the call — not just by reading
the separate evidence report.

## Lifecycle and repository behaviour

`orchestrateCorrectnessVerification`:

1. Reads the candidate from `review-queue`. If absent, there is no current content to re-verify
   against — a stored correctness report (if any) is trusted directly and replayed; otherwise
   `not_found`.
2. If present, checks the candidate's *current stored* `state`, not an assumed one:
   - `state === "correctness_check_passed"` — this gate's own terminal state for the compartment — is
     only a safe replay once `validateCachedCorrectnessReplay` independently re-proves the cached
     report's binding (see "Cached-replay evidence binding", below); the lifecycle state alone is never
     sufficient authorisation. If that check passes, the existing correctness report is looked up and its
     outcome returned directly (`replayed: true`), with no re-derivation, no report write, and no move.
     If it fails, the orchestration returns `outcome: "replay_integrity_failure"` with the specific
     binding issues — never cached success, never a silent re-derivation over a passed candidate, and
     never a candidate mutation. A `correctness_check_passed` candidate with no matching report at all is
     one of the failures this check reports (`cached_replay_integrity_failure`), never silently
     re-derived.
   - Any other `state` besides `"structural_validation_passed"` (e.g. a candidate manually or
     erroneously placed in `review-queue` while still `generated`, `quarantined`, or `rejected/*`) is
     refused outright as `outcome: "invalid_lifecycle_state"` — no derivation runs, no report is written,
     and the candidate is never moved. This is a deterministic orchestration-level guard, not merely
     historical structural evidence: a candidate is never reprocessed past the one state this gate is
     entitled to act on.
   - Only `state === "structural_validation_passed"` proceeds to fresh verification.
3. **Always** re-parses the candidate, locates the stored structural-evidence report
   (`sv-<sha256(candidateId)>`, Mission 2B's own report-id scheme, reused via
   `buildStructuralValidationReportId`), recomputes the blueprint hash, and re-runs
   `verifyCandidateCorrectness` fresh. This is deliberate: see "Why replay never skips re-verification",
   below.
4. Computes the transition target from the fresh result and calls
   `applyTransition("structural_validation_passed", target, ...)` — now truthfully describing the
   candidate's just-confirmed current state, not an assumed one.
5. Writes the evidence report (`cv-<sha256(candidateId)>`, a distinct id namespace from the structural
   report so the two gates' reports can never collide) via `writeReportIfAbsent`, which compares
   `verificationFingerprint` against any existing report — a match is a safe replay
   (`alreadyPresent: true`, no write), a mismatch is a genuine conflict (`repository_error`, nothing
   moved, no duplicate report).
6. Persists the transition: `repository.update()` when the destination compartment is still
   `review-queue` (the pass path — see "A same-compartment pass"), or `repository.move()` when it
   differs (`rejected/correctness` or `quarantined`).
7. Never transitions a candidate past `correctness_check_passed`, `rejected`, or `quarantined` — later
   gates (semantic, originality, difficulty, staging, publication) are out of scope for this function
   entirely, by construction: the only `to` values ever passed to `applyTransition` are
   `"correctness_check_passed"` and the output of `decideGateFailureOutcome` (which, with the two
   severities this gate ever uses, only ever resolves to `"rejected"` or `"quarantined"`).

### Why replay never skips re-verification

An earlier version of this orchestration function special-cased "a correctness report already
exists" as an immediate, un-re-verified replay whenever the candidate was still physically present.
This reproduced, in a different shape, the exact defect class Mission 2B's own fingerprint fix closed
for structural validation: a candidate genuinely edited out-of-band between a failed-move first attempt
and a retry would be silently moved to the *stale* report's destination, because the shortcut branch
recomputed only the target lifecycle state from the old report — never re-checking whether that report
still matched the *current* candidate. The fix removes the shortcut entirely: whenever the candidate is
physically present, this function always re-runs `verifyCandidateCorrectness` against its current
content and lets `writeReportIfAbsent`'s fingerprint comparison — not physical location, not raw report
existence — decide replay vs. conflict, exactly mirroring `orchestrate-structural-validation.ts`.
Proven by "rejects a retry when the candidate content genuinely changed after the report was written"
in `correctness-orchestration.test.ts`, which reproduces the defect end-to-end (candidate changed
out-of-band, report already exists from a failed-move first attempt, retry with the real repository)
and confirms the retry is rejected rather than silently completing a move for stale content.

## Cached-replay evidence binding

**Stabilisation note:** an earlier version of this orchestration function treated
`candidate.state === "correctness_check_passed"` as sufficient authorisation on its own to return the
stored correctness report — the lifecycle state alone, unchecked against the evidence it claims to rest
on. `validate-cached-replay.ts`'s `validateCachedCorrectnessReplay(candidate, structuralReport,
correctnessReport, context)` closes this: a pure, side-effect-free helper (no I/O — every report it
reasons about is supplied by the caller, already read in the same orchestration call) that independently
re-proves, before any cached success is returned:

- The candidate's own current identity/content binding — provenance still parses, its `candidateId`
  matches the stored record, and its current revision/content hash are known.
- The structural report exists, its own `outcome`/`result.status` is `passed`, its `candidateId` and
  evidence `candidateId` match, its evidence `candidateRevision`/`candidateContentHash`/`blueprintHash`
  match the candidate's *current* values, and its `schemaVersion`/`taxonomyVersion`/`validatorVersion`
  are current — reusing the exact same `structural_evidence_mismatch` /
  `stale_structural_evidence` / `missing_structural_evidence` codes `verifyCandidateCorrectness` already
  uses for a fresh derivation's own structural-evidence binding, rather than a parallel set.
- The structural report's `validationFingerprint` is *recomputed* via
  `computeStructuralValidationFingerprint` (the same authoritative algorithm `buildEvidence` uses — see
  "Structural fingerprint recomputation" below) from the report's own visible fields and compared to the
  stored value — never merely trusted. A report whose visible fields were edited while keeping (or
  fabricating) an old fingerprint fails this check.
- The correctness report exists, its own `candidateId` and evidence `candidateId` match, its `result`
  is actually `status: "passed"` with `capability: "deterministically_verifiable"` (never trusting the
  lifecycle state to imply the report agrees), its evidence `candidateRevision`/`candidateContentHash`/
  `blueprintHash` match the candidate's current values, its `schemaVersion`/`taxonomyVersion`/
  `verifierVersion`/`scorerVersion` are current, and its `structuralEvidenceFingerprint` still matches the
  structural report's own (recomputed) fingerprint — binding the two reports together, not just each to
  the candidate independently.
- The correctness report's own `verificationFingerprint` is recomputed via
  `computeCorrectnessVerificationFingerprint` from its own visible fields and compared to the stored
  value, for the identical tamper/staleness-detection reason as the structural fingerprint above.

Every failure becomes a `cached_replay_integrity_failure` issue (or a reused structural code, for a
structural-report-side failure) rather than a thrown exception; `path` identifies exactly which binding
failed (e.g. `correctnessReport.evidence.candidateContentHash`,
`structuralReport.evidence.validationFingerprint`). `orchestrateCorrectnessVerification` never writes,
moves, or mutates the candidate when this check fails — it returns `outcome: "replay_integrity_failure"`
with the full issue list and stops, consistent with "do not silently regenerate over a passed candidate"
and "do not mutate unless the existing policy explicitly permits a safe transition": no transition in
`TRANSITION_TABLE` covers "un-pass a previously-passed candidate on cache-integrity failure", so this
function does not invent one.

### Structural fingerprint recomputation

`computeStructuralValidationFingerprint` (`validation/evidence.ts`) and
`computeCorrectnessVerificationFingerprint` (`correctness/evidence.ts`) are each the single authoritative
fingerprint algorithm for their gate, extracted from `buildEvidence`/`buildCorrectnessEvidence`
respectively so a fresh build and a later recompute-and-compare can never silently diverge into two
incompatible algorithms. Both take the exact same field set their gate's evidence type already carries as
its own visible properties (candidate identity, versions, check catalogue, issue summary, outcome, and —
for correctness — capability/answers/scoring), so recomputation never needs anything beyond a stored
evidence record's own fields, is timestamp-independent by construction (`validatedAt`/`verifiedAt` are
not inputs), and uses the project's standard deterministic hash (`hashJson`, itself key-order-independent
via `stableStringify`) for comparison — the same mechanism every other fingerprint in this codebase
already relies on.

## Replay safety and partial-failure recovery

Mirrors Mission 2B's own recovery contract exactly, adapted for the two-compartment lifecycle:

- **Report written, move fails, retry with a fresh `verifiedAt`**: the candidate is still in
  `review-queue` (the move never completed). The retry re-parses the *same* unchanged content,
  re-derives the *same* result, and its fingerprint matches the stored report's — `writeReportIfAbsent`
  reuses it (`alreadyPresent: true`) and the move is retried. Proven by "recovers when the report write
  succeeds but the move fails" (`correctness-orchestration.test.ts`), which forces exactly one
  simulated transient `move()` failure and confirms exactly one report exists and the candidate ends in
  the correct compartment after the retry.
- **Candidate genuinely changed between attempts**: the retry's freshly re-derived fingerprint differs
  from the stored report's for a real reason (different content, different derived answer, different
  outcome) — `writeReportIfAbsent` reports a conflict, the candidate is never moved, and no duplicate
  report is written. Proven by "rejects a retry when the candidate content genuinely changed" and
  "rejects a retry when a differently-fingerprinted correctness report already exists" (the latter
  seeds a hand-built divergent report directly, mirroring Mission 2B's "issue-summary divergence" test
  technique).
- **Candidate already fully resolved**: a pass leaves the candidate in `review-queue` forever (see "A
  same-compartment pass") — the *next* call still finds it there, re-verifies (cheaply — the pure
  verifier is deterministic and side-effect free), reproduces the identical fingerprint, and replays.
  A rejected/quarantined candidate has physically left `review-queue` — the next call takes the
  not-found branch and trusts the stored report directly, since there is no current content left to
  re-check it against. Proven by "is idempotent and replay-safe" (pass), "replays an already-rejected
  outcome," and "replays an already-quarantined (review-required) outcome" — none re-verify, re-move,
  or write a second report.
- **No structural-evidence report at all**: routed to `quarantined` (not a crash, not a fabricated
  pass) via the pure verifier's `missing_structural_evidence` issue and the shared "cannot decide"
  policy. Proven by "routes a candidate with no structural evidence report to quarantined."

## Issue-code catalogue

`CORRECTNESS_VERIFICATION_ISSUE_CODES` (`types.ts`) — 30 closed codes, grouped:

**Structural-evidence binding:** `missing_structural_evidence`, `stale_structural_evidence`,
`structural_evidence_mismatch`.

**Capability/routing:** `unsupported_correctness_category`, `semantic_review_required`.

**Independent derivation:** `unable_to_derive_answer`, `ambiguous_prompt`, `ambiguous_visual_data`.

**Comparison and scoring:** `declared_answer_mismatch`, `canonical_response_not_full_marks`,
`derived_response_not_full_marks`, `explanation_contradiction`, `scoring_engine_error`.

**Exact-arithmetic guard rails:** `numeric_overflow`, `division_by_zero`, `invalid_rounding_rule`,
`invalid_money_representation`, `invalid_fraction_representation`, `arithmetic_resource_limit_exceeded`,
`fraction_resource_limit_exceeded`, `money_value_invalid`, `money_limit_exceeded`.

**Visual-data specific:** `visual_answer_mismatch`, `table_reference_missing`,
`chart_category_missing`, `number_line_inconsistent`, `ambiguous_visual_label`,
`ambiguous_table_header`, `ambiguous_table_row`.

**Cached-replay evidence binding:** `cached_replay_integrity_failure` — the single code
`validate-cached-replay.ts` uses for every binding failure it can detect (candidate/report identity,
revision, content hash, blueprint hash, version, or fingerprint mismatch) when proving a stored
`correctness_check_passed` report is still trustworthy before replaying it; `path` distinguishes which
specific binding failed (see "Cached-replay evidence binding" below). Structural-side failures within
that same check reuse the existing `missing_structural_evidence` / `stale_structural_evidence` /
`structural_evidence_mismatch` codes rather than a fourth near-duplicate.

Each `CorrectnessVerificationIssue` is `{ code, path, message, severity: "error" | "review_required" }`
— unlike Mission 2B's structural gate (whose checks are all unambiguous literal rules), this gate
genuinely has an "uncertain" dimension (review-required capabilities), so `severity` is meaningful here
and drives which lifecycle destination `decideGateFailureOutcome` resolves to (see "Lifecycle
outcomes"). Every message is passed through `boundMessage` (`evidence.ts`) before being attached to an
issue, deterministically truncating it to `CORRECTNESS_LIMITS.MAX_ISSUE_MESSAGE_LENGTH` — a single
choke point, so no prompt-derived, expression-derived, or exception-derived text can reach persisted
evidence unbounded. Truncation is a pure function of message length and never affects
`verificationFingerprint`, which is hashed over stable facts (codes, capability, outcome) rather than
raw message text. There is deliberately no separate "a message was truncated" issue code: truncation is
evidence-bounding *behaviour*, uniformly applied, not a fact about a specific derivation failure a
consumer needs to branch on — an earlier `evidence_message_truncated` catalogue entry was declared but
never emitted by any code path, and has been removed rather than wired up for its own sake.

`invalid_rounding_rule` and `visual_answer_mismatch` are declared in the closed catalogue for
forward-compatibility with the fuller derivation surface described in the mission brief, but are not
currently emitted by any implemented derivation method — see "Confirmed gaps". `scoring_engine_error`
*is* emitted today, by `safeScoreQuestion` in `verify-candidate-correctness.ts` (see "Scoring-engine
integration").

## Test matrix and confirmed gaps

Coverage is tracked against
`src/tests/fixtures/question-factory/mission2-calibration/correctness-verifier-matrix.json` (20
categories). This mission does not fabricate coverage for any category the matrix marks as a confirmed
gap.

**Implemented with passing synthetic fixtures** (`correctness-derive-answer.test.ts`,
`correctness-verify-candidate.test.ts`): arithmetic (addition, subtraction, multiplication, division,
decimal arithmetic, multiple-choice/true-false arithmetic, multiple-select numeric predicate), money
(total from a price-list table), fractions/decimals (equivalence matching, independent ordering,
fraction-model fill-blank/dropdown), perimeter and rectangular area, tables (cell lookup, row-to-row
difference), bar charts (category lookup), line graphs (category lookup), number lines (arithmetic-step
extrapolation), answer-option references (covered structurally by Mission 2B's reused schema — see
"Why there is no separate referential-integrity check").

**Implemented, review-required by design** (never a fabricated pass, proven by tests):
semantic-or-non-computable (reading comprehension, manual/rubric-marked answer keys) →
`requires_independent_semantic_review`; genuine chart-extreme ties, division-by-zero prompts,
inconsistent number-line spacing, under-specified word problems → `structurally_scoreable_only`.

**Confirmed gaps — matching the matrix's own confirmed-gap list, honestly preserved, not
fabricated:**

- **`time_and_calendars`** — no duration/calendar-arithmetic derivation method exists. A
  time/calendar question naturally falls through every derivation method to
  `structurally_scoreable_only` (never a fabricated pass) but is not independently proven correct.
  Matches the matrix's own confirmed gap exactly (no real fixture exists anywhere in the repo/harvest
  for this category, per the matrix's `gapNote`).
- **`angles_and_geometry`** (angle classification, shape-property checks from coordinates) and
  **`coordinates`** (point/distance lookup against a `coordinate_grid` visual) — no derivation method
  exists; both fall to `structurally_scoreable_only`. Matches the matrix's own confirmed gaps.
- **`drag_drop`, `hotspot`, `label_diagram`** — classified `unsupported` by design (see "Review-required
  and unsupported categories"), matching the matrix's own confirmed gaps for these three categories.
  **Additional, gate-specific reachability gap**: none of these three types — nor `essay` — can
  currently reach `verifyCandidateCorrectness` end-to-end at all, because the shared
  `candidateQuestionSchema` this gate correctly reuses (`ingestion/candidate-question.ts`'s
  `HARVEST_SUPPORTED_QUESTION_TYPES`) does not accept them; a candidate of any of these four types
  cannot reach `structural_validation_passed` today regardless of which gate is asked (see Mission
  2B's own "Known limitations" for the identical constraint). This gate's classification logic for
  them is written, tested directly against a real `Question` object (bypassing only the
  ingestion-adapter type restriction, never the production schema), and forward-compatible for
  whenever that adapter-level restriction is lifted — see `isUnsupportedInteractionCategory`'s doc
  comment and the three targeted tests in `correctness-verify-candidate.test.ts`
  ("classifies hotspot/drag_drop as an unsupported correctness category").
- **Pie-chart proportion-of-whole** (segment ÷ sum of all segments) — no derivation method
  implements this specific pie-chart sub-case; a pie-chart question needing it falls to
  `structurally_scoreable_only`. `bar_chart`/`line_graph`/`pie_chart` extreme-value lookup *is*
  implemented and tested.
- **Unit conversion** — no derivation method converts between units (e.g. cm ↔ m); a measurement
  question requiring conversion falls to `structurally_scoreable_only` rather than assuming a
  conversion factor.

**Deliberately not separately tested** (already covered upstream, redundant to re-prove without
mocking `scoreQuestion` — mirroring Mission 2B's identical "Known limitations" entry for its own
scoring-compatibility check): "declared response does not score full marks" in isolation — by the time
a candidate reaches this gate, `checkScoringCompatibility` (Mission 2B) has already proven the declared
canonical response scores `"correct"`; manufacturing an independent failure here without mocking the
real scoring engine (which this mission's scope forbids) is not meaningfully possible.

## Separation from semantic review

This gate never performs semantic AI review, originality detection, difficulty estimation, staging, or
publication — no code for any of those five exists anywhere in `src/features/question-factory/correctness/`.
`requires_independent_semantic_review` is a *classification*, not a review: this gate never reads or
scores meaning, never calls an external model, and never approves a semantic-objective candidate on its
own — it only ever routes such a candidate to `quarantined`, exactly the same "rule-based review is a
safety net, never sufficient proof" policy `canAdvanceToSemanticReviewPassed` already enforces one gate
later. Explanation-consistency checking is explicitly bounded to *supporting* evidence (an explicit,
narrow numeric-claim pattern) and is never treated as, or claimed to be, a semantic-quality assessment
of the explanation's prose.

## Confirmation: no harvested content imported, no production content touched

- The 302 harvested questions were **not** imported — every fixture in `correctness-fixtures.ts` and
  every test file is a small, hand-written synthetic object, clearly marked as such in this document
  and in the fixtures file's own header comment.
- `src/content/questions/` was not read, written, or referenced by any file in this mission.
- `npm run validate:questions` confirms the production bank remains exactly 100 questions and all are
  valid; `npm run check:answers` confirms 0 correctness failures — both re-run after this mission's
  changes, unchanged in outcome from before it.
- Every candidate this mission's tests move through `correctness_check_passed`/`rejected`/`quarantined`
  is written only under a temporary, per-test `FsFactoryRepository` root (`mkdtemp`), never under
  `content/question-factory/` in the real repository working tree.
- No candidate produced or moved by this gate is ever created, moved, or observed at any lifecycle
  state other than `structural_validation_passed` (its required entry state), `correctness_check_passed`,
  `rejected`, or `quarantined` — nothing in this module constructs, or is capable of constructing,
  `semantic_review_passed`, `originality_review_passed`, `difficulty_review_passed`, `staged`, or
  `published`.
