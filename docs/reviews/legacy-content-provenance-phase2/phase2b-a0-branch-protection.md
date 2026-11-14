# Phase 2b A-0 — branch protection assessment and owner configuration plan

**Status:** assessment and design guidance only. **No GitHub setting, workflow, CODEOWNERS file or signer registry was created or modified by this document or the commit carrying it.**
**Assessed:** 2026-10-24, against `Vishwas2018/mindmosaic-exam-engine`.
**Headline finding:** A-0 is **partially blocked**. The settings-only portion can be done today by the owner alone. The portion that actually makes a signer registry trustworthy — independent ownership of the self-authorisation paths — **cannot be configured at all**, because the repository has exactly one human with access. See section 2.2.
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

Also verified in the same pass: no `CODEOWNERS` file exists at `.github/`, the repository root or `docs/`; no `.github/allowed_signers` file exists; `allow_auto_merge` is `false`.

### 1.1 Repository topology and the available human set

This is the governing constraint on everything below, and it is **verified, not assumed**:

| Property | API field | Value |
|---|---|---|
| Repository owner type | `owner.type` | **`User`** — a personal account, **not an organisation** |
| Visibility | `private` | `false` (public) |
| Collaborators | `GET /collaborators` | **Exactly one: `Vishwas2018`, `role_name: admin`** |
| Pending invitations | `GET /invitations` | **0** |
| Teams | `GET /teams` | **0** |
| Webhooks | `GET /hooks` | **0** |

**There is one human with access to this repository, and that human is an administrator.** Every "independent approval" control below is a control over a population of one until that changes.

Two consequences follow directly, and neither is a matter of configuration:

- A `CODEOWNERS` rule can only name a principal with **write** access. With one collaborator, every rule this repository can express today resolves to `@Vishwas2018`. **An owner-only `CODEOWNERS` file cannot establish an independent code owner, and must not be presented as two-party authorisation.** The previous revision of this document proposed exactly that, and it was wrong.
- A personal-account repository has no organisation-level rulesets, no teams, and no organisation audit log. Controls that depend on separating "organisation owner" from "repository admin" are **structurally unavailable**, not merely unconfigured. See section 2.3.

### 1.2 `scholarship-drafts` — verified CI state

Read from `.github/workflows/ci.yml` on current `dev` (identical to this branch; PR #75 changes no workflow):

- The job is declared at line 87 as a plain job: `runs-on: ubuntu-latest`, checkout, setup-node, `npm ci`, `npm run content:validate-scholarship-drafts`.
- **There is no `continue-on-error` anywhere in `ci.yml`** — not at job level, not at step level. Confirmed by direct search of the file, not inferred.
- There is no `if: always()` or other construct that would mask a failure.
- `git log -S"continue-on-error"` shows it was removed in `02a0b3ac` ("make scholarship-drafts CI job blocking").
- The job **ran and passed** on both the `push` and `pull_request` runs of this branch's head.

**The job is already a blocking GitHub Actions job.** A failing draft validation already fails the workflow run.

**Its only gap is that branch protection does not list `scholarship-drafts` as a required status check**, so a red run is visible on the pull request but does not block the merge button. That is a branch-protection gap (G-7), not a workflow gap, and the fix is a settings change only.

### 1.3 What this corrects

Two corrections, both of statements in Phase 2a documentation that verification showed to be false:

1. **"Branch protection does not exist / is absent on `dev`."** False as literally written, and corrected in the preceding commit. Protection *is* enabled on both branches, four checks *are* required, and force-pushes and deletion *are* blocked. What is absent is the *approval-enforcing and admin-binding* part. The formulation in `threat-model.md` was already accurate and is unchanged.
2. **"Remove the job-level `continue-on-error` from `scholarship-drafts`."** Outdated and now removed from this plan. The flag is already gone (`02a0b3ac`), so the instruction would have prompted an unnecessary workflow edit. It originated in `docs/content-status/scholarship-drafts-migration-backlog-2026-10-16.md`, written before the flag was removed; that note is corrected in this commit. `docs/reviews/scholarship-2026-10-18/BRANCH-PROTECTION.md` already recorded the removal correctly and is unchanged.

### 1.4 What still requires owner inspection

With administrator access, every branch-protection and collaborator field above was read directly. **No setting in section 1 is an assumption.** One item remains outside what a repository-scoped read can answer:

| Item | Why it needs owner inspection |
|---|---|
| Personal-account security log | Whether `protected_branch.*` events are being retained or reviewed, and by whom. Not readable as a repository-scoped question, and on a personal account it is visible only to the account holder — which is the same person whose actions it would record. See section 2.3 |

---

## 2. Gap analysis against Workstream A

The requirement each gap defeats is from `owner-adoption-decision.md` section 5, Workstream A.

| # | Gap | What it defeats | Severity | Fixable by the owner alone? |
|---|---|---|---|---|
| **G-1** | `enforce_admins: false` | **Everything.** An administrator bypasses required checks and any review requirement. Every control below is advisory against an admin | **Critical** | Settings only — but see G-10 |
| **G-2** | `required_approving_review_count: 0` | "Required independent pull-request approvals." No second party need see a change | **Critical** | Setting yes; **effect no** — nobody to approve |
| **G-3** | No `CODEOWNERS`, `require_code_owner_reviews: false`, **and no second principal to name in it** | "Protected signer-registry ownership." Nothing distinguishes a change to `.github/allowed_signers` from a change to a README | **Critical** | **No. BLOCKED** — see 2.2 |
| **G-4** | `dismiss_stale_reviews: false` | A change approved at commit A stays approved after commit B rewrites the signer registry | **High** | Settings only |
| **G-5** | `require_last_push_approval: false` | The author can push the last commit after approval lands | **High** | Settings only |
| **G-6** | `required_signatures: false` | Commit authorship is self-asserted, so "commit binding" binds to an unauthenticated identity | **High** | Settings only |
| **G-7** | `scholarship-drafts` not a required check | A red scholarship gate does not block a merge. **The job itself is already blocking** — this is purely the protection listing | **Medium** | Settings only |
| **G-8** | `strict: false` | A branch can merge without re-running checks against current `dev` | **Medium** | Settings only |
| **G-9** | No rulesets | No path-scoped protection. Branch protection alone cannot say "approval required *for these files*" | **Medium** | Settings only |
| **G-10** | An administrator can change or remove protection itself, and the repository is personal-account with one admin | Makes every setting above **revocable by the party it constrains** | **Critical** | **No** — requires a topology change, see 2.3 |

### 2.1 The self-authorisation problem, stated exactly

This is the specific attack Workstream A exists to stop, and today it succeeds in one step:

> A writer adds their own public key to `.github/allowed_signers` **in the same pull request** that carries a commit signed by that key, and merges it with zero approvals.

Closing it needs **four** things together, and any three are insufficient:

1. The signer registry is a **code-owned path** whose owner is a different principal from the writer (G-3).
2. Approval by that principal is **required** (G-2) and **re-required whenever the path changes again** (G-4, G-5).
3. The writer **cannot bypass** the requirement (G-1).
4. The writer **cannot remove or weaken the requirement itself** (G-10).

Items 1 and 4 are not achievable in this repository's current form. Items 2 and 3 are configurable today but are inert without item 1: a required approval with a one-person approver set, where that person is also the author, approves nothing — GitHub does not permit self-approval, so the practical effect is a deadlock resolved by administrator bypass, which is item 3 defeated by the owner's own hand.

### 2.2 Independent signer-registry protection: **BLOCKED**

**Status: BLOCKED. Not deferred, not partially mitigated — blocked, pending a staffing decision that is the owner's and is not a configuration change.**

The blocker is verified in section 1.1: the repository has exactly one principal with access, and no pending invitation. There is nobody to name as an independent code owner.

**Administrator bypass is not an equivalent control and is not offered as one.** "The owner merges their own change via admin bypass" is the thing the control exists to prevent. Recording the bypass in a log the bypassing party controls makes it *visible to that party*; it does not make it *authorised by a second party*. These are different security properties and this plan does not trade one for the other.

What would unblock it, in order:

| # | Requirement | Acceptance criterion |
|---|---|---|
| **U-1** | A second, **genuinely independent** trusted human | Not the owner, not an account the owner controls, not a bot or machine account, and not a second account belonging to the owner. Independence means a distinct person who can decline to approve. **A second account held by the same person satisfies no part of this** and would make the control worse by appearing to satisfy it |
| **U-2** | Verified GitHub identity | A named GitHub account, identity confirmed out of band by the owner, with 2FA enabled and commit signing configured. The account, the person and the verification method are recorded in the Workstream A design |
| **U-3** | Suitable repository permission | **`write`** — the minimum that makes them eligible as a `CODEOWNERS` principal and lets them approve. **Not `admin`**: an admin can bypass protection, which reintroduces G-1 and G-10 for a second principal |
| **U-4** | Explicit independent ownership of the self-authorisation paths | The signer registry **and** `CODEOWNERS` itself owned by that person — see the rule set below, and the single-owner subtlety that follows it |
| **U-5** | Required approval from that person for protected-path changes | `required_approving_review_count ≥ 1` **and** `require_code_owner_reviews: true` |
| **U-6** | Stale-review dismissal and post-approval modification protection | `dismiss_stale_reviews: true` **and** `require_last_push_approval: true` |
| **U-7** | Administrator-bypass control, with its limits stated | `enforce_admins: true`, plus the honest statement in section 2.3 that this is detective, not preventive |

Until U-1 exists, the correct recorded position is: **the signer registry cannot be protected from its own user, so authenticated approval (Workstream A) cannot deliver its security property, so admission requirement 6 remains unsatisfiable.** That is already the adoption record's position — requirement 6's control "does not exist" — and A-0 confirms the reason is structural rather than merely unbuilt.

#### The CODEOWNERS rule set, once U-1 through U-3 are met

`@<independent-reviewer>` is a **placeholder for an account that does not yet exist**. It is deliberately not a username, because no second person has been identified and inventing one would fabricate the control.

```
# Last matching rule wins in CODEOWNERS, so the default goes first.

# Default: any change needs one independent look. Both principals listed, so
# either can approve the other's work and ordinary changes do not deadlock.
*                                   @Vishwas2018 @<independent-reviewer>

# Governance records: one independent look, same reasoning as the default.
/docs/adr/                          @Vishwas2018 @<independent-reviewer>
/docs/reviews/                      @Vishwas2018 @<independent-reviewer>
/docs/spec/                         @Vishwas2018 @<independent-reviewer>

# SELF-AUTHORISATION PATHS. Deliberately owned by the independent reviewer
# ALONE. Listing the owner here as well would let the owner approve their own
# registry change, which is precisely the attack in section 2.1.
/.github/allowed_signers            @<independent-reviewer>
/.github/CODEOWNERS                 @<independent-reviewer>
```

Three technical points that are easy to get wrong and that the design must state:

- **Listing two owners on a line weakens it to "either may approve."** GitHub satisfies a code-owner requirement with an approval from *any one* listed owner. So the two self-authorisation paths must name the independent reviewer **only**. Adding `@Vishwas2018` to those lines silently restores the owner's ability to self-authorise, and would look like a stricter configuration while being a weaker one.
- **`CODEOWNERS` must own itself.** If the owner can edit `CODEOWNERS` unilaterally, they can delete the rule protecting the signer registry and then edit the registry. Hence `/.github/CODEOWNERS` is on the reviewer-only list.
- **Reviewer-authored registry changes deadlock, and that is correct.** GitHub does not allow self-approval, and the owner is not a code owner for those two paths, so a registry change authored by the independent reviewer cannot be approved by anyone. The design should therefore establish that **registry changes are authored by the owner and approved by the independent reviewer**, never the reverse. The deadlock is a fail-closed outcome and must not be "fixed" by adding the owner back to those lines.

### 2.3 Administrator control of protection itself (G-10)

An administrator can disable `enforce_admins`, remove a required check, delete the protection rule entirely, or edit `CODEOWNERS`, and then restore any of it. **No branch-protection setting constrains this, because branch protection is the thing being changed.** `enforce_admins: true` therefore makes administrator self-authorisation **deliberate and detectable**; it does not make it **impossible**. This plan states that plainly rather than letting the setting imply more than it delivers.

What would be required to make protection changes **independently controlled** — i.e. an administrator cannot unilaterally change them:

| Requirement | Available here? |
|---|---|
| Transfer the repository to a GitHub **organisation**, and separate the roles: the independent party holds organisation ownership, the current owner holds repository `admin` only | **Not available today.** `owner.type` is `User`. This is a migration, with its own risk, and an owner decision |
| An **organisation-level ruleset** whose bypass-actor list excludes repository administrators. Repository admins cannot delete or override an organisation ruleset | **Not available** on a personal account. Requires the migration above |
| Two-person control over the organisation owner role itself | Requires a second organisation owner, so it still reduces to U-1 |

What would be required to make protection changes **externally auditable** — i.e. a change is recorded where the changing party cannot erase it:

| Requirement | Available here? | Honest limitation |
|---|---|---|
| A **webhook** on `branch_protection_rule`, `branch_protection_configuration` and `repository_ruleset` events, delivered to an endpoint whose credentials the repository administrator does not hold. **Zero webhooks are configured today** (verified) | **Available now**, and the cheapest meaningful step | An admin can delete the webhook. That makes deletion the new tamper signal, so the external endpoint must alert on *silence* as well as on events |
| An **external monitor** outside this repository, holding a read-only token the administrator cannot revoke, polling `/branches/{branch}/protection` on a schedule and appending a hash-chained record to storage the administrator cannot write | **Available now** in principle; needs somewhere to run and a credential boundary that genuinely excludes the administrator | Detects after the fact, not before. Its value depends entirely on the credential separation being real |
| **Organisation audit log streaming** to an external SIEM | **Not available.** Requires an organisation, and streaming requires GitHub Enterprise Cloud | — |
| The personal-account security log | Exists, but is visible only to the account holder — the same person whose actions it records. **Not independent** | Not an external audit control; do not record it as one |

**Recommended honest position for the Workstream A design:** on a single-administrator personal-account repository, protection changes can be made *detectable* but not *preventable*. If Workstream A's threat model includes a malicious or compromised administrator, that threat is **not mitigated by any configuration in this document**, and the design must say so rather than imply `enforce_admins: true` closes it. If the threat model excludes that case — a defensible choice for a single-maintainer project — then it must be **written down as an explicit scope exclusion**, not left as an unexamined gap.

---

## 3. Recommended configuration and safe implementation order

Ordered so that the owner is never locked out, and so that the steps whose *effect* depends on a second human are clearly separated from the steps that work today.

**Every step below requires separate owner authorisation. Nothing here is authorised by the Phase 2a adoption decision, which is policy-design only.**

**Before starting:** capture current state (section 4) so rollback is a restore, not a reconstruction.

### Step 0 — PRECONDITION: onboard an independent reviewer — **BLOCKED**

**Do not create `CODEOWNERS` yet.** With one collaborator, every rule it can express names `@Vishwas2018`, which establishes no independent owner and would create a misleading artefact that looks like two-party control.

This step is U-1 through U-3 of section 2.2: identify a genuinely independent trusted human, verify their GitHub identity out of band, and grant **`write`** (not `admin`). It is a staffing decision, not a configuration change, and it is the owner's.

**Until this step completes, steps 2 and 4 deliver a required-approval setting with no eligible approver, and the self-authorisation gap (G-3) stays open.** Steps 1, 3 and 5 are still worth doing and are independent of it.

### Step 1 — required status checks — available today, no second human needed

Lowest risk, immediate value, no merge-workflow change, and **no workflow-file edit: `scholarship-drafts` is already a blocking job** (section 1.2). This is a protection-listing change only.

    gh api -X PATCH \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/required_status_checks \
      -F strict=true \
      -f 'contexts[]=core' -f 'contexts[]=e2e' -f 'contexts[]=e2e-auth' \
      -f 'contexts[]=rls' -f 'contexts[]=scholarship-drafts'

Recommended on **both** `dev` and `main`, subject to separate owner authorisation. Repeat with `branches/main/protection/required_status_checks`.

`strict=true` additionally requires a branch to be up to date with its base before merging. It is bundled here because both are low-risk listing changes; drop `-F strict=true` if the owner wants the check added without changing merge mechanics.

### Step 2 — required reviews on `dev` — setting works today, **effect blocked on step 0**

Do `dev` before `main` so the blast radius is the working branch, not production. `PATCH .../branches/dev/protection` replaces the **whole** protection object, so every field must be present — omitting one clears it:

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

`dismiss_stale_reviews` and `require_last_push_approval` are U-6: together they stop an approval granted at one commit from carrying over to a later commit that rewrites the approved content.

`enforce_admins` stays `false` here **deliberately** — it is the escape hatch while the new requirements are shaken out, and it is raised in step 4.

> **Do not take this step before step 0 completes.** With one collaborator, `required_approving_review_count: 1` plus `require_code_owner_reviews: true` makes every pull request unapprovable: the sole code owner is the author, and GitHub forbids self-approval. Every merge would then require administrator bypass, which is section 2.2's rejected non-control. Taking this step early does not add safety; it converts normal merging into routine bypass and trains the habit the control is meant to prevent.

### Step 3 — mirror onto `main`

Same payload against `.../branches/main/protection`, once step 2 has survived a few real pull requests. Step 1 on `main` can proceed independently and earlier.

### Step 4 — `enforce_admins`, and signed commits — **gated on step 0**

    # U-7. Closes G-1. Reversible with DELETE on the same path.
    gh api -X POST \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/enforce_admins

    # Closes G-6. Requires every contributor to have commit signing configured first.
    gh api -X POST \
      repos/Vishwas2018/mindmosaic-exam-engine/branches/dev/protection/required_signatures

`enforce_admins: true` is the setting that makes the owner subject to the same requirements as anyone else. **Read section 2.3 before relying on it:** an administrator can switch it off, act, and switch it back on, so it is detective rather than preventive. Pair it with the webhook from section 2.3 if the owner wants a change to be visible outside the repository.

Enable `required_signatures` only after confirming local signing works for every contributor, including any automation. It rejects unsigned commits outright and will block merges immediately otherwise.

### Step 5 — optional path-scoped ruleset

A ruleset can require approval **only** when protected paths change, which branch protection cannot express (G-9). It is a refinement, not a prerequisite: `CODEOWNERS` plus step 2 already covers the signer-registry path once step 0 is done. On a personal-account repository a ruleset is repository-scoped and remains administrator-editable, so it does **not** address G-10. Defer until Workstream A's design names its exact protected paths.

### What must stay as it is

| Setting | Keep at | Reason |
|---|---|---|
| `allow_force_pushes` | `false` | Already correct. Force-push would rewrite the signed history approvals bind to |
| `allow_deletions` | `false` | Already correct |
| `lock_branch` | `false` | `true` makes the branch read-only and blocks all merges |
| `restrictions` | `null` | A push allowlist on a single-maintainer repository adds lockout risk without benefit |
| `.github/workflows/ci.yml` | **unchanged** | `scholarship-drafts` is already blocking. No workflow edit is needed for G-7 |

---

## 4. Rollback

Every step is individually reversible, and none can lock the owner out while they retain `admin`.

| Step | Rollback |
|---|---|
| 0 — collaborator | `DELETE /repos/{owner}/{repo}/collaborators/{username}` |
| 1 — required checks | `PATCH .../required_status_checks` with the original four contexts and `strict=false` |
| 2, 3 — required reviews | `DELETE .../branches/{branch}/protection/required_pull_request_reviews` |
| 4 — admin enforcement | `DELETE .../branches/{branch}/protection/enforce_admins` |
| 4 — signed commits | `DELETE .../branches/{branch}/protection/required_signatures` |
| 5 — ruleset | `DELETE /repos/{owner}/{repo}/rulesets/{id}` |
| `CODEOWNERS` | Revert the pull request, or delete the file |
| All protection | `DELETE .../branches/{branch}/protection` — last resort, drops force-push and deletion blocking too |

**Capture the current state before changing anything:**

    for b in dev main; do
      gh api repos/Vishwas2018/mindmosaic-exam-engine/branches/$b/protection \
        > "protection-$b-2026-10-24.json"
    done

Do not commit these files — they are operational state, not repository content.

**Lockout risks, each with its exit:** `lock_branch: true` blocks all merges — do not set it. `required_signatures` with signing misconfigured blocks every push — verify signing first, `DELETE` to recover. `required_approving_review_count: 1` before step 0 makes every pull request unapprovable — which is why step 2 is gated on step 0 rather than on an admin-bypass workaround.

That every rollback is a single administrator API call is itself G-10 restated: the rollback table and the attack are the same list of commands. Section 2.3 is the only place that addresses it.

---

## 5. Two approval trust models, and why one does not imply the other

Workstream A is described in the adoption record as "authenticated approval architecture", and the phrase covers two different things that need different mechanisms. The Phase 2b design must keep them separate. **This section is design guidance only. Nothing here is implemented, and implementing it needs separate owner authorisation.**

### 5.1 Model A — GitHub pull-request approval

**Protects:** the repository. Code, schemas, gates, governance records, the signer registry, CI configuration.

**Asserts:** "a principal with repository write access, who is not the author, looked at this diff and approved it at this commit."

**Enforced by:** branch protection, `CODEOWNERS`, `required_approving_review_count`, `dismiss_stale_reviews`, `require_last_push_approval`, `enforce_admins`. Everything in sections 1–4 of this document.

**Trust root:** GitHub's authentication of the approving account, and GitHub's own enforcement of the protection rules.

### 5.2 Model B — authorised, revision-bound approval of an individual question

**Protects:** students. It is admission evidence requirement 6, and it is what `approvedBy` in Standing Rule 8 is for.

**Asserts:** "a named person, holding an authorised editorial role, examined *this specific question at this specific revision* and approved it for publication."

**Enforced by:** nothing today. The adoption record states requirement 6's control "does not exist", and A-0 confirms the reason is structural (section 2.2).

**Trust root:** a signing key bound to an authorised reviewer in a protected registry, verified independently by the admission gate.

### 5.3 Why model A alone does not satisfy model B

Six reasons, each independently sufficient:

| # | Reason |
|---|---|
| **1. Wrong subject** | A pull-request approval approves a **diff**. Model B needs approval of a **question at a revision**. A PR adding forty questions receives one approval; nothing records that the reviewer considered question twenty-nine, or indeed any of them |
| **2. Wrong authority** | `write` access means "may change the repository." It does not mean "is a qualified editorial reviewer for Year 6 numerical reasoning." Model B's authority is a **role**, and GitHub has no concept of it. The adoption record separately records that no qualified editorial reviewer has been engaged |
| **3. No hash binding** | Model B must bind the approval to the **D2 factory-candidate hash** and the **D3 publication hash**, so that the thing approved is provably the thing published. A GitHub approval binds to a commit SHA, which is a different domain. The D2/D3 distinction is the whole subject of the H-1 defect; a trust model that cannot express it cannot be used here |
| **4. Not re-verifiable at admission** | The admission gate runs later, from repository content. A GitHub approval is **GitHub-side state**, reachable only by asking the GitHub API and trusting the answer. The adoption record already requires the gate to **re-derive** rather than trust. An approval the gate cannot independently verify is not gate evidence |
| **5. Revocable and mutable by the constrained party** | Section 2.3: an administrator can change protection, and GitHub review state is not a tamper-evident artefact the repository carries. Model B's evidence must survive in the repository and be checkable without trusting the party who created it |
| **6. Blocked here anyway** | Model A's independence depends on U-1, which is unmet. Today a GitHub approval on this repository can only be a self-approval via bypass, which asserts nothing |

**The correct relationship:** model A is a **necessary precondition** for model B, not a substitute. Model A is what protects the **signer registry** that model B's verification depends on. That is exactly why A-0 is sequenced first. But a GitHub approval must never be read as, converted into, or recorded as a question approval.

### 5.4 Recommended security architecture for model B — design guidance only

A detached signature over a canonical payload, committed as an artefact, verified by re-derivation. Not implemented; **do not implement without separate owner authorisation.**

#### The canonical signed payload

Bind all of it, or the signature is forgeable by substitution. An unconstrained signature field is satisfied by a signature over anything.

| Element | Field | Why it must be inside the signature |
|---|---|---|
| Reviewer identity | `reviewerId` — stable identifier, resolvable in the signer registry | Without it the signature proves only that *someone* with *a* key signed |
| Authorised role | `reviewerRole` — e.g. `editorial_reviewer_year6_numerical` | Requirement 2 and 5 authority. The registry must record which roles each key may assert, and the gate must check the asserted role is one of them |
| Candidate identity | `candidateId` | Binds to the question |
| Revision | `candidateRevision` | Binds to the **version**. Without it, an approval of revision 1 silently covers revision 7 — the same defect `dismiss_stale_reviews` fixes for model A |
| D2 factory-candidate hash | `factoryCandidateHash` | **The attestation domain.** What was actually examined |
| D3 publication hash | `publicationContentHash` | What students will receive. Both are required: D2 ≠ D3 for all five in-scope candidates, and the D2→D3 mapping must be re-derived, never copied |
| Explicit decision | `decision` — a closed enum, `approved` / `rejected` / `changes_requested` | A signature over a record with no decision field is a signature over an opinion-free blob. A missing or unrecognised value must fail closed, never default to approved |
| Decision timestamp | `decidedAt` | Lets key-revocation time be compared against signing time |
| Payload version | `payloadVersion` | The serialisation is part of the security boundary; it must be versioned to change safely |
| Domain separator | A fixed prefix, e.g. `mindmosaic.question-approval.v1` | Stops a signature made for one purpose being replayed as a question approval |

**Serialisation:** one canonical encoding, specified exactly, with a single defined byte sequence per logical payload — the same discipline `canonicalQuestionHash` already applies. The verifier must **re-serialise from the structured fields and verify against that**, never verify against an attacker-supplied byte blob with the fields alongside it. Otherwise the signed bytes and the read fields can disagree.

**Asymmetric signatures only.** HMAC or any shared secret is unacceptable: anything able to verify is able to forge, so the gate itself would hold forging capability.

#### Key registration and revocation

| Element | Requirement |
|---|---|
| Registry location | A committed, code-owned path. **Protected per section 2.2, which is currently BLOCKED** |
| Registry contents | Per key: public key, `reviewerId`, permitted roles, `validFrom`, `validUntil` or `revokedAt`, and who authorised the entry |
| Authorisation of entries | An entry is added by the owner and approved by the independent reviewer (U-4, U-5). **A writer must never be able to authorise their own key** — section 2.1 |
| Rotation | A new key is a new entry. Keys are never edited in place, so history stays auditable |
| Revocation | `revokedAt` set, entry retained. **Deleting an entry must not silently invalidate past approvals, and must not silently validate them either** |
| Approvals signed by a later-revoked key | **An explicit policy decision the owner must make, not an implementation detail.** Either (a) revocation is retroactive and every approval by that key is invalidated, requiring re-approval — safe, expensive; or (b) approvals signed while the key was valid remain valid, which requires trusting `decidedAt`, which the signer controls. Recommendation: **(a) by default**, with (b) available only for a key revoked for a benign reason recorded in the registry entry |

#### Verification — at admission and again at publication

Both, because they answer different questions at different times, and the adoption record already requires the gate to re-derive rather than inherit.

**At admission**, the gate must: re-derive D1, D2 and D3 from the live registry and repository content rather than reading them from the bundle; re-serialise the canonical payload from the structured fields; verify the signature against the registry's public key for `reviewerId`; confirm the key was valid at `decidedAt` under the chosen revocation policy; confirm `reviewerRole` is permitted for that key; confirm `candidateId` and `candidateRevision` match the candidate under admission; confirm the payload's D2 and D3 equal the re-derived values; and confirm `decision === "approved"`. **Any failure, any unrecognised field value, and any absence refuses.**

**At publication**, re-verify. Admission and publication are separated in time, and the content can be re-projected between them. Publication must confirm the D3 it is about to publish still equals the D3 that was approved. An admission-time-only check means a later re-projection publishes content no one approved.

**What the gate must never do:** accept a hash from the bundle instead of re-deriving it; accept a `recomputedByVerifier`-style self-assertion from the submitted bundle (removed as finding R4-P2-B); treat a GitHub approval as a question approval (section 5.3); or treat absence of a field as absence of a requirement.

---

## 6. Dependencies this creates for Workstream A design

| A-0 outcome | What the Workstream A design must then specify |
|---|---|
| **Independent reviewer BLOCKED (2.2)** | Whether Workstream A proceeds as design-only until a second human exists, or is paused. **A-0 cannot be completed without this decision.** The design must not assume the role is filled |
| Signer-registry path must be code-owned | The registry's **exact path**, so it can be code-owned. The design must name it; `.github/allowed_signers` is assumed but not decided |
| Two trust models distinguished (5.1–5.3) | That model B is a signed, revision-bound artefact verified by re-derivation, and that model A is its precondition and never its substitute. **This is now settled by section 5 and should be carried into the design unchanged** |
| `required_signatures` available | Whether the gate verifies GitHub-reported commit signatures or re-verifies independently against the registry. The adoption record requires re-derivation, so: **independently** |
| Revocation semantics | The retroactive-versus-prospective decision in 5.4. It is a policy choice with an owner-visible cost and must not be settled by implementation default |
| **Administrator can change protection (2.3, G-10)** | Whether a malicious or compromised administrator is **in** the threat model. If yes, A-0 does not mitigate it and the design must say what would. If no, it must be recorded as an **explicit scope exclusion**. Either way it is written down |
| `enforce_admins` reversible by an admin | The key-lifecycle design must treat "protection was temporarily disabled" as a detectable event — which needs the external webhook or monitor from 2.3 — or accept that it is not detectable |

A-0 makes self-authorisation **auditable**; on a single-administrator personal-account repository it cannot make it **impossible**.

---

## 7. Owner decisions required before A-0 can be implemented

| # | Decision | Blocking? |
|---|---|---|
| **D-1** | Will a second, genuinely independent trusted human be engaged, and who? | **Yes.** Blocks step 0, G-3, U-1, and therefore the security property of all of Workstream A |
| **D-2** | Authorise step 1 (add `scholarship-drafts` as a required check on `dev` and `main`; optionally `strict`) | No — independent of D-1, and the smallest useful change available today |
| **D-3** | Is a malicious or compromised administrator in the threat model? | **Yes** for the design. Determines whether the organisation migration in 2.3 is in scope or the case is an explicit exclusion |
| **D-4** | Authorise an external protection-change monitor or webhook (2.3), and decide where it runs and who holds its credentials | No, but it is the only G-10 mitigation available without a topology change |
| **D-5** | Revocation semantics: retroactive or prospective (5.4) | Not yet — needed before Workstream A implementation, not before A-0 |
| **D-6** | Whether Workstream A proceeds as design-only while D-1 is open | **Yes** for sequencing |

Unchanged and still open from the adoption record: a qualified editorial reviewer is unengaged (requirement 2 and 5), and originality-engine procurement is open (requirement 4). **D-1 and the editorial-reviewer engagement are different roles and should not be conflated** — one authorises signing keys and approves protected-path changes, the other judges question content. One person could hold both, but the design must not assume it.
