# Curriculum Learning — repo audit and plan (2026-08-28)

Audited from the working tree at `3cbb57b` on `gemini/curriculum-catalogue-planning`
(one commit ahead of `main @ 82af884`). Static analysis only — see "gate" below.

Companion artifact: https://claude.ai/code/artifact/67a74e80-8f24-4041-aefc-6bcf4d9ba68f

---

## 1. Repo state

Three agents have produced curriculum artefacts this month and none are merged.

- **Working tree:** 33 modified files (+1,068 / −290) plus 107 untracked files (76 real
  work, the rest a vendored `.agent/` skill) across nine new directories: `docs/product-audit/` (18 files), `docs/content-platform-v2/`
  (12 files), `docs/adr/015-database-authoring-control-plane.md`,
  `src/features/content-platform/` (13 files), `src/features/curriculum/` (4 files),
  `src/features/exam-engine/recommendation/` (5 files), `schemas/`, `.agent/`,
  3 new scripts (`mm-content`, `content:schema`, `content:quality-pilots`).
- **Committed on this branch:** only the curriculum research pack (15 files, 2,079 lines).
- **`codex/curriculum-platform-foundation`** points at the same SHA as `main`; its work
  lives in a second worktree (`mindmosaic-exam-engine-codex-curriculum`).

### Findings, worst first

| # | Finding | Severity |
|---|---|---|
| 1 | No question carries a curriculum code. `question.schema.ts` has free-text `strand`/`topic`/`skill` only — 342 distinct skill strings, 269 topics, colliding strands ("Number & Arithmetic" vs "Number and algebra"). Coverage per curriculum node is uncomputable. | **Blocker** |
| 2 | Grade 5 bank is a third of Grade 3: 173 curated vs 832. G5 NAPLAN Reading 11, Language 11, Numeracy 16; ICAS English 7. | **Blocker** |
| 3 | Curriculum mocks cover 24 of 104 real VIC nodes (23%). Codes present are correct — VC2M3N01–N04 verified against source, including the "beyond 10 000" correction. | Scope gap |
| 4 | `/learn` and `/resources` already market "structured Australian Curriculum pathways" and "explanations, worked examples and skill lessons". Behind them: 9 static guides in `content.ts`. | Reality gap |
| 5 | `src/features/curriculum/` (609 lines of Zod contracts) is imported only by `src/schemas/platform/common.ts`, and only for the jurisdiction enum. `CurriculumCatalogue` has no implementation. | Integration |
| 6 | `/student/learn` (393 lines) is real and its lesson list is a deliberate, documented empty state — lessons drop in with no other change. | **Ready** |
| 7 | Product audit's headline numbers verified: 1,005 curated + 288 generated = 1,293. `middleware.ts` → `proxy.ts` is the correct Next 16 rename (repo on 16.2.10). No fabricated figures found. | Verified |

### Gate — not run

`node_modules` holds Windows esbuild binaries, so every `tsx`-based script
(`validate:questions`, `check:answers`, all `questions:*`) fails in the Linux bridge
shell. `tsc --noEmit` runs but exceeds the bridge's 45s per-call ceiling, and background
jobs are killed between calls. **The gate needs one run in a Windows terminal before this
tree is trusted.**

---

## 2. The two numbers that shape the plan

### Victorian Curriculum 2.0 node count (verified)

| Learning area | Level | Codes | In mocks | Gap |
|---|---|--:|--:|--:|
| Mathematics | Level 3 | 24 | 9 | 15 |
| Mathematics | Level 5 | 24 | 7 | 17 |
| English | Level 3 | 30 | 5 | 25 |
| English | Level 5 | 26 | 3 | 23 |
| **Total** | | **104** | **24** | **80** |

Maths counts verified against published Level 3 / Level 5 content descriptions; English
against a Years 3–6 v2.0 alignment guide. Worth one pass against the VCAA site directly
before they become a target.

### Curated bank by subject

| Subject | Grade 3 | Grade 5 |
|---|--:|--:|
| ICAS English | 196 | 7 |
| ICAS Science | 99 | — |
| ICAS Digital Technologies | 98 | 35 |
| ICAS Spelling | 98 | 45 |
| ICAS Numeracy | 94 | — |
| ICAS Mathematics | 7 | 48 |
| NAPLAN Reading | 90 | 11 |
| NAPLAN Numeracy | 78 | 16 |
| NAPLAN Language | 72 | 11 |
| **Curated total** | **832** | **173** |

Plus 288 in the assembled generated bank (~49 Y3, ~239 Y5 per the product audit).

---

## 3. Design — three layers, one spine, no second pipeline

- **Spine:** VCAA codes as normalised nodes. Codex's `src/features/curriculum/contracts.ts`
  already models sources, releases, nodes, applicabilities and crosswalks correctly. Wire
  it, don't rewrite it.
- **Parent layer:** Antigravity's `ParentCurriculumCard` — plain English, home activities,
  honest practice status, outbound VCAA link. Presentation-only, deliberately separate
  from the runtime contract. That separation is right; keep it.
- **Student layer (missing):** lessons, worked examples, ordered pathways ending in a drill
  from the existing bank.

### Lesson schema sketch

```
Lesson {
  lessonId, curriculumCodes[],          // e.g. ["VC2M3N02"]
  jurisdiction, release, level, learningArea, strand,
  title, learningIntention, successCriteria[],
  prerequisites[],                      // lessonIds — this is the pathway edge
  sections: [
    { type: "concept",        blocks[], assets[] },
    { type: "worked_example", stem, assets[],
      steps: [{ label, working, visual?, why }],
      answer, commonError? },
    { type: "misconception",  claim, whyWrong, correction },
    { type: "check",          questionRef }   // from the live bank
  ],
  vocabulary[], parentNote, estimatedMinutes,
  status, approval, provenance           // content-platform v2 lifecycle
}
```

A worked example is close to a question that reveals its own solution, so it reuses the
ten visual renderers and fourteen question renderers rather than adding a parallel
rendering path. The `check` section is the load-bearing join: a lesson can only claim to
be practisable if `questionRef` resolves to approved, published, curriculum-aligned items.

---

## 4. Phasing

**Phase 0 — Stabilise the tree (~2 days).** Run the full gate on Windows. Get the 76
untracked working files onto named branches (product audit / content-platform-v2 / ADR-015 /
recommendation engine each deserve their own). Reconcile the Codex worktree so there is
one curriculum module, not two. Decide what reaches `main`.
*Out: green gate, named branches, one curriculum module, known baseline SHA.*

**Phase 1 — Complete the Victorian spine (~1 week).** Enumerate all 104 nodes from the
VCAA source with code, strand, sub-strand, level, and the source snapshots Antigravity
flagged `pending_retrieval` (lands the SHA-256 fingerprints so provenance stops being
null). Implement `CurriculumCatalogue` against a fixture, then Supabase per ADR-015.
Keep Antigravity's licence posture: reference official codes and titles, write all
descriptive prose originally, attribute VCAA.
*Out: 104 nodes queryable, provenance real, licence position documented.*

**Phase 2 — The crosswalk (~1 week). THE KEYSTONE.** Add optional `curriculumAlignments[]`
to the question schema (`{ releaseId, code, coverage: primary|supporting, confidence,
verifiedBy, verifiedAt }`) so nothing existing breaks. Map at the *skill-string* level,
not per question: 342 distinct strings, machine-proposed and human-confirmed, collapses to
~120 real decisions and applies to all 1,293 questions at once. Normalise the colliding
strands while in there. Emit coverage per node: `covered` ≥5, `partial` 1–4, `empty` 0.
*Out: every question aligned; the first true answer to "what do we actually cover?"*

**Phase 3 — Parent Curriculum Explorer (~1–2 weeks).** Build Antigravity's spec at
`/parent/curriculum-explorer`, driven by Phase 2's real counts rather than the
`unverified` placeholder. Author parent cards for all 104 nodes. Ships genuine value with
zero lesson content written.
*Out: live explorer for VIC L3/L5 Maths & English, honest about coverage.*

**Phase 4 — Lesson model + one vertical slice (~2 weeks).** Land the lesson schema, the
renderer (reusing existing visual/question renderers), and the content-platform v2
lifecycle for lessons — same gates as questions. Wire the lesson list into
`/student/learn`'s waiting empty state. Author VIC Level 3 Number (9 nodes) end to end:
deepest existing question coverage, so lesson → worked example → check → drill can be
proven rather than mocked.
*Out: 9 real lessons, a proven loop, a schema worth scaling.*

**Phase 5 — Scale, sequence, fix Grade 5 (ongoing).** Lessons for the remaining 95 nodes,
AI-drafted and gated. Pathway ordering with prerequisite edges and mastery gates over
existing objective marks. "Learn this first" on the results screen wherever a missed skill
maps to a lesson. In parallel and not optional: backfill Grade 5 — 11 NAPLAN Reading
questions cannot support a Level 5 English pathway.
*Out: 104 nodes taught and sequenced; a Grade 5 bank that can carry them.*

---

## 5. Risks

1. **Three agents, one repo.** Antigravity, Codex and Claude Code each produced a
   curriculum artefact this month; none merged. Phase 0 exists to stop this becoming four.
2. **The crosswalk is judgement work, not automation.** Machine-proposing 342 mappings is
   easy; confirming them needs a human. Budget real hours, not a script run.
3. **Grade 5 famine sets the ceiling.** The curriculum layer will surface the thinness
   rather than hide it. Correct behaviour, still uncomfortable.
4. **VCAA licensing on any commercial path.** CC BY-NC 3.0 AU covers private family use.
   It does not cover a paid product. Know the answer before the architecture assumes one.
