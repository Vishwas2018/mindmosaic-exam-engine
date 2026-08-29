# Victoria Years 3 & 5 UX Specification (Victorian Curriculum FΓÇô10 V2.0)

**Document ID:** `DOC-CURR-004`  
**Effective Date / Version:** 28 August 2026 / Version 2.0 (Hardened)  
**Author:** Antigravity (Curriculum Research & Planning Pack)  
**Target Repository Branch:** `gemini/curriculum-catalogue-planning`  
**Target Screen:** Parent Portal $\rightarrow$ Learning Hub / Curriculum Explorer (`/parent/curriculum-explorer`)

---

## 1. Overview & Objectives

This specification defines the user experience, interaction architecture, and visual design for the **Victorian Curriculum FΓÇô10 Version 2.0 Parent Explorer** for **Level 3 (Year 3 cohort)** and **Level 5 (Year 5 cohort)** across **Mathematics** and **English**.

### Primary Goals:
1. Enable parents to browse by Victorian Curriculum Level (Level 3 or Level 5) and Learning Area.
2. Present plain-English summaries and practical home activities without educational jargon.
3. Explicitly inform parents that **schools determine their own term sequencing** across the four terms.
4. Honestly reflect live question availability, defaulting unlinked skills to `unverified` or `empty` with zero question counts.
5. Provide transparent outbound links to official VCAA primary sources (`https://f10.vcaa.vic.edu.au/`).

---

## 2. Navigation & User Journey

```mermaid
graph TD
    ParentDashboard[Parent Dashboard] --> CurrExplorer[Curriculum Explorer /parent/curriculum-explorer]
    CurrExplorer --> Selectors[Jurisdiction: VIC | Level: 3 or 5 | Area: Mathematics or English]
    Selectors --> DisclaimerBanner[School Term Sequencing Notice]
    DisclaimerBanner --> StrandTabs[Strand Tabs: Number | Algebra | Measurement | Space | Statistics | Probability]
    StrandTabs --> SkillCards[Curriculum Skill Cards]
    SkillCards --> SkillModal[Skill Detail Modal: Plain English + Home Activities + Official VCAA Link]
```

---

## 3. Comprehensive 6-State Visual Handling

| State Code | Badge Label | Badge Color (Tailwind) | Card Description & UI State | Action Button |
| :--- | :--- | :--- | :--- | :--- |
| `unverified` *(Default)* | **Alignment Pending** | `bg-zinc-100 text-zinc-600 border-zinc-200` | Displays plain-English explanation, home activities, and VCAA source link. Clearly states that live question mapping has not yet been computed from the bank. | Disabled / `[Read Home Ideas]` |
| `empty` | **Practice Coming Soon** | `bg-amber-50 text-amber-700 border-amber-200` | Verified curriculum node with 0 digital test items published. Home activities are 100% active. | `[Notify Me When Ready]` |
| `partial` | **Preview Practice** | `bg-blue-50 text-blue-700 border-blue-200` | 1ΓÇô4 verified active questions available in MindMosaic bank. | `[Try Preview Drill (3 Qs)]` |
| `covered` | **Ready to Practise** | `bg-emerald-50 text-emerald-700 border-emerald-200` | $\ge 5$ verified active questions in MindMosaic bank. | `[Practise This Skill (5 Qs)]` |
| `transitional` | **V2.0 Curriculum Update** | `bg-purple-50 text-purple-700 border-purple-200` | Highlights specific enhancements between Victorian Curriculum V1.0 and V2.0. | `[Learn About V2.0 Changes]` |
| `unavailable` | **Classroom / Oral Only** | `bg-slate-100 text-slate-600 border-slate-200` | Practical/oral outcome evaluated by teachers in the classroom (outside digital quiz scope). | `[View Home Ideas Only]` |

---

## 4. UI Components & Layout Wireframes

### 4.1 School Sequencing Informational Notice
Rendered prominently at the top of every level and strand view:

```
+---------------------------------------------------------------------------------------------------+
| Γä╣∩╕Å  HOW VICTORIAN SCHOOLS TEACH THIS CURRICULUM                                                  |
| Victorian Curriculum FΓÇô10 Version 2.0 sets out what students are expected to learn by the end     |
| of Level 3. Your child's school and teacher plan their own sequence across Terms 1ΓÇô4.            |
| If a skill hasn't been taught in class yet, that is completely normal!                            |
+---------------------------------------------------------------------------------------------------+
```

### 4.2 Verified Level 3 Mathematics Skill Card (Number: Beyond 10,000)
```
+---------------------------------------------------------------------------------------------------+
| [VC2M3N02]  Numbers and Place Value Beyond 10,000                      [ Alignment Pending (0 Qs) ]|
| Strand: Number  ΓÇó  Level: Victorian Level 3 (Year 3 Cohort)                                      |
|                                                                                                   |
| In Plain English: Children recognise, read, and write 5-digit numbers and beyond (like 25,480),   |
| learning how place value names (ones, tens, hundreds, thousands, ten-thousands) repeat in cycles. |
|                                                                                                   |
| [Γ¡É 2 Family Home Activities]   [≡ƒôÜ VCAA Source: f10.vcaa.vic.edu.au]    [ Read Home Ideas ]      |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Accessibility & Responsive Design Standards

- **WCAG 2.1 AA Standards:** Contrast ratio $\ge 4.5:1$ for normal text, touch targets $\ge 44 \times 44\text{ px}$.
- **Keyboard Navigation:** Modals trap focus; dismissible with `Escape` key.
- **Outbound Link Safety:** All external links include `target="_blank" rel="noopener noreferrer"` with screen-reader text `(opens in new tab)`.
