# Exam Patterns — full-length practice paper shapes

Defines the **shape** of a full-length practice paper per programme — question count, time
limit, composition constraints. Questions are drawn **live from the published bank** at
sitting time; patterns are fixed, questions are not.

**Updated 2026-08-09 (v3).** Supersedes v2, whose fidelity claims were overstated, whose ICAS
English split was presented as official, and whose config could not enforce the shapes it
declared.

> **These are practice papers, not exams.** Never label anything here a "real paper", an
> "official paper", or a "simulation". Every pattern carries explicit `adaptations` describing
> where it departs from the real assessment. See `exam-fidelity-backlog.md`.

---

## 1. Fidelity model

Fidelity is three independent properties, not one label:

```ts
presentation: "full_length_practice" | "practice_module";
basis: "official_length_and_time" | "internal";
adaptations: Array<
  | "fixed_path"            // real NAPLAN is adaptive; ours is a fixed path
  | "text_only_spelling"    // no audio dictation available
  | "no_section_lock"       // cannot prevent returning to a completed section
  | "internal_english_mix"  // ICAS English area split is ours, not published
>;
```

`basis: "official_length_and_time"` means only that the **count and duration** match the
published figures. It never means the paper's internal structure is authentic.

UI labels take the form **"NAPLAN-style Year 5 Numeracy — full-length practice"** or
**"ICAS-style Year 5 English — full-length practice"**. Practice modules read
**"ICAS-style Year 5 Reading — practice module"**.

---

## 2. NAPLAN — Years 3 and 5

Counts follow the latest published NAPLAN technical blueprint (2025); the 2026 technical
report is not yet published. All NAPLAN patterns carry `fixed_path`, and language additionally
carries `text_only_spelling` and `no_section_lock`.

| Programme | Questions | Time | Composition |
|---|---:|---:|---|
| `naplan-y3-numeracy` | 36 | 45 min | number & algebra, measurement & geometry, statistics & probability; no calculator |
| `naplan-y3-reading` | 39 | 45 min | 6–7 stimulus texts, 4–7 questions each |
| `naplan-y3-language` | 52 | 45 min | 25 spelling, then 27 grammar & punctuation |
| `naplan-y5-numeracy` | 42 | 50 min | as Year 3, extended |
| `naplan-y5-reading` | 39 | 50 min | ~6 stimulus texts, 4–7 questions each |
| `naplan-y5-language` | 52 | 45 min | 25 spelling, then 27 grammar & punctuation |
| `naplan-y3-writing` | 1 task | **40 min** | ⏸️ deferred — rubric-marked |
| `naplan-y5-writing` | 1 task | **42 min** | ⏸️ deferred — rubric-marked |

**Spelling adaptation.** A real 25-item NAPLAN spelling pathway is **16 audio-dictation items
plus 9 proofreading items**. The platform has no audio, so all 25 are delivered as text-based
proofreading and error-correction. This is an adaptation, not an equivalent.

**Section locking.** Officially the spelling section locks once grammar & punctuation begins.
Not supported — patterns order the sections but cannot lock them (`no_section_lock`).

**Grammar/punctuation subdivision.** The real split is roughly 18–19 grammar and 8–9
punctuation. The registered `language_conventions` strands are `Spelling`, `Punctuation` and
`Grammar` — **`Punctuation` IS registered** (an earlier revision of this doc wrongly said it
was missing). The subdivision is therefore enforceable, but is **deliberately not enforced
yet**: the bank does not hold enough punctuation-tagged items to fill 8–9 per paper across
three papers. Patterns currently enforce only spelling vs grammar-and-punctuation; tighten
once the punctuation bank is deep enough.

## 3. ICAS — Year 3 (Paper A) and Year 5 (Paper C)

Australia maps **Year 3 → Paper A**, **Year 5 → Paper C**. Counts and times are the official
published figures (see references).

| Assessment | Year 3 / Paper A | Year 5 / Paper C |
|---|---|---|
| English | 45 questions — 45 min | 50 questions — 50 min |
| Mathematics | 40 — 45 min | 40 — 45 min |
| Science | 30 — 45 min | 40 — 55 min |
| Digital Technologies | 30 — 30 min | 35 — 35 min |
| Spelling Bee | 40 — 40 min | 45 — 40 min |
| Writing | 1 task — 35 min | 1 task — 35 min ⏸️ deferred |

**ICAS Spelling Bee is also an adaptation.** The official Spelling Bee requires audio and
headphones. The platform delivers it as text, so ICAS spelling patterns carry
`text_only_spelling` exactly as NAPLAN language does.

### ICAS English — one assessment, internally composed

There is no official separate ICAS reading or language paper. One English assessment covers
text comprehension, writer's craft, syntax and vocabulary. The framework confirms those four
areas but **does not publish item counts per area**.

The platform stores the content in two programmes and draws one combined English paper from
both:

| Pattern | Draws from | Total | Time |
|---|---|---:|---:|
| `icas-y3-english-full` | `icas-y3-reading` 27 + `icas-y3-language` 18 | 45 | 45 min |
| `icas-y5-english-full` | `icas-y5-reading` 30 + `icas-y5-language` 20 | 50 | 50 min |

> **The 27/18 and 30/20 allocations are MindMosaic internal composition controls, not official
> ICAS section counts.** They are **source-bank quotas** used to build one combined paper.
> They must **not** be displayed to the user as two exam sections — the child sits a single
> undivided English paper. These patterns carry `internal_english_mix`.

A reading-only or language-only paper is a `practice_module`, never an English paper.

---

## 4. Config shape

```ts
interface ExamPattern {
  id: string;                    // "icas-y5-english-full"
  label: string;                 // "ICAS-style Year 5 English — full-length practice"
  examStyle: "naplan_style" | "icas_style";
  yearLevel: 3 | 5;

  presentation: "full_length_practice" | "practice_module";
  basis: "official_length_and_time" | "internal";
  adaptations: Adaptation[];

  questionCount: number;
  timeMinutes: number;

  // Source-bank quotas. `display` decides whether the user ever sees a boundary.
  sources: Array<{
    id: string;
    programmeId: string;
    count: number;
    filters?: { strandIn?: string[]; typeIn?: string[]; difficultyMix?: Record<string, number> };
    display: "merged" | "section";   // ICAS English = "merged"; NAPLAN language = "section"
  }>;

  // Ordered, user-visible sections (only where display === "section").
  sectionOrder?: Array<{ id: string; label: string; sourceIds: string[]; locked: boolean }>;

  // Reading papers: questions sharing a stimulus must be selected as a whole group.
  stimulusRule?: {
    selectWholeGroup: true;
    questionsPerStimulus: [number, number];  // [4, 7]
    distinctStimuli: [number, number];       // Y3 [6, 7], Y5 [6, 6]
  };
}
```

Note: earlier drafts referred to `drawsFrom`; the field is **`sources`**. Do not reintroduce
`drawsFrom` or `programmeIds`.

**Selection must honour the stimulus rule.** Reading questions are grouped by their stimulus
and selected group-at-a-time — never individually. Selecting individually produces orphaned
questions from a passage, or the same passage twice in one paper.

Not yet expressible, and deliberately out of scope until the backlog lands: NAPLAN's three
testlets, grammar-vs-punctuation proportions, and proficiency-strand balance.

---

## 5. Bank depth for three distinct papers

Three times the paper size is **necessary but not sufficient** — sub-quotas and stimulus
groups bind first.

| Programme | Paper | 3 papers need | Binding sub-requirement |
|---|---:|---:|---|
| `naplan-y3-numeracy` | 36 | 108 | strand spread |
| `naplan-y5-numeracy` | 42 | 126 | strand spread |
| `naplan-y3-reading` | 39 | 117 | **18–21 non-overlapping stimulus texts** |
| `naplan-y5-reading` | 39 | 117 | **18 non-overlapping stimulus texts** |
| `naplan-y3/y5-language` | 52 | 156 | **75 spelling + 81 grammar & punctuation** |
| ICAS Y3 English | 45 | 135 | 81 reading + 54 language |
| ICAS Y5 English | 50 | 150 | 90 reading + 60 language |
| `icas-y3/y5-numeracy` | 40 | 120 | strand spread |
| `icas-y3-science` | 30 | 90 | — |
| `icas-y5-science` | 40 | 120 | — |
| `icas-y3-digital_technologies` | 30 | 90 | — |
| `icas-y5-digital_technologies` | 35 | 105 | — |
| `icas-y3-spelling` | 40 | 120 | — |
| `icas-y5-spelling` | 45 | 135 | — |

**Distinct seeds do not guarantee distinct papers.** Independent seeded draws from one bank
overlap. Three genuinely non-overlapping papers require **stable form partitioning** (assign
each eligible question to form A, B or C once and draw within the form) or an **explicit
exclusion list** carried across sittings. Implement one of these; do not rely on seed variation.

## 6. Underfilled banks — no partial full-length papers

If every count and composition constraint cannot be satisfied, **do not start the
full-length pattern.** The engine may instead offer the available questions as a clearly
labelled `practice_module` with a recalculated question count and a proportionally
recalculated time. It must never present a short paper as the full-length pattern, and never
pad with draft or ungated questions.

---

## 7. References

- NAPLAN 2025 Technical Report (test lengths and pathway composition; see Tables 8–10 and
  22–23): https://www.nap.edu.au/docs/default-source/naplan/naplan-2025-technical-report.pdf
- NAPLAN 2026 test window and per-test timings:
  https://www.nap.edu.au/naplan/key-dates/naplan-test-window
- ICAS year levels, paper mapping, question counts and test times:
  https://www.icasassessments.com/
- ICAS 2026 Test Supervision Instructions (counts, durations, audio/headphone requirements):
  https://www.icasassessments.com/wp-content/uploads/icas-test-supervision-instructions_ICASassessments.pdf
- ICAS English Assessment Framework (four assessed areas; no published per-area item counts):
  https://www.icasassessments.com/wp-content/uploads/2024_Reach-and-ICAS-Framework-English.pdf
