# AMC (Australian Mathematics Competition) — family scoping, Phase 0

**Status: investigation and proposal only. Nothing described here is implemented.** No schema,
taxonomy, exam-pattern, renderer, scoring, or migration change has been made. This document
exists so the owner can make the Step 3 decisions below before any of it is built.

Written from a clean `origin/main` worktree; `main` and PR #3 are untouched.

---

## 0. Copyright — non-negotiable

AMC papers and questions are copyrighted by the **Australian Maths Trust (AMT)**. MindMosaic
must generate **original, AMC-style** problems only:

- No ingesting, storing, reproducing, or paraphrasing real AMC past-paper questions.
- No generation pipeline may be pointed at AMT past papers, official solutions, or any AMT-owned
  text as a source.
- Every AMC item MindMosaic ever produces is original and carries `origin: ai_generated`
  (`src/schemas/question.schema.ts`'s `questionOriginSchema`) — the same discipline the platform
  already applies to NAPLAN-style and ICAS-style content, extended to a family whose source
  material is even more legally sensitive (a named, currently-operating competition body, not a
  government curriculum authority).
- "AMC-style" describes structure and character (30 items, weighted marks, steep difficulty
  ramp, integer-answer tail) — never content. No prompt, generation instruction, or review
  rubric for this family may reference, quote, or ask a model to imitate a specific real AMC
  question.

Any future AMC content-generation brief must restate this section verbatim as its own opening
constraint, the same way `exam-patterns.md` opens with "these are practice papers, not exams."

---

## 1. Current-state investigation (read-only)

All evidence below is against this repo at `origin/main`. Path:line references are exact for
`origin/main` and are worth re-checking before implementation, not because the platform is
expected to have moved fast, but because this document, if stale, is exactly the kind of
authority `docs/content-status/exam-patterns.md` (§0) warns against trusting blindly.

### 1.1 Is `amc` an `ExamStyle` today?

**No — not at any layer that matters to a learner.** `EXAM_STYLES` is a closed 2-element tuple:

```ts
// src/schemas/question.schema.ts:57
export const EXAM_STYLES = ["naplan_style", "icas_style"] as const;
```

`examPatternSchema.examStyle` in `src/features/exam-engine/exam-patterns/exam-pattern.ts`
independently hardcodes the same two-value enum (`z.enum(["naplan_style", "icas_style"])`) — a
**second**, not-automatically-synced place a new style must be added.

`/practice/australian-maths-competition` is **not a route**. The catalogue entry is real:

```ts
// src/features/catalogue/catalogue.ts:256-262
{
  id: "australian-maths-competition",
  slug: "australian-maths-competition",
  name: "Australian Maths Competition",
  blurb: "Competition-style problem solving practice.",
  status: "coming_soon",
},
```

and `src/app/practice/[program]/page.tsx:20` states the consequence directly: *"A `coming_soon`
program is a real catalogue entry but has no route."* It is a tile on `/practice`'s third
(coming-soon) group and nothing else — no pattern, no bank, no scoring path.

**One layer down is further ahead than the application layer.** A currently-applied migration
already seeds AMC at the database reference-table level, as part of generic Phase-0 groundwork
for a `spec §6.2` "assessment family" concept — not as an AMC-specific design:

```sql
-- supabase/migrations/20260822090000_programme_offering_authority.sql:97
('mathematics_competition', 'Mathematics competition practice', 'Original competition-style mathematics practice.')
-- :116
('australian_mathematics_competition', 'mathematics_competition', 'Australian Mathematics Competition practice', 'Original style-aligned practice; no official endorsement is implied.'),
```

So `assessment_families.mathematics_competition` and `programmes.australian_mathematics_competition`
**already exist as rows**. But `programme_offerings` — the table that says "this (programme,
subject, year_level) combination is a real, sittable offering" — seeds rows **only** for
`naplan_style_practice`/`icas_style_practice` (same migration, the `insert into
programme_offerings ... cross join subjects` block, lines 171-198). Zero AMC offering rows
exist. `create_assessment_session`'s own offering boundary
(`c_offering_families := array['naplan_style', 'icas_style']`, line 287) doesn't even check the
AMC family — a request naming it today falls straight through to the content query and fails
`MM212` (no eligible content), not because it's rejected, but because nothing serves it.

Also relevant: `src/schemas/platform/common.ts:75-81` (an explicitly **not-yet-wired**
Phase-0 contracts file — its own header says *"Nothing in `src/schemas/platform/` is imported by
application code yet"*) lists `mathematics_competition` in a forward-looking
`ASSESSMENT_FAMILIES` constant alongside `curriculum_practice`, `selective_entry`, and
`singapore_curriculum`. This is the same speculative-groundwork pattern as the migration above,
not a concrete AMC design — `docs/spec/scalable-assessment-platform-spec-v1.md` names no AMC
specifics anywhere in it.

**Net finding:** the DB reference tables and a future-facing Phase-0 contracts file both already
anticipate a competition-maths family in the abstract. The concrete, learner-facing plumbing —
`ExamStyle`, an exam pattern, a strand set, a bank, a route — has none of it.

### 1.2 5-option multiple choice (A–E): is it capped at 4?

**Not capped. Already supports up to 8 lettered options; no change needed.**

Nothing in `question.schema.ts` enforces an option count beyond a floor:

```ts
// src/schemas/question.schema.ts:1042
question.options.length < 2   // minimum 2; no maximum tied to type
// :732
options: z.array(questionOptionSchema).max(30).default([]),   // generic ceiling, not MC-specific
```

The renderer is generic over `question.options` and already letters past D:

```ts
// src/features/exam-engine/question-renderers/renderer-utils.ts:13
export const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;
// MultipleChoiceRenderer.tsx:50
{OPTION_LETTERS[index] ?? index + 1}
```

A 5-option (A–E) multiple-choice question already renders correctly today with **zero** schema
or renderer changes. Confirmed by direct read of both files, not inferred from the option cap
existing elsewhere — there was a real possibility this was capped for NAPLAN/ICAS fidelity
reasons and it is not.

### 1.3 Integer answers (0–999): does `number_entry` cover it?

**Functionally yes; there is no enforced range or integer-only constraint, which is a soft gap,
not a blocker.**

```ts
// src/schemas/question.schema.ts:235-240
const numberAnswerKeySchema = z.object({
  kind: z.literal("number"),
  value: z.number().finite(),        // any finite number — superset of 0-999 integers
  tolerance: z.number().finite().nonnegative().default(0),
  unit: z.string().trim().min(1).max(40).optional(),
});
```

`0`–`999` integers are trivially representable (`value: z.number().finite()` accepts them). The
renderer places no ceiling either:

```tsx
// src/features/exam-engine/question-renderers/NumberEntryRenderer.tsx:34-39
<input type="number" inputMode="decimal" step="any" ... />
```

Nothing stops a student typing a decimal or a negative number the AMC format would never ask
for — a UX nicety gap (a `min`/`max`/`step` wired from the question's own pattern/blueprint),
not a correctness gap. An AMC integer-answer question authored with a whole-number `value` in
`[0, 999]` scores correctly against this schema exactly as written today.

### 1.4 Weighted marks: does scoring support per-question weights?

**Yes — already fully supported, already the actual mechanism. Nothing assumes 1 mark per item.**

`scoreExam` sums each question's own `availableMarks`, not a constant:

```ts
// src/features/exam-engine/scoring/score-exam.ts:27-34
const awardedMarks = questionScores.reduce((total, r) => total + r.awardedMarks, 0);
const availableMarks = questionScores.reduce((total, r) => total + r.availableMarks, 0);
```

`availableMarks` traces straight to a per-question schema field:

```ts
// src/features/exam-engine/scoring/question-scorers.ts:134-135
function marks(question: ScorableQuestion): number {
  return question.metadata.marks;
}
// src/schemas/question.schema.ts:215
marks: z.number().int().positive().max(20).default(1),
```

`metadata.marks` is a real, validated, per-question integer field (1-20, defaults to 1). NAPLAN
and ICAS content is uniformly 1-mark today only because nothing has ever authored it otherwise
— the aggregation logic itself has no 1-mark assumption anywhere. AMC's tiers (3, 4, 5, and
6-10) all fit inside the existing `max(20)` ceiling.

**Consequence for the spec below:** weighted AMC scoring needs **zero scoring-engine or schema
changes**. It needs `metadata.marks` set correctly per question at authoring/generation time,
by tier (§2.2). This is a content-authoring rule, not a platform capability gap — the platform
capability already exists.

### 1.5 What would an AMC exam pattern need that NAPLAN/ICAS don't have?

Read against `src/features/exam-engine/exam-patterns/exam-pattern.ts` (the schema) and
`exam-pattern-registry.ts` (the seeded patterns):

| Need | Already supported? | Evidence |
|---|---|---|
| Two question types in one paper, split by count (25 MC + 5 integer) | **Yes** — `sources[].filters.typeIn` exists exactly for this; `patternSourceSchema` already supports multiple `sources` per pattern, `display: "merged"` for an internally-composed paper the child never sees a boundary in (ICAS English already does this with two sources) | `exam-pattern.ts` `filters.typeIn`; `icasEnglishPattern` in the registry is the direct precedent |
| 30-item total, 60-minute timing | **Yes** — `questionCount`/`timeMinutes` are plain positive integers, no ceiling below AMC's numbers | `exam-pattern.ts` `questionCount: z.number().int().positive()`, `timeMinutes` likewise |
| Per-question weighted marks (3/4/5/6-10) | **Yes, at the question layer, not the pattern layer** — see §1.4. The pattern schema has no marks concept at all today (marks live on the question, not the pattern), so a weighted paper needs no pattern-schema change | `question.schema.ts:215` |
| A new `examStyle` value | **No — this is the one hard requirement.** Both `EXAM_STYLES` (`question.schema.ts:57`) and `examPatternSchema.examStyle`'s own literal enum need `"amc_style"` added, in the same commit, or a pattern referencing it fails Zod validation at module load (`validateRegistry` in `exam-pattern-registry.ts:344` parses every pattern eagerly) | both files, cited above |
| A "no calculator" adaptation | **Not needed.** The platform has no calculator feature anywhere in `src/features/exam-engine` (`grep -rn calculator` returns nothing) — "no calculator" is not a departure from anything the platform currently offers, so it needs no new `Adaptation` tag | absence confirmed by search |
| Encoding "Q1-10 = 3 marks, Q11-20 = 4 marks, ..." as a structural, validated rule | **Genuinely new territory.** `patternSourceSchema` composes by *count* and *filter* (type, strand, difficulty mix), never by *ordinal position within the paper*. There is no existing mechanism that says "the first 10 selected items must each carry `metadata.marks: 3`." This is a real design gap — see §3 Q3 and §2.2 | `exam-pattern.ts`'s `patternSourceSchema`, whole file |

So: one new `ExamStyle` value (two coupled edit points), one new pattern registry entry (following
the exact `icasEnglishPattern`-style two-source-merged precedent), and one genuinely new design
question (how mark-tier-by-position gets enforced, if at all) — not a rebuild of any engine.

### 1.6 Taxonomy/strands: does `subject-registry.ts` have anything AMC-appropriate?

**No AMC-appropriate strand set exists, but the exact mechanism the spec needs — per-`examStyle`
strand scoping inside one subject id — already exists and is already load-bearing for NAPLAN vs.
ICAS today.**

```ts
// src/features/taxonomy/subject-registry.ts:23-42
export interface SubjectStrand {
  readonly id: string;
  readonly label: string;
  /** Which exam style sets this strand. Omitted means both. ... */
  readonly examStyles?: readonly ExamStyle[];
  ...
}
```

The `numeracy` subject already holds NAPLAN-only strands (`examStyles: ["naplan_style"]`, e.g.
"Number and algebra" at line 101-103) alongside ICAS-only strands, inside one subject id, for
exactly the reason the AMC spec needs it: *"A single flat strand list per subject could only ever
be the union of the two, which would let an ICAS strand be attached to a NAPLAN question and call
it valid"* (docblock, same file, lines 29-41).

This leaves one real design choice, not a platform gap: **reuse the `numeracy` subject id** with
new `examStyles: ["amc_style"]` strands, or **create a new `amc_mathematics` subject id** with its
own `supportedExamStyles`. Both are equally well-supported mechanically. §2.3 recommends the
latter — AMC's "problem-solving under time" character doesn't map onto NAPLAN/ICAS's
curriculum-coverage strand model, and sharing the `numeracy` id risks conflating two different
`coverageTargets` semantics under one key.

### 1.7 Programme-offering authority: what rows would `programme_offerings` need?

Per the A16 model (`20260822090000_programme_offering_authority.sql`, §1.1 above), an offering
row is the tuple `(programme_id, subject_id, year_level, locale, region)`. For AMC:

- `programme_id`: `australian_mathematics_competition` **already exists** as a row (§1.1) —
  seeded once already, under `assessment_family_id = 'mathematics_competition'`. No migration
  needed to create the programme itself.
- `subject_id`: needs a **new row in `public.subjects`** — no existing subject id fits (all
  eight seeded subjects are NAPLAN/ICAS curriculum subjects). A new id such as `amc_mathematics`,
  matching whichever `SUBJECT_REGISTRY` id §2.3 lands on.
- `year_level`: **3** (Middle Primary → Grade 3) and **5** (Upper Primary → Grade 5) — matching
  `SUPPORTED_CONTENT_YEAR_LEVELS = [3, 5]` (`question.schema.ts:56`), so no year-level widening is
  needed either.
- `locale`/`region`: `en-AU` / `global`, matching every existing row.

So the concrete migration, once the subject id is decided, is two `insert into
programme_offerings` rows plus one new `subjects` row — small, and it slots into the exact
pattern the existing migration already establishes (it does not need to re-derive the model).

---

## 2. Proposed AMC family model

Everything in this section is a **proposal**, shaped to fit the mechanisms §1 found already
exist. None of it is built.

### 2.1 Identity

| | Proposed value | Rationale |
|---|---|---|
| `examStyle` id | `amc_style` | Matches the `_style` suffix convention of `naplan_style`/`icas_style` |
| Label | "AMC-style" | Matches "NAPLAN-style"/"ICAS-style" wording exactly — never "AMC", "real AMC", or "official" alone (copyright + fidelity discipline, §0) |
| Programme: Middle Primary | `AMC Middle Primary` → MindMosaic **Grade 3** | Real division = Years 3-4; MindMosaic serves single-year grades, so this offering targets Grade 3 content only (see §3 Q1 on whether Year 4 content should also roll up here) |
| Programme: Upper Primary | `AMC Upper Primary` → MindMosaid **Grade 5** | Real division = Years 5-6; same single-year-grade note applies |
| `programme_offerings` rows | `(australian_mathematics_competition, amc_mathematics, 3, en-AU, global)`, `(australian_mathematics_competition, amc_mathematics, 5, en-AU, global)` | Per §1.7; `programmes.australian_mathematics_competition` already exists, only the subject + offering rows are new |

### 2.2 Exam pattern

Proposed pattern, modelled directly on `icasEnglishPattern`'s two-merged-sources shape
(`exam-pattern-registry.ts:192-225`) — the closest existing precedent for "one paper, two
internally-different question kinds, no visible section boundary":

```ts
{
  id: "amc-y3-middle-primary-full",       // and amc-y5-upper-primary-full
  label: "AMC-style Year 3 Middle Primary — full-length practice",
  examStyle: "amc_style",
  yearLevel: 3,                            // and 5
  presentation: "full_length_practice",
  basis: "official_length_and_time",       // 30 items / 60 min matches the real division exactly
  adaptations: ["internal_amc_marking"],   // proposed new tag — see below
  questionCount: 30,
  timeMinutes: 60,
  sources: [
    { id: "multiple-choice", programmeId: "amc-y3-mathematics", count: 25,
      filters: { typeIn: ["multiple_choice"] }, display: "merged" },
    { id: "integer-answer", programmeId: "amc-y3-mathematics", count: 5,
      filters: { typeIn: ["number_entry"] }, display: "merged" },
  ],
}
```

`display: "merged"` because the real AMC paper shows no visible boundary between its
multiple-choice and integer-answer questions — they're interleaved by position, not grouped.

**The mark-tier ramp is not expressible as pattern structure** (§1.5's one real gap). Proposed
resolution: encode it as a **content-authoring rule**, not a pattern-schema field —

| Position | Real AMC marks | Proposed `metadata.marks` | Proposed `metadata.difficulty` |
|---|---|---|---|
| Q1-10 | 3 | 3 | `easy` |
| Q11-20 | 4 | 4 | `medium` |
| Q21-25 | 5 | 5 | `challenging` |
| Q26-30 | 6-10 (stepped) | 6, 7, 8, 9, 10 (one value per question, fixed by position) | `challenging` |

Two platform-honesty notes worth keeping visible to the owner:

1. The platform's 3-band difficulty scale (`easy`/`medium`/`challenging`) cannot express AMC's
   5-tier mark ramp — Q21-25 and Q26-30 necessarily collapse into the same `challenging` band
   even though they carry different marks. This is a genuine compression, not a bug; document it
   in the pattern's own `adaptations` list if AMC ships (a new tag, e.g.
   `"compressed_difficulty_bands"`, would make this an honest, visible departure the same way
   every other adaptation is).
2. Because the pattern's `sources` select by count and type/strand filter, not by ordinal
   position, **nothing today enforces "the 3-mark items are actually presented first."** The
   selection engine draws a random eligible set per `create_assessment_session`'s seeded shuffle
   (`exam-pattern-registry.ts`'s whole selection model, and the RPC in §1.1) — items are not
   currently guaranteed to sit in mark-ascending order at all. If paper-order fidelity to the
   ramp matters, that's new selection-engine behaviour, not just new content — flagged for §3.

### 2.3 Strand taxonomy (proposal)

New subject, `amc_mathematics`, `supportedExamStyles: ["amc_style"]`, `yearLevels: [3, 5]`,
following the exact `SubjectRegistryEntry`/`SubjectStrand` shape from §1.6:

| Strand id | Label | Character |
|---|---|---|
| `number-and-arithmetic` | Number & Arithmetic | Mental arithmetic, place value, fractions/percentages under time pressure |
| `patterns-and-algebra` | Patterns & Algebra | Sequences, simple relationships, working backwards |
| `geometry-and-measurement` | Geometry & Measurement | Shape properties, area/perimeter reasoning, visual-spatial puzzles |
| `statistics-and-chance` | Statistics & Chance | Reading data, simple counting/probability reasoning |
| `logic-and-problem-solving` | Logic & Problem-Solving | Non-routine reasoning that doesn't map to a curriculum strand — AMC's defining character |

Each strand `examStyles: ["amc_style"]`, isolating them from NAPLAN's/ICAS's numeracy strands
exactly as §1.6 describes. `logic-and-problem-solving` has no NAPLAN/ICAS analogue at all —
it's the strand that makes AMC AMC, not a curriculum-coverage exercise.

### 2.4 Supported question/visual types

| Type | Use | Evidence it exists today |
|---|---|---|
| `multiple_choice`, 5 options (A-E) | 25 of 30 items | §1.2 — already works, zero changes |
| `number_entry`, integer 0-999 | 5 of 30 items | §1.3 — already works, zero changes |
| Visuals, as needed per strand: `GeometryShapeRenderer`, `NumberLineRenderer`, `CoordinateGridRenderer`, `LabelledSvgRenderer`, `BarChartRenderer`, `PieChartRenderer`, `TableRenderer` | Geometry & Measurement and Statistics & Chance strands lean on these; Logic & Problem-Solving items are frequently visual-spatial (grid/pattern puzzles) and would draw on `LabelledSvgRenderer`/`HotspotSvgRenderer` | `src/features/exam-engine/visual-renderers/*.tsx` — all 10 renderer types already exist, generic across exam styles |

No new question type or renderer is needed. AMC's format maps entirely onto types the platform
already implements.

### 2.5 Target depth per strand/division, and visual coverage target

Proposed, for the owner to size against actual content-generation capacity (not derived from any
existing content-status doc, since none exists for this family yet):

| Division | Strands | Suggested minimum bank depth per strand | Rationale |
|---|---|---|---|
| Middle Primary (Grade 3) | 5 strands above | 20-30 items/strand | Enough for the selection engine to draw a fresh, non-repeating 30-item paper across several sittings without heavy reuse, matching the depth discipline used for the G3/G5 NAPLAN/ICAS threads referenced in §4 |
| Upper Primary (Grade 5) | 5 strands above | 20-30 items/strand | Same |

Visual-coverage target: proposed **≥40% of items per strand carry a real visual** for
Geometry & Measurement and Statistics & Chance (these strands are visually native in the real
AMC), lower (~15-20%) for Number & Arithmetic and Patterns & Algebra, and near-zero for
Logic & Problem-Solving unless a specific puzzle is inherently spatial. These are proposed
starting targets, not derived from any AMC-specific published figure — AMT does not publish a
visual-density statistic, and MindMosaic must not claim one.

---

## 3. Owner decisions (do not decide these — surfaced here and in the reply for sign-off)

### Q1 — Fidelity vs. kindness

Mirror real AMC exactly — weighted marks, steep difficulty ramp, 60-minute strict timing, no
penalty for wrong answers — or build a gentler practice variant (unweighted, relaxed/untimed)
more suited to your own children's practice?

- **Recommended default: fidelity.** The platform already supports every mechanical piece
  (weighted marks work today with zero engine changes — §1.4; 5-option MC works today — §1.2).
  Building the gentler variant *instead* of the real shape would spend real content-generation
  effort on a shape AMC was never designed to have, and a gentle variant can always be offered
  later as a *second* pattern (`practice_module`, `basis: "internal"`) reusing the same bank —
  the reverse (retrofitting real fidelity onto content authored loosely) is much harder.
- **Trade-off:** fidelity means real content must be authored with real per-question marks
  correctly tiered by position (§2.2's ramp), which is more generation/validation discipline
  than NAPLAN/ICAS content currently carries (uniformly 1 mark). If the mark-tier-by-position
  enforcement gap (§2.2 note 2) isn't closed, "fidelity" is partly cosmetic — the paper *looks*
  weighted but isn't guaranteed to *present* in ascending-difficulty order the way the real
  competition does.

### Q2 — 5-option MC: extend, or restrict to 4-option + integer?

- **Recommended default: no work needed — it's already extended.** §1.2 found the schema and
  renderer already support A-E (and beyond) with no changes. This question is effectively
  answered by the investigation, not something to decide — flagged here only because the
  brief asked for it explicitly, and because it's worth the owner knowing the "gap" doesn't
  exist rather than discovering that only after implementation starts.

### Q3 — Weighted scoring: implement per-question weights, or score AMC as unweighted for now?

- **Recommended default: use the existing per-question weights (§1.4) — no "implementation"
  is actually required, only correct authoring of `metadata.marks` per the tier table in §2.2.**
  The open sub-decision is §2.2 note 2: does the owner want mark-ascending presentation order
  enforced (new selection-engine work), or is drawing a weighted-but-shuffled 30-item set
  acceptable for a first version? Recommend accepting shuffled order for v1 — AMC's own timing
  pressure comes from difficulty ramp, not from a promise about serving order, and enforcing
  strict positional order would be genuinely new selection-engine surface area, not a
  configuration change.

### Q4 — Strand taxonomy sign-off

Approve, amend, or reject the 5-strand `amc_mathematics` proposal in §2.3 (Number & Arithmetic,
Patterns & Algebra, Geometry & Measurement, Statistics & Chance, Logic & Problem-Solving), and
confirm: new dedicated subject id (`amc_mathematics`), or fold AMC strands into the existing
`numeracy` subject id with `examStyles: ["amc_style"]` scoping?

- **Recommended default: new dedicated subject id.** §1.6's mechanism supports either
  equally well; the reason to prefer a new id is semantic, not technical — `numeracy`'s
  `coverageTargets` and existing NAPLAN/ICAS strand list represent curriculum-coverage
  intent, and AMC's strands represent competition-problem-solving intent. Sharing the id
  risks a future coverage report conflating the two.

### Q5 — Build now vs. defer

Is AMC the right next content family, or should completing Grade 3/Grade 5 NAPLAN/ICAS depth
come first?

- **No recommendation given here** — this is a resourcing/priority call outside this
  investigation's scope, and the brief explicitly asks it be surfaced, not answered. Relevant
  fact for the decision: AMC's platform-level cost is small (one new `ExamStyle`, one pattern,
  one subject + 5 strands, two offering rows — §4's effort table) precisely *because* the
  scoring/schema/renderer work is already done. The bottleneck for AMC, if greenlit, is content
  generation and review depth (§2.5), the same bottleneck NAPLAN/ICAS depth-completion has.
  AMC does not compete with NAPLAN/ICAS depth for *engineering* effort; it does compete for
  *content-generation and review* capacity.

---

## 4. Readiness verdict & handoff

### What the platform already supports (no work required)

- 5-option (A-E) multiple choice — schema and renderer both already generic past 4 options (§1.2)
- Integer-answer questions, any range including 0-999 — schema already permits it (§1.3)
- Per-question weighted marks 1-20, correctly aggregated by the scoring engine — already the
  actual mechanism, not a special case to add (§1.4)
- Multi-source, single-paper composition (25 MC + 5 integer, no visible section boundary) — the
  exact `icasEnglishPattern` shape already does this for a different family (§1.5, §2.2)
- Per-`examStyle`-scoped strands inside a taxonomy that won't collide with NAPLAN/ICAS — already
  the mechanism `numeracy`'s own strand list uses today (§1.6)
- A `programmes` row for `australian_mathematics_competition`, already seeded at the DB layer
  under `assessment_families.mathematics_competition` (§1.1, §1.7)
- Every visual type AMC's strands would plausibly need (§2.4)

### Concrete gaps, and the effort to close each

| Gap | Effort | Notes |
|---|---|---|
| `"amc_style"` added to `EXAM_STYLES` (`question.schema.ts`) and `examPatternSchema`'s own literal enum (`exam-pattern.ts`) | Small — two coupled one-line edits | Must land together; `validateRegistry` parses eagerly at module load |
| One (or two, per division) new pattern in `exam-pattern-registry.ts` | Small — direct copy of the `icasEnglishPattern` shape | §2.2 |
| New `amc_mathematics` subject + 5 strands in `subject-registry.ts` | Small-medium | Mechanism exists; content is new (§2.3) |
| New `subjects` row + `programme_offerings` rows (2, one per division) | Small — one migration, following `20260822090000`'s exact pattern | §1.7 |
| Mark-tier-by-position authoring discipline for generated content | Medium — a generation/validation rule, not a schema change | §2.2 table; needs its own validator akin to `check-question-correctness.mts` if the ramp should be enforced automatically rather than trusted per-batch |
| Mark-ascending *presentation order* enforcement (only if Q3's fidelity answer wants it) | Medium-large — new selection-engine surface area | §2.2 note 2, §3 Q3 |
| Difficulty-band compression honesty (`easy`/`medium`/`challenging` cannot express AMC's 5 tiers) | Small — documentation/adaptation-tag only, if surfaced as an `adaptations` entry | §2.2 note 1 |
| Content: original AMC-style items, 20-30 per strand per division (§2.5) | Large — the actual bottleneck | Generation + independent review, same discipline as any other family; copyright constraint (§0) applies to every prompt in the pipeline |

### What must be decided/built before any overnight AMC generation can run

1. **Owner answers §3** (Q1-Q5) — fidelity model, strand taxonomy sign-off, and the build-now-
   vs-defer call in particular, since it gates whether any of the rest happens at all.
2. **Implement the fixed shapes**, in this order (each is small and independently testable
   against the existing registry/schema validation the platform already runs at module load and
   in CI):
   - `amc_style` in both `ExamStyle` locations.
   - `amc_mathematics` subject + strands in `subject-registry.ts`.
   - `subjects` row + `programme_offerings` rows migration.
   - Exam pattern(s) in `exam-pattern-registry.ts`.
   - If Q3 says yes to positional-order fidelity: the new selection-engine work; otherwise skip.
3. **Only then**, an overnight `generate → validate → review → stage` run — publish nothing —
   for a first AMC batch, mirroring the G3 thread task's own discipline (originality/difficulty
   gates, human-reviewer `approvedBy` signature before anything reaches `_promoted/`, per
   `e1368d8`'s publish-gate work already in PR #3). Every generation prompt in that run carries
   §0's copyright constraint verbatim.

Nothing in this document authorises step 2 or step 3 to begin. It is the map, not the go-ahead.
