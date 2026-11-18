---
name: feature-development
description: Implement approved features using existing MindMosaic components and patterns.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[feature-description]"
license: Apache 2.0
---

# Feature Development Skill

Use this skill to implement new features in MindMosaic following established patterns and conventions.

## When to Invoke

- Implementing an approved feature from the roadmap
- Adding new pages or components to an existing feature
- Creating feature flags for gated rollouts
- Building student, parent, or admin interfaces
- Extending the exam engine or practice studio

## Core Principles

1. **Reuse existing infrastructure.** Leverage `StudentPortalShell`, `ParentShell`, `ExamQuestion`, exam store, and other shared components.
2. **Feature flags for gated access.** Use DEV-only flags for experimental features (e.g., `vihaan-scholarship-prep`). Production is always refused unconditionally.
3. **Server-authoritative data.** All scoring, attempts, and progress go through server endpoints.
4. **Design system compliance.** Follow `docs/design.md` (v2.2) for styling, tokens, and typography.
5. **TypeScript strict.** All code must pass `tsc --noEmit`.

## Implementation Workflow

1. Confirm repository branch and worktree state
2. Check for concurrent work on shared files
3. Inspect existing patterns in `src/features/`
4. Implement component/page following conventions
5. Add feature flag if DEV-only
6. Write unit and integration tests
7. Run typecheck, lint, and tests
8. Report evidence-based completion

## Output Format

Return:
1. **Files created/modified** with paths
2. **Pattern reuse** — existing components/hooks leveraged
3. **Feature flag status** — if applicable, flag name and gating logic
4. **Test results** — pass/fail counts
5. **Typecheck status** — pass/fail

Do not fabricate test results or claim functionality is complete unless tested.
