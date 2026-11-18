# Vihaan Huntingtower Year 7 Scholarship Bank (AGY-500)

**Status: `draft`, `approvedBy: null`, 0 approved, 0 published, `publicationEligible: false`.**

This package contains 500 original, unofficial Edutest-style Year 6/7 scholarship preparation questions (`vihaan-agy-*`) generated in 10 batches of 50 items each, without modifying any Codex/Cline content (`expansion-500`) or any production/application code.

## Distribution & Mock Reservation

| Subject | Total | Practice Pool | Mock-Reserved | Easy | Medium | Challenging |
|---|---:|---:|---:|---:|---:|---:|
| Mathematics (`numeracy`) | 120 | 96 | 24 | 18 | 54 | 48 |
| Numerical Reasoning (`numerical_reasoning`) | 120 | 96 | 24 | 18 | 54 | 48 |
| Verbal Reasoning (`verbal_reasoning`) | 120 | 96 | 24 | 18 | 54 | 48 |
| Reading Comprehension (`reading`) | 100 | 80 | 20 | 15 | 45 | 40 |
| Written Expression (`writing`) | 40 | 32 | 8 | 6 | 18 | 16 |
| **Total** | **500** | **400** | **100** | **75 (15%)** | **225 (45%)** | **200 (40%)** |

## Review Batches

| Batch | Role | Items | Draft | Validation Report |
|---|---|---:|---|---|
| `vihaan-agy-01` | Practice | 50 | [batch-01.draft.json](batch-01.draft.json) | [batch-01.validation.json](batch-01.validation.json) |
| `vihaan-agy-02` | Practice | 50 | [batch-02.draft.json](batch-02.draft.json) | [batch-02.validation.json](batch-02.validation.json) |
| `vihaan-agy-03` | Practice | 50 | [batch-03.draft.json](batch-03.draft.json) | [batch-03.validation.json](batch-03.validation.json) |
| `vihaan-agy-04` | Practice | 50 | [batch-04.draft.json](batch-04.draft.json) | [batch-04.validation.json](batch-04.validation.json) |
| `vihaan-agy-05` | Practice | 50 | [batch-05.draft.json](batch-05.draft.json) | [batch-05.validation.json](batch-05.validation.json) |
| `vihaan-agy-06` | Practice | 50 | [batch-06.draft.json](batch-06.draft.json) | [batch-06.validation.json](batch-06.validation.json) |
| `vihaan-agy-07` | Practice | 50 | [batch-07.draft.json](batch-07.draft.json) | [batch-07.validation.json](batch-07.validation.json) |
| `vihaan-agy-08` | Practice | 50 | [batch-08.draft.json](batch-08.draft.json) | [batch-08.validation.json](batch-08.validation.json) |
| `vihaan-agy-09` | Mock Paper A | 50 | [batch-09.draft.json](batch-09.draft.json) | [batch-09.validation.json](batch-09.validation.json) |
| `vihaan-agy-10` | Mock Paper B | 50 | [batch-10.draft.json](batch-10.draft.json) | [batch-10.validation.json](batch-10.validation.json) |

## Key Deliverables

- [bank.draft.json](bank.draft.json) — Consolidated 500-item draft manifest.
- [mock-exam-inventory.md](mock-exam-inventory.md) & [mock-exam-inventory.json](mock-exam-inventory.json) — 100 unseen mock-exam reserved items (Mock Paper A & Mock Paper B).
- [quality-coverage-report.json](quality-coverage-report.json) — Consolidated automated validation, taxonomy, visual, and corpus-similarity report.
- [approval-package.md](approval-package.md) — Human-readable approval & editorial review package (`approvedBy: null`).

## Reproduce

```powershell
python scripts/build-vihaan-agy-500.py
node --import tsx scripts/validate-vihaan-agy-500.mts --write-report
```
