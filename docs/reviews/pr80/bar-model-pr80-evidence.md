# PR #80 bar-model pilot evidence

## Worktree and branch status

- Branch: feat/bar-modelling-30-question-pilot
- Remote tracking branch: origin/feat/bar-modelling-30-question-pilot
- HEAD: eede099509db425d2a06f50d12f68b20a362f95e
- Status: local branch is clean after the fix commit; the PR remains draft and no deployment was triggered.

## Baseline fixture validation totals

- Valid baseline fixtures: 6
- Warning baseline fixtures: 2
- Invalid baseline fixtures: 17
- Baseline total: 25

## 30-item pilot totals

- Pilot total: 30
- Year 3: 15
- Year 5: 15
- Skill families: part-whole, comparison, times-as-many, equal-units, before-after, transfer

## Per-item comparison

| ID | Year | Skill | Difficulty | Stored key | Solver target | Result |
| --- | --- | --- | --- | ---: | ---: | --- |
| pilot-y3-part-whole-01 | 3 | part-whole | easy | 22 | 22 | PASS |
| pilot-y3-comparison-01 | 3 | comparison | easy | 12 | 12 | PASS |
| pilot-y3-times-as-many-01 | 3 | times-as-many | medium | 18 | 18 | PASS |
| pilot-y3-part-whole-02 | 3 | part-whole | easy | 23 | 23 | PASS |
| pilot-y3-comparison-02 | 3 | comparison | easy | 13 | 13 | PASS |
| pilot-y3-times-as-many-02 | 3 | times-as-many | medium | 28 | 28 | PASS |
| pilot-y3-part-whole-03 | 3 | part-whole | medium | 33 | 33 | PASS |
| pilot-y3-comparison-03 | 3 | comparison | medium | 25 | 25 | PASS |
| pilot-y3-times-as-many-03 | 3 | times-as-many | hard | 45 | 45 | PASS |
| pilot-y3-part-whole-04 | 3 | part-whole | easy | 19 | 19 | PASS |
| pilot-y3-comparison-04 | 3 | comparison | medium | 15 | 15 | PASS |
| pilot-y3-times-as-many-04 | 3 | times-as-many | medium | 20 | 20 | PASS |
| pilot-y3-part-whole-05 | 3 | part-whole | hard | 37 | 37 | PASS |
| pilot-y3-comparison-05 | 3 | comparison | hard | 23 | 23 | PASS |
| pilot-y3-times-as-many-05 | 3 | times-as-many | hard | 36 | 36 | PASS |
| pilot-y5-equal-units-01 | 5 | equal-units | easy | 35 | 35 | PASS |
| pilot-y5-before-after-01 | 5 | before-after | easy | 45 | 45 | PASS |
| pilot-y5-transfer-01 | 5 | transfer | easy | 7 | 7 | PASS |
| pilot-y5-equal-units-02 | 5 | equal-units | medium | 63 | 63 | PASS |
| pilot-y5-before-after-02 | 5 | before-after | medium | 64 | 64 | PASS |
| pilot-y5-transfer-02 | 5 | transfer | medium | 11 | 11 | PASS |
| pilot-y5-equal-units-03 | 5 | equal-units | easy | 36 | 36 | PASS |
| pilot-y5-before-after-03 | 5 | before-after | hard | 85 | 85 | PASS |
| pilot-y5-transfer-03 | 5 | transfer | hard | 11 | 11 | PASS |
| pilot-y5-equal-units-04 | 5 | equal-units | medium | 63 | 63 | PASS |
| pilot-y5-before-after-04 | 5 | before-after | medium | 62 | 62 | PASS |
| pilot-y5-transfer-04 | 5 | transfer | hard | 16 | 16 | PASS |
| pilot-y5-equal-units-05 | 5 | equal-units | hard | 72 | 72 | PASS |
| pilot-y5-before-after-05 | 5 | before-after | hard | 81 | 81 | PASS |
| pilot-y5-transfer-05 | 5 | transfer | hard | 18 | 18 | PASS |

## Exact command evidence

### Unit regression check

```bash
cd "C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-bar-model-pilot"
npm test -- --run src/tests/unit/bar-model-pilot-fixtures.test.ts src/tests/unit/bar-model-preview-gate.test.ts
```

Result:

```text
Test Files  2 passed (2)
Tests       5 passed (5)
```

### Validation CLI

```bash
cd "C:/Users/vishw/Vish/Vish/mindmosaic-exam-engine-bar-model-pilot"
npm run visuals:validate-bar-models
```

Result:

```text
All 25 bar_model fixtures behave as intended.
```

## Production-route 404 guard evidence

- The dev preview route calls notFound() when the preview gate is closed: [src/app/dev/bar-model/page.tsx](src/app/dev/bar-model/page.tsx), [src/app/dev/bar-model/layout.tsx](src/app/dev/bar-model/layout.tsx)
- The gate logic is defined in [src/features/visuals/bar-model/preview-gate.ts](src/features/visuals/bar-model/preview-gate.ts)
- The unit guard is asserted in [src/tests/unit/bar-model-preview-gate.test.ts](src/tests/unit/bar-model-preview-gate.test.ts)

This is the project-level evidence that the preview route fails closed in production and does not render a draft route in a real production deployment.

## Review packet files

- Blind packet: [docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt](docs/reviews/pr80/bar-model-pr80-blind-review-packet.txt)
- Keyed report: [docs/reviews/pr80/bar-model-pr80-keyed-report.txt](docs/reviews/pr80/bar-model-pr80-keyed-report.txt)

## Outstanding requirements and blockers

- No independent blind-review record is attached to this branch at the time of writing.
- No human approval record is attached to this branch at the time of writing.
- This is a draft PR only and was not merged or published.
- The fix is validated locally and in the branch, but outstanding human review remains a blocker before publication.