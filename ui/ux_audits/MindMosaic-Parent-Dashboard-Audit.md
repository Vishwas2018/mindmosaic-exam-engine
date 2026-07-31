# MindMosaic Parent Dashboard — Independent UI/UX and Product Audit

## Overall Verdict

This screen is functional and understandable, but it currently feels more like an internal administration page than a premium parent dashboard.

| Area | Rating |
|---|---:|
| Information architecture | 7.5/10 |
| Visual polish | 7/10 |
| Parent usability | 7/10 |
| Empty-state quality | 7.5/10 |
| Accessibility | 7/10 |
| Product maturity | 6.5/10 |
| Overall | **6.9/10** |

## What Is Working Well

- Clear child switching with name and year level
- Parent-friendly heading: “How [Child] is doing”
- Useful no-results empty state
- Simple child creation flow
- Contextual primary action: “Start a session for [Child]”

## High-Priority Issues

### 1. Billing error dominates the screen

The billing failure appears as the first major card and makes the platform look unstable.

**Change:**
- Move it to a small dismissible banner
- Add **Retry** and **Manage billing**
- Keep the dashboard focused on the child

### 2. The page does not yet feel like a dashboard

It currently contains a child switcher, an empty result area and an expanded child form.

**Add for a new child:**
- Onboarding checklist
- Recommended first assessment
- Supported subjects
- Student-login guidance
- Learning-plan preview

**Add after activity exists:**
- Sessions this week
- Average score
- Topics practised
- Skills improving
- Latest result
- Recommended next session

### 3. The Add Child form should not remain expanded

Use an **Add another child** button and open the form in:
- a modal,
- side panel, or
- `/parent/children`

### 4. Child switching will not scale

Use a dropdown or searchable switcher for larger families. Add clearer identifiers where children share the same name.

### 5. “Read-only view” is technical and confusing

Replace with:

> View [Child]’s completed sessions, progress and recommended next steps.

## Header Audit

### Working well
- Visible logo
- Simple navigation
- Useful role badge
- Clear sign-out action

### Improve
Add:
- Reports
- Learning plan
- Billing
- Help
- Notifications
- Profile menu with settings, privacy and sign out

## Empty-State Audit

Add an action to the current empty state.

**Primary CTA:** Start [Child]’s first practice session  
**Secondary CTA:** See available subjects

Supporting copy:

> Results and progress insights will appear here after the first completed session.

## Add Child Form Audit

### Improve the PIN experience
Clarify:
- Numeric-only input
- Six-digit validation
- Whether leading zero is allowed
- Uniqueness requirements
- Show/hide control

### Rename the action
Replace **Create login** with:

> Add child and create login

### Make year level required
Year level affects assessment selection, difficulty, curriculum mapping and recommendations.

### Show generated credentials clearly
After creation, show:
- Student code
- PIN
- Copy controls
- Print option
- Reset credentials action
- One-time visibility warning where applicable

## Visual Design Issues

### Too much pale background
Use white content surfaces and reserve lavender for framing or selected sections.

### Weak hierarchy
Recommended order:
1. Child switcher and greeting
2. Progress summary
3. Recommended next action
4. Recent activity
5. Supporting administration

### Inconsistent button priority
Use:
- Primary: Start or continue learning
- Secondary: Manage children
- Tertiary: Account administration

## Accessibility Checks

Confirm:
- Keyboard-operable child selector
- `aria-selected` on selected child
- Properly associated form labels
- Accessible billing alert
- Decorative empty-state icon
- 44×44px minimum targets
- Visible focus states
- Announced validation errors
- `aria-describedby` for PIN guidance

Test at:
- 200% zoom
- 320px width
- Keyboard-only navigation
- Screen reader

## Product Owner Gaps

A complete parent dashboard should eventually include:

1. Readiness summary
2. Recent results
3. Skill mastery
4. Recommended practice
5. Assignments
6. Weekly activity
7. Child-login management
8. Learning plan
9. Progress reports
10. Notifications
11. Subscription status
12. Help and support

## Recommended Page Structure

### Top
- Parent greeting
- Child switcher
- Notifications
- Start practice CTA

### Summary Row
- Sessions this week
- Average score
- Topics practised
- Skills improving

### Main Content
- Latest result
- Subject mastery
- Recommended next activity
- Recent sessions

### Supporting Content
- Child login details
- Manage children
- Billing status
- Help and support

## Priority Fixes

### Critical
1. Remove the large billing error from the top
2. Add an actionable first-session empty state
3. Move Add Child into a modal or separate screen
4. Replace “read-only” wording
5. Add real dashboard or onboarding content

### Important
6. Improve child-switcher scalability
7. Make year level required
8. Improve child credential management
9. Add reports, billing and support navigation
10. Strengthen visual hierarchy

## Final Assessment

The screen has a solid functional foundation, but it currently feels like a child-management page with a results placeholder rather than a complete parent dashboard.

The next iteration should shift the focus toward:

- Progress
- Recommendations
- Activity
- Readiness
- Parent guidance
