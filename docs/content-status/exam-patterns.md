# Exam Patterns — official-aligned paper shapes

Defines the **shape** of a full practice exam per programme — question count,
time limit, and section mix — matching the real NAPLAN / ICAS papers. Questions
are drawn **live from the published bank** at sitting time to fit the pattern;
patterns are fixed, questions are not.

**Compiled 2026-08-08.** See `exam-frameworks-reference.md` for the source
detail.

> **Confidence note.** Official **timings** are published and used verbatim
> below. Official **question counts** are *not* consistently published by ACARA
> or ICAS; the counts here are the widely-cited real-paper approximations and
> are marked *(approx.)*. Tune them once confirmed. A pattern must never request
> more questions than the programme's gated bank holds — the engine should cap
> and report, not silently shrink.

---

## NAPLAN — Year 3

| Programme | Questions | Time | Section mix |
|---|---:|---:|---|
| `naplan-y3-numeracy` | 36 *(approx.)* | 45 min | number & algebra, measurement & geometry, statistics & probability; no calculator |
| `naplan-y3-reading` | 39 *(approx.)* | 45 min | comprehension across mixed stimulus texts |
| `naplan-y3-language` | 50 *(approx.)* | 45 min | ~25 spelling + ~25 grammar & punctuation |
| NAPLAN Writing | 1 task | 40 min | ⏸️ deferred — rubric-marked, manual path; not an auto-markable pattern |

## ICAS — Year 3

| Programme | Questions | Time | Notes |
|---|---:|---:|---|
| `icas-y3-numeracy` (Maths) | 35 *(approx.)* | 45 min | reasoning-led, above grade level |
| `icas-y3-reading` + `icas-y3-language` | 40 *(approx.)* | 45 min | **one official ICAS English paper** spans both — see decision below |
| `icas-y3-science` | 35 *(approx.)* | 45 min | interpret data, investigate, reason |
| `icas-y3-digital_technologies` | 35 *(approx.)* | 45 min | algorithms, data, systems, safe use |
| `icas-y3-spelling` | 30 *(approx.)* | 30 min | official Spelling Bee is audio dictation; platform delivers text-based |
| ICAS Writing | 1 task | — | ⏸️ deferred — rubric-marked |

---

## Design decisions needed before wiring

1. **ICAS English is one paper, two programmes here.** The authentic ICAS
   English exam covers reading *and* language conventions together. The platform
   models them as separate programmes. Options:
   - **(a)** An `icas-y3-english` exam pattern that draws from both banks
     (~20 reading + ~20 language) — authentic to the real paper. *(recommended)*
   - **(b)** Separate reading-only and language-only practice papers — not how
     ICAS actually runs, but simpler and matches the current programme split.
   Recommend building (a) as the "real exam" and keeping per-programme practice
   as the lighter option.

2. **Three distinct sittings.** To draw 3 non-overlapping papers, a programme
   needs ≈ 3 × its pattern size in gated questions (e.g. NAPLAN language at 50/
   paper needs ~150 for three fully-distinct sittings; 90 gives three papers
   with limited overlap). Current depth generation targets 90/programme — enough
   for three papers with modest overlap, not three fully-disjoint ones. Flag if
   you want fully-disjoint (much larger bank).

---

## Proposed config shape (for the engine)

A data-driven pattern the exam engine reads (illustrative — Claude Code to place
in `src/features/exam-engine/` and wire into selection + the configurator):

```ts
interface ExamPattern {
  id: string;              // "naplan-y3-numeracy-full"
  programmeId: string;     // "naplan-y3-numeracy"  (or multiple, for ICAS English)
  label: string;           // "NAPLAN Year 3 Numeracy — full paper"
  questionCount: number;   // 36
  timeMinutes: number;     // 45
  sections?: Array<{       // optional strand/type quota within the paper
    label: string;
    subjectOrStrand: string;
    count: number;
  }>;
  drawsFrom: string[];     // programme ids the questions are pulled from
}
```

The runtime already selects questions deterministically by seed; a pattern just
fixes `questionCount` and `timeMinutes` (instead of the child choosing them) and
optionally enforces a section mix. If the bank can't fill the pattern, cap to
available and surface "N of M — not enough gated questions yet", never pad with
unreviewed seeds.
