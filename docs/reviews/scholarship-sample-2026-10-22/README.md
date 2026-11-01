# Sample release preparation — 22 October 2026

Content recommendation: **APPROVE (advisory)**. Publication readiness: **BLOCKED**.

The subsequent [source-provenance investigation](provenance/README.md) classifies original generation as **unverified for all 12**. It distinguishes historical import declarations from authoring, inventories sibling-worktree records, and proposes an explicit legacy-import migration. No factory records were created and no ingestion was run during that investigation. Generic Claude/human importer declarations must not be used to fill the original-author fields.

The recommendation is bound to the exact 12 revisions in `../scholarship-sample-2026-10-21/approval-manifest.json` at commit `16c5c1ddb22c30c325f8ef03f8845168a9b0fda8`. `advisory-recommendation.json` records its SHA-256 and scope. This is the user-supplied ChatGPT recommendation, not the owner's formal approval or an authorised `approvedBy` signature. No substantive originality concerns were identified; comprehensive plagiarism certification was not performed. VR-001 and NR-023 retain Medium; both independent reviewer disagreements remain advisory evidence.

All twelve current revisions retain satisfactory manual, user-attested reviews. The previous raw reviews, attestation, packets, manifest and hashes are unchanged. No authenticated API provenance is asserted. No question, key, explanation, passage, difficulty label, published bank or existing approval is changed here.

## Preview re-pin and sheets

The active server-only admin loader now uses `src/features/admin-review/releases/scholarship-2026-10-22.json` together with this directory's `status.json`. Both bind the four packet bytes and all 160 item identities to immutable source `45b6cdab335723b2ef822f854ac7e15e556bb7d7`. The historical 6b7d3339 identities, October 18 status/sheets and every `historicalContentHash` remain unchanged. The current report explicitly identifies inherited historical classifications; it does not upgrade them to current factory evidence.

The loader preserves its role gate, packet SHA checks, per-item content/candidate/publication checks and exact-hash approval matching. Tests still require 160 entries, full packet hashes, historical identity preservation, stale-governance refusal and changed-packet refusal. The 12-question selector can load all its entries. The amended maths-014 ingestion identity is updated to its exact reviewed candidate hash; an isolated ingestion test checks stable ID preservation for that snapshot and denies that identity to altered content. Other registry entries are unchanged.

`review-sheet-sample-prestage-blank.csv` binds precisely the 12 current candidate/publication hashes. Every decision is blank. Revision and source fingerprint are deliberately blank because no actual staged provenance exists. **This is a pre-stage worksheet, not a publish-ready approval sheet.** It cannot pass publication validation even if someone fills its decision cells. Generate the final sheet with `content:review-sheet --candidate-ids ...` after the actual staging gates; never copy authoring revision numbers into factory provenance.

`preview-binding.json` hashes the new identities, status and worksheet. Reproduce these preparation artifacts with `npx tsx scripts/scholarship-preview-release.mts`. This does not ingest, stage, approve or publish.

## Remaining governed ingestion blockers

`ingestion-preflight.json` checks the real review-ingestion schema and the generated/review-queue/staged compartments for all 12 IDs. No such lifecycle records exist. Both aggregate raw reviews fail the factory response schema; this does not invalidate their retained advisory content-review value.

Before ingesting, establish genuine generator identity and source prompt/version and bind each exact candidate to its existing blueprint. The manual adapter permits a documented unblueprinted placeholder, but it cannot substitute for an actual blueprint binding at later gates. Do not invent a historical model or generation prompt.

After ingestion and structural/correctness checks, issue actual `questions:review-prompt` artifacts for the judgement candidates. Their responses need a normalisable independent reviewer identity/version, genuine confidence, timestamp, prompt hash/version and actual candidate revision/content/blueprint hashes. The retained aggregate JSON does not supply all these fields. A manually submitted response is supported; authenticated API origin is not mandatory. Do not infer confidence from PASS or manufacture missing provenance. Ingest complete responses with `questions:review-ingest`, then run semantic, originality, difficulty and staging gates. Preserve the advisory Medium decisions without bypassing the difficulty gate.

The existing `ingest-scholarship-drafts.mts` additionally enriches VR-032 and NR-001 with solver sidecars. Preflight verifies their registry identities against that intake shape and confirms unchanged canonical publication content, while reporting the different intake candidate hashes explicitly. The recommendation remains bound to the original manifest candidate hashes. Do not silently relabel an enriched candidate as that exact reviewed revision; resolve this technical binding before intake. No enriched candidates or factory records were written here.

## Access

Branch preview: <https://mindmosaic-exam-engine-git-feat-sc-7148d0-vishwas2018s-projects.vercel.app/admin/review>. A successful preview build of this preparation is required before the hosted preview reflects it. Pass Vercel access protection, sign in with an existing active app administrator account, open `/admin/review`, and select the 12-question sample. Missing Supabase configuration or an unavailable admin approval-history migration is reported explicitly. No account, role or hosted migration is created here. Preview decisions are separate from publication approval; do not record one without explicit authority.

## Safe sequence and human decisions

1. Complete verification of this coordinated preview re-pin and worksheet migration. Keep PR #73 draft; do not merge red CI.
2. Recover genuine ingestion provenance, run the real lifecycle and obtain complete bound review responses where required. Preserve all current questions and old evidence.
3. Generate a publication review sheet from the actual staged records. Ask the owner for formal correctness, originality and age-suitability approval for only these 12 exact manifest-bound revisions, including explicit acceptance of the retained Medium labels. The current advisory recommendation grants none of these signatures.
4. Only after separate explicit authority, record the owner's approval with the governed tooling. Any content change requires new binding/review. Publication/assembly and merge require their own authorised steps; production deployment remains a separate owner-controlled dev-to-main release.

There is no requested approval action for the owner yet: the next input needed is genuine source provenance and complete bound review evidence, not another advisory acceptance. See `VERIFICATION.md` for actual checks and CI results.
