# MindMosaic — Exam Content Status

Status of practice-question content by exam, year and subject.
**Last updated: 2026-08-08 (post Grade 3 ingest).**

## Official exam scope (verified against ACARA/NAP and ICAS Assessments, 2026-08-08)

- **NAPLAN** — 4 domains: Reading, Writing, Language Conventions
  (spelling + grammar + punctuation), Numeracy. Sat at **Years 3, 5, 7, 9 only**
  — no Year 4 or Year 6 NAPLAN.
- **ICAS** — 6 subjects: English (Yr 2–12), Mathematics (2–12), Science (2–12),
  Digital Technologies (2–7), Writing (3–12), Spelling Bee (2–7).
  ICAS "English" is split into **Reading** and **Language Conventions**;
  ICAS "Mathematics" maps to **Numeracy**.

## Legend

✅ live & exam-ready (≥30 gated) · 🟡 live, below 30 · ⚠️ generated but lost
(only in Vish's downloads) · ⬜ not started · ⏸️ deferred (Writing, rubric-marked)
· ❌ excluded (not on official list). Threshold: `GATED_COVERAGE_THRESHOLD = 30`.

---

## Grade 3 — INGESTED 2026-08-08 (201 of 217; curated bank 100 → 301)

| Exam | Subject | Gated | Status |
|---|---|---:|---|
| NAPLAN | Numeracy | 64 | ✅ |
| NAPLAN | Reading | 33 | ✅ |
| NAPLAN | Language Conventions | 34 | ✅ |
| NAPLAN | Writing | — | ⏸️ |
| ICAS | Numeracy (Maths) | 37 | ✅ |
| ICAS | Reading (English) | 37 | ✅ |
| ICAS | Language Conventions | 18 | 🟡 → 34 once 16 pilot drafts promoted |
| ICAS | Science | 35 | ✅ |
| ICAS | Digital Technologies | 34 | ✅ |
| ICAS | Spelling | 36 | ✅ |
| ICAS | Writing | — | ⏸️ |

**8 of 9 programmes exam-ready.** ICAS Language is at 18 because its 16 pilot
items carry `status:"draft"`; promoting them (passed two reviews + gate runs
r2/r3/r4) → 34. All green: 3580 tests, typecheck, lint, build,
validate:questions, check:answers. Uncommitted. published-manifests /
batch-published.json untouched (curated route, no gate hashes). Spelling wired
through SubjectFilter / REGISTRY_SUBJECT_BY_FILTER / coverage. 4 check:answers
flags were false positives (two-step derivations); checker fixed, not content.

---

## Grade 5

| Exam | Subject | Gated | Status |
|---|---|---:|---|
| NAPLAN | Numeracy | 91 | ✅ |
| NAPLAN | Reading | 56 | ✅ |
| NAPLAN | Language Conventions | 40 | ✅ |
| NAPLAN | Writing | — | ⏸️ |
| ICAS | Numeracy (Maths) | 39 | ✅ |
| ICAS | Reading (English) | 18 | 🟡 short 12 — ~13 more generated round 2, ⚠️ lost |
| ICAS | Language Conventions | 13 | 🟡 short 17 — ~15 more generated round 2, ⚠️ lost |
| ICAS | Science | 0 | ⬜ |
| ICAS | Digital Technologies | 0 | ⬜ |
| ICAS | Spelling | 0 | ⬜ |
| ICAS | Writing | — | ⏸️ |

---

## Grade 4 — ICAS only (no NAPLAN at Year 4)

| Subject | Gated | Status |
|---|---:|---|
| Numeracy | 0 | ⚠️ ~31 generated (rounds 3–4), lost — only in downloads |
| Reading | 0 | ⚠️ ~30 generated, lost |
| Language Conventions | 0 | ⚠️ ~31 generated, lost |
| Science | 0 | ⬜ |
| Digital Technologies | 0 | ⬜ |
| Spelling | 0 | ⬜ |
| Writing | — | ⏸️ |

Taxonomy for Year 4 (ICAS-only) exists (87 entries).

---

## Grade 6 — ICAS only (no NAPLAN at Year 6)

| Subject | Gated | Status |
|---|---:|---|
| Numeracy | 0 | ⚠️ ~30 generated (rounds 3–4), lost |
| Reading | 0 | ⚠️ ~29 generated, lost |
| Language Conventions | 0 | ⚠️ ~31 generated, lost |
| Science | 0 | ⬜ |
| Digital Technologies | 0 | ⬜ (ICAS DigiTech Yr 2–7 — Year 6 in range) |
| Spelling | 0 | ⬜ (ICAS Spelling Yr 2–7 — Year 6 in range) |
| Writing | — | ⏸️ |

Taxonomy for Year 6 (ICAS-only) exists (75 entries).

---

## Not built, by decision

- **Writing (NAPLAN and ICAS, all years)** — single rubric-marked piece, not
  auto-markable; belongs in the essay / manual-review path. ⏸️
- **ICAS "Critical & Creative Thinking"** — legacy taxonomy entries exist, but
  not on ICAS's current official list. ❌ excluded pending explicit decision.

---

## Cross-cutting items (engineering, not content)

1. **Nothing generated since 2026-08-05 is committed.** `main` at `f72a6b6`;
   taxonomy extension, option-order rebalance, Year-4/6 wiring and the Grade 3
   ingest all sit uncommitted.
2. **Provenance** — 63 published manifests edited (bias remediation) without
   rehashing `contentHash`; agreed fix is revert + redo via revision pipeline.
   factory-published bias still live at 77%/47% until that is redone.
3. **Lost content** — rounds 2–4 (Grade 5 top-ups + all Grade 4/6, ~239
   questions) exist only in Vish's downloads after a container rollback.
4. **Coverage analytics** — 192 curated skill labels unmapped to factory
   taxonomy (ratcheted); 21 strand labels have near-duplicates needing
   consolidation.
