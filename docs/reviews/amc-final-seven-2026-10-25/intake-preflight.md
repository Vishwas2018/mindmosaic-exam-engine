# AMC final seven: taxonomy and intake preflight

**Baseline:** `origin/dev` `9b207d787b9815fb3301d18785886ba96db202b5` (the PR #76 merge).
**Status:** read-only findings and non-mutating tooling. **No question metadata was changed, nothing was ingested, staged, approved or published, and no approval is recorded.** Every classification below is a proposal that needs an owner decision.

## 1. Verified failures (reproduced independently)

Run on the merged source with the repository's own functions.

| Question | Draft strand | Draft skill | `skillTaxonomyRegistry.resolveOrThrow` | Consequence |
|---|---|---|---|---|
| `y5-006` | Measurement & Geometry | Use a simple scale | **throws** "Unknown skill label" | `amcIntakeBlueprint` throws, so a blueprint cannot be built; the structural taxonomy check would reject the candidate (`unknown_taxonomy_skill`) |
| `y5-028` | Patterns & Algebra | Enumerate whole-number solutions | **throws** | as above |

Neither label appears in `src/features/question-factory/taxonomy/` (ids or aliases), so this is not a spelling variant. The other 58 drafts resolve, pass `checkTaxonomy` (year, subject, strand, exam style) and build a valid blueprint.

Two further blockers found by the same preflight (they were not known before):

| Question | Finding |
|---|---|
| `y3-016` | The committed blueprint `amc-y3-016-seed-001.json` has `difficulty: medium` and `reasoningSteps: 3`; the current draft is `easy`, which derives `1`. The intake never overwrites a blueprint, so it stops |
| `y5-019` | The committed blueprint has `difficulty: easy`, `reasoningSteps: 1`; the draft is `medium`, which derives `3` |

Both blueprints predate the label changes of 17 to 18 October. Across all 60 drafts: 55 blueprints equal the derived ones, 2 are stale (these), 1 is absent (`y3-014`), 2 cannot be built (the taxonomy failures). Regenerating a blueprint does not change a question hash, but each one tracks a **label that is still an owner decision** (`y3-016` easy or medium, `y5-019` medium), so it should be regenerated only after that decision.

### Correction to earlier documents

Earlier PR #76 text and the human-review handoff packet said the **strand** is shown to children. It is not. The exam page header and the results page show `Grade N · subject · skill · difficulty`; the strand is used by the taxonomy check and by admin reporting only (`src/app/exam/page.tsx` lines 478 to 484; `src/app/results/page.tsx`). The skill is child-visible. This was corrected in the PR #76 README and decision pack in this branch. The handoff packet (outside the repository) still says it and needs the replacement described in section 6.

### Two strand vocabularies

Taxonomy entries (`amc-entries.ts`) use their own strand names. Every Year 5 draft uses one of: Logic & Problem-Solving, Measurement & Geometry, Number & Arithmetic, Patterns & Algebra, Statistics & Probability. The subject registry (`subject-registry.ts`) uses Geometry & Measurement and Statistics & Chance. `checkTaxonomy` requires `metadata.strand` to equal the **taxonomy entry's** strand, so the registry's names cannot be used unless a new entry declares them.

**Compatibility, verified.** The subject registry's strand list is not enforced at intake or publication. Of the 53 served AMC questions, 9 use "Measurement & Geometry" and 2 use "Statistics & Probability", neither of which the subject registry lists (`isKnownStrandLabel` is false for both). The only strand-filter consumers are the language exam patterns (`strandIn`), none of which touch AMC. So `y5-006` under the taxonomy's own "Measurement & Geometry" follows existing practice and does not conflict with the learner-facing registry.

## 2. Options for each question

"Existing registered" means an entry the taxonomy resolves today. The two skills you proposed are registered only in the subject registry (a UI list), **not** in the question-factory taxonomy, so adopting either still needs a new taxonomy entry.

### `y5-006` (map scale: 1 cm represents 5 km, 7 cm apart)

| | Strand and skill | Taxonomy | Child-visible skill | Hashes | Review consequence |
|---|---|---|---|---|---|
| **A. Keep the label, register it** | Measurement & Geometry, "Use a simple scale" | New Year 5 entry `amc.use-a-simple-scale`, strand Measurement & Geometry | "Use a simple scale" (unchanged) | **Unchanged** | The new entry is a code change that needs review; the question text and label are not re-reviewed |
| **B. Your proposal** | Geometry & Measurement, "Measurement units and scale drawings" | Not in the taxonomy; needs a new Year 5 entry declaring that strand name | "Measurement units and scale drawings" | **Change** (below) | A new entry plus a changed label; breaks the Year 5 strand naming convention (no other Year 5 item uses "Geometry & Measurement") |
| C. Re-use an existing Year 5 skill | none fits | n/a | n/a | n/a | "Apply a ratio to a total" (Number & Arithmetic) is about sharing a total, not scale. Aliasing it would map a semantically different skill, which the registry's rules forbid |

Educational accuracy: "Use a simple scale" is the most precise of the three. "Measurement units and scale drawings" is broader and "units" suggests unit conversion, which this question does not need. I did not find a Victorian Curriculum V2.0 map-scale descriptor, so the curriculum link is unconfirmed.

**Option A verified in memory.** A new Year 5 entry `amc.use-a-simple-scale` (alias "Use a simple scale", Measurement & Geometry, `multiple_choice`) collides with no existing id or alias; the registry's own validation passes on the modified list; the unchanged draft then resolves, passes `checkTaxonomy` and builds a valid blueprint; and its source, content and manifest hashes stay exactly `93b739d8…57f0`, `5e813e50…8b02e`, `fca56d70…3709d`, equal to the committed review-source row. After the entry, the only remaining `y5-006` blockers are the code exclusion and the missing human approval. The sketch registers only `easy` (the draft's difficulty); a wider set is the owner's call.

Hashes under B (source, content, manifest): `3e0e30b4…3c8e`, `1e064cec…4352`, `268c4c3b…4ab0`. Current: `93b739d8…57f0`, `5e813e50…8b02e`, `fca56d70…3709d`.

### `y5-028` (bags of 3 and 5, exactly 30 counters)

| | Strand and skill | Taxonomy | Child-visible skill | Hashes | Review consequence |
|---|---|---|---|---|---|
| **A. Keep the label, register it** | Patterns & Algebra, "Enumerate whole-number solutions" | New Year 5 entry | "Enumerate whole-number solutions" | **Unchanged** | Leaves the algebraic-sounding label that was already flagged as a reservation |
| **B. Your proposal** | Statistics & Chance, "Combinatorics and systematic counting" | Not in the taxonomy; needs a new entry declaring that strand name | "Combinatorics and systematic counting" | **Change** | "Combinatorics" is adult jargon for a Year 5 child; the strand name departs from the Year 5 convention |
| **C. Existing Year 5 skill** | Logic & Problem-Solving, "Systematic counting", **number entry** | Skill and strand **resolve** (`amc.systematic-counting`, Year 5, amc_style) and pass `checkTaxonomy`, **but the entry recommends only `multiple_choice`, and `y5-028` is `number_entry`, so `validateBlueprint` rejects it. A taxonomy change is required** (section 2.1) | "Systematic counting" | **Change** | A reviewed taxonomy change, then the same hash/exclusion/approval steps as any other option. One published item (`y5-015`, multiple choice) already uses the skill |

Hashes under B: `7207400e…e513a`, `9387c7a5…d47c`, `affa6398…f2b3`. Under C: `92111161…809b`, `4ca0370d…7728`, `f00249b6…6592`. Current: `5743cf39…298a`, `28a4e4cc…f3ab`, `1f5d2720…5ce2`.

Educational accuracy: the question asks the child to count combinations systematically; "Systematic counting" says that in child-readable words. The answer is reached by checking each number of 5-bags for divisibility by 3, which is also factor and multiple reasoning, so no single label is perfect.

### Recommendation (the owner decides)

- **`y5-006`: option A.** It keeps the most accurate label and the hashes, and adds one reviewed taxonomy entry.
- **`y5-028`: classification C ("Systematic counting"), with taxonomy remedy A (section 2.1).** The label is child-readable and already registered, and it addresses the earlier "reads algebraic" reservation. **An earlier version of this document said option C needed no taxonomy change. That was wrong:** the skill resolves, but its entry does not recommend `number_entry`, and no registered entry was demonstrated to support number entry under that label. The narrowest safe fix is one reviewed edit to one existing entry (add `number_entry` to `amc.systematic-counting`). The three hashes change with the classification; no human has reviewed `y5-028` yet.

The alternatives are listed because the choice is educational. Do not alias a different skill to make validation pass, and do not bypass `validateBlueprint`.

### 2.1 y5-028 Option C: taxonomy remedies (reproduced and tested)

**Reproduction.** On an in-memory copy of `roadmap-amc-y5-028` with strand "Logic & Problem-Solving" and skill "Systematic counting" (the real draft is untouched):

| Step | Result |
|---|---|
| `skillTaxonomyRegistry.resolve("Systematic counting")` | `amc.systematic-counting` |
| `checkTaxonomy` (year, subject, strand, style) | no issues |
| `amcIntakeBlueprint` → `validateBlueprint` | **fails:** `question_type_not_recommended_for_skill`: "does not recommend question type 'number_entry'" |
| Entry's `recommendedQuestionTypes` | `["multiple_choice"]` only |

`checkTaxonomy` never looks at the question type, so taxonomy resolution alone cannot show this. The preflight now reports it as its own blocker, `question_type_not_recommended`, in addition to `blueprint_unbuildable`. Other registered AMC number-entry skills each have a dedicated, number-entry-only entry (for example `amc.systematically-count-rectangles`).

| | A. Add `number_entry` to `amc.systematic-counting` | B. Register a new, accurately named number-entry skill | C. Keep the label "Systematic counting" on a new matching entry |
|---|---|---|---|
| Educational accuracy | Good. Counting combinations by entering the total is the same skill whether the answer is chosen or typed | Good if the label is accurate, but any real label other than "Systematic counting" is a different child-visible label from classification C, and "Combinatorics" is adult jargon | Same skill label as A |
| Registrable? | Yes | Yes | **No.** The alias "Systematic counting" is owned by the existing entry; the registry rejects a second claim (alias collision). It would first need the existing alias removed, which breaks `y5-015` resolution |
| Effect on published `y5-015` | None: still `multiple_choice`, same entry, same committed blueprint (tested) | None: its entry is untouched | n/a |
| Code change | One array in `amc-entries.ts` | One new entry in `amc-entries.ts`; the owner names the skill | n/a without removing an alias |
| Side effect | The batch planner's round-robin would alternate `multiple_choice` and `number_entry` for this skill in future generated blueprints | None on existing entries | n/a |
| Hashes | Question hashes are independent of the taxonomy (nothing in hashing imports it). The y5-028 hashes change only because the classification label changes: `9211116d…809b`, `4ca0370d…7728`, `f00249b6…6592` | Depend on the owner-chosen label; not computed here | n/a |
| Tests | New in-memory scenario tests (below) plus the taxonomy and blueprint suites | The same, with a new registry entry | The registry-collision test |

A second reading of "retain the original skill" is the draft's own label "Enumerate whole-number solutions" with a new number-entry entry in Patterns & Algebra. That leaves all hashes unchanged (the pack's option A) but keeps the algebraic-sounding label already flagged as a reservation.

**Recommendation (owner decides): remedy A.** It is the narrowest change that makes classification C valid: one entry, no new IDs or aliases, no change to any published question, hash, manifest or blueprint. Remedy B is the convention-faithful alternative if the owner prefers one skill entry per interaction type and is willing to pick a new child-visible label.

**Verified in memory only** (`amc-final-seven-taxonomy-options.test.ts`; the registry's own validation and the real `validateBlueprint` run on each modified list):

| Scenario | Option C taxonomy/blueprint result |
|---|---|
| Current taxonomy | `question_type_not_recommended` and `blueprint_unbuildable` |
| Remedy A applied | Both clear. What remains for `y5-028`: stale registry binding and pinned attestation (hashes changed with the label), the code exclusion, and the missing human approval |
| Remedy B applied | Option C's own label still fails; a differently named skill builds |
| Remedy C | The registry refuses to load (alias collision) |

### 2.2 Five separate readiness questions

They are different checks and must not be read as one "ready":

| Question | Checked by | y5-006 today | y5-028 today (as drafted) | y5-028 with Option C + remedy A |
|---|---|---|---|---|
| Taxonomy resolution | `skillTaxonomyRegistry.resolve` + `checkTaxonomy` | No: label unregistered | No: label unregistered | Yes |
| Question-type compatibility | entry's `recommendedQuestionTypes` | n/a until resolved | n/a until resolved | Yes only after remedy A |
| Blueprint generation | `amcIntakeBlueprint` → `validateBlueprint` | No | No | Yes |
| Blueprint freshness | disk blueprint equals derived | n/a: none on disk | n/a: none on disk | n/a: none on disk |
| Approval and publication readiness | hashes re-pinned, exclusion lifted, human approval | No (exclusion, approval) | No | No (re-pin, exclusion, approval) |

Blueprint freshness is a live problem only for `y3-016` and `y5-019`, whose committed blueprints are stale (section 1). Passing the first four rows is necessary for intake and says nothing about approval or publication.

## 3. What each change touches

| Item | A (register) | Relabel (B or C) |
|---|---|---|
| Question metadata in the draft file | none | `strand` and `skill` |
| Taxonomy entry | add one (A, and B) | B: add one. C (classification): edit `amc.systematic-counting` to add `number_entry` for `y5-028` only |
| `content/review-sources/amc/y5.json` row | none | source and content hashes |
| `AMC_ATTESTED_CONTENT_HASHES` pin | none | re-pin with `scripts/amc-rebind-pins.mts <id>` (solver then re-checked) |
| `revision-loop-amc.csv` row | none | hash columns |
| Manifest hash | none | new (derived from the registry row) |
| Existing approved content | unaffected (a new unique entry id cannot collide; `validateTaxonomyEntries` checks) | unaffected: only `y5-006` and `y5-028` change |
| Tests | taxonomy tests, `amc-taxonomy.test.ts` (it hard-codes 57 reviewed drafts and the exclusion set) | the same, plus hash pins |
| Reviewer packet | skill unchanged; regenerate only for the strand correction | regenerate (section 6) |

## 4. The seven-ID intake preflight

`scripts/lib/amc-final-seven-intake.mts` and `scripts/amc-final-seven-intake-preflight.mts`. **Read-only**: neither imports a write, spawn or network API (a test pins that), and the CLI has no execute mode (`--execute` and unknown flags exit 2).

```
npx tsx scripts/amc-final-seven-intake-preflight.mts [--ids a,b] [--expected-hashes <manifest.csv>] [--all-drafts] [--json]
```

Exit 0 all requested questions ready, 3 at least one blocker, 2 invalid arguments.

It evaluates only the seven allow-listed IDs and refuses anything else or any duplicate. Per question it checks, and any failure is a named blocker, never a warning:

1. the draft exists, parses, and equals its committed registry row (revision, source hash, content hash);
2. an optional external pin (the handoff manifest CSV) matches revision and all three hashes;
3. the first-party attestation still agrees (pinned snapshot and the ID-keyed solver);
4. the skill resolves by id or alias, year, subject, strand and exam style match the entry, and the entry recommends the question's type (`question_type_not_recommended` otherwise);
5. the intake blueprint can be derived, and an existing file equals it exactly (never overwritten);
6. it is not already in the served bank, a published manifest, or any question-factory file;
7. its code exclusion is lifted;
8. a human approval record exists and binds this exact revision, content hash and manifest hash.

`describeFinalSevenWrites` describes, but does not perform, the blueprint and inbox files a later authorised intake would create. It throws unless every requested question is ready, and its plan contains no staging, publication, approval or manifest write. The historical `scripts/ingest-amc-reviewed-drafts.mts` (exactly 57 targets) is untouched.

### Result today (dry run, 0 writes)

| Question | Blockers |
|---|---|
| `y3-005` | approval missing |
| `y3-014` | exclusion active; approval missing (blueprint would be created) |
| `y3-016` | stale blueprint; approval missing |
| `y3-026` | approval missing |
| `y5-006` | skill unresolvable; blueprint unbuildable; exclusion active; approval missing |
| `y5-019` | stale blueprint; approval missing |
| `y5-028` | skill unresolvable; blueprint unbuildable; exclusion active; approval missing |

None is already published or ingested. Over all 60 drafts, taxonomy and blueprint readiness is 58 of 60. These results describe the drafts as they are; they are unchanged by this revision of the document, which adds no content or taxonomy change.

## 5. Evidence that published material is unchanged

Against `origin/dev`: this branch adds the two scripts, one test file and this document, and edits two sentences in the PR #76 README and decision pack. Published manifests, approval records, the generated AMC bank, draft files, review-source files and the exclusion files have no diff. The served AMC bank still holds 53 questions (26 Year 3, 27 Year 5) and none of the seven.

## 6. Refreshing the human-review packet

The packet is outside the repository (`C:\tmp\amc-human-review-handoff-2026-10-25\`, packet code `16B70B282004`). **Packet v2 remains an internal provisional document and has not been regenerated.** Packet v3 is generated only after the owner selects the classifications and a separately authorised change establishes the final hashes. It is built from the hashes, so **any** metadata change makes the old packet stale.

Which files change:

| File | After a metadata change | Even with no metadata change |
|---|---|---|
| 1 reviewer packet | The changed question's skill line and the packet code in every footer | Cover and each page say the strand is shown to students; that is wrong |
| 2 answer-key companion | Hashes for the changed question; packet code | none |
| 3 reviewer declaration | Packet code only | none |
| 4 owner decision sheet | Hash prefix for the changed question; packet code | none |
| 5 preflight checklist | Packet code; facts | New findings (stale blueprints, strand not visible) |
| 6 hash manifest | Rows for the changed questions | none |

The packet code is derived from all seven content hashes, so it changes if any one does. No reviewer decision or declaration exists, so nothing human is being overwritten. The original is preserved; a versioned proposal (v2) is held beside it.

Sequence after the owner decides:

1. Owner decides the classification for `y5-006` and `y5-028` (and any `y3-016` / `y5-019` label change).
2. A separate authorised PR applies it: taxonomy entry or draft metadata, re-pin, registry and CSV rows. Run the intake preflight with `--all-drafts`; both unresolved skills must clear.
3. Regenerate the stale blueprints only if the label decisions require it, in the same governed change.
4. Recompute the seven hashes with the repository code and regenerate the packet set as v3. Check the footer packet code on every page.
5. Only then send the answer-blind packet to the nominated reviewer. A reviewer who already received v1 must not be asked to review the changed question from v1.
6. Re-run the preflight with `--expected-hashes` pointing at the new manifest CSV.

## 7. Remaining owner decisions

1. Classification of `y5-006` (A or B) and `y5-028` (A, B or C): **owner decision, left blank**.
1a. For `y5-028` option C (or any other label), which taxonomy remedy (A, B) in section 2.1: **owner decision, left blank**.
2. Whether the new taxonomy entry, if any, is added in the same governed PR that lifts the exclusions.
3. The `y3-016` and `y5-019` blueprints: regenerate after the label decisions.
4. All decisions already listed in the handoff README (reviewer, owner decisions, approver identity, exclusion lift, pacing, launch wording).

## Appendix: full hashes of every alternative

Computed with `buildAmcReviewTarget` on in-memory copies of the draft; no file was changed. Source = `sourceQuestionHash`, content = `contentHash`, manifest = `sourceManifestHash`.

| Question | Option | Source | Content | Manifest |
|---|---|---|---|---|
| `y5-006` | current (A, unchanged) | `93b739d8908781b715ed3f7b884deff7c96a079309e2940bb51555bfecc357f0` | `5e813e503db1533f1058b8f0db776fccc7979eba852dc167619acffe1238b02e` | `fca56d70fea3730fd4dfb72ed73de60faabeb99479ab90fd9dd02f2a8953709d` |
| `y5-006` | B | `3e0e30b44518fadfcfc8e485c1b7960d7e77d137dbad0f68e9f2cb2a50523c8e` | `1e064cec9b079499983931f1e0941f0cbd2184aeeb29facd49313ed102c64352` | `268c4c3bb43464cc65e66049bfc5907cf11d710bf1fafdb0ba210118670f4ab0` |
| `y5-028` | current (A, unchanged) | `5743cf39b78815a617fda04d161c6e38f5724ba490dcef28689faa4b3f1a298a` | `28a4e4cc067cbfc7f47ede048c804ff6bf234906c64924e8f8b89604d99af3ab` | `1f5d27204b5909c21e4e39293bd8e805f8cc1f7e35c50f5c8dc24dfab5ed5ce2` |
| `y5-028` | B | `7207400ed471810a7afcdc6892a8313832858443fe05d58219a53348896e513a` | `9387c7a56336a6384b615eb55c9d332158e3983aee687c4f1022ad08d802d47c` | `affa63980123dac2cbaf9e6bbdda8c026c1eac4fa24db853ced2c64dfef3f2b3` |
| `y5-028` | C | `9211116d5f5fc502e48bdb7005bcb6a150ac5c2a017001245081b78e4f3b809b` | `4ca0370da7e1bc2e6949ed4df1f4c1156175e7125028727e683da01f56747728` | `f00249b651f4a93e2d4f87f359ff5111e8d8076000a19c5ff23c6d0e8f5f6592` |
