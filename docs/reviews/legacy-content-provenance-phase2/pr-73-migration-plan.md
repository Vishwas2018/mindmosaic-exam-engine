# Migration Plan for PR #73 (Safe Operational Sequence)

**Reference Target:** [PR #73](https://github.com/Vishwas2018/mindmosaic-exam-engine/pull/73) (`feat/scholarship-y6-sample`, commit `dcb60a80f3f6eabdb522b20202929d2e3f328a94`)  
**Scope:** Exactly the 12 Year 6 Scholarship sample questions.

---

## 1. Guiding Principles for Migration

1. **PR #73 Remains Untouched Until Authorisation:** PR #73 stays draft and unmodified during Phase 2 policy review.
2. **No Skipping Gates:** No script or agent may bypass intermediate verification states.
3. **Strict Separation of Phases:**
   - Phase 2a: Governance Policy & ADR Adoption (Current documentation PR).
   - Phase 2b: Engineering Gate & Schema Implementation (Dedicated engineering PR).
   - Phase 2c: Evidence Collection & Owner Decision Execution (Operational execution).
   - Phase 2d: Final Ingestion, Approval Signing & PR #73 Merge.

---

## 2. Step-by-Step Migration Roadmap

### Phase 2a: Policy Adoption & ADR Ratification (Current Step)
- Owner reviews and merges this Phase 2 policy proposal (`docs/adr/017-legacy-content-unknown-origin-eligibility.md`, `docs/spec/legacy-content-unknown-origin-policy.md`).
- Formally ratifies the Differentiated Decoupled Governance model.

---

### Phase 2b: Engineering Gate & Tooling Implementation
- Branch off fresh `origin/dev` (e.g. `feat/legacy-admission-gates`).
- Implement the schemas defined in `docs/reviews/legacy-content-provenance-phase2/schemas.md`.
- Update `evidence.ts`, `orchestrate-staging.ts`, and `manifest-schema.ts`.
- Add `scripts/questions-admit-legacy.mts` and full unit test suite `legacy-admission-gates.test.ts`.
- Pass full CI verification gate and merge into `dev`.

---

### Phase 2c: Evidence Gathering for the 12 Candidates

#### 1. Deterministic Cohort (7 items: `nr-001`, `nr-022`, `nr-023`, `maths-004`, `maths-007`, `maths-014`, `vr-032`)
- Run first-party solver test suite: generate `solverExecutionEvidence` JSON for each item, binding derivation hashes.
- Run automated plagiarism and originality web/corpus scan on the word problem stems.
- Resolve NR-023 difficulty rating (Medium vs Challenging).
- Compile Class A evidence bundles.

#### 2. Discrete Verbal Cohort (2 items: `vr-001`, `vr-016`)
- Prepare answer-withheld review packet for VR-001 and VR-016.
- Execute authenticated Google Gemini 1.5/2.5 Pro API review calls to complement the existing ChatGPT review.
- Verify 100% agreement on correct option keys and single defensible answer.
- Resolve VR-001 difficulty rating (Medium vs Easy).
- Secure human SME rubric evaluation from curriculum educator.
- Compile Class B evidence bundles.
- *(Alternative: If owner prefers zero external API overhead, re-author 2 fresh vocabulary items under standard Phase 1 tooling).*

#### 3. Reading Comprehension Cohort (3 items: `rc-001`, `rc-002`, `rc-003`)
- **Option A (Legacy Admission):**
  * Submit full text of Maya & Grandfather Mangrove Estuary passage to plagiarism detection index (Google Books, academic corpora). Confirm 0% verbatim match.
  * Execute Google Gemini API review on rc-001, rc-002, and rc-003.
  * Obtain human SME cultural/curriculum evaluation.
- **Option B (Recommended Clean-Sheet Re-Authoring):**
  * Author 1 fresh, original Year 6 reading passage and 3 derived questions directly in factory using verified tooling (`kind: "generated"`, version 1).
  * Run standard external different-provider review.
  * Retire the legacy unverified reading draft.

---

### Phase 2d: Controlled Admission & Approval Signing

1. **Execute Truthful Intake:**
   Run `npm run questions:import-legacy` against the pinned sample manifest (`sample-import-manifest.json`). This creates genuine factory candidate records in `intake_pending` status without fabricating generation fields.
2. **Execute Governed Admission:**
   Run `npm run questions:admit-legacy` for each qualifying item, attaching its verified evidence bundle. The tool transitions candidates to `legacy_exception_approved` and appends entries to `content/legacy-provenance-ledger.json`.
3. **Generate Authenticated Human Approval Sheets:**
   Generate approval files in `content/publication-approvals/` binding the exact `publicationContentHash` of each admitted candidate.
4. **Owner Commit Signature:**
   The repository owner signs the approval commit using their registered GPG/SSH key.

---

### Phase 2e: Staging, Release Verification & PR #73 Merge

1. Run `npm run questions:stage` — verify all admitted legacy candidates pass the newly implemented Phase 2 staging gate.
2. Run `npm run build`, `npm run test:ci`, `npm run content:verify-publication`.
3. Verify that the scholarship sample release identities can now be safely re-pinned in `src/server/admin-review.ts`.
4. Merge PR #73 into `dev`.
