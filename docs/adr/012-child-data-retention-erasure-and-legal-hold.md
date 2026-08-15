# ADR-012: Children's data retention, erasure, de-identification and legal-hold ownership

- **Status:** accepted
- **Date:** 2026-08-15 (superseding the 2026-08-12 placeholder)
- **Spec:** §17.5, §25.11
- **Phase:** cross-cutting (Gate A items A4 and A5)

## Context

The platform's subjects are children and its records are their assessment
performance. Spec §17.5 makes a published, product-owner-approved data schedule a
precondition of production use, and §25.11 makes it a precondition of every new
child-data field: no such field ships without a declared purpose, retention
owner, expiry behaviour, export behaviour and an erasure test.

This ADR was a placeholder from 2026-08-12 until now. Two things happened in
between that make it decidable rather than aspirational. Phase 2 step 8 built
`public.erase_student` — one transaction, both storage models, the profile and
the auth identity — so "what erasure means" is answered and executable. And the
Phase 2 cohort-open readiness checklist named the two things still missing as
gate items: **A4**, that `erase_student` was executable by nobody because §17.5
step 1's requester verification did not exist, and **A5**, that no approved
retention schedule had been published.

This ADR closes both. It does not re-open what step 8 decided.

## Decision

### 1. The approved retention schedule

**Adopted 2026-08-15, pending legal review; reconcile the 90-day
backup-aging window with the actual DR retention policy before production.**

The schedule is the spec §17.5 default table, verbatim, adopted as written
rather than re-derived:

| Data class | Default retention/action |
| --- | --- |
| Active child profile and identifiable assessment history | Retain while the account is active and the data is needed to provide the service; review after 24 months without learner activity |
| Response autosave/checkpoint buffers | Delete within 30 days after a terminal submission, abandonment, or expiry once the durable response/result exists |
| Fine-grained interaction telemetry | Retain for at most 12 months, then delete or irreversibly aggregate/de-identify |
| Application and security logs | Retain for at most 90 days unless an active security investigation places a documented legal hold |
| Idempotency records and transient job payloads | Delete after their retry/audit window, normally 24 hours to 30 days depending on purpose |
| Verified account closure or erasure request | Remove or irreversibly de-identify in primary systems within 30 days after any documented recovery grace period; encrypted backups MUST age out within 90 days |

**Adopting the defaults verbatim is itself the decision.** The alternative was to
write a bespoke schedule, and there is nothing yet in this product that the
defaults fit badly: the periods are the ones the spec derived from OAIC APP 11,
and inventing different numbers without a purpose analysis to justify them would
produce a schedule that looks considered and is not. §17.5 is explicit that these
are "MindMosaic product defaults, not a claim that Australian law prescribes one
universal schedule", and that the approved schedule "MUST be reviewed against the
actual purposes, contracts, and legal obligations before launch".

Two qualifications travel with the adoption and must not be dropped when it is
quoted:

- **Pending legal review.** Adopted for engineering purposes so that Gate A can
  close and so that §25.11's per-field rule has a schedule to point at. It is not
  a legal sign-off and must not be presented as one.
- **The 90-day backup window is unreconciled.** The last row commits encrypted
  backups to aging out within 90 days. Nothing in this repository controls backup
  retention — it is a platform/DR setting — and it has not been checked. If the
  actual DR policy retains longer, the schedule is wrong today and either the
  policy or this row has to change **before production**, not after.

Which surfaces are currently in scope for each row is recorded in §6 below.

### 2. Deletion, not de-identification, for assessment data

Restated here rather than left in the step-8 migration, because it is the
schedule's most consequential clause.

§17.5 requires links removed from "sessions, responses, results, marks,
assignments, analytics, exports, caches" and says replacing a child id with a
stable reversible pseudonym is not erasure. Every analytic in this system is
computed from those rows at read time — the six admin views aggregate
`resolved_sittings`, which is a view and not a materialisation — so deleting the
rows removes the child from every aggregate by construction, with no second pass
to forget and no de-identified residue to argue about.

De-identification would have to be argued: a small cohort plus a timestamp plus a
score distribution can re-identify. Deletion needs no argument, and §17.5 step 6
permits retaining aggregate statistics only when they "cannot reasonably identify
the child", which is a claim this product is not yet in a position to make.

### 3. The erasure audit is an event, not a record of a person

One row per erasure event in `public.erasure_audit`: the subject's uuid, the
event, counts of what was removed, and a ticket reference. No name, no email, no
response, no score, no configuration — §17.5 step 7's "minimal erasure audit that
contains no deleted response or profile payload".

The subject's uuid is retained deliberately. It is a random opaque identifier
whose mapping to a human being — the `auth.users` row and the profile — is
deleted by the same transaction. What remains is evidence that an erasure
happened, which the obligation itself requires; what does not remain is anything
that could say whose.

### 4. Erasure is admin-processed, not parent self-service

§17.5 step 1 requires the requesting parent/guardian or otherwise authorized
actor to be **verified**. In this MVP that verification is a human process,
performed out of band, and its output is a ticket reference. An administrator
then records the request against that ticket.

There is no parent-facing self-service erasure button, and that is the decision
rather than an unfinished piece of it. A self-service path would have to verify
the requester in software, and the failure mode of getting that wrong is one
person irreversibly deleting another child's assessment history. The product will
add self-service when it can verify a guardian to a standard that justifies it;
until then, the strongest control available is a human in the loop and an audit
trail that names the ticket.

The consequence, stated plainly: erasure turnaround depends on an administrator
acting, and §17.5's "within 30 days after any documented recovery grace period"
is therefore an operational commitment rather than something the system enforces
end to end. The processor in §5 enforces the second half of it; the first half is
a human SLA that belongs in the runbook this ADR does not write.

### 5. A 30-day recovery window, with access revoked immediately

Recording a request does **not** delete anything. It:

1. revokes the child's access immediately (§17.5 step 2, "revoke access
   immediately when closure takes effect"), and
2. schedules the irreversible erasure for `requested_at + 30 days`.

An administrator may cancel within that window, which restores access. After it,
a processor runs `erase_student` and the deletion is irreversible.

**Why a window at all.** Erasure here is total and unrecoverable by design — §2
chose deletion precisely so there is no residue — and the request is made by a
human, about a child, through an out-of-band verification that can be mistaken.
An operation with no undo, triggered by a process with a human in it, needs a
window or it needs to not be total. It was cheaper and more honest to add the
window than to weaken the deletion.

**Why 30 days.** It matches the schedule's own commitment for a verified closure
request — "within 30 days after any documented recovery grace period" — so the
window IS the documented grace period rather than an extra delay bolted in front
of one.

**The revocation mechanism, exactly.** Three actions, all reversible, at
different boundaries and for different reasons:

| Action | Boundary | Reversed by cancel |
| --- | --- | --- |
| `profiles.access_revoked_at` set | The application role gate (`requireRole`) refuses every `/{role}` route | Yes — set back to null |
| `auth.users.banned_until` set to the execute-after date | GoTrue: no sign-in, no token refresh | Yes — set back to null |
| `auth.sessions` / `auth.refresh_tokens` rows deleted | The child's live sessions end | Not restored, and does not need to be — cancel restores the *ability* to sign in, which is what was taken away. A session is transient state, not the child's data. |

None of the three touches a row of assessment data. That is the point of the
window: for thirty days the child's record is intact and the change is entirely
in who may reach it.

**What this does not stop, stated rather than papered over.** A Supabase access
token is a stateless JWT; deleting the session prevents refresh but does not
invalidate an already-issued token, so a token minted seconds before the request
remains cryptographically valid until it expires. Within that window a caller
holding it can still read their own rows through PostgREST directly, though not
through any application route (the role gate refuses first). The mitigation is
the access-token lifetime setting, which is a platform configuration and is
recorded here as the reason to keep it short rather than fixed by a migration
that cannot reach it.

### 6. Ownership, and what each schedule row currently covers

**Responsible privacy owner: `TODO(owner)` — to be filled by the product owner.**
Left as a marker rather than guessed. §17.5 requires the schedule to identify the
owner for every table containing children's personal information, and a name
invented by an engineer is worse than an obvious gap: it reads as approved.
Everything else in this ADR is decided and implemented; this line is the one
thing waiting on a person.

Where each row of §1 currently lands:

| Schedule row | In this system today | Enforcement |
| --- | --- | --- |
| Active child profile and assessment history | `profiles`, `exam_*`, `assessment_*` | Retained; the 24-month inactivity review is a manual process |
| Autosave / checkpoint buffers | `exam_responses`, `session_ui_state` | Deleted with the sitting; the standalone >30-day sweep is a follow-up (§7) |
| Interaction telemetry | none yet | n/a — the obligation attaches when telemetry ships |
| Application and security logs | platform logs | Platform setting, not repository-controlled |
| Idempotency records / transient job payloads | `idempotency_keys` | Deleted on erasure; the 24h–30d sweep is a follow-up (§7) |
| Verified closure or erasure request | `erasure_requests`, `erase_student` | Enforced: 30-day window then irreversible deletion |

### 7. Automated per-category enforcement is a tracked follow-up

This ADR adopts the schedule and makes the erasure row of it executable. It does
**not** implement automated expiry for the other categories: autosave buffers
older than 30 days past a terminal sitting, telemetry older than 12 months, logs
older than 90 days, idempotency records past their window. Those are sweeps with
no runner today.

Recording that as a follow-up rather than claiming the schedule is enforced is
the honest position: a published schedule the system does not execute is a
commitment, and calling it a control would be the same category of error as a
verification table naming test files that do not exist. It is tracked in
`docs/phase2-cutover-readiness-checklist.md` under Downstream.

### 8. Legal hold is deferred, and named as deferred

§17.5 requires legal holds to be "documented, time-bounded, access-restricted,
and reviewed by the responsible privacy owner". No hold mechanism exists, nothing
in the product can place one, and the erasure processor has no hold check to
consult. That is acceptable only because there is no hold to honour: the platform
is pre-production and no statutory retention obligation has been asserted against
any record in it.

The concrete debt, so that whoever adds it knows what it has to touch: a hold
must be able to *suspend* a pending erasure request without cancelling it — a
third status, not a cancel — and `process_due_erasures` must skip a held request
rather than erase it. Building the status without the mechanism would be
speculative; recording the shape it has to take is not.

## Consequences

- Gate A items A4 and A5 close. Gate A is then fully green — which is a statement
  about readiness, not a decision to open a cohort. The cohort stays empty and
  the flag stays off; opening one is a separate, explicit decision.
- An erasure is irreversible after thirty days and total. There is no
  "undelete" and no de-identified residue to recover a child's history from,
  by design (§2).
- Erasure turnaround has a human in it (§4), so the 30-day commitment is
  partly an operational SLA rather than wholly a system guarantee.
- The published schedule is adopted with two open qualifications — legal review
  and the backup window — and neither may be dropped when it is quoted (§1).
- Four schedule rows are commitments the system does not yet enforce (§7).

## Alternatives considered

**Immediate irreversible erasure on request.** Rejected: §2's deletion is total,
the request comes through a human verification that can be mistaken, and an
operation with no undo triggered by a fallible process needs a window. It would
also have made the "documented recovery grace period" the schedule's own last row
contemplates into something the product had decided not to have.

**Soft-delete / de-identify now, hard-delete later.** Rejected. It reintroduces
exactly what §2 refuses — a pseudonymised residue whose re-identifiability has to
be argued — and it does so during the window when the child is *most* likely to
come back, which is when a linkable residue is worst.

**Parent self-service erasure.** Rejected for this MVP (§4). The verification
problem is the whole problem, and getting it wrong deletes the wrong child's
history irreversibly.

**Granting `erase_student` to an application role.** Rejected, and worth naming
because it is the obvious shortcut. `erase_student` remains executable by nobody:
`process_due_erasures` is `SECURITY DEFINER` and reaches it as the function
owner, so the destructive function gains no grant at all and there is no role a
leaked credential could hold that calls it directly.

**Waiting for legal review before adopting anything.** Rejected: it leaves
§25.11 with no schedule to point at, so every child-data field shipped in the
meantime has no declared retention behaviour. An adopted-pending-review schedule
with its qualifications attached is a weaker claim than a reviewed one and a much
stronger position than none.

## Verification

| Claim | Where it is proved |
| --- | --- |
| Only an admin can request or cancel; the worker itself is granted to nobody | `tests/rls/erasure-operational.test.ts` — non-admin and anon refused on request/cancel/the admin trigger, and the worker refuses even an admin calling it directly |
| A request revokes access immediately and deletes nothing | Same suite — the flag, the ban and the session are gone; every assessment row is still there |
| Nothing is erased before `execute_after` | Same suite — the processor runs and the child's data is intact |
| A cancel inside the window prevents deletion and restores access | Same suite |
| The processor is idempotent and erases only due requests | Same suite — run twice, second run erases nothing |
| `erase_student` is executable by nobody, still | `scripts/migrations/registry.ts` (`20260815110000`), re-asserted for the processor migration |
| The audit carries no person payload | Same suite, and the registry's column check |
| Erasure still covers both storage models | `tests/rls/resolution-rule.test.ts` §4, unchanged |
