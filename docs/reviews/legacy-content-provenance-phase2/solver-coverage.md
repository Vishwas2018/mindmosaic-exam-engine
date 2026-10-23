# Solver coverage and missing bindings for the deterministically recomputable candidates

**Status:** analysis for the PROPOSED Phase 2a policy. No code is changed by this PR.
**Scope outcome:** this analysis is what the owner's 2026-10-23 narrowing rests on. The initial engineering scope is the five candidates in the "first-party recompute" rows below; `nr-001` is conditional and `vr-032` is deferred.
**Code state examined:** this branch, which matches `dev` at `714ad64155b3ba3109695bf44c3d14ab7473da4c` for all files cited.

---

## 1. Two different mechanisms, with different evidential weight

The repository already has deterministic correctness machinery. It is important to the policy that these are not the same thing.

### 1.1 First-party recompute registry — strong

`verifyFirstPartyScholarshipAttestation` in `src/features/question-factory/correctness/scholarship-attestation.ts`. Its documented guardrails are exactly what the Class A route requires:

1. Hash-bound: content must hash to the supplied `expectedContentHash`.
2. **Candidate logic is never executed** — `solverParams` and any sidecar constraint strings are ignored.
3. Fails closed on out-of-scope item, missing solver, throwing solver, non-finite result, prompt numbers that differ from the solver's declared givens, ambiguous option match or key mismatch.

Each entry declares its own `givens` and an independent `solve` function; the gate re-reads the quantities from the prompt and refuses if they do not match the declared givens. This is a genuine independent recomputation and is already consumed by `publication/eligibility.ts` and `publication/assemble-published-bank.ts`.

Two registries exist:

- `SCHOLARSHIP_FIRST_PARTY_SOLVERS` — exactly `scholarship-y6-nr-021` … `nr-040`, scoped to `subject: numerical_reasoning` and skill in {`nr-arithmetical-reasoning`, `nr-logic-deduction-numbers`}.
- `SCHOLARSHIP_MATHS_FIRST_PARTY_SOLVERS` — `scholarship-y6-maths-001` … `maths-040`, scoped to `subject: numeracy`, `examStyle: scholarship_style`, skill prefix `maths-`.

### 1.2 Legacy-import solver sidecar — weaker

`src/features/question-factory/legacy-import/bindings.ts` attaches a solver sidecar to a candidate, producing `transformation: { kind: "solver_sidecar", sidecarHash }`. The allow-list is hard-coded:

```ts
const side = ["scholarship-y6-vr-032", "scholarship-y6-nr-001"].includes(row.id)
  ? packet.data.parameters?.[row.id] : null;
```

The sidecar's `solver` and `solverParams` come from the same PR #73 draft packet as the candidate. A recompute driven by those parameters partly restates the original author's model of the problem rather than deriving it independently. That is materially weaker than section 1.1, and the policy must not treat the two as interchangeable.

---

## 2. Coverage, candidate by candidate

| Candidate | Subject / skill | First-party registry | Sidecar bound | Correctness route today |
|---|---|---|---|---|
| `nr-022` | `numerical_reasoning` / `nr-arithmetical-reasoning` | **yes** (`SCHOLARSHIP_FIRST_PARTY_SOLVERS`) | packet entry present, not bound | **first-party recompute** |
| `nr-023` | `numerical_reasoning` / `nr-arithmetical-reasoning` | **yes** | packet entry present, not bound | **first-party recompute** |
| `maths-004` | `numeracy` / `maths-directed-numbers` | **yes** (`SCHOLARSHIP_MATHS_…`) | packet entry present, not bound | **first-party recompute** |
| `maths-007` | `numeracy` / `maths-percentages` | **yes** | packet entry present, not bound | **first-party recompute** |
| `maths-014` | `numeracy` / `maths-ratios-rates` | **yes** | packet entry present, not bound | **first-party recompute** |
| `nr-001` | `numerical_reasoning` / `nr-number-series` | **no** — registry starts at `nr-021`; skill not in `SCHOLARSHIP_ATTESTED_SKILLS` | yes | sidecar only |
| `vr-032` | `verbal_reasoning` / `vr-sentence-logic` | **no** — `isScholarshipAttestedItem` requires `numerical_reasoning` or maths | yes | sidecar only |

**Five of seven already satisfy the strongest form of the Class A correctness requirement, using machinery that exists and already runs in CI.**

## 3. The missing bindings

### 3.1 `nr-001` — number series

Out of scope for the attested-skills set, which covers only `nr-arithmetical-reasoning` and `nr-logic-deduction-numbers`. A `solveNumberSeries` implementation exists at `src/features/scholarship/solvers/number-series.ts`, but it is not wired into the first-party recompute registry.

To close: add `nr-number-series` to `SCHOLARSHIP_ATTESTED_SKILLS` and add an independent registry entry for `nr-001` declaring its own givens (`5, 11, 17, 23, 29`) and its own `solve`, so the recompute does not read the candidate's sidecar parameters. Expected derived option: `e` (35).

### 3.2 `vr-032` — sentence logic

Entirely outside the attestation scope, which admits only numerical reasoning and maths subjects. This item is propositional logic (modus tollens), which is deterministically decidable but is not numeric, so the existing registry shape — numeric `givens`, numeric `solve`, numeric option matching — does not fit it.

To close, a decision is needed first: either extend attestation with a non-numeric deterministic category whose recompute evaluates a truth table over the stated premises and matches an option by text rather than by quantity, or accept that `vr-032` cannot meet requirement 3.1 of the ADR and defer it with Class B.

**Recommendation: defer `vr-032` unless the owner wants the non-numeric category built.** It is one item, and extending the attestation contract to a new shape is a larger engineering change than the rest of the Class A work combined.

**Owner direction, 2026-10-23: deferred.** `vr-032` is held until a non-numeric deterministic attestation category is separately justified and independently reviewed. See `deferred-class-b-c-register.md` section 1.1.

## 3a. Prompt-to-solver interpretation review of the five in-scope candidates

Added on independent review finding P1-2, which required the five initial-scope questions to be checked for the same class of mismatch that `maths-014` exhibited: solver assumptions that the stem's language does not actually pin down.

**No question content is altered by this review.** It is an analysis of the gap between prose and solver, recorded so that the mandatory editorial check (specification section 4.2 component 4) has a starting point. It is **not** that check, and does not discharge it: that check requires a named, qualified reviewer, which this analysis is not.

### 3a.1 How the binding works, and where it is weak

`verifyFirstPartyScholarshipAttestation` guards the prompt only by set equality: it parses the numbers appearing in the stem and requires that set to equal the solver's declared `givens`. It then runs `entry.solve(entry.givens)`. Relational language — "three times as old", "an additional discount", "only two groups" — contributes no digits and is therefore never compared to anything. **The strength of the binding is proportional to how much of the problem's structure is carried by numbers in the stem.**

### 3a.2 Candidate by candidate

| Candidate | Declared givens | Structure carried by the stem's numbers | Structure hard-coded in the solver | Residual exposure |
|---|---|---|---|---|
| `nr-022` | `[8]` | the 8-year interval only | both ratios (3×, 2×), which sibling is older, and that the comparison is of future ages | **highest of the five** |
| `nr-023` | `[3, 2, 19, 2, 4, 18, 1]` | both equations' coefficients and totals, and the "1 notebook" target | the mapping of each number to notebooks, pens or dollars | low |
| `maths-004` | `[2228, 15, -15]` | the summit height, the stated depth and its signed form | that "difference" means summit − signed elevation | low |
| `maths-007` | `[160, 25, 10]` | price and both percentages | that the discounts apply sequentially, second off the sale price | low |
| `maths-014` | `[5, 3, 30]` | both ratio parts and the gap | that the two groups exhaust the club | low **since** `45b6cdab` |

### 3a.3 Findings

**`nr-022` — materially weaker binding than the other four. Flagged for the editorial check, not for content change.**

The stem is *"Marcus is currently three times as old as his sister Chloe. In 8 years, Marcus will be twice as old as Chloe will be then."* The solver declares `givens: [8]` and evaluates `3 × chloe + years === 2 × (chloe + years)`.

Every structural fact — the factor 3, the factor 2, the direction of the comparison — lives in the solver's expression and appears in the stem only as the words "three times" and "twice". The set-equality guard compares `{8}` to `{8}` and passes. A stem edited to read "four times as old" would still present `{8}`, so the guard would still pass and the solver would still return 8, which is then the wrong answer silently.

This is a **drift-detection weakness, not a correctness defect**: the committed stem and the solver do agree today, the key `e` (8) is correct, and the reconciliation confirms the external review derived the same answer. The exposure is that nothing mechanical would notice if they stopped agreeing. The editorial check must therefore affirm `nr-022`'s relational structure explicitly, and any future edit to its stem must be treated as invalidating the recompute even when the hash check happens to be satisfied.

**`maths-004` — one genuine internal guard worth recording.** Its solver asserts `signed !== -below → throw`, so a stem whose parenthesised `(-15 m)` contradicted its stated "15 metres below sea level" would fail closed rather than compute. This is the only one of the five that cross-checks two stated quantities against each other. The remaining interpretive assumption — that "difference in elevation" means `summit − signed` — is pinned adequately by the prose, though option `a` (2213 m) exists precisely to catch a student who subtracts 15 instead.

**`maths-007` — sequencing is pinned by the prose.** The solver applies 25% then 10% of the reduced price. The stem says *"an additional 10% discount off the sale price"*, which excludes the combined-35% reading that option `b` ($104) represents. Adequate as written; the editorial check should confirm the phrase survives any future edit.

**`nr-023` — strongest binding of the five.** Six of the seven declared givens appear as digits in the stem, including both equations in full. The residual assumption is only which coefficient belongs to notebooks and which to pens, and the stem states that directly.

**`maths-014` — adequate only because of the closure premise.** The exhaustiveness clause added in `45b6cdab` is doing the work that the solver's `(5 + 3) × unit` silently assumed. It must be preserved; removing it reopens the original defect without changing any hash the solver checks.

### 3a.4 Consequence

None of the five requires a content change, and none is proposed. Two points carry into the policy:

1. The editorial check in specification section 4.2 component 4 is mandatory for all five, and `nr-022` additionally requires explicit affirmation of its relational structure.
2. The claim "five of seven already satisfy the strongest form of the Class A correctness requirement" is true of the **numeric** requirement only. It was never a statement about interpretive soundness, and section 1.1 of this document should be read with that scope.

## 4. Consequence for the policy

| Scope option | Candidates | Solver work required |
|---|---|---|
| Five strongest | `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` | none |
| Plus `nr-001` | six | one registry entry and one attested skill |
| Plus `vr-032` | seven | the above, plus a new non-numeric attestation category |

**Owner direction, 2026-10-23.** The ADR now proposes the five-candidate initial engineering scope — the "Five strongest" row above, which requires no solver work. `nr-001` is policy-eligible but enters scope only on a genuine first-party registry entry **and** regression tests; `vr-032` is deferred pending separate justification of a non-numeric category.

Two notes for the implementer, because the gap between them is where this route could quietly weaken:

- A registry entry for `nr-001` that delegates to the existing `solveNumberSeries` using the candidate's sidecar `rule` is **not** a first-party recompute. It replays the original author's model of the problem, which is precisely what section 1.2 identifies as the weaker mechanism. The entry must declare its own givens (`5, 11, 17, 23, 29`) and its own `solve`, and derive option `e` (35) without reading the sidecar.
- The regression tests the owner requires must include the refusal cases, not only the passing one. A solver added to make a gate pass, tested only by that gate passing, is not evidence.

## 5. What was verified, and how

- Registry contents and scope predicates read from `scholarship-attestation.ts` and `scholarship-maths-solvers.ts` on this branch.
- Scope membership computed per candidate from the committed PR #73 metadata (`subject`, `skill`, `examStyle`, id pattern), not assumed from naming.
- Sidecar allow-list read from `legacy-import/bindings.ts`.
- Sidecar packet entries and their `targetOption` values read from the PR #73 drafts; all agree with the declared keys.
- Preflight `transformation` values cross-checked against the Phase 1 preflight: `solver_sidecar` for exactly `vr-032` and `nr-001`, `none` for the rest.

No solver was added, modified or executed against production content as part of this analysis.
