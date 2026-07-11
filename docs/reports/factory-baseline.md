# Factory Baseline — Mission 0 Record

Date: 2026-07-11
Recorded by: Cowork (Claude), executing Mission 0 of the Governed Question Factory plan. Windows-only verification and governance close-out completed by Claude Code on the local Windows machine.

## Baseline commit

- Final local `main` commit prior to this governance close-out commit: `ed0c865` — "Record Phase 3 hardening resolution matrix and factory baseline"
- Parent: `38b7632` — "Add unfinished donor repo reuse audit to docs"
- Grandparent: `bea1b88` — "Harden Phase 3 exam integrity and accessibility" (the hardened baseline; all 17 Phase 3 hardening commits present)
- Final `origin/main`: matched local `main` at `ed0c865` before this close-out commit was pushed; this close-out commit was pushed immediately after being created (see Push status below).
- `integration/governed-question-factory`: fast-forwarded to the same close-out commit as `main`; `origin/integration/governed-question-factory` matches.

## Repository repair performed before verification (incident record)

A crashed git process (prior to this session) had left the repository damaged. Repairs, in order, all evidence-based and minimal:

1. `.git/config` — trailing NUL bytes after the last valid line (parse failure on line 22). Stripped NULs only; all valid content preserved.
2. `.git/HEAD` — same NUL-padding corruption. Rewritten to `ref: refs/heads/main`.
3. Stale `.git/index.lock` removed.
4. `git fsck`: no corruption beyond harmless dangling objects.
5. Working tree: 20 files were truncated (files ended mid-word/mid-identifier, e.g. `package.json` ended at `"t`; diffs showed only end-of-file deletions plus one partial trailing line, zero interior edits) — file damage from the same crash, not editing. Damaged copies were backed up outside the repository, then the 20 named files were individually restored from `bea1b88`. This was a targeted repair of corrupted files, not a blanket discard of work.
6. Untracked `docs/UNFINISHED_NEXT_REPO_REUSE_AUDIT.md` (intact, required project documentation) committed as `38b7632`.

## Governance close-out performed on the Windows machine

The Mission 0 sandbox recorded four commands as pending local verification (see below) and left one governance item open: a set of Linux-sandbox-only accidental probe artefacts (`.bash-probe.ts`, `.bash-probe2.txt`, `.mount-probe.txt`, `.fuse_hidden0000000e00000001`) and any matching `.git/info/exclude` entries hiding them, flagged for local removal.

Checked directly on the Windows machine, before any other action:

- `git check-ignore -v` on all four paths: no match (exit 1, no output).
- Direct existence check on all four paths: all four **do not exist** on this checkout. `.fuse_hidden*` is a Linux FUSE temp-file pattern and the probe files were artefacts of the Linux sandbox environment used for the earlier repair session; none were ever materialised on this Windows working tree.
- `.git/info/exclude`: contains only the default Git-generated header comment, no entries referencing these or any other files.
- `git status --short --untracked-files=all`, `git ls-files --others --exclude-standard`, `git diff --check`, and a filesystem `find` for `.fuse_hidden*`/`.bash-probe*`/`.mount-probe*` were all run and returned empty.

Conclusion: no artefacts to remove, no exclude entries to remove, on this machine. Nothing was fabricated or force-created to "demonstrate" a removal that wasn't needed.

Two documentation count errors were corrected (verified against the actual production question bank before editing, not applied blind):

- `docs/PHASE3_HARDENING.md` — "Five of the seven ordering questions" → "Four of the six ordering questions" (two occurrences: the summary sentence and the rotate-by-one verification sentence).
- `docs/reports/phase3-hardening-resolution.md` — "verified non-matching for all 7 production ordering questions" → "...all 6 production ordering questions".
- `docs/QUESTION_SCHEMA.md` — the same "five of the seven" phrasing was also found here (not in the original two-file list) and corrected to "four of the six" for consistency, since it describes the identical fact.
- Verification: the production bank (`src/content/questions/grade-{3,5}/*.ts`) contains exactly 6 ordering questions (one per file: `grade-3/icas-mathematics.ts`, `grade-3/naplan-reading.ts`, `grade-3/naplan-numeracy.ts`, `grade-5/naplan-numeracy.ts`, `grade-5/naplan-reading.ts`, `grade-5/naplan-language.ts`). Comparing each question's authored `interaction.items` order against its `answerKey.optionIds`: 4 are authored in canonical (already-correct) order (naplan-reading g3, naplan-numeracy g5, naplan-reading g5, naplan-language g5) and 2 are not (icas-mathematics g3 "ages" and naplan-numeracy g3 "rainfall"). "Four of six" is factually correct, not just a copy of the instruction.
- No question content, `answerKey`, or test files were modified.

## Verification results (run on the Windows machine, repo root)

| Command | Result | Detail |
| --- | --- | --- |
| `npm run typecheck` | PASS | `tsc --noEmit`, no errors |
| `npm run lint` | PASS | `eslint .`, no errors |
| `npm test` | PASS | 23 Vitest files, 376/376 tests passed |
| `npm run validate:questions` | PASS | 100 production questions + 15 showcase fixtures valid |
| `npm run check:answers` | PASS | Failures: 0. Warnings: 58 (informational) |
| `npm run check:bundle` | PASS | All 4 routes within budget (see below) |
| `npm run build` | PASS | Turbopack, 5 static routes generated |
| `npm run test:e2e` | PASS | Playwright, 20/20 tests passed (4 spec files: accessibility, exam-flows, renderer-showcase, smoke) |
| `npm audit` | 2 moderate | Only the known Next ≤16.3.0-canary.5 / PostCSS transitive advisories remain — explicitly accepted by the mission; `npm audit fix --force` not run, Next not downgraded |

No stale "pending local verification" statements remain — all four previously-pending commands (`npm test`, `npm run build`, `npm run check:bundle`, `npm run test:e2e`) have been run to completion on this Windows machine with the results above.

Test inventory: 23 Vitest test files (`src/tests/**`), 376 tests; 4 Playwright spec files (`e2e/**`), 20 tests.

Bundle budgets (enforced by `check:bundle`): `/` 1,150 KB budget / 1,082 KB measured; `/exam` 1,100 KB budget / 1,023 KB measured; `/results` 1,100 KB budget / 999 KB measured; `/showcase` 1,100 KB budget / 1,015 KB measured. All OK.

## Hardening resolution gate

`docs/reports/phase3-hardening-resolution.md` — complete matrix covering all P1 (6), P2 (8), P3 (4) and 2 additional findings. No unresolved P0/P1; both deferred P2 sub-items carry documented technical justifications. Gate satisfied. Ordering-question counts in that document now match the production bank (6 total, 4 originally canonical).

## Working-tree status at close of Mission 0

Strict cleanliness evidence (not ordinary `git status` alone):

- `git status --short --untracked-files=all` — empty (before the close-out commit's own staged changes; empty again after commit).
- `git ls-files --others --exclude-standard` — empty.
- `git diff --check` — no whitespace/conflict-marker errors.
- Filesystem `find` for `.fuse_hidden*` / `.bash-probe*` / `.mount-probe*` — no matches.
- `git fsck --full` — no errors; only pre-existing harmless dangling objects (garbage-collectible leftovers from earlier session history, not corruption).

No unexplained untracked files. Damaged-file backups from the original incident remain outside the repository (not tracked, not committed). No factory implementation has started — the diff between `bea1b88` and the tip of `main` at every point in Mission 0 has touched documentation files only, never `src/`, `e2e/`, or `scripts/`.

## Push status

- `main` pushed to `origin/main`; local and remote hashes verified identical via `git rev-parse`.
- `integration/governed-question-factory` fast-forwarded from `main` (`git merge --ff-only`) and pushed to `origin/integration/governed-question-factory`; all three references (`main`, `integration/governed-question-factory`, `origin/integration/governed-question-factory`) verified identical via `git rev-parse`.

## Recommendation

**Mission 0 is complete. Mission 1 may begin.** All required verification commands pass on the Windows machine, both branches are pushed and aligned with their remotes, `git fsck` is clean, the working tree is strictly clean by every check run, and no unresolved P0 or P1 findings remain.
