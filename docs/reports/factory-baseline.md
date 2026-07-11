# Factory Baseline — Mission 0 Record

Date: 2026-07-11
Recorded by: Cowork (Claude), executing Mission 0 of the Governed Question Factory plan.

## Baseline commit

- `main` @ `38b7632` — "Add unfinished donor repo reuse audit to docs" (baseline-cleanup commit, one docs file)
- Parent: `bea1b88` — "Harden Phase 3 exam integrity and accessibility" (the expected hardened baseline; all 17 Phase 3 hardening commits present)
- Local `main` matches the last-fetched `origin/main` (`bea1b88`); the baseline-cleanup commit is ahead by 1 and pending push.

## Repository repair performed before verification (incident record)

A crashed git process (prior to this session) had left the repository damaged. Repairs, in order, all evidence-based and minimal:

1. `.git/config` — trailing NUL bytes after the last valid line (parse failure on line 22). Stripped NULs only; all valid content preserved.
2. `.git/HEAD` — same NUL-padding corruption. Rewritten to `ref: refs/heads/main`.
3. Stale `.git/index.lock` removed.
4. `git fsck`: no corruption beyond harmless dangling objects.
5. Working tree: 20 files were truncated (files ended mid-word/mid-identifier, e.g. `package.json` ended at `"t`; diffs showed only end-of-file deletions plus one partial trailing line, zero interior edits) — file damage from the same crash, not editing. Damaged copies were backed up outside the repository, then the 20 named files were individually restored from `bea1b88`. This was a targeted repair of corrupted files, not a blanket discard of work.
6. Untracked `docs/UNFINISHED_NEXT_REPO_REUSE_AUDIT.md` (intact, required project documentation) committed as `38b7632`.

Working tree after repair: clean.

## Verification results

Environment note: this session's shell is a Linux sandbox; the repository's `node_modules` is a Windows installation (win32-native rollup/swc/esbuild binaries). Commands that require only pure-JS tooling ran against the real repository. Commands requiring platform-native binaries or a browser could not run in this sandbox and are recorded as **pending local verification** — they must be run once on the Windows machine before Mission 1 begins. Per `docs/PHASE3_HARDENING.md`, all of these gates passed locally during the hardening pass that produced `bea1b88` (each of its 17 commits was independently verified), so failures are not expected.

| Command | Result | Detail |
| --- | --- | --- |
| `npm run typecheck` | PASS | Run in-session against the real repo (tsc, pure JS) |
| `npm run lint` | PASS | Run in-session (eslint, pure JS) |
| `npm test` | PENDING LOCAL | Vitest requires platform-native rollup; not runnable in sandbox. 23 unit/component test files present |
| `npm run validate:questions` | PASS | Run in-session via a Linux tsx toolchain against the repo. 100 production questions + 15 showcase fixtures valid; full contract enforced |
| `npm run check:answers` | PASS | Run in-session. Failures: 0. Warnings: 58 (informational) |
| `npm run check:bundle` | PENDING LOCAL | Requires a Next production build (`.next`) |
| `npm run test:e2e` | PENDING LOCAL | Playwright, 4 spec files (incl. axe accessibility scans); requires browsers |
| `npm run build` | PENDING LOCAL | Next/Turbopack build requires platform-native swc |
| `npm audit` | 2 moderate | The known Next ≤16.3.0-canary.5 / PostCSS transitive advisories — explicitly accepted by the mission; `npm audit fix --force` not run |

Test inventory: 23 Vitest test files (`src/tests/**`), 4 Playwright spec files (`e2e/**`).

Bundle budgets (from the hardening pass, enforced by `check:bundle`): `/` 1,150 KB; `/exam`, `/results`, `/showcase` 1,100 KB each; last measured 1,082 / 1,023 / 999 / 1,015 KB respectively.

### Commands to complete pending local verification (run on the Windows machine, repo root)

```
npm test
npm run build
npm run check:bundle
npm run test:e2e
```

## Hardening resolution gate

`docs/reports/phase3-hardening-resolution.md` — complete matrix covering all P1 (6), P2 (8), P3 (4) and 2 additional findings. No unresolved P0/P1; both deferred P2 sub-items carry documented technical justifications. Gate satisfied.

## Working-tree status at close of Mission 0

- Branch: `main` @ `38b7632` + this baseline commit; working tree clean apart from the two Mission 0 reports being committed with this file.
- No unexplained untracked files.
- Damaged-file backups retained outside the repository (session outputs, `damaged-file-backup/`).
- No factory implementation started.

## Push status

The sandbox has no GitHub credentials (SSH). Pending push from the local machine:

```
git push origin main
git push -u origin integration/governed-question-factory
```
