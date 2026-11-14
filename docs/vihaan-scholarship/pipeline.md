# Vihaan scholarship bank: pilot and controlled expansion

Scope: existing feat/vihaan-scholarship-prep worktree only. No production changes, branch merges, deployment, database mutation, staging or publication. The Year 5 learner uses provisionally Year 6 stretch content; this does not change his profile or imply official Huntingtower/Edutest coverage. No official examination timing, 2028 format or predicted score is asserted.

## Bank blueprint

| Subject / canonical runtime ID | Target | Pilot | Remaining |
|---|---:|---:|---:|
| Mathematics / numeracy | 120 | 6 | 114 |
| Numerical Reasoning / numerical_reasoning | 100 | 5 | 95 |
| Verbal Reasoning / verbal_reasoning | 80 | 4 | 76 |
| Reading Comprehension / reading | 60 | 3 | 57 |
| Written Expression / writing | 40 | 2 | 38 |
| Total | 400 | 20 | 380 |

Mathematics target coverage: fractions/decimals 24, ratios/rates 24, geometry/measurement 24, algebra 20, percentages 16, probability 12. Numerical: series 25, numeric deduction 25, matrices 20, arithmetical reasoning 30. Verbal: analogies 16, sentence logic 16, word relationships 16, vocabulary 16, codes 8, letter patterns 8. Reading: retrieval 10, inference 16, authorial craft 12, context vocabulary 10, argument evaluation 12. Writing: narrative 20, persuasive 20. These are design allocations, not claims of existing content or official exam proportions.

After the pilot decision, remaining drafts would be created in 19 batches of at most 20, with authoring sub-batches of at most 4. Check cumulative quotas and topic coverage before assigning each batch. Rotate setting, reasoning form, vocabulary, text genre and answer positions; reject superficial numerical reskins. Keep linked reading passages together in session assembly. The 20-item pilot itself has key positions a=4, b=6, c=6, d=2; balance deliberately in later drafts rather than shuffling keys without option IDs.

## Pipeline and evidence

1. **Plan:** pin brief version, learner/content levels, curriculum prerequisites, topic quotas, provisional difficulty and intended misconception for each distractor. See content/vihaan-scholarship/pilot-01/authoring-brief.md. Start with mixed easy/medium/challenging diagnostic items; label stretch topics explicitly. No fixed success threshold substitutes for a human pilot decision.
2. **Draft:** create new questions in private content storage, outside public assets and client imports. Optional `node --import tsx scripts/draft-vihaan-qwen.mts --model <installed-qwen-tag>` checks local Ollama inventory and captures exact request, response, installed-model digest and hash. It creates untrusted drafts only and has no hosted-provider fallback. Qwen was unavailable for this pilot. Codex session authorship is recorded honestly as manual_external with unknown exact model identifier and no authenticated provider envelope. Never backfill a legacy_import or live_provider record.
3. **Validate:** `node --import tsx scripts/validate-vihaan-pilot.mts --write-report`. Uses the existing Question schema plus a strict pilot envelope; rejects unknown metadata/options, published status, supplied approvals, visual/media content, unsupported interaction types, invalid keys, mismatched working, unsupported taxonomy and markup/URLs. Eleven numeric solvers parse the entire stem, derive from stated givens, ignore declared solutions, require one matching numeric option and fail closed on unsupported prose. These are local pilot checks, **not factory correctness attestations**. Semantic explanations and nonnumeric keys are not mechanically proved.
4. **Compare:** normalised exact stems and token Jaccard >=0.82 for near-duplicate flags, within the batch and against curated bank stems, generated JSON bank stems and scholarship draft stems. Shared passages are intentional and not counted as duplicate questions. Report names corpus files and hashes. Review paraphrases, template clones, entire passages and writing prompts manually. No external originality search was performed; no global originality or copyright conclusion follows.
5. **Review blind:** reasoning/reading reviewer receives only prompt, passage, options and provisional difficulty. Capture independent working, chosen answer, alternatives, difficulty and problems, then compare with the key. Bind the exact packet and final draft separately. A same-provider separate agent is advisory only under REVIEW_INDEPENDENCE_POLICY.md. Final-revision different-provider review remains pending; disagreement or uncertainty blocks advancement. No automated majority vote resolves ambiguity.
6. **Human pilot decision:** inspect every rendered item, all distractors, age suitability, Australian language, worked steps, bounded originality evidence and writing rubric. Check mathematics not covered by semantic review and sample writing responses. Revisions invalidate stale evidence. Explicitly accept, revise or reject; record human identity and the exact approved revision only through existing authorised mechanisms. Current decision: do not expand yet because challenge and reading breadth need improvement.
7. **Governed intake:** only after readiness, prepare registered blueprints/candidates and use existing questions:ingest/manual-external provenance, structural, correctness and semantic-review orchestration, then authorised approval/publication/assembly/projection workflows. Never synthesise reports, ledger entries, approvedBy or manifests. The pilot envelope is intentionally not a factory intake payload. Writing taxonomy/blueprints need onboarding; writing uses the existing human rubric independently of objective marks. The two essays use the schema's one-mark manual placeholder and award no automatic marks; their six-criterion 1?5 feedback must not be reported as 1/1 objective accuracy or an official scholarship score.
8. **Integrate published content only:** existing server/exam-bank.ts and server/publication-evidence.ts remain the serving authority. getVihaanPracticePlan calls this gateway before filtering programme IDs and topics. selectPractice performs Fisher?Yates selection without replacement; no direct draft loader or new student endpoint was added. It is a tested planning seam, not a completed practice workflow. Curriculum lessons still require their own governed lesson authoring and approval. Mock paper configuration must check section quotas and passage grouping through the existing exam-pattern system; this pilot is not a complete mock.
9. **Record real work:** keep server-authoritative existing session submission/scoring and assessment read-dispatch persistence. summariseProgress is a pure adapter for those verified outcomes; it ignores duplicate response IDs, unanswered items, invalid dates/durations and all writing outcomes, reports topic accuracy/time only for scored responses and recommends weakness only after five distinct questions. No live fetch/persistence wiring or improvement trend is claimed. Old hard-coded 68/82/74 percent scores were removed from the displayed dashboard. Empty history remains empty. Follow-up integration must bind historical item versions/topics, student identity and server timestamps, and distinguish data-read failure from no history.

## ADR-017 and safety boundaries

ADR-017 is adopted policy/design only for a narrowly pinned legacy set. Its legacy admission route is not implemented or authorised by this work. The 20 new session-authored drafts are not those legacy candidates, and have no factory clearance. No legacy refusals, review independence rules, taxonomy registries, manifests, ledgers, publication approvals or production flags were relaxed. Local draft hashes are not D1/D2/D3 factory hashes or signatures. All approvedBy values remain null and all student-serving paths exclude these drafts.

## Reproduce local verification

Use npm.cmd/npx.cmd on Windows when PowerShell blocks npm.ps1.

- `node --import tsx scripts/validate-vihaan-pilot.mts --write-report`
- `npx.cmd vitest run src/tests/features/scholarship-prep/pilot.test.ts`
- `npm.cmd run typecheck`
- `npm.cmd test -- --reporter=dot`

See PASS-FAIL.md for observed results and limitations. No PR is being submitted, and the full repository pre-PR verification gate is not claimed complete.
