# Review and Approval Model

Default pairing is Codex generation -> Claude review or Claude generation -> Codex review. Either may review manual/imported content. The reviewer blind-solves before comparing the supplied key and returns machine-readable evidence.

The owner inspects every disagreement, ambiguity warning, challenging non-computable item, novel visual interaction, Reading passage, Writing task/rubric, flagged originality/accessibility/curriculum item, and the stratified QA sample. Straightforward passing items may receive controlled batch approval with the sample record retained.

Approval is an authenticated database RPC that derives the owner from `auth.uid()` and requires current passing validation and independent review. Agents cannot mint owner approval. Publication rechecks evidence against the exact content hash to reject stale evidence.
