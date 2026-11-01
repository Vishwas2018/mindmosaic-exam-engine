# Year 3 first: human approval review unit

Open [year-3-review.html](year-3-review.html), then fill [year-3-review.csv](year-3-review.csv).

Selection query: staged records bound to the roadmap import, with `question.yearLevel == 3`.
Result: 46 items; 26 with `question.metadata.subject = reading`, followed by 20 with `question.metadata.subject = language_conventions` (spelling). No Year 5 items.

The page groups reading questions by passage, displaying each passage once, then spelling together. Each item shows the prompt, options, declared answer key, explanation, skill and authored difficulty. Human reviewers may see the key. The CSV's five reviewer columns are blank. No approval or publication was recorded; staged files, approval files and publication manifests were checked unchanged before and after generation.

The missing 47th Year 3 source item is Q7's successor `rev-b2778f67c801ed50e66fdba6`, which is not yet staged and is excluded. Its returned review will be handled under the separately requested step C.

CSV columns:

- `questionId`, `contentHash`, `revision`, `sourceManifestHash`: immutable generated bindings. Keep exactly as provided, including the blank sourceManifestHash for staged candidates.
- `correctness`, `originality`, `ageAppropriateness`: use `yes` only after checking; `no` or blank does not pass. The shared parser also accepts `true` or `1` as affirmative (case-insensitive, surrounding whitespace ignored).
- `decision`: `approve`, `reject`, `revise`, or blank (unreviewed). Approval requires all three affirmative checks. Reject, revise and blank decisions create no approval.
- `notes`: optional free text; explain requested changes or rejection here.

After your review, the HTML gives the matching `questions:publish --sheet ... --reviewer ...` command. Do not use `content:record-approvals` for these unpublished candidates. This export does not execute either command.

Evidence: `selection-evidence.json` lists each source ID, candidate ID and exact selected metadata values. `html-verification.json` records the rendered-page checks. These private files stay under ignored reports and are not committed.
