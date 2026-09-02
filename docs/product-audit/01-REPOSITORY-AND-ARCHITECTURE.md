# 01. Repository and Architecture Inventory

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` / `VERIFIED`

---

## 1. System Topology & Next.js App Router Structure

MindMosaic is built on the **Next.js 16.2 App Router** with TypeScript strict mode, Tailwind CSS (@theme inline design tokens), Zod validation schemas, and Supabase Auth / PostgreSQL backend.

### Route Classification Map

| Scope | Path / Pattern | Route Type | Purpose & Accessibility |
| :--- | :--- | :--- | :--- |
| **Public Marketing** | `/` | Static | Landing page (Hero, Trust, Quality, Programmes, Showcase, Plans FAQ, Closing) |
| **Public Information** | `/about`, `/methodology`, `/pricing`, `/help`, `/contact`, `/resources` | Static | Core trust and explanation pages |
| **Public Legal & A11y** | `/privacy`, `/terms`, `/accessibility`, `/assessment-disclaimer` | Static | Australian Privacy Principles & legal disclaimers |
| **Public Programme Hub**| `/assessments`, `/practice`, `/exams`, `/learn`, `/showcase` | Static / Prerendered | Programme catalogues and overview grids |
| **Public Practice Runner**| `/practice/[program]`, `/practice/session` | Dynamic Client | Scoped instant-feedback practice sessions (guest accessible) |
| **Public Exam Runner** | `/exam`, `/exams/[patternId]` | Dynamic Client | Timed, secure exam simulation (guest or signed-in) |
| **Results & Review** | `/results` | Dynamic Client | Score report, question review strip, badges |
| **Authentication** | `/sign-in`, `/sign-up`, `/student-sign-in`, `/auth/confirm`, `/auth/reset` | Dynamic | Supabase session entrypoints and password flows |
| **Student Portal** | `/student`, `/student/learn`, `/student/exam-preparation`, `/student/assignments`, `/student/engagement` | Dynamic Server | Student home base, assignment board, streaks, mastery |
| **Parent Portal** | `/parent`, `/parent/children` | Dynamic Server | Multi-child overview, score rings, learning insights, child provisioning |
| **Teacher Portal** | `/teacher`, `/teacher/students`, `/teacher/students/[id]`, `/teacher/assignments`, `/teacher/assignments/new`, `/teacher/marking`, `/teacher/marking/[sessionId]/[questionId]`, `/teacher/analytics` | Dynamic Server | Classroom management, essay marking, assignment builder |
| **Admin Portal** | `/admin`, `/admin/analytics`, `/admin/operations`, `/admin/intelligence` | Dynamic Server | Content operations, item stats, queue health |
| **Billing Portal** | `/billing` | Dynamic Server | Plan selection, Stripe customer portal redirect, invoice history |
| **Diagnostic Tools** | `/dev/routes` | Static Dev-Only | Developer route audit and graph link verification |

---

## 2. API Route Handlers & Server Architecture

All API routes live under `src/app/api/` and operate under Next.js framework server isolation:

```text
src/app/api/
├── exam/
│   ├── guest-bank/route.ts          # Public stripped question bank for guest sessions
│   ├── session/route.ts             # POST: Create server-selected session
│   ├── session/[id]/route.ts        # GET: Read session status & review reveal
│   ├── session/[id]/responses/route.ts # POST: Debounced autosave responses
│   ├── session/[id]/submit/route.ts # POST: Final submission & server scoring trigger
│   └── session/active/route.ts      # GET: Check for ongoing incomplete sitting
├── parent/
│   └── children/
│       ├── route.ts                 # GET / POST: List and provision child accounts
│       └── [childId]/route.ts       # GET / DELETE / PATCH: Manage child profile
├── stripe/
│   ├── checkout/route.ts            # POST: Create Stripe Checkout session
│   ├── portal/route.ts              # POST: Open Stripe Billing Customer Portal
│   ├── webhook/route.ts             # POST: Transactional webhook processing
│   ├── status/route.ts              # GET: Polling subscription status
│   ├── cancel/route.ts              # POST: Cancel subscription
│   ├── resume/route.ts              # POST: Resume paused/cancelled plan
│   ├── invoices/route.ts            # GET: Fetch customer invoices
│   └── payment-method/route.ts      # GET / POST: Update card details
└── teacher/
    ├── assignments/route.ts         # GET / POST: Assignment distribution
    └── marking/route.ts             # POST: Manual essay grading submission
```

---

## 3. Middleware & Session Proxy

* **Proxy Entrypoint (`src/proxy.ts`)**: Invokes `updateSession()` from `src/lib/supabase/middleware.ts` for all route requests excluding static assets.
* **Session Lifecycle**:
  - Uses `@supabase/ssr` with `createServerClient`.
  - Refreshes auth cookies on every request.
  - **Guests-Allowed Policy:** Never blocks unauthenticated requests at the proxy level. Guests pass straight through to practice and landing routes; authentication only unlocks persistence.

---

## 4. Architecture Diagram: Major User Journeys

```mermaid
graph TD
    subgraph "Public Discovery & Assessment"
        Home["/ (Landing Page)"] --> Cat["/assessments & /practice"]
        Cat --> Setup["/practice/[program] (ExamConfigurator)"]
        Setup -->|Practice Mode (Untimed)| Pract["/practice/session (PracticeSession)"]
        Setup -->|Exam Mode (Timed)| Exam["/exam (ExamStore)"]
        Pract --> Res["/results (Score, Badges, Explanations)"]
        Exam --> Res
    end

    subgraph "Auth & Onboarding"
        Home --> SignUp["/sign-up (SignUpWizard)"]
        Home --> SignIn["/sign-in (Parent/Teacher)"]
        Home --> SSignIn["/student-sign-in (Student Alias)"]
        SignUp -->|Role: Parent| PHome["/parent (Parent Dashboard)"]
        SignUp -->|Role: Student| SHome["/student (Student Dashboard)"]
        SignUp -->|Role: Teacher| THome["/teacher (Teacher Dashboard)"]
    end

    subgraph "Parent Journey"
        PHome --> PChild["/parent/children (Add/Manage Children)"]
        PHome --> PBilling["/billing (Stripe Family Plan)"]
        PHome --> PInsights["Learning Insights (Prose & Recommendations)"]
    end

    subgraph "Student Journey"
        SHome --> SActive["ActiveSessionBanner (Resume Sitting)"]
        SHome --> SStreak["Streak & Daily Goal Widget"]
        SHome --> SAssign["/student/assignments (Class Work)"]
        SHome --> SLearn["/student/learn (Learning Hub)"]
        SActive --> Exam
    end

    subgraph "Teacher Journey"
        THome --> TAssign["/teacher/assignments/new (Create Assignment)"]
        THome --> TMark["/teacher/marking (Essay Manual Grading)"]
        THome --> TAnalytics["/teacher/analytics (Class Heatmap)"]
    end
```

---

## 5. Session Data Model Evolution (ADR-005 & ADR-006)

The repository currently maintains a **Dual-Model Architecture** during its migration cutover:

1. **Legacy Model (`exam_sessions`, `exam_attempts`, `exam_responses`)**:
   - Single JSONB config and answer blob.
   - Used for quick prototypes and historical sessions.
2. **Modern Target Model (`assessment_sessions`, `assessment_session_items`, `assessment_session_responses`)**:
   - Normalized item-level rows with immutable item revision pinning (`item_version_id`).
   - Server-side answer protection where `item_answer_versions` is inaccessible to client sessions.
   - Unified through the PostgreSQL view `resolved_sittings` and server dispatch layer (`src/server/assessment/read-dispatch.ts`).

---

## 6. Client State Management (Zustand)

* **`useExamStore` (`src/features/exam-engine/state/exam-store.ts`)**:
  - Manages exam session lifecycle: `not_started` → `in_progress` → `submitting` → `submitted`.
  - Strips answer keys during test taking via `toCandidateQuestions()`.
  - Handles debounced autosave flush, server deadline expiry, and review reveal.
* **`usePracticeSession` (`src/features/exam-engine/practice-mode/`)**:
  - Reducer-driven state for step-by-step immediate feedback practice.
* **`useScratchpadStore` (`src/features/exam-engine/scratchpad/`)**:
  - Manages canvas drawing strokes, undo stacks, and tool state.

---

## 7. Pure Scoring Functions Outside React

Scoring logic is completely decoupled from UI components:
* **`scoreExam()` (`src/features/exam-engine/scoring/score-exam.ts`)**: Pure deterministic scoring function.
* **`scoreQuestion()` (`src/features/exam-engine/scoring/score-question.ts`)**: Type-specific evaluators for all 14 question formats.
* **`ServerAuthoritativeScoringService` (`src/server/scoring/`)**: Database-backed scoring executing inside PostgreSQL RPC functions.
