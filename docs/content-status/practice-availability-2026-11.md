# Practice availability audit — My Space & Practice Studio data dependencies

**Date:** 6 November 2026
**Scope:** read-only verification of every data dependency behind the My Space and
Practice Studio designs.
**Audited SHA:** `79441a12ba38b5e8fd35235c846428a1a50af485`
(`chore/family-beta-wp1-candidate-20261102`)
**Method:** selectors **executed** through the application's own modules. No figure
below is derived from counting source text. Anything not established is marked
**UNVERIFIED**.

---

## 0. Target selection and isolation

### Branch topology (local refs; see currency caveat)

| Ref | SHA | Date | Relationship |
|---|---|---|---|
| `origin/main` | `4e1d80ae2c84` | 2026-10-20 | production |
| `main` (local) | `47c11ba8bd24` | 2026-10-03 | **stale local copy**, 258 behind the candidate |
| `dev` = `origin/dev` | `17d8be2fcf81ab456980b24a65d4da0bc38950b2` | 2026-10-31 | in sync |
| **`chore/family-beta-wp1-candidate-20261102`** | **`79441a12ba38b5e8fd35235c846428a1a50af485`** | 2026-11-04 | **33 ahead / 0 behind `dev`**; `dev` is an ancestor; pushed to origin |
| `feat/family-beta-fixed-papers` | `5cfa3555c246` | 2026-11-03 | 18/0 vs dev — **subsumed** into WP1 (`c9a46dad`) |
| `chore/family-beta-content-20261103` | `23a7586b3247` | 2026-11-03 | 1/0 vs dev — **not** an ancestor of WP1, but the same change is in WP1 as `61faf679` (rebased). Redundant branch. |
| `chore/family-beta-auth-check-20261101` | `a9e427278191` | 2026-11-01 | 13/0 vs dev — superseded |
| `chore/family-beta-readiness-20261101` | `a9e427278191` | 2026-11-01 | identical SHA to auth-check |
| `content/icas-y5-science-depth` | `83ffe0f5db97` | — | **117 behind dev** — stale, branched from `3b85a102` |
| `fix/beta-hardening` | `c1e309955cdb` | — | **117 behind dev** — stale |

### Chosen target and why

**`79441a12ba38b5e8fd35235c846428a1a50af485`.**

1. It is the only branch named "candidate", and the only Family Beta branch pushed to
   origin — the shared, reviewable artefact.
2. `dev` is a strict ancestor (33 ahead / 0 behind), so it contains everything a fresh
   `origin/dev` branch would start from. Auditing it cannot understate `dev`.
3. **It changes the served bank.** `git diff dev..WP1` touches
   `src/content/questions/generated/batch-published.json`, a published manifest, and adds
   `src/server/family-beta-fixed-papers.ts` + `family-beta-pinned-data.json` (552 lines).
   An audit run on `dev` would describe a bank the beta does not serve.
4. The other candidates are either subsumed, redundant, or 117 commits stale.

**AGENTS.md tension, recorded:** rule 1 requires implementation worktrees off fresh
`origin/dev`. That governs *implementation*; this audit targets the integration candidate
because that is what the beta will serve. Any build branch arising from this report should
still be cut from `origin/dev`, which is an ancestor of the audited SHA.

### Isolation method — deviation from the brief, deliberate

`git worktree add` was **not** used. It writes an entry under `.git/worktrees/`, and the
Cowork device bridge cannot delete under `.git` — the entry would be unremovable from this
session, and `git worktree list` already shows ~70 prunable entries. Instead:

```bash
git archive 79441a12ba38b5e8fd35235c846428a1a50af485 | tar -x -C "$HOME/wp1-79441a12"
ln -s <repo>/node_modules "$HOME/wp1-79441a12/node_modules"
```

This yields the identical tree at the exact SHA with **zero writes to the repository**.
The extraction is outside every connected folder, so it is invisible to the working tree.
Provenance pinned at `$HOME/wp1-79441a12/.AUDIT_SHA`.

### Commands run

```bash
tsx scripts/audit-bank.mts          # the repo's own audit:bank — executed selectors
tsx scripts/_audit/avail.mts        # strand/topic/metadata/duration grouping (audit-only)
tsx scripts/_audit/catalogue.mts    # PROGRAMS x resolveProgramStatuses x bank
tsx scripts/_audit/years.mts        # direct per-year unique-id reconciliation
```

Runner: `node v22.23.4` with a Linux `tsx` in the bridge VM. The repo's own
`@esbuild/win32-x64` is Windows-only and unusable from the VM; the global `tsx` supplies
its own Linux esbuild. `tsconfig` `paths` (`@/* -> ./src/*`) resolve normally.

### Currency caveat — UNVERIFIED

`origin` is `git@github.com:...` (SSH). `git ls-remote` fails with
**`Host key verification failed`** from the bridge. `.git/FETCH_HEAD` is dated
**2026-11-04 23:19**. Every `origin/*` ref above is as-of that fetch. Whether GitHub has
moved since is **UNVERIFIED** from this session.

---

## 1. `getExamBank("practice")` — totals and drift

Executed via `scripts/audit-bank.mts` (which imports `@/server/exam-bank`, the same module
the app serves from) and confirmed independently by a direct per-year unique-id filter.

| Pool | `ExamBankId` | Questions | Unique ids |
|---|---|---|---|
| `questionBank` (curated) | `curated` | 1,005 | 1,005 |
| `factoryPublishedQuestions` | — | 596 | 596 |
| `publishedExamBank` | `published` | **1,601** | **1,601** |
| `practiceExamBank` | `practice` | **1,601** | **1,601** |

`practiceExamBank` **aliases** `publishedExamBank`. In `src/server/exam-bank.ts`,
`case "practice"` and `case "published"` both `return servedBank()` — identical.
The historical `practiceQuestions` seed pool has been **permanently deleted from the
repository**.

### Per-year reconciliation

| Year | Unique ids (direct filter) | Historical reference | Drift |
|---|---|---|---|
| Year 3 | **940** | 914 | **+26** |
| Year 5 | **661** | 634 | **+27** |
| **Total** | **1,601** | 1,548 | **+53** |

Sum of the per-year filter = 1,601 = bank length = unique-id count. **Reconciles exactly.**
The year × style × subject cross-cut also sums to 1,601 independently.

### Drift explained

The entire +53 is **AMC-style content landing in the served bank**: `amc_mathematics`
26 (Y3) + 27 (Y5) = 53, sourced 0 curated / 53 factory. Factory-published moved
543 → 596 = +53. Curated is unchanged at 1,005.

> **Numeric trap — do not conflate.** "1,548" now appears twice with different meanings:
> the *historical bank total*, and the *current count of questions awaiting human approval*
> (§8). They coincide because the 53 approved items are exactly the AMC additions:
> 1,601 − 53 = 1,548. Quoting one as the other would be a reporting error.

---

## 2. Counts by year, programme, subject, strand/topic

### Year × exam style × subject (executed)

| Subject | Year | Style | Questions | Distinct skills | With visual |
|---|---|---|---|---|---|
| numeracy | Y5 | naplan | 164 | 96 | 50.0% |
| numeracy | Y3 | naplan | 128 | 85 | 52.3% |
| numeracy | Y5 | icas | 112 | 90 | 24.1% |
| reading | Y5 | naplan | 106 | 66 | 8.5% |
| numeracy | Y3 | icas | 101 | 89 | 41.6% |
| reading | Y3 | icas | 101 | 67 | 1.0% |
| science | Y3 | icas | 99 | 90 | 30.3% |
| digital_technologies | Y3 | icas | 98 | 83 | 22.4% |
| spelling | Y3 | icas | 98 | 95 | 0.0% |
| reading | Y3 | naplan | 97 | 65 | 1.0% |
| language_conventions | Y3 | naplan | 96 | 82 | 0.0% |
| language_conventions | Y3 | icas | 94 | 90 | 0.0% |
| language_conventions | Y5 | naplan | 82 | 52 | 1.2% |
| reading | Y5 | icas | 51 | 37 | 0.0% |
| spelling | Y5 | icas | 45 | 45 | 0.0% |
| language_conventions | Y5 | icas | 37 | 30 | 0.0% |
| digital_technologies | Y5 | icas | 35 | **1** | 22.9% |
| amc_mathematics | Y5 | amc | 27 | 27 | 0.0% |
| amc_mathematics | Y3 | amc | 26 | 21 | 0.0% |
| writing | Y3/Y5 | naplan/icas | 1 each (4 total) | 1 | 0.0% |
| **TOTAL** | | | **1,601** | 1,176 | 18.1% |

### The identifiers Practice Studio would actually group on

| Grouping | Groups | Pass ≥ 5 questions | Below | Distinct labels |
|---|---|---|---|---|
| year ∣ style ∣ subject ∣ **strand** | 141 | **95** | 46 | **81** |
| year ∣ style ∣ subject ∣ **topic** | 754 | **62** | **692** | **622** |

**Design implication — the topic picker as drawn is unbuildable.** 622 distinct
`metadata.topic` values across 1,601 questions is ~2.6 questions per topic; only 62 of 754
topic groups reach 5. A topic-level picker would show almost nothing selectable.
Practice Studio must group on **strand**, where 95 of 141 groups are viable.

`src/server/exam-bank.ts` states a strand is "the broad curriculum grouping (24 of them)".
**That comment is wrong against the data: there are 81 distinct strand labels.**

### Missing metadata

**None.** Across all 1,601 served questions, `subject`, `strand`, `topic`, `skill`,
`difficulty` and `estimatedTimeSeconds` are present and non-empty — 0 missing for every
field. The data quality problem is not absence; it is **label hygiene**.

### Overlapping / near-duplicate categories — 12 buckets

| Normalised | Variants (count) |
|---|---|
| statistics + probability | `Statistics and probability` (20) ∣ `Statistics & Probability` (2) |
| measurement + geometry | `Measurement and geometry` (28) ∣ `Measurement & Geometry` (9) ∣ `Geometry & Measurement` (1) |
| algebra + patterns | `Algebra & Patterns` (24) ∣ `Patterns & Algebra` (12) |
| number | `Number` (97) ∣ `number` (8) |
| statistics | `Statistics` (71) ∣ `statistics` (2) |
| literacy | `Literacy` (48) ∣ `literacy` (15) |
| language | `Language` (36) ∣ `language` (12) |
| literature | `Literature` (30) ∣ `literature` (8) |
| measurement | `Measurement` (21) ∣ `measurement` (5) |
| probability | `Probability` (12) ∣ `probability` (4) |
| space | `Space` (11) ∣ `space` (4) |
| algebra | `Algebra` (10) ∣ `algebra` (3) |

Eight are **pure case collisions**. Four are **and/& word-order variants**. Both kinds
fragment counts and would render duplicate rows in a strand picker. There are also
semantically overlapping but not normalisation-equal pairs (`Number` 97 vs
`Number & Arithmetic` 77 vs `Number and algebra` 46; `Statistics` 71 vs `Chance & Data` 23
vs `Statistics & Chance` 1) which need editorial, not mechanical, consolidation.

### Duplicates

- **Duplicate ids: 0** — in the served bank, across manifests, and manifest↔bank.
- **Duplicate prompts: 17 groups / 68 questions.** Identical prompt text under different
  ids, mostly the same item reused across exam styles and programmes, e.g.
  `naplan-y3-reading-b-005`, `naplan-y3-reading-da-009`, `naplan-y3-reading-db-007`,
  `icas-y3-reading-db-005`, `icas-y3-reading-dc-005`, `icas-y3-reading-dc-013`.
  A "mixed" or all-subject draw can therefore serve the **same question twice** in one set
  from two distinct ids. Selection must de-duplicate on prompt hash, not id alone.
- **Subject-vocabulary mismatch** (see §3): catalogue scope uses `language`, bank metadata
  uses `language_conventions`.

---

## 3. Executable bank vs `PROGRAMS` / `resolveProgramStatuses` / subject catalogue

`PROGRAMS` holds **92** entries. `resolveProgramStatuses` was executed over them and
cross-referenced against executed bank counts.

### How the resolver actually behaves

```ts
if (program.status === "live" || !program.scope) return program;
return cell?.ready ? { ...program, status: "live" } : program;
```

It is **one-directional**: it only promotes `coming_soon` → `live`. It **never demotes**.
A programme declared `live` is never re-checked against the bank, and an **unscoped**
programme is never re-checked at all.

### Promotions observed (coming_soon → live, correctly)

`icas-y3-science` (99) · `icas-y3-digital-technologies` (98) · `icas-y3-spelling` (98) ·
`icas-y5-digital-technologies` (35) · `icas-y5-spelling` (45)

### Disagreements

| Direction | Programmes | Finding |
|---|---|---|
| **coming_soon but bank > 0** | `amc-y3-amc-mathematics` (26), `amc-y5-amc-mathematics` (27) | **Real disagreement.** `australian-maths-competition` is declared `coming_soon` with **no scope**, so the resolver never re-evaluates it. 53 AMC questions sit in the served bank behind a permanent coming-soon. Only a scope addition or a manual flip will surface them. |
| live but bank = 0 (4 rows) | `naplan-g3-language`, `naplan-g5-language`, `icas-g3-language`, `icas-g5-language` | **NOT a defect — my join was naive.** `catalogue.ts:302` documents that "the two vocabularies differ (`language` vs `language_conventions`)" and maps them via `REGISTRY_SUBJECT_BY_FILTER`. Real counts: 96 / 82 / 94 / 37. |
| bank slice with no scoped programme | 4× `language_conventions` (94/96/37/82), 4× `writing` (1 each) | The `language_conventions` rows are the same vocabulary artefact. The four `writing` items are genuine placeholders with no programme. |

**Design implication.** Practice Studio joins catalogue scope → bank subject on every count
query. Join naively and it silently returns **0 for all four language programmes** — the
exact error this audit's own first pass made. Use `REGISTRY_SUBJECT_BY_FILTER`, or better,
consume `getBankEligibility()` (§5), which is already keyed in the catalogue vocabulary.

### ICAS-style Year 5 Science — verified

| Check | Result |
|---|---|
| `getExamBank("practice")` where `5 ∣ icas_style ∣ science` | **0 questions** |
| Same for Year 3 | **99 questions** |
| Catalogue `icas-y5-science` declared | `coming_soon` |
| After `resolveProgramStatuses` | **`coming_soon`** (cell not ready) |
| Verdict | **Consistent. Confirmed unavailable.** The design's "Science isn't ready for Year 5 yet" is correct. |

Note `content/icas-y5-science-depth` exists but is **117 commits behind `dev`** and
contributes nothing to the served bank.

---

## 4. The five-question threshold — located, and it does **not** transfer

**Location:** `src/features/curriculum/parent-content/index.ts:125`, inside
`resolveCoverageBadge()`.

```ts
if (coverage.supportingContentCount >= 5 || coverage.status === "covered") {
  // "Ready to practise"
```

| Question asked | Answer |
|---|---|
| Is it the Learning Hub skill browser? | **No.** It is the **Parent Curriculum Explorer** coverage badge. The student-journey audit's description of a Learning Hub skill-browser gate is not what the code does. No ≥5 gate exists on any student surface. |
| Same grouping as Practice Studio? | **No.** It is keyed to a **VCAA curriculum node** (`officialCode`, `VC2M*`/`VC2E*`) via `supportingContentCount`. Practice Studio proposes year ∣ style ∣ subject ∣ strand. Different axis entirely. |
| Same question population? | **Not established.** `supportingContentCount` comes from the gated practice-coverage mapping (`gated-practice-coverage.ts`), not from a bank slice. **UNVERIFIED** whether the two populations coincide. |
| Is it even a count gate? | **No.** It is `>= 5 **OR** status === "covered"`, so a node labelled "covered" passes at any count. |

**The design claim "the same threshold the Learning Hub uses for its skill browser" is
wrong on all three counts and must be retracted.** If Practice Studio wants a ≥5 strand
gate, it is a **new** rule needing its own decision — not a reuse. The number 5 itself is
defensible (it keeps a set from being one or two items) but it is being borrowed from a
parent-facing badge on a different axis.

---

## 5. `estimatedTimeSeconds`

### Validity

| Check | Result |
|---|---|
| Missing or non-numeric | **0** |
| Zero or negative | **0** |
| Outside the 30–300 generation rule | **4** — all four `writing` items: `g3-nap-lang-writing-001` (600), `g3-icas-eng-writing-001` (600), `g5-nap-lang-writing-001` (900), `g5-icas-eng-writing-001` (900) |

The four outliers are extended-response writing tasks; the values are plausible, not
corrupt. They are the only items that would distort a mean, and they sit in a subject with
one question each.

### Distribution by year ∣ style ∣ subject (seconds)

| Group | n | min | median | max |
|---|---|---|---|---|
| 3 ∣ amc ∣ amc_mathematics | 26 | 90 | 150 | 180 |
| 3 ∣ icas ∣ digital_technologies | 98 | 40 | 70 | 120 |
| 3 ∣ icas ∣ language_conventions | 94 | 30 | 60 | 90 |
| 3 ∣ icas ∣ numeracy | 101 | 45 | 80 | 150 |
| 3 ∣ icas ∣ reading | 101 | 45 | 75 | 120 |
| 3 ∣ icas ∣ science | 99 | 30 | 60 | 90 |
| 3 ∣ icas ∣ spelling | 98 | 30 | 45 | 70 |
| 3 ∣ naplan ∣ language_conventions | 96 | 40 | 45 | 90 |
| 3 ∣ naplan ∣ numeracy | 128 | 40 | 50 | 110 |
| 3 ∣ naplan ∣ reading | 97 | 45 | 75 | 120 |
| 5 ∣ amc ∣ amc_mathematics | 27 | 90 | 120 | 180 |
| 5 ∣ icas ∣ digital_technologies | 35 | 45 | 65 | 90 |
| 5 ∣ icas ∣ language_conventions | 37 | 30 | 45 | 130 |
| 5 ∣ icas ∣ numeracy | 112 | 30 | 75 | 120 |
| 5 ∣ icas ∣ reading | 51 | 30 | 45 | 150 |
| 5 ∣ icas ∣ spelling | 45 | 40 | 55 | 75 |
| 5 ∣ naplan ∣ language_conventions | 82 | 30 | 60 | 120 |
| 5 ∣ naplan ∣ numeracy | 164 | 30 | 65 | 150 |
| 5 ∣ naplan ∣ reading | 106 | 30 | 60 | 150 |
| 3/5 ∣ * ∣ writing | 1 each | 600 | 600/900 | 900 |

### How duration is computed **before** a set is selected

A sum over the chosen items is impossible pre-selection — the items do not exist yet. Three
options, in order of preference:

1. **Use the existing API.** `getBankEligibility()` already returns, per its docblock,
   "counts and full-exam durations per filter combination, no question content — this is all
   the exam setup screen needs in the page payload". Executed: it is keyed
   `` `${year}:${examStyle}:${subject}` `` **in the catalogue filter vocabulary**
   (`5:icas_style:language`), which also solves §3's join problem. This is the correct source
   for both the count and the duration on every Practice Studio frame.
   *Exact field names within each cell: **UNVERIFIED** in this pass.*
2. **Median × set size**, from the table above, when a strand-level estimate is needed and
   the eligibility summary is subject-level only. Median, not mean — the writing outliers
   and the 30–180s spread make the mean misleading.
3. **Never** present a point estimate as exact. "About 14 minutes" at 10 × 75s median is
   honest; "14 min" implying precision is not. Round to 5 minutes.

Full-length papers must use the exam-pattern `timeMinutes`, never a sum — `exam-patterns.md`
§6 forbids a recalculated short paper being presented as the full pattern.

---

## 6. Resume, saved-answer confirmation, Start again

| Design claim | Backend support | Verdict |
|---|---|---|
| "Your 6 answers were saved on our server at 4:15 pm" | `exam-store.ts:67` — `lastAutosavedAt`: "When the last autosave flush was **accepted by the server**, as an epoch". `:72` — "Exists so the exam runner can show the real autosave state". `ExamConditionBar.autosaveLabel()` already renders it. | **SUPPORTED.** The server-confirmation timestamp exists and is already surfaced. |
| Resume an unfinished activity | `/api/exam/session/active` ("do I have a sitting") and `/api/exam/session/[id]` (returns `ActiveSessionResponse`); `reconcileResumedSession` in `exam-engine/state/resume`; persisted by migrations `20260814100000_assessment_session_resume_state.sql` and `20260816090000_assessment_session_ui_state.sql`. | **SUPPORTED for exam sessions.** |
| "Saved at question 7 of 10" | `exam-store.ts:181` references "exact autosaved answers **and current question**". | **LIKELY SUPPORTED**; exact field and null-semantics **UNVERIFIED**. The design already treats position as the weaker fact and drops it when absent — keep that. |
| **Resume a *practice set*** (the Continue card's actual subject) | Autosave is **signed-in server-mode only** — `exam-store.ts:292-296`: "Debounced autosave for signed-in (server-mode) sessions only — guests … there is nowhere signed-out to autosave to". Practice mode is a **separate runner**: `practice-mode/PracticeSession.tsx` + `use-practice-session.ts` + `practice-reducer.ts`. No practice-specific resume endpoint was found. | **UNVERIFIED — and the single biggest risk to the design.** The Continue card is drawn for a *practice set*; the verified resume path is the *exam-session* path. If practice mode holds state only in its reducer, there is nothing to resume and the Continue card cannot be built as drawn. |
| "Start again" clears saved answers | `restart` exists only as a **client-side reducer action** — `practice-reducer.ts:48` `{ type: "restart" }`, dispatched from `PracticeSession.tsx:303`. No server endpoint discards a saved attempt. | **PARTIALLY SUPPORTED.** The affordance exists; the *consequence the dialog describes* ("your 6 saved answers will be cleared") is unverified. If restart only resets client state, the dialog overstates. **Scope the copy to what the reducer actually does, or add a server discard.** |
| Guest resume | Explicitly impossible — no account, nowhere to save. | Design must not offer Continue to guests. |

**Candidate-specific path.** `src/server/family-beta-fixed-papers.ts` (WP1 only) serves
**pinned** Year 3/Year 5 Numeracy papers: questions fixed by id, slot and canonical SHA-256,
answer keys "held strictly server-side and never cross into candidate delivery", and
**fail-closed** — disabled unless `FAMILY_BETA_FIXED_PAPERS_PREVIEW === "enabled"`. It does
not read `getExamBank`, so **it does not affect Practice Studio counts**, but a Family Beta
child may be routed to a pinned paper rather than a selector-built set. It carries the notice
**"Family Beta Practice Paper — Pending Human Verification"**, which is consistent with §8.

---

## 7. Question delivery to the browser

| Mode | Endpoint | Answer keys in the browser? | Explanations? |
|---|---|---|---|
| **Guest practice** | `/api/exam/guest-bank` (`export const dynamic = "force-static"`) | **YES** | **YES** |
| **Signed-in session** | `/api/exam/session` → `toCandidateQuestions(...)` | **No** — "returns only answer-stripped `CandidateQuestions`" | Not before submission |
| Family Beta pinned papers | `family-beta-fixed-papers.ts` → `toCandidateQuestions` | **No** — keys "never cross into candidate delivery" | No |

The guest route's own header: *"The guest practice bank, **answer keys and explanations
included**. Guest mode is deliberately fully client-side (no account, no server round-trip
to score) and therefore needs the authoring bank in the browser — the long-documented,
accepted guest trade-off in `docs/ASSESSMENT_SECURITY_MODEL.md`."*

**Score integrity.** Guest scores are computed client-side from a payload that contains the
answer keys. They are **not trustworthy** and must never be presented as comparable to a
signed-in result, aggregated into progress, or shown to a parent. Signed-in scoring is
server-side and sound.

**Protected content.** `getGuestExamBank()` filters `examStyle !== "scholarship_style"`, so
scholarship content never enters the public payload. Confirmed: no `scholarship_style` rows
appear in the served bank cross-cut at this SHA. NAPLAN-, ICAS- and AMC-style keys **are**
public via the static guest route.

**Residual.** The route is `force-static` and public, so the keys for 1,601 questions
(minus scholarship) are retrievable by anyone at a stable URL without signing in. Disclosed
and accepted, but it is the ceiling on any claim about key secrecy — and it is the reason
the open `wip/practice-reveal-states` item (keys to the browser in *signed-in* practice)
matters: it would extend a guest-only trade-off to authenticated users.

---

## 8. Extended bank and whether unreviewed questions reach students

### The extended-bank toggle no longer exists

| Evidence | Finding |
|---|---|
| `src/tests/components/exam-configurator-bank-default.test.tsx` — suite *"ExamConfigurator — extended bank removed"* | Asserts `queryByTestId("toggle-practice")` is `null` for every programme, **and even when `initialBankId="practice"`** |
| `catalogue.ts:95-110` | "The checkbox no longer reads this field at all (it always starts unticked), so `practice` here would now be dead configuration as well as a policy violation" |
| `exam-bank.ts` | `practice` and `published` both return `servedBank()`; seeds "permanently removed from the repository" |

**The extended-practice route to ungated content is closed**, test-enforced. The historical
incident is recorded in `catalogue.ts`: five programmes once pinned `practice`, which
pre-ticked the checkbox, and "a real Grade 3 child sat two exams in which 28 of 30 questions
came from the seed pool".

**Design implication — retract.** The Practice Studio frames draw an "Also use the extended
practice bank" checkbox defaulting OFF. It must be **removed entirely**, not defaulted off.
Several docblocks still describe "~1,100 auto-generated seeds" and `audit-bank.mts` still
prints a "gated? NO" row for the toggle — **both are stale** and will mislead the next reader.

### But unreviewed questions **do** reach students, by a different route

| State | Questions | % |
|---|---|---|
| Approved, revision-bound | **53** | 3.3% |
| **Awaiting human approval** | **1,548** | **96.7%** |
| Integrity problems | 0 | — |

**All 23 programme gate modes are `report`, not `enforce`.** Approval readiness is 100% for
`amc-y3-amc-mathematics` and `amc-y5-amc-mathematics` (26/26, 27/27) and **0.0% for every
other programme** — all 21 NAPLAN and ICAS programmes.

Approval evidence across the served bank:

| Strongest evidence carried | Questions | Counts as human approval? |
|---|---|---|
| No manifest at all (curated, pre-factory) | 1,005 | no |
| Manifest declares no evidence recovered | 226 | no |
| Recovered evidence, model reviewer, verifiability `none` | 62 | no |
| Verifiable review chain, model reviewer only | 255 | no |
| Verifiable review chain, **human** reviewer | **53** | **YES** |

`audit-bank.mts` also records that **there is no `approvedBy` field anywhere in the manifest,
review-record or question schema**, and that 82 manifests declaring a *human generator* are
authorship, not approval.

**This contradicts AGENTS.md rule 8 ("Human Gate — publication requires `approvedBy`") and
the project's non-negotiable principle 5 ("Human review is required before children see
questions") for 96.7% of what is served.** The gate exists and is wired; it is simply in
`report` mode everywhere except AMC.

### The consequence Practice Studio must absorb

Counts are **a function of gate mode, not of content**. Today, `5 ∣ icas ∣ numeracy` shows
112. Flip that programme to `enforce` and it shows **0**, because 0 of 112 are approved. The
same holds for all 21 NAPLAN/ICAS programmes.

So the design's "no content" state is not an edge case — **it becomes the normal state for
every NAPLAN and ICAS programme the moment enforcement is switched on.** The fail-closed
path must be built as a first-class state, not a rarity.

### One further fail-closed behaviour

`servedBank()` returns `Object.freeze([])` — the **entire bank empty** — if
`getPublicationEligibility()` reports any integrity problem. Currently 0 problems. But a
single integrity failure makes every count on every screen read 0, indistinguishable from
"no content written yet" unless the UI separates them. **Practice Studio needs a distinct
"we can't verify the bank" state**, which the error frame already anticipates by treating an
unknown count as zero.

---

## 9. Design implications — consolidated

**Must change:**

1. **Remove the extended-practice-bank checkbox.** It does not exist in the app and must not
   be reintroduced (§8).
2. **Group topic selection on `strand`, not `topic`.** 622 topics / 62 viable groups makes a
   topic picker unusable; strand gives 95 of 141 (§2).
3. **Retract "the same threshold the Learning Hub uses".** The only ≥5 in the app is a parent
   curriculum-node badge on a different axis. A strand gate is a new decision (§4).
4. **Treat "no content" as a primary state, not an edge case** — it is one gate-mode flip away
   from being the default for all NAPLAN/ICAS programmes (§8).
5. **Add a distinct "cannot verify availability" state**, separate from "none available"
   (§8).
6. **Scope the Start-again dialog's copy** to what `restart` actually does, or add a server
   discard (§6).

**Must verify before build:**

7. **Practice-set resume.** The Continue card's whole premise. Verified for exam sessions,
   unverified for practice mode (§6).
8. **Consolidate the 12 strand-label buckets** before any strand picker ships, or it will show
   `Number` and `number` as separate rows (§2).
9. **De-duplicate on prompt hash** in selection — 68 questions share prompt text across ids
   (§2).

**Already correct:**

10. ICAS Y5 Science unavailable — verified (§3).
11. The five unlaunched programmes hold no content — verified, **except AMC**, which now holds
    53 questions behind an unscoped permanent coming-soon (§3).
12. Server-confirmed save timestamps exist (`lastAutosavedAt`) (§6).
13. Counts and durations should come from `getBankEligibility()`, which already handles the
    subject-vocabulary mismatch (§3, §5).

---

## 10. Unresolved questions

1. Does practice mode persist and resume server-side, or is `practice-reducer` state
   client-only? **Blocks the Continue card.**
2. Exact field names and null-semantics inside a `getBankEligibility()` cell.
3. Does `supportingContentCount` (parent coverage) draw on the same approved population as
   `getExamBank("practice")`?
4. When will any programme move from `report` to `enforce`, and is a 0-count Practice Studio
   acceptable in the interim?
5. Is the public `force-static` guest-bank route (1,601 answer keys, no auth) still the
   accepted position, given `wip/practice-reveal-states` would extend key exposure to
   signed-in practice?
6. `australian-maths-competition` has no `scope`, so its 53 published questions can never be
   auto-promoted. Add a scope or flip it manually?
7. Has `origin` moved since the 2026-11-04 23:19 fetch? Unverifiable from the bridge
   (`Host key verification failed`).

---

## 11. What was changed

**This report only.** `docs/content-status/practice-availability-2026-11.md`, new and
untracked. No application code, content, migration, database or hosted configuration was
touched. The two analysis scripts (`scripts/_audit/*.mts`) were written **outside the
repository**, in the extracted copy at `$HOME/wp1-79441a12`, and are not in the working tree.

**Note:** this file was written into the primary checkout, which AGENTS.md rule 2 declares
read-only, because the brief specified this path. That checkout is also currently **dirty**
on `dev` (~20 modified files, pre-existing). Commit this report from a worktree off fresh
`origin/dev` rather than from the main checkout.
