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
- `PUBLISHED_WRITING_TASKS` in `src/features/writing/task.ts` is empty. A prompt
  joins it only through the human approval (`approvedBy`) step every other piece
  of MindMosaic content goes through, which is separate work.
- Until then every real writing route answers 404 for every task id.

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
