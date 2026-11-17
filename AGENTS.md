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

## AI Development Environment

### Session Startup Behaviour (Applies to All Agents)

At the beginning of every new development task, the agent must:

1. **Confirm the repository and active Git branch/worktree.** Verify you are in the correct repository and know the current branch or detached worktree state.
2. **Check relevant uncommitted changes and existing work.** Run `git status --short` before making any edits. Preserve concurrent agents' work and unrelated changes.
3. **Identify the permitted development environment.** DEV Supabase is `mfglzabnayacssgertat`. PROD Supabase `uermhsptduikehuyceiz` is strictly off-limits. Never modify production databases, deployments, or credentials.
4. **Apply MindMosaic coding, architecture, and security standards.** Follow AGENTS.md standing rules, TypeScript strict mode, the design system in `docs/design.md`, and the pre-commit verification gate.
5. **Review only the relevant context.** Do not scan the entire repository. Inspect only the files, features, and tests related to the current task.
6. **Select the appropriate implementation and testing workflow.** Use existing components and patterns before creating new ones. Apply the right skill on demand.
7. **Check for concurrent work before modifying shared files.** Coordinate with other agents editing the same files.

Startup is lightweight. No expensive tests, package installs, or modifications run automatically on session start.

### Available Skills (Load On Demand)

Skills are stored in `.claude/skills/` and load only when explicitly invoked. They do not consume context during every session.

| Skill | Purpose |
|-------|---------|
| `architecture-review` | Technical decisions, Next.js architecture, Supabase design |
| `feature-development` | Implement approved features using existing components and patterns |
| `qa-automation` | Unit, integration, Playwright, accessibility, and regression testing |
| `security-review` | Authentication, authorisation, RLS, secret exposure |
| `database-review` | Schema validation, migration impact assessment |
| `release-readiness` | CI evidence, deployment dependencies, GO/NO-GO recommendations |
| `impeccable` | UI design, critique, audit, polish, adapt, animate, harden |
| `playwright-cli` | Browser automation, Playwright test interaction |
| `ui-ux-pro-max` | UI/UX design, prototypes, design systems |
| `web-design-guidelines` | Web design best practices |

To invoke a skill, reference it by name (e.g., "use the architecture-review skill"). Skills are discoverable by both Claude Code and Cline.

### Specialist Capabilities

Configure specialist subagents where supported:

| Subagent | Focus |
|----------|-------|
| `architecture-review` | Next.js App Router, TypeScript strict, Supabase RLS, API routes |
| `feature-development` | Component implementation, feature flags, page composition |
| `qa-automation` | Vitest, React Testing Library, Playwright E2E, accessibility |
| `security-review` | Auth, RBAC, RLS policies, credential handling, secret scanning |
| `database-review` | Migration impact, schema validation, query performance |
| `release-readiness` | Pre-commit gate, CI evidence, GO/NO-GO decisions |

### Production Safety Controls (Mandatory)

- **Production is strictly off-limits.** DEV Supabase: `mfglzabnayacssgertat`. PROD Supabase: `uermhsptduikehuyceiz` — never access.
- **Never merge into `main` or push to production automatically.** Releases go through `dev` → `main` PRs merged by the repository owner.
- **Never deploy, push, or apply database migrations without explicit approval.**
- **Preserve unrelated changes and concurrent agents' work.**
- **Use an isolated development branch/worktree for implementation.**
- **Do not expose secrets in prompts, logs, or configuration files.**
- **Do not commit `.env*`, secrets, generated test output, screenshots, or build directories.**
