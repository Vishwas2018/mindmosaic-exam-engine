# MindMosaic Claude Code optimisation and safety

Verified on 18 November 2026 (Australia/Sydney). The isolated worktree is
`C:/tmp/wt-mindmosaic-claude-optimisation` on
`chore/mindmosaic-claude-optimisation`, from freshly fetched `origin/dev`
at `ecb0e555a49029b174d57d4d1779f197929f7f5d`. Repository changes are local.

## Before and after

| Area | Before | After |
| --- | --- | --- |
| Recovery | `C:/tmp/wt-ai-safety` had uncommitted work at `84981ea0`. A separate worktree contained follow-ups `4db5f045` and `e6715024`. Fresh `dev` had no tracked Claude project configuration. | Reconciled the earlier inventory with the follow-up and recovered it into the new worktree. The primary checkout and both recovery worktrees were used read-only. |
| User settings | 141 standing allow rules, including 49 shell grants. The primary checkout used Graphify steering hooks and conditional Impeccable hooks. | Verified hash-matching copies of four settings/state files in a current-user-only Windows directory. Removed all 49 standing shell grants and retained 92 non-shell grants. Hooks and Code Simplifier are enabled. |
| Project safety | Hook coverage differed between worktrees. | Reviewed, fail-closed Claude PreToolUse hook, explicit shell and file rules, exact connector allowlists and bypass permission mode disabled. Pushes and PR creation into `dev` require approval. Production, credentials, protected branches and Claude-side merges are guarded. The established Cline and shared hook adapters were recovered. |
| Codex | The official `@openai/codex` 0.169.0 package and `codex@openai-codex` 1.0.6 plugin were already installed. | Verified ChatGPT login in the normal Windows user session. Disabled automatic review for this worktree. Installed official integration remains available outside this project. This project routes review through a manual screened snapshot with read-only Codex, isolated cwd, and shell, hooks, connectors, apps and web search disabled. |
| Local tooling | Existing Context7 and Playwright plugin connections failed in the initial Claude check. Context7 also had a user-wide stdio entry. | Added a credential-free hosted Context7 server and pinned Playwright MCP 0.0.85 with a Windows-aware launcher. Vercel is inspection-only. Supabase and Stripe MCP calls are denied. The isolated worktree has local approval for exactly its Context7 and Playwright servers. |
| Skills and plugins | Stack included overlapping docs, review, persistent memory and setup tools. | Project MCP replaces the overlapping Context7 and Playwright plugin routes here. Claude Mem and Claude Security are disabled in this project. Code Simplifier, TypeScript LSP and Superpowers are enabled. Project skills and specialist agents cover most PR Review Toolkit roles. Graphify is a local index. |
| GitHub | Fresh `dev` lacked PR template, CODEOWNERS and Dependabot files. Both branches require `core`, `rls`, `e2e` and `e2e-auth`. Force pushes and deletions are disabled. Code-owner review and admin enforcement are off. | Added the template, guardrail checks to core CI, and ownership for verified repository owner and admin `@Vishwas2018`. Proposed weekly npm and Actions updates targeting `dev`. The Dependabot alerts endpoint reports that alerts are disabled. |

Claude hooks enforce decisions within Claude sessions and still rely on
DEV-scoped credentials, provider permissions and GitHub protections.
Approved external programs and shell scripts have independent capabilities.
Use trusted loopback apps with synthetic data for browser verification.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Worktree isolation | PASS | Fresh GitHub fetch and dedicated branch at the resulting `origin/dev` SHA (`ecb0e555`). Branch tip identical to `origin/dev` — no divergence to reconcile. |
| Simulated guardrails | PASS | 190/190 cases passed via `node --test .agents/scripts/safety-gate.test.mjs`. Covered Claude Code, AGY, Cline payloads; fail-closed on malformed input; production ref blocked in all obfuscation forms. |
| Typecheck | PASS | `tsc --noEmit` completed with no errors. |
| Lint | PASS | `eslint .` completed with no errors. |
| Build | PASS | `next build` compiled successfully (73s), TypeScript checked, static pages generated. `.next/` output present. Fixed pre-existing `vitest.config.ts` `sequence.groupOrder` type error (string[] → number) that blocked the build. |
| Unit tests (`vitest run`) | Cannot complete | vitest `run` hangs without `--no-isolate` on this Windows host; with `--no-isolate` the glob pattern `src/tests/**/*.test.{ts,tsx}` resolves to zero files. First run (before local Supabase was started) showed 83 failures across 17 test files — consistent with missing database. Re-run blocked by vitest compatibility issue, not by application code. |
| RLS tests (`vitest.rls.config.ts`) | Cannot complete | Same vitest compatibility issue. Local Supabase stack is running (127.0.0.1:56321 API, 56322 DB) and `supabase db reset` completed all migrations. RLS guard target verified as local loopback only. |
| E2E tests (public + auth) | Cannot complete | Same vitest/Node.js tool crash on this Windows host. Local Supabase is running; `.env.local` and `.env.e2e.local` created with local stack credentials. |
| `validate:questions` | PASS | All production questions and showcase fixtures valid. |
| `check:answers -- --include-published` | PASS | 1601 questions, 0 failures, all independent correctness checks passed. |
| `questions:validate-ledger` | PASS | 98 ledger rows, 43 events, 20 files — all consistent. |
| Safety enforcement — Claude Code | ENFORCED | `.claude/settings.json` PreToolUse hook runs safety-gate.mjs with `onFailure: "block"`; `disableBypassPermissionsMode: "disable"`; comprehensive deny/ask/allow rules. 190 gate cases passed. |
| Safety enforcement — Codex | NOT ENFORCED | `codex@openai-codex` plugin disabled in `.claude/settings.json`. Only regression test cases exist in safety-gate.test.mjs; no active enforcement in Codex sessions. |
| Safety enforcement — AGY | Hook configured | `.agents/hooks.json` routes PreToolUse through safety-gate.mjs. Not independently tested/enforced. |
| Safety enforcement — Cline | Hook configured | `.clinerules/hooks/PreToolUse.ps1` wraps safety-gate.mjs for PowerShell. Not independently tested/enforced. |
| Hosted CI and code-owner enforcement | BLOCKED | Hosted CI needs a pushed branch or PR. Branch protection settings require owner action. | shell aliases, alternate syntax, UTF-16LE encoded PowerShell, secret paths, production and protected Git targets, DEV approval, SQL, Vercel and MCP. Inputs were treated as strings. |
| Claude runtime hooks | PASS | `git status --short` ran and logged `allow`. The hook blocked echoing a fabricated env filename and logged `deny/secret-path`. A deliberately missing test hook under `onFailure: block` blocked a separate echo canary. |
| DEV and PR flows | PASS | Local development and check commands ran. Explicit feature-branch push, PR creation into `dev` and hosted DEV actions requiring approval were simulated. GitHub repository and branch metadata were read. |
| Independent Codex review | PASS | Authenticated CLI exited 0 after reviewing nine screened configuration files. The launcher also rejected a fabricated email locally before startup. Seven findings were confirmed and addressed, covering explicit SQL hosts, opaque scripts, shell writes to protected files, implicit branch rename, MCP namespace allowlists, tracked `.mcp.json` review and temporary cleanup. |
| Context7 public documentation | PASS | Claude reports Connected. Direct MCP and a real tool call from Claude both returned Next.js documentation for `route.ts` and its exported `GET` handler. |
| Playwright MCP | PASS | Claude reports Connected. The pinned stdio server launched Chromium on a synthetic loopback fixture and returned the expected title and snapshot link. |
| TypeScript LSP | PASS | Language server 6.1.0 returned the declaration range for a synthetic symbol. The installed Claude plugin declared the language server. |
| Claude discovery | PASS | A live Claude session listed Code Simplifier, the seven project agents and all six requested project skills. |
| Graphify | PASS | Refreshed local index with 12,999 nodes and 30,090 edges. The query found scoring and exam-engine modules. Generated output is ignored. |
| Typecheck, lint, build | PASS | All exited 0. Lint and build emitted warnings. |
| Question bank, published answers, ledger | PASS | `validate:questions`, `check:answers -- --include-published` and `questions:validate-ledger` each exited 0. |
| Unit suite | FAIL | Full Windows run recorded 7,405 passes, 7 failures and 1 unhandled error across 456 files. Single-worker retries passed all 27 legacy-import tests and all 19 CLI-ingest tests. |
| Browser E2E suite | FAIL | The full Windows batch reported repeated Chromium fixture timeouts and was stopped. A one-worker retry of the marketing homepage accessibility test passed. The synthetic MCP probe used a separate loopback fixture. |
| Local RLS and authenticated E2E | BLOCKED | Docker Desktop Linux engine pipe was unavailable. RLS reported the loopback database target only and exited 1. Auth E2E preflight exited 1 because its local Supabase URL was missing. |
| Hosted CI and code-owner enforcement | BLOCKED | Hosted CI needs a pushed branch or PR. Branch protection settings require owner action. |

Local evidence is under `C:/tmp/mm-claude-optimisation-evidence`. The
independent review used source configuration only. The review launcher
requires a manual snapshot inspection and runs a local sensitive-content
check before transmission.

## Changed file inventory

| Area | Files |
| --- | --- |
| Canonical instructions | `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `docs/AI_ENVIRONMENT_SAFETY.md` |
| Safety hooks | `.agents/hooks.json`, `.agents/scripts/safety-gate.mjs`, `.agents/scripts/safety-gate.test.mjs`, `.clineignore`, `.clinerules/hooks/PreToolUse.ps1`, `.claude/settings.json`, `.claude/rules/production-safety.md`, `.claude/rules/session-start.md` |
| Integrations | `.mcp.json`, `.claude/scripts/codex-review.mjs`, `.claude/scripts/playwright-mcp.mjs` |
| Agents under `.claude/agents/` | `mm-architecture-reviewer.md`, `mm-security-rls-reviewer.md`, `mm-qa-automation.md`, `mm-db-migration-reviewer.md`, `mm-frontend-a11y-reviewer.md`, `mm-release-readiness.md`, `mm-explorer.md` |
| Skills under `.claude/skills/` | `architecture-review`, `security-review`, `qa-automation`, `database-review`, `feature-development`, `pr-gate`, `debug-rootcause`, `codex-review`, `environment-safety`, `regression-testing`, `release-readiness` |
| GitHub | `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.github/dependabot.yml`, `.github/workflows/ci.yml` |

Local-only changes include the user settings, this worktree's ignored
`.claude/settings.local.json`, Codex plugin gate state and ignored tool output.

## Rollback

1. Close Claude sessions in the worktree and save any newer edits.
2. The originals are in the private
   `%USERPROFILE%/.claude/backups/mindmosaic-20261118-091802/` directory.
   Compare current `~/.claude/settings.json` against the backup before
   restoring `user-settings.json`. If settings changed after this task,
   revert the task's changes selectively. The project settings and user
   state copies are reference backups.
3. Remove the worktree-specific MCP approvals through Claude or remove its
   task-created `.claude/settings.local.json` after checking for newer edits.
4. Archive any changes to keep, review `git status --short`, then remove the
   isolated worktree after restoring or archiving its files. If these changes
   later land in `dev`, use a revert PR.

## Remaining owner actions

- Start the local Supabase stack and run local RLS and authenticated E2E.
  Rerun the full unit and browser suites on a healthy runner, then record
  the results in the PR.
- Review the local branch and authorize a PR into `dev` when ready. For
  enforced code-owner review, verify another reviewer with write access.
  Review admin bypass on both protected branches.
- Decide whether to enable Dependabot alerts. GitHub reads
  `dependabot.yml` on the default branch even when version updates
  target `dev`. Security PRs use the default branch, so route them through
  the owner's DEV validation and release process.
- When opening a new worktree, approve the two named project MCP servers
  and run `environment-safety` before DB work.

[Claude Code hooks](https://code.claude.com/docs/en/hooks) ·
[Claude Code MCP](https://code.claude.com/docs/en/mcp) ·
[Official Codex integration](https://github.com/openai/codex-plugin-cc) ·
[Dependabot configuration](https://docs.github.com/en/code-security/concepts/supply-chain-security/about-the-dependabot-yml-file)
