# Outstanding Decisions Requiring Owner Authorisation (Phase 2)

Before implementation of Phase 2 engineering begins, the repository owner must decide on the following five policy and operational choices:

---

## Decision 1: Governance Admission Model

- **Option A (Recommended): Adopt ADR-017 Differentiated Governed Admission.**
  * Decouple mathematical/logical correctness from authorship provenance.
  * Allow Class A deterministic content to be admitted under verified algorithmic solver proofs + originality clearance.
  * Require multi-provider orthogonal consensus (e.g. OpenAI + Google) and qualified human SME rubric for Class B judgement content.
- **Option B: Permanent Ineligibility.**
  * Maintain Phase 1 fail-closed hold indefinitely. No unknown-origin content may ever clear staging or publication unless original generation execution logs are recovered.
  * Discards all 12 questions; requires 100% re-authoring from scratch.
- **Option C: Universal Re-Authoring.**
  * Formally retire all 12 legacy sample questions and author fresh replacements under Phase 1 tooling.

*Recommendation:* **Option A**.

---

## Decision 2: Reading Comprehension Stimulus Pathway (`rc-001`, `rc-002`, `rc-003`)

- **Option A: Clean-Sheet Re-Authoring (Recommended).**
  * Permanently retire the unverified Maya & Grandfather Mangrove Estuary passage and its 3 derived items.
  * Author 1 fresh Year 6 reading stimulus and 3 questions using verified factory tooling with full generation provenance (`kind: "generated"`, version 1).
  * Completely eliminates copyright, memorisation, and literary plagiarism risks.
- **Option B: Legacy Exception Admission via Plagiarism & Dual-Provider Audit.**
  * Retain the existing passage and items.
  * Run automated academic and web plagiarism scans on the passage text.
  * Execute external Google Gemini API review on rc-001, rc-002, and rc-003.
  * Obtain human SME cultural/curriculum evaluation.

*Recommendation:* **Option A**. Authoring a fresh, verified reading passage is cleaner, safer, and cheaper than auditing literary text with unknown prompt heritage.

---

## Decision 3: Discrete Verbal Reasoning Pathway (`vr-001`, `vr-016`)

- **Option A (Recommended): Retain via Dual-Provider Consensus.**
  * Retain `vr-001` (Thermometer:Temperature :: Odometer:Distance) and `vr-016` (Vigorous -> Robust).
  * Execute a second blind review using Google Gemini 1.5/2.5 Pro API to complement the existing ChatGPT review.
  * Obtain human SME rubric confirmation.
- **Option B: Clean-Sheet Re-Authoring.**
  * Re-author 2 fresh discrete vocabulary/analogy items with full Phase 1 provenance.

*Recommendation:* **Option A**. Both items are classic, unambiguous curriculum benchmarks with existing 12/12 agreement. Gemini confirmation provides full orthogonal consensus.

---

## Decision 4: Resolution of Recorded Reviewer Difficulty Divergences

In the manual ChatGPT blind review preserved in PR #73, two difficulty differences were noted:
1. **`scholarship-y6-vr-001` (Thermometer:Temperature):**
   - Authoring metadata declared: `medium` (40 seconds).
   - Reviewer assessment: `easy` (straightforward functional measurement analogy).
   - *Owner Choice:* Accept Author `medium` (standard for scholarship entrance papers where subtle traps exist), OR update metadata to `easy`.
2. **`scholarship-y6-nr-023` (Notebooks and Pens simultaneous equations):**
   - Authoring metadata declared: `medium` (45 seconds).
   - Reviewer assessment: `challenging` (simultaneous equations $3N+2P=19, 2N+4P=26$ requires multiple algebraic elimination steps under timed conditions).
   - *Owner Choice:* Accept Reviewer `challenging` (reflecting actual Year 6 cognitive load), OR retain Author `medium`.

*Recommendation:*
- Set `vr-001` to `easy` (well within standard Year 6 capability).
- Set `nr-023` to `challenging` (acknowledges multi-step algebraic elimination demand).

---

## Decision 5: Human Approval Authentication Mechanism

To satisfy MindMosaic Standing Rule #8 (`approvedBy`) cryptographically:
- **Option A (Recommended): Git Commit GPG/SSH Signature Verification.**
  * The repository owner signs the git commit containing the approval manifest (`content/publication-approvals/`) using their personal GPG or SSH key.
  * The release gate checks `git verify-commit` against public keys registered in `.github/allowed_signers`.
- **Option B: HMAC-SHA256 Token Signature.**
  * Approval files contain an HMAC-SHA256 signature calculated over `publicationContentHash` using an offline signing key held by the owner.
- **Option C: Signed Manifest with Explicit Checksum Ledger.**
  * Approval files are committed with an explicit SHA-256 ledger signed in the PR description.

*Recommendation:* **Option A**. Uses native Git cryptography, requires no extra secrets infrastructure, and is directly auditable on GitHub.
