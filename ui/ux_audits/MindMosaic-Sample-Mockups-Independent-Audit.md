# MindMosaic Sample Mockups — Independent UI/UX, Product and Architecture Audit

## Scope

This audit covers the 16 supplied HTML mockups:

1. Authentication
2. Student dashboard
3. Parent dashboard
4. Billing
5. Session selection / student home
6. Learning hub
7. Exam engine
8. Practice mode
9. Results
10. Student assignments
11. Engagement system
12. Teacher dashboard
13. Teacher student detail
14. Analytics
15. Assignment engine
16. Admin intelligence

The review considers:

- Product completeness
- Information architecture
- Visual consistency
- Child and parent usability
- Teacher and administrator workflows
- Accessibility
- Responsive behaviour
- Implementation readiness
- Maintainability and architecture

---

# Executive Verdict

The mockup suite is a strong product-design foundation. It demonstrates a coherent education platform rather than a disconnected set of pages.

The strongest screens are:

- Exam engine
- Practice mode
- Results
- Parent dashboard concept
- Teacher dashboard
- Assignment engine

The largest gaps are:

- Inconsistent product scope
- Excessive small typography
- Demo-only controls mixed into product UI
- Incomplete mobile navigation
- Weak semantic accessibility on several teacher and admin screens
- Placeholder and dead-link behaviour
- Duplicated design-system code
- Conflicting user roles, year levels and pricing assumptions
- Lack of a single route and component contract

| Area | Rating |
|---|---:|
| Product vision | 8.8/10 |
| Visual consistency | 8.2/10 |
| Student experience | 8.4/10 |
| Parent experience | 7.8/10 |
| Teacher experience | 8.1/10 |
| Admin experience | 7.4/10 |
| Accessibility readiness | 6.6/10 |
| Responsive readiness | 6.8/10 |
| Production architecture | 6.3/10 |
| Overall | **7.7/10** |

These mockups are suitable as design references, but they should not be copied directly into production without consolidation and remediation.

---

# What Is Working Well Across the Suite

## 1. Clear Product Ecosystem

The suite covers the major workflows expected from a modern assessment platform:

- Authentication
- Student learning and assessments
- Parent progress visibility
- Teacher class management
- Assignment creation and tracking
- Billing
- Results intelligence
- Content administration

This gives MindMosaic a credible full-platform vision.

## 2. Strong Brand Cohesion

The mockups consistently use:

- Primary purple `#5925a8`
- Pale lavender surfaces
- White cards
- Soft borders
- Rounded corners
- Restrained shadows
- Green, amber and red status colours

The visual identity is recognisable across student, parent and teacher screens.

## 3. Good Interaction Vocabulary

Reusable patterns are already visible:

- Primary, secondary and ghost buttons
- Pills and badges
- Progress bars
- Skill bars
- Status cards
- Tabs
- Accordions
- Modals
- Side panels
- Question maps
- Empty and loading states

These are strong foundations for a proper component library.

## 4. Assessment-Specific Thinking

The assessment experience is more mature than a generic learning portal.

The exam and practice mockups include:

- Question navigation
- Answer states
- Flags
- Correct and incorrect feedback
- Progress indicators
- Submission actions
- Review patterns
- Timer-related styling
- Results breakdowns

## 5. Parent and Teacher Value Is Visible

The parent and teacher screens go beyond raw scores.

They introduce:

- Skill mastery
- Improvement trends
- Intervention guidance
- Recommended next actions
- Assignment progress
- Student-specific observations

That is an important differentiator.

---

# Cross-Suite Critical Findings

## 1. Typography Is Too Small in Many Screens

There is widespread use of 10px, 11px and 12px text for:

- Labels
- Metadata
- Table headings
- Secondary descriptions
- Profile details
- Status information
- Analytics annotations

This creates a polished screenshot but weakens real-world usability.

### Required Minimums

| Element | Recommended Minimum |
|---|---:|
| Body copy | 16px |
| Card descriptions | 14–15px |
| Navigation | 14–15px |
| Table body | 14px |
| Table headings | 12–13px |
| Metadata | 13px |
| Buttons | 14–16px |
| Form inputs | 16px |
| Legal/supporting copy | 12–13px with strong contrast |

Use 10–11px only for exceptional, non-essential labels.

---

## 2. The Mockups Use Inconsistent Fonts

The mockups currently use DM Sans and DM Serif Display, while the current landing-page direction has moved toward Roboto.

### Decision Required

Choose one system and apply it consistently.

Recommended:

- **Roboto** for all UI, forms, tables, buttons and body copy
- **Roboto Slab**, Fraunces or another controlled display face only for selected marketing headings

For application dashboards and assessment screens, one readable sans-serif family is preferable.

---

## 3. Design Tokens Are Duplicated in Every File

Each standalone HTML file repeats:

- Tailwind configuration
- Colour definitions
- Button classes
- Card styles
- Navigation styles
- Typography settings
- Progress styles
- Animation rules

This creates major drift risk.

### Production Requirement

Extract shared tokens and components into:

- A single Tailwind preset or theme
- Shared CSS variables
- Shared UI primitives
- Shared application shells
- Storybook or an equivalent component showcase

Do not port each HTML file independently.

---

## 4. Demo Controls Must Not Reach Production

Several mockups contain state switchers, view toggles and component-library controls intended only for demonstration.

Examples include:

- Active / Loading / Empty state switchers
- Component Library / Dashboard Integration toggles
- Demo-specific tabs
- Hard-coded mock data controls

### Required Action

- Keep these only in Storybook, test routes or developer mode
- Remove them from production pages
- Never expose them to end users

---

## 5. Navigation Is Inconsistent

Different mockups use different navigation sets:

- Dashboard / Learn / Practice / Assignments / Results
- Overview / Progress / Subscription
- Dashboard / Children
- Teacher sidebar with Students / Analytics / Assignments / Insights
- Admin sidebar with Content Intelligence / Question Bank / Users / Health

This is expected across roles, but the route naming and ordering are inconsistent.

### Required Action

Create central role-based navigation maps:

- Student
- Parent
- Teacher
- Administrator

Use one route registry and one shell per role.

---

## 6. Scope and Persona Data Conflict

The mockups use examples such as:

- Year 7 students
- Grades 3 and 5
- Student Plan
- Family Plan
- School Plan
- NAPLAN, ICAS and broader assessments
- Teacher and admin features

The current MindMosaic launch scope is narrower.

### Required Action

Separate:

- **Current launch scope**
- **Future product vision**
- **Demo-only data**

Do not present Year 7, school subscriptions or advanced intelligence as live if the launch supports only Grades 3 and 5 family practice.

---

## 7. Accessibility Coverage Is Uneven

Some student screens include:

- `aria-label`
- `aria-current`
- focus-visible styling
- keyboard-focusable cards

Teacher, parent, billing and admin screens frequently have fewer semantic attributes.

### Required Baseline

Every production screen must support:

- Semantic headings
- Landmark elements
- Labelled navigation
- Visible keyboard focus
- Proper buttons rather than clickable `<div>` elements
- ARIA state for tabs, accordions and dialogs
- Accessible tables
- 44×44px targets
- Reduced-motion support
- Screen-reader announcements
- No colour-only status communication

---

# Screen-by-Screen Audit

## 1. Authentication

### Strengths

- Strong animated sign-in/sign-up concept
- Clear branded presentation
- Form card and marketing panel create a premium feel
- Error and success colours are defined
- Focus styling is considered

### Issues

- Social login and sample-exam functions may conflict with current v1 scope
- Several `href="#"` links indicate incomplete navigation
- The animation-heavy sign-in/sign-up transition may create complexity and motion sensitivity
- The form uses small supporting text
- Parent and student authentication are not clearly separated
- Fixed container height can fail on smaller screens or validation expansion
- External Google Fonts and standalone CSS are unsuitable as the production pattern

### Recommendation

Use a simpler role-aware authentication shell:

- Parent / teacher email login
- Dedicated student code login
- Parent account creation
- Reduced-motion alternative
- Dynamic height
- No unsupported provider buttons

**Priority:** P0

---

## 2. Student Dashboard

### Strengths

- Good application shell
- Clear main navigation
- Loading and empty states are explicitly designed
- Useful dashboard cards and progress patterns
- Strong base for recommendations and session resumption

### Issues

- Demo state switcher must be removed
- Some navigation and profile metadata are too small
- Mobile navigation is hidden without a visible replacement in the inspected markup
- Dashboard risks becoming too card-heavy
- Mock data uses Year 7, which conflicts with the current target scope
- The layout should prioritise one dominant next action

### Recommendation

Use this as the primary student dashboard reference, with:

1. Continue session
2. Today’s focus
3. Assignments due
4. Mastery snapshot
5. Recent activity

**Priority:** P0

---

## 3. Parent Dashboard

### Strengths

- Strong child switcher
- Clear score and skill summaries
- Parent-friendly insights
- Weekly activity and recent sessions
- Useful recommendation language

### Issues

- Header navigation is too limited
- Several links are placeholders
- The selected-child pattern needs scaling for larger families
- Parent-facing explanations need plain-language safeguards
- Charts and scores need accessible text equivalents
- No explicit empty, error or no-child state is evident in the base page
- Mock children and Year 7 scope may not match launch scope

### Recommendation

This is a substantially stronger model than the current sparse parent dashboard. Reuse its structure but align it with:

- Grades 3 and 5
- Current APIs
- Real readiness data
- Child management as a secondary task
- Clear empty state

**Priority:** P0

---

## 4. Billing

### Strengths

- Plans, comparison and billing tabs
- Strong pricing-card hierarchy
- Monthly/annual toggle
- Invoice and subscription concepts
- Clear plan differentiation

### Issues

- Pricing scope conflicts with the current product plan
- School plan may be premature
- Custom card-entry mockup should not be built; use Stripe-hosted components or portal
- Tabs lack full ARIA tab semantics
- Payment and tax language needs Australian compliance review
- Billing actions must be backed by idempotent server APIs
- Demo data and checkout states must be clearly separated

### Recommendation

Keep the information architecture, but simplify production v1 to:

- Current plan
- Available plans
- Stripe Checkout
- Stripe Customer Portal
- Invoices
- Cancellation state

**Priority:** P1 unless billing is a launch dependency

---

## 5. Student Home / Session Selection

### Strengths

- Practice and exam modes are clearly distinguished
- Large cards work well for children
- Strong descriptions and feature lists
- Clear CTA hierarchy
- Recent-session concept is useful

### Issues

- The filename says student home, but the content is session selection
- Role and route naming should be corrected
- Cards using `role="button"` and `onclick` need keyboard activation for Enter and Space
- Subject and year-level selection should precede or follow mode selection consistently
- Exam mode should explain timer and navigation rules
- Recent-session table may compete with the primary decision

### Recommendation

Rename this screen to **Session Selection** and make the flow:

1. Choose mode
2. Choose assessment or subject
3. Confirm configuration
4. Read instructions
5. Start

**Priority:** P0

---

## 6. Learning Hub

### Strengths

- Rich content discovery model
- Diagnostic, practice and mock-exam choices
- Recommendation and activity patterns
- Good empty and loading-state concepts
- Strong integration with the main student shell

### Issues

- Very high density for younger students
- Many 11–12px labels
- Clickable `<div>` elements rely on JavaScript navigation
- One mock-exam link points to a differently named file, indicating route drift
- Demo state switcher must be removed
- “Quick Review”, “Diagnostic” and “Practice” need clearer distinction
- Mobile information hierarchy needs simplification

### Recommendation

Use progressive disclosure:

- Today’s focus
- Recommended activity
- Browse by subject
- Recent learning

Avoid showing every option at once.

**Priority:** P1

---

## 7. Exam Engine

### Strengths

- Most mature mockup in the set
- Comprehensive option states
- Question map states
- Flagging
- Submission controls
- Progress and timer styling
- Modal patterns
- Correct, incorrect and skipped states
- Strong assessment-specific vocabulary

### Issues

- The file combines exam, feedback and review behaviours that should be mode-specific
- Accessibility semantics are incomplete relative to the complexity
- Question map requires arrow-key navigation and meaningful labels
- Timer announcements and automatic submission need explicit handling
- Several controls use small text
- Status cannot rely on colour alone
- Offline, autosave and conflict states are not fully represented visually
- The implementation uses many inline click handlers

### Recommendation

Treat this as the key visual reference, but implement it through:

- A deterministic session state machine
- Separate exam and practice modes
- Shared question renderer registry
- Autosave and offline queue
- Accessible question map
- Submit review dialog
- Server-authoritative timing

**Priority:** P0 and release-blocking

---

## 8. Practice Mode

### Strengths

- Clear answer-option states
- Immediate feedback cards
- Strong differentiation between correct and incorrect responses
- Student-friendly visual hierarchy
- Good progression model

### Issues

- The active-state colour contains an apparent unrelated blue value in one button rule
- Feedback should not reveal answers before submission
- Focus management after feedback is not specified
- Colour must be reinforced by icons and text
- Motion should respect reduced-motion
- Explanations need support for long content, visuals and formulas

### Recommendation

Keep the design and add:

- Explicit Submit Answer action
- Feedback heading focus
- “Why?” explanation
- Misconception guidance
- Next question CTA
- Skip behaviour
- Report question action

**Priority:** P0

---

## 9. Results

### Strengths

- Strong results-intelligence concept
- Score rings
- Topic breakdown
- Filter tabs
- Question-review accordions
- Performance interpretation
- Good foundation for student and parent variants

### Issues

- Results can become overwhelming for younger students
- Many labels use very small text
- Charts need text alternatives
- Tabs and accordions need complete ARIA behaviour
- Improvement comparisons require statistically meaningful baselines
- “Intelligence” wording may be too technical for students
- Different result modes need different layouts

### Recommendation

Separate views:

- Student summary
- Parent detail
- Teacher detail
- Diagnostic proficiency
- Practice mastery update

**Priority:** P0

---

## 10. Student Assignments

### Strengths

- Clear overdue, due-soon, in-progress and completed states
- Good card hierarchy
- Useful progress bars
- Tabs and count badges
- Strong empty-state concept

### Issues

- Status uses left-border colour heavily
- Teacher name, due date and instructions need accessible reading order
- Mobile cards need action placement review
- Tabs need ARIA tab semantics
- Notification and profile controls need complete interactions
- Assignment history and feedback are not fully represented

### Recommendation

Retain the structure and ensure each assignment exposes:

- Status text
- Due date
- Teacher
- Subject
- Estimated duration
- Start / Continue / Review action

**Priority:** P1

---

## 11. Engagement System

### Strengths

- Broad exploration of streaks, goals, achievements and nudges
- Good component ideas
- Useful examples of dashboard integration
- Strong motivation patterns when used carefully

### Issues

- This is a component showcase rather than a production screen
- Demo integration toggles must not be user-facing
- Gamification can create pressure or unhealthy patterns
- Streaks should not penalise illness, family circumstances or accessibility needs
- Flame animation needs reduced-motion handling
- Some syntax and token definitions appear fragile
- The screen duplicates functionality from dashboard, learning and results

### Recommendation

Do not build a standalone engagement page for v1.

Use a limited set of inclusive widgets:

- Weekly goal
- Gentle streak
- Achievements preview
- Celebration after progress

**Priority:** P2

---

## 12. Teacher Dashboard

### Strengths

- Appropriate desktop sidebar
- Class switcher
- Student table
- Intervention status
- Assignment and analytics entry points
- Suitable professional tone

### Issues

- No visible mobile/tablet navigation alternative
- Several links lack destinations or semantics
- Tables need sortable-header ARIA
- Status colours need text and icons
- Intervention alerts require auditability
- The screen needs empty, error and no-class states
- Teacher scope may be post-launch

### Recommendation

Use as the teacher shell reference, but release only when:

- Class membership and RLS are complete
- Assignment workflows are complete
- Teacher permissions are verified
- Mobile navigation exists

**Priority:** P2 for a family-first launch

---

## 13. Teacher Student Detail

### Strengths

- Strong student profile structure
- Skill breakdown
- Recent activity
- Assignment history
- Notes and action concepts
- Breadcrumbs

### Issues

- No meaningful ARIA usage is evident in the base structure
- Teacher notes are sensitive and require data governance
- Progress charts need text equivalents
- Skill labels use fixed widths that may fail on mobile or translation
- Actions such as flagging need confirmation and audit events
- The sidebar repeats the teacher shell rather than sharing a component

### Recommendation

Retain as a future teacher feature, with strict:

- Class-membership authorization
- Note privacy
- Audit logging
- Accessible chart summaries

**Priority:** P2

---

## 14. Analytics

### Strengths

- Appropriate class analytics structure
- Date range and export concepts
- Tables and chart areas
- Teacher-oriented density
- Report modal concept

### Issues

- Minimal accessibility semantics
- SVG charts require labels and summaries
- Export functionality may be premature
- Date range selector needs a proper accessible control
- Metrics require definitions and calculation provenance
- Teacher analytics must avoid overclaiming causation
- Mobile behaviour is not sufficiently represented

### Recommendation

Begin with simple, explainable metrics:

- Completion
- Accuracy
- Topic mastery
- Students needing support

Defer complex predictive analytics.

**Priority:** P2

---

## 15. Assignment Engine

### Strengths

- Clear creation wizard
- Target selection
- Content-type selection
- Status tracking
- Review and publish pattern
- Useful tables and badges

### Issues

- Wizard semantics are incomplete
- Numerous inline click handlers
- Target chips need checkbox/radio semantics
- Publishing should require confirmation
- Date validation and timezone handling need specification
- Large assignments need preview and validation
- Partial drafts and recovery are not fully addressed
- No clear mobile wizard layout is evident

### Recommendation

Use a four-step production wizard:

1. Target
2. Content
3. Schedule
4. Review and publish

Persist draft state and use idempotent publish APIs.

**Priority:** P2

---

## 16. Admin Intelligence

### Strengths

- Clear separation from student-facing design
- Appropriate dense admin presentation
- Content quality and coverage concepts
- Heatmaps and issue insights
- Dark sidebar creates role distinction

### Issues

- Typography is especially small
- Admin screen has limited accessibility semantics
- Psychometric claims require sufficient response volume
- Automated “miskeyed” or “ambiguous” conclusions must be advisory, not definitive
- Retry and remediation actions require audit logging
- Content quality alerts must link to item evidence
- Current launch scope may not support this intelligence layer

### Recommendation

Start with operationally safe features:

- Job status
- Question validation failures
- Coverage gaps
- Manual review queue
- Audit history

Defer performance intelligence until sufficient real data exists.

**Priority:** P3

---

# Product Architecture Findings

## 1. Do Not Treat the Mockups as the Application Architecture

These files are standalone prototypes. They include:

- Inline styles
- Inline JavaScript
- Repeated tokens
- Hard-coded data
- Direct page navigation
- Demo state controls
- External Tailwind CDN
- External Google Fonts

Production should use:

- Shared React components
- Typed route configuration
- API DTOs
- Central state patterns
- Shared layout shells
- Tested UI primitives
- Build-time Tailwind
- Local or optimised font loading

## 2. Build Four Application Shells

### Public Shell

- Landing
- Authentication
- Pricing
- Help

### Student Shell

- Dashboard
- Learn
- Practice
- Assignments
- Results

### Parent Shell

- Dashboard
- Children
- Reports
- Learning plan
- Billing

### Teacher/Admin Shell

Use separate sidebars and permissions.

## 3. Create a Shared Component Inventory

At minimum:

- Button
- Card
- Badge
- Tabs
- Dialog
- Drawer
- Select
- Checkbox
- Text field
- Empty state
- Loading state
- Error state
- Progress bar
- Skill bar
- Stat tile
- Question map
- Results ring
- Data table
- App header
- Student navigation
- Parent navigation
- Teacher sidebar

## 4. Define One State Contract Per Screen

Every data-driven page should explicitly support:

- Loading
- Content
- Empty
- Error
- Unauthorized
- Tier-gated
- Offline where applicable

---

# Accessibility Release Gates

Before implementing these mockups as production screens, require:

1. WCAG 2.2 AA contrast
2. Zero serious or critical axe violations
3. Complete keyboard navigation
4. Visible focus on every control
5. Proper tab, accordion and dialog semantics
6. Accessible names for icon buttons
7. Text alternatives for charts and progress rings
8. 44×44px minimum targets
9. 200% zoom support
10. 320px viewport support
11. Reduced-motion support
12. Screen-reader testing for:
   - Authentication
   - Exam taking
   - Submission
   - Results
   - Child switching
   - Assignment creation

---

# Recommended Adoption Decision

## Adopt as Primary References

- `02-dashboard.html`
- `03-parent-dashboard.html`
- `05-student-home.html` as session selection
- `07-exam-engine.html`
- `08-practice.html`
- `09-results.html`
- `10-student-assignments.html`

## Adapt Carefully

- `01-authentication.html`
- `04-billing.html`
- `06-learning-hub.html`
- `12-teacher-dashboard.html`
- `13-teacher-student-detail.html`
- `14-analytics.html`
- `15-assignment-engine.html`

## Keep as Future Reference Only

- `11-engagement.html`
- `16-admin-intelligence.html`

---

# Recommended Implementation Order

## Phase 1 — Student and Family MVP

1. Shared design system
2. Authentication
3. Student dashboard
4. Session selection
5. Practice engine
6. Exam engine
7. Submission review
8. Results
9. Parent dashboard
10. Child management
11. Help and reporting

## Phase 2 — Learning and Retention

12. Learning hub
13. Student assignments
14. Limited engagement widgets
15. Billing

## Phase 3 — Teacher Platform

16. Teacher dashboard
17. Student detail
18. Assignment engine
19. Analytics

## Phase 4 — Administration and Intelligence

20. Admin jobs
21. Content review
22. Coverage monitoring
23. Performance intelligence

---

# Final Assessment

The mockups represent a strong and ambitious platform vision. They are visually coherent and demonstrate thoughtful assessment, parent and teacher workflows.

However, they are not yet a production-ready design system.

The most important next step is not creating more mockups. It is consolidating these into:

- One agreed product scope
- One role-based route map
- One component library
- One typography system
- One accessibility standard
- One implementation contract

With that consolidation, the suite can serve as a high-quality foundation for a premium MindMosaic platform.
