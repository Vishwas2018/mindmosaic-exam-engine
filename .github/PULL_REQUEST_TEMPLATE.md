## Summary
<!-- What and why. Link the issue/ADR. Base branch must be `dev` (never `main` unless this is the owner's release PR). -->

## Type
- [ ] feat  - [ ] fix  - [ ] chore/config  - [ ] content  - [ ] migration  - [ ] release (`dev` → `main`, owner only)

## Environment safety
- [ ] Worked in a dedicated worktree off fresh `origin/dev`
- [ ] No PROD (`uermhsptduikehuyceiz`) access; DB work used local or DEV (`mfglzabnayacssgertat`) only
- [ ] No `.env*`, secrets, screenshots, test output or build artefacts committed
- [ ] No hosted migration applied or deploy performed by an agent without recorded approval

## Quality gates

Record PASS, FAIL or BLOCKED with evidence for every gate. Explain any blocker.
Merging requires all applicable gates and required GitHub CI checks to pass.
Include the independent review status when risk warrants it.
| Gate | Result |
|------|--------|
| `node --test .agents/scripts/safety-gate.test.mjs` | |
| `npm run typecheck` | |
| `npm run lint` | |
| `npm test` | |
| `npm run build` | |
| `npm run validate:questions` | |
| `npm run check:answers -- --include-published` | |
| `npm run questions:validate-ledger` | |
| `npm run test:rls` | |
| `npm run test:e2e` | |
| `npm run test:e2e:auth` | |

## Risk review
- [ ] Auth / RLS / Stripe / migrations touched? If yes, security-rls review done: <!-- link/summary -->
- [ ] UI changed? Keyboard, 360px mobile and contrast checked
- [ ] Regression evidence recorded for behavior changes
- [ ] Independent review (Codex or human) recorded, findings triaged

## Rollback
<!-- How to revert; any data or env steps. -->
