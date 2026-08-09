# NAPLAN & ICAS — Framework Reference

Reference detail on both assessments, compiled from official sources (ACARA/NAP,
ICAS Assessments) and reputable secondary guides. **Compiled 2026-08-08.**

> Figures marked *(approx.)* are not uniformly published by the assessing bodies
> and are drawn from secondary guides — treat as indicative, confirm against the
> official site before relying on them. Exact question counts and per-test
> timings in particular are not consistently published and vary by year/form.
>
> MindMosaic generates **original** practice aligned to the *style* of these
> assessments. It does not reproduce official questions. NAPLAN, ICAS, AMC and
> selective-entry names describe style only.

---

## NAPLAN (National Assessment Program — Literacy and Numeracy)

- **Owner:** ACARA (Australian Curriculum, Assessment and Reporting Authority).
- **Who sits it:** all Australian students in **Years 3, 5, 7 and 9**. No Year 4
  or Year 6 NAPLAN.
- **When:** an annual national test window of ~2 weeks in **March** (moved from
  May in 2023). Results released in **Term 3**.
- **Delivery:** online, using a **tailored (adaptive) test design** — the
  questions a student sees adjust to their responses — **except Year 3 Writing,
  which is on paper (handwritten)**.

### The four domains

| Domain | Covers |
|---|---|
| **Reading** | Comprehension and interpretation of a range of texts (a reading magazine of stimulus texts + questions) |
| **Writing** | One extended text — **narrative or persuasive** — from a common prompt/stimulus, marked against a 10-criterion rubric |
| **Conventions of Language** | **Spelling** + **grammar and punctuation** |
| **Numeracy** | Number & algebra; measurement & geometry; statistics & probability |

### Year 3 specifics (timing *(approx.)*)

| Test | Time | Notes |
|---|---|---|
| Writing | ~40 min | Paper, handwritten; narrative or persuasive from a picture/text prompt |
| Reading | ~45 min | Comprehension across a stimulus magazine (short stories, letters, signs, articles) |
| Conventions of Language | ~45 min | Multiple choice + single-word spelling corrections; grammar (tense, parts of speech), punctuation |
| Numeracy | ~45 min | **No calculator at Year 3**; many word-based questions; addition/subtraction/multiplication/division, patterns, space, graph reading, analog clock |

Question formats: multiple choice (usually four options), short constructed/
numeric response, spelling error-correction, and cloze/fill-the-blank.

### Reporting — four proficiency standards (since 2023)

Replaced the former 10-band scale and the National Minimum Standard. Each
student is placed in one of four levels per domain:

| Level | Meaning |
|---|---|
| **Exceeding** | Proficiency well above expectation for the year level |
| **Strong** | At the expected level for the year level |
| **Developing** | Working towards the expected level (not a "fail") |
| **Needs additional support** | Below the expected level; likely needs targeted help |

---

## ICAS (International Competitions and Assessments for Schools)

- **Owner:** ICAS Assessments (formerly UNSW Global / Educational Assessment
  Australia).
- **Nature:** an academic **competition** pitched **above grade level** —
  rewards higher-order reasoning, not curriculum recall.
- **When:** annual, sat at school within a sitting window (Term 3, roughly
  **August–September** in Australia).
- **Delivery:** online, auto-marked for most subjects. **Writing** is
  rubric-marked; **Spelling Bee** is **dictation/audio-based**.
- **Format:** predominantly **multiple choice** for the auto-marked subjects;
  *(approx.)* ~30–50 questions and ~35–60 minutes per paper depending on subject
  and year (primary papers shorter). Exact counts not uniformly published.

### The six subjects and year ranges

| Subject | Year range | Covers |
|---|---|---|
| **English** | Yr 2–12 | Reading comprehension, language conventions, writer's craft, vocabulary, syntax |
| **Mathematics** | Yr 2–12 | Number, arithmetic, patterns, pre-algebra, measurement, space, shape, geometry — reasoning-led |
| **Science** | Yr 2–12 | Observing/measuring, investigating, interpreting, predicting/concluding, reasoning; life & living, energy & change, materials |
| **Digital Technologies** | Yr 2–7 | Computational thinking, data, digital systems, operations, safe use |
| **Writing** | Yr 3–12 | Composition marked on genre, textual grammar, syntax/punctuation |
| **Spelling Bee** | Yr 2–7 | Dictation, spelling rules/conventions, error correction; common → unusual words |

### Awards — percentile-based, relative to same country + year + subject

Bands are **relative** (ranked against all participants), so thresholds shift
year to year. Percentiles per ICAS Assessments:

| Award | Share of participants |
|---|---|
| **High Distinction** | Top **1%** |
| **Distinction** | Next **10%** |
| **Credit** | Next **25%** |
| **Merit** | Next **10%** |
| **Participation** | All remaining entrants |
| **Medal** | Top scorer in a region/year/subject (highest achievers) |

> ICAS states award names and thresholds can change — confirm on the official
> site each year.

---

## How this maps to MindMosaic programmes

| MindMosaic programme | Maps to |
|---|---|
| `naplan-*-numeracy` | NAPLAN Numeracy |
| `naplan-*-reading` | NAPLAN Reading |
| `naplan-*-language` | NAPLAN Conventions of Language |
| (NAPLAN Writing) | Deferred — rubric-marked, manual-review path |
| `icas-*-numeracy` | ICAS Mathematics |
| `icas-*-reading` | ICAS English (reading half) |
| `icas-*-language` | ICAS English (language conventions half) |
| `icas-*-science` | ICAS Science |
| `icas-*-digital_technologies` | ICAS Digital Technologies |
| `icas-*-spelling` | ICAS Spelling Bee (delivered text-based, not audio — platform has no dictation) |
| (ICAS Writing) | Deferred — rubric-marked |

Year coverage that matters for the platform:
- NAPLAN programmes are valid **only** at Years 3, 5, 7, 9.
- ICAS Digital Technologies and Spelling Bee stop at **Year 7** — they must not
  be offered at Years 8+.
- ICAS Science, English and Mathematics run to Year 12.

## Sources

- NAPLAN — ACARA: https://www.acara.edu.au/assessment/naplan
- NAPLAN Year 3 structure (Matrix): https://www.matrix.edu.au/naplan-year-3-parents-guide/naplan-year-3-what-is-in-the-test/
- NAPLAN proficiency standards (Excel Test Zone): https://www.exceltestzone.com.au/post/understanding-naplan-results-proficiency-standards
- ICAS subjects: https://www.icasassessments.com/products-icas/subjects/
- ICAS Year 3: https://www.icasassessments.com/icas-year-3-test/
- ICAS grades & scores: https://www.icasassessments.com/blog/icas-grades-and-scores/
- ICAS awards (PrepPath): https://preppath.com.au/guides/icas-results-and-awards
