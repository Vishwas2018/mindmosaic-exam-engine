# Solver coverage and missing bindings for the seven Class A candidates

**Status:** analysis for the PROPOSED Phase 2a policy. No code is changed by this PR.
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

**Recommendation: defer `vr-032` unless the owner wants the non-numeric category built.** It is one item, and extending the attestation contract to a new shape is a larger engineering change than the rest of the Class A work combined. Deferring it reduces the Class A scope to six candidates, five of which need no new solver work at all.

## 4. Consequence for the policy

| Scope option | Candidates | Solver work required |
|---|---|---|
| Five strongest | `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014` | none |
| Plus `nr-001` | six | one registry entry and one attested skill |
| Plus `vr-032` | seven | the above, plus a new non-numeric attestation category |

The ADR proposes the seven-item scope the owner directed. This analysis records that two of those seven have an unmet precondition, which is a blocker for those two candidates specifically, not for the route.

## 5. What was verified, and how

- Registry contents and scope predicates read from `scholarship-attestation.ts` and `scholarship-maths-solvers.ts` on this branch.
- Scope membership computed per candidate from the committed PR #73 metadata (`subject`, `skill`, `examStyle`, id pattern), not assumed from naming.
- Sidecar allow-list read from `legacy-import/bindings.ts`.
- Sidecar packet entries and their `targetOption` values read from the PR #73 drafts; all agree with the declared keys.
- Preflight `transformation` values cross-checked against the Phase 1 preflight: `solver_sidecar` for exactly `vr-032` and `nr-001`, `none` for the rest.

No solver was added, modified or executed against production content as part of this analysis.
