---
name: architecture-review
description: Technical decisions, Next.js architecture, and Supabase design review for MindMosaic.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[target]"
license: Apache 2.0
---

# Architecture Review Skill

Use this skill when you need to evaluate or make technical decisions about Next.js architecture, Supabase design, API routes, database schema, or system integration in MindMosaic.

## When to Invoke

- Evaluating a new feature's architectural fit
- Reviewing Supabase schema or RLS policy changes
- Assessing Next.js App Router route structure
- Checking API route design and server/client boundaries
- Reviewing state management (Zustand) usage
- Evaluating third-party integration design

## Core Principles

1. **Reuse before creating.** Always check if an existing component, hook, or pattern can be used before building something new.
2. **Server-authoritative scoring.** All scoring and attempt persistence happens server-side via `/app/api/exam` — never trust the client with answer keys before submission.
3. **TypeScript strict mode.** All code must pass `tsc --noEmit` with no errors.
4. **Next.js App Router.** Use the App Router pattern, not Pages Router.
5. **Supabase RLS.** Row Level Security policies must enforce parent-child and role-based access controls.

## Review Checklist

- [ ] TypeScript strict mode compliance
- [ ] Next.js App Router conventions
- [ ] Supabase RLS policies for data access
- [ ] Server/client boundary correctness
- [ ] Error handling and edge cases
- [ ] Accessibility (a11y) compliance
- [ ] Responsive design
- [ ] Test coverage (unit + integration)
- [ ] Performance considerations
- [ ] Security implications

## Output Format

Return:
1. **Architecture assessment** — pass/fail with specific findings
2. **Recommended patterns** — existing components/hooks to reuse
3. **Required changes** — specific files and modifications
4. **Risk flags** — security, performance, or maintainability concerns
5. **Test requirements** — what tests are needed

Do not self-approve architecture changes that affect production safety controls.
