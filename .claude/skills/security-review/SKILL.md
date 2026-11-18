---
name: security-review
description: Authentication, authorisation, RLS, and secret exposure review for MindMosaic.
metadata:
  version: '1.0.0'
user-invocable: true
argument-hint: "[target-area]"
license: Apache 2.0
---

# Security Review Skill

Use this skill to evaluate authentication, authorisation, Row Level Security, and secret handling in MindMosaic.

## When to Invoke

- Reviewing auth flows (sign-in, sign-up, password reset, OAuth)
- Evaluating parent-child access controls
- Auditing Supabase RLS policies
- Checking for secret exposure in client code
- Reviewing feature flag gating logic
- Assessing credential handling

## Security Controls

### Authentication
- Generic authentication errors — no account-existence leakage
- Wrong code and wrong PIN read identically
- Network errors separated from credential errors (not counted toward lockout)

### Authorisation
- Parent-child access control via `student-access.ts`
- Role-based access: student, parent, teacher, admin
- Feature flags are DEV-only; production refused unconditionally

### Row Level Security
- All data access goes through RLS-scoped queries
- Parent can only access their own children's data
- Student can only access their own attempts

### Secrets
- No API keys in browser code
- No `.env*` files committed
- No credentials in prompts, logs, or configuration

## Output Format

Return:
1. **Security assessment** — pass/fail with specific findings
2. **Vulnerabilities identified** — severity and location
3. **RLS policy review** — gaps or over-permissive rules
4. **Authentication gaps** — information leakage, weak errors
5. **Remediation steps** — specific fixes needed

Do not bypass content approval or publish unapproved questions.
