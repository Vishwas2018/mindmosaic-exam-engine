# MindMosaic Repository Instructions & Standing Rules

## Product & Content Integrity

MindMosaic is a premium educational practice portal for Grade 3 and Grade 5 NAPLAN-style and ICAS-style questions.

- **Originality Guarantee:** All practice questions must be strictly original. Never copy official NAPLAN, ICAS, textbook, website, or commercial questions.
- **Content Governance:** Preserve the governed question-factory lifecycle, provenance rules, and taxonomy registries.
- **Answer Secrecy:** Never place the correct answer in alt text, visual JSON, filenames, or metadata.
- **Visuals:** Structured visual JSON rendered deterministically as HTML or SVG. No arbitrary unsanitised SVG.

## Architecture

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Zod schemas
- Zustand for client exam state
- Pure scoring functions outside React components
- Structured visual JSON rendered deterministically as HTML or SVG
- No arbitrary unsanitised SVG
- No API keys in browser code

## Standing Rules & Git Workflow

1. **Dedicated Worktree off `origin/dev`:** Always create and work inside a dedicated git worktree branched from fresh `origin/dev`.
2. **Never Commit in Main Checkout:** The primary repository checkout is read-only. All work occurs in dedicated worktrees.
3. **Short-Lived Branches:** Branch names must be descriptive (e.g. `feat/...`, `fix/...`, `chore/...`). Open PRs directly into `dev`. Branches are deleted immediately upon merge.
4. **Never Push to `main`:** The `main` branch is production. Releases are strictly `dev` → `main` pull requests merged by the repository owner.
5. **Full CI Green Before Merge:** All pull requests must pass the complete CI verification suite before merging.
6. **Fix Components, Not Tests:** Never weaken, disable, or delete assertion logic in tests to force a pass. Fix the underlying component or logic.
7. **Published-Only + Fail-Closed:** Only items with valid, published, tamper-evident manifest entries may be served to students. Any integrity mismatch must fail closed.
8. **Human Gate (`approvedBy`):** Content publication requires human sign-off (`approvedBy`). AI models may draft or audit, but human approval is mandatory.
9. **Zero Fabrication:** Never fabricate progress, fake test results, or claim features work without verified evidence.
10. **Design Specification is Mandatory:** `docs/design.md` (v2.2) is the single canonical source of truth for all visual styling, tokens, typography, and component specs.

## Git Safety & Hygiene

- Check git status before editing.
- Do not work directly on another agent's active branch.
- Never use `git reset --hard` on work that may need to be retained.
- Do not use `git clean` without explicit approval.
- Do not commit `.env*`, secrets, generated test output, screenshots, or build directories.
- Keep commits small, focused, verified, and intentional.

## AI Environment and Production Safety

- Start in a dedicated worktree from fresh `origin/dev`. Check Git status and keep existing worktrees and changes intact.
- Supabase hosted DEV is `mfglzabnayacssgertat`. Use loopback Supabase for RLS and authenticated E2E. Production `uermhsptduikehuyceiz` is off-limits.
- Confirm the exact target and obtain explicit approval before pushing, opening a PR, applying a hosted migration, or changing deployments. Owners merge through GitHub after the full CI gate.
- Keep production credentials outside assistant sessions. Vercel is inspection-only. Use Stripe test mode with synthetic data. Stripe and Supabase MCP are disabled for project use.
- Use a screened configuration or code snapshot for external Codex review. Keep secrets, credentials and student or parent personal data out of review inputs.
- See [AI environment safety](docs/AI_ENVIRONMENT_SAFETY.md) for hook verification and rollback.

## Pre-Commit Verification Gate

Before submitting a PR, verify:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run validate:questions
npm run check:answers -- --include-published
npm run questions:validate-ledger
npm run test:rls
npm run test:e2e
npm run test:e2e:auth
```

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
