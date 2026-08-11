# MISTRAL — MindMosaic practice-set generation prompt v5

Paste this entire prompt into Mistral once. Then drive one set per message:
**"Generate the next set for `<programme-slug>`"** — e.g. `naplan-y5-numeracy`.
Mistral runs in VS Code with repo access and writes each set into the staging folder
(section 12 — read those rules before writing anything).

## WHAT THIS IS, AND WHAT IT IS NOT

You are producing **full-length, fixed-path practice sets in the style of NAPLAN and ICAS**.
They are original practice material for two children. They are **not** reproductions or
simulations of real papers, and must never be described as such. Specifically:

- **NAPLAN online is adaptive** (three-stage tailored pathways). These sets are linear and
  fixed-path, so they are NAPLAN-*style* practice, not a NAPLAN simulation.
- **ICAS English is one assessment** covering text comprehension, writer's craft, syntax and
  vocabulary — there is no official separate reading or language paper. This platform stores
  the content in two programmes, so `icas-*-reading` and `icas-*-language` are **two halves of
  one English paper** (section 2), never complete papers on their own.
- **NAPLAN spelling uses audio dictation.** This platform has no audio, so spelling items are
  a **text-based adaptation**, not an authentic equivalent.
- Set sizes and timings below are the platform's fixed targets, drawn from the latest
  published NAPLAN blueprint and from secondary sources for ICAS. They are targets for
  practice, not a claim about any current live paper.

Never copy, paraphrase, or reconstruct real NAPLAN/ICAS/AMC/textbook/commercial items.
Australian English throughout (colour, metre, "full stop", "rubber", "maths"). No
affiliation with NAPLAN or ICAS is implied.

Every set is independently re-solved and gate-checked by a different model before promotion.
Your self-report is **diagnostic only and does not replace independent verification**.

---

## 1. PROGRAMME SLUG

Format: `<exam>-y<year>-<subject>`. Batch code format: `b[0-9]{2}`, for example `b02`.

| Slug | yearLevel | examStyle | metadata.subject |
|---|---|---|---|
| `naplan-y3-numeracy` / `naplan-y5-numeracy` | 3 / 5 | `naplan_style` | `numeracy` |
| `naplan-y3-reading` / `naplan-y5-reading` | 3 / 5 | `naplan_style` | `reading` |
| `naplan-y3-language` / `naplan-y5-language` | 3 / 5 | `naplan_style` | `language_conventions` |
| `icas-y3-numeracy` / `icas-y5-numeracy` | 3 / 5 | `icas_style` | `numeracy` |
| `icas-y3-reading` / `icas-y5-reading` | 3 / 5 | `icas_style` | `reading` |
| `icas-y3-language` / `icas-y5-language` | 3 / 5 | `icas_style` | `language_conventions` |
| `icas-y3-science` / `icas-y5-science` | 3 / 5 | `icas_style` | `science` |
| `icas-y3-digital_technologies` / `icas-y5-digital_technologies` | 3 / 5 | `icas_style` | `digital_technologies` |
| `icas-y3-spelling` / `icas-y5-spelling` | 3 / 5 | `icas_style` | `spelling` |

**If a slug is malformed or unsupported, reject it and say so — do not guess.**

**Identifier rule** (question IDs and every internal ID): lowercase letters, digits, hyphens
and underscores only, matching `^[a-z0-9]+(?:[-_][a-z0-9]+)*$`. Underscores are permitted, so
`icas-y5-digital_technologies-b02-001` is valid.

---

## 2. SET SIZE AND COMPOSITION

Each batch is **one complete practice set** at the exact size below. Three sets for a
programme (`b01`, `b02`, `b03`) give three non-overlapping sittings.

| Programme | Questions | easy | medium | challenging | Visual questions | timeMinutes |
|---|---:|---:|---:|---:|---:|---:|
| `naplan-y3-numeracy` | 36 | 11 | 16 | 9 | 14–21 | 45 |
| `naplan-y3-reading` | 39 | 13 | 17 | 9 | 4–8 | 45 |
| `naplan-y3-language` | 52 | 17 | 23 | 12 | 0–4 | 45 |
| `naplan-y5-numeracy` | 42 | 13 | 19 | 10 | 17–25 | 50 |
| `naplan-y5-reading` | 39 | 13 | 17 | 9 | 4–8 | 50 |
| `naplan-y5-language` | 52 | 17 | 23 | 12 | 0–4 | 45 |
| `icas-y3-numeracy` | 40 | 13 | 18 | 9 | 16–24 | 45 |
| `icas-y3-reading` | 27 | 9 | 12 | 6 | 3–5 | 45 |
| `icas-y3-language` | 18 | 6 | 8 | 4 | 0–2 | 45 |
| `icas-y3-science` | 30 | 10 | 13 | 7 | 12–18 | 45 |
| `icas-y3-digital_technologies` | 30 | 10 | 13 | 7 | 6–12 | 30 |
| `icas-y3-spelling` | 40 | 13 | 18 | 9 | 0–2 | 40 |
| `icas-y5-numeracy` | 40 | 13 | 18 | 9 | 16–24 | 45 |
| `icas-y5-reading` | 30 | 10 | 13 | 7 | 4–6 | 50 |
| `icas-y5-language` | 20 | 6 | 9 | 5 | 0–2 | 50 |
| `icas-y5-science` | 40 | 13 | 18 | 9 | 16–24 | 55 |
| `icas-y5-digital_technologies` | 35 | 11 | 16 | 8 | 7–14 | 35 |
| `icas-y5-spelling` | 45 | 14 | 20 | 11 | 0–2 | 40 |

**Sourcing.** ICAS sizes and times are the **official published figures** (Australia maps
Year 3 to Paper A and Year 5 to Paper C), per the ICAS year-levels/paper-mapping page and the
ICAS 2026 Test Supervision Instructions: English 45/45 min (A) and 50/50 min (C);
Mathematics 40/45 both; Science 30/45 (A) and 40/55 (C); Digital Technologies 30/30 (A) and
35/35 (C); Spelling Bee 40/40 (A) and 45/40 (C). NAPLAN sizes follow the latest published
NAPLAN technical blueprint (2025) and are not guaranteed to match a 2026 paper.

**ICAS English is one assessment.** Officially there is no separate ICAS reading or language
paper — one English assessment covers text comprehension, writer's craft, syntax and
vocabulary. This platform stores that content in two programmes, so `icas-*-reading` and
`icas-*-language` are **halves of one English paper**, sized to sum to the official total
(Year 3: 27 + 18 = 45; Year 5: 30 + 20 = 50). Reading carries text comprehension and writer's
craft; language carries syntax and vocabulary. A complete ICAS English practice paper is the
two halves together, sat in the official time — never one half alone.

IDs: `<programme>-<batch>-001` through `<programme>-<batch>-<N>`, zero-padded to three digits,
where N is the programme's question count. Exactly N IDs, no gaps, no duplicates.

**Difficulty distribution must match the row exactly** and sum to N.

**Ordering.** ICAS-style sets must increase in complexity through the set: place easier items
first and the most demanding items last. NAPLAN-style sets should open with accessible items
and avoid clustering the hardest items together.

**NAPLAN conventions of language split.** A 52-item language set must be **25 spelling** and
**27 grammar and punctuation**, with roughly 18–19 grammar and 8–9 punctuation items. Place
all spelling items first, then the grammar and punctuation items. Spelling here is a
text-based adaptation (proofreading and error-correction), since the platform has no audio.

**Reading structure.** Each stimulus text supports **4–7 questions**. A Year 3 reading set
should contain about 6–7 texts; Year 5 about 6 texts. Order lower-difficulty texts before
higher-difficulty ones. Repeat a shared passage verbatim in every question that uses it, and
make each of those questions test a different skill. (Do not apply these NAPLAN structures to
ICAS practice sets.)

**No repetition within the set:** no duplicate prompts, no two items with the same underlying
structure and only the numbers changed, no reused passage beyond the deliberate grouping.

---

## 3. YEAR AND PROGRAMME BLUEPRINTS

Use the blueprint for the exact programme you are generating.

**NAPLAN Year 3.** NAPLAN is sat in March and draws mostly on learning from earlier years,
with only some accessible current-year content — do not write to an end-of-Year-3 standard.
Order and represent natural numbers beyond 10,000, while calculations mainly use two- and
three-digit numbers. Addition and subtraction with regrouping; multiplication and division
using facts for 2, 3, 4, 5 and 10; unit fractions and their multiples; money; familiar metric
units; duration; angles compared with a right angle; maps; simple data and chance.

**NAPLAN Year 5.** Numbers to about 1,000,000; decimals and fractions including simple
equivalence; two-digit multiplication and division; area, perimeter and volume; angles;
coordinates; multi-step problems; data interpretation. Again pitched at March of Year 5, so
lean on Year 3–4 foundations extended into early Year 5 content.

**ICAS Year 3 (Paper A).** Whole numbers to about 1,000; addition, subtraction and simple
multiplication and division; halves, quarters and thirds; patterns; informal and everyday
measurement; simple space and shape; reading simple data. Formal measurement units are not
assumed at this level.

**ICAS Year 5 (Paper C).** Values from about 0.01 to 100,000; equivalent fractions and
fraction–decimal conversion; multi-step arithmetic; time; maps and simple scale; line graphs
and tables; angles below 180 degrees; area and perimeter; patterns and simple pre-algebra.

**ICAS style.** ICAS questions increase in complexity and demand higher-order reasoning
**within the Paper A or Paper C framework**. They must not rely on later-year curriculum
knowledge. Do not describe them as "above grade level" — they are harder in reasoning, not in
required content.

**Difficulty labels** describe reasoning demanded, not topic: direct recall or one routine
step is `easy`; two linked steps, or one step plus interpretation, is `medium`; multi-step
reasoning, unfamiliar framing, or a required insight is `challenging`. Even `easy` items
should require a moment of thought rather than pure recall wherever possible.

---

## 4. ALLOWED QUESTION TYPES BY PROGRAMME

Use only the types permitted for the programme.

| Programme | Permitted types |
|---|---|
| NAPLAN numeracy | `multiple_choice`, `multiple_select`, `number_entry`, `drag_drop`, `ordering`, `matching` |
| NAPLAN reading | `reading_comprehension`, `multiple_choice`, `multiple_select`, `ordering`, `drag_drop` — **no `short_answer`** |
| NAPLAN language (spelling items) | `fill_blank`, `short_answer` — text entry only |
| NAPLAN language (grammar & punctuation items) | `multiple_choice`, `multiple_select`, `dropdown`, `drag_drop`, `ordering` |
| ICAS numeracy | `multiple_choice`, `multiple_select`, `number_entry`, `ordering`, `matching`, `drag_drop` |
| ICAS reading | `reading_comprehension`, `multiple_choice`, `multiple_select` |
| ICAS language | `multiple_choice`, `multiple_select`, `dropdown`, `fill_blank` |
| ICAS science | `multiple_choice`, `multiple_select`, `true_false`, `matching`, `ordering`, `number_entry` |
| ICAS digital_technologies | `multiple_choice`, `multiple_select`, `true_false`, `ordering`, `matching`, `drag_drop` |
| ICAS spelling | `fill_blank`, `short_answer`, `multiple_choice` |

**Type diversity.** Numeracy, science and digital_technologies sets must use at least four
distinct permitted types; language and spelling sets at least three. No single type may exceed
60% of the set — except reading sets, which are mainly `reading_comprehension` and may use up
to 85% of that type.

---

## 5. SINGLE-OPTION RULES AND INTERNAL QUALITY CONTROLS

> The rules in this section — difficulty quotas, visual quotas, answer-position balancing and
> `keyLengthExtremeCount` — are **MindMosaic internal quality controls**. They are not claimed
> as official NAPLAN or ICAS specifications.

`multiple_choice` and `reading_comprehension` must each have **exactly four options**, in
display order, with IDs `"a"`, `"b"`, `"c"`, `"d"`.

`multiple_select` must have four or five options, of which two or three are correct and at
least two are incorrect.

**Position balance** (single-option questions only): the difference between the highest and
lowest position counts must be **no more than 1**, and if there are at least eight
single-option questions each of A, B, C, D must be correct at least once.

**Exactly one correct answer.** Within each individual question, no two options may be
equivalent in numerical value or in meaning, unless both are intentionally correct in a
`multiple_select` item. `3/12` and `1/4` are the same number — never offer both in one
question. If an answer can be written more than one way, require "in simplest form" and key
that form, or ensure no equivalent form appears among that question's options. Values may
repeat across different questions. Distractors must be defensibly wrong, drawn from plausible
student errors, never trickery.

**`keyLengthExtremeCount`** = the number of single-option questions where the correct option
is uniquely the longest or uniquely the shortest by character count. It must be no greater
than `floor(0.35 × singleOptionCount)`. Give distractors similar grammatical structure and
comparable length.

---

## 6. VISUALS AND ACCESSIBILITY

Permitted visual types: `bar_chart`, `table`, `number_line`, `pie_chart`, `line_graph`,
`geometry_shape`. Never raw SVG. (Coordinate grids, fraction models and diagram hotspots exist
in the platform but are not yet released for generation — do not use them.)

If a question refers to a chart, table, shape or diagram, that visual **must exist** in the
question's `visuals` array, and the question must be solvable from the prompt plus the visual
data alone. Never place required information only in surrounding instructions. Maximum six
visuals per question.

**`altText` must communicate the same relevant data available visually, so the question
remains solvable with assistive technology.** It may state labels and values neutrally. It
must not interpret the data, perform the calculation, or identify the answer. Never put the
answer in labels, tags, IDs or metadata. Alt text is 10–300 characters.

A `line_graph` needs at least two points, and three or more for a trend question. When a
question asks students to use one specific table column, another column must not accidentally
produce the same keyed answer through a different reading. The `number_line` renderer draws
ticks and dots only — never write "point A", and every highlighted value must sit exactly on a
tick.

**Do not reach for a chart or table merely to satisfy the visual quota.** If a genuine visual
question does not fit the skill, write a non-visual question and fall to the bottom of the
range rather than padding with a decorative chart.

---

## 7. FIELD VALUES

`metadata.subject` — exactly one of: `numeracy`, `reading`, `language_conventions`, `science`,
`digital_technologies`, `spelling`.

`metadata.difficulty` — exactly one of: `easy`, `medium`, `challenging`.

`metadata.strand` — use these exact tokens with this exact casing. These are the platform's
registered strands; they are an internal taxonomy, not the official NAPLAN or ICAS strand
names, and a value outside this list will fail validation.

- numeracy: `Number and algebra`, `Measurement and Geometry`, `Statistics and Probability`, `Patterns`, `Geometry`
- reading: `Literal comprehension`, `Inference`, `Reading comprehension`, `Narrative comprehension`, `Information text comprehension`, `Procedural text comprehension`, `Poetry comprehension`, `Everyday text comprehension`, `Persuasive text comprehension`, `Literary text comprehension`, `Author's craft`, `Text features`, `Figurative language`
- language_conventions: `Spelling`, `Punctuation`, `Grammar`
  (A 27-item grammar-and-punctuation section needs BOTH `Grammar` and `Punctuation` items —
  aim for roughly 18–19 grammar and 8–9 punctuation. Do not tag vocabulary items as
  language_conventions.)
- science: `Biological Sciences`, `Physical Sciences`, `Earth and Space Sciences`, `Chemical Sciences`, `Science inquiry`
- digital_technologies: `Digital Systems`, `Data and Information`, `Algorithms`, `Digital Citizenship and Safety`
- spelling: `Spelling Rules and Conventions`, `Morphology and Word Building`, `Homophones and Confusable Words`, `Phonic Patterns`

Every question also needs: `status` `"draft"`, `origin` `"original_seed"`, `marks` `1`,
`estimatedTimeSeconds` 30–300, `locale` `"en-AU"`, `source` `"original"`, `schemaVersion` `1`,
a `topic`, a `skill`, and `tags` (up to 12 short strings). `prompt` is 1–2000 characters,
`explanation` 1–3000.

Reading passages you write yourself: Year 3 80–250 words, Year 5 150–350 words, `body` up to
8000 characters, with `"attribution": "MindMosaic original"`.

`number_entry` answers must be plain numbers. If a unit applies, add
`"instructions": "Write just the number of <units>, without the unit."` and keep the unit out
of `value`. Do not use `number_entry` for a fraction unless the prompt defines exactly how to
write it.

`short_answer` accepts a single unambiguous word only; punctuation is not stripped.

`fill_blank` is all-or-nothing. Use at most two blanks, `marks` 1, and `segments` must contain
exactly one more string than `blanks`.

---

## 8. HARD BANS

No filler or padding phrases. No uniqueness suffixes. No contentless stems. Every explanation
unique to its question and teaching the method rather than restating the answer. Vary contexts
genuinely. No real people, brands or copyrighted characters. Do not reuse a child's name
across questions. No question that depends on a specific app, device or platform workflow
where several valid workflows exist.

---

## 9. WORKED EXAMPLES, BY PROGRAMME

Each example belongs to a named programme and satisfies that programme's blueprint. When
generating, imitate only the block for the programme you were asked for.

### NAPLAN Year 5 — numeracy

```json
{
  "id": "naplan-y5-numeracy-b02-001",
  "type": "multiple_choice",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A netball club orders 18 boxes of drink bottles, with 24 bottles in each box. When the boxes arrive, 37 bottles are cracked and thrown away. How many usable bottles does the club have?",
  "options": [
    {"id": "a", "text": "395"},
    {"id": "b", "text": "405"},
    {"id": "c", "text": "432"},
    {"id": "d", "text": "469"}
  ],
  "visuals": [],
  "answerKey": {"kind": "single_option", "optionId": "a"},
  "explanation": "First find the total ordered. Split 18 into 10 and 8: ten boxes hold 10 x 24 = 240 bottles and eight boxes hold 8 x 24 = 192, giving 432. Then take away the cracked ones: 432 - 37 = 395 usable bottles. Stopping at 432 misses the second step, and adding 37 instead of subtracting gives 469.",
  "metadata": {
    "subject": "numeracy",
    "strand": "Number and algebra",
    "topic": "Multi-step multiplication and subtraction",
    "skill": "Solve a two-step problem using multiplication then subtraction",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 90,
    "tags": ["multiplication", "two-step", "word problem"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "naplan-y5-numeracy-b02-002",
  "type": "number_entry",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "The bar chart shows how many library books each class borrowed in one week. Classes 5A and 5C together borrowed how many more books than Class 5D?",
  "instructions": "Write just the number of books, without the unit.",
  "options": [],
  "visuals": [
    {
      "id": "visual-naplan-y5-numeracy-b02-002-1",
      "type": "bar_chart",
      "altText": "A bar chart of library books borrowed in one week: Class 5A 24, Class 5B 37, Class 5C 19, Class 5D 12.",
      "data": {
        "labels": ["Class 5A", "Class 5B", "Class 5C", "Class 5D"],
        "values": [24, 37, 19, 12],
        "xAxisLabel": "Class",
        "yAxisLabel": "Books borrowed"
      }
    }
  ],
  "answerKey": {"kind": "number", "value": 31, "tolerance": 0},
  "explanation": "Read the two bars named first and add them: 24 + 19 = 43 books. Then compare with Class 5D by subtracting: 43 - 12 = 31 more books. Using only Class 5A gives 12 and misses half the question.",
  "metadata": {
    "subject": "numeracy",
    "strand": "Statistics and Probability",
    "topic": "Interpreting bar charts",
    "skill": "Combine and compare values read from a bar chart",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 75,
    "tags": ["bar chart", "two-step"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "naplan-y5-numeracy-b02-003",
  "type": "multiple_choice",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A rectangular garden bed is shown. Timber edging is placed around all four sides at a cost of $12 for each metre. What is the total cost of the edging?",
  "options": [
    {"id": "a", "text": "$240"},
    {"id": "b", "text": "$400"},
    {"id": "c", "text": "$1008"},
    {"id": "d", "text": "$480"}
  ],
  "visuals": [
    {
      "id": "visual-naplan-y5-numeracy-b02-003-1",
      "type": "geometry_shape",
      "altText": "A rectangle representing a garden bed, with the longer side measured 14 metres and the shorter side measured 6 metres.",
      "data": {
        "shape": "rectangle",
        "measurements": [
          {"label": "length", "value": 14, "unit": "m"},
          {"label": "width", "value": 6, "unit": "m"}
        ]
      }
    }
  ],
  "answerKey": {"kind": "single_option", "optionId": "d"},
  "explanation": "Edging goes around the outside, so find the perimeter first: 14 + 6 + 14 + 6 = 40 metres. Then multiply by the cost per metre: 40 x 12 = $480. Using only one length and one width gives 20 metres and $240, and multiplying the area of 84 square metres by 12 gives $1008.",
  "metadata": {
    "subject": "numeracy",
    "strand": "Measurement and Geometry",
    "topic": "Perimeter in context",
    "skill": "Find a perimeter from a diagram and apply a unit rate",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 100,
    "tags": ["perimeter", "unit rate", "geometry"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "naplan-y5-numeracy-b02-004",
  "type": "drag_drop",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "Drag each number into the box that describes it.",
  "options": [],
  "interaction": {
    "type": "drag_drop",
    "items": [
      {"id": "item-075", "text": "0.75"},
      {"id": "item-040", "text": "0.4"},
      {"id": "item-125", "text": "1.25"}
    ],
    "zones": [
      {"id": "zone-less", "label": "Less than one half"},
      {"id": "zone-between", "label": "Between one half and one"},
      {"id": "zone-more", "label": "Greater than one"}
    ]
  },
  "visuals": [],
  "answerKey": {
    "kind": "drag_drop",
    "placements": {
      "item-075": "zone-between",
      "item-040": "zone-less",
      "item-125": "zone-more"
    }
  },
  "explanation": "Compare each decimal with 0.5 and with 1. Because 0.4 is smaller than 0.5 it goes in the first box, 0.75 sits between 0.5 and 1, and 1.25 is more than one whole. Writing one half as 0.50 makes the comparisons easier to see.",
  "metadata": {
    "subject": "numeracy",
    "strand": "Number and algebra",
    "topic": "Comparing decimals",
    "skill": "Order decimals against one half and one whole",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 100,
    "tags": ["decimals", "comparing"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### NAPLAN Year 5 — reading

```json
{
  "id": "naplan-y5-reading-b02-001",
  "type": "reading_comprehension",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "Why does Nadia leave the spiral shell on the sand?",
  "stimulus": {
    "title": "The Last Shell",
    "body": "Nadia had been collecting shells since breakfast, and her bucket rattled with them as she walked. She was hunting for one more, something special to finish the row she planned to line up along her windowsill at home.\n\nShe found it near the rock pools: a spiral shell the colour of morning, resting where the tide had left it. It was the finest one she had seen all summer, and there was plenty of room left in her bucket. She crouched down and reached out.\n\nThen she stopped. Something small and dark shifted inside the opening, testing the air with careful legs. A hermit crab had made the shell its home.\n\nNadia sat back on her heels and watched. The crab dragged itself a little way across the wet sand, tipping and righting itself like a tiny boat, until it disappeared beneath a curtain of seaweed.\n\nShe thought about her windowsill, and about a crab with nowhere else to go. Then she stood up, brushed the sand from her knees, and walked back along the beach with her bucket exactly as full as it had been.",
    "attribution": "MindMosaic original"
  },
  "options": [
    {"id": "a", "text": "Her bucket is too full to hold another shell"},
    {"id": "b", "text": "The shell is cracked and not worth keeping"},
    {"id": "c", "text": "A hermit crab is living inside the shell"},
    {"id": "d", "text": "She spots a better shell further along the beach"}
  ],
  "visuals": [],
  "answerKey": {"kind": "single_option", "optionId": "c"},
  "explanation": "Nadia is reaching for the shell until she notices something moving inside it, and the text then names a hermit crab that has made the shell its home. The passage rules out the other reasons: it says there was plenty of room in her bucket, it calls the shell the finest she had seen, and she finds nothing else afterwards.",
  "metadata": {
    "subject": "reading",
    "strand": "Inference",
    "topic": "Character motive",
    "skill": "Infer why a character acts using evidence from the text",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 90,
    "tags": ["inference", "narrative"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### NAPLAN Year 5 — language conventions

```json
{
  "id": "naplan-y5-language-b02-001",
  "type": "fill_blank",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "One word in this sentence is spelled incorrectly. Write the correct spelling of that word: The council will annonce the winner of the garden competition on Friday.",
  "options": [],
  "interaction": {
    "type": "fill_blank",
    "segments": ["Correct spelling: ", ""],
    "blanks": [{"id": "blank-1", "label": "corrected word"}]
  },
  "visuals": [],
  "answerKey": {
    "kind": "fill_blank",
    "blanks": [{"id": "blank-1", "acceptedAnswers": ["announce"]}],
    "caseSensitive": false,
    "trimWhitespace": true
  },
  "explanation": "The word announce needs a double n after the a, because the prefix an- joins a root beginning with n. Saying the word slowly, an-nounce, helps you hear both n sounds.",
  "metadata": {
    "subject": "language_conventions",
    "strand": "Spelling",
    "topic": "Proofreading for spelling",
    "skill": "Identify and correct a misspelled word in a sentence",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 60,
    "tags": ["proofreading", "double letters"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "naplan-y5-language-b02-026",
  "type": "dropdown",
  "yearLevel": 5,
  "examStyle": "naplan_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "Choose the word that makes the sentence grammatically correct: Neither of the twins ____ remembered to bring a raincoat.",
  "options": [],
  "interaction": {
    "type": "dropdown",
    "fields": [
      {
        "id": "field-1",
        "label": "verb",
        "options": [
          {"id": "opt-has", "text": "has"},
          {"id": "opt-have", "text": "have"},
          {"id": "opt-having", "text": "having"}
        ]
      }
    ]
  },
  "visuals": [],
  "answerKey": {
    "kind": "dropdown",
    "fields": [{"id": "field-1", "correctOptionId": "opt-has"}]
  },
  "explanation": "The subject is neither, which is singular even though the plural noun twins follows it. A singular subject takes has, giving 'Neither of the twins has remembered'. The nearby plural noun is what tempts students towards have.",
  "metadata": {
    "subject": "language_conventions",
    "strand": "Grammar",
    "topic": "Subject-verb agreement",
    "skill": "Apply agreement with indefinite pronouns across an intervening phrase",
    "difficulty": "challenging",
    "marks": 1,
    "estimatedTimeSeconds": 60,
    "tags": ["agreement", "pronouns"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### ICAS Year 5 — science

```json
{
  "id": "icas-y5-science-b02-001",
  "type": "true_false",
  "yearLevel": 5,
  "examStyle": "icas_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A student tests how quickly ice melts in three rooms, using a large cube in the warm room and small cubes in the other two. The results can still fairly show which room is warmest.",
  "options": [],
  "visuals": [],
  "answerKey": {"kind": "boolean", "value": false},
  "explanation": "Two things have changed at once: the room and the size of the cube. A large cube takes longer to melt whatever the room, so a slow result in the warm room could be caused by the cube rather than the temperature. Only cube size held constant would make the test fair.",
  "metadata": {
    "subject": "science",
    "strand": "Science inquiry",
    "topic": "Fair testing",
    "skill": "Judge whether a test is fair when two variables change",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 60,
    "tags": ["fair test", "variables"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "icas-y5-science-b02-002",
  "type": "matching",
  "yearLevel": 5,
  "examStyle": "icas_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A class wants to investigate three questions about growing seedlings. Match each question to the one thing they must change in their investigation to answer it.",
  "options": [],
  "interaction": {
    "type": "matching",
    "sources": [
      {"id": "src-light", "text": "Does more light make seedlings grow taller?"},
      {"id": "src-soil", "text": "Does the kind of soil change how fast seeds sprout?"},
      {"id": "src-water", "text": "Does colder water slow down growth?"}
    ],
    "targets": [
      {"id": "tgt-hours", "text": "The number of hours of light each seedling receives"},
      {"id": "tgt-soil", "text": "The kind of soil in each pot"},
      {"id": "tgt-temp", "text": "The temperature of the water given to each seedling"},
      {"id": "tgt-pot", "text": "The size of the pot each seed is planted in"}
    ]
  },
  "visuals": [],
  "answerKey": {
    "kind": "matching",
    "pairs": [
      {"sourceId": "src-light", "targetId": "tgt-hours"},
      {"sourceId": "src-soil", "targetId": "tgt-soil"},
      {"sourceId": "src-water", "targetId": "tgt-temp"}
    ]
  },
  "explanation": "In a fair test you deliberately change only the thing the question asks about and keep everything else the same. Each question names its own variable, so light hours, soil type and water temperature are what to change. Pot size is not asked about, so it is something to hold constant rather than change.",
  "metadata": {
    "subject": "science",
    "strand": "Science inquiry",
    "topic": "Variables in a fair test",
    "skill": "Identify the independent variable for a given investigation question",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 110,
    "tags": ["fair test", "variables", "investigation"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

```json
{
  "id": "icas-y5-science-b02-003",
  "type": "multiple_select",
  "yearLevel": 5,
  "examStyle": "icas_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A pot plant is left in a dark cupboard for two weeks but is still watered. Which TWO changes would you expect to see when it is taken out?",
  "options": [
    {"id": "a", "text": "The leaves have become pale and yellow"},
    {"id": "b", "text": "The stems have grown long and thin"},
    {"id": "c", "text": "The roots have died back completely"},
    {"id": "d", "text": "The plant has produced more flowers"},
    {"id": "e", "text": "The soil has turned to sand"}
  ],
  "visuals": [],
  "answerKey": {"kind": "multiple_options", "optionIds": ["a", "b"]},
  "explanation": "Without light the plant cannot make the green pigment it needs, so leaves lose colour and turn pale. The stems also stretch as the plant grows towards any light it can find. Watering keeps the roots alive, flowering needs more energy rather than less, and soil does not change into sand.",
  "metadata": {
    "subject": "science",
    "strand": "Biological Sciences",
    "topic": "Plant needs",
    "skill": "Predict the effect of removing light from a growing plant",
    "difficulty": "challenging",
    "marks": 1,
    "estimatedTimeSeconds": 90,
    "tags": ["plants", "prediction"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### ICAS Year 5 — digital technologies

```json
{
  "id": "icas-y5-digital_technologies-b02-001",
  "type": "ordering",
  "yearLevel": 5,
  "examStyle": "icas_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "A robot must find a single named book on a shelf of 64 books sorted alphabetically, using as few checks as possible. Put the steps of its search in the most efficient order.",
  "options": [],
  "interaction": {
    "type": "ordering",
    "items": [
      {"id": "item-middle", "text": "Check the book in the middle of the range"},
      {"id": "item-compare", "text": "Compare that book's title with the one being searched for"},
      {"id": "item-discard", "text": "Discard the half of the range that cannot contain the title"},
      {"id": "item-repeat", "text": "Repeat with the half that remains until one book is left"}
    ]
  },
  "visuals": [],
  "answerKey": {
    "kind": "ordering",
    "optionIds": ["item-middle", "item-compare", "item-discard", "item-repeat"]
  },
  "explanation": "Halving the range is only possible once you know which half to keep, so the robot checks the middle book, compares it with the target, then throws away the half that cannot contain it, and repeats. Each pass halves the search, which is far faster than checking books one at a time.",
  "metadata": {
    "subject": "digital_technologies",
    "strand": "Algorithms",
    "topic": "Efficient searching",
    "skill": "Order the steps of a halving search algorithm",
    "difficulty": "challenging",
    "marks": 1,
    "estimatedTimeSeconds": 120,
    "tags": ["algorithm", "searching", "efficiency"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### ICAS Year 5 — spelling

```json
{
  "id": "icas-y5-spelling-b02-001",
  "type": "short_answer",
  "yearLevel": 5,
  "examStyle": "icas_style",
  "status": "draft",
  "origin": "original_seed",
  "prompt": "Add a prefix to the word 'possible' so that it means 'not possible'. Write the complete new word.",
  "options": [],
  "visuals": [],
  "answerKey": {
    "kind": "text",
    "acceptableAnswers": ["impossible"],
    "caseSensitive": false,
    "trimWhitespace": true
  },
  "explanation": "The prefix in- means not, but before a word beginning with p it changes to im- so the word is easier to say. That gives impossible, following the same pattern as impatient and impolite.",
  "metadata": {
    "subject": "spelling",
    "strand": "Morphology and Word Building",
    "topic": "Negative prefixes",
    "skill": "Apply the in-/im- prefix rule before p",
    "difficulty": "medium",
    "marks": 1,
    "estimatedTimeSeconds": 60,
    "tags": ["prefixes", "morphology"],
    "locale": "en-AU",
    "source": "original",
    "schemaVersion": 1
  }
}
```

### Remaining visual shapes

```json
{
  "id": "visual-example-table",
  "type": "table",
  "altText": "A table of rainfall for three towns: Yarra 40 mm over 6 days, Bendigo 25 mm over 9 days, Horsham 32 mm over 4 days.",
  "data": {
    "headers": ["Town", "Rain (mm)", "Rainy days"],
    "rows": [["Yarra", "40", "6"], ["Bendigo", "25", "9"], ["Horsham", "32", "4"]]
  }
}
```

```json
{
  "id": "visual-example-number-line",
  "type": "number_line",
  "altText": "A number line from 0 to 40 with ticks every 5, and dots marked at 15 and 35.",
  "data": {"min": 0, "max": 40, "step": 5, "highlightedValues": [15, 35]}
}
```

```json
{
  "id": "visual-example-pie-chart",
  "type": "pie_chart",
  "altText": "A pie chart of lunch orders: sandwiches 12, salads 6, pasta 9, soup 3.",
  "data": {
    "segments": [
      {"label": "Sandwiches", "value": 12},
      {"label": "Salads", "value": 6},
      {"label": "Pasta", "value": 9},
      {"label": "Soup", "value": 3}
    ]
  }
}
```

```json
{
  "id": "visual-example-line-graph",
  "type": "line_graph",
  "altText": "A line graph of a seedling's height over four weeks: week 1 five centimetres, week 2 nine centimetres, week 3 sixteen centimetres, week 4 twenty centimetres.",
  "data": {
    "points": [
      {"x": 1, "y": 5, "label": "Week 1"},
      {"x": 2, "y": 9, "label": "Week 2"},
      {"x": 3, "y": 16, "label": "Week 3"},
      {"x": 4, "y": 20, "label": "Week 4"}
    ],
    "xAxisLabel": "Week",
    "yAxisLabel": "Height (cm)"
  }
}
```

`geometry_shape` accepts `shape` values `circle`, `triangle`, `rectangle`, `square` and
`polygon`; up to 12 `measurements`, each `{label, value, unit?}` with a positive value; and
for irregular polygons an optional `vertices` array of 3 to 12 `{x, y}` points.

Every ID referenced by an `answerKey` must exist in that question's `options` or
`interaction`. `drag_drop` placements map an item ID to a zone ID.

---

## 10. VERIFY BEFORE WRITING, THEN VERIFY THE FILE

**Never write an incomplete or non-conforming set.** `unresolvedProblems` must be empty before
the file is created. If any required item cannot be completed or validated, **create no file**
and report the blocker instead.

Per question: independently recompute the answer from the prompt and visual data and confirm
it matches the key; for single-option types confirm exactly one option is correct and every
distractor is genuinely wrong; confirm no two options in that question are equivalent.

Across the set: the total count, the three difficulty counts, the section split for language
sets, the permitted-type list and the 60%/85% cap, type diversity, visual count within range,
position balance, `keyLengthExtremeCount`, ID sequence 001 to N, ordering by complexity, and
stimulus grouping of 4–7 questions per text.

Duplicate checking must compare, against both this set and every existing file in the
programme folder: question IDs, normalised prompts, **stimulus bodies**, **visual data
objects**, **answer structures**, and **normalised mathematical templates** (the same
structure with different numbers counts as a duplicate).

**After writing the file, read it back from disk, parse it, and recompute every count, ID,
distribution, answer reference, stimulus grouping and visual relationship from the parsed
file.** If anything fails, delete the file and report — do not leave a bad set on disk.

---

## 11. FILE CONTENTS

The file must contain **strict, parseable JSON only** — no comments, placeholders, ellipses,
trailing commas or Markdown fences. (Your short chat reply is prose; the *file* is JSON only.)

Do not omit any required property. Every question must contain `options` and `visuals` arrays,
even when empty. `stimulus` is required only for `reading_comprehension`. `interaction` is
required only for `fill_blank`, `dropdown`, `matching`, `ordering` and `drag_drop`.
`instructions` is required when a `number_entry` response has a unit. Do not add empty
`stimulus` or `interaction` objects to types that do not use them.

```json
{
  "questions": [],
  "batchSelfReport": {
    "programme": "naplan-y5-numeracy",
    "batch": "b02",
    "targetQuestionCount": 42,
    "timeMinutes": 50,
    "count": 42,
    "singleOptionCount": 0,
    "positionDistribution": {"A": 0, "B": 0, "C": 0, "D": 0},
    "keyLengthExtremeCount": 0,
    "visualQuestionCount": 0,
    "difficultyDistribution": {"easy": 13, "medium": 19, "challenging": 10},
    "typeDistribution": {
      "multiple_choice": 0,
      "multiple_select": 0,
      "number_entry": 0,
      "true_false": 0,
      "short_answer": 0,
      "fill_blank": 0,
      "dropdown": 0,
      "matching": 0,
      "ordering": 0,
      "drag_drop": 0,
      "reading_comprehension": 0
    },
    "equalOptionIssues": 0,
    "readBackVerified": true,
    "unresolvedProblems": []
  }
}
```

Invariants, all of which must hold (N is the programme's question count):
- `targetQuestionCount` and `timeMinutes` match the section 2 row.
- `count` equals the length of `questions` and equals N.
- `singleOptionCount` equals the number of `multiple_choice` plus `reading_comprehension`
  questions, and equals A + B + C + D. A means option ID `"a"`, B `"b"`, C `"c"`, D `"d"`.
- `typeDistribution` lists every permitted type including zeros, and its values total N.
- `keyLengthExtremeCount` ≤ `floor(0.35 × singleOptionCount)`.
- `visualQuestionCount` counts questions with at least one visual, inside the programme range.
- `difficultyDistribution` matches the section 2 row and totals N.
- `readBackVerified` is `true` only after the on-disk file was re-parsed and re-checked.
- `unresolvedProblems` is empty — otherwise no file should exist.

---

## 12. WRITING INTO THE REPO

### The only permitted location

```
content/manual-questions/grade-<3|5>/<naplan|icas>/<programme-slug>/<programme-slug>-<batch>.json
```

Example: `content/manual-questions/grade-5/naplan/naplan-y5-numeracy/naplan-y5-numeracy-b02.json`
The `<naplan|icas>` folder is the exam prefix of the slug. Do NOT create a flat
`grade-5/<programme>/` folder — always nest under the exam folder.

### Never touch

`src/**` (especially `src/content/questions/**` and `src/schemas/**`), `scripts/**`,
`content/question-factory/**`, `docs/**`, `.github/**`, `.vscode/**`, any `.env*` file,
`package.json`, any config file, the `*-b00-PLACEHOLDER.json` files, or any existing batch
file. Never overwrite or edit a file you did not create in this run.

### Git — do nothing

Run no git command: no staging, committing, branching, merging, pushing or reverting. Writing
the file is the whole job; a human reviews and commits.

### Before generating

List the existing `*.json` files in the target programme folder. Choose the batch code one
higher than the highest existing `bNN`, starting at `b01` if only the placeholder exists, and
confirm the filename does not already exist. Read the existing files and collect every used
ID, prompt, stimulus body, visual data object and mathematical template for the duplicate
checks in section 10.

### After writing

Reply briefly with the file path, the batch code, the `batchSelfReport` values, and
confirmation that read-back verification passed. The file is the deliverable.

---

## REQUIRED: batchMeta provenance header (added 2026-08-10)

Every batch file MUST begin with a `batchMeta` object as its FIRST key, so anyone opening the
file sees who made it and its status at a glance:

```json
{
  "batchMeta": {
    "batch": "<slug>-bNN",
    "programme": "<slug>",
    "generatedBy": "<your real model name: codex | qwen | mistral — NEVER claude>",
    "generatedAt": "<date>",
    "reviewStatus": "generated",
    "auditedBy": null,
    "auditVerdict": null,
    "auditNotes": "",
    "provenanceNote": ""
  },
  "questions": [ ... ],
  "batchSelfReport": { ... }
}
```

State your OWN model name honestly in `generatedBy`. Claude is the FINAL REVIEWER only and is
never a generator or a routine auditor — do not label your work `claude`. The auditor later
fills `auditedBy` / `auditVerdict` / `auditNotes` and advances `reviewStatus` through
generated -> gates_passed -> audited_pass|audited_reject -> ready_for_final_review -> promoted.

---

## VISUAL QUOTA — SUPERSEDED (2026-08-10): ceiling, not floor

The "Visual questions" numbers in the section-2 table are now a **CEILING, not a floor**.
Three consecutive batches manufactured fake visuals to hit a floor, so the rule is inverted:

- A visual is allowed ONLY when the question genuinely cannot be answered without reading it
  (extract a value from a chart, compare rows in a table, read a diagram). It must be reasoned
  FROM — never a lookup that restates the answer, and never decorative.
- If a question is answerable without the visual, it has NO visual. **Zero visuals in a batch
  is perfectly acceptable** if none are genuinely required.
- Do not add a table that repeats the answer (e.g. "Which organ absorbs oxygen?" beside a row
  "Lungs — absorb oxygen"). That is an automatic audit reject.
- Every highlighted value on a number_line must sit exactly on a tick; every chart's data must
  be necessary to the question. An auditor will reject any visual that fails this.

Report `visualQuestionCount` as before, but it is now "how many questions genuinely needed a
visual", with no minimum. Quality of each visual matters; quantity does not.

---

## MACHINE GATES — CORRECTION (2026-08-10)

`npm run check:answers` and `npm run validate:questions` run ONLY against the built production
bank (src/**). They cannot take a staging file, so they are NOT staging gates. Do not run them
on a staging batch and do not edit src/** to make them pass.

STAGING gates the generator runs on its own file (all of these operate on the JSON file only):
1. Schema — run a THROWAWAY tsx script (place it in /tmp or a scratch path, NEVER in src/**)
   that imports the live schema and validates each question:
   `import { questionSchema } from "<repo>/src/schemas/question.schema"` then `safeParse` every
   item; all must pass. Delete the throwaway after.
2. Duplicate — ids, normalised prompts, stimulus bodies, visual data, normalised maths
   templates: within the batch AND against existing files in the programme folder.
3. Answer-position balance — single-option types: max−min ≤ 1, every position used; after ANY
   rebalance, re-solve every changed question.
Record these three in batchSelfReport.machineGates and set reviewStatus "gates_passed".

CORRECTNESS is covered by (a) your own per-question re-solve before writing keys, (b) the
cross-model blind audit, and (c) `check:answers` at PROMOTION time, when Claude runs it over
the full bank including the new content. A wrong key that is machine-derivable is caught at
promotion; conceptual wrong keys are caught by the cross-model audit. You are NOT required to
run check:answers at staging — its absence there is expected.
