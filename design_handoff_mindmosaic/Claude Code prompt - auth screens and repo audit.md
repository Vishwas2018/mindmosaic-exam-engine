# Claude Code prompt — MindMosaic auth screens + repo audit

You didn't want me guessing at Log in / Sign up when you already have them built. Paste the prompt below into Claude Code (or Cowork) inside your MindMosaic repo. It reports back what exists so I can redesign against the real thing instead of inventing it.

---

## Prompt to paste

```
You are auditing the MindMosaic codebase so a designer can redesign its screens
accurately. Do not change any code. Produce a written report only.

Repo context to establish first:
1. Framework, router, styling approach (CSS modules / Tailwind / styled-components /
   plain CSS), component library if any, and where global tokens (colours, fonts,
   spacing, radii) are defined. Quote the actual token values.
2. The route table: every user-facing route, its component file, and whether it is
   public, authenticated-student, or authenticated-parent.

Then, for AUTHENTICATION specifically, document in detail:
3. Log in: file path, fields, validation rules, error states, "forgot password" flow,
   social/SSO providers if any, and what happens on success (redirect target).
4. Sign up: is it one screen or multi-step? List every step, every field, field order,
   labels, placeholder text, validation messages, and which fields are required.
   Note explicitly whether a parent creates the account and then adds a student, and
   what data a student profile holds.
5. Password reset, email verification, and session/expiry behaviour.
6. Any consent, privacy, terms or age-gating checkboxes and their exact wording.
7. Post-signup onboarding: what does the user see immediately after? Programme
   selection? Year level? Payment/trial screen?

Then document these product screens, same level of detail (fields, states, data
displayed, empty states, loading states, error states):
8. Student home / dashboard
9. Learn: lesson list and lesson view
10. Practice: question view, answer submission, explanation reveal, retry
11. Exam simulation: start screen, in-progress UI, timer, flagging, autosave,
    review-before-submit, results screen
12. Parent view / reporting
13. Plans, billing and trial handling (including the exact price strings in the code)

Output format — a single markdown file named DESIGN_AUDIT.md at the repo root:
- One section per screen.
- For each: route, component file path, purpose in one line, a field/element
  inventory as a bullet list, all states, and all user-visible copy quoted verbatim.
- A final section listing anything the code does that surprised you, plus anything
  that looks unfinished or inconsistent.

Be exhaustive about copy. Verbatim strings matter more than your summary of them.
```

---

## Then

Send me `DESIGN_AUDIT.md` (or paste it here) and I'll build Log in, Sign up and the
onboarding flow to match your real fields and copy, and revise the Learn / Practice /
Exam screens where my version diverges from what you already have.

Alternatively, paste the repo URL in chat and I'll read it directly.

## Placeholder files I referenced

`MindMosaic Log in.dc.html` and `MindMosaic Sign up.dc.html` don't exist yet — the
"Log in" and "Start free" buttons across all screens point at them, so they'll 404
until the audit comes back and I build them.
