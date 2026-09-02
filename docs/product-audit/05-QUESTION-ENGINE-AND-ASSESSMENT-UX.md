# 05. Question Engine and Assessment UX Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` / `EXEMPLARY` (Core Engine & Renderers)

---

## 1. Assessment Runner Shell (`src/features/exam-engine/`)

The assessment shell provides a focused, high-security, distraction-free testing environment:

```text
Exam Shell Components
├── ExamConditionBar.tsx          # Top bar: Session mode, autosave status, connection pulse
├── ExamTimer.tsx                 # Countdown timer with low-time warning (under 5 mins)
├── ExamQuestion.tsx              # Question card wrapper with type badge and flag control
├── ScratchpadPanel.tsx           # Collapsible full-canvas digital working paper
├── SubmitConfirmationDialog.tsx  # Modal warning on unanswered questions before submit
└── ActiveSessionBanner.tsx       # In-product toast alerting user to unfinished sitting
```

### Key Interactive Features
* **Autosave Engine (`src/features/exam-engine/state/autosave.ts`)**: Automatically debounces and sends answer patches to `POST /api/exam/session/[id]/responses` every 5 seconds or upon question navigation.
* **Review Flagging:** Students can toggle a review flag on any challenging item, visually highlighted in the bottom question strip.
* **Accidental Exit Protection:** `beforeunload` event handler warns the user if an active sitting has unsaved changes or is in progress.
* **Offline / Disconnection Behavior:** If network connectivity drops, responses are retained in the in-memory client Zustand store as long as the tab remains open. Answers are not persisted in localStorage, and a durable offline queue does not currently exist.

---

## 2. Supported Question Types (All 14 Renderers Verified)

Every question type maps to an independent renderer component in `src/features/exam-engine/question-renderers/`:

| # | Question Type | Renderer Component | Interaction & Keyboard Accessibility | Scoring Mechanism | Bank Count |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `multiple_choice` | `MultipleChoiceRenderer.tsx` | Single radio group, full arrow key navigation, 44px tap targets. | Exact option match | 497 (38.4%) |
| 2 | `reading_comprehension`| `ReadingComprehensionRenderer.tsx` | Split passage panel (left) with independently scrollable question (right). | Sub-type matching | 171 (13.2%) |
| 3 | `number_entry` | `NumberEntryRenderer.tsx` | Numeric input with integer/decimal normalization and unit labels. | Numeric equivalence | 169 (13.1%) |
| 4 | `fill_blank` | `FillBlankRenderer.tsx` | Inline text inputs placed directly inside sentences or equations. | Case-insensitive trim match | 80 (6.2%) |
| 5 | `multiple_select` | `MultipleSelectRenderer.tsx` | Checkbox group with minimum/maximum select count validation. | Partial credit / all-or-nothing | 72 (5.6%) |
| 6 | `dropdown` | `DropdownRenderer.tsx` | Accessible native `<select>` dropdowns embedded in context. | Multi-dropdown tuple match | 70 (5.4%) |
| 7 | `ordering` | `OrderingRenderer.tsx` | Up/Down reorder buttons + Drag & Drop reordering support. | Strict sequence matching | 60 (4.6%) |
| 8 | `true_false` | `TrueFalseRenderer.tsx` | Multi-row assertion matrix with True/False radio buttons. | Full matrix exact match | 59 (4.6%) |
| 9 | `matching` | `MatchingRenderer.tsx` | Pair connector between Left Column premises and Right Column targets. | Pair-wise bijective match | 51 (3.9%) |
| 10 | `short_answer` | `ShortAnswerRenderer.tsx` | Text box with regex whitespace normalization and synonym arrays. | Synonym & pattern match | 39 (3.0%) |
| 11 | `drag_drop` | `DragDropRenderer.tsx` | Target containers with keyboard accessible "Tap to Pick / Tap to Place". | Container slot matching | 10 (0.8%) |
| 12 | `label_diagram` | `LabelDiagramRenderer.tsx` | Visual pins positioned on SVG diagrams with dropdown/text labels. | Pin-to-value matching | 6 (0.5%) |
| 13 | `hotspot` | `HotspotRenderer.tsx` | Interactive clickable SVG regions with clear focus highlights. | Region ID hit testing | 5 (0.4%) |
| 14 | `essay` | `EssayRenderer.tsx` | Rich stimulus prompt, structured planning space, and word count tracker. | Rubric / Manual review | 4 (0.3%) |

---

## 3. Structured Visual Renderers (All 10 Renderers Verified)

Visuals are strictly defined as structured JSON schemas rendered deterministically in `src/features/exam-engine/visual-renderers/`:

```text
Structured Visual Suite
├── BarChartRenderer.tsx        # Vertical/horizontal bar charts with gridlines and legends
├── LineGraphRenderer.tsx       # Multi-series line charts with discrete data points
├── PieChartRenderer.tsx        # Proportional segmented circular charts with callout percentages
├── TableRenderer.tsx           # Semantic HTML tables with headers and zebra striping
├── NumberLineRenderer.tsx      # Rational number lines with tick marks, fractions, and arrows
├── GeometryShapeRenderer.tsx   # 2D/3D polygon shapes with angle markers and dimensions
├── CoordinateGridRenderer.tsx  # Cartesian coordinate planes with plotted points and vectors
├── FractionModelRenderer.tsx   # Grid and circle area fraction models with shaded sectors
├── LabelledSvgRenderer.tsx     # Scientific/technical diagrams with accessible pointer labels
└── HotspotSvgRenderer.tsx      # Interactive touchable diagram zones
```

* **No Arbitrary SVG Injection:** SVGs are assembled purely from validated React components, eliminating XSS risks.
* **High-Contrast Dark Mode & Zoom:** Scalable vector coordinates retain crisp fidelity at 200% browser zoom.

---

## 4. Digital Scratchpad Tool (`src/features/exam-engine/scratchpad/`)

* **Features:**
  - Full-screen transparent canvas overlaying the question.
  - Pen, Highlighter (semi-transparent), Eraser, Clear Canvas, and Undo/Redo actions.
  - Touch & Apple Pencil stylus support with smooth Bézier curve interpolation.
  - State persisted locally per question across question navigation.

---

## 5. Dual Assessment Modes Comparison

| Feature | Practice Mode (`/practice/session`) | Exam Simulation Mode (`/exam`) |
| :--- | :--- | :--- |
| **Pacing** | Untimed, self-directed | Strict countdown timer |
| **Feedback** | Instant after every question | Withheld completely until final submission |
| **Explanations** | Animated step-by-step reveal on submission | Revealed only on Results page |
| **Retry Policy** | "Try Again" allowed for incorrect attempts | Single submission attempt |
| **Security** | Local client scoring | Server-authoritative RPC scoring |
| **Ideal For** | Homework, skill drills, revision | Mock exam readiness, NAPLAN trial |
