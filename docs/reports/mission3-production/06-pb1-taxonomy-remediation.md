# PB1 Taxonomy and Provenance Remediation

Status: **implemented**. A tightly bounded taxonomy/provenance remediation driven by the PB1 pilot-batch dry-run assessment (an offline, non-publication ingestion rehearsal run against an isolated worktree pinned to the Mission 3A baseline, `af4ba37f699d9a0cbf1f065dffe8c6766bfa6638`). PB1 itself is an artefact set held outside this repository (`C:\tmp\pb1-artefacts`); nothing from PB1 is imported, staged, or published here. This document records only the taxonomy and identity-alias-table changes.

## Why

PB1's real, isolated dry-run ingestion and structural validation (Mission 2B's `orchestrateStructuralValidation`, unmodified) surfaced 11 candidates rejected with `ambiguous_taxonomy_reference` or a since-corrected mapping defect. Case-by-case adjudication against the full 114-entry registry, the taxonomy's own harvest-inventory origin (`docs/reports/mission2-fixture-prep/01-harvest-inventory.md` — the registry is an empirically-derived inventory of skills already present in the production bank plus a legacy donor taxonomy, not a top-down curriculum design) and the Mission 2B structural-validation design doc found: 6 concepts genuinely absent from the registry under any subject/strand, 3 concepts present but missing an exam-style or year-level flag that is not pedagogically justified to withhold, and 1 candidate whose own grade assignment (not the taxonomy) was the defect (handled separately, in the PB1 artefact workspace only — see the PB1 correction round covering `pb1-g5-nap-lang-003`).

## 6 new entries

| ID | Strand | Year | Exam style | Why new, not nearby |
|---|---|---|---|---|
| `num.prod.chance.most-likely-outcome` | Chance (new strand) | [5] | naplan_style | No probability/chance/likelihood concept existed under any strand |
| `num.prod.number.place-value` | Number | [5] | naplan_style | No place-value concept existed under any strand |
| `num.prod.measurement.units-of-time` | Measurement | [3] | icas_style | `num.measurement.units`'s own curriculum note scopes it to length/mass/capacity, explicitly excluding time |
| `num.prod.number.multiplication-equal-groups` | Number | [3] | naplan_style | The only nearby entries (`num.prod.number.multiples`, `num.number.multiples`) are multiple-*identification* skills, not multiplication computation — a genuinely different concept |
| `read.prod.inference.inferring-from-a-narrative` | Inference | [5] | icas_style | The only ICAS/Y5 inference entry is information-text-scoped; the only narrative-inference entry is NAPLAN-only and scoped specifically to character motivation, not general narrative inference |
| `lang.prod.grammar.regular-plurals` | Grammar | [3] | naplan_style | Both existing plural entries are explicitly for *irregular* plurals; regular -s/-es/-ies formation is a distinct rule |

Each is filed under the registry's own established strand conventions for its neighbours (e.g. plurals under "Grammar", not "Spelling", matching the existing irregular-plural entries), not a new ad hoc taxonomy.

## 3 existing-entry expansions

| Entry | Change | Why justified (not "broaden to make PB1 pass") |
|---|---|---|
| `num.fractions.equivalent` | + `naplan_style` | Equivalent-fraction recognition is standard Year 5 Australian Curriculum numeracy content in both exam styles; year level and concept unchanged |
| `num.number.multiples` | + `naplan_style`, + `true_false` question type | Multiples reasoning is standard Year 5 content in both exam styles, and is legitimately assessed via true/false items; concept unchanged |
| `num.prod.number.fractions-of-a-set` | + Year 5, + `challenging` difficulty | Direct precedent already in this registry: `num.prod.measurement.perimeter` spans `[3,5]` for the identical reason — same concept, harder numbers at the higher year |

## Provenance identity

Added one `IdentityAliasEntry` to `config/identity-normalisation.ts` for `claude-fable-5` (aliases: `claude-fable-5`, `fable-5`, `claude fable 5`), mapping to `{provider: "anthropic", modelId: "claude-fable-5", modelFamily: "claude", interactionMode: "api"}`. Before this change, `claude-fable-5` had no representable identity: `--source claude` alone silently persisted `claude-sonnet-5` regardless of the true generator, and explicitly declaring `--model claude-fable-5` was refused outright (`source_identity_invalid`). This is the same shape as every other entry in the table — no redesign, no change to `identitiesAreIndependent`'s comparison logic.

## Blueprint compatibility

`blueprints/planner.ts` reads directly from `skillTaxonomyRegistry`; every new/expanded entry above is automatically blueprint-eligible with no planner code change, provided its `yearLevels`/`examStyles`/`subject`/`recommendedQuestionTypes` are populated (they are). Proven by `blueprint-planner.test.ts`'s "PB1 taxonomy remediation — new/expanded entries are blueprint-eligible" suite: each of the 9 touched entries plans at least one validator-clean blueprint.

## What this does not do

- Does not modify `src/content/`, the 100-question production bank, Supabase, staging, or publication.
- Does not import PB1 or any harvested content into this repository.
- Does not resolve `pb1-g5-nap-lang-003` by expanding the taxonomy — its own grade assignment was re-graded in the PB1 artefact workspace, not here.
- Does not begin Mission 3C implementation.
