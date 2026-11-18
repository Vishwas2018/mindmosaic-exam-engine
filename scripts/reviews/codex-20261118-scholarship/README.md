# Scholarship draft review assembly

Run this agent-specific tool from the isolated worktree. It uses the
existing published source files, scholarship draft validator, writing
rubric, mock reservation and visual schema. It writes a local draft
revision, ten review and validation units, coverage, duplicate results,
a mock inventory and a hash-bound human approval register.

Keep the answer material and review inputs in a private directory outside
the checkout. The input contains `verification/solved-01.json` through
`solved-10.json` with ordered blind solutions, `writing-examples.txt` with
one annotated sample per writing ID, and `adjudication.json` keyed by the
established question IDs. Each unresolved key or ambiguity requires
adjudication.

```powershell
python scripts/reviews/codex-20261118-scholarship/prepare-review.py <private-review-dir> <private-review-dir>/draft-revision
```

The published source files and runtime stay outside the write scope.
Independent solving and internal duplicate checks supply advisory
evidence. A qualified human must approve any proposed expansion revision
against its draft hash before publication.
