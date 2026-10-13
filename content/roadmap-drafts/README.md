# Private roadmap drafts

These files contain 199 newly authored AI drafts: 30 AMC-style Year 3 items,
30 AMC-style Year 5 items, 40 ICAS-style Year 5 science items, and 40 NAPLAN-style
spelling items (twenty Year 3 and twenty Year 5), plus 59 reading questions
across nine new fictional passages (27 Year 3 and 32 Year 5). They are
candidate material, contain private answer keys, and are never imported by
learner routes. No independent review, originality certification, difficulty
calibration, human approval, or publication is claimed.

`npm run content:validate-roadmap-drafts` checks candidate and future runtime
schema compatibility, unique identities, AMC five-option structure, weighted
tiers, integer-answer boundaries, answer-position balance and repeating cycles,
hypothetical AMC selection and declared-key scoring. It discovers every draft
JSON packet automatically and checks all packets with single-option answers,
including reading and spelling. Nested strings and property names containing
U+00C3, U+00C2 or U+FFFD are rejected as possible encoding corruption.
It also simulates all six NAPLAN full-paper constraints and Year 5 ICAS science
using the authored inventory plus draft fixtures across three seeds. It does not
independently solve answers, certify editorial quality or change runtime availability.

`npm run content:verify-roadmap-amc-answers` independently computes every AMC
answer with an item-specific code solver. It fails if a key disagrees or if a
multiple-choice result matches anything other than exactly one option.

The October 2026 revision replaced all Year 5 AMC items with new Year 5-level
structures, simplified unsuitable Year 3 counting problems, diversified the ten
science investigations, expanded Year 3 spelling to twenty items, replaced weak
spelling distractors, balanced displayed answer positions and calibrated reading
difficulty labels. The Year 3 quiet-bell passage now explicitly grounds its
whispering inference. These remain unsigned AI-authored candidates requiring the
same independent human review as every other draft.

All seven packets are UTF-8 without a BOM. Year 3 AMC items 026–030 now use
linked constraints, reverse place-value reasoning, a growing pattern with a
tile shortage, working backwards through bus stops, and systematic enumeration
with several conditions. Each is independently computed by the code solver.
Science has zero uses of "All were equal"; Year 3 spelling 006 uses "crasch"
and 008 uses "cossy" as genuine misspellings in place of valid-word distractors.

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
