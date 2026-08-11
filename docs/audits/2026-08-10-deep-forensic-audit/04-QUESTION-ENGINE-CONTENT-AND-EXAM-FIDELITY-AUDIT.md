# Question Engine, Content and Exam-Fidelity Audit

## Coverage and method

The audit traced authoring/import, Zod validation, selection, candidate projection, each renderer, response models, scoring, persistence, review/results and analytics. `npm run validate:questions`, default and extended correctness checks, registry/render/scoring tests, content/factory code and a risk sample of the four reported failures were reviewed. No protected official items were retrieved.

## Bank facts

| Dimension | Current validated bank |
| --- | --- |
| Total | 965 |
| Years | 832 Year 3; 133 Year 5 |
| Styles | 687 ICAS-style; 278 NAPLAN-style |
| Manual review | 4 essays |
| Visuals | 164 |
| Largest types | 453 multiple choice; 117 reading comprehension; 81 number entry |
| Subjects | DT 133; language 180; numeracy 203; reading 203; science 99; spelling 143; writing 4 |

The extended published-bank check saw 1,253 questions: 1,249 objective and 4 manual-review.

## Type and visual coverage

All 14 declared question types and all 10 visual types are present in schema/registry dispatch, validated by the full-bank gate or deterministic fixtures, and covered by renderer/scorer tests. Keyboard substitutes exist for drag/drop and ordering; hotspot regions are focusable; manual essay content is not auto-scored. Reading dependencies and safe visual bounds are schema-checked.

## Verified strengths

- Deterministic seeded selection preserves reproducibility without deriving database identity from the seed.
- Objective scoring is pure and weighted; manual questions are excluded from the objective percentage.
- Visual schemas use enumerated types and bounded structured data rather than arbitrary unsanitised SVG.
- Factory workflow contains lifecycle states, content hashes, crash-safe ingestion/review/revision, deterministic rule review, semantic-completion evidence and diversity planning.
- Internal originality/near-duplicate and Australian-English checks exist and fail closed in governed factory paths.
- Current fidelity documents accurately state that NAPLAN practice is fixed-path and that spelling is text-only. Official NAP guidance confirms current online NAPLAN is tailored/adaptive and uses audio in spelling.

## Findings

### P1 High

- `MM-AUD-CONT-001`: `questionBank` imports hand-authored content directly as the production bank. Structural validation does not require factory provenance, independent reviewer identity or a completed semantic-evidence chain. The default checker classifies 877/961 objective items for editorial review rather than independently verifying them. The current bank can therefore grow by bypassing the strongest governed path.
- `MM-AUD-TIME-001`: paper fidelity breaks at the finalisation boundary because submit does not use the pattern-aware duration used by creation and resume.

### P2 Medium

- `MM-AUD-CONT-002`: the correctness checker reports four false failures on correct live keys. Its heuristics confuse “greatest change” with maximum value, “more than half” with exactly half, and “most friction” with longest travel distance. This makes the required CI gate fail while directing editors toward incorrect changes.
- `MM-AUD-PERF-001`: the guest-bank endpoint serialises curated, published and practice banks together, including answer keys/explanations. The measured local response was 5,326,950 bytes and cached for a year.

## Semantic sample outcome

The four checker failures were manually re-derived from their visual data:

- `icas-y3-numeracy-db-016`: Week 2–3 is the greatest increase; the checker chose the highest point.
- `icas-y3-numeracy-dc-015`: 16 of 30 is more than half; the checker searched for exactly half.
- `icas-y3-science-da-009`: sandpaper's 20 cm travel indicates the most friction; the checker selected the maximum distance.
- `icas-y3-science-db-016`: the key correctly identifies the greatest line-graph change; the checker again selected the maximum point.

This sample proves checker defects, not four question defects. It does not certify the remaining 961 questions semantically.

## Fidelity and originality disposition

The product uses NAPLAN/ICAS descriptively and includes non-affiliation/original-content wording. The fixed-path and text-only-spelling differences are disclosed in fidelity documents and tested disclosure UI, so those earlier risks are ruled out. However, “full-length simulation” must remain qualified: official NAPLAN online uses three-stage tailored paths and results incorporate item complexity. Repository-only similarity checks cannot prove absence of close paraphrase against proprietary corpora; external originality remains unverified.

## Gaps and blocked verification

The audit did not independently solve all 965 current or 1,253 extended-bank questions, compare them with protected external corpora, or freshly render every type in a browser. Semantic assurance outside the four re-derived failures remains sampling- and governance-limited.

## Priorities

Require a signed provenance/review manifest for every production-bank import, separate deterministic structural checks from semantic adjudication, correct the four heuristic templates, and commission risk-based human review across every programme/year/subject/type/visual stratum before release.
