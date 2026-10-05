# Private roadmap drafts

These files contain 182 newly authored AI drafts: 30 AMC-style Year 3 items,
30 AMC-style Year 5 items, 40 ICAS-style Year 5 science items, and 23 NAPLAN-style
spelling items (three Year 3 and twenty Year 5), plus 59 reading questions
across nine new fictional passages (27 Year 3 and 32 Year 5). They are
candidate material, contain private answer keys, and are never imported by
learner routes. No independent review, originality certification, difficulty
calibration, human approval, or publication is claimed.

`npm run content:validate-roadmap-drafts` checks candidate and future runtime
schema compatibility, unique identities, AMC five-option structure, weighted
tiers, integer-answer boundaries, hypothetical AMC selection and declared-key scoring. It also simulates all six NAPLAN full-paper constraints and Year 5 ICAS science
using the authored inventory plus draft fixtures across three seeds. It does not
independently solve answers, certify editorial quality or change runtime availability.

Review each question and explanation independently. Science items share ten
investigation contexts; reviewers must assess reading load, scientific validity,
and whether related questions reveal each other's answers. AMC reviewers must
calibrate progression and division suitability. Replace weak drafts rather than
approving a batch by count alone.

Before ingestion, assign governed blueprint and taxonomy identifiers using the
existing question-factory registries. Preserve the authoring source and AI
identity in provenance. Use the existing ingestion, correctness, originality,
difficulty, staging and publication lifecycle. Do not supply invented review
records or treat this README as a review. Publication requires a named human
reviewer and explicit review confirmation. Validate selection and reporting
against the resulting approved bank before exposing either programme.

Approval of NAPLAN reading/language additions, ICAS retake depth and Level 3 coverage
remain separate authoring work. These draft counts do not complete Phase B or D.
