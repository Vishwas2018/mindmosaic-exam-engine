# Scholarship Year 6 remediation: status for Vish's sign-off (17 Oct 2026)

Branch `fix/scholarship-remediation` (on `feat/scholarship-nr-attestation`, current `origin/dev`). Nothing is published, enabled or merged. No decision is recorded; the sheets in `sheets/` are blank for the human reviewer.

## What changed
- `remediation-ledger.json`: per-item record against the first-pass commit `ec9718eb` (status, label change, first-pass finding, action taken).
- Reading: all four passages corrected (red-mangrove stilt roots vs grey-mangrove pneumatophores; a one-minute clock error is up to 15 nautical miles, not "a few seconds"; lunar-distance timeline; crime-and-lighting overclaim; an unverifiable place-name nickname; tautology; Indigenous knowledge in the present tense).
- 43 flagged items all handled, none cut: NR 17 (1 replaced), VR 9 plus the 5 stock puzzles replaced (001, 006, 009, 024, 025), Reading 10, Maths 7 (plus 6 further fixes).
- Difficulty labels recalibrated. Before: NR and VR all medium. After: NR 10 easy / 29 medium / 1 challenging; VR 18 / 24 / 3. Reading: 17 easy / 18 medium (was 8 / 20 / 7 challenging). Maths: 16 easy / 24 medium. The sets skew easy for scholarship level; that is now stated honestly in the labels, not fixed.
- Maths: 40 first-party recompute solvers (`scholarship-maths-solvers.ts`), hash-bound through `verifyFirstPartyScholarshipAttestation`, with a unit-aware option comparator (the old comparator failed closed on `$`, `°C`, `m²`). `npx tsx scripts/report-scholarship-attestation.mts`: 60/60 attested (20 NR + 40 Maths), 0 disagreements between recompute and key. These solvers were written by the same author as the revised content; they are independent of the draft explanations and sidecars, not of the author.

## Independent review: NOT done to the standard asked
The only different-family model usable without sending content off-machine is `gemma:7b` (local, CPU). It is **not** a review of record. Against the 99 keys a machine verifier proves (NR 1-40, Maths 1-40, VR 27-45) it agreed with only 28/99 (28%) and strongly favours option "a". Overall it agreed with 75/160 (47%); on the 61 keys with no machine proof 47/61 (77%), which is not usable as evidence either. Opus (first pass) agreed with every key on the 90 items whose content is unchanged; gemma agreed on 30 of those 90.

So: for the 70 revised, replaced or passage-corrected items there is **no valid blind review** (the first pass saw different content), and for VR 001-026 and all Reading there is no machine proof. Those need a competent second-family reviewer or the human reviewer's own judgement. Files: `error-rate-probe-gemma7b/` (raw output, `analysis.txt`), `sheets/` (blank decision CSVs with fresh content hashes, HTML views, reviewer notes with the probe clearly labelled).

## Known issues
- Staging id bug: `stage-scholarship-candidates.mts` stages `scholarship-candidate-y6-…` ids but both solver registries are keyed by draft id, so staged items would fail the gate (`missing_first_party_solver`). Same bug as AMC; to rebase on the AMC staging fix when it lands. Not changed here.
- Maths attestation is scoped to `scholarship-y6-maths-NNN` ids so the existing PR #52 candidate-solverParams path for other scholarship numeracy is untouched.
- One existing test line changed: the NR attestation test compared the computed value to the option text as a string; nr-023 now has `$` options, so it compares number plus unit with `optionMatchesQuantity` (same strictness).
- Maths 035 and 040 still carry `maths-probability` tags although they are Venn and counting items; `maths-*` skills are not in the taxonomy registry.
- Verification: typecheck clean; draft validator passes; question-factory and publish-gate suites pass (2580 tests). Full unit run had one unrelated failure (`stripe-webhook-route`, no `.env.local` in a worktree, same on the base branch). Not run: build, `test:rls`, e2e.
