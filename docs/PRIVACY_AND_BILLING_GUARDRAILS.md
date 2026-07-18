# Privacy and Billing Guardrails

## Why this document exists

The scaffold documented in [Architecture](ARCHITECTURE.md) and
[Product context](PRODUCT_CONTEXT.md) had no accounts, no backend, and no
payments — there was nothing to write a privacy or billing policy about. That
changes as soon as the product holds children's names, year levels, practice
history, and (from Phase 5) a parent's payment details. This document is the
guardrail set for that data, written before it exists rather than
retrofitted after a mistake.

## Child data — minimisation and access

- Store the minimum needed to run the product: display name, year level,
  role, linked-parent relationship, attempt history. Do not collect date of
  birth, school name, address, or any identifier beyond what a feature
  actually uses.
- A child's raw responses, attempt history, and scores are visible to: that
  child, their linked parent(s), and a teacher whose class they're in — never
  to another family, another teacher's class, or any student.
- Admin access to an individual child's raw data (not aggregate analytics)
  should go through a named, logged support workflow, not ad hoc database
  browsing — even though you are currently both the operator and a parent,
  build the access pattern as if that weren't true, since class/teacher
  accounts are in scope for this product.
- Never put a correct answer, an answer key fragment, or anything
  score-revealing into a location visible before submission — this rule
  already exists for visual alt text per `.roorules`; it now also applies to
  any new API response, log line, or error message touching an in-progress
  session.

## Payments (Phase 5, planned now so it isn't improvised later)

- Card data itself is never handled or stored by this application. Use a
  provider (e.g. Stripe) that takes card entry off-domain (Stripe
  Checkout/Elements) — no cardholder data ever transits or is logged by
  MindMosaic's own servers.
- Payment-provider secret keys and webhook signing secrets live only in
  server-side environment variables, never in a client bundle, never
  committed to git — same rule `.roorules` already states for Supabase keys,
  extended explicitly to a payment provider.
- All billing-state changes (subscription created/cancelled/past-due) must be
  driven by verified webhook events from the provider, not by trusting a
  client-side "payment succeeded" callback — a client can lie about whether
  it paid; a signed webhook cannot be forged without the signing secret.
- Billing status determines feature access (e.g. which roles/seats are
  active) but must never gate whether a **guest** can practise — the
  guests-allowed decision applies regardless of billing state.

## Content and account safety

- No question, passage, or answer content generated for any role may be
  altered based on a user's billing tier in a way that changes correctness or
  introduces different educational content per plan — plans gate quantity/
  features, not question integrity.
- Session/auth cookies and tokens follow the existing Supabase SSR pattern
  already in place (`src/lib/supabase/*`) — no parallel, hand-rolled auth
  mechanism should be introduced for teacher/parent/admin roles.

## What this does not cover yet

This document does not yet specify a data-retention/deletion policy (e.g.
what happens to a child's records if a parent closes their account) or a
formal incident-response process. Both should be written before real
families' data is stored in a shared (non-personal) deployment; they are out
of scope for the current personal-use phase but are flagged here so they are
not forgotten later.
