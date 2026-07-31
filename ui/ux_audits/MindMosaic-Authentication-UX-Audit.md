# MindMosaic Authentication Audit — Parent Login, Student Login and Create Account

## Executive Verdict

The authentication page has a strong visual foundation and is more polished than a typical utility login screen. It is clean, friendly and aligned with the MindMosaic brand.

The main weakness is not appearance. It is journey clarity.

The current screen mixes:

- Parent login
- Student access
- Social login
- Account creation
- Sample exam promotion

These flows need clearer separation.

| Area | Rating |
|---|---:|
| Visual polish | 8.5/10 |
| Brand consistency | 8.8/10 |
| Parent login clarity | 8/10 |
| Student login clarity | 6.5/10 |
| Create-account journey | 6.8/10 |
| Accessibility | 7/10 |
| Conversion and trust | 7.5/10 |
| Overall | **7.8/10** |

---

# What Is Working Well

## 1. Strong Split-Screen Layout

The left panel reinforces the brand and product benefits while the right panel keeps the authentication form focused.

This is a proven SaaS pattern and works well here.

## 2. Clear Visual Hierarchy

The form sequence is easy to follow:

1. Welcome heading
2. Email field
3. Password field
4. Forgot-password link
5. Primary sign-in button
6. Alternative sign-in options
7. Create-account path
8. Student-code access

## 3. Strong Branding

The purple panel, MindMosaic logo and orange CTA create a clear visual identity.

The page feels connected to the landing page rather than looking like a generic authentication template.

## 4. Appropriate Tone

“Thoughtful practice, real progress” is warm and credible.

It works for both parents and students without sounding childish.

## 5. Clear Primary Action

The orange **Sign in** button is highly visible and appropriately dominant.

## 6. Useful Secondary Paths

The page includes:

- Forgot password
- Create an account
- Student-code login
- Sample exams

These are relevant journeys, provided they are fully implemented.

---

# Highest-Priority Issues

## 1. Parent and Student Access Are Not Clearly Separated

The page is primarily designed as an adult email-and-password login.

The student option appears only as a small link near the bottom, even though student login may be a primary journey.

### Recommended Structure

Add a segmented control at the top of the form:

```text
Parent / Teacher    Student
```

### Parent / Teacher Mode

Include:

- Email
- Password
- Forgot password
- Create parent account
- Social login only where fully implemented

### Student Mode

Include:

- Student code
- Optional PIN
- Friendly instructions
- “Ask your parent or teacher for your code”
- No social-login buttons
- No billing or account-management links

This will significantly reduce confusion.

---

## 2. Social Login Conflicts With the Defined v1 Scope

The page currently shows:

- Google
- Apple
- Microsoft
- Facebook

Your current v1 screen specification deferred social authentication.

Either:

- Fully implement and test the supported providers, or
- Remove them from the v1 interface

Do not show authentication methods that lead to placeholders, errors or incomplete flows.

Facebook should be a low priority for a child-focused assessment platform. Google, Apple and Microsoft are more relevant if social login is introduced later.

---

## 3. “Try Sample Exams” Conflicts With the Defined v1 Scope

The left panel includes **Try sample exams**, while the current v1 scope previously deferred pre-signup sample assessments.

This CTA should either:

- Open a complete and safe sample experience, or
- Be removed until that experience is ready

A dead or incomplete CTA will reduce trust.

---

## 4. Product Claims May Overstate Current Functionality

The left panel states:

- ICAS-style questions across all subjects
- An adaptive engine that adjusts to each learner

These claims should match production functionality.

Use more precise wording where necessary:

- “ICAS-style practice across selected subjects”
- “Personalised recommendations based on progress”

Do not promise features that are not yet operational.

---

## 5. Create Account Is Too Understated

“New here? Create an account” appears after the social buttons and is visually weak.

For a platform seeking parent registrations, signup should be more prominent.

### Recommended Treatment

Place this directly below the main sign-in button:

> New to MindMosaic? **Create a free parent account**

Then place social authentication below it only when supported.

---

# Parent Login Audit

## What Works

- Familiar email and password flow
- Clear forgot-password placement
- Strong primary CTA
- Professional and safe appearance
- Good alignment with the landing-page brand

## What Needs Improvement

### Add Role Context

Use supporting copy such as:

> Sign in as a parent, teacher or administrator.

This prevents students from assuming the email login is intended for them.

### Improve Field Behaviour

Confirm:

- `autocomplete="email"`
- `autocomplete="current-password"`
- Enter key submits the form
- Caps Lock warning
- Form values remain after recoverable errors
- Loading indicator appears inside the button
- Inline validation appears close to the field

### Add Account-State Handling

Support clear states for:

- Incorrect email or password
- Unverified email
- Locked account
- Disabled account
- Expired session
- Network failure
- Rate limiting

Use generic authentication errors so the system does not disclose whether an email address exists.

---

# Student Login Audit

## Main Issue

“Student? Sign in with your code” is visually treated as a tertiary link.

For many families, this may be a primary journey.

## Recommended Student Login Route

Create a dedicated route:

```text
/student-login
```

Alternatively, use the Parent / Student switch within the existing authentication card.

## Recommended Fields

- Student code
- Optional PIN
- Show or hide PIN
- Remember this device only if it can be implemented safely

## Recommended Guidance

- “Your parent or teacher can provide your student code.”
- “Codes are not case-sensitive.”
- “Do not share your code with others.”
- “Having trouble? Ask your parent or teacher to generate a new code.”

## Student-Friendly Treatment

Use:

- Larger inputs
- Fewer words
- Friendly icon or avatar
- One clear primary action
- No social login
- No billing content
- No account-creation option for students

Students should not be able to create independent self-service accounts.

---

# Create Account Audit

The supplied screenshots show the login screen rather than the actual signup form, so the create-account page cannot be visually audited in full.

The signup journey should follow the requirements below.

## Account Type

The page should clearly state:

> Create a parent account

Students should not be able to self-register from this screen.

## Required Fields

- Parent name
- Email address
- Password
- Confirm password
- Terms acceptance
- Optional marketing consent

## Password Guidance

Display a visible rule checklist:

- 10 or more characters
- At least one letter
- At least one number

## After Signup

Show a dedicated confirmation state:

> Check your email  
> We sent a verification link to your address.

Include:

- Resend email
- Change email
- Cooldown timer
- Help link

## Avoid

- Asking for child details before verifying the parent account
- Asking for too much information in one form
- Automatically opting users into marketing
- Showing unsupported social signup
- Exposing student self-registration

---

# UI and Visual Issues

## 1. Right Panel Is Slightly Too Tall

There is a large amount of unused white space below the links.

### Recommended Fixes

Either:

- Reduce card height
- Vertically centre the form more precisely
- Add a subtle privacy/help footer inside the card

## 2. Left Panel Has Excess Empty Space

The top content and bottom sample-exam card leave a large empty central region.

### Recommended Improvement

Add one visual element:

- Product screenshot
- Student dashboard preview
- Progress visual
- Practice feedback panel

Avoid filling the space with more text.

## 3. Orange CTA Needs Brand Consistency

The orange button is visually strong but should be used consistently across the product.

Choose one strategy:

- Keep orange as the global primary conversion colour, or
- Use purple for authentication CTAs and reserve orange for highlights

The login screen should not introduce a conflicting CTA hierarchy.

## 4. Input Backgrounds Look Disabled

The current blue-grey field backgrounds are visually heavy and resemble disabled controls.

### Recommended Treatment

Use:

- White or near-white default background
- Subtle neutral border
- Pale purple focus ring
- Clear error border and message

## 5. Forgot-Password Link Needs More Space

Add more vertical separation between the password field and forgot-password link.

Ensure the link has a minimum interactive target of 44 × 44px.

---

# Accessibility Audit

## Required Improvements

- Minimum 16px input text
- Minimum 14px labels
- Minimum 44px control height
- Visible keyboard focus
- Proper field labels
- `aria-invalid` for invalid fields
- Error messages connected through `aria-describedby`
- Accessible password visibility control
- Login errors announced to screen readers
- Sufficient contrast on the purple panel
- Sufficient contrast for subtitles and secondary text
- Do not rely on colour alone for errors
- Keyboard-operable Parent / Student switch
- Accessible names for social login buttons

## Password Visibility Button

Use:

```text
aria-label="Show password"
aria-pressed="false"
```

Update both values when the visibility state changes.

## Error Handling

- Place field errors directly below the affected input
- Move focus to the first invalid field after failed submission
- Use an `aria-live` region for form-level errors
- Retain form values after recoverable errors

---

# Recommended Final Structure

## Desktop

```text
Left brand panel
- Logo
- Value proposition
- Three concise benefits
- Real product preview
- Optional sample CTA only if operational

Right authentication panel
- Parent / Student switch
- Contextual heading
- Relevant fields
- Primary action
- Recovery link
- Create-account path
- Social options only where supported
- Privacy and help links
```

## Mobile

- Remove or significantly reduce the large left panel
- Keep a compact logo and short value statement
- Show the authentication card full-width
- Keep Parent / Student switch prominent
- Put the main form above all secondary content
- Move sample-exam CTA below the form
- Avoid requiring scrolling before the primary action

---

# Recommended Copy

## Parent Login

### Heading

> Welcome back

### Supporting Text

> Sign in to manage learning, track progress and continue where you left off.

### Signup Prompt

> New to MindMosaic? **Create a free parent account**

## Student Login

### Heading

> Student sign in

### Supporting Text

> Enter the code provided by your parent or teacher.

### Help Text

> Cannot find your code? Ask your parent or teacher to create a new one.

## Create Account

### Heading

> Create your parent account

### Supporting Text

> Set up your family profile and add your child after verifying your email.

---

# Exact Priority List

## Critical

1. Clearly separate parent and student login
2. Remove unsupported social login buttons
3. Remove or fully implement sample exams
4. Make account creation more prominent
5. Verify all product claims
6. Correct input styling and validation states
7. Prevent student self-registration

## Important

8. Add a dedicated student-code experience
9. Improve vertical balance
10. Add loading, error and account-status states
11. Complete mobile responsiveness
12. Add privacy, accessibility and help links
13. Confirm CTA colour consistency
14. Add real product imagery to the left panel

---

# Acceptance Criteria

The authentication experience is ready when:

- Parent and student journeys are immediately distinguishable
- Every visible authentication option works
- Students cannot create independent accounts
- The signup journey clearly creates a parent account
- Unsupported social providers are not displayed
- All errors are accessible and understandable
- The complete flow works with keyboard navigation
- Inputs and buttons meet minimum target sizes
- Mobile users can reach the main action without unnecessary scrolling
- Claims match actual platform capabilities
- Help, privacy and password recovery routes are functional

---

# Final Assessment

The screen is visually strong and already above average.

Its biggest issue is not design quality. It is the lack of clear separation between user journeys and inconsistencies between the interface and the defined v1 scope.

The next version should make it immediately clear:

- Who signs in with email
- Who signs in with a student code
- Who can create an account
- Which sign-in methods are genuinely supported
- What happens after account creation

Once those areas are corrected, the authentication experience can reach a premium production standard without requiring a major redesign.
