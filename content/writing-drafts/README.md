# Writing prompt drafts

Ten original Year 6 writing prompts, two each of narrative, persuasive,
descriptive, informative and expository writing, each sized for a 15-minute
response.

They are **unsigned AI drafts**. No independent originality review, human
approval or publication is claimed. `review` and `approvedBy` are `null` on every
prompt, and the validator rejects a draft where either is set.

## Why a child cannot reach them

- Nothing under `src/` imports this folder
  (`src/tests/unit/writing-drafts.test.ts` fails if anything does).
- A child is served a prompt only from an approval record under
  `content/publication-approvals/writing-prompts/`, verified by the shared
  approval verifier. There is no hand-kept list of published tasks.
- Until a prompt is approved every real writing route answers 404 for its id.

## How a prompt becomes approved

The same path as a question, with a `writing_prompt` kind of the shared record:

1. `npm run content:review-sheet -- --writing` writes an HTML page and a CSV
   (the same columns as a question sheet) for the drafts, at most 25 rows. The
   CSV carries each prompt's `contentHash` and `revision`; the reviewer's five
   columns start blank.
2. A human reviews each prompt against the three checks (correctness,
   originality, age appropriateness) and records `approve`, `reject` or `revise`.
3. `npm run content:record-approvals -- --sheet <csv> --reviewer "<Full Name>"`
   runs the one batch validator (`validateApprovalBatch`, which calls
   `verifyApprovalRecord`) and writes
   `content/publication-approvals/writing-prompts/<promptId>.json`: the reviewer,
   the fingerprint and a snapshot of the exact prompt. It is committed through a PR.
4. `npm run content:verify-publication` verifies every record and reports a
   `writingPrompts` block. It fails if a record is invalid or if a draft was
   edited after approval (`draft_changed_since_approval`).
5. The server (`src/server/writing/tasks.ts`) loads the records, verifies each
   with the same function and serves the **embedded snapshot**. Any problem
   serves nothing.

Editing a draft means raising its `revision` and getting a fresh review sheet.
Approving the ten is a human decision and has not been done here.

## Originality

Written from scratch. None is copied or paraphrased from a published, prep-book
or past-test prompt. A reviewer must still check that independently, as with any
draft. Replace a weak prompt rather than approving the set by count.

## Checking

`npm run content:validate-writing-drafts` checks the packet against
`src/features/writing/draft.ts`: ten prompts, two per form, unique ids, 15
minutes each, unsigned, and a prompt length that fits the time.

## Marking

Drafts carry no answer and no marking guidance. A parent marks a response
against the rubric in `src/features/writing/rubrics`. There is no AI marking or
AI feedback (`docs/design.md` section 29).
