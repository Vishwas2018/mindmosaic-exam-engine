# Phase 2b A-0 — branch protection assessment and owner configuration plan

**Status:** assessment only. **No GitHub setting was modified by this document or the commit carrying it.**
**Assessed:** 2026-10-24, against `Vishwas2018/mindmosaic-exam-engine`.
**Why this is A-0:** every element of Workstream A (authenticated approval architecture) is circular without it. A signer registry that the user of a key can edit in the commit that uses the key authorises nothing. See `owner-adoption-decision.md` section 5.

---

## 1. Verified configuration

Read through the GitHub REST API with a token holding **administrator** access on this repository, so the review-count and admin-bypass settings that are invisible to unprivileged callers were read directly rather than inferred.

`GET /repos/{owner}/{repo}/branches/{branch}/protection`, `GET /repos/{owner}/{repo}/rulesets`.

**`dev` and `main` are configured identically.** Every value below is verified for both.

| Setting | API field | Value | Assessment |
|---|---|---|---|
| Branch protection enabled | `protected` | `true` | Verified |
| Required status checks | `required_status_checks.contexts` | `core`, `e2e`, `e2e-auth`, `rls` | Verified. `scholarship-drafts` **absent** |
| Strict / up-to-date before merge | `required_status_checks.strict` | `false` | **Gap.** A stale branch can merge |
| Required approving reviews | `required_approving_review_count` | **`0`** | **Gap.** The block exists but demands no approval |
| Dismiss stale approvals | `dismiss_stale_reviews` | `false` | **Gap** |
| Code-owner review required | `require_code_owner_reviews` | `false` | **Gap.** And no `CODEOWNERS` file exists in the repository |
| Approval of last pusher | `require_last_push_approval` | `false` | **Gap.** A writer can push after approval |
| Admin enforcement | `enforce_admins.enabled` | **`false`** | **Gap.** Administrators bypass all of the above |
| Signed commits required | `required_signatures.enabled` | `false` | **Gap** for Workstream A |
| Force pushes | `allow_force_pushes.enabled` | `false` | **Already correct** |
| Branch deletion | `allow_deletions.enabled` | `false` | **Already correct** |
| Linear history | `required_linear_history.enabled` | `false` | Optional |
| Conversation resolution | `required_conversation_resolution.enabled` | `false` | Optional |
| Branch lock | `lock_branch.enabled` | `false` | Correct — must stay false |
| Repository rulesets | `GET /rulesets` | `[]` | Verified. None exist |

Supporting facts verified in the same pass:

- `scholarship-drafts` **is** a real CI job and it **passed** on both runs of the PR #75 head commit. It is simply not listed as required, so a red `scholarship-drafts` would not block a merge. This reproduces the finding already recorded in `docs/reviews/scholarship-2026-10-18/BRANCH-PROTECTION.md`.
- No `CODEOWNERS` file exists at `.github/`, the repository root, or `docs/`.
- No `.github/allowed_signers` file exists.
- The repository is **public**, and the assessing account holds `admin`. The owner is the sole administrator.

### 1.1 What this corrects

Several Phase 2a documents stated that branch protection on `dev` "does not currently exist" or is "absent". That is **false as literally written** and has been corrected in this commit. Protection *is* enabled on both branches, four checks *are* required, and force-pushes and deletion *are* blocked. What is absent is the *approval-enforcing and admin-binding* part of protection — which is the part Workstream A actually depends on. The precise formulation in `threat-model.md` (no rulesets, `required_approving_review_count` is 0, `enforce_admins` disabled) was already accurate and is unchanged.

### 1.2 Nothing material remains unverified

The task framing anticipated that required-review and administrator-bypass configuration might be inaccessible. With administrator access they were read directly, so **no setting in section 1 is an assumption.** Two items nonetheless warrant owner inspection, because they are not branch-protection fields and were not read:

| Item | Why it needs owner inspection |
|---|---|
| Organisation / account-level policies | Could override or constrain repository settings. Not readable as a repository-scoped question |
| The full collaborator list and their permission levels | Only the owner's own `admin` grant was confirmed. Who else holds `write` determines the real blast radius of every gap below |

Both should be checked before section 3 step 2.

---

## 2. Gap analysis against Workstream A

The requirement each gap defeats is from `owner-adoption-decision.md` section 5, Workstream A.

| # | Gap | What it defeats | Severity |
|---|---|---|---|
| **G-1** | `enforce_admins: false` | **Everything.** An administrator bypasses required checks and any future review requirement. Every control below is advisory against an admin | **Critical** |
| **G-2** | `required_approving_review_count: 0` | "Required independent pull-request approvals." No second party need see a change | **Critical** |
| **G-3** | No `CODEOWNERS` + `require_code_owner_reviews: false` | "Protected signer-registry ownership." Nothing distinguishes a change to `.github/allowed_signers` from a change to a README | **Critical** |
| **G-4** | `dismiss_stale_reviews: false` | A change approved at commit A stays approved after commit B rewrites the signer registry | **High** |
| **G-5** | `require_last_push_approval: false` | The author can push the last commit after approval lands | **High** |
| **G-6** | `required_signatures: false` | Commit authorship is self-asserted, so "commit binding" binds to an unauthenticated identity | **High** |
| **G-7** | `scholarship-drafts` not required | A red scholarship gate does not block a merge | **Medium** |
| **G-8** | `strict: false` | A branch can merge without re-running checks against current `dev` | **Medium** |
| **G-9** | No rulesets | No path-scoped protection. Branch protection alone cannot say "approval required *for these files*" | **Medium** |

### 2.1 The self-authorisation problem, stated exactly

This is the specific attack Workstream A exists to stop, and today it succeeds in one step:

> A writer adds their own public key to `.github/allowed_signers` **in the same pull request** that carries a commit signed by that key, and merges it with zero approvals.

Closing it needs **three** things together, and any two are insufficient:

1. The signer registry is a **code-owned path** whose owner is not the writer (G-3).
2. Approval by that owner is **required** (G-2) and **re-required when the path changes again** (G-4, G-5).
3. The owner **cannot bypass** the requirement for their own changes (G-1) — otherwise the sole administrator remains a one-party authoriser.

Point 3 has a limit that no GitHub setting removes: **this repository has one administrator.** With `enforce_admins: true` the owner cannot *silently* bypass, but an administrator can always turn the setting off, make the change, and turn it back on. Branch protection makes self-authorisation **auditable and deliberate**, not impossible. A genuinely two-party control requires a second trusted human, which is an owner staffing decision, not a configuration value. **This limitation must be recorded in the Workstream A design rather than papered over.**

---

## 3. Recommended configuration and safe implementation order

Ordered so that the owner is never locked out, and so that the step most likely to be disruptive (`enforce_admins`) comes after the controls it enforces are known to work.

**Before starting:** confirm a second administrator exists, or that the owner retains account-level recovery. `enforce_admins` does not lock an admin out of settings — an admin can always revert it via the API or UI — but the rollback in section 4 depends on retaining that access.

### Step 0 — prerequisite file, no settings change

Create `CODEOWNERS` first. A code-owner rule that names a non-existent file protects nothing, and `require_code_owner_reviews` is inert without the file.

`.github/CODEOWNERS`:

```
# Default: owner review on everything.
*                                   @Vishwas2018

# Phase 2b signer registry — the self-authorisation path.
/.github/allowed_signers            @Vishwas2018
/.github/CODEOWNERS                 @Vishwas2018

# Governance records that must not change without review.
/docs/adr/                          @Vishwas2018
/docs/reviews/                      @Vishwas2018
/docs/spec/                         @Vishwas2018
```

This is a **separate, separately reviewed pull request.** It is not part of the adoption-record commit.

### Step 1 — the cheap, non-disruptive settings

Lowest risk, immediate value, no merge workflow change. Add `scholarship-drafts` to required checks and require up-to-date branches:

    gh api -X PATCH \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/required_status_checks \
      -F strict=true \
      -f 'contexts[]=core' -f 'contexts[]=e2e' -f 'contexts[]=e2e-auth' \
      -f 'contexts[]=rls' -f 'contexts[]=scholarship-drafts'

Repeat for `main`.

Also remove the job-level `continue-on-error` from `scholarship-drafts` in the workflow, or the job cannot report failure — the backlog note at `docs/content-status/scholarship-drafts-migration-backlog-2026-10-16.md` records this. Verify that first; a required check that can never go red is theatre.

### Step 2 — required reviews, on `dev` only

Do `dev` before `main` so the blast radius is the working branch, not production. Write the payload to a local file and `PATCH .../branches/dev/protection` with it:

    {
      "required_status_checks": {
        "strict": true,
        "contexts": ["core", "e2e", "e2e-auth", "rls", "scholarship-drafts"]
      },
      "enforce_admins": false,
      "required_pull_request_reviews": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": true,
        "require_last_push_approval": true
      },
      "restrictions": null,
      "allow_force_pushes": false,
      "allow_deletions": false,
      "required_conversation_resolution": true
    }

`PUT`/`PATCH` on this endpoint replaces the whole protection object, so every field must be present — omitting one clears it. `enforce_admins` stays `false` in this step **deliberately**: it is the escape hatch while the new requirements are being shaken out.

> **Single-administrator caveat.** With one admin, `required_approving_review_count: 1` plus `require_code_owner_reviews: true` means the owner cannot approve their own pull request and no one else can. Until a second reviewer exists, the owner will merge via admin bypass — which is exactly why step 4 is gated on a staffing decision, and why this plan does not pretend the control is two-party.

### Step 3 — mirror onto `main`

Same payload against `.../branches/main/protection`, once step 2 has survived a few real pull requests.

### Step 4 — `enforce_admins`, and signed commits

**Do not take this step until a second reviewer with `write` exists**, or the owner accepts that every merge becomes a deliberate, logged bypass.

    # Close G-1. Reversible with DELETE on the same path.
    gh api -X POST \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/enforce_admins

    # Close G-6. Requires every contributor to have commit signing configured first.
    gh api -X POST \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/required_signatures

Enable `required_signatures` only after confirming local signing works for every contributor, including automation. It rejects unsigned commits outright and will block merges immediately otherwise.

### Step 5 — optional path-scoped ruleset

A ruleset can require approval **only** when protected paths change, which branch protection cannot express (G-9). This is a refinement, not a prerequisite; `CODEOWNERS` plus step 2 already covers the signer-registry path. Defer until Workstream A's design names its exact protected paths.

### What must stay as it is

| Setting | Keep at | Reason |
|---|---|---|
| `allow_force_pushes` | `false` | Already correct. Force-push would rewrite the signed history approvals bind to |
| `allow_deletions` | `false` | Already correct |
| `lock_branch` | `false` | `true` makes the branch read-only and blocks all merges |
| `restrictions` | `null` | A push allowlist on a single-maintainer repository adds lockout risk without benefit |

---

## 4. Rollback

Every step is individually reversible, and none can lock the owner out while they retain `admin`.

| Step | Rollback |
|---|---|
| 0 — `CODEOWNERS` | Revert the pull request, or delete the file |
| 1 — required checks | `PATCH .../required_status_checks` with the original four contexts and `strict=false` |
| 2, 3 — required reviews | `DELETE .../branches/{branch}/protection/required_pull_request_reviews` |
| 4 — admin enforcement | `DELETE .../branches/{branch}/protection/enforce_admins` |
| 4 — signed commits | `DELETE .../branches/{branch}/protection/required_signatures` |
| 5 — ruleset | `DELETE /repos/{owner}/{repo}/rulesets/{id}` |
| All protection | `DELETE .../branches/{branch}/protection` — last resort, drops force-push and deletion blocking too |

**Capture the current state before changing anything**, so rollback is a restore rather than a reconstruction:

    for b in dev main; do
      gh api repos/Vishwas2018/mindmosaic-exam-engine/branches/$b/protection \
        > "protection-$b-2026-10-24.json"
    done

Do not commit these files — they are operational state, not repository content.

**Lockout risks, each with its exit:** `lock_branch: true` blocks all merges — do not set it. `required_signatures` with signing misconfigured blocks every push — verify signing first, `DELETE` to recover. `required_approving_review_count: 1` with one collaborator means no pull request can be approved — admin bypass covers it while `enforce_admins` is `false`, which is why step 4 is last.

---

## 5. Dependencies this creates for Workstream A design

| A-0 outcome | What the Workstream A design must then specify |
|---|---|
| `CODEOWNERS` exists and the signer-registry path is owned | The registry's **exact path**, so it can be code-owned. The design must name it; `.github/allowed_signers` is assumed but not decided |
| Approval required and stale approvals dismissed | Whether a GitHub approval is itself approval evidence, or merely a precondition to a separately signed approval record. **These are different trust models and the design must choose one** |
| `required_signatures` available | Whether the admission gate verifies the GitHub-reported signature, or re-verifies independently against the registry. The adoption record already requires the gate to re-derive rather than trust |
| Single-administrator limit | How requirement 6 ("authorised human approval") can be satisfied at all when authoriser and implementer are one person. **This is the open question A-0 surfaces and does not solve** |
| `enforce_admins` reversible by an admin | The key-lifecycle design must treat "protection was temporarily disabled" as a detectable event, or accept that it is not detectable |

The last two are substantive and should be settled before Workstream A implementation is authorised. A-0 makes self-authorisation **auditable**; it does not make it **impossible** on a single-administrator repository.
