# MindMosaic — Design System & Student Experience Guide

Version: 2.1 · Updated: 10 September 2026

## Stitch — read this first

Design direction: **sleek, light, precise and quietly premium**. Use Roboto Regular (400) for reading and Roboto Medium (500) for headings and controls. Do not use bold, extra-bold, broad geometric display faces or oversized heavy headings. Establish hierarchy through size, spacing and placement, not heavier strokes. The original guide's 600/700/800 weight rules are superseded.

Use the supplied logo artwork, not a generated logo and not typed replacement lettering. The logo's existing wordmark is an image asset and is exempt from the lighter interface typography. Its embedded colours are also exempt from recolouring to the interface tokens. See section 7 for exact asset rules.

Keep all five agreed navigation destinations, full catalogue browsing and Vihaan, Year 5. This revision changes typography and logo handling; it does not revert the original guide's retired navigation or restrict the catalogue to Year 5.

The accompanying ZIP contains this guide plus both unchanged logo images. Extract it and supply the Markdown and images together to Stitch. Relative image previews below resolve in the extracted package; a Markdown file alone does not embed the image bytes. If an attachment is unavailable to Stitch, ask for that asset rather than drawing a substitute.

## 0. Purpose, authority and implementation status

This is the target design and page-authoring specification for MindMosaic. It combines product structure, student journeys, visual design, accessibility, interaction behaviour and frontend implementation requirements.

The decisions in this version replace the previous document's student navigation and top-navigation requirement. The target student experience uses **Dashboard · Learning Hub · Practice Studio · Exam Centre · My Progress**, with a shared desktop sidebar and mobile menu.

This document defines intended behaviour; it does not certify that the repository, database or content catalogue already supports it. Inspect existing code, schemas and published content before implementing. Component names and paths mentioned here are references from the earlier guide and must be verified. Never invent an API, route, field, curriculum mapping or available programme to satisfy a mockup.

### Authority and migration

- Owner instructions govern product decisions and approvals. Repository instructions govern implementation workflow and security requirements.
- Use this file as the canonical design guide once adopted into the repository. Reconcile conflicting design sections in BRAND.md and other guides during that change; do not leave competing rules.
- Retire duplicate design guidance with a short pointer to this file. Preserve historical material where needed, clearly labelled as historical.
- Reuse the current implementation where it meets this specification. Do not rename routes, replace working components or introduce a second shell simply to match display labels.
- Changes to source control follow repository checks. Do not merge to main without the owner's explicit approval.
- The earlier Stitch reference, project 1921307846164372578 / screen 5134638155307943842, is a historical visual reference. Its live contents have not been inspected for this revision and do not override these requirements.

## 1. Product purpose and experience principles

MindMosaic helps students understand concepts, practise skills and prepare for assessments through original questions, clear worked explanations and useful activity feedback.

The product spans curriculum learning and assessment preparation, including NAPLAN, ICAS, AMC, Olympiad, selective entry, scholarship preparation and Singapore Maths. The interface must accommodate the wider offering without claiming that all content is already published.

Students should always understand:

1. **Where am I?** A clear page title, selected navigation item and meaningful breadcrumb.
2. **What can I do here?** A concise description and recognisable content choices.
3. **What happens next?** A specific action with predictable behaviour.
4. **How did my attempt go?** Factual results with answer explanations.

### Core principles

- **Guidance with choice:** offer a useful starting point without forced sequencing.
- **Full catalogue, manageable depth:** expose the relevant offering at each destination; reveal detailed lessons and questions as students navigate deeper.
- **One visual system:** shared brand, typography and components across the product.
- **Role-appropriate experiences:** Student, Parent, Teacher and Admin share design foundations; their navigation, permissions and information density differ.
- **Calm and capable:** clear educational content, restrained visual detail and no competitive or guilt-based mechanics.
- **Honest state:** availability, saved work and performance must reflect actual data.

## 2. Data-honesty contract

### Never present

- Invented counts, attempts, accuracy, activity history or personalised recommendations.
- Mastery/proficiency percentages, predicted scores, exam readiness scores or NAPLAN band projections.
- Per-lesson mastery/completion bars inferred from opening a page or viewing content.
- Achievement stars, reward badges, streaks, points, student rankings or gamified levels.
- Peer/cohort comparisons or pressure to maintain daily attendance.
- Sequentially locked published lessons. Published lessons are independently reachable within legitimate access permissions.
- Term/week roadmaps or scheduled learning calendars without an explicitly approved scheduling feature and authoritative data.

### Permitted with evidence

| Display | Required evidence and interpretation |
| --- | --- |
| Lessons or questions available | Actual accessible, published items matching the current context and filters |
| Estimated lesson duration | Authored per-lesson estimate, labelled as an estimate |
| Question 5 of 8 | Current session position and its actual question set |
| 4 of 8 questions answered | Saved responses in that session; this is session status, not mastery |
| 6 of 8 correct | Scored attempt, explicit scoring basis and treatment of unmarked/unanswered items |
| Time spent | Recorded duration with a defined measurement method; do not silently treat tab-open time as engagement |
| Continue practice | A real session that can be restored for the current student |
| Recommended activity | A documented selection rule using actual context and content |
| Category/status chip | A factual category or state, never an earned achievement |

A lesson count is not a student-completion count. A school year or curriculum level is not a gamified level. A status Badge component is allowed; an achievement badge is not.

If required evidence is missing, omit the metric and retain a useful action or honest empty state. Do not substitute invented estimates. A failed query is an error state, not zero content.

**Prototype exception:** clearly documented fixtures may be used in mockups and development previews. Keep them separate from production data, never as a production fallback. See section 15.

## 3. Global navigation and shared shell

### Exact student navigation

| Label | Purpose | Scope |
| --- | --- | --- |
| **Dashboard** | Help me choose what to do next | Genuine unfinished work, starting choices, recent activity and catalogue entry points |
| **Learning Hub** | Help me understand a concept | Curriculum/pathway catalogues, subjects, strands, lessons and worked examples |
| **Practice Studio** | Help me apply a skill | Full skill-practice catalogue, configurable practice and supported question attempts |
| **Exam Centre** | Help me prepare for an assessment | Assessment programme catalogues, programme-specific practice and sample tests |
| **My Progress** | Help me review my work | Personal attempts, recorded results, explanations and evidence-supported next actions |

Use these labels consistently in navigation, headings, breadcrumbs and accessible labels. Do not introduce competing Learn/My Learning/Subjects primary destinations. Assignments is not a primary destination in this version; preserve existing supported functionality until its placement is explicitly resolved.

### Desktop and mobile

- At viewport widths of 1024px and above, use one shared 240px student sidebar. The logo is at the top, five destinations below, and Help plus the profile menu at the bottom.
- Below 1024px, use a compact header with the logo, current identity and a labelled Menu button. It opens a modal navigation drawer containing the same destinations and utilities.
- The drawer must support keyboard access, Escape to close, focus containment while open and focus return to the triggering button. Close it after destination selection.
- Profile menu: Profile, Settings and Sign out. Help remains directly reachable. Do not add nonfunctional utility controls to a prototype without identifying the limited scope outside the product screen.
- Active navigation combines background treatment, text emphasis and aria-current; colour alone is insufficient.
- The approved logo always returns to Dashboard in the student shell. Do not redraw or approximate its brain symbol.
- Provide a visible-on-focus Skip to content link and exactly one main-content target.

### Shell ownership

Reuse StudentShell across the student experience where that component exists. Retire a separate LearnSidebar when migrating; do not nest a second application shell inside it. The shell owns the primary header/navigation, skip link and main landmark. Page components supply page content, not another main element. Inspect the existing structure before changing this ownership.

Public pages share tokens and components but use public navigation and authentication actions. Parent/Teacher/Admin use the same shell primitives with their own navigation and permissions. A shared design system does not require identical page structure for all audiences.

### Focus mode

An active practice or test may collapse global navigation. Retain the activity name, essential session controls, question position and save state. This is a shell state, not another visual system. Test-specific restrictions are explicit before start; ordinary lesson browsing never hides global navigation.

## 4. Full catalogue and discovery contract

Each destination exposes its complete relevant offering. The Dashboard remains a summary. Catalogue landing pages show pathways/programmes and entry points, not thousands of lesson cards at once.

### Catalogue ownership

| Destination | Catalogue and hierarchy |
| --- | --- |
| Learning Hub | Curriculum/pathway → year or curriculum level → subject → strand/topic → lesson |
| Practice Studio | Curriculum/pathway and level context → subject → skill/topic → practice activity |
| Exam Centre | Programme → applicable year/division and subject → preparation activity or sample test |
| My Progress | Current student's recorded activity only; no general content catalogue |

Learning Hub includes **Australian Curriculum, Victorian Curriculum and Singapore Maths** as named product pathways. Include other owner-approved curriculum options from the authoritative catalogue; do not hardcode a three-card ceiling. Singapore Maths is a structured learning approach, not an Australian jurisdictional curriculum. Use accurate descriptions rather than implying these pathways are equivalent standards.

Exam Centre includes **NAPLAN, ICAS, AMC, Olympiad, Selective Entry and Scholarship Prep**. Olympiad and scholarship/selective preparation may require more specific programme/provider choices. Do not treat them as one uniform examination. Add state, provider, division or subject selection only where authoritative programme metadata requires it.

Singapore Maths belongs in Learning Hub and Practice Studio, not the exam catalogue. Programme-specific practice is discovered in Exam Centre and may use the shared practice engine while retaining programme context. Do not duplicate question records to support multiple entry points.

### Year and level

- The student's assigned year comes from their profile and establishes a relevant initial view.
- Provide an explicit **Explore other year levels** control for catalogue browsing. Browsing never changes the profile year.
- Retain an accessible All available levels option where the catalogue supports it.
- Preserve curriculum-specific labels. Victorian Curriculum Level and school Year must not be silently treated as interchangeable.
- A student's year must not hide entire programme/pathway categories from discovery. Detail pages show relevant eligibility and available content honestly.

### Search and filters

- Learning Hub: pathway/curriculum, year or level and subject; deeper pages may add strand/topic.
- Practice Studio: pathway/curriculum, year or level, subject and topic.
- Exam Centre: programme, applicable year/division, subject and activity type. Programme-specific selectors appear in context.
- My Progress: activity type, subject/programme and date range.
- Use a clearly labelled search field scoped to the current destination. Do not add a global search field until global search actually works.
- Show selected filters, Clear filters and a matching-result count when supplied accurately. On mobile, use a labelled Filters control with an accessible panel; keep active filters visible outside it.
- Store browse filters, sort and pagination in the URL where supported, so refresh and Back preserve context. Never place private student information in query strings.
- Default curriculum order follows the authored curriculum sequence; default attempt order is newest first. Only offer sorting choices the data can support.
- Display only relevant filters. If changing a parent filter invalidates a child filter, clear the incompatible selection and explain the change accessibly.

### Availability and access

| State | Student-facing behaviour |
| --- | --- |
| Published and available | Show factual details and a working start/open action |
| Published lesson with no online questions | Allow the lesson; show No online practice available only where relevant |
| Classroom activity classification | Use Classroom activity; do not claim Practised in class without a record |
| Confirmed planned release | Coming soon may be shown; do not invent a release date |
| Programme known, no verified release status | In design work, annotate Needs availability verification outside the student UI; production must use a valid catalogue state |
| Restricted by account entitlement | Explain access before starting and route account management to the authorised adult/account experience |
| No matches | Explain the filter outcome and offer Clear filters or a relevant available category |
| Loading/error | Render distinct loading/error states, never misleading zero counts |

Listing a programme does not establish available content. Content coverage and entitlement are separate concepts. Do not use lock graphics for sequential learning progression or imply that inaccessible content has been earned or failed.

## 5. Screen specifications

### 5.1 Dashboard

Heading: **Welcome back, Vihaan** for the returning-student fixture; use a brief first-visit greeting for a new account. Supporting text: **What would you like to work on today?**

Order:

1. **Pick up where you left off:** one genuine resumable activity with its title, context, saved answered count and Continue practice action. If there are multiple sessions, show the most recently updated resumable session and an accessible route to the others.
2. **Choose a subject:** direct entries to published subjects within the current learning context. Mathematics and English are fixture examples, not a permanent subject limit.
3. **Explore MindMosaic:** three compact links to Learning Hub, Practice Studio and Exam Centre. The full curriculum/programme cards belong on those destinations.
4. **Recent activity:** a short list of completed attempts with date, context, result when valid and Review answers. Link to My Progress for the full list.

Without saved work, replace the first card with **Choose your first activity** and a clear Learning Hub entry. Do not leave empty statistics or fabricate a personalised diagnosis. Keep the starting action visible in the first desktop viewport without an oversized hero.

### 5.2 Learning Hub and lesson

Landing heading: **Learning Hub**. Description: **Explore a subject and understand something new.** Show the full pathway catalogue, browse controls and accurate availability.

Meaningful depth uses routes and breadcrumbs. A lesson retains pathway, subject and strand context. Tabs are only for alternate views of the same entity, not substitutes for curriculum navigation.

Lesson order: title → learning objective → short explanation → accurate visual where useful → worked example → related practice action. Break long explanations into readable sections. Provide a Back link that preserves browsing context.

Use **Practise this skill** only when related published questions are available. Opening a lesson is not proof of learning or completion. Reading support and accessible mathematical text must remain available with visual examples.

### 5.3 Practice Studio and runner

Heading: **Practice Studio**. Description: **Build confidence, one skill at a time.** Show the full available skill-practice catalogue with filters and activity cards.

Setup shows subject/skill, supported question count and timing mode. Default general skill practice to untimed. Offer only configuration options that the question pool and engine actually support; disable invalid combinations with an explanation.

Runner: activity name, question position, prompt, response controls, optional Show hint, Check answer and Save and exit. Preserve the response while displaying feedback. Check answer requires a valid response; submission must not occur merely from choosing an option.

After checking: show correctness in text, a clear explanation and Next question. Related lesson links are secondary. Record hint use, answer revisions and original responses when the engine supports these distinctions; do not silently replace first-attempt performance with a corrected answer.

Support every implemented question type with its own accessible interaction. The multiple-choice fixture is not a specification limiting the engine to one type.

### 5.4 Exam Centre and test runner

Heading: **Exam Centre**. Description: **Choose a programme and prepare for its question styles.** Programme detail separates **Supported practice** from **Timed sample test**, with accurate descriptions and rules.

Before starting a test, disclose question count, configured duration, navigation rules, pause/leave behaviour, expiry handling and when results become available. Use programme-style/sample wording for original preparation material. Do not imply official endorsement, official test length or exact official scoring without verified authorisation and specifications.

The runner offers no hints, answer checks, explanations or retries before submission. Provide question navigation, unanswered status and review flags where the assessment rules permit them. Flags are personal review markers, not achievements. Always show current timing and submission state.

At submission, display the real unanswered count and offer Return to questions or Submit test. Confirmation must not promise all answers are scored if manual review is required.

### 5.5 My Progress and answer review

Heading: **My Progress**. Description: **Look back at your practice and review your answers.** Default to dated attempt history with filters, rather than decorative metrics.

Completed attempts show activity, subject/programme, mode, date, result status and Review answers. Put resumable sessions in a separate In progress section without final scores. Show Awaiting review for responses that need marking.

Answer review shows the prompt, submitted answer, correct/accepted answer or rubric, explanation, relevant assistance history where recorded and a mapped related lesson. Preserve unmarked states and scoring rules. Never reveal another student's data through direct links or filters.

Avoid inferred trends across different question sets, difficulty or modes. Any future aggregate requires a documented definition, comparable evidence and an approved display design.

## 6. Session, recovery and recommendation contracts

### Shared session behaviour

- Continue restores the correct current student's existing session and saved responses. A submitted or expired attempt is not resumable unless its explicit policy allows it.
- Completed attempts offer Review answers and a separate Start new practice/test action. Never overwrite the original attempt.
- Save status is explicit: Saving, Saved or Not saved. Show Saved only after confirmation from the authoritative persistence layer.
- Save failures preserve input where feasible and offer retry. Prevent duplicate session creation, scoring or submission on repeated clicks.
- Session ownership and entitlement are enforced beyond the UI. Switching student identity must never restore the previous student's answers into the new profile.

### Practice versus timed tests

| Event | Practice | Timed test |
| --- | --- | --- |
| Leave | Save and exit; report a failure honestly | Warn that timing continues for tests with the standard policy below |
| Return | Resume saved state | Restore within the valid deadline; otherwise show the expired outcome |
| Connection loss | Retain unsaved input safely where feasible and retry | Keep the authoritative deadline; explain that unsaved responses are not confirmed |
| Expiry | Not applicable to default untimed practice | End answering and finalise acknowledged responses according to the declared policy |
| Explanation | Available after answer check | Available after final submission and release of results |

**Target default for ordinary timed sample tests:** no pause; the deadline continues after navigation away; at expiry, finalise acknowledged saved responses. Implement this only with reliable server-side timing and finalisation. If the existing engine cannot support it, surface the implementation gap; do not advertise unsupported behaviour or invent a client-only guarantee. Approved accommodation or programme-specific policies override the default and must be stated before start.

### Guidance

Start with transparent rules: resumable activity first, relevant available activity second. A new student can choose a goal or skip to browsing. One incorrect answer is not sufficient evidence of a persistent weakness. A related lesson may be offered through a verified question-to-skill mapping without calling it a diagnosis.

Future goals, interests, presentation preferences and AI-assisted explanations must retain learner choice. AI explanations, if approved and implemented, must be grounded in verified content, preserve the approved answer and provide a report mechanism. Do not add an AI chat control as decoration or make a diagnostic mandatory in this version.

## 7. Brand and semantic tokens

### Foundations

Interface primary purple **#5925A8** · coral accent **#FF555A** · warm page **#FCFBF8**. These remain the portal's UI colours. Use the supplied brain-and-wordmark image exactly as provided: its wordmark colours and multi-coloured brain artwork take precedence inside the logo only. Do not sample new portal colours from the logo or recolour the logo to match the UI tokens.

### Supplied logo assets — mandatory for Stitch

| Packaged asset | Original attachment | Use |
| --- | --- | --- |
| assets/mindmosaic-logo-reference.png | 6855a863-7b85-4939-8afc-865c29c5b0bb.png | Primary horizontal brain-and-MindMosaic lockup, including its supplied registration mark |
| assets/logo-brain.png | logo-brain.png | Original standalone brain artwork for compact brand placement where the full lockup cannot fit |

Primary logo reference:

![Supplied MindMosaic brain and wordmark; preserve original artwork](assets/mindmosaic-logo-reference.png)

Standalone brain reference:

![Supplied MindMosaic brain artwork](assets/logo-brain.png)

- The full logo is the default in the desktop sidebar and the 390px mobile header. Do not place an additional typed MindMosaic wordmark beside it.
- Preserve the brain's puzzle pieces, circuit details, branching pattern, colours, highlights and outline. Do not simplify, trace, regenerate or replace it with a generic brain icon.
- Preserve the wordmark's letterforms, spacing, proportions and supplied registration mark. Do not change the asset's font to Roboto, lighten its lettering or add another registration mark. Including the supplied mark is a fidelity instruction, not verification of registration status.
- Fit the full supplied image within a 208px-wide desktop logo area and a 184px-wide mobile area using proportional sizing. Its original surrounding padding is part of this supplied reference; assess the visible mark, not just the outer image box. Do not stretch or crop the artwork to fill the area.
- Leave at least 12px clear space outside the image, use a quiet light backing surface and keep other navigation content separate. Do not add a coloured tile, border, shadow or animation to the logo.
- If the full mark becomes unreadable in a tighter layout, use the supplied standalone brain with an accessible MindMosaic label. Do not silently substitute a text-only logo.
- The standalone brain has a wide surrounding canvas. Do not shrink the entire canvas into a tiny square and claim the icon is readable. A tightly framed production export may be requested later; do not redraw or modify the provided source files in this task.
- Use a link named MindMosaic — Dashboard. If the link already supplies the accessible name, treat its image as decorative to avoid duplicate announcements.
- Both supplied images are raster references. Do not claim they are vector assets or sufficiently detailed at arbitrary sizes. A dedicated production SVG/transparent lockup can be commissioned separately; use these exact references for this mockup.

Define colours once in the central stylesheet and mirror them through the existing token pipeline where present. Never hardcode hex in JSX. The following is the target token contract; inspect and reconcile existing names before adding aliases. Do not assume these utilities already exist.

| CSS token | Value | Intended use |
| --- | --- | --- |
| --mm-brand | #5925A8 | Primary actions and active navigation |
| --mm-brand-deep | #4A1E8D | Primary hover/pressed emphasis |
| --mm-brand-tint | #F0EAF8 | Subtle selected surface |
| --mm-brand-mid | #9B72CE | Decorative brand detail only; no implied mastery meter |
| --mm-coral | #FF555A | Restrained decorative accent; no normal white button text |
| --mm-coral-text | #CC2429 | Accent text on verified light surfaces |
| --mm-coral-deep | #98262C | Legacy dark coral alias; prefer semantic error tokens for errors |
| --mm-page | #FCFBF8 | App page background |
| --mm-surface | #FFFFFF | Cards, menus and dialogs |
| --mm-surface-quiet | #F7F5F9 | Neutral secondary panels |
| --mm-ink | #18151F | Headings and primary content |
| --mm-ink-soft | #3D3846 | Secondary emphasis |
| --mm-muted | #625D69 | Supporting text |
| --mm-muted-2 | #6D6774 | Secondary labels and placeholders |
| --mm-border | #DED9E4 | Decorative separators and card outlines |
| --mm-control-border | #81778C | Identifiable control boundaries |
| --mm-focus | #5925A8 | Visible focus indicator |
| --mm-focus-offset | #FFFFFF | Separating focus offset |
| --mm-on-brand | #FFFFFF | Text/icons on primary purple |
| --mm-success | #216746 | Genuine success state text/icon |
| --mm-success-bg | #EDF7F0 | Success panel |
| --mm-warning | #795000 | Genuine warning text/icon |
| --mm-warning-bg | #FFF5DC | Warning panel |
| --mm-error | #98262C | Error text/icon and destructive actions |
| --mm-error-bg | #FCEEF0 | Error panel |

Status colours are semantic exceptions to the purple/coral brand palette, used only for genuine feedback and system state. Never use them to imply an unsupported learning status.

Provide semantic utilities such as bg-page, bg-surface, text-ink, text-muted, bg-brand, text-on-brand, bg-brand-tint and ring-focus through the project's styling system. Document their actual implementation mappings. The previous ambiguity where text-coral could mean either bright coral or dark coral text must be removed; prefer explicit text-coral-text.

Primary buttons use purple/white. Bright coral/white is approximately 3.13:1 and is unsuitable for normal-sized button labels under this guide's 4.5:1 rule. Verify every actual foreground/background pairing, including hover, focus, disabled treatment and status panels; a token table alone is not accessibility verification.

## 8. Typography, spacing and composition

Use **Roboto Regular (400) and Roboto Medium (500)** for all interface text and headings. Both --font-sans and --font-display resolve to Roboto; display is a role, not permission to introduce another family. Keep normal character width and normal font stretch. Do not use wide/expanded faces, broad geometric display fonts, faux condensed text or horizontal scale transforms.

Load only the required 400 and 500 weights once through the project's font pipeline. Do not add Hanken Grotesk or JetBrains Mono. Use a system monospace only for curriculum identifiers or technical codes when required. The supplied image wordmark is not interface text and must remain unchanged.

### Exact target type scale

| Role | Mobile / desktop size | Line height | Weight |
| --- | --- | --- | --- |
| Page heading | 26 / 32px | 1.25 | 400 |
| Section heading | 21 / 24px | 1.35 | 500 |
| Card heading | 18 / 19px | 1.4 | 500 |
| Body and controls | 16 / 16px | 1.5 | 400; controls 500 |
| Supporting text | 14 / 14px | 1.5 | 400 |
| Compact metadata | 12 / 12px | 1.4 | 500 |

Implement explicit semantic type styles matching these numbers; do not claim default text-sm/text-xs utilities produce other sizes. Use 12px only for nonessential compact metadata. Avoid all-caps instructional copy, very heavy micro-labels and long passages of muted text.

### Lightweight typography rules

- Sidebar labels: 15px, weight 400; active label 500 with a subtle selected background. Do not make every navigation item bold.
- Buttons, tabs and short form labels: weight 500 maximum. Body text and descriptions: weight 400.
- Page-title tracking: -0.01em; all other text: normal tracking. Do not use widely spaced uppercase labels to suggest a premium appearance.
- No font-semibold, font-bold, font-extrabold or font-black in student interface styles. Reset inherited browser bold styling on headings and strong text to at most 500 while preserving semantic meaning.
- Do not use 100/200/300 weights for functional text. Sleek must not mean faint, low-contrast or difficult to read.
- Keep paragraphs, question prompts and answers at a comfortable 16px. Make the page feel lighter through restrained headings and whitespace, not smaller essential text.
- Use high-contrast primary text and understated borders. Do not compensate for the reduced font weight with very pale text, oversized headings or extra-wide card titles.
- Visual acceptance: headings look lighter than the supplied logo wordmark, labels do not dominate their cards, and body copy remains readable at mobile size.

### Layout

- Spacing scale: 4, 8, 12, 16, 24, 32 and 48px.
- Main content maximum: 1280px within the available shell space. Lesson reading column: approximately 720px; runner response area may widen for diagrams or tables.
- Main horizontal padding: 16px mobile, 24px tablet, 32px desktop. Typical vertical padding: 24px mobile and 40px desktop.
- Cards: 16px radius; buttons and fields: 12px radius; subtle border and minimal shadow. Menus/dialogs use opaque surfaces.
- Grids use available content width: one column on mobile, two where cards remain readable, and up to three on wide desktop. Do not force three columns simply because the viewport crosses a breakpoint.
- Use one visually dominant action per section. Group secondary links near the action they support.
- No stock photographs, mascots, decorative stat tiles or oversized hero panels in the student workspace. Accurate diagrams and useful subject imagery are welcome when they support understanding.

## 9. Component and interaction standards

Reuse the existing accessible UI kit, expected under src/components/ui after verification. Extend shared variants rather than forking controls on individual pages.

- **Buttons:** primary, secondary, quiet and danger roles. Minimum 44px effective target; default 48px height. Loading preserves the label context and prevents repeated mutations. Use sentence case.
- **Links:** use links for navigation and buttons for actions. A Start lesson navigation action must resolve a real lesson destination. Avoid nested interactive elements inside a clickable card.
- **Cards:** title, meaningful context, availability and one primary action. Prefer a useful content summary over decorative icons. Do not hardcode counts or duration in production examples.
- **Category/status chips:** compact text labels; never use the same visual treatment to suggest earned achievements. Success is not a default colour for arbitrary question counts.
- **Forms:** persistent labels, clear optional/required state, inline errors associated with their fields and preserved input after errors. Placeholder text is not a label.
- **Tables:** appropriate for attempt history on desktop; use labelled stacked rows on mobile when necessary. Preserve comparison meaning and action context.
- **Dialogs/drawers:** accessible names, focus management, Escape behaviour and clear dismissal rules. Destructive/session-ending actions state their consequence.
- **Question controls:** accessible labels and keyboard operation for each supported type. Drag interactions require an alternative that does not depend on dragging.
- **Empty, loading and error states:** reuse shared components. Distinguish no history, no matching content, no entitlement and failed loading. Do not render guessed counts in skeletons.
- **Boundaries:** place loading/error boundaries at meaningful route or data boundaries. Reuse existing handling; do not mechanically add redundant files to every route segment.

## 10. Accessibility and motion requirements

These are product acceptance requirements; verify the rendered experience rather than declaring compliance from code examples.

- Logical landmarks, one page h1, meaningful heading hierarchy and exactly one main-content target.
- Normal text contrast at least 4.5:1; large text at least 3:1; required control boundaries and meaningful icons at least 3:1 against adjacent colours.
- Use a clearly visible focus treatment, such as a solid 2px focus outline with a 2px separating offset. Verify it on each surface; a translucent brand/20 ring is not sufficient by assumption.
- Effective interactive targets at least 44 × 44px. Maintain comfortable spacing between adjacent targets.
- All interactions keyboard-operable, without positive tabindex or accidental traps outside modal contexts. Active navigation uses aria-current.
- Decorative icons are hidden from assistive technology; meaningful icon-only controls have accessible names. Prefer visible action labels.
- Use polite live announcements for save/answer status and errors appropriately. Do not announce every timer second or cause repetitive screen-reader interruption.
- Support zoom and narrow reflow without losing content or actions. Complex tables/diagrams may scroll in a labelled local region when reflow cannot preserve meaning.
- Provide useful text alternatives for instructional visuals and accessible mathematics. Meaning must not rely on colour, position or animation alone.
- Use short 150ms transitions on specific properties. Respect reduced-motion preferences. Avoid transition-all, continuous animation, bouncing cards and unnecessary layout movement.
- Keep disabled controls understandable; explain why an important action is unavailable rather than relying only on reduced opacity.

## 11. Content and tone

Use Australian English and direct, respectful language. Navigation uses the noun **Practice Studio**; instructional verbs use **practise**. Prefer Start practice, Practise this skill, Review answers and Save and exit.

Use supportive corrections: explain the reasoning, not a judgement about the student. Avoid Genius, You are falling behind, Keep your streak or claims of guaranteed exam success. Taking a break is an ordinary action.

Use programme-style labels for original preparation content. Keep curriculum codes as secondary metadata with readable subject/lesson names. Dates use an unambiguous local format; respect the student's configured timezone rather than assuming the server's timezone.

## 12. Frontend and content architecture

- Maintain one shared navigation configuration for labels, role visibility and destinations. Selected state must work for nested pages.
- Verify existing route IDs before implementation. Display labels do not require route changes. If a route migration is necessary, preserve deep links and redirects deliberately.
- Distinguish student profile year, browse-level selection, curriculum identifiers, programme eligibility and activity mode in the data model.
- Reuse canonical content and skill identifiers. Learning Hub and Exam Centre can link to the same skill or engine without duplicating content or losing entry context.
- Prefer explicit supported capability/state contracts to hardcoded UI assumptions: published lesson availability, practice availability, resumability, timing policy and marking status.
- Resolve real content on the server or through approved data-access layers. Enforce identity, ownership and entitlement there; hiding navigation is not access control.
- Avoid publicly caching student-specific responses. Any temporary local recovery state must be scoped safely, cleared appropriately and follow repository privacy rules.
- Validate authored diagrams, worked examples, accepted answers and mappings before publication. Provide a Report a problem action with question/lesson context attached through the approved reporting flow.
- Do not introduce unverified TSX recipes claiming to match component APIs. Implementation examples must compile against inspected local components and use real data or explicitly isolated fixtures.

## 13. Page-authoring workflow

1. Identify the destination, student question and primary action.
2. Inspect the current route, shell, shared components and existing content/session capabilities.
3. Define required data and permitted states before drawing metric tiles or start actions.
4. Implement the page with shared tokens, accurate navigation context and real catalogue data.
5. Include loading, no-data, filtered-empty, error, restricted and interrupted states where applicable.
6. Verify that every link, filter and control has the promised behaviour; retain Back/refresh context.
7. Check keyboard, mobile, save/recovery and answer feedback on the completed journey.
8. Report implemented behaviour, unresolved dependencies and actual checks performed. Never mark work complete from a screenshot alone.

## 14. Verification and release gates

Use the repository's actual scripts and required gates. The previous guide listed npm run typecheck, npm run lint, npm test and npm run build; verify those scripts exist and use their current equivalents. A documentation-only edit does not require running the full application suite.

For implementation changes, verify the affected behaviour and required CI gates:

- [ ] Exact five navigation labels; one consistent student shell; all nested destinations retain context.
- [ ] Full relevant curriculum/programme discovery with honest availability and level exploration.
- [ ] No profile-year mutation from catalogue filters; no cross-student content leakage.
- [ ] All numbers, estimates and statuses have a documented data source.
- [ ] Working lesson-to-practice and programme-to-test journeys; no fabricated or dead start actions.
- [ ] Continue restores a real session; submitted attempts remain immutable review records.
- [ ] Correct feedback separation between practice and test modes.
- [ ] Failed saves, double submission, connection loss and expiry behave according to the declared policy.
- [ ] Keyboard and assistive-technology checks on navigation, filters and representative question types.
- [ ] Contrast, visible focus, touch targets and reduced motion checked on actual components.
- [ ] Responsive checks at 375, 390, 768, 1024 and 1440px, plus narrow reflow and zoom where affected.
- [ ] Automated accessibility checks have no unresolved serious/critical findings; manual checks cover what automation cannot establish.
- [ ] Required type, lint, test and build checks pass; any unrun gate or blocker is explicitly reported.

Observe representative students finding a lesson, starting practice, understanding a correction, resuming work and reviewing an attempt. Record hesitation and requests for adult help. Product analytics may measure these transitions using approved minimal event data; clicks and session duration are not proof of learning gains.

## 15. Stitch/mockup fixture and delivery contract

### Fixed fixture

All example activity below is synthetic design data. Use **Vihaan, Year 5** consistently. Do not ship this fixture as a production fallback.

| Item | Exact example |
| --- | --- |
| Resumable activity | Equivalent fractions · Mathematics · 4 of 8 questions answered |
| Completed attempt | Reading comprehension · Practice · 6 of 8 correct · 8 September 2026 |
| Lesson objective | Recognise fractions that represent the same amount. |
| Explanation | Equivalent fractions name the same amount using different numbers. |
| Visual | Equal-length bars showing one of two equal parts and two of four equal parts shaded: 1/2 = 2/4 |
| Worked example | Multiply both numerator and denominator of 1/2 by 2 to get 2/4. |
| Practice question | Which fraction is equivalent to 1/2? |
| Options | 2/3, 2/4, 3/4, 1/4 |
| Correct answer | 2/4 |
| Hint | Multiply the numerator and denominator by the same number. |
| Feedback | 2/4 is equivalent to 1/2 because multiplying both 1 and 2 by 2 gives 2 and 4. |
| Sample test | NAPLAN-style Numeracy · 12 questions · 20 minutes; illustrative settings, not official specifications |

Use an illustrative Mathematics → Number → Equivalent fractions sequence. Do not attach an official curriculum code or claim exact year-level curriculum alignment without verification.

### Screens

Produce desktop screens at 1440px for Dashboard, Learning Hub catalogue, curriculum/subject browse, lesson, Practice Studio catalogue, practice question, Exam Centre catalogue, programme detail, test instructions and My Progress/answer review. Include representative mobile screens at 390px for navigation, Dashboard, a filtered catalogue, lesson and practice question.

Connect Dashboard → Learning Hub → Mathematics/Number example → lesson → practice → completed attempt review → Dashboard. Keep unfinished and completed fixtures distinct; the initial 4-of-8 session must not become a scored attempt merely through navigation. Also connect Exam Centre → NAPLAN → sample-test instructions and show the test-mode layout.

Include full curriculum/programme catalogue names from section 4. Use neutral discovery cards where availability is not supplied, with a separate design annotation recording that availability is unresolved. Enable the explicit sample flows as prototype fixtures only. Do not arbitrarily label the remaining programmes Coming soon or imply every catalogue card has live content.

Include new-student, filtered-empty, failed-save and unanswered-test-submission variants. Keep implementation annotations outside the depicted product UI. Use the exact supplied primary logo from section 7. If its attachment cannot be accessed, request it; do not generate or type a replacement logo.

### First Stitch pass for this revision

Produce the Learning Hub at 1440px desktop and 390px mobile using the same content and component system. Include the five-destination shell, Vihaan's profile context, the full named pathway catalogue and year-level exploration. Use Roboto 400/500 and the supplied primary logo. Do not add invented content counts or availability labels. Review this typography/logo direction before generating the remaining screens; the full screen list above remains the eventual delivery scope.

## 16. What this revision resolves

- Replaces legacy navigation with the five agreed destinations and a consistent sidebar/mobile shell.
- Adds full catalogue discovery and exploration beyond the assigned year without changing profile data.
- Separates curriculum learning, skill practice, programme preparation and personal history.
- Fixes ambiguity around factual session counts, status badges and unsupported learning metrics.
- Makes Roboto, type sizes, tokens, button colours and focus behaviour explicit.
- Adds honest availability, saving, resuming, test timing and answer-review rules.
- Replaces misleading production-style hardcoded examples with an isolated fixture contract.
- Keeps the guide actionable while clearly separating target design from unverified repository capabilities.
- Version 2.1 replaces heavy headings with the explicit Roboto 400/500 system and adds the unchanged supplied logo files, usage rules and Stitch asset handoff.
