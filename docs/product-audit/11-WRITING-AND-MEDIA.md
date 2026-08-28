# 11. Writing and Media Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `PARTIAL` / `FUTURE WORKSTREAM`

---

## 1. Writing Assessment Experience (`EssayRenderer.tsx`)

Writing is currently implemented as an authoring question type (`"essay"`) with dedicated rendering and manual review capabilities:

```text
Writing Flow Components
├── EssayRenderer.tsx               # Client question card with prompt, stimulus, planning box & response textarea
├── teacher/marking/page.tsx        # Teacher manual marking dashboard
├── teacher/marking/[sessionId]/... # Criterion-based rubric marking interface
└── supabase/migrations/20260719110000_essay_marking.sql # essay_marking table
```

### Current Capabilities & Limitations

| Capability | Current State | Assessment & Gaps |
| :--- | :--- | :--- |
| **Writing Prompts** | 4 Prompts Total | 1 narrative and 1 persuasive prompt for Year 3 & Year 5. |
| **Rich Text / Planning** | Plain text + word counter | Basic text area with live word count and separate planning notes box. |
| **Autosave** | Local input state | Autosaves with overall exam state, but lacks rich document revision history. |
| **Teacher Manual Marking** | Functional | Allows teachers to assign criterion marks (Audience, Text Structure, Ideas, Vocabulary, Spelling, Punctuation) and written feedback. |
| **AI Automated Marking** | **MISSING** | No automated LLM grading pipeline or instant rubric evaluation. |
| **Parent Writing Review** | **MISSING** | Parents cannot view child essay text or feedback directly in their dashboard. |

### Strategic Recommendation for Writing
Writing should be treated as a **Phase 2 / Extension Module**. High-stakes automated essay marking for primary school students requires complex moderation, redaction of PII, and rubric calibration. **Priority should remain on auto-marked objective domains (Numeracy, Reading, Language, Science).**

---

## 2. Media, Images, Visuals & Audio Audit

### Structured Visual Renderers (`src/features/exam-engine/visual-renderers/`)
* **100% Deterministic Code:** MindMosaic renders charts, tables, coordinate grids, and geometry directly from structured JSON payloads using React and SVG primitives.
* **Security & Performance:** Eliminates unsanitised third-party SVGs and large raster image payloads.
* **Dark Mode & A11y:** Supports dynamic text contrast and scales up to 200% zoom without pixelation.

### Brand & Static Media Assets (`public/brand/`)
* Pre-rendered modern WebP assets: `/brand/mark-96.webp` (<= 64px) and `/brand/mark-192.webp` (> 64px).
* Served via Next.js `<Image fill priority />` with zero layout shift.

### Missing Media Capabilities for Future Programs
1. **Spelling Audio Pronunciation:** Currently, Spelling questions use written sentence context (e.g. *"Select the misspelled word"*). An audio pronunciation player (`<audio>` with synthetic voice or human recording) is needed for true dictation spelling tests.
2. **Dynamic Asset CDN / Image Optimization:** For complex Science and Geography diagrams that cannot be expressed purely in geometric SVG primitives, an automated upload and responsive WebP/AVIF generation pipeline is required.
