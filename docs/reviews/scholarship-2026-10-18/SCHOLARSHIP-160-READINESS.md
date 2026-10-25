# SCHOLARSHIP-160-READINESS: readiness report (corrected for PR #78 review)

**Programme:** MindMosaic Scholarship Year 6 (160 questions)
**Prepared by:** AI-assisted audit (advisory). Not qualified human review.
**Repository:** `Vishwas2018/mindmosaic-exam-engine`
**Audit branch:** `audit/scholarship-y6-production-readiness` (PR #78, draft)
**Target branch:** `dev`

> [!IMPORTANT]
> **Advisory notice.** Everything here is AI-generated advisory analysis. **Zero questions have been approved, published or deployed.** No qualified human has reviewed any question for interpretation, uniqueness, distractor quality or age-fit. The human gate stays fully active and fail-closed. This report corrects earlier versions that overstated what the evidence establishes; counts below are recomputed in `scholarship-160-inventory.json` and re-checked on every `npm test`.

---

## 1. Verdict

**NOT READY FOR PRODUCTION RELEASE.** Machine arithmetic consistency is established for 99 of 160 items. Nothing else that a release needs is established for any item.

| Area | What is established | What is not |
|---|---|---|
| Whole programme (160) | Hashes D1/D2/D3 recomputed for every item; 99 machine key checks pass, 0 fail | Everything in section 3 below, for all 160 |
| Numerical Reasoning (40) | 40 of 40 machine checks pass (20 closed-language solver, 20 first-party recompute). Difficulty gate: 26 pass, 14 blocked | Interpretation, uniqueness, distractors, age-fit, qualified review, provenance, approval |
| Mathematics (40) | 40 of 40 machine checks pass (all first-party recompute). Difficulty gate: 19 pass, 21 blocked | Same |
| Verbal Reasoning (45) | 19 of 45 machine checks pass (vr-027 to vr-045: letter series, coded words, syllogisms). 26 have no machine proof. Difficulty gate: 18 pass, 27 blocked | Same, plus independent review (generator unverified) |
| Reading (35) | **0 of 35** have a machine proof. Difficulty gate: 19 pass, 16 blocked | Same, plus independent review |

An earlier version of this report said all 160 keys were independently recomputed ("160 of 160 / 100 percent"). That was wrong: Verbal Reasoning has 19 and Reading has 0. The "80 of 80 keys verified" statement for Verbal and Reading was likewise unsupported by a machine proof; those agreements are model-generated advisory records only.

---

## 2. Recomputed counts

| Section | Items | Machine check `verified` | `not_established` | `failed` | Difficulty pass | Difficulty blocked |
|---|---:|---:|---:|---:|---:|---:|
| Numerical Reasoning | 40 | 40 | 0 | 0 | 26 | 14 |
| Mathematics | 40 | 40 | 0 | 0 | 19 | 21 |
| Verbal Reasoning | 45 | 19 | 26 | 0 | 18 | 27 |
| Reading Comprehension | 35 | 0 | 35 | 0 | 19 | 16 |
| **Total** | **160** | **99** | **61** | **0** | **82** | **78** |

Historical pipeline buckets (committed `status.json`) are reproduced exactly by recomputation: 45 ready for review, 35 requiring a revision or decision, 80 awaiting external evidence. Those buckets are a machine-pipeline vocabulary, not a statement that an item is educationally sound.

---

## 3. What is `not_established` for every one of the 160 items

| Dimension | Status | Why |
|---|---|---|
| Stem-to-solver semantic verification | `not_established` | ADR-017 requirement 2 has never been performed for any item |
| Independently checked answer uniqueness | `not_established` | A solver's internal uniqueness is scoped to its own variable domain, not to every reading of the stem |
| Distractor quality | `not_established` | No review record |
| Age and curriculum appropriateness | `not_established` | No reviewer engaged (ADR-017 requirement 5) |
| Qualified human review | `not_established` | None recorded |
| Verified original generation | `not_established` | No execution record; the declared generator is a historical claim only |
| Independent reviewer qualification | `not_established` | Independence cannot be evaluated while the generator is unverified; permanent under ADR-017 |
| Human approval | `not_established` | The authenticated approval control does not exist |
| Originality assessment | `not_established` | No engine selected |

---

## 4. Provenance and independence (reconciled)

Five things are kept apart (full detail in `PROVENANCE-AND-ADMISSION-ROUTE-MATRIX.md`):

- **Verified original generation:** none (0 of 160).
- **Historical declared generation:** `anthropic/claude-sonnet-5`, declared by the import workflow in `CONTENT-REVIEW-FINDINGS.md`; unverified.
- **Unknown or insufficiently verified generation:** all 160.
- **Repository revision provenance:** Git history and identity pins identify imported bytes only, not their generator.
- **Independent reviewer identity and qualification:** not established.

A Git author, importer, historical declaration or reviewing model is not proof of the original generator. A new review by a different provider is therefore **advisory evidence** and does not satisfy the production-grade different-provider rule while the generator is unknown.

---

## 5. ADR-017 scope (unchanged)

ADR-017 is **adopted as policy only.** Initial engineering scope is exactly five candidates: `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`. `nr-001` is policy-eligible on condition. Six sample candidates are deferred (`vr-032`, `vr-001`, `vr-016`, `rc-001`, `rc-002`, `rc-003`). The other 148 items have **no adopted admission route**.

Implementation, admission, approval and release are four further, separate owner authorisations, none of which has been given. Design is the only stage the adoption authorises.

**Can Numerical Reasoning launch today?** No. A paper needs 40 approved questions; 0 are approved, 0 are published, 2 are in initial engineering scope and 1 is conditional. This report does not propose expanding scope; see `NUMERICAL-40-CRITICAL-PATH-PLAN.md` section 5 for what evidence would have to exist first.

---

## 6. Review packages

| File | Purpose |
|---|---|
| `NUMERICAL-40-OWNER-REVIEW.md`, `MATHEMATICS-40-OWNER-REVIEW.md` | **Internal, answer-bearing** owner packs with evidence-qualified per-question status. Never sent to reviewers |
| `answer-blind/NUMERICAL-40-REVIEWER-PACKET.md`, `answer-blind/MATHEMATICS-40-REVIEWER-PACKET.md` | Standalone **answer-blind** reviewer packets: full stems and options, blank decision fields, bound to source bytes and a packet hash |
| `answer-blind/packet-manifest.json` | Packet hashes, source-file hashes and per-item content hashes |
| `answer-key-companions/` | Keys and machine results, held separately with distribution guidance |
| `VERBAL-READING-80-EXTERNAL-REVIEW-REPORT.md` | Evidence status for the 80 judgement items |
| `PROVENANCE-AND-ADMISSION-ROUTE-MATRIX.md` | Provenance and ADR-017 standing |
| `NUMERICAL-40-CRITICAL-PATH-PLAN.md` | Authorisation stages and expansion prerequisites (planning only) |
| `scholarship-160-inventory.json` | Deterministic inventory, schema v2 |

Reviewers receive the packet file only. These files are documentation: no runtime route or browser bundle reads them, which a unit test checks.

---

## 7. Reproducing and checking

```bash
npx tsx scripts/generate-scholarship-inventory.mts --check      # fails if the committed inventory is stale
npx tsx scripts/generate-owner-review-packs.mts --check         # fails if any pack or packet is stale
```

The generators contain no wall-clock value. If any machine key check fails, the pack generator writes nothing and exits non-zero, and the inventory sets `auditStatus: "FAILED"`. The unit tests for this behaviour run in `npm test`, which also fails on a stale committed inventory or a stale blind packet. The owner-pack `--check` is a manual command.

---

## 8. Known limits of this audit

- Delivery-engine behaviour (strict assembly, serve-time approval, no partial papers, sign-in only) is covered by existing unit tests in the repository; PR #78 did not re-audit it.
- 39 identity pins (nr-001 to nr-020, vr-027 to vr-045) differ from the recomputed D2 hash. Whether that is a different hash domain or stale pins is not reconciled here, so repository-revision binding is `not_established` for those items.
- `revised-in-this-release.json` lists 32 items; `README.md` in this folder says 30. The list is the primary record. The README figure is a pre-existing discrepancy and was not edited.
- The 19 Oct external review's item-level responses are not committed. Only narrative references exist, so its per-item findings are `not_established`.
