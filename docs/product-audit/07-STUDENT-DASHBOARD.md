# 07. Student Dashboard Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` / `WELL DESIGNED`

---

## 1. Student Dashboard Architecture (`src/app/student/page.tsx`)

The student dashboard serves as the learner's home base, focusing on positive motivation, clear practice options, and honest progress tracking.

```text
Student Dashboard Layout
├── Header
│   ├── Greeting: "Hi {firstName}" + contextual status line
│   └── Active Session Toast: "You have an unfinished sitting — [Resume now]"
├── Stat Rail (4 Key Metrics)
│   ├── Total Sessions Finished
│   ├── Total Questions Answered
│   ├── Overall Accuracy Percentage
│   └── Current Practice Streak (Days)
├── Main Content Grid (2 Columns)
│   ├── Left / Primary Column
│   │   ├── Session Mode Launchers (Practice Mode vs Mock Exam)
│   │   ├── Recommended Next Focus Tile (Targeting weakest subject)
│   │   └── Recent Attempt History Card (Date, paper title, score, review link)
│   └── Right / Progress Rail
│       ├── Streak & Weekly Goal Progress Widget
│       ├── Subject Mastery Bars (Numeracy, Reading, Language, etc.)
│       └── Assigned Classroom Work Card
```

---

## 2. Component Inventory & Database Integration

| Component | File Path | Data Source | Behavior & Fallback |
| :--- | :--- | :--- | :--- |
| **`ActiveSessionBanner`** | `src/features/exam-engine/components/ActiveSessionBanner.tsx` | `GET /api/exam/session/active` | Queries incomplete sessions in `assessment_sessions`; renders high-priority resume button. |
| **`DashboardStatRail`** | `src/features/student/components/DashboardStatRail.tsx` | `fetchStudentOverview()` via `fetchSittingRows()` | Displays real aggregate numbers; handles 0-session new accounts gracefully without dividing by zero. |
| **`SessionModeCards`** | `src/features/student/components/SessionModeCards.tsx` | Static UI links | Quick launchers for `/practice` (untimed) and `/exams` (timed simulation). |
| **`MasterySnapshot`** | `src/features/student/components/MasterySnapshot.tsx` | `buildOverview()` | Calculates subject-level mastery percentage across all scored attempts. |
| **`StreakWeeklyGoalWidget`** | `src/features/student/components/StreakWeeklyGoalWidget.tsx` | `src/features/student/engagement/streaks.ts` | Tracks consecutive calendar days with at least one completed sitting. |
| **`AssignmentsSummaryCard`** | `src/features/student/components/AssignmentsSummaryCard.tsx` | `fetchStudentAssignments()` | Displays assignments created by linked teachers with due dates. |

---

## 3. Gamification & Motivation Evaluation

* **Philosophy:** MindMosaic uses **restrained, learning-centric motivation** rather than distracting casino-style mechanics.
* **Positive Signals:**
  - Daily Streak counter (`🔥 3-day streak going`) rewards consistency.
  - Session Badges (Speedy Solver, High Accuracy, Persistence) celebrate effort.
  - Subject Mastery progress bars fill up honestly as accuracy increases.
* **Avoided Pitfalls:** No artificial gems, energy timers, or pay-to-win mechanics that distract primary school learners from deep study.

---

## 4. Gaps & Opportunities

1. **Granular Skill Mastery:** Mastery is currently tracked at the **Subject level** (e.g. Numeracy 78%). Breaking this down into sub-strands (e.g. *Fractions 45%*, *Measurement 90%*) in the dashboard will make progress much more tangible.
2. **One-Click Targeted Drill:** The "Recommended Focus" tile tells the student to focus on a subject, but clicking it takes them to the general catalogue rather than instantly launching a tailored 5-question reinforcement set.
