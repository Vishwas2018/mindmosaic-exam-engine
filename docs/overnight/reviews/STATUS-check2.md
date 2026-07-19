# Overnight check-in #2

~75 min after check 1. Good news: all four previously-stalled branches are
now active — the permission prompts got cleared.

## Status by branch

| Branch | New commits | Status |
| --- | --- | --- |
| feature/practice-bank-and-ui (0.1 fix) | 86ab7ce | DONE — leak fix landed, reviewed, looks correct |
| feature/admin-analytics | 11439c7 | Active, good progress |
| feature/parent-dashboard | 6e628c9, 535c1a8 | Active, good progress |
| feature/student-assignments-engagement | a39d542 | Active, good progress |
| feature/student-core | c9d4105, 90237b6, d4c1884 | Active, good progress, furthest along |
| feature/teacher-tools | f5e2ead (unchanged, 14h+ quiet) | Idle — may be done for now, or stalled again; watch next check |

## Review: feature/practice-bank-and-ui — 0.1 fix (86ab7ce)

This closes both gaps flagged before the fan-out:

1. **Root cause correctly diagnosed and fixed.** Home page is statically
   prerendered (one payload for every visitor), and was embedding the full
   authoring bank as RSC props for guest mode — signed-in visitors got the
   same payload. Fix: the page now ships only a precomputed
   `BankEligibilitySummary` (counts + full-exam durations per
   yearLevel/examStyle/subject combination, 36 entries, zero question
   content) — reviewed `eligibility-summary.ts` directly, confirms no
   answer-revealing content. Home HTML dropped 1126KB -> 52KB, RSC 993KB ->
   28KB.
2. **Guest bank moved to its own static endpoint** (`/api/exam/guest-bank`),
   reviewed directly — clearly commented as the same accepted guest
   trade-off on a different channel, never fetched by a signed-in client.
3. **Session-timing fixed**: signed-in sessions are now created at exam
   start (`POST /api/exam/session` before any question is shown), server
   generates the seed, request schema has no client-seed field. This closes
   the "client can choose its own seed" concern for signed-in users.
4. **check:bundle extended** to scan prerendered HTML and RSC flight
   payloads, not just JS chunks — and they proved it actually catches this
   class of bug by wiring a deliberate leak through a temporary prop and
   confirming the check failed before removing it. Good rigor.
5. Security-model addendum updated to match what's actually built,
   including an explicit guest-bank public-URL caveat rather than
   overclaiming.

No concerns. This is the last blocker before feature/exam-flow-results can
start — green light for that seventh thread now, branched off 86ab7ce.

## Review: feature/parent-dashboard, feature/admin-analytics, feature/student-assignments-engagement

All three show real, tested progress (diffstats: parent 1203 lines incl. 280
lines of tests; admin 988 lines incl. a dedicated
`20260718120000_admin_aggregate_views.sql` migration — correctly followed
the "prefer pre-aggregated views" guidance from
docs/PRIVACY_AND_BILLING_GUARDRAILS.md rather than raw per-child queries;
student-assignments 960 lines incl. 168 lines of tests).

Spot-checked `student-assignments`' `types.ts` against `teacher-tools`'
`assignment-contract.ts` for the flagged reconciliation risk: student side
uses `z.looseObject` with every config field optional and unknown keys
passed through, explicitly commented as tolerant-by-design until the two
threads reconcile. Field names (yearLevel/examStyle/subject/questionCount/
title) line up with teacher-tools' schema shape. Reconciliation risk looks
low — a good sign both threads read the same doc carefully.

## Review: feature/student-core

Furthest along of all six/seven threads — student home wired to real
attempt history, learning hub with mastery snapshot, route guard. Have not
yet traced whether the underlying queries go through RLS-scoped client
calls vs a service-role bypass; still on the list for next check.

## feature/teacher-tools — idle

No new commits since check 1 (still at f5e2ead, first seen 14+ hours ago
relative to this check). Could mean it finished its assigned scope and is
sitting idle, or stalled again on a prompt. Not clearly a problem, just
flagging for morning attention if no further commits appear.

## Next check

Scheduled ~80 min out.
